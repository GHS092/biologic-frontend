import React, { useState, useEffect } from 'react';
import { Settings, Key, Cpu, Save, ShieldCheck, Trash2, ArrowLeft, Power, Calculator, Activity, BarChart, Server, Lock, TrendingUp, TrendingDown, X, Users, User, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import B2bApiKeysManagement from './B2bApiKeysManagement';

const AVAILABLE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-experimental',
  'gemini-3.1-pro-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-flash',
  'gemini-2.0-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash'
];

interface TokenHistory {
  [date: string]: { input: number; output: number; };
}

export default function ApiDashboard() {
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [newKey, setNewKey] = useState('');
  const [activeModel, setActiveModel] = useState('gemini-3.1-pro-preview');
  const [isSaved, setIsSaved] = useState(false);
  const [isKillSwitchActive, setIsKillSwitchActive] = useState(false);
  const [isDictationEnabled, setIsDictationEnabled] = useState(true);
  const [dictationModel, setDictationModel] = useState('gemini-2.5-flash');
  const [apiProvider, setApiProvider] = useState<'google' | 'openrouter'>('openrouter');
  
  const [blockGlobal, setBlockGlobal] = useState(false);
  const [blockAssimilationTray, setBlockAssimilationTray] = useState(false);
  const [blockChatDiscoveries, setBlockChatDiscoveries] = useState(false);
  const [blockMedicalLibrary, setBlockMedicalLibrary] = useState(false);
  
  const [telemetryLogs, setTelemetryLogs] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // 'YYYY-MM'

  // Access Codes State
  const [accessCodes, setAccessCodes] = useState<any[]>([]);
  const [newCustomCode, setNewCustomCode] = useState<string>('');
  const [selectedCodeForMetrics, setSelectedCodeForMetrics] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showMetrics, setShowMetrics] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'general' | 'b2b'>('general');

  useEffect(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setSelectedMonth(`${yyyy}-${mm}`);
  }, []);

  useEffect(() => {
    if (isAuthenticated && selectedMonth && password) {
      fetchTelemetry(selectedMonth);
    }
  }, [selectedMonth, isAuthenticated]);

  const fetchTelemetry = async (month: string) => {
    try {
      const res = await fetch(`/api/admin-telemetry?month=${month}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setTelemetryLogs(data.logs || []);
      }
    } catch (e) {
      console.error("Error al cargar telemetría:", e);
    }
  };

  const fetchAccessCodes = async () => {
    try {
      const res = await fetch('/api/admin-access-codes', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setAccessCodes(data.codes || []);
      }
    } catch (e) {
      console.error("Error al cargar códigos de acceso:", e);
    }
  };

  useEffect(() => {
    if (isAuthenticated && password) {
      fetchAccessCodes();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');
    try {
      const authRes = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password }),
        credentials: 'include'
      });
      const authData = await authRes.json();
      if (!authRes.ok || !authData.success) throw new Error(authData.error || 'Error de autenticación');

      if (authData.token) {
        localStorage.setItem('biologic_admin_token', authData.token);
      }

      const res = await fetch('/api/admin-config', { credentials: 'include' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Error al obtener configuración');
      
      const config = data.config;
      setApiKeys(config.api_keys || []);
      setActiveModel(config.active_model || 'gemini-3.1-pro-preview');
      setIsKillSwitchActive(config.kill_switch === true);
      setIsDictationEnabled(config.dictation_enabled !== false);
      setDictationModel(config.dictation_model || 'gemini-2.5-flash');
      setApiProvider(config.api_provider || 'openrouter');
      setBlockGlobal(config.block_global === true);
      setBlockAssimilationTray(config.block_assimilation_tray === true);
      setBlockChatDiscoveries(config.block_chat_discoveries === true);
      setBlockMedicalLibrary(config.block_medical_library === true);
      
      setIsAuthenticated(true);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKey = () => {
    if (!newKey.trim()) return;
    if (apiKeys.includes(newKey.trim())) return;
    setApiKeys([...apiKeys, newKey.trim()]);
    setNewKey('');
    setIsSaved(false);
  };

  const handleRemoveKey = (keyToRemove: string) => {
    setApiKeys(apiKeys.filter(k => k !== keyToRemove));
    setIsSaved(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          api_keys: apiKeys,
          active_model: activeModel,
          kill_switch: isKillSwitchActive,
          dictation_enabled: isDictationEnabled,
          dictation_model: dictationModel,
          api_provider: apiProvider,
          block_global: blockGlobal,
          block_assimilation_tray: blockAssimilationTray,
          block_chat_discoveries: blockChatDiscoveries,
          block_medical_library: blockMedicalLibrary
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (data.migrationNeeded) {
        alert(data.message);
      }
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch(err: any) {
      alert("Error al guardar en la nube: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTelemetry = async () => {
    if (!confirm('¿Estás seguro de borrar TODO el historial de consumo en la nube? Esta acción es irreversible.')) return;
    try {
      const res = await fetch('/api/admin-telemetry', {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setTelemetryLogs([]);
      } else {
        const error = await res.json();
        alert('Error: ' + error.error);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleGenerateCodes = async () => {
    try {
      const res = await fetch('/api/admin-access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ customCode: newCustomCode })
      });
      const data = await res.json();
      if (res.ok) {
        setNewCustomCode('');
        fetchAccessCodes();
      } else {
        alert(data.error || "Error al generar código");
      }
    } catch (e) {
      alert("Error al conectar con la API");
    }
  };

  const handleRevokeCode = async (code: string) => {
    if (!confirm(`¿Revocar el acceso permanentemente para el código ${code}?`)) return;
    try {
      const res = await fetch('/api/admin-access-codes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code })
      });
      if (res.ok) fetchAccessCodes();
    } catch (e) {
      alert("Error al revocar código");
    }
  };

  // Helper para agrupar logs por MES (YYYY-MM)
  const groupLogsByMonth = (logs: any[]) => {
    const grouped: { [month: string]: { input: number; output: number; cost: number } } = {};
    logs.forEach(log => {
      const monthStr = log.timestamp.substring(0, 7); // 'YYYY-MM'
      if (!grouped[monthStr]) grouped[monthStr] = { input: 0, output: 0, cost: 0 };
      grouped[monthStr].input += log.input_tokens || 0;
      grouped[monthStr].output += log.output_tokens || 0;
      grouped[monthStr].cost += parseFloat(log.estimated_cost_usd) || 0;
    });
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const getMonthName = (yyyy_mm: string) => {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const m = parseInt(yyyy_mm.split('-')[1], 10);
      return months[m - 1];
  };

  const chatLogs = telemetryLogs.filter(log => log.action !== 'transcribeAudio');
  const dictationLogs = telemetryLogs.filter(log => log.action === 'transcribeAudio');

  const chatAnnualData = groupLogsByMonth(chatLogs);
  const dictationAnnualData = groupLogsByMonth(dictationLogs);

  const maxChatTokens = chatAnnualData.length > 0 ? Math.max(...chatAnnualData.map(d => d[1].input + d[1].output)) : 1;
  const maxDictationTokens = dictationAnnualData.length > 0 ? Math.max(...dictationAnnualData.map(d => d[1].input + d[1].output)) : 1;

  const totalChatInput = chatAnnualData.reduce((acc, curr) => acc + curr[1].input, 0);
  const totalChatOutput = chatAnnualData.reduce((acc, curr) => acc + curr[1].output, 0);
  const totalChatCost = chatAnnualData.reduce((acc, curr) => acc + curr[1].cost, 0).toFixed(4);

  const totalDictationInput = dictationAnnualData.reduce((acc, curr) => acc + curr[1].input, 0);
  const totalDictationOutput = dictationAnnualData.reduce((acc, curr) => acc + curr[1].output, 0);
  const totalDictationCost = dictationAnnualData.reduce((acc, curr) => acc + curr[1].cost, 0).toFixed(4);

  const totalGlobalCost = (parseFloat(totalChatCost) + parseFloat(totalDictationCost)).toFixed(4);

  const calculateMetrics = () => {
    const now = new Date();
    
    // Boundaries
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    
    const startOfThisWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
    const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let todayCost = 0, yesterdayCost = 0;
    let thisWeekCost = 0, lastWeekCost = 0;
    let thisMonthCost = 0, lastMonthCost = 0;

    telemetryLogs.forEach(log => {
      const d = new Date(log.timestamp);
      const cost = parseFloat(log.estimated_cost_usd) || 0;

      if (d >= startOfToday) todayCost += cost;
      else if (d >= startOfYesterday && d < startOfToday) yesterdayCost += cost;

      if (d >= startOfThisWeek) thisWeekCost += cost;
      else if (d >= startOfLastWeek && d < startOfThisWeek) lastWeekCost += cost;

      if (d >= startOfThisMonth) thisMonthCost += cost;
      else if (d >= startOfLastMonth && d < startOfThisMonth) lastMonthCost += cost;
    });

    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      todayCost, yesterdayCost, dailyTrend: calcTrend(todayCost, yesterdayCost),
      thisWeekCost, lastWeekCost, weeklyTrend: calcTrend(thisWeekCost, lastWeekCost),
      thisMonthCost, lastMonthCost, monthlyTrend: calcTrend(thisMonthCost, lastMonthCost)
    };
  };

  const metrics = calculateMetrics();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/50 border border-emerald-500/30 p-8 rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-white mb-2 tracking-wider">BÓVEDA DE ADMINISTRADOR</h2>
          <p className="text-emerald-500/50 text-xs text-center uppercase tracking-widest font-mono mb-8">Nivel de Acceso Máximo Requerido</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña Maestra..."
                className="w-full bg-black/60 border border-white/10 focus:border-emerald-500/50 rounded-lg px-4 py-3 text-center text-white font-mono tracking-widest outline-none transition-colors"
                autoFocus
              />
            </div>
            {authError && (
              <p className="text-rose-400 text-xs text-center font-mono">{authError}</p>
            )}
            <button 
              type="submit"
              disabled={isLoading || !password}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <Activity className="w-4 h-4 animate-spin" /> : 'Desbloquear Vórtice'}
            </button>
            <button 
              type="button"
              onClick={() => window.location.hash = ''} 
              className="w-full text-white/30 hover:text-white/60 text-xs uppercase tracking-widest font-mono mt-4 transition-colors"
            >
              Cancelar y Volver
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-12 font-sans selection:bg-emerald-500/30 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-6 gap-6">
          <div className="flex items-start md:items-center gap-4">
            <button 
              onClick={() => window.location.hash = ''} 
              className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/10 mt-1 md:mt-0 shrink-0"
              title="Volver a la Interfaz Médica"
            >
              <ArrowLeft className="w-5 h-5 text-emerald-400" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-wider flex items-center gap-2 md:gap-3">
                <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 shrink-0" />
                <span className="leading-tight">PANEL DE CONTROL CENTRAL</span>
              </h1>
              <p className="text-white/50 text-[10px] md:text-sm mt-1 uppercase tracking-widest font-mono">Gestión de Red Neuronal, APIS y Consumo</p>
            </div>
          </div>
          
          <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 relative overflow-hidden items-center justify-between w-full md:w-64 shadow-2xl shrink-0">
            {/* The animated background highlight */}
            <div 
               className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-lg transition-all duration-300 ease-in-out ${apiProvider === 'google' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
            />
            {apiProvider === 'openrouter' && (
               <div className="absolute top-0 bottom-0 right-0 w-1/2 bg-indigo-500/20 blur-xl transition-all" />
            )}
            
            <button 
              className={`relative z-10 w-1/2 flex items-center justify-center gap-2 py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors ${apiProvider === 'google' ? 'text-emerald-400' : 'text-white/40 hover:text-white/60'}`}
              onClick={() => { setApiProvider('google'); setIsSaved(false); }}
            >
              <Server className="w-4 h-4 shrink-0" /> <span className="truncate">Gemini</span>
            </button>
            <button 
              className={`relative z-10 w-1/2 flex items-center justify-center gap-2 py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors ${apiProvider === 'openrouter' ? 'text-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'text-white/40 hover:text-white/60'}`}
              onClick={() => { setApiProvider('openrouter'); setIsSaved(false); }}
            >
              <Activity className="w-4 h-4 shrink-0" /> <span className="truncate">OpenRouter</span>
            </button>
          </div>
        </div>

        {apiProvider === 'openrouter' && activeAdminTab === 'general' && (
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex items-start gap-4">
            <Activity className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-indigo-200">OpenRouter Proxy Activado</h3>
              <p className="text-sm text-indigo-200/70 mt-1">
                Todas las peticiones serán enrutadas a OpenRouter. Las API Keys integradas del servidor (10 en rotación de balanceo) tomarán el control absoluto. Tu llave maestra premium será usada si cambias.
              </p>
            </div>
          </div>
        )}

        {/* ADMIN TABS */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <button 
            onClick={() => setActiveAdminTab('general')}
            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
              activeAdminTab === 'general' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
            }`}
          >
            Configuración Core
          </button>
          <button 
            onClick={() => setActiveAdminTab('b2b')}
            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeAdminTab === 'b2b' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Server className="w-4 h-4" /> Gateway B2B
          </button>
        </div>

        {activeAdminTab === 'b2b' && (
          <B2bApiKeysManagement />
        )}

        {activeAdminTab === 'general' && (
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Columna A: API / Modelos */}
          <div className="space-y-8">
            <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-emerald-400" />
                Gemini / OR API Keys
              </h2>
              <p className="text-white/40 text-[11px] mb-6 font-mono leading-relaxed uppercase">
                {apiProvider === 'google' 
                  ? "Registra múltiples llaves de Google Studio. El sistema rotará entre ellas (Load Balancing) para evitar bloqueos." 
                  : "Las 10 llaves base de OpenRouter están compiladas. Puedes añadir llaves propias aquí si deseas."}
              </p>

              <div className="flex gap-2 mb-6">
                <input 
                  type="password" 
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="Pega tu API Key..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-white/20 font-mono"
                />
                <button 
                  onClick={handleAddKey}
                  className="bg-white/10 hover:bg-emerald-500/20 text-white border border-white/10 hover:border-emerald-500/50 px-4 rounded-lg text-sm font-medium transition-all"
                >
                  Añadir
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {apiKeys.length === 0 ? (
                  <div className="text-center p-6 border border-dashed border-white/10 rounded-lg text-white/30 text-xs uppercase tracking-widest font-mono">
                    {apiProvider === 'openrouter' ? "Usando 10 llaves internas del proxy" : "No hay llaves. Se usará el .env"}
                  </div>
                ) : (
                  apiKeys.map((key, index) => (
                    <div key={index} className="flex items-center justify-between bg-black/20 border border-emerald-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-mono text-sm text-white/70">
                          {key.substring(0, 8)}••••••••••••{key.substring(key.length - 4)}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleRemoveKey(key)}
                        className="text-white/30 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-blue-400" />
                Precedencia de Modelo Cognitivo
              </h2>
              <p className="text-white/40 text-[11px] mb-6 font-mono leading-relaxed uppercase">
                Selecciona explícitamente qué modelo procesará los datos. Prioriza 3.1 Pro Preview si tienes una API de PAGO activa.
              </p>

              <div className="space-y-3">
                {AVAILABLE_MODELS.map(model => (
                  <div 
                    key={model} 
                    onClick={() => { setActiveModel(model); setIsSaved(false); }}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      activeModel === model 
                        ? (model.includes('3.1') || model.includes('3.5')) ? 'bg-fuchsia-500/10 border-fuchsia-500/50' : 'bg-blue-500/10 border-blue-500/50' 
                        : 'bg-black/20 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        activeModel === model ? ((model.includes('3.1') || model.includes('3.5')) ? 'border-fuchsia-400' : 'border-blue-400') : 'border-white/30'
                      }`}>
                        {activeModel === model && <div className={`w-2 h-2 rounded-full ${(model.includes('3.1') || model.includes('3.5')) ? 'bg-fuchsia-400' : 'bg-blue-400'}`} />}
                      </div>
                      <span className={`font-mono text-sm ${(model.includes('3.1') || model.includes('3.5')) && activeModel === model ? 'text-fuchsia-100 font-bold' : ''}`}>{model}</span>
                    </div>
                    {model === 'gemini-3.5-flash' ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                        Latest / Free
                      </span>
                    ) : model === 'gemini-3.5-flash-experimental' ? (
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                        Experimental / Free
                      </span>
                    ) : model === 'gemini-3.1-pro-preview' ? (
                      <span className="text-[10px] bg-fuchsia-500/20 text-fuchsia-300 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                        Latest / Paid
                      </span>
                    ) : model === 'gemini-3.1-flash-lite-preview' ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                        Latest / Free
                      </span>
                    ) : model.includes('pro') ? (
                      <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                        Premium
                      </span>
                    ) : (
                      <span className="text-[10px] bg-yellow-500/10 text-yellow-500/70 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                        Fast
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
            </>

            {/* SECCIÓN GESTIÓN DE CÓDIGOS DE ACCESO */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/5 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-indigo-100">
                <Users className="w-5 h-5 text-indigo-400" />
                Control de Accesos y Licencias
              </h2>
              <p className="text-white/40 text-[11px] mb-6 font-mono leading-relaxed uppercase">
                Genera códigos únicos que los usuarios usarán para registrarse y acceder al ecosistema cerrado.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <input 
                  type="text" 
                  value={newCustomCode}
                  onChange={(e) => setNewCustomCode(e.target.value)}
                  placeholder="Ej: MED-123 (Vacío = Aleatorio)"
                  className="w-full sm:w-2/3 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors font-mono uppercase tracking-widest text-indigo-300 placeholder:text-white/20"
                />
                <button 
                  onClick={handleGenerateCodes}
                  className="w-full sm:w-1/3 bg-indigo-600/80 hover:bg-indigo-500 text-white border border-indigo-500/50 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  {newCustomCode ? 'Crear Código' : 'Generar Aleatorio'}
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {accessCodes.length === 0 ? (
                  <div className="text-center p-6 border border-dashed border-white/10 rounded-lg text-white/30 text-xs uppercase tracking-widest font-mono">
                    No hay códigos de acceso
                  </div>
                ) : (
                  accessCodes.map((codeObj, index) => {
                    const isUsed = codeObj.status === 'used';
                    const isRevoked = codeObj.status === 'revoked';
                    const userEmail = codeObj.used_by_email;

                    return (
                      <div key={index} className={`flex flex-col gap-3 bg-black/40 border rounded-xl p-4 transition-all hover:bg-black/60 ${isRevoked ? 'border-red-500/20 opacity-50' : isUsed ? 'border-indigo-500/30' : 'border-white/10 hover:border-emerald-500/30'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className={`w-2.5 h-2.5 flex-shrink-0 rounded-full ${isRevoked ? 'bg-red-500' : isUsed ? 'bg-indigo-500' : 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                            <span className="font-mono font-bold tracking-widest text-white/90 text-sm md:text-base truncate">
                              {codeObj.code}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            {isUsed && !isRevoked && (
                              <button 
                                onClick={() => setSelectedCodeForMetrics(codeObj.code)}
                                className="text-indigo-300 hover:text-white text-[9px] md:text-[10px] uppercase font-bold tracking-widest bg-indigo-500/20 hover:bg-indigo-500/40 px-3 py-2 rounded-lg transition-colors border border-indigo-500/30 whitespace-nowrap"
                              >
                                Detalles
                              </button>
                            )}
                            {!isRevoked && (
                              <button 
                                onClick={() => handleRevokeCode(codeObj.code)}
                                className="text-white/30 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 p-2 rounded-lg transition-colors"
                                title="Revocar Acceso"
                              >
                                <Trash2 className="w-4 h-4 flex-shrink-0" />
                              </button>
                            )}
                          </div>
                        </div>

                        {isUsed && userEmail && (
                          <div className="flex items-center gap-2 px-1 border-t border-white/5 pt-3 mt-1">
                            <Mail className="w-3.5 h-3.5 text-indigo-400/50 shrink-0" />
                            <span className="text-[11px] md:text-xs text-white/50 font-mono truncate">{userEmail}</span>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          </div>

          {/* Columna B: Tokens / Gráficos / Kill } */}
          <div className="space-y-8 flex flex-col">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden flex-1"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-orange-500" />
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-yellow-400 shrink-0" />
                  Telemetría Anual del Chat
                </h2>
                <div className="flex flex-row flex-wrap gap-2 w-full xl:w-auto">
                  <button onClick={() => setShowMetrics(true)} className="flex-1 sm:flex-none bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] md:text-xs px-3 py-2 rounded-lg font-bold uppercase tracking-wider transition-colors border border-emerald-500/30 flex items-center justify-center gap-2 text-center whitespace-nowrap">
                    <Calculator className="w-3.5 h-3.5 flex-shrink-0" /> Métricas
                  </button>
                  <button onClick={clearTelemetry} className="flex-1 sm:flex-none bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] md:text-xs px-3 py-2 rounded-lg font-bold uppercase tracking-wider transition-colors border border-red-500/30 flex items-center justify-center gap-2 text-center whitespace-nowrap">
                    <Trash2 className="w-3.5 h-3.5 flex-shrink-0" /> Borrar
                  </button>
                </div>
              </div>

              {/* GRÁFICO DE BARRAS CHAT ANUAL */}
              <div className="h-32 mt-6 mb-4 flex items-end justify-between gap-1 border-b border-white/10 pb-2">
                {chatAnnualData.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-xs font-mono uppercase">
                    Sin telemetría de chat registrada
                  </div>
                ) : (
                  chatAnnualData.map(([monthStr, data]) => {
                    const total = data.input + data.output;
                    const heightPercent = Math.max((total / maxChatTokens) * 100, 2);
                    const monthName = getMonthName(monthStr);
                    return (
                      <div key={monthStr} className="w-full flex flex-col items-center gap-2 group relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 rounded px-2 py-1 text-[10px] font-mono whitespace-nowrap z-10 pointer-events-none">
                          Input: {data.input}<br/>Output: {data.output}<br/>Cost: ${data.cost.toFixed(4)}
                        </div>
                        <div className="w-full max-w-[40px] bg-white/5 rounded-t-sm relative flex flex-col justify-end overflow-hidden" style={{ height: '100px' }}>
                          <div style={{ height: `${heightPercent}%` }} className="w-full bg-gradient-to-t from-orange-600 to-yellow-400 transition-all rounded-t-sm" />
                        </div>
                        <span className="text-[10px] text-white/40 font-mono uppercase">{monthName}</span>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                  <span className="text-[10px] text-white/50 uppercase font-mono mb-1 block">T. Input Global</span>
                  <span className="text-xl font-black text-cyan-400">{totalChatInput.toLocaleString()}</span>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                  <span className="text-[10px] text-white/50 uppercase font-mono mb-1 block">T. Output Global</span>
                  <span className="text-xl font-black text-emerald-400">{totalChatOutput.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div>
                  <span className="text-[10px] text-white/40 uppercase font-mono block">Costo Total del Chat</span>
                  <span className="text-lg font-mono text-yellow-500">${totalChatCost} USD</span>
                </div>
              </div>
            </motion.div>

            {/* ====== GRÁFICO DICTADO ====== */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden flex-1"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-fuchsia-500" />
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Telemetría Anual de Dictado por Voz
                </h2>
              </div>

              {/* GRÁFICO DE BARRAS DICTADO ANUAL */}
              <div className="h-32 mt-6 mb-4 flex items-end justify-between gap-1 border-b border-white/10 pb-2">
                {dictationAnnualData.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-xs font-mono uppercase">
                    Sin dictados registrados
                  </div>
                ) : (
                  dictationAnnualData.map(([monthStr, data]) => {
                    const total = data.input + data.output;
                    const heightPercent = Math.max((total / maxDictationTokens) * 100, 2);
                    const monthName = getMonthName(monthStr);
                    return (
                      <div key={monthStr} className="w-full flex flex-col items-center gap-2 group relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 rounded px-2 py-1 text-[10px] font-mono whitespace-nowrap z-10 pointer-events-none">
                          Input: {data.input}<br/>Output: {data.output}<br/>Cost: ${data.cost.toFixed(4)}
                        </div>
                        <div className="w-full max-w-[40px] bg-white/5 rounded-t-sm relative flex flex-col justify-end overflow-hidden" style={{ height: '100px' }}>
                          <div style={{ height: `${heightPercent}%` }} className="w-full bg-gradient-to-t from-fuchsia-600 to-purple-400 transition-all rounded-t-sm" />
                        </div>
                        <span className="text-[10px] text-white/40 font-mono uppercase">{monthName}</span>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                  <span className="text-[10px] text-white/50 uppercase font-mono mb-1 block">T. Input Voz Global</span>
                  <span className="text-xl font-black text-purple-400">{totalDictationInput.toLocaleString()}</span>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                  <span className="text-[10px] text-white/50 uppercase font-mono mb-1 block">T. Output Texto Global</span>
                  <span className="text-xl font-black text-fuchsia-400">{totalDictationOutput.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div>
                  <span className="text-[10px] text-white/40 uppercase font-mono block">Costo Total del Dictado</span>
                  <span className="text-lg font-mono text-purple-500">${totalDictationCost} USD</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/40 uppercase font-mono block">Gasto Total Global (Chat + Voz)</span>
                  <span className="text-lg font-black text-white">${totalGlobalCost} USD</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 border border-rose-500/20 rounded-2xl p-6 relative overflow-hidden shrink-0"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-red-600" />
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-rose-100">
                  <Power className="w-5 h-5 text-rose-500" />
                  Kill Switch
                </h2>
                {isKillSwitchActive && (
                  <span className="flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-400 px-2 py-1 rounded font-bold uppercase animate-pulse">
                    <Activity className="w-3 h-3" /> Bloqueado
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between bg-black/40 rounded-xl border border-rose-500/10 p-4">
                <div className="text-xs uppercase font-mono text-white/50 w-2/3 leading-relaxed">
                  Corta el flujo de peticiones desde este cliente. Útil si deseas prevenir acceso inmediato o restringir red.
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={isKillSwitchActive}
                      onChange={(e) => {
                        setIsKillSwitchActive(e.target.checked);
                        setIsSaved(false);
                      }}
                    />
                    <div className={`block w-12 h-6 rounded-full transition-colors ${
                      isKillSwitchActive ? 'bg-rose-600' : 'bg-gray-800 border border-white/10'
                    }`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      isKillSwitchActive ? 'transform translate-x-6' : ''
                    }`}></div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between bg-black/40 rounded-xl border border-blue-500/10 p-4 mt-4">
                <div className="text-xs uppercase font-mono text-white/50 w-2/3 leading-relaxed">
                  Asistente de Dictado (Gemini Live). Si lo apagas, los usuarios no podrán transcribir audio.
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={isDictationEnabled}
                      onChange={(e) => {
                        setIsDictationEnabled(e.target.checked);
                        setIsSaved(false);
                      }}
                    />
                    <div className={`block w-12 h-6 rounded-full transition-colors ${
                      isDictationEnabled ? 'bg-blue-600' : 'bg-gray-800 border border-white/10'
                    }`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      isDictationEnabled ? 'transform translate-x-6' : ''
                    }`}></div>
                  </div>
                </label>
              </div>

              {isDictationEnabled && (
                <div className="bg-black/40 rounded-xl border border-blue-500/10 p-4 mt-4">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-2">Modelo Exclusivo para Dictado</span>
                  <p className="text-[10px] text-white/40 font-mono mb-3">Define qué modelo usar para transcribir voz. Recomendado: gemini-2.5-flash o gemini-2.0-flash (optimizados para audio en REST).</p>
                  <select 
                    value={dictationModel}
                    onChange={(e) => {
                      setDictationModel(e.target.value);
                      setIsSaved(false);
                    }}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white font-mono"
                  >
                    <option value="gemini-3.1-flash-live-preview">gemini-3.1-flash-live-preview (Gemini Live Nativo)</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Respaldo Rápido)</option>
                    <option value="gemini-1.5-pro-latest">gemini-1.5-pro-latest (Respaldo Pro)</option>
                  </select>
                </div>
              )}
            </motion.div>

            {/* Escudo de Seguridad DB (Biblioteca) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white/5 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden shrink-0 mt-8"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 animate-pulse" />
              
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-100">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  Escudo de Seguridad DB (Biblioteca)
                </h2>
                {(blockGlobal || blockAssimilationTray || blockChatDiscoveries || blockMedicalLibrary) && (
                  <span className="flex items-center gap-1 text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded font-bold uppercase animate-pulse">
                    <Lock className="w-3 h-3" /> {blockGlobal ? "MAESTRO ACTIVO" : "CAPA ACTIVA"}
                  </span>
                )}
              </div>

              <p className="text-white/40 text-[11px] mb-6 font-mono leading-relaxed uppercase">
                Protección algorítmica contra inyecciones de datos no deseadas en la base de datos principal.
              </p>

              <div className="space-y-4">
                {/* INTERRUPTOR MAESTRO GLOBAL */}
                <div className={`flex items-center justify-between rounded-xl border p-4 transition-all duration-300 ${
                  blockGlobal 
                    ? 'bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                    : 'bg-black/40 border-white/10'
                }`}>
                  <div className="flex flex-col gap-1 w-2/3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${blockGlobal ? 'text-cyan-300' : 'text-white/80'}`}>
                      Interruptor Maestro Global
                    </span>
                    <span className="text-[10px] font-mono text-white/40 leading-relaxed uppercase">
                      Bloquea de forma inmediata y global todo ingreso de datos por cualquier canal de inyección.
                    </span>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={blockGlobal}
                        onChange={(e) => {
                          setBlockGlobal(e.target.checked);
                          setIsSaved(false);
                        }}
                      />
                      <div className={`block w-12 h-6 rounded-full transition-colors ${
                        blockGlobal ? 'bg-cyan-500' : 'bg-gray-800 border border-white/10'
                      }`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        blockGlobal ? 'transform translate-x-6' : ''
                      }`}></div>
                    </div>
                  </label>
                </div>

                {/* BANDEJA DE ASIMILACIÓN */}
                <div className={`flex items-center justify-between rounded-xl border p-4 transition-all duration-300 ${
                  blockGlobal 
                    ? 'opacity-40 bg-black/20 border-white/5 cursor-not-allowed' 
                    : blockAssimilationTray 
                      ? 'bg-purple-950/20 border-purple-500/40' 
                      : 'bg-black/40 border-white/10'
                }`}>
                  <div className="flex flex-col gap-1 w-2/3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      blockGlobal ? 'text-white/30' : blockAssimilationTray ? 'text-purple-300' : 'text-white/80'
                    }`}>
                      Canal: Bandeja de Asimilación
                    </span>
                    <span className="text-[10px] font-mono text-white/40 leading-relaxed uppercase">
                      {blockGlobal 
                        ? "🔒 BLOQUEADO POR INTERRUPTOR MAESTRO" 
                        : "Impide aprobar e inyectar literatura recopilada desde Europe PMC y Radiopaedia."}
                    </span>
                  </div>
                  <label className={`flex items-center ${blockGlobal ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        disabled={blockGlobal}
                        checked={blockGlobal || blockAssimilationTray}
                        onChange={(e) => {
                          setBlockAssimilationTray(e.target.checked);
                          setIsSaved(false);
                        }}
                      />
                      <div className={`block w-12 h-6 rounded-full transition-colors ${
                        (blockGlobal || blockAssimilationTray) ? 'bg-purple-600' : 'bg-gray-800 border border-white/10'
                      }`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        (blockGlobal || blockAssimilationTray) ? 'transform translate-x-6' : ''
                      }`}></div>
                    </div>
                  </label>
                </div>

                {/* DEBATES CON MÉDICO ADSCRITO */}
                <div className={`flex items-center justify-between rounded-xl border p-4 transition-all duration-300 ${
                  blockGlobal 
                    ? 'opacity-40 bg-black/20 border-white/5 cursor-not-allowed' 
                    : blockChatDiscoveries 
                      ? 'bg-emerald-950/20 border-emerald-500/40' 
                      : 'bg-black/40 border-white/10'
                }`}>
                  <div className="flex flex-col gap-1 w-2/3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      blockGlobal ? 'text-white/30' : blockChatDiscoveries ? 'text-emerald-300' : 'text-white/80'
                    }`}>
                      Canal: Debates de Médico Adscrito
                    </span>
                    <span className="text-[10px] font-mono text-white/40 leading-relaxed uppercase">
                      {blockGlobal 
                        ? "🔒 BLOQUEADO POR INTERRUPTOR MAESTRO" 
                        : "Bloquea la inyección de hallazgos surgidos del diálogo clínico con el Médico Adscrito."}
                    </span>
                  </div>
                  <label className={`flex items-center ${blockGlobal ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        disabled={blockGlobal}
                        checked={blockGlobal || blockChatDiscoveries}
                        onChange={(e) => {
                          setBlockChatDiscoveries(e.target.checked);
                          setIsSaved(false);
                        }}
                      />
                      <div className={`block w-12 h-6 rounded-full transition-colors ${
                        (blockGlobal || blockChatDiscoveries) ? 'bg-emerald-600' : 'bg-gray-800 border border-white/10'
                      }`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        (blockGlobal || blockChatDiscoveries) ? 'transform translate-x-6' : ''
                      }`}></div>
                    </div>
                  </label>
                </div>

                {/* BIBLIOTECA MÉDICA INGESTA DIRECTA */}
                <div className={`flex items-center justify-between rounded-xl border p-4 transition-all duration-300 ${
                  blockGlobal 
                    ? 'opacity-40 bg-black/20 border-white/5 cursor-not-allowed' 
                    : blockMedicalLibrary 
                      ? 'bg-indigo-950/20 border-indigo-500/40' 
                      : 'bg-black/40 border-white/10'
                }`}>
                  <div className="flex flex-col gap-1 w-2/3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      blockGlobal ? 'text-white/30' : blockMedicalLibrary ? 'text-indigo-300' : 'text-white/80'
                    }`}>
                      Canal: Ingesta Directa a Biblioteca
                    </span>
                    <span className="text-[10px] font-mono text-white/40 leading-relaxed uppercase">
                      {blockGlobal 
                        ? "🔒 BLOQUEADO POR INTERRUPTOR MAESTRO" 
                        : "Detiene la carga manual directa de literatura, PDFs o URLs por usuarios adscritos."}
                    </span>
                  </div>
                  <label className={`flex items-center ${blockGlobal ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        disabled={blockGlobal}
                        checked={blockGlobal || blockMedicalLibrary}
                        onChange={(e) => {
                          setBlockMedicalLibrary(e.target.checked);
                          setIsSaved(false);
                        }}
                      />
                      <div className={`block w-12 h-6 rounded-full transition-colors ${
                        (blockGlobal || blockMedicalLibrary) ? 'bg-indigo-600' : 'bg-gray-800 border border-white/10'
                      }`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        (blockGlobal || blockMedicalLibrary) ? 'transform translate-x-6' : ''
                      }`}></div>
                    </div>
                  </label>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
        )}

        {/* Footer actions */}
        <div className="flex justify-end mt-4 border-t border-white/10 pt-6 pb-12">
          <button 
            onClick={handleSave}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${
              isSaved 
                ? 'bg-emerald-500 text-white border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                : 'bg-white text-black hover:bg-gray-200'
            }`}
          >
            {isSaved ? (
              <>
                <ShieldCheck className="w-5 h-5" /> Configuración Guardada
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> Guardar Arquitectura Global
              </>
            )}
          </button>
        </div>

      </div>

      {/* MODAL DE METRICAS AVANZADAS */}
      <AnimatePresence>
        {showMetrics && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0c] border border-emerald-500/30 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
              
              {/* Header Modal */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
                    <Activity className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-wider">Métricas de Consumo Algorítmico</h2>
                    <p className="text-white/50 text-xs font-mono uppercase tracking-widest mt-1">Análisis Financiero y Trayectoria de Gasto</p>
                  </div>
                </div>
                <button onClick={() => setShowMetrics(false)} className="text-white/50 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Contenido Modal */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                
                {/* Grid de 3 Tarjetas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Día */}
                  <div className="bg-gradient-to-br from-black to-slate-900 border border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <BarChart className="w-16 h-16 text-white" />
                    </div>
                    <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono font-bold block mb-2">Últimas 24 Horas</span>
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-4xl font-black text-white">${metrics.todayCost.toFixed(4)}</span>
                      <span className="text-white/40 font-mono text-sm mb-1">USD</span>
                    </div>
                    <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                      <span className="text-[10px] text-white/40 uppercase font-mono">Día Anterior: ${metrics.yesterdayCost.toFixed(4)}</span>
                      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${metrics.dailyTrend > 0 ? 'bg-rose-500/20 text-rose-400' : metrics.dailyTrend < 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'}`}>
                        {metrics.dailyTrend > 0 ? <TrendingUp className="w-3 h-3" /> : metrics.dailyTrend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                        {Math.abs(metrics.dailyTrend).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Semana */}
                  <div className="bg-gradient-to-br from-black to-slate-900 border border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <BarChart className="w-16 h-16 text-white" />
                    </div>
                    <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono font-bold block mb-2">Últimos 7 Días</span>
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-4xl font-black text-white">${metrics.thisWeekCost.toFixed(4)}</span>
                      <span className="text-white/40 font-mono text-sm mb-1">USD</span>
                    </div>
                    <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                      <span className="text-[10px] text-white/40 uppercase font-mono">Semana Anterior: ${metrics.lastWeekCost.toFixed(4)}</span>
                      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${metrics.weeklyTrend > 0 ? 'bg-rose-500/20 text-rose-400' : metrics.weeklyTrend < 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'}`}>
                        {metrics.weeklyTrend > 0 ? <TrendingUp className="w-3 h-3" /> : metrics.weeklyTrend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                        {Math.abs(metrics.weeklyTrend).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Mes */}
                  <div className="bg-gradient-to-br from-black to-slate-900 border border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <BarChart className="w-16 h-16 text-white" />
                    </div>
                    <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono font-bold block mb-2">Mes Actual</span>
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-4xl font-black text-white">${metrics.thisMonthCost.toFixed(4)}</span>
                      <span className="text-white/40 font-mono text-sm mb-1">USD</span>
                    </div>
                    <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                      <span className="text-[10px] text-white/40 uppercase font-mono">Mes Anterior: ${metrics.lastMonthCost.toFixed(4)}</span>
                      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${metrics.monthlyTrend > 0 ? 'bg-rose-500/20 text-rose-400' : metrics.monthlyTrend < 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'}`}>
                        {metrics.monthlyTrend > 0 ? <TrendingUp className="w-3 h-3" /> : metrics.monthlyTrend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                        {Math.abs(metrics.monthlyTrend).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                </div>

                <div className="bg-black/40 border border-white/10 rounded-xl p-6 mt-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-2">Diagnóstico de Gasto</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {metrics.weeklyTrend > 20 
                      ? "⚠️ Alerta: Se observa un incremento significativo (>20%) en el uso semanal de tokens. Verifica la demanda del servicio o considera una auditoría de llamadas."
                      : metrics.weeklyTrend < -20
                      ? "✅ Optimización: El gasto semanal ha disminuido considerablemente (>20%). El uso del sistema es eficiente en comparación con la semana anterior."
                      : "ℹ️ El comportamiento del gasto se mantiene estable, dentro de variaciones normales (+/- 20% semanal). Los costos operativos están bajo control."
                    }
                  </p>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DETALLES DE USUARIO (LICENCIA) */}
      <AnimatePresence>
        {selectedCodeForMetrics && (() => {
          // Filtrar logs de este código
          const userLogs = telemetryLogs.filter(log => log.access_code === selectedCodeForMetrics);
          const totalInput = userLogs.reduce((acc, log) => acc + (log.input_tokens || 0), 0);
          const totalOutput = userLogs.reduce((acc, log) => acc + (log.output_tokens || 0), 0);
          const totalCost = userLogs.reduce((acc, log) => acc + (parseFloat(log.estimated_cost_usd) || 0), 0);
          const totalCalls = userLogs.length;

          const codeData = accessCodes.find(c => c.code === selectedCodeForMetrics);

          return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0a0a0c] border border-indigo-500/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
                      <User className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-wider font-mono">{selectedCodeForMetrics}</h2>
                      <p className="text-white/50 text-xs font-mono uppercase tracking-widest mt-1">
                        {codeData?.used_by_email || 'Usuario Desconocido'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCodeForMetrics(null)} className="text-white/50 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 border border-white/10 rounded-xl p-5">
                      <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono block mb-2">Total Consultas API</span>
                      <span className="text-3xl font-black text-indigo-400">{totalCalls}</span>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-xl p-5">
                      <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono block mb-2">Costo Generado</span>
                      <span className="text-3xl font-black text-rose-400">${totalCost.toFixed(4)}</span>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-xl p-5">
                      <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono block mb-2">Input Tokens</span>
                      <span className="text-2xl font-black text-white/80">{totalInput.toLocaleString()}</span>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-xl p-5">
                      <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono block mb-2">Output Tokens</span>
                      <span className="text-2xl font-black text-white/80">{totalOutput.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-center justify-between">
                    <div className="text-sm text-indigo-200">
                      <span className="font-bold">Estado: </span> Licencia Activa
                    </div>
                    <button 
                      onClick={() => {
                        handleRevokeCode(selectedCodeForMetrics);
                        setSelectedCodeForMetrics(null);
                      }}
                      className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase px-4 py-2 rounded shadow-lg transition-colors"
                    >
                      Revocar Acceso
                    </button>
                  </div>

                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
