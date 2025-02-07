import type { ChaingraphNode } from '@/components/flow/nodes/ChaingraphNode/types.ts'
import type { NodeProps } from '@xyflow/react'
import { NodeBody } from '@/components/flow/nodes/ChaingraphNode/NodeBody.tsx'
import { NodeHeader } from '@/components/flow/nodes/ChaingraphNode/NodeHeader.tsx'
import { BreakpointButton } from '@/components/flow/nodes/debug/BreakpointButton.tsx'
import { useTheme } from '@/components/theme/hooks/useTheme.ts'
import { Card } from '@/components/ui/card.tsx'
import { cn } from '@/lib/utils.ts'
import { $activeFlowMetadata, removeNodeFromFlow } from '@/store'
import { useBreakpoint } from '@/store/execution/hooks/useBreakpoint.ts'
import { useNodeExecution } from '@/store/execution/hooks/useNodeExecution.ts'
import {
  $executionState,
  addBreakpoint,
  removeBreakpoint,
} from '@badaitech/chaingraph-frontend/store/execution'
import { NodeResizeControl, ResizeControlVariant } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'

function ChaingraphNodeComponent({
  data,
  selected,
  id,
}: NodeProps<ChaingraphNode>) {
  const activeFlow = useUnit($activeFlowMetadata)

  const nodeExecution = useNodeExecution(id)
  const { theme } = useTheme()

  const [style, setStyle] = useState(
    theme === 'dark' ? data.categoryMetadata.style.dark : data.categoryMetadata.style.light,
  )
  const [inputs, setInputs] = useState(data.node.getInputs())
  const [outputs, setOutputs] = useState(data.node.getOutputs())

  const { debugMode } = useUnit($executionState)
  const isBreakpointSet = useBreakpoint(id)
  const dispatch = useUnit({ addBreakpoint, removeBreakpoint })

  const handleBreakpointToggle = useCallback(() => {
    if (isBreakpointSet) {
      dispatch.removeBreakpoint({ nodeId: id })
    } else {
      dispatch.addBreakpoint({ nodeId: id })
    }
  }, [isBreakpointSet, dispatch, id])

  useEffect(() => {
    setStyle(
      theme === 'dark' ? data.categoryMetadata.style.dark : data.categoryMetadata.style.light,
    )
  }, [theme, data.categoryMetadata])

  useEffect(() => {
    setInputs(data.node.getInputs())
    setOutputs(data.node.getOutputs())
  }, [data.node])

  const executionStateStyle = useMemo(() => {
    if (nodeExecution.isExecuting) {
      return 'animate-pulse border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
    }
    if (nodeExecution.isCompleted) {
      return 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
    }
    if (nodeExecution.isFailed) {
      return 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
    }
    if (nodeExecution.isSkipped) {
      return 'border-gray-500 opacity-50'
    }
    return ''
  }, [nodeExecution])

  if (!activeFlow || !activeFlow.id)
    return null

  return (
    <Card
      className={cn(
        'shadow-none transition-all duration-200',
        'bg-card opacity-95',
        // selected && 'shadow-node-selected dark:shadow-node-selected-dark',
        selected
          ? 'border-10 border-primary/50 border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.6)]'
          : 'border-border/40 hover:border-border/60 shadow-[0_0_12px_rgba(0,0,0,0.3)]',
        executionStateStyle,
      )}
      style={{
        borderColor: style.secondary,
        borderWidth: 1,
      }}
    >

      {/* Breakpoint Strip */}
      {debugMode && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5
                      hover:w-2 transition-all duration-200"
        >
          <BreakpointButton
            nodeId={data.node.id}
            enabled={isBreakpointSet}
            onToggle={handleBreakpointToggle}
          />
        </div>
      )}

      <NodeHeader
        node={data.node}
        icon={data.categoryMetadata.icon}
        style={style}
        onDelete={() => removeNodeFromFlow({
          flowId: activeFlow.id!,
          nodeId: id,
        })}
        debugMode={debugMode}
        isBreakpointSet={isBreakpointSet}
        onBreakpointToggle={handleBreakpointToggle}
      />

      <NodeBody
        inputs={inputs}
        outputs={outputs}
      />

      <NodeResizeControl
        variant={ResizeControlVariant.Handle}
        position="right"
        style={{
          background: 'transparent',
          border: 'none',
          height: '100%',
        }}
      />

      {nodeExecution.executionTime !== undefined && (
        <div className="absolute -top-2 -right-2 px-1 py-0.5 text-xs bg-background rounded border shadow-sm">
          {nodeExecution.executionTime}
          ms
        </div>
      )}
    </Card>
  )
}

export default memo(ChaingraphNodeComponent)
