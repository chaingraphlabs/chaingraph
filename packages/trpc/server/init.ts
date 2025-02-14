import type { CategoryMetadata } from '@badaitech/chaingraph-types'
import { getCategoriesMetadata } from '@badaitech/chaingraph-nodes'
import { AnyPortPlugin, ArrayPortPlugin, BooleanPortPlugin, EnumPortPlugin, NodeCatalog, NodeRegistry, NumberPortPlugin, ObjectPortPlugin, PortPluginRegistry, registerFlowTransformers, registerNodeTransformers, StreamPortPlugin, StringPortPlugin } from '@badaitech/chaingraph-types'
import { initializeContext } from './context'
import { CleanupService } from './executions/services/cleanup-service'
import { ExecutionService } from './executions/services/execution-service'
import { InMemoryExecutionStore } from './executions/store/execution-store'
import { InMemoryFlowStore } from './stores/flowStore/inMemoryFlowStore'

export function init() {
  PortPluginRegistry.getInstance().register(StringPortPlugin)
  PortPluginRegistry.getInstance().register(NumberPortPlugin)
  PortPluginRegistry.getInstance().register(ArrayPortPlugin)
  PortPluginRegistry.getInstance().register(ObjectPortPlugin)
  PortPluginRegistry.getInstance().register(EnumPortPlugin)
  PortPluginRegistry.getInstance().register(StreamPortPlugin)
  PortPluginRegistry.getInstance().register(AnyPortPlugin)
  PortPluginRegistry.getInstance().register(BooleanPortPlugin)

  registerNodeTransformers(NodeRegistry.getInstance())
  registerFlowTransformers()

  // Initialize stores and context
  const flowStore = new InMemoryFlowStore()
  const nodesCatalog = new NodeCatalog()
  const executionStore = new InMemoryExecutionStore()
  const executionService = new ExecutionService(executionStore)
  const executionCleanup = new CleanupService(executionStore, executionService)

  initializeContext(
    flowStore,
    NodeRegistry.getInstance(),
    nodesCatalog,
    executionService,
    executionStore,
  )

  // register categories
  getCategoriesMetadata().forEach((metadata: CategoryMetadata) => {
    nodesCatalog.registerCategory(metadata.id, metadata)
  })

  // register nodes
  NodeRegistry.getInstance().getNodeTypes().forEach((type) => {
    const node = NodeRegistry.getInstance().createNode(type, `${type}-catalog`)
    nodesCatalog.registerNode(type, node)
  })

  executionCleanup.start()
}
