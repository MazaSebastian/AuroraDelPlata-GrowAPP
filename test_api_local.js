// Script para probar las funciones API localmente
// Ejecutar: node test_api_local.js

const http = require('http');
const https = require('https');

function testEndpoint(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data.substring(0, 200) + '...' });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('🧪 Probando endpoints de notificaciones push...\n');
  
  const baseUrl = 'https://crop-crm.vercel.app';
  
  try {
    // Test 1: Public Key endpoint
    console.log('1️⃣ Probando /api/push/public-key...');
    const result1 = await testEndpoint(`${baseUrl}/api/push/public-key`);
    console.log(`   Status: ${result1.status}`);
    console.log(`   Response: ${JSON.stringify(result1.data, null, 2)}`);
    console.log('');
    
    // Test 2: Register endpoint (POST)
    console.log('2️⃣ Probando /api/push/register...');
    const result2 = await testEndpoint(`${baseUrl}/api/push/register`);
    console.log(`   Status: ${result2.status}`);
    console.log(`   Response: ${JSON.stringify(result2.data, null, 2)}`);
    console.log('');
    
    // Test 3: Notify endpoint (POST)
    console.log('3️⃣ Probando /api/push/notify...');
    const result3 = await testEndpoint(`${baseUrl}/api/push/notify`);
    console.log(`   Status: ${result3.status}`);
    console.log(`   Response: ${JSON.stringify(result3.data, null, 2)}`);
    console.log('');
    
    console.log('📋 Análisis:');
    if (result1.status === 200 && result1.data.publicKey) {
      console.log('✅ /api/push/public-key: FUNCIONANDO');
    } else {
      console.log('❌ /api/push/public-key: NO FUNCIONA');
      console.log('   Posible causa: Variables de entorno no configuradas en Vercel');
    }
    
    if (result2.status === 405) {
      console.log('✅ /api/push/register: FUNCIONANDO (espera POST)');
    } else {
      console.log('❌ /api/push/register: NO FUNCIONA');
    }
    
    if (result3.status === 405) {
      console.log('✅ /api/push/notify: FUNCIONANDO (espera POST)');
    } else {
      console.log('❌ /api/push/notify: NO FUNCIONA');
    }
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

runTests();
