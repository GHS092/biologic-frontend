import { TribunalResult, Hypothesis, ReasoningStep, Session, KnowledgeConnection, AttachedFile, ClinicalResult, EpidemiologyResult, ImmunologyResult } from "../types";

// =========================================================================
// MÓDULO DE SEGURIDAD (CLIENTE-SERVIDOR)
// Todo el razonamiento complejo, embeddings y Prompts Secretos han sido
// migrados a la Nube (Carpeta /api/). Este archivo ahora solo actúa como
// puente de conexión seguro entre la interfaz visual y Vercel.
// =========================================================================

// Función interna genérica para llamar al backend
export async function invokeBackend(action: string, payload: any, onStepUpdate?: (step: ReasoningStep) => void): Promise<any> {
    try {
        // === KILL SWITCH CHECK ===
        if (localStorage.getItem('biologic_kill_switch') === 'true') {
            throw new Error("SISTEMA BLOQUEADO: Aplicación suspendida por el administrador de red.");
        }

        // Pseudo-Simulación Visual: Para mantener la interfaz fluida, enviamos notificaciones iniciales.
        if (onStepUpdate) {
            onStepUpdate({
                id: `proxy-start-${Date.now()}`,
                type: 'analysis',
                title: 'Conectando con Servidor Seguro',
                content: `Iniciando túnel encriptado en Nube. Nota: Si el motor de Modal VPS estaba inactivo, el encendido en frío del contenedor serverless de alto rendimiento puede demorar entre 5 a 10 segundos...`,
                confidence: 1.0,
                timestamp: Date.now()
            });
        }

        const headers: any = { 'Content-Type': 'application/json' };

        const response = await fetch('/api/invoke-gemini', {
            method: 'POST',
            headers,
            body: JSON.stringify({ action, payload }),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error HTTP ${response.status} en Backend.`);
        }

        const json = await response.json();
        
        // Polling para tareas pesadas
        if (json.taskId && json.status === "processing") {
            if (onStepUpdate) {
                onStepUpdate({
                    id: `proxy-poll-${Date.now()}`,
                    type: 'analysis',
                    title: 'Ejecución Asíncrona Iniciada',
                    content: `El análisis profundo ha comenzado (ID: ${json.taskId}). Monitorizando resultados en segundo plano para evitar cortes de red...`,
                    confidence: 1.0,
                    timestamp: Date.now()
                });
            }

            return await new Promise((resolve, reject) => {
                const pollInterval = setInterval(async () => {
                    try {
                        const statusRes = await fetch(`/api/invoke-gemini/status/${json.taskId}`, {
                            headers, credentials: 'include'
                        });
                        
                        if (!statusRes.ok) {
                            clearInterval(pollInterval);
                            reject(new Error(`Error al consultar estado: HTTP ${statusRes.status}`));
                            return;
                        }

                        const statusJson = await statusRes.json();
                        
                        if (statusJson.status === "completed") {
                            clearInterval(pollInterval);
                            if (onStepUpdate) {
                                onStepUpdate({
                                    id: `proxy-end-${Date.now()}`,
                                    type: 'verdict',
                                    title: 'Análisis Completado',
                                    content: 'Respuesta recibida criptográficamente desde el servidor.',
                                    confidence: 1.0,
                                    timestamp: Date.now()
                                });
                            }
                            resolve(statusJson.data);
                        } else if (statusJson.status === "error") {
                            clearInterval(pollInterval);
                            reject(new Error(statusJson.error || "Fallo en la tarea de procesamiento en segundo plano."));
                        }
                        // Si status es "processing", sigue esperando...
                    } catch (err) {
                        clearInterval(pollInterval);
                        reject(err);
                    }
                }, 3000); // Consultar cada 3 segundos
            });
        }
        
        if (onStepUpdate) {
            onStepUpdate({
                id: `proxy-end-${Date.now()}`,
                type: 'verdict',
                title: 'Análisis Completado',
                content: 'Respuesta recibida criptográficamente desde el servidor.',
                confidence: 1.0,
                timestamp: Date.now()
            });
        }

        return json.data;
    } catch (error: any) {
        console.error(`[Error Front-End] Fallo al invocar ${action}:`, error);
        throw error;
    }
}

export async function getStagingKnowledge() {
  return await invokeBackend('getStagingKnowledge', {});
}

export async function approveStagingKnowledge(id: string) {
  return await invokeBackend('approveStagingKnowledge', { id });
}

export async function rejectStagingKnowledge(id: string) {
  return await invokeBackend('rejectStagingKnowledge', { id });
}

export async function generateEmbedding(text: string): Promise<number[]> {
    return invokeBackend('generateEmbedding', { text });
}

export async function findRelevantSessions(currentTopic: string, sessions: Session[], topK: number = 2, currentMode?: string): Promise<{ relevant: Session[], random: Session | null }> {
    // PREVENCIÓN ERROR 413: Extraer solo los metadatos necesarios (id, topic, embedding, modo) sin las imágenes base64 ni historiales largos.
    const minimalSessions = sessions.map(s => ({
        id: s.id,
        topic: s.topic,
        embedding: s.embedding,
        mode: s.mode,
        summary: s.clinicalResult?.summary || s.epidemiologyResult?.summary || s.immunologyResult?.summary || s.tribunalResult?.summary || ""
    }));
    return invokeBackend('findRelevantSessions', { currentTopic, sessions: minimalSessions, topK, currentMode });
}

export async function runTribunal(topic: string, onStepUpdate: (step: ReasoningStep) => void, pastContext: string = "", attachedFiles?: AttachedFile[], region?: string, city?: string, searchCategory?: string): Promise<TribunalResult> {
    return invokeBackend('runTribunal', { topic, pastContext, attachedFiles, region, city, searchCategory }, onStepUpdate);
}

export async function runClinicalAnalysis(topic: string, onStepUpdate: (step: ReasoningStep) => void, pastContext: string = "", attachedFiles?: AttachedFile[], region?: string, city?: string, isDebateMode: boolean = false, searchCategory?: string, suspectedPathology?: string): Promise<ClinicalResult> {
    return invokeBackend('runClinicalAnalysis', { topic, pastContext, attachedFiles, region, city, isDebateMode, searchCategory, suspectedPathology }, onStepUpdate);
}

export async function runEpidemiologyAnalysis(topic: string, onStepUpdate: (step: ReasoningStep) => void, pastContext: string = "", attachedFiles?: AttachedFile[], region?: string, city?: string, searchCategory?: string): Promise<EpidemiologyResult> {
    return invokeBackend('runEpidemiologyAnalysis', { topic, pastContext, attachedFiles, region, city, searchCategory }, onStepUpdate);
}

export async function runImmunologyAnalysis(topic: string, onStepUpdate: (step: ReasoningStep) => void, pastContext: string = "", attachedFiles?: AttachedFile[], region?: string, city?: string, searchCategory?: string): Promise<ImmunologyResult> {
    return invokeBackend('runImmunologyAnalysis', { topic, pastContext, attachedFiles, region, city, searchCategory }, onStepUpdate);
}

export async function runDeltaAnalysis(patient: any, reports: any[], onStepUpdate: (step: ReasoningStep) => void): Promise<any> {
    return invokeBackend('runDeltaAnalysis', { patient, reports }, onStepUpdate);
}

export async function continueDebate(session: Session, userMessage: string, globalKnowledge: string = "", region?: string, city?: string): Promise<any> {
    // PREVENCIÓN ERROR 413: No enviar los archivos adjuntos (imágenes grandes) en el payload del chat
    const minimalSession = { ...session };
    delete minimalSession.attachedFiles; 
    
    // Si el chat es muy largo, podemos truncarlo para no saturar el payload, pero al menos quitar los archivos pesados salva el límite de 4.5MB
    return invokeBackend('continueDebate', { session: minimalSession, userMessage, globalKnowledge, region, city });
}

export async function expandHypothesis(hypothesis: Hypothesis, action: 'ensayo' | 'compuestos', globalKnowledge: string = "", session?: Session, region?: string, city?: string): Promise<string> {
    return invokeBackend('expandHypothesis', { hypothesis, action, globalKnowledge, session, region, city });
}

export async function auditRedundancy(id: string): Promise<any> {
    return invokeBackend('auditRedundancy', { id });
}
