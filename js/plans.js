/* =====================================================================
   Выбор пакета — всплывающее окно поверх страницы, как «Upgrade your
   plan» в ChatGPT: переключатель «Сайты / Программы», три карточки,
   популярный пакет выделен. Открывается любым [data-open-plans].
   ===================================================================== */
(function () {
  "use strict";
  var UI = function () { return window.SITE_UI || {}; };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  var DATA = {
    sites: {
      label: "Сайты",
      note: "Домен и хостинг — отдельно, по факту (обычно 1–3 тыс. ₽ в год). Предоплата 50%, остаток — после запуска.",
      plans: [
        { id: "Старт", price: "5 000", unit: "₽ разово", for: "Мастер, репетитор, частник", cta: "Выбрать «Старт»",
          items: ["1 страница под телефон и ПК", "Услуги и прайс", "Кнопки WhatsApp / Telegram / звонок", "Карта и контакты", "1 круг правок", "Запуск за 3–5 дней"] },
        { id: "Бизнес", price: "7 500", unit: "₽ разово", for: "Автосервис, салон, ремонт", cta: "Выбрать «Бизнес»", hot: true,
          items: ["Всё из «Старт»", "Галерея работ и отзывы", "Форма заявки в мессенджер", "Анимации и вау-первый экран", "Яндекс Карты и поиск", "2 круга правок"] },
        { id: "Максимум", price: "10 000", unit: "₽ разово", for: "Кафе, кондитер, флорист", cta: "Выбрать «Максимум»",
          items: ["Всё из «Бизнес»", "Каталог / меню до 30 позиций", "Заказ товара в мессенджер", "Квиз или калькулятор цены", "Месяц поддержки бесплатно"] }
      ]
    },
    apps: {
      label: "Программы",
      note: "Цену программы называю после короткого разговора: сначала смотрю твои файлы и задачу, потом фиксирую сумму и срок.",
      plans: [
        { id: "Скрипт", price: "по задаче", unit: "", for: "Одна рутина — одна кнопка", cta: "Обсудить скрипт",
          items: ["Excel / Word / PDF — обработка", "Раскладка и переименование файлов", "Отчёт в один клик", "Запуск двойным щелчком", "Работаю на копиях твоих данных"] },
        { id: "Программа", price: "по задаче", unit: "", for: "Windows-программа с окном", cta: "Обсудить программу", hot: true,
          items: ["Красивый интерфейс в стиле этого сайта", "Один EXE — без установки Python", "Проверка на твоих реальных файлах", "Журнал и понятные ошибки", "Сборка и инструкция в комплекте"] },
        { id: "Система", price: "по задаче", unit: "", for: "Учёт и база под ключ", cta: "Обсудить систему",
          items: ["База данных и резервные копии", "Несколько пользователей", "Отчёты и выгрузки", "Перенос старых данных", "Обучение и сопровождение"] }
      ]
    }
  };

  var CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var root, panel, grid, noteEl, tabs, lastFocus = null, tab = "sites";

  function build() {
    root = document.createElement("div");
    root.className = "pm";
    root.setAttribute("hidden", "");
    root.innerHTML =
      '<div class="pm__backdrop" data-close></div>' +
      '<div class="pm__panel" role="dialog" aria-modal="true" aria-labelledby="pmTitle">' +
        '<button class="pm__close" type="button" data-close aria-label="Закрыть">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
        '<div class="pm__head">' +
          '<h2 id="pmTitle">Выбери свой пакет</h2>' +
          '<div class="pm__tabs" role="tablist">' +
            '<button type="button" role="tab" data-tab="sites">Сайты</button>' +
            '<button type="button" role="tab" data-tab="apps">Программы</button>' +
          "</div>" +
        "</div>" +
        '<div class="pm__grid" id="pmGrid"></div>' +
        '<div class="pm__foot"><p id="pmNote"></p><button type="button" class="pm__link" data-calc>Не знаешь, что выбрать? Посчитай в калькуляторе →</button></div>' +
      "</div>";
    document.body.appendChild(root);
    panel = root.querySelector(".pm__panel");
    grid = root.querySelector("#pmGrid");
    noteEl = root.querySelector("#pmNote");
    tabs = root.querySelectorAll("[data-tab]");

    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) { close(); return; }
      var t = e.target.closest("[data-tab]");
      if (t) { render(t.getAttribute("data-tab")); return; }
      if (e.target.closest("[data-calc]")) {
        close();
        setTimeout(function () { document.getElementById("calc").scrollIntoView({ behavior: "smooth" }); }, 200);
        return;
      }
      var pick = e.target.closest("[data-pick]");
      if (pick) choose(pick.getAttribute("data-pick"));
    });
    root.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      var f = panel.querySelectorAll("button:not([disabled]), a[href]");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  function render(which, focusId) {
    tab = which;
    var d = DATA[which];
    tabs.forEach(function (b) {
      var on = b.getAttribute("data-tab") === which;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", String(on));
    });
    grid.innerHTML = d.plans.map(function (p) {
      var num = /\d/.test(p.price);
      return '<article class="pm__card' + (p.hot ? " pm__card--hot" : "") + (focusId === p.id ? " pm__card--focus" : "") + '">' +
        (p.hot ? '<span class="pm__badge">Популярный</span>' : "") +
        '<h3>' + esc(p.id) + "</h3>" +
        '<div class="pm__price' + (num ? "" : " pm__price--text") + '"><b>' + esc(p.price) + "</b>" + (p.unit ? "<span>" + esc(p.unit) + "</span>" : "") + "</div>" +
        '<p class="pm__for">' + esc(p.for) + "</p>" +
        '<button type="button" class="btn ' + (p.hot ? "btn--gold" : "btn--ghost") + ' btn--block" data-pick="' + esc(p.id) + '">' + esc(p.cta) + "</button>" +
        '<ul>' + p.items.map(function (it) { return "<li>" + CHECK + "<span>" + esc(it) + "</span></li>"; }).join("") + "</ul>" +
      "</article>";
    }).join("");
    noteEl.textContent = d.note;
  }

  function choose(id) {
    var pre = tab === "sites" ? "Пакет «" + id + "»" : "Программа: «" + id + "»";
    var ui = UI();
    if (ui.setPlan) ui.setPlan(pre);
    if (ui.toast) ui.toast(pre + " — добавлено в заявку 👇", "ok");
    close(true);
    if (ui.goContact) ui.goContact();
  }

  function open(which, focusId) {
    if (!root) build();
    lastFocus = document.activeElement;
    render(which || "sites", focusId);
    root.removeAttribute("hidden");
    document.documentElement.classList.add("pm-lock");
    requestAnimationFrame(function () {
      root.classList.add("pm--open");
      var target = panel.querySelector(focusId ? ".pm__card--focus [data-pick]" : ".pm__card--hot [data-pick]") || panel.querySelector("[data-pick]");
      if (target) target.focus({ preventScroll: true });
    });
  }

  function close(keepFocus) {
    if (!root || root.hasAttribute("hidden")) return;
    root.classList.remove("pm--open");
    document.documentElement.classList.remove("pm-lock");
    setTimeout(function () { root.setAttribute("hidden", ""); }, 260);
    if (!keepFocus && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-open-plans]");
    if (!t) return;
    e.preventDefault();
    open(t.getAttribute("data-open-plans") || "sites", t.getAttribute("data-focus"));
  });

  window.SITE_PLANS = { open: open, close: close };
})();
