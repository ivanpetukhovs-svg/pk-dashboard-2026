(function () {
  const officialData = window.METHOD_GUIDE_DATA || window.PK_METHOD_GUIDE;
  const teacherData = window.METHOD_GUIDE_TEACHER_DATA;
  const nav = document.querySelector("#teacherNav");
  const quick = document.querySelector("#teacherQuick");
  const content = document.querySelector("#teacherContent");
  const searchInput = document.querySelector("#teacherSearch");
  const modeWrap = document.querySelector("#teacherMode");
  const backButton = document.querySelector("[data-go-back]");

  if (!officialData || !teacherData || !Array.isArray(teacherData.sections)) return;

  const officialSections = new Map((officialData.sections || []).map((section) => [section.id, section]));
  const officialTables = new Map((officialData.sourceTables || []).map((table) => [table.id, table]));
  let mode = "brief";
  let query = "";

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function asArray(value) {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  function textForSearch(section) {
    return [
      section.title,
      section.group,
      section.summary,
      section.teacherScript,
      ...asArray(section.tags),
      ...asArray(section.important),
      ...asArray(section.referToAdmissions),
      ...asArray(section.cards).flatMap((card) => [card.title, ...asArray(card.items)])
    ].join(" ").toLowerCase();
  }

  function visibleSections() {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return teacherData.sections;
    return teacherData.sections.filter((section) => textForSearch(section).includes(normalized));
  }

  function renderQuick() {
    quick.innerHTML = asArray(teacherData.quickCards).map((item) => `
      <a href="#${escapeHtml(item.target)}">${escapeHtml(item.label)}</a>
    `).join("");
  }

  function renderNav() {
    const sections = visibleSections();
    const groups = [];
    sections.forEach((section) => {
      let group = groups.find((entry) => entry.title === section.group);
      if (!group) {
        group = { title: section.group || "Разделы", items: [] };
        groups.push(group);
      }
      group.items.push(section);
    });

    nav.innerHTML = groups.map((group) => `
      <div class="teacher-nav__group">
        <p>${escapeHtml(group.title)}</p>
        ${group.items.map((section) => `<a href="#${escapeHtml(section.id)}">${escapeHtml(section.title)}</a>`).join("")}
      </div>
    `).join("");
  }

  function renderList(items) {
    const list = asArray(items);
    if (!list.length) return "";
    return `<ul>${list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function renderTeacherCards(cards) {
    const list = asArray(cards);
    if (!list.length) return "";
    return `
      <div class="teacher-card-grid">
        ${list.map((card) => `
          <article class="teacher-card">
            <h4>${escapeHtml(card.title)}</h4>
            ${renderList(card.items)}
            ${card.link ? `<a class="teacher-card-link" href="${escapeHtml(card.link.url)}">${escapeHtml(card.link.label)}</a>` : ""}
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderSourceTable(table) {
    if (!table || !Array.isArray(table.rows) || !table.rows.length) return "";
    const head = asArray(table.rows[0]);
    const rows = table.rows.slice(1);
    return `
      <details class="teacher-official-table">
        <summary>${escapeHtml(table.title || "Официальная таблица")}</summary>
        <div class="teacher-table-wrap">
          <table>
            <thead>
              <tr>${head.map((cell) => `<th>${escapeHtml(cell || " ")}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows.map((row) => `
                <tr>${asArray(row).map((cell) => `<td>${escapeHtml(cell || " ")}</td>`).join("")}</tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </details>
    `;
  }

  function renderOfficialCard(card) {
    const tableIds = [
      ...asArray(card.sourceTable),
      ...asArray(card.sourceTables)
    ];
    const tables = tableIds.map((id) => renderSourceTable(officialTables.get(id))).join("");

    if (card.type === "table_ref" || card.type === "table_refs") return tables;

    const items = asArray(card.items || card.steps);
    return `
      <article class="teacher-official-card">
        <h4>${escapeHtml(card.title || "Официальная информация")}</h4>
        ${card.text ? `<p>${escapeHtml(card.text)}</p>` : ""}
        ${items.length ? renderList(items.map((item) => typeof item === "string" ? item : Object.values(item).join(" — "))) : ""}
        ${tables}
      </article>
    `;
  }

  function renderOfficialSection(sectionId) {
    const section = officialSections.get(sectionId);
    if (!section) return "";
    const raw = asArray(section.rawParagraphs);
    return `
      <details class="teacher-official-source">
        <summary>${escapeHtml(section.title)}</summary>
        ${section.summary ? `<p>${escapeHtml(section.summary)}</p>` : ""}
        ${renderList(section.critical)}
        <div class="teacher-official-cards">
          ${asArray(section.cards).map(renderOfficialCard).join("")}
        </div>
        ${raw.length ? `
          <details class="teacher-raw">
            <summary>Текстовые фрагменты из методички</summary>
            ${raw.map((item) => `<p>${escapeHtml(item.text || item)}</p>`).join("")}
          </details>
        ` : ""}
      </details>
    `;
  }

  function renderOfficialDetails(section) {
    const official = section.official || {};
    const sourceSections = asArray(official.sourceSections);
    const sourceTables = asArray(official.sourceTables);
    const missing = [
      ...sourceSections.filter((id) => !officialSections.has(id)).map((id) => `раздел ${id}`),
      ...sourceTables.filter((id) => !officialTables.has(id)).map((id) => `таблица ${id}`)
    ];

    return `
      <details class="teacher-official">
        <summary>${escapeHtml(official.title || "Полная официальная информация")}</summary>
        ${missing.length ? `<p class="teacher-audit-bad">Нужно проверить источники: ${escapeHtml(missing.join(", "))}</p>` : ""}
        ${sourceSections.map(renderOfficialSection).join("")}
        ${sourceTables.map((id) => renderSourceTable(officialTables.get(id))).join("")}
      </details>
    `;
  }

  function renderSection(section) {
    return `
      <section class="teacher-section" id="${escapeHtml(section.id)}" data-search="${escapeHtml(textForSearch(section))}">
        <div class="teacher-section__head">
          <span>${escapeHtml(section.group || "Раздел")}</span>
          <h3>${escapeHtml(section.title)}</h3>
        </div>

        <div class="teacher-panel" data-panel="brief">
          <h4>Кратко</h4>
          <p>${escapeHtml(section.summary)}</p>
          ${renderTeacherCards(section.cards)}
          ${section.important?.length ? `<div class="teacher-important"><b>Важно</b>${renderList(section.important)}</div>` : ""}
        </div>

        <div class="teacher-panel" data-panel="script">
          <h4>Что сказать абитуриенту</h4>
          <p>${escapeHtml(section.teacherScript)}</p>
          ${section.referToAdmissions?.length ? `<div class="teacher-refer"><b>Когда направить в приемную комиссию</b>${renderList(section.referToAdmissions)}</div>` : ""}
        </div>

        <div class="teacher-panel" data-panel="official">
          <h4>Полная официальная информация</h4>
          ${renderOfficialDetails(section)}
        </div>
      </section>
    `;
  }

  function applyMode() {
    document.body.dataset.teacherMode = mode;
    modeWrap.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.mode === mode);
    });
  }

  function renderContent() {
    const sections = visibleSections();
    content.innerHTML = sections.length
      ? sections.map(renderSection).join("")
      : `<section class="teacher-section"><h3>Ничего не найдено</h3><p>Попробуйте другой запрос.</p></section>`;
    renderNav();
    applyMode();
  }

  searchInput?.addEventListener("input", (event) => {
    query = event.target.value || "";
    renderContent();
  });

  modeWrap?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode]");
    if (!button) return;
    mode = button.dataset.mode;
    applyMode();
  });

  backButton?.addEventListener("click", () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "index.html";
  });

  renderQuick();
  renderContent();
})();
