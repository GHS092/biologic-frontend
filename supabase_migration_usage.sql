-- =====================================================================================
-- MASTER MIGRATION SCRIPT - BIOLOGIC CLINICAL ASSISTANT (DICTATION & TELEMETRY UPDATE)
-- =====================================================================================
-- Corre este script en el SQL Editor de tu panel de Supabase.
-- Este script realiza TODAS las actualizaciones necesarias para el nuevo sistema.

-- 1. AÑADIR CONFIGURACIONES DE DICTADO AL PANEL DE ADMINISTRACIÓN
ALTER TABLE admin_system_config 
ADD COLUMN IF NOT EXISTS dictation_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE admin_system_config 
ADD COLUMN IF NOT EXISTS dictation_model TEXT DEFAULT 'gemini-2.5-flash';

-- 2. CREAR TABLA MAESTRA PARA CONTROL DE GASTOS Y TELEMETRÍA (CHAT Y DICTADO)
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    estimated_cost_usd DECIMAL(10, 6) DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar lectura y escritura pública si es necesario
-- ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
