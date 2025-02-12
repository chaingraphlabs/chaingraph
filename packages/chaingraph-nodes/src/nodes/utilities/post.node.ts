import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  NodeExecutionStatus,
  Output,
  String,
  Number,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

type OutputValue = string | number

@Node({
  title: 'HTTP POST',
  description: 'Makes HTTP POST requests to external services',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['http', 'post', 'request', 'api'],
})
export default class HttpPostNode extends BaseNode {
  @Input()
  @String({
    title: 'Base URI',
    description: 'Base URI of the API (e.g., https://api.example.com)',
  })
  baseUri: string = ''

  @Input()
  @String({
    title: 'Method Path',
    description: 'API method path (e.g., /v1/users)',
  })
  methodPath: string = ''

  @Input()
  @String({
    title: 'Headers',
    description: 'Request headers in JSON format',
  })
  headers: string = '{}'

  @Input()
  @String({
    title: 'Request Body',
    description: 'Request body in JSON format',
  })
  requestBody: string = '{}'

  @Output()
  @Number({
    title: 'Status Code',
    description: 'HTTP response status code',
  })
  statusCode: number = 0

  @Output()
  @String({
    title: 'Response',
    description: 'Response body from the request',
  })
  response: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      const url = new URL(this.methodPath, this.baseUri)

      let headers: Record<string, string> = {}
      try {
        headers = JSON.parse(this.headers)
      } catch (e) {
        throw new Error('Invalid headers JSON format')
      }

      let body: string
      try {
        JSON.parse(this.requestBody)
        body = this.requestBody
      } catch (e) {
        throw new Error('Invalid request body JSON format')
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body,
      })

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
      this.statusCode = 500
      this.response = error.message

      return {
        status: NodeExecutionStatus.Error,
        startTime: context.startTime,
        endTime: new Date(),
        outputs: new Map<string, OutputValue>([
          ['statusCode', this.statusCode],
          ['response', this.response],
        ]),
        error: error.message,
      }
    }
  }
} 