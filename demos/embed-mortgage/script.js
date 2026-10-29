(function () {
  var nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
  var pf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });
  var MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

  function rub(v) { return nf.format(Math.round(v)) + ' ₽'; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function parseNum(s) {
    var t = String(s).replace(/\s| /g, '').replace(',', '.').replace(/[^0-9.]/g, '');
    var v = parseFloat(t);
    return isFinite(v) ? v : NaN;
  }
  function yearsWord(n) {
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return 'год';
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'года';
    return 'лет';
  }

  function schedule(loan, years, rate, type) {
    var n = Math.round(years * 12);
    var r = rate / 1200;
    var rows = [];
    var left = loan;
    var ann = r === 0 ? loan / n : loan * r / (1 - Math.pow(1 + r, -n));
    var fixed = loan / n;
    for (var i = 0; i < n; i++) {
      var int = left * r;
      var prin = type === 'diff' ? fixed : ann - int;
      if (i === n - 1) prin = left;
      left = Math.max(0, left - prin);
      rows.push({ i: i, pay: prin + int, prin: prin, int: int, left: left });
    }
    return rows;
  }

  function init(root) {
    var state = { price: 8000000, downPct: 20, years: 20, rate: 18, type: 'annuity', step: 'year', sel: -1 };
    var q = function (s) { return root.querySelector(s); };
    var out = {};
    root.querySelectorAll('[data-out]').forEach(function (el) { out[el.getAttribute('data-out')] = el; });
    var inp = {}, rng = {};
    root.querySelectorAll('[data-field]').forEach(function (el) { inp[el.getAttribute('data-field')] = el; });
    root.querySelectorAll('[data-range]').forEach(function (el) { rng[el.getAttribute('data-range')] = el; });
    var years = [];
    var rows = [];

    function down() { return Math.round(state.price * state.downPct / 100); }

    function fillRange(el) {
      var p = (parseFloat(el.value) - parseFloat(el.min)) / (parseFloat(el.max) - parseFloat(el.min)) * 100;
      el.style.setProperty('--mc-fill', clamp(p, 0, 100) + '%');
    }

    function syncInputs(skip) {
      if (skip !== 'price') inp.price.value = nf.format(state.price);
      if (skip !== 'down') inp.down.value = nf.format(down());
      if (skip !== 'years') inp.years.value = String(state.years);
      if (skip !== 'rate') inp.rate.value = pf.format(state.rate);
      rng.price.value = clamp(state.price, +rng.price.min, +rng.price.max);
      rng.downPct.value = clamp(state.downPct, 0, 90);
      rng.years.value = state.years;
      rng.rate.value = clamp(state.rate, 0, 30);
      Object.keys(rng).forEach(function (k) { fillRange(rng[k]); });
      out.downPct.textContent = pf.format(state.downPct) + '%';
      inp.years.nextElementSibling.textContent = yearsWord(state.years);
    }

    function renderBars() {
      var max = 0;
      years.forEach(function (y) { if (y.pay > max) max = y.pay; });
      var html = '';
      years.forEach(function (y, k) {
        var hp = max ? y.prin / max * 100 : 0;
        var hi = max ? y.int / max * 100 : 0;
        html += '<span class="mcalc__bar' + (k === state.sel ? ' is-sel' : '') + '" data-k="' + k + '"><span class="mcalc__bar-i" style="height:' + hi.toFixed(2) + '%"></span><span class="mcalc__bar-p" style="height:' + hp.toFixed(2) + '%"></span></span>';
      });
      out.bars.innerHTML = html;
      showInfo();
    }

    function showInfo() {
      var y = years[state.sel];
      if (!y) {
        out.chartInfo.textContent = window.matchMedia('(hover: hover)').matches ? 'Наведите на столбец' : 'Нажмите на столбец';
        return;
      }
      out.chartInfo.innerHTML = '<b>' + (y.k + 1) + '-й год</b> <i class="mcalc__dot mcalc__dot--prin"></i>' + rub(y.prin) + ' <i class="mcalc__dot mcalc__dot--int"></i>' + rub(y.int);
      out.bars.querySelectorAll('.mcalc__bar').forEach(function (b) {
        b.classList.toggle('is-sel', +b.getAttribute('data-k') === state.sel);
      });
    }

    function renderTable() {
      var head = '<div class="mcalc__tr mcalc__tr--head"><span>' + (state.step === 'year' ? 'Год' : 'Месяц') + '</span><span>Платеж</span><span>Долг</span><span>Проценты</span><span>Остаток</span></div>';
      var body = '';
      if (state.step === 'year') {
        years.forEach(function (y) {
          body += '<div class="mcalc__tr"><span>' + (y.k + 1) + '</span><span>' + nf.format(y.pay) + '</span><span>' + nf.format(y.prin) + '</span><span>' + nf.format(y.int) + '</span><span>' + nf.format(y.left) + '</span></div>';
        });
      } else {
        var now = new Date();
        var m0 = now.getMonth() + 1, y0 = now.getFullYear();
        rows.forEach(function (r) {
          var m = m0 + r.i;
          var label = MONTHS[m % 12] + ' ' + (y0 + Math.floor(m / 12));
          body += '<div class="mcalc__tr"><span>' + label + '</span><span>' + nf.format(r.pay) + '</span><span>' + nf.format(r.prin) + '</span><span>' + nf.format(r.int) + '</span><span>' + nf.format(r.left) + '</span></div>';
        });
      }
      out.table.innerHTML = head + body;
      out.table.classList.toggle('is-month', state.step === 'month');
    }

    function calc() {
      var loan = Math.max(0, state.price - down());
      rows = loan > 0 ? schedule(loan, state.years, state.rate, state.type) : [];
      years = [];
      rows.forEach(function (r) {
        var k = Math.floor(r.i / 12);
        if (!years[k]) years[k] = { k: k, pay: 0, prin: 0, int: 0, left: 0 };
        years[k].pay += r.pay; years[k].prin += r.prin; years[k].int += r.int; years[k].left = r.left;
      });
      var interest = 0;
      rows.forEach(function (r) { interest += r.int; });
      var total = loan + interest;
      if (!rows.length) {
        out.pay.textContent = rub(0);
      } else if (state.type === 'diff') {
        out.payLabel.textContent = 'Платеж, первый → последний';
        out.pay.innerHTML = nf.format(rows[0].pay) + '<span class="mcalc__pay-arrow">→</span>' + rub(rows[rows.length - 1].pay);
      } else {
        out.payLabel.textContent = 'Ежемесячный платеж';
        out.pay.textContent = rub(rows[0].pay);
      }
      out.pay.classList.toggle('is-diff', state.type === 'diff' && rows.length > 0);
      out.loan.textContent = rub(loan);
      out.interest.textContent = rub(interest);
      out.total.textContent = rub(total);
      out.income.textContent = rows.length ? 'от ' + rub(rows[0].pay * 2) : '—';
      var sp = total ? loan / total * 100 : 100;
      out.ratioP.style.width = sp + '%';
      out.ratioI.style.width = (100 - sp) + '%';
      out.sharePrin.textContent = Math.round(sp) + '%';
      out.shareInt.textContent = Math.round(100 - sp) + '%';
      if (state.sel >= years.length) state.sel = -1;
      renderBars();
      if (sched.open) renderTable(); else out.table.innerHTML = '';
    }

    var sched = q('.mcalc__sched');
    sched.addEventListener('toggle', function () { if (sched.open) renderTable(); });

    function update(skip) { syncInputs(skip); calc(); }

    function fromInput(name) {
      var v = parseNum(inp[name].value);
      if (isNaN(v)) return false;
      if (name === 'price') {
        var d = down();
        state.price = clamp(Math.round(v), 0, 1e10);
        state.downPct = state.price ? clamp(d / state.price * 100, 0, 100) : 0;
      } else if (name === 'down') {
        state.downPct = state.price ? clamp(v / state.price * 100, 0, 100) : 0;
      } else if (name === 'years') {
        state.years = clamp(Math.round(v), 1, 50);
      } else if (name === 'rate') {
        state.rate = clamp(v, 0, 100);
      }
      return true;
    }

    Object.keys(inp).forEach(function (name) {
      var el = inp[name];
      el.addEventListener('input', function () {
        if (name === 'price' || name === 'down') {
          var pos = el.value.length - el.selectionStart;
          var v = parseNum(el.value);
          if (!isNaN(v)) {
            el.value = nf.format(Math.round(v));
            var p = Math.max(0, el.value.length - pos);
            try { el.setSelectionRange(p, p); } catch (e) {}
          }
        }
        if (fromInput(name)) update(name);
      });
      el.addEventListener('blur', function () { fromInput(name); update(); });
      el.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        var dir = e.key === 'ArrowUp' ? 1 : -1;
        if (name === 'price') state.price = Math.max(0, state.price + dir * 100000);
        if (name === 'down') state.downPct = clamp(state.downPct + dir, 0, 100);
        if (name === 'years') state.years = clamp(state.years + dir, 1, 50);
        if (name === 'rate') state.rate = clamp(Math.round((state.rate + dir * 0.1) * 10) / 10, 0, 100);
        update();
      });
    });

    Object.keys(rng).forEach(function (name) {
      rng[name].addEventListener('input', function () {
        var v = parseFloat(rng[name].value);
        if (name === 'price') state.price = v;
        if (name === 'downPct') state.downPct = v;
        if (name === 'years') state.years = v;
        if (name === 'rate') state.rate = Math.round(v * 10) / 10;
        update();
      });
    });

    function bindSeg(attr, key) {
      var btns = root.querySelectorAll('[data-' + attr + ']');
      btns.forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          state[key] = b.getAttribute('data-' + attr);
          btns.forEach(function (x) {
            var on = x === b;
            x.classList.toggle('is-active', on);
            x.setAttribute('aria-checked', on ? 'true' : 'false');
          });
          if (key === 'step') { if (!sched.open) sched.open = true; renderTable(); } else calc();
        });
      });
    }
    bindSeg('type', 'type');
    bindSeg('step', 'step');

    function pick(e) {
      var b = e.target.closest('.mcalc__bar');
      if (!b) return;
      state.sel = +b.getAttribute('data-k');
      showInfo();
    }
    out.bars.addEventListener('mouseover', pick);
    out.bars.addEventListener('click', pick);
    out.bars.addEventListener('mouseleave', function () {
      if (document.activeElement === out.bars) return;
      state.sel = -1; showInfo();
      out.bars.querySelectorAll('.is-sel').forEach(function (x) { x.classList.remove('is-sel'); });
    });
    out.bars.addEventListener('keydown', function (e) {
      if (!years.length) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var d = e.key === 'ArrowRight' ? 1 : -1;
        state.sel = state.sel < 0 ? (d > 0 ? 0 : years.length - 1) : clamp(state.sel + d, 0, years.length - 1);
        showInfo();
      }
    });

    update();
    root.classList.add('is-ready');
  }

  function boot() {
    document.querySelectorAll('[data-mcalc]').forEach(function (el) {
      if (el.getAttribute('data-mcalc-ready')) return;
      el.setAttribute('data-mcalc-ready', '1');
      init(el);
    });
  }
  if (typeof window !== 'undefined' && typeof module === 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  }
  if (typeof module !== 'undefined') module.exports = { schedule: schedule };
})();
