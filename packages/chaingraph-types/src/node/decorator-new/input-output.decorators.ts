import { PortDirection } from '@chaingraph/types/port-new/base'
import { updatePortDirection } from './port-decorator.utils'

import 'reflect-metadata'

/**
 * The @Input() decorator sets the port's direction to "input".
 */
export function Input(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    updatePortDirection(target, propertyKey, PortDirection.Input)
  }
}

/**
 * The @Output() decorator sets the port's direction to "output".
 */
export function Output(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    updatePortDirection(target, propertyKey, PortDirection.Output)
  }
}
