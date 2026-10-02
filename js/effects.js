/* =========================================================
   Barbearia do Luquinhas — efeitos ligados à rolagem
   01 cartões que empilham · 03 sequência quadro a quadro
   06 faixas que se montam · 07 linha do tempo que se desenha
   ========================================================= */
(function () {
  'use strict';

  var reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var limitar = function (v, min, max) { return Math.max(min, Math.min(max, v)); };
  var suavizar = function (t) { return 1 - Math.pow(1 - t, 3); };

  /* progresso de 0 a 1 de um elemento atravessando a área visível */
  function progressoNaTela(el) {
    var r = el.getBoundingClientRect();
    var alt = window.innerHeight || 800;
    return limitar((alt - r.top) / (alt + r.height), 0, 1);
  }

  /* um único laço de rolagem para todos os efeitos */
  var aoRolar = [];
  var agendado = false;
  function rodarTodos() { agendado = false; aoRolar.forEach(function (fn) { fn(); }); }
  function agendar() { if (!agendado) { agendado = true; requestAnimationFrame(rodarTodos); } }
  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar);

  /* laço contínuo que só roda enquanto o elemento está visível */
  function laco(el, passo) {
    var id = null, vivo = false;
    function rodar(t) { passo(t); id = requestAnimationFrame(rodar); }
    new IntersectionObserver(function (e) {
      if (e[0].isIntersecting && !vivo) { vivo = true; id = requestAnimationFrame(rodar); }
      else if (!e[0].isIntersecting && vivo) { vivo = false; cancelAnimationFrame(id); }
    }, { threshold: 0 }).observe(el);
  }

  function prepararCanvas(cv, w, h) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  /* =======================================================
     03 · LOGO EM SEQUÊNCIA QUADRO A QUADRO (topo)
     A rolagem do topo vira a linha do tempo: o logo gira como
     uma moeda, cercado por uma nuvem de pontos.
     ======================================================= */
  (function () {
    var box = document.querySelector('[data-logo3d]');
    if (!box) return;
    var img = box.querySelector('.logo3d__img');
    var cv = box.querySelector('.logo3d__canvas');
    var ctx, S = 0;
    var QUADROS = 120, N = 260, pontos = [];

    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2;
      var raio = Math.sqrt(1 - y * y);
      var t = i * 2.399963; /* ângulo de ouro */
      pontos.push({ x: Math.cos(t) * raio, y: y, z: Math.sin(t) * raio, claro: i % 3 === 0 });
    }

    function medir() {
      S = box.clientWidth;
      ctx = prepararCanvas(cv, S, S);
    }

    function desenhar(angLogo, angNuvem) {
      var c = S / 2, R = S * 0.46, r = S * 0.32;
      ctx.clearRect(0, 0, S, S);

      /* nuvem de pontos: inclinada e girando */
      var inc = 0.38, ci = Math.cos(inc), si = Math.sin(inc);
      var ca = Math.cos(angNuvem), sa = Math.sin(angNuvem);
      var proj = pontos.map(function (p) {
        var x = p.x * ca - p.z * sa;
        var z = p.x * sa + p.z * ca;
        var y2 = p.y * ci - z * si;
        var z2 = p.y * si + z * ci;
        return { x: x, y: y2, z: z2, claro: p.claro };
      }).sort(function (a, b) { return a.z - b.z; });

      function ponto(p, atenuar) {
        var esc = R * (1 + p.z * 0.12);
        var op = (0.12 + (p.z + 1) / 2 * 0.7) * atenuar;
        ctx.fillStyle = p.claro ? 'rgba(236,230,218,' + op.toFixed(3) + ')' : 'rgba(201,164,106,' + op.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(c + p.x * esc, c + p.y * esc, (0.8 + (p.z + 1) * 0.9) * (S / 520), 0, 6.284);
        ctx.fill();
      }

      proj.forEach(function (p) { if (p.z < 0) ponto(p, 1); });

      /* moeda: o logo gira em torno do eixo vertical */
      var cs = Math.cos(angLogo), sn = Math.sin(angLogo);
      var sx = Math.max(0.02, Math.abs(cs));
      var esp = S * 0.03 * sn; /* espessura visível da borda */

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.55)';
      ctx.shadowBlur = S * 0.08;
      ctx.shadowOffsetY = S * 0.04;
      /* borda metálica */
      var g = ctx.createLinearGradient(c - r, 0, c + r, 0);
      g.addColorStop(0, '#2b2926'); g.addColorStop(.5, '#8d877c'); g.addColorStop(1, '#2b2926');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(c - esp, c, r * sx + Math.abs(esp) * 0.2, r, 0, 0, 6.284);
      ctx.fill();
      ctx.restore();

      /* faixa lateral entre a borda e a face */
      ctx.fillStyle = '#4a4640';
      var passos = Math.ceil(Math.abs(esp));
      for (var k = 0; k < passos; k++) {
        ctx.beginPath();
        ctx.ellipse(c - esp + (esp / passos) * k, c, r * sx, r, 0, 0, 6.284);
        ctx.fill();
      }

      /* face: o logo original, sem alterações */
      ctx.save();
      ctx.translate(c, c);
      ctx.scale(sx, 1);
      ctx.drawImage(img, -r, -r, r * 2, r * 2);
      ctx.restore();

      /* reflexo que passa pela face */
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(c, c, r * sx, r, 0, 0, 6.284);
      ctx.clip();
      var faixa = c + sn * r * 1.4;
      var brilho = ctx.createLinearGradient(faixa - r * 0.5, c - r, faixa + r * 0.5, c + r);
      brilho.addColorStop(0, 'rgba(255,255,255,0)');
      brilho.addColorStop(.5, 'rgba(255,255,255,' + (0.06 + Math.abs(sn) * 0.14).toFixed(3) + ')');
      brilho.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = brilho;
      ctx.fillRect(c - r, c - r, r * 2, r * 2);
      ctx.restore();

      /* pontos da frente ficam mais discretos sobre o logo */
      proj.forEach(function (p) {
        if (p.z < 0) return;
        var esc = R * (1 + p.z * 0.12);
        var dx = (p.x * esc) / (r * sx), dy = (p.y * esc) / r;
        ponto(p, dx * dx + dy * dy < 1 ? 0.25 : 1);
      });
    }

    function iniciar() {
      medir();
      box.classList.add('is-ready');
      var anguloRolagem = 0;

      /* o logo fica de frente quando está no centro da tela e
         gira para um lado ou para o outro conforme sai dela */
      function calcularRolagem() {
        var r = box.getBoundingClientRect();
        var alt = window.innerHeight || 800;
        var centro = r.top + window.scrollY + r.height / 2;      /* posição na página */
        var frente = Math.max(alt / 2, centro);                   /* no celular: de frente ao abrir */
        var curso = window.innerWidth < 761 ? alt * 1.8 : alt * 0.9;   /* no celular gira mais devagar */
        var p = limitar((window.scrollY + alt / 2 - frente) / curso, -1, 1);
        var quadro = Math.round((p + 1) / 2 * (QUADROS - 1));   /* quadro a quadro */
        anguloRolagem = (quadro / (QUADROS - 1) - 0.5) * Math.PI * 2;
      }
      calcularRolagem();
      aoRolar.push(calcularRolagem);
      window.addEventListener('resize', function () { medir(); });

      if (reduzMovimento) {
        aoRolar.push(function () { desenhar(anguloRolagem, anguloRolagem * 0.6); });
        desenhar(anguloRolagem, 0);
        return;
      }
      laco(box, function (t) {
        var s = t / 1000;
        var balanco = Math.sin(s * 0.9) * 0.22 * (1 - Math.min(1, Math.abs(anguloRolagem) / Math.PI)); /* convida a rolar */
        desenhar(anguloRolagem + balanco, anguloRolagem * 0.6 + s * 0.15);
      });
    }

    if (img.complete && img.naturalWidth) iniciar();
    else img.addEventListener('load', iniciar);
  })();

  /* =======================================================
     01 · CARTÕES QUE EMPILHAM (serviços)
     ======================================================= */
  (function () {
    var cartoes = [].slice.call(document.querySelectorAll('.stack__card'));
    if (!cartoes.length || reduzMovimento) return;

    aoRolar.push(function () {
      var cobertura = cartoes.map(function (c, i) {
        var prox = cartoes[i + 1];
        if (!prox) return 0;
        var topo = parseFloat(getComputedStyle(c).top) || 0;
        var vao = c.offsetHeight + 20;
        return limitar(1 - (prox.getBoundingClientRect().top - topo) / vao, 0, 1);
      });
      cartoes.forEach(function (c, i) {
        var prof = 0;
        for (var j = i; j < cartoes.length - 1; j++) prof += cobertura[j];
        prof = Math.min(prof, 3);
        c.style.transform = 'translateY(' + (-prof * 8) + 'px) scale(' + (1 - prof * 0.04) + ')';
        c.style.filter = 'brightness(' + (1 - prof * 0.2) + ')';
      });
    });
  })();

  /* =======================================================
     06 · FAIXAS QUE SE MONTAM (fachada)
     ======================================================= */
  (function () {
    var foto = document.querySelector('[data-strips]');
    if (!foto) return;
    var caixa = foto.querySelector('.strips');
    var N = parseInt(foto.getAttribute('data-strips'), 10) || 7;

    if (reduzMovimento) {
      caixa.classList.add('is-static');
      foto.classList.add('is-built');
      return;
    }

    var tiras = [];
    for (var i = 0; i < N; i++) {
      var t = document.createElement('div');
      t.className = 'strip';
      caixa.appendChild(t);
      tiras.push(t);
    }

    function medir() {
      var w = caixa.clientWidth, h = caixa.clientHeight;
      var larg = w / N;
      tiras.forEach(function (t, i) {
        t.style.left = (i * larg) + 'px';
        t.style.width = Math.ceil(larg + 1) + 'px';
        t.style.backgroundSize = w + 'px ' + h + 'px';
        t.style.backgroundPosition = (-i * larg) + 'px 0';
      });
    }
    medir();
    window.addEventListener('resize', medir);

    aoRolar.push(function () {
      var q = limitar(progressoNaTela(foto) / 0.45, 0, 1);
      tiras.forEach(function (t, i) {
        var atraso = i * 0.05;
        var f = suavizar(limitar((q - atraso) / (1 - (N - 1) * 0.05), 0, 1));
        var sentido = i % 2 ? 1 : -1;
        t.style.transform = 'translateY(' + (sentido * (1 - f) * 110) + '%)';
        t.style.opacity = (0.25 + f * 0.75).toFixed(3);
      });
      foto.classList.toggle('is-built', q >= 0.98);
    });
  })();

  /* =======================================================
     02 · GALERIA HORIZONTAL (serviços) e
     07 · LINHA DO TEMPO QUE SE DESENHA na horizontal (como funciona)
     A seção fica presa na tela e a rolagem vertical empurra
     os cartões para o lado; a linha (se houver) cresce e
     cada cartão acende quando chega a vez dele.
     ======================================================= */
  [].forEach.call(document.querySelectorAll('[data-hscroll]'), function (secao) {
    var trilha = secao.querySelector('.htrack');
    var linha = secao.querySelector('.htrack__line');
    var cheio = secao.querySelector('.htrack__fill');
    var itens = [].slice.call(trilha.querySelectorAll(':scope > li:not(.htrack__line)'));
    var barra = secao.querySelector('.hprogress__fill');
    var distancia = 0;

    if (reduzMovimento) {
      secao.classList.add('is-static');
      itens.forEach(function (e) { e.classList.add('is-lit'); });
      if (cheio) cheio.style.width = '100%';
      return;
    }

    function medir() {
      if (linha) {
        /* a linha vai do ponto do primeiro cartão ao do último */
        var pontoX = function (e) { var d = e.querySelector('.hstep__dot'); return e.offsetLeft + d.offsetLeft + d.offsetWidth / 2; };
        var ini = pontoX(itens[0]), fim = pontoX(itens[itens.length - 1]);
        linha.style.left = ini + 'px';
        linha.style.width = (fim - ini) + 'px';
      }
      distancia = Math.max(0, trilha.scrollWidth - document.documentElement.clientWidth);
      secao.style.height = (window.innerHeight + distancia + window.innerHeight * 0.3) + 'px';
    }
    medir();
    window.addEventListener('resize', medir);
    window.addEventListener('load', medir);

    aoRolar.push(function () {
      var r = secao.getBoundingClientRect();
      var total = secao.offsetHeight - window.innerHeight;
      var p = limitar(-r.top / total, 0, 1);
      trilha.style.transform = 'translate3d(' + (-p * distancia) + 'px,0,0)';
      if (cheio) cheio.style.width = (p * 100) + '%';
      if (barra) barra.style.transform = 'scaleX(' + p + ')';
      var ativa = r.top < window.innerHeight * 0.5;
      itens.forEach(function (e, i) {
        e.classList.toggle('is-lit', ativa && p >= i / (itens.length - 1) - 0.04);
      });
    });
  });

  /* =======================================================
     03 · POSTE DE BARBEIRO EM PONTOS (como funciona)
     Mesma técnica quadro a quadro, girando um poste 3D.
     ======================================================= */
  (function () {
    var cv = document.querySelector('.pole3d');
    if (!cv) return;
    var secao = cv.closest('.steps');
    var ctx, W, H, QUADROS = 90, pontos = [];
    var CORES = [[200, 53, 46], [236, 230, 218], [45, 90, 168], [236, 230, 218]];

    /* corpo listrado */
    var aneis = 46, volta = 34;
    for (var a = 0; a < aneis; a++) {
      var y = -1 + (a / (aneis - 1)) * 2;
      for (var b = 0; b < volta; b++) {
        var th = (b / volta) * Math.PI * 2;
        var faixa = (((th / (Math.PI * 2)) + (y + 1) * 1.5) % 1 + 1) % 1;
        pontos.push({ x: Math.cos(th), y: y * 2.6, z: Math.sin(th), cor: CORES[Math.floor(faixa * 4)], tam: 1 });
      }
    }
    /* tampas e bola do topo */
    [-2.9, 2.9].forEach(function (yy) {
      for (var k = 0; k < 2; k++) {
        for (var b2 = 0; b2 < 34; b2++) {
          var t2 = (b2 / 34) * Math.PI * 2;
          pontos.push({ x: Math.cos(t2) * 1.22, y: yy + k * (yy < 0 ? -0.18 : 0.18), z: Math.sin(t2) * 1.22, cor: [154, 147, 135], tam: 1.1 });
        }
      }
    });
    for (var s = 0; s < 70; s++) {
      var yb = 1 - (s / 69) * 2, rb = Math.sqrt(1 - yb * yb), tb = s * 2.399963;
      pontos.push({ x: Math.cos(tb) * rb * 0.55, y: -3.6 + yb * 0.55, z: Math.sin(tb) * rb * 0.55, cor: [236, 230, 218], tam: 1 });
    }

    function medir() {
      W = cv.clientWidth; H = cv.clientHeight;
      ctx = prepararCanvas(cv, W, H);
    }

    function desenhar(ang) {
      ctx.clearRect(0, 0, W, H);
      var esc = W * 0.16, cx = W / 2, cy = H / 2 + H * 0.04;
      var inc = 0.2, ci = Math.cos(inc), si = Math.sin(inc);
      var ca = Math.cos(ang), sa = Math.sin(ang);
      pontos.map(function (p) {
        var x = p.x * ca - p.z * sa;
        var z = p.x * sa + p.z * ca;
        return { x: x, y: p.y * ci - z * si * 0.3, z: z, cor: p.cor, tam: p.tam };
      }).sort(function (a, b) { return a.z - b.z; })
        .forEach(function (p) {
          var per = 1 + p.z * 0.06;
          var op = 0.18 + (p.z + 1.2) / 2.4 * 0.82;
          ctx.fillStyle = 'rgba(' + p.cor[0] + ',' + p.cor[1] + ',' + p.cor[2] + ',' + limitar(op, 0, 1).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(cx + p.x * esc * per, cy + p.y * esc * per, (0.8 + (p.z + 1) * 0.75) * p.tam * Math.max(0.62, W / 320), 0, 6.284);
          ctx.fill();
        });
    }

    medir();
    var ultimo = -1;
    function atualizar(forcar) {
      var p = progressoNaTela(secao);
      var quadro = Math.round(p * (QUADROS - 1));
      if (quadro === ultimo && !forcar) return;
      ultimo = quadro;
      desenhar((quadro / QUADROS) * Math.PI * 3);
    }
    window.addEventListener('resize', function () { medir(); atualizar(true); });
    aoRolar.push(atualizar);
    atualizar(true);
  })();

  rodarTodos();
})();
