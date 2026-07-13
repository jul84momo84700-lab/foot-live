// Minimal live page: fetch live matches and render simple list
const PAGE_LIVE = (() => {
  Router.register('live', async () => {
    const el = document.getElementById('app-main');
    el.innerHTML = `<div class="page"><h2>Live matches</h2><div id="live-list">Loading…</div></div>`;
    try {
      const json = await window.api.fetchLive();
      const matches = json.response || [];
      const listEl = document.getElementById('live-list');
      if (!matches.length) { listEl.innerHTML = '<p>No live matches right now.</p>'; return; }
      listEl.innerHTML = matches.map(m => renderMatchItem(m)).join('');
    } catch (e) {
      console.error('fetchLive error', e);
      document.getElementById('live-list').innerHTML = `<p>Error loading live matches: ${escapeHtml(e.message)}</p>`;
    }
  });

  function renderMatchItem(match){
    const home = match.teams?.home || {};
    const away = match.teams?.away || {};
    const homeLogo = window.api.imageUrl(home.logo, 'team');
    const awayLogo = window.api.imageUrl(away.logo, 'team');
    const fixtureId = match.fixture?.id || '';
    const homeGoals = match.goals?.home ?? '-';
    const awayGoals = match.goals?.away ?? '-';
    return `
      <div class="match-item" data-id="${fixtureId}" style="display:flex;align-items:center;gap:12px;padding:8px;border-bottom:1px solid #222">
        <div style="display:flex;align-items:center;gap:8px;min-width:180px">
          <img src="${homeLogo}" alt="${escapeHtml(home.name)}" style="width:36px;height:36px;object-fit:contain" onerror="this.src='icons/placeholder-team.svg'">
          <div>${escapeHtml(home.name)}</div>
        </div>
        <div style="flex:1;text-align:center;font-weight:600">${homeGoals} — ${awayGoals}</div>
        <div style="display:flex;align-items:center;gap:8px;min-width:180px;justify-content:flex-end">
          <div style="text-align:right">${escapeHtml(away.name)}</div>
          <img src="${awayLogo}" alt="${escapeHtml(away.name)}" style="width:36px;height:36px;object-fit:contain" onerror="this.src='icons/placeholder-team.svg'">
        </div>
      </div>
    `;
  }

  return null;
})();
