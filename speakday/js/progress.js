/** Local progress: streak, SRS phrase ratings, daily mission checks. */
(function (global) {
  const KEY = "speakday.progress.v1";

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function defaultState() {
    return {
      streak: 0,
      lastActiveDay: null,
      phrases: {}, // id -> { ease, interval, due, reps }
      missionsDone: {}, // date -> [missionIds]
      dialoguesDone: 0,
      reviewsDone: 0,
    };
  }

  function load() {
    try {
      return Object.assign(defaultState(), JSON.parse(localStorage.getItem(KEY) || "{}"));
    } catch (_) {
      return defaultState();
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function touchStreak(state) {
    const t = todayStr();
    if (state.lastActiveDay === t) return state;
    if (!state.lastActiveDay) {
      state.streak = 1;
    } else {
      const prev = new Date(state.lastActiveDay + "T12:00:00");
      const cur = new Date(t + "T12:00:00");
      const diff = Math.round((cur - prev) / 86400000);
      state.streak = diff === 1 ? (state.streak || 0) + 1 : 1;
    }
    state.lastActiveDay = t;
    return state;
  }

  function phraseId(dayKey, text) {
    return dayKey + "::" + text;
  }

  function ensureCard(state, id) {
    if (!state.phrases[id]) {
      state.phrases[id] = {
        ease: 2.3,
        interval: 0,
        due: todayStr(),
        reps: 0,
      };
    }
    return state.phrases[id];
  }

  /** rating: again | hard | good | easy */
  function reviewPhrase(dayKey, text, rating) {
    const state = touchStreak(load());
    const id = phraseId(dayKey, text);
    const card = ensureCard(state, id);
    const now = new Date();
    let days = 0;

    if (rating === "again") {
      card.reps = 0;
      card.interval = 0;
      days = 0;
      card.ease = Math.max(1.3, card.ease - 0.2);
    } else if (rating === "hard") {
      card.reps += 1;
      card.interval = Math.max(1, Math.round((card.interval || 1) * 1.2));
      days = card.interval;
      card.ease = Math.max(1.3, card.ease - 0.05);
    } else if (rating === "good") {
      card.reps += 1;
      card.interval = card.interval ? Math.round(card.interval * card.ease) : 1;
      days = card.interval;
    } else {
      // easy
      card.reps += 1;
      card.ease += 0.1;
      card.interval = card.interval ? Math.round(card.interval * card.ease * 1.3) : 2;
      days = card.interval;
    }

    const due = new Date(now);
    due.setDate(due.getDate() + days);
    card.due = due.toISOString().slice(0, 10);
    state.reviewsDone = (state.reviewsDone || 0) + 1;
    save(state);
    return card;
  }

  function duePhrases(days, limit = 20) {
    const state = load();
    const t = todayStr();
    const out = [];
    for (const day of days) {
      for (const p of day.phrases) {
        const id = phraseId(day.key, p.text);
        const card = state.phrases[id];
        const due = !card || card.due <= t;
        if (due) out.push({ dayKey: day.key, dayLabel: day.label, ...p, id, card });
      }
    }
    // Prefer never-seen, then oldest due
    out.sort((a, b) => {
      const ar = a.card ? a.card.reps : -1;
      const br = b.card ? b.card.reps : -1;
      if (ar !== br) return ar - br;
      return String((a.card && a.card.due) || "").localeCompare(String((b.card && b.card.due) || ""));
    });
    return out.slice(0, limit);
  }

  function markDialogueDone() {
    const state = touchStreak(load());
    state.dialoguesDone = (state.dialoguesDone || 0) + 1;
    save(state);
    return state;
  }

  function completeMission(missionId) {
    const state = touchStreak(load());
    const t = todayStr();
    if (!state.missionsDone[t]) state.missionsDone[t] = [];
    if (!state.missionsDone[t].includes(missionId)) state.missionsDone[t].push(missionId);
    save(state);
    return state;
  }

  function stats() {
    const state = load();
    const t = todayStr();
    return {
      streak: state.streak || 0,
      dialoguesDone: state.dialoguesDone || 0,
      reviewsDone: state.reviewsDone || 0,
      missionsToday: (state.missionsDone[t] || []).length,
      lastActiveDay: state.lastActiveDay,
    };
  }

  global.SpeakDayProgress = {
    load,
    stats,
    duePhrases,
    reviewPhrase,
    markDialogueDone,
    completeMission,
    phraseId,
    todayStr,
  };
})(window);
