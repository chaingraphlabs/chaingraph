import type { FlowMetadata } from '@chaingraph/types'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { Cross2Icon, Pencil1Icon } from '@radix-ui/react-icons'
import { Badge } from '@radix-ui/themes'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface FlowListItemProps {
  flow: FlowMetadata
  onDelete: () => void
  onEdit: (flow: FlowMetadata) => void
  selected?: boolean
  onSelect?: (flow: FlowMetadata) => void
  disabled: boolean
}

export function FlowListItem({
  flow,
  onDelete,
  onEdit,
  selected = false,
  onSelect,
}: FlowListItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  if (!flow)
    return null

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onSelect && onSelect(flow)}
        className={`
          group relative p-2.5 rounded-md cursor-pointer
          bg-ui-surface-light dark:bg-ui-surface-dark
          border ${selected
      ? 'border-primary-500 dark:border-primary-400'
      : 'border-ui-border-light dark:border-ui-border-dark'
    }
          hover:border-primary-500 dark:hover:border-primary-400
          transition-all duration-200
        `}
      >
        {/* Selection indicator */}
        {selected && (
          <div className="absolute left-0 top-0 bottom-0 w-1
                         bg-primary-500 dark:bg-primary-400
                         rounded-l-md"
          />
        )}

        {/* Header Section */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {flow.name}
            </h3>
            {flow.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                {flow.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(flow)
              }}
              className="p-1 rounded-md opacity-0 group-hover:opacity-100
                       hover:bg-gray-100 dark:hover:bg-gray-800
                       transition-all duration-200"
            >
              <Pencil1Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsDeleteDialogOpen(true)
              }}
              className="p-1 rounded-md opacity-0 group-hover:opacity-100
                       hover:bg-gray-100 dark:hover:bg-gray-800
                       transition-all duration-200"
            >
              <Cross2Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tags & Metadata Section */}
        <div className="mt-2 flex items-center gap-2 overflow-hidden">
          {/* Tags with horizontal scroll */}
          {flow.tags && flow.tags.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {flow.tags.map(tag => (
                <Badge
                  key={tag}
                  size="1"
                  variant="soft"
                  color="gray"
                  className="flex-shrink-0 whitespace-nowrap px-2 py-0"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Last Updated - Right aligned */}
          <span className="ml-auto flex-shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
            {new Date(flow.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                                        w-[90vw] max-w-[400px] p-6 rounded-lg
                                        bg-ui-surface-light dark:bg-ui-surface-dark
                                        border border-ui-border-light dark:border-ui-border-dark
                                        shadow-xl"
          >
            <AlertDialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Flow
            </AlertDialog.Title>

            <AlertDialog.Description className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete "
              {flow.name}
              "? This action cannot be undone.
            </AlertDialog.Description>

            <div className="flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 text-sm font-medium rounded-md
                                 bg-gray-100 dark:bg-gray-800
                                 text-gray-700 dark:text-gray-300
                                 hover:bg-gray-200 dark:hover:bg-gray-700
                                 transition-colors duration-200"
                >
                  Cancel
                </button>
              </AlertDialog.Cancel>

              <AlertDialog.Action asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-md
                           bg-red-500 dark:bg-red-600
                           text-white
                           hover:bg-red-600 dark:hover:bg-red-700
                           transition-colors duration-200"
                >
                  Delete
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  )
}
