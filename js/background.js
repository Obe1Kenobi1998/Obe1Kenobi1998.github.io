/* Живой фон: сеть золотых частиц, реагирующая на курсор.
   У каждой звезды есть «законное место». Пока курсор двигается — звёзды
   тянутся к нему; через 5 секунд без движения медленно возвращаются домой
   и спокойно покачиваются там. */
(function () {
  var cv = document.getElementById("net");
  if (!cv) return;
  var ctx = cv.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W, H, pts = [], mouse = { x: -9999, y: -9999 }, running = true;
  var IDLE = 5000;            // через сколько мс без движения звёзды идут домой
  var RAMP = 2500;            // за сколько мс включается «тяга домой»
  var lastMove = -1e9;

  function size() {
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(110, (W * H) / 14000));
    pts = [];
    for (var i = 0; i < n; i++) {
      var x = Math.random() * W, y = Math.random() * H;
      pts.push({
        x: x, y: y, hx: x, hy: y,                       // текущее место и «дом»
        vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
        r: Math.random() * 1.6 + .5, g: Math.random() < .18,
        wa: 6 + Math.random() * 14,                     // амплитуда покачивания у дома
        ws: .00025 + Math.random() * .00045,            // скорость покачивания
        ph: Math.random() * 6.283
      });
    }
  }

  function frame(now) {
    if (!running) return;
    now = now || performance.now();
    ctx.clearRect(0, 0, W, H);
    var link = W < 700 ? 95 : 135, link2 = link * link;
    var idle = now - lastMove;
    var ret = idle > IDLE ? Math.min(1, (idle - IDLE) / RAMP) : 0;   // 0 — свободно, 1 — домой
    var att = 1 - ret;                                                // сила притяжения к курсору
    var k = .000012 + ret * .00032;                                   // жёсткость «резинки» к дому
    var damp = .995 - ret * .035;
    var vmax = 2.4 - ret * .9;                                        // домой — неспешно

    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      var dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
      if (att > 0 && d2 < 40000) { p.vx += dx * .00004 * att; p.vy += dy * .00004 * att; }

      // точка дома с лёгким покачиванием
      var tx = p.hx + Math.sin(now * p.ws + p.ph) * p.wa;
      var ty = p.hy + Math.cos(now * p.ws * .8 + p.ph) * p.wa;
      p.vx += (tx - p.x) * k; p.vy += (ty - p.y) * k;
      p.vx *= damp; p.vy *= damp;
      if (ret === 0) {
        if (Math.abs(p.vx) < .05) p.vx += (Math.random() - .5) * .04;
        if (Math.abs(p.vy) < .05) p.vy += (Math.random() - .5) * .04;
      }
      var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (sp > vmax) { p.vx *= vmax / sp; p.vy *= vmax / sp; }
      p.x += p.vx; p.y += p.vy;

      for (var j = i + 1; j < pts.length; j++) {
        var q = pts[j], ex = p.x - q.x, ey = p.y - q.y, e2 = ex * ex + ey * ey;
        if (e2 < link2) {
          ctx.strokeStyle = "rgba(160,118,40," + (1 - e2 / link2) * .2 + ")";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      if (att > 0 && d2 < 32000) {
        ctx.strokeStyle = "rgba(195,146,51," + (1 - d2 / 32000) * .5 * att + ")";
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.fillStyle = p.g ? "rgba(195,146,51,.85)" : "rgba(70,55,35,.28)";
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", size);
  window.addEventListener("pointermove", function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY; lastMove = performance.now();
  }, { passive: true });
  document.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; });
  document.addEventListener("visibilitychange", function () {
    var was = running; running = !document.hidden;
    if (running && !was) requestAnimationFrame(frame);
  });
  size();
  if (reduce) { running = false; frame = function () {}; return; }
  requestAnimationFrame(frame);
})();
