(function (root) {
  "use strict";

  var HF_URL = "https://cdn.jsdelivr.net/npm/hyperformula@3.5.0/dist/hyperformula.full.min.js";
  var XLSX_URL = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
  var STORE_KEY = "demo-sheets:book";
  var ROWH = 28, HEADH = 28, RHW = 52, DEFW = 104, MINW = 32, MAXW = 640;
  var MIN_ROWS = 100, MIN_COLS = 26, MAX_ROWS = 20000, MAX_COLS = 200;
  var HISTORY = 80;
  var FONT = "13px \"IBM Plex Sans\", \"Segoe UI\", system-ui, sans-serif";
  var FONT_URL = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap";

  var RU_FUNCS = {
    "СУММ": "SUM", "СРЗНАЧ": "AVERAGE", "МИН": "MIN", "МАКС": "MAX", "СЧЕТ": "COUNT", "СЧЕТЗ": "COUNTA",
    "СЧЕТЕСЛИ": "COUNTIF", "СУММЕСЛИ": "SUMIF", "СРЗНАЧЕСЛИ": "AVERAGEIF", "СУММЕСЛИМН": "SUMIFS", "СЧЕТЕСЛИМН": "COUNTIFS",
    "ЕСЛИ": "IF", "ЕСЛИМН": "IFS", "ЕСЛИОШИБКА": "IFERROR", "И": "AND", "ИЛИ": "OR", "НЕ": "NOT",
    "ОКРУГЛ": "ROUND", "ОКРУГЛВВЕРХ": "ROUNDUP", "ОКРУГЛВНИЗ": "ROUNDDOWN", "ABS": "ABS", "ВПР": "VLOOKUP", "ГПР": "HLOOKUP",
    "ПРОСМОТРX": "XLOOKUP", "ИНДЕКС": "INDEX", "ПОИСКПОЗ": "MATCH", "СЦЕП": "CONCAT", "СЦЕПИТЬ": "CONCATENATE",
    "ОБЪЕДИНИТЬ": "TEXTJOIN", "ДЛСТР": "LEN", "ЛЕВСИМВ": "LEFT", "ПРАВСИМВ": "RIGHT", "ПСТР": "MID", "ПРОПИСН": "UPPER",
    "СТРОЧН": "LOWER", "СЖПРОБЕЛЫ": "TRIM", "ТЕКСТ": "TEXT", "СЕГОДНЯ": "TODAY", "ТДАТА": "NOW", "ДАТА": "DATE",
    "ГОД": "YEAR", "МЕСЯЦ": "MONTH", "ДЕНЬ": "DAY", "РАЗНДАТ": "DATEDIF", "ЧИСТРАБДНИ": "NETWORKDAYS", "ПЛТ": "PMT",
    "СУММПРОИЗВ": "SUMPRODUCT", "МЕДИАНА": "MEDIAN", "СТАНДОТКЛОН": "STDEV", "СЛЧИС": "RAND", "СЛУЧМЕЖДУ": "RANDBETWEEN",
    "КОРЕНЬ": "SQRT", "СТЕПЕНЬ": "POWER", "ОСТАТ": "MOD", "ЦЕЛОЕ": "INT", "ФИЛЬТР": "FILTER", "ДЕНЬНЕД": "WEEKDAY"
  };

  var FUNC_INFO = {
    SUM: ["SUM(число1, [число2], …)", "Сумма чисел и диапазонов"],
    AVERAGE: ["AVERAGE(число1, [число2], …)", "Среднее арифметическое"],
    MIN: ["MIN(число1, [число2], …)", "Наименьшее значение"],
    MAX: ["MAX(число1, [число2], …)", "Наибольшее значение"],
    COUNT: ["COUNT(значение1, …)", "Сколько ячеек с числами"],
    COUNTA: ["COUNTA(значение1, …)", "Сколько непустых ячеек"],
    COUNTIF: ["COUNTIF(диапазон, условие)", "Сколько ячеек отвечает условию"],
    COUNTIFS: ["COUNTIFS(диапазон1, условие1, …)", "Счет по нескольким условиям"],
    SUMIF: ["SUMIF(диапазон, условие, [диапазон_суммы])", "Сумма по условию"],
    SUMIFS: ["SUMIFS(диапазон_суммы, диапазон1, условие1, …)", "Сумма по нескольким условиям"],
    AVERAGEIF: ["AVERAGEIF(диапазон, условие, [диапазон])", "Среднее по условию"],
    IF: ["IF(условие, если_да, [если_нет])", "Выбор значения по условию"],
    IFS: ["IFS(условие1, значение1, …)", "Первое выполненное условие"],
    IFERROR: ["IFERROR(значение, если_ошибка)", "Подмена ошибки своим значением"],
    AND: ["AND(условие1, …)", "Истина, если верны все условия"],
    OR: ["OR(условие1, …)", "Истина, если верно хоть одно"],
    NOT: ["NOT(условие)", "Обратное логическое значение"],
    ROUND: ["ROUND(число, разряды)", "Округление до заданных разрядов"],
    ROUNDUP: ["ROUNDUP(число, разряды)", "Округление вверх"],
    ROUNDDOWN: ["ROUNDDOWN(число, разряды)", "Округление вниз"],
    ABS: ["ABS(число)", "Модуль числа"],
    INT: ["INT(число)", "Целая часть с округлением вниз"],
    MOD: ["MOD(число, делитель)", "Остаток от деления"],
    SQRT: ["SQRT(число)", "Квадратный корень"],
    POWER: ["POWER(число, степень)", "Возведение в степень"],
    VLOOKUP: ["VLOOKUP(ключ, таблица, столбец, [неточно])", "Поиск по первому столбцу"],
    HLOOKUP: ["HLOOKUP(ключ, таблица, строка, [неточно])", "Поиск по первой строке"],
    XLOOKUP: ["XLOOKUP(ключ, где_искать, что_вернуть)", "Гибкий поиск значения"],
    INDEX: ["INDEX(диапазон, строка, [столбец])", "Значение по номеру строки и столбца"],
    MATCH: ["MATCH(ключ, диапазон, [тип])", "Позиция значения в диапазоне"],
    FILTER: ["FILTER(диапазон, условие)", "Строки, отвечающие условию"],
    CONCAT: ["CONCAT(текст1, …)", "Склеивание текста"],
    CONCATENATE: ["CONCATENATE(текст1, …)", "Склеивание текста"],
    TEXTJOIN: ["TEXTJOIN(разделитель, пропускать_пустые, текст1, …)", "Склеивание через разделитель"],
    LEN: ["LEN(текст)", "Длина строки"],
    LEFT: ["LEFT(текст, [знаков])", "Первые знаки строки"],
    RIGHT: ["RIGHT(текст, [знаков])", "Последние знаки строки"],
    MID: ["MID(текст, начало, знаков)", "Часть строки"],
    UPPER: ["UPPER(текст)", "Все прописные"],
    LOWER: ["LOWER(текст)", "Все строчные"],
    TRIM: ["TRIM(текст)", "Убрать лишние пробелы"],
    TEXT: ["TEXT(число, формат)", "Число как текст по формату"],
    TODAY: ["TODAY()", "Сегодняшняя дата"],
    NOW: ["NOW()", "Текущие дата и время"],
    DATE: ["DATE(год, месяц, день)", "Дата из частей"],
    YEAR: ["YEAR(дата)", "Год даты"],
    MONTH: ["MONTH(дата)", "Месяц даты"],
    DAY: ["DAY(дата)", "День месяца"],
    WEEKDAY: ["WEEKDAY(дата, [тип])", "День недели"],
    DATEDIF: ["DATEDIF(начало, конец, единица)", "Разница между датами"],
    NETWORKDAYS: ["NETWORKDAYS(начало, конец)", "Рабочие дни между датами"],
    PMT: ["PMT(ставка, периодов, сумма)", "Платеж по кредиту"],
    SUMPRODUCT: ["SUMPRODUCT(массив1, массив2, …)", "Сумма произведений"],
    MEDIAN: ["MEDIAN(число1, …)", "Медиана"],
    STDEV: ["STDEV(число1, …)", "Стандартное отклонение"],
    RAND: ["RAND()", "Случайное число от 0 до 1"],
    RANDBETWEEN: ["RANDBETWEEN(от, до)", "Случайное целое в границах"]
  };

  var ERR_TEXT = {
    DIV_BY_ZERO: "Деление на ноль",
    NAME: "Неизвестная функция или имя",
    REF: "Ссылка на несуществующую ячейку или лист",
    VALUE: "Неподходящий тип значения",
    NA: "Значение не найдено",
    CYCLE: "Циклическая ссылка: формула ссылается сама на себя",
    NUM: "Недопустимое число",
    ERROR: "Ошибка в записи формулы",
    SPILL: "Результату не хватает места: освободите ячейки ниже и правее",
    LIC: "Ошибка лицензии"
  };

  var PALETTE = [
    ["Красный", "#e5484d"], ["Оранжевый", "#f76b15"], ["Желтый", "#d6a100"], ["Зеленый", "#30a46c"],
    ["Бирюзовый", "#12a594"], ["Синий", "#3e63dd"], ["Фиолетовый", "#8e4ec6"], ["Розовый", "#d6409f"], ["Серый", "#8b8d98"]
  ];

  var NF_LIST = [
    ["auto", "Авто"], ["num", "Число"], ["int", "Целое"], ["pct", "Процент"], ["rub", "Рубли"],
    ["usd", "Доллары"], ["eur", "Евро"], ["date", "Дата"], ["time", "Время"], ["text", "Текст"]
  ];

  var ICONS = {
    undo: "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z",
    redo: "M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z",
    bold: "M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z",
    italic: "M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z",
    strike: "M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z",
    underline: "M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z",
    color: "M5.49 17h2.42l1.27-3.58h5.65L16.09 17h2.42L13.25 3h-2.5L5.49 17zm4.42-5.61 2.03-5.79h.12l2.03 5.79H9.91z",
    fill: "M16.56 8.94 7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10 10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z",
    alignL: "M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z",
    alignC: "M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z",
    alignR: "M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z",
    sortAsc: "M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z",
    sortDesc: "M3 6h6v2H3V6zm0 12v-2h18v2H3zm0-7h12v2H3v-2z",
    sum: "M18 4H6v2l6.5 6L6 18v2h12v-3h-7l5-5-5-5h7z",
    clear: "M3.27 5 2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21 18 19.73 3.55 5.27 3.27 5zM6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6z",
    upload: "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z",
    download: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
    add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    caret: "M7 10l5 5 5-5z",
    doc: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z",
    full: "M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z",
    exitFull: "M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z",
    help: "M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"
  };

  function icon(name) {
    return "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"" + ICONS[name] + "\"/></svg>";
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (ch) {
      return ch === "&" ? "&amp;" : ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : "&quot;";
    });
  }

  function clone(o) {
    return o == null ? o : JSON.parse(JSON.stringify(o));
  }

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function colName(c) {
    var s = "";
    c = c + 1;
    while (c > 0) {
      var m = (c - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      c = Math.floor((c - 1) / 26);
    }
    return s;
  }

  function colIndex(s) {
    var n = 0;
    s = s.toUpperCase();
    for (var i = 0; i < s.length; i++) n = n * 26 + (s.charCodeAt(i) - 64);
    return n - 1;
  }

  function addr(r, c) {
    return colName(c) + (r + 1);
  }

  function parseAddr(s) {
    var m = /^\s*\$?([A-Za-z]{1,3})\$?(\d{1,6})\s*$/.exec(s);
    if (!m) return null;
    var r = parseInt(m[2], 10) - 1;
    if (r < 0) return null;
    return { r: r, c: colIndex(m[1]) };
  }

  function norm(g) {
    return { r0: Math.min(g.r0, g.r1), r1: Math.max(g.r0, g.r1), c0: Math.min(g.c0, g.c1), c1: Math.max(g.c0, g.c1) };
  }

  function parseRange(s) {
    var p = String(s).split(":");
    if (p.length > 2) return null;
    var a = parseAddr(p[0]);
    var b = p.length > 1 ? parseAddr(p[1]) : a;
    if (!a || !b) return null;
    return norm({ r0: a.r, c0: a.c, r1: b.r, c1: b.c });
  }

  function rangeName(g) {
    return g.r0 === g.r1 && g.c0 === g.c1 ? addr(g.r0, g.c0) : addr(g.r0, g.c0) + ":" + addr(g.r1, g.c1);
  }

  function quoteSheet(name) {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? name : "'" + name.replace(/'/g, "''") + "'";
  }

  function mapOutside(f, fn) {
    var out = "", buf = "", i = 0, n = f.length;
    while (i < n) {
      var ch = f.charAt(i);
      if (ch === "\"" || ch === "'") {
        out += fn(buf);
        buf = "";
        var j = i + 1;
        while (j < n) {
          if (f.charAt(j) === ch) {
            if (f.charAt(j + 1) === ch) { j += 2; continue; }
            break;
          }
          j++;
        }
        out += f.slice(i, j + 1);
        i = j + 1;
      } else {
        buf += ch;
        i++;
      }
    }
    return out + fn(buf);
  }

  function normalizeFormula(f) {
    var body = mapOutside(f.slice(1), function (s) {
      s = s.replace(/([A-Za-z_\u0400-\u04ff][A-Za-z0-9_.\u0400-\u04ff]*)(\s*)\(/g, function (m, name, sp) {
        var key = name.toUpperCase().replace(/\u0401/g, "Е");
        return RU_FUNCS[key] ? RU_FUNCS[key] + "(" : m;
      });
      s = s.replace(/([A-Za-z0-9_.\u0400-\u04ff]+)!/g, function (m, name) {
        return /[^A-Za-z0-9_]/.test(name) || /^\d/.test(name) ? "'" + name + "'!" : m;
      });
      if (s.indexOf("{") < 0) s = s.replace(/;/g, ",");
      s = s.replace(/(^|[^A-Za-z0-9_.!$])(TRUE|FALSE)(?![A-Za-z0-9_.(!])/gi, function (m, pre, w) {
        return pre + w.toUpperCase() + "()";
      });
      return s;
    });
    return "=" + body;
  }

  function normalizeInput(raw) {
    var s = raw == null ? "" : String(raw);
    if (s.charAt(0) === "=") return s.length > 1 ? normalizeFormula(s) : s;
    var t = s.trim();
    if (!t) return "";
    var m = /^([+-]?)(\d{1,3}(?:[ \u00a0\u202f]\d{3})+|\d+)(?:[.,](\d+))?(\s?%|\s?[\u20bd$\u20ac])?$/.exec(t);
    if (m) {
      var num = (m[1] === "-" ? "-" : "") + m[2].replace(/[ \u00a0\u202f]/g, "") + (m[3] ? "." + m[3] : "");
      var suf = (m[4] || "").trim();
      return num + suf;
    }
    var p = /^([\u20bd$\u20ac])\s?(\d+(?:[.,]\d+)?)$/.exec(t);
    if (p) return p[1] + p[2].replace(",", ".");
    return s;
  }

  function editText(raw) {
    if (/^-?\d+\.\d+%?$/.test(raw)) return raw.replace(".", ",");
    return raw;
  }

  function shiftFormula(f, dr, dc) {
    if (!f || f.charAt(0) !== "=") return f;
    return "=" + mapOutside(f.slice(1), function (s) {
      return s.replace(/(^|[^A-Za-z0-9_.$])(\$?)([A-Za-z]{1,3})(\$?)(\d+)(?![A-Za-z0-9_(])/g, function (m, pre, ca, col, ra, row) {
        var c = colIndex(col), r = parseInt(row, 10) - 1;
        if (!ca) c += dc;
        if (!ra) r += dr;
        if (c < 0 || r < 0) return pre + "#REF!";
        return pre + ca + colName(c) + ra + (r + 1);
      });
    });
  }

  var NF_CACHE = {};
  function nfmt(min, max) {
    var k = min + ":" + max;
    return NF_CACHE[k] || (NF_CACHE[k] = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: min, maximumFractionDigits: max }));
  }

  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function serialDate(v) {
    return new Date(Date.UTC(1899, 11, 30) + Math.round(v * 86400000));
  }

  function fmtDate(v, time) {
    var d = serialDate(v);
    var s = pad(d.getUTCDate()) + "." + pad(d.getUTCMonth() + 1) + "." + d.getUTCFullYear();
    if (time) s += " " + pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes());
    return s;
  }

  function fmtTime(v) {
    var d = serialDate(v);
    return pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes());
  }

  function autoDigits(v) {
    var a = Math.abs(v);
    if (a === 0 || Number.isInteger(v)) return 0;
    var intD = a >= 1 ? Math.floor(Math.log10(a)) + 1 : 0;
    return clamp(11 - intD, 0, 10);
  }

  function resolveKind(f, type, raw) {
    var kind = f && f.nf || "auto";
    if (kind !== "auto") return kind;
    if (type === "NUMBER_PERCENT") return "pct";
    if (type === "NUMBER_DATE") return "date";
    if (type === "NUMBER_DATETIME") return "datetime";
    if (type === "NUMBER_TIME") return "time";
    if (type === "NUMBER_CURRENCY") return /\$/.test(raw || "") ? "usd" : /\u20ac/.test(raw || "") ? "eur" : "rub";
    return "auto";
  }

  function formatNumber(v, type, f, raw) {
    if (!isFinite(v)) return String(v);
    var kind = resolveKind(f, type, raw);
    var dec = f && typeof f.dec === "number" ? f.dec : null;
    var d;
    switch (kind) {
      case "num": d = dec == null ? 2 : dec; return nfmt(d, d).format(v);
      case "int": return nfmt(0, 0).format(v);
      case "pct": return (dec == null ? nfmt(0, 2) : nfmt(dec, dec)).format(v * 100) + "%";
      case "rub": d = dec == null ? (Number.isInteger(v) ? 0 : 2) : dec; return nfmt(d, d).format(v) + "\u00a0₽";
      case "usd": d = dec == null ? 2 : dec; return "$" + nfmt(d, d).format(v);
      case "eur": d = dec == null ? 2 : dec; return nfmt(d, d).format(v) + "\u00a0€";
      case "date": return fmtDate(v, false);
      case "datetime": return fmtDate(v, true);
      case "time": return fmtTime(v);
      default:
        if (dec != null) return nfmt(dec, dec).format(v);
        var s = nfmt(0, autoDigits(v)).format(v);
        if (s.length > 16) return v.toExponential(4).replace(".", ",");
        return s;
    }
  }

  function formatCell(val, type, f, raw) {
    if (val === null || val === undefined) return { text: "", kind: "empty" };
    if (typeof val === "number") return { text: formatNumber(val, type, f, raw), kind: "num" };
    if (typeof val === "boolean") return { text: val ? "ИСТИНА" : "ЛОЖЬ", kind: "bool" };
    if (typeof val === "string") return { text: val, kind: val === "" ? "empty" : "text" };
    if (val && typeof val.value === "string") return { text: val.value, kind: "err", err: val };
    return { text: String(val), kind: "text" };
  }

  function errText(err) {
    if (!err) return "";
    var base = ERR_TEXT[err.type] || "Ошибка";
    if (err.type === "NAME" && err.message) {
      var m = /name ([^\s]+) not recognized/i.exec(err.message);
      if (m) base = "Неизвестное имя: " + m[1];
    }
    return base;
  }

  function detectDelimiter(text) {
    var line = String(text).split(/\r?\n/)[0] || "";
    var best = ",", n = 0;
    ["\t", ";", ","].forEach(function (d) {
      var k = line.split(d).length - 1;
      if (k > n) { n = k; best = d; }
    });
    return best;
  }

  function parseCSV(text, d) {
    text = String(text).replace(/^\ufeff/, "");
    d = d || detectDelimiter(text);
    var rows = [], row = [], field = "", q = false, i = 0, n = text.length;
    while (i < n) {
      var ch = text.charAt(i);
      if (q) {
        if (ch === "\"") {
          if (text.charAt(i + 1) === "\"") { field += "\""; i += 2; continue; }
          q = false; i++; continue;
        }
        field += ch; i++; continue;
      }
      if (ch === "\"" && field === "") { q = true; i++; continue; }
      if (ch === d) { row.push(field); field = ""; i++; continue; }
      if (ch === "\r" || ch === "\n") {
        row.push(field); rows.push(row); row = []; field = "";
        if (ch === "\r" && text.charAt(i + 1) === "\n") i++;
        i++; continue;
      }
      field += ch; i++;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function toCSV(rows, d) {
    return rows.map(function (row) {
      return row.map(function (v) {
        v = v == null ? "" : String(v);
        return v.indexOf(d) >= 0 || /["\r\n]/.test(v) ? "\"" + v.replace(/"/g, "\"\"") + "\"" : v;
      }).join(d);
    }).join("\r\n");
  }

  function trimData(data) {
    var out = (data || []).map(function (row) {
      row = (row || []).map(function (v) { return v === undefined || v === "" ? null : v; });
      while (row.length && row[row.length - 1] == null) row.pop();
      return row;
    });
    while (out.length && !out[out.length - 1].length) out.pop();
    return out;
  }

  function seriesStep(vals) {
    if (vals.length < 2) return null;
    for (var i = 0; i < vals.length; i++) if (!/^-?\d+(\.\d+)?$/.test(vals[i])) return null;
    var nums = vals.map(Number), d = nums[1] - nums[0];
    for (var j = 2; j < nums.length; j++) if (Math.abs(nums[j] - nums[j - 1] - d) > 1e-9) return null;
    return { last: nums[nums.length - 1], first: nums[0], d: d };
  }

  function roundSeries(x) {
    return String(Math.round(x * 1e10) / 1e10);
  }

  function shiftKeys(map, axis, at, n) {
    var out = {};
    Object.keys(map || {}).forEach(function (k) {
      var p = k.split(":"), r = +p[0], c = +p[1], v = axis === "r" ? r : c;
      if (n < 0 && v >= at && v < at - n) return;
      if (v >= at) v += n;
      if (axis === "r") r = v; else c = v;
      out[r + ":" + c] = map[k];
    });
    return out;
  }

  function shiftWidths(map, at, n) {
    var out = {};
    Object.keys(map || {}).forEach(function (k) {
      var c = +k;
      if (n < 0 && c >= at && c < at - n) return;
      if (c >= at) c += n;
      out[c] = map[k];
    });
    return out;
  }

  function compareKeys(a, b, asc) {
    var ea = a == null || a === "", eb = b == null || b === "";
    if (ea || eb) return ea === eb ? 0 : ea ? 1 : -1;
    var ra = typeof a === "number" ? 0 : typeof a === "string" ? 1 : typeof a === "boolean" ? 2 : 3;
    var rb = typeof b === "number" ? 0 : typeof b === "string" ? 1 : typeof b === "boolean" ? 2 : 3;
    var r;
    if (ra !== rb) r = ra - rb;
    else if (ra === 0) r = a - b;
    else if (ra === 1) r = a.localeCompare(b, "ru", { numeric: true, sensitivity: "base" });
    else if (ra === 2) r = (a ? 1 : 0) - (b ? 1 : 0);
    else r = 0;
    return asc ? r : -r;
  }

  function sampleBook() {
    var h = { b: true, fill: "#30a46c" };
    var fmt = {};
    for (var c = 0; c < 5; c++) fmt["0:" + c] = h;
    for (var r = 1; r <= 6; r++) {
      fmt[r + ":2"] = { nf: "rub" };
      fmt[r + ":3"] = { nf: "rub" };
      fmt[r + ":4"] = { nf: "pct", dec: 1 };
    }
    fmt["8:0"] = { b: true };
    fmt["8:1"] = { b: true };
    fmt["8:3"] = { b: true, nf: "rub" };
    fmt["8:4"] = { b: true, nf: "pct", dec: 0 };
    fmt["11:3"] = { nf: "rub" };
    fmt["13:3"] = { nf: "int" };
    fmt["14:3"] = { nf: "usd", dec: 0 };
    fmt["15:3"] = { i: true, color: "#30a46c" };
    var fmt2 = { "0:0": h, "0:1": h, "1:1": { nf: "num" }, "2:1": { nf: "num" }, "3:1": { nf: "num" } };
    return {
      v: 1,
      active: 0,
      sheets: [
        {
          name: "Бюджет поездки",
          colW: { 0: 200, 1: 84, 2: 112, 3: 140, 4: 84 },
          fmt: fmt,
          data: [
            ["Статья", "Кол-во", "Цена", "Сумма", "Доля"],
            ["Авиабилеты", "2", "18500", "=B2*C2", "=D2/$D$9"],
            ["Отель, ночей", "5", "6200", "=B3*C3", "=D3/$D$9"],
            ["Аренда авто, дней", "4", "3100", "=B4*C4", "=D4/$D$9"],
            ["Экскурсии", "3", "2500", "=B5*C5", "=D5/$D$9"],
            ["Еда, дней", "5", "3500", "=B6*C6", "=D6/$D$9"],
            ["Страховка", "2", "900", "=B7*C7", "=D7/$D$9"],
            [],
            ["Итого", "=SUM(B2:B7)", null, "=SUM(D2:D7)", "=SUM(E2:E7)"],
            [],
            ["Самая дорогая статья", null, null, "=INDEX(A2:A7,MATCH(MAX(D2:D7),D2:D7,0))"],
            ["Средняя статья", null, null, "=AVERAGE(D2:D7)"],
            ["Дата вылета", null, null, "15.12.2026"],
            ["Дней до вылета", null, null, "=MAX(0,D13-TODAY())"],
            ["Итого в долларах", null, null, "=D9/'Курсы'!B2"],
            ["Статус", null, null, "=IF(D9>150000,\"дороже плана\",\"в бюджете\")"]
          ]
        },
        {
          name: "Курсы",
          colW: { 0: 120, 1: 110 },
          fmt: fmt2,
          data: [["Валюта", "Курс, ₽"], ["USD", "92.5"], ["EUR", "99.8"], ["CNY", "12.7"]]
        }
      ]
    };
  }

  function makeConcatPlugin(M) {
    if (!M.FunctionPlugin || !M.FunctionArgumentType) return;
    if (M.HyperFormula.getRegisteredFunctionNames("enGB").indexOf("CONCAT") >= 0) return;
    class ConcatPlugin extends M.FunctionPlugin {
      concat(ast, state) {
        return this.runFunction(ast.args, state, this.metadata("CONCAT"), function () {
          return Array.prototype.join.call(arguments, "");
        });
      }
    }
    ConcatPlugin.implementedFunctions = {
      CONCAT: { method: "concat", parameters: [{ argumentType: M.FunctionArgumentType.STRING }], repeatLastArgs: 1, expandRanges: true }
    };
    try {
      M.HyperFormula.registerFunctionPlugin(ConcatPlugin, { enGB: { CONCAT: "CONCAT" } });
    } catch (e) {}
  }

  function Book(M) {
    this.M = M;
    makeConcatPlugin(M);
    this.hf = M.HyperFormula.buildEmpty({
      licenseKey: "gpl-v3",
      dateFormats: ["DD.MM.YYYY", "DD.MM.YY", "YYYY-MM-DD"],
      timeFormats: ["hh:mm", "hh:mm:ss"],
      currencySymbol: ["₽", "$", "€"],
      undoLimit: 0,
      maxRows: MAX_ROWS,
      maxColumns: MAX_COLS
    });
    this.sheets = [];
    this.active = 0;
    this.undos = [];
    this.redos = [];
    this.uid = 1;
    this.onchange = null;
  }

  Book.prototype.cur = function () {
    return this.sheets[this.active];
  };

  Book.prototype.byUid = function (uid) {
    for (var i = 0; i < this.sheets.length; i++) if (this.sheets[i].uid === uid) return this.sheets[i];
    return null;
  };

  Book.prototype.indexOfUid = function (uid) {
    for (var i = 0; i < this.sheets.length; i++) if (this.sheets[i].uid === uid) return i;
    return -1;
  };

  Book.prototype.at = function (r, c, sh) {
    return { sheet: (sh || this.cur()).hid, row: r, col: c };
  };

  Book.prototype.raw = function (r, c, sh) {
    var v = this.hf.getCellSerialized(this.at(r, c, sh));
    return v == null ? "" : String(v);
  };

  Book.prototype.value = function (r, c, sh) {
    return this.hf.getCellValue(this.at(r, c, sh));
  };

  Book.prototype.dtype = function (r, c, sh) {
    return this.hf.getCellValueDetailedType(this.at(r, c, sh));
  };

  Book.prototype.isEmpty = function (r, c, sh) {
    var v = this.value(r, c, sh);
    return v === null || v === undefined || v === "";
  };

  Book.prototype.fmt = function (r, c, sh) {
    return (sh || this.cur()).fmt[r + ":" + c];
  };

  Book.prototype.dims = function (sh) {
    return this.hf.getSheetDimensions((sh || this.cur()).hid);
  };

  Book.prototype.cleanName = function (n) {
    return String(n == null ? "" : n).replace(/[\[\]*?:\/\\']/g, " ").replace(/\s+/g, " ").trim().slice(0, 31);
  };

  Book.prototype.nameTaken = function (n, exceptUid) {
    var l = n.toLowerCase();
    return this.sheets.some(function (s) { return s.uid !== exceptUid && s.name.toLowerCase() === l; });
  };

  Book.prototype.uniqueName = function (n, exceptUid) {
    n = this.cleanName(n) || "Лист";
    if (!this.nameTaken(n, exceptUid)) return n;
    for (var k = 2; k < 10000; k++) {
      var cand = n.slice(0, 26) + " " + k;
      if (!this.nameTaken(cand, exceptUid)) return cand;
    }
    return n + " " + Date.now();
  };

  Book.prototype._add = function (s, at) {
    var name = this.uniqueName(s.name || "Лист 1");
    var hname = this.hf.addSheet(name);
    var sh = {
      uid: this.uid++,
      hid: this.hf.getSheetId(hname),
      name: hname,
      fmt: s.fmt && typeof s.fmt === "object" ? clone(s.fmt) : {},
      colW: s.colW && typeof s.colW === "object" ? clone(s.colW) : {},
      rows: clamp(s.rows | 0, MIN_ROWS, MAX_ROWS),
      cols: clamp(s.cols | 0, MIN_COLS, MAX_COLS),
      sel: null
    };
    if (s.data && s.data.length) {
      var w = 0;
      s.data.forEach(function (row) { w = Math.max(w, row ? row.length : 0); });
      sh.rows = clamp(Math.max(sh.rows, s.data.length + 20), MIN_ROWS, MAX_ROWS);
      sh.cols = clamp(Math.max(sh.cols, w + 2), MIN_COLS, MAX_COLS);
    }
    if (at == null || at >= this.sheets.length) this.sheets.push(sh);
    else this.sheets.splice(at, 0, sh);
    return sh;
  };

  Book.prototype._content = function (s) {
    var data = (s.data || []).slice(0, MAX_ROWS).map(function (row) {
      return (row || []).slice(0, MAX_COLS).map(function (v) { return v === "" || v === undefined ? null : v; });
    });
    var w = 0;
    data.forEach(function (row) { w = Math.max(w, row.length); });
    return data.map(function (row) {
      while (row.length < w) row.push(null);
      return row;
    });
  };

  Book.prototype.load = function (data) {
    var self = this, hf = this.hf;
    this.sheets.forEach(function (s) { hf.removeSheet(s.hid); });
    this.sheets = [];
    this.undos = [];
    this.redos = [];
    var list = data && Array.isArray(data.sheets) && data.sheets.length ? data.sheets : [{ name: "Лист 1" }];
    list.forEach(function (s) { self._add(s); });
    hf.batch(function () {
      list.forEach(function (s, i) {
        var content = self._content(s);
        if (content.length) hf.setSheetContent(self.sheets[i].hid, content);
      });
    });
    this.active = clamp(data && data.active | 0, 0, this.sheets.length - 1);
  };

  Book.prototype.serialize = function () {
    var self = this;
    return {
      v: 1,
      active: this.active,
      sheets: this.sheets.map(function (s) {
        return { name: s.name, data: trimData(self.hf.getSheetSerialized(s.hid)), fmt: s.fmt, colW: s.colW, rows: s.rows, cols: s.cols };
      })
    };
  };

  Book.prototype.snap = function (sh) {
    return { data: trimData(this.hf.getSheetSerialized(sh.hid)), fmt: clone(sh.fmt), colW: clone(sh.colW), rows: sh.rows, cols: sh.cols };
  };

  Book.prototype.restore = function (sh, s) {
    this.hf.setSheetContent(sh.hid, this._content(s));
    sh.fmt = clone(s.fmt);
    sh.colW = clone(s.colW);
    sh.rows = s.rows;
    sh.cols = s.cols;
  };

  Book.prototype.changed = function (kind) {
    if (this.onchange) this.onchange(kind || "data");
  };

  Book.prototype.op = function (fn, all) {
    var self = this, targets = all ? this.sheets.slice() : [this.cur()];
    var before = targets.map(function (s) { return self.snap(s); });
    var res = fn.call(this, this.cur());
    var after = targets.map(function (s) { return self.snap(s); });
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      this.undos.push({ uids: targets.map(function (s) { return s.uid; }), before: before, after: after, active: this.cur().uid });
      if (this.undos.length > HISTORY) this.undos.shift();
      this.redos = [];
    }
    this.changed();
    return res;
  };

  Book.prototype._apply = function (e, snaps) {
    var self = this;
    this.hf.batch(function () {
      e.uids.forEach(function (uid, i) {
        var sh = self.byUid(uid);
        if (sh) self.restore(sh, snaps[i]);
      });
    });
    var a = this.indexOfUid(e.active);
    if (a >= 0) this.active = a;
  };

  Book.prototype.undo = function () {
    var e = this.undos.pop();
    if (!e) return false;
    this._apply(e, e.before);
    this.redos.push(e);
    this.changed();
    return true;
  };

  Book.prototype.redo = function () {
    var e = this.redos.pop();
    if (!e) return false;
    this._apply(e, e.after);
    this.undos.push(e);
    this.changed();
    return true;
  };

  Book.prototype.dropHistory = function () {
    this.undos = [];
    this.redos = [];
  };

  Book.prototype.ensure = function (sh, r, c) {
    if (r >= sh.rows) sh.rows = clamp(r + 1, MIN_ROWS, MAX_ROWS);
    if (c >= sh.cols) sh.cols = clamp(c + 1, MIN_COLS, MAX_COLS);
  };

  Book.prototype.setCells = function (list) {
    var self = this, sh = this.cur(), failed = 0;
    this.hf.batch(function () {
      list.forEach(function (x) {
        if (x.r < 0 || x.c < 0 || x.r >= MAX_ROWS || x.c >= MAX_COLS) return;
        self.ensure(sh, x.r, x.c);
        try {
          self.hf.setCellContents(self.at(x.r, x.c, sh), x.raw === "" || x.raw == null ? null : x.raw);
        } catch (e) {
          failed++;
        }
      });
    });
    return failed;
  };

  Book.prototype.clip = function (g, sh) {
    sh = sh || this.cur();
    return { r0: g.r0, c0: g.c0, r1: Math.min(g.r1, sh.rows - 1), c1: Math.min(g.c1, sh.cols - 1) };
  };

  Book.prototype.used = function (g, sh) {
    var d = this.dims(sh);
    return { r0: g.r0, c0: g.c0, r1: Math.min(g.r1, d.height - 1), c1: Math.min(g.c1, d.width - 1) };
  };

  Book.prototype.setFmt = function (g, patch) {
    var sh = this.cur();
    g = this.clip(g, sh);
    for (var r = g.r0; r <= g.r1; r++) {
      for (var c = g.c0; c <= g.c1; c++) {
        var k = r + ":" + c, f = {}, old = sh.fmt[k];
        if (old) for (var p in old) f[p] = old[p];
        for (var q in patch) {
          var v = patch[q];
          if (v === null || v === undefined || v === false || v === "" || (q === "nf" && v === "auto")) delete f[q];
          else f[q] = v;
        }
        if (Object.keys(f).length) sh.fmt[k] = f;
        else delete sh.fmt[k];
      }
    }
  };

  Book.prototype.clearFmt = function (g) {
    var sh = this.cur();
    g = this.clip(g, sh);
    Object.keys(sh.fmt).forEach(function (k) {
      var p = k.split(":"), r = +p[0], c = +p[1];
      if (r >= g.r0 && r <= g.r1 && c >= g.c0 && c <= g.c1) delete sh.fmt[k];
    });
  };

  Book.prototype.clearValues = function (g) {
    var sh = this.cur(), u = this.used(g, sh), list = [];
    for (var r = u.r0; r <= u.r1; r++) for (var c = u.c0; c <= u.c1; c++) if (this.raw(r, c, sh) !== "") list.push({ r: r, c: c, raw: null });
    this.setCells(list);
  };

  Book.prototype.insertRows = function (at, n) {
    var sh = this.cur();
    if (!this.hf.isItPossibleToAddRows(sh.hid, [at, n])) return false;
    this.hf.addRows(sh.hid, [at, n]);
    sh.fmt = shiftKeys(sh.fmt, "r", at, n);
    sh.rows = clamp(sh.rows + n, MIN_ROWS, MAX_ROWS);
    return true;
  };

  Book.prototype.removeRows = function (at, n) {
    var sh = this.cur();
    this.hf.removeRows(sh.hid, [at, n]);
    sh.fmt = shiftKeys(sh.fmt, "r", at, -n);
    sh.rows = clamp(sh.rows - n, MIN_ROWS, MAX_ROWS);
    return true;
  };

  Book.prototype.insertCols = function (at, n) {
    var sh = this.cur();
    if (!this.hf.isItPossibleToAddColumns(sh.hid, [at, n])) return false;
    this.hf.addColumns(sh.hid, [at, n]);
    sh.fmt = shiftKeys(sh.fmt, "c", at, n);
    sh.colW = shiftWidths(sh.colW, at, n);
    sh.cols = clamp(sh.cols + n, MIN_COLS, MAX_COLS);
    return true;
  };

  Book.prototype.removeCols = function (at, n) {
    var sh = this.cur();
    this.hf.removeColumns(sh.hid, [at, n]);
    sh.fmt = shiftKeys(sh.fmt, "c", at, -n);
    sh.colW = shiftWidths(sh.colW, at, -n);
    sh.cols = clamp(sh.cols - n, MIN_COLS, MAX_COLS);
    return true;
  };

  Book.prototype.region = function (r, c) {
    var self = this, sh = this.cur(), d = this.dims(sh);
    var maxR = d.height - 1, maxC = d.width - 1;
    var g = { r0: r, r1: r, c0: c, c1: c };
    function rowHas(rr, ca, cb) {
      if (rr < 0 || rr > maxR) return false;
      for (var x = Math.max(0, ca); x <= Math.min(maxC, cb); x++) if (!self.isEmpty(rr, x, sh)) return true;
      return false;
    }
    function colHas(cc, ra, rb) {
      if (cc < 0 || cc > maxC) return false;
      for (var y = Math.max(0, ra); y <= Math.min(maxR, rb); y++) if (!self.isEmpty(y, cc, sh)) return true;
      return false;
    }
    var changed = true, guard = 0;
    while (changed && guard++ < 100000) {
      changed = false;
      if (rowHas(g.r0 - 1, g.c0 - 1, g.c1 + 1)) { g.r0--; changed = true; }
      if (rowHas(g.r1 + 1, g.c0 - 1, g.c1 + 1)) { g.r1++; changed = true; }
      if (colHas(g.c0 - 1, g.r0 - 1, g.r1 + 1)) { g.c0--; changed = true; }
      if (colHas(g.c1 + 1, g.r0 - 1, g.r1 + 1)) { g.c1++; changed = true; }
    }
    return g;
  };

  Book.prototype.hasHeader = function (g) {
    if (g.r1 <= g.r0) return false;
    var sh = this.cur(), anyText = false;
    for (var c = g.c0; c <= g.c1; c++) {
      var v = this.value(g.r0, c, sh);
      if (v === null || v === undefined) continue;
      if (typeof v !== "string") return false;
      anyText = true;
    }
    if (!anyText) return false;
    var f = this.fmt(g.r0, g.c0, sh);
    if (f && f.b) return true;
    for (var x = g.c0; x <= g.c1; x++) {
      var below = this.value(g.r0 + 1, x, sh);
      if (typeof below === "number") return true;
    }
    return false;
  };

  Book.prototype.sort = function (g, col, asc, header) {
    var sh = this.cur(), self = this, start = g.r0 + (header ? 1 : 0), rows = [];
    if (start >= g.r1 + 1) return;
    for (var r = start; r <= g.r1; r++) {
      var raws = [], fmts = [];
      for (var c = g.c0; c <= g.c1; c++) {
        raws.push(this.raw(r, c, sh));
        fmts.push(sh.fmt[r + ":" + c]);
      }
      var key = this.value(r, col, sh);
      if (key && typeof key === "object") key = null;
      rows.push({ src: r, raws: raws, fmts: fmts, key: key, i: rows.length });
    }
    rows.sort(function (a, b) { return compareKeys(a.key, b.key, asc) || a.i - b.i; });
    var list = [];
    rows.forEach(function (row, i) {
      var t = start + i;
      row.raws.forEach(function (raw, j) {
        var c2 = g.c0 + j;
        list.push({ r: t, c: c2, raw: raw.charAt(0) === "=" ? shiftFormula(raw, t - row.src, 0) : raw });
        if (row.fmts[j]) sh.fmt[t + ":" + c2] = row.fmts[j];
        else delete sh.fmt[t + ":" + c2];
      });
    });
    self.setCells(list);
  };

  Book.prototype._copyFmt = function (srcSh, g, sh, r, c) {
    var block = [];
    for (var y = g.r0; y <= g.r1; y++) for (var x = g.c0; x <= g.c1; x++) block.push([y - g.r0, x - g.c0, srcSh.fmt[y + ":" + x]]);
    return function () {
      block.forEach(function (b) {
        var k = (r + b[0]) + ":" + (c + b[1]);
        if (b[2]) sh.fmt[k] = clone(b[2]);
        else delete sh.fmt[k];
      });
    };
  };

  Book.prototype.copyPaste = function (srcUid, g, r, c, cut) {
    var src = this.byUid(srcUid), sh = this.cur(), hf = this.hf;
    if (!src) return false;
    var h = g.r1 - g.r0, w = g.c1 - g.c0;
    if (r + h >= MAX_ROWS || c + w >= MAX_COLS) return false;
    this.ensure(sh, r + h, c + w);
    var applyFmt = this._copyFmt(src, g, sh, r, c);
    var range = { start: { sheet: src.hid, row: g.r0, col: g.c0 }, end: { sheet: src.hid, row: g.r1, col: g.c1 } };
    try {
      if (cut) hf.cut(range); else hf.copy(range);
      hf.paste({ sheet: sh.hid, row: r, col: c });
    } catch (e) {
      return false;
    }
    if (cut) {
      for (var y = g.r0; y <= g.r1; y++) for (var x = g.c0; x <= g.c1; x++) delete src.fmt[y + ":" + x];
    }
    applyFmt();
    return true;
  };

  Book.prototype.pasteMatrix = function (r, c, rows) {
    var list = [];
    rows.forEach(function (row, i) {
      row.forEach(function (v, j) { list.push({ r: r + i, c: c + j, raw: normalizeInput(v) }); });
    });
    return this.setCells(list);
  };

  Book.prototype.fill = function (g, dst) {
    var sh = this.cur(), hf = this.hf, self = this;
    var h = g.r1 - g.r0 + 1, w = g.c1 - g.c0 + 1, list = [];
    this.ensure(sh, dst.r1, dst.c1);
    function copyBlock(sr0, sc0, sr1, sc1, tr, tc) {
      var applyFmt = self._copyFmt(sh, { r0: sr0, c0: sc0, r1: sr1, c1: sc1 }, sh, tr, tc);
      hf.copy({ start: { sheet: sh.hid, row: sr0, col: sc0 }, end: { sheet: sh.hid, row: sr1, col: sc1 } });
      hf.paste({ sheet: sh.hid, row: tr, col: tc });
      applyFmt();
    }
    var vertical = dst.c0 === g.c0 && dst.c1 === g.c1;
    var t, src, k;
    if (vertical && dst.r1 > g.r1) {
      for (t = g.r1 + 1; t <= dst.r1; t++) { src = g.r0 + ((t - g.r0) % h); copyBlock(src, g.c0, src, g.c1, t, g.c0); }
      for (k = g.c0; k <= g.c1; k++) series(k, true, g.r1 + 1, dst.r1, 1);
    } else if (vertical && dst.r0 < g.r0) {
      for (t = g.r0 - 1; t >= dst.r0; t--) { src = g.r1 - ((g.r0 - 1 - t) % h); copyBlock(src, g.c0, src, g.c1, t, g.c0); }
      for (k = g.c0; k <= g.c1; k++) series(k, true, dst.r0, g.r0 - 1, -1);
    } else if (!vertical && dst.c1 > g.c1) {
      for (t = g.c1 + 1; t <= dst.c1; t++) { src = g.c0 + ((t - g.c0) % w); copyBlock(g.r0, src, g.r1, src, g.r0, t); }
      for (k = g.r0; k <= g.r1; k++) series(k, false, g.c1 + 1, dst.c1, 1);
    } else if (!vertical && dst.c0 < g.c0) {
      for (t = g.c0 - 1; t >= dst.c0; t--) { src = g.c1 - ((g.c0 - 1 - t) % w); copyBlock(g.r0, src, g.r1, src, g.r0, t); }
      for (k = g.r0; k <= g.r1; k++) series(k, false, dst.c0, g.c0 - 1, -1);
    }
    function series(line, vert, from, to, dir) {
      var vals = [];
      if (vert) for (var y = g.r0; y <= g.r1; y++) vals.push(self.raw(y, line, sh));
      else for (var x = g.c0; x <= g.c1; x++) vals.push(self.raw(line, x, sh));
      var s = seriesStep(vals);
      if (!s) return;
      for (var p = from; p <= to; p++) {
        var step = dir > 0 ? p - (vert ? g.r1 : g.c1) : (vert ? g.r0 : g.c0) - p;
        var v = dir > 0 ? s.last + s.d * step : s.first - s.d * step;
        list.push(vert ? { r: p, c: line, raw: roundSeries(v) } : { r: line, c: p, raw: roundSeries(v) });
      }
    }
    if (list.length) this.setCells(list);
  };

  Book.prototype.addSheet = function (name, data, at) {
    var sh = this._add({ name: name || this.uniqueName("Лист " + (this.sheets.length + 1)), data: data && data.data, fmt: data && data.fmt, colW: data && data.colW }, at);
    if (data && data.data && data.data.length) this.hf.setSheetContent(sh.hid, this._content(data));
    this.active = this.indexOfUid(sh.uid);
    this.changed("sheets");
    return sh;
  };

  Book.prototype.renameSheet = function (i, name) {
    var sh = this.sheets[i];
    var n = this.cleanName(name);
    if (!n || n === sh.name) return sh.name;
    if (this.nameTaken(n, sh.uid)) return null;
    this.hf.renameSheet(sh.hid, n);
    sh.name = n;
    this.dropHistory();
    this.changed("sheets");
    return n;
  };

  Book.prototype.removeSheet = function (i) {
    if (this.sheets.length < 2) return false;
    var sh = this.sheets[i];
    this.hf.removeSheet(sh.hid);
    this.sheets.splice(i, 1);
    if (this.active >= this.sheets.length) this.active = this.sheets.length - 1;
    else if (this.active > i) this.active--;
    this.dropHistory();
    this.changed("sheets");
    return true;
  };

  Book.prototype.duplicateSheet = function (i) {
    var s = this.sheets[i];
    return this.addSheet(this.uniqueName(s.name + " копия"), { data: trimData(this.hf.getSheetSerialized(s.hid)), fmt: s.fmt, colW: s.colW }, i + 1);
  };

  Book.prototype.moveSheet = function (i, j) {
    if (j < 0 || j >= this.sheets.length || i === j) return;
    var activeUid = this.cur().uid;
    var s = this.sheets.splice(i, 1)[0];
    this.sheets.splice(j, 0, s);
    this.active = this.indexOfUid(activeUid);
    this.changed("sheets");
  };

  Book.prototype.stats = function (g) {
    var sh = this.cur(), u = this.used(g, sh), sum = 0, nums = 0, count = 0, seen = 0;
    for (var r = u.r0; r <= u.r1; r++) {
      for (var c = u.c0; c <= u.c1; c++) {
        if (++seen > 200000) return { sum: sum, nums: nums, count: count, partial: true };
        var v = this.value(r, c, sh);
        if (v === null || v === undefined || v === "") continue;
        count++;
        if (typeof v === "number") { sum += v; nums++; }
      }
    }
    return { sum: sum, nums: nums, count: count };
  };

  var core = {
    colName: colName, colIndex: colIndex, addr: addr, parseAddr: parseAddr, parseRange: parseRange, rangeName: rangeName,
    normalizeInput: normalizeInput, normalizeFormula: normalizeFormula, shiftFormula: shiftFormula, editText: editText,
    formatNumber: formatNumber, formatCell: formatCell, parseCSV: parseCSV, toCSV: toCSV, detectDelimiter: detectDelimiter,
    seriesStep: seriesStep, shiftKeys: shiftKeys, shiftWidths: shiftWidths, compareKeys: compareKeys, trimData: trimData,
    sampleBook: sampleBook, Book: Book, errText: errText, quoteSheet: quoteSheet
  };

  if (typeof module !== "undefined" && module.exports && typeof root.document === "undefined") {
    module.exports = core;
    return;
  }

  var doc = root.document;

  function h(tag, cls, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = doc.createElement("script");
      s.src = src;
      s.async = true;
      s.crossOrigin = "anonymous";
      s.onload = function () { resolve(); };
      s.onerror = function () { s.remove(); reject(new Error("load " + src)); };
      doc.head.appendChild(s);
    });
  }

  var measureCtx = null;
  function textWidth(text, bold) {
    if (!measureCtx) {
      var cv = doc.createElement("canvas");
      measureCtx = cv.getContext && cv.getContext("2d");
      if (!measureCtx) return String(text).length * 7;
    }
    measureCtx.font = (bold ? "600 " : "") + FONT;
    return measureCtx.measureText(String(text)).width;
  }

  function isMac() {
    return /Mac|iPhone|iPad/.test(root.navigator.platform || root.navigator.userAgent || "");
  }

  function App(host, M) {
    this.host = host;
    this.M = M;
    this.book = new Book(M);
    var saved = null;
    try { saved = JSON.parse(root.localStorage.getItem(STORE_KEY) || "null"); } catch (e) { saved = null; }
    try {
      this.book.load(saved && saved.v === 1 ? saved : sampleBook());
    } catch (e) {
      this.book.load(sampleBook());
    }
    this.sel = { r: 0, c: 0, er: 0, ec: 0 };
    this.edit = null;
    this.clip = null;
    this.drag = null;
    this.lefts = [0];
    this.win = null;
    this.saveTimer = 0;
    this.raf = 0;
    this.acItems = [];
    this.acIdx = 0;
    this.lastTap = null;
    this.fnList = this.buildFnList();
    this.build();
    this.bind();
    this.book.onchange = this.onBookChange.bind(this);
    this.switchSheet(this.book.active, true);
  }

  App.prototype.buildFnList = function () {
    var names = [];
    try { names = this.M.HyperFormula.getRegisteredFunctionNames("enGB"); } catch (e) { names = Object.keys(FUNC_INFO); }
    var ru = {};
    Object.keys(RU_FUNCS).forEach(function (k) { if (!ru[RU_FUNCS[k]] && k !== RU_FUNCS[k]) ru[RU_FUNCS[k]] = k; });
    var list = names.map(function (n) {
      var info = FUNC_INFO[n];
      return { name: n, sig: info ? info[0] : n + "(…)", desc: info ? info[1] : "", ru: ru[n] || "", top: info ? 0 : 1 };
    });
    list.sort(function (a, b) { return a.top - b.top || (a.name < b.name ? -1 : 1); });
    return list;
  };

  App.prototype.build = function () {
    var host = this.host;
    host.innerHTML = "";
    var app = h("div", "demo-sh__app");
    this.app = app;
    var mod = isMac() ? "⌘" : "Ctrl+";
    this.mod = mod;
    var tb = h("div", "demo-sh__toolbar");
    tb.setAttribute("role", "toolbar");
    tb.setAttribute("aria-label", "Панель таблицы");
    var nfOpts = NF_LIST.map(function (x) { return "<option value=\"" + x[0] + "\">" + x[1] + "</option>"; }).join("");
    tb.innerHTML = [
      this.btn("undo", "undo", "Отменить (" + mod + "Z)"),
      this.btn("redo", "redo", "Повторить (" + mod + (isMac() ? "⇧Z" : "Y") + ")"),
      "<span class=\"demo-sh__sep\"></span>",
      "<label class=\"demo-sh__select\" title=\"Формат чисел\"><select data-cmd=\"nf\" aria-label=\"Формат чисел\">" + nfOpts + "</select>" + icon("caret") + "</label>",
      "<button type=\"button\" class=\"demo-sh__btn demo-sh__btn--text\" data-cmd=\"decMinus\" title=\"Меньше знаков после запятой\" aria-label=\"Меньше знаков после запятой\">,0</button>",
      "<button type=\"button\" class=\"demo-sh__btn demo-sh__btn--text\" data-cmd=\"decPlus\" title=\"Больше знаков после запятой\" aria-label=\"Больше знаков после запятой\">,00</button>",
      "<span class=\"demo-sh__sep\"></span>",
      this.btn("bold", "bold", "Полужирный (" + mod + "B)"),
      this.btn("italic", "italic", "Курсив (" + mod + "I)"),
      this.btn("underline", "underline", "Подчеркнутый (" + mod + "U)"),
      this.btn("strike", "strike", "Зачеркнутый"),
      "<button type=\"button\" class=\"demo-sh__btn demo-sh__btn--swatch\" data-cmd=\"color\" title=\"Цвет текста\" aria-label=\"Цвет текста\">" + icon("color") + "<i class=\"demo-sh__bar\" data-swatch=\"color\"></i></button>",
      "<button type=\"button\" class=\"demo-sh__btn demo-sh__btn--swatch\" data-cmd=\"fill\" title=\"Заливка\" aria-label=\"Заливка\">" + icon("fill") + "<i class=\"demo-sh__bar\" data-swatch=\"fill\"></i></button>",
      "<span class=\"demo-sh__sep\"></span>",
      this.btn("alignL", "alignL", "По левому краю"),
      this.btn("alignC", "alignC", "По центру"),
      this.btn("alignR", "alignR", "По правому краю"),
      "<span class=\"demo-sh__sep\"></span>",
      this.btn("sortAsc", "sortAsc", "Сортировать по возрастанию"),
      this.btn("sortDesc", "sortDesc", "Сортировать по убыванию"),
      this.btn("sum", "sum", "Автосумма (Alt+=)"),
      this.btn("clear", "clear", "Очистить формат"),
      "<span class=\"demo-sh__grow\"></span>",
      "<button type=\"button\" class=\"demo-sh__btn demo-sh__btn--label\" data-cmd=\"import\" title=\"Открыть CSV или Excel\">" + icon("upload") + "<span>Открыть</span></button>",
      "<button type=\"button\" class=\"demo-sh__btn demo-sh__btn--label\" data-cmd=\"export\" title=\"Скачать CSV или Excel\">" + icon("download") + "<span>Скачать</span></button>",
      this.btn("new", "doc", "Новая книга"),
      this.btn("help", "help", "Клавиши и формулы")
    ].join("");
    this.toolbar = tb;

    var fbar = h("div", "demo-sh__fbar");
    fbar.innerHTML = "<input class=\"demo-sh__name\" aria-label=\"Адрес ячейки\" spellcheck=\"false\" autocomplete=\"off\"><span class=\"demo-sh__fx\" aria-hidden=\"true\">fx</span><input class=\"demo-sh__formula\" aria-label=\"Содержимое ячейки\" spellcheck=\"false\" autocomplete=\"off\" placeholder=\"Введите значение или формулу, например =SUM(A1:A5)\">";
    this.nameBox = fbar.querySelector(".demo-sh__name");
    this.fx = fbar.querySelector(".demo-sh__formula");

    var grid = h("div", "demo-sh__grid");
    grid.tabIndex = 0;
    grid.setAttribute("role", "grid");
    grid.setAttribute("aria-label", "Ячейки таблицы");
    grid.innerHTML = "<div class=\"demo-sh__canvas\"><div class=\"demo-sh__colhead\"><div class=\"demo-sh__corner\" title=\"Выделить все\"></div><div class=\"demo-sh__cols\"></div></div><div class=\"demo-sh__rowhead\"></div><div class=\"demo-sh__cells\"><div class=\"demo-sh__lines\"></div><div class=\"demo-sh__content\"></div><div class=\"demo-sh__overlay\"></div><input class=\"demo-sh__editor\" spellcheck=\"false\" autocomplete=\"off\" aria-label=\"Редактор ячейки\"></div></div>";
    this.grid = grid;
    this.canvas = grid.querySelector(".demo-sh__canvas");
    this.colsEl = grid.querySelector(".demo-sh__cols");
    this.rowsEl = grid.querySelector(".demo-sh__rowhead");
    this.cellsEl = grid.querySelector(".demo-sh__cells");
    this.linesEl = grid.querySelector(".demo-sh__lines");
    this.contentEl = grid.querySelector(".demo-sh__content");
    this.overlay = grid.querySelector(".demo-sh__overlay");
    this.ed = grid.querySelector(".demo-sh__editor");

    var tabs = h("div", "demo-sh__tabs");
    tabs.innerHTML = "<button type=\"button\" class=\"demo-sh__tabadd\" data-cmd=\"addSheet\" title=\"Новый лист\" aria-label=\"Новый лист\">" + icon("add") + "</button><div class=\"demo-sh__tablist\" role=\"tablist\"></div>";
    this.tabList = tabs.querySelector(".demo-sh__tablist");
    this.tabs = tabs;

    var status = h("div", "demo-sh__status");
    status.innerHTML = "<span class=\"demo-sh__info\"></span><span class=\"demo-sh__stats\"></span>";
    this.info = status.querySelector(".demo-sh__info");
    this.statsEl = status.querySelector(".demo-sh__stats");

    this.menuEl = h("div", "demo-sh__menu");
    this.menuEl.hidden = true;
    this.menuEl.setAttribute("role", "menu");
    this.acEl = h("div", "demo-sh__ac");
    this.acEl.hidden = true;
    this.acEl.setAttribute("role", "listbox");
    this.toastEl = h("div", "demo-sh__toast");
    this.toastEl.setAttribute("role", "status");
    this.toastEl.setAttribute("aria-live", "polite");
    this.dropEl = h("div", "demo-sh__drop", "<div class=\"demo-sh__drop-inner\">" + icon("upload") + "<span>Отпустите файл, чтобы открыть его новым листом</span></div>");
    this.fileInput = h("input", "demo-sh__file");
    this.fileInput.type = "file";
    this.fileInput.accept = ".csv,.tsv,.txt,.xlsx,.xls,.ods";
    this.fileInput.hidden = true;

    app.appendChild(tb);
    app.appendChild(fbar);
    app.appendChild(grid);
    app.appendChild(tabs);
    app.appendChild(status);
    app.appendChild(this.dropEl);
    app.appendChild(this.fileInput);
    host.appendChild(app);
    doc.body.appendChild(this.menuEl);
    doc.body.appendChild(this.acEl);
    doc.body.appendChild(this.toastEl);
  };

  App.prototype.btn = function (cmd, ic, title) {
    return "<button type=\"button\" class=\"demo-sh__btn\" data-cmd=\"" + cmd + "\" title=\"" + esc(title) + "\" aria-label=\"" + esc(title) + "\">" + icon(ic) + "</button>";
  };

  App.prototype.bind = function () {
    var self = this;
    this.toolbar.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-cmd]");
      if (b && !b.disabled) self.command(b.getAttribute("data-cmd"), b);
    });
    this.toolbar.addEventListener("mousedown", function (e) {
      if (e.target.closest("button")) e.preventDefault();
    });
    this.toolbar.querySelector("select[data-cmd=nf]").addEventListener("change", function (e) {
      self.applyFmt({ nf: e.target.value });
      self.grid.focus({ preventScroll: true });
    });
    this.tabs.addEventListener("click", function (e) {
      var add = e.target.closest("[data-cmd=addSheet]");
      if (add) { self.commitEdit(); self.book.addSheet(); self.switchSheet(self.book.active); return; }
      var more = e.target.closest(".demo-sh__tabmore");
      var tab = e.target.closest(".demo-sh__tab");
      if (!tab) return;
      var i = +tab.getAttribute("data-i");
      if (more) { self.tabMenu(i, more.getBoundingClientRect()); return; }
      if (i !== self.book.active) self.gotoSheet(i);
    });
    this.tabs.addEventListener("dblclick", function (e) {
      var tab = e.target.closest(".demo-sh__tab");
      if (tab) self.renameTab(+tab.getAttribute("data-i"));
    });
    this.tabs.addEventListener("contextmenu", function (e) {
      var tab = e.target.closest(".demo-sh__tab");
      if (!tab) return;
      e.preventDefault();
      self.tabMenu(+tab.getAttribute("data-i"), { left: e.clientX, bottom: e.clientY, top: e.clientY });
    });

    this.grid.addEventListener("scroll", function () { self.onScroll(); }, { passive: true });
    this.grid.addEventListener("pointerdown", function (e) { self.onDown(e); });
    this.grid.addEventListener("mousedown", function (e) {
      if (self.edit && self.canInsertRef() && e.target.closest(".demo-sh__cells")) e.preventDefault();
    });
    this.grid.addEventListener("dblclick", function (e) { self.onDbl(e); });
    this.grid.addEventListener("contextmenu", function (e) { self.onContext(e); });
    this.grid.addEventListener("keydown", function (e) { self.onKey(e); });
    this.grid.addEventListener("mousemove", function (e) { self.onHover(e); });
    root.addEventListener("pointermove", function (e) { self.onMove(e); });
    root.addEventListener("pointerup", function (e) { self.onUp(e); });
    root.addEventListener("pointercancel", function (e) { self.onUp(e, true); });

    [this.ed, this.fx].forEach(function (inp) {
      inp.addEventListener("keydown", function (e) { self.onEditKey(e, inp); });
      inp.addEventListener("input", function () { self.onEditInput(inp); });
      inp.addEventListener("click", function () { if (self.edit) { self.edit.ins = null; self.updateAC(); } });
    });
    this.fx.addEventListener("focus", function () {
      if (!self.edit) self.startEdit(null, "bar", true);
      else if (self.edit.input !== self.fx) self.edit.input = self.fx;
    });
    this.ed.addEventListener("blur", function () { self.onEditBlur(); });
    this.fx.addEventListener("blur", function () { self.onEditBlur(); });

    this.nameBox.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        var g = parseRange(self.nameBox.value);
        if (!g) { self.toast("Не понял адрес. Пример: B3 или A1:C10"); return; }
        var sh = self.book.cur();
        g.r1 = Math.min(g.r1, MAX_ROWS - 1);
        g.c1 = Math.min(g.c1, MAX_COLS - 1);
        self.book.ensure(sh, g.r1, g.c1);
        self.layout();
        self.select(g.r0, g.c0, g.r1, g.c1);
        self.grid.focus({ preventScroll: true });
      } else if (e.key === "Escape") {
        self.grid.focus({ preventScroll: true });
      }
    });
    this.nameBox.addEventListener("focus", function () { self.nameBox.select(); });
    this.nameBox.addEventListener("blur", function () { self.renderBars(); });

    doc.addEventListener("copy", function (e) { if (self.ownsFocus()) self.doCopy(e, false); });
    doc.addEventListener("cut", function (e) { if (self.ownsFocus()) self.doCopy(e, true); });
    doc.addEventListener("paste", function (e) { if (self.ownsFocus()) self.doPaste(e); });
    doc.addEventListener("pointerdown", function (e) {
      if (!self.menuEl.hidden && !self.menuEl.contains(e.target)) self.closeMenu();
      if (!self.acEl.hidden && !self.acEl.contains(e.target) && e.target !== self.ed && e.target !== self.fx) self.hideAC();
    }, true);
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !self.menuEl.hidden) { self.closeMenu(); e.stopPropagation(); }
    }, true);
    root.addEventListener("resize", function () { self.closeMenu(); self.schedule(); });
    root.addEventListener("beforeunload", function () { self.saveNow(); });
    root.addEventListener("storage", function (e) {
      if (e.key === STORE_KEY && e.newValue && !self.edit) {
        try { self.book.load(JSON.parse(e.newValue)); self.switchSheet(self.book.active, true); } catch (err) {}
      }
    });

    this.fileInput.addEventListener("change", function () {
      var f = self.fileInput.files && self.fileInput.files[0];
      self.fileInput.value = "";
      if (f) self.importFile(f);
    });
    var dragDepth = 0;
    this.app.addEventListener("dragenter", function (e) {
      if (!e.dataTransfer || Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") < 0) return;
      e.preventDefault();
      dragDepth++;
      self.app.classList.add("demo-sh__app--drop");
    });
    this.app.addEventListener("dragover", function (e) {
      if (dragDepth > 0) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }
    });
    this.app.addEventListener("dragleave", function () {
      if (dragDepth > 0 && --dragDepth === 0) self.app.classList.remove("demo-sh__app--drop");
    });
    this.app.addEventListener("drop", function (e) {
      if (dragDepth === 0) return;
      e.preventDefault();
      dragDepth = 0;
      self.app.classList.remove("demo-sh__app--drop");
      var f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) self.importFile(f);
    });
  };

  App.prototype.ownsFocus = function () {
    return doc.activeElement === this.grid && !this.edit;
  };

  App.prototype.range = function () {
    var s = this.sel;
    return norm({ r0: s.r, c0: s.c, r1: s.er, c1: s.ec });
  };

  App.prototype.colW = function (c) {
    var w = this.book.cur().colW[c];
    return w ? w : DEFW;
  };

  App.prototype.layout = function () {
    var sh = this.book.cur(), lefts = [0];
    for (var c = 0; c < sh.cols; c++) lefts.push(lefts[c] + this.colW(c));
    this.lefts = lefts;
    var W = lefts[sh.cols], H = sh.rows * ROWH;
    this.canvas.style.width = (RHW + W) + "px";
    this.canvas.style.height = (HEADH + H) + "px";
    this.colsEl.style.width = W + "px";
    this.rowsEl.style.height = H + "px";
    this.cellsEl.style.width = W + "px";
    this.cellsEl.style.height = H + "px";
    this.win = null;
  };

  App.prototype.colAt = function (x) {
    var a = this.lefts, lo = 0, hi = a.length - 2;
    if (x <= 0) return 0;
    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (a[mid] <= x) lo = mid; else hi = mid - 1;
    }
    return lo;
  };

  App.prototype.rect = function (g) {
    var a = this.lefts;
    return { x: a[g.c0], y: g.r0 * ROWH, w: a[g.c1 + 1] - a[g.c0], h: (g.r1 - g.r0 + 1) * ROWH };
  };

  App.prototype.schedule = function (full) {
    var self = this;
    if (full) this.win = null;
    if (this.raf) return;
    this.raf = (root.requestAnimationFrame || setTimeout)(function () {
      self.raf = 0;
      self.render();
    });
  };

  App.prototype.onScroll = function () {
    var sc = this.grid, sh = this.book.cur();
    if (sc.scrollTop + sc.clientHeight > sh.rows * ROWH - 4 * ROWH && sh.rows < MAX_ROWS) {
      sh.rows = Math.min(MAX_ROWS, sh.rows + 100);
      this.layout();
    }
    if (sc.scrollLeft + sc.clientWidth > this.lefts[sh.cols] - DEFW && sh.cols < MAX_COLS) {
      sh.cols = Math.min(MAX_COLS, sh.cols + 10);
      this.layout();
    }
    this.closeMenu();
    if (this.edit) this.positionAC();
    this.schedule();
  };

  App.prototype.windowRange = function () {
    var sc = this.grid, sh = this.book.cur();
    var top = sc.scrollTop, left = sc.scrollLeft, H = sc.clientHeight || 600, W = sc.clientWidth || 1000;
    return {
      r0: Math.max(0, Math.floor(top / ROWH) - 4),
      r1: Math.min(sh.rows - 1, Math.ceil((top + H) / ROWH) + 4),
      c0: Math.max(0, this.colAt(left) - 1),
      c1: Math.min(sh.cols - 1, this.colAt(left + W) + 1)
    };
  };

  App.prototype.render = function () {
    var w = this.windowRange(), old = this.win;
    if (!old || old.r0 !== w.r0 || old.r1 !== w.r1 || old.c0 !== w.c0 || old.c1 !== w.c1 || this.dirty) {
      this.win = w;
      this.dirty = false;
      this.renderCells(w);
    }
    this.renderHeads(w);
    this.renderOverlay();
  };

  App.prototype.invalidate = function () {
    this.dirty = true;
    this.schedule();
  };

  App.prototype.renderCells = function (w) {
    var b = this.book, sh = b.cur(), a = this.lefts, out = [], lines = [];
    for (var lc = w.c0; lc <= w.c1; lc++) lines.push("<i style=\"left:" + (a[lc + 1] - 1) + "px\"></i>");
    this.linesEl.innerHTML = lines.join("");
    var maxC = Math.min(sh.cols - 1, w.c1 + 8);
    for (var r = w.r0; r <= w.r1; r++) {
      for (var c = w.c0; c <= w.c1; c++) {
        var f = sh.fmt[r + ":" + c];
        var v = b.value(r, c, sh);
        var empty = v === null || v === undefined || v === "";
        if (empty && !(f && (f.fill || f.u || f.s))) continue;
        var type = typeof v === "number" ? b.dtype(r, c, sh) : null;
        var raw = type === "NUMBER_CURRENCY" ? b.raw(r, c, sh) : null;
        var out1 = formatCell(v, type, f, raw);
        var align = f && f.align || (out1.kind === "num" ? "r" : out1.kind === "bool" || out1.kind === "err" ? "c" : "l");
        var cls = "demo-sh__c demo-sh__c--" + align;
        if (out1.kind === "err") cls += " demo-sh__c--err";
        if (f) {
          if (f.b) cls += " demo-sh__c--b";
          if (f.i) cls += " demo-sh__c--i";
          if (f.u && f.s) cls += " demo-sh__c--us";
          else if (f.u) cls += " demo-sh__c--u";
          else if (f.s) cls += " demo-sh__c--s";
          if (f.fill) cls += " demo-sh__c--fill";
        }
        var width = a[c + 1] - a[c];
        if (out1.kind === "text" && align === "l" && !(f && f.fill)) {
          var need = textWidth(out1.text, f && f.b) + 12;
          if (need > width) {
            var cc = c + 1;
            while (cc <= maxC && width < need && b.isEmpty(r, cc, sh) && !(sh.fmt[r + ":" + cc] && sh.fmt[r + ":" + cc].fill)) {
              width += a[cc + 1] - a[cc];
              cc++;
            }
            if (cc > c + 1) cls += " demo-sh__c--ov";
          }
        }
        var style = "left:" + a[c] + "px;top:" + (r * ROWH) + "px;width:" + (width - 1) + "px";
        if (f && f.color) style += ";color:" + f.color;
        if (f && f.fill) style += ";--fill:" + f.fill;
        var title = out1.kind === "err" ? " title=\"" + esc(errText(out1.err)) + "\"" : "";
        out.push("<div class=\"" + cls + "\" style=\"" + style + "\"" + title + ">" + esc(out1.text) + "</div>");
      }
    }
    this.contentEl.innerHTML = out.join("");
  };

  App.prototype.renderHeads = function (w) {
    var a = this.lefts, g = this.range(), sh = this.book.cur(), cols = [], rows = [];
    var fullCol = g.r0 === 0 && g.r1 >= sh.rows - 1, fullRow = g.c0 === 0 && g.c1 >= sh.cols - 1;
    for (var c = w.c0; c <= w.c1; c++) {
      var cs = c >= g.c0 && c <= g.c1 ? (fullCol ? " demo-sh__ch--all" : " demo-sh__ch--sel") : "";
      cols.push("<div class=\"demo-sh__ch" + cs + "\" data-c=\"" + c + "\" style=\"left:" + a[c] + "px;width:" + (a[c + 1] - a[c]) + "px\">" + colName(c) + "<span class=\"demo-sh__rz\" data-c=\"" + c + "\"></span></div>");
    }
    for (var r = w.r0; r <= w.r1; r++) {
      var rs = r >= g.r0 && r <= g.r1 ? (fullRow ? " demo-sh__rh--all" : " demo-sh__rh--sel") : "";
      rows.push("<div class=\"demo-sh__rh" + rs + "\" data-r=\"" + r + "\" style=\"top:" + (r * ROWH) + "px\">" + (r + 1) + "</div>");
    }
    var ch = cols.join(""), rh = rows.join("");
    if (ch !== this._ch) { this.colsEl.innerHTML = ch; this._ch = ch; }
    if (rh !== this._rh) { this.rowsEl.innerHTML = rh; this._rh = rh; }
  };

  App.prototype.box = function (g, cls, style) {
    var rc = this.rect(g);
    return "<div class=\"" + cls + "\" style=\"left:" + rc.x + "px;top:" + rc.y + "px;width:" + rc.w + "px;height:" + rc.h + "px" + (style || "") + "\"></div>";
  };

  App.prototype.renderOverlay = function () {
    var g = this.range(), s = this.sel, sh = this.book.cur(), out = [];
    if (this.edit && this.edit.refs) {
      this.edit.refs.forEach(function (ref) {
        if (ref.uid === sh.uid) out.push(this.box(ref.g, "demo-sh__ref", ";--ref:" + ref.color));
      }, this);
    }
    if (this.clip && this.clip.uid === sh.uid) out.push(this.box(this.clip.g, "demo-sh__ants"));
    if (g.r0 !== g.r1 || g.c0 !== g.c1) out.push(this.box(g, "demo-sh__sel"));
    out.push(this.box({ r0: s.r, c0: s.c, r1: s.r, c1: s.c }, "demo-sh__active"));
    if (this.drag && this.drag.kind === "fill" && this.drag.dst) out.push(this.box(this.drag.dst, "demo-sh__fillprev"));
    if (!this.edit) {
      var rc = this.rect(g);
      out.push("<div class=\"demo-sh__fh\" style=\"left:" + (rc.x + rc.w - 4) + "px;top:" + (rc.y + rc.h - 4) + "px\" title=\"Потяните, чтобы заполнить\"></div>");
    }
    this.overlay.innerHTML = out.join("");
  };

  App.prototype.renderBars = function () {
    var b = this.book, sh = b.cur(), g = this.range(), s = this.sel;
    if (doc.activeElement !== this.nameBox) this.nameBox.value = rangeName(g);
    if (!this.edit) this.fx.value = editText(b.raw(s.r, s.c, sh));
    var f = b.fmt(s.r, s.c, sh) || {};
    var tb = this.toolbar;
    function on(cmd, v) {
      var el = tb.querySelector("[data-cmd=" + cmd + "]");
      if (el) { el.classList.toggle("demo-sh__btn--on", !!v); el.setAttribute("aria-pressed", v ? "true" : "false"); }
    }
    on("bold", f.b); on("italic", f.i); on("underline", f.u); on("strike", f.s);
    on("alignL", f.align === "l"); on("alignC", f.align === "c"); on("alignR", f.align === "r");
    tb.querySelector("[data-cmd=undo]").disabled = !b.undos.length;
    tb.querySelector("[data-cmd=redo]").disabled = !b.redos.length;
    var sel = tb.querySelector("select[data-cmd=nf]");
    sel.value = f.nf || "auto";
    tb.querySelector("[data-swatch=color]").style.background = f.color || "currentColor";
    tb.querySelector("[data-swatch=fill]").style.background = f.fill || "transparent";

    var v = b.value(s.r, s.c, sh);
    if (v && typeof v === "object" && v.type) {
      this.info.textContent = addr(s.r, s.c) + ": " + errText(v);
      this.info.classList.add("demo-sh__info--err");
    } else {
      this.info.classList.remove("demo-sh__info--err");
      this.info.textContent = this.saveState || "Данные хранятся в этом браузере";
    }
    var multi = g.r0 !== g.r1 || g.c0 !== g.c1;
    if (multi) {
      var st = b.stats(g), parts = [];
      if (st.nums) {
        parts.push("Сумма: " + formatNumber(st.sum, null, null));
        parts.push("Среднее: " + formatNumber(st.sum / st.nums, null, null));
      }
      parts.push("Значений: " + st.count + (st.partial ? "+" : ""));
      this.statsEl.textContent = parts.join("   ");
    } else {
      this.statsEl.textContent = "";
    }
  };

  App.prototype.renderTabs = function () {
    var b = this.book;
    this.tabList.innerHTML = b.sheets.map(function (s, i) {
      var act = i === b.active;
      return "<div class=\"demo-sh__tab" + (act ? " demo-sh__tab--on" : "") + "\" role=\"tab\" aria-selected=\"" + act + "\" data-i=\"" + i + "\" title=\"Двойной клик, чтобы переименовать\"><span class=\"demo-sh__tabname\">" + esc(s.name) + "</span>" + (act ? "<button type=\"button\" class=\"demo-sh__tabmore\" aria-label=\"Действия с листом\">" + icon("caret") + "</button>" : "") + "</div>";
    }).join("");
    var on = this.tabList.querySelector(".demo-sh__tab--on");
    if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  App.prototype.refresh = function () {
    this.layout();
    this.dirty = true;
    this.render();
    this.renderBars();
  };

  App.prototype.onBookChange = function (kind) {
    var sh = this.book.cur();
    var s = this.sel;
    s.r = Math.min(s.r, sh.rows - 1); s.er = Math.min(s.er, sh.rows - 1);
    s.c = Math.min(s.c, sh.cols - 1); s.ec = Math.min(s.ec, sh.cols - 1);
    if (kind === "sheets") this.renderTabs();
    this.refresh();
    this.queueSave();
  };

  App.prototype.queueSave = function () {
    var self = this;
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(function () { self.saveNow(); }, 400);
  };

  App.prototype.saveNow = function () {
    clearTimeout(this.saveTimer);
    try {
      root.localStorage.setItem(STORE_KEY, JSON.stringify(this.book.serialize()));
      this.saveState = "Сохранено в браузере";
    } catch (e) {
      this.saveState = "Не удалось сохранить: в браузере кончилось место";
    }
    if (!this.edit) this.renderBars();
  };

  App.prototype.switchSheet = function (i, first) {
    var b = this.book, prev = b.cur();
    if (prev && !first) prev.sel = { r: this.sel.r, c: this.sel.c, er: this.sel.er, ec: this.sel.ec, st: this.grid.scrollTop, sl: this.grid.scrollLeft };
    b.active = clamp(i, 0, b.sheets.length - 1);
    var sh = b.cur();
    var s = sh.sel || { r: 0, c: 0, er: 0, ec: 0, st: 0, sl: 0 };
    this.sel = { r: s.r, c: s.c, er: s.er, ec: s.ec };
    this.layout();
    this.grid.scrollTop = s.st || 0;
    this.grid.scrollLeft = s.sl || 0;
    this.renderTabs();
    this.refresh();
    if (!first) this.queueSave();
  };

  App.prototype.gotoSheet = function (i) {
    var e = this.edit;
    if (e && e.formula && this.canInsertRef()) {
      if (e.input === this.ed) {
        this.fx.value = this.ed.value;
        var pos = this.ed.selectionStart;
        e.input = this.fx;
        this.ed.classList.remove("demo-sh__editor--on");
        this.fx.focus();
        try { this.fx.setSelectionRange(pos, pos); } catch (err) {}
      }
      this.switchSheet(i);
      this.fx.focus();
      return;
    }
    this.commitEdit();
    this.switchSheet(i);
    this.grid.focus({ preventScroll: true });
  };

  App.prototype.select = function (r, c, er, ec, keepView) {
    var sh = this.book.cur();
    r = clamp(r, 0, sh.rows - 1); c = clamp(c, 0, sh.cols - 1);
    er = clamp(er == null ? r : er, 0, sh.rows - 1); ec = clamp(ec == null ? c : ec, 0, sh.cols - 1);
    this.sel = { r: r, c: c, er: er, ec: ec };
    if (!keepView) this.ensureVisible(er, ec);
    this.render();
    this.renderBars();
  };

  App.prototype.ensureVisible = function (r, c) {
    var sc = this.grid, a = this.lefts;
    var top = r * ROWH, bottom = top + ROWH, viewH = sc.clientHeight - HEADH;
    if (viewH > 0) {
      if (top < sc.scrollTop) sc.scrollTop = top;
      else if (bottom > sc.scrollTop + viewH) sc.scrollTop = bottom - viewH;
    }
    var x = a[c], x2 = a[c + 1], viewW = sc.clientWidth - RHW;
    if (viewW > 0) {
      if (x < sc.scrollLeft) sc.scrollLeft = x;
      else if (x2 > sc.scrollLeft + viewW) sc.scrollLeft = Math.min(x, x2 - viewW);
    }
  };

  App.prototype.jumpTarget = function (r, c, dr, dc) {
    var b = this.book, sh = b.cur(), d = b.dims(sh);
    var maxR = Math.max(d.height - 1, 0), maxC = Math.max(d.width - 1, 0);
    var limR = dr > 0 ? Math.max(maxR, r) : 0, limC = dc > 0 ? Math.max(maxC, c) : 0;
    var nr = r + dr, nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= sh.rows || nc >= sh.cols) return { r: r, c: c };
    var curEmpty = b.isEmpty(r, c, sh), nextEmpty = b.isEmpty(nr, nc, sh);
    if (!curEmpty && !nextEmpty) {
      while (true) {
        var tr = nr + dr, tc = nc + dc;
        if (tr < 0 || tc < 0 || tr >= sh.rows || tc >= sh.cols || b.isEmpty(tr, tc, sh)) break;
        nr = tr; nc = tc;
      }
      return { r: nr, c: nc };
    }
    while (b.isEmpty(nr, nc, sh)) {
      if ((dr > 0 && nr >= limR) || (dc > 0 && nc >= limC) || (dr < 0 && nr <= 0) || (dc < 0 && nc <= 0)) break;
      nr += dr; nc += dc;
    }
    return { r: nr, c: nc };
  };

  App.prototype.move = function (dr, dc, extend, jump) {
    var s = this.sel, sh = this.book.cur();
    var fr = extend ? s.er : s.r, fc = extend ? s.ec : s.c, t;
    if (jump) t = this.jumpTarget(fr, fc, dr, dc);
    else t = { r: fr + dr, c: fc + dc };
    if (t.r >= sh.rows - 1 && sh.rows < MAX_ROWS) { sh.rows = Math.min(MAX_ROWS, sh.rows + 100); this.layout(); }
    if (t.c >= sh.cols - 1 && sh.cols < MAX_COLS) { sh.cols = Math.min(MAX_COLS, sh.cols + 10); this.layout(); }
    if (extend) this.select(s.r, s.c, t.r, t.c);
    else this.select(t.r, t.c);
  };

  App.prototype.cellFromPoint = function (x, y) {
    var rc = this.cellsEl.getBoundingClientRect(), sh = this.book.cur();
    var px = x - rc.left, py = y - rc.top;
    return { r: clamp(Math.floor(py / ROWH), 0, sh.rows - 1), c: clamp(this.colAt(px), 0, sh.cols - 1) };
  };

  App.prototype.onHover = function (e) {
    if (this.drag) return;
    var rz = e.target.classList && e.target.classList.contains("demo-sh__rz");
    this.grid.classList.toggle("demo-sh__grid--rz", !!rz);
  };

  App.prototype.onDown = function (e) {
    var t = e.target, self = this;
    this.closeMenu();
    if (t === this.ed) return;
    var touch = e.pointerType === "touch" || e.pointerType === "pen";
    if (e.button === 2) {
      var cell = t.closest(".demo-sh__cells");
      if (cell) {
        var p = this.cellFromPoint(e.clientX, e.clientY), g = this.range();
        if (p.r < g.r0 || p.r > g.r1 || p.c < g.c0 || p.c > g.c1) { this.commitEdit(); this.select(p.r, p.c, null, null, true); }
      }
      return;
    }
    if (e.button !== 0 && !touch) return;

    if (t.classList.contains("demo-sh__fh")) {
      e.preventDefault();
      this.commitEdit();
      this.drag = { kind: "fill", src: this.range(), dst: null, id: e.pointerId };
      this.capture(e);
      return;
    }
    if (t.classList.contains("demo-sh__rz")) {
      e.preventDefault();
      var c0 = +t.getAttribute("data-c");
      this.drag = { kind: "rz", c: c0, x: e.clientX, w: this.colW(c0), id: e.pointerId };
      this.capture(e);
      return;
    }
    if (t.closest(".demo-sh__corner")) {
      this.commitEdit();
      var sh = this.book.cur();
      this.select(0, 0, sh.rows - 1, sh.cols - 1, true);
      this.grid.focus({ preventScroll: true });
      return;
    }
    var ch = t.closest(".demo-sh__ch");
    if (ch) {
      if (touch) { this.drag = { kind: "tap", target: "col", c: +ch.getAttribute("data-c"), x: e.clientX, y: e.clientY, id: e.pointerId }; return; }
      e.preventDefault();
      this.commitEdit();
      var c = +ch.getAttribute("data-c"), shc = this.book.cur();
      if (e.shiftKey) this.select(0, this.sel.c, shc.rows - 1, c, true);
      else this.select(0, c, shc.rows - 1, c, true);
      this.drag = { kind: "cols", id: e.pointerId };
      this.capture(e);
      this.grid.focus({ preventScroll: true });
      return;
    }
    var rh = t.closest(".demo-sh__rh");
    if (rh) {
      if (touch) { this.drag = { kind: "tap", target: "row", r: +rh.getAttribute("data-r"), x: e.clientX, y: e.clientY, id: e.pointerId }; return; }
      e.preventDefault();
      this.commitEdit();
      var r = +rh.getAttribute("data-r"), shr = this.book.cur();
      if (e.shiftKey) this.select(this.sel.r, 0, r, shr.cols - 1, true);
      else this.select(r, 0, r, shr.cols - 1, true);
      this.drag = { kind: "rows", id: e.pointerId };
      this.capture(e);
      this.grid.focus({ preventScroll: true });
      return;
    }
    if (!t.closest(".demo-sh__cells")) return;
    var pt = this.cellFromPoint(e.clientX, e.clientY);
    if (this.edit && this.canInsertRef()) {
      e.preventDefault();
      this.drag = { kind: "ref", r: pt.r, c: pt.c, id: e.pointerId };
      this.insertRef({ r0: pt.r, c0: pt.c, r1: pt.r, c1: pt.c });
      if (!touch) this.capture(e);
      return;
    }
    if (touch) {
      this.drag = { kind: "tap", target: "cell", r: pt.r, c: pt.c, x: e.clientX, y: e.clientY, id: e.pointerId };
      return;
    }
    e.preventDefault();
    this.commitEdit();
    if (e.shiftKey) this.select(this.sel.r, this.sel.c, pt.r, pt.c, true);
    else this.select(pt.r, pt.c, null, null, true);
    this.drag = { kind: "sel", id: e.pointerId };
    this.capture(e);
    this.grid.focus({ preventScroll: true });
    setTimeout(function () { if (doc.activeElement !== self.grid && !self.edit) self.grid.focus({ preventScroll: true }); }, 0);
  };

  App.prototype.capture = function (e) {
    try { this.grid.setPointerCapture(e.pointerId); } catch (err) {}
  };

  App.prototype.onMove = function (e) {
    var d = this.drag;
    if (!d || (d.id != null && e.pointerId !== d.id)) return;
    if (d.kind === "tap") {
      if (Math.abs(e.clientX - d.x) > 8 || Math.abs(e.clientY - d.y) > 8) this.drag = null;
      return;
    }
    if (d.kind === "rz") {
      var w = clamp(Math.round(d.w + e.clientX - d.x), MINW, MAXW);
      this.book.cur().colW[d.c] = w;
      this.layout();
      this.dirty = true;
      this.render();
      return;
    }
    this.lastPt = { x: e.clientX, y: e.clientY };
    this.dragTo(e.clientX, e.clientY);
    this.autoScroll();
  };

  App.prototype.dragTo = function (x, y) {
    var d = this.drag;
    if (!d) return;
    var p = this.cellFromPoint(x, y), s = this.sel, sh = this.book.cur();
    if (d.kind === "sel") {
      if (p.r !== s.er || p.c !== s.ec) { this.sel.er = p.r; this.sel.ec = p.c; this.render(); this.renderBars(); }
    } else if (d.kind === "cols") {
      if (p.c !== s.ec) { this.sel.ec = p.c; this.sel.er = sh.rows - 1; this.render(); this.renderBars(); }
    } else if (d.kind === "rows") {
      if (p.r !== s.er) { this.sel.er = p.r; this.sel.ec = sh.cols - 1; this.render(); this.renderBars(); }
    } else if (d.kind === "ref") {
      this.insertRef(norm({ r0: d.r, c0: d.c, r1: p.r, c1: p.c }));
    } else if (d.kind === "fill") {
      var g = d.src, dst = null;
      var down = p.r - g.r1, up = g.r0 - p.r, right = p.c - g.c1, left = g.c0 - p.c;
      var vmax = Math.max(down, up), hmax = Math.max(right, left);
      if (vmax > 0 && vmax >= hmax) dst = down > 0 ? { r0: g.r0, c0: g.c0, r1: p.r, c1: g.c1 } : { r0: p.r, c0: g.c0, r1: g.r1, c1: g.c1 };
      else if (hmax > 0) dst = right > 0 ? { r0: g.r0, c0: g.c0, r1: g.r1, c1: p.c } : { r0: g.r0, c0: p.c, r1: g.r1, c1: g.c1 };
      d.dst = dst;
      this.renderOverlay();
    }
  };

  App.prototype.autoScroll = function () {
    var self = this;
    if (this.scrollTimer) return;
    this.scrollTimer = setInterval(function () {
      var d = self.drag, p = self.lastPt;
      if (!d || !p || d.kind === "rz" || d.kind === "tap") { clearInterval(self.scrollTimer); self.scrollTimer = 0; return; }
      var rc = self.grid.getBoundingClientRect(), dx = 0, dy = 0;
      if (p.y < rc.top + HEADH) dy = -ROWH; else if (p.y > rc.bottom - 8) dy = ROWH;
      if (p.x < rc.left + RHW) dx = -40; else if (p.x > rc.right - 8) dx = 40;
      if (!dx && !dy) return;
      self.grid.scrollTop += dy;
      self.grid.scrollLeft += dx;
      self.dragTo(p.x, p.y);
    }, 40);
  };

  App.prototype.onUp = function (e, cancel) {
    var d = this.drag, self = this;
    if (!d || (d.id != null && e.pointerId !== d.id)) return;
    this.drag = null;
    if (this.scrollTimer) { clearInterval(this.scrollTimer); this.scrollTimer = 0; }
    if (cancel) { this.renderOverlay(); return; }
    if (d.kind === "tap") {
      var sh = this.book.cur();
      if (this.edit && this.canInsertRef() && d.target === "cell") { this.insertRef({ r0: d.r, c0: d.c, r1: d.r, c1: d.c }); return; }
      this.commitEdit();
      if (d.target === "col") { this.select(0, d.c, sh.rows - 1, d.c, true); return; }
      if (d.target === "row") { this.select(d.r, 0, d.r, sh.cols - 1, true); return; }
      var now = Date.now(), lt = this.lastTap;
      var same = this.sel.r === d.r && this.sel.c === d.c && this.sel.er === d.r && this.sel.ec === d.c;
      this.select(d.r, d.c, null, null, true);
      if (same && lt && lt.r === d.r && lt.c === d.c && now - lt.t < 450) {
        this.lastTap = null;
        this.startEdit(null, "edit");
      } else {
        this.lastTap = { r: d.r, c: d.c, t: now };
        this.grid.focus({ preventScroll: true });
      }
      return;
    }
    if (d.kind === "rz") {
      this.book.changed();
      return;
    }
    if (d.kind === "fill" && d.dst) {
      var src = d.src, dst = norm(d.dst);
      this.book.op(function () { this.fill(src, dst); });
      this.select(dst.r0, dst.c0, dst.r1, dst.c1, true);
      return;
    }
    if (d.kind === "ref" && this.edit) {
      setTimeout(function () { if (self.edit) self.edit.input.focus(); }, 0);
    }
    this.renderOverlay();
  };

  App.prototype.onDbl = function (e) {
    var t = e.target;
    if (t.classList.contains("demo-sh__rz")) { this.autoFit(+t.getAttribute("data-c")); return; }
    if (!t.closest(".demo-sh__cells") || t === this.ed) return;
    if (this.edit) return;
    var p = this.cellFromPoint(e.clientX, e.clientY);
    this.select(p.r, p.c, null, null, true);
    this.startEdit(null, "edit");
  };

  App.prototype.autoFit = function (c) {
    var b = this.book, sh = b.cur(), d = b.dims(sh), max = 0;
    for (var r = 0; r < Math.min(d.height, 5000); r++) {
      var v = b.value(r, c, sh);
      if (v === null || v === undefined || v === "") continue;
      var f = sh.fmt[r + ":" + c];
      var type = typeof v === "number" ? b.dtype(r, c, sh) : null;
      var t = formatCell(v, type, f, type === "NUMBER_CURRENCY" ? b.raw(r, c, sh) : null).text;
      max = Math.max(max, textWidth(t, f && f.b));
    }
    sh.colW[c] = clamp(Math.ceil(max + 18), max ? MINW : DEFW, MAXW);
    if (!max) delete sh.colW[c];
    this.book.changed();
  };

  App.prototype.onContext = function (e) {
    var t = e.target;
    if (t === this.ed) return;
    e.preventDefault();
    var self = this, g = this.range(), sh = this.book.cur(), k = this.mod;
    var rowsN = g.r1 - g.r0 + 1, colsN = g.c1 - g.c0 + 1;
    var isCol = !!t.closest(".demo-sh__ch"), isRow = !!t.closest(".demo-sh__rh");
    if (isCol) {
      var c = +t.closest(".demo-sh__ch").getAttribute("data-c");
      if (c < g.c0 || c > g.c1) { this.select(0, c, sh.rows - 1, c, true); g = this.range(); colsN = 1; }
    }
    if (isRow) {
      var r = +t.closest(".demo-sh__rh").getAttribute("data-r");
      if (r < g.r0 || r > g.r1) { this.select(r, 0, r, sh.cols - 1, true); g = this.range(); rowsN = 1; }
    }
    var items = [
      { label: "Вырезать", kbd: k + "X", act: function () { self.clipboardAction("cut"); } },
      { label: "Копировать", kbd: k + "C", act: function () { self.clipboardAction("copy"); } },
      { label: "Вставить", kbd: k + "V", act: function () { self.clipboardAction("paste"); } },
      "-"
    ];
    if (!isCol) {
      items.push({ label: rowsN > 1 ? "Вставить " + rowsN + " строки выше" : "Вставить строку выше", act: function () { self.rowsOp("insert", g.r0, rowsN); } });
      items.push({ label: rowsN > 1 ? "Вставить " + rowsN + " строки ниже" : "Вставить строку ниже", act: function () { self.rowsOp("insert", g.r1 + 1, rowsN); } });
      items.push({ label: rowsN > 1 ? "Удалить строки " + (g.r0 + 1) + "–" + (g.r1 + 1) : "Удалить строку", act: function () { self.rowsOp("remove", g.r0, rowsN); } });
    }
    if (!isRow) {
      if (!isCol) items.push("-");
      items.push({ label: colsN > 1 ? "Вставить " + colsN + " столбца слева" : "Вставить столбец слева", act: function () { self.colsOp("insert", g.c0, colsN); } });
      items.push({ label: colsN > 1 ? "Вставить " + colsN + " столбца справа" : "Вставить столбец справа", act: function () { self.colsOp("insert", g.c1 + 1, colsN); } });
      items.push({ label: colsN > 1 ? "Удалить столбцы " + colName(g.c0) + "–" + colName(g.c1) : "Удалить столбец", act: function () { self.colsOp("remove", g.c0, colsN); } });
    }
    items.push("-");
    items.push({ label: "Сортировать А → Я", act: function () { self.sortCmd(true); } });
    items.push({ label: "Сортировать Я → А", act: function () { self.sortCmd(false); } });
    items.push("-");
    items.push({ label: "Очистить содержимое", kbd: "Del", act: function () { self.book.op(function () { this.clearValues(g); }); } });
    items.push({ label: "Очистить формат", act: function () { self.book.op(function () { this.clearFmt(g); }); } });
    if (isCol) items.push({ label: "Ширина по содержимому", act: function () { for (var x = g.c0; x <= g.c1; x++) self.autoFit(x); } });
    this.openMenu(e.clientX, e.clientY, items);
  };

  App.prototype.rowsOp = function (kind, at, n) {
    var ok = this.book.op(function () { return kind === "insert" ? this.insertRows(at, n) : this.removeRows(at, n); }, true);
    if (!ok) this.toast("Больше строк добавить нельзя: предел " + MAX_ROWS);
    var s = this.sel;
    if (kind === "insert" && at <= s.r) this.select(s.r + n, s.c, s.er + n, s.ec, true);
    else this.select(s.r, s.c, s.er, s.ec, true);
  };

  App.prototype.colsOp = function (kind, at, n) {
    var ok = this.book.op(function () { return kind === "insert" ? this.insertCols(at, n) : this.removeCols(at, n); }, true);
    if (!ok) this.toast("Больше столбцов добавить нельзя: предел " + MAX_COLS);
    var s = this.sel;
    if (kind === "insert" && at <= s.c) this.select(s.r, s.c + n, s.er, s.ec + n, true);
    else this.select(s.r, s.c, s.er, s.ec, true);
  };

  App.prototype.openMenu = function (x, y, items, anchor) {
    var m = this.menuEl, self = this;
    m.innerHTML = "";
    items.forEach(function (it) {
      if (it === "-") { m.appendChild(h("div", "demo-sh__mi-sep")); return; }
      var b = h("button", "demo-sh__mi" + (it.danger ? " demo-sh__mi--danger" : ""), "<span>" + esc(it.label) + "</span>" + (it.kbd ? "<kbd>" + esc(it.kbd) + "</kbd>" : ""));
      b.type = "button";
      b.setAttribute("role", "menuitem");
      if (it.disabled) b.disabled = true;
      b.addEventListener("click", function () {
        self.closeMenu();
        it.act();
      });
      m.appendChild(b);
    });
    m.hidden = false;
    m.classList.remove("demo-sh__menu--in");
    var vw = root.innerWidth, vh = root.innerHeight, mw = m.offsetWidth || 220, mh = m.offsetHeight || 300;
    var left = Math.min(x, vw - mw - 8), top = y;
    if (top + mh > vh - 8) top = anchor ? anchor.top - mh - 4 : Math.max(8, vh - mh - 8);
    m.style.left = Math.max(8, left) + "px";
    m.style.top = Math.max(8, top) + "px";
    void m.offsetWidth;
    m.classList.add("demo-sh__menu--in");
    var first = m.querySelector("button:not([disabled])");
    if (first) first.focus({ preventScroll: true });
    m.onkeydown = function (e) {
      var btns = Array.prototype.slice.call(m.querySelectorAll("button:not([disabled])"));
      var i = btns.indexOf(doc.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); btns[(i + 1) % btns.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); btns[(i - 1 + btns.length) % btns.length].focus(); }
      else if (e.key === "Escape") { e.preventDefault(); self.closeMenu(); self.grid.focus({ preventScroll: true }); }
    };
  };

  App.prototype.closeMenu = function () {
    if (this.menuEl.hidden) return;
    this.menuEl.hidden = true;
    this.menuEl.innerHTML = "";
  };

  App.prototype.menuAt = function (btn, items) {
    var rc = btn.getBoundingClientRect();
    this.openMenu(rc.left, rc.bottom + 4, items, rc);
  };

  App.prototype.palette = function (btn, key) {
    var self = this, rc = btn.getBoundingClientRect(), m = this.menuEl;
    m.innerHTML = "";
    var grid = h("div", "demo-sh__pal");
    PALETTE.forEach(function (p) {
      var b = h("button", "demo-sh__sw");
      b.type = "button";
      b.title = p[0];
      b.setAttribute("aria-label", p[0]);
      b.style.setProperty("--sw", p[1]);
      if (key === "fill") b.classList.add("demo-sh__sw--fill");
      b.addEventListener("click", function () { self.closeMenu(); var o = {}; o[key] = p[1]; self.applyFmt(o); });
      grid.appendChild(b);
    });
    m.appendChild(grid);
    var none = h("button", "demo-sh__mi", "<span>" + (key === "fill" ? "Без заливки" : "Цвет по умолчанию") + "</span>");
    none.type = "button";
    none.addEventListener("click", function () { self.closeMenu(); var o = {}; o[key] = null; self.applyFmt(o); });
    m.appendChild(none);
    m.hidden = false;
    m.classList.remove("demo-sh__menu--in");
    m.style.left = Math.max(8, Math.min(rc.left, root.innerWidth - (m.offsetWidth || 200) - 8)) + "px";
    m.style.top = (rc.bottom + 4) + "px";
    void m.offsetWidth;
    m.classList.add("demo-sh__menu--in");
  };

  App.prototype.tabMenu = function (i, rc) {
    var self = this, b = this.book;
    var items = [
      { label: "Переименовать", act: function () { self.renameTab(i); } },
      { label: "Создать копию", act: function () { b.duplicateSheet(i); self.switchSheet(b.active); } },
      { label: "Сдвинуть влево", disabled: i === 0, act: function () { b.moveSheet(i, i - 1); } },
      { label: "Сдвинуть вправо", disabled: i === b.sheets.length - 1, act: function () { b.moveSheet(i, i + 1); } },
      "-",
      { label: "Удалить лист", danger: true, disabled: b.sheets.length < 2, act: function () { self.confirmRemove(i); } }
    ];
    var x = rc.left, y = rc.top;
    this.openMenu(x, y, items, rc);
    var m = this.menuEl;
    m.style.top = Math.max(8, rc.top - m.offsetHeight - 6) + "px";
  };

  App.prototype.confirmRemove = function (i) {
    var self = this, name = this.book.sheets[i].name;
    this.modal("Удалить лист «" + name + "»?", "<p>Данные листа пропадут, а формулы на других листах, которые на него ссылаются, покажут #REF!. Отменить удаление нельзя.</p>", [
      { label: "Отмена" },
      { label: "Удалить", danger: true, act: function () { self.book.removeSheet(i); self.switchSheet(self.book.active, true); self.saveNow(); } }
    ]);
  };

  App.prototype.renameTab = function (i) {
    var self = this, b = this.book;
    this.commitEdit();
    if (i !== b.active) this.switchSheet(i);
    var tab = this.tabList.querySelector(".demo-sh__tab[data-i=\"" + i + "\"]");
    if (!tab) return;
    var name = tab.querySelector(".demo-sh__tabname");
    var inp = h("input", "demo-sh__tabinput");
    inp.value = b.sheets[i].name;
    inp.maxLength = 31;
    inp.setAttribute("aria-label", "Имя листа");
    name.replaceWith(inp);
    inp.focus();
    inp.select();
    var done = false;
    function finish(save) {
      if (done) return;
      done = true;
      if (save) {
        var res = b.renameSheet(i, inp.value);
        if (res === null) self.toast("Лист с таким именем уже есть");
      }
      self.renderTabs();
      self.refresh();
      self.grid.focus({ preventScroll: true });
    }
    inp.addEventListener("keydown", function (e) {
      e.stopPropagation();
      if (e.key === "Enter") { e.preventDefault(); finish(true); }
      else if (e.key === "Escape") { e.preventDefault(); finish(false); }
    });
    inp.addEventListener("blur", function () { finish(true); });
  };

  App.prototype.modal = function (title, body, buttons) {
    var self = this;
    var wrap = h("div", "demo-sh__modal");
    wrap.innerHTML = "<div class=\"demo-sh__dialog\" role=\"dialog\" aria-modal=\"true\" aria-label=\"" + esc(title) + "\"><h3 class=\"demo-sh__dtitle\">" + esc(title) + "</h3><div class=\"demo-sh__dbody\">" + body + "</div><div class=\"demo-sh__dbtns\"></div></div>";
    var box = wrap.querySelector(".demo-sh__dbtns");
    var prevFocus = doc.activeElement;
    function close() {
      wrap.classList.remove("demo-sh__modal--in");
      doc.removeEventListener("keydown", onKey, true);
      setTimeout(function () { wrap.remove(); }, 160);
      if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true });
      else self.grid.focus({ preventScroll: true });
    }
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
    }
    buttons.forEach(function (bt, idx) {
      var b = h("button", "demo-sh__dbtn" + (bt.primary ? " demo-sh__dbtn--primary" : "") + (bt.danger ? " demo-sh__dbtn--danger" : ""), esc(bt.label));
      b.type = "button";
      b.addEventListener("click", function () { close(); if (bt.act) bt.act(); });
      box.appendChild(b);
      if (idx === buttons.length - 1) setTimeout(function () { b.focus(); }, 30);
    });
    wrap.addEventListener("pointerdown", function (e) { if (e.target === wrap) close(); });
    doc.addEventListener("keydown", onKey, true);
    doc.body.appendChild(wrap);
    void wrap.offsetWidth;
    wrap.classList.add("demo-sh__modal--in");
  };

  App.prototype.toast = function (text) {
    var t = this.toastEl;
    t.textContent = text;
    t.classList.add("demo-sh__toast--on");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(function () { t.classList.remove("demo-sh__toast--on"); }, 3200);
  };

  App.prototype.applyFmt = function (patch) {
    var g = this.range();
    this.commitEdit();
    this.book.op(function () { this.setFmt(g, patch); });
  };

  App.prototype.toggleFmt = function (key) {
    var f = this.book.fmt(this.sel.r, this.sel.c) || {}, o = {};
    o[key] = !f[key];
    this.applyFmt(o);
  };

  App.prototype.changeDec = function (delta) {
    var b = this.book, s = this.sel, f = b.fmt(s.r, s.c) || {};
    var v = b.value(s.r, s.c);
    var cur = typeof f.dec === "number" ? f.dec : null;
    if (cur == null) {
      var kind = resolveKind(f, typeof v === "number" ? b.dtype(s.r, s.c) : null, b.raw(s.r, s.c));
      if (kind === "num" || kind === "usd" || kind === "eur") cur = 2;
      else if (kind === "int") cur = 0;
      else if (kind === "rub") cur = typeof v === "number" && !Number.isInteger(v) ? 2 : 0;
      else if (kind === "pct") cur = typeof v === "number" ? Math.min(autoDigits(v * 100), 2) : 0;
      else cur = typeof v === "number" ? Math.min(autoDigits(v), 10) : 0;
    }
    var patch = { dec: clamp(cur + delta, 0, 10) };
    if (f.nf === "int") patch.nf = "num";
    if (patch.dec === 0) patch.dec = 0;
    var g = this.range();
    this.commitEdit();
    this.book.op(function () {
      this.setFmt(g, { nf: patch.nf });
      var sh = this.cur(), cg = this.clip(g, sh);
      for (var r = cg.r0; r <= cg.r1; r++) for (var c = cg.c0; c <= cg.c1; c++) {
        var k = r + ":" + c, ff = sh.fmt[k] || {};
        ff.dec = patch.dec;
        sh.fmt[k] = ff;
      }
    });
  };

  App.prototype.sortCmd = function (asc) {
    var b = this.book, g = this.range(), s = this.sel, header = false;
    this.commitEdit();
    var single = g.r0 === g.r1 && g.c0 === g.c1;
    var sh = b.cur();
    var wholeCol = g.r0 === 0 && g.r1 >= sh.rows - 1;
    if (single || wholeCol) {
      if (b.isEmpty(s.r, s.c) && single) { this.toast("Встаньте в таблицу с данными, чтобы отсортировать ее"); return; }
      var reg = b.region(s.r, s.c);
      if (wholeCol) reg = b.region(Math.max(0, Math.min(reg.r0, b.dims().height - 1)), s.c);
      g = reg;
      header = b.hasHeader(g);
    }
    if (g.r1 - g.r0 < (header ? 2 : 1)) { this.toast("Сортировать нечего: в диапазоне одна строка"); return; }
    var col = clamp(s.c, g.c0, g.c1);
    b.op(function () { this.sort(g, col, asc, header); });
    this.select(g.r0, g.c0, g.r1, g.c1, true);
    this.sel.r = g.r0; this.sel.c = col;
    this.renderOverlay();
    this.toast("Отсортировано по столбцу " + colName(col) + (header ? ", заголовок на месте" : ""));
  };

  App.prototype.autoSum = function () {
    var b = this.book, s = this.sel, sh = b.cur(), g = this.range();
    this.commitEdit();
    if (g.r0 !== g.r1 || g.c0 !== g.c1) {
      var list = [];
      var u = b.used(g, sh);
      if (u.r1 < g.r0) { this.toast("В выделении нет чисел"); return; }
      var tr = u.r1 + 1;
      for (var c = g.c0; c <= Math.min(g.c1, u.c1); c++) list.push({ r: tr, c: c, raw: "=SUM(" + addr(g.r0, c) + ":" + addr(u.r1, c) + ")" });
      b.op(function () { this.setCells(list); });
      this.select(tr, g.c0, tr, Math.min(g.c1, u.c1));
      return;
    }
    var r = s.r - 1, top = -1;
    while (r >= 0 && typeof b.value(r, s.c) !== "number") { if (!b.isEmpty(r, s.c)) break; r--; }
    while (r >= 0 && typeof b.value(r, s.c) === "number") { top = r; r--; }
    var text;
    if (top >= 0) {
      var bottom = top;
      while (bottom + 1 < s.r && typeof b.value(bottom + 1, s.c) === "number") bottom++;
      text = "=SUM(" + addr(top, s.c) + ":" + addr(bottom, s.c) + ")";
    } else {
      var cc = s.c - 1, left = -1;
      while (cc >= 0 && typeof b.value(s.r, cc) === "number") { left = cc; cc--; }
      text = left >= 0 ? "=SUM(" + addr(s.r, left) + ":" + addr(s.r, s.c - 1) + ")" : "=SUM()";
    }
    this.startEdit(text, "edit");
    if (text === "=SUM()") {
      try { this.ed.setSelectionRange(5, 5); } catch (e) {}
      this.edit.ins = null;
    }
    this.onEditInput(this.ed, true);
  };

  App.prototype.command = function (cmd, btn) {
    var self = this;
    switch (cmd) {
      case "undo": this.commitEdit(); this.book.undo(); break;
      case "redo": this.commitEdit(); this.book.redo(); break;
      case "bold": this.toggleFmt("b"); break;
      case "italic": this.toggleFmt("i"); break;
      case "underline": this.toggleFmt("u"); break;
      case "strike": this.toggleFmt("s"); break;
      case "alignL": case "alignC": case "alignR": {
        var a = cmd.slice(-1).toLowerCase(), f = this.book.fmt(this.sel.r, this.sel.c) || {};
        this.applyFmt({ align: f.align === a ? null : a });
        break;
      }
      case "decMinus": this.changeDec(-1); break;
      case "decPlus": this.changeDec(1); break;
      case "color": this.palette(btn, "color"); return;
      case "fill": this.palette(btn, "fill"); return;
      case "clear": { var g = this.range(); this.commitEdit(); this.book.op(function () { this.clearFmt(g); }); break; }
      case "sortAsc": this.sortCmd(true); break;
      case "sortDesc": this.sortCmd(false); break;
      case "sum": this.autoSum(); return;
      case "import": this.fileInput.click(); return;
      case "export":
        this.menuAt(btn, [
          { label: "CSV — текущий лист", act: function () { self.exportCSV(); } },
          { label: "Excel (.xlsx) — вся книга", act: function () { self.exportXLSX(); } }
        ]);
        return;
      case "new": this.newBook(); return;
      case "help": this.help(); return;
      case "full": this.toggleFull(); break;
    }
    if (!this.edit) this.grid.focus({ preventScroll: true });
  };

  App.prototype.toggleFull = function (force) {
    var on = force != null ? force : !this.app.classList.contains("demo-sh__app--full");
    this.app.classList.toggle("demo-sh__app--full", on);
    this.win = null;
    this.render();
    this.renderBars();
  };

  App.prototype.newBook = function () {
    var self = this;
    this.commitEdit();
    this.modal("Новая книга", "<p>Текущая книга будет заменена. Если она нужна, сначала скачайте ее в Excel или CSV.</p>", [
      { label: "Отмена" },
      { label: "Открыть пример", act: function () { self.book.load(sampleBook()); self.switchSheet(0, true); self.saveNow(); } },
      { label: "Пустая книга", primary: true, act: function () { self.book.load({ sheets: [{ name: "Лист 1" }] }); self.switchSheet(0, true); self.saveNow(); } }
    ]);
  };

  App.prototype.help = function () {
    var k = this.mod;
    var rows = [
      ["Стрелки", "переход по ячейкам; с Shift — выделение"],
      [k + "стрелка", "к краю данных"],
      ["Enter, Tab", "ввод и переход вниз или вправо"],
      ["F2 или двойной клик", "правка ячейки"],
      ["Esc", "отмена правки"],
      ["Delete", "очистить выделение"],
      [k + "Enter", "записать значение во все выделенные ячейки"],
      [k + "Z, " + k + (isMac() ? "⇧Z" : "Y"), "отменить и повторить"],
      [k + "C, " + k + "X, " + k + "V", "копировать, вырезать, вставить; работает и с Excel"],
      [k + "B, " + k + "I, " + k + "U", "полужирный, курсив, подчеркивание"],
      ["Alt+=", "автосумма"],
      [k + "A", "выделить все"]
    ].map(function (r) { return "<tr><td><kbd>" + esc(r[0]) + "</kbd></td><td>" + esc(r[1]) + "</td></tr>"; }).join("");
    var body = "<table class=\"demo-sh__keys\">" + rows + "</table>" +
      "<p>Формула начинается со знака =. Работают почти 400 функций Excel: SUM, AVERAGE, IF, VLOOKUP, XLOOKUP, SUMIF, TEXT и другие. Русские имена тоже понимаются: =СУММ(A1:A5) станет =SUM(A1:A5). Аргументы можно разделять запятой или точкой с запятой.</p>" +
      "<p>Пока правите формулу, кликните по ячейке или протяните мышью по диапазону, и ссылка встанет в формулу. Ссылка на другой лист: =\u2019Курсы\u2019!B2. Квадратик в углу выделения тянется, чтобы заполнить соседние ячейки: формулы сдвигаются, числа продолжают ряд.</p>";
    body = body.replace(/\u2019/g, "'");
    this.modal("Клавиши и формулы", body, [{ label: "Понятно", primary: true }]);
  };

  App.prototype.startEdit = function (initial, mode, bar) {
    if (this.edit) return;
    var b = this.book, s = this.sel, sh = b.cur();
    var orig = editText(b.raw(s.r, s.c, sh));
    var text = initial != null ? initial : orig;
    this.edit = { range: this.range(), r: s.r, c: s.c, uid: sh.uid, input: bar ? this.fx : this.ed, typed: mode === "type", orig: orig, ins: null, refs: null, formula: text.charAt(0) === "=" };
    this.ed.value = text;
    this.fx.value = text;
    this.placeEditor();
    this.ed.classList.add("demo-sh__editor--on");
    var f = b.fmt(s.r, s.c, sh) || {};
    this.ed.classList.toggle("demo-sh__c--b", !!f.b);
    this.ed.classList.toggle("demo-sh__c--i", !!f.i);
    this.ed.style.textAlign = f.align === "c" ? "center" : f.align === "r" ? "right" : "left";
    this.ensureVisible(s.r, s.c);
    var inp = this.edit.input;
    inp.focus({ preventScroll: true });
    try { inp.setSelectionRange(text.length, text.length); } catch (e) {}
    this.app.classList.add("demo-sh__app--editing");
    this.updateRefs();
    this.renderOverlay();
    this.renderBars();
    this.updateAC();
  };

  App.prototype.placeEditor = function () {
    var e = this.edit;
    if (!e) return;
    var a = this.lefts, ed = this.ed;
    var w0 = a[e.c + 1] - a[e.c];
    var need = textWidth(ed.value || "", false) + 24;
    var maxW = Math.max(w0, Math.min(560, (this.grid.clientWidth || 800) - RHW - (a[e.c] - this.grid.scrollLeft) - 8));
    ed.style.left = a[e.c] + "px";
    ed.style.top = (e.r * ROWH) + "px";
    ed.style.width = Math.max(w0, Math.min(need, maxW)) + 1 + "px";
    ed.style.height = (ROWH + 1) + "px";
  };

  App.prototype.onEditInput = function (inp, programmatic) {
    var e = this.edit;
    if (!e) return;
    if (!programmatic) e.ins = null;
    var other = inp === this.ed ? this.fx : this.ed;
    other.value = inp.value;
    e.formula = inp.value.charAt(0) === "=";
    if (inp === this.fx && this.book.cur().uid === e.uid) this.ed.classList.add("demo-sh__editor--on");
    this.placeEditor();
    this.updateRefs();
    this.renderOverlay();
    this.updateAC();
  };

  App.prototype.updateRefs = function () {
    var e = this.edit;
    if (!e) return;
    e.refs = null;
    var v = this.edit.input.value;
    if (v.charAt(0) !== "=") return;
    var colors = ["#3e63dd", "#e5484d", "#30a46c", "#8e4ec6", "#f76b15", "#12a594", "#d6409f"];
    var re = /(?:'((?:[^']|'')+)'!|([A-Za-z0-9_.\u0400-\u04ff]+)!)?(\$?[A-Za-z]{1,3}\$?\d+(?::\$?[A-Za-z]{1,3}\$?\d+)?)(?![A-Za-z0-9_(])/g;
    var m, refs = [], idx = 0, b = this.book;
    var strMask = v.replace(/"(?:[^"]|"")*"/g, function (s) { return new Array(s.length + 1).join(" "); });
    while ((m = re.exec(strMask))) {
      var prev = m.index > 0 ? strMask.charAt(m.index - 1) : "";
      if (/[A-Za-z0-9_.$]/.test(prev)) continue;
      var g = parseRange(m[3].replace(/\$/g, ""));
      if (!g) continue;
      var uid = e.uid, name = m[1] ? m[1].replace(/''/g, "'") : m[2];
      if (name) {
        var found = null;
        b.sheets.forEach(function (s) { if (s.name.toLowerCase() === name.toLowerCase()) found = s; });
        if (!found) continue;
        uid = found.uid;
      }
      refs.push({ g: g, uid: uid, color: colors[idx++ % colors.length] });
    }
    e.refs = refs;
  };

  App.prototype.canInsertRef = function () {
    var e = this.edit;
    if (!e) return false;
    var inp = e.input, v = inp.value;
    if (v.charAt(0) !== "=") return false;
    var pos = inp.selectionStart == null ? v.length : inp.selectionStart;
    if (e.ins && pos === e.ins.end) return true;
    var before = v.slice(0, pos);
    if ((before.split("\"").length - 1) % 2) return false;
    var prev = before.replace(/\s+$/, "").slice(-1);
    return /[=(,;+\-*\/&<>^:]/.test(prev);
  };

  App.prototype.insertRef = function (g) {
    var e = this.edit;
    if (!e) return;
    var sh = this.book.cur(), inp = e.input, v = inp.value;
    var text = rangeName(g);
    if (sh.uid !== e.uid) text = quoteSheet(sh.name) + "!" + text;
    var s = e.ins ? e.ins.start : (inp.selectionStart == null ? v.length : inp.selectionStart);
    var en = e.ins ? e.ins.end : (inp.selectionEnd == null ? v.length : inp.selectionEnd);
    inp.value = v.slice(0, s) + text + v.slice(en);
    e.ins = { start: s, end: s + text.length };
    try { inp.setSelectionRange(e.ins.end, e.ins.end); } catch (err) {}
    this.onEditInput(inp, true);
    this.hideAC();
  };

  App.prototype.onEditBlur = function () {
    var self = this;
    setTimeout(function () {
      if (!self.edit) return;
      var a = doc.activeElement;
      if (a === self.ed || a === self.fx) return;
      if (self.drag && self.drag.kind === "ref") return;
      if (a && (self.menuEl.contains(a) || self.acEl.contains(a))) return;
      if (a && a.closest && a.closest(".demo-sh__tabs")) return;
      if (a === self.grid || (a && self.app.contains(a))) { self.commitEdit(null, true); return; }
      self.commitEdit(null, true);
    }, 0);
  };

  App.prototype.commitEdit = function (move, noFocus, all) {
    var e = this.edit, b = this.book;
    if (!e) return;
    var text = e.input.value;
    this.edit = null;
    this.hideAC();
    this.ed.classList.remove("demo-sh__editor--on");
    this.app.classList.remove("demo-sh__app--editing");
    if (b.cur().uid !== e.uid) {
      var idx = b.indexOfUid(e.uid);
      if (idx >= 0) this.switchSheet(idx);
    }
    var range = all ? e.range : null;
    this.sel = range ? { r: e.r, c: e.c, er: range.r1 === e.r ? range.r0 : range.r1, ec: range.c1 === e.c ? range.c0 : range.c1 } : { r: e.r, c: e.c, er: e.r, ec: e.c };
    if (text !== e.orig || (all && range)) {
      var raw = normalizeInput(text);
      var f = b.fmt(e.r, e.c);
      if (f && f.nf === "text" && raw && raw.charAt(0) !== "=" && raw.charAt(0) !== "'") raw = "'" + text;
      var list = [];
      if (range && (range.r0 !== range.r1 || range.c0 !== range.c1)) {
        for (var r = range.r0; r <= range.r1; r++) for (var c = range.c0; c <= range.c1; c++) {
          list.push({ r: r, c: c, raw: raw.charAt(0) === "=" ? shiftFormula(raw, r - e.r, c - e.c) : raw });
        }
      } else {
        list.push({ r: e.r, c: e.c, raw: raw });
      }
      var failed = b.op(function () { return this.setCells(list); });
      if (failed) this.toast("Ячейка занята результатом формулы-массива");
      var v = b.value(e.r, e.c);
      if (raw.charAt(0) === "=" && v && typeof v === "object" && v.type === "ERROR") this.toast("В формуле ошибка: проверьте скобки, кавычки и разделители");
    } else {
      this.render();
    }
    if (!noFocus) this.grid.focus({ preventScroll: true });
    if (move) this.move(move[0], move[1], false, false);
    else { this.render(); this.renderBars(); }
  };

  App.prototype.cancelEdit = function () {
    var e = this.edit;
    if (!e) return;
    this.edit = null;
    this.hideAC();
    this.ed.classList.remove("demo-sh__editor--on");
    this.app.classList.remove("demo-sh__app--editing");
    if (this.book.cur().uid !== e.uid) {
      var idx = this.book.indexOfUid(e.uid);
      if (idx >= 0) this.switchSheet(idx);
    }
    this.sel = { r: e.r, c: e.c, er: e.r, ec: e.c };
    this.grid.focus({ preventScroll: true });
    this.render();
    this.renderBars();
  };

  App.prototype.onEditKey = function (ev, inp) {
    var e = this.edit;
    if (!e) {
      if (inp === this.fx && ev.key === "Enter") { ev.preventDefault(); this.grid.focus({ preventScroll: true }); }
      return;
    }
    var acOpen = !this.acEl.hidden && this.acItems.length;
    if (acOpen) {
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        ev.preventDefault();
        this.acIdx = (this.acIdx + (ev.key === "ArrowDown" ? 1 : -1) + this.acItems.length) % this.acItems.length;
        this.renderAC();
        return;
      }
      if (ev.key === "Tab" || (ev.key === "Enter" && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey)) {
        ev.preventDefault();
        this.acceptAC(this.acIdx);
        return;
      }
      if (ev.key === "Escape") { ev.preventDefault(); this.hideAC(); return; }
    }
    var mod = ev.ctrlKey || ev.metaKey;
    if (ev.key === "Enter") {
      ev.preventDefault();
      if (mod) { this.commitEdit(null, false, true); return; }
      this.commitEdit(ev.shiftKey ? [-1, 0] : [1, 0]);
      return;
    }
    if (ev.key === "Tab") {
      ev.preventDefault();
      this.commitEdit(ev.shiftKey ? [0, -1] : [0, 1]);
      return;
    }
    if (ev.key === "Escape") {
      ev.preventDefault();
      this.cancelEdit();
      return;
    }
    if (e.typed && !e.formula && inp === this.ed && !ev.shiftKey && !mod) {
      var mv = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[ev.key];
      if (mv) { ev.preventDefault(); this.commitEdit(mv); return; }
    }
    if (ev.key === "F4" && e.formula) {
      ev.preventDefault();
      this.cycleAbs(inp);
    }
  };

  App.prototype.cycleAbs = function (inp) {
    var v = inp.value, pos = inp.selectionStart;
    var re = /\$?[A-Za-z]{1,3}\$?\d+/g, m;
    while ((m = re.exec(v))) {
      if (pos >= m.index && pos <= m.index + m[0].length) {
        var p = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)$/.exec(m[0]);
        var order = ["--", "$$", "-$", "$-"];
        var cur = order.indexOf((p[1] ? "$" : "-") + (p[3] ? "$" : "-"));
        var nx = order[(cur + 1) % order.length];
        var rep = (nx.charAt(0) === "$" ? "$" : "") + p[2] + (nx.charAt(1) === "$" ? "$" : "") + p[4];
        inp.value = v.slice(0, m.index) + rep + v.slice(m.index + m[0].length);
        var np = m.index + rep.length;
        try { inp.setSelectionRange(np, np); } catch (err) {}
        this.onEditInput(inp, true);
        return;
      }
    }
  };

  App.prototype.updateAC = function () {
    var e = this.edit;
    if (!e) { this.hideAC(); return; }
    var inp = e.input, v = inp.value, pos = inp.selectionStart == null ? v.length : inp.selectionStart;
    if (v.charAt(0) !== "=") { this.hideAC(); return; }
    var before = v.slice(0, pos);
    if ((before.split("\"").length - 1) % 2) { this.hideAC(); return; }
    var m = /([A-Za-z\u0400-\u04ff][A-Za-z0-9_.\u0400-\u04ff]*)$/.exec(before);
    if (!m) { this.hideAC(); return; }
    var prev = m.index > 0 ? before.charAt(m.index - 1) : "";
    if (/[A-Za-z0-9_.$!']/.test(prev)) { this.hideAC(); return; }
    var tok = m[1].toUpperCase().replace(/\u0401/g, "Е");
    if (/^[A-Z]{1,3}\d+$/.test(tok)) { this.hideAC(); return; }
    var list = this.fnList.filter(function (f) { return f.name.indexOf(tok) === 0 || (f.ru && f.ru.indexOf(tok) === 0); }).slice(0, 8);
    if (!list.length || (list.length === 1 && list[0].name === tok && v.charAt(pos) === "(")) { this.hideAC(); return; }
    this.acItems = list;
    this.acTok = { start: m.index, end: pos };
    this.acIdx = 0;
    this.renderAC();
  };

  App.prototype.renderAC = function () {
    var self = this, el = this.acEl;
    el.innerHTML = this.acItems.map(function (f, i) {
      return "<div class=\"demo-sh__aci" + (i === self.acIdx ? " demo-sh__aci--on" : "") + "\" role=\"option\" data-i=\"" + i + "\"><b>" + esc(f.name) + "</b>" + (f.ru ? "<span class=\"demo-sh__acru\">" + esc(f.ru) + "</span>" : "") + (f.desc ? "<small>" + esc(f.desc) + "</small>" : "") + "</div>";
    }).join("") + (this.acItems[this.acIdx] ? "<div class=\"demo-sh__acsig\">" + esc(this.acItems[this.acIdx].sig) + "</div>" : "");
    el.hidden = false;
    el.onmousedown = function (ev) {
      ev.preventDefault();
      var it = ev.target.closest(".demo-sh__aci");
      if (it) self.acceptAC(+it.getAttribute("data-i"));
    };
    this.positionAC();
  };

  App.prototype.positionAC = function () {
    if (this.acEl.hidden || !this.edit) return;
    var rc = this.edit.input.getBoundingClientRect();
    var el = this.acEl, vh = root.innerHeight;
    var top = rc.bottom + 4, mh = el.offsetHeight || 240;
    if (top + mh > vh - 8 && rc.top - mh - 4 > 8) top = rc.top - mh - 4;
    el.style.left = Math.max(8, Math.min(rc.left, root.innerWidth - (el.offsetWidth || 300) - 8)) + "px";
    el.style.top = top + "px";
  };

  App.prototype.acceptAC = function (i) {
    var e = this.edit, f = this.acItems[i];
    if (!e || !f) return;
    var inp = e.input, v = inp.value, t = this.acTok;
    var after = v.slice(t.end);
    var ins = f.name + (after.charAt(0) === "(" ? "" : "(");
    inp.value = v.slice(0, t.start) + ins + after;
    var p = t.start + ins.length + (after.charAt(0) === "(" ? 1 : 0);
    try { inp.setSelectionRange(p, p); } catch (err) {}
    this.hideAC();
    this.onEditInput(inp, true);
    e.ins = null;
    this.hideAC();
  };

  App.prototype.hideAC = function () {
    this.acEl.hidden = true;
    this.acItems = [];
  };

  App.prototype.onKey = function (e) {
    if (e.target !== this.grid) return;
    if (this.edit) return;
    var mod = e.ctrlKey || e.metaKey, k = e.key, s = this.sel, sh = this.book.cur();
    var arrows = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (arrows[k]) {
      e.preventDefault();
      this.clipMarqueeKeep = true;
      this.move(arrows[k][0], arrows[k][1], e.shiftKey, mod);
      return;
    }
    if (mod && !e.altKey) {
      var lk = k.toLowerCase();
      if (lk === "z" || lk === "я") { e.preventDefault(); if (e.shiftKey) this.book.redo(); else this.book.undo(); return; }
      if (lk === "y" || lk === "н") { e.preventDefault(); this.book.redo(); return; }
      if (lk === "b" || lk === "и") { e.preventDefault(); this.toggleFmt("b"); return; }
      if (lk === "i" || lk === "ш") { e.preventDefault(); this.toggleFmt("i"); return; }
      if (lk === "u" || lk === "г") { e.preventDefault(); this.toggleFmt("u"); return; }
      if (lk === "a" || lk === "ф") { e.preventDefault(); this.select(0, 0, sh.rows - 1, sh.cols - 1, true); return; }
      if (k === "Home") { e.preventDefault(); this.select(0, 0); return; }
      if (k === "End") { e.preventDefault(); var d = this.book.dims(); this.select(Math.max(0, d.height - 1), Math.max(0, d.width - 1)); return; }
      if (k === "Enter") { e.preventDefault(); this.startEdit(null, "edit"); return; }
      return;
    }
    if (e.altKey && (k === "=" || e.code === "Equal")) { e.preventDefault(); this.autoSum(); return; }
    switch (k) {
      case "Enter": e.preventDefault(); this.move(e.shiftKey ? -1 : 1, 0); return;
      case "Tab": e.preventDefault(); this.move(0, e.shiftKey ? -1 : 1); return;
      case "F2": e.preventDefault(); this.startEdit(null, "edit"); return;
      case "Delete": case "Backspace": {
        e.preventDefault();
        var g = this.range();
        if (k === "Backspace" && g.r0 === g.r1 && g.c0 === g.c1) { this.startEdit("", "type"); return; }
        this.book.op(function () { this.clearValues(g); });
        return;
      }
      case "Escape":
        if (this.app.classList.contains("demo-sh__app--full")) { e.preventDefault(); this.toggleFull(false); return; }
        if (this.clip) { this.clip = null; this.renderOverlay(); }
        return;
      case "Home": e.preventDefault(); this.select(s.r, 0); return;
      case "PageDown": case "PageUp": {
        e.preventDefault();
        var n = Math.max(1, Math.floor((this.grid.clientHeight - HEADH) / ROWH) - 1) * (k === "PageDown" ? 1 : -1);
        this.grid.scrollTop += n * ROWH;
        this.move(n, 0, e.shiftKey);
        return;
      }
    }
    if (k === "Process" || k === "Unidentified") { this.startEdit("", "type"); return; }
    if (k.length === 1 && !e.altKey) {
      e.preventDefault();
      this.startEdit(k, "type");
    }
  };

  App.prototype.selectionText = function (g) {
    var b = this.book, sh = b.cur(), u = b.used(g, sh), rows = [];
    for (var r = g.r0; r <= Math.max(u.r1, g.r0); r++) {
      var row = [];
      for (var c = g.c0; c <= Math.max(u.c1, g.c0); c++) {
        var v = b.value(r, c, sh), f = sh.fmt[r + ":" + c];
        var type = typeof v === "number" ? b.dtype(r, c, sh) : null;
        row.push(formatCell(v, type, f, type === "NUMBER_CURRENCY" ? b.raw(r, c, sh) : null).text);
      }
      rows.push(row);
    }
    return { text: toCSV(rows, "\t"), g: { r0: g.r0, c0: g.c0, r1: Math.max(u.r1, g.r0), c1: Math.max(u.c1, g.c0) } };
  };

  App.prototype.doCopy = function (e, cut) {
    var x = this.selectionText(this.range());
    if (e && e.clipboardData) {
      e.clipboardData.setData("text/plain", x.text);
      e.preventDefault();
    }
    this.clip = { uid: this.book.cur().uid, g: x.g, cut: cut, text: x.text };
    this.renderOverlay();
    return x.text;
  };

  App.prototype.pasteText = function (text) {
    var b = this.book, g = this.range(), clip = this.clip, self = this;
    if (clip && text != null && text.replace(/\r/g, "") === clip.text.replace(/\r/g, "")) {
      var h0 = clip.g.r1 - clip.g.r0 + 1, w0 = clip.g.c1 - clip.g.c0 + 1;
      var single = h0 === 1 && w0 === 1;
      var ok = b.op(function () {
        if (single && !clip.cut && (g.r0 !== g.r1 || g.c0 !== g.c1)) {
          var cg = this.clip(g);
          for (var r = cg.r0; r <= cg.r1; r++) for (var c = cg.c0; c <= cg.c1; c++) this.copyPaste(clip.uid, clip.g, r, c, false);
          return true;
        }
        return this.copyPaste(clip.uid, clip.g, g.r0, g.c0, clip.cut);
      }, true);
      if (!ok) this.toast("Сюда вставить нельзя: мешает формула-массив или граница листа");
      if (clip.cut) this.clip = null;
      if (!(single && (g.r0 !== g.r1 || g.c0 !== g.c1))) this.select(g.r0, g.c0, g.r0 + h0 - 1, g.c0 + w0 - 1, true);
      else this.renderOverlay();
      return;
    }
    if (!text) return;
    var rows = parseCSV(text.replace(/\r?\n$/, ""), "\t");
    if (!rows.length) return;
    var maxW = 0;
    rows.forEach(function (r) { maxW = Math.max(maxW, r.length); });
    b.op(function () { this.pasteMatrix(g.r0, g.c0, rows); });
    this.clip = null;
    self.select(g.r0, g.c0, Math.min(g.r0 + rows.length - 1, MAX_ROWS - 1), Math.min(g.c0 + maxW - 1, MAX_COLS - 1), true);
  };

  App.prototype.doPaste = function (e) {
    var text = e.clipboardData ? e.clipboardData.getData("text/plain") : "";
    e.preventDefault();
    this.pasteText(text);
  };

  App.prototype.clipboardAction = function (kind) {
    var self = this, nav = root.navigator;
    if (kind === "copy" || kind === "cut") {
      var text = this.doCopy(null, kind === "cut");
      if (nav.clipboard && nav.clipboard.writeText) nav.clipboard.writeText(text).catch(function () {});
      this.grid.focus({ preventScroll: true });
      return;
    }
    if (nav.clipboard && nav.clipboard.readText) {
      nav.clipboard.readText().then(function (t) { self.pasteText(t); }, function () {
        if (self.clip) self.pasteText(self.clip.text);
        else self.toast("Браузер не дал прочитать буфер. Нажмите " + self.mod + "V");
      });
    } else if (this.clip) {
      this.pasteText(this.clip.text);
    } else {
      this.toast("Нажмите " + this.mod + "V, чтобы вставить");
    }
    this.grid.focus({ preventScroll: true });
  };

  App.prototype.download = function (blob, name) {
    var url = URL.createObjectURL(blob);
    var a = doc.createElement("a");
    a.href = url;
    a.download = name;
    doc.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  };

  App.prototype.fileName = function (ext) {
    var n = this.book.cur().name.replace(/[\\\/:*?"<>|]+/g, " ").trim() || "\u0422\u0430\u0431\u043b\u0438\u0446\u0430";
    return n + "." + ext;
  };

  App.prototype.exportCSV = function () {
    this.commitEdit();
    var b = this.book, d = b.dims();
    if (!d.height) { this.toast("Лист пуст, скачивать нечего"); return; }
    var x = this.selectionText({ r0: 0, c0: 0, r1: d.height - 1, c1: d.width - 1 });
    var rows = parseCSV(x.text, "\t");
    var csv = "\ufeff" + toCSV(rows, ";");
    this.download(new Blob([csv], { type: "text/csv;charset=utf-8" }), this.fileName("csv"));
    this.toast("CSV скачан: разделитель точка с запятой, открывается в Excel");
  };

  App.prototype.withXLSX = function () {
    if (root.XLSX) return Promise.resolve(root.XLSX);
    this.toast("Загружаем модуль Excel…");
    return loadScript(XLSX_URL).then(function () { return root.XLSX; });
  };

  function excelFmt(f, type) {
    var kind = resolveKind(f, type, "");
    var dec = f && typeof f.dec === "number" ? f.dec : null;
    function frac(n) { return n > 0 ? "." + new Array(n + 1).join("0") : ""; }
    switch (kind) {
      case "num": return "#,##0" + frac(dec == null ? 2 : dec);
      case "int": return "#,##0";
      case "pct": return "0" + frac(dec == null ? 0 : dec) + "%";
      case "rub": return "#,##0" + frac(dec == null ? 2 : dec) + " \"₽\"";
      case "usd": return "\"$\"#,##0" + frac(dec == null ? 2 : dec);
      case "eur": return "#,##0" + frac(dec == null ? 2 : dec) + " \"€\"";
      case "date": return "dd.mm.yyyy";
      case "datetime": return "dd.mm.yyyy hh:mm";
      case "time": return "hh:mm";
      default: return dec != null ? "0" + frac(dec) : null;
    }
  }

  App.prototype.exportXLSX = function () {
    var self = this, b = this.book;
    this.commitEdit();
    this.withXLSX().then(function (X) {
      var wb = X.utils.book_new();
      b.sheets.forEach(function (sh) {
        var d = b.dims(sh), ws = {};
        for (var r = 0; r < d.height; r++) {
          for (var c = 0; c < d.width; c++) {
            var raw = b.raw(r, c, sh);
            var v = b.value(r, c, sh);
            if (raw === "" && (v === null || v === undefined)) continue;
            var f = sh.fmt[r + ":" + c], cell;
            var type = typeof v === "number" ? b.dtype(r, c, sh) : null;
            if (typeof v === "number") cell = { t: "n", v: v };
            else if (typeof v === "boolean") cell = { t: "b", v: v };
            else if (v && typeof v === "object") cell = { t: "e", v: 7, w: v.value };
            else cell = { t: "s", v: v == null ? "" : String(v) };
            if (raw.charAt(0) === "=") cell.f = raw.slice(1).replace(/\b(TRUE|FALSE)\(\)/g, "$1");
            var z = typeof v === "number" ? excelFmt(f, type) : null;
            if (z) cell.z = z;
            ws[X.utils.encode_cell({ r: r, c: c })] = cell;
          }
        }
        ws["!ref"] = X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, d.height - 1), c: Math.max(0, d.width - 1) } });
        var cols = [];
        for (var k = 0; k < Math.max(d.width, 1); k++) cols.push({ wpx: sh.colW[k] || DEFW });
        ws["!cols"] = cols;
        X.utils.book_append_sheet(wb, ws, sh.name);
      });
      var out = X.write(wb, { bookType: "xlsx", type: "array" });
      var name = (b.sheets[0] ? b.sheets[0].name : "Таблица").replace(/[\\\/:*?"<>|]+/g, " ").trim() || "\u0422\u0430\u0431\u043b\u0438\u0446\u0430";
      self.download(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), name + ".xlsx");
      self.toast("Книга скачана в Excel: " + b.sheets.length + " " + plural(b.sheets.length, "лист", "листа", "листов"));
    }).catch(function () {
      self.toast("Не удалось загрузить модуль Excel. Проверьте сеть или скачайте CSV");
    });
  };

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  }

  App.prototype.importFile = function (file) {
    var self = this, name = file.name || "Файл", base = name.replace(/\.[^.]+$/, "");
    this.commitEdit();
    if (file.size > 15 * 1024 * 1024) { this.toast("Файл больше 15 МБ: такой лучше открыть в Excel"); return; }
    if (/\.(xlsx|xls|ods)$/i.test(name)) {
      file.arrayBuffer().then(function (buf) {
        return self.withXLSX().then(function (X) { self.importWorkbook(X, buf, base); });
      }).catch(function () { self.toast("Не получилось прочитать файл Excel"); });
      return;
    }
    file.arrayBuffer().then(function (buf) {
      var text = new TextDecoder("utf-8").decode(buf);
      if (text.indexOf("�") >= 0) {
        try { text = new TextDecoder("windows-1251").decode(buf); } catch (e) {}
      }
      var rows = parseCSV(text, /\.tsv$/i.test(name) ? "\t" : null);
      if (!rows.length) { self.toast("Файл пустой"); return; }
      var cut = rows.length > MAX_ROWS;
      rows = rows.slice(0, MAX_ROWS).map(function (r) {
        return r.slice(0, MAX_COLS).map(function (v) {
          var n = normalizeInput(v);
          return n.charAt(0) === "=" ? "'" + v : n;
        });
      });
      self.book.addSheet(self.book.uniqueName(base), { data: rows });
      self.switchSheet(self.book.active);
      self.toast("Открыт «" + name + "»: " + rows.length + " " + plural(rows.length, "строка", "строки", "строк") + (cut ? ", остальное не влезло" : ""));
    }).catch(function () { self.toast("Не получилось прочитать файл"); });
  };

  App.prototype.importWorkbook = function (X, buf, base) {
    var wb = X.read(buf, { type: "array", cellFormula: true, cellNF: true, cellDates: false });
    var b = this.book, first = -1, count = 0;
    var names = {};
    wb.SheetNames.forEach(function (sn) { names[sn] = b.uniqueName(sn); });
    var created = [];
    wb.SheetNames.forEach(function (sn) {
      var ws = wb.Sheets[sn];
      if (!ws || !ws["!ref"]) return;
      var rg = X.utils.decode_range(ws["!ref"]);
      var data = [], fmt = {}, colW = {};
      var r1 = Math.min(rg.e.r, MAX_ROWS - 1), c1 = Math.min(rg.e.c, MAX_COLS - 1);
      for (var r = 0; r <= r1; r++) {
        var row = [];
        for (var c = 0; c <= c1; c++) {
          var cell = ws[X.utils.encode_cell({ r: r, c: c })], raw = null;
          if (cell) {
            if (cell.f) {
              raw = normalizeFormula("=" + String(cell.f).replace(/_xlfn\.|_xlws\./g, ""));
            } else if (cell.t === "n") {
              raw = String(cell.v);
              var z = cell.z || "";
              if (z && X.SSF && X.SSF.is_date && X.SSF.is_date(z)) fmt[r + ":" + c] = { nf: /h/i.test(z) && /d/i.test(z) ? "date" : /h/i.test(z) ? "time" : "date" };
              else if (/%/.test(z)) fmt[r + ":" + c] = { nf: "pct" };
              else if (/\u20bd|\u0440\u0443\u0431|RUB/i.test(z)) fmt[r + ":" + c] = { nf: "rub" };
              else if (/\$/.test(z)) fmt[r + ":" + c] = { nf: "usd" };
              else if (/\u20ac/.test(z)) fmt[r + ":" + c] = { nf: "eur" };
            } else if (cell.t === "b") {
              raw = cell.v ? "TRUE" : "FALSE";
            } else if (cell.t === "e") {
              raw = cell.w ? "'" + cell.w : null;
            } else if (cell.v != null && cell.v !== "") {
              var sv = String(cell.v);
              raw = /^[=+\-']/.test(sv) || normalizeInput(sv) !== sv || /^\d/.test(sv) ? "'" + sv : sv;
            }
          }
          row.push(raw);
        }
        data.push(row);
      }
      (ws["!cols"] || []).forEach(function (ci, idx) {
        if (!ci || idx >= MAX_COLS) return;
        var px = ci.wpx || (ci.wch ? Math.round(ci.wch * 7 + 10) : 0);
        if (px) colW[idx] = clamp(Math.round(px), MINW, MAXW);
      });
      created.push({ name: names[sn], data: data, fmt: fmt, colW: colW });
    });
    if (!created.length) { this.toast("В файле нет данных"); return; }
    var renamed = Object.keys(names).some(function (k) { return names[k] !== k; });
    created.forEach(function (s) {
      if (renamed) {
        s.data = s.data.map(function (row) {
          return row.map(function (v) {
            if (typeof v !== "string" || v.charAt(0) !== "=") return v;
            Object.keys(names).forEach(function (orig) {
              if (names[orig] === orig) return;
              var q1 = "'" + orig.replace(/'/g, "''") + "'!", q2 = orig + "!";
              v = v.split(q1).join(quoteSheet(names[orig]) + "!");
              if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(orig)) v = v.replace(new RegExp("(^|[^A-Za-z0-9_'])" + orig + "!", "g"), "$1" + quoteSheet(names[orig]) + "!");
              void q2;
            });
            return v;
          });
        });
      }
    });
    var start = b.sheets.length;
    created.forEach(function (s) { b._add(s); count++; });
    b.hf.batch(function () {
      created.forEach(function (s, i) {
        var content = b._content(s);
        if (content.length) b.hf.setSheetContent(b.sheets[start + i].hid, content);
      });
    });
    first = start;
    b.active = first;
    b.changed("sheets");
    this.switchSheet(first);
    this.toast("Из «" + base + "» открыто " + count + " " + plural(count, "лист", "листа", "листов") + ". Оформление Excel переносится частично");
  };

  function loadFont() {
    if (doc.getElementById("demo-sh-font")) return;
    var l = doc.createElement("link");
    l.id = "demo-sh-font";
    l.rel = "stylesheet";
    l.href = FONT_URL;
    doc.head.appendChild(l);
  }

  function intro() {
    var m = doc.getElementById("demo-sh-intro");
    if (!m) return;
    var open = m.querySelector("[data-intro=open]");
    doc.documentElement.classList.add("demo-sh-lock");
    function close() {
      if (!m.classList.contains("demo-sh-intro--on")) return;
      m.classList.remove("demo-sh-intro--on");
      m.setAttribute("aria-hidden", "true");
      doc.removeEventListener("keydown", onKey, true);
      setTimeout(function () { m.hidden = true; }, 220);
      var app = root.demoSheets;
      if (app) app.grid.focus({ preventScroll: true });
    }
    function onKey(e) {
      if (e.key === "Enter" || e.key === "Escape") {
        var t = e.target;
        if (t && t.matches && t.matches("a[data-intro=back]") && e.key === "Enter") return;
        e.preventDefault();
        e.stopPropagation();
        close();
      } else if (e.key === "Tab") {
        var f = m.querySelectorAll("a,button");
        if (f.length) {
          var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }
    }
    m.hidden = false;
    m.classList.add("demo-sh-intro--on");
    m.removeAttribute("aria-hidden");
    doc.addEventListener("keydown", onKey, true);
    if (open) {
      open.addEventListener("click", close);
      setTimeout(function () { open.focus({ preventScroll: true }); }, 30);
    }
    m.addEventListener("pointerdown", function (e) { if (e.target === m) close(); });
    root.demoSheetsIntro = { close: close };
  }

  function boot() {
    var host = doc.getElementById("demo-sh-root");
    if (!host || host.getAttribute("data-ready")) return;
    host.setAttribute("data-ready", "1");
    function fail() {
      host.innerHTML = "<div class=\"demo-sh__state\"><p class=\"demo-sh__state-text\">Не удалось загрузить движок формул. Проверьте соединение и попробуйте еще раз.</p><button type=\"button\" class=\"demo-sh__retry\">Повторить</button></div>";
      host.querySelector(".demo-sh__retry").addEventListener("click", function () {
        host.removeAttribute("data-ready");
        host.innerHTML = "<div class=\"demo-sh__state\"><div class=\"demo-sh__spinner\" aria-hidden=\"true\"></div><p class=\"demo-sh__state-text\">Загружаем таблицу…</p></div>";
        boot();
      });
    }
    var ready = root.HyperFormula ? Promise.resolve() : loadScript(HF_URL);
    ready.then(function () {
      var M = root.HyperFormula;
      if (M && !M.HyperFormula) M = { HyperFormula: M, FunctionPlugin: M.FunctionPlugin, FunctionArgumentType: M.FunctionArgumentType };
      root.demoSheets = new App(host, M);
      if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { if (root.demoSheets) root.demoSheets.invalidate(); });
    }).catch(fail);
  }

  function start() {
    loadFont();
    intro();
    boot();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start);
  else start();
})(typeof window !== "undefined" ? window : globalThis);
