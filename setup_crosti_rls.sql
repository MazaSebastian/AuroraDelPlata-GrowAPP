-- Script para configurar RLS para Crosti - Acceso compartido entre usuarios
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla app_members si no existe
CREATE TABLE IF NOT EXISTS public.app_members (
  user_id uuid PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- 2. Insertar usuarios autorizados (reemplazar con los UUIDs reales de los usuarios)
-- Primero necesitas obtener los UUIDs de los usuarios desde auth.users
INSERT INTO public.app_members(user_id) 
SELECT id FROM auth.users 
WHERE email IN ('mazasantiago@chakra.com', 'djsebamaza@chakra.com', 'seba@chakra.com', 'santi@chakra.com')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Habilitar RLS en las tablas de Crosti
ALTER TABLE public.crosti_cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crosti_stock_items ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas para crosti_cash_movements
DROP POLICY IF EXISTS "Usuarios autorizados pueden ver crosti_cash_movements" ON public.crosti_cash_movements;
CREATE POLICY "Usuarios autorizados pueden ver crosti_cash_movements" ON public.crosti_cash_movements
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden insertar crosti_cash_movements" ON public.crosti_cash_movements;
CREATE POLICY "Usuarios autorizados pueden insertar crosti_cash_movements" ON public.crosti_cash_movements
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden actualizar crosti_cash_movements" ON public.crosti_cash_movements;
CREATE POLICY "Usuarios autorizados pueden actualizar crosti_cash_movements" ON public.crosti_cash_movements
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden eliminar crosti_cash_movements" ON public.crosti_cash_movements;
CREATE POLICY "Usuarios autorizados pueden eliminar crosti_cash_movements" ON public.crosti_cash_movements
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

-- 5. Crear políticas para crosti_stock_items
DROP POLICY IF EXISTS "Usuarios autorizados pueden ver crosti_stock_items" ON public.crosti_stock_items;
CREATE POLICY "Usuarios autorizados pueden ver crosti_stock_items" ON public.crosti_stock_items
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden insertar crosti_stock_items" ON public.crosti_stock_items;
CREATE POLICY "Usuarios autorizados pueden insertar crosti_stock_items" ON public.crosti_stock_items
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden actualizar crosti_stock_items" ON public.crosti_stock_items;
CREATE POLICY "Usuarios autorizados pueden actualizar crosti_stock_items" ON public.crosti_stock_items
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

DROP POLICY IF EXISTS "Usuarios autorizados pueden eliminar crosti_stock_items" ON public.crosti_stock_items;
CREATE POLICY "Usuarios autorizados pueden eliminar crosti_stock_items" ON public.crosti_stock_items
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.app_members)
  );

-- 6. Verificar que las tablas estén en Realtime
DO $$
BEGIN
  -- Agregar crosti_cash_movements a Realtime si no está
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'crosti_cash_movements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crosti_cash_movements;
  END IF;

  -- Agregar crosti_stock_items a Realtime si no está
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'crosti_stock_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crosti_stock_items;
  END IF;
END $$;

-- 7. Verificar configuración
SELECT 
  'app_members' as table_name,
  COUNT(*) as user_count
FROM public.app_members
UNION ALL
SELECT 
  'crosti_cash_movements' as table_name,
  COUNT(*) as record_count
FROM public.crosti_cash_movements
UNION ALL
SELECT 
  'crosti_stock_items' as table_name,
  COUNT(*) as record_count
FROM public.crosti_stock_items;
