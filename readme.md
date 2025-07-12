# SusurroTest - Whisper Audio a Texto

## Descripción

Proyecto de prueba para implementar conversión de audio a texto usando `nodejs-whisper`. Incluye un servidor Express completo con múltiples endpoints para transcribir archivos de audio WAV.

## Requisitos previos

- Node.js (versión 14.0 o superior)
- npm (versión 6.0 o superior)

## Estructura del proyecto

```
susurrotest/
├── package.json
├── server.js
├── test-audio/
│   └── sample.wav (archivo de prueba)
├── uploads/
│   └── (carpeta para archivos subidos)
├── postman/
│   └── susurrotest.postman_collection.json
├── README.md
├── .gitignore
└── git-push.sh (script para subir a GitHub)
```

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/susurrotest.git

# Navegar al directorio del proyecto
cd susurrotest

# Instalar dependencias
npm install

# Descargar modelo Whisper
npm run download-model
```

## Uso

```bash
# Iniciar servidor en modo producción
npm start

# Iniciar servidor en modo desarrollo (con nodemon)
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

## Endpoints disponibles

- `GET /api/health` - Verificar estado del servidor
- `GET /api/list-files` - Listar archivos de audio disponibles
- `POST /api/transcribe-server-file` - Transcribir archivo existente en el servidor
- `POST /api/transcribe-upload` - Subir y transcribir un archivo de audio

## Configuración del modelo

Antes de usar el servidor, debes descargar el modelo Whisper:

```bash
npm run download-model
```

Esto descargará el modelo `tiny.en` que es el más ligero y rápido.

## Pruebas con Postman

1. Importa la colección de Postman desde `postman/susurrotest.postman_collection.json`
2. Prueba los endpoints en este orden:
   - Health Check
   - Listar Archivos
   - Transcribir Archivo del Servidor (requiere sample.wav)
   - Subir y Transcribir Archivo

## Notas importantes

- Asegúrate de colocar un archivo `sample.wav` en la carpeta `test-audio/` para probar
- El servidor procesa archivos de audio en formato WAV
- Los archivos subidos se guardan en la carpeta `uploads/`
- El modelo `tiny.en` está optimizado para inglés

## Subir a GitHub

Para subir este proyecto a tu repositorio de GitHub:

```bash
# Crear repositorio en GitHub primero, luego:
./git-push.sh https://github.com/tu-usuario/susurrotest.git
```

## Contribuir

1. Fork el proyecto
2. Crea tu rama de características (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Autor

- Tu nombre - [@tu-usuario](https://github.com/tu-usuario)

## Agradecimientos

- [Lista cualquier recurso, librería o persona que quieras agradecer]