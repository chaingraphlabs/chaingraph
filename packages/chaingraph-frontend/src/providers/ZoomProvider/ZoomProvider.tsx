import { type PropsWithChildren, useMemo, useState } from 'react'
import { ZoomContext } from './ZoomContext'

export function ZoomProvider({ children }: PropsWithChildren) {
  const [zoom, setZoom] = useState(1)

  const contextValue = useMemo(() => ({
    zoom,
    setZoom,
  }), [zoom])

  return (
    <ZoomContext.Provider value={contextValue}>
      {children}
    </ZoomContext.Provider>
  )
}
