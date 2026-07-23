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
    const nextLabel = currentLabel(nav);
    if (label && label.textContent !== nextLabel) label.textContent = nextLabel;
  }

  navigationTargets.forEach(([navSelector, contentSelector]) => {
    const nav = document.querySelector(navSelector);
    if (!nav) return;

    function ensureToggle() {
      let toggle = nav.querySelector(":scope > .mobile-nav-toggle");
      if (!toggle) {
        toggle = document.createElement("button");
        toggle.className = "mobile-nav-toggle";
        toggle.type = "button";
        toggle.innerHTML = `
          <span>
            <small>Разделы</small>
            <strong data-mobile-nav-current>${currentLabel(nav)}</strong>
          </span>
          <b aria-hidden="true">⌄</b>
        `;
        nav.prepend(toggle);
      }
      const isOpen = nav.dataset.mobileNavOpen === "true";
      toggle.setAttribute("aria-expanded", String(isOpen));
      return toggle;
    }

    nav.dataset.mobileNavOpen = "false";
    nav.classList.add("mobile-nav-ready");
    ensureToggle();

    nav.addEventListener("click", (event) => {
      const toggle = event.target.closest(".mobile-nav-toggle");
      if (toggle) {
        const willOpen = nav.dataset.mobileNavOpen !== "true";
        nav.dataset.mobileNavOpen = String(willOpen);
        toggle.setAttribute("aria-expanded", String(willOpen));
        return;
      }
      if (!mobileQuery.matches) return;
      const target = event.target.closest("button, a");
      if (!target) return;
      window.requestAnimationFrame(() => {
        const currentToggle = ensureToggle();
        nav.dataset.mobileNavOpen = "false";
        currentToggle.setAttribute("aria-expanded", "false");
        updateLabel(nav);
        document.querySelector(contentSelector)?.scrollIntoView({
          block: "start",
          behavior: reduceMotion.matches ? "auto" : "smooth"
        });
      });
    });

    new MutationObserver(() => {
      ensureToggle();
      updateLabel(nav);
    }).observe(nav, {
      childList: true,
      attributes: true,
      attributeFilter: ["class"],
      subtree: true
    });

    mobileQuery.addEventListener("change", () => {
      const toggle = ensureToggle();
      nav.dataset.mobileNavOpen = "false";
      toggle.setAttribute("aria-expanded", "false");
      updateLabel(nav);
    });
  });
})();
