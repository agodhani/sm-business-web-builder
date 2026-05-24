import type { StyleDefinition, StyleValue } from "../types/style";

function toStyleString(value: StyleValue | undefined, fallback: string): string {
  if (value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number") return `${value}px`;
  return fallback;
}

export function buildStylesheet(style: StyleDefinition): string {
  const c = style.colors;
  const t = style.typography;
  const s = style.spacing;
  const r = style.rounded;

  const body = t["body"] ?? t["body-md"] ?? t["body-sm"] ?? {};
  const displayXl = t["display-xl"] ?? t["display-lg"] ?? t["display-md"] ?? {};
  const displayLg = t["display-lg"] ?? t["display-md"] ?? t["display-sm"] ?? {};
  const titleMd = t["title-md"] ?? t["title-sm"] ?? t["body-md"] ?? {};
  const captionTypo = t["label-sm"] ?? t["caption"] ?? t["body-sm"] ?? {};

  const canvas = c["canvas"] ?? "#ffffff";
  const bodyColor = c["body"] ?? c["ink"] ?? "#222222";
  const ink = c["ink"] ?? c["body"] ?? "#222222";
  const muted = c["muted"] ?? c["muted-soft"] ?? "#666666";
  const primary = c["primary"] ?? "#0066cc";
  const onPrimary = c["on-primary"] ?? "#ffffff";
  const surface = c["surface-card"] ?? c["surface-soft"] ?? c["surface-strong"] ?? "#f5f5f5";
  const divider = c["divider-soft"] ?? c["hairline-soft"] ?? c["hairline"] ?? "#eeeeee";

  const sectionSpacing = toStyleString(s["section"], "64px");
  const cardRadius = toStyleString(r["md"] ?? r["lg"] ?? r["sm"], "8px");
  const buttonRadius = toStyleString(r["sm"] ?? r["md"], "6px");

  const bodyFontFamily = toStyleString(
    body["fontFamily"],
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  );
  const bodyFontSize = toStyleString(body["fontSize"], "16px");
  const bodyLineHeight = toStyleString(body["lineHeight"], "1.5");

  const h1FontFamily = toStyleString(displayXl["fontFamily"], bodyFontFamily);
  const h1FontSize = toStyleString(displayXl["fontSize"], "40px");
  const h1FontWeight = toStyleString(displayXl["fontWeight"], "700");
  const h1LineHeight = toStyleString(displayXl["lineHeight"], "1.15");
  const h1LetterSpacing = toStyleString(displayXl["letterSpacing"], "0");

  const h2FontFamily = toStyleString(displayLg["fontFamily"], bodyFontFamily);
  const h2FontSize = toStyleString(displayLg["fontSize"], "28px");
  const h2FontWeight = toStyleString(displayLg["fontWeight"], "600");
  const h2LineHeight = toStyleString(displayLg["lineHeight"], "1.3");

  const h3FontFamily = toStyleString(titleMd["fontFamily"], bodyFontFamily);
  const h3FontSize = toStyleString(titleMd["fontSize"], "18px");
  const h3FontWeight = toStyleString(titleMd["fontWeight"], "600");

  const captionFontSize = toStyleString(captionTypo["fontSize"], "14px");

  return `
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background-color: ${canvas};
  color: ${bodyColor};
  font-family: ${bodyFontFamily};
  font-size: ${bodyFontSize};
  line-height: ${bodyLineHeight};
}

.generated-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 24px;
}

.generated-page-section {
  padding-bottom: ${sectionSpacing};
  border-bottom: 1px solid ${divider};
  margin-bottom: ${sectionSpacing};
}

[data-section] h1 {
  font-family: ${h1FontFamily};
  font-size: ${h1FontSize};
  font-weight: ${h1FontWeight};
  line-height: ${h1LineHeight};
  letter-spacing: ${h1LetterSpacing};
  color: ${ink};
  margin: 0 0 16px;
}
[data-section] h2 {
  font-family: ${h2FontFamily};
  font-size: ${h2FontSize};
  font-weight: ${h2FontWeight};
  line-height: ${h2LineHeight};
  color: ${ink};
  margin: 0 0 24px;
}
[data-section] h3 {
  font-family: ${h3FontFamily};
  font-size: ${h3FontSize};
  font-weight: ${h3FontWeight};
  color: ${ink};
  margin: 0 0 8px;
}
[data-section] p {
  color: ${bodyColor};
  margin: 0 0 12px;
}
[data-section] ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

[data-section="hero"] {
  padding: 60px 0 40px;
}
[data-section="hero"] h1 {
  max-width: 720px;
}
[data-section="hero"] > div {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 24px;
}
[data-section="hero"] button {
  background-color: ${primary};
  color: ${onPrimary};
  border: none;
  border-radius: ${buttonRadius};
  padding: 14px 28px;
  font-family: ${bodyFontFamily};
  font-size: ${bodyFontSize};
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
[data-section="hero"] button:hover { opacity: 0.88; }
[data-section="hero"] > div button:not(:first-child) {
  background-color: transparent;
  color: ${primary};
  border: 1.5px solid ${primary};
}

[data-section="services"] ul {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
[data-section="services"] li {
  background: ${surface};
  border-radius: ${cardRadius};
  padding: 20px 24px;
}

[data-section="about"] p {
  max-width: 640px;
}

[data-section="gallery"] > div {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
[data-section="gallery"] figure {
  margin: 0;
  overflow: hidden;
  border-radius: ${cardRadius};
  background: ${surface};
}
[data-section="gallery"] img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

[data-section="footer"] {
  padding: 32px;
  text-align: center;
  background: ${surface};
  border-radius: ${cardRadius};
}
[data-section="footer"] p {
  color: ${muted};
  margin: 0;
  font-size: ${captionFontSize};
}
`.trim();
}
