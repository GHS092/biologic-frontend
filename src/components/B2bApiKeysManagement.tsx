import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Power, RefreshCw, Server, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

interface B2bApiKey {
  id: string;
  client_name: string;
  hashed_key: string;
  tier: 'Prueba' | 'Premium';
  status: 'Activa' | 'Suspendida' | 'Eliminada';
  credits_total: number;
  credits_used: number;
  rpm_limit: number;
  created_at: string;
  last_used_at: string | null;
}

export default function B2bApiKeysManagement() {
  const [keys, setKeys] = useState<B2bApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for creating new key
  const [clientName, setClientName] = useState('');
  const [tier, setTier] = useState<'Prueba' | 'Premium'>('Prueba');
  const [credits, setCredits] = useState<number>(50);
  const [rpm, setRpm] = useState<number>(10);
  
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin-b2b-keys', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setKeys(data.keys || []);
      } else {
        console.error(data.error);
      }
    } catch (e) {
      console.error("Error al cargar llaves B2B", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!clientName) return;
    
    try {
      const res = await fetch('/api/admin-b2b-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          clientName,
          tier,
          creditsTotal: credits,
          rpmLimit: rpm
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewlyCreatedKey(data.rawKey);
        fetchKeys();
        setClientName('');
      } else {
        alert(data.error || 'Error al crear llave');
      }
    } catch(e) {
      alert("Error al conectar con el servidor.");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Activa' ? 'Suspendida' : 'Activa';
    try {
      const res = await fetch('/api/admin-b2b-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) fetchKeys();
    } catch(e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta llave permanentemente?')) return;
    try {
      const res = await fetch('/api/admin-b2b-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchKeys();
    } catch(e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("¡Copiado al portapapeles!");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and Add Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-amber-100">
          <Server className="w-5 h-5 text-amber-400" />
          Nueva Llave B2B (API Gateway)
        </h2>
        
        {newlyCreatedKey ? (
          <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-xl p-6 text-center animate-pulse-soft">
            <h3 className="text-emerald-400 font-bold mb-2">¡Llave Generada con Éxito!</h3>
            <p className="text-white/60 text-xs mb-4">Esta es la única vez que verás este código. Cópialo y envíaselo al cliente de forma segura.</p>
            <div className="flex items-center justify-center gap-3">
              <code className="bg-black/50 border border-emerald-500/30 px-6 py-3 rounded-lg text-emerald-300 font-mono text-lg tracking-widest">
                {newlyCreatedKey}
              </code>
              <button 
                onClick={() => copyToClipboard(newlyCreatedKey)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-lg transition-colors"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={() => setNewlyCreatedKey(null)}
              className="mt-6 text-xs text-white/40 hover:text-white underline uppercase tracking-widest"
            >
              Cerrar y continuar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase text-white/50 tracking-widest font-mono mb-1 block">Nombre del Cliente / Hospital</label>
              <input 
                type="text" 
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej. Clínica Delgado"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-white/50 tracking-widest font-mono mb-1 block">Plan (Tier)</label>
              <select 
                value={tier}
                onChange={(e: any) => {
                  setTier(e.target.value);
                  if (e.target.value === 'Prueba') { setCredits(50); setRpm(10); }
                  else { setCredits(10000); setRpm(200); }
                }}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
              >
                <option value="Prueba">Prueba (Trial)</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-white/50 tracking-widest font-mono mb-1 block">Créditos / RPM</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={credits}
                  onChange={(e) => setCredits(Number(e.target.value))}
                  className="w-1/2 bg-black/40 border border-white/10 rounded-lg px-2 py-3 text-xs text-center"
                  title="Créditos Totales"
                />
                <input 
                  type="number" 
                  value={rpm}
                  onChange={(e) => setRpm(Number(e.target.value))}
                  className="w-1/2 bg-black/40 border border-white/10 rounded-lg px-2 py-3 text-xs text-center"
                  title="Requests Por Minuto (RPM)"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleCreate}
                disabled={!clientName}
                className="w-full bg-amber-600/80 hover:bg-amber-500 disabled:opacity-50 text-white border border-amber-500/50 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Generar
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Table Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden"
      >
        <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
          <Key className="w-5 h-5 text-gray-400" />
          Directorio de Clientes B2B
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <RefreshCw className="w-8 h-8 text-white/30 animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-white/10 rounded-xl text-white/40 font-mono text-sm uppercase tracking-widest">
            No hay clientes B2B registrados
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest font-mono text-white/40">
                  <th className="pb-3 px-4 font-normal">Cliente / ID</th>
                  <th className="pb-3 px-4 font-normal">Estado</th>
                  <th className="pb-3 px-4 font-normal text-right">Consumo</th>
                  <th className="pb-3 px-4 font-normal text-center">Protección</th>
                  <th className="pb-3 px-4 font-normal text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {keys.map(k => {
                  const usagePercent = Math.min((k.credits_used / k.credits_total) * 100, 100);
                  const isSuspended = k.status === 'Suspendida';
                  
                  return (
                    <tr key={k.id} className={`hover:bg-white/5 transition-colors ${isSuspended ? 'opacity-50' : ''}`}>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${k.tier === 'Premium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                            {k.client_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white/90">{k.client_name}</div>
                            <div className="text-[10px] font-mono text-white/40">{k.id.substring(0,8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          k.status === 'Activa' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {k.status === 'Activa' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {k.status}
                        </span>
                        <div className="text-[10px] font-mono text-white/30 mt-1 uppercase tracking-widest">{k.tier}</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="font-mono text-sm">
                          <span className={usagePercent > 90 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{k.credits_used}</span>
                          <span className="text-white/40"> / {k.credits_total}</span>
                        </div>
                        <div className="w-full bg-black/40 h-1.5 rounded-full mt-2 overflow-hidden flex justify-end">
                          <div className={`h-full ${usagePercent > 90 ? 'bg-rose-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${usagePercent}%` }} />
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block bg-black/50 border border-white/10 px-3 py-1 rounded text-[10px] font-mono text-white/50">
                          {k.rpm_limit} RPM
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleToggleStatus(k.id, k.status)}
                            className={`p-2 rounded-lg border transition-colors ${
                              isSuspended 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                            }`}
                            title={isSuspended ? "Reactivar" : "Suspender"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(k.id)}
                            className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors"
                            title="Revocar Definitivamente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
