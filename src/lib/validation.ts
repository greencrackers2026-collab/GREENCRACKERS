import { z } from "zod";

// Client-side validation for instant feedback. The database functions re-validate everything.

export const phoneSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=[6-9]\d{9}$)/, ""))
  .refine((s) => /^[6-9]\d{9}$/.test(s), "Enter a valid 10-digit Indian mobile number");

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode");

const optionalEmail = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((s) => (s ? s : undefined))
  .refine((s) => !s || z.string().email().safeParse(s).success, "Enter a valid email");

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: phoneSchema,
  email: optionalEmail,
  address1: z.string().trim().min(5, "Enter your address").max(160),
  address2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.string().trim().min(2, "Select your state").max(60),
  pincode: pincodeSchema,
  notes: z.string().trim().max(500).optional(),
});

export const quoteSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: phoneSchema,
  email: optionalEmail,
  city: z.string().trim().min(2, "Enter your city").max(60),
  items: z
    .array(z.object({ product: z.string().trim().min(1).max(120), qty: z.number().int().min(1).max(100000) }))
    .min(1, "Add at least one product")
    .max(30),
  message: z.string().trim().max(1000).optional(),
});

/** First error message per field, for forms. */
export function fieldErrors(error: z.ZodError) {
  const fe = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v?.[0]])) as Record<string, string | undefined>;
}
