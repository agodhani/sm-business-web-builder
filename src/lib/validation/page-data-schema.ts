import { z } from "zod";

const nonEmptyText = z.string().trim().min(1);

const heroSchema = z.object({
  type: z.literal("hero"),
  eyebrow: nonEmptyText.optional(),
  headline: nonEmptyText,
  subheadline: nonEmptyText.optional(),
  primaryCta: nonEmptyText.optional(),
  secondaryCta: nonEmptyText.optional()
});

const servicesSchema = z.object({
  type: z.literal("services"),
  title: nonEmptyText,
  items: z
    .array(
      z.object({
        name: nonEmptyText,
        description: nonEmptyText.optional()
      })
    )
    .min(1)
});

const aboutSchema = z.object({
  type: z.literal("about"),
  title: nonEmptyText,
  body: nonEmptyText
});

const pricingSchema = z.object({
  type: z.literal("pricing"),
  title: nonEmptyText,
  text: nonEmptyText
});

const gallerySchema = z.object({
  type: z.literal("gallery"),
  title: nonEmptyText,
  images: z
    .array(
      z.object({
        alt: nonEmptyText,
        path: nonEmptyText
      })
    )
    .min(1)
});

const contactSchema = z.object({
  type: z.literal("contact"),
  title: nonEmptyText,
  phone: nonEmptyText,
  email: z.string().trim().email(),
  city: nonEmptyText,
  state: nonEmptyText,
  fullAddress: nonEmptyText.optional()
});

const footerSchema = z.object({
  type: z.literal("footer"),
  text: nonEmptyText
});

const sectionSchema = z.discriminatedUnion("type", [
  heroSchema,
  servicesSchema,
  aboutSchema,
  pricingSchema,
  gallerySchema,
  contactSchema,
  footerSchema
]);

export const pageDataSchema = z
  .object({
    site: z.object({
      projectName: nonEmptyText,
      businessName: nonEmptyText,
      category: nonEmptyText,
      styleId: nonEmptyText
    }),
    theme: z.object({
      styleId: nonEmptyText
    }),
    sections: z.array(sectionSchema).min(2)
  })
  .superRefine((value, ctx) => {
    const types = value.sections.map((section) => section.type);
    const first = types[0];
    const last = types[types.length - 1];
    const footerIndex = types.lastIndexOf("footer");
    const contactIndex = types.indexOf("contact");

    if (first !== "hero") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "hero must be the first section",
        path: ["sections", 0]
      });
    }

    if (last !== "footer") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "footer must be the last section",
        path: ["sections", types.length - 1]
      });
    }

    if (contactIndex !== -1 && footerIndex !== -1 && contactIndex > footerIndex) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "contact must appear before footer",
        path: ["sections", contactIndex]
      });
    }
  });

export type PageDataInput = z.infer<typeof pageDataSchema>;
