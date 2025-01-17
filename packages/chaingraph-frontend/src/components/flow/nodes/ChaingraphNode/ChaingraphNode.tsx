import type { ChaingraphNode } from '@/components/flow/nodes/ChaingraphNode/types.ts'
import type { NodeProps } from '@xyflow/react'
import { NodeBody } from '@/components/flow/nodes/ChaingraphNode/NodeBody.tsx'
import { NodeHeader } from '@/components/flow/nodes/ChaingraphNode/NodeHeader.tsx'
import { useTheme } from '@/components/theme/hooks/useTheme.ts'
import { Card } from '@/components/ui/card.tsx'
import { cn } from '@/lib/utils.ts'
import { NodeResizeControl, ResizeControlVariant, useReactFlow } from '@xyflow/react'
import { memo, useEffect, useState } from 'react'

function ChaingraphNodeComponent({
  data: { node, categoryMetadata },
  selected,
  id,
}: NodeProps<ChaingraphNode>) {
  const { theme } = useTheme()
  const { setNodes } = useReactFlow()

  const [style, setStyle] = useState(
    theme === 'dark' ? categoryMetadata.style.dark : categoryMetadata.style.light,
  )
  const [inputs, setInputs] = useState(node.getInputs())
  const [outputs, setOutputs] = useState(node.getOutputs())

  useEffect(() => {
    setStyle(
      theme === 'dark' ? categoryMetadata.style.dark : categoryMetadata.style.light,
    )
  }, [theme, categoryMetadata])

  useEffect(() => {
    setInputs(node.getInputs())
    setOutputs(node.getOutputs())
  }, [node])

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
        title={node.metadata.title || node.metadata.category || 'Node'}
        icon={categoryMetadata.icon}
        style={style}
        onDelete={() => setNodes(nodes => nodes.filter(n => n.id !== id))}
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
    </Card>
  )
}

export default memo(ChaingraphNodeComponent)
