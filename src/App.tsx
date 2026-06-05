/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Activity,
  Brain,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Zap,
  Terminal,
  Swords,
  ShieldAlert,
  Menu,
  MessageSquare,
  Save,
  Download,
  Upload,
  Trash2,
  Send,
  Beaker,
  Pill,
  Network,
  FileText,
  Paperclip,
  Copy,
  Scan,
  Moon,
  Sun,
  MoreVertical,
  Pin,
  Pencil,
  Globe,
  HelpCircle,
  Settings,
  ChevronUp,
  ChevronDown,
  MapPin,
  Microscope,
  ImageIcon,
  CheckSquare,
  Share2,
  Check,
  Mic,
  UserPlus,
  X,
  RefreshCw,
  Clock,
  TrendingUp,
  DollarSign,
  Gavel,
  User,
  Users,
  BarChart3,
  Scale,
  FolderOpen,
  AlertTriangle,
  Database,
  Library,
  LogOut,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { default as OriginalReactMarkdown } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { runTribunal, continueDebate, expandHypothesis, findRelevantSessions, generateEmbedding, runClinicalAnalysis, runEpidemiologyAnalysis, runImmunologyAnalysis, runDeltaAnalysis, invokeBackend } from './services/gemini';
import { TribunalResult, ReasoningStep, Session, ChatMessage, Hypothesis, AttachedFile, ClinicalResult, EpidemiologyResult, ImmunologyResult, Patient, ArchivedReport, DeltaAnalysisResult } from './types';
import { saveSession, getSessions, deleteSession, savePatient, getPatient, getAllPatients, saveArchivedReport, getPatientReports, deleteArchivedReport, deletePatient, clearAllData, setDbUser } from './services/db';
import MedicalLibraryModal from './components/MedicalLibraryModal';
import NewPatientModal from './components/NewPatientModal';
import ApiDashboard from './components/ApiDashboard';
import LiveDictationModal from './components/LiveDictationModal';
import QuarantineModal from './components/QuarantineModal';
import Login from './components/Login';
import { applyMedicalHeatmap } from './utils/imageProcessing';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatBoardSummary = (text: string) => {
  if (!text) return '';
  let formatted = text.replace(/\\n/g, '\n');
  // Convert inline numbers like "1) " or "1. " into proper markdown lists with newlines
  formatted = formatted.replace(/(\.|\:)\s+(\d+)[\)\.]\s+/g, '$1\n\n$2. ');
  // Handle case where it might just be space separated
  formatted = formatted.replace(/(?<!\n)\s+(\d+)[\)\.]\s+/g, '\n\n$1. ');
  return formatted;
};

const ReactMarkdown = ({ children, className, remarkPlugins, components }: any) => {
  // Format [PMID: 123456] into markdown links
  const formattedText = typeof children === 'string'
    ? children.replace(/\[PMID:\s*(\d+)\](?!\()/gi, '[PMID: $1](https://pubmed.ncbi.nlm.nih.gov/$1/)')
    : children;

  const markdownContent = (
    <OriginalReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={[rehypeRaw]}
      urlTransform={(value: string) => value}
      components={{
        ...components,
        a: ({ node, ...props }: any) => (
          <a {...props} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium" />
        ),
        img: ({ node, ...props }: any) => (
          <img {...props} className="max-h-96 w-auto object-contain rounded shadow-sm mx-auto" />
        ),
        ul: ({ node, ...props }: any) => (
          <ul {...props} className="list-none space-y-2 my-4" />
        ),
        ol: ({ node, ...props }: any) => (
          <ol {...props} className="list-none space-y-3 my-4" style={{ counterReset: 'item' }} />
        ),
        li: ({ node, children, ...props }: any) => {
          // Check if it's inside an ordered list
          const isOrdered = node?.parent?.tagName === 'ol';

          if (isOrdered) {
            return (
              <li {...props} className="relative !pl-8 before:content-[counter(item)] before:[counter-increment:item] before:absolute before:!left-0 before:flex before:items-center before:justify-center before:w-6 before:h-6 before:bg-orange-100 dark:before:bg-orange-900/30 before:text-orange-600 dark:before:text-orange-400 before:text-xs before:font-bold before:rounded-full before:!top-0.5">
                {children}
              </li>
            );
          }

          // Unordered list item
          return (
            <li {...props} className="relative !pl-6 before:content-[''] before:absolute before:!left-1 before:!top-[0.6em] before:w-1.5 before:h-1.5 before:bg-cyan-500 before:rounded-full">
              {children}
            </li>
          );
        },
        p: ({ node, ...props }: any) => (
          <p {...props} className="mb-4 last:mb-0" />
        ),
        strong: ({ node, ...props }: any) => (
          <strong {...props} className="font-semibold text-gray-900 dark:text-gray-100" />
        )
      }}
    >
      {formattedText}
    </OriginalReactMarkdown>
  );

  if (className) {
    return <div className={className}>{markdownContent}</div>;
  }

  return markdownContent;
};

const MemoryValidationWidget = ({
  msgId, onApprove, onReject, status, hasPendingTransition, onRetryTransition, isReconstructing, isProcessing
}: {
  msgId: string,
  onApprove: (id: string, rating: number, note: string) => void,
  onReject: (id: string) => void,
  status?: 'pending' | 'approved' | 'rejected',
  hasPendingTransition?: boolean,
  onRetryTransition?: () => void,
  isReconstructing?: boolean,
  isProcessing?: boolean
}) => {
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState('');

  if (status === 'approved') return (
    <div className="flex flex-col gap-3">
      <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg flex items-center justify-center gap-2 shadow-sm">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Validado e Inyectado en Memoria Global</span>
      </div>

      {hasPendingTransition && onRetryTransition && (
        <div className="p-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg shadow-sm flex flex-col gap-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed text-center">
            <strong>Transacción Pendiente:</strong> Hubo un problema de conexión al generar el nuevo reporte. Tus datos y archivos están a salvo. Al presionar el botón se reintentará regenerar el nuevo reporte de mayor nivel.
          </p>
          <button
            onClick={onRetryTransition}
            disabled={isReconstructing}
            className="flex items-center justify-center gap-2 py-2.5 px-4 w-full rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-sm transition-all disabled:opacity-50"
          >
            {isReconstructing ? <Zap className="w-4 h-4 animate-pulse" /> : <RefreshCw className="w-4 h-4" />}
            {isReconstructing ? 'Reconstruyendo...' : 'Reintentar Generación de Reporte'}
          </button>
        </div>
      )}
    </div>
  );

  if (status === 'rejected') return (
    <div className="mt-6 p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg flex items-center justify-center gap-2">
      <XCircle className="w-4 h-4 text-gray-400" />
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hallazgo Descartado</span>
    </div>
  );

  return (
    <div className="mt-6 p-5 bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-white/10 rounded-xl flex flex-col gap-5 font-sans shadow-sm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-100 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm text-gray-900 dark:text-white font-bold uppercase tracking-widest">Auditoría de Aprendizaje</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Certeza:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`transition-colors text-lg focus:outline-none ${rating >= star ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600 hover:text-amber-200'}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </div>

      <textarea
        placeholder="Añadir observaciones clínicas al expediente (opcional)..."
        value={note}
        onChange={e => setNote(e.target.value)}
        className="bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full min-h-[80px] resize-none"
      />

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={() => onReject(msgId)}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white dark:bg-[#1a1c23] hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
          Descartar
        </button>
        <button
          onClick={() => onApprove(msgId, rating, note)}
          disabled={isProcessing}
          className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? <Zap className="w-4 h-4 animate-pulse" /> : <Check className="w-4 h-4" />}
          {isProcessing ? 'Procesando...' : 'Aprobar y Enmendar Reporte'}
        </button>
      </div>
    </div>
  );
};

const generateMarkdownFromReport = (report: any) => {
  if (!report || !report.fullData) return "*No hay datos disponibles para previsualizar.*";
  try {
    let md = "";

    // -- IMÁGENES/ARCHIVOS ADJUNTOS --
    if (report.attachedFiles && report.attachedFiles.length > 0) {
      const images = report.attachedFiles.filter((f: any) => f.mimeType.startsWith('image/'));
      if (images.length > 0) {
        md += `<div class="mb-6 p-6 sm:p-8 bg-white dark:bg-[#1a1c23] border-l-4 border-indigo-500 rounded-r-xl shadow-sm">\n\n`;
        md += `<h2 class="text-xl font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">`;
        md += `🖼️ Imágenes Analizadas</h2>\n\n`;
        md += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">\n`;
        images.forEach((file: any) => {
          md += `<div class="flex justify-center bg-black/5 dark:bg-white/5 p-4 rounded-md border border-black/10 dark:border-white/10">\n\n`;
          md += `![${file.name || 'foto'}](data:${file.mimeType};base64,${file.data})\n\n`;
          md += `</div>\n`;
        });
        md += `</div>\n\n`;
        md += `</div>\n\n`;
      }
    }

    // Función recursiva básica para convertir datos restantes
    const jsonToMd = (obj: any, depth = 0): string => {
      if (obj === null || obj === undefined) return "";
      let result = "";
      const indent = "  ".repeat(depth);

      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            result += `\n${indent}**[Elemento ${index + 1}]**\n${jsonToMd(item, depth + 1)}\n`;
          } else {
            result += `${indent}- ${item}\n`;
          }
        });
      } else if (typeof obj === 'object') {
        const entries = Object.entries(obj);
        // Si el objeto está vacío, no imprimimos nada
        if (entries.length === 0) return "";

        entries.forEach(([k, v]) => {
          const keyName = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          if (v && typeof v === 'object' && Object.keys(v).length > 0) {
            // Si es un objeto, poner newline
            result += `\n${indent}**${keyName}:**\n${jsonToMd(v, depth + 1)}`;
          } else if (v !== null && v !== undefined && v !== "") {
            result += `${indent}**${keyName}:** ${String(v)}\n`;
          }
        });
      } else {
        result += `${indent}${obj}\n`;
      }
      return result;
    };

    // -- ESTILOS CLÍNICOS --
    if (report.type === 'clinical') {
      const data = report.fullData;

      md += `<div class="mb-6 p-6 sm:p-8 bg-cyan-50/50 dark:bg-cyan-900/10 border-l-4 border-cyan-500 rounded-r-xl shadow-sm">\n\n`;
      md += `<h2 class="text-xl font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">`;
      md += `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
      md += `Resumen Clínico Clínico</h2>\n\n`;
      md += `<div class="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">${data.summary}</div>\n\n`;
      md += `</div>\n\n`;

      if (data.interventionPriority) {
        md += `<div class="mb-6 p-5 bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg shadow-sm">\n\n`;
        md += `<h4 class="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 uppercase mb-3 flex items-center gap-2">`;
        md += `🚨 PRIORIDAD DE INTERVENCIÓN (ACCIÓN CERO)</h4>\n\n`;
        md += `**${data.interventionPriority.actionZero}**\n\n`;
        md += `*${data.interventionPriority.rationale}*\n\n`;
        md += `<span class="mt-3 inline-block px-3 py-1 text-[10px] font-black uppercase rounded bg-rose-200 text-rose-800 border border-rose-300">Urgencia: ${data.interventionPriority.urgency}</span>\n\n`;
        md += `</div>\n\n`;
      }

      if (data.redFlags && data.redFlags.length > 0) {
        md += `<div class="mb-8 p-6 bg-white dark:bg-black/20 border border-rose-100 dark:border-rose-900/30 rounded-xl">\n\n`;
        md += `<h3 class="text-lg font-bold text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">🚩 Banderas Rojas (Descartar Inmediatamente)</h3>\n\n`;
        data.redFlags.forEach((f: any) => {
          md += `<div class="mb-4 p-4 border border-rose-200 dark:border-rose-800 rounded-lg bg-rose-50/30 dark:bg-rose-900/10">\n`;
          md += `<p class="font-bold text-rose-700 dark:text-rose-400 text-sm mb-1">${f.condition}</p>\n`;
          md += `<p class="text-sm text-gray-700 dark:text-gray-300">${f.rationale}</p>\n`;
          md += `</div>\n\n`;
        });
        md += `</div>\n\n`;
      }

      if (data.differentialDiagnoses && data.differentialDiagnoses.length > 0) {
        md += `<div class="mb-8">\n\n`;
        md += `<h3 class="text-lg font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">🔍 Diagnósticos Diferenciales</h3>\n\n`;

        md += `<div class="grid grid-cols-1 gap-4">\n`;
        data.differentialDiagnoses.forEach((d: any) => {
          let probColor = d.probability === 'alta' ? 'bg-rose-100 text-rose-700 border-rose-200' : d.probability === 'media' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
          md += `<div class="p-5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1c23] rounded-lg shadow-sm flex flex-col sm:flex-row gap-4">\n`;
          md += `<div class="w-full sm:w-1/4">\n`;
          md += `<span class="px-2 py-1 text-[10px] uppercase font-black tracking-wider rounded border ${probColor}">Probabilidad ${d.probability}</span>\n`;
          md += `<p class="font-bold text-gray-900 dark:text-white mt-3">${d.condition}</p>\n`;
          md += `</div>\n`;
          md += `<div class="w-full sm:w-3/4 text-sm text-gray-600 dark:text-gray-300 border-l-0 sm:border-l border-gray-100 dark:border-gray-800 sm:pl-4">\n`;
          md += `${d.rationale}\n`;
          md += `</div>\n`;
          md += `</div>\n\n`;
        });
        md += `</div>\n\n`;
        md += `</div>\n\n`;
      }

      if (data.workup && Array.isArray(data.workup) && data.workup.length > 0) {
        md += `<div class="mb-6 p-6 bg-[#1e293b] text-gray-100 rounded-xl shadow-inner border border-gray-700">\n\n`;
        md += `<h3 class="text-emerald-400 font-mono text-sm uppercase tracking-widest mb-4">🧪 Plan de Trabajo (Workup)</h3>\n\n`;
        md += `<div class="space-y-4">\n`;
        data.workup.forEach((w: any) => {
          md += `<div>\n`;
          md += `<h4 class="font-bold text-emerald-300 uppercase text-xs tracking-wider mb-2">${w.category}</h4>\n`;
          if (w.tests && Array.isArray(w.tests)) {
            md += `<ul class="list-disc pl-5 text-gray-300 text-sm space-y-1">\n`;
            w.tests.forEach((t: string) => {
              md += `<li>${t}</li>\n`;
            });
            md += `</ul>\n`;
          }
          if (w.rationale) {
            md += `<p class="mt-2 text-xs text-gray-400 italic">${w.rationale}</p>\n`;
          }
          md += `</div>\n`;
        });
        md += `</div>\n`;
        md += `</div>\n\n`;
      }

      // Anexar todo el resto de propiedades que no son las anteriores
      const handledKeys = ['summary', 'interventionPriority', 'redFlags', 'differentialDiagnoses', 'workup'];
      const remaining: any = {};
      Object.keys(data).forEach(k => {
        if (!handledKeys.includes(k)) remaining[k] = data[k];
      });
      if (Object.keys(remaining).length > 0) {
        md += `<div class="mb-6 p-6 bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">\n\n`;
        md += `<h3 class="text-gray-500 font-bold uppercase tracking-widest mb-4">📑 Datos Adicionales</h3>\n\n`;
        md += jsonToMd(remaining);
        md += `</div>\n\n`;
      }

      return md;
    }

    // -- ESTILOS INVESTIGADOR/TRIBUNAL --
    if (report.type === 'investigator') {
      const data = report.fullData;
      md += `<div class="mb-6 p-6 sm:p-8 bg-emerald-50/50 dark:bg-emerald-900/10 border-l-4 border-emerald-500 rounded-r-xl shadow-sm">\n\n`;
      md += `<h2 class="text-xl font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-4">Reporte Investigador: ${report.topic}</h2>\n\n`;
      md += `<div class="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">${data.summary}</div>\n\n`;
      md += `</div>\n\n`;

      if (data.survivingHypotheses && data.survivingHypotheses.length > 0) {
        md += `<h3 class="text-lg font-bold text-emerald-600 uppercase mb-4">✨ Hipótesis Sobrevivientes</h3>\n\n`;
        data.survivingHypotheses.forEach((h: any) => {
          md += `<div class="mb-4 p-5 bg-white dark:bg-black/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg">\n`;
          md += `<h4 class="font-bold text-gray-900 dark:text-white">${h.statement}</h4>\n`;
          md += `<p class="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">${h.rationale}</p>\n`;
          md += `<div class="mt-3"><span class="px-2 py-1 text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded font-bold">Novedad: ${h.noveltyScore}/10</span></div>\n`;
          md += `</div>\n\n`;
        });
      }

      const handledInvKeys = ['summary', 'survivingHypotheses'];
      const remainingInv: any = {};
      Object.keys(data).forEach(k => {
        if (!handledInvKeys.includes(k)) remainingInv[k] = data[k];
      });
      if (Object.keys(remainingInv).length > 0) {
        md += `<div class="mb-6 p-6 bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">\n\n`;
        md += `<h3 class="text-gray-500 font-bold uppercase tracking-widest mb-4">📑 Datos Adicionales</h3>\n\n`;
        md += jsonToMd(remainingInv);
        md += `</div>\n\n`;
      }
      return md;
    }

    // -- FALLBACK / OTROS --
    md += `<div class="p-6 bg-white dark:bg-[#1a1c23] rounded-xl border border-gray-200 dark:border-gray-800">\n\n`;
    md += `<h2 class="text-xl font-black mb-4 uppercase tracking-widest">${report.topic}</h2>\n\n`;
    if (report.summary) md += `<div class="p-4 bg-gray-50 dark:bg-white/5 rounded-lg mb-6">${report.summary}</div>\n\n`;

    md += `### Detalles Estructurales\n\n`;
    md += jsonToMd(report.fullData);
    md += `</div>\n\n`;

    return md;
  } catch (e) {
    return "Error al procesar el reporte.";
  }
};

const MOCK_REASONING_DATA = [
  { time: '0s', confidence: 0.1, complexity: 20 },
  { time: '2s', confidence: 0.3, complexity: 45 },
  { time: '4s', confidence: 0.45, complexity: 60 },
  { time: '6s', confidence: 0.7, complexity: 85 },
  { time: '8s', confidence: 0.85, complexity: 70 },
  { time: '10s', confidence: 0.92, complexity: 50 },
];

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-gray-500 dark:text-white/40 hover:text-gray-700 dark:text-white/80 transition-colors rounded hover:bg-black/5 dark:bg-white/5"
      title="Copiar reporte"
    >
      {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
};


const healText = (text: string) => {
  if (!text || typeof text !== 'string') return text;
  
  // Bugfix: Gemini 2.5 Flash under heavy load produces Z, Y, n, p or invisible bytes instead of accented characters.
  const b = "[\\sZYnp\\u2B06]+";
  
  let formatted = text
    .replace(new RegExp(`radiograf${b}a`, 'gi'), 'radiografía')
    .replace(new RegExp(`morfolog${b}a`, 'gi'), 'morfología')
    .replace(new RegExp(`anat${b}mica`, 'gi'), 'anatómica')
    .replace(new RegExp(`volum${b}trica`, 'gi'), 'volumétrica')
    .replace(new RegExp(`mediast${b}nico`, 'gi'), 'mediastínico')
    .replace(new RegExp(`extensi${b}n`, 'gi'), 'extensión')
    .replace(new RegExp(`descripci${b}n`, 'gi'), 'descripción')
    .replace(new RegExp(`precisi${b}n`, 'gi'), 'precisión')
    .replace(new RegExp(`medici${b}n`, 'gi'), 'medición')
    .replace(new RegExp(`lesi${b}n`, 'gi'), 'lesión')
    .replace(new RegExp(`adenopat${b}as`, 'gi'), 'adenopatías')
    .replace(new RegExp(`\\b${b}seas\\b`, 'gi'), 'óseas')
    .replace(new RegExp(`se${b}alar`, 'gi'), 'señalar')
    .replace(new RegExp(`espec${b}ficos`, 'gi'), 'específicos')
    .replace(new RegExp(`espec${b}fica`, 'gi'), 'específica')
    .replace(new RegExp(`homog${b}nea`, 'gi'), 'homogénea')
    .replace(new RegExp(`invasi${b}n`, 'gi'), 'invasión')
    .replace(new RegExp(`patol${b}gico`, 'gi'), 'patológico')
    .replace(new RegExp(`mielopat${b}a`, 'gi'), 'mielopatía')
    .replace(new RegExp(`din${b}micos`, 'gi'), 'dinámicos')
    .replace(new RegExp(`correlaci${b}n`, 'gi'), 'correlación')
    .replace(new RegExp(`quir${b}rgica`, 'gi'), 'quirúrgica')
    .replace(new RegExp(`m${b}s\\b`, 'gi'), 'más')
    .replace(new RegExp(`tor${b}cico`, 'gi'), 'torácico')
    .replace(new RegExp(`morfol${b}gicamente`, 'gi'), 'morfológicamente')
    .replace(new RegExp(`s${b}ntomas`, 'gi'), 'síntomas')
    .replace(new RegExp(`v${b}lida`, 'gi'), 'válida')
    .replace(new RegExp(`radiol${b}gico`, 'gi'), 'radiológico')
    .replace(new RegExp(`s${b}lidos`, 'gi'), 'sólidos')
    .replace(new RegExp(`s${b}lida`, 'gi'), 'sólida')
    .replace(new RegExp(`destrucci${b}n`, 'gi'), 'destrucción')
    .replace(new RegExp(`distinci${b}n`, 'gi'), 'distinción')
    .replace(new RegExp(`caracter${b}sticas`, 'gi'), 'características')
    .replace(new RegExp(`se${b}al\\b`, 'gi'), 'señal')
    .replace(new RegExp(`regi${b}n`, 'gi'), 'región')
    .replace(new RegExp(`presentaci${b}n`, 'gi'), 'presentación')
    .replace(new RegExp(`conexi${b}n`, 'gi'), 'conexión')
    .replace(new RegExp(`evaluaci${b}n`, 'gi'), 'evaluación')
    .replace(new RegExp(`patolog${b}a`, 'gi'), 'patología')
    .replace(new RegExp(`ci${b}n\\b`, 'gi'), 'ción')
    .replace(new RegExp(`log${b}a\\b`, 'gi'), 'logía')
    .replace(new RegExp(`diagn${b}stico`, 'gi'), 'diagnóstico')
    .replace(new RegExp(`diagn${b}stica`, 'gi'), 'diagnóstica')
    .replace(new RegExp(`m${b}ltiples`, 'gi'), 'múltiples')
    .replace(new RegExp(`m${b}ltiple`, 'gi'), 'múltiple')
    .replace(new RegExp(`patognom${b}nicas`, 'gi'), 'patognomónicas')
    .replace(new RegExp(`patognom${b}nicos`, 'gi'), 'patognomónicos')
    .replace(new RegExp(`condici${b}n`, 'gi'), 'condición')
    .replace(new RegExp(`l${b}quida`, 'gi'), 'líquida')
    .replace(new RegExp(`l${b}quido`, 'gi'), 'líquido')
    .replace(new RegExp(`asociaci${b}n`, 'gi'), 'asociación')
    .replace(new RegExp(`ra${b}ces`, 'gi'), 'raíces')
    .replace(new RegExp(`im${b}genes`, 'gi'), 'imágenes')
    .replace(new RegExp(`tambi${b}n\\b`, 'gi'), 'también')
    .replace(new RegExp(`diferenciaci${b}n`, 'gi'), 'diferenciación')
    .replace(new RegExp(`dif${b}cil`, 'gi'), 'difícil')
    .replace(new RegExp(`hist${b}rico`, 'gi'), 'histórico')
    .replace(new RegExp(`cl${b}nico`, 'gi'), 'clínico')
    .replace(new RegExp(`cl${b}nica`, 'gi'), 'clínica')
    .replace(new RegExp(`asintom${b}ticos`, 'gi'), 'asintomáticos')
    .replace(new RegExp(`asintom${b}tico`, 'gi'), 'asintomático')
    .replace(new RegExp(`progresi${b}n`, 'gi'), 'progresión')
    .replace(new RegExp(`confirmaci${b}n`, 'gi'), 'confirmación')
    .replace(new RegExp(`m${b}trica`, 'gi'), 'métrica')
    .replace(new RegExp(`a${b}os\\b`, 'gi'), 'años')
    .replace(new RegExp(`m${b}dico`, 'gi'), 'médico');

  return formatted.replace(/\\n/g, '\n').replace(/<br\s*\/?>/gi, '\n\n').replace(/\s* \s*/g, '\n\n');
};

export default function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  const calculateAge = (birthdateStr: string): string => {
    if (!birthdateStr) return '';
    const today = new Date();
    const birth = new Date(birthdateStr);
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--;
      months = 12 + months;
    }
    if (years < 0) return '0 años';
    if (years === 0) return `${months} meses`;
    return `${years} años`;
  };

  // JWT Auth state
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('biologic_token'));
  const [authUser, setAuthUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [appMode, setAppMode] = useState<'investigator' | 'clinical' | 'epidemiology_macro' | 'immunology'>('investigator');
  const [isSocraticMode, setIsSocraticMode] = useState(false);
  const [isDebateMode, setIsDebateMode] = useState(true);
  const [topic, setTopic] = useState('');
  const [searchCategory, setSearchCategory] = useState('Todas');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TribunalResult | null>(null);
  const [clinicalAnalysis, setClinicalAnalysis] = useState<ClinicalResult | null>(null);
  const [epidemiologyAnalysis, setEpidemiologyAnalysis] = useState<EpidemiologyResult | null>(null);
  const [immunologyAnalysis, setImmunologyAnalysis] = useState<ImmunologyResult | null>(null);
  const [steps, setSteps] = useState<ReasoningStep[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'investigator' | 'critic' | 'connections' | 'chat'>('overview');
  const [activeSignificanceTab, setActiveSignificanceTab] = useState<'critical' | 'incidental' | 'nonSignificant'>('critical');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [isLocationSettingsOpen, setIsLocationSettingsOpen] = useState(false);
  const [showSettingsHelp, setShowSettingsHelp] = useState(false);
  const [isReconstructing, setIsReconstructing] = useState(false);
  const [showReconstructionSuccess, setShowReconstructionSuccess] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [region, setRegion] = useState(() => localStorage.getItem('biologic_region') || '');
  const [city, setCity] = useState(() => localStorage.getItem('biologic_city') || '');
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Session & Chat State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isExpanding, setIsExpanding] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [suspectedPathology, setSuspectedPathology] = useState('');
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [isDictationModalOpen, setIsDictationModalOpen] = useState(false);
  const [isQuarantineModalOpen, setIsQuarantineModalOpen] = useState(false);
  const [selectedQuarantineSession, setSelectedQuarantineSession] = useState<Session | null>(null);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Delta Analysis State
  const [isDeltaMode, setIsDeltaMode] = useState(false);
  const [isPatientArchiveOpen, setIsPatientArchiveOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [deltaAnalysis, setDeltaAnalysis] = useState<DeltaAnalysisResult | null>(null);
  const [archiveForm, setArchiveForm] = useState({ dni: '', name: '', age: '', city: '', birthdate: '' });
  const [patientReports, setPatientReports] = useState<ArchivedReport[]>([]);
  const [patientDniInput, setPatientDniInput] = useState('');

  useEffect(() => {
    if (selectedPatient) {
      setPatientDniInput(selectedPatient.dni);
    } else {
      setPatientDniInput('');
    }
  }, [selectedPatient]);

  const activePatient = useMemo(() => {
    if (!patientDniInput.trim()) return null;
    return patients.find(p => p.dni.trim() === patientDniInput.trim()) || null;
  }, [patientDniInput, patients]);

  // Shared Sessions State
  const [sharedSessions, setSharedSessions] = useState<any[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sessionToShare, setSessionToShare] = useState<Session | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Report Viewer State
  const [visualizingReport, setVisualizingReport] = useState<ArchivedReport | null>(null);
  const [reportViewerFullscreen, setReportViewerFullscreen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (appMode === 'clinical') {
      document.documentElement.classList.add('theme-clinical');
    } else {
      document.documentElement.classList.remove('theme-clinical');
    }

    if (appMode === 'immunology') {
      document.documentElement.classList.add('theme-immunology');
    } else {
      document.documentElement.classList.remove('theme-immunology');
    }
  }, [isDarkMode, appMode]);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'validate' }),
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
          setAuthToken('cookie-auth');
          setAuthUser(data.user);
          setDbUser(data.user.userId);
        } else {
          setAuthToken(null);
          await clearAllData();
        }
      } catch (e) {
        setAuthToken(null);
        await clearAllData();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    validateToken();
  }, []);

  useEffect(() => {
    if (!authToken) return;

    loadSessions();
    loadPatients();
    loadSharedSessions();

    // Polling global para sesiones compartidas (Tiempo Real)
    const interval = setInterval(loadSharedSessions, 7000);
    return () => clearInterval(interval);
  }, [authToken]);

  // Polling específico para mantener el "Archivo de Pacientes" en tiempo real
  useEffect(() => {
    if (!authToken || !isPatientArchiveOpen) return;
    
    // Polling cada 7 segundos mientras el modal está abierto
    const interval = setInterval(() => {
      loadPatients();
    }, 7000);
    
    return () => clearInterval(interval);
  }, [authToken, isPatientArchiveOpen, selectedPatient]);

  const loadSharedSessions = async () => {
    try {
      const res = await fetch('/api/get-shared-sessions', {
        credentials: 'include'
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setSharedSessions(result.data);
        }
      }
    } catch (err) { }
  };

  const loadPatients = async (overrideDni?: string) => {
    try {
      // 1. Fetch de Supabase como única fuente de verdad para el Entorno Colaborativo
      const syncRes = await fetch('/api/sync-down', { credentials: 'include' });
      if (syncRes.ok) {
        const { pacientes: dbPacientes, registros: dbRegistros } = await syncRes.json();
        
        // Mapear y actualizar Pacientes directamente en Memoria (saltamos IndexedDB)
        if (dbPacientes) {
          const mappedPatients: Patient[] = dbPacientes.map((p: any) => ({
            dni: p.dni,
            name: p.nombre_completo,
            age: p.fecha_nacimiento ? calculateAge(p.fecha_nacimiento) : '',
            city: p.ciudad || '',
            birthdate: p.fecha_nacimiento || undefined,
            createdAt: new Date(p.creado_en).getTime(),
            updatedAt: new Date(p.creado_en).getTime()
          }));
          setPatients(mappedPatients);
          
          // Si el paciente actual fue eliminado por otro usuario, deseleccionarlo
          if (selectedPatient && !mappedPatients.find(p => p.dni === selectedPatient.dni)) {
            setSelectedPatient(null);
            setPatientReports([]);
          }
        }

        // Si hay un paciente seleccionado, filtrar sus reportes desde la fuente global de verdad
        const targetDni = overrideDni || selectedPatient?.dni;
        if (targetDni && dbRegistros) {
          // dbRegistros YA ES un array de ArchivedReport gracias a sync-down
          const allReports: ArchivedReport[] = dbRegistros;
          const currentPatientReports = allReports.filter(r => r.patientDni === targetDni);
          setPatientReports(currentPatientReports.sort((a, b) => b.date - a.date));
        }
        
        return; // Salimos exitosamente sin tocar la base local
      }
    } catch (cloudErr) {
      console.warn("Fallo sincronización con la nube, operando en modo offline usando caché local:", cloudErr);
    }

    // 2. FALLBACK OFFLINE: Solo si la nube falla, leemos de IndexedDB
    try {
      const loadedPatients = await getAllPatients();
      setPatients(loadedPatients);
      const targetDni = overrideDni || selectedPatient?.dni;
      if (targetDni) {
        const reports = await getPatientReports(targetDni);
        setPatientReports(reports.sort((a, b) => b.date - a.date));
      }
    } catch (error) {
      console.error("Error loading offline patients:", error);
    }
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [currentSession?.chatHistory]);

  const loadSessions = async () => {
    try {
      const loadedSessions = await getSessions();
      // Sort: pinned first, then by updatedAt descending
      loadedSessions.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt - a.updatedAt;
      });
      setSessions(loadedSessions);

      // Backfill embeddings for older sessions that don't have them
      const sessionsWithoutEmbeddings = loadedSessions.filter(s => !s.embedding || s.embedding.length === 0);
      if (sessionsWithoutEmbeddings.length > 0) {
        console.log(`Backfilling embeddings for ${sessionsWithoutEmbeddings.length} sessions...`);
        for (const session of sessionsWithoutEmbeddings) {
          try {
            let summaryToEmbed = '';
            if (session.tribunalResult) summaryToEmbed = session.tribunalResult.summary;
            else if (session.clinicalResult) summaryToEmbed = session.clinicalResult.summary;
            else if (session.epidemiologyResult) summaryToEmbed = session.epidemiologyResult.summary;
            else if (session.immunologyResult) summaryToEmbed = session.immunologyResult.summary;

            const textToEmbed = `Tema: ${session.topic}\nResumen: ${summaryToEmbed}`;
            const embedding = await generateEmbedding(textToEmbed);
            if (embedding && embedding.length > 0) {
              const updatedSession = { ...session, embedding };
              await saveSession(updatedSession);
            }
          } catch (e) {
            console.error(`Failed to backfill embedding for session ${session.id}`, e);
          }
        }
        // Reload after backfilling
        const reloadedSessions = await getSessions();
        setSessions(reloadedSessions);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  };

  const handleNewSession = () => {
    setCurrentSession(null);
    setAnalysis(null);
    setClinicalAnalysis(null);
    setEpidemiologyAnalysis(null);
    setImmunologyAnalysis(null);
    setDeltaAnalysis(null);
    setIsDeltaMode(false);
    setSteps([]);
    setTopic('');
    setSuspectedPathology(''); // <-- CLEAR STATE
    setAttachedFiles([]);      // <-- CLEAR STATE
    setActiveTab('overview');
    setIsHistoryOpen(false);
    clearAttachedFiles();
  };

  const handleLoadSession = (session: Session) => {
    setCurrentSession(session);
    setAppMode(session.mode || 'investigator');
    setIsSocraticMode(session.isSocraticMode || false);
    setIsDebateMode((session.mode === 'clinical') ? true : (session.isDebateMode || false));
    setAnalysis(session.tribunalResult);
    setClinicalAnalysis(session.clinicalResult || null);
    setEpidemiologyAnalysis(session.epidemiologyResult || null);
    setImmunologyAnalysis(session.immunologyResult || null);
    setDeltaAnalysis(session.deltaResult || null);
    setIsDeltaMode(session.isDeltaMode || false);
    setTopic(session.topic);
    setSteps([]); // Clear live steps when loading history
    setActiveTab('overview');
    setIsHistoryOpen(false);
    clearAttachedFiles();
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteSession(id);
    if (currentSession?.id === id) {
      handleNewSession();
    }
    loadSessions();
    setActiveMenuId(null);
  };

  const handlePinSession = async (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    const updatedSession = { ...session, isPinned: !session.isPinned };
    await saveSession(updatedSession);
    if (currentSession?.id === session.id) {
      setCurrentSession(updatedSession);
    }
    loadSessions();
    setActiveMenuId(null);
  };

  const handleShareClick = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    setSessionToShare(session);
    setIsShareModalOpen(true);
    setActiveMenuId(null);
  };

  const handleShareSessionSubmit = async (durationMinutes: number) => {
    if (!sessionToShare) return;
    setIsSharing(true);
    try {
      const resp = await fetch('/api/share-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionToShare, durationMinutes })
      });
      if (resp.ok) {
        loadSharedSessions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSharing(false);
      setIsShareModalOpen(false);
      setSessionToShare(null);
    }
  };

  const handleEditSessionStart = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitleValue(session.title);
    setActiveMenuId(null);
  };

  const handleEditSessionSave = async (e: React.MouseEvent | React.KeyboardEvent, session: Session) => {
    e.stopPropagation();
    if (editTitleValue.trim()) {
      const updatedSession = { ...session, title: editTitleValue.trim() };
      await saveSession(updatedSession);
      if (currentSession?.id === session.id) {
        setCurrentSession(updatedSession);
      }
      loadSessions();
    }
    setEditingSessionId(null);
  };

  const handleEditSessionCancel = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const handleDownloadPDF = async () => {
    if (!analysis && !clinicalAnalysis && !epidemiologyAnalysis && !immunologyAnalysis && !deltaAnalysis) return;

    // Al usar window.print(), el navegador se encarga del PDF. 
    // Los estilos @media print en index.css ocultan la barra lateral y demás UI.
    window.print();
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "biologic_sessions.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedSessions: Session[] = JSON.parse(event.target?.result as string);
        for (const session of importedSessions) {
          await saveSession(session);
        }
        loadSessions();
      } catch (error) {
        console.error("Error importing JSON:", error);
        alert("Error al importar el archivo JSON. Asegúrese de que el formato sea correcto.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const buildGlobalKnowledge = (context: { relevant: Session[], random: Session | null }) => {
    if (context.relevant.length === 0 && !context.random) return "";

    const formatSession = (s: Session) => {
      let content = `[Tema: ${s.topic}]\n`;

      const extractDiscoveries = (summary: string) => {
        const match = summary.match(/\[NUEVOS HALLAZGOS\]\n([\s\S]*)$/);
        return match ? `\n  Nuevos Hallazgos:\n  ${match[1]}` : '';
      };

      if (s.tribunalResult) {
        // FASE 2: Token Capping (Solo 2 hipótesis exitosas, sin rechazos ni críticas)
        const surviving = s.tribunalResult.survivingHypotheses.slice(0, 2);
        if (surviving.length > 0) {
          content += surviving.map(h => `  ✓ Validado: ${h.statement}`).join('\n');
        } else {
          content += "  (Sin hipótesis validadas)";
        }
        content += extractDiscoveries(s.tribunalResult.summary);
      } else if (s.clinicalResult) {
        const topDiagnoses = s.clinicalResult.differentialDiagnoses.slice(0, 2).map(d => d.condition).join(', ');
        content += `  Diagnósticos Principales: ${topDiagnoses}`;
        content += extractDiscoveries(s.clinicalResult.summary);
      } else if (s.epidemiologyResult) {
        const topThreats = s.epidemiologyResult.riskAnalysis.currentThreats.slice(0, 2).map(t => t.condition).join(', ');
        content += `  Amenazas Principales: ${topThreats}`;
        content += extractDiscoveries(s.epidemiologyResult.summary);
      } else if (s.immunologyResult) {
        content += `  Patógeno/Diana: ${s.immunologyResult.molecularProfile.pathogenOrTarget}`;
        content += extractDiscoveries(s.immunologyResult.summary);
      } else {
        return null;
      }

      return content;
    };

    let knowledge = "";

    if (context.relevant.length > 0) {
      knowledge += "=== CASOS CLÍNICOS RELACIONADOS (CONTEXTO DIRECTO) ===\n";
      knowledge += context.relevant.map(formatSession).filter(Boolean).join('\n\n');
    }

    if (context.random) {
      const randomFormatted = formatSession(context.random);
      if (randomFormatted) {
        knowledge += "\n\n=== CASO ALEATORIO PARA INNOVACIÓN CRUZADA (SERENDIPIA MÉDICA) ===\n";
        knowledge += "INSTRUCCIÓN CRÍTICA: Debes intentar encontrar un puente biológico, mecanismo de acción compartido o reposicionamiento de fármacos entre este caso aparentemente no relacionado y el tema actual.\n";
        knowledge += randomFormatted;
      }
    }

    return knowledge;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // Aceptamos hasta 10MB temporalmente
    const validFiles = files.filter(f => f.size <= MAX_FILE_SIZE);

    if (validFiles.length < files.length) {
      alert(`Algunos archivos superan el límite máximo inicial de 10MB y fueron omitidos.`);
    }

    const newAttachedFiles: (AttachedFile | null)[] = await Promise.all(
      validFiles.map(file => new Promise<AttachedFile | null>((resolve) => {
        const ext = file.name.split('.').pop()?.toLowerCase();

        // Intercept unsupported heavy medical binaries
        if (['dicom', 'dcm', 'svs', 'tiff', 'tif'].includes(ext || '')) {
          alert(`Formato no soportado nativamente: .${ext?.toUpperCase()}\n\nEn la práctica clínica, los archivos DICOM/SVS requieren un servidor PACS o decodificadores especializados debido a su compresión y tamaño (Gigapíxeles).\n\nPara análisis visual con IA, por favor exporte los cortes clave a JPG/PNG, o suba el reporte radiológico/patológico en PDF o HL7.`);
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          let mimeType = file.type;
          if (ext === 'hl7') mimeType = 'text/plain';
          else if (ext === 'fhir') mimeType = 'application/json';
          else if (!mimeType) mimeType = 'application/octet-stream';

          const resultString = event.target?.result as string;

          // COMPRESIÓN DE IMÁGENES EN CLIENTE (PREVENCIÓN ERROR 413 VERCEL)
          // Si es una imagen, la comprimimos con Canvas para asegurar que el Base64 no exceda 4.5MB
          if (mimeType.startsWith('image/') && !mimeType.includes('svg')) {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const maxDim = 1600; // Resolución máxima segura para mantener detalles clínicos sin saturar la red

              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);

              // Comprimir como JPEG al 85% de calidad
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
              const base64String = compressedDataUrl.split(',')[1];

              resolve({
                name: file.name,
                mimeType: 'image/jpeg',
                data: base64String
              });
            };
            img.onerror = () => {
              // Fallback si falla la carga de la imagen
              resolve({
                name: file.name,
                mimeType: mimeType,
                data: resultString.split(',')[1]
              });
            };
            img.src = resultString;
          } else {
            // Para PDFs o archivos de texto, tomamos el Base64 directo
            // Pero advertimos si es muy grande para Vercel (>3MB)
            const base64String = resultString.split(',')[1];
            if (base64String.length > 4000000) {
              alert(`Advertencia: El archivo ${file.name} es muy pesado y podría causar un Error de Conexión en el servidor (Límite 4MB).`);
            }
            resolve({
              name: file.name,
              mimeType: mimeType,
              data: base64String
            });
          }
        };
        reader.readAsDataURL(file);
      }))
    );

    const filteredFiles = newAttachedFiles.filter((f): f is AttachedFile => f !== null);
    setAttachedFiles(prev => [...prev, ...filteredFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const applyThermalFilter = async (index: number) => {
    const file = attachedFiles[index];
    if (!file || !file.mimeType.startsWith('image/')) return;

    try {
      const processedBase64 = await applyMedicalHeatmap(file.data, file.mimeType);

      const newFile: AttachedFile = {
        name: `[HOT] ${file.name}`,
        mimeType: file.mimeType,
        data: processedBase64
      };

      // We keep the original and append the thermal map so the AI has context of both
      setAttachedFiles(prev => {
        const newFiles = [...prev];
        newFiles[index] = { ...newFiles[index], processed: true };
        newFiles.push(newFile);
        return newFiles;
      });
    } catch (e) {
      console.error("Filter error:", e);
      alert("No se pudo aplicar el filtro térmico.");
    }
  };

  const clearAttachedFiles = () => {
    setAttachedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async (e?: React.FormEvent, overrideTopic?: string, overrideFiles?: AttachedFile[], isReconstruction: boolean = false): Promise<boolean> => {
    if (e) e.preventDefault();
    const currentTopic = overrideTopic !== undefined ? overrideTopic : topic;
    const currentFiles = overrideFiles !== undefined ? overrideFiles : attachedFiles;

    if (!currentTopic.trim()) return false;

    setIsAnalyzing(true);
    setAnalysis(null);
    setClinicalAnalysis(null);
    setEpidemiologyAnalysis(null);
    setImmunologyAnalysis(null);
    setSteps([]);

    try {
      // 1. RAG: Find relevant past sessions based on the current topic
      const relevantSessions = await findRelevantSessions(currentTopic, sessions, 3, appMode);

      // 2. Build global knowledge ONLY from the relevant sessions
      const globalKnowledge = buildGlobalKnowledge(relevantSessions);

      // 3. Strict Patient RAG: If a patient DNI is specified, retrieve only their reports
      let pastContext = '';
      if (patientDniInput.trim() !== '') {
        const patientDni = patientDniInput.trim();
        const records = await getPatientReports(patientDni);
        if (records && records.length > 0) {
          pastContext = `=== EXPEDIENTE HISTÓRICO EXCLUSIVO DEL PACIENTE (DNI: ${patientDni}) ===\n\n`;
          records.forEach((r, idx) => {
            const dateStr = new Date(r.date).toLocaleDateString('es-ES');
            pastContext += `[Estudio #${idx + 1} - Fecha: ${dateStr}]\n`;
            pastContext += `- Motivo/Cuadro Clínico: ${r.topic}\n`;
            pastContext += `- Resumen de Diagnósticos Previos: ${r.summary}\n`;
            
            if (r.fullData && r.fullData.diagnosticFindings) {
              pastContext += `- Hallazgos Clave:\n`;
              r.fullData.diagnosticFindings.forEach((df: any) => {
                pastContext += `  * [${df.modality}] ${df.findings?.join('; ') || ''} - Interpretación: ${df.interpretation}\n`;
                if (df.technicalDetails?.measurements) {
                  pastContext += `    - Mediciones Previas: ${df.technicalDetails.measurements}\n`;
                }
              });
            }
            pastContext += `\n---\n\n`;
          });
        } else {
          pastContext = `[Historial]: Este es el primer estudio para el paciente con DNI ${patientDni}. No hay expedientes previos registrados.`;
        }
      } else {
        pastContext = globalKnowledge;
      }

      let resultSummary = '';
      let newSession: Session;

      if (appMode === 'clinical') {
        const result = await runClinicalAnalysis(currentTopic, (step) => {
          setSteps(prev => [...prev, step]);
        }, pastContext, currentFiles, region, city, isDebateMode, searchCategory, suspectedPathology);
        setClinicalAnalysis(result);
        resultSummary = result.summary;

        newSession = {
          id: Date.now().toString(),
          title: currentTopic.substring(0, 50) + '...',
          topic: currentTopic,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          mode: 'clinical',
          isSocraticMode: isSocraticMode,
          isDebateMode: isDebateMode,
          tribunalResult: null,
          clinicalResult: result,
          chatHistory: [],
          attachedFiles: currentFiles
        };
      } else if (appMode === 'epidemiology_macro') {
        const result = await runEpidemiologyAnalysis(currentTopic, (step) => {
          setSteps(prev => [...prev, step]);
        }, pastContext, currentFiles, region, city, searchCategory);
        setEpidemiologyAnalysis(result);
        resultSummary = result.summary;

        newSession = {
          id: Date.now().toString(),
          title: currentTopic.substring(0, 50) + '...',
          topic: currentTopic,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          mode: 'epidemiology_macro',
          tribunalResult: null,
          clinicalResult: null,
          epidemiologyResult: result,
          chatHistory: [],
          attachedFiles: currentFiles
        };
      } else if (appMode === 'immunology') {
        const result = await runImmunologyAnalysis(currentTopic, (step) => {
          setSteps(prev => [...prev, step]);
        }, pastContext, currentFiles, region, city, searchCategory);
        setImmunologyAnalysis(result);
        resultSummary = result.summary;

        newSession = {
          id: Date.now().toString(),
          title: currentTopic.substring(0, 50) + '...',
          topic: currentTopic,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          mode: 'immunology',
          tribunalResult: null,
          clinicalResult: null,
          immunologyResult: result,
          chatHistory: [],
          attachedFiles: currentFiles
        };
      } else {
        const result = await runTribunal(currentTopic, (step) => {
          setSteps(prev => [...prev, step]);
        }, pastContext, currentFiles, region, city, searchCategory);
        setAnalysis(result);
        resultSummary = result.summary;

        newSession = {
          id: Date.now().toString(),
          title: currentTopic.substring(0, 50) + '...',
          topic: currentTopic,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          mode: 'investigator',
          tribunalResult: result,
          clinicalResult: null,
          chatHistory: [],
          attachedFiles: currentFiles
        };
      }

      // 3. Generate embedding for the new session to be used in future RAG queries
      // We embed the topic and the summary to capture the essence of this session
      const textToEmbed = `Tema: ${currentTopic}\nResumen: ${resultSummary}`;
      const embedding = await generateEmbedding(textToEmbed);
      newSession.embedding = embedding;

      // Save new session
      await saveSession(newSession);
      setCurrentSession(newSession);
      loadSessions();
      if (!isReconstruction) {
        clearAttachedFiles();
      }
      return true;
    } catch (error: any) {
      console.error(error);
      setSteps(prev => [...prev, {
        id: 'error',
        type: 'analysis',
        title: 'Error del Sistema',
        content: error instanceof Error ? error.message : 'Fallo en la conexión con la IA.',
        confidence: 0,
        timestamp: Date.now()
      }]);
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApproveMemory = async (msgId: string, rating: number, note: string) => {
    if (isAnalyzing || isReconstructing) return; // Prevents double clicks and duplicate sessions
    if (!currentSession) return;
    const msg = currentSession.chatHistory.find(m => m.id === msgId);
    if (!msg) return;

    setIsAnalyzing(true);
    try {
      await invokeBackend('approveMemory', {
        topic: currentSession.topic,
        isAutopsy: !!msg.cognitiveAutopsy,
        cognitiveAutopsy: msg.cognitiveAutopsy,
        newDiscovery: msg.newDiscovery,
        rating,
        note
      });

      const updatedHistory = currentSession.chatHistory.map(m =>
        m.id === msgId ? { ...m, approvalStatus: 'approved' as const, rating, note } : m
      );

      let updatedSession = { ...currentSession, chatHistory: updatedHistory };

      // Si es una autopsia cognitiva o descubrimiento, creamos una NUEVA SESIÓN CLÍNICA DE FORMA ATÓMICA
      if (msg.cognitiveAutopsy || msg.newDiscovery) {
        const truth = msg.cognitiveAutopsy ? msg.cognitiveAutopsy.verdad_revelada : msg.newDiscovery?.hallazgo;

        // 1. Preparar el nuevo contexto inyectado
        const newDiscoveryContext = `ATENCIÓN: RE-EVALUACIÓN CLÍNICA OBLIGATORIA. Se ha validado un descubrimiento crucial.
LA VERDAD REVELADA ES: ${truth}
${msg.cognitiveAutopsy ? `TRAMPA CLÍNICA IDENTIFICADA: ${msg.cognitiveAutopsy.trampa_clinica}` : ''}

INSTRUCCIÓN: Borra la pizarra. Analiza nuevamente las imágenes adjuntas pero utilizando esta verdad revelada como tu premisa innegable. Ajusta tus diagnósticos diferenciales, plan de abordaje y todo el reporte clínico para ser coherente con este descubrimiento confirmado. Prohibido sugerir diagnósticos que contradigan esta premisa.`;

        // 2. Obtener archivos
        const filesToTransfer = [...(currentSession.attachedFiles || [])];

        // 3. Iniciar Transacción Atómica
        setIsReconstructing(true);

        // NO abandonamos la sesión vieja todavía. Intentamos crear la nueva.
        const success = await handleAnalyze(undefined, newDiscoveryContext, filesToTransfer, true);

        setIsReconstructing(false);

        if (success) {
          // 4. Si tuvo éxito, ENTONCES abandonamos la sesión vieja
          if (!updatedSession.title.startsWith('[ABANDONADO]')) {
            updatedSession.title = `[ABANDONADO: Diagnóstico Refutado] ${updatedSession.title}`;
          }
          // Removemos la transición pendiente si existía
          delete updatedSession.pendingTransitionContext;
          await saveSession(updatedSession);

          // Cambiar a la pestaña de reporte clínico (overview) y mostrar pop-up de éxito
          setActiveTab('overview');
          setShowReconstructionSuccess(true);
        } else {
          // 5. ROLLBACK VISUAL: Restaurar los estados globales de la UI
          setSteps([]);
          setClinicalAnalysis(currentSession.clinicalResult || null);
          setAnalysis(currentSession.tribunalResult || null);
          setEpidemiologyAnalysis(currentSession.epidemiologyResult || null);
          setImmunologyAnalysis(currentSession.immunologyResult || null);

          // 6. GUARDADO DE TRANSICIÓN PENDIENTE (State Machine en IndexedDB)
          // El mensaje SE QUEDA como "approved", pero guardamos el contexto para poder reintentar
          updatedSession.pendingTransitionContext = newDiscoveryContext;
          setCurrentSession(updatedSession);
          await saveSession(updatedSession);
        }

      } else {
        // Si no es autopsia (ej. solo aprobó un hallazgo normal), solo guardamos
        setCurrentSession(updatedSession);
        await saveSession(updatedSession);
        loadSessions();
        alert("✅ Memoria validada exitosamente.");
      }
    } catch (e: any) {
      alert("Error al validar memoria: " + e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetryTransition = async () => {
    if (!currentSession || !currentSession.pendingTransitionContext) return;

    setIsReconstructing(true);

    // Ejecutar el análisis con los datos guardados en la transición pendiente
    const success = await handleAnalyze(
      undefined,
      currentSession.pendingTransitionContext,
      currentSession.attachedFiles || [],
      true
    );

    setIsReconstructing(false);

    if (success) {
      let updatedSession = { ...currentSession };
      if (!updatedSession.title.startsWith('[ABANDONADO]')) {
        updatedSession.title = `[ABANDONADO: Diagnóstico Refutado] ${updatedSession.title}`;
      }
      delete updatedSession.pendingTransitionContext;
      await saveSession(updatedSession);

      setActiveTab('overview');
      setShowReconstructionSuccess(true);
    } else {
      setSteps([]);
      setClinicalAnalysis(currentSession.clinicalResult || null);
      setAnalysis(currentSession.tribunalResult || null);
      setEpidemiologyAnalysis(currentSession.epidemiologyResult || null);
      setImmunologyAnalysis(currentSession.immunologyResult || null);
      alert("❌ Error de Conexión: Los servidores siguen saturados. Por favor, reintenta más tarde.");
    }
  };

  const handleRejectMemory = async (msgId: string) => {
    if (!currentSession) return;
    const updatedHistory = currentSession.chatHistory.map(m =>
      m.id === msgId ? { ...m, approvalStatus: 'rejected' as const } : m
    );
    const updatedSession = { ...currentSession, chatHistory: updatedHistory };
    setCurrentSession(updatedSession);
    await saveSession(updatedSession);
    loadSessions();
  };

  const handleAttachDictation = (text: string) => {
    const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
    const newFile: AttachedFile = {
      name: `Dictado_Clinico_${timestamp}.txt`,
      mimeType: 'text/plain',
      data: btoa(unescape(encodeURIComponent(text)))
    };
    setAttachedFiles(prev => [...prev, newFile]);
    setIsAttachmentsOpen(true);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentSession) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: Date.now()
    };

    const updatedSession = {
      ...currentSession,
      chatHistory: [...currentSession.chatHistory, userMsg],
      updatedAt: Date.now()
    };

    setCurrentSession(updatedSession);
    setChatInput('');
    setIsChatting(true);

    try {
      const relevantSessions = await findRelevantSessions(userMsg.content, sessions, 3, currentSession.mode);
      const globalKnowledge = buildGlobalKnowledge(relevantSessions);
      const aiMsg = await continueDebate(updatedSession, userMsg.content, globalKnowledge, region, city);

      let finalSession = {
        ...updatedSession,
        chatHistory: [...updatedSession.chatHistory, aiMsg],
        updatedAt: Date.now()
      };

      const discoveryVal = aiMsg.newDiscovery?.hallazgo?.toLowerCase().trim() || '';
      const isInvalidDiscovery = ['null', 'nulo', 'none', 'ninguno', 'n/a', 'na', 'vacío', 'vacio', '-', 'false'].includes(discoveryVal);

      if ((aiMsg.newDiscovery && aiMsg.newDiscovery.hallazgo && !isInvalidDiscovery && discoveryVal !== '') || aiMsg.cognitiveAutopsy) {
        const insightToEmbed = aiMsg.cognitiveAutopsy ? aiMsg.cognitiveAutopsy.aforismo_medico : aiMsg.newDiscovery!.hallazgo;
        // FASE 3: Control del Memory Leak (Ventana Deslizante de 3 hallazgos)
        const updateSummaryWithDiscovery = (oldSummary: string, discovery: string) => {
          const baseSummary = oldSummary.split('\n\n[NUEVOS HALLAZGOS]')[0];
          let discoveries: string[] = [];
          const discoveriesMatch = oldSummary.match(/\[NUEVOS HALLAZGOS\]\n([\s\S]*)$/);
          if (discoveriesMatch) {
            discoveries = discoveriesMatch[1].split('\n- ').filter(d => d.trim() !== '').map(d => d.replace(/^- /, ''));
          }
          discoveries.push(discovery);
          if (discoveries.length > 3) discoveries = discoveries.slice(discoveries.length - 3);
          return `${baseSummary}\n\n[NUEVOS HALLAZGOS]\n- ${discoveries.join('\n- ')}`;
        };

        let newSummary = updateSummaryWithDiscovery(finalSession.topic, insightToEmbed);
        if (finalSession.mode === 'clinical' && finalSession.clinicalResult) {
          newSummary = updateSummaryWithDiscovery(finalSession.clinicalResult.summary, insightToEmbed);
          finalSession.clinicalResult.summary = newSummary;
        } else if (finalSession.mode === 'epidemiology_macro' && finalSession.epidemiologyResult) {
          newSummary = updateSummaryWithDiscovery(finalSession.epidemiologyResult.summary, insightToEmbed);
          finalSession.epidemiologyResult.summary = newSummary;
        } else if (finalSession.mode === 'immunology' && finalSession.immunologyResult) {
          newSummary = updateSummaryWithDiscovery(finalSession.immunologyResult.summary, insightToEmbed);
          finalSession.immunologyResult.summary = newSummary;
        } else if (finalSession.tribunalResult) {
          newSummary = updateSummaryWithDiscovery(finalSession.tribunalResult.summary, insightToEmbed);
          finalSession.tribunalResult.summary = newSummary;
        }

        const textToEmbed = `Tema: ${finalSession.topic}\nResumen: ${newSummary}`;
        const newEmbedding = await generateEmbedding(textToEmbed);
        if (newEmbedding && newEmbedding.length > 0) {
          finalSession.embedding = newEmbedding;
        } else {
          console.warn("API falló. Manteniendo el vector antiguo como respaldo de emergencia.");
        }
        let systemContent = '';
        if (aiMsg.cognitiveAutopsy) {
          systemContent = `🧠 **AUTOPSIA COGNITIVA ACTIVADA:** Se ha corregido un sesgo y la red neuronal ha aprehendido:\n\n**Falsa Creencia Original:** ${aiMsg.cognitiveAutopsy.hipotesis_inicial}\n\n**El Sesgo/Trampa:** ${aiMsg.cognitiveAutopsy.trampa_clinica}\n\n**Corrección/Prueba Reina:** ${aiMsg.cognitiveAutopsy.evidencia_correccion}\n\n**Verdad Final:** ${aiMsg.cognitiveAutopsy.verdad_revelada}\n\n✨ **Aforismo Aprendido:** *"${aiMsg.cognitiveAutopsy.aforismo_medico}"*`;
        } else if (aiMsg.newDiscovery) {
          systemContent = `🧠 **Memoria Evolutiva Activada:** Se ha extraído y guardado un nuevo hallazgo en la red neuronal global:\n*"${aiMsg.newDiscovery.hallazgo}"*`;
        }

        if (systemContent) {
          const systemMsg: ChatMessage = {
            id: Date.now().toString() + '-sys',
            role: 'system',
            content: systemContent,
            timestamp: Date.now(),
            approvalStatus: 'pending',
            cognitiveAutopsy: aiMsg.cognitiveAutopsy,
            newDiscovery: aiMsg.newDiscovery
          };
          finalSession.chatHistory.push(systemMsg);
        }
      }

      setCurrentSession(finalSession);
      await saveSession(finalSession);
      loadSessions();
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: `Error de conexión: ${error instanceof Error ? error.message : 'No se pudo obtener respuesta del tribunal.'}`,
        timestamp: Date.now(),
        isError: true
      };
      const finalSession = {
        ...updatedSession,
        chatHistory: [...updatedSession.chatHistory, errorMsg],
        updatedAt: Date.now()
      };
      setCurrentSession(finalSession);
      await saveSession(finalSession);
      loadSessions();
    } finally {
      setIsChatting(false);
    }
  };

  const handleRetryChat = async (errorMsgId: string) => {
    if (!currentSession || isChatting) return;

    const errorIndex = currentSession.chatHistory.findIndex(m => m.id === errorMsgId);
    if (errorIndex <= 0) return;

    const userMsg = currentSession.chatHistory[errorIndex - 1];
    if (userMsg.role !== 'user') return;

    const historyWithoutError = [...currentSession.chatHistory];
    historyWithoutError.splice(errorIndex, 1);

    const updatedSession = {
      ...currentSession,
      chatHistory: historyWithoutError,
      updatedAt: Date.now()
    };

    setCurrentSession(updatedSession);
    setIsChatting(true);

    try {
      const relevantSessions = await findRelevantSessions(userMsg.content, sessions, 3, currentSession.mode);
      const globalKnowledge = buildGlobalKnowledge(relevantSessions);
      const aiMsg = await continueDebate(updatedSession, userMsg.content, globalKnowledge, region, city);

      let finalSession = {
        ...updatedSession,
        chatHistory: [...updatedSession.chatHistory, aiMsg],
        updatedAt: Date.now()
      };

      const discoveryVal = aiMsg.newDiscovery?.hallazgo?.toLowerCase().trim() || '';
      const isInvalidDiscovery = ['null', 'nulo', 'none', 'ninguno', 'n/a', 'na', 'vacío', 'vacio', '-', 'false'].includes(discoveryVal);

      if ((aiMsg.newDiscovery && aiMsg.newDiscovery.hallazgo && !isInvalidDiscovery && discoveryVal !== '') || aiMsg.cognitiveAutopsy) {
        const insightToEmbed = aiMsg.cognitiveAutopsy ? aiMsg.cognitiveAutopsy.aforismo_medico : aiMsg.newDiscovery!.hallazgo;
        const updateSummaryWithDiscovery = (oldSummary: string, discovery: string) => {
          const baseSummary = oldSummary.split('\n\n[NUEVOS HALLAZGOS]')[0];
          let discoveries: string[] = [];
          const discoveriesMatch = oldSummary.match(/\[NUEVOS HALLAZGOS\]\n([\s\S]*)$/);
          if (discoveriesMatch) {
            discoveries = discoveriesMatch[1].split('\n- ').filter(d => d.trim() !== '').map(d => d.replace(/^- /, ''));
          }
          discoveries.push(discovery);
          if (discoveries.length > 3) discoveries = discoveries.slice(discoveries.length - 3);
          return `${baseSummary}\n\n[NUEVOS HALLAZGOS]\n- ${discoveries.join('\n- ')}`;
        };

        let newSummary = updateSummaryWithDiscovery(finalSession.topic, insightToEmbed);
        if (finalSession.mode === 'clinical' && finalSession.clinicalResult) {
          newSummary = updateSummaryWithDiscovery(finalSession.clinicalResult.summary, insightToEmbed);
          finalSession.clinicalResult.summary = newSummary;
        } else if (finalSession.mode === 'epidemiology_macro' && finalSession.epidemiologyResult) {
          newSummary = updateSummaryWithDiscovery(finalSession.epidemiologyResult.summary, insightToEmbed);
          finalSession.epidemiologyResult.summary = newSummary;
        } else if (finalSession.mode === 'immunology' && finalSession.immunologyResult) {
          newSummary = updateSummaryWithDiscovery(finalSession.immunologyResult.summary, insightToEmbed);
          finalSession.immunologyResult.summary = newSummary;
        } else if (finalSession.tribunalResult) {
          newSummary = updateSummaryWithDiscovery(finalSession.tribunalResult.summary, insightToEmbed);
          finalSession.tribunalResult.summary = newSummary;
        }

        const textToEmbed = `Tema: ${finalSession.topic}\nResumen: ${newSummary}`;
        const newEmbedding = await generateEmbedding(textToEmbed);
        if (newEmbedding && newEmbedding.length > 0) {
          finalSession.embedding = newEmbedding;
        } else {
          console.warn("API falló. Manteniendo el vector antiguo como respaldo de emergencia.");
        }
        let systemContent = '';
        if (aiMsg.cognitiveAutopsy) {
          systemContent = `🧠 **AUTOPSIA COGNITIVA ACTIVADA:** Se ha corregido un sesgo y la red neuronal ha aprehendido:\n\n**Falsa Creencia Original:** ${aiMsg.cognitiveAutopsy.hipotesis_inicial}\n\n**El Sesgo/Trampa:** ${aiMsg.cognitiveAutopsy.trampa_clinica}\n\n**Corrección/Prueba Reina:** ${aiMsg.cognitiveAutopsy.evidencia_correccion}\n\n**Verdad Final:** ${aiMsg.cognitiveAutopsy.verdad_revelada}\n\n✨ **Aforismo Aprendido:** *"${aiMsg.cognitiveAutopsy.aforismo_medico}"*`;
        } else if (aiMsg.newDiscovery) {
          systemContent = `🧠 **Memoria Evolutiva Activada:** Se ha extraído y guardado un nuevo hallazgo en la red neuronal global:\n*"${aiMsg.newDiscovery.hallazgo}"*`;
        }

        if (systemContent) {
          const systemMsg: ChatMessage = {
            id: Date.now().toString() + '-sys',
            role: 'system',
            content: systemContent,
            timestamp: Date.now(),
            approvalStatus: 'pending',
            cognitiveAutopsy: aiMsg.cognitiveAutopsy,
            newDiscovery: aiMsg.newDiscovery
          };
          finalSession.chatHistory.push(systemMsg);
        }
      }

      setCurrentSession(finalSession);
      await saveSession(finalSession);
      loadSessions();
    } catch (error: any) {
      console.error("Chat error (retry):", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: `Error de conexión: ${error instanceof Error ? error.message : 'No se pudo obtener respuesta del tribunal.'}`,
        timestamp: Date.now(),
        isError: true
      };
      const finalSession = {
        ...updatedSession,
        chatHistory: [...updatedSession.chatHistory, errorMsg],
        updatedAt: Date.now()
      };
      setCurrentSession(finalSession);
      await saveSession(finalSession);
      loadSessions();
    } finally {
      setIsChatting(false);
    }
  };

  const handleExpandHypothesis = async (hypothesis: Hypothesis, action: 'ensayo' | 'compuestos') => {
    if (!currentSession) return;
    setIsExpanding(hypothesis.id);
    setActiveTab('chat');

    const actionText = action === 'ensayo' ? 'Diseñar ensayo clínico' : 'Proponer compuestos';
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `Por favor, ${actionText.toLowerCase()} para la hipótesis: "${hypothesis.statement}"`,
      timestamp: Date.now(),
      isAction: true
    };

    const updatedSession = {
      ...currentSession,
      chatHistory: [...currentSession.chatHistory, userMsg],
      updatedAt: Date.now()
    };
    setCurrentSession(updatedSession);
    setIsChatting(true);

    try {
      const relevantSessions = await findRelevantSessions(hypothesis.statement, sessions, 3, currentSession.mode);
      const globalKnowledge = buildGlobalKnowledge(relevantSessions);
      const responseText = await expandHypothesis(hypothesis, action, globalKnowledge, currentSession, region, city);
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now()
      };
      const finalSession = {
        ...updatedSession,
        chatHistory: [...updatedSession.chatHistory, aiMsg],
        updatedAt: Date.now()
      };
      setCurrentSession(finalSession);
      await saveSession(finalSession);
      loadSessions();
    } catch (error: any) {
      console.error("Expand error:", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: `Error de conexión al intentar expandir la hipótesis: ${error instanceof Error ? error.message : 'No se pudo obtener respuesta.'}`,
        timestamp: Date.now()
      };
      const finalSession = {
        ...updatedSession,
        chatHistory: [...updatedSession.chatHistory, errorMsg],
        updatedAt: Date.now()
      };
      setCurrentSession(finalSession);
      await saveSession(finalSession);
      loadSessions();
    } finally {
      setIsChatting(false);
      setIsExpanding(null);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <Activity className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!authToken && currentHash !== '#admin') {
    return <Login onLoginSuccess={(token, user) => {
      setAuthToken(token);
      setAuthUser(user);
      setDbUser(user.userId);
    }} />;
  }

  const chartData = steps.length > 0
    ? steps.map((s, i) => ({
      time: `${i}s`,
      confidence: s.confidence,
      complexity: s.type === 'investigator' ? 80 : s.type === 'critic' ? 40 : 60
    }))
    : MOCK_REASONING_DATA;
  if (currentHash === '#admin') {
    return <ApiDashboard />;
  }

  return (
    <div className={cn(
      "h-screen overflow-hidden flex flex-col font-sans selection:bg-emerald-500/30",
      appMode === 'immunology' ? "immunology-grid" : "technical-grid"
    )} onClick={() => setActiveMenuId(null)}>
      {/* Header */}
      <header className="border-b border-black/10 dark:border-white/10 bg-gray-100 dark:bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-sm text-gray-600 dark:text-white/70 hover:text-gray-900 dark:text-white transition-all text-xs font-mono uppercase tracking-wider"
              title="Ver historial de reportes guardados"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">Historial</span>
            </button>
            <div className={cn(
              "w-8 h-8 flex items-center justify-center glow-accent ml-2 transition-colors duration-300",
              isDeltaMode ? "bg-amber-600" :
                appMode === 'investigator' ? "bg-emerald-600" :
                  appMode === 'clinical' ? "bg-cyan-600" :
                    appMode === 'epidemiology_macro' ? "bg-indigo-600" :
                      "bg-purple-600"
            )}>
              {isDeltaMode ? (
                <TrendingUp className="w-5 h-5 text-gray-900 dark:text-white" />
              ) : appMode === 'investigator' ? (
                <Brain className="w-5 h-5 text-gray-900 dark:text-white" />
              ) : appMode === 'clinical' ? (
                <Activity className="w-5 h-5 text-gray-900 dark:text-white" />
              ) : appMode === 'epidemiology_macro' ? (
                <Globe className="w-5 h-5 text-gray-900 dark:text-white" />
              ) : (
                <Microscope className="w-5 h-5 text-gray-900 dark:text-white" />
              )}
            </div>

            {isDeltaMode && (
              <button
                onClick={() => setIsNewPatientModalOpen(true)}
                className="ml-2 px-3 py-1.5 flex items-center gap-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-lg border border-black/10 dark:border-white/10 transition-colors"
                title="Crear Nuevo Paciente en DB"
              >
                <UserPlus className="w-4 h-4 text-emerald-500" />
                <span className="hidden sm:inline">Nuevo Paciente</span>
              </button>
            )}
            <div className="hidden md:block">
              <h1 className="text-sm font-bold tracking-tighter uppercase">
                {isDeltaMode ? 'Delta' : appMode === 'immunology' ? 'ImmunoCell' : appMode === 'epidemiology_macro' ? 'Epidemic' : 'BioLogic'}
              </h1>
              <p className={cn(
                "text-[9px] font-mono tracking-widest uppercase opacity-70",
                isDeltaMode ? "text-amber-500" :
                  appMode === 'investigator' ? "text-emerald-500" :
                    appMode === 'clinical' ? "text-cyan-500" :
                      appMode === 'epidemiology_macro' ? "text-indigo-500" :
                        "text-purple-500"
              )}>
                {isDeltaMode ? 'Motor de Análisis Longitudinal' :
                  appMode === 'investigator' ? 'Tribunal Multi-Agente v4.0' :
                    appMode === 'clinical' ? 'Asistente Clínico de Élite' :
                      appMode === 'epidemiology_macro' ? 'Vigilancia Sanitaria Inteligente' :
                        'Modelado Molecular Inmunológico'}
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-3 ml-4 pl-4 border-l border-black/10 dark:border-white/10">
              <div className="flex flex-col">
                <span className={cn(
                  "text-[9px] font-mono uppercase tracking-widest flex items-center gap-1",
                  isDeltaMode ? "text-amber-500" :
                    appMode === 'investigator' ? "text-emerald-500" :
                      appMode === 'clinical' ? "text-cyan-500" :
                        appMode === 'epidemiology_macro' ? "text-indigo-500" :
                          "text-purple-500"
                )}>
                  {isDeltaMode ? <TrendingUp className="w-3 h-3" /> : appMode === 'epidemiology_macro' ? <Globe className="w-3 h-3" /> : appMode === 'immunology' ? <Microscope className="w-3 h-3" /> : <Brain className="w-3 h-3" />}
                  {isDeltaMode ? 'Red de Análisis Longitudinal Activa' : appMode === 'epidemiology_macro' ? 'Red de Vigilancia Activa' : appMode === 'immunology' ? 'Red de Modelado Activa' : 'Red Neuronal Activa'}
                </span>
                <span className="text-xs text-gray-600 dark:text-white/70 font-mono">
                  {sessions.length} {
                    isDeltaMode ? 'expedientes asimilados' :
                      appMode === 'investigator' ? 'investigaciones asimiladas' :
                        appMode === 'clinical' ? 'casos asimilados' :
                          appMode === 'epidemiology_macro' ? 'reportes asimilados' :
                            'modelados asimilados'
                  }
                </span>
              </div>
            </div>
          </div>

          {!isDeltaMode && (
            <form onSubmit={handleAnalyze} className="flex-1 max-w-2xl flex flex-col gap-2">
              <div className="relative group flex items-center">
                <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/20 transition-colors", appMode === 'investigator' ? "group-focus-within:text-emerald-500" : "group-focus-within:text-cyan-500")} />
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={appMode === 'investigator' ? "Enfermedad, compuesto o vía biológica..." :
                    appMode === 'clinical' ? "Síntomas, signos o caso clínico..." :
                      appMode === 'epidemiology_macro' ? "Región, enfermedad o brote..." :
                        "Patógeno, antígeno o condición..."}
                  className={cn("w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-none py-2 pl-10 pr-12 text-sm focus:outline-none transition-all placeholder:text-gray-400 dark:text-white/20",
                    appMode === 'investigator' ? "focus:border-emerald-500/50" :
                      appMode === 'clinical' ? "focus:border-cyan-500/50" :
                        appMode === 'epidemiology_macro' ? "focus:border-indigo-500/50" :
                          "focus:border-purple-500/50"
                  )}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isAnalyzing ? (
                    <Zap className={cn("w-4 h-4 animate-pulse",
                      appMode === 'investigator' ? "text-emerald-500" :
                        appMode === 'clinical' ? "text-cyan-500" :
                          appMode === 'epidemiology_macro' ? "text-indigo-500" :
                            "text-purple-500"
                    )} />
                  ) : (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".txt,.pdf,.doc,.docx,.hl7,.fhir,image/jpeg,image/png,image/jpg"
                        multiple
                      />
                      <button
                        type="button"
                        onClick={() => setIsAttachmentsOpen(true)}
                        disabled={isAnalyzing}
                        className="p-1.5 text-gray-500 dark:text-white/40 hover:text-gray-900 dark:text-white hover:bg-black/5 dark:bg-white/10 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                        title="Archivos Adjuntos"
                      >
                        <Paperclip className="w-4 h-4" />
                        {attachedFiles.length > 0 && (
                          <span className={cn("absolute -top-1 -right-1 w-3.5 h-3.5 flex items-center justify-center text-[9px] font-bold text-white rounded-full",
                            appMode === 'investigator' ? "bg-emerald-500" :
                              appMode === 'clinical' ? "bg-cyan-500" :
                                appMode === 'epidemiology_macro' ? "bg-indigo-500" :
                                  "bg-purple-500"
                          )}>
                            {attachedFiles.length}
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </form>
          )}

          <div className="flex items-center gap-2 sm:gap-4 shrink min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-gray-500 dark:text-white/40 hover:text-gray-900 dark:text-white"
              title="Alternar Panel"
            >
              <Activity className="w-5 h-5" />
            </button>
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg py-1.5 px-2 text-xs text-gray-700 dark:text-white/70 focus:outline-none focus:border-cyan-500/50 max-w-[90px] sm:max-w-[150px] md:max-w-xs truncate"
              title="Filtro del Bibliotecario"
            >
              <option value="Todas">Todas</option>
              <option value="Oncología">Oncología</option>
              <option value="Inmunología">Inmunología</option>
              <option value="Neurología">Neurología</option>
              <option value="Cardiología">Cardiología</option>
              <option value="Infectología">Infectología</option>
              <option value="Medicina Interna">Medicina Interna</option>
              <option value="Pediatría">Pediatría</option>
              <option value="Cirugía General">Cirugía General</option>
              <option value="Tórax">Tórax</option>
              <option value="Abdomen">Abdomen</option>
              <option value="Hombro y Cadera">Hombro y Cadera</option>
              <option value="Cráneo">Cráneo</option>
              <option value="Mamografía">Mamografía</option>
            </select>
            <div className="hidden md:flex flex-col items-end">
              <span className="mono-label">Estado del Sistema</span>
              <span className={cn("text-[10px] font-mono uppercase flex items-center gap-1", appMode === 'investigator' ? "text-emerald-500" : "text-cyan-500")}>
                <div className={cn("w-1 h-1 rounded-full animate-pulse", appMode === 'investigator' ? "bg-emerald-500" : "bg-cyan-500")} />
                {appMode === 'investigator' ? 'Tribunal Activo' : 'Clínica Activa'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row w-full min-h-0 relative">
        {/* Attachments Modal */}
        <AnimatePresence>
          {isAttachmentsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 dark:bg-black/80 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-black/10 dark:border-white/10 w-full max-w-md flex flex-col shadow-2xl"
              >
                <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-sm font-mono uppercase tracking-wider">Terminal de Archivos</h2>
                  </div>
                  <button
                    onClick={() => setIsAttachmentsOpen(false)}
                    className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:text-white"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 flex flex-col gap-4">
                  {attachedFiles.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                      {attachedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-sm">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-sm truncate">{file.name}</span>
                              <span className="text-[10px] text-gray-500 dark:text-white/40 font-mono uppercase">Documento Activo</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {file.mimeType.startsWith('image/') && !file.name.includes('[HOT]') && (
                              <button
                                onClick={() => !file.processed && applyThermalFilter(idx)}
                                className={cn(
                                  "p-2 rounded-sm transition-colors flex items-center gap-1",
                                  file.processed
                                    ? "text-emerald-500 bg-emerald-500/10 cursor-default"
                                    : "text-orange-400 hover:text-orange-300 hover:bg-orange-400/10"
                                )}
                                title={file.processed ? "Filtro Térmico Aplicado" : "Aplicar Mapa Térmico"}
                                disabled={file.processed}
                              >
                                {file.processed ? <CheckCircle2 className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                              </button>
                            )}
                            <button
                              onClick={() => removeAttachedFile(idx)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-sm transition-colors"
                              title="Eliminar archivo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-white/40 font-mono text-xs uppercase border border-dashed border-black/10 dark:border-white/10 rounded-sm">
                      No hay archivos adjuntos
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono uppercase text-gray-500 dark:text-white/60">DNI Paciente (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ej: 77777777"
                        value={patientDniInput}
                        onChange={(e) => setPatientDniInput(e.target.value)}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-sm p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-mono uppercase text-gray-500 dark:text-white/60">Etiqueta Clínica / Sospecha</label>
                      <input
                        type="text"
                        placeholder="Ej: Sospecha de Aspergiloma, Neumonía..."
                        value={suspectedPathology}
                        onChange={(e) => setSuspectedPathology(e.target.value)}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-sm p-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Tarjeta Máster o Advertencia del Paciente */}
                  {patientDniInput.trim() !== '' && (
                    <div className="mt-2">
                      {activePatient ? (
                        <div className="p-3 rounded-sm border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 backdrop-blur-sm relative overflow-hidden transition-all duration-300">
                          <div className="flex items-center gap-2 mb-1.5 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] uppercase font-bold tracking-wider">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Paciente Registrado
                          </div>
                          <div className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                            <p className="font-bold">{activePatient.name}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              Edad: {activePatient.age} {activePatient.birthdate ? `(${new Date(activePatient.birthdate).toLocaleDateString('es-ES')})` : ''} | Ciudad: {activePatient.city || 'No especificada'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-sm border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 backdrop-blur-sm relative overflow-hidden transition-all duration-300">
                          <div className="flex items-center gap-2 mb-1.5 text-amber-600 dark:text-amber-400 font-mono text-[10px] uppercase font-bold tracking-wider">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Paciente Nuevo
                          </div>
                          <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-normal">
                            No se encontró el DNI. Se creará un nuevo expediente maestro con DNI <strong className="font-mono">{patientDniInput}</strong> al momento de archivar o analizar el reporte.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAttachmentsOpen(false);
                        setIsDictationModalOpen(true);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-mono uppercase transition-colors",
                        "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500"
                      )}
                    >
                      <Mic className="w-4 h-4" />
                      Asistente de Dictado
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-mono uppercase transition-colors",
                        appMode === 'investigator' ? "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" :
                          appMode === 'clinical' ? "bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400" :
                            "bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400"
                      )}
                    >
                      <Paperclip className="w-4 h-4" />
                      Adjuntar Nuevo
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* History Sidebar */}
        <AnimatePresence>
          {isHistoryOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsHistoryOpen(false)}
                className="fixed inset-0 bg-gray-100 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="fixed lg:relative left-0 top-0 bottom-0 w-[320px] shrink-0 bg-[#f8f9fa] dark:bg-[#0f1115] border-r border-black/5 dark:border-white/5 z-50 flex flex-col shadow-2xl lg:shadow-none transition-colors duration-300"
              >
                <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-800 dark:text-white/80 flex items-center gap-2">
                    <Save className="w-4 h-4 text-emerald-500" /> Archivo Clínico
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="p-2 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                      title="Ajustes Generales"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsHelpOpen(true)}
                      className="p-2 text-red-500 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-all shadow-sm"
                      title="Guía de Modos"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="p-2 text-gray-500 hover:text-emerald-600 dark:text-white/50 dark:hover:text-emerald-400 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                      title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                    >
                      {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setIsHistoryOpen(false)}
                      className="p-2 text-gray-500 hover:text-rose-600 dark:text-white/50 dark:hover:text-rose-400 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-all lg:hidden"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  <button
                    onClick={handleNewSession}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 text-white text-[11px] font-bold uppercase tracking-widest py-3 rounded-lg transition-all shadow-md",
                      appMode === 'investigator'
                        ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 hover:shadow-emerald-500/40"
                        : appMode === 'clinical'
                          ? "bg-cyan-600 hover:bg-cyan-700 shadow-cyan-500/20 hover:shadow-cyan-500/40"
                          : appMode === 'epidemiology_macro'
                            ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20 hover:shadow-indigo-500/40"
                            : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 hover:shadow-purple-500/40"
                    )}
                  >
                    {appMode === 'investigator' ? <MessageSquare className="w-4 h-4" /> : appMode === 'clinical' ? <Activity className="w-4 h-4" /> : appMode === 'epidemiology_macro' ? <Globe className="w-4 h-4" /> : <Microscope className="w-4 h-4" />}
                    {appMode === 'investigator' ? 'Nuevo Debate' : appMode === 'clinical' ? 'Nuevo Caso' : appMode === 'epidemiology_macro' ? 'Nueva Vigilancia' : 'Nuevo Modelado'}
                  </button>

                  {appMode === 'clinical' && (
                    <div className="flex flex-col gap-3 px-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/50">Modo Socrático (Estudiantes)</span>
                        <button
                          onClick={async () => {
                            const newValue = !isSocraticMode;
                            setIsSocraticMode(newValue);
                            if (currentSession && currentSession.mode === 'clinical') {
                              const updatedSession = { ...currentSession, isSocraticMode: newValue };
                              setCurrentSession(updatedSession);
                              await saveSession(updatedSession);
                              loadSessions();
                            }
                          }}
                          className={cn(
                            "w-8 h-4 rounded-full transition-colors relative",
                            isSocraticMode ? "bg-cyan-500" : "bg-black/10 dark:bg-white/10"
                          )}
                        >
                          <span className={cn(
                            "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm",
                            isSocraticMode ? "translate-x-4" : "translate-x-0"
                          )} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5"><Users className="w-3 h-3" /> Junta Médica / Auditoría Red Team (Obligatorio)</span>
                        <button
                          disabled
                          className="w-8 h-4 rounded-full transition-colors relative bg-cyan-500 cursor-not-allowed"
                        >
                          <span className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm translate-x-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 scrollbar-hide">
                  {sharedSessions.length > 0 && (
                    <div className="mb-4">
                      <div className="px-2 py-1 mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-500/70 border-b border-amber-500/10 flex items-center gap-2">
                        <Share2 className="w-3 h-3" /> Red Delta (Global)
                      </div>
                      <div className="space-y-2">
                        {sharedSessions.map(ss => {
                          const s = ss.contenido_json;
                          return (
                            <div
                              key={`shared-${ss.session_id}`}
                              onClick={() => handleLoadSession(s)}
                              className="p-3.5 rounded-xl cursor-pointer transition-all border bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40 relative group"
                            >
                              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-xs font-bold text-amber-900 dark:text-amber-100 truncate mb-1 pr-4">
                                    {s.title}
                                  </h3>
                                  <p className="text-[10px] text-amber-700/70 dark:text-amber-300/50 line-clamp-2">
                                    Vence: {new Date(ss.expira_en).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {sessions.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 dark:text-white/30 text-xs font-mono border border-dashed border-black/10 dark:border-white/10 rounded-xl m-2 bg-white/30 dark:bg-black/30">
                      <Brain className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      No hay expedientes guardados.
                    </div>
                  ) : (
                    sessions.map(session => (
                      <div
                        key={session.id}
                        onClick={() => handleLoadSession(session)}
                        className={cn(
                          "p-3.5 rounded-xl cursor-pointer transition-all group border relative",
                          currentSession?.id === session.id
                            ? (session.mode === 'clinical' ? "bg-white dark:bg-[#1a1d24] border-cyan-500/30 dark:border-cyan-500/30 shadow-sm" : "bg-white dark:bg-[#1a1d24] border-emerald-500/30 dark:border-emerald-500/30 shadow-sm")
                            : "bg-white/50 dark:bg-[#16181d] border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-[#1a1d24] hover:border-black/10 dark:hover:border-white/10 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {editingSessionId === session.id ? (
                              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editTitleValue}
                                  onChange={e => setEditTitleValue(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleEditSessionSave(e, session);
                                    if (e.key === 'Escape') handleEditSessionCancel(e);
                                  }}
                                  autoFocus
                                  className="w-full text-sm font-medium bg-white dark:bg-black/40 border border-emerald-500 rounded-md px-2 py-1 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                                <button onClick={(e) => handleEditSessionSave(e, session)} className="text-emerald-500 hover:text-emerald-600 p-1.5 bg-emerald-500/10 rounded-md transition-colors">
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button onClick={handleEditSessionCancel} className="text-gray-400 hover:text-rose-500 p-1.5 hover:bg-rose-500/10 rounded-md transition-colors">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <h3 className={cn(
                                "text-sm font-medium truncate transition-colors flex items-center gap-2",
                                currentSession?.id === session.id
                                  ? (session.mode === 'clinical' ? "text-cyan-600 dark:text-cyan-400" : session.mode === 'immunology' ? "text-purple-600 dark:text-purple-400" : session.mode === 'epidemiology_macro' ? "text-indigo-600 dark:text-indigo-400" : "text-emerald-600 dark:text-emerald-400")
                                  : (session.mode === 'clinical' ? "text-gray-800 dark:text-white/90 group-hover:text-cyan-600 dark:group-hover:text-cyan-400" : session.mode === 'immunology' ? "text-gray-800 dark:text-white/90 group-hover:text-purple-600 dark:group-hover:text-purple-400" : session.mode === 'epidemiology_macro' ? "text-gray-800 dark:text-white/90 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" : "text-gray-800 dark:text-white/90 group-hover:text-emerald-600 dark:group-hover:text-emerald-400")
                              )}>
                                {session.isPinned && <Pin className={cn("w-3.5 h-3.5 shrink-0", session.mode === 'clinical' ? "text-cyan-500 fill-cyan-500/20" : session.mode === 'immunology' ? "text-purple-500 fill-purple-500/20" : session.mode === 'epidemiology_macro' ? "text-indigo-500 fill-indigo-500/20" : "text-emerald-500 fill-emerald-500/20")} />}
                                <span className="truncate">{session.title}</span>
                              </h3>
                            )}
                            <p className="text-[10px] text-gray-400 dark:text-white/40 font-mono mt-2 flex items-center gap-1.5 flex-wrap">
                              <span className={cn("w-1.5 h-1.5 rounded-full", session.mode === 'clinical' ? "bg-cyan-500/40" : session.mode === 'immunology' ? "bg-purple-500/40" : session.mode === 'epidemiology_macro' ? "bg-indigo-500/40" : "bg-emerald-500/40")}></span>
                              {new Date(session.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                              {session.mode === 'clinical' && (
                                <>
                                  <span className="ml-1 px-1.5 py-0.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded text-[8px] uppercase tracking-wider">
                                    {session.isSocraticMode ? 'Socrático' : 'Clínico'}
                                  </span>
                                  {session.isDebateMode && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded text-[8px] uppercase tracking-wider">
                                      Debate
                                    </span>
                                  )}
                                </>
                              )}
                              {session.mode === 'epidemiology_macro' && (
                                <span className="ml-1 px-1.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded text-[8px] uppercase tracking-wider">
                                  Epidemiología
                                </span>
                              )}
                              {session.mode === 'immunology' && (
                                <span className="ml-1 px-1.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded text-[8px] uppercase tracking-wider">
                                  Inmunología
                                </span>
                              )}
                              {(!session.mode || session.mode === 'investigator') && (
                                <span className="ml-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[8px] uppercase tracking-wider">
                                  Investigación
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === session.id ? null : session.id);
                              }}
                              className="text-gray-400 hover:text-gray-900 dark:text-white/40 dark:hover:text-white opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            <AnimatePresence>
                              {activeMenuId === session.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  transition={{ duration: 0.1 }}
                                  className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#1e2128] border border-black/5 dark:border-white/5 rounded-xl shadow-xl overflow-hidden z-50 py-1"
                                >
                                  {session.isDeltaMode ? (
                                    <button
                                      onClick={(e) => handleShareClick(e, session)}
                                      className="w-full text-left px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 flex items-center gap-2.5 transition-colors"
                                    >
                                      <Share2 className="w-3.5 h-3.5" />
                                      Compartir Delta
                                    </button>
                                  ) : (
                                    <button
                                      onClick={(e) => handlePinSession(e, session)}
                                      className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                                    >
                                      <Pin className="w-3.5 h-3.5" />
                                      {session.isPinned ? 'Desanclar' : 'Anclar'}
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => handleEditSessionStart(e, session)}
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Renombrar
                                  </button>
                                  {session.mode === 'clinical' && session.isDebateMode && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedQuarantineSession(session);
                                        setIsQuarantineModalOpen(true);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center gap-2.5 transition-colors"
                                    >
                                      <ShieldAlert className="w-3.5 h-3.5" />
                                      Cuarentena
                                    </button>
                                  )}
                                  <div className="h-px bg-black/5 dark:bg-white/5 my-1" />
                                  <button
                                    onClick={(e) => handleDeleteSession(e, session.id)}
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Eliminar
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-black/5 dark:border-white/5 flex gap-2 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                  <button onClick={handleExportJSON} className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-[#16181d] hover:bg-gray-50 dark:hover:bg-[#1a1d24] text-gray-700 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-lg transition-colors border border-black/5 dark:border-white/5 shadow-sm">
                    <Download className="w-3.5 h-3.5" /> Exportar
                  </button>
                  <label className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-[#16181d] hover:bg-gray-50 dark:hover:bg-[#1a1d24] text-gray-700 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-lg transition-colors border border-black/5 dark:border-white/5 shadow-sm cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Importar
                    <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                  </label>
                  <button
                    onClick={async () => {
                      await fetch('/api/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'logout' }),
                        credentials: 'include'
                      });
                      window.location.reload();
                    }}
                    title="Cerrar Sesión"
                    className="flex items-center justify-center px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:bg-rose-500/5 dark:hover:bg-rose-500/10 dark:text-rose-400 py-2.5 rounded-lg transition-colors border border-rose-500/20 shadow-sm"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Sidebar: Reasoning Stream */}
        <aside className={cn(
          "lg:w-[380px] border-r border-black/10 dark:border-white/10 bg-gray-100 dark:bg-black/40 backdrop-blur-sm flex flex-col transition-all duration-300",
          isSidebarOpen ? "h-[400px] lg:h-auto" : "h-0 lg:w-0 overflow-hidden border-r-0"
        )}>
          <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {isDeltaMode ? (
                <TrendingUp className="w-4 h-4 text-amber-500" />
              ) : appMode === 'investigator' ? (
                <Terminal className="w-4 h-4 text-emerald-500" />
              ) : appMode === 'clinical' ? (
                <Activity className="w-4 h-4 text-cyan-500" />
              ) : appMode === 'epidemiology_macro' ? (
                <Globe className="w-4 h-4 text-indigo-500" />
              ) : (
                <Microscope className="w-4 h-4 text-purple-500" />
              )}
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/60 truncate">
                {isDeltaMode ? 'Proceso Delta' :
                  appMode === 'investigator' ? 'Flujo del Debate' :
                    appMode === 'clinical' ? 'Razonamiento Clínico' :
                      appMode === 'epidemiology_macro' ? 'Vigilancia Epidemiológica' :
                        'Modelado Molecular Inmunológico'}
              </h2>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {(analysis || clinicalAnalysis || epidemiologyAnalysis || immunologyAnalysis) && (
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white bg-red-500/90 hover:bg-red-500 transition-colors rounded shadow-sm border border-red-600/50 print-hidden"
                  title="Imprimir / Guardar como PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Imprimir / PDF</span>
                </button>
              )}

              <span className="text-[9px] font-mono text-gray-400 dark:text-white/20 uppercase whitespace-nowrap">Traza en Vivo</span>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {steps.length === 0 && !isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-10">
                {isDeltaMode ? (
                  <TrendingUp className="w-10 h-10 mb-4" />
                ) : appMode === 'investigator' ? (
                  <Swords className="w-10 h-10 mb-4" />
                ) : appMode === 'clinical' ? (
                  <Activity className="w-10 h-10 mb-4" />
                ) : appMode === 'epidemiology_macro' ? (
                  <Globe className="w-10 h-10 mb-4" />
                ) : (
                  <Microscope className="w-10 h-10 mb-4" />
                )}
                <p className="text-[10px] font-mono uppercase tracking-widest">Esperando caso...</p>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {steps.map((step) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "p-3 border-l-2 bg-white/[0.02] space-y-2",
                    isDeltaMode ? "border-amber-500/50" :
                      step.type === 'investigator' ? "border-blue-500/50" :
                        step.type === 'critic' ? "border-rose-500/50" :
                          "border-emerald-500/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-tighter",
                        isDeltaMode ? "text-amber-500/80" :
                          step.type === 'investigator' ? "text-blue-500/80" :
                            step.type === 'critic' ? "text-rose-500/80" :
                              "text-emerald-500/80"
                      )}>{step.title}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-white/70 leading-relaxed font-mono">{step.content}</p>
                </motion.div>
              ))}
            </AnimatePresence>

            {isAnalyzing && (
              <div className={cn(
                "flex items-center gap-2 p-3",
                isDeltaMode ? "text-amber-500/30" : "text-emerald-500/30"
              )}>
                <div className={cn("w-1 h-1 rounded-full animate-bounce [animation-delay:-0.3s]", isDeltaMode ? "bg-amber-500" : "bg-emerald-500")} />
                <div className={cn("w-1 h-1 rounded-full animate-bounce [animation-delay:-0.15s]", isDeltaMode ? "bg-amber-500" : "bg-emerald-500")} />
                <div className={cn("w-1 h-1 rounded-full animate-bounce", isDeltaMode ? "bg-amber-500" : "bg-emerald-500")} />
                <span className="text-[9px] font-mono uppercase">
                  {isDeltaMode ? 'Ejecutando Análisis Delta...' :
                    appMode === 'investigator' ? 'Agentes debatiendo...' :
                      appMode === 'clinical' ? 'Analizando caso clínico...' :
                        appMode === 'epidemiology_macro' ? 'Procesando datos epidemiológicos...' :
                          'Modelando interacciones moleculares...'}
                </span>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-black/10 dark:border-white/10 bg-gray-100 dark:bg-black/20">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">
                {isDeltaMode ? 'Progreso del Análisis' :
                  appMode === 'investigator' ? 'Tensión del Debate' :
                    appMode === 'clinical' ? 'Proceso Clínico' :
                      appMode === 'epidemiology_macro' ? 'Proceso Epidemiológico' :
                        'Proceso Inmunológico'}
              </h2>
              <Activity className={cn("w-3 h-3",
                isDeltaMode ? "text-amber-500/50" :
                  appMode === 'investigator' ? "text-emerald-500/50" :
                    appMode === 'clinical' ? "text-cyan-500/50" :
                      appMode === 'epidemiology_macro' ? "text-indigo-500/50" :
                        "text-purple-500/50"
              )} />
            </div>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={
                        isDeltaMode ? "#f59e0b" :
                          appMode === 'investigator' ? "#10b981" :
                            appMode === 'clinical' ? "#06b6d4" :
                              appMode === 'epidemiology_macro' ? "#6366f1" :
                                "#a855f7"
                      } stopOpacity={0.2} />
                      <stop offset="95%" stopColor={
                        isDeltaMode ? "#f59e0b" :
                          appMode === 'investigator' ? "#10b981" :
                            appMode === 'clinical' ? "#06b6d4" :
                              appMode === 'epidemiology_macro' ? "#6366f1" :
                                "#a855f7"
                      } stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="confidence" stroke={
                    isDeltaMode ? "#f59e0b" :
                      appMode === 'investigator' ? "#10b981" :
                        appMode === 'clinical' ? "#06b6d4" :
                          appMode === 'epidemiology_macro' ? "#6366f1" :
                            "#a855f7"
                  } strokeWidth={1} fillOpacity={1} fill="url(#colorConf)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </aside>

        {/* Main Content: Analysis Results */}
        <main id="pdf-report-content" className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          {(!analysis && !clinicalAnalysis && !epidemiologyAnalysis && !immunologyAnalysis && !deltaAnalysis) ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 border border-black/10 dark:border-white/10 flex items-center justify-center mb-6 rotate-45">
                {isDeltaMode ? (
                  <TrendingUp className="w-8 h-8 text-amber-400/30 -rotate-45" />
                ) : appMode === 'investigator' ? (
                  <Swords className="w-8 h-8 text-gray-300 dark:text-white/10 -rotate-45" />
                ) : appMode === 'clinical' ? (
                  <Activity className="w-8 h-8 text-gray-300 dark:text-white/10 -rotate-45" />
                ) : appMode === 'immunology' ? (
                  <Microscope className="w-8 h-8 text-purple-400/30 -rotate-12" />
                ) : (
                  <Globe className="w-8 h-8 text-indigo-400/30 -rotate-12" />
                )}
              </div>
              <h3 className={cn(
                "text-lg font-light mb-2 uppercase tracking-[0.2em]",
                isDeltaMode ? "text-amber-400/50" :
                  appMode === 'immunology' ? "text-purple-400/50" :
                    appMode === 'epidemiology_macro' ? "text-indigo-400/50" : "text-gray-400 dark:text-white/30"
              )}>
                {isDeltaMode ? 'Análisis Delta en Espera' :
                  appMode === 'investigator' ? 'Tribunal en Espera' :
                    appMode === 'clinical' ? 'Modo Clínico Activo' :
                      appMode === 'immunology' ? 'Modelado Inmunológico Activo' :
                        'Vigilancia Epidemiológica Activa'}
              </h3>
              <p className="text-[11px] text-gray-400 dark:text-white/20 max-w-xs uppercase tracking-wider leading-loose mb-6">
                {isDeltaMode
                  ? 'Seleccione un paciente en el Archivo de Pacientes para ejecutar el Análisis Delta.'
                  : appMode === 'investigator'
                    ? 'Inicie el proceso para enfrentar al Investigador contra el Crítico Clínico.'
                    : appMode === 'clinical'
                      ? 'Ingrese el cuadro clínico para obtener diagnósticos diferenciales y plan de abordaje.'
                      : appMode === 'immunology'
                        ? 'Ingrese el patógeno o condición para modelar interacciones moleculares y respuesta inmune.'
                        : 'Adjunte historias clínicas o imágenes de reportes para detectar amenazas y predecir riesgos.'}
              </p>
              {isDeltaMode && (
                <button
                  onClick={() => setIsPatientArchiveOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-widest rounded shadow-sm transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  Abrir Archivo de Pacientes
                </button>
              )}
            </div>
          ) : isDeltaMode && deltaAnalysis ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8 relative"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-4 border-amber-600/40 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.5em] text-amber-600 dark:text-amber-400">ANÁLISIS DELTA</span>
                  </div>
                  <h1 className="text-5xl font-black tracking-tighter uppercase text-gray-900 dark:text-white italic leading-none">
                    {deltaAnalysis.patientName}
                  </h1>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <section className="strict-card p-6 sm:p-8 border-l-4 border-l-amber-500 bg-white/50 dark:bg-amber-500/5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-6 h-6 text-amber-500" />
                    <h2 className="text-xl font-bold tracking-tight uppercase text-amber-700 dark:text-amber-400">Resumen Ejecutivo</h2>
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    <p className="mb-4 font-semibold text-amber-600 dark:text-amber-400">Período de Comparación: {deltaAnalysis.comparisonPeriod}</p>
                    <div className="markdown-body prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-amber-600 dark:prose-headings:text-amber-400">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {deltaAnalysis.executiveSummary}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {(deltaAnalysis.interventionPriority || deltaAnalysis.sepsisRiskScore) && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deltaAnalysis.interventionPriority && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-md">
                          <h4 className="text-[10px] font-mono text-rose-600 dark:text-rose-400 uppercase mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" /> Acción Cero
                          </h4>
                          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{deltaAnalysis.interventionPriority.actionZero}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 italic">{deltaAnalysis.interventionPriority.rationale}</p>
                        </div>
                      )}
                      {deltaAnalysis.sepsisRiskScore && (
                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                          <h4 className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 uppercase mb-2 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Riesgo de Sepsis
                          </h4>
                          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{deltaAnalysis.sepsisRiskScore.score}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{deltaAnalysis.sepsisRiskScore.interpretation}</p>
                          <span className={`text-[10px] font-bold uppercase ${deltaAnalysis.sepsisRiskScore.trend === 'ascendente' ? 'text-rose-500' :
                            deltaAnalysis.sepsisRiskScore.trend === 'descendente' ? 'text-emerald-500' : 'text-blue-500'
                            }`}>
                            Tendencia: {deltaAnalysis.sepsisRiskScore.trend}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="strict-card p-6 sm:p-8 border-l-4 border-l-emerald-500 bg-white/50 dark:bg-emerald-500/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      <h2 className="text-xl font-bold tracking-tight uppercase text-emerald-700 dark:text-emerald-400">Mejoras</h2>
                    </div>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800 dark:text-gray-200">
                      {deltaAnalysis.improvements.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                      {deltaAnalysis.improvements.length === 0 && <li className="text-gray-500 italic">No se identificaron mejoras significativas.</li>}
                    </ul>
                  </section>

                  <section className="strict-card p-6 sm:p-8 border-l-4 border-l-rose-500 bg-white/50 dark:bg-rose-500/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <Activity className="w-6 h-6 text-rose-500" />
                      <h2 className="text-xl font-bold tracking-tight uppercase text-rose-700 dark:text-rose-400">Deterioros</h2>
                    </div>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800 dark:text-gray-200">
                      {deltaAnalysis.worsenings.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                      {deltaAnalysis.worsenings.length === 0 && <li className="text-gray-500 italic">No se identificaron deterioros significativos.</li>}
                    </ul>
                  </section>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="strict-card p-6 sm:p-8 border-l-4 border-l-blue-500 bg-white/50 dark:bg-blue-500/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <Activity className="w-6 h-6 text-blue-500" />
                      <h2 className="text-xl font-bold tracking-tight uppercase text-blue-700 dark:text-blue-400">Condiciones Estables</h2>
                    </div>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800 dark:text-gray-200">
                      {deltaAnalysis.stableConditions.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                      {deltaAnalysis.stableConditions.length === 0 && <li className="text-gray-500 italic">No se identificaron condiciones estables.</li>}
                    </ul>
                  </section>

                  <section className="strict-card p-6 sm:p-8 border-l-4 border-l-purple-500 bg-white/50 dark:bg-purple-500/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <Lightbulb className="w-6 h-6 text-purple-500" />
                      <h2 className="text-xl font-bold tracking-tight uppercase text-purple-700 dark:text-purple-400">Alertas Predictivas</h2>
                    </div>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800 dark:text-gray-200">
                      {deltaAnalysis.predictiveAlerts.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                      {deltaAnalysis.predictiveAlerts.length === 0 && <li className="text-gray-500 italic">No hay alertas predictivas.</li>}
                    </ul>
                  </section>
                </div>

                <section className="strict-card p-6 sm:p-8 border-l-4 border-l-indigo-500 bg-white/50 dark:bg-indigo-500/5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Microscope className="w-6 h-6 text-indigo-500" />
                    <h2 className="text-xl font-bold tracking-tight uppercase text-indigo-700 dark:text-indigo-400">Correlaciones de Tratamiento</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                          <th scope="col" className="px-6 py-3">Tratamiento</th>
                          <th scope="col" className="px-6 py-3">Efecto</th>
                          <th scope="col" className="px-6 py-3">Línea de Tiempo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deltaAnalysis.treatmentCorrelations.map((corr, idx) => (
                          <tr key={idx} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{corr.treatment}</td>
                            <td className="px-6 py-4">{corr.effect}</td>
                            <td className="px-6 py-4">{corr.timeline}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {deltaAnalysis.treatmentCorrelations.length === 0 && <p className="text-gray-500 italic mt-4">No se identificaron correlaciones de tratamiento.</p>}
                  </div>
                </section>

                {deltaAnalysis.trajectoryData && deltaAnalysis.trajectoryData.length > 0 && (
                  <section className="strict-card p-6 sm:p-8 border-l-4 border-l-cyan-500 bg-white/50 dark:bg-cyan-500/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <TrendingUp className="w-6 h-6 text-cyan-500" />
                      <h2 className="text-xl font-bold tracking-tight uppercase text-cyan-700 dark:text-cyan-400">Trayectoria: {deltaAnalysis.trajectoryData[0]?.metric}</h2>
                    </div>
                    {deltaAnalysis.trajectoryData.length < 2 ? (
                      <div className="h-64 w-full flex items-center justify-center border border-dashed border-cyan-500/30 rounded-lg bg-cyan-500/5">
                        <div className="text-center">
                          <Activity className="w-8 h-8 text-cyan-500/50 mx-auto mb-2" />
                          <p className="text-sm text-cyan-700 dark:text-cyan-400 font-medium">Datos Insuficientes</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">Se requieren al menos 2 reportes históricos para graficar una trayectoria clínica evolutiva.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={deltaAnalysis.trajectoryData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                              <YAxis stroke="#6b7280" fontSize={12} />
                              <RechartsTooltip
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl text-sm z-50">
                                        <p className="text-cyan-400 font-bold mb-1">{label}</p>
                                        <p className="text-white mb-2"><span className="text-gray-400 font-medium">{data.metric || 'Valor'}:</span> {data.value}</p>
                                        {data.milestone && (
                                          <div className="bg-cyan-500/20 border border-cyan-500/30 p-2 rounded text-cyan-100 max-w-xs whitespace-pre-wrap leading-snug">
                                            <span className="font-bold text-cyan-300 mr-1 text-xs uppercase tracking-wider">Hito:</span>
                                            {data.milestone}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5, fill: '#1f2937', stroke: '#06b6d4', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#06b6d4' }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        {deltaAnalysis.trajectoryAnalysis && (
                          <div className="mt-4 p-4 bg-cyan-50/50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-500/30 rounded-lg">
                            <h3 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5" />
                              Análisis de la Curva
                            </h3>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                              {deltaAnalysis.trajectoryAnalysis}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                )}
              </div>
            </motion.div>
          ) : appMode === 'epidemiology_macro' && epidemiologyAnalysis ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8 relative"
            >
              {/* Epidemiology Background Pattern - More distinct for Surveillance */}
              <div className="absolute inset-0 -z-10 opacity-[0.05] dark:opacity-[0.08] pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, #6366f1 1px, transparent 0)',
                  backgroundSize: '32px 32px'
                }}></div>
                <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{
                  backgroundImage: 'linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)',
                  backgroundSize: '160px 160px'
                }}></div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-4 border-indigo-600/40 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.5em] text-indigo-600 dark:text-indigo-400">CENTRO DE VIGILANCIA ACTIVA</span>
                  </div>
                  <h1 className="text-5xl font-black tracking-tighter uppercase text-gray-900 dark:text-white italic leading-none">
                    EPI<span className="text-indigo-600 dark:text-indigo-400 not-italic">WATCH</span>
                  </h1>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 dark:text-white/40 uppercase tracking-widest">
                  <div className="flex flex-col items-end">
                    <span>ID DE REPORTE</span>
                    <span className="font-bold text-gray-900 dark:text-white">EPI-{Date.now().toString().slice(-6)}</span>
                  </div>
                  <div className="w-px h-8 bg-black/10 dark:bg-white/10"></div>
                  <div className="flex flex-col items-end">
                    <span>ESTADO</span>
                    <span className="font-bold text-indigo-500">ACTIVO</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-px bg-black/5 dark:bg-white/5 border border-indigo-500/20 p-px rounded-sm">
                {[
                  { id: 'overview', label: 'Reporte de Vigilancia', icon: Globe },
                  { id: 'chat', label: 'Centro de Control', icon: MessageSquare },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all",
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                        : "text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-indigo-500/10"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-8">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 gap-8">
                    {/* Archive Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setArchiveModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded shadow-sm transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Archivar en Expediente
                      </button>
                    </div>

                    <section className="strict-card p-6 sm:p-8 border-l-4 border-l-indigo-500 bg-white/50 dark:bg-indigo-500/5 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <Globe className="w-6 h-6 text-indigo-500" />
                        <h2 className="text-xl font-bold tracking-tight uppercase text-indigo-700 dark:text-indigo-400">Perfil de la Región y Demografía</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded border border-indigo-100 dark:border-indigo-500/20">
                          <span className="text-xs font-semibold uppercase text-indigo-700 dark:text-indigo-300 block mb-1">Ubicación / Población en Riesgo</span>
                          <p className="text-sm font-bold">{epidemiologyAnalysis.regionProfile.location} / {epidemiologyAnalysis.regionProfile.populationAtRisk}</p>
                        </div>
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded border border-indigo-100 dark:border-indigo-500/20">
                          <span className="text-xs font-semibold uppercase text-indigo-700 dark:text-indigo-300 block mb-1">Semana Epidemiológica</span>
                          <p className="text-sm font-bold">{epidemiologyAnalysis.regionProfile.epidemiologicalWeek || 'No especificada'}</p>
                        </div>
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded border border-indigo-100 dark:border-indigo-500/20">
                          <span className="text-xs font-semibold uppercase text-indigo-700 dark:text-indigo-300 block mb-1">Incidencia / Prevalencia</span>
                          <p className="text-sm font-bold">{epidemiologyAnalysis.regionProfile.incidenceRate || 'N/A'} / {epidemiologyAnalysis.regionProfile.prevalenceRate || 'N/A'}</p>
                        </div>
                      </div>
                      {epidemiologyAnalysis.regionProfile.demographicContext && (
                        <div className="p-4 bg-white/50 dark:bg-white/5 border border-indigo-100 dark:border-indigo-500/20 rounded-md">
                          <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase mb-2">Contexto Demográfico y Social</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{epidemiologyAnalysis.regionProfile.demographicContext}</p>
                        </div>
                      )}
                    </section>

                    {epidemiologyAnalysis.outbreakDynamics && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-rose-500 bg-white/50 dark:bg-rose-500/5 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <Activity className="w-6 h-6 text-rose-500" />
                          <h2 className="text-xl font-bold tracking-tight uppercase text-rose-700 dark:text-rose-400">Dinámica del Brote Transmisible</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 bg-rose-50 dark:bg-rose-500/10 rounded border border-rose-100 dark:border-rose-500/20">
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold uppercase text-rose-700 dark:text-rose-300 block mb-1">Tendencia de la Curva</span>
                                <p className="text-lg font-black text-rose-600 dark:text-rose-400 uppercase tracking-tighter italic break-words">{epidemiologyAnalysis.outbreakDynamics.epidemicCurveTrend.replace('_', ' ')}</p>
                              </div>
                              <div className="sm:text-right flex-1 min-w-0">
                                <span className="text-xs font-semibold uppercase text-rose-700 dark:text-rose-300 block mb-1">R0 Estimado</span>
                                <p className="text-2xl font-black text-rose-700 dark:text-rose-300 break-words">{epidemiologyAnalysis.outbreakDynamics.basicReproductionNumber || 'N/A'}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-mono text-rose-600 dark:text-rose-400 uppercase mb-3">Vectores de Transmisión</h4>
                              <div className="flex flex-wrap gap-2">
                                {epidemiologyAnalysis.outbreakDynamics.transmissionVectors.map((v, i) => (
                                  <span key={i} className="px-2 py-1 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] rounded border border-rose-500/20 font-bold">
                                    {v}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded shadow-inner">
                            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase mb-2">Análisis de Transmisión</h4>
                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{epidemiologyAnalysis.outbreakDynamics.rationale}</p>
                          </div>
                        </div>
                      </section>
                    )}

                    {epidemiologyAnalysis.genomicEpidemiology && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-purple-500 bg-white/50 dark:bg-purple-500/5 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <Microscope className="w-6 h-6 text-purple-500" />
                          <h2 className="text-xl font-bold tracking-tight uppercase text-purple-700 dark:text-purple-400">Epidemiología Genómica y Variantes</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="p-4 bg-purple-50 dark:bg-purple-500/10 rounded border border-purple-100 dark:border-purple-500/20">
                              <h4 className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase mb-3">Variantes / Serotipos Detectados</h4>
                              <div className="flex flex-wrap gap-2">
                                {epidemiologyAnalysis.genomicEpidemiology.variantsOrSerotypes.map((v, i) => (
                                  <span key={i} className="px-2 py-1 bg-purple-600 text-white text-[10px] rounded font-bold tracking-wider uppercase">{v}</span>
                                ))}
                              </div>
                            </div>
                            {epidemiologyAnalysis.genomicEpidemiology.mutationRateAnalysis && (
                              <div className="p-4 bg-white/50 dark:bg-white/5 border border-purple-100 dark:border-purple-500/20 rounded">
                                <h5 className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase mb-1">Análisis de Tasa de Mutación</h5>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{epidemiologyAnalysis.genomicEpidemiology.mutationRateAnalysis}</p>
                              </div>
                            )}
                          </div>
                          <div className="space-y-3">
                            {epidemiologyAnalysis.genomicEpidemiology.transmissionAdvantage && (
                              <div className="p-3 bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20 rounded">
                                <p className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase mb-1">Ventaja de Transmisión</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{epidemiologyAnalysis.genomicEpidemiology.transmissionAdvantage}</p>
                              </div>
                            )}
                            {epidemiologyAnalysis.genomicEpidemiology.impactOnDiagnostics && (
                              <div className="p-3 bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20 rounded">
                                <p className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase mb-1">Impacto en Diagnóstico</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{epidemiologyAnalysis.genomicEpidemiology.impactOnDiagnostics}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </section>
                    )}

                    {epidemiologyAnalysis.socioeconomicImpact && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-emerald-500 bg-white/50 dark:bg-emerald-500/5 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <DollarSign className="w-6 h-6 text-emerald-500" />
                          <h2 className="text-xl font-bold tracking-tight uppercase text-emerald-700 dark:text-emerald-400">Impacto Socioeconómico</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded border border-emerald-100 dark:border-emerald-500/20">
                            <span className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300 block mb-2">Carga Económica</span>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{epidemiologyAnalysis.socioeconomicImpact.economicBurden}</p>
                          </div>
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded border border-emerald-100 dark:border-emerald-500/20">
                            <span className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300 block mb-2">Productividad Laboral</span>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{epidemiologyAnalysis.socioeconomicImpact.laborProductivityImpact}</p>
                          </div>
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded border border-emerald-100 dark:border-emerald-500/20">
                            <span className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300 block mb-2">Desigualdad Social</span>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{epidemiologyAnalysis.socioeconomicImpact.socialInequityFactor}</p>
                          </div>
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded border border-emerald-100 dark:border-emerald-500/20">
                            <span className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300 block mb-2">Impacto Educativo</span>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{epidemiologyAnalysis.socioeconomicImpact.educationalImpact || 'N/A'}</p>
                          </div>
                        </div>
                      </section>
                    )}

                    {epidemiologyAnalysis.epidemicProjection && epidemiologyAnalysis.epidemicProjection.dataPoints.length > 0 && (
                      <section className="strict-card p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <Activity className="w-6 h-6 text-indigo-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase">Proyección de Curva Epidémica</h2>
                        </div>
                        <div className="h-64 w-full mb-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={epidemiologyAnalysis.epidemicProjection.dataPoints} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                              <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                              <RechartsTooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                              />
                              <Legend wrapperStyle={{ fontSize: '12px' }} />
                              <Line type="monotone" dataKey="projectedCases" name="Casos Proyectados" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-100 dark:border-indigo-800 text-sm text-indigo-800 dark:text-indigo-200">
                          <span className="font-bold">Análisis de Proyección: </span>
                          {epidemiologyAnalysis.epidemicProjection.description}
                        </div>
                      </section>
                    )}

                    <section className="strict-card p-6 sm:p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <Network className="w-6 h-6 text-indigo-500" />
                        <h2 className="text-lg font-bold tracking-tight uppercase">Factores Ambientales e Impacto en Salud</h2>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-xs font-mono text-indigo-600 dark:text-indigo-400 uppercase mb-4">Factores Ambientales</h4>
                          <div className="space-y-3">
                            {epidemiologyAnalysis.environmentalFactors.map((factor, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-md">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                                  <span className="font-semibold text-sm">{factor.factor}</span>
                                  <span className={cn(
                                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border w-fit self-start break-words",
                                    factor.impact === 'facilitador' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30" :
                                      factor.impact === 'barrera' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30" :
                                        "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                                  )}>
                                    {healText(factor.impact)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{factor.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-mono text-indigo-600 dark:text-indigo-400 uppercase mb-4">Impacto en Sistema de Salud</h4>
                          <div className="space-y-3">
                            {epidemiologyAnalysis.healthcareSystemImpact.map((impact, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-md">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                                  <span className="font-semibold text-sm">{impact.resourceType}</span>
                                  <span className={cn(
                                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border w-fit self-start break-words",
                                    impact.currentStatus === 'colapso' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30" :
                                      impact.currentStatus === 'saturado' ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30" :
                                        impact.currentStatus === 'tensión' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30" :
                                          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                                  )}>
                                    {impact.currentStatus}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{impact.rationale}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="strict-card p-6 sm:p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <ShieldAlert className="w-6 h-6 text-indigo-500" />
                        <h2 className="text-lg font-bold tracking-tight uppercase">Análisis de Riesgo y Amenazas</h2>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-mono text-indigo-600 dark:text-indigo-400 uppercase mb-4">Amenazas Actuales Identificadas</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {epidemiologyAnalysis.riskAnalysis.currentThreats.map((threat, idx) => (
                              <div key={idx} className="p-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-md">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                  <h5 className="text-sm font-bold text-gray-900 dark:text-white">{threat.condition}</h5>
                                  <span className={cn(
                                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border w-fit self-start break-words",
                                    threat.riskLevel === 'crítico' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30" :
                                      threat.riskLevel === 'alto' ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30" :
                                        threat.riskLevel === 'medio' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30" :
                                          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                                  )}>
                                    Riesgo {threat.riskLevel}
                                  </span>
                                </div>
                                <ReactMarkdown className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed" remarkPlugins={[remarkGfm]}>{healText(threat.rationale)}</ReactMarkdown>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-mono text-indigo-600 dark:text-indigo-400 uppercase mb-4">Predicciones de Riesgo Futuro</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {epidemiologyAnalysis.riskAnalysis.futurePredictions.map((pred, idx) => (
                              <div key={idx} className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-md">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                  <h5 className="text-sm font-bold text-indigo-700 dark:text-indigo-300 pr-2">{pred.potentialCondition}</h5>
                                  <span className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded shadow-sm bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30 w-fit self-start break-words">{pred.timeframe}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-white/10 h-1 rounded-full mb-3 overflow-hidden">
                                  <div
                                    className="bg-indigo-500 h-full transition-all duration-1000"
                                    style={{ width: `${pred.probability * 100}%` }}
                                  />
                                </div>
                                <ReactMarkdown className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed" remarkPlugins={[remarkGfm]}>{healText(pred.rationale)}</ReactMarkdown>
                                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-2 uppercase tracking-widest">Probabilidad: {(pred.probability * 100).toFixed(0)}%</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="strict-card p-6 sm:p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <Activity className="w-6 h-6 text-indigo-500" />
                        <h2 className="text-lg font-bold tracking-tight uppercase">Vulnerabilidad Poblacional</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {epidemiologyAnalysis.populationVulnerability.map((vuln, idx) => (
                          <div key={idx} className="p-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-md">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                              <h5 className="text-sm font-bold text-gray-900 dark:text-white">{vuln.groupOrZone}</h5>
                              <span className={cn(
                                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border w-fit self-start break-words",
                                vuln.vulnerabilityScore === 'crítica' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30" :
                                  vuln.vulnerabilityScore === 'alta' ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30" :
                                    vuln.vulnerabilityScore === 'media' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30" :
                                      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                              )}>
                                Vulnerabilidad {vuln.vulnerabilityScore}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Factor de Riesgo: {vuln.riskFactor}</p>
                            <ReactMarkdown className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed" remarkPlugins={[remarkGfm]}>{healText(vuln.rationale)}</ReactMarkdown>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="strict-card p-6 sm:p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <Beaker className="w-6 h-6 text-indigo-500" />
                        <h2 className="text-lg font-bold tracking-tight uppercase">Optimización de Recursos y Escenarios</h2>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-xs font-mono text-indigo-600 dark:text-indigo-400 uppercase mb-4">Optimización de Recursos</h4>
                          <div className="space-y-3">
                            {epidemiologyAnalysis.resourceOptimization.map((opt, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-md">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                                  <span className="font-semibold text-sm">{opt.resourceType}</span>
                                  <span className={cn(
                                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border w-fit self-start break-words",
                                    opt.urgency === 'inmediata' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30" :
                                      opt.urgency === 'alta' ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30" :
                                        opt.urgency === 'media' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30" :
                                          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                                  )}>
                                    Urgencia {opt.urgency}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Asignación: {opt.recommendedAllocation}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{opt.rationale}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        {epidemiologyAnalysis.scenarioSimulation && epidemiologyAnalysis.scenarioSimulation.length > 0 && (
                          <div>
                            <h4 className="text-xs font-mono text-indigo-600 dark:text-indigo-400 uppercase mb-4">Modelado de Escenarios (What-If)</h4>
                            <div className="space-y-3">
                              {epidemiologyAnalysis.scenarioSimulation.map((sim, idx) => (
                                <div key={idx} className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-md">
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                                    <span className="font-semibold text-sm text-indigo-700 dark:text-indigo-300">{sim.scenario}</span>
                                    <span className={cn(
                                      "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border w-fit self-start break-words",
                                      sim.impactLevel === 'catastrófico' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30" :
                                        sim.impactLevel === 'negativo' ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30" :
                                          sim.impactLevel === 'neutral' ? "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700" :
                                            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                                    )}>
                                      Impacto {sim.impactLevel}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">{sim.predictedOutcome}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="strict-card p-6 sm:p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        <h2 className="text-lg font-bold tracking-tight uppercase">Medidas Preventivas Anticipadas</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {epidemiologyAnalysis.preventiveMeasures.map((measure, idx) => (
                          <div key={idx} className="flex gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-md">
                            <div className="shrink-0">
                              <div className={cn(
                                "w-2 h-2 rounded-full mt-1.5",
                                measure.priority === 'inmediata' ? "bg-rose-500 animate-pulse" :
                                  measure.priority === 'alta' ? "bg-amber-500" :
                                    "bg-emerald-500"
                              )} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{measure.action}</h4>
                              <ReactMarkdown className="text-xs text-gray-600 dark:text-gray-400 mb-2" remarkPlugins={[remarkGfm]}>{healText(measure.rationale)}</ReactMarkdown>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Prioridad {measure.priority}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {epidemiologyAnalysis.policyRecommendations && epidemiologyAnalysis.policyRecommendations.length > 0 && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-indigo-600 bg-indigo-500/5">
                        <div className="flex items-center gap-3 mb-6">
                          <Gavel className="w-6 h-6 text-indigo-600" />
                          <h2 className="text-lg font-bold tracking-tight uppercase text-indigo-700 dark:text-indigo-400">Recomendaciones de Política y Marco Legal</h2>
                        </div>
                        <div className="space-y-4">
                          {epidemiologyAnalysis.policyRecommendations.map((policy, idx) => (
                            <div key={idx} className="p-4 bg-white dark:bg-white/5 border border-indigo-100 dark:border-indigo-500/20 rounded-md shadow-sm">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{policy.recommendation}</h4>
                                <span className={cn(
                                  "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border w-fit self-start break-words",
                                  policy.implementationDifficulty === 'alta' ? "bg-rose-100 text-rose-700 border-rose-200" :
                                    policy.implementationDifficulty === 'media' ? "bg-amber-100 text-amber-700 border-amber-200" :
                                      "bg-emerald-100 text-emerald-700 border-emerald-200"
                                )}>
                                  Dificultad {policy.implementationDifficulty}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-500/10">
                                <div>
                                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase mb-1">Marco Legal / Regulatorio</p>
                                  <p className="text-sm text-gray-800 dark:text-gray-200">{policy.legalFramework || 'No especificado'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase mb-1">Resultado Esperado</p>
                                  <p className="text-sm text-gray-800 dark:text-gray-200 italic">{policy.expectedOutcome}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {epidemiologyAnalysis.riskCommunication && epidemiologyAnalysis.riskCommunication.length > 0 && (
                      <section className="strict-card p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <MessageSquare className="w-6 h-6 text-indigo-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase">Estrategia de Comunicación de Riesgo</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {epidemiologyAnalysis.riskCommunication.map((comm, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-md">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Público Objetivo: {comm.targetAudience}</h4>
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase mb-1">Mensaje Clave</p>
                                <p className="text-sm text-gray-800 dark:text-gray-200 italic">"{comm.keyMessage}"</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase mb-1">Canales de Difusión</p>
                                <div className="flex flex-wrap gap-2">
                                  {comm.mediaChannels.map((channel, cIdx) => (
                                    <span key={cIdx} className="px-3 py-1.5 text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200 rounded-md shadow-sm border border-indigo-200 dark:border-indigo-500/30">
                                      {channel}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {epidemiologyAnalysis.surveillanceAlerts.length > 0 && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/10 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <Zap className="w-6 h-6 text-rose-600 dark:text-rose-500 animate-pulse" />
                          <h2 className="text-lg font-bold tracking-tight uppercase text-rose-700 dark:text-rose-400">Alertas de Vigilancia Epidemiológica</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {epidemiologyAnalysis.surveillanceAlerts.map((alert, idx) => (
                            <div key={idx} className={cn(
                              "flex items-start gap-4 p-4 rounded border shadow-sm transition-all hover:scale-[1.01]",
                              alert.level === 'critical' ? "bg-rose-100 border-rose-200 dark:bg-rose-500/20 dark:border-rose-500/30" :
                                alert.level === 'warning' ? "bg-amber-100 border-amber-200 dark:bg-amber-500/20 dark:border-amber-500/30" :
                                  "bg-indigo-100 border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-500/30"
                            )}>
                              <div className={cn(
                                "p-2 rounded-full",
                                alert.level === 'critical' ? "bg-rose-500 text-white" :
                                  alert.level === 'warning' ? "bg-amber-500 text-white" :
                                    "bg-indigo-500 text-white"
                              )}>
                                <ShieldAlert className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col gap-1 mb-2">
                                  <span className={cn(
                                    "text-sm font-black uppercase tracking-widest",
                                    alert.level === 'critical' ? "text-rose-800 dark:text-rose-300" :
                                      alert.level === 'warning' ? "text-amber-800 dark:text-amber-300" :
                                        "text-indigo-800 dark:text-indigo-300"
                                  )}>
                                    Nivel {alert.level}
                                  </span>
                                  <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider break-words">Trigger: {alert.trigger}</span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed mb-1 break-words">{alert.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="strict-card flex flex-col h-[600px]">
                    <div className="p-4 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-indigo-500" />
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-widest">Consulta de Vigilancia</h3>
                          <p className="text-[10px] font-mono text-gray-500 dark:text-white/40 uppercase tracking-widest">Epidemiólogo de Vanguardia</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">En Línea</span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar" ref={chatScrollRef}>
                      {currentSession.chatHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                          <MessageSquare className="w-8 h-8 mb-4 text-indigo-500" />
                          <h4 className="text-sm font-bold uppercase tracking-widest mb-2 text-indigo-400">
                            Vigilancia Epidemiológica Activa
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-white/40 max-w-xs">
                            Aquí puede profundizar en el análisis epidemiológico sobre <strong>{currentSession.topic}</strong>.
                            Pregunte sobre riesgos poblacionales, medidas de control o predicciones.
                          </p>
                        </div>
                      ) : (
                        currentSession.chatHistory.map((msg) => (
                          <div key={msg.id} className={cn(
                            "flex flex-col gap-2 max-w-[85%]",
                            msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                          )}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 dark:text-white/40">
                                {msg.role === 'user' ? 'Tú' : 'Epidemiólogo'}
                              </span>
                              <span className="text-[9px] font-mono text-gray-400 dark:text-white/20">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className={cn(
                              "p-4 rounded-lg text-sm leading-relaxed shadow-sm",
                              msg.role === 'user'
                                ? "bg-indigo-600 text-white rounded-tr-none"
                                : "bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 text-gray-800 dark:text-white/90 rounded-tl-none"
                            )}>
                              <div className={cn(
                                "markdown-body prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed",
                                msg.role === 'user'
                                  ? "prose-p:text-white prose-headings:text-white prose-strong:text-white prose-a:text-indigo-200"
                                  : "prose-p:text-gray-800 dark:prose-p:text-white/90 prose-headings:text-indigo-700 dark:prose-headings:text-indigo-400 prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400 prose-li:text-gray-800 dark:prose-li:text-white/90 prose-a:text-indigo-600 dark:prose-a:text-indigo-400"
                              )}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {isChatting && (
                        <div className="flex flex-col gap-2 mr-auto items-start max-w-[85%] animate-pulse">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 dark:text-white/40">Epidemiólogo</span>
                          </div>
                          <div className="p-4 bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg rounded-tl-none flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleChatSubmit} className="p-4 border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 relative">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Pregunte sobre riesgos, medidas o predicciones..."
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded py-3 pl-4 pr-12 text-sm text-gray-900 dark:text-white/90 focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-white/30 font-mono focus:border-indigo-500/50"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isChatting}
                        className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-indigo-500 hover:text-indigo-400 disabled:opacity-50 transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          ) : appMode === 'immunology' && immunologyAnalysis ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8 relative"
            >
              <div className="absolute inset-0 -z-10 opacity-[0.05] dark:opacity-[0.08] pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, #a855f7 1px, transparent 0)',
                  backgroundSize: '32px 32px'
                }}></div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-4 border-purple-600/40 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.5em] text-purple-600 dark:text-purple-400">MODELADO MOLECULAR</span>
                  </div>
                  <h1 className="text-5xl font-black tracking-tighter uppercase text-gray-900 dark:text-white italic leading-none">
                    IMMUNO<span className="text-purple-600 dark:text-purple-400 not-italic">CELL</span>
                  </h1>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 dark:text-white/40 uppercase tracking-widest">
                  <div className="flex flex-col items-end">
                    <span>ID DE MODELADO</span>
                    <span className="font-bold text-gray-900 dark:text-white">IMM-{Date.now().toString().slice(-6)}</span>
                  </div>
                  <div className="w-px h-8 bg-black/10 dark:bg-white/10"></div>
                  <div className="flex flex-col items-end">
                    <span>ESTADO</span>
                    <span className="font-bold text-purple-500">COMPLETADO</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-px bg-black/5 dark:bg-white/5 border border-purple-500/20 p-px rounded-sm">
                {[
                  { id: 'overview', label: 'Reporte Inmunológico', icon: Microscope },
                  { id: 'chat', label: 'Centro de Modelado', icon: MessageSquare },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all",
                      activeTab === tab.id
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                        : "text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-purple-500/10"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-8">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 gap-8">
                    {/* Archive Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setArchiveModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded shadow-sm transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Archivar en Expediente
                      </button>
                    </div>

                    <section className="strict-card p-6 sm:p-8 border-l-4 border-l-purple-500 bg-white/50 dark:bg-purple-500/5 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <Beaker className="w-6 h-6 text-purple-500 animate-pulse" />
                        <h2 className="text-xl font-bold tracking-tight uppercase text-purple-700 dark:text-purple-400">Perfil Molecular</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="p-4 bg-gradient-to-br from-white to-purple-50/30 dark:from-white/5 dark:to-purple-500/5 rounded border border-purple-100 dark:border-purple-500/20 flex flex-col justify-center relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                          <span className="text-[10px] font-mono uppercase text-purple-600/70 dark:text-purple-400/70 flex items-center gap-1.5 mb-2 relative z-10">
                            <Microscope className="w-3 h-3 text-purple-500" /> Patógeno / Antígeno
                          </span>
                          <p className="text-sm font-bold text-gray-900 dark:text-white relative z-10">{immunologyAnalysis.molecularProfile.pathogenOrTarget}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-white to-purple-50/30 dark:from-white/5 dark:to-purple-500/5 rounded border border-purple-100 dark:border-purple-500/20 flex flex-col justify-center relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                          <span className="text-[10px] font-mono uppercase text-purple-600/70 dark:text-purple-400/70 flex items-center gap-1.5 mb-2 relative z-10">
                            <Activity className="w-3 h-3 text-purple-500" /> Riesgo de Mutación
                          </span>
                          <div className="relative z-10">
                            <span className={cn(
                              "px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded shadow-sm border inline-block",
                              immunologyAnalysis.molecularProfile.mutationRisk === 'crítico' ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30" :
                                immunologyAnalysis.molecularProfile.mutationRisk === 'alto' ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30" :
                                  immunologyAnalysis.molecularProfile.mutationRisk === 'medio' ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30" :
                                    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                            )}>
                              {immunologyAnalysis.molecularProfile.mutationRisk}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-white to-purple-50/30 dark:from-white/5 dark:to-purple-500/5 rounded border border-purple-100 dark:border-purple-500/20 flex flex-col relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                          <span className="text-[10px] font-mono uppercase text-purple-600/70 dark:text-purple-400/70 flex items-center gap-1.5 mb-2 relative z-10">
                            <ShieldAlert className="w-3 h-3 text-purple-500" /> Mecanismos de Evasión / Virulencia
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1 relative z-10">
                            {immunologyAnalysis.molecularProfile.virulenceFactors?.map((v, i) => (
                              <span key={i} className="virulence-tag text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 px-2.5 py-1.5 rounded shadow-sm flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5 text-purple-500" />
                                {v}
                              </span>
                            )) || <span className="text-[10px] text-gray-400 italic">No identificados</span>}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-mono text-purple-600 dark:text-purple-400 uppercase mb-3">Proteínas Diana</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {immunologyAnalysis.molecularProfile.targetProteins.map((p, i) => (
                            <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-200 text-[10px] rounded border border-purple-200 dark:border-purple-500/30 font-medium">
                              {p}
                            </span>
                          ))}
                        </div>

                        {(immunologyAnalysis.molecularProfile.crossReactivity || immunologyAnalysis.molecularProfile.hlaAssociations) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                            {immunologyAnalysis.molecularProfile.crossReactivity && immunologyAnalysis.molecularProfile.crossReactivity.length > 0 && (
                              <div>
                                <h4 className="text-[10px] font-mono text-gray-500 dark:text-gray-400 uppercase mb-2">Reactividad Cruzada</h4>
                                <div className="flex flex-wrap gap-2">
                                  {immunologyAnalysis.molecularProfile.crossReactivity.map((cr, i) => (
                                    <span key={i} className="px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 text-[10px] rounded border border-amber-200 dark:border-amber-500/30 font-medium">{cr}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {immunologyAnalysis.molecularProfile.hlaAssociations && immunologyAnalysis.molecularProfile.hlaAssociations.length > 0 && (
                              <div>
                                <h4 className="text-[10px] font-mono text-gray-500 dark:text-gray-400 uppercase mb-2">Asociaciones HLA</h4>
                                <div className="flex flex-wrap gap-2">
                                  {immunologyAnalysis.molecularProfile.hlaAssociations.map((hla, i) => (
                                    <span key={i} className="px-2 py-1 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 text-[10px] rounded border border-cyan-200 dark:border-cyan-500/30 font-medium">{hla}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="strict-card p-6 sm:p-8 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <Network className="w-6 h-6 text-purple-500" />
                        <h2 className="text-lg font-bold tracking-tight uppercase text-purple-700 dark:text-purple-400">Reconocimiento de Antígenos</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {immunologyAnalysis.antigenRecognition.map((rec, idx) => (
                          <div key={idx} className="p-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-md">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                              <h5 className="text-sm font-bold text-gray-900 dark:text-white">Epítopos: {rec.epitopes.join(', ')}</h5>
                              <span className={cn(
                                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border w-fit self-start break-words",
                                rec.bindingAffinity === 'fuerte' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30" :
                                  rec.bindingAffinity === 'moderada' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30" :
                                    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30"
                              )}>
                                Afinidad {rec.bindingAffinity}
                              </span>
                            </div>
                            <ReactMarkdown className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed" remarkPlugins={[remarkGfm]}>{healText(rec.rationale)}</ReactMarkdown>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="strict-card p-6 sm:p-8 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <ShieldAlert className="w-6 h-6 text-pink-500" />
                        <h2 className="text-lg font-bold tracking-tight uppercase text-pink-700 dark:text-pink-400">Inmunidad Innata</h2>
                      </div>
                      {immunologyAnalysis.innateImmunity ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-pink-50 dark:bg-pink-500/5 border border-pink-100 dark:border-pink-500/20 rounded-md">
                            <h5 className="text-sm font-bold text-pink-800 dark:text-pink-300 mb-2">Barreras y Complemento</h5>
                            <div className="space-y-2">
                              <p className="text-xs text-gray-600 dark:text-gray-400"><span className="font-semibold">Estado:</span> {immunologyAnalysis.innateImmunity.barrierStatus}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400"><span className="font-semibold">Complemento:</span> {immunologyAnalysis.innateImmunity.complementSystem}</p>
                            </div>
                          </div>
                          <div className="p-4 bg-pink-50 dark:bg-pink-500/5 border border-pink-100 dark:border-pink-500/20 rounded-md">
                            <h5 className="text-sm font-bold text-pink-800 dark:text-pink-300 mb-2">Respuesta Fagocítica</h5>
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{immunologyAnalysis.innateImmunity.phagocyticActivity}</p>
                          </div>
                          <div className="md:col-span-2 p-4 bg-pink-50 dark:bg-pink-500/5 border border-pink-100 dark:border-pink-500/20 rounded-md">
                            <h5 className="text-sm font-bold text-pink-800 dark:text-pink-300 mb-2">Reconocimiento de Patrones (PRRs)</h5>
                            <div className="flex flex-wrap gap-2">
                              {immunologyAnalysis.innateImmunity.patternRecognition.map((prr, i) => (
                                <span key={i} className="px-2 py-1 bg-pink-100 dark:bg-pink-500/20 text-pink-800 dark:text-pink-200 text-[10px] rounded border border-pink-200 dark:border-pink-500/30 font-medium">{prr}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">Datos de inmunidad innata no disponibles.</p>
                      )}
                    </section>

                    <section className="strict-card p-6 sm:p-8 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <Activity className="w-6 h-6 text-purple-500" />
                        <h2 className="text-lg font-bold tracking-tight uppercase text-purple-700 dark:text-purple-400">Respuesta Inmune Adaptativa</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {immunologyAnalysis.immuneResponse.map((resp, idx) => (
                          <div key={idx} className="p-4 bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20 rounded-md shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                              <h5 className="text-sm font-bold text-purple-800 dark:text-purple-300 pr-2">{resp.cellType}</h5>
                              <span className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded shadow-sm border bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30 w-fit self-start break-words">{resp.activationLevel}</span>
                            </div>
                            <ReactMarkdown className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3" remarkPlugins={[remarkGfm]}>{healText(resp.rationale)}</ReactMarkdown>
                            <div className="flex flex-wrap gap-1.5">
                              {resp.cytokineProfile.map((cyt, i) => (
                                <span key={i} className="px-2 py-1 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[10px] font-medium rounded-md border border-purple-200 dark:border-purple-500/30">
                                  {cyt}
                                </span>
                              ))}
                            </div>

                            {resp.cytokineStormRisk && (
                              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 rounded-md">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                                    <ShieldAlert className="w-3.5 h-3.5" /> Riesgo de Tormenta
                                  </span>
                                  <span className={cn(
                                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border w-fit self-start break-words",
                                    resp.cytokineStormRisk.riskLevel === 'crítico' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30" :
                                      resp.cytokineStormRisk.riskLevel === 'alto' ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30" :
                                        resp.cytokineStormRisk.riskLevel === 'medio' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30" :
                                          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                                  )}>
                                    {resp.cytokineStormRisk.riskLevel}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-800 dark:text-gray-300 leading-relaxed mb-3">{resp.cytokineStormRisk.clinicalImplications}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {resp.cytokineStormRisk.predictedMarkers.map((m, i) => (
                                    <span key={i} className="text-[11px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 px-2 py-1 rounded-md">{m}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {resp.immuneEvasion && (
                              <div className="mt-3 p-4 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 rounded-md">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-400 block mb-3">Mecanismos de Evasión</span>
                                <ul className="space-y-2 mb-3">
                                  {resp.immuneEvasion.mechanisms.map((m, i) => (
                                    <li key={i} className="text-xs text-gray-800 dark:text-gray-300 flex items-start gap-2">
                                      <span className="text-indigo-500 mt-0.5">•</span> {m}
                                    </li>
                                  ))}
                                </ul>
                                <p className="text-xs text-gray-700 dark:text-gray-300 border-t border-indigo-200 dark:border-indigo-500/20 pt-3 mt-3 leading-relaxed">
                                  <span className="font-semibold text-indigo-700 dark:text-indigo-400">Impacto en Memoria:</span> {resp.immuneEvasion.impactOnMemory}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>

                    {immunologyAnalysis.adaptiveSynapse && (
                      <section className="strict-card p-6 sm:p-8 bg-indigo-50/30 dark:bg-indigo-500/5 border-l-4 border-l-indigo-500">
                        <div className="flex items-center gap-3 mb-6">
                          <Zap className="w-6 h-6 text-indigo-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase text-indigo-700 dark:text-indigo-400">Sinapsis Inmunológica</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="p-4 bg-white dark:bg-white/5 rounded border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                              <h5 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-3">Señales Co-estimuladoras</h5>
                              <div className="flex flex-wrap gap-2">
                                {immunologyAnalysis.adaptiveSynapse.coStimulatorySignals?.map((s, i) => (
                                  <span key={i} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] rounded font-bold border border-emerald-200 dark:border-emerald-500/30">{s}</span>
                                ))}
                                {(!immunologyAnalysis.adaptiveSynapse.coStimulatorySignals || immunologyAnalysis.adaptiveSynapse.coStimulatorySignals.length === 0) && (
                                  <span className="text-[10px] text-gray-400 italic">No detectadas</span>
                                )}
                              </div>
                            </div>
                            <div className="p-4 bg-white dark:bg-white/5 rounded border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                              <h5 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase mb-3">Señales Inhibitorias</h5>
                              <div className="flex flex-wrap gap-2">
                                {immunologyAnalysis.adaptiveSynapse.inhibitorySignals?.map((s, i) => (
                                  <span key={i} className="px-2 py-1 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] rounded font-bold border border-rose-200 dark:border-rose-500/30">{s}</span>
                                ))}
                                {(!immunologyAnalysis.adaptiveSynapse.inhibitorySignals || immunologyAnalysis.adaptiveSynapse.inhibitorySignals.length === 0) && (
                                  <span className="text-[10px] text-gray-400 italic">No detectadas</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="p-4 bg-white dark:bg-white/5 rounded border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                              <h5 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-2">Estabilidad de la Sinapsis</h5>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{immunologyAnalysis.adaptiveSynapse.synapseStability}</p>
                            </div>
                            <div className="p-4 bg-white dark:bg-white/5 rounded border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                              <h5 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-2">Eficiencia de Presentación</h5>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{immunologyAnalysis.adaptiveSynapse.antigenPresentationEfficiency}</p>
                            </div>
                          </div>
                        </div>
                      </section>
                    )}

                    {immunologyAnalysis.tumorSurveillance && (
                      <section className="strict-card p-6 sm:p-8 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <Zap className="w-6 h-6 text-rose-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase text-rose-700 dark:text-rose-400">Vigilancia Tumoral</h2>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-md">
                            <h5 className="text-sm font-bold text-rose-800 dark:text-rose-300 mb-2">Análisis del Microambiente</h5>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-bold uppercase px-3 py-1.5 shadow-sm bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded border border-rose-200 dark:border-rose-500/30 w-fit inline-block">
                                Tipo: {immunologyAnalysis.tumorSurveillance.microenvironmentType}
                              </span>
                            </div>
                            <ReactMarkdown className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed" remarkPlugins={[remarkGfm]}>{healText(immunologyAnalysis.tumorSurveillance.rationale)}</ReactMarkdown>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {immunologyAnalysis.tumorSurveillance.metabolicEnvironment && (
                              <div className="p-4 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-md">
                                <h5 className="text-sm font-bold text-rose-800 dark:text-rose-300 mb-3 flex items-center gap-2">
                                  <Activity className="w-4 h-4" /> Perfil Metabólico del TME
                                </h5>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="text-center p-2 bg-white dark:bg-white/5 rounded border border-rose-200/50">
                                    <span className="block text-[8px] uppercase text-gray-500">Hipoxia</span>
                                    <span className="text-[10px] font-bold text-rose-600">{immunologyAnalysis.tumorSurveillance.metabolicEnvironment.hypoxiaLevel}</span>
                                  </div>
                                  <div className="text-center p-2 bg-white dark:bg-white/5 rounded border border-rose-200/50">
                                    <span className="block text-[8px] uppercase text-gray-500">Lactato</span>
                                    <span className="text-[10px] font-bold text-rose-600">{immunologyAnalysis.tumorSurveillance.metabolicEnvironment.lactateConcentration}</span>
                                  </div>
                                  <div className="text-center p-2 bg-white dark:bg-white/5 rounded border border-rose-200/50">
                                    <span className="block text-[8px] uppercase text-gray-500">pH</span>
                                    <span className="text-[10px] font-bold text-rose-600">{immunologyAnalysis.tumorSurveillance.metabolicEnvironment.phStatus}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            {immunologyAnalysis.tumorSurveillance.tertiaryLymphoidStructures && (
                              <div className="p-4 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-md">
                                <h5 className="text-sm font-bold text-rose-800 dark:text-rose-300 mb-2 flex items-center gap-2">
                                  <Globe className="w-4 h-4" /> Estructuras Linfoides (TLS)
                                </h5>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={cn(
                                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border w-fit inline-block",
                                    immunologyAnalysis.tumorSurveillance.tertiaryLymphoidStructures.presence
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                                      : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/30"
                                  )}>
                                    {immunologyAnalysis.tumorSurveillance.tertiaryLymphoidStructures.presence ? 'PRESENTES' : 'AUSENTES'}
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-mono italic">{immunologyAnalysis.tumorSurveillance.tertiaryLymphoidStructures.maturity}</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 italic">{immunologyAnalysis.tumorSurveillance.tertiaryLymphoidStructures.impact}</p>
                              </div>
                            )}
                            <div className="p-4 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-md">
                              <h5 className="text-sm font-bold text-rose-800 dark:text-rose-300 mb-2">Carga de Neoantígenos</h5>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{immunologyAnalysis.tumorSurveillance.neoantigenLoad}</p>
                            </div>
                            <div className="p-4 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-md">
                              <h5 className="text-sm font-bold text-rose-800 dark:text-rose-300 mb-2">Estado de Checkpoints</h5>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{immunologyAnalysis.tumorSurveillance.immuneCheckpointStatus}</p>
                            </div>
                          </div>
                        </div>
                      </section>
                    )}

                    {immunologyAnalysis.autoimmunityRisk && (
                      <section className="strict-card p-6 sm:p-8 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <ShieldAlert className="w-6 h-6 text-orange-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase text-orange-700 dark:text-orange-400">Riesgo de Autoinmunidad</h2>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-orange-50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/20 rounded-md">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                              <h5 className="text-sm font-bold text-orange-800 dark:text-orange-300">Mimetismo Molecular y Tolerancia</h5>
                              <span className={cn(
                                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border w-fit self-start break-words",
                                immunologyAnalysis.autoimmunityRisk.riskLevel === 'crítico' ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30" :
                                  immunologyAnalysis.autoimmunityRisk.riskLevel === 'alto' ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30" :
                                    immunologyAnalysis.autoimmunityRisk.riskLevel === 'medio' ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30" :
                                      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                              )}>
                                Riesgo {immunologyAnalysis.autoimmunityRisk.riskLevel}
                              </span>
                            </div>
                            <ReactMarkdown className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed" remarkPlugins={[remarkGfm]}>{healText(immunologyAnalysis.autoimmunityRisk.molecularMimicryPotential)}</ReactMarkdown>
                            <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-500/20">
                              <p className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-widest mb-1">Mecanismo de Ruptura:</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{immunologyAnalysis.autoimmunityRisk.toleranceBreakdownMechanism}</p>
                            </div>
                          </div>
                          <div className="p-4 bg-orange-50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/20 rounded-md">
                            <h5 className="text-sm font-bold text-orange-800 dark:text-orange-300 mb-2">Órganos / Tejidos Diana</h5>
                            <div className="flex flex-wrap gap-2">
                              {immunologyAnalysis.autoimmunityRisk.targetOrgans.map((o, i) => (
                                <span key={i} className="px-2 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-200 text-[10px] rounded border border-orange-200 dark:border-orange-500/30 font-medium">{o}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </section>
                    )}

                    <section className="strict-card p-6 sm:p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <Pill className="w-6 h-6 text-purple-500" />
                        <h2 className="text-lg font-bold tracking-tight uppercase">Modelado de Vacunas / Terapias</h2>
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                        {immunologyAnalysis.vaccineSimulation.map((sim, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-md">
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{sim.strategy}</h4>
                              <ReactMarkdown className="text-xs text-gray-600 dark:text-gray-400 mb-2" remarkPlugins={[remarkGfm]}>{healText(sim.rationale)}</ReactMarkdown>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">Variantes de Escape:</span>
                                {sim.escapeVariants.map((v, i) => (
                                  <span key={i} className="text-[10px] font-bold text-rose-600 dark:text-rose-400">{v}</span>
                                ))}
                              </div>
                              {sim.targetedTherapies && sim.targetedTherapies.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                                  <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 uppercase tracking-widest block w-full mb-1">Terapias Dirigidas Sugeridas:</span>
                                  {sim.targetedTherapies.map((t, i) => (
                                    <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-200 text-[10px] rounded border border-purple-200 dark:border-purple-500/30 font-medium">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="shrink-0 flex flex-col items-end justify-center border-t sm:border-t-0 sm:border-l border-black/10 dark:border-white/10 pt-4 sm:pt-0 sm:pl-4">
                              <span className="text-[10px] font-mono uppercase text-gray-500 dark:text-gray-400 mb-1">Eficacia Predicha</span>
                              <span className="text-3xl font-black text-purple-700 dark:text-purple-400 tracking-tighter">
                                {sim.predictedEfficacy > 1 ? sim.predictedEfficacy : (sim.predictedEfficacy * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {immunologyAnalysis.cohortImpact && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-indigo-500 bg-white/50 dark:bg-indigo-500/5 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <Globe className="w-6 h-6 text-indigo-500 animate-pulse" />
                          <h2 className="text-xl font-bold tracking-tight uppercase text-indigo-700 dark:text-indigo-400">Impacto en Cohorte y Vigilancia</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-5 bg-gradient-to-br from-white to-indigo-50/30 dark:from-white/5 dark:to-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                            <span className="text-[10px] font-mono uppercase text-indigo-600/70 dark:text-indigo-400/70 flex items-center gap-1.5 mb-3 relative z-10">
                              <Activity className="w-3 h-3 text-indigo-500" /> Umbral de Inmunidad
                            </span>
                            <p className="text-sm font-bold text-gray-900 dark:text-white relative z-10">{immunologyAnalysis.cohortImpact.herdImmunityThreshold}</p>
                          </div>
                          <div className="p-5 bg-gradient-to-br from-white to-indigo-50/30 dark:from-white/5 dark:to-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                            <span className="text-[10px] font-mono uppercase text-indigo-600/70 dark:text-indigo-400/70 flex items-center gap-1.5 mb-3 relative z-10">
                              <ShieldAlert className="w-3 h-3 text-indigo-500" /> Vulnerabilidad Poblacional
                            </span>
                            <p className="text-xs text-gray-800 dark:text-gray-300 leading-relaxed relative z-10">{immunologyAnalysis.cohortImpact.populationVulnerability}</p>
                          </div>
                          <div className="p-5 bg-gradient-to-br from-white to-indigo-50/30 dark:from-white/5 dark:to-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                            <span className="text-[10px] font-mono uppercase text-indigo-600/70 dark:text-indigo-400/70 flex items-center gap-1.5 mb-3 relative z-10">
                              <Network className="w-3 h-3 text-indigo-500" /> Vigilancia Recomendada
                            </span>
                            <p className="text-xs text-gray-800 dark:text-gray-300 leading-relaxed relative z-10">{immunologyAnalysis.cohortImpact.recommendedSurveillance}</p>
                          </div>
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="strict-card flex flex-col h-[600px]">
                    <div className="p-4 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-purple-500" />
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-widest">Modelado Interactivo</h3>
                          <p className="text-[10px] font-mono text-gray-500 dark:text-white/40 uppercase tracking-widest">Inmunólogo Computacional</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">En Línea</span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar" ref={chatScrollRef}>
                      {currentSession.chatHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                          <MessageSquare className="w-8 h-8 mb-4 text-purple-500" />
                          <h4 className="text-sm font-bold uppercase tracking-widest mb-2 text-purple-400">
                            Centro de Modelado Molecular
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-white/40 max-w-md">
                            El Inmunólogo Computacional está listo. Pregunte sobre interacciones antígeno-anticuerpo, perfiles de citoquinas o estrategias de vacunación.
                          </p>
                        </div>
                      ) : (
                        currentSession.chatHistory.map((msg, idx) => (
                          <div key={idx} className={cn(
                            "flex flex-col gap-2 max-w-[85%]",
                            msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                          )}>
                            <div className="flex items-center gap-2 mb-1">
                              {msg.role === 'user' ? (
                                <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 dark:text-white/40">Usted</span>
                              ) : (
                                <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 dark:text-white/40">Inmunólogo</span>
                              )}
                            </div>
                            <div className={cn(
                              "p-4 rounded-lg",
                              msg.role === 'user'
                                ? "bg-purple-600 text-white rounded-tr-none"
                                : "bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-tl-none"
                            )}>
                              <div className={cn(
                                "prose prose-sm max-w-none",
                                msg.role === 'user'
                                  ? "prose-p:text-white prose-headings:text-white prose-strong:text-white prose-a:text-purple-200"
                                  : "prose-p:text-gray-800 dark:prose-p:text-white/90 prose-headings:text-purple-700 dark:prose-headings:text-purple-400 prose-strong:text-purple-600 dark:prose-strong:text-purple-400 prose-li:text-gray-800 dark:prose-li:text-white/90 prose-a:text-purple-600 dark:prose-a:text-purple-400"
                              )}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {isChatting && (
                        <div className="flex flex-col gap-2 mr-auto items-start max-w-[85%] animate-pulse">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 dark:text-white/40">Inmunólogo</span>
                          </div>
                          <div className="p-4 bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg rounded-tl-none flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" />
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleChatSubmit} className="p-4 border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 relative">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Pregunte sobre interacciones moleculares o vacunas..."
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded py-3 pl-4 pr-12 text-sm text-gray-900 dark:text-white/90 focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-white/30 font-mono focus:border-purple-500/50"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isChatting}
                        className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-purple-500 hover:text-purple-400 disabled:opacity-50 transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          ) : appMode === 'clinical' && clinicalAnalysis ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex flex-wrap items-center gap-px bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-px">
                {[
                  { id: 'overview', label: 'Reporte Clínico', icon: FileText },
                  { id: 'chat', label: 'Consulta Interactiva', icon: MessageSquare },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-r border-black/10 dark:border-white/5",
                      activeTab === tab.id
                        ? "bg-cyan-600 text-white"
                        : "text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                  >
                    <tab.icon className="w-3 h-3" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-8">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 gap-8">
                    {/* Archive Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setArchiveModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded shadow-sm transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Archivar en Expediente
                      </button>
                    </div>

                    {currentSession?.attachedFiles && currentSession.attachedFiles.some(f => f.mimeType.startsWith('image/')) && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-indigo-500">
                        <div className="flex items-center gap-3 mb-6">
                          <ImageIcon className="w-6 h-6 text-indigo-500" />
                          <h2 className="text-xl font-bold tracking-tight uppercase">Imágenes Analizadas</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {currentSession.attachedFiles.filter(f => f.mimeType.startsWith('image/')).map((file, idx) => (
                            <div key={idx} className="flex justify-center bg-black/5 dark:bg-white/5 p-4 rounded-md border border-black/10 dark:border-white/10">
                              <img
                                src={`data:${file.mimeType};base64,${file.data}`}
                                alt={file.name}
                                className="max-h-96 object-contain rounded shadow-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    <section className="strict-card p-6 sm:p-8 border-l-4 border-l-cyan-500">
                      <div className="flex items-center gap-3 mb-6">
                        <Activity className="w-6 h-6 text-cyan-500" />
                        <h2 className="text-xl font-bold tracking-tight uppercase">Resumen Clínico: {clinicalAnalysis.topic}</h2>
                      </div>

                      {clinicalAnalysis.interventionPriority && (
                        <div className="mb-6 p-4 bg-rose-500/10 border-2 border-rose-500/30 rounded-md shadow-sm">
                          <h4 className="text-xs font-mono text-rose-600 dark:text-rose-400 uppercase mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Prioridad de Intervención (Acción Cero)
                          </h4>
                          <div className="space-y-2">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {clinicalAnalysis.interventionPriority.actionZero}
                            </p>
                            <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                              {clinicalAnalysis.interventionPriority.rationale}
                            </p>
                            <div className="mt-2">
                              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${clinicalAnalysis.interventionPriority.urgency === 'inmediata'
                                ? 'bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                                }`}>
                                Urgencia: {clinicalAnalysis.interventionPriority.urgency}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {clinicalAnalysis.systemicIntegration && (
                        <div className="mb-6 p-4 bg-indigo-500/10 border-2 border-indigo-500/30 rounded-md shadow-sm">
                          <h4 className="text-xs font-mono text-indigo-600 dark:text-indigo-400 uppercase mb-3 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Integración Sistémica
                          </h4>
                          <div className="space-y-2">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {clinicalAnalysis.systemicIntegration.unifiedDiagnosis}
                            </p>
                            <p className="text-xs text-gray-700 dark:text-gray-300">
                              {clinicalAnalysis.systemicIntegration.pathophysiologicalConnection}
                            </p>
                          </div>
                        </div>
                      )}

                      {activePatient && (
                        <div className="mb-6 p-5 rounded-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 backdrop-blur-md relative overflow-hidden shadow-sm">
                          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                            <User className="w-36 h-36" />
                          </div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <h4 className="text-xs font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Expediente Clínico Sincronizado</h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Nombre del Paciente</p>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{activePatient.name}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Identificador (DNI)</p>
                              <p className="text-sm font-mono text-gray-900 dark:text-white">{activePatient.dni}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Edad / F. Nacimiento</p>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {activePatient.age || 'N/A'} {activePatient.birthdate ? `(${new Date(activePatient.birthdate).toLocaleDateString('es-ES')})` : ''}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Ciudad / Distrito</p>
                              <p className="text-sm text-gray-900 dark:text-white">{activePatient.city || 'No especificada'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {clinicalAnalysis.patientProfile && (
                        <div className="mb-6 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-md">
                          <h4 className="text-xs font-mono text-cyan-600 dark:text-cyan-400 uppercase mb-3 flex items-center gap-2">
                            <User className="w-3 h-3" /> Perfil del Paciente
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Demografía</p>
                              <p className="text-sm text-gray-800 dark:text-gray-200">{clinicalAnalysis.patientProfile.demographics}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Motivo de Consulta</p>
                              <p className="text-sm text-gray-800 dark:text-gray-200">{clinicalAnalysis.patientProfile.chiefComplaint}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Antecedentes y Comorbilidades</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {[...(clinicalAnalysis.patientProfile.pastMedicalHistory || []), ...(clinicalAnalysis.patientProfile.comorbidities || [])].map((item, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] rounded border border-gray-300 dark:border-gray-600">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {clinicalAnalysis.historicalAuditor && (
                        <div className="mb-6 p-4 bg-purple-500/5 border border-purple-500/20 rounded-md">
                          <h4 className="text-xs font-mono text-purple-600 dark:text-purple-400 uppercase mb-3 flex items-center gap-2">
                            <Library className="w-3 h-3" /> Auditoría de Memoria Histórica (XAI)
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-purple-500 uppercase font-bold mb-1">Anclaje Principal</p>
                              <p className="text-sm text-gray-800 dark:text-gray-200 bg-white/50 dark:bg-black/20 p-2 rounded">{clinicalAnalysis.historicalAuditor.anchorMatch}</p>
                            </div>
                            <div>
                              <p className="text-xs text-purple-500 uppercase font-bold mb-1">Congruencia Clínica</p>
                              <p className="text-sm text-gray-800 dark:text-gray-200 bg-white/50 dark:bg-black/20 p-2 rounded">{clinicalAnalysis.historicalAuditor.congruence}</p>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded">
                              <p className="text-xs text-red-600 dark:text-red-400 uppercase font-bold mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Divergencia / Vacuna Anti-Sesgo</p>
                              <p className="text-sm text-red-900 dark:text-red-200">{clinicalAnalysis.historicalAuditor.divergence}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {clinicalAnalysis.extractedClinicalText && (
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 border-l-4 border-l-gray-400 rounded-r-md">
                          <h4 className="text-xs font-mono text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            Datos Extraídos (OCR / Historial)
                          </h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
                            {clinicalAnalysis.extractedClinicalText}
                          </p>
                        </div>
                      )}

                      <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 prose-p:leading-relaxed prose-li:marker:text-cyan-500 prose-ul:pl-4 prose-ol:pl-4 prose-li:my-1">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{healText(formatBoardSummary(clinicalAnalysis.summary))}</ReactMarkdown>
                      </div>

                      {clinicalAnalysis.physicalExam && (
                        <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-md">
                          <h4 className="text-xs font-mono text-emerald-600 dark:text-emerald-400 uppercase mb-3 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Examen Físico
                          </h4>
                          {clinicalAnalysis.physicalExam.vitals && (
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                              {Object.entries(clinicalAnalysis.physicalExam.vitals).map(([key, value]) => (
                                <div key={key} className="bg-white dark:bg-black/20 p-2 rounded border border-emerald-500/10 text-center">
                                  <p className="text-[9px] text-gray-500 uppercase font-bold">{key}</p>
                                  <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{value}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="space-y-3">
                            {clinicalAnalysis.physicalExam.findings.map((finding, idx) => (
                              <div key={idx} className="text-sm leading-relaxed">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 mr-2">{finding.system}:</span>
                                <span className="text-gray-700 dark:text-gray-300">{finding.observation}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {clinicalAnalysis.syndromes.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-xs font-mono text-cyan-600 dark:text-cyan-400 uppercase mb-3">Agrupación Sindromática</h4>
                          <div className="flex flex-wrap gap-2">
                            {clinicalAnalysis.syndromes.map((syndrome, idx) => (
                              <span key={idx} className="px-3 py-1 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-xs rounded-full border border-cyan-500/20 break-words max-w-full">
                                {syndrome}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>

                    {/* Filtro de Significancia Clínica Card */}
                    {clinicalAnalysis.clinicalSignificanceGrouping && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-cyan-600 bg-white dark:bg-black/25">
                        <div className="flex items-center gap-3 mb-6">
                          <Activity className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                          <div>
                            <h2 className="text-lg font-bold tracking-tight uppercase text-gray-900 dark:text-white">Filtro de Significancia Clínica</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Jerarquización de hallazgos para prevenir el sobrediagnóstico y la alarma injustificada</p>
                          </div>
                        </div>

                        {/* Tabs for Significance */}
                        <div className="flex border-b border-black/10 dark:border-white/10 mb-6 overflow-x-auto shrink-0">
                          {(['critical', 'incidental', 'nonSignificant'] as const).map((tab) => {
                            let label = '';
                            let count = 0;
                            let activeClass = '';
                            let hoverClass = '';

                            if (tab === 'critical') {
                              label = '🔴 Hallazgos Críticos';
                              count = clinicalAnalysis.clinicalSignificanceGrouping?.criticalFindings?.length || 0;
                              activeClass = 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold';
                              hoverClass = 'hover:text-rose-500';
                            } else if (tab === 'incidental') {
                              label = '🟡 Incidentales Relevantes';
                              count = clinicalAnalysis.clinicalSignificanceGrouping?.relevantIncidentalFindings?.length || 0;
                              activeClass = 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold';
                              hoverClass = 'hover:text-amber-500';
                            } else {
                              label = '🟢 No Significativos';
                              count = clinicalAnalysis.clinicalSignificanceGrouping?.nonSignificantFindings?.length || 0;
                              activeClass = 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold';
                              hoverClass = 'hover:text-emerald-500';
                            }

                            return (
                              <button
                                key={tab}
                                onClick={() => setActiveSignificanceTab(tab)}
                                className={cn(
                                  "px-4 py-3 text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
                                  activeSignificanceTab === tab
                                    ? activeClass
                                    : "border-transparent text-gray-500 dark:text-gray-400 " + hoverClass
                                )}
                              >
                                {label}
                                <span className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                  activeSignificanceTab === tab
                                    ? (tab === 'critical' ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400" :
                                       tab === 'incidental' ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400" :
                                       "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400")
                                    : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                                )}>
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[120px] transition-all">
                          {activeSignificanceTab === 'critical' && (
                            <div className="space-y-3">
                              {(!clinicalAnalysis.clinicalSignificanceGrouping.criticalFindings || clinicalAnalysis.clinicalSignificanceGrouping.criticalFindings.length === 0) ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No se identificaron hallazgos de severidad crítica inmediata.</p>
                              ) : (
                                clinicalAnalysis.clinicalSignificanceGrouping.criticalFindings.map((finding, idx) => (
                                  <div key={idx} className="p-4 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/20 rounded flex items-start gap-3">
                                    <span className="flex h-2 w-2 translate-y-1.5 rounded-full bg-rose-500 shrink-0" />
                                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-semibold">{finding}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {activeSignificanceTab === 'incidental' && (
                            <div className="space-y-3">
                              {(!clinicalAnalysis.clinicalSignificanceGrouping.relevantIncidentalFindings || clinicalAnalysis.clinicalSignificanceGrouping.relevantIncidentalFindings.length === 0) ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No se identificaron hallazgos incidentales de relevancia.</p>
                              ) : (
                                clinicalAnalysis.clinicalSignificanceGrouping.relevantIncidentalFindings.map((finding, idx) => (
                                  <div key={idx} className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-950/20 rounded flex items-start gap-3">
                                    <span className="flex h-2 w-2 translate-y-1.5 rounded-full bg-amber-500 shrink-0" />
                                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">{finding}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {activeSignificanceTab === 'nonSignificant' && (
                            <div className="space-y-3">
                              {(!clinicalAnalysis.clinicalSignificanceGrouping.nonSignificantFindings || clinicalAnalysis.clinicalSignificanceGrouping.nonSignificantFindings.length === 0) ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No se identificaron hallazgos no significativos o variantes normales.</p>
                              ) : (
                                clinicalAnalysis.clinicalSignificanceGrouping.nonSignificantFindings.map((finding, idx) => (
                                  <div key={idx} className="p-4 bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100/30 dark:border-emerald-900/10 rounded flex items-start gap-3">
                                    <span className="flex h-2 w-2 translate-y-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{finding}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* Panel de Cinética de Crecimiento Espacio-Temporal */}
                    {clinicalAnalysis.temporalComparison && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-indigo-600 bg-white dark:bg-black/25">
                        <div className="flex items-center gap-3 mb-6">
                          <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                          <div>
                            <h2 className="text-lg font-bold tracking-tight uppercase text-gray-900 dark:text-white">Panel de Cinética de Crecimiento Espacio-Temporal</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Correlación dinámica y deltas métricos de evolución lesional en el tiempo</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          {/* Previous Measurement */}
                          <div className="bg-gray-50 dark:bg-white/5 p-4 rounded border border-black/5 dark:border-white/5 text-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Estudio Previo (Basal)</span>
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-2">
                              {clinicalAnalysis.temporalComparison.previousMeasurement || 'Sin datos'}
                            </p>
                          </div>

                          {/* Time Span */}
                          <div className="bg-gray-50 dark:bg-white/5 p-4 rounded border border-black/5 dark:border-white/5 text-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Intervalo de Tiempo</span>
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-2">
                              {clinicalAnalysis.temporalComparison.timeSpanMonths ? `${clinicalAnalysis.temporalComparison.timeSpanMonths} meses` : 'Indeterminado'}
                            </p>
                          </div>

                          {/* Current Measurement */}
                          <div className="bg-gray-50 dark:bg-white/5 p-4 rounded border border-black/5 dark:border-white/5 text-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Estudio Actual</span>
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-2">
                              {clinicalAnalysis.temporalComparison.currentMeasurement || 'Sin datos'}
                            </p>
                          </div>
                        </div>

                        {/* Stability Assessment Alert */}
                        <div className={cn(
                          "p-5 rounded-md border mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4",
                          clinicalAnalysis.temporalComparison.stabilityAssessment === 'estable'
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300"
                            : clinicalAnalysis.temporalComparison.stabilityAssessment === 'progresion_lenta'
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300"
                              : clinicalAnalysis.temporalComparison.stabilityAssessment === 'progresion_rapida'
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-300"
                                : "bg-gray-500/10 border-gray-500/30 text-gray-900 dark:text-gray-300"
                        )}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={cn(
                                "h-2 w-2 rounded-full animate-pulse",
                                clinicalAnalysis.temporalComparison.stabilityAssessment === 'estable' ? "bg-emerald-500" :
                                clinicalAnalysis.temporalComparison.stabilityAssessment === 'progresion_lenta' ? "bg-amber-500" :
                                clinicalAnalysis.temporalComparison.stabilityAssessment === 'progresion_rapida' ? "bg-rose-500" : "bg-gray-500"
                              )} />
                              <h4 className="text-sm font-bold uppercase tracking-wider">
                                Diagnóstico Evolutivo: {
                                  clinicalAnalysis.temporalComparison.stabilityAssessment === 'estable' ? 'Lesión Biológicamente Estable' :
                                  clinicalAnalysis.temporalComparison.stabilityAssessment === 'progresion_lenta' ? 'Progresión Cinética Lenta' :
                                  clinicalAnalysis.temporalComparison.stabilityAssessment === 'progresion_rapida' ? 'Progresión Cinética Rápida (Alarma)' :
                                  'Estado Evolutivo Indeterminado'
                                }
                              </h4>
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-mono">
                              {clinicalAnalysis.temporalComparison.stabilityRationale}
                            </p>
                          </div>

                          {clinicalAnalysis.temporalComparison.growthDeltaPercent !== undefined && (
                            <div className="shrink-0 text-center px-6 py-4 bg-white/40 dark:bg-black/20 rounded border border-black/5 dark:border-white/5">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 block mb-1">Delta de Crecimiento</span>
                              <span className={cn(
                                "text-2xl font-black font-mono",
                                clinicalAnalysis.temporalComparison.growthDeltaPercent <= 5
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              )}>
                                {clinicalAnalysis.temporalComparison.growthDeltaPercent > 0 ? `+${clinicalAnalysis.temporalComparison.growthDeltaPercent.toFixed(1)}%` : `${clinicalAnalysis.temporalComparison.growthDeltaPercent.toFixed(1)}%`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Growth Visual Indicator (Timeline slider) */}
                        {clinicalAnalysis.temporalComparison.growthDeltaPercent !== undefined && (
                          <div>
                            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-2">
                              <span>Estabilidad Absoluta (0% Delta)</span>
                              <span>Progreso Clínico</span>
                              <span>Alarma Oncológica (+20% Delta)</span>
                            </div>
                            <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-1000",
                                  clinicalAnalysis.temporalComparison.growthDeltaPercent <= 5 ? "bg-emerald-500" : "bg-rose-500"
                                )}
                                style={{ width: `${Math.min(100, Math.max(5, (clinicalAnalysis.temporalComparison.growthDeltaPercent / 20) * 100))}%` }}
                              />
                              <div
                                className="absolute top-0 bottom-0 w-1 bg-white border-x border-black/20"
                                style={{ left: '25%' }} /* Indicates 5% threshold marker */
                              />
                            </div>
                            <div className="flex justify-between text-[8px] text-gray-400 dark:text-gray-500 uppercase mt-1">
                              <span>0%</span>
                              <span>5% (Límite Ley de Estabilidad)</span>
                              <span>20%+</span>
                            </div>
                          </div>
                        )}
                      </section>
                    )}

                    {clinicalAnalysis.diagnosticFindings && clinicalAnalysis.diagnosticFindings.length > 0 && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-indigo-500 bg-indigo-500/5">
                        <div className="flex items-center gap-3 mb-6">
                          <ImageIcon className="w-6 h-6 text-indigo-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase text-indigo-600 dark:text-indigo-400">Hallazgos de Imagen y Laboratorio</h2>
                        </div>
                        <div className="space-y-6">
                          {clinicalAnalysis.diagnosticFindings.map((finding, idx) => (
                            <div key={idx} className="bg-white dark:bg-black/40 border border-indigo-500/20 p-4 rounded-md">
                              <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3 border-b border-indigo-500/10 pb-2">{finding.modality}</h4>
                              <div className="mb-3">
                                <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">Hallazgos Específicos:</h5>
                                <ul className="list-disc pl-4 space-y-1">
                                  {finding.findings.map((f, i) => (
                                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400">{f}</li>
                                  ))}
                                </ul>
                              </div>

                              {finding.technicalDetails && (
                                <div className="mb-3 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded border border-indigo-100 dark:border-indigo-500/20">
                                  <h5 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-2 uppercase tracking-wider flex items-center gap-1">
                                    <Scan className="w-3 h-3" /> Detalles Técnicos Avanzados
                                  </h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {finding.technicalDetails.anatomicalSpecifics && (
                                      <div>
                                        <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">Micro-Anatomía Específica</span>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{finding.technicalDetails.anatomicalSpecifics}</p>
                                      </div>
                                    )}
                                    {finding.technicalDetails.measurements && (
                                      <div>
                                        <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">Morfometría / Cuantificación</span>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{finding.technicalDetails.measurements}</p>
                                      </div>
                                    )}
                                    {finding.technicalDetails.specificParameters && finding.technicalDetails.specificParameters.map((param, i) => (
                                      <div key={i}>
                                        <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">{param.name}</span>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{param.value}</p>
                                      </div>
                                    ))}
                                    {finding.technicalDetails.riskMarkers && finding.technicalDetails.riskMarkers.length > 0 && (
                                      <div>
                                        <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 block">Marcadores de Riesgo / Agresividad</span>
                                        <ul className="list-disc pl-4 space-y-0.5">
                                          {finding.technicalDetails.riskMarkers.map((marker, i) => (
                                            <li key={i} className="text-sm text-rose-700 dark:text-rose-300">{marker}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div>
                                <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">Interpretación:</h5>
                                <ReactMarkdown className="text-xs text-gray-600 dark:text-gray-400" remarkPlugins={[remarkGfm]}>{healText(finding.interpretation)}</ReactMarkdown>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {clinicalAnalysis.laboratoryData && clinicalAnalysis.laboratoryData.length > 0 && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-cyan-500 bg-cyan-500/5">
                        <div className="flex items-center gap-3 mb-6">
                          <Beaker className="w-6 h-6 text-cyan-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase text-cyan-600 dark:text-cyan-400">Datos de Laboratorio Estructurados</h2>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="border-b border-cyan-500/20">
                                <th className="py-2 px-3 font-bold text-gray-500 uppercase">Prueba</th>
                                <th className="py-2 px-3 font-bold text-gray-500 uppercase">Valor</th>
                                <th className="py-2 px-3 font-bold text-gray-500 uppercase">Rango Ref.</th>
                                <th className="py-2 px-3 font-bold text-gray-500 uppercase">Interpretación</th>
                              </tr>
                            </thead>
                            <tbody>
                              {clinicalAnalysis.laboratoryData.map((lab, idx) => (
                                <tr key={idx} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5">
                                  <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">{lab.test}</td>
                                  <td className="py-2 px-3 font-mono">{lab.value} {lab.unit}</td>
                                  <td className="py-2 px-3 text-gray-500">{lab.referenceRange || '-'}</td>
                                  <td className="py-2 px-3">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-sm font-bold uppercase text-[9px]",
                                      lab.interpretation === 'normal' ? "bg-emerald-500/10 text-emerald-600" :
                                        lab.interpretation === 'crítico' ? "bg-rose-500/20 text-rose-600 animate-pulse" :
                                          "bg-amber-500/10 text-amber-600"
                                    )}>
                                      {lab.interpretation}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}

                    {clinicalAnalysis.radiologicalSigns && clinicalAnalysis.radiologicalSigns.length > 0 && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-amber-500 bg-amber-500/5">
                        <div className="flex items-center gap-3 mb-6">
                          <CheckSquare className="w-6 h-6 text-amber-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase text-amber-600 dark:text-amber-400">Matriz de Signos Radiológicos/Endoscópicos</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {clinicalAnalysis.radiologicalSigns.map((sign, idx) => (
                            <div key={idx} className={`bg-white dark:bg-black/40 border p-4 rounded-md flex items-start gap-3 ${sign.present ? 'border-emerald-500/30' : 'border-gray-500/20'}`}>
                              <div className={`mt-0.5 p-1 rounded-full ${sign.present ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-400'}`}>
                                {sign.present ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                              </div>
                              <div>
                                <h4 className={`text-sm font-bold mb-1 ${sign.present ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>
                                  {sign.sign}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {sign.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {clinicalAnalysis.confoundingFactors && clinicalAnalysis.confoundingFactors.length > 0 && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-violet-500 bg-violet-500/5">
                        <div className="flex items-center gap-3 mb-6">
                          <Network className="w-6 h-6 text-violet-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase text-violet-600 dark:text-violet-400">Factores de Confusión y Contexto</h2>
                        </div>
                        <div className="space-y-4">
                          {clinicalAnalysis.confoundingFactors.map((factor, idx) => (
                            <div key={idx} className="bg-white dark:bg-black/40 border border-violet-500/20 p-4 rounded-md">
                              <h4 className="text-sm font-bold text-violet-600 dark:text-violet-400 mb-2">{factor.factor}</h4>
                              <ReactMarkdown className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" remarkPlugins={[remarkGfm]}>{healText(factor.impact)}</ReactMarkdown>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {clinicalAnalysis.absentSignsAnalysis && clinicalAnalysis.absentSignsAnalysis.length > 0 && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-orange-500 bg-orange-500/5">
                        <div className="flex items-center gap-3 mb-6">
                          <HelpCircle className="w-6 h-6 text-orange-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase text-orange-600 dark:text-orange-400">Análisis de Signos Ausentes (Marcadores)</h2>
                        </div>
                        <div className="space-y-4">
                          {clinicalAnalysis.absentSignsAnalysis.map((item, idx) => (
                            <div key={idx} className="bg-white dark:bg-black/40 border border-orange-500/20 p-4 rounded-md">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between items-start gap-2 sm:gap-4 mb-3">
                                <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400 mt-1">{item.sign}</h4>
                                <div className="text-xs font-medium px-3 py-1.5 bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 rounded-md break-words max-w-full text-left inline-block border border-orange-200 dark:border-orange-800/50 shadow-sm">
                                  <span className="font-bold opacity-70 mr-1.5 uppercase text-[10px] tracking-wider">Esperado en:</span>
                                  {item.expectedIn}
                                </div>
                              </div>
                              <ReactMarkdown className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" remarkPlugins={[remarkGfm]}>{healText(item.clinicalSignificance)}</ReactMarkdown>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {clinicalAnalysis.redFlags.length > 0 && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-rose-500 bg-rose-500/5">
                        <div className="flex items-center gap-3 mb-6">
                          <ShieldAlert className="w-6 h-6 text-rose-500 animate-pulse" />
                          <h2 className="text-lg font-bold tracking-tight uppercase text-rose-600 dark:text-rose-400">Banderas Rojas (Descartar Inmediatamente)</h2>
                        </div>
                        <div className="space-y-4">
                          {clinicalAnalysis.redFlags.map((flag, idx) => (
                            <div key={idx} className="bg-white dark:bg-black/40 border border-rose-500/20 p-4 rounded-md">
                              <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-1">{flag.condition}</h4>
                              <ReactMarkdown className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" remarkPlugins={[remarkGfm]}>{healText(flag.rationale)}</ReactMarkdown>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {clinicalAnalysis.prognosticScores && clinicalAnalysis.prognosticScores.length > 0 && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-blue-500 bg-blue-500/5">
                        <div className="flex items-center gap-3 mb-6">
                          <BarChart3 className="w-6 h-6 text-blue-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase text-blue-600 dark:text-blue-400">Escalas Pronósticas y Clasificaciones</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {clinicalAnalysis.prognosticScores.map((score, idx) => (
                            <div key={idx} className="bg-white dark:bg-black/40 border border-blue-500/20 p-4 rounded-md">
                              <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2 sm:gap-4">
                                <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400">{score.name}</h4>
                                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-left sm:text-right break-words max-w-full">
                                  {score.score}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">{score.interpretation}</p>
                              {score.mortalityRisk && (
                                <div className="mt-2 pt-2 border-t border-blue-500/10">
                                  <span className="text-[10px] font-bold text-gray-500 uppercase mr-2">Riesgo de Mortalidad:</span>
                                  <span className="text-xs font-bold text-rose-500">{score.mortalityRisk}</span>
                                </div>
                              )}
                              {score.sepsisScore && (
                                <div className="mt-2 pt-2 border-t border-rose-500/20 bg-rose-500/5 p-2 rounded">
                                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase block mb-1">Sepsis Scoring:</span>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                                    {score.sepsisScore.qSOFA && <span className="text-[10px] font-mono text-gray-700 dark:text-gray-300">qSOFA: <span className="font-bold">{score.sepsisScore.qSOFA}</span></span>}
                                    {score.sepsisScore.SIRS && <span className="text-[10px] font-mono text-gray-700 dark:text-gray-300">SIRS: <span className="font-bold">{score.sepsisScore.SIRS}</span></span>}
                                    {score.sepsisScore.NEWS2 && <span className="text-[10px] font-mono text-gray-700 dark:text-gray-300">NEWS2: <span className="font-bold">{score.sepsisScore.NEWS2}</span></span>}
                                  </div>
                                </div>
                              )}
                              {score.missingData && (
                                <div className="mt-2 pt-2 border-t border-rose-500/10">
                                  <span className="text-[10px] font-bold text-rose-500 uppercase mr-2">Datos Faltantes:</span>
                                  <span className="text-xs text-rose-600 dark:text-rose-400">{score.missingData}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    <section className="strict-card p-6 sm:p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <Search className="w-5 h-5 text-cyan-500" />
                        <h2 className="text-lg font-bold tracking-tight uppercase">Diagnósticos Diferenciales</h2>
                      </div>

                      {clinicalAnalysis.redFlags.length > 0 && !clinicalAnalysis.evaluations && (
                        <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-md p-4 flex items-start gap-3">
                          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Sugerencia del Sistema</h4>
                            <p className="text-xs text-gray-700 dark:text-gray-300">
                              Se han detectado banderas rojas en este caso. Se recomienda encarecidamente activar el modo <strong>"Junta Médica / Auditoría Red Team"</strong> en el panel lateral y volver a analizar para obtener un escrutinio avanzado de omisiones y volumetría.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        {clinicalAnalysis.differentialDiagnoses.map((dx, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-md">
                            <div className="sm:w-1/4 shrink-0">
                              <span className={cn(
                                "inline-block px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border mb-2",
                                dx.probability === 'alta' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30" :
                                  dx.probability === 'media' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30" :
                                    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                              )}>
                                Probabilidad {dx.probability}
                              </span>
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white break-words">{healText(dx.condition)}</h4>
                            </div>
                            <div className="sm:w-3/4">
                              <ReactMarkdown className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed" remarkPlugins={[remarkGfm]}>{healText(dx.rationale)}</ReactMarkdown>
                              
                              {dx.differentialExclusion && (
                                <div className="mt-3 p-3 bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-100/50 dark:border-cyan-900/30 rounded flex items-start gap-2">
                                  <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <h5 className="text-[10px] font-bold text-cyan-800 dark:text-cyan-300 uppercase tracking-widest mb-1">Criterio de Exclusión / Rebaja Médica (XAI)</h5>
                                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{healText(dx.differentialExclusion)}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {clinicalAnalysis.evaluations && clinicalAnalysis.evaluations.length > 0 && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-cyan-500 bg-cyan-500/5">
                        <div className="flex items-center gap-3 mb-6">
                          <Users className="w-6 h-6 text-cyan-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase text-cyan-600 dark:text-cyan-400">Escrutinio de la Junta Médica</h2>
                        </div>

                        {clinicalAnalysis.redTeamAudit && (
                          <div className="mb-8 bg-rose-500/10 border border-rose-500/30 rounded-md p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <ShieldAlert className="w-5 h-5 text-rose-500" />
                              <h3 className="text-sm font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">Auditoría Red Team (Búsqueda de Omisiones)</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-white dark:bg-black/40 p-4 rounded border border-rose-500/20">
                                <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-2 uppercase">Micro-Hallazgos Ocultos</h4>
                                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 prose-p:leading-relaxed prose-li:marker:text-rose-500 prose-ul:pl-4 prose-ol:pl-4 prose-li:my-1">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{healText(formatBoardSummary(clinicalAnalysis.redTeamAudit.missedMicroFindings))}</ReactMarkdown>
                                </div>
                              </div>
                              <div className="bg-white dark:bg-black/40 p-4 rounded border border-rose-500/20">
                                <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-2 uppercase">Crítica Volumétrica</h4>
                                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 prose-p:leading-relaxed prose-li:marker:text-rose-500 prose-ul:pl-4 prose-ol:pl-4 prose-li:my-1">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{healText(formatBoardSummary(clinicalAnalysis.redTeamAudit.volumetryCritique))}</ReactMarkdown>
                                </div>
                              </div>
                              <div className="bg-white dark:bg-black/40 p-4 rounded border border-rose-500/20">
                                <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-2 uppercase">Correlación Físico-Técnica</h4>
                                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 prose-p:leading-relaxed prose-li:marker:text-rose-500 prose-ul:pl-4 prose-ol:pl-4 prose-li:my-1">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{healText(formatBoardSummary(clinicalAnalysis.redTeamAudit.technicalCorrelationCritique))}</ReactMarkdown>
                                </div>
                              </div>
                              {clinicalAnalysis.redTeamAudit.adjacentStructuresCritique && (
                                <div className="bg-white dark:bg-black/40 p-4 rounded border border-rose-500/20 md:col-span-3">
                                  <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-2 uppercase">Estructuras Adyacentes Críticas</h4>
                                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 prose-p:leading-relaxed prose-li:marker:text-rose-500 prose-ul:pl-4 prose-ol:pl-4 prose-li:my-1">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{healText(formatBoardSummary(clinicalAnalysis.redTeamAudit.adjacentStructuresCritique))}</ReactMarkdown>
                                  </div>
                                </div>
                              )}
                              {clinicalAnalysis.redTeamAudit.epidemiologicalCritique && (
                                <div className="bg-white dark:bg-black/40 p-4 rounded border border-rose-500/20 md:col-span-3">
                                  <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-2 uppercase">Crítica Epidemiológica y Social</h4>
                                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 prose-p:leading-relaxed prose-li:marker:text-rose-500 prose-ul:pl-4 prose-ol:pl-4 prose-li:my-1">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{healText(formatBoardSummary(clinicalAnalysis.redTeamAudit.epidemiologicalCritique))}</ReactMarkdown>
                                  </div>
                                </div>
                              )}
                              {clinicalAnalysis.redTeamAudit.dataIntegrityCritique && (
                                <div className="bg-white dark:bg-black/40 p-4 rounded border border-rose-500/20 md:col-span-3">
                                  <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-2 uppercase">Integridad de Datos y Alucinaciones</h4>
                                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 prose-p:leading-relaxed prose-li:marker:text-rose-500 prose-ul:pl-4 prose-ol:pl-4 prose-li:my-1">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{healText(formatBoardSummary(clinicalAnalysis.redTeamAudit.dataIntegrityCritique))}</ReactMarkdown>
                                  </div>
                                </div>
                              )}
                              {clinicalAnalysis.redTeamAudit.biomechanicalAndVascularCritique && (
                                <div className="bg-white dark:bg-black/40 p-4 rounded border border-rose-500/20 md:col-span-3">
                                  <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-2 uppercase">Física y Biomecánica</h4>
                                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 prose-p:leading-relaxed prose-li:marker:text-rose-500 prose-ul:pl-4 prose-ol:pl-4 prose-li:my-1">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{healText(formatBoardSummary(clinicalAnalysis.redTeamAudit.biomechanicalAndVascularCritique))}</ReactMarkdown>
                                  </div>
                                </div>
                              )}
                              {clinicalAnalysis.redTeamAudit.artifactAndBlindSpotsCritique && (
                                <div className="bg-white dark:bg-black/40 p-4 rounded border border-rose-500/20 md:col-span-3">
                                  <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-2 uppercase">Artefactos y Puntos Ciegos</h4>
                                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 prose-p:leading-relaxed prose-li:marker:text-rose-500 prose-ul:pl-4 prose-ol:pl-4 prose-li:my-1">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{healText(formatBoardSummary(clinicalAnalysis.redTeamAudit.artifactAndBlindSpotsCritique))}</ReactMarkdown>
                                  </div>
                                </div>
                              )}
                              {clinicalAnalysis.redTeamAudit.benignityBiasCritique && (
                                <div className="bg-white dark:bg-black/40 p-4 rounded border border-rose-500/20 md:col-span-3">
                                  <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-2 uppercase">Sesgo de Falsa Seguridad</h4>
                                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 prose-p:leading-relaxed prose-li:marker:text-rose-500 prose-ul:pl-4 prose-ol:pl-4 prose-li:my-1">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{healText(formatBoardSummary(clinicalAnalysis.redTeamAudit.benignityBiasCritique))}</ReactMarkdown>
                                  </div>
                                </div>
                              )}
                              {clinicalAnalysis.redTeamAudit.overMedicalizationCritique && (
                                <div className="bg-white dark:bg-black/40 p-4 rounded border border-emerald-500/20 md:col-span-3">
                                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2 flex items-center uppercase"><ShieldAlert className="w-4 h-4 mr-2" />Sesgo de Sobre-Patologización</h4>
                                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 prose-p:leading-relaxed prose-li:marker:text-emerald-500 prose-ul:pl-4 prose-ol:pl-4 prose-li:my-1">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{healText(formatBoardSummary(clinicalAnalysis.redTeamAudit.overMedicalizationCritique))}</ReactMarkdown>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="space-y-6">
                          {clinicalAnalysis.evaluations.map((evaluation, idx) => (
                            <div key={idx} className="bg-white dark:bg-black/40 border border-cyan-500/20 p-5 rounded-md relative overflow-hidden">
                              <div className={cn(
                                "absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-md",
                                evaluation.status === 'survived' ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                              )}>
                                {evaluation.status === 'survived' ? 'Aprobado' : 'Rechazado'}
                              </div>
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pr-24">{evaluation.hypothesisId}</h4>
                              <div className="text-sm text-gray-700 dark:text-gray-300 prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-li:marker:text-cyan-500 prose-ul:pl-4 prose-ol:pl-4 prose-li:my-1">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{healText(formatBoardSummary(evaluation.critique))}</ReactMarkdown>
                              </div>
                            </div>
                          ))}
                          {clinicalAnalysis.boardSummary && (
                            <div className="mt-8 p-5 sm:p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 rounded-xl shadow-sm">
                              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-cyan-500/20">
                                <Gavel className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                <h4 className="text-sm font-bold uppercase tracking-widest text-cyan-800 dark:text-cyan-300">Consenso Final de la Junta</h4>
                              </div>
                              <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 prose-p:leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{healText(formatBoardSummary(clinicalAnalysis.boardSummary))}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    <section className="strict-card p-6 sm:p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <Beaker className="w-5 h-5 text-cyan-500" />
                        <h2 className="text-lg font-bold tracking-tight uppercase">Plan de Abordaje (Workup)</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {clinicalAnalysis.workup.map((step, idx) => (
                          <div key={idx} className="space-y-3">
                            <h4 className="text-xs font-mono text-cyan-600 dark:text-cyan-400 uppercase border-b border-black/10 dark:border-white/10 pb-2">{step.category}</h4>
                            <ul className="list-disc pl-4 space-y-1">
                              {step.tests.map((test, i) => (
                                <li key={i} className="text-xs text-gray-800 dark:text-gray-200">{test}</li>
                              ))}
                            </ul>
                            <ReactMarkdown className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed" remarkPlugins={[remarkGfm]}>{healText(step.rationale)}</ReactMarkdown>
                          </div>
                        ))}
                      </div>
                    </section>

                    {clinicalAnalysis.treatment && clinicalAnalysis.treatment.length > 0 && (
                      <section className="strict-card p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <Pill className="w-5 h-5 text-cyan-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase">Tratamiento y Manejo</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {clinicalAnalysis.treatment.map((phase, idx) => (
                            <div key={idx} className="space-y-3">
                              <h4 className="text-xs font-mono text-cyan-600 dark:text-cyan-400 uppercase border-b border-black/10 dark:border-white/10 pb-2">{phase.phase}</h4>
                              <ul className="list-disc pl-4 space-y-1">
                                {phase.interventions.map((intervention, i) => (
                                  <li key={i} className="text-xs text-gray-800 dark:text-gray-200">{intervention}</li>
                                ))}
                              </ul>

                              {(phase.contraindications?.length || 0) > 0 && (
                                <div className="mt-2 p-3 bg-rose-500/5 border border-rose-500/10 rounded">
                                  <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Contraindicaciones:</p>
                                  <ul className="list-disc pl-3">
                                    {phase.contraindications?.map((c, ci) => (
                                      <li key={ci} className="text-xs text-rose-700 dark:text-rose-400">{c}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {(phase.interactions?.length || 0) > 0 && (
                                <div className="mt-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded">
                                  <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Interacciones:</p>
                                  <ul className="list-disc pl-3">
                                    {phase.interactions?.map((int, ii) => (
                                      <li key={ii} className="text-xs text-amber-700 dark:text-amber-400">{int}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <ReactMarkdown className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed" remarkPlugins={[remarkGfm]}>{healText(phase.rationale)}</ReactMarkdown>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {clinicalAnalysis.contingencyPlan && (
                      <section className="strict-card p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <ShieldAlert className="w-5 h-5 text-rose-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase">Plan de Contingencia</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {clinicalAnalysis.contingencyPlan.criticalMonitoring && clinicalAnalysis.contingencyPlan.criticalMonitoring.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-xs font-mono text-rose-600 dark:text-rose-400 uppercase border-b border-black/10 dark:border-white/10 pb-2">Monitorización Crítica</h4>
                              <ul className="list-disc pl-4 space-y-1">
                                {clinicalAnalysis.contingencyPlan.criticalMonitoring.map((item, i) => (
                                  <li key={i} className="text-xs text-gray-800 dark:text-gray-200">{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {clinicalAnalysis.contingencyPlan.rescueInterventions && clinicalAnalysis.contingencyPlan.rescueInterventions.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-xs font-mono text-rose-600 dark:text-rose-400 uppercase border-b border-black/10 dark:border-white/10 pb-2">Intervenciones de Rescate</h4>
                              <div className="space-y-3">
                                {clinicalAnalysis.contingencyPlan.rescueInterventions.map((intervention, i) => (
                                  <div key={i} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded">
                                    <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Trigger: {intervention.trigger}</p>
                                    <p className="text-xs text-gray-800 dark:text-gray-200">{intervention.intervention}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {clinicalAnalysis.disposition && (
                      <section className="strict-card p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <MapPin className="w-5 h-5 text-violet-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase">Disposición y Destino</h2>
                        </div>
                        <div className="mb-6 p-4 bg-violet-500/5 border border-violet-500/20 rounded-md">
                          <h4 className="text-xs font-mono text-violet-600 dark:text-violet-400 uppercase mb-1">Nivel de Atención Requerido</h4>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{clinicalAnalysis.disposition.levelOfCare}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {clinicalAnalysis.disposition.admissionCriteria && clinicalAnalysis.disposition.admissionCriteria.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-xs font-mono text-violet-600 dark:text-violet-400 uppercase border-b border-black/10 dark:border-white/10 pb-2">Criterios de Ingreso</h4>
                              <ul className="list-disc pl-4 space-y-1">
                                {clinicalAnalysis.disposition.admissionCriteria.map((item, i) => (
                                  <li key={i} className="text-xs text-gray-800 dark:text-gray-200">{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {clinicalAnalysis.disposition.dischargeCriteria && clinicalAnalysis.disposition.dischargeCriteria.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-xs font-mono text-violet-600 dark:text-violet-400 uppercase border-b border-black/10 dark:border-white/10 pb-2">Criterios de Alta</h4>
                              <ul className="list-disc pl-4 space-y-1">
                                {clinicalAnalysis.disposition.dischargeCriteria.map((item, i) => (
                                  <li key={i} className="text-xs text-gray-800 dark:text-gray-200">{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {clinicalAnalysis.clinicalEvolution && clinicalAnalysis.clinicalEvolution.length > 0 && (
                      <section className="strict-card p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <Clock className="w-5 h-5 text-cyan-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase">Evolución y Trayectoria Clínica</h2>
                        </div>
                        <div className="space-y-6">
                          {clinicalAnalysis.clinicalEvolution.map((ev, idx) => (
                            <div key={idx} className="relative pl-8 border-l-2 border-black/5 dark:border-white/5 pb-6 last:pb-0">
                              <div className={cn(
                                "absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-black",
                                ev.status === 'complicación' ? "bg-rose-500" :
                                  ev.status === 'resolución' ? "bg-emerald-500" :
                                    ev.status === 'mejoría' ? "bg-cyan-500" :
                                      "bg-gray-400"
                              )} />
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between items-start gap-2 mb-2">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{ev.phase}</h4>
                                <span className={cn(
                                  "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border w-fit self-start",
                                  ev.status === 'complicación' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30" :
                                    ev.status === 'resolución' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30" :
                                      ev.status === 'mejoría' ? "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30" :
                                        "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/30"
                                )}>
                                  {ev.status}
                                </span>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                                  <span className="font-bold text-[10px] uppercase tracking-wider text-gray-500 dark:text-white/30 block mb-1">Observaciones:</span>
                                  {ev.observations}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                  <span className="font-bold text-[10px] uppercase tracking-wider text-gray-500 dark:text-white/30 block mb-1 not-italic">Pronóstico:</span>
                                  {ev.prognosis}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {clinicalAnalysis.ethicalLegalConsiderations && clinicalAnalysis.ethicalLegalConsiderations.length > 0 && (
                      <section className="strict-card p-6 sm:p-8 border-l-4 border-l-gray-500 bg-gray-500/5">
                        <div className="flex items-center gap-3 mb-6">
                          <Scale className="w-6 h-6 text-gray-500" />
                          <h2 className="text-lg font-bold tracking-tight uppercase text-gray-600 dark:text-gray-400">Consideraciones Ético-Legales</h2>
                        </div>
                        <div className="space-y-4">
                          {clinicalAnalysis.ethicalLegalConsiderations.map((item, idx) => (
                            <div key={idx} className="bg-white dark:bg-black/40 border border-gray-500/20 p-4 rounded-md">
                              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">{item.aspect}</h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{item.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="strict-card flex flex-col h-[600px]">
                    <div className="p-4 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-cyan-500" />
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-widest">
                            {currentSession?.isSocraticMode ? 'Tutoría Socrática' : 'Consulta Interactiva'}
                          </h3>
                          <p className="text-[10px] font-mono text-gray-500 dark:text-white/40">
                            {currentSession?.isSocraticMode ? 'El Médico Adscrito te guiará con preguntas' : 'Discuta el caso con el Médico Adscrito'}
                          </p>
                        </div>
                      </div>
                      {currentSession?.isSocraticMode && (
                        <div className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-[9px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
                          Modo Estudiante
                        </div>
                      )}
                    </div>

                    <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                      {currentSession?.chatHistory.filter(m => m.role !== 'system').length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                          <MessageSquare className="w-12 h-12 mb-4 text-cyan-500" />
                          <p className="text-xs font-mono uppercase tracking-widest">
                            {currentSession?.isSocraticMode ? 'Inicie su evaluación' : 'Inicie la discusión del caso'}
                          </p>
                          <p className="text-[10px] mt-2 max-w-xs">
                            {currentSession?.isSocraticMode
                              ? 'Proponga un diagnóstico, un plan de acción o haga una pregunta. El médico le guiará.'
                              : 'Pregunte sobre alternativas terapéuticas, ajuste de dosis o evolución esperada.'}
                          </p>
                        </div>
                      ) : (
                        currentSession?.chatHistory.map((msg, i) => (
                          <div key={i} className={cn(
                            "flex gap-4",
                            msg.role === 'user' ? "flex-row-reverse" : "flex-row",
                            msg.role === 'system' ? "justify-center" : ""
                          )}>
                            {msg.role !== 'system' && (
                              <div className={cn(
                                "w-8 h-8 rounded-sm flex items-center justify-center shrink-0",
                                msg.role === 'user' ? "bg-gray-200 dark:bg-white/10" : "bg-cyan-500/20 text-cyan-500"
                              )}>
                                {msg.role === 'user' ? <Terminal className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                              </div>
                            )}

                            <div className={cn(
                              "max-w-[80%]",
                              msg.role === 'system' ? "w-full text-center" : ""
                            )}>
                              {msg.role === 'system' ? (
                                <div className={cn(
                                  "inline-block rounded-xl max-w-2xl text-left w-full relative overflow-hidden",
                                  msg.approvalStatus === 'approved'
                                    ? "p-0 bg-transparent border-0 shadow-none"
                                    : cn("px-5 py-5 shadow-sm", msg.isError ? "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20" : "bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20")
                                )}>
                                  {msg.approvalStatus !== 'approved' && (
                                    <div className={cn("absolute top-0 left-0 w-1 h-full", msg.isError ? "bg-red-500" : "bg-blue-500")} />
                                  )}
                                  <div className={cn(
                                    "text-sm font-sans leading-relaxed prose dark:prose-invert prose-sm max-w-none",
                                    msg.isError ? "text-red-800 dark:text-red-300" : "text-gray-800 dark:text-gray-200 prose-strong:text-blue-700 dark:prose-strong:text-blue-400"
                                  )}>
                                    {msg.approvalStatus !== 'approved' && (
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                          <ReactMarkdown>
                                            {msg.content.replace(/\\n/g, '\n').replace(/<br\s*\/?>/gi, '\n\n').replace(/\s*•\s*/g, '\n\n')}
                                          </ReactMarkdown>
                                        </div>
                                        {msg.isError && (
                                          <button
                                            onClick={() => handleRetryChat(msg.id)}
                                            disabled={isChatting}
                                            className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                            title="Reintentar mensaje"
                                          >
                                            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  {(msg.approvalStatus || msg.cognitiveAutopsy || msg.newDiscovery) && !msg.isError && (
                                    <MemoryValidationWidget
                                      msgId={msg.id}
                                      status={msg.approvalStatus}
                                      onApprove={handleApproveMemory}
                                      onReject={handleRejectMemory}
                                      hasPendingTransition={!!currentSession.pendingTransitionContext}
                                      onRetryTransition={handleRetryTransition}
                                      isReconstructing={isReconstructing}
                                      isProcessing={isAnalyzing || isReconstructing}
                                    />
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col">
                                  <span className={cn(
                                    "text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 mb-1 px-1",
                                    msg.role === 'user' ? "text-right" : "text-left"
                                  )}>
                                    {msg.role === 'user' ? 'Tú' : 'Médico Adscrito'}
                                  </span>
                                  <div className={cn(
                                    "p-4 rounded-lg text-sm font-sans leading-relaxed shadow-md",
                                    msg.role === 'user'
                                      ? "bg-cyan-100 dark:bg-cyan-900/40 border border-cyan-500/30 dark:border-cyan-500/30 text-cyan-900 dark:text-cyan-50 rounded-tr-none"
                                      : "bg-white dark:bg-black/60 border border-black/10 dark:border-white/10 text-gray-800 dark:text-white/90 rounded-tl-none backdrop-blur-md"
                                  )}>
                                    <div className={cn(
                                      "markdown-body prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-black/10 dark:prose-pre:border-white/10 prose-headings:font-bold",
                                      "prose-strong:text-cyan-600 dark:prose-strong:text-cyan-400 prose-a:text-cyan-600 dark:prose-a:text-cyan-400 hover:prose-a:text-cyan-700 dark:hover:prose-a:text-cyan-300",
                                      msg.role === 'user' ? "text-cyan-900 dark:text-cyan-50" : "text-gray-800 dark:text-white/90"
                                    )}>
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content.replace(/\\n/g, '\n').replace(/<br\s*\/?>/gi, '\n\n').replace(/\s*•\s*/g, '\n\n')}
                                      </ReactMarkdown>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      {isChatting && (
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-sm bg-cyan-500/20 text-cyan-500 flex items-center justify-center shrink-0">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 mb-1 px-1 text-left">
                              Médico Adscrito
                            </span>
                            <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white/80 dark:bg-black/60 shadow-sm border border-black/5 dark:border-white/5 backdrop-blur-md flex items-center gap-1.5 w-fit">
                              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleChatSubmit} className="p-4 border-t border-black/10 dark:border-white/10 bg-gray-100 dark:bg-black/40">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={currentSession?.isSocraticMode ? "Responda a la pregunta o proponga su diagnóstico..." : "Consulte al Médico Adscrito..."}
                          className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded py-3 pl-4 pr-12 text-sm text-gray-900 dark:text-white/90 focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-white/30 font-mono focus:border-cyan-500/50"
                          disabled={isChatting}
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim() || isChatting}
                          className="absolute right-2 p-2 disabled:opacity-50 transition-colors text-cyan-500 hover:text-cyan-400"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          ) : analysis ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-px bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-px">
                {[
                  { id: 'overview', label: 'Veredicto Final', icon: Activity },
                  { id: 'investigator', label: 'Propuestas (Investigador)', icon: Lightbulb },
                  { id: 'critic', label: 'Críticas (Tribunal)', icon: ShieldAlert },
                  { id: 'connections', label: 'Evidencias (Memoria/Doc)', icon: Network },
                  { id: 'chat', label: 'Chat de Laboratorio', icon: MessageSquare },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-r border-black/10 dark:border-white/5",
                      activeTab === tab.id
                        ? "bg-emerald-600 text-white"
                        : "text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                  >
                    <tab.icon className="w-3 h-3" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="space-y-8">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 gap-8">
                    {/* Archive Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setArchiveModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded shadow-sm transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Archivar en Expediente
                      </button>
                    </div>

                    <section className="strict-card p-6 sm:p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-emerald-500" />
                        <h2 className="text-xl font-bold tracking-tight uppercase">Veredicto: {analysis.topic}</h2>
                      </div>
                      <div className="markdown-body prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-black/10 dark:prose-pre:border-white/10 prose-headings:font-bold prose-headings:text-emerald-600 dark:prose-headings:text-emerald-400 prose-strong:text-blue-600 dark:prose-strong:text-blue-400 prose-em:text-rose-600 dark:prose-em:text-rose-400 prose-a:text-emerald-600 dark:prose-a:text-emerald-400 hover:prose-a:text-emerald-700 dark:hover:prose-a:text-emerald-300">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {analysis.summary.replace(/<br\s*\/?>/gi, '\n\n').replace(/\s*•\s*/g, '\n\n')}
                        </ReactMarkdown>
                      </div>
                    </section>

                    {analysis.documentAssimilation ? (
                      <section className="strict-card p-6 sm:p-8 border-l-2 border-l-purple-500 bg-purple-500/5">
                        <div className="flex items-center gap-3 mb-4">
                          <FileText className="w-5 h-5 text-purple-400" />
                          <h3 className="text-sm font-bold tracking-tight uppercase text-purple-400">Asimilación Dinámica del Documento</h3>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-xs font-mono text-purple-400/70 uppercase mb-2">Perfil del Documento</h4>
                            <p className="text-sm text-gray-800 dark:text-white/90"><strong>{analysis.documentAssimilation.documentProfile.type}:</strong> {analysis.documentAssimilation.documentProfile.mainThesis}</p>
                          </div>

                          {analysis.documentAssimilation.contextualAnchors.length > 0 && (
                            <div>
                              <h4 className="text-xs font-mono text-purple-400/70 uppercase mb-2">Anclajes Contextuales Extraídos</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {analysis.documentAssimilation.contextualAnchors.map((anchor, idx) => (
                                  <div key={idx} className="bg-gray-100 dark:bg-black/40 border border-black/10 dark:border-white/5 p-3 rounded-sm">
                                    <span className="text-[10px] font-mono text-purple-400 uppercase block mb-1">{anchor.category}</span>
                                    <span className="text-xs text-gray-700 dark:text-white/80">{anchor.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {analysis.documentAssimilation.knowledgeGaps.length > 0 && (
                            <div>
                              <h4 className="text-xs font-mono text-purple-400/70 uppercase mb-2">Brechas de Conocimiento</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {analysis.documentAssimilation.knowledgeGaps.map((gap, idx) => (
                                  <li key={idx} className="text-xs text-gray-600 dark:text-white/70">{gap}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </section>
                    ) : analysis.documentSummary && (
                      <section className="strict-card p-6 sm:p-8 border-l-2 border-l-purple-500 bg-purple-500/5">
                        <div className="flex items-center gap-3 mb-4">
                          <FileText className="w-5 h-5 text-purple-400" />
                          <h3 className="text-sm font-bold tracking-tight uppercase text-purple-400">Resumen del Documento Adjunto</h3>
                        </div>
                        <div className="markdown-body prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-black/10 dark:prose-pre:border-white/10 prose-headings:font-bold prose-a:text-purple-600 dark:prose-a:text-purple-400 hover:prose-a:text-purple-700 dark:hover:prose-a:text-purple-300">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {analysis.documentSummary}
                          </ReactMarkdown>
                        </div>
                      </section>
                    )}

                    <div className="space-y-6">
                      <h3 className="mono-label flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Hipótesis Sobrevivientes ({analysis.survivingHypotheses.length})
                      </h3>

                      {analysis.methodologicalAnalysis && (
                        <section className="strict-card p-6 sm:p-8 border-l-2 border-l-blue-500 bg-blue-500/5">
                          <div className="flex items-center gap-3 mb-4">
                            <Search className="w-5 h-5 text-blue-400" />
                            <h3 className="text-sm font-bold tracking-tight uppercase text-blue-400">Análisis Metodológico</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="font-bold text-gray-500 uppercase mb-1">Diseño del Estudio</p>
                              <p className="text-gray-800 dark:text-gray-200">{analysis.methodologicalAnalysis.studyDesign}</p>
                            </div>
                            <div>
                              <p className="font-bold text-gray-500 uppercase mb-1">Tamaño de Muestra</p>
                              <p className="text-gray-800 dark:text-gray-200">{analysis.methodologicalAnalysis.sampleSize}</p>
                            </div>
                            <div>
                              <p className="font-bold text-gray-500 uppercase mb-1">Riesgo de Sesgo</p>
                              <span className={cn(
                                "px-3 py-1.5 rounded shadow-sm border font-bold uppercase text-[10px] w-fit inline-block",
                                analysis.methodologicalAnalysis.biasRisk === 'bajo' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30" :
                                  analysis.methodologicalAnalysis.biasRisk === 'alto' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30" :
                                    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"
                              )}>
                                {analysis.methodologicalAnalysis.biasRisk}
                              </span>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="font-bold text-gray-500 uppercase mb-1">Limitaciones</p>
                              <ul className="list-disc pl-4 space-y-1">
                                {analysis.methodologicalAnalysis.limitations.map((l, idx) => (
                                  <li key={idx} className="text-gray-700 dark:text-gray-300">{l}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </section>
                      )}

                      {analysis.statisticalReview && (
                        <section className="strict-card p-6 sm:p-8 border-l-2 border-l-indigo-500 bg-indigo-500/5">
                          <div className="flex items-center gap-3 mb-4">
                            <BarChart3 className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-sm font-bold tracking-tight uppercase text-indigo-400">Revisión Estadística</h3>
                          </div>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {analysis.statisticalReview.keyMetrics.map((m, idx) => (
                                <div key={idx} className="bg-white dark:bg-black/20 p-3 rounded border border-indigo-500/10">
                                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">{m.metric}</p>
                                  <p className="text-sm font-mono text-indigo-600 dark:text-indigo-400">{m.value}</p>
                                  {m.significance && <p className="text-[9px] text-gray-400 italic mt-1">{m.significance}</p>}
                                </div>
                              ))}
                            </div>
                            <div className="p-3 bg-white dark:bg-black/20 rounded border border-indigo-500/10">
                              <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Interpretación</p>
                              <p className="text-xs text-gray-700 dark:text-gray-300">{analysis.statisticalReview.interpretation}</p>
                            </div>
                          </div>
                        </section>
                      )}

                      {analysis.survivingHypotheses.length === 0 ? (
                        <div className="strict-card p-8 text-center text-gray-500 dark:text-white/40 font-mono text-sm">
                          Ninguna hipótesis superó el escrutinio del Crítico Clínico.
                        </div>
                      ) : (
                        analysis.survivingHypotheses.map((h, i) => (
                          <div key={i} className="strict-card p-6 border-l-2 border-l-emerald-500">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{h.statement}</h4>
                            <div className="markdown-body prose dark:prose-invert prose-sm max-w-none mb-4 prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-black/10 dark:prose-pre:border-white/10 prose-headings:font-bold">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {h.rationale}
                              </ReactMarkdown>
                            </div>
                            {h.sourceQuotes && h.sourceQuotes.length > 0 && (
                              <div className="mt-4 mb-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-sm">
                                <h5 className="text-[10px] font-mono text-purple-400 uppercase mb-2 flex items-center gap-2">
                                  <FileText className="w-3 h-3" /> Citas Textuales del Documento
                                </h5>
                                <ul className="space-y-2">
                                  {h.sourceQuotes.map((quote, qIdx) => (
                                    <li key={qIdx} className="text-xs text-gray-600 dark:text-white/70 italic border-l-2 border-purple-500/30 pl-3 py-1">
                                      "{quote}"
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                              <button
                                onClick={() => {
                                  setActiveTab('chat');
                                  handleExpandHypothesis(h, 'ensayo');
                                }}
                                disabled={isExpanding === h.id}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded shadow-sm transition-all disabled:opacity-50"
                              >
                                <Beaker className="w-3 h-3" /> Diseñar Ensayo
                              </button>
                              <button
                                onClick={() => {
                                  setActiveTab('chat');
                                  handleExpandHypothesis(h, 'compuestos');
                                }}
                                disabled={isExpanding === h.id}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded shadow-sm transition-all disabled:opacity-50"
                              >
                                <Pill className="w-3 h-3" /> Proponer Compuestos
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <section className="strict-card p-6 sm:p-8 border-l-2 border-l-blue-500 bg-blue-500/5">
                      <div className="flex items-center gap-3 mb-4">
                        <Lightbulb className="w-5 h-5 text-blue-400" />
                        <h3 className="text-sm font-bold tracking-tight uppercase text-blue-400">¿Cómo continuar la investigación?</h3>
                      </div>

                      {analysis.futureDirections && analysis.futureDirections.length > 0 && (
                        <div className="mb-6 space-y-4">
                          <h4 className="text-xs font-mono text-blue-400 uppercase mb-2">Direcciones Futuras Propuestas</h4>
                          <div className="grid grid-cols-1 gap-4">
                            {analysis.futureDirections.map((dir, idx) => (
                              <div key={idx} className="bg-white dark:bg-black/20 p-4 rounded border border-blue-500/10">
                                <h5 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">{dir.proposedStudy}</h5>
                                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2"><strong>Objetivo:</strong> {dir.objective}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400"><strong>Metodología:</strong> {dir.methodology}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.ethicalConsiderations && (
                        <div className="mb-6 p-4 bg-gray-500/5 border border-gray-500/20 rounded-md">
                          <h4 className="text-xs font-mono text-gray-500 uppercase mb-3 flex items-center gap-2">
                            <Scale className="w-3 h-3" /> Consideraciones Éticas
                          </h4>
                          <div className="space-y-2 text-xs">
                            <p className="text-gray-700 dark:text-gray-300"><strong>Conflictos de Interés:</strong> {analysis.ethicalConsiderations.conflictsOfInterest}</p>
                            <p className="text-gray-700 dark:text-gray-300"><strong>Financiamiento:</strong> {analysis.ethicalConsiderations.fundingSources}</p>
                            <p className="text-gray-700 dark:text-gray-300"><strong>Aprobación Ética:</strong> {analysis.ethicalConsiderations.ethicalApproval}</p>
                          </div>
                        </div>
                      )}

                      <ul className="space-y-3 text-xs text-gray-600 dark:text-white/70 font-mono list-disc pl-5">
                        <li><strong>Profundizar:</strong> Haz clic en "Diseñar Ensayo" o "Proponer Compuestos" en las hipótesis de arriba. La respuesta se generará en la pestaña de <strong>Chat de Laboratorio</strong>.</li>
                        <li><strong>Debatir:</strong> Ve a la pestaña <button onClick={() => setActiveTab('chat')} className="text-emerald-400 hover:underline">Chat de Laboratorio</button> para hacer preguntas directas o proponer tus propias ideas al tribunal.</li>
                        <li><strong>Nueva Búsqueda:</strong> Puedes buscar un nuevo tema en la barra superior. Este reporte actual <strong>ya se ha guardado automáticamente</strong> y puedes recuperarlo en cualquier momento desde el botón <strong>Historial</strong>.</li>
                      </ul>
                    </section>
                  </div>
                )}

                {activeTab === 'investigator' && (
                  <div className="grid grid-cols-1 gap-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        Las 5 Propuestas del Investigador
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-white/40 font-mono mt-2">Ideas crudas, innovadoras y sin filtrar.</p>
                    </div>
                    {analysis.investigatorHypotheses.map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="strict-card p-6 sm:p-8 group border-l-2 border-l-blue-500/50"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                          <div className="flex items-start gap-4">
                            <span className="text-xl font-mono text-blue-500/40">{h.id}</span>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 uppercase tracking-wide leading-relaxed">{h.statement}</h3>
                          </div>
                          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-0 shrink-0">
                            <span className="text-[8px] font-mono text-gray-400 dark:text-white/20 uppercase">Novedad</span>
                            <span className="text-xs font-mono text-blue-400">{h.noveltyScore}/100</span>
                          </div>
                        </div>
                        <div className="pl-0 sm:pl-10 border-t border-black/10 dark:border-white/5 pt-6 space-y-6">
                          
                          {h.phenomenologicalTranslation && (
                            <div className="p-4 bg-gray-50 dark:bg-white/5 border-l-2 border-gray-400 rounded-sm">
                              <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                🌌 Abstracción Fenomenológica
                              </h5>
                              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                                {h.phenomenologicalTranslation}
                              </p>
                            </div>
                          )}

                          {h.biomimeticInspiration && (
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border-l-2 border-emerald-400 rounded-sm">
                              <h5 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2 flex items-center gap-2">
                                🌿 Inspiración Biomimética
                              </h5>
                              <p className="text-sm text-emerald-800 dark:text-emerald-200 italic">
                                {h.biomimeticInspiration}
                              </p>
                            </div>
                          )}

                          <div className="markdown-body prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-black/10 dark:prose-pre:border-white/10 prose-headings:font-bold">
                            <h5 className="text-[10px] font-bold text-blue-500 uppercase mb-2">Fundamento Lógico</h5>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {h.rationale}
                            </ReactMarkdown>
                          </div>

                          {h.boundaryConditionCheck && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border-l-2 border-amber-400 rounded-sm">
                              <h5 className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-2 flex items-center gap-2">
                                🛡️ Condiciones de Frontera Biológica
                              </h5>
                              <p className="text-sm text-amber-800 dark:text-amber-200">
                                {h.boundaryConditionCheck}
                              </p>
                            </div>
                          )}

                          {h.experimentumCrucis && (
                            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border-l-2 border-rose-400 rounded-sm">
                              <h5 className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase mb-2 flex items-center gap-2">
                                🔬 Experimentum Crucis (Falsabilidad)
                              </h5>
                              <p className="text-sm text-rose-800 dark:text-rose-200">
                                {h.experimentumCrucis}
                              </p>
                            </div>
                          )}

                          {h.sourceQuotes && h.sourceQuotes.length > 0 && (
                            <div className="mt-6 p-4 bg-purple-500/5 border border-purple-500/20 rounded-sm">
                              <h5 className="text-[10px] font-mono text-purple-400 uppercase mb-2 flex items-center gap-2">
                                <FileText className="w-3 h-3" /> Citas Textuales del Documento
                              </h5>
                              <ul className="space-y-2">
                                {h.sourceQuotes.map((quote, qIdx) => (
                                  <li key={qIdx} className="text-xs text-gray-600 dark:text-white/70 italic border-l-2 border-purple-500/30 pl-3 py-1">
                                    "{quote}"
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeTab === 'critic' && (
                  <div className="grid grid-cols-1 gap-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5" />
                        Escrutinio del Crítico Clínico
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-white/40 font-mono mt-2">Evaluación de viabilidad, lógica y riesgos.</p>
                    </div>
                    {analysis.evaluations.map((evalItem, i) => {
                      const hypothesis = analysis.investigatorHypotheses.find(h => h.id === evalItem.hypothesisId);
                      const isSurvived = evalItem.status === 'survived';

                      return (
                        <div key={i} className={cn(
                          "strict-card p-6 border-l-2",
                          isSurvived ? "border-l-emerald-500" : "border-l-rose-500"
                        )}>
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
                            <span className="font-mono text-xs text-gray-500 dark:text-white/40 break-words">Ref: {evalItem.hypothesisId}</span>
                            <div className="flex flex-wrap items-center gap-2">
                              {evalItem.documentFidelityScore !== undefined && (
                                <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30" title="Fidelidad al Documento">
                                  Fidelidad: {evalItem.documentFidelityScore}/100
                                </span>
                              )}
                              <span className={cn(
                                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border",
                                isSurvived ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30"
                              )}>
                                {isSurvived ? 'Sobrevivió' : 'Rechazada'}
                              </span>
                            </div>
                          </div>
                          <h4 className="text-sm text-gray-700 dark:text-white/80 mb-4 line-clamp-2">{hypothesis?.statement}</h4>
                          <div className="bg-gray-100 dark:bg-black/40 p-4 font-sans text-sm text-gray-700 dark:text-white/80 leading-relaxed">
                            <span className={cn(
                              "font-bold uppercase mr-2 text-xs",
                              isSurvived ? "text-emerald-400" : "text-rose-400"
                            )}>Crítica:</span>
                            <div className="markdown-body prose dark:prose-invert prose-sm max-w-none mt-2 prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-black/10 dark:prose-pre:border-white/10 prose-headings:font-bold prose-headings:text-rose-600 dark:prose-headings:text-rose-400 prose-strong:text-emerald-600 dark:prose-strong:text-emerald-400 prose-em:text-blue-600 dark:prose-em:text-blue-400">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {evalItem.critique.replace(/<br\s*\/?>/gi, '\n\n').replace(/\s*•\s*/g, '\n\n')}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {activeTab === 'connections' && (
                  <div className="grid grid-cols-1 gap-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                        <Network className="w-5 h-5" />
                        Evidencias de Memoria y Documentos
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-white/40 font-mono mt-2">Conexiones extraídas de la Base de Conocimiento Global (RAG & Serendipia) y del documento adjunto.</p>
                    </div>

                    {!analysis.connections || analysis.connections.length === 0 ? (
                      <div className="strict-card p-8 text-center border-dashed border-black/10 dark:border-white/20">
                        <Network className="w-8 h-8 text-gray-400 dark:text-white/20 mx-auto mb-4" />
                        <h4 className="text-sm font-bold text-gray-500 dark:text-white/40 uppercase tracking-widest mb-2">Sin Conexiones Previas</h4>
                        <p className="text-xs text-gray-400 dark:text-white/30 font-mono max-w-md mx-auto">
                          El Investigador no utilizó información de la memoria histórica ni del documento para este análisis, o es el primer caso en la base de datos.
                        </p>
                      </div>
                    ) : (
                      analysis.connections.map((conn, i) => (
                        <div key={i} className={cn(
                          "strict-card p-6 border-l-2",
                          conn.connectionType === 'serendipia' ? "border-l-purple-500" :
                            conn.connectionType === 'documento' ? "border-l-emerald-500" : "border-l-blue-500"
                        )}>
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
                            <span className="font-mono text-xs text-gray-500 dark:text-white/40 flex items-center gap-2 break-words">
                              {conn.connectionType === 'documento' ? <FileText className="w-3 h-3 shrink-0" /> : <Brain className="w-3 h-3 shrink-0" />}
                              Origen: {conn.pastTopic}
                            </span>
                            <span className={cn(
                              "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border w-fit self-start break-words shrink-0",
                              conn.connectionType === 'serendipia' ? "bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200" :
                                conn.connectionType === 'documento' ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200" : "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200"
                            )}>
                              {conn.connectionType === 'serendipia' ? 'Salto de Serendipia' :
                                conn.connectionType === 'documento' ? 'Documento Adjunto' : 'Conexión Directa'}
                            </span>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 mb-1">Insight Extraído</h4>
                              <div className="text-sm text-gray-700 dark:text-white/80 font-sans leading-relaxed bg-gray-100 dark:bg-black/20 p-3 rounded border border-black/10 dark:border-white/5 markdown-body prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-black/10 dark:prose-pre:border-white/10 prose-headings:font-bold">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {healText(conn.extractedInsight).replace(/<br\s*\/?>/gi, '\n\n').replace(/\s*•\s*/g, '\n\n')}
                                </ReactMarkdown>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 mb-1">Aplicación al Caso Actual</h4>
                              <div className="text-sm text-gray-700 dark:text-white/80 font-sans leading-relaxed bg-emerald-900/10 p-3 rounded border border-emerald-500/10 markdown-body prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-black/10 dark:prose-pre:border-white/10 prose-headings:font-bold">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {healText(conn.applicationToCurrent).replace(/<br\s*\/?>/gi, '\n\n').replace(/\s*•\s*/g, '\n\n')}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="flex flex-col h-[600px] strict-card overflow-hidden">
                    <div className="p-4 border-b border-black/10 dark:border-white/10 bg-gray-100 dark:bg-black/40 flex items-center gap-2">
                      <MessageSquare className={cn("w-4 h-4", appMode === 'investigator' ? "text-emerald-500" : "text-cyan-500")} />
                      <h3 className="text-xs font-bold uppercase tracking-widest">
                        {appMode === 'investigator' ? 'Chat de Laboratorio' : 'Consulta Clínica'}
                      </h3>
                    </div>

                    <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                      {currentSession?.chatHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-8">
                          <MessageSquare className={cn("w-8 h-8 mb-4", appMode === 'investigator' ? "text-emerald-500" : "text-cyan-500")} />
                          <h4 className={cn("text-sm font-bold uppercase tracking-widest mb-2", appMode === 'investigator' ? "text-emerald-400" : "text-cyan-400")}>
                            {appMode === 'investigator' ? 'El Tribunal está a tu disposición' : 'El Médico Adscrito está a tu disposición'}
                          </h4>
                          <p className="text-xs font-mono text-gray-600 dark:text-white/70 max-w-md">
                            Aquí puedes continuar {appMode === 'investigator' ? 'el debate' : 'el análisis'} sobre <strong>{currentSession.topic}</strong>.
                            {appMode === 'investigator'
                              ? ' Pide al Investigador que profundice en una hipótesis, o pídele al Crítico que evalúe una nueva idea tuya.'
                              : ' Solicita más detalles sobre el diagnóstico, propone un plan de tratamiento, o pide una explicación socrática del caso.'}
                          </p>
                        </div>
                      ) : (
                        currentSession?.chatHistory.map((msg) => (
                          <div key={msg.id} className={cn(
                            "flex flex-col max-w-[85%]",
                            msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                          )}>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 mb-1 px-1">
                              {msg.role === 'user' ? 'Tú' : isDeltaMode ? 'Sistema Delta' : appMode === 'investigator' ? 'Tribunal' : 'Médico Adscrito'}
                            </span>
                            <div className={cn(
                              "p-4 rounded-lg text-sm font-sans leading-relaxed shadow-lg",
                              msg.role === 'user'
                                ? isDeltaMode
                                  ? "bg-amber-100 dark:bg-amber-900/40 border border-amber-500/30 dark:border-amber-500/30 text-amber-900 dark:text-amber-50 rounded-tr-none"
                                  : appMode === 'investigator'
                                    ? "bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-500/30 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-50 rounded-tr-none"
                                    : "bg-cyan-100 dark:bg-cyan-900/40 border border-cyan-500/30 dark:border-cyan-500/30 text-cyan-900 dark:text-cyan-50 rounded-tr-none"
                                : "bg-gray-100 dark:bg-black/60 border border-black/10 dark:border-white/10 text-gray-800 dark:text-white/90 rounded-tl-none backdrop-blur-md"
                            )}>
                              <div className={cn(
                                "markdown-body prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-rose-600 dark:prose-headings:text-rose-400 prose-em:text-blue-600 dark:prose-em:text-blue-400",
                                isDeltaMode
                                  ? "prose-strong:text-amber-600 dark:prose-strong:text-amber-400 prose-a:text-amber-600 dark:prose-a:text-amber-400 hover:prose-a:text-amber-700 dark:hover:prose-a:text-amber-300"
                                  : appMode === 'investigator'
                                    ? "prose-strong:text-emerald-600 dark:prose-strong:text-emerald-400 prose-a:text-emerald-600 dark:prose-a:text-emerald-400 hover:prose-a:text-emerald-700 dark:hover:prose-a:text-emerald-300"
                                    : "prose-strong:text-cyan-600 dark:prose-strong:text-cyan-400 prose-a:text-cyan-600 dark:prose-a:text-cyan-400 hover:prose-a:text-cyan-700 dark:hover:prose-a:text-cyan-300",
                                msg.role === 'user'
                                  ? isDeltaMode
                                    ? "prose-pre:bg-amber-50 dark:prose-pre:bg-amber-950/50 prose-pre:border prose-pre:border-amber-200 dark:prose-pre:border-amber-800/50"
                                    : appMode === 'investigator'
                                      ? "prose-pre:bg-emerald-50 dark:prose-pre:bg-emerald-950/50 prose-pre:border prose-pre:border-emerald-200 dark:prose-pre:border-emerald-800/50"
                                      : "prose-pre:bg-cyan-50 dark:prose-pre:bg-cyan-950/50 prose-pre:border prose-pre:border-cyan-200 dark:prose-pre:border-cyan-800/50"
                                  : "prose-pre:bg-gray-100 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-black/10 dark:prose-pre:border-white/10"
                              )}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {msg.content.replace(/\\n/g, '\n').replace(/<br\s*\/?>/gi, '\n\n').replace(/\s*•\s*/g, '\n\n')}
                                </ReactMarkdown>
                              </div>

                              {msg.connections && msg.connections.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 space-y-3">
                                  <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest", appMode === 'investigator' ? "text-emerald-400" : "text-cyan-400")}>
                                    <Network className="w-3 h-3" />
                                    <span>Memoria Histórica / Documento Utilizado</span>
                                  </div>
                                  {msg.connections.map((conn, idx) => (
                                    <div key={idx} className="bg-gray-100 dark:bg-black/40 p-4 rounded-lg border border-black/10 dark:border-white/10 text-xs shadow-inner">
                                      <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex items-start gap-2 flex-1">
                                          <div className="mt-0.5 shrink-0">
                                            {conn.connectionType === 'documento' ? <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                          </div>
                                          <span className="text-gray-700 dark:text-white/80 font-medium text-xs leading-snug">
                                            <span className="text-gray-500 dark:text-white/40 font-mono text-[10px] uppercase tracking-wider mr-1">Origen:</span>
                                            {conn.pastTopic}
                                          </span>
                                        </div>
                                        <span className={cn(
                                          "shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm border w-fit self-start",
                                          conn.connectionType === 'serendipia' ? "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30" :
                                            conn.connectionType === 'documento' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
                                        )}>
                                          {conn.connectionType === 'serendipia' ? 'Salto de Serendipia' :
                                            conn.connectionType === 'documento' ? 'Documento Adjunto' : 'Conexión Directa'}
                                        </span>
                                      </div>
                                      <div className="space-y-3">
                                        <div>
                                          <span className="text-gray-500 dark:text-white/40 font-mono text-[10px] uppercase tracking-wider block mb-1">Insight:</span>
                                          <div className={cn(
                                            "text-gray-600 dark:text-white/70 leading-relaxed markdown-body prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-black/10 dark:prose-pre:border-white/10 prose-headings:font-bold prose-headings:text-rose-600 dark:prose-headings:text-rose-400 prose-em:text-blue-600 dark:prose-em:text-blue-400",
                                            appMode === 'investigator' ? "prose-strong:text-emerald-600 dark:prose-strong:text-emerald-400" : "prose-strong:text-cyan-600 dark:prose-strong:text-cyan-400"
                                          )}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                              {healText(conn.extractedInsight).replace(/<br\s*\/?>/gi, '\n\n').replace(/\s*•\s*/g, '\n\n')}
                                            </ReactMarkdown>
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 dark:text-white/40 font-mono text-[10px] uppercase tracking-wider block mb-1">Aplicación:</span>
                                          <div className={cn(
                                            "text-gray-800 dark:text-white/90 leading-relaxed markdown-body prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-black/10 dark:prose-pre:border-white/10 prose-headings:font-bold prose-headings:text-rose-600 dark:prose-headings:text-rose-400 prose-em:text-blue-600 dark:prose-em:text-blue-400",
                                            appMode === 'investigator' ? "prose-strong:text-emerald-600 dark:prose-strong:text-emerald-400" : "prose-strong:text-cyan-600 dark:prose-strong:text-cyan-400"
                                          )}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                              {healText(conn.applicationToCurrent).replace(/<br\s*\/?>/gi, '\n\n').replace(/\s*•\s*/g, '\n\n')}
                                            </ReactMarkdown>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/5 flex justify-end">
                                <CopyButton text={msg.content.replace(/\\n/g, '\n').replace(/<br\s*\/?>/gi, '\n\n').replace(/\s*•\s*/g, '\n\n') + (msg.connections ? '\n\n' + msg.connections.map(c => `Origen: ${c.pastTopic}\nInsight: ${c.extractedInsight.replace(/\\n/g, '\n')}\nAplicación: ${c.applicationToCurrent.replace(/\\n/g, '\n')}`).join('\n\n') : '')} />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {isChatting && (
                        <div className="flex flex-col max-w-[85%] mr-auto items-start">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 mb-1 px-1">
                            {appMode === 'investigator' ? 'Tribunal' : 'Médico Adscrito'}
                          </span>
                          <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white/80 dark:bg-black/60 shadow-sm border border-black/5 dark:border-white/5 backdrop-blur-md flex items-center gap-1.5 w-fit">
                            <div className={cn("w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]", appMode === 'investigator' ? "bg-emerald-500" : "bg-cyan-500")} />
                            <div className={cn("w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]", appMode === 'investigator' ? "bg-emerald-500" : "bg-cyan-500")} />
                            <div className={cn("w-1.5 h-1.5 rounded-full animate-bounce", appMode === 'investigator' ? "bg-emerald-500" : "bg-cyan-500")} />
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleChatSubmit} className="p-4 border-t border-black/10 dark:border-white/10 bg-gray-100 dark:bg-black/40">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={appMode === 'investigator' ? "Pregunte al tribunal, proponga ideas o cuestione el veredicto..." : "Pregunte al médico, solicite más detalles o proponga un tratamiento..."}
                          className={cn("w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded py-3 pl-4 pr-12 text-sm text-gray-900 dark:text-white/90 focus:outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-white/30 font-mono", appMode === 'investigator' ? "focus:border-emerald-500/50" : "focus:border-cyan-500/50")}
                          disabled={isChatting}
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim() || isChatting}
                          className={cn("absolute right-2 p-2 disabled:opacity-50 transition-colors", appMode === 'investigator' ? "text-emerald-500 hover:text-emerald-400" : "text-cyan-500 hover:text-cyan-400")}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}
        </main>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHelpOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#0f1115] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-black/10 dark:border-white/10 bg-gray-50/80 dark:bg-black/40 backdrop-blur-md">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-500" /> Guía de Modos y Funciones
                </h2>
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-8">
                <div>
                  <p className="mb-6 text-base">Aquí tienes una guía detallada para entender qué hace cada modo, qué tipo de archivos puedes adjuntar y qué resultados esperar. Elige el modo correcto según tu objetivo.</p>

                  {/* Modo Clínico */}
                  <div className="mb-8 p-5 rounded-lg border border-cyan-500/20 bg-cyan-50/50 dark:bg-cyan-500/5">
                    <h3 className="text-lg font-bold text-cyan-700 dark:text-cyan-400 mb-3 flex items-center justify-between gap-2">
                      <span>1. Modo "Clínico" (Diagnóstico y Tratamiento)</span>
                      <Activity className="w-5 h-5 shrink-0" />
                    </h3>
                    <div className="space-y-3">
                      <p><strong>¿Para qué sirve?</strong><br />Actúa como un Médico Adscrito experimentado. Su objetivo es analizar a un <strong>paciente individual</strong> para llegar a un diagnóstico y plan de tratamiento.</p>
                      <p><strong>¿Qué archivos puedes adjuntar?</strong></p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Imágenes Médicas (JPG, PNG):</strong> Radiografías, ecografías, tomografías, fotos dermatológicas. La IA detallará los hallazgos visuales.</li>
                        <li><strong>Documentos (PDF, TXT):</strong> Historiales clínicos, notas de evolución, resultados de laboratorio (análisis de sangre, orina, etc.).</li>
                      </ul>
                      <p><strong>¿Qué resultado obtienes?</strong><br />Un reporte médico formal con: Agrupación de síntomas, Diagnósticos Diferenciales (alta/media/baja probabilidad), Banderas Rojas (riesgos vitales), Plan de Abordaje (exámenes extra) y Plan Terapéutico.</p>
                    </div>
                  </div>

                  {/* Modo Socrático */}
                  <div className="mb-8 p-5 rounded-lg border border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5">
                    <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400 mb-3 flex items-center justify-between gap-2">
                      <span>2. Modo "Socrático" (Tutor Interactivo)</span>
                      <Brain className="w-5 h-5 shrink-0" />
                    </h3>
                    <div className="space-y-3">
                      <p><strong>¿Para qué sirve?</strong><br />Es un modificador educativo que se activa <strong>después</strong> de generar un reporte Clínico. Transforma el chat en un tutor personal.</p>
                      <p><strong>¿Cómo funciona?</strong><br />En lugar de darte respuestas directas a tus dudas, la IA te hará preguntas reflexivas, te dará pistas sutiles y te guiará paso a paso para que tú mismo deduzcas el diagnóstico o tratamiento. Ideal para estudiantes de medicina.</p>
                    </div>
                  </div>

                  {/* Modo Investigador */}
                  <div className="mb-8 p-5 rounded-lg border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5">
                    <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center justify-between gap-2">
                      <span>3. Modo "Investigador" (Innovación Médica)</span>
                      <Search className="w-5 h-5 shrink-0" />
                    </h3>
                    <div className="space-y-3">
                      <p><strong>¿Para qué sirve?</strong><br />A diferencia del modo clínico (que busca lo estándar), este modo busca lo desconocido y experimental. Actúa como un investigador de vanguardia.</p>
                      <p><strong>¿Qué archivos puedes adjuntar?</strong></p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Literatura Médica (PDF):</strong> Papers científicos, ensayos clínicos, artículos de investigación.</li>
                        <li><strong>Casos Complejos:</strong> Descripciones de enfermedades raras o sin diagnóstico claro.</li>
                      </ul>
                      <p><strong>¿Qué resultado obtienes?</strong><br />Genera 5 hipótesis radicalmente innovadoras (ej. reposicionamiento de fármacos) y las pasa por un "Tribunal Médico" implacable que intenta destruirlas. Solo te muestra las hipótesis que sobreviven al rigor científico.</p>
                    </div>
                  </div>

                  {/* Modo Vigilancia Macro */}
                  <div className="mb-8 p-5 rounded-lg border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5">
                    <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-3 flex items-center justify-between gap-2">
                      <span>4. Modo "Vigilancia Macro" (Epidemiología Poblacional)</span>
                      <Globe className="w-5 h-5 shrink-0" />
                    </h3>
                    <div className="space-y-3">
                      <p><strong>¿Para qué sirve?</strong><br />Actúa como un Epidemiólogo de Salud Pública. No analiza a un solo paciente, sino a <strong>poblaciones enteras</strong> para prevenir y controlar brotes.</p>
                      <p><strong>¿Qué archivos puedes adjuntar?</strong></p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Datos Poblacionales:</strong> Reportes de brotes, estadísticas de contagio, bases de datos epidemiológicas.</li>
                      </ul>
                      <p><strong>¿Qué resultado obtienes?</strong><br />Análisis de vulnerabilidad poblacional, predicción de riesgos de propagación, modelado de escenarios ("¿Qué pasa si cerramos fronteras?") y sugerencias para optimizar recursos (vacunas, camas UCI).</p>
                    </div>
                  </div>

                  {/* Modo Vigilancia Micro */}
                  <div className="mb-8 p-5 rounded-lg border border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/5">
                    <h3 className="text-lg font-bold text-purple-700 dark:text-purple-400 mb-3 flex items-center justify-between gap-2">
                      <span>5. Modo "Vigilancia Micro" (Modelado Inmunológico)</span>
                      <Microscope className="w-5 h-5 shrink-0" />
                    </h3>
                    <div className="space-y-3">
                      <p><strong>¿Para qué sirve?</strong><br />Actúa como un Inmunólogo Computacional. Analiza la interacción a nivel celular y molecular entre un patógeno (virus/bacteria) y el sistema inmune.</p>
                      <p><strong>¿Qué archivos puedes adjuntar?</strong></p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Datos Moleculares:</strong> Secuencias genéticas, resultados de ensayos in vitro, perfiles de citoquinas.</li>
                      </ul>
                      <p><strong>¿Qué resultado obtienes?</strong><br />Perfil molecular del patógeno, predicción de reconocimiento de antígenos, modelado de la respuesta celular (CD4+, CD8+, B) y predicción de eficacia de vacunas o terapias.</p>
                    </div>
                  </div>

                  {/* Resumen */}
                  <div className="mt-6">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 border-b border-black/10 dark:border-white/10 pb-2">
                      Resumen Rápido: ¿Qué modo elijo?
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Clínico */}
                      <div className="p-5 rounded-xl border border-cyan-500/20 bg-cyan-50/50 dark:bg-cyan-500/5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 font-bold text-sm uppercase tracking-wider">
                          <Activity className="w-4 h-4" /> Clínico
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          <strong>Tengo un paciente.</strong> Quiero analizar sus radiografías, laboratorios o síntomas para saber qué tiene y cómo tratarlo.
                        </p>
                        <div className="mt-auto pt-3 border-t border-cyan-500/20">
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                            <Brain className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span><strong>+ Socrático:</strong> Úsalo en el chat para que la IA te enseñe en lugar de darte la respuesta directa.</span>
                          </p>
                        </div>
                      </div>

                      {/* Research */}
                      <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm uppercase tracking-wider">
                          <Search className="w-4 h-4" /> Investigador
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          <strong>Tengo una duda científica.</strong> Quiero analizar papers o enfermedades raras para generar nuevas hipótesis experimentales.
                        </p>
                      </div>

                      {/* Vigilancia Macro */}
                      <div className="p-5 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm uppercase tracking-wider">
                          <Globe className="w-4 h-4" /> Vigilancia Macro
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          <strong>Tengo un problema de salud pública.</strong> Quiero analizar datos de poblaciones para controlar brotes y optimizar recursos.
                        </p>
                      </div>

                      {/* Vigilancia Micro */}
                      <div className="p-5 rounded-xl border border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold text-sm uppercase tracking-wider">
                          <Microscope className="w-4 h-4" /> Vigilancia Micro
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          <strong>Tengo datos celulares/moleculares.</strong> Quiero modelar cómo interactúa un virus con el sistema inmune o probar vacunas in silico.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 dark:bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-black/10 dark:border-white/10 w-full max-w-md flex flex-col shadow-2xl rounded-xl overflow-hidden"
            >
              <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Modos y Ajustes</h2>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Modo de Análisis</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setAppMode('investigator'); setIsDeltaMode(false); handleNewSession(); setIsSettingsOpen(false); }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border",
                        appMode === 'investigator' && !isDeltaMode
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-sm"
                          : "bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-emerald-300 dark:hover:border-emerald-500/50"
                      )}
                    >
                      <Search className="w-5 h-5" />
                      Investigador
                    </button>
                    <button
                      onClick={() => { setAppMode('clinical'); setIsDebateMode(true); setIsDeltaMode(false); handleNewSession(); setIsSettingsOpen(false); }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border",
                        appMode === 'clinical' && !isDeltaMode
                          ? "bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-400 shadow-sm"
                          : "bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-cyan-300 dark:hover:border-cyan-500/50"
                      )}
                    >
                      <Activity className="w-5 h-5" />
                      Clínico
                    </button>
                    <button
                      onClick={() => { setAppMode('epidemiology_macro'); setIsDeltaMode(false); handleNewSession(); setIsSettingsOpen(false); }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border",
                        appMode === 'epidemiology_macro' && !isDeltaMode
                          ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 shadow-sm"
                          : "bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-500/50"
                      )}
                    >
                      <Globe className="w-5 h-5" />
                      Epidemiología (Macro)
                    </button>
                    <button
                      onClick={() => { setAppMode('immunology'); setIsDeltaMode(false); handleNewSession(); setIsSettingsOpen(false); }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border",
                        appMode === 'immunology' && !isDeltaMode
                          ? "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-400 shadow-sm"
                          : "bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-purple-300 dark:hover:border-purple-500/50"
                      )}
                    >
                      <Microscope className="w-5 h-5" />
                      Inmunología (Micro)
                    </button>
                    <button
                      onClick={() => { handleNewSession(); setIsDeltaMode(true); setIsSettingsOpen(false); }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border",
                        isDeltaMode
                          ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 shadow-sm"
                          : "bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-500/50"
                      )}
                    >
                      <TrendingUp className="w-5 h-5" />
                      Análisis Delta
                    </button>
                    <button
                      onClick={() => { setIsSettingsOpen(false); setIsLibraryOpen(true); }}
                      className="flex flex-col items-center justify-center gap-2 p-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all border bg-white dark:bg-[#1a1d24] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-500/50 hover:text-blue-500 group"
                      title="Biblioteca Médica (Base de Datos)"
                    >
                      <Database className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Biblioteca
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsLocationSettingsOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors border border-gray-200 dark:border-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Ajustes de País / Ciudad</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90" />
                  </button>

                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsPatientArchiveOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors border border-gray-200 dark:border-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Archivo de Pacientes</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90" />
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                  >
                    Guardar Ajustes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && sessionToShare && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 dark:bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-amber-500/30 dark:border-amber-500/30 w-full max-w-md flex flex-col shadow-2xl rounded-xl overflow-hidden"
            >
              <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-amber-50 dark:bg-amber-500/10">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-amber-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Compartir Modo Delta</h2>
                </div>
                <button
                  onClick={() => { setIsShareModalOpen(false); setSessionToShare(null); }}
                  className="p-1 text-gray-500 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                  disabled={isSharing}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Al compartir este reporte Delta, aparecerá en la parte superior para todos los usuarios.
                  <strong className="block mt-2 text-amber-600 dark:text-amber-400">Se requiere programación de auto-destrucción temporal médica.</strong>
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button onClick={() => handleShareSessionSubmit(15)} disabled={isSharing} className="p-3 border border-amber-200 dark:border-amber-500/30 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 text-sm font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50">15 Minutos</button>
                  <button onClick={() => handleShareSessionSubmit(60)} disabled={isSharing} className="p-3 border border-amber-200 dark:border-amber-500/30 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 text-sm font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50">1 Hora</button>
                  <button onClick={() => handleShareSessionSubmit(480)} disabled={isSharing} className="p-3 border border-amber-200 dark:border-amber-500/30 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 text-sm font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50">8 Horas</button>
                  <button onClick={() => handleShareSessionSubmit(1440)} disabled={isSharing} className="p-3 border border-amber-200 dark:border-amber-500/30 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 text-sm font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50">24 Horas</button>
                </div>
                {isSharing && (
                  <div className="flex items-center justify-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-widest mt-4 animate-pulse">
                    <Activity className="w-4 h-4 animate-spin" />
                    Asimilando a la Red...
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Archive Modal */}
      <AnimatePresence>
        {archiveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 dark:bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-black/10 dark:border-white/10 w-full max-w-md flex flex-col shadow-2xl rounded-xl overflow-hidden"
            >
              <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <Save className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Archivar en Expediente</h2>
                </div>
                <button
                  onClick={() => setArchiveModalOpen(false)}
                  className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      DNI del Paciente
                    </label>
                    <input
                      type="text"
                      value={archiveForm.dni}
                      onChange={(e) => {
                        const newDni = e.target.value;
                        const existingPatient = patients.find(p => p.dni === newDni);
                        if (existingPatient) {
                          setArchiveForm({
                            dni: newDni,
                            name: existingPatient.name,
                            age: existingPatient.age,
                            city: existingPatient.city,
                            birthdate: existingPatient.birthdate || ''
                          });
                        } else {
                          setArchiveForm({ ...archiveForm, dni: newDni });
                        }
                      }}
                      placeholder="Ej: 12345678"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={archiveForm.name}
                      onChange={(e) => setArchiveForm({ ...archiveForm, name: e.target.value })}
                      placeholder="Ej: Juan Pérez"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={archiveForm.birthdate}
                      onChange={(e) => {
                        const val = e.target.value;
                        const computedAge = val ? calculateAge(val) : '';
                        setArchiveForm({ ...archiveForm, birthdate: val, age: computedAge });
                      }}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Edad
                      </label>
                      <input
                        type="text"
                        value={archiveForm.age}
                        onChange={(e) => setArchiveForm({ ...archiveForm, age: e.target.value })}
                        placeholder="Ej: 45 años"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={archiveForm.city}
                        onChange={(e) => setArchiveForm({ ...archiveForm, city: e.target.value })}
                        placeholder="Ej: Lima"
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
                  <button
                    onClick={() => setArchiveModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (!archiveForm.dni || !archiveForm.name) {
                        alert('El DNI y Nombre son obligatorios');
                        return;
                      }
                      if (isArchiving) return;
                      setIsArchiving(true);

                      try {
                        const patient: Patient = {
                          dni: archiveForm.dni,
                          name: archiveForm.name,
                          age: archiveForm.age || '',
                          city: archiveForm.city,
                          birthdate: archiveForm.birthdate || undefined,
                          createdAt: Date.now(),
                          updatedAt: Date.now()
                        };
                        await savePatient(patient);

                        // Intentar crear paciente en Supabase primero (para evitar error de llaves foráneas)
                        let isPatientCreated = false;
                        try {
                          const patientRes = await fetch('/api/create-patient', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              paciente_dni: patient.dni,
                              nombre: patient.name,
                              edad: archiveForm.birthdate || patient.age,
                              ciudad: patient.city
                            }),
                            credentials: 'include'
                          });
                          
                          if (!patientRes.ok) {
                            const errData = await patientRes.json();
                            alert(`Error de Supabase (Paciente): ${errData.error || 'Error desconocido'}`);
                            return; // Stop the flow! Do not save report if patient fails
                          }
                          isPatientCreated = true;
                        } catch (err) {
                          console.error("Error de red conectando con Supabase al crear paciente:", err);
                          alert("Error de red al intentar crear el paciente en Supabase.");
                          return;
                        }

                        let reportType: 'clinical' | 'investigator' | 'epidemiology_macro' | 'immunology' = 'investigator';
                        let summary = '';
                        let fullData = null;

                        if (appMode === 'clinical' && clinicalAnalysis) {
                          reportType = 'clinical';
                          summary = clinicalAnalysis.summary;
                          fullData = clinicalAnalysis;
                        } else if (appMode === 'investigator' && analysis) {
                          reportType = 'investigator';
                          summary = analysis.summary;
                          fullData = analysis;
                        } else if (appMode === 'epidemiology_macro' && epidemiologyAnalysis) {
                          reportType = 'epidemiology_macro';
                          summary = epidemiologyAnalysis.summary;
                          fullData = epidemiologyAnalysis;
                        } else if (appMode === 'immunology' && immunologyAnalysis) {
                          reportType = 'immunology';
                          summary = immunologyAnalysis.summary;
                          fullData = immunologyAnalysis;
                        }

                        const report: ArchivedReport = {
                          id: crypto.randomUUID(),
                          patientDni: patient.dni,
                          date: Date.now(),
                          type: reportType,
                          topic: topic,
                          summary: summary,
                          fullData: fullData,
                          attachedFiles: currentSession?.attachedFiles || []
                        };

                        // Sincronizar en DB maestra (Supabase) ANTES que Local para evitar inconsistencias
                        let isReportSavedToCloud = false;
                        try {
                          // El check constraint en 'Registros_Clinicos' acepta TEXTO_CLINICO, HOSPITALIZACION, etc.
                          let dbTipo = 'TEXTO_CLINICO'; // fallback por defecto para Análisis y Debates

                          const reportRes = await fetch('/api/save-report', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              paciente_dni: patient.dni,
                              tipo: dbTipo,
                              contenido_json: report,
                              origen: 'INTERFAZ_CLINICA_GUARDADO'
                            }),
                            credentials: 'include'
                          });

                          if (!reportRes.ok) {
                            const errData = await reportRes.json();
                            alert(`Error Crítico de Base de Datos (Supabase): ${errData.error || 'Error desconocido al guardar el reporte'}`);
                            return; // No lo guardamos localmente si falló en la nube
                          }
                          isReportSavedToCloud = true;
                        } catch (err) {
                          console.error("Error de red sincronizando reporte a Supabase:", err);
                          alert("Error de red al conectar con Supabase para guardar el reporte.");
                          return;
                        }

                        // Solo Guardar local si la nube lo aceptó
                        if (isReportSavedToCloud) {
                          await saveArchivedReport(report);
                        }

                        await loadPatients();
                        setArchiveModalOpen(false);
                        setArchiveForm({ dni: '', name: '', age: '', city: '', birthdate: '' });
                      } finally {
                        setIsArchiving(false);
                      }
                    }}
                    disabled={isArchiving}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
                  >
                    {isArchiving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Patient Archive Modal */}
      <AnimatePresence>
        {isPatientArchiveOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 dark:bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-black/10 dark:border-white/10 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl rounded-xl overflow-hidden"
            >
              <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Archivo de Pacientes</h2>
                </div>
                <button
                  onClick={() => {
                    setIsPatientArchiveOpen(false);
                    setSelectedPatient(null);
                    setPatientReports([]);
                  }}
                  className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Patient List */}
                <div className="w-full md:w-1/3 border-r border-black/10 dark:border-white/10 overflow-y-auto custom-scrollbar">
                  {patients.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No hay pacientes archivados.
                    </div>
                  ) : (
                    <div className="divide-y divide-black/5 dark:divide-white/5">
                      {patients.map(patient => (
                        <div
                          key={patient.dni}
                          className={cn(
                            "w-full flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors group relative",
                            selectedPatient?.dni === patient.dni ? "bg-blue-50 dark:bg-blue-500/10 border-l-4 border-blue-500" : "border-l-4 border-transparent"
                          )}
                        >
                          <button
                            onClick={async () => {
                              setSelectedPatient(patient);
                              // Refrescar desde la nube inmediatamente al seleccionar
                              await loadPatients(patient.dni);
                            }}
                            className="w-full text-left p-4 pr-12"
                          >
                            <h3 className="font-bold text-gray-900 dark:text-white">{patient.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">DNI: {patient.dni}</p>
                          </button>

                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!window.confirm(`¿Estás seguro de eliminar todo el historial de ${patient.name}?`)) return;
                              try {
                                // Local (Fallback)
                                await deletePatient(patient.dni);
                                // Nube (Supabase)
                                await fetch('/api/delete-patient', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ paciente_dni: patient.dni }),
                                  credentials: 'include'
                                });
                                if (selectedPatient?.dni === patient.dni) setSelectedPatient(null);
                                await loadPatients();
                              } catch (err: any) {
                                alert("Error: " + err.message);
                              }
                            }}
                            title="Eliminar Paciente"
                            className="absolute right-4 p-2 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-colors opacity-60 hover:opacity-100"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patient Details & Reports */}
                <div className="w-full md:w-2/3 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-black/20 p-6">
                  {selectedPatient ? (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-white/5 p-4 rounded-lg border border-black/10 dark:border-white/10">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{selectedPatient.name}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <p><strong>DNI:</strong> {selectedPatient.dni}</p>
                          <p><strong>Edad:</strong> {selectedPatient.age || 'N/A'}</p>
                          <p><strong>Ciudad:</strong> {selectedPatient.city || 'N/A'}</p>
                          <p><strong>Última actualización:</strong> {new Date(selectedPatient.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Reportes Archivados ({patientReports.length})</h4>
                          {patientReports.length > 1 && (
                            <button
                              onClick={async () => {
                                setIsAnalyzing(true);
                                setIsPatientArchiveOpen(false);
                                setAppMode('investigator'); // Or a specific mode if needed
                                setIsDeltaMode(true);
                                setSteps([]); // Clear previous steps
                                try {
                                  const result = await runDeltaAnalysis(selectedPatient, patientReports, (step) => {
                                    setSteps(prev => [...prev, step]);
                                    // Auto-scroll logic if needed
                                    if (scrollRef.current) {
                                      setTimeout(() => {
                                        scrollRef.current?.scrollTo({
                                          top: scrollRef.current.scrollHeight,
                                          behavior: 'smooth'
                                        });
                                      }, 100);
                                    }
                                  });
                                  setDeltaAnalysis(result);

                                  // Save as a session
                                  const newSession: Session = {
                                    id: crypto.randomUUID(),
                                    title: `Análisis Delta: ${selectedPatient.name}`,
                                    topic: `Análisis longitudinal de ${patientReports.length} reportes`,
                                    createdAt: Date.now(),
                                    updatedAt: Date.now(),
                                    mode: 'investigator',
                                    isDeltaMode: true,
                                    tribunalResult: null,
                                    deltaResult: result,
                                    chatHistory: []
                                  };
                                  await saveSession(newSession);
                                  setCurrentSession(newSession);
                                  loadSessions();
                                } catch (error) {
                                  console.error("Error running Delta Analysis:", error);
                                  alert("Error al ejecutar el Análisis Delta.");
                                } finally {
                                  setIsAnalyzing(false);
                                }
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-widest rounded shadow-sm transition-colors"
                            >
                              <TrendingUp className="w-4 h-4" />
                              Ejecutar Análisis Delta
                            </button>
                          )}
                        </div>

                        {patientReports.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">No hay reportes para este paciente.</p>
                        ) : (
                          <div className="space-y-4">
                            {patientReports.map(report => (
                              <div key={report.id} className="bg-white dark:bg-white/5 p-4 rounded-lg border border-black/10 dark:border-white/10 flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded">
                                      {report.type}
                                    </span>
                                    <h5 className="font-bold text-gray-900 dark:text-white mt-2">{report.topic}</h5>
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(report.date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mt-2">{report.summary}</p>
                                <div className="flex justify-end items-center gap-2 mt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setVisualizingReport(report);
                                      setReportViewerFullscreen(false);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 rounded font-bold text-xs uppercase tracking-wider transition-colors"
                                  >
                                    <Scan className="w-3.5 h-3.5" />
                                    Visualizar
                                  </button>
                                  {report.usuario_id === authUser?.userId && (
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm('¿Estás seguro de eliminar este reporte?')) {
                                          // 1. Fallback local (opcional)
                                          try { await deleteArchivedReport(report.id); } catch (e) {}
                                          
                                          // 2. Eliminar de Supabase en la Nube
                                          try {
                                            await fetch('/api/delete-report', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ report_id: report.id }),
                                              credentials: 'include'
                                            });
                                          } catch (err) {
                                            console.error("Error borrando reporte en nube:", err);
                                          }
                                          // 3. Recargar vista actual desde la nube
                                          await loadPatients(selectedPatient.dni);
                                        }
                                      }}
                                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-1.5 rounded transition-colors"
                                      title="Eliminar reporte (Solo Autor)"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                      Selecciona un paciente para ver sus detalles y reportes.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Viewer Modal */}
      <AnimatePresence>
        {visualizingReport && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-100 dark:bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "bg-white dark:bg-[#1a1c23] border border-black/10 dark:border-white/10 flex flex-col shadow-2xl rounded-xl overflow-hidden transition-all duration-300",
                reportViewerFullscreen ? "w-full h-full rounded-none" : "w-full max-w-4xl max-h-[90vh] md:max-h-[85vh]"
              )}
            >
              <div className="p-3 md:p-4 border-b border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between bg-black/5 dark:bg-white/5 gap-3 sm:gap-0">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0 pr-2">
                  <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white truncate" title={visualizingReport.topic}>{visualizingReport.topic}</h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded sm:ml-2 whitespace-nowrap">
                    {visualizingReport.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-end shrink-0">
                  <button
                    onClick={async () => {
                      try {
                        const newSession: Session = {
                          id: crypto.randomUUID(),
                          title: `Recuperado: ${visualizingReport.topic.substring(0, 20)}...`,
                          topic: visualizingReport.topic,
                          createdAt: Date.now(),
                          updatedAt: Date.now(),
                          mode: visualizingReport.type,
                          isSocraticMode: false,
                          isDebateMode: false,
                          isDeltaMode: visualizingReport.type === 'investigator' && visualizingReport.fullData?.trajectoryData ? true : false,
                          tribunalResult: visualizingReport.type === 'investigator' ? visualizingReport.fullData : null,
                          clinicalResult: visualizingReport.type === 'clinical' ? visualizingReport.fullData : null,
                          immunologyResult: visualizingReport.type === 'immunology' ? visualizingReport.fullData : null,
                          epidemiologyResult: visualizingReport.type === 'epidemiology_macro' ? visualizingReport.fullData : null,
                          deltaResult: visualizingReport.fullData?.trajectoryData ? visualizingReport.fullData : null,
                          attachedFiles: visualizingReport.attachedFiles || [],
                          chatHistory: []
                        };
                        await saveSession(newSession);
                        loadSessions();
                        alert("Reporte guardado exitosamente en tus expedientes activos.");
                      } catch (error) {
                        console.error("Error saving archived report as session:", error);
                        alert("Error al guardar el reporte.");
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-bold transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Guardar
                  </button>
                  <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1"></div>
                  <button
                    onClick={() => setReportViewerFullscreen(!reportViewerFullscreen)}
                    className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    title={reportViewerFullscreen ? "Restaurar Tamaño" : "Pantalla Completa"}
                  >
                    <Scan className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setVisualizingReport(null)}
                    className="p-1.5 text-rose-500 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    title="Cerrar"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-gray-50/50 dark:bg-black/40">
                <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {generateMarkdownFromReport(visualizingReport)}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Location Settings Modal */}
      <AnimatePresence>
        {isLocationSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 dark:bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-black/10 dark:border-white/10 w-full max-w-md flex flex-col shadow-2xl rounded-xl overflow-hidden"
            >
              <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Ajustes Generales</h2>
                  <button
                    onClick={() => setShowSettingsHelp(true)}
                    className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-full transition-colors"
                  >
                    ¿Para qué sirve?
                  </button>
                </div>
                <button
                  onClick={() => setIsLocationSettingsOpen(false)}
                  className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      País / Región
                    </label>
                    <input
                      type="text"
                      id="region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="Ej: Perú, México, España..."
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      La IA ajustará sus recomendaciones al petitorio nacional o guías clínicas de este país.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ciudad / Localidad (Opcional)
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ej: Lima, CDMX, Madrid..."
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Útil para considerar vectores y recursos locales.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
                  <button
                    onClick={() => setIsLocationSettingsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('biologic_region', region);
                      localStorage.setItem('biologic_city', city);
                      setIsLocationSettingsOpen(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                  >
                    Guardar Ajustes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Help Modal */}
      <AnimatePresence>
        {showSettingsHelp && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-100 dark:bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-black/10 dark:border-white/10 w-full max-w-md flex flex-col shadow-2xl rounded-xl overflow-hidden"
            >
              <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-500" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">¿Para qué sirven los ajustes?</h2>
                </div>
                <button
                  onClick={() => setShowSettingsHelp(false)}
                  className="text-gray-500 dark:text-white/40 hover:text-gray-900 dark:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-xl text-sm text-blue-900 dark:text-blue-100 space-y-4 shadow-inner p-5">
                  <div className="flex items-start gap-3">
                    <Globe className="w-6 h-6 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block text-blue-800 dark:text-blue-300 mb-1 text-base">Sin rellenar (Enfoque Global)</strong>
                      <p className="text-blue-700/80 dark:text-blue-200/80 leading-relaxed text-sm">
                        La IA utilizará su conocimiento médico general y guías internacionales (FDA, EMA). Ideal para investigación pura o buscar los tratamientos más avanzados a nivel mundial, sin importar su disponibilidad local.
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-px bg-blue-200/50 dark:bg-blue-800/50 my-4"></div>
                  <div className="flex items-start gap-3">
                    <Pin className="w-6 h-6 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block text-indigo-800 dark:text-indigo-300 mb-1 text-base">Con datos (Enfoque Local)</strong>
                      <p className="text-indigo-700/80 dark:text-indigo-200/80 leading-relaxed text-sm">
                        La IA ajustará sus recomendaciones a la realidad de tu país. Priorizará el petitorio nacional de medicamentos, considerará la epidemiología local (vectores, enfermedades endémicas) y adaptará el manejo a tus recursos.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowSettingsHelp(false)}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm w-full sm:w-auto"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer / Status Bar */}
      <footer className="border-t border-black/10 dark:border-white/10 bg-gray-100 dark:bg-black/80 backdrop-blur-md py-2 px-4 sm:px-6 print-hidden">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-[8px] font-mono text-gray-400 dark:text-white/20 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-4 sm:gap-8">
            <span>
              {appMode === 'investigator' ? 'Agentes: 2 (Investigador, Crítico)' : 'Agentes: 1 (Médico Adscrito)'}
            </span>
            <span className="hidden xs:inline">Modelo: Gemini 3.1 Pro</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-8">
            <span className="flex items-center gap-1">
              <div className={cn("w-1 h-1 rounded-full", appMode === 'investigator' ? "bg-emerald-500" : "bg-cyan-500")} />
              Conexión Segura
            </span>
            <span>© 2026 BioLogic Interface</span>
          </div>
        </div>
      </footer>
      <AnimatePresence>
        {isReconstructing && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1a1c23] border border-cyan-500/30 shadow-2xl rounded-2xl p-8 max-w-md w-full flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse" />

              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-cyan-500 animate-pulse" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Asimilando Memoria
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                La red neuronal está aplicando las correcciones al caso y reconstruyendo el reporte clínico completo. Por favor espera...
              </p>
            </motion.div>
          </div>
        )}

        {showReconstructionSuccess && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1a1c23] border border-emerald-500/30 shadow-2xl rounded-2xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-emerald-500/10 p-6 flex flex-col items-center border-b border-emerald-500/20">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 text-center">
                  Sesión Reconstruida
                </h3>
              </div>

              <div className="p-6 text-center">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                  Se ha generado una <strong>nueva sesión clínica</strong> incorporando exitosamente las correcciones indicadas por la Memoria Evolutiva. El antiguo reporte ha sido archivado.
                </p>
                <button
                  onClick={() => setShowReconstructionSuccess(false)}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Ver Nuevo Reporte
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence>
          {isDictationModalOpen && (
            <LiveDictationModal
              onClose={() => setIsDictationModalOpen(false)}
              onAttachContext={handleAttachDictation}
            />
          )}
        </AnimatePresence>

        {isLibraryOpen && <MedicalLibraryModal onClose={() => setIsLibraryOpen(false)} />}
        {isNewPatientModalOpen && (
          <NewPatientModal
            onClose={() => setIsNewPatientModalOpen(false)}
            onPatientCreated={() => {
              loadPatients(); 
            }}
          />
        )}

        {isQuarantineModalOpen && selectedQuarantineSession && (
          <QuarantineModal
            isOpen={isQuarantineModalOpen}
            onClose={() => {
              setIsQuarantineModalOpen(false);
              setSelectedQuarantineSession(null);
            }}
            session={selectedQuarantineSession}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
