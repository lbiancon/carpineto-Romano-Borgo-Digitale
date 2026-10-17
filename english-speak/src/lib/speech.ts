export type SpeakOptions = {
  rate?: number;
  pitch?: number;
  lang?: string;
};

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      /Google|Samantha|Daniel|Alex|Microsoft|Natural/i.test(v.name),
  );
  return preferred ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
}

export function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) {
      resolve(existing);
      return;
    }
    const onVoices = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    // Some browsers need a kick.
    window.speechSynthesis.getVoices();
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500);
  });
}

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  window.speechSynthesis.cancel();
}

export async function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    throw new Error("Speech synthesis is not supported in this browser.");
  }

  await ensureVoicesLoaded();
  stopSpeaking();

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang ?? "en-US";
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
      reject(new Error(event.error || "Speech failed"));
    };

    window.speechSynthesis.speak(utterance);
  });
}

export type ListenResult = {
  transcript: string;
  confidence: number;
};

export function supportsSpeechRecognition(): boolean {
  return typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function listenOnce(timeoutMs = 12000): Promise<ListenResult> {
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
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      recognition.stop();
      reject(new Error("Listening timed out — try again."));
    }, timeoutMs);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      const result = event.results[0]?.[0];
      resolve({
        transcript: result?.transcript?.trim() ?? "",
        confidence: result?.confidence ?? 0,
      });
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      reject(new Error(event.error || "Microphone error"));
    };

    recognition.onend = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      reject(new Error("No speech detected."));
    };

    recognition.start();
  });
}

/** Rough similarity for gentle feedback (not a grade). */
export function similarityScore(expected: string, actual: string): number {
  const normalize = (s: string) =>
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
