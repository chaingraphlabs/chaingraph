import type { PortConfig, PortValueFromConfig } from '@chaingraph/types/port'

export interface ObjectSchema {
  properties: {
    [key: string]: PortConfig
  }
}

export type ObjectPortValueFromSchema<S extends ObjectSchema> = {
  [K in keyof S['properties']]: PortValueFromConfig<S['properties'][K]>;
}
