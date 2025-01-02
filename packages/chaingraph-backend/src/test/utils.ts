import { createCaller } from '@chaingraph/backend/router'

// Create a context type if needed
interface Context {
  // Add any context properties you need
}

export function createTestCaller() {
  const ctx: Context = {
    // Add context properties if needed
  }
  return createCaller(ctx)
}
