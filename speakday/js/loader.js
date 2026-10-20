/**
 * Curriculum loader with auto-update from GitHub + localStorage cache.
 * Works on XAMPP: falls back to bundled data/curriculum.json if offline.
 */
(function (global) {
  const CACHE_KEY = "speakday.curriculum.v1";
  const META_KEY = "speakday.curriculum.meta.v1";

  // Prefer main; also try the feature branch until it is merged.
  const REMOTE_URLS = [
    "https://raw.githubusercontent.com/lbiancon/inclusivity/main/speakday/data/curriculum.json",
    "https://raw.githubusercontent.com/lbiancon/inclusivity/cursor/english-audio-conversation-routine-25ee/speakday/data/curriculum.json",
    "https://cdn.jsdelivr.net/gh/lbiancon/inclusivity@main/speakday/data/curriculum.json",
  ];

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function writeCache(curriculum, source) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(curriculum));
      localStorage.setItem(
        META_KEY,
        JSON.stringify({
          version: curriculum.version,
          updatedAt: curriculum.updatedAt,
          source,
          fetchedAt: new Date().toISOString(),
        }),
      );
    } catch (_) {
      /* quota / private mode */
    }
  }

  function readMeta() {
    try {
      return JSON.parse(localStorage.getItem(META_KEY) || "null");
    } catch (_) {
      return null;
    }
  }

  async function fetchJson(url, timeoutMs = 8000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadBundled() {
    const res = await fetch("data/curriculum.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Missing local curriculum.json");
    return res.json();
  }

  function isNewer(a, b) {
    if (!a) return false;
    if (!b) return true;
    if (a.version && b.version && a.version !== b.version) {
      return String(a.version) > String(b.version);
    }
    return String(a.updatedAt || "") > String(b.updatedAt || "");
  }

  async function tryRemotes() {
    for (const url of REMOTE_URLS) {
      try {
        const data = await fetchJson(url);
        if (data && Array.isArray(data.days) && data.days.length) {
          return { data, url };
        }
      } catch (_) {
        /* try next */
      }
    }
    return null;
  }

  /**
   * Load order: cache (instant) → bundled → remote update (background-capable).
   * forceRemote=true used by the Update button.
   */
  async function loadCurriculum(options = {}) {
    const forceRemote = !!options.forceRemote;
    const cached = readCache();
    let current = cached;
    let source = cached ? "cache" : null;

    if (!current || forceRemote) {
      try {
        const bundled = await loadBundled();
        if (!current || isNewer(bundled, current)) {
          current = bundled;
          source = "local";
          writeCache(bundled, "local");
        }
      } catch (e) {
        if (!current) throw e;
      }
    }

    let update = null;
    try {
      const remote = await tryRemotes();
      if (remote && isNewer(remote.data, current)) {
        writeCache(remote.data, remote.url);
        current = remote.data;
        source = "remote";
        update = { applied: true, version: remote.data.version, url: remote.url };
      } else if (remote) {
        update = { applied: false, version: remote.data.version, url: remote.url };
      }
    } catch (_) {
      update = { applied: false, offline: true };
    }

    return {
      curriculum: current,
      source,
      meta: readMeta(),
      update,
    };
  }

  function applyToWindow(curriculum) {
    global.SPEAKDAY_DAYS = curriculum.days;
    global.SpeakDayData = {
      DAYS: curriculum.days,
      tips: curriculum.tips || [],
      missions: curriculum.missions || [],
      meetingMoves: curriculum.meetingMoves || [],
      version: curriculum.version,
      updatedAt: curriculum.updatedAt,
      getTodayKey(date = new Date()) {
        const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        return map[date.getDay()];
      },
      getDay(key) {
        return curriculum.days.find((d) => d.key === key);
      },
      getDialogue(day, slot) {
        return slot === "morning" ? day.morning : day.afternoon;
      },
    };
  }

  global.SpeakDayLoader = {
    loadCurriculum,
    applyToWindow,
    readMeta,
    REMOTE_URLS,
  };
})(window);
