(function (root) {
  "use strict";

  var VERSION = "0.17.6";
  var CDN = "https://unpkg.com/";
  var SOURCES = [
    CDN + "react@18.3.1/umd/react.production.min.js",
    CDN + "react-dom@18.3.1/umd/react-dom.production.min.js",
    CDN + "@excalidraw/excalidraw@" + VERSION + "/dist/excalidraw.production.min.js"
  ];
  var KEY_SCENE = "demo-whiteboard:scene";
  var KEY_VIEW = "demo-whiteboard:view";
  var KEY_THEME = "demo-whiteboard:theme";
  var VIEW_KEYS = [
    "scrollX", "scrollY", "zoom", "gridSize", "viewBackgroundColor", "zenModeEnabled",
    "objectsSnapModeEnabled", "currentItemStrokeColor", "currentItemBackgroundColor",
    "currentItemFillStyle", "currentItemStrokeWidth", "currentItemStrokeStyle",
    "currentItemRoughness", "currentItemOpacity", "currentItemFontFamily", "currentItemFontSize",
    "currentItemTextAlign", "currentItemStartArrowhead", "currentItemEndArrowhead",
    "currentItemRoundness", "currentChartType", "name"
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

  function resolveTheme(stored, systemDark) {
    if (stored === "dark" || stored === "light") return stored;
    return systemDark ? "dark" : "light";
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

  var helpers = { pickView: pickView, parseScene: parseScene, parseView: parseView, resolveTheme: resolveTheme, debounce: debounce };
  if (typeof module === "object" && module.exports) { module.exports = helpers; return; }

  var doc = root.document;
  var store = (function () {
    try { var s = root.localStorage; s.setItem("demo-whiteboard:probe", "1"); s.removeItem("demo-whiteboard:probe"); return s; } catch (e) { return null; }
  })();

  function get(k) { try { return store ? store.getItem(k) : null; } catch (e) { return null; } }
  function set(k, v) { try { if (store) store.setItem(k, v); return true; } catch (e) { return false; } }
  function del(k) { try { if (store) store.removeItem(k); } catch (e) {} }

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

  var mqDark = root.matchMedia ? root.matchMedia("(prefers-color-scheme: dark)") : null;
  var intro = { open: false, onClose: null };

  function applyTheme(theme) {
    var app = doc.getElementById("demo-wb");
    if (!app) return;
    app.classList.toggle("demo-wb--dark", theme === "dark");
    doc.documentElement.style.background = theme === "dark" ? "#121212" : "#fff";
  }

  function setupIntro() {
    var box = doc.getElementById("demo-wb-intro");
    if (!box) return;
    var btn = doc.getElementById("demo-wb-open");
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
      if (intro.onClose) intro.onClose();
    }
    function onKey(e) {
      if (!intro.open) return;
      var tag = e.target && e.target.tagName;
      if (e.key === "Escape" || (e.key === "Enter" && tag !== "A")) { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (e.key === "Tab") {
        var items = [box.querySelector(".demo-wb__btn--ghost"), btn].filter(Boolean);
        var i = items.indexOf(doc.activeElement);
        e.preventDefault();
        items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
        e.stopPropagation();
        return;
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
    var mq = mqDark;

    var scene = parseScene(get(KEY_SCENE));
    var view = parseView(get(KEY_VIEW));
    var storedTheme = get(KEY_THEME);
    var initialTheme = resolveTheme(storedTheme, mq && mq.matches);
    view.theme = initialTheme;
    if (!view.name) view.name = "Доска";

    var initialData = {
      elements: scene ? scene.elements : [],
      files: scene ? scene.files : {},
      appState: view,
      scrollToContent: !!(scene && scene.elements.length && view.zoom === undefined)
    };

    function App() {
      var apiRef = React.useRef(null);
      var themeRef = React.useRef(initialTheme);
      var lastSceneRef = React.useRef(null);
      var savedState = React.useState(false);
      var saved = savedState[0], setSaved = savedState[1];
      var hideTimer = React.useRef(null);

      var save = React.useMemo(function () {
        return debounce(function (elements, appState, files) {
          var ok = true;
          var version = X.getSceneVersion(elements);
          var fileIds = Object.keys(files || {}).join(",");
          var sig = version + "|" + fileIds;
          if (sig !== lastSceneRef.current) {
            var json = X.serializeAsJSON(elements, appState, files, "local");
            ok = set(KEY_SCENE, json);
            if (!ok) {
              var noFiles = X.serializeAsJSON(elements, appState, {}, "local");
              ok = set(KEY_SCENE, noFiles);
            }
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
          set(KEY_VIEW, JSON.stringify(pickView(appState)));
        }, 350);
      }, []);

      React.useEffect(function () {
        function flushNow() {
          var api = apiRef.current;
          if (!api) return;
          save.flush();
          var els = api.getSceneElementsIncludingDeleted();
          set(KEY_SCENE, X.serializeAsJSON(els, api.getAppState(), api.getFiles(), "local"));
          set(KEY_VIEW, JSON.stringify(pickView(api.getAppState())));
        }
        root.addEventListener("pagehide", flushNow);
        return function () { root.removeEventListener("pagehide", flushNow); };
      }, [save]);

      React.useEffect(function () {
        if (!mq) return;
        function onSystem(e) {
          if (get(KEY_THEME)) return;
          var t = e.matches ? "dark" : "light";
          themeRef.current = t;
          applyTheme(t);
          if (apiRef.current) apiRef.current.updateScene({ appState: { theme: t } });
        }
        if (mq.addEventListener) mq.addEventListener("change", onSystem); else mq.addListener(onSystem);
        return function () { if (mq.removeEventListener) mq.removeEventListener("change", onSystem); else mq.removeListener(onSystem); };
      }, []);

      function onChange(elements, appState, files) {
        if (appState.theme !== themeRef.current) {
          themeRef.current = appState.theme;
          applyTheme(appState.theme);
          var sys = resolveTheme(null, mq && mq.matches);
          if (appState.theme === sys) del(KEY_THEME); else set(KEY_THEME, appState.theme);
        }
        save(elements, appState, files);
      }

      function topRight() {
        return h("span", { className: "demo-wb__saved" + (saved ? " demo-wb__saved--on" : ""), "aria-live": "polite" }, saved ? "Сохранено в браузере" : "");
      }

      var MM = X.MainMenu;
      var WS = X.WelcomeScreen;

      return h(X.Excalidraw, {
        excalidrawAPI: function (api) { apiRef.current = api; },
        initialData: initialData,
        onChange: onChange,
        langCode: "ru-RU",
        name: "Доска",
        handleKeyboardGlobally: true,
        autoFocus: false,
        renderTopRightUI: topRight,
        UIOptions: { canvasActions: { loadScene: true, export: { saveFileToDisk: true }, saveAsImage: true, clearCanvas: true, changeViewBackgroundColor: true, toggleTheme: true } }
      },
        h(MM, null,
          h(MM.DefaultItems.LoadScene),
          h(MM.DefaultItems.SaveToActiveFile),
          h(MM.DefaultItems.Export),
          h(MM.DefaultItems.SaveAsImage),
          h(MM.DefaultItems.Help),
          h(MM.DefaultItems.ClearCanvas),
          h(MM.Separator),
          h(MM.DefaultItems.ToggleTheme),
          h(MM.DefaultItems.ChangeCanvasBackground)
        ),
        h(WS, null,
          h(WS.Hints.MenuHint, null, "Экспорт в PNG и SVG, файл сцены, тема"),
          h(WS.Hints.ToolbarHint, null, "Выберите инструмент и начните рисовать"),
          h(WS.Hints.HelpHint, null, "Горячие клавиши и справка"),
          h(WS.Center, null,
            h(WS.Center.Logo, null, "Доска"),
            h(WS.Center.Heading, null, "Схемы, наброски и диаграммы. Все сохраняется в этом браузере."),
            h(WS.Center.Menu, null,
              h(WS.Center.MenuItemLoadScene),
              h(WS.Center.MenuItemHelp)
            )
          )
        )
      );
    }

    host.innerHTML = "";
    var rootNode = ReactDOM.createRoot(host);
    rootNode.render(h(App));
  }

  function start(host) {
    showState(host, "loading", "Загружаем доску…");
    if (!root.EXCALIDRAW_ASSET_PATH) root.EXCALIDRAW_ASSET_PATH = CDN + "@excalidraw/excalidraw@" + VERSION + "/dist/";
    if (!root.process) root.process = { env: { NODE_ENV: "production" } };
    loadAll().then(function () {
      if (!root.ExcalidrawLib || !root.ExcalidrawLib.Excalidraw) throw new Error("ExcalidrawLib");
      mount(host);
    }).catch(function () {
      showState(host, "error", "Не получилось загрузить редактор. Проверьте подключение к интернету и попробуйте еще раз.");
    });
  }

  function boot() {
    applyTheme(resolveTheme(get(KEY_THEME), mqDark && mqDark.matches));
    setupIntro();
    var host = doc.getElementById("demo-wb-root");
    if (host && !host.getAttribute("data-wb-started")) {
      host.setAttribute("data-wb-started", "1");
      start(host);
    }
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot); else boot();
})(typeof window !== "undefined" ? window : this);
