(function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "operator";
  const docs = window.PK_SCRIPT_PAGES || [];
  const doc = docs.find((item) => item.id === id) || docs[0];
  const title = document.querySelector("#docTitle");
  const nav = document.querySelector("#scriptNav");
  const content = document.querySelector("#docContent");
  const pdfButton = document.querySelector("[data-open-script-pdf]");
  const backButton = document.querySelector("[data-go-back]");

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function openPdf() {
    if (!doc || !doc.pdfFile) return;
    const url = `pdf-viewer.html?file=${encodeURIComponent(doc.pdfFile)}&title=${encodeURIComponent(doc.title)}`;
    window.location.href = url;
  }

  function renderChecklist(line) {
    const markerIndex = line.search(/[✅📌⏰]/);
    if (markerIndex < 0) return `<p>${escapeHtml(line)}</p>`;

    const lead = line.slice(0, markerIndex).trim();
    const items = line.slice(markerIndex)
      .split(/(?=[✅📌⏰])/)
      .map((item) => item.replace(/^[✅📌⏰]\s*/, "").trim())
      .filter(Boolean);

    return `
      <div class="script-checklist">
        ${lead ? `<p>${escapeHtml(lead)}</p>` : ""}
        <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
    `;
  }

  function renderItem(item) {
    if (item.kind === "program") {
      return `<h3 class="script-program" id="${escapeHtml(item.id)}">${escapeHtml(item.text)}</h3>`;
    }

    if (item.kind === "profile") {
      return `<h4 class="script-profile" id="${escapeHtml(item.id)}">${escapeHtml(item.text)}</h4>`;
    }

    if (item.kind === "label") {
      return `<p class="script-label">${escapeHtml(item.text)}</p>`;
    }

    if (item.kind === "subheading") {
      return `<h3 id="${escapeHtml(item.id)}">${escapeHtml(item.text)}</h3>`;
    }

    if (item.kind === "checklist") {
      return renderChecklist(item.text);
    }

    if (item.kind === "question") {
      return `<blockquote class="script-question">${escapeHtml(item.text)}</blockquote>`;
    }

    if (item.kind === "note") {
      return `<p class="script-note">${escapeHtml(item.text)}</p>`;
    }

    return `<p>${escapeHtml(item.text)}</p>`;
  }

  function renderNav() {
    const rows = doc.sections.map((section) => {
      const subitems = section.items
        .filter((item) => item.kind === "program" || item.kind === "profile" || item.kind === "subheading")
        .map((item) => `
          <button class="script-nav__sub script-nav__sub--${escapeHtml(item.kind)}" type="button" data-scroll-target="${escapeHtml(item.id)}">
            ${escapeHtml(item.text)}
          </button>
        `)
        .join("");

      return `
        <div class="script-nav__group">
          <button class="script-nav__section" type="button" data-scroll-target="${escapeHtml(section.id)}">
            ${escapeHtml(section.title)}
          </button>
          ${subitems}
        </div>
      `;
    }).join("");

    nav.innerHTML = `
      <p>Навигация по скрипту</p>
      ${rows}
    `;
  }

  function renderContent() {
    const sectionCount = doc.sections.length;
    const itemCount = doc.sections.reduce((total, section) => total + (section.items || []).length, 0);

    content.innerHTML = `
      <article class="script-overview">
        <p>Интерактивная версия</p>
        <h2>${escapeHtml(doc.title)}</h2>
        <span>${sectionCount} разделов, ${itemCount} рабочих блоков.</span>
      </article>
      <div class="script-sections">
        ${doc.sections.map((section) => `
          <article class="script-section" id="${escapeHtml(section.id)}">
            <h2>${escapeHtml(section.title)}</h2>
            <div class="script-section__body">
              ${section.items.map(renderItem).join("")}
            </div>
          </article>
        `).join("")}
      </div>
    `;
  }

  function setActive(targetId) {
    nav.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.scrollTarget === targetId);
    });
  }

  if (!doc) {
    title.textContent = "Материал не найден";
    nav.innerHTML = "";
    content.innerHTML = '<p class="large-text">Не удалось найти текст скрипта.</p>';
    return;
  }

  document.title = `${doc.title} | Московский Политех`;
  title.textContent = doc.title;
  pdfButton.hidden = !doc.pdfFile;

  if (doc.pdfFile) pdfButton.addEventListener("click", openPdf);
  backButton?.addEventListener("click", () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "index.html";
  });
  nav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-scroll-target]");
    if (!button) return;

    const target = document.getElementById(button.dataset.scrollTarget);
    if (!target) return;

    setActive(button.dataset.scrollTarget);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  renderNav();
  renderContent();
})();
