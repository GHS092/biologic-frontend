-- ============================================================================
-- SCRIPT DE MIGRACIÓN: CAPA DE SEGURIDAD GLOBAL Y CANALES DE BASE DE DATOS
-- ============================================================================
-- Ejecuta este script en el SQL Editor de tu panel de Supabase.
-- Añade los interruptores de seguridad a la tabla admin_system_config.

ALTER TABLE public.admin_system_config
ADD COLUMN IF NOT EXISTS block_global BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS block_chat_discoveries BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS block_assimilation_tray BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS block_medical_library BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.admin_system_config.block_global IS 'Bloquea el ingreso de datos a la biblioteca principal por cualquier canal de forma global.';
COMMENT ON COLUMN public.admin_system_config.block_chat_discoveries IS 'Bloquea inyecciones de datos desde el chat de debates con el médico adscrito.';
COMMENT ON COLUMN public.admin_system_config.block_assimilation_tray IS 'Bloquea inyecciones desde la bandeja de asimilación/cuarentena (Europe PMC / Radiopaedia).';
COMMENT ON COLUMN public.admin_system_config.block_medical_library IS 'Bloquea inyecciones manuales desde la sección de biblioteca médica.';
