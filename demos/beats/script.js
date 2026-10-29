(function () {
  'use strict';

  var TRACKS = [
    { id: 'bd', short: 'BD', name: 'Бочка', vol: 90 },
    { id: 'sd', short: 'SD', name: 'Малый', vol: 75 },
    { id: 'cp', short: 'CP', name: 'Хлопок', vol: 70 },
    { id: 'rs', short: 'RS', name: 'Римшот', vol: 60 },
    { id: 'ch', short: 'CH', name: 'Закрытый хэт', vol: 55 },
    { id: 'oh', short: 'OH', name: 'Открытый хэт', vol: 50 },
    { id: 'lt', short: 'LT', name: 'Низкий том', vol: 70 },
    { id: 'ht', short: 'HT', name: 'Высокий том', vol: 65 },
    { id: 'cb', short: 'CB', name: 'Ковбелл', vol: 45 },
    { id: 'cy', short: 'CY', name: 'Тарелка', vol: 45 },
    { id: 'bs', short: 'BS', name: 'Бас', vol: 75 }
  ];
  var IDS = TRACKS.map(function (t) { return t.id; });
  var MAXLEN = 32;
  var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var NOTE_MIN = 24;
  var NOTE_MAX = 71;
  var STORE_KEY = 'op-demo-beats-v1';
  var PAT_NAMES = ['A', 'B', 'C', 'D'];

  var PRESETS = [
    { id: 'electro', name: 'Электро', bpm: 118, swing: 0, t: {
      bd: 'X.....x...X..x..', sd: '....X.......X...', cp: '....x.......x...',
      ch: 'XxxxXxxxXxxxXxxx', oh: '..............x.', cb: '..x.....x..x....' },
      b: 'C2! . . C2 . . D#2 . C2 . . G1 . . A#1 .' },
    { id: 'hiphop', name: 'Хип-хоп', bpm: 90, swing: 55, t: {
      bd: 'X......X..X.....', sd: '....X.......X...', rs: '...........x....',
      ch: 'x.x.x.x.x.x.x.xx', oh: '.............x..' },
      b: 'C2! . . . . . . C2 . . D#2 . . . G1~ A#1' },
    { id: 'house', name: 'Хаус', bpm: 124, swing: 12, t: {
      bd: 'X...X...X...X...', cp: '....X.......X...', ch: '.x.x.x.x.x.x.x.x',
      oh: '..x...x...x...x.', rs: '.......x.......x' },
      b: '. . F1 . . . F1 . . . G#1 . . . A#1! F2' },
    { id: 'techno', name: 'Техно', bpm: 132, swing: 0, t: {
      bd: 'X...X...X...X...', cp: '....x.......x...', ch: 'xxXxxxXxxxXxxxXx',
      rs: '..x..x....x..x..', cy: 'x...............' },
      b: '. . A1 A1 . . A1! . . . A1 A1 . . C2 A1' },
    { id: 'trap', name: 'Трэп', bpm: 140, swing: 0, t: {
      bd: 'X.....X.......x.', sd: '........X.......', cp: '........x.......',
      ch: 'x.x.x.x.xxxxx.x.', oh: '......x.........' },
      b: 'C1! . . . . . C1 . . . D#1~ F1 . . . .' },
    { id: 'breaks', name: 'Брейкбит', bpm: 136, swing: 8, t: {
      bd: 'X.........X.....', sd: '....X..x.x..X..x', ch: 'x.x.x.x.x.x.x.x.',
      oh: '..............x.', ht: '...............x' },
      b: 'E1! . . . . . . E1 . . G1 . A1 . . .' },
    { id: 'disco', name: 'Диско', bpm: 118, swing: 0, t: {
      bd: 'X...X...X...X...', sd: '....X.......X...', oh: '..X...X...X...X.',
      ch: 'x...x...x...x...', cb: '...x.......x....' },
      b: 'C2 C3 . C2 C3 . C2 C3 . D#2 D#3 . F2 F3 G2 G3' },
    { id: 'reggaeton', name: 'Реггетон', bpm: 96, swing: 0, t: {
      bd: 'X...X...X...X...', sd: '...x..x....x..x.', ch: 'x.x.x.x.x.x.x.x.',
      rs: '...x..x....x..x.' },
      b: 'A1! . . A1 . . A1 . C2! . . C2 . . G1 .' }
  ];

  function clamp(v, a, b, d) {
    v = Number(v);
    if (!isFinite(v)) v = d == null ? a : d;
    return Math.min(b, Math.max(a, v));
  }
  function filled(n, v) { var a = []; for (var i = 0; i < n; i++) a.push(v); return a; }
  function noteName(m) { return NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); }
  function parseNote(s) {
    var m = /^([A-G]#?)(-?\d)$/.exec(String(s));
    if (!m) return null;
    return NOTE_NAMES.indexOf(m[1]) + (Number(m[2]) + 1) * 12;
  }
  function midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function emptyPattern() {
    var steps = {};
    IDS.forEach(function (id) { steps[id] = filled(MAXLEN, 0); });
    return { steps: steps, notes: filled(MAXLEN, 36), slides: filled(MAXLEN, 0) };
  }
  function clonePattern(p) {
    var q = emptyPattern();
    IDS.forEach(function (id) { q.steps[id] = p.steps[id].slice(); });
    q.notes = p.notes.slice();
    q.slides = p.slides.slice();
    return q;
  }
  function hasContent(p, len) {
    len = len || MAXLEN;
    for (var k = 0; k < IDS.length; k++) {
      for (var i = 0; i < len; i++) if (p.steps[IDS[k]][i]) return true;
    }
    return false;
  }
  function halfEmpty(p) {
    for (var k = 0; k < IDS.length; k++) {
      for (var i = 16; i < MAXLEN; i++) if (p.steps[IDS[k]][i]) return false;
    }
    return true;
  }
  function copyFirstHalf(p) {
    IDS.forEach(function (id) { for (var i = 16; i < MAXLEN; i++) p.steps[id][i] = p.steps[id][i - 16]; });
    for (var i = 16; i < MAXLEN; i++) { p.notes[i] = p.notes[i - 16]; p.slides[i] = p.slides[i - 16]; }
  }

  function applyPreset(pr) {
    var p = emptyPattern();
    IDS.forEach(function (id) {
      var s = pr.t[id] || '';
      for (var i = 0; i < MAXLEN; i++) {
        var c = s.charAt(i % 16);
        p.steps[id][i] = c === 'X' ? 2 : c === 'x' ? 1 : 0;
      }
    });
    if (pr.b) {
      var tok = pr.b.split(/\s+/);
      for (var i = 0; i < MAXLEN; i++) {
        var tk = tok[i % tok.length];
        if (!tk || tk === '.') continue;
        var n = parseNote(tk.replace(/[!~]/g, ''));
        if (n == null) continue;
        p.steps.bs[i] = tk.indexOf('!') >= 0 ? 2 : 1;
        p.notes[i] = clamp(n, NOTE_MIN, NOTE_MAX);
        p.slides[i] = tk.indexOf('~') >= 0 ? 1 : 0;
      }
    }
    return p;
  }

  function randomPattern(rnd) {
    rnd = rnd || Math.random;
    function chance(x) { return rnd() < x; }
    function pick(a) { return a[Math.floor(rnd() * a.length) % a.length]; }
    var p = emptyPattern();
    var s = p.steps;
    var hatMode = pick(['8', '16', 'off', '16acc']);
    var clap = chance(0.5);
    var scale = pick([[0, 3, 5, 7, 10], [0, 2, 3, 5, 7, 8, 10], [0, 3, 7, 10, 12]]);
    var root = 33 + Math.floor(rnd() * 8);
    for (var i = 0; i < 16; i++) {
      if (i === 0) s.bd[i] = 2;
      else if (i % 4 === 0) s.bd[i] = chance(0.55) ? 1 : 0;
      else s.bd[i] = chance(i % 2 ? 0.07 : 0.2) ? 1 : 0;
      if (i === 4 || i === 12) s.sd[i] = 2;
      else if (i % 2 === 1 && chance(0.1)) s.sd[i] = 1;
      if (clap && (i === 4 || i === 12)) s.cp[i] = 1;
      if (hatMode === '8') s.ch[i] = i % 2 === 0 ? (i % 4 === 0 ? 2 : 1) : 0;
      else if (hatMode === '16') s.ch[i] = chance(0.9) ? 1 : 0;
      else if (hatMode === '16acc') s.ch[i] = i % 4 === 2 ? 2 : 1;
      else s.oh[i] = i % 4 === 2 ? 1 : 0;
      if (hatMode !== 'off' && i % 4 === 2 && chance(0.18)) { s.oh[i] = 1; s.ch[i] = 0; }
      if (chance(0.07)) s.rs[i] = 1;
      if (chance(0.05)) s.cb[i] = 1;
      if (i >= 12 && chance(0.2)) s[chance(0.5) ? 'lt' : 'ht'][i] = 1;
      var on = i % 4 === 0 ? chance(0.6) : chance(0.28);
      if (on) {
        s.bs[i] = chance(0.2) ? 2 : 1;
        p.notes[i] = clamp(root + pick(scale) + (chance(0.15) ? 12 : 0), NOTE_MIN, NOTE_MAX);
        p.slides[i] = chance(0.1) ? 1 : 0;
      }
    }
    if (chance(0.3)) s.cy[0] = 1;
    copyFirstHalf(p);
    for (var j = 28; j < 32; j++) {
      if (chance(0.45)) s.sd[j] = j === 28 ? 2 : 1;
      if (chance(0.3)) s[chance(0.5) ? 'lt' : 'ht'][j] = 1;
    }
    return p;
  }

  function defaultMix() {
    var m = {};
    TRACKS.forEach(function (t) { m[t.id] = { vol: t.vol, pan: 0, mute: false, solo: false }; });
    m.ch.pan = -15;
    m.oh.pan = -15;
    m.cb.pan = 20;
    m.ht.pan = 25;
    m.lt.pan = -20;
    return m;
  }
  function presetById(id) { for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i]; return null; }
  function defaultState(blank) {
    var st = { bpm: 118, swing: 0, master: 80, len: 16, chain: false, cur: 0, vis: 'scope', mix: defaultMix(),
      patterns: [emptyPattern(), emptyPattern(), emptyPattern(), emptyPattern()] };
    if (!blank) {
      st.patterns[0] = applyPreset(presetById('electro'));
      st.patterns[1] = applyPreset(presetById('electro'));
      var b = st.patterns[1].steps;
      b.cy[0] = 1;
      b.ch = filled(MAXLEN, 0);
      for (var i = 0; i < MAXLEN; i++) b.ch[i] = i % 2 === 0 ? 1 : 0;
      [12, 13, 14, 15, 28, 29, 30, 31].forEach(function (i, k) { b[k % 4 < 2 ? 'ht' : 'lt'][i] = k % 4 === 0 ? 2 : 1; });
    }
    return st;
  }

  function trimZeros(s) { return s.replace(/0+$/, ''); }
  function serialize(st) {
    return JSON.stringify({
      v: 1, b: st.bpm, s: st.swing, m: st.master, l: st.len, c: st.chain ? 1 : 0, k: st.cur, w: st.vis,
      p: st.patterns.map(function (p) {
        if (!hasContent(p)) return 0;
        var t = {};
        IDS.forEach(function (id) { var s = trimZeros(p.steps[id].join('')); if (s) t[id] = s; });
        var o = { t: t };
        if (t.bs) {
          o.n = p.notes.map(function (n) { return String.fromCharCode(48 + clamp(n, NOTE_MIN, NOTE_MAX) - NOTE_MIN); }).join('');
          var g = trimZeros(p.slides.join(''));
          if (g) o.g = g;
        }
        return o;
      }),
      x: IDS.map(function (id) { var m = st.mix[id]; return [m.vol, m.pan, m.mute ? 1 : 0, m.solo ? 1 : 0]; })
    });
  }
  function deserialize(str) {
    var o = typeof str === 'string' ? JSON.parse(str) : str;
    if (!o || o.v !== 1 || !Array.isArray(o.p)) throw new Error('bad state');
    var st = defaultState(true);
    st.bpm = Math.round(clamp(o.b, 40, 220, 120));
    st.swing = Math.round(clamp(o.s, 0, 100, 0));
    st.master = Math.round(clamp(o.m, 0, 100, 80));
    st.len = o.l === 32 ? 32 : 16;
    st.chain = !!o.c;
    st.cur = Math.round(clamp(o.k, 0, 3, 0));
    st.vis = o.w === 'spectrum' ? 'spectrum' : 'scope';
    st.patterns = [0, 1, 2, 3].map(function (i) {
      var src = o.p[i];
      var p = emptyPattern();
      if (!src || typeof src !== 'object') return p;
      var t = src.t || {};
      IDS.forEach(function (id) {
        var s = String(t[id] || '');
        for (var j = 0; j < MAXLEN; j++) { var c = s.charAt(j); p.steps[id][j] = c === '2' ? 2 : c === '1' ? 1 : 0; }
      });
      var n = String(src.n || '');
      for (var j = 0; j < MAXLEN; j++) {
        var cc = n.charCodeAt(j);
        if (cc >= 48 && cc <= 48 + NOTE_MAX - NOTE_MIN) p.notes[j] = cc - 48 + NOTE_MIN;
      }
      var g = String(src.g || '');
      for (var k = 0; k < MAXLEN; k++) p.slides[k] = g.charAt(k) === '1' ? 1 : 0;
      return p;
    });
    if (Array.isArray(o.x)) {
      IDS.forEach(function (id, i) {
        var a = o.x[i];
        if (!Array.isArray(a)) return;
        st.mix[id] = { vol: Math.round(clamp(a[0], 0, 100, 70)), pan: Math.round(clamp(a[1], -100, 100, 0)), mute: !!a[2], solo: !!a[3] };
      });
    }
    return st;
  }

  function b64urlEncode(s) {
    return btoa(s).split('+').join('-').split('/').join('_').replace(/=+$/, '');
  }
  function b64urlDecode(s) {
    s = String(s).split('-').join('+').split('_').join('/');
    while (s.length % 4) s += '=';
    return atob(s);
  }
  function encodeShare(st) { return b64urlEncode(serialize(st)); }
  function decodeShare(h) { return deserialize(b64urlDecode(h)); }

  function chainList(st) {
    var l = [];
    for (var i = 0; i < 4; i++) if (hasContent(st.patterns[i], st.len)) l.push(i);
    return l.length ? l : [st.cur];
  }
  function nextInChain(st, pi) {
    var l = chainList(st);
    var i = l.indexOf(pi);
    return i < 0 ? l[0] : l[(i + 1) % l.length];
  }
  function stepDur(bpm) { return 60 / bpm / 4; }
  function swingOffset(i, sd, swing) { return i % 2 ? (swing / 100) * sd * 0.5 : 0; }
  function audible(mix, id) {
    var solo = IDS.some(function (k) { return mix[k].solo; });
    return solo ? mix[id].solo : !mix[id].mute;
  }
  function tapTempo(times) {
    if (times.length < 2) return 0;
    var d = [];
    for (var i = 1; i < times.length; i++) d.push(times[i] - times[i - 1]);
    var avg = d.reduce(function (a, b) { return a + b; }, 0) / d.length;
    return Math.round(clamp(60000 / avg, 40, 220));
  }

  function encodeWav(buf) {
    var ch = buf.numberOfChannels, sr = buf.sampleRate, len = buf.length;
    var data = [];
    for (var c = 0; c < ch; c++) data.push(buf.getChannelData(c));
    var last = 0;
    for (var i = len - 1; i >= 0; i--) {
      var loud = false;
      for (var c2 = 0; c2 < ch; c2++) if (Math.abs(data[c2][i]) > 0.0004) { loud = true; break; }
      if (loud) { last = i; break; }
    }
    len = Math.min(len, last + Math.floor(sr * 0.05) + 1);
    var bytes = len * ch * 2;
    var view = new DataView(new ArrayBuffer(44 + bytes));
    function str(o, s) { for (var k = 0; k < s.length; k++) view.setUint8(o + k, s.charCodeAt(k)); }
    str(0, 'RIFF'); view.setUint32(4, 36 + bytes, true); str(8, 'WAVE'); str(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, ch, true);
    view.setUint32(24, sr, true); view.setUint32(28, sr * ch * 2, true); view.setUint16(32, ch * 2, true);
    view.setUint16(34, 16, true); str(36, 'data'); view.setUint32(40, bytes, true);
    var off = 44;
    for (var j = 0; j < len; j++) {
      for (var c3 = 0; c3 < ch; c3++) {
        var x = Math.max(-1, Math.min(1, data[c3][j]));
        view.setInt16(off, x < 0 ? x * 32768 : x * 32767, true);
        off += 2;
      }
    }
    return view.buffer;
  }

  var noiseCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var chokeCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  function noiseBuf(ctx) {
    var b = noiseCache && noiseCache.get(ctx);
    if (b) return b;
    var n = Math.floor(ctx.sampleRate * 1.6);
    b = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    if (noiseCache) noiseCache.set(ctx, b);
    return b;
  }
  function noise(ctx, t, dur) {
    var s = ctx.createBufferSource();
    s.buffer = noiseBuf(ctx);
    s.start(t);
    s.stop(t + dur);
    return s;
  }
  function env(ctx, t, peak, decay, attack) {
    var a = attack || 0.002;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + decay);
    return g;
  }
  function osc(ctx, type, f, t, dur) {
    var o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.start(t);
    o.stop(t + dur);
    return o;
  }
  function filt(ctx, type, f, q) {
    var b = ctx.createBiquadFilter();
    b.type = type;
    b.frequency.value = f;
    if (q != null) b.Q.value = q;
    return b;
  }
  function chain() {
    for (var i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]);
    return arguments[arguments.length - 1];
  }
  var METAL = [2, 3, 4.16, 5.43, 6.79, 8.21];
  function metal(ctx, out, t, v, decay, center, hp) {
    var sum = ctx.createGain();
    sum.gain.value = 2.4;
    METAL.forEach(function (r) { osc(ctx, 'square', 40 * r, t, decay + 0.05).connect(sum); });
    chain(sum, filt(ctx, 'bandpass', center, 0.9), filt(ctx, 'highpass', hp), env(ctx, t, v, decay, 0.001), out);
  }
  function tom(ctx, out, t, v, f) {
    var s = osc(ctx, 'sine', f * 1.5, t, 0.6);
    s.frequency.exponentialRampToValueAtTime(f, t + 0.08);
    chain(s, env(ctx, t, v * 0.9, 0.42, 0.001), out);
    chain(noise(ctx, t, 0.05), filt(ctx, 'bandpass', f * 6, 1), env(ctx, t, v * 0.12, 0.03, 0.001), out);
  }

  var VOICE = {
    bd: function (ctx, out, t, v) {
      var s = osc(ctx, 'sine', 160, t, 0.9);
      s.frequency.exponentialRampToValueAtTime(52, t + 0.08);
      s.frequency.exponentialRampToValueAtTime(42, t + 0.6);
      chain(s, env(ctx, t, v * 1.1, 0.75, 0.001), out);
      chain(osc(ctx, 'triangle', 1400, t, 0.03), env(ctx, t, v * 0.22, 0.015, 0.0005), out);
    },
    sd: function (ctx, out, t, v) {
      [180, 330].forEach(function (f, i) {
        var s = osc(ctx, 'triangle', f, t, 0.2);
        s.frequency.exponentialRampToValueAtTime(f * 0.8, t + 0.1);
        chain(s, env(ctx, t, v * (i ? 0.25 : 0.45), 0.11, 0.001), out);
      });
      chain(noise(ctx, t, 0.35), filt(ctx, 'highpass', 1200), filt(ctx, 'lowpass', 9000), env(ctx, t, v * 0.6, 0.22, 0.001), out);
    },
    cp: function (ctx, out, t, v) {
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      [0, 0.011, 0.022].forEach(function (d) {
        g.gain.setValueAtTime(v * 0.9, t + d);
        g.gain.exponentialRampToValueAtTime(v * 0.12, t + d + 0.009);
      });
      g.gain.setValueAtTime(v * 0.75, t + 0.033);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
      var mk = ctx.createGain();
      mk.gain.value = 2.6;
      chain(noise(ctx, t, 0.3), filt(ctx, 'bandpass', 1150, 1.2), g, mk, out);
    },
    rs: function (ctx, out, t, v) {
      var bp = filt(ctx, 'bandpass', 1700, 2.5);
      osc(ctx, 'square', 1720, t, 0.06).connect(bp);
      osc(ctx, 'triangle', 480, t, 0.06).connect(bp);
      chain(bp, env(ctx, t, v * 0.8, 0.035, 0.0005), out);
    },
    ch: function (ctx, out, t, v) {
      var c = chokeCache && chokeCache.get(ctx);
      if (c) { c.gain.setValueAtTime(1, t); c.gain.setTargetAtTime(0, t, 0.008); chokeCache.delete(ctx); }
      metal(ctx, out, t, v * 0.55, 0.055, 10000, 7000);
    },
    oh: function (ctx, out, t, v) {
      var c = ctx.createGain();
      c.connect(out);
      metal(ctx, c, t, v * 0.5, 0.42, 10000, 7000);
      if (chokeCache) chokeCache.set(ctx, c);
    },
    lt: function (ctx, out, t, v) { tom(ctx, out, t, v, 95); },
    ht: function (ctx, out, t, v) { tom(ctx, out, t, v, 165); },
    cb: function (ctx, out, t, v) {
      var sum = ctx.createGain();
      sum.gain.value = 1.1;
      osc(ctx, 'square', 540, t, 0.45).connect(sum);
      osc(ctx, 'square', 800, t, 0.45).connect(sum);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v * 0.55, t + 0.002);
      g.gain.exponentialRampToValueAtTime(v * 0.18, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
      chain(sum, filt(ctx, 'bandpass', 900, 1.4), g, out);
    },
    cy: function (ctx, out, t, v) {
      metal(ctx, out, t, v * 0.3, 1.4, 8000, 5000);
      chain(noise(ctx, t, 1.3), filt(ctx, 'highpass', 6000), env(ctx, t, v * 0.18, 1.2, 0.002), out);
    },
    bs: function (ctx, out, t, v, o) {
      o = o || { note: 36, len: 0.2 };
      var f = midiHz(o.note), end = t + o.len;
      var saw = ctx.createOscillator(), sub = ctx.createOscillator();
      saw.type = 'sawtooth';
      sub.type = 'sine';
      [saw, sub].forEach(function (x) {
        x.frequency.setValueAtTime(f, t);
        if (o.slideTo) {
          x.frequency.setValueAtTime(f, t + o.len * 0.6);
          x.frequency.exponentialRampToValueAtTime(midiHz(o.slideTo), end);
        }
        x.start(t);
        x.stop(end + 0.12);
      });
      var lp = filt(ctx, 'lowpass', 200, o.acc ? 13 : 8);
      lp.frequency.setValueAtTime(o.acc ? 3400 : 1900, t);
      lp.frequency.exponentialRampToValueAtTime(230, t + (o.acc ? 0.3 : 0.2));
      var lvl = v * 0.5;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(lvl, t + 0.004);
      g.gain.exponentialRampToValueAtTime(lvl * 0.7, end);
      g.gain.exponentialRampToValueAtTime(0.0001, end + 0.07);
      var sg = ctx.createGain();
      sg.gain.value = 0.45;
      chain(saw, lp, g);
      chain(sub, sg, g);
      g.connect(out);
    }
  };

  function trackGain(v) { return Math.pow(v / 100, 1.6) * 1.2; }
  function masterGain(v) { return Math.pow(v / 100, 1.6) * 0.8; }
  function buildBus(ctx, st, withAnalyser) {
    var master = ctx.createGain();
    master.gain.value = masterGain(st.master);
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.knee.value = 8;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.15;
    master.connect(comp);
    var an = null;
    if (withAnalyser) {
      an = ctx.createAnalyser();
      an.fftSize = 2048;
      an.smoothingTimeConstant = 0.78;
      comp.connect(an);
      an.connect(ctx.destination);
    } else {
      comp.connect(ctx.destination);
    }
    var tracks = {};
    IDS.forEach(function (id) {
      var g = ctx.createGain();
      g.gain.value = trackGain(st.mix[id].vol);
      var p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (p) { p.pan.value = st.mix[id].pan / 100; g.connect(p); p.connect(master); } else g.connect(master);
      tracks[id] = { gain: g, pan: p };
    });
    return { master: master, analyser: an, tracks: tracks };
  }
  function triggerStep(ctx, bus, st, p, i, t, sd, len) {
    IDS.forEach(function (id) {
      var v = p.steps[id][i];
      if (!v || !audible(st.mix, id)) return;
      var o = null;
      if (id === 'bs') {
        var nx = (i + 1) % len;
        var slide = !!(p.slides[i] && p.steps.bs[nx]);
        o = { note: p.notes[i], acc: v === 2, len: slide ? sd * 1.02 : sd * 0.78, slideTo: slide ? p.notes[nx] : 0 };
      }
      VOICE[id](ctx, bus.tracks[id].gain, t, v === 2 ? 1 : 0.72, o);
    });
  }
  function wavSequence(st, mode) {
    var seq = [];
    if (mode === 'chain') {
      var l = chainList(st);
      for (var k = 0; k < 2; k++) seq = seq.concat(l);
    } else {
      for (var j = 0; j < (Number(mode) || 4); j++) seq.push(st.cur);
    }
    return seq;
  }
  function renderWav(st, mode) {
    var seq = wavSequence(st, mode);
    var sd = stepDur(st.bpm), sr = 44100;
    var total = seq.length * st.len * sd + 2;
    var Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    var ctx = new Off(2, Math.ceil(sr * total), sr);
    var bus = buildBus(ctx, st, false);
    var n = 0;
    seq.forEach(function (pi) {
      for (var i = 0; i < st.len; i++) {
        triggerStep(ctx, bus, st, st.patterns[pi], i, 0.005 + n * sd + swingOffset(i, sd, st.swing), sd, st.len);
        n++;
      }
    });
    return ctx.startRendering();
  }

  var core = {
    TRACKS: TRACKS, IDS: IDS, PRESETS: PRESETS, MAXLEN: MAXLEN,
    clamp: clamp, noteName: noteName, parseNote: parseNote, midiHz: midiHz,
    emptyPattern: emptyPattern, clonePattern: clonePattern, hasContent: hasContent, halfEmpty: halfEmpty, copyFirstHalf: copyFirstHalf,
    applyPreset: applyPreset, randomPattern: randomPattern, defaultState: defaultState,
    serialize: serialize, deserialize: deserialize, b64urlEncode: b64urlEncode, b64urlDecode: b64urlDecode,
    encodeShare: encodeShare, decodeShare: decodeShare,
    chainList: chainList, nextInChain: nextInChain, stepDur: stepDur, swingOffset: swingOffset, audible: audible,
    tapTempo: tapTempo, encodeWav: encodeWav, wavSequence: wavSequence, VOICE: VOICE, buildBus: buildBus, triggerStep: triggerStep
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = core;
    return;
  }

  function makeTimer(fn) {
    var h = null;
    var fallback = {
      start: function () { clearInterval(h); h = setInterval(fn, 20); },
      stop: function () { clearInterval(h); h = null; }
    };
    try {
      var src = 'var h=null;onmessage=function(e){clearInterval(h);h=null;if(e.data==="start"){h=setInterval(function(){postMessage(0)},20)}};';
      var w = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      var api = {
        on: false,
        start: function () { api.on = true; if (w) w.postMessage('start'); else fallback.start(); },
        stop: function () { api.on = false; if (w) w.postMessage('stop'); else fallback.stop(); }
      };
      w.onmessage = fn;
      w.onerror = function () { w = null; if (api.on) fallback.start(); };
      return api;
    } catch (e) {
      return fallback;
    }
  }

  function init(root) {
    function $(name) { return root.querySelector('[data-dm="' + name + '"]'); }
    function $$(name) { return Array.prototype.slice.call(root.querySelectorAll('[data-dm="' + name + '"]')); }

    var st = null;
    var notice = '';
    var fromHash = /[#&]beat=([A-Za-z0-9_-]+)/.exec(location.hash || '');
    if (fromHash) {
      try {
        st = decodeShare(fromHash[1]);
        notice = 'Бит загружен из ссылки';
        try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
      } catch (e) { notice = 'Ссылка на бит повреждена, открыт сохраненный'; }
    }
    if (!st) {
      try { var raw = localStorage.getItem(STORE_KEY); if (raw) st = deserialize(raw); } catch (e) { st = null; }
    }
    if (!st) st = defaultState(false);

    var ctx = null, bus = null;
    var timer = makeTimer(tick);
    var play = { on: false, step: 0, pat: 0, next: 0, queue: [], shownStep: -1, shownPat: -1 };
    var hist = [], redo = [];
    var sel = -1;
    var oct = 2;
    var taps = [];
    var lastSound = 0;
    var saveT = null;
    var cells = {};
    var heads = {};
    var stepNums = [];
    var gridLen = 0;

    function save() {
      clearTimeout(saveT);
      saveT = setTimeout(function () { try { localStorage.setItem(STORE_KEY, serialize(st)); } catch (e) {} }, 250);
    }
    function pushHist() {
      hist.push(serialize(st));
      if (hist.length > 100) hist.shift();
      redo.length = 0;
      refreshUndo();
    }
    function restore(s) {
      var keepMix = st.mix;
      st = deserialize(s);
      st.mix = keepMix;
      if (sel >= st.len) sel = -1;
      buildGrid();
      refreshAll();
      save();
    }
    function undo() {
      if (!hist.length) return toast('Отменять нечего');
      redo.push(serialize(st));
      restore(hist.pop());
      refreshUndo();
    }
    function redoAct() {
      if (!redo.length) return toast('Повторять нечего');
      hist.push(serialize(st));
      restore(redo.pop());
      refreshUndo();
    }
    function refreshUndo() {
      $('undo').disabled = !hist.length;
      $('redo').disabled = !redo.length;
    }

    var toastT = null;
    function toast(msg) {
      var el = $('toast');
      el.textContent = msg;
      el.classList.add('is-on');
      clearTimeout(toastT);
      toastT = setTimeout(function () { el.classList.remove('is-on'); }, 2200);
    }

    function ensureAudio() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { toast('Браузер не поддерживает Web Audio'); return false; }
      ctx = new AC({ latencyHint: 'interactive' });
      bus = buildBus(ctx, st, true);
      return true;
    }
    function applyMix(id) {
      if (!bus) return;
      var m = st.mix[id], tr = bus.tracks[id];
      tr.gain.gain.setTargetAtTime(trackGain(m.vol), ctx.currentTime, 0.015);
      if (tr.pan) tr.pan.pan.setTargetAtTime(m.pan / 100, ctx.currentTime, 0.015);
    }
    function applyMaster() {
      if (bus) bus.master.gain.setTargetAtTime(masterGain(st.master), ctx.currentTime, 0.015);
    }
    function audition(id, note, acc) {
      if (!ensureAudio()) return;
      var t = ctx.currentTime + 0.01;
      VOICE[id](ctx, bus.tracks[id].gain, t, acc ? 1 : 0.85, id === 'bs' ? { note: note || 36, len: 0.22, acc: !!acc } : null);
      lastSound = Date.now();
      hideIdle();
    }

    function tick() {
      if (!play.on || !ctx) return;
      var sd = stepDur(st.bpm);
      if (play.next < ctx.currentTime - 0.25) play.next = ctx.currentTime + 0.03;
      while (play.next < ctx.currentTime + 0.12) {
        if (play.step >= st.len) { play.step = 0; play.pat = st.chain ? nextInChain(st, play.pat) : st.cur; }
        var t = play.next + swingOffset(play.step, sd, st.swing);
        triggerStep(ctx, bus, st, st.patterns[play.pat], play.step, t, sd, st.len);
        play.queue.push({ t: t, step: play.step, pat: play.pat });
        play.next += sd;
        play.step++;
      }
    }
    function start() {
      if (!ensureAudio()) return;
      play.on = true;
      play.step = 0;
      play.pat = st.chain ? (chainList(st).indexOf(st.cur) >= 0 ? st.cur : chainList(st)[0]) : st.cur;
      play.next = ctx.currentTime + 0.06;
      play.queue = [];
      timer.start();
      tick();
      root.setAttribute('data-state', 'playing');
      $('play').setAttribute('aria-label', 'Стоп');
      $('play-label').textContent = 'Стоп';
      hideIdle();
    }
    function stop() {
      play.on = false;
      timer.stop();
      play.queue = [];
      showStep(-1);
      root.setAttribute('data-state', 'stopped');
      $('play').setAttribute('aria-label', 'Старт');
      $('play-label').textContent = 'Старт';
      refreshPats();
    }
    function toggle() { if (play.on) stop(); else start(); }

    function showStep(i) {
      if (play.shownStep === i) return;
      if (play.shownStep >= 0) {
        IDS.forEach(function (id) { var c = cells[id][play.shownStep]; if (c) c.classList.remove('is-play'); });
        if (stepNums[play.shownStep]) stepNums[play.shownStep].classList.remove('is-play');
      }
      play.shownStep = i;
      if (i >= 0) {
        IDS.forEach(function (id) {
          var c = cells[id][i];
          if (!c) return;
          c.classList.add('is-play');
          if (st.patterns[play.shownPat] && st.patterns[play.shownPat].steps[id][i] && play.shownPat === st.cur) flash(id);
        });
        if (stepNums[i]) stepNums[i].classList.add('is-play');
      }
    }
    function flash(id) {
      var h = heads[id];
      if (!h) return;
      h.classList.remove('is-hit');
      void h.offsetWidth;
      h.classList.add('is-hit');
    }

    function buildGrid() {
      var grid = $('grid');
      gridLen = st.len;
      grid.style.setProperty('--len', st.len);
      grid.setAttribute('data-len', st.len);
      var html = '<div class="dm-gridrow dm-gridrow--nums"><div class="dm-trk__head dm-trk__head--nums"><span>Дорожка</span><span class="dm-trk__mixlbl">Громк. и панорама</span></div><div class="dm-steps">';
      for (var i = 0; i < st.len; i++) html += '<span class="dm-num' + (i % 4 === 0 ? ' is-beat' : '') + '">' + (i + 1) + '</span>';
      html += '</div></div>';
      TRACKS.forEach(function (t) {
        html += '<div class="dm-gridrow' + (t.id === 'bs' ? ' dm-gridrow--bass' : '') + '" data-trk="' + t.id + '" role="row">' +
          '<div class="dm-trk__head" role="rowheader">' +
          '<button type="button" class="dm-trk__name" data-act="aud" title="Послушать: ' + t.name + '"><b>' + t.short + '</b><span>' + t.name + '</span></button>' +
          '<button type="button" class="dm-trk__ms dm-trk__ms--m" data-act="mute" aria-pressed="false" title="Заглушить">M</button>' +
          '<button type="button" class="dm-trk__ms dm-trk__ms--s" data-act="solo" aria-pressed="false" title="Соло">S</button>' +
          '<span class="dm-trk__mix">' +
          '<input type="range" class="dm-mini" min="0" max="100" data-act="vol" aria-label="Громкость: ' + t.name + '">' +
          '<input type="range" class="dm-mini dm-mini--pan" min="-100" max="100" data-act="pan" aria-label="Панорама: ' + t.name + '" title="Двойной клик: по центру">' +
          '</span></div><div class="dm-steps">';
        for (var j = 0; j < st.len; j++) {
          html += '<button type="button" class="dm-step" data-i="' + j + '" data-g="' + ((j >> 2) % 4) + '" role="gridcell" aria-label="' + t.name + ', шаг ' + (j + 1) + '"><i></i><em></em></button>';
        }
        html += '</div></div>';
      });
      grid.innerHTML = html;
      cells = {};
      heads = {};
      stepNums = Array.prototype.slice.call(grid.querySelectorAll('.dm-num'));
      TRACKS.forEach(function (t) {
        var row = grid.querySelector('[data-trk="' + t.id + '"]');
        cells[t.id] = Array.prototype.slice.call(row.querySelectorAll('.dm-step'));
        heads[t.id] = row.querySelector('.dm-trk__name');
      });
      play.shownStep = -1;
    }

    function stepLabel(i) {
      var p = st.patterns[st.cur];
      var v = p.steps.bs[i];
      if (!v) return 'Шаг ' + (i + 1) + ': пауза, нажмите ноту';
      return 'Шаг ' + (i + 1) + ': ' + noteName(p.notes[i]) + (v === 2 ? ', акцент' : '') + (p.slides[i] ? ', глайд' : '');
    }
    function refreshGrid() {
      if (gridLen !== st.len) buildGrid();
      var p = st.patterns[st.cur];
      TRACKS.forEach(function (t) {
        var arr = p.steps[t.id];
        cells[t.id].forEach(function (c, i) {
          var v = arr[i];
          c.classList.toggle('is-on', v > 0);
          c.classList.toggle('is-acc', v === 2);
          c.setAttribute('aria-pressed', v ? 'true' : 'false');
          if (t.id === 'bs') {
            c.classList.toggle('is-sel', i === sel);
            c.classList.toggle('is-slide', !!(v && p.slides[i]));
            c.querySelector('em').textContent = v ? noteName(p.notes[i]) : '';
          }
        });
      });
      var bi = $('bass-info');
      bi.textContent = sel >= 0 ? stepLabel(sel) : 'Выберите шаг на дорожке «Бас»';
      var sl = $('bass-slide');
      sl.disabled = sel < 0;
      sl.setAttribute('aria-pressed', sel >= 0 && p.slides[sel] ? 'true' : 'false');
      refreshKeys();
    }
    function refreshMix() {
      var anySolo = IDS.some(function (id) { return st.mix[id].solo; });
      TRACKS.forEach(function (t) {
        var row = $('grid').querySelector('[data-trk="' + t.id + '"]');
        var m = st.mix[t.id];
        row.querySelector('[data-act="mute"]').setAttribute('aria-pressed', m.mute ? 'true' : 'false');
        row.querySelector('[data-act="solo"]').setAttribute('aria-pressed', m.solo ? 'true' : 'false');
        row.querySelector('[data-act="vol"]').value = m.vol;
        row.querySelector('[data-act="pan"]').value = m.pan;
        row.classList.toggle('is-silent', anySolo ? !m.solo : m.mute);
      });
    }
    function refreshPats() {
      var box = $('pats');
      if (!box.children.length) {
        box.innerHTML = PAT_NAMES.map(function (n, i) {
          return '<button type="button" class="dm-pat" data-pat="' + i + '" title="Паттерн ' + n + ' (' + (i + 1) + ')">' + n + '</button>';
        }).join('');
      }
      Array.prototype.forEach.call(box.children, function (b, i) {
        b.classList.toggle('is-cur', i === st.cur);
        b.classList.toggle('is-empty', !hasContent(st.patterns[i], st.len));
        b.classList.toggle('is-play', play.on && play.shownPat === i);
        b.classList.toggle('is-queued', play.on && !st.chain && play.pat !== st.cur && i === st.cur);
        b.setAttribute('aria-pressed', i === st.cur ? 'true' : 'false');
      });
      $('chain').setAttribute('aria-pressed', st.chain ? 'true' : 'false');
    }
    function refreshTransport() {
      var b = $('bpm');
      if (document.activeElement !== b) b.value = st.bpm;
      $('swing').value = st.swing;
      $('swing-out').textContent = st.swing + '%';
      $('master').value = st.master;
      $('master-out').textContent = st.master;
      $$('len').forEach(function (x) { x.setAttribute('aria-pressed', Number(x.getAttribute('data-len')) === st.len ? 'true' : 'false'); });
      $$('vis').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-vis') === st.vis ? 'true' : 'false'); });
    }
    function refreshKeys() {
      var box = $('keys');
      var base = (oct + 1) * 12;
      if (box.getAttribute('data-base') !== String(base)) {
        box.setAttribute('data-base', base);
        var w = '', k = '';
        var wi = 0;
        for (var n = 0; n <= 12; n++) {
          var m = base + n;
          var black = NOTE_NAMES[n % 12].length > 1;
          var lbl = noteName(m);
          if (black) {
            k += '<button type="button" class="dm-key dm-key--b" data-note="' + m + '" style="--x:' + wi + '" aria-label="' + lbl + '"></button>';
          } else {
            w += '<button type="button" class="dm-key dm-key--w" data-note="' + m + '" aria-label="' + lbl + '"><span>' + lbl + '</span></button>';
            wi++;
          }
        }
        box.style.setProperty('--white', wi);
        box.innerHTML = w + k;
      }
      $('oct').textContent = 'Октава ' + oct;
      var p = st.patterns[st.cur];
      var cur = sel >= 0 && p.steps.bs[sel] ? p.notes[sel] : -1;
      Array.prototype.forEach.call(box.children, function (b) {
        var m = Number(b.getAttribute('data-note'));
        b.classList.toggle('is-cur', m === cur);
        b.disabled = m < NOTE_MIN || m > NOTE_MAX;
      });
    }
    function refreshAll() {
      refreshTransport();
      refreshGrid();
      refreshMix();
      refreshPats();
    }

    function setLen(n) {
      if (n === st.len) return;
      pushHist();
      if (n === 32) st.patterns.forEach(function (p) { if (halfEmpty(p)) copyFirstHalf(p); });
      st.len = n;
      if (sel >= n) sel = -1;
      buildGrid();
      refreshAll();
      save();
      toast(n + ' шагов');
    }
    function selectPat(i) {
      if (i === st.cur) return;
      st.cur = i;
      sel = -1;
      if (st.chain && play.on) { st.chain = false; toast('Цепочка выключена'); }
      refreshGrid();
      refreshPats();
      save();
    }
    function setBpm(v) {
      st.bpm = Math.round(clamp(v, 40, 220, st.bpm));
      refreshTransport();
      save();
    }

    var paint = null;
    var grid = $('grid');
    grid.addEventListener('pointerdown', function (e) {
      var c = e.target.closest('.dm-step');
      if (!c || e.button > 0) return;
      var row = c.closest('[data-trk]');
      var id = row.getAttribute('data-trk');
      var i = Number(c.getAttribute('data-i'));
      var p = st.patterns[st.cur];
      pushHist();
      var nv = (p.steps[id][i] + 1) % 3;
      p.steps[id][i] = nv;
      if (id === 'bs') {
        sel = i;
        if (nv === 1) oct = clamp(Math.floor(p.notes[i] / 12) - 1, 1, 4);
      }
      if (nv && !play.on) {
        if (id === 'bs') audition('bs', p.notes[i], nv === 2);
        else audition(id, 0, nv === 2);
      }
      paint = e.pointerType === 'touch' ? null : { id: id, v: nv, seen: {} };
      if (paint) paint.seen[i] = true;
      refreshGrid();
      refreshPats();
      save();
      e.preventDefault();
    });
    document.addEventListener('pointermove', function (e) {
      if (!paint) return;
      var el = document.elementFromPoint(e.clientX, e.clientY);
      var c = el && el.closest ? el.closest('.dm-step') : null;
      if (!c) return;
      var row = c.closest('[data-trk]');
      if (!row || row.getAttribute('data-trk') !== paint.id) return;
      var i = Number(c.getAttribute('data-i'));
      if (paint.seen[i]) return;
      paint.seen[i] = true;
      st.patterns[st.cur].steps[paint.id][i] = paint.v;
      refreshGrid();
      save();
    });
    document.addEventListener('pointerup', function () { if (paint) { paint = null; refreshPats(); } });
    document.addEventListener('pointercancel', function () { paint = null; });
    grid.addEventListener('keydown', function (e) {
      var c = e.target.closest('.dm-step');
      if (!c || (e.key !== 'Enter' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      var row = c.closest('[data-trk]');
      var id = row.getAttribute('data-trk');
      var i = Number(c.getAttribute('data-i'));
      var ti = IDS.indexOf(id);
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Enter') {
        pushHist();
        var p = st.patterns[st.cur];
        p.steps[id][i] = (p.steps[id][i] + 1) % 3;
        if (id === 'bs') sel = i;
        refreshGrid();
        refreshPats();
        save();
        return;
      }
      if (e.key === 'ArrowLeft') i = (i + st.len - 1) % st.len;
      if (e.key === 'ArrowRight') i = (i + 1) % st.len;
      if (e.key === 'ArrowUp') ti = (ti + IDS.length - 1) % IDS.length;
      if (e.key === 'ArrowDown') ti = (ti + 1) % IDS.length;
      cells[IDS[ti]][i].focus();
    });
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var id = b.closest('[data-trk]').getAttribute('data-trk');
      var act = b.getAttribute('data-act');
      if (act === 'aud') { audition(id, id === 'bs' ? (sel >= 0 ? st.patterns[st.cur].notes[sel] : 36) : 0); flash(id); }
      if (act === 'mute') { st.mix[id].mute = !st.mix[id].mute; refreshMix(); save(); }
      if (act === 'solo') { st.mix[id].solo = !st.mix[id].solo; refreshMix(); save(); }
    });
    grid.addEventListener('input', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var id = b.closest('[data-trk]').getAttribute('data-trk');
      var act = b.getAttribute('data-act');
      if (act === 'vol') st.mix[id].vol = Number(b.value);
      if (act === 'pan') st.mix[id].pan = Number(b.value);
      applyMix(id);
      save();
    });
    grid.addEventListener('dblclick', function (e) {
      var b = e.target.closest('[data-act="pan"]');
      if (!b) return;
      var id = b.closest('[data-trk]').getAttribute('data-trk');
      st.mix[id].pan = 0;
      b.value = 0;
      applyMix(id);
      save();
    });

    $('play').addEventListener('click', toggle);
    $('bpm').addEventListener('change', function () { setBpm(this.value); });
    $('bpm').addEventListener('keydown', function (e) { if (e.key === 'Enter') { setBpm(this.value); this.blur(); } });
    $('bpm-down').addEventListener('click', function () { setBpm(st.bpm - 1); });
    $('bpm-up').addEventListener('click', function () { setBpm(st.bpm + 1); });
    function tap() {
      var now = performance.now();
      if (taps.length && now - taps[taps.length - 1] > 2000) taps = [];
      taps.push(now);
      if (taps.length > 6) taps.shift();
      var b = tapTempo(taps);
      if (b) { setBpm(b); toast('Темп ' + b); }
      var t = $('tap');
      t.classList.remove('is-hit');
      void t.offsetWidth;
      t.classList.add('is-hit');
    }
    $('tap').addEventListener('click', tap);
    $('swing').addEventListener('input', function () { st.swing = Number(this.value); $('swing-out').textContent = st.swing + '%'; save(); });
    $('master').addEventListener('input', function () { st.master = Number(this.value); $('master-out').textContent = st.master; applyMaster(); save(); });
    $$('len').forEach(function (b) { b.addEventListener('click', function () { setLen(Number(b.getAttribute('data-len'))); }); });
    $('pats').addEventListener('click', function (e) {
      var b = e.target.closest('[data-pat]');
      if (b) selectPat(Number(b.getAttribute('data-pat')));
    });
    function toggleChain() {
      st.chain = !st.chain;
      refreshPats();
      save();
      toast(st.chain ? 'Цепочка: ' + chainList(st).map(function (i) { return PAT_NAMES[i]; }).join(' → ') : 'Цепочка выключена');
    }
    $('chain').addEventListener('click', toggleChain);
    $('dup').addEventListener('click', function () {
      var to = (st.cur + 1) % 4;
      pushHist();
      st.patterns[to] = clonePattern(st.patterns[st.cur]);
      toast('Паттерн ' + PAT_NAMES[st.cur] + ' скопирован в ' + PAT_NAMES[to]);
      selectPat(to);
      refreshPats();
      save();
    });
    $('clear').addEventListener('click', function () {
      if (!hasContent(st.patterns[st.cur])) return toast('Паттерн уже пуст');
      pushHist();
      st.patterns[st.cur] = emptyPattern();
      sel = -1;
      refreshGrid();
      refreshPats();
      save();
      toast('Паттерн ' + PAT_NAMES[st.cur] + ' очищен, Ctrl+Z вернет');
    });
    $('presets').innerHTML = PRESETS.map(function (p) {
      return '<button type="button" class="dm-chip" data-preset="' + p.id + '">' + p.name + '</button>';
    }).join('');
    $('presets').addEventListener('click', function (e) {
      var b = e.target.closest('[data-preset]');
      if (!b) return;
      var pr = presetById(b.getAttribute('data-preset'));
      pushHist();
      st.patterns[st.cur] = applyPreset(pr);
      st.bpm = pr.bpm;
      st.swing = pr.swing;
      sel = -1;
      refreshAll();
      save();
      toast(pr.name + ', ' + pr.bpm + ' BPM в паттерн ' + PAT_NAMES[st.cur]);
    });
    function randomize() {
      pushHist();
      st.patterns[st.cur] = randomPattern();
      sel = -1;
      refreshGrid();
      refreshPats();
      save();
      toast('Случайный ритм в паттерн ' + PAT_NAMES[st.cur]);
    }
    $('random').addEventListener('click', randomize);
    $('undo').addEventListener('click', undo);
    $('redo').addEventListener('click', redoAct);

    function setNote(m) {
      var p = st.patterns[st.cur];
      if (sel < 0) sel = 0;
      pushHist();
      p.notes[sel] = clamp(m, NOTE_MIN, NOTE_MAX);
      if (!p.steps.bs[sel]) p.steps.bs[sel] = 1;
      audition('bs', p.notes[sel], p.steps.bs[sel] === 2);
      sel = (sel + 1) % st.len;
      refreshGrid();
      refreshPats();
      save();
    }
    $('keys').addEventListener('click', function (e) {
      var b = e.target.closest('[data-note]');
      if (b) setNote(Number(b.getAttribute('data-note')));
    });
    $('oct-down').addEventListener('click', function () { oct = Math.max(1, oct - 1); refreshKeys(); });
    $('oct-up').addEventListener('click', function () { oct = Math.min(4, oct + 1); refreshKeys(); });
    $('bass-prev').addEventListener('click', function () { sel = sel < 0 ? 0 : (sel + st.len - 1) % st.len; refreshGrid(); });
    $('bass-next').addEventListener('click', function () { sel = sel < 0 ? 0 : (sel + 1) % st.len; refreshGrid(); });
    $('bass-slide').addEventListener('click', function () {
      if (sel < 0) return;
      var p = st.patterns[st.cur];
      pushHist();
      p.slides[sel] = p.slides[sel] ? 0 : 1;
      if (p.slides[sel] && !p.steps.bs[sel]) p.steps.bs[sel] = 1;
      refreshGrid();
      save();
    });
    function transpose(d) {
      var p = st.patterns[st.cur];
      if (!p.steps.bs.some(function (v) { return v; })) return toast('На дорожке баса нет нот');
      pushHist();
      var out = false;
      p.notes = p.notes.map(function (n) { var x = n + d; if (x < NOTE_MIN || x > NOTE_MAX) out = true; return clamp(x, NOTE_MIN, NOTE_MAX); });
      refreshGrid();
      save();
      toast(out ? 'Часть нот уперлась в край диапазона' : 'Бас ' + (d > 0 ? 'выше' : 'ниже') + ' на полутон');
    }
    $('tr-down').addEventListener('click', function () { transpose(-1); });
    $('tr-up').addEventListener('click', function () { transpose(1); });

    $$('vis').forEach(function (b) {
      b.addEventListener('click', function () { st.vis = b.getAttribute('data-vis'); refreshTransport(); save(); });
    });

    var busy = false;
    $('wav').addEventListener('click', function () {
      if (busy) return;
      if (!st.patterns.some(function (p) { return hasContent(p, st.len); })) return toast('Сначала нарисуйте ритм');
      var btn = $('wav');
      busy = true;
      btn.disabled = true;
      btn.textContent = 'Записываю…';
      var mode = $('wav-mode').value;
      var started = Date.now();
      var p;
      try { p = renderWav(st, mode); } catch (e) { p = Promise.reject(e); }
      p.then(function (buf) {
        var blob = new Blob([encodeWav(buf)], { type: 'audio/wav' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'bx-808-' + st.bpm + 'bpm-' + (mode === 'chain' ? 'chain' : PAT_NAMES[st.cur]) + '.wav';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
        toast('WAV готов: ' + (blob.size / 1048576).toFixed(1) + ' МБ, ' + buf.duration.toFixed(1) + ' с, за ' + ((Date.now() - started) / 1000).toFixed(1) + ' с');
      }).catch(function () {
        toast('Не получилось записать WAV в этом браузере');
      }).then(function () {
        busy = false;
        btn.disabled = false;
        btn.textContent = 'Скачать WAV';
      });
    });

    $('share').addEventListener('click', function () {
      var url = location.origin + location.pathname + '#beat=' + encodeShare(st);
      function fallback() { window.prompt('Скопируйте ссылку на бит', url); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { toast('Ссылка на бит скопирована'); }, fallback);
      } else fallback();
    });
    function toggleHelp() {
      var p = $('help-panel');
      p.hidden = !p.hidden;
      $('help').setAttribute('aria-expanded', p.hidden ? 'false' : 'true');
    }
    $('help').addEventListener('click', toggleHelp);

    function typing(el) {
      if (!el) return false;
      var tag = el.tagName;
      if (tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) return true;
      return tag === 'INPUT' && el.type !== 'range' && el.type !== 'button' && el.type !== 'checkbox';
    }
    var pop = $('pop');
    function popOpen() { return root.getAttribute('data-pop') === 'open'; }
    function closePop() {
      if (!popOpen()) return;
      root.setAttribute('data-pop', 'closed');
      pop.setAttribute('aria-hidden', 'true');
      setTimeout(function () { pop.hidden = true; }, 260);
      $('play').focus({ preventScroll: true });
    }
    $('open').addEventListener('click', closePop);
    pop.addEventListener('click', function (e) { if (e.target === pop) closePop(); });
    document.documentElement.classList.add('dm-lock');
    setTimeout(function () { if (popOpen()) $('open').focus({ preventScroll: true }); }, 30);

    document.addEventListener('keydown', function (e) {
      if (popOpen()) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          if (e.key === 'Enter' && document.activeElement === $('back')) return;
          e.preventDefault();
          closePop();
        } else if (e.key === 'Tab') {
          e.preventDefault();
          (document.activeElement === $('open') ? $('back') : $('open')).focus();
        }
        return;
      }
      if (e.defaultPrevented) return;
      var tgt = e.target;
      var inApp = root.contains(tgt) || tgt === document || tgt === document.body || tgt === document.documentElement;
      if (!inApp || typing(tgt)) return;
      var k = e.key;
      var mod = e.ctrlKey || e.metaKey;
      if (mod && e.code === 'KeyZ') { e.preventDefault(); if (e.shiftKey) redoAct(); else undo(); return; }
      if (mod && e.code === 'KeyY') { e.preventDefault(); redoAct(); return; }
      if (mod || e.altKey) return;
      if (k === ' ' || e.code === 'Space') { e.preventDefault(); toggle(); return; }
      if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3' || e.code === 'Digit4') { selectPat(Number(e.code.slice(5)) - 1); return; }
      if (k === '?') { toggleHelp(); return; }
      if (e.code === 'KeyR') { randomize(); return; }
      if (e.code === 'KeyL') { setLen(st.len === 16 ? 32 : 16); return; }
      if (e.code === 'KeyK') { toggleChain(); return; }
      if (e.code === 'KeyT') { tap(); return; }
      if (tgt.type === 'range') return;
      if (k === 'ArrowUp') { e.preventDefault(); setBpm(st.bpm + (e.shiftKey ? 5 : 1)); return; }
      if (k === 'ArrowDown') { e.preventDefault(); setBpm(st.bpm - (e.shiftKey ? 5 : 1)); return; }
      if (k === 'Escape' && !$('help-panel').hidden) toggleHelp();
    });
    document.addEventListener('keyup', function (e) {
      if ((e.key === ' ' || e.code === 'Space') && root.contains(e.target) && !typing(e.target)) e.preventDefault();
    });

    var canvas = $('canvas');
    var g2 = canvas.getContext('2d');
    var idle = $('idle');
    var idleShown = true;
    var colors = null, colorsAt = 0;
    var tdata = null, fdata = null;
    function hideIdle() { if (idleShown) { idleShown = false; idle.classList.add('is-hidden'); } }
    function showIdle() { if (!idleShown) { idleShown = true; idle.classList.remove('is-hidden'); g2.clearRect(0, 0, canvas.width, canvas.height); } }
    function sizeCanvas() {
      var r = canvas.getBoundingClientRect();
      var d = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    }
    if (window.ResizeObserver) new ResizeObserver(sizeCanvas).observe(canvas);
    else window.addEventListener('resize', sizeCanvas);
    sizeCanvas();
    function readColors() {
      var now = Date.now();
      if (colors && now - colorsAt < 1000) return colors;
      var cs = getComputedStyle(root);
      colors = { line: cs.getPropertyValue('--dm-vis').trim() || '#f08a24', alt: cs.getPropertyValue('--dm-vis2').trim() || '#e2412b', grid: cs.getPropertyValue('--dm-visgrid').trim() || 'rgba(127,127,127,.15)' };
      colorsAt = now;
      return colors;
    }
    function drawVis() {
      var W = canvas.width, H = canvas.height;
      g2.clearRect(0, 0, W, H);
      var c = readColors();
      g2.strokeStyle = c.grid;
      g2.lineWidth = 1;
      g2.beginPath();
      g2.moveTo(0, H / 2);
      g2.lineTo(W, H / 2);
      g2.stroke();
      var an = bus && bus.analyser;
      if (!an) return;
      if (st.vis === 'spectrum') {
        if (!fdata) fdata = new Uint8Array(an.frequencyBinCount);
        an.getByteFrequencyData(fdata);
        var bars = Math.max(24, Math.min(96, Math.floor(W / 10)));
        var bw = W / bars;
        var grad = g2.createLinearGradient(0, H, 0, 0);
        grad.addColorStop(0, c.line);
        grad.addColorStop(1, c.alt);
        g2.fillStyle = grad;
        var n = fdata.length;
        for (var i = 0; i < bars; i++) {
          var a = Math.floor(Math.pow(i / bars, 2) * n * 0.7), b = Math.max(a + 1, Math.floor(Math.pow((i + 1) / bars, 2) * n * 0.7));
          var m = 0;
          for (var j = a; j < b; j++) if (fdata[j] > m) m = fdata[j];
          var h = (m / 255) * H * 0.95;
          g2.fillRect(i * bw + 1, H - h, Math.max(1, bw - 2), h);
        }
      } else {
        if (!tdata) tdata = new Uint8Array(an.fftSize);
        an.getByteTimeDomainData(tdata);
        g2.strokeStyle = c.line;
        g2.lineWidth = Math.max(1.5, H / 90);
        g2.lineJoin = 'round';
        g2.beginPath();
        var len = tdata.length;
        for (var k = 0; k < len; k++) {
          var x = (k / (len - 1)) * W, y = (tdata[k] / 255) * H;
          if (k) g2.lineTo(x, y); else g2.moveTo(x, y);
        }
        g2.stroke();
      }
    }
    function frame() {
      requestAnimationFrame(frame);
      if (play.on && ctx) {
        var now = ctx.currentTime;
        var shown = null;
        while (play.queue.length && play.queue[0].t <= now) shown = play.queue.shift();
        if (shown) {
          if (shown.pat !== play.shownPat) {
            play.shownPat = shown.pat;
            if (st.chain && shown.pat !== st.cur) { st.cur = shown.pat; sel = -1; refreshGrid(); }
            refreshPats();
          }
          showStep(shown.step < st.len ? shown.step : -1);
          lastSound = Date.now();
        }
      }
      var active = play.on || Date.now() - lastSound < 1200;
      if (active) drawVis();
      else if (!play.on) showIdle();
    }
    requestAnimationFrame(frame);

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && play.on && ctx) play.queue = play.queue.filter(function (q) { return q.t > ctx.currentTime - 0.05; });
    });

    buildGrid();
    refreshAll();
    refreshUndo();
    if (notice) setTimeout(function () { toast(notice); }, 300);
  }

  function boot() {
    var root = document.querySelector('[data-dm-app]');
    if (root && !root.getAttribute('data-ready')) {
      root.setAttribute('data-ready', '1');
      init(root);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
