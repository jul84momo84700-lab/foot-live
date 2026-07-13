// Minimal app bootstrap
window.addEventListener('load', () => {
  // init router (pages register themselves on load before this usually)
  try { Router.init(); } catch (e) { console.warn('Router not ready', e); }

  // install button handling stub (PWA install flow handled elsewhere)
  const installBtn = document.getElementById('installBtn');
  if (installBtn) installBtn.addEventListener('click', () => alert('Install flow not implemented in this minimal build'));
});
