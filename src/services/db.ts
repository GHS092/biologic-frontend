import { Session, Patient, ArchivedReport } from '../types';

let currentUserId = 'anonymous';

export const setDbUser = (userId: string) => {
  currentUserId = userId;
  console.log("🛡️ Local Database Scoped to User:", userId);
};

const getDbName = () => `BioLogicDB_${currentUserId}`;

const STORE_NAME = 'sessions';
const PATIENTS_STORE = 'patients';
const REPORTS_STORE = 'archived_reports';
const DB_VERSION = 2;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(getDbName(), DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PATIENTS_STORE)) {
        db.createObjectStore(PATIENTS_STORE, { keyPath: 'dni' });
      }
      if (!db.objectStoreNames.contains(REPORTS_STORE)) {
        const reportStore = db.createObjectStore(REPORTS_STORE, { keyPath: 'id' });
        reportStore.createIndex('patientDni', 'patientDni', { unique: false });
      }
    };
  });
};

export const saveSession = async (session: Session): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(session);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getSessions = async (): Promise<Session[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.updatedAt - a.updatedAt));
    request.onerror = () => reject(request.error);
  });
};

export const deleteSession = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// --- Patient Functions ---

export const savePatient = async (patient: Patient): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PATIENTS_STORE, 'readwrite');
    const store = tx.objectStore(PATIENTS_STORE);
    store.put(patient);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getPatient = async (dni: string): Promise<Patient | undefined> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PATIENTS_STORE, 'readonly');
    const store = tx.objectStore(PATIENTS_STORE);
    const request = store.get(dni);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllPatients = async (): Promise<Patient[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PATIENTS_STORE, 'readonly');
    const store = tx.objectStore(PATIENTS_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.updatedAt - a.updatedAt));
    request.onerror = () => reject(request.error);
  });
};

// --- Archived Report Functions ---

export const saveArchivedReport = async (report: ArchivedReport): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(REPORTS_STORE, 'readwrite');
    const store = tx.objectStore(REPORTS_STORE);
    store.put(report);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getPatientReports = async (patientDni: string): Promise<ArchivedReport[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(REPORTS_STORE, 'readonly');
    const store = tx.objectStore(REPORTS_STORE);
    const index = store.index('patientDni');
    const request = index.getAll(patientDni);
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.date - a.date));
    request.onerror = () => reject(request.error);
  });
};

export const deleteArchivedReport = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(REPORTS_STORE, 'readwrite');
    const store = tx.objectStore(REPORTS_STORE);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const deletePatient = async (dni: string): Promise<void> => {
  const db = await initDB();
  
  // 1. Eliminar reportes archivados localmente
  const reports = await getPatientReports(dni);
  for (const report of reports) {
    await deleteArchivedReport(report.id);
  }

  // 2. Eliminar el paciente
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PATIENTS_STORE, 'readwrite');
    const store = tx.objectStore(PATIENTS_STORE);
    store.delete(dni);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const clearAllData = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    // IMPORTANTE: SOLO purgamos PATIENTS_STORE y REPORTS_STORE. 
    // Las sesiones (STORE_NAME) contienen el historial de chat del médico y NO se sincronizan
    // hacia la nube de manera automática (solo shared_sessions), por lo que borrarlas causa pérdida de datos.
    const tx = db.transaction([PATIENTS_STORE, REPORTS_STORE], 'readwrite');
    
    tx.objectStore(PATIENTS_STORE).clear();
    tx.objectStore(REPORTS_STORE).clear();
    
    tx.oncomplete = () => {
      console.warn("🛡️ BIO-MEDIC SECURITY PROTOCOL: Wipe-Out ejecutado con éxito. (Pacientes y Reportes eliminados, Historial de Chat preservado).");
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
};
