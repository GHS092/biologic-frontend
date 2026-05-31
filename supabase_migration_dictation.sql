-- Corre este código en el SQL Editor de tu panel de Supabase
-- para añadir las columnas que controlan el dictado médico

ALTER TABLE admin_system_config 
ADD COLUMN IF NOT EXISTS dictation_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE admin_system_config 
ADD COLUMN IF NOT EXISTS dictation_model TEXT DEFAULT 'gemini-3.1-flash-live-preview';
