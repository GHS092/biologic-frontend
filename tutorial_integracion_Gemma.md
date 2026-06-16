# Manual de Integración Definitivo: API MedGemma 1.5 Multimodal

Este documento está diseñado para guiar a desarrolladores (o a otros Agentes IA) paso a paso en cómo conectar cualquier plataforma o aplicación frontal (Frontend) con nuestra API médica impulsada por MedGemma 1.5 4B (con soporte visual y memoria).

## 1. Datos de Conexión Base

Dado que el servidor ya está alojado y vivo en la nube (Railway), la antigua dirección `http://localhost:8000` ya no se usa. Ahora, tu nueva URL principal es:

> [!TIP]
> **Base URL:** `https://gem-backend-production-0cad.up.railway.app`

### Endpoints Disponibles
El sistema expone dos rutas principales para chatear:
- **`POST /chat`**: Respuesta estándar (espera a que el modelo termine de pensar y envía todo de golpe).
- **`POST /chat/stream`**: Respuesta en tiempo real (envía palabra por palabra, ideal para interfaces similares a ChatGPT).

---

## 2. Estructura del "Payload" (Cómo armar el JSON)

Nuestra API es 100% compatible con el estándar de la industria (similar al de OpenAI). Recibe un historial de mensajes (Array `messages`) donde cada mensaje tiene un `role` (system, user, assistant) y un `content`.

### Reglas del `content`:
- **Si solo envías texto:** El `content` puede ser un String simple (`"Hola doctor"`).
- **Si envías imágenes (Multimodal):** El `content` DEBE ser un Array de objetos, indicando si es texto o imagen.

---

## 3. Ejemplos de Implementación (Copiar y Pegar)

A continuación, tienes los códigos exactos en JavaScript/TypeScript listos para implementar en tu plataforma (ya sea React, Next.js, Node.js o Vanilla JS).

### A. Consulta Simple de Texto
Úsalo cuando el usuario solo hace una pregunta escrita, sin subir imágenes.

```javascript
async function sendTextMessage(userQuestion) {
  const url = "https://gem-backend-production-0cad.up.railway.app/chat";
  
  const payload = {
    // Aquí puedes incluir mensajes anteriores para mantener la memoria (Historial)
    messages: [
      { 
        role: "system", 
        content: "Eres el Dr. Hermes, un experto asistente médico." 
      },
      { 
        role: "user", 
        content: userQuestion 
      }
    ],
    max_tokens: 1024,
    temperature: 0.7
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Respuesta del Doctor:", data.generated_text);
    return data.generated_text;

  } catch (error) {
    console.error("Error en la conexión con la API:", error);
  }
}
```

### B. Análisis de Radiografía o Imagen (Multimodal)
Úsalo cuando el usuario sube un archivo de imagen. Debes convertir la imagen a `Base64` antes de enviarla.

```javascript
async function sendMultimodalMessage(userQuestion, imageBase64String) {
  const url = "https://gem-backend-production-0cad.up.railway.app/chat";
  
  const payload = {
    messages: [
      {
        role: "user",
        // Cuando hay imagen, el 'content' se convierte en un arreglo:
        content: [
          { type: "text", text: userQuestion },
          { 
            type: "image_url", 
            image_url: { url: imageBase64String } // ej: "data:image/jpeg;base64,/9j/4AAQSk..."
          }
        ]
      }
    ],
    max_tokens: 1024,
    temperature: 0.4 // Menor temperatura para análisis más precisos
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Análisis Radiológico:", data.generated_text);
    return data.generated_text;

  } catch (error) {
    console.error("Error analizando la imagen:", error);
  }
}
```

### C. Consumiendo el Streaming (La mejor experiencia de usuario)
Si tu plataforma usa Server-Sent Events (SSE) para dibujar el texto progresivamente en pantalla, debes apuntar a `/chat/stream`.

```javascript
async function streamChat(messageHistoryArray, onNewChunkCallback) {
  const url = "https://gem-backend-production-0cad.up.railway.app/chat/stream";
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messageHistoryArray, // Historial completo de la conversación
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    // Leer el stream a medida que llega
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break; // Terminó de generar
      
      // Decodificar el pedacito de texto (chunk) y enviarlo a tu UI
      const chunk = decoder.decode(value, { stream: true });
      onNewChunkCallback(chunk); // Dibuja esto en pantalla al instante
    }

  } catch (error) {
    console.error("Error en streaming:", error);
  }
}
```

---

## 4. Notas Importantes para el Agente IA Implementador

> [!WARNING]
> **Base64 Prefix:** Asegúrate de que tu cadena Base64 incluya el prefijo MIME correcto. Por ejemplo: `data:image/jpeg;base64,...` o `data:image/png;base64,...`
> 
> **Seguridad (CORS):** La API en Railway está configurada abierta por defecto para este prototipo. Si presentas errores de CORS al llamar desde tu frontend en otra URL, deberás agregar la configuración de `CORSMiddleware` en el archivo `main.py` del repositorio `Gem-backend`.
