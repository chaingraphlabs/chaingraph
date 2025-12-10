/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ComponentType, SVGProps } from 'react'
import {
  Brain,
  Calculator,
  Database,
  FlaskConical,
  GitBranch,
  Grid,
  Layers,
  Lock,
  MessageSquare,
  Package,
  Sparkles,
  Type,
  Wallet,
  Wrench,
} from 'lucide-react'

// Define type for icon props
export type IconProps = SVGProps<SVGSVGElement>

// Type for our icon components
export type IconComponent = ComponentType<IconProps>

// Registry for all category icons
export const CategoryIcons = {
  // Lucide icons
  MessageSquare,
  Brain,
  Calculator,
  Database,
  GitBranch,
  Wrench,
  Package,
  Grid,
  Type,
  Lock,
  FlaskConical,
  Wallet,
  Sparkles,
  Layers,
} as const satisfies Record<string, IconComponent>

export type CategoryIconName = keyof typeof CategoryIcons

export function isCategoryIcon(name: string): name is CategoryIconName {
  return name in CategoryIcons
}

export function getCategoryIcon(name: string): IconComponent {
  if (isCategoryIcon(name)) {
    return CategoryIcons[name]!
  }

  // Try to dynamically import from lucide-react
  try {
    // eslint-disable-next-line ts/no-require-imports
    const lucideReact = require('lucide-react')
    if (lucideReact[name] && typeof lucideReact[name] === 'function') {
      return lucideReact[name] as IconComponent
    }
  } catch {
    // Fall back to default if import fails
  }

  return CategoryIcons.Type!
}
