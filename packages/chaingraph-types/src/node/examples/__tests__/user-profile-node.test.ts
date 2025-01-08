import type { ExecutionContext } from '@chaingraph/types'
import { Address } from '@chaingraph/types/node/examples/user-profile'
import { UserProfileNode } from '@chaingraph/types/node/examples/user-profile-node'
import { SchemaGenerator } from '@chaingraph/types/node/schema-generator'
import { describe, it } from 'vitest'

describe('user profile node', () => {
  it('instantiates a user profile node', () => {
    // Create an instance of the node
    const nodeId = 'user-node-1'
    const userNode = new UserProfileNode(nodeId)

    // Set input values
    userNode.userProfile.name = 'Alice'
    userNode.userProfile.age = 30
    userNode.userProfile.email = 'alice@example.com'
    userNode.userProfile.address.street = '123 Main St'
    userNode.userProfile.address.city = 'Wonderland'
    userNode.userProfile.address.zipCode = '12345'

    userNode.userProfile.address.nestedAddress = new Address()
    userNode.userProfile.address.nestedAddress.street = '456 Sub St'
    userNode.userProfile.address.nestedAddress.city = 'Underland'
    userNode.userProfile.address.nestedAddress.zipCode = '54321'

    // Execute the node
    const context: ExecutionContext = { executionId: 'exec-1', startTime: new Date() }
    userNode.execute(context).then((result) => {
      if (result.status === 'completed') {
        console.log('Execution completed successfully.')
        console.log('Processed Profile:', userNode.processedProfile)
      } else {
        console.error('Execution failed:', result.error)
      }
    })

    const schema = SchemaGenerator.generateSchema(UserProfileNode)
    // const schema = SchemaGenerator.generateNodeData(userNode)

    // Output the schema
    console.log('Schema:')
    console.log(JSON.stringify(schema, null, 2))
  })
})
