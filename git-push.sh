#!/bin/bash

# Script para subir el proyecto SusurroTest a GitHub

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Script de publicación para SusurroTest ===${NC}"
echo ""

# Verificar si estamos en un repositorio git
if [ ! -d .git ]; then
    echo -e "${RED}Error: No se encontró repositorio Git${NC}"
    echo "Ejecuta 'git init' primero"
    exit 1
fi

# Verificar si se proporcionó URL del repositorio
if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes proporcionar la URL del repositorio de GitHub${NC}"
    echo ""
    echo "Uso: ./git-push.sh https://github.com/BernardUriza/susurrotest.git"
    echo ""
    echo "Ejemplo:"
    echo "  ./git-push.sh https://github.com/BernardUriza/susurrotest.git"
    exit 1
fi

REPO_URL=$1

echo -e "${GREEN}1. Añadiendo archivos al repositorio...${NC}"
git add .

echo -e "${GREEN}2. Creando commit inicial...${NC}"
git commit -m "🎙️ Initial commit: SusurroTest - Audio transcription server with nodejs-whisper

- Express server with multiple endpoints
- Audio file upload and transcription
- Support for WAV files
- Postman collection included
- Ready to deploy"

echo -e "${GREEN}3. Renombrando rama principal a 'main'...${NC}"
git branch -M main

echo -e "${GREEN}4. Añadiendo repositorio remoto...${NC}"
git remote add origin $REPO_URL

echo -e "${GREEN}5. Subiendo código a GitHub...${NC}"
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ ¡Proyecto subido exitosamente!${NC}"
    echo ""
    echo "Tu proyecto está ahora disponible en:"
    echo -e "${YELLOW}$REPO_URL${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Clona el repositorio en otra ubicación"
    echo "2. Ejecuta 'npm install'"
    echo "3. Ejecuta 'npm run download-model'"
    echo "4. Añade un archivo sample.wav en test-audio/"
    echo "5. Ejecuta 'npm start'"
else
    echo ""
    echo -e "${RED}❌ Error al subir el proyecto${NC}"
    echo ""
    echo "Posibles soluciones:"
    echo "1. Verifica que el repositorio existe en GitHub"
    echo "2. Verifica tus credenciales de Git"
    echo "3. Asegúrate de tener permisos para escribir en el repositorio"
    echo ""
    echo "Si el repositorio ya tiene contenido, puedes forzar el push con:"
    echo -e "${YELLOW}git push -u origin main --force${NC}"
fi