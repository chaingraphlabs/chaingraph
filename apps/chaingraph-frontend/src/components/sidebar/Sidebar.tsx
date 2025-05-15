/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { DebugPanel } from '@/components/sidebar/tabs/debug/DebugPanel'
import { FlowList } from '@/components/sidebar/tabs/flow/FlowList'
import { NodeList } from '@/components/sidebar/tabs/node-list'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { initConfig } from '@/store/archai'
import { setActiveFlowId } from '@/store/flow'
import {
  ChevronLeftIcon,
  CodeIcon,
  GearIcon,
  QuestionMarkIcon,
  Share1Icon,
  ValueIcon,
} from '@radix-ui/react-icons'
import { Bug, LayersIcon, Scroll } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ArchAIIntegration } from './tabs/archai-integration'
import { EventList } from './tabs/EventList'
import { Help } from './tabs/Help'
import { Settings } from './tabs/Settings'
import { VariableList } from './tabs/VariableList'

// Constants для localStorage остаются те же
const STORAGE_KEYS = {
  ACTIVE_TAB: 'sidebar-active-tab',
  IS_EXPANDED: 'sidebar-is-expanded',
  WIDTH: 'sidebar-width',
} as const

export type tabsType = 'flows' | 'nodes' | 'events' | 'variables' | 'debug' | 'settings' | 'help' | 'archai'

const defaultEnabledTabs: tabsType[] = [
  'flows',
  'nodes',
  // 'events',
  // 'variables',
  'debug',
  'archai',
  // 'settings',
  // 'help',
]

const DEFAULT_WIDTH = 320
const MIN_WIDTH = 200
const MAX_WIDTH = 1200

// sidebar prop types
export interface SidebarProps {
  onFlowSelected?: (flowId: string) => void
  enabledTabs?: tabsType[]
}

export function Sidebar({
  onFlowSelected,
  enabledTabs = defaultEnabledTabs,
}: SidebarProps) {
  const tabs = [
    {
      id: 'flows',
      icon: <Share1Icon />,
      label: 'Flows',
      content: (
        <FlowList onFlowSelected={({ flowId }) => {
          // navigate(`/flow/${flowId}`)
          setActiveFlowId(flowId)
          onFlowSelected?.(flowId)
        }}
        />
      ),
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
      id: 'debug',
      icon: <Bug />,
      label: 'Debug',
      content: <DebugPanel />,
    },
    {
      id: 'archai',
      icon: <Scroll />,
      label: 'ArchAI Integration',
      content: <ArchAIIntegration />,
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
  ].filter(tab => enabledTabs === undefined || enabledTabs.includes(tab.id as tabsType))

  const [activeTab, setActiveTab] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB)
  })

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.IS_EXPANDED) === 'true'
  })

  const [width, setWidth] = useState<number>(() => {
    return Number(localStorage.getItem(STORAGE_KEYS.WIDTH)) || DEFAULT_WIDTH
  })

  // Initialize archai config from localStorage on mount
  useEffect(() => {
    initConfig()
  }, [])

  // Refs for resize handlers
  const isResizing = useRef(false)
  const initialX = useRef(0)
  const initialWidth = useRef(0)
  const sidebarRef = useRef<HTMLDivElement>(null)

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

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing.current)
      return

    const deltaX = e.clientX - initialX.current
    const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, initialWidth.current + deltaX))

    setWidth(newWidth)
  }

  const handleResizeEnd = () => {
    isResizing.current = false
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    initialX.current = e.clientX
    initialWidth.current = width

    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div className="flex h-full" ref={sidebarRef}>
      {/* Sidebar icons navigation */}
      <div className="flex flex-col w-12 bg-card border-r">
        <TooltipProvider delayDuration={0}>
          {tabs.map(tab => (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'w-12 h-12 rounded-none',
                    activeTab === tab.id && 'bg-accent',
                  )}
                  onClick={() => handleTabClick(tab.id)}
                >
                  <div className="w-4 h-4 text-muted-foreground">
                    {tab.icon}
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                {tab.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      {/* Content Panel with Resize Handle */}
      {isExpanded && activeTab && (
        <div
          className="relative bg-card border-r"
          style={{ width: `${width}px` }}
        >
          {/* Collapse Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsExpanded(false)
              setActiveTab(null)
            }}
            className="absolute top-2 -right-[15px] h-10 w-[15px]
             bg-card  border-t border-r border-b
             rounded-none rounded-tr-md rounded-br-md
             hover:bg-accent
             group z-10
             transition-all duration-200
             flex items-center justify-center
             before:absolute before:inset-[-1px] before:right-[15px]
             before:bg-card before:z-[-1]"
          >
            <ChevronLeftIcon
              className="w-4 h-4
               text-muted-foreground/40
               group-hover:text-muted-foreground
               transition-colors duration-200"
            />
          </Button>

          <ScrollArea className="h-full">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              {tabs.find(t => t.id === activeTab)?.content}
            </div>
          </ScrollArea>

          {/* Resize Handle */}
          <div
            className="absolute top-0 right-0 h-full w-1 cursor-ew-resize
                     transition-colors"
            onMouseDown={handleResizeStart}
          />
        </div>
      )}
    </div>
  )
}
