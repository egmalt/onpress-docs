(function () {
  'use strict';

  var LIMITS = { messages: 20, messageChars: 4000, historyChars: 16000 };
  var STORE_CHATS = 'soroka.chats.v1';
  var STORE_CURRENT = 'soroka.current.v1';
  var STORE_ENDPOINT = 'soroka.endpoint.v1';
  var LIBS = [
    'https://cdn.jsdelivr.net/npm/marked@18.1.2/lib/marked.umd.js',
    'https://cdn.jsdelivr.net/npm/dompurify@3.4.17/dist/purify.min.js'
  ];
  var FONTS = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Literata:ital,opsz,wght@1,7..72,600&family=JetBrains+Mono:wght@400;500&display=swap';
  var REPO_WORKER = 'https://github.com/egmalt/onpress-docs/tree/main/demos/chat/worker';

  var ICON_MARK = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 17c0-6.6 5.4-12 12-12h3a9 9 0 0 1 9 9v1a9 9 0 0 1-9 9h-4l-6 5v-5.6A12 12 0 0 1 4 17z" fill="currentColor"/><circle cx="20" cy="13" r="2.2" fill="var(--sk-ink)"/><path d="M27 12.5l4 1.5-4 1.5" fill="currentColor"/></svg>';
  var ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
  var ICON_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var ICON_REDO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>';
  var ICON_DEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';

  var IDEAS = [
    { title: 'Как спрятать ключ OpenAI?', sub: 'Чат на сайте без утечки ключа', text: 'Как спрятать ключ OpenAI, если чат стоит на моем сайте?' },
    { title: 'Напиши письмо клиенту', sub: 'Перенос встречи на четверг', text: 'Напиши короткое вежливое письмо клиенту: встречу во вторник нужно перенести на четверг.' },
    { title: 'Объясни потоковый ответ', sub: 'Как текст появляется по словам', text: 'Объясни, как работает потоковый ответ нейросети, на примере кода.' },
    { title: 'Составь план статьи', sub: 'Про здоровый сон', text: 'Составь план статьи про здоровый сон для блога.' }
  ];

  var DEMO = [
    {
      test: /ключ|секрет|api|апи|токен|key/i,
      text: '## Ключ живет на сервере, а не на странице\n\nВсе, что лежит в коде страницы, видит любой посетитель: достаточно открыть инструменты разработчика. Поэтому ключ OpenAI держат в маленькой серверной функции, а чат обращается к ней.\n\n1. **Браузер** отправляет переписку вашей функции.\n2. **Функция** на Cloudflare Workers берет ключ из секретов, спрашивает OpenAI и сразу передает ответ дальше.\n3. **OpenAI** отвечает функции по кусочкам, а чат печатает их по мере прихода.\n\nКлюч кладут в секреты одной командой:\n\n```bash\nnpx wrangler secret put OPENAI_API_KEY\n```\n\nВ функции ключ доступен как `env.OPENAI_API_KEY` и в браузер не уходит:\n\n```js\nconst upstream = await fetch(\'https://api.openai.com/v1/chat/completions\', {\n  method: \'POST\',\n  headers: { Authorization: \'Bearer \' + env.OPENAI_API_KEY, \'Content-Type\': \'application/json\' },\n  body: JSON.stringify({ model: env.OPENAI_MODEL, messages, stream: true })\n});\nreturn new Response(upstream.body, { headers: { \'Content-Type\': \'text/event-stream\' } });\n```\n\nЧтобы чужие сайты не тратили ваши деньги, функция отвечает только адресам из `ALLOWED_ORIGINS` и ограничивает длину сообщений. Полный код лежит на [GitHub](' + REPO_WORKER + ').'
    },
    {
      test: /письм|клиент|встреч/i,
      text: '**Тема:** Перенос встречи на четверг\n\nЗдравствуйте, Анна!\n\nК сожалению, во вторник я не смогу встретиться в назначенное время. Предлагаю перенести встречу на четверг, на то же время — в 15:00. Если четверг вам неудобен, напишите, какой день подойдет, и я подстроюсь.\n\nПрошу прощения за изменения и спасибо за понимание.\n\nС уважением,\nИгорь\n\n> Совет: в письме о переносе сразу предлагайте новое время. Так собеседнику проще ответить одним словом.'
    },
    {
      test: /поток|stream|sse|по словам|печата/i,
      text: '## Потоковый ответ\n\nМодель пишет ответ не целиком, а по нескольку символов. С параметром `stream: true` OpenAI отправляет каждый кусочек сразу, строкой формата Server-Sent Events:\n\n```text\ndata: {"choices":[{"delta":{"content":"При"}}]}\ndata: {"choices":[{"delta":{"content":"вет"}}]}\ndata: [DONE]\n```\n\nБраузер читает такой ответ постепенно и дописывает текст на экран:\n\n```js\nconst res = await fetch(endpoint, { method: \'POST\', body: JSON.stringify({ messages }) });\nconst reader = res.body.getReader();\nconst decoder = new TextDecoder();\nlet buffer = \'\';\nwhile (true) {\n  const { value, done } = await reader.read();\n  if (done) break;\n  buffer += decoder.decode(value, { stream: true });\n  const lines = buffer.split(\'\\n\');\n  buffer = lines.pop();\n  for (const line of lines) {\n    if (!line.startsWith(\'data: \') || line === \'data: [DONE]\') continue;\n    const delta = JSON.parse(line.slice(6)).choices[0].delta.content;\n    if (delta) output.textContent += delta;\n  }\n}\n```\n\n| Без потока | С потоком |\n| --- | --- |\n| ждете весь ответ | первые слова через долю секунды |\n| один большой ответ | много маленьких строк `data:` |\n\nЭтот чат работает именно так, только вместо `textContent` превращает Markdown в оформленный текст.'
    },
    {
      test: /план|стать|блог|сон/i,
      text: '## План статьи «Как высыпаться: 7 привычек здорового сна»\n\n1. **Вступление.** Сколько сна нужно взрослому и почему недосып копится.\n2. **Режим.** Ложиться и вставать в одно время, даже в выходные.\n3. **Свет.** Утреннее солнце, приглушенный свет вечером, экраны за час до сна.\n4. **Спальня.** Прохлада 18–20 °C, темнота, тишина, удобный матрас.\n5. **Еда и кофе.** Кофеин до обеда, легкий ужин за 2–3 часа до сна.\n6. **Движение.** Прогулка днем, тяжелые тренировки не позже вечера.\n7. **Если не спится.** Встать, почитать при мягком свете, вернуться в кровать.\n8. **Итог.** Чек-лист привычек на неделю.\n\nДля SEO подойдут подзаголовки с вопросами: «Сколько нужно спать?», «Почему я просыпаюсь ночью?».'
    },
    {
      test: /^\s*(привет|здравств|добрый|hi|hello|хай)/i,
      text: 'Привет! Это чат с нейросетью. Сейчас он в **демо-режиме** и отвечает заготовками, зато показывает, как выглядит настоящий чат: ответ печатается по мере генерации, а код и таблицы оформлены.\n\nСпросите, например, как спрятать ключ OpenAI, или попросите составить план статьи.'
    }
  ];
  var DEMO_DEFAULT = 'Сейчас чат работает в **демо-режиме**: ответы заготовлены заранее, а нейросеть не подключена.\n\nЧтобы чат отвечал по-настоящему, подключите свою функцию:\n\n1. Скачайте `worker.js` и `wrangler.toml` с [GitHub](' + REPO_WORKER + ').\n2. Сохраните ключ OpenAI в секретах Cloudflare: `npx wrangler secret put OPENAI_API_KEY`.\n3. Опубликуйте функцию командой `npx wrangler deploy`.\n4. Вставьте ее адрес в **Настройки → Адрес вашей функции**.\n\nКлюч останется на Cloudflare, а чат получит только текст ответа.';

  var ERRORS = {
    origin_not_allowed: 'Функция не принимает запросы с этого сайта. Добавьте адрес сайта в ALLOWED_ORIGINS в wrangler.toml и опубликуйте функцию снова.',
    not_configured: 'В функции нет ключа. Выполните npx wrangler secret put OPENAI_API_KEY.',
    rate_limited: 'Слишком много сообщений подряд. Подождите минуту и повторите.',
    message_too_long: 'Сообщение длиннее, чем разрешает функция.',
    history_too_long: 'Переписка длиннее, чем разрешает функция. Начните новый чат.',
    too_many_messages: 'В переписке больше сообщений, чем разрешает функция. Начните новый чат.',
    upstream_unreachable: 'Функция не достучалась до OpenAI. Повторите чуть позже.'
  };

  function trimHistory(messages, limits) {
    var out = [];
    var total = 0;
    for (var i = messages.length - 1; i >= 0; i--) {
      var m = messages[i];
      if (!m || (m.role !== 'user' && m.role !== 'assistant') || !m.content || !String(m.content).trim() || m.error) continue;
      var c = String(m.content).slice(0, limits.messageChars);
      if (out.length >= limits.messages || total + c.length > limits.historyChars) break;
      out.unshift({ role: m.role, content: c });
      total += c.length;
    }
    while (out.length && out[0].role !== 'user') out.shift();
    return out;
  }

  function createSSEParser(onData) {
    var buffer = '';
    var lines = [];
    function flushEvent() {
      if (!lines.length) return;
      var data = lines.join('\n');
      lines = [];
      onData(data);
    }
    function line(l) {
      if (l === '') { flushEvent(); return; }
      if (l.charAt(0) === ':') return;
      if (l.indexOf('data:') === 0) {
        var v = l.slice(5);
        if (v.charAt(0) === ' ') v = v.slice(1);
        lines.push(v);
      }
    }
    return {
      feed: function (text) {
        buffer += text;
        var parts = buffer.split(/\r\n|\r|\n/);
        buffer = parts.pop();
        for (var i = 0; i < parts.length; i++) line(parts[i]);
      },
      end: function () {
        if (buffer) { line(buffer); buffer = ''; }
        flushEvent();
      }
    };
  }

  function handleChunk(data) {
    if (data === '[DONE]') return { done: true };
    var obj;
    try { obj = JSON.parse(data); } catch (e) { return {}; }
    if (obj && obj.error) {
      return { error: (obj.error && obj.error.message) || 'Ошибка модели' };
    }
    var ch = obj && obj.choices && obj.choices[0];
    var res = {};
    if (ch && ch.delta && typeof ch.delta.content === 'string') res.delta = ch.delta.content;
    if (ch && ch.finish_reason) res.finish = ch.finish_reason;
    return res;
  }

  function normalizeEndpoint(v) {
    v = String(v || '').trim();
    if (!v || v.indexOf('{{') >= 0) return '';
    if (!/^https:\/\/[^\s/]+/i.test(v) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(v)) return '';
    return v;
  }

  function pickDemo(text) {
    for (var i = 0; i < DEMO.length; i++) if (DEMO[i].test.test(text)) return DEMO[i].text;
    return DEMO_DEFAULT;
  }

  function demoTokens(text) {
    return text.match(/\s*\S{1,6}|\s+/g) || [text];
  }

  function titleFrom(text) {
    var t = String(text).replace(/\s+/g, ' ').trim();
    return t.length > 42 ? t.slice(0, 40).replace(/\s+\S*$/, '') + '…' : t;
  }

  var api = { trimHistory: trimHistory, createSSEParser: createSSEParser, handleChunk: handleChunk, normalizeEndpoint: normalizeEndpoint, pickDemo: pickDemo, demoTokens: demoTokens, titleFrom: titleFrom, LIMITS: LIMITS };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  if (typeof document === 'undefined') return;

  var root = document.getElementById('sk');
  if (!root) return;
  window.skCore = api;

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    side: $('skSide'), list: $('skList'), scrim: $('skScrim'), status: $('skStatus'), title: $('skTitle'), badge: $('skBadge'),
    scroll: $('skScroll'), thread: $('skThread'), down: $('skDown'), form: $('skForm'), input: $('skInput'), send: $('skSend'), count: $('skCount'),
    settings: $('skSettings'), settingsForm: $('skSettingsForm'), endpoint: $('skEndpoint'), check: $('skCheck'), checkResult: $('skCheckResult'),
    connect: $('skConnect'), endpoint2: $('skEndpoint2'), intro: $('skIntro'), toast: $('skToast'), toastText: $('skToastText'), toastBtn: $('skToastBtn')
  };

  document.documentElement.classList.add('sk-on');
  if (!document.querySelector('link[data-sk-fonts]')) {
    var pre = document.createElement('link');
    pre.rel = 'preconnect'; pre.href = 'https://fonts.gstatic.com'; pre.crossOrigin = '';
    var fl = document.createElement('link');
    fl.rel = 'stylesheet'; fl.href = FONTS; fl.setAttribute('data-sk-fonts', '');
    document.head.appendChild(pre); document.head.appendChild(fl);
  }

  var libsReady = null;
  function loadLibs() {
    if (libsReady) return libsReady;
    libsReady = Promise.all(LIBS.map(function (src) {
      return new Promise(function (resolve) {
        var s = document.createElement('script');
        s.src = src; s.async = true; s.crossOrigin = 'anonymous';
        s.onload = resolve; s.onerror = resolve;
        document.head.appendChild(s);
      });
    })).then(function () {
      if (window.DOMPurify && window.DOMPurify.addHook) {
        window.DOMPurify.addHook('afterSanitizeAttributes', function (node) {
          if (node.tagName === 'A' && node.getAttribute('href')) {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener noreferrer nofollow');
          }
        });
      }
      if (window.marked && window.marked.setOptions) window.marked.setOptions({ gfm: true, breaks: true });
    });
    return libsReady;
  }
  loadLibs().then(function () { renderThread(); });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  function renderMarkdown(text) {
    if (window.marked && window.DOMPurify) {
      try { return window.DOMPurify.sanitize(window.marked.parse(String(text))); } catch (e) {}
    }
    return String(text).split(/\n{2,}/).map(function (p) { return '<p>' + escapeHtml(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }

  function decorateCode(container) {
    var pres = container.querySelectorAll('pre');
    for (var i = 0; i < pres.length; i++) {
      var pre = pres[i];
      if (pre.parentNode.classList && pre.parentNode.classList.contains('sk-code')) continue;
      var code = pre.querySelector('code');
      var lang = '';
      if (code && code.className) { var m = code.className.match(/language-([\w+-]+)/); if (m) lang = m[1]; }
      var wrap = document.createElement('div');
      wrap.className = 'sk-code';
      var bar = document.createElement('div');
      bar.className = 'sk-code__bar';
      bar.innerHTML = '<span>' + escapeHtml(lang || 'код') + '</span>';
      var btn = copyButton(function (p) { return function () { return p.textContent; }; }(pre), 'Копировать');
      bar.appendChild(btn);
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(bar);
      wrap.appendChild(pre);
    }
  }

  function copyButton(getText, label) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'sk-copy';
    b.innerHTML = ICON_COPY + (label ? '<span>' + label + '</span>' : '');
    b.setAttribute('aria-label', label || 'Копировать');
    b.addEventListener('click', function () {
      copyText(getText()).then(function () {
        b.innerHTML = ICON_OK + (label ? '<span>Скопировано</span>' : '');
        setTimeout(function () { b.innerHTML = ICON_COPY + (label ? '<span>' + label + '</span>' : ''); }, 1400);
      });
    });
    return b;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { toast('Браузер не дал сохранить переписку'); }
  }

  var state = {
    chats: load(STORE_CHATS, []),
    current: load(STORE_CURRENT, null),
    endpoint: normalizeEndpoint(load(STORE_ENDPOINT, '')),
    busy: null
  };
  if (!Array.isArray(state.chats)) state.chats = [];
  state.chats.forEach(function (c) { c.messages = (c.messages || []).filter(function (m) { return m && m.content; }); });
  if (!findChat(state.current)) state.current = null;

  var paramEndpoint = normalizeEndpoint(root.getAttribute('data-endpoint')) || normalizeEndpoint(root.getAttribute('data-page-endpoint'));

  function endpoint() { return state.endpoint || paramEndpoint; }
  function isLive() { return !!endpoint(); }

  function findChat(id) {
    for (var i = 0; i < state.chats.length; i++) if (state.chats[i].id === id) return state.chats[i];
    return null;
  }
  function currentChat() { return findChat(state.current); }
  function persist() {
    var keep = state.chats.filter(function (c) { return c.messages.length; }).slice(0, 60);
    save(STORE_CHATS, keep);
    save(STORE_CURRENT, state.current);
  }

  function newChat() {
    stopStream();
    var c = currentChat();
    if (c && !c.messages.length) { focusInput(); return; }
    state.current = null;
    persist();
    renderAll();
    closeSide();
    focusInput();
  }

  function ensureChat(firstText) {
    var c = currentChat();
    if (c) return c;
    c = { id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: titleFrom(firstText), messages: [], updated: Date.now() };
    state.chats.unshift(c);
    state.current = c.id;
    return c;
  }

  function hostOf(url) { try { return new URL(url).host; } catch (e) { return url; } }

  function renderStatus() {
    var live = isLive();
    els.status.classList.toggle('is-live', live);
    els.status.innerHTML = '<span class="sk-status__dot"></span><span class="sk-status__text">' + (live ? 'Подключено<small>' + escapeHtml(hostOf(endpoint())) + '</small>' : 'Демо-режим<small>Подключить свою функцию</small>') + '</span>';
    els.badge.classList.toggle('is-live', live);
    els.badge.textContent = live ? 'Ваша функция' : 'Демо-режим';
    els.badge.title = live ? endpoint() : 'Ответы заготовлены. Нажмите, чтобы подключить свою функцию';
  }

  function groupLabel(ts) {
    var d = new Date(ts); var now = new Date();
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (ts >= start) return 'Сегодня';
    if (ts >= start - 864e5) return 'Вчера';
    if (ts >= start - 7 * 864e5) return 'Неделя';
    return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  }

  function renderList() {
    var chats = state.chats.filter(function (c) { return c.messages.length; }).sort(function (a, b) { return b.updated - a.updated; });
    els.list.innerHTML = '';
    if (!chats.length) {
      els.list.innerHTML = '<div class="sk-list__empty">Здесь появятся ваши переписки. Они хранятся только в этом браузере.</div>';
      return;
    }
    var last = '';
    chats.forEach(function (c) {
      var g = groupLabel(c.updated);
      if (g !== last) {
        var h = document.createElement('div'); h.className = 'sk-list__group'; h.textContent = g; els.list.appendChild(h); last = g;
      }
      var row = document.createElement('div');
      row.className = 'sk-list__item' + (c.id === state.current ? ' is-active' : '');
      row.setAttribute('role', 'listitem');
      var open = document.createElement('button');
      open.type = 'button'; open.className = 'sk-list__open'; open.textContent = c.title || 'Без названия'; open.title = c.title || '';
      open.addEventListener('click', function () { openChat(c.id); });
      var del = document.createElement('button');
      del.type = 'button'; del.className = 'sk-list__del'; del.innerHTML = ICON_DEL; del.setAttribute('aria-label', 'Удалить чат');
      del.addEventListener('click', function (e) { e.stopPropagation(); deleteChat(c.id); });
      row.appendChild(open); row.appendChild(del);
      els.list.appendChild(row);
    });
  }

  function openChat(id) {
    if (state.current === id) { closeSide(); return; }
    stopStream();
    state.current = id;
    persist();
    renderAll();
    closeSide();
    scrollBottom(true);
  }

  function deleteChat(id) {
    var idx = -1;
    for (var i = 0; i < state.chats.length; i++) if (state.chats[i].id === id) idx = i;
    if (idx < 0) return;
    if (state.current === id) stopStream();
    var removed = state.chats.splice(idx, 1)[0];
    var wasCurrent = state.current === id;
    if (wasCurrent) state.current = null;
    persist();
    renderAll();
    toast('Чат удален', 'Вернуть', function () {
      state.chats.splice(idx, 0, removed);
      if (wasCurrent) state.current = removed.id;
      persist();
      renderAll();
    });
  }

  function renderHello() {
    var wrap = document.createElement('div');
    wrap.className = 'sk-hello';
    wrap.innerHTML = '<div class="sk-hello__mark">' + ICON_MARK.replace('var(--sk-ink)', 'var(--sk-bg)') + '</div><div class="sk-hello__title">О чем поболтаем?</div><div class="sk-hello__sub">' +
      (isLive() ? 'Чат подключен к вашей функции и отвечает моделью OpenAI.' : 'Чат в демо-режиме: ответы заготовлены, но печатаются так же, как настоящие.') + '</div>';
    var ideas = document.createElement('div');
    ideas.className = 'sk-ideas';
    IDEAS.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'sk-idea';
      b.innerHTML = '<b>' + escapeHtml(it.title) + '</b><span>' + escapeHtml(it.sub) + '</span>';
      b.addEventListener('click', function () { submit(it.text); });
      ideas.appendChild(b);
    });
    wrap.appendChild(ideas);
    return wrap;
  }

  function renderNotice() {
    var n = document.createElement('div');
    n.className = 'sk-notice';
    n.innerHTML = '<span><b>Демо-режим.</b> Чат отвечает заготовками. Подключите свою функцию, и ответы придут от модели OpenAI.</span>';
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'sk-notice__btn'; b.textContent = 'Подключить';
    b.addEventListener('click', openConnect);
    n.appendChild(b);
    return n;
  }

  function messageNode(m, i, chat) {
    var node = document.createElement('div');
    if (m.role === 'user') {
      node.className = 'sk-msg sk-msg--user';
      var bub = document.createElement('div');
      bub.className = 'sk-msg__bubble';
      bub.textContent = m.content;
      node.appendChild(bub);
      return node;
    }
    var isLast = i === chat.messages.length - 1;
    node.className = 'sk-msg sk-msg--bot' + (isLast ? ' is-last' : '');
    node.innerHTML = '<div class="sk-msg__avatar">' + ICON_MARK + '</div>';
    var body = document.createElement('div');
    body.className = 'sk-msg__body';
    var md = document.createElement('div');
    md.className = 'sk-md';
    if (m.content) { md.innerHTML = renderMarkdown(m.content); decorateCode(md); }
    body.appendChild(md);
    if (m.cut) {
      var cut = document.createElement('div'); cut.className = 'sk-msg__cut'; cut.textContent = 'Ответ обрезан по лимиту длины функции.'; body.appendChild(cut);
    }
    if (m.error) {
      var er = document.createElement('div'); er.className = 'sk-msg__err'; er.textContent = m.error;
      if (isLast) { var rb = document.createElement('button'); rb.type = 'button'; rb.textContent = 'Повторить'; rb.addEventListener('click', regenerate); er.appendChild(rb); }
      body.appendChild(er);
    }
    if (m.demo) { var tag = document.createElement('div'); tag.className = 'sk-msg__tag'; tag.textContent = 'Заготовленный ответ'; body.appendChild(tag); }
    if (m.content) {
      var tools = document.createElement('div');
      tools.className = 'sk-msg__tools';
      var cp = copyButton(function () { return m.content; }, '');
      cp.className = 'sk-tool'; cp.title = 'Копировать ответ';
      tools.appendChild(cp);
      if (isLast) {
        var rg = document.createElement('button');
        rg.type = 'button'; rg.className = 'sk-tool'; rg.innerHTML = ICON_REDO + '<span>Ответить заново</span>';
        rg.addEventListener('click', regenerate);
        tools.appendChild(rg);
      }
      body.appendChild(tools);
    }
    node.appendChild(body);
    return node;
  }

  function renderThread() {
    var chat = currentChat();
    els.thread.innerHTML = '';
    if (!chat || !chat.messages.length) {
      if (!isLive()) els.thread.appendChild(renderNotice());
      els.thread.appendChild(renderHello());
      els.title.textContent = 'Новый чат';
      return;
    }
    els.title.textContent = chat.title || 'Чат';
    if (!isLive()) els.thread.appendChild(renderNotice());
    chat.messages.forEach(function (m, i) {
      if (state.busy && state.busy.chat === chat && state.busy.msg === m) {
        var node = streamingNode();
        state.busy.node = node;
        paintStream(true);
        els.thread.appendChild(node);
      } else {
        els.thread.appendChild(messageNode(m, i, chat));
      }
    });
  }

  function renderAll() { renderStatus(); renderList(); renderThread(); updateSend(); }

  function streamingNode() {
    var node = document.createElement('div');
    node.className = 'sk-msg sk-msg--bot is-streaming';
    node.innerHTML = '<div class="sk-msg__avatar">' + ICON_MARK + '</div><div class="sk-msg__body"><div class="sk-md"></div></div>';
    return node;
  }

  var paintQueued = false;
  function paintStream(now) {
    if (!state.busy || !state.busy.node) return;
    if (!now) {
      if (paintQueued) return;
      paintQueued = true;
      requestAnimationFrame(function () { paintQueued = false; paintStream(true); });
      return;
    }
    var md = state.busy.node.querySelector('.sk-md');
    var text = state.busy.msg.content;
    if (!text) {
      md.innerHTML = '<span class="sk-wait" aria-label="Модель думает"><i></i><i></i><i></i></span>';
      state.busy.node.classList.remove('is-streaming');
    } else {
      state.busy.node.classList.add('is-streaming');
      md.innerHTML = renderMarkdown(text);
    }
    if (stick) scrollBottom();
  }

  var stick = true;
  function nearBottom() { return els.scroll.scrollHeight - els.scroll.scrollTop - els.scroll.clientHeight < 80; }
  function scrollBottom(force) {
    if (force) stick = true;
    els.scroll.scrollTop = els.scroll.scrollHeight;
    els.down.hidden = true;
  }
  els.scroll.addEventListener('scroll', function () {
    stick = nearBottom();
    els.down.hidden = stick;
  }, { passive: true });
  els.down.addEventListener('click', function () { scrollBottom(true); });

  function updateSend() {
    var busy = !!state.busy;
    var len = els.input.value.length;
    els.send.classList.toggle('is-stop', busy);
    els.send.disabled = !busy && !els.input.value.trim();
    els.send.setAttribute('aria-label', busy ? 'Остановить' : 'Отправить');
    els.count.textContent = len > LIMITS.messageChars * 0.75 ? len + ' / ' + LIMITS.messageChars : '';
    els.count.classList.toggle('is-near', len > LIMITS.messageChars * 0.9);
  }

  function autoGrow() {
    els.input.style.height = 'auto';
    els.input.style.height = Math.min(els.input.scrollHeight, 220) + 'px';
  }

  function submit(text) {
    text = String(text || '').trim();
    if (!text || state.busy) return;
    var chat = ensureChat(text);
    chat.messages.push({ role: 'user', content: text.slice(0, LIMITS.messageChars), ts: Date.now() });
    els.input.value = '';
    autoGrow();
    respond(chat);
  }

  function regenerate() {
    var chat = currentChat();
    if (!chat || state.busy) return;
    while (chat.messages.length && chat.messages[chat.messages.length - 1].role === 'assistant') chat.messages.pop();
    if (!chat.messages.length) return;
    respond(chat);
  }

  function respond(chat) {
    var msg = { role: 'assistant', content: '', ts: Date.now() };
    var history = trimHistory(chat.messages, LIMITS);
    chat.messages.push(msg);
    chat.updated = Date.now();
    var ctrl = new AbortController();
    state.busy = { chat: chat, msg: msg, ctrl: ctrl, node: null };
    persist();
    renderAll();
    scrollBottom(true);
    var live = isLive();
    var run = live ? streamFromEndpoint(endpoint(), history, ctrl.signal, onDelta) : streamDemo(history[history.length - 1].content, ctrl.signal, onDelta);
    function onDelta(d) { msg.content += d; paintStream(); }
    run.then(function (info) {
      if (info && info.cut) msg.cut = true;
      if (!live) msg.demo = true;
      if (!msg.content && !msg.error) msg.error = 'Модель вернула пустой ответ.';
    }, function (err) {
      if (err && err.name === 'AbortError') return;
      msg.error = (err && err.message) || 'Не удалось получить ответ.';
    }).then(function () {
      if (!msg.content && !msg.error) {
        var i = chat.messages.indexOf(msg);
        if (i >= 0) chat.messages.splice(i, 1);
      }
      chat.updated = Date.now();
      state.busy = null;
      persist();
      renderAll();
      if (stick) scrollBottom();
    });
  }

  function stopStream() {
    if (state.busy) state.busy.ctrl.abort();
  }

  function sleep(ms, signal) {
    return new Promise(function (resolve, reject) {
      if (signal.aborted) { reject(abortError()); return; }
      var t = setTimeout(function () { signal.removeEventListener('abort', on); resolve(); }, ms);
      function on() { clearTimeout(t); reject(abortError()); }
      signal.addEventListener('abort', on, { once: true });
    });
  }
  function abortError() { var e = new Error('aborted'); e.name = 'AbortError'; return e; }

  function streamDemo(question, signal, onDelta) {
    var tokens = demoTokens(pickDemo(question));
    var i = 0;
    return sleep(450 + Math.random() * 350, signal).then(function step() {
      if (i >= tokens.length) return {};
      var n = 1 + Math.floor(Math.random() * 3);
      onDelta(tokens.slice(i, i + n).join(''));
      i += n;
      return sleep(22 + Math.random() * 38, signal).then(step);
    });
  }

  function streamFromEndpoint(url, messages, signal, onDelta) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages }),
      signal: signal
    }).catch(function (e) {
      if (e && e.name === 'AbortError') throw e;
      throw new Error('Функция не ответила. Проверьте адрес и что адрес этого сайта есть в ALLOWED_ORIGINS.');
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (raw) {
          var data = null;
          try { data = JSON.parse(raw); } catch (e) {}
          var code = data && data.error && data.error.code;
          var message = (code && ERRORS[code]) || (data && data.error && data.error.message) || ('Функция ответила ошибкой ' + res.status + '.');
          throw new Error(message);
        });
      }
      var type = res.headers.get('Content-Type') || '';
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var info = {};
      var failure = null;
      var sse = /event-stream/i.test(type);
      var parser = createSSEParser(function (data) {
        var r = handleChunk(data);
        if (r.error) failure = r.error;
        if (r.delta) onDelta(r.delta);
        if (r.finish === 'length') info.cut = true;
      });
      function pump() {
        return reader.read().then(function (step) {
          if (step.done) {
            if (sse) parser.end(); else { var tail = decoder.decode(); if (tail) onDelta(tail); }
            if (failure) throw new Error(failure);
            return info;
          }
          var text = decoder.decode(step.value, { stream: true });
          if (sse) parser.feed(text); else onDelta(text);
          if (failure) { try { reader.cancel(); } catch (e) {} throw new Error(failure); }
          return pump();
        });
      }
      return pump();
    });
  }

  els.form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state.busy) { stopStream(); return; }
    submit(els.input.value);
  });
  els.input.addEventListener('input', function () { autoGrow(); updateSend(); });
  els.input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      if (!state.busy) submit(els.input.value);
    }
  });

  function focusInput() { if (window.matchMedia('(pointer: fine)').matches) els.input.focus(); }

  function openSide() { root.classList.add('is-side'); els.scrim.hidden = false; }
  function closeSide() { root.classList.remove('is-side'); els.scrim.hidden = true; }
  $('skMenu').addEventListener('click', openSide);
  $('skSideClose').addEventListener('click', closeSide);
  els.scrim.addEventListener('click', closeSide);
  $('skNew').addEventListener('click', newChat);
  if (/Mac|iPhone|iPad/.test(navigator.platform || '')) $('skNewKbd').textContent = '⌘ K';

  var lastFocus = null;
  function openModal(m) {
    lastFocus = document.activeElement;
    m.hidden = false;
    var f = m.querySelector('input, button:not([data-sk-close])');
    if (f) setTimeout(function () { f.focus(); }, 30);
  }
  function closeModal(m) {
    m.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function openSettings() {
    els.endpoint.value = state.endpoint || '';
    els.endpoint.placeholder = paramEndpoint || 'https://onpress-chat.ваш-аккаунт.workers.dev';
    els.checkResult.textContent = ''; els.checkResult.className = 'sk-check';
    closeSide();
    openModal(els.settings);
  }
  function openConnect() {
    els.endpoint2.value = state.endpoint || '';
    closeSide();
    els.settings.hidden = true;
    openModal(els.connect);
  }
  $('skSettingsBtn').addEventListener('click', openSettings);
  els.status.addEventListener('click', function () { isLive() ? openSettings() : openConnect(); });
  els.badge.addEventListener('click', function () { isLive() ? openSettings() : openConnect(); });
  $('skHowTo').addEventListener('click', openConnect);
  root.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-sk-close]');
    if (t) closeModal(t.closest('.sk-modal'));
  });

  function setEndpoint(raw) {
    raw = String(raw || '').trim();
    var v = normalizeEndpoint(raw);
    if (raw && !v) { toast('Адрес должен начинаться с https://'); return false; }
    state.endpoint = v;
    save(STORE_ENDPOINT, v);
    renderAll();
    toast(v ? 'Функция подключена: ' + hostOf(v) : (paramEndpoint ? 'Чат использует адрес из настроек страницы' : 'Включен демо-режим'));
    return true;
  }
  els.settingsForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (setEndpoint(els.endpoint.value)) closeModal(els.settings);
  });
  $('skSave2').addEventListener('click', function () {
    if (setEndpoint(els.endpoint2.value)) closeModal(els.connect);
  });
  els.endpoint2.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('skSave2').click(); } });
  els.check.addEventListener('click', function () {
    var v = normalizeEndpoint(els.endpoint.value) || paramEndpoint;
    els.checkResult.className = 'sk-check';
    if (!v) { els.checkResult.textContent = 'Впишите адрес, который напечатал wrangler deploy.'; els.checkResult.classList.add('is-bad'); return; }
    els.checkResult.textContent = 'Проверяем…';
    fetch(v, { method: 'OPTIONS' }).then(function (r) {
      if (r.ok) { els.checkResult.textContent = 'Функция отвечает и принимает запросы с этого сайта.'; els.checkResult.classList.add('is-ok'); }
      else { els.checkResult.textContent = 'Функция ответила ' + r.status + '. Проверьте ALLOWED_ORIGINS.'; els.checkResult.classList.add('is-bad'); }
    }, function () {
      els.checkResult.textContent = 'Нет ответа. Проверьте адрес и что адрес этого сайта есть в ALLOWED_ORIGINS.';
      els.checkResult.classList.add('is-bad');
    });
  });
  $('skWipe').addEventListener('click', function () {
    if (!state.chats.length) { toast('Чатов пока нет'); return; }
    stopStream();
    var backup = state.chats.slice(); var cur = state.current;
    state.chats = []; state.current = null;
    persist(); renderAll(); closeModal(els.settings);
    toast('Все чаты удалены', 'Вернуть', function () { state.chats = backup; state.current = cur; persist(); renderAll(); });
  });

  var guidePres = els.connect.querySelectorAll('pre');
  for (var gp = 0; gp < guidePres.length; gp++) {
    guidePres[gp].appendChild(copyButton(function (p) { return function () { return p.querySelector('code').textContent; }; }(guidePres[gp]), ''));
  }

  var toastTimer = null;
  function toast(text, action, fn) {
    els.toastText.textContent = text;
    els.toastBtn.hidden = !action;
    els.toastBtn.textContent = action || '';
    els.toastBtn.onclick = action ? function () { hideToast(); fn(); } : null;
    els.toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, action ? 6000 : 2800);
  }
  function hideToast() { els.toast.classList.remove('is-on'); }

  function introOpen() { return !els.intro.hidden; }
  function closeIntro() {
    if (!introOpen() || els.intro.classList.contains('is-closing')) return;
    els.intro.classList.add('is-closing');
    setTimeout(function () { els.intro.hidden = true; els.intro.classList.remove('is-closing'); focusInput(); }, 220);
  }
  $('skIntroGo').addEventListener('click', closeIntro);
  setTimeout(function () { var b = $('skIntroGo'); if (b && introOpen()) b.focus(); }, 60);

  document.addEventListener('keydown', function (e) {
    if (introOpen()) {
      if (e.key === 'Enter' || e.key === 'Escape') {
        var a = document.activeElement;
        if (e.key === 'Enter' && a && a.tagName === 'A') return;
        e.preventDefault(); closeIntro();
      }
      return;
    }
    if (e.key === 'Escape') {
      if (!els.connect.hidden) { closeModal(els.connect); return; }
      if (!els.settings.hidden) { closeModal(els.settings); return; }
      if (root.classList.contains('is-side')) { closeSide(); return; }
      if (state.busy) { e.preventDefault(); stopStream(); }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'k' || e.key === 'K' || e.key === 'л' || e.key === 'Л')) {
      e.preventDefault(); newChat();
    }
  });

  renderAll();
  scrollBottom(true);
})();
