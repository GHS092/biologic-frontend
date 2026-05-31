-- =====================================================================================
-- MIGRACIÓN PARA LA BIBLIOTECA MÉDICA (SISTEMA RAG Y VECTORES)
-- =====================================================================================
-- Corre este script en el SQL Editor de tu panel de Supabase.

-- 1. Habilitar la extensión de Vectores (esencial para IA y Búsqueda Semántica)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Crear la tabla base de conocimiento
CREATE TABLE IF NOT EXISTS medical_knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- Ej: Inmunología, Neurología
    pathology TEXT NOT NULL, -- Ej: Lupus, Esclerosis Múltiple
    file_url TEXT, -- URL del archivo en Supabase Storage (si hay archivo físico)
    file_type TEXT, -- PDF, JPG, TXT, etc.
    content_text TEXT NOT NULL, -- El texto extraído (OCR o texto puro) para contexto
    embedding vector(768), -- El vector matemático (Google Gemini text-embedding-004 usa 768 dimensiones)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear un índice HNSW para búsquedas semánticas ultrarrápidas
CREATE INDEX ON medical_knowledge_base USING hnsw (embedding vector_cosine_ops);

-- 4. Crear la función de búsqueda de similitud (Match Documents) para el Agente Bibliotecario
CREATE OR REPLACE FUNCTION match_medical_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  category text,
  pathology text,
  content_text text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    medical_knowledge_base.id,
    medical_knowledge_base.title,
    medical_knowledge_base.category,
    medical_knowledge_base.pathology,
    medical_knowledge_base.content_text,
    1 - (medical_knowledge_base.embedding <=> query_embedding) AS similarity
  FROM medical_knowledge_base
  WHERE 1 - (medical_knowledge_base.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR filter_category = 'Todas' OR medical_knowledge_base.category = filter_category)
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- Nota para el Administrador:
-- Recuerda ir a "Storage" en tu panel de Supabase y crear un Bucket público llamado "medical_files"
