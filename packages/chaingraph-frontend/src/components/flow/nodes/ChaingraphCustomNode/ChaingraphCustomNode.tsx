import type { ChaingraphNode } from './types'
import {
  ChevronDownIcon,
  CornerBottomRightIcon,
  Cross1Icon,
  Pencil1Icon,
} from '@radix-ui/react-icons'
import {
  Handle,
  type NodeProps,
  NodeResizeControl,
  Position,
  ResizeControlVariant,
} from '@xyflow/react'
import { memo } from 'react'

// const controlStyle = {
//   background: 'transparent',
//   border: 'none',
// }

function ChaingraphCustomNode({ data }: NodeProps<ChaingraphNode>) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2
                    bg-pink-50 dark:bg-pink-950
                    border-b border-pink-200 dark:border-pink-800
                    rounded-t-xl"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {' '}
          {/* добавлен min-w-0 и flex-1 */}
          {/* Icon */}
          <div className="flex-shrink-0 flex items-center justify-center w-5 h-5
                       bg-pink-500/20 rounded-md"
          >
            <Pencil1Icon className="w-3.5 h-3.5 text-pink-500" />
          </div>

          {/* Title с truncate */}
          <span className="text-sm font-mono text-pink-900 dark:text-pink-100 truncate">
            {data.title}
          </span>
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 flex items-center gap-0.5 ml-2">
          {' '}
          {/* добавлен flex-shrink-0 и ml-2 */}
          <button
            className="p-1 rounded hover:bg-pink-100 dark:hover:bg-pink-900
                     text-pink-500 transition-colors"
            type="button"
          >
            <ChevronDownIcon className="w-3 h-3" />
          </button>
          <button
            className="p-1 rounded hover:bg-pink-100 dark:hover:bg-pink-900
                     text-pink-500 transition-colors"
            type="button"
          >
            <Cross1Icon className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative px-1 py-1">
        {/* Input Handles */}
        {data.inputs?.map(input => (
          <div key={input.id} className="relative flex items-center gap-0 my-0 min-w-0 h-6">
            {' '}
            <Handle
              type="target"
              position={Position.Left}
              id={input.id}
              className={`flex-shrink-0 !absolute left-[-6px]
                ${input.type === 'execute' && 'text-green-500'}
                ${input.type === 'data' && 'text-blue-500'}
                ${input.type === 'stream' && 'text-pink-500'}
              `}
            />
            <span className={`text-sm font-mono truncate ml-1
              ${input.type === 'execute' && 'text-green-500'}
              ${input.type === 'data' && 'text-blue-500'}
              ${input.type === 'stream' && 'text-pink-500'}
            `}
            >
              {input.label}
            </span>
          </div>
        ))}

        {/* Output Handles */}
        {data.outputs?.map(output => (
          <div key={output.id} className="relative flex items-center justify-end gap-0 my-0 min-w-0 h-6">
            {' '}
            <span className={`text-sm font-mono truncate mr-1
              ${output.type === 'execute' && 'text-green-500'}
              ${output.type === 'data' && 'text-blue-500'}
              ${output.type === 'stream' && 'text-pink-500'}
            `}
            >
              {output.label}
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={output.id}
              className={`flex-shrink-0 !absolute right-[-6px]
                ${output.type === 'execute' && 'text-green-500'}
                ${output.type === 'data' && 'text-blue-500'}
                ${output.type === 'stream' && 'text-pink-500'}
              `}
            />
          </div>
        ))}

        <div className="min-h-[20px]" />
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
    </div>
  )
}

export default memo(ChaingraphCustomNode)
