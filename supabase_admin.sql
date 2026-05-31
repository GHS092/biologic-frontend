-- ============================================================================
-- SCRIPT DE INICIALIZACIÓN BÓVEDA ADMIN (SUPABASE)
-- Instrucciones: Pega todo este código en el "SQL Editor" de tu panel de Supabase 
-- y presiona "Run" para crear la tabla de configuraciones globales segura.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_system_config (
  id text PRIMARY KEY,
  api_keys jsonb DEFAULT '[]'::jsonb,
  active_model text DEFAULT 'gemini-3.1-pro-preview',
  api_provider text DEFAULT 'google',
  kill_switch boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS (Seguridad a Nivel de Fila)
ALTER TABLE public.admin_system_config ENABLE ROW LEVEL SECURITY;

-- IMPORTANTE: No creamos NINGUNA política (Policy) de lectura/escritura pública.
-- Esto significa que nadie desde internet puede leer ni escribir en esta tabla directamente.
-- La ÚNICA forma de leer/escribir es a través de tus Servidores en Vercel
-- utilizando la SUPABASE_SERVICE_ROLE_KEY (la llave maestra Backend).
