import type {
  ArrayPortConfig,
  EnumPortConfig,
  ObjectPortConfig,
  ObjectSchema,
  PortConfig,
} from '@chaingraph/types'
import type { INode } from './interface'
import {
  getOrCreateNodeMetadata,
  isArrayPortConfig,
  isEnumPortConfig,
  isObjectPortConfig,
  isPortConfig,
  PortKindEnum,
} from '@chaingraph/types'
import { v7 as uuidv7 } from 'uuid' // For generating UUIDs.

export class PortConfigProcessor {
  /**
   * Processes all port configurations of a node, ensuring they are fully specified.
   * @param node The node whose ports are to be processed.
   */
  processNodePorts(node: INode): void {
    const nodeMetadata = getOrCreateNodeMetadata(node)
    const nodeId = node.id

    if (!nodeMetadata.portsConfig) {
      throw new Error('No portsConfig found in node metadata.')
    }

    // Process each port configuration associated with the node
    for (const [propertyKey, portConfig] of nodeMetadata.portsConfig.entries()) {
      const processedPortConfig = this.processPortConfig(
        { ...portConfig }, // Clone to avoid mutating original
        {
          node,
          nodeId,
          parentPortConfig: null,
          propertyKey,
          propertyValue: (node as any)[propertyKey],
        },
      )

      // Update the port config in the node metadata
      nodeMetadata.portsConfig.set(propertyKey, processedPortConfig)
    }
  }

  /**
   * Recursively processes a port configuration, returning a new object with all fields properly set.
   * @param portConfig The port configuration to process.
   * @param context The context for processing, including parent information.
   * @returns The processed port configuration.
   */
  private processPortConfig(
    portConfig: PortConfig,
    context: {
      node: any
      nodeId: string
      parentPortConfig: PortConfig | null
      propertyKey: string
      propertyValue: any
    },
  ): PortConfig {
    // Assign basic fields and get a new portConfig
    portConfig = this.assignBasicFields(portConfig, context)

    // Process nested configurations based on port kind
    if (isObjectPortConfig(portConfig)) {
      portConfig = this.processObjectPortConfig(portConfig, context)
    } else if (isArrayPortConfig(portConfig)) {
      portConfig = this.processArrayPortConfig(portConfig, context)
    } else if (isEnumPortConfig(portConfig)) {
      portConfig = this.processEnumPortConfig(portConfig, context)
    } else {
      // Primitive or unhandled port kinds
      // No further processing needed
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
    portConfig: PortConfig,
    context: {
      node: any
      nodeId: string
      parentPortConfig: PortConfig | null
      propertyKey: string
      propertyValue: any
    },
  ): PortConfig {
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

    if (parentPortConfig?.id) {
      newPortConfig.id = `${parentPortConfig.id}.${propertyKey}` || this.generateSortableUUID()
    } else {
      newPortConfig.id = propertyKey || this.generateSortableUUID()
    }

    // Assign name
    if (!newPortConfig.name) {
      newPortConfig.name = newPortConfig.title || newPortConfig.id
    }

    // Assign defaultValue
    if (newPortConfig.defaultValue === undefined && propertyKey && propertyValue !== undefined) {
      newPortConfig.defaultValue = propertyValue
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
    if (newPortConfig.optional === undefined && newPortConfig.defaultValue === undefined) {
      newPortConfig.optional = true
    }

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
    portConfig: ObjectPortConfig<any>,
    context: {
      node: any
      nodeId: string
      parentPortConfig: PortConfig | null
      propertyKey: string
      propertyValue: any
    },
  ): ObjectPortConfig<any> {
    if (!isObjectPortConfig(portConfig)) {
      throw new Error(`Invalid object port configuration for property '${context.propertyKey}'.`)
    }
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
        properties: {} as { [key: string]: PortConfig },
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
    const processedProperties: { [key: string]: PortConfig } = {}

    for (const [key, nestedPortConfig] of Object.entries(newPortConfig.schema.properties)) {
      const propertyContext = {
        node: propertyValue, // Move into the object instance
        nodeId,
        parentPortConfig: newPortConfig,
        propertyKey: key,
        propertyValue: propertyValue?.[key],
      }

      if (isObjectPortConfig(nestedPortConfig)) {
        propertyContext.propertyValue = portConfig.defaultValue?.[key]
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
    portConfig: ArrayPortConfig<any>,
    context: {
      node: any
      nodeId: string
      parentPortConfig: PortConfig | null
      propertyKey: string
      propertyValue: any
    },
  ): ArrayPortConfig<any> {
    const { node } = context

    let newPortConfig = { ...portConfig } // Clone to avoid mutation

    const elementConfig = newPortConfig.elementConfig
    if (!elementConfig || !elementConfig.kind) {
      throw new Error(`Element kind or config for array port '${context.propertyKey}' is not defined.`)
    }

    if (typeof elementConfig.kind === 'function') {
      // ElementConfig is a class constructor
      const elementClass = elementConfig.kind
      const elementPrototype = elementClass.prototype
      const elementMetadata = getOrCreateNodeMetadata(elementPrototype)

      if (!elementMetadata.portsConfig) {
        throw new Error(`No portsConfig found in element class metadata for array port '${context.propertyKey}'.`)
      }

      // Build the schema for the element
      const elementSchema: ObjectSchema = {
        id: elementMetadata?.id ? (elementMetadata.id as string) : this.generateSortableUUID(),
        type: elementMetadata.type,
        properties: {},
      }

      for (const [nestedPropertyKey, nestedPortConfig] of elementMetadata.portsConfig.entries()) {
        elementSchema.properties[nestedPropertyKey] = nestedPortConfig
      }

      // Replace elementConfig with the inferred ObjectPortConfig
      // const newElementConfig: ObjectPortConfig<any> = {
      portConfig.elementConfig = {
        kind: PortKindEnum.Object,
        schema: elementSchema,
        defaultValue: (elementConfig as any).defaultValue, // Retain defaultValue if present
      }

      // Process the elementConfig
      const processedElementConfig = this.processPortConfig(
        { ...elementConfig },
        {
          node: context.node,
          nodeId: context.nodeId,
          parentPortConfig: newPortConfig,
          propertyKey: elementConfig.id ? `[{${elementConfig.id}}]` : `[{i}]`,
          propertyValue: elementPrototype,
        },
      )

      newPortConfig = {
        ...newPortConfig,
        elementConfig: processedElementConfig,
      }
    } else if (isPortConfig(elementConfig)) {
      const processedElementConfig = this.processPortConfig(
        { ...elementConfig },
        {
          node: context.node,
          nodeId: context.nodeId,
          parentPortConfig: newPortConfig,
          propertyKey: elementConfig.id ? `[{${elementConfig.id}}]` : `[{i}]`,
          propertyValue: newPortConfig.elementConfig,
        },
      )

      newPortConfig = {
        ...newPortConfig,
        elementConfig: processedElementConfig,
      }
    } else {
      throw new Error(`Invalid elementConfig for array port '${context.propertyKey}'.`)
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
    portConfig: EnumPortConfig<any>,
    context: {
      node: any
      nodeId: string
      parentPortConfig: PortConfig | null
      propertyKey: string
      propertyValue: any
    },
  ): EnumPortConfig<any> {
    let newPortConfig = { ...portConfig } // Clone to avoid mutation

    if (newPortConfig.options && newPortConfig.options.length > 0) {
      const processedOptions = newPortConfig.options.map((option) => {
        return this.processPortConfig(
          { ...option },
          {
            node: context.node,
            nodeId: context.nodeId,
            parentPortConfig: newPortConfig,
            propertyKey: option.id || this.generateSortableUUID(),
            propertyValue: option,
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
   * Generates a sortable UUID using UUID version 7.
   * @returns A sortable UUID string.
   */
  private generateSortableUUID(): string {
    return uuidv7()
  }
}
