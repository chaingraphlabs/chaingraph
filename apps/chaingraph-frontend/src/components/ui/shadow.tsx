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
import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from '../../index.css?inline'
import { ShadowRootContext } from './useShadowRoot'

export function Shadow({ children, className }: PropsWithChildren<{ className?: string }>) {
  const [root, setRoot] = useState<ShadowRoot | undefined>()

  const hostRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || node.shadowRoot)
      return

    const shadowRoot = node.attachShadow({ mode: 'open' })
    setRoot(shadowRoot)
  }, [])

  return (
    <div className={className} ref={hostRef}>
      {root && <ShadowRootContext value={root}>{createPortal(<>{children}</>, root)}</ShadowRootContext> }
    </div>
  )
}

export function ShadowWithStyles({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <Shadow className={className}>
      <style>{radixStyles}</style>
      <style>{xyflowStyles}</style>
      <style>{styles}</style>
      {children}
    </Shadow>
  )
}
