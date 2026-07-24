(function () {
  const params = new URLSearchParams(window.location.search);
  const requestedFile = params.get("file") || "docs/Metodichka_PK_2026.pdf";
  const title = params.get("title") || "Документ";
  const returnUrl = params.get("return");
  const spreadMode = params.get("spread") === "1";
  const zoom = params.get("zoom");
  const pdfTitle = document.querySelector("#pdfTitle");
  const object = document.querySelector("#pdfObject");
  const fallback = document.querySelector("#pdfFallback");
  const directLink = document.querySelector("#pdfOpenDirect");
  const mobileBookletFiles = {
    "buklets/Buklet_26_01_2026_B_S_book_spreads.pdf": "buklets/mobile/Buklet_26_01_2026_B_S_book_spreads_compressed.pdf",
    "buklets/Buklet_magistratura_book_spreads.pdf": "buklets/mobile/Buklet_magistratura_book_spreads_compressed.pdf"
  };
  const isMobile = window.matchMedia("(max-width: 900px)").matches;
  const file = isMobile ? (mobileBookletFiles[requestedFile] || requestedFile) : requestedFile;
  const backButton = document.querySelector("[data-go-back]");
  const pdfOpenParams = spreadMode ? `#page=1&zoom=${encodeURIComponent(zoom || "page-fit")}&pagelayout=TwoPageRight&pagemode=none&navpanes=0` : "";
  const viewerFile = file.includes("#") ? file : `${file}${pdfOpenParams}`;

  if (spreadMode) document.body.classList.add("viewer-page--spread");

  document.title = `${title} | Московский Политех`;
  pdfTitle.textContent = title;
  object.data = viewerFile;
  fallback.href = viewerFile;
  directLink.href = file;

  backButton?.addEventListener("click", () => {
    if (returnUrl) window.location.href = returnUrl;
    else if (window.history.length > 1) window.history.back();
    else window.location.href = "index.html";
  });
})();
