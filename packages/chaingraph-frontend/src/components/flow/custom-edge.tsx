import {
  BaseEdge,
  type Edge,
  type EdgeProps,
  getStraightPath,
} from '@xyflow/react'

type CustomEdgeType = Edge<{ value: number }, 'custom'>

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: EdgeProps<CustomEdgeType>) {
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY })

  return <BaseEdge id={id} path={edgePath} />
}
