(function () {
  "use strict";

  var CDN = "https://cdn.jsdelivr.net/npm/";
  var FONT = CDN + "@fontsource-variable/onest@5.3.1/index.css";
  var LIBS = [
    CDN + "sortablejs@1.15.6/Sortable.min.js",
    CDN + "marked@12.0.2/marked.min.js",
    CDN + "dompurify@3.2.6/dist/purify.min.js"
  ];
  var KEY = "demo-kanban:board";
  var LABELS = [
    { id: "red", name: "Срочно" },
    { id: "orange", name: "Баг" },
    { id: "yellow", name: "Дизайн" },
    { id: "green", name: "Готово к релизу" },
    { id: "blue", name: "Фронтенд" },
    { id: "purple", name: "Бэкенд" }
  ];
  var ICONS = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    down: '<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5"/><path d="M5 19h14"/>',
    up: '<path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M5 19h14"/>',
    reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4 4v4h4"/>',
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4"/><path d="M12 16.8v.2"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
    text: '<path d="M5 7h14M5 12h14M5 17h9"/>',
    check: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    tag: '<path d="M4 12.6V5a1 1 0 0 1 1-1h7.6l7.1 7.1a1.4 1.4 0 0 1 0 2l-5.6 5.6a1.4 1.4 0 0 1-2 0z"/><circle cx="8.5" cy="8.5" r="1.3"/>',
    trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
    move: '<path d="M5 12h14m0 0-4-4m4 4-4 4"/>',
    grip: '<circle cx="9" cy="7" r="1"/><circle cx="15" cy="7" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="17" r="1"/><circle cx="15" cy="17" r="1"/>'
  };

  var board, root, query = "", listSorts = {}, colSort = null;

  function uid() { return Math.random().toString(36).slice(2, 10); }

  function today(offset) {
    var d = new Date(); d.setDate(d.getDate() + offset);
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }

  function demoBoard() {
    return {
      title: "Запуск сайта",
      columns: [
        { id: uid(), title: "Идеи", cards: [
          { id: uid(), title: "Раздел с кейсами клиентов", desc: "Собрать **три** истории с цифрами до и после.", labels: ["yellow"], due: "", checklist: [] },
          { id: uid(), title: "Подписка на рассылку", desc: "", labels: ["blue"], due: "", checklist: [] }
        ] },
        { id: uid(), title: "К работе", cards: [
          { id: uid(), title: "Сверстать страницу тарифов", desc: "Три колонки, переключатель *месяц/год*.\n\n- макет в Figma\n- тексты от маркетинга", labels: ["blue", "yellow"], due: today(3), checklist: [
            { id: uid(), text: "Сетка тарифов", done: true },
            { id: uid(), text: "Переключатель периода", done: false },
            { id: uid(), text: "Мобильная версия", done: false }
          ] },
          { id: uid(), title: "Вебхук оплаты", desc: "Обрабатывать повторные уведомления идемпотентно.", labels: ["purple"], due: today(5), checklist: [] }
        ] },
        { id: uid(), title: "В работе", cards: [
          { id: uid(), title: "Форма заявки теряет телефон", desc: "Воспроизводится в Safari при автозаполнении.", labels: ["red", "orange"], due: today(-1), checklist: [] }
        ] },
        { id: uid(), title: "Готово", cards: [
          { id: uid(), title: "Домен и SSL", desc: "", labels: ["green"], due: "", checklist: [] }
        ] }
      ]
    };
  }

  function normCard(c) {
    return { id: c.id || uid(), title: String(c.title || "Без названия"), desc: String(c.desc || ""), labels: Array.isArray(c.labels) ? c.labels : [], due: c.due || "", checklist: Array.isArray(c.checklist) ? c.checklist : [] };
  }

  function normBoard(b) {
    if (!b || !Array.isArray(b.columns)) return null;
    b.title = String(b.title || "Доска");
    b.columns.forEach(function (c) { c.id = c.id || uid(); c.title = String(c.title || "Колонка"); c.cards = (c.cards || []).map(normCard); });
    return b;
  }

  function load() {
    try {
      var b = normBoard(JSON.parse(localStorage.getItem(KEY) || "null"));
      if (b) return b;
    } catch (e) {}
    return demoBoard();
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(board)); } catch (e) {}
  }

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src; s.async = false;
      s.onload = res; s.onerror = function () { rej(new Error(src)); };
      document.head.appendChild(s);
    });
  }

  function loadFont() {
    if (document.querySelector("link[data-stk-font]")) return;
    var l = document.createElement("link");
    l.rel = "stylesheet"; l.href = FONT; l.setAttribute("data-stk-font", "");
    document.head.appendChild(l);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function icon(name) {
    var s = el("span", "stk__ico");
    s.setAttribute("aria-hidden", "true");
    s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + "</svg>";
    return s;
  }

  function btn(cls, text, title, ico) {
    var b = el("button", cls);
    b.type = "button";
    if (ico) b.appendChild(icon(ico));
    if (text) b.appendChild(el("span", "stk__btn-text", text));
    if (title) { b.title = title; b.setAttribute("aria-label", title); }
    return b;
  }

  function md(src) {
    return window.DOMPurify.sanitize(window.marked.parse(src || "", { breaks: true }));
  }

  function labelOf(id) { return LABELS.filter(function (x) { return x.id === id; })[0]; }

  function findCard(id) {
    for (var i = 0; i < board.columns.length; i++) {
      var c = board.columns[i];
      for (var j = 0; j < c.cards.length; j++) if (c.cards[j].id === id) return { col: c, card: c.cards[j], index: j };
    }
    return null;
  }

  function findCol(id) {
    for (var i = 0; i < board.columns.length; i++) if (board.columns[i].id === id) return board.columns[i];
    return null;
  }

  function matches(card) {
    if (!query) return true;
    var q = query.toLowerCase();
    if ((card.title + " " + card.desc).toLowerCase().indexOf(q) !== -1) return true;
    return card.labels.some(function (l) { var lab = labelOf(l); return lab && lab.name.toLowerCase().indexOf(q) !== -1; });
  }

  function dueState(due) {
    if (!due) return "";
    var t = today(0);
    if (due < t) return "overdue";
    if (due === t) return "today";
    return "";
  }

  function fmtDate(d) {
    var p = d.split("-");
    var m = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    return +p[2] + " " + m[+p[1] - 1];
  }

  function plural(n, a, b, c) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return a;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return b;
    return c;
  }

  function badge(cls, ico, text) {
    var b = el("span", "stk__badge" + (cls ? " stk__badge--" + cls : ""));
    b.appendChild(icon(ico));
    if (text) b.appendChild(el("span", null, text));
    return b;
  }

  function renderCard(card) {
    var n = el("div", "stk__card");
    n.dataset.id = card.id;
    n.tabIndex = 0;
    n.setAttribute("role", "button");
    if (card.labels.length) {
      var ls = el("div", "stk__card-labels");
      card.labels.forEach(function (l) {
        var lab = labelOf(l);
        ls.appendChild(el("span", "stk__label stk__label--" + l, lab ? lab.name : l));
      });
      n.appendChild(ls);
    }
    n.appendChild(el("div", "stk__card-title", card.title));
    var meta = el("div", "stk__card-meta");
    if (card.due) {
      var st = dueState(card.due);
      var b = badge(st, "clock", fmtDate(card.due));
      b.title = st === "overdue" ? "Срок прошел" : st === "today" ? "Срок сегодня" : "Срок";
      meta.appendChild(b);
    }
    if (card.desc) { var d = badge("", "text"); d.title = "Есть описание"; meta.appendChild(d); }
    if (card.checklist.length) {
      var done = card.checklist.filter(function (x) { return x.done; }).length;
      meta.appendChild(badge(done === card.checklist.length ? "done" : "", "check", done + "/" + card.checklist.length));
    }
    if (meta.children.length) n.appendChild(meta);
    n.addEventListener("click", function () { openCard(card.id); });
    n.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCard(card.id); } });
    return n;
  }

  function renderColumn(col, idx) {
    var c = el("section", "stk__col");
    c.dataset.id = col.id;
    c.style.setProperty("--i", idx);
    var head = el("div", "stk__col-head");
    var grip = icon("grip"); grip.classList.add("stk__grip");
    head.appendChild(grip);
    var title = el("h2", "stk__col-title", col.title);
    title.contentEditable = "true";
    title.spellcheck = false;
    title.setAttribute("aria-label", "Название колонки");
    title.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); title.blur(); }
      if (e.key === "Escape") { title.textContent = col.title; title.blur(); }
    });
    title.addEventListener("blur", function () {
      var v = title.textContent.trim();
      if (v && v !== col.title) { col.title = v; save(); updateStat(); } else title.textContent = col.title;
    });
    head.appendChild(title);
    var visible = col.cards.filter(matches);
    head.appendChild(el("span", "stk__col-count", query ? visible.length + "/" + col.cards.length : String(col.cards.length)));
    var del = btn("stk__icon", "", "Удалить колонку", "x");
    del.addEventListener("click", function () {
      if (col.cards.length && !confirm("Удалить колонку «" + col.title + "» вместе с карточками (" + col.cards.length + ")?")) return;
      board.columns = board.columns.filter(function (x) { return x !== col; });
      if (listSorts[col.id]) { listSorts[col.id].destroy(); delete listSorts[col.id]; }
      c.remove();
      save(); patch();
    });
    head.appendChild(del);
    c.appendChild(head);
    var list = el("div", "stk__list");
    list.dataset.col = col.id;
    col.cards.forEach(function (card) {
      var n = renderCard(card);
      if (!matches(card)) n.classList.add("stk__card--hidden");
      list.appendChild(n);
    });
    if (!col.cards.length) list.appendChild(el("div", "stk__empty", "Перетащите сюда карточку или добавьте новую"));
    c.appendChild(list);
    c.appendChild(composer(col));
    return c;
  }

  function composer(col) {
    var wrap = el("div", "stk__composer");
    var open = btn("stk__add", "Добавить карточку", null, "plus");
    var form = el("form", "stk__form");
    form.hidden = true;
    var ta = el("textarea", "stk__input");
    ta.rows = 2; ta.placeholder = "Что нужно сделать?";
    ta.setAttribute("aria-label", "Название карточки");
    var row = el("div", "stk__form-row");
    var ok = el("button", "stk__btn stk__btn--primary", "Добавить"); ok.type = "submit";
    var cancel = btn("stk__icon", "", "Отмена", "x");
    row.appendChild(ok); row.appendChild(cancel);
    form.appendChild(ta); form.appendChild(row);
    open.addEventListener("click", function () { open.hidden = true; form.hidden = false; ta.focus(); });
    cancel.addEventListener("click", function () { form.hidden = true; open.hidden = false; ta.value = ""; });
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
      if (e.key === "Escape") cancel.click();
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = ta.value.trim();
      if (!v) return;
      var card = { id: uid(), title: v, desc: "", labels: [], due: "", checklist: [] };
      col.cards.push(card);
      var list = wrap.parentNode && wrap.parentNode.querySelector(".stk__list");
      if (list) { list.appendChild(renderCard(card)); list.scrollTop = list.scrollHeight; }
      save(); patch();
      ta.value = ""; ta.focus();
    });
    wrap.appendChild(open); wrap.appendChild(form);
    return wrap;
  }

  function topbar() {
    var bar = el("header", "stk__top");
    var brand = el("div", "stk__brand");
    var mark = el("span", "stk__mark"); mark.setAttribute("aria-hidden", "true");
    mark.innerHTML = "<i></i><i></i><i></i>";
    brand.appendChild(mark);
    brand.appendChild(el("span", "stk__brand-name", "Стопка"));
    bar.appendChild(brand);
    var sw = el("label", "stk__search");
    sw.appendChild(icon("search"));
    var search = el("input");
    search.type = "search"; search.placeholder = "Поиск по карточкам и меткам"; search.value = query;
    search.setAttribute("aria-label", "Поиск");
    search.addEventListener("input", function () { query = search.value.trim(); patch(); });
    sw.appendChild(search);
    bar.appendChild(sw);
    var help = btn("stk__icon stk__icon--top", "", "О демо", "help");
    help.addEventListener("click", showIntro);
    bar.appendChild(help);
    return bar;
  }

  function statText() {
    var total = 0;
    board.columns.forEach(function (c) { total += c.cards.length; });
    var last = board.columns[board.columns.length - 1];
    return total + " " + plural(total, "карточка", "карточки", "карточек") + (last ? " · в «" + last.title + "» " + last.cards.length : "");
  }

  function updateStat() {
    var s = root.querySelector(".stk__stat");
    if (s) s.textContent = statText();
  }

  function addColumn() {
    var col = { id: uid(), title: "Новая колонка", cards: [] };
    board.columns.push(col);
    var wrap = root.querySelector(".stk__board");
    var node = renderColumn(col, 0);
    node.classList.add("stk__col--new");
    wrap.insertBefore(node, wrap.querySelector(".stk__col-add"));
    makeListSortable(node.querySelector(".stk__list"));
    save(); patch();
    var lastT = node.querySelector(".stk__col-title");
    if (lastT) {
      lastT.scrollIntoView({ behavior: "smooth", inline: "end", block: "nearest" });
      lastT.focus({ preventScroll: true }); document.getSelection().selectAllChildren(lastT);
    }
  }

  function subbar() {
    var bar = el("div", "stk__sub");
    var title = el("input", "stk__board-title");
    title.value = board.title;
    title.setAttribute("aria-label", "Название доски");
    title.size = Math.max(6, board.title.length);
    title.addEventListener("input", function () { title.size = Math.max(6, title.value.length); });
    title.addEventListener("change", function () { board.title = title.value.trim() || "Доска"; title.value = board.title; save(); });
    title.addEventListener("keydown", function (e) { if (e.key === "Enter") title.blur(); });
    bar.appendChild(title);
    bar.appendChild(el("span", "stk__stat", statText()));
    var group = el("div", "stk__sub-actions");
    var addCol = btn("stk__chip-btn", "Колонка", "Добавить колонку", "plus");
    addCol.addEventListener("click", addColumn);
    var exp = btn("stk__chip-btn", "Экспорт", "Скачать доску в JSON", "down");
    exp.addEventListener("click", function () {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(board, null, 2)], { type: "application/json" }));
      a.download = "kanban.json"; a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    var file = el("input"); file.type = "file"; file.accept = "application/json,.json"; file.hidden = true;
    file.addEventListener("change", function () {
      var f = file.files[0]; if (!f) return;
      f.text().then(function (t) {
        var b = normBoard(JSON.parse(t));
        if (!b) throw new Error();
        board = b; save(); render();
      }).catch(function () { alert("Это не файл доски."); });
      file.value = "";
    });
    var imp = btn("stk__chip-btn", "Импорт", "Загрузить доску из JSON", "up");
    imp.addEventListener("click", function () { file.click(); });
    var reset = btn("stk__chip-btn", "Сбросить", "Вернуть демо-доску", "reset");
    reset.addEventListener("click", function () {
      if (!confirm("Вернуть демо-доску? Текущие карточки пропадут.")) return;
      board = demoBoard(); query = ""; save(); render();
    });
    [addCol, exp, imp, reset, file].forEach(function (x) { group.appendChild(x); });
    bar.appendChild(group);
    return bar;
  }

  function makeListSortable(list) {
    listSorts[list.dataset.col] = new window.Sortable(list, {
      group: "stk-cards", animation: 180, easing: "cubic-bezier(.2,.8,.2,1)", delay: 140, delayOnTouchOnly: true,
      ghostClass: "stk__card--ghost", chosenClass: "stk__card--chosen", dragClass: "stk__card--drag",
      draggable: ".stk__card", filter: ".stk__card--hidden", disabled: !!query,
      onEnd: syncFromDom
    });
  }

  function patch() {
    root.querySelectorAll(".stk__col").forEach(function (cn) {
      var col = findCol(cn.dataset.id);
      if (!col) return;
      var list = cn.querySelector(".stk__list");
      var vis = 0;
      list.querySelectorAll(".stk__card").forEach(function (n) {
        var f = findCard(n.dataset.id);
        var m = !!f && matches(f.card);
        if (m) vis++;
        n.classList.toggle("stk__card--hidden", !m);
      });
      var cnt = cn.querySelector(".stk__col-count");
      var t = query ? vis + "/" + col.cards.length : String(col.cards.length);
      if (cnt.textContent !== t) cnt.textContent = t;
      var empty = list.querySelector(".stk__empty");
      if (!col.cards.length && !empty) list.appendChild(el("div", "stk__empty", "Перетащите сюда карточку или добавьте новую"));
      else if (col.cards.length && empty) empty.remove();
    });
    Object.keys(listSorts).forEach(function (k) { listSorts[k].option("disabled", !!query); });
    updateStat();
  }

  function renderBoard() {
    Object.keys(listSorts).forEach(function (k) { listSorts[k].destroy(); });
    listSorts = {};
    if (colSort) { colSort.destroy(); colSort = null; }
    var wrap = root.querySelector(".stk__board");
    var scroll = wrap.scrollLeft;
    wrap.textContent = "";
    board.columns.forEach(function (col, i) { wrap.appendChild(renderColumn(col, i)); });
    var adder = btn("stk__col-add", "Добавить колонку", null, "plus");
    adder.addEventListener("click", addColumn);
    wrap.appendChild(adder);
    wrap.scrollLeft = scroll;
    wrap.classList.add("stk__board--enter");
    setTimeout(function () { wrap.classList.remove("stk__board--enter"); }, 700);
    wrap.querySelectorAll(".stk__list").forEach(makeListSortable);
    colSort = new window.Sortable(wrap, {
      animation: 180, handle: ".stk__col-head", draggable: ".stk__col", filter: ".stk__col-title,.stk__icon", preventOnFilter: false,
      ghostClass: "stk__col--ghost", direction: "horizontal", delay: 140, delayOnTouchOnly: true,
      onEnd: syncFromDom
    });
    updateStat();
  }

  function syncFromDom() {
    var all = {};
    board.columns.forEach(function (c) { c.cards.forEach(function (k) { all[k.id] = k; }); });
    var cols = {};
    board.columns.forEach(function (c) { cols[c.id] = c; });
    board.columns = [].map.call(root.querySelectorAll(".stk__col"), function (cn) {
      var c = cols[cn.dataset.id];
      c.cards = [].map.call(cn.querySelectorAll(".stk__card"), function (n) { return all[n.dataset.id]; }).filter(Boolean);
      return c;
    }).filter(Boolean);
    save(); patch();
  }

  function render() {
    root.textContent = "";
    root.appendChild(topbar());
    root.appendChild(subbar());
    root.appendChild(el("div", "stk__board"));
    renderBoard();
  }

  function openCard(id) {
    var f = findCard(id);
    if (!f) return;
    var card = f.card;
    var dlg = el("dialog", "stk__modal");
    dlg.setAttribute("aria-label", "Карточка");
    var box = el("div", "stk__modal-box");
    var close = btn("stk__icon stk__modal-close", "", "Закрыть", "x");
    close.addEventListener("click", function () { dlg.close(); });
    box.appendChild(close);

    var title = el("textarea", "stk__modal-title");
    title.rows = 1; title.value = card.title;
    title.setAttribute("aria-label", "Название карточки");
    var fit = function () { title.style.height = "auto"; title.style.height = title.scrollHeight + "px"; };
    title.addEventListener("input", function () { card.title = title.value.replace(/\n/g, " ").trim() || "Без названия"; save(); fit(); });
    title.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); title.blur(); } });
    box.appendChild(title);
    var sub = el("p", "stk__modal-sub", "в колонке «" + f.col.title + "»");
    box.appendChild(sub);

    function section(ico, name) {
      var h = el("h3", "stk__modal-h");
      h.appendChild(icon(ico)); h.appendChild(el("span", null, name));
      box.appendChild(h);
    }

    section("tag", "Метки");
    var labs = el("div", "stk__modal-labels");
    LABELS.forEach(function (l) {
      var b = btn("stk__pick stk__label--" + l.id, l.name);
      b.setAttribute("aria-pressed", card.labels.indexOf(l.id) !== -1);
      b.addEventListener("click", function () {
        var i = card.labels.indexOf(l.id);
        if (i === -1) card.labels.push(l.id); else card.labels.splice(i, 1);
        b.setAttribute("aria-pressed", i === -1);
        save();
      });
      labs.appendChild(b);
    });
    box.appendChild(labs);

    section("clock", "Срок");
    var dueRow = el("div", "stk__form-row");
    var due = el("input", "stk__input stk__input--date");
    due.type = "date"; due.value = card.due;
    due.setAttribute("aria-label", "Срок");
    due.addEventListener("change", function () { card.due = due.value; save(); });
    var clr = btn("stk__btn", "Убрать");
    clr.addEventListener("click", function () { due.value = ""; card.due = ""; save(); });
    dueRow.appendChild(due); dueRow.appendChild(clr);
    box.appendChild(dueRow);

    section("text", "Описание");
    var view = el("div", "stk__md");
    view.tabIndex = 0;
    var edit = el("textarea", "stk__input stk__input--desc");
    edit.rows = 6; edit.placeholder = "Markdown: **жирный**, *курсив*, списки, ссылки";
    edit.setAttribute("aria-label", "Описание");
    edit.hidden = true;
    function showView() {
      view.innerHTML = card.desc ? md(card.desc) : '<p class="stk__md-empty">Добавьте подробности: нажмите, чтобы написать</p>';
      view.hidden = false; edit.hidden = true;
    }
    function startEdit() { edit.value = card.desc; view.hidden = true; edit.hidden = false; edit.focus(); }
    view.addEventListener("click", function (e) { if (!e.target.closest("a")) startEdit(); });
    view.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); startEdit(); } });
    edit.addEventListener("blur", function () { card.desc = edit.value; save(); showView(); });
    edit.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); edit.blur(); }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) edit.blur();
    });
    showView();
    box.appendChild(view); box.appendChild(edit);

    section("check", "Чек-лист");
    var progress = el("div", "stk__progress");
    var pct = el("span", "stk__progress-pct");
    var track = el("div", "stk__progress-track");
    var bar = el("span", "stk__progress-bar");
    track.appendChild(bar); progress.appendChild(pct); progress.appendChild(track);
    var items = el("ul", "stk__checklist");
    function drawList() {
      items.textContent = "";
      var done = card.checklist.filter(function (x) { return x.done; }).length;
      var p = card.checklist.length ? Math.round(done * 100 / card.checklist.length) : 0;
      bar.style.width = p + "%";
      pct.textContent = p + "%";
      progress.hidden = !card.checklist.length;
      card.checklist.forEach(function (it) {
        var li = el("li", "stk__check" + (it.done ? " stk__check--done" : ""));
        var lbl = el("label", "stk__check-label");
        var cb = el("input"); cb.type = "checkbox"; cb.checked = it.done;
        cb.addEventListener("change", function () { it.done = cb.checked; save(); drawList(); });
        lbl.appendChild(cb); lbl.appendChild(el("span", "stk__check-text", it.text));
        var rm = btn("stk__icon", "", "Удалить пункт", "x");
        rm.addEventListener("click", function () { card.checklist = card.checklist.filter(function (x) { return x !== it; }); save(); drawList(); });
        li.appendChild(lbl); li.appendChild(rm);
        items.appendChild(li);
      });
    }
    drawList();
    var addForm = el("form", "stk__form-row");
    var addIn = el("input", "stk__input"); addIn.placeholder = "Новый пункт";
    addIn.setAttribute("aria-label", "Новый пункт чек-листа");
    var addBtn = el("button", "stk__btn", "Добавить"); addBtn.type = "submit";
    addForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = addIn.value.trim(); if (!v) return;
      card.checklist.push({ id: uid(), text: v, done: false });
      addIn.value = ""; save(); drawList();
    });
    addForm.appendChild(addIn); addForm.appendChild(addBtn);
    box.appendChild(progress); box.appendChild(items); box.appendChild(addForm);

    var foot = el("div", "stk__modal-foot");
    var mv = el("label", "stk__move");
    mv.appendChild(icon("move"));
    var move = el("select", "stk__select");
    move.setAttribute("aria-label", "Переместить в колонку");
    board.columns.forEach(function (c) {
      var o = el("option", null, c.title); o.value = c.id; o.selected = c === f.col; move.appendChild(o);
    });
    move.addEventListener("change", function () {
      var cur = findCard(card.id), to = findCol(move.value);
      if (!cur || !to || to === cur.col) return;
      cur.col.cards.splice(cur.index, 1); to.cards.push(card); save();
      sub.textContent = "в колонке «" + to.title + "»";
    });
    mv.appendChild(move);
    var del = btn("stk__btn stk__btn--danger", "Удалить", "Удалить карточку", "trash");
    del.addEventListener("click", function () {
      if (!confirm("Удалить карточку «" + card.title + "»?")) return;
      var cur = findCard(card.id);
      if (cur) cur.col.cards.splice(cur.index, 1);
      save(); dlg.close();
    });
    foot.appendChild(mv); foot.appendChild(del);
    box.appendChild(foot);

    dlg.appendChild(box);
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("close", function () {
      if (!edit.hidden) { card.desc = edit.value; save(); }
      dlg.remove();
      var old = root.querySelector('.stk__card[data-id="' + card.id + '"]');
      var cur = findCard(card.id);
      var n = null;
      if (cur) {
        n = renderCard(cur.card);
        var target = root.querySelector('.stk__list[data-col="' + cur.col.id + '"]');
        if (old && old.parentNode === target) old.replaceWith(n);
        else { if (old) old.remove(); if (target) target.appendChild(n); }
      } else if (old) old.remove();
      patch();
      if (n) n.focus({ preventScroll: true });
    });
    root.appendChild(dlg);
    dlg.showModal();
    fit();
    close.focus();
  }

  var intro, introOpen = false, lastFocus = null;

  function showIntro() {
    if (!intro) return;
    lastFocus = document.activeElement;
    intro.hidden = false;
    intro.classList.remove("stk-intro--out");
    introOpen = true;
    var o = document.getElementById("stk-intro-open");
    if (o) o.focus({ preventScroll: true });
  }

  function hideIntro() {
    if (!intro || !introOpen) return;
    introOpen = false;
    intro.classList.add("stk-intro--out");
    setTimeout(function () { if (!introOpen) intro.hidden = true; }, 220);
    if (lastFocus && lastFocus !== document.body && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    else if (document.activeElement) document.activeElement.blur();
  }

  function setupIntro() {
    intro = document.getElementById("stk-intro");
    if (!intro) return;
    introOpen = true;
    var o = document.getElementById("stk-intro-open");
    o.addEventListener("click", hideIntro);
    intro.addEventListener("click", function (e) { if (e.target === intro) hideIntro(); });
    document.addEventListener("keydown", function (e) {
      if (!introOpen) return;
      if (e.key === "Escape") { e.preventDefault(); hideIntro(); return; }
      if (e.key === "Enter") {
        if (document.activeElement && document.activeElement.classList.contains("stk-intro__back")) return;
        e.preventDefault(); hideIntro(); return;
      }
      if (e.key === "Tab") {
        var f = intro.querySelectorAll("button, a[href]");
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!intro.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
    }, true);
    o.focus({ preventScroll: true });
  }

  function start() {
    root = document.getElementById("kb-app");
    if (!root) return;
    document.documentElement.classList.add("stk-lock");
    loadFont();
    setupIntro();
    LIBS.reduce(function (p, src) { return p.then(function () { return loadScript(src); }); }, Promise.resolve())
      .then(function () {
        board = load();
        root.dataset.state = "ready";
        render();
      })
      .catch(function () {
        root.dataset.state = "error";
        root.textContent = "";
        root.appendChild(el("div", "stk__loading", "Не удалось загрузить библиотеки доски. Проверьте сеть и обновите страницу."));
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
