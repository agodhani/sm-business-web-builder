import { z } from "zod";

const styleValueSchema: z.ZodType<string | number | Record<string, unknown>> = z.lazy(() =>
  z.union([z.string(), z.number(), z.record(z.string(), styleValueSchema)])
);

const cssTokenValue = z.union([z.string(), z.number()]);

export const styleSchema = z.object({
  version: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  colors: z.record(z.string(), z.string()),
  typography: z.record(z.string(), z.record(z.string(), cssTokenValue)),
  rounded: z.record(z.string(), cssTokenValue),
  spacing: z.record(z.string(), cssTokenValue),
  components: z.record(z.string(), z.record(z.string(), styleValueSchema))
});

export type StyleInput = z.infer<typeof styleSchema>;
