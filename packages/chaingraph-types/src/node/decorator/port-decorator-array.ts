import type {
  ArrayPortConfig,
  PortConfigWithClassKind,
} from '@chaingraph/types'

import {
  PortArray,
  PortKindEnum,
} from '@chaingraph/types'

/**
 * Type definition for array port configurations used in decorators.
 * Extends the partial `ArrayPortConfig` and ensures that the `kind` is `PortKindEnum.Array`.
 */
export type DecoratorArrayPortConfig = Partial<ArrayPortConfig<any>> & {
  kind: PortKindEnum.Array
}

/**
 * Decorator for defining a port that represents an array of strings.
 *
 * This decorator simplifies the creation of array ports where the elements are strings.
 * It configures the port with the necessary `elementConfig` and allows optional customization.
 *
 * **Features:**
 * - **Simplified Syntax:** Easily define string array ports without verbose configurations.
 * - **Customization:** Optionally provide additional configuration such as `id`, `name`, `description`, and `defaultValue`.
 * - **Default Value:** Each element in the array defaults to an empty string `''` if not specified.
 *
 * **Usage Examples:**
 * ```typescript
 * // Basic usage
 * @Output()
 * @PortStringArray()
 * stringArray?: string[]
 *
 * // With additional configuration
 * @Input()
 * @PortStringArray({
 *   id: 'myStringArray',
 *   name: 'My String Array',
 *   description: 'An array of strings with default values',
 *   defaultValue: ['hello', 'world'],
 * })
 * configuredStringArray?: string[]
 * ```
 *
 * @param config - Optional configuration to customize the array port.
 * @returns A decorator function that applies the array port configuration.
 */
export function PortStringArray(config?: DecoratorArrayPortConfig) {
  return PortArray({
    ...config,
    elementConfig: {
      kind: PortKindEnum.String,
      defaultValue: '',
      ...(config?.elementConfig || {}),
    },
  })
}

/**
 * Decorator for defining a port that represents an array of numbers.
 *
 * This decorator simplifies the creation of array ports where the elements are numbers.
 * It sets up the necessary `elementConfig` and allows optional customization.
 *
 * **Features:**
 * - **Simplified Syntax:** Easily define number array ports without verbose configurations.
 * - **Customization:** Optionally provide additional configuration such as `id`, `name`, `description`, and `defaultValue`.
 * - **Default Value:** Each element in the array defaults to `0` if not specified.
 *
 * **Usage Examples:**
 * ```typescript
 * // Basic usage
 * @Output()
 * @PortNumberArray()
 * numberArray?: number[]
 *
 * // With additional configuration
 * @Input()
 * @PortNumberArray({
 *   id: 'myNumberArray',
 *   name: 'My Number Array',
 *   description: 'An array of numbers with default values',
 *   defaultValue: [1, 2, 3],
 * })
 * configuredNumberArray?: number[]
 * ```
 *
 * @param config - Optional configuration to customize the array port.
 * @returns A decorator function that applies the array port configuration.
 */
export function PortArrayNumber(config?: DecoratorArrayPortConfig) {
  return PortArray({
    ...config,
    elementConfig: {
      kind: PortKindEnum.Number,
      defaultValue: 0,
      ...(config?.elementConfig || {}),
    },
  })
}

/**
 * Decorator for defining a port that represents an array of objects.
 *
 * This decorator allows you to create array ports where the elements are instances of a specified class.
 * The class should be appropriately decorated with port configurations for its properties.
 *
 * **Features:**
 * - **Flexible Element Type:** Specify any class as the element type.
 * - **Customization:** Optionally provide additional configuration such as `id`, `name`, `description`, and `defaultValue`.
 *
 * **Usage Examples:**
 * ```typescript
 * // Assuming TestUserObject is a class decorated with port configurations
 * @Output()
 * @PortObjectArray(TestUserObject)
 * userArray?: TestUserObject[]
 *
 * // With additional configuration
 * @Input()
 * @PortObjectArray(TestUserObject, {
 *   id: 'myUserArray',
 *   name: 'My User Array',
 *   description: 'An array of user objects',
 * })
 * configuredUserArray?: TestUserObject[]
 * ```
 *
 * **Special Considerations:**
 * - Ensure that the `objectType` class is decorated with port configurations for its properties using decorators like `@PortString`, `@PortNumber`, etc.
 *
 * @param objectType - The class constructor of the object type for the array elements.
 * @param config - Optional configuration to customize the array port.
 * @returns A decorator function that applies the array port configuration.
 */
export function PortArrayObject<T>(objectType: new () => T, config?: DecoratorArrayPortConfig) {
  return PortArray({
    ...config,
    elementConfig: {
      kind: objectType,
      ...(config?.elementConfig || {}),
    },
  })
}

/**
 * Decorator for defining a port that represents a nested (multi-dimensional) array.
 *
 * This decorator allows you to create arrays of arbitrary nesting depth with specified element configurations.
 *
 * **Features:**
 * - **Arbitrary Depth:** Create arrays nested to any depth by specifying the `depth` parameter.
 * - **Flexible Element Type:** Define the element configuration for the innermost elements.
 *
 * **Usage Examples:**
 * ```typescript
 * // Creating a 2D array of strings
 * @Output()
 * @PortArrayNested(2, {
 *   kind: PortKindEnum.String,
 *   defaultValue: '',
 * })
 * string2DArray?: string[][]
 *
 * // Creating a 3D array of numbers
 * @Output()
 * @PortArrayNested(3, {
 *   kind: PortKindEnum.Number,
 *   defaultValue: 0,
 * })
 * number3DArray?: number[][][]
 *
 * // Creating a nested array of objects
 * @Output()
 * @PortArrayNested(2, {
 *   kind: TestUserObject,
 * })
 * user2DArray?: TestUserObject[][]
 * ```
 *
 * **Special Considerations:**
 * - **Depth Parameter:** The `depth` must be an integer greater than or equal to 1.
 * - **Element Configuration:** The `elementConfig` specifies the configuration for the innermost elements in the nested array.
 * - **Custom Configurations:** You can pass additional configuration options within the `elementConfig`.
 *
 * @param depth - The number of nesting levels (e.g., `2` for a 2D array).
 * @param elementConfig - The port configuration for the innermost array elements.
 * @returns A decorator function that applies the nested array port configuration.
 */
export function PortArrayNested(depth: number, elementConfig: PortConfigWithClassKind): (target: any, propertyKey: string) => void {
  const createNestedConfig = (level: number): any => {
    if (level === 0) {
      return elementConfig
    }
    return {
      kind: PortKindEnum.Array,
      elementConfig: createNestedConfig(level - 1),
    }
  }

  return PortArray({
    elementConfig: createNestedConfig(depth - 1),
  })
}
