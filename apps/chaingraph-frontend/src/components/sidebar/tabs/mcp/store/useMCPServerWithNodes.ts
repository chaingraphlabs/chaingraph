/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { $mcpServersWithNodes } from '@/components/sidebar/tabs/mcp/store/stores'
import { useStoreMap } from 'effector-react'

export function useMCPServerWithNodes(serverId: string) {
  return useStoreMap({
    store: $mcpServersWithNodes,
    keys: [serverId],
    fn: (servers, [id]) => servers.find(s => s.id === id) || null,
  })
}
