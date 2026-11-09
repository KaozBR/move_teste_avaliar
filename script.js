/* Move — funcionalidades interativas da página HOME. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const nav = $('#menu-principal');
  const toggle = $('.menu-toggle');
  const year = $('#ano-atual');
  const mapDialog = $('#mapa-dialog');

  if (year) year.textContent = String(new Date().getFullYear());

  function closeMenu(returnFocus = false) {
    if (!nav || !toggle) return;
    const wasOpen = nav.classList.contains('open');
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
    if (wasOpen && returnFocus) toggle.focus();
  }

  if (nav && toggle) {
    toggle.addEventListener('click', () => {
      const opening = !nav.classList.contains('open');
      nav.classList.toggle('open', opening);
      toggle.setAttribute('aria-expanded', String(opening));
      toggle.setAttribute('aria-label', opening ? 'Fechar menu' : 'Abrir menu');
    });
    nav.querySelectorAll('a').forEach((anchor) => anchor.addEventListener('click', () => closeMenu()));
    document.addEventListener('click', (event) => {
      if (!nav.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu(true);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 690) closeMenu();
    });
  }

  const openMap = $('#ampliar-mapa');
  if (mapDialog && openMap) {
    openMap.addEventListener('click', () => {
      if (!mapDialog.open) mapDialog.showModal();
    });
    ['#fechar-mapa', '#fechar-mapa-rodape'].forEach((selector) => {
      $(selector)?.addEventListener('click', () => mapDialog.close());
    });
    mapDialog.addEventListener('click', (event) => {
      if (event.target === mapDialog) mapDialog.close();
    });
    // ESC fecha naturalmente o elemento <dialog> do navegador.
  }
})();
