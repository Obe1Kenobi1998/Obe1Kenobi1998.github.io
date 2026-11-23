/* Живой фон: сеть золотых частиц, реагирующая на курсор */
(function () {
  var cv = document.getElementById("net");
  if (!cv) return;
  var ctx = cv.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W, H, pts = [], mouse = { x: -9999, y: -9999 }, running = true;

  function size() {
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(110, (W * H) / 14000));
    pts = [];
    for (var i = 0; i < n; i++) {
      pts.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
        r: Math.random() * 1.6 + .5, g: Math.random() < .18
      });
    }
  }

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    var link = W < 700 ? 95 : 135, link2 = link * link;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      // притяжение к курсору
      var dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
      if (d2 < 40000) { p.vx += dx * .00004; p.vy += dy * .00004; }
      p.vx *= .995; p.vy *= .995;
      if (Math.abs(p.vx) < .05) p.vx += (Math.random() - .5) * .04;
      if (Math.abs(p.vy) < .05) p.vy += (Math.random() - .5) * .04;
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;

      for (var j = i + 1; j < pts.length; j++) {
        var q = pts[j], ex = p.x - q.x, ey = p.y - q.y, e2 = ex * ex + ey * ey;
        if (e2 < link2) {
          ctx.strokeStyle = "rgba(160,118,40," + (1 - e2 / link2) * .2 + ")";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      if (d2 < 32000) {
        ctx.strokeStyle = "rgba(195,146,51," + (1 - d2 / 32000) * .5 + ")";
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.fillStyle = p.g ? "rgba(195,146,51,.85)" : "rgba(70,55,35,.28)";
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", size);
  window.addEventListener("pointermove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; });
  document.addEventListener("visibilitychange", function () {
    var was = running; running = !document.hidden;
    if (running && !was) requestAnimationFrame(frame);
  });
  size();
  if (reduce) { running = false; frame = function () {}; return; }
  requestAnimationFrame(frame);
})();
