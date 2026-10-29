(function () {
  'use strict';

  var CDN = {
    sortable: 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js',
    qr: 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js',
    words: 'https://cdn.jsdelivr.net/npm/number-to-words-ru@2.4.1/dist/index.js',
    pdf: 'https://cdn.jsdelivr.net/npm/pdfmake@0.2.15/build/pdfmake.min.js',
    fonts: 'https://cdn.jsdelivr.net/npm/pdfmake@0.2.15/build/vfs_fonts.js',
    icons: 'https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/regular/style.css',
    type: 'https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700&family=Golos+Text:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap'
  };
  var KEY = 'onpress-demo-invoice:v1';
  var SHEET_W = 794;
  var ACCENTS = ['#1d4d3a', '#c8401a', '#1f2937', '#2952cc', '#8a5a00'];
  var CUR = {
    rub: { short: 'руб.', sign: '₽' },
    usd: { short: 'долл.', sign: '$' },
    eur: { short: 'евро', sign: '€' }
  };

  var wordsFn = null;
  var qrLib = null;
  var refresh = function () {};

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  function parseIso(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  function addDays(iso, n) {
    var d = parseIso(iso) || new Date();
    d.setDate(d.getDate() + n);
    return isoDate(d);
  }

  function daysBetween(a, b) {
    var x = parseIso(a), y = parseIso(b);
    if (!x || !y) return null;
    return Math.round((y - x) / 86400000);
  }

  var fmtLong = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  var fmtMoney = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var fmtQty = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 });

  function dateLong(iso) { var d = parseIso(iso); return d ? fmtLong.format(d) : ''; }

  function dateShort(iso) { var d = parseIso(iso); return d ? pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() : ''; }

  function parseNum(v) {
    var s = String(v == null ? '' : v).replace(/[\s  ]/g, '').replace(',', '.');
    if (s === '') return NaN;
    return /^-?\d*\.?\d+$|^-?\d+\.$/.test(s) ? Number(s) : NaN;
  }

  function money(kop) { return fmtMoney.format(kop / 100); }

  function qtyText(v) {
    var n = parseNum(v);
    if (isNaN(n)) n = 1;
    return fmtQty.format(n);
  }

  function lineKop(it) {
    var q = parseNum(it.qty);
    if (isNaN(q)) q = String(it.qty == null ? '' : it.qty).trim() === '' ? 1 : 0;
    var p = parseNum(it.price);
    if (isNaN(p)) p = 0;
    return Math.round(q * Math.round(p * 100));
  }

  function itemFilled(it) {
    return !!(String(it.name || '').trim() || String(it.price || '').trim());
  }

  function totals(inv) {
    var items = (inv.items || []).filter(itemFilled);
    var lines = items.map(lineKop);
    var subtotal = lines.reduce(function (a, b) { return a + b; }, 0);
    var mode = inv.vatMode || 'none';
    var rate = parseNum(inv.vatRate);
    if (isNaN(rate)) rate = 0;
    var vat = 0, total = subtotal;
    if (mode === 'incl') vat = Math.round(subtotal * rate / (100 + rate));
    if (mode === 'top') { vat = Math.round(subtotal * rate / 100); total = subtotal + vat; }
    return { items: items, lines: lines, count: items.length, subtotal: subtotal, vat: vat, total: total, rate: rate, mode: mode };
  }

  function digits(s) { return String(s || '').replace(/\D/g, ''); }

  function innCheck(v) {
    var s = digits(v);
    if (!/^\d+$/.test(String(v).trim())) return 'Только цифры';
    function c(w, len) {
      var sum = 0;
      for (var i = 0; i < w.length; i++) sum += +s[i] * w[i];
      return sum % 11 % 10 === +s[len];
    }
    if (s.length === 10) return c([2, 4, 10, 3, 5, 9, 4, 6, 8], 9) ? '' : 'Не сходится контрольная цифра';
    if (s.length === 12) {
      var ok = c([7, 2, 4, 10, 3, 5, 9, 4, 6, 8], 10) && c([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8], 11);
      return ok ? '' : 'Не сходится контрольная цифра';
    }
    return 'Нужно 10 цифр у компании или 12 у ИП';
  }

  function kppCheck(v) {
    return /^\d{4}[\dA-Z]{2}\d{3}$/.test(String(v).trim()) ? '' : 'Нужно 9 знаков';
  }

  function bikCheck(v) {
    var s = String(v).trim();
    if (!/^\d{9}$/.test(s)) return 'Нужно 9 цифр';
    return s.slice(0, 2) === '04' ? '' : 'БИК банка в России начинается с 04';
  }

  function keyOk(s) {
    var w = [7, 1, 3], sum = 0;
    for (var i = 0; i < s.length; i++) sum += (+s[i] * w[i % 3]) % 10;
    return sum % 10 === 0;
  }

  function accountCheck(v, bik) {
    var s = String(v).trim();
    if (!/^\d{20}$/.test(s)) return 'Нужно 20 цифр';
    if (!bikCheck(bik) && !keyOk(String(bik).slice(-3) + s)) return 'Счет не подходит к этому БИК';
    return '';
  }

  function corrCheck(v, bik) {
    var s = String(v).trim();
    if (!/^\d{20}$/.test(s)) return 'Нужно 20 цифр';
    if (s.slice(0, 5) !== '30101') return 'Корр. счет начинается с 30101';
    if (!bikCheck(bik) && !keyOk('0' + String(bik).slice(4, 6) + s)) return 'Корр. счет не подходит к этому БИК';
    return '';
  }

  function check(kind, value, inv) {
    if (!String(value || '').trim()) return '';
    var bik = inv && inv.seller ? inv.seller.bik : '';
    if (kind === 'inn') return innCheck(value);
    if (kind === 'kpp') return kppCheck(value);
    if (kind === 'bik') return bikCheck(value);
    if (kind === 'account') return accountCheck(value, bik);
    if (kind === 'corr') return corrCheck(value, bik);
    return '';
  }

  function words(kop, cur) {
    if (!wordsFn) return '';
    try {
      return wordsFn((kop / 100).toFixed(2), { currency: cur || 'rub' });
    } catch (e) {
      return '';
    }
  }

  function clean(s) { return String(s || '').replace(/\|/g, ' ').replace(/\s+/g, ' ').trim(); }

  function purpose(inv, t) {
    var p = 'Оплата по счету № ' + clean(inv.number) + (inv.date ? ' от ' + dateShort(inv.date) : '');
    if (t.mode === 'none') return p + '. Без НДС';
    return p + ', в т.ч. НДС ' + t.rate + '% ' + money(t.vat).replace(/[  ]/g, ' ') + ' руб.';
  }

  function qrPayload(inv, t) {
    var s = inv.seller || {};
    if ((inv.currency || 'rub') !== 'rub') return { ok: false, reason: 'QR-код работает только для счетов в рублях.' };
    var need = [];
    if (!clean(s.name)) need.push('название поставщика');
    if (!clean(s.bank)) need.push('банк');
    if (bikCheck(s.bik || '')) need.push('БИК');
    if (accountCheck(s.account || '', s.bik)) need.push('расчетный счет');
    if (need.length) return { ok: false, reason: 'Для QR-кода заполните ' + need.join(', ') + '.' };
    var parts = [
      'ST00012',
      'Name=' + clean(s.name),
      'PersonalAcc=' + digits(s.account),
      'BankName=' + clean(s.bank),
      'BIC=' + digits(s.bik),
      'CorrespAcc=' + (digits(s.corr) || '0')
    ];
    if (digits(s.inn)) parts.push('PayeeINN=' + digits(s.inn));
    if (clean(s.kpp)) parts.push('KPP=' + clean(s.kpp));
    if (t.total > 0) parts.push('Sum=' + t.total);
    parts.push('Purpose=' + purpose(inv, t));
    return { ok: true, text: parts.join('|') };
  }

  function qrSvg(text) {
    if (!qrLib || !text) return '';
    try {
      var q = qrLib(0, 'M');
      q.addData(text, 'Byte');
      q.make();
      return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    } catch (e) {
      return '';
    }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function hexRgba(hex, a) {
    var m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || '');
    if (!m) return 'rgba(0,102,255,' + a + ')';
    return 'rgba(' + parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' + parseInt(m[3], 16) + ',' + a + ')';
  }

  function partyText(p) {
    var bits = [];
    if (clean(p.name)) bits.push(clean(p.name));
    if (digits(p.inn)) bits.push('ИНН ' + digits(p.inn));
    if (clean(p.kpp)) bits.push('КПП ' + clean(p.kpp));
    if (clean(p.address)) bits.push(clean(p.address));
    return bits.join(', ');
  }

  function title(inv) {
    return 'Счет на оплату № ' + (clean(inv.number) || '—') + (inv.date ? ' от ' + dateLong(inv.date) : '');
  }

  function dueText(iso) {
    var d = dateLong(iso);
    return 'Оплатить не позднее ' + d + (/\.$/.test(d) ? '' : '.');
  }

  function vatLabel(t) {
    if (t.mode === 'incl') return 'В том числе НДС ' + t.rate + '%:';
    if (t.mode === 'top') return 'НДС ' + t.rate + '%:';
    return 'Без налога (НДС):';
  }

  function totalsRows(t) {
    var rows = [['Итого:', money(t.subtotal)], [vatLabel(t), t.mode === 'none' ? '—' : money(t.vat)]];
    rows.push(['Всего к оплате:', money(t.total)]);
    return rows;
  }

  function summary(inv, t) {
    var cur = CUR[inv.currency] || CUR.rub;
    return 'Всего наименований ' + t.count + ', на сумму ' + money(t.total) + ' ' + cur.short;
  }

  function sheetHtml(inv, t, o) {
    o = o || {};
    var s = inv.seller || {}, b = inv.buyer || {};
    var acc = ACCENTS.indexOf(inv.accent) >= 0 ? inv.accent : ACCENTS[0];
    var h = [];
    h.push('<div class="inv-sheet__inner" style="--acc:' + acc + ';--acc-soft:' + hexRgba(acc, 0.08) + ';--acc-line:' + hexRgba(acc, 0.35) + '">');
    h.push('<div class="inv-sheet__head">');
    h.push('<div class="inv-sheet__brand">');
    if (o.logo) h.push('<img class="inv-sheet__logo" src="' + esc(o.logo) + '" alt="">');
    h.push('<div><div class="inv-sheet__seller">' + (esc(clean(s.name)) || '<span class="inv-sheet__ph">Название поставщика</span>') + '</div>');
    if (clean(s.address)) h.push('<div class="inv-sheet__muted">' + esc(clean(s.address)) + '</div>');
    h.push('</div></div>');
    if (inv.paid) h.push('<div class="inv-sheet__stamp-paid">Оплачен</div>');
    h.push('</div>');

    h.push('<div class="inv-sheet__bankrow">');
    h.push('<table class="inv-sheet__bank"><tbody>');
    h.push('<tr><td rowspan="2" class="inv-sheet__bank-main">' + esc(clean(s.bank)) + '<span class="inv-sheet__cap">Банк получателя</span></td><td class="inv-sheet__bank-k">БИК</td><td class="inv-sheet__bank-v">' + esc(digits(s.bik)) + '</td></tr>');
    h.push('<tr><td class="inv-sheet__bank-k">Сч. №</td><td class="inv-sheet__bank-v">' + esc(digits(s.corr)) + '</td></tr>');
    h.push('<tr><td class="inv-sheet__bank-split"><span>ИНН ' + esc(digits(s.inn)) + '</span><span>КПП ' + esc(clean(s.kpp)) + '</span></td><td rowspan="2" class="inv-sheet__bank-k">Сч. №</td><td rowspan="2" class="inv-sheet__bank-v">' + esc(digits(s.account)) + '</td></tr>');
    h.push('<tr><td class="inv-sheet__bank-main">' + esc(clean(s.name)) + '<span class="inv-sheet__cap">Получатель</span></td></tr>');
    h.push('</tbody></table>');
    if (o.qr) h.push('<figure class="inv-sheet__qr">' + o.qr + '<figcaption>Оплата по QR</figcaption></figure>');
    h.push('</div>');

    h.push('<div class="inv-sheet__title">' + esc(title(inv)) + '</div>');

    h.push('<table class="inv-sheet__parties"><tbody>');
    h.push('<tr><td>Поставщик<br>(Исполнитель):</td><td><b>' + (esc(partyText(s)) || '<span class="inv-sheet__ph">Заполните реквизиты в форме</span>') + '</b></td></tr>');
    h.push('<tr><td>Покупатель<br>(Заказчик):</td><td><b>' + (esc(partyText(b)) || '<span class="inv-sheet__ph">Укажите покупателя</span>') + '</b></td></tr>');
    h.push('</tbody></table>');

    h.push('<table class="inv-sheet__items"><thead><tr><th class="inv-sheet__c-n">№</th><th>Товары (работы, услуги)</th><th class="inv-sheet__c-num">Кол-во</th><th class="inv-sheet__c-u">Ед.</th><th class="inv-sheet__c-num">Цена</th><th class="inv-sheet__c-num">Сумма</th></tr></thead><tbody>');
    if (!t.count) {
      h.push('<tr><td colspan="6" class="inv-sheet__empty">Позиции появятся здесь, как только вы добавите их в форме</td></tr>');
    }
    t.items.forEach(function (it, i) {
      var price = parseNum(it.price);
      h.push('<tr><td class="inv-sheet__c-n">' + (i + 1) + '</td><td>' + esc(clean(it.name)) + '</td><td class="inv-sheet__c-num">' + esc(qtyText(it.qty)) + '</td><td class="inv-sheet__c-u">' + esc(clean(it.unit) || 'шт') + '</td><td class="inv-sheet__c-num">' + money(isNaN(price) ? 0 : Math.round(price * 100)) + '</td><td class="inv-sheet__c-num">' + money(t.lines[i]) + '</td></tr>');
    });
    h.push('</tbody></table>');

    h.push('<table class="inv-sheet__totals"><tbody>');
    totalsRows(t).forEach(function (r, i) {
      h.push('<tr' + (i === 2 ? ' class="inv-sheet__grand"' : '') + '><td>' + esc(r[0]) + '</td><td>' + r[1] + '</td></tr>');
    });
    h.push('</tbody></table>');

    h.push('<div class="inv-sheet__summary">' + esc(summary(inv, t)) + '</div>');
    var w = o.words != null ? o.words : words(t.total, inv.currency);
    h.push('<div class="inv-sheet__words">' + (esc(w) || '&nbsp;') + '</div>');

    var notes = [];
    if (inv.due) notes.push(dueText(inv.due));
    if (clean(inv.note)) notes.push(clean(inv.note));
    if (notes.length) h.push('<div class="inv-sheet__notes">' + notes.map(function (n) { return '<p>' + esc(n) + '</p>'; }).join('') + '</div>');

    if (inv.showSign !== false) {
      h.push('<div class="inv-sheet__signs">');
      h.push('<div class="inv-sheet__sign"><span class="inv-sheet__sign-role">Руководитель</span><span class="inv-sheet__sign-line"></span><span class="inv-sheet__sign-name">' + esc(clean(s.director)) + '</span></div>');
      if (clean(s.accountant)) h.push('<div class="inv-sheet__sign"><span class="inv-sheet__sign-role">Бухгалтер</span><span class="inv-sheet__sign-line"></span><span class="inv-sheet__sign-name">' + esc(clean(s.accountant)) + '</span></div>');
      if (o.stamp) h.push('<img class="inv-sheet__stamp" src="' + esc(o.stamp) + '" alt="">');
      h.push('</div>');
    }
    h.push('</div>');
    return h.join('');
  }

  function pdfDoc(inv, t, o) {
    o = o || {};
    var s = inv.seller || {}, b = inv.buyer || {};
    var acc = ACCENTS.indexOf(inv.accent) >= 0 ? inv.accent : ACCENTS[0];
    var cap = { fontSize: 7, color: '#6b7280' };
    var line = {
      hLineWidth: function () { return 0.6; },
      vLineWidth: function () { return 0.6; },
      hLineColor: function () { return '#9ca3af'; },
      vLineColor: function () { return '#9ca3af'; },
      paddingLeft: function () { return 5; },
      paddingRight: function () { return 5; },
      paddingTop: function () { return 3; },
      paddingBottom: function () { return 3; }
    };
    var content = [];

    var brand = [];
    if (o.logo) brand.push({ image: o.logo, fit: [120, 44], width: 'auto', margin: [0, 0, 12, 0] });
    brand.push({ width: '*', stack: [
      { text: clean(s.name) || ' ', bold: true, fontSize: 12 },
      clean(s.address) ? { text: clean(s.address), fontSize: 8, color: '#6b7280', margin: [0, 2, 0, 0] } : { text: '' }
    ] });
    if (inv.paid) brand.push({ width: 'auto', text: 'ОПЛАЧЕН', color: '#15803d', bold: true, fontSize: 11 });
    content.push({ columns: brand, columnGap: 0, margin: [0, 0, 0, 14] });

    var bank = {
      table: {
        widths: ['*', 36, 140],
        body: [
          [{ stack: [clean(s.bank) || ' ', { text: 'Банк получателя', style: 'cap' }], rowSpan: 2 }, 'БИК', digits(s.bik)],
          ['', 'Сч. №', digits(s.corr)],
          [{ columns: [{ text: 'ИНН ' + digits(s.inn) }, { text: 'КПП ' + clean(s.kpp) }] }, { text: 'Сч. №', rowSpan: 2 }, { text: digits(s.account), rowSpan: 2 }],
          [{ stack: [clean(s.name) || ' ', { text: 'Получатель', style: 'cap' }] }, '', '']
        ]
      },
      layout: line,
      width: '*'
    };
    if (o.qr) {
      content.push({ columns: [bank, { width: 86, stack: [{ svg: o.qr, width: 78, margin: [8, 0, 0, 2] }, { text: 'Оплата по QR', style: 'cap', margin: [8, 0, 0, 0] }] }], columnGap: 0 });
    } else {
      content.push(bank);
    }

    content.push({ text: title(inv), fontSize: 15, bold: true, color: acc, margin: [0, 18, 0, 6] });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.4, lineColor: acc }], margin: [0, 0, 0, 10] });

    content.push({
      table: {
        widths: [92, '*'],
        body: [
          [{ text: 'Поставщик\n(Исполнитель):' }, { text: partyText(s) || ' ', bold: true }],
          [{ text: 'Покупатель\n(Заказчик):' }, { text: partyText(b) || ' ', bold: true }]
        ]
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 12]
    });

    var head = ['№', 'Товары (работы, услуги)', 'Кол-во', 'Ед.', 'Цена', 'Сумма'].map(function (x, i) {
      return { text: x, bold: true, fillColor: hexRgbaPdf(acc), alignment: i >= 2 && i !== 3 ? 'right' : (i === 3 ? 'center' : 'left') };
    });
    var body = [head];
    t.items.forEach(function (it, i) {
      var price = parseNum(it.price);
      body.push([
        { text: String(i + 1), alignment: 'center' },
        clean(it.name),
        { text: qtyText(it.qty), alignment: 'right' },
        { text: clean(it.unit) || 'шт', alignment: 'center' },
        { text: money(isNaN(price) ? 0 : Math.round(price * 100)), alignment: 'right' },
        { text: money(t.lines[i]), alignment: 'right' }
      ]);
    });
    if (!t.count) body.push([{ text: 'Нет позиций', colSpan: 6, alignment: 'center', color: '#9ca3af' }, '', '', '', '', '']);
    content.push({ table: { headerRows: 1, widths: [18, '*', 44, 32, 66, 72], body: body }, layout: line });

    content.push({
      table: {
        widths: ['*', 'auto', 90],
        body: totalsRows(t).map(function (r, i) {
          return ['', { text: r[0], bold: true, alignment: 'right', fontSize: i === 2 ? 10 : 9 }, { text: r[1], bold: true, alignment: 'right', fontSize: i === 2 ? 10 : 9 }];
        })
      },
      layout: 'noBorders',
      margin: [0, 6, 0, 8]
    });

    content.push({ text: summary(inv, t), margin: [0, 0, 0, 2] });
    var w = o.words != null ? o.words : words(t.total, inv.currency);
    if (w) content.push({ text: w, bold: true, margin: [0, 0, 0, 10] });
    if (inv.due) content.push({ text: dueText(inv.due), margin: [0, 0, 0, 2] });
    if (clean(inv.note)) content.push({ text: clean(inv.note), margin: [0, 0, 0, 2] });

    if (inv.showSign !== false) {
      content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.4, lineColor: acc }], margin: [0, 14, 0, 16] });
      var signs = [];
      function sign(role, name) {
        return { columns: [
          { text: role, bold: true, width: 82 },
          { width: 120, stack: [{ canvas: [{ type: 'line', x1: 0, y1: 10, x2: 120, y2: 10, lineWidth: 0.6 }] }] },
          { text: name ? '/ ' + name + ' /' : '', width: '*', margin: [8, 0, 0, 0] }
        ], margin: [0, 0, 0, 14] };
      }
      signs.push(sign('Руководитель', clean(s.director)));
      if (clean(s.accountant)) signs.push(sign('Бухгалтер', clean(s.accountant)));
      if (o.stamp) {
        content.push({ columns: [{ width: '*', stack: signs }, { width: 130, image: o.stamp, fit: [130, 110], margin: [0, -24, 0, 0] }] });
      } else {
        content.push({ stack: signs });
      }
    }

    return {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      info: { title: title(inv), creator: 'OnPress', producer: 'OnPress' },
      defaultStyle: { font: 'Roboto', fontSize: 9, lineHeight: 1.2, color: '#111827' },
      styles: { cap: cap },
      content: content
    };
  }

  function hexRgbaPdf(hex) {
    var m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || '');
    if (!m) return '#eef4ff';
    var mix = function (c) { return Math.round(255 - (255 - parseInt(c, 16)) * 0.1).toString(16).padStart(2, '0'); };
    return '#' + mix(m[1]) + mix(m[2]) + mix(m[3]);
  }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  function emptySeller() { return { name: '', inn: '', kpp: '', address: '', bank: '', bik: '', corr: '', account: '', director: '', accountant: '' }; }

  function emptyBuyer() { return { name: '', inn: '', kpp: '', address: '' }; }

  function emptyItem() { return { id: uid(), name: '', qty: '', unit: '', price: '' }; }

  function nextNumber(list) {
    var max = 0, prefix = '', latest = 0;
    list.forEach(function (x) {
      var m = /^(.*?)(\d+)$/.exec(String(x.number || '').trim());
      if (!m) return;
      if (+m[2] > max) max = +m[2];
      if ((x.created || 0) >= latest) { latest = x.created || 0; prefix = m[1]; }
    });
    return prefix + (max + 1);
  }

  function sample() {
    var today = isoDate(new Date());
    return {
      id: uid(),
      number: '1',
      date: today,
      due: addDays(today, 5),
      currency: 'rub',
      seller: {
        name: 'ООО «Северный ветер»',
        inn: '7705123452',
        kpp: '770501001',
        address: '115054, г. Москва, ул. Пятницкая, д. 71, офис 12',
        bank: 'АО «Пример Банк», г. Москва',
        bik: '044525987',
        corr: '30101810900000000987',
        account: '40702810500000012345',
        director: 'Соколова А. В.',
        accountant: ''
      },
      buyer: { name: 'ИП Белов Сергей Николаевич', inn: '771234567859', kpp: '', address: '197022, г. Санкт-Петербург, наб. реки Карповки, д. 5' },
      items: [
        { id: uid(), name: 'Разработка лендинга под рекламную кампанию', qty: '1', unit: 'усл', price: '48 000,00' },
        { id: uid(), name: 'Подготовка текстов для 5 страниц', qty: '5', unit: 'шт', price: '3 500,00' },
        { id: uid(), name: 'Поддержка сайта', qty: '2', unit: 'мес', price: '7 500,00' }
      ],
      vatMode: 'none',
      vatRate: '22',
      note: '',
      accent: '#1d4d3a',
      showQr: true,
      showSign: true,
      paid: false,
      sample: true,
      created: Date.now(),
      updated: Date.now()
    };
  }

  function normalize(inv) {
    var x = inv && typeof inv === 'object' ? inv : {};
    var out = {
      id: String(x.id || uid()),
      number: String(x.number == null ? '' : x.number),
      date: String(x.date || ''),
      due: String(x.due || ''),
      currency: CUR[x.currency] ? x.currency : 'rub',
      seller: Object.assign(emptySeller(), x.seller || {}),
      buyer: Object.assign(emptyBuyer(), x.buyer || {}),
      items: Array.isArray(x.items) ? x.items.map(function (it) { return Object.assign(emptyItem(), it || {}); }) : [emptyItem()],
      vatMode: ['none', 'incl', 'top'].indexOf(x.vatMode) >= 0 ? x.vatMode : 'none',
      vatRate: String(x.vatRate == null ? '22' : x.vatRate),
      note: String(x.note || ''),
      accent: ACCENTS.indexOf(x.accent) >= 0 ? x.accent : ACCENTS[0],
      showQr: x.showQr !== false,
      showSign: x.showSign !== false,
      paid: !!x.paid,
      sample: !!x.sample,
      created: +x.created || Date.now(),
      updated: +x.updated || Date.now()
    };
    return out;
  }

  function clientKey(c) { return digits(c.inn) || clean(c.name).toLowerCase(); }

  function isBlank(inv) {
    return !clean(inv.buyer.name) && !inv.items.some(itemFilled);
  }

  function status(inv, today) {
    if (inv.paid) return 'paid';
    if (inv.due && today && daysBetween(today, inv.due) < 0) return 'overdue';
    return 'open';
  }

  var core = {
    parseNum: parseNum, lineKop: lineKop, totals: totals, money: money, dateLong: dateLong, dateShort: dateShort,
    innCheck: innCheck, kppCheck: kppCheck, bikCheck: bikCheck, accountCheck: accountCheck, corrCheck: corrCheck, check: check,
    qrPayload: qrPayload, qrSvg: qrSvg, sheetHtml: sheetHtml, pdfDoc: pdfDoc, nextNumber: nextNumber, normalize: normalize,
    sample: sample, status: status, isBlank: isBlank, words: words, addDays: addDays, title: title,
    setWords: function (f) { wordsFn = f; refresh(); }, setQr: function (q) { qrLib = q; refresh(); }
  };
  window.InvoiceCore = core;

  var root = document.querySelector('[data-inv-root]');
  if (!root) return;

  function $(sel, el) { return (el || root).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); }

  var store = load();
  var inv = currentInvoice();
  var form = $('[data-form]');
  var rowsEl = $('[data-rows]');
  var rowTpl = $('[data-tpl="row"]');
  var sheet = $('[data-sheet]');
  var sheetWrap = $('[data-sheet-wrap]');
  var stage = $('[data-stage]');
  var work = $('.inv__work');
  var drawer = $('[data-drawer]');
  var toastEl = $('[data-toast]');
  var savedEl = $('[data-saved]');
  var dtab = 'invoices';
  var lastFocus = null;

  function load() {
    var data = null;
    try { data = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { data = null; }
    if (!data || !Array.isArray(data.invoices)) {
      var first = sample();
      return { v: 1, invoices: [first], currentId: first.id, seller: Object.assign({}, first.seller), clients: [Object.assign({}, first.buyer)], logo: '', stamp: '' };
    }
    data.invoices = data.invoices.map(normalize);
    if (!data.invoices.length) data.invoices.push(normalize(sample()));
    data.seller = Object.assign(emptySeller(), data.seller || {});
    data.clients = Array.isArray(data.clients) ? data.clients.map(function (c) { return Object.assign(emptyBuyer(), c); }) : [];
    data.logo = typeof data.logo === 'string' ? data.logo : '';
    data.stamp = typeof data.stamp === 'string' ? data.stamp : '';
    return data;
  }

  function currentInvoice() {
    var found = store.invoices.filter(function (x) { return x.id === store.currentId; })[0];
    if (!found) { found = store.invoices[0]; store.currentId = found.id; }
    return found;
  }

  var saveTimer = 0;
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
      savedEl.textContent = 'Сохранено в браузере';
      savedEl.classList.remove('inv__saved--busy', 'inv__saved--bad');
      return true;
    } catch (e) {
      savedEl.textContent = 'Не сохранилось';
      savedEl.classList.add('inv__saved--bad');
      toast('Браузеру не хватает места. Уберите логотип или печать, либо удалите старые счета.');
      return false;
    }
  }

  function touch() {
    inv.updated = Date.now();
    inv.sample = false;
    savedEl.textContent = 'Сохраняем…';
    savedEl.classList.add('inv__saved--busy');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { rememberClient(); persist(); updateCount(); }, 400);
  }

  function rememberClient() {
    var b = inv.buyer;
    if (!clean(b.name)) return;
    var k = clientKey(b);
    var i = -1;
    store.clients.forEach(function (c, j) { if (clientKey(c) === k || clean(c.name).toLowerCase() === clean(b.name).toLowerCase()) i = j; });
    var copy = { name: b.name, inn: b.inn, kpp: b.kpp, address: b.address };
    if (i >= 0) store.clients[i] = copy; else store.clients.unshift(copy);
    fillClientsList();
  }

  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }

  function setPath(obj, path, val) {
    var ks = path.split('.'), last = ks.pop();
    var t = ks.reduce(function (o, k) { return o[k]; }, obj);
    t[last] = val;
  }

  function fillForm() {
    $$('[data-f]', form).forEach(function (el) {
      var v = getPath(inv, el.getAttribute('data-f'));
      if (el.type === 'checkbox') el.checked = v !== false;
      else el.value = v == null ? '' : v;
    });
    renderRows();
    syncSeg();
    syncUploads();
    $$('[data-check]', form).forEach(function (el) { validate(el, false); });
    fillClientsList();
  }

  function syncSeg() {
    $$('[data-vat-mode] .inv__seg-btn').forEach(function (b) {
      var on = b.getAttribute('data-value') === inv.vatMode;
      b.classList.toggle('inv__seg-btn--active', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    $('[data-vat-rate-wrap]').classList.toggle('inv__field--off', inv.vatMode === 'none');
    $$('[data-accent] .inv__swatch').forEach(function (b) {
      var on = b.getAttribute('data-value') === inv.accent;
      b.classList.toggle('inv__swatch--active', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    var span = daysBetween(inv.date, inv.due);
    $$('[data-due-days]').forEach(function (b) {
      var d = +b.getAttribute('data-due-days');
      b.classList.toggle('inv__chip--active', d === 0 ? !inv.due : span === d);
    });
  }

  function syncUploads() {
    ['logo', 'stamp'].forEach(function (k) {
      var box = $('[data-upload="' + k + '"]');
      var thumb = $('[data-thumb]', box);
      var img = $('img', thumb);
      box.classList.toggle('inv__upload--has', !!store[k]);
      if (store[k]) {
        if (!img) { img = document.createElement('img'); img.alt = ''; thumb.appendChild(img); }
        img.src = store[k];
      } else if (img) {
        img.remove();
      }
    });
  }

  function fillClientsList() {
    var dl = $('[data-clients-list]');
    dl.innerHTML = store.clients.map(function (c) {
      return '<option value="' + esc(c.name) + '">' + esc(digits(c.inn) ? 'ИНН ' + digits(c.inn) : '') + '</option>';
    }).join('');
  }

  function rowEl(it) {
    var node = rowTpl.content.firstElementChild.cloneNode(true);
    node.setAttribute('data-id', it.id);
    $$('[data-k]', node).forEach(function (el) { el.value = it[el.getAttribute('data-k')] || ''; });
    $('[data-sum]', node).textContent = money(lineKop(it));
    return node;
  }

  function renderRows() {
    rowsEl.innerHTML = '';
    inv.items.forEach(function (it) { rowsEl.appendChild(rowEl(it)); });
    syncEmpty();
  }

  function syncEmpty() {
    $('[data-rows-empty]').classList.toggle('inv__empty--on', !inv.items.length);
    $('.inv__rows-head').classList.toggle('inv__rows-head--off', !inv.items.length);
  }

  function itemById(id) { return inv.items.filter(function (x) { return x.id === id; })[0]; }

  function addRow(after, focus) {
    var it = emptyItem();
    var idx = after ? inv.items.indexOf(after) + 1 : inv.items.length;
    inv.items.splice(idx, 0, it);
    var node = rowEl(it);
    node.classList.add('inv__row--enter');
    var ref = rowsEl.children[idx] || null;
    rowsEl.insertBefore(node, ref);
    requestAnimationFrame(function () { node.classList.remove('inv__row--enter'); });
    syncEmpty();
    if (focus !== false) $('[data-k="name"]', node).focus();
    touch();
    render();
    return node;
  }

  function delRow(node) {
    var id = node.getAttribute('data-id');
    var idx = inv.items.indexOf(itemById(id));
    if (idx < 0) return;
    var removed = inv.items.splice(idx, 1)[0];
    node.classList.add('inv__row--leave');
    setTimeout(function () { node.remove(); syncEmpty(); }, 180);
    touch();
    render();
    if (itemFilled(removed)) {
      toast('Позиция удалена', 'Вернуть', function () {
        inv.items.splice(Math.min(idx, inv.items.length), 0, removed);
        renderRows();
        touch();
        render();
      });
    }
    return idx;
  }

  function moveRow(node, dir) {
    var id = node.getAttribute('data-id');
    var it = itemById(id);
    var i = inv.items.indexOf(it), j = i + dir;
    if (j < 0 || j >= inv.items.length) return;
    inv.items.splice(i, 1);
    inv.items.splice(j, 0, it);
    if (dir < 0) rowsEl.insertBefore(node, node.previousElementSibling);
    else rowsEl.insertBefore(node, node.nextElementSibling.nextElementSibling);
    node.classList.add('inv__row--moved');
    setTimeout(function () { node.classList.remove('inv__row--moved'); }, 300);
    touch();
    render();
  }

  function reorderFromDom() {
    var map = {};
    inv.items.forEach(function (x) { map[x.id] = x; });
    inv.items = $$('[data-row]', rowsEl).map(function (n) { return map[n.getAttribute('data-id')]; }).filter(Boolean);
    touch();
    render();
  }

  function validate(el, live) {
    var field = el.closest('.inv__field');
    var msg = check(el.getAttribute('data-check'), el.value, inv);
    if (live && !field.classList.contains('inv__field--bad') && msg) return;
    field.classList.toggle('inv__field--bad', !!msg);
    field.classList.toggle('inv__field--ok', !msg && !!String(el.value).trim());
    var err = $('[data-err]', field);
    if (err) err.textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  var rendering = 0;
  function render() {
    if (rendering) return;
    rendering = requestAnimationFrame(function () {
      rendering = 0;
      renderNow();
    });
  }

  function renderNow() {
    var t = totals(inv);
    var q = qrPayload(inv, t);
    var svg = inv.showQr && q.ok ? qrSvg(q.text) : '';
    sheet.innerHTML = sheetHtml(inv, t, { logo: store.logo, stamp: store.stamp, qr: svg });
    var hint = $('[data-qr-hint]');
    hint.textContent = inv.showQr && !q.ok ? q.reason : (inv.showQr && q.ok && !qrLib ? 'QR-код загружается…' : '');
    renderTotals(t);
    var cur = CUR[inv.currency] || CUR.rub;
    $('[data-tab-sum]').textContent = t.total ? money(t.total) + ' ' + cur.sign : '';
    docTitle();
    fit();
  }

  function renderTotals(t) {
    var cur = CUR[inv.currency] || CUR.rub;
    var w = words(t.total, inv.currency);
    var rows = totalsRows(t).map(function (r, i) {
      return '<div class="inv__total' + (i === 2 ? ' inv__total--grand' : '') + '"><span>' + esc(r[0]) + '</span><span class="inv__num">' + r[1] + (r[1] !== '—' ? ' ' + cur.sign : '') + '</span></div>';
    }).join('');
    $('[data-totals]').innerHTML = rows + (w ? '<div class="inv__words">' + esc(w) + '</div>' : '');
  }

  function fit() {
    var avail = stage.clientWidth;
    if (!avail) return;
    var s = Math.min(1, avail / SHEET_W);
    sheet.style.transform = 'scale(' + s + ')';
    sheetWrap.style.width = Math.floor(SHEET_W * s) + 'px';
    sheetWrap.style.height = Math.ceil(sheet.offsetHeight * s) + 'px';
  }

  function updateRowSum(node) {
    var it = itemById(node.getAttribute('data-id'));
    if (it) $('[data-sum]', node).textContent = money(lineKop(it));
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); });

  form.addEventListener('input', function (e) {
    var el = e.target;
    var path = el.getAttribute('data-f');
    if (path) {
      var v = el.type === 'checkbox' ? el.checked : el.value;
      setPath(inv, path, v);
      if (path.indexOf('seller.') === 0) store.seller[path.slice(7)] = v;
      if (el.hasAttribute('data-check')) validate(el, true);
      if (path === 'seller.bik') $$('[data-check="account"],[data-check="corr"]', form).forEach(function (x) { if (x.value) validate(x, false); });
      if (path === 'date' || path === 'due') syncSeg();
      touch();
      render();
      return;
    }
    var k = el.getAttribute('data-k');
    if (k) {
      var node = el.closest('[data-row]');
      var it = itemById(node.getAttribute('data-id'));
      if (!it) return;
      it[k] = el.value;
      if (k === 'qty' || k === 'price') {
        var bad = String(el.value).trim() !== '' && isNaN(parseNum(el.value));
        el.classList.toggle('inv__input--bad', bad);
      }
      updateRowSum(node);
      touch();
      render();
    }
  });

  form.addEventListener('change', function (e) {
    var el = e.target;
    if (el.getAttribute('data-f') === 'buyer.name') {
      var c = store.clients.filter(function (x) { return clean(x.name).toLowerCase() === clean(el.value).toLowerCase(); })[0];
      if (c) applyClient(c);
    }
    if (el.getAttribute('data-k') === 'price' || el.getAttribute('data-k') === 'qty') {
      var n = parseNum(el.value);
      if (!isNaN(n) && el.getAttribute('data-k') === 'price') {
        el.value = fmtMoney.format(n).replace(/[  ]/g, ' ');
        var node = el.closest('[data-row]');
        var it = itemById(node.getAttribute('data-id'));
        if (it) it.price = el.value;
      }
    }
    if (el.hasAttribute('data-file')) readImage(el);
  });

  form.addEventListener('focusout', function (e) {
    if (e.target.hasAttribute && e.target.hasAttribute('data-check')) validate(e.target, false);
  });

  form.addEventListener('keydown', function (e) {
    var el = e.target;
    var node = el.closest && el.closest('[data-row]');
    if (!node) return;
    var it = itemById(node.getAttribute('data-id'));
    if (e.key === 'Enter') {
      e.preventDefault();
      var next = node.nextElementSibling;
      if (e.ctrlKey || e.metaKey || !next) { addRow(it); return; }
      var k = el.getAttribute('data-k');
      $('[data-k="' + (k || 'name') + '"]', next).focus();
      return;
    }
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      var k2 = el.getAttribute('data-k');
      moveRow(node, e.key === 'ArrowUp' ? -1 : 1);
      $('[data-k="' + k2 + '"]', node).focus();
      return;
    }
    if (e.key === 'Backspace' && el.getAttribute('data-k') === 'name' && el.value === '' && it && !itemFilled(it) && !String(it.qty).trim() && inv.items.length > 1) {
      e.preventDefault();
      var prev = node.previousElementSibling || node.nextElementSibling;
      delRow(node);
      if (prev) $('[data-k="name"]', prev).focus();
    }
  });

  root.addEventListener('click', function (e) {
    var seg = e.target.closest('[data-vat-mode] .inv__seg-btn');
    if (seg) { inv.vatMode = seg.getAttribute('data-value'); syncSeg(); touch(); render(); return; }
    var sw = e.target.closest('[data-accent] .inv__swatch');
    if (sw) { inv.accent = sw.getAttribute('data-value'); syncSeg(); touch(); render(); return; }
    var chip = e.target.closest('[data-due-days]');
    if (chip) {
      var d = +chip.getAttribute('data-due-days');
      inv.due = d ? addDays(inv.date || isoDate(new Date()), d) : '';
      $('[data-f="due"]').value = inv.due;
      syncSeg(); touch(); render();
      return;
    }
    var tab = e.target.closest('[data-view]');
    if (tab) { setView(tab.getAttribute('data-view')); return; }
    var dt = e.target.closest('[data-dtab]');
    if (dt) { dtab = dt.getAttribute('data-dtab'); renderDrawer(); return; }
    var item = e.target.closest('[data-open]');
    var actEl = e.target.closest('[data-act]');
    if (item && !actEl) { openInvoice(item.getAttribute('data-open')); closeDrawer(); return; }
    if (!actEl) return;
    var act = actEl.getAttribute('data-act');
    if (act === 'row-add') addRow(null);
    else if (act === 'row-del') delRow(actEl.closest('[data-row]'));
    else if (act === 'new') newInvoice();
    else if (act === 'duplicate') duplicate();
    else if (act === 'print') doPrint();
    else if (act === 'pdf') doPdf();
    else if (act === 'drawer') openDrawer('invoices');
    else if (act === 'drawer-clients') openDrawer('clients');
    else if (act === 'drawer-close') closeDrawer();
    else if (act === 'file-clear') { store[actEl.getAttribute('data-target')] = ''; syncUploads(); persist(); render(); }
    else if (act === 'inv-paid') togglePaid(actEl.getAttribute('data-id'));
    else if (act === 'inv-del') deleteInvoice(actEl.getAttribute('data-id'));
    else if (act === 'client-use') useClient(+actEl.getAttribute('data-i'));
    else if (act === 'client-del') deleteClient(+actEl.getAttribute('data-i'));
    else if (act === 'export') exportJson();
  });

  var pdfBtn = $('[data-act="pdf"]');
  pdfBtn.addEventListener('pointerenter', function () { loadPdf().catch(function () {}); }, { once: true });
  pdfBtn.addEventListener('focus', function () { loadPdf().catch(function () {}); }, { once: true });

  $('[data-import]').addEventListener('change', function (e) { importJson(e.target); });
  $('[data-dsearch]').addEventListener('input', renderDrawer);

  var intro = $('[data-intro]');
  function closeIntro() {
    if (!intro.classList.contains('inv__intro--open')) return;
    intro.classList.remove('inv__intro--open');
    intro.classList.add('inv__intro--leave');
    setTimeout(function () { intro.classList.remove('inv__intro--leave'); intro.hidden = true; }, 260);
    var f = $('[data-f="buyer.name"]');
    if (f && isWide()) f.focus({ preventScroll: true });
  }
  $('[data-intro-open]').addEventListener('click', closeIntro);

  document.addEventListener('keydown', function (e) {
    var mod = e.ctrlKey || e.metaKey;
    if (intro.classList.contains('inv__intro--open')) {
      if (e.key === 'Escape' || (e.key === 'Enter' && !(e.target.closest && e.target.closest('[data-intro-back]')))) { e.preventDefault(); closeIntro(); }
      else if (e.key === 'Tab') {
        var a = $('[data-intro-back]'), b = $('[data-intro-open]');
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
        else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
        else if (document.activeElement !== a && document.activeElement !== b) { e.preventDefault(); b.focus(); }
      }
      return;
    }
    if (mod && e.shiftKey && e.code === 'KeyS') { e.preventDefault(); doPdf(); return; }
    if (mod && !e.shiftKey && e.code === 'KeyS') { e.preventDefault(); clearTimeout(saveTimer); rememberClient(); if (persist()) toast('Счет сохранен в этом браузере'); return; }
    if (e.altKey && !mod && e.code === 'KeyN') { e.preventDefault(); newInvoice(); return; }
    if (e.key === 'Escape' && drawer.classList.contains('inv__drawer--open')) { e.preventDefault(); closeDrawer(); return; }
    if (e.key === 'Tab' && drawer.classList.contains('inv__drawer--open')) trapFocus(e);
  });

  function setView(v) {
    work.setAttribute('data-mobile-view', v);
    $$('[data-view]').forEach(function (b) {
      var on = b.getAttribute('data-view') === v;
      b.classList.toggle('inv__tab--active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (v === 'preview') requestAnimationFrame(fit);
  }

  function applyClient(c) {
    inv.buyer = { name: c.name, inn: c.inn, kpp: c.kpp, address: c.address };
    ['name', 'inn', 'kpp', 'address'].forEach(function (k) {
      var el = $('[data-f="buyer.' + k + '"]');
      el.value = inv.buyer[k] || '';
      if (el.hasAttribute('data-check')) validate(el, false);
    });
    touch();
    render();
  }

  function freshInvoice() {
    var last = store.invoices.slice().sort(function (a, b) { return b.updated - a.updated; })[0] || {};
    var today = isoDate(new Date());
    var span = last.date && last.due ? daysBetween(last.date, last.due) : 5;
    return normalize({
      id: uid(),
      number: nextNumber(store.invoices),
      date: today,
      due: span == null ? '' : addDays(today, span),
      currency: last.currency || 'rub',
      seller: Object.assign({}, store.seller),
      buyer: emptyBuyer(),
      items: [emptyItem()],
      vatMode: last.vatMode || 'none',
      vatRate: last.vatRate || '22',
      note: last.note || '',
      accent: last.accent || ACCENTS[0],
      showQr: last.showQr !== false,
      showSign: last.showSign !== false,
      created: Date.now(),
      updated: Date.now()
    });
  }

  function switchTo(x) {
    inv = x;
    store.currentId = x.id;
    fillForm();
    persist();
    updateCount();
    render();
  }

  function newInvoice(buyer) {
    if (isBlank(inv) && !inv.sample) {
      if (buyer) { applyClient(buyer); toast('Покупатель подставлен в новый счет'); }
      else { toast('Это уже новый счет, заполняйте'); focusFirst(); }
      return;
    }
    var x = freshInvoice();
    if (buyer) x.buyer = { name: buyer.name, inn: buyer.inn, kpp: buyer.kpp, address: buyer.address };
    store.invoices.unshift(x);
    switchTo(x);
    setView('form');
    toast('Счет № ' + x.number + ' создан');
    focusFirst();
  }

  function focusFirst() {
    var target = clean(inv.buyer.name) ? $('[data-k="name"]', rowsEl) : $('[data-f="buyer.name"]');
    if (target) target.focus({ preventScroll: false });
  }

  function duplicate() {
    var x = normalize(JSON.parse(JSON.stringify(inv)));
    var fresh = freshInvoice();
    x.id = fresh.id;
    x.number = fresh.number;
    x.date = fresh.date;
    x.due = inv.date && inv.due ? addDays(fresh.date, daysBetween(inv.date, inv.due)) : '';
    x.paid = false;
    x.sample = false;
    x.items = x.items.map(function (it) { return Object.assign({}, it, { id: uid() }); });
    x.created = x.updated = Date.now();
    store.invoices.unshift(x);
    switchTo(x);
    toast('Копия создана: счет № ' + x.number);
  }

  function openInvoice(id) {
    var x = store.invoices.filter(function (y) { return y.id === id; })[0];
    if (x) switchTo(x);
  }

  function togglePaid(id) {
    var x = store.invoices.filter(function (y) { return y.id === id; })[0];
    if (!x) return;
    x.paid = !x.paid;
    x.updated = Date.now();
    persist();
    renderDrawer();
    if (x === inv) render();
  }

  function deleteInvoice(id) {
    var idx = -1;
    store.invoices.forEach(function (y, i) { if (y.id === id) idx = i; });
    if (idx < 0) return;
    var removed = store.invoices.splice(idx, 1)[0];
    var wasCurrent = removed === inv;
    if (!store.invoices.length) store.invoices.push(freshInvoice());
    if (wasCurrent) switchTo(store.invoices.slice().sort(function (a, b) { return b.updated - a.updated; })[0]);
    else persist();
    updateCount();
    renderDrawer();
    toast('Счет № ' + removed.number + ' удален', 'Отменить', function () {
      store.invoices.splice(Math.min(idx, store.invoices.length), 0, removed);
      if (wasCurrent) switchTo(removed); else persist();
      updateCount();
      renderDrawer();
    });
  }

  function useClient(i) {
    var c = store.clients[i];
    if (!c) return;
    closeDrawer();
    newInvoice(c);
  }

  function deleteClient(i) {
    var c = store.clients.splice(i, 1)[0];
    if (!c) return;
    persist();
    fillClientsList();
    renderDrawer();
    toast('Клиент удален', 'Отменить', function () {
      store.clients.splice(i, 0, c);
      persist();
      fillClientsList();
      renderDrawer();
    });
  }

  function isWide() {
    return !!(window.matchMedia && window.matchMedia('(min-width: 1280px)').matches);
  }

  function updateCount() {
    $('[data-count]').textContent = String(store.invoices.length);
    if (isWide() || drawer.classList.contains('inv__drawer--open')) renderDrawer();
  }

  function docTitle() {
    var el = $('[data-doc-title]');
    var b = clean(inv.buyer.name);
    el.textContent = 'Счет № ' + (clean(inv.number) || '—') + (b ? ' · ' + b : '');
    el.title = el.textContent;
  }

  function openDrawer(tab) {
    dtab = tab || 'invoices';
    $('[data-dsearch]').value = '';
    renderDrawer();
    if (isWide()) { $('[data-dsearch]').focus(); return; }
    lastFocus = document.activeElement;
    drawer.classList.add('inv__drawer--open');
    document.documentElement.classList.add('inv-lock');
    setTimeout(function () { $('[data-dsearch]').focus(); }, 60);
  }

  function closeDrawer() {
    if (!drawer.classList.contains('inv__drawer--open')) return;
    drawer.classList.remove('inv__drawer--open');
    document.documentElement.classList.remove('inv-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function trapFocus(e) {
    var f = $$('button, input, [tabindex]:not([tabindex="-1"])', drawer).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function renderDrawer() {
    $$('[data-dtab]').forEach(function (b) { b.classList.toggle('inv__seg-btn--active', b.getAttribute('data-dtab') === dtab); });
    var q = clean($('[data-dsearch]').value).toLowerCase();
    var list = $('[data-dlist]');
    var stats = $('[data-dstats]');
    var today = isoDate(new Date());
    if (dtab === 'invoices') {
      var all = store.invoices.slice().sort(function (a, b) { return b.updated - a.updated; });
      var open = 0, overdue = 0, paid = 0;
      all.forEach(function (x) {
        if ((x.currency || 'rub') !== 'rub') return;
        var t = totals(x).total, st = status(x, today);
        if (st === 'paid') paid += t; else if (st === 'overdue') overdue += t; else open += t;
      });
      stats.innerHTML = '<div class="inv__stat"><span>Ждут оплаты</span><b>' + rub(open + overdue) + '</b></div>' +
        '<div class="inv__stat inv__stat--bad"><span>Просрочено</span><b>' + rub(overdue) + '</b></div>' +
        '<div class="inv__stat inv__stat--ok"><span>Оплачено</span><b>' + rub(paid) + '</b></div>';
      stats.hidden = false;
      var shown = all.filter(function (x) {
        if (!q) return true;
        var t = totals(x);
        var hay = [x.number, x.buyer.name, x.buyer.inn, money(t.total), String(t.total / 100), dateShort(x.date)].join(' ').toLowerCase().replace(/[  ]/g, ' ');
        return hay.indexOf(q) >= 0;
      });
      if (!shown.length) {
        list.innerHTML = '<div class="inv__dempty"><i class="ph ph-magnifying-glass" aria-hidden="true"></i>' + (q ? 'Ничего не нашли по запросу «' + esc(q) + '»' : 'Счетов пока нет') + '</div>';
        return;
      }
      list.innerHTML = shown.map(function (x) {
        var t = totals(x), st = status(x, today), cur = CUR[x.currency] || CUR.rub;
        var label = st === 'paid' ? 'Оплачен' : st === 'overdue' ? 'Просрочен' : 'Ждет оплаты';
        return '<div class="inv__ditem' + (x === inv ? ' inv__ditem--current' : '') + '" data-open="' + esc(x.id) + '" role="button" tabindex="0">' +
          '<div class="inv__ditem-main"><span class="inv__ditem-title">№ ' + esc(x.number || '—') + ' · ' + (esc(clean(x.buyer.name)) || '<i>Без покупателя</i>') + '</span>' +
          '<span class="inv__ditem-sub">' + esc(dateShort(x.date)) + ' · <span class="inv__pill inv__pill--' + st + '">' + label + '</span></span></div>' +
          '<span class="inv__ditem-sum inv__num">' + money(t.total) + ' ' + cur.sign + '</span>' +
          '<span class="inv__ditem-acts">' +
          '<button type="button" class="inv__icon-btn' + (x.paid ? ' inv__icon-btn--on' : '') + '" data-act="inv-paid" data-id="' + esc(x.id) + '" title="' + (x.paid ? 'Снять отметку об оплате' : 'Отметить оплаченным') + '" aria-label="Оплачен"><i class="ph ph-check-circle" aria-hidden="true"></i></button>' +
          '<button type="button" class="inv__icon-btn inv__icon-btn--danger" data-act="inv-del" data-id="' + esc(x.id) + '" title="Удалить счет" aria-label="Удалить"><i class="ph ph-trash" aria-hidden="true"></i></button>' +
          '</span></div>';
      }).join('');
      return;
    }
    stats.hidden = true;
    var clients = store.clients.map(function (c, i) { return { c: c, i: i }; }).filter(function (o) {
      return !q || [o.c.name, o.c.inn, o.c.address].join(' ').toLowerCase().indexOf(q) >= 0;
    });
    if (!clients.length) {
      list.innerHTML = '<div class="inv__dempty"><i class="ph ph-users" aria-hidden="true"></i>' + (q ? 'Ничего не нашли по запросу «' + esc(q) + '»' : 'Клиенты появятся здесь сами, когда вы выставите им счет') + '</div>';
      return;
    }
    list.innerHTML = clients.map(function (o) {
      var c = o.c;
      var count = store.invoices.filter(function (x) { return clientKey(x.buyer) === clientKey(c); }).length;
      return '<div class="inv__ditem">' +
        '<div class="inv__ditem-main"><span class="inv__ditem-title">' + esc(c.name) + '</span>' +
        '<span class="inv__ditem-sub">' + (digits(c.inn) ? 'ИНН ' + esc(digits(c.inn)) + ' · ' : '') + count + ' ' + plural(count, 'счет', 'счета', 'счетов') + '</span></div>' +
        '<span class="inv__ditem-acts">' +
        '<button type="button" class="inv__btn inv__btn--soft inv__btn--sm" data-act="client-use" data-i="' + o.i + '">Выставить счет</button>' +
        '<button type="button" class="inv__icon-btn inv__icon-btn--danger" data-act="client-del" data-i="' + o.i + '" title="Удалить клиента" aria-label="Удалить"><i class="ph ph-trash" aria-hidden="true"></i></button>' +
        '</span></div>';
    }).join('');
  }

  var fmtRub = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
  function rub(kop) {
    var v = kop / 100;
    if (v >= 1e6) return String(Math.round(v / 1e5) / 10).replace('.', ',') + ' млн ₽';
    return fmtRub.format(Math.round(v)) + ' ₽';
  }

  function plural(n, a, b, c) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return a;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return b;
    return c;
  }

  $('[data-dlist]').addEventListener('keydown', function (e) {
    var it = e.target.closest('[data-open]');
    if (it && e.target === it && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openInvoice(it.getAttribute('data-open')); closeDrawer(); }
  });

  var toastTimer = 0;
  function toast(msg, action, onAction) {
    clearTimeout(toastTimer);
    toastEl.innerHTML = '<span>' + esc(msg) + '</span>' + (action ? '<button type="button" class="inv__toast-btn">' + esc(action) + '</button>' : '');
    toastEl.classList.add('inv__toast--on');
    if (action) {
      $('.inv__toast-btn', toastEl).addEventListener('click', function () {
        toastEl.classList.remove('inv__toast--on');
        onAction();
      }, { once: true });
    }
    toastTimer = setTimeout(function () { toastEl.classList.remove('inv__toast--on'); }, action ? 6000 : 3200);
  }

  function readImage(input) {
    var file = input.files && input.files[0];
    var kind = input.getAttribute('data-file');
    input.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast('Нужна картинка PNG, JPG или WebP'); return; }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var max = kind === 'logo' ? 480 : 420;
      var k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * k));
      c.height = Math.max(1, Math.round(img.naturalHeight * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      var prev = store[kind];
      store[kind] = c.toDataURL('image/png');
      if (!persist()) { store[kind] = prev; persist(); return; }
      syncUploads();
      render();
      toast(kind === 'logo' ? 'Логотип добавлен' : 'Печать добавлена');
    };
    img.onerror = function () { URL.revokeObjectURL(url); toast('Не получилось открыть картинку'); };
    img.src = url;
  }

  function download(name, blob) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function exportJson() {
    var blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    download('scheta-' + isoDate(new Date()) + '.json', blob);
    toast('Архив скачан: ' + store.invoices.length + ' ' + plural(store.invoices.length, 'счет', 'счета', 'счетов'));
  }

  function importJson(input) {
    var file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    file.text().then(function (txt) {
      var data = JSON.parse(txt);
      if (!data || !Array.isArray(data.invoices)) throw new Error('shape');
      var have = {};
      store.invoices.forEach(function (x) { have[x.id] = true; });
      var added = 0;
      data.invoices.forEach(function (x) {
        var n = normalize(x);
        if (have[n.id]) return;
        store.invoices.push(n);
        added++;
      });
      (Array.isArray(data.clients) ? data.clients : []).forEach(function (c) {
        var cc = Object.assign(emptyBuyer(), c);
        if (!store.clients.some(function (y) { return clientKey(y) === clientKey(cc); })) store.clients.push(cc);
      });
      if (!store.logo && typeof data.logo === 'string') store.logo = data.logo;
      if (!store.stamp && typeof data.stamp === 'string') store.stamp = data.stamp;
      persist();
      updateCount();
      fillClientsList();
      syncUploads();
      renderDrawer();
      render();
      toast(added ? 'Загружено счетов: ' + added : 'Новых счетов в архиве нет');
    }).catch(function () { toast('Это не архив счетов'); });
  }

  function loadCss(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.onload = function () { resolve(); };
      s.onerror = function () { s.remove(); reject(new Error('load ' + src)); };
      document.head.appendChild(s);
    });
  }

  var once = {};
  function lazy(key, fn) {
    if (!once[key]) once[key] = fn().catch(function (e) { once[key] = null; throw e; });
    return once[key];
  }

  function loadWords() {
    return lazy('words', function () {
      return import(CDN.words).then(function (m) {
        wordsFn = m.convert || (m.default && m.default.convert);
        render();
      });
    });
  }

  function loadQr() {
    return lazy('qr', function () {
      return loadScript(CDN.qr).then(function () {
        var q = window.qrcode;
        if (q && q.stringToBytesFuncs && q.stringToBytesFuncs['UTF-8']) q.stringToBytes = q.stringToBytesFuncs['UTF-8'];
        qrLib = q;
        render();
      });
    });
  }

  function loadSortable() {
    return lazy('sortable', function () {
      return loadScript(CDN.sortable).then(function () {
        window.Sortable.create(rowsEl, {
          handle: '.inv__handle',
          animation: 160,
          ghostClass: 'inv__row--ghost',
          chosenClass: 'inv__row--chosen',
          dragClass: 'inv__row--drag',
          onEnd: reorderFromDom
        });
      });
    });
  }

  function loadPdf() {
    return lazy('pdf', function () {
      return loadScript(CDN.pdf).then(function () { return loadScript(CDN.fonts); });
    });
  }

  function doPdf() {
    if (pdfBtn.classList.contains('inv__btn--busy')) return;
    pdfBtn.classList.add('inv__btn--busy');
    Promise.all([loadPdf(), loadWords().catch(function () {}), inv.showQr ? loadQr().catch(function () {}) : null]).then(function () {
      var t = totals(inv);
      var q = qrPayload(inv, t);
      var doc = pdfDoc(inv, t, { logo: store.logo, stamp: inv.showSign !== false ? store.stamp : '', qr: inv.showQr && q.ok ? qrSvg(q.text) : '' });
      return new Promise(function (resolve) {
        window.pdfMake.createPdf(doc).download('Счет № ' + (clean(inv.number) || 'б-н') + (inv.date ? ' от ' + dateShort(inv.date) : '') + '.pdf', resolve);
      });
    }).then(function () {
      toast('PDF готов');
    }).catch(function () {
      toast('Не удалось собрать PDF. Проверьте интернет и попробуйте еще раз');
    }).then(function () {
      pdfBtn.classList.remove('inv__btn--busy');
    });
  }

  function doPrint() {
    renderNow();
    window.print();
  }

  window.addEventListener('beforeprint', function () {
    document.documentElement.classList.add('inv-printing');
    sheet.style.transform = '';
    sheetWrap.style.width = '';
    sheetWrap.style.height = '';
  });
  window.addEventListener('afterprint', function () {
    document.documentElement.classList.remove('inv-printing');
    fit();
  });

  window.addEventListener('storage', function (e) {
    if (e.key !== KEY || !e.newValue) return;
    store = load();
    inv = currentInvoice();
    fillForm();
    updateCount();
    render();
    if (drawer.classList.contains('inv__drawer--open')) renderDrawer();
  });

  if (window.ResizeObserver) new ResizeObserver(function () { fit(); }).observe(stage);
  else window.addEventListener('resize', fit);

  loadCss(CDN.type);
  loadCss(CDN.icons);
  document.documentElement.classList.add('inv-on');
  fillForm();
  updateCount();
  renderNow();
  persist();
  refresh = render;
  $('[data-intro-open]').focus({ preventScroll: true });
  if (window.matchMedia) {
    var mq = window.matchMedia('(min-width: 1280px)');
    var onMq = function () { if (mq.matches) { closeDrawer(); renderDrawer(); } };
    if (mq.addEventListener) mq.addEventListener('change', onMq);
  }

  loadWords().catch(function () {});
  loadQr().catch(function () {});
  loadSortable().catch(function () {});
})();
