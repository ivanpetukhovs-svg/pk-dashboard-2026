(function () {
  const data = window.PK_DATA;
  let activeTheme = data.themes.find((theme) => theme.id === data.defaultThemeId) || data.themes[0];

  const topicList = document.querySelector("#topicList");
  const faqList = document.querySelector("#faqList");
  const materialsGrid = document.querySelector("#materialsGrid");
  const modalBackdrop = document.querySelector("#modalBackdrop");
  const modalKicker = document.querySelector("#modalKicker");
  const modalTitle = document.querySelector("#modalTitle");
  const modalContent = document.querySelector("#modalContent");
  const modalActions = document.querySelector("#modalActions");

  function icon(name) {
    const icons = {
      doc: '<path d="M7 3.5h6l4 4V20H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z"/><path d="M13 3.5V8h4M8 12h8M8 15h8"/>',
      chat: '<path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v4A3.5 3.5 0 0 1 15.5 14H11l-4.5 4v-4A3.5 3.5 0 0 1 3 10.5v-4Z"/><path d="M8 8h8M8 11h5"/>',
      map: '<path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z"/><path d="M9 4v14M15 6v14"/>',
      book: '<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v15H8a3 3 0 0 0-3 3V5.5Z"/><path d="M5 18V5.5M8 18h12"/>',
      exam: '<path d="M8 4h9a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3Z"/><path d="M8 8h7M8 12h8M8 16h5"/>',
      link: '<path d="M10.5 13.5 13.5 10.5"/><path d="M9 7.5l1.4-1.4a4 4 0 0 1 5.7 5.7L14.7 13"/><path d="M15 16.5l-1.4 1.4a4 4 0 0 1-5.7-5.7L9.3 11"/>',
      layers: '<path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 12 8 4 8-4M4 17l8 4 8-4"/>',
      percent: '<path d="m7 17 10-10"/><path d="M7.5 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM16.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>',
      award: '<path d="M12 15.5A5.5 5.5 0 1 0 12 4.5a5.5 5.5 0 0 0 0 11Z"/><path d="m9.5 14.8-1 5.2 3.5-2 3.5 2-1-5.2"/><path d="m10.2 10.7 1.2 1.1 2.4-3"/>'
    };

    return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.doc}</svg>`;
  }

  function openLocalFile(path) {
    closeModal();
    window.location.href = path;
  }

  function openExternal(url) {
    window.open(url, "_blank", "noopener,noreferrer");
    closeModal();
  }

  function renderTopics() {
    topicList.innerHTML = data.themes.filter((theme) => theme.id !== "polytech").map((theme) => `
      <button class="topic-item ${theme.id === activeTheme.id ? "is-active" : ""}" type="button" data-theme-id="${theme.id}" style="--topic-accent:${theme.accent}">
        <span class="topic-dot"></span>
        <span>${theme.menuTitle}</span>
      </button>
    `).join("");
  }

  function renderHero() {
    document.documentElement.style.setProperty("--active-accent", activeTheme.accent);
    document.querySelector("#heroEyebrow").textContent = activeTheme.title;
    document.querySelector("#heroTitle").textContent = activeTheme.shortTitle;
    document.querySelector("#heroDescription").textContent = activeTheme.description;
    document.querySelector("#heroPoints").innerHTML = activeTheme.points.map((point) => `<span>${point}</span>`).join("");
  }

  function renderFaq(limit = 8) {
    faqList.innerHTML = data.faq.slice(0, limit).map((item, index) => `
      <button class="faq-item" type="button" data-faq-index="${index}">
        <span>${item.question}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
      </button>
    `).join("");
  }

  function renderMaterials() {
    materialsGrid.innerHTML = data.materials.map((item, index) => `
      <button class="material-card" type="button" data-material-index="${index}">
        <span class="material-icon">${icon(item.icon)}</span>
        <strong>${item.title}</strong>
        <span>${item.description}</span>
      </button>
    `).join("");
  }

  function closeModal() {
    modalBackdrop.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function openModal({ kicker = "", title, content = "", actions = [] }) {
    const visibleActions = actions.filter((action) => {
      const label = String(action.label || "").toLowerCase();
      return action.onClick !== closeModal && label !== "закрыть" && label !== "понятно";
    });

    modalKicker.textContent = kicker;
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    modalActions.hidden = !visibleActions.length;
    modalActions.innerHTML = visibleActions.map((action, index) => `
      <button class="${action.variant === "secondary" ? "modal-button modal-button--secondary" : "modal-button"}" type="button" data-modal-action="${index}">
        ${action.label}
      </button>
    `).join("");
    modalActions.querySelectorAll("[data-modal-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = visibleActions[Number(button.dataset.modalAction)];
        if (action && action.onClick) action.onClick();
      });
    });
    modalBackdrop.hidden = false;
    document.body.classList.add("modal-open");
  }

  function themeContent(theme) {
    const sections = theme.scriptSections.map((section) => `
      <article class="info-block">
        <h3>${section.title}</h3>
        <p>${section.text}</p>
      </article>
    `).join("");
    const points = theme.points.map((point) => `<li>${point}</li>`).join("");

    return `
      <div class="theme-summary" style="--theme-accent:${theme.accent}">
        <p>${theme.description}</p>
        <ul>${points}</ul>
      </div>
      <div class="info-grid">${sections}</div>
    `;
  }

  function openThemeModal(theme = activeTheme) {
    openModal({
      kicker: "Скрипт направления",
      title: theme.title,
      content: themeContent(theme),
      actions: [
        { label: "Открыть полный скрипт", onClick: () => openLocalFile(theme.scriptFile) },
        { label: "PDF-версия", onClick: () => openLocalFile(theme.pdfFile) },
        { label: "Закрыть", variant: "secondary", onClick: closeModal }
      ]
    });
  }

  function openFaqModal(index) {
    const faq = data.faq[index];
    openModal({
      kicker: "FAQ",
      title: faq.question,
      content: `<p class="large-text">${faq.answer}</p>`,
      actions: [
        { label: "Методические указания", onClick: () => openLocalFile("method-guide.html") },
        { label: "Закрыть", variant: "secondary", onClick: closeModal }
      ]
    });
  }

  function openAllFaq() {
    const content = data.faq.map((item, index) => `
      <button class="faq-row" type="button" data-all-faq-index="${index}">
        <strong>${item.question}</strong>
        <span>${item.answer}</span>
      </button>
    `).join("");
    openModal({
      kicker: "FAQ",
      title: "Частые вопросы абитуриентов",
      content: `<div class="faq-rows">${content}</div>`,
      actions: [{ label: "Закрыть", variant: "secondary", onClick: closeModal }]
    });
    modalContent.querySelectorAll("[data-all-faq-index]").forEach((button) => {
      button.addEventListener("click", () => openFaqModal(Number(button.dataset.allFaqIndex)));
    });
  }

  function openScriptsModal() {
    const themeRows = data.themes.filter((theme) => theme.id !== "polytech").map((theme) => `
      <article class="script-row" style="--theme-accent:${theme.accent}">
        <div>
          <strong>${theme.title}</strong>
          <span>${theme.scriptTitle}</span>
        </div>
        <div class="script-row__actions">
          <button type="button" data-script-theme="${theme.id}">Кратко</button>
          <button type="button" data-script-file="${theme.scriptFile}">Страница</button>
          <button type="button" data-script-pdf="${theme.pdfFile}">PDF</button>
        </div>
      </article>
    `).join("");

    openModal({
      kicker: "Материалы преподавателя",
      title: "Скрипты взаимодействия",
      content: `
        <div class="scripts-layout">
          <article class="operator-card">
            <p>Общий сценарий</p>
            <h3>Консультация поступающего</h3>
            <span>Приветствие, квалификация запроса, сроки, документы, вступительные испытания, ДПО и завершение разговора.</span>
            <button type="button" data-open-operator>Открыть страницу</button>
            <button type="button" data-open-operator-pdf>PDF-версия</button>
          </article>
          <div class="scripts-list">${themeRows}</div>
        </div>
      `,
      actions: [{ label: "Закрыть", variant: "secondary", onClick: closeModal }]
    });

    modalContent.querySelector("[data-open-operator]").addEventListener("click", () => openLocalFile("document-viewer.html?id=operator"));
    modalContent.querySelector("[data-open-operator-pdf]").addEventListener("click", () => openLocalFile("pdf-viewer.html?file=docs/scripts_pdf/Obshchiy_scenariy_konsultacii.pdf&title=Общий%20сценарий%20консультации"));
    modalContent.querySelectorAll("[data-script-theme]").forEach((button) => {
      button.addEventListener("click", () => {
        const theme = data.themes.find((item) => item.id === button.dataset.scriptTheme);
        if (theme) openThemeModal(theme);
      });
    });
    modalContent.querySelectorAll("[data-script-file]").forEach((button) => {
      button.addEventListener("click", () => openLocalFile(button.dataset.scriptFile));
    });
    modalContent.querySelectorAll("[data-script-pdf]").forEach((button) => {
      button.addEventListener("click", () => openLocalFile(button.dataset.scriptPdf));
    });
  }

  function openDisciplineMaps() {
    const mapsItem = data.materials.find((item) => item.type === "disciplineMaps");
    openModal({
      kicker: "Карты дисциплин",
      title: "Карты дисциплин",
      content: `<p class="large-text">Карты дисциплин добавлены отдельно и открываются через общую папку Google Drive.</p>`,
      actions: [
        { label: "Открыть Google Drive", onClick: () => openExternal(mapsItem.url) },
        { label: "Закрыть", variant: "secondary", onClick: closeModal }
      ]
    });
  }

  function openDpo() {
    openModal({
      kicker: "Дополнительное образование",
      title: data.dpo.title,
      content: `<p class="large-text">${data.dpo.text}</p>`,
      actions: [
        { label: "Открыть витрину ДПО", onClick: () => openExternal(data.dpo.url) },
        { label: "Закрыть", variant: "secondary", onClick: closeModal }
      ]
    });
  }

  function openMasterPrep() {
    openModal({
      kicker: "Подготовка к поступлению",
      title: data.masterPrep.title,
      content: `<p class="large-text">${data.masterPrep.text}</p>`,
      actions: [
        { label: "Открыть витрину", onClick: () => openExternal(data.masterPrep.url) }
      ]
    });
  }

  function openLoyalty() {
    openModal({
      kicker: "Платная основа",
      title: data.loyalty.title,
      content: `
        <p class="large-text">Программа лояльности включает:</p>
        <ul class="clean-list">${data.loyalty.items.map((item) => `<li>${item}</li>`).join("")}</ul>
      `,
      actions: [
        { label: "Краткая и полная версия", onClick: () => openLocalFile(data.loyalty.file) },
        { label: "PDF-презентация", onClick: () => openLocalFile(data.loyalty.pdfFile) },
        { label: "Закрыть", variant: "secondary", onClick: closeModal }
      ]
    });
  }

  function openMissing(item) {
    openModal({
      kicker: "Файл не найден",
      title: item.missingTitle,
      content: `<p class="large-text">Чтобы карточка открывала материал, положите файл в папку <strong>${item.expectedFile}</strong> с этим именем.</p>`,
      actions: [{ label: "Понятно", variant: "secondary", onClick: closeModal }]
    });
  }

  function openDeadlines() {
    openModal({
      kicker: data.deadlines.kicker,
      title: data.deadlines.title,
      content: `
        <p class="large-text">${data.deadlines.intro}</p>
        <ul class="clean-list">${data.deadlines.items.map((item) => `<li>${item}</li>`).join("")}</ul>
      `,
      actions: [
        { label: "Методические указания", onClick: () => openLocalFile("method-guide.html") },
        { label: "Закрыть", variant: "secondary", onClick: closeModal }
      ]
    });
  }

  function handleMaterial(item) {
    if (item.type === "file") openLocalFile(item.file);
    if (item.type === "external") openExternal(item.url);
    if (item.type === "scripts") openScriptsModal();
    if (item.type === "disciplineMaps") openDisciplineMaps();
    if (item.type === "missing") openMissing(item);
    if (item.type === "dpo") openDpo();
    if (item.type === "masterPrep") openMasterPrep();
    if (item.type === "loyalty") openLoyalty();
  }

  topicList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-id]");
    if (!button) return;
    activeTheme = data.themes.find((theme) => theme.id === button.dataset.themeId) || activeTheme;
    renderTopics();
    renderHero();
  });

  faqList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-faq-index]");
    if (button) openFaqModal(Number(button.dataset.faqIndex));
  });

  materialsGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-material-index]");
    if (!button) return;
    handleMaterial(data.materials[Number(button.dataset.materialIndex)]);
  });

  document.querySelector("[data-open-theme]").addEventListener("click", () => openThemeModal());
  document.querySelector("[data-open-scripts]").addEventListener("click", () => openScriptsModal());
  document.querySelector("[data-show-all-faq]").addEventListener("click", () => openAllFaq());
  document.querySelector("[data-open-deadlines]").addEventListener("click", () => openDeadlines());
  document.querySelector("[data-close-modal]").addEventListener("click", closeModal);

  modalBackdrop.addEventListener("click", (event) => {
    if (event.target === modalBackdrop) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modalBackdrop.hidden) closeModal();
  });

  renderTopics();
  renderHero();
  renderFaq();
  renderMaterials();
})();
