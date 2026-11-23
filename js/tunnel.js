/* =====================================================================
   Перспективный тоннель — по мотивам «Perspective Tunnel Hero»
   (21st.dev, @daiwiikharihar). Карточки стоят по спирали золотого угла
   на разной глубине и при прокрутке летят навстречу камере.
   Данные: SITE.reviews (только реальные отзывы). Пока их нет —
   в тоннеле летят карточки с гарантиями.
   ===================================================================== */
(function () {
  "use strict";
  var sec = document.getElementById("reviews");
  if (!sec) return;
  var S = window.SITE || {};
  var stage = document.getElementById("tunnelStage");
  var center = sec.querySelector(".tunnel__center");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  var reviews = (S.reviews || []).filter(function (r) { return r && r.name && r.text; });
  var PROMISES = [
    ["₽", "Цена не растёт", "Фиксирую стоимость до старта. Никаких «ой, тут ещё доплатить»."],
    ["3д", "Живая ссылка за 3 дня", "Первая версия — уже на телефоне у тебя, а не в обещаниях."],
    ["½", "50 / 50", "Половина вперёд, половина — только после запуска сайта."],
    ["✎", "Правки без нервов", "Правим, пока не скажешь «огонь». Круги правок — в каждом пакете."],
    ["📱", "Сначала телефон", "Мобильную версию делаю первой: оттуда приходит большинство клиентов."],
    ["⚡", "Быстрый сайт", "Без тяжёлых конструкторов. Открывается мгновенно даже на 3G."],
    ["</>", "Код — твой", "Отдаю все файлы. Сайт принадлежит тебе, а не мне."],
    ["☎", "На связи", "Отвечаю в течение часа. Мелкие правки — первый месяц бесплатно."],
    ["Я", "Яндекс и карты", "Добавлю сайт в Вебмастер и привяжу к карточке на Яндекс Картах."]
  ];

  // ---- шапка блока зависит от того, есть ли реальные отзывы
  if (reviews.length) {
    document.getElementById("tunnelKicker").textContent = "05 / отзывы";
    document.getElementById("tunnelTitle").innerHTML = 'Что говорят <span class="shine">клиенты</span>';
    document.getElementById("tunnelSub").textContent = "Реальные отзывы людей, которым я сделал сайт.";
  }

  function initials(name) {
    return String(name).trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join("").toUpperCase();
  }
  function reviewCard(r) {
    var stars = Math.max(0, Math.min(5, r.stars == null ? 5 : +r.stars));
    var ava = r.photo
      ? '<img class="tcard__ava" src="' + esc(r.photo) + '" alt="" loading="lazy">'
      : '<span class="tcard__ava tcard__ava--txt">' + esc(initials(r.name)) + "</span>";
    return '<div class="tcard__head">' + ava + '<div><b>' + esc(r.name) + "</b><small>" + esc(r.role || "") + "</small></div></div>" +
      '<div class="tcard__stars" aria-label="Оценка ' + stars + ' из 5">' + "★★★★★".slice(0, stars) + '<span>' + "★★★★★".slice(stars) + "</span></div>" +
      '<p class="tcard__text">«' + esc(r.text) + "»</p>";
  }
  function promiseCard(p, i) {
    return '<span class="tcard__ico">' + esc(p[0]) + '</span><b class="tcard__title">' + esc(p[1]) + "</b>" +
      '<p class="tcard__text">' + esc(p[2]) + '</p><span class="tcard__no">0' + (i + 1) + "</span>";
  }

  var items = reviews.length ? reviews : PROMISES;
  var cards = items.map(function (it, i) {
    var el = document.createElement("article");
    el.className = "tcard" + (reviews.length ? " tcard--review" : " tcard--promise");
    el.innerHTML = reviews.length ? reviewCard(it) : promiseCard(it, i);
    stage.appendChild(el);
    return el;
  });
  var n = cards.length;

  if (reduce) { sec.classList.add("tunnel--static"); return; }

  // ---- геометрия тоннеля
  var GAP = 560, START = 500, NEAR = 180, PASS = 480, FOG = 2000, TITLE_Z = -700;
  // заголовок живёт внутри сцены: дальние карточки уходят ЗА него, ближние — перед ним
  stage.appendChild(center);
  center.style.zIndex = Math.round(TITLE_Z + 10000);
  var GOLDEN = Math.PI * (3 - Math.sqrt(5));                            // золотой угол ≈ 137.5°
  var travel = START + (n - 1) * GAP + PASS;
  var base = cards.map(function (_, i) {
    return { a: i * GOLDEN + 0.6, k: 0.78 + 0.34 * ((i * 0.618034) % 1), z: -START - i * GAP, rot: ((i * 7) % 9 - 4) * 1.2 };
  });
  sec.style.setProperty("--tunnel-h", (110 + n * 34) + "vh");

  var RX = 300, RY = 250, ticking = false;
  function measure() {
    var w = window.innerWidth, h = window.innerHeight;
    if (w < 700) { RX = w * 0.4; RY = h * 0.34; }                         // телефон: экран высокий — разносим по вертикали
    else { RX = Math.min(w * 0.34, h * 0.62); RY = RX * 0.7; }
    update();
  }
  function update() {
    ticking = false;
    var rect = sec.getBoundingClientRect(), span = rect.height - window.innerHeight;
    var p = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;
    var cam = p * travel;
    for (var i = 0; i < n; i++) {
      var b = base[i], z = b.z + cam, el = cards[i];
      var op = 1;
      if (z > NEAR) op = Math.max(0, 1 - (z - NEAR) / (PASS - NEAR));        // пролетела мимо камеры
      else if (z < -FOG) op = Math.max(0, 1 - (-z - FOG) / 1200);            // ещё в тумане
      if (z < TITLE_Z) op *= 0.55;                                         // за заголовком — приглушаем
      if (op <= 0.001) { el.style.visibility = "hidden"; continue; }
      el.style.visibility = "visible";
      var x = Math.cos(b.a) * RX * b.k, y = Math.sin(b.a) * RY * b.k;
      el.style.opacity = op.toFixed(3);
      el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px," + z.toFixed(1) + "px) rotate(" + b.rot + "deg)";
      el.style.zIndex = Math.round(z + 10000);
    }
    // заголовок в центре гаснет к концу полёта
    var fade = p > 0.82 ? Math.max(0, 1 - (p - 0.82) / 0.16) : 1;
    center.style.opacity = fade.toFixed(3);
    center.style.transform = "translate(-50%,-50%) scale(" + (1 + p * 0.08).toFixed(3) + ")";
    sec.style.setProperty("--tp", p.toFixed(3));
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", measure);
  measure();
})();
