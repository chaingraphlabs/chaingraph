import { createContext } from 'react'

interface ZoomContextType {
  zoom: number
  setZoom: (zoom: number) => void
}

export const ZoomContext = createContext<ZoomContextType>({
  zoom: 1,
  setZoom: () => {},
})
