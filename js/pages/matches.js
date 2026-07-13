// Minimal matches page: show today's matches
const PAGE_MATCHES = (() => {
  Router.register('matches', async () => {
    const el = document.getElementById('app-main');
    el.innerHTML = `<div class="page"><h2>Matches (today)</h2><div id="matches-list">Loading…</div></div>`;
    try {
      const today = new Date().toISOString().slice(0,10);
      const json = await window.api.fetchFixtures({ date: today });
      const matches = json.response || [];
      const listEl = document.getElementById('matches-list');
      if (!matches.length) { listEl.innerHTML = '<p>No matches for today.</p>'; return; }
      listEl.innerHTML = matches.map(m => renderMatchItem(m)).join('');
    } catch (e) {
      console.error('fetchFixtures error', e);
      document.getElementById('matches-list').innerHTML = `<p>Error loading matches: ${escapeHtml(e.message)}</p>`;
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
    const time = match.fixture?.date ? new Date(match.fixture.date).toLocaleTimeString() : '';
    return `
      <div class="match-item" data-id="${fixtureId}" style="display:flex;align-items:center;gap:12px;padding:8px;border-bottom:1px solid #222">
        <div style="display:flex;align-items:center;gap:8px;min-width:160px">
          <img src="${homeLogo}" alt="${escapeHtml(home.name)}" style="width:28px;height:28px;object-fit:contain" onerror="this.src='icons/placeholder-team.svg'">
          <div>${escapeHtml(home.name)}</div>
        </div>
        <div style="flex:1;text-align:center">${time} — ${homeGoals} : ${awayGoals}</div>
        <div style="display:flex;align-items:center;gap:8px;min-width:160px;justify-content:flex-end">
          <div style="text-align:right">${escapeHtml(away.name)}</div>
          <img src="${awayLogo}" alt="${escapeHtml(away.name)}" style="width:28px;height:28px;object-fit:contain" onerror="this.src='icons/placeholder-team.svg'">
        </div>
      </div>
    `;
  }

  return null;
})();
