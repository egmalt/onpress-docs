(function (root) {
  "use strict";

  var VERSION = "0.17.6";
  var CDN = "https://unpkg.com/";
  var SOURCES = [
    CDN + "react@18.3.1/umd/react.production.min.js",
    CDN + "react-dom@18.3.1/umd/react-dom.production.min.js",
    CDN + "@excalidraw/excalidraw@" + VERSION + "/dist/excalidraw.production.min.js"
  ];
  var KEY_SCENE = "demo-whiteboard:v2:scene";
  var KEY_VIEW = "demo-whiteboard:v2:view";
  var GRID = 24;
  var FONT = 2;
  var INK = "#1e1e2e";
  var STICKERS = [
    { name: "Желтый", color: "#ffe066" },
    { name: "Розовый", color: "#ffa8d2" },
    { name: "Зеленый", color: "#9ee8a0" },
    { name: "Голубой", color: "#9fd3ff" },
    { name: "Сиреневый", color: "#c9b6ff" },
    { name: "Оранжевый", color: "#ffbf80" }
  ];
  var DEFAULTS = {
    currentItemRoughness: 0,
    currentItemFontFamily: FONT,
    currentItemFontSize: 20,
    currentItemStrokeWidth: 2,
    currentItemStrokeColor: INK,
    currentItemBackgroundColor: "transparent",
    currentItemFillStyle: "solid",
    currentItemRoundness: "round",
    currentItemEndArrowhead: "triangle",
    viewBackgroundColor: "transparent"
  };
  var VIEW_KEYS = [
    "scrollX", "scrollY", "zoom", "objectsSnapModeEnabled", "currentItemStrokeColor", "currentItemBackgroundColor",
    "currentItemFillStyle", "currentItemStrokeWidth", "currentItemStrokeStyle", "currentItemRoughness",
    "currentItemOpacity", "currentItemFontFamily", "currentItemFontSize", "currentItemTextAlign",
    "currentItemStartArrowhead", "currentItemEndArrowhead", "currentItemRoundness"
  ];

  function pickView(appState) {
    var out = {};
    if (!appState) return out;
    for (var i = 0; i < VIEW_KEYS.length; i++) {
      var k = VIEW_KEYS[i];
      if (appState[k] !== undefined) out[k] = appState[k];
    }
    return out;
  }

  function parseScene(raw) {
    if (!raw) return null;
    try {
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.elements)) return null;
      return { elements: data.elements, files: data.files && typeof data.files === "object" ? data.files : {} };
    } catch (e) {
      return null;
    }
  }

  function parseView(raw) {
    if (!raw) return {};
    try {
      var v = JSON.parse(raw);
      if (!v || typeof v !== "object" || Array.isArray(v)) return {};
      var out = pickView(v);
      if (out.zoom && typeof out.zoom.value !== "number") delete out.zoom;
      return out;
    } catch (e) {
      return {};
    }
  }

  function gridStyle(scrollX, scrollY, zoom) {
    var size = GRID * zoom;
    while (size < 12) size *= 2;
    var px = ((scrollX * zoom) % size + size) % size;
    var py = ((scrollY * zoom) % size + size) % size;
    return { size: size.toFixed(2) + "px " + size.toFixed(2) + "px", position: px.toFixed(2) + "px " + py.toFixed(2) + "px" };
  }

  function debounce(fn, ms) {
    var t = null;
    var d = function () {
      var args = arguments;
      if (t) clearTimeout(t);
      t = setTimeout(function () { t = null; fn.apply(null, args); }, ms);
    };
    d.flush = function () { if (t) { clearTimeout(t); t = null; } };
    return d;
  }

  function sticker(id, x, y, color, text, size) {
    size = size || 200;
    return {
      type: "rectangle", id: id || undefined, x: x, y: y, width: size, height: size,
      backgroundColor: color, fillStyle: "solid", strokeColor: "transparent", strokeWidth: 1,
      roughness: 0, roundness: null,
      label: { text: text, fontSize: 20, fontFamily: FONT, strokeColor: INK, textAlign: "center", verticalAlign: "middle" }
    };
  }

  function shape(type, id, x, y, w, h, color, text) {
    return {
      type: type, id: id, x: x, y: y, width: w, height: h,
      backgroundColor: color, fillStyle: "solid", strokeColor: INK, strokeWidth: 2,
      roughness: 0, roundness: type === "rectangle" ? { type: 3 } : null,
      label: { text: text, fontSize: 20, fontFamily: FONT, strokeColor: INK }
    };
  }

  function arrow(id, x, y, w, h, from, to, color) {
    return {
      type: "arrow", id: id, x: x, y: y, width: w, height: h,
      strokeColor: color || INK, strokeWidth: 2, roughness: 0, endArrowhead: "triangle",
      start: { id: from }, end: { id: to }
    };
  }

  function starterSkeleton() {
    var els = [
      sticker("s-goal", 60, 90, "#ffe066", "Цель: 1000 заявок за первый месяц"),
      sticker("s-who", 290, 90, "#ffa8d2", "Кто наш клиент? Малый бизнес без дизайнера"),
      sticker("s-idea", 520, 90, "#9ee8a0", "Идея: видео-демо на первом экране"),
      sticker("s-risk", 750, 90, "#9fd3ff", "Риск: долгая загрузка на телефоне"),
      sticker("s-ask", 980, 90, "#c9b6ff", "Вопрос: нужен ли A/B тест?"),
      shape("rectangle", "f-research", 90, 420, 240, 110, "#9fd3ff", "Исследование"),
      shape("diamond", "f-decide", 470, 395, 240, 160, "#ffbf80", "Решение"),
      shape("ellipse", "f-launch", 850, 420, 260, 110, "#9ee8a0", "Запуск"),
      arrow("a-1", 330, 475, 140, 0, "f-research", "f-decide"),
      arrow("a-2", 710, 475, 140, 0, "f-decide", "f-launch"),
      arrow("a-3", 850, 290, 120, 130, "s-risk", "f-launch", "#e8336d"),
      {
        type: "text", id: "t-hint", x: 60, y: 600, text: "Двойной клик по стикеру или фигуре, чтобы писать. Новые стикеры на панели внизу.",
        fontSize: 18, fontFamily: FONT, strokeColor: "#55526e"
      }
    ];
    var ids = els.map(function (e) { return e.id; });
    els.push({ type: "frame", id: "frame-1", x: 20, y: 20, width: 1220, height: 640, name: "Мозговой штурм: запуск лендинга", children: ids });
    return els;
  }

  var helpers = { pickView: pickView, parseScene: parseScene, parseView: parseView, gridStyle: gridStyle, debounce: debounce, starterSkeleton: starterSkeleton };
  if (typeof module === "object" && module.exports) { module.exports = helpers; return; }

  var doc = root.document;
  var store = (function () {
    try { var s = root.localStorage; s.setItem("demo-whiteboard:probe", "1"); s.removeItem("demo-whiteboard:probe"); return s; } catch (e) { return null; }
  })();

  function get(k) { try { return store ? store.getItem(k) : null; } catch (e) { return null; } }
  function set(k, v) { try { if (store) store.setItem(k, v); return true; } catch (e) { return false; } }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = doc.createElement("script");
      s.src = src;
      s.async = false;
      s.crossOrigin = "anonymous";
      s.onload = resolve;
      s.onerror = function () { reject(new Error(src)); };
      doc.head.appendChild(s);
    });
  }

  function loadAll() {
    var chain = Promise.resolve();
    SOURCES.forEach(function (src, i) {
      chain = chain.then(function () {
        if (i === 0 && root.React) return null;
        if (i === 1 && root.ReactDOM) return null;
        if (i === 2 && root.ExcalidrawLib) return null;
        return loadScript(src);
      });
    });
    return chain;
  }

  function loadFonts() {
    if (!doc.fonts || !doc.fonts.load) return Promise.resolve();
    var wait = Promise.all([doc.fonts.load("20px Helvetica", "Aa"), doc.fonts.load("20px Helvetica", "Яя")]).catch(function () {});
    return Promise.race([wait, new Promise(function (r) { setTimeout(r, 4000); })]);
  }

  function showState(host, kind, text) {
    host.innerHTML = "";
    var box = doc.createElement("div");
    box.className = "demo-wb__state";
    box.setAttribute("data-wb-state", kind);
    if (kind === "loading") {
      var sp = doc.createElement("div");
      sp.className = "demo-wb__spinner";
      box.appendChild(sp);
    }
    var p = doc.createElement("p");
    p.className = "demo-wb__state-text";
    p.textContent = text;
    box.appendChild(p);
    if (kind === "error") {
      var b = doc.createElement("button");
      b.type = "button";
      b.className = "demo-wb__retry";
      b.textContent = "Попробовать еще раз";
      b.onclick = function () { start(host); };
      box.appendChild(b);
    }
    host.appendChild(box);
  }

  var intro = { open: false };

  function setupIntro() {
    var box = doc.getElementById("demo-wb-intro");
    if (!box) return;
    var btn = doc.getElementById("demo-wb-open");
    var back = box.querySelector(".demo-wb__btn--ghost");
    var title = box.querySelector("h1");
    if (title) { if (!title.id) title.id = "demo-wb-title"; box.setAttribute("aria-labelledby", title.id); }
    intro.open = true;
    function close() {
      if (!intro.open) return;
      intro.open = false;
      box.hidden = true;
      root.removeEventListener("keydown", onKey, true);
      var target = doc.querySelector("#demo-wb-root .excalidraw") || doc.getElementById("demo-wb-root");
      if (target) { if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1"); try { target.focus({ preventScroll: true }); } catch (e) {} }
    }
    function onKey(e) {
      if (!intro.open) return;
      var tag = e.target && e.target.tagName;
      if (e.key === "Escape" || (e.key === "Enter" && tag !== "A")) { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (e.key === "Tab") {
        var items = [back, btn].filter(Boolean);
        var i = items.indexOf(doc.activeElement);
        e.preventDefault();
        items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
      }
      e.stopPropagation();
    }
    root.addEventListener("keydown", onKey, true);
    if (btn) { btn.addEventListener("click", close); try { btn.focus({ preventScroll: true }); } catch (e) {} }
  }

  function mount(host) {
    var React = root.React;
    var ReactDOM = root.ReactDOM;
    var X = root.ExcalidrawLib;
    var h = React.createElement;

    var scene = parseScene(get(KEY_SCENE));
    var view = parseView(get(KEY_VIEW));
    var appState = Object.assign({}, DEFAULTS, view, { theme: "light", viewBackgroundColor: "transparent", name: "Доска" });
    var elements = scene ? scene.elements : X.convertToExcalidrawElements(starterSkeleton(), { regenerateIds: true });
    var fresh = !scene;

    var initialData = {
      elements: elements,
      files: scene ? scene.files : {},
      appState: appState,
      scrollToContent: fresh || (elements.length > 0 && view.zoom === undefined)
    };

    var gridKey = "";
    function syncGrid(st) {
      var z = st.zoom && st.zoom.value ? st.zoom.value : 1;
      var g = gridStyle(st.scrollX || 0, st.scrollY || 0, z);
      var k = g.size + "|" + g.position;
      if (k === gridKey) return;
      gridKey = k;
      host.style.backgroundSize = g.size;
      host.style.backgroundPosition = g.position;
    }

    function App() {
      var apiRef = React.useRef(null);
      var lastSceneRef = React.useRef(null);
      var savedState = React.useState(false);
      var saved = savedState[0], setSaved = savedState[1];
      var hideTimer = React.useRef(null);
      var addCount = React.useRef(0);

      var save = React.useMemo(function () {
        return debounce(function (els, st, files) {
          var version = X.getSceneVersion(els);
          var sig = version + "|" + Object.keys(files || {}).join(",");
          if (sig !== lastSceneRef.current) {
            var ok = set(KEY_SCENE, X.serializeAsJSON(els, st, files, "local"));
            if (!ok) ok = set(KEY_SCENE, X.serializeAsJSON(els, st, {}, "local"));
            if (ok) {
              var first = lastSceneRef.current === null;
              lastSceneRef.current = sig;
              if (!first) {
                setSaved(true);
                if (hideTimer.current) clearTimeout(hideTimer.current);
                hideTimer.current = setTimeout(function () { setSaved(false); }, 1400);
              }
            }
          }
          set(KEY_VIEW, JSON.stringify(pickView(st)));
        }, 350);
      }, []);

      React.useEffect(function () {
        function flushNow() {
          var api = apiRef.current;
          if (!api) return;
          save.flush();
          set(KEY_SCENE, X.serializeAsJSON(api.getSceneElementsIncludingDeleted(), api.getAppState(), api.getFiles(), "local"));
          set(KEY_VIEW, JSON.stringify(pickView(api.getAppState())));
        }
        root.addEventListener("pagehide", flushNow);
        return function () { root.removeEventListener("pagehide", flushNow); };
      }, [save]);

      function onChange(els, st, files) {
        syncGrid(st);
        save(els, st, files);
      }

      function addSticker(color) {
        var api = apiRef.current;
        if (!api) return;
        var st = api.getAppState();
        var z = st.zoom && st.zoom.value ? st.zoom.value : 1;
        var n = addCount.current++ % 6;
        var cx = -st.scrollX + st.width / 2 / z - 100 + n * 24;
        var cy = -st.scrollY + st.height / 2 / z - 100 + n * 24;
        var made = X.convertToExcalidrawElements([sticker(null, cx, cy, color, "Новая идея")], { regenerateIds: true });
        var rect = made.filter(function (e) { return e.type === "rectangle"; })[0];
        var sel = {};
        if (rect) sel[rect.id] = true;
        api.updateScene({
          elements: api.getSceneElementsIncludingDeleted().concat(made),
          appState: { selectedElementIds: sel, activeTool: { type: "selection", customType: null, lastActiveTool: null, locked: false } }
        });
      }

      function topRight() {
        return h("span", { className: "demo-wb__saved" + (saved ? " demo-wb__saved--on" : ""), "aria-live": "polite" }, saved ? "Сохранено" : "");
      }

      var MM = X.MainMenu;

      return h(React.Fragment, null,
        h("div", { className: "demo-wb__stickers", role: "toolbar", "aria-label": "Стикеры" },
          h("p", { className: "demo-wb__stickers-title" }, "Стикер"),
          STICKERS.map(function (s) {
            return h("button", {
              key: s.color, type: "button", className: "demo-wb__sticker", style: { "--c": s.color },
              title: s.name + " стикер", "aria-label": "Добавить " + s.name.toLowerCase() + " стикер",
              onClick: function () { addSticker(s.color); }
            });
          })
        ),
        h(X.Excalidraw, {
          excalidrawAPI: function (api) {
            apiRef.current = api;
            if (fresh && api) {
              fresh = false;
              setTimeout(function () { api.scrollToContent(undefined, { fitToContent: true, viewportZoomFactor: root.innerWidth < 720 ? 0.95 : 0.85 }); }, 60);
            }
          },
          initialData: initialData,
          onChange: onChange,
          langCode: "ru-RU",
          name: "Доска",
          theme: "light",
          gridModeEnabled: false,
          handleKeyboardGlobally: true,
          autoFocus: false,
          renderTopRightUI: topRight,
          UIOptions: { canvasActions: { loadScene: true, export: { saveFileToDisk: true }, saveAsImage: true, clearCanvas: true, changeViewBackgroundColor: false, toggleTheme: false } }
        },
          h(MM, null,
            h(MM.DefaultItems.LoadScene),
            h(MM.DefaultItems.SaveToActiveFile),
            h(MM.DefaultItems.Export),
            h(MM.DefaultItems.SaveAsImage),
            h(MM.DefaultItems.Help),
            h(MM.DefaultItems.ClearCanvas)
          )
        )
      );
    }

    host.innerHTML = "";
    syncGrid(appState);
    ReactDOM.createRoot(host).render(h(App));
  }

  function start(host) {
    showState(host, "loading", "Загружаем доску…");
    if (!root.EXCALIDRAW_ASSET_PATH) root.EXCALIDRAW_ASSET_PATH = CDN + "@excalidraw/excalidraw@" + VERSION + "/dist/";
    if (!root.process) root.process = { env: { NODE_ENV: "production" } };
    Promise.all([loadAll(), loadFonts()]).then(function () {
      if (!root.ExcalidrawLib || !root.ExcalidrawLib.Excalidraw) throw new Error("ExcalidrawLib");
      mount(host);
    }).catch(function () {
      showState(host, "error", "Не получилось загрузить редактор. Проверьте подключение к интернету и попробуйте еще раз.");
    });
  }

  function boot() {
    setupIntro();
    var host = doc.getElementById("demo-wb-root");
    if (host && !host.getAttribute("data-wb-started")) {
      host.setAttribute("data-wb-started", "1");
      start(host);
    }
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot); else boot();
})(typeof window !== "undefined" ? window : this);
