(function () {
  const { getTodayKey, getDay, getDialogue, DAYS } = window.SpeakDayData;
  const {
    speak,
    stopSpeaking,
    stopListening,
    listenOnce,
    supportsSpeechRecognition,
    similarityScore,
  } = window.SpeakDaySpeech;

  const state = {
    dayKey: getTodayKey(),
    slot: "morning",
    mode: "conversation",
    turnIndex: 0,
    phase: "idle",
    showHint: false,
    heard: "",
    score: null,
    error: null,
    phraseIndex: 0,
    autoPlay: true,
  };

  const root = document.getElementById("app");
  const micOk = supportsSpeechRecognition();

  function day() {
    return getDay(state.dayKey);
  }

  function dialogue() {
    return getDialogue(day(), state.slot);
  }

  function turn() {
    return dialogue().turns[state.turnIndex];
  }

  function isYouTurn(t) {
    return t && t.role === "you";
  }

  function resetSession() {
    stopSpeaking();
    stopListening();
    state.turnIndex = 0;
    state.phase = "idle";
    state.showHint = false;
    state.heard = "";
    state.score = null;
    state.error = null;
    state.phraseIndex = 0;
    render();
  }

  function applyAnswer(text) {
    const t = turn();
    if (!isYouTurn(t)) return;
    const answer = (text || "").trim();
    if (!answer) {
      state.error = "Type or speak your answer first.";
      render();
      return;
    }
    state.heard = answer;
    state.score = similarityScore(t.suggested, answer);
    state.error = null;
    state.phase = "feedback";
    render();
  }

  function partnerLine() {
    const t = turn();
    if (t && t.role === "partner") return t;
    const prev = dialogue().turns[state.turnIndex - 1];
    if (prev && prev.role === "partner") return prev;
    return null;
  }

  async function playPartner(text) {
    state.phase = "partner";
    state.error = null;
    render();
    try {
      await speak(text, { rate: 0.92 });
    } catch (e) {
      state.error = e.message || "Audio failed";
      render();
    }
  }

  async function startConversation() {
    state.heard = "";
    state.score = null;
    state.error = null;
    state.turnIndex = 0;
    const first = dialogue().turns[0];
    if (first.role === "partner") {
      await playPartner(first.text);
      if (dialogue().turns[1] && dialogue().turns[1].role === "you") {
        state.turnIndex = 1;
        state.phase = "your-turn";
      } else {
        state.phase = "idle";
      }
    } else {
      state.phase = "your-turn";
    }
    render();
  }

  async function afterPartnerAdvance() {
    const next = state.turnIndex + 1;
    if (next >= dialogue().turns.length) {
      state.phase = "done";
      render();
      return;
    }
    state.turnIndex = next;
    const nextTurn = dialogue().turns[next];
    if (nextTurn.role === "partner" && state.autoPlay) {
      await playPartner(nextTurn.text);
      const after = next + 1;
      if (after < dialogue().turns.length && dialogue().turns[after].role === "you") {
        state.turnIndex = after;
        state.phase = "your-turn";
        state.showHint = false;
      } else if (after >= dialogue().turns.length) {
        state.phase = "done";
      } else {
        state.phase = "idle";
      }
    } else if (nextTurn.role === "you") {
      state.phase = "your-turn";
      state.showHint = false;
    } else {
      state.phase = "idle";
    }
    render();
  }

  async function replayPartner() {
    const t = turn();
    if (t && t.role === "partner") {
      await playPartner(t.text);
      render();
      return;
    }
    const prev = dialogue().turns[state.turnIndex - 1];
    if (prev && prev.role === "partner") {
      await playPartner(prev.text);
      render();
    }
  }

  async function hearUser() {
    const t = turn();
    if (!isYouTurn(t)) return;
    stopSpeaking();
    state.phase = "listening";
    state.error = null;
    state.heard = "";
    state.score = null;
    render();
    try {
      const result = await listenOnce(20000);
      if (!result.transcript) {
        throw new Error(
          "No speech heard. Speak clearly in English, or type your answer below.",
        );
      }
      applyAnswer(result.transcript);
    } catch (e) {
      state.error = e.message || "Could not hear you";
      state.phase = "your-turn";
      render();
    }
  }

  async function playSuggested() {
    const t = turn();
    if (!isYouTurn(t)) return;
    state.error = null;
    try {
      await speak(t.suggested, { rate: 0.9 });
    } catch (e) {
      state.error = e.message || "Audio failed";
    }
    render();
  }

  async function shadowLine() {
    const t = turn();
    if (!isYouTurn(t)) return;
    state.error = null;
    try {
      await speak(t.suggested, { rate: 0.85 });
      state.phase = "your-turn";
    } catch (e) {
      state.error = e.message || "Audio failed";
    }
    render();
  }

  async function nextAfterYou() {
    const next = state.turnIndex + 1;
    state.heard = "";
    state.score = null;
    state.showHint = false;
    if (next >= dialogue().turns.length) {
      state.phase = "done";
      render();
      return;
    }
    state.turnIndex = next;
    const nextTurn = dialogue().turns[next];
    if (nextTurn.role === "partner") {
      await playPartner(nextTurn.text);
      const after = next + 1;
      if (after < dialogue().turns.length && dialogue().turns[after].role === "you") {
        state.turnIndex = after;
        state.phase = "your-turn";
      } else if (after >= dialogue().turns.length) {
        state.phase = "done";
      } else {
        state.phase = "idle";
      }
    } else {
      state.phase = "your-turn";
    }
    render();
  }

  async function playPhrase(index) {
    const i = index == null ? state.phraseIndex : index;
    const phrase = day().phrases[i];
    if (!phrase) return;
    state.phraseIndex = i;
    state.error = null;
    render();
    try {
      await speak(phrase.text, { rate: 0.88 });
    } catch (e) {
      state.error = e.message || "Audio failed";
      render();
    }
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    const d = day();
    const dlg = dialogue();
    const t = turn();
    const progress = Math.round(
      ((state.turnIndex + (state.phase === "done" ? 1 : 0)) / dlg.turns.length) * 100,
    );
    const partner = partnerLine();
    const youActive =
      state.phase === "your-turn" ||
      state.phase === "listening" ||
      state.phase === "feedback";

    const dayPills = DAYS.map(
      (item) =>
        `<button type="button" class="day-pill ${state.dayKey === item.key ? "active" : ""}" data-day="${item.key}">${esc(item.label.slice(0, 3))}</button>`,
    ).join("");

    let main = "";
    if (state.mode !== "phrases") {
      const suggestedVisible =
        state.showHint || state.mode === "shadow" || state.phase === "feedback";
      let youBody = "";
      if (isYouTurn(t)) {
        youBody = `<p class="prompt">${esc(t.prompt)}</p>`;
        if (suggestedVisible) {
          youBody += `<p class="suggested"><strong>Say:</strong> ${esc(t.suggested)}</p>`;
        }
        if (state.heard) {
          youBody += `<p class="heard"><strong>Heard:</strong> ${esc(state.heard)}${
            state.score != null
              ? ` <span class="score"> · match ~${state.score}%</span>`
              : ""
          }</p>`;
        }
      } else if (state.phase === "done") {
        youBody = `<p class="prompt">Dialogue complete. Replay or switch session.</p>`;
      } else {
        youBody = `<p class="prompt muted">Wait for your turn…</p>`;
      }

      let controls = "";
      if (state.phase === "idle" || state.phase === "done") {
        controls += `<button type="button" class="primary" data-action="start">${
          state.phase === "done" ? "Replay dialogue" : "Start audio conversation"
        }</button>`;
      }
      if (t && t.role === "partner" && state.phase === "idle") {
        controls += `<button type="button" class="secondary" data-action="continue">Continue</button>`;
      }
      if (state.phase === "listening" && isYouTurn(t)) {
        controls += `<button type="button" class="primary" disabled>Listening… speak now</button>`;
        controls += `<button type="button" class="ghost" data-action="cancel-mic">Cancel mic</button>`;
      }
      if ((state.phase === "your-turn" || state.phase === "feedback") && isYouTurn(t)) {
        if (state.mode === "shadow") {
          controls += `<button type="button" class="primary" data-action="shadow">Hear model answer</button>`;
        } else {
          controls += `<button type="button" class="primary" data-action="mic" ${
            micOk ? "" : "disabled"
          }>${micOk ? "Tap to speak" : "Mic unavailable — type below"}</button>`;
        }
        controls += `<button type="button" class="secondary" data-action="suggested">Play suggested line</button>`;
        controls += `<button type="button" class="ghost" data-action="hint">${
          state.showHint ? "Hide hint" : "Show hint"
        }</button>`;
        controls += `<button type="button" class="secondary" data-action="next">Next turn</button>`;
      }
      if (state.phase === "partner") {
        controls += `<button type="button" class="ghost" data-action="stop">Stop audio</button>`;
      }
      controls += `<button type="button" class="ghost" data-action="replay">Replay partner</button>`;
      controls += `<label class="autoplay"><input type="checkbox" data-action="autoplay" ${
        state.autoPlay ? "checked" : ""
      }/> Auto-play partner</label>`;

      const typeBox =
        isYouTurn(t) && state.phase !== "partner" && state.phase !== "idle"
          ? `<div class="type-answer">
              <label for="typed-answer">Or type your answer (if mic fails)</label>
              <textarea id="typed-answer" rows="2" placeholder="Type in English, then click Use typed answer">${esc(state.heard || "")}</textarea>
              <button type="button" class="secondary" data-action="typed">Use typed answer</button>
            </div>`
          : "";

      main = `
        <section class="conversation">
          <div class="progress-wrap">
            <div class="progress-bar" style="width:${progress}%"></div>
            <span>Turn ${Math.min(state.turnIndex + 1, dlg.turns.length)} / ${dlg.turns.length}</span>
          </div>
          <div class="script">
            <article class="bubble partner ${state.phase === "partner" ? "speaking" : ""}">
              <header>
                <span>Partner</span>
                ${state.phase === "partner" ? '<em class="pulse">speaking…</em>' : ""}
              </header>
              <p>${
                partner && partner.text
                  ? esc(partner.text)
                  : "Press Start to begin the audio dialogue."
              }</p>
            </article>
            <article class="bubble you ${youActive ? "active" : ""}">
              <header>
                <span>You</span>
                ${state.phase === "listening" ? '<em class="pulse mic">listening… speak now</em>' : ""}
              </header>
              ${youBody}
            </article>
          </div>
          ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
          ${
            state.phase === "listening"
              ? `<p class="note listen-tip">Allow the mic if Chrome asks. Speak clearly in English for up to 20 seconds.</p>`
              : ""
          }
          <div class="controls">${controls}</div>
          ${typeBox}
          <p class="note">Mic tip: use <strong>Chrome or Edge</strong> on <code>http://localhost/speakday/</code>, allow microphone, wait until partner audio stops, then tap speak.</p>
        </section>`;
    } else {
      const items = d.phrases
        .map(
          (p, i) => `
          <li class="${i === state.phraseIndex ? "current" : ""}">
            <button type="button" data-phrase="${i}">
              <span class="phrase-text">${esc(p.text)}</span>
              <span class="phrase-use">${esc(p.use)}</span>
            </button>
          </li>`,
        )
        .join("");
      main = `
        <section class="phrases">
          <h2>Phrase drill — ${d.phrases.length} phrases · say each three times</h2>
          <ul>${items}</ul>
          <div class="controls">
            <button type="button" class="primary" data-action="play-phrase">Play current phrase</button>
            <button type="button" class="secondary" data-action="next-phrase">Next phrase</button>
          </div>
          ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
        </section>`;
    }

    root.innerHTML = `
      <div class="atmosphere" aria-hidden="true"></div>
      <p class="xampp-banner">
        XAMPP: copy this <code>speakday</code> folder into <code>htdocs</code>, start only Apache, open
        <code>http://localhost/speakday/</code> — no Node, no port 5173.
      </p>
      <header class="top">
        <div class="brand-block">
          <p class="brand">SpeakDay</p>
          <p class="tagline">Audio conversations for meetings &amp; daily life</p>
        </div>
        <div class="slot-toggle" role="group" aria-label="Session">
          <button type="button" class="${state.slot === "morning" ? "active" : ""}" data-slot="morning">Morning</button>
          <button type="button" class="${state.slot === "afternoon" ? "active" : ""}" data-slot="afternoon">Afternoon</button>
        </div>
      </header>
      <main class="stage">
        <section class="hero-panel">
          <p class="eyebrow">${esc(d.label)} · ${esc(state.slot)}</p>
          <h1>${esc(d.focus)}</h1>
          <p class="lede">${esc(dlg.context)}</p>
          <div class="mode-row">
            <button type="button" class="mode-chip ${state.mode === "conversation" ? "active" : ""}" data-mode="conversation">Conversation</button>
            <button type="button" class="mode-chip ${state.mode === "shadow" ? "active" : ""}" data-mode="shadow">Shadow</button>
            <button type="button" class="mode-chip ${state.mode === "phrases" ? "active" : ""}" data-mode="phrases">Phrases</button>
          </div>
        </section>
        <section class="day-rail" aria-label="Choose day">${dayPills}</section>
        ${main}
      </main>
      <footer class="foot">
        <p>Daily loop: warm-up → conversation audio → shadow → phrases. Speak out loud every block.</p>
      </footer>`;
  }

  root.addEventListener("click", (event) => {
    const el = event.target.closest("[data-day],[data-slot],[data-mode],[data-action],[data-phrase]");
    if (!el) return;

    if (el.dataset.day) {
      state.dayKey = el.dataset.day;
      resetSession();
      return;
    }
    if (el.dataset.slot) {
      state.slot = el.dataset.slot;
      resetSession();
      return;
    }
    if (el.dataset.mode) {
      state.mode = el.dataset.mode;
      resetSession();
      return;
    }
    if (el.dataset.phrase != null) {
      void playPhrase(Number(el.dataset.phrase));
      return;
    }

    const action = el.dataset.action;
    if (action === "start") void startConversation();
    if (action === "continue") void afterPartnerAdvance();
    if (action === "mic") void hearUser();
    if (action === "cancel-mic") {
      stopListening();
      state.phase = "your-turn";
      state.error = "Mic cancelled. Try again or type your answer.";
      render();
    }
    if (action === "typed") {
      const box = root.querySelector("#typed-answer");
      applyAnswer(box ? box.value : "");
    }
    if (action === "suggested") void playSuggested();
    if (action === "shadow") void shadowLine();
    if (action === "hint") {
      state.showHint = !state.showHint;
      render();
    }
    if (action === "next") void nextAfterYou();
    if (action === "stop") {
      stopSpeaking();
      stopListening();
      state.phase = "idle";
      render();
    }
    if (action === "replay") void replayPartner();
    if (action === "play-phrase") void playPhrase();
    if (action === "next-phrase") {
      const next = (state.phraseIndex + 1) % day().phrases.length;
      void playPhrase(next);
    }
  });

  root.addEventListener("change", (event) => {
    const el = event.target;
    if (el && el.dataset && el.dataset.action === "autoplay") {
      state.autoPlay = !!el.checked;
    }
  });

  render();
})();
