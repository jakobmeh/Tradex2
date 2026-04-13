import { z } from 'zod'

export const aiTablePropertyTypeSchema = z.enum([
  'title',
  'text',
  'number',
  'select',
  'multi_select',
  'date',
  'checkbox',
  'url',
  'email',
  'rating',
])

export const aiTablePropertySchema = z.object({
  name: z.string().min(1).max(60),
  type: aiTablePropertyTypeSchema,
  options: z.array(z.string().min(1).max(40)).max(12).optional(),
})

export const aiTableSchema = z.object({
  name: z.string().min(1).max(80),
  icon: z.string().max(8).optional(),
  properties: z.array(aiTablePropertySchema).min(1).max(12),
})

export const aiTablePromptSchema = z.object({
  prompt: z.string().trim().min(5).max(1000),
})

export type AITableSchema = z.infer<typeof aiTableSchema>
