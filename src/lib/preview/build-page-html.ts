import type { GeneratedPageData, PageSection } from "../types/page-data";
import type { StyleDefinition } from "../types/style";
import { buildStylesheet } from "../styles/build-stylesheet";

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveImageSrc(imagePath: string, assetBasePath?: string): string {
  if (
    !assetBasePath ||
    imagePath.startsWith("/") ||
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return imagePath;
  }
  const fileName = imagePath.split("/").pop() ?? imagePath;
  return assetBasePath.includes("?asset=")
    ? `${assetBasePath}${encodeURIComponent(fileName)}`
    : `${assetBasePath.replace(/\/$/, "")}/${fileName}`;
}

function renderSection(section: PageSection, assetBasePath?: string): string {
  switch (section.type) {
    case "hero":
      return `<section data-section="hero">
${section.eyebrow ? `<p>${esc(section.eyebrow)}</p>` : ""}
<h1>${esc(section.headline)}</h1>
${section.subheadline ? `<p>${esc(section.subheadline)}</p>` : ""}
<div>
${section.primaryCta ? `<button type="button">${esc(section.primaryCta)}</button>` : ""}
${section.secondaryCta ? `<button type="button">${esc(section.secondaryCta)}</button>` : ""}
</div>
</section>`;

    case "services":
      return `<section data-section="services">
<h2>${esc(section.title)}</h2>
<ul>
${section.items.map((item) => `<li><h3>${esc(item.name)}</h3>${item.description ? `<p>${esc(item.description)}</p>` : ""}</li>`).join("\n")}
</ul>
</section>`;

    case "about":
      return `<section data-section="about">
<h2>${esc(section.title)}</h2>
<p>${esc(section.body)}</p>
</section>`;

    case "pricing":
      return `<section data-section="pricing">
<h2>${esc(section.title)}</h2>
<p>${esc(section.text)}</p>
</section>`;

    case "gallery":
      return `<section data-section="gallery">
<h2>${esc(section.title)}</h2>
<div>
${section.images
  .map(
    (img) =>
      `<figure><img src="${esc(resolveImageSrc(img.path, assetBasePath))}" alt="${esc(img.alt)}" /></figure>`
  )
  .join("\n")}
</div>
</section>`;

    case "contact":
      return `<section data-section="contact">
<h2>${esc(section.title)}</h2>
<p>${esc(section.phone)}</p>
<p>${esc(section.email)}</p>
<p>${esc(section.city)}, ${esc(section.state)}</p>
${section.fullAddress ? `<p>${esc(section.fullAddress)}</p>` : ""}
</section>`;

    case "footer":
      return `<footer data-section="footer">
<p>${esc(section.text)}</p>
</footer>`;

    default:
      return "";
  }
}

export function buildPageHtml(
  pageData: GeneratedPageData,
  style: StyleDefinition,
  assetBasePath?: string
): string {
  const stylesheet = buildStylesheet(style);
  const sectionsHtml = pageData.sections
    .map((section) => {
      const inner = renderSection(section, assetBasePath);
      return inner ? `<div class="generated-page-section">${inner}</div>` : "";
    })
    .filter(Boolean)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(pageData.site.businessName)}</title>
<style>
${stylesheet}
</style>
</head>
<body>
<article class="generated-page">
${sectionsHtml}
</article>
</body>
</html>`;
}
