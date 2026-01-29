# Configuración de Notificaciones Push

## Variables de Entorno Requeridas

### En Vercel:
```env
VAPID_PUBLIC_KEY=BD5U6VJrg60oh9WePq7pPK3IuN1Z7pG76lu6i3WSoVU3S_Gm-Tw3ydkASEoUbKJD-EX394n9qfmA6uLj9IdkKvI
VAPID_PRIVATE_KEY=TTUDs62KqUcEgF04ueuKOgKEFyhNyjFvDkKIy5ZEnKo
PUSH_WEBHOOK_SECRET=e0fb24f1265a4aa5fdb718fcac0c541d38e8e62eecf4d7ce0c85b75aed3c78c8
SUPABASE_URL=tu_url_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## Pasos para Configurar

### 1. ✅ Generar Claves VAPID (COMPLETADO)
```bash
# Instalar web-push globalmente
npm install -g web-push

# Generar claves VAPID
web-push generate-vapid-keys
```

### 2. Configurar Vercel
- Ve a tu proyecto en Vercel
- Settings > Environment Variables
- Agrega las variables de entorno listadas arriba

### 3. Ejecutar Script SQL
- Ve a Supabase SQL Editor
- Ejecuta el contenido de `setup_push_notifications.sql`
- El secreto webhook ya está configurado

### 4. Verificar Configuración
- Las notificaciones se enviarán automáticamente cuando:
  - Se agreguen nuevos avisos
  - Se registren actividades
  - Se creen eventos planificados
  - Se agreguen registros diarios
  - Se creen nuevas tareas

## Prueba de Notificaciones

1. Activa las notificaciones en la app
2. Crea un nuevo aviso
3. Deberías recibir una notificación push

## Notas Importantes

- Las claves VAPID ya fueron generadas y están listas para usar
- El script SQL ya tiene el secreto webhook configurado
- Solo falta configurar las variables en Vercel y ejecutar el SQL
