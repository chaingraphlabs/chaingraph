# Resource Tree System

> Comprehensive design document for the unified resource management and drag-drop system.

## Table of Contents

1. [Overview](#overview)
2. [Goals & Requirements](#goals--requirements)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Drag & Drop System](#drag--drop-system)
8. [Context System](#context-system)
9. [Migration Plan](#migration-plan)
10. [File Reference](#file-reference)
11. [Implementation Checklist](#implementation-checklist)

---

## Overview

The Resource Tree System is a unified hierarchical resource management system that replaces the existing flow-tree component. It provides:

- **Unified tree structure** for all resource types (flows, files, MCP tools, etc.)
- **Context-aware views** (workspace, agent, team, node internals)
- **Unified drag-drop** using `@dnd-kit/core` for all drag operations
- **External drop support** (drag files from OS into the tree)
- **Canvas integration** (drag resources to flow canvas to create nodes)

### What We're Replacing

The current flow-tree system uses `@minoru/react-dnd-treeview` (which requires `react-dnd`) and only supports flows and folders. The new system:

- Uses `@dnd-kit/core` exclusively (removing `react-dnd` dependency)
- Supports multiple resource types in a single tree
- Enables dragging resources to the flow canvas to create nodes
- Supports external file drops

### Key Insight

When a resource is dropped on the canvas, it creates a corresponding node:

| Resource Type | Creates Node | Initial Values |
|---------------|--------------|----------------|
| `flow` | `SubflowNode` | `{ flowId }` |
| `file` | `FileContentNode` | `{ fileId, fileName }` |
| `mcp-tool` | `McpToolNode` | `{ serverId, toolName }` |
| `mcp-resource` | `McpResourceNode` | `{ serverId, resourceUri }` |
| `folder` | *(cannot drop)* | — |

---

## Goals & Requirements

### Must Have

- [ ] Tree view with folders and multiple resource types
- [ ] Drag items within tree to reorganize
- [ ] Drag items to canvas to create nodes
- [ ] Drop files from OS to upload and add to tree
- [ ] Context-aware filtering (show different trees per context)
- [ ] Unified `@dnd-kit` based drag-drop system

### Should Have

- [ ] Keyboard navigation (arrows, enter, delete)
- [ ] Search/filter within tree
- [ ] Multi-select for bulk operations
- [ ] Context menus for actions

### Future

- [ ] Agent/Team contexts (not just workspace)
- [ ] Node internals context (drill into node to see its resources)
- [ ] Drag from other sources (URL drop, clipboard)
- [ ] Collaborative features (shared trees)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Application                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     DndContext (@dnd-kit)                             │   │
│  │                     (Single context at app root)                      │   │
│  │                                                                       │   │
│  │  sensors: MouseSensor, TouchSensor, KeyboardSensor                    │   │
│  │  onDragStart → update Effector store                                  │   │
│  │  onDragEnd → dispatch to appropriate handler                          │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐    │
│  │   Resource Tree     │  │    Node List        │  │   Flow Canvas    │    │
│  │                     │  │                     │  │                  │    │
│  │  useDraggable()     │  │  useDraggable()     │  │  useDroppable()  │    │
│  │  useDroppable()     │  │  (existing)         │  │  (canvas target) │    │
│  │  (folders)          │  │                     │  │                  │    │
│  │                     │  │                     │  │  + XYFlow for    │    │
│  │  External drop:     │  │                     │  │    node movement │    │
│  │  onDragOver/onDrop  │  │                     │  │                  │    │
│  │  (native HTML5)     │  │                     │  │                  │    │
│  └─────────────────────┘  └─────────────────────┘  └──────────────────┘    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         DragOverlay                                   │   │
│  │                                                                       │   │
│  │  Renders preview based on active.data.current.type:                   │   │
│  │    - 'node' → NodePreview (existing)                                  │   │
│  │    - 'flow' → ResourcePreview (shows "Creates Subflow Node")          │   │
│  │    - 'file' → ResourcePreview (shows file icon + name)                │   │
│  │    - 'folder' → ResourcePreview (shows folder, "Cannot drop here")    │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           Effector Stores                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  store/resource-tree/           store/unified-dnd/                          │
│  ├── stores.ts                  ├── stores.ts                               │
│  │   $resourceItems             │   $draggedItem                            │
│  │   $folders                   │   $isDragging                             │
│  │   $currentContext            │   $canDropOnCanvas                        │
│  │   loadResourcesFx            │   $cursorStyle                            │
│  │   moveItemFx                 │                                           │
│  │   uploadFileFx               │                                           │
│  └── types.ts                   └── types.ts                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              Backend                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  packages/chaingraph-trpc/server/                                           │
│  ├── stores/resourceStore/                                                  │
│  │   ├── dbResourceStore.ts    # Extends TreeStoreBase                      │
│  │   └── types.ts              # ResourceItem, contexts                     │
│  ├── procedures/resource/                                                   │
│  │   ├── list.ts               # List resources by context                  │
│  │   ├── create-folder.ts                                                   │
│  │   ├── move.ts                                                            │
│  │   ├── delete.ts                                                          │
│  │   ├── add-flow.ts           # Add flow reference to tree                 │
│  │   └── upload-file.ts        # Upload + create resource item              │
│  └── router.ts                 # Add resourceRouter                         │
│                                                                              │
│  Database: resource_items table (see schema below)                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### New Table: `resource_items`

```sql
CREATE TABLE resource_items (
  id TEXT PRIMARY KEY,

  -- Tree structure
  parent_id TEXT REFERENCES resource_items(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,

  -- Ownership & context
  owner_id TEXT NOT NULL,
  context_type TEXT NOT NULL,  -- 'workspace' | 'agent' | 'team' | 'node'
  context_id TEXT,             -- NULL for workspace, otherwise agent/team/node ID

  -- Item type & reference
  item_type TEXT NOT NULL,     -- 'folder' | 'flow' | 'file' | 'mcp-tool' | 'mcp-resource'
  reference_id TEXT,           -- ID of actual entity (NULL for folders)

  -- Display fields (denormalized for performance)
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,

  -- Type-specific metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_resource_items_owner ON resource_items(owner_id);
CREATE INDEX idx_resource_items_parent ON resource_items(parent_id);
CREATE INDEX idx_resource_items_context ON resource_items(context_type, context_id);
CREATE INDEX idx_resource_items_reference ON resource_items(item_type, reference_id);
```

### Drizzle Schema

```typescript
// packages/chaingraph-trpc/server/stores/postgres/schema.ts

export const resourceItemsTable = pgTable('resource_items', {
  id: text('id').primaryKey(),

  // Tree structure
  parentId: text('parent_id').references((): any => resourceItemsTable.id, {
    onDelete: 'cascade',
  }),
  order: integer('order').notNull().default(0),

  // Ownership & context
  ownerId: text('owner_id').notNull(),
  contextType: text('context_type').notNull(), // 'workspace' | 'agent' | 'team' | 'node'
  contextId: text('context_id'),

  // Item type & reference
  itemType: text('item_type').notNull(), // 'folder' | 'flow' | 'file' | 'mcp-tool' | 'mcp-resource'
  referenceId: text('reference_id'),

  // Display fields
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'),
  icon: text('icon'),

  // Metadata
  metadata: jsonb('metadata').default({}),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

---

## Backend Implementation

### Types

```typescript
// packages/chaingraph-trpc/server/stores/resourceStore/types.ts

import type { ITreeNode } from '@badaitech/chaingraph-types'

export type ResourceItemType = 'folder' | 'flow' | 'file' | 'mcp-tool' | 'mcp-resource'

export type ResourceContextType = 'workspace' | 'agent' | 'team' | 'node'

export interface ResourceContext {
  type: ResourceContextType
  id?: string  // Required for agent/team/node, undefined for workspace
}

export interface ResourceItem extends ITreeNode {
  // ITreeNode provides: id, name, parentId, ownerId, order, createdAt, updatedAt

  itemType: ResourceItemType
  referenceId: string | null  // NULL for folders

  contextType: ResourceContextType
  contextId: string | null

  description?: string
  color?: string
  icon?: string

  metadata: Record<string, unknown>
}

export interface CreateResourceInput {
  name: string
  itemType: ResourceItemType
  parentId?: string | null
  referenceId?: string | null
  context: ResourceContext
  description?: string
  color?: string
  icon?: string
  metadata?: Record<string, unknown>
}

export interface MoveResourceInput {
  itemId: string
  newParentId: string | null
  newOrder: number
}
```

### Store Implementation

```typescript
// packages/chaingraph-trpc/server/stores/resourceStore/dbResourceStore.ts

import { TreeStoreBase } from '../hierarchy/TreeStoreBase'

export class DBResourceStore extends TreeStoreBase<
  ResourceItemRow,
  ResourceItem,
  CreateResourceInput,
  UpdateResourceInput
> {
  protected readonly table = resourceItemsTable

  // Implement abstract methods from TreeStoreBase
  protected mapRowToNode(row: ResourceItemRow): ResourceItem {
    return {
      id: row.id,
      name: row.name,
      parentId: row.parentId,
      ownerId: row.ownerId,
      order: row.order,
      itemType: row.itemType as ResourceItemType,
      referenceId: row.referenceId,
      contextType: row.contextType as ResourceContextType,
      contextId: row.contextId,
      description: row.description ?? undefined,
      color: row.color ?? undefined,
      icon: row.icon ?? undefined,
      metadata: row.metadata ?? {},
      createdAt: row.createdAt!,
      updatedAt: row.updatedAt!,
    }
  }

  // Context-aware listing
  async listByContext(
    ownerId: string,
    context: ResourceContext,
    parentId?: string | null,
  ): Promise<ResourceItem[]> {
    const conditions = [
      eq(this.table.ownerId, ownerId),
      eq(this.table.contextType, context.type),
    ]

    if (context.id) {
      conditions.push(eq(this.table.contextId, context.id))
    } else {
      conditions.push(isNull(this.table.contextId))
    }

    if (parentId !== undefined) {
      conditions.push(
        parentId ? eq(this.table.parentId, parentId) : isNull(this.table.parentId)
      )
    }

    const result = await this.db
      .select()
      .from(this.table)
      .where(and(...conditions))
      .orderBy(asc(this.table.order))

    return result.map(row => this.mapRowToNode(row))
  }
}
```

### tRPC Router

```typescript
// packages/chaingraph-trpc/server/procedures/resource/index.ts

import { router } from '../../trpc'
import { list } from './list'
import { createFolder } from './create-folder'
import { move } from './move'
import { remove } from './delete'
import { addFlow } from './add-flow'
import { uploadFile } from './upload-file'

export const resourceRouter = router({
  list,
  createFolder,
  move,
  delete: remove,
  addFlow,
  uploadFile,
})

// Add to main router:
// packages/chaingraph-trpc/server/router.ts
export const appRouter = router({
  // ... existing routes
  resource: resourceRouter,
})
```

---

## Frontend Implementation

### Directory Structure

```
apps/chaingraph-frontend/src/
├── components/
│   ├── resource-tree/                    # NEW - Resource tree component
│   │   ├── ResourceTree.tsx              # Main component
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── TreeItem.tsx              # Draggable item
│   │   │   ├── TreeFolder.tsx            # Draggable + droppable folder
│   │   │   ├── TreeItemIcon.tsx          # Icon by type
│   │   │   ├── TreeItemPreview.tsx       # Drag preview
│   │   │   ├── ExternalDropZone.tsx      # OS file drop handler
│   │   │   └── TreeContextMenu.tsx       # Right-click menu
│   │   └── hooks/
│   │       ├── useTreeItem.ts            # Draggable hook
│   │       ├── useTreeFolder.ts          # Drop target hook
│   │       └── useExternalDrop.ts        # Native file drop
│   │
│   ├── dnd/                              # MODIFY - Unified DnD
│   │   ├── UnifiedDndProvider.tsx        # NEW - Single DndContext
│   │   ├── DndProvider.tsx               # KEEP - Will be wrapped
│   │   └── ...
│   │
│   └── sidebar/tabs/
│       ├── flow-tree/                    # DELETE - Old component
│       └── node-list/                    # KEEP - Update to use unified DnD
│
├── store/
│   ├── resource-tree/                    # NEW - Resource tree store
│   │   ├── stores.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── unified-dnd/                      # NEW - Unified DnD state
│   │   ├── stores.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── flow-tree/                        # DELETE - Old store
│   └── drag-drop/                        # KEEP - Internal canvas DnD
```

### Effector Store: Resource Tree

```typescript
// apps/chaingraph-frontend/src/store/resource-tree/stores.ts

import { combine, sample } from 'effector'
import { resourceTreeDomain } from '../domains'
import { $trpcClient } from '../trpc/store'
import type { ResourceItem, ResourceContext } from './types'

// ===== EVENTS =====
export const loadResources = resourceTreeDomain.createEvent<ResourceContext>()
export const createFolder = resourceTreeDomain.createEvent<CreateFolderInput>()
export const moveItem = resourceTreeDomain.createEvent<MoveItemInput>()
export const deleteItem = resourceTreeDomain.createEvent<string>()
export const uploadFiles = resourceTreeDomain.createEvent<{
  files: File[]
  parentId: string | null
}>()
export const setCurrentContext = resourceTreeDomain.createEvent<ResourceContext>()

// ===== EFFECTS =====
export const loadResourcesFx = resourceTreeDomain.createEffect(
  async (context: ResourceContext) => {
    const client = $trpcClient.getState()
    if (!client) throw new Error('TRPC client not initialized')
    return client.resource.list.query({ context })
  }
)

export const createFolderFx = resourceTreeDomain.createEffect(
  async (input: CreateFolderInput) => {
    const client = $trpcClient.getState()
    if (!client) throw new Error('TRPC client not initialized')
    return client.resource.createFolder.mutate(input)
  }
)

export const moveItemFx = resourceTreeDomain.createEffect(
  async (input: MoveItemInput) => {
    const client = $trpcClient.getState()
    if (!client) throw new Error('TRPC client not initialized')
    return client.resource.move.mutate(input)
  }
)

export const uploadFilesFx = resourceTreeDomain.createEffect(
  async ({ files, parentId, context }: UploadFilesInput) => {
    const client = $trpcClient.getState()
    if (!client) throw new Error('TRPC client not initialized')

    const results = []
    for (const file of files) {
      const result = await client.resource.uploadFile.mutate({
        file,
        parentId,
        context,
      })
      results.push(result)
    }
    return results
  }
)

// ===== STORES =====
export const $currentContext = resourceTreeDomain.createStore<ResourceContext>({
  type: 'workspace',
})
  .on(setCurrentContext, (_, context) => context)

export const $resourceItems = resourceTreeDomain.createStore<ResourceItem[]>([])
  .on(loadResourcesFx.doneData, (_, items) => items)
  .on(createFolderFx.doneData, (items, newItem) => [...items, newItem])
  .on(moveItemFx.doneData, (items, moved) =>
    items.map(item => item.id === moved.id ? moved : item)
  )
  .on(uploadFilesFx.doneData, (items, newItems) => [...items, ...newItems])

export const $isLoading = resourceTreeDomain.createStore(false)
  .on(loadResourcesFx.pending, (_, pending) => pending)

export const $error = resourceTreeDomain.createStore<Error | null>(null)
  .on(loadResourcesFx.failData, (_, error) => error)
  .reset(loadResourcesFx.done)

// ===== DERIVED =====
export const $folders = $resourceItems.map(items =>
  items.filter(item => item.itemType === 'folder')
)

export const $treeStructure = combine($resourceItems, (items) => {
  // Build nested tree structure for rendering
  return buildTree(items)
})

// ===== SAMPLES =====
sample({
  clock: loadResources,
  target: loadResourcesFx,
})

sample({
  clock: createFolder,
  target: createFolderFx,
})

sample({
  clock: moveItem,
  target: moveItemFx,
})

// Reload after successful operations
sample({
  clock: [createFolderFx.done, moveItemFx.done, uploadFilesFx.done],
  source: $currentContext,
  target: loadResourcesFx,
})
```

### Effector Store: Unified DnD

```typescript
// apps/chaingraph-frontend/src/store/unified-dnd/stores.ts

import { combine } from 'effector'
import { unifiedDndDomain } from '../domains'
import type { DragItemType, DragItem } from './types'

// ===== TYPES =====
export type DragItemType = 'node' | 'flow' | 'file' | 'folder' | 'mcp-tool' | 'mcp-resource'

export interface DragItem<T = unknown> {
  type: DragItemType
  id: string
  data: T
  canvasNodeType: string | null  // What node to create when dropped on canvas
}

// What node type to create for each drag item type
export const ITEM_TO_NODE_TYPE: Record<DragItemType, string | null> = {
  'node': null,          // Node type comes from data
  'flow': 'SubflowNode',
  'file': 'FileContentNode',
  'folder': null,        // Cannot drop on canvas
  'mcp-tool': 'McpToolNode',
  'mcp-resource': 'McpResourceNode',
}

// ===== EVENTS =====
export const setDraggedItem = unifiedDndDomain.createEvent<DragItem | null>()
export const setIsOverCanvas = unifiedDndDomain.createEvent<boolean>()

// ===== STORES =====
export const $draggedItem = unifiedDndDomain.createStore<DragItem | null>(null)
  .on(setDraggedItem, (_, item) => item)

export const $isOverCanvas = unifiedDndDomain.createStore(false)
  .on(setIsOverCanvas, (_, isOver) => isOver)
  .reset(setDraggedItem.filter({ fn: item => item === null }))

// ===== DERIVED =====
export const $isDragging = $draggedItem.map(item => item !== null)

export const $canDropOnCanvas = combine(
  $draggedItem,
  $isOverCanvas,
  (item, isOver) => {
    if (!item || !isOver) return false
    return item.canvasNodeType !== null
  }
)

export const $cursorStyle = combine(
  $isDragging,
  $isOverCanvas,
  $canDropOnCanvas,
  (isDragging, isOver, canDrop) => {
    if (!isDragging) return 'default'
    if (!isOver) return 'grabbing'
    return canDrop ? 'copy' : 'not-allowed'
  }
)
```

---

## Drag & Drop System

### Unified DndContext

```typescript
// apps/chaingraph-frontend/src/components/dnd/UnifiedDndProvider.tsx

import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { useUnit } from 'effector-react'
import {
  $draggedItem,
  setDraggedItem,
  setIsOverCanvas,
  ITEM_TO_NODE_TYPE,
} from '@/store/unified-dnd'
import { addNodeToFlow } from '@/store/nodes'
import { moveItem } from '@/store/resource-tree'

export function UnifiedDndProvider({ children }: { children: React.ReactNode }) {
  const draggedItem = useUnit($draggedItem)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current
    if (!data) return

    setDraggedItem({
      type: data.type,
      id: event.active.id as string,
      data: data.payload,
      canvasNodeType: data.type === 'node'
        ? data.payload.nodeType
        : ITEM_TO_NODE_TYPE[data.type as DragItemType],
    })
  }

  const handleDragOver = (event: DragOverEvent) => {
    const isOverCanvas = event.over?.id === 'flow-canvas'
    setIsOverCanvas(isOverCanvas)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    try {
      if (!over) return

      const itemData = active.data.current
      if (!itemData) return

      const targetId = over.id as string

      // === CANVAS DROP ===
      if (targetId === 'flow-canvas') {
        handleCanvasDrop(itemData, event)
        return
      }

      // === TREE FOLDER DROP ===
      if (targetId.startsWith('folder:')) {
        const folderId = targetId.replace('folder:', '')
        handleTreeDrop(active.id as string, folderId)
        return
      }

      // === TREE ROOT DROP ===
      if (targetId === 'tree-root') {
        handleTreeDrop(active.id as string, null)
        return
      }
    } finally {
      // Always clear drag state
      setDraggedItem(null)
    }
  }

  const handleCanvasDrop = (itemData: any, event: DragEndEvent) => {
    const nodeType = itemData.type === 'node'
      ? itemData.payload.nodeType
      : ITEM_TO_NODE_TYPE[itemData.type as DragItemType]

    if (!nodeType) return  // Cannot create node from this type

    const position = calculateCanvasPosition(event)

    addNodeToFlow({
      nodeType,
      position,
      initialValues: getInitialValues(itemData),
    })
  }

  const handleTreeDrop = (itemId: string, newParentId: string | null) => {
    moveItem({
      itemId,
      newParentId,
      newOrder: 0,  // Will be calculated server-side
    })
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {children}

      <DragOverlay dropAnimation={null}>
        {draggedItem && <DragPreview item={draggedItem} />}
      </DragOverlay>
    </DndContext>
  )
}
```

### Canvas Drop Target

```typescript
// apps/chaingraph-frontend/src/components/flow/Flow.tsx

import { useDroppable } from '@dnd-kit/core'

export function Flow() {
  const { setNodeRef, isOver } = useDroppable({
    id: 'flow-canvas',
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flow-canvas',
        isOver && 'ring-2 ring-primary ring-inset',
      )}
    >
      <ReactFlow>
        {/* ... existing implementation */}
      </ReactFlow>
    </div>
  )
}
```

---

## Context System

The resource tree supports multiple contexts that determine what resources are shown:

### Context Types

| Context | Use Case | contextId |
|---------|----------|-----------|
| `workspace` | User's main workspace, default view | `null` |
| `agent` | Resources scoped to an agent | Agent ID |
| `team` | Shared team resources | Team ID |
| `node` | Node's internal resources (future) | Node ID |

### How Context Works

```typescript
// User's workspace (default)
const workspaceContext: ResourceContext = { type: 'workspace' }

// Agent's resources
const agentContext: ResourceContext = { type: 'agent', id: 'agent_123' }

// Query
const items = await resourceStore.listByContext(userId, agentContext)
// Returns only items where contextType='agent' AND contextId='agent_123'
```

### Context Switching in UI

```typescript
// When user navigates to an agent
setCurrentContext({ type: 'agent', id: agentId })
// Triggers reload of resource tree for that agent

// When user returns to main workspace
setCurrentContext({ type: 'workspace' })
```

---

## Migration Plan

### Phase 1: Foundation

1. [ ] Create database migration for `resource_items` table
2. [ ] Implement `DBResourceStore` extending `TreeStoreBase`
3. [ ] Create tRPC `resourceRouter` with basic CRUD
4. [ ] Create Effector store for resources

### Phase 2: Frontend Tree

1. [ ] Create `ResourceTree` component with @dnd-kit
2. [ ] Implement `TreeItem` (draggable)
3. [ ] Implement `TreeFolder` (draggable + droppable)
4. [ ] Implement `ExternalDropZone` for file drops
5. [ ] Create `TreeItemPreview` for drag overlay

### Phase 3: Unified DnD

1. [ ] Create `UnifiedDndProvider` wrapping app
2. [ ] Create unified DnD Effector store
3. [ ] Add `useDroppable` to canvas
4. [ ] Implement canvas drop handling

### Phase 4: Node Types

1. [ ] Create `SubflowNode` (placeholder execution)
2. [ ] Create `FileContentNode` (placeholder)
3. [ ] Create `McpToolNode` (placeholder)
4. [ ] Create `McpResourceNode` (placeholder)

### Phase 5: Integration & Cleanup

1. [ ] Migrate existing flows to resource items
2. [ ] Update `NodeList` to use unified DnD
3. [ ] Delete old `flow-tree/` component
4. [ ] Delete old `folderStore/` and procedures
5. [ ] Remove `react-dnd` dependencies

---

## File Reference

### Files to Create

| File | Purpose |
|------|---------|
| `packages/chaingraph-trpc/drizzle/XXXX_resource_items.sql` | Migration |
| `packages/chaingraph-trpc/server/stores/postgres/schema.ts` | Add table |
| `packages/chaingraph-trpc/server/stores/resourceStore/` | Store |
| `packages/chaingraph-trpc/server/procedures/resource/` | Procedures |
| `packages/chaingraph-nodes/src/nodes/flow/subflow.node.ts` | SubflowNode |
| `apps/chaingraph-frontend/src/store/resource-tree/` | Effector store |
| `apps/chaingraph-frontend/src/store/unified-dnd/` | DnD store |
| `apps/chaingraph-frontend/src/components/resource-tree/` | Component |
| `apps/chaingraph-frontend/src/components/dnd/UnifiedDndProvider.tsx` | DnD context |

### Files to Modify

| File | Change |
|------|--------|
| `packages/chaingraph-trpc/server/router.ts` | Add resourceRouter |
| `packages/chaingraph-trpc/server/context.ts` | Add resourceStore |
| `apps/chaingraph-frontend/src/providers/RootProvider.tsx` | Wrap with UnifiedDndProvider |
| `apps/chaingraph-frontend/src/components/flow/Flow.tsx` | Add useDroppable |
| `apps/chaingraph-frontend/src/components/sidebar/Sidebar.tsx` | Use ResourceTree |

### Files to Delete

| File | Reason |
|------|--------|
| `apps/chaingraph-frontend/src/store/flow-tree/` | Replaced |
| `apps/chaingraph-frontend/src/components/sidebar/tabs/flow-tree/` | Replaced |
| `packages/chaingraph-trpc/server/stores/folderStore/` | Replaced |
| `packages/chaingraph-trpc/server/procedures/folder/` | Replaced |

### Existing Files for Reference

| File | What to Learn |
|------|---------------|
| `packages/chaingraph-trpc/server/stores/hierarchy/TreeStoreBase.ts` | Tree operations pattern |
| `packages/chaingraph-types/src/hierarchy/types.ts` | ITreeNode interface |
| `apps/chaingraph-frontend/src/components/dnd/DndProvider.tsx` | Current @dnd-kit setup |
| `apps/chaingraph-frontend/src/components/sidebar/tabs/node-list/NodeCard.tsx` | useDraggable pattern |
| `apps/chaingraph-frontend/src/components/flow/hooks/useNodeDrop.ts` | Canvas drop handling |
| `packages/chaingraph-nodes/src/nodes/flow/emitter.node.ts` | Node definition pattern |

---

## Implementation Checklist

Use this checklist to track progress:

### Database & Backend

- [ ] Create `resource_items` migration
- [ ] Add `resourceItemsTable` to schema.ts
- [ ] Create `DBResourceStore` class
- [ ] Create `resourceStore/types.ts`
- [ ] Create `resource/list.ts` procedure
- [ ] Create `resource/create-folder.ts` procedure
- [ ] Create `resource/move.ts` procedure
- [ ] Create `resource/delete.ts` procedure
- [ ] Create `resource/add-flow.ts` procedure
- [ ] Create `resource/upload-file.ts` procedure (stub)
- [ ] Add `resourceRouter` to main router
- [ ] Add `resourceStore` to context

### Node Types

- [ ] Create `SubflowNode` in chaingraph-nodes
- [ ] Create `FileContentNode` (stub)
- [ ] Export from nodes index

### Frontend Store

- [ ] Create `store/resource-tree/types.ts`
- [ ] Create `store/resource-tree/stores.ts`
- [ ] Create `store/unified-dnd/types.ts`
- [ ] Create `store/unified-dnd/stores.ts`
- [ ] Add domains to `store/domains.ts`

### Frontend Components

- [ ] Create `UnifiedDndProvider.tsx`
- [ ] Create `ResourceTree.tsx`
- [ ] Create `TreeItem.tsx`
- [ ] Create `TreeFolder.tsx`
- [ ] Create `TreeItemIcon.tsx`
- [ ] Create `TreeItemPreview.tsx`
- [ ] Create `ExternalDropZone.tsx`
- [ ] Create `TreeContextMenu.tsx`

### Integration

- [ ] Wrap app with `UnifiedDndProvider`
- [ ] Add `useDroppable` to Flow canvas
- [ ] Replace flow-tree with ResourceTree in Sidebar
- [ ] Update NodeList to work with unified DnD

### Cleanup

- [ ] Delete `store/flow-tree/`
- [ ] Delete `components/sidebar/tabs/flow-tree/`
- [ ] Remove react-dnd from package.json
- [ ] Remove @minoru/react-dnd-treeview from package.json
- [ ] Delete old folder procedures and store

---

## Notes

### Why @dnd-kit over react-dnd?

1. **Modern API** - Hooks-based, better TypeScript support
2. **Active maintenance** - Regular updates
3. **Flexible** - Supports multiple sensors (mouse, touch, keyboard)
4. **Accessible** - Built-in accessibility features
5. **Already used** - Node list already uses it

### Why Single DndContext?

Having multiple DnD contexts (one for tree, one for canvas) creates complexity:
- Can't drag between contexts
- State synchronization issues
- Multiple overlays

Single context means:
- Drag from anywhere, drop anywhere
- One source of truth
- One overlay to manage

### Why Effector for DnD State?

- Reactive - components auto-update
- Derived stores - compute `canDrop`, `cursorStyle` automatically
- Testable - can test store logic independently
- Already used - consistent with app patterns
