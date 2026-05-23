import type { HeroSection } from "../../../lib/types/page-data";

type HeroSectionProps = {
  section: HeroSection;
};

export function HeroSectionView({ section }: HeroSectionProps) {
  return (
    <section data-section="hero">
      {section.eyebrow ? <p>{section.eyebrow}</p> : null}
      <h1>{section.headline}</h1>
      {section.subheadline ? <p>{section.subheadline}</p> : null}
      <div>
        {section.primaryCta ? <button type="button">{section.primaryCta}</button> : null}
        {section.secondaryCta ? <button type="button">{section.secondaryCta}</button> : null}
      </div>
    </section>
  );
}
