import { z } from "zod";

export const ServiceSchema = z.object({
  id: z.string().min(1).optional(), // auto-create if missing
  title: z.string().min(2),
  price: z.number().nonnegative(),
  category: z.string().min(1),
  vendor: z.string().min(1),
  rating: z.number().min(0).max(5).optional().default(0),
  isFeatured: z.boolean().optional().default(false),
  description: z.string().optional(),
  tenantId: z.string().optional(), // will be enforced from req.tenant
  tags: z.array(z.string()).optional().default([]),
});

export const VendorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  kycStatus: z.enum(["pending", "approved", "rejected"]).default("pending"),
  contactEmail: z.string().email(),
  categories: z.array(z.string()).optional().default([]),
  tenantId: z.string().optional(),
});
