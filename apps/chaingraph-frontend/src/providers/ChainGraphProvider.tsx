/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CSSProperties, ReactNode } from 'react'
import type { ChainGraphConfig, SessionProvider } from '@/store/initialization'
import { useUnit } from 'effector-react'
import { useEffect, useRef, useState } from 'react'
// Error Boundary for initialization failures
import React from 'react'
import { setActiveFlowId } from '@/store/flow'
import { $initializationError, $initializationProgress, $isAppReady, initChainGraph } from '@/store/initialization'
import { DEFAULT_INIT_KEY, initTracker } from '@/store/initialization-tracker'

import { RootProvider } from './RootProvider'

class ChainGraphErrorBoundary extends React.Component<
  { children: ReactNode, onError?: (error: Error) => void },
  { hasError: boolean, error: Error | null }
> {
  constructor(props: { children: ReactNode, onError?: (error: Error) => void }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ChainGraph] Error boundary caught error:', error, errorInfo)
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
        }}
        >
          <h3>ChainGraph Failed to Load</h3>
          <details style={{ marginTop: '10px', textAlign: 'left' }}>
            <summary>Error Details</summary>
            <pre style={{ fontSize: '12px', marginTop: '10px', overflow: 'auto' }}>
              {this.state.error?.message || 'Unknown error occurred'}
            </pre>
          </details>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#721c24',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

interface ChainGraphProviderProps {
  // Core initialization
  session: string | SessionProvider
  config?: ChainGraphConfig

  // Flow management
  flowId?: string

  // UI customization (forwarded to RootProvider)
  theme?: 'dark' | 'light'
  wrapperClassName?: string
  className?: string
  style?: CSSProperties

  // Error handling and callbacks
  onError?: (error: Error) => void
  onInitialized?: () => void
  loadingComponent?: ReactNode
  errorComponent?: (error: Error) => ReactNode

  // Host integration
  initializationRef?: { current: boolean }
  initKey?: object | symbol

  // Content
  children: ReactNode
}

export function ChainGraphProvider({
  session,
  config,
  flowId,
  theme,
  wrapperClassName,
  className,
  style,
  onError,
  onInitialized,
  loadingComponent,
  errorComponent,
  initializationRef,
  initKey = DEFAULT_INIT_KEY,
  children,
}: ChainGraphProviderProps) {
  const mountIdRef = useRef(crypto.randomUUID())
  const [hasStartedInit, setHasStartedInit] = useState(false)
  const hasNotifiedInitialized = useRef(false)

  // Subscribe to initialization state
  const { isReady, initProgress, initError } = useUnit({
    isReady: $isAppReady,
    initProgress: $initializationProgress,
    initError: $initializationError,
  })

  // Initialize ChainGraph on mount - StrictMode safe
  useEffect(() => {
    if (!session)
      return

    // Check if already initializing/initialized using tracker
    const existingPromise = initTracker.getPromise(initKey)

    if (existingPromise) {
      console.log('[ChainGraphProvider] Reusing existing initialization promise')
      existingPromise.then(() => {
        if (!hasNotifiedInitialized.current) {
          hasNotifiedInitialized.current = true
          onInitialized?.()
          if (initializationRef) {
            initializationRef.current = true
          }
        }
      }).catch((error) => {
        console.error('[ChainGraphProvider] Existing initialization failed:', error)
        onError?.(error)
      })
      return
    }

    // Start new initialization only if not already started
    if (!hasStartedInit) {
      console.log('[ChainGraphProvider] Starting new initialization for mount:', mountIdRef.current)
      setHasStartedInit(true)

      initChainGraph(session, config, initKey).then(() => {
        if (!hasNotifiedInitialized.current) {
          hasNotifiedInitialized.current = true
          onInitialized?.()
          if (initializationRef) {
            initializationRef.current = true
          }
        }
      }).catch((error) => {
        console.error('[ChainGraphProvider] Initialization failed:', error)
        onError?.(error)
      })
    }
  }, [mountIdRef.current]) // Use stable ref instead of changing deps

  // Set active flow when ready and flowId provided
  useEffect(() => {
    if (isReady && flowId) {
      console.log('[ChainGraphProvider] Setting active flow:', flowId)
      setActiveFlowId(flowId)
    }
  }, [isReady, flowId])

  // Handle initialization errors
  useEffect(() => {
    if (initError) {
      console.error('[ChainGraphProvider] Initialization error detected:', initError)
      onError?.(initError)
    }
  }, [initError, onError])

  // Show custom error component if provided
  if (initError && errorComponent) {
    return (
      <ChainGraphErrorBoundary onError={onError}>
        {errorComponent(initError)}
      </ChainGraphErrorBoundary>
    )
  }

  // Show loading state while initializing
  if (!hasStartedInit || !isReady) {
    const defaultLoadingComponent = (
      <div style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
      }}
      >
        <div>Loading ChainGraph...</div>
        <div style={{ fontSize: '14px', opacity: 0.7 }}>
          {initProgress === 'setting-session' && 'Setting up session...'}
          {initProgress === 'initializing-registry' && 'Initializing node registry...'}
          {initProgress === 'creating-clients' && 'Connecting to servers...'}
          {initProgress === 'fetching-data' && 'Fetching data...'}
          {initProgress === 'complete' && 'Ready!'}
          {initProgress === 'error' && 'Initialization failed'}
        </div>
      </div>
    )

    return (
      <ChainGraphErrorBoundary onError={onError}>
        {loadingComponent || defaultLoadingComponent}
      </ChainGraphErrorBoundary>
    )
  }

  // Render the actual ChainGraph when ready
  return (
    <ChainGraphErrorBoundary onError={onError}>
      <RootProvider
        theme={theme}
        wrapperClassName={wrapperClassName}
        className={className}
        style={style}
      >
        {children}
      </RootProvider>
    </ChainGraphErrorBoundary>
  )
}
