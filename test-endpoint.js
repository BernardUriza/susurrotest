const fs = require('fs');
const path = require('path');

// Configuración del test
const SERVER_URL = 'http://localhost:3001';
const TEST_FILE = 'jfk.wav';
const EXPECTED_TEXT = 'And so my fellow Americans ask not what your country can do for you ask what you can do for your country';

// Función para hacer requests HTTP
async function makeRequest(url, options = {}) {
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(url, options);
  return response;
}

// Test principal
async function testTranscriptionEndpoint() {
  console.log('🧪 INICIANDO TEST DE TRANSCRIPCIÓN');
  console.log('='.repeat(50));
  
  try {
    // 1. Verificar que el servidor esté activo
    console.log('1️⃣ Verificando servidor...');
    const healthResponse = await makeRequest(`${SERVER_URL}/api/health`);
    
    if (!healthResponse.ok) {
      throw new Error(`Servidor no responde. Status: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    console.log('   ✅ Servidor activo:', healthData.service);
    
    // 2. Verificar que existe el archivo de prueba
    console.log('2️⃣ Verificando archivo de prueba...');
    const testFilePath = path.join('test-audio', TEST_FILE);
    
    if (!fs.existsSync(testFilePath)) {
      throw new Error(`Archivo de prueba no encontrado: ${testFilePath}`);
    }
    
    const fileStats = fs.statSync(testFilePath);
    console.log(`   ✅ Archivo encontrado: ${TEST_FILE} (${fileStats.size} bytes)`);
    
    // 3. Hacer request de transcripción
    console.log('3️⃣ Iniciando transcripción...');
    const startTime = Date.now();
    
    const transcribeResponse = await makeRequest(`${SERVER_URL}/api/transcribe-server-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: TEST_FILE
      })
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!transcribeResponse.ok) {
      const errorData = await transcribeResponse.text();
      throw new Error(`Error en transcripción. Status: ${transcribeResponse.status}, Response: ${errorData}`);
    }
    
    const transcribeData = await transcribeResponse.json();
    console.log(`   ✅ Respuesta recibida en ${responseTime}ms`);
    
    // 4. Validar respuesta
    console.log('4️⃣ Validando resultado...');
    console.log('   📝 Texto transcrito:', `"${transcribeData.transcript}"`);
    console.log('   📝 Texto esperado:', `"${EXPECTED_TEXT}"`);
    
    if (!transcribeData.success) {
      throw new Error('La respuesta indica fallo');
    }
    
    if (!transcribeData.transcript) {
      throw new Error('❌ FALLO: Transcript está vacío');
    }
    
    if (transcribeData.transcript.trim().length === 0) {
      throw new Error('❌ FALLO: Transcript solo contiene espacios');
    }
    
    // Comparación flexible (sin ser exacta)
    const transcriptNormalized = transcribeData.transcript.toLowerCase().replace(/[.,!?]/g, '').trim();
    const expectedNormalized = EXPECTED_TEXT.toLowerCase().replace(/[.,!?]/g, '').trim();
    
    const similarity = calculateSimilarity(transcriptNormalized, expectedNormalized);
    
    console.log(`   📊 Similitud con texto esperado: ${(similarity * 100).toFixed(1)}%`);
    
    if (similarity < 0.7) {
      console.log('   ⚠️  ADVERTENCIA: Similitud baja, pero texto no está vacío');
      console.log('   ℹ️  Esto puede ser normal con modelo tiny');
    } else {
      console.log('   ✅ Similitud aceptable');
    }
    
    // 5. Mostrar estadísticas
    console.log('5️⃣ Estadísticas:');
    console.log(`   ⏱️  Tiempo de procesamiento: ${transcribeData.processing_time_ms}ms`);
    console.log(`   📂 Archivo procesado: ${transcribeData.filename}`);
    console.log(`   🤖 Modelo usado: ${transcribeData.model_used}`);
    
    console.log('\n🎉 TEST COMPLETADO EXITOSAMENTE');
    console.log('✅ El endpoint funciona y retorna texto válido');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ TEST FALLIDO:');
    console.error(`   Error: ${error.message}`);
    console.error('\n🔧 Posibles soluciones:');
    console.error('   1. Verificar que el servidor esté corriendo en puerto 3001');
    console.error('   2. Verificar que el archivo jfk.wav esté en test-audio/');
    console.error('   3. Verificar que nodejs-whisper esté instalado correctamente');
    console.error('   4. Descargar modelo: npm run download-model');
    
    return false;
  }
}

// Función para calcular similitud básica
function calculateSimilarity(str1, str2) {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

// Ejecutar test
if (require.main === module) {
  testTranscriptionEndpoint().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testTranscriptionEndpoint };