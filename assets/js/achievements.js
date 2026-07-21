(function () {
  const data = window.PK_ACHIEVEMENTS;
  const nav = document.querySelector("#achievementsNav");
  const hero = document.querySelector("#achievementsHero");
  const grid = document.querySelector("#achievementsGrid");
  let active = data.sections[0];

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function normalizeText(value) {
    return String(value || "")
      .replace(/\.\.\.$|…$/g, "")
      .replace(/[*]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function scoreWord(value) {
    const number = Math.abs(Number(value));
    const lastTwo = number % 100;
    const last = number % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return "баллов";
    if (last === 1) return "балл";
    if (last >= 2 && last <= 4) return "балла";
    return "баллов";
  }

  function formatScore(item) {
    const minScore = Number(item.minScore);
    const maxScore = Number(item.maxScore);
    if (Number.isFinite(minScore) && Number.isFinite(maxScore)) {
      if (minScore !== maxScore) {
        const lowScore = Math.min(minScore, maxScore);
        const highScore = Math.max(minScore, maxScore);
        return `${lowScore}-${highScore} ${scoreWord(highScore)}`;
      }
      return `${maxScore} ${scoreWord(maxScore)}`;
    }
    return item.score || "";
  }

  function getDisplayDetails(item) {
    const title = normalizeText(item.title);
    const originalTitle = normalizeText(item.originalTitle);
    const isShortenedTitle = /\.\.\.$|…$/.test(String(item.title || "").trim());

    return (item.details || []).filter((detail) => {
      const text = normalizeText(detail);
      if (!text) return false;
      if (text === title) return false;
      if (title === originalTitle && text === originalTitle) return false;
      if (isShortenedTitle && originalTitle && (text === originalTitle || text.startsWith(title))) return false;
      return true;
    });
  }

  function detailClass(detail) {
    return /:\s*$/.test(String(detail || "").trim()) ? " class=\"is-subheading\"" : "";
  }

  function renderNav() {
    nav.innerHTML = `
      <p>Разделы</p>
      ${data.sections.map((section) => `
        <button class="${section.id === active.id ? "is-active" : ""}" type="button" data-section-id="${section.id}">
          <span>${escapeHtml(section.kicker)}</span>
          ${escapeHtml(section.title)}
        </button>
      `).join("")}
    `;
  }

  function renderHero() {
    hero.innerHTML = `
      <p>${escapeHtml(active.kicker)} раздел</p>
      <h2>${escapeHtml(active.title)}</h2>
      <span>${escapeHtml(active.intro)}</span>
      ${active.note ? `<strong>${escapeHtml(active.note)}</strong>` : ""}
    `;
  }

  function renderGrid() {
    const items = [...active.items].sort((a, b) => {
      const scoreDelta = (Number(b.maxScore) || 0) - (Number(a.maxScore) || 0);
      if (scoreDelta) return scoreDelta;
      return String(a.title).localeCompare(String(b.title), "ru");
    });

    grid.innerHTML = items.map((item) => {
      const score = formatScore(item);
      const details = getDisplayDetails(item);

      return `
        <article class="achievement-card">
          ${score ? `<div class="achievement-score">${escapeHtml(score)}</div>` : ""}
          <h3>${escapeHtml(item.title)}</h3>
          ${details.length ? `
            <div class="achievement-details">
              <ul>${details.map((detail) => `<li${detailClass(detail)}>${escapeHtml(detail)}</li>`).join("")}</ul>
            </div>
          ` : ""}
        </article>
      `;
    }).join("");
  }

  nav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-section-id]");
    if (!button) return;
    active = data.sections.find((section) => section.id === button.dataset.sectionId) || active;
    renderNav();
    renderHero();
    renderGrid();
  });

  document.querySelector("[data-open-achievements-site]").addEventListener("click", () => {
    window.open(data.siteUrl, "_blank", "noopener,noreferrer");
  });

  document.querySelector("[data-go-back]")?.addEventListener("click", () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "index.html";
  });

  renderNav();
  renderHero();
  renderGrid();
})();
