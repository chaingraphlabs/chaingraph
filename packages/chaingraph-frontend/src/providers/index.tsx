import type { PropsWithChildren } from 'react'
import { TrpcProvider } from '../api/trpc/provider'

export function Providers({ children }: PropsWithChildren) {
  return (
    <TrpcProvider>
      {children}
    </TrpcProvider>
  )
}
