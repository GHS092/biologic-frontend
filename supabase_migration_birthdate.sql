-- =====================================================================================
-- MIGRACIÓN DE EXPEDIENTE: INTEGRACIÓN DE FECHA DE NACIMIENTO Y DETALLES EN SUPABASE
-- =====================================================================================
-- Instrucciones: Copia y ejecuta este script en el "SQL Editor" de tu panel de Supabase
-- para habilitar el almacenamiento nativo de fechas de nacimiento, distritos/ciudades
-- y optimizar las consultas.

-- 1. Agregar columna fecha_nacimiento de tipo DATE si no existe
ALTER TABLE public.pacientes 
ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;

-- 2. Agregar columna ciudad de tipo TEXT si no existe
ALTER TABLE public.pacientes 
ADD COLUMN IF NOT EXISTS ciudad TEXT;

-- 3. Añadir comentarios explicativos para auditoría de base de datos
COMMENT ON COLUMN public.pacientes.fecha_nacimiento 
IS 'Almacena la fecha de nacimiento real (YYYY-MM-DD) para posibilitar el cálculo exacto de edad en el expediente clínico.';

COMMENT ON COLUMN public.pacientes.ciudad 
IS 'Almacena la ciudad o distrito del paciente para contextualización y trazabilidad epidemiológica.';

-- 4. Asegurar que existe un índice de búsqueda en la tabla de Registros Clínicos
-- Esto optimiza la velocidad del motor RAG segregado por DNI y el Análisis Delta
CREATE INDEX IF NOT EXISTS idx_registros_clinicos_paciente_dni 
ON public."Registros_Clinicos"(paciente_dni);

-- 5. Opcional: Asegurar que el DNI sea estrictamente único (regla de integridad máster)
ALTER TABLE public.pacientes 
ADD CONSTRAINT unique_pacientes_dni UNIQUE (dni)
ON CONFLICT DO NOTHING;
