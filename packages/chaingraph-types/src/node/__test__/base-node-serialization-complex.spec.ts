/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../../execution'
import { beforeEach, describe, expect, it } from 'vitest'
import { Node } from '../../decorator/node.decorator'
import { Port } from '../../decorator/port.decorator'
import { PortPluginRegistry } from '../../port'
import {
  ArrayPortPlugin,
  BooleanPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  StringPortPlugin,
} from '../../port/plugins'
import { BaseNodeCompositional } from '../base-node-compositional'
import 'reflect-metadata'

// Register port plugins for testing
beforeEach(() => {
  const registry = PortPluginRegistry.getInstance()
  registry.register(StringPortPlugin)
  registry.register(NumberPortPlugin)
  registry.register(ArrayPortPlugin)
  registry.register(ObjectPortPlugin)
  registry.register(BooleanPortPlugin)
})

// Define complex types for test properties
interface Address {
  street: string
  city: string
  zipCode: string
  isDefault: boolean
}

interface Contact {
  type: string
  value: string
}

interface Theme {
  primary: string
  secondary: string
  fontSize: number
}

interface UserProfile {
  firstName: string
  lastName: string
  age: number
  addresses: Address[]
  contacts: Contact[]
  preferences: {
    darkMode: boolean
    notifications: boolean
    language: string
    theme: Theme
  }
  skills: string[]
  metadata: Record<string, any>
}

interface GroupInfo {
  level: number
  description: string
}

interface AccessControl {
  users: Array<{
    id: string
    name: string
    groups: string[]
  }>
  groups: Record<string, GroupInfo>
}

interface DynamicConfig {
  name: string
  version: string
  enabled: boolean
  [key: string]: any // Allow dynamic properties
}

/**
 * A complex node with deeply nested object structures, arrays, and mixed types
 */
@Node({
  type: 'ComplexUserNode',
  title: 'Complex User Node',
  description: 'A node with complex nested data structures for testing',
})
class ComplexUserNode extends BaseNodeCompositional {
  @Port({
    type: 'object',
    schema: {
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        age: { type: 'number' },
        addresses: {
          type: 'array',
          itemConfig: {
            type: 'object',
            schema: {
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                zipCode: { type: 'string' },
                isDefault: { type: 'boolean' },
              },
            },
          },
        },
        contacts: {
          type: 'array',
          itemConfig: {
            type: 'object',
            schema: {
              properties: {
                type: { type: 'string' },
                value: { type: 'string' },
              },
            },
          },
        },
        preferences: {
          type: 'object',
          schema: {
            properties: {
              darkMode: { type: 'boolean' },
              notifications: { type: 'boolean' },
              language: { type: 'string' },
              theme: {
                type: 'object',
                schema: {
                  properties: {
                    primary: { type: 'string' },
                    secondary: { type: 'string' },
                    fontSize: { type: 'number' },
                  },
                },
              },
            },
          },
        },
        skills: {
          type: 'array',
          itemConfig: { type: 'string' },
        },
        metadata: {
          type: 'object',
          schema: {
            properties: {
              lastLogin: { type: 'string' },
              accountType: { type: 'string' },
              sessions: { type: 'number' },
            },
          },
        },
      },
    },
  })
  userProfile: UserProfile = {
    firstName: 'John',
    lastName: 'Doe',
    age: 30,
    addresses: [
      {
        street: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        isDefault: true,
      },
    ],
    contacts: [
      {
        type: 'email',
        value: 'john.doe@example.com',
      },
      {
        type: 'phone',
        value: '+1-555-123-4567',
      },
    ],
    preferences: {
      darkMode: false,
      notifications: true,
      language: 'en',
      theme: {
        primary: '#007bff',
        secondary: '#6c757d',
        fontSize: 16,
      },
    },
    skills: ['JavaScript', 'TypeScript', 'React'],
    metadata: {
      lastLogin: '2025-01-15T12:00:00Z',
      accountType: 'premium',
      sessions: 25,
    },
  }

  @Port({
    type: 'array',
    itemConfig: {
      type: 'array',
      itemConfig: {
        type: 'object',
        schema: {
          properties: {
            id: { type: 'string' },
            value: { type: 'number' },
            active: { type: 'boolean' },
          },
        },
      },
    },
  })
  matrixData: Array<Array<{ id: string, value: number, active: boolean }>> = [
    [
      { id: 'a1', value: 10, active: true },
      { id: 'a2', value: 20, active: false },
    ],
    [
      { id: 'b1', value: 30, active: true },
      { id: 'b2', value: 40, active: true },
    ],
  ]

  @Port({
    type: 'object',
    schema: {
      properties: {
        users: {
          type: 'array',
          itemConfig: {
            type: 'object',
            schema: {
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                groups: {
                  type: 'array',
                  itemConfig: { type: 'string' },
                },
              },
            },
          },
        },
        groups: {
          type: 'object',
          schema: {
            properties: {
              admin: {
                type: 'object',
                schema: {
                  properties: {
                    level: { type: 'number' },
                    description: { type: 'string' },
                  },
                },
              },
              editor: {
                type: 'object',
                schema: {
                  properties: {
                    level: { type: 'number' },
                    description: { type: 'string' },
                  },
                },
              },
              viewer: {
                type: 'object',
                schema: {
                  properties: {
                    level: { type: 'number' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  accessControl: AccessControl = {
    users: [
      { id: 'user1', name: 'Alice', groups: ['admin', 'editor'] },
      { id: 'user2', name: 'Bob', groups: ['viewer'] },
    ],
    groups: {
      admin: { level: 3, description: 'Administrator' },
      editor: { level: 2, description: 'Content Editor' },
      viewer: { level: 1, description: 'Content Viewer' },
    },
  }

  async execute(_context: ExecutionContext) {
    return {}
  }
}

/**
 * A node with dynamic object properties for testing adding/removing properties
 */
@Node({
  type: 'DynamicConfigNode',
  title: 'Dynamic Config Node',
  description: 'A node with dynamically changing object properties',
})
class DynamicConfigNode extends BaseNodeCompositional {
  @Port({
    type: 'object',
    schema: {
      properties: {
        name: { type: 'string' },
        version: { type: 'string' },
        enabled: { type: 'boolean' },
      },
    },
  })
  config: DynamicConfig = {
    name: 'Default Config',
    version: '1.0.0',
    enabled: true,
  }

  @Port({
    type: 'array',
    itemConfig: {
      type: 'string',
    },
  })
  features: string[] = []

  async execute(_context: ExecutionContext) {
    return {}
  }
}

describe('complex Serialization Tests', () => {
  describe('complexUserNode', () => {
    let node: ComplexUserNode

    beforeEach(() => {
      node = new ComplexUserNode('complex-user-node')
      node.initialize()
    })

    it('should preserve deeply nested object mutations after serialization', () => {
      // Modify the theme
      node.userProfile.preferences.theme.primary = '#ff0000'
      node.userProfile.preferences.theme.fontSize = 20

      // Add a new skill
      node.userProfile.skills.push('GraphQL')

      // Get the userProfilePort to add a new metadata property
      const userProfilePort = Array.from(node.ports.values())
        .find(port => port.getConfig().key === 'userProfile')

      if (!userProfilePort) {
        throw new Error('UserProfile port not found')
      }

      // Find the metadata port which is a child of userProfilePort
      const metadataPort = node.getChildPorts(userProfilePort)
        .find(port => port.getConfig().key === 'metadata')

      if (!metadataPort) {
        throw new Error('Metadata port not found')
      }

      // Add the lastVisit property to metadata
      node.addObjectProperty(metadataPort, 'lastVisit', {
        type: 'string',
        defaultValue: '2025-02-27T15:30:00Z',
      })

      // Serialize to JSON string and back (simulating storage)
      const serialized = JSON.stringify(node.serialize())
      const deserialized = JSON.parse(serialized)

      // Create a new node and initialize from the deserialized data
      const newNode = new ComplexUserNode('complex-user-node')
      newNode.deserialize(deserialized)
      // newNode.initialize()

      // Verify all mutations were preserved
      expect(newNode.userProfile.preferences.theme.primary).toBe('#ff0000')
      expect(newNode.userProfile.preferences.theme.fontSize).toBe(20)
      expect(newNode.userProfile.skills).toContain('GraphQL')
      expect(newNode.userProfile.metadata.lastVisit).toBe('2025-02-27T15:30:00Z')

      // Original metadata should also be preserved
      expect(newNode.userProfile.metadata.lastLogin).toBe('2025-01-15T12:00:00Z')
      expect(newNode.userProfile.metadata.accountType).toBe('premium')
    })

    it('should preserve complex array mutations after serialization', () => {
      // Add a new address
      node.userProfile.addresses.push({
        street: '456 Park Ave',
        city: 'Boston',
        zipCode: '02108',
        isDefault: false,
      })

      // Modify an existing address
      node.userProfile.addresses[0].city = 'Brooklyn'

      // Modify a contact
      node.userProfile.contacts[1].value = '+1-555-987-6543'

      // Add a new contact
      node.userProfile.contacts.push({
        type: 'twitter',
        value: '@johndoe',
      })

      // Serialize to JSON string and back
      const serialized = JSON.stringify(node.serialize())
      const deserialized = JSON.parse(serialized)

      // Create a new node and initialize from the deserialized data
      const newNode = new ComplexUserNode('complex-user-node')
      newNode.deserialize(deserialized)
      // newNode.initialize()

      // Verify all array mutations were preserved
      expect(newNode.userProfile.addresses).toHaveLength(2)
      expect(newNode.userProfile.addresses[0].city).toBe('Brooklyn')
      expect(newNode.userProfile.addresses[1].street).toBe('456 Park Ave')

      expect(newNode.userProfile.contacts).toHaveLength(3)
      expect(newNode.userProfile.contacts[1].value).toBe('+1-555-987-6543')
      expect(newNode.userProfile.contacts[2].type).toBe('twitter')
      expect(newNode.userProfile.contacts[2].value).toBe('@johndoe')
    })

    it('should preserve nested array mutations after serialization', () => {
      // Modify an item in the matrix
      node.matrixData[0][1].value = 25
      node.matrixData[0][1].active = true

      // Add a new row
      node.matrixData.push([
        { id: 'c1', value: 50, active: true },
        { id: 'c2', value: 60, active: false },
      ])

      // Add an item to an existing row
      node.matrixData[1].push({ id: 'b3', value: 45, active: true })

      // Serialize to JSON string and back
      const serialized = JSON.stringify(node.serialize())
      const deserialized = JSON.parse(serialized)

      // Create a new node and initialize from the deserialized data
      const newNode = new ComplexUserNode('complex-user-node')
      newNode.deserialize(deserialized)
      // newNode.initialize()

      // Verify all nested array mutations were preserved
      expect(newNode.matrixData).toHaveLength(3)
      expect(newNode.matrixData[0][1].value).toBe(25)
      expect(newNode.matrixData[0][1].active).toBe(true)

      expect(newNode.matrixData[2]).toHaveLength(2)
      expect(newNode.matrixData[2][0].id).toBe('c1')
      expect(newNode.matrixData[2][1].value).toBe(60)

      expect(newNode.matrixData[1]).toHaveLength(3)
      expect(newNode.matrixData[1][2].id).toBe('b3')
      expect(newNode.matrixData[1][2].value).toBe(45)
    })

    it('should preserve complex mixed mutations after serialization', () => {
      // Mix of different types of mutations

      // Object mutations
      node.userProfile.firstName = 'Jane'
      node.userProfile.age = 32
      node.userProfile.preferences.darkMode = true

      // Array manipulations
      node.userProfile.skills = ['Python', 'Java', 'Rust'] // Replace array

      // Get the access control port to add a new group
      const accessControlPort = Array.from(node.ports.values())
        .find(port => port.key === 'accessControl')

      if (!accessControlPort) {
        throw new Error('AccessControl port not found')
      }

      // Find the groups port
      const groupsPort = node.getChildPorts(accessControlPort)
        .find(port => port.key === 'groups')

      if (!groupsPort) {
        throw new Error('Groups port not found')
      }

      // Add a new group
      node.addObjectProperty(groupsPort, 'superadmin', {
        type: 'object',
        schema: {
          properties: {
            level: { type: 'number' },
            description: { type: 'string' },
          },
        },
        defaultValue: {
          level: 5,
          description: 'Super Administrator',
        },
      })

      // Update admin level
      node.accessControl.groups.admin.level = 4

      // Add superadmin to user groups
      node.accessControl.users[0].groups.push('superadmin')

      // Serialize to JSON string and back
      const serialized = JSON.stringify(node.serialize())
      const deserialized = JSON.parse(serialized)

      // Create a new node and initialize from the deserialized data
      const newNode = new ComplexUserNode('complex-user-node')
      newNode.deserialize(deserialized)
      // newNode.initialize()

      // Verify all mutations were preserved

      // Object mutations
      expect(newNode.userProfile.firstName).toBe('Jane')
      expect(newNode.userProfile.age).toBe(32)
      expect(newNode.userProfile.preferences.darkMode).toBe(true)

      // Array manipulations
      expect(newNode.userProfile.skills).toEqual(['Python', 'Java', 'Rust'])

      // Deep mutations
      expect(newNode.accessControl.users[0].groups).toContain('superadmin')
      expect(newNode.accessControl.groups.admin.level).toBe(4)

      // Dynamic property
      expect(newNode.accessControl.groups.superadmin.level).toBe(5)
      expect(newNode.accessControl.groups.superadmin.description).toBe('Super Administrator')
    })
  })

  describe('dynamicConfigNode', () => {
    let node: DynamicConfigNode

    beforeEach(() => {
      node = new DynamicConfigNode('dynamic-config-node')
      node.initialize()
    })

    it('should handle dynamically added object properties', () => {
      // Get the port for the config object
      const configPort = Array.from(node.ports.values())
        .find(port => port.getConfig().key === 'config')

      if (!configPort) {
        throw new Error('Config port not found')
      }

      // Add new properties dynamically
      node.addObjectProperty(configPort, 'timeout', {
        type: 'number',
        defaultValue: 3000,
      })

      node.addObjectProperty(configPort, 'debug', {
        type: 'boolean',
        defaultValue: true,
      })

      node.addObjectProperty(configPort, 'apiUrl', {
        type: 'string',
        defaultValue: 'https://api.example.com',
      })

      // The new properties should be accessible
      expect(node.config.timeout).toBe(3000)
      expect(node.config.debug).toBe(true)
      expect(node.config.apiUrl).toBe('https://api.example.com')

      // Verify that the object port was updated in the ports map
      expect(configPort.getValue()).toHaveProperty('timeout')
      expect(configPort.getValue()).toHaveProperty('debug')
      expect(configPort.getValue()).toHaveProperty('apiUrl')

      // Add a nested object property
      node.addObjectProperty(configPort, 'logging', {
        type: 'object',
        schema: {
          properties: {
            level: { type: 'string', defaultValue: 'info' },
            file: { type: 'string', defaultValue: 'app.log' },
          },
        },
        defaultValue: {
          level: 'info',
          file: 'app.log',
        },
      });

      // Modify the nested property
      (node.config.logging as any).level = 'debug'

      // Serialize to JSON string and back
      const serialized = JSON.stringify(node.serialize())
      const deserialized = JSON.parse(serialized)

      // Create a new node and initialize from the deserialized data
      const newNode = new DynamicConfigNode('dynamic-config-node')
      newNode.deserialize(deserialized)
      // newNode.initialize()

      // Verify all dynamically added properties were preserved
      expect(newNode.config.timeout).toBe(3000)
      expect(newNode.config.debug).toBe(true)
      expect(newNode.config.apiUrl).toBe('https://api.example.com')
      expect((newNode.config.logging as any).level).toBe('debug')
      expect((newNode.config.logging as any).file).toBe('app.log')
    })

    it('should handle dynamically removed object properties', () => {
      // Get the port for the config object
      const configPort = Array.from(node.ports.values())
        .find(port => port.getConfig().key === 'config')

      if (!configPort) {
        throw new Error('Config port not found')
      }

      // Add properties
      node.addObjectProperty(configPort, 'timeout', {
        type: 'number',
        defaultValue: 3000,
      })

      node.addObjectProperty(configPort, 'debug', {
        type: 'boolean',
        defaultValue: true,
      })

      // Then remove one
      node.removeObjectProperty(configPort, 'debug')

      // Verify removal
      expect(node.config).toHaveProperty('timeout')
      expect(node.config).not.toHaveProperty('debug')

      // Serialize to JSON string and back
      const serialized = JSON.stringify(node.serialize())
      const deserialized = JSON.parse(serialized)

      // Create a new node and initialize from the deserialized data
      const newNode = new DynamicConfigNode('dynamic-config-node')
      newNode.deserialize(deserialized)
      // newNode.initialize()

      // Verify state is preserved
      expect(newNode.config).toHaveProperty('timeout')
      expect(newNode.config).not.toHaveProperty('debug')
    })

    it('should handle dynamic array operations with serialization', () => {
      // Add items to features array
      node.features.push('search')
      node.features.push('export')
      node.features.push('import')

      // Get the features array value
      const features = [...node.features]

      // Remove an item by replacing the array
      node.features = ['search', 'import']

      // Add another item
      node.features.push('admin')

      // Serialize to JSON string and back
      const serialized = JSON.stringify(node.serialize())
      const deserialized = JSON.parse(serialized)

      // Create a new node and initialize from the deserialized data
      const newNode = new DynamicConfigNode('dynamic-config-node')
      newNode.deserialize(deserialized)
      // newNode.initialize()

      // Verify the final array state is preserved
      expect(newNode.features).toEqual(['search', 'import', 'admin'])
    })

    it('should correctly serialize and deserialize after mixed dynamic operations', () => {
      // Get the config port
      const configPort = Array.from(node.ports.values())
        .find(port => port.getConfig().key === 'config')

      if (!configPort) {
        throw new Error('Config port not found')
      }

      // Mixed operations
      // Add array items
      node.features.push('search')
      node.features.push('export')

      // Add object property
      node.addObjectProperty(configPort, 'advanced', {
        type: 'object',
        schema: {
          properties: {
            caching: { type: 'boolean', defaultValue: true },
            maxItems: { type: 'number', defaultValue: 100 },
          },
        },
        defaultValue: {
          caching: true,
          maxItems: 100,
        },
      })

      // Modify new property
      node.config.advanced.maxItems = 250

      // Remove original property
      node.removeObjectProperty(configPort, 'enabled')

      // Replace array with different values
      node.features = ['export', 'admin']

      // Serialize to JSON string and back
      const serialized = JSON.stringify(node.serialize())
      const deserialized = JSON.parse(serialized)

      // Create a new node and initialize from the deserialized data
      const newNode = new DynamicConfigNode('dynamic-config-node')
      newNode.deserialize(deserialized)
      // newNode.initialize()

      // Verify all changes were preserved
      expect(newNode.config.enabled).toBe(undefined)
      expect((newNode.config.advanced as any).maxItems).toBe(250)
      expect((newNode.config.advanced as any).caching).toBe(true)
      expect(newNode.features).toEqual(['export', 'admin'])
    })
  })
})
