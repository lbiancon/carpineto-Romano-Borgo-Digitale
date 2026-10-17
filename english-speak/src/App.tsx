import { useEffect, useMemo, useState } from "react";
import {
  DAYS,
  getDay,
  getDialogue,
  getTodayKey,
  type DayKey,
  type Mode,
  type SessionSlot,
  type Turn,
} from "./data/routines";
import {
  listenOnce,
  similarityScore,
  speak,
  stopSpeaking,
  supportsSpeechRecognition,
} from "./lib/speech";
import "./App.css";

type Phase = "idle" | "partner" | "your-turn" | "listening" | "feedback" | "done";

function isYouTurn(turn: Turn): turn is Extract<Turn, { role: "you" }> {
  return turn.role === "you";
}

export default function App() {
  const [dayKey, setDayKey] = useState<DayKey>(getTodayKey);
  const [slot, setSlot] = useState<SessionSlot>("morning");
  const [mode, setMode] = useState<Mode>("conversation");
  const [turnIndex, setTurnIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [showHint, setShowHint] = useState(false);
  const [heard, setHeard] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const micOk = useMemo(() => supportsSpeechRecognition(), []);

  const day = getDay(dayKey);
  const dialogue = getDialogue(day, slot);
  const turn = dialogue.turns[turnIndex];
  const progress = Math.round(((turnIndex + (phase === "done" ? 1 : 0)) / dialogue.turns.length) * 100);

  useEffect(() => {
    stopSpeaking();
    setTurnIndex(0);
    setPhase("idle");
    setShowHint(false);
    setHeard("");
    setScore(null);
    setError(null);
    setPhraseIndex(0);
  }, [dayKey, slot, mode]);

  useEffect(() => () => stopSpeaking(), []);

  async function playPartner(text: string) {
    setPhase("partner");
    setError(null);
    try {
      await speak(text, { rate: 0.92 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audio failed");
    }
  }

  async function advanceFromPartner() {
    const next = turnIndex + 1;
    if (next >= dialogue.turns.length) {
      setPhase("done");
      return;
    }
    setTurnIndex(next);
    const nextTurn = dialogue.turns[next];
    if (nextTurn.role === "partner" && autoPlay) {
      await playPartner(nextTurn.text);
      const after = next + 1;
      if (after < dialogue.turns.length && dialogue.turns[after].role === "you") {
        setTurnIndex(after);
        setPhase("your-turn");
        setShowHint(false);
      } else if (after >= dialogue.turns.length) {
        setPhase("done");
      } else {
        setPhase("idle");
      }
    } else if (nextTurn.role === "you") {
      setPhase("your-turn");
      setShowHint(false);
    } else {
      setPhase("idle");
    }
  }

  async function startConversation() {
    setHeard("");
    setScore(null);
    setError(null);
    setTurnIndex(0);
    const first = dialogue.turns[0];
    if (first.role === "partner") {
      await playPartner(first.text);
      if (dialogue.turns[1]?.role === "you") {
        setTurnIndex(1);
        setPhase("your-turn");
      } else {
        setPhase("idle");
      }
    } else {
      setPhase("your-turn");
    }
  }

  async function replayPartner() {
    if (!turn || turn.role !== "partner") {
      const prev = dialogue.turns[turnIndex - 1];
      if (prev?.role === "partner") await playPartner(prev.text);
      return;
    }
    await playPartner(turn.text);
  }

  async function hearUser() {
    if (!isYouTurn(turn)) return;
    setPhase("listening");
    setError(null);
    setHeard("");
    setScore(null);
    try {
      const result = await listenOnce();
      setHeard(result.transcript);
      setScore(similarityScore(turn.suggested, result.transcript));
      setPhase("feedback");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not hear you");
      setPhase("your-turn");
    }
  }

  async function playSuggested() {
    if (!isYouTurn(turn)) return;
    setError(null);
    try {
      await speak(turn.suggested, { rate: 0.9 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audio failed");
    }
  }

  async function shadowLine() {
    if (!isYouTurn(turn)) return;
    setError(null);
    try {
      await speak(turn.suggested, { rate: 0.85 });
      setPhase("your-turn");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audio failed");
    }
  }

  function nextAfterYou() {
    const next = turnIndex + 1;
    setHeard("");
    setScore(null);
    setShowHint(false);
    if (next >= dialogue.turns.length) {
      setPhase("done");
      return;
    }
    setTurnIndex(next);
    const nextTurn = dialogue.turns[next];
    if (nextTurn.role === "partner") {
      void (async () => {
        await playPartner(nextTurn.text);
        const after = next + 1;
        if (after < dialogue.turns.length && dialogue.turns[after].role === "you") {
          setTurnIndex(after);
          setPhase("your-turn");
        } else if (after >= dialogue.turns.length) {
          setPhase("done");
        } else {
          setPhase("idle");
        }
      })();
    } else {
      setPhase("your-turn");
    }
  }

  async function playPhrase(index = phraseIndex) {
    const phrase = day.phrases[index];
    if (!phrase) return;
    setError(null);
    try {
      await speak(phrase.text, { rate: 0.88 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audio failed");
    }
  }

  const partnerLine =
    turn?.role === "partner"
      ? turn
      : dialogue.turns[turnIndex - 1]?.role === "partner"
        ? dialogue.turns[turnIndex - 1]
        : null;

  return (
    <div className="app">
      <div className="atmosphere" aria-hidden />
      <header className="top">
        <div className="brand-block">
          <p className="brand">SpeakDay</p>
          <p className="tagline">Audio conversations for meetings & daily life</p>
        </div>
        <div className="slot-toggle" role="group" aria-label="Session">
          <button
            type="button"
            className={slot === "morning" ? "active" : ""}
            onClick={() => setSlot("morning")}
          >
            Morning
          </button>
          <button
            type="button"
            className={slot === "afternoon" ? "active" : ""}
            onClick={() => setSlot("afternoon")}
          >
            Afternoon
          </button>
        </div>
      </header>

      <main className="stage">
        <section className="hero-panel">
          <p className="eyebrow">{day.label} · {slot}</p>
          <h1>{day.focus}</h1>
          <p className="lede">{dialogue.context}</p>
          <div className="mode-row">
            {(
              [
                ["conversation", "Conversation"],
                ["shadow", "Shadow"],
                ["phrases", "Phrases"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`mode-chip ${mode === key ? "active" : ""}`}
                onClick={() => setMode(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="day-rail" aria-label="Choose day">
          {DAYS.map((d) => (
            <button
              key={d.key}
              type="button"
              className={`day-pill ${dayKey === d.key ? "active" : ""}`}
              onClick={() => setDayKey(d.key)}
            >
              {d.label.slice(0, 3)}
            </button>
          ))}
        </section>

        {mode !== "phrases" ? (
          <section className="conversation">
            <div className="progress-wrap">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
              <span>
                Turn {Math.min(turnIndex + 1, dialogue.turns.length)} / {dialogue.turns.length}
              </span>
            </div>

            <div className="script">
              <article className={`bubble partner ${phase === "partner" ? "speaking" : ""}`}>
                <header>
                  <span>Partner</span>
                  {phase === "partner" && <em className="pulse">speaking…</em>}
                </header>
                <p>
                  {partnerLine && "text" in partnerLine
                    ? partnerLine.text
                    : "Press Start to begin the audio dialogue."}
                </p>
              </article>

              <article className={`bubble you ${phase === "your-turn" || phase === "listening" || phase === "feedback" ? "active" : ""}`}>
                <header>
                  <span>You</span>
                  {phase === "listening" && <em className="pulse mic">listening…</em>}
                </header>
                {isYouTurn(turn) ? (
                  <>
                    <p className="prompt">{turn.prompt}</p>
                    {(showHint || mode === "shadow" || phase === "feedback") && (
                      <p className="suggested">
                        <strong>Say:</strong> {turn.suggested}
                      </p>
                    )}
                    {heard && (
                      <p className="heard">
                        <strong>Heard:</strong> {heard}
                        {score !== null && <span className="score"> · match ~{score}%</span>}
                      </p>
                    )}
                  </>
                ) : phase === "done" ? (
                  <p className="prompt">Dialogue complete. Replay or switch session.</p>
                ) : (
                  <p className="prompt muted">Wait for your turn…</p>
                )}
              </article>
            </div>

            {error && <p className="error">{error}</p>}

            <div className="controls">
              {phase === "idle" || phase === "done" ? (
                <button type="button" className="primary" onClick={() => void startConversation()}>
                  {phase === "done" ? "Replay dialogue" : "Start audio conversation"}
                </button>
              ) : null}

              {turn?.role === "partner" && phase === "idle" ? (
                <button type="button" className="secondary" onClick={() => void advanceFromPartner()}>
                  Continue
                </button>
              ) : null}

              {(phase === "your-turn" || phase === "feedback") && isYouTurn(turn) ? (
                <>
                  {mode === "shadow" ? (
                    <button type="button" className="primary" onClick={() => void shadowLine()}>
                      Hear model answer
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="primary"
                      onClick={() => void hearUser()}
                      disabled={!micOk}
                    >
                      {micOk ? "Tap to speak" : "Mic unavailable — use hint"}
                    </button>
                  )}
                  <button type="button" className="secondary" onClick={() => void playSuggested()}>
                    Play suggested line
                  </button>
                  <button type="button" className="ghost" onClick={() => setShowHint((v) => !v)}>
                    {showHint ? "Hide hint" : "Show hint"}
                  </button>
                  <button type="button" className="secondary" onClick={nextAfterYou}>
                    Next turn
                  </button>
                </>
              ) : null}

              {phase === "partner" ? (
                <button type="button" className="ghost" onClick={() => stopSpeaking()}>
                  Stop audio
                </button>
              ) : null}

              <button type="button" className="ghost" onClick={() => void replayPartner()}>
                Replay partner
              </button>

              <label className="autoplay">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                />
                Auto-play partner
              </label>
            </div>

            {!micOk && (
              <p className="note">
                Tip: Chrome/Edge support microphone speech recognition. On other browsers, use
                “Play suggested line”, speak aloud, then tap Next.
              </p>
            )}
          </section>
        ) : (
          <section className="phrases">
            <h2>Phrase drill — say each three times</h2>
            <ul>
              {day.phrases.map((p, i) => (
                <li key={p.text} className={i === phraseIndex ? "current" : ""}>
                  <button type="button" onClick={() => { setPhraseIndex(i); void playPhrase(i); }}>
                    <span className="phrase-text">{p.text}</span>
                    <span className="phrase-use">{p.use}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="controls">
              <button type="button" className="primary" onClick={() => void playPhrase()}>
                Play current phrase
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  const next = (phraseIndex + 1) % day.phrases.length;
                  setPhraseIndex(next);
                  void playPhrase(next);
                }}
              >
                Next phrase
              </button>
            </div>
            {error && <p className="error">{error}</p>}
          </section>
        )}
      </main>

      <footer className="foot">
        <p>
          Daily loop: warm-up → conversation audio → shadow → phrases. Speak out loud every block.
        </p>
      </footer>
    </div>
  );
}
