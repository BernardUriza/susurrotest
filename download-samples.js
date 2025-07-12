const https = require('https');
const fs = require('fs');
const path = require('path');

const JFK_URL = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav';
const JFK_FILE = 'jfk.wav';

function downloadJFKSample() {
  return new Promise((resolve, reject) => {
    const filePath = path.join('test-audio', JFK_FILE);
    
    // Crear directorio si no existe
    if (!fs.existsSync('test-audio')) {
      fs.mkdirSync('test-audio', { recursive: true });
    }
    
    // Verificar si ya existe
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${JFK_FILE} ya existe`);
      resolve(filePath);
      return;
    }
    
    console.log(`📥 Descargando ${JFK_FILE}...`);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(JFK_URL, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Error HTTP: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ ${JFK_FILE} descargado exitosamente`);
        resolve(filePath);
      });
      
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Limpiar archivo parcial
      reject(err);
    });
  });
}

if (require.main === module) {
  downloadJFKSample().catch(console.error);
}

module.exports = { downloadJFKSample };