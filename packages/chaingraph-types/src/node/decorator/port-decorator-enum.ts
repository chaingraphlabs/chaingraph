import type { PartialPortConfig, PortDecoratorConfig } from '@chaingraph/types/node'
import type { PortConfig } from '@chaingraph/types/port.new'
import { Port } from '@chaingraph/types/node'
import { PortType } from '@chaingraph/types/port.new'

/**
 * Decorator for defining an enum port with specified options.
 *
 * @param options - An array of options of type T (string, number, object).
 * @param config - Optional configuration to customize the enum port.
 */
export function PortEnumOf<T>(
  options: Array<T>,
  config?: PartialPortConfig<PortType.Enum>,
) {
  return function (target: any, propertyKey: string) {
    const optionConfigs: PortConfig[] = options.map((option, index) => {
      let type: PortType | Function
      let defaultValue: any

      if (typeof option === 'string') {
        type = PortType.String
        defaultValue = option
      } else if (typeof option === 'number') {
        type = PortType.Number
        defaultValue = option
      } else if (typeof option === 'boolean') {
        type = PortType.Boolean
        defaultValue = option
      } else if (typeof option === 'object' && option !== null) {
        type = option.constructor
        defaultValue = option
      } else {
        throw new Error(`Unsupported option type for enum: ${typeof option}`)
      }

      return {
        id: `option${index}`,
        type,
        key: typeof defaultValue === 'string' ? defaultValue : `Option ${index}`,
        defaultValue, // Note: This is the option's value, used when selected
      } as PortConfig
    })

    const defaultOptionId = optionConfigs[0]?.id // Default to the first option's id

    const enumConfig: PortDecoratorConfig<PortType.Enum> = {
      ...config,
      type: PortType.Enum,
      options: optionConfigs,
      defaultValue: defaultOptionId, // Must be the id of the selected option
    }

    return Port<PortType.Enum>(enumConfig)(target, propertyKey)
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
  config?: PartialPortConfig<PortType.Enum>,
) {
  const optionConfigs = options.map(value => ({
    id: value,
    type: PortType.String,
    defaultValue: value, // The value to use when this option is selected
  } as PortConfig))

  const defaultOptionId = options[0] // Default to the first option's id

  const enumConfig: PortDecoratorConfig<PortType.Enum> = {
    ...config,
    type: PortType.Enum,
    options: optionConfigs,
    defaultValue: defaultOptionId, // Must be the id of the selected option
  }

  return function (target: any, propertyKey: string) {
    return Port<PortType.Enum>(enumConfig)(target, propertyKey)
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
  config?: PartialPortConfig<PortType.Enum>,
) {
  const optionConfigs = options.map(value => ({
    id: value.toString(),
    type: PortType.Number,
    defaultValue: value, // The value to use when this option is selected
  } as PortConfig))

  const defaultOptionId = options[0].toString() // Default to the first option's id

  const enumConfig: PortDecoratorConfig<PortType.Enum> = {
    ...config,
    type: PortType.Enum,
    options: optionConfigs,
    defaultValue: defaultOptionId, // Must be the id of the selected option
  }

  return function (target: any, propertyKey: string) {
    return Port<PortType.Enum>(enumConfig)(target, propertyKey)
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
  config?: PartialPortConfig<PortType.Enum>,
) {
  const optionConfigs = Object.entries(options).map(([id, value]) => {
    let type: PortType | Function
    let defaultValue: any

    if (typeof value === 'string') {
      type = PortType.String
      defaultValue = value
    } else if (typeof value === 'number') {
      type = PortType.Number
      defaultValue = value
    } else if (typeof value === 'boolean') {
      type = PortType.Boolean
      defaultValue = value
    } else if (typeof value === 'object' && value !== null) {
      type = value.constructor
      defaultValue = value
    } else {
      throw new Error(`Unsupported option type for enum: ${typeof value}`)
    }

    return {
      id,
      type,
      defaultValue, // The value to use when this option is selected
    } as PortConfig
  })

  const defaultOptionId = Object.keys(options)[0] // Default to the first option's id

  const enumConfig: PortDecoratorConfig<PortType.Enum> = {
    ...config,
    type: PortType.Enum,
    options: optionConfigs,
    defaultValue: defaultOptionId, // Must be the id of the selected option
  }

  return function (target: any, propertyKey: string) {
    return Port<PortType.Enum>(enumConfig)(target, propertyKey)
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
  config?: PartialPortConfig<PortType.Enum>,
) {
  const options = Object.values(nativeEnum).filter(
    value => typeof value === 'string' || typeof value === 'number',
  ) as Array<string | number>

  const optionConfigs = options.map((value) => {
    let type: PortType

    if (typeof value === 'string') {
      type = PortType.String
    } else if (typeof value === 'number') {
      type = PortType.Number
    } else {
      throw new TypeError(`Unsupported enum value type: ${typeof value}`)
    }

    return {
      id: value.toString(),
      type,
      defaultValue: value, // The value to use when this option is selected
    } as PortConfig
  })

  const defaultOptionId = optionConfigs[0]?.id

  const enumConfig: PortDecoratorConfig<PortType.Enum> = {
    ...config,
    type: PortType.Enum,
    options: optionConfigs,
    defaultValue: defaultOptionId, // Must be the id of the selected option
  }

  return function (target: any, propertyKey: string) {
    return Port<PortType.Enum>(enumConfig)(target, propertyKey)
  }
}
