import React, { useState } from 'react';
import { UserPlus, XCircle, CheckCircle2, User, Calendar, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { Patient } from '../types';
import { savePatient } from '../services/db';

interface NewPatientModalProps {
  onClose: () => void;
  onPatientCreated: () => void;
}

export default function NewPatientModal({ onClose, onPatientCreated }: NewPatientModalProps) {
  const [formData, setFormData] = useState({ dni: '', name: '', age: '', city: '', birthdate: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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

  const handleBirthdateChange = (val: string) => {
    const computedAge = calculateAge(val);
    setFormData(prev => ({ ...prev, birthdate: val, age: computedAge }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dni || !formData.name) {
      setError('DNI y Nombre son obligatorios');
      return;
    }
    setError('');
    setIsSaving(true);

    try {
      // 1. Guardar localmente en IndexedDB
      const patient: Patient = {
        dni: formData.dni,
        name: formData.name,
        age: formData.age,
        city: formData.city,
        birthdate: formData.birthdate || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await savePatient(patient);

      // 2. Sincronizar con Supabase en Vercel
      const res = await fetch('/api/create-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_dni: formData.dni,
          nombre: formData.name,
          edad: formData.birthdate || formData.age,
          ciudad: formData.city
        })
      });

      if (!res.ok) {
        console.warn('Se guardó localmente pero falló la sincronización web. Puede continuar.');
      }

      setSuccess(true);
      onPatientCreated();
      
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Error al guardar paciente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 dark:bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-black/10 dark:border-white/10 w-full max-w-md flex flex-col shadow-2xl rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <UserPlus className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Nuevo Paciente</h2>
              <p className="text-[10px] text-gray-500 font-mono">Registro Maestro y Sincronización DB</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {success ? (
             <div className="flex flex-col items-center justify-center py-8 text-center">
                 <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">¡Paciente Registrado!</h3>
                 <p className="text-xs text-gray-500 mt-2 font-mono">El registro ha sido enlazado a la base de datos core.</p>
             </div>
          ) : (
            <>
              {error && <div className="p-2 bg-red-500/10 border border-red-500/30 text-rose-500 text-xs text-center rounded">{error}</div>}
              
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={formData.dni}
                    onChange={(e) => setFormData({...formData, dni: e.target.value})}
                    placeholder="DNI / Identificador Único *" 
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nombre Completo *" 
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="date" 
                      value={formData.birthdate}
                      onChange={(e) => handleBirthdateChange(e.target.value)}
                      placeholder="Fecha de Nacimiento" 
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-emerald-500/50 text-gray-900 dark:text-white"
                      title="Fecha de Nacimiento"
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      placeholder="Edad / Cálculo" 
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Distrito / Ciudad" 
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSaving ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Crear Registro Maestro
                </button>
              </div>
            </>
          )}
        </form>
      </motion.div>
    </div>
  );
}
