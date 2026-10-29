var PulseCore = (function () {
  "use strict";

  var DAY_MS = 864e5;
  var ND = 540;
  var WARM = 480;
  var SEED = 0x51a7e;

  var SOURCES = [
    { id: "search", name: "Поиск", short: "Поиск" },
    { id: "direct", name: "Прямые заходы", short: "Прямые" },
    { id: "social", name: "Соцсети", short: "Соцсети" },
    { id: "ads", name: "Реклама", short: "Реклама" },
    { id: "referral", name: "Рефералы", short: "Рефералы" },
    { id: "email", name: "Email-рассылки", short: "Email" }
  ];
  var DEVICES = [
    { id: "desktop", name: "Компьютеры" },
    { id: "mobile", name: "Смартфоны" },
    { id: "tablet", name: "Планшеты" }
  ];
  var COUNTRIES = [
    { id: "RU", map: "Russia", name: "Россия", share: 0.46, cis: 1, rich: 0, cities: [["Москва", 37.62, 55.75, .38], ["Санкт-Петербург", 30.31, 59.94, .17], ["Екатеринбург", 60.6, 56.84, .07], ["Новосибирск", 82.92, 55.03, .06], ["Казань", 49.11, 55.79, .06], ["Краснодар", 38.98, 45.04, .05], ["Нижний Новгород", 44.0, 56.33, .04], ["Другие города", 0, 0, .17]] },
    { id: "KZ", map: "Kazakhstan", name: "Казахстан", share: 0.07, cis: 1, rich: 0, cities: [["Алматы", 76.95, 43.24, .52], ["Астана", 71.43, 51.13, .3], ["Шымкент", 69.6, 42.32, .08], ["Другие города", 0, 0, .1]] },
    { id: "BY", map: "Belarus", name: "Беларусь", share: 0.05, cis: 1, rich: 0, cities: [["Минск", 27.56, 53.9, .7], ["Гомель", 30.98, 52.43, .1], ["Брест", 23.69, 52.1, .07], ["Другие города", 0, 0, .13]] },
    { id: "UZ", map: "Uzbekistan", name: "Узбекистан", share: 0.03, cis: 1, rich: 0, cities: [["Ташкент", 69.24, 41.3, .74], ["Самарканд", 66.96, 39.65, .12], ["Другие города", 0, 0, .14]] },
    { id: "AM", map: "Armenia", name: "Армения", share: 0.03, cis: 1, rich: 0, cities: [["Ереван", 44.51, 40.18, .86], ["Гюмри", 43.85, 40.79, .07], ["Другие города", 0, 0, .07]] },
    { id: "GE", map: "Georgia", name: "Грузия", share: 0.035, cis: 0, rich: 0, cities: [["Тбилиси", 44.79, 41.72, .7], ["Батуми", 41.64, 41.64, .22], ["Другие города", 0, 0, .08]] },
    { id: "RS", map: "Serbia", name: "Сербия", share: 0.025, cis: 0, rich: 0, cities: [["Белград", 20.46, 44.79, .72], ["Нови-Сад", 19.84, 45.25, .2], ["Другие города", 0, 0, .08]] },
    { id: "TR", map: "Turkey", name: "Турция", share: 0.03, cis: 0, rich: 0, cities: [["Стамбул", 28.98, 41.01, .52], ["Анталья", 30.71, 36.9, .3], ["Другие города", 0, 0, .18]] },
    { id: "AE", map: "United Arab Emirates", name: "ОАЭ", share: 0.025, cis: 0, rich: 1, cities: [["Дубай", 55.27, 25.2, .82], ["Абу-Даби", 54.37, 24.45, .14], ["Другие города", 0, 0, .04]] },
    { id: "DE", map: "Germany", name: "Германия", share: 0.04, cis: 0, rich: 1, cities: [["Берлин", 13.4, 52.52, .4], ["Мюнхен", 11.58, 48.14, .16], ["Франкфурт", 8.68, 50.11, .1], ["Другие города", 0, 0, .34]] },
    { id: "US", map: "United States", name: "США", share: 0.06, cis: 0, rich: 1, cities: [["Нью-Йорк", -74.0, 40.71, .3], ["Сан-Франциско", -122.42, 37.77, .16], ["Лос-Анджелес", -118.24, 34.05, .14], ["Майами", -80.19, 25.76, .1], ["Другие города", 0, 0, .3]] },
    { id: "IL", map: "Israel", name: "Израиль", share: 0.02, cis: 0, rich: 1, cities: [["Тель-Авив", 34.78, 32.08, .6], ["Хайфа", 34.99, 32.79, .2], ["Другие города", 0, 0, .2]] },
    { id: "CY", map: "Cyprus", name: "Кипр", share: 0.015, cis: 0, rich: 1, cities: [["Лимассол", 33.04, 34.68, .62], ["Никосия", 33.38, 35.19, .25], ["Другие города", 0, 0, .13]] },
    { id: "NL", map: "Netherlands", name: "Нидерланды", share: 0.015, cis: 0, rich: 1, cities: [["Амстердам", 4.9, 52.37, .66], ["Роттердам", 4.48, 51.92, .14], ["Другие города", 0, 0, .2]] },
    { id: "PL", map: "Poland", name: "Польша", share: 0.015, cis: 0, rich: 0, cities: [["Варшава", 21.01, 52.23, .56], ["Краков", 19.94, 50.06, .2], ["Другие города", 0, 0, .24]] },
    { id: "ES", map: "Spain", name: "Испания", share: 0.015, cis: 0, rich: 1, cities: [["Барселона", 2.17, 41.39, .45], ["Валенсия", -0.38, 39.47, .25], ["Другие города", 0, 0, .3]] },
    { id: "TH", map: "Thailand", name: "Таиланд", share: 0.012, cis: 0, rich: 0, cities: [["Пхукет", 98.39, 7.88, .5], ["Бангкок", 100.5, 13.76, .4], ["Другие города", 0, 0, .1]] },
    { id: "GB", map: "United Kingdom", name: "Великобритания", share: 0.015, cis: 0, rich: 1, cities: [["Лондон", -0.13, 51.51, .74], ["Манчестер", -2.24, 53.48, .1], ["Другие города", 0, 0, .16]] }
  ];
  var NS = SOURCES.length, NV = DEVICES.length, NK = COUNTRIES.length, NCELL = NS * NV * NK;

  var PLANS = [
    { id: "start", name: "Старт", price: 490, churn: 0.11 },
    { id: "pro", name: "Про", price: 1290, churn: 0.075 },
    { id: "studio", name: "Студия", price: 3490, churn: 0.065 }
  ];

  var CAMPAIGNS = [
    { id: "brand", src: 3, utm: ["yandex", "cpc", "brand_search"], name: "Брендовый поиск", w: 0.34, cpc: 14 },
    { id: "competitors", src: 3, utm: ["yandex", "cpc", "competitors"], name: "Конкуренты", w: 0.26, cpc: 41, conv: 0.8 },
    { id: "retarget", src: 3, utm: ["vk_ads", "cpc", "retargeting"], name: "Ретаргетинг", w: 0.22, cpc: 22, conv: 1.35 },
    { id: "tgads", src: 3, utm: ["telegram_ads", "cpm", "creators_channels"], name: "Каналы авторов", w: 0.18, cpc: 29, conv: 0.9 },
    { id: "tgposts", src: 2, utm: ["telegram", "social", "channel_posts"], name: "Посты в канале", w: 0.46 },
    { id: "vkgroup", src: 2, utm: ["vk", "social", "community"], name: "Сообщество ВК", w: 0.3 },
    { id: "ytguides", src: 2, utm: ["youtube", "social", "tutorials"], name: "Видеоуроки", w: 0.24, conv: 1.2 },
    { id: "digest", src: 5, utm: ["newsletter", "email", "weekly_digest"], name: "Еженедельный дайджест", w: 0.68 },
    { id: "onboarding", src: 5, utm: ["onboarding", "email", "trigger_chain"], name: "Цепочка онбординга", w: 0.32, conv: 1.5 },
    { id: "summer25", src: 5, utm: ["newsletter", "email", "summer_sale_2025"], name: "Летняя распродажа 2025", start: "2025-07-15", len: 9, peak: 900, shape: "plateau", conv: 1.6, discount: 0.3 },
    { id: "bf25ads", src: 3, utm: ["yandex", "cpc", "black_friday_2025"], name: "Черная пятница · реклама", start: "2025-11-24", len: 8, peak: 2600, shape: "plateau", cpc: 33, conv: 1.45, discount: 0.5 },
    { id: "bf25mail", src: 5, utm: ["newsletter", "email", "black_friday_2025"], name: "Черная пятница · письма", start: "2025-11-24", len: 8, peak: 1500, shape: "plateau", conv: 1.7, discount: 0.5 },
    { id: "ny26", src: 5, utm: ["newsletter", "email", "new_year_2026"], name: "Новогодние шаблоны", start: "2025-12-17", len: 4, peak: 1100, shape: "burst", tau: 3, conv: 1.2 },
    { id: "phunt", src: 4, utm: ["producthunt", "referral", "launch_ai_cut"], name: "Запуск на Product Hunt", start: "2026-02-10", len: 3, peak: 5200, shape: "burst", tau: 2.2, conv: 0.7 },
    { id: "ytreview", src: 2, utm: ["youtube", "social", "blogger_review"], name: "Обзор у блогера", start: "2026-03-18", len: 4, peak: 3800, shape: "burst", tau: 4, conv: 1.1 },
    { id: "aicut", src: 2, utm: ["telegram", "social", "ai_cut_launch"], name: "Запуск умной нарезки", start: "2026-05-20", len: 5, peak: 2100, shape: "burst", tau: 3.5, conv: 1.3 },
    { id: "habr", src: 4, utm: ["habr", "referral", "article_codec"], name: "Статья на Хабре", start: "2026-06-03", len: 3, peak: 2900, shape: "burst", tau: 2.5, conv: 0.9 },
    { id: "school26", src: 3, utm: ["yandex", "cpc", "back_to_school_2026"], name: "Снова в школу", start: "2026-08-25", len: 16, peak: 1400, shape: "plateau", cpc: 27, conv: 1.15, discount: 0.2 },
    { id: "autumn26", src: 3, utm: ["vk_ads", "cpc", "autumn_promo_2026"], name: "Осенняя акция", start: "2026-10-12", len: 30, peak: 1700, shape: "plateau", cpc: 24, conv: 1.25, discount: 0.25 }
  ];
  var NCAMP = CAMPAIGNS.length;

  var PAGES = [
    ["/", "Главная", 48, .32],
    ["/pricing", "Тарифы", 95, .38],
    ["/templates", "Шаблоны видео", 70, .35],
    ["/features/ai-cut", "Умная нарезка", 85, .3],
    ["/features/subtitles", "Автосубтитры", 80, .3],
    ["/blog/reels-za-10-minut", "Как смонтировать Reels за 10 минут", 240, .62],
    ["/blog/luchshie-perehody", "25 переходов для роликов", 210, .58],
    ["/blog/zvuk-bez-shuma", "Как убрать шум из звука", 190, .6],
    ["/blog/format-shorts", "Формат вертикальных роликов в 2026", 170, .55],
    ["/signup", "Регистрация", 60, .22],
    ["/login", "Вход", 20, .12],
    ["/app/projects", "Проекты", 75, .25],
    ["/app/editor", "Редактор", 420, .4],
    ["/help/export", "Экспорт и форматы", 130, .48],
    ["/help/billing", "Оплата и счета", 90, .3],
    ["/promo", "Акции и скидки", 65, .4],
    ["/changelog", "Что нового", 110, .45],
    ["/about", "О сервисе", 55, .5]
  ];
  var LAND = [
    [8, 4, 10, 7, 6, 14, 11, 9, 8, 0, 3, 0, 0, 8, 1, 0, 2, 2],
    [30, 6, 3, 2, 2, 1, 1, 1, 1, 2, 22, 18, 6, 2, 1, 0, 1, 1],
    [18, 4, 14, 6, 5, 12, 9, 5, 8, 1, 1, 0, 0, 1, 0, 6, 8, 2],
    [25, 14, 9, 12, 8, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 26, 0, 0],
    [30, 8, 10, 6, 6, 8, 6, 4, 4, 2, 2, 1, 0, 3, 1, 1, 5, 3],
    [6, 6, 6, 6, 5, 6, 5, 4, 4, 0, 8, 14, 10, 2, 1, 10, 14, 0]
  ];
  var COMMON = [12, 9, 8, 5, 4, 5, 4, 3, 3, 6, 6, 10, 12, 3, 2, 2, 2, 1];

  var BROWSERS = ["Chrome", "Яндекс Браузер", "Safari", "Edge", "Firefox", "Opera", "Samsung Internet", "Другие"];
  var BROWSER_SHARE = [
    [[.5, .22, .09, .07, .05, .05, 0, .02], [.6, .02, .14, .1, .08, .04, 0, .02]],
    [[.38, .15, .31, 0, .01, .04, .07, .04], [.4, .01, .44, 0, .01, .02, .09, .03]],
    [[.28, .11, .55, 0, 0, .02, .02, .02], [.26, .01, .66, 0, 0, .02, .03, .02]]
  ];
  var OSES = ["Windows", "macOS", "Linux", "Android", "iOS", "iPadOS", "Другие"];
  var OS_SHARE = [
    [[.6, .32, .06, 0, 0, 0, .02], [.44, .46, .08, 0, 0, 0, .02]],
    [[0, 0, 0, .6, .4, 0, 0], [0, 0, 0, .44, .56, 0, 0]],
    [[0, 0, 0, .32, 0, .68, 0], [0, 0, 0, .24, 0, .76, 0]]
  ];

  var SRC = {
    share: [.40, .21, .11, .16, .07, .05],
    repeat: [1.18, 1.55, 1.12, 1.1, 1.15, 1.4],
    bounce: [.42, .31, .58, .52, .38, .29],
    dur: [165, 290, 85, 120, 210, 240],
    depth: [3.2, 5.1, 2.2, 2.6, 3.6, 4.4],
    signup: [.0085, .016, .0052, .0118, .0125, .0095],
    payer: [.2, .27, .12, .17, .3, .34],
    pricing: [.18, .32, .12, .3, .22, .25],
    dev: [[.56, .4, .04], [.66, .3, .04], [.24, .71, .05], [.42, .53, .05], [.6, .36, .04], [.5, .45, .05]]
  };

  var FIRST_M = ["Алексей", "Дмитрий", "Иван", "Максим", "Артем", "Никита", "Сергей", "Андрей", "Егор", "Павел", "Михаил", "Кирилл", "Роман", "Илья", "Тимур", "Олег", "Глеб", "Денис", "Арсений", "Виктор", "Руслан", "Степан", "Лев", "Марк"];
  var FIRST_F = ["Анна", "Мария", "Екатерина", "Ольга", "Дарья", "Полина", "Алина", "Виктория", "Ксения", "Софья", "Елена", "Наталья", "Юлия", "Вера", "Ирина", "Алиса", "Ева", "Яна", "Таисия", "Марина", "Василиса", "Диана", "Камила", "Лиана"];
  var LAST = ["Иванов", "Смирнов", "Кузнецов", "Попов", "Соколов", "Лебедев", "Козлов", "Новиков", "Морозов", "Петров", "Волков", "Соловьев", "Васильев", "Зайцев", "Павлов", "Семенов", "Голубев", "Виноградов", "Богданов", "Воробьев", "Федоров", "Михайлов", "Беляев", "Тарасов", "Белов", "Комаров", "Орлов", "Киселев", "Макаров", "Андреев", "Ковалев", "Ильин", "Гусев", "Титов", "Кудрявцев", "Баранов", "Куликов", "Алексеев", "Степанов", "Яковлев", "Сорокин", "Сергеев", "Романов", "Захаров", "Борисов", "Королев", "Герасимов", "Пономарев", "Григорьев", "Лазарев", "Медведев", "Ершов", "Никитин", "Соболев", "Рябов", "Поляков", "Цветков", "Данилов", "Жуков", "Фролов"];
  var LATIN_F = ["Emma", "Olivia", "Sofia", "Mia", "Lena", "Hannah", "Clara", "Lucia", "Maya", "Noa", "Ava", "Elif", "Zeynep", "Ana", "Julia", "Nina"];
  var LATIN_M = ["Lucas", "Noah", "Leon", "Daniel", "Adam", "David", "Marco", "Pablo", "Tom", "Max", "Emir", "Luka", "Jonas", "Felix", "Ethan", "Omer"];
  var LATIN_L = ["Müller", "Schmidt", "Garcia", "Martinez", "Cohen", "Levi", "Yilmaz", "Kaya", "Jovanović", "Petrović", "Kowalski", "Nowak", "de Vries", "Jansen", "Smith", "Brown", "Wilson", "Taylor", "Fischer", "Weber", "Lopez", "Romero", "Mizrahi", "Demir"];
  var MAILS = ["gmail.com", "yandex.ru", "mail.ru", "icloud.com", "ya.ru", "proton.me", "outlook.com"];
  var TR = { "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya" };

  function translit(s) {
    s = s.toLowerCase();
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (TR[ch] !== undefined) out += TR[ch];
      else if (/[a-z0-9]/.test(ch)) out += ch;
      else if (ch === "ü") out += "u";
      else if (ch === "ć") out += "c";
      else if (ch === " ") out += "";
    }
    return out;
  }

  function mix(h) {
    h ^= h >>> 16; h = Math.imul(h, 0x7feb352d);
    h ^= h >>> 15; h = Math.imul(h, 0x846ca68b);
    h ^= h >>> 16;
    return h >>> 0;
  }
  function hash3(a, b, c) { return mix((mix((mix((SEED ^ a) >>> 0) + (b | 0)) >>> 0) + Math.imul(c | 0, 0x27d4eb2d)) >>> 0); }
  function rnd(a, b, c) { return hash3(a, b, c) / 4294967296; }
  function gauss(a, b, c) {
    var u = rnd(a, b, c * 2 + 1) || 1e-9, v = rnd(a, b, c * 2 + 2);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function prng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function wpick(r, w) {
    var t = 0, i;
    for (i = 0; i < w.length; i++) t += w[i];
    var x = r() * t;
    for (i = 0; i < w.length; i++) { x -= w[i]; if (x < 0) return i; }
    return w.length - 1;
  }

  function absOf(y, m, d) { return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS); }
  function absIso(s) { var p = s.split("-"); return absOf(+p[0], +p[1], +p[2]); }
  function parts(a) { var dt = new Date(a * DAY_MS); return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), w: dt.getUTCDay() }; }
  function iso(a) { var p = parts(a); return p.y + "-" + (p.m < 10 ? "0" : "") + p.m + "-" + (p.d < 10 ? "0" : "") + p.d; }
  function todayAbs(now) { now = now || new Date(); return absOf(now.getFullYear(), now.getMonth() + 1, now.getDate()); }

  var A2025 = absOf(2025, 1, 1);
  var WEEK = [0.8, 1.08, 1.1, 1.07, 1.04, 0.95, 0.72];
  var SEASON = [1.04, 1.08, 1.1, 1.04, 0.97, 0.9, 0.84, 0.86, 1.03, 1.08, 1.12, 1.0];

  function season(a) {
    var p = parts(a);
    var pos = (p.m - 1) + (p.d - 15) / 30.5;
    var i0 = Math.floor(pos), f = pos - i0;
    var v0 = SEASON[(i0 + 12) % 12], v1 = SEASON[(i0 + 13) % 12];
    var s = v0 + (v1 - v0) * (0.5 - 0.5 * Math.cos(Math.PI * f));
    if (p.m === 1 && p.d <= 8) s *= [0.42, 0.5, 0.56, 0.62, 0.68, 0.72, 0.76, 0.85][p.d - 1];
    if (p.m === 12 && p.d === 31) s *= 0.55;
    if (p.m === 12 && p.d === 30) s *= 0.8;
    if (p.m === 5 && (p.d <= 3 || (p.d >= 9 && p.d <= 11))) s *= 0.84;
    if (p.m === 3 && p.d === 8) s *= 0.86;
    if (p.m === 6 && p.d === 12) s *= 0.88;
    if (p.m === 11 && p.d === 4) s *= 0.9;
    return s;
  }

  function trafficBase(a) {
    var t = (a - A2025) / 365;
    var trend = 4300 * Math.exp(0.36 * t);
    var wk = Math.floor((a + 3) / 7);
    var wobble = 1 + 0.045 * gauss(wk, 7, 1);
    var noise = Math.exp(0.05 * gauss(a, 1, 1));
    return trend * WEEK[parts(a).w] * season(a) * wobble * noise;
  }

  function campUplift(c, a) {
    var camp = CAMPAIGNS[c];
    if (!camp.start) return 0;
    var s = absIso(camp.start), k = a - s;
    if (k < 0) return 0;
    var n = Math.exp(0.12 * gauss(a, 40 + c, 1));
    if (camp.shape === "plateau") {
      if (k < camp.len) return camp.peak * (k === 0 ? 0.7 : 1 - 0.03 * k) * n * (0.85 + 0.3 * WEEK[parts(a).w] - 0.15);
      var after = k - camp.len + 1;
      return after > 12 ? 0 : camp.peak * 0.4 * Math.exp(-after / 1.6) * n;
    }
    if (k > camp.len + 18) return 0;
    var tau = camp.tau || 3;
    return camp.peak * (k === 0 ? 1 : Math.exp(-k / tau)) * n;
  }

  function stoch(x, r) { var f = Math.floor(x); return f + (r < x - f ? 1 : 0); }

  function build(opts) {
    opts = opts || {};
    var end = opts.end != null ? opts.end : todayAbs();
    var frac = opts.frac != null ? opts.frac : (function () { var n = new Date(); return Math.max(0.04, (n.getHours() * 60 + n.getMinutes()) / 1440); })();
    var start = end - ND + 1;
    var N = ND * NCELL;
    var D = {
      start: start, end: end, frac: frac, nd: ND,
      sessions: new Float32Array(N), visitors: new Float32Array(N), bounces: new Float32Array(N),
      dur: new Float32Array(N), pv: new Float32Array(N), signups: new Float32Array(N),
      revenue: new Float32Array(N), newPayers: new Float32Array(N),
      srcTotal: new Float32Array(ND * NS), campS: new Float32Array(ND * NCAMP), campConv: new Float32Array(ND * NCAMP)
    };
    var users = [];
    var campBySrc = [];
    for (var s0 = 0; s0 < NS; s0++) campBySrc.push([]);
    CAMPAIGNS.forEach(function (c, i) { campBySrc[c.src].push(i); });

    var ctyBase = COUNTRIES.map(function (c) { return c.share; });
    var devAvg = [0.5, 0.45, 0.05];

    for (var w = start - WARM; w < start; w++) {
      var wb = trafficBase(w), wt = 0, wsi;
      for (wsi = 0; wsi < NS; wsi++) wt += SRC.share[wsi];
      for (wsi = 0; wsi < NS; wsi++) {
        var ws = wb * SRC.share[wsi] / wt;
        var wn = stoch(ws * SRC.signup[wsi] * 0.95, rnd(w, 500 + wsi, 1));
        if (!wn) continue;
        var wr = prng(hash3(w, 600 + wsi, 3));
        var evc = campBySrc[wsi].filter(function (cc) { return !CAMPAIGNS[cc].start; });
        var evw = evc.map(function (cc) { return CAMPAIGNS[cc].w * (CAMPAIGNS[cc].conv || 1); });
        var evt = evw.reduce(function (x, y) { return x + y; }, 0);
        for (var wj = 0; wj < wn; wj++) {
          makeUsers(users, w, wsi, wpick(wr, SRC.dev[wsi] || devAvg), wpick(wr, ctyBase), 1, evc, evw, evt || 1);
        }
      }
    }

    for (var di = 0; di < ND; di++) {
      var a = start + di;
      var pa = parts(a);
      var t = (a - A2025) / 365;
      var weekend = pa.w === 0 || pa.w === 6;
      var dayScale = a === end ? frac : 1;
      var base = trafficBase(a);
      var sh = SRC.share.slice();
      sh[0] *= 1 + 0.22 * t;
      if (a >= absOf(2026, 3, 5) && a < absOf(2026, 4, 8)) {
        var k0 = a - absOf(2026, 3, 5);
        sh[0] *= k0 < 9 ? 0.8 : 0.8 + 0.2 * (k0 - 9) / 25;
      }
      sh[4] *= 1 + 0.1 * t;
      if (pa.w === 2) sh[5] *= 2.3; else if (pa.w === 3) sh[5] *= 1.35; else sh[5] *= 0.82;
      if (weekend) { sh[2] *= 1.25; sh[3] *= 0.85; }
      var tot = 0, si;
      for (si = 0; si < NS; si++) tot += sh[si];
      for (si = 0; si < NS; si++) {
        var Bs = base * sh[si] / tot * Math.exp(0.07 * gauss(a, 10 + si, 1));
        var Ss = Bs, convW = Bs;
        var list = campBySrc[si], ci, evW = 0;
        for (ci = 0; ci < list.length; ci++) { if (!CAMPAIGNS[list[ci]].start) evW += CAMPAIGNS[list[ci]].w; }
        for (ci = 0; ci < list.length; ci++) {
          var cid = list[ci], camp = CAMPAIGNS[cid], v;
          if (camp.start) v = campUplift(cid, a);
          else v = evW > 0 ? Bs * camp.w / evW * Math.exp(0.1 * gauss(a, 60 + cid, 1)) : 0;
          if (camp.start) Ss += v;
          D.campS[di * NCAMP + cid] = v * dayScale;
          D.campConv[di * NCAMP + cid] = v * (camp.conv || 1) * dayScale;
          if (camp.start) convW += v * (camp.conv || 1);
          else convW += v * ((camp.conv || 1) - 1);
        }
        Ss *= dayScale;
        D.srcTotal[di * NS + si] = Ss;
        var convMul = Ss > 0 ? convW * dayScale / Ss : 1;
        var dsh = SRC.dev[si].slice();
        dsh[1] += 0.04 * t + (weekend ? 0.08 : 0);
        dsh[0] -= 0.04 * t + (weekend ? 0.08 : 0);
        var csh = ctyBase.slice();
        if (si === 3) { csh[0] *= 1.3; csh[1] *= 1.2; csh[2] *= 1.2; }
        if (si === 4) { csh[10] *= 1.5; csh[9] *= 1.3; }
        var ctot = 0, ki;
        for (ki = 0; ki < NK; ki++) ctot += csh[ki];
        for (var vi = 0; vi < NV; vi++) {
          for (ki = 0; ki < NK; ki++) {
            var cell = (si * NV + vi) * NK + ki;
            var idx = di * NCELL + cell;
            var e = Ss * dsh[vi] * csh[ki] / ctot * Math.exp(0.14 * gauss(a, 100 + cell, 1));
            var sess = stoch(e, rnd(a, 1000 + cell, 1));
            if (!sess) continue;
            var mob = vi === 1, tab = vi === 2;
            var vis = Math.max(1, stoch(sess / (SRC.repeat[si] * (1 + 0.03 * gauss(a, 2000 + cell, 1))), rnd(a, 1000 + cell, 2)));
            var br = SRC.bounce[si] + (mob ? 0.07 : tab ? 0.03 : 0) + 0.025 * gauss(a, 3000 + cell, 1);
            br = Math.min(0.92, Math.max(0.08, br));
            var bnc = stoch(sess * br, rnd(a, 1000 + cell, 3));
            var avgDur = SRC.dur[si] * (mob ? 0.7 : tab ? 0.85 : 1) * Math.exp(0.12 * gauss(a, 4000 + cell, 1));
            var depth = SRC.depth[si] * (mob ? 0.82 : 1) * (1.15 - br * 0.3);
            var rate = SRC.signup[si] * (mob ? 0.72 : tab ? 0.9 : 1.22) * convMul * (COUNTRIES[ki].rich ? 0.9 : 1);
            var sg = stoch(sess * rate, rnd(a, 1000 + cell, 4));
            D.sessions[idx] = sess; D.visitors[idx] = vis; D.bounces[idx] = bnc;
            D.dur[idx] = sess * avgDur; D.pv[idx] = Math.max(sess, Math.round(sess * depth));
            D.signups[idx] = sg;
            if (sg) makeUsers(users, a, si, vi, ki, sg, campBySrc[si], campBySrc[si].map(function (cc) { return D.campConv[di * NCAMP + cc]; }), D.srcTotal[di * NS + si]);
          }
        }
      }
    }
    finishUsers(D, users);
    D.users = users;
    return D;
  }

  function makeUsers(users, a, si, vi, ki, n, camps, weights, tot) {
    var r = prng(hash3(a, 77 + ((si * NV + vi) * NK + ki), 9 + users.length % 7919));
    var cty = COUNTRIES[ki];
    for (var j = 0; j < n; j++) {
      var camp = -1;
      if (camps.length) {
        var acc = 0, x = r() * (tot || 1);
        for (var c = 0; c < camps.length; c++) {
          acc += weights[c];
          if (x < acc) { camp = camps[c]; break; }
        }
        if (camp < 0 && si !== 4) camp = camps[0];
      }
      var female = r() < 0.47, latin = !cty.cis && ki !== 0 && r() < (cty.rich ? 0.5 : 0.3);
      var first, last;
      if (latin) { first = pick(r, female ? LATIN_F : LATIN_M); last = pick(r, LATIN_L); }
      else { first = pick(r, female ? FIRST_F : FIRST_M); last = pick(r, LAST); if (female) last += "а"; }
      var cityI = wpick(r, cty.cities.map(function (c) { return c[3]; }));
      var payP = SRC.payer[si] * (vi === 0 ? 1.15 : 0.85) * (cty.rich ? 1.2 : 1) * (camp >= 0 && CAMPAIGNS[camp].discount ? 1.35 : 1);
      var payer = r() < payP;
      var activated = payer || r() < 0.58;
      var u = {
        id: users.length, first: first, last: last, female: female,
        reg: a, src: si, dev: vi, cty: ki, city: cityI, camp: camp,
        activated: activated, plan: -1, payStart: -1, nPay: 0, revenue: 0, lastActive: a, status: 0
      };
      var mailName = translit(first).slice(0, r() < 0.4 ? 1 : 12) + (r() < 0.5 ? "." : "") + translit(last) + (r() < 0.3 ? String(Math.floor(r() * 99)) : "");
      u.email = mailName + "@" + (latin ? pick(r, ["gmail.com", "outlook.com", "icloud.com", "proton.me"]) : MAILS[wpick(r, [30, 26, 16, 10, 8, 5, 5])]);
      if (payer) {
        var delay = r() < 0.38 ? Math.floor(r() * 2) : Math.min(60, Math.floor(-Math.log(r() || 1e-9) * 9) + 1);
        u.payStart = a + delay;
        u.plan = wpick(r, cty.rich ? [0.36, 0.46, 0.18] : [0.55, 0.36, 0.09]);
        var ch = PLANS[u.plan].churn * (si === 5 || si === 4 ? 0.85 : 1);
        var n2 = 1;
        while (r() > ch && n2 < 60) n2++;
        u.nPayMax = n2;
        u.disc = camp >= 0 && CAMPAIGNS[camp].discount ? CAMPAIGNS[camp].discount : 0;
      } else {
        u.lastActive = a + (activated ? Math.floor(-Math.log(r() || 1e-9) * 70) : Math.floor(-Math.log(r() || 1e-9) * 6));
      }
      u.seen = r();
      users.push(u);
    }
  }

  function finishUsers(D, users) {
    var pays = [];
    var end = D.end;
    for (var i = 0; i < users.length; i++) {
      var u = users[i];
      if (u.plan >= 0) {
        if (u.payStart > end) { u.plan = -1; u.payStart = -1; u.lastActive = Math.min(end, u.reg + 3); }
        else {
          var price = PLANS[u.plan].price, k;
          for (k = 0; k < u.nPayMax; k++) {
            var day = u.payStart + 30 * k;
            if (day > end) break;
            var amt = k === 0 && u.disc ? Math.round(price * (1 - u.disc)) : price;
            pays.push(day, i, amt);
            u.revenue += amt;
            if (day < D.start) continue;
            var di = day - D.start;
            var idx = di * NCELL + (u.src * NV + u.dev) * NK + u.cty;
            D.revenue[idx] += amt;
            if (k === 0) D.newPayers[idx] += 1;
          }
          u.nPay = k;
          u.subEnd = u.payStart + 30 * u.nPayMax;
          u.active = u.subEnd > end;
          u.lastActive = u.active ? end - Math.floor(u.seen * u.seen * 6) : Math.min(end, u.subEnd - Math.floor(u.seen * 20));
        }
      }
      if (u.lastActive > end) u.lastActive = end - Math.floor(u.seen * 3);
      if (u.lastActive < u.reg) u.lastActive = u.reg;
      u.status = u.plan >= 0 ? (u.active ? 1 : 2) : (end - u.lastActive <= 30 ? 3 : 4);
    }
    var n = pays.length / 3, order = new Array(n);
    for (i = 0; i < n; i++) order[i] = i;
    order.sort(function (x, y) { return pays[x * 3] - pays[y * 3]; });
    D.payDay = new Int32Array(n); D.payUser = new Int32Array(n); D.payAmt = new Float32Array(n);
    for (i = 0; i < n; i++) { var o = order[i]; D.payDay[i] = pays[o * 3]; D.payUser[i] = pays[o * 3 + 1]; D.payAmt[i] = pays[o * 3 + 2]; }
  }

  function cellsFor(f) {
    var out = [];
    for (var s = 0; s < NS; s++) {
      if (f && f.src && f.src.length && f.src.indexOf(s) < 0) continue;
      for (var v = 0; v < NV; v++) {
        if (f && f.dev && f.dev.length && f.dev.indexOf(v) < 0) continue;
        for (var k = 0; k < NK; k++) {
          if (f && f.cty && f.cty.length && f.cty.indexOf(k) < 0) continue;
          out.push((s * NV + v) * NK + k);
        }
      }
    }
    return out;
  }

  function userOk(u, f) {
    if (!f) return true;
    if (f.src && f.src.length && f.src.indexOf(u.src) < 0) return false;
    if (f.dev && f.dev.length && f.dev.indexOf(u.dev) < 0) return false;
    if (f.cty && f.cty.length && f.cty.indexOf(u.cty) < 0) return false;
    return true;
  }

  function dedup(days) { return 1 / (1 + 0.09 * Math.log(Math.max(1, days))); }

  function zeros(n) { var a = new Array(n); for (var i = 0; i < n; i++) a[i] = 0; return a; }
  function blank() { return { sessions: 0, visitors: 0, bounces: 0, dur: 0, pv: 0, signups: 0, revenue: 0, newPayers: 0 }; }

  function aggregate(D, from, to, f) {
    from = Math.max(from, D.start); to = Math.min(to, D.end);
    var n = to - from + 1;
    if (n <= 0) return null;
    var cells = cellsFor(f);
    var M = ["sessions", "visitors", "bounces", "dur", "pv", "signups", "revenue", "newPayers"];
    var daily = {}, m;
    for (m = 0; m < M.length; m++) daily[M[m]] = zeros(n);
    var bySrc = [], byDev = [], byCty = [], i;
    for (i = 0; i < NS; i++) bySrc.push(blank());
    for (i = 0; i < NV; i++) byDev.push(blank());
    for (i = 0; i < NK; i++) byCty.push(blank());
    var devCty = zeros(NV * NK);
    var srcDaily = zeros(n * NS);
    var tot = blank();
    for (var d = 0; d < n; d++) {
      var di = from - D.start + d, b = di * NCELL;
      for (var c = 0; c < cells.length; c++) {
        var cell = cells[c], idx = b + cell;
        var ss = D.sessions[idx];
        var rv = D.revenue[idx];
        if (!ss && !rv) continue;
        var k = cell % NK, v = ((cell - k) / NK) % NV, s = Math.floor(cell / (NK * NV));
        var tgt = [bySrc[s], byDev[v], byCty[k], tot];
        for (m = 0; m < M.length; m++) {
          var val = D[M[m]][idx];
          if (!val) continue;
          daily[M[m]][d] += val;
          tgt[0][M[m]] += val; tgt[1][M[m]] += val; tgt[2][M[m]] += val; tgt[3][M[m]] += val;
        }
        devCty[v * NK + k] += ss;
        srcDaily[d * NS + s] += ss;
      }
    }
    var dd = dedup(n);
    [tot].concat(bySrc, byDev, byCty).forEach(function (o) { o.uv = o.visitors * dd; });
    var users = 0, active = 0, payersSet = {}, payers = 0, byPlan = [blank(), blank(), blank()];
    byPlan.forEach(function (p) { p.payers = 0; p.payments = 0; });
    var regs = [];
    for (i = 0; i < D.users.length; i++) {
      var u = D.users[i];
      if (u.reg > to) break;
      if (!userOk(u, f)) continue;
      users++;
      if (u.lastActive >= from) active++;
      if (u.reg >= from) regs.push(u);
    }
    var lo = lowerBound(D.payDay, from), hi = lowerBound(D.payDay, to + 1);
    for (i = lo; i < hi; i++) {
      var pu = D.users[D.payUser[i]];
      if (!userOk(pu, f)) continue;
      var pp = byPlan[pu.plan];
      pp.revenue += D.payAmt[i]; pp.payments++;
      if (!payersSet[pu.id]) { payersSet[pu.id] = 1; payers++; pp.payers++; }
    }
    return {
      from: from, to: to, days: n, total: tot, daily: daily, bySrc: bySrc, byDev: byDev, byCty: byCty,
      devCty: devCty, srcDaily: srcDaily, accounts: users, active: active, payers: payers, byPlan: byPlan, regs: regs,
      kpi: kpis(D, tot, active, payers, from, to, f)
    };
  }

  function lowerBound(arr, x) {
    var lo = 0, hi = arr.length;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (arr[mid] < x) lo = mid + 1; else hi = mid; }
    return lo;
  }

  function ltvAt(D, endDay, f) {
    var from = endDay - 89, rev = 0, payerIds = {}, payers = 0;
    var lo = lowerBound(D.payDay, from), hi = lowerBound(D.payDay, endDay + 1), i;
    for (i = lo; i < hi; i++) {
      var u = D.users[D.payUser[i]];
      if (!userOk(u, f)) continue;
      rev += D.payAmt[i];
      if (!payerIds[u.id]) { payerIds[u.id] = 1; payers++; }
    }
    var atStart = 0, churned = 0;
    for (i = 0; i < D.users.length; i++) {
      var w = D.users[i];
      if (w.reg > from) break;
      if (w.plan < 0 || w.payStart > from || !userOk(w, f)) continue;
      if (w.subEnd > from) { atStart++; if (w.subEnd <= endDay) churned++; }
    }
    if (!payers || !atStart) return 0;
    var arppuM = rev / payers / 3;
    var churnM = Math.max(0.02, 1 - Math.pow(1 - churned / atStart, 1 / 3));
    return arppuM / churnM;
  }

  function kpis(D, t, active, payers, from, to, f) {
    var s = t.sessions || 0;
    return {
      visitors: t.uv,
      sessions: s,
      bounce: s ? t.bounces / s : 0,
      duration: s ? t.dur / s : 0,
      depth: s ? t.pv / s : 0,
      conversion: t.uv ? t.newPayers / t.uv : 0,
      signupRate: t.uv ? t.signups / t.uv : 0,
      revenue: t.revenue,
      signups: t.signups,
      newPayers: t.newPayers,
      arpu: active ? t.revenue / active : 0,
      ltv: ltvAt(D, to, f),
      active: active,
      payers: payers
    };
  }

  function dailyMetric(agg, key) {
    var d = agg.daily, n = agg.days, out = new Array(n);
    for (var i = 0; i < n; i++) {
      var s = d.sessions[i];
      switch (key) {
        case "visitors": out[i] = d.visitors[i]; break;
        case "sessions": out[i] = s; break;
        case "bounce": out[i] = s ? d.bounces[i] / s * 100 : 0; break;
        case "duration": out[i] = s ? d.dur[i] / s : 0; break;
        case "signups": out[i] = d.signups[i]; break;
        case "conversion": out[i] = d.visitors[i] ? d.newPayers[i] / d.visitors[i] * 100 : 0; break;
        case "revenue": out[i] = d.revenue[i]; break;
        case "pv": out[i] = d.pv[i]; break;
        default: out[i] = 0;
      }
    }
    return out;
  }

  function bucketSeries(agg, key, mode) {
    var d = agg.daily, n = agg.days, keys = [], idx = [], i;
    for (i = 0; i < n; i++) {
      var a = agg.from + i, p = parts(a), k;
      if (mode === "week") { var mon = a - ((p.w + 6) % 7); k = mon; }
      else if (mode === "month") k = absOf(p.y, p.m, 1);
      else k = a;
      if (!keys.length || keys[keys.length - 1] !== k) { keys.push(k); idx.push([]); }
      idx[idx.length - 1].push(i);
    }
    var vals = idx.map(function (list) {
      var sum = function (name) { var t = 0; for (var j = 0; j < list.length; j++) t += d[name][list[j]]; return t; };
      var s = sum("sessions");
      switch (key) {
        case "visitors": return sum("visitors") * (mode === "day" ? 1 : dedup(list.length));
        case "sessions": return s;
        case "bounce": return s ? sum("bounces") / s * 100 : 0;
        case "duration": return s ? sum("dur") / s : 0;
        case "signups": return sum("signups");
        case "conversion": var v = sum("visitors"); return v ? sum("newPayers") / v * 100 : 0;
        case "revenue": return sum("revenue");
        default: return 0;
      }
    });
    return { keys: keys, values: vals };
  }

  function campaigns(D, agg, f) {
    var n = agg.days, rows = [], i;
    var filteredShare = zeros(n * NS);
    for (var d = 0; d < n; d++) {
      var di = agg.from - D.start + d;
      for (var s = 0; s < NS; s++) {
        var tot = D.srcTotal[di * NS + s];
        filteredShare[d * NS + s] = tot ? agg.srcDaily[d * NS + s] / tot : 0;
      }
    }
    for (var c = 0; c < NCAMP; c++) {
      var camp = CAMPAIGNS[c], sess = 0;
      for (d = 0; d < n; d++) sess += D.campS[(agg.from - D.start + d) * NCAMP + c] * filteredShare[d * NS + camp.src];
      rows.push({ i: c, camp: camp, sessions: sess, signups: 0, payers: 0, revenue: 0, spend: camp.cpc ? sess * camp.cpc : 0 });
    }
    for (i = 0; i < agg.regs.length; i++) { var u = agg.regs[i]; if (u.camp >= 0) rows[u.camp].signups++; }
    var lo = lowerBound(D.payDay, agg.from), hi = lowerBound(D.payDay, agg.to + 1), seen = {};
    for (i = lo; i < hi; i++) {
      var pu = D.users[D.payUser[i]];
      if (pu.camp < 0 || !userOk(pu, f)) continue;
      rows[pu.camp].revenue += D.payAmt[i];
      if (!seen[pu.id]) { seen[pu.id] = 1; rows[pu.camp].payers++; }
    }
    return rows.filter(function (r) { return r.sessions >= 0.5 || r.revenue > 0; });
  }

  function pages(agg) {
    var rows = PAGES.map(function (p, i) { return { i: i, path: p[0], title: p[1], pv: 0, upv: 0, entries: 0, exits: 0, time: p[2] }; });
    for (var s = 0; s < NS; s++) {
      var S = agg.bySrc[s];
      if (!S.sessions) continue;
      var land = LAND[s], lt = 0, vt = 0, view = [], j;
      for (j = 0; j < land.length; j++) lt += land[j];
      for (j = 0; j < land.length; j++) { view[j] = land[j] / lt * 0.4 + COMMON[j] / 85 * 0.6; vt += view[j]; }
      var exW = [], et = 0;
      for (j = 0; j < land.length; j++) {
        var pvj = S.pv * view[j] / vt;
        rows[j].pv += pvj;
        rows[j].entries += S.sessions * land[j] / lt;
        exW[j] = pvj * PAGES[j][3]; et += exW[j];
      }
      for (j = 0; j < land.length; j++) rows[j].exits += et ? S.sessions * exW[j] / et : 0;
    }
    rows.forEach(function (r) { r.upv = r.pv * 0.78; r.exitRate = r.pv ? r.exits / r.pv : 0; });
    return rows;
  }

  function tech(agg) {
    var br = zeros(BROWSERS.length), os = zeros(OSES.length);
    for (var v = 0; v < NV; v++) for (var k = 0; k < NK; k++) {
      var s = agg.devCty[v * NK + k];
      if (!s) continue;
      var g = COUNTRIES[k].cis || k === 0 ? 0 : 1, i;
      for (i = 0; i < BROWSERS.length; i++) br[i] += s * BROWSER_SHARE[v][g][i];
      for (i = 0; i < OSES.length; i++) os[i] += s * OS_SHARE[v][g][i];
    }
    return { browsers: br, oses: os };
  }

  function funnel(agg) {
    var vis = agg.total.uv, pricing = 0;
    for (var s = 0; s < NS; s++) pricing += agg.bySrc[s].uv * SRC.pricing[s];
    var regs = agg.regs, act = 0, paid = 0, paid14 = 0, delays = [];
    for (var i = 0; i < regs.length; i++) {
      var u = regs[i];
      if (u.activated) act++;
      if (u.plan >= 0 && u.payStart >= 0) { paid++; delays.push(u.payStart - u.reg); if (u.payStart - u.reg <= 14) paid14++; }
    }
    delays.sort(function (x, y) { return x - y; });
    return {
      steps: [
        { name: "Визит на сайт", value: vis },
        { name: "Смотрели тарифы", value: pricing },
        { name: "Регистрация", value: regs.length },
        { name: "Первый проект", value: act },
        { name: "Оплата", value: paid }
      ],
      medianDays: delays.length ? delays[Math.floor(delays.length / 2)] : 0,
      paid14: paid14
    };
  }

  function monthStart(a) { var p = parts(a); return absOf(p.y, p.m, 1); }
  function addMonths(a, k) { var p = parts(a); var m = p.m - 1 + k; return absOf(p.y + Math.floor(m / 12), (m % 12 + 12) % 12 + 1, 1); }

  function cohorts(D, endDay, f, mode) {
    var lastM = monthStart(endDay), firstM = addMonths(lastM, -11), rows = [], i;
    for (var c = 0; c < 12; c++) {
      var ms = addMonths(firstM, c), me = addMonths(ms, 1) - 1;
      rows.push({ start: ms, end: me, size: 0, keep: zeros(12), obs: zeros(12) });
    }
    for (i = 0; i < D.users.length; i++) {
      var u = D.users[i];
      if (u.reg < firstM) continue;
      if (u.reg > endDay) break;
      if (!userOk(u, f)) continue;
      if (mode === "payers" && (u.plan < 0 || u.payStart > endDay)) continue;
      var ci = 0;
      while (ci < 11 && u.reg > rows[ci].end) ci++;
      var row = rows[ci];
      row.size++;
      var base = mode === "payers" ? u.payStart : u.reg;
      for (var k = 0; k < 12 - ci; k++) {
        var at = base + 30 * k;
        if (at > endDay) break;
        row.obs[k]++;
        if (mode === "payers" ? u.subEnd > at : u.lastActive >= at) row.keep[k]++;
      }
    }
    return rows.map(function (r, ci) {
      var cells = [];
      for (var k = 0; k < 12 - ci; k++) cells.push(r.start + 30 * k <= endDay && r.obs[k] >= 3 ? r.keep[k] / r.obs[k] : null);
      return { start: r.start, size: r.size, cells: cells };
    });
  }

  function mrr(D, f, months) {
    months = months || 18;
    var lastM = monthStart(D.end), out = [];
    for (var j = months - 1; j >= 0; j--) {
      var ms = addMonths(lastM, -j), at = j === 0 ? D.end : addMonths(ms, 1) - 1;
      out.push({ month: ms, at: at, byPlan: [0, 0, 0], newM: 0, churnM: 0, payers: 0 });
    }
    var first = out[0].month;
    for (var i = 0; i < D.users.length; i++) {
      var u = D.users[i];
      if (u.plan < 0 || !userOk(u, f)) continue;
      var price = PLANS[u.plan].price;
      for (var k = 0; k < out.length; k++) {
        var o = out[k];
        if (u.payStart <= o.at && u.subEnd > o.at) { o.byPlan[u.plan] += price; o.payers++; }
        if (u.payStart >= o.month && u.payStart <= o.at) o.newM += price;
        if (u.subEnd >= o.month && u.subEnd <= o.at && u.subEnd <= D.end && u.subEnd >= first) o.churnM += price;
      }
    }
    return out;
  }

  function usersQuery(D, agg, f, q) {
    var list = [], i, from = agg.from, to = agg.to;
    var needle = (q.search || "").trim().toLowerCase();
    for (i = 0; i < D.users.length; i++) {
      var u = D.users[i];
      if (u.reg > to) break;
      if (!userOk(u, f)) continue;
      if (q.scope === "new" && u.reg < from) continue;
      if (q.scope === "paying" && !(u.plan >= 0 && u.payStart <= to && u.subEnd > from)) continue;
      if (q.scope === "active" && u.lastActive < from) continue;
      if (needle) {
        var hay = (u.first + " " + u.last + " " + u.email + " " + COUNTRIES[u.cty].name + " " + COUNTRIES[u.cty].cities[u.city][0] + " " + (u.camp >= 0 ? CAMPAIGNS[u.camp].utm.join(" ") : "")).toLowerCase();
        if (hay.indexOf(needle) < 0) continue;
      }
      list.push(u);
    }
    var key = q.sort || "revenue", dir = q.dir === "asc" ? 1 : -1;
    var get = {
      name: function (u) { return u.last + " " + u.first; },
      revenue: function (u) { return u.revenue; },
      reg: function (u) { return u.reg; },
      last: function (u) { return u.lastActive; },
      src: function (u) { return SOURCES[u.src].name; },
      cty: function (u) { return COUNTRIES[u.cty].name; },
      plan: function (u) { return u.plan; }
    }[key] || function (u) { return u.revenue; };
    list.sort(function (x, y) {
      var a = get(x), b = get(y);
      if (a < b) return -dir;
      if (a > b) return dir;
      return y.id - x.id;
    });
    return list;
  }

  function userPayments(D, u) {
    var out = [];
    if (u.plan < 0) return out;
    for (var k = 0; k < u.nPay; k++) {
      var day = u.payStart + 30 * k;
      var amt = k === 0 && u.disc ? Math.round(PLANS[u.plan].price * (1 - u.disc)) : PLANS[u.plan].price;
      out.push({ day: day, amount: amt });
    }
    return out;
  }

  function liveBase(D, f) {
    var cells = cellsFor(f), tot = 0, all = 0;
    for (var d = 0; d < 7; d++) {
      var di = D.nd - 2 - d, b = di * NCELL;
      for (var c = 0; c < NCELL; c++) all += D.sessions[b + c];
      for (c = 0; c < cells.length; c++) tot += D.sessions[b + cells[c]];
    }
    return { perDay: tot / 7, share: all ? tot / all : 0 };
  }

  var HOURS = [0.32, 0.22, 0.16, 0.13, 0.13, 0.18, 0.3, 0.52, 0.8, 1.15, 1.38, 1.48, 1.5, 1.52, 1.5, 1.46, 1.42, 1.36, 1.3, 1.32, 1.36, 1.24, 0.92, 0.55];

  return {
    SOURCES: SOURCES, DEVICES: DEVICES, COUNTRIES: COUNTRIES, PLANS: PLANS, CAMPAIGNS: CAMPAIGNS, PAGES: PAGES,
    BROWSERS: BROWSERS, OSES: OSES, HOURS: HOURS, ND: ND,
    build: build, aggregate: aggregate, dailyMetric: dailyMetric, bucketSeries: bucketSeries, campaigns: campaigns,
    pages: pages, tech: tech, funnel: funnel, cohorts: cohorts, mrr: mrr, usersQuery: usersQuery, userPayments: userPayments,
    liveBase: liveBase, ltvAt: ltvAt, absOf: absOf, absIso: absIso, iso: iso, parts: parts, todayAbs: todayAbs,
    monthStart: monthStart, addMonths: addMonths, prng: prng, hash3: hash3
  };
})();
if (typeof module !== "undefined" && module.exports) module.exports = PulseCore;
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var C = PulseCore;
  var CDN = "https://cdn.jsdelivr.net/npm/";
  var ECHARTS_URL = CDN + "echarts@5.6.0/dist/echarts.min.js";
  var WORLD_URL = CDN + "echarts@4.9.0/map/json/world.json";
  var FONT_URL = CDN + "@fontsource-variable/manrope@5.2.8/index.css";
  var KEY = "demo-analytics:state";
  var MON = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  var MON_N = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  var MON_S = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

  var ICON = {
    overview: '<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z"/>',
    sources: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.3 10.9l7.4-3.8M8.3 13.1l7.4 3.8"/>',
    geo: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.6 3.6 5.6 3.6 8.5s-1 5.9-3.6 8.5c-2.6-2.6-3.6-5.6-3.6-8.5s1-5.9 3.6-8.5z"/>',
    tech: '<rect x="3" y="4.5" width="13" height="10" rx="1.5"/><path d="M7 19h5M9.5 14.5V19"/><rect x="16.5" y="9" width="4.5" height="10" rx="1.2"/>',
    content: '<path d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20z"/><path d="M14 3.5V8h4M9 12h6M9 15.5h6"/>',
    funnel: '<path d="M4 5h16l-6 7.5V19l-4 1.5v-8z"/>',
    retention: '<rect x="4" y="4" width="4.5" height="4.5" rx="1"/><rect x="9.75" y="4" width="4.5" height="4.5" rx="1"/><rect x="15.5" y="4" width="4.5" height="4.5" rx="1"/><rect x="4" y="9.75" width="4.5" height="4.5" rx="1"/><rect x="9.75" y="9.75" width="4.5" height="4.5" rx="1"/><rect x="4" y="15.5" width="4.5" height="4.5" rx="1"/>',
    revenue: '<path d="M4 19V5M4 19h16"/><path d="M7.5 15l3.5-4 3 2.5 5-6"/><path d="M15.5 7.5H19V11"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M3 19.5c.6-3.3 3-5 6-5s5.4 1.7 6 5"/><path d="M15.5 5.3a3.3 3.3 0 0 1 0 6.4M17.5 14.6c1.8.6 3 2.2 3.5 4.9"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    chevron: '<path d="M7 10l5 5 5-5"/>',
    x: '<path d="M7 7l10 10M17 7L7 17"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
    arrowUp: '<path d="M12 18V6M6.5 11.5L12 6l5.5 5.5"/>',
    arrowDown: '<path d="M12 6v12M6.5 12.5L12 18l5.5-5.5"/>',
    back: '<path d="M14.5 6l-6 6 6 6"/>',
    external: '<path d="M14 4h6v6M20 4l-8.5 8.5M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    reset: '<path d="M5 12a7 7 0 1 0 2.1-5"/><path d="M5 4.5V8h3.5"/>',
    sort: '<path d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4"/>'
  };

  function icon(name, cls) {
    return '<svg class="pls-i' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + ICON[name] + "</svg>";
  }

  var LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="currentColor"/><path d="M5 17.5h5.2l2.6-7.5 4.4 13 3-9 1.8 3.5H27" fill="none" stroke="#14121c" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var NF = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
  var NF1 = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  var NF2 = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function int(n) { return NF.format(Math.round(n || 0)); }
  function compact(n) {
    n = n || 0;
    var a = Math.abs(n);
    if (a >= 1e6) return NF1.format(n / 1e6).replace(",0", "") + " млн";
    if (a >= 1e4) return NF1.format(n / 1e3).replace(",0", "") + " тыс";
    return int(n);
  }
  function money(n) { return int(n) + " ₽"; }
  function moneyC(n) {
    var a = Math.abs(n || 0);
    if (a >= 1e6) return NF2.format(n / 1e6) + " млн ₽";
    if (a >= 1e5) return NF1.format(n / 1e3) + " тыс ₽";
    return int(n) + " ₽";
  }
  function pct(x, d) { return (d === 2 ? NF2 : NF1).format((x || 0) * 100) + " %"; }
  function dur(s) {
    s = Math.round(s || 0);
    var m = Math.floor(s / 60), r = s % 60;
    return m ? m + " мин " + (r < 10 ? "0" : "") + r + " с" : r + " с";
  }
  function durShort(s) { s = Math.round(s || 0); var m = Math.floor(s / 60), r = s % 60; return m + ":" + (r < 10 ? "0" : "") + r; }
  function dShort(a) { var p = C.parts(a); return p.d + " " + MON[p.m - 1]; }
  function dLong(a) { var p = C.parts(a); return p.d + " " + MON[p.m - 1] + " " + p.y; }
  function mLabel(a) { var p = C.parts(a); return MON_S[p.m - 1] + " " + String(p.y).slice(2); }
  function mLong(a) { var p = C.parts(a); return MON_N[p.m - 1] + " " + p.y; }
  function plural(n, a, b, c) { n = Math.abs(n) % 100; var n1 = n % 10; if (n > 10 && n < 20) return c; if (n1 > 1 && n1 < 5) return b; if (n1 === 1) return a; return c; }

  var KPIS = [
    { k: "visitors", name: "Посетители", fmt: compact, full: int, hint: "Уникальные посетители за период. Один человек с одного устройства считается один раз." },
    { k: "sessions", name: "Визиты", fmt: compact, full: int, hint: "Сессии: серия действий посетителя, которая прерывается после 30 минут без активности." },
    { k: "bounce", name: "Отказы", fmt: function (v) { return pct(v); }, inverse: true, hint: "Доля визитов, в которых посетитель ушел меньше чем через 15 секунд, не сделав ни одного действия." },
    { k: "duration", name: "Время на сайте", fmt: dur, hint: "Средняя длительность визита." },
    { k: "conversion", name: "Конверсия в оплату", fmt: function (v) { return pct(v, 2); }, hint: "Первые оплаты за период, деленные на уникальных посетителей." },
    { k: "revenue", name: "Выручка", fmt: moneyC, full: money, hint: "Сумма всех платежей за период: новые подписки и продления." },
    { k: "arpu", name: "ARPU", fmt: money, hint: "Выручка за период на один активный аккаунт, включая бесплатные." },
    { k: "ltv", name: "LTV", fmt: money, hint: "Сколько в среднем приносит платящий клиент за всю жизнь: средний платеж в месяц, деленный на месячный отток. Считается по 90 дням до конца периода." }
  ];
  var METRICS = [
    { k: "visitors", name: "Посетители", fmt: compact, tip: int },
    { k: "sessions", name: "Визиты", fmt: compact, tip: int },
    { k: "bounce", name: "Отказы", fmt: function (v) { return NF1.format(v) + " %"; }, tip: function (v) { return NF1.format(v) + " %"; } },
    { k: "duration", name: "Время", fmt: durShort, tip: dur },
    { k: "signups", name: "Регистрации", fmt: compact, tip: int },
    { k: "conversion", name: "Конверсия", fmt: function (v) { return NF2.format(v) + " %"; }, tip: function (v) { return NF2.format(v) + " %"; } },
    { k: "revenue", name: "Выручка", fmt: function (v) { return compact(v); }, tip: money }
  ];
  var NAV = [
    ["overview", "Обзор"], ["sources", "Источники"], ["geo", "География"], ["tech", "Технологии"], ["content", "Контент"],
    ["funnel", "Воронка"], ["retention", "Удержание"], ["revenue", "Выручка"], ["users", "Пользователи"]
  ];
  var PERIODS = [["7", "7 дней"], ["30", "30 дней"], ["90", "90 дней"], ["365", "Год"]];

  var D, cur, prev, state, root, mainEl, charts = {}, observers = [], mapState = 0, live = null, lastTheme = null;

  function defaults() {
    return {
      period: "30", from: null, to: null, compare: true, metric: "visitors", gran: "auto",
      f: { src: [], dev: [], cty: [] },
      srcMetric: "sessions", geoMetric: "visitors", geoCountry: 0, pageTab: "pv", campTab: "all",
      campSort: { k: "revenue", d: "desc" }, cohort: "users",
      users: { scope: "active", search: "", sort: "revenue", dir: "desc", page: 0 }
    };
  }

  function loadState() {
    var s = defaults();
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (raw && typeof raw === "object") {
        Object.keys(s).forEach(function (k) { if (raw[k] !== undefined && typeof raw[k] === typeof s[k]) s[k] = raw[k]; });
        ["src", "dev", "cty"].forEach(function (k) { if (!Array.isArray(s.f[k])) s.f[k] = []; });
        s.users.search = "";
        s.users.page = 0;
      }
    } catch (e) { s = defaults(); }
    return s;
  }
  function saveState() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  function range() {
    var end = D.end, from, to = end;
    if (state.period === "custom" && state.from && state.to) {
      from = Math.max(D.start, C.absIso(state.from));
      to = Math.min(end, C.absIso(state.to));
      if (to < from) { var t = from; from = to; to = t; }
    } else {
      var n = +state.period || 30;
      from = end - n + 1;
    }
    return { from: from, to: to, n: to - from + 1 };
  }

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function $(sel, ctx) { return (ctx || root).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || root).querySelectorAll(sel)); }

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src; s.async = true; s.crossOrigin = "anonymous";
      s.onload = res; s.onerror = function () { rej(new Error(src)); };
      document.head.appendChild(s);
    });
  }
  function loadCss(href) {
    var l = document.createElement("link");
    l.rel = "stylesheet"; l.href = href; l.crossOrigin = "anonymous";
    document.head.appendChild(l);
  }

  function cv(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function pal() { return [cv("--c1"), cv("--c2"), cv("--c3"), cv("--c4"), cv("--c5"), cv("--c6")]; }
  function seq() { return [cv("--q1"), cv("--q2"), cv("--q3"), cv("--q4"), cv("--q5")]; }
  function isDark() { return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; }

  function baseOpt() {
    var ink = cv("--ink"), muted = cv("--muted");
    return {
      animationDuration: 500, animationDurationUpdate: 350,
      textStyle: { fontFamily: "'Manrope Variable', Manrope, system-ui, sans-serif", color: muted, fontSize: 11 },
      tooltip: {
        backgroundColor: cv("--tip"), borderColor: cv("--line"), borderWidth: 1, padding: [9, 12],
        textStyle: { color: ink, fontSize: 12, fontFamily: "'Manrope Variable', Manrope, system-ui, sans-serif" },
        extraCssText: "border-radius:10px;box-shadow:0 10px 30px -12px rgba(20,16,40,.35);"
      }
    };
  }
  function axisCommon() {
    return {
      axisLine: { lineStyle: { color: cv("--line") } }, axisTick: { show: false },
      axisLabel: { color: cv("--muted"), fontSize: 11 },
      splitLine: { lineStyle: { color: cv("--grid"), type: [3, 4] } }
    };
  }
  function merge(a, b) { Object.keys(b).forEach(function (k) { a[k] = b[k]; }); return a; }

  function chart(id) {
    var host = document.getElementById(id);
    if (!host) return null;
    var c = charts[id];
    if (c && c.getDom() === host && !c.isDisposed()) return c;
    if (c && !c.isDisposed()) c.dispose();
    c = window.echarts.init(host, null, { renderer: "canvas" });
    charts[id] = c;
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { if (!c.isDisposed()) c.resize(); });
      ro.observe(host);
      observers.push(ro);
    }
    return c;
  }
  function setChart(id, opt) { var c = chart(id); if (c) c.setOption(merge(baseOpt(), opt), true); return c; }

  function shell() {
    var nav = NAV.map(function (n) {
      return '<a class="pls-nav__item" href="#pls-' + n[0] + '" data-nav="' + n[0] + '">' + icon(n[0]) + "<span>" + n[1] + "</span></a>";
    }).join("");
    var periods = PERIODS.map(function (p) { return '<button type="button" class="pls-seg__btn" data-period="' + p[0] + '">' + p[1] + "</button>"; }).join("");
    root.innerHTML =
      '<aside class="pls-side">' +
        '<div class="pls-brand"><span class="pls-brand__logo">' + LOGO + '</span><span class="pls-brand__name">Пульс</span><span class="pls-brand__tag">аналитика</span></div>' +
        '<div class="pls-site"><span class="pls-site__fav">К</span><span class="pls-site__meta"><b>kadr.studio</b><small>Видеоредактор в браузере</small></span></div>' +
        '<nav class="pls-nav" aria-label="Разделы отчета">' + nav + "</nav>" +
        '<div class="pls-side__live" data-jump="overview"><span class="pls-dot"></span><span><b data-live-mini>—</b> на сайте сейчас</span></div>' +
        '<a class="pls-side__back" href="/docs/v2/ru/guides/demo/">' + icon("back") + "<span>Все демо</span></a>" +
      "</aside>" +
      '<div class="pls-main" id="pls-main">' +
        '<header class="pls-bar">' +
          '<div class="pls-bar__row">' +
            '<a class="pls-bar__back" href="/docs/v2/ru/guides/demo/" aria-label="Все демо">' + icon("back") + "</a>" +
            '<span class="pls-bar__logo">' + LOGO + "</span>" +
            '<div class="pls-bar__title"><h2>Сводка по сайту</h2><span class="pls-bar__range" data-range></span></div>' +
            '<div class="pls-bar__tools">' +
              '<div class="pls-seg" role="group" aria-label="Период">' + periods +
                '<button type="button" class="pls-seg__btn pls-seg__btn--cal" data-period="custom">' + icon("calendar") + '<span data-custom-label>Свой</span></button>' +
              "</div>" +
              '<label class="pls-switch"><input type="checkbox" data-compare><span class="pls-switch__track"><i></i></span><span>Сравнить</span></label>' +
            "</div>" +
          "</div>" +
          '<div class="pls-filters">' +
            '<button type="button" class="pls-fbtn" data-dim="src">' + icon("filter") + '<span>Источник</span><em data-count="src"></em>' + icon("chevron", "pls-i--s") + "</button>" +
            '<button type="button" class="pls-fbtn" data-dim="dev"><span>Устройство</span><em data-count="dev"></em>' + icon("chevron", "pls-i--s") + "</button>" +
            '<button type="button" class="pls-fbtn" data-dim="cty"><span>Страна</span><em data-count="cty"></em>' + icon("chevron", "pls-i--s") + "</button>" +
            '<div class="pls-chips" data-chips></div>' +
            '<button type="button" class="pls-reset" data-reset hidden>' + icon("reset") + "<span>Сбросить</span></button>" +
            '<span class="pls-seglabel" data-seglabel></span>' +
          "</div>" +
          '<nav class="pls-tabs" aria-label="Разделы">' + NAV.map(function (n) { return '<a href="#pls-' + n[0] + '" data-nav="' + n[0] + '">' + n[1] + "</a>"; }).join("") + "</nav>" +
        "</header>" +
        '<div class="pls-content">' + sections() + '<footer class="pls-foot">Демо-данные: вымышленный сайт kadr.studio, ' + C.ND + ' дней истории. Отчеты собраны на Apache ECharts.</footer></div>' +
      "</div>" +
      '<aside class="pls-drawer" data-drawer hidden aria-label="Карточка пользователя"></aside>' +
      '<div class="pls-scrim" data-scrim hidden></div>';
  }

  function card(cls, title, sub, tools, body) {
    return '<section class="pls-card ' + cls + '"><div class="pls-card__head"><div class="pls-card__titles"><h3>' + title + "</h3>" + (sub ? '<p data-sub>' + sub + "</p>" : "") + "</div>" + (tools ? '<div class="pls-card__tools">' + tools + "</div>" : "") + "</div>" + body + "</section>";
  }
  function seg(name, items, small) {
    return '<div class="pls-mini' + (small ? " pls-mini--s" : "") + '" role="group" data-seg="' + name + '">' + items.map(function (i) { return '<button type="button" data-v="' + i[0] + '">' + i[1] + "</button>"; }).join("") + "</div>";
  }

  function sections() {
    var kp = KPIS.map(function (k) {
      return '<button type="button" class="pls-kpi" data-kpi="' + k.k + '" title="' + esc(k.hint) + '"><span class="pls-kpi__name">' + k.name + icon("info", "pls-i--s") + '</span><span class="pls-kpi__val" data-v></span><span class="pls-kpi__row"><span class="pls-delta" data-d></span><span class="pls-kpi__prev" data-p></span></span><span class="pls-kpi__spark" id="pls-sp-' + k.k + '"></span></button>';
    }).join("");
    return '' +
      '<div class="pls-sec" id="pls-overview" data-sec="overview">' +
        '<div class="pls-kpis">' + kp + "</div>" +
        '<div class="pls-grid">' +
          card("pls-span-8", "Посещаемость", "", seg("metric", METRICS.map(function (m) { return [m.k, m.name]; })) + seg("gran", [["auto", "Авто"], ["day", "Дни"], ["week", "Недели"], ["month", "Месяцы"]], true), '<div class="pls-legend" data-traffic-legend></div><div class="pls-chart pls-chart--tall pls-chart--fill" id="pls-traffic"></div>') +
          '<section class="pls-card pls-span-4 pls-live"><div class="pls-card__head"><div class="pls-card__titles"><h3><span class="pls-dot"></span>Сейчас на сайте</h3><p>Посетители за последние 15 минут</p></div></div>' +
            '<div class="pls-live__top"><span class="pls-live__num" data-live-num>—</span><span class="pls-live__split" data-live-split></span></div>' +
            '<div class="pls-chart pls-chart--live" id="pls-live-bars"></div><div class="pls-live__axis"><span>30 мин назад</span><span>сейчас</span></div>' +
            '<div class="pls-live__lists"><div><h4>Страницы</h4><ol data-live-pages></ol></div><div><h4>Страны</h4><ol data-live-cty></ol></div></div>' +
            '<div class="pls-feed" data-feed aria-live="off"></div>' +
          "</section>" +
        "</div>" +
      "</div>" +
      '<div class="pls-sec" id="pls-sources" data-sec="sources"><div class="pls-sec__head"><h2>Источники трафика</h2><p>Откуда приходят посетители и сколько денег приносит каждый канал. Клик по строке включает фильтр.</p></div>' +
        '<div class="pls-grid">' +
          card("pls-span-4", "Доля каналов", "", seg("srcMetric", [["sessions", "Визиты"], ["signups", "Регистрации"], ["revenue", "Выручка"]], true), '<div class="pls-chart" id="pls-src-donut"></div>') +
          card("pls-span-8", "Каналы", "", "", '<div class="pls-table-wrap"><table class="pls-table" data-src-table></table></div>') +
          card("pls-span-12", "UTM-кампании", "Визиты, регистрации и выручка по меткам utm_source, utm_medium и utm_campaign", seg("campTab", [["all", "Все"], ["3", "Реклама"], ["2", "Соцсети"], ["5", "Email"], ["4", "Рефералы"]], true), '<div class="pls-table-wrap"><table class="pls-table pls-table--camp" data-camp-table></table></div>') +
        "</div></div>" +
      '<div class="pls-sec" id="pls-geo" data-sec="geo"><div class="pls-sec__head"><h2>География</h2><p>Страны и города посетителей. Карту можно двигать и приближать, клик по стране показывает ее города.</p></div>' +
        '<div class="pls-grid">' +
          card("pls-span-8", "Карта", "", seg("geoMetric", [["visitors", "Посетители"], ["revenue", "Выручка"], ["conversion", "Конверсия"]], true), '<div class="pls-chart pls-chart--map" id="pls-map"><div class="pls-chart__wait">Загружаем карту мира…</div></div>') +
          card("pls-span-4 pls-geo-list", "Страны", "", "", '<div class="pls-rank" data-cty-list></div>') +
          card("pls-span-12", "Города", "", '<button type="button" class="pls-ghost" data-cty-filter></button>', '<div class="pls-cities" data-cities></div>') +
        "</div></div>" +
      '<div class="pls-sec" id="pls-tech" data-sec="tech"><div class="pls-sec__head"><h2>Технологии</h2><p>На чем смотрят сайт: тип устройства, браузер и операционная система.</p></div>' +
        '<div class="pls-grid">' +
          card("pls-span-4", "Устройства", "Клик по сектору включает фильтр", "", '<div class="pls-chart pls-chart--fill" id="pls-dev"></div><div class="pls-devstats" data-devstats></div>') +
          card("pls-span-4", "Браузеры", "", "", '<div class="pls-chart pls-chart--bars pls-chart--fill" id="pls-br"></div>') +
          card("pls-span-4", "Операционные системы", "", "", '<div class="pls-chart pls-chart--bars pls-chart--fill" id="pls-os"></div>') +
        "</div></div>" +
      '<div class="pls-sec" id="pls-content" data-sec="content"><div class="pls-sec__head"><h2>Контент</h2><p>Какие страницы смотрят, с каких начинают визит и на каких уходят.</p></div>' +
        '<div class="pls-grid">' +
          card("pls-span-12", "Страницы", "", seg("pageTab", [["pv", "Популярные"], ["entries", "Страницы входа"], ["exits", "Страницы выхода"]], true), '<div class="pls-table-wrap"><table class="pls-table" data-pages></table></div>') +
        "</div></div>" +
      '<div class="pls-sec" id="pls-funnel" data-sec="funnel"><div class="pls-sec__head"><h2>Воронка регистрации и оплаты</h2><p>Путь от визита до первой оплаты для тех, кто пришел за выбранный период.</p></div>' +
        '<div class="pls-grid">' +
          card("pls-span-7", "Шаги воронки", "", "", '<div class="pls-chart pls-chart--funnel pls-chart--fill" id="pls-funnel-chart"></div>') +
          card("pls-span-5", "Где теряем", "", "", '<div class="pls-steps" data-steps></div><div class="pls-chart pls-chart--small" id="pls-funnel-src"></div>') +
        "</div></div>" +
      '<div class="pls-sec" id="pls-retention" data-sec="retention"><div class="pls-sec__head"><h2>Удержание</h2><p>Какая доля пользователей возвращается через месяц, два и дальше после регистрации или первой оплаты.</p></div>' +
        '<div class="pls-grid">' +
          card("pls-span-12", "Когорты по месяцу", "", seg("cohort", [["users", "Все пользователи"], ["payers", "Платящие"]], true), '<div class="pls-scroll-x"><div class="pls-chart pls-chart--cohort" id="pls-cohort"></div></div>') +
        "</div></div>" +
      '<div class="pls-sec" id="pls-revenue" data-sec="revenue"><div class="pls-sec__head"><h2>Выручка и подписки</h2><p>Ежемесячная регулярная выручка по тарифам, приток и отток подписок.</p></div>' +
        '<div class="pls-mrrk" data-mrrk></div>' +
        '<div class="pls-grid">' +
          card("pls-span-8", "MRR по тарифам", "На конец каждого месяца", "", '<div class="pls-legend" data-mrr-legend></div><div class="pls-chart pls-chart--tall" id="pls-mrr"></div>') +
          card("pls-span-4", "Тарифы за период", "", "", '<div class="pls-chart pls-chart--donut-s" id="pls-plans"></div><div data-plan-table></div>') +
          card("pls-span-12", "Движение MRR", "Новые подписки и отток по месяцам", "", '<div class="pls-chart" id="pls-mrr-move"></div>') +
        "</div></div>" +
      '<div class="pls-sec" id="pls-users" data-sec="users"><div class="pls-sec__head"><h2>Пользователи</h2><p>Кто зарегистрировался, откуда пришел и сколько принес. Клик по строке открывает карточку.</p></div>' +
        '<section class="pls-card pls-users">' +
          '<div class="pls-users__bar"><label class="pls-search">' + icon("search") + '<input type="search" placeholder="Имя, почта, город или кампания" data-user-search aria-label="Поиск пользователей"></label>' +
            seg("scope", [["active", "Активные"], ["new", "Новые"], ["paying", "Платящие"], ["all", "Все"]], true) + '<label class="pls-sortsel"><span>Сортировка</span><select data-user-sortsel aria-label="Сортировка"><option value="revenue:desc">Больше принесли</option><option value="revenue:asc">Меньше принесли</option><option value="reg:desc">Новые регистрации</option><option value="reg:asc">Старые регистрации</option><option value="last:desc">Недавний визит</option><option value="name:asc">По имени</option></select></label><span class="pls-users__count" data-user-count></span></div>' +
          '<div class="pls-table-wrap"><table class="pls-table pls-table--users" data-users></table></div>' +
          '<div class="pls-pager" data-pager></div>' +
        "</section></div>";
  }

  function markSegs() {
    $$("[data-seg]").forEach(function (g) {
      var name = g.getAttribute("data-seg");
      var val = name === "scope" ? state.users.scope : String(state[name]);
      $$("button", g).forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-v") === val); b.setAttribute("aria-pressed", b.getAttribute("data-v") === val ? "true" : "false"); });
    });
    $$("[data-period]").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-period") === state.period); });
    $("[data-compare]").checked = !!state.compare;
  }

  function filterLabel() {
    var f = state.f, parts = [];
    if (f.src.length) parts.push(f.src.map(function (i) { return C.SOURCES[i].short; }).join(", "));
    if (f.dev.length) parts.push(f.dev.map(function (i) { return C.DEVICES[i].name; }).join(", "));
    if (f.cty.length) parts.push(f.cty.map(function (i) { return C.COUNTRIES[i].name; }).join(", "));
    return parts;
  }

  function renderFilters() {
    var f = state.f, chips = [];
    ["src", "dev", "cty"].forEach(function (dim) {
      var list = dim === "src" ? C.SOURCES : dim === "dev" ? C.DEVICES : C.COUNTRIES;
      f[dim].forEach(function (i) {
        chips.push('<span class="pls-chip pls-chip--' + dim + '">' + esc(list[i].short || list[i].name) + '<button type="button" aria-label="Убрать фильтр ' + esc(list[i].name) + '" data-unchip="' + dim + ":" + i + '">' + icon("x") + "</button></span>");
      });
      var cnt = $('[data-count="' + dim + '"]');
      cnt.textContent = f[dim].length ? f[dim].length : "";
      cnt.parentNode.classList.toggle("is-on", f[dim].length > 0);
    });
    $("[data-chips]").innerHTML = chips.join("");
    var any = chips.length > 0;
    $("[data-reset]").hidden = !any;
    $("[data-seglabel]").textContent = any ? "Сегмент: " + int(cur.total.sessions) + " " + plural(cur.total.sessions, "визит", "визита", "визитов") : "Все посетители";
  }

  function recompute() {
    var r = range();
    var f = state.f;
    cur = C.aggregate(D, r.from, r.to, f);
    var pf = r.from - r.n, pt = r.from - 1;
    prev = pf >= D.start ? C.aggregate(D, pf, pt, f) : null;
  }

  function update(opts) {
    opts = opts || {};
    recompute();
    saveState();
    markSegs();
    renderFilters();
    var r = range();
    $("[data-range]").textContent = dLong(r.from) + " — " + dLong(r.to) + " · " + r.n + " " + plural(r.n, "день", "дня", "дней");
    $("[data-custom-label]").textContent = state.period === "custom" ? dShort(r.from) + " — " + dShort(r.to) : "Свой";
    var jobs = [renderKpis, renderTraffic, renderSources, renderCampaigns, renderGeo, renderTech, renderPages, renderFunnel, renderCohorts, renderRevenue, renderUsers];
    jobs.forEach(function (fn) { try { fn(); } catch (e) { if (window.console) console.warn("pulse", fn.name, e); } });
    if (live) live.retarget();
  }

  function delta(curV, prevV, inverse) {
    if (prevV == null || !isFinite(prevV) || prevV === 0) return { cls: "na" };
    var d = (curV - prevV) / Math.abs(prevV);
    var good = inverse ? d < 0 : d > 0;
    var flat = Math.abs(d) < 0.005;
    var cls = flat ? "flat" : good ? "up" : "down";
    return { cls: cls, text: (d > 0 ? "+" : d < 0 ? "−" : "") + NF1.format(Math.abs(d) * 100) + " %", arrow: d >= 0 ? "arrowUp" : "arrowDown" };
  }

  function renderKpis() {
    var c = pal();
    KPIS.forEach(function (k, idx) {
      var node = $('[data-kpi="' + k.k + '"]');
      var v = cur.kpi[k.k], pv = prev ? prev.kpi[k.k] : null;
      node.querySelector("[data-v]").textContent = k.fmt(v);
      node.querySelector("[data-v]").title = k.full ? k.full(v) : "";
      var dd = delta(v, pv, k.inverse), dn = node.querySelector("[data-d]");
      if (dd.cls === "na") { dn.className = "pls-delta pls-delta--na"; dn.textContent = "без сравнения"; dn.title = "Для сравнения нужен такой же период до выбранного, а данные начинаются " + dLong(D.start); }
      else { dn.className = "pls-delta pls-delta--" + dd.cls; dn.innerHTML = icon(dd.arrow, "pls-i--s") + dd.text; }
      node.querySelector("[data-p]").textContent = pv != null ? "было " + k.fmt(pv) : "";
      node.classList.toggle("is-on", state.metric === k.k);
      var data;
      if (k.k === "ltv") {
        data = [];
        for (var j = 7; j >= 0; j--) data.push(C.ltvAt(D, cur.to - j * Math.max(1, Math.floor(cur.days / 8)), state.f));
      } else if (k.k === "arpu") {
        data = C.bucketSeries(cur, "revenue", cur.days > 60 ? "week" : "day").values;
      } else {
        data = C.bucketSeries(cur, k.k, cur.days > 120 ? "week" : "day").values;
      }
      var col = dd.cls === "down" ? cv("--bad") : c[0];
      setChart("pls-sp-" + k.k, {
        animation: false, tooltip: { show: false },
        grid: { left: 0, right: 0, top: 2, bottom: 2 },
        xAxis: { type: "category", show: false, boundaryGap: false, data: data.map(function (_, i) { return i; }) },
        yAxis: { type: "value", show: false, scale: true },
        series: [{ type: "line", data: data, showSymbol: false, smooth: 0.3, lineStyle: { width: 1.6, color: col }, areaStyle: { color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: hexA(col, 0.22) }, { offset: 1, color: hexA(col, 0) }]) } }]
      });
    });
  }

  function hexA(hex, a) {
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map(function (x) { return x + x; }).join("");
    var n = parseInt(hex, 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }

  function gran() {
    if (state.gran !== "auto") return state.gran;
    return cur.days <= 92 ? "day" : cur.days <= 200 ? "week" : "week";
  }

  function renderTraffic() {
    var m = METRICS.filter(function (x) { return x.k === state.metric; })[0] || METRICS[0];
    var g = gran();
    var s1 = C.bucketSeries(cur, m.k, g);
    var s2 = prev && state.compare ? C.bucketSeries(prev, m.k, g) : null;
    var labels = s1.keys.map(function (a) { return g === "month" ? mLabel(a) : dShort(a); });
    var c = pal();
    var series = [{
      name: "Текущий период", type: "line", data: s1.values, smooth: 0.25, showSymbol: s1.values.length < 40, symbolSize: 6,
      lineStyle: { width: 2.2, color: c[0] }, itemStyle: { color: c[0], borderColor: cv("--panel"), borderWidth: 2 },
      areaStyle: { color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: hexA(c[0], 0.24) }, { offset: 1, color: hexA(c[0], 0.01) }]) },
      emphasis: { focus: "none" }, z: 3
    }];
    if (g === "day") {
      var lines = [];
      C.CAMPAIGNS.forEach(function (cp) {
        if (!cp.start) return;
        var a = C.absIso(cp.start);
        if (a >= cur.from && a <= cur.to) lines.push({ xAxis: a - cur.from, name: cp.name });
      });
      if (lines.length) {
        series[0].markLine = {
          symbol: ["none", "none"], silent: true, animation: false,
          lineStyle: { color: cv("--muted"), type: [2, 4], width: 1 },
          label: { show: true, position: "insideEndTop", formatter: "{b}", color: cv("--muted"), fontSize: 10, fontWeight: 600 },
          data: lines
        };
      }
    }
    if (s2) {
      series.push({
        name: "Прошлый период", type: "line", data: s2.values.slice(0, s1.values.length), smooth: 0.25, showSymbol: false,
        lineStyle: { width: 1.6, type: [5, 4], color: cv("--cmp") }, itemStyle: { color: cv("--cmp") }, z: 2
      });
    }
    var leg = '<span class="pls-legend__i"><i style="background:' + c[0] + '"></i>' + esc(m.name) + ", " + dShort(cur.from) + " — " + dShort(cur.to) + "</span>";
    if (s2) leg += '<span class="pls-legend__i pls-legend__i--dash"><i style="border-color:' + cv("--cmp") + '"></i>' + dShort(prev.from) + " — " + dShort(prev.to) + "</span>";
    $("[data-traffic-legend]").innerHTML = leg;
    var ax = axisCommon();
    setChart("pls-traffic", {
      grid: { left: 8, right: 14, top: 28, bottom: 6, containLabel: true },
      tooltip: {
        trigger: "axis", axisPointer: { type: "line", lineStyle: { color: cv("--muted"), type: [3, 3] } },
        formatter: function (ps) {
          var i = ps[0].dataIndex, a = s1.keys[i];
          var lab = g === "month" ? mLong(a) : g === "week" ? "Неделя с " + dLong(a) : dLong(a) + ", " + ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][C.parts(a).w];
          var html = '<div class="pls-tt"><b>' + lab + "</b>";
          html += '<div class="pls-tt__row"><i style="background:' + c[0] + '"></i>' + m.name + "<em>" + m.tip(s1.values[i]) + "</em></div>";
          if (s2 && s2.values[i] != null) {
            var b = s2.keys[i];
            var lab2 = g === "month" ? mLong(b) : dShort(b);
            var dv = s2.values[i] ? (s1.values[i] - s2.values[i]) / s2.values[i] : 0;
            html += '<div class="pls-tt__row pls-tt__row--m"><i class="pls-tt__dash"></i>' + lab2 + "<em>" + m.tip(s2.values[i]) + "</em></div>";
            html += '<div class="pls-tt__d ' + ((m.k === "bounce" ? dv < 0 : dv > 0) ? "is-up" : "is-down") + '">' + (dv >= 0 ? "+" : "−") + NF1.format(Math.abs(dv) * 100) + " % к прошлому</div>";
          }
          return html + "</div>";
        }
      },
      xAxis: merge(merge({}, ax), { type: "category", data: labels, boundaryGap: false, splitLine: { show: false }, axisLabel: { color: cv("--muted"), fontSize: 11, hideOverlap: true } }),
      yAxis: merge(merge({}, ax), { type: "value", axisLine: { show: false }, axisLabel: { color: cv("--muted"), fontSize: 11, formatter: m.fmt }, scale: m.k === "bounce" || m.k === "duration" }),
      series: series
    });
  }

  function renderSources() {
    var c = pal(), key = state.srcMetric;
    var vals = cur.bySrc.map(function (s) { return key === "sessions" ? s.sessions : key === "signups" ? s.signups : s.revenue; });
    var total = vals.reduce(function (a, b) { return a + b; }, 0);
    var fmt = key === "revenue" ? moneyC : function (v) { return compact(v); };
    var donut = setChart("pls-src-donut", {
      tooltip: { trigger: "item", formatter: function (p) { return '<div class="pls-tt"><b>' + p.name + '</b><div class="pls-tt__row"><i style="background:' + p.color + '"></i>' + (key === "revenue" ? money(p.value) : int(p.value)) + "<em>" + NF1.format(p.percent) + " %</em></div></div>"; } },
      title: { text: fmt(total), subtext: key === "sessions" ? "визитов" : key === "signups" ? "регистраций" : "выручка", left: "center", top: "39%", textStyle: { color: cv("--ink"), fontSize: 20, fontWeight: 800 }, subtextStyle: { color: cv("--muted"), fontSize: 11 }, itemGap: 4 },
      series: [{
        type: "pie", radius: ["58%", "82%"], center: ["50%", "50%"], avoidLabelOverlap: true, padAngle: 1.5,
        itemStyle: { borderRadius: 5, borderColor: cv("--panel"), borderWidth: 2 },
        label: { show: false }, emphasis: { scale: true, scaleSize: 4 },
        data: C.SOURCES.map(function (s, i) {
          var on = !state.f.src.length || state.f.src.indexOf(i) >= 0;
          return { name: s.name, value: Math.round(vals[i]), itemStyle: { color: on ? c[i] : hexA(c[i], 0.2) } };
        })
      }]
    });
    if (donut && !donut.__bound) {
      donut.__bound = true;
      donut.on("click", function (p) { toggleFilter("src", C.SOURCES.map(function (s) { return s.name; }).indexOf(p.name)); });
    }
    var maxS = Math.max.apply(null, cur.bySrc.map(function (s) { return s.sessions; })) || 1;
    var rows = cur.bySrc.map(function (s, i) {
      var p = prev ? prev.bySrc[i] : null;
      var d = delta(s.sessions, p ? p.sessions : null);
      var on = state.f.src.indexOf(i) >= 0;
      return '<tr class="pls-row' + (on ? " is-on" : "") + '" data-toggle="src:' + i + '" tabindex="0">' +
        '<td><span class="pls-sw" style="background:' + c[i] + '"></span><b>' + C.SOURCES[i].name + '</b><span class="pls-bar-in"><i style="width:' + (s.sessions / maxS * 100).toFixed(1) + "%;background:" + c[i] + '"></i></span></td>' +
        '<td class="n">' + int(s.uv) + "</td>" +
        '<td class="n">' + int(s.sessions) + (d.cls !== "na" ? ' <small class="pls-tx--' + d.cls + '">' + d.text + "</small>" : "") + "</td>" +
        '<td class="n">' + pct(s.sessions ? s.bounces / s.sessions : 0) + "</td>" +
        '<td class="n">' + durShort(s.sessions ? s.dur / s.sessions : 0) + "</td>" +
        '<td class="n">' + pct(s.uv ? s.newPayers / s.uv : 0, 2) + "</td>" +
        '<td class="n"><b>' + money(s.revenue) + "</b></td></tr>";
    }).join("");
    $("[data-src-table]").innerHTML = "<thead><tr><th>Канал</th><th class=n>Посетители</th><th class=n>Визиты</th><th class=n>Отказы</th><th class=n>Время</th><th class=n>Конверсия</th><th class=n>Выручка</th></tr></thead><tbody>" + rows + "</tbody>";
  }

  function renderCampaigns() {
    var rows = C.campaigns(D, cur, state.f);
    if (state.campTab !== "all") rows = rows.filter(function (r) { return String(r.camp.src) === state.campTab; });
    var k = state.campSort.k, dir = state.campSort.d === "asc" ? 1 : -1;
    rows.forEach(function (r) { r.romi = r.spend ? (r.revenue - r.spend) / r.spend : null; r.cr = r.sessions ? r.signups / r.sessions : 0; r.name = r.camp.utm[2]; });
    rows.sort(function (a, b) { var x = a[k], y = b[k]; if (x == null) x = -Infinity; if (y == null) y = -Infinity; return x < y ? -dir : x > y ? dir : 0; });
    var c = pal();
    var cols = [["name", "Кампания"], ["sessions", "Визиты"], ["signups", "Регистрации"], ["cr", "CR"], ["payers", "Платящие"], ["revenue", "Выручка"], ["spend", "Расход"], ["romi", "ROMI"]];
    var head = "<thead><tr>" + cols.map(function (cl, i) {
      var on = k === cl[0];
      return "<th" + (i ? " class=n" : "") + ' aria-sort="' + (on ? (dir > 0 ? "ascending" : "descending") : "none") + '"><button type="button" data-csort="' + cl[0] + '"' + (on ? ' class="is-on"' : "") + ">" + cl[1] + (on ? icon(dir > 0 ? "arrowUp" : "arrowDown", "pls-i--s") : "") + "</button></th>";
    }).join("") + "</tr></thead>";
    var body = rows.length ? rows.map(function (r) {
      var u = r.camp.utm;
      var romi = r.romi == null ? '<span class="pls-muted">—</span>' : '<span class="pls-pill pls-pill--' + (r.romi >= 0 ? "up" : "down") + '">' + (r.romi >= 0 ? "+" : "−") + int(Math.abs(r.romi) * 100) + " %</span>";
      return '<tr><td><span class="pls-sw" style="background:' + c[r.camp.src] + '"></span><span class="pls-camp"><b>' + esc(r.camp.name) + '</b><code>' + esc(u[0]) + " / " + esc(u[1]) + " / " + esc(u[2]) + "</code></span>" + (r.camp.start ? '<span class="pls-tag">' + dShort(C.absIso(r.camp.start)) + "</span>" : "") + "</td>" +
        '<td class="n">' + int(r.sessions) + '</td><td class="n">' + int(r.signups) + '</td><td class="n">' + pct(r.cr, 2) + '</td><td class="n">' + int(r.payers) + '</td><td class="n"><b>' + money(r.revenue) + '</b></td><td class="n">' + (r.spend ? money(r.spend) : '<span class="pls-muted">—</span>') + '</td><td class="n">' + romi + "</td></tr>";
    }).join("") : '<tr><td colspan="8" class="pls-empty">В этом сегменте нет визитов с UTM-метками</td></tr>';
    $("[data-camp-table]").innerHTML = head + "<tbody>" + body + "</tbody>";
  }

  function geoValue(i) {
    var s = cur.byCty[i];
    return state.geoMetric === "revenue" ? s.revenue : state.geoMetric === "conversion" ? (s.uv ? s.newPayers / s.uv * 100 : 0) : s.uv;
  }
  function geoFmt(v) { return state.geoMetric === "revenue" ? money(v) : state.geoMetric === "conversion" ? NF2.format(v) + " %" : int(v); }

  function renderGeo() {
    var order = C.COUNTRIES.map(function (_, i) { return i; }).sort(function (a, b) { return geoValue(b) - geoValue(a); });
    var max = geoValue(order[0]) || 1;
    var c = pal();
    $("[data-cty-list]").innerHTML = order.map(function (i, n) {
      var v = geoValue(i), on = state.geoCountry === i;
      return '<button type="button" class="pls-rank__row' + (on ? " is-on" : "") + (state.f.cty.indexOf(i) >= 0 ? " is-filter" : "") + '" data-country="' + i + '"><span class="pls-rank__n">' + (n + 1) + '</span><span class="pls-rank__name">' + C.COUNTRIES[i].name + '</span><span class="pls-rank__v">' + geoFmt(v) + '</span><span class="pls-rank__bar"><i style="width:' + Math.max(1.5, v / max * 100).toFixed(1) + '%"></i></span></button>';
    }).join("");
    var ci = state.geoCountry, cty = C.COUNTRIES[ci], s = cur.byCty[ci];
    var flt = state.f.cty.indexOf(ci) >= 0;
    var btn = $("[data-cty-filter]");
    btn.innerHTML = icon(flt ? "x" : "filter") + "<span>" + (flt ? "Убрать фильтр" : "Только " + cty.name) + "</span>";
    btn.setAttribute("data-country-toggle", ci);
    var cities = cty.cities.map(function (cc) { return { name: cc[0], w: cc[3], other: !cc[1] }; }).sort(function (a, b) { return (a.other - b.other) || (b.w - a.w); });
    var cmax = Math.max.apply(null, cities.map(function (x) { return x.w; }));
    var titles = $("#pls-geo .pls-card:nth-child(3) h3");
    if (titles) titles.textContent = "Города · " + cty.name;
    var sub = $("#pls-geo .pls-card:nth-child(3) .pls-card__titles");
    if (sub) {
      var p = sub.querySelector("p") || sub.appendChild(el("p"));
      p.textContent = int(s.uv) + " посетителей · " + money(s.revenue) + " выручки · конверсия " + pct(s.uv ? s.newPayers / s.uv : 0, 2);
    }
    $("[data-cities]").innerHTML = cities.map(function (x) {
      return '<div class="pls-city"><span class="pls-city__name">' + x.name + '</span><span class="pls-city__bar"><i style="width:' + (x.w / cmax * 100).toFixed(1) + '%;background:' + c[0] + '"></i></span><span class="pls-city__v">' + int(s.uv * x.w) + '</span><span class="pls-city__r">' + money(s.revenue * x.w) + "</span></div>";
    }).join("");
    renderMap();
  }

  function renderMap() {
    if (mapState !== 2) return;
    var q = seq();
    var lg = state.geoMetric !== "conversion";
    var tf = function (v) { return lg ? Math.log10(1 + v) : v; };
    var raw = C.COUNTRIES.map(function (_, i) { return geoValue(i); });
    var data = C.COUNTRIES.map(function (cty, i) { return { name: cty.map, value: +tf(raw[i]).toFixed(4), ru: cty.name, i: i }; });
    var rmax = Math.max.apply(null, raw) || 1, rmin = Math.min.apply(null, raw);
    var vmax = tf(rmax) || 1, vmin = tf(rmin);
    var pts = [];
    C.COUNTRIES.forEach(function (cty, i) {
      var s = cur.byCty[i];
      cty.cities.forEach(function (cc) { if (cc[1] || cc[2]) pts.push({ name: cc[0], value: [cc[1], cc[2], Math.round(s.uv * cc[3])], cty: cty.name }); });
    });
    var pmax = Math.max.apply(null, pts.map(function (p) { return p.value[2]; })) || 1;
    var nameMap = {};
    C.COUNTRIES.forEach(function (cty) { nameMap[cty.map] = cty.name; });
    var ch = setChart("pls-map", {
      tooltip: {
        trigger: "item",
        formatter: function (p) {
          if (p.seriesType === "scatter") return '<div class="pls-tt"><b>' + p.name + '</b><div class="pls-tt__row">' + p.data.cty + "<em>" + int(p.value[2]) + " посет.</em></div></div>";
          if (!p.data) return '<div class="pls-tt"><b>' + esc(p.name) + '</b><div class="pls-tt__row pls-tt__row--m">Нет визитов</div></div>';
          var s = cur.byCty[p.data.i];
          return '<div class="pls-tt"><b>' + p.data.ru + '</b><div class="pls-tt__row">Посетители<em>' + int(s.uv) + '</em></div><div class="pls-tt__row">Выручка<em>' + money(s.revenue) + '</em></div><div class="pls-tt__row">Конверсия<em>' + pct(s.uv ? s.newPayers / s.uv : 0, 2) + "</em></div></div>";
        }
      },
      visualMap: {
        type: "continuous", min: vmin, max: vmax, left: 10, bottom: 8, itemWidth: 10, itemHeight: 90, calculable: false,
        text: [geoFmtShort(rmax), geoFmtShort(rmin)], textStyle: { color: cv("--muted"), fontSize: 10 },
        inRange: { color: q }, seriesIndex: 0
      },
      geo: {
        map: "world", roam: true, zoom: 1.12, center: [22, 22], scaleLimit: { min: 1, max: 12 }, nameMap: nameMap, top: 10, bottom: 10,
        itemStyle: { areaColor: cv("--land"), borderColor: cv("--panel"), borderWidth: 0.6 },
        emphasis: { label: { show: false }, itemStyle: { areaColor: cv("--land-h") } },
        select: { disabled: true }
      },
      series: [
        { type: "map", geoIndex: 0, data: data.map(function (d) { return { name: d.ru, value: d.value, ru: d.ru, i: d.i }; }) },
        { type: "scatter", coordinateSystem: "geo", data: pts, symbolSize: function (v) { return 4 + Math.sqrt(v[2] / pmax) * 16; }, itemStyle: { color: cv("--pin"), borderColor: cv("--panel"), borderWidth: 1.2, opacity: 0.92, shadowBlur: 6, shadowColor: "rgba(0,0,0,.25)" }, zlevel: 1 }
      ]
    });
    if (ch && !ch.__bound) {
      ch.__bound = true;
      ch.on("click", function (p) {
        if (p.seriesType === "map" && p.data) { state.geoCountry = p.data.i; saveState(); renderGeo(); }
      });
    }
  }
  function geoFmtShort(v) { return state.geoMetric === "revenue" ? compact(v) + " ₽" : state.geoMetric === "conversion" ? NF2.format(v) + " %" : compact(v); }

  function loadMap() {
    if (mapState) return;
    mapState = 1;
    fetch(WORLD_URL).then(function (r) { if (!r.ok) throw new Error("map " + r.status); return r.json(); }).then(function (geo) {
      geo.features = geo.features.filter(function (f) { return f.properties && f.properties.name && f.properties.name !== "Antarctica" && f.properties.name !== "Fr. S. Antarctic Lands"; });
      window.echarts.registerMap("world", geo);
      mapState = 2;
      var w = $("#pls-map .pls-chart__wait");
      if (w) w.remove();
      renderMap();
    }).catch(function () {
      mapState = 3;
      var w = $("#pls-map .pls-chart__wait");
      if (w) w.textContent = "Карта не загрузилась, список стран справа работает.";
    });
  }

  function renderTech() {
    var c = pal();
    var dev = setChart("pls-dev", {
      tooltip: { trigger: "item", formatter: function (p) { return '<div class="pls-tt"><b>' + p.name + '</b><div class="pls-tt__row"><i style="background:' + p.color + '"></i>' + int(p.value) + " визитов<em>" + NF1.format(p.percent) + " %</em></div></div>"; } },
      series: [{
        type: "pie", radius: ["54%", "82%"], center: ["50%", "50%"], padAngle: 2, itemStyle: { borderRadius: 6, borderColor: cv("--panel"), borderWidth: 2 },
        label: { show: false },
        data: C.DEVICES.map(function (d, i) {
          var on = !state.f.dev.length || state.f.dev.indexOf(i) >= 0;
          return { name: d.name, value: Math.round(cur.byDev[i].sessions), itemStyle: { color: on ? c[i] : hexA(c[i], 0.2) } };
        })
      }]
    });
    if (dev && !dev.__bound) {
      dev.__bound = true;
      dev.on("click", function (p) { toggleFilter("dev", C.DEVICES.map(function (d) { return d.name; }).indexOf(p.name)); });
    }
    var devTot = cur.byDev.reduce(function (a, b) { return a + b.sessions; }, 0) || 1;
    $("[data-devstats]").innerHTML = '<table class="pls-table pls-table--tight"><thead><tr><th>Устройство</th><th class=n>Доля</th><th class=n>Отказы</th><th class=n>Конверсия</th></tr></thead><tbody>' + C.DEVICES.map(function (d, i) {
      var s = cur.byDev[i];
      return '<tr class="pls-row' + (state.f.dev.indexOf(i) >= 0 ? " is-on" : "") + '" data-toggle="dev:' + i + '" tabindex="0"><td><span class="pls-sw" style="background:' + c[i] + '"></span><b>' + d.name + '</b></td><td class="n"><b>' + pct(s.sessions / devTot) + '</b></td><td class="n">' + pct(s.sessions ? s.bounces / s.sessions : 0) + '</td><td class="n">' + pct(s.uv ? s.newPayers / s.uv : 0, 2) + "</td></tr>";
    }).join("") + "</tbody></table>";
    var t = C.tech(cur);
    hbars("pls-br", C.BROWSERS, t.browsers, c[4]);
    hbars("pls-os", C.OSES, t.oses, c[1]);
  }

  function hbars(id, names, vals, color) {
    var items = names.map(function (n, i) { return { n: n, v: vals[i] }; }).filter(function (x) { return x.v > 0.5; }).sort(function (a, b) { return b.v - a.v; });
    var tot = items.reduce(function (a, b) { return a + b.v; }, 0) || 1;
    items = items.slice(0, 7).reverse();
    setChart(id, {
      grid: { left: 4, right: 58, top: 4, bottom: 4, containLabel: true },
      tooltip: { trigger: "item", formatter: function (p) { return '<div class="pls-tt"><b>' + p.name + '</b><div class="pls-tt__row">' + int(p.value) + " визитов<em>" + NF1.format(p.value / tot * 100) + " %</em></div></div>"; } },
      xAxis: { type: "value", show: false },
      yAxis: { type: "category", data: items.map(function (x) { return x.n; }), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: cv("--ink"), fontSize: 12, fontWeight: 600 } },
      series: [{
        type: "bar", data: items.map(function (x) { return { value: Math.round(x.v), name: x.n }; }), barWidth: 12,
        showBackground: true, backgroundStyle: { color: cv("--track"), borderRadius: 6 },
        itemStyle: { color: color, borderRadius: 6 },
        label: { show: true, position: "right", formatter: function (p) { return NF1.format(p.value / tot * 100) + " %"; }, color: cv("--muted"), fontSize: 11, fontWeight: 600 }
      }]
    });
  }

  function renderPages() {
    var rows = C.pages(cur), tab = state.pageTab;
    rows.sort(function (a, b) { return b[tab] - a[tab]; });
    var max = rows[0][tab] || 1;
    var c = pal()[0];
    var colTitle = tab === "pv" ? "Просмотры" : tab === "entries" ? "Входы" : "Выходы";
    var head = "<thead><tr><th>Страница</th><th class=n>" + colTitle + "</th><th class=n>Просмотры</th><th class=n>Уникальные</th><th class=n>Ср. время</th><th class=n>Входы</th><th class=n>Выходы</th><th class=n>% выходов</th></tr></thead>";
    var body = rows.map(function (r) {
      return '<tr><td><span class="pls-page"><b>' + esc(r.title) + "</b><code>" + esc(r.path) + '</code></span></td><td class="n pls-td-bar"><span class="pls-bar-in pls-bar-in--wide"><i style="width:' + (r[tab] / max * 100).toFixed(1) + "%;background:" + c + '"></i></span><b>' + int(r[tab]) + '</b></td><td class="n">' + int(r.pv) + '</td><td class="n">' + int(r.upv) + '</td><td class="n">' + durShort(r.time) + '</td><td class="n">' + int(r.entries) + '</td><td class="n">' + int(r.exits) + '</td><td class="n">' + pct(r.exitRate) + "</td></tr>";
    }).join("");
    $("[data-pages]").innerHTML = head + "<tbody>" + body + "</tbody>";
  }

  function renderFunnel() {
    var fn = C.funnel(cur), st = fn.steps, c = pal();
    var top = st[0].value || 1;
    var cols = [c[0], c[0], c[0], c[0], c[1]];
    setChart("pls-funnel-chart", {
      grid: { left: 4, right: 110, top: 6, bottom: 6, containLabel: true },
      tooltip: { trigger: "item", formatter: function (p) { var i = p.dataIndex; return '<div class="pls-tt"><b>' + st[i].name + '</b><div class="pls-tt__row">' + int(st[i].value) + "<em>" + pct(st[i].value / top, 2) + " от визитов</em></div>" + (i ? '<div class="pls-tt__row pls-tt__row--m">От прошлого шага<em>' + pct(st[i - 1].value ? st[i].value / st[i - 1].value : 0) + "</em></div>" : "") + "</div>"; } },
      xAxis: { type: "log", show: false, min: 1 },
      yAxis: { type: "category", inverse: true, data: st.map(function (s) { return s.name; }), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: cv("--ink"), fontSize: 12.5, fontWeight: 650, margin: 14 } },
      series: [{
        type: "bar", barWidth: 30,
        data: st.map(function (s, i) { return { value: Math.max(1, s.value), itemStyle: { color: hexA(cols[i], 1 - i * 0.14), borderRadius: 7 } }; }),
        showBackground: true, backgroundStyle: { color: cv("--track"), borderRadius: 7 },
        label: { show: true, position: "right", distance: 10, color: cv("--ink"), fontWeight: 750, fontSize: 13, formatter: function (p) { return int(st[p.dataIndex].value) + "  {m|" + (p.dataIndex ? pct(st[p.dataIndex].value / top, 2) : "100 %") + "}"; }, rich: { m: { color: cv("--muted"), fontWeight: 600, fontSize: 11 } } }
      }]
    });
    var html = "";
    for (var i = 1; i < st.length; i++) {
      var conv = st[i - 1].value ? st[i].value / st[i - 1].value : 0;
      html += '<div class="pls-step"><span class="pls-step__from">' + st[i - 1].name + " → " + st[i].name + '</span><span class="pls-step__bar"><i style="width:' + (conv * 100).toFixed(1) + '%"></i></span><b>' + pct(conv) + '</b><small>теряем ' + int(st[i - 1].value - st[i].value) + "</small></div>";
    }
    var md = fn.medianDays;
    html += '<p class="pls-note">Половина оплат приходит ' + (md <= 1 ? "в первые сутки" : "в первые " + md + " " + plural(md, "день", "дня", "дней")) + " после регистрации. За 14 дней оплатили " + int(fn.paid14) + " из " + int(st[2].value) + " " + plural(st[2].value, "нового пользователя", "новых пользователей", "новых пользователей") + ".</p>";
    $("[data-steps]").innerHTML = html;
    var conv = C.SOURCES.map(function (s, i) { var b = cur.bySrc[i]; return b.uv ? b.newPayers / b.uv * 100 : 0; });
    var order = conv.map(function (_, i) { return i; }).sort(function (a, b) { return conv[a] - conv[b]; });
    setChart("pls-funnel-src", {
      title: { text: "Конверсия в оплату по каналам", left: 0, top: 0, textStyle: { color: cv("--ink"), fontSize: 12.5, fontWeight: 700 } },
      grid: { left: 4, right: 52, top: 30, bottom: 2, containLabel: true },
      tooltip: { trigger: "item", formatter: function (p) { return '<div class="pls-tt"><b>' + p.name + '</b><div class="pls-tt__row">Конверсия<em>' + NF2.format(p.value) + " %</em></div></div>"; } },
      xAxis: { type: "value", show: false },
      yAxis: { type: "category", data: order.map(function (i) { return C.SOURCES[i].short; }), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: cv("--ink"), fontSize: 12 } },
      series: [{ type: "bar", barWidth: 10, data: order.map(function (i) { return { value: +conv[i].toFixed(3), name: C.SOURCES[i].name, itemStyle: { color: c[i], borderRadius: 5 } }; }), label: { show: true, position: "right", color: cv("--muted"), fontSize: 11, fontWeight: 600, formatter: function (p) { return NF2.format(p.value) + " %"; } } }]
    });
  }

  function renderCohorts() {
    var rows = C.cohorts(D, cur.to, state.f, state.cohort);
    var data = [], ys = rows.map(function (r) { return mLabel(r.start) + "  ·  " + int(r.size); });
    rows.forEach(function (r, y) { r.cells.forEach(function (v, x) { if (v != null) data.push([x, y, +(v * 100).toFixed(1)]); }); });
    var q = seq();
    var vals = data.filter(function (d) { return d[0] > 0; }).map(function (d) { return d[2]; });
    var vmin = Math.min.apply(null, vals.length ? vals : [0]), vmax = Math.max.apply(null, vals.length ? vals : [100]);
    var hi = isDark() ? "#14121c" : "#ffffff", lo = cv("--heat-ink");
    data = data.map(function (d) { var t = d[0] === 0 ? 1 : (d[2] - vmin) / ((vmax - vmin) || 1); return { value: d, label: { color: t > 0.55 ? hi : lo } }; });
    setChart("pls-cohort", {
      grid: { left: 6, right: 10, top: 24, bottom: 6, containLabel: true },
      tooltip: { formatter: function (p) { var r = rows[p.value[1]]; return '<div class="pls-tt"><b>Когорта ' + mLong(r.start) + '</b><div class="pls-tt__row">' + (state.cohort === "payers" ? "Платящих" : "Пользователей") + "<em>" + int(r.size) + '</em></div><div class="pls-tt__row">Месяц ' + p.value[0] + "<em>" + NF1.format(p.value[2]) + " % осталось</em></div></div>"; } },
      xAxis: { type: "category", position: "top", data: rows[0].cells.map(function (_, i) { return i === 0 ? "Мес. 0" : "+" + i; }), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: cv("--muted"), fontSize: 11, fontWeight: 600 }, splitArea: { show: false } },
      yAxis: { type: "category", inverse: true, data: ys, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: cv("--ink"), fontSize: 11.5, fontWeight: 600 } },
      visualMap: { show: false, min: vmin, max: vmax, inRange: { color: q }, outOfRange: { color: q[4] } },
      series: [{
        type: "heatmap", data: data,
        label: { show: true, formatter: function (p) { return p.value[0] === 0 ? "100" : NF.format(p.value[2]); }, fontSize: 11, fontWeight: 650 },
        itemStyle: { borderColor: cv("--panel"), borderWidth: 3, borderRadius: 6 },
        emphasis: { itemStyle: { borderColor: cv("--ink"), borderWidth: 1.5 } }
      }]
    });
  }

  function renderRevenue() {
    var c = pal(), months = C.mrr(D, state.f, 18);
    var planCol = [c[4], c[0], c[3]];
    var last = months[months.length - 1], before = months[months.length - 2];
    var mrrNow = last.byPlan.reduce(function (a, b) { return a + b; }, 0);
    var mrrPrev = before.byPlan.reduce(function (a, b) { return a + b; }, 0);
    var churnRate = mrrPrev ? before.churnM / (months[months.length - 3] ? months[months.length - 3].byPlan.reduce(function (a, b) { return a + b; }, 0) || 1 : 1) : 0;
    var avgCheck = last.payers ? mrrNow / last.payers : 0;
    var dm = delta(mrrNow, mrrPrev);
    $("[data-mrrk]").innerHTML = [
      ["MRR сейчас", moneyC(mrrNow), dm.cls !== "na" ? '<span class="pls-delta pls-delta--' + dm.cls + '">' + icon(dm.arrow, "pls-i--s") + dm.text + "</span> к прошлому месяцу" : ""],
      ["ARR", moneyC(mrrNow * 12), "годовая выручка в текущем темпе"],
      ["Платящих сейчас", int(last.payers), "активные подписки"],
      ["Средний чек", money(avgCheck), "в месяц на подписку"],
      ["Отток MRR", pct(churnRate), "за прошлый полный месяц"]
    ].map(function (x) { return '<div class="pls-mk"><span>' + x[0] + "</span><b>" + x[1] + "</b><small>" + x[2] + "</small></div>"; }).join("");
    $("[data-mrr-legend]").innerHTML = C.PLANS.map(function (p, i) { return '<span class="pls-legend__i"><i style="background:' + planCol[i] + '"></i>' + p.name + " · " + money(p.price) + "/мес</span>"; }).join("");
    var ax = axisCommon();
    setChart("pls-mrr", {
      grid: { left: 6, right: 12, top: 16, bottom: 4, containLabel: true },
      tooltip: { trigger: "axis", formatter: function (ps) { var i = ps[0].dataIndex, m = months[i], t = 0; var h = '<div class="pls-tt"><b>' + mLong(m.month) + (i === months.length - 1 ? ", на сегодня" : "") + "</b>"; ps.slice().reverse().forEach(function (p) { t += p.value; h += '<div class="pls-tt__row"><i style="background:' + p.color + '"></i>' + p.seriesName + "<em>" + money(p.value) + "</em></div>"; }); return h + '<div class="pls-tt__row pls-tt__row--t">Всего<em>' + money(t) + "</em></div></div>"; } },
      xAxis: merge(merge({}, ax), { type: "category", data: months.map(function (m) { return mLabel(m.month); }), boundaryGap: false, splitLine: { show: false } }),
      yAxis: merge(merge({}, ax), { type: "value", axisLine: { show: false }, axisLabel: { color: cv("--muted"), fontSize: 11, formatter: function (v) { return compact(v); } } }),
      series: C.PLANS.map(function (p, i) {
        return { name: p.name, type: "line", stack: "mrr", smooth: 0.2, showSymbol: false, data: months.map(function (m) { return m.byPlan[i]; }), lineStyle: { width: 1.5, color: planCol[i] }, itemStyle: { color: planCol[i] }, areaStyle: { color: hexA(planCol[i], 0.55) } };
      })
    });
    var plans = cur.byPlan, tot = plans.reduce(function (a, b) { return a + b.revenue; }, 0) || 1;
    setChart("pls-plans", {
      tooltip: { trigger: "item", formatter: function (p) { return '<div class="pls-tt"><b>' + p.name + '</b><div class="pls-tt__row"><i style="background:' + p.color + '"></i>' + money(p.value) + "<em>" + NF1.format(p.percent) + " %</em></div></div>"; } },
      title: { text: moneyC(tot), subtext: "за период", left: "center", top: "38%", textStyle: { color: cv("--ink"), fontSize: 16, fontWeight: 800 }, subtextStyle: { color: cv("--muted"), fontSize: 11 }, itemGap: 3 },
      series: [{ type: "pie", radius: ["60%", "84%"], padAngle: 2, itemStyle: { borderRadius: 5, borderColor: cv("--panel"), borderWidth: 2 }, label: { show: false }, data: C.PLANS.map(function (p, i) { return { name: p.name, value: Math.round(plans[i].revenue), itemStyle: { color: planCol[i] } }; }) }]
    });
    $("[data-plan-table]").innerHTML = '<table class="pls-table pls-table--tight"><thead><tr><th>Тариф</th><th class=n>Платящие</th><th class=n>Выручка</th><th class=n>Доля</th></tr></thead><tbody>' + C.PLANS.map(function (p, i) {
      return '<tr><td><span class="pls-sw" style="background:' + planCol[i] + '"></span><b>' + p.name + '</b></td><td class="n">' + int(plans[i].payers) + '</td><td class="n">' + money(plans[i].revenue) + '</td><td class="n">' + pct(plans[i].revenue / tot) + "</td></tr>";
    }).join("") + "</tbody></table>";
    var good = cv("--good"), bad = cv("--bad");
    setChart("pls-mrr-move", {
      grid: { left: 6, right: 12, top: 30, bottom: 4, containLabel: true },
      legend: { top: 0, left: 0, icon: "roundRect", itemWidth: 10, itemHeight: 10, textStyle: { color: cv("--ink"), fontSize: 12 } },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow", shadowStyle: { color: cv("--track") } }, formatter: function (ps) { var m = months[ps[0].dataIndex]; var h = '<div class="pls-tt"><b>' + mLong(m.month) + "</b>"; ps.forEach(function (p) { h += '<div class="pls-tt__row"><i style="background:' + p.color + '"></i>' + p.seriesName + "<em>" + money(Math.abs(p.value)) + "</em></div>"; }); return h + '<div class="pls-tt__row pls-tt__row--t">Чистый прирост<em>' + (m.newM - m.churnM >= 0 ? "+" : "−") + money(Math.abs(m.newM - m.churnM)) + "</em></div></div>"; } },
      xAxis: merge(merge({}, ax), { type: "category", data: months.map(function (m) { return mLabel(m.month); }), splitLine: { show: false } }),
      yAxis: merge(merge({}, ax), { type: "value", axisLine: { show: false }, axisLabel: { color: cv("--muted"), fontSize: 11, formatter: function (v) { return (v < 0 ? "−" : "") + compact(Math.abs(v)); } } }),
      series: [
        { name: "Новые подписки", type: "bar", stack: "m", barWidth: "52%", data: months.map(function (m) { return Math.round(m.newM); }), itemStyle: { color: good, borderRadius: [5, 5, 0, 0] } },
        { name: "Отток", type: "bar", stack: "m", data: months.map(function (m) { return -Math.round(m.churnM); }), itemStyle: { color: bad, borderRadius: [0, 0, 5, 5] } }
      ]
    });
  }

  var PAGE_SIZE = 20;
  var STATUS = ["", "Подписка", "Ушел", "Бесплатно", "Неактивен"];

  function renderUsers() {
    var u = state.users;
    var list = C.usersQuery(D, cur, state.f, u);
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (u.page >= pages) u.page = pages - 1;
    var slice = list.slice(u.page * PAGE_SIZE, u.page * PAGE_SIZE + PAGE_SIZE);
    var c = pal();
    var cols = [["name", "Пользователь"], ["cty", "Страна, город"], ["src", "Источник"], ["reg", "Регистрация"], ["plan", "Тариф"], ["revenue", "Принес"], ["last", "Последний визит"]];
    var head = "<thead><tr>" + cols.map(function (cl) {
      var on = u.sort === cl[0];
      return "<th" + (cl[0] === "revenue" ? " class=n" : "") + ' aria-sort="' + (on ? (u.dir === "asc" ? "ascending" : "descending") : "none") + '"><button type="button" data-usort="' + cl[0] + '"' + (on ? ' class="is-on"' : "") + ">" + cl[1] + (on ? icon(u.dir === "asc" ? "arrowUp" : "arrowDown", "pls-i--s") : "") + "</button></th>";
    }).join("") + "</tr></thead>";
    var body = slice.map(function (x) {
      var cty = C.COUNTRIES[x.cty], plan = x.plan >= 0 ? C.PLANS[x.plan].name : "Бесплатный";
      var ini = (x.first[0] + x.last[0]).toUpperCase();
      var hue = (x.id * 47) % 360;
      return '<tr class="pls-row" data-user="' + x.id + '" tabindex="0"><td><span class="pls-user"><span class="pls-ava" style="--h:' + hue + '">' + esc(ini) + '</span><span><b>' + esc(x.first + " " + x.last) + "</b><small>" + esc(x.email) + "</small></span></span></td>" +
        "<td>" + cty.name + '<small class="pls-sub">' + cty.cities[x.city][0] + "</small></td>" +
        '<td><span class="pls-sw" style="background:' + c[x.src] + '"></span>' + C.SOURCES[x.src].short + (x.camp >= 0 ? '<small class="pls-sub">' + esc(C.CAMPAIGNS[x.camp].utm[2]) + "</small>" : '<small class="pls-sub">' + C.DEVICES[x.dev].name.toLowerCase() + "</small>") + "</td>" +
        "<td>" + dLong(x.reg) + "</td>" +
        '<td><span class="pls-plan pls-plan--' + (x.plan >= 0 ? C.PLANS[x.plan].id : "free") + '">' + plan + '</span><small class="pls-sub pls-st--' + x.status + '">' + STATUS[x.status] + "</small></td>" +
        '<td class="n"><b>' + (x.revenue ? money(x.revenue) : '<span class="pls-muted">0 ₽</span>') + "</b>" + (x.nPay ? '<small class="pls-sub">' + x.nPay + " " + plural(x.nPay, "платеж", "платежа", "платежей") + "</small>" : "") + "</td>" +
        "<td>" + relDay(x.lastActive) + "</td></tr>";
    }).join("");
    if (!slice.length) body = '<tr><td colspan="7" class="pls-empty">' + (u.search ? "Никого не нашли по запросу «" + esc(u.search) + "»" : "В этом сегменте пока нет пользователей") + "</td></tr>";
    $("[data-users]").innerHTML = head + "<tbody>" + body + "</tbody>";
    var ss = $("[data-user-sortsel]"), sv = u.sort + ":" + u.dir;
    if (ss) ss.value = Array.prototype.some.call(ss.options, function (o) { return o.value === sv; }) ? sv : "revenue:desc";
    $("[data-user-count]").textContent = int(list.length) + " " + plural(list.length, "пользователь", "пользователя", "пользователей") + " · принесли " + moneyC(sumRev(list));
    var pg = "";
    if (pages > 1) {
      pg += '<button type="button" data-page="' + (u.page - 1) + '"' + (u.page ? "" : " disabled") + ">Назад</button>";
      pg += "<span>Страница " + (u.page + 1) + " из " + int(pages) + "</span>";
      pg += '<button type="button" data-page="' + (u.page + 1) + '"' + (u.page < pages - 1 ? "" : " disabled") + ">Дальше</button>";
    }
    $("[data-pager]").innerHTML = pg;
  }
  function sumRev(list) { var t = 0; for (var i = 0; i < list.length; i++) t += list[i].revenue; return t; }
  function relDay(a) {
    var d = D.end - a;
    if (d <= 0) return "сегодня";
    if (d === 1) return "вчера";
    if (d < 30) return d + " " + plural(d, "день", "дня", "дней") + " назад";
    return dLong(a);
  }

  function openUser(id) {
    var u = D.users[id];
    if (!u) return;
    var cty = C.COUNTRIES[u.cty], pays = C.userPayments(D, u), c = pal();
    var dr = $("[data-drawer]"), scrim = $("[data-scrim]");
    var hue = (u.id * 47) % 360;
    var facts = [
      ["Почта", esc(u.email)],
      ["Страна и город", cty.name + ", " + cty.cities[u.city][0]],
      ["Источник", '<span class="pls-sw" style="background:' + c[u.src] + '"></span>' + C.SOURCES[u.src].name],
      ["Кампания", u.camp >= 0 ? "<code>" + esc(C.CAMPAIGNS[u.camp].utm.join(" / ")) + "</code>" : "без UTM-метки"],
      ["Устройство", C.DEVICES[u.dev].name],
      ["Регистрация", dLong(u.reg)],
      ["Первый проект", u.activated ? "создан" : "не создан"],
      ["Последний визит", relDay(u.lastActive)]
    ];
    dr.innerHTML = '<div class="pls-drawer__head"><span class="pls-ava pls-ava--l" style="--h:' + hue + '">' + esc((u.first[0] + u.last[0]).toUpperCase()) + '</span><div><h3>' + esc(u.first + " " + u.last) + '</h3><p><span class="pls-plan pls-plan--' + (u.plan >= 0 ? C.PLANS[u.plan].id : "free") + '">' + (u.plan >= 0 ? C.PLANS[u.plan].name : "Бесплатный") + "</span> " + STATUS[u.status] + '</p></div><button type="button" class="pls-drawer__x" data-close aria-label="Закрыть">' + icon("x") + "</button></div>" +
      '<div class="pls-drawer__money"><div><span>Принес всего</span><b>' + money(u.revenue) + '</b></div><div><span>Платежей</span><b>' + u.nPay + "</b></div></div>" +
      '<dl class="pls-facts">' + facts.map(function (f) { return "<dt>" + f[0] + "</dt><dd>" + f[1] + "</dd>"; }).join("") + "</dl>" +
      "<h4>Платежи</h4>" + (pays.length ? '<ol class="pls-pays">' + pays.slice().reverse().map(function (p, i) { return "<li><span>" + dLong(p.day) + "</span><span>" + (i === pays.length - 1 ? "первая оплата" : "продление") + "</span><b>" + money(p.amount) + "</b></li>"; }).join("") + "</ol>" : '<p class="pls-muted">Пользователь пока ничего не оплачивал.</p>');
    dr.hidden = false; scrim.hidden = false;
    requestAnimationFrame(function () { dr.classList.add("is-open"); scrim.classList.add("is-open"); });
    dr.querySelector("[data-close]").focus();
  }
  function closeDrawer() {
    var dr = $("[data-drawer]"), scrim = $("[data-scrim]");
    if (dr.hidden) return false;
    dr.classList.remove("is-open"); scrim.classList.remove("is-open");
    setTimeout(function () { dr.hidden = true; scrim.hidden = true; }, 220);
    return true;
  }

  function toggleFilter(dim, i) {
    if (i < 0) return;
    var arr = state.f[dim], k = arr.indexOf(i);
    if (k >= 0) arr.splice(k, 1); else arr.push(i);
    state.users.page = 0;
    update();
  }

  var pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  function openPop(anchor, html, onBind) {
    closePop();
    pop = el("div", "pls-pop", html);
    pop.setAttribute("role", "dialog");
    root.appendChild(pop);
    var r = anchor.getBoundingClientRect(), w = pop.offsetWidth, vw = window.innerWidth;
    var left = Math.min(Math.max(8, r.left), vw - w - 8);
    pop.style.left = left + "px";
    pop.style.top = (r.bottom + 8) + "px";
    var maxH = window.innerHeight - r.bottom - 20;
    pop.style.maxHeight = Math.max(200, maxH) + "px";
    if (onBind) onBind(pop);
    var first = pop.querySelector("input, button");
    if (first) first.focus({ preventScroll: true });
  }

  function dimPop(anchor, dim) {
    var list = dim === "src" ? C.SOURCES : dim === "dev" ? C.DEVICES : C.COUNTRIES;
    var c = pal();
    var counts = dim === "src" ? cur.bySrc : dim === "dev" ? cur.byDev : cur.byCty;
    var all = C.aggregate(D, cur.from, cur.to, merge(merge({}, state.f), (function () { var o = {}; o[dim] = []; return o; })()));
    counts = dim === "src" ? all.bySrc : dim === "dev" ? all.byDev : all.byCty;
    var order = list.map(function (_, i) { return i; }).sort(function (a, b) { return counts[b].sessions - counts[a].sessions; });
    var title = dim === "src" ? "Источник трафика" : dim === "dev" ? "Тип устройства" : "Страна";
    var html = '<div class="pls-pop__head">' + title + "</div>" + (dim === "cty" ? '<label class="pls-search pls-search--s">' + icon("search") + '<input type="search" placeholder="Найти страну" data-pop-search></label>' : "") +
      '<div class="pls-pop__list">' + order.map(function (i) {
        var on = state.f[dim].indexOf(i) >= 0;
        return '<label class="pls-opt" data-name="' + esc(list[i].name.toLowerCase()) + '"><input type="checkbox" value="' + i + '"' + (on ? " checked" : "") + '><span class="pls-opt__box">' + icon("check") + "</span>" + (dim !== "cty" ? '<span class="pls-sw" style="background:' + c[i] + '"></span>' : "") + "<span>" + list[i].name + "</span><em>" + compact(counts[i].sessions) + "</em></label>";
      }).join("") + "</div>" +
      '<div class="pls-pop__foot"><button type="button" class="pls-ghost" data-pop-clear>Очистить</button><button type="button" class="pls-btn" data-pop-done>Готово</button></div>';
    openPop(anchor, html, function (p) {
      p.addEventListener("change", function (e) {
        if (e.target.type !== "checkbox") return;
        var i = +e.target.value, arr = state.f[dim], k = arr.indexOf(i);
        if (e.target.checked && k < 0) arr.push(i);
        if (!e.target.checked && k >= 0) arr.splice(k, 1);
        state.users.page = 0;
        update();
      });
      var s = p.querySelector("[data-pop-search]");
      if (s) s.addEventListener("input", function () { var q = s.value.trim().toLowerCase(); $$(".pls-opt", p).forEach(function (o) { o.hidden = q && o.getAttribute("data-name").indexOf(q) < 0; }); });
      p.querySelector("[data-pop-clear]").addEventListener("click", function () { state.f[dim] = []; update(); closePop(); });
      p.querySelector("[data-pop-done]").addEventListener("click", closePop);
    });
  }

  function rangePop(anchor) {
    var r = range();
    var presets = [];
    var p = C.parts(D.end);
    var mStart = C.absOf(p.y, p.m, 1), pmStart = C.addMonths(mStart, -1);
    presets.push(["Этот месяц", mStart, D.end]);
    presets.push(["Прошлый месяц", pmStart, mStart - 1]);
    var q0 = C.absOf(p.y, Math.floor((p.m - 1) / 3) * 3 + 1, 1);
    presets.push(["Этот квартал", q0, D.end]);
    presets.push(["С начала года", C.absOf(p.y, 1, 1), D.end]);
    presets.push(["Черная пятница 2025", C.absOf(2025, 11, 17), C.absOf(2025, 12, 7)]);
    presets.push(["Все время", D.start, D.end]);
    presets = presets.filter(function (x) { return x[1] >= D.start; });
    var html = '<div class="pls-pop__head">Свой период</div><div class="pls-range"><label><span>С</span><input type="date" data-from min="' + C.iso(D.start) + '" max="' + C.iso(D.end) + '" value="' + C.iso(r.from) + '"></label><label><span>По</span><input type="date" data-to min="' + C.iso(D.start) + '" max="' + C.iso(D.end) + '" value="' + C.iso(r.to) + '"></label></div>' +
      '<div class="pls-presets">' + presets.map(function (x, i) { return '<button type="button" data-preset="' + i + '">' + x[0] + "</button>"; }).join("") + "</div>" +
      '<p class="pls-pop__note">Данные есть с ' + dLong(D.start) + "</p>" +
      '<div class="pls-pop__foot"><button type="button" class="pls-ghost" data-pop-cancel>Отмена</button><button type="button" class="pls-btn" data-pop-apply>Показать</button></div>';
    openPop(anchor, html, function (pp) {
      var apply = function (a, b) {
        if (!a || !b) return;
        state.period = "custom"; state.from = a; state.to = b; state.users.page = 0;
        closePop(); update();
      };
      $$("[data-preset]", pp).forEach(function (b) { b.addEventListener("click", function () { var x = presets[+b.getAttribute("data-preset")]; apply(C.iso(x[1]), C.iso(x[2])); }); });
      pp.querySelector("[data-pop-apply]").addEventListener("click", function () { apply(pp.querySelector("[data-from]").value, pp.querySelector("[data-to]").value); });
      pp.querySelector("[data-pop-cancel]").addEventListener("click", closePop);
    });
  }

  function bind() {
    root.addEventListener("click", function (e) {
      var t = e.target.closest("button, a, tr, [data-jump]");
      if (pop && !e.target.closest(".pls-pop") && !e.target.closest("[data-dim], [data-period=custom]")) closePop();
      if (!t || !root.contains(t)) return;
      if (t.hasAttribute("data-period")) {
        var v = t.getAttribute("data-period");
        if (v === "custom") { if (pop) { closePop(); return; } rangePop(t); return; }
        state.period = v; state.users.page = 0; update(); return;
      }
      if (t.hasAttribute("data-dim")) { if (pop) { closePop(); return; } dimPop(t, t.getAttribute("data-dim")); return; }
      if (t.hasAttribute("data-unchip")) { var pr = t.getAttribute("data-unchip").split(":"); toggleFilter(pr[0], +pr[1]); return; }
      if (t.hasAttribute("data-reset")) { state.f = { src: [], dev: [], cty: [] }; update(); return; }
      if (t.hasAttribute("data-kpi")) {
        var k = t.getAttribute("data-kpi");
        if (METRICS.some(function (m) { return m.k === k; })) { state.metric = k; saveState(); markSegs(); renderTraffic(); $$("[data-kpi]").forEach(function (n) { n.classList.toggle("is-on", n.getAttribute("data-kpi") === k); }); }
        return;
      }
      if (t.parentNode && t.parentNode.hasAttribute && t.parentNode.hasAttribute("data-seg")) {
        var name = t.parentNode.getAttribute("data-seg"), val = t.getAttribute("data-v");
        if (name === "scope") { state.users.scope = val; state.users.page = 0; saveState(); markSegs(); renderUsers(); return; }
        state[name] = val; saveState(); markSegs();
        if (name === "metric" || name === "gran") { renderTraffic(); $$("[data-kpi]").forEach(function (n) { n.classList.toggle("is-on", n.getAttribute("data-kpi") === state.metric); }); }
        else if (name === "srcMetric") renderSources();
        else if (name === "campTab") renderCampaigns();
        else if (name === "geoMetric") renderGeo();
        else if (name === "pageTab") renderPages();
        else if (name === "cohort") renderCohorts();
        return;
      }
      if (t.hasAttribute("data-csort")) { var ck = t.getAttribute("data-csort"); state.campSort = { k: ck, d: state.campSort.k === ck && state.campSort.d === "desc" ? "asc" : "desc" }; saveState(); renderCampaigns(); return; }
      if (t.hasAttribute("data-usort")) { var uk = t.getAttribute("data-usort"); state.users.dir = state.users.sort === uk && state.users.dir === "desc" ? "asc" : "desc"; state.users.sort = uk; state.users.page = 0; saveState(); renderUsers(); return; }
      if (t.hasAttribute("data-page")) { state.users.page = +t.getAttribute("data-page"); renderUsers(); $(".pls-users").scrollIntoView({ block: "start", behavior: "smooth" }); return; }
      if (t.hasAttribute("data-country")) { state.geoCountry = +t.getAttribute("data-country"); saveState(); renderGeo(); return; }
      if (t.hasAttribute("data-country-toggle")) { toggleFilter("cty", +t.getAttribute("data-country-toggle")); return; }
      if (t.hasAttribute("data-toggle")) { var tp = t.getAttribute("data-toggle").split(":"); toggleFilter(tp[0], +tp[1]); return; }
      if (t.hasAttribute("data-user")) { openUser(+t.getAttribute("data-user")); return; }
      if (t.hasAttribute("data-close")) { closeDrawer(); return; }
      if (t.hasAttribute("data-jump")) { scrollToSec(t.getAttribute("data-jump")); return; }
      if (t.hasAttribute("data-nav")) { e.preventDefault(); scrollToSec(t.getAttribute("data-nav")); return; }
    });
    $("[data-scrim]").addEventListener("click", closeDrawer);
    $("[data-user-sortsel]").addEventListener("change", function (e) { var v = e.target.value.split(":"); state.users.sort = v[0]; state.users.dir = v[1]; state.users.page = 0; saveState(); renderUsers(); });
    $("[data-compare]").addEventListener("change", function (e) { state.compare = e.target.checked; saveState(); renderTraffic(); });
    var timer;
    $("[data-user-search]").addEventListener("input", function (e) {
      clearTimeout(timer);
      timer = setTimeout(function () { state.users.search = e.target.value; state.users.page = 0; renderUsers(); }, 160);
    });
    root.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { if (pop) { closePop(); e.preventDefault(); return; } if (closeDrawer()) { e.preventDefault(); return; } }
      if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("tr[tabindex]")) { e.preventDefault(); e.target.click(); }
    });
    window.addEventListener("resize", closePop);
    mainEl.addEventListener("scroll", function () { if (pop) closePop(); }, { passive: true });
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onTheme = function () { Object.keys(charts).forEach(function (k) { if (!charts[k].isDisposed()) charts[k].dispose(); }); charts = {}; update(); if (live) live.redraw(); };
      if (mq.addEventListener) mq.addEventListener("change", onTheme); else if (mq.addListener) mq.addListener(onTheme);
    }
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting) setNav(en.target.getAttribute("data-sec")); });
      }, { root: mainEl, rootMargin: "-30% 0px -60% 0px" });
      $$("[data-sec]").forEach(function (s) { io.observe(s); });
    }
  }

  function setNav(id) {
    $$("[data-nav]").forEach(function (a) { a.classList.toggle("is-on", a.getAttribute("data-nav") === id); });
    var tab = $('.pls-tabs [data-nav="' + id + '"]');
    if (tab && tab.parentNode.scrollWidth > tab.parentNode.clientWidth) {
      var p = tab.parentNode;
      p.scrollTo({ left: tab.offsetLeft - p.clientWidth / 2 + tab.offsetWidth / 2, behavior: "smooth" });
    }
  }
  function scrollToSec(id) {
    var s = document.getElementById("pls-" + id);
    if (!s) return;
    var bar = $(".pls-bar");
    var top = s.offsetTop - (bar ? bar.offsetHeight : 0) - 12;
    mainEl.scrollTo({ top: id === "overview" ? 0 : top, behavior: "smooth" });
    setNav(id);
  }

  function Live() {
    var hist = [], perMin = 0, share = 1, cur15 = 0, pages = [], ctys = [], feedT = 0, tick = 0;
    var seed = Date.now() % 100000, rnd = C.prng(seed);
    function hourF() { var n = new Date(); var h = n.getHours(), m = n.getMinutes() / 60; var a = C.HOURS[h], b = C.HOURS[(h + 1) % 24]; return a + (b - a) * m; }
    function pois(l) { var g = l + Math.sqrt(l) * (rnd() + rnd() + rnd() - 1.5) * 1.4; return Math.max(0, Math.round(g)); }
    function retarget() {
      var lb = C.liveBase(D, state.f);
      perMin = lb.perDay / 1440 / 0.93 * 0.82;
      share = lb.share;
      if (!hist.length) for (var i = 0; i < 30; i++) hist.push(pois(perMin * hourF()));
      else hist = hist.map(function (v) { return pois(perMin * hourF()); });
      cur15 = hist.slice(-15).reduce(function (a, b) { return a + b; }, 0);
      shuffle();
      draw();
    }
    function shuffle() {
      var pr = C.pages(cur);
      var tot = pr.reduce(function (a, b) { return a + b.entries; }, 0) || 1;
      pages = pr.map(function (p) { return { t: p.title, v: p.entries / tot * cur15 * (0.75 + rnd() * 0.5) }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 4);
      var ct = cur.byCty.map(function (s, i) { return { t: C.COUNTRIES[i].name, v: s.sessions * (0.7 + rnd() * 0.6) }; });
      var ctt = ct.reduce(function (a, b) { return a + b.v; }, 0) || 1;
      ctys = ct.map(function (x) { return { t: x.t, v: x.v / ctt * cur15 }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 4);
    }
    function draw() {
      var num = $("[data-live-num]");
      if (!num) return;
      num.textContent = int(cur15);
      $("[data-live-mini]").textContent = int(cur15);
      var mob = cur.byDev[1].sessions / (cur.total.sessions || 1);
      $("[data-live-split]").innerHTML = '<span><b>' + int(cur15 * (1 - mob)) + "</b> с компьютеров</span><span><b>" + int(cur15 * mob) + "</b> с телефонов</span>";
      var li = function (list) { var rows = list.filter(function (p) { return p.v >= 0.5; }); return rows.length ? rows.map(function (p) { return "<li><span>" + esc(p.t) + "</span><b>" + int(p.v) + "</b></li>"; }).join("") : '<li class="pls-live__empty">Сейчас никого</li>'; };
      $("[data-live-pages]").innerHTML = li(pages);
      $("[data-live-cty]").innerHTML = li(ctys);
      var c = pal()[0];
      setChart("pls-live-bars", {
        animationDurationUpdate: 600,
        grid: { left: 0, right: 0, top: 4, bottom: 0 },
        tooltip: { trigger: "axis", axisPointer: { type: "none" }, formatter: function (ps) { var i = ps[0].dataIndex; return '<div class="pls-tt"><b>' + (29 - i ? (29 - i) + " мин назад" : "Эта минута") + '</b><div class="pls-tt__row">' + int(ps[0].value) + " " + plural(ps[0].value, "визит", "визита", "визитов") + "</div></div>"; } },
        xAxis: { type: "category", show: false, data: hist.map(function (_, i) { return i; }) },
        yAxis: { type: "value", show: false, min: 0 },
        series: [{ type: "bar", data: hist.map(function (v, i) { return { value: v, itemStyle: { color: i === hist.length - 1 ? cv("--live") : hexA(c, 0.25 + 0.6 * i / 29), borderRadius: [3, 3, 0, 0] } }; }), barCategoryGap: "22%" }]
      });
    }
    function step() {
      tick++;
      var last = hist.length - 1;
      hist[last] += pois(perMin * hourF() / 24);
      if (tick % 24 === 0) { hist.shift(); hist.push(pois(perMin * hourF() / 24)); }
      cur15 = hist.slice(-15).reduce(function (a, b) { return a + b; }, 0) + Math.round((rnd() - 0.5) * 4);
      if (tick % 4 === 0) shuffle();
      draw();
      var fv = $("[data-live-num]");
      if (fv) { fv.classList.remove("is-bump"); void fv.offsetWidth; fv.classList.add("is-bump"); }
    }
    function event() {
      var feed = $("[data-feed]");
      if (!feed) return;
      var x = rnd(), c = pal();
      var si = 0, ki = 0, w = cur.bySrc.map(function (s) { return s.sessions; }), wt = w.reduce(function (a, b) { return a + b; }, 0);
      var y = rnd() * wt;
      for (si = 0; si < w.length - 1; si++) { y -= w[si]; if (y < 0) break; }
      var cw = cur.byCty.map(function (s) { return s.sessions; }), ct = cw.reduce(function (a, b) { return a + b; }, 0), z = rnd() * ct;
      for (ki = 0; ki < cw.length - 1; ki++) { z -= cw[ki]; if (z < 0) break; }
      var cty = C.COUNTRIES[ki], cityW = cty.cities.filter(function (cc) { return cc[1]; });
      var city = cityW[Math.floor(rnd() * cityW.length)][0];
      var txt, kind;
      if (x < 0.12) { var pl = C.PLANS[rnd() < 0.5 ? 0 : rnd() < 0.75 ? 1 : 2]; kind = "pay"; txt = "<b>Оплата «" + pl.name + "»</b> · " + money(pl.price); }
      else if (x < 0.4) { kind = "reg"; txt = "<b>Регистрация</b>"; }
      else { var pg = C.PAGES[Math.floor(rnd() * C.PAGES.length)]; kind = "view"; txt = "<b>" + esc(pg[1]) + "</b>"; }
      var item = el("div", "pls-feed__i pls-feed__i--" + kind, '<span class="pls-feed__dot" style="background:' + (kind === "pay" ? cv("--good") : kind === "reg" ? c[0] : c[si]) + '"></span><span class="pls-feed__t">' + txt + "<small>" + city + " · " + C.SOURCES[si].short + "</small></span><time>сейчас</time>");
      feed.insertBefore(item, feed.firstChild);
      $$(".pls-feed__i time", feed).forEach(function (t, i) { if (i) { var s = +(t.getAttribute("data-s") || 0) + 1; t.setAttribute("data-s", s); t.textContent = s * 3 + " с"; } });
      while (feed.children.length > 4) feed.removeChild(feed.lastChild);
    }
    retarget();
    for (var i = 0; i < 4; i++) event();
    setInterval(step, 2500);
    setInterval(function () { if (cur15 > 0 || rnd() < 0.15) event(); }, 3000);
    return { retarget: retarget, redraw: draw };
  }

  var intro, introOpen = false;
  function setupIntro() {
    intro = document.getElementById("pls-intro");
    if (!intro) return;
    introOpen = true;
    intro.classList.add("pls-intro--on");
    var open = intro.querySelector("[data-intro=open]");
    var close = function () {
      if (!introOpen) return;
      introOpen = false;
      intro.classList.add("pls-intro--out");
      setTimeout(function () { intro.hidden = true; }, 260);
      if (mainEl) mainEl.focus({ preventScroll: true });
    };
    open.addEventListener("click", close);
    intro.addEventListener("click", function (e) { if (e.target === intro) close(); });
    document.addEventListener("keydown", function (e) {
      if (!introOpen) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (e.key === "Enter") {
        if (document.activeElement && document.activeElement.matches && document.activeElement.matches("[data-intro=back]")) return;
        e.preventDefault(); close(); return;
      }
      if (e.key === "Tab") {
        var f = intro.querySelectorAll("button, a[href]"), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!intro.contains(document.activeElement)) { e.preventDefault(); open.focus(); }
      }
    }, true);
    open.focus({ preventScroll: true });
  }

  function fail(msg) {
    var app = document.getElementById("pls-app");
    app.setAttribute("data-state", "error");
    app.innerHTML = '<div class="pls-boot"><span class="pls-boot__logo">' + LOGO + "</span><p>" + msg + '</p><button type="button" onclick="location.reload()">Обновить</button></div>';
  }

  function start() {
    var app = document.getElementById("pls-app");
    if (!app) return;
    document.documentElement.classList.add("pls-lock");
    loadCss(FONT_URL);
    setupIntro();
    var built = new Promise(function (res) { setTimeout(function () { res(C.build()); }, 30); });
    var font = document.fonts && document.fonts.load ? Promise.race([document.fonts.load('700 12px "Manrope Variable"').catch(function () {}), new Promise(function (r) { setTimeout(r, 2500); })]) : Promise.resolve();
    Promise.all([loadScript(ECHARTS_URL), built, font]).then(function (r) {
      D = r[1];
      state = loadState();
      root = app;
      root.setAttribute("data-state", "ready");
      root.classList.add("pls-shell");
      shell();
      mainEl = document.getElementById("pls-main");
      mainEl.setAttribute("tabindex", "-1");
      bind();
      update();
      live = Live();
      setNav("overview");
      loadMap();
    }).catch(function () { fail("Не удалось загрузить библиотеку графиков. Проверьте сеть и обновите страницу."); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
