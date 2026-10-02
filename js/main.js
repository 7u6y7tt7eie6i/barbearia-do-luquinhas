(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var body = document.body;
  var header = document.querySelector('.header');
  var waFloat = document.querySelector('.wa-float');
  var mobileBar = document.querySelector('.mobile-bar');

  /* ---------- header + botão flutuante ao rolar ---------- */
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    waFloat.classList.toggle('is-visible', y > window.innerHeight * 0.6);
    if (mobileBar) mobileBar.classList.toggle('is-visible', y > window.innerHeight * 0.5);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- menu mobile ---------- */
  var toggle = document.querySelector('.menu-toggle');
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  toggle.addEventListener('click', function () {
    setMenu(!body.classList.contains('menu-open'));
  });
  document.querySelectorAll('.nav a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setMenu(false); closeLightbox(); }
  });

  /* ---------- animação de entrada ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el, i) {
      // pequeno escalonamento entre irmãos
      var siblings = el.parentElement.querySelectorAll(':scope > .reveal');
      var idx = Array.prototype.indexOf.call(siblings, el);
      el.style.transitionDelay = Math.min(idx, 6) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- link ativo no menu ---------- */
  var navLinks = document.querySelectorAll('.nav__list a');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- aberto / fechado (horário de Brasília) ---------- */
  // 0 = domingo ... 6 = sábado  →  [abre, fecha] em horas
  var HOURS = { 0: [8, 12], 1: [8, 19], 2: [8, 19], 3: [8, 19], 4: [8, 19], 5: [8, 19], 6: [8, 19] };
  var DAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  function nowInBrazil() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(map.weekday);
      return { day: day, time: (parseInt(map.hour, 10) % 24) + parseInt(map.minute, 10) / 60 };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), time: d.getHours() + d.getMinutes() / 60 };
    }
  }

  function updateStatus() {
    var now = nowInBrazil();
    var today = HOURS[now.day];
    var state, title, sub;

    if (now.time >= today[0] && now.time < today[1]) {
      state = 'open';
      title = 'Aberto agora';
      sub = 'Até as ' + today[1] + 'h · por ordem de chegada';
    } else if (now.time < today[0]) {
      state = 'closed';
      title = 'Fechado no momento';
      sub = 'Abrimos hoje às ' + today[0] + 'h';
    } else {
      var next = (now.day + 1) % 7;
      state = 'closed';
      title = 'Fechado no momento';
      sub = 'Abrimos amanhã (' + DAY_NAMES[next] + ') às ' + HOURS[next][0] + 'h';
    }

    document.querySelectorAll('[data-status]').forEach(function (el) {
      el.setAttribute('data-state', state);
      el.querySelector('[data-status-title]').textContent = title;
      el.querySelector('[data-status-sub]').textContent = (el.classList.contains('status-line') ? '· ' : '') + sub;
    });

    document.querySelectorAll('.hours tr').forEach(function (tr) {
      tr.classList.toggle('is-today', Number(tr.getAttribute('data-day')) === now.day);
    });
  }
  updateStatus();
  setInterval(updateStatus, 60 * 1000);

  /* ---------- galeria / lightbox ---------- */
  var lightbox = document.querySelector('.lightbox');
  var lbImg = lightbox.querySelector('img');
  var lastFocus = null;

  function openLightbox(src, alt) {
    lastFocus = document.activeElement;
    lbImg.src = src;
    lbImg.alt = alt || '';
    lightbox.hidden = false;
    body.style.overflow = 'hidden';
    lightbox.querySelector('.lightbox__close').focus();
  }
  function closeLightbox() {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('.shot').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openLightbox(btn.getAttribute('data-full'), btn.querySelector('img').alt);
    });
  });
  lightbox.addEventListener('click', function (e) {
    if (e.target !== lbImg) closeLightbox();
  });

  /* ---------- ano no rodapé ---------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
