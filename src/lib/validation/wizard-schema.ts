import { z } from "zod";

const nonEmptyText = z.string().trim().min(1);

const optionalText = z
  .string()
  .trim()
  .optional()
  .or(z.literal("").transform(() => undefined));

export const imageInputSchema = z.object({
  fileName: nonEmptyText,
  sourcePath: nonEmptyText,
  mimeType: optionalText
});

export const wizardSchema = z.object({
  projectName: optionalText,
  businessName: nonEmptyText,
  businessCategory: nonEmptyText,
  businessDescription: nonEmptyText,
  services: z.array(nonEmptyText).min(1),
  contact: z.object({
    phone: nonEmptyText,
    email: z.string().trim().email(),
    website: optionalText,
    socialLinks: z.array(z.string().trim().min(1)).optional()
  }),
  location: z.object({
    city: nonEmptyText,
    state: nonEmptyText,
    fullAddress: optionalText
  }),
  pricing: optionalText,
  images: z.array(imageInputSchema).optional(),
  styleId: nonEmptyText,
  preferences: optionalText
});

export type WizardInput = z.infer<typeof wizardSchema>;
