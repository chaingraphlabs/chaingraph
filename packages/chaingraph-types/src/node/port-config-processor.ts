import type { ConfigFromPortType, ObjectSchema, PortConfig } from '@chaingraph/types/port.new'
// import type {
//   AnyPortConfig,
//   ArrayPortConfig,
//   EnumPortConfig,
//   ObjectPortConfig,
//   ObjectSchema,
//   StreamInputPortConfig,
//   StreamOutputPortConfig,
// } from '@chaingraph/types'
import type { INode } from './interface'

import { getOrCreateNodeMetadata } from '@chaingraph/types/node/decorator'
import { PortType } from '@chaingraph/types/port.new'
import Decimal from 'decimal.js'
import { v7 as uuidv7 } from 'uuid'

export interface Context {
  nodeId: string
  parentPortConfig: PortConfig | null
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
          this.deepCopy(portConfig), // Clone to avoid mutating original
          {
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
  }

  /**
   * Recursively processes a port configuration, returning a new object with all fields properly set.
   * @param portConfig The port configuration to process.
   * @param context The context for processing, including parent information.
   * @returns The processed port configuration.
   */
  private processPortConfig(
    portConfig: PortConfig,
    context: Context,
  ): PortConfig {
    // Assign basic fields and get a new portConfig
    portConfig = this.assignBasicFields(portConfig, context)

    // Process nested configurations based on port kind
    if (portConfig.type === PortType.Object) {
      portConfig = this.processObjectPortConfig(portConfig, context)
    } else if (portConfig.type === PortType.Array) {
      portConfig = this.processArrayPortConfig(portConfig, context)
    } else if (portConfig.type === PortType.Enum) {
      portConfig = this.processEnumPortConfig(portConfig, context)
    } else if (portConfig.type === PortType.Any) {
      portConfig = this.processAnyPortConfig(portConfig, context)
    } else if (portConfig.type === PortType.Stream && portConfig.mode === 'input') {
      portConfig = this.processStreamInputPortConfig(portConfig, context)
    } else if (portConfig.type === PortType.Stream && portConfig.mode === 'output') {
      portConfig = this.processStreamOutputPortConfig(portConfig, context)
    } else if (
      portConfig.type === PortType.String
      || portConfig.type === PortType.Number
      || portConfig.type === PortType.Boolean
    ) {
      // For primitive port configs, no further processing is needed
      // All necessary fields have been assigned in 'assignBasicFields'
    } else {
      throw new Error(`PortConfigProcessor: unsupported port kind: ${(portConfig as any).kind}`)
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
    context: Context,
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

    // TODO: needs to decide how to handle id!!!
    // if (parentPortConfig?.id) {
    //   newPortConfig.id = `${parentPortConfig.id}.${propertyKey}` || this.generateSortableUUID()
    // } else {
    //   newPortConfig.id = propertyKey || this.generateSortableUUID()
    // }
    newPortConfig.id = portConfig.id || this.generateSortableUUID()

    // Assign key
    if (!newPortConfig.key) {
      newPortConfig.key = newPortConfig.title || newPortConfig.id
    }

    // Assign defaultValue
    if (newPortConfig.defaultValue === undefined && propertyKey && propertyValue !== undefined) {
      newPortConfig.defaultValue = this.deepCopy(propertyValue)
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

  private deepCopy(obj: any): any {
    let copy

    // Handle the 3 simple types, and null or undefined
    if (obj == null || typeof obj != 'object')
      return obj

    // Handle Date
    if (obj instanceof Date) {
      copy = new Date()
      copy.setTime(obj.getTime())
      return copy
    }

    // Handle Array
    if (Array.isArray(obj)) {
      copy = []
      for (let i = 0, len = obj.length; i < len; i++) {
        copy[i] = this.deepCopy(obj[i])
      }
      return copy
    }

    if (Decimal.isDecimal(obj)) {
      return new Decimal(obj)
    }

    if (typeof obj === 'number') {
      return obj
    }

    // Handle Object
    if (obj instanceof Object) {
      copy = {}
      for (const attr in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, attr))
          (copy as any)[attr] = this.deepCopy(obj[attr])
      }

      // Copy type information
      return copy
    }

    throw new Error('Unable to copy obj! Its type isn\'t supported.')
  }

  /**
   * Processes an object port configuration, inferring schema if necessary and processing nested ports.
   * Returns a new ObjectPortConfig with the processed schema.
   * @param portConfig The object port configuration to process.
   * @param context The processing context.
   * @returns A new processed ObjectPortConfig.
   */
  private processObjectPortConfig(
    portConfig: ConfigFromPortType<PortType.Object>,
    context: Context,
  ): ConfigFromPortType<PortType.Object> {
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
      const propertyContext: Context = {
        nodeId,
        parentPortConfig: newPortConfig,
        propertyKey: key,
        propertyValue: propertyValue?.[key],
      }

      if (nestedPortConfig.type === PortType.Object) {
        propertyContext.propertyValue = this.deepCopy(portConfig.defaultValue?.[key])
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
    portConfig: ConfigFromPortType<PortType.Array>,
    context: Context,
  ): ConfigFromPortType<PortType.Array> {
    let newPortConfig = { ...portConfig } // Clone to avoid mutation

    const elementConfig = newPortConfig.elementConfig
    if (!elementConfig || !elementConfig.type) {
      throw new Error(`Element kind or config for array port '${context.propertyKey}' is not defined.`)
    }

    if (typeof elementConfig === 'object') {
      const processedElementConfig = this.processPortConfig(
        // this.deepCopy(elementConfig),
        elementConfig,
        {
          nodeId: context.nodeId,
          parentPortConfig: newPortConfig,
          // TODO: needs to decide how to handle id!!!
          // propertyKey: elementConfig.id ? `[{${elementConfig.id}}]` : `[{i}]`,
          propertyKey: elementConfig.id ?? this.generateSortableUUID(),
          propertyValue: newPortConfig.elementConfig,
        },
      )

      newPortConfig = {
        ...newPortConfig,
        elementConfig: processedElementConfig,
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
    portConfig: EnumPortConfig<any>,
    context: Context,
  ): EnumPortConfig<any> {
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
    if (newPortConfig.connectedPortConfig) {
      newPortConfig.connectedPortConfig = this.processPortConfig(
        { ...newPortConfig.connectedPortConfig },
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
  private processStreamInputPortConfig(
    portConfig: StreamInputPortConfig<any>,
    context: Context,
  ): StreamInputPortConfig<any> {
    const newPortConfig = { ...portConfig }

    if (!newPortConfig.valueType) {
      throw new Error(`StreamInputPortConfig must have a valueType defined for port '${context.propertyKey}'.`)
    }

    newPortConfig.valueType = this.processPortConfig(
      { ...newPortConfig.valueType },
      {
        nodeId: context.nodeId,
        parentPortConfig: newPortConfig,
        propertyKey: 'value',
        propertyValue: null,
      },
    )

    return newPortConfig
  }

  /**
   * Processes a StreamOutputPortConfig.
   * @param portConfig The StreamOutputPortConfig to process.
   * @param context The processing context.
   * @returns The processed StreamOutputPortConfig.
   */
  private processStreamOutputPortConfig(
    portConfig: StreamOutputPortConfig<any>,
    context: Context,
  ): StreamOutputPortConfig<any> {
    const newPortConfig = { ...portConfig }

    if (!newPortConfig.valueType) {
      throw new Error(`StreamOutputPortConfig must have a valueType defined for port '${context.propertyKey}'.`)
    }

    newPortConfig.valueType = this.processPortConfig(
      { ...newPortConfig.valueType },
      {
        nodeId: context.nodeId,
        parentPortConfig: newPortConfig,
        propertyKey: 'value',
        propertyValue: null,
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
