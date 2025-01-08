import type { ObjectSchema, PortConfig } from '@chaingraph/types'
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
      const newPortConfig = this.processPortConfig({
        ...portConfig,
      }, {
        node,
        nodeId,
        parentPortConfig: null,
        property: (node as any)[propertyKey],
        propertyKey,
      })

      // Update the port config in the node metadata
      nodeMetadata.portsConfig.set(propertyKey, newPortConfig)
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
  ): PortConfig {
    const { node, nodeId, parentPortConfig, propertyKey, property } = context

    // id
    // if (!portConfig.id) {
    // portConfig.id = propertyKey || this.generateSortableUUID()
    if (portConfig.id === undefined) {
      if (parentPortConfig?.id) {
        portConfig.id = `${parentPortConfig?.id}.${propertyKey}` || this.generateSortableUUID()
        // if (!isArrayPortConfig(parentPortConfig)) {
        // } else {
        //   portConfig.id = `${parentPortConfig?.id}` || this.generateSortableUUID()
        // }
      } else {
        portConfig.id = propertyKey || this.generateSortableUUID()
      }
    } else {
      if (parentPortConfig?.id) {
        portConfig.id = `${parentPortConfig?.id}.${portConfig.id}` || this.generateSortableUUID()
        // if (!isArrayPortConfig(parentPortConfig)) {
        // } else {
        //   portConfig.id = `${portConfig.id}` || this.generateSortableUUID()
        // }
      } else {
        portConfig.id = portConfig.id || this.generateSortableUUID()
      }
    }
    // }

    // name
    if (!portConfig.name) {
      portConfig.name = portConfig.title || portConfig.id
    }

    // defaultValue
    if (portConfig.defaultValue === undefined && propertyKey && property !== undefined) {
      // Try to get the value from the node's property
      if (Object.prototype.hasOwnProperty.call(node, propertyKey)) {
        portConfig.defaultValue = property
      }
    }

    // parentId
    if (
      (!portConfig.parentId && parentPortConfig?.id)
      || (parentPortConfig?.id !== undefined && portConfig.parentId !== parentPortConfig?.id)
    ) {
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
        // Update the port config in the schema

        if (isObjectPortConfig(nestedPortConfig)) {
          portConfig.schema.properties[key] = this.processPortConfig({
            ...nestedPortConfig,
          }, {
            node: property, // Move into the object instance
            nodeId,
            parentPortConfig: portConfig,
            propertyKey: key,
            property: portConfig.defaultValue?.[key],
          })
        } else {
          const parentID = portConfig.id

          // if (isArrayPortConfig(portConfig)) {
          //   parentID = ''
          // }

          portConfig.schema.properties[key] = this.processPortConfig({
            ...nestedPortConfig,
          }, {
            node: property, // Move into the object instance
            nodeId,
            parentPortConfig: {
              ...portConfig,
              id: parentID,
            },
            propertyKey: key,
            property: property?.[key],
          })
        }
      }
    } else if (isArrayPortConfig(portConfig)) {
      if (!portConfig.elementConfig || !portConfig.elementConfig.kind) {
        throw new Error(`Element king type or config for array port '${propertyKey}' is not defined.`)
      }

      const kind = portConfig.elementConfig.kind
      if (typeof kind === 'function') {
        // elementConfig is a class constructor
        const elementPrototype = (kind as any).prototype
        const elementMetadata = getOrCreateNodeMetadata(elementPrototype)
        if (!elementMetadata.portsConfig) {
          throw new Error(`No portsConfig found in element class metadata for array port '${propertyKey}'.`)
        }

        // Build the schema for the element
        const elementSchema = {
          id: elementMetadata?.id,
          type: elementMetadata?.type,
          properties: {} as { [key: string]: PortConfig },
        } as ObjectSchema

        for (const [nestedPropertyKey, nestedPortConfig] of elementMetadata.portsConfig.entries()) {
          elementSchema.properties[nestedPropertyKey] = nestedPortConfig
        }

        portConfig.elementConfig = {
          kind: PortKindEnum.Object,
          schema: elementSchema,
          defaultValue: (portConfig.elementConfig as any).defaultValue,
        }

        portConfig.elementConfig = this.processPortConfig({
          ...portConfig.elementConfig,
        }, {
          node,
          nodeId,
          parentPortConfig: {
            ...portConfig,
          },
          propertyKey: `${portConfig.id}.element`,
          property: elementPrototype,
        })
      } else if (isPortConfig(portConfig.elementConfig)) {
        portConfig.elementConfig = this.processPortConfig({
          ...portConfig.elementConfig,
        }, {
          node,
          nodeId,
          parentPortConfig: {
            ...portConfig,
            // id: '',
          },
          propertyKey: `${portConfig.id}.element`,
          property: portConfig.elementConfig,
        })
      } else {
        throw new Error(`Invalid elementConfig for array port '${propertyKey}'.`)
      }
    } else if (isEnumPortConfig(portConfig)) {
      // Enum port-specific processing
      if (portConfig.options && portConfig.options.length > 0) {
        for (const [key, option] of portConfig.options.entries()) {
          // Update the option in the options array
          portConfig.options[key] = this.processPortConfig({
            ...option,
          }, {
            node,
            nodeId,
            parentPortConfig: portConfig,
            propertyKey: option.id || this.generateSortableUUID(),
            property: option,
          })
        }
      }
    } else {
      // No further processing needed
      console.log('No further processing needed for port:', portConfig)
    }

    return portConfig
  }

  private generateSortableUUID(): string {
    // Implement a sortable UUID if necessary, e.g., using ULID
    // For simplicity, we'll use UUIDv4 here
    return uuidv7()
  }
}
