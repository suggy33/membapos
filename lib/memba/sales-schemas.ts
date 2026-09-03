import { z } from "zod"

export const completeSaleSchema = z.object({ organizationId: z.string().min(1), locationId: z.string().min(1), orderNumber: z.string().regex(/^MEM-\d+$/, "Enter a valid order number.").optional(), items: z.array(z.object({ variantId: z.string().min(1), qty: z.number().int().positive(), discountCents: z.number().int().nonnegative() })).min(1, "Add at least one item."), paymentMethod: z.enum(["CASH", "EFT"]), amountPaidCents: z.number().int().positive("Enter the payment amount."), approvalCode: z.string().optional() })
