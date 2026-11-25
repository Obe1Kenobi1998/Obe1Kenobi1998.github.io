/* =====================================================================
   ДЕВУШКА-АНДРОИД в центре орбиты (service.html) — собственная SVG-иллюстрация.
   Здесь только «жизнь»: голова чуть следит за курсором и поворачивается к значку
   утилиты под мышью, без мыши спокойно покачивается; глаз иногда моргает;
   при наведении на значок мозг-микросхема «думает» быстрее (класс is-think).
   Импульсы по дорожкам, ядро, порт и частицы анимирует CSS. При reduced-motion — статичная картинка.
   ===================================================================== */
(function () {
  "use strict";
  var disc = document.getElementById("svcBot");
  if (!disc) return;
  var head = disc.querySelector(".svb__head");
  if (!head || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var orb = disc.closest(".orb") || disc.parentNode;
  var tx = 0, ty = 0, x = 0, y = 0, hoverIt = null, lastMove = 0, visible = true, raf = 0, last = 0;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function aimAt(cx, cy, k) {
    var r = disc.getBoundingClientRect(), hx = r.left + r.width * .62, hy = r.top + r.height * .42;   // примерно где глаз
    tx = clamp((cx - hx) / (r.width * 1.2), -1, 1) * (k || 1);
    ty = clamp((cy - hy) / (r.height * 1.2), -1, 1) * (k || 1);
    lastMove = performance.now(); kick();
  }
  window.addEventListener("pointermove", function (e) { if (e.pointerType !== "touch" && !hoverIt) aimAt(e.clientX, e.clientY, 1); }, { passive: true });
  if (orb) {
    orb.addEventListener("pointerover", function (e) {
      var it = e.target.closest && e.target.closest(".orb__it"); if (!it) return;
      hoverIt = it; disc.classList.add("is-think");
      var r = it.getBoundingClientRect(); aimAt(r.left + r.width / 2, r.top + r.height / 2, 1.2);
    });
    orb.addEventListener("pointerout", function (e) {
      var it = e.target.closest && e.target.closest(".orb__it");
      if (it && it === hoverIt && !it.contains(e.relatedTarget)) { hoverIt = null; disc.classList.remove("is-think"); }
    });
  }
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) { last = 0; return; }
    var dt = last ? Math.min((now - last) / 1000, .05) : .016; last = now;
    var t = now / 1000;
    if (hoverIt) {
      var r = hoverIt.getBoundingClientRect(), d = disc.getBoundingClientRect();
      tx = clamp((r.left + r.width / 2 - d.left - d.width * .62) / (d.width * 1.2), -1, 1) * 1.2;
      ty = clamp((r.top + r.height / 2 - d.top - d.height * .42) / (d.height * 1.2), -1, 1) * 1.2;
    } else if (now - lastMove > 3500) { tx = Math.sin(t * .35) * .3; ty = Math.sin(t * .27) * .35; }   // нет мыши — тихо покачивается
    var k = 1 - Math.exp(-4.5 * dt); x += (tx - x) * k; y += (ty - y) * k;
    var br = Math.sin(t * 1.5);                                                                      // «дыхание»
    var s = disc.style;
    s.setProperty("--tilt", (y * 7 - x * 1.5).toFixed(2) + "deg");      // курсор ниже — опускает подбородок, выше — поднимает
    s.setProperty("--hx", (x * 5).toFixed(1) + "px");
    s.setProperty("--hy", (br * 1.2 + y * 2).toFixed(1) + "px");
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }
  (function blink() {
    setTimeout(function () {
      disc.classList.add("is-blink");
      setTimeout(function () { disc.classList.remove("is-blink"); blink(); }, 140);
    }, 2400 + Math.random() * 3600);
  })();
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { threshold: .05 }).observe(disc);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) kick(); });
  kick();
})();
