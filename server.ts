import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import adminConfig from './api/admin-config.ts';
import adminTelemetry from './api/admin-telemetry.ts';
import analyzePatient from './api/analyze-patient.ts';
import createPatient from './api/create-patient.ts';
import deletePatient from './api/delete-patient.ts';
import deleteReport from './api/delete-report.ts';
import getSharedSessions from './api/get-shared-sessions.ts';
import ingestAudio from './api/ingest-audio.ts';
import invokeGemini from './api/invoke-gemini.ts';
import saveReport from './api/save-report.ts';
import shareSession from './api/share-session.ts';
import syncDown from './api/sync-down.ts';
import auth from './api/auth.ts';
import adminAccessCodes from './api/admin-access-codes.ts';
import adminAuth from './api/admin-auth.ts';
import adminB2bKeys from './api/admin-b2b-keys.ts';
import b2bEndpoint from './api/b2b-endpoint.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Configurar trust proxy para Railway (Reverse Proxy)
// Esto es vital para que express-rate-limit detecte la IP real del usuario y no bloquee a todos.
app.set('trust proxy', 1);

// ==========================================
// 🛡️ CAPA DE TITANIO (SEGURIDAD Y CABECERAS)
// ==========================================

// 1. Helmet: Oculta cabeceras sensibles y añade escudos XSS
app.use(helmet({
    contentSecurityPolicy: false, // Deshabilitado para no bloquear scripts de React sin configurar nonces/hashes
    xssFilter: true, // Forzar X-XSS-Protection: 1; mode=block
}));

// 2. CORS Restringido
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://bio-medic.up.railway.app'] 
    : ['http://localhost:5173', 'http://localhost:8080'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true // Vital para enviar cookies HttpOnly
}));

// 3. Rate Limiting: Escudo Anti-Fuerza Bruta (Arquitectura Enterprise)
// Limitador Global para la API (no aplica a archivos estáticos)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5000, // Límite generoso para un hospital entero bajo una misma IP
    keyGenerator: (req) => {
        // Limitar por usuario autenticado preferentemente, o por IP como fallback
        const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        return req.cookies?.auth_token || (Array.isArray(userIp) ? userIp[0] : userIp);
    },
    message: { error: 'Demasiadas peticiones a la API. Intente nuevamente en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Limitador estricto para rutas de autenticación
const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 20, // Max 20 intentos por IP
    message: { error: 'Demasiados intentos fallidos. Su acceso ha sido bloqueado temporalmente por 5 minutos por seguridad.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Aplicar limitadores SOLO a las rutas de la API, permitiendo la carga libre de la UI (HTML, CSS, JS)
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/admin-auth', authLimiter);

// Parseadores
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Rutas API (Paso 2)
app.all('/api/admin-config', adminConfig);
app.all('/api/admin-telemetry', adminTelemetry);
app.all('/api/analyze-patient', analyzePatient);
app.all('/api/create-patient', createPatient);
app.all('/api/delete-patient', deletePatient);
app.all('/api/delete-report', deleteReport);
app.all('/api/get-shared-sessions', getSharedSessions);
app.all('/api/admin-b2b-keys', adminB2bKeys);
app.all('/api/v1/diagnostico', b2bEndpoint);
app.all('/api/ingest-audio', ingestAudio);
app.all('/api/invoke-gemini', invokeGemini);
app.all('/api/save-report', saveReport);
app.all('/api/share-session', shareSession);
app.all('/api/sync-down', syncDown);
app.all('/api/auth', auth);
app.all('/api/admin-auth', adminAuth);
app.all('/api/admin-access-codes', adminAccessCodes);

// Servir frontend compilado (Paso 3)
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
    // Si la ruta comienza con /api/ y no fue manejada, devolver 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Ruta API no encontrada' });
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor Railway iniciado en el puerto ${PORT}`);
});
