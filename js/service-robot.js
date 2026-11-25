/* =====================================================================
   ПОРТРЕТ ДЕВУШКИ-АНДРОИДА в центре орбиты (service.html).
   Изображение: Magnific (ИИ-изображение, бесплатная лицензия с указанием источника — подпись под орбитой).
   Портрет «живой»:
   • глаза следят за курсором: радужки (вырезаны из фото) двигаются внутри разреза век (--gx/--gy);
     при наведении на значок утилиты она смотрит на него; без мыши — смотрит на зрителя и иногда отводит взгляд;
   • круг слегка наклоняется в сторону взгляда, фото чуть смещается внутри (глубина) и медленно «дышит»;
   • светодиод на лбу мерцает, при наведении на значок — чаще (класс is-think).
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
  var EYE_X = .555, EYE_Y = .51;                     // где примерно глаза внутри круга (доля ширины/высоты)
  var gx = 0, gy = 0, ex = 0, ey = 0;                // взгляд: цель и текущее (-1…1)
  var hoverIt = null, ptr = null, lastMove = 0, visible = true, raf = 0, last = 0, nextGlance = 0, glance = null;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lookAt(cx, cy, boost) {                   // экранная точка → взгляд
    var r = disc.getBoundingClientRect();
    var dx = cx - (r.left + r.width * EYE_X), dy = cy - (r.top + r.height * EYE_Y);
    var nx = dx / (r.width * .55), ny = dy / (r.height * .55);
    var l = Math.sqrt(nx * nx + ny * ny), s = l > 1 ? 1 / l : 1;     // внутри «круга» — плавно, дальше — упор
    gx = clamp(nx * s * (boost || 1), -1, 1); gy = clamp(ny * s * (boost || 1), -1, 1);
  }
  window.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    ptr = [e.clientX, e.clientY]; lastMove = performance.now(); kick();
  }, { passive: true });
  document.addEventListener("pointerleave", function () { ptr = null; });
  if (orb) {
    orb.addEventListener("pointerover", function (e) {
      var it = e.target.closest && e.target.closest(".orb__it"); if (!it) return;
      hoverIt = it; disc.classList.add("is-think"); kick();
    });
    orb.addEventListener("pointerout", function (e) {
      var it = e.target.closest && e.target.closest(".orb__it");
      if (it && it === hoverIt && !it.contains(e.relatedTarget)) { hoverIt = null; disc.classList.remove("is-think"); }
    });
    orb.addEventListener("focusin", function (e) { var it = e.target.closest && e.target.closest(".orb__it"); if (it) { hoverIt = it; disc.classList.add("is-think"); kick(); } });
    orb.addEventListener("focusout", function () { hoverIt = null; disc.classList.remove("is-think"); });
  }
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) { last = 0; return; }
    var dt = last ? Math.min((now - last) / 1000, .05) : .016; last = now;
    var t = now / 1000;
    if (hoverIt) { var r = hoverIt.getBoundingClientRect(); lookAt(r.left + r.width / 2, r.top + r.height / 2, 1.15); }
    else if (ptr && now - lastMove < 4000) lookAt(ptr[0], ptr[1], 1);
    else {                                          // мыши нет — смотрит на зрителя, иногда отводит взгляд
      if (now > nextGlance) {
        glance = Math.random() < .55 ? null : [(Math.random() * 2 - 1) * .8, (Math.random() * 2 - 1) * .45];
        nextGlance = now + (glance ? 900 + Math.random() * 900 : 2200 + Math.random() * 2600);
      }
      gx = glance ? glance[0] : 0; gy = glance ? glance[1] : 0;
    }
    var k = 1 - Math.exp(-16 * dt);                 // глаза — быстрые, почти как саккада
    ex += (gx - ex) * k; ey += (gy - ey) * k;
    var s = disc.style;
    s.setProperty("--gx", ex.toFixed(3)); s.setProperty("--gy", ey.toFixed(3));
    // наклон круга и «глубина» — мягче и медленнее глаз
    var hx = parseFloat(s.getPropertyValue("--hx0")) || 0, hy = parseFloat(s.getPropertyValue("--hy0")) || 0;
    var kh = 1 - Math.exp(-3.5 * dt); hx += (ex - hx) * kh; hy += (ey - hy) * kh;
    s.setProperty("--hx0", hx.toFixed(4)); s.setProperty("--hy0", hy.toFixed(4));
    s.setProperty("--ry", (hx * 7).toFixed(2) + "deg"); s.setProperty("--rx", (-hy * 5).toFixed(2) + "deg");
    s.setProperty("--px", (-hx * 6).toFixed(1) + "px"); s.setProperty("--py", (-hy * 5).toFixed(1) + "px");
    s.setProperty("--zs", (1.02 + Math.sin(t * .5) * .012).toFixed(4));
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { threshold: .05 }).observe(disc);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) kick(); });
  kick();
})();
