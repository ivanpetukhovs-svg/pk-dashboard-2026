(function () {
  const data = window.PK_EXAM_SCHEDULE_DATA;
  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get("return");
  const tabs = document.querySelector("#scheduleTabs");
  const content = document.querySelector("#scheduleContent");
  const backButton = document.querySelector("[data-go-back]");
  let activeId = data.sections[0].id;

  function pdfLink(doc) {
    const targetReturn = `exam-schedule.html${returnUrl ? `?return=${encodeURIComponent(returnUrl)}` : ""}`;
    return `pdf-viewer.html?file=${encodeURIComponent(doc.file)}&title=${encodeURIComponent(doc.title)}&return=${encodeURIComponent(targetReturn)}`;
  }

  function renderTabs() {
    tabs.innerHTML = data.sections.map((section) => `
      <button class="${section.id === activeId ? "is-active" : ""}" type="button" data-section-id="${section.id}">
        <span>${section.number}</span>
        <strong>${section.title}</strong>
        <small>${section.subtitle}</small>
      </button>
    `).join("");
  }

  function renderFlows(section) {
    return `
      <div class="schedule-flow-grid">
        ${section.flows.map((flow) => `
          <article class="schedule-flow-card">
            <div>
              <p>${flow.title}</p>
              <h3>${flow.dates}</h3>
            </div>
            <div class="schedule-flow-actions">
              ${flow.docs.map((doc) => `<a href="${pdfLink(doc)}">${doc.label}</a>`).join("")}
            </div>
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderGroups(section) {
    return `
      <div class="postgraduate-panel">
        <div>
          <h3>Что есть в разделе</h3>
          <p>${section.lead}</p>
        </div>
        <div class="postgraduate-groups">
          ${section.groups.map((group) => `<span>${group}</span>`).join("")}
        </div>
        <a class="official-link" href="${data.sourceUrl}" target="_blank" rel="noopener noreferrer">Открыть официальный раздел</a>
      </div>
    `;
  }

  function renderContent() {
    const section = data.sections.find((item) => item.id === activeId) || data.sections[0];
    content.innerHTML = `
      <article class="schedule-section">
        <header class="schedule-section__header">
          <div>
            <p>${section.number} раздел</p>
            <h2>${section.title}</h2>
            <span>${section.lead}</span>
          </div>
        </header>
        ${section.image ? `
          <figure class="schedule-map">
            <img src="${section.image}" alt="${section.imageAlt}">
          </figure>
        ` : ""}
        ${section.flows ? renderFlows(section) : renderGroups(section)}
      </article>
    `;
  }

  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-section-id]");
    if (!button) return;
    activeId = button.dataset.sectionId;
    renderTabs();
    renderContent();
  });

  backButton?.addEventListener("click", () => {
    if (returnUrl) window.location.href = returnUrl;
    else if (window.history.length > 1) window.history.back();
    else window.location.href = "index.html";
  });

  renderTabs();
  renderContent();
})();
