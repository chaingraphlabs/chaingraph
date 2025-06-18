/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { PortVisibility } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortNumber,
  PortString,
  StringEnum,
} from '@badaitech/chaingraph-types'
import TurndownService from 'turndown'
import { NODE_CATEGORIES } from '../../categories'

type OutputValue = string | number

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  DELETE = 'DELETE',
}

export enum ResponseType {
  JSON = 'json',
  TEXT = 'text',
  BLOB = 'blob',
  HTML_TO_MARKDOWN = 'html-to-markdown',
}

function formatJSON(data: any): string {
  return JSON.stringify(data, null, 0)
}

@Node({
  type: 'HttpRequestNode',
  title: 'HTTP Request',
  description: `HTTP client for fetching data from web APIs and websites. Essential for AI agents working with web content.

Key Features:
- Supports GET, POST, PUT, PATCH, DELETE and HEAD methods
- Authentication via headers (API keys, Bearer tokens)
- Multiple response formats (JSON, text, html-to-markdown, binary)
- Configurable timeout and retry settings

Response Types:
- json: For API responses and structured data
- text: For plain text content or raw HTML
- html-to-markdown: For web pages - reduces token usage by 60-80%
- blob: For binary files and downloads

Best Practices:
- Use html-to-markdown for web scraping to save tokens
- Set appropriate User-Agent headers
- Check Status Code output for error handling
- Use reasonable timeouts (30s default)`,
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['http', 'request', 'api', 'web-scraping', 'fetch', 'web'],
})
export default class HttpRequestNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Base URI',
    description: 'The base URL of the API including protocol (http/https). This forms the foundation of your request URL.',
    ui: {
      placeholder: 'Example: https://api.example.com',
    },
    required: true,
  })
  baseUri: string = ''

  @Input()
  @PortString({
    title: 'Path',
    description: 'The endpoint path that will be appended to the Base URI. Should typically start with a slash (/).',
    ui: {
      placeholder: 'Example: /v1/users',
    },
    required: true,
  })
  path: string = ''

  @Input()
  @StringEnum(Object.values(HttpMethod), {
    title: 'Method',
    description: 'HTTP request method. GET retrieves data, POST creates/sends data, PUT updates resources, DELETE removes resources.',
    defaultValue: HttpMethod.GET,
    options: Object.values(HttpMethod).map(method => ({
      id: method,
      title: method,
      type: 'string',
      defaultValue: method,
    })),
    required: true,
  })
  method: HttpMethod = HttpMethod.GET

  @Input()
  @PortString({
    title: 'Headers',
    description: 'HTTP headers for authentication and request configuration. Enter one per line in "Key: Value" format.\n\nEssential headers for AI agents:\n• Authorization: Bearer API_KEY (for API access)\n• User-Agent: YourBot/1.0 (identify your bot)\n• Content-Type: application/json (for JSON data)\n• Accept: application/json (prefer JSON responses)\n• X-API-Key: YOUR_KEY (alternative API key format)',
    ui: {
      isTextArea: true,
      textareaDimensions: { width: 300, height: 80 },
      placeholder: 'User-Agent: Claude-Agent/1.0\nAuthorization: Bearer YOUR_API_KEY\nContent-Type: application/json\nAccept: application/json',
    },
  })
  headers: string = ''

  @Input()
  @PortString({
    title: 'Body',
    description: 'Request payload for POST, PUT, or PATCH requests. Format depends on Content-Type header (often JSON).',
    ui: {
      isTextArea: true,
      textareaDimensions: { width: 300, height: 120 },
      placeholder: '{\n  "name": "John Doe",\n  "email": "john@example.com"\n}',
    },
  })
  @PortVisibility({
    showIf: (node) => {
      const httpNode = node as HttpRequestNode
      return !httpNode.method
        || ![HttpMethod.GET, HttpMethod.HEAD, HttpMethod.DELETE].includes(httpNode.method)
    },
  })
  body: string = ''

  @Input()
  @StringEnum(Object.values(ResponseType), {
    title: 'Response Type',
    description: 'How to process the HTTP response for optimal AI consumption:\n\n• json: For APIs returning structured data\n• text: For plain text or when you need raw HTML (high token cost)\n• html-to-markdown: For web pages - ESSENTIAL for token efficiency! Converts HTML to clean markdown, removing 60-80% of unnecessary markup\n• Blob: For binary files\n\n⚠️ AI Agent Tip: Always use HTML to Markdown when scraping websites to dramatically reduce token usage and get cleaner, more analyzable content.',
    defaultValue: ResponseType.TEXT,
    options: Object.values(ResponseType).map(type => ({
      id: type,
      title: type,
      type: 'string',
      defaultValue: type,
    })),
    required: true,
  })
  responseType: ResponseType = ResponseType.TEXT

  @Input()
  @PortNumber({
    title: 'Timeout',
    description: 'Maximum time (in milliseconds) to wait for a response before aborting the request.',
    defaultValue: 30000,
    ui: {
      min: 1000,
      max: 60000,
      step: 1000,
    },
    required: true,
  })
  timeout: number = 30000

  @Input()
  @PortNumber({
    title: 'Retries',
    description: 'Number of times to retry the request if it fails. Uses exponential backoff between attempts.',
    defaultValue: 0,
    ui: {
      min: 0,
      max: 3,
      step: 1,
    },
  })
  retries: number = 0

  @Output()
  @PortNumber({
    title: 'Status Code',
    description: 'HTTP response status code. 2xx indicates success, 4xx indicates client error, 5xx indicates server error.',
    defaultValue: 0,
  })
  statusCode: number = 0

  @Output()
  @PortString({
    title: 'Response',
    description: 'The response body from the server, formatted according to the selected Response Type.',
    defaultValue: '',
  })
  response: string = ''

  private async executeWithRetry(url: URL, init: RequestInit): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        const response = await fetch(url.toString(), {
          ...init,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        return response
      } catch (error: any) {
        lastError = error
        if (attempt < this.retries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 2 ** attempt * 1000))
        }
      }
    }

    throw lastError || new Error('Request failed after retries')
  }

  private async parseResponse(response: Response): Promise<string> {
    try {
      switch (this.responseType) {
        case ResponseType.JSON: {
          const json = await response.json()
          return formatJSON(json)
        }
        case ResponseType.TEXT:
          return await response.text()
        case ResponseType.BLOB: {
          const blob = await response.blob()
          return `Blob: ${blob.type}, ${blob.size} bytes`
        }
        case ResponseType.HTML_TO_MARKDOWN: {
          const html = await response.text()
          return await convertHtmlToMarkdown(html)
        }
        default:
          return await response.text()
      }
    } catch (error: any) {
      throw new Error(`Failed to parse response as ${this.responseType}: ${error.message}`)
    }
  }

  private validateRequest(): void {
    // Validate Base URI
    if (!this.baseUri?.trim()) {
      throw new Error('Base URI is required')
    }

    try {
      // eslint-disable-next-line no-new
      new URL(this.baseUri)
    } catch (e) {
      throw new Error(`Invalid Base URI format: ${this.baseUri}`)
    }

    // Validate Path
    if (!this.path?.trim()) {
      throw new Error('Path is required')
    }

    if (!this.path.startsWith('/')) {
      // Auto-fix: Add leading slash instead of throwing
      this.path = `/${this.path}`
    }

    // Validate Method-specific requirements
    if (this.method !== HttpMethod.GET && this.method !== HttpMethod.HEAD) {
      if (this.body?.trim() && !this.headers?.includes('Content-Type')) {
        throw new Error('Content-Type header is required for requests with body')
      }
    }
  }

  private parseHeaders(headers: string): Record<string, string> {
    const headerRecord: Record<string, string> = {}
    if (!headers?.trim())
      return headerRecord

    const headerLines = headers.split('\n')
    for (const line of headerLines) {
      const [key, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim()
      if (key?.trim() && value) {
        headerRecord[key.trim()] = value
      }
    }
    return headerRecord
  }

  private validateBody(body: string, headers: Record<string, string>): string {
    if (!body?.trim())
      return ''

    const contentType = headers['Content-Type']?.toLowerCase() || headers['content-type']?.toLowerCase()

    if (contentType?.includes('application/json')) {
      try {
        // Validate and format JSON
        const parsed = JSON.parse(body)
        return formatJSON(parsed)
      } catch (e) {
        throw new Error(`Invalid JSON body: ${(e as Error).message}`)
      }
    }

    if (contentType?.includes('application/x-www-form-urlencoded')) {
      try {
        // Validate form data format
        // eslint-disable-next-line no-new
        new URLSearchParams(body)
      } catch (e) {
        throw new Error(`Invalid form data body: ${(e as Error).message}`)
      }
    }

    return body
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.validateRequest()

    const headerRecord = this.parseHeaders(this.headers)
    const validatedBody = this.validateBody(this.body, headerRecord)

    const baseUri = this.baseUri.endsWith('/') ? this.baseUri.slice(0, -1) : this.baseUri
    const path = this.path.startsWith('/') ? this.path : `/${this.path}`
    const url = new URL(path, baseUri)

    const requestInit: RequestInit = {
      method: this.method,
      headers: headerRecord,
    }

    if (this.method !== HttpMethod.GET && this.method !== HttpMethod.HEAD) {
      requestInit.body = validatedBody
    }

    const response = await this.executeWithRetry(url, requestInit)
    this.statusCode = response.status
    this.response = await this.parseResponse(response)

    return {
    }
  }
}

/**
 * Converts HTML content to Markdown format with robust cleaning
 */
async function convertHtmlToMarkdown(html: string): Promise<string> {
  // Step 1: Pre-clean HTML to remove unwanted elements
  const cleanedHtml = html
    // Remove script tags and their content (including inline scripts)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags and their content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove noscript tags and their content
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove meta tags
    .replace(/<meta\b[^>]*>/gi, '')
    // Remove link tags (CSS, icons, etc.)
    .replace(/<link\b[^>]*>/gi, '')
    // Remove base tags
    .replace(/<base\b[^>]*>/gi, '')
    // Remove iframe tags and content
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove object and embed tags
    .replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
    // Remove SVG elements that might contain scripts
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    // Remove any remaining script-like attributes (onclick, onload, etc.)
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*javascript\s*:/gi, '')

  // Step 2: Configure TurndownService with comprehensive settings
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
  })

  // Step 3: Remove specific elements that should not be converted
  turndownService.remove([
    'script',
    'style',
    'noscript',
    'meta',
    'link',
    'base',
    'title',
    'head',
    'iframe',
    'object',
    'embed',
    'canvas',
    'audio',
    'video',
    'source',
    'track',
    'map',
    'area',
    'input',
    'button',
    'select',
    'textarea',
    'form',
    'fieldset',
    'legend',
    'label',
  ])

  // Remove SVG and other elements using filter function
  turndownService.remove((node: any) => {
    const tagName = node.nodeName?.toLowerCase()
    return ['svg'].includes(tagName)
  })

  // Step 4: Add custom rules for problematic elements
  turndownService.addRule('removeNavigation', {
    filter: ['nav', 'header', 'footer', 'aside', 'menu'],
    replacement: () => '',
  })

  turndownService.addRule('removeComments', {
    filter: node => node.nodeType === 8, // Comment nodes
    replacement: () => '',
  })

  // Step 5: Convert to markdown
  const markdown = turndownService.turndown(cleanedHtml)

  // Step 6: Post-process markdown to clean up
  return markdown
    // Remove multiple consecutive empty lines
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Remove leading/trailing whitespace
    .trim()
    // Remove any remaining script-like content that might have slipped through
    .replace(/javascript:/gi, '')
    // Clean up extra spaces
    .replace(/[ \t]+/g, ' ')
    // Remove empty list items
    .replace(/^\s*[-*+]\s*$/gm, '')
}
