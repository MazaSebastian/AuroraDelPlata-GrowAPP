-- Script para verificar y configurar la tabla announcements en Supabase
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si la tabla existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'announcements'
) as table_exists;

-- 2. Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.announcements (
  id text PRIMARY KEY,
  message text NOT NULL,
  type text DEFAULT 'info',
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS para acceso compartido
DROP POLICY IF EXISTS "Usuarios autorizados pueden ver announcements" ON public.announcements;
CREATE POLICY "Usuarios autorizados pueden ver announcements" ON public.announcements
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden insertar announcements" ON public.announcements;
CREATE POLICY "Usuarios autorizados pueden insertar announcements" ON public.announcements
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden actualizar announcements" ON public.announcements;
CREATE POLICY "Usuarios autorizados pueden actualizar announcements" ON public.announcements
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden eliminar announcements" ON public.announcements;
CREATE POLICY "Usuarios autorizados pueden eliminar announcements" ON public.announcements
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

-- 5. Agregar a Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
  END IF;
END $$;

-- 6. Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Verificar estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'announcements'
ORDER BY ordinal_position;

-- 8. Verificar políticas RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'announcements';
