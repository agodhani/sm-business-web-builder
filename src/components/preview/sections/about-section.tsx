import type { AboutSection } from "../../../lib/types/page-data";

type AboutSectionProps = {
  section: AboutSection;
};

export function AboutSectionView({ section }: AboutSectionProps) {
  return (
    <section data-section="about">
      <h2>{section.title}</h2>
      <p>{section.body}</p>
    </section>
  );
}
