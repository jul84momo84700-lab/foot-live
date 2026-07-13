// Simple hash router used by the minimal pages
const Router = (() => {
  const routes = new Map();
  let current = '';

  function register(name, renderFn) {
    routes.set(name, renderFn);
  }

  async function renderRoute(name) {
    const fn = routes.get(name);
    if (!fn) {
      document.getElementById('app-main').innerHTML = `<div class="page"><h2>Page not found: ${name}</h2></div>`;
      return;
    }
    try {
      document.getElementById('splash')?.classList?.add('hidden');
      await fn();
    } catch (e) {
      console.error('route render error', e);
      document.getElementById('app-main').innerHTML = `<div class="page"><h2>Error loading page</h2><pre>${e.message}</pre></div>`;
    }
  }

  function onHashChange() {
    const hash = location.hash.replace(/^#\/?/, '');
    const name = hash.split('/')[0] || 'home';
    current = name;
    renderRoute(name);
  }

  function init() {
    window.addEventListener('hashchange', onHashChange);
    // initial
    onHashChange();
  }

  return { register, init, _routes: routes };
})();

window.Router = Router;
