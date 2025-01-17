import type { PropsWithChildren } from 'react'
import { TrpcProvider } from '../api/trpc/provider'
import { ThemeProvider } from '../components/theme/ThemeProvider.tsx'
import { FlowProvider } from './FlowProvider'

export function RootProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <TrpcProvider>
        <FlowProvider>
          {children}
        </FlowProvider>
      </TrpcProvider>
    </ThemeProvider>
  )
}
