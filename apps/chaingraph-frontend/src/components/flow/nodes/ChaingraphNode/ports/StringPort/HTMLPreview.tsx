/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useReactFlow } from '@xyflow/react'
import { RefreshCw, Settings } from 'lucide-react'
import { connect, WindowMessenger } from 'penpal'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { requestUpdatePortUI } from '@/store/ports'

export interface HtmlStyles {
  height?: number // 100-2000px, default 400
  autoHeight?: boolean // default false
  maxHeight?: 'unlimited' | '400' | '600' | '800' | '1000' // default '600'
  scale?: number // 25-200%, default 100
  showBorder?: boolean // default false
  stripMarkdown?: boolean // default true
  debounceDelay?: number // 0-2000ms, default 600
}

export interface HTMLPreviewProps {
  content: string
  nodeId: string
  portId: string
  styles?: HtmlStyles
  className?: string
}

/**
 * Preprocesses HTML content by removing markdown syntax that LLMs often add.
 *
 * Removes:
 * 1. ~~~thoughts ... ~~~ blocks completely (LLM thinking blocks)
 * 2. ~~~anything ... ~~~ blocks completely
 * 3. Markdown code fences but keeps the content:
 *    - ```html ... ``` → keeps HTML
 *    - ```js ... ``` → keeps JS
 *    - ``` ... ``` → keeps content
 */
function preprocessHtmlContent(content: string): string {
  let processed = content

  // Step 1: Remove all ~~~...~~~ blocks completely (including ~~~thoughts, etc.)
  // Match ~~~ followed by optional word, newline, content, newline, ~~~
  // Using negated character class to avoid backtracking
  processed = processed.replace(/~~~\w*\n(?:(?!~~~)[^\n]*\n)*~~~/g, '')

  // Step 2: Extract content from markdown code fences
  // Match ```language followed by content and closing ```
  // Using negative lookahead to stop at closing ```
  const trimmed = processed.trim()

  // Try to match entire content as single code block first
  const fullBlockMatch = trimmed.match(/^```(?:html?|javascript|js|ts)?\n((?:(?!```)[\s\S])*)\n```$/i)
  if (fullBlockMatch) {
    return fullBlockMatch[1].trim()
  }

  // Extract all code blocks
  processed = processed.replace(/```(?:html?|javascript|js|ts)?\n((?:(?!```)[\s\S])*)\n```/gi, '$1')

  // Handle inline code blocks (no newlines)
  // Match ``` followed by optional language and content up to closing ```
  const inlineMatch = processed.trim().match(/^```(?:html?|javascript|js)?([^`]+)```$/i)
  if (inlineMatch) {
    return inlineMatch[1].trim()
  }

  return processed.trim()
}

// Theme color definitions matching ChainGraph's design system
const THEME_COLORS = {
  light: {
    background: 'hsl(0 0% 100%)', // card background for seamless look
    foreground: 'hsl(0 0% 9%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(0 0% 9%)',
    muted: 'hsl(0 0% 94%)',
    mutedForeground: 'hsl(0 0% 45%)',
    border: 'hsl(0 0% 90%)',
    primary: 'hsl(142 76% 36%)',
    primaryForeground: 'hsl(0 0% 100%)',
    accent: 'hsl(0 0% 94%)',
    accentForeground: 'hsl(0 0% 9%)',
    destructive: 'hsl(0 84% 60%)',
  },
  dark: {
    background: 'hsl(0 0% 10%)', // card background for seamless look
    foreground: 'hsl(0 0% 100%)',
    card: 'hsl(0 0% 10%)',
    cardForeground: 'hsl(0 0% 100%)',
    muted: 'hsl(0 0% 14%)',
    mutedForeground: 'hsl(0 0% 64%)',
    border: 'hsl(0 0% 16%)',
    primary: 'hsl(142 70% 45%)',
    primaryForeground: 'hsl(0 0% 100%)',
    accent: 'hsl(0 0% 14%)',
    accentForeground: 'hsl(0 0% 100%)',
    destructive: 'hsl(0 84% 60%)',
  },
}

/**
 * Wraps user HTML content with Penpal bridge and theme-aware styling.
 * The iframe will have access to `window.chaingraph` API after connection.
 */
function wrapContentWithBridge(userContent: string, theme: 'light' | 'dark'): string {
  const colors = THEME_COLORS[theme]

  return `<!DOCTYPE html>
<html data-theme="${theme}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://unpkg.com/penpal@7/dist/penpal.min.js"><\/script>
  <style>
    :root {
      /* ChainGraph Theme Variables */
      --cg-background: ${colors.background};
      --cg-foreground: ${colors.foreground};
      --cg-card: ${colors.card};
      --cg-card-foreground: ${colors.cardForeground};
      --cg-muted: ${colors.muted};
      --cg-muted-foreground: ${colors.mutedForeground};
      --cg-border: ${colors.border};
      --cg-primary: ${colors.primary};
      --cg-primary-foreground: ${colors.primaryForeground};
      --cg-accent: ${colors.accent};
      --cg-accent-foreground: ${colors.accentForeground};
      --cg-destructive: ${colors.destructive};

      /* Convenience aliases */
      --background: var(--cg-background);
      --foreground: var(--cg-foreground);
      --text: var(--cg-foreground);
      --text-muted: var(--cg-muted-foreground);
      --border: var(--cg-border);
      --primary: var(--cg-primary);
      --accent: var(--cg-accent);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      background: var(--cg-background);
      color: var(--cg-foreground);
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    body {
      padding: 8px;
    }

    /* Typography */
    h1, h2, h3, h4, h5, h6 {
      color: var(--cg-foreground);
      font-weight: 600;
      line-height: 1.3;
    }
    h1 { font-size: 1.5em; margin-bottom: 0.5em; }
    h2 { font-size: 1.25em; margin-bottom: 0.5em; }
    h3 { font-size: 1.1em; margin-bottom: 0.4em; }

    p { margin-bottom: 0.75em; }
    a { color: var(--cg-primary); text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* Form elements */
    button, .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5em;
      padding: 0.5em 1em;
      font-size: 0.875em;
      font-weight: 500;
      border-radius: 6px;
      border: 1px solid var(--cg-border);
      background: var(--cg-muted);
      color: var(--cg-foreground);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    button:hover, .btn:hover {
      background: var(--cg-accent);
      border-color: var(--cg-muted-foreground);
    }
    button:active, .btn:active {
      transform: scale(0.98);
    }
    button.primary, .btn-primary {
      background: var(--cg-primary);
      color: var(--cg-primary-foreground);
      border-color: var(--cg-primary);
    }
    button.primary:hover, .btn-primary:hover {
      filter: brightness(1.1);
    }

    input, textarea, select {
      width: 100%;
      padding: 0.5em 0.75em;
      font-size: 0.875em;
      border-radius: 6px;
      border: 1px solid var(--cg-border);
      background: var(--cg-background);
      color: var(--cg-foreground);
      outline: none;
      transition: border-color 0.15s ease;
    }
    input:focus, textarea:focus, select:focus {
      border-color: var(--cg-primary);
    }
    input::placeholder, textarea::placeholder {
      color: var(--cg-muted-foreground);
    }

    /* Card/Panel */
    .card, .panel {
      background: var(--cg-muted);
      border: 1px solid var(--cg-border);
      border-radius: 8px;
      padding: 1em;
    }

    /* Code */
    code {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.875em;
      background: var(--cg-muted);
      padding: 0.2em 0.4em;
      border-radius: 4px;
    }
    pre {
      background: var(--cg-muted);
      border-radius: 8px;
      padding: 1em;
      overflow-x: auto;
    }
    pre code {
      background: none;
      padding: 0;
    }

    /* Utilities */
    .text-muted { color: var(--cg-muted-foreground); }
    .text-primary { color: var(--cg-primary); }
    .bg-muted { background: var(--cg-muted); }
    .mt-1 { margin-top: 0.25em; }
    .mt-2 { margin-top: 0.5em; }
    .mt-3 { margin-top: 0.75em; }
    .mt-4 { margin-top: 1em; }
    .mb-1 { margin-bottom: 0.25em; }
    .mb-2 { margin-bottom: 0.5em; }
    .mb-3 { margin-bottom: 0.75em; }
    .mb-4 { margin-bottom: 1em; }
    .flex { display: flex; }
    .gap-2 { gap: 0.5em; }
    .items-center { align-items: center; }

    /* Error display */
    #__cg_error__ {
      display: none;
      padding: 12px 14px;
      border-radius: 8px;
      background: ${theme === 'dark' ? 'hsl(0 40% 15%)' : 'hsl(0 60% 97%)'};
      border: 1px solid ${theme === 'dark' ? 'hsl(0 50% 25%)' : 'hsl(0 50% 85%)'};
      font-size: 12px;
      line-height: 1.5;
    }
    #__cg_error__.visible { display: block; }
    #__cg_error__ .error-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: ${theme === 'dark' ? 'hsl(0 60% 40%)' : 'hsl(0 70% 55%)'};
      color: white;
      font-size: 11px;
      font-weight: 600;
      margin-right: 8px;
      flex-shrink: 0;
    }
    #__cg_error__ .error-header {
      display: flex;
      align-items: center;
      color: ${theme === 'dark' ? 'hsl(0 70% 70%)' : 'hsl(0 60% 45%)'};
      font-weight: 500;
      margin-bottom: 6px;
    }
    #__cg_error__ .error-message {
      color: ${theme === 'dark' ? 'hsl(0 30% 75%)' : 'hsl(0 40% 35%)'};
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 11px;
      padding: 8px 10px;
      background: ${theme === 'dark' ? 'hsl(0 30% 12%)' : 'hsl(0 30% 94%)'};
      border-radius: 4px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
    #__cg_error__ .error-location {
      color: var(--cg-muted-foreground);
      font-size: 10px;
      margin-top: 6px;
    }
  </style>
</head>
<body>
<div id="__cg_error__">
  <div class="error-header">
    <span class="error-icon">!</span>
    <span>JavaScript Error</span>
  </div>
  <div class="error-message"></div>
  <div class="error-location"></div>
</div>
<div id="__cg_content__">
${userContent}
</div>
<script>
  // Error handling - catch and display errors elegantly
  (function() {
    const errorBox = document.getElementById('__cg_error__');
    const errorMessage = errorBox.querySelector('.error-message');
    const errorLocation = errorBox.querySelector('.error-location');
    const contentBox = document.getElementById('__cg_content__');

    function showError(message, location) {
      errorMessage.textContent = message;
      errorLocation.textContent = location || '';
      errorBox.classList.add('visible');
    }

    function hideError() {
      errorBox.classList.remove('visible');
    }

    // Global error handler
    window.onerror = function(message, source, lineno, colno, error) {
      // Adjust line number (subtract wrapper lines)
      const adjustedLine = lineno ? Math.max(1, lineno - 70) : null;
      const location = adjustedLine ? 'Line ' + adjustedLine + (colno ? ', Column ' + colno : '') : '';
      showError(message, location);
      return true; // Prevent default error handling
    };

    // Promise rejection handler
    window.onunhandledrejection = function(event) {
      const message = event.reason?.message || event.reason || 'Unhandled promise rejection';
      showError(message, '');
    };

    // Clear errors when content loads successfully
    window.addEventListener('load', function() {
      // Small delay to let any sync errors fire first
      setTimeout(hideError, 50);
    });
  })();

  // Theme detection helper
  window.chaingraphTheme = '${theme}';
  window.isDarkTheme = ${theme === 'dark'};

  // Initialize Penpal connection to parent using WindowMessenger
  const messenger = new Penpal.WindowMessenger({
    remoteWindow: window.parent,
    allowedOrigins: ['*'], // Allow any origin for sandboxed iframe
  });

  const connection = Penpal.connect({
    messenger,
    methods: {
      // Methods that parent can call on this iframe
      getContentHeight: () => document.body.scrollHeight,
      getContentWidth: () => document.body.scrollWidth,
      // Theme update handler
      updateTheme: (newTheme) => {
        document.documentElement.setAttribute('data-theme', newTheme);
        window.chaingraphTheme = newTheme;
        window.isDarkTheme = newTheme === 'dark';
        window.dispatchEvent(new CustomEvent('chaingraph:themechange', { detail: newTheme }));
      }
    }
  });

  // Make parent API available globally as window.chaingraph
  connection.promise.then(parent => {
    window.chaingraph = parent;
    console.log('[HTMLPreview] Connected to ChainGraph. Theme:', window.chaingraphTheme);

    // Dispatch custom event when API is ready
    window.dispatchEvent(new CustomEvent('chaingraph:ready', { detail: parent }));
  }).catch(err => {
    console.error('[HTMLPreview] Failed to connect to parent:', err);
  });
<\/script>
</body>
</html>`
}

// Preset values for quick selection
const HEIGHT_PRESETS = [100, 200, 300, 400, 600, 800]
const SCALE_PRESETS = [50, 75, 100, 125, 150]
const DELAY_LABELS = ['Instant', 'Fast', 'Normal', 'Slow']
const DELAY_VALUES = [0, 300, 600, 1200]

function HTMLPreviewInner({
  content,
  nodeId,
  portId,
  styles,
  className,
}: HTMLPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const { screenToFlowPosition } = useReactFlow()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartRef = useRef<{ startY: number, startHeight: number } | null>(null)

  // LOCAL state for resize - provides instant visual feedback without store updates
  // Only syncs to store on mouseup to avoid performance issues during drag
  const [resizeHeight, setResizeHeight] = useState<number | null>(null)

  // Get current values with defaults
  const storeHeight = styles?.height ?? 400
  // During resize, use local state; otherwise use store value
  const height = resizeHeight ?? storeHeight
  const autoHeight = styles?.autoHeight ?? false
  const maxHeight = styles?.maxHeight ?? '600'
  const scale = styles?.scale ?? 100
  const showBorder = styles?.showBorder ?? false
  const stripMarkdown = styles?.stripMarkdown ?? true
  const debounceDelay = styles?.debounceDelay ?? 600

  // Store the last successfully rendered content
  const [renderedContent, setRenderedContent] = useState<string>('')
  // Initialize with preprocessed content
  const [debouncedContent, setDebouncedContent] = useState(() =>
    stripMarkdown ? preprocessHtmlContent(content) : content,
  )
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Update a single style property
  const updateStyle = useCallback((key: keyof HtmlStyles, value: any) => {
    requestUpdatePortUI({
      nodeId,
      portId,
      ui: {
        htmlStyles: {
          ...styles,
          [key]: value,
        },
      },
    })
  }, [nodeId, portId, styles])

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    const cleanedContent = stripMarkdown ? preprocessHtmlContent(content) : content
    setDebouncedContent(cleanedContent)
  }, [content, stripMarkdown])

  // Resize handlers - use local state for instant feedback, sync to store on mouseup
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    // Convert to flow coordinates for zoom-aware calculations (like AnchorHandle.tsx)
    const startFlow = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    resizeStartRef.current = {
      startY: startFlow.y, // Flow Y, not screen Y - handles zoom automatically
      startHeight: storeHeight,
    }
    // Initialize local resize state
    setResizeHeight(storeHeight)
  }, [storeHeight, screenToFlowPosition])

  // Use refs for callbacks to avoid effect dependency issues
  const updateStyleRef = useRef(updateStyle)
  updateStyleRef.current = updateStyle
  const screenToFlowPositionRef = useRef(screenToFlowPosition)
  screenToFlowPositionRef.current = screenToFlowPosition

  useEffect(() => {
    if (!isResizing)
      return

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current)
        return

      // Convert to flow coordinates for zoom-aware delta calculation
      const currentFlow = screenToFlowPositionRef.current({ x: e.clientX, y: e.clientY })
      const deltaY = currentFlow.y - resizeStartRef.current.startY
      const newHeight = Math.max(100, Math.min(2000, resizeStartRef.current.startHeight + deltaY))

      // Update LOCAL state only - instant visual feedback, no store cascade
      setResizeHeight(newHeight)
    }

    const handleMouseUp = () => {
      // Sync final height to store (single update, not on every mousemove)
      setResizeHeight((finalHeight) => {
        if (finalHeight !== null) {
          // Use ref to avoid stale closure
          updateStyleRef.current('height', finalHeight)
        }
        return null // Clear local state, revert to store value
      })
      setIsResizing(false)
      resizeStartRef.current = null
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing]) // No updateStyle dependency - using ref instead

  // Debounce content updates and preprocess to remove markdown syntax
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      // Preprocess to remove markdown code fences and thought blocks
      const cleanedContent = stripMarkdown ? preprocessHtmlContent(content) : content
      setDebouncedContent(cleanedContent)
    }, debounceDelay)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [content, stripMarkdown, debounceDelay])

  // Generate wrapped content only when debounced content changes
  const wrappedContent = useMemo(
    () => wrapContentWithBridge(debouncedContent, theme),
    [debouncedContent, theme],
  )

  // Update rendered content when wrapped content is ready
  useEffect(() => {
    if (wrappedContent) {
      setRenderedContent(wrappedContent)
    }
  }, [wrappedContent])

  // Setup Penpal connection
  useEffect(() => {
    if (!iframeRef.current?.contentWindow || !renderedContent)
      return

    // Create messenger to communicate with iframe
    const messenger = new WindowMessenger({
      remoteWindow: iframeRef.current.contentWindow,
      allowedOrigins: ['*'], // Allow any origin for sandboxed iframe (has null origin)
    })

    // Connect to child iframe with Penpal v7 API
    const connection = connect<{
      getContentHeight: () => number
      getContentWidth: () => number
    }>({
      messenger,
      methods: {
        // Methods exposed TO the iframe (what iframe can call via window.chaingraph)
        getFlowContext: async () => ({
          nodeId,
          portId,
        }),
        log: (message: string, ...args: unknown[]) => {
          console.log(`[HTMLPreview:${nodeId}]`, message, ...args)
        },
        // Phase 2: Add more APIs here
        // getPortValue, setPortValue, createNode, etc.
      },
    })

    return () => {
      connection.destroy()
    }
  }, [nodeId, portId, renderedContent])

  // Calculate delay label for display
  const delayLabel = useMemo(() => {
    const index = DELAY_VALUES.findIndex(v => v >= debounceDelay)
    return DELAY_LABELS[index !== -1 ? index : DELAY_LABELS.length - 1]
  }, [debounceDelay])

  // Show placeholder if no content yet
  if (!renderedContent) {
    return (
      <div
        className={cn('relative mt-2 w-full rounded-md bg-muted/50', className)}
        style={{ height, minHeight: 100 }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
          Enter HTML to preview...
        </div>
      </div>
    )
  }

  // Calculate container height to account for scale
  const containerHeight = autoHeight
    ? 'auto'
    : scale !== 100
      ? `${height * (scale / 100)}px`
      : `${height}px`

  return (
    <div
      ref={containerRef}
      className={cn('relative mt-2 w-full group/html', className)}
      style={{
        height: autoHeight ? 'auto' : containerHeight,
        maxHeight: autoHeight ? (maxHeight === 'unlimited' ? 'none' : `${maxHeight}px`) : undefined,
        paddingBottom: !autoHeight ? '8px' : undefined, // Space for resize handle
      }}
    >
      {/* Settings gear icon - appears on hover */}
      <div className="absolute top-0 right-0 z-10 opacity-0 group-hover/html:opacity-100 transition-opacity">
        <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 bg-background/80 hover:bg-background nodrag"
            >
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 nodrag" align="end" side="bottom">
            <div className="space-y-5">
              <h4 className="font-semibold text-sm">HTML Preview Settings</h4>

              {/* Preview Height Slider */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Preview Height</Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {height}
                    px
                  </span>
                </div>
                <Slider
                  value={[height]}
                  onValueChange={([v]) => updateStyle('height', v)}
                  min={100}
                  max={2000}
                  step={50}
                  className="nodrag"
                  disabled={autoHeight}
                />
                {/* Preset quick buttons */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {HEIGHT_PRESETS.map(h => (
                    <Button
                      key={h}
                      variant={height === h ? 'default' : 'outline'}
                      size="sm"
                      className="h-6 px-2 text-[10px] nodrag"
                      onClick={() => updateStyle('height', h)}
                      disabled={autoHeight}
                    >
                      {h}
                      px
                    </Button>
                  ))}
                </div>
              </div>

              {/* Auto Height Toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Auto Height</Label>
                <Switch
                  checked={autoHeight}
                  onCheckedChange={v => updateStyle('autoHeight', v)}
                  className="nodrag"
                />
              </div>

              {/* Max Height Radio (when auto height enabled) */}
              {autoHeight && (
                <div className="space-y-2.5">
                  <Label className="text-xs font-medium">Max Height</Label>
                  <RadioGroup value={maxHeight} onValueChange={v => updateStyle('maxHeight', v)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="400" id="max-400" className="nodrag" />
                      <Label htmlFor="max-400" className="text-xs font-normal cursor-pointer">400px</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="600" id="max-600" className="nodrag" />
                      <Label htmlFor="max-600" className="text-xs font-normal cursor-pointer">600px</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="800" id="max-800" className="nodrag" />
                      <Label htmlFor="max-800" className="text-xs font-normal cursor-pointer">800px</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1000" id="max-1000" className="nodrag" />
                      <Label htmlFor="max-1000" className="text-xs font-normal cursor-pointer">1000px</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unlimited" id="max-unlimited" className="nodrag" />
                      <Label htmlFor="max-unlimited" className="text-xs font-normal cursor-pointer">Unlimited</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Content Scale Slider */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Content Scale</Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {scale}
                    %
                  </span>
                </div>
                <Slider
                  value={[scale]}
                  onValueChange={([v]) => updateStyle('scale', v)}
                  min={25}
                  max={200}
                  step={5}
                  className="nodrag"
                />
                {/* Preset quick buttons */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {SCALE_PRESETS.map(s => (
                    <Button
                      key={s}
                      variant={scale === s ? 'default' : 'outline'}
                      size="sm"
                      className="h-6 px-2 text-[10px] nodrag"
                      onClick={() => updateStyle('scale', s)}
                    >
                      {s}
                      %
                    </Button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Show Border</Label>
                  <Switch
                    checked={showBorder}
                    onCheckedChange={v => updateStyle('showBorder', v)}
                    className="nodrag"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Strip Markdown</Label>
                  <Switch
                    checked={stripMarkdown}
                    onCheckedChange={v => updateStyle('stripMarkdown', v)}
                    className="nodrag"
                  />
                </div>
              </div>

              {/* Update Delay Slider */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Update Delay</Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {delayLabel}
                  </span>
                </div>
                <Slider
                  value={[debounceDelay]}
                  onValueChange={([v]) => updateStyle('debounceDelay', v)}
                  min={0}
                  max={2000}
                  step={100}
                  className="nodrag"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  {DELAY_LABELS.map(label => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="w-full nodrag text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Refresh Preview
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Iframe with applied styles */}
      <iframe
        key={refreshKey}
        ref={iframeRef}
        srcDoc={renderedContent}
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
        className={cn(
          'w-full rounded-t-md',
          // 'nodrag nowheel',
          showBorder && 'border-t border-l border-r border-border',
          !autoHeight && 'rounded-b-none', // Remove bottom radius when resize handle is visible
        )}
        style={{
          height: `${height}px`, // Always use base height, container handles scaling
          transform: scale !== 100 ? `scale(${scale / 100})` : undefined,
          transformOrigin: 'top left',
          width: scale !== 100 ? `${100 / (scale / 100)}%` : '100%',
          border: showBorder ? undefined : 'none',
          display: 'block',
          // Disable pointer events during resize to prevent iframe from stealing mouse events
          pointerEvents: isResizing ? 'none' : 'auto',
        }}
        title={`HTML Preview for ${nodeId}`}
      />

      {/* Resize handle - only show when not in auto height mode */}
      {!autoHeight && (
        <div
          onMouseDown={handleResizeStart}
          className={cn(
            'absolute bottom-0 left-0 right-0',
            'w-full h-2 flex items-center justify-center',
            'cursor-ns-resize nodrag',
            'rounded-b-md',
            'transition-colors',
            isResizing
              ? 'bg-primary/20'
              : 'bg-muted/40 hover:bg-muted/60',
            showBorder && 'border-b border-l border-r border-border',
          )}
        >
          {/* Drag indicator dots */}
          <div className="flex gap-1">
            <div className={cn(
              'w-1 h-1 rounded-full',
              isResizing ? 'bg-primary' : 'bg-muted-foreground/40',
            )}
            />
            <div className={cn(
              'w-1 h-1 rounded-full',
              isResizing ? 'bg-primary' : 'bg-muted-foreground/40',
            )}
            />
            <div className={cn(
              'w-1 h-1 rounded-full',
              isResizing ? 'bg-primary' : 'bg-muted-foreground/40',
            )}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Memoized HTMLPreview component - renders HTML+JS in a sandboxed iframe.
 *
 * Security features:
 * - No access to localStorage, sessionStorage, or cookies (sandbox without allow-same-origin)
 * - Scripts can execute (allow-scripts)
 * - Forms can submit (allow-forms)
 * - Modals (alert/confirm/prompt) work (allow-modals)
 * - Popups via window.open work (allow-popups)
 *
 * Communication:
 * - Uses Penpal for type-safe bidirectional postMessage communication
 * - Iframe has access to `window.chaingraph` API after connection
 * - Parent can call iframe methods via the connection
 *
 * Settings:
 * - Gear icon appears on hover (top-right)
 * - Configurable height, scale, border, markdown stripping, debounce delay
 * - Auto-height mode with max height limits
 */
export const HTMLPreview = memo(HTMLPreviewInner, (prev, next) => {
  if (prev.content !== next.content)
    return false
  if (prev.nodeId !== next.nodeId)
    return false
  if (prev.portId !== next.portId)
    return false
  if (prev.className !== next.className)
    return false

  // Deep compare styles
  const prevStyles = prev.styles
  const nextStyles = next.styles
  if (prevStyles?.height !== nextStyles?.height)
    return false
  if (prevStyles?.autoHeight !== nextStyles?.autoHeight)
    return false
  if (prevStyles?.maxHeight !== nextStyles?.maxHeight)
    return false
  if (prevStyles?.scale !== nextStyles?.scale)
    return false
  if (prevStyles?.showBorder !== nextStyles?.showBorder)
    return false
  if (prevStyles?.stripMarkdown !== nextStyles?.stripMarkdown)
    return false
  if (prevStyles?.debounceDelay !== nextStyles?.debounceDelay)
    return false

  return true
})
