(function () {
  "use strict";
  var S = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* ---------- данные из config ---------- */
  $$("[data-site]").forEach(function (el) { var k = el.getAttribute("data-site"); if (S[k]) el.textContent = S[k]; });
  if (S.name) document.title = S.name + " — сайты под ключ";
  $("#year").textContent = new Date().getFullYear();

  /* ---------- заставка ---------- */
  var bootLines = [
    ['<span class="m">$</span> npm run create-website', 260],
    ['<span class="m">›</span> загружаю идеи ..................... <span class="ok">OK</span>', 220],
    ['<span class="m">›</span> подключаю дизайн ................... <span class="ok">OK</span>', 220],
    ['<span class="m">›</span> оптимизирую под телефон ............ <span class="ok">OK</span>', 220],
    ['<span class="m">›</span> завариваю кофе разработчику ........ <span class="ok">OK</span>', 260],
    ['<span class="m">›</span> скорость: <span class="g">98/100</span> · ошибок: <span class="ok">0</span>', 260],
    ['', 120],
    ['<span class="g">✔ Готово. Добро пожаловать.</span>', 420]
  ];
  var boot = $("#boot"), bootLog = $("#bootLog"), bootBar = $("#bootBar"), bootDone = false;
  function finishBoot() {
    if (bootDone) return; bootDone = true;
    boot.classList.add("done");
    document.body.classList.remove("is-loading");
    startPage();
  }
  $("#bootSkip").addEventListener("click", finishBoot);
  var seen = false;
  try { seen = sessionStorage.getItem("booted") === "1"; sessionStorage.setItem("booted", "1"); } catch (e) {}
  if (reduce || seen) {
    finishBoot();
  } else {
    var bi = 0;
    (function nextLine() {
      if (bootDone) return;
      if (bi >= bootLines.length) { setTimeout(finishBoot, 250); return; }
      bootLog.innerHTML += bootLines[bi][0] + "\n";
      bootBar.style.width = Math.round(((bi + 1) / bootLines.length) * 100) + "%";
      setTimeout(nextLine, bootLines[bi++][1]);
    })();
  }

  /* ---------- CMD-тикер с цитатами ---------- */
  var track = $("#tickerTrack"), q = S.quotes || [];
  var once = q.map(function (x) {
    return '<span class="ticker__item"><span class="cmd">echo</span> <q>' + esc(x[0]) + '</q> <em>— ' + esc(x[1]) + "</em></span>";
  }).join("");
  track.innerHTML = once + once; // дубль для бесшовной прокрутки

  /* ---------- toast + буфер обмена ---------- */
  var toastEl = $("#toast"), toastT;
  function toast(msg, kind) {
    toastEl.textContent = msg; toastEl.className = "toast show " + (kind || "");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.className = "toast"; }, 3200);
  }
  function legacyCopy(text) {
    return new Promise(function (ok, fail) {
      var t = document.createElement("textarea"); t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy") ? ok() : fail(); } catch (e) { fail(e); } finally { t.remove(); }
    });
  }
  function copy(text) {
    // современный буфер обмена, а если браузер не разрешил — старый способ
    if (navigator.clipboard && window.isSecureContext)
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    return legacyCopy(text);
  }
  // выбранный пакет / расчёт / файл из папки — уходит в заявку (блок «Связь» показывает его чипом)
  function setPlan(text) {
    var f = $("#planField"); if (f) f.value = text || "";
    document.dispatchEvent(new CustomEvent("plan:change", { detail: text || "" }));
  }
  function goContact() {
    setTimeout(function () {
      $("#contact").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      setTimeout(function () { var i = $("#briefText"); if (i) i.focus({ preventScroll: true }); }, reduce ? 0 : 700);
    }, 250);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-plan]");
    if (!a) return;
    setPlan("Выбрано: " + a.getAttribute("data-plan"));
    toast("«" + a.getAttribute("data-plan") + "» — добавлено в заявку 👇", "ok");
  });

  // пришли со страницы сервисного центра: index.html?plan=...#contact → тема сразу в заявке
  try {
    var qPlan = new URLSearchParams(location.search).get("plan");
    if (qPlan) {
      qPlan = qPlan.slice(0, 80);
      // ждём, пока подключатся все скрипты (contact.js слушает plan:change)
      document.addEventListener("DOMContentLoaded", function () { setPlan("Выбрано: " + qPlan); });
      history.replaceState(null, "", location.pathname + location.hash);
    }
  } catch (e) {}

  /* калькулятор переехал в js/builder.js (конструктор проекта) */

  /* ---------- меню ---------- */
  var nav = $("#nav");
  $("#burger").addEventListener("click", function () { nav.classList.toggle("open"); });
  $$("#navLinks a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); }); });

  /* ---------- всё, что стартует после заставки ---------- */
  function startPage() {
    // появление блоков
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal, .footer__big").forEach(function (el) {
      var sib = el.parentNode ? $$(":scope > .reveal", el.parentNode) : [];
      var i = sib.indexOf(el); if (i > 0) el.style.setProperty("--d", Math.min(i, 6) * 0.08 + "s");
      io.observe(el);
    });

    // счётчики
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return; cio.unobserve(en.target);
        var el = en.target, to = +el.getAttribute("data-count"), pre = el.getAttribute("data-prefix") || "", suf = el.getAttribute("data-suffix") || "", t0 = performance.now();
        (function step(t) {
          var k = Math.min(1, (t - t0) / 1600), e = 1 - Math.pow(1 - k, 4);
          el.textContent = pre + Math.round(to * e).toLocaleString("ru-RU").replace(/ /g, " ") + suf;
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: .6 });
    $$("[data-count]").forEach(function (el) { cio.observe(el); });

    typer();
    codeTyper();
  }

  /* ---------- печать ниш в заголовке ---------- */
  function typer() {
    var el = $("#typer"), words = ["для мастеров маникюра", "для автосервисов", "для ремонтников", "для репетиторов", "для фотографов", "для кондитеров", "для тебя"];
    if (reduce) return;
    var w = 0, i = words[0].length, del = true;
    setTimeout(function tick() {
      if (del) {
        i--;
        if (i <= 4) { del = false; w = (w + 1) % words.length; }
      } else {
        i++;
        if (i >= words[w].length) { el.textContent = words[w]; del = true; return setTimeout(tick, 2200); }
      }
      el.textContent = words[w].slice(0, i);
      setTimeout(tick, del ? 32 : 65);
    }, 2200);
  }

  /* ---------- печать кода в окне ---------- */
  function codeTyper() {
    var el = $("#codeTyper");
    var src = [
      ["c", "<!-- твой будущий сайт -->"], ["", "\n"],
      ["t", "<section"], ["a", " class"], ["", "="], ["s", '"hero"'], ["t", ">"], ["", "\n  "],
      ["t", "<h1>"], ["", "Маникюр, который замечают"], ["t", "</h1>"], ["", "\n  "],
      ["t", "<p>"], ["", "Запись онлайн за 30 секунд"], ["t", "</p>"], ["", "\n  "],
      ["t", "<a"], ["a", " href"], ["", "="], ["s", '"#zapis"'], ["t", ">"], ["", "Записаться →"], ["t", "</a>"], ["", "\n"],
      ["t", "</section>"], ["", "\n\n"],
      ["c", "// заявки сразу в телефон"], ["", "\n"],
      ["a", "form"], ["", ".onsubmit = () => "], ["a", "sendTo"], ["", "("], ["s", "'telegram'"], ["", ");\n\n"],
      ["c", "// статус"], ["", "\n"],
      ["a", "deploy"], ["", "("], ["s", "'сайт.рф'"], ["", ") "], ["s", "// ✔ онлайн"]
    ];
    var html = "", si = 0, ci = 0;
    if (reduce) {
      el.innerHTML = src.map(function (p) { return p[0] ? '<span class="' + p[0] + '">' + esc(p[1]) + "</span>" : esc(p[1]); }).join("");
      return;
    }
    (function tick() {
      if (si >= src.length) {
        el.innerHTML = html + '<span class="cur"></span>';
        return setTimeout(function () { html = ""; si = ci = 0; tick(); }, 4500);
      }
      var p = src[si], part = p[1].slice(0, ++ci);
      var piece = p[0] ? '<span class="' + p[0] + '">' + esc(part) + "</span>" : esc(part);
      el.innerHTML = html + piece + '<span class="cur"></span>';
      if (ci >= p[1].length) { html += piece; si++; ci = 0; }
      setTimeout(tick, p[1] === "\n" || p[1].charAt(0) === "\n" ? 120 : 22 + Math.random() * 30);
    })();
  }

  /* ---------- скролл: шапка, прогресс, активный пункт ---------- */
  var prog = $("#scrollProgress"), links = $$("#navLinks a"), secs = links.map(function (a) { return $(a.getAttribute("href")); });
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle("scrolled", y > 30);
    prog.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
    var act = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < innerHeight * .4) act = i; });
    links.forEach(function (a, i) { a.classList.toggle("active", i === act); });
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- курсор, наклон, магнитные кнопки (только мышь) ---------- */
  if (fine && !reduce) {
    var glow = $("#cursorGlow"), gx = 0, gy = 0, tx = 0, ty = 0;
    window.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; glow.style.opacity = 1; }, { passive: true });
    (function loop() { gx += (tx - gx) * .12; gy += (ty - gy) * .12; glow.style.transform = "translate(" + gx + "px," + gy + "px)"; requestAnimationFrame(loop); })();

    $$("[data-tilt]").forEach(function (el) {
      var max = +el.getAttribute("data-tilt") || 8;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty("--rx", (-y * max).toFixed(2) + "deg");
        el.style.setProperty("--ry", (x * max).toFixed(2) + "deg");
        if (!el.classList.contains("work")) el.style.transform = "rotateX(" + (-y * max) + "deg) rotateY(" + (x * max) + "deg)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg");
        if (!el.classList.contains("work")) el.style.transform = "";
      });
    });

    document.addEventListener("pointermove", function (e) {
      var b = e.target.closest && e.target.closest(".magnetic");
      $$(".magnetic").forEach(function (m) { if (m !== b) { m.style.setProperty("--mx", "0px"); m.style.setProperty("--my", "0px"); } });
      if (!b) return;
      var r = b.getBoundingClientRect();
      b.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + "px");
      b.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * .25).toFixed(1) + "px");
    }, { passive: true });
  }

  // общий API для остальных модулей (папки, пакеты, связь)
  window.SITE_UI = {
    toast: toast, copy: copy, setPlan: setPlan, goContact: goContact, esc: esc,
    pick: function (what) { setPlan("Интересует: " + what); toast("«" + what + "» — добавлено в заявку 👇", "ok"); goContact(); }
  };
})();
