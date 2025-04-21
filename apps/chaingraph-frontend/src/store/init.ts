/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// import './flow/init'
// import './nodes/init'
// import './ports/init'
// import './edges/init'
// import './execution/init'

import { init as categoriesInit } from './categories/init'
import { init as edgesInit } from './edges/init'
import { init as executionInit } from './execution/init'
import { init as flowInit } from './flow/init'
import { init as nodesInit } from './nodes/init'
import { init as portsInit } from './ports/init'

export function init() {
  categoriesInit()
  flowInit()
  nodesInit()
  edgesInit()
  portsInit()
  executionInit()
}
