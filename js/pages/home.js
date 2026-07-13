/* helper used by pages */
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

// register a minimal home page
const PAGE_HOME = (() => {
  Router.register('home', async () => {
    const el = document.getElementById('app-main');
    el.innerHTML = `
      <div class="page">
        <h1>Football Live Pro</h1>
        <p><a href="#/live">Live matches</a></p>
        <p><a href="#/matches">Matches (by date)</a></p>
        <p>Make sure to copy <code>js/config.example.js</code> to <code>js/config.js</code> and add your API key.</p>
      </div>
    `;
  });
  return null;
})();
