/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// export const _ = createTRPCClient({
//   // TODO: from env
//   url: `ws://localhost:3001`,
//   superjsonCustom: SuperJSON,
// })

// export type TRPCClient = ReturnType<typeof createTRPCClient>

// let _trpcClient: TRPCClient | null = null
//
// export function getStaticTRPCClient(
//   trpcURL?: string,
//   superjsonCustom?: typeof SuperJSON,
// ) {
//   if (_trpcClient === null) {
//     _trpcClient = createTRPCClient({
//       url: trpcURL ?? `ws://localhost:3001`,
//       superjsonCustom,
//     })
//   }
//
//   return _trpcClient
// }
//
// export function isStaticTRPCClientExists() {
//   return !!_trpcClient
// }
//
// export function setStaticTRPCClient(client: TRPCClient) {
//   _trpcClient = client
// }
