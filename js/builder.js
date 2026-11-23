/* =====================================================================
   КОНСТРУКТОР ПРОЕКТА: модули перетаскиваются на поле с фоном 0101…,
   сами соединяются линиями (или вручную — от точки к модулю),
   цена и срок считаются на лету. Данные — SITE.builder в config.js.
   ===================================================================== */
(function () {
  "use strict";
  var root = document.getElementById("bld");
  var S = window.SITE || {}, B = S.builder;
  if (!root || !B) return;
  function $(id) { return document.getElementById(id); }
  var pal = $("bldPal"), field = $("bldField"), nodesBox = $("bldNodes"), wires = $("bldWires"), bin = $("bldBin"), empty = $("bldEmpty");
  var totalEl = $("bldTotal"), daysEl = $("bldDays"), listEl = $("bldList"), urgent = $("bldUrgent"), send = $("bldSend"), lcd = $("pcalcLcd");
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  function fmt(n) { return Math.round(n).toLocaleString("ru-RU") + " ₽"; }
  function ico(id, s) { return window.appIconSVG ? window.appIconSVG(id, s) : ""; }
  var MOD = {};
  B.groups.forEach(function (g) { g.items.forEach(function (it) { MOD[it.id] = it; }); });

  /* ---------- палитра ---------- */
  B.groups.forEach(function (g) {
    var box = document.createElement("div"); box.className = "bld__group";
    box.innerHTML = "<span class=\"bld__gt\">" + esc(g.title) + "</span>";
    g.items.forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "bld__mod"; b.setAttribute("data-id", it.id);
      b.innerHTML = ico(it.icon, 34) + "<span><b>" + esc(it.name) + "</b><small>от " + fmt(it.price) + "</small></span>";
      box.appendChild(b);
    });
    pal.appendChild(box);
  });
  // пресеты
  var tools = $("bldPresets");
  (B.presets || []).forEach(function (p) {
    var b = document.createElement("button"); b.type = "button"; b.className = "bld__preset"; b.textContent = p.name;
    b.addEventListener("click", function () { clearAll(); p.nodes.forEach(function (id) { addNode(id, null, null, "chain"); }); });
    tools.appendChild(b);
  });
  var clr = document.createElement("button"); clr.type = "button"; clr.className = "bld__preset bld__preset--clear"; clr.textContent = "Очистить";
  clr.addEventListener("click", clearAll); tools.appendChild(clr);

  /* ---------- модель ---------- */
  var nodes = [], links = [], uid = 0, NW = 176, NH = 56;
  function nodeW() { NW = window.innerWidth <= 430 ? 150 : 176; }
  nodeW();
  function fsize() { return { w: field.clientWidth, h: field.clientHeight }; }
  function nodeById(k) { for (var i = 0; i < nodes.length; i++) if (nodes[i].k === k) return nodes[i]; return null; }
  function center(n) { return { x: n.x + NW / 2, y: n.y + NH / 2 }; }
  function freeSpot() {
    var f = fsize(), pad = 16, top = 16, bottom = f.h - NH - 64;
    var cols = Math.max(1, Math.floor((f.w - pad) / (NW + 34))), rows = Math.max(1, Math.floor((bottom - top) / (NH + 34)) + 1);
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var x = pad + c * (NW + 34) + (r % 2 ? 22 : 0), y = top + r * (NH + 34);
      if (x + NW > f.w - 8) continue;
      var ok = nodes.every(function (n) { return Math.abs(n.x - x) > NW * .8 || Math.abs(n.y - y) > NH * .9; });
      if (ok) return { x: x, y: y };
    }
    return { x: 16 + Math.random() * Math.max(1, f.w - NW - 32), y: 16 + Math.random() * Math.max(1, bottom - 16) };
  }
  function clampPos(n) {
    var f = fsize();
    n.x = Math.max(6, Math.min(f.w - NW - 6, n.x)); n.y = Math.max(6, Math.min(f.h - NH - 52, n.y));
  }
  function addNode(id, x, y, mode) {
    var m = MOD[id]; if (!m) return;
    var p = x == null ? freeSpot() : { x: x - NW / 2, y: y - NH / 2 };
    var n = { k: ++uid, id: id, x: p.x, y: p.y, el: null };
    clampPos(n);
    var el = document.createElement("div");
    el.className = "bld__node is-new"; el.setAttribute("data-k", n.k);
    el.innerHTML = ico(m.icon, 32) + "<span><b>" + esc(m.name) + "</b><small>от " + fmt(m.price) + "</small></span>" +
      '<button type="button" class="bld__x" aria-label="Убрать модуль">×</button><i class="bld__port" title="Потяни к другому модулю, чтобы связать"></i>';
    n.el = el; nodesBox.appendChild(el); place(n);
    setTimeout(function () { el.classList.remove("is-new"); }, 500);
    // автосвязь: в цепочку (по клику) или с ближайшим (при перетаскивании)
    var prev = null;
    if (nodes.length) {
      if (mode === "chain") prev = nodes[nodes.length - 1];
      else {
        var c = center(n), best = 1e9;
        nodes.forEach(function (o) { var oc = center(o), d = Math.hypot(oc.x - c.x, oc.y - c.y); if (d < best) { best = d; prev = o; } });
      }
    }
    nodes.push(n);
    if (prev) link(prev.k, n.k);
    update();
  }
  function removeNode(k) {
    var n = nodeById(k); if (!n) return;
    n.el.classList.add("is-gone");
    links = links.filter(function (l) { return l.a !== k && l.b !== k; });
    nodes = nodes.filter(function (o) { return o.k !== k; });
    setTimeout(function () { n.el.remove(); }, 220);
    update();
  }
  function link(a, b) {
    if (a === b) return;
    if (links.some(function (l) { return (l.a === a && l.b === b) || (l.a === b && l.b === a); })) return;
    links.push({ a: a, b: b, t: performance.now() });
  }
  function clearAll() { nodes.slice().forEach(function (n) { n.el.remove(); }); nodes = []; links = []; update(); }
  function place(n) { n.el.style.transform = "translate(" + Math.round(n.x) + "px," + Math.round(n.y) + "px)"; }

  /* ---------- провода ---------- */
  var NS = "http://www.w3.org/2000/svg", tempPath = null;
  function pathD(p, q) {
    var dx = Math.max(40, Math.abs(q.x - p.x) * .5);
    return "M" + p.x + "," + p.y + " C" + (p.x + dx) + "," + p.y + " " + (q.x - dx) + "," + q.y + " " + q.x + "," + q.y;
  }
  function ends(A, Bn) {
    var a = center(A), b = center(Bn);
    if (Math.abs(b.x - a.x) < NW * .6) {      // друг под другом — соединяем верх/низ
      var up = a.y < b.y;
      return [{ x: a.x, y: up ? A.y + NH : A.y }, { x: b.x, y: up ? Bn.y : Bn.y + NH }, true];
    }
    var lr = a.x < b.x;
    return [{ x: lr ? A.x + NW : A.x, y: a.y }, { x: lr ? Bn.x : Bn.x + NW, y: b.y }, false];
  }
  function vpath(p, q) { var dy = Math.max(30, Math.abs(q.y - p.y) * .5) * (q.y > p.y ? 1 : -1); return "M" + p.x + "," + p.y + " C" + p.x + "," + (p.y + dy) + " " + q.x + "," + (q.y - dy) + " " + q.x + "," + q.y; }
  function drawWires() {
    var f = fsize();
    wires.setAttribute("viewBox", "0 0 " + f.w + " " + f.h);
    var html = '<defs><linearGradient id="bldG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f0cd73"/><stop offset="1" stop-color="#c39233"/></linearGradient></defs>';
    links.forEach(function (l, i) {
      var A = nodeById(l.a), Bn = nodeById(l.b); if (!A || !Bn) return;
      var e = ends(A, Bn), d = e[2] ? vpath(e[0], e[1]) : pathD(e[0], e[1]);
      html += '<g class="bld__wire" data-i="' + i + '"><path class="w-hit" d="' + d + '"/><path class="w-glow" d="' + d + '"/><path class="w-line" d="' + d + '"/><path class="w-flow" d="' + d + '"/>' +
        '<circle class="w-dot" r="4.5" cx="' + e[0].x + '" cy="' + e[0].y + '"/><circle class="w-dot" r="4.5" cx="' + e[1].x + '" cy="' + e[1].y + '"/></g>';
    });
    html += '<path class="w-temp" id="bldTemp" d=""/>';
    wires.innerHTML = html;
    tempPath = document.getElementById("bldTemp");
  }
  wires.addEventListener("click", function (e) {
    var g = e.target.closest(".bld__wire"); if (!g) return;
    links.splice(+g.getAttribute("data-i"), 1); update();
  });

  /* ---------- расчёт ---------- */
  var shown = 0, target = 0, anim = 0;
  function totals() {
    var sum = 0, days = 0;
    nodes.forEach(function (n) { sum += MOD[n.id].price; days += MOD[n.id].days; });
    sum += links.length * (B.link || 0);
    days = nodes.length ? Math.max(1, Math.ceil(days * .75)) : 0;
    if (urgent.checked && nodes.length) { sum = Math.round(sum * (B.urgent || 1.3) / 500) * 500; days = Math.max(1, Math.ceil(days * .6)); }
    return { sum: sum, days: days };
  }
  function describe() {
    var adj = {}, seen = {}, parts = [];
    nodes.forEach(function (n) { adj[n.k] = []; });
    links.forEach(function (l) { if (adj[l.a] && adj[l.b]) { adj[l.a].push(l.b); adj[l.b].push(l.a); } });
    nodes.slice().sort(function (a, b) { return a.x - b.x; }).forEach(function (s) {
      if (seen[s.k]) return;
      var order = [], q = [s.k]; seen[s.k] = 1;
      while (q.length) { var k = q.shift(); order.push(MOD[nodeById(k).id].name); adj[k].forEach(function (j) { if (!seen[j]) { seen[j] = 1; q.push(j); } }); }
      parts.push(order.join(" → "));
    });
    return parts.join(" + ");
  }
  function days(n) { var a = n % 10, b = n % 100; return n + " " + (a === 1 && b !== 11 ? "день" : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? "дня" : "дней"); }
  function update() {
    drawWires();
    var t = totals();
    empty.classList.toggle("is-hidden", nodes.length > 0);
    root.classList.toggle("has-nodes", nodes.length > 0);
    daysEl.textContent = nodes.length ? "срок ≈ " + days(t.days) + (urgent.checked ? " · срочно" : "") : "срок — добавь модули";
    var rows = nodes.map(function (n) { var m = MOD[n.id]; return "<li>" + ico(m.icon, 20) + "<span>" + esc(m.name) + "</span><b>" + fmt(m.price) + "</b></li>"; });
    if (links.length) rows.push('<li class="bld__li-link"><i>⟷</i><span>Связки × ' + links.length + "</span><b>" + fmt(links.length * B.link) + "</b></li>");
    listEl.innerHTML = rows.join("") || '<li class="bld__li-empty">Пока пусто</li>';
    send.disabled = !nodes.length;
    target = t.sum;
    if (reduce) { shown = target; paint(); return; }
    var from = shown, t0 = performance.now();
    cancelAnimationFrame(anim);
    (function step(now) {
      var k = Math.min(1, (now - t0) / 550), e = 1 - Math.pow(1 - k, 3);
      shown = from + (target - from) * e; paint();
      if (k < 1) anim = requestAnimationFrame(step);
    })(t0);
  }
  function paint() { totalEl.textContent = fmt(shown); if (lcd) lcd.textContent = String(Math.round(shown)); }
  urgent.addEventListener("change", update);
  send.addEventListener("click", function () {
    var UI = window.SITE_UI; if (!UI || !nodes.length) return;
    var t = totals();
    UI.setPlan("Схема: " + describe() + " · ≈ " + fmt(t.sum) + " · " + days(t.days) + (urgent.checked ? " · срочно" : ""));
    UI.toast("Схема добавлена в заявку 👇", "ok");
    UI.goContact();
  });

  /* ---------- перетаскивание ---------- */
  function inField(x, y) { var r = field.getBoundingClientRect(); return x > r.left && x < r.right && y > r.top && y < r.bottom; }
  function fieldPt(x, y) { var r = field.getBoundingClientRect(); return { x: x - r.left, y: y - r.top }; }
  // из палитры: мышь — тянуть, палец — нажать
  pal.addEventListener("pointerdown", function (e) {
    var b = e.target.closest(".bld__mod"); if (!b || e.button) return;
    var id = b.getAttribute("data-id");
    if (e.pointerType === "touch" || coarse) return;     // на телефоне — простое нажатие (click ниже)
    e.preventDefault();
    var sx = e.clientX, sy = e.clientY, ghost = null;
    function mv(ev) {
      if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
        ghost = b.cloneNode(true); ghost.className = "bld__mod bld__ghost"; document.body.appendChild(ghost);
      }
      if (ghost) {
        ghost.style.transform = "translate(" + (ev.clientX - 90) + "px," + (ev.clientY - 26) + "px) rotate(-3deg)";
        field.classList.toggle("is-over", inField(ev.clientX, ev.clientY));
      }
    }
    function up(ev) {
      window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up);
      field.classList.remove("is-over");
      if (ghost) {
        ghost.remove();
        if (inField(ev.clientX, ev.clientY)) { var p = fieldPt(ev.clientX, ev.clientY); addNode(id, p.x, p.y, "near"); }
      } else addNode(id, null, null, "chain");
    }
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
  });
  pal.addEventListener("click", function (e) {
    var b = e.target.closest(".bld__mod"); if (!b) return;
    if (coarse || e.detail === 0) addNode(b.getAttribute("data-id"), null, null, "chain");
  });
  // модули на поле: двигать, связывать, удалять
  nodesBox.addEventListener("pointerdown", function (e) {
    var el = e.target.closest(".bld__node"); if (!el || e.button) return;
    var n = nodeById(+el.getAttribute("data-k")); if (!n) return;
    if (e.target.closest(".bld__x")) return;
    e.preventDefault();
    var port = e.target.closest(".bld__port");
    var sx = e.clientX, sy = e.clientY, x0 = n.x, y0 = n.y;
    el.classList.add(port ? "is-linking" : "is-drag");
    function mv(ev) {
      if (port) {
        var p = fieldPt(ev.clientX, ev.clientY), a = center(n);
        a.x = n.x + NW; tempPath.setAttribute("d", pathD(a, p));
        var over = document.elementFromPoint(ev.clientX, ev.clientY), on = over && over.closest(".bld__node");
        nodes.forEach(function (o) { o.el.classList.toggle("is-target", !!on && o.el === on && o !== n); });
      } else {
        n.x = x0 + ev.clientX - sx; n.y = y0 + ev.clientY - sy; clampPos(n); place(n); drawWires();
      }
    }
    function up(ev) {
      window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      el.classList.remove("is-drag", "is-linking");
      nodes.forEach(function (o) { o.el.classList.remove("is-target"); });
      if (port) {
        var over = document.elementFromPoint(ev.clientX, ev.clientY), on = over && over.closest(".bld__node");
        if (on) link(n.k, +on.getAttribute("data-k"));
      }
      update();
    }
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  });
  nodesBox.addEventListener("click", function (e) {
    var x = e.target.closest(".bld__x"); if (!x) return;
    removeNode(+x.closest(".bld__node").getAttribute("data-k"));
  });
  window.addEventListener("resize", function () { nodeW(); nodes.forEach(function (n) { clampPos(n); place(n); }); drawWires(); sizeBin(); });

  /* ---------- фон 0101… ---------- */
  var ctx = bin.getContext("2d"), cell = 17, cols = 0, rows = 0, digits = [], heads = [], dpr = 1, binOn = false, lastB = 0;
  function sizeBin() {
    var f = fsize(); dpr = Math.min(window.devicePixelRatio || 1, 2);
    bin.width = f.w * dpr; bin.height = f.h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(f.w / cell); rows = Math.ceil(f.h / cell) + 1;
    digits = []; heads = [];
    for (var i = 0; i < cols * rows; i++) digits.push(Math.random() < .5 ? "0" : "1");
    for (var c = 0; c < cols; c++) heads.push({ y: Math.random() * rows, v: .05 + Math.random() * .12, on: Math.random() < .55 });
  }
  function drawBin(now) {
    if (!binOn) return;
    requestAnimationFrame(drawBin);
    if (now - lastB < 50) return; lastB = now;
    var f = fsize();
    ctx.clearRect(0, 0, f.w, f.h);
    ctx.font = "600 12px 'JetBrains Mono', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (var i = 0; i < 6; i++) { var r = Math.floor(Math.random() * digits.length); digits[r] = digits[r] === "0" ? "1" : "0"; }
    var cs = nodes.map(center);
    for (var c = 0; c < cols; c++) {
      var h = heads[c]; h.y += h.v; if (h.y > rows + 8) { h.y = -Math.random() * 10; h.on = Math.random() < .4; }
      var x = c * cell + cell / 2;
      for (var r2 = 0; r2 < rows; r2++) {
        var y = r2 * cell + cell / 2, a = .13;
        if (h.on) { var d = h.y - r2; if (d >= 0 && d < 7) a += (1 - d / 7) * .5; }
        for (var k = 0; k < cs.length; k++) { var dx = cs[k].x - x, dy = cs[k].y - y, dd = dx * dx + dy * dy; if (dd < 14000) a += (1 - dd / 14000) * .22; }
        ctx.fillStyle = "rgba(212,168,75," + Math.min(.85, a).toFixed(3) + ")";
        ctx.fillText(digits[c * rows + r2], x, y);
      }
    }
  }
  sizeBin();
  new IntersectionObserver(function (es) {
    var v = es[0].isIntersecting && !reduce;
    if (v && !binOn) { binOn = true; requestAnimationFrame(drawBin); }
    else if (!v) binOn = false;
    if (reduce && es[0].isIntersecting) { binOn = true; drawBin(1e9); binOn = false; }
  }).observe(field);

  update();
  // стартовая подсказка: сразу показать связку, чтобы было понятно, как это работает
  setTimeout(function () { if (!nodes.length) { addNode("python", null, null, "chain"); addNode("excel", null, null, "chain"); } }, 50);
})();
