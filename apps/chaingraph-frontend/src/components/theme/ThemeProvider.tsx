/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PropsWithChildren } from 'react'
import type { ThemeMode } from './ThemeContext'
import { Theme } from '@radix-ui/themes'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './ThemeContext'

const localStorageKeyPrefix = 'chaingraph:'
const localStorageKeyTheme = `${localStorageKeyPrefix}theme`

export interface ThemeProviderProps extends PropsWithChildren {
  theme?: ThemeMode
}

export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  const [currentTheme, setTheme] = useState<ThemeMode>(() => {
    // check if a theme is passed as a prop
    if (theme) {
      return theme
    }

    // Check localStorage first
    const savedTheme = localStorage.getItem(localStorageKeyTheme) as ThemeMode
    if (savedTheme)
      return savedTheme

    // Then check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    // Update DOM and localStorage when theme changes
    document.documentElement.classList.toggle('dark', currentTheme === 'dark')
    localStorage.setItem(localStorageKeyTheme, currentTheme)
  }, [currentTheme])

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }, [])

  const themeProviderValue = useMemo(() => ({
    theme: currentTheme,
    toggleTheme,
  }), [currentTheme, toggleTheme])

  return (
    <ThemeContext value={themeProviderValue}>
      <Theme appearance={themeProviderValue.theme}>
        {children}
      </Theme>
    </ThemeContext>
  )
}
