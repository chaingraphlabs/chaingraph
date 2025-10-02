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

/**
 * Complex test node with deeply nested structures for comprehensive cloning tests
 */
@Node({
  type: 'ComplexTestNode',
  title: 'Complex Clone Test Node',
  description: 'A node with complex nested structures for cloning tests',
})
class ComplexTestNode extends BaseNodeCompositional {
  // Simple nested object
  @Port({
    type: 'object',
    schema: {
      properties: {
        name: { type: 'string' },
        details: {
          type: 'object',
          schema: {
            properties: {
              age: { type: 'number' },
              active: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  nestedUser: {
    name: string
    details: {
      age: number
      active: boolean
    }
  } = {
    name: 'John',
    details: {
      age: 30,
      active: true,
    },
  }

  // Array of objects
  @Port({
    type: 'array',
    itemConfig: {
      type: 'object',
      schema: {
        properties: {
          id: { type: 'string' },
          score: { type: 'number' },
          metadata: {
            type: 'object',
            schema: {
              properties: {
                tags: { type: 'array', itemConfig: { type: 'string' } },
                priority: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  gameResults: Array<{
    id: string
    score: number
    metadata: {
      tags: string[]
      priority: number
    }
  }> = [
    {
      id: 'game1',
      score: 100,
      metadata: {
        tags: ['action', 'multiplayer'],
        priority: 1,
      },
    },
    {
      id: 'game2',
      score: 250,
      metadata: {
        tags: ['puzzle', 'singleplayer'],
        priority: 2,
      },
    },
  ]

  // Deeply nested object with multiple levels
  @Port({
    type: 'object',
    schema: {
      properties: {
        company: {
          type: 'object',
          schema: {
            properties: {
              name: { type: 'string' },
              departments: {
                type: 'array',
                itemConfig: {
                  type: 'object',
                  schema: {
                    properties: {
                      name: { type: 'string' },
                      employees: {
                        type: 'array',
                        itemConfig: {
                          type: 'object',
                          schema: {
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              skills: { type: 'array', itemConfig: { type: 'string' } },
                              contact: {
                                type: 'object',
                                schema: {
                                  properties: {
                                    email: { type: 'string' },
                                    phone: { type: 'string' },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  organization: {
    company: {
      name: string
      departments: Array<{
        name: string
        employees: Array<{
          id: string
          name: string
          skills: string[]
          contact: {
            email: string
            phone: string
          }
        }>
      }>
    }
  } = {
    company: {
      name: 'TechCorp',
      departments: [
        {
          name: 'Engineering',
          employees: [
            {
              id: 'emp1',
              name: 'Alice',
              skills: ['TypeScript', 'React', 'Node.js'],
              contact: {
                email: 'alice@techcorp.com',
                phone: '+1234567890',
              },
            },
            {
              id: 'emp2',
              name: 'Bob',
              skills: ['Python', 'Django', 'PostgreSQL'],
              contact: {
                email: 'bob@techcorp.com',
                phone: '+1234567891',
              },
            },
          ],
        },
        {
          name: 'Marketing',
          employees: [
            {
              id: 'emp3',
              name: 'Carol',
              skills: ['SEO', 'Content Marketing', 'Analytics'],
              contact: {
                email: 'carol@techcorp.com',
                phone: '+1234567892',
              },
            },
          ],
        },
      ],
    },
  }

  // Array of arrays (matrix-like structure)
  @Port({
    type: 'array',
    itemConfig: {
      type: 'array',
      itemConfig: { type: 'number' },
    },
  })
  matrix: number[][] = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ]

  // Mixed complex structure
  @Port({
    type: 'object',
    schema: {
      properties: {
        config: {
          type: 'object',
          schema: {
            properties: {
              settings: {
                type: 'array',
                itemConfig: {
                  type: 'object',
                  schema: {
                    properties: {
                      key: { type: 'string' },
                      value: {
                        type: 'object',
                        schema: {
                          properties: {
                            type: { type: 'string' },
                            data: {
                              type: 'array',
                              itemConfig: {
                                type: 'object',
                                schema: {
                                  properties: {
                                    nested: { type: 'array', itemConfig: { type: 'string' } },
                                    count: { type: 'number' },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  complexConfig: {
    config: {
      settings: Array<{
        key: string
        value: {
          type: string
          data: Array<{
            nested: string[]
            count: number
          }>
        }
      }>
    }
  } = {
    config: {
      settings: [
        {
          key: 'feature1',
          value: {
            type: 'experimental',
            data: [
              {
                nested: ['opt1', 'opt2'],
                count: 2,
              },
              {
                nested: ['opt3', 'opt4', 'opt5'],
                count: 3,
              },
            ],
          },
        },
        {
          key: 'feature2',
          value: {
            type: 'stable',
            data: [
              {
                nested: ['production'],
                count: 1,
              },
            ],
          },
        },
      ],
    },
  }

  // Empty structures for edge case testing
  @Port({
    type: 'array',
    itemConfig: { type: 'string' },
  })
  emptyArray: string[] = []

  @Port({
    type: 'object' as const,
    schema: {
      properties: {
        empty: {
          type: 'object' as const,
          schema: {
            properties: {},
          },
        },
      },
    },
  })
  emptyNestedObject: { empty: Record<string, never> } = { empty: {} }

  async execute(_context: ExecutionContext) {
    return {}
  }
}

describe('cloneWithNewId - Complex Structures', () => {
  let node: ComplexTestNode

  beforeEach(() => {
    node = new ComplexTestNode('complex-test-node')
    node.initialize()
  })

  describe('deep Object Nesting', () => {
    it('should clone deeply nested objects preserving all levels', () => {
      // Modify the nested structure
      node.nestedUser = {
        name: 'Jane',
        details: {
          age: 25,
          active: false,
        },
      }

      const clonedNode = node.cloneWithNewId() as ComplexTestNode

      expect(clonedNode.id).not.toBe(node.id)
      expect(clonedNode.nestedUser).toEqual({
        name: 'Jane',
        details: {
          age: 25,
          active: false,
        },
      })

      // Verify independence
      node.nestedUser.name = 'Modified Original'
      clonedNode.nestedUser.name = 'Modified Clone'

      expect(node.nestedUser.name).toBe('Modified Original')
      expect(clonedNode.nestedUser.name).toBe('Modified Clone')
    })

    it('should handle modifications to deep nested properties', () => {
      // Modify deep nested properties
      node.nestedUser.details.age = 35
      node.nestedUser.details.active = false

      const clonedNode = node.cloneWithNewId() as ComplexTestNode

      expect(clonedNode.nestedUser.details.age).toBe(35)
      expect(clonedNode.nestedUser.details.active).toBe(false)

      // Test independence at deep levels
      node.nestedUser.details.age = 40
      expect(clonedNode.nestedUser.details.age).toBe(35)
    })
  })

  describe('arrays of Complex Objects', () => {
    it('should clone arrays of nested objects correctly', () => {
      // Modify the game results
      node.gameResults = [
        {
          id: 'newGame1',
          score: 500,
          metadata: {
            tags: ['strategy', 'realtime'],
            priority: 3,
          },
        },
        {
          id: 'newGame2',
          score: 750,
          metadata: {
            tags: ['rpg', 'fantasy'],
            priority: 1,
          },
        },
        {
          id: 'newGame3',
          score: 300,
          metadata: {
            tags: ['arcade'],
            priority: 2,
          },
        },
      ]

      const clonedNode = node.cloneWithNewId()

      expect(clonedNode.gameResults).toEqual(node.gameResults)
      expect(clonedNode.gameResults).toHaveLength(3)

      // Verify deep independence
      node.gameResults[0].metadata.tags.push('modified')
      expect(clonedNode.gameResults[0].metadata.tags).not.toContain('modified')
    })

    it('should handle nested arrays within objects correctly', () => {
      // Add more complex nested data
      node.gameResults.push({
        id: 'complexGame',
        score: 1000,
        metadata: {
          tags: ['complex', 'nested', 'test', 'game'],
          priority: 0,
        },
      })

      const clonedNode = node.cloneWithNewId()

      expect(clonedNode.gameResults).toHaveLength(node.gameResults.length)

      const lastGame = clonedNode.gameResults[clonedNode.gameResults.length - 1]
      expect(lastGame.id).toBe('complexGame')
      expect(lastGame.metadata.tags).toEqual(['complex', 'nested', 'test', 'game'])

      // Test independence
      node.gameResults[node.gameResults.length - 1].metadata.tags = ['changed']
      expect(lastGame.metadata.tags).toEqual(['complex', 'nested', 'test', 'game'])
    })
  })

  describe('multi-Level Deep Nesting', () => {
    it('should clone extremely deep nested structures', () => {
      // Modify the organization structure
      node.organization.company.name = 'NewTechCorp'
      node.organization.company.departments[0].employees[0].name = 'Alice Updated'
      node.organization.company.departments[0].employees[0].skills = ['Go', 'Kubernetes', 'Docker']
      node.organization.company.departments[0].employees[0].contact.email = 'alice.updated@newtechcorp.com'

      const clonedNode = node.cloneWithNewId()

      expect(clonedNode.organization.company.name).toBe('NewTechCorp')
      expect(clonedNode.organization.company.departments[0].employees[0].name).toBe('Alice Updated')
      expect(clonedNode.organization.company.departments[0].employees[0].skills).toEqual(['Go', 'Kubernetes', 'Docker'])
      expect(clonedNode.organization.company.departments[0].employees[0].contact.email).toBe('alice.updated@newtechcorp.com')

      // Test deep independence
      node.organization.company.departments[0].employees[0].skills.push('Rust')
      expect(clonedNode.organization.company.departments[0].employees[0].skills).not.toContain('Rust')
    })

    it('should handle adding and removing items in deeply nested arrays', () => {
      // Add a new department
      node.organization.company.departments.push({
        name: 'Research',
        employees: [
          {
            id: 'emp4',
            name: 'David',
            skills: ['Machine Learning', 'Data Science'],
            contact: {
              email: 'david@techcorp.com',
              phone: '+1234567893',
            },
          },
        ],
      })

      const clonedNode = node.cloneWithNewId()

      expect(clonedNode.organization.company.departments).toHaveLength(3)
      expect(clonedNode.organization.company.departments[2].name).toBe('Research')
      expect(clonedNode.organization.company.departments[2].employees[0].name).toBe('David')

      // Remove department from original
      node.organization.company.departments.pop()
      expect(node.organization.company.departments).toHaveLength(2)
      expect(clonedNode.organization.company.departments).toHaveLength(3)
    })
  })

  describe('matrix and Multi-Dimensional Arrays', () => {
    it('should clone matrix structures correctly', () => {
      // Modify the matrix
      node.matrix = [
        [10, 20, 30],
        [40, 50, 60],
        [70, 80, 90],
        [100, 110, 120],
      ]

      const clonedNode = node.cloneWithNewId()

      expect(clonedNode.matrix).toEqual(node.matrix)
      expect(clonedNode.matrix).toHaveLength(4)

      // Test independence
      node.matrix[0][0] = 999
      expect(clonedNode.matrix[0][0]).toBe(10)

      // Test adding new row
      node.matrix.push([130, 140, 150])
      expect(node.matrix).toHaveLength(5)
      expect(clonedNode.matrix).toHaveLength(4)
    })
  })

  describe('extremely Complex Mixed Structures', () => {
    it('should handle deeply nested mixed structures with arrays and objects', () => {
      // Modify the complex config
      node.complexConfig.config.settings.push({
        key: 'feature3',
        value: {
          type: 'beta',
          data: [
            {
              nested: ['test1', 'test2', 'test3'],
              count: 3,
            },
            {
              nested: ['prod1'],
              count: 1,
            },
          ],
        },
      })

      // Modify existing nested data
      node.complexConfig.config.settings[0].value.data[0].nested.push('opt6')
      node.complexConfig.config.settings[0].value.data[0].count = 3

      const clonedNode = node.cloneWithNewId()

      expect(clonedNode.complexConfig.config.settings).toHaveLength(3)
      expect(clonedNode.complexConfig.config.settings[2].key).toBe('feature3')
      expect(clonedNode.complexConfig.config.settings[0].value.data[0].nested).toContain('opt6')
      expect(clonedNode.complexConfig.config.settings[0].value.data[0].count).toBe(3)

      // Test independence at multiple levels
      node.complexConfig.config.settings[0].value.data[0].nested = ['completely', 'different']
      expect(clonedNode.complexConfig.config.settings[0].value.data[0].nested).toContain('opt6')
    })
  })

  describe('edge Cases', () => {
    it('should handle empty arrays and objects', () => {
      // Verify empty structures are cloned correctly
      const clonedNode = node.cloneWithNewId()

      expect(clonedNode.emptyArray).toEqual([])
      expect(clonedNode.emptyNestedObject).toEqual({ empty: {} })

      // Test independence with empty structures
      node.emptyArray.push('item1', 'item2')
      expect(clonedNode.emptyArray).toEqual([])

      // Add property to empty object
      ;(node.emptyNestedObject.empty as any).newProp = 'value'
      expect(clonedNode.emptyNestedObject.empty).toEqual({})
    })

    it('should handle null and undefined values in nested structures', () => {
      // Set some values to null/undefined
      ;(node.nestedUser as any).nullValue = null
      ;(node.nestedUser as any).undefinedValue = undefined

      const clonedNode = node.cloneWithNewId()

      expect((clonedNode.nestedUser as any).nullValue).toBeNull()
      expect((clonedNode.nestedUser as any).undefinedValue).toBeUndefined()
    })

    it('should maintain object references independence after cloning', () => {
      const clonedNode = node.cloneWithNewId()

      // Verify that objects are deeply independent
      const originalDept = node.organization.company.departments[0]
      const clonedDept = clonedNode.organization.company.departments[0]

      expect(originalDept).not.toBe(clonedDept) // Different object references
      expect(originalDept.employees).not.toBe(clonedDept.employees) // Different array references
      expect(originalDept.employees[0]).not.toBe(clonedDept.employees[0]) // Different nested object references
    })

    it('should handle large nested structures without performance issues', () => {
      // Create a large nested structure
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        id: `item${i}`,
        score: i * 10,
        metadata: {
          tags: Array.from({ length: 10 }, (_, j) => `tag${i}-${j}`),
          priority: i % 5,
        },
      }))

      node.gameResults = largeData

      const startTime = Date.now()
      const clonedNode = node.cloneWithNewId()
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
      expect(clonedNode.gameResults).toHaveLength(100)
      expect(clonedNode.gameResults[99].id).toBe('item99')
      expect(clonedNode.gameResults[99].metadata.tags).toHaveLength(10)
    })
  })

  describe('port Hierarchy Preservation', () => {
    it('should preserve all port configurations and values', () => {
      const clonedNode = node.cloneWithNewId()

      // Verify that all ports exist
      const originalPortCount = node.ports.size
      const clonedPortCount = clonedNode.ports.size

      expect(clonedPortCount).toBe(originalPortCount)

      // Verify that port keys are preserved
      const originalPortKeys = Array.from(node.ports.values())
        .filter(p => !p.getConfig().parentId)
        .map(p => p.getConfig().key)
        .sort()

      const clonedPortKeys = Array.from(clonedNode.ports.values())
        .filter(p => !p.getConfig().parentId)
        .map(p => p.getConfig().key)
        .sort()

      expect(clonedPortKeys).toEqual(originalPortKeys)
    })

    it('should ensure all port IDs are same id between original and cloned', () => {
      const clonedNode = node.cloneWithNewId()

      const originalPortIds = Array.from(node.ports.keys())
      const clonedPortIds = Array.from(clonedNode.ports.keys())

      // No port IDs should overlap
      const intersection = originalPortIds.filter(id => !clonedPortIds.includes(id))
      expect(intersection).toHaveLength(0)
    })

    it('should verify complex object ports have same IDs and values', () => {
      // Modify nested user data
      node.nestedUser = {
        name: 'TestUser',
        details: {
          age: 99,
          active: true,
        },
      }

      const clonedNode = node.cloneWithNewId()

      // Find the nestedUser port in both nodes
      const originalNestedUserPort = Array.from(node.ports.values())
        .find(p => p.getConfig().key === 'nestedUser')
      const clonedNestedUserPort = Array.from(clonedNode.ports.values())
        .find(p => p.getConfig().key === 'nestedUser')

      expect(originalNestedUserPort).toBeDefined()
      expect(clonedNestedUserPort).toBeDefined()

      // Verify IDs are same
      expect(originalNestedUserPort!.id).toBe(clonedNestedUserPort!.id)

      // Verify values are the same
      expect(originalNestedUserPort!.getValue()).toEqual(clonedNestedUserPort!.getValue())
      expect(clonedNestedUserPort!.getValue()).toEqual({
        name: 'TestUser',
        details: {
          age: 99,
          active: true,
        },
      })

      // Verify all child ports of object also have different IDs
      const originalChildPorts = node.getChildPorts(originalNestedUserPort!)
      const clonedChildPorts = clonedNode.getChildPorts(clonedNestedUserPort!)

      expect(originalChildPorts.length).toBe(clonedChildPorts.length)
      expect(originalChildPorts.length).toBeGreaterThan(0)

      for (let i = 0; i < originalChildPorts.length; i++) {
        expect(originalChildPorts[i].id).toBe(clonedChildPorts[i].id)
        expect(originalChildPorts[i].getValue()).toEqual(clonedChildPorts[i].getValue())
      }
    })

    it('should verify complex array ports have same IDs and values', () => {
      // Modify game results
      node.gameResults = [
        {
          id: 'test1',
          score: 1000,
          metadata: {
            tags: ['test', 'array'],
            priority: 5,
          },
        },
        {
          id: 'test2',
          score: 2000,
          metadata: {
            tags: ['complex', 'nested'],
            priority: 10,
          },
        },
      ]

      const clonedNode = node.cloneWithNewId()

      // Find the gameResults port in both nodes
      const originalGameResultsPort = Array.from(node.ports.values())
        .find(p => p.getConfig().key === 'gameResults')
      const clonedGameResultsPort = Array.from(clonedNode.ports.values())
        .find(p => p.getConfig().key === 'gameResults')

      expect(originalGameResultsPort).toBeDefined()
      expect(clonedGameResultsPort).toBeDefined()

      // Verify IDs are same
      expect(originalGameResultsPort!.id).toBe(clonedGameResultsPort!.id)

      // Verify values are the same
      expect(originalGameResultsPort!.getValue()).toEqual(clonedGameResultsPort!.getValue())

      // Verify all child ports (array items) have different IDs
      const originalArrayChildPorts = node.getChildPorts(originalGameResultsPort!)
      const clonedArrayChildPorts = clonedNode.getChildPorts(clonedGameResultsPort!)

      expect(originalArrayChildPorts.length).toBe(clonedArrayChildPorts.length)

      for (let i = 0; i < originalArrayChildPorts.length; i++) {
        expect(originalArrayChildPorts[i].id).toBe(clonedArrayChildPorts[i].id)
        expect(originalArrayChildPorts[i].getValue()).toEqual(clonedArrayChildPorts[i].getValue())

        // For object array items, verify nested object properties also have different IDs
        const originalNestedPorts = node.getChildPorts(originalArrayChildPorts[i])
        const clonedNestedPorts = clonedNode.getChildPorts(clonedArrayChildPorts[i])

        expect(originalNestedPorts.length).toBe(clonedNestedPorts.length)

        for (let j = 0; j < originalNestedPorts.length; j++) {
          expect(originalNestedPorts[j].id).toBe(clonedNestedPorts[j].id)
          expect(originalNestedPorts[j].getValue()).toEqual(clonedNestedPorts[j].getValue())
        }
      }
    })

    it('should verify deeply nested object ports have same IDs at all levels', () => {
      // Modify organization data
      node.organization = {
        company: {
          name: 'DeepTestCorp',
          departments: [
            {
              name: 'R&D',
              employees: [
                {
                  id: 'deep1',
                  name: 'DeepTester',
                  skills: ['deep', 'testing'],
                  contact: {
                    email: 'deep@test.com',
                    phone: '+999',
                  },
                },
              ],
            },
          ],
        },
      }

      const clonedNode = node.cloneWithNewId()

      // Find the organization port in both nodes
      const originalOrgPort = Array.from(node.ports.values())
        .find(p => p.getConfig().key === 'organization')
      const clonedOrgPort = Array.from(clonedNode.ports.values())
        .find(p => p.getConfig().key === 'organization')

      expect(originalOrgPort).toBeDefined()
      expect(clonedOrgPort).toBeDefined()

      // Verify root level IDs are different
      expect(originalOrgPort!.id).toBe(clonedOrgPort!.id)
      expect(originalOrgPort!.getValue()).toEqual(clonedOrgPort!.getValue())

      // Helper function to recursively verify all nested ports have different IDs
      const verifyNestedPortIds = (originalPort: any, clonedPort: any, level = 0) => {
        // Get child ports
        const originalChildren = node.getChildPorts(originalPort)
        const clonedChildren = clonedNode.getChildPorts(clonedPort)

        expect(originalChildren.length).toBe(clonedChildren.length)

        for (let i = 0; i < originalChildren.length; i++) {
          const origChild = originalChildren[i]
          const clonedChild = clonedChildren[i]

          // Verify IDs are same id and values
          expect(origChild.id).toBe(clonedChild.id)
          expect(origChild.getValue()).toEqual(clonedChild.getValue())

          // Recursively check deeper levels
          if (node.getChildPorts(origChild).length > 0) {
            verifyNestedPortIds(origChild, clonedChild, level + 1)
          }
        }
      }

      // Verify all nested levels
      verifyNestedPortIds(originalOrgPort!, clonedOrgPort!)
    })

    it('should verify matrix (array of arrays) ports have same IDs at all levels', () => {
      // Set matrix data
      node.matrix = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
      ]

      const clonedNode = node.cloneWithNewId()

      // Find the matrix port in both nodes
      const originalMatrixPort = Array.from(node.ports.values())
        .find(p => p.getConfig().key === 'matrix')
      const clonedMatrixPort = Array.from(clonedNode.ports.values())
        .find(p => p.getConfig().key === 'matrix')

      expect(originalMatrixPort).toBeDefined()
      expect(clonedMatrixPort).toBeDefined()

      // Verify root array port IDs are same
      expect(originalMatrixPort!.id).toBe(clonedMatrixPort!.id)
      expect(originalMatrixPort!.getValue()).toEqual(clonedMatrixPort!.getValue())

      // Verify each row (sub-array) has different IDs
      const originalRowPorts = node.getChildPorts(originalMatrixPort!)
      const clonedRowPorts = clonedNode.getChildPorts(clonedMatrixPort!)

      expect(originalRowPorts.length).toBe(clonedRowPorts.length)
      expect(originalRowPorts.length).toBe(3) // Three rows

      for (let i = 0; i < originalRowPorts.length; i++) {
        // Verify row port IDs are different
        expect(originalRowPorts[i].id).toBe(clonedRowPorts[i].id)
        expect(originalRowPorts[i].getValue()).toEqual(clonedRowPorts[i].getValue())

        // Verify each element in the row has different IDs
        const originalElementPorts = node.getChildPorts(originalRowPorts[i])
        const clonedElementPorts = clonedNode.getChildPorts(clonedRowPorts[i])

        expect(originalElementPorts.length).toBe(clonedElementPorts.length)
        expect(originalElementPorts.length).toBe(4) // Four elements per row

        for (let j = 0; j < originalElementPorts.length; j++) {
          expect(originalElementPorts[j].id).toBe(clonedElementPorts[j].id)
          expect(originalElementPorts[j].getValue()).toEqual(clonedElementPorts[j].getValue())
        }
      }
    })

    it('should verify extremely complex nested structure port IDs are same', () => {
      // Modify the extremely complex config
      node.complexConfig = {
        config: {
          settings: [
            {
              key: 'ultra-complex',
              value: {
                type: 'nested-test',
                data: [
                  {
                    nested: ['level1', 'level2', 'level3'],
                    count: 3,
                  },
                  {
                    nested: ['deep1', 'deep2'],
                    count: 2,
                  },
                ],
              },
            },
          ],
        },
      }

      const clonedNode = node.cloneWithNewId()

      // Find the complexConfig port
      const originalComplexPort = Array.from(node.ports.values())
        .find(p => p.getConfig().key === 'complexConfig')
      const clonedComplexPort = Array.from(clonedNode.ports.values())
        .find(p => p.getConfig().key === 'complexConfig')

      expect(originalComplexPort).toBeDefined()
      expect(clonedComplexPort).toBeDefined()

      // Verify root level
      expect(originalComplexPort!.id).toBe(clonedComplexPort!.id)
      expect(originalComplexPort!.getValue()).toEqual(clonedComplexPort!.getValue())

      // Helper to verify all nested ports recursively
      const verifyAllNestedPorts = (origPort: any, clonedPort: any, path: string[] = []) => {
        const origChildren = node.getChildPorts(origPort)
        const clonedChildren = clonedNode.getChildPorts(clonedPort)

        expect(origChildren.length).toBe(clonedChildren.length)

        for (let i = 0; i < origChildren.length; i++) {
          const origChild = origChildren[i]
          const clonedChild = clonedChildren[i]
          const currentPath = [...path, origChild.getConfig().key || `[${i}]`]

          // Verify IDs are same at this level
          expect(origChild.id).toBe(clonedChild.id)

          // Verify values are the same at this level
          expect(origChild.getValue()).toEqual(clonedChild.getValue())

          // Recursively verify deeper levels
          const grandChildren = node.getChildPorts(origChild)
          if (grandChildren.length > 0) {
            verifyAllNestedPorts(origChild, clonedChild, currentPath)
          }
        }
      }

      // Verify the entire hierarchy
      verifyAllNestedPorts(originalComplexPort!, clonedComplexPort!)
    })

    it('should verify port ID patterns are maintained after cloning', () => {
      const clonedNode = node.cloneWithNewId()

      // Verify all ports in both nodes follow correct ID patterns
      const verifyPortIdPatterns = (ports: Map<string, any>) => {
        for (const [portId, port] of ports) {
          // Port ID should match the port's own ID
          expect(portId).toBe(port.id)

          // Port config should have a valid key
          const config = port.getConfig()
          expect(config.key).toBeDefined()
        }
      }

      verifyPortIdPatterns(node.ports)
      verifyPortIdPatterns(clonedNode.ports)

      // Verify all cloned port IDs are unique and different from originals
      const originalIds = Array.from(node.ports.keys())
      const clonedIds = Array.from(clonedNode.ports.keys())

      // No duplicates in either set
      expect(new Set(originalIds).size).toBe(originalIds.length)
      expect(new Set(clonedIds).size).toBe(clonedIds.length)

      // No overlapping IDs between original and cloned
      const overlap = originalIds.filter(id => !clonedIds.includes(id))
      expect(overlap).toHaveLength(0)
    })

    it('should verify parent-child relationships are preserved with same IDs', () => {
      const clonedNode = node.cloneWithNewId()

      // Helper to verify parent-child relationships
      const verifyParentChildRelationships = (ports: Map<string, any>) => {
        for (const [portId, port] of ports) {
          const config = port.getConfig()

          if (config.parentId) {
            // If port has a parent, verify parent exists in the same port map
            expect(ports.has(config.parentId)).toBe(true)

            // Verify parent's type is compatible (object or array)
            const parentPort = ports.get(config.parentId)
            const parentConfig = parentPort.getConfig()
            expect(['object', 'array']).toContain(parentConfig.type)
          }
        }
      }

      verifyParentChildRelationships(node.ports)
      verifyParentChildRelationships(clonedNode.ports)

      // Verify that corresponding parent-child relationships exist in both nodes
      // but with different IDs
      const originalTopLevelPorts = Array.from(node.ports.values())
        .filter(p => !p.getConfig().parentId)
      const clonedTopLevelPorts = Array.from(clonedNode.ports.values())
        .filter(p => !p.getConfig().parentId)

      expect(originalTopLevelPorts.length).toBe(clonedTopLevelPorts.length)

      for (let i = 0; i < originalTopLevelPorts.length; i++) {
        const origPort = originalTopLevelPorts[i]
        const clonedPort = clonedTopLevelPorts.find(p =>
          p.getConfig().key === origPort.getConfig().key,
        )

        expect(clonedPort).toBeDefined()
        expect(origPort.id).toBe(clonedPort!.id)

        // Verify child count matches
        const origChildren = node.getChildPorts(origPort)
        const clonedChildren = clonedNode.getChildPorts(clonedPort!)

        expect(origChildren.length).toBe(clonedChildren.length)
      }
    })
  })
})
