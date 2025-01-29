import type { ChaingraphNode } from '@/components/flow/nodes/ChaingraphNode/types.ts'
import type { NodeProps } from '@xyflow/react'
import { NodeBody } from '@/components/flow/nodes/ChaingraphNode/NodeBody.tsx'
import { NodeHeader } from '@/components/flow/nodes/ChaingraphNode/NodeHeader.tsx'
import { useTheme } from '@/components/theme/hooks/useTheme.ts'
import { Card } from '@/components/ui/card.tsx'
import { cn } from '@/lib/utils.ts'
import { $activeFlowMetadata, removeNodeFromFlow } from '@/store'
import { useNodeExecution } from '@/store/execution/hooks/useNodeExecution.ts'
import { NodeResizeControl, ResizeControlVariant } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { memo, useEffect, useMemo, useState } from 'react'

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
        'shadow-none border-2 transition-all duration-200',
        'bg-card',
        selected && 'shadow-node-selected dark:shadow-node-selected-dark',
        executionStateStyle,
      )}
      style={{
        borderColor: style.secondary,
        borderWidth: 1,
      }}
    >
      <NodeHeader
        title={data.node.metadata.title || data.node.metadata.category || 'Node'}
        icon={data.categoryMetadata.icon}
        style={style}
        onDelete={() => removeNodeFromFlow({
          flowId: activeFlow.id!,
          nodeId: id,
        })}
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
