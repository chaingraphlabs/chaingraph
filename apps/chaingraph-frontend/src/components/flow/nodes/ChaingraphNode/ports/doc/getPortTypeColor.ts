/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig, PortType } from '@badaitech/chaingraph-types'
import Color from 'color'

// Get a color based on port type
export function getPortTypeColor(theme: 'light' | 'dark', portConfig: IPortConfig) {
  const defaultColorMap: Record<PortType, string> = {
    string: '#e70d0d', // red
    number: '#1f5eec', // blue
    boolean: '#4cd53b', // green
    array: '#1acbe8', // cyan
    object: '#e44df5', // purple
    stream: '#ffa047', // orange
    enum: '#eedf3c', // yellow
    any: '#cccccc', // gray
    secret: '#008080', // Teal
  }

  let borderColor = portConfig.ui?.borderColor || defaultColorMap[portConfig.type] || '#272727'
  let bgColor = portConfig.ui?.bgColor || defaultColorMap[portConfig.type] || '#cccccc'

  if (portConfig.type === 'any' && portConfig.underlyingType && portConfig.underlyingType.type !== 'any') {
    // If type is 'any' but has an underlying type, use that type's color
    const underlyingTypeUI = portConfig.underlyingType.ui || {}
    borderColor = underlyingTypeUI.borderColor || defaultColorMap[portConfig.underlyingType.type] || borderColor
    bgColor = underlyingTypeUI.bgColor || defaultColorMap[portConfig.underlyingType.type] || bgColor
    // borderColor = defaultColorMap[portConfig.underlyingType.type] || borderColor
    // bgColor = defaultColorMap[portConfig.underlyingType.type] || bgColor
  }

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
