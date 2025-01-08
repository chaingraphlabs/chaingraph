// import type { ExecutionContext, NodeExecutionResult } from '@chaingraph/types/node'
// import { BaseNode, Node, Port } from '@chaingraph/types/node'
// import { PortDirectionEnum, PortKindEnum } from '@chaingraph/types/port'
// import 'reflect-metadata'
//
// @Node({
//   title: 'DataTransformNode',
//   category: 'Data Processing',
//   description: 'Transforms input data and produces output data.',
// })
// export class DataTransformNode extends BaseNode {
//   @Port({
//     id: 'inputData',
//     title: 'Input Data',
//     kind: PortKindEnum.Object,
//     direction: PortDirectionEnum.Input,
//     metadata: {
//       description: 'Data to be transformed.',
//     },
//     schema: {
//       properties: {
//         // Define input schema properties
//       },
//     },
//   })
//   inputData: any
//
//   @Port({
//     id: 'outputData',
//     title: 'Output Data',
//     kind: PortKindEnum.Object,
//     direction: PortDirectionEnum.Output,
//     metadata: {
//       description: 'Transformed data output.',
//     },
//     schema: {
//       properties: {
//         // Define output schema properties
//       },
//     },
//   })
//   outputData: any
//
//   constructor(id: string) {
//     super(id)
//   }
//
//   async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
//     this.status = 'executing'
//     this.emit('execution-start', {
//       nodeId: this.id,
//       timestamp: new Date(),
//       type: 'execution-start',
//     })
//
//     const startTime = new Date()
//     try {
//       // Transform data
//       const inputData = this.inputData
//       const transformedData = this.transformData(inputData)
//
//       // Set output
//       this.outputData = transformedData
//
//       const endTime = new Date()
//       this.status = 'completed'
//       const result: NodeExecutionResult = {
//         status: 'completed',
//         startTime,
//         endTime,
//         outputs: new Map([['outputData', transformedData]]),
//       }
//
//       this.emit('execution-complete', {
//         nodeId: this.id,
//         timestamp: new Date(),
//         type: 'execution-complete',
//         result,
//       })
//
//       return result
//     } catch (error) {
//       this.status = 'error'
//       const endTime = new Date()
//       const result: NodeExecutionResult = {
//         status: 'error',
//         startTime,
//         endTime,
//         outputs: new Map(),
//         error: error as Error,
//       }
//
//       this.emit('error', {
//         nodeId: this.id,
//         timestamp: new Date(),
//         type: 'error',
//         error: error as Error,
//       })
//
//       return result
//     }
//   }
//
//   private transformData(data: any): any {
//     // Implement your data transformation logic here
//     return data // For demonstration, return data as is
//   }
// }
