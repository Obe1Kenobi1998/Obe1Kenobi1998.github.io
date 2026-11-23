/* =====================================================================
   Прожектор за курсором — по мотивам «Spotlight Card» (21st.dev, @jahed).
   Когда курсор подходит к блоку, у него загорается рамка и мягкое пятно
   света. Свет считается от реального курсора, поэтому соседние блоки
   подсвечиваются одновременно, каждый со своей стороны.
   ===================================================================== */
(function () {
  "use strict";
  if (!window.matchMedia("(pointer: fine)").matches) return;          // на телефоне курсора нет
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var SELECTORS = [
    ".offer", ".offer__chip", ".step", ".work", ".calc", ".calc__result", ".faq details",
    ".cta__bar", ".code-win", ".float-card", ".splite", ".pill", ".channel"
  ];
  var hosts = [];
  document.querySelectorAll(SELECTORS.join(",")).forEach(function (el) {
    if (el.querySelector(":scope > .sg")) return;
    el.classList.add("sg-host");
    var sg = document.createElement("span");
    sg.className = "sg";
    sg.setAttribute("aria-hidden", "true");
    sg.innerHTML = '<span class="sg__outer"></span>';
    el.appendChild(sg);
    hosts.push(el);
  });

  var mx = -9999, my = -9999, raf = 0;
  function paint() {
    raf = 0;
    var vh = window.innerHeight, hue = (38 + (mx / window.innerWidth) * 18).toFixed(1);
    for (var i = 0; i < hosts.length; i++) {
      var el = hosts[i], r = el.getBoundingClientRect();
      if (r.bottom < -250 || r.top > vh + 250) continue;              // вне экрана — не трогаем
      el.style.setProperty("--gx", (mx - r.left).toFixed(1) + "px");
      el.style.setProperty("--gy", (my - r.top).toFixed(1) + "px");
      el.style.setProperty("--hue", hue);
    }
  }
  function queue() { if (!raf) raf = requestAnimationFrame(paint); }
  document.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    mx = e.clientX; my = e.clientY; queue();
  }, { passive: true });
  window.addEventListener("scroll", queue, { passive: true });         // блоки едут под неподвижным курсором
  document.addEventListener("pointerleave", function () { mx = my = -9999; queue(); });
})();
