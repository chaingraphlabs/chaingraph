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
  Number,
  Output,
  String,
  StringEnum,
} from '@badaitech/chaingraph-types'
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
}

function formatJSON(data: any): string {
  return JSON.stringify(data, null, 0)
}

@Node({
  type: 'HttpRequestNode',
  title: 'HTTP Request',
  description: 'Makes HTTP requests to external services',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['http', 'request', 'api'],
})
export default class HttpRequestNode extends BaseNode {
  @Input()
  @String({
    title: 'Base URI',
    description: 'The base URL of the API including protocol (http/https). This forms the foundation of your request URL.',
    ui: {
      placeholder: 'Example: https://api.example.com',
    },
  })
  baseUri: string = ''

  @Input()
  @String({
    title: 'Path',
    description: 'The endpoint path that will be appended to the Base URI. Should typically start with a slash (/).',
    ui: {
      placeholder: 'Example: /v1/users',
    },
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
  })
  method: HttpMethod = HttpMethod.GET

  @Input()
  @String({
    title: 'Headers',
    description: 'HTTP headers to include with your request. Enter one header per line in "Key: Value" format. Common examples: Authorization, Content-Type, Accept.',
    ui: {
      isTextArea: true,
      textareaDimensions: { width: 300, height: 80 },
      placeholder: 'Content-Type: application/json\nAuthorization: Bearer YOUR_TOKEN\nAccept: application/json',
    },
  })
  headers: string = ''

  @Input()
  @String({
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
    description: 'Format to parse the response. JSON for structured data, Text for plain text, Blob for binary files.',
    defaultValue: ResponseType.JSON,
    options: Object.values(ResponseType).map(type => ({
      id: type,
      title: type,
      type: 'string',
      defaultValue: type,
    })),
  })
  responseType: ResponseType = ResponseType.JSON

  @Input()
  @Number({
    title: 'Timeout',
    description: 'Maximum time (in milliseconds) to wait for a response before aborting the request.',
    defaultValue: 30000,
    ui: {
      min: 1000,
      max: 60000,
      step: 1000,
    },
  })
  timeout: number = 30000

  @Input()
  @Number({
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
  @Number({
    title: 'Status Code',
    description: 'HTTP response status code. 2xx indicates success, 4xx indicates client error, 5xx indicates server error.',
    defaultValue: 0,
  })
  statusCode: number = 0

  @Output()
  @String({
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
