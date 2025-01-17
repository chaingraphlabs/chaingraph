declare module '*.svg' {
  import type { ComponentType, SVGProps } from 'react'

  export const ReactComponent: ComponentType<SVGProps<SVGSVGElement>>
  const content: string
  export default content
}
