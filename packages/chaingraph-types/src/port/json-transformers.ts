import type { PortConfig } from '@chaingraph/types/port/types/port-composite-types'
import type { IPort } from '@chaingraph/types/port/types/port-interface'
import type { JSONValue } from 'superjson/dist/types'
import { AnyPort } from '@chaingraph/types/port/any'
import { ArrayPort } from '@chaingraph/types/port/array'
import { MultiChannel } from '@chaingraph/types/port/channel'
import { EnumPort } from '@chaingraph/types/port/enum'
import { ObjectPort } from '@chaingraph/types/port/object'
import { BooleanPort, NumberPort, StringPort } from '@chaingraph/types/port/scalar'
import { StreamInputPort } from '@chaingraph/types/port/stream/stream-input-port'
import { StreamOutputPort } from '@chaingraph/types/port/stream/stream-output-port'
import { PortDirectionEnum } from '@chaingraph/types/port/types/port-direction'
import { PortKindEnum } from '@chaingraph/types/port/types/port-kind-enum'
import Decimal from 'decimal.js'
import superjson from 'superjson'

/**
 * Registers a superjson transformer for a specific port type
 * @param port Instance of port to create transformer from
 */
export function registerPortTransformer<C extends PortConfig>(port: IPort<C>): void {
  superjson.registerCustom<IPort<C>, JSONValue>(
    {
      isApplicable: (v): v is IPort<C> => port.isApplicable(v),
      serialize: v => port.serialize(v),
      deserialize: v => port.deserialize(v),
    },
    port.config.kind,
  )
}

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
        if (v instanceof MultiChannel) {
          return true
        }

        if (!v || typeof v !== 'object' || !('type' in v) || v.type !== 'MultiChannel') {
          return false
        }

        if (!('buffer' in v) || !Array.isArray(v.buffer)) {
          return false
        }

        return true
      },
      serialize: (v) => {
        return {
          type: 'MultiChannel',
          buffer: v.getBuffer(),
          isClosed: v.isChannelClosed(),
        }
      },
      deserialize: (v) => {
        if (!v || typeof v !== 'object') {
          throw new Error('Invalid MultiChannel object')
        }

        if (!('type' in v) || v.type !== 'MultiChannel') {
          throw new Error('Invalid MultiChannel type')
        }

        const chan = new MultiChannel()
        if (v.buffer && Array.isArray(v.buffer)) {
          chan.sendBatch(v.buffer)
        }
        if (v.isClosed) {
          chan.close()
        }

        return chan
      },
    },
    'MultiChannel',
  )

  // Register all port type transformers
  const ports = [
    new StringPort({ kind: PortKindEnum.String }),
    new NumberPort({ kind: PortKindEnum.Number }),
    new BooleanPort({ kind: PortKindEnum.Boolean }),
    new ArrayPort({ kind: PortKindEnum.Array, elementConfig: { kind: PortKindEnum.String } }),
    new ObjectPort({ kind: PortKindEnum.Object, schema: { properties: {} } }),
    new AnyPort({ kind: PortKindEnum.Any }),
    new EnumPort({ kind: PortKindEnum.Enum, options: [] }),
    new StreamInputPort({ kind: PortKindEnum.StreamInput, direction: PortDirectionEnum.Input, valueType: { kind: PortKindEnum.String } }),
    new StreamOutputPort({ kind: PortKindEnum.StreamOutput, direction: PortDirectionEnum.Output, valueType: { kind: PortKindEnum.String } }),
  ]

  ports.forEach((port) => {
    superjson.registerCustom<IPort<any>, JSONValue>(
      {
        isApplicable: (v): v is IPort<any> => port.isApplicable(v),
        serialize: v => port.serialize(v as any),
        deserialize: v => port.deserialize(v),
      },
      port.config.kind,
    )
  })
}
