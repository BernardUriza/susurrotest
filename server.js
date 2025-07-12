const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { pipeline, env } = require('@xenova/transformers');
const WaveFile = require('wavefile').WaveFile;

// Configurar caché local para modelos
env.cacheDir = './models';
env.localURL = './models';

const app = express();
const PORT = 3001;

// Variable para almacenar el pipeline
let transcriber = null;

// Inicializar el modelo de Whisper
async function initializeModel() {
  try {
    console.log('Inicializando modelo Whisper...');
    transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
    console.log('Modelo Whisper cargado exitosamente');
  } catch (error) {
    console.error('Error al cargar el modelo:', error);
  }
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuración de multer para archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de audio'), false);
    }
  }
});

// Crear directorios necesarios
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDirectoryExists('./uploads');
ensureDirectoryExists('./test-audio');
ensureDirectoryExists('./models');

// Función para convertir WAV a formato compatible
async function prepareAudioFile(audioPath) {
  try {
    const audioData = fs.readFileSync(audioPath);
    const wav = new WaveFile(audioData);
    
    // Convertir a 16kHz mono si es necesario
    wav.toSampleRate(16000);
    wav.toMono();
    
    // Obtener datos de audio como Float32Array
    const samples = wav.getSamples(true, Float32Array);
    
    return samples[0]; // Retornar el canal mono
  } catch (error) {
    console.error('Error al procesar archivo de audio:', error);
    throw error;
  }
}

// ENDPOINT 1: Transcribir archivo existente en servidor
app.post('/api/transcribe-server-file', async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({ 
        error: 'Se requiere el nombre del archivo',
        example: { "filename": "sample.wav" }
      });
    }

    if (!transcriber) {
      return res.status(503).json({ 
        error: 'El modelo de Whisper aún se está cargando. Por favor, intenta de nuevo en unos segundos.'
      });
    }

    const audioPath = path.join(__dirname, 'test-audio', filename);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ 
        error: 'Archivo no encontrado',
        path: audioPath,
        available_files: fs.readdirSync(path.join(__dirname, 'test-audio'))
      });
    }

    console.log(`Procesando archivo: ${audioPath}`);
    
    const startTime = Date.now();
    
    // Preparar audio y transcribir
    const audioData = await prepareAudioFile(audioPath);
    const result = await transcriber(audioData, {
      return_timestamps: true,
      chunk_length_s: 30,
      language: 'english',
      task: 'transcribe'
    });

    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      filename: filename,
      transcript: result.text,
      processing_time_ms: processingTime,
      audio_path: audioPath,
      model_used: 'whisper-tiny.en',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en transcripción:', error);
    res.status(500).json({
      error: 'Error al transcribir el archivo',
      details: error.message,
      filename: req.body.filename
    });
  }
});

// ENDPOINT 2: Subir y transcribir archivo
app.post('/api/transcribe-upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No se ha subido ningún archivo de audio' 
      });
    }

    if (!transcriber) {
      return res.status(503).json({ 
        error: 'El modelo de Whisper aún se está cargando. Por favor, intenta de nuevo en unos segundos.'
      });
    }

    const audioPath = req.file.path;
    console.log(`Archivo recibido: ${req.file.originalname}`);
    console.log(`Guardado como: ${audioPath}`);

    const startTime = Date.now();
    
    // Preparar audio y transcribir
    const audioData = await prepareAudioFile(audioPath);
    const result = await transcriber(audioData, {
      return_timestamps: true,
      chunk_length_s: 30,
      language: 'english',
      task: 'transcribe'
    });

    const processingTime = Date.now() - startTime;

    // Limpiar archivo después de procesar (opcional)
    // fs.unlinkSync(audioPath);

    res.json({
      success: true,
      original_filename: req.file.originalname,
      saved_filename: req.file.filename,
      transcript: result.text,
      processing_time_ms: processingTime,
      file_size_mb: (req.file.size / 1024 / 1024).toFixed(2),
      model_used: 'whisper-tiny.en',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al procesar archivo:', error);
    
    // Limpiar archivo en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      error: 'Error al procesar el archivo de audio',
      details: error.message
    });
  }
});

// ENDPOINT 3: Listar archivos disponibles
app.get('/api/list-files', (req, res) => {
  try {
    const testAudioDir = path.join(__dirname, 'test-audio');
    const files = fs.readdirSync(testAudioDir)
      .filter(file => file.endsWith('.wav') || file.endsWith('.mp3'))
      .map(file => {
        const filePath = path.join(testAudioDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size_mb: (stats.size / 1024 / 1024).toFixed(2),
          modified: stats.mtime
        };
      });

    res.json({
      success: true,
      directory: testAudioDir,
      files: files,
      count: files.length
    });

  } catch (error) {
    res.status(500).json({
      error: 'Error al listar archivos',
      details: error.message
    });
  }
});

// ENDPOINT 4: Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SusurroTest Server',
    version: '1.0.0',
    model: 'whisper-tiny.en',
    model_loaded: transcriber !== null,
    endpoints: [
      'POST /api/transcribe-server-file',
      'POST /api/transcribe-upload',
      'GET /api/list-files',
      'GET /api/health'
    ],
    timestamp: new Date().toISOString()
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'Servidor SusurroTest está funcionando',
    docs: 'Usa /api/health para ver los endpoints disponibles',
    model_status: transcriber ? 'Modelo cargado' : 'Modelo cargando...'
  });
});

// Inicializar modelo y luego iniciar servidor
initializeModel().then(() => {
  app.listen(PORT, () => {
    console.log('=================================');
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
    console.log('=================================');
    console.log('Endpoints disponibles:');
    console.log('- POST /api/transcribe-server-file');
    console.log('- POST /api/transcribe-upload');
    console.log('- GET /api/list-files');
    console.log('- GET /api/health');
    console.log('=================================');
  });
});

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
  console.error('Error no manejado:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Excepción no capturada:', error);
  process.exit(1);
});