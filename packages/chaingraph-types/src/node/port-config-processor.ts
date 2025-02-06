import type {
  AnyPortConfig,
  ArrayPortConfig,
  EnumPortConfig,
  IPortConfig,
  ObjectPortConfig,
  ObjectSchema,
  StreamPortConfig,
} from '@chaingraph/types/port-new/base'

import type { INode } from './interface'
import {
  getOrCreateNodeMetadata,
} from '@chaingraph/types/node/decorator-new/getOrCreateNodeMetadata'
import { deepCopy } from '@chaingraph/types/utils/deep-copy'
import { v7 as uuidv7 } from 'uuid'

export interface Context {
  nodeId: string
  parentPortConfig: IPortConfig | null
  propertyKey: string
  propertyValue: any
}

export class PortConfigProcessor {
  /**
   * Processes all port configurations of a node, ensuring they are fully specified.
   * @param node The node whose ports are to be processed.
   */
  processNodePorts(node: INode): void {
    const nodeMetadata = getOrCreateNodeMetadata(node)
    const nodeId = node.id

    if (nodeMetadata.portsConfig) {
      // Process each port configuration associated with the node
      for (const [propertyKey, portConfig] of nodeMetadata.portsConfig.entries()) {
        const processedPortConfig = this.processPortConfig(
          // { ...portConfig }, // Clone to avoid mutating original
          deepCopy(portConfig), // Clone to avoid mutating original
          {
            nodeId,
            parentPortConfig: null,
            propertyKey,
            propertyValue: deepCopy((node as any)[propertyKey]),
          },
        )

        // Update the port config in the node metadata
        nodeMetadata.portsConfig.set(propertyKey, processedPortConfig)
      }
    }
  }

  /**
   * Recursively processes a port configuration, returning a new object with all fields properly set.
   * @param portConfig The port configuration to process.
   * @param context The context for processing, including parent information.
   * @returns The processed port configuration.
   */
  private processPortConfig(
    portConfig: IPortConfig,
    context: Context,
  ): IPortConfig {
    // Assign basic fields and get a new portConfig
    portConfig = this.assignBasicFields(portConfig, context)

    // Process nested configurations based on port kind
    if (portConfig.type === 'object') {
      portConfig = this.processObjectPortConfig(portConfig, context)
    } else if (portConfig.type === 'array') {
      portConfig = this.processArrayPortConfig(portConfig, context)
    } else if (portConfig.type === 'enum') {
      portConfig = this.processEnumPortConfig(portConfig, context)
    } else if (portConfig.type === 'any') {
      portConfig = this.processAnyPortConfig(portConfig, context)
    } else if (portConfig.type === 'stream') {
      portConfig = this.processStreamPortConfig(portConfig, context)
    } else if (
      portConfig.type === 'string'
      || portConfig.type === 'number'
      || portConfig.type === 'boolean'
    ) {
      // For primitive port configs, no further processing is needed
      // All necessary fields have been assigned in 'assignBasicFields'
    } else {
      throw new Error(`PortConfigProcessor: unsupported port type: ${(portConfig as any).type}`)
    }

    return portConfig
  }

  /**
   * Assigns basic fields to the port configuration and returns a new port configuration.
   * @param portConfig The port configuration to assign basic fields to.
   * @param context The processing context.
   * @returns A new port configuration with basic fields assigned.
   */
  private assignBasicFields(
    portConfig: IPortConfig,
    context: Context,
  ): IPortConfig {
    const { nodeId, parentPortConfig, propertyKey, propertyValue } = context

    // Create a new object to avoid mutation
    const newPortConfig = { ...portConfig }

    // Assign ID
    // if (newPortConfig.id === undefined) {
    //   if (parentPortConfig?.id) {
    //     newPortConfig.id = `${parentPortConfig.id}.${propertyKey}` || this.generateSortableUUID()
    //   } else {
    //     newPortConfig.id = propertyKey || this.generateSortableUUID()
    //   }
    // } else {
    //   if (parentPortConfig?.id) {
    //     newPortConfig.id = `${parentPortConfig.id}.${newPortConfig.id}`
    //   } else {
    //     portConfig.id = portConfig.id || this.generateSortableUUID()
    //   }
    // }

    // TODO: needs to decide how to handle id!!!
    // if (parentPortConfig?.id) {
    //   newPortConfig.id = `${parentPortConfig.id}.${propertyKey}` || this.generateSortableUUID()
    // } else {
    //   newPortConfig.id = propertyKey || this.generateSortableUUID()
    // }
    newPortConfig.id = portConfig.id || this.generateSortableUUID()

    // Assign key
    if (!newPortConfig.key) {
      newPortConfig.key = propertyKey ?? newPortConfig.title ?? newPortConfig.id
    }

    // Assign defaultValue
    // TODO: assign defaultValue
    // if (newPortConfig.defaultValue === undefined && propertyKey && propertyValue !== undefined) {
    //   newPortConfig.defaultValue = deepCopy(propertyValue)
    // }

    // If the node field has an explicit value, override the defaultValue from the config.
    if (propertyValue !== undefined) {
      // Log warning if needed (optional)
      newPortConfig.defaultValue = deepCopy(propertyValue)
    }

    // Assign parentId
    if (
      (!newPortConfig.parentId && parentPortConfig?.id)
      || (parentPortConfig?.id !== undefined && newPortConfig.parentId !== parentPortConfig.id)
    ) {
      newPortConfig.parentId = parentPortConfig.id
    }

    // Assign nodeId
    if (!newPortConfig.nodeId) {
      newPortConfig.nodeId = nodeId
    }

    // Assign direction
    if (!newPortConfig.direction && parentPortConfig?.direction !== undefined) {
      newPortConfig.direction = parentPortConfig.direction
    }

    // Assign optional
    // if (newPortConfig.optional === undefined && newPortConfig.defaultValue === undefined) {
    //   newPortConfig.optional = true
    // }

    return newPortConfig
  }

  /**
   * Processes an object port configuration, inferring schema if necessary and processing nested ports.
   * Returns a new ObjectPortConfig with the processed schema.
   * @param portConfig The object port configuration to process.
   * @param context The processing context.
   * @returns A new processed ObjectPortConfig.
   */
  private processObjectPortConfig(
    portConfig: ObjectPortConfig,
    context: Context,
  ): ObjectPortConfig {
    const { propertyValue, nodeId } = context

    let newPortConfig = { ...portConfig } // Clone to avoid mutation

    if (!newPortConfig.schema || !newPortConfig.schema.properties) {
      // Infer schema from the object's properties decorated with PortDecorator
      const objectInstance = propertyValue
      if (!objectInstance) {
        throw new Error(`Object instance for property '${context.propertyKey}' is not available on the node.`)
      }

      const objectMetadata = getOrCreateNodeMetadata(objectInstance)
      if (!objectMetadata.portsConfig) {
        throw new Error(`No portsConfig found in object metadata for property '${context.propertyKey}'.`)
      }

      // Build the object schema
      const schema: ObjectSchema = {
        id: objectMetadata?.id ? (objectMetadata.id as string) : this.generateSortableUUID(),
        type: objectMetadata.type,
        properties: {} as Record<string, IPortConfig>,
      }

      for (const [nestedPropertyKey, nestedPortConfig] of objectMetadata.portsConfig.entries()) {
        schema.properties[nestedPropertyKey] = nestedPortConfig
      }

      newPortConfig = {
        ...newPortConfig,
        schema,
      }
    }

    // Process each property in the schema
    const processedProperties: { [key: string]: IPortConfig } = {}

    for (const [key, nestedPortConfig] of Object.entries(newPortConfig.schema.properties)) {
      const propertyContext: Context = {
        nodeId,
        parentPortConfig: newPortConfig,
        propertyKey: key,
        propertyValue: deepCopy(propertyValue?.[key]),
      }

      if (nestedPortConfig.type === 'object') {
        propertyContext.propertyValue = deepCopy(portConfig.defaultValue?.[key])
      }

      processedProperties[key] = this.processPortConfig(
        { ...nestedPortConfig }, // Clone to avoid mutation
        propertyContext,
      )
    }

    // Return a new ObjectPortConfig with the processed properties
    return {
      ...newPortConfig,
      schema: {
        ...newPortConfig.schema,
        properties: processedProperties,
      },
    }
  }

  /**
   * Processes an array port configuration, handling the element configuration appropriately.
   * Returns a new ArrayPortConfig with the processed element configuration.
   * @param portConfig The array port configuration to process.
   * @param context The processing context.
   * @returns A new processed ArrayPortConfig.
   */
  private processArrayPortConfig(
    portConfig: ArrayPortConfig,
    context: Context,
  ): ArrayPortConfig {
    let newPortConfig: ArrayPortConfig = { ...portConfig } as ArrayPortConfig // Clone to avoid mutation

    const itemConfig = newPortConfig.itemConfig
    if (!itemConfig || !itemConfig.type) {
      throw new Error(`Element kind or config for array port '${context.propertyKey}' is not defined.`)
    }

    if (typeof itemConfig === 'object') {
      const processedElementConfig = this.processPortConfig(
        // deepCopy(elementConfig),
        itemConfig,
        {
          nodeId: context.nodeId,
          parentPortConfig: newPortConfig,
          // TODO: needs to decide how to handle id!!!
          // propertyKey: itemConfig.id ? `${newPortConfig.key}.[{${itemConfig.id}}]` : `[{i}]`,
          // propertyKey: itemConfig.id ?? this.generateSortableUUID(),
          propertyKey: itemConfig.key ?? newPortConfig.key ?? itemConfig.id ?? this.generateSortableUUID(),
          propertyValue: deepCopy(newPortConfig.itemConfig?.defaultValue),
        },
      )

      newPortConfig = {
        ...newPortConfig,
        itemConfig: processedElementConfig,
      }
    } else {
      throw new TypeError(`Invalid elementConfig for array port '${context.propertyKey}'.`)
    }

    return newPortConfig
  }

  /**
   * Processes an enum port configuration by processing each option's port configuration.
   * Returns a new EnumPortConfig with the processed options.
   * @param portConfig The enum port configuration to process.
   * @param context The processing context.
   * @returns A new processed EnumPortConfig.
   */
  private processEnumPortConfig(
    portConfig: EnumPortConfig,
    context: Context,
  ): EnumPortConfig {
    let newPortConfig = { ...portConfig } // Clone to avoid mutation

    if (newPortConfig.options && newPortConfig.options.length > 0) {
      const processedOptions = newPortConfig.options.map((option) => {
        return this.processPortConfig(
          { ...option },
          {
            nodeId: context.nodeId,
            parentPortConfig: {
              ...newPortConfig,
              id: '',
            },
            propertyKey: option.id || this.generateSortableUUID(),
            propertyValue: deepCopy(option.defaultValue),
          },
        )
      })

      newPortConfig = {
        ...newPortConfig,
        options: processedOptions,
      }
    }

    return newPortConfig
  }

  /**
   * Processes an AnyPortConfig.
   * @param portConfig The AnyPortConfig to process.
   * @param context The processing context.
   * @returns The processed AnyPortConfig.
   */
  private processAnyPortConfig(
    portConfig: AnyPortConfig,
    context: Context,
  ): AnyPortConfig {
    const newPortConfig = { ...portConfig }

    // If connectedPortConfig is defined, process it
    if (newPortConfig.underlyingType) {
      newPortConfig.underlyingType = this.processPortConfig(
        { ...newPortConfig.underlyingType },
        {
          nodeId: context.nodeId,
          parentPortConfig: newPortConfig,
          propertyKey: 'connectedPort',
          propertyValue: null,
        },
      )
    }

    return newPortConfig
  }

  /**
   * Processes a StreamInputPortConfig.
   * @param portConfig The StreamInputPortConfig to process.
   * @param context The processing context.
   * @returns The processed StreamInputPortConfig.
   */
  private processStreamPortConfig(
    portConfig: StreamPortConfig,
    context: Context,
  ): StreamPortConfig {
    const newPortConfig = { ...portConfig }

    if (!newPortConfig.itemConfig) {
      throw new Error(`StreamInputPortConfig must have a valueType defined for port '${context.propertyKey}'.`)
    }

    newPortConfig.itemConfig = this.processPortConfig(
      { ...newPortConfig.itemConfig },
      {
        nodeId: context.nodeId,
        parentPortConfig: newPortConfig,
        propertyKey: 'value',
        propertyValue: newPortConfig.itemConfig.defaultValue,
      },
    )

    return newPortConfig
  }

  // /**
  //  * Infers an ObjectPortConfig from a given class constructor.
  //  * @param classConstructor The class constructor to infer from.
  //  * @param defaultValue An optional default value for the port configuration.
  //  * @returns An ObjectPortConfig inferred from the class.
  //  */
  // private inferObjectPortConfigFromClass(
  //   classConstructor: Function,
  //   defaultValue?: any,
  // ): ObjectPortConfig<any> {
  //   const elementPrototype = classConstructor.prototype
  //   const elementMetadata = getOrCreateNodeMetadata(elementPrototype)
  //
  //   if (!elementMetadata.portsConfig) {
  //     throw new Error(`No portsConfig found in class metadata for '${classConstructor.name}'.`)
  //   }
  //
  //   // Build the schema for the element
  //   const elementSchema: ObjectSchema = {
  //     id: elementMetadata.id ? (elementMetadata.id as string) : this.generateSortableUUID(),
  //     type: elementMetadata.type,
  //     properties: {},
  //   }
  //
  //   for (const [nestedPropertyKey, nestedPortConfig] of elementMetadata.portsConfig.entries()) {
  //     elementSchema.properties[nestedPropertyKey] = nestedPortConfig
  //   }
  //
  //   // Create and return the ObjectPortConfig
  //   return {
  //     kind: PortKindEnum.Object,
  //     schema: elementSchema,
  //     defaultValue,
  //   } as ObjectPortConfig<any>
  // }

  /**
   * Generates a sortable UUID using UUID version 7.
   * @returns A sortable UUID string.
   */
  private generateSortableUUID(): string {
    return uuidv7()
  }
}
