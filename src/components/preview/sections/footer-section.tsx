import type { FooterSection } from "../../../lib/types/page-data";

type FooterSectionProps = {
  section: FooterSection;
};

export function FooterSectionView({ section }: FooterSectionProps) {
  return (
    <footer data-section="footer">
      <p>{section.text}</p>
    </footer>
  );
}
