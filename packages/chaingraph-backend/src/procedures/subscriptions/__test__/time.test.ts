// import type { TrackedEnvelope } from '@trpc/server'
// import { createTestCaller } from '@chaingraph/backend/procedures/subscriptions/utils/utils'
// import { describe, expect, it } from 'vitest'
//
// describe('time subscription', () => {
//   const caller = createTestCaller()
//   //
//   // beforeEach(() => {
//   //   timeEmitter.start()
//   // })
//   //
//   // afterEach(() => {
//   //   timeEmitter.stop()
//   // })
//
//   it('should receive tracked time updates', () => {
//     return new Promise<void>((resolve, reject) => {
//       let updateCount = 0
//       const receivedIds = new Set<string>()
//       const startTime = Date.now()
//       const timeout = setTimeout(() => {
//         reject(new Error('Test timeout - no events received'))
//       }, 5000)
//
//       const subscription = caller.currentTime.subscribe(
//         undefined,
//         {
//           onData: (data: TrackedEnvelope<Date>) => {
//             const [id, time] = data
//             expect(time).toBeInstanceOf(Date)
//             expect(typeof id).toBe('string')
//             receivedIds.add(id)
//             updateCount++
//
//             if (updateCount >= 2) {
//               clearTimeout(timeout)
//               expect(receivedIds.size).toBe(2)
//               subscription.unsubscribe()
//               resolve()
//             }
//           },
//           onError: (error) => {
//             console.error('Subscription error:', error)
//             clearTimeout(timeout)
//             reject(error)
//           },
//           onComplete: () => {},
//         },
//       )
//     })
//   }, { timeout: 10000 })
// })
