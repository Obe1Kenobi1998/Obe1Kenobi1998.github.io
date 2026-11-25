/* =====================================================================
   «СОБЕРИ ПК» — логика страницы pc.html: шаги сборки, каталог с поиском
   и фильтрами, проверка совместимости, цена и мощность, готовые сборки,
   ссылка на сборку, включение ПК и монитор с играми и оценкой FPS.
   3D — js/pc-3d.js, данные — js/pc-data.js и js/pc-games.js.
   ===================================================================== */
(function () {
  "use strict";
  var D = window.PC_DATA, RAW = window.PC_GAMES_RAW || [];
  var app = document.getElementById("pcApp");
  if (!app || !D) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function rub(n) { return Math.round(n).toLocaleString("ru-RU").replace(/,/g, " ") + " ₽"; }
  function plural(n, a, b, c) { var m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; }
  function toast(msg, kind) { if (window.SITE_UI && window.SITE_UI.toast) window.SITE_UI.toast(msg, kind); }

  /* ---------- категории ---------- */
  var ICO = {
    case: '<rect x="6" y="2.5" width="12" height="19" rx="2"/><circle cx="12" cy="15" r="3"/><path d="M9 6h6"/>',
    mb: '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="6" height="6" rx="1"/><path d="M16 6v9M18 6v9M7 17h9"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/><path d="M10 10h4v4h-4z"/>',
    cooler: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 10c0-3 1-5 4-5M14 12c3 0 5 1 5 4M12 14c0 3-1 5-4 5M10 12c-3 0-5-1-5-4"/>',
    ram: '<rect x="2" y="7" width="20" height="9" rx="1"/><path d="M5 16v3M9 16v3M15 16v3M19 16v3M6 10h3M11 10h3M16 10h2"/>',
    gpu: '<rect x="2" y="6" width="20" height="11" rx="2"/><circle cx="8" cy="11.5" r="3"/><circle cx="16" cy="11.5" r="3"/><path d="M4 17v2"/>',
    ssd: '<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M6 12h6M16 11v2M19 11v2"/>',
    psu: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M13 8l-3 5h4l-3 5"/>'
  };
  var CATS = [
    { k: "case", list: "cases", name: "Корпус", one: "корпус" },
    { k: "mb", list: "mbs", name: "Материнская плата", one: "плату" },
    { k: "cpu", list: "cpus", name: "Процессор", one: "процессор" },
    { k: "cooler", list: "coolers", name: "Охлаждение", one: "охлаждение" },
    { k: "ram", list: "rams", name: "Оперативная память", one: "память" },
    { k: "gpu", list: "gpus", name: "Видеокарта", one: "видеокарту" },
    { k: "ssd", list: "ssds", name: "Накопитель", one: "накопитель" },
    { k: "psu", list: "psus", name: "Блок питания", one: "блок питания" }
  ];
  var CAT = {}; CATS.forEach(function (c) { CAT[c.k] = c; });
  var FFN = { E: "E-ATX", A: "ATX", M: "mATX", I: "Mini-ITX" };
  function ffList(s) { return s.split("").map(function (c) { return FFN[c]; }).join(", "); }
  function title(it) { return it.b + " " + it.n; }

  /* ---------- характеристики в карточке ---------- */
  function specs(cat, it) {
    switch (cat) {
      case "case": return [ffList(it.mb), "видеокарта до " + it.gpu + " мм", "кулер до " + it.cool + " мм",
        "СЖО: " + (it.rt ? "сверху " + it.rt : "") + (it.rt && it.rf ? ", " : "") + (it.rf ? "спереди " + it.rf : "") + (!it.rt && !it.rf ? "нет" : ""),
        it.psu === "SFX" ? "БП только SFX" : null, it.fans ? "вентиляторы: " + fansText(it.fans) : "без вентиляторов", it.col === "white" ? "белый" : null];
      case "mb": return [it.s, it.ch, FFN[it.ff], it.mem + " × " + it.ms, "M.2 × " + it.m2, it.wifi ? "Wi-Fi" : null];
      case "cpu": return [it.s, it.c + " ядер / " + it.t + " потоков", it.ghz + " ГГц", "до " + it.pw + " Вт", it.ig ? "графика: " + it.ig : "без встройки"];
      case "cooler": return [it.k === "aio" ? "СЖО " + it.r + " мм" : (it.k === "low" ? "низкий, " : "башня, ") + it.h + " мм", "отводит до " + it.tdp + " Вт", it.rgb ? "ARGB" : null];
      case "ram": return [it.t, it.gb + " ГБ (" + it.k + " × " + it.gb / it.k + ")", it.mhz + " МГц", "CL" + it.cl, it.rgb ? "RGB" : null];
      case "gpu": return [it.chip, it.vr + " ГБ", it.len + " мм", it.sl + " слота", "до " + it.w + " Вт"];
      case "ssd": return [it.k === "m2" ? "M.2 NVMe" : it.k === "sata" ? "SATA 2,5″" : "HDD 3,5″", it.tb >= 1 ? it.tb + " ТБ" : Math.round(it.tb * 1000) + " ГБ", it.gen, it.rd + " МБ/с"];
      case "psu": return [it.w + " Вт", it.cert, it.ff, "модульность: " + it.mod];
    }
    return [];
  }
  function fansText(s) { return s.split(",").map(function (f) { var m = f.match(/(\d+)x(\d+)([frtb])/); return m ? m[1] + "×" + m[2] + ({ f: " спереди", r: " сзади", t: " сверху", b: " снизу" })[m[3]] : f; }).join(", "); }

  /* ---------- ссылки на магазины ---------- */
  function links(it) {
    var q = encodeURIComponent((it.b === "Разные бренды" ? "" : it.b + " ") + it.n.replace(/\s*\(.*?\)\s*/g, " ").trim());
    return [["Маркет", "https://market.yandex.ru/search?text=" + q], ["Ozon", "https://www.ozon.ru/search/?text=" + q + "&from_global=true"], ["DNS", "https://www.dns-shop.ru/search/?q=" + q]];
  }

  /* ---------- мощность ---------- */
  function powerOf(b) {
    var w = 55;                                         // плата, память, накопители, вентиляторы, USB
    if (b.cpu) w += b.cpu.pw;
    if (b.gpu) w += b.gpu.w;
    if (b.cooler && b.cooler.k === "aio") w += 10;
    if (b.case && b.case.fans) w += b.case.fans.split(",").reduce(function (a, f) { var m = f.match(/(\d+)x/); return a + (m ? +m[1] : 0); }, 0) * 3;
    var rec = Math.max(450, Math.ceil(w * 1.35 / 50) * 50);
    return { load: Math.round(w), rec: rec };
  }

  /* ---------- совместимость ----------
     check(cat, it, build) → { err: [{t, with}], warn: [t] } — с чем конфликтует деталь среди уже стоящих */
  function check(cat, it, b) {
    var err = [], warn = [];
    function E(t, w) { err.push({ t: t, with: w }); }
    var c = cat === "case" ? it : b.case, mb = cat === "mb" ? it : b.mb, cpu = cat === "cpu" ? it : b.cpu, cl = cat === "cooler" ? it : b.cooler;
    var ram = cat === "ram" ? it : b.ram, gpu = cat === "gpu" ? it : b.gpu, psu = cat === "psu" ? it : b.psu, ssd = cat === "ssd" ? it : b.ssd;
    if (cat !== "case" && !b.case) E("Сначала поставь корпус — все детали ставятся в него", "case");
    // корпус
    if (c && mb && (cat === "case" || cat === "mb") && c.mb.indexOf(mb.ff) < 0) E("Плата " + FFN[mb.ff] + " не влезет: корпус берёт только " + ffList(c.mb), cat === "case" ? "mb" : "case");
    if (c && gpu && (cat === "case" || cat === "gpu") && gpu.len > c.gpu) E("Видеокарта " + gpu.len + " мм не влезет: в корпус помещается до " + c.gpu + " мм", cat === "case" ? "gpu" : "case");
    if (c && cl && (cat === "case" || cat === "cooler")) {
      if (cl.k !== "aio" && cl.h > c.cool) E("Кулер высотой " + cl.h + " мм упрётся в стекло: корпус пропускает до " + c.cool + " мм", cat === "case" ? "cooler" : "case");
      if (cl.k === "aio" && cl.r > Math.max(c.rt || 0, c.rf || 0)) E("Радиатор " + cl.r + " мм некуда поставить: сверху " + (c.rt ? "до " + c.rt + " мм" : "нельзя") + ", спереди " + (c.rf ? "до " + c.rf + " мм" : "нельзя"), cat === "case" ? "cooler" : "case");
    }
    if (c && psu && (cat === "case" || cat === "psu")) {
      if (c.psu === "SFX" && psu.ff === "ATX") E("В этот корпус встаёт только компактный блок питания SFX", cat === "case" ? "psu" : "case");
      else if (c.psu === "ATX" && psu.ff === "SFX") warn.push("Блок SFX встанет в ATX-корпус только через переходник-рамку");
    }
    // плата
    if (mb && cpu && (cat === "mb" || cat === "cpu") && mb.s !== cpu.s) E("Сокет не тот: процессор " + cpu.s + ", а плата " + mb.s, cat === "mb" ? "cpu" : "mb");
    if (mb && ram && (cat === "mb" || cat === "ram")) {
      if (mb.mem !== ram.t) E("Память " + ram.t + " не встанет: плата под " + mb.mem, cat === "mb" ? "ram" : "mb");
      else if (ram.k > mb.ms) E("В комплекте " + ram.k + " " + plural(ram.k, "планка", "планки", "планок") + ", а на плате " + mb.ms + " " + plural(mb.ms, "слот", "слота", "слотов"), cat === "mb" ? "ram" : "mb");
    }
    if (!mb && cpu && ram && (cat === "cpu" || cat === "ram")) {
      var need = cpu.s === "AM4" ? "DDR4" : cpu.s === "LGA1700" ? null : "DDR5";
      if (need && ram.t !== need) E("Процессор на " + cpu.s + " работает только с " + need, cat === "cpu" ? "ram" : "cpu");
    }
    if (mb && ssd && (cat === "mb" || cat === "ssd") && ssd.k === "m2" && mb.m2 < 1) E("На плате нет слота M.2", cat === "mb" ? "ssd" : "mb");
    // охлаждение и процессор
    if (cpu && cl && (cat === "cpu" || cat === "cooler")) {
      if (cl.tdp < cpu.pw * .6) E("Кулер не справится: рассчитан на " + cl.tdp + " Вт, а процессор выделяет до " + cpu.pw + " Вт", cat === "cpu" ? "cooler" : "cpu");
      else if (cl.tdp < cpu.pw) warn.push("Кулер слабоват (" + cl.tdp + " Вт при " + cpu.pw + " Вт у процессора): под нагрузкой будет шумно и горячо");
    }
    // питание
    if (psu && (cat === "psu" || cat === "cpu" || cat === "gpu")) {
      var pw = powerOf({ case: c, cpu: cpu, gpu: gpu, cooler: cl });
      if (psu.w < pw.load) E("Мощности мало: сборка потребляет до " + pw.load + " Вт, а блок " + psu.w + " Вт", cat === "psu" ? (gpu && cat !== "gpu" ? "gpu" : "cpu") : "psu");
      else if (psu.w < pw.rec) warn.push("Блок впритык: сборке нужно до " + pw.load + " Вт, лучше взять от " + pw.rec + " Вт");
      if (gpu && gpu.w >= 300 && /^80\+$/.test(psu.cert)) warn.push("Для мощной видеокарты лучше блок с сертификатом Bronze или Gold");
    }
    return { err: err, warn: warn };
  }

  /* ---------- состояние ---------- */
  var build = {}, active = "case", q = "", sortBy = "fit", onlyFit = false, chip = {};
  var byId = {}; CATS.forEach(function (c) { D[c.list].forEach(function (it) { byId[c.k + ":" + it.id] = it; }); });
  var view3d = null;

  /* ---------- 3D ---------- */
  var stage = $("#pcStage");
  function load3D() {
    return new Promise(function (ok, no) {
      if (window.THREE) return ok();
      var s = document.createElement("script"); s.src = "js/vendor/three.min.js"; s.onload = ok; s.onerror = no; document.head.appendChild(s);
    });
  }
  load3D().then(function () {
    try {
      view3d = window.PC3D.create($("#pcCanvasHost"), {
        onPanels: syncPanelBtns,
        onPick: function (cat) { openCat(cat); }
      });
      stage.classList.add("is-ready");
      view3d.update(build);
      syncPanelBtns(view3d.panels());
    } catch (e) { if (window.console) console.error(e); stage.classList.add("is-fail"); }
  }).catch(function () { stage.classList.add("is-fail"); });

  /* ---------- шаги слева ---------- */
  var stepsEl = $("#pcSteps");
  function renderSteps() {
    stepsEl.innerHTML = CATS.map(function (c) {
      var it = build[c.k], st = it ? check(c.k, it, without(c.k)) : null;
      var cls = "pcs-step" + (active === c.k ? " is-on" : "") + (it ? " is-set" : "") + (st && st.err.length ? " is-err" : st && st.warn.length ? " is-warn" : "");
      return '<div class="' + cls + '" data-cat="' + c.k + '">' +
        '<button type="button" class="pcs-step__main" data-open="' + c.k + '">' +
        '<span class="pcs-step__ico"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[c.k] + "</svg></span>" +
        '<span class="pcs-step__txt"><b>' + c.name + "</b><small>" + (it ? esc(title(it)) : c.k === "gpu" ? "не обязательно, если есть встройка" : "не выбрано") + "</small></span>" +
        '<span class="pcs-step__price">' + (it ? rub(it.p) : "") + "</span></button>" +
        (it ? '<button type="button" class="pcs-step__x" data-rm="' + c.k + '" aria-label="Убрать ' + c.one + '">×</button>' : "") + "</div>";
    }).join("");
  }
  function without(k) { var b = {}; Object.keys(build).forEach(function (x) { if (x !== k) b[x] = build[x]; }); return b; }
  stepsEl.addEventListener("click", function (e) {
    var rm = e.target.closest("[data-rm]"), op = e.target.closest("[data-open]");
    if (rm) { remove(rm.getAttribute("data-rm")); return; }
    if (op) openCat(op.getAttribute("data-open"));
  });

  /* ---------- итог ---------- */
  function totals() {
    var sum = 0, n = 0; CATS.forEach(function (c) { if (build[c.k]) { sum += build[c.k].p; n++; } });
    var pw = powerOf(build), probs = problems();
    $("#pcTotal").textContent = rub(sum);
    $("#pcCount").textContent = n + " из " + CATS.length;
    $("#pcPower").textContent = build.cpu || build.gpu ? "до " + pw.load + " Вт · блок от " + pw.rec + " Вт" : "—";
    var bar = $("#pcPowerBar"); if (bar) bar.style.width = build.psu ? Math.min(100, pw.load / build.psu.w * 100) + "%" : "0%";
    var pEl = $("#pcProblems");
    if (probs.err.length || probs.warn.length || probs.miss.length) {
      pEl.hidden = false;
      pEl.innerHTML = probs.err.map(function (t) { return '<li class="is-err">' + esc(t) + "</li>"; }).join("") +
        probs.warn.map(function (t) { return '<li class="is-warn">' + esc(t) + "</li>"; }).join("") +
        (probs.miss.length ? '<li class="is-miss">Осталось выбрать: ' + esc(probs.miss.join(", ")) + "</li>" : "");
    } else { pEl.hidden = true; pEl.innerHTML = ""; }
    var on = $("#pcPower1");
    on.disabled = !!(probs.err.length || probs.miss.length);
    on.title = on.disabled ? (probs.miss.length ? "Сначала собери всё: " + probs.miss.join(", ") : "Сначала исправь ошибки совместимости") : "";
    writeHash();
  }
  function problems() {
    var err = [], warn = [], miss = [];
    CATS.forEach(function (c) {
      var it = build[c.k];
      if (!it) { if (c.k !== "gpu" || !(build.cpu && build.cpu.ig)) miss.push(c.name.toLowerCase()); return; }
      var r = check(c.k, it, without(c.k));
      r.err.forEach(function (x) { if (err.indexOf(x.t) < 0) err.push(x.t); });
      r.warn.forEach(function (x) { if (warn.indexOf(x) < 0) warn.push(x); });
    });
    if (build.cpu && !build.gpu && !build.cpu.ig) err.push("Нет видеовыхода: у процессора нет встроенной графики — поставь видеокарту");
    return { err: err, warn: warn, miss: miss };
  }

  /* ---------- каталог ---------- */
  var listEl = $("#pcList"), headEl = $("#pcCatHead"), chipsEl = $("#pcChips"), searchEl = $("#pcSearch"), sortEl = $("#pcSort"), fitEl = $("#pcFit");
  var CHIPS = {
    case: [["ATX", function (x) { return x.mb.indexOf("A") >= 0; }], ["mATX", function (x) { return x.mb.indexOf("A") < 0 && x.mb.indexOf("M") >= 0; }], ["Mini-ITX", function (x) { return x.mb === "I"; }], ["белые", function (x) { return x.col === "white"; }], ["сетка спереди", function (x) { return x.front === "mesh"; }], ["панорамные", function (x) { return x.front === "glass"; }]],
    mb: [["AM4", function (x) { return x.s === "AM4"; }], ["AM5", function (x) { return x.s === "AM5"; }], ["LGA1700", function (x) { return x.s === "LGA1700"; }], ["LGA1851", function (x) { return x.s === "LGA1851"; }], ["DDR4", function (x) { return x.mem === "DDR4"; }], ["DDR5", function (x) { return x.mem === "DDR5"; }], ["Wi-Fi", function (x) { return x.wifi; }]],
    cpu: [["AMD", function (x) { return x.b === "AMD"; }], ["Intel", function (x) { return x.b === "Intel"; }], ["со встройкой", function (x) { return !!x.ig && (x.igs || 0) >= 10; }], ["для игр X3D", function (x) { return /X3D/.test(x.n); }]],
    cooler: [["башни", function (x) { return x.k === "tower"; }], ["СЖО", function (x) { return x.k === "aio"; }], ["низкие", function (x) { return x.k === "low"; }], ["ARGB", function (x) { return x.rgb; }]],
    ram: [["DDR4", function (x) { return x.t === "DDR4"; }], ["DDR5", function (x) { return x.t === "DDR5"; }], ["16 ГБ", function (x) { return x.gb === 16; }], ["32 ГБ", function (x) { return x.gb === 32; }], ["64+ ГБ", function (x) { return x.gb >= 64; }], ["RGB", function (x) { return x.rgb; }]],
    gpu: [["NVIDIA", function (x) { return /RTX|GTX/.test(x.chip); }], ["AMD", function (x) { return /RX/.test(x.chip); }], ["Intel", function (x) { return /Arc/.test(x.chip); }], ["12+ ГБ", function (x) { return x.vr >= 12; }], ["короткие до 250 мм", function (x) { return x.len <= 250; }]],
    ssd: [["M.2", function (x) { return x.k === "m2"; }], ["SATA", function (x) { return x.k === "sata"; }], ["HDD", function (x) { return x.k === "hdd"; }], ["2 ТБ+", function (x) { return x.tb >= 2; }]],
    psu: [["до 650 Вт", function (x) { return x.w <= 650; }], ["750–850 Вт", function (x) { return x.w >= 750 && x.w <= 850; }], ["1000+ Вт", function (x) { return x.w >= 1000; }], ["Gold+", function (x) { return /Gold|Platinum/.test(x.cert); }], ["SFX", function (x) { return x.ff === "SFX"; }]]
  };
  function openCat(k) {
    if (!CAT[k]) return;
    active = k; q = ""; searchEl.value = ""; chip = {};
    renderSteps(); renderCat();
    app.classList.add("is-cat");
    if (window.matchMedia("(max-width: 980px)").matches) { var p = $("#pcCat"); if (p) p.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }
  function renderCat() {
    var c = CAT[active], all = D[c.list];
    headEl.innerHTML = '<span class="pcc__ico"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[active] + "</svg></span><div><b>" + c.name + "</b><small>" + all.length + " " + plural(all.length, "модель", "модели", "моделей") + " в каталоге</small></div>";
    chipsEl.innerHTML = (CHIPS[active] || []).map(function (ch, i) { return '<button type="button" class="pcc-chip' + (chip[i] ? " on" : "") + '" data-chip="' + i + '">' + ch[0] + "</button>"; }).join("");
    var base = without(active), qq = q.trim().toLowerCase();
    var rows = all.map(function (it) { return { it: it, r: check(active, it, base) }; }).filter(function (x) {
      if (qq && (title(x.it) + " " + specs(active, x.it).join(" ")).toLowerCase().indexOf(qq) < 0) return false;
      for (var i in chip) if (chip[i] && !CHIPS[active][i][1](x.it)) return false;
      if (onlyFit && x.r.err.length) return false;
      return true;
    });
    rows.sort(function (a, b) {
      if (sortBy === "fit") { var fa = a.r.err.length ? 2 : a.r.warn.length ? 1 : 0, fb = b.r.err.length ? 2 : b.r.warn.length ? 1 : 0; if (fa !== fb) return fa - fb; return a.it.p - b.it.p; }
      if (sortBy === "pa") return a.it.p - b.it.p;
      if (sortBy === "pd") return b.it.p - a.it.p;
      if (sortBy === "perf") return perf(b.it) - perf(a.it);
      return title(a.it).localeCompare(title(b.it), "ru");
    });
    var cur = build[active];
    listEl.innerHTML = rows.length ? rows.map(function (x) {
      var it = x.it, on = cur && cur.id === it.id, bad = x.r.err.length, warnN = x.r.warn.length;
      var conflicts = bad ? x.r.err.map(function (e) { return e.with; }).filter(function (w, i, a) { return w && w !== "case" && a.indexOf(w) === i && build[w]; }) : [];
      return '<article class="pci' + (on ? " is-on" : "") + (bad ? " is-bad" : warnN ? " is-warn" : "") + '" data-id="' + it.id + '">' +
        '<div class="pci__top"><div class="pci__name"><small>' + esc(it.b) + "</small><b>" + esc(it.n) + '</b></div><div class="pci__price">' + rub(it.p) + "</div></div>" +
        '<ul class="pci__spec">' + specs(active, it).filter(Boolean).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>" +
        (bad ? '<p class="pci__msg is-err">✕ ' + esc(x.r.err[0].t) + "</p>" : warnN ? '<p class="pci__msg is-warn">! ' + esc(x.r.warn[0]) + "</p>" : on ? '<p class="pci__msg is-ok">✓ Стоит в сборке</p>' : '<p class="pci__msg is-ok">✓ Подходит</p>') +
        '<div class="pci__act">' +
        (on ? '<button type="button" class="pci__btn pci__btn--rm" data-rm1="' + it.id + '">Снять</button>'
          : '<button type="button" class="pci__btn' + (bad ? " pci__btn--bad" : "") + '" data-put="' + it.id + '">' + (bad ? "Не встанет" : cur ? "Заменить" : "Поставить") + "</button>") +
        (bad && conflicts.length ? '<button type="button" class="pci__btn pci__btn--alt" data-swap="' + it.id + '" data-off="' + conflicts.join(",") + '">Снять ' + conflicts.map(function (w) { return CAT[w].one; }).join(" и ") + " и поставить</button>" : "") +
        '<span class="pci__links">' + links(it).map(function (l) { return '<a href="' + l[1] + '" target="_blank" rel="noopener nofollow">' + l[0] + "</a>"; }).join("") + "</span></div></article>";
    }).join("") : '<p class="pcc-empty">Ничего не нашлось. Сбрось фильтры или поиск.</p>';
    $("#pcCatInfo").textContent = "Показано " + rows.length + " из " + all.length + " · цены на " + D.date;
  }
  function perf(it) { return it.g || it.m || it.tdp || it.w || it.gb || it.tb * 10 || it.gpu || 0; }
  listEl.addEventListener("click", function (e) {
    var put = e.target.closest("[data-put]"), rm1 = e.target.closest("[data-rm1]"), sw = e.target.closest("[data-swap]");
    var list = D[CAT[active].list];
    function find(id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
    if (put) install(active, find(put.getAttribute("data-put")), put.closest(".pci"));
    else if (rm1) remove(active);
    else if (sw) { sw.getAttribute("data-off").split(",").forEach(function (k) { delete build[k]; }); install(active, find(sw.getAttribute("data-swap")), sw.closest(".pci")); }
  });
  chipsEl.addEventListener("click", function (e) { var b = e.target.closest("[data-chip]"); if (!b) return; var i = b.getAttribute("data-chip"); chip[i] = !chip[i]; renderCat(); });
  searchEl.addEventListener("input", function () { q = searchEl.value; renderCat(); });
  sortEl.addEventListener("change", function () { sortBy = sortEl.value; renderCat(); });
  fitEl.addEventListener("change", function () { onlyFit = fitEl.checked; renderCat(); });

  /* ---------- поставить / снять ---------- */
  var NEXT = { case: "mb", mb: "cpu", cpu: "cooler", cooler: "ram", ram: "gpu", gpu: "ssd", ssd: "psu", psu: null };
  function install(cat, it, card) {
    if (!it) return;
    var r = check(cat, it, without(cat));
    if (r.err.length) {
      toast("✕ " + r.err[0].t, "err");
      if (card) { card.classList.remove("is-shake"); void card.offsetWidth; card.classList.add("is-shake"); }
      if (view3d && build.case) view3d.ghost(cat, it);
      return;
    }
    build[cat] = it;
    if (r.warn.length) toast("! " + r.warn[0], "warn"); else toast("✓ " + CAT[cat].name + ": " + title(it), "ok");
    refresh();
    // следующий шаг — первый пустой после этого
    var nx = NEXT[cat]; while (nx && build[nx]) nx = NEXT[nx];
    if (nx) setTimeout(function () { openCat(nx); }, 350);
  }
  function remove(cat) {
    if (!build[cat]) return;
    if (cat === "case" && Object.keys(build).length > 1 && !confirm("Убрать корпус? Все детали тоже снимутся.")) return;
    if (cat === "case") build = {}; else delete build[cat];
    refresh();
  }
  function refresh() {
    if (view3d) view3d.update(build);
    stage.classList.toggle("has-case", !!build.case);
    renderSteps(); renderCat(); totals();
    if (monOn && !problems().miss.length) { renderGames(); if (curTab !== "games") tab(curTab); }
  }

  /* ---------- управление 3D ---------- */
  var tools = $("#pcTools");
  tools.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || !view3d) return;
    if (b.dataset.view) { view3d.view(b.dataset.view); if (b.dataset.view === "inside") syncPanelBtns(view3d.panels()); }
    if (b.dataset.panel) syncPanelBtns(view3d.setPanel(b.dataset.panel));
    if (b.dataset.zoom) view3d.zoom(+b.dataset.zoom);
    if (b.dataset.spin != null) b.classList.toggle("on", view3d.spin());
  });
  function syncPanelBtns(st) {
    Array.prototype.forEach.call(tools.querySelectorAll("[data-panel]"), function (b) {
      var n = b.dataset.panel; b.hidden = !(n in st); b.classList.toggle("on", !!st[n]);
      b.setAttribute("aria-pressed", st[n] ? "true" : "false");
    });
  }

  /* ---------- готовые сборки ---------- */
  var PRESETS = [
    { n: "Офис и учёба", d: "без видеокарты, на встроенной графике", b: { case: "dc-m40", mb: "msi-a520ma", cpu: "r5-5600g", cooler: "id-se903", ram: "kf-d4-16", ssd: "kn-nv3-500", psu: "dc-pf500" } },
    { n: "Игровой старт", d: "1080p, высокие настройки", b: { case: "dc-cc560", mb: "as-b760mkd4", cpu: "i5-12400f", cooler: "dc-ak400", ram: "kf-d4-16", gpu: "g-5060g", ssd: "kn-nv3-1", psu: "dc-pf650" } },
    { n: "Оптимальный", d: "1440p, высокие настройки", b: { case: "dc-ch560", mb: "gb-b650mgxax", cpu: "r5-7500f", cooler: "tr-pa120se", ram: "kf-d5-32", gpu: "g-5070m", ssd: "kn-nv3-1", psu: "dc-pn750d" } },
    { n: "Мощный 4K", d: "4K и стрим, топовый игровой процессор", b: { case: "ll-216", mb: "gb-b850eagle", cpu: "r7-9800x3d", cooler: "dc-ls720", ram: "kfr-d5-32", gpu: "g-5080", ssd: "sm-990ep-2", psu: "cr-rm850x" } },
    { n: "Компактный ITX", d: "маленький, но игровой", b: { case: "cm-nr200p", mb: "ar-b650i", cpu: "r5-7600", cooler: "dc-ak400", ram: "kf-d5-32", gpu: "g-5060ti16", ssd: "sm-990ep-1", psu: "ll-sp750" } }
  ];
  var preEl = $("#pcPresets");
  preEl.innerHTML = PRESETS.map(function (p, i) {
    var sum = 0; Object.keys(p.b).forEach(function (k) { var it = byId[k + ":" + p.b[k]]; if (it) sum += it.p; });
    return '<button type="button" class="pcp-pre" data-pre="' + i + '"><b>' + p.n + "</b><small>" + p.d + "</small><span>≈ " + rub(sum) + "</span></button>";
  }).join("");
  preEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-pre]"); if (!b) return;
    var p = PRESETS[+b.dataset.pre], nb = {};
    Object.keys(p.b).forEach(function (k) { var it = byId[k + ":" + p.b[k]]; if (it) nb[k] = it; });
    if (monOn) powerOff();
    build = nb; refresh(); openCat("case");
    toast("Сборка «" + p.n + "» на стенде — можно менять любую деталь", "ok");
    $("#pcApp").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------- ссылка на сборку ---------- */
  function writeHash() {
    var parts = CATS.filter(function (c) { return build[c.k]; }).map(function (c) { return c.k + "." + build[c.k].id; });
    var h = parts.length ? "#b=" + parts.join("~") : "";
    if (location.hash !== h && (h || location.hash.indexOf("#b=") === 0)) history.replaceState(null, "", location.pathname + location.search + h);
  }
  function readHash() {
    var m = location.hash.match(/#b=([^#]+)/); if (!m) return false;
    m[1].split("~").forEach(function (p) { var kv = p.split("."); var it = byId[kv[0] + ":" + kv.slice(1).join(".")]; if (it) build[kv[0]] = it; });
    return true;
  }
  $("#pcShare").addEventListener("click", function () {
    writeHash();
    var url = location.href;
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast("Ссылка на сборку скопирована", "ok"); }, function () { prompt("Скопируй ссылку:", url); });
    else prompt("Скопируй ссылку:", url);
  });
  $("#pcReset").addEventListener("click", function () { if (!Object.keys(build).length || confirm("Разобрать сборку?")) { if (monOn) powerOff(); build = {}; refresh(); openCat("case"); } });
  $("#pcOrder").addEventListener("click", function () {
    var sum = 0; CATS.forEach(function (c) { if (build[c.k]) sum += build[c.k].p; });
    var plan = "Сборка ПК" + (sum ? " ≈ " + rub(sum) : "");
    writeHash();
    location.href = "index.html?plan=" + encodeURIComponent(plan) + "&build=" + encodeURIComponent(location.hash.slice(3)) + "#contact";
  });

  /* ---------- включение и монитор: игры с разбором, сводка, сравнение сборок, печать ---------- */
  var monOn = false, monEl = $("#pcMonitor"), res = 1, qual = 2, gq = "", gsort = "pop", gcls = "", shown = 0, GAMES = parseGames();
  function parseGames() {
    return RAW.map(function (s, i) {
      var p = s.split("|"), g = { n: p[0], y: +p[1], c: p[2], i: i };
      p.slice(3).forEach(function (o) { if (/^f=/.test(o)) g.f = +o.slice(2); else if (o === "cpu") g.cpu = 1; else if (/^c\d+/.test(o)) g.cap = +o.slice(1); });
      return g;
    });
  }
  var CLS = { e: { f: 220, cpu: 450, vr: 4, t: "онлайн" }, l: { f: 300, cpu: 600, vr: 2, t: "лёгкая" }, m: { f: 120, cpu: 250, vr: 5, t: "средняя" }, h: { f: 65, cpu: 150, vr: 7, t: "тяжёлая" }, x: { f: 45, cpu: 120, vr: 8, t: "очень тяжёлая" } };
  // разрешения и пресеты графики: множитель к FPS (относительно 1080p «Высокие») и к нужной видеопамяти
  var RES = [{ n: "720p", px: "1280×720", k: 1.7, kl: 1.22, vr: .85 }, { n: "1080p", px: "1920×1080", k: 1, kl: 1, vr: 1 }, { n: "1440p", px: "2560×1440", k: .67, kl: .78, vr: 1.25 }, { n: "4K", px: "3840×2160", k: .38, kl: .52, vr: 1.6 }];
  var QS = [{ n: "Низкие", k: 1.85, vr: .65 }, { n: "Средние", k: 1.38, vr: .8 }, { n: "Высокие", k: 1, vr: 1 }, { n: "Ультра", k: .78, vr: 1.25 }];
  function gBase(g) { return g.f || CLS[g.c].f; }
  function cRef(g) { var b = gBase(g); return g.cpu ? b * 1.35 : Math.max(b * 1.25, CLS[g.c].cpu); }
  function gpuScore(b) { return b.gpu ? b.gpu.g : (b.cpu && b.cpu.igs) || 3; }
  // оценка FPS: упор в видеокарту (разрешение, качество, видеопамять) или в процессор; предел кадров игры
  function fpsFor(g, b, r, q) {
    if (!b.cpu) return { v: 0, lim: "gpu" };
    var K = CLS[g.c], R = RES[r], Q = QS[q], vr = b.gpu ? b.gpu.vr : 2;
    var gf = gBase(g) * gpuScore(b) / 100 * (g.c === "l" ? R.kl : R.k) * Q.k;
    var need = K.vr * R.vr * Q.vr;
    if (vr < need) gf *= Math.pow(vr / need, 1.4);
    if (b.ram && b.ram.gb < 16 && g.c !== "l") gf *= .85;
    var cf = cRef(g) * b.cpu.g / 70;
    var v = Math.min(gf, cf), lim = gf <= cf ? "gpu" : "cpu";
    if (g.cap && v > g.cap) { v = g.cap; lim = "cap"; }
    return { v: Math.max(1, Math.round(v)), lim: lim };
  }
  function fps(g) { return fpsFor(g, build, res, qual); }
  function fpsTxt(v) { return v >= 300 ? "300+" : String(v); }
  function verdict(v) { return v >= 144 ? ["Отлично", "a"] : v >= 90 ? ["Очень плавно", "b"] : v >= 60 ? ["Комфортно", "c"] : v >= 40 ? ["Играбельно", "d"] : v >= 25 ? ["Тяжело", "e"] : ["Не тянет", "f"]; }
  function demand(g) { return Math.max(1, Math.min(10, 13 - 3 * Math.log(gBase(g) / 20) / Math.LN2 + (g.cpu ? .4 : 0))); }
  function sysLine(b) { return b.cpu ? b.cpu.n + " · " + (b.gpu ? b.gpu.chip + " " + b.gpu.vr + " ГБ" : (b.cpu.ig || "встроенная графика")) + (b.ram ? " · " + b.ram.gb + " ГБ " + b.ram.t : "") : "—"; }

  function powerOn() {
    var pr = problems();
    if (pr.miss.length) { toast("Сначала собери всё: " + pr.miss.join(", "), "err"); return; }
    if (pr.err.length) { toast("✕ " + pr.err[0], "err"); return; }
    if (!view3d) { openMonitor(); return; }
    monOn = true; app.classList.add("is-power"); $("#pcPower1").textContent = "Включается…";
    view3d.power(true, placeMonitor);
  }
  function openMonitor() { monOn = true; app.classList.add("is-power", "is-monitor"); placeMonitor(null); }
  function placeMonitor(r) {
    if (r && stage.clientWidth < 700) r = null;              // на телефоне экран 3D-монитора мелкий — список на всю студию
    app.classList.add("is-monitor");
    $("#pcPower1").textContent = "Выключить";
    if (r) { monEl.style.left = r.x + "px"; monEl.style.top = r.y + "px"; monEl.style.width = r.w + "px"; monEl.style.height = r.h + "px"; monEl.classList.remove("is-flat"); }
    else { monEl.style.cssText = ""; monEl.classList.add("is-flat"); }
    if (!monEl.classList.contains("is-on")) { monEl.hidden = false; requestAnimationFrame(function () { monEl.classList.add("is-on"); }); tab("games"); renderGames(true); }
  }
  function powerOff() {
    monOn = false; monEl.classList.remove("is-on"); monEl.hidden = true; closeGame();
    app.classList.remove("is-power", "is-monitor");
    $("#pcPower1").textContent = "Включить ПК";
    if (view3d) view3d.power(false);
  }
  $("#pcPower1").addEventListener("click", function () { if (monOn) powerOff(); else powerOn(); });
  $("#pcMonOff").addEventListener("click", powerOff);

  /* вкладки монитора */
  var curTab = "games";
  function tab(t) {
    curTab = t;
    Array.prototype.forEach.call(monEl.querySelectorAll("[data-tab]"), function (b) { var on = b.dataset.tab === t; b.classList.toggle("on", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    Array.prototype.forEach.call(monEl.querySelectorAll("[data-pane]"), function (p) { p.classList.toggle("is-on", p.dataset.pane === t); });
    if (t === "sum") renderSum(); else if (t === "cmp") renderCmp();
  }
  monEl.querySelector(".pcm__tabs").addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) tab(b.dataset.tab); });

  /* --- список игр --- */
  var glist = $("#pcGames"), gsum = $("#pcGSum");
  function renderGames(reset) {
    if (!build.cpu) return;
    $("#pcGSys").textContent = sysLine(build);
    var qq = gq.trim().toLowerCase();
    var rows = GAMES.filter(function (g) { return (!gcls || g.c === gcls) && (!qq || g.n.toLowerCase().indexOf(qq) >= 0); })
      .map(function (g) { return { g: g, f: fps(g) }; });
    if (gsort === "fd") rows.sort(function (a, b) { return b.f.v - a.f.v; });
    else if (gsort === "fa") rows.sort(function (a, b) { return a.f.v - b.f.v; });
    else if (gsort === "az") rows.sort(function (a, b) { return a.g.n.localeCompare(b.g.n, "ru"); });
    else if (gsort === "new") rows.sort(function (a, b) { return b.g.y - a.g.y || a.g.i - b.g.i; });
    var all = GAMES.map(fps), ok60 = all.filter(function (f) { return f.v >= 60; }).length, hard = all.filter(function (f) { return f.v < 30; }).length;
    gsum.innerHTML = '<span class="is-a"><b>' + ok60 + "</b> из " + GAMES.length + " — 60+ FPS</span>" + '<span class="is-f"><b>' + hard + "</b> — меньше 30 FPS</span>" +
      "<span><b>" + rows.length + "</b> " + plural(rows.length, "игра", "игры", "игр") + " в списке · нажми на игру — разбор</span>";
    if (reset !== false) { glist.innerHTML = ""; shown = 0; glist.scrollTop = 0; }
    glist._rows = rows; more();
    if (openG) renderGame(openG);
  }
  function more() {
    var rows = glist._rows || [], end = Math.min(rows.length, shown + 80), html = "";
    for (var i = shown; i < end; i++) {
      var r = rows[i], v = verdict(r.f.v), pct = Math.min(100, r.f.v / 2.4);
      html += '<li class="pcg is-' + v[1] + '" data-g="' + r.g.i + '" tabindex="0" role="button" aria-label="Разбор: ' + esc(r.g.n) + '"><span class="pcg__n"><b>' + esc(r.g.n) + "</b><small>" + r.g.y + " · " + CLS[r.g.c].t + (r.f.lim === "cpu" ? " · упор в процессор" : r.f.lim === "cap" ? " · предел игры " + r.g.cap + " FPS" : "") + "</small></span>" +
        '<span class="pcg__bar"><i style="width:' + pct.toFixed(1) + '%"></i></span><span class="pcg__f"><b>' + fpsTxt(r.f.v) + "</b><small>" + v[0] + "</small></span></li>";
    }
    glist.insertAdjacentHTML("beforeend", html); shown = end;
  }
  glist.addEventListener("scroll", function () { if (glist.scrollTop + glist.clientHeight > glist.scrollHeight - 300) more(); }, { passive: true });
  glist.addEventListener("click", function (e) { var li = e.target.closest("[data-g]"); if (li) openGame(GAMES[+li.dataset.g]); });
  glist.addEventListener("keydown", function (e) { if (e.key !== "Enter" && e.key !== " ") return; var li = e.target.closest("[data-g]"); if (li) { e.preventDefault(); openGame(GAMES[+li.dataset.g]); } });
  $("#pcGRes").addEventListener("click", function (e) { var b = e.target.closest("[data-res]"); if (!b) return; res = +b.dataset.res; seg(this, b); renderGames(); });
  $("#pcGQ").addEventListener("click", function (e) { var b = e.target.closest("[data-q]"); if (!b) return; qual = +b.dataset.q; seg(this, b); renderGames(); });
  $("#pcGCls").addEventListener("change", function () { gcls = this.value; renderGames(); });
  $("#pcGSort").addEventListener("change", function () { gsort = this.value; renderGames(); });
  $("#pcGSearch").addEventListener("input", function () { gq = this.value; renderGames(); });
  function seg(box, b) { Array.prototype.forEach.call(box.querySelectorAll("button"), function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); }

  /* --- разбор игры: «потянет ли», шкалы видеокарты и процессора, FPS по настройкам --- */
  var gEl = $("#pcGame"), openG = null;
  var TARGETS = [[30, 0, 0], [60, 1, 1], [60, 1, 2], [60, 1, 3], [60, 2, 2], [60, 3, 3]];       // [FPS, разрешение, пресет]
  function needGpu(g, T, r, q) { return T * 100 / (gBase(g) * (g.c === "l" ? RES[r].kl : RES[r].k) * QS[q].k); }
  function needCpu(g, T) { return T * 70 / cRef(g); }
  function cheapestGpu(g, r, q, T) {
    var list = D.gpus.slice().sort(function (a, b) { return a.p - b.p; });
    for (var i = 0; i < list.length; i++) {
      var b = { cpu: build.cpu, gpu: list[i], ram: build.ram };
      if (fpsFor(g, b, r, q).v >= T) return list[i];
    }
    return null;
  }
  function scaleBar(cls, mine, mineLbl, marks, max, note) {
    var pct = function (v) { return Math.max(0, Math.min(100, v / max * 100)); };
    return '<div class="pcbar ' + cls + '"><div class="pcbar__track"><i style="width:' + pct(mine).toFixed(1) + '%"></i><b>' + esc(mineLbl) + "</b>" +
      marks.map(function (m, i) { return '<span class="pcbar__tick' + (m.ok ? " ok" : "") + '" style="left:' + pct(m.v).toFixed(1) + '%"><em>' + (i + 1) + "</em></span>"; }).join("") + "</div>" +
      (function () {                                        // подписи раскладываются по строкам без наложений
        var ends = [], LW = 19, out = '', rows = 1;
        marks.map(function (m, i) { return { m: m, i: i, p: pct(m.v) }; }).sort(function (x, y) { return x.p - y.p; }).forEach(function (o) {
          var al = o.p > 80 ? 'r' : 'c', st = al === 'r' ? o.p - LW : o.p, en = al === 'r' ? o.p : o.p + LW, r = 0;
          while (ends[r] != null && st < ends[r] + 1) r++;
          ends[r] = en; rows = Math.max(rows, r + 1);
          out += '<span class="pcbar__m ' + al + (o.m.ok ? ' ok' : '') + (o.m.v > max ? ' far' : '') + '" style="left:' + o.p.toFixed(1) + '%;top:' + (r * 2.3) + 'em"><b><i>' + (o.i + 1) + '</i>' + o.m.t + '</b><small>' + o.m.s + '</small></span>';
        });
        return '<div class="pcbar__marks" style="height:' + (rows * 2.3 + .3) + 'em">' + out + '</div>';
      })() + (note ? '<p class="pcbar__note">' + note + "</p>" : "") + "</div>";
  }
  function gameHTML(g, forPrint) {
    var b = build, now = fpsFor(g, b, res, qual), vd = verdict(now.v), dm = demand(g), gs = gpuScore(b), gname = b.gpu ? b.gpu.chip : (b.cpu.ig || "встройка");
    // видеокарта
    var marks = TARGETS.map(function (t) {
      var need = needGpu(g, t[0], t[1], t[2]), capOk = !g.cap || g.cap >= t[0];
      return { v: need, t: t[0] + " FPS · " + QS[t[2]].n.toLowerCase(), s: RES[t[1]].n + (capOk ? "" : " · предел игры"), ok: gs >= need };
    });
    var gmax = Math.min(460, Math.max(gs * 1.18, marks[4].v * 1.08));
    var hi = marks[2].v, k = gs / hi;
    var gTxt = k >= 1 ? gname + " — в " + k.toFixed(1).replace(".", ",") + " раза мощнее, чем нужно для 60 FPS на высоких в 1080p."
      : gname + " — слабее нужного для 60 FPS на высоких в 1080p в " + (1 / k).toFixed(1).replace(".", ",") + " раза: лучше средние настройки.";
    var best = cheapestGpu(g, 2, 2, 60), best1 = cheapestGpu(g, 1, 2, 60);
    var up = (best1 ? "Дешевле всего 60 FPS на высоких в 1080p даст " + best1.chip + " (≈ " + rub(best1.p) + ")" : "В каталоге нет видеокарты на 60 FPS на высоких в 1080p") +
      (best ? ", в 1440p — " + best.chip + " (≈ " + rub(best.p) + ")." : ".");
    // процессор
    var cm = [60, 120, 144, 240].filter(function (T) { return !g.cap || T <= g.cap; }).map(function (T) { var n = needCpu(g, T); return { v: n, t: T + " FPS", s: "упор в процессор", ok: b.cpu.g >= n }; });
    var cmax = Math.max(b.cpu.g * 1.18, Math.min(130, (cm[cm.length - 1] || { v: 60 }).v * 1.08));
    var ck = b.cpu.g / needCpu(g, 60);
    var cTxt = b.cpu.n + (ck >= 1 ? " — в " + ck.toFixed(1).replace(".", ",") + " раза сильнее нужного для 60 FPS: процессор игру не тормозит." : " — слабоват: процессор не даст 60 FPS даже на низких.");
    if (g.cap) cTxt += " В игре предел " + g.cap + " FPS.";
    // таблица FPS
    var grid = '<table class="pcgrid"><thead><tr><th></th>' + RES.map(function (R) { return "<th>" + R.n + "<small>" + R.px + "</small></th>"; }).join("") + "</tr></thead><tbody>" +
      QS.map(function (Q, qi) {
        return "<tr><th>" + Q.n + "</th>" + RES.map(function (R, ri) {
          var f = fpsFor(g, b, ri, qi), v2 = verdict(f.v);
          return '<td class="is-' + v2[1] + (ri === res && qi === qual ? " is-cur" : "") + '"><b>' + fpsTxt(f.v) + "</b>" + (f.lim === "cpu" ? "<small>процессор</small>" : f.lim === "cap" ? "<small>предел</small>" : "") + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table>";
    return (forPrint ? '<p class="pp__sys">' + esc(sysLine(b)) + '</p>' : '') + '<div class="pcgd__hero"><div class="pcgd__title"><h3>' + esc(g.n) + "</h3><small>" + g.y + " · нагрузка: " + CLS[g.c].t + (g.cpu ? " · любит мощный процессор" : "") + "</small></div>" +
      '<div class="pcgd__demand"><span>Требовательность к железу</span><b>' + dm.toFixed(1).replace(".", ",") + " / 10</b><i><em style=\"width:" + (dm * 10).toFixed(0) + '%"></em></i></div>' +
      '<div class="pcgd__now is-' + vd[1] + '"><span>' + RES[res].n + ", " + QS[qual].n.toLowerCase() + "</span><b>" + fpsTxt(now.v) + " FPS</b><small>" + vd[0] + "</small></div></div>" +
      '<section class="pcgd__sec"><h4>Твоя видеокарта в ' + esc(g.n) + '</h4><p class="pcgd__lead">Отметки — какая сила видеокарты нужна для цели. Полоса — твоя ' + esc(gname) + ".</p>" +
      scaleBar("is-gpu", gs, gname, marks, gmax) + "<p>" + esc(gTxt) + '</p><p class="pcgd__up">' + esc(up) + "</p></section>" +
      '<section class="pcgd__sec"><h4>FPS при разных настройках и разрешениях</h4>' + grid + "</section>" +
      '<section class="pcgd__sec"><h4>Твой процессор в ' + esc(g.n) + "</h4>" + scaleBar("is-cpu", b.cpu.g, b.cpu.n, cm, cmax) + "<p>" + esc(cTxt) + "</p></section>" +
      '<p class="pcgd__note">Требования и FPS — расчёт по нашей модели производительности (без DLSS/FSR и генерации кадров), а не официальные системные требования разработчика.' + (forPrint ? "" : " Сила видеокарты: RTX 5060 = 100.") + "</p>";
  }
  function openGame(g) {
    if (!g) return; openG = g; gEl.hidden = false;
    renderGame(g);
    requestAnimationFrame(function () { gEl.classList.add("is-on"); });
  }
  function renderGame(g) {
    gEl.innerHTML = '<div class="pcgd__top"><button type="button" class="pcgd__back" data-back>← Все игры</button><span class="pcgd__sys"></span><span class="pcgd__act">' +
      '<a href="https://store.steampowered.com/search/?term=' + encodeURIComponent(g.n) + '" target="_blank" rel="noopener nofollow">Steam</a><button type="button" data-print-game>Печать</button></span></div>' +
      '<div class="pcgd__body">' + gameHTML(g) + "</div>";
  }
  function closeGame() { openG = null; gEl.classList.remove("is-on"); gEl.hidden = true; gEl.innerHTML = ""; }
  gEl.addEventListener("click", function (e) {
    if (e.target.closest("[data-back]")) closeGame();
    else if (e.target.closest("[data-print-game]") && openG) printDoc("Разбор: " + openG.n, gameHTML(openG, true));
  });

  /* --- сводка сборки --- */
  var KEY_GAMES = ["Counter-Strike 2", "Valorant", "Dota 2", "Fortnite", "PUBG: Battlegrounds", "Call of Duty: Warzone", "Battlefield 6", "Grand Theft Auto V Enhanced", "Red Dead Redemption 2", "Cyberpunk 2077",
    "Baldur's Gate 3", "Elden Ring", "Black Myth: Wukong", "Hogwarts Legacy", "Forza Horizon 5", "Minecraft", "Monster Hunter Wilds", "S.T.A.L.K.E.R. 2: Heart of Chornobyl", "Kingdom Come: Deliverance II", "Microsoft Flight Simulator 2024"];
  function gameByName(n) { for (var i = 0; i < GAMES.length; i++) if (GAMES[i].n === n) return GAMES[i]; return null; }
  function stats(b, r, q) {
    var arr = GAMES.map(function (g) { return fpsFor(g, b, r, q).v; }).sort(function (x, y) { return x - y; });
    return { ok60: arr.filter(function (v) { return v >= 60; }).length, med: arr[Math.floor(arr.length / 2)] || 0 };
  }
  function sumHTML(b, forPrint) {
    var sum = 0; CATS.forEach(function (c) { if (b[c.k]) sum += b[c.k].p; });
    var pw = powerOf(b), pr = problemsOf(b);
    var parts = '<table class="pcsum__t"><thead><tr><th>Деталь</th><th>Модель</th><th>Характеристики</th><th class="r">Цена</th>' + (forPrint ? "" : "<th>Где купить</th>") + "</tr></thead><tbody>" +
      CATS.map(function (c) {
        var it = b[c.k];
        if (!it) return "<tr><td>" + c.name + '</td><td colspan="' + (forPrint ? 3 : 4) + '" class="pcsum__no">не выбрано</td></tr>';
        return "<tr><td>" + c.name + "</td><td><b>" + esc(title(it)) + "</b></td><td>" + esc(specs(c.k, it).filter(Boolean).join(" · ")) + '</td><td class="r">' + rub(it.p) + "</td>" +
          (forPrint ? "" : "<td>" + links(it).map(function (l) { return '<a href="' + l[1] + '" target="_blank" rel="noopener nofollow">' + l[0] + "</a>"; }).join(" ") + "</td>") + "</tr>";
      }).join("") + '</tbody><tfoot><tr><td colspan="3">Итого примерно (цены на ' + D.date + ')</td><td class="r"><b>' + rub(sum) + "</b></td>" + (forPrint ? "" : "<td></td>") + "</tr></tfoot></table>";
    var comp = pr.err.length ? '<ul class="pcsum__probs">' + pr.err.map(function (t) { return '<li class="is-err">✕ ' + esc(t) + "</li>"; }).join("") + "</ul>"
      : '<p class="pcsum__ok">✓ Все детали совместимы' + (pr.warn.length ? ", есть замечания:" : "") + "</p>" + (pr.warn.length ? '<ul class="pcsum__probs">' + pr.warn.map(function (t) { return '<li class="is-warn">! ' + esc(t) + "</li>"; }).join("") + "</ul>" : "");
    var perf = b.cpu ? '<div class="pcsum__perf">' + [1, 2, 3].map(function (r) {
      var s = stats(b, r, 2);
      return '<div><span>' + RES[r].n + ", высокие</span><b>" + s.ok60 + " <small>из " + GAMES.length + "</small></b><em>игр с 60+ FPS · медиана " + fpsTxt(s.med) + " FPS</em></div>";
    }).join("") + "</div>" +
      '<table class="pcsum__t pcsum__g"><thead><tr><th>Популярные игры (высокие)</th>' + [1, 2, 3].map(function (r) { return '<th class="r">' + RES[r].n + "</th>"; }).join("") + "</tr></thead><tbody>" +
      KEY_GAMES.map(gameByName).filter(Boolean).map(function (g) {
        return "<tr><td>" + esc(g.n) + "</td>" + [1, 2, 3].map(function (r) { var f = fpsFor(g, b, r, 2), v = verdict(f.v); return '<td class="r is-' + v[1] + '"><b>' + fpsTxt(f.v) + "</b></td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table>" : "";
    return '<div class="pcsum__sys"><b>' + esc(sysLine(b)) + '</b><span>Потребление до ' + pw.load + " Вт · рекомендуемый блок от " + pw.rec + " Вт" + (b.psu ? " · стоит " + b.psu.w + " Вт (загрузка " + Math.round(pw.load / b.psu.w * 100) + "%)" : "") + "</span></div>" +
      parts + "<h4>Совместимость</h4>" + comp + (perf ? "<h4>Производительность в играх</h4>" + perf : "") +
      '<p class="pcgd__note">FPS — оценка по модели производительности без DLSS/FSR. Цены ориентировочные на ' + D.date + ", точные — по ссылкам на магазины.</p>";
  }
  function problemsOf(b) { var keep = build; build = b; var r = problems(); build = keep; return r; }
  function renderSum() {
    $("#pcSumBody").innerHTML = '<div class="pcsum__bar"><b>Сводка сборки</b><span>' +
      '<button type="button" data-sum="print">Печать / PDF</button><button type="button" data-sum="copy">Скопировать текстом</button><button type="button" data-sum="save">Сохранить для сравнения</button></span></div>' + sumHTML(build);
  }
  $("#pcSumBody").addEventListener("click", function (e) {
    var b = e.target.closest("[data-sum]"); if (!b) return;
    var a = b.dataset.sum;
    if (a === "print") printDoc("Сводка сборки ПК", sumHTML(build, true));
    else if (a === "copy") copyText(sumText(build));
    else if (a === "save") saveBuild();
  });
  function sumText(b) {
    var sum = 0, lines = ["Сборка ПК — " + (window.SITE && window.SITE.name || "НЕМЕЦ") + " · цены на " + D.date, ""];
    CATS.forEach(function (c) { var it = b[c.k]; if (it) { sum += it.p; lines.push(c.name + ": " + title(it) + " — " + rub(it.p)); } });
    var pw = powerOf(b);
    lines.push("", "Итого примерно: " + rub(sum), "Потребление до " + pw.load + " Вт, блок от " + pw.rec + " Вт");
    if (b.cpu) {
      lines.push("", "FPS (высокие настройки, оценка):");
      KEY_GAMES.slice(0, 10).map(gameByName).filter(Boolean).forEach(function (g) { lines.push("• " + g.n + ": 1080p " + fpsTxt(fpsFor(g, b, 1, 2).v) + " · 1440p " + fpsTxt(fpsFor(g, b, 2, 2).v) + " · 4K " + fpsTxt(fpsFor(g, b, 3, 2).v)); });
    }
    writeHash(); lines.push("", "Сборка по ссылке: " + location.href);
    return lines.join("\n");
  }
  function copyText(t) {
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { toast("Сводка скопирована — можно вставить в мессенджер", "ok"); }, function () { prompt("Скопируй:", t); });
    else prompt("Скопируй:", t);
  }

  /* --- сравнение сборок (сохраняются в этом браузере) --- */
  var SKEY = "pc-saved-builds";
  function loadSaved() { try { return JSON.parse(localStorage.getItem(SKEY) || "[]"); } catch (e) { return []; } }
  function storeSaved(a) { try { localStorage.setItem(SKEY, JSON.stringify(a)); return true; } catch (e) { return false; } }
  function idsOf(b) { var o = {}; CATS.forEach(function (c) { if (b[c.k]) o[c.k] = b[c.k].id; }); return o; }
  function fromIds(o) { var b = {}; Object.keys(o || {}).forEach(function (k) { var it = byId[k + ":" + o[k]]; if (it) b[k] = it; }); return b; }
  function saveBuild() {
    if (!build.cpu) { toast("Сначала собери хотя бы процессор и плату", "err"); return; }
    var a = loadSaved(), sum = 0; CATS.forEach(function (c) { if (build[c.k]) sum += build[c.k].p; });
    var name = (build.gpu ? build.gpu.chip : build.cpu.n) + " · " + rub(sum);
    var key = JSON.stringify(idsOf(build));
    if (a.some(function (x) { return JSON.stringify(x.ids) === key; })) { toast("Эта сборка уже сохранена", "warn"); tab("cmp"); return; }
    a.push({ name: name, ids: idsOf(build), t: Date.now() }); if (a.length > 6) a.shift();
    if (!storeSaved(a)) { toast("Браузер не дал сохранить (приватный режим?)", "err"); return; }
    toast("Сборка сохранена — смотри вкладку «Сравнение сборок»", "ok");
    if (curTab === "cmp") renderCmp();
  }
  var CMP_GAMES = ["Counter-Strike 2", "Fortnite", "Cyberpunk 2077", "Black Myth: Wukong", "Red Dead Redemption 2", "Baldur's Gate 3", "Microsoft Flight Simulator 2024"];
  function cmpHTML(forPrint) {
    var saved = loadSaved(), cols = [{ name: "Сейчас на стенде", b: build, cur: true }].concat(saved.map(function (x, i) { return { name: x.name, b: fromIds(x.ids), i: i }; }));
    function price(b) { var s = 0; CATS.forEach(function (c) { if (b[c.k]) s += b[c.k].p; }); return s; }
    var rows = [
      ["Цена", function (b) { return price(b); }, function (v) { return rub(v); }, "min"],
      ["Процессор", function (b) { return b.cpu ? b.cpu.n : "—"; }],
      ["Видеокарта", function (b) { return b.gpu ? b.gpu.chip + " " + b.gpu.vr + " ГБ" : b.cpu && b.cpu.ig ? "встройка" : "—"; }],
      ["Память", function (b) { return b.ram ? b.ram.gb + " ГБ " + b.ram.t : "—"; }],
      ["Потребление", function (b) { return b.cpu ? powerOf(b).load : 0; }, function (v) { return v ? "до " + v + " Вт" : "—"; }, "min"],
      ["Игр 60+ FPS · 1080p", function (b) { return b.cpu ? stats(b, 1, 2).ok60 : 0; }, null, "max"],
      ["Игр 60+ FPS · 1440p", function (b) { return b.cpu ? stats(b, 2, 2).ok60 : 0; }, null, "max"],
      ["Игр 60+ FPS · 4K", function (b) { return b.cpu ? stats(b, 3, 2).ok60 : 0; }, null, "max"]
    ].concat(CMP_GAMES.map(gameByName).filter(Boolean).map(function (g) { return [g.n + " · 1440p", function (b) { return b.cpu ? fpsFor(g, b, 2, 2).v : 0; }, function (v) { return v ? fpsTxt(v) + " FPS" : "—"; }, "max"]; }));
    var head = "<tr><th></th>" + cols.map(function (c) {
      return "<th>" + esc(c.name) + (forPrint || c.cur ? "" : '<span class="pccmp__act"><button type="button" data-cmp-load="' + c.i + '">На стенд</button><button type="button" data-cmp-del="' + c.i + '" aria-label="Удалить">×</button></span>') + "</th>";
    }).join("") + "</tr>";
    var body = rows.map(function (r) {
      var vals = cols.map(function (c) { return r[1](c.b); }), best = null;
      if (r[3]) { var nums = vals.filter(function (v) { return typeof v === "number" && v > 0; }); if (nums.length > 1) best = r[3] === "min" ? Math.min.apply(0, nums) : Math.max.apply(0, nums); }
      return "<tr><th>" + esc(r[0]) + "</th>" + vals.map(function (v) { return '<td class="' + (best !== null && v === best ? "is-best" : "") + '">' + esc(r[2] ? r[2](v) : v) + "</td>"; }).join("") + "</tr>";
    }).join("");
    return '<div class="pccmp__wrap"><table class="pccmp"><thead>' + head + "</thead><tbody>" + body + "</tbody></table></div>";
  }
  function renderCmp() {
    var n = loadSaved().length;
    $("#pcCmpBody").innerHTML = '<div class="pcsum__bar"><b>Сравнение сборок</b><span><button type="button" data-cmp="save">Сохранить текущую</button>' + (n ? '<button type="button" data-cmp="print">Печать / PDF</button>' : "") + "</span></div>" +
      (n ? "" : '<p class="pccmp__hint">Сохрани текущую сборку, поменяй детали (или поставь готовую) и сохрани ещё раз — здесь появится таблица: цена, мощность и FPS бок о бок. Хранится в этом браузере.</p>') + cmpHTML();
  }
  $("#pcCmpBody").addEventListener("click", function (e) {
    var s = e.target.closest("[data-cmp]"), ld = e.target.closest("[data-cmp-load]"), dl = e.target.closest("[data-cmp-del]");
    if (s && s.dataset.cmp === "save") saveBuild();
    else if (s && s.dataset.cmp === "print") printDoc("Сравнение сборок ПК", cmpHTML(true));
    else if (ld) { var x = loadSaved()[+ld.dataset.cmpLoad]; if (x) { build = fromIds(x.ids); refresh(); toast("Сборка «" + x.name + "» на стенде", "ok"); renderCmp(); } }
    else if (dl) { var a = loadSaved(); a.splice(+dl.dataset.cmpDel, 1); storeSaved(a); renderCmp(); }
  });
  $("#pcSave").addEventListener("click", saveBuild);

  /* --- печать: отдельный чистый лист (через «Печать» браузера можно сохранить в PDF) --- */
  var printEl = $("#pcPrint");
  function printDoc(head, html) {
    printEl.innerHTML = '<div class="pp__head"><b>' + esc((window.SITE && window.SITE.name) || "НЕМЕЦ") + " · " + esc(head) + "</b><span>" + new Date().toLocaleDateString("ru-RU") + " · цены на " + D.date + "</span></div>" +
      html +
      '<div class="pp__foot">Сборка по ссылке: ' + esc(location.href) + "</div>";
    document.body.classList.add("is-printing");
    setTimeout(function () { window.print(); }, 60);
  }
  window.addEventListener("afterprint", function () { document.body.classList.remove("is-printing"); });
  $("#pcPrintBtn").addEventListener("click", function () { writeHash(); printDoc("Сводка сборки ПК", sumHTML(build, true)); });

  /* ---------- старт ---------- */
  var nGames = GAMES.length, nItems = CATS.reduce(function (a, c) { return a + D[c.list].length; }, 0);
  Array.prototype.forEach.call(document.querySelectorAll("[data-pc]"), function (el) {
    var k = el.getAttribute("data-pc"); el.textContent = k === "items" ? nItems : k === "games" ? nGames : k === "cases" ? D.cases.length : k === "date" ? D.date : "";
  });
  readHash();
  stage.classList.toggle("has-case", !!build.case);
  renderSteps(); renderCat(); totals();
  if (Object.keys(build).length) { var first = null; CATS.forEach(function (c) { if (!first && !build[c.k]) first = c.k; }); openCat(first || "case"); }
  window.__pc = { build: function () { return build; }, check: check, problems: problems, install: function (c, id) { install(c, byId[c + ":" + id]); }, fps: function (n) { var g = GAMES.filter(function (x) { return x.n === n; })[0]; return g && build.cpu ? fps(g) : null; }, view: function () { return view3d; }, power: powerOn, off: powerOff, presets: PRESETS, byId: byId };
})();
