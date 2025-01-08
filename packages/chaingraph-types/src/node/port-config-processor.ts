import type {
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
  processNodePorts(node: INode): void {
    const nodeMetadata = getOrCreateNodeMetadata(node)
    const nodeId = node.id

    if (!nodeMetadata.portsConfig) {
      throw new Error('No portsConfig found in node metadata.')
    }

    for (const [propertyKey, portConfig] of nodeMetadata.portsConfig.entries()) {
      this.processPortConfig(portConfig, {
        node,
        nodeId,
        parentPortConfig: null,
        property: (node as any)[propertyKey],
        propertyKey,
      })
    }
  }

  private processPortConfig(
    portConfig: PortConfig,
    context: {
      node: any
      nodeId: string
      parentPortConfig: PortConfig | null
      property: any
      propertyKey: string
    },
  ): void {
    const { node, nodeId, parentPortConfig, propertyKey, property } = context

    // id
    if (!portConfig.id) {
      portConfig.id = propertyKey || this.generateSortableUUID()
    }

    // name
    if (!portConfig.name) {
      portConfig.name = portConfig.title || `${portConfig.id}_port`
    }

    // defaultValue
    if (portConfig.defaultValue === undefined && propertyKey && property !== undefined) {
      // Try to get the value from the node's property
      if (Object.prototype.hasOwnProperty.call(node, propertyKey)) {
        portConfig.defaultValue = property
      }
    }

    // parentId
    if (!portConfig.parentId && parentPortConfig?.id) {
      portConfig.parentId = parentPortConfig.id
    }

    // nodeId
    if (!portConfig.nodeId) {
      portConfig.nodeId = nodeId
    }

    // direction
    if (!portConfig.direction && parentPortConfig?.direction !== undefined) {
      portConfig.direction = parentPortConfig.direction
    }

    // optional
    if (portConfig.optional === undefined && typeof portConfig.defaultValue === 'undefined') {
      portConfig.optional = true
    }

    // Continue processing for nested configurations
    if (isObjectPortConfig(portConfig)) {
      if (!portConfig.schema || !portConfig.schema.properties) {
        // Infer the schema from the object's properties marked with PortDecorator
        const objectInstance = property
        if (!objectInstance) {
          throw new Error(`Object instance for property '${propertyKey}' is not available on the node.`)
        }

        const objectInstanceMetadata = getOrCreateNodeMetadata(objectInstance)
        if (!objectInstanceMetadata.portsConfig) {
          throw new Error(`No portsConfig found in object metadata for property '${propertyKey}'.`)
        }

        // Build the schema
        const schema = {
          id: objectInstanceMetadata?.id,
          type: objectInstanceMetadata?.type,
          properties: {} as { [key: string]: PortConfig },
        } as ObjectSchema

        for (const [nestedPropertyKey, nestedPortConfig] of objectInstanceMetadata.portsConfig.entries()) {
          schema.properties[nestedPropertyKey] = nestedPortConfig
        }

        portConfig.schema = schema
      }

      // Now process each property in the schema
      for (const [key, nestedPortConfig] of Object.entries(portConfig.schema.properties)) {
        this.processPortConfig(nestedPortConfig, {
          node: property, // Move into the object instance
          nodeId,
          parentPortConfig: portConfig,
          propertyKey: key,
          property: property?.[key],
        })
      }
    } else if (isArrayPortConfig(portConfig)) {
      if (!portConfig.elementConfig || !portConfig.elementConfig.kind) {
        throw new Error(`Element king type or config for array port '${propertyKey}' is not defined.`)
      }

      if (typeof portConfig.elementConfig.kind === 'function') {
        // elementConfig is a class constructor
        // const elementClass = portConfig.elementConfig.kind
        const elementClass = (portConfig.elementConfig as any).kind
        const elementPrototype = (elementClass as any).prototype

        const elementMetadata = getOrCreateNodeMetadata(elementPrototype)
        if (!elementMetadata.portsConfig) {
          throw new Error(`No portsConfig found in element class metadata for array port '${propertyKey}'.`)
        }

        // Build the schema for the element
        const schema = {
          id: elementMetadata?.id,
          type: elementMetadata?.type,
          properties: {} as { [key: string]: PortConfig },
        } as ObjectSchema

        for (const [nestedPropertyKey, nestedPortConfig] of elementMetadata.portsConfig.entries()) {
          schema.properties[nestedPropertyKey] = nestedPortConfig
        }

        const elementPortConfig: ObjectPortConfig<any> = {
          kind: PortKindEnum.Object,
          schema,
          defaultValue: (portConfig.elementConfig as any).defaultValue,
        }

        // Replace elementConfig with the new ObjectPortConfig
        portConfig.elementConfig = elementPortConfig

        this.processPortConfig(portConfig.elementConfig, {
          node,
          nodeId,
          parentPortConfig: portConfig,
          propertyKey: '',
          property: elementPrototype,
        })
      } else if (isPortConfig(portConfig.elementConfig)) {
        // elementConfig is already a PortConfig (e.g., for primitive types)
        // Ensure required fields are set on elementConfig
        this.processPortConfig(portConfig.elementConfig, {
          node,
          nodeId,
          parentPortConfig: portConfig,
          propertyKey: 'element',
          property: portConfig.elementConfig,
        })
      }
      //
      // if (portConfig.elementConfig) {
      //   this.processPortConfig(portConfig.elementConfig, {
      //     node,
      //     nodeId,
      //     parentPortConfig: portConfig,
      //     propertyKey: '',
      //   })
      // }
    } else if (isEnumPortConfig(portConfig)) {
      // Enum port-specific processing
      if (portConfig.options && portConfig.options.length > 0) {
        for (const option of portConfig.options) {
          this.processPortConfig(option, {
            node,
            nodeId,
            parentPortConfig: portConfig,
            propertyKey: option.id || this.generateSortableUUID(),
            property: option,
          })
        }
      }
    }
  }

  private generateSortableUUID(): string {
    // Implement a sortable UUID if necessary, e.g., using ULID
    // For simplicity, we'll use UUIDv4 here
    return uuidv7()
  }
}
