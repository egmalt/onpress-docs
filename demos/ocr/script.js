(function () {
  'use strict';

  var root = document.getElementById('scan');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';

  var LIB = 'https:\x2f\x2fcdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  var HKEY = 'op-ocr-history';
  var LKEY = 'op-ocr-lang';
  var HMAX = 24;
  var MAXSIDE = 3200;
  var LOWCONF = 60;

  function $(sel) { return root.querySelector(sel); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var ui = {
    lang: $('[data-ocr-lang]'),
    file: $('[data-ocr-file]'),
    camera: $('[data-ocr-camera]'),
    drop: $('[data-ocr-drop]'),
    queue: $('[data-ocr-queue]'),
    qlist: $('[data-ocr-qlist]'),
    qcount: $('[data-ocr-qcount]'),
    qclear: $('[data-ocr-qclear]'),
    runall: $('[data-ocr-runall]'),
    work: $('[data-ocr-work]'),
    stage: $('[data-ocr-stage]'),
    canvas: $('[data-ocr-canvas]'),
    boxes: $('[data-ocr-boxes]'),
    cropbox: $('[data-ocr-cropbox]'),
    crophint: $('[data-ocr-crophint]'),
    cropBtn: $('[data-ocr-crop]'),
    mode: $('[data-ocr-mode]'),
    contrast: $('[data-ocr-contrast]'),
    contrastOut: $('[data-ocr-contrast-out]'),
    reset: $('[data-ocr-reset]'),
    imeta: $('[data-ocr-imeta]'),
    run: $('[data-ocr-run]'),
    progress: $('[data-ocr-progress]'),
    fill: $('[data-ocr-fill]'),
    ptext: $('[data-ocr-ptext]'),
    cancel: $('[data-ocr-cancel]'),
    conf: $('[data-ocr-conf]'),
    confText: $('[data-ocr-conf-text]'),
    text: $('[data-ocr-text]'),
    tmeta: $('[data-ocr-tmeta]'),
    copy: $('[data-ocr-copy]'),
    download: $('[data-ocr-download]'),
    hlist: $('[data-ocr-hlist]'),
    hcount: $('[data-ocr-hcount]'),
    hclear: $('[data-ocr-hclear]'),
    hempty: $('[data-ocr-hempty]'),
    toast: $('[data-ocr-toast]'),
    htoggle: $('[data-ocr-htoggle]'),
    hclose: $('[data-ocr-hclose]'),
    history: $('[data-ocr-history]'),
    intro: $('[data-ocr-intro]'),
    open: $('[data-ocr-open]'),
    about: $('[data-ocr-about]')
  };

  var state = {
    lang: 'rus+eng',
    items: [],
    current: null,
    busy: false,
    cropping: false,
    libPromise: null,
    worker: null,
    workerLang: null,
    cancelled: false,
    seq: 0,
    gen: 0
  };

  try {
    var savedLang = localStorage.getItem(LKEY);
    if (savedLang === 'rus' || savedLang === 'eng' || savedLang === 'rus+eng') state.lang = savedLang;
  } catch (e) {}

  var toastTimer = 0;
  function toast(msg, isError) {
    ui.toast.textContent = msg;
    ui.toast.classList.toggle('is-error', !!isError);
    ui.toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { ui.toast.classList.remove('is-on'); }, isError ? 4200 : 2200);
  }

  function setSeg(group, attr, value) {
    group.querySelectorAll('[role="radio"]').forEach(function (b) {
      b.setAttribute('aria-checked', b.getAttribute(attr) === value ? 'true' : 'false');
    });
  }

  function fmtBytes(n) {
    if (!n) return '';
    if (n < 1024) return n + ' Б';
    if (n < 1048576) return Math.round(n / 1024) + ' КБ';
    return (n / 1048576).toFixed(1).replace('.', ',') + ' МБ';
  }

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }

  function fmtTime(ts) {
    var d = new Date(ts);
    var now = new Date();
    var hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    if (d.toDateString() === now.toDateString()) return 'сегодня, ' + hm;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ', ' + hm;
  }

  function loadLib() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (state.libPromise) return state.libPromise;
    state.libPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = LIB;
      s.async = true;
      s.onload = function () { window.Tesseract ? resolve(window.Tesseract) : reject(new Error('lib')); };
      s.onerror = function () { state.libPromise = null; reject(new Error('lib')); };
      document.head.appendChild(s);
    });
    return state.libPromise;
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('image')); };
      img.src = src;
    });
  }

  function makeThumb(source, size) {
    var w = source.naturalWidth || source.width;
    var h = source.naturalHeight || source.height;
    var k = Math.min(1, size / Math.max(w, h));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k));
    c.height = Math.max(1, Math.round(h * k));
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(source, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.72);
  }

  function addFiles(files) {
    var list = Array.prototype.filter.call(files || [], function (f) { return f && /^image\x2f/.test(f.type); });
    if (!list.length) {
      if (files && files.length) toast('Это не картинка. Подойдут PNG, JPG, WebP, BMP, GIF', true);
      return Promise.resolve();
    }
    var first = null;
    return list.reduce(function (p, f) {
      return p.then(function () {
        return addBlob(f, f.name || 'картинка').then(function (item) { if (!first) first = item; });
      });
    }, Promise.resolve()).then(function () {
      if (first) select(first);
      if (list.length > 1) toast('Добавлено ' + list.length + ' ' + plural(list.length, 'картинка', 'картинки', 'картинок'));
    });
  }

  function addBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    return loadImage(url).then(function (img) {
      var item = {
        id: ++state.seq,
        name: name,
        size: blob.size,
        url: url,
        img: img,
        thumb: makeThumb(img, 220),
        rot: 0,
        crop: null,
        mode: 'color',
        contrast: 0,
        status: 'wait',
        result: null
      };
      state.items.push(item);
      renderQueue();
      return item;
    }, function () {
      URL.revokeObjectURL(url);
      toast('Не получилось открыть «' + name + '»', true);
    });
  }

  function removeItem(item) {
    if (state.busy && item.status === 'run') return;
    var i = state.items.indexOf(item);
    if (i < 0) return;
    state.items.splice(i, 1);
    URL.revokeObjectURL(item.url);
    if (state.current === item) {
      state.current = null;
      var next = state.items[i] || state.items[i - 1];
      if (next) select(next); else showEmpty();
    }
    renderQueue();
  }

  function showEmpty() {
    state.current = null;
    ui.work.hidden = true;
    root.dataset.state = 'empty';
    ui.run.disabled = true;
    ui.imeta.textContent = 'нет картинки';
    ui.text.textContent = '';
    ui.conf.hidden = true;
    ui.tmeta.textContent = '';
    syncActions();
  }

  function renderQueue() {
    var n = state.items.length;
    ui.queue.hidden = n < 2;
    ui.qcount.textContent = n ? String(n) : '';
    ui.runall.hidden = !state.items.some(function (it) { return it.status !== 'done'; });
    ui.qlist.textContent = '';
    state.items.forEach(function (item) {
      var li = el('li');
      var b = el('button', 'scan__qitem' + (item === state.current ? ' is-current' : ''));
      b.type = 'button';
      b.title = item.name;
      var img = el('img');
      img.src = item.thumb;
      img.alt = '';
      b.appendChild(img);
      b.appendChild(el('span', 'scan__qitem-name', item.name));
      var labels = { wait: 'ждет', run: 'идет', done: 'готово', error: 'ошибка' };
      var badge = el('span', 'scan__qitem-badge', labels[item.status]);
      badge.dataset.s = item.status;
      b.appendChild(badge);
      var del = el('span', 'scan__qitem-del', '×');
      del.setAttribute('role', 'button');
      del.setAttribute('aria-label', 'Убрать из очереди');
      del.addEventListener('click', function (e) { e.stopPropagation(); removeItem(item); });
      b.appendChild(del);
      b.addEventListener('click', function () { if (!state.busy) select(item); });
      li.appendChild(b);
      ui.qlist.appendChild(li);
    });
  }

  function select(item) {
    if (state.cropping) setCropping(false);
    state.current = item;
    ui.work.hidden = false;
    root.dataset.state = state.busy ? 'busy' : 'ready';
    ui.run.disabled = state.busy;
    if (document.activeElement === ui.drop) ui.drop.blur();
    setSeg(ui.mode, 'data-mode', item.mode);
    ui.contrast.value = item.contrast;
    ui.contrastOut.textContent = String(item.contrast);
    drawCurrent();
    showResult(item);
    renderQueue();
  }

  function renderProcessed(item) {
    var img = item.img;
    var w0 = img.naturalWidth, h0 = img.naturalHeight;
    var turned = item.rot % 180 !== 0;
    var rw = turned ? h0 : w0, rh = turned ? w0 : h0;
    var crop = item.crop || { x: 0, y: 0, w: rw, h: rh };
    var scale = 1;
    var big = Math.max(crop.w, crop.h);
    if (big > MAXSIDE) scale = MAXSIDE / big;
    else if (big < 900) scale = Math.min(2.5, 1400 / big);
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(crop.w * scale));
    c.height = Math.max(1, Math.round(crop.h * scale));
    var ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-crop.x, -crop.y);
    ctx.translate(rw / 2, rh / 2);
    ctx.rotate(item.rot * Math.PI / 180);
    ctx.drawImage(img, -w0 / 2, -h0 / 2);
    ctx.restore();
    if (item.mode !== 'color' || item.contrast !== 0) applyFilters(ctx, c.width, c.height, item.mode, item.contrast);
    return { canvas: c, scale: scale, rw: rw, rh: rh };
  }

  function applyFilters(ctx, w, h, mode, contrast) {
    var data = ctx.getImageData(0, 0, w, h);
    var px = data.data;
    var k = contrast >= 0 ? 1 + contrast / 40 : 1 + contrast / 100;
    var i, v, r, g, b;
    if (mode === 'color') {
      for (i = 0; i < px.length; i += 4) {
        px[i] = clamp((px[i] - 128) * k + 128);
        px[i + 1] = clamp((px[i + 1] - 128) * k + 128);
        px[i + 2] = clamp((px[i + 2] - 128) * k + 128);
      }
      ctx.putImageData(data, 0, 0);
      return;
    }
    var gray = new Uint8ClampedArray(w * h);
    var hist = new Uint32Array(256);
    for (i = 0; i < px.length; i += 4) {
      r = px[i]; g = px[i + 1]; b = px[i + 2];
      v = clamp((0.299 * r + 0.587 * g + 0.114 * b - 128) * k + 128);
      gray[i >> 2] = v;
      hist[v]++;
    }
    var thr = mode === 'bw' ? otsu(hist, w * h) : -1;
    for (i = 0; i < gray.length; i++) {
      v = thr < 0 ? gray[i] : (gray[i] > thr ? 255 : 0);
      px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v;
    }
    ctx.putImageData(data, 0, 0);
  }

  function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v | 0; }

  function otsu(hist, total) {
    var sum = 0, i;
    for (i = 0; i < 256; i++) sum += i * hist[i];
    var sumB = 0, wB = 0, best = 0, thr = 127;
    for (i = 0; i < 256; i++) {
      wB += hist[i];
      if (!wB) continue;
      var wF = total - wB;
      if (!wF) break;
      sumB += i * hist[i];
      var mB = sumB / wB, mF = (sum - sumB) / wF;
      var between = wB * wF * (mB - mF) * (mB - mF);
      if (between > best) { best = between; thr = i; }
    }
    return thr;
  }

  function drawCurrent() {
    var item = state.current;
    if (!item) return;
    var out = renderProcessed(item);
    item.view = out;
    ui.canvas.width = out.canvas.width;
    ui.canvas.height = out.canvas.height;
    ui.canvas.getContext('2d').drawImage(out.canvas, 0, 0);
    ui.boxes.setAttribute('viewBox', '0 0 ' + out.canvas.width + ' ' + out.canvas.height);
    ui.boxes.setAttribute('preserveAspectRatio', 'none');
    var srcW = item.crop ? Math.round(item.crop.w) : out.rw;
    var srcH = item.crop ? Math.round(item.crop.h) : out.rh;
    var parts = [srcW + '×' + srcH];
    if (item.crop) parts.push('область');
    if (item.size) parts.push(fmtBytes(item.size));
    ui.imeta.textContent = parts.join(' · ');
    drawBoxes(item.result && item.result.sig === signature(item) ? item.result.words : null);
  }

  function signature(item) {
    return [item.rot, item.crop ? [item.crop.x, item.crop.y, item.crop.w, item.crop.h].map(Math.round).join(',') : '', item.mode, item.contrast].join('|');
  }

  var SVGNS = 'http:\x2f\x2fwww.w3.org/2000/svg';

  function drawBoxes(words) {
    ui.boxes.textContent = '';
    if (!words) return;
    words.forEach(function (w, i) {
      var r = document.createElementNS(SVGNS, 'rect');
      r.setAttribute('x', w.b[0]);
      r.setAttribute('y', w.b[1]);
      r.setAttribute('width', Math.max(1, w.b[2] - w.b[0]));
      r.setAttribute('height', Math.max(1, w.b[3] - w.b[1]));
      r.setAttribute('rx', 2);
      if (w.c < LOWCONF) r.setAttribute('class', 'is-low');
      r.dataset.i = i;
      var t = document.createElementNS(SVGNS, 'title');
      t.textContent = w.t + ' · ' + Math.round(w.c) + '%';
      r.appendChild(t);
      ui.boxes.appendChild(r);
    });
  }

  function hot(i, on, scroll) {
    var r = ui.boxes.querySelector('rect[data-i="' + i + '"]');
    var s = ui.text.querySelector('.scan__w[data-i="' + i + '"]');
    if (r) r.classList.toggle('is-hot', on);
    if (s) {
      s.classList.toggle('is-hot', on);
      if (on && scroll) s.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  ui.text.addEventListener('mouseover', function (e) {
    var s = e.target.closest && e.target.closest('.scan__w');
    if (s) hot(s.dataset.i, true, false);
  });
  ui.text.addEventListener('mouseout', function (e) {
    var s = e.target.closest && e.target.closest('.scan__w');
    if (s) hot(s.dataset.i, false, false);
  });
  ui.boxes.addEventListener('mouseover', function (e) {
    if (e.target.tagName === 'rect') hot(e.target.dataset.i, true, true);
  });
  ui.boxes.addEventListener('mouseout', function (e) {
    if (e.target.tagName === 'rect') hot(e.target.dataset.i, false, false);
  });
  ui.boxes.addEventListener('click', function (e) {
    if (e.target.tagName !== 'rect') return;
    var s = ui.text.querySelector('.scan__w[data-i="' + e.target.dataset.i + '"]');
    if (!s) return;
    var range = document.createRange();
    range.selectNodeContents(s);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    ui.text.focus({ preventScroll: true });
  });

  function showResult(item) {
    var res = item.result;
    ui.text.textContent = '';
    ui.conf.hidden = true;
    ui.tmeta.textContent = '';
    if (res) {
      if (res.html) ui.text.appendChild(res.html.cloneNode(true));
      else ui.text.textContent = res.text;
      setConf(res.conf);
      updateTextMeta(res.ms);
    }
    syncActions();
  }

  function setConf(conf) {
    if (conf == null) { ui.conf.hidden = true; return; }
    ui.conf.hidden = false;
    ui.conf.dataset.level = conf >= 85 ? 'ok' : conf >= 65 ? 'mid' : 'bad';
    ui.confText.textContent = 'уверенность ' + Math.round(conf) + '%';
  }

  function currentText() {
    return (ui.text.innerText || '').replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }

  function updateTextMeta(ms) {
    var t = currentText();
    if (!t) { ui.tmeta.textContent = ''; return; }
    var words = t.split(/\s+/).filter(Boolean).length;
    var parts = [words + ' ' + plural(words, 'слово', 'слова', 'слов'), t.length + ' ' + plural(t.length, 'символ', 'символа', 'символов')];
    if (ms) parts.push((ms / 1000).toFixed(1).replace('.', ',') + ' с');
    ui.tmeta.textContent = parts.join(' · ');
  }

  function syncActions() {
    var has = !!currentText();
    ui.copy.disabled = !has;
    ui.download.disabled = !has;
  }

  ui.text.addEventListener('input', function () {
    var item = state.current;
    if (item && item.result) {
      item.result.text = currentText();
      item.result.html = null;
      item.result.edited = true;
    }
    updateTextMeta(item && item.result ? item.result.ms : 0);
    syncActions();
  });

  function buildHtml(data) {
    var frag = document.createDocumentFragment();
    var words = [];
    var paras = data.paragraphs && data.paragraphs.length ? data.paragraphs : null;
    if (!paras) {
      var p0 = el('p', null, (data.text || '').trim());
      frag.appendChild(p0);
      return { frag: frag, words: words };
    }
    paras.forEach(function (para) {
      var p = el('p');
      (para.lines || []).forEach(function (line, li) {
        if (li) p.appendChild(document.createElement('br'));
        (line.words || []).forEach(function (w, wi) {
          var t = (w.text || '').trim();
          if (!t) return;
          if (wi) p.appendChild(document.createTextNode(' '));
          var idx = words.length;
          words.push({ t: t, c: w.confidence, b: [w.bbox.x0, w.bbox.y0, w.bbox.x1, w.bbox.y1] });
          var s = el('span', 'scan__w' + (w.confidence < LOWCONF ? ' is-low' : ''), t);
          s.dataset.i = idx;
          p.appendChild(s);
        });
      });
      if (p.childNodes.length) frag.appendChild(p);
    });
    return { frag: frag, words: words };
  }

  var STEPS = ['core', 'lang', 'init', 'rec'];
  function setStep(step, frac, label) {
    var at = STEPS.indexOf(step);
    ui.progress.querySelectorAll('.scan__step').forEach(function (li) {
      var i = STEPS.indexOf(li.dataset.step);
      li.classList.toggle('is-done', i < at);
      li.classList.toggle('is-active', i === at);
    });
    var total = at < 0 ? 0 : (at + Math.max(0, Math.min(1, frac || 0))) / STEPS.length;
    ui.fill.style.width = Math.round(total * 100) + '%';
    if (label) ui.ptext.textContent = label;
  }

  function logger(m) {
    if (state.cancelled) return;
    var s = String(m.status || '');
    var p = m.progress || 0;
    if (s.indexOf('core') >= 0) setStep('core', p, 'Загружаю движок распознавания…');
    else if (s.indexOf('traineddata') >= 0) setStep('lang', p, 'Загружаю словари: ' + langName(state.lang) + '…');
    else if (s.indexOf('recogniz') >= 0) setStep('rec', p, 'Распознаю текст… ' + Math.round(p * 100) + '%');
    else if (s.indexOf('initializ') >= 0) setStep('init', p, 'Готовлю движок…');
  }

  function langName(l) {
    return l === 'rus' ? 'русский' : l === 'eng' ? 'английский' : 'русский и английский';
  }

  function getWorker() {
    if (state.worker && state.workerLang === state.lang) return Promise.resolve(state.worker);
    var prev = state.worker;
    state.worker = null;
    state.workerLang = null;
    var dispose = prev ? prev.terminate().catch(function () {}) : Promise.resolve();
    setStep('core', 0, 'Загружаю движок распознавания…');
    var gen = state.gen;
    return dispose.then(loadLib).then(function (T) {
      return T.createWorker(state.lang, 1, { logger: logger });
    }).then(function (w) {
      if (state.cancelled || gen !== state.gen) { w.terminate(); throw new Error('cancel'); }
      state.worker = w;
      state.workerLang = state.lang;
      return w;
    });
  }

  function recognize(item) {
    if (item.view == null || state.current !== item) select(item);
    var view = item.view;
    var sig = signature(item);
    var t0 = performance.now();
    item.status = 'run';
    renderQueue();
    return getWorker().then(function (w) {
      setStep('rec', 0, 'Распознаю текст…');
      return w.recognize(view.canvas);
    }).then(function (res) {
      if (state.cancelled) throw new Error('cancel');
      var data = res.data;
      var built = buildHtml(data);
      var holder = document.createElement('div');
      holder.appendChild(built.frag);
      var ms = performance.now() - t0;
      var html = document.createDocumentFragment();
      while (holder.firstChild) html.appendChild(holder.firstChild);
      item.result = {
        sig: sig,
        words: built.words,
        html: html,
        text: (data.text || '').trim(),
        conf: built.words.length ? data.confidence : null,
        ms: ms,
        lang: state.lang
      };
      item.status = 'done';
      if (state.current === item) {
        showResult(item);
        drawBoxes(built.words);
      }
      renderQueue();
      if (!built.words.length) {
        toast('Текст не найден. Попробуйте обрезать область, повернуть картинку или усилить контраст', true);
      } else {
        saveHistory(item);
      }
      return item;
    }, function (err) {
      if (err && err.message === 'cancel') { item.status = 'wait'; renderQueue(); throw err; }
      item.status = 'error';
      renderQueue();
      var msg = err && err.message === 'lib'
        ? 'Не загрузился движок распознавания. Проверьте интернет и попробуйте еще раз'
        : 'Не получилось распознать. Попробуйте еще раз или другую картинку';
      toast(msg, true);
      if (state.worker) { state.worker.terminate().catch(function () {}); state.worker = null; state.workerLang = null; }
      throw err;
    });
  }

  function setBusy(on) {
    state.busy = on;
    root.dataset.state = on ? 'busy' : (state.current ? 'ready' : 'empty');
    ui.progress.hidden = !on;
    ui.run.disabled = on || !state.current;
    ui.runall.disabled = on;
    ui.lang.querySelectorAll('button').forEach(function (b) { b.disabled = on; });
    root.querySelectorAll('.scan__rail button, .scan__rail input').forEach(function (b) { b.disabled = on; });
    ui.text.setAttribute('contenteditable', on ? 'false' : 'true');
    if (on) { ui.fill.style.width = '0%'; ui.ptext.textContent = 'Запуск…'; }
  }

  function runQueue(items) {
    if (state.busy || !items.length) return;
    state.cancelled = false;
    setBusy(true);
    var gen = state.gen;
    var done = 0;
    var chain = items.reduce(function (p, item) {
      return p.then(function () {
        if (state.cancelled) return;
        if (state.current !== item) select(item);
        return recognize(item).then(function () { done++; }, function (err) {
          if (err && err.message === 'cancel') state.cancelled = true;
        });
      });
    }, Promise.resolve());
    chain.then(function () {
      if (gen !== state.gen) return;
      setBusy(false);
      if (state.cancelled) toast('Распознавание остановлено');
      else if (items.length > 1) toast('Готово: ' + done + ' из ' + items.length);
      renderQueue();
    });
  }

  ui.run.addEventListener('click', function () {
    if (state.current) runQueue([state.current]);
  });
  ui.runall.addEventListener('click', function () {
    var list = state.items.filter(function (it) { return it.status !== 'done'; });
    runQueue(list);
  });
  ui.cancel.addEventListener('click', function () {
    if (!state.busy) return;
    state.cancelled = true;
    state.gen++;
    ui.ptext.textContent = 'Останавливаю…';
    var w = state.worker;
    state.worker = null;
    state.workerLang = null;
    if (w) w.terminate().catch(function () {});
    state.items.forEach(function (it) { if (it.status === 'run') it.status = 'wait'; });
    setBusy(false);
    renderQueue();
    toast('Распознавание остановлено');
  });
  ui.qclear.addEventListener('click', function () {
    if (state.busy) return;
    state.items.forEach(function (it) { URL.revokeObjectURL(it.url); });
    state.items = [];
    renderQueue();
    showEmpty();
  });

  ui.lang.addEventListener('click', function (e) {
    var b = e.target.closest('[data-lang]');
    if (!b || state.busy) return;
    state.lang = b.dataset.lang;
    setSeg(ui.lang, 'data-lang', state.lang);
    try { localStorage.setItem(LKEY, state.lang); } catch (err) {}
  });

  function edit(fn) {
    var item = state.current;
    if (!item || state.busy) return;
    fn(item);
    drawCurrent();
  }

  root.querySelectorAll('[data-ocr-rot]').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = Number(b.dataset.ocrRot);
      edit(function (item) { rotate(item, d); });
    });
  });

  function rotate(item, d) {
    var w0 = item.img.naturalWidth, h0 = item.img.naturalHeight;
    var turned = item.rot % 180 !== 0;
    var rw = turned ? h0 : w0, rh = turned ? w0 : h0;
    if (item.crop) {
      var c = item.crop;
      item.crop = d > 0
        ? { x: rh - c.y - c.h, y: c.x, w: c.h, h: c.w }
        : { x: c.y, y: rw - c.x - c.w, w: c.h, h: c.w };
    }
    item.rot = (item.rot + d + 360) % 360;
  }

  ui.mode.addEventListener('click', function (e) {
    var b = e.target.closest('[data-mode]');
    if (!b) return;
    edit(function (item) { item.mode = b.dataset.mode; });
    if (state.current) setSeg(ui.mode, 'data-mode', state.current.mode);
  });

  var contrastRaf = 0;
  ui.contrast.addEventListener('input', function () {
    ui.contrastOut.textContent = ui.contrast.value;
    cancelAnimationFrame(contrastRaf);
    contrastRaf = requestAnimationFrame(function () {
      edit(function (item) { item.contrast = Number(ui.contrast.value); });
    });
  });

  ui.reset.addEventListener('click', function () {
    if (state.cropping) setCropping(false);
    edit(function (item) { item.rot = 0; item.crop = null; item.mode = 'color'; item.contrast = 0; });
    if (state.current) {
      setSeg(ui.mode, 'data-mode', 'color');
      ui.contrast.value = 0;
      ui.contrastOut.textContent = '0';
    }
  });

  function setCropping(on) {
    if (on && (!state.current || state.busy)) return;
    state.cropping = on;
    ui.cropBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    ui.stage.classList.toggle('is-cropping', on);
    ui.crophint.hidden = !on;
    ui.cropbox.hidden = true;
  }

  ui.cropBtn.addEventListener('click', function () { setCropping(!state.cropping); });

  var drag = null;
  function stagePoint(e) {
    var r = ui.canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(r.width, e.clientX - r.left)),
      y: Math.max(0, Math.min(r.height, e.clientY - r.top)),
      rw: r.width,
      rh: r.height
    };
  }

  ui.stage.addEventListener('pointerdown', function (e) {
    if (!state.cropping) return;
    e.preventDefault();
    ui.stage.setPointerCapture(e.pointerId);
    var p = stagePoint(e);
    drag = { x0: p.x, y0: p.y, x1: p.x, y1: p.y, rw: p.rw, rh: p.rh };
    paintCrop();
    ui.cropbox.hidden = false;
    ui.crophint.hidden = true;
  });
  ui.stage.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var p = stagePoint(e);
    drag.x1 = p.x;
    drag.y1 = p.y;
    paintCrop();
  });
  function endDrag() {
    if (!drag) return;
    var d = drag;
    drag = null;
    var x = Math.min(d.x0, d.x1), y = Math.min(d.y0, d.y1);
    var w = Math.abs(d.x1 - d.x0), h = Math.abs(d.y1 - d.y0);
    setCropping(false);
    if (w < 12 || h < 12) { toast('Область слишком маленькая'); return; }
    edit(function (item) {
      var view = item.view;
      var k = ui.canvas.width / d.rw / view.scale;
      var base = item.crop || { x: 0, y: 0 };
      item.crop = { x: base.x + x * k, y: base.y + y * k, w: w * k, h: h * k };
    });
  }
  ui.stage.addEventListener('pointerup', endDrag);
  ui.stage.addEventListener('pointercancel', function () { drag = null; setCropping(false); });

  function paintCrop() {
    var x = Math.min(drag.x0, drag.x1), y = Math.min(drag.y0, drag.y1);
    ui.cropbox.style.left = x + 'px';
    ui.cropbox.style.top = y + 'px';
    ui.cropbox.style.width = Math.abs(drag.x1 - drag.x0) + 'px';
    ui.cropbox.style.height = Math.abs(drag.y1 - drag.y0) + 'px';
  }

  ui.copy.addEventListener('click', function () {
    var t = currentText();
    if (!t) return;
    copyText(t).then(function () { toast('Текст скопирован'); }, function () { toast('Не получилось скопировать, выделите текст вручную', true); });
  });

  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove();
      ok ? resolve() : reject();
    });
  }

  ui.download.addEventListener('click', function () {
    var t = currentText();
    if (!t) return;
    var name = ((state.current && state.current.name) || 'tekst').replace(/\.[a-z0-9]+$/i, '') + '.txt';
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([t + '\n'], { type: 'text/plain;charset=utf-8' }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  });

  function readHistory() {
    try {
      var h = JSON.parse(localStorage.getItem(HKEY) || '[]');
      return Array.isArray(h) ? h : [];
    } catch (e) { return []; }
  }

  function writeHistory(list) {
    while (list.length) {
      try {
        localStorage.setItem(HKEY, JSON.stringify(list));
        return;
      } catch (e) {
        list.pop();
      }
    }
    try { localStorage.removeItem(HKEY); } catch (e) {}
  }

  function saveHistory(item) {
    var text = (ui.text.innerText || item.result.text || '').trim();
    if (!text) return;
    var thumb = makeThumb(item.view.canvas, 160);
    var list = readHistory().filter(function (h) { return h.text !== text; });
    list.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ts: Date.now(),
      name: item.name,
      lang: item.result.lang,
      conf: item.result.conf == null ? null : Math.round(item.result.conf),
      text: text.slice(0, 20000),
      thumb: thumb
    });
    writeHistory(list.slice(0, HMAX));
    renderHistory();
  }

  function renderHistory() {
    var list = readHistory();
    ui.hlist.textContent = '';
    ui.hempty.hidden = list.length > 0;
    ui.hclear.hidden = !list.length;
    ui.hcount.textContent = list.length ? String(list.length) : '';
    list.forEach(function (h) {
      var li = el('li', 'scan__hitem');
      var img = el('img');
      img.src = h.thumb;
      img.alt = '';
      img.loading = 'lazy';
      li.appendChild(img);
      var body = el('div', 'scan__hitem-body');
      body.appendChild(el('p', 'scan__hitem-text', h.text));
      var meta = el('div', 'scan__hitem-meta');
      meta.appendChild(el('span', null, fmtTime(h.ts) + (h.conf != null ? ' · ' + h.conf + '%' : '')));
      var open = el('button', 'scan__link', 'Открыть');
      open.type = 'button';
      open.addEventListener('click', function () { openHistory(h); });
      var cp = el('button', 'scan__link', 'Копировать');
      cp.type = 'button';
      cp.addEventListener('click', function () {
        copyText(h.text).then(function () { toast('Текст скопирован'); }, function () { toast('Не получилось скопировать', true); });
      });
      var del = el('button', 'scan__link', 'Удалить');
      del.type = 'button';
      del.addEventListener('click', function () {
        writeHistory(readHistory().filter(function (x) { return x.id !== h.id; }));
        renderHistory();
      });
      meta.appendChild(open);
      meta.appendChild(cp);
      meta.appendChild(del);
      body.appendChild(meta);
      li.appendChild(body);
      ui.hlist.appendChild(li);
    });
  }

  function openHistory(h) {
    if (state.busy) return;
    fetch(h.thumb).then(function (r) { return r.blob(); }).then(function (blob) {
      return addBlob(blob, h.name || 'из истории');
    }).then(function (item) {
      if (!item) return;
      item.size = 0;
      item.status = 'done';
      item.result = { sig: null, words: null, html: null, text: h.text, conf: h.conf, ms: 0, lang: h.lang };
      setDrawer(false);
      select(item);
    });
  }

  function setDrawer(on) {
    ui.history.hidden = !on;
    ui.htoggle.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  ui.htoggle.addEventListener('click', function () { setDrawer(ui.history.hidden); });
  ui.hclose.addEventListener('click', function () { setDrawer(false); ui.htoggle.focus(); });

  function introOpen() { return !ui.intro.hidden; }
  function closeIntro() {
    if (!introOpen() || ui.intro.classList.contains('is-closing')) return;
    ui.intro.classList.add('is-closing');
    setTimeout(function () {
      ui.intro.hidden = true;
      ui.intro.classList.remove('is-closing');
      if (state.current) ui.run.focus({ preventScroll: true }); else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }, 150);
  }
  function showIntro() {
    ui.intro.hidden = false;
    setTimeout(function () { ui.open.focus({ preventScroll: true }); }, 30);
  }
  ui.open.addEventListener('click', closeIntro);
  ui.about.addEventListener('click', showIntro);
  ui.intro.addEventListener('click', function (e) { if (e.target === ui.intro) closeIntro(); });

  ui.hclear.addEventListener('click', function () {
    if (!confirm('Удалить всю историю распознаваний из этого браузера?')) return;
    try { localStorage.removeItem(HKEY); } catch (e) {}
    renderHistory();
  });

  var SAMPLES = {
    ru: {
      name: 'пример-ru.png',
      title: 'Счет на оплату № 2481',
      lines: [
        'Поставщик: ООО «Северный ветер», ИНН 7701234567',
        'Покупатель: ИП Смирнова Анна Викторовна',
        '',
        'Разработка сайта на OnPress — 45 000 руб.',
        'Настройка домена и почты — 3 500 руб.',
        'Перевод страниц на английский — 12 000 руб.',
        '',
        'Итого к оплате: 60 500 рублей 00 копеек.',
        'Оплатить до 15 ноября 2026 года.'
      ]
    },
    en: {
      name: 'sample-en.png',
      title: 'Meeting notes, October 28',
      lines: [
        'Attendees: Anna, George, Mike, Olivia',
        '',
        '1. Launch the new demo pages by Friday.',
        '2. Move all frame styles into separate files.',
        '3. Check that pages load fast on mobile phones.',
        '',
        'Next meeting: Tuesday, November 3 at 11:00.',
        'Questions? Write to the team chat.'
      ]
    }
  };

  function makeSample(key) {
    var s = SAMPLES[key];
    var W = 1100, pad = 60, lh = 46;
    var H = pad * 2 + 70 + s.lines.length * lh;
    var c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#fbfaf6';
    ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < 2600; i++) {
      ctx.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.05).toFixed(3) + ')';
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
    }
    ctx.fillStyle = '#1f2430';
    ctx.textBaseline = 'top';
    ctx.font = '600 38px Inter, Arial, sans-serif';
    ctx.fillText(s.title, pad, pad);
    ctx.font = '27px Georgia, "Times New Roman", serif';
    s.lines.forEach(function (line, n) {
      ctx.fillText(line, pad, pad + 70 + n * lh);
    });
    return new Promise(function (resolve) { c.toBlob(resolve, 'image/png'); }).then(function (blob) {
      return addBlob(blob, s.name);
    }).then(function (item) {
      if (!item) return;
      item.size = 0;
      select(item);
      if (key === 'en' && state.lang === 'rus') { state.lang = 'eng'; setSeg(ui.lang, 'data-lang', 'eng'); }
      if (key === 'ru' && state.lang === 'eng') { state.lang = 'rus'; setSeg(ui.lang, 'data-lang', 'rus'); }
      runQueue([item]);
    });
  }

  root.querySelectorAll('[data-ocr-sample]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!state.busy) makeSample(b.dataset.ocrSample);
    });
  });

  ui.file.addEventListener('change', function () { addFiles(ui.file.files); ui.file.value = ''; });
  ui.camera.addEventListener('change', function () { addFiles(ui.camera.files); ui.camera.value = ''; });

  var depth = 0;
  function hasFiles(e) {
    var t = e.dataTransfer && e.dataTransfer.types;
    return t && Array.prototype.indexOf.call(t, 'Files') >= 0;
  }
  document.addEventListener('dragenter', function (e) {
    if (!hasFiles(e)) return;
    depth++;
    ui.drop.classList.add('is-over');
  });
  document.addEventListener('dragleave', function (e) {
    if (!hasFiles(e)) return;
    depth = Math.max(0, depth - 1);
    if (!depth) ui.drop.classList.remove('is-over');
  });
  document.addEventListener('dragover', function (e) {
    if (hasFiles(e)) e.preventDefault();
  });
  document.addEventListener('drop', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0;
    ui.drop.classList.remove('is-over');
    addFiles(e.dataTransfer.files);
  });

  ui.drop.addEventListener('click', function (e) {
    if (e.target.closest('button, label, a')) return;
    ui.file.click();
  });
  ui.drop.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ui.file.click(); }
  });

  document.addEventListener('paste', function (e) {
    var t = e.target;
    if (t && (t === ui.text || ui.text.contains(t)) ) {
      e.preventDefault();
      var plain = (e.clipboardData && e.clipboardData.getData('text/plain')) || '';
      if (plain) document.execCommand('insertText', false, plain);
      return;
    }
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    var items = (e.clipboardData && e.clipboardData.items) || [];
    var files = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && /^image\x2f/.test(items[i].type)) {
        var f = items[i].getAsFile();
        if (f) files.push(new File([f], 'скриншот-' + new Date().toTimeString().slice(0, 8).replace(/:/g, '-') + '.png', { type: f.type }));
      }
    }
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    } else if (e.clipboardData && e.clipboardData.getData('text/plain')) {
      toast('В буфере текст, а не картинка. Скопируйте скриншот и вставьте снова');
    }
  });

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (introOpen()) {
      if (e.key === 'Escape' || (e.key === 'Enter' && !(t && t.closest && t.closest('[data-ocr-back]')))) { e.preventDefault(); closeIntro(); }
      return;
    }
    if (e.key === 'Escape' && !ui.history.hidden) { setDrawer(false); return; }
    if (e.key === 'Escape' && state.cropping) { drag = null; setCropping(false); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && state.current && !state.busy) {
      e.preventDefault();
      runQueue([state.current]);
      return;
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.key === 'h' || e.code === 'KeyH') && !e.shiftKey) { e.preventDefault(); setDrawer(ui.history.hidden); return; }
    if (!state.current || state.busy) return;
    var k = e.key.toLowerCase();
    if (k === 'r' || e.code === 'KeyR') {
      e.preventDefault();
      var d = e.shiftKey ? -90 : 90;
      edit(function (item) { rotate(item, d); });
    } else if (k === 'c' || e.code === 'KeyC') {
      e.preventDefault();
      setCropping(!state.cropping);
    }
  });

  window.addEventListener('pagehide', function () {
    if (state.worker) state.worker.terminate().catch(function () {});
  });

  setSeg(ui.lang, 'data-lang', state.lang);
  renderQueue();
  renderHistory();
  showEmpty();
  showIntro();
})();
