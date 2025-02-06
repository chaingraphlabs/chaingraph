import 'reflect-metadata'

// EventEmitter.defaultMaxListeners = 0

export * from './edge'
export * from './flow'
export * from './node'
export * from './port'
// Re-export MultiChannel directly for convenience
export { MultiChannel } from './port/channel/multi-channel'

export * from './utils'

export type { JSONValue } from 'superjson/dist/types'
