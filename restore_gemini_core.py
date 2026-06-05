import os

backup_file = r'c:\Users\PC\Downloads\proyecto-medico-ia\biologic-backend-modal\api_utils\gemini_core_backup.py'
core_file = r'c:\Users\PC\Downloads\proyecto-medico-ia\biologic-backend-modal\api_utils\gemini_core.py'

with open(backup_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Apply the logic changes that were made in the corrupted file

# Change 1
old1 = "f\"- ¿Simetría Perfecta?: {scanner_result.get('lateral_structures_audit', {}).get('is_perfectly_symmetrical_in_size', '')}\\n\""
new1 = "f\"- Homogeneidad Bilateral: {scanner_result.get('lateral_structures_audit', {}).get('bilateral_homogeneity_check', {}).get('left_vs_right_density_match', '')}\\n\""
content = content.replace(old1, new1)

# Change 2
old2 = "Test de Plano de Clivaje dice 'Sin línea de separación/Fusionado', estás OBLIGADO"
new2 = "Test de Plano de Clivaje dice 'Línea de grasa interrumpida o borrada en algún punto de contacto' o 'Ausencia total de plano de separación/Fusión completa', estás OBLIGADO"
content = content.replace(old2, new2)

# Change 3
old3 = "asimetría ('NO' en simetría perfecta) y un órgano está 'Borrado/Fusionado' o sin plano de clivaje, ESTÁS OBLIGADO"
new3 = "la homogeneidad bilateral presenta distorsión y un órgano está 'Borrado/Fusionado' o el plano de clivaje está interrumpido, ESTÁS OBLIGADO"
content = content.replace(old3, new3)

# Change 4
old4 = "debate_response = await with_retry_and_timeout(run_debate, 60000, \"Junta Médica (Red Team)\", 1)"
new4 = "debate_response = await with_retry_and_timeout(run_debate, 120000, \"Junta Médica (Red Team)\", 1)"
content = content.replace(old4, new4)

# I should also fix the embedding model to be gemini-embedding-001 since the logs show text-embedding-004 fails!
# "[Embedding System] REST Error con text-embedding-004: 404"
# I saw this in the user's latest logs: "models/text-embedding-004 is not found for API version v1beta"
# Oh wait, the backend uses `text-embedding-004` but that model requires v1beta and maybe they don't have it, or it should be `models/text-embedding-004`.
# Let's replace 'text-embedding-004' with 'models/text-embedding-004'
content = content.replace("'text-embedding-004'", "'models/text-embedding-004'")

with open(core_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Restoration and patching complete!")
