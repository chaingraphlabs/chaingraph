/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryMetadata } from '@badaitech/chaingraph-types'

export const NODE_CATEGORIES = {
  MESSAGING: 'messaging',
  AI: 'ai',
  ANTHROPIC: 'anthropic',
  GEMINI: 'gemini',
  API: 'api',
  MATH: 'math',
  DATA: 'data',
  FLOW: 'flow',
  UTILITIES: 'utilities',
  BASIC_VALUES: 'basic-values',
  OTHER: 'other',
  GROUP: 'group',
  SECRET: 'secret',
  ARCHAI: 'archai',
  ARCH_RAG: 'arch-rag',
  BADAI: 'badai',
  OKX_DEX: 'okx-dex',
  BLOCKCHAIN: 'blockchain',
  MCP: 'mcp',
  CONVERTERS: 'converters',
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
    order: 100,
  },

  [NODE_CATEGORIES.ARCHAI]: {
    id: NODE_CATEGORIES.ARCHAI,
    label: 'ArchAI',
    description: 'ArchAI nodes',
    icon: 'FlaskConical',
    style: {
      light: {
        primary: '#C9F7E9', // Softer mint green
        secondary: '#E6F9F4', // Very light mint
        background: '#FFFFFF',
        text: '#0F7F58', // Darker green that complements the mint
      },
      dark: {
        primary: '#0F2E24', // Deep dark green
        secondary: '#061A14', // Even darker green
        background: '#1C1C1C',
        text: '#00D18C', // The signature bright green from your UI
      },
    },
    order: 0,
  },

  [NODE_CATEGORIES.ARCH_RAG]: {
    id: NODE_CATEGORIES.ARCH_RAG,
    label: 'Knowledge Database',
    description: 'Knowledge Database query and management nodes',
    icon: 'Database',
    style: {
      light: {
        primary: '#E3F2FD', // Soft blue
        secondary: '#F1F8FE',
        background: '#FFFFFF',
        text: '#0D47A1', // Deeper blue
      },
      dark: {
        primary: '#0D2A4A', // Deep blue
        secondary: '#071B30', // Darker blue
        background: '#1C1C1C',
        text: '#64B5F6', // Bright blue that's visible on dark
      },
    },
    order: 0,
  },

  [NODE_CATEGORIES.BADAI]: {
    id: NODE_CATEGORIES.BADAI,
    label: 'BadAI',
    description: 'BadAI nodes',
    icon: 'FlaskConical',
    style: {
      light: {
        primary: '#C9F7E9', // Softer mint green
        secondary: '#E6F9F4', // Very light mint
        background: '#FFFFFF',
        text: '#0F7F58', // Darker green that complements the mint
      },
      dark: {
        primary: '#0F2E24', // Deep dark green
        secondary: '#061A14', // Even darker green
        background: '#1C1C1C',
        text: '#00D18C', // The signature bright green from your UI
      },
    },
    order: 0,
    hidden: true,
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
  [NODE_CATEGORIES.API]: {
    id: NODE_CATEGORIES.API,
    label: 'API Calls',
    description: 'API calls and integrations',
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
    order: 3,
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
  [NODE_CATEGORIES.BASIC_VALUES]: {
    id: NODE_CATEGORIES.BASIC_VALUES,
    label: 'Basic Values',
    description: 'Nodes that provide simple constant values like text, numbers, and booleans',
    icon: 'Type',
    style: {
      light: {
        primary: '#E0F2F1',
        secondary: '#F1F9F9',
        background: '#FFFFFF',
        text: '#00796B',
      },
      dark: {
        primary: '#1C3D3A',
        secondary: '#102524',
        background: '#1C1C1C',
        text: '#80CBC4',
      },
    },
    order: 6,
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
    order: 7,
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
    order: 8,
  },

  [NODE_CATEGORIES.SECRET]: {
    id: NODE_CATEGORIES.SECRET,
    label: 'Secret',
    description: 'Secret nodes',
    icon: 'Lock', // Adding a lock icon which is more indicative of secrecy/security
    style: {
      light: {
        primary: '#E8F0FE', // Soft steel blue - security-oriented but subtle
        secondary: '#F1F7FE',
        background: '#FFFFFF',
        text: '#2C5282', // Deeper navy blue - conveys trust and security
      },
      dark: {
        primary: '#1A2E4A', // Dark navy - serious, secure feeling
        secondary: '#0F1B2E', // Even darker navy
        background: '#1C1C1C',
        text: '#90CDF4', // Light blue that's visible but not too bright
      },
    },
    order: 9,
  },

  [NODE_CATEGORIES.ANTHROPIC]: {
    id: NODE_CATEGORIES.ANTHROPIC,
    label: 'Anthropic',
    description: 'Anthropic Claude AI integration nodes',
    icon: 'Brain',
    style: {
      light: {
        primary: '#FFEAA7', // Soft warm yellow
        secondary: '#FFF9E6',
        background: '#FFFFFF',
        text: '#D63031', // Anthropic's signature orange-red
      },
      dark: {
        primary: '#4D3A1A', // Deep warm brown
        secondary: '#2E220F', // Darker brown
        background: '#1C1C1C',
        text: '#FDCB6E', // Bright warm yellow that complements the red
      },
    },
    order: 1.5, // Between AI and API
  },

  [NODE_CATEGORIES.GEMINI]: {
    id: NODE_CATEGORIES.GEMINI,
    label: 'Google Gemini',
    description: 'Google Gemini AI models and image generation',
    icon: 'Sparkles',
    style: {
      light: {
        primary: '#E3F0FF', // Soft celestial blue
        secondary: '#F0F7FF',
        background: '#FFFFFF',
        text: '#1A73E8', // Google blue - readable and recognizable
      },
      dark: {
        primary: '#1A3352', // Deep space blue
        secondary: '#0F1F33', // Darker blue
        background: '#1C1C1C',
        text: '#8AB4F8', // Bright sky blue - excellent readability on dark
      },
    },
    order: 1.7, // After Anthropic, before API
  },

  [NODE_CATEGORIES.OKX_DEX]: {
    id: NODE_CATEGORIES.OKX_DEX,
    label: 'OKX DEX API',
    description: 'OKX Decentralized Exchange API integration',
    icon: 'Wallet', // Will add this to the icons
    style: {
      light: {
        primary: '#FFF8E1', // Soft amber/gold
        secondary: '#FFFCF0',
        background: '#FFFFFF',
        text: '#B47D00', // Deeper gold/amber
      },
      dark: {
        primary: '#493C14', // Deep amber
        secondary: '#2C240B', // Darker amber
        background: '#1C1C1C',
        text: '#FFD54F', // Bright gold that's visible on dark
      },
    },
    order: 10, // After Secret
  },

  [NODE_CATEGORIES.BLOCKCHAIN]: {
    id: NODE_CATEGORIES.BLOCKCHAIN,
    label: 'Blockchain',
    description: 'Web3 wallet interactions and blockchain operations',
    icon: 'Wallet',
    style: {
      light: {
        primary: '#E3F2FD', // Soft blue
        secondary: '#F1F8FE',
        background: '#FFFFFF',
        text: '#1565C0', // Deeper blue
      },
      dark: {
        primary: '#1A3A52', // Deep blue
        secondary: '#0F2438',
        background: '#1C1C1C',
        text: '#64B5F6', // Bright blue
      },
    },
    order: 11, // After OKX_DEX
  },

  [NODE_CATEGORIES.MCP]: {
    id: NODE_CATEGORIES.MCP,
    label: 'MCP Protocol',
    description: 'Model Context Protocol nodes for tool calling, resources, and prompts',
    icon: 'Network',
    style: {
      light: {
        primary: '#FFE5CC', // Soft coral/peach
        secondary: '#FFF2E6',
        background: '#FFFFFF',
        text: '#BF5700', // Deep burnt orange
      },
      dark: {
        primary: '#4A2E1F', // Deep warm brown
        secondary: '#2E1A12', // Darker brown
        background: '#1C1C1C',
        text: '#FF9F59', // Bright coral that's visible on dark
      },
    },
    order: 3.5, // Between API and DATA
  },

  [NODE_CATEGORIES.CONVERTERS]: {
    id: NODE_CATEGORIES.CONVERTERS,
    label: 'Converters',
    description: 'Data conversion and formatting nodes',
    icon: 'ArrowRightLeft',
    style: {
      light: {
        primary: '#E8F5E9', // Soft green
        secondary: '#F1F8F2',
        background: '#FFFFFF',
        text: '#2E7D32', // Deeper green
      },
      dark: {
        primary: '#1B4D1E',
        secondary: '#0F2911',
        background: '#1C1C1C',
        text: '#81C784',
      },
    },
    order: 4.5, // Between FLOW and UTILITIES
  },

}

export function getCategoriesMetadata(): CategoryMetadata[] {
  return Object.values(CATEGORY_METADATA).sort((a, b) => a.order - b.order)
}
