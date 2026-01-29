-- Script para crear y configurar la tabla de compras en Supabase
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de compras
CREATE TABLE IF NOT EXISTS public.compras (
  id text PRIMARY KEY,
  name text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('BAJO', 'MEDIO', 'ALTO')),
  completed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS para acceso compartido
DROP POLICY IF EXISTS "Usuarios autorizados pueden ver compras" ON public.compras;
CREATE POLICY "Usuarios autorizados pueden ver compras" ON public.compras
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden insertar compras" ON public.compras;
CREATE POLICY "Usuarios autorizados pueden insertar compras" ON public.compras
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden actualizar compras" ON public.compras;
CREATE POLICY "Usuarios autorizados pueden actualizar compras" ON public.compras
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden eliminar compras" ON public.compras;
CREATE POLICY "Usuarios autorizados pueden eliminar compras" ON public.compras
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

-- 4. Agregar a Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'compras'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.compras;
  END IF;
END $$;

-- 5. Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_compras_updated_at ON public.compras;
CREATE TRIGGER update_compras_updated_at
    BEFORE UPDATE ON public.compras
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Verificar configuración
SELECT 
  'compras' as table_name,
  COUNT(*) as record_count
FROM public.compras
UNION ALL
SELECT 
  'app_members' as table_name,
  COUNT(*) as user_count
FROM public.app_members;
