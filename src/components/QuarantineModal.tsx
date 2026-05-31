import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, XCircle, Loader2, BookOpen, AlertTriangle, ExternalLink, Target, Lightbulb, Info } from 'lucide-react';
import { Session } from '../types';
import { getStagingKnowledge, approveStagingKnowledge, rejectStagingKnowledge, auditRedundancy } from '../services/gemini';

interface QuarantineModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
}

export default function QuarantineModal({ isOpen, onClose, session }: QuarantineModalProps) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [auditingId, setAuditingId] = useState<string | null>(null);
  const [auditReports, setAuditReports] = useState<Record<string, any>>({});

  useEffect(() => {
    if (isOpen) {
      loadStagingItems();
    }
  }, [isOpen]);

  const loadStagingItems = async () => {
    try {
      setIsLoading(true);
      const data = await getStagingKnowledge();
      
      const sessionItems = (data || []).filter((item: any) => 
        item.topic?.trim() === session.topic?.trim() ||
        item.context?.trim() === session.topic?.trim() ||
        (item.topic && session.title && item.topic.toLowerCase().includes(session.title.toLowerCase())) || 
        (session.title && item.topic && session.title.toLowerCase().includes(item.topic.toLowerCase()))
      );
      
      setItems(sessionItems);
    } catch (err: any) {
      setError('Error al cargar la cuarentena: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveStagingKnowledge(id);
      setItems(items.filter(i => i.id !== id));
    } catch (err) {
      alert('Error al aprobar: ' + err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectStagingKnowledge(id);
      setItems(items.filter(i => i.id !== id));
    } catch (err) {
      alert('Error al rechazar: ' + err);
    }
  };

  const handleAudit = async (id: string) => {
    try {
      setAuditingId(id);
      const report = await auditRedundancy(id);
      setAuditReports(prev => ({ ...prev, [id]: report }));
    } catch (err: any) {
      alert('Error en auditoría: ' + err.message);
    } finally {
      setAuditingId(null);
    }
  };

  const getSourceLink = (item: any) => {
    if (item.url) return item.url;
    
    // Extraer URL oculta inyectada por el Shadow Librarian
    if (item.content) {
      const match = item.content.match(/<!-- SOURCE_URL: (.*?) -->/);
      if (match && match[1]) return match[1].trim();
    }
    
    // Fallback original
    if (item.source === 'Radiopaedia') return `https://radiopaedia.org/search?q=${encodeURIComponent(item.title || '')}`;
    return `https://europepmc.org/search?query=${encodeURIComponent(item.title || '')}`;
  };

  const renderFormattedContent = (content: string) => {
    if (!content) return null;
    
    // Limpiar el tag de URL oculta para que no cause espacios en blanco extra
    const cleanContent = content.replace(/<!-- SOURCE_URL: .*? -->/g, '').trim();
    const lines = cleanContent.split('\n');
    return lines.map((line, i) => {
      // Tags de Alerta
      if (line.includes('🔴') || line.includes('RED DE SEGURIDAD')) {
        return (
          <div key={i} className="my-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2">
             <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
             <div>
               <span className="font-bold text-rose-600 dark:text-rose-400 text-xs tracking-wider uppercase">Red de Seguridad / Diferencial Atípico</span>
             </div>
          </div>
        );
      }
      if (line.includes('🟢') || line.includes('CONCORDANCIA CLÍNICA')) {
        return (
          <div key={i} className="my-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-2">
             <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
             <div>
               <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs tracking-wider uppercase">Concordancia Clínica</span>
             </div>
          </div>
        );
      }

      // Viñetas Analíticas
      if (line.includes('Similitud Crítica:')) {
        const text = line.replace(/\*\s*📌?\s*\*\*Similitud Crítica:\*\*/g, '').trim();
        return (
          <div key={i} className="mb-2 pl-3 border-l-2 border-blue-500 flex gap-2">
            <Target className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-semibold text-blue-600 dark:text-blue-400">Similitud Crítica:</span> {text}</p>
          </div>
        );
      }
      if (line.includes('Divergencia / Brecha:')) {
        const text = line.replace(/\*\s*⚠️?\s*\*\*Divergencia \/ Brecha:\*\*/g, '').trim();
        return (
          <div key={i} className="mb-4 pl-3 border-l-2 border-amber-500 flex gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-semibold text-amber-600 dark:text-amber-400">Divergencia / Brecha:</span> {text}</p>
          </div>
        );
      }

      // Texto regular con negritas básicas
      if (line.trim() !== '') {
         const boldParsed = line.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
           if (part.startsWith('**') && part.endsWith('**')) {
             return <strong key={idx} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
           }
           return part;
         });
         return <p key={i} className="mb-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{boldParsed}</p>;
      }
      return null;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#12141a] rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[85vh] flex flex-col border border-black/10 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-black/10 dark:border-white/10 bg-amber-500/10 dark:bg-amber-500/5 gap-3 sm:gap-0 relative">
          <div className="flex items-center gap-3 pr-8 sm:pr-0">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex shrink-0 items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Bandeja de Asimilación (Cuarentena)
              </h2>
              <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 font-mono truncate max-w-[200px] sm:max-w-md">
                Revisión humana requerida para: {session.title}
              </p>
            </div>
          </div>
          <div className="absolute right-2 top-2 sm:relative sm:right-auto sm:top-auto flex items-center gap-1">
            <button 
              onClick={() => setShowInfoModal(true)} 
              title="Información de Etiquetas"
              className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
            >
              <Info className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-500 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-gray-50 dark:bg-[#0f1115]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-4 text-amber-600">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs font-mono uppercase tracking-widest">Consultando Cuarentena...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-500 text-sm">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
              <CheckCircle2 className="w-12 h-12 opacity-20" />
              <p className="text-xs font-mono uppercase tracking-widest text-center px-4">No hay hallazgos en cuarentena para este caso.</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {items.map((item) => (
                <div key={item.id} className="bg-white dark:bg-[#1a1d24] border border-black/10 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-3 sm:p-4 border-b border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-black/20">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                      <div className="w-full sm:w-auto">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 leading-tight">
                          {item.macro_category} - {item.micro_pathology || item.topic}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex w-full sm:w-auto items-center gap-2">
                        <button 
                          onClick={() => handleReject(item.id)}
                          className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-md transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Rechazar
                        </button>
                        <button 
                          onClick={() => handleApprove(item.id)}
                          className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded-md transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar e Inyectar
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-4 space-y-4">
                    {item.title && (
                      <div className="mb-4">
                        <h4 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200 leading-tight">
                          {item.title}
                        </h4>
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-medium">
                            Fuente: {item.source || 'Europe PMC'}
                          </span>
                          <a 
                            href={getSourceLink(item)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
                          >
                            Ver original <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    {item.content && (
                      <div>
                        <h4 className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" /> Análisis Literario
                        </h4>
                        <div className="p-3 sm:p-4 bg-gray-50/50 dark:bg-[#12141a]/50 border border-black/5 dark:border-white/5 rounded-lg max-h-[40vh] overflow-y-auto mb-4">
                          {renderFormattedContent(item.content)}
                        </div>

                        {/* SECCIÓN DE AUDITORÍA DE REDUNDANCIA */}
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg overflow-hidden">
                          {!auditReports[item.id] ? (
                            <div className="p-3 sm:p-4 flex items-center justify-between gap-4">
                              <div>
                                <h5 className="text-sm font-bold text-blue-900 dark:text-blue-300">Auditoría de Utilidad</h5>
                                <p className="text-xs text-blue-700 dark:text-blue-400/80 mt-0.5">Compara este artículo contra la base de datos principal para evitar redundancias.</p>
                              </div>
                              <button
                                onClick={() => handleAudit(item.id)}
                                disabled={auditingId === item.id}
                                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                              >
                                {auditingId === item.id ? (
                                  <><Loader2 className="w-4 h-4 animate-spin" /> Auditando...</>
                                ) : (
                                  <>🔍 Auditar contra Base Principal</>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="p-4 space-y-4">
                              <h5 className="text-sm font-bold text-gray-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-2">Resultado de la Auditoría</h5>
                              
                              <div className="space-y-3">
                                <div>
                                  <h6 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500"/> Lo que aporta de nuevo (Diferencias)</h6>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{auditReports[item.id].diferencias_valor}</p>
                                </div>
                                
                                <div>
                                  <h6 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><BookOpen className="w-3 h-3 text-blue-500"/> Lo que ya sabíamos (Coincidencias)</h6>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{auditReports[item.id].coincidencias}</p>
                                </div>

                                <div className={`p-3 rounded-lg border ${auditReports[item.id].veredicto === 'Aprobar' ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/30' : 'bg-rose-50/50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800/30'}`}>
                                  <h6 className={`text-xs font-bold uppercase ${auditReports[item.id].veredicto === 'Aprobar' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                    Veredicto del Agente: {auditReports[item.id].veredicto}
                                  </h6>
                                  <p className={`text-sm mt-1 ${auditReports[item.id].veredicto === 'Aprobar' ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>
                                    {auditReports[item.id].razon_veredicto}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Información de Etiquetas */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#12141a] rounded-xl shadow-2xl w-full max-w-md border border-black/10 dark:border-white/10 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-black/10 dark:border-white/10 flex justify-between items-center bg-blue-50 dark:bg-blue-500/5">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Guía de Alineación Clínica
              </h3>
              <button onClick={() => setShowInfoModal(false)} className="text-gray-500 hover:text-rose-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                El Bibliotecario analiza la literatura entrante y la compara con tu sospecha original, asignando etiquetas semánticas de colores. <strong>Estos colores no miden la confiabilidad del artículo, sino su nivel de coincidencia con tu diagnóstico.</strong>
              </p>
              
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mb-1">CONCORDANCIA CLÍNICA (Verde)</h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300">El artículo confirma tu hipótesis. Habla exactamente de la misma patología o mecanismo fisiopatológico que sospechas.</p>
                </div>
              </div>

              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-rose-700 dark:text-rose-400 text-sm mb-1">RED DE SEGURIDAD (Rojo)</h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300">¡Alerta de Diferencial! El artículo describe una patología DIFERENTE que simula síntomas idénticos a tu sospecha. Ayuda a evitar el efecto túnel.</p>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-1">ALERTA DE COMPLICACIÓN (Amarillo)</h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300">Confirma tu sospecha, pero enfoca la atención en una complicación grave o progresión fatal que debes prevenir inmediatamente.</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-black/10 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex justify-end">
              <button 
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
