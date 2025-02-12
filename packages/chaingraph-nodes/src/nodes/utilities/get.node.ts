import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  NodeExecutionStatus,
  Output,
  String,
  Number,
  PortObject,
  ObjectSchema,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

type OutputValue = string | number

@ObjectSchema({
  description: 'GET Parameters Schema',
})
class GetParameters {
  [key: string]: string
}

@Node({
  title: 'HTTP GET',
  description: 'Makes HTTP GET requests to external services',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['http', 'get', 'request', 'api'],
})
export default class HttpGetNode extends BaseNode {
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
  @PortObject({
    title: 'Parameters',
    description: 'Query parameters as key-value pairs',
    schema: GetParameters,
  })
  parameters: Record<string, string> = {}

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
      Object.entries(this.parameters).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })

      const response = await fetch(url.toString())
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