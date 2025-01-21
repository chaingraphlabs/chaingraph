import type { ChaingraphNode } from '@/components/flow/nodes/ChaingraphNode/types.ts'
import type { NodeProps } from '@xyflow/react'
import { NodeBody } from '@/components/flow/nodes/ChaingraphNode/NodeBody.tsx'
import { NodeHeader } from '@/components/flow/nodes/ChaingraphNode/NodeHeader.tsx'
import { useTheme } from '@/components/theme/hooks/useTheme.ts'
import { Card } from '@/components/ui/card.tsx'
import { cn } from '@/lib/utils.ts'
import { $activeFlowMetadata, removeNodeFromFlow } from '@/store'
import { NodeResizeControl, ResizeControlVariant } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { memo, useEffect, useState } from 'react'

function ChaingraphNodeComponent({
  data,
  selected,
  id,
}: NodeProps<ChaingraphNode>) {
  const activeFlow = useUnit($activeFlowMetadata)
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

  if (!activeFlow || !activeFlow.id)
    return null

  return (
    <Card
      className={cn(
        'shadow-none border-2 transition-all duration-200',
        'bg-card',
        selected && 'shadow-node-selected dark:shadow-node-selected-dark',
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

      {data.node.metadata.version}

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
    </Card>
  )
}

export default memo(ChaingraphNodeComponent)
