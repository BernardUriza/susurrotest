# 🎙️ Whisper Transcription Microservice

> **Microservicio profesional de transcripción de audio** basado en OpenAI Whisper, diseñado para integrarse sin fricción en cualquier arquitectura moderna.

[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0-brightgreen)](https://nodejs.org)
[![Express](https://img.shields.io/badge/express-4.18-blue)](https://expressjs.com)
[![Whisper](https://img.shields.io/badge/whisper-nodejs--whisper-orange)](https://github.com/nodejs-whisper/nodejs-whisper)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🚀 ¿Por qué este microservicio?

Este no es solo otro servidor de transcripción. Es un **microservicio production-ready** diseñado desde cero para:

- 🔌 **Integración Plug & Play**: Funciona con Next.js, React, Vue, Angular o cualquier stack
- 🏗️ **Arquitectura de Microservicios**: Perfecto para monorepos y arquitecturas distribuidas
- 🛠️ **Autoconfiguración**: Scripts inteligentes que detectan y configuran dependencias
- 📦 **Zero Config**: Funciona out-of-the-box con configuración sensata
- 🔄 **API RESTful**: Endpoints claros y bien documentados
- 🐳 **Docker Ready**: Preparado para containerización y orquestación

## 📋 Características

- ✅ Transcripción de audio local con Whisper C++
- ✅ Soporte para múltiples formatos de audio vía FFmpeg
- ✅ API REST completa con health checks
- ✅ Gestión automática de dependencias
- ✅ Scripts de integración para frameworks populares
- ✅ Modo desarrollo con hot-reload
- ✅ Logs estructurados con timestamps

## 🏛️ Arquitectura del Microservicio

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client App    │────▶│  Whisper μService│────▶│  Whisper C++   │
│ (Next.js, etc)  │◀────│   (Express.js)   │◀────│    Binary       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │   FFmpeg    │
                        └─────────────┘
```

## 🚦 Inicio Rápido

### Como servicio standalone

```bash
# Clonar y configurar
git clone https://github.com/tu-usuario/whisper-transcription-microservice.git
cd whisper-transcription-microservice

# Instalación automática completa
npm run setup

# Iniciar el microservicio
npm start
```

### Como parte de tu arquitectura

```bash
# Desde tu proyecto principal
curl -sSL https://raw.githubusercontent.com/tu-usuario/whisper-transcription-microservice/main/integrate-nextjs.sh | bash
```

## 🔧 Requisitos del Sistema

### Mínimos
- Node.js 14+ 
- 4GB RAM
- 2 CPU cores

### Recomendados para producción
- Node.js 18+
- 8GB RAM
- 4+ CPU cores
- Ubuntu 20.04+ / macOS 12+

### Dependencias del sistema
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y ffmpeg cmake build-essential

# macOS
brew install ffmpeg cmake
```

## 📡 API Reference

### Endpoints

#### `GET /api/health`
Health check del microservicio

**Response:**
```json
{
  "status": "healthy",
  "service": "whisper-transcription-microservice",
  "version": "1.0.0",
  "uptime": 3600
}
```

#### `POST /api/transcribe-upload`
Transcribe archivo subido

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `audio` (file)

**Response:**
```json
{
  "success": true,
  "transcript": "Texto transcrito...",
  "processing_time_ms": 1234,
  "model_used": "base",
  "timestamp": "2025-01-12T10:00:00.000Z"
}
```

#### `POST /api/transcribe-server-file`
Transcribe archivo existente en el servidor

**Request:**
```json
{
  "filename": "audio.wav"
}
```

#### `GET /api/files`
Lista archivos disponibles para transcripción

## 🏗️ Integración en Arquitecturas Modernas

### Next.js App Router

```typescript
// app/lib/whisper-service.ts
export class WhisperService {
  private baseUrl = process.env.WHISPER_SERVICE_URL || 'http://localhost:3001';
  
  async transcribe(file: File): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('audio', file);
    
    const response = await fetch(`${this.baseUrl}/api/transcribe-upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Transcription failed');
    return response.json();
  }
}
```

### Monorepo con Turborepo

```json
// turbo.json
{
  "pipeline": {
    "dev": {
      "dependsOn": ["^build"],
      "cache": false
    },
    "whisper-service#dev": {
      "dependsOn": ["@whisper/service#check-deps"],
      "outputs": []
    }
  }
}
```

### Docker Compose para producción

```yaml
version: '3.8'

services:
  whisper:
    build: ./services/whisper
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - whisper-models:/app/models
      - whisper-uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - WHISPER_MODEL=base
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  whisper-models:
  whisper-uploads:
```

## 🔮 Roadmap: Modos Híbridos de Respuesta

### Próximamente en v2.0

#### 🌊 **Streaming Mode**
Transcripción en tiempo real con WebSockets
```javascript
// Futuro API
const stream = whisper.streamTranscribe(audioStream);
stream.on('partial', (text) => console.log('Parcial:', text));
stream.on('final', (text) => console.log('Final:', text));
```

#### 🔄 **Webhook Mode**
Procesamiento asíncrono con callbacks
```javascript
// Futuro API
await whisper.transcribeAsync(file, {
  webhookUrl: 'https://tu-app.com/webhook/transcription',
  webhookHeaders: { 'X-API-Key': 'secret' }
});
```

#### 🎯 **Queue Mode**
Integración con sistemas de colas (RabbitMQ, Redis)
```javascript
// Futuro API
await whisper.queueTranscription(file, {
  queue: 'transcriptions',
  priority: 'high'
});
```

#### 🤖 **Hybrid AI Mode**
Combinación de Whisper local + APIs cloud para optimización
```javascript
// Futuro API
await whisper.transcribeHybrid(file, {
  localFirst: true,
  fallbackToCloud: true,
  providers: ['whisper-local', 'openai', 'google']
});
```

## 🌐 Filosofía: Integrable por Diseño

Este microservicio está construido con una filosofía clara: **ser integrable en cualquier lugar**. No es solo un servidor de transcripción, es un componente diseñado para adaptarse a tu arquitectura, no al revés.

### 🔌 Integración Universal

- **Arquitectura Agnóstica**: Funciona igual de bien con Next.js, Vue, Angular, React Native, Flutter o vanilla JavaScript
- **Protocol Flexible**: REST hoy, GraphQL mañana, gRPC cuando lo necesites
- **Deployment Anywhere**: Desde tu laptop hasta Kubernetes, pasando por Vercel, Railway o tu Raspberry Pi
- **Offline First**: Diseñado para funcionar sin internet, perfecto para aplicaciones edge

### 📱 Offline & Edge Computing (Próximamente)

```javascript
// Futuro: Modo offline para aplicaciones móviles
const whisper = new WhisperOffline({
  modelPath: './models/whisper-tiny.onnx',
  runtime: 'webassembly' // o 'tensorflow-lite'
});

// Transcripción 100% local en el dispositivo
const result = await whisper.transcribeOffline(audioBlob);
```

### 🔄 Multi-Engine Support (Roadmap v3.0)

El futuro es multi-motor. Podrás elegir el backend que mejor se adapte a tu caso de uso:

```javascript
// Configuración futura multi-engine
const whisperService = new WhisperService({
  engines: [
    {
      name: 'whisper-cpp',
      priority: 1,
      platforms: ['server', 'desktop']
    },
    {
      name: 'transformers-js',
      priority: 2,
      platforms: ['browser', 'mobile']
    },
    {
      name: 'huggingface-api',
      priority: 3,
      platforms: ['all'],
      requiresInternet: true
    }
  ],
  fallbackStrategy: 'next-available'
});
```

### 🌟 Casos de Uso Futuros

- **PWAs Offline**: Transcripción sin conexión en Progressive Web Apps
- **React Native**: SDK nativo para apps móviles
- **Electron Apps**: Integración directa para aplicaciones desktop
- **IoT Devices**: Versión ligera para dispositivos embebidos
- **Browser Extension**: Transcripción directa en el navegador
- **CLI Tool**: Herramienta de línea de comandos global

## 📊 Benchmarks

| Modelo | Velocidad | Precisión | RAM | Caso de uso |
|--------|-----------|-----------|-----|--------------|
| tiny   | 10x       | ★★☆☆☆     | 1GB | Prototipos |
| base   | 7x        | ★★★☆☆     | 1GB | Desarrollo |
| small  | 4x        | ★★★★☆     | 2GB | Producción |
| medium | 2x        | ★★★★★     | 5GB | Alta precisión |

## 🛠️ Configuración Avanzada

### Variables de entorno

```bash
# .env
PORT=3001
WHISPER_MODEL=base
MAX_FILE_SIZE=100MB
ENABLE_CORS=true
LOG_LEVEL=info
```

### Configuración de modelos

```javascript
// config/whisper.config.js
module.exports = {
  model: process.env.WHISPER_MODEL || 'base',
  language: 'auto',
  threads: 4,
  processors: 1,
  translate: false,
  timestamps: true
};
```

## 🔐 Seguridad

- ✅ Validación de tipos de archivo
- ✅ Límites de tamaño configurables
- ✅ Sanitización de nombres de archivo
- ✅ CORS configurable
- ✅ Rate limiting ready

## 📦 Despliegue

### Railway/Render
```bash
# railway.json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run setup"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: whisper-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: whisper
  template:
    metadata:
      labels:
        app: whisper
    spec:
      containers:
      - name: whisper
        image: whisper-service:latest
        ports:
        - containerPort: 3001
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
```

## 🚀 Por qué Open Source

Este proyecto es **100% open source** porque creemos que la tecnología de transcripción debe ser accesible para todos. Al ser código abierto:

- **Transparencia Total**: Sabes exactamente qué hace tu servicio de transcripción
- **Sin Vendor Lock-in**: No dependes de APIs propietarias o servicios de pago
- **Comunidad Activa**: Miles de desarrolladores mejorando el código
- **Adaptable**: Modifícalo para tus necesidades específicas
- **Gratis para Siempre**: Sin sorpresas, sin límites artificiales

### 🌱 Evolución Continua

Este microservicio está diseñado para crecer y adaptarse:

1. **Hoy**: REST API con Whisper C++
2. **Mañana**: WebSockets, GraphQL, gRPC
3. **Futuro**: WebAssembly, Edge Computing, AI distribuida

## 🤝 Contribuir

Este microservicio está diseñado para ser extendido. Algunas áreas donde puedes contribuir:

- 🌍 Soporte para más idiomas
- 🔌 Adaptadores para más frameworks
- 📊 Métricas y observabilidad
- 🧪 Más tests automatizados
- 📚 Documentación y ejemplos
- 🔧 Optimizaciones de rendimiento
- 🌐 Modo offline para navegadores
- 📱 SDKs para plataformas móviles

## 📜 Licencia

MIT License - Úsalo como quieras, donde quieras.

## 🙏 Agradecimientos

- OpenAI Whisper - Por el modelo de transcripción
- nodejs-whisper - Por la integración con Node.js
- La comunidad open source - Por hacer esto posible

---

<div align="center">
  <p>Hecho con ❤️ para la comunidad de desarrolladores</p>
  <p>¿Te gusta? ⭐ Dale una estrella!</p>
</div>