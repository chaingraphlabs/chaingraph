import type { PortConfig, PortValueFromConfig } from '@chaingraph/types/port'

export interface ObjectSchema {
  id?: string
  type?: string
  properties: {
    [key: string]: PortConfig
  }
}

export type ObjectPortValueFromSchema<S extends ObjectSchema> = {
  [K in keyof S['properties']]: PortValueFromConfig<S['properties'][K]>;
}
