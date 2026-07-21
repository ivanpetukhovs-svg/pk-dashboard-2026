(function () {
  const data = window.METHOD_GUIDE_DATA || window.PK_METHOD_GUIDE;
  const params = new URLSearchParams(window.location.search);
  const nav = document.querySelector("#methodNav");
  const hero = document.querySelector("#methodHero");
  const cards = document.querySelector("#methodCards");
  const pdfButton = document.querySelector("[data-open-method-pdf]");
  const backButton = document.querySelector("[data-go-back]");

  if (!data || !Array.isArray(data.sections) || !data.sections.length) return;

  const visibleSections = data.sections.filter((section) => section.id !== "source");
  const visibleNavigation = Array.isArray(data.navigation)
    ? data.navigation.filter((item) => item.id !== "source")
    : [];
  const tableById = new Map((data.sourceTables || []).map((table) => [table.id, table]));
  const requestedSectionId = params.get("section") || window.location.hash.replace("#", "");
  let active = visibleSections.find((section) => section.id === requestedSectionId) || visibleSections[0] || data.sections[0];

  const labelMap = {
    event: "Событие",
    budget: "Бюджет",
    paid: "Платное",
    quota_bvi: "Квоты / БВИ",
    level: "Уровень",
    basis: "Основание",
    deadline: "Срок",
    note: "Важно",
    name: "Название",
    meaning: "Что означает",
    term: "Термин",
  };

  const typeLabelMap = {
    date_matrix: "сроки",
    table_ref: "таблица",
    table_refs: "таблицы",
    checklist: "чек-лист",
    warning: "важно",
    rule: "правило",
    process: "процесс",
    term_grid: "термины",
    category_cards: "категории",
    concept: "понятие",
    example: "пример",
    full_text: "полный текст",
    raw_source: "источник",
    achievement_groups: "ИД",
    exam_schedule: "расписание",
    default: "раздел",
  };

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

  function getTable(id) {
    return tableById.get(id);
  }

  function renderNav() {
    const navigation = Array.isArray(data.navigation) && data.navigation.length
      ? visibleNavigation
      : visibleSections.map((section) => ({ id: section.id, title: section.title, group: "Разделы" }));

    const groups = [];
    navigation.forEach((item) => {
      let group = groups.find((entry) => entry.title === item.group);
      if (!group) {
        group = { title: item.group || "Разделы", items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });

    nav.innerHTML = groups.map((group) => `
      <div class="method-nav__group">
        <p class="method-nav__group-title">${escapeHtml(group.title)}</p>
        ${group.items.map((item) => `
          <button class="${item.id === active.id ? "is-active" : ""}" type="button" data-section-id="${escapeHtml(item.id)}">
            ${escapeHtml(item.title)}
          </button>
        `).join("")}
      </div>
    `).join("");
  }

  function renderHero() {
    const sectionNumber = String(visibleSections.findIndex((section) => section.id === active.id) + 1).padStart(2, "0");
    const highlights = active.id === visibleSections[0]?.id && data.hero?.highlights
      ? `<div class="method-hero__highlights">
          ${data.hero.highlights.map((item) => `
            <div>
              <b>${escapeHtml(item.label)}</b>
              <span>${escapeHtml(item.value)}</span>
            </div>
          `).join("")}
        </div>`
      : "";

    hero.innerHTML = `
      <p>${escapeHtml(sectionNumber)} раздел</p>
      <h2>${escapeHtml(active.title)}</h2>
      <span>${escapeHtml(active.summary || active.intro || data.hero?.lead || "")}</span>
      ${renderCritical(active.critical)}
      ${highlights}
    `;
  }

  function renderCritical(items) {
    const list = asArray(items);
    if (!list.length) return "";
    return `
      <div class="method-alerts">
        ${list.map((item) => `<div class="method-alert">${escapeHtml(item)}</div>`).join("")}
      </div>
    `;
  }

  function renderList(items, ordered = false) {
    const list = asArray(items);
    if (!list.length) return "";
    const tag = ordered ? "ol" : "ul";
    return `<${tag}>${list.map((item) => `<li>${escapeHtml(formatItem(item))}</li>`).join("")}</${tag}>`;
  }

  function formatItem(item) {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      return Object.entries(item)
        .map(([key, value]) => `${labelMap[key] || key}: ${value}`)
        .join("; ");
    }
    return item ?? "";
  }

  function renderObjectTable(items) {
    const rows = asArray(items);
    if (!rows.length) return "";
    const keys = Array.from(rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
      return set;
    }, new Set()));

    return `
      <div class="method-table-wrap">
        <table class="method-table">
          <thead>
            <tr>${keys.map((key) => `<th>${escapeHtml(labelMap[key] || key)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>${keys.map((key) => `<td>${escapeHtml(row?.[key] ?? "")}</td>`).join("")}</tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderSourceTable(table) {
    if (!table) return "";
    const rows = asArray(table.rows);
    if (!rows.length) return "";
    const head = rows[0] || [];
    const bodyRows = rows.slice(1);

    return `
      <details class="method-details" open>
        <summary>${escapeHtml(table.title || "Исходная таблица")}</summary>
        <div class="method-table-wrap">
          <table class="method-table method-table--source">
            <thead>
              <tr>${head.map((cell) => `<th>${escapeHtml(cell || " ")}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${bodyRows.map((row) => `
                <tr>${asArray(row).map((cell) => `<td>${escapeHtml(cell || " ")}</td>`).join("")}</tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </details>
    `;
  }

  function renderSourceTables(ids) {
    return asArray(ids).map((id) => renderSourceTable(getTable(id))).join("");
  }

  function cleanAchievementName(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isAchievementHeader(row) {
    const text = cleanAchievementName(asArray(row).join(" "));
    return !text || /^Наименование индивидуального достижения/i.test(text);
  }

  function getAchievementRows(card) {
    const rows = asArray(card.sourceTables || card.sourceTable)
      .flatMap((id) => asArray(getTable(id)?.rows))
      .filter((row) => !isAchievementHeader(row))
      .map((row) => {
        const cells = asArray(row).map(cleanAchievementName);
        return {
          name: cells[0] || "",
          condition: cells[1] || "",
          points: cells[2] || ""
        };
      })
      .filter((item) => item.name || item.condition || item.points);

    return mergeSplitAchievementRows(rows);
  }

  function achievementCategory(item) {
    const text = `${item.name} ${item.condition}`.toLowerCase();
    if (/аттестат|диплом|медал/.test(item.name.toLowerCase()) && /отлич|медал|образован/.test(text)) return "Документы об образовании";
    if (/гто|волонтер|доброволь|военн|служб|абилимпикс/.test(text)) return "Социальная, спортивная и служебная активность";
    if (/искусств|график|дизайн|журналист|иллюстрац|книжн|медиа|творч/.test(text)) return "Творческие конкурсы и олимпиады";
    if (/олимпиад|всероссийск.*школь|московская олимпиада|нто|я –профессионал|я – профессионал/.test(text)) return "Олимпиады";
    if (/хакатон|инженер|проект|конкурс|конференц|наука|робот|техно|судостро|транспорт|код будущего|паспорт/.test(text)) return "Проектные, инженерные и научные достижения";
    if (/публикац|стать|тезис|кандидат|рекомендательн|научн/.test(text)) return "Научная работа и публикации";
    if (/дополнительн|профессиональн|переподготов|портфолио|компетенц/.test(text)) return "ДПО, портфолио и компетенции";
    return "Другие достижения";
  }

  function mergeSplitAchievementRows(rows) {
    const result = [];
    const graphicDesignPrefix = "Международная олимпиада школьников «Искусство графики», профиль «Графический дизайн» поступающим на направление «Дизайн», образовательная программа «Графический дизайн мультимедиа» и «Технология";

    rows.forEach((item) => {
      if (
        item.name.startsWith("художественной обработки материалов»") &&
        item.condition.toLowerCase() === "участник" &&
        item.points === "3 балла"
      ) {
        const target = result.find((entry) => entry.name === graphicDesignPrefix);
        if (target) {
          target.name = `${graphicDesignPrefix} художественной обработки материалов», не использующим результаты участия в олимпиаде для получения особых прав и (или) особого преимущества в соответствии с разделом 2.3 настоящих Правил:`;
          target.conditions = target.conditions || [
            { condition: target.condition, points: target.points }
          ];
          target.conditions.push({ condition: item.condition, points: item.points });
          return;
        }
      }

      result.push(item);
    });

    return result.map((item) => {
      if (item.name === graphicDesignPrefix) {
        return {
          ...item,
          name: `${graphicDesignPrefix} художественной обработки материалов», не использующим результаты участия в олимпиаде для получения особых прав и (или) особого преимущества в соответствии с разделом 2.3 настоящих Правил:`
        };
      }
      return item;
    });
  }

  function normalizeAchievementName(name) {
    return cleanAchievementName(name)
      .replace(/[.:;]+$/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function groupAchievementItems(items) {
    const grouped = new Map();

    items.forEach((item) => {
      const key = normalizeAchievementName(item.name);
      if (!grouped.has(key)) {
        grouped.set(key, {
          name: item.name,
          conditions: []
        });
      }

      const entry = grouped.get(key);
      const conditions = item.conditions || [{ condition: item.condition, points: item.points }];
      conditions.forEach((condition) => {
        const exists = entry.conditions.some((current) =>
          current.condition === condition.condition && current.points === condition.points
        );
        if (!exists) entry.conditions.push(condition);
      });
    });

    return Array.from(grouped.values()).map((entry) => ({
      ...entry,
      conditions: entry.conditions.sort((left, right) => pointsValue(right.points) - pointsValue(left.points))
    }));
  }

  function pointsValue(value) {
    const match = String(value || "").match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function renderAchievementGroups(card) {
    const rows = getAchievementRows(card);
    if (!rows.length) return "";

    const groups = rows.reduce((acc, item) => {
      const title = achievementCategory(item);
      if (!acc.has(title)) acc.set(title, []);
      acc.get(title).push(item);
      return acc;
    }, new Map());

    return `
      <p class="method-note">Нажмите на категорию, чтобы раскрыть список достижений и посмотреть условия начисления баллов.</p>
      <div class="achievement-groups">
        ${Array.from(groups.entries()).map(([title, items]) => `
          ${(() => {
            const groupedItems = groupAchievementItems(items);
            return `
          <details class="achievement-group">
            <summary>
              <span>${escapeHtml(title)}</span>
              <b>${groupedItems.length}</b>
            </summary>
            <div class="achievement-list">
              ${groupedItems.map((item) => `
                <article class="achievement-row">
                  <div>
                    <h4>${escapeHtml(item.name)}</h4>
                    ${renderAchievementConditions(item.conditions)}
                  </div>
                </article>
              `).join("")}
            </div>
          </details>
            `;
          })()}
        `).join("")}
      </div>
    `;
  }

  function renderAchievementConditions(conditions) {
    const rows = asArray(conditions).filter((item) => item.condition || item.points);
    if (!rows.length) return "";
    if (rows.length === 1) {
      return `
        <div class="achievement-condition">
          ${rows[0].condition ? `<p>${escapeHtml(rows[0].condition)}</p>` : ""}
          ${rows[0].points ? `<strong>${escapeHtml(rows[0].points)}</strong>` : ""}
        </div>
      `;
    }
    return `
      <div class="achievement-condition-list">
        ${rows.map((row) => `
          <div class="achievement-condition">
            ${row.condition ? `<p>${escapeHtml(row.condition)}</p>` : ""}
            ${row.points ? `<strong>${escapeHtml(row.points)}</strong>` : ""}
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderTermGrid(items) {
    const rows = asArray(items);
    if (!rows.length) return "";
    return `
      <div class="term-grid">
        ${rows.map((item) => `
          <div class="term-item">
            <b>${escapeHtml(item.term || item.name || "")}</b>
            <span>${escapeHtml(item.meaning || item.value || "")}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderCategoryCards(items) {
    const rows = asArray(items);
    if (!rows.length) return "";
    return `
      <div class="category-grid">
        ${rows.map((item) => `
          <section>
            <h4>${escapeHtml(item.name || item.title || "")}</h4>
            <p>${escapeHtml(item.meaning || item.text || "")}</p>
          </section>
        `).join("")}
      </div>
    `;
  }

  function methodReturnUrl() {
    return "method-guide.html?section=exams";
  }

  function pdfUrl(doc) {
    return `pdf-viewer.html?file=${encodeURIComponent(doc.file)}&title=${encodeURIComponent(doc.title)}&return=${encodeURIComponent(methodReturnUrl())}`;
  }

  function renderExamSchedule(card) {
    const schedule = window.PK_EXAM_SCHEDULE_DATA;
    if (!schedule || !Array.isArray(schedule.sections)) {
      return `<p>${escapeHtml(card.text || "")}</p>`;
    }

    const fullScheduleUrl = `exam-schedule.html?return=${encodeURIComponent(methodReturnUrl())}`;

    return `
      <p class="exam-schedule-intro">${escapeHtml(card.text || "")}</p>
      <div class="exam-guide-actions">
        <a class="method-card-link" href="${escapeHtml(fullScheduleUrl)}">Открыть полную страницу расписания</a>
        <a class="method-card-link method-card-link--light" href="${escapeHtml(schedule.sourceUrl)}" target="_blank" rel="noopener noreferrer">Официальная страница ВИ</a>
      </div>
      <div class="embedded-schedule">
        ${schedule.sections.map((section, index) => `
          <details class="embedded-schedule__level" ${index === 0 ? "open" : ""}>
            <summary>
              <span>${escapeHtml(section.number)}</span>
              <div>
                <strong>${escapeHtml(section.title)}</strong>
                <small>${escapeHtml(section.subtitle || "")}</small>
              </div>
            </summary>
            <div class="embedded-schedule__body">
              ${renderExamReference(section.id)}
              <p>${escapeHtml(section.lead || "")}</p>
              ${section.flows ? renderEmbeddedFlows(section.flows) : renderEmbeddedGroups(section.groups, schedule.sourceUrl)}
            </div>
          </details>
        `).join("")}
      </div>
    `;
  }

  function examReferenceTableId(sectionId) {
    return {
      bachelor: "source_table_18",
      master: "source_table_19",
      postgraduate: "source_table_20",
    }[sectionId];
  }

  function renderExamReference(sectionId) {
    const rows = asArray(getTable(examReferenceTableId(sectionId))?.rows)
      .slice(1)
      .map((row) => cleanAchievementName(asArray(row).join(" ")))
      .filter(Boolean);

    if (!rows.length) return "";
    return `
      <div class="embedded-exam-reference">
        <p>Виды испытаний</p>
        <div>
          ${rows.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        </div>
      </div>
    `;
  }

  function renderEmbeddedFlows(flows) {
    return `
      <div class="embedded-flow-grid">
        ${asArray(flows).map((flow) => `
          <article class="embedded-flow">
            <div>
              <b>${escapeHtml(flow.title)}</b>
              <span>${escapeHtml(flow.dates)}</span>
            </div>
            <div>
              ${asArray(flow.docs).map((doc) => `<a href="${escapeHtml(pdfUrl(doc))}">${escapeHtml(doc.label)}</a>`).join("")}
            </div>
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderEmbeddedGroups(groups, sourceUrl) {
    return `
      <div class="embedded-groups">
        ${asArray(groups).map((group) => `<span>${escapeHtml(group)}</span>`).join("")}
      </div>
      <a class="method-card-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Программы ВИ на сайте</a>
    `;
  }

  function renderParagraphRanges(ranges) {
    const paragraphs = [];
    asArray(ranges).forEach((range) => {
      const from = Number(range.from ?? range.start ?? 0);
      const to = Number(range.to ?? range.end ?? from);
      data.rawParagraphsAll.slice(from, to + 1).forEach((paragraph) => {
        if (paragraph) paragraphs.push(paragraph);
      });
    });
    if (!paragraphs.length) return "";
    return `
      <details class="method-details">
        <summary>Полный текст раздела</summary>
        <div class="raw-paragraphs">
          ${paragraphs.map((paragraph) => `<p>${escapeHtml(formatParagraph(paragraph))}</p>`).join("")}
        </div>
      </details>
    `;
  }

  function formatParagraph(paragraph) {
    if (typeof paragraph === "string") return paragraph;
    if (paragraph && typeof paragraph === "object") {
      return paragraph.text || paragraph.value || paragraph.title || "";
    }
    return "";
  }

  function renderCardBody(card) {
    if (card.type === "date_matrix") {
      return renderObjectTable(card.items) + renderSourceTables(card.sourceTable);
    }
    if (card.type === "table_ref") {
      return renderSourceTables(card.sourceTable);
    }
    if (card.type === "table_refs") {
      return renderSourceTables(card.sourceTables);
    }
    if (card.type === "term_grid") {
      return renderTermGrid(card.items) + renderSourceTables(card.sourceTable);
    }
    if (card.type === "category_cards") {
      return renderCategoryCards(card.items);
    }
    if (card.type === "process") {
      return renderList(card.steps, true);
    }
    if (card.type === "achievement_groups") {
      return renderAchievementGroups(card);
    }
    if (card.type === "exam_schedule") {
      return renderExamSchedule(card);
    }
    if (card.type === "warning" || card.type === "rule" || card.type === "concept") {
      return `<p>${escapeHtml(card.text || "")}</p>${card.link ? `<a class="method-card-link" href="${escapeHtml(card.link.url)}">${escapeHtml(card.link.label)}</a>` : ""}`;
    }
    if (card.type === "full_text") {
      return renderParagraphRanges(card.paragraphRanges);
    }
    if (card.type === "raw_source") {
      if (card.sourceTables) return renderSourceTables(card.sourceTables);
      return renderParagraphRanges([{ from: 0, to: (data.rawParagraphsAll || []).length - 1 }]);
    }
    if (card.items) return renderList(card.items);
    if (card.text) return `<p>${escapeHtml(card.text)}</p>`;
    return "";
  }

  function renderCards() {
    cards.innerHTML = active.cards.map((card) => `
      <article class="method-card" data-type="${escapeHtml(card.type || "default")}">
        <div class="method-card__head">
          <span>${escapeHtml(typeLabelMap[card.type] || typeLabelMap.default)}</span>
          <h3>${escapeHtml(card.title)}</h3>
        </div>
        <div class="method-card__body">
          ${renderCardBody(card)}
        </div>
      </article>
    `).join("");
  }

  function renderContent() {
    renderHero();
    renderCards();
  }

  nav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-section-id]");
    if (!button) return;
    active = visibleSections.find((section) => section.id === button.dataset.sectionId) || active;
    renderNav();
    renderContent();
    window.history.replaceState(null, "", `method-guide.html?section=${encodeURIComponent(active.id)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  pdfButton?.addEventListener("click", () => {
    const pdf = data.pdf || "pdf-viewer.html?file=docs/Metodichka_PK_2026.pdf&title=Методические%20указания%20ПК%202026&return=method-guide.html&spread=1";
    window.location.href = pdf;
  });

  backButton?.addEventListener("click", () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "index.html";
  });

  renderNav();
  renderContent();
})();
