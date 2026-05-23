export type ContactInput = {
  phone: string;
  email: string;
  website?: string;
  socialLinks?: string[];
};

export type LocationInput = {
  city: string;
  state: string;
  fullAddress?: string;
};

export type ImageInput = {
  fileName: string;
  sourcePath: string;
  mimeType?: string;
};

export type WizardInput = {
  projectName?: string;
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  services: string[];
  contact: ContactInput;
  location: LocationInput;
  pricing?: string;
  images?: ImageInput[];
  styleId: string;
  preferences?: string;
};
