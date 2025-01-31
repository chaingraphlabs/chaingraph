import type { IPort, PortConfig, SerializedPortData } from '@chaingraph/types/port.new'
import type { JSONValue, SuperJSONResult } from 'superjson/dist/types'
import { Port } from '@chaingraph/types/port.new'
import { PortFactory } from '@chaingraph/types/port.new/registry/port-factory'
import Decimal from 'decimal.js'
import SuperJSON from 'superjson'

export function registerSuperjsonPort() {
  SuperJSON.registerCustom<Decimal, string>(
    {
      isApplicable: (v): v is Decimal => Decimal.isDecimal(v),
      serialize: v => v.toJSON(),
      deserialize: v => new Decimal(v),
    },
    'decimal.js',
  )

  SuperJSON.registerCustom<IPort<PortConfig, unknown>, JSONValue>(
    {
      isApplicable: (v): v is IPort<PortConfig, unknown> => v instanceof Port,
      serialize: v =>
        SuperJSON.serialize(v.serialize()) as unknown as JSONValue,
      deserialize: (v) => {
        const deserializedValue = SuperJSON.deserialize<SerializedPortData>(
          v as unknown as SuperJSONResult,
        )
        const port = PortFactory.create(deserializedValue.config)
        port.setValue(deserializedValue.value)

        return port
      },
    },
    Port.name,
  )
}
