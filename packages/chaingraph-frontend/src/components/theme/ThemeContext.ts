import { createContext } from 'react'

export type ThemeMode = 'light' | 'dark'

export interface ThemeContextType {
  theme: ThemeMode
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
