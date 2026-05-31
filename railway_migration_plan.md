# Plan Maestro de Migración: Vercel a Railway (BioLogic)

Este documento detalla los pasos arquitectónicos exactos necesarios para migrar el sistema BioLogic de una arquitectura "Serverless" (Vercel) a un servidor tradicional continuo (Railway), con el objetivo de eliminar definitivamente el error 504 (Timeout de 60 segundos).

---

## 1. La Gran Duda: ¿Se modificarán los Agentes Internos?

**Respuesta Directa: NO.** 
Tu preocupación es muy válida. No vamos a tocar la "inteligencia" de la Junta Médica, ni los prompts del Bibliotecario, ni las reglas estables de `gemini-core.ts`. 

Imagina que nuestro código actual tiene dos partes:
1. **El Cerebro (La Lógica):** Cómo piensan los agentes, cómo se estructuran los JSON, cómo buscan en Supabase.
2. **Las Puertas (El Enrutamiento):** Cómo recibe el servidor las peticiones de internet y cómo devuelve las respuestas.

**Lo único que refactorizaremos son "Las Puertas"**. Vercel tiene puertas automáticas (`export default async function handler`), mientras que en Railway nosotros debemos construir nuestras propias puertas usando una librería llamada **Express.js**.

---

## 2. Los 4 Pasos de la Refactorización Arquitectónica

### PASO 1: Construcción del Servidor Central (`server.js`)
Actualmente, Vercel gestiona los servidores por nosotros. En Railway, debemos crear un archivo raíz llamado `server.ts` (o `server.js`) que será el corazón palpitante del sistema. Este servidor se encargará de:
* Iniciar el servidor web en el puerto 8080 (o el que Railway asigne).
* Configurar los límites de tamaño (ej. permitir subir imágenes de 50MB, algo que Vercel hace por defecto pero Express requiere que configuremos explícitamente).
* Conectar las rutas de la API (ej. `/api/invoke-gemini`) con sus respectivos archivos.

### PASO 2: Mutación de la carpeta `/api/`
Todos los archivos dentro de tu carpeta `api/` (como `invoke-gemini.ts`, `save-report.ts`, `analyze-patient.ts`) deben cambiar su "envoltorio".

**Cómo es HOY (Específico de Vercel):**
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Lógica del Agente...
}
```

**Cómo será MAÑANA (Estándar Express para Railway):**
```typescript
import { Request, Response } from 'express';

export const invokeGeminiHandler = async (req: Request, res: Response) => {
    // La Lógica del Agente SE MANTIENE EXACTAMENTE IGUAL...
}
```

### PASO 3: Unificación del Frontend y Backend
En Vercel, el Frontend (React/Vite) y el Backend (la carpeta `api/`) viven separados y Vercel los une por arte de magia.
En Railway, el servidor `Express.js` tendrá que hacer doble trabajo:
1. Responder a las llamadas de la API.
2. Si el usuario entra a `misitio.railway.app`, el servidor Express debe buscar la carpeta compilada de Vite (`dist/`) y enviarle al usuario los archivos HTML, CSS y JS.

Se agregaría este código vital al servidor:
```javascript
// Servir la aplicación React compilada
app.use(express.static(path.join(__dirname, 'dist')));

// Para cualquier otra ruta que no sea /api, devolver el index.html de React
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
```

### PASO 4: Modificación del `package.json`
Railway necesita saber cómo encender el motor. Actualmente tu comando principal es `npm run build` (que compila Vite).
Tendremos que instalar `express` y agregar un comando de arranque universal:
```json
"scripts": {
  "build": "tsc && vite build",
  "start": "node dist/server.js"
}
```

---

## 3. Resumen de Riesgos y Beneficios

| Característica | En Vercel (Actual) | En Railway (Futuro) |
| :--- | :--- | :--- |
| **Límite de Tiempo (Timeout)** | 60 segundos (Fallo 504 garantizado en procesos largos) | **ILIMITADO** (Ideal para IA compleja) |
| **Manejo de Servidores** | Automático (Serverless) | Manual (Debemos crear `server.js`) |
| **Costo** | $0 (Límite estricto) o $20/mes | ~$2 a $3 dólares mensuales (Créditos de $5 bastan) |

## Conclusión
La migración es un trabajo puramente "mecánico" y de fontanería (conectar tuberías). No pondremos en riesgo la brillantez clínica de los agentes, simplemente les construiremos una casa nueva donde tengan tiempo infinito para pensar sin que Vercel les corte la luz a los 60 segundos.
