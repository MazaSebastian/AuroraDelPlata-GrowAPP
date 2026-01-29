-- Script para configurar la tabla de insumos (materia prima) para CROSTI
-- Esta tabla permitirá registrar y monitorear precios de insumos

-- 1. Crear la tabla de insumos
CREATE TABLE IF NOT EXISTS public.crosti_insumos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL, -- 'semillas', 'fertilizantes', 'sustratos', 'herramientas', etc.
    unidad_medida VARCHAR(50) NOT NULL, -- 'kg', 'litros', 'unidades', 'metros', etc.
    precio_actual DECIMAL(10,2) NOT NULL,
    precio_anterior DECIMAL(10,2),
    proveedor VARCHAR(255),
    fecha_ultima_compra DATE,
    fecha_ultimo_precio DATE NOT NULL DEFAULT CURRENT_DATE,
    stock_actual DECIMAL(10,2) DEFAULT 0,
    stock_minimo DECIMAL(10,2) DEFAULT 0,
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_crosti_insumos_categoria ON public.crosti_insumos(categoria);
CREATE INDEX IF NOT EXISTS idx_crosti_insumos_activo ON public.crosti_insumos(activo);
CREATE INDEX IF NOT EXISTS idx_crosti_insumos_fecha_precio ON public.crosti_insumos(fecha_ultimo_precio);

-- 3. Crear tabla para historial de precios
CREATE TABLE IF NOT EXISTS public.crosti_historial_precios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    insumo_id UUID REFERENCES public.crosti_insumos(id) ON DELETE CASCADE,
    precio DECIMAL(10,2) NOT NULL,
    fecha_cambio DATE NOT NULL DEFAULT CURRENT_DATE,
    motivo_cambio VARCHAR(255), -- 'compra', 'ajuste', 'inflación', etc.
    proveedor VARCHAR(255),
    cantidad_comprada DECIMAL(10,2),
    costo_total DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 4. Crear índices para el historial
CREATE INDEX IF NOT EXISTS idx_historial_insumo_id ON public.crosti_historial_precios(insumo_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON public.crosti_historial_precios(fecha_cambio);

-- 5. Habilitar RLS en las tablas
ALTER TABLE public.crosti_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crosti_historial_precios ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas para crosti_insumos
DROP POLICY IF EXISTS "Usuarios autorizados pueden ver crosti_insumos" ON public.crosti_insumos;
CREATE POLICY "Usuarios autorizados pueden ver crosti_insumos" ON public.crosti_insumos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.app_members 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Usuarios autorizados pueden insertar crosti_insumos" ON public.crosti_insumos;
CREATE POLICY "Usuarios autorizados pueden insertar crosti_insumos" ON public.crosti_insumos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.app_members 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Usuarios autorizados pueden actualizar crosti_insumos" ON public.crosti_insumos;
CREATE POLICY "Usuarios autorizados pueden actualizar crosti_insumos" ON public.crosti_insumos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.app_members 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Usuarios autorizados pueden eliminar crosti_insumos" ON public.crosti_insumos;
CREATE POLICY "Usuarios autorizados pueden eliminar crosti_insumos" ON public.crosti_insumos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.app_members 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- 7. Crear políticas para crosti_historial_precios
DROP POLICY IF EXISTS "Usuarios autorizados pueden ver historial_precios" ON public.crosti_historial_precios;
CREATE POLICY "Usuarios autorizados pueden ver historial_precios" ON public.crosti_historial_precios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.app_members 
            WHERE user_id = auth.uid() AND active = true
        )
    );

DROP POLICY IF EXISTS "Usuarios autorizados pueden insertar historial_precios" ON public.crosti_historial_precios;
CREATE POLICY "Usuarios autorizados pueden insertar historial_precios" ON public.crosti_insumos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.app_members 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- 8. Agregar las tablas a Realtime para sincronización en tiempo real
INSERT INTO supabase_realtime.subscription (subscription_id, entity, filters, claims)
VALUES 
    ('crosti_insumos_changes', 'public', 'crosti_insumos', '{"role": "authenticated"}'),
    ('crosti_historial_precios_changes', 'public', 'crosti_historial_precios', '{"role": "authenticated"}')
ON CONFLICT (subscription_id) DO NOTHING;

-- 9. Verificar que las tablas estén en la publicación de Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM supabase_realtime.publication_tables 
        WHERE publication_name = 'supabase_realtime' 
        AND table_name = 'crosti_insumos'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.crosti_insumos;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM supabase_realtime.publication_tables 
        WHERE publication_name = 'supabase_realtime' 
        AND table_name = 'crosti_historial_precios'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.crosti_historial_precios;
    END IF;
END $$;

-- 10. Insertar datos de ejemplo
INSERT INTO public.crosti_insumos (nombre, categoria, unidad_medida, precio_actual, proveedor, stock_actual, stock_minimo, notas)
VALUES 
    ('Semillas Tomate Cherry', 'semillas', 'gramos', 15.50, 'Vivero Central', 100, 20, 'Semillas certificadas orgánicas'),
    ('Fertilizante NPK 15-15-15', 'fertilizantes', 'kg', 45.00, 'AgroSupply', 25, 5, 'Fertilizante balanceado para todo tipo de cultivos'),
    ('Sustrato Universal', 'sustratos', 'litros', 12.80, 'Vivero Central', 200, 50, 'Sustrato preparado con turba y perlita'),
    ('Macetas 20cm', 'herramientas', 'unidades', 8.50, 'Vivero Central', 100, 20, 'Macetas plásticas con drenaje'),
    ('Pesticida Orgánico', 'pesticidas', 'litros', 28.90, 'AgroSupply', 10, 2, 'Pesticida natural para control de plagas')
ON CONFLICT DO NOTHING;

-- 11. Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Crear trigger para actualizar timestamp automáticamente
DROP TRIGGER IF EXISTS update_crosti_insumos_updated_at ON public.crosti_insumos;
CREATE TRIGGER update_crosti_insumos_updated_at
    BEFORE UPDATE ON public.crosti_insumos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Comentarios de la tabla
COMMENT ON TABLE public.crosti_insumos IS 'Tabla para gestionar insumos y materia prima del sistema CROSTI';
COMMENT ON TABLE public.crosti_historial_precios IS 'Historial de cambios de precios para análisis de fluctuaciones';
COMMENT ON COLUMN public.crosti_insumos.precio_anterior IS 'Precio anterior para calcular variaciones';
COMMENT ON COLUMN public.crosti_insumos.fecha_ultimo_precio IS 'Fecha del último cambio de precio';
COMMENT ON COLUMN public.crosti_historial_precios.motivo_cambio IS 'Razón del cambio de precio para análisis';
