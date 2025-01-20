// /**
//  * Serializable flow export format
//  */
// export interface FlowExport {
//   /** Flow metadata */
//   metadata: {
//     id: string
//     name: string
//     description?: string
//     version?: string
//     createdAt: string
//     updatedAt: string
//     creator?: {
//       id: string
//       name: string
//     }
//     tags?: string[]
//   }
//
//   /** Node configurations */
//   nodes: Array<{
//     id: string
//     type: string
//     position: { x: number, y: number }
//     data: Record<string, unknown>
//     metadata?: Record<string, unknown>
//   }>
//
//   /** Edge configurations */
//   edges: Array<{
//     id: string
//     sourceNodeId: string
//     sourcePortId: string
//     targetNodeId: string
//     targetPortId: string
//     metadata?: Record<string, unknown>
//   }>
//
//   /** Flow-level settings */
//   settings?: Record<string, unknown>
//
//   /** Version of the export format */
//   formatVersion: string
// }
//
// /**
//  * Flow import options
//  */
// export interface FlowImportOptions {
//   /** Validate imported data */
//   validate?: boolean
//
//   /** Preserve original IDs */
//   preserveIds?: boolean
//
//   /** Custom ID generator */
//   generateId?: () => string
//
//   /** Import settings */
//   settings?: Record<string, unknown>
// }
