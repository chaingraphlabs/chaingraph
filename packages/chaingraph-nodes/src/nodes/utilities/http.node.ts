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
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

type OutputValue = string | number

enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  HEAD = 'HEAD',
  DELETE = 'DELETE',
}

@Node({
  title: 'HTTP Request',
  description: 'Makes HTTP requests to external services',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['http', 'request', 'api'],
})
export default class HttpRequestNode extends BaseNode {
  @Input()
  @String({
    title: 'Base URI',
    description: 'Base URI of the API (e.g., https://api.example.com)',
  })
  baseUri: string = ''

  @Input()
  @String({
    title: 'Path',
    description: 'Request path (e.g., /v1/users)',
  })
  path: string = ''

  @Input()
  @StringEnum(Object.values(HttpMethod), {
    title: 'Method',
    description: 'HTTP method to use',
    defaultValue: HttpMethod.GET,
    options: Object.values(HttpMethod).map(method => ({
      id: method,
      title: method,
      type: 'string',
      defaultValue: method
    }))
  })
  method: HttpMethod = HttpMethod.GET

  @Input()
  @String({
    title: 'Headers',
    description: 'Request headers (e.g., Content-Type: application/json)',
  })
  headers: string = ''

  @Input()
  @String({
    title: 'Body',
    description: 'Request body (any format)',
  })
  body: string = ''

  @Output()
  @Number({
    title: 'Status Code',
    description: 'HTTP response status code',
  })
  statusCode: number = 0

  @Output()
  @String({
    title: 'Response',
    description: 'Response body',
  })
  response: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      const url = new URL(this.path, this.baseUri)

      // Convert header string to object
      const headerRecord: Record<string, string> = {}
      if (this.headers.trim()) {
        const [key, ...values] = this.headers.split(':')
        if (key && values.length > 0) {
          headerRecord[key.trim()] = values.join(':').trim()
        }
      }

      const requestInit: RequestInit = {
        method: this.method,
        headers: headerRecord,
      }

      if (this.method !== HttpMethod.GET && this.method !== HttpMethod.HEAD) {
        requestInit.body = this.body
      }

      const response = await fetch(url.toString(), requestInit)
      this.statusCode = response.status
      this.response = await response.text()

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
      return {
        status: NodeExecutionStatus.Error,
        startTime: context.startTime,
        endTime: new Date(),
        outputs: new Map<string, OutputValue>([
          ['statusCode', error.status],
          ['response', error.message],
        ]),
        error: error.message,
      }
    }
  }
} 