/* =====================================================================
   ПОРТРЕТ ДЕВУШКИ-АНДРОИДА в центре орбиты (service.html).
   Изображение: Magnific (ИИ-изображение, бесплатная лицензия с указанием источника — подпись под орбитой).
   Портрет «живой»: круг наклоняется за курсором и в сторону значка утилиты под мышью,
   фото чуть смещается внутри круга (глубина) и медленно «дышит» масштабом;
   светодиод на лбу мерцает, при наведении на значок — чаще (класс is-think).
   При reduced-motion — спокойная картинка без движения.
   ===================================================================== */
(function () {
  "use strict";
  var disc = document.getElementById("svcBot");
  if (!disc) return;
  var img = disc.querySelector(".orb__img");
  function ready() { disc.classList.add("is-ready"); }
  if (img) { if (img.complete && img.naturalWidth) ready(); else { img.addEventListener("load", ready); img.addEventListener("error", ready); } }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var orb = disc.closest(".orb") || disc.parentNode;
  var tx = 0, ty = 0, x = 0, y = 0, hoverIt = null, lastMove = 0, visible = true, raf = 0, last = 0;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function aimAt(cx, cy, k) {
    var r = disc.getBoundingClientRect(), hx = r.left + r.width / 2, hy = r.top + r.height / 2;
    tx = clamp((cx - hx) / (r.width * 1.2), -1, 1) * (k || 1);
    ty = clamp((cy - hy) / (r.height * 1.2), -1, 1) * (k || 1);
    lastMove = performance.now(); kick();
  }
  window.addEventListener("pointermove", function (e) { if (e.pointerType !== "touch" && !hoverIt) aimAt(e.clientX, e.clientY, .9); }, { passive: true });
  if (orb) {
    orb.addEventListener("pointerover", function (e) {
      var it = e.target.closest && e.target.closest(".orb__it"); if (!it) return;
      hoverIt = it; disc.classList.add("is-think");
      var r = it.getBoundingClientRect(); aimAt(r.left + r.width / 2, r.top + r.height / 2, 1.25);
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
      tx = clamp((r.left + r.width / 2 - d.left - d.width / 2) / (d.width * 1.2), -1, 1) * 1.25;
      ty = clamp((r.top + r.height / 2 - d.top - d.height / 2) / (d.height * 1.2), -1, 1) * 1.25;
    } else if (now - lastMove > 3500) { tx = Math.sin(t * .4) * .35; ty = Math.sin(t * .31) * .2; }    // нет мыши — тихо «дышит»
    var k = 1 - Math.exp(-5 * dt); x += (tx - x) * k; y += (ty - y) * k;
    var s = disc.style;
    s.setProperty("--ry", (x * 9).toFixed(2) + "deg"); s.setProperty("--rx", (-y * 7).toFixed(2) + "deg");
    s.setProperty("--px", (-x * 7).toFixed(1) + "px"); s.setProperty("--py", (-y * 6).toFixed(1) + "px");
    s.setProperty("--zs", (1.02 + Math.sin(t * .5) * .012).toFixed(4));
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { threshold: .05 }).observe(disc);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) kick(); });
  kick();
})();
