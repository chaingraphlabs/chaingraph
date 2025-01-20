import type { CategorizedNodes } from '@chaingraph/types'
import { publicProcedure, router } from '@chaingraph/backend/trpc'
import { z } from 'zod'

export const nodeRegistryProcedures = router({
  // Get all nodes grouped by categories
  getCategorizedNodes: publicProcedure
    .query(async ({ ctx }): Promise<CategorizedNodes[]> => {
      // return ctx.nodesCatalog.getAllNodes()
      const nodes = ctx.nodesCatalog.getAllNodes()
      for (const category of nodes) {
        for (const node of category.nodes) {
          if (typeof node.version === 'string') {
            console.warn(`Node "${node.type}" has a string version`)
          }
        }
      }

      return nodes
    }),

  // Search nodes across all categories
  searchNodes: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }): Promise<CategorizedNodes[]> => {
      return ctx.nodesCatalog.searchNodes(input)
    }),

  // Get nodes for specific category
  getNodesByCategory: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }): Promise<CategorizedNodes | undefined> => {
      return ctx.nodesCatalog.getNodesByCategory(input)
    }),

  // Get available categories
  getCategories: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.nodesCatalog.getCategories()
    }),

  // Get specific node type
  getNodeType: publicProcedure
    .input(z.string())
    .query(async ({ input: nodeType, ctx }) => {
      const node = ctx.nodesCatalog.getNodeByType(nodeType)
      if (!node) {
        throw new Error(`Node type "${nodeType}" not found`)
      }
      return node
    }),

  // Legacy procedure for backward compatibility
  listAvailableTypes: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.nodesCatalog.getAllNodes().flatMap(category => category.nodes)
    }),
})
