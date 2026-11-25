/* =====================================================================
   3D-СТУДИЯ СБОРКИ ПК (pc.html). three.js r149 (js/vendor/three.min.js).
   Каждая деталь собирается кодом по её реальным размерам из каталога
   (1 единица сцены = 100 мм): корпус с открывающимися панелями и сеткой,
   сквозь которую видно вентиляторы; плата с сокетом, слотами и радиаторами;
   процессор; башня с теплотрубками, низкий кулер или СЖО с проложенными
   трубками к радиатору; память; видеокарта; блок питания; накопители; кабели.
   Видеокарта предельной длины упирается во фронтальные вентиляторы, кулер
   предельной высоты почти касается стекла — габариты корпуса честные.
   Управление: мышь/палец — вращать, колесо/щипок — приближать, правая кнопка
   или два пальца — сдвигать; клик по панели корпуса — открыть/закрыть.
   ===================================================================== */
(function () {
  "use strict";

  window.PC3D = { create: create };

  function create(host, opt) {
    opt = opt || {};
    var THREE = window.THREE, V3 = THREE.Vector3, PI = Math.PI;
    if (THREE.ColorManagement && "legacyMode" in THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function lerp(a, b, k) { return a + (b - a) * k; }
    function damp(c, t, s, dt) { return c + (t - c) * (1 - Math.exp(-s * dt)); }
    function ease(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
    function easeOut(k) { return 1 - Math.pow(1 - k, 3); }
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- рендер ---------- */
    var cv = document.createElement("canvas"); cv.className = "pc3d__cv"; host.appendChild(cv);
    var R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: "high-performance" });
    R.outputEncoding = THREE.sRGBEncoding; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
    R.setClearColor(0x000000, 0);
    R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
    var scene = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(32, 1, .1, 200);

    // окружение для отражений: тёмная студия с софтбоксами
    (function () {
      var env = new THREE.Scene();
      var room = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x0b0c0f, side: THREE.BackSide }));
      room.scale.set(30, 16, 30); room.position.y = 6; env.add(room);
      [[12, 3, 0, 13, 0, 0, PI / 2, 0xfff4e2, 3], [2.5, 8, -14, 5, 2, PI / 2, 0, 0xffffff, 3.2], [2.5, 8, 14, 5, -3, -PI / 2, 0, 0xcfe3ff, 2],
       [9, 2, 0, 3, -14, 0, 0, 0xffffff, 1.1], [9, 2, 0, 4, 14, PI, 0, 0xffffff, 1.4]].forEach(function (p) {
        var m = new THREE.Mesh(new THREE.PlaneGeometry(p[0], p[1]), new THREE.MeshBasicMaterial({ color: new THREE.Color(p[7]).multiplyScalar(p[8]) }));
        m.position.set(p[2], p[3], p[4]); m.rotation.set(p[6], p[5], 0); env.add(m);
      });
      var pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromScene(env, .04).texture; pm.dispose();
    })();
    scene.add(new THREE.HemisphereLight(0xdfe6f0, 0x1a1b1f, .55));
    var key = new THREE.DirectionalLight(0xfff1de, 2.0); key.position.set(-6, 11, 7); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -9; key.shadow.camera.right = 9; key.shadow.camera.top = 9; key.shadow.camera.bottom = -9;
    key.shadow.camera.near = 1; key.shadow.camera.far = 40; key.shadow.bias = -.0006; key.shadow.normalBias = .02; scene.add(key);
    var rimA = new THREE.DirectionalLight(0x8fb8ff, .9); rimA.position.set(-8, 5, -9); scene.add(rimA);
    var rimB = new THREE.DirectionalLight(0xf0cd73, .55); rimB.position.set(9, 4, -6); scene.add(rimB);
    var inLight = new THREE.PointLight(0xfff3e0, 1.3, 8, 1.6); scene.add(inLight);       // мягкий свет внутри корпуса (при включении — цветной)

    /* ---------- текстуры ---------- */
    function ctex(w, h, draw, rep) {
      var c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
      var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = R.capabilities.getMaxAnisotropy ? Math.min(8, R.capabilities.getMaxAnisotropy()) : 4;
      if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
      return t;
    }
    function rrect(x, X, Y, W, H, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath(); }
    // сетка: белое — металл, чёрное — отверстия (alphaMap)
    var meshAlpha = ctex(128, 128, function (x, w) {
      x.fillStyle = "#fff"; x.fillRect(0, 0, w, w); x.fillStyle = "#000";
      var r = 9, dx = 32, dy = 27.7;
      for (var j = -1; j < 6; j++) for (var i = -1; i < 6; i++) {
        var cx = i * dx + (j % 2 ? dx / 2 : 0), cy = j * dy;
        x.beginPath(); for (var k = 0; k < 6; k++) { var a = PI / 6 + k * PI / 3; x.lineTo(cx + Math.cos(a) * r * 1.35, cy + Math.sin(a) * r * 1.35); } x.closePath(); x.fill();
      }
    }, true);
    meshAlpha.encoding = THREE.LinearEncoding;
    var finTex = ctex(64, 256, function (x, w, h) {
      x.fillStyle = "#9aa1ab"; x.fillRect(0, 0, w, h);
      for (var i = 0; i < h; i += 4) { x.fillStyle = i % 8 ? "#5c6269" : "#c9ced6"; x.fillRect(0, i, w, 1.6); }
    }, true);
    var woodTex = ctex(256, 256, function (x, w, h) {
      for (var i = 0; i < 16; i++) {
        var g = x.createLinearGradient(i * 16, 0, i * 16 + 14, 0); g.addColorStop(0, "#6b4426"); g.addColorStop(.5, "#9a6a3f"); g.addColorStop(1, "#5e3b20");
        x.fillStyle = g; x.fillRect(i * 16, 0, 13, h); x.fillStyle = "#120c08"; x.fillRect(i * 16 + 13, 0, 3, h);
      }
      x.globalAlpha = .18; x.strokeStyle = "#2b1a0e"; for (var k = 0; k < 60; k++) { x.beginPath(); var xx = Math.random() * w; x.moveTo(xx, 0); x.bezierCurveTo(xx + 4, h * .3, xx - 4, h * .6, xx + 2, h); x.stroke(); }
    }, true);
    function pcbTex(ff) {
      return ctex(512, 640, function (x, w, h) {
        x.fillStyle = "#15181d"; x.fillRect(0, 0, w, h);
        x.strokeStyle = "rgba(120,140,160,.16)"; x.lineWidth = 2;
        for (var i = 0; i < 70; i++) {
          var sx = Math.random() * w, sy = Math.random() * h, len = 30 + Math.random() * 140;
          x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + len, sy); x.lineTo(sx + len + 20, sy + 20); x.stroke();
        }
        x.fillStyle = "rgba(212,168,75,.55)";
        for (var k = 0; k < 40; k++) x.fillRect(Math.random() * w, Math.random() * h, 3, 3);
        x.fillStyle = "rgba(255,255,255,.18)"; x.font = "600 18px Consolas, monospace"; x.fillText(ff + " · PCIe · DDR", 30, h - 30);
      });
    }
    function labelTex(lines, o) {
      o = o || {};
      return ctex(o.w || 512, o.h || 128, function (x, w, h) {
        if (o.bg) { x.fillStyle = o.bg; x.fillRect(0, 0, w, h); } else x.clearRect(0, 0, w, h);
        x.textAlign = o.align || "center"; x.textBaseline = "middle";
        lines.forEach(function (l, i) {
          x.fillStyle = l.c || "#fff"; x.font = (l.wt || 800) + " " + (l.s || 48) + "px Manrope, 'Segoe UI', sans-serif";
          x.fillText(l.t, o.align === "left" ? 24 : w / 2, h * (l.y != null ? l.y : (i + 1) / (lines.length + 1)));
        });
      });
    }

    /* ---------- материалы ---------- */
    var M = {
      dark: new THREE.MeshStandardMaterial({ color: 0x101114, metalness: .5, roughness: .45 }),
      black: new THREE.MeshStandardMaterial({ color: 0x0b0c0e, metalness: .3, roughness: .55 }),
      sink: new THREE.MeshStandardMaterial({ color: 0x2b2f36, metalness: .75, roughness: .35 }),
      alu: new THREE.MeshStandardMaterial({ color: 0xbfc4cc, metalness: .95, roughness: .28 }),
      copper: new THREE.MeshStandardMaterial({ color: 0xc27b45, metalness: 1, roughness: .28 }),
      nickel: new THREE.MeshStandardMaterial({ color: 0xd6d9de, metalness: 1, roughness: .18 }),
      rubber: new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0, roughness: .8 }),
      sleeve: new THREE.MeshStandardMaterial({ color: 0x1a1b1f, metalness: .1, roughness: .7 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xd4a84b, metalness: 1, roughness: .3 }),
      slot: new THREE.MeshStandardMaterial({ color: 0x24272d, metalness: .2, roughness: .6 }),
      fins: new THREE.MeshStandardMaterial({ map: finTex, metalness: .8, roughness: .35 }),
      glass: new THREE.MeshPhysicalMaterial({ color: 0x1b2430, metalness: .1, roughness: .04, transparent: true, opacity: .14, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide }),
      ghost: new THREE.MeshBasicMaterial({ color: 0xff4b40, transparent: true, opacity: .38, depthWrite: false })
    };
    function steel(col) { return col === "white" ? new THREE.MeshStandardMaterial({ color: 0xe9ebef, metalness: .25, roughness: .5 }) : new THREE.MeshStandardMaterial({ color: 0x202329, metalness: .6, roughness: .38 }); }
    var RGB = [], noRGB = false;                    // материалы подсветки (оживают при включении)
    function rgbMat(hue) {
      var m = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(hue || 0, .9, .55), toneMapped: false });
      m.userData.hue = hue || 0; m.userData.on = 0; if (!noRGB) RGB.push(m); return m;
    }

    /* ---------- геометрия-помощники ---------- */
    function box(w, h, d, mat, x, y, z, parent) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(m); return m; }
    function rbox(w, h, d, r, mat) {
      var s = new THREE.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2);
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      var b = Math.min(r * .5, d * .3), g = new THREE.ExtrudeGeometry(s, { depth: Math.max(.001, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b * .8, bevelSegments: 2, curveSegments: 6 });
      g.center(); return new THREE.Mesh(g, mat);
    }
    function cyl(r, h, mat, seg) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg || 24), mat); }
    function tube(pts, r, mat) { return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(20, pts.length * 12), r, 10, false), mat); }
    function shadows(g, on) { g.traverse(function (o) { if (o.isMesh && o.material !== M.glass && !(o.material && o.material.transparent)) { o.castShadow = on !== false; o.receiveShadow = true; } }); }

    /* ---------- вентилятор: рамка, лопасти, ступица, ARGB-кольцо. Ось — +Z ---------- */
    var fanGeo = {};
    function fan(size, opts) {
      opts = opts || {};
      var s = size / 100, key2 = s.toFixed(2);
      if (!fanGeo[key2]) {
        var h = s / 2, r = h * .16, sh = new THREE.Shape();
        sh.moveTo(-h + r, -h); sh.lineTo(h - r, -h); sh.quadraticCurveTo(h, -h, h, -h + r); sh.lineTo(h, h - r); sh.quadraticCurveTo(h, h, h - r, h);
        sh.lineTo(-h + r, h); sh.quadraticCurveTo(-h, h, -h, h - r); sh.lineTo(-h, -h + r); sh.quadraticCurveTo(-h, -h, -h + r, -h);
        var hole = new THREE.Path(); hole.absarc(0, 0, h * .93, 0, PI * 2, true); sh.holes.push(hole);
        var fg = new THREE.ExtrudeGeometry(sh, { depth: .25, bevelEnabled: false, curveSegments: 28 }); fg.translate(0, 0, -.125);
        var bl = new THREE.BoxGeometry(h * .7, h * .38, .012); bl.translate(h * .52, 0, 0);
        fanGeo[key2] = { frame: fg, blade: bl, hub: new THREE.CylinderGeometry(h * .3, h * .3, .14, 28), ring: new THREE.TorusGeometry(h * .94, .018, 8, 48) };
      }
      var G = fanGeo[key2], g = new THREE.Group();
      g.add(new THREE.Mesh(G.frame, opts.mat || M.black));
      var rot = new THREE.Group(); g.add(rot);
      var hubM = opts.white ? M.alu : M.dark;
      var hub = new THREE.Mesh(G.hub, hubM); hub.rotation.x = PI / 2; rot.add(hub);
      for (var i = 0; i < 7; i++) { var b = new THREE.Mesh(G.blade, opts.white ? new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: .4, transparent: !!opts.rgb, opacity: opts.rgb ? .85 : 1 }) : M.black); b.rotation.z = i * PI * 2 / 7; b.rotation.x = .45; rot.add(b); }
      if (opts.rgb) { var ring = new THREE.Mesh(G.ring, rgbMat(opts.hue || 0)); ring.position.z = .1; g.add(ring); }
      g.userData.rot = rot; g.userData.fan = true;
      return g;
    }

    /* ---------- сцена: подиум ---------- */
    var world = new THREE.Group(); scene.add(world);
    (function () {
      var plat = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.4, .22, 96), new THREE.MeshStandardMaterial({ color: 0x0d0e11, metalness: .5, roughness: .4 }));
      plat.position.y = -.11; plat.receiveShadow = true; world.add(plat);
      var top = new THREE.Mesh(new THREE.CircleGeometry(6.15, 96), new THREE.MeshStandardMaterial({ color: 0x0f1012, metalness: .2, roughness: .6, envMapIntensity: .35 }));
      top.rotation.x = -PI / 2; top.position.y = .002; top.receiveShadow = true; world.add(top);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(6.22, .03, 8, 160), new THREE.MeshBasicMaterial({ color: 0xd4a84b, toneMapped: false }));
      ring.rotation.x = PI / 2; ring.position.y = .005; world.add(ring);
      var ring2 = new THREE.Mesh(new THREE.RingGeometry(4.6, 4.63, 128), new THREE.MeshBasicMaterial({ color: 0x3a3f48, transparent: true, opacity: .6 }));
      ring2.rotation.x = -PI / 2; ring2.position.y = .004; world.add(ring2);
      var sh = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: .5 }));
      sh.rotation.x = -PI / 2; sh.position.y = .006; sh.receiveShadow = true; world.add(sh);
    })();
    var rig = new THREE.Group(); world.add(rig);          // всё, что на подиуме (корпус, детали, монитор)

    /* ---------- состояние сборки ---------- */
    var B = {};                                     // текущие данные: case, mb, cpu, cooler, ram, gpu, psu, ssd
    var P = {};                                     // 3D-группы деталей
    var C = null;                                   // геометрия корпуса (габариты, точки крепления)
    var panels = {};                                // открывающиеся панели
    var fans = [];                                  // вращающиеся вентиляторы
    var powered = 0, powerK = 0;
    var tweens = [];
    function tween(dur, fn, done, ez) { var t = { t: 0, dur: dur, fn: fn, done: done, ez: ez || ease }; tweens.push(t); return t; }

    /* ---------- корпус ---------- */
    function buildCase(c) {
      var W = c.dim[0] / 100, H = c.dim[1] / 100, D = c.dim[2] / 100, FEET = .12, T = .04;
      var g = new THREE.Group(), body = new THREE.Group(); g.add(body); body.position.y = FEET;
      var st = steel(c.col), inner = c.col === "white" ? new THREE.MeshStandardMaterial({ color: 0xdfe2e7, metalness: .2, roughness: .6 }) : new THREE.MeshStandardMaterial({ color: 0x121317, metalness: .45, roughness: .5 });
      var dual = c.front === "glass" && !c.rf;                     // панорамный двухкамерный: БП за поддоном
      var small = H < 3.2;
      // поддон платы: лицо поддона так, чтобы предельный кулер почти касался стекла
      var mbFace = clamp(-W / 2 + T + c.cool / 100 + .12, -W / 2 + 1.0, W / 2 - (dual ? 1.0 : .22));
      var info = { W: W, H: H, D: D, FEET: FEET, T: T, st: st, dual: dual, small: small, mbFace: mbFace, floor: FEET + T };
      // каркас: дно, крыша (рамка), задняя стенка, поддон, правая стенка
      box(W, T, D, st, 0, T / 2, 0, body);
      [[W, .1, T, 0, H - .05, -D / 2 + T / 2], [W, .1, T, 0, H - .05, D / 2 - T / 2], [T, .1, D, -W / 2 + T / 2, H - .05, 0], [T, .1, D, W / 2 - T / 2, H - .05, 0],
       [T, H, T, -W / 2 + T / 2, H / 2, D / 2 - T / 2], [T, H, T, -W / 2 + T / 2, H / 2, -D / 2 + T / 2], [T, H, T, W / 2 - T / 2, H / 2, D / 2 - T / 2], [T, H, T, W / 2 - T / 2, H / 2, -D / 2 + T / 2]]
        .forEach(function (b) { box(b[0], b[1], b[2], st, b[3], b[4], b[5], body); });
      var tray = box(.03, H - T * 2, D - T * 2, inner, mbFace + .085, H / 2, 0, body);
      // задняя стенка: прорезь под I/O, слоты расширения
      var rear = new THREE.Group(); rear.position.set(0, 0, -D / 2 + T / 2); body.add(rear);
      box(W - T * 2, H - T * 2, .02, inner, 0, H / 2, 0, rear);
      var io = box(.2, 1.6, .03, M.black, mbFace - .14, H - .3 - .85, -.01, rear);
      for (var i = 0; i < (small ? 2 : 7); i++) box(.06, .16, .03, M.alu, mbFace - .6, H - .3 - 1.62 - i * .2 + .08, -.012, rear);
      info.rear = rear;
      // кожух блока питания
      var shroudH = small || dual ? 0 : .95;
      if (shroudH) {
        var sw = W - T * 2, sd = D - T * 2 - (c.rf ? .62 : .1);
        var sh = rbox(sw, shroudH, sd, .03, st); sh.position.set(0, T + shroudH / 2, -D / 2 + T + sd / 2); body.add(sh);
        var vent = box(sw * .5, .005, sd * .3, M.black, -sw * .1, T + shroudH + .003, -D / 2 + T + sd * .7, body);
        info.shroud = sh; info.shroudTop = T + shroudH; info.shroudEnd = -D / 2 + T + sd;
      } else { info.shroudTop = T; info.shroudEnd = -D / 2; }
      info.shroudH = shroudH;
      // ножки
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(function (s) { var f = cyl(.13, FEET, M.rubber, 20); f.position.set(s[0] * (W / 2 - .3), FEET / 2, s[1] * (D / 2 - .4)); g.add(f); });
      // кнопка питания и разъёмы сверху спереди
      var pwr = cyl(.07, .03, M.dark, 24); pwr.position.set(-W / 2 + .45, H + .015, D / 2 - .35); body.add(pwr);
      var led = new THREE.Mesh(new THREE.TorusGeometry(.075, .012, 6, 28), rgbMat(.12)); led.rotation.x = PI / 2; led.position.copy(pwr.position); led.position.y += .02; body.add(led);
      led.material.userData.fixed = 0xf0cd73; info.led = led;
      for (var u = 0; u < 2; u++) box(.15, .02, .06, M.black, -W / 2 + .8 + u * .25, H + .01, D / 2 - .35, body);

      /* ---- панели (каждая со своим шарниром) ---- */
      // стекло слева (−x): шарнир у задней кромки
      var gp = new THREE.Group(); gp.position.set(-W / 2, 0, -D / 2); body.add(gp);
      var gMesh = box(.02, H - .02, D - .02, c.glass ? M.glass : st, -.01, H / 2, D / 2, gp);
      if (c.glass) {
        [[.025, .1, D - .04, H - .07], [.025, .1, D - .04, .07], [.025, H - .2, .1, 0]].forEach(function (f, i) {
          box(f[0], f[1], f[2], M.black, -.012, f[3], i < 2 ? D / 2 : .07, gp);
        });
      }
      panels.glass = { g: gp, open: 0, k: 0, hinge: "rear", glass: !!c.glass, name: c.glass ? "Стекло" : "Левая крышка" };
      // правая крышка (+x)
      var rp = new THREE.Group(); rp.position.set(W / 2, 0, -D / 2); body.add(rp);
      box(.02, H - .02, D - .02, st, .01, H / 2, D / 2, rp);
      panels.right = { g: rp, open: 0, k: 0, hinge: "slide", name: "Правая крышка" };
      // фронт: шарнир у левой передней кромки
      var fp = new THREE.Group(); fp.position.set(-W / 2, 0, D / 2); body.add(fp);
      var fmat;
      if (c.front === "mesh") fmat = new THREE.MeshStandardMaterial({ color: c.col === "white" ? 0xe6e8ec : 0x16181c, metalness: .5, roughness: .45, alphaMap: meshAlpha.clone(), alphaTest: .5, side: THREE.DoubleSide });
      else if (c.front === "glass") fmat = M.glass;
      else if (c.front === "wood") fmat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: .7, metalness: 0 });
      else fmat = st;
      if (fmat.alphaMap) { fmat.alphaMap.needsUpdate = true; fmat.alphaMap.repeat.set(W * 3.2, H * 3.2); }
      var fmesh = box(W - .02, H - .02, .03, fmat, W / 2, H / 2, .02, fp);
      if (c.front === "mesh" || c.front === "wood") { box(.06, H - .02, .05, st, .03, H / 2, .02, fp); box(.06, H - .02, .05, st, W - .03, H / 2, .02, fp); }
      if (c.front === "wood") { box(W - .02, H * .5, .02, new THREE.MeshStandardMaterial({ color: 0x0f1012, metalness: .3, roughness: .6, alphaMap: meshAlpha.clone(), alphaTest: .5 }), W / 2, H / 2, -.01, fp); }
      if (c.front === "solid" && c.rgb) { var strip = box(.04, H * .7, .01, rgbMat(.6), W / 2, H / 2, .04, fp); }
      panels.front = { g: fp, open: 0, k: 0, hinge: "door", name: "Фронт" };
      // крыша: шарнир у задней кромки
      var tp = new THREE.Group(); tp.position.set(0, H, -D / 2); body.add(tp);
      var tmat = new THREE.MeshStandardMaterial({ color: c.col === "white" ? 0xe6e8ec : 0x16181c, metalness: .5, roughness: .45, alphaMap: meshAlpha.clone(), alphaTest: .5, side: THREE.DoubleSide });
      tmat.alphaMap.needsUpdate = true; tmat.alphaMap.repeat.set(W * 3.2, D * 3.2);
      box(W - .02, .02, D - .02, tmat, 0, .01, D / 2, tp);
      box(W - .02, .025, .1, st, 0, .012, D - .06, tp); box(W - .02, .025, .1, st, 0, .012, .06, tp);
      panels.top = { g: tp, open: 0, k: 0, hinge: "lid", name: "Крыша" };

      /* ---- вентиляторы из комплекта ---- */
      var spec = (c.fans || "").split(",").filter(Boolean).map(function (s) { var m = s.match(/(\d+)x(\d+)([frtb])/); return m ? { n: +m[1], s: +m[2], at: m[3] } : null; }).filter(Boolean);
      info.fanZ = clamp(-D / 2 + T + .07 + c.gpu / 100 + .14, -D / 2 + 2, D / 2 - .2);   // плоскость фронтальных вентиляторов
      var hue = 0;
      spec.forEach(function (f) {
        var s = f.s / 100;
        for (var k = 0; k < f.n; k++) {
          var fn = fan(f.s, { rgb: !!c.rgb, hue: (hue += .17) % 1, white: c.col === "white" });
          if (f.at === "f") { fn.position.set(lerp(-W / 2, mbFace, .5) + .1, H - .25 - s / 2 - k * (s + .03), info.fanZ); }
          else if (f.at === "r") { fn.position.set(mbFace - .75, H - .3 - .1 - s / 2, -D / 2 + T + .16); }
          else if (f.at === "t") { fn.rotation.x = PI / 2; fn.position.set(mbFace - .9, H - .2, -D / 2 + .5 + s / 2 + k * (s + .03)); }
          else { fn.rotation.x = -PI / 2; fn.position.set(lerp(-W / 2, mbFace, .5) + .1, T + .14, -D / 2 + .55 + s / 2 + k * (s + .03)); }
          body.add(fn); fans.push(fn);
        }
      });
      shadows(g);
      g.userData.info = info;
      return g;
    }

    /* ---------- материнская плата ---------- */
    var FF = { E: [3.3, 3.05], A: [2.44, 3.05], M: [2.44, 2.44], I: [1.7, 1.7] };      // ширина (по z) × высота (по y)
    function mbLayout(mb) {
      var f = FF[mb.ff] || FF.A, I = mb.ff === "I";
      return { w: f[0], h: f[1], sock: I ? [.78, .62] : [1.05, .95], ramU: I ? [1.36, 1.48] : [1.72, 1.82, 1.95, 2.05].slice(0, mb.ms === 2 ? 2 : 4), ramV: [.22, 1.55],
        pcieV: I ? 1.42 : mb.ff === "M" ? 1.42 : 1.6, m2: [I ? .7 : .7, I ? 1.18 : 1.3], i24: [f[0] - .1, .85] };
    }
    function buildMB(mb) {
      var L = mbLayout(mb), g = new THREE.Group();
      // Система платы: начало — верхний задний угол лицевой стороны; u — к фронту (+z), v — вниз (−y), «глубина» — к стеклу (−x)
      function at(o, u, v, d) { o.position.set(-d, -v, u); g.add(o); return o; }
      var pcb = new THREE.Mesh(new THREE.BoxGeometry(.016, L.h, L.w), [M.black, new THREE.MeshStandardMaterial({ map: pcbTex(mb.ff), metalness: .3, roughness: .6 }), M.black, M.black, M.black, M.black]);
      at(pcb, L.w / 2, L.h / 2, -.008);
      var acc = /X870|Z890|X870E/.test(mb.ch) ? M.gold : /B850|B650|B760|Z790|B860/.test(mb.ch) ? M.alu : M.sink;
      // кожух I/O и радиаторы VRM
      var ioc = rbox(.34, 1.55, .32, .04, M.dark); ioc.rotation.y = PI / 2; at(ioc, .19, .85, .17);
      var strip = box(.01, 1.3, .03, acc, 0, 0, 0); at(strip, .34, .85, .34);
      if (mb.ff !== "I") {
        var v1 = rbox(.3, .32, 1.1, .03, M.sink); at(v1, .95, .2, .15);
        var v2 = rbox(.3, .9, .3, .03, M.sink); at(v2, .55, .85, .15);
      }
      // сокет
      var sf = box(.05, .55, .55, M.slot, 0, 0, 0); at(sf, L.sock[0], L.sock[1], .025);
      var sp = box(.02, .45, .45, M.alu, 0, 0, 0); at(sp, L.sock[0], L.sock[1], .05);
      // слоты памяти
      L.ramU.forEach(function (u, i) { var s = box(.09, L.ramV[1] - L.ramV[0], .055, i % 2 ? M.slot : M.dark, 0, 0, 0); at(s, u, (L.ramV[0] + L.ramV[1]) / 2, .045); });
      // PCIe x16 (+ дополнительные слоты на ATX)
      var pcie = box(.11, .07, .9, M.slot, 0, 0, 0); at(pcie, .55, L.pcieV, .055);
      var latch = box(.11, .07, .08, M.alu, 0, 0, 0); at(latch, 1.04, L.pcieV, .055);
      if (mb.ff === "A" || mb.ff === "E") { [.8, 1.2].forEach(function (dv) { var s2 = box(.08, .05, dv > 1 ? .9 : .4, M.slot, 0, 0, 0); at(s2, dv > 1 ? .55 : .3, L.pcieV + dv, .04); }); }
      // M.2, чипсет, 24-pin
      var m2 = rbox(.04, .14, .85, .02, M.sink); at(m2, L.m2[0] + .45, L.m2[1], .03);
      var chip = rbox(.08, .5, .6, .04, acc === M.gold ? M.gold : M.sink); at(chip, L.w - .45, L.h - .45, .05);
      var c24 = box(.1, .5, .08, M.black, 0, 0, 0); at(c24, L.i24[0], L.i24[1], .05);
      var eps = box(.1, .08, .2, M.black, 0, 0, 0); at(eps, .45, .06, .05);
      shadows(g);
      g.userData.L = L;
      return g;
    }

    /* ---------- процессор ---------- */
    function buildCPU(cpu) {
      var g = new THREE.Group(), amd = cpu.b === "AMD";
      var ihs = rbox(.38, amd ? .38 : .34, .05, .03, M.nickel); ihs.rotation.y = PI / 2; ihs.position.x = -.03; g.add(ihs);
      var lab = new THREE.Mesh(new THREE.PlaneGeometry(.3, .1), new THREE.MeshBasicMaterial({ map: labelTex([{ t: amd ? "RYZEN" : "INTEL CORE", s: 56, c: "#2a2d33" }], { w: 512, h: 160 }), transparent: true }));
      lab.rotation.y = -PI / 2; lab.position.set(-.058, .02, 0); g.add(lab);
      shadows(g); return g;
    }

    /* ---------- охлаждение ---------- */
    function buildCooler(cl) {
      var g = new THREE.Group();
      if (cl.k === "tower") {
        var hh = cl.h / 100, dual = cl.fans >= 2 && cl.n.indexOf("Freezer") < 0, stacks = dual ? [-.34, .34] : [0], depth = dual ? .45 : .5;
        // основание и теплотрубки
        var base = box(.12, .42, .42, M.nickel, -.06, 0, 0, g);
        var nPipes = cl.tdp > 200 ? 6 : 4;
        for (var i = 0; i < nPipes; i++) {
          var zz = (i - (nPipes - 1) / 2) * .07;
          stacks.forEach(function (sz) {
            g.add(tube([new V3(-.1, -.05, zz * .6), new V3(-.25, -.05, zz * .6 + sz * .3), new V3(-.45, -.05 - (i % 2) * .02, sz + zz * .4), new V3(-hh + .1, -.05, sz + zz * .4)], .03, M.copper));
          });
        }
        stacks.forEach(function (sz) {
          var fin = box(hh - .3, 1.22, depth, M.fins, -(hh + .3) / 2, .05, sz, g);
          fin.material = M.fins;
          var cap = rbox(hh - .28, .06, depth + .02, .02, M.dark); cap.position.set(-(hh + .3) / 2, .69, sz); g.add(cap);
        });
        // вентиляторы: спереди стопки (+z), у двухбашенных — ещё между
        var fz = dual ? [.34 + depth / 2 + .13, 0] : [depth / 2 + .13];
        fz.forEach(function (z, i) { var f = fan(120, { rgb: !!cl.rgb, hue: .55 + i * .2 }); f.position.set(-(hh + .3) / 2, .05, z); g.add(f); fans.push(f); });
        var plate = new THREE.Mesh(new THREE.PlaneGeometry(hh - .45, .22), new THREE.MeshBasicMaterial({ map: labelTex([{ t: cl.b, s: 60, c: "#e9ebee" }], { w: 512, h: 128, bg: "#0d0e11" }) }));
        plate.rotation.x = -PI / 2; plate.rotation.z = PI / 2; plate.position.set(-(hh + .3) / 2, .725, stacks[0]); g.add(plate);
      } else if (cl.k === "low") {
        var h2 = cl.h / 100;
        var sink = box(h2 - .15, .95, .95, M.fins, -(h2 - .15) / 2, 0, 0, g);
        var f2 = fan(92, { rgb: 0 }); f2.rotation.y = PI / 2; f2.scale.z = .6; f2.position.x = -h2 + .08; g.add(f2); fans.push(f2);
      } else {
        // помпа на процессоре
        var pump = cyl(.34, .42, M.dark, 40); pump.rotation.z = PI / 2; pump.position.x = -.21; g.add(pump);
        var capM = cl.n.indexOf("Kraken") >= 0 ? new THREE.MeshBasicMaterial({ map: labelTex([{ t: "62°C", s: 120, c: "#f0cd73" }], { w: 256, h: 256, bg: "#07080a" }), toneMapped: false }) : rgbMat(.58);
        var cap2 = new THREE.Mesh(new THREE.CircleGeometry(.29, 40), capM); cap2.rotation.y = -PI / 2; cap2.position.x = -.425; g.add(cap2);
        var ringP = new THREE.Mesh(new THREE.TorusGeometry(.32, .025, 8, 40), cl.rgb ? rgbMat(.1) : M.alu); ringP.rotation.y = PI / 2; ringP.position.x = -.42; g.add(ringP);
        g.userData.aio = true;
      }
      shadows(g);
      return g;
    }
    // радиатор СЖО и трубки (живут в системе корпуса)
    function buildRadiator(cl, where, info, pumpW) {
      var g = new THREE.Group(), n = cl.r / (cl.r === 280 ? 140 : 120), fs = cl.r === 280 ? 140 : 120, L = cl.r / 100 + .36, wdt = fs / 100 + .04;
      var core = box(.27, wdt, cl.r / 100, M.fins, 0, 0, 0, g);
      [-1, 1].forEach(function (s) { box(.32, wdt + .02, .18, M.dark, 0, 0, s * (cl.r / 200 + .09), g); });
      for (var i = 0; i < n; i++) { var f = fan(fs, { rgb: !!cl.rgb, hue: .5 + i * .15 }); f.rotation.y = PI / 2; f.position.set(-.26, 0, (i - (n - 1) / 2) * (fs / 100 + .01)); g.add(f); fans.push(f); }
      var W = info.W, H = info.H, D = info.D, port;
      if (where === "top") {
        g.rotation.z = PI / 2;                              // плашмя под крышей, вентиляторы вниз
        g.position.set(clamp(info.mbFace - 1.05, -W / 2 + wdt / 2 + .08, W / 2), info.FEET + H - .22, -D / 2 + .35 + L / 2);
        port = new V3(g.position.x, g.position.y - .15, g.position.z - L / 2 + .12);
      } else {
        g.rotation.y = -PI / 2;                             // вертикально за фронтом
        g.position.set(lerp(-W / 2, info.mbFace, .5) + .05, info.FEET + H - .25 - L / 2, D / 2 - .35);
        port = new V3(g.position.x + .05, g.position.y + L / 2 - .12, g.position.z - .15);
      }
      // трубки: от помпы к стеклу, потом плавно к штуцерам радиатора
      var tubes = new THREE.Group();
      [-.09, .09].forEach(function (o, i) {
        var a = pumpW.clone().add(new V3(-.1, o, 0)), b = port.clone().add(new V3(0, 0, o * 1.6));
        var mid1 = a.clone().add(new V3(-.55, .35 + i * .08, 0)), mid2 = new V3(lerp(a.x, b.x, .5) - .3, lerp(a.y, b.y, .7) + .25, lerp(a.z, b.z, .6));
        tubes.add(tube([a, mid1, mid2, b], .06, M.sleeve));
      });
      shadows(g); shadows(tubes);
      return { rad: g, tubes: tubes };
    }

    /* ---------- память ---------- */
    var RAM_COL = { Kingston: 0x1a1b1f, "G.Skill": 0x2b2e34, Corsair: 0x101113, TeamGroup: 0x23262c, ADATA: 0x18191d, Netac: 0x1f3a5a };
    function buildRAMStick(r) {
      var g = new THREE.Group(), hh = (r.h || 34) / 100;
      var body = rbox(1.33, hh, .07, .02, new THREE.MeshStandardMaterial({ color: RAM_COL[r.b] || 0x1a1b1f, metalness: .7, roughness: .35 }));
      body.rotation.set(0, 0, PI / 2); body.position.x = -hh / 2; g.add(body);
      var lab = new THREE.Mesh(new THREE.PlaneGeometry(.9, hh * .45), new THREE.MeshBasicMaterial({ map: labelTex([{ t: r.b.toUpperCase(), s: 64, c: "#e9ebee" }], { w: 512, h: 128 }), transparent: true }));
      lab.rotation.set(0, 0, PI / 2); lab.position.set(-hh / 2, 0, .037); g.add(lab);
      if (r.rgb) { var bar = box(.07, 1.2, .06, rgbMat(.8), -hh - .03, 0, 0, g); }
      else { box(.02, 1.25, .072, M.alu, -hh, 0, 0, g); }
      shadows(g); return g;
    }

    /* ---------- видеокарта ---------- */
    function buildGPU(gp) {
      var g = new THREE.Group(), L = gp.len / 100, T2 = gp.sl * .2, Hc = gp.len > 300 ? 1.38 : 1.25;
      var white = gp.col === "white", nv = /RTX|GTX/.test(gp.chip), amd = /RX/.test(gp.chip);
      var shellM = white ? new THREE.MeshStandardMaterial({ color: 0xeef0f3, metalness: .3, roughness: .45 }) : new THREE.MeshStandardMaterial({ color: 0x1a1c21, metalness: .55, roughness: .4 });
      // корпус карты: длина по +z от кронштейна, «высота» — к стеклу (−x), толщина — вниз (−y)
      var sh = rbox(L, T2, Hc, .06, shellM); sh.rotation.y = PI / 2; sh.position.set(-Hc / 2, -T2 / 2, L / 2); g.add(sh);
      var bp = box(Hc - .04, .02, L - .02, white ? M.alu : M.sink, -Hc / 2, .01, L / 2, g);       // бэкплейт сверху
      // торец к стеклу: надпись (светится при включении)
      var edge = new THREE.Mesh(new THREE.PlaneGeometry(L * .62, T2 * .42), new THREE.MeshBasicMaterial({ map: labelTex([{ t: nv ? "GEFORCE RTX" : amd ? "RADEON" : "INTEL ARC", s: 70, c: white ? "#20232a" : "#e9ebee" }], { w: 768, h: 128 }), transparent: true, toneMapped: false }));
      edge.rotation.y = -PI / 2; edge.position.set(-Hc - .005, -T2 / 2, L * .55); g.add(edge); g.userData.edge = edge;
      var acc = box(.012, .05, L * .7, rgbMat(nv ? .33 : amd ? 0 : .6), -Hc - .006, -T2 * .85, L * .5, g);
      // вентиляторы снизу
      var n = gp.fans || 2, fsz = Math.min(.92, (L - .2) / n) * 100;
      for (var i = 0; i < n; i++) { var f = fan(fsz, { white: white }); f.rotation.x = PI / 2; f.position.set(-Hc / 2, -T2 - .02, .15 + (i + .5) * (L - .3) / n); f.scale.z = .5; g.add(f); fans.push(f); }
      // кронштейн и разъём питания
      box(.02, T2 + .25, Hc * .9, M.alu, -Hc / 2, -T2 / 2 + .1, -.02, g).rotation.y = PI / 2;
      var pin = box(.12, .05, .2, M.black, -Hc + .12, .02, L * .6, g);
      g.userData.pin = new V3(-Hc + .12, .05, L * .6);
      g.userData.L = L; g.userData.T = T2; g.userData.H = Hc;
      shadows(g); return g;
    }

    /* ---------- блок питания ---------- */
    function buildPSU(ps) {
      var sfx = ps.ff === "SFX", w = sfx ? 1.25 : 1.5, h = sfx ? .635 : .86, l = sfx ? 1.0 : (ps.w >= 1000 ? 1.8 : ps.w >= 850 ? 1.6 : 1.4);
      var g = new THREE.Group();
      var body = rbox(w, h, l, .03, new THREE.MeshStandardMaterial({ color: 0x141518, metalness: .6, roughness: .4 })); g.add(body);
      var grill = new THREE.Mesh(new THREE.CircleGeometry(Math.min(w, l) * .38, 40), new THREE.MeshStandardMaterial({ color: 0x0b0b0d, metalness: .4, roughness: .5, alphaMap: meshAlpha, alphaTest: .5, side: THREE.DoubleSide }));
      grill.rotation.x = PI / 2; grill.position.y = -h / 2 - .005; g.add(grill);
      var stick = new THREE.Mesh(new THREE.PlaneGeometry(l * .8, h * .7), new THREE.MeshBasicMaterial({ map: labelTex([{ t: ps.b, s: 46, c: "#a1a9b4", wt: 700, y: .3 }, { t: ps.w + " W", s: 90, c: "#f0cd73", y: .66 }], { w: 512, h: 256, bg: "#111215" }) }));
      stick.rotation.y = -PI / 2; stick.position.x = -w / 2 - .005; g.add(stick);
      g.userData.size = [w, h, l];
      shadows(g); return g;
    }

    /* ---------- накопитель ---------- */
    function buildSSD(s) {
      var g = new THREE.Group();
      if (s.k === "m2") {
        var stick = box(.025, .22, .8, new THREE.MeshStandardMaterial({ color: 0x0f1012, metalness: .4, roughness: .5 }), -.06, 0, .4, g);
        var lab = new THREE.Mesh(new THREE.PlaneGeometry(.62, .16), new THREE.MeshBasicMaterial({ map: labelTex([{ t: s.b + " " + (s.tb >= 1 ? s.tb + " ТБ" : s.tb * 1000 + " ГБ"), s: 54, c: "#e9ebee" }], { w: 640, h: 160 }), transparent: true }));
        lab.rotation.y = -PI / 2; lab.position.set(-.075, 0, .42); g.add(lab);
      } else {
        var big = s.k === "hdd";
        var d = rbox(big ? 1.02 : .7, big ? .26 : .07, big ? 1.47 : 1.0, .02, big ? M.alu : new THREE.MeshStandardMaterial({ color: 0x1b1d22, metalness: .5, roughness: .4 })); g.add(d);
        var l2 = new THREE.Mesh(new THREE.PlaneGeometry(big ? .8 : .55, big ? 1.1 : .7), new THREE.MeshBasicMaterial({ map: labelTex([{ t: s.b, s: 60, c: "#e9ebee" }, { t: s.k === "hdd" ? "HDD" : "SSD", s: 44, c: "#f0cd73" }], { w: 512, h: 512, bg: "#16181c" }) }));
        l2.rotation.x = -PI / 2; l2.rotation.z = PI / 2; l2.position.y = (big ? .13 : .036) + .002; g.add(l2);
      }
      shadows(g); return g;
    }

    /* ---------- раскладка: где каждая деталь стоит в текущем корпусе ---------- */
    function home(cat) {
      if (!C) return null;
      var I = C.userData.info, mb = P.mb && P.mb.userData.L, out = { p: new V3(), r: new THREE.Euler(), parent: C };
      var mbTop = I.FEET + I.H - .28, mbRear = -I.D / 2 + .24;
      function onBoard(u, v, d) { return new V3(I.mbFace - d, mbTop - v, mbRear + u); }
      if (cat === "mb") { out.p.set(I.mbFace, mbTop, mbRear); return out; }
      if (cat === "psu") {
        var sz = P.psu ? P.psu.userData.size : [1.5, .86, 1.4];
        if (I.dual) out.p.set(clamp(I.mbFace + .2 + sz[0] / 2, -I.W / 2, I.W / 2 - sz[0] / 2 - .05), I.floor + sz[1] / 2 + .02, -I.D / 2 + .15 + sz[2] / 2);
        else if (I.small) out.p.set(clamp(I.mbFace - 1.85 - sz[0] / 2, -I.W / 2 + sz[0] / 2 + .05, I.W / 2), I.floor + sz[1] / 2 + .02, I.D / 2 - .1 - sz[2] / 2);
        else out.p.set(0, I.floor + sz[1] / 2 + .02, -I.D / 2 + .12 + sz[2] / 2);
        return out;
      }
      if (cat === "ssd" && B.ssd && B.ssd.k !== "m2") {
        if (B.ssd.k === "hdd" && !I.small && !I.dual) { out.p.set(0, I.floor + .15, I.shroudEnd - .9); return out; }
        out.p.set(lerp(-I.W / 2, I.mbFace, .55), I.shroudTop + .06, (I.shroudEnd || 0) - .7); return out;
      }
      if (!mb) return null;                                  // остальное ставится на плату
      if (cat === "cpu") { out.p.copy(onBoard(mb.sock[0], mb.sock[1], .06)); return out; }
      if (cat === "cooler") { out.p.copy(onBoard(mb.sock[0], mb.sock[1], .085)); return out; }
      if (cat === "ram") { out.p.copy(onBoard(0, (mb.ramV[0] + mb.ramV[1]) / 2, .08)); out.ramU = mb.ramU; return out; }
      if (cat === "gpu") { out.p.copy(onBoard(-.2, mb.pcieV - .02, .1)); out.p.z = -I.D / 2 + I.T + .06; return out; }
      if (cat === "ssd") { out.p.copy(onBoard(mb.m2[0], mb.m2[1], .02)); return out; }
      return null;
    }
    // стенд для деталей, которым пока некуда встать (нет платы)
    function standPos(cat) {
      var I = C ? C.userData.info : { W: 2.3, D: 4.6 }, order = ["cpu", "cooler", "ram", "gpu", "ssd"], i = order.indexOf(cat);
      return new V3(I.W / 2 + 1.3 + (i % 2) * 1.6, .02, -I.D / 2 + .6 + i * 1.05);
    }

    function place(cat, animate) {
      var g = P[cat]; if (!g) return;
      var h = home(cat), tp = new V3(), tr = new THREE.Euler();
      if (h) { tp.copy(h.p); tr.copy(h.r); }
      else { tp.copy(standPos(cat)); tp.y += cat === "gpu" ? .75 : cat === "cooler" ? .7 : .4; tr.set(0, -.6, 0); }
      if (cat === "ram") layoutRAM(h);
      if (cat === "cooler") layoutRadiator(h);
      if (g.userData.tw) { var ix = tweens.indexOf(g.userData.tw); if (ix >= 0) tweens.splice(ix, 1); }
      if (!animate) { g.position.copy(tp); g.rotation.copy(tr); return; }
      var from = g.position.clone(), fr = g.rotation.clone();
      g.userData.tw = tween(.55, function (k) { g.position.lerpVectors(from, tp, k); g.rotation.set(lerp(fr.x, tr.x, k), lerp(fr.y, tr.y, k), lerp(fr.z, tr.z, k)); });
    }
    function layoutRAM(h) {
      var g = P.ram; if (!g) return;
      var sticks = g.userData.sticks || [];
      var slots = h && h.ramU ? h.ramU : null, use;
      if (slots) {
        var k = sticks.length;
        use = slots.length === 4 ? (k <= 2 ? [1, 3] : [0, 1, 2, 3]) : [0, 1];
        sticks.forEach(function (s, i) { s.visible = i < use.length; if (i < use.length) s.position.set(0, 0, slots[use[i]]); });
      } else sticks.forEach(function (s, i) { s.visible = true; s.position.set(0, 0, i * .2); });
    }
    function layoutRadiator(h) {
      var g = P.cooler; if (!g || !g.userData.aio) return;
      var rk = (B.case && B.case.id) + "|" + (B.mb && B.mb.id) + "|" + !!h;
      if (g.userData.radKey === rk) return; g.userData.radKey = rk;
      if (g.userData.rad) { C.remove(g.userData.rad.rad); C.remove(g.userData.rad.tubes); g.userData.rad = null; }
      if (!h || !C) return;
      var I = C.userData.info, cl = B.cooler, where = cl.r <= (B.case.rt || 0) ? "top" : cl.r <= (B.case.rf || 0) ? "front" : null;
      if (!where) return;
      var pumpW = h.p.clone().add(new V3(-.42, 0, 0));
      var r = buildRadiator(cl, where, I, pumpW);
      C.add(r.rad); C.add(r.tubes); g.userData.rad = r;
      r.rad.scale.setScalar(.001); r.tubes.visible = false;
      tween(.6, function (k) { r.rad.scale.setScalar(Math.max(.001, k)); }, function () { r.tubes.visible = true; });
    }

    /* ---------- кабели от БП ---------- */
    var cables = null;
    function layoutCables() {
      if (cables) { C && C.remove(cables); cables = null; }
      if (!C || !P.psu || !P.mb) return;
      var I = C.userData.info, L = P.mb.userData.L, mbTop = I.FEET + I.H - .28, mbRear = -I.D / 2 + .24;
      cables = new THREE.Group();
      var c24 = new V3(I.mbFace - .1, mbTop - L.i24[1], mbRear + L.i24[0] + .08);
      var start = new V3(I.mbFace + .02, (I.shroudTop || I.floor) + .05, c24.z + .1);
      for (var i = 0; i < 4; i++) cables.add(tube([start.clone().add(new V3(0, 0, i * .05)), new V3(I.mbFace - .25, c24.y - .9, c24.z + .25 + i * .03), c24.clone().add(new V3(-.05, -.12 + i * .08, .06))], .028, M.sleeve));
      if (P.gpu) {
        P.gpu.updateMatrix(); var pin = P.gpu.userData.pin.clone().applyMatrix4(P.gpu.matrix);
        var s2 = new V3(I.mbFace + .02, (I.shroudTop || I.floor) + .05, pin.z - .3);
        cables.add(tube([s2, new V3(pin.x + .3, pin.y + .35, pin.z - .25), new V3(pin.x, pin.y + .12, pin.z)], .04, M.sleeve));
      }
      shadows(cables);
      C.add(cables);
    }

    /* ---------- обновление сборки ---------- */
    var CAT_BUILD = { mb: buildMB, cpu: buildCPU, cooler: buildCooler, gpu: buildGPU, psu: buildPSU, ssd: buildSSD };
    function update(build) {
      build = build || {};
      var caseChanged = (B.case && B.case.id) !== (build.case && build.case.id);
      if (caseChanged) {
        // новый корпус: детали пересаживаются в него
        var old = C;
        if (old) { tween(.35, function (k) { old.scale.setScalar(1 - k * .15); old.position.y = -k * 6; }, function () { rig.remove(old); }); }
        fans = fans.filter(function (f) { var inOld = false; f.traverseAncestors(function (a) { if (a === old) inOld = true; }); return !inOld; });
        panels = {};
        C = build.case ? buildCase(build.case) : null;
        if (C) {
          rig.add(C); C.position.y = 7;
          tween(.7, function (k) { C.position.y = 7 * (1 - easeOut(k)); }, null, lin);
          Object.keys(P).forEach(function (cat) { if (P[cat]) { var g = P[cat]; g.parent && g.parent.remove(g); C.add(g); } });
        }
        frameCase(true);
      }
      ["mb", "psu", "cpu", "cooler", "ram", "gpu", "ssd"].forEach(function (cat) {
        var was = B[cat] && B[cat].id, now = build[cat] && build[cat].id;
        if (was === now && P[cat] && !caseChanged) return;
        if (was !== now) {
          if (P[cat]) removePart(cat);
          B[cat] = build[cat] || null;
          if (B[cat]) addPart(cat);
        }
      });
      B.case = build.case || null;
      ["mb", "psu", "cpu", "cooler", "ram", "gpu", "ssd"].forEach(function (cat) { if (P[cat]) place(cat, true); });
      later(.6, layoutCables);
    }
    function lin(k) { return k; }
    function later(s, fn) { tween(s, function () {}, fn, lin); }
    function addPart(cat) {
      var d = B[cat], g;
      if (cat === "ram") {
        g = new THREE.Group(); g.userData.sticks = [];
        for (var i = 0; i < d.k; i++) { var s = buildRAMStick(d); g.add(s); g.userData.sticks.push(s); }
      } else g = CAT_BUILD[cat](d);
      P[cat] = g;
      (C || rig).add(g);
      var h = home(cat);
      var target = h ? h.p.clone() : standPos(cat).add(new V3(0, .4, 0));
      // деталь влетает сбоку (со стороны стекла) и сверху
      g.position.copy(target).add(new V3(-3.2, 2.2, .4));
      g.rotation.set(0, h ? 0 : -.6, 0);
      fans = fans.concat(collectFans(g));
    }
    function pruneFans() { fans = fans.filter(function (f) { var ok = false; f.traverseAncestors(function (a) { if (a === scene) ok = true; }); return ok; }); }
    function collectFans(g) { var a = []; g.traverse(function (o) { if (o.userData && o.userData.fan && fans.indexOf(o) < 0) a.push(o); }); return a; }
    function removePart(cat) {
      var g = P[cat]; P[cat] = null;
      if (cat === "cooler" && g.userData.rad && C) { C.remove(g.userData.rad.rad); C.remove(g.userData.rad.tubes); }
      var from = g.position.clone();
      tween(.35, function (k) { g.position.set(from.x - 3 * k, from.y + 2 * k, from.z); }, function () { g.parent && g.parent.remove(g); pruneFans(); });
      fans = fans.filter(function (f) { var inG = false; f.traverseAncestors(function (a) { if (a === g) inG = true; }); return !inG; });
    }

    /* ---------- «призрак» несовместимой детали: красная копия на её месте ---------- */
    function ghost(cat, data) {
      if (!CAT_BUILD[cat] && cat !== "ram") return;
      var g;
      var fans0 = fans.slice(); noRGB = true;
      if (cat === "ram") { g = new THREE.Group(); var s = buildRAMStick(data); g.add(s); }
      else g = CAT_BUILD[cat](data);
      fans = fans0; noRGB = false;
      g.traverse(function (o) { if (o.isMesh) { o.material = M.ghost; o.castShadow = false; } });
      var h = home(cat), parent = C || rig;
      g.position.copy(h ? h.p : standPos(cat).add(new V3(0, .5, 0)));
      parent.add(g);
      if (cat === "cooler" && data.k === "aio" && C) {
        var I = C.userData.info, rg = new THREE.Group(), L = data.r / 100;
        var core = box(.27, 1.24, L, M.ghost, 0, 0, 0, rg); rg.position.set(0, I.FEET + I.H - .22, -I.D / 2 + .35 + L / 2); rg.rotation.z = PI / 2; parent.add(rg);
        tween(1.6, function (k) { M.ghost.opacity = .38 * (1 - k) + .12 * Math.sin(k * PI * 6); }, function () { parent.remove(rg); });
      }
      tween(1.6, function (k) { M.ghost.opacity = .45 * (1 - k * k) * (.75 + .25 * Math.sin(k * PI * 8)); g.position.x += Math.sin(k * PI * 10) * .004; }, function () { parent.remove(g); M.ghost.opacity = .38; }, lin);
    }

    /* ---------- панели: открыть / закрыть ---------- */
    function setPanel(name, open) {
      var p = panels[name]; if (!p || !p.g) return;
      p.open = open == null ? !p.open : !!open;
    }
    function animPanels(dt) {
      ["glass", "right", "front", "top"].forEach(function (n) {
        var p = panels[n]; if (!p || !p.g) return;
        p.k = damp(p.k, p.open ? 1 : 0, 7, dt);
        var k = p.k, g = p.g;
        if (p.hinge === "rear") { g.rotation.y = -k * 1.25; g.position.x = (C ? -C.userData.info.W / 2 : 0) - k * .25; }
        else if (p.hinge === "slide") { g.position.x = (C ? C.userData.info.W / 2 : 0) + k * 1.4; g.rotation.y = k * .25; }
        else if (p.hinge === "door") { g.rotation.y = -k * 1.75; }
        else if (p.hinge === "lid") { g.rotation.x = -k * 1.1; g.position.y = (C ? C.userData.info.H : 0) + k * .15; }
      });
    }

    /* ---------- монитор ---------- */
    var mon = new THREE.Group(); mon.visible = false; rig.add(mon);
    var SW = 7.1, SH = 4.0, monScreen, monCanvas = document.createElement("canvas"), monTex;
    (function () {
      monCanvas.width = 1280; monCanvas.height = 720;
      monTex = new THREE.CanvasTexture(monCanvas); monTex.encoding = THREE.sRGBEncoding;
      var frame = rbox(SW + .16, SH + .16, .14, .05, M.black); frame.position.y = SH / 2 + 1.9; mon.add(frame);
      monScreen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: monTex, toneMapped: false })); monScreen.position.set(0, SH / 2 + 1.9, .072); mon.add(monScreen);
      var back = rbox(SW * .55, SH * .55, .35, .1, M.dark); back.position.set(0, SH / 2 + 1.9, -.22); mon.add(back);
      var neck = box(.35, 2.1, .2, M.alu, 0, 1.2, -.3, mon);
      var foot = rbox(2.4, .08, 1.5, .1, M.alu); foot.position.set(0, .04, -.2); mon.add(foot);
      var glow = new THREE.Mesh(new THREE.PlaneGeometry(SW * 1.25, SH * 1.3), new THREE.MeshBasicMaterial({ color: 0xf0cd73, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.position.set(0, SH / 2 + 1.9, -.4); mon.add(glow); mon.userData.glow = glow;
      shadows(mon);
      drawScreen("off");
    })();
    function drawScreen(mode, k) {
      var x = monCanvas.getContext("2d"), w = monCanvas.width, h = monCanvas.height;
      x.fillStyle = "#050607"; x.fillRect(0, 0, w, h);
      if (mode === "boot") {
        var g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * .6); g.addColorStop(0, "#1b1d22"); g.addColorStop(1, "#050607"); x.fillStyle = g; x.fillRect(0, 0, w, h);
        x.fillStyle = "#f0cd73"; x.font = "800 64px Unbounded, Manrope, sans-serif"; x.textAlign = "center"; x.fillText(">_", w / 2, h / 2 - 20);
        x.fillStyle = "#a1a9b4"; x.font = "600 26px Manrope, sans-serif"; x.fillText("Запуск системы…", w / 2, h / 2 + 50);
        x.fillStyle = "#23262c"; x.fillRect(w / 2 - 200, h / 2 + 90, 400, 8);
        x.fillStyle = "#d4a84b"; x.fillRect(w / 2 - 200, h / 2 + 90, 400 * (k || 0), 8);
      } else if (mode === "on") {
        var g2 = x.createLinearGradient(0, 0, w, h); g2.addColorStop(0, "#101318"); g2.addColorStop(1, "#1b1710"); x.fillStyle = g2; x.fillRect(0, 0, w, h);
      }
      monTex.needsUpdate = true;
    }

    /* ---------- камера: орбита ---------- */
    var orb = { th: -.62, ph: 1.12, r: 13, tgt: new V3(0, 2.4, 0) }, orbT = { th: -.62, ph: 1.12, r: 13, tgt: new V3(0, 2.4, 0) };
    var camLock = false, autoSpin = false;
    function fitR(I, k) {                                  // расстояние, при котором корпус целиком в кадре
      var tv = Math.tan(cam.fov * PI / 360), h = I.H * .62 + .7, w = (I.W + I.D) * .5 + .7;
      return clamp(Math.max(h / tv, w / (tv * cam.aspect)) * (k || 1), 6, 26);
    }
    function frameCase(snap) {
      var I = C ? C.userData.info : { W: 2.3, H: 4.7, D: 4.6 };
      orbT.tgt.set(0, I.H * .48 + .1, 0);
      orbT.r = fitR(I);
      if (snap && !camLock) { orb.r = orbT.r * 1.15; }
    }
    function view(name) {
      camLock = false;
      var I = C ? C.userData.info : { W: 2.3, H: 4.7, D: 4.6 };
      if (name === "front") { orbT.th = 0; orbT.ph = 1.35; orbT.r = fitR(I, .9); orbT.tgt.set(0, I.H / 2, 0); }
      else if (name === "side") { orbT.th = -PI / 2; orbT.ph = 1.38; orbT.r = fitR(I, .95); orbT.tgt.set(0, I.H / 2, 0); }
      else if (name === "inside") { orbT.th = -PI / 2 + .35; orbT.ph = 1.22; orbT.r = fitR(I, .7); orbT.tgt.set(I.mbFace || 0, I.H * .55, 0); setPanel("glass", true); }
      else if (name === "back") { orbT.th = PI - .4; orbT.ph = 1.2; orbT.r = fitR(I); orbT.tgt.set(0, I.H / 2, 0); }
      else { orbT.th = -.62; orbT.ph = 1.12; frameCase(); }
    }
    function updateCam(dt) {
      if (autoSpin && !drag && !camLock) orbT.th += dt * .25;
      var s = camLock ? 3.2 : 8;
      orb.th = damp(orb.th, orbT.th, s, dt); orb.ph = damp(orb.ph, orbT.ph, s, dt); orb.r = damp(orb.r, orbT.r, s, dt);
      orb.tgt.x = damp(orb.tgt.x, orbT.tgt.x, s, dt); orb.tgt.y = damp(orb.tgt.y, orbT.tgt.y, s, dt); orb.tgt.z = damp(orb.tgt.z, orbT.tgt.z, s, dt);
      var sp = Math.sin(orb.ph);
      cam.position.set(orb.tgt.x + orb.r * sp * Math.sin(orb.th), orb.tgt.y + orb.r * Math.cos(orb.ph), orb.tgt.z + orb.r * sp * Math.cos(orb.th));
      cam.lookAt(orb.tgt);
    }
    // ввод
    var drag = null, pts = {}, moved = 0;
    cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    cv.addEventListener("pointerdown", function (e) {
      if (camLock) return;
      cv.setPointerCapture(e.pointerId); pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      drag = { b: e.button, x: e.clientX, y: e.clientY }; moved = 0;
    });
    cv.addEventListener("pointermove", function (e) {
      if (!drag || !pts[e.pointerId]) return;
      var ids = Object.keys(pts), p = pts[e.pointerId], dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      if (ids.length === 2) {                                   // щипок + сдвиг двумя пальцами
        var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (drag.pd) orbT.r = clamp(orbT.r * drag.pd / Math.max(1, d), 3.5, 24);
        drag.pd = d; return;
      }
      if (drag.b === 2 || e.shiftKey) {                         // сдвиг
        var k = orb.r * .0016, right = new V3().setFromMatrixColumn(cam.matrixWorld, 0), up = new V3().setFromMatrixColumn(cam.matrixWorld, 1);
        orbT.tgt.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
        orbT.tgt.x = clamp(orbT.tgt.x, -6, 9); orbT.tgt.y = clamp(orbT.tgt.y, .3, 8); orbT.tgt.z = clamp(orbT.tgt.z, -6, 6);
      } else { orbT.th -= dx * .008; orbT.ph = clamp(orbT.ph - dy * .006, .18, 1.52); }
      autoSpin = false;
    });
    function endPtr(e) {
      if (!pts[e.pointerId]) return;
      delete pts[e.pointerId];
      if (Object.keys(pts).length) { drag.pd = 0; return; }
      if (drag && moved < 6 && drag.b === 0) pick(e);
      drag = null;
    }
    cv.addEventListener("pointerup", endPtr); cv.addEventListener("pointercancel", endPtr);
    cv.addEventListener("wheel", function (e) {
      if (camLock) return;
      e.preventDefault(); orbT.r = clamp(orbT.r * Math.exp(e.deltaY * .0012), 3.5, 24);
    }, { passive: false });
    // клик по панели корпуса — открыть/закрыть; по детали — сообщить наружу
    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    function pick(e) {
      var r = cv.getBoundingClientRect();
      ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, cam);
      var hits = ray.intersectObjects(rig.children, true);
      for (var i = 0; i < hits.length; i++) {
        var o = hits[i].object, found = null;
        o.traverseAncestors(function (a) {
          if (found) return;
          Object.keys(panels).forEach(function (n) { if (panels[n] && panels[n].g === a) found = { panel: n }; });
          Object.keys(P).forEach(function (c) { if (P[c] === a) found = { part: c }; });
        });
        if (found && found.panel) { setPanel(found.panel); if (opt.onPanels) opt.onPanels(panelState()); return; }
        if (found && found.part) { if (opt.onPick) opt.onPick(found.part); return; }
      }
    }
    function panelState() { var s = {}; Object.keys(panels).forEach(function (n) { if (panels[n] && panels[n].g) s[n] = !!panels[n].open; }); return s; }

    /* ---------- включение ---------- */
    var monRect = null, monCb = null, monKey = "";
    function frameMonitor() {
      mon.updateMatrixWorld(true);
      var c0 = monScreen.getWorldPosition(new V3()), n = new V3(0, 0, 1).applyQuaternion(mon.getWorldQuaternion(new THREE.Quaternion()));
      var fovV = cam.fov * PI / 180, needH = SH * mon.scale.y / .84, needW = SW * mon.scale.x / .94;
      var dist = Math.max(needH / (2 * Math.tan(fovV / 2)), needW / (2 * Math.tan(fovV / 2) * cam.aspect));
      orbT.tgt.copy(c0); orbT.r = dist; orbT.th = Math.atan2(n.x, n.z); orbT.ph = PI / 2 - Math.asin(clamp(n.y, -1, 1));
    }
    function power(on, cb) {
      powered = on ? 1 : 0;
      if (on) {
        if (!C) return;
        var I = C.userData.info;
        mon.visible = true; mon.scale.setScalar(.78); mon.rotation.y = -.38; mon.position.set(I.W / 2 + 3.3, -6, -1.1);
        setPanel("glass", false); setPanel("front", false); setPanel("top", false); setPanel("right", false);
        drawScreen("boot", 0);
        tween(.9, function (k) { mon.position.y = -6 * (1 - easeOut(k)); }, function () {
          tween(1.4, function (k) { drawScreen("boot", k); }, function () {
            drawScreen("on"); camLock = true; frameMonitor();
            later(.9, function () { monCb = cb; monKey = ""; });
          }, lin);
        }, lin);
      } else {
        camLock = false; monCb = null; monRect = null;
        tween(.6, function (k) { mon.position.y = -6 * k; }, function () { mon.visible = false; drawScreen("off"); }, lin);
        view("home");
      }
    }
    function measureMonitor() {
      if (!monCb) return;
      var xs = [], ys = [];
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (s) {
        var p = monScreen.localToWorld(new V3(s[0] * SW / 2, s[1] * SH / 2, 0)).project(cam);
        xs.push((p.x + 1) / 2 * Wc); ys.push((1 - p.y) / 2 * Hc);
      });
      var r = { x: Math.min.apply(0, xs), y: Math.min.apply(0, ys), w: Math.max.apply(0, xs) - Math.min.apply(0, xs), h: Math.max.apply(0, ys) - Math.min.apply(0, ys) };
      var k = [r.x, r.y, r.w, r.h].map(function (v) { return Math.round(v); }).join(",");
      if (k !== monKey) { monKey = k; monRect = r; monCb(r); }
    }

    /* ---------- размеры и цикл ---------- */
    var Wc = 1, Hc = 1;
    function resize() {
      var r = host.getBoundingClientRect(); Wc = Math.max(1, r.width); Hc = Math.max(1, r.height);
      R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); R.setSize(Wc, Hc, false);
      cam.aspect = Wc / Hc; cam.fov = Wc < 600 ? 40 : 32; cam.updateProjectionMatrix();
      if (camLock) frameMonitor(); else if (C) orbT.r = Math.max(orbT.r, fitR(C.userData.info, .8));
    }
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(host); else window.addEventListener("resize", resize);

    var last = 0, visible = true, T = 0, hueT = 0;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) requestAnimationFrame(loop); }, { threshold: .01 }).observe(host);
    function loop(now) {
      if (!visible || document.hidden) { last = 0; return; }
      requestAnimationFrame(loop);
      var dt = last ? Math.min((now - last) / 1000, .05) : .016; last = now; T += dt;
      for (var i = 0; i < tweens.length; i++) {
        var t = tweens[i]; t.t += dt; var k = clamp(t.t / t.dur, 0, 1); t.fn(t.ez(k));
        if (k >= 1) { tweens.splice(i--, 1); if (t.done) t.done(); }
      }
      animPanels(dt);
      powerK = damp(powerK, powered, powered ? 1.6 : 4, dt);
      var spin = powerK * (reduce ? 4 : 28);
      fans.forEach(function (f) { if (f.userData.rot) f.userData.rot.rotation.z += spin * dt; });
      hueT += dt * .08;
      RGB.forEach(function (m) {
        var on = powerK;
        if (m.userData.fixed) m.color.setHex(m.userData.fixed).multiplyScalar(.15 + .85 * on);
        else m.color.setHSL((m.userData.hue + hueT) % 1, .85, .08 + .47 * on);
      });
      if (C) { var I = C.userData.info; inLight.position.set(lerp(-I.W / 2, I.mbFace, .5), I.FEET + I.H * .6, 0); inLight.color.setHSL(hueT % 1, .7 * powerK, .55 + .35 * (1 - powerK)); inLight.intensity = 1.3 + powerK * 1.6; }
      if (mon.visible) mon.userData.glow.material.opacity = powerK * .07;
      updateCam(dt);
      if (camLock && monCb) measureMonitor();
      R.render(scene, cam);
    }
    requestAnimationFrame(loop);

    return {
      update: update, ghost: ghost, view: view, setPanel: function (n, o) { setPanel(n, o); return panelState(); }, panels: panelState,
      power: power, isPowered: function () { return !!powered; }, spin: function (on) { autoSpin = on == null ? !autoSpin : !!on; return autoSpin; },
      zoom: function (k) { if (!camLock) orbT.r = clamp(orbT.r * k, 3.5, 24); }, resize: resize, measure: measureMonitor,
      shot: function () { R.render(scene, cam); return cv.toDataURL("image/png"); }
    };
  }
})();
