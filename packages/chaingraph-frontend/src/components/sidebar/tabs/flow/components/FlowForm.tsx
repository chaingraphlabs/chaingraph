import type { FlowMetadata } from '@chaingraph/types'
import { Cross1Icon, FrameIcon, PlusIcon, TextIcon } from '@radix-ui/react-icons'
import { Button, TextField } from '@radix-ui/themes'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { FlowTag } from './FlowTag'

interface FlowFormProps {
  flow?: FlowMetadata // If provided, we're in edit mode
  onCancel: () => void
  onCreate?: (data: { name: string, description: string, tags: string[] }) => void
  onEdit?: (data: { flowId: string, name: string, description: string, tags: string[] }) => void
  isLoading?: boolean
}

export function FlowForm({
  flow,
  onCancel,
  onCreate,
  onEdit,
  isLoading = false,
}: FlowFormProps) {
  const isEditMode = Boolean(flow)

  const [name, setName] = useState(flow?.name || '')
  const [description, setDescription] = useState(flow?.description || '')
  const [tags, setTags] = useState<string[]>(flow?.tags || [])
  const [newTag, setNewTag] = useState('')

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      name,
      description,
      tags,
    }

    if (isEditMode && onEdit && flow?.id) {
      onEdit({ ...data, flowId: flow.id })
    } else if (!isEditMode && onCreate) {
      onCreate(data)
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="p-3 rounded-lg bg-ui-surface-light dark:bg-ui-surface-dark
                 border-2 border-primary-500 dark:border-primary-400"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {isEditMode ? 'Edit Flow' : 'Create New Flow'}
        </h3>
        <Button
          variant="ghost"
          onClick={onCancel}
          size="1"
          disabled={isLoading}
        >
          <Cross1Icon />
        </Button>
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        {/* Name Field */}
        <div>
          <div className="flex items-center mb-1">
            <TextIcon className="w-3.5 h-3.5 mr-1.5 text-primary-500" />
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Flow Name
            </label>
          </div>
          <TextField.Root
            size="1"
            value={name}
            onChange={e => setName((e.target as HTMLInputElement).value)}
            placeholder="Enter flow name..."
            disabled={isLoading}
            required
          />
        </div>

        {/* Description Field */}
        <div>
          <div className="flex items-center mb-1">
            <TextIcon className="w-3.5 h-3.5 mr-1.5 text-primary-500" />
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
          </div>
          <TextField.Root
            size="1"
            value={description}
            onChange={e => setDescription((e.target as HTMLInputElement).value)}
            placeholder="Enter flow description..."
            disabled={isLoading}
          />
        </div>

        {/* Tags Field */}
        <div>
          <div className="flex items-center mb-1">
            <FrameIcon className="w-3.5 h-3.5 mr-1.5 text-primary-500" />
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Tags
            </label>
          </div>

          {/* Tags List */}
          <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
            <AnimatePresence mode="popLayout">
              {tags.map(tag => (
                <FlowTag
                  key={tag}
                  tag={tag}
                  onRemove={handleRemoveTag}
                  interactive
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Add Tag Input */}
          <div className="flex gap-2">
            <TextField.Root
              size="1"
              value={newTag}
              onChange={e => setNewTag((e.target as HTMLInputElement).value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Add tag..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              size="1"
              variant="soft"
              onClick={handleAddTag}
              type="button"
              disabled={isLoading}
            >
              {!isEditMode && <PlusIcon className="mr-1" />}
              Add
            </Button>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="1"
            variant="soft"
            onClick={onCancel}
            className="flex-1"
            type="button"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            size="1"
            variant="solid"
            className="flex-1"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : isEditMode ? 'Save Changes' : 'Create Flow'}
          </Button>
        </div>
      </div>
    </motion.form>
  )
}
