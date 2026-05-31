-- Script de Migración para añadir Etiqueta Diagnóstica a la Memoria Evolutiva Global
-- Ejecuta este script en el SQL Editor de tu panel de Supabase

ALTER TABLE memoria_evolutiva_global 
ADD COLUMN etiqueta_diagnostica TEXT;

-- Opcional: Agregar un comentario para documentar la columna
COMMENT ON COLUMN memoria_evolutiva_global.etiqueta_diagnostica IS 'Almacena el diagnóstico confirmado (ej. Toxoplasmosis) para evitar cruces de fenotipos visuales idénticos en el motor RAG.';
