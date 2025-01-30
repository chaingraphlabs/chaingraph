import { PortType } from '../config/constants'
import { registerAnyPort } from '../ports/any.port'
import { registerArrayPort } from '../ports/array.port'
import { registerBooleanPort } from '../ports/boolean.port'
import { registerNumberPort } from '../ports/number.port'
import { registerObjectPort } from '../ports/object.port'
import { registerStreamPort } from '../ports/stream.port'
import { registerStringPort } from '../ports/string.port'
import { PortFactory } from './port-factory'

type RegistrationFunction = () => void

/**
 * Register all port types in the factory
 */
export function registerAllPorts(): void {
  // Clear existing registrations
  PortFactory.clear()

  // Register all ports
  registerStringPort()
  registerNumberPort()
  registerBooleanPort()
  registerObjectPort()
  registerArrayPort()
  registerStreamPort()
  registerAnyPort()
}

/**
 * Register a subset of port types for testing
 */
export function registerTestPorts(...types: PortType[]): void {
  // Clear existing registrations
  PortFactory.clear()

  // Map of port types to their registration functions
  const registrationMap: Partial<Record<PortType, RegistrationFunction>> = {
    [PortType.String]: registerStringPort,
    [PortType.Number]: registerNumberPort,
    [PortType.Boolean]: registerBooleanPort,
    [PortType.Object]: registerObjectPort,
    [PortType.Array]: registerArrayPort,
    [PortType.Stream]: registerStreamPort,
    [PortType.Any]: registerAnyPort,
  }

  // Register only the specified types
  for (const type of types) {
    const registerFn = registrationMap[type]
    if (!registerFn) {
      throw new Error(`Unsupported port type: ${type}`)
    }
    registerFn()
  }
}
