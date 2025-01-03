import { createContext } from '@chaingraph/backend/context'
import { createHTTPServer } from '@trpc/server/adapters/standalone'
import cors from 'cors'
import { appRouter } from './router'

const server = createHTTPServer({
  middleware: cors(),
  router: appRouter,
  createContext,
})

server.listen(3000)
console.log('Server running on http://localhost:3000')
