#!/bin/bash

# integrate-nextjs.sh - Script para integrar SusurroTest en un proyecto Next.js como microservicio
# Uso: ./integrate-nextjs.sh [--repo-url URL] [--service-name NOMBRE]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Valores por defecto
REPO_URL="https://github.com/tu-usuario/susurrotest.git"
SERVICE_NAME="whisper-service"
APPS_DIR="apps"

# Parsear argumentos
while [[ $# -gt 0 ]]; do
  case $1 in
    --repo-url)
      REPO_URL="$2"
      shift 2
      ;;
    --service-name)
      SERVICE_NAME="$2"
      shift 2
      ;;
    --help)
      echo "Uso: $0 [--repo-url URL] [--service-name NOMBRE]"
      echo "  --repo-url URL       URL del repositorio de SusurroTest (default: $REPO_URL)"
      echo "  --service-name NAME  Nombre del servicio (default: $SERVICE_NAME)"
      exit 0
      ;;
    *)
      echo "Argumento desconocido: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}=== Integración de SusurroTest en proyecto Next.js ===${NC}\n"

# Verificar si estamos en un proyecto Next.js
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: No se encontró package.json en el directorio actual${NC}"
  echo "Por favor, ejecuta este script desde la raíz de tu proyecto Next.js"
  exit 1
fi

# Verificar si es un proyecto Next.js
if ! grep -q "next" package.json; then
  echo -e "${YELLOW}Advertencia: No se detectó Next.js en package.json${NC}"
  read -p "¿Deseas continuar de todos modos? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Crear estructura de monorepo si no existe
echo -e "${GREEN}1. Creando estructura de monorepo...${NC}"
mkdir -p "$APPS_DIR"
mkdir -p "packages/shared"

# Verificar si ya existe el servicio
if [ -d "$APPS_DIR/$SERVICE_NAME" ]; then
  echo -e "${YELLOW}El servicio $SERVICE_NAME ya existe${NC}"
  read -p "¿Deseas sobrescribirlo? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
  rm -rf "$APPS_DIR/$SERVICE_NAME"
fi

# Clonar el repositorio
echo -e "${GREEN}2. Clonando SusurroTest...${NC}"
git clone "$REPO_URL" "$APPS_DIR/$SERVICE_NAME"

# Cambiar al directorio del servicio
cd "$APPS_DIR/$SERVICE_NAME"

# Verificar e instalar dependencias del sistema
echo -e "${GREEN}3. Verificando dependencias del sistema...${NC}"
MISSING_DEPS=()

command -v ffmpeg >/dev/null 2>&1 || MISSING_DEPS+=("ffmpeg")
command -v cmake >/dev/null 2>&1 || MISSING_DEPS+=("cmake")
command -v make >/dev/null 2>&1 || MISSING_DEPS+=("build-essential")

if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
  echo -e "${YELLOW}Dependencias faltantes: ${MISSING_DEPS[*]}${NC}"
  echo "Para instalarlas, ejecuta:"
  echo -e "${BLUE}sudo apt-get update && sudo apt-get install -y ${MISSING_DEPS[*]}${NC}"
  echo
  read -p "¿Deseas intentar instalarlas ahora? (requiere sudo) (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo apt-get update && sudo apt-get install -y "${MISSING_DEPS[@]}"
  else
    echo -e "${RED}Por favor, instala las dependencias manualmente antes de continuar${NC}"
    exit 1
  fi
fi

# Instalar y configurar el servicio
echo -e "${GREEN}4. Instalando y configurando el servicio Whisper...${NC}"
npm run setup

# Volver a la raíz del proyecto
cd ../..

# Actualizar package.json principal si no tiene workspaces
echo -e "${GREEN}5. Configurando el monorepo...${NC}"
if ! grep -q "workspaces" package.json; then
  echo -e "${YELLOW}Agregando configuración de workspaces a package.json${NC}"
  
  # Crear backup
  cp package.json package.json.backup
  
  # Actualizar package.json usando Node.js
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Agregar workspaces
    pkg.workspaces = pkg.workspaces || ['apps/*', 'packages/*'];
    
    // Agregar scripts
    pkg.scripts = pkg.scripts || {};
    pkg.scripts['dev:all'] = 'concurrently \"npm run dev\" \"npm run dev:whisper\"';
    pkg.scripts['dev:whisper'] = 'cd $APPS_DIR/$SERVICE_NAME && npm run dev';
    pkg.scripts['setup:whisper'] = 'cd $APPS_DIR/$SERVICE_NAME && npm run setup';
    pkg.scripts['check:whisper'] = 'cd $APPS_DIR/$SERVICE_NAME && npm run check-deps';
    
    // Agregar concurrently si no existe
    pkg.devDependencies = pkg.devDependencies || {};
    if (!pkg.devDependencies.concurrently) {
      pkg.devDependencies.concurrently = '^7.6.0';
    }
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    console.log('package.json actualizado exitosamente');
  "
  
  # Instalar concurrently
  npm install
fi

# Crear archivo .env.local si no existe
echo -e "${GREEN}6. Configurando variables de entorno...${NC}"
if [ ! -f ".env.local" ]; then
  echo "NEXT_PUBLIC_WHISPER_API_URL=http://localhost:3001" >> .env.local
  echo -e "${GREEN}Creado .env.local con NEXT_PUBLIC_WHISPER_API_URL${NC}"
else
  if ! grep -q "NEXT_PUBLIC_WHISPER_API_URL" .env.local; then
    echo "NEXT_PUBLIC_WHISPER_API_URL=http://localhost:3001" >> .env.local
    echo -e "${GREEN}Agregado NEXT_PUBLIC_WHISPER_API_URL a .env.local${NC}"
  fi
fi

# Crear cliente de ejemplo para Next.js
echo -e "${GREEN}7. Creando cliente de ejemplo...${NC}"
mkdir -p lib
cat > lib/whisper-client.js << 'EOF'
// Cliente para el servicio de transcripción Whisper

const WHISPER_API_URL = process.env.NEXT_PUBLIC_WHISPER_API_URL || 'http://localhost:3001';

export async function transcribeAudio(file) {
  const formData = new FormData();
  formData.append('audio', file);
  
  const response = await fetch(`${WHISPER_API_URL}/api/transcribe-upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Error al transcribir el audio');
  }
  
  return response.json();
}

export async function transcribeServerFile(filename) {
  const response = await fetch(`${WHISPER_API_URL}/api/transcribe-server-file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename }),
  });
  
  if (!response.ok) {
    throw new Error('Error al transcribir el archivo');
  }
  
  return response.json();
}

export async function getAvailableFiles() {
  const response = await fetch(`${WHISPER_API_URL}/api/files`);
  
  if (!response.ok) {
    throw new Error('Error al obtener archivos');
  }
  
  return response.json();
}

export async function checkHealth() {
  const response = await fetch(`${WHISPER_API_URL}/api/health`);
  
  if (!response.ok) {
    throw new Error('El servicio Whisper no está disponible');
  }
  
  return response.json();
}
EOF

# Crear componente de ejemplo
echo -e "${GREEN}8. Creando componente React de ejemplo...${NC}"
mkdir -p components
cat > components/AudioTranscriber.jsx << 'EOF'
import { useState } from 'react';
import { transcribeAudio } from '../lib/whisper-client';

export default function AudioTranscriber() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setTranscript('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Por favor selecciona un archivo de audio');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await transcribeAudio(file);
      setTranscript(result.transcript || result.raw_result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="audio-transcriber">
      <h2>Transcriptor de Audio</h2>
      
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          disabled={loading}
        />
        
        <button type="submit" disabled={!file || loading}>
          {loading ? 'Transcribiendo...' : 'Transcribir'}
        </button>
      </form>

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      {transcript && (
        <div className="transcript">
          <h3>Transcripción:</h3>
          <pre>{transcript}</pre>
        </div>
      )}
    </div>
  );
}
EOF

# Crear archivo de documentación
echo -e "${GREEN}9. Creando documentación...${NC}"
cat > "$APPS_DIR/$SERVICE_NAME/INTEGRATION.md" << EOF
# Integración con Next.js

Este servicio ha sido integrado exitosamente en tu proyecto Next.js.

## Estructura del proyecto

\`\`\`
.
├── $APPS_DIR/
│   └── $SERVICE_NAME/        # Servicio de transcripción Whisper
├── lib/
│   └── whisper-client.js     # Cliente JavaScript para el servicio
├── components/
│   └── AudioTranscriber.jsx  # Componente React de ejemplo
└── .env.local               # Variables de entorno
\`\`\`

## Uso

### Iniciar ambos servicios:
\`\`\`bash
npm run dev:all
\`\`\`

### Iniciar solo el servicio Whisper:
\`\`\`bash
npm run dev:whisper
\`\`\`

### Verificar dependencias del servicio:
\`\`\`bash
npm run check:whisper
\`\`\`

## Ejemplo de uso en tu aplicación:

\`\`\`jsx
import AudioTranscriber from '../components/AudioTranscriber';

export default function Home() {
  return (
    <div>
      <h1>Mi App con Transcripción de Audio</h1>
      <AudioTranscriber />
    </div>
  );
}
\`\`\`

## API Endpoints

- \`GET  http://localhost:3001/api/health\` - Verificar estado
- \`GET  http://localhost:3001/api/files\` - Listar archivos
- \`POST http://localhost:3001/api/transcribe-upload\` - Subir y transcribir
- \`POST http://localhost:3001/api/transcribe-server-file\` - Transcribir archivo existente

## Solución de problemas

Si el servicio no inicia, verifica:
1. Las dependencias del sistema: \`npm run check:whisper\`
2. Que el puerto 3001 esté disponible
3. Los logs en la consola del servicio
EOF

# Resumen final
echo -e "\n${GREEN}=== ¡Integración completada exitosamente! ===${NC}\n"
echo -e "📁 Servicio instalado en: ${BLUE}$APPS_DIR/$SERVICE_NAME${NC}"
echo -e "📝 Cliente JavaScript en: ${BLUE}lib/whisper-client.js${NC}"
echo -e "🧩 Componente React en: ${BLUE}components/AudioTranscriber.jsx${NC}"
echo -e "📖 Documentación en: ${BLUE}$APPS_DIR/$SERVICE_NAME/INTEGRATION.md${NC}"
echo
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "1. Iniciar ambos servicios: ${BLUE}npm run dev:all${NC}"
echo "2. Importar y usar el componente AudioTranscriber en tus páginas"
echo "3. Personalizar el componente según tus necesidades"
echo
echo -e "${GREEN}¡Listo para usar!${NC}"