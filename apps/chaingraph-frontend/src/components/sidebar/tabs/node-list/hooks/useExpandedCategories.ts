/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useState } from 'react'

const STORAGE_KEY = 'chaingraph:collapsed-categories'

export function useExpandedCategories(availableCategories: string[]) {
  // Store collapsed categories instead of expanded
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.warn('Failed to parse collapsed categories from localStorage:', error)
      return []
    }
  })

  // Convert collapsed categories to expanded for Accordion
  const expandedCategories = availableCategories.filter(
    category => collapsedCategories.includes(category),
  )

  // Handle Accordion value change
  const handleExpandedChange = (expanded: string[]) => {
    // Calculate which categories are now collapsed
    const newCollapsed = availableCategories.filter(
      category => expanded.includes(category),
    )
    setCollapsedCategories(newCollapsed)

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCollapsed))
    } catch (error) {
      console.warn('Failed to save collapsed categories to localStorage:', error)
    }
  }

  return [expandedCategories, handleExpandedChange] as const
}
