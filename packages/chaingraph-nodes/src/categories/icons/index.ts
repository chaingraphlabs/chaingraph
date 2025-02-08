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
  GitBranch,
  Grid,
  MessageSquare,
  Package,
  Wrench,
} from 'lucide-react'
import { CustomIcon } from './components/CustomIcon'

// Define type for icon props
export type IconProps = SVGProps<SVGSVGElement>

// Type for our icon components
export type IconComponent = ComponentType<IconProps>

// Registry for all category icons
export const CategoryIcons: Record<string, IconComponent> = {
  // Lucide icons
  MessageSquare,
  Brain,
  Calculator,
  Database,
  GitBranch,
  Wrench,
  Package,
  Grid,

  // Custom icons
  CustomIcon,
} as const

export type CategoryIconName = keyof typeof CategoryIcons

export function isCategoryIcon(name: string): name is CategoryIconName {
  return name in CategoryIcons
}

export function getCategoryIcon(name: string): IconComponent {
  if (isCategoryIcon(name)) {
    return CategoryIcons[name]
  }
  return CategoryIcons.CustomIcon
}
