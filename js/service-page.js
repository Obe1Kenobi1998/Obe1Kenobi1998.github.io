/* =====================================================================
   Вторая страница (service.html): шапка, бургер, прогресс прокрутки,
   появление блоков, уведомления. Подключается последним.
   ===================================================================== */
(function () {
  "use strict";
  var S = window.SITE || {};
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  $$("[data-site]").forEach(function (el) { var k = el.getAttribute("data-site"); if (S[k]) el.textContent = S[k]; });
  if (S.name) document.title = "Сервисный центр — " + S.name;
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  // с этой страницы на главную — без повторной заставки
  try { sessionStorage.setItem("booted", "1"); } catch (e) {}

  /* уведомления */
  var toastEl = $("#toast"), toastT;
  function toast(msg, kind) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.className = "toast show " + (kind || "");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.className = "toast"; }, 3200);
  }
  window.SITE_UI = window.SITE_UI || { toast: toast };

  /* меню */
  var nav = $("#nav");
  $("#burger").addEventListener("click", function () { nav.classList.toggle("open"); });
  $$("#navLinks a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); }); });

  /* появление блоков */
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal, .footer__big").forEach(function (el) {
      var sib = el.parentNode ? Array.prototype.slice.call(el.parentNode.children).filter(function (x) { return x.classList.contains("reveal"); }) : [];
      var i = sib.indexOf(el); if (i > 0) el.style.setProperty("--d", Math.min(i, 6) * 0.07 + "s");
      io.observe(el);
    });
  } else {
    $$(".reveal, .footer__big").forEach(function (el) { el.classList.add("in"); });
  }

  /* шапка и прогресс */
  var prog = $("#scrollProgress"), links = $$("#navLinks a[href^='#']"), secs = links.map(function (a) { return $(a.getAttribute("href")); });
  function onScroll() {
    var yy = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle("scrolled", yy > 30);
    if (prog) prog.style.transform = "scaleX(" + (h > 0 ? yy / h : 0) + ")";
    var act = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < innerHeight * .4) act = i; });
    links.forEach(function (a, i) { a.classList.toggle("active", i === act); });
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* мягкий свет за курсором */
  if (window.matchMedia("(pointer: fine)").matches && !reduce) {
    var glow = $("#cursorGlow"), gx = 0, gy = 0, tx = 0, ty = 0;
    if (glow) {
      window.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; glow.style.opacity = 1; }, { passive: true });
      (function loop() { gx += (tx - gx) * .12; gy += (ty - gy) * .12; glow.style.transform = "translate(" + gx + "px," + gy + "px)"; requestAnimationFrame(loop); })();
    }
  }
})();
