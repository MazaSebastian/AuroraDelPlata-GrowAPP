-- Script para verificar usuarios existentes en Supabase
-- Ejecutar en Supabase SQL Editor

-- 1. Ver usuarios existentes en auth.users
SELECT 
  id as user_uuid,
  email,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email LIKE '%@chakra.com' 
   OR email LIKE '%mazasantiago%' 
   OR email LIKE '%djsebamaza%'
ORDER BY created_at DESC;

-- 2. Verificar si los usuarios están en app_members
SELECT 
  am.user_id,
  au.email,
  am.created_at as added_to_app
FROM public.app_members am
JOIN auth.users au ON am.user_id = au.id
ORDER BY am.created_at DESC;

-- 3. Verificar políticas RLS existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('crosti_cash_movements', 'crosti_stock_items')
ORDER BY tablename, policyname;

-- 4. Verificar si RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('crosti_cash_movements', 'crosti_stock_items', 'app_members');

-- 5. Verificar tablas en Realtime
SELECT 
  pubname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename IN ('crosti_cash_movements', 'crosti_stock_items');
