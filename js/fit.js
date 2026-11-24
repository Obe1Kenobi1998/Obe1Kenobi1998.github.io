/* =====================================================================
   ШИРОКИЕ ЭКРАНЫ (2К, 4К, ультраширокие 21:9).
   На мониторах больше обычного вся страница пропорционально увеличивается (CSS zoom),
   а на ультрашироких ещё и раздвигается контейнер — сайт заполняет экран, а не стоит
   узкой колонкой посередине. На обычных экранах (до ~1800×900) ничего не меняется.
   Коэффициенты меряются в самом браузере, а не угадываются:
   • --vz  — во сколько раз масштаб растягивает единицы vh (высоты «во весь экран» делятся на него);
   • uiZ() — сколько экранных пикселей в одном CSS-пикселе: скрипты, которые ставят элементы
     по координатам мыши (подсветка, свечение курсора, конструктор, надписи робота), делят на него.
   ===================================================================== */
(function () {
  "use strict";
  var root = document.documentElement, Z = 1, last = "";
  var probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = "position:absolute;left:0;top:0;width:100px;height:100vh;visibility:hidden;pointer-events:none;z-index:-1";

  function fit() {
    var w = window.innerWidth, h = window.innerHeight;
    var z = Math.min(w / 1460, h / 860);                    // во сколько раз экран больше «эталонного» 1460×860
    z = z < 1.15 ? 1 : Math.min(z, 2.4);
    var key = w + "x" + h + ":" + z.toFixed(3);
    if (key === last) return; last = key;
    root.style.zoom = z > 1 ? z.toFixed(3) : "";
    root.appendChild(probe);
    var r = probe.getBoundingClientRect();
    Z = probe.offsetWidth ? r.width / probe.offsetWidth : 1;
    var vz = h > 0 && r.height > 0 ? r.height / h : 1;
    root.removeChild(probe);
    root.style.setProperty("--vz", vz.toFixed(4));
    root.style.setProperty("--uiz", Z.toFixed(4));
    // ультраширокие: после масштаба по высоте по бокам ещё остаётся место — раздвигаем контейнер
    var avail = w / Z;                                      // ширина окна в CSS-пикселях страницы
    if (z > 1 && avail > 1560) root.style.setProperty("--max", Math.round(Math.min(avail * .86, 1760)) + "px");
    else root.style.removeProperty("--max");
    root.classList.toggle("is-wide", z > 1);
    root.classList.toggle("is-ultrawide", z > 1 && avail > 1900);
    if (window.dispatchEvent && typeof Event === "function") window.dispatchEvent(new Event("uizoom"));
  }
  window.uiZ = function () { return Z; };
  fit();
  var t = 0;
  window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(fit, 100); });
})();
