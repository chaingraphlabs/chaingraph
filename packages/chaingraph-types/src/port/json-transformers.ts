import type { PortConfig } from '@chaingraph/types/port/types'
import type { IPort } from '@chaingraph/types/port/types/port-interface'
import type { JSONValue } from 'superjson/dist/types'
import { MultiChannel } from '@chaingraph/types/port/channel'
import { PortRegistry } from '@chaingraph/types/port/registry'
import Decimal from 'decimal.js'
import superjson from 'superjson'

/**
 * Registers all default port transformers with superjson
 */
export function registerPortTransformers() {
  // Register Decimal transformer
  superjson.registerCustom<Decimal, string>(
    {
      isApplicable: (v): v is Decimal => Decimal.isDecimal(v),
      serialize: v => v.toJSON(),
      deserialize: v => new Decimal(v),
    },
    'decimal.js',
  )

  // Register MultiChannel transformer
  superjson.registerCustom<MultiChannel<any>, JSONValue>(
    {
      // isApplicable: (v): v is MultiChannel<any> => v instanceof MultiChannel,
      isApplicable: (v): v is MultiChannel<any> => {
        return v instanceof MultiChannel
      },
      serialize: (v) => {
        return v.serialize()
      },
      deserialize: (v) => {
        return MultiChannel.deserialize(v)
      },
    },
    MultiChannel.name,
  )

  PortRegistry.getRegisteredPorts().forEach((port) => {
    registerPortTransformer(port)
  })
}

/**
 * Registers a superjson transformer for a specific port type
 * @param port Instance of port to create transformer from
 */
export function registerPortTransformer<C extends PortConfig>(port: IPort<C>): void {
  superjson.registerCustom<IPort<C>, JSONValue>(
    {
      isApplicable: (v): v is IPort<C> => v instanceof port.constructor,
      serialize: v => v.serializePort(),
      deserialize: v => port.deserializePort(v),
    },
    port.constructor.name,
  )

  // superjson.registerCustom<C, JSONValue>(
  //   {
  //     isApplicable: (v): v is C => v instanceof port.config.constructor,
  //     serialize: v => superjson.serialize(v) as unknown as JSONValue,
  //     deserialize: v => parsePortConfig(v) as C,
  //   },
  //   port.config.kind,
  // )
}
