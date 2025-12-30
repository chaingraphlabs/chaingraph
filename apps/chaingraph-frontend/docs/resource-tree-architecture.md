# Resource Tree System - Comprehensive Architecture

> Complete architecture documentation for the unified resource management system

## Table of Contents

1. [Overview](#overview)
2. [Mental Model](#mental-model)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Drag & Drop System](#drag--drop-system)
6. [Data Flow](#data-flow)
7. [Context System](#context-system)
8. [Features](#features)
9. [Future Enhancements](#future-enhancements)

---

## Overview

The Resource Tree System is a **unified hierarchical resource management system** that replaces the old flow-tree. It provides a single tree interface for organizing multiple resource types (folders, flows, files, and future: MCP tools, MCP resources).

### Core Capabilities

**Implemented:**
- Hierarchical folder organization with unlimited nesting
- Multi-resource support (folders, flows, files)
- Drag-and-drop reorganization within tree
- Drag-from-tree-to-canvas creates nodes (SubflowNode, FileNode)
- Context-aware backend (workspace/agent/team/node scopes)
- External file drops from OS
- Full CRUD operations with type-safe API

**Planned:**
- MCP tool/resource integration
- Multi-root contexts (agent workspaces, team workspaces)
- Node internals view (drill into node to see its resources)
- Collaborative features (shared trees, permissions)
- Search and filtering
- Bulk operations

---

## Mental Model

### What is a Resource?

A **resource** is any organizational or content item in the system:

| Type | Purpose | Has Children? | Can Drag to Canvas? | Creates Node |
|------|---------|---------------|---------------------|--------------|
| **Folder** | Organizes other resources | Yes | No | - |
| **Flow** | References an executable flow | No | Yes | SubflowNode |
| **File** | References a file (hash-based) | No | Yes | FileNode |
| **MCP Tool** | References an MCP tool (future) | No | Yes | McpToolNode |
| **MCP Resource** | References an MCP resource (future) | No | Yes | McpResourceNode |

### Tree Structure

```
Workspace Root
├─ 📁 Projects
│  ├─ 📁 Project A
│  │  ├─ 📋 Main Flow
│  │  ├─ 📋 Helper Flow
│  │  └─ 📄 config.json
│  └─ 📁 Project B
│     └─ 📋 Pipeline
├─ 📁 Templates
│  ├─ 📋 Template 1
│  └─ 📋 Template 2
└─ 📄 global-settings.yaml
```

### Resource vs Entity

- **ResourceItem**: The tree node (has name, parentId, order, color)
- **Entity**: The actual data (Flow, File content)
- **referenceId**: Links ResourceItem → Entity

Example: A flow resource with name "My Pipeline" references flow ID "abc123" via `referenceId`.

---

## Backend Architecture

### Database Schema

**Table: `resource_items`**

```sql
CREATE TABLE resource_items (
  -- Tree structure
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES resource_items(id) ON DELETE CASCADE,
  "order" INTEGER DEFAULT 0,

  -- Ownership & context
  owner_id TEXT NOT NULL,
  context_type TEXT NOT NULL DEFAULT 'workspace',
  context_id TEXT,

  -- Resource type
  item_type TEXT NOT NULL,  -- 'folder' | 'flow' | 'file'
  reference_id TEXT,        -- NULL for folders

  -- Display
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `owner_id` - Efficiently query user's resources
- `parent_id` - Fetch children
- `(context_type, context_id)` - Filter by context
- `(parent_id, order)` - Ordered siblings
- `(item_type, reference_id)` - Lookup by entity

### Backend Store (DBResourceStore)

**Location:** `packages/chaingraph-trpc/server/stores/resourceStore/dbResourceStore.ts`

**Operations:**
- `create(input, ownerId)` - Creates new resource with auto-incrementing order
- `get(id)` - Fetches single resource
- `update(input)` - Updates name, description, color, metadata
- `delete(id)` - Cascades to children
- `move(input)` - Moves with circular reference prevention
- `listByContext(ownerId, context, parentId?)` - Context-aware listing
- `getDescendantIds(rootId, ownerId)` - Recursive traversal

**Key Feature:** Context isolation - resources in different contexts never intermix.

### tRPC API

**Router:** `resource`

| Procedure | Type | Purpose |
|-----------|------|---------|
| `list` | query | List resources by context |
| `createFolder` | mutation | Create folder resource |
| `createFlowResource` | mutation | Create resource referencing a flow |
| `move` | mutation | Move resource to new parent/order |
| `delete` | mutation | Delete resource (cascades) |
| `rename` | mutation | Update resource metadata |
| `uploadFile` | mutation | Upload file, create resource |

**Security:** All procedures validate ownership before operations.

---

## Frontend Architecture

### Effector Store Layer

#### Resource Tree Store

**Location:** `apps/chaingraph-frontend/src/store/resource-tree/stores.ts`

**Stores:**
- `$currentContext` - Active context (workspace/agent/team/node)
- `$resourceItems` - All resources for current context
- `$treeStructure` - Nested tree structure (derived)
- `$folders`, `$flowResources`, `$fileResources` - Filtered views
- `$expandedIds` - UI expansion state
- `$selectedId` - Currently selected item
- `$searchQuery` - Search filter

**Events:**
- `loadResources()` - Trigger fetch
- `setCurrentContext(context)` - Switch context
- `createFolder(input)` - Create folder
- `createFlowResource(input)` - Add flow to tree
- `renameResource(input)` - Update metadata
- `deleteResource(id)` - Delete resource
- `moveResource(input)` - Reorganize
- `uploadFile(input)` - Upload file
- `toggleExpanded(id)` - Expand/collapse folder

**Effects:**
All effects call tRPC procedures and update stores on success.

#### Unified DnD Store

**Location:** `apps/chaingraph-frontend/src/store/unified-dnd/stores.ts`

**Purpose:** Track drag state across all draggable sources (NodeList, ResourceTree)

**Stores:**
- `$draggedItem` - Currently dragged item (type + payload)
- `$isOverCanvas` - Whether dragging over flow canvas
- `$canDropOnCanvas` - Whether current item can create node
- `$cursorStyle` - Cursor feedback (grabbing/copy/not-allowed)
- `$dragOverlayInfo` - Data for drag preview

**Node Type Mapping:**
```typescript
ITEM_TO_NODE_TYPE = {
  'node': null,       // Type from payload
  'flow': 'SubflowNode',
  'file': 'FileNode',
  'folder': null,     // Cannot drop
}
```

### Component Hierarchy

```
ResourceTree (main container)
├─ TreeHeader (search + create actions)
│  ├─ Search Input
│  └─ Create Dropdown (New Folder, New Flow)
├─ Tree Content (scrollable)
│  ├─ TreeFolder (recursive, draggable + droppable)
│  │  ├─ TreeContextMenu (right-click actions)
│  │  ├─ Expand/collapse button
│  │  ├─ Icon + Name
│  │  └─ Children (folders and entities)
│  └─ TreeItem (draggable, for flows/files)
│     ├─ TreeContextMenu
│     ├─ Icon + Name
│     └─ Metadata (date, size, etc.)
├─ FolderForm (modal overlay)
├─ FlowForm (modal overlay)
└─ DeleteConfirmDialog (modal)
```

### Component Responsibilities

**ResourceTree:**
- Renders tree structure
- Manages modal state (forms, dialogs)
- Loads resources on mount
- Provides action handlers to children

**TreeFolder:**
- Draggable within tree (reorganize)
- Droppable for other resources (accepts children)
- Droppable for external files (OS file system)
- Smooth expand/collapse animations
- Tracks hover state for drop feedback

**TreeItem:**
- Draggable to canvas (creates nodes)
- Draggable within tree (reorganize)
- Shows metadata (updated date, file size)

**TreeContextMenu:**
- Generic wrapper for all tree items
- Shows different menu items based on item type
- Handles: create, rename, delete, open

---

## Drag & Drop System

### Unified @dnd-kit Architecture

**Single DndContext** at app root handles all drag operations.

### Drag Sources

| Source | ID Format | Data Format |
|--------|-----------|-------------|
| NodeList | `{nodeType}` | `{ type: 'node', payload: { node, categoryMetadata, portsConfig } }` |
| ResourceTree Folder | `resource:{id}` | `{ type: 'folder', payload: ResourceItem }` |
| ResourceTree Flow | `resource:{id}` | `{ type: 'flow', payload: ResourceItem }` |
| ResourceTree File | `resource:{id}` | `{ type: 'file', payload: ResourceItem }` |

### Drop Targets

| Target | ID | Accepts | Action |
|--------|-----|---------|--------|
| Flow Canvas | `flow-canvas` | nodes, flows, files | Creates node |
| Tree Folder | `folder:{id}` | folders, flows, files | Moves resource |
| Tree Root | `tree-root` | folders, flows, files | Moves to root |

### External Files (OS → Browser)

**Separate from @dnd-kit:**
- Uses native HTML5 drag events (`onDragOver`, `onDrop`)
- Handled individually by each TreeFolder
- Reads file content as base64
- Calculates SHA-256 hash
- Creates file resource in target folder

**Why separate?** External files use browser's native DataTransfer API, which @dnd-kit doesn't support.

---

## Data Flow

### Creating a Folder

```
User clicks "Create New" → "New Folder"
  ↓
TreeHeader: setShowFolderForm(true)
  ↓
FolderForm renders
  ↓
User fills form, clicks "Create"
  ↓
createFolder({ name, description, color, context })  [Event]
  ↓
createFolderFx effect runs  [Effect]
  ↓
client.resource.createFolder.mutate(input)  [tRPC]
  ↓
Backend: DBResourceStore.create()
  ↓
Database: INSERT INTO resource_items
  ↓
Response: ResourceItem
  ↓
Store: $resourceItems updated
  ↓
Derived: $treeStructure recomputed
  ↓
UI: Tree re-renders with new folder
```

### Dragging Flow to Canvas

```
User drags flow from tree
  ↓
useDraggable triggers → onDragStart
  ↓
UnifiedDndProvider: setDraggedItem({ type: 'flow', payload })
  ↓
DragOverlay: shows ResourcePreview
  ↓
User drops on canvas
  ↓
useDroppable detects → onDragEnd (target: 'flow-canvas')
  ↓
UnifiedDndProvider: handleCanvasDrop()
  ↓
Determines nodeType = ITEM_TO_NODE_TYPE['flow'] = 'SubflowNode'
  ↓
screenToFlowPosition() converts coordinates
  ↓
addNodeToFlow({ flowId, nodeType: 'SubflowNode', position, metadata })  [Event]
  ↓
addNodeToFlowFx effect runs  [Effect]
  ↓
client.flow.addNode.mutate()  [tRPC]
  ↓
Backend: Creates SubflowNode with flowId port set to payload.referenceId
  ↓
Response: Updated flow with new node
  ↓
Store: $nodes updated
  ↓
UI: Canvas shows new SubflowNode
```

### Uploading File from OS

```
User drags file.pdf from Finder/Explorer
  ↓
Hovers over a folder in tree
  ↓
TreeFolder: handleExternalDragOver()
  ↓
Checks e.dataTransfer.types.includes('Files')
  ↓
Prevents default, shows visual highlight
  ↓
User drops file
  ↓
TreeFolder: handleExternalDrop()
  ↓
Reads file as base64 via FileReader
  ↓
uploadFile({ content, name, mimeType, size, parentId })  [Event]
  ↓
uploadFileFx effect runs  [Effect]
  ↓
client.resource.uploadFile.mutate()  [tRPC]
  ↓
Backend: Calculates SHA-256 hash of content
  ↓
Backend: Creates ResourceItem with referenceId = hash
  ↓
Response: { fileId: hash, resource }
  ↓
Store: $resourceItems updated
  ↓
UI: File appears in folder
```

---

## Context System

### What are Contexts?

Contexts enable **multi-root trees** - different users/agents/teams can have isolated resource trees.

### Context Types

| Type | Use Case | contextId | Example |
|------|----------|-----------|---------|
| `workspace` | User's main workspace | `null` | Personal project organization |
| `agent` | Agent-specific resources | Agent ID | LLM agent's tools and flows |
| `team` | Shared team resources | Team ID | Collaborative workspace |
| `node` | Node internals (future) | Node ID | Files/flows inside a SubflowNode |

### How Context Works

**Backend filtering:**
```sql
SELECT * FROM resource_items
WHERE owner_id = 'user123'
  AND context_type = 'agent'
  AND context_id = 'agent_abc'
```

**Frontend switching:**
```typescript
// Switch to agent context
setCurrentContext({ type: 'agent', id: 'agent_abc' })
// Triggers reload → only shows agent's resources
```

**Current Implementation:** Workspace only. Backend supports all types.

---

## Features

### Implemented Features

#### 1. **Folder Management**
- Create folders at root or nested
- Rename folders (name, description, color)
- Delete folders (cascades to children)
- Drag folders to reorganize hierarchy
- Color-coded folders for visual organization

#### 2. **Flow Resources**
- Create flow resource referencing existing flow
- Drag flow from tree to canvas → creates SubflowNode
- Open flow in editor from context menu
- Rename flow resource (changes tree name, not flow name)
- Delete flow resource (removes from tree, not the flow itself)

#### 3. **File Resources**
- Upload files from OS by dropping on folders
- File hash serves as unique ID (no actual storage yet)
- Drag file from tree to canvas → creates FileNode
- Delete file resources

#### 4. **Drag & Drop**
- Drag resources within tree to reorganize
- Drag resources to canvas to create nodes
- External file drops from operating system
- Visual feedback (highlights, cursors, previews)

#### 5. **UI/UX**
- Smooth expand/collapse animations
- Search resources by name/description
- Context menus for actions
- Loading states and error handling
- Responsive to sidebar width

### Planned Features

#### 1. **MCP Integration**
- Add MCP tools as draggable resources
- Add MCP resources (prompts, data sources)
- Drag MCP tool to canvas → creates McpToolNode
- Sync with MCP server state

#### 2. **Context Switching**
- UI switcher for workspace/agent/team contexts
- Different tree for each agent
- Team shared trees with permissions

#### 3. **Advanced Operations**
- Multi-select for bulk operations
- Copy/paste resources
- Duplicate flows
- Templates and snippets

#### 4. **Collaborative Features**
- Shared folders (team context)
- Permission system (read/write/admin)
- Real-time updates via WebSocket

#### 5. **Search & Filtering**
- Full-text search across all fields
- Filter by resource type
- Filter by tags
- Saved searches

#### 6. **Node Internals**
- Drill into SubflowNode → see its internal resources
- Context type: 'node', contextId: nodeId
- Scoped file uploads per node

---

## Protocol: Resource → Node Creation

### Flow → SubflowNode

**Trigger:** Drag flow resource, drop on canvas

**Created Node:**
```typescript
{
  type: 'SubflowNode',
  position: { x, y },
  metadata: {
    title: resourceItem.name,
    description: resourceItem.description,
  },
  ports: {
    flowId: {
      value: resourceItem.referenceId // The actual flow ID
    }
  }
}
```

**Execution (Future):**
- Load flow by ID from database
- Execute as child workflow
- Pass inputs, collect outputs
- Support async/sync modes

### File → FileNode

**Trigger:** Drag file resource, drop on canvas

**Created Node:**
```typescript
{
  type: 'FileNode',
  position: { x, y },
  metadata: {
    title: resourceItem.name,
  },
  ports: {
    fileId: {
      value: resourceItem.referenceId // File hash
    },
    fileName: { value: resourceItem.name },
    mimeType: { value: resourceItem.metadata.mimeType },
    size: { value: resourceItem.metadata.size }
  }
}
```

**Execution (Future):**
- Look up file by hash
- Load content from CDN/storage
- Output content for processing

---

## Frontend State Management

### Effector Domain Separation

| Domain | Purpose |
|--------|---------|
| `resourceTreeDomain` | Resource tree state and operations |
| `unifiedDndDomain` | Drag-drop state across app |
| `flowDomain` | Flow metadata and operations |
| `nodesDomain` | Node instances in canvas |

### Data Flow Pattern

```
User Action
  ↓
UI Event (onClick, onDrop, etc.)
  ↓
Effector Event (createFolder, moveResource, etc.)
  ↓
Effector Effect (API call)
  ↓
tRPC Mutation/Query
  ↓
Backend Processing
  ↓
Response
  ↓
Effector Store Update
  ↓
Derived Stores Recompute
  ↓
React Re-render (via useUnit)
```

### Optimistic Updates

**Move operations** use optimistic updates:
1. Update UI immediately
2. Call backend
3. On error: reload tree to resync

**Create/Delete operations** wait for confirmation:
1. Call backend
2. On success: update store
3. UI reflects change

---

## Component Communication

### Parent → Child (Props)

ResourceTree passes handlers down:
```typescript
<TreeFolder
  folder={folder}
  onCreateSubfolder={handleCreateSubfolder}
  onCreateFlow={handleCreateFlow}
  onRename={handleRename}
  onDelete={handleDelete}
  onOpen={handleOpen}
/>
```

### Child → Parent (Callbacks)

Components call handlers provided via props:
```typescript
// In TreeContextMenu
<ContextMenuItem onClick={() => onDelete?.(item.id)}>
  Delete
</ContextMenuItem>
```

### Sibling Communication (Effector)

Unrelated components communicate via Effector:
```typescript
// In ResourceTree: create flow resource after flow created
sample({
  clock: createFlowFx.doneData,  // From flow store
  fn: (flow) => ({
    flowId: flow.id,
    name: flow.name,
    parentId: currentParentId,
    context: { type: 'workspace' }
  }),
  target: createFlowResourceFx,  // In resource-tree store
})
```

---

## File Organization

```
apps/chaingraph-frontend/src/
├─ store/
│  ├─ resource-tree/
│  │  ├─ types.ts          # ResourceItem, inputs
│  │  ├─ stores.ts         # Events, effects, stores
│  │  └─ index.ts
│  └─ unified-dnd/
│     ├─ types.ts          # DragItem, mappings
│     ├─ stores.ts         # Drag state
│     └─ index.ts
├─ components/
│  ├─ resource-tree/
│  │  ├─ ResourceTree.tsx      # Main container
│  │  ├─ components/
│  │  │  ├─ TreeFolder.tsx     # Folder item
│  │  │  ├─ TreeItem.tsx       # Flow/file item
│  │  │  ├─ TreeHeader.tsx     # Top bar
│  │  │  ├─ TreeItemIcon.tsx   # Icon component
│  │  │  ├─ TreeContextMenu.tsx # Context menu
│  │  │  ├─ FolderForm.tsx     # Create/edit folder
│  │  │  ├─ FlowForm.tsx       # Create/edit flow
│  │  │  └─ DeleteConfirmDialog.tsx # Confirmation
│  │  └─ index.ts
│  └─ dnd/
│     ├─ UnifiedDndProvider.tsx # DnD context
│     └─ ResourcePreview.tsx    # Drag preview
```

---

## Future Enhancements

### 1. Smart Search

- Fuzzy matching
- Search by tags
- Search by content (file text search)
- Filter by type, date range

### 2. Templates System

- Save folder structures as templates
- Instantiate templates
- Template marketplace

### 3. Versioning

- Track resource history
- Restore previous versions
- Compare changes

### 4. Permissions

- Share folders with specific users
- Role-based access (read/write/admin)
- Inherit permissions from parent

### 5. Cloud Sync

- Auto-save to cloud
- Sync across devices
- Offline mode with conflict resolution

### 6. Advanced File Handling

- Large file support (chunked upload)
- File preview (images, PDFs)
- File versioning
- CDN integration for fast delivery

---

## Performance Considerations

### Tree Rendering

- **Virtualization**: Not yet implemented. With 1000+ items, consider react-window
- **Memoization**: TreeFolder and TreeItem use React.memo (TODO)
- **Lazy Loading**: All items loaded upfront (consider pagination for large trees)

### Drag Preview

- DragOverlay renders single preview (efficient)
- Scaled by zoom level for visual consistency
- No re-renders during drag (pure component)

### Store Updates

- Derived stores compute on-demand
- No redundant API calls
- Debounced search filtering (TODO)

---

## Security

### Authorization

All tRPC procedures verify:
1. User is authenticated
2. Resource belongs to user
3. Parent folder belongs to user
4. No circular references (folders)

### Data Validation

- Zod schemas validate all inputs
- Name length limits (1-255 chars)
- File size limits (TODO: enforce)
- Hash-based file IDs prevent collisions

### XSS Prevention

- All user input sanitized
- Markdown rendering uses safe parser
- No dangerouslySetInnerHTML

---

## Integration Points

### With Flow System

- Flow resources reference `flows` table via `referenceId`
- Opening flow calls `setActiveFlowId()` from flow store
- Deleting flow resource doesn't delete the flow
- Flow editing happens in flow editor, not resource tree

### With Node System

- Dragging resources creates nodes via `addNodeToFlow` event
- Node types determined by `ITEM_TO_NODE_TYPE` mapping
- Initial port values set from resource metadata
- SubflowNode and FileNode execute referenced entities

### With Execution System

- SubflowNode will spawn child executions (future)
- FileNode will load file content (future)
- Execution events could be logged to resource tree (future)

---

## Migration Path

### Current State

- Old `flow_folders` table still exists
- Old `folderStore` still in backend
- Old FlowTree component still in codebase
- ResourceTree in production alongside old system

### Migration Steps (Future)

1. Run both systems in parallel
2. Migrate existing folders/flows to resource_items
3. Update all references
4. Remove old system:
   - Delete `flow_folders` table
   - Delete `folderStore` backend
   - Delete old FlowTree frontend
   - Remove react-dnd dependencies

### Data Migration Script

```typescript
// Migrate folders
const folders = await folderStore.listFolders(userId)
for (const folder of folders) {
  await resourceStore.create({
    name: folder.name,
    itemType: 'folder',
    parentId: folder.parentFolderId,
    color: folder.color,
    context: { type: 'workspace' }
  }, userId)
}

// Migrate flows
const flows = await flowStore.listFlows(userId)
for (const flow of flows) {
  if (flow.folderId) {
    await resourceStore.create({
      name: flow.name,
      itemType: 'flow',
      referenceId: flow.id,
      parentId: mappedFolderId,
      context: { type: 'workspace' }
    }, userId)
  }
}
```

---

## Troubleshooting

### "Cannot find resource"

- Check user authentication
- Verify resource belongs to user
- Check context matches (workspace vs agent)

### "Circular reference error"

- Attempting to move folder into its own child
- Prevention: `getDescendantIds()` check in DBResourceStore

### "Drag doesn't work"

- Verify UnifiedDndProvider wraps app
- Check drag data format matches expected structure
- Look for `isDragging` console logs

### "Files don't upload"

- Check browser FileReader API support
- Verify base64 encoding works
- Check tRPC uploadFile procedure receives data
- Look for hash calculation errors

---

## Architecture Principles

### 1. Separation of Concerns

- **Backend**: Pure data operations, no UI logic
- **Stores**: State + API integration, no rendering
- **Components**: Rendering + user interaction, minimal logic

### 2. Single Source of Truth

- Database is source of truth
- Effector stores cache for performance
- UI derives from stores, never holds state

### 3. Composable Components

- TreeFolder, TreeItem are self-contained
- Context menus work on any item
- Forms are reusable (create/edit modes)

### 4. Progressive Enhancement

- Core features work without context system
- Drag-drop degrades gracefully
- Works without external file drop

### 5. Type Safety

- End-to-end TypeScript
- tRPC ensures frontend/backend type sync
- Zod validates runtime data
- No `any` types in critical paths

---

This architecture supports current needs while enabling future features without major refactoring.
