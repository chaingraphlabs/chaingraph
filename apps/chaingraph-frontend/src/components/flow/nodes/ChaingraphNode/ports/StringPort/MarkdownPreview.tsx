/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { Settings } from 'lucide-react'
import { memo, useCallback, useState } from 'react'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { requestUpdatePortUI } from '@/store/ports'

import 'katex/dist/katex.min.css'

export interface MarkdownStyles {
  fontSize?: number // 10-1000 (in percentage, 100 = normal)
  lineHeight?: 'compact' | 'normal' | 'relaxed'
  maxHeight?: 'unlimited' | '200' | '400' | '600'
}

export interface MarkdownPreviewProps {
  content: string
  nodeId: string
  portId: string
  styles?: MarkdownStyles
  className?: string
}

// Preset font sizes for slider steps
const FONT_SIZE_PRESETS = [50, 75, 100, 125, 150, 200, 300, 500, 1000]

// Line height scale factors (applied to spacing based on font size)
const LINE_HEIGHT_SCALE: Record<string, number> = {
  compact: 0.5,
  normal: 1,
  relaxed: 1.5,
}

const MAX_HEIGHT_CLASSES: Record<string, string> = {
  unlimited: '',
  '200': 'max-h-[200px] overflow-auto',
  '400': 'max-h-[400px] overflow-auto',
  '600': 'max-h-[600px] overflow-auto',
}

function MarkdownPreviewInner({
  content,
  nodeId,
  portId,
  styles,
  className,
}: MarkdownPreviewProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Get current values with defaults
  const fontSize = styles?.fontSize ?? 100
  const lineHeight = styles?.lineHeight ?? 'normal'
  const maxHeight = styles?.maxHeight ?? 'unlimited'

  // Calculate spacing based on font size and line height setting
  const spacingScale = LINE_HEIGHT_SCALE[lineHeight]
  const baseSpacing = (fontSize / 100) * spacingScale
  const paragraphSpacing = Math.max(0.5, baseSpacing * 0.75) // Scale with font size
  const headingSpacing = Math.max(0.5, baseSpacing)

  // Calculate adaptive padding (scales with font size)
  const basePadding = 0.5 // rem at 100%
  const paddingRem = Math.max(0.25, (fontSize / 100) * basePadding)

  // Custom sanitize schema that allows KaTeX classes
  const sanitizeSchema = {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      div: [
        ...(defaultSchema.attributes?.div || []),
        ['className', 'math', 'math-display'],
      ],
      span: [
        ...(defaultSchema.attributes?.span || []),
        ['className', 'math', 'math-inline'],
        // Allow all KaTeX classes
        ['className', /^katex/],
      ],
      // Allow aria attributes for accessibility
      '*': [
        ...(defaultSchema.attributes?.['*'] || []),
        ['aria-hidden'],
      ],
    },
    tagNames: [
      ...(defaultSchema.tagNames || []),
      'math',
      'semantics',
      'mrow',
      'mi',
      'mn',
      'mo',
      'mtext',
      'mspace',
      'mfrac',
      'msup',
      'msub',
      'msubsup',
      'msqrt',
      'mroot',
      'mtable',
      'mtr',
      'mtd',
      'annotation',
    ],
  }

  // Update a single style property
  const updateStyle = useCallback((key: keyof MarkdownStyles, value: any) => {
    requestUpdatePortUI({
      nodeId,
      portId,
      ui: {
        markdownStyles: {
          ...styles,
          [key]: value,
        },
      },
    })
  }, [nodeId, portId, styles])

  return (
    <div className={cn('relative mt-2 w-full group/markdown', className)}>
      {/* Settings gear icon - appears on hover */}
      <div className="absolute top-0 right-0 z-10 opacity-0 group-hover/markdown:opacity-100 transition-opacity">
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
              <h4 className="font-semibold text-sm">Markdown Settings</h4>

              {/* Text Size Slider */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Text Size</Label>
                  <span className="text-xs text-muted-foreground font-mono">{fontSize}%</span>
                </div>
                <Slider
                  value={[fontSize]}
                  onValueChange={([v]) => updateStyle('fontSize', v)}
                  min={10}
                  max={1000}
                  step={5}
                  className="nodrag"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>10%</span>
                  <span>100%</span>
                  <span>1000%</span>
                </div>
                {/* Preset quick buttons */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {FONT_SIZE_PRESETS.map(size => (
                    <Button
                      key={size}
                      variant={fontSize === size ? 'default' : 'outline'}
                      size="sm"
                      className="h-6 px-2 text-[10px] nodrag"
                      onClick={() => updateStyle('fontSize', size)}
                    >
                      {size}%
                    </Button>
                  ))}
                </div>
              </div>

              {/* Line Height Radio */}
              <div className="space-y-2.5">
                <Label className="text-xs font-medium">Line Spacing</Label>
                <RadioGroup value={lineHeight} onValueChange={v => updateStyle('lineHeight', v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="compact" id="compact" className="nodrag" />
                    <Label htmlFor="compact" className="text-xs font-normal cursor-pointer">Compact</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="normal" className="nodrag" />
                    <Label htmlFor="normal" className="text-xs font-normal cursor-pointer">Normal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="relaxed" id="relaxed" className="nodrag" />
                    <Label htmlFor="relaxed" className="text-xs font-normal cursor-pointer">Relaxed</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Max Height Radio */}
              <div className="space-y-2.5">
                <Label className="text-xs font-medium">Max Height</Label>
                <RadioGroup value={maxHeight} onValueChange={v => updateStyle('maxHeight', v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unlimited" id="unlimited" className="nodrag" />
                    <Label htmlFor="unlimited" className="text-xs font-normal cursor-pointer">Unlimited</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="200" id="200" className="nodrag" />
                    <Label htmlFor="200" className="text-xs font-normal cursor-pointer">200px</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="400" id="400" className="nodrag" />
                    <Label htmlFor="400" className="text-xs font-normal cursor-pointer">400px</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="600" id="600" className="nodrag" />
                    <Label htmlFor="600" className="text-xs font-normal cursor-pointer">600px</Label>
                  </div>
                </RadioGroup>
              </div>

            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Markdown content */}
      <div
        className={cn(
          'w-full max-w-none',
          // Tailwind Typography - GitHub-like styling
          'prose prose-sm prose-neutral dark:prose-invert',
          // Dynamic max height
          MAX_HEIGHT_CLASSES[maxHeight],
          // Code blocks - inherit font size, fix light theme contrast
          'prose-pre:bg-muted prose-pre:text-foreground',
          'prose-code:bg-muted prose-code:text-foreground prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
          // Other elements
          'prose-blockquote:border-l-2 prose-blockquote:border-muted-foreground/30',
          'prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline',
          // Allow text selection
          'select-text cursor-text',
          'nodrag',
          // Only prevent wheel zoom when scrollbar exists
          maxHeight !== 'unlimited' && 'nowheel',
        )}
        style={{
          fontSize: `${fontSize}%`,
          // Dynamic spacing that scales with font size
          ['--paragraph-spacing' as any]: `${paragraphSpacing}rem`,
          ['--heading-spacing' as any]: `${headingSpacing}rem`,
          // Adaptive padding (scales with font size)
          padding: `${paddingRem}rem`,
        }}
      >
        <style>
          {`
            .prose p { margin-top: var(--paragraph-spacing); margin-bottom: var(--paragraph-spacing); }
            .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
              margin-top: var(--heading-spacing);
              margin-bottom: var(--heading-spacing);
              font-weight: 600;
            }
            .prose ul, .prose ol {
              margin-top: var(--paragraph-spacing);
              margin-bottom: var(--paragraph-spacing);
            }
            .prose li { margin-top: calc(var(--paragraph-spacing) * 0.1); margin-bottom: calc(var(--paragraph-spacing) * 0.1); }
            .prose ul ul, .prose ol ol { margin-top: calc(var(--paragraph-spacing) * 0.2); margin-bottom: 0; }
            .prose blockquote, .prose pre, .prose hr {
              margin-top: var(--paragraph-spacing);
              margin-bottom: var(--paragraph-spacing);
            }
            .prose img { max-width: 100%; height: auto; margin-top: var(--paragraph-spacing); margin-bottom: var(--paragraph-spacing); }
            .prose table { width: 100%; table-layout: auto; display: table; }
            .prose thead { background-color: hsl(var(--muted)); }
            .prose td, .prose th { padding: 0.25rem 0.5rem; border: 1px solid hsl(var(--border)); word-break: break-word; }

            /* KaTeX display fixes */
            .katex-display {
              overflow-x: auto;
              overflow-y: hidden;
              margin: 1em 0;
              text-align: center;
              max-width: 100%;
            }
            .katex-display > .katex {
              display: inline-block;
              text-align: left;
              white-space: nowrap;
              max-width: 100%;
            }
            .katex {
              font-size: 1em !important;
              line-height: 1.2;
              color: inherit;
            }

            /* Color inheritance for dark mode */
            .katex .mord,
            .katex .mrel,
            .katex .mop,
            .katex .mbin,
            .katex .mpunct,
            .katex .mopen,
            .katex .mclose,
            .katex .minner {
              color: inherit !important;
            }

            /* Fix rule/line elements (sqrt, fraction lines) */
            .katex .rule {
              border-color: currentColor !important;
              background-color: currentColor !important;
            }

            /* Hide HTML version - only show MathML */
            .katex .katex-html {
              position: absolute !important;
              clip: rect(1px, 1px, 1px, 1px) !important;
              padding: 0 !important;
              border: 0 !important;
              height: 1px !important;
              width: 1px !important;
              overflow: hidden !important;
            }

            /* Style MathML for proper display */
            .katex math {
              display: inline-block !important;
              color: inherit !important;
            }
            .katex-display math {
              display: block !important;
              margin: 0 auto;
            }

            /* Hide annotation (LaTeX source) */
            .katex annotation {
              display: none !important;
            }

            /* MathML styling */
            math {
              font-family: "Latin Modern Math", "STIX Two Math", "Cambria Math", serif;
              color: inherit;
            }

            /* MathML elements inherit color */
            mi, mn, mo, mtext, mfrac, msqrt, mroot {
              color: inherit;
            }

            /* Fix MathML spacing */
            mfrac {
              display: inline-block;
              vertical-align: -0.5em;
            }

            /* Matrix and table elements */
            mtable {
              display: inline-table;
              vertical-align: middle;
            }
            mtr {
              display: table-row;
            }
            mtd {
              display: table-cell;
              padding: 0 0.3em;
            }
          `}
        </style>
        <Markdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[
            rehypeRaw,
            [rehypeSanitize, sanitizeSchema],
            [rehypeKatex, {
              trust: true,
              strict: false,
              output: 'mathml', // Only MathML - cleaner rendering
            }],
          ]}
          components={{
            a: ({ children, href }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {content}
        </Markdown>
      </div>
    </div>
  )
}

/**
 * Memoized MarkdownPreview component
 */
export const MarkdownPreview = memo(MarkdownPreviewInner, (prev, next) => {
  if (prev.content !== next.content) return false
  if (prev.nodeId !== next.nodeId) return false
  if (prev.portId !== next.portId) return false
  if (prev.className !== next.className) return false

  // Deep compare styles
  const prevStyles = prev.styles
  const nextStyles = next.styles
  if (prevStyles?.fontSize !== nextStyles?.fontSize) return false
  if (prevStyles?.lineHeight !== nextStyles?.lineHeight) return false
  if (prevStyles?.maxHeight !== nextStyles?.maxHeight) return false

  return true
})
