(function () {
  const mobileQuery = window.matchMedia("(max-width: 900px), (max-height: 500px) and (max-width: 1000px)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const navigationTargets = [
    [".script-nav", ".script-viewer-content"],
    [".method-nav", ".method-content"],
    [".teacher-nav", ".teacher-content"],
    [".achievements-nav", ".achievements-content"]
  ];

  function currentLabel(nav) {
    const active = nav.querySelector(".is-active");
    const fallback = nav.querySelector("button:not(.mobile-nav-toggle), a");
    return (active || fallback)?.textContent?.replace(/\s+/g, " ").trim() || "Выберите раздел";
  }

  function updateLabel(nav) {
    const label = nav.querySelector("[data-mobile-nav-current]");
    if (label) label.textContent = currentLabel(nav);
  }

  navigationTargets.forEach(([navSelector, contentSelector]) => {
    const nav = document.querySelector(navSelector);
    if (!nav) return;

    const toggle = document.createElement("button");
    toggle.className = "mobile-nav-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = `
      <span>
        <small>Разделы</small>
        <strong data-mobile-nav-current>${currentLabel(nav)}</strong>
      </span>
      <b aria-hidden="true">⌄</b>
    `;
    nav.prepend(toggle);
    nav.dataset.mobileNavOpen = "false";
    nav.classList.add("mobile-nav-ready");

    toggle.addEventListener("click", () => {
      const willOpen = nav.dataset.mobileNavOpen !== "true";
      nav.dataset.mobileNavOpen = String(willOpen);
      toggle.setAttribute("aria-expanded", String(willOpen));
    });

    nav.addEventListener("click", (event) => {
      if (!mobileQuery.matches || event.target.closest(".mobile-nav-toggle")) return;
      const target = event.target.closest("button, a");
      if (!target) return;
      window.requestAnimationFrame(() => {
        nav.dataset.mobileNavOpen = "false";
        toggle.setAttribute("aria-expanded", "false");
        updateLabel(nav);
        document.querySelector(contentSelector)?.scrollIntoView({
          block: "start",
          behavior: reduceMotion.matches ? "auto" : "smooth"
        });
      });
    });

    new MutationObserver(() => updateLabel(nav)).observe(nav, {
      attributes: true,
      attributeFilter: ["class"],
      subtree: true
    });

    mobileQuery.addEventListener("change", () => {
      nav.dataset.mobileNavOpen = "false";
      toggle.setAttribute("aria-expanded", "false");
      updateLabel(nav);
    });
  });
})();
