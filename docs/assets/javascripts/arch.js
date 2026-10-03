/* =====================================================================
   PC 版总览的交互式数采系统架构图
   页面里放 <div class="tc-arch"><script type="application/json">…</script></div>,
   JSON 只提供文字(中英文各一份),几何、档位和交互都在这里。
   ===================================================================== */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var W = 1000, H = 520;

  /* 列中心与节点尺寸 */
  var PC_COL = { dev: 110, read: 355, core: 640, out: 885 };
  var PC_NW = { dev: 180, read: 175, core: 170, out: 190 };

  /* kind 决定配色;tier 是开始出现的档位 */
  var PC_NODES = [
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
  var PC_EDGES = [
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
  var PC_LABELS = {
    "e-grip":   { x: 234, dy: -7, anchor: "middle" },
    "e-tact":   { x: 234, dy: -7, anchor: "middle" },
    "e-wrist":  { x: 234, dy: -7, anchor: "middle" },
    "e-track":  { x: 122, y: 414, anchor: "start" },
    "e-head":   { x: 234, dy: -7, anchor: "middle" }
  };

  /* 背包版:设备列相同;背包内读取 → 录制 / 预览编码两路 → 控制台、MCAP、导出 */
  var BP_NODES = [
    { id: "grip",    col: "dev",  y: 104, h: 52,  kind: "dev",  tier: 1 },
    { id: "tact",    col: "dev",  y: 176, h: 52,  kind: "dev",  tier: 1 },
    { id: "wrist",   col: "dev",  y: 248, h: 52,  kind: "dev",  tier: 1 },
    { id: "tracker", col: "dev",  y: 360, h: 52,  kind: "dev",  tier: 1 },
    { id: "headset", col: "dev",  y: 460, h: 52,  kind: "dev",  tier: 1 },
    { id: "mcu",     col: "read", y: 104, h: 52,  kind: "read", tier: 1 },
    { id: "tcam",    col: "read", y: 176, h: 52,  kind: "read", tier: 1 },
    { id: "fcam",    col: "read", y: 248, h: 52,  kind: "read", tier: 1 },
    { id: "xvr",     col: "read", y: 460, h: 52,  kind: "read", tier: 1 },
    { id: "enc",     col: "core", y: 120, h: 60,  kind: "core", tier: 1 },
    { id: "rec",     col: "core", y: 345, h: 170, kind: "core", tier: 1 },
    { id: "console", col: "out",  y: 120, h: 60,  kind: "out",  tier: 1 },
    { id: "mcap",    col: "out",  y: 300, h: 60,  kind: "out",  tier: 1 },
    { id: "export",  col: "out",  y: 440, h: 76,  kind: "out",  tier: 1 }
  ];

  var BP_EDGES = [
    { id: "e-grip",     from: "grip",    to: "mcu",     tier: 1, a: "r", b: "l" },
    { id: "e-tact",     from: "tact",    to: "tcam",    tier: 1, a: "r", b: "l" },
    { id: "e-wrist",    from: "wrist",   to: "fcam",    tier: 1, a: "r", b: "l" },
    { id: "e-track",    from: "tracker", to: "headset", tier: 1, a: "b", b: "t" },
    { id: "e-head",     from: "headset", to: "xvr",     tier: 1, a: "r", b: "l" },
    { id: "e-mcu",      from: "mcu",     to: "rec",     tier: 1, a: "r", b: "l", bdy: -60 },
    { id: "e-tcam",     from: "tcam",    to: "rec",     tier: 1, a: "r", b: "l", bdy: -30 },
    { id: "e-fcam",     from: "fcam",    to: "rec",     tier: 1, a: "r", b: "l", bdy: 0 },
    { id: "e-pose",     from: "xvr",     to: "rec",     tier: 1, a: "r", b: "l", ady: -10, bdy: 30 },
    { id: "e-stereo",   from: "xvr",     to: "rec",     tier: 2, a: "r", b: "l", ady: 10, bdy: 60, video: true },
    { id: "e-tcam-enc", from: "tcam",    to: "enc",     tier: 1, a: "r", b: "l", ady: -12, bdy: -10 },
    { id: "e-fcam-enc", from: "fcam",    to: "enc",     tier: 1, a: "r", b: "l", ady: -12, bdy: 10 },
    { id: "e-enc",      from: "enc",     to: "console", tier: 1, a: "r", b: "l" },
    { id: "e-rec",      from: "rec",     to: "mcap",    tier: 1, a: "r", b: "l", ady: -45 },
    { id: "e-export",   from: "mcap",    to: "export",  tier: 1, a: "b", b: "t" }
  ];

  var BP_LABELS = {
    "e-grip":   { x: 234, dy: -7, anchor: "middle" },
    "e-tact":   { x: 234, dy: -7, anchor: "middle" },
    "e-wrist":  { x: 234, dy: -7, anchor: "middle" },
    "e-track":  { x: 122, y: 414, anchor: "start" },
    "e-head":   { x: 234, dy: -7, anchor: "middle" }
  };

  /* 每套布局:列、节点、连线、连线标签,以及设备分组框与图例的位置 */
  var LAYOUTS = {
    pc: { col: PC_COL, nw: PC_NW, nodes: PC_NODES, edges: PC_EDGES, labels: PC_LABELS,
          group: { x: 14, y: 52, w: 192, h: 232 }, legend: { y: 500 } },
    backpack: { col: PC_COL, nw: PC_NW, nodes: BP_NODES, edges: BP_EDGES, labels: BP_LABELS,
          group: { x: 14, y: 52, w: 192, h: 232 }, legend: { y: 505 } }
  };

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function box(n, L) {
    var w = L.nw[n.col], cx = L.col[n.col];
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

  /* 在点亮的连线上放流动的光点;paths 为 [{id, video}],id 对应 <path id="uid-id"> */
  function runDots(layer, uid, paths) {
    while (layer.firstChild) layer.removeChild(layer.firstChild);
    if (reduceMotion) return;
    var svg = layer.ownerSVGElement;
    paths.forEach(function (p) {
      var path = svg.querySelector("[id='" + uid + "-" + p.id + "']");
      if (!path) return;
      var dur = Math.max(0.8, path.getTotalLength() / 170);
      for (var i = 0; i < 3; i++) {
        var c = el("circle", { r: p.video ? 4 : 3.2,
          class: "tc-arch__dot" + (p.video ? " is-video" : "") }, layer);
        var am = el("animateMotion", {
          dur: dur.toFixed(2) + "s", repeatCount: "indefinite",
          begin: "indefinite", calcMode: "linear"
        }, c);
        el("mpath", { href: "#" + uid + "-" + p.id }, am);
        (function (am, delay) {
          setTimeout(function () {
            if (am.ownerSVGElement && am.beginElement) am.beginElement();
          }, delay);
        })(am, (dur * 1000 * i) / 3);
      }
    });
  }

  /* 档位按钮条;onPick(t) 在点击时调用,返回按钮数组 */
  function tierBar(root, labels, onPick) {
    var bar = document.createElement("div");
    bar.className = "tc-arch__tiers";
    bar.setAttribute("role", "group");
    root.appendChild(bar);
    return labels.map(function (label, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", function () { onPick(i + 1); });
      bar.appendChild(b);
      return b;
    });
  }

  function markTier(btns, t) {
    btns.forEach(function (b, i) {
      b.classList.toggle("is-on", i + 1 === t);
      b.setAttribute("aria-pressed", i + 1 === t ? "true" : "false");
    });
  }

  function showInfo(info, spec, title, desc, off) {
    info.innerHTML = "";
    if (!title) {
      info.textContent = spec.hint;
      info.classList.add("is-hint");
      return;
    }
    info.classList.remove("is-hint");
    var h = document.createElement("strong");
    h.textContent = title;
    info.appendChild(h);
    info.appendChild(document.createTextNode(spec.sep + desc + (off ? spec.offNote : "")));
  }

  function renderPipeline(root) {
    var L = LAYOUTS[root.getAttribute("data-layout") || "pc"];
    var NODES = L.nodes, EDGES = L.edges, LABEL_POS = L.labels, COL = L.col;
    var spec;
    try {
      spec = JSON.parse(root.querySelector("script[type='application/json']").textContent);
    } catch (err) {
      return;
    }
    var uid = "tca" + Math.random().toString(36).slice(2, 7);
    var boxes = {}, nodeEls = {}, edgeEls = {};
    NODES.forEach(function (n) { boxes[n.id] = box(n, L); });

    /* 档位切换 */
    var tierBtns = tierBar(root, spec.tiers, function (t) { setTier(t); });

    var scroller = document.createElement("div");
    scroller.className = "tc-arch__scroll";
    root.appendChild(scroller);
    var svg = el("svg", {
      viewBox: "0 0 " + W + " " + (L.h || H), role: "img",
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
    var G = L.group;
    el("rect", { x: G.x, y: G.y, width: G.w, height: G.h, rx: 12, class: "tc-arch__group" }, svg);
    var gl = el("text", { x: G.x + 12, y: G.y + 18, class: "tc-arch__grouplabel" }, svg);
    gl.textContent = spec.group;

    /* 图例:实线是数据与位姿,粉色虚线是 ③ 档的头显双目画面 */
    var lg = el("g", { class: "tc-arch__legend" }, svg);
    var LY = L.legend.y;
    el("path", { d: "M560," + LY + " h34", class: "tc-arch__line" }, lg);
    var l1 = el("text", { x: 602, y: LY + 4, class: "tc-arch__elabel" }, lg);
    l1.textContent = spec.legend[0];
    var lv = el("g", { class: "tc-arch__edge is-video" }, lg);
    el("path", { d: "M760," + LY + " h34", class: "tc-arch__line" }, lv);
    var l2 = el("text", { x: 802, y: LY + 4, class: "tc-arch__elabel" }, lg);
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

    function spawnDots(edgeIds) {
      runDots(dotLayer, uid, edgeIds.map(function (id) {
        return { id: id, video: EDGES.filter(function (e) { return e.id === id; })[0].video };
      }));
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
      var node = NODES.filter(function (n) { return n.id === id; })[0];
      showInfo(info, spec, txt && txt.title, txt && txt.desc, node && !active(node));
    }

    function setTier(t) {
      tier = t;
      markTier(tierBtns, t);
      root.setAttribute("data-tier", t);
      focus(pinned);
    }

    setTier(spec.tiers.length);
  }


  /* ===================================================================
     PC 版总览:每帧记录什么(data-diagram="frame")
     左边是来源,中间是一行数据的观测(第 t-1 帧)与动作(第 t 帧),右边是落盘位置
     =================================================================== */

  var FW = 1000, FH = 530;
  var F_COL = { src: 95, obs: 385, act: 665, out: 895 };

  /* side:L 左夹爪、R 右夹爪、H 头显,决定配色 */
  var F_SRC = [
    { id: "lgrip", y: 110, tier: 1, side: "L" },
    { id: "ltrk",  y: 186, tier: 2, side: "L" },
    { id: "rgrip", y: 282, tier: 1, side: "R" },
    { id: "rtrk",  y: 358, tier: 2, side: "R" },
    { id: "head",  y: 462, tier: 3, side: "H" }
  ];

  /* grp:img / state / act;d 指向页面 JSON 里 keys 的说明;dim 为维数 */
  var F_CHIPS = [
    { id: "L_tl",    key: "left_tactile_left",   grp: "img",   x: 310, y: 96,  src: "lgrip", d: "tactile" },
    { id: "L_tr",    key: "left_tactile_right",  grp: "img",   x: 460, y: 96,  src: "lgrip", d: "tactile" },
    { id: "R_tl",    key: "right_tactile_left",  grp: "img",   x: 310, y: 136, src: "rgrip", d: "tactile" },
    { id: "R_tr",    key: "right_tactile_right", grp: "img",   x: 460, y: 136, src: "rgrip", d: "tactile" },
    { id: "L_w",     key: "left_wrist",          grp: "img",   x: 310, y: 176, src: "lgrip", d: "wrist" },
    { id: "R_w",     key: "right_wrist",         grp: "img",   x: 460, y: 176, src: "rgrip", d: "wrist" },
    { id: "L_h",     key: "left_head",           grp: "img",   x: 310, y: 216, src: "head",  d: "headimg", tier: 3 },
    { id: "R_h",     key: "right_head",          grp: "img",   x: 460, y: 216, src: "head",  d: "headimg", tier: 3 },
    { id: "o_ltcp",  key: "left_tcp.*",          grp: "state", x: 310, y: 326, src: "ltrk",  d: "tcp",  dim: 9, tier: 2, twin: "a_ltcp" },
    { id: "o_lgrip", key: "left_gripper.pos",    grp: "state", x: 460, y: 326, src: "lgrip", d: "grip", dim: 1, twin: "a_lgrip" },
    { id: "o_rtcp",  key: "right_tcp.*",         grp: "state", x: 310, y: 366, src: "rtrk",  d: "tcp",  dim: 9, tier: 2, twin: "a_rtcp" },
    { id: "o_rgrip", key: "right_gripper.pos",   grp: "state", x: 460, y: 366, src: "rgrip", d: "grip", dim: 1, twin: "a_rgrip" },
    { id: "o_head",  key: "head_camera.*",       grp: "state", x: 385, y: 406, w: 295, src: "head", d: "headpose", dim: 9, tier: 3, twin: "a_head" },
    { id: "a_ltcp",  key: "left_tcp.*",          grp: "act",   x: 665, y: 330, src: "ltrk",  d: "tcp",  dim: 9, tier: 2, twin: "o_ltcp" },
    { id: "a_lgrip", key: "left_gripper.pos",    grp: "act",   x: 665, y: 366, src: "lgrip", d: "grip", dim: 1, twin: "o_lgrip" },
    { id: "a_rtcp",  key: "right_tcp.*",         grp: "act",   x: 665, y: 402, src: "rtrk",  d: "tcp",  dim: 9, tier: 2, twin: "o_rtcp" },
    { id: "a_rgrip", key: "right_gripper.pos",   grp: "act",   x: 665, y: 438, src: "rgrip", d: "grip", dim: 1, twin: "o_rgrip" },
    { id: "a_head",  key: "head_camera.*",       grp: "act",   x: 665, y: 474, src: "head",  d: "headpose", dim: 9, tier: 3, twin: "o_head" }
  ];

  var F_GROUPS = {
    img:   { x: 228, y: 46,  w: 314, h: 190, dest: "mp4", lx: 240, ly: 64 },
    state: { x: 228, y: 280, w: 314, h: 150, dest: "pq",  lx: 240, ly: 298 },
    act:   { x: 578, y: 280, w: 174, h: 214, dest: "pq",  lx: 590, ly: 298 }
  };

  var F_DEST = {
    mp4: { y: 224, h: 64 },
    pq:  { y: 410, h: 90 }
  };

  /* 组到落盘位置的连线:观测状态绕到动作框下方 */
  var F_GEDGES = {
    img:   "M542,224 L810,224",
    act:   "M752,410 L810,410",
    state: "M385,430 C385,515 895,525 895,455"
  };

  var SIDE_K = { L: "var(--arch-dev)", R: "var(--arch-read)", H: "var(--arch-video)" };

  function renderFrame(root) {
    var spec;
    try {
      spec = JSON.parse(root.querySelector("script[type='application/json']").textContent);
    } catch (err) {
      return;
    }
    var uid = "tcf" + Math.random().toString(36).slice(2, 7);
    var tier = 3, pinned = null;
    var srcEls = {}, chipEls = {}, sEdgeEls = {}, gEdgeEls = {}, destEls = {}, groupLabels = {};
    var chipById = {};
    F_CHIPS.forEach(function (c) { chipById[c.id] = c; });

    var tierBtns = tierBar(root, spec.tiers, function (t) { setTier(t); });
    var scroller = document.createElement("div");
    scroller.className = "tc-arch__scroll";
    root.appendChild(scroller);
    var svg = el("svg", {
      viewBox: "0 0 " + FW + " " + FH, role: "img",
      "aria-label": spec.title, class: "tc-arch__svg"
    }, scroller);
    var defs = el("defs", {}, svg);
    var mk = el("marker", {
      id: uid + "-arrow", viewBox: "0 0 10 10", refX: "9", refY: "5",
      markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse"
    }, defs);
    el("path", { d: "M0,0 L10,5 L0,10 z", class: "tc-arch__arrow" }, mk);

    Object.keys(F_COL).forEach(function (c) {
      var t = el("text", { x: F_COL[c], y: 24, class: "tc-arch__col" }, svg);
      t.textContent = spec.cols[c];
    });

    /* 时间轴:第 t-1 帧的观测与第 t 帧的动作组成数据集的一行 */
    var tl = el("g", { class: "tc-frame__timeline" }, svg);
    var cap = el("text", { x: 591, y: 66, class: "tc-arch__elabel" }, tl);
    cap.textContent = spec.timeline.caption;
    var slots = {};
    ["t-1", "t", "t+1"].forEach(function (name, i) {
      var x = 591 + i * 54;
      var g = el("g", { class: "tc-frame__slot is-" + ["obs", "act", "next"][i] }, tl);
      el("rect", { x: x, y: 78, width: 40, height: 36, rx: 6 }, g);
      var t = el("text", { x: x + 20, y: 101, class: "tc-arch__sub" }, g);
      t.textContent = name;
      slots[["obs", "act", "next"][i]] = g;
    });
    [["obs", 611], ["act", 665]].forEach(function (p) {
      var t = el("text", { x: p[1], y: 132, class: "tc-arch__sub" }, tl);
      t.textContent = spec.timeline[p[0]];
    });
    el("path", { d: "M593,140 v6 h90 v-6", class: "tc-frame__bracket" }, tl);
    var row = el("text", { x: 638, y: 162, class: "tc-arch__sub tc-frame__row" }, tl);
    row.textContent = spec.timeline.row;

    var edgeLayer = el("g", {}, svg);
    var dotLayer = el("g", {}, svg);
    var nodeLayer = el("g", {}, svg);

    Object.keys(F_GROUPS).forEach(function (k) {
      var gr = F_GROUPS[k];
      el("rect", { x: gr.x, y: gr.y, width: gr.w, height: gr.h, rx: 10, class: "tc-frame__group" }, nodeLayer);
      groupLabels[k] = el("text", { x: gr.lx, y: gr.ly, class: "tc-frame__glabel" }, nodeLayer);
      var g = el("g", { class: "tc-arch__edge" }, edgeLayer);
      el("path", { d: F_GEDGES[k], id: uid + "-g-" + k, class: "tc-arch__line",
        "marker-end": "url(#" + uid + "-arrow)" }, g);
      el("path", { d: F_GEDGES[k], class: "tc-arch__flow" }, g);
      gEdgeEls[k] = g;
    });

    function interactive(g, onFocus) {
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.addEventListener("mouseenter", function () { onFocus(); });
      g.addEventListener("mouseleave", function () { focus(pinned); });
      g.addEventListener("focus", function () { onFocus(); });
      g.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var key = g.getAttribute("data-id");
        pinned = pinned && pinned.id === key ? null : { id: key, run: onFocus };
        onFocus();
      });
    }

    F_SRC.forEach(function (n) {
      var txt = spec.nodes[n.id];
      var b = { x: F_COL.src - 80, y: n.y - 25, w: 160, h: 50 };
      var g = el("g", { class: "tc-arch__node", "data-id": n.id, "aria-label": txt.title,
        style: "--k:" + SIDE_K[n.side] }, nodeLayer);
      el("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 10, class: "tc-arch__box" }, g);
      el("rect", { x: b.x, y: b.y + 10, width: 4, height: b.h - 20, rx: 2, class: "tc-arch__tick" }, g);
      var t = el("text", { x: F_COL.src, y: n.y - 2, class: "tc-arch__title" }, g);
      t.textContent = txt.title;
      var st = el("text", { x: F_COL.src, y: n.y + 15, class: "tc-arch__sub" }, g);
      st.textContent = txt.sub;
      interactive(g, function () { focusChips(chipsWhere(function (c) { return c.src === n.id; }), n.id); });
      srcEls[n.id] = g;
    });

    Object.keys(F_DEST).forEach(function (k) {
      var d = F_DEST[k], txt = spec.nodes[k];
      var g = el("g", { class: "tc-arch__node is-out", "data-id": k, "aria-label": txt.title }, nodeLayer);
      el("rect", { x: 810, y: d.y - d.h / 2, width: 170, height: d.h, rx: 10, class: "tc-arch__box" }, g);
      el("rect", { x: 810, y: d.y - d.h / 2 + 10, width: 4, height: d.h - 20, rx: 2, class: "tc-arch__tick" }, g);
      var subs = [].concat(txt.sub);
      var top = d.y - subs.length * 9.5;
      var t = el("text", { x: F_COL.out, y: top + 5, class: "tc-arch__title" }, g);
      t.textContent = txt.title;
      subs.forEach(function (s, i) {
        var st = el("text", { x: F_COL.out, y: top + 5 + (i + 1) * 19, class: "tc-arch__sub" }, g);
        st.textContent = s;
      });
      interactive(g, function () {
        focusChips(chipsWhere(function (c) { return F_GROUPS[c.grp].dest === k; }), k);
      });
      destEls[k] = g;
    });

    F_CHIPS.forEach(function (c) {
      var w = c.w || (c.grp === "act" ? 150 : 145), h = 28;
      var g = el("g", { class: "tc-arch__node tc-frame__chip", "data-id": c.id, "aria-label": c.key,
        style: "--k:" + SIDE_K[F_SRC.filter(function (n) { return n.id === c.src; })[0].side] }, nodeLayer);
      el("rect", { x: c.x - w / 2, y: c.y - h / 2, width: w, height: h, rx: 6, class: "tc-arch__box" }, g);
      var t = el("text", { x: c.x, y: c.y + 4, class: "tc-frame__key" }, g);
      t.textContent = c.key;
      interactive(g, function () {
        focusChips([c.id].concat(c.twin && active(chipById[c.twin]) ? [c.twin] : []), c.id);
      });
      chipEls[c.id] = g;
      c.left = c.x - w / 2;

      var sn = F_SRC.filter(function (n) { return n.id === c.src; })[0];
      var p = [F_COL.src + 80, sn.y], q = [c.left, c.y];
      var dx = Math.max(40, (q[0] - p[0]) * 0.5);
      var d = "M" + p + " C" + [p[0] + dx, p[1]] + " " + [q[0] - dx, q[1]] + " " + q;
      var eg = el("g", { class: "tc-arch__edge is-src" + (c.src === "head" ? " is-video" : "") }, edgeLayer);
      el("path", { d: d, id: uid + "-s-" + c.id, class: "tc-arch__line",
        "marker-end": "url(#" + uid + "-arrow)" }, eg);
      sEdgeEls[c.id] = eg;
    });

    svg.addEventListener("click", function () { pinned = null; focus(null); });

    var info = document.createElement("div");
    info.className = "tc-arch__info";
    info.setAttribute("aria-live", "polite");
    root.appendChild(info);
    root.classList.add("is-ready");

    function active(item) { return (item.tier || 1) <= tier; }

    function chipsWhere(fn) {
      return F_CHIPS.filter(function (c) { return active(c) && fn(c); })
        .map(function (c) { return c.id; });
    }

    function describe(id) {
      if (chipById[id]) {
        var c = chipById[id];
        var desc = spec.keys[c.d] + (c.dim ? spec.dims.replace("{n}", c.dim) : "") +
          (c.grp === "act" ? spec.actNote : spec.obsNote);
        return { title: c.key, desc: desc, off: !active(c) };
      }
      var src = F_SRC.filter(function (n) { return n.id === id; })[0];
      var txt = spec.nodes[id];
      return { title: txt.title, desc: txt.desc, off: src ? !active(src) : false };
    }

    /* 点亮一组数据项,以及它们的来源、落盘位置和时间轴上对应的帧 */
    function focusChips(ids, selfId) {
      var chips = {}, srcs = {}, dests = {}, groups = {}, slotsOn = {};
      ids.forEach(function (id) {
        var c = chipById[id];
        chips[id] = true;
        srcs[c.src] = true;
        groups[c.grp] = true;
        dests[F_GROUPS[c.grp].dest] = true;
        slotsOn[c.grp === "act" ? "act" : "obs"] = true;
      });
      apply(selfId, chips, srcs, dests, groups, slotsOn);
    }

    function apply(selfId, chips, srcs, dests, groups, slotsOn) {
      var any = !!selfId;
      root.classList.toggle("has-focus", any);
      F_SRC.forEach(function (n) {
        var g = srcEls[n.id];
        g.classList.toggle("is-off", !active(n));
        g.classList.toggle("is-hit", !!srcs[n.id] || n.id === selfId);
        g.classList.toggle("is-self", n.id === selfId);
      });
      Object.keys(F_DEST).forEach(function (k) {
        destEls[k].classList.toggle("is-hit", !!dests[k] || k === selfId);
        destEls[k].classList.toggle("is-self", k === selfId);
      });
      F_CHIPS.forEach(function (c) {
        var on = !!chips[c.id];
        chipEls[c.id].classList.toggle("is-off", !active(c));
        chipEls[c.id].classList.toggle("is-hit", on || c.id === selfId);
        chipEls[c.id].classList.toggle("is-self", c.id === selfId);
        sEdgeEls[c.id].classList.toggle("is-off", !active(c));
        sEdgeEls[c.id].classList.toggle("is-hit", on && active(c));
      });
      Object.keys(gEdgeEls).forEach(function (k) {
        gEdgeEls[k].classList.toggle("is-hit", !!groups[k]);
      });
      Object.keys(slots).forEach(function (k) {
        slots[k].classList.toggle("is-hit", !!slotsOn[k]);
      });
      var paths = [];
      Object.keys(chips).forEach(function (id) {
        if (active(chipById[id])) paths.push({ id: "s-" + id, video: chipById[id].src === "head" });
      });
      Object.keys(groups).forEach(function (k) { paths.push({ id: "g-" + k }); });
      runDots(dotLayer, uid, paths);
      if (selfId) {
        var d = describe(selfId);
        showInfo(info, spec, d.title, d.desc, d.off);
      } else {
        showInfo(info, spec);
      }
    }

    function focus(p) {
      if (p) p.run();
      else apply(null, {}, {}, {}, {}, {});
    }

    function setTier(t) {
      tier = t;
      markTier(tierBtns, t);
      root.setAttribute("data-tier", t);
      var nImg = F_CHIPS.filter(function (c) { return c.grp === "img" && active(c); }).length;
      var nDim = F_CHIPS.filter(function (c) { return c.grp === "state" && active(c); })
        .reduce(function (s, c) { return s + c.dim; }, 0);
      groupLabels.img.textContent = spec.groups.img.replace("{n}", nImg);
      groupLabels.state.textContent = spec.groups.state.replace("{n}", nDim);
      groupLabels.act.textContent = spec.groups.act.replace("{n}", nDim);
      focus(pinned);
    }

    setTier(3);
  }

  function init() {
    document.querySelectorAll(".tc-arch:not(.is-ready)").forEach(function (root) {
      if (root.getAttribute("data-diagram") === "frame") renderFrame(root);
      else renderPipeline(root);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
