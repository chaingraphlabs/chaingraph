import type { Context } from '@chaingraph/backend/context'
import type { AppRouter } from '@chaingraph/backend/router'
import type { inferProcedureInput, TrackedEnvelope } from '@trpc/server'
import { createCaller } from '@chaingraph/backend/router'

export interface TestObservable<TData> {
  subscribe: (callbacks: {
    onData: (data: TData) => void
    onError?: (err: Error) => void
    onComplete?: () => void
  }) => {
    unsubscribe: () => void
    closed: boolean
  }
}

export function createTestCaller() {
  const ctx: Context = {
    session: {
      userId: 'test-user-id',
    },
  }
  const caller = createCaller(ctx)

  return {
    ...caller,
    currentTime: {
      subscribe(
        input: inferProcedureInput<AppRouter['currentTime']>,
        callbacks: Parameters<TestObservable<TrackedEnvelope<Date>>['subscribe']>[0],
      ) {
        console.log('Test caller: Creating subscription')
        let closed = false

        const unsubscribe = () => {
          console.log('Test caller: Unsubscribing')
          closed = true
        }

        const process = async () => {
          try {
            console.log('Test caller: Starting subscription processing')
            const asyncIterable = await caller.currentTime(input)

            for await (const item of asyncIterable) {
              if (closed) {
                console.log('Test caller: Subscription closed, breaking loop')
                break
              }
              console.log('Test caller: Received item:', item)
              callbacks.onData(item as unknown as TrackedEnvelope<Date>)
            }
            callbacks.onComplete?.()
          } catch (err) {
            console.error('Test caller: Error in subscription:', err)
            callbacks.onError?.(err as Error)
          }
        }

        process().catch((err) => {
          console.error('Test caller: Error in process:', err)
          callbacks.onError?.(err)
        })

        return {
          unsubscribe,
          get closed() {
            return closed
          },
        }
      },
    },
  }
}
