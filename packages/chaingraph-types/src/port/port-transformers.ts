import type { PortConfig } from '@chaingraph/types/port/types/port-composite-types'
import type { NumberPortConfig } from '@chaingraph/types/port/types/port-config'
import type { IPort } from '@chaingraph/types/port/types/port-interface'
import type { JSONValue } from 'superjson/dist/types'
import { AnyPort } from '@chaingraph/types/port/any'
import { ArrayPort } from '@chaingraph/types/port/array'
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
  superjson.registerCustom<Decimal, string>(
    {
      isApplicable: (v): v is Decimal => Decimal.isDecimal(v),
      serialize: v => v.toJSON(),
      deserialize: v => new Decimal(v),
    },
    'decimal.js',
  )

  const numberPort = new NumberPort({ kind: PortKindEnum.Number })
  superjson.registerCustom<IPort<NumberPortConfig>, JSONValue>(
    {
      isApplicable: (v): v is IPort<NumberPortConfig> => numberPort.isApplicable(v),
      serialize: v => numberPort.serialize(v),
      deserialize: v => numberPort.deserialize(v),
    },
    numberPort.config.kind,
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
