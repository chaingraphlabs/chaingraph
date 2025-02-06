import { PortDirection } from '@chaingraph/types/port-new/base'

import { updatePortMetadata } from './metadata-storage'
import 'reflect-metadata'

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
