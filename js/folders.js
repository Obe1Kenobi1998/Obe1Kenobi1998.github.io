/* =====================================================================
   Стеклянные папки — порт компонента «Glassmorphism Folder Cards»
   (21st.dev, @kedhareswer) с React на чистый JavaScript.
   Три слоя: задняя панель с генерируемым артом, файлы, матовое стекло
   спереди на нижней петле. Наведение — наклон, клик — открыть,
   «+» — добавить файл, «···» — меню.
   ===================================================================== */
(function () {
  "use strict";

  // ---------------------------------------------------------------- арт
  var ART_PRESETS = {
    aurora: { style: "streak", colors: ["#f4efe9", "#e9c2b8", "#c2433f", "#2a1e2a", "#22395e", "#6f97c2", "#e5edf4"], scale: .7, warp: 1.4, angle: -.62, gloss: .18, veins: 0 },
    ember: { style: "marble", colors: ["#07090c", "#16252c", "#3d5f68", "#1a1416", "#a3201a", "#ef4a2b", "#ff8a5c"], scale: .62, warp: 3.2, angle: -.5, gloss: .55, veins: .6 },
    dusk: { style: "marble", colors: ["#120c18", "#3e2850", "#8f6c9c", "#2b1a24", "#b3502f", "#eab08a", "#fbe7d2"], scale: .75, warp: 3.6, angle: .8, gloss: .5, veins: .5 },
    glacier: { style: "streak", colors: ["#f7f8fa", "#d9e2ea", "#9fb4c7", "#e8edf2", "#bccbd8", "#ffffff"], scale: .7, warp: 1.6, angle: .35, gloss: .25, veins: 0 },
    verdant: { style: "marble", colors: ["#070b08", "#173024", "#4f7a5a", "#141812", "#a7843a", "#e9cf87", "#fbf3d6"], scale: .7, warp: 3.4, angle: 2.1, gloss: .5, veins: .5 },
    // палитра сайта: графит и золото
    gold: { style: "marble", colors: ["#08090b", "#1d2128", "#4a3a1c", "#14110b", "#b8892f", "#f0cd73", "#fff4d6"], scale: .68, warp: 3.3, angle: -.4, gloss: .55, veins: .5 },
    champagne: { style: "streak", colors: ["#fbf6ea", "#f0dcae", "#d4a84b", "#2a2116", "#171a20", "#6d7d93", "#eef0f3"], scale: .7, warp: 1.4, angle: -.62, gloss: .2, veins: 0 },
    steel: { style: "marble", colors: ["#07090c", "#111821", "#2b4256", "#0c0e11", "#5aa9e6", "#a9d3f2", "#eef6fc"], scale: .7, warp: 3.2, angle: 1.2, gloss: .5, veins: .45 }
  };

  function hexToRgb(hex) {
    var h = String(hex).trim().replace(/^#/, "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = /^[0-9a-f]{6}$/i.test(h) ? parseInt(h, 16) : 0x808080;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  function makeFbm(seed) {
    var r = rng(seed), perm = new Uint8Array(512), grad = new Float32Array(512), p = [], i, j, t;
    for (i = 0; i < 256; i++) p.push(i);
    for (i = 255; i > 0; i--) { j = Math.floor(r() * (i + 1)); t = p[i]; p[i] = p[j]; p[j] = t; }
    for (i = 0; i < 512; i++) perm[i] = p[i & 255];
    for (i = 0; i < 256; i++) { var a = r() * Math.PI * 2; grad[i * 2] = Math.cos(a); grad[i * 2 + 1] = Math.sin(a); }
    function noise(x, y) {
      var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
      var h00 = perm[X + perm[Y]] * 2, h10 = perm[X + 1 + perm[Y]] * 2, h01 = perm[X + perm[Y + 1]] * 2, h11 = perm[X + 1 + perm[Y + 1]] * 2;
      var d00 = grad[h00] * xf + grad[h00 + 1] * yf, d10 = grad[h10] * (xf - 1) + grad[h10 + 1] * yf;
      var d01 = grad[h01] * xf + grad[h01 + 1] * (yf - 1), d11 = grad[h11] * (xf - 1) + grad[h11 + 1] * (yf - 1);
      var u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
      return d00 + u * (d10 - d00) + v * (d01 - d00 + u * (d11 - d01 - d10 + d00));
    }
    return function (x, y, octaves) {
      var sum = 0, amp = .5;
      for (var o = 0; o < octaves; o++) {
        sum += amp * noise(x, y);
        var nx = 1.6 * x + 1.2 * y + 7.1; y = -1.2 * x + 1.6 * y + 3.3; x = nx; amp *= .5;
      }
      return sum;
    };
  }

  function createArtJob(width, height, recipe, seed) {
    var w = Math.max(1, Math.round(width)), h = Math.max(1, Math.round(height));
    var colors = recipe.colors.length >= 2 ? recipe.colors : ["#111111", "#eeeeee"];
    var stops = colors.map(function (c, i) { return { t: i / (colors.length - 1), c: hexToRgb(c) }; });
    var scale = recipe.scale == null ? .7 : recipe.scale, warp = recipe.warp == null ? 3 : recipe.warp;
    var gloss = recipe.gloss == null ? .4 : recipe.gloss, veins = recipe.veins || 0, streak = recipe.style === "streak";
    var fbm = makeFbm(seed * 977 + 13), r = rng(seed + 1), ox = r() * 50, oy = r() * 50;
    var angle = (recipe.angle || 0) + (r() - .5) * .5, ca = Math.cos(angle), sa = Math.sin(angle), m = Math.min(w, h);
    var gw = Math.ceil(w / 2) + 3, gh = Math.ceil(h / 2) + 3;
    var G = new Float32Array(gw * gh), GQ = new Float32Array(gw * gh), F = new Float32Array(w * h), Q = new Float32Array(w * h);
    var pixels = new Uint8ClampedArray(w * h * 4), row = 0;

    function field(gy) {
      for (var gx = 0; gx < gw; gx++) {
        var u = ((gx - 1) * 2 - w / 2) / m, v = ((gy - 1) * 2 - h / 2) / m;
        var px = (u * ca - v * sa) * scale, py = (u * sa + v * ca) * scale;
        if (streak) { px *= .14; py *= 2.2; }
        px += ox; py += oy;
        var qx = fbm(px, py, 3), qy = fbm(px + 5.2, py + 1.3, 3);
        var rx = fbm(px + warp * qx + 1.7, py + warp * qy + 9.2, 3), ry = fbm(px + warp * qx + 8.3, py + warp * qy + 2.8, 3);
        G[gy * gw + gx] = fbm(px + warp * rx, py + warp * ry, 4);
        GQ[gy * gw + gx] = Math.sqrt(qx * qx + qy * qy);
      }
    }
    function upsample() {
      var cr = function (a, b, c, d) { return (-a + 9 * b + 9 * c - d) / 16; };
      var T = new Float32Array(w * gh), x, y, c;
      for (var gy = 0; gy < gh; gy++) {
        var rr = gy * gw;
        for (x = 0; x < w; x++) { c = (x >> 1) + 1; T[gy * w + x] = x & 1 ? cr(G[rr + c - 1], G[rr + c], G[rr + c + 1], G[rr + c + 2]) : G[rr + c]; }
      }
      for (y = 0; y < h; y++) {
        c = (y >> 1) + 1;
        for (x = 0; x < w; x++) {
          F[y * w + x] = y & 1 ? cr(T[(c - 1) * w + x], T[c * w + x], T[(c + 1) * w + x], T[(c + 2) * w + x]) : T[c * w + x];
          var gx = (x >> 1) + 1, q0 = GQ[c * gw + gx];
          var qx = x & 1 ? (q0 + GQ[c * gw + gx + 1]) / 2 : q0;
          var q1 = y & 1 ? (x & 1 ? (GQ[(c + 1) * gw + gx] + GQ[(c + 1) * gw + gx + 1]) / 2 : GQ[(c + 1) * gw + gx]) : qx;
          Q[y * w + x] = (qx + q1) / 2;
        }
      }
    }
    function colorize() {
      var sample = [], stride = Math.max(1, Math.floor(F.length / 4096)), i;
      for (i = 0; i < F.length; i += stride) sample.push(F[i]);
      sample.sort(function (a, b) { return a - b; });
      var lo = sample[Math.floor(sample.length * .02)], hi = sample[Math.floor(sample.length * .98)], k = 1 / (hi - lo || 1);
      var lx = -.55, ly = -.65, lz = .52, slope = k * m * .012;
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          i = y * w + x;
          var t = (F[i] - lo) * k; t = t < 0 ? 0 : t > 1 ? 1 : t;
          var j = 1; while (j < stops.length - 1 && stops[j].t < t) j++;
          var a = stops[j - 1], b = stops[j], f = (t - a.t) / (b.t - a.t || 1);
          f = f < 0 ? 0 : f > 1 ? 1 : f; f = f * f * (3 - 2 * f);
          var gx = (F[x < w - 1 ? i + 1 : i] - F[x > 0 ? i - 1 : i]) * slope;
          var gy = (F[y < h - 1 ? i + w : i] - F[y > 0 ? i - w : i]) * slope;
          var nd = (-gx * lx - gy * ly + lz) / Math.sqrt(gx * gx + gy * gy + 1);
          var spec = Math.pow(nd > 0 ? nd : 0, 24) * gloss * 255;
          var silk = 1 + .035 * Math.sin(t * 150 + Q[i] * 24);
          var vein = veins * Math.max(0, 1 - Math.abs(Q[i] - .42) * 14) * .6;
          var lit = (.82 + .28 * nd) * silk * (1 - vein);
          pixels[i * 4] = (a.c[0] + (b.c[0] - a.c[0]) * f) * lit + spec;
          pixels[i * 4 + 1] = (a.c[1] + (b.c[1] - a.c[1]) * f) * lit + spec;
          pixels[i * 4 + 2] = (a.c[2] + (b.c[2] - a.c[2]) * f) * lit + spec;
          pixels[i * 4 + 3] = 255;
        }
      }
    }
    function step(rows) {
      if (row >= gh) return true;
      var end = Math.min(gh, row + Math.max(1, rows));
      while (row < end) field(row++);
      if (row < gh) return false;
      upsample(); colorize();
      return true;
    }
    return { width: w, height: h, pixels: pixels, step: step };
  }

  function fanSlot(index, count) { return count <= 1 ? 0 : (index / (count - 1)) * 2 - 1; }
  function recipeOf(art) { return typeof art === "string" ? ART_PRESETS[art] : art; }

  // Общая очередь отрисовки: несколько миллисекунд за кадр, без подвисаний.
  var artCache = {}, queue = [], pumping = false;
  function pump() {
    if (pumping) return;
    pumping = true;
    function tick() {
      var until = performance.now() + 7;
      while (queue.length && performance.now() < until) {
        var head = queue[0];
        if (head.job.step(4)) {
          queue.shift();
          var c = document.createElement("canvas");
          c.width = head.job.width; c.height = head.job.height;
          c.getContext("2d").putImageData(new ImageData(head.job.pixels, c.width, c.height), 0, 0);
          head.done(c);
        }
      }
      if (queue.length) requestAnimationFrame(tick); else pumping = false;
    }
    requestAnimationFrame(tick);
  }
  function paint(recipe, seed, w, h, priority) {
    var key = JSON.stringify([recipe, seed, w, h]);
    if (!artCache[key]) {
      artCache[key] = new Promise(function (done) {
        var at = queue.length;
        while (at > 1 && queue[at - 1].priority > priority) at--;
        queue.splice(at, 0, { job: createArtJob(w, h, recipe, seed), priority: priority, done: done });
        pump();
      });
    }
    return artCache[key];
  }
  function artCanvas(art, seed, w, h, density, priority, cls) {
    var cv = document.createElement("canvas");
    cv.className = cls; cv.setAttribute("aria-hidden", "true");
    cv.style.width = w + "px"; cv.style.height = h + "px"; cv.style.maxWidth = "none";
    paint(recipeOf(art), seed, Math.round(w * density), Math.round(h * density), priority).then(function (src) {
      cv.width = src.width; cv.height = src.height;
      cv.getContext("2d").drawImage(src, 0, 0);
      cv.setAttribute("data-ready", "");
    });
    return cv;
  }

  // ----------------------------------------------------------- геометрия
  var W = 340, H = 272, HEADROOM = 54, FRONT_TOP = 74, FRONT_H = H - FRONT_TOP, SHEET_W = 272, SHEET_H = 184, MAX_VISIBLE = 4;
  var BACK_PATH = "M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z";
  var FRONT_PATH = "M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 " + (FRONT_H - 22) +
    "A22 22 0 0 1 318 " + FRONT_H + "L22 " + FRONT_H + "A22 22 0 0 1 0 " + (FRONT_H - 22) + "Z";
  var SVGNS = "http://www.w3.org/2000/svg";
  var uidN = 0;

  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function svg(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function plural(n, f) {
    var a = Math.abs(n) % 100, b = a % 10;
    return n + " " + (a > 10 && a < 20 ? f[2] : b > 1 && b < 5 ? f[1] : b === 1 ? f[0] : f[2]);
  }
  function restart(node, cls) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }

  // ------------------------------------------------------------- папка
  function GlassFolder(opt) {
    var o = {
      label: "Мои файлы", meta: null, tone: "light", art: "aurora", seed: 3, files: [], action: "add",
      onAdd: null, menu: [], labelPlacement: "bottom-left", width: 340, appearDelay: 0, onFileSelect: null
    };
    for (var k in opt) o[k] = opt[k];

    var uid = "gf" + (++uidN), files = o.files.slice(), ids = files.map(function (_, i) { return i; }), nextId = files.length;
    var open = false, menuOpen = false, dropped = null, bumped = false;
    var density = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));

    var root = el("div", "gf-root", { "data-tone": o.tone, "data-place": o.labelPlacement });
    var stage = el("div", "gf-stage"); root.appendChild(stage);
    var tilt = el("div", "gf-tilt"); stage.appendChild(tilt);
    tilt.appendChild(el("div", "gf-shadow", { "aria-hidden": "true" }));

    // задняя панель с артом
    var back = el("div", "gf-back", { "aria-hidden": "true" });
    back.style.clipPath = "path('" + BACK_PATH + "')";
    if (o.art !== "none") back.appendChild(artCanvas(o.art, o.seed, W + 24, H + 24, density, 0, "gf-art"));
    back.appendChild(el("div", "gf-back-sheen"));
    tilt.appendChild(back);
    var backRim = svg("svg", { "class": "gf-rim gf-back-rim", viewBox: "0 0 " + W + " " + H, "aria-hidden": "true" });
    backRim.appendChild(svg("path", { d: BACK_PATH }));
    tilt.appendChild(backRim);

    // стеклянная передняя створка
    var front = el("div", "gf-front");
    front.style.clipPath = "path('" + FRONT_PATH + "')";
    front.appendChild(el("div", "gf-tint", { "aria-hidden": "true" }));
    front.appendChild(el("div", "gf-spec", { "aria-hidden": "true" }));
    var frontRim = svg("svg", { "class": "gf-rim gf-front-rim", viewBox: "0 0 " + W + " " + FRONT_H, "aria-hidden": "true" });
    var defs = svg("defs", {}), lg = svg("linearGradient", { id: "gf-rim-" + uid, x1: 0, y1: 0, x2: 0, y2: 1 });
    [["0", ".95"], [".35", ".35"], ["1", ".12"]].forEach(function (s) { lg.appendChild(svg("stop", { offset: s[0], "stop-color": "#fff", "stop-opacity": s[1] })); });
    defs.appendChild(lg); frontRim.appendChild(defs);
    frontRim.appendChild(svg("path", { d: FRONT_PATH, stroke: "url(#gf-rim-" + uid + ")" }));
    front.appendChild(frontRim);
    var hit = el("button", "gf-hit", { type: "button" });
    front.appendChild(hit);
    var labelBox = el("div", "gf-label"), title = el("span", "gf-title"), metaEl = el("span", "gf-meta");
    title.textContent = o.label;
    labelBox.appendChild(title); labelBox.appendChild(metaEl);
    front.appendChild(labelBox);
    tilt.appendChild(front);

    // содержимое
    var filesEl = el("div", "gf-files", { role: "list", "aria-label": "Содержимое: " + o.label });
    tilt.appendChild(filesEl);

    // клавиша + или ···
    var key = null, menuEl = null;
    if (o.action !== "none") {
      key = el("button", "gf-key gf-key--" + o.action, { type: "button" });
      if (o.action === "add") {
        key.setAttribute("aria-label", "Добавить файл в «" + o.label + "»");
        var plus = svg("svg", { "class": "gf-glyph gf-glyph--plus", viewBox: "0 0 24 24", "aria-hidden": "true" });
        plus.appendChild(svg("path", { d: "M12 4.5v15M4.5 12h15" }));
        key.appendChild(plus);
      } else {
        key.setAttribute("aria-label", "Ещё: " + o.label);
        key.setAttribute("aria-haspopup", "menu");
        key.setAttribute("aria-expanded", "false");
        key.setAttribute("aria-controls", "gf-menu-" + uid);
        var more = svg("svg", { "class": "gf-glyph gf-glyph--more", viewBox: "0 0 30 12", "aria-hidden": "true" });
        [1, 11, 21].forEach(function (x) { more.appendChild(svg("rect", { x: x, y: 1.5, width: 8, height: 9, rx: 3.4 })); });
        key.appendChild(more);
      }
      tilt.appendChild(key);
    }
    if (o.action === "more") {
      menuEl = el("div", "gf-menu", { id: "gf-menu-" + uid, role: "menu", "aria-label": "Действия: " + o.label });
      tilt.appendChild(menuEl);
    }

    // ---------------------------------------------------------- рендер
    function renderMeta() {
      var text = o.meta || plural(files.length, ["файл", "файла", "файлов"]);
      if (metaEl.textContent === text) return;
      var fresh = el("span", "gf-meta"); fresh.textContent = text;
      labelBox.replaceChild(fresh, metaEl); metaEl = fresh;
    }
    var slotEls = {}; // id → элемент: листы переживают перерисовку, как key в React
    function renderFiles() {
      var start = Math.max(0, files.length - MAX_VISIBLE), visible = files.slice(start), keep = {};
      visible.forEach(function (file, v) {
        var id = ids[start + v], slot = fanSlot(v, visible.length);
        keep[id] = true;
        var slotEl = slotEls[id];
        if (!slotEl) { slotEl = slotEls[id] = buildSheet(file, id, start + v); filesEl.appendChild(slotEl); } // новые всегда в конец
        var sheet = slotEl.firstChild;
        sheet.style.setProperty("--gf-slot", slot);
        sheet.style.setProperty("--gf-depth", visible.length - 1 - v);
        sheet.style.zIndex = v + 1;
      });
      Object.keys(slotEls).forEach(function (id) {
        if (!keep[id]) { slotEls[id].remove(); delete slotEls[id]; }
      });
    }
    function buildSheet(file, id, index) {
        var jitter = rng(hashString(file.name) + id);
        var picture = !!(file.art || file.image);
        var slotEl = el("div", "gf-sheet-slot", { role: "listitem" });
        var sheet = el(file.href ? "a" : "button", "gf-sheet" + (picture ? " gf-sheet--art" : "") + (id === dropped ? " gf-sheet--drop" : ""));
        if (file.href) sheet.href = file.href; else sheet.type = "button";
        sheet.style.setProperty("--gf-jx", ((jitter() - .5) * 10).toFixed(2) + "px");
        sheet.style.setProperty("--gf-jr", ((jitter() - .5) * 3.2).toFixed(2) + "deg");
        if (picture) {
          if (file.image) {
            var img = el("img", "gf-sheet-art", { src: file.image, alt: "", width: SHEET_W, height: SHEET_H, draggable: "false" });
            sheet.appendChild(img);
          } else {
            sheet.appendChild(artCanvas(file.art, hashString(file.name) % 997, SHEET_W, SHEET_H, Math.min(density, 1.25), 1, "gf-sheet-art"));
          }
        } else {
          var lines = el("span", "gf-lines", { "aria-hidden": "true" });
          ["86%", "92%", "64%", "88%", "42%"].forEach(function (wd) { var i = el("i"); i.style.width = wd; lines.appendChild(i); });
          sheet.appendChild(lines);
        }
        var head = el("span", "gf-sheet-head"), nm = el("span", "gf-sheet-name");
        nm.textContent = file.name; head.appendChild(nm);
        if (file.meta) { var mt = el("span", "gf-sheet-meta"); mt.textContent = file.meta; head.appendChild(mt); }
        sheet.appendChild(head);
        if (id === dropped) sheet.addEventListener("animationend", function () { dropped = null; sheet.classList.remove("gf-sheet--drop"); }, { once: true });
        sheet.addEventListener("click", function () { if (o.onFileSelect) o.onFileSelect(file, index, o.label); });
        slotEl.appendChild(sheet);
        return slotEl;
    }
    function renderMenu() {
      if (!menuEl) return;
      menuEl.innerHTML = "";
      var items = [{ label: open ? "Закрыть папку" : "Открыть папку", onSelect: function () { setOpen(!open); } }].concat(o.menu);
      items.forEach(function (item) {
        var b = el("button", "gf-menu-item" + (item.danger ? " gf-menu-item--danger" : ""), { type: "button", role: "menuitem" });
        b.textContent = item.label;
        b.disabled = !menuOpen;
        if (menuOpen) b.tabIndex = -1;
        b.addEventListener("click", function () { setMenu(false); key.focus(); if (item.onSelect) item.onSelect(); });
        menuEl.appendChild(b);
      });
    }
    function syncOpen() {
      if (open) root.setAttribute("data-open", ""); else root.removeAttribute("data-open");
      if (open) filesEl.removeAttribute("inert"); else filesEl.setAttribute("inert", "");
      hit.setAttribute("aria-expanded", String(open));
      hit.setAttribute("aria-label", (open ? "Закрыть " : "Открыть ") + o.label + ", " + plural(files.length, ["файл", "файла", "файлов"]));
      renderMenu();
    }
    function setOpen(v) { open = v; syncOpen(); }
    function setMenu(v) {
      menuOpen = v;
      if (!menuEl) return;
      if (v) menuEl.setAttribute("data-open", ""); else menuEl.removeAttribute("data-open");
      key.setAttribute("aria-expanded", String(v));
      renderMenu();
      if (v) { var f = menuEl.querySelector("[role=menuitem]"); if (f) f.focus(); }
    }

    function addFile() {
      var made = o.onAdd ? o.onAdd(files) : null;
      var file = made || { name: "Без названия " + (files.length + 1), meta: "только что" };
      files.push(file);
      var id = nextId++;
      ids.push(id);
      dropped = id;
      renderFiles(); renderMeta(); syncOpen();
      bumped = true; restart(front, "gf-front--bump");
      var g = key.querySelector(".gf-glyph--plus");
      if (g) { var c = g.cloneNode(true); key.replaceChild(c, g); }
    }

    // ---------------------------------------------------------- события
    hit.addEventListener("click", function () { setMenu(false); setOpen(!open); });
    if (key) key.addEventListener("click", function () { if (o.action === "add") addFile(); else setMenu(!menuOpen); });
    if (menuEl) menuEl.addEventListener("keydown", function (e) {
      var items = Array.prototype.slice.call(menuEl.querySelectorAll("[role=menuitem]")), at = items.indexOf(document.activeElement);
      function go(i) { e.preventDefault(); items[(i + items.length) % items.length].focus(); }
      if (e.key === "ArrowDown") go(at + 1);
      else if (e.key === "ArrowUp") go(at - 1);
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(items.length - 1);
      else if (e.key === "Tab") setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (menuOpen) { setMenu(false); key.focus(); }
      else if (open) { setOpen(false); hit.focus(); }
    });
    document.addEventListener("pointerdown", function (e) {
      var t = e.target;
      if (menuOpen && !menuEl.contains(t) && !key.contains(t)) setMenu(false);
      if (open && !menuOpen && !root.contains(t)) setOpen(false);
    });

    // свет и параллакс за курсором
    var raf = 0, px = 0, py = 0;
    function write() { raf = 0; root.style.setProperty("--gf-px", px.toFixed(3)); root.style.setProperty("--gf-py", py.toFixed(3)); }
    root.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var r = root.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width) * 2 - 1;
      py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(write);
    });
    root.addEventListener("pointerleave", function () { px = 0; py = 0; if (!raf) raf = requestAnimationFrame(write); });

    // появление при первом попадании в экран
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        if (!es.some(function (x) { return x.isIntersecting; })) return;
        io.disconnect();
        setTimeout(function () { root.setAttribute("data-entered", ""); }, o.appearDelay);
      }, { threshold: .25 });
      io.observe(root);
    } else root.setAttribute("data-entered", "");

    // размер: всё масштабируется от ширины, высота = (272 + 54) × k
    function setWidth(width) {
      var kk = width / W;
      root.style.width = width + "px";
      root.style.height = (H + HEADROOM) * kk + "px";
      stage.style.transform = "translateY(" + HEADROOM * kk + "px) scale(" + kk + ")";
    }
    setWidth(o.width);

    renderFiles(); renderMeta(); syncOpen();
    return { el: root, setWidth: setWidth };
  }

  window.GlassFolder = GlassFolder;

  // ------------------------------------------- папки на странице «Услуги»
  var desk = document.getElementById("folderDesk");
  if (!desk) return;

  function pick(file, index, folder) {
    if (window.SITE_UI && window.SITE_UI.pick) window.SITE_UI.pick(folder + " — " + file.name);
  }
  var extras = [
    { name: "Онлайн-запись", meta: "+1 000 ₽", art: "verdant" },
    { name: "Отзывы", meta: "+1 000 ₽" },
    { name: "Яндекс Карты", meta: "бесплатно", art: "glacier" },
    { name: "Квиз", meta: "+1 500 ₽" }
  ];
  function scrollTo(id) { var t = document.getElementById(id); if (t) t.scrollIntoView({ behavior: "smooth" }); }

  var folders = [
    GlassFolder({
      label: "Сайт-визитка", art: "champagne", seed: 3, appearDelay: 0, onFileSelect: pick,
      files: [
        { name: "Главный экран", meta: "от 5 000 ₽", art: "gold" },
        { name: "Прайс и услуги", meta: "HTML" },
        { name: "Фото работ", meta: "галерея", art: "steel" }
      ],
      onAdd: function (list) {
        var e = extras[(list.length - 3) % extras.length];
        return list.length - 3 < extras.length ? e : { name: "Твоя идея " + (list.length - 2), meta: "обсудим" };
      }
    }),
    GlassFolder({
      label: "Лендинг", tone: "gold", art: "none", action: "more", labelPlacement: "top-left", appearDelay: 140, onFileSelect: pick,
      files: [
        { name: "Вау-первый экран", meta: "анимации", art: "champagne" },
        { name: "Форма заявки", meta: "в мессенджер" },
        { name: "Отзывы и кейсы", meta: "доверие", art: "gold" },
        { name: "SEO", meta: "Яндекс · Google" }
      ],
      menu: [
        { label: "Посчитать цену", onSelect: function () { scrollTo("calc"); } },
        { label: "Смотреть пакеты", onSelect: function () { if (window.SITE_PLANS) window.SITE_PLANS.open("sites", "Бизнес"); else scrollTo("prices"); } },
        { label: "Заказать лендинг", onSelect: function () { pick({ name: "заказ" }, 0, "Лендинг"); } }
      ]
    }),
    GlassFolder({
      label: "Программы", meta: "по задаче", tone: "dark", art: "gold", seed: 11, action: "none", labelPlacement: "top-right",
      appearDelay: 280, onFileSelect: pick,
      files: [
        { name: "Windows-программа", meta: "EXE", art: "verdant" },
        { name: "Отчёты", meta: "XLSX · DOCX · PDF" },
        { name: "Автоматизация", meta: "Python", art: "steel" }
      ]
    })
  ];
  var cells = folders.map(function (f) {
    var cell = document.createElement("div");
    cell.className = "gf-cell";
    cell.appendChild(f.el);
    desk.appendChild(cell);
    return cell;
  });

  // ширина папки — не больше 340 px и не шире своей колонки;
  // на узком экране оставляем поля, чтобы раскрытый веер не вылезал за край
  function fit() {
    var narrow = desk.clientWidth < 420;
    folders.forEach(function (f, i) {
      var cw = Math.floor(cells[i].clientWidth);
      f.setWidth(Math.min(340, narrow ? cw - 36 : cw));
    });
  }
  fit();
  window.addEventListener("resize", fit);
})();
