/**
 * Design-concept disclaimer banner.
 *
 * Loaded into every published redesign by publish.py so anyone viewing the
 * live URL immediately sees that it's a concept demo, not the real site.
 *
 * Optional overrides on the <script> tag:
 *   <script src="banner.js" data-brand="Juganu" data-credit="oneofus.in"></script>
 */
(function () {
  if (document.getElementById("design-concept-banner")) return;

  const script = document.currentScript;
  const fallbackBrand = (document.title || "this brand")
    .split(/[|–—\-:·•]/)[0]
    .trim() || "this brand";
  const brand = (script && script.dataset.brand) || fallbackBrand;
  const credit = (script && script.dataset.credit) || "oneofus.in";

  const banner = document.createElement("div");
  banner.id = "design-concept-banner";
  banner.setAttribute("role", "note");
  banner.setAttribute("aria-label", "Design concept disclaimer");
  banner.style.cssText = [
    "position:fixed",
    "left:0",
    "right:0",
    "bottom:0",
    "z-index:2147483647",
    "width:100%",
    "box-sizing:border-box",
    "padding:8px 16px",
    "text-align:center",
    "background:#111",
    "color:#fff",
    "font:500 13px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
    "letter-spacing:.01em",
    "border-top:1px solid rgba(255,255,255,.15)",
    "pointer-events:auto",
  ].join(";");
  banner.innerHTML =
    'Design concept — not affiliated with <strong>' +
    escapeHtml(brand) +
    "</strong>. Built by " +
    escapeHtml(credit) +
    ".";

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c];
    });
  }

  function inject() {
    if (!document.body || document.getElementById("design-concept-banner")) return;
    document.body.appendChild(banner);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
