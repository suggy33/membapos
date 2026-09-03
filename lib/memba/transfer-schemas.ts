import { z } from "zod"

export const createTransferSchema = z.object({ organizationId: z.string().min(1), fromLocationId: z.string().min(1), toLocationId: z.string().min(1), items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().positive() })).min(1, "Add at least one item."), notes: z.string().trim().min(4, "Add a note for the receiving team.") }).refine((input) => input.fromLocationId !== input.toLocationId, { message: "Choose two different locations." })
