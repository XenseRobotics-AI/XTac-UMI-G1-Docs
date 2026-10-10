/* 标签页里的标题出现在左侧目录里，但没选中的标签页内容是隐藏的。
   点目录或带 # 的链接跳到这样的标题时，先切到它所在的标签页，再滚动过去。 */
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

  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="#"]');
    if (!a) return;
    var hash = a.getAttribute("href");
    if (reveal(hash)) {
      ev.preventDefault();
      history.pushState(null, "", hash);
    }
  });
  window.addEventListener("hashchange", function () { reveal(location.hash); });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { reveal(location.hash); });
  } else {
    reveal(location.hash);
  }
})();
