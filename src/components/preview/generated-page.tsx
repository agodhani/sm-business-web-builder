import type { CSSProperties } from "react";
import type { GeneratedPageData, PageSection } from "../../lib/types/page-data";
import type { StyleDefinition } from "../../lib/types/style";
import { AboutSectionView } from "./sections/about-section";
import { ContactSectionView } from "./sections/contact-section";
import { FooterSectionView } from "./sections/footer-section";
import { GallerySectionView } from "./sections/gallery-section";
import { HeroSectionView } from "./sections/hero-section";
import { PricingSectionView } from "./sections/pricing-section";
import { ServicesSectionView } from "./sections/services-section";

type GeneratedPageProps = {
  pageData: GeneratedPageData;
  style: StyleDefinition;
  assetBasePath?: string;
};

function toCssValue(value: string | number | undefined, fallback: string): string {
  if (value === undefined) {
    return fallback;
  }
  return typeof value === "number" ? `${value}px` : value;
}

function renderSection(section: PageSection, assetBasePath?: string) {
  switch (section.type) {
    case "hero":
      return <HeroSectionView section={section} />;
    case "services":
      return <ServicesSectionView section={section} />;
    case "about":
      return <AboutSectionView section={section} />;
    case "pricing":
      return <PricingSectionView section={section} />;
    case "gallery":
      return <GallerySectionView section={section} assetBasePath={assetBasePath} />;
    case "contact":
      return <ContactSectionView section={section} />;
    case "footer":
      return <FooterSectionView section={section} />;
    default:
      return null;
  }
}

export function GeneratedPage({ pageData, style, assetBasePath }: GeneratedPageProps) {
  const palette = style.colors;
  const bodyTypography = style.typography["body"] ?? {};
  const sectionSpacing = toCssValue(style.spacing["section"], "64px");
  const cardRounded = toCssValue(style.rounded["md"], "12px");
  const containerStyle: CSSProperties = {
    backgroundColor: palette.canvas ?? "#ffffff",
    color: palette.body ?? palette.ink ?? "#111",
    fontFamily:
      typeof bodyTypography.fontFamily === "string"
        ? bodyTypography.fontFamily
        : "system-ui, -apple-system, sans-serif",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "32px 16px"
  };

  const sectionStyle: CSSProperties = {
    padding: `0 0 ${sectionSpacing}`,
    borderBottom: `1px solid ${palette["divider-soft"] ?? "#eceff4"}`
  };

  const cardStyle: CSSProperties = {
    borderRadius: cardRounded
  };

  return (
    <article className="generated-page" style={containerStyle}>
      {pageData.sections.map((section, index) => (
        <div
          key={`${section.type}-${index}`}
          className="generated-page-section"
          style={section.type === "footer" ? cardStyle : sectionStyle}
        >
          {renderSection(section, assetBasePath)}
        </div>
      ))}
    </article>
  );
}
