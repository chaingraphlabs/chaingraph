import type { PortConfig } from '@chaingraph/types'
import superjson from 'superjson'

export function serializeBasePortConfig(config: PortConfig): string {
  return superjson.stringify({ ...config })
}
