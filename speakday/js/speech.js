/** Browser TTS + mic helpers for SpeakDay (no Node, works on XAMPP/Apache). */
(function (global) {
  let activeRecognition = null;

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

  function stopListening() {
    if (activeRecognition) {
      try {
        activeRecognition.onend = null;
        activeRecognition.onerror = null;
        activeRecognition.onresult = null;
        activeRecognition.stop();
      } catch (_) {
        /* ignore */
      }
      activeRecognition = null;
    }
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

  function friendlyMicError(code) {
    const map = {
      "no-speech":
        "No speech heard. Click “Tap to speak”, wait for Listening…, then speak louder in English.",
      "audio-capture":
        "Microphone not found. Check Windows mic settings and allow Chrome to use the mic.",
      "not-allowed":
        "Microphone blocked. Click the lock icon in the address bar → allow microphone → reload.",
      "service-not-allowed":
        "Mic blocked by browser policy. Use Chrome/Edge on http://localhost/speakday/",
      network: "Speech service needs internet. Check your connection and try again.",
      aborted: "Listening was interrupted. Tap to speak again.",
      "language-not-supported": "English recognition not available in this browser.",
    };
    return map[code] || `Microphone error (${code}). Try Chrome/Edge and allow the mic.`;
  }

  /** Warm up mic permission so recognition is less flaky. */
  async function ensureMicPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
  }

  /**
   * Listen until a final transcript arrives (or timeout).
   * Stops TTS first — Chrome often fails if synthesis is still running.
   */
  async function listenOnce(timeoutMs = 20000) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      throw new Error("Speech recognition is not supported. Use Chrome or Edge.");
    }

    stopSpeaking();
    stopListening();
    // Let TTS fully release the audio device.
    await new Promise((r) => setTimeout(r, 250));

    try {
      await ensureMicPermission();
    } catch (_) {
      throw new Error(friendlyMicError("not-allowed"));
    }

    return new Promise((resolve, reject) => {
      const recognition = new Recognition();
      activeRecognition = recognition;
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognition.continuous = true;

      let settled = false;
      let lastInterim = "";

      const finish = (fn) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        stopListening();
        fn();
      };

      const timer = setTimeout(() => {
        finish(() => {
          if (lastInterim.trim()) {
            resolve({ transcript: lastInterim.trim(), confidence: 0 });
          } else {
            reject(new Error(friendlyMicError("no-speech")));
          }
        });
      }, timeoutMs);

      recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const piece = event.results[i][0];
          const text = (piece && piece.transcript) || "";
          if (event.results[i].isFinal) {
            finish(() =>
              resolve({
                transcript: text.trim(),
                confidence: (piece && piece.confidence) || 0,
              }),
            );
            return;
          }
          interim += text;
        }
        if (interim.trim()) lastInterim = interim.trim();
      };

      recognition.onerror = (event) => {
        // no-speech / aborted: keep listening until timeout if we can
        if (event.error === "no-speech" || event.error === "aborted") {
          return;
        }
        finish(() => reject(new Error(friendlyMicError(event.error))));
      };

      recognition.onend = () => {
        if (settled) return;
        // Chrome often ends after a short silence — restart once if still in window.
        try {
          recognition.start();
        } catch (_) {
          finish(() => {
            if (lastInterim.trim()) {
              resolve({ transcript: lastInterim.trim(), confidence: 0 });
            } else {
              reject(new Error(friendlyMicError("no-speech")));
            }
          });
        }
      };

      try {
        recognition.start();
      } catch (e) {
        finish(() =>
          reject(
            new Error(
              e.message ||
                "Could not start microphone. Close other tabs using the mic and try again.",
            ),
          ),
        );
      }
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
    stopListening,
    listenOnce,
    supportsSpeechRecognition,
    similarityScore,
    ensureMicPermission,
  };
})(window);
