import type { ExecutionContext } from '@chaingraph/types'
import { TestNode } from '@chaingraph/types/node/examples/test-node'
import { describe, it } from 'vitest'

describe('user profile node', () => {
  it('instantiates a user profile node', async () => {
    // Create an instance of the node
    const nodeId = 'user-node-1'
    const userNode = new TestNode(nodeId)

    const context: ExecutionContext = { executionId: 'exec-1', startTime: new Date() }

    const result = await userNode.execute(context)
    if (result.status === 'completed') {
      console.log('Execution completed successfully.')
    } else {
      console.error('Execution failed:', result.error)
    }

    console.log(JSON.stringify(userNode, null, 2))

    // const schema = SchemaGenerator.generateSchema(UserProfileNode)
    // const schema = SchemaGenerator.generateNodeData(userNode)

    // Output the schema
    // console.log('Schema:')
    // console.log(JSON.stringify(schema, null, 2))
  })
})
