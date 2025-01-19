import { initializeCategoriesFx } from '@/store/categories/init.ts'
import { initializeFlowsFx } from '@/store/flow/init.ts'
import './flow/init'
import './nodes/init'
import './categories/init'

/**
 * Initialize all stores and load initial data
 */
export async function initializeStores() {
  try {
    // Initialize stores in parallel
    await Promise.all([
      initializeCategoriesFx(),
      initializeFlowsFx(),
    ])

    console.log('Stores initialized successfully')
  } catch (error) {
    console.error('Failed to initialize stores:', error)
    throw error
  }
}
