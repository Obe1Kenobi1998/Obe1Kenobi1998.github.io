/* =====================================================================
   ЧАТ-ПОМОЩНИК у «Частых вопросов» (окно в духе Telegram).
   • Здоровается сам, когда блок появляется на экране, и «печатает» ответы.
   • Отвечает по базе знаний сайта: цены пакетов, программы, сроки, оплата,
     правки, телефон, Яндекс, домен, сервис ПК — и подбирает пакет по виду бизнеса.
   • Под ответом — кнопки: открыть пакеты, конструктор, оставить заявку и т.д.
   • Если в js/config.js указан SITE.assistant.endpoint (свой сервер с нейросетью),
     вопросы уходят туда, а база знаний остаётся запасным вариантом.
   ===================================================================== */
(function () {
  "use strict";
  var box = document.getElementById("faqChat");
  if (!box) return;
  var S = window.SITE || {}, A = S.assistant || {};
  var UI = function () { return window.SITE_UI || {}; };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var ai = !!A.endpoint;
  var NAME = A.name || (ai ? "ИИ-помощник" : "Помощник") + " " + (S.name || "");

  var ROBOT = '<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="tgv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b6170"/><stop offset="1" stop-color="#14171c"/></linearGradient></defs>' +
    '<rect x="7" y="8" width="18" height="16" rx="7" fill="url(#tgv)" stroke="#e9c46a" stroke-width="1.2"/><rect x="10" y="13" width="12" height="5" rx="2.5" fill="#0b0d10"/>' +
    '<rect x="12" y="14.6" width="3" height="1.8" rx=".9" fill="#f0cd73"/><rect x="17" y="14.6" width="3" height="1.8" rx=".9" fill="#f0cd73"/>' +
    '<path d="M16 8V5" stroke="#e9c46a" stroke-width="1.2" stroke-linecap="round"/><circle cx="16" cy="4.2" r="1.4" fill="#f0cd73"/><path d="M11 9.5c1.5-1.2 3-1.6 5-1.6" stroke="rgba(255,255,255,.45)" stroke-width="1" stroke-linecap="round" fill="none"/></svg>';
  var SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 11.2 19.6 4.3c.8-.3 1.5.4 1.2 1.2l-6.9 16.2c-.3.8-1.4.8-1.7 0l-2.1-5.6a1 1 0 0 0-.6-.6l-5.6-2.1c-.8-.3-.8-1.4 0-1.7z" fill="currentColor"/></svg>';
  var TICKS = '<svg viewBox="0 0 18 11" aria-hidden="true"><path d="M1 6l3 3 6-7"/><path d="M7 9l1 0 6-7"/></svg>';

  box.innerHTML =
    '<div class="tg__head"><span class="tg__ava">' + ROBOT + '</span><div class="tg__who"><b>' + esc(NAME.trim()) + '</b><small id="tgStatus">в сети · отвечает сразу</small></div><span class="tg__menu" aria-hidden="true"><i></i><i></i><i></i></span></div>' +
    '<div class="tg__log" id="tgLog" role="log" aria-live="polite" aria-label="Переписка с помощником"><span class="tg__day">Сегодня</span></div>' +
    '<div class="tg__quick" id="tgQuick"></div>' +
    '<form class="tg__form" id="tgForm" autocomplete="off"><label class="tg__field"><input id="tgIn" maxlength="400" placeholder="Напишите сообщение…" aria-label="Сообщение помощнику"></label>' +
    '<button class="tg__send" id="tgSend" type="submit" aria-label="Отправить" disabled>' + SEND + "</button></form>" +
    '<div class="tg__note">' + (ai ? "Отвечает нейросеть. Сложное — передам мастеру." : "Отвечаю на частые вопросы сразу, сложное — передам мастеру.") + "</div>";

  var log = box.querySelector("#tgLog"), quick = box.querySelector("#tgQuick"), form = box.querySelector("#tgForm"), inp = box.querySelector("#tgIn"), send = box.querySelector("#tgSend"), status = box.querySelector("#tgStatus");
  var history = [], busy = false, started = false;
  function now() { var d = new Date(); return (d.getHours() < 10 ? "0" : "") + d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes(); }
  function scroll() { log.scrollTop = log.scrollHeight; }
  function bubble(who, html) {
    var el = document.createElement("div");
    el.className = "tg__msg " + (who === "me" ? "tg__me" : "tg__bot");
    el.innerHTML = html + '<span class="tg__time">' + now() + (who === "me" ? TICKS : "") + "</span>";
    log.appendChild(el); scroll(); return el;
  }
  function keyboard(btns) {
    if (!btns || !btns.length) return;
    var kb = document.createElement("div"); kb.className = "tg__kb";
    btns.forEach(function (b) {
      var el = b.href ? document.createElement("a") : document.createElement("button");
      if (b.href) { el.href = b.href; if (/^https?:/.test(b.href)) { el.target = "_blank"; el.rel = "noopener"; } } else el.type = "button";
      el.textContent = b.t;
      if (b.plans) el.setAttribute("data-open-plans", b.plans);
      if (b.focus) el.setAttribute("data-focus", b.focus);
      if (b.go) el.addEventListener("click", function (e) { e.preventDefault(); b.go(); });
      kb.appendChild(el);
    });
    log.appendChild(kb); scroll();
  }
  function setTyping(on) {
    status.textContent = on ? "печатает…" : "в сети · отвечает сразу";
    status.classList.toggle("is-typing", on);
  }
  // бот «печатает», потом отвечает (несколько сообщений подряд — по очереди)
  function say(parts, btns, done) {
    parts = [].concat(parts);
    busy = true; send.disabled = true;
    (function next(i) {
      if (i >= parts.length) { busy = false; send.disabled = !inp.value.trim(); keyboard(btns); if (done) done(); return; }
      var t = document.createElement("div"); t.className = "tg__typing"; t.innerHTML = "<i></i><i></i><i></i>";
      log.appendChild(t); scroll(); setTyping(true);
      var plain = parts[i].replace(/<[^>]+>/g, ""), wait = reduce ? 150 : Math.min(2400, 520 + plain.length * 16);
      setTimeout(function () {
        t.remove(); setTyping(false);
        bubble("bot", parts[i]); history.push({ role: "assistant", content: plain });
        setTimeout(function () { next(i + 1); }, reduce ? 0 : 260);
      }, wait);
    })(0);
  }

  /* ---------- действия кнопок ---------- */
  function goBrief(text) { var u = UI(); if (u.setPlan) u.setPlan(text); if (u.goContact) u.goContact(); }
  function goTo(id) { var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
  var B = {
    plans: { t: "Открыть пакеты", plans: "sites" },
    apps: { t: "Пакеты программ", plans: "apps" },
    builder: { t: "Посчитать в конструкторе", go: function () { goTo("calc"); } },
    brief: function (q) { return { t: "Оставить заявку", go: function () { goBrief(q ? "Вопрос из чата: " + q : "Из чата с помощником"); } }; },
    service: { t: "Открыть сервисный центр", href: "service.html" },
    works: { t: "Посмотреть работы", go: function () { goTo("works"); } }
  };
  function tgBtn() { return S.telegram ? [{ t: "Написать в Telegram", href: "https://t.me/" + String(S.telegram).replace(/^@/, "") }] : []; }

  /* ---------- база знаний ---------- */
  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  function itemPrice(id) {
    var g = (S.builder && S.builder.groups) || [];
    for (var i = 0; i < g.length; i++) for (var j = 0; j < g[i].items.length; j++) if (g[i].items[j].id === id) return money(g[i].items[j].price);
    return null;
  }
  var p = function (id, def) { return itemPrice(id) || def; };
  var PLANS = { "Старт": "мастера, репетитора, частника", "Бизнес": "автосервиса, салона, ремонта", "Максимум": "кафе, кондитера, флориста, магазина" };
  var INTENTS = [
    { id: "hello", k: ["привет", "здравств", "добрый", "доброе", "хай", "салам", "здорово"], a: function () { return [["Здравствуйте! 😊 Чем могу помочь?", "Спросите про цены, сроки или оплату — или просто опишите задачу своими словами."], null]; } },
    { id: "thanks", k: ["спасибо", "благодар", "спс", "понял", "ясно", "отлично", "супер"], a: function () { return [["Пожалуйста! Если появятся вопросы — я здесь 🙂"], [B.brief()]]; } },
    { id: "bot", k: ["ты бот", "ты робот", "ты человек", "живой", "нейросет", "ты ии", "chatgpt", "гпт"], a: function () {
      return [[ai ? "Я ИИ-помощник сайта: отвечаю сразу, а сложные вопросы передаю мастеру — он отвечает лично." : "Я помощник сайта: отвечаю на частые вопросы сразу. Сложное передам мастеру — он отвечает лично, обычно в течение часа."], [B.brief()]]; } },
    { id: "order", k: ["нужен сайт", "нужна страниц", "хочу сайт", "сделать сайт", "заказать сайт", "сайт для", "сайт под", "лендинг для", "визитк"], a: function (t) {
      var plan = /кафе|кондитер|флорист|цвет|магазин|каталог|меню|товар|доставк/.test(t) ? "Максимум" : /салон|автосервис|сервис|ремонт|клиник|барбер|студи|шиномонтаж|стро/.test(t) ? "Бизнес" : /мастер|репетитор|маникюр|ресниц|бров|фотограф|психолог|юрист|частн|тренер/.test(t) ? "Старт" : null;
      if (!plan) return [["Отлично, сделаем! 🙌", "Расскажите, чем вы занимаетесь — подскажу подходящий пакет. Или посмотрите все три: «Старт» 5 000 ₽, «Бизнес» 7 500 ₽, «Максимум» 10 000 ₽."], [B.plans, B.brief(t)]];
      var price = { "Старт": "5 000", "Бизнес": "7 500", "Максимум": "10 000" }[plan];
      return [["Отлично, сделаем! 🙌", "Для вашей задачи лучше всего подойдёт <b>«" + plan + "» — " + price + " ₽</b>: его как раз берут для " + PLANS[plan] + ". Первая версия — уже через 3 дня."],
        [{ t: "Выбрать «" + plan + "»", go: function () { goBrief("Выбрано: «" + plan + "» (из чата)"); } }, { t: "Сравнить пакеты", plans: "sites", focus: plan }]]; } },
    { id: "price_app", k: ["программ", "скрипт", "бот", "excel", "эксел", "ексел", "таблиц", "word", "ворд", "pdf", "пдф", "exe", "автоматиз", "парсер", "отчет", "база данн", "учет", "нейросет", " ии ", "python", "питон"], a: function () {
      return [["Программы делаю под задачу: сначала смотрю ваши файлы и процесс, потом фиксирую сумму и срок — без сюрпризов.",
        "Ориентиры: Python-скрипт — от " + p("python", "3 000") + " ₽, Excel-отчёты и сверки — от " + p("excel", "2 000") + " ₽, Word по шаблону — от " + p("word", "2 000") + " ₽, Telegram-бот — от " + p("bot", "5 000") + " ₽, программа с окном (.exe) — от " + p("exe", "6 000") + " ₽."],
        [B.builder, B.apps, B.brief()]]; } },
    { id: "price", k: ["стоит", "стоимост", "цена", "цены", "ценник", "прайс", "сколько", "руб", "₽", "дорого", "бюджет", "тариф", "пакет"], a: function () {
      return [["Сайты — по фиксированной цене:",
        "<b>«Старт» — 5 000 ₽</b>: одна страница, кнопки мессенджеров, карта, запуск за 3–5 дней.<br><b>«Бизнес» — 7 500 ₽</b>: + галерея, отзывы, заявки в мессенджер, Яндекс Карты.<br><b>«Максимум» — 10 000 ₽</b>: + каталог до 30 позиций, заказ в мессенджер, месяц поддержки.",
        "Домен и хостинг — отдельно, по факту: обычно 1–3 тыс. ₽ в год."],
        [B.plans, B.builder]]; } },
    { id: "time", k: ["срок", "когда", "быстро", "дней", "день", "недел", "успеете", "за сколько", "срочн", "долго"], a: function () {
      return [["Сайт-визитка — от 3 дней, лендинг — 4–5, каталог — около недели.", "Первая версия — живая ссылка у вас на телефоне уже через 3 дня. Если очень срочно — можно быстрее (+30% к цене)."], [B.plans, B.brief()]]; } },
    { id: "pay", k: ["оплат", "платить", "предоплат", "карт", "сбп", "чек", "самозанят", "договор", "аванс", "рассрочк"], a: function () {
      return [["Сайты — 50/50: половина перед стартом, половина после запуска, когда всё работает.", "Большие программы — по этапам (30/30/40). Оплата: " + ((S.payMethods || ["СБП", "перевод на карту", "чек самозанятого"]).join(", ")).toLowerCase() + "."], [B.brief()]]; } },
    { id: "mobile", k: ["телефон", "мобил", "адаптив", "смартфон", "айфон", "андроид"], a: function () { return [["Да! Мобильную версию делаю первой — 80% клиентов придут именно с телефона. Сайт будет отлично смотреться и на ПК."], null]; } },
    { id: "content", k: ["текст", "фото", "контент", "картин", "логотип", "нет фото", "напишете"], a: function () { return [["Не проблема. Тексты напишу сам по короткой переписке, фото возьмём из ваших соцсетей или подберу качественные бесплатные."], [B.brief()]]; } },
    { id: "edits", k: ["правк", "измени", "поменя", "переделат", "поддержк", "обновл", "доработ"], a: function () { return [["Правки входят в каждый пакет. В первый месяц после запуска мелкие изменения — бесплатно, дальше — по запросу, обычно за минуты."], null]; } },
    { id: "seo", k: ["яндекс", "гугл", "google", "поиск", "найдут", "seo", "сео", "продвиж", "карты"], a: function () { return [["Добавлю сайт в Яндекс.Вебмастер и привяжу к карточке на Яндекс.Картах — лучший старт для бизнеса в своём районе."], null]; } },
    { id: "domain", k: ["домен", "хостинг", "сервер", "адрес сайта", "размещ"], a: function () { return [["Помогу купить домен и разместить сайт — по факту, без наценки: обычно 1–3 тыс. ₽ в год за всё. Сайт и файлы — ваши."], null]; } },
    { id: "pc", k: ["компьютер", "ноутбук", "тормозит", "вирус", "глючит", "починит", "сервис", "утилит", "windows", "виндовс", "флешк"], a: function () { return [["Для компьютера есть отдельная страница — сервисный центр: бесплатные проверенные утилиты для дисков, памяти, температуры и вирусов, с подбором по симптому."], [B.service]]; } },
    { id: "works", k: ["пример", "портфолио", "работы", "кейс", "что делали", "покажите"], a: function () { return [["Примеры программ и сайтов — чуть выше на странице. А первую версию вашего сайта покажу живой ссылкой уже через 3 дня."], [B.works]]; } },
    { id: "trust", k: ["гарант", "обман", "кинете", "доверя", "риск", "вернете", "возврат"], a: function () { return [["Цена фиксируется до старта и не растёт. Вторую половину платите, только когда сайт уже работает. Код и файлы — ваши."], [B.brief()]]; } },
    { id: "contact", k: ["связ", "телеграм", "telegram", "whatsapp", "ватсап", "позвон", "звонок", "мастер", "человек", "менеджер", "написать", "контакт"], a: function () {
      return [["Отвечаю лично, обычно в течение часа. Напишите задачу в строке внизу страницы — выберете удобный мессенджер."], [B.brief()].concat(tgBtn())]; } }
  ];
  function norm(t) { return " " + String(t).toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9₽ ]+/g, " ").replace(/\s+/g, " ").trim() + " "; }
  function answer(text) {
    var t = norm(text), best = null, bestScore = 0;
    INTENTS.forEach(function (it, order) {
      var s = 0; it.k.forEach(function (k) { if (t.indexOf(k) >= 0) s += k.length > 5 ? 2 : 1; });
      if (it.id === "order" && s) s += 2;                          // «нужен сайт для…» важнее общих слов про цену
      if (it.id === "price_app" && /сайт/.test(t) && !/программ|бот|скрипт|excel|exe/.test(t)) s = 0;
      if (s > bestScore) { bestScore = s; best = it; }
    });
    if (best) return best.a(t);
    return [["Понял вас 👍 Такой вопрос лучше обсудить с мастером лично — оставьте его в заявке, ответ придёт в течение часа."], [B.brief(text)].concat(tgBtn())];
  }
  // свой сервер с нейросетью (если указан в настройках): POST { messages } → { reply }
  function askServer(text) {
    return fetch(A.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-12) }) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { var rep = d && (d.reply || d.text || d.answer); if (!rep) throw new Error("empty"); return [[esc(rep).replace(/\n/g, "<br>")], [B.brief(text)]]; });
  }

  function ask(text) {
    text = String(text || "").trim(); if (!text || busy) return;
    bubble("me", "<p>" + esc(text) + "</p>"); history.push({ role: "user", content: text });
    inp.value = ""; send.disabled = true;
    var reply = function (r) { say(r[0].map(function (h) { return "<p>" + h + "</p>"; }), r[1]); };
    if (ai) askServer(text).then(reply).catch(function () { reply(answer(text)); });
    else reply(answer(text));
  }

  var QUICK = ["Сколько стоит сайт?", "За сколько дней?", "Как оплатить?", "Нужна программа", "Связаться с мастером"];
  quick.innerHTML = QUICK.map(function (q) { return '<button type="button">' + esc(q) + "</button>"; }).join("");
  quick.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) ask(b.textContent); });
  inp.addEventListener("input", function () { send.disabled = busy || !inp.value.trim(); });
  form.addEventListener("submit", function (e) { e.preventDefault(); ask(inp.value); });

  // здоровается, когда окно впервые появляется на экране
  function start() {
    if (started) return; started = true;
    say(["Здравствуйте! 👋", "Я " + (ai ? "ИИ-помощник" : "помощник") + " " + esc(S.name || "") + ". Чем могу помочь? Спросите про цены, сроки или оплату — или опишите задачу своими словами."]);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); setTimeout(start, reduce ? 0 : 500); } }, { threshold: .35 });
    io.observe(box);
  } else start();
})();
