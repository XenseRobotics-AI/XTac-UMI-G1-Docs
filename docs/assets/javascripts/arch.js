/* =====================================================================
   概述 1.2 的交互式数采系统架构图
   页面里放 <div class="tc-arch"><script type="application/json">…</script></div>,
   JSON 只提供文字(中英文各一份),几何、档位和交互都在这里。
   ===================================================================== */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var W = 1000, H = 520;

  /* 列中心与节点尺寸 */
  var COL = { dev: 110, read: 355, core: 640, out: 885 };
  var NW = { dev: 180, read: 175, core: 170, out: 190 };

  /* kind 决定配色;tier 是开始出现的档位 */
  var NODES = [
    { id: "grip",    col: "dev",  y: 104, h: 52,  kind: "dev",  tier: 1 },
    { id: "tact",    col: "dev",  y: 176, h: 52,  kind: "dev",  tier: 1 },
    { id: "wrist",   col: "dev",  y: 248, h: 52,  kind: "dev",  tier: 1 },
    { id: "tracker", col: "dev",  y: 360, h: 52,  kind: "dev",  tier: 2 },
    { id: "headset", col: "dev",  y: 460, h: 52,  kind: "dev",  tier: 2 },
    { id: "sdk",     col: "read", y: 104, h: 52,  kind: "read", tier: 1 },
    { id: "xsdk",    col: "read", y: 176, h: 52,  kind: "read", tier: 1 },
    { id: "cam",     col: "read", y: 248, h: 52,  kind: "read", tier: 1 },
    { id: "pcs",     col: "read", y: 460, h: 52,  kind: "read", tier: 2 },
    { id: "obs",     col: "core", y: 245, h: 170, kind: "core", tier: 1 },
    { id: "pair",    col: "core", y: 425, h: 60,  kind: "core", tier: 1 },
    { id: "rerun",   col: "out",  y: 120, h: 60,  kind: "out",  tier: 1 },
    { id: "ds",      col: "out",  y: 425, h: 84,  kind: "out",  tier: 1 }
  ];

  /* 端点:r = 右边、l = 左边、b = 下边、t = 上边,dy/dx 为相对节点中心的偏移 */
  var EDGES = [
    { id: "e-grip",    from: "grip",    to: "sdk",    tier: 1, a: "r", b: "l" },
    { id: "e-tact",    from: "tact",    to: "xsdk",   tier: 1, a: "r", b: "l" },
    { id: "e-wrist",   from: "wrist",   to: "cam",    tier: 1, a: "r", b: "l" },
    { id: "e-track",   from: "tracker", to: "headset", tier: 2, a: "b", b: "t" },
    { id: "e-head",    from: "headset", to: "pcs",    tier: 2, a: "r", b: "l" },
    { id: "e-sdk",     from: "sdk",     to: "obs",    tier: 1, a: "r", b: "l", bdy: -60 },
    { id: "e-xsdk",    from: "xsdk",    to: "obs",    tier: 1, a: "r", b: "l", bdy: -30 },
    { id: "e-cam",     from: "cam",     to: "obs",    tier: 1, a: "r", b: "l", bdy: 0 },
    { id: "e-pose",    from: "pcs",     to: "obs",    tier: 2, a: "r", b: "l", ady: -10, bdy: 30 },
    { id: "e-stereo",  from: "pcs",     to: "obs",    tier: 3, a: "r", b: "l", ady: 10, bdy: 60, video: true },
    { id: "e-pair",    from: "obs",     to: "pair",   tier: 1, a: "b", b: "t" },
    { id: "e-ds",      from: "pair",    to: "ds",     tier: 1, a: "r", b: "l" },
    { id: "e-rerun",   from: "obs",     to: "rerun",  tier: 1, a: "r", b: "l", ady: -60 }
  ];

  /* 有标签的连线:标签放在直段上方 */
  var LABEL_POS = {
    "e-grip":   { x: 234, dy: -7, anchor: "middle" },
    "e-tact":   { x: 234, dy: -7, anchor: "middle" },
    "e-wrist":  { x: 234, dy: -7, anchor: "middle" },
    "e-track":  { x: 122, y: 414, anchor: "start" },
    "e-head":   { x: 234, dy: -7, anchor: "middle" }
  };

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function box(n) {
    var w = NW[n.col], cx = COL[n.col];
    return { x: cx - w / 2, y: n.y - n.h / 2, w: w, h: n.h, cx: cx, cy: n.y };
  }

  function port(b, side, d) {
    d = d || 0;
    if (side === "r") return [b.x + b.w, b.cy + d];
    if (side === "l") return [b.x, b.cy + d];
    if (side === "b") return [b.cx + d, b.y + b.h];
    return [b.cx + d, b.y];
  }

  function pathFor(e, boxes) {
    var p = port(boxes[e.from], e.a, e.ady), q = port(boxes[e.to], e.b, e.bdy);
    if (e.a === "b") return "M" + p + " L" + q;
    var dx = Math.max(40, (q[0] - p[0]) * 0.5);
    return "M" + p + " C" + [p[0] + dx, p[1]] + " " + [q[0] - dx, q[1]] + " " + q;
  }

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function render(root) {
    var spec;
    try {
      spec = JSON.parse(root.querySelector("script[type='application/json']").textContent);
    } catch (err) {
      return;
    }
    var uid = "tca" + Math.random().toString(36).slice(2, 7);
    var boxes = {}, nodeEls = {}, edgeEls = {};
    NODES.forEach(function (n) { boxes[n.id] = box(n); });

    /* 档位切换 */
    var bar = document.createElement("div");
    bar.className = "tc-arch__tiers";
    bar.setAttribute("role", "group");
    var tierBtns = spec.tiers.map(function (label, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", function () { setTier(i + 1); });
      bar.appendChild(b);
      return b;
    });

    var scroller = document.createElement("div");
    scroller.className = "tc-arch__scroll";
    root.appendChild(bar);
    root.appendChild(scroller);
    var svg = el("svg", {
      viewBox: "0 0 " + W + " " + H, role: "img",
      "aria-label": spec.title, class: "tc-arch__svg"
    }, scroller);

    var defs = el("defs", {}, svg);
    var mk = el("marker", {
      id: uid + "-arrow", viewBox: "0 0 10 10", refX: "9", refY: "5",
      markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse"
    }, defs);
    el("path", { d: "M0,0 L10,5 L0,10 z", class: "tc-arch__arrow" }, mk);

    /* 列标题与夹爪分组框 */
    ["dev", "read", "core", "out"].forEach(function (c) {
      var t = el("text", { x: COL[c], y: 24, class: "tc-arch__col" }, svg);
      t.textContent = spec.cols[c];
    });
    el("rect", { x: 14, y: 52, width: 192, height: 232, rx: 12, class: "tc-arch__group" }, svg);
    var gl = el("text", { x: 26, y: 70, class: "tc-arch__grouplabel" }, svg);
    gl.textContent = spec.group;

    /* 图例:实线是数据与位姿,粉色虚线是 ③ 档的头显双目画面 */
    var lg = el("g", { class: "tc-arch__legend" }, svg);
    el("path", { d: "M560,500 h34", class: "tc-arch__line" }, lg);
    var l1 = el("text", { x: 602, y: 504, class: "tc-arch__elabel" }, lg);
    l1.textContent = spec.legend[0];
    var lv = el("g", { class: "tc-arch__edge is-video" }, lg);
    el("path", { d: "M760,500 h34", class: "tc-arch__line" }, lv);
    var l2 = el("text", { x: 802, y: 504, class: "tc-arch__elabel" }, lg);
    l2.textContent = spec.legend[1];

    var edgeLayer = el("g", { class: "tc-arch__edges" }, svg);
    var dotLayer = el("g", { class: "tc-arch__dots" }, svg);
    var nodeLayer = el("g", { class: "tc-arch__nodes" }, svg);

    EDGES.forEach(function (e) {
      var g = el("g", { class: "tc-arch__edge" + (e.video ? " is-video" : "") }, edgeLayer);
      var d = pathFor(e, boxes);
      el("path", { d: d, id: uid + "-" + e.id, class: "tc-arch__line",
        "marker-end": "url(#" + uid + "-arrow)" }, g);
      el("path", { d: d, class: "tc-arch__flow" }, g);
      var lp = LABEL_POS[e.id], txt = spec.edges[e.id];
      if (lp && txt) {
        var p = port(boxes[e.from], e.a, e.ady);
        var t = el("text", {
          x: lp.x, y: lp.y || p[1] + lp.dy, "text-anchor": lp.anchor,
          class: "tc-arch__elabel"
        }, g);
        t.textContent = txt;
      }
      edgeEls[e.id] = g;
    });

    NODES.forEach(function (n) {
      var b = boxes[n.id], txt = spec.nodes[n.id];
      var g = el("g", {
        class: "tc-arch__node is-" + n.kind, tabindex: "0", role: "button",
        "aria-label": txt.title
      }, nodeLayer);
      el("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 10, class: "tc-arch__box" }, g);
      el("rect", { x: b.x, y: b.y + 10, width: 4, height: b.h - 20, rx: 2, class: "tc-arch__tick" }, g);
      var subs = [].concat(txt.sub || []);
      var lines = 1 + subs.length, top = b.cy - (lines - 1) * 9.5;
      var t = el("text", { x: b.cx, y: top + 5, class: "tc-arch__title" }, g);
      t.textContent = txt.title;
      subs.forEach(function (s, i) {
        var st = el("text", { x: b.cx, y: top + 5 + (i + 1) * 19, class: "tc-arch__sub" }, g);
        st.textContent = s;
      });
      g.addEventListener("mouseenter", function () { focus(n.id); });
      g.addEventListener("mouseleave", function () { focus(pinned); });
      g.addEventListener("focus", function () { focus(n.id); });
      g.addEventListener("click", function (ev) {
        ev.stopPropagation();
        pinned = pinned === n.id ? null : n.id;
        focus(pinned || n.id);
      });
      nodeEls[n.id] = g;
    });

    svg.addEventListener("click", function () { pinned = null; focus(null); });

    var info = document.createElement("div");
    info.className = "tc-arch__info";
    info.setAttribute("aria-live", "polite");

    root.appendChild(info);
    root.classList.add("is-ready");

    var tier = 3, pinned = null;

    function active(item) { return item.tier <= tier; }

    /* 沿当前档位里可用的连线,找出与某节点相连的整条上下游 */
    function reach(id) {
      var nodes = {}, edges = {};
      nodes[id] = true;
      [["from", "to"], ["to", "from"]].forEach(function (dir) {
        var queue = [id], seen = {};
        seen[id] = true;
        while (queue.length) {
          var cur = queue.shift();
          EDGES.forEach(function (e) {
            if (!active(e) || e[dir[0]] !== cur) return;
            edges[e.id] = true;
            var nxt = e[dir[1]];
            nodes[nxt] = true;
            if (!seen[nxt]) { seen[nxt] = true; queue.push(nxt); }
          });
        }
      });
      return { nodes: nodes, edges: edges };
    }

    function clearDots() {
      while (dotLayer.firstChild) dotLayer.removeChild(dotLayer.firstChild);
    }

    function spawnDots(edgeIds) {
      clearDots();
      if (reduceMotion) return;
      edgeIds.forEach(function (id) {
        var path = svg.getElementById ? svg.getElementById(uid + "-" + id)
          : document.getElementById(uid + "-" + id);
        var len = path.getTotalLength();
        var dur = Math.max(0.8, len / 170);
        var video = EDGES.filter(function (e) { return e.id === id; })[0].video;
        for (var i = 0; i < 3; i++) {
          var c = el("circle", { r: video ? 4 : 3.2,
            class: "tc-arch__dot" + (video ? " is-video" : "") }, dotLayer);
          var am = el("animateMotion", {
            dur: dur.toFixed(2) + "s", repeatCount: "indefinite",
            begin: "indefinite", calcMode: "linear"
          }, c);
          el("mpath", { href: "#" + uid + "-" + id }, am);
          (function (am, delay) {
            setTimeout(function () {
              if (am.ownerSVGElement && am.beginElement) am.beginElement();
            }, delay);
          })(am, (dur * 1000 * i) / 3);
        }
      });
    }

    function focus(id) {
      var hit = id ? reach(id) : null;
      root.classList.toggle("has-focus", !!id);
      NODES.forEach(function (n) {
        var g = nodeEls[n.id];
        g.classList.toggle("is-off", !active(n));
        g.classList.toggle("is-hit", !!(hit && hit.nodes[n.id]));
        g.classList.toggle("is-self", n.id === id);
      });
      EDGES.forEach(function (e) {
        var g = edgeEls[e.id];
        g.classList.toggle("is-off", !active(e));
        g.classList.toggle("is-hit", !!(hit && hit.edges[e.id]));
      });
      spawnDots(hit ? Object.keys(hit.edges) : []);
      var txt = id ? spec.nodes[id] : null;
      info.innerHTML = "";
      if (txt) {
        var h = document.createElement("strong");
        h.textContent = txt.title;
        info.appendChild(h);
        info.appendChild(document.createTextNode(spec.sep + txt.desc));
        if (!active(NODES.filter(function (n) { return n.id === id; })[0])) {
          info.appendChild(document.createTextNode(spec.offNote));
        }
      } else {
        info.textContent = spec.hint;
        info.classList.add("is-hint");
        return;
      }
      info.classList.remove("is-hint");
    }

    function setTier(t) {
      tier = t;
      tierBtns.forEach(function (b, i) {
        b.classList.toggle("is-on", i + 1 === t);
        b.setAttribute("aria-pressed", i + 1 === t ? "true" : "false");
      });
      root.setAttribute("data-tier", t);
      focus(pinned);
    }

    setTier(3);
  }

  function init() {
    document.querySelectorAll(".tc-arch:not(.is-ready)").forEach(render);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
