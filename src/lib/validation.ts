import { z } from "zod";

export const cartLineSchema = z.object({
  kind: z.enum(["PRODUCT", "COMBO"]),
  id: z.string().min(1).max(64),
  qty: z.number().int().min(1).max(10000),
});
export type CartLineInput = z.infer<typeof cartLineSchema>;

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
  lines: z.array(cartLineSchema).min(1, "Your cart is empty").max(50),
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: phoneSchema,
  email: optionalEmail,
  address1: z.string().trim().min(5, "Enter your address").max(160),
  address2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.string().trim().min(2, "Select your state").max(60),
  pincode: pincodeSchema,
  notes: z.string().trim().max(500).optional(),
  couponCode: z.string().trim().max(30).optional(),
  deliveryMode: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
  paymentMethod: z.enum(["RAZORPAY", "UPI", "COD"]),
  upiRef: z.string().trim().max(40).optional(),
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
