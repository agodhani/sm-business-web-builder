export type SectionType =
  | "hero"
  | "services"
  | "about"
  | "pricing"
  | "gallery"
  | "contact"
  | "footer";

export type HeroSection = {
  type: "hero";
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  primaryCta?: string;
  secondaryCta?: string;
};

export type ServicesSection = {
  type: "services";
  title: string;
  items: Array<{
    name: string;
    description?: string;
  }>;
};

export type AboutSection = {
  type: "about";
  title: string;
  body: string;
};

export type PricingSection = {
  type: "pricing";
  title: string;
  text: string;
};

export type GallerySection = {
  type: "gallery";
  title: string;
  images: Array<{
    alt: string;
    path: string;
  }>;
};

export type ContactSection = {
  type: "contact";
  title: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  fullAddress?: string;
};

export type FooterSection = {
  type: "footer";
  text: string;
};

export type PageSection =
  | HeroSection
  | ServicesSection
  | AboutSection
  | PricingSection
  | GallerySection
  | ContactSection
  | FooterSection;

export type GeneratedPageData = {
  site: {
    projectName: string;
    businessName: string;
    category: string;
    styleId: string;
  };
  theme: {
    styleId: string;
  };
  sections: PageSection[];
};
