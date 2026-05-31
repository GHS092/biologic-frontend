import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, XCircle, Copy, CheckCircle2, Paperclip, Loader2, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../App';
import { invokeBackend } from '../services/gemini';

interface LiveDictationModalProps {
  onClose: () => void;
  onAttachContext: (text: string) => void;
}

export default function LiveDictationModal({ onClose, onAttachContext }: LiveDictationModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [copied, setCopied] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // New format state
  const [rawTranscriptCache, setRawTranscriptCache] = useState('');
  const [formattedTranscriptCache, setFormattedTranscriptCache] = useState('');
  const [isFormattedView, setIsFormattedView] = useState(false);
  const [hasFormattedOnce, setHasFormattedOnce] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        // Release mic
        stream.getTracks().forEach(track => track.stop());
        
        // Gemini API is strict about mime types. Remove the ;codecs=opus part if present.
        const cleanMimeType = audioBlob.type.split(';')[0];
        await processAudio(audioBlob, cleanMimeType);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setTranscript(''); // Clear previous
      
      // Reset format cache
      setRawTranscriptCache('');
      setFormattedTranscriptCache('');
      setIsFormattedView(false);
      setHasFormattedOnce(false);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("No se pudo acceder al micrófono. Por favor, revisa los permisos de tu navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Extraer solo la parte base64 sin el prefix data:audio/...;base64,
          const base64data = reader.result.split(',')[1];
          resolve(base64data);
        } else {
          reject(new Error("Error converting to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const renderFormattedText = (text: string) => {
    if (!text) return { __html: '' };
    
    const lines = text.split('\n');
    let inList = false;
    let htmlLines = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Negritas
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-700 dark:text-blue-400 font-bold">$1</strong>');
      
      // Listas
      if (line.trim().startsWith('* ')) {
        if (!inList) {
          htmlLines.push('<ul class="mb-3 space-y-1">');
          inList = true;
        }
        htmlLines.push(`<li class="ml-6 list-disc marker:text-blue-500">${line.trim().substring(2)}</li>`);
      } else if (line.trim().startsWith('- ')) {
        if (!inList) {
          htmlLines.push('<ul class="mb-3 space-y-1">');
          inList = true;
        }
        htmlLines.push(`<li class="ml-6 list-disc marker:text-blue-500">${line.trim().substring(2)}</li>`);
      } else {
        if (inList) {
          htmlLines.push('</ul>');
          inList = false;
        }
        if (line.trim() === '') {
          htmlLines.push('<div class="h-2"></div>'); 
        } else {
          htmlLines.push(`<p class="mb-2 leading-relaxed">${line}</p>`);
        }
      }
    }
    
    if (inList) {
      htmlLines.push('</ul>');
    }

    return { __html: htmlLines.join('') };
  };

  const processAudio = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    try {
      const base64Data = await blobToBase64(blob);
      const response = await invokeBackend('transcribeAudio', { 
        audioData: base64Data, 
        mimeType: mimeType 
      });
      if (typeof response === 'string') {
        setTranscript(response);
      } else if (response && response.data) {
        setTranscript(response.data);
      } else if (response) {
        setTranscript(String(response));
      }
    } catch (error: any) {
      alert("Error al transcribir: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const toggleFormatClinicalText = async () => {
    if (isFormattedView) {
      // Return to raw view
      setFormattedTranscriptCache(transcript);
      setTranscript(rawTranscriptCache);
      setIsFormattedView(false);
    } else {
      // Go to formatted view
      const currentRaw = transcript;
      setRawTranscriptCache(currentRaw);
      
      if (!hasFormattedOnce) {
        setIsFormatting(true);
        try {
          const response = await invokeBackend('formatClinicalText', { rawText: currentRaw });
          let formattedText = '';
          if (typeof response === 'string') {
            formattedText = response;
          } else if (response && response.data) {
            formattedText = response.data;
          } else if (response) {
            formattedText = String(response);
          }
          
          setTranscript(formattedText);
          setFormattedTranscriptCache(formattedText);
          setHasFormattedOnce(true);
          setIsFormattedView(true);
        } catch (error: any) {
          alert("Error al organizar el texto: " + error.message);
        } finally {
          setIsFormatting(false);
        }
      } else {
        // Use cached formatted text
        setTranscript(formattedTranscriptCache);
        setIsFormattedView(true);
      }
    }
  };

  const handleAttach = () => {
    if (transcript.trim()) {
      onAttachContext(transcript);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100/80 dark:bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-[#1a1c23] border border-black/10 dark:border-white/10 w-full max-w-xl flex flex-col shadow-2xl rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              isRecording ? "bg-red-500/10" : "bg-blue-500/10"
            )}>
              <Mic className={cn(
                "w-5 h-5",
                isRecording ? "text-red-500 animate-pulse" : "text-blue-500"
              )} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Asistente de Dictado Médico</h2>
              <p className="text-[10px] text-gray-500 font-mono">Powered by Gemini Neural Network</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col items-center justify-center gap-4 py-4 relative">
            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={cn(
                "relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300",
                isRecording 
                  ? "bg-red-500 hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.4)]" 
                  : "bg-gray-100 dark:bg-black/20 hover:bg-gray-200 dark:hover:bg-white/5 border border-black/10 dark:border-white/10",
                isProcessing && "opacity-50 cursor-not-allowed"
              )}
            >
              {isRecording && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-red-500/50 animate-ping" />
                  <div className="absolute inset-[-10px] rounded-full border border-red-500/20 animate-ping animation-delay-300" />
                </>
              )}
              {isRecording ? (
                <Square className="w-8 h-8 text-white fill-current" />
              ) : (
                <Mic className="w-10 h-10 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            <div className="flex flex-col items-center">
              <span className={cn(
                "text-xs font-bold tracking-widest uppercase mb-1",
                isRecording ? "text-red-500" : "text-gray-500 dark:text-gray-400"
              )}>
                {isRecording ? "Grabando Dictado..." : "Presiona para Hablar"}
              </span>
              {isRecording && (
                <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {formatTime(recordingTime)}
                </span>
              )}
            </div>

          </div>

          {/* Header del Textarea con Botón de Magia */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 w-full">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              {isFormattedView ? "Vista Previa Formateada" : "Transcripción en Crudo"}
            </span>
            {transcript.trim().length > 0 && !isRecording && (
              <button
                onClick={toggleFormatClinicalText}
                disabled={isFormatting}
                className="flex items-center justify-center gap-2 px-4 py-2 w-full sm:w-auto bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Organizar y Formatear Texto (1 Uso)"
              >
                {isFormatting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {isFormattedView ? 'Ver Original' : 'Organizar'}
                </span>
              </button>
            )}
          </div>

          <div className="relative flex-1 min-h-[160px]">
            {isProcessing && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-[#1a1c23]/80 backdrop-blur-sm rounded-lg border border-black/10 dark:border-white/10">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  Transcribiendo con Alta Precisión...
                </span>
                <span className="text-[10px] text-gray-500 mt-1">Conectando con red neuronal Gemini</span>
              </div>
            )}
            
            {isFormattedView ? (
              <div 
                className="w-full h-48 bg-white/50 dark:bg-black/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4 text-sm text-gray-800 dark:text-gray-200 overflow-y-auto shadow-inner"
                dangerouslySetInnerHTML={renderFormattedText(transcript)}
              />
            ) : (
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={isProcessing ? "Procesando audio de alta fidelidad..." : "El texto transcrito con precisión médica aparecerá aquí. Puedes editarlo antes de guardarlo."}
                className="w-full h-48 bg-gray-50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-lg p-4 text-sm text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                disabled={isProcessing}
              />
            )}
          </div>

          <div className="flex justify-between items-center gap-4">
            <button
              onClick={handleCopy}
              disabled={!transcript || isProcessing || isRecording}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? '¡Copiado!' : 'Copiar Texto'}
            </button>
            
            <button
              onClick={handleAttach}
              disabled={!transcript || isProcessing || isRecording}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center shadow-md"
            >
              <Paperclip className="w-4 h-4" />
              Adjuntar al Caso
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
