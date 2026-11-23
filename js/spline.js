/* =====================================================================
   3D-робот в блоке «Опыт» — по мотивам «Splite / Spline Scene»
   (21st.dev, @serafimcloud). Движок Spline грузится лениво, только когда
   блок подъезжает к экрану. Нет интернета или слабый телефон — остаётся
   красивая запасная анимация, сайт не ломается.
   ===================================================================== */
(function () {
  "use strict";
  var RUNTIME = "https://unpkg.com/@splinetool/runtime@2.0.126/build/runtime.standalone.js";
  var SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

  var box = document.getElementById("splineScene");
  if (!box) return;
  var canvas = box.querySelector("canvas");
  var small = window.matchMedia("(max-width: 700px)").matches;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fail(why) {
    box.classList.remove("is-loading");
    box.classList.add("is-fallback");
    if (why && window.console) console.info("3D-сцена не загружена:", why);
  }
  if (small || reduce || !window.WebGLRenderingContext) { fail(small ? "узкий экран" : "отключено"); return; }

  var started = false;
  function start() {
    if (started) return;
    started = true;
    box.classList.add("is-loading");
    var timer = setTimeout(function () { fail("таймаут"); }, 45000);
    import(RUNTIME).then(function (mod) {
      var app = new mod.Application(canvas);
      return app.load(SCENE).then(function () {
        clearTimeout(timer);
        if (box.classList.contains("is-fallback")) return;            // уже сдались по таймауту
        box.classList.remove("is-loading");
        box.classList.add("is-ready");
      });
    }).catch(function (e) { clearTimeout(timer); fail(e && e.message); });
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (x) { return x.isIntersecting; })) { io.disconnect(); start(); }
    }, { rootMargin: "400px 0px" });
    io.observe(box);
  } else start();
})();
