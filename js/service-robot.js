/* =====================================================================
   СЕРВИСНЫЙ АНДРОИД в центре орбиты (service.html).
   Белый глянцевый корпус, тёмный визор с мятными глазами, светящиеся «жилы»
   на шее, кольца-суставы на плечах. Модель собрана кодом из примитивов three.js
   (своя, не чужой персонаж). Голова следит за курсором и за значком утилиты,
   на который навели; глаза моргают, по визору проходит луч сканера,
   жилы на шее «пульсируют». Без WebGL остаётся диск с надписью — страница работает.
   ===================================================================== */
(function () {
  "use strict";
  var box = document.getElementById("svcBot");
  if (!box || !window.IntersectionObserver) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function loadThree() {
    return new Promise(function (ok, no) {
      if (window.THREE) return ok();
      var s = document.createElement("script");
      s.src = "js/vendor/three.min.js"; s.async = true; s.onload = ok; s.onerror = no;
      document.head.appendChild(s);
    });
  }
  var io0 = new IntersectionObserver(function (es) {
    if (!es[0].isIntersecting) return;
    io0.disconnect();
    loadThree().then(function () {
      try { init(); } catch (e) { if (window.console) console.error(e); box.classList.add("is-fail"); }
    }).catch(function () { box.classList.add("is-fail"); });
  }, { rootMargin: "400px 0px" });
  io0.observe(box);

  function init() {
    var THREE = window.THREE, V3 = THREE.Vector3, PI = Math.PI;
    if (THREE.ColorManagement && "legacyMode" in THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function damp(c, t, s, dt) { return c + (t - c) * (1 - Math.exp(-s * dt)); }
    function sm(k) { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); }

    var cv = document.createElement("canvas");
    var R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    R.outputEncoding = THREE.sRGBEncoding; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.08;
    R.setClearColor(0x000000, 0);
    box.appendChild(cv);

    var scene = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(24, 1, .1, 50);
    cam.position.set(0, -.2, 5.5); cam.lookAt(0, -.33, 0);

    // окружение для отражений: светлая комната с панелями и мятной подсветкой сзади
    (function () {
      var env = new THREE.Scene();
      var room = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x55605a, side: THREE.BackSide }));
      room.scale.set(16, 10, 16); room.position.y = 3; env.add(room);
      [[9, 3.4, 0, 7.6, 0, 0, PI / 2, 0xffffff, 3.4], [2, 6, -7.6, 3, 0, PI / 2, 0, 0xffffff, 4.5], [2, 6, 7.6, 2.4, -1, -PI / 2, 0, 0xfff3e0, 3],
       [6, 2.4, 0, 2.4, -7.6, 0, 0, 0x7af0bf, 3.2], [6, 1.6, 0, 1.6, 7.6, PI, 0, 0xffffff, 2]].forEach(function (p) {
        var m = new THREE.Mesh(new THREE.PlaneGeometry(p[0], p[1]), new THREE.MeshBasicMaterial({ color: new THREE.Color(p[7]).multiplyScalar(p[8]) }));
        m.position.set(p[2], p[3], p[4]); m.rotation.set(p[6], p[5], 0); env.add(m);
      });
      var pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromScene(env, .03).texture; pm.dispose();
    })();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x1d3f2b, .55));
    var key = new THREE.DirectionalLight(0xffffff, 1.35); key.position.set(-2.5, 3.2, 4); scene.add(key);
    var rim = new THREE.DirectionalLight(0x6ff0b8, 1.6); rim.position.set(2.5, 1.5, -3.5); scene.add(rim);
    var rim2 = new THREE.DirectionalLight(0x9fd8ff, .7); rim2.position.set(-3, -.5, -2.5); scene.add(rim2);

    /* ---------- материалы ---------- */
    var shell = new THREE.MeshPhysicalMaterial({ color: 0xf3f6f4, metalness: .05, roughness: .22, clearcoat: 1, clearcoatRoughness: .06, sheen: .2 });
    var shellSoft = new THREE.MeshPhysicalMaterial({ color: 0xe4e9e6, metalness: .1, roughness: .35, clearcoat: .8, clearcoatRoughness: .15 });
    var graph = new THREE.MeshPhysicalMaterial({ color: 0x262b30, metalness: .85, roughness: .32, clearcoat: .4 });
    var chrome = new THREE.MeshPhysicalMaterial({ color: 0xcfd6dc, metalness: 1, roughness: .16 });
    var visorM = new THREE.MeshPhysicalMaterial({ color: 0x070b0c, metalness: .55, roughness: .06, clearcoat: 1, clearcoatRoughness: .02 });
    var MINT = 0x55f0b0;
    var glowM = new THREE.MeshBasicMaterial({ color: 0x7dffcc, toneMapped: false });
    var veinM = new THREE.MeshStandardMaterial({ color: 0x0b3a29, emissive: MINT, emissiveIntensity: 1.4, roughness: .35, metalness: .2, toneMapped: false });
    var ringM = new THREE.MeshStandardMaterial({ color: 0x0b3a29, emissive: MINT, emissiveIntensity: 1.8, roughness: .3, toneMapped: false });
    var glowTex = (function () {
      var c = document.createElement("canvas"); c.width = c.height = 128; var x = c.getContext("2d");
      var g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(140,255,210,1)"); g.addColorStop(.25, "rgba(90,240,175,.55)"); g.addColorStop(1, "rgba(60,220,150,0)");
      x.fillStyle = g; x.fillRect(0, 0, 128, 128);
      var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
    })();
    function glow(sz, op) {
      var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: op || .8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      s.scale.setScalar(sz); return s;
    }
    function lathe(pts, seg, sx, sz, ps, pl) {
      var curve = new THREE.SplineCurve(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }));
      var g = new THREE.LatheGeometry(curve.getPoints(60), seg || 96, ps || 0, pl || PI * 2);
      g.scale(sx || 1, 1, sz || 1); return g;
    }

    var bot = new THREE.Group(); scene.add(bot);
    var body = new THREE.Group(); bot.add(body);
    var neck = new THREE.Group(); neck.position.y = -.52; bot.add(neck);
    var head = new THREE.Group(); neck.add(head);          // голова крутится вокруг основания черепа

    /* ---------- голова (профиль задан по высоте y: от −0,52 — низ черепа — до 0,67 — макушка) ---------- */
    var HP = [[0, -.52], [.11, -.52], [.19, -.495], [.26, -.44], [.32, -.35], [.37, -.2], [.41, -.04], [.435, .12], [.44, .26], [.42, .38], [.37, .49], [.29, .58], [.18, .64], [.07, .668], [0, .672]];
    var SX = .9, SZ = .97, HB = .52;      // HB — от основания черепа до «нуля» профиля
    function rAt(y) {          // радиус профиля головы на высоте y
      for (var i = 0; i < HP.length - 1; i++) if (y >= HP[i][1] && y <= HP[i + 1][1]) { var k = (y - HP[i][1]) / (HP[i + 1][1] - HP[i][1]); return HP[i][0] + (HP[i + 1][0] - HP[i][0]) * k; }
      return .3;
    }
    function onHead(y, phi, lift) {      // точка на поверхности головы (в системе головы: основание черепа — 0)
      var r = rAt(y) + (lift || 0);
      return new V3(Math.sin(phi) * r * SX, y + HB, Math.cos(phi) * r * SZ);
    }
    function headTube(pts, rad, mat) { var m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(24, pts.length * 3), rad, 8, false), mat); head.add(m); return m; }
    function arcTube(y, phi, rad, lift, mat, c) {     // дуга по поверхности головы на высоте y (c — центр дуги по углу)
      var pts = []; for (var i = 0; i <= 28; i++) pts.push(onHead(y, (c || 0) - phi + 2 * phi * i / 28, lift));
      return headTube(pts, rad, mat);
    }
    var skull = new THREE.Mesh(lathe(HP, 128, SX, SZ), shell); skull.position.y = HB; head.add(skull);
    // визор — полоса тёмного стекла на уровне глаз
    var VY = [-.1, -.03, .06, .15, .22, .27];
    var visor = new THREE.Mesh(lathe(VY.map(function (y) { return [rAt(y) * 1.014, y]; }), 90, SX, SZ, -1.08, 2.16), visorM);
    visor.position.y = HB; head.add(visor);
    arcTube(-.1, 1.06, .0062, .008, glowM); arcTube(.27, 1.06, .0052, .008, glowM);       // мятная кромка визора
    // глаза
    var eyes = [-1, 1].map(function (s) {
      var g = new THREE.Group(), ph = s * .33, p = onHead(.09, ph, .014); g.position.copy(p);
      g.lookAt(p.clone().add(new V3(Math.sin(ph) / SX, .05, Math.cos(ph) / SZ).normalize()));
      var e = new THREE.Mesh(new THREE.CapsuleGeometry(.032, .1, 6, 18), glowM); e.rotation.z = PI / 2 - s * .12; e.scale.z = .3; g.add(e);
      var gl = glow(.5, .75); gl.position.z = .012; g.add(gl);
      head.add(g); return { g: g, e: e, gl: gl };
    });
    // луч сканера по визору: дуга единичного радиуса, масштабируется под нужную высоту
    var scanPts = []; for (var si = 0; si <= 28; si++) { var f = -1.03 + 2.06 * si / 28; scanPts.push(new V3(Math.sin(f) * SX, 0, Math.cos(f) * SZ)); }
    var scan = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(scanPts), 56, .012, 6, false),
      new THREE.MeshBasicMaterial({ color: 0x9dffd8, transparent: true, opacity: 0, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }));
    head.add(scan);
    // решётка рта, гребень на лбу, швы
    [[-.27, .16], [-.315, .12], [-.36, .075]].forEach(function (m) { arcTube(m[0], m[1], .0085, .003, graph); });
    var crest = []; for (var ci = 0; ci <= 16; ci++) crest.push(onHead(.29 + ci * .37 / 16, 0, .004));
    headTube(crest, .016, shellSoft);
    var crestL = []; for (var cj = 0; cj <= 10; cj++) crestL.push(onHead(.3 + cj * .2 / 10, 0, .019));
    headTube(crestL, .0045, glowM);
    arcTube(-.42, 2.3, .0035, .004, graph);
    arcTube(.42, 1.2, .0032, .003, graph, PI);
    // «уши» — круглые модули с мятным кольцом
    [-1, 1].forEach(function (s) {
      var e = new THREE.Group(); e.position.set(s * .375, .55, -.04); e.rotation.z = s * -PI / 2; head.add(e);
      var d = new THREE.Mesh(new THREE.CylinderGeometry(.145, .155, .07, 64), shellSoft); d.position.y = .02; e.add(d);
      var r = new THREE.Mesh(new THREE.TorusGeometry(.108, .011, 10, 64), ringM); r.rotation.x = PI / 2; r.position.y = .057; e.add(r);
      var c = new THREE.Mesh(new THREE.CylinderGeometry(.07, .077, .03, 48), graph); c.position.y = .066; e.add(c);
      var c2 = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .02, 28), chrome); c2.position.y = .083; e.add(c2);
    });

    /* ---------- шея: сердечник, кольца и светящиеся «мышцы»-жилы ---------- */
    var core = new THREE.Mesh(new THREE.CylinderGeometry(.13, .17, .46, 48), graph); core.position.y = -.18; neck.add(core);
    [-.07, -.19].forEach(function (y, i) {
      var t = new THREE.Mesh(new THREE.TorusGeometry(.142 + i * .01, .018, 12, 56), chrome); t.rotation.x = PI / 2; t.position.y = y; neck.add(t);
    });
    var veins = [];
    function vein(pts, r) { var m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, r, 10, false), veinM.clone()); neck.add(m); veins.push(m); }
    [-1, 1].forEach(function (s) {
      // главные: из-за «уха» к ярёмной ямке (как грудино-ключичные мышцы)
      vein([new V3(s * .22, .1, -.05), new V3(s * .18, -.05, .05), new V3(s * .12, -.22, .14), new V3(s * .045, -.4, .19)], .024);
      // тонкие волокна
      vein([new V3(s * .12, .1, .05), new V3(s * .13, -.1, .12), new V3(s * .17, -.26, .15), new V3(s * .26, -.4, .14)], .011);
      vein([new V3(s * .05, .1, .09), new V3(s * .055, -.12, .145), new V3(s * .07, -.28, .17), new V3(s * .1, -.42, .19)], .008);
    });
    for (var vI = 0; vI < 3; vI++) { var vb = new THREE.Mesh(new THREE.BoxGeometry(.11, .05, .07), graph); vb.position.set(0, -.07 - vI * .11, -.13); neck.add(vb); }

    /* ---------- плечи и грудь ---------- */
    var TP = [[.18, -.92], [.32, -.93], [.52, -.97], [.69, -1.04], [.81, -1.15], [.88, -1.32], [.9, -1.62], [.9, -1.95]];
    var torso = new THREE.Mesh(lathe(TP, 128, 1, .6), shell); body.add(torso);
    var collar = new THREE.Mesh(new THREE.TorusGeometry(.215, .05, 18, 64), graph); collar.rotation.x = PI / 2; collar.scale.y = .8; collar.position.y = -.91; body.add(collar);
    var collar2 = new THREE.Mesh(new THREE.TorusGeometry(.3, .011, 10, 72), ringM); collar2.rotation.x = PI / 2; collar2.scale.y = .64; collar2.position.y = -.95; body.add(collar2);
    var plate = new THREE.Mesh(lathe(TP.slice(2, 7).map(function (p) { return [p[0] * 1.016, p[1]]; }), 64, 1, .6, -.5, 1.0), shellSoft);
    body.add(plate);
    // швы грудной пластины и ключицы
    function torsoPt(y, phi, lift) { var r = 0, i; for (i = 0; i < TP.length - 1; i++) if (y <= TP[i][1] && y >= TP[i + 1][1]) { r = TP[i][0] + (TP[i + 1][0] - TP[i][0]) * (y - TP[i][1]) / (TP[i + 1][1] - TP[i][1]); break; }
      r += lift || 0; return new V3(Math.sin(phi) * r, y, Math.cos(phi) * r * .6); }
    function seam(pts, rad, mat) { body.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, rad, 6, false), mat)); }
    [-1, 1].forEach(function (s) {
      var a = []; for (var k = 0; k <= 12; k++) { var y = -.98 - k * .05; a.push(torsoPt(y, s * .5, .02)); } seam(a, .006, graph);
      var c2 = []; for (var k2 = 0; k2 <= 10; k2++) c2.push(torsoPt(-.95 - k2 * .006, s * (.22 + k2 * .07), .012)); seam(c2, .005, graph);
    });
    var coreG = new THREE.Group(); coreG.position.set(0, -1.32, .548); coreG.rotation.x = -.18; body.add(coreG);
    var cRing = new THREE.Mesh(new THREE.TorusGeometry(.075, .015, 12, 48), chrome); coreG.add(cRing);
    var cDot = new THREE.Mesh(new THREE.CircleGeometry(.058, 40), glowM); cDot.position.z = .004; coreG.add(cDot);
    var cGl = glow(.5, .6); cGl.position.z = .02; coreG.add(cGl);
    // плечевые суставы — кольца спереди на плечах
    var shoulderRings = [];
    [-1, 1].forEach(function (s) {
      var pad = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), shell); pad.scale.set(.29, .25, .31); pad.position.set(s * .8, -1.15, -.02); body.add(pad);
      var j = new THREE.Group(); j.position.set(s * .55, -1.04, .3);
      j.lookAt(new V3(s * 1.4, -.4, 2.2)); j.rotateX(PI / 2); body.add(j);
      var jd = new THREE.Mesh(new THREE.CylinderGeometry(.12, .135, .06, 64), graph); j.add(jd);
      var jr = new THREE.Mesh(new THREE.TorusGeometry(.104, .011, 10, 64), ringM); jr.rotation.x = PI / 2; jr.position.y = .034; j.add(jr);
      var jc = new THREE.Mesh(new THREE.CylinderGeometry(.066, .066, .04, 48), chrome); jc.position.y = .046; j.add(jc);
      var jc2 = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .03, 32), graph); jc2.position.y = .068; j.add(jc2);
      var arc = new THREE.Mesh(new THREE.TorusGeometry(.084, .008, 8, 40, PI * 1.25), shellSoft); arc.rotation.x = PI / 2; arc.position.y = .072; j.add(arc);
      shoulderRings.push(arc);
    });

    /* ---------- взгляд: курсор или значок утилиты, на который навели ---------- */
    var orb = box.closest(".orb") || box.parentNode;
    var aim = { x: 0, y: 0, on: false, t: 0 };
    function setAim(cx, cy, strength) {
      var r = box.getBoundingClientRect(), hx = r.left + r.width / 2, hy = r.top + r.height * .38;
      var nx = clamp((cx - hx) / (r.width * .9), -1, 1), ny = clamp((cy - hy) / (r.height * .9), -1, 1);
      aim.x = nx * (strength || 1); aim.y = ny * (strength || 1); aim.on = true; aim.t = performance.now();
    }
    var hoverIt = null;
    if (orb) {
      orb.addEventListener("pointerover", function (e) { var it = e.target.closest && e.target.closest(".orb__it"); if (it) hoverIt = it; });
      orb.addEventListener("pointerout", function (e) { var it = e.target.closest && e.target.closest(".orb__it"); if (it && it === hoverIt && !it.contains(e.relatedTarget)) hoverIt = null; });
      orb.addEventListener("focusin", function (e) { var it = e.target.closest && e.target.closest(".orb__it"); if (it) hoverIt = it; });
      orb.addEventListener("focusout", function () { hoverIt = null; });
    }
    window.addEventListener("pointermove", function (e) { if (e.pointerType !== "touch") setAim(e.clientX, e.clientY, .9); }, { passive: true });

    /* ---------- размер и цикл ---------- */
    var W = 1, H = 1;
    function layout() {
      var r = box.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
      R.setPixelRatio(clamp(window.devicePixelRatio || 1, 1.5, 2)); R.setSize(W, H, false);
      cam.aspect = W / H;
      // кадр: голова сверху, плечи срезаны диском снизу; узкий экран — чуть дальше
      cam.fov = 24; cam.updateProjectionMatrix();
    }
    layout();
    if (window.ResizeObserver) new ResizeObserver(layout).observe(box); else window.addEventListener("resize", layout);

    var yaw = 0, pitch = 0, T = 0, last = 0, visible = false, blinkAt = 2.2, scanAt = 1.2;
    function frame(now) {
      if (!visible || document.hidden) { last = 0; return; }
      if (!reduce) requestAnimationFrame(frame);
      var dt = last ? Math.min((now - last) / 1000, .05) : .016; last = now; T += dt;
      // куда смотреть
      var ty = 0, tp = 0;
      if (hoverIt) {
        var r = hoverIt.getBoundingClientRect(); setAim(r.left + r.width / 2, r.top + r.height / 2, 1.15);
      }
      if (aim.on && performance.now() - aim.t < 4000) { ty = aim.x * .62; tp = aim.y * .34; }
      else { ty = Math.sin(T * .35) * .22; tp = Math.sin(T * .27) * .05 - .02; }
      yaw = damp(yaw, clamp(ty, -.62, .62), hoverIt ? 7 : 4, dt); pitch = damp(pitch, clamp(tp, -.28, .34), hoverIt ? 7 : 4, dt);
      neck.rotation.set(pitch * .35, yaw * .35, 0);
      head.rotation.set(pitch * .7, yaw * .65, -yaw * .06);
      body.rotation.y = yaw * .08;
      // дыхание
      var br = Math.sin(T * 1.5);
      bot.position.y = br * .012; body.scale.set(1 + br * .004, 1, 1 + br * .004);
      // моргание
      var bk = 1;
      if (T > blinkAt) { var u = (T - blinkAt) / .16; bk = u < 1 ? Math.abs(1 - 2 * u) : 1; if (u >= 1) blinkAt = T + 2.4 + Math.random() * 3.2; }
      eyes.forEach(function (e) { e.e.scale.y = Math.max(.08, bk); e.gl.material.opacity = .45 + .3 * bk; });
      // луч сканера по визору сверху вниз
      var su = (T - scanAt) / 1.1;
      if (su > 0 && su < 1) {
        var y = .25 - .33 * sm(su), rr = rAt(y) * 1.022;
        scan.position.y = y + HB; scan.scale.set(rr, 1, rr); scan.material.opacity = Math.sin(su * PI) * .9;
      } else { scan.material.opacity = 0; if (su >= 1) scanAt = T + 3.5 + Math.random() * 2.5; }
      // жилы и ядро пульсируют, кольца на плечах медленно крутятся
      veins.forEach(function (m, i) { m.material.emissiveIntensity = 1.1 + .7 * Math.max(0, Math.sin(T * 2.6 - i * .7)); });
      cGl.material.opacity = .45 + .25 * Math.sin(T * 2.6);
      shoulderRings.forEach(function (a, i) { a.rotation.z = T * (i ? -.6 : .6); });
      R.render(scene, cam);
    }
    new IntersectionObserver(function (es) {
      var v = es[0].isIntersecting;
      if (v && !visible) { visible = true; requestAnimationFrame(frame); }
      else if (!v) visible = false;
    }, { threshold: .02 }).observe(box);
    document.addEventListener("visibilitychange", function () { if (!document.hidden && visible && !reduce) requestAnimationFrame(frame); });
    box.classList.add("is-ready");
    window.__svcBot = { render: function () { R.render(scene, cam); }, cam: cam, bot: bot };
  }
})();
