/* =====================================================================
   ОПЛАТА + СЕРВИСНЫЙ ЦЕНТР
   • главная: блок «Как платить» (SITE.payments / payMethods) и короткое
     меню сервисного центра (#svcMenu) со ссылками на service.html;
   • service.html: «орбита» значков, симптомы, фильтр, поиск, карточки.
   Данные утилит — window.SERVICE (js/tools.js), значки — assets/tools/<id>.png
   ===================================================================== */
(function () {
  "use strict";
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var $ = function (id) { return document.getElementById(id); };
  var toast = function (m, k) { if (window.SITE_UI && window.SITE_UI.toast) window.SITE_UI.toast(m, k); };

  /* ---------- оплата (главная) ---------- */
  var S = window.SITE || {}, payBox = $("payCards"), methods = $("payMethods");
  if (payBox && S.payments) {
    payBox.innerHTML = S.payments.map(function (p) {
      var bar = p.parts.map(function (v, j) { return '<span style="flex:' + v + '"><b>' + v + '%</b><small>' + esc(p.labels[j] || "") + "</small></span>"; }).join("");
      return '<article class="paycard' + (p.hot ? " paycard--hot" : "") + '">' + (p.hot ? '<i class="paycard__hot">чаще выбирают</i>' : "") +
        '<div class="paycard__top"><span class="paycard__ico">' + esc(p.icon) + '</span><div><h3>' + esc(p.title) + "</h3><small>" + esc(p.for) + "</small></div></div>" +
        '<div class="paycard__bar">' + bar + "</div>" +
        "<ul>" + p.points.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></article>";
    }).join("");
  }
  if (methods && S.payMethods) {
    methods.innerHTML = "<span>Способы:</span>" + S.payMethods.map(function (m) { return "<i>" + esc(m) + "</i>"; }).join("");
  }

  var D = window.SERVICE;
  if (!D) return;
  var PAGE = D.page || "service.html";
  var byId = {}; D.tools.forEach(function (t) { byId[t.id] = t; });
  var catName = {}; D.cats.forEach(function (c) { catName[c.id] = c.name; });
  function plural(n, a, b, c) { var m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c; }
  function img(t, size) {
    return '<img src="assets/tools/' + esc(t.id) + '.png" alt="" width="' + (size || 96) + '" height="' + (size || 96) + '" decoding="async">';
  }
  var ICO = {
    rocket: '<path d="M5 15c-1 1-2 4-2 6 2 0 5-1 6-2"/><path d="M9 15l-3-3c1-4 5-9 12-9 0 7-5 11-9 12z"/><circle cx="15" cy="9" r="1.6"/>',
    bsod: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M9 14c1.5-1.4 4.5-1.4 6 0M9 9.5h.01M15 9.5h.01"/>',
    temp: '<path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    usb: '<path d="M9 2h6v6H9z"/><path d="M7 8h10v8a5 5 0 0 1-10 0z"/><path d="M11 4h.01M13 4h.01"/>',
    buoy: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"/>'
  };

  /* ---------- главная: короткое меню-переход ---------- */
  var menu = $("svcMenu");
  if (menu) {
    var tiles = D.cats.filter(function (c) { return c.id !== "all"; }).map(function (c) {
      var ts = D.tools.filter(function (t) { return t.cat === c.id; });
      return '<a class="svcm__tile" href="' + PAGE + "#cat-" + c.id + '">' +
        '<span class="svcm__icons">' + ts.slice(0, 3).map(function (t) { return "<i>" + img(t, 48) + "</i>"; }).join("") + "</span>" +
        "<b>" + esc(c.name) + "</b><small>" + ts.length + " " + plural(ts.length, "утилита", "утилиты", "утилит") + "</small>" +
        '<em aria-hidden="true">↗</em></a>';
    }).join("");
    menu.innerHTML = tiles +
      '<a class="svcm__tile svcm__tile--all" href="' + PAGE + '"><span class="svcm__num">' + D.tools.length + "</span>" +
      "<b>Все утилиты</b><small>открыть центр</small><em aria-hidden=\"true\">→</em></a>";
    var cnt = $("svcmCount"); if (cnt) cnt.textContent = D.tools.length + " " + plural(D.tools.length, "утилита", "утилиты", "утилит");
  }

  /* ---------- service.html ---------- */
  var grid = $("svcGrid");
  if (!grid) return;
  var filters = $("svcFilters"), search = $("svcSearch"), info = $("svcInfo"), empty = $("svcEmpty"), symChip = $("svcSym");
  var st = $("svcStatus");
  if (st) st.textContent = D.tools.length + " " + plural(D.tools.length, "утилита", "утилиты", "утилит") + " · ссылки проверены " + D.checked + " · только официальные файлы";
  var nTools = $("sphTools"); if (nTools) nTools.textContent = D.tools.length;
  var nCats = $("sphCats"); if (nCats) nCats.textContent = D.cats.length - 1;

  // орбита значков в шапке страницы
  // все утилиты — на одном кольце вокруг андроида
  var r2 = $("orbR2");
  if (r2) {
    var put = function (list) {
      return list.map(function (t, i) {
        return '<button type="button" class="orb__it" style="--a:' + (360 / list.length * i).toFixed(2) + 'deg" data-tool="' + t.id + '" aria-label="' + esc(t.name) + '">' +
          '<span class="orb__tile">' + img(t, 56) + "<em>" + esc(t.name) + "</em></span></button>";
      }).join("");
    };
    r2.innerHTML = put(D.tools);
  }

  // симптомы
  var symBox = $("spsGrid");
  if (symBox && D.symptoms) {
    symBox.innerHTML = D.symptoms.map(function (s, i) {
      return '<button type="button" class="sym reveal" data-sym="' + s.id + '">' +
        '<span class="sym__ico"><svg viewBox="0 0 24 24" aria-hidden="true">' + (ICO[s.ico] || ICO.buoy) + "</svg></span>" +
        "<b>" + esc(s.name) + "</b><span class=\"sym__text\">" + esc(s.text) + "</span>" +
        '<span class="sym__tools">' + s.tools.map(function (id) { return byId[id] ? "<i>" + img(byId[id], 40) + "</i>" : ""; }).join("") +
        '<em>' + s.tools.length + " " + plural(s.tools.length, "утилита", "утилиты", "утилит") + " →</em></span></button>";
    }).join("");
  }

  // фильтр-категории
  filters.innerHTML = D.cats.map(function (c, i) {
    var n = c.id === "all" ? D.tools.length : D.tools.filter(function (t) { return t.cat === c.id; }).length;
    return '<button type="button" role="tab" class="svc__chip' + (i ? "" : " on") + '" data-cat="' + c.id + '" aria-selected="' + (i ? "false" : "true") + '">' + esc(c.name) + "<i>" + n + "</i></button>";
  }).join("");

  // карточки
  grid.innerHTML = D.tools.map(function (t) {
    var file = t.url.split("?")[0].split("/").pop();
    return '<article class="tool" id="tool-' + t.id + '" data-cat="' + t.cat + '" data-id="' + t.id + '">' +
      '<div class="tool__top"><span class="tool__ico">' + img(t, 96) + "</span>" +
      '<div class="tool__name"><h3>' + esc(t.name) + '</h3><span><i>' + esc(catName[t.cat] || "") + "</i>" + esc(t.ver) + "</span></div></div>" +
      '<p class="tool__what">' + esc(t.what) + "</p>" +
      '<p class="tool__when"><b>Когда нужна:</b> ' + esc(t.when) + "</p>" +
      '<div class="tool__meta"><span>' + esc(t.size) + "</span><span>" + esc(t.lic) + "</span><span>" + esc(t.os) + "</span></div>" +
      (t.note ? '<p class="tool__note">' + esc(t.note) + "</p>" : "") +
      '<a class="tool__dl" href="' + esc(t.url) + '" download rel="noopener" aria-label="Скачать ' + esc(t.name) + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>Скачать<small>' + esc(file) + "</small></a></article>";
  }).join("");
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".tool"));
  var hay = {}; D.tools.forEach(function (t) { hay[t.id] = (t.name + " " + t.what + " " + t.when + " " + (catName[t.cat] || "")).toLowerCase().replace(/ё/g, "е"); });

  var state = { cat: "all", sym: null, q: "" };
  function apply(animate) {
    var q = state.q.toLowerCase().replace(/ё/g, "е").trim(), shown = 0, k = 0;
    cards.forEach(function (c) {
      var id = c.getAttribute("data-id"), t = byId[id];
      var ok = (state.cat === "all" || t.cat === state.cat) && (!state.sym || state.sym.tools.indexOf(id) >= 0) && (!q || hay[id].indexOf(q) >= 0);
      c.classList.toggle("is-hidden", !ok);
      if (ok) {
        shown++;
        if (animate) { c.style.animationDelay = Math.min(k++, 8) * 40 + "ms"; c.classList.remove("is-pop"); void c.offsetWidth; c.classList.add("is-pop"); }
      }
    });
    Array.prototype.forEach.call(filters.children, function (x) {
      var on = !state.sym && x.getAttribute("data-cat") === state.cat;
      x.classList.toggle("on", on); x.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (symChip) {
      symChip.hidden = !state.sym;
      if (state.sym) symChip.querySelector("span").textContent = state.sym.name;
    }
    if (symBox) Array.prototype.forEach.call(symBox.children, function (b) { b.classList.toggle("on", !!state.sym && b.getAttribute("data-sym") === state.sym.id); });
    if (info) info.textContent = shown === D.tools.length ? "Показаны все " + shown : "Показано " + shown + " из " + D.tools.length;
    if (empty) empty.hidden = shown > 0;
  }
  function goTools() {
    var el = $("tools"); if (!el) return;
    el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  function setCat(cat, scroll) {
    state.cat = catName[cat] ? cat : "all"; state.sym = null;
    apply(true); if (scroll) goTools();
  }
  function setSym(id, scroll) {
    var s = (D.symptoms || []).filter(function (x) { return x.id === id; })[0];
    state.sym = s || null; state.cat = "all"; state.q = ""; if (search) search.value = "";
    apply(true); if (scroll) goTools();
  }
  function focusTool(id) {
    var c = $("tool-" + id); if (!c) return;
    if (c.classList.contains("is-hidden")) { state.cat = "all"; state.sym = null; state.q = ""; if (search) search.value = ""; apply(false); }
    c.scrollIntoView({ behavior: "smooth", block: "center" });
    c.classList.remove("is-flash"); void c.offsetWidth; c.classList.add("is-flash");
  }

  filters.addEventListener("click", function (e) {
    var b = e.target.closest(".svc__chip"); if (!b) return;
    setCat(b.getAttribute("data-cat"), false);
  });
  if (symBox) symBox.addEventListener("click", function (e) {
    var b = e.target.closest(".sym"); if (!b) return;
    var id = b.getAttribute("data-sym");
    if (state.sym && state.sym.id === id) { state.sym = null; apply(true); return; }
    setSym(id, true);
  });
  if (symChip) symChip.querySelector("button").addEventListener("click", function () { state.sym = null; apply(true); });
  if (search) {
    var tq;
    search.addEventListener("input", function () {
      clearTimeout(tq);
      tq = setTimeout(function () { state.q = search.value; apply(false); }, 120);
    });
    search.addEventListener("keydown", function (e) { if (e.key === "Escape") { search.value = ""; state.q = ""; apply(false); } });
  }
  document.addEventListener("click", function (e) {
    var o = e.target.closest && e.target.closest("[data-tool]"); if (!o) return;
    focusTool(o.getAttribute("data-tool"));
  });
  var resetBtn = $("svcReset");
  if (resetBtn) resetBtn.addEventListener("click", function () { state = { cat: "all", sym: null, q: "" }; if (search) search.value = ""; apply(true); });

  grid.addEventListener("click", function (e) {
    var a = e.target.closest(".tool__dl"); if (!a) return;
    a.classList.add("is-going");
    setTimeout(function () { a.classList.remove("is-going"); }, 1800);
    toast("Загрузка началась — файл с официального сервера", "ok");
  });

  // ссылки вида service.html#cat-disk / #sym-bsod / #tool-rufus
  function fromHash(scroll) {
    var h = decodeURIComponent(location.hash.slice(1));
    if (/^cat-/.test(h)) setCat(h.slice(4), scroll);
    else if (/^sym-/.test(h)) setSym(h.slice(4), scroll);
    else if (/^tool-/.test(h)) setTimeout(function () { focusTool(h.slice(5)); }, 300);
    else apply(false);
  }
  window.addEventListener("hashchange", function () { fromHash(true); });
  fromHash(true);
})();
