(function () {
  const speech = window.SpeakDaySpeech;
  const progress = window.SpeakDayProgress;
  const loader = window.SpeakDayLoader;

  const state = {
    ready: false,
    bootError: null,
    meta: null,
    updateInfo: null,
    dayKey: "mon",
    slot: "morning",
    mode: "path", // path | conversation | shadow | phrases | review | tips
    turnIndex: 0,
    phase: "idle",
    showHint: false,
    heard: "",
    score: null,
    error: null,
    phraseIndex: 0,
    autoPlay: true,
    tipIndex: 0,
    reviewQueue: [],
    reviewIndex: 0,
  };

  const root = document.getElementById("app");
  const micOk = speech.supportsSpeechRecognition();

  function days() {
    return window.SpeakDayData.DAYS;
  }

  function day() {
    return window.SpeakDayData.getDay(state.dayKey);
  }

  function dialogue() {
    return window.SpeakDayData.getDialogue(day(), state.slot);
  }

  function turn() {
    return dialogue().turns[state.turnIndex];
  }

  function isYouTurn(t) {
    return t && t.role === "you";
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function resetSession() {
    speech.stopSpeaking();
    speech.stopListening();
    state.turnIndex = 0;
    state.phase = "idle";
    state.showHint = false;
    state.heard = "";
    state.score = null;
    state.error = null;
    state.phraseIndex = 0;
  }

  function refreshReviewQueue() {
    state.reviewQueue = progress.duePhrases(days(), 24);
    state.reviewIndex = 0;
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
    state.score = speech.similarityScore(t.suggested, answer);
    state.error = null;
    state.phase = "feedback";
    render();
  }

  async function playPartner(text) {
    state.phase = "partner";
    state.error = null;
    render();
    try {
      await speech.speak(text, { rate: 0.92 });
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

  async function nextAfterYou() {
    const next = state.turnIndex + 1;
    state.heard = "";
    state.score = null;
    state.showHint = false;
    if (next >= dialogue().turns.length) {
      state.phase = "done";
      progress.markDialogueDone();
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
        progress.markDialogueDone();
      } else {
        state.phase = "idle";
      }
    } else {
      state.phase = "your-turn";
    }
    render();
  }

  async function hearUser() {
    const t = turn();
    if (!isYouTurn(t)) return;
    speech.stopSpeaking();
    state.phase = "listening";
    state.error = null;
    state.heard = "";
    state.score = null;
    render();
    try {
      const result = await speech.listenOnce(20000);
      if (!result.transcript) {
        throw new Error("No speech heard. Speak in English, or type below.");
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
    try {
      await speech.speak(t.suggested, { rate: 0.9 });
    } catch (e) {
      state.error = e.message || "Audio failed";
      render();
    }
  }

  async function playPhrase(index) {
    const i = index == null ? state.phraseIndex : index;
    const phrase = day().phrases[i];
    if (!phrase) return;
    state.phraseIndex = i;
    state.error = null;
    render();
    try {
      await speech.speak(phrase.text, { rate: 0.88 });
    } catch (e) {
      state.error = e.message || "Audio failed";
      render();
    }
  }

  async function playReviewPhrase() {
    const card = state.reviewQueue[state.reviewIndex];
    if (!card) return;
    try {
      await speech.speak(card.text, { rate: 0.88 });
    } catch (e) {
      state.error = e.message || "Audio failed";
      render();
    }
  }

  function rateReview(rating) {
    const card = state.reviewQueue[state.reviewIndex];
    if (!card) return;
    progress.reviewPhrase(card.dayKey, card.text, rating);
    state.reviewIndex += 1;
    if (state.reviewIndex >= state.reviewQueue.length) {
      refreshReviewQueue();
    }
    render();
  }

  async function checkUpdates(force) {
    state.error = null;
    render();
    try {
      const result = await loader.loadCurriculum({ forceRemote: !!force });
      loader.applyToWindow(result.curriculum);
      state.meta = result.meta;
      state.updateInfo = result.update;
      if (!days().find((d) => d.key === state.dayKey)) {
        state.dayKey = window.SpeakDayData.getTodayKey();
      }
      refreshReviewQueue();
      if (force && result.update && result.update.applied) {
        state.error = null;
      }
      render();
    } catch (e) {
      state.error = "Update failed: " + (e.message || "offline?");
      render();
    }
  }

  function partnerLine() {
    const t = turn();
    if (t && t.role === "partner") return t;
    const prev = dialogue().turns[state.turnIndex - 1];
    if (prev && prev.role === "partner") return prev;
    return null;
  }

  function renderPath(stats) {
    const missions = window.SpeakDayData.missions || [];
    const moves = window.SpeakDayData.meetingMoves || [];
    const doneToday = progress.load().missionsDone[progress.todayStr()] || [];

    const missionCards = missions
      .map((m) => {
        const done = doneToday.includes(m.id);
        const steps = m.steps.map((s) => `<li>${esc(s)}</li>`).join("");
        return `<article class="mission ${done ? "done" : ""}">
          <header><strong>${esc(m.title)}</strong><span>${m.minutes} min</span></header>
          <ol>${steps}</ol>
          <button type="button" class="secondary" data-action="mission-done" data-mission="${esc(m.id)}" ${
            done ? "disabled" : ""
          }>${done ? "Done today" : "Mark done"}</button>
        </article>`;
      })
      .join("");

    const moveList = moves
      .map((m) => `<li><strong>${esc(m.move)}:</strong> ${esc(m.example)}</li>`)
      .join("");

    return `
      <section class="teacher-panel">
        <h2>Today's teacher path</h2>
        <p class="lede-inline">Goal: speak fluently for work meetings and daily life — not perfect grammar.</p>
        <div class="stats-row">
          <div class="stat"><b>${stats.streak}</b><span>day streak</span></div>
          <div class="stat"><b>${stats.dialoguesDone}</b><span>dialogues</span></div>
          <div class="stat"><b>${stats.reviewsDone}</b><span>reviews</span></div>
          <div class="stat"><b>${(window.SpeakDayData.DAYS || []).reduce((n, d) => n + d.phrases.length, 0)}</b><span>phrases</span></div>
        </div>
        <div class="mission-grid">${missionCards}</div>
        <h3>Meeting survival kit (memorize)</h3>
        <ul class="moves">${moveList}</ul>
        <div class="controls">
          <button type="button" class="primary" data-action="goto-conversation">Start today's conversation</button>
          <button type="button" class="secondary" data-action="goto-review">Do SRS review</button>
          <button type="button" class="ghost" data-action="goto-tips">Trucchi / Tips</button>
        </div>
      </section>`;
  }

  function renderTips() {
    const tips = window.SpeakDayData.tips || [];
    const tip = tips[state.tipIndex] || tips[0];
    if (!tip) return `<section class="teacher-panel"><p>No tips loaded.</p></section>`;
    return `
      <section class="teacher-panel tips-panel">
        <h2>Trucchi veri per parlare e capire</h2>
        <p class="tip-count">Tip ${state.tipIndex + 1} / ${tips.length}</p>
        <article class="tip-card">
          <h3>${esc(tip.titleIT)} <span class="en">/ ${esc(tip.titleEN)}</span></h3>
          <p>${esc(tip.bodyIT)}</p>
          <p class="en-body">${esc(tip.bodyEN)}</p>
          <p class="practice"><strong>Practice now:</strong> ${esc(tip.practice)}</p>
        </article>
        <div class="controls">
          <button type="button" class="secondary" data-action="tip-prev">Previous</button>
          <button type="button" class="primary" data-action="tip-next">Next tip</button>
          <button type="button" class="ghost" data-action="play-tip-practice">Hear practice line</button>
        </div>
      </section>`;
  }

  function renderReview() {
    const card = state.reviewQueue[state.reviewIndex];
    if (!card) {
      return `<section class="teacher-panel">
        <h2>Review complete for now</h2>
        <p>No phrases due. Come back tomorrow, or practice Phrases mode.</p>
        <div class="controls">
          <button type="button" class="primary" data-action="goto-phrases">Open phrases</button>
          <button type="button" class="secondary" data-action="refresh-review">Refresh queue</button>
        </div>
      </section>`;
    }
    return `
      <section class="teacher-panel">
        <h2>Spaced review</h2>
        <p class="lede-inline">${state.reviewIndex + 1} / ${state.reviewQueue.length} due · ${esc(card.dayLabel)} · ${esc(card.use)}</p>
        <article class="bubble you active">
          <header><span>Say this aloud</span></header>
          <p class="prompt">${esc(card.text)}</p>
        </article>
        <div class="controls">
          <button type="button" class="primary" data-action="review-play">Play audio</button>
          <button type="button" class="ghost" data-action="review-again">Again</button>
          <button type="button" class="secondary" data-action="review-hard">Hard</button>
          <button type="button" class="secondary" data-action="review-good">Good</button>
          <button type="button" class="primary" data-action="review-easy">Easy</button>
        </div>
        <p class="note">Be honest: Easy = you said it instantly. Again = you hesitated or translated from Italian.</p>
      </section>`;
  }

  function renderConversation(stats) {
    const dlg = dialogue();
    const t = turn();
    const partner = partnerLine();
    const progressPct = Math.round(
      ((state.turnIndex + (state.phase === "done" ? 1 : 0)) / dlg.turns.length) * 100,
    );
    const youActive =
      state.phase === "your-turn" ||
      state.phase === "listening" ||
      state.phase === "feedback";
    const suggestedVisible =
      state.showHint || state.mode === "shadow" || state.phase === "feedback";

    let youBody = "";
    if (isYouTurn(t)) {
      youBody = `<p class="prompt">${esc(t.prompt)}</p>`;
      if (suggestedVisible) youBody += `<p class="suggested"><strong>Say:</strong> ${esc(t.suggested)}</p>`;
      if (state.heard) {
        youBody += `<p class="heard"><strong>Heard:</strong> ${esc(state.heard)}${
          state.score != null ? ` <span class="score"> · match ~${state.score}%</span>` : ""
        }</p>`;
      }
    } else if (state.phase === "done") {
      youBody = `<p class="prompt">Dialogue complete. Great work — mark a mission done on Path.</p>`;
    } else {
      youBody = `<p class="prompt muted">Wait for your turn…</p>`;
    }

    let controls = "";
    if (state.phase === "idle" || state.phase === "done") {
      controls += `<button type="button" class="primary" data-action="start">${
        state.phase === "done" ? "Replay dialogue" : "Start audio conversation"
      }</button>`;
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

    const typeBox =
      isYouTurn(t) && state.phase !== "partner" && state.phase !== "idle"
        ? `<div class="type-answer">
            <label for="typed-answer">Or type your answer (if mic fails)</label>
            <textarea id="typed-answer" rows="2" placeholder="Type in English…">${esc(state.heard || "")}</textarea>
            <button type="button" class="secondary" data-action="typed">Use typed answer</button>
          </div>`
        : "";

    return `
      <section class="conversation">
        <div class="progress-wrap">
          <div class="progress-bar" style="width:${progressPct}%"></div>
          <span>Turn ${Math.min(state.turnIndex + 1, dlg.turns.length)} / ${dlg.turns.length} · streak ${stats.streak}</span>
        </div>
        <div class="script">
          <article class="bubble partner ${state.phase === "partner" ? "speaking" : ""}">
            <header><span>Partner</span>${
              state.phase === "partner" ? '<em class="pulse">speaking…</em>' : ""
            }</header>
            <p>${
              partner && partner.text
                ? esc(partner.text)
                : "Press Start to begin the audio dialogue."
            }</p>
          </article>
          <article class="bubble you ${youActive ? "active" : ""}">
            <header><span>You</span>${
              state.phase === "listening" ? '<em class="pulse mic">listening… speak now</em>' : ""
            }</header>
            ${youBody}
          </article>
        </div>
        ${state.error ? `<p class="error">${esc(state.error)}</p>` : ""}
        <div class="controls">${controls}</div>
        ${typeBox}
        <p class="note">Mic: Chrome/Edge on <code>http://localhost/speakday/</code> · wait until partner stops · then speak.</p>
      </section>`;
  }

  function renderPhrases() {
    const d = day();
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
    return `
      <section class="phrases">
        <h2>Phrase bank — ${d.phrases.length} chunks for ${esc(d.label)}</h2>
        <p class="note">Say each 3×: slow → normal → like in a real meeting.</p>
        <ul>${items}</ul>
        <div class="controls">
          <button type="button" class="primary" data-action="play-phrase">Play current</button>
          <button type="button" class="secondary" data-action="next-phrase">Next phrase</button>
          <button type="button" class="ghost" data-action="goto-review">Add to long-term memory (Review)</button>
        </div>
      </section>`;
  }

  function render() {
    if (!state.ready) {
      root.innerHTML = `<div class="app boot"><p class="brand">SpeakDay</p><p>${
        state.bootError ? esc(state.bootError) : "Loading teacher curriculum…"
      }</p></div>`;
      return;
    }

    const stats = progress.stats();
    const d = day();
    const ver = window.SpeakDayData.version || "?";
    const src = (state.meta && state.meta.source) || "local";
    const updateNote =
      state.updateInfo && state.updateInfo.applied
        ? `Updated to ${esc(state.updateInfo.version)}`
        : state.updateInfo && state.updateInfo.offline
          ? "Offline — using cached/local curriculum"
          : `Curriculum v${esc(ver)} · ${esc(src)}`;

    const dayPills = days()
      .map(
        (item) =>
          `<button type="button" class="day-pill ${state.dayKey === item.key ? "active" : ""}" data-day="${item.key}">${esc(
            item.label.slice(0, 3),
          )}</button>`,
      )
      .join("");

    let main = "";
    if (state.mode === "path") main = renderPath(stats);
    else if (state.mode === "tips") main = renderTips();
    else if (state.mode === "review") main = renderReview();
    else if (state.mode === "phrases") main = renderPhrases();
    else main = renderConversation(stats);

    root.innerHTML = `
      <div class="atmosphere" aria-hidden="true"></div>
      <p class="xampp-banner">
        Long-term teacher · auto-updates phrases when online ·
        <button type="button" class="linkish" data-action="update">Check for updates</button>
        · ${updateNote}
      </p>
      <header class="top">
        <div class="brand-block">
          <p class="brand">SpeakDay</p>
          <p class="tagline">Work + daily life fluency coach</p>
        </div>
        <div class="slot-toggle" role="group" aria-label="Session">
          <button type="button" class="${state.slot === "morning" ? "active" : ""}" data-slot="morning">Morning</button>
          <button type="button" class="${state.slot === "afternoon" ? "active" : ""}" data-slot="afternoon">Afternoon</button>
        </div>
      </header>
      <main class="stage">
        <section class="hero-panel">
          <p class="eyebrow">${esc(d.label)} · streak ${stats.streak}</p>
          <h1>${state.mode === "path" ? "Your English speaking system" : esc(d.focus)}</h1>
          <p class="lede">${
            state.mode === "path"
              ? "Practice out loud every day. New phrases arrive automatically when you click Check for updates."
              : esc(dialogue().context)
          }</p>
          <div class="mode-row">
            <button type="button" class="mode-chip ${state.mode === "path" ? "active" : ""}" data-mode="path">Path</button>
            <button type="button" class="mode-chip ${state.mode === "conversation" ? "active" : ""}" data-mode="conversation">Conversation</button>
            <button type="button" class="mode-chip ${state.mode === "shadow" ? "active" : ""}" data-mode="shadow">Shadow</button>
            <button type="button" class="mode-chip ${state.mode === "phrases" ? "active" : ""}" data-mode="phrases">Phrases</button>
            <button type="button" class="mode-chip ${state.mode === "review" ? "active" : ""}" data-mode="review">Review</button>
            <button type="button" class="mode-chip ${state.mode === "tips" ? "active" : ""}" data-mode="tips">Trucchi</button>
          </div>
        </section>
        <section class="day-rail" aria-label="Choose day">${dayPills}</section>
        ${main}
        ${state.error && state.mode === "path" ? `<p class="error">${esc(state.error)}</p>` : ""}
      </main>
      <footer class="foot">
        <p>Fluency rule: short clear sentences out loud daily &gt; silent study. XAMPP: <code>http://localhost/speakday/</code></p>
      </footer>`;
  }

  root.addEventListener("click", (event) => {
    const el = event.target.closest(
      "[data-day],[data-slot],[data-mode],[data-action],[data-phrase],[data-mission]",
    );
    if (!el) return;

    if (el.dataset.day) {
      state.dayKey = el.dataset.day;
      resetSession();
      render();
      return;
    }
    if (el.dataset.slot) {
      state.slot = el.dataset.slot;
      resetSession();
      render();
      return;
    }
    if (el.dataset.mode) {
      state.mode = el.dataset.mode;
      resetSession();
      if (state.mode === "review") refreshReviewQueue();
      render();
      return;
    }
    if (el.dataset.phrase != null) {
      void playPhrase(Number(el.dataset.phrase));
      return;
    }

    const action = el.dataset.action;
    if (action === "update") void checkUpdates(true);
    if (action === "goto-conversation") {
      state.mode = "conversation";
      resetSession();
      render();
    }
    if (action === "goto-review") {
      state.mode = "review";
      refreshReviewQueue();
      render();
    }
    if (action === "goto-tips") {
      state.mode = "tips";
      render();
    }
    if (action === "goto-phrases") {
      state.mode = "phrases";
      render();
    }
    if (action === "refresh-review") {
      refreshReviewQueue();
      render();
    }
    if (action === "mission-done") {
      progress.completeMission(el.dataset.mission);
      render();
    }
    if (action === "tip-prev") {
      const tips = window.SpeakDayData.tips || [];
      state.tipIndex = (state.tipIndex - 1 + tips.length) % tips.length;
      render();
    }
    if (action === "tip-next") {
      const tips = window.SpeakDayData.tips || [];
      state.tipIndex = (state.tipIndex + 1) % tips.length;
      render();
    }
    if (action === "play-tip-practice") {
      const tip = (window.SpeakDayData.tips || [])[state.tipIndex];
      if (tip) void speech.speak(tip.practice, { rate: 0.95 });
    }
    if (action === "review-play") void playReviewPhrase();
    if (action === "review-again") rateReview("again");
    if (action === "review-hard") rateReview("hard");
    if (action === "review-good") rateReview("good");
    if (action === "review-easy") rateReview("easy");
    if (action === "start") void startConversation();
    if (action === "mic") void hearUser();
    if (action === "cancel-mic") {
      speech.stopListening();
      state.phase = "your-turn";
      state.error = "Mic cancelled. Try again or type your answer.";
      render();
    }
    if (action === "typed") {
      const box = root.querySelector("#typed-answer");
      applyAnswer(box ? box.value : "");
    }
    if (action === "suggested") void playSuggested();
    if (action === "shadow") {
      const t = turn();
      if (isYouTurn(t)) void speech.speak(t.suggested, { rate: 0.85 });
    }
    if (action === "hint") {
      state.showHint = !state.showHint;
      render();
    }
    if (action === "next") void nextAfterYou();
    if (action === "stop") {
      speech.stopSpeaking();
      speech.stopListening();
      state.phase = "idle";
      render();
    }
    if (action === "replay") {
      const t = turn();
      const line =
        t && t.role === "partner"
          ? t.text
          : (dialogue().turns[state.turnIndex - 1] || {}).text;
      if (line) void playPartner(line);
    }
    if (action === "play-phrase") void playPhrase();
    if (action === "next-phrase") {
      const next = (state.phraseIndex + 1) % day().phrases.length;
      void playPhrase(next);
    }
  });

  async function boot() {
    render();
    try {
      const result = await loader.loadCurriculum({ forceRemote: false });
      loader.applyToWindow(result.curriculum);
      state.meta = result.meta;
      state.updateInfo = result.update;
      state.dayKey = window.SpeakDayData.getTodayKey();
      state.ready = true;
      refreshReviewQueue();
      // Quiet background refresh so new phrases arrive without a button press.
      loader.loadCurriculum({ forceRemote: true }).then((fresh) => {
        if (fresh.update && fresh.update.applied) {
          loader.applyToWindow(fresh.curriculum);
          state.meta = fresh.meta;
          state.updateInfo = fresh.update;
          refreshReviewQueue();
          render();
        }
      });
      render();
    } catch (e) {
      state.bootError =
        "Could not load curriculum. Make sure speakday/data/curriculum.json is in htdocs.";
      render();
    }
  }

  boot();
})();
