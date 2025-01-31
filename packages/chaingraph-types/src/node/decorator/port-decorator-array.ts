import type { ConfigFromPortType, ObjectSchema, PortConfig, PortDirection } from '@chaingraph/types/port.new'
import { PortArray } from '@chaingraph/types/node'
import { PortType } from '@chaingraph/types/port.new'

interface BasePortFields {
  id?: string
  title?: string
  key?: string
  description?: string
  direction?: PortDirection
  optional?: boolean
  metadata?: Record<string, unknown>
  defaultValue?: unknown[]
  parentId?: string
  nodeId?: string
}

/**
 * Decorator for defining a port that represents an array of strings.
 *
 * @example
 * ```typescript
 * // Basic usage
 * @Input()
 * @PortStringArray()
 * strings: string[] = []
 *
 * // With validation
 * @Input()
 * @PortStringArray({
 *   elementConfig: {
 *     validation: {
 *       minLength: 2,
 *       maxLength: 10
 *     }
 *   }
 * })
 * validatedStrings: string[] = []
 * ```
 */
export function PortStringArray(config?: BasePortFields & {
  elementConfig?: Omit<ConfigFromPortType<PortType.String>, 'type'>
}) {
  const elementConfig: ConfigFromPortType<PortType.String> = {
    type: PortType.String,
    defaultValue: '',
    ...config?.elementConfig,
  }

  const arrayConfig: ConfigFromPortType<PortType.Array> = {
    type: PortType.Array,
    elementConfig,
    defaultValue: [],
    ...(config
      ? {
          id: config.id,
          title: config.title,
          key: config.key,
          description: config.description,
          direction: config.direction,
          optional: config.optional,
          metadata: config.metadata,
          parentId: config.parentId,
          nodeId: config.nodeId,
        }
      : {}),
  }

  return PortArray(arrayConfig)
}

/**
 * Decorator for defining a port that represents an array of numbers.
 *
 * @example
 * ```typescript
 * // Basic usage
 * @Input()
 * @PortArrayNumber()
 * numbers: number[] = []
 *
 * // With validation
 * @Input()
 * @PortArrayNumber({
 *   elementConfig: {
 *     validation: {
 *       min: 0,
 *       max: 100
 *     }
 *   }
 * })
 * validatedNumbers: number[] = []
 * ```
 */
export function PortArrayNumber(config?: BasePortFields & {
  elementConfig?: Omit<ConfigFromPortType<PortType.Number>, 'type'>
}) {
  const elementConfig: ConfigFromPortType<PortType.Number> = {
    type: PortType.Number,
    defaultValue: 0,
    ...config?.elementConfig,
  }

  const arrayConfig: ConfigFromPortType<PortType.Array> = {
    type: PortType.Array,
    elementConfig,
    defaultValue: [],
    ...(config
      ? {
          id: config.id,
          title: config.title,
          key: config.key,
          description: config.description,
          direction: config.direction,
          optional: config.optional,
          metadata: config.metadata,
          parentId: config.parentId,
          nodeId: config.nodeId,
        }
      : {}),
  }

  return PortArray(arrayConfig)
}

/**
 * Decorator for defining a port that represents an array of objects.
 *
 * @example
 * ```typescript
 * // Basic usage
 * @Input()
 * @PortArrayObject(UserProfile)
 * users: UserProfile[] = []
 *
 * // With configuration
 * @Input()
 * @PortArrayObject(UserProfile, {
 *   description: 'List of user profiles',
 *   optional: true
 * })
 * optionalUsers: UserProfile[] = []
 * ```
 */
export function PortArrayObject<T>(
  objectType: new () => T,
  config?: BasePortFields & {
    elementConfig?: Omit<ConfigFromPortType<PortType.Object>, 'type' | 'schema'>
  },
) {
  const schema: ObjectSchema = {
    properties: {},
    type: objectType.name,
  }

  const elementConfig: ConfigFromPortType<PortType.Object> = {
    type: PortType.Object,
    schema,
    defaultValue: {},
    ...config?.elementConfig,
  }

  const arrayConfig: ConfigFromPortType<PortType.Array> = {
    type: PortType.Array,
    elementConfig,
    defaultValue: [],
    ...(config
      ? {
          id: config.id,
          title: config.title,
          key: config.key,
          description: config.description,
          direction: config.direction,
          optional: config.optional,
          metadata: config.metadata,
          parentId: config.parentId,
          nodeId: config.nodeId,
        }
      : {}),
  }

  return PortArray(arrayConfig)
}

/**
 * Decorator for defining a port that represents a nested (multi-dimensional) array.
 *
 * @example
 * ```typescript
 * // 2D array of numbers
 * @Input()
 * @PortArrayNested(2, {
 *   type: PortType.Number,
 *   defaultValue: 0
 * })
 * matrix: number[][] = []
 *
 * // 3D array of strings
 * @Input()
 * @PortArrayNested(3, {
 *   type: PortType.String,
 *   defaultValue: ''
 * })
 * cube: string[][][] = []
 * ```
 */
export function PortArrayNested(
  depth: number,
  elementConfig: PortConfig,
  config?: BasePortFields,
) {
  const createNestedConfig = (level: number): ConfigFromPortType<PortType.Array> => {
    if (level === 0) {
      return {
        type: PortType.Array,
        elementConfig,
        defaultValue: [],
        ...(config
          ? {
              id: config.id,
              title: config.title,
              key: config.key,
              description: config.description,
              direction: config.direction,
              optional: config.optional,
              metadata: config.metadata,
              parentId: config.parentId,
              nodeId: config.nodeId,
            }
          : {}),
      }
    }

    return {
      type: PortType.Array,
      elementConfig: createNestedConfig(level - 1),
      defaultValue: [],
      ...(config
        ? {
            id: config.id,
            title: config.title,
            key: config.key,
            description: config.description,
            direction: config.direction,
            optional: config.optional,
            metadata: config.metadata,
            parentId: config.parentId,
            nodeId: config.nodeId,
          }
        : {}),
    }
  }

  return PortArray(createNestedConfig(depth - 1))
}
