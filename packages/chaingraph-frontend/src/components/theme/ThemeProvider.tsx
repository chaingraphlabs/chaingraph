import { Theme } from '@radix-ui/themes'
import { type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext, type ThemeMode } from './ThemeContext'

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme') as ThemeMode
    if (savedTheme)
      return savedTheme

    // Then check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    // Update DOM and localStorage when theme changes
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }, [])

  const themeProviderValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return (
    <ThemeContext.Provider value={themeProviderValue}>
      <Theme appearance={theme}>
        {children}
      </Theme>
    </ThemeContext.Provider>
  )
}
