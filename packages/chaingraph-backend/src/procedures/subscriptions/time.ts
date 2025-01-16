// import { timeEmitter } from '@chaingraph/backend/services/events/timeEmitter'
// import { publicProcedure } from '@chaingraph/backend/trpc'
// import { tracked } from '@trpc/server'
// import { z } from 'zod'
// import { zAsyncIterable } from './utils/zAsyncIterable'
//
// export const currentTime = publicProcedure
//   .input(
//     z.object({
//       lastEventId: z.string().nullish(),
//     }).optional(),
//   )
//   .output(
//     zAsyncIterable({
//       yield: z.date(),
//       tracked: true,
//     }),
//   )
//   .subscription(async function* ({ input }) {
//     timeEmitter.start()
//
//     try {
//       let eventId = input?.lastEventId ? Number(input.lastEventId) : 0
//
//       while (true) {
//         const time = await new Promise<Date>((resolve) => {
//           const cleanup = timeEmitter.subscribe((t) => {
//             cleanup()
//             resolve(t)
//           })
//         })
//
//         eventId++
//         yield tracked(String(eventId), time)
//       }
//     } finally {
//       timeEmitter.stop()
//     }
//   })
