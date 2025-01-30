import type { JSONValue } from 'superjson/dist/types'
import type { IPort, PortConfig } from './types'
import { PortRegistry } from '@chaingraph/types/port/registry'
import Decimal from 'decimal.js'
import SuperJSON from 'superjson'
import { MultiChannel } from './channel'

/**
 * Registers all default port transformers with superjson
 */
export function registerPortTransformers() {
  // Register Decimal transformer
  SuperJSON.registerCustom<Decimal, string>(
    {
      isApplicable: (v): v is Decimal => Decimal.isDecimal(v),
      serialize: v => v.toJSON(),
      deserialize: v => new Decimal(v),
    },
    'decimal.js',
  )

  // Register MultiChannel transformer
  SuperJSON.registerCustom<MultiChannel<any>, JSONValue>(
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

  // SuperJSON.registerCustom<PortBase, JSONValue>(
  //   {
  //     isApplicable: (v): v is PortBase => v instanceof PortBase,
  //     serialize: v => v.serializePort(),
  //     deserialize: (v) => {
  //       const deserializedPort = SuperJSON.deserialize<{
  //         config: any
  //         value: any
  //       }>(v as unknown as SuperJSONResult)
  //
  //       // validate config
  //       const portConfig = parsePortConfig(deserializedPort.config)
  //
  //       const port = PortFactory.create(portConfig)
  //       port.setValue(deserializedPort.value as never)
  //
  //       return port as PortBase
  //     },
  //   },
  //   PortBase.name,
  // )
}

/**
 * Registers a superjson transformer for a specific port type
 * @param port Instance of port to create transformer from
 */
export function registerPortTransformer<C extends PortConfig>(port: IPort<C>): void {
  SuperJSON.registerCustom<IPort<C>, JSONValue>(
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
