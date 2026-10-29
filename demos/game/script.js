(function () {
  var root = document.getElementById('bdRoot');
  if (!root || root.dataset.bdInit) return;
  root.dataset.bdInit = '1';
  var app = root.closest('.blobdrop-app') || root;
  if (app.parentNode !== document.body) document.body.appendChild(app);

  var darkMq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function applyTheme() {
    var cl = document.documentElement.classList;
    var dark = cl.contains('dark') || (!cl.contains('light') && !!(darkMq && darkMq.matches));
    app.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
  applyTheme();
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  if (darkMq && darkMq.addEventListener) darkMq.addEventListener('change', applyTheme);

  function closeIntro() {
    var m = document.getElementById('bdIntroModal');
    if (m) m.classList.remove('is-open');
  }
  document.getElementById('bdIntroPlay').addEventListener('click', function () {
    closeIntro();
    try { document.activeElement && document.activeElement.blur(); } catch (e) {}
  });
  setTimeout(function () { try { document.getElementById('bdIntroPlay').focus({ preventScroll: true }); } catch (e) {} }, 30);

  var MATTER_SRC = 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/build/matter.min.js';
  var FONT_HREF = 'https://fonts.googleapis.com/css2?family=Rubik:wght@500;700;800;900&display=swap';

  if (!document.querySelector('link[data-bd-font]')) {
    var fl = document.createElement('link');
    fl.rel = 'stylesheet'; fl.href = FONT_HREF; fl.setAttribute('data-bd-font', '1');
    document.head.appendChild(fl);
  }

  function loadMatter(cb, fail) {
    if (window.Matter) return cb();
    var s = document.createElement('script');
    s.src = MATTER_SRC; s.async = true;
    s.onload = function () { window.Matter ? cb() : fail(); };
    s.onerror = fail;
    document.head.appendChild(s);
  }

  loadMatter(start, function () {
    var l = document.getElementById('bdLoading');
    l.textContent = 'Не удалось загрузить физику игры. Проверьте сеть и обновите страницу.';
    l.classList.add('is-error');
  });

  function start() {
  var Engine = Matter.Engine, Bodies = Matter.Bodies, Body = Matter.Body, Composite = Matter.Composite, Events = Matter.Events;

  var WALL = 18, INNER = 400, W = INNER + WALL * 2, JAR_TOP = 92, FLOOR_Y = 560, H = FLOOR_Y + WALL + 4;
  var DANGER_Y = JAR_TOP + 46, DROP_Y = 44, EPOCH = Date.UTC(2026, 8, 15), INK = '#33211a';

  var TIERS = [
    { r: 19, c: '#f06aa0', tex: 'dots' },
    { r: 25, c: '#ef7d25', tex: 'stripes' },
    { r: 32, c: '#f2c320', tex: 'rings' },
    { r: 40, c: '#79bd3a', tex: 'dots' },
    { r: 50, c: '#1e9e98', tex: 'stripes' },
    { r: 61, c: '#2f7fe0', tex: 'rings' },
    { r: 73, c: '#8a5cf0', tex: 'dots' },
    { r: 86, c: '#c63fc9', tex: 'stripes' },
    { r: 101, c: '#e53b3b', tex: 'rings' },
    { r: 118, c: '#f5c832', tex: 'star' }
  ];
  var MAX_TIER = TIERS.length - 1, SPAWN_MAX = 4, RAINBOW = -1, RAINBOW_R = 25;
  var POWERS = { shake: 6, pop: 12, sweep: 16, rainbow: 20 };
  var POWER_KEYS = ['shake', 'pop', 'sweep', 'rainbow'];
  var VERTS = 30;

  function $(id) { return document.getElementById(id); }
  var canvas = $('bdGame'), ctx = canvas.getContext('2d'), jarWrap = $('bdJar');

  var engine, world, blobs = [], particles = [], score = 0, best = 0, current = 0, next = 0, aimX = W / 2;
  var canDrop = true, dropTimer = 0, gameOver = false, dangerTime = 0, settling = false;
  var scale = 1, dpr = 1, lastT = 0, idSeq = 0, rngState = 0, charges = { shake: 0, pop: 0, sweep: 0, rainbow: 0 };
  var armed = null, undoSnap = null, shakeT = 0, merges = 0, keyDir = 0, visible = true;
  var theme = { jar: '#faf1dc', guide: 'rgba(150,135,115,0.55)' };

  function store(key, fallback) { try { var v = localStorage.getItem('blobdrop.' + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } }
  function save(key, v) { try { localStorage.setItem('blobdrop.' + key, JSON.stringify(v)); } catch (e) {} }
  function drop_(key) { try { localStorage.removeItem('blobdrop.' + key); } catch (e) {} }

  var dayNo = Math.max(1, Math.floor((Date.now() - EPOCH) / 86400000) + 1);
  $('bdDay').textContent = 'Банка дня №' + dayNo;

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  function readTheme() {
    applyTheme();
    var cs = getComputedStyle(app);
    theme.jar = cs.getPropertyValue('--bd-jar').trim() || '#faf1dc';
    theme.guide = cs.getPropertyValue('--bd-guide').trim() || 'rgba(150,135,115,0.55)';
  }

  function mulberry() {
    rngState = (rngState + 0x6D2B79F5) | 0;
    var t = rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function randTier() {
    var w = [32, 27, 20, 13, 8], s = mulberry() * 100, i = 0;
    while (i < SPAWN_MAX && s > w[i]) { s -= w[i]; i++; }
    return i;
  }
  function seededRng(seed) {
    var st = seed | 0;
    return function () {
      st = (st + 0x6D2B79F5) | 0;
      var t = st;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }

  function radiusOf(tier) { return tier === RAINBOW ? RAINBOW_R : TIERS[tier].r; }
  function clampX(x, r) { return Math.max(WALL + r + 1, Math.min(W - WALL - r - 1, x)); }

  function makeBlob(tier, x, y, angle) {
    var R = radiusOf(tier);
    var body = Bodies.circle(x, y, R, {
      restitution: 0.12, friction: 0.1, frictionStatic: 0.5, frictionAir: 0.006,
      density: 0.0012, slop: 0.03, label: 'blob', angle: angle || 0
    });
    var blob = {
      id: ++idSeq, tier: tier, body: body, born: performance.now(),
      rad: new Float32Array(VERTS).fill(R), vel: new Float32Array(VERTS),
      grow: 1, merged: false, blinkAt: performance.now() + 1500 + Math.random() * 5000
    };
    body.plugin.blob = blob;
    blobs.push(blob);
    Composite.add(world, body);
    return blob;
  }

  function removeBlob(b) {
    b.merged = true;
    Composite.remove(world, b.body);
    var i = blobs.indexOf(b);
    if (i >= 0) blobs.splice(i, 1);
  }

  function burst(x, y, color, n, spd) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = spd * (0.4 + Math.random());
      particles.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, life: 1, r: 3 + Math.random() * 5, c: color });
    }
  }

  function setScore(v) {
    score = v;
    var el = $('bdScore');
    el.textContent = score;
    el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump');
    if (score > best) { best = score; save('best', best); }
    $('bdBest').textContent = 'РЕКОРД ' + best;
    updateRank();
  }

  function chargeAll() {
    merges++;
    for (var k in charges) charges[k] = Math.min(POWERS[k], charges[k] + 1);
    renderPowers();
  }

  function merge(a, b) {
    if (a.merged || b.merged) return;
    var tier = a.tier === RAINBOW ? b.tier : a.tier;
    if (tier === RAINBOW) tier = 0;
    var x = (a.body.position.x + b.body.position.x) / 2;
    var y = (a.body.position.y + b.body.position.y) / 2;
    var vx = (a.body.velocity.x + b.body.velocity.x) / 2;
    removeBlob(a); removeBlob(b);
    setScore(score + ((tier + 1) * (tier + 2)) / 2);
    chargeAll();
    burst(x, y, TIERS[tier].c, 10 + tier * 2, 2 + tier * 0.3);
    if (tier === MAX_TIER) {
      setScore(score + 100);
      burst(x, y, '#ffffff', 50, 7);
      return;
    }
    var nb = makeBlob(tier + 1, x, y);
    nb.grow = 0.6;
    Body.setVelocity(nb.body, { x: vx * 0.4, y: -1.5 });
  }

  function onCollide(e) {
    if (settling) return;
    for (var i = 0; i < e.pairs.length; i++) {
      var p = e.pairs[i], a = p.bodyA.plugin.blob, b = p.bodyB.plugin.blob;
      if (!a || !b || a.merged || b.merged) continue;
      if (a.tier === b.tier && a.tier !== RAINBOW) merge(a, b);
      else if ((a.tier === RAINBOW) !== (b.tier === RAINBOW)) merge(a, b);
    }
  }

  function newWorld() {
    engine = Engine.create({ positionIterations: 10, velocityIterations: 8 });
    engine.gravity.y = 1.2;
    world = engine.world;
    var opts = { isStatic: true, friction: 0.2, restitution: 0.05, label: 'wall' };
    Composite.add(world, [
      Bodies.rectangle(W / 2, FLOOR_Y + 50, W + 200, 100, opts),
      Bodies.rectangle(WALL - 50, H / 2 - 400, 100, H * 3, opts),
      Bodies.rectangle(W - WALL + 50, H / 2 - 400, 100, H * 3, opts)
    ]);
    Events.on(engine, 'collisionStart', onCollide);
    Events.on(engine, 'collisionActive', onCollide);
    blobs = [];
  }

  function touching(a, b) {
    var dx = a.body.position.x - b.body.position.x, dy = a.body.position.y - b.body.position.y;
    var rr = radiusOf(a.tier) + radiusOf(b.tier) + 3;
    return dx * dx + dy * dy < rr * rr;
  }

  function settle(steps) { for (var i = 0; i < steps; i++) Engine.update(engine, 1000 / 60); }

  function seedStart() {
    var r = seededRng(dayNo * 104729 + 777);
    var count = 6 + Math.floor(r() * 3), tiers = [], i, j;
    for (i = 0; i < count; i++) {
      var t;
      do { t = Math.floor(r() * 4); } while (i > 0 && t === tiers[i - 1]);
      tiers.push(t);
    }
    var specs = tiers.map(function (t, i) { return { tier: t, x: WALL + 30 + r() * (INNER - 60), y: FLOOR_Y - 60 - i * 55 }; });
    settling = true;
    for (var pass = 0; pass < 8; pass++) {
      newWorld();
      specs.forEach(function (sp) { makeBlob(sp.tier, clampX(sp.x, radiusOf(sp.tier)), sp.y); });
      settle(420);
      var bad = -1;
      for (i = 0; i < blobs.length && bad < 0; i++) {
        for (j = i + 1; j < blobs.length; j++) {
          if (blobs[i].tier === blobs[j].tier && touching(blobs[i], blobs[j])) { bad = j; break; }
        }
      }
      if (bad < 0) break;
      var badBlob = blobs[bad];
      var used = blobs.filter(function (o) { return o !== badBlob && touching(o, badBlob); }).map(function (o) { return o.tier; });
      var free = [0, 1, 2, 3].filter(function (t) { return used.indexOf(t) < 0 && t !== badBlob.tier; });
      if (free.length) specs[bad].tier = free[Math.floor(r() * free.length)];
      else specs.splice(bad, 1);
      if (pass === 7) {
        newWorld(); specs = specs.slice(0, 6);
        specs.forEach(function (sp) { makeBlob(sp.tier, clampX(sp.x, radiusOf(sp.tier)), sp.y); });
        settle(420);
      }
    }
    settling = false;
    var old = performance.now() - 10000;
    blobs.forEach(function (b) {
      Body.setVelocity(b.body, { x: 0, y: 0 });
      Body.setAngularVelocity(b.body, 0);
      b.born = old;
    });
  }

  function renderPlays() {
    var plays = store('plays', 0);
    $('bdPlays').textContent = plays.toLocaleString('ru-RU') + ' ' + plural(plays, 'ИГРА', 'ИГРЫ', 'ИГР');
  }

  function reset() {
    seedStart();
    particles = [];
    rngState = dayNo * 7919 + 12345;
    score = 0; merges = 0;
    best = store('best', 0);
    current = randTier(); next = randTier();
    canDrop = true; dropTimer = 0; gameOver = false; dangerTime = 0;
    charges = { shake: 0, pop: 0, sweep: 0, rainbow: 0 };
    armed = null; undoSnap = null;
    aimX = W / 2;
    save('plays', store('plays', 0) + 1);
    renderPlays();
    setScore(0);
    renderPowers(); renderNext(); renderOrder();
    $('bdUndo').disabled = true;
    drop_('game');
    closeModals();
  }

  function snapshot() {
    return {
      blobs: blobs.map(function (b) { return { tier: b.tier, x: b.body.position.x, y: b.body.position.y, a: b.body.angle }; }),
      score: score, current: current, next: next, rngState: rngState, merges: merges, charges: Object.assign({}, charges)
    };
  }

  function restore(s) {
    newWorld();
    s.blobs.forEach(function (b) { makeBlob(b.tier, b.x, b.y, b.a); });
    var old = performance.now() - 10000;
    blobs.forEach(function (b) { b.born = old; });
    current = s.current; next = s.next; rngState = s.rngState; merges = s.merges; charges = Object.assign({}, s.charges);
    armed = null; dangerTime = 0; canDrop = true; particles = []; gameOver = false;
    setScore(s.score);
    renderPowers(); renderNext(); renderOrder();
  }

  function undo() {
    if (!undoSnap || gameOver) return;
    var s = undoSnap; undoSnap = null;
    restore(s);
    $('bdUndo').disabled = true;
  }

  function persist() {
    if (gameOver || !engine) { drop_('game'); return; }
    var s = snapshot();
    s.day = dayNo;
    save('game', s);
  }

  function resume() {
    var s = store('game', null);
    if (!s || s.day !== dayNo || !Array.isArray(s.blobs) || typeof s.score !== 'number') return false;
    best = store('best', 0);
    restore(s);
    renderPlays();
    $('bdUndo').disabled = true;
    return true;
  }

  function drop() {
    if (!canDrop || gameOver || anyModalOpen()) return;
    undoSnap = snapshot();
    $('bdUndo').disabled = false;
    var tier = armed === 'rainbow' ? RAINBOW : current;
    var b = makeBlob(tier, clampX(aimX, radiusOf(tier)), DROP_Y);
    Body.setVelocity(b.body, { x: 0, y: 2 });
    if (armed === 'rainbow') { armed = null; charges.rainbow = 0; renderPowers(); }
    else {
      current = next; next = randTier(); renderNext(); renderOrder();
      var nx = document.querySelector('.blobdrop__next');
      nx.classList.remove('is-swap'); void nx.offsetWidth; nx.classList.add('is-swap');
    }
    canDrop = false; dropTimer = 0.55;
  }

  function usePower(k) {
    if (gameOver || charges[k] < POWERS[k]) return;
    if (k === 'shake') {
      blobs.forEach(function (b) { Body.setVelocity(b.body, { x: (Math.random() - 0.5) * 7, y: -5 - Math.random() * 7 }); b.born = performance.now(); });
      shakeT = 0.5; charges.shake = 0; dangerTime = 0;
    } else if (k === 'sweep') {
      blobs.filter(function (b) { return b.tier === 0 || b.tier === 1; }).forEach(function (b) {
        burst(b.body.position.x, b.body.position.y, TIERS[b.tier].c, 8, 3); removeBlob(b);
      });
      charges.sweep = 0;
    } else {
      armed = armed === k ? null : k;
    }
    renderPowers();
    renderOrder();
  }

  function popAt(x, y) {
    var hit = null;
    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i], dx = b.body.position.x - x, dy = b.body.position.y - y;
      if (dx * dx + dy * dy <= Math.pow(radiusOf(b.tier), 2)) { hit = b; break; }
    }
    if (!hit) return false;
    burst(hit.body.position.x, hit.body.position.y, hit.tier === RAINBOW ? '#fff' : TIERS[hit.tier].c, 20, 4);
    removeBlob(hit);
    charges.pop = 0; armed = null;
    renderPowers();
    return true;
  }

  function popNearestToAim() {
    var hit = null, bd = Infinity;
    blobs.forEach(function (b) { var d = Math.abs(b.body.position.x - aimX); if (d < bd) { bd = d; hit = b; } });
    if (hit) popAt(hit.body.position.x, hit.body.position.y);
  }

  function renderPowers() {
    document.querySelectorAll('.blobdrop__power').forEach(function (el) {
      var k = el.dataset.power, ready = charges[k] >= POWERS[k];
      el.classList.toggle('is-ready', ready);
      el.classList.toggle('is-armed', armed === k);
      el.style.setProperty('--fill', String(Math.min(1, charges[k] / POWERS[k])));
      el.setAttribute('aria-pressed', armed === k ? 'true' : 'false');
      el.querySelector('.blobdrop__power-count').textContent = ready
        ? (armed === k ? (k === 'pop' ? 'НАЖМИТЕ КАПЛЮ' : 'ВКЛЮЧЕНО') : 'ГОТОВО!')
        : charges[k] + '/' + POWERS[k];
    });
    renderNext();
  }

  function topScores() {
    return store('top', []).map(function (s) { return typeof s === 'number' ? { s: s, d: null } : s; }).filter(function (s) { return s && typeof s.s === 'number'; });
  }

  function updateRank() {
    var top = topScores().map(function (t) { return t.s; });
    var better = top.filter(function (s) { return s > score; });
    $('bdRankPos').textContent = '#' + (better.length + 1);
    var above = better.sort(function (a, b) { return a - b; })[0];
    $('bdRankGap').textContent = above != null ? '+' + (above - score + 1) + ' ДО #' + better.length : 'ЛУЧШИЙ РЕЗУЛЬТАТ';
  }

  function endGame() {
    gameOver = true;
    var top = topScores();
    var prevBest = top.length ? Math.max.apply(null, top.map(function (t) { return t.s; })) : 0;
    top.push({ s: score, d: Date.now() });
    top.sort(function (a, b) { return b.s - a.s; });
    save('top', top.slice(0, 10));
    drop_('game');
    $('bdOverScore').textContent = score;
    $('bdOverBest').textContent = 'РЕКОРД ' + best;
    $('bdOverNew').classList.toggle('is-on', score > prevBest && score > 0);
    openModal('bdOverModal');
    $('bdUndo').disabled = true;
  }

  var lastFocus = null;
  function openModal(id) {
    lastFocus = document.activeElement;
    var m = $(id);
    m.classList.add('is-open');
    var btn = m.querySelector('button');
    if (btn) setTimeout(function () { btn.focus({ preventScroll: true }); }, 30);
  }
  function anyModalOpen() { return !!document.querySelector('.blobdrop-modal.is-open'); }
  function closeModals(withIntro) {
    document.querySelectorAll('.blobdrop-modal').forEach(function (m) {
      if (m.id === 'bdIntroModal' && !withIntro) return;
      if (m.id !== 'bdOverModal' || !gameOver) m.classList.remove('is-open');
    });
    if (lastFocus && lastFocus.focus && !anyModalOpen()) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} lastFocus = null; }
  }

  function fitColumns() {
    var cols = [$('bdLeft'), $('bdRight')];
    if (window.innerWidth <= 700) { cols.forEach(function (c) { c.style.zoom = ''; }); return; }
    cols.forEach(function (c) { c.style.zoom = '1'; });
    var board = $('bdBoard'), cs = getComputedStyle(board);
    var availH = board.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var availW = board.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var sideW = cols[0].offsetWidth + cols[1].offsetWidth;
    var needH = Math.max(cols[0].offsetHeight, cols[1].offsetHeight) + 8;
    var z = Math.max(0.4, Math.min(1, availH / needH, (availW * 0.52) / sideW));
    cols.forEach(function (c) { c.style.zoom = String(z); });
  }

  function fit() {
    fitColumns();
    var rect = jarWrap.getBoundingClientRect();
    scale = Math.max(0.1, Math.min(rect.width / W, rect.height / H));
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.style.width = (W * scale) + 'px';
    canvas.style.height = (H * scale) + 'px';
    canvas.width = Math.round(W * scale * dpr);
    canvas.height = Math.round(H * scale * dpr);
  }

  function toWorld(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  }

  canvas.addEventListener('pointermove', function (e) { aimX = toWorld(e).x; });
  canvas.addEventListener('pointerdown', function (e) {
    var p = toWorld(e);
    aimX = p.x;
    if (armed === 'pop') { popAt(p.x, p.y); e.preventDefault(); return; }
    if (e.pointerType === 'mouse') { if (e.button === 0) drop(); }
    else { e.preventDefault(); try { canvas.setPointerCapture(e.pointerId); } catch (er) {} }
  });
  canvas.addEventListener('pointerup', function (e) {
    if (e.pointerType === 'mouse' || armed === 'pop') return;
    aimX = toWorld(e).x; drop();
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function typingTarget(t) {
    return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  }
  function gameInView() {
    var r = $('bdBoard').getBoundingClientRect();
    return r.bottom > 80 && r.top < window.innerHeight - 80;
  }

  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || typingTarget(e.target)) return;
    if (e.key === 'Escape') {
      if (anyModalOpen()) closeModals(true);
      else if (armed) { armed = null; renderPowers(); renderOrder(); }
      return;
    }
    if ($('bdIntroModal').classList.contains('is-open')) {
      if (e.key === 'Enter' && !(e.target && e.target.id === 'bdIntroBack')) { e.preventDefault(); $('bdIntroPlay').click(); }
      return;
    }
    if (anyModalOpen()) {
      if (gameOver && (e.key === 'Enter' || e.code === 'KeyR') && $('bdOverModal').classList.contains('is-open')) { e.preventDefault(); reset(); }
      return;
    }
    if (!gameInView()) return;
    var code = e.code, handled = true;
    if (code === 'ArrowLeft' || code === 'KeyA') keyDir = -1;
    else if (code === 'ArrowRight' || code === 'KeyD') keyDir = 1;
    else if (code === 'Space' || code === 'Enter' || code === 'ArrowDown' || code === 'KeyS') {
      if (e.target && e.target.tagName === 'BUTTON' && code !== 'ArrowDown' && code !== 'KeyS' && e.target !== canvas) { handled = false; }
      else if (!e.repeat) { if (armed === 'pop') popNearestToAim(); else drop(); }
    }
    else if (code === 'KeyZ' || code === 'Backspace') undo();
    else if (code === 'KeyH' || e.key === '?') openModal('bdRulesModal');
    else if (code === 'KeyT') showTop();
    else if (/^Digit[1-4]$/.test(code)) usePower(POWER_KEYS[+code.slice(5) - 1]);
    else handled = false;
    if (handled) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) {
    if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && keyDir < 0) keyDir = 0;
    if ((e.code === 'ArrowRight' || e.code === 'KeyD') && keyDir > 0) keyDir = 0;
  });
  window.addEventListener('blur', function () { keyDir = 0; });

  function showTop() {
    var top = topScores();
    var fmt = function (d) { try { return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }); } catch (e) { return ''; } };
    $('bdTopList').innerHTML = top.length
      ? top.slice(0, 10).map(function (t, i) {
        return '<li><span>#' + (i + 1) + (t.d ? ' <span class="blobdrop-modal__date">' + fmt(t.d) + '</span>' : '') + '</span><span>' + t.s + '</span></li>';
      }).join('')
      : '<li><span>Пока нет ни одной игры</span><span></span></li>';
    openModal('bdTopModal');
  }

  document.querySelectorAll('.blobdrop__power').forEach(function (el) { el.addEventListener('click', function () { usePower(el.dataset.power); }); });
  $('bdUndo').addEventListener('click', undo);
  $('bdRules').addEventListener('click', function () { openModal('bdRulesModal'); });
  $('bdTrophy').addEventListener('click', showTop);
  document.querySelectorAll('[data-bd-close]').forEach(function (b) { b.addEventListener('click', function () { closeModals(true); }); });
  document.querySelectorAll('.blobdrop-modal').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m && m.id !== 'bdOverModal') closeModals(true); });
  });
  $('bdOverRestart').addEventListener('click', function () { reset(); });

  function deform(b, dt) {
    var R = radiusOf(b.tier) * b.grow;
    var px = b.body.position.x, py = b.body.position.y, ang = b.body.angle;
    var planes = [], i;
    if (px - R < WALL + 1) planes.push({ nx: -1, ny: 0, d: px - WALL });
    if (px + R > W - WALL - 1) planes.push({ nx: 1, ny: 0, d: W - WALL - px });
    if (py + R > FLOOR_Y - 1) planes.push({ nx: 0, ny: 1, d: FLOOR_Y - py });
    for (i = 0; i < blobs.length; i++) {
      var o = blobs[i];
      if (o === b) continue;
      var dx = o.body.position.x - px, dy = o.body.position.y - py;
      var rr = R + radiusOf(o.tier) * o.grow, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr * 1.03 && d2 > 0.01) {
        var d = Math.sqrt(d2);
        planes.push({ nx: dx / d, ny: dy / d, d: d * (R / rr) + 1.2 });
      }
    }
    var target = new Float32Array(VERTS), sum = 0;
    for (i = 0; i < VERTS; i++) {
      var a = ang + i / VERTS * Math.PI * 2, cx = Math.cos(a), cy = Math.sin(a), lim = R * 1.05;
      for (var j = 0; j < planes.length; j++) {
        var p = planes[j], dot = cx * p.nx + cy * p.ny;
        if (dot > 0.05) lim = Math.min(lim, p.d / dot);
      }
      target[i] = Math.max(R * 0.74, lim);
      sum += target[i];
    }
    var bulge = Math.max(0, (R * 1.05 * VERTS - sum) / VERTS) * 0.6;
    for (i = 0; i < VERTS; i++) {
      var tg = target[i] >= R * 1.04 ? target[i] + bulge : target[i];
      var f = (tg - b.rad[i]) * 420 - b.vel[i] * 17;
      b.vel[i] += f * dt;
      b.rad[i] += b.vel[i] * dt;
    }
    var tmp = Float32Array.from(b.rad);
    for (i = 0; i < VERTS; i++) {
      var v = tmp[i] * 0.7 + (tmp[(i + VERTS - 1) % VERTS] + tmp[(i + 1) % VERTS]) * 0.15;
      b.rad[i] = Number.isFinite(v) ? Math.max(R * 0.6, Math.min(R * 1.3, v)) : R;
      if (!Number.isFinite(b.vel[i])) b.vel[i] = 0;
    }
  }

  function blobPath(c, x, y, rad, ang) {
    var n = rad.length, pts = [], i;
    for (i = 0; i < n; i++) {
      var a = ang + i / n * Math.PI * 2;
      pts.push([x + Math.cos(a) * rad[i], y + Math.sin(a) * rad[i]]);
    }
    c.beginPath();
    c.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
    for (i = 0; i < n; i++) {
      var p = pts[i], q = pts[(i + 1) % n];
      c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    c.closePath();
  }

  function texture(c, tier, x, y, R, ang) {
    var t = TIERS[tier];
    c.save(); c.translate(x, y); c.rotate(ang);
    var light = shade(t.c, 0.22), dark = shade(t.c, -0.12), i;
    if (t.tex === 'stripes') {
      c.rotate(-0.6); c.fillStyle = dark;
      var w = Math.max(5, R * 0.22);
      for (var s = -R * 1.4; s < R * 1.4; s += w * 2) c.fillRect(s, -R * 1.4, w, R * 2.8);
    } else if (t.tex === 'rings') {
      c.strokeStyle = dark; c.lineWidth = Math.max(2, R * 0.09);
      for (var rr = R * 0.22; rr < R * 1.1; rr += R * 0.26) { c.beginPath(); c.arc(R * 0.05, R * 0.05, rr, 0, Math.PI * 2); c.stroke(); }
    } else if (t.tex === 'dots') {
      c.fillStyle = tier === 0 ? light : dark;
      var step = Math.max(8, R * 0.42), dr = Math.max(1.8, R * 0.075);
      for (var yy = -R; yy <= R; yy += step) {
        var off = Math.round(yy / step) % 2 ? step / 2 : 0;
        for (var xx = -R - off; xx <= R; xx += step) { c.beginPath(); c.arc(xx, yy, dr, 0, Math.PI * 2); c.fill(); }
      }
    } else if (t.tex === 'star') {
      c.fillStyle = shade(t.c, 0.35); c.strokeStyle = shade(t.c, -0.25); c.lineWidth = Math.max(2, R * 0.05);
      c.beginPath();
      for (i = 0; i < 10; i++) {
        var a = -Math.PI / 2 + i * Math.PI / 5, r2 = i % 2 ? R * 0.34 : R * 0.72;
        c.lineTo(Math.cos(a) * r2, Math.sin(a) * r2 + R * 0.04);
      }
      c.closePath(); c.fill(); c.stroke();
    }
    c.restore();
  }

  function rainbowFill(c, x, y, R, ang) {
    var cols = ['#ef4b4b', '#f7943b', '#f7d23b', '#6cc24a', '#3fb4e8', '#8a5cf0'];
    c.save(); c.translate(x, y); c.rotate(ang);
    var w = R * 2 / cols.length;
    cols.forEach(function (col, i) { c.fillStyle = col; c.fillRect(-R * 1.2 + i * w * 1.2, -R * 1.2, w * 1.25, R * 2.4); });
    c.restore();
  }

  function drawBlob(c, tier, x, y, rad, ang, o) {
    o = o || {};
    var sum = 0;
    for (var i = 0; i < rad.length; i++) sum += rad[i];
    var R = Math.max(1, sum / rad.length || 1);
    var lw = Math.max(2.6, Math.min(4.5, R * 0.1));
    blobPath(c, x, y, rad, ang);
    c.save(); c.clip();
    if (tier === RAINBOW) rainbowFill(c, x, y, R, ang);
    else { c.fillStyle = TIERS[tier].c; c.fillRect(x - R * 1.5, y - R * 1.5, R * 3, R * 3); texture(c, tier, x, y, R, ang); }
    c.fillStyle = 'rgba(0,0,0,0.12)';
    c.beginPath(); c.ellipse(x + R * 0.1, y + R * 1.05, R * 1.2, R * 0.45, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    blobPath(c, x, y, rad, ang);
    c.lineWidth = lw; c.lineJoin = 'round'; c.strokeStyle = INK; c.stroke();
    drawFace(c, x, y, R, o);
  }

  function drawFace(c, x, y, R, o) {
    var er = Math.max(2.2, Math.min(7, R * 0.085)), gap = Math.max(5, R * 0.3), ey = y - R * 0.1;
    var lx = (o.lookX || 0) * er * 0.4, ly = (o.lookY || 0) * er * 0.4, blink = o.blink || 0;
    [-1, 1].forEach(function (s) {
      var ex = x + s * gap + lx;
      c.save(); c.translate(ex, ey + ly); c.scale(1, Math.max(0.12, 1 - blink));
      c.fillStyle = INK; c.beginPath(); c.arc(0, 0, er, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(er * 0.35, -er * 0.35, er * 0.38, 0, Math.PI * 2); c.fill();
      c.restore();
    });
    c.beginPath();
    var mw = Math.max(3, R * 0.13);
    if (o.surprised) c.arc(x + lx, y + R * 0.14 + ly, mw * 0.5, 0, Math.PI * 2);
    else c.arc(x + lx, y + R * 0.06 + ly, mw, 0.18 * Math.PI, 0.82 * Math.PI);
    c.lineWidth = Math.max(1.6, Math.min(3.2, R * 0.06)); c.lineCap = 'round'; c.strokeStyle = INK; c.stroke();
  }

  function circle(tier) { return new Float32Array(24).fill(radiusOf(tier)); }

  function drawIcon(cv, tier, face) {
    var c = cv.getContext('2d'), size = cv.width;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, size, size);
    var s = (size * 0.44) / radiusOf(tier);
    c.setTransform(s, 0, 0, s, size / 2, size / 2);
    var rad = circle(tier);
    if (face) { drawBlob(c, tier, 0, 0, rad, 0, {}); return; }
    blobPath(c, 0, 0, rad, 0);
    c.save(); c.clip();
    var R = radiusOf(tier);
    if (tier === RAINBOW) rainbowFill(c, 0, 0, R, 0);
    else { c.fillStyle = TIERS[tier].c; c.fillRect(-R * 1.5, -R * 1.5, R * 3, R * 3); texture(c, tier, 0, 0, R, 0); }
    c.restore();
    blobPath(c, 0, 0, rad, 0);
    c.lineWidth = R * 0.11; c.strokeStyle = INK; c.stroke();
  }

  function renderNext() { drawIcon($('bdNext'), next, false); }

  function renderOrder() {
    var list = $('bdOrder'), narrow = window.innerWidth <= 700, i;
    if (!list.children.length || list.dataset.narrow !== String(narrow)) {
      list.innerHTML = '';
      list.dataset.narrow = String(narrow);
      for (i = 0; i <= MAX_TIER; i++) {
        var d = document.createElement('div');
        d.className = 'blobdrop__order-item';
        var px = narrow ? Math.round(16 + i * 1.3) : Math.round(28 + i * 2.6);
        var cv = document.createElement('canvas');
        cv.width = px * 2; cv.height = px * 2;
        cv.style.width = px + 'px'; cv.style.height = px + 'px';
        d.style.width = px + 'px'; d.style.height = px + 'px';
        d.style.margin = narrow ? '0' : '3px 0';
        drawIcon(cv, i, false);
        d.appendChild(cv);
        list.appendChild(d);
      }
    }
    Array.prototype.forEach.call(list.children, function (d, i) { d.classList.toggle('is-current', i === current && armed !== 'rainbow'); });
    var br = $('bdBracket'), items = list.children;
    if (!narrow && items.length) {
      var a = items[0], b = items[SPAWN_MAX];
      br.style.top = a.offsetTop + 'px';
      br.style.height = (b.offsetTop + b.offsetHeight - a.offsetTop) + 'px';
    }
  }

  function drawWood(c, x, y, w, h) {
    c.fillStyle = '#c98c4b'; c.fillRect(x, y, w, h);
    c.strokeStyle = '#a86d33'; c.lineWidth = 1.4;
    var vertical = h > w, len = vertical ? h : w, th = vertical ? w : h, s;
    var seed = Math.floor(x * 7 + y * 13);
    var r = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (var k = 1; k < 4; k++) {
      c.beginPath();
      for (s = 0; s <= len; s += 12) {
        var off = th * (k / 4) + Math.sin(s * 0.05 + k * 2) * 1.2;
        if (vertical) { if (s === 0) c.moveTo(x + off, y + s); else c.lineTo(x + off, y + s); }
        else { if (s === 0) c.moveTo(x + s, y + off); else c.lineTo(x + s, y + off); }
      }
      c.stroke();
    }
    c.strokeStyle = '#8d5a28'; c.lineWidth = 2;
    for (s = 60 + r() * 40; s < len - 20; s += 70 + r() * 60) {
      c.beginPath();
      if (vertical) { c.moveTo(x, y + s); c.lineTo(x + w, y + s); } else { c.moveTo(x + s, y); c.lineTo(x + s, y + h); }
      c.stroke();
    }
    c.strokeStyle = INK; c.lineWidth = 3.5;
    c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, 4); else c.rect(x, y, w, h); c.stroke();
  }

  function render(now) {
    var c = ctx, shx = shakeT > 0 ? Math.sin(now / 18) * 6 * shakeT : 0;
    c.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    c.clearRect(0, 0, W, H);
    c.translate(shx, 0);
    c.fillStyle = theme.jar;
    c.fillRect(WALL, JAR_TOP, W - WALL * 2, FLOOR_Y - JAR_TOP);

    c.save();
    c.setLineDash([12, 10]); c.lineWidth = 2.2;
    var warn = Math.min(1, dangerTime / 2.2);
    c.strokeStyle = warn > 0 ? 'rgba(229,59,59,' + (0.4 + 0.6 * Math.abs(Math.sin(now / 100))) + ')' : theme.guide;
    c.beginPath(); c.moveTo(WALL + 4, DANGER_Y); c.lineTo(W - WALL - 4, DANGER_Y); c.stroke();
    c.restore();

    if (!gameOver) {
      var tier = armed === 'rainbow' ? RAINBOW : current, r = radiusOf(tier), x = clampX(aimX, r);
      if (armed !== 'pop') {
        c.save();
        c.setLineDash([2.5, 6]); c.lineCap = 'round'; c.lineWidth = 2.2;
        c.strokeStyle = theme.guide; c.globalAlpha = canDrop ? 1 : 0.4;
        c.beginPath(); c.moveTo(x, DROP_Y + r + 4); c.lineTo(x, FLOOR_Y); c.stroke();
        c.restore();
      }
      if (canDrop) drawBlob(c, tier, x, DROP_Y, circle(tier), 0, { lookY: 0.6 });
    }

    blobs.forEach(function (b) {
      var p = b.body.position, bp = (now - b.blinkAt) / 120, blink = 0;
      if (bp > 0 && bp < 2) blink = bp < 1 ? bp : 2 - bp;
      if (bp >= 2) b.blinkAt = now + 2500 + Math.random() * 5000;
      var v = b.body.velocity, sp = Math.hypot(v.x, v.y);
      drawBlob(c, b.tier, p.x, p.y, b.rad, b.body.angle, { blink: blink, lookX: sp > 1 ? v.x / sp : 0, lookY: sp > 1 ? v.y / sp : 0, surprised: sp > 6 });
    });

    drawWood(c, 2, JAR_TOP - 12, WALL - 2, FLOOR_Y - JAR_TOP + 12);
    drawWood(c, W - WALL, JAR_TOP - 12, WALL - 2, FLOOR_Y - JAR_TOP + 12);
    drawWood(c, 2, FLOOR_Y, W - 4, WALL);

    particles.forEach(function (pt) {
      c.globalAlpha = Math.max(0, pt.life); c.fillStyle = pt.c;
      c.beginPath(); c.arc(pt.x, pt.y, pt.r * pt.life, 0, Math.PI * 2); c.fill();
    });
    c.globalAlpha = 1;
  }

  function step(dt, now) {
    if (keyDir) aimX = Math.max(0, Math.min(W, aimX + keyDir * 420 * dt));
    if (!gameOver) Engine.update(engine, dt * 1000);
    blobs.forEach(function (b) {
      if (b.grow < 1) b.grow = Math.min(1, b.grow + dt * 4);
      deform(b, dt);
    });
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.vy += 0.25; p.x += p.vx; p.y += p.vy; p.life -= dt * 1.8;
      if (p.life <= 0) particles.splice(i, 1);
    }
    if (shakeT > 0) shakeT = Math.max(0, shakeT - dt);
    if (!canDrop) { dropTimer -= dt; if (dropTimer <= 0) canDrop = true; }
    if (!gameOver) {
      var over = false;
      for (i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        if (now - b.born < 1500) continue;
        if (b.body.position.y - radiusOf(b.tier) < DANGER_Y) { over = true; break; }
      }
      dangerTime = over ? dangerTime + dt : Math.max(0, dangerTime - dt * 2);
      if (dangerTime > 2.2) endGame();
    }
  }

  function loop(t) {
    var now = performance.now();
    var dt = Math.max(0, Math.min(0.05, (t - lastT) / 1000 || 0));
    lastT = t;
    if (visible && !anyModalOpen()) {
      if (dt > 0.0005) { step(dt / 2, now); step(dt / 2, now); }
    } else if (dt > 0.0005) {
      for (var i = particles.length - 1; i >= 0; i--) { particles[i].life -= dt * 1.8; if (particles[i].life <= 0) particles.splice(i, 1); }
    }
    render(now);
    requestAnimationFrame(loop);
  }

  function drawCommunityJar() {
    var cv = $('bdCjar'), c = cv.getContext('2d');
    c.setTransform(2, 0, 0, 2, 0, 0);
    c.lineJoin = 'round';
    c.fillStyle = '#e8f4f6'; c.strokeStyle = INK; c.lineWidth = 3.5;
    c.beginPath(); c.moveTo(22, 30); c.lineTo(22, 20); c.lineTo(88, 20); c.lineTo(88, 30);
    c.quadraticCurveTo(100, 36, 100, 52); c.lineTo(100, 118); c.quadraticCurveTo(100, 128, 90, 128); c.lineTo(20, 128);
    c.quadraticCurveTo(10, 128, 10, 118); c.lineTo(10, 52); c.quadraticCurveTo(10, 36, 22, 30); c.closePath();
    c.fill(); c.stroke();
    c.save(); c.clip();
    var mk = function (tier, x, y, r) { drawBlob(c, tier, x, y, new Float32Array(20).fill(r), 0, {}); };
    mk(3, 32, 106, 22); mk(4, 72, 98, 28); mk(2, 30, 70, 16); mk(0, 56, 118, 10);
    c.restore();
    c.fillStyle = '#e9d3a8'; c.beginPath(); if (c.roundRect) c.roundRect(18, 8, 74, 14, 4); else c.rect(18, 8, 74, 14); c.fill(); c.stroke();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe($('bdBoard'));
  }
  if (darkMq && darkMq.addEventListener) darkMq.addEventListener('change', readTheme);
  new MutationObserver(readTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', function () { if (document.hidden) persist(); });
  window.addEventListener('resize', function () { renderOrder(); fit(); });

  window.__blobdrop = {
    state: function () { return { score: score, best: best, blobs: blobs.length, tiers: blobs.map(function (b) { return b.tier; }), gameOver: gameOver, current: current, next: next, dangerTime: dangerTime, merges: merges, charges: Object.assign({}, charges), aimX: aimX }; },
    dropAt: function (x) { aimX = x; canDrop = true; drop(); },
    step: function (n) { for (var i = 0; i < (n || 1); i++) step(1 / 60, performance.now()); },
    charge: function () { for (var k in charges) charges[k] = POWERS[k]; renderPowers(); },
    usePower: usePower, undo: undo, reset: reset, persist: persist, resume: resume, endGame: endGame, W: W, H: H
  };

  readTheme();
  if (!resume()) reset();
  fit();
  renderOrder();
  drawCommunityJar();
  $('bdLoading').classList.add('is-hidden');
  lastT = performance.now();
  requestAnimationFrame(loop);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { renderOrder(); fit(); });
  }
})();
