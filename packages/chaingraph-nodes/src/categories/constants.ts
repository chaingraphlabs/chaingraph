import type { CategoryMetadata } from '@badaitech/chaingraph-types'

export const NODE_CATEGORIES = {
  MESSAGING: 'messaging',
  AI: 'ai',
  MATH: 'math',
  DATA: 'data',
  FLOW: 'flow',
  UTILITIES: 'utilities',
  OTHER: 'other',
  GROUP: 'group',
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
        primary: '#E2F5E9', // Soft mint green
        secondary: '#F5FAF7',
        background: '#FFFFFF',
        text: '#419a42', // Darker, more contrasty green
      },
      dark: {
        primary: '#1B4D1E',
        secondary: '#0F2911',
        background: '#1C1C1C',
        text: '#8be68d',
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
        primary: '#F3E8FD', // Soft lavender
        secondary: '#F9F4FE',
        background: '#FFFFFF',
        text: '#6200EA', // Deeper purple
      },
      dark: {
        primary: '#2D1B47',
        secondary: '#1A0F2E',
        background: '#1C1C1C',
        text: '#B794F6',
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
        primary: '#E7F1FF', // Soft sky blue
        secondary: '#F5F9FF',
        background: '#FFFFFF',
        text: '#1976D2', // Deeper blue
      },
      dark: {
        primary: '#1C3A5E',
        secondary: '#0F1F35',
        background: '#1C1C1C',
        text: '#64B5F6',
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
        primary: '#FFF3E0', // Soft orange
        secondary: '#FFF8EC',
        background: '#FFFFFF',
        text: '#E65100', // Deeper orange
      },
      dark: {
        primary: '#4D2E1B',
        secondary: '#2E1B0F',
        background: '#1C1C1C',
        text: '#FFB74D',
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
        primary: '#FCE4EC', // Soft pink
        secondary: '#FEF3F6',
        background: '#FFFFFF',
        text: '#C2185B', // Deeper pink
      },
      dark: {
        primary: '#4A1F2E',
        secondary: '#2E131C',
        background: '#1C1C1C',
        text: '#F48FB1',
      },
    },
    order: 4,
  },
  [NODE_CATEGORIES.UTILITIES]: {
    id: NODE_CATEGORIES.UTILITIES,
    label: 'Utilities',
    description: 'General purpose utility nodes',
    icon: 'Wrench',
    style: {
      light: {
        primary: '#E8EAF6', // Soft indigo
        secondary: '#F1F3FA',
        background: '#FFFFFF',
        text: '#3949AB', // Deeper indigo
      },
      dark: {
        primary: '#232858',
        secondary: '#151833',
        background: '#1C1C1C',
        text: '#7986CB',
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
        primary: '#F5F5F5', // Soft gray
        secondary: '#FAFAFA',
        background: '#FFFFFF',
        text: '#616161', // Darker gray
      },
      dark: {
        primary: '#2C2C2C',
        secondary: '#1F1F1F',
        background: '#1C1C1C',
        text: '#BDBDBD',
      },
    },
    order: 6,
  },
  [NODE_CATEGORIES.GROUP]: {
    id: NODE_CATEGORIES.GROUP,
    label: 'Group',
    description: 'Group nodes',
    icon: 'Grid',
    style: {
      light: {
        primary: '#F5F5F5', // Soft gray
        secondary: '#FAFAFA',
        background: '#FFFFFF',
        text: '#616161', // Darker gray
      },
      dark: {
        primary: '#2C2C2C',
        secondary: '#1F1F1F',
        background: '#1C1C1C',
        text: '#BDBDBD',
      },
    },
    order: 7,
  },
}
