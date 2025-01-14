import type { PartialPortConfig, PortDecoratorConfig } from '@chaingraph/types/node'
import type { PortConfig } from '@chaingraph/types/port'
import { Port } from '@chaingraph/types/node'
import { PortKindEnum } from '@chaingraph/types/port/types/port-kind-enum'

/**
 * Decorator for defining an enum port with specified options.
 *
 * @param options - An array of options of type T (string, number, object).
 * @param config - Optional configuration to customize the enum port.
 */
export function PortEnumOf<T>(
  options: Array<T>,
  config?: PartialPortConfig<PortKindEnum.Enum>,
) {
  return function (target: any, propertyKey: string) {
    const optionConfigs: PortConfig[] = options.map((option, index) => {
      let kind: PortKindEnum | Function
      let defaultValue: any

      if (typeof option === 'string') {
        kind = PortKindEnum.String
        defaultValue = option
      } else if (typeof option === 'number') {
        kind = PortKindEnum.Number
        defaultValue = option
      } else if (typeof option === 'boolean') {
        kind = PortKindEnum.Boolean
        defaultValue = option
      } else if (typeof option === 'object' && option !== null) {
        kind = option.constructor
        defaultValue = option
      } else {
        throw new Error(`Unsupported option type for enum: ${typeof option}`)
      }

      return {
        id: `option${index}`,
        kind,
        key: typeof defaultValue === 'string' ? defaultValue : `Option ${index}`,
        defaultValue, // Note: This is the option's value, used when selected
      } as PortConfig
    })

    const defaultOptionId = optionConfigs[0]?.id // Default to the first option's id

    const enumConfig: PortDecoratorConfig<PortKindEnum.Enum> = {
      ...config,
      kind: PortKindEnum.Enum,
      options: optionConfigs,
      defaultValue: defaultOptionId, // Must be the id of the selected option
    }

    return Port<PortKindEnum.Enum>(enumConfig)(target, propertyKey)
  }
}

/**
 * Decorator for defining an enum port with string options.
 *
 * @param options - An array of string options.
 * @param config - Optional configuration to customize the enum port.
 */
export function PortStringEnum(
  options: string[],
  config?: PartialPortConfig<PortKindEnum.Enum>,
) {
  const optionConfigs = options.map(value => ({
    id: value,
    kind: PortKindEnum.String,
    defaultValue: value, // The value to use when this option is selected
  }))

  const defaultOptionId = options[0] // Default to the first option's id

  const enumConfig: PortDecoratorConfig<PortKindEnum.Enum> = {
    ...config,
    kind: PortKindEnum.Enum,
    options: optionConfigs,
    defaultValue: defaultOptionId, // Must be the id of the selected option
  }

  return function (target: any, propertyKey: string) {
    return Port<PortKindEnum.Enum>(enumConfig)(target, propertyKey)
  }
}

/**
 * Decorator for defining an enum port with number options.
 *
 * @param options - An array of number options.
 * @param config - Optional configuration to customize the enum port.
 */
export function PortNumberEnum(
  options: number[],
  config?: PartialPortConfig<PortKindEnum.Enum>,
) {
  const optionConfigs = options.map(value => ({
    id: value.toString(),
    kind: PortKindEnum.Number,
    defaultValue: value, // The value to use when this option is selected
  }))

  const defaultOptionId = options[0].toString() // Default to the first option's id

  const enumConfig: PortDecoratorConfig<PortKindEnum.Enum> = {
    ...config,
    kind: PortKindEnum.Enum,
    options: optionConfigs,
    defaultValue: defaultOptionId, // Must be the id of the selected option
  }

  return function (target: any, propertyKey: string) {
    return Port<PortKindEnum.Enum>(enumConfig)(target, propertyKey)
  }
}

/**
 * Decorator for defining an enum port based on an object mapping.
 *
 * @param options - An object where keys are identifiers and values are options.
 * @param config - Optional configuration to customize the enum port.
 */
export function PortEnumFromObject<T>(
  options: { [key: string]: T },
  config?: PartialPortConfig<PortKindEnum.Enum>,
) {
  const optionConfigs = Object.entries(options).map(([id, value]) => {
    let kind: PortKindEnum | Function
    let defaultValue: any

    if (typeof value === 'string') {
      kind = PortKindEnum.String
      defaultValue = value
    } else if (typeof value === 'number') {
      kind = PortKindEnum.Number
      defaultValue = value
    } else if (typeof value === 'boolean') {
      kind = PortKindEnum.Boolean
      defaultValue = value
    } else if (typeof value === 'object' && value !== null) {
      kind = value.constructor
      defaultValue = value
    } else {
      throw new Error(`Unsupported option type for enum: ${typeof value}`)
    }

    return {
      id,
      kind,
      defaultValue, // The value to use when this option is selected
    } as PortConfig
  })

  const defaultOptionId = Object.keys(options)[0] // Default to the first option's id

  const enumConfig: PortDecoratorConfig<PortKindEnum.Enum> = {
    ...config,
    kind: PortKindEnum.Enum,
    options: optionConfigs,
    defaultValue: defaultOptionId, // Must be the id of the selected option
  }

  return function (target: any, propertyKey: string) {
    return Port<PortKindEnum.Enum>(enumConfig)(target, propertyKey)
  }
}

/**
 * Decorator for defining an enum port based on a TypeScript native enum.
 *
 * @param nativeEnum - The TypeScript enum object.
 * @param config - Optional configuration to customize the enum port.
 */
export function PortEnumFromNative<E extends Record<string, string | number>>(
  nativeEnum: E,
  config?: PartialPortConfig<PortKindEnum.Enum>,
) {
  const options = Object.values(nativeEnum).filter(
    value => typeof value === 'string' || typeof value === 'number',
  ) as Array<string | number>

  const optionConfigs = options.map((value) => {
    let kind: PortKindEnum

    if (typeof value === 'string') {
      kind = PortKindEnum.String
    } else if (typeof value === 'number') {
      kind = PortKindEnum.Number
    } else {
      throw new TypeError(`Unsupported enum value type: ${typeof value}`)
    }

    return {
      id: value.toString(),
      kind,
      defaultValue: value, // The value to use when this option is selected
    } as PortConfig
  })

  const defaultOptionId = optionConfigs[0]?.id

  const enumConfig: PortDecoratorConfig<PortKindEnum.Enum> = {
    ...config,
    kind: PortKindEnum.Enum,
    options: optionConfigs,
    defaultValue: defaultOptionId, // Must be the id of the selected option
  }

  return function (target: any, propertyKey: string) {
    return Port<PortKindEnum.Enum>(enumConfig)(target, propertyKey)
  }
}
