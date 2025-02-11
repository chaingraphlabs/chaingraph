/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// import { timeEmitter } from '@badaitech/chaingraph-backend/services/events/timeEmitter'
// import { publicProcedure } from '@badaitech/chaingraph-backend/trpc'
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
