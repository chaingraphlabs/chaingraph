import type { CategoryMetadata } from '@chaingraph/types/node/category'

export const NODE_CATEGORIES = {
  MESSAGING: 'messaging',
  AI: 'ai',
  MATH: 'math',
  DATA: 'data',
  FLOW: 'flow',
  UTILITIES: 'utilities',
  OTHER: 'other',
} as const

export type NodeCategoryKey = keyof typeof NODE_CATEGORIES
export type NodeCategoryValue = typeof NODE_CATEGORIES[NodeCategoryKey]

export const CATEGORY_METADATA: Record<NodeCategoryValue, CategoryMetadata> = {
  [NODE_CATEGORIES.MESSAGING]: {
    id: NODE_CATEGORIES.MESSAGING,
    label: 'Messaging',
    description: 'Create and manipulate messages',
    icon: 'MessageSquare',
    style: {
      light: {
        primary: '#10B981', // Emerald 500
        secondary: '#D1FAE5', // Emerald 100
        background: '#ECFDF5', // Emerald 50
        text: '#065F46', // Emerald 800
      },
      dark: {
        primary: '#059669', // Emerald 600
        secondary: '#064E3B', // Emerald 900
        background: '#064E3B', // Emerald 900
        text: '#A7F3D0', // Emerald 200
      },
    },
    order: 0,
  },
  [NODE_CATEGORIES.AI]: {
    id: NODE_CATEGORIES.AI,
    label: 'AI & ML',
    description: 'Artificial Intelligence and Machine Learning nodes',
    icon: 'Brain',
    style: {
      light: {
        primary: '#8B5CF6', // Violet 500
        secondary: '#EDE9FE', // Violet 100
        background: '#F5F3FF', // Violet 50
        text: '#5B21B6', // Violet 800
      },
      dark: {
        primary: '#7C3AED', // Violet 600
        secondary: '#4C1D95', // Violet 900
        background: '#4C1D95', // Violet 900
        text: '#DDD6FE', // Violet 200
      },
    },
    order: 1,
  },
  [NODE_CATEGORIES.MATH]: {
    id: NODE_CATEGORIES.MATH,
    label: 'Math',
    description: 'Mathematical operations and calculations',
    icon: 'Calculator',
    style: {
      light: {
        primary: '#3B82F6', // Blue 500
        secondary: '#DBEAFE', // Blue 100
        background: '#EFF6FF', // Blue 50
        text: '#1E40AF', // Blue 800
      },
      dark: {
        primary: '#2563EB', // Blue 600
        secondary: '#1E3A8A', // Blue 900
        background: '#1E3A8A', // Blue 900
        text: '#BFDBFE', // Blue 200
      },
    },
    order: 2,
  },
  [NODE_CATEGORIES.DATA]: {
    id: NODE_CATEGORIES.DATA,
    label: 'Data',
    description: 'Data transformation and processing',
    icon: 'Database',
    style: {
      light: {
        primary: '#F59E0B', // Amber 500
        secondary: '#FEF3C7', // Amber 100
        background: '#FFFBEB', // Amber 50
        text: '#92400E', // Amber 800
      },
      dark: {
        primary: '#D97706', // Amber 600
        secondary: '#78350F', // Amber 900
        background: '#78350F', // Amber 900
        text: '#FDE68A', // Amber 200
      },
    },
    order: 3,
  },
  [NODE_CATEGORIES.FLOW]: {
    id: NODE_CATEGORIES.FLOW,
    label: 'Flow Control',
    description: 'Control flow and execution logic',
    icon: 'GitBranch',
    style: {
      light: {
        primary: '#EC4899', // Pink 500
        secondary: '#FCE7F3', // Pink 100
        background: '#FDF2F8', // Pink 50
        text: '#9D174D', // Pink 800
      },
      dark: {
        primary: '#DB2777', // Pink 600
        secondary: '#831843', // Pink 900
        background: '#831843', // Pink 900
        text: '#FBCFE8', // Pink 200
      },
    },
    order: 4,
  },
  [NODE_CATEGORIES.UTILITIES]: {
    id: NODE_CATEGORIES.UTILITIES,
    label: 'Utilities',
    description: 'General purpose utility nodes',
    icon: 'Tool',
    style: {
      light: {
        primary: '#6366F1', // Indigo 500
        secondary: '#E0E7FF', // Indigo 100
        background: '#EEF2FF', // Indigo 50
        text: '#3730A3', // Indigo 800
      },
      dark: {
        primary: '#4F46E5', // Indigo 600
        secondary: '#312E81', // Indigo 900
        background: '#312E81', // Indigo 900
        text: '#C7D2FE', // Indigo 200
      },
    },
    order: 5,
  },
  [NODE_CATEGORIES.OTHER]: {
    id: 'other',
    label: 'Other',
    description: 'Other nodes',
    icon: 'Package',
    style: {
      light: {
        primary: '#64748B', // Slate 500
        secondary: '#F1F5F9', // Slate 100
        background: '#F8FAFC', // Slate 50
        text: '#334155', // Slate 700
      },
      dark: {
        primary: '#475569', // Slate 600
        secondary: '#0F172A', // Slate 900
        background: '#0F172A', // Slate 900
        text: '#CBD5E1', // Slate 300
      },
    },
    order: 6,
  },
}
