(function () {
  'use strict';

  function cvtShared() {
    var EXT = { webp: 'webp', avif: 'avif', jpg: 'jpg', png: 'png', ico: 'ico' };
    var MIME = { webp: 'image/webp', avif: 'image/avif', jpg: 'image/jpeg', png: 'image/png', ico: 'image/x-icon' };

    function parseRatio(crop) {
      if (!crop || crop === 'none') return 0;
      var p = String(crop).split(':');
      var a = Number(p[0]), b = Number(p[1]);
      if (!(a > 0) || !(b > 0)) return 0;
      return a / b;
    }

    function geometry(srcW, srcH, opts) {
      opts = opts || {};
      var sx = 0, sy = 0, sw = srcW, sh = srcH;
      var r = parseRatio(opts.crop);
      if (r) {
        if (srcW / srcH > r) {
          sw = Math.max(1, Math.round(srcH * r));
          sx = Math.floor((srcW - sw) / 2);
        } else {
          sh = Math.max(1, Math.round(srcW / r));
          sy = Math.floor((srcH - sh) / 2);
        }
      }
      var maxW = Number(opts.maxW) || 0, maxH = Number(opts.maxH) || 0;
      var scale = 1;
      if (maxW > 0) scale = Math.min(scale, maxW / sw);
      if (maxH > 0) scale = Math.min(scale, maxH / sh);
      var dw = Math.max(1, Math.round(sw * scale));
      var dh = Math.max(1, Math.round(sh * scale));
      return { sx: sx, sy: sy, sw: sw, sh: sh, dw: dw, dh: dh };
    }

    function containSquare(w, h, size) {
      var s = Math.min(size / w, size / h);
      var dw = Math.max(1, Math.round(w * s)), dh = Math.max(1, Math.round(h * s));
      return { x: Math.floor((size - dw) / 2), y: Math.floor((size - dh) / 2), w: dw, h: dh };
    }

    function buildIco(entries) {
      var list = entries.slice().sort(function (a, b) { return a.size - b.size; });
      var head = 6 + 16 * list.length;
      var total = head;
      list.forEach(function (e) { total += e.data.length; });
      var out = new Uint8Array(total);
      var dv = new DataView(out.buffer);
      dv.setUint16(0, 0, true);
      dv.setUint16(2, 1, true);
      dv.setUint16(4, list.length, true);
      var offset = head;
      list.forEach(function (e, i) {
        var p = 6 + i * 16;
        out[p] = e.size >= 256 ? 0 : e.size;
        out[p + 1] = e.size >= 256 ? 0 : e.size;
        out[p + 2] = 0;
        out[p + 3] = 0;
        dv.setUint16(p + 4, 1, true);
        dv.setUint16(p + 6, 32, true);
        dv.setUint32(p + 8, e.data.length, true);
        dv.setUint32(p + 12, offset, true);
        out.set(e.data, offset);
        offset += e.data.length;
      });
      return out;
    }

    function formatBytes(n) {
      if (!(n >= 0)) return '';
      var units = ['Б', 'КБ', 'МБ', 'ГБ'];
      var i = 0, v = n;
      while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
      var digits = i === 0 ? 0 : (v < 10 ? 2 : (v < 100 ? 1 : 0));
      var s = v.toFixed(digits).replace('.', ',');
      if (digits) s = s.replace(/,?0+$/, '');
      return s + ' ' + units[i];
    }

    function savings(before, after) {
      if (!(before > 0) || !(after >= 0)) return null;
      var pct = Math.round((1 - after / before) * 100);
      if (pct === 0 && after !== before) pct = after < before ? 1 : -1;
      return { pct: pct, label: pct > 0 ? '−' + pct + '%' : (pct < 0 ? '+' + (-pct) + '%' : '0%'), smaller: after < before };
    }

    function baseName(name) {
      var n = String(name || 'image').replace(/[\\/:*?"<>|]+/g, '_');
      var i = n.lastIndexOf('.');
      if (i > 0) n = n.slice(0, i);
      return n || 'image';
    }

    function outName(name, format) {
      return baseName(name) + '.' + (EXT[format] || format);
    }

    function uniqueNames(names) {
      var seen = {};
      return names.map(function (n) {
        var key = n.toLowerCase();
        if (!seen[key]) { seen[key] = 1; return n; }
        var i = n.lastIndexOf('.');
        var stem = i > 0 ? n.slice(0, i) : n, ext = i > 0 ? n.slice(i) : '';
        var k = seen[key] + 1, cand;
        do { cand = stem + ' (' + k + ')' + ext; k++; } while (seen[cand.toLowerCase()]);
        seen[key] = k - 1;
        seen[cand.toLowerCase()] = 1;
        return cand;
      });
    }

    function detectKind(name, type) {
      var t = String(type || '').toLowerCase();
      var ext = String(name || '').toLowerCase().split('.').pop();
      if (t === 'image/heic' || t === 'image/heif' || ext === 'heic' || ext === 'heif') return 'heic';
      if (t === 'image/svg+xml' || ext === 'svg') return 'svg';
      if (t.indexOf('image/') === 0) return 'raster';
      if (['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'bmp', 'ico', 'jfif', 'tif', 'tiff'].indexOf(ext) >= 0) return 'raster';
      return '';
    }

    return {
      EXT: EXT, MIME: MIME, parseRatio: parseRatio, geometry: geometry, containSquare: containSquare,
      buildIco: buildIco, formatBytes: formatBytes, savings: savings, baseName: baseName,
      outName: outName, uniqueNames: uniqueNames, detectKind: detectKind
    };
  }

  function cvtWorker(U) {
    var CDN = 'https://cdn.jsdelivr.net/npm/@jsquash/';
    var mods = {};

    function load(name) {
      if (!mods[name]) {
        var p;
        if (name === 'webp') p = import(CDN + 'webp@1.5.0/codec/enc/webp_enc.js').then(function (m) { return m.default({ noInitialRun: true }); });
        else if (name === 'avif') p = import(CDN + 'avif@2.1.1/codec/enc/avif_enc.js').then(function (m) { return m.default({ noInitialRun: true }); });
        else if (name === 'jpg') p = import(CDN + 'jpeg@1.6.0/codec/enc/mozjpeg_enc.js').then(function (m) { return m.default({ noInitialRun: true }); });
        else if (name === 'png') p = import(CDN + 'oxipng@2.3.0/codec/pkg/squoosh_oxipng.js').then(function (m) { return m.default().then(function () { return m; }); });
        mods[name] = p.catch(function (e) { delete mods[name]; throw e; });
      }
      return mods[name];
    }

    var WEBP = { quality: 75, target_size: 0, target_PSNR: 0, method: 4, sns_strength: 50, filter_strength: 60, filter_sharpness: 0, filter_type: 1, partitions: 0, segments: 4, pass: 1, show_compressed: 0, preprocessing: 0, autofilter: 0, partition_limit: 0, alpha_compression: 1, alpha_filtering: 1, alpha_quality: 100, lossless: 0, exact: 0, image_hint: 0, emulate_jpeg_size: 0, thread_level: 0, low_memory: 0, near_lossless: 100, use_delta_palette: 0, use_sharp_yuv: 0 };
    var AVIF = { quality: 50, qualityAlpha: -1, denoiseLevel: 0, tileColsLog2: 0, tileRowsLog2: 0, speed: 6, subsample: 1, chromaDeltaQ: false, sharpness: 0, tune: 0, enableSharpYUV: false, bitDepth: 8, lossless: false };
    var JPEG = { quality: 75, baseline: false, arithmetic: false, progressive: true, optimize_coding: true, smoothing: 0, color_space: 3, quant_table: 3, trellis_multipass: false, trellis_opt_zero: false, trellis_opt_table: false, trellis_loops: 1, auto_subsample: true, chroma_subsample: 2, separate_chroma_quality: false, chroma_quality: 75 };

    function assign(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }

    function canvas(w, h) {
      var c = new OffscreenCanvas(w, h);
      var ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      return { c: c, ctx: ctx };
    }

    function drawScaled(src, sx, sy, sw, sh, dw, dh, bg) {
      var cur = src, cx = sx, cy = sy, cw = sw, ch = sh;
      while (cw / dw > 2 || ch / dh > 2) {
        var nw = Math.max(dw, Math.round(cw / 2)), nh = Math.max(dh, Math.round(ch / 2));
        var step = canvas(nw, nh);
        step.ctx.drawImage(cur, cx, cy, cw, ch, 0, 0, nw, nh);
        cur = step.c; cx = 0; cy = 0; cw = nw; ch = nh;
      }
      var out = canvas(dw, dh);
      if (bg) { out.ctx.fillStyle = bg; out.ctx.fillRect(0, 0, dw, dh); }
      out.ctx.drawImage(cur, cx, cy, cw, ch, 0, 0, dw, dh);
      return out;
    }

    function blobBytes(b) { return b.arrayBuffer().then(function (x) { return new Uint8Array(x); }); }

    function nativeEncode(cv, mime, q) {
      return cv.c.convertToBlob({ type: mime, quality: q }).then(function (b) {
        if (b.type !== mime) throw new Error('Браузер не умеет кодировать ' + mime);
        return blobBytes(b);
      });
    }

    function encodePng(cv) {
      var img = cv.ctx.getImageData(0, 0, cv.c.width, cv.c.height);
      return load('png').then(function (m) {
        return new Uint8Array(m.optimise_raw(new Uint8Array(img.data.buffer), img.width, img.height, 2, false, true));
      }).catch(function () { return nativeEncode(cv, 'image/png'); });
    }

    function encode(cv, s, progress) {
      var f = s.format, q = Math.max(1, Math.min(100, Number(s.quality) || 75));
      if (f === 'png') { progress('encode'); return encodePng(cv); }
      var img = cv.ctx.getImageData(0, 0, cv.c.width, cv.c.height);
      progress('codec');
      return load(f).then(function (m) {
        progress('encode');
        var r;
        if (f === 'webp') r = m.encode(img.data, img.width, img.height, assign(WEBP, s.lossless ? { lossless: 1, quality: 75, exact: 1 } : { quality: q }));
        else if (f === 'avif') r = m.encode(new Uint8Array(img.data.buffer), img.width, img.height, assign(AVIF, s.lossless ? { lossless: true, quality: 100, qualityAlpha: -1, subsample: 3 } : { quality: q }));
        else r = m.encode(img.data, img.width, img.height, assign(JPEG, { quality: q, chroma_quality: q }));
        if (!r) throw new Error('Кодек вернул пустой результат');
        return new Uint8Array(r.buffer ? r.buffer.slice(r.byteOffset || 0, (r.byteOffset || 0) + r.byteLength) : r);
      }).catch(function (e) {
        if (f === 'avif' && !s.lossless) return nativeEncode(cv, 'image/avif', q / 100).catch(function () { throw e; });
        if (f === 'webp' || f === 'jpg') return nativeEncode(cv, U.MIME[f], s.lossless ? 1 : q / 100);
        throw e;
      });
    }

    function makeIco(bitmap, g, s, progress) {
      var sizes = (s.ico && s.ico.length ? s.ico : [16, 32, 48, 256]).slice().sort(function (a, b) { return a - b; });
      var out = [], preview = null;
      progress('encode');
      return sizes.reduce(function (p, size) {
        return p.then(function () {
          var fit = U.containSquare(g.sw, g.sh, size);
          var inner = drawScaled(bitmap, g.sx, g.sy, g.sw, g.sh, fit.w, fit.h);
          var sq = canvas(size, size);
          sq.ctx.drawImage(inner.c, fit.x, fit.y);
          return encodePng(sq).then(function (data) {
            out.push({ size: size, data: data });
            preview = data;
          });
        });
      }, Promise.resolve()).then(function () {
        return { data: U.buildIco(out), preview: preview, w: sizes[sizes.length - 1], h: sizes[sizes.length - 1], sizes: sizes };
      });
    }

    function run(msg) {
      var s = msg.s, bitmap = msg.bitmap, id = msg.id;
      function progress(stage) { self.postMessage({ id: id, gen: msg.gen, type: 'progress', stage: stage }); }
      var g = U.geometry(bitmap.width, bitmap.height, s);
      progress('resize');
      var job;
      if (s.format === 'ico') {
        job = makeIco(bitmap, g, s, progress);
      } else {
        var bg = s.format === 'jpg' ? (s.bg || '#ffffff') : null;
        var cv = drawScaled(bitmap, g.sx, g.sy, g.sw, g.sh, g.dw, g.dh, bg);
        job = encode(cv, s, progress).then(function (data) { return { data: data, w: g.dw, h: g.dh }; });
      }
      return job.then(function (r) {
        try { bitmap.close(); } catch (e) {}
        var prev = r.preview ? r.preview.slice() : null;
        self.postMessage({ id: id, gen: msg.gen, type: 'done', data: r.data, preview: prev, w: r.w, h: r.h, sizes: r.sizes || null }, [r.data.buffer]);
      }).catch(function (e) {
        try { bitmap.close(); } catch (x) {}
        self.postMessage({ id: id, gen: msg.gen, type: 'error', message: String(e && e.message || e) });
      });
    }

    self.onmessage = function (ev) {
      var m = ev.data;
      if (m && m.type === 'warm') { load(m.format).catch(function () {}); return; }
      if (m && m.type === 'job') run(m);
    };
  }

  var U = cvtShared();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { shared: cvtShared, worker: cvtWorker };
  }
  if (typeof document === 'undefined') return;

  function start() {
    var root = document.querySelector('[data-cvt-root]');
    if (!root || root.__cvt) return;
    root.__cvt = true;

    var $ = function (sel, el) { return (el || document).querySelector(sel); };
    var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };

    document.documentElement.classList.add('zh-on');
    if (root.parentNode !== document.body) document.body.appendChild(root);

    var KEY = 'onpress-demo-converter-v1';
    var DEFAULTS = { format: 'webp', q: { webp: 75, avif: 50, jpg: 75 }, lossless: false, maxW: '', maxH: '', crop: 'none', ico: [16, 32, 48, 256], bg: '#ffffff' };
    var S = load();
    var HINTS = {
      webp: 'Универсальный формат для сайтов: легче JPG и держит прозрачность.',
      avif: 'Самый компактный формат: обычно на 20–50% легче WebP, но сжимается дольше.',
      jpg: 'Для фото и максимальной совместимости. Прозрачность заливается фоном.',
      png: 'Без потерь: OxiPNG пересобирает файл, пиксели не меняются.',
      ico: 'Иконка сайта: несколько размеров в одном favicon.ico.'
    };

    function load() {
      var s = JSON.parse(JSON.stringify(DEFAULTS));
      try {
        var raw = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (raw && typeof raw === 'object') {
          if (U.EXT[raw.format]) s.format = raw.format;
          if (raw.q) ['webp', 'avif', 'jpg'].forEach(function (k) { var v = Number(raw.q[k]); if (v >= 1 && v <= 100) s.q[k] = v; });
          s.lossless = !!raw.lossless;
          s.maxW = raw.maxW ? String(raw.maxW) : '';
          s.maxH = raw.maxH ? String(raw.maxH) : '';
          if (raw.crop === 'none' || U.parseRatio(raw.crop)) s.crop = raw.crop;
          if (Array.isArray(raw.ico) && raw.ico.length) s.ico = raw.ico.map(Number).filter(function (n) { return n > 0 && n <= 256; });
          if (!s.ico.length) s.ico = DEFAULTS.ico.slice();
          if (/^#[0-9a-f]{6}$/i.test(raw.bg || '')) s.bg = raw.bg;
        }
      } catch (e) {}
      return s;
    }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

    function jobSettings() {
      return { format: S.format, quality: S.q[S.format] || 75, lossless: S.lossless && (S.format === 'webp' || S.format === 'avif'), maxW: Number(S.maxW) || 0, maxH: Number(S.maxH) || 0, crop: S.crop, ico: S.ico.slice(), bg: S.bg };
    }

    var el = {
      format: $('[data-cvt-format]'), formatHint: $('[data-cvt-format-hint]'),
      qGroup: $('[data-cvt-quality-group]'), q: $('[data-cvt-quality]'), qOut: $('[data-cvt-quality-out]'),
      lossWrap: $('[data-cvt-lossless-wrap]'), loss: $('[data-cvt-lossless]'),
      icoGroup: $('[data-cvt-ico-group]'), ico: $('[data-cvt-ico]'),
      bgGroup: $('[data-cvt-bg-group]'), bg: $('[data-cvt-bg]'),
      sizeGroup: $('[data-cvt-size-group]'), presets: $('[data-cvt-size-presets]'), maxW: $('[data-cvt-maxw]'), maxH: $('[data-cvt-maxh]'),
      crop: $('[data-cvt-crop]'), reset: $('[data-cvt-reset]'),
      empty: $('[data-cvt-empty]'), input: $('[data-cvt-input]'),
      summary: $('[data-cvt-summary]'), count: $('[data-cvt-count]'), clear: $('[data-cvt-clear]'),
      zip: $('[data-cvt-zip]'), zipLabel: $('[data-cvt-zip-label]'), overall: $('[data-cvt-overall]'),
      list: $('[data-cvt-list]'), tpl: $('[data-cvt-item-tpl]'),
      over: $('[data-cvt-over]'), toast: $('[data-cvt-toast]'),
      intro: $('[data-cvt-intro]'), introOpen: $('[data-cvt-intro-open]'), help: $('[data-cvt-help]'),
      viewer: $('[data-cvt-viewer]'), canvas: $('[data-cvt-canvas]'), frame: $('[data-cvt-frame]'),
      before: $('[data-cvt-before]'), after: $('[data-cvt-after]'), handle: $('[data-cvt-handle]'),
      busy: $('[data-cvt-busy]'), busyText: $('[data-cvt-busy-text]'),
      binfo: $('[data-cvt-binfo]'), ainfo: $('[data-cvt-ainfo]'), gain: $('[data-cvt-gain]')
    };

    var introFocus = null;
    function openIntro() {
      introFocus = document.activeElement;
      el.intro.hidden = false;
      requestAnimationFrame(function () { el.intro.classList.add('is-open'); el.introOpen.focus({ preventScroll: true }); });
    }
    function closeIntro() {
      if (el.intro.hidden) return;
      el.intro.classList.remove('is-open');
      el.intro.classList.add('is-closing');
      setTimeout(function () { el.intro.hidden = true; el.intro.classList.remove('is-closing'); }, 220);
      var f = introFocus && introFocus !== document.body ? introFocus : el.empty;
      if (f && f.focus) f.focus({ preventScroll: true });
    }
    el.introOpen.addEventListener('click', closeIntro);
    el.intro.addEventListener('click', function (e) { if (e.target === el.intro) closeIntro(); });
    el.help.addEventListener('click', openIntro);
    el.introOpen.focus({ preventScroll: true });

    function renderSettings() {
      $$('[data-value]', el.format).forEach(function (b) {
        var on = b.getAttribute('data-value') === S.format;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
      el.formatHint.textContent = HINTS[S.format];
      var lossy = S.format === 'webp' || S.format === 'avif' || S.format === 'jpg';
      el.qGroup.hidden = !lossy;
      el.lossWrap.hidden = S.format === 'jpg';
      el.loss.checked = !!S.lossless;
      var qOff = S.lossless && S.format !== 'jpg';
      el.q.disabled = qOff;
      el.qGroup.classList.toggle('is-off', qOff);
      if (lossy) { el.q.value = S.q[S.format]; el.qOut.textContent = qOff ? '100' : S.q[S.format]; }
      paintRange();
      el.icoGroup.hidden = S.format !== 'ico';
      el.sizeGroup.hidden = S.format === 'ico';
      el.bgGroup.hidden = S.format !== 'jpg';
      el.bg.value = S.bg;
      $$('input', el.ico).forEach(function (c) { c.checked = S.ico.indexOf(Number(c.value)) >= 0; });
      if (document.activeElement !== el.maxW) el.maxW.value = S.maxW;
      if (document.activeElement !== el.maxH) el.maxH.value = S.maxH;
      renderPresets();
      $$('[data-value]', el.crop).forEach(function (b) {
        var on = b.getAttribute('data-value') === S.crop;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }
    function renderPresets() {
      $$('[data-size]', el.presets).forEach(function (b) {
        var v = b.getAttribute('data-size');
        b.classList.toggle('is-on', v === '0' ? (!S.maxW && !S.maxH) : (S.maxW === v && S.maxH === v));
      });
    }
    function paintRange() {
      var r = el.q;
      r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
    }

    var changeTimer = null;
    function later(ms) { clearTimeout(changeTimer); changeTimer = setTimeout(reprocessAll, ms); }
    function changed(immediate) {
      save();
      renderSettings();
      later(immediate ? 0 : 320);
      warm();
    }

    el.format.addEventListener('click', function (e) {
      var b = e.target.closest('[data-value]');
      if (!b) return;
      S.format = b.getAttribute('data-value');
      changed(true);
    });
    el.format.addEventListener('keydown', function (e) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
      e.preventDefault();
      e.stopPropagation();
      var keys = Object.keys(U.EXT), i = keys.indexOf(S.format);
      i = (i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + keys.length) % keys.length;
      S.format = keys[i];
      changed(true);
      var nb = $('[data-value="' + S.format + '"]', el.format);
      if (nb) nb.focus();
    });
    el.q.addEventListener('input', function () {
      S.q[S.format] = Number(el.q.value);
      el.qOut.textContent = el.q.value;
      paintRange();
      save();
      later(380);
    });
    el.loss.addEventListener('change', function () { S.lossless = el.loss.checked; changed(true); });
    el.bg.addEventListener('input', function () { S.bg = el.bg.value; changed(); });
    el.ico.addEventListener('change', function () {
      var v = $$('input', el.ico).filter(function (c) { return c.checked; }).map(function (c) { return Number(c.value); });
      if (!v.length) { toast('Нужен хотя бы один размер'); v = [32]; }
      S.ico = v;
      changed();
    });
    el.presets.addEventListener('click', function (e) {
      var b = e.target.closest('[data-size]');
      if (!b) return;
      var v = b.getAttribute('data-size');
      S.maxW = v === '0' ? '' : v; S.maxH = v === '0' ? '' : v;
      changed(true);
    });
    function dimInput(inp, key) {
      inp.addEventListener('input', function () {
        var v = inp.value.replace(/\D/g, '');
        S[key] = v && Number(v) > 0 ? String(Math.min(16384, Number(v))) : '';
        save();
        renderPresets();
        later(600);
      });
      inp.addEventListener('change', renderSettings);
    }
    dimInput(el.maxW, 'maxW');
    dimInput(el.maxH, 'maxH');
    el.crop.addEventListener('click', function (e) {
      var b = e.target.closest('[data-value]');
      if (!b) return;
      S.crop = b.getAttribute('data-value');
      changed(true);
    });
    el.reset.addEventListener('click', function () {
      S = JSON.parse(JSON.stringify(DEFAULTS));
      changed(true);
      toast('Настройки сброшены');
    });

    var items = [];
    var seq = 0;
    var gen = 0;
    var selected = null;

    var pool = [];
    var poolSize = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 4) - 1));
    var workerUrl = null;
    var workerBroken = false;

    function makeWorker() {
      if (!workerUrl) {
        var src = 'var U=(' + cvtShared.toString() + ')();\n(' + cvtWorker.toString() + ')(U);';
        workerUrl = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      }
      var w = new Worker(workerUrl, { type: 'module' });
      var slot = { w: w, item: null, gen: 0 };
      w.onmessage = function (ev) { onWorkerMessage(slot, ev.data); };
      w.onerror = function (ev) {
        if (ev.preventDefault) ev.preventDefault();
        var it = slot.item;
        slot.item = null;
        replaceSlot(slot);
        if (it) fail(it, 'Обработчик упал, попробуйте другой формат');
        schedule();
      };
      return slot;
    }
    function ensurePool() {
      if (workerBroken) return false;
      try {
        while (pool.length < poolSize) pool.push(makeWorker());
        return true;
      } catch (e) {
        workerBroken = true;
        toast('Браузер не поддерживает фоновую обработку');
        return false;
      }
    }
    function replaceSlot(slot) {
      try { slot.w.terminate(); } catch (e) {}
      var i = pool.indexOf(slot);
      if (i >= 0) {
        try { pool[i] = makeWorker(); } catch (e) { pool.splice(i, 1); }
      }
    }
    function warm() {
      if (!items.length || S.format === 'ico' || S.format === 'png') return;
      if (!ensurePool()) return;
      pool.forEach(function (s) { s.w.postMessage({ type: 'warm', format: S.format }); });
    }

    function schedule() {
      if (!ensurePool()) {
        items.forEach(function (it) { if (it.status === 'queued') fail(it, 'Нет поддержки Web Worker'); });
        return;
      }
      pool.forEach(function (slot) {
        if (slot.item) return;
        var it = items.find(function (x) { return x.status === 'queued' && x === selectedItem(); }) || items.find(function (x) { return x.status === 'queued'; });
        if (!it) return;
        it.status = 'working';
        it.stage = 'start';
        slot.item = it;
        slot.gen = it.gen;
        renderItem(it);
        createImageBitmap(it.bitmap).then(function (copy) {
          if (slot.item !== it || slot.gen !== it.gen) { copy.close(); return; }
          slot.w.postMessage({ type: 'job', id: it.id, gen: it.gen, bitmap: copy, s: it.settings }, [copy]);
        }).catch(function () {
          slot.item = null;
          fail(it, 'Не удалось подготовить изображение');
          schedule();
        });
      });
      renderSummary();
    }

    function onWorkerMessage(slot, m) {
      var it = slot.item;
      if (!it || it.id !== m.id || it.gen !== m.gen) {
        if (m.type !== 'progress') { slot.item = null; schedule(); }
        return;
      }
      if (m.type === 'progress') {
        it.stage = m.stage;
        renderItem(it);
        return;
      }
      slot.item = null;
      if (m.type === 'done') {
        var fmt = it.settings.format;
        var blob = new Blob([m.data], { type: U.MIME[fmt] });
        revoke(it, 'after');
        it.result = {
          blob: blob, size: blob.size, w: m.w, h: m.h, sizes: m.sizes, format: fmt,
          url: URL.createObjectURL(blob),
          preview: m.preview ? URL.createObjectURL(new Blob([m.preview], { type: 'image/png' })) : null
        };
        it.status = 'done';
        it.error = '';
      } else {
        fail(it, humanError(m.message), true);
      }
      renderItem(it);
      schedule();
    }

    function humanError(msg) {
      msg = String(msg || '');
      if (/fetch|import|network|Failed to/i.test(msg)) return 'Кодек не загрузился, проверьте интернет';
      if (/memory|allocation|RangeError/i.test(msg)) return 'Не хватило памяти, уменьшите размер';
      return msg || 'Ошибка обработки';
    }
    function fail(it, msg, silent) {
      it.status = 'error';
      it.error = msg;
      if (!silent) renderItem(it);
      renderSummary();
    }
    function revoke(it, which) {
      if (which === 'after' && it.result) {
        URL.revokeObjectURL(it.result.url);
        if (it.result.preview) URL.revokeObjectURL(it.result.preview);
        it.result = null;
      }
      if (which === 'all') {
        revoke(it, 'after');
        if (it.beforeUrl) URL.revokeObjectURL(it.beforeUrl);
      }
    }

    function reprocessAll() {
      gen++;
      var js = jobSettings();
      items.forEach(function (it) {
        if (it.status === 'decoding' || it.status === 'decode-error') return;
        it.gen = gen;
        it.settings = js;
        it.status = 'queued';
        it.stage = '';
        renderItem(it);
      });
      pool.slice().forEach(function (slot) {
        if (slot.item && slot.gen !== gen) { slot.item = null; replaceSlot(slot); }
      });
      schedule();
    }

    var scripts = {};
    function loadScript(src) {
      if (!scripts[src]) {
        scripts[src] = new Promise(function (res, rej) {
          var s = document.createElement('script');
          s.src = src; s.async = true; s.crossOrigin = 'anonymous';
          s.onload = res;
          s.onerror = function () { delete scripts[src]; rej(new Error('script')); };
          document.head.appendChild(s);
        });
      }
      return scripts[src];
    }

    function viaImage(blob, isSvg) {
      return new Promise(function (res, rej) {
        var url = URL.createObjectURL(blob);
        var img = new Image();
        img.decoding = 'async';
        img.onload = function () {
          var w = img.naturalWidth, h = img.naturalHeight;
          if (isSvg) {
            if (!w || !h) { w = 1024; h = 1024; }
            var k = Math.max(w, h) < 1024 ? 1024 / Math.max(w, h) : 1;
            if (Math.max(w, h) * k > 4096) k = 4096 / Math.max(w, h);
            w = Math.round(w * k); h = Math.round(h * k);
          }
          var c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);
          createImageBitmap(c).then(res, rej);
        };
        img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('decode')); };
        img.src = url;
      });
    }

    function decode(file) {
      var kind = U.detectKind(file.name, file.type);
      if (kind === 'svg') return viaImage(file, true).then(function (b) { return { bitmap: b, view: file }; });
      if (kind === 'heic') {
        return createImageBitmap(file).then(function (b) { return { bitmap: b, view: null }; }).catch(function () {
          return loadScript('https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js').then(function () {
            return window.heic2any({ blob: file, toType: 'image/png' });
          }).then(function (out) {
            var png = Array.isArray(out) ? out[0] : out;
            return createImageBitmap(png).then(function (b) { return { bitmap: b, view: png }; });
          });
        });
      }
      return createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (b) { return { bitmap: b, view: file }; }).catch(function () {
        return viaImage(file, false).then(function (b) { return { bitmap: b, view: file }; });
      });
    }

    function bitmapToPng(bitmap) {
      var c = document.createElement('canvas');
      c.width = bitmap.width; c.height = bitmap.height;
      c.getContext('2d').drawImage(bitmap, 0, 0);
      return new Promise(function (res) { c.toBlob(res, 'image/png'); });
    }

    function addFiles(list) {
      var files = Array.prototype.slice.call(list || []);
      var ok = files.filter(function (f) { return U.detectKind(f.name, f.type); });
      var skipped = files.length - ok.length;
      if (skipped) toast(skipped === 1 ? 'Один файл пропущен: это не изображение' : 'Пропущено файлов: ' + skipped + ', это не изображения');
      if (!ok.length) return;
      closeIntro();
      var js = jobSettings();
      var first = null;
      ok.forEach(function (file) {
        var it = { id: ++seq, file: file, name: file.name || ('image-' + seq + '.png'), size: file.size, status: 'decoding', gen: gen, settings: js, result: null, bitmap: null, beforeUrl: null };
        if (!first) first = it;
        items.push(it);
        mountItem(it);
        decode(file).then(function (d) {
          if (items.indexOf(it) < 0) { d.bitmap.close(); return; }
          it.bitmap = d.bitmap;
          it.w = d.bitmap.width; it.h = d.bitmap.height;
          var viewP = d.view ? Promise.resolve(d.view) : bitmapToPng(d.bitmap);
          return viewP.then(function (v) {
            it.beforeUrl = URL.createObjectURL(v);
            it.gen = gen;
            it.settings = jobSettings();
            it.status = 'queued';
            renderItem(it);
            schedule();
          });
        }).catch(function () {
          it.status = 'decode-error';
          it.error = U.detectKind(file.name, file.type) === 'heic' ? 'Не удалось прочитать HEIC' : 'Не удалось прочитать файл';
          renderItem(it);
          renderSummary();
        });
      });
      if (!selectedItem() || selectedItem().status === 'decode-error') select(first);
      renderSummary();
      warm();
    }

    function mountItem(it) {
      var node = el.tpl.content.firstElementChild.cloneNode(true);
      node.setAttribute('data-id', it.id);
      it.el = node;
      it.ref = {
        img: $('.zh-item__img', node), badge: $('[data-el="badge"]', node), name: $('[data-el="name"]', node),
        before: $('[data-el="before"]', node), after: $('[data-el="after"]', node), status: $('[data-el="status"]', node),
        bar: $('[data-el="bar"]', node), save: $('[data-el="save"]', node)
      };
      it.ref.name.textContent = it.name;
      node.title = it.name;
      el.list.appendChild(node);
      requestAnimationFrame(function () { node.classList.add('is-in'); });
      renderItem(it);
    }

    var STAGES = { start: ['Подготовка', 12], resize: ['Масштабирование', 28], codec: ['Загрузка кодека', 40], encode: ['Сжатие', 70] };

    function statusText(it) {
      var st = it.status;
      if (st === 'decoding') return ['Чтение файла', 6];
      if (st === 'queued') return ['В очереди', 4];
      if (st === 'working') return STAGES[it.stage] || STAGES.start;
      if (st === 'done') return ['', 100];
      return [it.error || 'Ошибка', 0];
    }

    function renderItem(it) {
      if (!it.el) return;
      var r = it.ref, st = it.status;
      it.el.className = 'zh-item is-in is-' + st + (it === selectedItem() ? ' is-sel' : '');
      it.el.setAttribute('aria-selected', it === selectedItem() ? 'true' : 'false');
      r.before.textContent = U.formatBytes(it.size);
      var thumb = it.result ? (it.result.preview || it.result.url) : it.beforeUrl;
      if (thumb && r.img.getAttribute('src') !== thumb) r.img.src = thumb;
      r.badge.textContent = it.result ? U.EXT[it.result.format].toUpperCase() : '';
      var t = statusText(it);
      r.status.textContent = t[0];
      r.bar.style.width = t[1] + '%';
      if (it.result && st !== 'error') {
        r.after.textContent = U.formatBytes(it.result.size);
        var sv = U.savings(it.size, it.result.size);
        r.save.textContent = sv ? sv.label : '';
        r.save.className = 'zh-item__save zh__mono ' + (sv && sv.pct > 0 ? 'is-good' : (sv && sv.pct < 0 ? 'is-bad' : '')) + (st !== 'done' ? ' is-stale' : '');
      } else {
        r.after.textContent = st === 'error' || st === 'decode-error' ? '' : '…';
        r.save.textContent = '';
        r.save.className = 'zh-item__save zh__mono';
      }
      $('[data-act="download"]', it.el).disabled = !(it.result && st === 'done');
      if (it === selectedItem()) renderViewer();
      renderSummary();
    }

    var summaryRaf = 0;
    function renderSummary() {
      if (summaryRaf) return;
      summaryRaf = requestAnimationFrame(function () {
        summaryRaf = 0;
        var n = items.length;
        root.classList.toggle('has-items', n > 0);
        el.count.textContent = String(n);
        el.viewer.hidden = !n;
        el.empty.hidden = n > 0;
        el.clear.disabled = !n;
        if (!n) { el.summary.textContent = ''; el.zip.disabled = true; el.zipLabel.textContent = 'Скачать'; el.overall.parentNode.classList.remove('is-busy'); return; }
        var done = items.filter(function (i) { return i.status === 'done'; });
        var errs = items.filter(function (i) { return i.status === 'error' || i.status === 'decode-error'; }).length;
        var busy = n - done.length - errs;
        var inB = 0, outB = 0;
        done.forEach(function (i) { inB += i.size; outB += i.result.size; });
        var parts = [];
        parts.push(busy ? done.length + '/' + (n - errs) : plural(n, 'файл', 'файла', 'файлов'));
        if (done.length) {
          var sv = U.savings(inB, outB);
          parts.push(U.formatBytes(inB) + ' → ' + U.formatBytes(outB) + (sv ? ' ' + sv.label : ''));
        }
        if (errs) parts.push('ошибок: ' + errs);
        el.summary.textContent = parts.join('  ·  ');
        el.overall.style.width = (n - errs ? Math.round(done.length / (n - errs) * 100) : 100) + '%';
        el.overall.parentNode.classList.toggle('is-busy', busy > 0);
        el.zip.disabled = !done.length || zipping;
        if (!zipping) el.zipLabel.textContent = done.length > 1 ? 'ZIP · ' + done.length : 'Скачать';
      });
    }

    function plural(n, a, b, c) {
      var m10 = n % 10, m100 = n % 100;
      var w = m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c);
      return n + ' ' + w;
    }

    function itemById(id) { return items.find(function (i) { return String(i.id) === String(id); }); }
    function selectedItem() { return selected && items.indexOf(selected) >= 0 ? selected : null; }

    function select(it, scroll) {
      var prev = selectedItem();
      selected = it || null;
      if (prev && prev !== it) renderItem(prev);
      if (it) {
        renderItem(it);
        if (scroll && it.el.scrollIntoView) it.el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
      renderViewer();
    }

    function removeItem(it) {
      var i = items.indexOf(it);
      if (i < 0) return;
      var wasSel = it === selectedItem();
      items.splice(i, 1);
      pool.slice().forEach(function (slot) { if (slot.item === it) { slot.item = null; replaceSlot(slot); } });
      if (it.bitmap) try { it.bitmap.close(); } catch (e) {}
      var node = it.el;
      node.classList.remove('is-in');
      node.classList.add('is-out');
      setTimeout(function () { node.remove(); }, 200);
      setTimeout(function () { revoke(it, 'all'); }, 400);
      if (wasSel) select(items[Math.min(i, items.length - 1)] || null);
      renderSummary();
      schedule();
    }

    el.list.addEventListener('click', function (e) {
      var li = e.target.closest('.zh-item');
      var it = itemById(li && li.getAttribute('data-id'));
      if (!it) return;
      var b = e.target.closest('[data-act]');
      if (b) {
        if (b.disabled) return;
        if (b.getAttribute('data-act') === 'remove') removeItem(it);
        else downloadOne(it);
        return;
      }
      select(it);
    });

    var view = { pos: 50, zoom: 'fit', key: '' };

    function renderViewer() {
      var it = selectedItem();
      if (!it) { el.before.removeAttribute('src'); el.after.removeAttribute('src'); view.key = ''; return; }
      var r = it.result;
      var t = statusText(it);
      var busy = it.status === 'working' || it.status === 'queued' || it.status === 'decoding';
      el.busy.hidden = !busy && it.status !== 'error' && it.status !== 'decode-error';
      el.busy.classList.toggle('is-err', it.status === 'error' || it.status === 'decode-error');
      el.busyText.textContent = t[0] || 'Готово';
      if (it.beforeUrl && el.before.getAttribute('src') !== it.beforeUrl) el.before.src = it.beforeUrl;
      var aurl = r ? (r.preview || r.url) : it.beforeUrl;
      if (aurl && el.after.getAttribute('src') !== aurl) el.after.src = aurl;
      el.frame.classList.toggle('is-single', !r);
      el.frame.classList.toggle('is-stale', !!r && it.status !== 'done');
      var w = r ? r.w : it.w, h = r ? r.h : it.h;
      el.before.style.objectFit = r && r.format === 'ico' ? 'contain' : 'cover';
      view.natW = w || 1; view.natH = h || 1;
      var key = it.id + ':' + w + 'x' + h;
      if (key !== view.key) { view.key = key; layout(); }
      el.binfo.textContent = U.formatBytes(it.size) + (it.w ? ' · ' + it.w + '×' + it.h : '');
      if (r) {
        var sv = U.savings(it.size, r.size);
        el.ainfo.textContent = U.formatBytes(r.size) + ' · ' + (r.sizes ? r.sizes.join(', ') + ' px' : r.w + '×' + r.h);
        el.gain.textContent = sv ? sv.label : '';
        el.gain.className = 'zh__gain zh__mono ' + (sv && sv.pct > 0 ? 'is-good' : (sv && sv.pct < 0 ? 'is-bad' : '')) + (it.status !== 'done' ? ' is-stale' : '');
      } else {
        el.ainfo.textContent = it.status === 'error' || it.status === 'decode-error' ? '—' : '…';
        el.gain.textContent = '';
        el.gain.className = 'zh__gain zh__mono';
      }
    }

    function layout() {
      if (!selectedItem()) return;
      var cw = el.canvas.clientWidth - 48, ch = el.canvas.clientHeight - 48;
      var ratio = view.natW / view.natH, w, h;
      if (view.zoom === 'fit') {
        w = cw; h = w / ratio;
        if (h > ch) { h = ch; w = h * ratio; }
        if (w > view.natW * 4) { w = view.natW * 4; h = w / ratio; }
      } else {
        var z = Number(view.zoom);
        w = view.natW * z; h = view.natH * z;
      }
      el.frame.style.width = Math.max(1, Math.round(w)) + 'px';
      el.frame.style.height = Math.max(1, Math.round(h)) + 'px';
      el.canvas.classList.toggle('is-scroll', w > cw + 1 || h > ch + 1);
      el.frame.classList.toggle('is-pixel', w > view.natW * 1.5);
      $$('[data-zoom]', root).forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-zoom') === view.zoom); });
    }

    function setZoom(z) {
      view.zoom = z;
      layout();
      if (z !== 'fit') {
        el.canvas.scrollLeft = (el.canvas.scrollWidth - el.canvas.clientWidth) / 2;
        el.canvas.scrollTop = (el.canvas.scrollHeight - el.canvas.clientHeight) / 2;
      }
    }

    function setPos(p) {
      view.pos = Math.max(0, Math.min(100, p));
      el.frame.style.setProperty('--pos', view.pos + '%');
      el.handle.setAttribute('aria-valuenow', String(Math.round(view.pos)));
    }

    function posFromEvent(e) {
      var r = el.frame.getBoundingClientRect();
      return (e.clientX - r.left) / r.width * 100;
    }

    var drag = null;
    el.frame.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || el.frame.classList.contains('is-single')) return;
      var onHandle = !!e.target.closest('[data-cvt-handle]');
      if (el.canvas.classList.contains('is-scroll') && (e.altKey || (!onHandle && e.pointerType === 'touch'))) {
        drag = { pan: true, x: e.clientX, y: e.clientY, sl: el.canvas.scrollLeft, st: el.canvas.scrollTop };
      } else {
        drag = { pan: false };
        setPos(posFromEvent(e));
      }
      el.frame.setPointerCapture(e.pointerId);
      el.frame.classList.add('is-drag');
      e.preventDefault();
    });
    el.frame.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (drag.pan) {
        el.canvas.scrollLeft = drag.sl - (e.clientX - drag.x);
        el.canvas.scrollTop = drag.st - (e.clientY - drag.y);
      } else setPos(posFromEvent(e));
    });
    function endDrag() { drag = null; el.frame.classList.remove('is-drag'); }
    el.frame.addEventListener('pointerup', endDrag);
    el.frame.addEventListener('pointercancel', endDrag);
    el.handle.addEventListener('keydown', function (e) {
      if (e.key === 'Home') { e.preventDefault(); setPos(0); }
      if (e.key === 'End') { e.preventDefault(); setPos(100); }
    });

    $$('[data-zoom]', root).forEach(function (b) {
      b.addEventListener('click', function () { setZoom(b.getAttribute('data-zoom')); });
    });
    window.addEventListener('resize', function () { layout(); });

    function stepSel(d) {
      if (!items.length) return;
      var i = items.indexOf(selectedItem());
      var n = items[Math.max(0, Math.min(items.length - 1, (i < 0 ? 0 : i + d)))];
      if (n) select(n, true);
    }

    function isField(t) {
      if (!t) return false;
      if (t.tagName === 'TEXTAREA' || t.isContentEditable) return true;
      return t.tagName === 'INPUT' && t.type !== 'checkbox' && t.type !== 'range' && t.type !== 'color';
    }

    document.addEventListener('keydown', function (e) {
      if (!el.intro.hidden) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          if (e.key === 'Enter' && document.activeElement && document.activeElement.classList.contains('zh-intro__back')) return;
          e.preventDefault();
          closeIntro();
        } else if (e.key === 'Tab') {
          var f = [el.introOpen, $('.zh-intro__back', el.intro)];
          var i = f.indexOf(document.activeElement);
          e.preventDefault();
          f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
        }
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || isField(e.target)) return;
      var t = e.target;
      var inRange = t && t.type === 'range';
      var k = e.key;
      if ((k === 'ArrowLeft' || k === 'ArrowRight') && !inRange && selectedItem()) {
        e.preventDefault();
        setPos(view.pos + (k === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 20 : 5));
      } else if ((k === 'ArrowUp' || k === 'ArrowDown') && !inRange) {
        e.preventDefault();
        stepSel(k === 'ArrowUp' ? -1 : 1);
      } else if (k === '0' || k === '1' || k === '2') {
        setZoom(k === '0' ? 'fit' : k);
      } else if (k === 's' || k === 'S' || k === 'ы' || k === 'Ы') {
        e.preventDefault();
        if (!el.zip.disabled) el.zip.click();
      } else if (k === 'o' || k === 'O' || k === 'щ' || k === 'Щ') {
        e.preventDefault();
        el.input.click();
      } else if ((k === 'Delete' || k === 'Backspace') && selectedItem()) {
        e.preventDefault();
        removeItem(selectedItem());
      } else if (k === '?') {
        openIntro();
      }
    });

    function downloadUrl(url, name) {
      var a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    function downloadOne(it) {
      if (!it || !it.result) return;
      downloadUrl(it.result.url, U.outName(it.name, it.result.format));
    }

    var zipping = false;
    el.zip.addEventListener('click', function () {
      var done = items.filter(function (i) { return i.status === 'done' && i.result; });
      if (!done.length || zipping) return;
      if (done.length === 1) { downloadOne(done[0]); return; }
      zipping = true;
      el.zip.disabled = true;
      el.zipLabel.textContent = 'Пакую…';
      var names = U.uniqueNames(done.map(function (i) { return U.outName(i.name, i.result.format); }));
      loadScript('https://cdn.jsdelivr.net/npm/fflate@0.8.3/umd/index.js').then(function () {
        return Promise.all(done.map(function (i) { return i.result.blob.arrayBuffer(); }));
      }).then(function (bufs) {
        var files = {};
        bufs.forEach(function (b, k) { files[names[k]] = [new Uint8Array(b), { level: 0 }]; });
        return new Promise(function (res, rej) {
          window.fflate.zip(files, { level: 0 }, function (err, data) { if (err) rej(err); else res(data); });
        });
      }).then(function (data) {
        var url = URL.createObjectURL(new Blob([data], { type: 'application/zip' }));
        var d = new Date();
        var stamp = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        downloadUrl(url, 'zhmyh-' + stamp + '.zip');
        setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
        toast('Архив готов: ' + plural(done.length, 'файл', 'файла', 'файлов'));
      }).catch(function () {
        toast('Не удалось собрать архив, проверьте интернет');
      }).then(function () {
        zipping = false;
        renderSummary();
      });
    });

    el.clear.addEventListener('click', function () { items.slice().forEach(removeItem); });

    $$('[data-cvt-add]', root).forEach(function (b) { b.addEventListener('click', function () { el.input.click(); }); });
    el.empty.addEventListener('click', function () { el.input.click(); });
    el.empty.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.input.click(); }
    });
    el.input.addEventListener('change', function () {
      addFiles(el.input.files);
      el.input.value = '';
    });

    var dragDepth = 0;
    function hasFiles(e) {
      var t = e.dataTransfer && e.dataTransfer.types;
      return t && Array.prototype.indexOf.call(t, 'Files') >= 0;
    }
    window.addEventListener('dragenter', function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth++;
      el.over.classList.add('is-on');
    });
    window.addEventListener('dragover', function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    window.addEventListener('dragleave', function (e) {
      if (!hasFiles(e)) return;
      dragDepth = Math.max(0, dragDepth - 1);
      if (!dragDepth) el.over.classList.remove('is-on');
    });
    window.addEventListener('drop', function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth = 0;
      el.over.classList.remove('is-on');
      addFiles(e.dataTransfer.files);
    });
    document.addEventListener('paste', function (e) {
      if (isField(e.target)) return;
      var files = Array.prototype.slice.call((e.clipboardData && e.clipboardData.files) || []);
      if (!files.length) return;
      e.preventDefault();
      addFiles(files.map(function (f, i) {
        if (f.name && f.name !== 'image.png') return f;
        var ext = (f.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
        try { return new File([f], 'buffer-' + (seq + i + 1) + '.' + ext, { type: f.type }); } catch (x) { return f; }
      }));
      toast('Картинка из буфера добавлена');
    });

    var toastTimer = 0;
    function toast(msg) {
      el.toast.textContent = msg;
      el.toast.classList.add('is-on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { el.toast.classList.remove('is-on'); }, 2600);
    }

    window.addEventListener('beforeunload', function (e) {
      if (items.some(function (i) { return i.status === 'done'; })) { e.preventDefault(); e.returnValue = ''; }
    });

    window.__zh = { items: items, pool: pool, select: select, setPos: setPos, addFiles: addFiles };

    setPos(50);
    renderSettings();
    renderSummary();
    layout();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
