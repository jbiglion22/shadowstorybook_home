/*
 * Shadow Storybook website
 * 1) Language: the English page (index.html, privacy-policy.html) sends Korean visitors to the -ko page
 *    on their first visit. A language the visitor picks is remembered and wins over the browser language.
 * 2) Shadow stage demo: drag the light behind the screen, tap the tiger to make it roar.
 */
(function () {
  var KEY = "shadow-storybook-lang";

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) { /* private mode */ }
  }

  // --- 1. language redirect (runs only on the default English page) ---
  var root = document.documentElement;
  var page = root.getAttribute("data-page");          // "index" | "privacy-policy"
  var isDefault = root.getAttribute("data-default") === "true";
  if (isDefault && page) {
    var params = new URLSearchParams(window.location.search);
    if (!params.has("lang")) {
      var preferred = saved();
      if (!preferred) {
        var browser = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
        preferred = browser.toLowerCase().indexOf("ko") === 0 ? "ko" : "en";
      }
      if (preferred === "ko") {
        window.location.replace(page + "-ko.html" + window.location.hash);
        return;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    // remember the language the visitor chose
    document.querySelectorAll("[data-set-lang]").forEach(function (link) {
      link.addEventListener("click", function () { save(link.getAttribute("data-set-lang")); });
    });

    // --- 2. shadow stage demo: the light shines from behind the screen; drag it, tap the tiger ---
    var stage = document.querySelector(".stage");
    if (!stage) return;
    var bubble = stage.querySelector(".bubble");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function setLight(x, y) {
      x = Math.min(0.95, Math.max(0.05, x));
      y = Math.min(0.6, Math.max(0.1, y));
      stage.style.setProperty("--lx", (x * 100).toFixed(1) + "%");
      stage.style.setProperty("--ly", (y * 100).toFixed(1) + "%");
    }

    function fromEvent(e) {
      var rect = stage.getBoundingClientRect();
      setLight((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
    }

    var dragging = false, touched = false;
    stage.addEventListener("pointerdown", function (e) {
      touched = true;
      if (e.target.classList && e.target.classList.contains("tap")) { poke(e.target); return; }
      dragging = true; stage.setPointerCapture(e.pointerId); fromEvent(e);
    });
    stage.addEventListener("pointermove", function (e) { if (dragging) fromEvent(e); });
    stage.addEventListener("pointerup", function () { dragging = false; });
    stage.addEventListener("pointercancel", function () { dragging = false; });

    function poke(fig) {
      fig.classList.remove("jump"); void fig.offsetWidth; fig.classList.add("jump");
      if (bubble) {
        var s = stage.getBoundingClientRect(), r = fig.getBoundingClientRect();
        bubble.textContent = fig.getAttribute("data-bubble") || "";
        bubble.style.left = (r.left + r.width / 2 - s.left) + "px";
        bubble.style.top = (r.top - s.top - 6) + "px";
        bubble.classList.add("show");
        clearTimeout(poke.t); poke.t = setTimeout(function () { bubble.classList.remove("show"); }, 1600);
      }
    }
    stage.querySelectorAll(".figure.tap").forEach(function (fig) {
      fig.addEventListener("animationend", function () { fig.classList.remove("jump"); });
    });

    // the light drifts slowly until the visitor touches the stage
    setLight(0.72, 0.28);
    if (!reduce) {
      var t = 0;
      (function drift() {
        if (touched) return;
        t += 0.01;
        setLight(0.5 + Math.sin(t) * 0.3, 0.28 + Math.sin(t * 0.7) * 0.06);
        window.requestAnimationFrame(drift);
      })();
    }
  });
})();
