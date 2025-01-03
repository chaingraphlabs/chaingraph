import type { CreateNextContextOptions } from '@trpc/server/dist/adapters/next'

export interface Session {
  userId: string
}

export interface ContextWithSession {
  session: Session
}

export async function createContext(opts: CreateNextContextOptions) {
  // const session = await getSession({ req: opts.req })

  return {
    session: {
      userId: 'test_user_id',
    },
  } as ContextWithSession
}

export type Context = Awaited<ReturnType<typeof createContext>>
