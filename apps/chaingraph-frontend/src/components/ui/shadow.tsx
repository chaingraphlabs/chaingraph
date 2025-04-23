/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PropsWithChildren } from 'react'
import radixStyles from '@radix-ui/themes/styles.css?inline'
import xyflowStyles from '@xyflow/react/dist/style.css?inline'
import { createContext, use, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from '../../index.css?inline'

const ShadowRootContext = createContext<ShadowRoot | null>(null)

export function useShadowRoot() {
  const ctx = use(ShadowRootContext)
  if (!ctx)
    throw new Error('ShadowRootContext')
  return ctx
}

export function Shadow({ children }: PropsWithChildren) {
  const [root, setRoot] = useState<ShadowRoot | undefined>()

  const hostRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || node.shadowRoot)
      return

    const shadowRoot = node.attachShadow({ mode: 'open' })
    setRoot(shadowRoot)
  }, [])

  return (
    <div ref={hostRef}>
      {root && <ShadowRootContext value={root}>{createPortal(<>{children}</>, root)}</ShadowRootContext> }
    </div>
  )
}

export function ShadowWithStyles({ children }: PropsWithChildren) {
  return (
    <Shadow>
      <style>{radixStyles}</style>
      <style>{xyflowStyles}</style>
      <style>{styles}</style>
      {children}
    </Shadow>
  )
}
