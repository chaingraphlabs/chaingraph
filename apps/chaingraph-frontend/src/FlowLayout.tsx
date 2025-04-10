/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { Flow } from './components/flow'
import { Sidebar } from './components/sidebar'
import { ThemeToggle } from './components/theme'

export function FlowLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1">
        <Flow />
      </div>
      <ThemeToggle />
    </div>
  )
}
