/* =====================================================================
   Толпа человечков внизу блока «Связь». Рисуется кодом (SVG), без картинок:
   каждый — случайная причёска, лицо, очки, борода, одежда. Человечки идут
   вдоль экрана, слегка подпрыгивая на шаге, и пропадают, уйдя за край.
   ===================================================================== */
(function () {
  "use strict";
  var host = document.getElementById("crowd");
  if (!host) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  var INK = "#0c0e11", SKIN, GOLD, PAPER;
  // задние ряды — темнее (как в тумане), но непрозрачные, чтобы не просвечивали друг сквозь друга
  var TONES = [
    // светлая тема: задние ряды бледнеют, как в дымке, линии светлее
    { ink: "#b9ad9a", skin: "#f3ede3", paper: "#efe8dc", gold: "#ead3a0" },
    { ink: "#6f6556", skin: "#faf6ef", paper: "#f6f0e6", gold: "#e2bd6c" },
    { ink: "#1e1a15", skin: "#fffdf8", paper: "#fffaf2", gold: "#d4a84b" }
  ];

  var seed = 20261123;
  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  function pick(a) { return a[Math.floor(rnd() * a.length)]; }
  function chance(p) { return rnd() < p; }

  // ---------------------------------------------------------- один человечек
  // начало координат — середина низа, рисуем вверх (y < 0)
  function person(tone) {
    INK = tone.ink; SKIN = tone.skin; PAPER = tone.paper; GOLD = tone.gold;
    var out = [], st = 'stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
    var shirt = pick(["plain", "stripes", "v", "hoodie", "dots", "gold", "tie", "plain"]);
    var shirtFill = shirt === "gold" ? GOLD : PAPER;
    var w = 44 + Math.round(rnd() * 10);                                     // полуширина плеч
    var hair = pick(["afro", "afro", "short", "bowl", "spiky", "bun", "bald", "long", "cap", "side", "mohawk"]);
    var face = pick(["smile", "smile", "grin", "flat", "o", "smile"]);
    var eyes = chance(0.05) ? "patch" : pick(["dots", "dots", "dots", "dots", "glasses", "glasses", "shades", "closed"]);
    var beard = chance(0.22), brows = chance(0.5);
    var hx = 0, hy = -112, rx = 24 + Math.round(rnd() * 3), ry = 27;

    // волосы сзади головы
    if (hair === "afro") {
      var R = 37 + rnd() * 6, n = 14, bumps = "";
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2;
        bumps += '<circle cx="' + (Math.cos(a) * R).toFixed(1) + '" cy="' + (hy - 8 + Math.sin(a) * R * 0.92).toFixed(1) + '" r="11" fill="' + INK + '" ' + st + "/>";
      }
      out.push(bumps + '<circle cx="0" cy="' + (hy - 8) + '" r="' + (R + 2).toFixed(1) + '" fill="' + INK + '"/>');
    } else if (hair === "long") {
      out.push('<path d="M-30,' + (hy - 6) + " Q-34," + (hy + 40) + " -26," + (hy + 52) + " L26," + (hy + 52) + " Q34," + (hy + 40) + " 30," + (hy - 6) + ' Z" fill="' + INK + '" ' + st + "/>");
    } else if (hair === "bun") {
      out.push('<circle cx="0" cy="' + (hy - 34) + '" r="13" fill="' + INK + '" ' + st + "/>");
    }

    // тело и шея
    out.push('<path d="M' + -w + ",0 L" + -w + ",-34 Q" + -w + ",-70 -16,-74 L16,-74 Q" + w + ",-70 " + w + ",-34 L" + w + ',0 Z" fill="' + shirtFill + '" ' + st + "/>");
    if (shirt === "stripes") {
      for (var y = -12; y > -66; y -= 12) {
        var half = y < -55 ? w - 14 : w - 2;
        out.push('<line x1="' + -half + '" y1="' + y + '" x2="' + half + '" y2="' + y + '" ' + st + "/>");
      }
    } else if (shirt === "dots") {
      for (var dy = -14; dy > -62; dy -= 15) for (var dx = -w + 12; dx < w - 6; dx += 16)
        out.push('<circle cx="' + (dx + (dy % 30 ? 8 : 0)) + '" cy="' + dy + '" r="2.4" fill="' + INK + '"/>');
    } else if (shirt === "hoodie") {
      out.push('<path d="M-20,-74 Q0,-52 20,-74" fill="none" ' + st + '/><line x1="-8" y1="-62" x2="-9" y2="-40" ' + st + '/><line x1="8" y1="-62" x2="9" y2="-40" ' + st + "/>");
    } else if (shirt === "tie") {
      out.push('<path d="M-12,-74 L0,-60 L12,-74" fill="none" ' + st + '/><path d="M0,-60 L-6,-48 L0,-20 L6,-48 Z" fill="' + GOLD + '" ' + st + "/>");
    } else if (shirt === "v") {
      out.push('<path d="M-14,-74 L0,-52 L14,-74" fill="none" ' + st + "/>");
    }
    out.push('<path d="M-9,-72 L-9,-86 L9,-86 L9,-72" fill="' + SKIN + '" ' + st + "/>");

    // голова
    out.push('<ellipse cx="' + hx + '" cy="' + hy + '" rx="' + rx + '" ry="' + ry + '" fill="' + SKIN + '" ' + st + "/>");
    // уши
    out.push('<path d="M' + (-rx + 1) + "," + (hy - 4) + " q-8,4 0,12" + '" fill="' + SKIN + '" ' + st + '/><path d="M' + (rx - 1) + "," + (hy - 4) + " q8,4 0,12" + '" fill="' + SKIN + '" ' + st + "/>");

    // волосы спереди
    var top = hy - ry;
    if (hair === "short" || hair === "side") {
      var part = hair === "side" ? 10 : 0;
      out.push('<path d="M' + (-rx - 1) + "," + (hy - 4) + " Q" + (-rx - 2) + "," + (top - 8) + " 0," + (top - 6) + " Q" + (rx + 2) + "," + (top - 8) + " " + (rx + 1) + "," + (hy - 4) +
        " Q" + (rx - 4) + "," + (top + 10) + " " + part + "," + (top + 9) + " Q" + (-rx + 4) + "," + (top + 10) + " " + (-rx - 1) + "," + (hy - 4) + ' Z" fill="' + INK + '" ' + st + "/>");
    } else if (hair === "bowl") {
      out.push('<path d="M' + (-rx - 3) + "," + (hy - 2) + " Q" + (-rx - 3) + "," + (top - 10) + " 0," + (top - 10) + " Q" + (rx + 3) + "," + (top - 10) + " " + (rx + 3) + "," + (hy - 2) +
        " L" + (rx - 2) + "," + (hy - 8) + " L" + (-rx + 2) + "," + (hy - 8) + ' Z" fill="' + INK + '" ' + st + "/>");
    } else if (hair === "spiky") {
      var sp = "M" + (-rx) + "," + (hy - 6);
      for (var k = 0; k <= 6; k++) {
        var px = -rx + (k / 6) * rx * 2;
        sp += " L" + (px - 4).toFixed(1) + "," + (top - 12 - (k % 2) * 6) + " L" + (px + 3).toFixed(1) + "," + (top + 4);
      }
      out.push('<path d="' + sp + " L" + rx + "," + (hy - 6) + ' Z" fill="' + INK + '" ' + st + "/>");
    } else if (hair === "bun" || hair === "long") {
      out.push('<path d="M' + (-rx - 1) + "," + (hy + 2) + " Q" + (-rx) + "," + (top - 6) + " 0," + (top - 4) + " Q" + rx + "," + (top - 6) + " " + (rx + 1) + "," + (hy + 2) +
        " Q" + (rx - 6) + "," + (top + 8) + " 0," + (top + 6) + " Q" + (-rx + 6) + "," + (top + 8) + " " + (-rx - 1) + "," + (hy + 2) + ' Z" fill="' + INK + '" ' + st + "/>");
    } else if (hair === "cap") {
      var capFill = chance(0.5) ? GOLD : INK;
      out.push('<path d="M' + (-rx - 2) + "," + (hy - 8) + " Q" + (-rx - 2) + "," + (top - 10) + " 0," + (top - 10) + " Q" + (rx + 2) + "," + (top - 10) + " " + (rx + 2) + "," + (hy - 8) + ' Z" fill="' + capFill + '" ' + st + "/>" +
        '<path d="M' + (rx - 4) + "," + (hy - 9) + " L" + (rx + 20) + "," + (hy - 6) + " Q" + (rx + 22) + "," + (hy - 12) + " " + (rx - 2) + "," + (hy - 15) + '" fill="' + capFill + '" ' + st + "/>");
    } else if (hair === "mohawk") {
      out.push('<path d="M-6,' + (top + 2) + " L-4," + (top - 22) + " L4," + (top - 22) + " L6," + (top + 2) + ' Z" fill="' + INK + '" ' + st + "/>");
    } else if (hair === "afro") {
      out.push('<path d="M' + (-rx) + "," + (hy - 6) + " Q0," + (top + 14) + " " + rx + "," + (hy - 6) + '" fill="none" ' + st + "/>");
    }

    // глаза
    var ey = hy - 2, ex = 9;
    if (eyes === "glasses") {
      out.push('<circle cx="' + -ex + '" cy="' + ey + '" r="7.5" fill="none" ' + st + '/><circle cx="' + ex + '" cy="' + ey + '" r="7.5" fill="none" ' + st +
        '/><line x1="-1.5" y1="' + ey + '" x2="1.5" y2="' + ey + '" ' + st + '/><circle cx="' + -ex + '" cy="' + ey + '" r="2" fill="' + INK + '"/><circle cx="' + ex + '" cy="' + ey + '" r="2" fill="' + INK + '"/>');
    } else if (eyes === "shades") {
      out.push('<rect x="' + (-ex - 9) + '" y="' + (ey - 6) + '" width="15" height="11" rx="4" fill="' + INK + '" ' + st + '/><rect x="' + (ex - 6) + '" y="' + (ey - 6) + '" width="15" height="11" rx="4" fill="' + INK + '" ' + st +
        '/><line x1="-3" y1="' + (ey - 3) + '" x2="3" y2="' + (ey - 3) + '" ' + st + "/>");
    } else if (eyes === "patch") {
      out.push('<line x1="' + (-rx + 2) + '" y1="' + (ey - 14) + '" x2="' + (rx - 2) + '" y2="' + (ey + 4) + '" ' + st + '/><ellipse cx="' + -ex + '" cy="' + ey + '" rx="7" ry="6" fill="' + INK + '"/><circle cx="' + ex + '" cy="' + ey + '" r="2.4" fill="' + INK + '"/>');
    } else if (eyes === "closed") {
      out.push('<path d="M' + (-ex - 4) + "," + ey + " q4,3 8,0" + '" fill="none" ' + st + '/><path d="M' + (ex - 4) + "," + ey + " q4,3 8,0" + '" fill="none" ' + st + "/>");
    } else {
      out.push('<circle cx="' + -ex + '" cy="' + ey + '" r="2.4" fill="' + INK + '"/><circle cx="' + ex + '" cy="' + ey + '" r="2.4" fill="' + INK + '"/>');
    }
    if (brows && eyes !== "shades") out.push('<path d="M' + (-ex - 5) + "," + (ey - 10) + " l9,-2" + '" ' + st + '/><path d="M' + (ex - 4) + "," + (ey - 12) + " l9,2" + '" ' + st + "/>");

    // рот и борода
    var my = hy + 12;
    if (beard) out.push('<path d="M' + (-rx + 2) + "," + (hy + 2) + " Q" + (-rx + 4) + "," + (hy + ry + 8) + " 0," + (hy + ry + 8) + " Q" + (rx - 4) + "," + (hy + ry + 8) + " " + (rx - 2) + "," + (hy + 2) +
      " Q" + (rx - 8) + "," + (my - 2) + " 0," + (my - 4) + " Q" + (-rx + 8) + "," + (my - 2) + " " + (-rx + 2) + "," + (hy + 2) + ' Z" fill="' + INK + '" ' + st + "/>");
    var mouthInk = beard ? SKIN : INK;
    if (face === "grin") out.push('<path d="M-9,' + my + " Q0," + (my + 12) + " 9," + my + ' Z" fill="' + (beard ? SKIN : INK) + '" stroke="' + mouthInk + '" stroke-width="2.4" stroke-linejoin="round"/>');
    else if (face === "flat") out.push('<line x1="-6" y1="' + (my + 2) + '" x2="6" y2="' + (my + 2) + '" stroke="' + mouthInk + '" stroke-width="2.6" stroke-linecap="round"/>');
    else if (face === "o") out.push('<ellipse cx="0" cy="' + (my + 3) + '" rx="4" ry="5" fill="' + (beard ? SKIN : INK) + '"/>');
    else out.push('<path d="M-8,' + my + " Q0," + (my + 7) + " 8," + my + '" fill="none" stroke="' + mouthInk + '" stroke-width="2.6" stroke-linecap="round"/>');

    return out.join("");
  }

  // ---------------------------------------------------------- сцена
  var svg = document.createElementNS(NS, "svg");
  svg.setAttribute("preserveAspectRatio", "xMidYMax slice");
  host.appendChild(svg);

  var ROWS = [
    { scale: 0.74, y: 0.62, speed: 0.22, dir: -1, tone: TONES[0], gap: 70 },
    { scale: 0.9,  y: 0.82, speed: 0.32, dir: 1,  tone: TONES[1], gap: 78 },
    { scale: 1.08, y: 1.04, speed: 0.42, dir: -1, tone: TONES[2], gap: 88 }
  ];
  var W = 0, H = 0, walkers = [];

  function spawn(row, x) {
    var g = document.createElementNS(NS, "g");
    g.innerHTML = person(row.tone);
    var flip = row.dir < 0 ? -1 : 1;                                        // смотрят по ходу движения
    return { g: g, row: row, x: x, phase: rnd() * Math.PI * 2, step: 0.9 + rnd() * 0.5, flip: flip, sp: row.speed * (0.8 + rnd() * 0.4) };
  }

  function layout() {
    W = host.clientWidth; H = host.clientHeight;
    if (!W || !H) return;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("width", W); svg.setAttribute("height", H);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    walkers = [];
    var unit = Math.max(0.62, Math.min(1, W / 1300));                       // на телефоне человечки мельче
    ROWS.forEach(function (row) {
      var layer = document.createElementNS(NS, "g");
      svg.appendChild(layer);
      var gap = row.gap * row.scale * unit;
      for (var x = -60 + rnd() * 30; x < W + 120; x += gap * (0.8 + rnd() * 0.5)) {
        var wk = spawn(row, x);
        wk.unit = unit;
        layer.appendChild(wk.g);
        walkers.push(wk);
      }
    });
    draw(0);
  }

  function draw(t) {
    for (var i = 0; i < walkers.length; i++) {
      var w = walkers[i], r = w.row, s = r.scale * w.unit;
      var bob = reduce ? 0 : Math.abs(Math.sin(t * 0.004 * w.step + w.phase)) * 5 * s;
      var tilt = reduce ? 0 : Math.sin(t * 0.004 * w.step + w.phase) * 2.2;
      w.g.setAttribute("transform", "translate(" + w.x.toFixed(1) + "," + (H * r.y - bob).toFixed(1) + ") scale(" + (s * w.flip).toFixed(3) + "," + s.toFixed(3) + ") rotate(" + tilt.toFixed(2) + ")");
    }
  }

  var last = 0, running = false;
  function frame(t) {
    if (!running) return;
    var dt = last ? Math.min(50, t - last) : 16; last = t;
    for (var i = 0; i < walkers.length; i++) {
      var w = walkers[i];
      w.x += w.sp * w.row.dir * dt * 0.06 * w.unit;
      if (w.row.dir < 0 && w.x < -80) { w.x = W + 60 + rnd() * 40; w.g.innerHTML = person(w.row.tone); }   // ушёл за край — выходит новый
      if (w.row.dir > 0 && w.x > W + 80) { w.x = -60 - rnd() * 40; w.g.innerHTML = person(w.row.tone); }
    }
    draw(t);
    requestAnimationFrame(frame);
  }

  layout();
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(layout, 150); });
  if (reduce) return;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      var vis = es[0].isIntersecting;
      if (vis && !running) { running = true; last = 0; requestAnimationFrame(frame); }
      else if (!vis) running = false;
    }).observe(host);
  } else { running = true; requestAnimationFrame(frame); }
})();
