import { procedures } from './procedures'
import { createCallerFactory, router } from './trpc'

export const appRouter = router(procedures)
export type AppRouter = typeof appRouter

// Create and export the caller factory
export const createCaller = createCallerFactory(appRouter)
