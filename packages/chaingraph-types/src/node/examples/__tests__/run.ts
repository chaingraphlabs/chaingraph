import type { ExecutionContext, IPort } from '@chaingraph/types'
import { getOrCreateNodeMetadata, NodeRegistry, PortFactory } from '@chaingraph/types'
import { TestNode } from '@chaingraph/types/node/examples/test-node'

const nodeId = 'user-node-1'
const userNode = new TestNode(nodeId)

const meta = getOrCreateNodeMetadata(userNode)
console.log('Node Metadata raw:', meta)

userNode
  .initialize()
  .then(async () => {
    const meta = getOrCreateNodeMetadata(userNode)
    console.log('Node Metadata:', meta)

    const ports = [] as IPort<any>[]
    meta.portsConfig.forEach((portConfig) => {
      ports.push(PortFactory.create(portConfig))
    })

    const schemas = NodeRegistry.getInstance().getObjectSchemas()

    const context: ExecutionContext = { executionId: 'exec-1', startTime: new Date() }

    const userNodeJson = JSON.stringify(userNode, null, 2)
    console.log(userNodeJson)
  })
