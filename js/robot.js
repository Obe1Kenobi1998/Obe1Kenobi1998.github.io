/* =====================================================================
   3D-РОБОТ блока «Опыт». Внешний вид — тот самый робот из Spline (сцена
   из компонента Splite), но все движения пишутся кодом: суставы робота
   (плечи, локти, бёдра, колени, стопы, голова) поворачиваются каждый кадр.
   • сидит вдалеке на коврике и строит башню из кубиков;
   • наводишь на него — поворачивает голову, отворачивается, спохватывается
     («!»), встаёт через колено, как человек (ноги — обратная кинематика), и подходит;
   • наводишь на значок — забирает его, и с каждым значком своя сценка
     с реквизитом: таблица с формулами, документ с колонтитулами, окно сайта,
     терминал, сборка EXE, игра с ИИ; поверх — всплывающие надписи (HTML).
   Руки сглаживаются (без рывков), значки и реквизит прогреваются заранее (без подвисаний).
   Значки и панели держит своей же кистью со скелетом (16 суставов): за боковую кромку, ладонь
   к груди, тыльная сторона к зрителю, четыре пальца на лицевой стороне, большой палец сзади; пальцы смыкаются по очереди,
   пока держит — шевелятся, отпустил — раскрываются. Рука подстраивается под кисть, сторона хвата
   не меняется на ходу (без перекручивания).
   PDF: замах, бросок, полёт вокруг робота (и за головой), ловля в подставленные руки.
   У коврика — ноутбук, планшет, папки, ящик с инструментами, кружка, значки на подставках.
   Слои: пол, кубики и мелочи (three.js) → робот (Spline) → копии кубиков с проверкой
   по невидимому «силуэту глубины» робота → значки, реквизит, кисти (three.js) → надписи.
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
      return { side: side, arm: arm, fore: fore, hand: handMesh, bA: toLocal(arm, F0), bF: toLocal(fore, grip),
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

    // длины ног (в «наших» единицах) и высота щиколотки стоя — для честной кинематики ног
    var LT = wpos(LL.hip, new V3()).distanceTo(wpos(LL.shin, new V3())) / K;
    var LS = wpos(LL.shin, new V3()).distanceTo(wpos(LL.foot, new V3())) / K;
    var ANK0 = (wpos(LL.foot, new V3()).y - FLOOR) / K;

    // Поворот кости к нужному направлению. Если нужно развернуть почти на 180° (руки над головой,
    // колени в сидячей позе), кратчайший поворот неустойчив и кость «прокручивается» — тогда ведём её
    // через направление-подсказку, плавно смешивая оба варианта.
    var _hv = new V3(), _qh1 = new Q(), _qh2 = new Q(), _qd = new Q(), _qs = new Q();
    function aim(j, bLocal, dirW, hintW, dA, dB) {
      dA = dA == null ? -.15 : dA; dB = dB == null ? -.6 : dB;
      _m.fromArray(j.parent.matrixWorld.elements).invert();
      _w.copy(dirW).transformDirection(_m);
      _q.set(j.quaternion.x, j.quaternion.y, j.quaternion.z, j.quaternion.w);
      _m2.fromArray(j.matrix.elements);
      _c.copy(bLocal).transformDirection(_m2);          // с учётом зеркального масштаба сустава
      _dq.setFromUnitVectors(_c, _w);
      var d = _c.dot(_w);
      if (hintW && d < dA) {
        _hv.copy(hintW).transformDirection(_m);
        _qh1.setFromUnitVectors(_c, _hv); _qh2.setFromUnitVectors(_hv, _w); _qh2.multiply(_qh1);
        _qd.copy(_dq).invert().multiply(_qh2);
        _qs.set(0, 0, 0, 1).slerp(_qd, sm((dA - d) / (dA - dB)));
        _dq.multiply(_qs);
      }
      _q.premultiply(_dq);
      j.quaternion.set(_q.x, _q.y, _q.z, _q.w);
      j.updateMatrix(); j.updateMatrixWorld(true);
    }
    // сферическая интерполяция направлений; при развороте ~180° — через подсказку
    var _sa = new V3(), _sb = new V3(), _bv = new V3();
    function slerpV(out, a, b, k) {
      var d = clamp(a.dot(b), -1, 1);
      if (d > .9995) return out.copy(a).lerp(b, k).normalize();
      var th = Math.acos(d), s = Math.sin(th);
      if (s < 1e-4) return out.copy(k < .5 ? a : b);
      _sa.copy(a).multiplyScalar(Math.sin((1 - k) * th) / s); _sb.copy(b).multiplyScalar(Math.sin(k * th) / s);
      return out.copy(_sa).add(_sb).normalize();
    }
    function blendDir(out, a, b, k, hint) {
      var d = a.dot(b);
      if (!hint || d > -.2) return slerpV(out, a, b, k);
      var t1 = Math.acos(clamp(a.dot(hint), -1, 1)), t2 = Math.acos(clamp(hint.dot(b), -1, 1)), s = k * (t1 + t2);
      if (s < t1) slerpV(_bv, a, hint, s / t1); else slerpV(_bv, hint, b, t2 > 1e-4 ? (s - t1) / t2 : 1);
      if (d < -.7) return out.copy(_bv);
      slerpV(out, a, b, k);
      return out.lerp(_bv, sm((-.2 - d) / .5)).normalize();
    }

    /* ---------- три холста: пол/кубики, робот, значки ---------- */
    function mkRenderer(canvas) {
      var r = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
      r.setClearColor(0x000000, 0); return r;
    }
    var gR = mkRenderer(groundCv), tR = mkRenderer(topCv);
    var gScene = new THREE.Scene(), tScene = new THREE.Scene(), cScene = new THREE.Scene();   // cScene — кубики над роботом (с «силуэтом глубины»)
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
    envFor(gR, gScene); envFor(tR, tScene); envFor(tR, cScene); tR.autoClear = false;
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
    // py — высота бёдер, fz — сдвиг тела вперёд (при вставании), остальное — углы суставов
    var KEYS = ["py", "fz", "lean", "twist", "tilt", "hlx", "hly", "hlz", "kl", "al", "hrx", "hry", "hrz", "kr", "ar", "slx", "slz", "el", "srx", "srz", "er"];
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

    /* ---------- вставание как у человека: сидит на коленях → выпрямляется на коленях →
       выставляет левую ногу вперёд (одно колено на полу) → встаёт, опираясь на неё →
       подтягивает правую. Ноги считаются обратной кинематикой от точек опоры на полу. ---------- */
    function legIK(dz, dy, o) {          // вектор бедро→щиколотка (вперёд, вверх) → углы бедра и голени от вертикали
      var D = Math.sqrt(dz * dz + dy * dy), Dm = clamp(D, Math.abs(LT - LS) + .02, LT + LS - .001);
      var a = Math.atan2(dz, -dy);
      o.phi = a + Math.acos(clamp((LT * LT + Dm * Dm - LS * LS) / (2 * LT * Dm), -1, 1));
      o.psi = a - Math.acos(clamp((LS * LS + Dm * Dm - LT * LT) / (2 * LS * Dm), -1, 1));
      return o;
    }
    function hermite(t, ts, vs) {        // гладкая кривая через ключи (без остановок на каждом)
      var n = ts.length;
      if (t <= ts[0]) return vs[0];
      if (t >= ts[n - 1]) return vs[n - 1];
      var i = 0; while (t > ts[i + 1]) i++;
      var h = ts[i + 1] - ts[i], s = (t - ts[i]) / h, s2 = s * s, s3 = s2 * s;
      var m0 = i > 0 ? (vs[i + 1] - vs[i - 1]) / (ts[i + 1] - ts[i - 1]) : 0;
      var m1 = i + 2 < n ? (vs[i + 2] - vs[i]) / (ts[i + 2] - ts[i]) : 0;
      return (2 * s3 - 3 * s2 + 1) * vs[i] + (s3 - 2 * s2 + s) * h * m0 + (-2 * s3 + 3 * s2) * vs[i + 1] + (s3 - s2) * h * m1;
    }
    var SU = (function () {
      var phS = -SIT.hlx, psS = -SIT.hlx - SIT.kl, hS = SIT.py - .03;         // сидячая поза: бедро, голень, высота бёдер
      var kz = LT * Math.sin(phS), kh = hS - LT * Math.cos(phS);              // колено на полу
      var az = kz + LS * Math.sin(psS), ah = kh - LS * Math.cos(psS);         // щиколотка
      var phK = .06, fzK = kz - LT * Math.sin(phK), hK = kh + LT * Math.cos(phK);
      var D0 = .55, D1 = .62, D2 = .85, D3 = .35;
      return { phS: phS, kz: kz, kh: kh, az: az, ah: ah, th0: SIT.al - psS, phK: phK, fzK: fzK, hK: hK,
        fzS: fzK + .04 + .52, hS: Math.min(STAND.py - .03, LT + LS + ANK0 - .006),
        D0: D0, D1: D1, D2: D2, D3: D3, DT: D0 + D1 + D2 + D3 };
    })();
    var UPK = ["lean", "twist", "tilt", "slx", "slz", "el", "srx", "srz", "er"];
    var UPT = [0, SU.D0, SU.D0 + SU.D1, SU.D0 + SU.D1 + SU.D2 * .45, SU.D0 + SU.D1 + SU.D2];
    var UPV = [null,
      [.14, 0, 0, -.28, .22, -.4, -.28, -.22, -.4],          // выпрямился на коленях, руки чуть вперёд
      [.24, .1, -.03, -.85, .12, -.75, .2, -.28, -.32],      // левая нога впереди: левая рука на колене
      [.42, .05, 0, -.6, .14, -.45, -.45, -.2, -.5],         // толкается, корпус вперёд, правая рука для баланса
      UPK.map(function (k) { return STAND[k]; })];
    var _ikL = {}, _ikR = {};
    function suPose(t, from) {
      var p = cur, D0 = SU.D0, D1 = SU.D1, D2 = SU.D2;
      var u0 = clamp(t / D0, 0, 1), u1 = clamp((t - D0) / D1, 0, 1), u2 = clamp((t - D0 - D1) / D2, 0, 1), u3 = clamp((t - D0 - D1 - D2) / SU.D3, 0, 1);
      var fz, h;
      if (t < D0) { var ph = lerp(SU.phS, SU.phK, easeIO(u0)); fz = SU.kz - LT * Math.sin(ph); h = SU.kh + LT * Math.cos(ph); }
      else if (t < D0 + D1) { fz = SU.fzK + .04 * easeIO(u1); h = SU.hK + .015 * Math.sin(PI * u1); }
      else { fz = lerp(SU.fzK + .04, SU.fzS, easeIO(u2)); h = lerp(SU.hK, SU.hS, easeIO(u2)); }
      // точки опоры: левая нога шагает вперёд, правая — подтягивается в конце
      var lz = SU.az, ly = SU.ah, lp = SU.th0, rz = SU.az, ry = SU.ah, rp = SU.th0, e;
      if (t >= D0 + D1) { lz = SU.fzS; ly = ANK0; lp = 0; }
      else if (t >= D0) { e = easeIO(u1); lz = lerp(SU.az, SU.fzS, e); ly = lerp(SU.ah, ANK0, e) + .24 * Math.sin(PI * u1); lp = lerp(SU.th0, 0, e) - .35 * Math.sin(PI * u1); }
      // правая стопа отрывается рано — нога не вытягивается в струну
      if (u2 > .15) { e = easeIO((u2 - .15) / .85); rz = lerp(SU.az, SU.fzS, e); ry = lerp(SU.ah, ANK0, e) + .15 * Math.sin(PI * e); rp = lerp(SU.th0, 0, e) - .25 * Math.sin(PI * e); }
      legIK(lz - fz, ly - h, _ikL); legIK(rz - fz, ry - h, _ikR);
      p.hlx = -_ikL.phi; p.kl = _ikL.phi - _ikL.psi; p.al = _ikL.psi + lp;
      p.hrx = -_ikR.phi; p.kr = _ikR.phi - _ikR.psi; p.ar = _ikR.psi + rp;
      var hk = easeIO(u0);
      p.hly = lerp(from.hly, STAND.hly, hk); p.hry = lerp(from.hry, STAND.hry, hk);
      p.hlz = lerp(from.hlz, 0, hk); p.hrz = lerp(from.hrz, 0, hk);
      p.py = h + .03; p.fz = fz;
      UPK.forEach(function (k, j) {
        p[k] = hermite(t, UPT, UPV.map(function (v, i) { return i ? v[j] : from[k]; }));
      });
      if (u3 > 0) { var k3 = easeIO(u3); KEYS.forEach(function (key) { if (key !== "fz") p[key] = lerp(p[key], STAND[key], k3); }); }
    }
    var _su = new V3();
    function standUp(done) {
      var from = P(cur);
      // поднимаясь, задевает башню из кубиков — она рассыпается в сторону (и не стоит на пути ноги)
      later(SU.D0 + SU.D1 * .45, function () { if (tower.length > 1) { toppleTower(); tween(.3, function (k) { bump = Math.sin(k * PI) * .02; }, lin); } });
      tween(SU.DT, function (k) { suPose(k * SU.DT, from); }, lin, function () {
        RL(0, 0, cur.fz, _su); root.pos.x = _su.x; root.pos.z = _su.z;   // сдвиг тела переносим в корень
        cur = P(STAND); done();
      });
    }

    /* ---------- коврик и кубики (в «наших» единицах внутри группы масштаба K) ---------- */
    function mkPlay(scene) { var g = new THREE.Group(); g.position.copy(FAR); g.rotation.y = FAR_YAW; g.scale.setScalar(K); scene.add(g); return g; }
    var play = mkPlay(gScene), playTop = mkPlay(cScene);
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
      var tc = new THREE.Mesh(m.geometry, m.material.clone()); playTop.add(tc);    // копия над роботом
      var sh = blob(play, .8);
      return { m: m, t: tc, s: c[1], sh: sh, where: "pile" };
    });
    // на гранях кубиков — значки кода (как на детских кубиках буквы)
    var GLYPH = [["{ }", "#4a3510"], ["</>", "#a8781f"], [">_", "#f0cd73"], ["fx", "#ffffff"], ["#", "#ffffff"]];
    cubes.forEach(function (c, i) {
      var t = canvasTex(128, function (x, s) {
        x.clearRect(0, 0, s, s); x.fillStyle = GLYPH[i][1]; x.font = "800 " + (GLYPH[i][0].length > 2 ? 46 : 60) + "px 'JetBrains Mono', Consolas, monospace";
        x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(GLYPH[i][0], s / 2, s / 2 + 3);
      });
      t.anisotropy = 4;
      var mat = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: .45, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });
      var pg = new THREE.PlaneGeometry(c.s * .62, c.s * .62);
      [[0, 0, 1, 0, 0], [0, 0, -1, 0, PI], [1, 0, 0, 0, PI / 2], [-1, 0, 0, 0, -PI / 2], [0, 1, 0, -PI / 2, 0]].forEach(function (f) {
        [c.m, c.t].forEach(function (m) { var d = new THREE.Mesh(pg, mat); d.position.set(f[0], f[1], f[2]).multiplyScalar(c.s / 2 + .001); d.rotation.set(f[3], f[4], 0); m.add(d); });
      });
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
        c.t.position.copy(c.m.position); c.t.quaternion.copy(c.m.quaternion);
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
      // на обычных мониторах рисуем в 1,5 раза чётче (мелкие предметы на полу не «мылятся»)
      var dpr = window.devicePixelRatio || 1, pr = W < 700 ? Math.min(dpr, 1.5) : clamp(dpr, 1.5, 1.75);
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
      // toScreen — экранные px; облачко ставится в CSS px (на широких экранах страница в масштабе — js/fit.js)
      var zk = window.uiZ ? window.uiZ() : 1, s = toScreen(headTopW), bh = sayEl.offsetHeight + 16, bw = sayEl.offsetWidth / 2 + 12;
      s.x /= zk; s.y /= zk;
      var side = s.y < bh;                                  // над головой нет места — облачко сбоку
      sayEl.classList.toggle("robo-say--side", side);
      var x = side ? s.x - bw - 40 : s.x, y = side ? s.y + bh * .9 : s.y;
      sayEl.style.transform = "translate(" + Math.round(clamp(x, bw, W / zk - bw)) + "px," + Math.round(clamp(y, bh, H / zk)) + "px)";
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
      if (A.pk > .001) _pole.lerp(A.poleW, A.pk).normalize();             // при хвате локоть уходит назад вдоль кисти
      _n.crossVectors(_dd, _pole); if (_n.lengthSq() < 1e-6) _n.set(1, 0, 0); _n.normalize();
      var ang = Math.acos(clamp((A.L1 * A.L1 + d * d - A.L2 * A.L2) / (2 * A.L1 * d), -1, 1));
      upOut.copy(_dd).applyAxisAngle(_n, ang);
      _E.copy(_S).addScaledVector(upOut, A.L1);
      foreOut.copy(_S).addScaledVector(_dd, d).sub(_E).normalize();
    }
    // Руки сглаживаются: направление каждой кости догоняет цель с ограниченной скоростью
    // (в системе корпуса). Так любые резкие смены цели превращаются в плавное движение.
    var HINT_ARM = new V3(), HINT_DOWN = new V3(0, -1, 0), HINT_ARM_L = new V3(0, .5, .87).normalize(), _tl = new V3();
    function smoothArm(A, key, dW, dt) {
      _m2.fromArray(topP.matrixWorld.elements).invert();
      _tl.copy(dW).transformDirection(_m2);
      var s = A[key];
      if (!s) { A[key] = _tl.clone(); return; }
      var ang = Math.acos(clamp(s.dot(_tl), -1, 1));
      if (ang > 1e-4) {
        var rate = A.fast ? 40 : st === "play" ? 30 : 17, vmax = A.fast ? 18 : st === "play" ? 12 : 7.5;
        blendDir(s, s, _tl, Math.min(ang * (1 - Math.exp(-rate * dt)), vmax * dt) / ang, HINT_ARM_L);
      }
      _m2.fromArray(topP.matrixWorld.elements);
      dW.copy(s).transformDirection(_m2);
    }
    function applyRig(p, dt) {
      JOINTS.forEach(function (j) { j.o.quaternion.set(j.q.x, j.q.y, j.q.z, j.q.w); j.o.updateMatrix(); });
      bot.position.set(root.pos.x + Math.sin(root.yaw) * p.fz * K, BOT0.y + (p.py - 1.04 + bump) * K, root.pos.z + Math.cos(root.yaw) * p.fz * K);
      bot.rotation.set(0, root.yaw, 0); bot.updateMatrix();
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
        aim(leg.hip, leg.bT, _d1); aim(leg.shin, leg.bS, _d2, HINT_DOWN, -.85, -.97); aim(leg.foot, leg.bFt, _d3);
      });
      frameDir(topP, HINT_ARM.copy(HINT_ARM_L));
      [[AL, p.slx, p.slz, p.el], [AR, p.srx, p.srz, p.er]].forEach(function (a) {
        var A = a[0];
        _qa.setFromEuler(_e.set(a[1], 0, a[2]));
        frameDir(topP, _d1.set(0, -1, 0).applyQuaternion(_qa));
        _qb.setFromEuler(_e.set(a[3], 0, 0)); _qa.multiply(_qb);
        frameDir(topP, _d2.set(0, -1, 0).applyQuaternion(_qa));
        if (A.w > .001) { ikDirs(A, _ik1, _ik2); blendDir(_d1, _d1, _ik1, A.w, HINT_ARM); }
        smoothArm(A, "s1", _d1, dt);
        aim(A.arm, A.bA, _d1, HINT_ARM, -.05, -.85);
        if (A.w > .001) {                       // предплечье — от настоящего локтя к цели
          wpos(A.fore, _E); _ik2.subVectors(A.target, _E).normalize();
          blendDir(_d2, _d2, _ik2, A.w, HINT_ARM);
        }
        smoothArm(A, "s2", _d2, dt);
        aim(A.fore, A.bF, _d2, HINT_ARM, -.82, -.96);   // локоть — шарнир: подсказка нужна только при полном сгибе
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
      g.visible = false; tScene.add(g); return g;
    }
    // все значки создаются один раз (и один раз компилируются шейдеры) — без подвисаний при взятии
    var ICON_G = {};
    APP_IDS.forEach(function (id) { if (ICONS[id]) ICON_G[id] = makeIcon(id); });
    function resetIcon(g) {
      g.halves.forEach(function (hh) { hh.position.set(0, 0, 0); hh.rotation.set(0, 0, 0); });
      g.rotation.set(0, 0, 0); g.visible = true;
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
    function edgeW(g, side, out, A, bx) {   // куда вести руку: центр кисти в позе хвата за боковую кромку (bx — за нижнюю, в точке x = bx)
      var h = g.halves[side < 0 ? 0 : 1];
      if (typeof gripAim === "function" && HR) {
        if (bx != null) return gripAim(A || (side > 0 ? AL : AR), g.halves[bx < 0 ? 0 : 1], side, ICON / 2, bx, .001, out, 1);
        return gripAim(A || (side > 0 ? AL : AR), h, side, ICON / 2, -.015, .001, out);
      }
      return h.localToWorld(out.set(side * (ICON / 2 + .02), -.03, 0));
    }
    function faceCam(g) { g.lookAt(tCam.position); }

    var HOLD = [0, 1.3, .42];
    var pathFrom = new V3(), pathCtl = new V3(), _hp = new V3(), _hw = new V3();
    function grab(id) {
      var tile = tiles[id]; if (!tile) return;
      busy = true; hideSay();
      var g = ICON_G[id]; if (!g) { busy = false; return; }
      resetIcon(g);
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
        if (k > .72) { gripIcon(AL, g, 1); gripIcon(AR, g, -1); }
      }, easeIO, function () { held.phase = "act"; held.t = 0; busy = false; });
    }
    function release() {
      var h = held; if (!h) return;
      busy = true; h.phase = "back"; hideSay(); propsOff(); clearFx(true);
      if (h.g.parent !== tScene) tScene.add(h.g);
      look.mode = "icon"; look.speed = 7; look.tilt0 = 0; h.lift = 0;
      var cw0 = crouchW; tween(.45, function (k) { crouchW = cw0 * (1 - k); }, easeIO);
      var from = h.g.position.clone(), q0 = h.g.quaternion.clone(), qT = new Q();
      var gap0 = h.g.halves[1].position.x, rot0 = h.g.halves[1].rotation.z, sc0 = h.g.scale.x / K;
      var w0 = AL.w, w1 = AR.w, t0 = AL.target.clone(), t1 = AR.target.clone(), _e0 = new V3(), _e1 = new V3();
      tween(.75, function (k) {
        var dst = domPoint(h.tile);
        pathCtl.copy(from).lerp(dst.pos, .5); pathCtl.y += .45 * K;
        bez(from, pathCtl, dst.pos, k, h.g.position);
        h.g.scale.setScalar(lerp(sc0, dst.s, k) * K);
        faceCam(h.g); qT.copy(h.g.quaternion); h.g.quaternion.copy(q0).slerp(qT, Math.min(1, k * 1.6));
        h.g.halves.forEach(function (hh, i) { var s = i ? 1 : -1; hh.position.set(s * gap0 * (1 - k), 0, 0); hh.rotation.set(0, 0, s * rot0 * (1 - k)); });
        // руки провожают значок и плавно опускаются
        var r = sm(k / .8);
        edgeW(h.g, 1, _e0); edgeW(h.g, -1, _e1); AL.pkT = AR.pkT = 0;     // на возврате локоть не перестраивается (без прокрутки предплечья)
        AL.target.copy(t0).lerp(_e0, Math.min(1, k * 2.5)); AR.target.copy(t1).lerp(_e1, Math.min(1, k * 2.5));
        AL.w = w0 * (1 - r); AR.w = w1 * (1 - r);
      }, easeIO, function () {
        h.g.visible = false;
        h.tile.classList.remove("is-taken");
        held = null; busy = false; look.mode = "cursor"; look.speed = 5;
      });
    }
    function dropHeldNow() {
      propsOff(true); clearFx(false);
      if (!held) return;
      if (held.g.parent !== tScene) tScene.add(held.g);
      held.g.visible = false; held.tile.classList.remove("is-taken"); held = null; busy = false;
      AL.w = AR.w = 0;
    }

    /* ---------- реквизит: таблица, документ, окна (рисуются на холсте → текстура) ---------- */
    var FONT = "Manrope, 'Segoe UI', sans-serif", MONO = "'JetBrains Mono', Consolas, monospace";
    function fnt(px, w, fam) { return (w || 600) + " " + px + "px " + (fam || FONT); }
    function rr(x, X, Y, W, Hh, R) {
      x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + Hh, R); x.arcTo(X + W, Y + Hh, X, Y + Hh, R);
      x.arcTo(X, Y + Hh, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath();
    }
    function rrShape(w, h, r) {
      var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
    }
    function shapeGeo(w, h, r) {
      var g = new THREE.ShapeGeometry(rrShape(w, h, r), 6), uv = g.attributes.uv, pos = g.attributes.position;
      for (var i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / w + .5, pos.getY(i) / h + .5);
      return g;
    }
    var PANELS = [];
    function mkPanel(w, h, px, draw, s0) {
      var c = document.createElement("canvas"); c.width = px; c.height = Math.round(px * h / w);
      var tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4;
      var r = Math.min(w, h) * .07, g = new THREE.Group();
      var back = new THREE.Mesh(shapeGeo(w + .016, h + .016, r * 1.1), new THREE.MeshBasicMaterial({ color: 0x2a2218, transparent: true, opacity: .2, depthWrite: false }));
      back.position.set(.014, -.022, -.006);
      var face = new THREE.Mesh(shapeGeo(w, h, r), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
      g.add(back); g.add(face); g.visible = false; tScene.add(g);
      var P = { g: g, c: c, x: c.getContext("2d"), tex: tex, w: w, h: h, k: 0, on: false, key: "", draw: draw, s: s0 || {}, mats: [back.material, face.material] };
      PANELS.push(P); return P;
    }
    function panelPaint(P) {
      var key = JSON.stringify(P.s);
      if (key === P.key) return;
      P.key = key; P.draw(P.x, P.c.width, P.c.height, P.s); P.tex.needsUpdate = true;
    }
    function placePanel(P, x, y, z, rz) { RL(x, y, z, P.g.position); faceCam(P.g); if (rz) P.g.rotateZ(rz); P.g.updateMatrixWorld(true); }
    function panelPoint(P, lx, ly, out) { return P.g.localToWorld(out.set(lx * P.w / 2, ly * P.h / 2, .02)); }
    function lookPanel(P, lx, ly) { look.mode = "point"; panelPoint(P, lx || 0, ly || 0, look.target); }
    function propsOff(now) { PANELS.forEach(function (P) { P.on = false; if (now) { P.k = 0; P.g.visible = false; } }); }
    function updPanels(dt) {
      PANELS.forEach(function (P) {
        P.k = damp(P.k, P.on ? 1 : 0, P.on ? 8 : 11, dt);
        var vis = P.k > .01; P.g.visible = vis;
        if (!vis) return;
        P.g.scale.setScalar(K * (.6 + .4 * P.k + (P.on ? .07 * Math.sin(P.k * PI) : 0)));
        P.mats[0].opacity = .2 * P.k; P.mats[1].opacity = P.k;
        panelPaint(P);
      });
    }

    // таблица Excel
    var XL_ROWS = [["Товар", "Кол-во", "Цена", "Сумма"], ["Кабель", "12", "150", "1 800"], ["Розетка", "8", "230", "1 840"],
      ["Лампа", "15", "320", "4 800"], ["Автомат", "6", "510", "3 060"], ["Щиток", "1", "950", "950"], ["Итого", "", "", ""]];
    function drawSheet(x, W, H, s) {
      x.clearRect(0, 0, W, H);
      x.save(); rr(x, 0, 0, W, H, 30); x.clip();
      x.fillStyle = "#fff"; x.fillRect(0, 0, W, H);
      x.fillStyle = "#1d6f42"; x.fillRect(0, 0, W, 56);
      rr(x, 18, 13, 32, 30, 7); x.fillStyle = "#fff"; x.fill();
      x.textBaseline = "middle"; x.fillStyle = "#1d6f42"; x.font = fnt(20, 800); x.textAlign = "center"; x.fillText("X", 34, 29);
      x.textAlign = "left"; x.fillStyle = "#fff"; x.font = fnt(23, 700); x.fillText("Отчёт.xlsx", 64, 29);
      x.fillStyle = "#f3f6f4"; x.fillRect(0, 56, W, 50);
      x.fillStyle = "#7a8a80"; x.font = "italic " + fnt(22, 600); x.fillText("fx", 20, 82);
      x.fillStyle = "#1e2a22"; x.font = fnt(20, 500, MONO); x.fillText((s.f || "") + (s.cur ? "▏" : ""), 62, 82);
      var cw = [46, 170, 120, 120, 184], cx = [0], top = 108, rh = 47, i, j;
      for (i = 0; i < cw.length; i++) cx.push(cx[i] + cw[i]);
      x.fillStyle = "#eef2ef"; x.fillRect(0, top, W, 32); x.fillRect(0, top, cw[0], H);
      x.fillStyle = "#6f8076"; x.font = fnt(16, 700); x.textAlign = "center";
      ["A", "B", "C", "D"].forEach(function (l, k) { x.fillText(l, cx[k + 1] + cw[k + 1] / 2, top + 17); });
      for (i = 0; i < 7; i++) x.fillText(String(i + 1), cw[0] / 2, top + 32 + rh * i + rh / 2);
      x.strokeStyle = "#d9e1db"; x.lineWidth = 1.5;
      for (i = 0; i <= 7; i++) { x.beginPath(); x.moveTo(0, top + 32 + rh * i); x.lineTo(W, top + 32 + rh * i); x.stroke(); }
      for (i = 1; i < cx.length; i++) { x.beginPath(); x.moveTo(cx[i], top); x.lineTo(cx[i], H); x.stroke(); }
      for (i = 0; i < 7; i++) for (j = 0; j < 4; j++) {
        var v = XL_ROWS[i][j], yy = top + 32 + rh * i + rh / 2;
        if (i === 6 && j === 3) {
          if (s.r === 1) { x.fillStyle = "#fde7e7"; x.fillRect(cx[4] + 1, top + 33 + rh * 6, cw[4] - 2, rh - 2); v = "#ЗНАЧ!"; x.fillStyle = "#c62828"; }
          else if (s.r === 2) { x.fillStyle = "#e3f4ea"; x.fillRect(cx[4] + 1, top + 33 + rh * 6, cw[4] - 2, rh - 2); v = "12 450 ✓"; x.fillStyle = "#1d6f42"; }
          else { v = ""; }
          x.font = fnt(20, 800); x.textAlign = "right"; x.fillText(v, cx[5] - 14, yy); continue;
        }
        x.fillStyle = i === 0 || i === 6 ? "#1e2a22" : "#33403a"; x.font = fnt(19, i === 0 || i === 6 ? 800 : 500);
        x.textAlign = j === 0 ? "left" : "right";
        x.fillText(v, j === 0 ? cx[1] + 12 : cx[j + 2] - 14, yy);
      }
      if (s.sel) {
        var sc = s.sel[0], sr = s.sel[1];
        x.strokeStyle = "#1d6f42"; x.lineWidth = 4; x.strokeRect(cx[sc] + 1, top + 32 + rh * (sr - 1) + 1, cw[sc] - 2, rh - 2);
        x.fillStyle = "#1d6f42"; x.fillRect(cx[sc + 1] - 7, top + 32 + rh * sr - 7, 9, 9);
      }
      x.restore();
    }
    // документ Word с колонтитулами
    function drawDoc(x, W, H, s) {
      x.clearRect(0, 0, W, H);
      x.save(); rr(x, 0, 0, W, H, 26); x.clip();
      x.fillStyle = "#fff"; x.fillRect(0, 0, W, H);
      x.fillStyle = "#2b579a"; x.fillRect(0, 0, W, 50);
      rr(x, 16, 11, 30, 28, 6); x.fillStyle = "#fff"; x.fill();
      x.textBaseline = "middle"; x.textAlign = "center"; x.fillStyle = "#2b579a"; x.font = fnt(19, 800); x.fillText("W", 31, 26);
      x.textAlign = "left"; x.fillStyle = "#fff"; x.font = fnt(21, 700); x.fillText("Договор.docx", 58, 26);
      var L = 40, R = W - 40;
      // верхний колонтитул
      if (s.hd) {
        x.fillStyle = s.ok ? "rgba(46,125,80,.06)" : "rgba(43,87,154,.06)"; x.fillRect(0, 50, W, 84);
        x.setLineDash([8, 6]); x.strokeStyle = s.ok ? "#2e7d50" : "#2b579a"; x.lineWidth = 2;
        x.beginPath(); x.moveTo(0, 134); x.lineTo(W, 134); x.stroke(); x.setLineDash([]);
        var tag = s.ok ? "Верхний колонтитул ✓" : "Верхний колонтитул";
        x.font = fnt(15, 700); var tw = x.measureText(tag).width + 18;
        rr(x, L - 6, 138, tw, 28, 6); x.fillStyle = s.ok ? "#dff1e6" : "#dbe5f5"; x.fill();
        x.fillStyle = s.ok ? "#2e7d50" : "#2b579a"; x.fillText(tag, L + 3, 153);
      }
      if (s.ht) {
        x.save(); x.translate(L + (s.hx || 0), 96); x.rotate(s.hr || 0);
        x.fillStyle = s.hd ? "#3a4558" : "#9aa3b2"; x.font = fnt(18, 600); x.fillText(s.ht, 0, 0); x.restore();
        x.fillStyle = "#9aa3b2"; x.font = fnt(15, 600); x.textAlign = "right"; x.fillText("стр. 1", R, 96); x.textAlign = "left";
      }
      // текст
      var ty = s.hd ? 206 : 186;
      x.fillStyle = "#1e2430"; x.font = fnt(25, 800); x.fillText(s.tt || "", L, ty);
      var tw2 = x.measureText(s.tt || "").width;
      var widths = [.96, .9, .97, .62, .93, .85, .7];
      x.fillStyle = "#d5dbe5";
      for (var i = 0; i < (s.n || 0); i++) { rr(x, L, ty + 34 + i * 30, (R - L) * widths[i % widths.length] * (i === s.n - 1 ? (s.np || 1) : 1), 11, 5); x.fill(); }
      if (s.cur) { x.fillStyle = "#2b579a"; x.fillRect(L + tw2 + 4, ty - 16, 3, 32); }
      // нижний колонтитул
      if (s.hd) {
        x.setLineDash([8, 6]); x.strokeStyle = s.ok ? "#2e7d50" : "#2b579a"; x.lineWidth = 2;
        x.beginPath(); x.moveTo(0, H - 70); x.lineTo(W, H - 70); x.stroke(); x.setLineDash([]);
        x.fillStyle = s.ok ? "#2e7d50" : "#2b579a"; x.font = fnt(14, 700); x.fillText("Нижний колонтитул", L, H - 50);
      }
      x.fillStyle = "#9aa3b2"; x.font = fnt(15, 600); x.textAlign = "right"; x.fillText(s.pg || "1", R + (s.px || 0), H - 26); x.textAlign = "left";
      x.restore();
    }
    // окно браузера: сайт собирается по блокам
    function drawBrowser(x, W, H, s) {
      x.clearRect(0, 0, W, H);
      x.save(); rr(x, 0, 0, W, H, 26); x.clip();
      x.fillStyle = "#fffaf1"; x.fillRect(0, 0, W, H);
      x.fillStyle = "#2a2f38"; x.fillRect(0, 0, W, 50);
      ["#e2605c", "#e8a33d", "#4fbf85"].forEach(function (c, i) { x.beginPath(); x.arc(26 + i * 22, 25, 7, 0, 7); x.fillStyle = c; x.fill(); });
      rr(x, 110, 11, W - 140, 28, 14); x.fillStyle = "#3a404b"; x.fill();
      x.fillStyle = "#a9e2bf"; x.font = fnt(15, 700); x.textBaseline = "middle"; x.fillText("🔒", 124, 26);
      x.fillStyle = "#e9ebee"; x.font = fnt(16, 600, MONO); x.fillText("мой-сайт.рф", 148, 26);
      var n = s.n || 0;
      function blk(i, fn) { if (n < i) return; var a = i === n ? (s.a == null ? 1 : s.a) : 1; x.save(); x.globalAlpha = a; x.translate(0, (1 - a) * 14); fn(); x.restore(); }
      blk(1, function () {
        x.beginPath(); x.arc(52, 82, 13, 0, 7); x.fillStyle = "#e44d26"; x.fill();
        x.fillStyle = "#1e1a15"; x.font = fnt(18, 800); x.fillText("Студия", 74, 83);
        [0, 1, 2].forEach(function (i) { rr(x, W - 230 + i * 66, 77, 50, 10, 5); x.fillStyle = "#c9bfae"; x.fill(); });
      });
      blk(2, function () { rr(x, 36, 120, 330, 24, 8); x.fillStyle = "#1e1a15"; x.fill(); rr(x, 36, 152, 250, 24, 8); x.fill(); });
      blk(3, function () { rr(x, 36, 192, 300, 11, 5); x.fillStyle = "#b7ab98"; x.fill(); rr(x, 36, 211, 230, 11, 5); x.fill(); });
      blk(4, function () {
        if (s.glow) { x.shadowColor = "rgba(228,77,38,.55)"; x.shadowBlur = 22; }
        rr(x, 36, 238, 176, 46, 14); x.fillStyle = "#e44d26"; x.fill(); x.shadowBlur = 0;
        x.fillStyle = "#fff"; x.font = fnt(18, 800); x.textAlign = "center"; x.fillText("Записаться", 124, 262); x.textAlign = "left";
        if (s.click) { x.beginPath(); x.arc(150, 262, 10 + s.click * 46, 0, 7); x.strokeStyle = "rgba(228,77,38," + (1 - s.click) + ")"; x.lineWidth = 4; x.stroke(); }
      });
      blk(5, function () {
        var g = x.createLinearGradient(400, 110, 610, 290); g.addColorStop(0, "#f0cd73"); g.addColorStop(1, "#d9775a");
        rr(x, 396, 110, 208, 174, 18); x.fillStyle = g; x.fill();
        x.beginPath(); x.arc(500, 186, 34, 0, 7); x.fillStyle = "rgba(255,255,255,.55)"; x.fill();
      });
      blk(6, function () {
        [0, 1, 2].forEach(function (i) {
          var X0 = 36 + i * 192; rr(x, X0, 308, 176, 112, 16); x.fillStyle = "#f3e7cf"; x.fill();
          rr(x, X0 + 16, 324, 34, 34, 9); x.fillStyle = "#d4a84b"; x.fill();
          rr(x, X0 + 16, 372, 120, 10, 5); x.fillStyle = "#c9bfae"; x.fill(); rr(x, X0 + 16, 392, 90, 10, 5); x.fill();
        });
      });
      if (s.mx != null) {          // курсор мыши
        x.save(); x.translate(s.mx, s.my); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, 26); x.lineTo(7, 20); x.lineTo(13, 32); x.lineTo(18, 30); x.lineTo(12, 18); x.lineTo(21, 18); x.closePath();
        x.fillStyle = "#1e1a15"; x.fill(); x.strokeStyle = "#fff"; x.lineWidth = 2; x.stroke(); x.restore();
      }
      x.restore();
    }
    // терминал Python
    function drawTerm(x, W, H, s) {
      x.clearRect(0, 0, W, H);
      x.save(); rr(x, 0, 0, W, H, 24); x.clip();
      x.fillStyle = "#0f1720"; x.fillRect(0, 0, W, H);
      x.fillStyle = "#1b2532"; x.fillRect(0, 0, W, 44);
      ["#e2605c", "#e8a33d", "#4fbf85"].forEach(function (c, i) { x.beginPath(); x.arc(24 + i * 20, 22, 6.5, 0, 7); x.fillStyle = c; x.fill(); });
      x.fillStyle = "#9aa7b6"; x.font = fnt(16, 600, MONO); x.textBaseline = "middle"; x.fillText("python — robot.py", 96, 23);
      var L = s.L || [];
      x.font = fnt(19, 500, MONO);
      L.forEach(function (l, i) { x.fillStyle = l[1]; x.fillText(l[0], 20, 72 + i * 31); });
      if (s.cur) { var last = L[L.length - 1], w = last ? x.measureText(last[0]).width : 0; x.fillStyle = "#4fbf85"; x.fillRect(22 + w, 60 + (Math.max(1, L.length) - 1) * 31, 11, 24); }
      x.restore();
    }
    // окно сборки C#
    function drawBuild(x, W, H, s) {
      x.clearRect(0, 0, W, H);
      x.save(); rr(x, 0, 0, W, H, 22); x.clip();
      x.fillStyle = "#f8f6fc"; x.fillRect(0, 0, W, H);
      x.fillStyle = "#512bd4"; x.fillRect(0, 0, W, 46);
      x.fillStyle = "#fff"; x.font = fnt(18, 700); x.textBaseline = "middle"; x.fillText("App.exe — сборка", 20, 24);
      x.fillText("—  ▢  ✕", W - 100, 24);
      x.fillStyle = "#3a2d5c"; x.font = fnt(18, 600, MONO); x.fillText("> dotnet build -c Release", 22, 82);
      var p = s.p || 0, steps = [["Восстановление пакетов", 15], ["Компиляция", 70], ["Публикация в EXE", 100]];
      x.font = fnt(17, 600);
      steps.forEach(function (st2, i) {
        var done = p >= st2[1], act = !done && (i === 0 || p >= steps[i - 1][1]);
        x.fillStyle = done ? "#1d8a4a" : act ? "#512bd4" : "#a89fbd"; x.fillText((done ? "✓ " : act ? "› " : "· ") + st2[0], 22, 122 + i * 32);
      });
      rr(x, 22, 232, W - 44, 22, 11); x.fillStyle = "#e6def8"; x.fill();
      if (p > 0) { rr(x, 22, 232, Math.max(22, (W - 44) * p / 100), 22, 11); x.fillStyle = s.ok ? "#1d8a4a" : "#512bd4"; x.fill(); }
      x.fillStyle = s.ok ? "#1d8a4a" : "#3a2d5c"; x.font = fnt(19, 800);
      x.fillText(s.ok ? "Сборка успешна ✓ App.exe готов" : "Сборка… " + p + "%", 22, 290);
      x.restore();
    }
    // мини-игра Godot с ИИ-врагом
    function drawGame(x, W, H, s) {
      var t = (s.f || 0) / 20;
      x.clearRect(0, 0, W, H);
      x.save(); rr(x, 0, 0, W, H, 24); x.clip();
      var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#1b2a41"); g.addColorStop(1, "#3b5a86"); x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = "rgba(255,255,255,.7)"; for (var i = 0; i < 14; i++) { x.fillRect((i * 97 + 30) % W, (i * 53 + 20) % 170 + 50, 2, 2); }
      x.fillStyle = "#e9ebee"; x.font = fnt(17, 800); x.textBaseline = "middle"; x.fillText("Игра №101 · ИИ-враги", 18, 26);
      x.textAlign = "right"; x.fillStyle = "#f0cd73"; x.fillText("★ " + (s.sc || 0), W - 18, 26); x.textAlign = "left";
      var gy = H - 64;
      x.fillStyle = "#5b8c3a"; x.fillRect(0, gy, W, 12); x.fillStyle = "#3d2f24"; x.fillRect(0, gy + 12, W, 64);
      rr(x, 300, gy - 92, 120, 16, 6); x.fillStyle = "#6b4f3a"; x.fill();
      [140, 250, 360, 470].forEach(function (cx0, i) {
        var hide = ((t * .9 + i * .37) % 3) < .35; if (hide) return;
        x.beginPath(); x.ellipse(cx0, gy - 50 + Math.sin(t * 3 + i) * 5, 9 * Math.abs(Math.cos(t * 3 + i)) + 2, 10, 0, 0, 7); x.fillStyle = "#f0cd73"; x.fill();
      });
      var px = 90 + 380 * (.5 + .5 * Math.sin(t * .9)), py = gy - 30 - Math.abs(Math.sin(t * 3.1)) * 74;
      var ex = 90 + 380 * (.5 + .5 * Math.sin((t - .8) * .9)), ey = gy - 26;
      rr(x, px - 22, py - 22, 44, 44, 12); x.fillStyle = "#478cbf"; x.fill();
      x.fillStyle = "#fff"; x.fillRect(px - 10, py - 8, 7, 9); x.fillRect(px + 4, py - 8, 7, 9);
      rr(x, ex - 22, ey - 22, 44, 44, 12); x.fillStyle = "#e2605c"; x.fill();
      x.fillStyle = "#fff"; x.font = fnt(15, 800); x.textAlign = "center"; x.fillText("ИИ", ex, ey + 1); x.textAlign = "left";
      x.strokeStyle = "rgba(226,96,92,.5)"; x.setLineDash([6, 6]); x.lineWidth = 2; x.beginPath(); x.moveTo(ex, ey - 24); x.lineTo(px, py + 20); x.stroke(); x.setLineDash([]);
      x.restore();
    }
    var props = {
      sheet: mkPanel(.56, .42, 640, drawSheet), doc: mkPanel(.4, .52, 480, drawDoc), web: mkPanel(.56, .392, 640, drawBrowser),
      term: mkPanel(.44, .3, 560, drawTerm), build: mkPanel(.44, .282, 560, drawBuild), game: mkPanel(.44, .3, 560, drawGame)
    };

    /* ---------- «силуэт глубины» робота для кубиков и мелочей на полу ----------
       Кубики и мелочи лежат сразу в двух слоях: под роботом и над ним. Верхняя копия проверяется
       по невидимому силуэту робота (капсулы по костям): где робот ближе к камере — верхняя копия
       не рисуется и виден робот, где кубик ближе — кубик поверх. Поэтому кубик больше не
       «телепортируется» сквозь руку, когда робот ставит его на башню. */
    var occMat = new THREE.MeshBasicMaterial({ colorWrite: false });
    var occCyl = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true), occSph = new THREE.SphereGeometry(1, 12, 8);
    function capsule() {
      var c = { a: new THREE.Mesh(occSph, occMat), b: new THREE.Mesh(occSph, occMat), m: new THREE.Mesh(occCyl, occMat) };
      [c.a, c.b, c.m].forEach(function (x) { x.renderOrder = -10; x.frustumCulled = false; cScene.add(x); });
      return c;
    }
    var _cd = new V3(), _UP = new V3(0, 1, 0);
    function setCapsule(c, A, B, r) {
      c.a.position.copy(A); c.b.position.copy(B); c.a.scale.setScalar(r); c.b.scale.setScalar(r);
      _cd.subVectors(B, A); var L = _cd.length();
      c.m.position.copy(A).addScaledVector(_cd, .5); c.m.scale.set(r, Math.max(L, 1e-3), r);
      if (L > 1e-6) c.m.quaternion.setFromUnitVectors(_UP, _cd.multiplyScalar(1 / L));
    }
    var OCC = {};
    ["armL", "foreL", "handL", "armR", "foreR", "handR", "thighL", "shinL", "footL", "thighR", "shinR", "footR", "torso", "shoulders", "pelvis", "head"]
      .forEach(function (k) { OCC[k] = capsule(); });
    var _o1 = new V3(), _o2 = new V3(), _o3 = new V3(), _o4 = new V3(), _o5 = new V3(), _oUp = new V3();
    function handPos(A, out) { return A.hand ? out.copy(boxCenter(A.hand)) : wpos(A.fore, out); }
    function updOcc() {
      frameDir(topP, _oUp.set(0, 1, 0));
      [[AL, OCC.armL, OCC.foreL, OCC.handL], [AR, OCC.armR, OCC.foreR, OCC.handR]].forEach(function (a) {
        var A = a[0]; wpos(A.arm, _o1); wpos(A.fore, _o2); handPos(A, _o3);
        setCapsule(a[1], _o1, _o2, .1 * K); setCapsule(a[2], _o2, _o3, .08 * K); setCapsule(a[3], _o3, _o3, .085 * K);
      });
      [[LL, OCC.thighL, OCC.shinL, OCC.footL], [LR, OCC.thighR, OCC.shinR, OCC.footR]].forEach(function (l) {
        var L = l[0]; wpos(L.hip, _o1); wpos(L.shin, _o2); wpos(L.foot, _o3);
        _m2.fromArray(L.foot.matrixWorld.elements); _o4.copy(L.bFt).transformDirection(_m2).multiplyScalar(.15 * K).add(_o3);
        setCapsule(l[1], _o1, _o2, .1 * K); setCapsule(l[2], _o2, _o3, .085 * K); setCapsule(l[3], _o3, _o4, .065 * K);
      });
      wpos(LL.hip, _o1); wpos(LR.hip, _o2); setCapsule(OCC.pelvis, _o1, _o2, .13 * K);
      _o3.addVectors(_o1, _o2).multiplyScalar(.5).addScaledVector(_oUp, .18 * K);
      wpos(head, _o4); _o5.copy(_o4).addScaledVector(_oUp, -.16 * K);
      setCapsule(OCC.torso, _o3, _o5, .24 * K);
      wpos(AL.arm, _o1); wpos(AR.arm, _o2); setCapsule(OCC.shoulders, _o1, _o2, .13 * K);
      _o1.copy(_o4).addScaledVector(_oUp, HEAD_TOP * .3); _o2.copy(_o4).addScaledVector(_oUp, HEAD_TOP * .7);
      setCapsule(OCC.head, _o1, _o2, HEAD_TOP * .42);
    }

    /* ---------- кисти-захваты: скелет из родной кисти робота ----------
       Берётся сама кисть Spline (та же форма, что у робота) и получает скелет: ладонь, четыре пальца
       по три фаланги и большой палец — каждый сустав двигается сам. Хват — как человек держит табличку
       за боковую кромку: ладонь внутрь, к груди и к предмету, тыльная сторона кисти — наружу, к зрителю;
       четыре пальца лежат на лицевой стороне у кромки, большой палец обхватывает предмет сзади.
       Левая рука — левая, правая — правая. При касании пальцы смыкаются по очереди с лёгким «доводом»,
       пока держит — живые микродвижения, отпустил или бросил — раскрываются, кисть остаётся на руке. */
    var Q4 = THREE.Quaternion;
    var gripMat = new THREE.MeshPhysicalMaterial({ color: 0x060607, metalness: .25, roughness: .18, clearcoat: 1, clearcoatRoughness: .05 });
    function blockGeo(w, h, d, r) {            // скруглённый брусок: w — по X, h — по Y, d — по Z
      var g = new THREE.ExtrudeGeometry(rrShape(w - 2 * r, h - 2 * r, Math.min(w, h) * .16), { depth: Math.max(.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 6 });
      g.center(); return g;
    }
    function sstep(a, b, x) { var k = (x - a) / (b - a); k = k < 0 ? 0 : k > 1 ? 1 : k; return k * k * (3 - 2 * k); }
    // Сырые координаты кисти Spline: Y — от запястья к пальцам, −Z — сторона ладони, большой палец со стороны −X.
    // Суставы: пальцы [x, yMCP, zMCP, yPIP, zPIP, yDIP, zDIP] (указательный, средний, безымянный, мизинец),
    // большой палец — CMC, MCP, IP.
    var FJ = [[-10.4, 27, 4.2, 34.2, 2.8, 39.5, -1.0], [-4.9, 27, 4.8, 34.5, 4.5, 40, -.1], [0, 27, 4.4, 34.5, 4.3, 40, .1], [5.2, 27, 4.2, 34, 3.2, 39.5, -1.0]];
    var TJ = [[-11.8, 13, 2.5], [-15, 23.5, .3], [-15.5, 29.5, -1]];
    var HR = (function () {
      var src = AL.hand && AL.hand.geometry;
      if (!src || !src.attributes.position || !src.attributes.normal || !src.index || !THREE.SkinnedMesh) return null;
      var pos = src.attributes.position, nor = src.attributes.normal, n = pos.count, i;
      var P = new Float32Array(n * 3), N = new Float32Array(n * 3);
      for (i = 0; i < n; i++) { P[3 * i] = pos.getX(i); P[3 * i + 1] = pos.getY(i); P[3 * i + 2] = pos.getZ(i); N[3 * i] = nor.getX(i); N[3 * i + 1] = nor.getY(i); N[3 * i + 2] = nor.getZ(i); }
      // веса вершин: какой палец — по X, какая фаланга — по высоте, у суставов плавно
      var XB = [-7.75, -2.5, 2.7], sI = new Uint16Array(n * 4), sW = new Float32Array(n * 4), w = new Float32Array(16);
      for (i = 0; i < n; i++) {
        var x = P[3 * i], y = P[3 * i + 1], j;
        for (j = 0; j < 16; j++) w[j] = 0;
        var a = sstep(-10.6, -12.8, x), b = sstep(-12.9, -13.9, x);
        var wT = (a + (b - a) * sstep(25, 27.5, y)) * sstep(7, 13, y) * (1 - sstep(35.5, 37.5, y));
        var wF = (1 - wT) * sstep(25, 28.5, y);
        w[0] += 1 - wT - wF;
        var f = x < XB[0] ? 0 : x < XB[1] ? 1 : x < XB[2] ? 2 : 3, J = FJ[f];
        var sp = sstep(J[3] - 1.2, J[3] + 1.2, y), sd = sstep(J[5] - 1.2, J[5] + 1.2, y);
        w[1 + f * 3] += wF * (1 - sp); w[2 + f * 3] += wF * sp * (1 - sd); w[3 + f * 3] += wF * sd;
        var sc = sstep(9, 15, y), sm2 = sstep(TJ[1][1] - 1.5, TJ[1][1] + 1.5, y), si = sstep(TJ[2][1] - 1.2, TJ[2][1] + 1.2, y);
        w[0] += wT * (1 - sc); w[13] += wT * sc * (1 - sm2); w[14] += wT * sm2 * (1 - si); w[15] += wT * si;
        var idx = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].sort(function (p, q) { return w[q] - w[p]; }).slice(0, 4), tot = 0;
        idx.forEach(function (k) { tot += w[k]; });
        idx.forEach(function (k, m) { sI[4 * i + m] = k; sW[4 * i + m] = tot > 0 ? w[k] / tot : (m ? 0 : 1); });
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("normal", new THREE.BufferAttribute(N, 3));
      g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(sI, 4)); g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sW, 4));
      g.setIndex(new THREE.BufferAttribute(new src.index.array.constructor(src.index.array), 1));
      g.computeBoundingSphere();
      return { geo: g };
    })();
    var X1 = new V3(1, 0, 0), Y1 = new V3(0, 1, 0), Z1 = new V3(0, 0, 1), _hq1 = new Q4(), _hq2 = new Q4(), _hq3 = new Q4();
    function buildHand() {                     // скелет: ладонь, 4×3 фаланги, большой палец ×3
      var bones = [], root = new THREE.Bone(); root.position.set(0, 0, 2); bones.push(root);
      FJ.forEach(function (J) {
        var m = new THREE.Bone(), p = new THREE.Bone(), d = new THREE.Bone();
        m.position.set(J[0], J[1], J[2] - 2); root.add(m);
        p.position.set(0, J[3] - J[1], J[4] - J[2]); m.add(p);
        d.position.set(0, J[5] - J[3], J[6] - J[4]); p.add(d);
        bones.push(m, p, d);
      });
      var c = new THREE.Bone(), tm = new THREE.Bone(), ti = new THREE.Bone();
      c.position.set(TJ[0][0], TJ[0][1], TJ[0][2] - 2); root.add(c);
      tm.position.set(TJ[1][0] - TJ[0][0], TJ[1][1] - TJ[0][1], TJ[1][2] - TJ[0][2]); c.add(tm);
      ti.position.set(TJ[2][0] - TJ[1][0], TJ[2][1] - TJ[1][1], TJ[2][2] - TJ[1][2]); tm.add(ti);
      bones.push(c, tm, ti);
      var mesh = new THREE.SkinnedMesh(HR.geo, gripMat);
      mesh.add(root); mesh.updateMatrixWorld(true);
      mesh.bind(new THREE.Skeleton(bones));      // привязка при единичной матрице меша
      mesh.frustumCulled = false;
      return { mesh: mesh, bones: bones };
    }
    // поза: f — 4 пальца [сгиб MCP, PIP, DIP, развод], t — большой палец [вперёд, к пальцам, поворот, MCP, IP], ts — длина большого пальца
    function setHand(H, pz) {
      var b = H.bones;
      for (var k = 0; k < 4; k++) {
        var F = pz.f[k];
        _hq1.setFromAxisAngle(Z1, F[3]); _hq2.setFromAxisAngle(X1, -F[0]); b[1 + k * 3].quaternion.copy(_hq1).multiply(_hq2);
        b[2 + k * 3].quaternion.setFromAxisAngle(X1, -F[1]);
        b[3 + k * 3].quaternion.setFromAxisAngle(X1, -F[2]);
      }
      var T = pz.t;
      _hq1.setFromAxisAngle(Z1, -T[1]); _hq2.setFromAxisAngle(X1, -T[0]); _hq3.setFromAxisAngle(Y1, T[2]);
      b[13].quaternion.copy(_hq1).multiply(_hq2).multiply(_hq3); b[13].scale.setScalar(pz.ts);
      b[14].quaternion.setFromAxisAngle(Z1, -T[3]);
      b[15].quaternion.setFromAxisAngle(Z1, -T[4]);
    }
    function mkPose() { return { f: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], t: [0, 0, 0, 0, 0], ts: 1 }; }
    var POSE = {
      open: { f: [[-.15, -.18, -.12, .12], [-.15, -.18, -.12, .03], [-.1, -.12, -.08, -.08], [-.05, -.08, -.05, -.18]], t: [.1, -.2, 0, -.15, -.15], ts: 1.08 },
      grip: { f: [[-.32, -.12, -.1, .09], [-.3, -.1, -.08, .02], [-.28, -.08, -.06, -.05], [-.25, -.05, -.04, -.13]], t: [.331, .495, .158, -.203, .188], ts: 1.28 }
    };
    // Хват в сырых координатах: кромка предмета — линия y = HG.yc (выше неё — кончики всех четырёх пальцев, сзади),
    // точка хвата — (HG.ax, HG.yc); лицевая плоскость предмета z = HG.zfr — под подушечками пальцев (большой палец — за предметом).
    var HG = { ax: -2.4, yc: 33.5, zfr: 1.6, cen: new V3(-5.6, 19, .5), tilt: .35 };
    if (HR) (function () {                     // где у позы хвата задняя плоскость (по кончикам пальцев за углом)
      var H = buildHand(), si = HR.geo.attributes.skinIndex, sw = HR.geo.attributes.skinWeight, pp = HR.geo.attributes.position, v = new V3(), zb = 1e9;
      setHand(H, POSE.grip); H.mesh.updateMatrixWorld(true);
      for (var i = 0; i < si.count; i++) {
        var b0 = si.getX(i); if (b0 < 1 || b0 > 12 || sw.getX(i) < .5) continue;
        v.fromBufferAttribute(pp, i); H.mesh.boneTransform(i, v);
        if (v.y > HG.yc - .5) zb = Math.min(zb, v.z);
      }
      if (zb < 1e8) HG.zfr = zb - .3;
    })();
    function mkGripHand() {
      var Hg = new THREE.Group(); Hg.matrixAutoUpdate = false;
      var H = HR ? buildHand() : null;
      if (H) Hg.add(H.mesh);
      Hg.visible = false; tScene.add(Hg);
      return { g: Hg, h: H, pz: mkPose() };
    }
    AL.gh = mkGripHand(); AR.gh = mkGripHand(); AL.gw = AR.gw = 0;
    [AL, AR].forEach(function (A, n) {
      A.hw = new M4(); A.rel = null; A.gt = 0; A.rt = 9; A.ph = n * 1.7;
      A.hs = A.hand ? new V3().setFromMatrixScale(A.hand.matrixWorld).x : K * .0039;     // единиц мира на единицу сырой кисти
      A.dsgn = A.hand && A.hand.matrixWorld.determinant() < 0 ? -1 : 1;                   // зеркальная ли родная кисть (левая/правая)
      A.poleW = new V3(); A.pk = 0; A.pkT = 0;
    });
    // o — объект (половинка значка или панель), s — какая боковая кромка (−1 левая, +1 правая), hw — полуширина,
    // ly — высота хвата на прямом участке кромки, zf — лицевая плоскость предмета (всё в координатах предмета)
    // mv — что подвигать, чтобы предмет лёг в кисти (значок целиком или панель)
    // b — хват снизу (за нижнюю кромку, ly тогда — точка по X на этой кромке)
    function grip(A, o, s, hw, ly, zf, mv, b) { if (HR) A.req = { o: o, s: s, hw: hw, ly: ly, zf: zf == null ? .001 : zf, mv: mv || null, b: b ? 1 : 0 }; }
    function gripIcon(A, g, side, bx) {
      if (bx != null) grip(A, g.halves[bx < 0 ? 0 : 1], side, ICON / 2, bx, .001, g, 1);
      else grip(A, g.halves[side < 0 ? 0 : 1], side, ICON / 2, -.015, .001, g);
    }
    var _gi = new M4(), _gt = new V3(), _gd = new V3(), _gn = new V3(), _gw0 = new V3(), _gw1 = new V3();
    var _f1 = new V3(), _f2 = new V3(), _f3 = new V3(), _fm = new M4(), _fX = new V3(), _fY = new V3(), _fZ = new V3(), _fO = new V3();
    // Базис кисти у боковой кромки: Y (пальцы) — внутрь предмета и чуть вверх, Z — от камеры (ладонь к зрителю),
    // X — по «руке»; у левой и правой руки большой палец при этом снизу и ложится на лицевую сторону.
    // Кромка режет кисть наискось: у большого пальца кисть глубже заходит на предмет (палец заметно лежит
    // на лице), у мизинца — меньше (пальцы видны).
    function gripFrame(o, s, hw, ly, zf, dsgn, hs, b) {
      o.updateMatrixWorld(true); _fm.copy(o.matrixWorld);
      _f1.setFromMatrixColumn(_fm, 0).normalize(); _f2.setFromMatrixColumn(_fm, 1).normalize(); _f3.setFromMatrixColumn(_fm, 2).normalize();
      if (b) _fY.copy(_f2).addScaledVector(_f1, -(ly < 0 ? -1 : 1) * .12).normalize();                   // хват снизу: пальцы вверх, чуть к середине
      else _fY.copy(_f1).multiplyScalar(-s * Math.cos(HG.tilt)).addScaledVector(_f2, Math.sin(HG.tilt));  // пальцы внутрь и чуть вверх
      _fZ.copy(_f3);                                                                     // тыльная сторона кисти — к зрителю
      _fX.crossVectors(_fY, _fZ).normalize(); if (dsgn < 0) _fX.negate();
      (b ? _fO.set(ly, -hw, zf) : _fO.set(s * hw, ly, zf)).applyMatrix4(_fm)
        .addScaledVector(_fX, -HG.ax * hs).addScaledVector(_fY, -HG.yc * hs).addScaledVector(_fZ, -HG.zfr * hs);
    }
    function handFromObj(A, out) {
      var r = A.gObj, hs = A.hs;
      gripFrame(r.o, r.s, r.hw, r.ly, r.zf, A.dsgn, hs, r.b);
      out.makeBasis(_gt.copy(_fX).multiplyScalar(hs), _gd.copy(_fY).multiplyScalar(hs), _gn.copy(_fZ).multiplyScalar(hs)); out.setPosition(_fO);
      return out;
    }
    // цель для руки — центр кисти в позе хвата; локоть уводится наружу и назад — предплечье продолжает кисть
    function gripAim(A, o, s, hw, ly, zf, out, b) {
      var hs = A.hs || K * .0039;
      gripFrame(o, s, hw, ly, zf, A.dsgn || 1, hs, b);
      if (A.hand) { out.copy(_fO).add(boxCenter(A.hand)).sub(wpos(A.hand, _gw0)); }          // предплечье приходит ровно в запястье кисти
      else out.copy(_fO).addScaledVector(_fX, HG.cen.x * hs).addScaledVector(_fY, HG.cen.y * hs).addScaledVector(_fZ, HG.cen.z * hs);
      A.poleW.copy(_fY).negate().addScaledVector(_f3, -.35).addScaledVector(_f2, -.35).normalize(); A.pkT = 1;
      return out;
    }
    // Кисть стоит ровно на конце предплечья. Если рука не дотянулась или чуть отстала на ходу,
    // предмет в руках мягко подъезжает к пальцам (не больше 7 см, плавно по силе хвата) — без зазора
    // между рукой и кистью. Сцена каждый кадр сама ставит предмет на место, сдвиг не копится.
    var NUD = [];
    function nudgeHeld() {
      NUD.length = 0;
      [AL, AR].forEach(function (A) {
        var r = A.req; if (!r || !r.mv) return;
        var u = r.mv.userData; if (u.np && r.mv.position.equals(u.np)) r.mv.position.sub(u.nv); u.np = null;
      });
      [AL, AR].forEach(function (A) {
        var r = A.req; if (!r || !r.mv || !A.hand || A.gw < .02 || r.mv.visible === false) return;
        r.mv.updateMatrixWorld(true);
        gripFrame(r.o, r.s, r.hw, r.ly, r.zf, A.dsgn, A.hs, r.b);
        var w = sm(A.gw), e = null, i;
        for (i = 0; i < NUD.length; i++) if (NUD[i].mv === r.mv) e = NUD[i];
        if (!e) { e = { mv: r.mv, v: new V3(), w: 0, m: 0 }; NUD.push(e); }
        e.v.addScaledVector(wpos(A.hand, _gw0).sub(_fO), w); e.w += w; e.m = Math.max(e.m, w);
      });
      NUD.forEach(function (e) {
        if (e.w < 1e-4) return;
        e.v.multiplyScalar(e.m / e.w);
        var L = e.v.length(), mx = .07 * K; if (L > mx) e.v.multiplyScalar(mx / L);
        e.mv.position.add(e.v); e.mv.updateMatrixWorld(true);
        var u = e.mv.userData; u.np = (u.np || new V3()).copy(e.mv.position); u.nv = (u.nv || new V3()).copy(e.v);
      });
    }
    function backOut(k) { k = clamp(k, 0, 1); var c1 = .9, c3 = c1 + 1, u = k - 1; return 1 + c3 * u * u * u + c1 * u * u; }
    var FDEL = [0, .045, .09, .13];            // задержка смыкания по пальцам: указательный → мизинец
    function updGrip(A, dt) {
      var r = A.req, G = A.gh;
      if (!HR || !G.h) { if (A.hand) A.hand.visible = true; return; }
      if (r && (!A.gObj || A.gw < .5 || (r.o === A.gObj.o && r.s === A.gObj.s))) A.gObj = r;
      var on = !!r && A.gObj === r;
      var o = A.gObj && A.gObj.o;
      var objOk = !!o && o.visible !== false && !(o.parent && o.parent.visible === false);
      if (on && !objOk) on = false;
      A.gw = damp(A.gw, on ? 1 : 0, on ? 11 : 4.5, dt);
      if (!on && !objOk && A.gw > .5) A.gw = .49;          // предмет исчез — кисть сразу обычная
      var vis = A.gw > .5 && (on || !!A.rel);
      G.g.visible = vis;
      if (A.hand) A.hand.visible = !vis;
      if (!vis) { A.gt = 0; if (A.gw < .02) A.rel = null; return; }
      if (on) { A.gt += dt; A.rt = 0; } else A.rt += dt;
      _gi.copy(A.fore.matrixWorld);
      if (on) {                                             // на предмете; запоминаем положение относительно предплечья
        handFromObj(A, A.hw); if (A.hand) A.hw.setPosition(wpos(A.hand, _gw1));     // запястье — ровно на конце предплечья
        A.rel = (A.rel || new M4()).copy(_gi).invert().multiply(A.hw);
      } else A.hw.multiplyMatrices(_gi, A.rel);           // отпустил — кисть едет вместе с рукой
      G.g.matrix.copy(A.hw); G.g.matrixWorldNeedsUpdate = true;
      // пальцы: при касании смыкаются по очереди с «доводом», пока держит — дышат, отпустил — раскрываются
      var pz = G.pz, O = POSE.open, Gp = POSE.grip, k, j, live = on ? sm((A.gt - .35) / .4) : 0, ph = T * 1.7 + A.ph;
      for (j = 0; j < 4; j++) {
        k = on ? backOut((A.gt - .02 - FDEL[j]) / .22) : 1 - sm((A.rt - FDEL[j] * .6) / .17);
        for (var q = 0; q < 4; q++) pz.f[j][q] = O.f[j][q] + (Gp.f[j][q] - O.f[j][q]) * k;
        if (j > 1) { pz.f[j][0] -= live * .035 * (1 + Math.sin(ph + j)); pz.f[j][1] -= live * .03 * (1 + Math.sin(ph * .8 + j * 1.3)); }   // чуть приподнимаются над лицом предмета
      }
      k = on ? backOut((A.gt - .07) / .24) : 1 - sm(A.rt / .14);
      for (j = 0; j < 5; j++) pz.t[j] = O.t[j] + (Gp.t[j] - O.t[j]) * k;
      pz.t[0] += live * .025 * Math.sin(ph * 1.3);          // большой палец то чуть сильнее прижимает, то отпускает
      pz.ts = O.ts + (Gp.ts - O.ts) * clamp(k, 0, 1);
      setHand(G.h, pz);
      G.g.updateMatrixWorld(true);
    }

    /* ---------- мелочи у коврика: ноутбук с кодом, планшет с сайтом, папки Word / Excel / PDF,
       ящик с инструментами, кружка, значки на подставках. Всё стоит лицом к камере и достаточно
       крупно, чтобы издалека читалось как вещь, а не как плоское пятно на полу. ---------- */
    (function () {
      var ANI = Math.min(8, gR.capabilities.getMaxAnisotropy());
      function tex(w, h, draw) {
        var c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
        var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANI; return t;
      }
      function std(color, o) { o = o || {}; return new THREE.MeshPhysicalMaterial({ color: color, metalness: o.m == null ? .1 : o.m, roughness: o.r == null ? .4 : o.r, clearcoat: o.cc == null ? .5 : o.cc, clearcoatRoughness: .15 }); }
      function scr(t) { return new THREE.MeshBasicMaterial({ map: t, toneMapped: false }); }
      // редактор кода
      var codeT = tex(640, 420, function (x, W, H) {
        x.fillStyle = "#0f141b"; x.fillRect(0, 0, W, H);
        x.fillStyle = "#1a212b"; x.fillRect(0, 0, W, 46); x.fillRect(0, 46, 54, H);
        rr(x, 66, 8, 150, 38, 8); x.fillStyle = "#0f141b"; x.fill();
        x.fillStyle = "#f0cd73"; x.beginPath(); x.arc(86, 27, 7, 0, 7); x.fill();
        x.fillStyle = "#d7dde5"; x.font = fnt(19, 700, MONO); x.textBaseline = "middle"; x.fillText("robot.py", 100, 28);
        var L = [[0, "#c39ae6", .2, "#5aa9e6", .34], [0, "#c39ae6", .16, "#e9ebee", .3], [0, null], [0, "#c39ae6", .12, "#4fbf85", .42], [1, "#e9ebee", .22, "#f0cd73", .3],
          [1, "#c39ae6", .1, "#e9ebee", .4], [2, "#5aa9e6", .26, "#e2605c", .18], [1, "#c39ae6", .14, "#4fbf85", .3], [0, null], [0, "#7f8a99", .55]];
        L.forEach(function (l, i) {
          var y = 68 + i * 34;
          x.fillStyle = "#4b5563"; x.font = fnt(17, 600, MONO); x.textAlign = "right"; x.fillText(String(i + 1), 40, y + 6); x.textAlign = "left";
          if (!l[1]) return;
          var X0 = 72 + l[0] * 34;
          rr(x, X0, y - 4, W * l[2], 18, 9); x.fillStyle = l[1]; x.fill();
          if (l[3]) { rr(x, X0 + W * l[2] + 12, y - 4, W * l[4], 18, 9); x.fillStyle = l[3]; x.fill(); }
        });
        x.fillStyle = "#4fbf85"; x.fillRect(72 + 34 * 1 + W * .22 + 12 + W * .3 + 6, 68 + 4 * 34 - 6, 4, 22);
      });
      // сайт
      var webT = tex(640, 440, function (x, W, H) {
        x.fillStyle = "#fffaf1"; x.fillRect(0, 0, W, H);
        x.fillStyle = "#2a2f38"; x.fillRect(0, 0, W, 40);
        ["#e2605c", "#e8a33d", "#4fbf85"].forEach(function (c, i) { x.beginPath(); x.arc(22 + i * 20, 20, 6.5, 0, 7); x.fillStyle = c; x.fill(); });
        rr(x, 96, 9, W - 130, 22, 11); x.fillStyle = "#3a404b"; x.fill();
        x.beginPath(); x.arc(46, 76, 14, 0, 7); x.fillStyle = "#e44d26"; x.fill();
        rr(x, 70, 68, 110, 16, 8); x.fillStyle = "#1e1a15"; x.fill();
        [0, 1, 2].forEach(function (i) { rr(x, W - 250 + i * 76, 70, 58, 12, 6); x.fillStyle = "#c9bfae"; x.fill(); });
        rr(x, 34, 118, 300, 30, 10); x.fillStyle = "#1e1a15"; x.fill(); rr(x, 34, 158, 230, 30, 10); x.fill();
        rr(x, 34, 204, 270, 13, 6); x.fillStyle = "#b7ab98"; x.fill(); rr(x, 34, 226, 210, 13, 6); x.fill();
        rr(x, 34, 258, 170, 48, 16); x.fillStyle = "#e44d26"; x.fill();
        x.fillStyle = "#fff"; x.font = fnt(20, 800); x.textAlign = "center"; x.fillText("Записаться", 119, 283); x.textAlign = "left";
        var g = x.createLinearGradient(380, 110, 600, 310); g.addColorStop(0, "#f0cd73"); g.addColorStop(1, "#d9775a");
        rr(x, 372, 108, 234, 196, 20); x.fillStyle = g; x.fill();
        x.beginPath(); x.arc(489, 196, 40, 0, 7); x.fillStyle = "rgba(255,255,255,.55)"; x.fill();
        [0, 1, 2].forEach(function (i) {
          var X0 = 34 + i * 196; rr(x, X0, 330, 180, 92, 16); x.fillStyle = "#f3e7cf"; x.fill();
          rr(x, X0 + 16, 346, 32, 32, 9); x.fillStyle = "#d4a84b"; x.fill();
          rr(x, X0 + 60, 352, 100, 11, 5); x.fillStyle = "#c9bfae"; x.fill(); rr(x, X0 + 60, 372, 70, 11, 5); x.fill();
        });
      });
      // клавиатура
      var keysT = tex(512, 200, function (x, W, H) {
        x.fillStyle = "#23262c"; x.fillRect(0, 0, W, H);
        for (var r2 = 0; r2 < 5; r2++) for (var k = 0; k < 14; k++) { rr(x, 8 + k * 35.8, 8 + r2 * 31, 30, 25, 5); x.fillStyle = r2 === 4 && k > 3 && k < 10 ? "#3a3e46" : "#353941"; x.fill(); }
        rr(x, 8 + 4 * 35.8, 8 + 4 * 31, 6 * 35.8 - 6, 25, 5); x.fillStyle = "#3e434c"; x.fill();
      });
      // корешки папок
      function spineT(col, label) {
        return tex(512, 104, function (x, W, H) {
          x.fillStyle = col; x.fillRect(0, 0, W, H);
          var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgba(255,255,255,.16)"); g.addColorStop(1, "rgba(0,0,0,.18)"); x.fillStyle = g; x.fillRect(0, 0, W, H);
          rr(x, W / 2 - 110, 18, 220, H - 36, 12); x.fillStyle = "#fff"; x.fill();
          x.fillStyle = col; x.font = fnt(46, 800); x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(label, W / 2, H / 2 + 2);
          x.beginPath(); x.arc(W - 58, H / 2, 16, 0, 7); x.fillStyle = "rgba(0,0,0,.28)"; x.fill();
        });
      }
      play.updateMatrixWorld(true);
      var camL = play.worldToLocal(new V3(BOT0.x, 168, 1090)), FY = Math.atan2(camL.x, camL.z);
      var RV = new V3(Math.cos(FY), 0, -Math.sin(FY)), FV = new V3(Math.sin(FY), 0, Math.cos(FY)), O = new V3(0, 0, .3);
      var stuff = new THREE.Group();
      // r — вправо (как видит камера), f — к камере; sh — размер тени
      function put(o, r, f, yaw, sh) {
        o.position.copy(O).addScaledVector(RV, r).addScaledVector(FV, f); o.rotation.y = FY + (yaw || 0); stuff.add(o);
        if (sh) { var b = blob(play, .55); b.position.set(o.position.x, .003, o.position.z); b.scale.set(sh[0], sh[1], 1); }
        return o;
      }
      var alu = std(0xaab0b9, { m: .9, r: .26, cc: .3 }), dark = std(0x1b1d22, { m: .4, r: .3, cc: 1 }), steel = std(0xc3c8d0, { m: 1, r: .22, cc: 0 });
      // ноутбук: крышка почти вертикально, экран с кодом смотрит в камеру
      var lap = new THREE.Group();
      var base = new THREE.Mesh(blockGeo(.46, .31, .02, .007), alu); base.rotation.x = -PI / 2; base.position.y = .01; lap.add(base);
      var kb = new THREE.Mesh(new THREE.PlaneGeometry(.4, .156), new THREE.MeshStandardMaterial({ map: keysT, roughness: .6 })); kb.rotation.x = -PI / 2; kb.position.set(0, .0205, -.035); lap.add(kb);
      var pad = new THREE.Mesh(blockGeo(.13, .075, .002, .0008), std(0x9aa0a9, { m: .8, r: .35, cc: 0 })); pad.rotation.x = -PI / 2; pad.position.set(0, .0205, .095); lap.add(pad);
      var lid = new THREE.Group(); lid.position.set(0, .02, -.15); lid.rotation.x = -.22; lap.add(lid);
      var lb = new THREE.Mesh(blockGeo(.46, .3, .012, .005), alu); lb.position.set(0, .15, 0); lid.add(lb);
      var bez2 = new THREE.Mesh(new THREE.PlaneGeometry(.44, .28), new THREE.MeshBasicMaterial({ color: 0x0b0d10 })); bez2.position.set(0, .15, .0062); lid.add(bez2);
      var sc1 = new THREE.Mesh(new THREE.PlaneGeometry(.41, .27 * .97), scr(codeT)); sc1.position.set(0, .152, .0066); lid.add(sc1);
      put(lap, .74, -.32, -.42, [.62, .46]);
      // планшет с сайтом на подставке
      var tab = new THREE.Group(), tg = new THREE.Group(); tg.rotation.x = -.26; tab.add(tg);
      var tb = new THREE.Mesh(blockGeo(.38, .27, .016, .007), dark); tb.position.set(0, .14, 0); tg.add(tb);
      var ts = new THREE.Mesh(new THREE.PlaneGeometry(.35, .24), scr(webT)); ts.position.set(0, .14, .0085); tg.add(ts);
      var leg = new THREE.Mesh(new THREE.BoxGeometry(.12, .015, .16), dark); leg.position.set(0, .008, -.05); tab.add(leg);
      var leg2 = new THREE.Mesh(new THREE.BoxGeometry(.03, .17, .012), dark); leg2.position.set(0, .08, -.09); leg2.rotation.x = .45; tab.add(leg2);
      put(tab, -1.15, -.2, .36, [.5, .32]);
      // папки Word / Excel / PDF стопкой, корешками к камере
      [["#2b579a", "W", .036, .06, .1], ["#1d6f42", "X", .108, -.05, -.07], ["#d93025", "PDF", .18, .02, .13]].forEach(function (b) {
        var col = new THREE.Color(b[0]), side = std(col, { r: .45, cc: .35 });
        var mats = [side, side, std(col.clone().multiplyScalar(.92), { r: .5, cc: .3 }), side, new THREE.MeshStandardMaterial({ map: spineT(b[0], b[1]), roughness: .45 }), side];
        var m = new THREE.Mesh(new THREE.BoxGeometry(.36, .072, .25), mats); m.position.set(b[3], b[2], 0); m.rotation.y = b[4];
        var grp = new THREE.Group(); grp.add(m);
        var pages = new THREE.Mesh(new THREE.BoxGeometry(.33, .05, .006), std(0xf6f1e6, { r: .8, cc: 0 })); pages.position.set(b[3], b[2], -.126); pages.rotation.y = b[4]; grp.add(pages);
        put(grp, -.8, .48, .22, b[2] < .05 ? [.5, .38] : null);
      });
      // ящик с инструментами: на крышке отвёртка, слева прислонён гаечный ключ
      var box = new THREE.Group(), red = std(0xc8372d, { r: .32, cc: .9 });
      var body = new THREE.Mesh(blockGeo(.36, .14, .17, .01), red); body.position.y = .07; box.add(body);
      var band = new THREE.Mesh(blockGeo(.365, .03, .175, .006), std(0x8f241d, { r: .35, cc: .8 })); band.position.y = .128; box.add(band);
      var hdl = new THREE.Mesh(new THREE.TorusGeometry(.065, .011, 10, 24, PI), dark); hdl.position.set(0, .143, 0); box.add(hdl);
      [-.11, .11].forEach(function (xx) { var l = new THREE.Mesh(blockGeo(.04, .03, .012, .003), steel); l.position.set(xx, .118, .088); box.add(l); });
      var sdh = new THREE.Mesh(new THREE.CylinderGeometry(.017, .02, .095, 14), std(0xe8a33d, { r: .3, cc: 1 })); sdh.rotation.z = PI / 2; sdh.position.set(-.06, .162, .03); sdh.rotation.y = .3; box.add(sdh);
      var sds = new THREE.Mesh(new THREE.CylinderGeometry(.005, .005, .12, 8), steel); sds.rotation.z = PI / 2; sds.position.set(.04, .162, .0); sds.rotation.y = .3; box.add(sds);
      var wr = new THREE.Group(); wr.position.set(-.205, 0, .02); wr.rotation.set(0, 0, .32); box.add(wr);
      var wh = new THREE.Mesh(blockGeo(.03, .19, .012, .004), steel); wh.position.y = .1; wr.add(wh);
      var wj = new THREE.Mesh(new THREE.TorusGeometry(.03, .012, 8, 18, PI * 1.5), steel); wj.position.y = .215; wj.rotation.z = PI * .75; wr.add(wj);
      put(box, -.5, -.62, .3, [.58, .4]);               // вне «коридора», где робот встаёт и идёт к камере (r ≈ .1….95, f > .15)
      // кружка
      var mug = new THREE.Group(), gold = std(0xd4a84b, { m: .55, r: .28, cc: 1 });
      var mb = new THREE.Mesh(new THREE.CylinderGeometry(.052, .047, .11, 32), gold); mb.position.y = .055; mug.add(mb);
      var cof = new THREE.Mesh(new THREE.CircleGeometry(.046, 28), new THREE.MeshStandardMaterial({ color: 0x3b2416, roughness: .3 })); cof.rotation.x = -PI / 2; cof.position.y = .1; mug.add(cof);
      var mh = new THREE.Mesh(new THREE.TorusGeometry(.03, .009, 8, 20), gold); mh.position.set(.056, .058, 0); mug.add(mh);
      put(mug, -.55, 1.25, -.3, [.2, .2]);
      // значки на подставках, чуть откинуты назад
      [["python", -1.0, 1.0, .25], ["js", .93, -.1, -.3], ["csharp", -1.55, .28, .4], ["godot", -1.9, -.1, .45]].forEach(function (a) {
        if (!ICONS[a[0]] || !window.appIconCanvas) return;
        var t = new THREE.CanvasTexture(window.appIconCanvas(a[0], 256)); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANI;
        var g = new THREE.Group(), tilt = new THREE.Group(); tilt.rotation.x = -.2; g.add(tilt);
        var bd = new THREE.Mesh(blockGeo(.24, .24, .03, .01), std(new THREE.Color(ICONS[a[0]].c2), { m: .2, r: .3, cc: 1 })); bd.position.set(0, .125, 0); tilt.add(bd);
        var f = new THREE.Mesh(new THREE.PlaneGeometry(.232, .232), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, transparent: true })); f.position.set(0, .125, .0156); tilt.add(f);
        var st2 = new THREE.Mesh(blockGeo(.21, .01, .09, .004), steel); st2.position.set(0, .005, -.012); g.add(st2);          // тонкая металлическая подставка
        var lip = new THREE.Mesh(blockGeo(.21, .028, .008, .003), steel); lip.position.set(0, .016, .038); lip.rotation.x = -.2; g.add(lip);
        put(g, a[1], a[2], a[3], [.32, .2]);
      });
      play.add(stuff); playTop.add(stuff.clone());
    })();

    /* ---------- всплывающие надписи (формулы, «?», теги) — обычный HTML поверх сцены ---------- */
    var fxBox = document.createElement("div"); fxBox.className = "robo-fx"; fxBox.setAttribute("aria-hidden", "true"); card.appendChild(fxBox);
    var FX = [], _fxa = new V3(), _fxb = new V3();
    function V(x, y, z) { return new V3(x, y, z); }
    function fx(text, cls, at, o) {      // at, o.from — точки в «наших» координатах робота
      o = o || {};
      var el = document.createElement("span"); el.className = "fx " + (cls || ""); el.textContent = text; fxBox.appendChild(el);
      var f = { el: el, at: at, from: o.from, fly: o.fly || .5, t: 0, life: o.life || 2.4, rise: o.rise == null ? 70 : o.rise, dx: o.dx || 0, sc: o.scale || 1 };
      FX.push(f); return f;
    }
    function updFx(dt) {
      for (var i = 0; i < FX.length; i++) {
        var f = FX[i]; f.t += dt;
        if (f.t >= f.life) { f.el.remove(); FX.splice(i--, 1); continue; }
        RL(f.at.x, f.at.y, f.at.z, _fxa);
        var rk = f.t / f.life;
        if (f.from && f.t < f.fly) { RL(f.from.x, f.from.y, f.from.z, _fxb); _fxa.lerpVectors(_fxb, _fxa, easeOut(f.t / f.fly)); rk = 0; }
        else if (f.from) rk = (f.t - f.fly) / (f.life - f.fly);
        var s = toScreen(_fxa), a = Math.min(1, f.t / .22) * Math.min(1, (f.life - f.t) / .45), zk = window.uiZ ? window.uiZ() : 1;
        s.x /= zk; s.y /= zk;                                   // экранные px → CSS px (масштаб страницы на широких экранах)
        var pop = f.t < .3 ? .75 + .25 * easeOut(f.t / .3) + .08 * Math.sin(f.t / .3 * PI) : 1;
        f.el.style.opacity = a.toFixed(3);
        f.el.style.transform = "translate(" + (s.x + f.dx * rk).toFixed(1) + "px," + (s.y - f.rise * easeOut(rk)).toFixed(1) + "px) translate(-50%,-50%) scale(" + (f.sc * pop).toFixed(3) + ")";
      }
    }
    function clearFx(soft) {
      FX.forEach(function (f) { if (soft) f.life = Math.min(f.life, f.t + .4); else f.el.remove(); });
      if (!soft) FX = [];
    }
    function every(h, key, t0, period, fn) {          // повторять fn каждые period секунд после t0
      if (h.t < t0) return;
      var n = Math.floor((h.t - t0) / period);
      if (h.said[key] !== n) { h.said[key] = n; fn(n); }
    }
    function typed(str, t, a, b) { return b <= a ? (t >= a ? str : "") : str.slice(0, Math.round(str.length * clamp((t - a) / (b - a), 0, 1))); }
    function script(t, S) {            // строки терминала: [начало, конец печати, текст, цвет]
      var out = [];
      S.forEach(function (l) { if (t >= l[0]) out.push([typed(l[2], t, l[0], l[1]), l[3]]); });
      return out.slice(-7);
    }

    /* ---------- сценки со значками: у каждого своя ---------- */
    var _p = new V3(), _p2 = new V3(), _p3 = new V3(), _q0 = new V3(), _tan = new V3(), _qp = new Q(), _qf = new Q();
    // слой значка: tScene — всегда поверх робота, cScene — с проверкой по «силуэту» (может уйти за робота)
    function layer(g, sc) { if (g.parent !== sc) sc.add(g); }
    // ориентация в полёте: значок летит лицом к камере (логотип виден), а верхний край — «нос» — смотрит
    // по ходу движения, с наклоном вперёд и креном. k: 0 — просто лицом к камере, 1 — полностью «в полёте»
    var _fd = new V3();
    function flyOrient(g, d, bank, k) {
      faceCam(g);
      if (k <= 0) return;
      _fd.copy(d).applyAxisAngle(_ry, root.yaw).transformDirection(tCam.matrixWorldInverse);
      g.rotateZ(Math.atan2(-_fd.x, _fd.y) * k); g.rotateX(-.55 * k); if (bank) g.rotateY(bank * .8 * k);
    }
    // траектория PDF (в «наших» координатах робота): вылет влево-вверх, дуга за головой, заход спереди-справа в руки
    var PDF = { T0: .45, WU: .5, RL: .66, FL: 2.3, A: new V3(-.34, 1.64, .16), R: new V3(-.48, 1.8, .52), C: new V3(0, 1.33, .52) };
    PDF.CA = PDF.RL + PDF.FL; PDF.CY = PDF.CA + 1.3; PDF.dir = PDF.R.clone().sub(PDF.A).normalize();
    PDF.path = new THREE.CatmullRomCurve3([PDF.R.clone(), new V3(-.7, 1.95, .36), new V3(-.62, 2.02, -.15), new V3(-.2, 1.93, -.5),
      new V3(.25, 1.89, -.5), new V3(.45, 1.9, -.1), new V3(.45, 1.66, .45), new V3(.3, 1.45, .8), PDF.C.clone()], false, "centripetal");
    var ovr = { cmd: 0, w: 0 };                 // поверх позы: например, руки в стороны для баланса
    function holdAt(g, x, y, z) { RL(x, y, z, g.position); faceCam(g); }
    function handsOn(g, w) {
      AL.w = AR.w = w == null ? 1 : w; edgeW(g, 1, AL.target); edgeW(g, -1, AR.target);
      if (AL.w > .6) { gripIcon(AL, g, 1); gripIcon(AR, g, -1); }
    }
    function halves(g, gap, rot) { g.halves[0].position.set(-gap, 0, 0); g.halves[0].rotation.set(0, 0, rot); g.halves[1].position.set(gap, 0, 0); g.halves[1].rotation.set(0, 0, -rot); }
    function once(h, key, at, fn) { if (h.t >= at && !h.said[key]) { h.said[key] = 1; fn(); } }
    function fromHold(t, dur, x, y, z) { var k = seg(t, 0, dur); return _p.set(lerp(HOLD[0], x, k), lerp(HOLD[1], y, k), lerp(HOLD[2], z, k)); }
    function nod() { tween(.45, function (k) { bump = Math.sin(k * PI) * .025; look.pitch += Math.sin(k * PI) * .012; }, lin); }
    // значок в правой руке (слева на экране), а левая рука берёт реквизит
    function iconRight(h, t, lift) {
      var g = h.g; fromHold(t, .7, -.37, (lift || 1.62) + Math.sin(t * 1.8) * .012, .34);       // на уровне плеча — предплечье подходит снизу
      holdAt(g, _p.x, _p.y, _p.z); g.rotateZ(.12 * seg(t, 0, .7));
      // перехват: от хвата у груди (за боковую кромку) — к хвату снизу, как показывают карточку: локоть внизу,
      // предплечье поднимается к кисти, пальцы на лицевой стороне — рука видна целиком (плечо, локоть, предплечье, кисть)
      AR.w = 1;
      if (t < .25) { edgeW(g, -1, AR.target, AR); gripIcon(AR, g, -1); }
      else { edgeW(g, -1, AR.target, AR, .03); if (t > .58) gripIcon(AR, g, -1, .03); }
    }
    function leftTo(h, t, P, lx, ly, t0, t1) {
      edgeW(h.g, 1, _q0, AL); if (lx >= 1) gripAim(AL, P.g, 1, P.w / 2, -P.h * .18, .001, _p3); else panelPoint(P, lx, ly, _p3);
      var k = seg(t, t0, t1);
      AL.w = 1; AL.target.copy(_q0).lerp(_p3, k);
      if (lx >= 1 && k > .85) grip(AL, P.g, 1, P.w / 2, -P.h * .18, .001, P.g);      // держит панель за правую кромку
    }
    var XL_IDLE = ["=ВПР(A2;Цены!A:B;2;0)", "=СУММЕСЛИ(A:A;\"Лампа\";D:D)", "=СЧЁТЕСЛИ(B2:B6;\">5\")", "=ЕСЛИ(D7>10000;\"ок\";\"мало\")", "=ОКРУГЛ(D7*1,2;0)", "=ИНДЕКС(A2:A6;ПОИСКПОЗ(МАКС(D2:D6);D2:D6;0))"];
    var WD_IDLE = ["Ctrl+S", "Оглавление ✓", "Стиль: Заголовок 1", "Нумерация страниц", "Колонтитулы ✓", "Разрыв страницы"];
    var JS_BITS = ["() => {}", "await fetch()", "console.log('👋')", "npm run dev", "{ ...props }", "addEventListener", "async", "const app = 🚀"];
    var HTML_TAGS = ["<nav>", "<h1>", "<p>", "<button>", "<img>", "<section>"];
    var PY_SCRIPT = [[.35, .8, ">>> import robot", "#e9ebee"], [.85, 1.25, ">>> robot.hold('python')", "#e9ebee"],
      [1.3, 1.3, "Traceback (most recent call last):", "#ff8a80"], [1.32, 1.32, "  IconError: значок треснул", "#ff8a80"],
      [2.7, 3.05, ">>> robot.fix()", "#e9ebee"], [3.1, 3.1, "✓ Починил. Тесты: 12/12", "#4fbf85"]];
    var ACTS = {
      // Python: терминал, ломает значок, ошибка, чинит
      python: function (h, t) {
        var g = h.g, bob = Math.sin(t * 2) * .01;
        fromHold(t, .45, 0, 1.2, .4); holdAt(g, _p.x, _p.y + bob, _p.z);
        var shake = t > .7 && t < 1.3 ? Math.sin(t * 60) * .04 * seg(t, .7, 1.2) : 0;
        g.rotateZ(shake);
        var gap = .05 * seg(t, 1.3, 1.5) * (1 - seg(t, 2.7, 3.1)), rot = .38 * seg(t, 1.3, 1.5) * (1 - seg(t, 2.7, 3.1));
        halves(g, gap, rot);
        handsOn(g);
        var P = props.term; P.on = t > .2; placePanel(P, .25, 1.52 + Math.sin(t * 1.3) * .01, .4, .04);
        P.s = { L: script(t, PY_SCRIPT), cur: Math.floor(t * 2.5) % 2 };
        once(h, "crack", 1.3, function () {
          tween(.3, function (k) { bump = Math.sin(k * PI) * .03; }, lin); say("Ой… сломал 😬", 1500, "info"); look.tilt0 = -.18;
          fx("IconError", "fx--err", V(.28, 1.72, .4), { life: 2 });
        });
        once(h, "fix", 3.1, function () { look.tilt0 = 0; say("Починил! " + ICONS.python.say, 0, "info"); fx("12/12 ✓", "fx--ok", V(.28, 1.72, .4), { life: 2.2 }); nod(); });
        if (t < 1.3) look.mode = "icon";
        else if (t < 1.9) look.mode = "camera";
        else if (t < 3.2) lookPanel(P, -.2, .1);
        else look.mode = "cursor";
        var fl = 1 + .14 * Math.sin(seg(t, 3.05, 3.35) * PI); g.scale.setScalar(K * fl);
      },
      // C#: роняет, поднимает и собирает EXE
      csharp: function (h, t) {
        var g = h.g;
        if (t < .9) {
          fromHold(t, .4, 0, 1.2, .4); holdAt(g, _p.x, _p.y + Math.sin(t * 2) * .01, _p.z); handsOn(g); look.mode = "icon";
        } else if (t < 2.6) {
          var ft = t - .9, y = 1.2 - 4.9 * ft * ft, z = .4 + ft * .35, floorY = ICON / 2;
          if (y < floorY) { y = floorY + Math.abs(Math.sin((ft - .45) * 9)) * .12 * Math.exp(-(ft - .45) * 4); }
          holdAt(g, .05 * Math.min(1, ft * 3), y, z); g.rotateX(Math.min(ft, .55) * 9); g.rotateZ(Math.min(ft, .55) * 3);
          AL.w = AR.w = 1 - seg(t, .9, 1.15);
          crouchW = seg(t, 1.6, 2.3) * .85;
          if (t > 1.9) { AL.w = AR.w = seg(t, 1.9, 2.4); edgeW(g, 1, AL.target); edgeW(g, -1, AR.target); if (t > 2.3) { gripIcon(AL, g, 1); gripIcon(AR, g, -1); } }
          once(h, "oops", .95, function () { tween(.3, function (k) { bump = Math.sin(k * PI) * .03; }, lin); say("Ой! Скользкий…", 1500, "info"); });
          look.mode = "icon";
        } else {
          var k = seg(t, 2.6, 3.4); crouchW = .85 * (1 - k);
          _p.set(.05, ICON / 2, .4 + 1.7 * .35); _p2.set(HOLD[0], HOLD[1], HOLD[2]); _p.lerp(_p2, k);
          holdAt(g, _p.x, _p.y + (k >= 1 ? Math.sin(t * 2) * .01 : 0), _p.z); g.rotateX((1 - k) * 4.95); g.rotateZ((1 - k) * 1.65);
          handsOn(g);
          if (t > 3.4 && t < 5.3) lookPanel(props.build, .1, 0); else look.mode = t < 3.4 ? "icon" : "cursor";
        }
        var P = props.build; P.on = t > 3.4; placePanel(P, .25, 1.54 + Math.sin(t * 1.2) * .008, .4, .03);
        var pr = t < 3.7 ? 0 : t < 4.3 ? 15 * seg(t, 3.7, 4.3) : t < 4.9 ? 15 + 55 * seg(t, 4.3, 4.9) : 70 + 30 * seg(t, 4.9, 5.25);
        P.s = { p: Math.round(pr), ok: t > 5.3 ? 1 : 0 };
        once(h, "b", 3.7, function () { fx("dotnet build", "fx--cs", V(.26, 1.74, .4), { life: 2 }); });
        once(h, "ok", 5.3, function () { fx("App.exe ✓", "fx--ok", V(.28, 1.76, .4), { life: 2.4 }); say(ICONS.csharp.say, 0, "info"); nod(); });
      },
      // Godot: крутит на пальце, а рядом идёт его игра с ИИ-врагом
      godot: function (h, t) {
        var g = h.g, k = seg(t, 0, .6), u = Math.max(0, t - .5), R = 1.5;
        RL(HOLD[0], HOLD[1], HOLD[2], _p); RL(-.2, 1.72, .28, _p2); g.position.lerpVectors(_p, _p2, k);
        faceCam(g); g.rotateY(14 * (u < R ? u * u / (2 * R) : R / 2 + (u - R))); g.rotateZ(.12);
        edgeW(g, -1, _q0); RL(-.2, 1.72 - ICON * .62, .28, _p3);
        AR.w = 1; AR.target.copy(_q0).lerp(_p3, seg(t, .1, .7));
        AL.w = 1 - seg(t, .15, .65); edgeW(g, 1, AL.target); if (t < .2) { gripIcon(AL, g, 1); gripIcon(AR, g, -1); }
        var P = props.game; P.on = t > .55; placePanel(P, .26, 1.5 + Math.sin(t * 1.1) * .008, .4, .03);
        P.s = { f: Math.floor(t * 20), sc: 10 + Math.floor(t * 1.4) };
        if (t > 1 && t < 2.3) lookPanel(P, .2 * Math.sin(t * 2), 0); else look.mode = "icon";
        once(h, "s", .7, function () { say(ICONS.godot.say, 0, "info"); });
        once(h, "ai", 1.3, function () { fx("ИИ-агент гонится за игроком", "fx--gd", V(.24, 1.72, .4), { life: 2.4 }); });
        once(h, "n", 2.6, function () { fx("100+ игр с ИИ", "fx--gd", V(.24, 1.74, .4), { life: 2.6, rise: 60 }); });
      },
      // JavaScript: ставит на голову, балансирует, руки в стороны, вокруг летает код
      js: function (h, t) {
        var g = h.g, k = seg(t, .3, 1.1);
        RL(HOLD[0], HOLD[1], HOLD[2], _p);
        // точка над головой считается от шеи и корпуса, а не от поворота головы: иначе голова
        // смотрит на значок, значок едет за головой, голова — за значком, и всё трясётся
        wpos(head, _p2); frameDir(topP, _tan.set(0, 1, 0)); frameDir(topP, _q0.set(0, 0, 1));
        _tan.applyAxisAngle(_q0, look.tilt);
        _p2.addScaledVector(_tan, HEAD_TOP + ICON * K * .5 + 1.6);
        pathCtl.copy(_p).lerp(_p2, .5); pathCtl.z += .25 * K;
        bez(_p, pathCtl, _p2, k, g.position);
        faceCam(g); g.rotateZ(look.tilt * 1.4 * k);
        h.lift = ICON * K * 1.15 * seg(t, .8, 1.1);
        var off = seg(t, 1.1, 1.6);
        AL.w = AR.w = 1 - off; edgeW(g, 1, AL.target); edgeW(g, -1, AR.target);
        var sw = Math.sin(t * 2.6);
        ovr.cmd = seg(t, 1.2, 1.8); ovr.slx = -.1; ovr.srx = -.1; ovr.slz = 1.05 - sw * .2; ovr.srz = -1.05 - sw * .2; ovr.el = -.25; ovr.er = -.25; ovr.tilt = -sw * .05;
        if (t > 1.2) { look.mode = "cursor"; look.tilt0 = sw * .13; } else look.mode = "icon";
        once(h, "s", 1.4, function () { say("Смотри — без рук! " + ICONS.js.say, 0, "info"); });
        every(h, "bits", 1.7, .75, function (n) {
          var side = n % 2 ? 1 : -1;
          fx(JS_BITS[n % JS_BITS.length], "fx--js", V(side * (.3 + (n * 37 % 10) / 70), 1.45 + (n * 53 % 10) / 25, .3), { life: 2.1, rise: 50, dx: side * 16 });
        });
      },
      // HTML: в правой руке значок, левой «печатает» — сайт собирается по блокам
      html: function (h, t) {
        iconRight(h, t, 1.64);
        var P = props.web; P.on = t > .45; placePanel(P, .16, 1.12 + Math.sin(t * 1.2) * .008, .54, -.03);
        var typing = t < 4 ? 1 : 0;
        leftTo(h, t, P, -.8 + .05 * Math.sin(t * 13) * typing, -.62 + .04 * Math.sin(t * 17) * typing, .3, .9);
        var n = clamp(Math.floor((t - .9) / .5) + 1, 0, 6), a = n < 6 ? clamp(((t - .9) % .5) / .3, 0, 1) : clamp((t - 3.4) / .3, 0, 1);
        var cl = t > 4.6 ? ((t - 4.6) % 2.4) : -1, mx = null, my = null;
        if (t > 4.2) {                       // курсор подъезжает к кнопке, жмёт и отъезжает
          var go = cl < 0 ? 0 : seg(cl, 0, .3) * (1 - seg(cl, 1.7, 2.3));
          mx = Math.round(lerp(570, 150, go)); my = Math.round(lerp(360, 262, go));
        }
        P.s = { n: n, a: +a.toFixed(2), glow: t > 4 ? 1 : 0, click: cl > .3 && cl < .9 ? +((cl - .3) / .6).toFixed(2) : 0, mx: mx, my: my };
        every(h, "tag", .9, .5, function (i) {
          if (i > 5) return;
          fx(HTML_TAGS[i], "fx--html", V(.06 + (i % 3) * .1, 1.2 - (i % 2) * .08, .56), { from: V(-.08, .98, .58), fly: .45, life: 1.4, rise: 26 });
        });
        once(h, "done", 4, function () { say(ICONS.html.say, 0, "info"); nod(); fx("Сайт готов ✓", "fx--ok", V(.16, 1.42, .54), { life: 2.4 }); });
        every(h, "lead", 4.6, 2.4, function () { if (h.t > 5) fx("+1 заявка", "fx--ok", V(.02, 1.18, .56), { life: 1.8, rise: 60 }); });
        if (t < .9) look.mode = "icon";
        else if (t < 4) lookPanel(P, -.4 + .6 * (((t - .9) / .5) % 1), .5 - Math.floor((t - .9) / 1.1) * .4);
        else if (t < 5.2) look.mode = "camera";
        else lookPanel(P, -.2, -.1);
      },
      // Excel: значок в одной руке, таблица в другой; формулы, «#ЗНАЧ!», «?» — и в итоге всё сходится
      excel: function (h, t) {
        iconRight(h, t);
        var P = props.sheet; P.on = t > .3; placePanel(P, .06, 1.3 + Math.sin(t * 1.5) * .008, .36, -.05);
        leftTo(h, t, P, 1.0, -.4, .25, .8);
        var f1 = "=СУММ(D2:D6)", f2 = "=СУММ(ЗНАЧЕН(D2:D6))", f = "", r = 0, sel = [4, 7];
        if (t < .9) sel = [4, 2 + Math.floor(t * 5) % 5];
        else if (t < 1.6) f = typed(f1, t, .9, 1.55);
        else if (t < 2.4) { f = f1; r = 1; }
        else if (t < 3.2) { f = typed(f2, t, 2.4, 3.1); r = 1; }
        else { f = f2; r = 2; }
        if (t > 4.6) { var n = Math.floor((t - 4.6) / 2.6), ph = (t - 4.6) % 2.6; f = typed(XL_IDLE[n % XL_IDLE.length], ph, 0, .9); sel = [1 + n % 4, 2 + (n * 3) % 5]; }
        P.s = { f: f, r: r, sel: sel, cur: t > .9 && Math.floor(t * 3) % 2 ? 1 : 0 };
        once(h, "f1", 1.6, function () { fx(f1, "fx--xl", V(.2, 1.34, .52), { life: 2.2, rise: 90 }); });
        once(h, "err", 1.7, function () { fx("#ЗНАЧ!", "fx--err", V(.32, 1.02, .52), { life: 1.8, rise: 50 }); });
        once(h, "q1", 1.85, function () { fx("?", "fx--q", V(.24, 1.96, .2), { life: 1.7, rise: 16 }); look.tilt0 = .22; });
        once(h, "q2", 2.5, function () { fx("?", "fx--q", V(.36, 1.99, .2), { life: 1.1, rise: 14, scale: .7 }); });
        once(h, "ok", 3.2, function () {
          look.tilt0 = 0; fx(f2, "fx--xl", V(.2, 1.34, .52), { life: 2.2, rise: 90 });
          fx("💡", "fx--idea", V(.24, 1.96, .2), { life: 1.6, rise: 20 }); fx("12 450 ✓", "fx--ok", V(.3, 1.0, .52), { life: 2, rise: 50 });
          say(ICONS.excel.say, 0, "info"); nod();
        });
        every(h, "idle", 4.6, 2.6, function (i) { fx(XL_IDLE[i % XL_IDLE.length], "fx--xl", V(.1 + (i % 3) * .06, 1.34, .52), { life: 2.6, rise: 100 }); });
        if (t < .8) look.mode = "icon";
        else if (t < 1.8) lookPanel(P, -.3 + .5 * seg(t, .9, 1.6), .55);
        else if (t < 2.4) look.mode = "camera";
        else if (t < 3.2) lookPanel(P, .3, .55);
        else if (t < 4) look.mode = "camera";
        else if (((t - 4) % 5) < 3) lookPanel(P, 0, .2); else look.mode = "cursor";
      },
      // Word: значок в одной руке, документ в другой — правит колонтитулы, они разъезжаются, потом встают на место
      word: function (h, t) {
        iconRight(h, t);
        var P = props.doc; P.on = t > .3; placePanel(P, .09, 1.34 + Math.sin(t * 1.4) * .008, .36, -.05);
        leftTo(h, t, P, 1.0, -.4, .25, .8);
        var title = "Договор на разработку", hd = t > 1.9 ? 1 : 0, ok = t > 3.35 ? 1 : 0;
        var broke = t > 2.4 && t < 3.35, hx = broke ? Math.sin(t * 9) * 26 + 18 : 0, hr = broke ? Math.sin(t * 7) * .06 : 0;
        var n = t < 1.5 ? 0 : Math.min(6, 1 + Math.floor((t - 1.5) / .12)), np = n < 6 ? clamp(((t - 1.5) % .12) / .12, .2, 1) : 1;
        P.s = { tt: typed(title, t, .8, 1.5), n: n, np: +np.toFixed(2), cur: t > .8 && t < 1.6 && Math.floor(t * 4) % 2 ? 1 : 0,
          hd: hd, ok: ok, ht: hd ? typed("ООО «Ромашка» · 2026", t, 1.95, 2.4) : "", hx: Math.round(hx), hr: +hr.toFixed(3),
          pg: broke ? "стр. 1 из 0" : "стр. 1 из 1", px: broke ? Math.round(Math.sin(t * 8) * 10) : 0 };
        once(h, "hd", 1.95, function () { fx("Колонтитулы", "fx--wd", V(-.3, 1.78, .4), { life: 1.6, rise: 50 }); });
        once(h, "br", 2.45, function () { fx("Колонтитулы?!", "fx--wd", V(.26, 1.5, .52), { life: 2, rise: 70 }); look.tilt0 = .2; });
        once(h, "q", 2.6, function () { fx("?", "fx--q", V(.24, 1.96, .2), { life: 1.6, rise: 16 }); });
        once(h, "sec", 2.85, function () { fx("Разрыв раздела", "fx--err", V(.24, .94, .52), { life: 1.8, rise: 50 }); });
        once(h, "ok", 3.35, function () { look.tilt0 = 0; fx("Готово ✓", "fx--ok", V(.22, 1.5, .52), { life: 2, rise: 60 }); say(ICONS.word.say, 0, "info"); nod(); });
        every(h, "idle", 4.8, 2.8, function (i) { fx(WD_IDLE[i % WD_IDLE.length], "fx--wd", V(.14 + (i % 2) * .1, 1.46, .52), { life: 2.4, rise: 80 }); });
        if (t < .8) look.mode = "icon";
        else if (t < 1.9) { var row = Math.floor(t * 2.4) % 4; lookPanel(P, -.5 + ((t * 1.7) % 1), .45 - row * .12); }
        else if (t < 2.45) lookPanel(P, -.3, .75);
        else if (t < 3.3) look.mode = "camera";
        else if (t < 4.2) lookPanel(P, 0, .75);
        else if (((t - 4.2) % 5) < 3) lookPanel(P, -.2 + ((t * .8) % 1) * .6, .3); else look.mode = "cursor";
      },
      // PDF: замах, бросок самолётиком — облетает робота (проходит и за головой) и прилетает
      // в подставленные руки: руки заранее встают «на ловлю», значок тормозит, пальцы смыкаются
      pdf: function (h, t) {
        var g = h.g, u = t < PDF.T0 ? -1 : (t - PDF.T0) % PDF.CY, lap = Math.floor((t - PDF.T0) / PDF.CY);
        RL(0, HOLD[1] + Math.sin(t * 2) * .01, HOLD[2], _p3);
        look.mode = "icon"; look.speed = 8;
        once(h, "s", .9, function () { say(ICONS.pdf.say, 0, "info"); });
        if (u < 0) { layer(g, tScene); g.position.copy(_p3); faceCam(g); handsOn(g); return; }
        if (u < PDF.WU) {                                     // замах: правой рукой назад-вверх, нос самолётика вперёд
          var k = easeIO(u / PDF.WU);
          RL(lerp(0, PDF.A.x, k), lerp(HOLD[1], PDF.A.y, k), lerp(HOLD[2], PDF.A.z, k), g.position);
          flyOrient(g, PDF.dir, 0, k);
          AR.w = 1; AR.fast = 1; edgeW(g, -1, AR.target); gripIcon(AR, g, -1);
          AL.w = 1 - seg(u, .04, .3); edgeW(g, 1, AL.target); if (u < .1) gripIcon(AL, g, 1);
          return;
        }
        if (u < PDF.RL) {                                     // бросок: рука ведёт значок до точки отпускания
          var k2 = (u - PDF.WU) / (PDF.RL - PDF.WU);
          RL(lerp(PDF.A.x, PDF.R.x, k2), lerp(PDF.A.y, PDF.R.y, k2), lerp(PDF.A.z, PDF.R.z, k2), g.position);
          flyOrient(g, PDF.dir, 0, 1);
          AR.w = 1; AR.fast = 1; edgeW(g, -1, AR.target); gripIcon(AR, g, -1); AL.w = 0;
          once(h, "pdf" + lap, PDF.T0 + lap * PDF.CY + PDF.WU, function () { fx(lap ? "Отправлено.pdf" : "Сохранить как PDF", "fx--pdf", V(-.1, 1.85, .25), { life: 1.8, rise: 50 }); });
          return;
        }
        var ca = u - PDF.CA;                                  // время от момента ловли
        if (ca < -.05) {                                      // полёт
          var s = clamp((u - PDF.RL) / PDF.FL, 0, 1), ws = 1 - Math.pow(1 - s, 1.5);
          layer(g, s < .8 ? cScene : tScene);                 // за головой — с «силуэтом», на заходе в руки — поверх
          PDF.path.getPointAt(ws, _p); RL(_p.x, _p.y, _p.z, g.position);
          PDF.path.getTangentAt(ws, _tan); PDF.path.getTangentAt(Math.min(1, ws + .04), _q0);
          var bank = clamp((_tan.z * _q0.x - _tan.x * _q0.z) * 22, -.8, .8);
          flyOrient(g, _tan, bank, 1 - sm((s - .74) / .24));
        } else {                                              // поймал: значок по инерции чуть отжимает руки назад
          layer(g, tScene);
          var rk = seg(ca, 0, .32), back = Math.sin(rk * PI) * .07, set = seg(ca, .15, .8);
          RL(lerp(PDF.C.x, 0, set), lerp(PDF.C.y, HOLD[1], set) - back * .25 + Math.sin(t * 2) * .01 * set, lerp(PDF.C.z, HOLD[2], set) - back, g.position);
          faceCam(g);
          once(h, "back" + lap, PDF.T0 + lap * PDF.CY + PDF.CA, function () { fx("Доставлено ✓", "fx--ok", V(.1, 1.75, .4), { life: 1.6, rise: 40 }); tween(.3, function (k3) { bump = Math.sin(k3 * PI) * .02; }, lin); });
        }
        // руки: правая доводит бросок и опускается, потом обе встают «на ловлю» и встречают значок
        var fol = u - PDF.RL;
        if (fol < .55) {
          var fk = easeOut(seg(fol, 0, .3));
          RL(PDF.R.x + PDF.dir.x * .3 * fk, PDF.R.y + PDF.dir.y * .3 * fk - .35 * seg(fol, .15, .55), PDF.R.z + PDF.dir.z * .3 * fk, AR.target);
          AR.w = 1 - seg(fol, .2, .55); AR.fast = fol < .25 ? 1 : 0; AL.w = 0;
        }
        var rd = seg(u, PDF.CA - .9, PDF.CA - .35);
        if (rd > 0) {
          var meet = seg(u, PDF.CA - .4, PDF.CA - .04), sp = ICON / 2 + .13 * (1 - meet);
          RL(PDF.C.x + sp, PDF.C.y - .02, PDF.C.z + .05, AL.target); RL(PDF.C.x - sp, PDF.C.y - .02, PDF.C.z + .05, AR.target);
          if (meet > 0) { edgeW(g, 1, _q0); AL.target.lerp(_q0, meet); edgeW(g, -1, _q0); AR.target.lerp(_q0, meet); }
          AL.w = AR.w = rd;
          if (ca >= -.05) { gripIcon(AL, g, 1); gripIcon(AR, g, -1); }
        }
        if (ca > .8) handsOn(g);
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
        c.where = "carry"; carry = c;
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
              c.where = "tower"; tower.push(c); carry = null;
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
          toppleTower();
          tween(.3, function (k) { bump = Math.sin(k * PI) * .04; }, lin);
          ptween(.4, function (k) { AR.w = 1 - k; cur.twist = lerp(twistFor(TOWER) * .6, 0, k); }, easeIO);
          plater(1.4, function () { if (my === playTok) playStep(); });
        });
      });
    }
    function toppleTower() {
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
    }
    function dropCarried() {
      var c = carry; carry = null;
      if (!c) return;
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
          later(.75, function () {                                  // 4. встаёт — через колено, как человек
            standUp(function () {
              st = "walk"; look.mode = "camera"; look.speed = 4;
              walk.dest.copy(NEAR); walk.on = true; walk.done = arrive;    // 5. подходит
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
      AL.w = AR.w = 0; look.tilt0 = 0; ovr.w = 0;
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
    // отладка: __robo.rec(true) — запись рывков суставов и долгих кадров, __robo.rec(false) — отчёт
    var REC = null, _rq = new Q(), TS = 1;
    function recFrame(rawDt, dt) {
      if (!REC) return;
      if (rawDt > 45) REC.hitch.push({ T: +T.toFixed(2), ms: Math.round(rawDt), st: st, held: held && held.id, ph: held && held.phase });
      JOINTS.forEach(function (j, i) {
        var q = j.o.quaternion, pq = REC.prev[i];
        if (pq) {
          _rq.set(q.x, q.y, q.z, q.w);
          var d = 2 * Math.acos(Math.min(1, Math.abs(_rq.dot(pq))));
          var v = d / Math.max(dt, .008);
          if (v > REC.lim) REC.jerk.push({ T: +T.toFixed(2), j: j.o.name + "#" + i, v: +v.toFixed(1), st: st, held: held && held.id, ph: held && held.phase, t: held ? +held.t.toFixed(2) : 0 });
          pq.set(q.x, q.y, q.z, q.w);
        } else REC.prev[i] = new Q(q.x, q.y, q.z, q.w);
      });
      if (held) {
        var p = held.g.position;
        if (REC.ip && REC.ih === held) {
          var dv = p.distanceTo(REC.ip) / K / Math.max(dt, .008);
          if (dv > REC.ilim) REC.jerk.push({ T: +T.toFixed(2), j: "icon", v: +dv.toFixed(1), held: held.id, ph: held.phase, t: +held.t.toFixed(2) });
        }
        REC.ip = p.clone(); REC.ih = held;
        (REC.path = REC.path || []).push([p.x / K, p.y / K, p.z / K, look.pitch, look.yaw]);
      }
      var mf = 1e9; [LL, LR].forEach(function (L) { [L.shin, L.foot].forEach(function (o) { mf = Math.min(mf, (wpos(o, _v).y - FLOOR) / K); }); });
      REC.minFoot = Math.min(REC.minFoot, mf);
    }
    window.__robo = {
      state: function () { return { st: st, held: held && held.id, phase: held && held.phase, busy: busy, want: want, t: held ? held.t : 0 }; }, wake: wake, reset: resetToPlay,
      rec: function (on, lim) {
        if (on) { REC = { prev: [], jerk: [], hitch: [], lim: lim || 14, ilim: 9, minFoot: 1e9 }; return true; }
        var r = REC; REC = null; if (!r) return null;
        var P = r.path || [], ji = 0, jh = 0;              // «дрожь»: среднее ускорение значка и головы за кадр
        for (var i = 1; i + 1 < P.length; i++) {
          ji += Math.hypot(P[i + 1][0] - 2 * P[i][0] + P[i - 1][0], P[i + 1][1] - 2 * P[i][1] + P[i - 1][1], P[i + 1][2] - 2 * P[i][2] + P[i - 1][2]);
          jh += Math.abs(P[i + 1][3] - 2 * P[i][3] + P[i - 1][3]) + Math.abs(P[i + 1][4] - 2 * P[i][4] + P[i - 1][4]);
        }
        var nn = Math.max(1, P.length - 2);
        return { jerk: r.jerk.slice(0, 80), n: r.jerk.length, hitch: r.hitch, minFoot: r.minFoot, iconJit: +(ji / nn * 1e4).toFixed(2), headJit: +(jh / nn * 1e4).toFixed(2) };
      },
      speed: function (k) { TS = k > 0 ? k : 1; return TS; },
      scr: function (x, y, z) { var s = toScreen(RL(x, y, z, new V3())); return [Math.round(s.x), Math.round(s.y), Math.round(W), Math.round(H)]; },
      metrics: function () {
        var H0 = wpos(LL.hip, new V3()), S0 = wpos(LL.shin, new V3()), F0 = wpos(LL.foot, new V3());
        var hm = AL.hand, hb = null;
        if (hm) { hm.geometry.computeBoundingBox(); var bb = hm.geometry.boundingBox.clone().applyMatrix4(hm.matrixWorld), sz = bb.getSize(new V3()).divideScalar(K);
          var piv = wpos(hm, new V3()), cen = boxCenter(hm), el = wpos(AL.fore, new V3());
          hb = { size: [sz.x, sz.y, sz.z].map(function (v) { return +v.toFixed(3); }), pivotToCenter: +(piv.distanceTo(cen) / K).toFixed(3), elbowToPivot: +(el.distanceTo(piv) / K).toFixed(3), elbowToCenter: +(el.distanceTo(cen) / K).toFixed(3), L1: +(AL.L1 / K).toFixed(3), L2: +(AL.L2 / K).toFixed(3),
            local: [hm.position.x, hm.position.y, hm.position.z].map(function (v) { return +(v).toFixed(2); }), kids: hm.children.length, name: hm.name, foreKids: AL.fore.children.map(function (c) { return c.name + (c.isMesh ? "*" : ""); }) }; }
        return { hand: hb, K: K, thigh: H0.distanceTo(S0) / K, shin: S0.distanceTo(F0) / K, hipH: (H0.y - FLOOR) / K, kneeH: (S0.y - FLOOR) / K, ankleH: (F0.y - FLOOR) / K };
      }
    };

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

    /* ---------- прогрев: первые кадры рисуем все значки и реквизит крошечными, чтобы
       шейдеры и текстуры подготовились заранее, а не в момент, когда робот берёт значок ---------- */
    var warm = 3, OVK = ["slx", "srx", "slz", "srz", "el", "er", "tilt"];
    function prewarm(n) {
      var on = n > 0, list = Object.keys(ICON_G).map(function (k) { return ICON_G[k]; }).concat(PANELS.map(function (P) { return P.g; }), [AL.gh.g, AR.gh.g]);
      list.forEach(function (g) {
        if (held && held.g === g) return;
        if (on) { RL(0, 1.2, .3, g.position); g.scale.setScalar(.001); g.visible = true; }
        else if (!PANELS.some(function (P) { return P.g === g && P.k > .01; })) g.visible = false;
      });
      if (on) PANELS.forEach(panelPaint);
    }

    /* ---------- главный цикл ---------- */
    var last = 0, _tmp = new V3(), firstFrame = true, frameN = 0;
    function loop(now) {
      if (dead || !visible || document.hidden) { last = 0; return; }
      requestAnimationFrame(loop);
      var rawDt = last ? now - last : 16;
      var dt = (last ? Math.min((now - last) / 1000, .05) : .016) * TS; last = now;
      T += dt;
      AL.req = AR.req = null; AL.fast = AR.fast = 0; AL.pkT = AR.pkT = 0;
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

      ovr.cmd = 0;
      if (held && held.phase === "act" && ACTS[held.id]) { held.t += dt; ACTS[held.id](held, held.t); }
      AL.pk = damp(AL.pk, AL.pkT, 4, dt); AR.pk = damp(AR.pk, AR.pkT, 4, dt);
      ovr.w = damp(ovr.w, ovr.cmd, 5, dt);
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
      if (ovr.w > .001) OVK.forEach(function (k) { if (ovr[k] !== undefined) p[k] = lerp(p[k], ovr[k], ovr.w); });

      // сначала камера (для взгляда и значков), потом суставы
      setSplineCam();
      syncCams();
      bot.updateMatrixWorld(true);
      updateLook(dt);
      applyRig(p, dt);
      recFrame(rawDt, dt);
      app.render();
      syncCams();

      // тени, «коробка» наведения, кубики
      var sitK = clamp((1.04 - p.py) / .74, 0, 1);
      shadow.position.set(root.pos.x, FLOOR + 1, root.pos.z);
      shadow.position.addScaledVector(_tmp.set(Math.sin(root.yaw), 0, Math.cos(root.yaw)), (sitK * .25 + p.fz) * K);
      shadow.scale.set(lerp(1.1, 1.4, sitK) * K, lerp(.8, 1.2, sitK) * K, 1);
      proxy.scale.set(lerp(.9, 1.6, sitK) * K, lerp(2.1, 1.5, sitK) * K, lerp(.7, 1.6, sitK) * K);
      RL(0, lerp(1.05, .62, sitK), lerp(0, .25, sitK) + p.fz, proxy.position); proxy.rotation.y = root.yaw;
      playTop.position.copy(play.position); playTop.rotation.copy(play.rotation);
      syncCubeShadows();

      if (ptr.on && !coarse) {
        var ov = overRobot();
        card.style.cursor = ov && (st === "play" || (st === "stand" && !held)) ? "pointer" : "";
        if (ov && st === "play") wake();
      }
      updOcc(); nudgeHeld(); updGrip(AL, dt); updGrip(AR, dt);
      updPanels(dt);
      if (warm) prewarm(--warm);
      gR.render(gScene, gCam);
      tR.clear(); tR.render(cScene, tCam);         // кубики и мелочи над роботом — с проверкой глубины
      tR.clearDepth(); tR.render(tScene, tCam);     // значки, реквизит, кисти — всегда поверх
      placeSay();
      updFx(dt);
      // показываем сцену, когда Spline дорисовал робота целиком (первые кадры он ещё компилирует шейдеры)
      if (firstFrame && ++frameN >= 14) {
        firstFrame = false;
        sceneBox.classList.remove("is-loading"); sceneBox.classList.add("is-ready"); card.classList.add("robo-ready");
      }
    }
    later(.8, playStep);
  }
})();
