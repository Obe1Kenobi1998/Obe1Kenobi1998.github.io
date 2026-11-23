/* =====================================================================
   Блок «Связь» — в духе «Modern and Stunning Hero» (21st.dev, @floodesign):
   одна строка ввода с печатающейся подсказкой, чип выбранного пакета,
   выбор канала отправки (Telegram / WhatsApp / почта / копировать).
   ===================================================================== */
(function () {
  "use strict";
  var S = window.SITE || {};
  var UI = function () { return window.SITE_UI || {}; };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var form = $("#briefBar");
  if (!form) return;
  var input = $("#briefText"), ph = $("#briefPh"), chip = $("#planChip"), planField = $("#planField");

  var ICON = {
    tg: '<svg viewBox="0 0 24 24" fill="#229ed9"><path d="M21.9 4.3 18.7 19.5c-.2 1-.9 1.3-1.7.8l-4.8-3.6-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2l-11 6.9-4.7-1.5c-1-.3-1-1 .2-1.5L20.6 3c.9-.3 1.6.2 1.3 1.3z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="#25d366"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1a17 17 0 0 1-1.7-.6c-3-1.3-5-4.3-5.1-4.5-.2-.2-1.2-1.6-1.2-3.1s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.3 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.6 2.1 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.1.5.2.5.3.1.1.1.7-.1 1.4z"/></svg>',
    ph: '<svg viewBox="0 0 24 24" fill="none" stroke="#f0cd73" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    em: '<svg viewBox="0 0 24 24" fill="none" stroke="#f0cd73" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 6 10-6"/></svg>',
    vk: '<svg viewBox="0 0 24 24" fill="#5aa9e6"><path d="M12.8 17.5C6.6 17.5 3 13.2 2.9 6h3.1c.1 5.3 2.4 7.5 4.3 8V6h2.9v4.5c1.8-.2 3.7-2.3 4.4-4.5h2.9a8.6 8.6 0 0 1-4 5.6 9 9 0 0 1 4.6 5.9h-3.2a5.6 5.6 0 0 0-4.7-4.1v4.1z"/></svg>',
    cp: '<svg viewBox="0 0 24 24" fill="none" stroke="#f0cd73" stroke-width="2"><rect x="8" y="8" width="13" height="13" rx="3"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>'
  };

  // ---- прямые контакты под строкой ввода
  var ch = [];
  if (S.telegram) ch.push('<a class="channel" target="_blank" rel="noopener" href="https://t.me/' + encodeURIComponent(S.telegram) + '">' + ICON.tg + "@" + esc(S.telegram) + "</a>");
  if (S.whatsapp) ch.push('<a class="channel" target="_blank" rel="noopener" href="https://wa.me/' + S.whatsapp.replace(/\D/g, "") + '">' + ICON.wa + "WhatsApp</a>");
  if (S.phone) ch.push('<a class="channel" href="tel:' + S.phone.replace(/[^\d+]/g, "") + '">' + ICON.ph + esc(S.phone) + "</a>");
  if (S.email) ch.push('<a class="channel" href="mailto:' + esc(S.email) + '">' + ICON.em + esc(S.email) + "</a>");
  if (S.vk) ch.push('<a class="channel" target="_blank" rel="noopener" href="' + esc(S.vk) + '">' + ICON.vk + "ВКонтакте</a>");
  $("#channels").innerHTML = ch.join("");

  // ---- печатающаяся подсказка в строке ввода
  var PHRASES = [
    ["Хочу сайт для ", "автосервиса"],
    ["Нужен лендинг для ", "кондитерской"],
    ["Сайт-визитка для ", "мастера маникюра"],
    ["Программа, которая сама ", "заполняет Excel"],
    ["Каталог цветов с заказом ", "в WhatsApp"],
    ["Страница для ", "репетитора по английскому"]
  ];
  function showPh() { ph.classList.toggle("hide", !!input.value || document.activeElement === input); }
  input.addEventListener("input", showPh);
  input.addEventListener("focus", showPh);
  input.addEventListener("blur", showPh);
  ph.addEventListener("click", function () { input.focus(); });
  if (reduce) {
    ph.innerHTML = esc(PHRASES[0][0]) + "<b>" + esc(PHRASES[0][1]) + "</b>";
  } else {
    var pi = 0, ci = 0, del = false;
    (function tick() {
      var p = PHRASES[pi], full = p[0] + p[1];
      ci += del ? -1 : 1;
      var shown = full.slice(0, ci), a = shown.slice(0, p[0].length), b = shown.slice(p[0].length);
      ph.innerHTML = esc(a) + (b ? "<b>" + esc(b) + "</b>" : "") + '<i class="cta__caret"></i>';
      if (!del && ci >= full.length) { del = true; return setTimeout(tick, 1800); }
      if (del && ci <= 0) { del = false; pi = (pi + 1) % PHRASES.length; return setTimeout(tick, 350); }
      setTimeout(tick, del ? 22 : 55 + Math.random() * 40);
    })();
  }

  // ---- чип выбранного пакета / расчёта
  function syncChip(text) {
    if (text) { chip.querySelector("span").textContent = text; chip.hidden = false; }
    else chip.hidden = true;
  }
  document.addEventListener("plan:change", function (e) { syncChip(e.detail); });
  chip.querySelector("button").addEventListener("click", function () {
    planField.value = ""; syncChip(""); input.focus();
  });

  // ---- окно «куда отправить»
  var sheet = null;
  function buildMsg() {
    return "Здравствуйте! " + input.value.trim() + (planField.value ? "\n" + planField.value : "");
  }
  function send(via, msg) {
    var ui = UI();
    if (via === "wa") {
      window.open("https://wa.me/" + S.whatsapp.replace(/\D/g, "") + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
      ui.toast && ui.toast("Открываю WhatsApp…", "ok");
    } else if (via === "mail") {
      location.href = "mailto:" + S.email + "?subject=" + encodeURIComponent("Заявка на сайт") + "&body=" + encodeURIComponent(msg);
    } else if (via === "tg") {
      // Telegram не подставляет текст в личный чат — копируем и открываем чат
      ui.copy && ui.copy(msg).then(function () { ui.toast("Текст скопирован — вставь его в чат Telegram", "ok"); }, function () {});
      window.open("https://t.me/" + encodeURIComponent(S.telegram), "_blank", "noopener");
    } else {
      ui.copy && ui.copy(msg).then(function () { ui.toast("Заявка скопирована в буфер ✔", "ok"); closeSheet(); },
        function () {
          // буфер недоступен — оставляем окно открытым и выделяем текст, чтобы скопировать руками
          ui.toast("Браузер не дал скопировать — текст выделен, нажми Ctrl+C", "err");
          var pre = sheet.querySelector(".sheet__msg"), r = document.createRange();
          r.selectNodeContents(pre); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
        });
      return;
    }
    closeSheet();
  }
  function openSheet(msg) {
    var opts = [];
    if (S.telegram) opts.push(["tg", ICON.tg, "Telegram", "@" + S.telegram]);
    if (S.whatsapp) opts.push(["wa", ICON.wa, "WhatsApp", "откроется с готовым текстом"]);
    if (S.email) opts.push(["mail", ICON.em, "Почта", S.email]);
    opts.push(["copy", ICON.cp, "Скопировать текст", "вставишь куда удобно"]);
    if (!sheet) {
      sheet = document.createElement("div");
      sheet.className = "pm pm--sheet";
      sheet.innerHTML = '<div class="pm__backdrop" data-close></div><div class="pm__panel sheet" role="dialog" aria-modal="true" aria-label="Куда отправить заявку">' +
        '<button class="pm__close" type="button" data-close aria-label="Закрыть"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
        '<h3>Куда отправить?</h3><pre class="sheet__msg"></pre><div class="sheet__opts"></div></div>';
      document.body.appendChild(sheet);
      sheet.addEventListener("click", function (e) {
        if (e.target.closest("[data-close]")) return closeSheet();
        var b = e.target.closest("[data-via]");
        if (b) send(b.getAttribute("data-via"), sheet._msg);
      });
      sheet.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });
    }
    sheet._msg = msg;
    sheet.querySelector(".sheet__msg").textContent = msg;
    sheet.querySelector(".sheet__opts").innerHTML = opts.map(function (o) {
      return '<button type="button" class="sheet__opt" data-via="' + o[0] + '">' + o[1] + "<span><b>" + esc(o[2]) + "</b><small>" + esc(o[3]) + "</small></span></button>";
    }).join("");
    sheet.hidden = false;
    document.documentElement.classList.add("pm-lock");
    requestAnimationFrame(function () { sheet.classList.add("pm--open"); sheet.querySelector(".sheet__opt").focus(); });
  }
  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.classList.remove("pm--open");
    document.documentElement.classList.remove("pm-lock");
    setTimeout(function () { sheet.hidden = true; }, 260);
    input.focus({ preventScroll: true });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (input.value.trim().length < 3) {
      form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
      UI().toast && UI().toast("Напиши пару слов: что за дело и какой сайт нужен", "err");
      input.focus();
      return;
    }
    openSheet(buildMsg());
  });
})();
