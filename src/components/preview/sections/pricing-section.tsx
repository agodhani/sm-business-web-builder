import type { PricingSection } from "../../../lib/types/page-data";

type PricingSectionProps = {
  section: PricingSection;
};

export function PricingSectionView({ section }: PricingSectionProps) {
  return (
    <section data-section="pricing">
      <h2>{section.title}</h2>
      <p>{section.text}</p>
    </section>
  );
}
