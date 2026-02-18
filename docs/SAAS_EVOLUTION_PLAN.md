# Informe de Arquitectura y Plan de Evolución a SaaS Multi-Tenant

## 1. Estado Actual del Proyecto (Diagnóstico)

### Arquitectura Técnica
*   **Frontend**: React (SPA) + TypeScript + Styled Components.
*   **Backend**: Supabase (PostgreSQL + Auth + Storage).
*   **Modelo de Datos**: Relacional, centrado en entidades de cultivo (`Room`, `Batch`, `Genetic`).
*   **Aislamiento**: **Inexistente / Implícito**. Actualmente, la aplicación asume que el usuario logueado es el dueño de todo, o comparte todo con todos (dependiendo de las reglas RLS actuales).
*   **Riesgo Crítico**: No existe la entidad `Organization`. Si dos usuarios distintos se loguean hoy, no hay mecanismo claro para separarlos o agruparlos, salvo que compartan credenciales (bad practice) o que RLS permita ver todo.

### Conclusión
La aplicación es actualmente un **Single-Tenant App** (una app para un solo dueño/equipo). Para venderla como SaaS (Software as a Service) a múltiples clientes (Multitenancy), **es obligatorio realizar cambios estructurales profundos** antes de escalar.

---

## 2. Estrategia de Migración: "Tenant-per-Row"

La estrategia recomendada es **Tenant-per-Row con Foreign Key**.
Esto significa que **CADA** fila en **CADA** tabla importante (`rooms`, `batches`, `genetics`, `tasks`, etc.) debe tener una columna `organization_id`.

### ¿Por qué esta estrategia?
*   **Escalabilidad**: Todos los clientes viven en la misma base de datos (fácil de mantener y actualizar).
*   **Seguridad**: RLS (Row Level Security) de Postgres garantiza que `org A` nunca vea datos de `org B` a nivel del motor de base de datos.
*   **Simplicidad**: No requiere crear bases de datos separadas por cliente.

---

## 3. Guía de Implementación Paso a Paso (Roadmap)

Sigue este orden estricto para evitar romper la aplicación actual.

### FASE 1: Cimientos de Base de Datos (Backend)
*Objetivo: Preparar la DB para entender el concepto de "Organización".*

1.  **Crear Tablas de Organización**:
    Ejecutar en SQL Editor de Supabase:
    ```sql
    -- 1. Tabla de Organizaciones (Los Clientes)
    CREATE TABLE public.organizations (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE, -- para URLs amigables (ej: app.com/aurora)
        plan TEXT DEFAULT 'free', -- free, pro, enterprise
        stripe_customer_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 2. Tabla de Miembros (User <-> Organization)
    CREATE TABLE public.organization_members (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        organization_id UUID REFERENCES public.organizations(id) NOT NULL,
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        role TEXT DEFAULT 'staff', -- owner, admin, staff, viewer
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id, user_id)
    );
    ```

2.  **Backfill (Migración de Datos Existentes)**:
    Si ya tienes datos reales, no puedes dejarlos "huérfanos".
    ```sql
    -- Script conceptual para migrar datos actuales
    DO $$
    DECLARE
        user_record RECORD;
        new_org_id UUID;
    BEGIN
        FOR user_record IN SELECT * FROM auth.users LOOP
            -- Crear una organización para cada usuario existente
            INSERT INTO public.organizations (name) VALUES ('Org de ' || user_record.email)
            RETURNING id INTO new_org_id;

            -- Hacerlo miembro dueño
            INSERT INTO public.organization_members (organization_id, user_id, role)
            VALUES (new_org_id, user_record.id, 'owner');
        END LOOP;
    END $$;
    ```

3.  **Alterar Tablas Principales**:
    Agrega la columna `organization_id` a todas las tablas de negocio (`rooms`, `batches`, `genetics`, etc.).
    ```sql
    ALTER TABLE public.rooms ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    -- (Repetir para batches, logistics, sales, etc.)
    ```

### FASE 2: Seguridad Blindada (RLS)
*Objetivo: Que la base de datos impida físicamente ver datos ajenos.*

1.  **Habilitar RLS en todo**: `ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;`
2.  **Crear Función Helper (Vital para performance)**:
    ```sql
    CREATE OR REPLACE FUNCTION get_my_org_ids()
    RETURNS SETOF UUID AS $$
    BEGIN
        RETURN QUERY SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid();
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```
3.  **Aplicar Políticas**:
    ```sql
    -- Policy para Rooms (Ejemplo)
    CREATE POLICY "Tenant Isolation" ON public.rooms
    FOR ALL
    USING ( organization_id IN (SELECT get_my_org_ids()) )
    WITH CHECK ( organization_id IN (SELECT get_my_org_ids()) );
    ```
    *Repetir esta lógica para TODAS las tablas con `organization_id`.*

### FASE 3: Frontend & Contexto (React)
*Objetivo: Que la app sepa en qué organización está operando.*

1.  **Crear `OrganizationContext`**:
    *   Al iniciar sesión (`AuthContext`), fetching de `organization_members` para ver a qué orgs pertenece el usuario.
    *   Si tiene 1, seleccionarla automáticamente.
    *   Si tiene >1, mostrar pantalla de "Seleccionar Organización".
    *   Guardar `currentOrganization` en el estado global.

2.  **Adaptar Servicios (`src/services/*.ts`)**:
    *   **Lectura**: Gracias a RLS, las queries `select *` seguirán funcionando (Supabase filtrará solo), pero es BUENA PRÁCTICA agregar `.eq('organization_id', currentOrg.id)`.
    *   **Escritura (INSERT)**: **OBLIGATORIO**. Cada vez que crees un Room o Batch, debes inyectar el `organization_id` en el objeto a guardar.
    *   *Tip*: Puedes crear un "Base Service" que inyecte esto automáticamente.

### FASE 4: Onboarding y Facturación (SaaS Real)

1.  **Flow de Registro**:
    *   Registro de Usuario -> Crear Organización (Nombre) -> Crear Miembro (Owner).
2.  **Invitaciones**:
    *   UI para invitar a otros usuarios por email a tu organización.
3.  **Stripe/MercadoPago**:
    *   Vincular el estado de la suscripción al campo `plan` en `public.organizations`.
    *   Bloquear features en el Front si `plan === 'free'` y exceden límites.

---

## 4. Riesgos Identificados y Soluciones

### Riesgo 1: Data Leak (Fuga de Información)
*   **Peligro**: Un usuario manipulando la consola JS podría intentar hacer `supabase.from('rooms').select('*')` y ver datos de otro cliente.
*   **Solución**: **RLS es la única barrera real.** Nunca confíes en el filtrado del Frontend. Haz tests de penetración intentando leer datos con un usuario A que pertenezcan a la org B.

### Riesgo 2: "Orphaned Records"
*   **Peligro**: Crear un dato (ej: Log) y olvidarse de ponerle `organization_id`. Ese dato será invisible para todos (o visible para todos si RLS falla).
*   **Solución**: Poner la columna `organization_id` como **NOT NULL** en la base de datos. Así, el insert fallará si te olvidas, alertándote del error durante el desarrollo.

### Riesgo 3: Performance con RLS
*   **Peligro**: Las queries se vuelven lentas porque RLS ejecuta subqueries.
*   **Solución**:
    1.  Indexar siempre `organization_id`. `CREATE INDEX ON rooms(organization_id);`
    2.  Usar "Custom Claims" en el JWT de Supabase para guardar el `org_id` en el token, evitando la subquery a `organization_members` en cada petición (Avanzado, pero recomendado para escala).

---

## 5. Instrucción para Proceder

No toques el código hoy.
1.  **Estudia este plan.**
2.  Crea un entorno de **Staging** (proyecto Supabase nuevo) para probar la migración de datos.
3.  Implementa la **FASE 1 y FASE 2** en ese entorno de pruebas.
4.  Solo cuando RLS esté funcionando perfectamente (pruebas SQL), empieza a modificar el Frontend (FASE 3).

El éxito de un SaaS depende 90% de la arquitectura de datos sólida y 10% de la UI. Prioriza la seguridad de la base de datos.
