import {
  ChevronLeftIcon,
  CodeIcon,
  GearIcon,
  LayersIcon,
  QuestionMarkIcon,
  Share1Icon,
  ValueIcon,
} from '@radix-ui/react-icons'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { ScrollArea } from '@radix-ui/themes'
import React, { useEffect, useRef, useState } from 'react'
import { EventList } from './tabs/EventList'
import { FlowList } from './tabs/flow/FlowList.tsx'
import { Help } from './tabs/Help'
import { NodeList } from './tabs/node-list'
import { Settings } from './tabs/Settings'
import { VariableList } from './tabs/VariableList'
import './style/sidebar.css'

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
  WIDTH: 'sidebar-width',
} as const

const DEFAULT_WIDTH = 320 // Default width in pixels
const MIN_WIDTH = 200 // Minimum width
const MAX_WIDTH = 600 // Maximum width

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
  // State management with localStorage persistence
  const [activeTab, setActiveTab] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB)
  })

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.IS_EXPANDED) === 'true'
  })

  const [width, setWidth] = useState<number>(() => {
    return Number(localStorage.getItem(STORAGE_KEYS.WIDTH)) || DEFAULT_WIDTH
  })

  // Refs for resize functionality
  const isResizing = useRef(false)
  const initialX = useRef(0)
  const initialWidth = useRef(0)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Persist state changes to localStorage
  useEffect(() => {
    if (activeTab)
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab)
    else
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB)

    localStorage.setItem(STORAGE_KEYS.IS_EXPANDED, String(isExpanded))
    localStorage.setItem(STORAGE_KEYS.WIDTH, String(width))
  }, [activeTab, isExpanded, width])

  const handleTabClick = (tabId: string) => {
    if (activeTab === tabId) {
      setIsExpanded(false)
      setActiveTab(null)
    } else {
      setIsExpanded(true)
      setActiveTab(tabId)
    }
  }

  // Handle resize movement
  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing.current)
      return

    // Calculate new width based on initial position and movement
    const deltaX = e.clientX - initialX.current
    const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, initialWidth.current + deltaX))

    setWidth(newWidth)
  }

  // Clean up resize operation
  const handleResizeEnd = () => {
    isResizing.current = false
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)

    // Reset cursor and text selection
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  // Handle the start of resize operation
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    initialX.current = e.clientX
    initialWidth.current = width

    // Add event listeners for resize handling
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)

    // Update cursor and prevent text selection during resize
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div className="flex h-full" ref={sidebarRef}>
      {/* Sidebar icons navigation */}
      <div className="flex flex-col w-12 bg-ui-surface-light dark:bg-ui-surface-dark
                    border-r border-ui-border-light dark:border-ui-border-dark"
      >
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

      {/* Content Panel with Resize Handle */}
      {isExpanded && activeTab && (
        <div
          className="relative bg-ui-surface-light dark:bg-ui-surface-dark
                     border-r border-ui-border-light dark:border-ui-border-dark"
          style={{ width: `${width}px` }}
        >
          {/* Collapse Button */}
          <button
            onClick={() => {
              setIsExpanded(false)
              setActiveTab(null)
            }}
            className="absolute top-2 right-[-15px] h-10 w-[15px]
             bg-ui-surface-light dark:bg-ui-surface-dark
             border-t border-r border-b
             border-ui-border-light dark:border-ui-border-dark
             rounded-r-md
             hover:bg-ui-accent-light dark:hover:bg-ui-accent-dark
             group
             transition-all duration-200
             z-10
             flex items-center justify-center

             before:absolute before:inset-[-1px] before:right-[15px]
             before:bg-ui-surface-light dark:before:bg-ui-surface-dark
             before:z-[-1]"
          >
            <ChevronLeftIcon
              className="w-4 h-4
               text-gray-400 dark:text-gray-500
               group-hover:text-gray-700 dark:group-hover:text-gray-300
               transition-colors duration-200"
            />
          </button>

          <ScrollArea className="h-full">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              {tabs.find(t => t.id === activeTab)?.content}
            </div>
          </ScrollArea>

          {/* Resize Handle */}
          <div
            className="absolute top-0 right-[-4px] bottom-0 w-2 cursor-ew-resize
                       hover:bg-primary-500 hover:opacity-50
                       transition-colors duration-200"
            onMouseDown={handleResizeStart}
          />
        </div>
      )}
    </div>
  )
}
