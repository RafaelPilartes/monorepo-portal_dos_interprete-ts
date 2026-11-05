import { z } from 'zod'

// A request body with its own field named message: input, not an error (api.md §7).
export const application = z.object({ message: z.string().trim().max(1000).optional() })
