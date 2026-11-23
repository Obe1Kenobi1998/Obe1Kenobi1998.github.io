/* =====================================================================
   3D-РОБОТ блока «Опыт». Внешний вид — тот самый робот из Spline (сцена
   из компонента Splite), но все движения пишутся кодом: суставы робота
   (плечи, локти, бёдра, колени, стопы, голова) поворачиваются каждый кадр.
   • сидит вдалеке на коврике и строит башню из кубиков;
   • наводишь на него — поворачивает голову, отворачивается, спохватывается
     («!»), встаёт и подходит;
   • наводишь на значок — забирает его, и с каждым значком своя сценка:
     ломает, роняет, крутит на пальце, ставит на голову и т. д.
   Слои: пол и кубики (three.js) → робот (Spline) → значки (three.js).
   ===================================================================== */
(function () {
  "use strict";
  var card = document.getElementById("roboCard");
  if (!card) return;
  var topCv = document.getElementById("roboCanvas");
  var sceneBox = document.getElementById("roboScene");
  var appsBox = document.getElementById("apps");
  var appsHint = document.getElementById("appsHint");
  var sayEl = document.getElementById("roboSay");
  var ICONS = window.APP_ICONS || {};
  var APP_IDS = ["python", "csharp", "godot", "js", "html", "excel", "word", "pdf"];
  var RUNTIME = "https://unpkg.com/@splinetool/runtime@2.0.126/build/runtime.standalone.js";
  var SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;

  /* ---------- на телефоне сцена с роботом стоит прямо над значками ---------- */
  var textCol = card.querySelector(".splite__text"), mqN = window.matchMedia("(max-width: 980px)");
  function placeScene() {
    if (!textCol || !appsBox) return;
    if (mqN.matches) { if (sceneBox.parentNode !== textCol) textCol.insertBefore(sceneBox, appsBox); }
    else if (sceneBox.parentNode !== card) card.insertBefore(sceneBox, sayEl);
  }
  placeScene();
  if (mqN.addEventListener) mqN.addEventListener("change", placeScene); else if (mqN.addListener) mqN.addListener(placeScene);

  /* ---------- плитки-значки (работают и без 3D) ---------- */
  var tiles = {};
  APP_IDS.forEach(function (id) {
    var a = ICONS[id]; if (!a || !appsBox || !window.appIconSVG) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "app"; b.setAttribute("data-app", id);
    b.setAttribute("aria-label", a.say);
    b.innerHTML = window.appIconSVG(id, 52) + "<span>" + a.name + "</span>";
    appsBox.appendChild(b); tiles[id] = b;
  });

  var robot = null, want = null, leaveT = 0, plain = false, dead = false;
  var HINT = appsHint ? appsHint.textContent : "";
  function setWant(id) {
    want = id;
    Object.keys(tiles).forEach(function (k) { tiles[k].classList.toggle("is-want", k === id); });
    if (plain && appsHint) appsHint.textContent = id ? ICONS[id].say : HINT;
    if (robot) robot.poke();
  }
  if (appsBox) {
    appsBox.addEventListener("pointerover", function (e) {
      var b = e.target.closest(".app"); if (!b || e.pointerType === "touch") return;
      clearTimeout(leaveT); setWant(b.getAttribute("data-app"));
    });
    appsBox.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "touch") return;
      clearTimeout(leaveT); leaveT = setTimeout(function () { setWant(null); }, 450);
    });
    appsBox.addEventListener("click", function (e) {
      var b = e.target.closest(".app"); if (!b) return;
      var id = b.getAttribute("data-app");
      if (coarse || e.pointerType === "touch" || e.detail === 0) setWant(want === id ? null : id);
      else setWant(id);
    });
  }

  function fallback() {
    if (dead) return;
    dead = true; plain = true; robot = null;
    sceneBox.classList.remove("is-loading", "is-ready");
    sceneBox.classList.add("is-fallback");
    card.classList.remove("robo-ready");
    Array.prototype.forEach.call(sceneBox.querySelectorAll("canvas"), function (c) { c.remove(); });
    if (appsHint) appsHint.textContent = want ? ICONS[want].say : HINT;
  }
  if (reduce) return fallback();

  sceneBox.classList.add("is-loading");
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
    var timer = setTimeout(fallback, 45000);
    var groundCv = document.createElement("canvas"); groundCv.className = "robo__ground";
    var spCv = document.createElement("canvas"); spCv.className = "robo__spline";
    sceneBox.appendChild(groundCv); sceneBox.appendChild(spCv);
    Promise.all([loadThree(), import(RUNTIME)]).then(function (r) {
      if (dead) return;
      var app = new r[1].Application(spCv);
      return app.load(SCENE).then(function () {
        clearTimeout(timer);
        if (dead) { try { app.dispose(); } catch (e) {} return; }
        init(app, groundCv);
      });
    }).catch(function (err) { clearTimeout(timer); if (window.console) console.error(err); fallback(); });
  }, { rootMargin: "700px 0px" });
  io0.observe(card);

  /* =================================================================== */
  function init(app, groundCv) {
    var THREE = window.THREE;
    if (THREE.ColorManagement && "legacyMode" in THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    var V3 = THREE.Vector3, Q = THREE.Quaternion, M4 = THREE.Matrix4, PI = Math.PI;
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function lerp(a, b, k) { return a + (b - a) * k; }
    function sm(k) { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); }            // плавный шаг 0→1
    function seg(t, a, b) { return sm((t - a) / (b - a)); }                      // 0→1 на отрезке [a, b]
    function easeIO(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
    function easeOut(k) { return 1 - Math.pow(1 - k, 3); }
    function lin(k) { return k; }
    function damp(c, t, s, dt) { return c + (t - c) * (1 - Math.exp(-s * dt)); }
    function angDiff(a, b) { var d = (b - a) % (2 * PI); if (d > PI) d -= 2 * PI; if (d < -PI) d += 2 * PI; return d; }
    function dampAng(c, t, s, dt) { return c + angDiff(c, t) * (1 - Math.exp(-s * dt)); }
    function bez(a, c, b, k, out) {
      var u = 1 - k;
      return out.set(u * u * a.x + 2 * u * k * c.x + k * k * b.x, u * u * a.y + 2 * u * k * c.y + k * k * b.y, u * u * a.z + 2 * u * k * c.z + k * k * b.z);
    }

    /* ---------- робот из Spline: суставы ---------- */
    app.stop();                                   // свои события Spline выключены, рисуем сами
    var S = app._scene, spCam = app._camera;
    var bot = S.getObjectByName("Bot");
    var topP = bot.getObjectByName("Top part"), bottom = bot.getObjectByName("Bottom"), head = bot.getObjectByName("Head");
    function kid(p, name) { for (var i = 0; i < p.children.length; i++) if (p.children[i].name === name) return p.children[i]; return null; }
    var armRoot = { L: kid(topP, "Hand"), R: kid(topP, "Hand Instance") };
    var legRoot = { L: kid(bottom, "Leg Left"), R: kid(bottom, "Leg Left Instance") };
    if (!head || !armRoot.L || !armRoot.R || !legRoot.L || !legRoot.R) throw new Error("rig not found");
    head.rotation.order = "YXZ";
    head.rotation.set(0, 0, 0); head.updateMatrix();
    topP.rotation.set(0, 0, 0); topP.updateMatrix();
    bot.updateMatrixWorld(true);

    var _m = new M4(), _m2 = new M4(), _v = new V3(), _v2 = new V3(), _q = new Q(), _dq = new Q(), _w = new V3(), _c = new V3();
    function wpos(o, out) { var e = o.matrixWorld.elements; return out.set(e[12], e[13], e[14]); }
    function toLocal(o, pW) { _m.fromArray(o.matrixWorld.elements).invert(); return pW.clone().applyMatrix4(_m); }
    function dirToLocal(o, dW) { _m.fromArray(o.matrixWorld.elements).invert(); return dW.clone().transformDirection(_m); }
    function boxCenter(o) {
      var g = o.geometry; if (!g.boundingBox) g.computeBoundingBox();
      var b = g.boundingBox; _m.fromArray(o.matrixWorld.elements);
      return new V3((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2).applyMatrix4(_m);
    }
    // пол и масштаб
    var FLOOR = 1e9;
    bot.traverse(function (o) {
      if (!o.isMesh || !o.geometry) return;
      var g = o.geometry; if (!g.boundingBox) g.computeBoundingBox();
      var b = g.boundingBox; _m.fromArray(o.matrixWorld.elements);
      for (var i = 0; i < 8; i++) { _v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(_m); FLOOR = Math.min(FLOOR, _v.y); }
    });
    var BOT0 = bot.position.clone ? new V3(bot.position.x, bot.position.y, bot.position.z) : null;
    var hipY = wpos(legRoot.L, new V3()).y;
    var K = (hipY - FLOOR) / 1.01;                 // 1 «наша» единица в единицах Spline
    var HEAD_POS = new V3(head.position.x, head.position.y, head.position.z);
    var HEAD_TOP = 0;
    head.traverse(function (o) {
      if (!o.isMesh || !o.geometry) return;
      var g = o.geometry; if (!g.boundingBox) g.computeBoundingBox();
      var b = g.boundingBox; _m.fromArray(o.matrixWorld.elements);
      for (var i = 0; i < 8; i++) { _v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(_m); HEAD_TOP = Math.max(HEAD_TOP, _v.y - wpos(head, _v2).y); }
    });

    function restQ(o) { return new Q(o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w); }
    var JOINTS = [];
    function joint(o) { var j = { o: o, q: restQ(o) }; JOINTS.push(j); return o; }
    function makeArm(side, rootO) {
      var arm = joint(rootO.getObjectByName("arm")), fore = joint(rootO.getObjectByName("forearm"));
      var handMesh = null; fore.children.forEach(function (c) { if (c.name === "Hand" && c.isMesh) handMesh = c; });
      var grip = handMesh ? boxCenter(handMesh) : wpos(fore, new V3()).add(new V3(0, -60, 30));
      var A0 = wpos(arm, new V3()), F0 = wpos(fore, new V3());
      return { side: side, arm: arm, fore: fore, bA: toLocal(arm, F0), bF: toLocal(fore, grip),
               L1: A0.distanceTo(F0), L2: F0.distanceTo(grip), w: 0, target: new V3(), poleL: new V3(side * .9, -.25, -.6) };
    }
    function makeLeg(side, rootO) {
      var hip = joint(rootO), shin = joint(rootO.getObjectByName("shin")), foot = joint(rootO.getObjectByName("Foot"));
      var H0 = wpos(hip, new V3()), S0 = wpos(shin, new V3()), F0 = wpos(foot, new V3());
      _m.fromArray(bot.matrixWorld.elements);
      var fwd = new V3(0, 0, 1).transformDirection(_m);
      return { side: side, hip: hip, shin: shin, foot: foot, bT: toLocal(hip, S0), bS: toLocal(shin, F0), bFt: dirToLocal(foot, fwd) };
    }
    var AL = makeArm(1, armRoot.L), AR = makeArm(-1, armRoot.R), LL = makeLeg(1, legRoot.L), LR = makeLeg(-1, legRoot.R);

    function aim(j, bLocal, dirW) {
      _m.fromArray(j.parent.matrixWorld.elements).invert();
      _w.copy(dirW).transformDirection(_m);
      _q.set(j.quaternion.x, j.quaternion.y, j.quaternion.z, j.quaternion.w);
      _m2.fromArray(j.matrix.elements);
      _c.copy(bLocal).transformDirection(_m2);          // с учётом зеркального масштаба сустава
      _dq.setFromUnitVectors(_c, _w); _q.premultiply(_dq);
      j.quaternion.set(_q.x, _q.y, _q.z, _q.w);
      j.updateMatrix(); j.updateMatrixWorld(true);
    }

    /* ---------- три холста: пол/кубики, робот, значки ---------- */
    function mkRenderer(canvas) {
      var r = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
      r.setClearColor(0x000000, 0); return r;
    }
    var gR = mkRenderer(groundCv), tR = mkRenderer(topCv);
    var gScene = new THREE.Scene(), tScene = new THREE.Scene();
    function mkCam() { var c = new THREE.PerspectiveCamera(30, 1, 1, 1e5); c.matrixAutoUpdate = false; c.matrixWorldAutoUpdate = false; return c; }
    var gCam = mkCam(), tCam = mkCam();
    function envFor(renderer, scene) {
      var env = new THREE.Scene();
      var room = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x7d7466, side: THREE.BackSide }));
      room.scale.set(14, 9, 14); room.position.y = 3; env.add(room);
      [[8, 3, 0, 7.4, 0, 0, PI / 2, 3.2], [1.2, 6, -6.8, 3, 0, PI / 2, 0, 6], [1.2, 6, 6.8, 3, -1, -PI / 2, 0, 4], [5, 2, 0, 2.5, 6.8, PI, 0, 2.2]].forEach(function (p) {
        var m = new THREE.Mesh(new THREE.PlaneGeometry(p[0], p[1]), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(p[7]) }));
        m.position.set(p[2], p[3], p[4]); m.rotation.set(p[6], p[5], 0); env.add(m);
      });
      var pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(env, .035).texture; pm.dispose();
      scene.add(new THREE.HemisphereLight(0xfff4e0, 0x8a7a63, .6));
      var d = new THREE.DirectionalLight(0xfff1dc, 1); d.position.set(3, 5, 4); scene.add(d);
    }
    envFor(gR, gScene); envFor(tR, tScene);
    function canvasTex(size, draw) {
      var c = document.createElement("canvas"); c.width = c.height = size; draw(c.getContext("2d"), size);
      var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
    }
    var blobTex = canvasTex(128, function (x, s) {
      var g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, "rgba(40,28,10,.5)"); g.addColorStop(.55, "rgba(40,28,10,.18)"); g.addColorStop(1, "rgba(40,28,10,0)");
      x.fillStyle = g; x.fillRect(0, 0, s, s);
    });
    function blob(parent, op) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: op || 1 }));
      m.rotation.x = -PI / 2; m.renderOrder = 2; parent.add(m); return m;
    }

    // пол-сетка
    (function () {
      var t = canvasTex(1024, function (x, s) {
        x.strokeStyle = "rgba(120,90,40,.5)"; x.lineWidth = 2;
        for (var i = 0; i <= 32; i++) { var p = i * s / 32; x.beginPath(); x.moveTo(p, 0); x.lineTo(p, s); x.stroke(); x.beginPath(); x.moveTo(0, p); x.lineTo(s, p); x.stroke(); }
        x.globalCompositeOperation = "destination-in";
        var g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        g.addColorStop(0, "rgba(0,0,0,.5)"); g.addColorStop(.55, "rgba(0,0,0,.15)"); g.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = g; x.fillRect(0, 0, s, s);
      });
      t.anisotropy = Math.min(8, gR.capabilities.getMaxAnisotropy());
      var floor = new THREE.Mesh(new THREE.PlaneGeometry(16 * K, 16 * K), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: .45 }));
      floor.rotation.x = -PI / 2; floor.position.set(BOT0.x, FLOOR, BOT0.z - 4.5 * K); gScene.add(floor);
    })();

    /* ---------- корень робота ---------- */
    var NEAR = new V3(BOT0.x, FLOOR, BOT0.z);
    var FAR = new V3(BOT0.x + .55 * K, FLOOR, BOT0.z - 8.5 * K), FAR_YAW = .85;
    var root = { pos: NEAR.clone(), yaw: 0 };
    var _ry = new V3(0, 1, 0);
    function RL(x, y, z, out) { return (out || new V3()).set(x * K, y * K, z * K).applyAxisAngle(_ry, root.yaw).add(root.pos); }
    var shadow = blob(gScene, .9);

    /* ---------- позы (в «наших» единицах и углах) ---------- */
    var KEYS = ["py", "lean", "twist", "tilt", "hlx", "hly", "hlz", "kl", "al", "hrx", "hry", "hrz", "kr", "ar", "slx", "slz", "el", "srx", "srz", "er"];
    function P(o) { var p = {}; KEYS.forEach(function (k) { p[k] = o[k] || 0; }); return p; }
    var STAND = P({ py: 1.04, lean: .03, hly: .05, hry: -.05, slx: .05, srx: .05, slz: .1, srz: -.1, el: -.3, er: -.3 });
    var SIT = P({ py: .3, lean: .45, hlx: -1.17, hly: .22, kl: 2.7, al: -1.45, hrx: -1.17, hry: -.22, kr: 2.7, ar: -1.45, slx: -.5, srx: -.5, slz: .2, srz: -.2, el: -.9, er: -.9 });
    var CROUCH = P({ py: .58, lean: .6, hlx: -1.45, hly: .1, kl: 2.05, al: -.6, hrx: -1.45, hry: -.1, kr: 2.05, ar: -.6, slx: -.5, srx: -.5, slz: .2, srz: -.2, el: -.5, er: -.5 });
    var cur = P(SIT);

    /* ---------- таймлайн ---------- */
    var T = 0, anims = [], tok = 0, playTok = 0;
    function tween(dur, fn, ez, done) { var a = { t0: T, dur: dur, fn: fn, ez: ez || easeIO, done: done, tok: tok }; anims.push(a); return a; }
    function later(sec, fn) { return tween(sec, function () {}, lin, fn); }
    function ptween(dur, fn, ez, done) { var a = tween(dur, fn, ez, done); a.ptok = playTok; return a; }
    function plater(sec, fn) { return ptween(sec, function () {}, lin, fn); }
    function poseTo(target, dur, done) {
      var from = P(cur);
      return tween(dur, function (k) { KEYS.forEach(function (key) { cur[key] = lerp(from[key], target[key], k); }); }, easeIO, done);
    }
    function runAnims() {
      for (var i = 0; i < anims.length; i++) {
        var a = anims[i];
        if (a.tok !== tok || (a.ptok !== undefined && a.ptok !== playTok)) { anims.splice(i--, 1); continue; }
        var k = a.dur > 0 ? clamp((T - a.t0) / a.dur, 0, 1) : 1;
        a.fn(a.ez(k));
        if (k >= 1) { anims.splice(i--, 1); if (a.done && a.tok === tok) a.done(); }
      }
    }

    /* ---------- коврик и кубики (в «наших» единицах внутри группы масштаба K) ---------- */
    function mkPlay(scene) { var g = new THREE.Group(); g.position.copy(FAR); g.rotation.y = FAR_YAW; g.scale.setScalar(K); scene.add(g); return g; }
    var play = mkPlay(gScene), playTop = mkPlay(tScene);
    (function () {
      var t = canvasTex(256, function (x, s) {
        var g = x.createRadialGradient(s / 2, s / 2, s * .1, s / 2, s / 2, s / 2);
        g.addColorStop(0, "rgba(255,250,240,.95)"); g.addColorStop(.8, "rgba(246,236,218,.85)"); g.addColorStop(1, "rgba(246,236,218,0)");
        x.fillStyle = g; x.fillRect(0, 0, s, s);
        x.strokeStyle = "rgba(195,146,51,.75)"; x.lineWidth = 3; x.beginPath(); x.arc(s / 2, s / 2, s * .4, 0, 7); x.stroke();
        x.strokeStyle = "rgba(195,146,51,.35)"; x.lineWidth = 2; x.beginPath(); x.arc(s / 2, s / 2, s * .33, 0, 7); x.stroke();
      });
      var rug = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      rug.rotation.x = -PI / 2; rug.position.set(0, .002, .3); rug.renderOrder = 1; play.add(rug);
    })();
    function roundedBox(s) {
      var b = s * .14, w = s - 2 * b, r = w * .2, x = -w / 2, y = -w / 2, sh = new THREE.Shape();
      sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r); sh.lineTo(x + w, y + w - r);
      sh.quadraticCurveTo(x + w, y + w, x + w - r, y + w); sh.lineTo(x + r, y + w); sh.quadraticCurveTo(x, y + w, x, y + w - r);
      sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
      var g = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 5 });
      g.center(); return g;
    }
    var CUBES = [[0xd4a84b, .15, .9, .3], [0xf3ece0, .135, .1, .45], [0x1c1b19, .16, .4, .3], [0x7fae86, .14, .1, .4], [0xd9775a, .13, .1, .4]];
    var TOWER = new V3(-.15, 0, .62);
    var cubes = CUBES.map(function (c) {
      var m = new THREE.Mesh(roundedBox(c[1]), new THREE.MeshPhysicalMaterial({ color: c[0], metalness: c[2], roughness: c[3], clearcoat: .6, clearcoatRoughness: .2 }));
      play.add(m);
      var sh = blob(play, .8);
      return { m: m, s: c[1], sh: sh, where: "pile" };
    });
    var tower = [];
    function towerTop() { var h = 0; tower.forEach(function (c) { h += c.s; }); return h; }
    function pileSpot(c) {
      for (var i = 0; i < 30; i++) {
        var p = new V3(.04 + Math.random() * .2, c.s / 2, .52 + Math.random() * .26), ok = true;
        cubes.forEach(function (o) { if (o !== c && o.where !== "tower" && o.m.position.distanceTo(p) < .18) ok = false; });
        if (p.distanceTo(new V3(TOWER.x, p.y, TOWER.z)) < .21) ok = false;
        if (ok) return p;
      }
      return new V3(.14, c.s / 2, .7);
    }
    function resetCubes() {
      tower = [];
      cubes.forEach(function (c, i) {
        play.add(c.m); c.where = "pile"; c.m.position.set(-50, 0, 0); c.m.rotation.set(0, 0, 0);
        if (i < 2) { c.where = "tower"; tower.push(c); c.m.position.set(TOWER.x, towerTop() - c.s / 2, TOWER.z); c.m.rotation.y = (Math.random() - .5) * .5; }
      });
      cubes.forEach(function (c) { if (c.where === "pile") { c.m.position.copy(pileSpot(c)); c.m.rotation.y = Math.random() * PI; } });
    }
    resetCubes();
    function syncCubeShadows() {
      cubes.forEach(function (c) {
        var h = Math.max(0, c.m.position.y - c.s / 2);
        c.sh.position.set(c.m.position.x, .004, c.m.position.z);
        var k = c.s * 2.3 * (1 + h * 1.5); c.sh.scale.set(k, k, 1);
        c.sh.material.opacity = .75 * clamp(1 - h * 1.6, .15, 1) * (c.where === "tower" && tower.indexOf(c) > 0 ? .25 : 1);
      });
    }

    /* ---------- состояние ---------- */
    var st = "play";                 // play | wake | walk | stand
    var bump = 0, walkW = 0, walkAmp = 1, walkPh = 0, crouchW = 0;
    var walk = { on: false, dest: new V3(), speed: 2.1, done: null };
    var look = { yaw: 0, pitch: 0, tilt: 0, tilt0: 0, speed: 5, mode: "cubes", target: new V3() };
    var held = null, busy = false, carry = null, focusCube = null;
    var ptr = { on: false, x: 0, y: 0, ndc: new THREE.Vector2() };
    var W = 1, H = 1, visible = false, hiddenAt = 0;

    function placeRootFar() { root.pos.copy(FAR); root.yaw = FAR_YAW; cur = P(SIT); look.yaw = -.3; look.pitch = .45; }
    placeRootFar();

    /* ---------- размеры холстов и синхронизация камер со Spline ---------- */
    function layout() {
      var cr = card.getBoundingClientRect(), sr = sceneBox.getBoundingClientRect();
      W = Math.max(1, cr.width); H = Math.max(1, cr.height);
      var pr = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 1.75);
      tR.setPixelRatio(pr); tR.setSize(W, H, false);
      gR.setPixelRatio(pr); gR.setSize(Math.max(1, sr.width), Math.max(1, sr.height), false);
    }
    layout();
    window.addEventListener("resize", layout);
    if (window.ResizeObserver) new ResizeObserver(function () { layout(); }).observe(card);
    var _P = new M4(), _MW = new M4(), _A = new M4();
    // камера Spline под нашим контролем: ракурс как в оригинальной сцене
    function setSplineCam() {
      var sr = sceneBox.getBoundingClientRect();
      spCam.position.set(BOT0.x, 168, 1090);
      spCam.rotation.set(0, 0, 0);
      spCam.fov = 45; spCam.zoom = 2;
      spCam.aspect = Math.max(.2, sr.width / Math.max(1, sr.height));
      spCam.updateProjectionMatrix();
      spCam.updateMatrix(); spCam.updateMatrixWorld(true);
    }
    function syncCams() {
      var cr = card.getBoundingClientRect(), sr = sceneBox.getBoundingClientRect();
      _P.fromArray(spCam.projectionMatrix.elements);
      _MW.fromArray(spCam.matrixWorld.elements);
      [gCam, tCam].forEach(function (c) {
        c.matrixWorld.copy(_MW); c.matrixWorldInverse.copy(_MW).invert(); c.position.setFromMatrixPosition(_MW);
      });
      gCam.projectionMatrix.copy(_P); gCam.projectionMatrixInverse.copy(_P).invert();
      var sx = sr.width / cr.width, sy = sr.height / cr.height;
      var tx = 2 * (sr.left - cr.left + sr.width / 2) / cr.width - 1;
      var ty = 1 - 2 * (sr.top - cr.top + sr.height / 2) / cr.height;
      _A.set(sx, 0, 0, tx, 0, sy, 0, ty, 0, 0, 1, 0, 0, 0, 0, 1);
      tCam.projectionMatrix.multiplyMatrices(_A, _P); tCam.projectionMatrixInverse.copy(tCam.projectionMatrix).invert();
    }
    function toScreen(v) { var p = v.clone().project(tCam); return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H }; }
    function pointAtDepth(px, py, dist) {
      var d = new V3(px / W * 2 - 1, -(py / H * 2 - 1), .5).unproject(tCam).sub(tCam.position).normalize();
      return tCam.position.clone().addScaledVector(d, dist);
    }

    /* ---------- реплики ---------- */
    var sayT = 0;
    function say(text, ms, kind) {
      clearTimeout(sayT);
      sayEl.className = "robo-say is-on" + (kind ? " robo-say--" + kind : "");
      sayEl.textContent = text;
      if (ms) sayT = setTimeout(hideSay, ms);
    }
    function hideSay() { clearTimeout(sayT); sayEl.classList.remove("is-on"); }
    var headTopW = new V3();
    function placeSay() {
      if (!sayEl.classList.contains("is-on")) return;
      _m.fromArray(head.matrixWorld.elements);
      headTopW.set(0, (HEAD_TOP + 30) / .8, 0).applyMatrix4(_m);
      if (held && held.lift) headTopW.y += held.lift;
      var s = toScreen(headTopW), bh = sayEl.offsetHeight + 16, bw = sayEl.offsetWidth / 2 + 12;
      var side = s.y < bh;                                  // над головой нет места — облачко сбоку
      sayEl.classList.toggle("robo-say--side", side);
      var x = side ? s.x - bw - 40 : s.x, y = side ? s.y + bh * .9 : s.y;
      sayEl.style.transform = "translate(" + Math.round(clamp(x, bw, W - bw)) + "px," + Math.round(clamp(y, bh, H)) + "px)";
    }
    var JOKES = [
      "Собираю EXE быстрее, чем Windows ищет принтер",
      "Баг — это фича, которая стесняется",
      "Кубики — мой любимый фреймворк",
      "Ctrl+S — мой единственный вид спорта",
      "Обещаю: никакого «у меня на компе работало»",
      "Пока я шёл, Windows скачал обновление"
    ];

    /* ---------- голова ---------- */
    var _lt = new V3(), _lv = new V3();
    function lookTarget(out) {
      if (look.mode === "camera") return out.copy(tCam.position);
      if (look.mode === "cursor") return ptr.on ? out.copy(pointAtDepth(ptr.x, ptr.y, root.pos.distanceTo(tCam.position) * .55)) : out.copy(tCam.position);
      if (look.mode === "cubes") return focusCube ? focusCube.m.getWorldPosition(out) : play.localToWorld(out.set(.05, .1, .62));
      if (look.mode === "icon" && held) return held.g.getWorldPosition(out);
      return out.copy(look.target);
    }
    function updateLook(dt) {
      lookTarget(_lt);
      _m.fromArray(topP.matrixWorld.elements).invert();
      _lv.copy(_lt).applyMatrix4(_m).sub(HEAD_POS);
      var ty = clamp(Math.atan2(_lv.x, _lv.z), -1.2, 1.2);
      var tp = clamp(-Math.atan2(_lv.y, Math.sqrt(_lv.x * _lv.x + _lv.z * _lv.z)), -.6, .7);
      look.yaw = damp(look.yaw, ty, look.speed, dt);
      look.pitch = damp(look.pitch, tp, look.speed, dt);
      look.tilt = damp(look.tilt, look.tilt0, 4, dt);
    }

    /* ---------- применение позы к суставам робота ---------- */
    var _qa = new Q(), _qb = new Q(), _e = new THREE.Euler(), _d1 = new V3(), _d2 = new V3(), _d3 = new V3();
    var _S = new V3(), _dd = new V3(), _n = new V3(), _u = new V3(), _E = new V3(), _f = new V3(), _pole = new V3(), _ik1 = new V3(), _ik2 = new V3();
    function frameDir(o, d) { _m2.fromArray(o.matrixWorld.elements); return d.transformDirection(_m2); }
    function ikDirs(A, upOut, foreOut) {
      wpos(A.arm, _S);
      _dd.subVectors(A.target, _S);
      var d = clamp(_dd.length(), Math.abs(A.L1 - A.L2) + 1, A.L1 + A.L2 - .5);
      _dd.normalize();
      _pole.copy(A.poleL).applyAxisAngle(_ry, root.yaw).normalize();
      _n.crossVectors(_dd, _pole); if (_n.lengthSq() < 1e-6) _n.set(1, 0, 0); _n.normalize();
      var ang = Math.acos(clamp((A.L1 * A.L1 + d * d - A.L2 * A.L2) / (2 * A.L1 * d), -1, 1));
      upOut.copy(_dd).applyAxisAngle(_n, ang);
      _E.copy(_S).addScaledVector(upOut, A.L1);
      foreOut.copy(_S).addScaledVector(_dd, d).sub(_E).normalize();
    }
    function applyRig(p) {
      JOINTS.forEach(function (j) { j.o.quaternion.set(j.q.x, j.q.y, j.q.z, j.q.w); j.o.updateMatrix(); });
      bot.position.set(root.pos.x, BOT0.y + (p.py - 1.04 + bump) * K, root.pos.z); bot.rotation.set(0, root.yaw, 0); bot.updateMatrix();
      topP.rotation.set(p.lean, p.twist, p.tilt); topP.updateMatrix();
      head.rotation.set(look.pitch, look.yaw, look.tilt); head.updateMatrix();
      bot.updateMatrixWorld(true);
      [[LL, p.hlx, p.hly, p.hlz, p.kl, p.al], [LR, p.hrx, p.hry, p.hrz, p.kr, p.ar]].forEach(function (L) {
        var leg = L[0];
        _qa.setFromEuler(_e.set(L[1], L[2], L[3], "YXZ"));
        frameDir(bottom, _d1.set(0, -1, 0).applyQuaternion(_qa));
        _qb.setFromEuler(_e.set(L[4], 0, 0)); _qa.multiply(_qb);
        frameDir(bottom, _d2.set(0, -1, 0).applyQuaternion(_qa));
        _qb.setFromEuler(_e.set(L[5], 0, 0)); _qa.multiply(_qb);
        frameDir(bottom, _d3.set(0, 0, 1).applyQuaternion(_qa));
        aim(leg.hip, leg.bT, _d1); aim(leg.shin, leg.bS, _d2); aim(leg.foot, leg.bFt, _d3);
      });
      [[AL, p.slx, p.slz, p.el], [AR, p.srx, p.srz, p.er]].forEach(function (a) {
        var A = a[0];
        _qa.setFromEuler(_e.set(a[1], 0, a[2]));
        frameDir(topP, _d1.set(0, -1, 0).applyQuaternion(_qa));
        _qb.setFromEuler(_e.set(a[3], 0, 0)); _qa.multiply(_qb);
        frameDir(topP, _d2.set(0, -1, 0).applyQuaternion(_qa));
        if (A.w > .001) {
          ikDirs(A, _ik1, _ik2);
          _d1.lerp(_ik1, A.w).normalize(); _d2.lerp(_ik2, A.w).normalize();
        }
        aim(A.arm, A.bA, _d1);
        if (A.w > .001) { ikDirs(A, _ik1, _ik2); _d2.lerp(_ik2, A.w).normalize(); }   // локоть после поворота плеча
        aim(A.fore, A.bF, _d2);
      });
    }

    /* ---------- значки: две половинки (умеют «ломаться») ---------- */
    var ICON = .3, texCache = {};
    var ZIG = [[.02, 1], [-.035, .55], [.03, .12], [-.025, -.24], [.035, -.6], [-.01, -1]];
    function halfShape(side) {
      var h = ICON / 2, r = ICON * .25, s = new THREE.Shape(), i;
      if (side < 0) {
        s.moveTo(ZIG[0][0], h); s.lineTo(-h + r, h); s.quadraticCurveTo(-h, h, -h, h - r); s.lineTo(-h, -h + r); s.quadraticCurveTo(-h, -h, -h + r, -h);
        s.lineTo(ZIG[5][0], -h); for (i = 4; i >= 0; i--) s.lineTo(ZIG[i][0], ZIG[i][1] * h);
      } else {
        s.moveTo(ZIG[0][0], h); for (i = 1; i < 6; i++) s.lineTo(ZIG[i][0], ZIG[i][1] * h);
        s.lineTo(h - r, -h); s.quadraticCurveTo(h, -h, h, -h + r); s.lineTo(h, h - r); s.quadraticCurveTo(h, h, h - r, h); s.lineTo(ZIG[0][0], h);
      }
      return s;
    }
    var HALF = [-1, 1].map(function (side) {
      var sh = halfShape(side);
      var body = new THREE.ExtrudeGeometry(sh, { depth: .028, bevelEnabled: false, curveSegments: 8 }); body.translate(0, 0, -.029);
      return { body: body, face: new THREE.ShapeGeometry(sh, 8) };
    });
    function iconTex(id) {
      if (texCache[id]) return texCache[id];
      var t = new THREE.CanvasTexture(window.appIconCanvas(id, 256));
      t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
      t.repeat.set(1 / ICON, 1 / ICON); t.offset.set(.5, .5);
      return (texCache[id] = t);
    }
    function makeIcon(id) {
      var a = ICONS[id], g = new THREE.Group(), bodyMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(a.c2), metalness: .2, roughness: .3, clearcoat: 1, clearcoatRoughness: .1 });
      var faceMat = new THREE.MeshBasicMaterial({ map: iconTex(id), toneMapped: false });
      g.halves = HALF.map(function (h) {
        var hg = new THREE.Group();
        hg.add(new THREE.Mesh(h.body, bodyMat));
        var f = new THREE.Mesh(h.face, faceMat); f.position.z = .001; hg.add(f);
        g.add(hg); return hg;
      });
      tScene.add(g); return g;
    }
    function domPoint(tile) {
      var cr = card.getBoundingClientRect(), ic = tile.querySelector(".app-ico") || tile, r = ic.getBoundingClientRect();
      var px = r.left - cr.left + r.width / 2, py = r.top - cr.top + r.height / 2;
      var dist = NEAR.distanceTo(tCam.position) * .62;
      var pos = pointAtDepth(px, py, dist);
      var wpp = 2 * dist / (tCam.projectionMatrix.elements[5] * H);       // единиц мира на пиксель на этой глубине
      return { pos: pos, s: Math.max(.15, r.width * wpp / (ICON * K)) };
    }
    var _o = new V3();
    function edgeW(g, side, out) {   // кромка нужной половинки — туда кладётся рука
      var h = g.halves[side < 0 ? 0 : 1];
      return h.localToWorld(out.set(side * (ICON / 2 + .02), -.03, 0));
    }
    function faceCam(g) { g.lookAt(tCam.position); }

    var HOLD = [0, 1.3, .42];
    var pathFrom = new V3(), pathCtl = new V3(), _hp = new V3(), _hw = new V3();
    function grab(id) {
      var tile = tiles[id]; if (!tile) return;
      busy = true; hideSay();
      var g = makeIcon(id);
      held = { id: id, g: g, tile: tile, phase: "fly", t: 0, said: {}, lift: 0 };
      tile.classList.add("is-taken");
      var s0 = domPoint(tile); g.position.copy(s0.pos); g.scale.setScalar(s0.s * K);
      look.mode = "icon"; look.speed = 7;
      tween(.8, function (k) {
        var src = domPoint(tile); RL(HOLD[0], HOLD[1], HOLD[2], _hw);
        pathCtl.copy(src.pos).lerp(_hw, .5); pathCtl.y += .5 * K;
        bez(src.pos, pathCtl, _hw, k, g.position);
        g.scale.setScalar(lerp(src.s, 1, k) * K);
        faceCam(g); g.rotateY((1 - k) * 2.2);
        AL.w = AR.w = clamp((k - .3) / .6, 0, 1);
        edgeW(g, 1, AL.target); edgeW(g, -1, AR.target);
      }, easeIO, function () { held.phase = "act"; held.t = 0; busy = false; });
    }
    function release() {
      var h = held; if (!h) return;
      busy = true; h.phase = "back"; hideSay();
      look.mode = "icon"; look.speed = 7; look.tilt0 = 0; h.lift = 0;
      var cw0 = crouchW; tween(.45, function (k) { crouchW = cw0 * (1 - k); }, easeIO);
      var from = h.g.position.clone(), q0 = h.g.quaternion.clone(), gap0 = h.g.halves[1].position.x, rot0 = h.g.halves[1].rotation.z, qT = new Q();
      var w0 = AL.w, w1 = AR.w;
      tween(.7, function (k) {
        var dst = domPoint(h.tile);
        pathCtl.copy(from).lerp(dst.pos, .5); pathCtl.y += .45 * K;
        bez(from, pathCtl, dst.pos, k, h.g.position);
        h.g.scale.setScalar(lerp(1, dst.s, k) * K);
        faceCam(h.g); qT.copy(h.g.quaternion); h.g.quaternion.copy(q0).slerp(qT, Math.min(1, k * 2));
        h.g.halves.forEach(function (hh, i) { var s = i ? 1 : -1; hh.position.set(s * gap0 * (1 - k), 0, 0); hh.rotation.set(0, 0, s * rot0 * (1 - k)); });
        AL.w = w0 * (1 - Math.min(1, k * 2)); AR.w = w1 * (1 - Math.min(1, k * 2));
      }, easeIO, function () {
        tScene.remove(h.g);
        h.g.traverse(function (o) { if (o.material) o.material.dispose(); });
        h.tile.classList.remove("is-taken");
        held = null; busy = false; look.mode = "cursor"; look.speed = 5;
      });
    }
    function dropHeldNow() {
      if (!held) return;
      tScene.remove(held.g); held.tile.classList.remove("is-taken"); held = null; busy = false;
      AL.w = AR.w = 0;
    }

    /* ---------- сценки со значками: у каждого своя ---------- */
    var _p = new V3(), _p2 = new V3(), _tan = new V3();
    function holdAt(g, x, y, z) { RL(x, y, z, g.position); faceCam(g); }
    function handsOn(g, w) { AL.w = AR.w = w == null ? 1 : w; edgeW(g, 1, AL.target); edgeW(g, -1, AR.target); }
    function halves(g, gap, rot) { g.halves[0].position.set(-gap, 0, 0); g.halves[0].rotation.set(0, 0, rot); g.halves[1].position.set(gap, 0, 0); g.halves[1].rotation.set(0, 0, -rot); }
    function once(h, key, at, fn) { if (h.t >= at && !h.said[key]) { h.said[key] = 1; fn(); } }
    var ACTS = {
      // ломает пополам, пугается и чинит обратно
      python: function (h, t) {
        var g = h.g, bob = Math.sin(t * 2) * .01;
        holdAt(g, 0, 1.2 + bob, .4);
        var shake = t > .7 && t < 1.3 ? Math.sin(t * 60) * .04 * seg(t, .7, 1.2) : 0;
        g.rotateZ(shake);
        var gap = .05 * seg(t, 1.3, 1.5) * (1 - seg(t, 2.7, 3.1)), rot = .38 * seg(t, 1.3, 1.5) * (1 - seg(t, 2.7, 3.1));
        halves(g, gap, rot);
        handsOn(g);
        once(h, "crack", 1.3, function () { tween(.3, function (k) { bump = Math.sin(k * PI) * .03; }, lin); say("Ой… сломал 😬", 1500, "info"); look.mode = "camera"; look.tilt0 = -.18; });
        once(h, "fix", 3.1, function () { look.tilt0 = 0; say("Починил! " + ICONS.python.say, 0, "info"); look.mode = "cursor"; });
        if (t < 1.3) look.mode = "icon";
        var fl = 1 + .14 * Math.sin(seg(t, 3.05, 3.35) * PI); g.scale.setScalar(K * fl);
      },
      // роняет, ойкает и поднимает
      csharp: function (h, t) {
        var g = h.g;
        if (t < .9) { holdAt(g, 0, 1.2 + Math.sin(t * 2) * .01, .4); handsOn(g); look.mode = "icon"; return; }
        if (t < 2.6) {
          var ft = t - .9, y = 1.2 - 4.9 * ft * ft, z = .4 + ft * .35;
          var floorY = ICON / 2;
          if (y < floorY) { y = floorY + Math.abs(Math.sin((ft - .45) * 9)) * .12 * Math.exp(-(ft - .45) * 4); }
          holdAt(g, .05, y, z); g.rotateX(Math.min(ft, .55) * 9); g.rotateZ(Math.min(ft, .55) * 3);
          AL.w = AR.w = 1 - seg(t, .9, 1.05);
          crouchW = seg(t, 1.6, 2.3) * .85;
          if (t > 1.9) { AL.w = AR.w = seg(t, 1.9, 2.4); edgeW(g, 1, AL.target); edgeW(g, -1, AR.target); }
          once(h, "oops", .95, function () { tween(.3, function (k) { bump = Math.sin(k * PI) * .03; }, lin); say("Ой! Скользкий…", 1500, "info"); });
          return;
        }
        var k = seg(t, 2.6, 3.4); crouchW = .85 * (1 - k);
        _p.set(.05, ICON / 2, .4 + 1.7 * .35); _p2.set(HOLD[0], HOLD[1], HOLD[2]); _p.lerp(_p2, k);
        holdAt(g, _p.x, _p.y, _p.z); g.rotateX((1 - k) * 4.95); g.rotateZ((1 - k) * 1.65);
        handsOn(g);
        once(h, "ok", 3.4, function () { say(ICONS.csharp.say, 0, "info"); look.mode = "cursor"; });
      },
      // крутит на пальце, как баскетбольный мяч
      godot: function (h, t) {
        var g = h.g, k = seg(t, 0, .6);
        RL(HOLD[0], HOLD[1], HOLD[2], _p); RL(-.2, 1.72, .28, _p2); g.position.lerpVectors(_p, _p2, k);
        faceCam(g); g.rotateY(Math.max(0, t - .5) * Math.min(14, 4 + t * 4)); g.rotateZ(.12);
        AR.w = 1; RL(-.2, 1.72 - ICON * .62, .28, AR.target);
        AL.w = 1 - k; edgeW(g, 1, AL.target);
        look.mode = "icon";
        once(h, "s", .7, function () { say(ICONS.godot.say, 0, "info"); });
      },
      // ставит себе на голову и балансирует
      js: function (h, t) {
        var g = h.g, k = seg(t, .3, 1.1);
        RL(HOLD[0], HOLD[1], HOLD[2], _p);
        _m.fromArray(head.matrixWorld.elements);
        _p2.set(0, HEAD_TOP / .8 + ICON * K / 2 / .8 + 2, 0).applyMatrix4(_m);
        pathCtl.copy(_p).lerp(_p2, .5); pathCtl.z += .25 * K;
        bez(_p, pathCtl, _p2, k, g.position);
        faceCam(g); g.rotateZ(look.tilt * 1.4 * k);
        h.lift = k > .95 ? ICON * K * 1.15 : 0;
        if (t < 1.1) { handsOn(g); } else { AL.w = AR.w = 1 - seg(t, 1.1, 1.5); edgeW(g, 1, AL.target); edgeW(g, -1, AR.target); }
        if (t > 1.2) { look.mode = "cursor"; look.tilt0 = Math.sin(t * 2.6) * .13; }
        else look.mode = "icon";
        once(h, "s", 1.4, function () { say("Смотри — без рук! " + ICONS.js.say, 0, "info"); });
      },
      // поднимает над головой, как трофей
      html: function (h, t) {
        var g = h.g, k = seg(t, 0, .9), sway = Math.sin(t * 1.6) * .05 * k;
        _p.set(HOLD[0], HOLD[1], HOLD[2]).lerp(_p2.set(sway, 1.98, .26), k);
        holdAt(g, _p.x, _p.y, _p.z); g.rotateZ(-sway * 2);
        handsOn(g); h.lift = ICON * K * 1.7 * k;
        look.mode = "icon";
        once(h, "s", .9, function () { say(ICONS.html.say, 0, "info"); });
      },
      // подбрасывает и ловит
      excel: function (h, t) {
        var g = h.g, P0 = 1.05, u = t < .3 ? 0 : ((t - .3) % P0) / P0;
        var y = HOLD[1] + .62 * 4 * u * (1 - u);
        holdAt(g, 0, y, HOLD[2]); g.rotateX(u * PI * 2);
        var pump = u < .12 ? -u * .6 : u > .88 ? -(1 - u) * .6 : 0;
        AL.w = AR.w = 1;
        RL(.19, HOLD[1] - .04 + pump, HOLD[2], AL.target); RL(-.19, HOLD[1] - .04 + pump, HOLD[2], AR.target);
        look.mode = "icon"; look.speed = 9;
        once(h, "s", .5, function () { say(ICONS.excel.say, 0, "info"); });
      },
      // читает, как документ: голова бегает по строчкам
      word: function (h, t) {
        var g = h.g, k = seg(t, 0, .6);
        _p.set(HOLD[0], HOLD[1], HOLD[2]).lerp(_p2.set(0, 1.42, .36), k);
        holdAt(g, _p.x, _p.y, _p.z); g.rotateX(-.3 * k);
        handsOn(g);
        var line = ((t * .85) % 1), row = Math.floor(t * .85) % 4;
        RL(0, 1.42, .36, look.target);
        look.target.add(_tan.set((line - .5) * .2 * K, (.06 - row * .04) * K, 0));
        look.mode = t > .6 ? "point" : "icon"; look.speed = 10;
        once(h, "s", .7, function () { say(ICONS.word.say, 0, "info"); });
      },
      // запускает бумажным самолётиком — облетает и возвращается в руки
      pdf: function (h, t) {
        var g = h.g, P0 = 3.6, u = t < .6 ? -1 : (t - .6) % P0;
        if (u < 0 || u > 3.0) {                              // в руках, ждёт
          holdAt(g, 0, HOLD[1] + Math.sin(t * 2) * .01, HOLD[2]); handsOn(g); look.mode = "icon"; return;
        }
        if (u < .3) {                                        // замах
          var k = seg(u, 0, .3);
          holdAt(g, lerp(0, -.22, k), lerp(HOLD[1], 1.45, k), lerp(HOLD[2], .2, k));
          AL.w = 1 - k; AR.w = 1; edgeW(g, -1, AR.target); edgeW(g, 1, AL.target); return;
        }
        var th = (u - .3) / 2.7 * PI * 2;                     // петля
        var fx = function (a, o) { return o.set(-.22 - 1.15 * Math.sin(a), 1.5 + .3 * Math.sin(2 * a) + .18 * (1 - Math.cos(a)), .2 + .45 * (1 - Math.cos(a))); };
        fx(th, _p); fx(th + .05, _p2);
        RL(_p.x, _p.y, _p.z, g.position); RL(_p2.x, _p2.y, _p2.z, _tan);
        g.lookAt(_tan); g.rotateX(-PI / 2 + .25); g.rotateZ(Math.sin(th) * .6);
        var c = th > PI * 1.7 ? seg(th, PI * 1.7, PI * 2) : 0;
        AR.w = c > 0 ? c : 1 - seg(u, .3, .55); RL(-.24, 1.4, .3, AR.target);
        if (c > 0) edgeW(g, -1, AR.target);
        AL.w = 0;
        look.mode = "icon"; look.speed = 8;
        once(h, "s", .9, function () { say(ICONS.pdf.say, 0, "info"); });
      }
    };

    /* ---------- игра с кубиками ---------- */
    var _side = new V3(), _cw = new V3();
    function gripTargets(c, twist) {
      _side.set(Math.cos(twist), 0, -Math.sin(twist));
      var half = c.s / 2 + .03;
      var par = c.m.parent;
      _cw.copy(c.m.position).addScaledVector(_side, half); par.localToWorld(AL.target.copy(_cw));
      _cw.copy(c.m.position).addScaledVector(_side, -half); par.localToWorld(AR.target.copy(_cw));
    }
    function leanFor(y) { return clamp(1.0 - y * 1.1, .35, 1.0); }
    function twistFor(p) { return clamp(Math.atan2(p.x, p.z) * .8, -.45, .45); }
    function playStep() {
      if (st !== "play") return;
      var my = playTok;
      var pile = cubes.filter(function (c) { return c.where === "pile"; });
      if (!pile.length) return admire(my);
      var c = pile[Math.floor(Math.random() * pile.length)];
      focusCube = c; look.mode = "cubes"; look.speed = 4;
      var from = c.m.position.clone(), lean0 = cur.lean, tw0 = cur.twist;
      var twA = twistFor(from), lnA = leanFor(from.y);
      ptween(.75, function (k) {
        cur.lean = lerp(lean0, lnA, k); cur.twist = lerp(tw0, twA, k);
        gripTargets(c, cur.twist); AL.w = AR.w = k;
      }, easeIO, function () {
        if (my !== playTok) return;
        c.where = "carry"; carry = c; playTop.add(c.m);
        var mid = new V3(.02, .62, .42), up = from.clone(); up.y += .25;
        var ry0 = c.m.rotation.y;
        ptween(.75, function (k) {
          bez(from, up, mid, k, c.m.position); c.m.rotation.y = ry0 + k * 1.2;
          cur.lean = lerp(lnA, .45, k); cur.twist = lerp(twA, 0, k);
          gripTargets(c, cur.twist);
        }, easeIO, function () {
          if (my !== playTok) return;
          look.tilt0 = .25;
          ptween(.6, function (k) { c.m.rotation.x = Math.sin(k * PI) * .5; gripTargets(c, cur.twist); }, easeIO, function () {
            if (my !== playTok) return;
            look.tilt0 = 0;
            var to = new V3(TOWER.x, towerTop() + c.s / 2 + .004, TOWER.z), top = to.clone(); top.y += .18;
            var start = c.m.position.clone(), lnB = leanFor(to.y), twB = twistFor(to), ry1 = c.m.rotation.y;
            var ryT = Math.round(ry1 / (PI / 2)) * (PI / 2) + (Math.random() - .5) * .3;
            ptween(.75, function (k) {
              bez(start, top, to, k, c.m.position); c.m.rotation.y = lerp(ry1, ryT, k); c.m.rotation.x = 0;
              cur.lean = lerp(.45, lnB, k); cur.twist = lerp(0, twB, k);
              gripTargets(c, cur.twist);
            }, easeIO, function () {
              if (my !== playTok) return;
              c.where = "tower"; tower.push(c); carry = null; play.add(c.m);
              var lnC = cur.lean, twC = cur.twist;
              ptween(.5, function (k) {
                AL.w = AR.w = 1 - k;
                cur.lean = lerp(lnC, SIT.lean, k); cur.twist = lerp(twC, 0, k);
              }, easeIO, function () { plater(.25 + Math.random() * .6, function () { if (my === playTok) playStep(); }); });
            });
          });
        });
      });
    }
    function admire(my) {
      focusCube = tower[tower.length - 1]; look.mode = "cubes"; look.tilt0 = -.2;
      plater(1.3, function () {
        if (my !== playTok) return;
        look.tilt0 = 0;
        var tw0 = cur.twist;
        ptween(.5, function (k) {
          cur.twist = lerp(tw0, twistFor(TOWER) * .6, k);
          play.localToWorld(AR.target.set(TOWER.x + .12, towerTop() * .8, TOWER.z - .05)); AR.w = k;
        }, easeIO, function () {
          if (my !== playTok) return;
          var fallen = tower.slice().reverse(); tower = [];
          fallen.forEach(function (c, i) {
            c.where = "fall";
            var a = c.m.position.clone(), b = pileSpot(c), ctl = a.clone().lerp(b, .5); ctl.y = a.y + .15;
            var rx = c.m.rotation.x, rz = c.m.rotation.z, spin = (Math.random() - .5) * 4;
            later(i * .07, function () {
              tween(.6, function (k) {
                bez(a, ctl, b, k, c.m.position); c.m.rotation.x = rx + k * PI / 2 * (i % 2 ? 1 : -1); c.m.rotation.z = rz + spin * k;
              }, easeOut, function () { c.m.rotation.x = 0; c.m.rotation.z = 0; c.where = "pile"; });
            });
          });
          tween(.3, function (k) { bump = Math.sin(k * PI) * .04; }, lin);
          ptween(.4, function (k) { AR.w = 1 - k; cur.twist = lerp(twistFor(TOWER) * .6, 0, k); }, easeIO);
          plater(1.4, function () { if (my === playTok) playStep(); });
        });
      });
    }
    function dropCarried() {
      var c = carry; carry = null;
      if (!c) return;
      play.add(c.m);
      var a = c.m.position.clone(), b = pileSpot(c);
      tween(.45, function (k) { c.m.position.lerpVectors(a, b, k); c.m.position.y = lerp(a.y, b.y, k * k); }, lin, function () { c.where = "pile"; });
    }

    /* ---------- сценарий «заметил» ---------- */
    function wake() {
      if (st !== "play") return;
      st = "wake"; playTok++; hideSay(); card.classList.add("robo-awake");
      dropCarried(); focusCube = null;
      var lean0 = cur.lean, tw0 = cur.twist, wl = AL.w, wr = AR.w;
      tween(.45, function (k) { AL.w = wl * (1 - k); AR.w = wr * (1 - k); cur.lean = lerp(lean0, .3, k); cur.twist = lerp(tw0, 0, k); }, easeIO);
      look.mode = "camera"; look.speed = 4.5;                       // 1. повернул голову
      later(1.05, function () {
        look.mode = "cubes"; look.speed = 5;                        // 2. отвернулся — показалось
        later(.95, function () {
          look.mode = "camera"; look.speed = 24;                    // 3. «о!» — резко обратно
          tween(.32, function (k) { bump = Math.sin(k * PI) * .06; }, lin);
          say("!", 1100, "bang");
          later(.9, function () {                                   // 4. встаёт
            poseTo(CROUCH, .6, function () {
              poseTo(STAND, .65, function () {
                st = "walk"; look.mode = "camera"; look.speed = 4;
                walk.dest.copy(NEAR); walk.on = true; walk.done = arrive;  // 5. подходит
              });
            });
          });
        });
      });
    }
    function arrive() {
      var y0 = root.yaw;
      tween(.5, function (k) { root.yaw = y0 + angDiff(y0, 0) * k; }, easeIO, function () {
        st = "stand"; look.mode = "cursor"; look.speed = 5;
        if (!want) say(coarse ? "Привет! Нажми на значок — покажу фокус" : "Привет! Наведи на значок слева — покажу фокус", 3400, "info");
      });
    }
    function resetToPlay() {
      tok++; anims = []; playTok++;
      dropHeldNow(); carry = null; focusCube = null;
      Object.keys(tiles).forEach(function (k) { tiles[k].classList.remove("is-taken"); });
      st = "play"; walk.on = false; walkW = 0; bump = 0; crouchW = 0;
      AL.w = AR.w = 0; look.tilt0 = 0;
      placeRootFar(); resetCubes(); hideSay(); card.classList.remove("robo-awake");
      later(.6, playStep);
    }

    /* ---------- указатель ---------- */
    var proxy = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ visible: false }));
    tScene.add(proxy);
    var ray = new THREE.Raycaster();
    function overRobot() {
      if (!ptr.on) return false;
      ptr.ndc.set(ptr.x / W * 2 - 1, -(ptr.y / H * 2 - 1));
      ray.setFromCamera(ptr.ndc, tCam);
      return ray.intersectObject(proxy, false).length > 0;
    }
    function setPtr(e) { var r = card.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.on = true; }
    card.addEventListener("pointermove", setPtr, { passive: true });
    card.addEventListener("pointerleave", function () { ptr.on = false; card.style.cursor = ""; });
    card.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a,button")) return;
      setPtr(e);
      if (!overRobot()) return;
      if (st === "play") wake();
      else if (st === "stand" && !busy && !held) {
        tween(.3, function (k) { bump = Math.sin(k * PI) * .04; }, lin);
        say(JOKES[Math.floor(Math.random() * JOKES.length)], 2600, "info");
      }
    });
    if (coarse) card.addEventListener("pointerup", function () { ptr.on = false; });

    robot = { poke: function () { if (want && st === "play") wake(); } };
    window.__robo = { state: function () { return { st: st, held: held && held.id, phase: held && held.phase, busy: busy, want: want }; }, wake: wake, reset: resetToPlay };

    /* ---------- видимость ---------- */
    var hintShown = false;
    new IntersectionObserver(function (es) {
      var v = es[0].isIntersecting;
      if (v && !visible) {
        visible = true;
        if (st !== "play" && hiddenAt && performance.now() - hiddenAt > 6000) resetToPlay();
        if (st === "play" && !hintShown) later(2.2, function () {
          if (st === "play") { hintShown = true; say(coarse ? "нажми на меня" : "наведи на меня", 3600, "hint"); }
        });
        requestAnimationFrame(loop);
      } else if (!v && visible) { visible = false; hiddenAt = performance.now(); }
    }, { threshold: .05 }).observe(card);
    document.addEventListener("visibilitychange", function () { if (!document.hidden && visible) requestAnimationFrame(loop); });

    /* ---------- главный цикл ---------- */
    var last = 0, _tmp = new V3(), firstFrame = true;
    function loop(now) {
      if (dead || !visible || document.hidden) { last = 0; return; }
      requestAnimationFrame(loop);
      var dt = last ? Math.min((now - last) / 1000, .05) : .016; last = now;
      T += dt;
      runAnims();

      if (walk.on) {
        _tmp.subVectors(walk.dest, root.pos); _tmp.y = 0;
        var dist = _tmp.length() / K, yawT = Math.atan2(_tmp.x, _tmp.z);
        root.yaw = dampAng(root.yaw, yawT, 4.5, dt);
        var facing = Math.cos(angDiff(root.yaw, yawT));
        var spd = walk.speed * clamp((facing - .55) / .4, 0, 1) * clamp(dist / .6, .3, 1);
        walkW = damp(walkW, 1, 7, dt);
        walkAmp = damp(walkAmp, spd > .2 ? 1 : .45, 5, dt);
        walkPh += dt * 2 * PI * 1.3 * Math.max(.6, walkAmp);
        if (dist > 1e-4) root.pos.addScaledVector(_tmp.normalize(), Math.min(dist, spd * dt) * K);
        if (dist < .03) { walk.on = false; if (walk.done) { var f = walk.done; walk.done = null; f(); } }
      } else walkW = damp(walkW, 0, 6, dt);

      if (held && held.phase === "act" && ACTS[held.id]) { held.t += dt; ACTS[held.id](held, held.t); }
      if (st === "stand" && !busy) {
        if (held && held.id !== want) release();
        else if (!held && want) grab(want);
      }

      // поза: база + дыхание + ходьба + присед
      var p = P(cur), br = Math.sin(T * 1.6);
      p.lean += br * .012; p.slz += br * .015; p.srz -= br * .015;
      if (crouchW > .001) KEYS.forEach(function (k) { if (k !== "slx" && k !== "srx" && k !== "el" && k !== "er" && k !== "slz" && k !== "srz") p[k] = lerp(p[k], CROUCH[k], crouchW); });
      if (walkW > .002) {
        var s = Math.sin(walkPh), c = Math.cos(walkPh), a = walkAmp;
        var Wp = { py: 1.04 - .06 * Math.abs(s) * a, lean: .07, twist: .06 * s * a, hlx: -.45 * s * a, hly: .04, kl: .95 * Math.pow(Math.max(0, c), 1.4) * a,
          hrx: .45 * s * a, hry: -.04, kr: .95 * Math.pow(Math.max(0, -c), 1.4) * a, slx: .4 * s * a, srx: -.4 * s * a, el: -.4, er: -.4, slz: .1, srz: -.1 };
        Wp.al = -(Wp.hlx + Wp.kl) * .7; Wp.ar = -(Wp.hrx + Wp.kr) * .7;
        for (var key in Wp) p[key] = lerp(p[key], Wp[key], walkW);
      }

      // сначала камера (для взгляда и значков), потом суставы
      setSplineCam();
      syncCams();
      bot.updateMatrixWorld(true);
      updateLook(dt);
      applyRig(p);
      app.render();
      syncCams();

      // тени, «коробка» наведения, кубики
      var sitK = clamp((1.04 - p.py) / .74, 0, 1);
      shadow.position.set(root.pos.x, FLOOR + 1, root.pos.z);
      shadow.position.addScaledVector(_tmp.set(Math.sin(root.yaw), 0, Math.cos(root.yaw)), sitK * .25 * K);
      shadow.scale.set(lerp(1.1, 1.4, sitK) * K, lerp(.8, 1.2, sitK) * K, 1);
      proxy.scale.set(lerp(.9, 1.6, sitK) * K, lerp(2.1, 1.5, sitK) * K, lerp(.7, 1.6, sitK) * K);
      RL(0, lerp(1.05, .62, sitK), lerp(0, .25, sitK), proxy.position); proxy.rotation.y = root.yaw;
      playTop.position.copy(play.position); playTop.rotation.copy(play.rotation);
      syncCubeShadows();

      if (ptr.on && !coarse) {
        var ov = overRobot();
        card.style.cursor = ov && (st === "play" || (st === "stand" && !held)) ? "pointer" : "";
        if (ov && st === "play") wake();
      }
      gR.render(gScene, gCam);
      tR.render(tScene, tCam);
      placeSay();
      if (firstFrame) {
        firstFrame = false;
        sceneBox.classList.remove("is-loading"); sceneBox.classList.add("is-ready"); card.classList.add("robo-ready");
      }
    }
    later(.8, playStep);
  }
})();
