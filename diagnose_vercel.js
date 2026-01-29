// Script de diagnóstico para Vercel
// Ejecutar: node diagnose_vercel.js

const https = require('https');

async function diagnoseVercel() {
  console.log('🔍 Diagnóstico de Vercel - Notificaciones Push\n');
  
  const baseUrl = 'https://crop-crm.vercel.app';
  
  // Test 1: Verificar si el sitio responde
  console.log('1️⃣ Verificando respuesta del sitio...');
  try {
    const response = await fetch(`${baseUrl}`);
    console.log(`   ✅ Sitio responde: ${response.status}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 2: Verificar endpoint de notificaciones
  console.log('\n2️⃣ Verificando endpoint de notificaciones...');
  try {
    const response = await fetch(`${baseUrl}/api/push/public-key`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    const text = await response.text();
    if (text.includes('<!doctype html>')) {
      console.log('   ❌ PROBLEMA: Endpoint devuelve HTML en lugar de JSON');
      console.log('   🔧 Posibles causas:');
      console.log('      • Variables de entorno no configuradas');
      console.log('      • Error en el build de las funciones');
      console.log('      • Problema con vercel.json');
    } else if (text.includes('publicKey')) {
      console.log('   ✅ Endpoint funciona correctamente');
    } else {
      console.log('   ⚠️ Respuesta inesperada:', text.substring(0, 100));
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 3: Verificar otras funciones
  console.log('\n3️⃣ Verificando otras funciones...');
  try {
    const response = await fetch(`${baseUrl}/api/push/register`, { method: 'POST' });
    console.log(`   Register endpoint: ${response.status} (esperado: 405 para GET)`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n📋 Resumen:');
  console.log('Si el endpoint devuelve HTML, necesitas:');
  console.log('1. Verificar variables de entorno en Vercel');
  console.log('2. Hacer un nuevo deploy');
  console.log('3. Verificar logs de Vercel');
}

// Función fetch para Node.js
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = https;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          text: () => Promise.resolve(data),
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

diagnoseVercel();
