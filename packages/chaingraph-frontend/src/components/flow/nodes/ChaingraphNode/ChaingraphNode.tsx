import type { ChaingraphNode } from '@/components/flow/nodes/ChaingraphNode/types.ts'
import type { CategoryIconName } from '@chaingraph/nodes/categories/icons'
import type { NodeProps } from '@xyflow/react'
import { useTheme } from '@/components/theme/hooks/useTheme.ts'
import { Card } from '@/components/ui/card.tsx'
import { cn } from '@/lib/utils.ts'
import { getCategoryIcon } from '@chaingraph/nodes/categories/icons'
import { CornerBottomRightIcon } from '@radix-ui/react-icons'
import { Handle, NodeResizeControl, Position, ResizeControlVariant } from '@xyflow/react'
import { memo, useEffect, useMemo, useState } from 'react'

function ChaingraphNodeComponent({
  data: { node, categoryMetadata },
  selected,
}: NodeProps<ChaingraphNode>) {
  const { theme } = useTheme()

  // Sync style with theme changes
  const [style, setStyle] = useState(
    theme === 'dark'
      ? categoryMetadata.style.dark
      : categoryMetadata.style.light,
  )

  // Sync ports with node changes
  const [inputs, setInputs] = useState(node.getInputs())
  const [outputs, setOutputs] = useState(node.getOutputs())

  useEffect(() => {
    setStyle(
      theme === 'dark'
        ? categoryMetadata.style.dark
        : categoryMetadata.style.light,
    )
  }, [theme, categoryMetadata])

  useEffect(() => {
    setInputs(node.getInputs())
    setOutputs(node.getOutputs())
  }, [node])

  const Icon = useMemo(
    () => getCategoryIcon(categoryMetadata.icon as CategoryIconName),
    [categoryMetadata.icon],
  )

  return (
    <Card
      className={cn(
        'min-w-[200px] shadow-none border-2 transition-all duration-200',
        'bg-card',
        selected && 'shadow-node-selected dark:shadow-node-selected-dark',
      )}

      style={{
        borderColor: style.secondary,
        borderWidth: 1,
      }}
    >
      {/* Header */}
      <div
        className={cn(
          'px-3 py-2 flex items-center justify-between',
          'border-b rounded-t-lg',
        )}
        style={{
          background: style.primary,
          borderBottom: `1px solid ${style.secondary}`,
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Icon Container */}
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{
              background: `${style.text}20`, // Text color with 20% opacity
            }}
          >
            <Icon
              className="w-4 h-4"
              style={{ color: style.text }}
            />
          </div>

          {/* Title */}
          <h3
            className="font-medium text-sm truncate"
            style={{ color: style.text }}
          >
            {node.metadata.title}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2 space-y-4">
        {/* Ports */}
        <div className="space-y-3">
          {/* Input Ports */}
          {inputs.map(port => (
            <div
              key={port.config.id}
              className="relative flex items-center gap-2 group/port"
            >
              <Handle
                id={port.config.id}
                type="target"
                position={Position.Left}
                className={cn(
                  'w-3 h-3 rounded-full -ml-4',
                  'border-2 border-background', // Match background color
                  'transition-shadow duration-200',
                  'data-[connected=true]:shadow-port-connected',
                  'bg-flow-data', // Default to data color, we can add logic for different port types
                )}
              />

              {/* Port Label */}
              <span className="text-xs truncate text-foreground">
                {port.config.title || port.config.key}
              </span>
            </div>
          ))}

          {/* Output Ports */}
          {outputs.map(port => (
            <div
              key={port.config.id}
              className="relative flex items-center justify-end gap-2 group/port"
            >
              {/* Port Label */}
              <span className="text-xs truncate text-foreground">
                {port.config.title || port.config.key}
              </span>

              <Handle
                id={port.config.id}
                type="source"
                position={Position.Right}
                className={cn(
                  'w-3 h-3 rounded-full -mr-4',
                  'border-2 border-background dark:border-[#1E1E1E]', // Match background color
                  'transition-shadow duration-200',
                  'data-[connected=true]:shadow-port-connected',
                  'bg-flow-data', // Default to data color, we can add logic for different port types
                )}
              />
            </div>
          ))}
        </div>

      </div>

      {/* Resize Control */}
      <NodeResizeControl
        // minWidth={280}
        // minHeight={100}
        variant={ResizeControlVariant.Handle}
        position="bottom-right"
        style={{ background: 'transparent', border: 'none' }}
      >
        <div className="absolute bottom-1 right-1">
          <CornerBottomRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
      </NodeResizeControl>
    </Card>
  )
}

export default memo(ChaingraphNodeComponent)
