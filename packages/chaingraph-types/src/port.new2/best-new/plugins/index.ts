import type { IPortPlugin, PortType } from '../base/types'
import { portRegistry } from '../registry/PortRegistry'
import { NumberPortPlugin } from './NumberPortPlugin'
import { StringPortPlugin } from './StringPortPlugin'

/**
 * Export all plugins for individual use
 */
export {
  NumberPortPlugin,
  StringPortPlugin,
}

/**
 * List of all available plugins
 */
export const ALL_PLUGINS = [
  NumberPortPlugin,
  StringPortPlugin,
] as const

/**
 * Register all available plugins with the registry
 */
export function registerAllPlugins(): void {
  // Use type assertion since we know these are valid plugins
  ALL_PLUGINS.forEach((plugin) => {
    portRegistry.register(plugin as IPortPlugin<PortType>)
  })
}

/**
 * Helper to register specific plugins
 */
export function registerPlugins<T extends PortType>(plugins: IPortPlugin<T>[]): void {
  plugins.forEach((plugin) => {
    portRegistry.register(plugin)
  })
}

/**
 * Export validation functions from each plugin
 */
export { validateNumberValue } from './NumberPortPlugin'
/**
 * Export type guards from each plugin
 */
export {
  isNumberPortConfig,
  isNumberValue,
} from './NumberPortPlugin'

/**
 * Export helper functions for creating values and configs
 */
export {
  createNumberConfig,
  createNumberValue,
} from './NumberPortPlugin'

export { validateStringValue } from './StringPortPlugin'

export {
  isStringPortConfig,
  isStringValue,
} from './StringPortPlugin'

export {
  createStringConfig,
  createStringValue,
} from './StringPortPlugin'
