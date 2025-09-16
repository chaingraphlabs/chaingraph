/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { PlusIcon, Share1Icon } from '@radix-ui/react-icons'
import { Button } from '@radix-ui/themes'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface EmptyFlowStateProps {
  onCreateClick: () => void
}

export function EmptyFlowState({ onCreateClick }: EmptyFlowStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center h-full text-center px-4"
    >
      <Share1Icon className="w-12 h-12 mb-6 text-gray-400 dark:text-gray-600" />

      <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
        No Flows Yet
      </h2>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Create your first flow to start building your graph.
      </p>

      <Button
        size="3"
        onClick={onCreateClick}
        className={
          cn(
            'min-w-[160px] bg-primary-500 hover:bg-primary-600',
            'dark:bg-primary-600 dark:hover:bg-primary-700',
          )
        }
      >
        <PlusIcon className="mr-1" />
        Create Flow
      </Button>
    </motion.div>
  )
}
