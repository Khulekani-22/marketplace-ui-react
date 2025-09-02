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
  ownerUid: z.string().optional(),
  phone: z.string().optional().default(""),
  website: z.string().optional().default(""),
  description: z.string().optional().default(""),
  logoUrl: z.string().optional().default(""),
  bannerUrl: z.string().optional().default(""),
  country: z.string().optional().default(""),
  city: z.string().optional().default(""),
  addressLine: z.string().optional().default(""),
  socials: z
    .object({
      twitter: z.string().optional().default(""),
      linkedin: z.string().optional().default(""),
      facebook: z.string().optional().default(""),
      instagram: z.string().optional().default(""),
      youtube: z.string().optional().default(""),
      github: z.string().optional().default(""),
    })
    .optional()
    .default({}),
  categories: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  foundedYear: z.string().optional().default(""),
  teamSize: z.string().optional().default(""),
  registrationNo: z.string().optional().default(""),
  status: z.enum(["active", "pending", "suspended"]).optional().default("pending"),
  tenantId: z.string().optional(),
});

export const StartupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  elevatorPitch: z.string().optional().default(""),
  productsServices: z.string().optional().default(""),
  employeeCount: z.number().int().nonnegative().optional().default(0),
  contactEmail: z.string().email(),
  ownerUid: z.string().optional(),
  phone: z.string().optional().default(""),
  website: z.string().optional().default(""),
  country: z.string().optional().default(""),
  city: z.string().optional().default(""),
  addressLine: z.string().optional().default(""),
  categories: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  tenantId: z.string().optional(),
});
