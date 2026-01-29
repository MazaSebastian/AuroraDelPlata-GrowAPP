-- Script para configurar notificaciones push en Supabase
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de suscripciones push
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias suscripciones" ON public.push_subscriptions;
CREATE POLICY "Usuarios pueden ver sus propias suscripciones" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias suscripciones" ON public.push_subscriptions;
CREATE POLICY "Usuarios pueden insertar sus propias suscripciones" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias suscripciones" ON public.push_subscriptions;
CREATE POLICY "Usuarios pueden actualizar sus propias suscripciones" ON public.push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias suscripciones" ON public.push_subscriptions;
CREATE POLICY "Usuarios pueden eliminar sus propias suscripciones" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Crear función para enviar notificaciones push
CREATE OR REPLACE FUNCTION send_push_notification(
  title text,
  body text DEFAULT NULL,
  url text DEFAULT NULL,
  user_ids uuid[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record RECORD;
  webhook_url text := 'https://crop-crm.vercel.app/api/push/notify';
  webhook_secret text := 'e0fb24f1265a4aa5fdb718fcac0c541d38e8e62eecf4d7ce0c85b75aed3c78c8';
  subscriptions jsonb := '[]'::jsonb;
  notification jsonb;
BEGIN
  -- Construir notificación
  notification := jsonb_build_object(
    'title', title,
    'body', COALESCE(body, ''),
    'url', COALESCE(url, '')
  );
  
  -- Obtener suscripciones
  IF user_ids IS NULL THEN
    -- Enviar a todos los usuarios
    SELECT jsonb_agg(
      jsonb_build_object(
        'endpoint', ps.endpoint,
        'keys', jsonb_build_object(
          'p256dh', ps.p256dh,
          'auth', ps.auth
        )
      )
    ) INTO subscriptions
    FROM public.push_subscriptions ps;
  ELSE
    -- Enviar solo a usuarios específicos
    SELECT jsonb_agg(
      jsonb_build_object(
        'endpoint', ps.endpoint,
        'keys', jsonb_build_object(
          'p256dh', ps.p256dh,
          'auth', ps.auth
        )
      )
    ) INTO subscriptions
    FROM public.push_subscriptions ps
    WHERE ps.user_id = ANY(user_ids);
  END IF;
  
  -- Enviar notificación si hay suscripciones
  IF subscriptions IS NOT NULL AND jsonb_array_length(subscriptions) > 0 THEN
    PERFORM net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-chakra-secret', webhook_secret
      ),
      body := jsonb_build_object(
        'subscriptions', subscriptions,
        'notification', notification
      )
    );
  END IF;
END;
$$;

-- 5. Crear triggers para notificaciones automáticas

-- Trigger para nuevos anuncios
CREATE OR REPLACE FUNCTION notify_new_announcement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM send_push_notification(
    title := 'Nuevo Aviso',
    body := NEW.content,
    url := 'https://crop-crm.vercel.app/'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_announcement ON public.announcements;
CREATE TRIGGER trigger_notify_new_announcement
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_announcement();

-- Trigger para nuevas actividades
CREATE OR REPLACE FUNCTION notify_new_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM send_push_notification(
    title := 'Nueva Actividad Registrada',
    body := NEW.title || ' - ' || NEW.cropName,
    url := 'https://crop-crm.vercel.app/daily-log'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_activity ON public.activities;
CREATE TRIGGER trigger_notify_new_activity
  AFTER INSERT ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_activity();

-- Trigger para nuevos eventos planificados
CREATE OR REPLACE FUNCTION notify_new_planned_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM send_push_notification(
    title := 'Nuevo Evento Planificado',
    body := NEW.title || ' - ' || NEW.cropName,
    url := 'https://crop-crm.vercel.app/'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_planned_event ON public.planned_events;
CREATE TRIGGER trigger_notify_new_planned_event
  AFTER INSERT ON public.planned_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_planned_event();

-- Trigger para nuevos registros diarios
CREATE OR REPLACE FUNCTION notify_new_daily_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM send_push_notification(
    title := 'Nuevo Registro Diario',
    body := NEW.cropName || ' - ' || NEW.notes,
    url := 'https://crop-crm.vercel.app/daily-log'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_daily_record ON public.daily_records;
CREATE TRIGGER trigger_notify_new_daily_record
  AFTER INSERT ON public.daily_records
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_daily_record();

-- Trigger para nuevas tareas
CREATE OR REPLACE FUNCTION notify_new_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM send_push_notification(
    title := 'Nueva Tarea',
    body := NEW.title || ' - ' || NEW.cropName,
    url := 'https://crop-crm.vercel.app/tasks'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_task ON public.tasks;
CREATE TRIGGER trigger_notify_new_task
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_task();

-- 6. Verificar configuración
SELECT 
  'push_subscriptions' as table_name,
  COUNT(*) as subscription_count
FROM public.push_subscriptions
UNION ALL
SELECT 
  'announcements' as table_name,
  COUNT(*) as announcement_count
FROM public.announcements
UNION ALL
SELECT 
  'activities' as table_name,
  COUNT(*) as activity_count
FROM public.activities;
