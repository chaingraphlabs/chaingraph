import type { PortConfig, PortValueFromConfig } from '@chaingraph/types/port'
import { BasePortConfigSchema, PortValueSchema } from '@chaingraph/types/port/types/port-config.zod'
import { z } from 'zod'

export const ObjectSchemaSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  properties: z.record(z.string(), BasePortConfigSchema),
})

export interface ObjectSchema extends z.infer<typeof ObjectSchemaSchema> {
  properties: {
    [key: string]: PortConfig
  }
}

export type ObjectPortValueFromSchema<S extends ObjectSchema> = {
  [K in keyof S['properties']]: PortValueFromConfig<S['properties'][K]>;
}

export const ObjectPortValueFromSchemaSchema = z.map(z.string(), PortValueSchema)
export type ObjectPortValueFromSchemaSchemaType = z.infer<typeof ObjectPortValueFromSchemaSchema>
