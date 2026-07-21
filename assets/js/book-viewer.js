(function () {
  const params = new URLSearchParams(window.location.search);
  const config = window.PK_BOOKLETS_CONFIG || {};
  const bookletId = params.get("id") || params.get("booklet") || "bachelor";
  const booklet = config[bookletId] || config.bachelor;

  if (!booklet) {
    window.location.href = "index.html";
    return;
  }

  const pdfUrl = booklet.pdfUrl.startsWith("/") ? booklet.pdfUrl.slice(1) : booklet.pdfUrl;
  const redirectUrl = `pdf-viewer.html?file=${encodeURIComponent(pdfUrl)}&title=${encodeURIComponent(booklet.title)}&spread=1&zoom=100&return=index.html`;

  window.location.replace(redirectUrl);
})();
