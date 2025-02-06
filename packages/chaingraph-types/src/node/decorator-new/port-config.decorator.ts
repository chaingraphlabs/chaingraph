import { PortDirection } from '@chaingraph/types/port-new/base'
import { getPortMetadata, updatePortMetadata } from './metadata-storage'
import 'reflect-metadata'

/**
 * Name decorator to add a custom name to a port.
 * This decorator updates the port metadata with a new "name" property.
 *
 * @param portName The custom name for the port.
 */
export function Name(portName: string): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    // Update the port metadata with the provided name value.
    updatePortMetadata(target, propertyKey, { name: portName })
  }
}

/**
 * Description decorator to add a description to a port.
 * This decorator updates the port metadata with a new "description" property.
 *
 * @param portDescription The description text for the port.
 */
export function Description(portDescription: string): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    // Update the port metadata with the provided description value.
    updatePortMetadata(target, propertyKey, { description: portDescription })
  }
}

/**
 * The @Input() decorator sets the port's direction to "input".
 */
export function Input(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    updatePortMetadata(target, propertyKey, { direction: PortDirection.Input })
  }
}

/**
 * The @Output() decorator sets the port's direction to "output".
 */
export function Output(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    updatePortMetadata(target, propertyKey, { direction: PortDirection.Output })
  }
}

/**
 * DefaultValue decorator to set a default value for a port.
 * This decorator updates the port metadata with a new "defaultValue" property.
 *
 * @param value The default value to be used for the port.
 */
export function DefaultValue<T>(value: T): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    updatePortMetadata(target, propertyKey, { defaultValue: value })
  }
}

/**
 * Id decorator to assign a custom identifier to a port.
 * This decorator updates the port metadata with a new "id" property.
 *
 * @param portId The custom id for the port.
 */
export function Id(portId: string): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    updatePortMetadata(target, propertyKey, { id: portId })
  }
}

/**
 * Title decorator to set a title for a port.
 * This decorator updates the port metadata with a new "title" property.
 *
 * @param title The title for the port.
 */
export function Title(title: string): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    updatePortMetadata(target, propertyKey, { title })
  }
}

/**
 * Metadata decorator to add arbitrary metadata key/value pairs to a port.
 * This decorator updates the port metadata by merging the provided meta key and value.
 *
 * @param key The metadata key to add.
 * @param value The metadata value associated with the key.
 */
export function Metadata(key: string, value: any): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    // Retrieve the current metadata for the port
    const currentMeta = getPortMetadata(target.constructor, propertyKey)?.metadata || {}
    // Merge with the provided key/value
    const updatedMeta = { ...currentMeta, [key]: value }
    updatePortMetadata(target, propertyKey, { metadata: updatedMeta })
  }
}
