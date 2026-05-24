export type StyleOption = {
  styleId: string;
  name: string;
  description: string;
  path: string;
};

export type WizardFormState = {
  projectName: string;
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  services: string[];
  phone: string;
  email: string;
  website: string;
  socialLinks: string;
  city: string;
  state: string;
  fullAddress: string;
  pricing: string;
  selectedImages: File[];
  styleId: string;
  preferences: string;
};

export type FieldErrors = Record<string, string>;
