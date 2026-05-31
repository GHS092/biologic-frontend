import { transcribeAudio } from './api/_utils/gemini-core.js';
import { readFileSync } from 'fs';

async function main() {
  try {
    // We just need a tiny dummy base64 string or an actual small webm file.
    // Let's pass a dummy base64 string to see if it complains about format or something else.
    const base64Audio = "UklGRiQAAABXRUJNRwA="; // dummy webm header
    const text = await transcribeAudio(base64Audio, 'audio/webm');
    console.log("Result:", text);
  } catch (e) {
    console.error("TEST FAILED:", e);
  }
}

main();
