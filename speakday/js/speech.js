/** Browser TTS + mic helpers for SpeakDay (no Node, works on XAMPP/Apache). */
(function (global) {
  function pickEnglishVoice() {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;
    return (
      voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          /Google|Samantha|Daniel|Alex|Microsoft|Natural/i.test(v.name),
      ) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null
    );
  }

  function ensureVoicesLoaded() {
    return new Promise((resolve) => {
      const existing = speechSynthesis.getVoices();
      if (existing.length) {
        resolve(existing);
        return;
      }
      const onVoices = () => {
        speechSynthesis.removeEventListener("voiceschanged", onVoices);
        resolve(speechSynthesis.getVoices());
      };
      speechSynthesis.addEventListener("voiceschanged", onVoices);
      speechSynthesis.getVoices();
      setTimeout(() => resolve(speechSynthesis.getVoices()), 500);
    });
  }

  function stopSpeaking() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }

  async function speak(text, options = {}) {
    if (!("speechSynthesis" in window)) {
      throw new Error("Speech synthesis is not supported in this browser.");
    }
    await ensureVoicesLoaded();
    stopSpeaking();
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang || "en-US";
      utterance.rate = options.rate ?? 0.95;
      utterance.pitch = options.pitch ?? 1;
      const voice = pickEnglishVoice();
      if (voice) utterance.voice = voice;
      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        if (event.error === "canceled" || event.error === "interrupted") {
          resolve();
          return;
        }
        if (event.error === "synthesis-failed" || event.error === "audio-busy") {
          console.warn("Speech synthesis unavailable:", event.error);
          resolve();
          return;
        }
        reject(new Error(event.error || "Speech failed"));
      };
      speechSynthesis.speak(utterance);
    });
  }

  function supportsSpeechRecognition() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  function listenOnce(timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        reject(new Error("Speech recognition is not supported in this browser."));
        return;
      }
      const recognition = new Recognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        recognition.stop();
        reject(new Error("Listening timed out — try again."));
      }, timeoutMs);
      recognition.onresult = (event) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        const result = event.results[0] && event.results[0][0];
        resolve({
          transcript: (result && result.transcript ? result.transcript.trim() : "") || "",
          confidence: (result && result.confidence) || 0,
        });
      };
      recognition.onerror = (event) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(new Error(event.error || "Microphone error"));
      };
      recognition.onend = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(new Error("No speech detected."));
      };
      recognition.start();
    });
  }

  function similarityScore(expected, actual) {
    const normalize = (s) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
    const a = new Set(normalize(expected));
    const b = normalize(actual);
    if (!a.size || !b.length) return 0;
    const hits = b.filter((w) => a.has(w)).length;
    return Math.round((hits / Math.max(a.size, b.length)) * 100);
  }

  global.SpeakDaySpeech = {
    speak,
    stopSpeaking,
    listenOnce,
    supportsSpeechRecognition,
    similarityScore,
  };
})(window);
