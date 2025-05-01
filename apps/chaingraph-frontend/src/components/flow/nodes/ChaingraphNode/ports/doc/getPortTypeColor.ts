/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig } from '@badaitech/chaingraph-types'
import Color from 'color'

// Get a color based on port type
export function getPortTypeColor(theme: 'light' | 'dark', portConfig: IPortConfig) {
  const defaultColorMap: Record<string, string> = {
    string: '#e70d0d', // blue
    number: '#1f5eec', // red
    boolean: '#4cd53b', // green
    array: '#1acbe8', // purple
    object: '#e44df5', // orange
    stream: '#ffa047', // cyan
    enum: '#eedf3c', // pink
    any: '#cccccc', // gray
  }

  let borderColor = portConfig.ui?.borderColor || defaultColorMap[portConfig.type] || '#272727'
  const bgColor = portConfig.ui?.bgColor || defaultColorMap[portConfig.type] || '#cccccc'

  let textColor = borderColor
  let circleColor = bgColor
  let headerBgColor = bgColor

  // for the dark theme switch colors
  if (theme === 'dark') {
    textColor = new Color(bgColor)
      .lighten(0.3)
      .whiten(0.4)
      .hex()

    headerBgColor = new Color(borderColor)
      .fade(0.1)
      // .blacken(0.1)
      .whiten(0.1)
      .hex()

    circleColor = bgColor
    borderColor = new Color(borderColor).blacken(0.2).hex()
  }

  if (theme === 'light') {
    // for the light header bg color must be very light pastel color
    headerBgColor = new Color(circleColor)
      .lighten(0.4)
      .whiten(0.2)
      .hex()

    borderColor = new Color(headerBgColor)
      .darken(0.005)
      .saturate(0.1)
      .hex()
  }
  // const portColorBgLight = new Color(portColor.bgColor)
  //   .lighten(0.2)
  //   .saturate(0.01)
  //   .fade(0.5)
  //   .hex()

  return {
    textColor,
    headerBgColor,
    circleColor,
    borderColor,
    // bgColor,
  }
}
