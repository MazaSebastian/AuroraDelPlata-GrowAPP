// Script de prueba para verificar notificaciones push
// Ejecutar en el navegador después de activar las notificaciones

async function testPushNotification() {
  try {
    // Verificar que las notificaciones estén activadas
    if (Notification.permission !== 'granted') {
      console.log('❌ Notificaciones no activadas');
      return;
    }

    console.log('✅ Notificaciones activadas');

    // Enviar notificación de prueba
    const notification = new Notification('🧪 Prueba de Notificaciones', {
      body: '¡Las notificaciones push están funcionando correctamente!',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'test-notification'
    });

    // Mostrar notificación por 5 segundos
    setTimeout(() => {
      notification.close();
    }, 5000);

    console.log('✅ Notificación de prueba enviada');

  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

// Función para probar el endpoint de notificaciones
async function testNotificationEndpoint() {
  try {
    const response = await fetch('/api/push/public-key');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint de clave pública funcionando:', data.publicKey ? 'OK' : 'ERROR');
    } else {
      console.log('❌ Error en endpoint de clave pública:', response.status);
    }
  } catch (error) {
    console.error('❌ Error conectando al endpoint:', error);
  }
}

// Ejecutar pruebas
console.log('🧪 Iniciando pruebas de notificaciones push...');
testNotificationEndpoint();
testPushNotification();

// Instrucciones para el usuario
console.log(`
📋 Instrucciones de prueba:

1. Abre la consola del navegador (F12)
2. Ejecuta: testPushNotification()
3. Deberías ver una notificación de prueba
4. Si funciona, las notificaciones push están configuradas correctamente

Para probar notificaciones automáticas:
1. Ve a la sección "Comunicaciones"
2. Crea un nuevo aviso
3. Deberías recibir una notificación push automática
`);
