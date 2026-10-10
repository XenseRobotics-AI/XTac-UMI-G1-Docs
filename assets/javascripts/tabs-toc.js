/* 标签页里的标题出现在左侧目录里，但没选中的标签页内容是隐藏的。
   1. 左侧目录只显示当前选中标签页里的标题，切换标签页时同步切换；
   2. 点带 # 的链接跳到隐藏标签页里的标题时，先切到那个标签页，再滚动过去。 */
(function () {
  function reveal(hash) {
    if (!hash || hash.length < 2) return false;
    var target;
    try {
      target = document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch (err) {
      return false;
    }
    if (!target) return false;
    var opened = false;
    var block = target.closest(".tabbed-block");
    while (block) {
      var set = block.closest(".tabbed-set");
      if (!set) break;
      var blocks = Array.prototype.filter.call(
        set.querySelector(".tabbed-content").children,
        function (el) { return el.classList.contains("tabbed-block"); }
      );
      var inputs = set.querySelectorAll(":scope > input");
      var idx = blocks.indexOf(block);
      if (idx >= 0 && inputs[idx] && !inputs[idx].checked) {
        inputs[idx].checked = true;
        inputs[idx].dispatchEvent(new Event("change", { bubbles: true }));
        opened = true;
      }
      block = set.parentElement && set.parentElement.closest(".tabbed-block");
    }
    if (opened) {
      requestAnimationFrame(function () { target.scrollIntoView(); });
    }
    return opened;
  }

  function blockActive(block) {
    var set = block.closest(".tabbed-set");
    var blocks = Array.prototype.filter.call(
      set.querySelector(".tabbed-content").children,
      function (el) { return el.classList.contains("tabbed-block"); }
    );
    var inputs = set.querySelectorAll(":scope > input");
    var idx = blocks.indexOf(block);
    return !(idx >= 0 && inputs[idx]) || inputs[idx].checked;
  }

  function syncToc() {
    document.querySelectorAll(".md-nav--secondary a.md-nav__link").forEach(function (a) {
      var hash = a.getAttribute("href") || "";
      if (hash.charAt(0) !== "#") return;
      var target;
      try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (err) { return; }
      if (!target) return;
      var visible = true;
      var block = target.closest(".tabbed-block");
      while (block) {
        if (!blockActive(block)) { visible = false; break; }
        var set = block.closest(".tabbed-set");
        block = set.parentElement && set.parentElement.closest(".tabbed-block");
      }
      var li = a.closest("li");
      if (li) li.style.display = visible ? "" : "none";
    });
  }

  document.addEventListener("change", function (ev) {
    if (ev.target.closest && ev.target.closest(".tabbed-set")) syncToc();
  });

  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="#"]');
    if (!a) return;
    var hash = a.getAttribute("href");
    if (reveal(hash)) {
      ev.preventDefault();
      history.pushState(null, "", hash);
    }
  });
  window.addEventListener("hashchange", function () { reveal(location.hash); syncToc(); });
  function init() { reveal(location.hash); syncToc(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
