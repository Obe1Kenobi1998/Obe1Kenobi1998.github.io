/* =====================================================================
   СЕРВИСНЫЙ ЦЕНТР: карточки утилит с фильтром по категориям
   + блок «Как платить» (данные — SITE.payments, SITE.payMethods).
   ===================================================================== */
(function () {
  "use strict";
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* ---------- оплата ---------- */
  var S = window.SITE || {}, payBox = document.getElementById("payCards"), methods = document.getElementById("payMethods");
  if (payBox && S.payments) {
    payBox.innerHTML = S.payments.map(function (p, i) {
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

  /* ---------- сервисный центр ---------- */
  var D = window.SERVICE, grid = document.getElementById("svcGrid"), filters = document.getElementById("svcFilters");
  if (!D || !grid) return;
  var ICO = {
    disk: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="12" cy="12" r="4"/><path d="M12 12l3-3M7 17h.01"/>',
    ram: '<rect x="2" y="7" width="20" height="9" rx="1.5"/><path d="M6 10v3M10 10v3M14 10v3M18 10v3M5 16v3M19 16v3"/>',
    temp: '<path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>',
    pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    bug: '<path d="M8 9a4 4 0 0 1 8 0v5a4 4 0 0 1-8 0z"/><path d="M4 12h4M16 12h4M5 7l3 2M19 7l-3 2M5 18l3-2M19 18l-3-2M10 5l-1-2M14 5l1-2"/>',
    rocket: '<path d="M5 15c-1 1-2 4-2 6 2 0 5-1 6-2"/><path d="M9 15l-3-3c1-4 5-9 12-9 0 7-5 11-9 12z"/><circle cx="15" cy="9" r="1.6"/>',
    list: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6M7 17h8"/>',
    bsod: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M9 14c1.5-1.4 4.5-1.4 6 0M9 9.5h.01M15 9.5h.01"/>',
    usb: '<path d="M9 2h6v6H9z"/><path d="M7 8h10v8a5 5 0 0 1-10 0z"/><path d="M11 4h.01M13 4h.01"/>',
    usb2: '<path d="M12 3v14M8 7l4-4 4 4"/><circle cx="12" cy="19" r="2"/><path d="M7 11v2l5 2M17 9v3l-5 2"/>',
    buoy: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"/>',
    box: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'
  };
  var catName = {}; D.cats.forEach(function (c) { catName[c.id] = c.name; });
  var st = document.getElementById("svcStatus");
  if (st) st.textContent = D.tools.length + " утилит · ссылки проверены " + D.checked + " · только официальные файлы";

  filters.innerHTML = D.cats.map(function (c, i) {
    var n = c.id === "all" ? D.tools.length : D.tools.filter(function (t) { return t.cat === c.id; }).length;
    return '<button type="button" role="tab" class="svc__chip' + (i ? "" : " on") + '" data-cat="' + c.id + '" aria-selected="' + (i ? "false" : "true") + '">' + esc(c.name) + "<i>" + n + "</i></button>";
  }).join("");
  grid.innerHTML = D.tools.map(function (t) {
    var file = t.url.split("?")[0].split("/").pop();
    return '<article class="tool" data-cat="' + t.cat + '">' +
      '<div class="tool__top"><span class="tool__ico"><svg viewBox="0 0 24 24" aria-hidden="true">' + (ICO[t.ico] || ICO.box) + "</svg></span>" +
      '<div class="tool__name"><h3>' + esc(t.name) + '</h3><span><i>' + esc(catName[t.cat] || "") + "</i>" + esc(t.ver) + "</span></div></div>" +
      '<p class="tool__what">' + esc(t.what) + "</p>" +
      '<p class="tool__when"><b>Когда нужна:</b> ' + esc(t.when) + "</p>" +
      '<div class="tool__meta"><span>' + esc(t.size) + "</span><span>" + esc(t.lic) + "</span><span>" + esc(t.os) + "</span></div>" +
      (t.note ? '<p class="tool__note">' + esc(t.note) + "</p>" : "") +
      '<a class="tool__dl" href="' + esc(t.url) + '" download rel="noopener" aria-label="Скачать ' + esc(t.name) + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>Скачать<small>' + esc(file) + "</small></a></article>";
  }).join("");

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".tool"));
  filters.addEventListener("click", function (e) {
    var b = e.target.closest(".svc__chip"); if (!b) return;
    var cat = b.getAttribute("data-cat");
    Array.prototype.forEach.call(filters.children, function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
    cards.forEach(function (c, i) {
      var show = cat === "all" || c.getAttribute("data-cat") === cat;
      c.classList.toggle("is-hidden", !show);
      if (show) { c.style.animationDelay = (i % 6) * 40 + "ms"; c.classList.remove("is-pop"); void c.offsetWidth; c.classList.add("is-pop"); }
    });
  });
  grid.addEventListener("click", function (e) {
    var a = e.target.closest(".tool__dl"); if (!a) return;
    a.classList.add("is-going");
    setTimeout(function () { a.classList.remove("is-going"); }, 1800);
    if (window.SITE_UI) window.SITE_UI.toast("Загрузка началась — файл с официального сервера", "ok");
  });
})();
