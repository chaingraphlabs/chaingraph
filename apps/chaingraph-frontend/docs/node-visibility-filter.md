# Node Palette Customization API

Allows library consumers to filter and reorder nodes and categories displayed in the node palette.

## Visibility API

### Usage

```typescript
import {
  configureNodeVisibility,
  updateNodeVisibility,
  resetNodeVisibility,
  type NodeVisibilityFilter
} from '@badaitech/chaingraph-frontend'

// Show only specific categories
configureNodeVisibility({
  allowedCategories: ['ai', 'flow', 'utilities']
})

// Hide specific node types
configureNodeVisibility({
  hiddenNodeTypes: ['deprecated-node']
})

// Combine filters
configureNodeVisibility({
  allowedCategories: ['ai', 'anthropic'],
  hiddenNodeTypes: ['0g-llm-call']
})

// Reset to show all
resetNodeVisibility()
```

### Filter Options

```typescript
interface NodeVisibilityFilter {
  allowedCategories?: string[]  // Whitelist: only show these categories
  hiddenCategories?: string[]   // Blacklist: hide these categories
  allowedNodeTypes?: string[]   // Whitelist: only show these node types
  hiddenNodeTypes?: string[]    // Blacklist: hide these node types
}
```

Filtering is applied in order:
1. Category whitelist (if provided)
2. Category blacklist
3. Node type whitelist (if provided)
4. Node type blacklist

---

## Ordering API

### Static Ordering (Library Configuration)

```typescript
import {
  configureNodeOrdering,
  updateNodeOrdering,
  resetNodeOrdering,
  type NodeOrderConfig
} from '@badaitech/chaingraph-frontend'

// Boost AI categories to appear first
configureNodeOrdering({
  categoryPriorities: { 'ai': 100, 'anthropic': 90, 'flow': 50 }
})

// Boost specific nodes within their categories
configureNodeOrdering({
  nodePriorities: { 'llm-call': 100, 'branch': 50 }
})

// Custom sort function for categories (alphabetical)
configureNodeOrdering({
  categorySortFn: (a, b) => a.metadata.label.localeCompare(b.metadata.label)
})

// Custom sort function for nodes
configureNodeOrdering({
  nodeSortFn: (a, b) => (a.title ?? '').localeCompare(b.title ?? '')
})

// Reset to default ordering
resetNodeOrdering()
```

### Dynamic Boosting (Intelligent Suggestions)

For context-aware reordering based on user actions or flow state:

```typescript
import {
  boostCategories,
  boostNodes,
  clearBoosts
} from '@badaitech/chaingraph-frontend'

// Boost AI-related categories when user is in an AI context
boostCategories(['ai', 'anthropic'], 1000)

// Boost commonly used nodes based on user behavior
boostNodes(['llm-call', 'branch', 'message'], 500)

// Clear all dynamic boosts (does not affect static config)
clearBoosts()
```

### Order Config Options

```typescript
interface NodeOrderConfig {
  // Priority values for categories (higher = appears first)
  categoryPriorities?: Record<string, number>

  // Priority values for node types (higher = appears first within category)
  nodePriorities?: Record<string, number>

  // Custom sort function for categories (overrides priorities)
  categorySortFn?: (a: CategorizedNodes, b: CategorizedNodes) => number

  // Custom sort function for nodes (overrides priorities)
  nodeSortFn?: (a: NodeMetadataWithPorts, b: NodeMetadataWithPorts) => number
}
```

### How Ordering Works

**Default behavior (no config):**
- Categories: sorted by `metadata.order`
- Nodes: original order from backend

**With priorities:**
```
effectiveOrder = baseOrder - staticPriority - dynamicBoost
```
Lower effective order = appears first.

**Example:**
```typescript
// Category "ai" has metadata.order = 1
// With categoryPriorities: { 'ai': 100 }
// effectiveOrder = 1 - 100 = -99 (appears first!)
```

---

## Available Categories

See [`packages/chaingraph-nodes/src/categories/constants.ts`](../../../packages/chaingraph-nodes/src/categories/constants.ts) for the full list:

| Category ID    | Label          |
|----------------|----------------|
| `ai`           | AI & ML        |
| `anthropic`    | Anthropic      |
| `flow`         | Flow Control   |
| `utilities`    | Utilities      |
| `basic-values` | Basic Values   |
| `math`         | Math           |
| `data`         | Data           |
| `api`          | API Calls      |
| `mcp`          | MCP Protocol   |
| `blockchain`   | Blockchain     |
| `archai`       | ArchAI         |
| `secret`       | Secret         |
| `converters`   | Converters     |
| `okx-dex`      | OKX DEX API    |

---

## Full API Reference

### Visibility

| Function                            | Description                        |
|-------------------------------------|------------------------------------|
| `configureNodeVisibility(filter)`   | Set filter (replaces existing)     |
| `updateNodeVisibility(partial)`     | Merge with existing filter         |
| `resetNodeVisibility()`             | Show all nodes                     |
| `$nodeVisibilityFilter`             | Effector store for reactive access |

### Ordering

| Function                            | Description                              |
|-------------------------------------|------------------------------------------|
| `configureNodeOrdering(config)`     | Set ordering config (replaces existing)  |
| `updateNodeOrdering(partial)`       | Merge with existing config               |
| `resetNodeOrdering()`               | Reset to default ordering                |
| `boostCategories(ids, priority)`    | Temporarily boost categories             |
| `boostNodes(types, priority)`       | Temporarily boost node types             |
| `clearBoosts()`                     | Clear all dynamic boosts                 |
| `$nodeOrderConfig`                  | Effector store for static config         |
| `$dynamicBoosts`                    | Effector store for dynamic boosts        |
