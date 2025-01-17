import type { ComponentType, SVGProps } from 'react'
import { CustomIcon } from '@chaingraph/nodes/categories/icons/components/CustomIcon.tsx'
import { Brain, Calculator, Database, GitBranch, MessageSquare, Package, Wrench } from 'lucide-react'

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
