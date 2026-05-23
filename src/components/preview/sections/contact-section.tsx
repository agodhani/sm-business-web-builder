import type { ContactSection } from "../../../lib/types/page-data";

type ContactSectionProps = {
  section: ContactSection;
};

export function ContactSectionView({ section }: ContactSectionProps) {
  return (
    <section data-section="contact">
      <h2>{section.title}</h2>
      <p>{section.phone}</p>
      <p>{section.email}</p>
      <p>
        {section.city}, {section.state}
      </p>
      {section.fullAddress ? <p>{section.fullAddress}</p> : null}
    </section>
  );
}
