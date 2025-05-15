/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  AnyPortConfig,
  ArrayPortConfig,
  BooleanPortConfig,
  EnumPortConfig,
  IPort,
  IPortConfig,
  NumberPortConfig,
  ObjectPortConfig,
  StreamPortConfig,
  StringPortConfig,
} from '@badaitech/chaingraph-types'
import { formatValue } from '@/components/flow/nodes/ChaingraphNode/ports/doc/formatValue'
import { useTheme } from '@/components/theme'
import { Badge, Collapsible, CollapsibleContent, CollapsibleTrigger, ScrollArea } from '@/components/ui'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { getPortTypeColor } from './getPortTypeColor'

interface PortDocContentProps<C extends IPortConfig> {
  port: IPort<C>
  className?: string
}

export function PortDocContent<C extends IPortConfig>({
  port,
  className,
}: PortDocContentProps<C>) {
  const { theme } = useTheme()
  const config = port.getConfig()
  const [containerHeight, setContainerHeight] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate available height for component
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        // Get available viewport height
        const viewportHeight = window.innerHeight
        // Set max height to 80% of viewport
        const maxHeight = Math.round(viewportHeight * 0.8)
        setContainerHeight(maxHeight)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Function to format description with proper line breaks
  const formatDescriptionWithBreaks = (description: string) => {
    return description?.split('\n').map((line, index) => (
      <div
        key={index}
        className={cn(
          line.trim() === '' && 'h-2', // Add spacing for empty lines
          'whitespace-pre-wrap',
        )}
      >
        {line}
      </div>
    ))
  }

  // Get appropriate color for the port
  const portColor = getPortTypeColor(theme, config)

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-[300px] rounded-lg ',
        'bg-card flex flex-col',
        'border',
        className,
      )}
      style={{
        maxHeight: containerHeight ? `${containerHeight}px` : 'auto',
        borderColor: portColor.borderColor,
        // borderWidth: 1,
        // borderRadius: 8,
      }}

    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between shrink-0 rounded-tl-lg rounded-tr-lg"
        style={{
          backgroundColor: `${portColor.headerBgColor}`,
          borderBottom: `1px solid ${portColor.borderColor}`,
        }}
      >
        <div className="flex items-center gap-2">
          {/* Port Circle */}
          <div
            className="w-3 h-3 rounded-full border-1 shrink-0"
            style={{
              backgroundColor: portColor.circleColor,
              borderColor: portColor.borderColor,
            }}
          />
          <h3
            className="font-medium text-sm"
            style={{
              color: portColor.textColor,
            }}
          >
            {config.title || config.name || 'Port'}
          </h3>
        </div>
        <div className="flex items-center space-x-1.5">
          {config.required && (
            <div className="pl-1.5 pr-1.5 rounded-full bg-red-500" title="Required">
              Required
            </div>
          )}
          {!config.required && (
            <div className="pl-1.5 pr-1.5 rounded-full bg-green-500" title="Optional">
              Optional
            </div>
          )}
          {/* Port Type */}
          <span
            className="text-xs px-1.5 py-0.5 bg-muted rounded"
            style={{
              color: portColor.textColor,
            }}
          >
            {formatPortType(config.type)}
          </span>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-grow overflow-auto">
        <div className="p-3 space-y-3">
          {/* Basic information and direction */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {config.direction === 'input' ? 'Input Port' : 'Output Port'}
            </span>
            <span className="text-muted-foreground">
              {config.key}
            </span>
          </div>

          {/* Description */}
          {config.description && (
            <div
              className="space-y-1 text-xs text-muted-foreground whitespace-pre-wrap border-l-2 pl-2"
              style={{ borderColor: portColor.circleColor }}
            >
              {formatDescriptionWithBreaks(config.description)}
            </div>
          )}

          {/* Default value */}
          {hasDefaultValue(config) && (
            <div className="pt-1 space-y-1 text-muted-foreground">
              <div className="text-xs font-medium">Default value</div>
              <pre className={cn(
                'text-[11px] p-1.5 bg-muted/50',
                'rounded block overflow-x-auto whitespace-pre-wrap break-all',
              )}
              >
                {formatDefaultValue(config)}
              </pre>
            </div>
          )}

          {/* Type-specific configuration */}
          <div className="text-foreground">
            {getTypeSpecificInfo(config)}
          </div>

          {/* Value */}
          {port.getValue() !== undefined && (
            <div className="pt-1 space-y-1 text-muted-foreground">
              <div className="text-xs font-medium text-muted-foreground">Value</div>
              <pre className={cn(
                'text-[11px] p-1.5 bg-muted/50',
                'rounded block overflow-x-auto whitespace-pre-wrap break-all',
              )}
              >
                {port.getConfig().type === 'string' && port.getConfig()?.ui?.isPassword === true
                  ? '**** hidden ****'
                  : formatValue(port.getValue())}
              </pre>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function formatPortType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function hasDefaultValue(config: IPortConfig): boolean {
  return config.defaultValue !== undefined && config.defaultValue !== null
}

function formatDefaultValue(config: IPortConfig): string {
  if (
    config.defaultValue === undefined
    || config.defaultValue === null
    || (typeof config.defaultValue === 'string' && config.defaultValue.trim() === '')) {
    return 'N/A'
  }

  try {
    if (typeof config.defaultValue === 'object') {
      return JSON.stringify(config.defaultValue, null, 2)
    }
    if (Array.isArray(config.defaultValue)) {
      return JSON.stringify(config.defaultValue, null, 2)
    }
    return String(config.defaultValue)
  } catch (error) {
    return 'Complex value'
  }
}

// Reusable PropertyItem component for object schemas
interface PropertyItemProps {
  name: string
  config: IPortConfig
  level?: number
  isLast?: boolean
}

function PropertyItem({ name, config, level = 0, isLast = false }: PropertyItemProps) {
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(level === 0)
  const portColor = getPortTypeColor(theme, config)
  const isExpandable = config.type === 'object' || config.type === 'array'
  const indent = level * 12

  return (
    <div
      className={cn(
        'border-l',
        !isLast && 'relative',
        level > 0 && 'mt-1',
        isLast ? '' : 'after:content-[\'\'] after:absolute after:left-0 after:top-[14px] after:h-full after:w-[1px] after:bg-border',
      )}
      style={{ borderColor: portColor.borderColor, marginLeft: `${indent}px` }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="relative">
        <CollapsibleTrigger
          className={cn(
            'flex items-center gap-1 text-xs py-0.5 px-2 hover:bg-muted/40 w-full text-left rounded-sm',
            isExpandable ? 'cursor-pointer' : 'cursor-default',
          )}
        >
          {isExpandable
            ? (
                isOpen
                  ? <ChevronDown className="h-3 w-3 opacity-70 shrink-0" />
                  : <ChevronRight className="h-3 w-3 opacity-70 shrink-0" />
              )
            : (
                <div className="w-3" />
              )}
          <span className="font-medium">{name}</span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4 inline-flex items-center ml-1"
            style={{ borderColor: `${portColor.borderColor}` }}
          >
            {config.type}
          </Badge>
          {config.required && (
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 ml-1" title="Required"></div>
          )}
          {!config.required && (
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1" title="Optional"></div>
          )}
        </CollapsibleTrigger>

        {isExpandable && (
          <CollapsibleContent className="mt-1">
            {config.type === 'object' && renderObjectSchemaContent((config as ObjectPortConfig), level + 1)}
            {config.type === 'array' && renderArrayItemContent((config as ArrayPortConfig), level + 1)}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  )
}

// Render object schema properties recursively
function renderObjectSchemaContent(config: ObjectPortConfig, level: number) {
  const schemaProperties = config.schema?.properties || {}
  const propertyKeys = Object.keys(schemaProperties)

  if (propertyKeys.length === 0) {
    return (
      <div className="text-[10px] text-muted-foreground pl-8 py-1 italic">
        No properties defined
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {propertyKeys.map((key, index) => (
        <PropertyItem
          key={key}
          name={key}
          config={schemaProperties[key] as IPortConfig}
          level={level}
          isLast={index === propertyKeys.length - 1}
        />
      ))}
    </div>
  )
}

// Render array item configuration recursively
function renderArrayItemContent(config: ArrayPortConfig, level: number) {
  const itemConfig = config.itemConfig as IPortConfig

  if (!itemConfig) {
    return (
      <div className="text-[10px] text-muted-foreground pl-8 py-1 italic">
        No item configuration defined
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      <PropertyItem
        name="Array Item"
        config={itemConfig}
        level={level}
        isLast={true}
      />

      {/* Render array constraints if any */}
      {(config.minLength !== undefined || config.maxLength !== undefined) && (
        <div className="text-[10px] pl-8 py-1">
          <div className="flex text-muted-foreground">
            <span className="font-medium mr-1">Constraints:</span>
            {config.minLength !== undefined && (
              <span className="mr-2">
                min:
                {config.minLength}
              </span>
            )}
            {config.maxLength !== undefined && (
              <span>
                max:
                {config.maxLength}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function getTypeSpecificInfo(config: IPortConfig): React.ReactElement | null {
  switch (config.type) {
    case 'string':
      return renderStringConfig(config as StringPortConfig)
    case 'number':
      return renderNumberConfig(config as NumberPortConfig)
    case 'boolean':
      return renderBooleanConfig(config as BooleanPortConfig)
    case 'array':
      return renderArrayConfig(config as ArrayPortConfig)
    case 'object':
      return renderObjectConfig(config as ObjectPortConfig)
    case 'enum':
      return renderEnumConfig(config as EnumPortConfig)
    case 'stream':
      return renderStreamConfig(config as StreamPortConfig)
    case 'any':
      return renderAnyConfig(config as AnyPortConfig)
    default:
      return null
  }
}

function renderStringConfig(config: StringPortConfig): React.ReactElement {
  const needsToRender = config.minLength !== undefined || config.maxLength !== undefined || config.pattern

  if (!needsToRender) {
    return <></>
  }

  return (
    <div className="mt-3 space-y-2 border-t pt-2 border-muted/40">
      <div className="text-xs font-medium">String configuration</div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        {config.minLength !== undefined && (
          <>
            <span className="text-muted-foreground">Min length:</span>
            <span>{config.minLength}</span>
          </>
        )}
        {config.maxLength !== undefined && (
          <>
            <span className="text-muted-foreground">Max length:</span>
            <span>{config.maxLength}</span>
          </>
        )}
        {config.pattern && (
          <>
            <span className="text-muted-foreground">Pattern:</span>
            <code className="bg-muted/30 px-1 rounded text-[10px]">{config.pattern}</code>
          </>
        )}
      </div>
    </div>
  )
}

function renderNumberConfig(config: NumberPortConfig): React.ReactElement {
  const needsToRender = config.min !== undefined || config.max !== undefined || config.step !== undefined || config.integer !== undefined
  if (!needsToRender) {
    return <></>
  }

  return (
    <div className="mt-3 space-y-2 border-t pt-2 border-muted/40">
      <div className="text-xs font-medium">Number configuration</div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        {config.min !== undefined && (
          <>
            <span className="text-muted-foreground">Minimum:</span>
            <span>{config.min}</span>
          </>
        )}
        {config.max !== undefined && (
          <>
            <span className="text-muted-foreground">Maximum:</span>
            <span>{config.max}</span>
          </>
        )}
        {config.step !== undefined && (
          <>
            <span className="text-muted-foreground">Step:</span>
            <span>{config.step}</span>
          </>
        )}
        {config.integer !== undefined && (
          <>
            <span className="text-muted-foreground">Integer only:</span>
            <span>{config.integer ? 'Yes' : 'No'}</span>
          </>
        )}
      </div>
    </div>
  )
}

function renderBooleanConfig(config: BooleanPortConfig): React.ReactElement | null {
  // Boolean ports don't have much special configuration
  return null
}

function renderArrayConfig(config: ArrayPortConfig): React.ReactElement {
  return (
    <div className="mt-3 space-y-2 border-t pt-2 border-muted/40">
      <div className="text-xs font-medium">Array configuration</div>

      {/* Basic array info */}
      <div className="grid grid-cols-2 gap-1 text-xs mb-2">
        {config.minLength !== undefined && (
          <>
            <span className="text-muted-foreground">Min length:</span>
            <span>{config.minLength}</span>
          </>
        )}
        {config.maxLength !== undefined && (
          <>
            <span className="text-muted-foreground">Max length:</span>
            <span>{config.maxLength}</span>
          </>
        )}
        {config.isMutable !== undefined && (
          <>
            <span className="text-muted-foreground">Mutable:</span>
            <span>{config.isMutable ? 'Yes' : 'No'}</span>
          </>
        )}
      </div>

      {/* Item schema visualization */}
      <div className="text-xs font-medium mb-1">Item Schema</div>
      <div className="border rounded-md py-1 px-0.5 bg-muted/10">
        {config.itemConfig
          ? (
              <PropertyItem
                name="Item"
                config={config.itemConfig as IPortConfig}
                isLast={true}
              />
            )
          : (
              <div className="text-[10px] text-muted-foreground px-3 py-1 italic">
                No item configuration defined
              </div>
            )}
      </div>
    </div>
  )
}

function renderObjectConfig(config: ObjectPortConfig): React.ReactElement {
  const schemaProperties = config.schema?.properties || {}
  const propertyCount = Object.keys(schemaProperties).length

  return (
    <div className="mt-3 space-y-2 border-t pt-2 border-muted/40">
      <div className="text-xs font-medium text-muted-foreground">Object configuration</div>

      {/* Basic object info */}
      <div className="grid grid-cols-2 gap-1 text-xs mb-2">
        {config.schema?.id && (
          <>
            <span className="text-muted-foreground">Schema ID:</span>
            <span>{config.schema.id}</span>
          </>
        )}
        <span className="text-muted-foreground">Properties:</span>
        <span>{propertyCount}</span>

        {config.isSchemaMutable !== undefined && (
          <>
            <span className="text-muted-foreground">Schema mutable:</span>
            <span>{config.isSchemaMutable ? 'Yes' : 'No'}</span>
          </>
        )}
      </div>

      {/* Schema visualization */}
      <div className="text-xs font-medium mb-1">Schema Properties</div>
      <div className="border rounded-md py-1 px-0.5 bg-muted/10">
        {propertyCount > 0
          ? (
              renderObjectSchemaContent(config, 0)
            )
          : (
              <div className="text-[10px] text-muted-foreground px-3 py-1 italic">
                No properties defined
              </div>
            )}
      </div>
    </div>
  )
}

function renderEnumConfig(config: EnumPortConfig): React.ReactElement {
  const options = config.options || []

  return (
    <div className="mt-3 space-y-2 border-t pt-2 border-muted/40">
      <div className="text-xs font-medium">Enum configuration</div>
      <div className="text-xs">
        <span className="text-muted-foreground text-[10px]">Options:</span>
        <ul className="mt-1 space-y-1 text-[10px]">
          {options.map((option, index) => (
            <li key={index} className="pl-2 border-l border-muted/50">
              {formatValue(option.defaultValue) || `Option ${index + 1}`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function renderStreamConfig(config: StreamPortConfig): React.ReactElement {
  return (
    <div className="mt-3 space-y-2 border-t pt-2 border-muted/40">
      <div className="text-xs font-medium">Stream configuration</div>

      {/* Item schema visualization */}
      <div className="text-xs font-medium mb-1">Stream Item Schema</div>
      <div className="border rounded-md py-1 px-0.5 bg-muted/10">
        {config.itemConfig
          ? (
              <PropertyItem
                name="Stream Item"
                config={config.itemConfig as IPortConfig}
                isLast={true}
              />
            )
          : (
              <div className="text-[10px] text-muted-foreground px-3 py-1 italic">
                No item configuration defined
              </div>
            )}
      </div>
    </div>
  )
}

function renderAnyConfig(config: AnyPortConfig): React.ReactElement {
  return (
    <div className="mt-3 space-y-2 border-t pt-2 border-muted/40">
      <div className="text-xs font-medium">Any type configuration</div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        {config.underlyingType && (
          <>
            <span className="text-muted-foreground">Underlying type:</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-1 h-5 inline-flex items-center">
              {config.underlyingType.type}
            </Badge>
          </>
        )}
      </div>

      {/* Underlying type visualization if available */}
      {config.underlyingType && (
        <>
          <div className="text-xs font-medium mb-1">Underlying Schema</div>
          <div className="border rounded-md py-1 px-0.5 bg-muted/10">
            <PropertyItem
              name="Value"
              config={config.underlyingType as IPortConfig}
              isLast={true}
            />
          </div>
        </>
      )}
    </div>
  )
}
