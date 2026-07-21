(function () {
  const data = window.PK_ADMISSION_NUMBERS;
  if (!data) return;

  const grid = document.querySelector("#admissionDocGrid");
  const backButton = document.querySelector("[data-go-back]");

  const documentMeta = {
    seats: {
      label: "Количество мест",
      text: "Бюджетные и платные места по программам и формам обучения.",
      marker: "места"
    },
    scores: {
      label: "Минимальные баллы",
      text: "Минимальные баллы, подтверждающие успешное прохождение вступительных испытаний.",
      marker: "баллы"
    },
    creativeScores: {
      label: "Минимальный балл по творческому направлению",
      text: "Отдельные минимумы для творческих направлений и специальных вступительных испытаний.",
      marker: "творчество"
    },
    costs: {
      label: "Стоимость обучения",
      text: "Стоимость первого курса обучения по программам и формам.",
      marker: "рубли"
    }
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function viewerUrl(source, title) {
    return `pdf-viewer.html?file=${encodeURIComponent(source.file)}&title=${encodeURIComponent(title)}`;
  }

  function renderDocuments() {
    grid.innerHTML = data.sources.map((source, index) => {
      const meta = documentMeta[source.id] || {
        label: source.title,
        text: "Официальный PDF-файл приемной кампании.",
        marker: "PDF"
      };
      const title = meta.label;

      return `
        <article class="admission-doc-card">
          <div class="admission-doc-card__top">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <b>${escapeHtml(meta.marker)}</b>
          </div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(meta.text)}</p>
          <a href="${escapeHtml(viewerUrl(source, title))}">Открыть файл</a>
        </article>
      `;
    }).join("");
  }

  backButton?.addEventListener("click", () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "index.html";
  });

  renderDocuments();
})();
