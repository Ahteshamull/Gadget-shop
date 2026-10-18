import { z } from "zod";

const ownerSchema = z.object({
  name: z.string().trim().min(1, "Owner name is required").max(80),
  role: z.enum(["Owner", "Partner"]),
  share: z.coerce.number().min(0).max(100),
});

export const businessProfileSchema = z
  .object({
    body: z.object({
      businessType: z.enum(["single", "multiple"]).default("single"),
      owners: z.array(ownerSchema).min(1, "At least one owner is required").max(20, "Cannot exceed 20 partners"),
    }),
  })
  .superRefine((value, ctx) => {
    if (value.body.businessType === "single") {
      if (value.body.owners.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["body", "owners"],
          message: "Single ownership must have exactly 1 owner",
        });
      }
    } else if (value.body.businessType === "multiple") {
      if (value.body.owners.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["body", "owners"],
          message: "Partnership business must have at least 2 partners",
        });
      }
    }

    const totalShare = value.body.owners.reduce((sum, owner) => sum + owner.share, 0);
    if (Math.abs(totalShare - 100) > 0.001) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["body", "owners"],
        message: "Owner share total must be exactly 100%",
      });
    }

    const names = value.body.owners.map((owner) => owner.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["body", "owners"],
        message: "Owner names must be unique",
      });
    }
  });

export const updateBrandingSchema = z.object({
  body: z.object({
    shopName: z.string().trim().max(100).optional(),
    shopTagline: z.string().trim().max(100).optional(),
    shopLogoUrl: z.string().optional(),
    loginHeadline: z.string().trim().max(200).optional(),
    loginDescription: z.string().trim().max(300).optional(),
    loginFooterText: z.string().trim().max(100).optional(),
    loginBannerUrl: z.string().optional(),
  }),
});

export const updateInvoiceSettingsSchema = z.object({
  body: z.object({
    shopName: z.string().trim().max(100).optional(),
    shopTagline: z.string().trim().max(100).optional(),
    shopLogoUrl: z.string().optional(),
    shopAddress: z.string().trim().max(300).optional(),
    shopPhone: z.string().trim().max(100).optional(),
    shopEmail: z.string().trim().max(100).optional(),
    shopWebsite: z.string().trim().max(150).optional(),
    invoiceTitle: z.string().trim().max(100).optional(),
    invoiceTerms: z.array(z.string().trim().min(1)).optional(),
    invoiceFooterNote: z.string().trim().max(200).optional(),
    showWatermark: z.boolean().optional(),
    showPaidStamp: z.boolean().optional(),
    showBarcode: z.boolean().optional(),
    showQrCode: z.boolean().optional(),
    showSignatures: z.boolean().optional(),
    showAmountInWords: z.boolean().optional(),
  }),
});


