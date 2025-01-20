import type { INode, IPort } from '@chaingraph/types'

/**
 * Traverse all ports of a node
 * @param node Node to traverse
 * @param visitor Visitor function
 */
export function portsTraverser(node: INode, visitor: (port: IPort) => void | Promise<void>) {
  for (const port of node.ports.values()) {
    visitor(port)
  }
}

/**
 * Filter ports of a node
 * @param node Node to filter
 * @param predicate Predicate function
 * @returns Filtered ports
 */
export function filterPorts(node: INode, predicate: (port: IPort) => boolean): IPort[] {
  const ports: IPort[] = []
  portsTraverser(node, (port) => {
    if (predicate(port)) {
      ports.push(port)
    }
  })
  return ports
}

/**
 * Find a port of a node
 * @param node Node to search
 * @param predicate Predicate function
 * @returns Found port or undefined
 */
export function findPort(node: INode, predicate: (port: IPort) => boolean): IPort | undefined {
  let foundPort: IPort | undefined
  portsTraverser(node, (port) => {
    if (predicate(port)) {
      foundPort = port
    }
  })
  return foundPort
}

/**
 * Map ports of a node
 * @param node Node to map
 * @param mapper Mapper function
 * @returns Mapped ports
 */
export function mapPorts(node: INode, mapper: (port: IPort) => IPort): IPort[] {
  const mappedPorts: IPort[] = []
  portsTraverser(node, (port) => {
    mappedPorts.push(mapper(port))
  })
  return mappedPorts
}

/**
 * Reduce ports of a node
 * @param node Node to reduce
 * @param reducer Reducer function
 * @param initialValue Initial value
 * @returns Reduced value
 */
export function reducePorts<T>(node: INode, reducer: (accumulator: T, port: IPort) => T, initialValue: T): T {
  let accumulator = initialValue
  portsTraverser(node, (port) => {
    accumulator = reducer(accumulator, port)
  })
  return accumulator
}
