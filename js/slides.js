/* =====================================================================
   Слайд-шоу гарантий / отзывов: центральная карточка впереди, остальные
   уходят в глубину слева и справа. Карусель медленно и плавно крутится сама
   (у центра притормаживает), тянется пальцем/мышью, стрелки, точки и клавиши ← →.
   Данные: SITE.reviews (только реальные отзывы). Пока их нет — гарантии.
   ===================================================================== */
(function () {
  "use strict";
  var sec = document.getElementById("reviews");
  var flow = document.getElementById("flow"), stage = document.getElementById("flowStage"), dotsBox = document.getElementById("flowDots");
  if (!sec || !flow || !stage) return;
  var S = window.SITE || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  var reviews = (S.reviews || []).filter(function (r) { return r && r.name && r.text; });
  var PROMISES = [
    ["₽", "Цена не растёт", "Фиксирую стоимость до старта. Никаких «ой, тут ещё доплатить»."],
    ["3д", "Живая ссылка за 3 дня", "Первая версия — уже на телефоне у тебя, а не в обещаниях."],
    ["½", "50 / 50", "Половина вперёд, половина — только после запуска."],
    ["✎", "Правки без нервов", "Правим, пока не скажешь «огонь». Круги правок — в каждом пакете."],
    ["📱", "Сначала телефон", "Мобильную версию делаю первой: оттуда приходит большинство клиентов."],
    ["⚡", "Быстрый сайт", "Без тяжёлых конструкторов. Открывается мгновенно даже на 3G."],
    ["</>", "Код — твой", "Отдаю все файлы. Сайт принадлежит тебе, а не мне."],
    ["☎", "На связи", "Отвечаю в течение часа. Мелкие правки — первый месяц бесплатно."],
    ["Я", "Яндекс и карты", "Добавлю сайт в Вебмастер и привяжу к карточке на Яндекс Картах."]
  ];
  if (reviews.length) {
    document.getElementById("flowKicker").textContent = "05 / отзывы";
    document.getElementById("flowTitle").innerHTML = 'Что говорят <span class="shine">клиенты</span>';
    document.getElementById("flowSub").textContent = "Реальные отзывы людей, которым я сделал сайт или программу.";
    flow.setAttribute("aria-label", "Отзывы");
  }
  function initials(name) { return String(name).trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join("").toUpperCase(); }
  function reviewCard(r) {
    var stars = Math.max(0, Math.min(5, r.stars == null ? 5 : +r.stars));
    var ava = r.photo ? '<img class="fcard__ava" src="' + esc(r.photo) + '" alt="" loading="lazy">' : '<span class="fcard__ava fcard__ava--txt">' + esc(initials(r.name)) + "</span>";
    return '<div class="fcard__head">' + ava + '<div><b>' + esc(r.name) + "</b><small>" + esc(r.role || "") + "</small></div></div>" +
      '<div class="fcard__stars" aria-label="Оценка ' + stars + ' из 5">' + "★★★★★".slice(0, stars) + "<span>" + "★★★★★".slice(stars) + "</span></div>" +
      '<p class="fcard__text">«' + esc(r.text) + "»</p>";
  }
  function promiseCard(p, i) {
    return '<span class="fcard__ico">' + esc(p[0]) + '</span><b class="fcard__title">' + esc(p[1]) + "</b>" +
      '<p class="fcard__text">' + esc(p[2]) + '</p><span class="fcard__no">' + (i + 1 < 10 ? "0" : "") + (i + 1) + " / " + (items.length < 10 ? "0" : "") + items.length + "</span>";
  }
  var items = reviews.length ? reviews : PROMISES, n = items.length;
  var cards = items.map(function (it, i) {
    var el = document.createElement("article");
    el.className = "fcard " + (reviews.length ? "fcard--review" : "fcard--promise fcard--v" + (i % 3));
    el.innerHTML = (reviews.length ? reviewCard(it) : promiseCard(it, i)) + '<i class="fcard__shade" aria-hidden="true"></i>';
    el.setAttribute("aria-roledescription", "слайд");
    stage.appendChild(el);
    return el;
  });
  var dots = items.map(function (_, i) {
    var d = document.createElement("button");
    d.type = "button"; d.className = "flow__dot"; d.setAttribute("role", "tab"); d.setAttribute("aria-label", "Карточка " + (i + 1));
    d.addEventListener("click", function () { go(i); });
    dotsBox.appendChild(d); return d;
  });

  // pos — дробная позиция карусели (в карточках): карусель медленно и плавно крутится сама,
  // у центра чуть притормаживает (чтобы успеть прочитать), под мышью — медленнее, при перетаскивании
  // и фокусе с клавиатуры — стоит. Стрелки, точки и клавиши плавно доводят до карточки.
  var pos = 0, drag = null, hover = false, focused = false, inView = false, tw = null, spd = 0, last = 0;
  var DRIFT = 1 / 6.5;                       // карточек в секунду (в среднем одна за ~7 с)
  function wrapK(i, p) { var k = i - p; k = ((k % n) + n) % n; if (k > n / 2) k -= n; return k; }
  function layout(p) {
    var w = stage.clientWidth, cw = cards[0].offsetWidth || 300;
    var step1 = Math.min(cw * .8, w * .27), step2 = Math.min(cw * .42, w * .12);
    cards.forEach(function (el, i) {
      var k = wrapK(i, p), a = Math.abs(k), sg = k < 0 ? -1 : 1;
      var x = sg * (Math.min(a, 1) * step1 + Math.max(0, a - 1) * step2);
      var z = -a * 190, ry = sg * Math.min(a, 1) * 40 + sg * Math.max(0, a - 1) * 6;
      var vis = a < 3.2;
      el.style.transform = "translate(-50%,-50%) translateX(" + x.toFixed(1) + "px) translateZ(" + z.toFixed(1) + "px) rotateY(" + ry.toFixed(2) + "deg)";
      el.style.zIndex = String(100 - Math.round(a * 10));
      el.style.opacity = vis ? String(Math.max(0, 1 - Math.max(0, a - 2) * .9)) : "0";
      el.style.visibility = vis ? "visible" : "hidden";
      el.style.setProperty("--shade", Math.min(.55, a * .2).toFixed(3));
      el.classList.toggle("is-active", a < .5);
      el.setAttribute("aria-hidden", a < .5 ? "false" : "true");
    });
    dots.forEach(function (d, i) { var on = i === ((Math.round(p) % n) + n) % n; d.classList.toggle("on", on); d.setAttribute("aria-selected", on ? "true" : "false"); });
  }
  function easeOut(k) { return 1 - Math.pow(1 - k, 3); }
  function go(i) {                            // плавно довести до карточки i (кратчайшим путём)
    var target = pos + wrapK(i, pos);
    if (reduce) { pos = target; layout(pos); return; }
    tw = { from: pos, to: target, t0: performance.now(), dur: 700 + 260 * Math.min(3, Math.abs(target - pos)) };
    spd = 0; kick();
  }
  function next() { go(Math.round(pos) + 1); }
  function prev() { go(Math.round(pos) - 1); }
  var raf = 0;
  function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function frame(now) {
    raf = 0;
    if (!inView || document.hidden) return;                    // вне экрана — не крутим
    var dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now;
    if (drag) { raf = requestAnimationFrame(frame); return; }  // тянут рукой — позицию ведёт перетаскивание
    if (tw) {
      var k = Math.min(1, (now - tw.t0) / tw.dur);
      pos = tw.from + (tw.to - tw.from) * easeOut(k); layout(pos);
      if (k >= 1) tw = null;
    } else if (!reduce) {
      var f = Math.abs(pos - Math.round(pos)) * 2;              // 0 — карточка по центру, 1 — между карточками
      var want = focused ? 0 : DRIFT * (hover ? .35 : 1) * (.35 + .65 * f) / .68;
      spd += (want - spd) * (1 - Math.exp(-3 * dt));            // плавный разгон и торможение
      if (spd > 1e-4) { pos += spd * dt; layout(pos); }
    }
    raf = requestAnimationFrame(frame);
  }
  flow.querySelector(".flow__nav--next").addEventListener("click", next);
  flow.querySelector(".flow__nav--prev").addEventListener("click", prev);
  flow.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
  });
  flow.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") hover = true; });
  flow.addEventListener("pointerleave", function () { hover = false; });
  flow.addEventListener("focusin", function (e) { focused = !!(e.target && e.target.matches && e.target.matches(":focus-visible")); });
  flow.addEventListener("focusout", function () { focused = false; });

  // перетаскивание
  stage.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    tw = null;
    drag = { x: e.clientX, y: e.clientY, p0: pos, moved: false, id: e.pointerId, card: e.target.closest(".fcard") };
  });
  window.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { drag.moved = true; try { stage.setPointerCapture(drag.id); } catch (er) {} }
    if (drag.moved) { pos = drag.p0 - dx / Math.max(120, stage.getBoundingClientRect().width * .28); layout(pos); }
  }, { passive: true });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var d = drag; drag = null;
    if (d.moved) { go(Math.round(pos)); return; }
    if (d.card) { var i = cards.indexOf(d.card); if (i >= 0 && Math.abs(wrapK(i, pos)) > .5) go(i); }
  }
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  // позиция меняется каждый кадр из JS — CSS-переход карточкам не нужен (иначе карусель «плывёт» с опозданием)
  flow.classList.add("is-instant");
  new IntersectionObserver(function (es) { inView = es[0].isIntersecting; if (inView) kick(); }, { threshold: .15 }).observe(flow);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) kick(); });
  window.addEventListener("resize", function () { layout(pos); });
  layout(0);
})();
