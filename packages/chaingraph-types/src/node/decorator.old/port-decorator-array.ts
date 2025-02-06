import type {
  ArrayPortConfig,
  IPortConfig,
  NumberPortConfig,
  ObjectPortConfig,
  ObjectSchema,
  PortDirection,
  StringPortConfig,
} from '@chaingraph/types/port-new/base'
import { PortArray } from '@chaingraph/types/node'

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
  elementConfig?: Omit<StringPortConfig, 'type'>
}) {
  const itemConfig: StringPortConfig = {
    type: 'string',
    defaultValue: { type: 'string', value: '' },
    ...config?.elementConfig,
  }

  const arrayConfig: ArrayPortConfig = {
    type: 'array',
    itemConfig,
    defaultValue: { type: 'array', value: [] },
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
  elementConfig?: Omit<NumberPortConfig, 'type'>
}) {
  const itemConfig: NumberPortConfig = {
    type: 'number',
    defaultValue: { type: 'number', value: 0 },
    ...config?.elementConfig,
  }

  const arrayConfig: ArrayPortConfig = {
    type: 'array',
    itemConfig,
    defaultValue: { type: 'array', value: [] },
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
    itemConfig?: Omit<ObjectPortConfig, 'type' | 'schema'>
  },
) {
  const schema: ObjectSchema = {
    properties: {},
    type: objectType.name,
  }

  const itemConfig: ObjectPortConfig = {
    type: 'object',
    schema,
    defaultValue: { type: 'object', value: {} },
    ...config?.itemConfig,
  }

  const arrayConfig: ArrayPortConfig = {
    type: 'array',
    itemConfig,
    defaultValue: { type: 'array', value: [] },
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
  itemConfig: IPortConfig,
  config?: BasePortFields,
) {
  const createNestedConfig = (level: number): ArrayPortConfig => {
    if (level === 0) {
      return {
        type: 'array',
        itemConfig,
        defaultValue: { type: 'array', value: [] },
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
      type: 'array',
      itemConfig: createNestedConfig(level - 1),
      defaultValue: { type: 'array', value: [] },
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
