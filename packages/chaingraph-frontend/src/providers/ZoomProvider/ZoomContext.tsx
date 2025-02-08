/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { createContext } from 'react'

interface ZoomContextType {
  zoom: number
  setZoom: (zoom: number) => void
}

export const ZoomContext = createContext<ZoomContextType>({
  zoom: 1,
  setZoom: () => {},
})
