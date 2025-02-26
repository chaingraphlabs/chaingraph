import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  NodeExecutionStatus,
  Output,
  String,
  Number,
  StringEnum,
  PortArray,
  Boolean,
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
  BLOB = 'blob'
}

@Node({
  title: 'HTTP Request',
  description: 'Makes HTTP requests to external services',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['http', 'request', 'api'],
  metadata: {
    hideHeadersForMethods: [HttpMethod.GET, HttpMethod.HEAD],
    hideBodyForMethods: [HttpMethod.GET, HttpMethod.HEAD, HttpMethod.DELETE]
  }
})
export default class HttpRequestNode extends BaseNode {
  @Input()
  @String({
    title: 'Base URI',
    description: 'Base URI of the API',
    ui: {
      placeholder: 'https://api.example.com',
      bgColor: '#f0f9ff',
      borderColor: '#3b82f6'
    }
  })
  baseUri: string = ''

  @Input()
  @String({
    title: 'Path',
    description: 'Request path',
    ui: {
      placeholder: '/v1/users',
      bgColor: '#f0f9ff'
    }
  })
  path: string = ''

  @Input()
  @StringEnum(Object.values(HttpMethod), {
    title: 'Method',
    description: 'HTTP method',
    defaultValue: HttpMethod.GET,
    options: Object.values(HttpMethod).map(method => ({
      id: method,
      title: method,
      type: 'string',
      defaultValue: method
    })),
    ui: {
      bgColor: '#fef3c7',  // Light yellow for method
      borderColor: '#d97706'
    }
  })
  method: HttpMethod = HttpMethod.GET

  @Input()
  @String({
    title: 'Headers',
    description: 'Request headers (one per line)',
    ui: {
      isTextArea: true,
      textareaDimensions: { height: 80 },
      placeholder: 'Content-Type: application/json\nAuthorization: Bearer token'
    }
  })
  headers: string = ''

  @Input()
  @String({
    title: 'Body',
    description: 'Request body',
    ui: {
      isTextArea: true,
      textareaDimensions: { height: 120 },
      placeholder: '{\n  "key": "value"\n}',
      hidden: true  // Static boolean value
    }
  })
  body: string = ''

  @Input()
  @Boolean({
    title: 'Requires Authentication',
    description: 'Toggle if request needs auth headers',
    defaultValue: false,
    ui: {
      hidePort: true  // No need for connection
    }
  })
  requiresAuth: boolean = false

  @Input()
  @StringEnum(Object.values(ResponseType), {
    title: 'Response Type',
    description: 'How to parse the response',
    defaultValue: ResponseType.JSON,
    options: Object.values(ResponseType).map(type => ({
      id: type,
      title: type,
      type: 'string',
      defaultValue: type
    }))
  })
  responseType: ResponseType = ResponseType.JSON

  @Input()
  @Number({
    title: 'Timeout',
    description: 'Request timeout in milliseconds',
    defaultValue: 30000,
    ui: {
      min: 1000,
      max: 60000,
      step: 1000
    }
  })
  timeout: number = 30000

  @Input()
  @Number({
    title: 'Retries',
    description: 'Number of retry attempts',
    defaultValue: 0,
    ui: {
      min: 0,
      max: 3,
      step: 1
    }
  })
  retries: number = 0

  @Output()
  @Number({
    title: 'Status Code',
    description: 'HTTP response status code',
    ui: {
      hidePort: false
    },
    defaultValue: 0
  })
  statusCode: number = 0

  @Output()
  @String({
    title: 'Response',
    description: 'Response body',
    ui: {
      hidePort: false
    },
    defaultValue: ''
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
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        return response
      } catch (error: any) {
        lastError = error
        if (attempt < this.retries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }
    
    throw lastError || new Error('Request failed after retries')
  }

  private async parseResponse(response: Response): Promise<string> {
    try {
      switch (this.responseType) {
        case ResponseType.JSON:
          const json = await response.json()
          return JSON.stringify(json, null, 2)
        case ResponseType.TEXT:
          return response.text()
        case ResponseType.BLOB:
          const blob = await response.blob()
          return `Blob: ${blob.type}, ${blob.size} bytes`
        default:
          return response.text()
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
    if (!headers?.trim()) return headerRecord

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
    if (!body?.trim()) return ''

    const contentType = headers['Content-Type']?.toLowerCase() || headers['content-type']?.toLowerCase()

    if (contentType?.includes('application/json')) {
      try {
        // Validate and format JSON
        const parsed = JSON.parse(body)
        return JSON.stringify(parsed, null, 2)
      } catch (e) {
        throw new Error(`Invalid JSON body: ${(e as Error).message}`)
      }
    }

    if (contentType?.includes('application/x-www-form-urlencoded')) {
      try {
        // Validate form data format
        new URLSearchParams(body)
      } catch (e) {
        throw new Error(`Invalid form data body: ${(e as Error).message}`)
      }
    }

    return body
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
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

      console.log('HTTP Request:', {
        url: url.toString(),
        method: this.method,
        headers: headerRecord,
        body: requestInit.body,
        responseType: this.responseType,
        status: this.statusCode
      })

      return {
        status: NodeExecutionStatus.Completed,
        startTime: context.startTime,
        endTime: new Date(),
        outputs: new Map<string, OutputValue>([
          ['statusCode', this.statusCode],
          ['response', this.response],
        ]),
      }
    } catch (error: any) {
      console.error('HTTP Request Error:', error)
      return {
        status: NodeExecutionStatus.Error,
        startTime: context.startTime,
        endTime: new Date(),
        error: error.message,
        outputs: new Map([
          ['statusCode', 0],
          ['response', error.message]
        ])
      }
    }
  }
} 