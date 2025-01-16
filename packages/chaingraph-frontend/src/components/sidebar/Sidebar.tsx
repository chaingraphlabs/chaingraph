import {
  CodeIcon,
  GearIcon,
  LayersIcon,
  QuestionMarkIcon,
  Share1Icon,
  ValueIcon,
} from '@radix-ui/react-icons'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import React, { useEffect, useState } from 'react'
import { EventList } from './tabs/EventList'
import { FlowList } from './tabs/FlowList'
import { Help } from './tabs/Help'
import { NodeList } from './tabs/node-list'
import { Settings } from './tabs/Settings'
import { VariableList } from './tabs/VariableList'

function SidebarTooltip({ children, content }: { children: React.ReactNode, content: string }) {
  return (
    <TooltipPrimitive.Provider delayDuration={0}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="right"
            sideOffset={5}
            className="z-50 px-2 py-1 text-sm font-medium
                       bg-ui-surface-light dark:bg-ui-surface-dark
                       text-gray-700 dark:text-gray-300
                       border border-ui-border-light dark:border-ui-border-dark
                       rounded shadow-md"
          >
            {content}
            <TooltipPrimitive.Arrow
              className="fill-ui-surface-light dark:fill-ui-surface-dark"
            />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

// Constants for localStorage keys
const STORAGE_KEYS = {
  ACTIVE_TAB: 'sidebar-active-tab',
  IS_EXPANDED: 'sidebar-is-expanded',
} as const

// Helper functions for localStorage
function getStoredState() {
  try {
    return {
      activeTab: localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB),
      isExpanded: localStorage.getItem(STORAGE_KEYS.IS_EXPANDED) === 'true',
    }
  } catch (error) {
    console.warn('Failed to get sidebar state from localStorage:', error)
    return { activeTab: null, isExpanded: false }
  }
}

function setStoredState(activeTab: string | null, isExpanded: boolean) {
  try {
    if (activeTab)
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab)
    else
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB)

    localStorage.setItem(STORAGE_KEYS.IS_EXPANDED, String(isExpanded))
  } catch (error) {
    console.warn('Failed to save sidebar state to localStorage:', error)
  }
}

const tabs = [
  {
    id: 'flows',
    icon: <Share1Icon />,
    label: 'Flows',
    content: <FlowList />,
  },
  {
    id: 'nodes',
    icon: <LayersIcon />,
    label: 'Nodes',
    content: <NodeList />,
  },
  {
    id: 'events',
    icon: <CodeIcon />,
    label: 'Events',
    content: <EventList />,
  },
  {
    id: 'variables',
    icon: <ValueIcon />,
    label: 'Variables',
    content: <VariableList />,
  },
  {
    id: 'settings',
    icon: <GearIcon />,
    label: 'Settings',
    content: <Settings />,
  },
  {
    id: 'help',
    icon: <QuestionMarkIcon />,
    label: 'Help',
    content: <Help />,
  },
] as const

export function Sidebar() {
  // Initialize state from localStorage
  const [activeTab, setActiveTab] = useState<string | null>(() => getStoredState().activeTab)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => getStoredState().isExpanded)

  // Save state changes to localStorage
  useEffect(() => {
    setStoredState(activeTab, isExpanded)
  }, [activeTab, isExpanded])

  const handleTabClick = (tabId: string) => {
    if (activeTab === tabId) {
      setIsExpanded(false)
      setActiveTab(null)
    } else {
      setIsExpanded(true)
      setActiveTab(tabId)
    }
  }

  return (
    <div className="flex h-full">
      {/* Icon Bar */}
      <div className="flex flex-col w-12 bg-ui-surface-light dark:bg-ui-surface-dark border-r border-ui-border-light dark:border-ui-border-dark">
        {tabs.map(tab => (
          <SidebarTooltip key={tab.id} content={tab.label}>
            <button
              onClick={() => handleTabClick(tab.id)}
              className={`
                w-12 h-12
                flex items-center justify-center
                hover:bg-ui-accent-light dark:hover:bg-ui-accent-dark
                transition-colors duration-200
                ${activeTab === tab.id ? 'bg-ui-accent-light dark:bg-ui-accent-dark' : ''}
              `}
            >
              <div className="flex items-center justify-center w-5 h-5 text-gray-700 dark:text-gray-300">
                {tab.icon}
              </div>
            </button>
          </SidebarTooltip>
        ))}
      </div>

      {/* Content Panel */}
      {isExpanded && activeTab && (
        <div className="w-80 bg-ui-surface-light dark:bg-ui-surface-dark border-r border-ui-border-light dark:border-ui-border-dark">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            {tabs.find(t => t.id === activeTab)?.content}
          </div>
        </div>
      )}
    </div>
  )
}
