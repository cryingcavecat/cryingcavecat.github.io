(function () {
  var root = document.documentElement;
  var dark = window.matchMedia("(prefers-color-scheme: dark)");

  function isDark() {
    return root.dataset.theme ? root.dataset.theme === "dark" : dark.matches;
  }

  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("pref-theme", next); } catch (e) {}
      root.dispatchEvent(new CustomEvent("themechange", { detail: { dark: next === "dark" } }));
    });
  }
  dark.addEventListener("change", function () {
    root.dispatchEvent(new CustomEvent("themechange", { detail: { dark: isDark() } }));
  });
  window.paperbackIsDark = isDark;

  // Copy buttons on code blocks
  document.querySelectorAll(".prose pre").forEach(function (pre) {
    var code = pre.querySelector("code");
    if (!code || !navigator.clipboard) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy";
    btn.textContent = "copy";
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(code.innerText).then(function () {
        btn.textContent = "copied";
        setTimeout(function () { btn.textContent = "copy"; }, 1500);
      });
    });
    var wrap = pre.parentElement.classList.contains("highlight") ? pre.parentElement : pre;
    wrap.style.position = "relative";
    wrap.appendChild(btn);
  });
})();
