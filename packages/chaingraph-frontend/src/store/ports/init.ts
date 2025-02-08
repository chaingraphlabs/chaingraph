import type {
  UpdatePortValueInput,
} from '@badaitech/chaingraph-backend/procedures/flow/update-port-value.ts'
import { setNodeVersion } from '@/store'
import { $activeFlowId } from '@/store/flow/stores'
import { NODE_UI_DEBOUNCE_MS } from '@/store/nodes/constants.ts'
import { accumulateAndSample } from '@/store/nodes/operators/accumulate-and-sample.ts'
import { $nodes } from '@/store/nodes/stores'
import { combine, createEffect, sample } from 'effector'
import { baseUpdatePortValueFx } from './effects'
import { requestUpdatePortValue } from './events'

export const preBaseUpdatePortValueFx = createEffect(async (params: UpdatePortValueInput) => {
  setNodeVersion({
    id: params.nodeId,
    version: params.nodeVersion,
  })
})

const throttledRequestUpdatePortValue = accumulateAndSample({
  source: [requestUpdatePortValue],
  timeout: NODE_UI_DEBOUNCE_MS,
  getKey: update => update.id,
})

/*
   Sample explanation:
   - Clock: the event requestUpdatePortValue fires with { id, value }
   - Source: combine data from $activeFlowId and $nodes
   - fn: lookup the node that contains the port with the specified id.
         Throw an error if no active flow is selected or no node is found.
   - Target: baseUpdatePortValueFx is then called with the complete payload.
*/
sample({
  clock: throttledRequestUpdatePortValue,
  source: combine({
    activeFlowId: $activeFlowId,
    nodes: $nodes,
  }),
  fn: ({ activeFlowId, nodes }, { id, value }) => {
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }
    // Search for the node that contains the port with the given id.
    // It is assumed that each node has a 'ports' property which is a Map or an object.
    const nodeEntry = Object.entries(nodes).find(([nodeId, node]) => {
      return node.ports && node.ports.has(id)
      // If node.ports is an object, you might instead use:
      // return node.ports && Object.keys(node.ports).includes(id);
    })
    if (!nodeEntry) {
      throw new Error(`Node for port id '${id}' not found`)
    }
    const [nodeId] = nodeEntry
    return {
      flowId: activeFlowId,
      nodeId,
      portId: id,
      value,
      nodeVersion: (nodes[nodeId]?.metadata.version ?? 0) + 1,
    }
  },
  target: [
    preBaseUpdatePortValueFx,
    baseUpdatePortValueFx,
  ],
})
