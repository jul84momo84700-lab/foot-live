/*
 * js/api.js — API wrapper for Football Live Pro
 *
 * Responsibilities:
 *  - send requests to API-Football (or a proxy) with the correct headers
 *  - provide helpers used by pages (fetchFixtures, fetchLive, fetchTeam, ...)
 *  - simple client-side caching (memory + localStorage) to reduce API usage
 *  - expose a small public surface: api.fetchFixtures(...), api.getImage(url)
 */

const API = (() => {
  const CONFIG = window.APP_CONFIG || {};
  const API_BASE = CONFIG.API_BASE_URL || "https://v3.football.api-sports.io";
  const USE_PROXY = !!CONFIG.USE_PROXY;
  const API_KEY = CONFIG.API_KEY || null;

  // in-memory cache for the current page lifetime
  const memoryCache = new Map();

  // helper: stable cache key
  function cacheKey(path, params) {
    const p = Object.keys(params || {}).sort().map(k => `${k}=${params[k]}`).join("&");
    return `${path}?${p}`;
  }

  // localStorage cache with ttl (ms)
  function localGet(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (obj.expiry && Date.now() > obj.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return obj.value;
    } catch (e) {
      return null;
    }
  }
  function localSet(key, value, ttlMs) {
    try {
      const obj = { value, expiry: ttlMs ? Date.now() + ttlMs : null };
      localStorage.setItem(key, JSON.stringify(obj));
    } catch (e) {
      // ignore quota errors
    }
  }

  // core fetch wrapper
  async function apiFetch(path, params = {}, opts = {}) {
    const url = new URL((USE_PROXY ? API_BASE : API_BASE) + path);
    Object.keys(params || {}).forEach(k => url.searchParams.set(k, params[k]));

    // cache policy
    const cacheMs = opts.ttlMs || 0;
    const key = `api:${cacheKey(path, params)}`;

    // memory cache hit
    if (memoryCache.has(key)) return memoryCache.get(key);

    // localStorage hit
    const cached = cacheMs ? localGet(key) : null;
    if (cached) {
      memoryCache.set(key, cached);
      return cached;
    }

    const headers = new Headers();
    if (!USE_PROXY && API_KEY) headers.set("x-apisports-key", API_KEY);
    headers.set("Accept", "application/json");

    const controller = new AbortController();
    const signal = controller.signal;
    const timeout = opts.timeoutMs || 15000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url.toString(), { headers, signal, credentials: 'omit' });
      clearTimeout(timeoutId);
      if (!res.ok) {
        // if server responded with 4xx/5xx, try to parse json body for errors
        let bodyText = null;
        try { bodyText = await res.text(); } catch (e) {}
        const err = new Error(`HTTP ${res.status}` + (bodyText ? `: ${bodyText}` : ""));
        err.status = res.status;
        throw err;
      }
      const json = await res.json();
      // API-Football wraps data in `response` by default. Return full json for caller flexibility.
      if (cacheMs) localSet(key, json, cacheMs);
      memoryCache.set(key, json);
      return json;
    } catch (e) {
      // on network errors, attempt to return cached value if available
      if (cached) return cached;
      throw e;
    }
  }

  // convenience helpers for common endpoints
  async function fetchFixtures(params = {}) {
    // short TTL for live/fixtures to keep within free plan limits
    const ttlMs = params.live ? 20000 : (params.date ? 30000 : 20000);
    return apiFetch('/fixtures', params, { ttlMs, timeoutMs: 12000 });
  }

  async function fetchLive() {
    // live matches endpoint: ?live=all
    return fetchFixtures({ live: 'all' });
  }

  async function fetchTeams(params = {}) {
    return apiFetch('/teams', params, { ttlMs: 60 * 60 * 1000 });
  }

  async function fetchTeam(id) {
    return apiFetch('/teams', { id }, { ttlMs: 6 * 60 * 60 * 1000 });
  }

  async function fetchLeagues(params = {}) {
    return apiFetch('/leagues', params, { ttlMs: 6 * 60 * 60 * 1000 });
  }

  async function fetchStandings(params = {}) {
    return apiFetch('/standings', params, { ttlMs: 60 * 60 * 1000 });
  }

  async function fetchPlayers(params = {}) {
    return apiFetch('/players', params, { ttlMs: 6 * 60 * 60 * 1000 });
  }

  // utility: ensure an image URL is absolute and falls back to placeholder
  function imageUrl(src, type = 'team') {
    if (!src) return `icons/placeholder-${type}.png`;
    try {
      const u = new URL(src);
      return u.toString();
    } catch (e) {
      // relative or invalid -> return as-is or placeholder
      return src || `icons/placeholder-${type}.png`;
    }
  }

  return {
    fetchFixtures,
    fetchLive,
    fetchTeams,
    fetchTeam,
    fetchLeagues,
    fetchStandings,
    fetchPlayers,
    imageUrl,
    _internal: { apiFetch, memoryCache }
  };
})();

// expose for legacy pages that expect a global `api` variable
window.api = API;
