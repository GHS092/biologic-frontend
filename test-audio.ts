import { transcribeAudio } from './api/_utils/gemini-core.js';

async function main() {
  try {
    const base64Audio = "UklGRiQAAABXRUJNRwA="; // dummy
    const text = await transcribeAudio(base64Audio, 'audio/webm');
    console.log("Result:", text);
  } catch (e) {
    console.error("TEST FAILED:", e);
  }
}

main();
