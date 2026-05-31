import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Database, Upload, FileText, Activity, Layers, Link as LinkIcon, Loader2, CheckCircle2 } from 'lucide-react';

interface MedicalLibraryModalProps {
  onClose: () => void;
}

export default function MedicalLibraryModal({ onClose }: MedicalLibraryModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Inmunología');
  const [pathology, setPathology] = useState('');
  const [rawText, setRawText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<{name: string, data: string, type: string, mimeType?: string}[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const categories = [
    'Inmunología', 'Cardiología', 'Neurología', 'Oncología', 'Infectología', 'Reumatología', 'Gastroenterología',
    'Medicina Interna', 'Pediatría', 'Cirugía General', 'Tórax', 'Abdomen', 'Hombro y Cadera', 'Cráneo', 'Mamografía'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !pathology || !rawText || !adminPassword) {
      setError('Por favor llena los campos obligatorios, incluyendo la Llave de Seguridad.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const authRes = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password: adminPassword }),
        credentials: 'include'
      });
      const authData = await authRes.json();
      if (!authRes.ok || !authData.success) throw new Error(authData.error || 'Llave de Seguridad Incorrecta');

      const response = await fetch('/api/invoke-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'library-process',
          payload: {
            title,
            category,
            pathology,
            rawText,
            description: rawText.substring(0, 100) + '...',
            fileUrl,
            attachedFiles: selectedFiles
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error de servidor');

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTitle('');
        setPathology('');
        setRawText('');
        setFileUrl('');
        setSelectedFiles([]);
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) processFiles(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) processFiles(files);
  };

  const processFiles = (files: File[]) => {
    const validFiles = files.filter(f => f.size <= 4 * 1024 * 1024);
    if (validFiles.length < files.length) {
      setError('Algunos archivos superan el límite de 4MB y fueron omitidos.');
    }

    const filePromises = validFiles.map(file => {
      return new Promise<{name: string, data: string, type: string, mimeType: string}>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const base64Data = dataUrl.split(',')[1];
          resolve({
            name: file.name,
            data: base64Data,
            type: file.type,
            mimeType: file.type
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then(processedFiles => {
      setSelectedFiles(prev => [...prev, ...processedFiles]);
      setError('');
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-[#0a0a0c] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10 flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">Biblioteca Médica</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ingesta de Casos y Documentos para Agente Bibliotecario (RAG)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500 dark:text-gray-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          
          {success ? (
             <div className="h-full flex flex-col items-center justify-center space-y-4 py-12">
               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10" />
               </motion.div>
               <h3 className="text-xl font-bold text-gray-900 dark:text-white">¡Conocimiento Indexado!</h3>
               <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                 El caso ha sido procesado, transformado en vectores matemáticos (Embeddings) y almacenado en Supabase para futuras consultas semánticas.
               </p>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Bloque Superior: Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Título del Documento/Caso
                  </label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ej. Caso Clínico Lupus Severo 2026..."
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Layers className="w-4 h-4" /> Categoría (Macro)
                    </label>
                    <select 
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Patología (Micro)
                    </label>
                    <input 
                      type="text" 
                      value={pathology}
                      onChange={e => setPathology(e.target.value)}
                      placeholder="Ej. Lupus, AR..."
                      className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque Texto */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center justify-between">
                  <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Caso Clínico / Texto Médico</span>
                  <span className="text-rose-500">* Obligatorio para Generar Vectores</span>
                </label>
                <textarea 
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Pega aquí el contenido del texto que quieres que el Agente Bibliotecario lea e indexe..."
                  className="w-full h-48 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-4 text-sm focus:border-blue-500 outline-none resize-none font-mono"
                />
              </div>

              {/* Bloque Archivos Drag & Drop */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-6">
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-4 uppercase tracking-wider">
                  <Upload className="w-4 h-4" /> Archivos Adjuntos Físicos (Opcional)
                </h3>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mb-4">
                  Arrastra un PDF, JPG o PNG para almacenarlo físicamente en el Bucket de Supabase. El sistema lo subirá automáticamente. (Límite 4MB).
                </p>
                
                <div 
                  className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer relative ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-blue-200 dark:border-blue-500/30 hover:bg-white/5'}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    onChange={handleFileChange}
                    accept=".pdf,image/jpeg,image/png"
                    multiple
                  />
                  {selectedFiles.length > 0 ? (
                    <div className="flex flex-col items-center text-emerald-600 dark:text-emerald-400 p-2 overflow-y-auto max-h-full w-full">
                      <span className="text-sm font-bold mb-2">{selectedFiles.length} archivo(s) listo(s)</span>
                      <div className="flex flex-wrap gap-2 justify-center w-full">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-1 bg-white dark:bg-black/40 px-2 py-1 rounded text-xs border border-emerald-500/20 max-w-[150px]">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span className="truncate">{file.name}</span>
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFile(idx); }} className="ml-1 text-rose-500 hover:text-rose-700 shrink-0">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                      <Upload className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-sm font-bold">Arrastra tus archivos aquí o haz clic</span>
                      <span className="text-xs opacity-70">PDF, JPG, PNG (&lt; 4MB) - Múltiples permitidos</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4">
                   <span className="text-xs font-bold text-gray-400 uppercase">O usa un enlace externo:</span>
                   <input 
                      type="text" 
                      value={fileUrl}
                      onChange={e => setFileUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-white dark:bg-black/40 border border-blue-200 dark:border-blue-500/30 rounded-lg p-2 text-xs focus:border-blue-500 outline-none"
                    />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-200 dark:border-red-500/20">
                  {error}
                </div>
              )}

              {/* Bloque de Seguridad */}
              <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                 <div className="space-y-1">
                   <label className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Llave de Seguridad (Admin)</label>
                   <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70">Requerida para inyectar conocimientos en la base de datos.</p>
                 </div>
                 <input 
                   type="password"
                   value={adminPassword}
                   onChange={e => setAdminPassword(e.target.value)}
                   placeholder="••••••••"
                   className="w-full sm:w-48 bg-white dark:bg-black/40 border border-rose-200 dark:border-rose-500/30 rounded-lg p-2 text-sm focus:border-rose-500 outline-none text-center tracking-widest text-gray-900 dark:text-white"
                 />
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
                 <button type="button" onClick={onClose} className="px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                   Cancelar
                 </button>
                 <button 
                   type="submit" 
                   disabled={isSubmitting}
                   className="px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                 >
                   {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</> : <><Database className="w-4 h-4" /> Guardar</>}
                 </button>
              </div>

            </form>
          )}

        </div>
      </motion.div>
    </div>
  );
}
