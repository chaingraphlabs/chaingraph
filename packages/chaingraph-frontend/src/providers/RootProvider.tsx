import type { PropsWithChildren } from 'react'
import { TrpcProvider } from '../api/trpc/provider'
import { ThemeProvider } from '../components/theme/ThemeProvider.tsx'

export function RootProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <TrpcProvider>
        {children}
      </TrpcProvider>
    </ThemeProvider>
  )
}
