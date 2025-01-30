import type { PortConfig, PortValueType } from './config/types'
import type { Serializable, SerializedData } from './serialization/serializer'
import { MathOperationType, PortDirection, PortType, RoundingMode } from './config/constants'
import { SerializationRegistry } from './serialization/serializer'
import { validatePortConfig } from './validation/schemas'

export * from './config/constants'
// Re-export everything
export * from './config/types'
export * from './serialization/serializer'
export * from './validation/schemas'

/**
 * Example of a serializable class that can be used in port values
 */
export class MathOperation implements Serializable {
  private static readonly CURRENT_VERSION = 1

  constructor(
    private readonly operation: MathOperationType,
    private readonly precision: number = 2,
    private readonly roundingMode: RoundingMode = RoundingMode.Round,
  ) {}

  public execute(a: number, b: number): number {
    let result: number
    switch (this.operation) {
      case MathOperationType.Add:
        result = a + b
        break
      case MathOperationType.Subtract:
        result = a - b
        break
      case MathOperationType.Multiply:
        result = a * b
        break
      case MathOperationType.Divide:
        if (b === 0)
          throw new Error('Division by zero')
        result = a / b
        break
    }

    // Apply rounding
    switch (this.roundingMode) {
      case RoundingMode.Floor:
        return Number(Math.floor(result).toFixed(this.precision))
      case RoundingMode.Ceil:
        return Number(Math.ceil(result).toFixed(this.precision))
      case RoundingMode.Round:
        return Number(result.toFixed(this.precision))
    }
  }

  public serialize(): SerializedData {
    return {
      __type: 'MathOperation',
      __version: MathOperation.CURRENT_VERSION,
      __data: {
        operation: this.operation,
        precision: this.precision,
        roundingMode: this.roundingMode,
      },
    }
  }

  public static deserialize(data: SerializedData): MathOperation {
    const { operation, precision, roundingMode } = data.__data as {
      operation: MathOperationType
      precision: number
      roundingMode: RoundingMode
    }
    return new MathOperation(operation, precision, roundingMode)
  }
}

// Register the MathOperation class with the serialization registry
SerializationRegistry.getInstance().registerClass('MathOperation', MathOperation)

/**
 * Example port configurations
 */
export const exampleConfigs = {
  // Simple string port
  stringPort: validatePortConfig({
    type: PortType.String,
    id: 'string-1',
    title: 'String Input',
    direction: PortDirection.Input,
    validation: {
      minLength: 1,
      maxLength: 100,
    },
  }),

  // Number port with validation
  numberPort: validatePortConfig({
    type: PortType.Number,
    id: 'number-1',
    title: 'Number Input',
    direction: PortDirection.Input,
    validation: {
      min: 0,
      max: 100,
      integer: true,
    },
  }),

  // Array of numbers
  numberArrayPort: validatePortConfig({
    type: PortType.Array,
    id: 'array-1',
    title: 'Number Array',
    direction: PortDirection.Input,
    elementConfig: {
      type: PortType.Number,
      validation: {
        min: 0,
      },
    },
    validation: {
      minItems: 1,
      maxItems: 10,
    },
  }),

  // Object with nested properties
  objectPort: validatePortConfig({
    type: PortType.Object,
    id: 'object-1',
    title: 'Settings Object',
    direction: PortDirection.Input,
    schema: {
      properties: {
        name: {
          type: PortType.String,
          validation: {
            minLength: 1,
          },
        },
        age: {
          type: PortType.Number,
          validation: {
            min: 0,
            integer: true,
          },
        },
        tags: {
          type: PortType.Array,
          elementConfig: {
            type: PortType.String,
          },
        },
      },
      required: ['name', 'age'],
    },
  }),

  // Port with custom class
  mathOperationPort: validatePortConfig({
    type: PortType.Any,
    id: 'math-1',
    title: 'Math Operation',
    direction: PortDirection.Input,
    defaultValue: new MathOperation(MathOperationType.Add, 2, RoundingMode.Round),
  }),
} as const

/**
 * Example usage with type inference
 */
export function createPort<T extends PortConfig>(config: T): {
  config: T
  setValue: (value: PortValueType<T>) => void
  getValue: () => PortValueType<T> | undefined
} {
  let currentValue: PortValueType<T> | undefined

  return {
    config,
    setValue: (value: PortValueType<T>) => {
      currentValue = value
    },
    getValue: () => currentValue,
  }
}

// Usage examples:
const stringPort = createPort(exampleConfigs.stringPort)
stringPort.setValue('hello') // OK
// stringPort.setValue(123); // Type error

const mathPort = createPort(exampleConfigs.mathOperationPort)
mathPort.setValue(new MathOperation(MathOperationType.Add, 2, RoundingMode.Round)) // OK
// mathPort.setValue('invalid'); // Type error
