import type { ServicesSection } from "../../../lib/types/page-data";

type ServicesSectionProps = {
  section: ServicesSection;
};

export function ServicesSectionView({ section }: ServicesSectionProps) {
  return (
    <section data-section="services">
      <h2>{section.title}</h2>
      <ul>
        {section.items.map((item) => (
          <li key={item.name}>
            <h3>{item.name}</h3>
            {item.description ? <p>{item.description}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
