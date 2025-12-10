# Transforms Nodes: Design Document

> A comprehensive guide to designing type-safe, composable data transformation nodes for ChainGraph's visual flow programming system.

---

## Table of Contents

1. [Vision & Motivation](#vision--motivation)
2. [Core Philosophy](#core-philosophy)
3. [The Two-Time Model](#the-two-time-model)
4. [Built-in Capabilities](#built-in-capabilities)
5. [Type Algebra Foundations](#type-algebra-foundations)
6. [Path Navigation vs Schema References](#path-navigation-vs-schema-references)
7. [Node Design Patterns](#node-design-patterns)
8. [Visual Flow Notation](#visual-flow-notation)
9. [Composition Examples](#composition-examples)
10. [Design Trade-offs](#design-trade-offs)
11. [Implementation Rules](#implementation-rules)
12. [Available Helper Methods](#available-helper-methods)
13. [Codebase Reference Guide](#codebase-reference-guide)

---

## Vision & Motivation

### The Problem

Traditional data transformation in visual flow editors often suffers from:

1. **Runtime Type Errors** - Types are checked too late, causing execution failures
2. **Lost Type Information** - Transformations break the type chain
3. **Monolithic Nodes** - Single nodes try to do too much, reducing composability
4. **Edit-time vs Runtime Confusion** - Unclear when validation happens

### Our Solution

Build a **type-algebraic foundation** for data transformations where:

- Types flow through the graph like data
- Composition of simple nodes creates complex transformations
- Type errors are caught at **edit time** when possible
- The visual representation reflects the type signature
- Runtime execution is fast and assumes correctness

### Inspiration

Drawing from functional programming concepts:
- **Haskell's type system** - Types as first-class citizens
- **Category theory** - Functors, products, coproducts
- **Lens libraries** - Focusing on parts of structures (e.g., Haskell's `lens`)
- **TypeScript utility types** - Pick, Omit, Partial, Record
- **Ramda/Lodash** - Composable data transformation utilities

---

## Core Philosophy

### 1. Edit-Time Type Safety Over Runtime Validation

```
┌─────────────────────────────────────────────────────────────────┐
│  EDIT TIME (Flow Building)         EXECUTION TIME (Runtime)     │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Type inference via @OnPortUpdate   ✓ Pure data transform    │
│  ✓ Schema propagation via transfer    ✓ Trust types correct    │
│  ✓ Connection validation              ✗ Minimal type checking  │
│  ✓ UI feedback (colors, errors)       ✗ No schema validation   │
│  ✓ Most errors caught here            ✓ Maximum performance    │
└─────────────────────────────────────────────────────────────────┘
```

**Principle**: Maximize edit-time validation to minimize runtime overhead.

### 2. Composition Over Complexity

**Bad**: One node that does map + filter + reduce + sort
**Good**: Four simple nodes composed together

```
Simple nodes compose:    F ∘ G ∘ H = complex transformation
Complex nodes don't:     Monolith = configuration nightmare
```

**Benefits of composition**:
- Each node testable in isolation
- Reusable building blocks
- Clear data flow visualization
- Easier debugging (step through transformations)

### 3. Schema Ports as Type Templates

**Key Insight**: A port serves **dual purposes**:

1. **Edit-time**: Provides type schema for inference
2. **Runtime**: May carry actual data OR serve purely as type reference

```
Schema Port (Type Template)
    │
    │  Edit-time: "Output should have this shape"
    │  Runtime:   May be empty object with schema, or actual data
    │
    ▼
Output Port (Typed by Schema)
```

This enables **visual type programming** - connecting a schema port shapes the output type.

### 4. Paths vs Composition: Complementary Tools

ChainGraph provides **two mechanisms** for data access:

| Mechanism | Edit-Time | Runtime | Use When |
|-----------|-----------|---------|----------|
| **Schema Reference** | ✓ Type inference | Static structure | Known structure, type safety critical |
| **Path Navigation** | ✗ No inference | Dynamic access | User input, deep nesting, runtime flexibility |

**Both are valuable** - use the right tool for the job.

---

## The Two-Time Model

ChainGraph operates in two distinct temporal modes:

### Edit Time (Flow Building)

**What happens**:
- User connects ports
- `@OnPortUpdate` decorators fire
- Type inference propagates through graph
- Transfer rules apply schema changes automatically
- UI reflects type state (port colors, connection compatibility)
- Port visibility rules update UI dynamically

**Tools available**:
- `setUnderlyingType()` - Set AnyPort's concrete type
- `updateArrayItemConfig()` - Update array element type
- `copyObjectSchemaTo()` - Copy object schema between ports
- `refreshAnyPortUnderlyingPorts()` - Refresh nested ports for Any ports
- `addObjectProperty()` / `removeObjectProperty()` - Modify object schemas
- `startBatchUpdate()` / `commitBatchUpdate()` - Batch port updates efficiently

**Goal**: Build a type-correct flow with minimal type errors at runtime

### Execution Time (Runtime)

**What happens**:
- Flow executes node by node (topological order)
- Data flows through connections
- Transformations apply to actual values
- Minimal type checking (only critical validations)
- Path strings evaluated dynamically

**Assumptions**:
- Types are mostly correct (validated at edit time)
- Connections are valid
- Focus on data transformation performance

**Goal**: Fast, efficient data processing

---

## Built-in Capabilities

ChainGraph provides sophisticated built-in features that Transform nodes leverage:

### Path Navigation System

**Supported path syntax** (via `getPortByPath()`, `parsePathString()`):

```typescript
// Dot notation
"user.name"                  // → navigate to name property

// Array access
"users[0]"                   // → first element
"users[3].email"             // → email of 4th user

// Mixed (deep navigation)
"config.settings.rules[0].enabled"
"data.results[2].metadata.tags[1]"

// Segments parsed correctly
parsePathString("a.b[0].c") // → ["a", "b", "0", "c"]
```

**Built-in methods**:
```typescript
// Get port by path string
getPortByPath("user.address.city"): IPort | undefined

// Get path string for a port
getPortPath(portId: string): string | undefined
getPortPathForPort(port: IPort): string

// Find port by path segments
findPortByPath(["user", "address", "city"]): IPort | undefined

// Build path for a port
buildPortPath(port: IPort): string[]
segmentsToPathString(["user", "0", "name"]): string  // → "user[0].name"
```

### Port Discovery & Traversal

```typescript
// Find single port
findPort((port) => port.key === 'result'): IPort | undefined
findPortByKey('result'): IPort | undefined

// Find multiple ports
findPorts((port) => port.direction === 'output'): IPort[]

// Port hierarchy
getChildPorts(parentPort): IPort[]         // Direct children only
getNestedPorts(parentPort): IPort[]        // All descendants (recursive)
getParentshipChain(port): IPort[]          // From port to root
getRootPort(port): IPort                   // Top-level ancestor
```

### Complex Port Operations

```typescript
// Array operations
updateArrayItemConfig(arrayPort)                    // Refresh array structure
appendArrayItem(arrayPort, value): number           // Add item, return index
removeArrayItem(arrayPort, index)                   // Remove single item
removeArrayItems(arrayPort, indices[])              // Remove multiple items
recreateArrayItemPorts(arrayPort, newArray)         // Full rebuild

// Object operations
addObjectProperty(objectPort, key, config): IPort
addObjectProperties(objectPort, configs[]): IPort[]
removeObjectProperty(objectPort, key)
removeObjectProperties(objectPort, keys[])
copyObjectSchemaTo(sourceNode, sourcePort, targetPort, useParentUI)

// Any port operations
refreshAnyPortUnderlyingPorts(anyPort, useParentUI)
```

### Batch Updates

For performance when updating multiple ports:

```typescript
startBatchUpdate()                    // Begin collecting
// ... modify ports ...
commitBatchUpdate(eventContext?)      // Emit all at once
```

**Benefits**:
- Single version increment
- Single event emission
- Better performance for bulk operations
- Avoids cascading updates

---

## Type Algebra Foundations

### Fundamental Type Operations

| Operation | Symbol | Description | Node |
|-----------|--------|-------------|------|
| **Product** | `A × B` | Combine types (intersection) | `TypeMerge` |
| **Coproduct** | `A + B` | Union types (either/or) | `TypeUnion` |
| **Exponential** | `B^A` | Function space | (implicit in connections) |
| **Wrap** | `F<A>` | Lift into container | `TypeWrap` |
| **Unwrap** | `A` | Extract from F\<A\> | `TypeUnwrap` |
| **Focus** | `A @ path` | Lens/navigate to subtype | `TypeFocus` |
| **Identity** | `id(A)` | Passthrough | Any passthrough node |

### Functor Pattern

A Functor allows mapping over a structure while preserving the container:

```
Functor F:
  fmap :: (A → B) → F<A> → F<B>

Array Functor:
  map :: (A → B) → Array<A> → Array<B>

Maybe Functor:
  map :: (A → B) → Maybe<A> → Maybe<B>
```

**In ChainGraph**:
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Array<A> │────►│ ArrayMap │────►│ Array<B> │
└──────────┘     │          │     └──────────┘
                 │ Schema<B>│◄────────┐
                 └──────────┘         │
                                      │
                 ┌──────────┐         │
                 │ Object<B>│─────────┘
                 └──────────┘
                   Type Template
```

### Product Types (Merge/Intersection)

Combining two types into one:

```
A × B = A & B = {properties of A} ∪ {properties of B}

{name: string} × {age: number} = {name: string, age: number}
```

Visual:
```
┌───────────┐
│ Object<A> │────┐
└───────────┘    │    ┌───────────┐     ┌─────────────┐
                 ├───►│ TypeMerge │────►│ Object<A&B> │
┌───────────┐    │    └───────────┘     └─────────────┘
│ Object<B> │────┘
└───────────┘
```

### Container Operations

**Wrap** - Lift a value into a container:
```
Wrap<A> = Array<A>

value: User → [value] → Array<User>
```

**Unwrap** - Extract the inner type:
```
Unwrap<Array<A>> = A
Unwrap<Stream<A>> = A
Unwrap<Maybe<A>> = A

Array<User> → User (type extraction)
```

### Projection Operations

ChainGraph supports both **edit-time** and **runtime** projections:

**Edit-time (Schema Reference)**:
```
Pick<{a, b, c}, {a, c}> = {a, c}

Via: ObjectNode{a, c} ──schema──► ArrayPick ──► Array<{a, c}>
```

**Runtime (Path Navigation)**:
```
Access<{user: {name: string}}, "user.name"> = string

Via: ArrayPluck ──path:"user.name"──► Array<string>
```

---

## Path Navigation vs Schema References

ChainGraph supports **two complementary approaches** for accessing nested data:

### Approach 1: Path Navigation (Runtime)

**Mechanism**: String paths parsed at runtime

**Syntax**:
```typescript
"user.name"                    // Property access
"users[0]"                     // Array index
"config.items[2].tags[0]"     // Deep mixed navigation
```

**Advantages**:
- ✓ Flexible - paths can be dynamic, user-defined
- ✓ Concise - single string for deep access
- ✓ Runtime adaptable - works with varying structures
- ✓ Built-in - `getPortByPath()` handles parsing

**Limitations**:
- ✗ No edit-time type inference
- ✗ Runtime errors if path invalid
- ✗ Less visual in flow diagram
- ✗ Harder to debug (path errors at runtime)

**When to use**:
- User provides path as input
- Deep navigation (>3 levels)
- Dynamic/conditional access
- Simple property extraction where type safety less critical

**Example**:
```
ArrayPluck
  ◄── array: Array<{user: {profile: {email: string}}}>
  ◄── path: "user.profile.email"
  ──► result: Array<string>
```

### Approach 2: Schema Reference (Edit-Time)

**Mechanism**: Connect schema port, infer types via `@OnPortUpdate`

**Syntax**: Visual connections between nodes

**Advantages**:
- ✓ Edit-time type inference
- ✓ Visual type flow in diagram
- ✓ Port colors reflect types
- ✓ Connection errors caught early
- ✓ Composable type transformations

**Limitations**:
- ✗ More verbose (extra nodes)
- ✗ Static structure (can't change at runtime)
- ✗ Requires schema definition upfront

**When to use**:
- Type safety critical
- Complex transformations with multiple steps
- Reusable type definitions
- Known static structure

**Example**:
```
┌─────────────┐
│ Object Node │
│ {email}     │──── schema ────┐
└─────────────┘                ▼
                    ┌──────────────┐
  Array<FullUser> ──►│  ArrayPick   │──► Array<{email}>
                    └──────────────┘
```

### Hybrid Approach: Best of Both Worlds

Many nodes benefit from **both** mechanisms:

```typescript
@Node({ title: 'Array Filter with Path' })
class ArrayFilterNode {
  @Input()
  @PortArray({ itemConfig: { type: 'any' }, isSchemaMutable: true })
  array: any[] = []

  @Input()
  @PortString({ title: 'Path', description: 'Property path (e.g., "user.active")' })
  path: string = ''

  @Input()
  @PortAny({ title: 'Compare Value' })
  compareValue: any

  // Output type preserves input type (edit-time inference)
  @Output()
  @PortArray({ itemConfig: { type: 'any' } })
  result: any[] = []

  async execute() {
    // Runtime: Use path to navigate
    this.result = this.array.filter(item => {
      const value = this.path ? getByPath(item, this.path) : item
      return value === this.compareValue
    })
  }
}
```

**Result**: Edit-time knows `result` has same type as `array`, runtime uses flexible paths.

---

## The Two-Time Model

### Edit Time (Flow Building)

**What happens**:
```
User connects port ──► Transfer rule evaluates ──► Schema propagates
                ──► @OnPortUpdate fires      ──► Type inference
                ──► UI updates (colors)      ──► Validation
```

**Key mechanisms**:
1. **Transfer Rules** - Automatic schema/type propagation between connected ports
2. **@OnPortUpdate** - Custom type inference logic when port changes
3. **Port visibility** - `@PortVisibility` shows/hides ports based on node state
4. **Schema compatibility** - `checkSchemaCompatibility()` validates connections

**Available tools**:
```typescript
// Type operations
setUnderlyingType(config)              // Set AnyPort type
unwrapUnderlyingType()                 // Get concrete type from AnyPort

// Array operations
updateArrayItemConfig(arrayPort)       // Sync array structure with itemConfig
recreateArrayItemPorts(arrayPort, arr) // Rebuild all item ports

// Object operations
copyObjectSchemaTo(src, srcPort, tgtPort, useParentUI)
addObjectProperty(objPort, key, config)

// Any port refresh
refreshAnyPortUnderlyingPorts(anyPort, useParentUI)

// Batch updates
startBatchUpdate()
commitBatchUpdate(eventContext?)
```

**Goal**: Construct a type-correct flow

### Execution Time (Runtime)

**What happens**:
```
Node.execute() ──► Read input ports ──► Transform data ──► Write output ports
```

**Characteristics**:
- Fast - no type validation
- Trust - assumes types correct
- Path evaluation - `getByPath()` executes dynamically
- Minimal overhead

**Available tools**:
```typescript
// Data transformation (runtime)
getByPath(obj, "user.address.city")    // Navigate to nested value
```

**Goal**: Efficient data processing

---

## Built-in Capabilities

### Path System

ChainGraph has a **first-class path system** for port and value navigation:

#### Path Syntax

```typescript
// Simple property access
"name"              // → object.name

// Nested properties
"user.profile.bio"  // → object.user.profile.bio

// Array indexing
"items[0]"          // → array.items[0]
"items[5].title"    // → array.items[5].title

// Deep mixed navigation
"config.servers[0].endpoints[2].url"
```

#### Path Parsing

**Built-in parser** (`parsePathString`):

```typescript
parsePathString("user.items[0].name")
// → ["user", "items", "0", "name"]

parsePathString("data[5].tags[0]")
// → ["data", "5", "tags", "0"]
```

Handles:
- Dot notation (`.`)
- Bracket notation (`[index]`)
- Mixed notation
- Validation (unclosed brackets, etc.)

#### Port Path Operations

**Get port by path**:
```typescript
// From node instance
const emailPort = node.getPortByPath("user.profile.email")

// From path array
const tagPort = node.findPortByPath(["data", "tags", "0"])
```

**Get path for port**:
```typescript
const port = node.findPortByKey("result")
const path = node.getPortPathForPort(port)  // → "result" or "object.result"
```

**Build paths programmatically**:
```typescript
const segments = node.buildPortPath(port)     // → ["user", "0", "email"]
const pathStr = node.segmentsToPathString(segments)  // → "user[0].email"
```

### Port Hierarchy & Traversal

ChainGraph ports form a **tree structure**:

```
Node
├── user (ObjectPort)
│   ├── name (StringPort)
│   ├── age (NumberPort)
│   └── addresses (ArrayPort)
│       ├── [0] (ObjectPort)
│       │   ├── street (StringPort)
│       │   └── city (StringPort)
│       └── [1] (ObjectPort)
│           ├── street (StringPort)
│           └── city (StringPort)
└── result (AnyPort)
```

**Traversal methods**:
```typescript
// Direct children
getChildPorts(userPort)      // → [name, age, addresses]

// All descendants
getNestedPorts(userPort)     // → [name, age, addresses, [0], street, city, [1], ...]

// Ancestors
getParentshipChain(cityPort) // → [city, [0], addresses, user, root]
getRootPort(cityPort)        // → user
```

### Helper Utilities (from chaingraph-types)

```typescript
import {
  deepCopy,           // Deep clone objects/arrays/configs
  isDeepEqual,        // Deep equality check
  findPort,           // Find port by predicate (standalone)
  filterPorts,        // Get all matching ports (standalone)
  checkSchemaCompatibility,  // Validate type compatibility
} from '@badaitech/chaingraph-types'
```

**Runtime value navigation**:
```typescript
// You need to implement this yourself (simple utility)
function getByPath(obj: any, path: string): any {
  if (!path) return obj
  const parts = path.split('.').flatMap(part => {
    const match = part.match(/^(.+?)\[(\d+)\]$/)
    return match ? [match[1], match[2]] : [part]
  })
  return parts.reduce((acc, key) => acc?.[key], obj)
}
```

---

## Type Algebra Foundations

### Category Theory Mappings

| Category Theory | ChainGraph | Implementation |
|-----------------|------------|----------------|
| **Object** | Type | `IPortConfig` with schema |
| **Morphism** | Connection | Port connection with transfer rule |
| **Product** | Type intersection | `TypeMerge` node |
| **Coproduct** | Type union | `TypeUnion` node (future) |
| **Functor** | Container | `Array<T>`, `Stream<T>` |
| **fmap** | Map operation | `ArrayMap` node |
| **Composition** | Flow chain | Node → Node → Node |
| **Identity** | Passthrough | Any passthrough port |

### Functor Laws

For `ArrayMap` to be a proper functor:

```
1. Identity: map(id) = id
   ArrayMap<identity> should not change the array

2. Composition: map(f ∘ g) = map(f) ∘ map(g)
   ArrayMap<f> → ArrayMap<g> = ArrayMap<g∘f>
```

We preserve these laws in node design.

### Type-Level Functions

Inspired by TypeScript utility types:

```typescript
// TypeScript              // ChainGraph Node
Pick<T, K>         →       ArrayPick (schema reference)
Omit<T, K>         →       ArrayOmit (schema reference)
Partial<T>         →       TypePartial (all optional)
Required<T>        →       TypeRequired (all required)
Record<K, V>       →       ObjectConstruct (from arrays)
Extract<T, U>      →       TypeIntersect (common fields)
Exclude<T, U>      →       TypeDifference (unique fields)
```

---

## Node Design Patterns

### Pattern A: Item Type Preservation

**Signature**: `Array<T> → Array<T>`

**Use for**: Filter, Slice, Reverse, Sort - operations that don't change element type

```typescript
@OnPortUpdate(async (node, port) => {
  const arrayPort = port as ArrayPort
  const resultPort = node.findPort(p => p.key === 'result') as ArrayPort
  if (!resultPort) return

  // Copy itemConfig from input to output (type preservation)
  resultPort.setConfig({
    ...resultPort.getConfig(),
    itemConfig: deepCopy(arrayPort.getConfig().itemConfig),
  })
  node.updateArrayItemConfig(resultPort)
})
```

**Visual**:
```
Array<User> ──► [ArrayFilter] ──► Array<User>
                     │
                path: "active"
                operator: truthy
```

**Edit-time**: Output type = Input type
**Runtime**: Filter by path expression

---

### Pattern B: Item Type Extraction

**Signature**: `Array<T> → T`

**Use for**: First, Last, Find - operations that extract a single element

```typescript
@OnPortUpdate(async (node, port) => {
  const arrayPort = port as ArrayPort
  const itemConfig = arrayPort.getConfig().itemConfig
  const elementPort = node.findPort(p => p.key === 'element') as AnyPort
  if (!elementPort) return

  // Extract item type from array
  elementPort.setUnderlyingType(deepCopy({
    ...itemConfig,
    direction: 'output',
    ui: { hideEditor: true, collapsed: true },
  }))
  node.refreshAnyPortUnderlyingPorts(elementPort as IPort, true)
})
```

**Visual**:
```
Array<User> ──► [ArrayFirst] ──► element: User
                     │
                     └──► isEmpty: boolean
```

**Edit-time**: Output type = Input array's item type
**Runtime**: Return `array[0]` or `null`

---

### Pattern C: Schema Reference (Type Template)

**Signature**: `Array<T> × Schema<K> → Array<K>` where `K ⊆ T`

**Use for**: Pick, Map, Project - operations requiring output type specification

```typescript
@OnPortUpdate(async (node, port) => {
  // This fires when schema port updates
  const schemaPort = port as ObjectPort
  const outputPort = node.findPort(p => p.key === 'result') as ArrayPort
  if (!outputPort) return

  // Output array's item type = schema port's type
  const schema = schemaPort.getConfig().schema
  outputPort.setConfig({
    ...outputPort.getConfig(),
    itemConfig: {
      type: 'object',
      schema: deepCopy(schema),
      isSchemaMutable: false,  // Output type is fixed
    }
  })
  node.updateArrayItemConfig(outputPort)
})
```

**Visual**:
```
┌─────────────────┐
│ Object Node     │
│ {id, name}      │──── schema ────┐
└─────────────────┘                │
                                   ▼
┌─────────────────┐     ┌──────────────┐     ┌──────────────────┐
│ API Response    │────►│  ArrayPick   │────►│ Array<{id,name}> │
│ Array<FullUser> │     │              │     └──────────────────┘
└─────────────────┘     └──────────────┘
```

**Edit-time**: Output type inferred from schema port
**Runtime**: For each item, pick only fields defined in schema

---

### Pattern D: Type Composition

**Signature**: `Array<A> × Array<B> → Array<{a: A, b: B}>`

**Use for**: Zip, Merge - operations combining multiple types

```typescript
@OnPortUpdate(async (node) => {
  const portA = node.findPort(p => p.key === 'arrayA') as ArrayPort
  const portB = node.findPort(p => p.key === 'arrayB') as ArrayPort
  const resultPort = node.findPort(p => p.key === 'result') as ArrayPort
  if (!resultPort) return

  const itemConfigA = portA?.getConfig().itemConfig || { type: 'any' }
  const itemConfigB = portB?.getConfig().itemConfig || { type: 'any' }

  // Compose: output type is product of input types
  resultPort.setConfig({
    ...resultPort.getConfig(),
    itemConfig: {
      type: 'object',
      schema: {
        properties: {
          a: deepCopy(itemConfigA),
          b: deepCopy(itemConfigB),
        }
      }
    }
  })
  node.updateArrayItemConfig(resultPort)
})
```

**Visual**:
```
Array<User> ──────┐
                  │    ┌──────────┐     ┌───────────────────┐
                  ├───►│ ArrayZip │────►│ Array<{a:User,    │
                  │    └──────────┘     │        b:Order}>  │
Array<Order> ─────┘                     └───────────────────┘
```

**Edit-time**: Output type = Product(A, B)
**Runtime**: Pair elements from both arrays

---

### Pattern E: Path + Type Hybrid

**Signature**: `Array<T> × Path → Array<T[Path]>`

**Use for**: Pluck, GroupBy, SortBy - path-based operations with partial type inference

```typescript
@Node({ title: 'Array Pluck' })
class ArrayPluckNode {
  @Input()
  @PortArray({ itemConfig: { type: 'any' }, isSchemaMutable: true })
  @OnPortUpdate(async (node, port) => {
    // Attempt to infer output type from path
    const arrayPort = port as ArrayPort
    const itemConfig = arrayPort.getConfig().itemConfig
    const pathStr = (node as ArrayPluckNode).path

    const resultPort = node.findPort(p => p.key === 'result') as ArrayPort
    if (!resultPort) return

    if (pathStr && itemConfig?.type === 'object') {
      // Try to infer type at path
      const typeAtPath = getTypeAtPath(itemConfig, pathStr)
      if (typeAtPath) {
        resultPort.setConfig({
          ...resultPort.getConfig(),
          itemConfig: deepCopy(typeAtPath),
        })
        node.updateArrayItemConfig(resultPort)
        return
      }
    }

    // Fallback: any type
    resultPort.setConfig({
      ...resultPort.getConfig(),
      itemConfig: { type: 'any' },
    })
    node.updateArrayItemConfig(resultPort)
  })
  array: any[] = []

  @Input()
  @PortString({ title: 'Path', description: 'Property path' })
  @OnPortUpdate((node) => {
    // Re-trigger type inference when path changes
    const arrayPort = node.findPort(p => p.key === 'array')
    if (arrayPort) {
      // Manually trigger the array port's update handler
      // (This pattern might need refinement in actual implementation)
    }
  })
  path: string = ''

  @Output()
  @PortArray({ itemConfig: { type: 'any' } })
  result: any[] = []

  async execute() {
    this.result = this.array.map(item => getByPath(item, this.path))
  }
}
```

**Visual**:
```
Array<{user:{name:string}}> ──► [ArrayPluck] ──► Array<string>
                                      │
                                 path: "user.name"

Edit-time: Infers Array<string> from schema + path
Runtime: Executes path navigation
```

---

### Pattern F: Batch Operations

**Use for**: Nodes that modify multiple ports during type inference

```typescript
async updateOutputTypes() {
  // Start collecting updates
  this.startBatchUpdate()

  // Modify multiple ports
  this.updatePort1()
  this.updatePort2()
  this.updatePort3()

  // Commit all at once
  await this.commitBatchUpdate({
    sourceOfUpdate: 'MyNode:updateOutputTypes'
  })
}
```

**Benefits**:
- Single version increment
- Better performance
- Atomic updates

---

## Visual Flow Notation

### Basic Syntax

```
[NodeName] ──► [NodeName]              Basic connection
[NodeName] ─type─► [NodeName]          Labeled connection
[NodeName] ──► output: Type            Output with type annotation

{schema}                                Object schema literal
Array<T>                                Array of T
T?                                      Optional/nullable T
A & B                                   Merged types (intersection)
A | B                                   Union types
```

### Path Expressions

```
path:"a.b.c"                           Nested property access
path:"items[0].name"                   Array element access
path:"config.rules[2].enabled"         Deep navigation
```

### Port Notation

```
[Node]
  ├─► output1: Type1
  └─► output2: Type2

[Node]
  ◄── input1: Type1
  ◄── input2: Type2
  ◄── path: "nested.field"
```

### Flow Chains

```
[Source] ──► [Transform1] ──► [Transform2] ──► [Sink]

// With types:
Array<A> ──► [Map] ──► Array<B> ──► [Filter] ──► Array<B> ──► [First] ──► B
```

### Branching

```
         ┌──► [Branch1] ──┐
[Source] ┤                ├──► [Merge]
         └──► [Branch2] ──┘
```

### Schema Reference

```
{K} ─────schema────┐
                   ▼
Array<T> ─────► [ArrayPick] ──► Array<K>
```

### Path Navigation

```
Array<T> ──► [ArrayPluck] ──► Array<T[path]>
                  │
             path: "user.email"
```

---

## Composition Examples

### Example 1: Path-Based Filtering

**Goal**: Get active users' emails

```
Input: Array<{id, name, email, active}>
Output: Array<string>

Flow (Path-Based):
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Array<User> ──► [ArrayFilter] ──► [ArrayPluck] ──► string[]   │
│                       │                  │                       │
│                  path: "active"     path: "email"               │
│                  operator: truthy                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Edit-time type flow:
  Array<User> → Array<User> → Array<string> (if path type known)
                                Array<any> (if path type unknown)

Runtime:
  users.filter(u => u.active).map(u => u.email)
```

### Example 2: Schema-Based Projection

**Goal**: Extract specific fields with edit-time type safety

```
Input: Array<{id, name, email, active, role, createdAt, ...}>
Output: Array<{id, name}>

Flow (Schema-Based):
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────┐                                                │
│  │ Object Node │                                                │
│  │ {id, name}  │─────── schema ────────┐                        │
│  └─────────────┘                       │                         │
│                                        ▼                         │
│  Array<FullUser> ────────────► [ArrayPick] ──► [{id, name}]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Edit-time type flow:
  Array<FullUser> × Schema<{id,name}> → Array<{id, name}>
  (Fully typed at edit time!)

Runtime:
  users.map(u => ({ id: u.id, name: u.name }))
```

**Trade-off**: Schema approach uses extra node but provides stronger types.

### Example 3: Deep Navigation with TypeFocus

**Goal**: Navigate to deeply nested array, then transform

```
Input: {data: {response: {users: Array<User>}}}
Output: Array<{id, name}>

Flow (Using Path):
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  API Response ──► [ArrayPluck] ──path:"data.response.users"──┐ │
│                                                               │ │
│  (But this returns the ARRAY, not elements within it!)       │ │
│                                                               ▼ │
│  This doesn't work well - need TypeFocus + ArrayPick combo     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Flow (Using TypeFocus - Better):
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────┐                                                │
│  │ Object Node │                                                │
│  │ {id, name}  │────── schema ─────────────────┐                │
│  └─────────────┘                               │                │
│                                                ▼                │
│  API Response ──► [TypeFocus] ──► Array<User> ──► [ArrayPick]  │
│                        │                              │         │
│                path: "data.response.users"            │         │
│                                                       ▼         │
│                                            Array<{id, name}>    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Edit-time type flow:
  Response ──Focus──► Array<User> ──Pick──► Array<{id, name}>

Runtime:
  response.data.response.users.map(u => ({ id: u.id, name: u.name }))
```

**Key insight**: TypeFocus navigates the type structure, then other nodes transform.

### Example 4: Hybrid Path + Schema

**Goal**: Filter by nested condition, project fields

```
Input: Array<{user: {active: boolean, profile: {name, email}}}>
Output: Array<{name, email}>

Flow:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────┐                                                │
│  │ Object Node │                                                │
│  │ {name,email}│───── schema ──────────┐                        │
│  └─────────────┘                       │                         │
│                                        ▼                         │
│  Array<Item> ──► [ArrayFilter] ──► [ArrayPick] ──► Result      │
│                       │                                         │
│                  path: "user.active"                            │
│                  operator: truthy                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Edit-time:
  Array<Item> ──Filter──► Array<Item> ──Pick──► Array<{name, email}>
  (Schema provides edit-time type for Pick output)

Runtime:
  items
    .filter(item => item.user.active)
    .map(item => ({ name: item.user.profile.name, email: item.user.profile.email }))
```

**Combines**: Runtime path flexibility + Edit-time type safety

---

### Example 5: Type Composition Chain

**Goal**: Merge metadata from multiple sources

```
Input: users[], permissions[], settings[]
Output: Array<{user, permissions, settings}>

Flow:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Array<User> ──────────┐                                        │
│                        ├──► [ArrayZip] ──► Array<{a, b}>       │
│  Array<Permission> ────┘          │                             │
│                                   │                             │
│                                   ▼                             │
│  Array<Settings> ──────────► [ArrayZip] ──► Array<{a, b}>      │
│                                   │                             │
│                                   ▼                             │
│                          Array<{a:{a,b}, b}>                    │
│                                   │                             │
│                          ┌────────┴──────────┐                  │
│                          │  TypeFlatten or   │                  │
│                          │  custom reshaper  │                  │
│                          └────────┬──────────┘                  │
│                                   ▼                             │
│                     Array<{user, permissions, settings}>        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Edit-time: Types compose automatically
Runtime: Nested zipping + flattening
```

---

### Example 6: Partition and Process Branches

**Goal**: Split orders by status, process differently

```
Input: Array<Order>
Output: summaryReport: {completed: Array<Summary>, pending: Count}

Flow:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────┐                                                │
│  │ Object Node │                                                │
│  │ {id, total} │───── schema ───────────────┐                   │
│  └─────────────┘                            │                   │
│                                             ▼                   │
│                  ┌──► matching ──► [ArrayPick] ──► completed   │
│  Array<Order> ──►│                                              │
│                  │ [ArrayPartition]                             │
│                  │      │                                       │
│                  │  path: "status"                              │
│                  │  value: "completed"                          │
│                  │                                              │
│                  └──► nonMatching ──► [ArrayLength] ──► pending │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Type flow:
  Array<Order> → (Array<Order>, Array<Order>)
               → (Array<{id,total}>, number)
```

**Demonstrates**: Different transformations on each partition branch.

---

## Design Trade-offs

### Path Navigation vs Schema Reference

| Aspect | Path Navigation | Schema Reference |
|--------|----------------|------------------|
| **Type Safety** | Runtime only | Edit-time + Runtime |
| **Flexibility** | High (dynamic paths) | Low (static structure) |
| **Visual Clarity** | Low (hidden in string) | High (explicit nodes) |
| **Performance** | Parse path at runtime | Pre-validated structure |
| **Debugging** | Path errors at runtime | Connection errors at edit-time |
| **Complexity** | Single node | Multiple nodes |
| **Reusability** | Path strings portable | Schema nodes reusable |

### When to Use Each

**Use Path Navigation when**:
- User provides path as input
- Deep navigation (>3 levels) where composition is verbose
- Structure may vary at runtime
- Quick prototyping
- Type inference not critical

**Use Schema Reference when**:
- Type safety critical
- Structure known and stable
- Building reusable type definitions
- Complex transformations with multiple steps
- Want visual type flow in diagram

**Use Hybrid when**:
- Need both flexibility and type safety
- Filter/sort by path, but preserve array element type
- Runtime paths, but known container types

### Performance Considerations

**Edit-time** (one-time cost):
- Schema Reference: More port updates, more events
- Path Navigation: Simpler, fewer ports

**Runtime** (executed repeatedly):
- Schema Reference: Direct property access
- Path Navigation: String parsing + navigation

For most use cases: **Runtime performance matters more** → slight preference for schema reference in hot paths.

---

## Design Principles

### 1. Runtime Type Checking: When to Use

**Generally avoid**:
```typescript
async execute() {
  if (!Array.isArray(this.array)) {
    throw new Error('Not an array')  // Should be caught at edit-time
  }
}
```

**Acceptable for**:
```typescript
async execute() {
  // Validate runtime-dynamic data
  if (!this.path) {
    throw new Error('Path is required')  // User input validation
  }

  // Validate business logic
  if (this.array.length > 10000) {
    throw new Error('Array too large (max 10000)')  // Resource limit
  }
}
```

**Rule**: Validate **data**, not **types** at runtime.

### 2. Composition vs Monolith

**Bad example** - Monolithic node:
```typescript
@Node({ title: 'Array Transform All' })
class ArrayTransformAllNode {
  @Input() operation: 'map' | 'filter' | 'reduce' | 'sort' | 'group'
  @Input() expression: string
  @Input() sortDirection: 'asc' | 'desc'
  @Input() groupBy: string
  // ... 20+ configuration inputs
}
```

**Problems**:
- Configuration explosion
- Unclear data flow
- Hard to compose
- No type inference possible

**Good example** - Composable nodes:
```typescript
@Node({ title: 'Array Filter' })
class ArrayFilterNode { /* focused on filtering */ }

@Node({ title: 'Array Sort' })
class ArraySortNode { /* focused on sorting */ }

@Node({ title: 'Array Reduce' })
class ArrayReduceNode { /* focused on reducing */ }
```

**Benefits**:
- Clear single purpose
- Easy to reason about
- Composable in any order
- Each can infer types independently

### 3. Immutability in Execution

**Always create new data structures**:

```typescript
// ✓ Good
async execute() {
  this.result = [...this.array].sort()
  this.outputObject = { ...this.inputObject, newField: value }
}

// ✗ Bad
async execute() {
  this.array.sort()              // Mutates input!
  this.result = this.array

  this.inputObject.newField = value  // Mutates input!
  this.outputObject = this.inputObject
}
```

**Why**: Preserves data provenance, enables debugging, prevents side effects.

### 4. Deep Copy for Configurations

**Always `deepCopy()` when transferring schemas**:

```typescript
// ✓ Good
outputPort.setConfig({
  ...outputPort.getConfig(),
  itemConfig: deepCopy(inputPort.getConfig().itemConfig)
})

// ✗ Bad
outputPort.setConfig({
  ...outputPort.getConfig(),
  itemConfig: inputPort.getConfig().itemConfig  // Shared reference!
})
```

**Why**: Prevents accidental schema mutations affecting multiple ports.

### 5. Explicit Type Conversions

Don't silently change types:

```typescript
// ✗ Bad - implicit conversion
this.result = this.numbers.map(n => String(n))  // number[] → string[]

// ✓ Good - explicit converter node
[Array<number>] ──► [NumberToString (via map)] ──► [Array<string>]
```

**Why**: Makes data transformations visible in the flow diagram.

---

## Implementation Rules

### Rule 1: Handle Empty/Null Inputs Gracefully

```typescript
async execute(): Promise<NodeExecutionResult> {
  // Handle missing input
  if (!this.array || !Array.isArray(this.array)) {
    this.result = []
    this.isEmpty = true
    return {}
  }

  // Handle empty array
  if (this.array.length === 0) {
    this.result = []
    this.isEmpty = true
    return {}
  }

  // Normal processing
  this.isEmpty = false
  this.result = this.array.filter(/* ... */)
  return {}
}
```

### Rule 2: Use Passthrough for Schema/Type Ports

Ports that serve as type templates should be `@Passthrough()`:

```typescript
@Passthrough()  // Can both receive AND propagate type info
@PortObject({
  title: 'Schema',
  schema: { properties: {} },
  isSchemaMutable: true,
})
schema: Record<string, any> = {}
```

### Rule 3: Always Update After Config Changes

**For arrays**:
```typescript
arrayPort.setConfig({ ...arrayPort.getConfig(), itemConfig: newConfig })
node.updateArrayItemConfig(arrayPort)  // REQUIRED
```

**For Any ports**:
```typescript
anyPort.setUnderlyingType(newType)
node.refreshAnyPortUnderlyingPorts(anyPort, true)  // REQUIRED
```

**For objects**:
```typescript
node.addObjectProperty(objectPort, 'newKey', config)
// Already triggers updates internally
```

### Rule 4: Use Batch Updates for Multiple Changes

```typescript
async updateMultiplePorts() {
  this.startBatchUpdate()

  // Modify ports
  portA.setConfig({ ... })
  portB.setConfig({ ... })
  portC.setConfig({ ... })

  await this.commitBatchUpdate()  // Single event emission
}
```

### Rule 5: Consistent Naming Conventions

```typescript
// Array operations - prefix with "Array"
ArrayFirst, ArrayLast, ArraySlice, ArrayFilter, ArrayMap, ArrayReduce

// Type operations - prefix with "Type"
TypeMerge, TypeUnwrap, TypeWrap, TypeFocus, TypeIntersect

// Object operations - prefix with "Object"
ObjectKeys, ObjectValues, ObjectEntries, ObjectMerge

// Path parameter - always "path"
@Input()
@PortString({ title: 'Path', description: '...' })
path: string = ''
```

### Rule 6: Meaningful Tags for Discoverability

```typescript
@Node({
  title: 'Array Filter',
  tags: [
    'array',        // Primary category
    'filter',       // Primary operation
    'predicate',    // Method
    'transform',    // General category
    'functional',   // Programming paradigm
  ],
})
```

### Rule 7: Document Type Signatures

Include type signature in description:

```typescript
@Node({
  description: 'Extract first element from array. Type: Array<T> → T',
})
```

Or more detailed:
```typescript
@Node({
  description: 'Filter array by path predicate. Type: Array<T> × Path × Value → Array<T>',
})
```

### Rule 8: Path Navigation Utilities

**Implement shared utilities** for consistency:

```typescript
/**
 * Navigate object by path string
 * Supports: "a.b", "a[0]", "a.b[0].c"
 */
function getByPath(obj: any, path: string): any {
  if (!path || !obj) return obj

  const parts = path.split('.').flatMap(part => {
    // Handle array notation: "items[0]" → ["items", "0"]
    const match = part.match(/^(.+?)\[(\d+)\]$/)
    if (match) return [match[1], match[2]]

    // Check for standalone array: "[0]"
    const arrayMatch = part.match(/^\[(\d+)\]$/)
    if (arrayMatch) return [arrayMatch[1]]

    return [part]
  }).filter(Boolean)

  return parts.reduce((acc, key) => {
    if (acc === null || acc === undefined) return undefined
    return acc[key]
  }, obj)
}

/**
 * Navigate type schema by path
 * Returns IPortConfig at the path location
 */
function getTypeAtPath(config: IPortConfig, path: string): IPortConfig | undefined {
  if (!path) return config

  const parts = path.split('.').flatMap(part => {
    const match = part.match(/^(.+?)\[(\d+)\]$/)
    return match ? [match[1], '[]'] : [part]
  }).filter(Boolean)

  let current: IPortConfig | undefined = config

  for (const part of parts) {
    if (!current) return undefined

    if (part === '[]' || part === '*') {
      // Array wildcard - get item type
      if (current.type === 'array') {
        current = (current as ArrayPortConfig).itemConfig
      } else {
        return undefined
      }
    } else if (current.type === 'object') {
      // Object property access
      const objConfig = current as ObjectPortConfig
      current = objConfig.schema?.properties?.[part]
    } else {
      return undefined
    }
  }

  return current
}

/**
 * Set value at path (immutable - returns new object)
 */
function setAtPath(obj: any, path: string, value: any): any {
  if (!path) return value

  const parts = path.split('.')
  const result = deepCopy(obj) || {}

  let current = result
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!(part in current)) {
      current[part] = {}
    }
    current = current[part]
  }

  current[parts[parts.length - 1]] = value
  return result
}
```

### Rule 9: Category and Organization

All Transform nodes should use:

```typescript
import { NODE_CATEGORIES } from '../../../categories'

@Node({
  type: 'ArrayFirstNode',
  title: 'Array First',
  description: 'Get first element. Type: Array<T> → T',
  category: NODE_CATEGORIES.TRANSFORMS,  // New category
  tags: ['array', 'first', 'extract', 'transform'],
})
```

---

## Available Helper Methods

All nodes extending `BaseNode` have access to these methods:

### Port Discovery

```typescript
// Find single port
findPort(predicate: (port: IPort) => boolean): IPort | undefined
findPortByKey(key: string): IPort | undefined

// Find multiple
findPorts(predicate: (port: IPort) => boolean): IPort[]
getInputs(): IPort[]
getOutputs(): IPort[]

// Get specific port
getPort(portId: string): IPort | undefined
hasPort(portId: string): boolean
```

### Path Operations

```typescript
// Get port by path string
getPortByPath(pathString: string): IPort | undefined
// Example: getPortByPath("user.addresses[0].city")

// Get path for port
getPortPath(portId: string): string | undefined
getPortPathForPort(port: IPort): string

// Find by path segments
findPortByPath(path: string[]): IPort | undefined
// Example: findPortByPath(["user", "addresses", "0", "city"])
```

### Port Hierarchy

```typescript
// Children and descendants
getChildPorts(parentPort: IPort): IPort[]        // Direct children
getNestedPorts(parentPort: IPort): IPort[]       // All descendants

// Ancestors
getParentshipChain(port: IPort): IPort[]         // Port to root
getRootPort(port: IPort): IPort                  // Top-level port
```

### Array Port Operations

```typescript
// Update array structure
updateArrayItemConfig(arrayPort: IPort): void

// Modify array
appendArrayItem(arrayPort: IPort, value: any): number
removeArrayItem(arrayPort: IPort, index: number): void
removeArrayItems(arrayPort: IPort, indices: number[]): void
recreateArrayItemPorts(arrayPort: IPort, newArray: any[]): void
```

### Object Port Operations

```typescript
// Add properties
addObjectProperty(objectPort: IPort, key: string, config: IPortConfig, useParentUI?: boolean): IPort
addObjectProperties(objectPort: IPort, configs: IPortConfig[], useParentUI?: boolean): IPort[]

// Remove properties
removeObjectProperty(objectPort: IPort, key: string): void
removeObjectProperties(objectPort: IPort, keys: string[]): void

// Copy schema
copyObjectSchemaTo(
  sourceNode: IPortManager,
  sourcePort: ObjectPort | AnyPort,
  targetPort: ObjectPort | AnyPort,
  useParentUI?: boolean
): void
```

### Any Port Operations

```typescript
// Refresh underlying type's child ports
refreshAnyPortUnderlyingPorts(anyPort: IPort, useParentUI?: boolean): void

// On AnyPort instance
anyPort.setUnderlyingType(config: IPortConfig | undefined)
anyPort.unwrapUnderlyingType(): IPortConfig | undefined
anyPort.getRawConfig(): AnyPortConfig
```

### Port Updates

```typescript
// Single update
updatePort(port: IPort, eventContext?: EventContext): Promise<void>
updatePorts(ports: IPort[], eventContext?: EventContext): Promise<void>

// Batch updates (performance optimization)
startBatchUpdate(): void              // Begin collecting
commitBatchUpdate(eventContext?): Promise<void>  // Emit all at once
```

### Utility Functions (Import from chaingraph-types)

```typescript
import {
  deepCopy,                    // Deep clone with special type support
  isDeepEqual,                 // Deep equality check
  checkSchemaCompatibility,    // Validate type compatibility
} from '@badaitech/chaingraph-types'
```

---

## Visual Flow Notation

### Symbols

```
──►                    Connection
─schema─►              Schema/type reference
─data──►               Data flow
─path:"x.y"──►         Path-based access

[NodeName]             Node
{fieldA, fieldB}       Object literal schema
Array<T>               Array type
T?                     Optional/nullable
A & B                  Type intersection (merge)
A | B                  Type union
```

### Port Notation

```
[Node]
  ├─► output1: Type1
  ├─► output2: Type2
  └─► output3: Type3

[Node]
  ◄── input1: Type1
  ◄── input2: Type2
  ◄── path: "nested.field"      (configuration)
```

### Complete Flow Example

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────┐                                                   │
│  │ Schema   │                                                   │
│  │ {id,name}│──schema──┐                                        │
│  └──────────┘          │                                        │
│                        ▼                                        │
│  API Data ──► [Filter] ──► [Pick] ──► [Sort] ──► [Slice]      │
│                  │            │         │           │           │
│              path:"active" (schema)  path:"name"  start:0      │
│              value:true               dir:asc     end:10       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Type flow:
  Array<User> → Array<User> → Array<{id,name}> → Array<{id,name}> → Array<{id,name}>
```

---

## Implementation Patterns

### Pattern 1: Simple Path-Based Transform

**Example**: ArrayPluck - Extract property from each element

```typescript
@Node({
  type: 'ArrayPluckNode',
  title: 'Array Pluck',
  description: 'Extract property from each object. Type: Array<T> × Path → Array<T[Path]>',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['array', 'pluck', 'extract', 'property', 'map'],
})
class ArrayPluckNode extends BaseNode {
  @Passthrough()
  @PortArray({
    title: 'Array',
    itemConfig: { type: 'any' },
    isSchemaMutable: true,
  })
  @OnPortUpdate(async (node, port) => {
    // Try to infer output type from array item type + path
    const pluckNode = node as ArrayPluckNode
    const arrayPort = port as ArrayPort
    const itemConfig = arrayPort.getConfig().itemConfig
    const resultPort = node.findPort(p => p.key === 'result') as ArrayPort

    if (!resultPort) return

    // If we have path and item is object, try to infer type at path
    if (pluckNode.path && itemConfig?.type === 'object') {
      const typeAtPath = getTypeAtPath(itemConfig, pluckNode.path)
      if (typeAtPath) {
        resultPort.setConfig({
          ...resultPort.getConfig(),
          itemConfig: deepCopy(typeAtPath),
        })
        node.updateArrayItemConfig(resultPort)
        return
      }
    }

    // Fallback: preserve as any
    resultPort.setConfig({
      ...resultPort.getConfig(),
      itemConfig: { type: 'any' },
    })
    node.updateArrayItemConfig(resultPort)
  })
  array: any[] = []

  @Input()
  @PortString({
    title: 'Path',
    description: 'Property path (e.g., "user.email", "items[0].name")',
    defaultValue: '',
  })
  path: string = ''

  @Output()
  @PortArray({
    title: 'Result',
    itemConfig: { type: 'any' },
  })
  result: any[] = []

  async execute(): Promise<NodeExecutionResult> {
    // Runtime: simple map with path navigation
    this.result = this.array.map(item => getByPath(item, this.path))
    return {}
  }
}
```

**Characteristics**:
- Edit-time: Attempts type inference from path
- Runtime: Uses flexible path navigation
- Hybrid approach

---

### Pattern 2: Schema-Based Transform

**Example**: ArrayPick - Project fields using schema template

```typescript
@Node({
  type: 'ArrayPickNode',
  title: 'Array Pick',
  description: 'Pick specific fields from objects. Type: Array<T> × Schema<K> → Array<K>',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['array', 'pick', 'project', 'transform', 'schema'],
})
class ArrayPickNode extends BaseNode {
  @Passthrough()
  @PortArray({
    title: 'Array',
    description: 'Array of objects to pick from',
    itemConfig: {
      type: 'object',
      schema: { properties: {} },
      isSchemaMutable: true,
    },
    isSchemaMutable: true,
  })
  array: object[] = []

  @Passthrough()
  @PortObject({
    title: 'Pick Schema',
    description: 'Define fields to extract (connect Object Node)',
    schema: { properties: {} },
    isSchemaMutable: true,
  })
  @OnPortUpdate(async (node, port) => {
    // Schema port defines output type
    const schemaPort = port as ObjectPort
    const resultPort = node.findPort(p => p.key === 'result') as ArrayPort
    if (!resultPort) return

    const schema = schemaPort.getConfig().schema
    resultPort.setConfig({
      ...resultPort.getConfig(),
      itemConfig: {
        type: 'object',
        schema: deepCopy(schema),
        isSchemaMutable: false,
      }
    })
    node.updateArrayItemConfig(resultPort)
  })
  pickSchema: Record<string, any> = {}

  @Output()
  @PortArray({
    title: 'Result',
    itemConfig: { type: 'object', schema: { properties: {} } },
  })
  result: object[] = []

  async execute(): Promise<NodeExecutionResult> {
    // Runtime: pick only schema keys
    const keys = Object.keys(this.pickSchema)
    this.result = this.array.map(item => {
      const picked: Record<string, any> = {}
      for (const key of keys) {
        if (item && key in item) {
          picked[key] = (item as any)[key]
        }
      }
      return picked
    })
    return {}
  }
}
```

**Characteristics**:
- Edit-time: Full type inference from schema port
- Runtime: Direct property access (pre-validated keys)
- Type-safe approach

---

### Pattern 3: Type Composition

**Example**: ArrayZip - Combine two arrays pairwise

```typescript
@Node({
  type: 'ArrayZipNode',
  title: 'Array Zip',
  description: 'Combine two arrays pairwise. Type: Array<A> × Array<B> → Array<{a:A, b:B}>',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['array', 'zip', 'combine', 'pair', 'merge'],
})
class ArrayZipNode extends BaseNode {
  @Passthrough()
  @PortArray({
    title: 'Array A',
    itemConfig: { type: 'any' },
    isSchemaMutable: true,
  })
  @OnPortUpdate((node) => (node as ArrayZipNode).updateResultType())
  arrayA: any[] = []

  @Passthrough()
  @PortArray({
    title: 'Array B',
    itemConfig: { type: 'any' },
    isSchemaMutable: true,
  })
  @OnPortUpdate((node) => (node as ArrayZipNode).updateResultType())
  arrayB: any[] = []

  @Input()
  @PortEnum({
    title: 'Length Strategy',
    description: 'How to handle arrays of different lengths',
    options: [
      { id: 'shortest', title: 'Use shortest array length' },
      { id: 'longest', title: 'Use longest (null for missing)' },
      { id: 'first', title: 'Use first array length' },
      { id: 'second', title: 'Use second array length' },
    ],
    defaultValue: 'shortest',
  })
  lengthStrategy: 'shortest' | 'longest' | 'first' | 'second' = 'shortest'

  @Output()
  @PortArray({
    title: 'Zipped',
    itemConfig: {
      type: 'object',
      schema: {
        properties: {
          a: { type: 'any' },
          b: { type: 'any' },
        }
      }
    },
  })
  result: Array<{ a: any; b: any }> = []

  private updateResultType() {
    const portA = this.findPort(p => p.key === 'arrayA') as ArrayPort
    const portB = this.findPort(p => p.key === 'arrayB') as ArrayPort
    const resultPort = this.findPort(p => p.key === 'result') as ArrayPort
    if (!resultPort) return

    const itemConfigA = portA?.getConfig().itemConfig || { type: 'any' }
    const itemConfigB = portB?.getConfig().itemConfig || { type: 'any' }

    // Compose types: {a: A, b: B}
    resultPort.setConfig({
      ...resultPort.getConfig(),
      itemConfig: {
        type: 'object',
        schema: {
          properties: {
            a: { ...deepCopy(itemConfigA), title: 'A', key: 'a' },
            b: { ...deepCopy(itemConfigB), title: 'B', key: 'b' },
          }
        },
        isSchemaMutable: false,
      }
    })
    this.updateArrayItemConfig(resultPort)
  }

  async execute(): Promise<NodeExecutionResult> {
    const lenA = this.arrayA?.length || 0
    const lenB = this.arrayB?.length || 0

    let length: number
    switch (this.lengthStrategy) {
      case 'shortest': length = Math.min(lenA, lenB); break
      case 'longest': length = Math.max(lenA, lenB); break
      case 'first': length = lenA; break
      case 'second': length = lenB; break
      default: length = Math.min(lenA, lenB)
    }

    this.result = []
    for (let i = 0; i < length; i++) {
      this.result.push({
        a: this.arrayA?.[i] ?? null,
        b: this.arrayB?.[i] ?? null,
      })
    }

    return {}
  }
}
```

---

## Composition Examples

### Example 1: Path-Based Pipeline

**Scenario**: Extract active users' emails

```
Input: Array<{id, name, email, active: boolean, role}>
Output: Array<string>

Flow:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  users[] ──► [ArrayFilter] ──► [ArrayPluck] ──► emails[]       │
│                   │                  │                          │
│              path: "active"     path: "email"                   │
│              operator: truthy                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Edit-time:
  Array<User> → Array<User> → Array<string> (if email type known)
                             → Array<any> (if type unknown)

Runtime:
  users.filter(u => u.active).map(u => u.email)

Advantages: Concise, flexible, runtime-adaptable
Limitations: Less type safety if schema not known
```

### Example 2: Schema-Based Pipeline

**Scenario**: Transform API response with type safety

```
Input: Array<{id, name, email, active, role, createdAt, updatedAt, meta}>
Output: Array<{id, name}>

Flow:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────┐                                                │
│  │ Object Node │ ← User creates schema visually                 │
│  │ {id, name}  │─────── schema ────────┐                        │
│  └─────────────┘                      │                         │
│                                       ▼                         │
│  API Response[] ────────────────► [ArrayPick] ──► Result[]     │
│  Array<FullUser>                                 Array<{id,name}>│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Edit-time:
  Schema port: {id: string, name: string}
  ArrayPick output: Array<{id: string, name: string}>
  (Fully typed!)

Runtime:
  apiResponse.map(u => ({ id: u.id, name: u.name }))

Advantages: Full type safety, visual type flow
Limitations: More verbose, static structure
```

### Example 3: Deep Navigation

**Scenario**: Extract nested array from API response

```
Input: {
  data: {
    response: {
      users: Array<{id, name, email}>
    }
  }
}
Output: Array<{id, name}>

Flow Option 1 (Path-Based):
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────┐                                                │
│  │ Object Node │                                                │
│  │ {id, name}  │──── schema ─────────────┐                      │
│  └─────────────┘                         │                      │
│                                          ▼                      │
│  API ──► [ObjectPluck] ──path:"data.response.users"──► [ArrayPick] │
│                                Array<User>                 ↓    │
│                                                    Array<{id,name}>│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Note: ObjectPluck would extract nested value using path

Flow Option 2 (TypeFocus - Better):
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────┐                                                │
│  │ Object Node │                                                │
│  │ {id, name}  │──── schema ─────────────┐                      │
│  └─────────────┘                         │                      │
│                                          ▼                      │
│  API ──► [TypeFocus] ──► Array<User> ──► [ArrayPick]           │
│               │                              │                  │
│          path: "data.response.users"        │                  │
│                                             ▼                  │
│                                   Array<{id, name}>            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Edit-time:
  TypeFocus navigates type structure
  Output inherits Array<User> type
  ArrayPick projects to {id, name}

Runtime:
  const users = response.data.response.users
  return users.map(u => ({ id: u.id, name: u.name }))
```

### Example 4: Multi-Stage Aggregation

**Scenario**: Calculate statistics from sales

```
Input: Array<{product, quantity, price, date}>
Output: {total: number, count: number, avgPrice: number}

Flow:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                  ┌──► [ArrayReduce] ──► total: number          │
│                  │         │                                    │
│                  │    operation: "sum"                          │
│                  │    path: "price"                             │
│                  │                                              │
│  Array<Sale> ───┼──► [ArrayReduce] ──► count: number          │
│                  │         │                                    │
│                  │    operation: "count"                        │
│                  │                                              │
│                  └──► [ArrayReduce] ──► avgPrice: number       │
│                          │                                      │
│                    operation: "avg"                             │
│                    path: "price"                                │
│                                                                 │
│  (Then collect into object via Gate or Object Construct node)  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Edit-time:
  Each ArrayReduce output is 'number' type

Runtime:
  total = sales.reduce((sum, s) => sum + s.price, 0)
  count = sales.length
  avgPrice = total / count
```

### Example 5: Partition and Process

**Scenario**: Split by condition, process branches differently

```
Input: Array<Order>
Output: {completed: Array<Summary>, pending: number}

Flow:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────┐                                                │
│  │ Object Node │                                                │
│  │ {id, total} │──── schema ───────────────┐                    │
│  └─────────────┘                           │                    │
│                                            ▼                    │
│                  ┌──► matching ──► [ArrayPick] ──► completed   │
│  Array<Order> ──►│                                              │
│                  │ [ArrayPartition]                             │
│                  │      │                                       │
│                  │  path: "status"                              │
│                  │  operator: "equals"                          │
│                  │  value: "completed"                          │
│                  │                                              │
│                  └──► nonMatching ──► [ArrayLength] ──► pending │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Edit-time:
  Both outputs preserve Array<Order> type
  ArrayPick transforms to Array<Summary>
  ArrayLength transforms to number

Runtime:
  const completed = orders.filter(o => o.status === 'completed')
  const pending = orders.filter(o => o.status !== 'completed').length
```

---

## Complete Node Specifications

### Array Access Nodes

#### ArrayFirst
```
Type: Array<T> → T
Edit-time: Extract item type from array
Runtime: Return array[0] or null
Outputs: element: T, isEmpty: boolean
```

#### ArrayLast
```
Type: Array<T> → T
Edit-time: Extract item type from array
Runtime: Return array[array.length-1] or null
Outputs: element: T, isEmpty: boolean
```

#### ArraySlice
```
Type: Array<T> → Array<T>
Inputs: array, start: number, end: number
Edit-time: Preserve item type
Runtime: array.slice(start, end)
```

### Array Transform Nodes

#### ArrayPick
```
Type: Array<T> × Schema<K> → Array<K>
Inputs: array, pickSchema (Object)
Edit-time: Output type = schema type
Runtime: Pick only schema fields from each element
```

#### ArrayPluck
```
Type: Array<T> × Path → Array<T[Path]>
Inputs: array, path: string
Edit-time: Infer type at path if possible, else any
Runtime: map(item => getByPath(item, path))
```

#### ArrayReverse
```
Type: Array<T> → Array<T>
Edit-time: Preserve item type
Runtime: [...array].reverse()
```

### Array Combination Nodes

#### ArrayConcat
```
Type: Array<A> × Array<B> → Array<A|B>
Inputs: arrayA, arrayB (multiple arrays possible)
Edit-time: Use first array's item type (or union if sophisticated)
Runtime: [...arrayA, ...arrayB]
```

#### ArrayZip
```
Type: Array<A> × Array<B> → Array<{a:A, b:B}>
Inputs: arrayA, arrayB, lengthStrategy
Edit-time: Compose object type from both inputs
Runtime: Pair elements by index
```

### Array Aggregation

#### ArrayReduce
```
Type: Array<T> × Operation × Path? → number | string | T
Inputs: array, operation, path?, separator?
Operations: sum, avg, min, max, count, first, last, concat, join
Edit-time: Output type based on operation
Runtime: Execute aggregation function
```

#### ArrayPartition
```
Type: Array<T> × Predicate → {matching: Array<T>, nonMatching: Array<T>}
Inputs: array, path, operator, value
Edit-time: Both outputs preserve input type
Runtime: Split array by predicate
```

### Type Algebra Nodes

#### TypeMerge
```
Type: Object<A> × Object<B> → Object<A & B>
Inputs: typeA, typeB (both objects)
Edit-time: Merge schemas
Runtime: Merge values
```

#### TypeUnwrap
```
Type: F<A> → A
Input: container (Array, Stream, etc.)
Edit-time: Extract inner type
Runtime: Return first element or identity
```

#### TypeWrap
```
Type: A → Array<A>
Input: element
Edit-time: Wrap type in array
Runtime: [element]
```

#### TypeFocus
```
Type: T × Path → T[Path]
Inputs: source, path: string
Edit-time: Navigate type structure
Runtime: Navigate value structure
```

### Object Utilities

#### ObjectKeys
```
Type: Object<T> → Array<string>
Edit-time: Always string[]
Runtime: Object.keys(object)
```

#### ObjectValues
```
Type: Object<T> → Array<ValueType<T>>
Edit-time: Infer value type if homogeneous
Runtime: Object.values(object)
```

---

## Summary

The Transforms system provides a **type-algebraic foundation** for visual data transformation with:

### Core Strengths

1. **Edit-time Type Safety** - Most type errors caught during flow building
2. **Composable Architecture** - Simple nodes combine into complex transformations
3. **Dual-Mode Design** - Schema references AND path navigation both supported
4. **Built-in Infrastructure** - Sophisticated path parsing, port hierarchy, batch updates
5. **Performance** - Minimal runtime overhead, maximum edit-time validation
6. **Visual Clarity** - Flow diagram reflects type signature and data flow

### Key Mechanisms

| Mechanism | Purpose | When |
|-----------|---------|------|
| **@OnPortUpdate** | Custom type inference | Edit-time |
| **Transfer Rules** | Automatic type propagation | Edit-time |
| **Path Parsing** | Runtime navigation | Execution-time |
| **Schema Templates** | Visual type definition | Edit-time |
| **Batch Updates** | Performance optimization | Both |

### Design Philosophy

**Balance** edit-time type safety with runtime flexibility:

- Use **schema references** when structure is known and type safety matters
- Use **path navigation** when structure varies or deep nesting makes composition impractical
- Use **hybrid approaches** for best of both worlds
- Always prefer **composition** over complexity
- Trust **edit-time validation** to minimize runtime checks

By following these patterns and leveraging ChainGraph's built-in capabilities, we create a powerful, type-safe transformation system that feels like functional programming made visual.

---

## Codebase Reference Guide

This section maps design concepts to actual codebase locations for quick reference.

### Core Type System

**Port Types & Instances**:
- `packages/chaingraph-types/src/port/instances/AnyPort.ts` - Dynamic type wrapper with `unwrapUnderlyingType()`
- `packages/chaingraph-types/src/port/instances/ArrayPort.ts` - Type-safe array container
- `packages/chaingraph-types/src/port/instances/ObjectPort.ts` - Type-safe object container
- `packages/chaingraph-types/src/port/base/index.ts` - Port configuration interfaces

**Transfer Rules (Automatic Type Propagation)**:
- `packages/chaingraph-types/src/port/transfer-rules/engine.ts` - Transfer rule engine
- `packages/chaingraph-types/src/port/transfer-rules/strategies.ts` - Reusable transfer strategies
- `packages/chaingraph-types/src/port/transfer-rules/predicates.ts` - Port matching predicates
- `packages/chaingraph-types/src/port/transfer-rules/rules/default-rules.ts` - Built-in connection rules
- `packages/chaingraph-types/src/port/transfer-rules/utils/schema-compatibility.ts` - Type compatibility checking

**Node Base Classes**:
- `packages/chaingraph-types/src/node/base-node-compositional.ts` - Base node with all helper methods
- `packages/chaingraph-types/src/node/implementations/complex-port-handler.ts` - Array/Object operations
- `packages/chaingraph-types/src/port/transfer-rules/utils/port-resolver.ts` - Port type resolution utilities

### Path Navigation System

**Built-in Path Parsing**:
- `packages/chaingraph-types/src/node/implementations/port-manager.ts` - `parsePathString()`, `findPortByPath()`, `getPortByPath()`
- `packages/chaingraph-types/src/node/implementations/indexed-port-manager.ts` - Optimized path lookups with indexing

**Key Methods**:
```typescript
// In port-manager.ts:
parsePathString(pathString: string): string[]          // line 368
findPortByPath(path: string[]): IPort | undefined      // line 132
getPortByPath(pathString: string): IPort | undefined   // line 416
buildPortPath(port: IPort): string[]                   // line 435
segmentsToPathString(segments: string[]): string       // line 462
```

### Decorators

**Type Inference Decorators**:
- `packages/chaingraph-types/src/decorator/port-update.decorator.ts` - `@OnPortUpdate` decorator
- `packages/chaingraph-types/src/decorator/object-schema-copy-to.decorator.ts` - `@ObjectSchemaCopyTo` helper
- `packages/chaingraph-types/src/decorator/port-visibility.decorator.ts` - `@PortVisibility` conditional display

**Port Decorators**:
- `packages/chaingraph-types/src/decorator/scalar.decorator.ts` - `@Input`, `@Output`, `@Passthrough`
- `packages/chaingraph-types/src/decorator/port.decorator.ts` - `@PortString`, `@PortNumber`, `@PortArray`, etc.

### Example Nodes (Reference Implementations)

**Simple Array Operations**:
- `packages/chaingraph-nodes/src/nodes/utilities/array-element.node.ts` - Extract by index with type inference
- `packages/chaingraph-nodes/src/nodes/data/array-length.node.ts` - Simple transformation
- `packages/chaingraph-nodes/src/nodes/data/filter-array-lucene.node.ts` - Complex filtering

**Dynamic Type Inference**:
- `packages/chaingraph-nodes/src/nodes/basic-values/array.node.ts` - Schema from connected port (lines 47-66)
- `packages/chaingraph-nodes/src/nodes/utilities/json-yaml-deserialize.node.ts` - Schema-based output (lines 52-85)
- `packages/chaingraph-nodes/src/nodes/utilities/string-to-enum.node.ts` - Generate enum from array (lines 68-114)

**Complex Port Manipulation**:
- `packages/chaingraph-nodes/src/nodes/flow/gate.node.ts` - Dynamic port creation, event handling (300+ lines)
- `packages/chaingraph-nodes/src/nodes/basic-values/object.ts` - Object schema management
- `packages/chaingraph-nodes/src/nodes/utilities/get-port-schema.node.ts` - Schema extraction and serialization

**Flow Control Patterns**:
- `packages/chaingraph-nodes/src/nodes/flow/branch.node.ts` - Comparison operators and predicates
- `packages/chaingraph-nodes/src/nodes/flow/emitter.node.ts` - Event emission pattern
- `packages/chaingraph-nodes/src/nodes/flow/switch.node.ts` - Multi-way branching

### Category System

**Category Definitions**:
- `packages/chaingraph-nodes/src/categories/constants.ts` - Category metadata, colors, ordering
- `packages/chaingraph-nodes/src/categories/icons/category-icons.ts` - Icon registry

**Add new category here**: Insert between lines 11-32 in `constants.ts`

### Utilities

**Helper Functions**:
- `packages/chaingraph-types/src/utils/deep-copy.ts` - Deep cloning (handles Date, Decimal, etc.)
- `packages/chaingraph-types/src/utils/deep-equal.ts` - Deep equality checking
- `packages/chaingraph-types/src/node/traverse-ports.ts` - `findPort()`, `filterPorts()` standalone functions

**Type Validation**:
- `packages/chaingraph-types/src/port/transfer-rules/utils/schema-compatibility.ts`:
  - `checkSchemaCompatibility()` - line 44
  - `isEmptyObjectSchema()` - line 321
  - `isMutableObjectPort()` - line 332

### Node Registration & Export

**Registration**:
- `packages/chaingraph-types/src/decorator/registry.ts` - `NodeRegistry` singleton

**Export Pattern**:
```
packages/chaingraph-nodes/src/
├── nodes/
│   ├── functional/              ← Create this directory
│   │   ├── index.ts            ← Export all functional nodes
│   │   ├── array/
│   │   │   ├── index.ts
│   │   │   └── *.node.ts
│   │   ├── type/
│   │   │   ├── index.ts
│   │   │   └── *.node.ts
│   │   └── object/
│   │       ├── index.ts
│   │       └── *.node.ts
│   └── index.ts                ← Add: export * from './functional'
└── index.ts                    ← Main package export
```

### Testing

**Test Examples**:
- `packages/chaingraph-types/src/port/__tests__/any-port-instance.test.ts` - Port type tests
- `packages/chaingraph-executor/server/dbos/__tests__/execution-e2e.test.ts` - End-to-end execution

### Quick Reference: Key Lines

**@OnPortUpdate Pattern** (from array-element.node.ts):
```typescript
// Line 58-85: Complete type inference example
@OnPortUpdate(async (node: INode, port: IPort) => {
  const elementPort = node.findPort(
    p => p.getConfig().key === 'element'
      && !p.getConfig().parentId
      && p.getConfig().direction === 'output',
  ) as AnyPort | undefined

  const arrayPort = port as ArrayPort
  const itemConfig = arrayPort.getConfig().itemConfig

  elementPort.setUnderlyingType(deepCopy({
    ...itemConfig,
    direction: elementPort.getConfig().direction,
    ui: { /* ... */ },
  }))
  node.refreshAnyPortUnderlyingPorts(elementPort as IPort, true)
})
```

**Schema Copy Pattern** (from array.node.ts):
```typescript
// Line 47-66: Schema port to array itemConfig
@OnPortUpdate(async (node: INode, port: IPort) => {
  const itemSchemaPort = port as AnyPort
  const underlyingType = itemSchemaPort.unwrapUnderlyingType()

  if (!underlyingType || underlyingType.type === 'any') {
    arrayNode.setArrayPortConfig('Array', { type: 'any' })
  } else {
    arrayNode.setArrayPortConfig('Array', arrayNode.createPortConfig(underlyingType))
  }
})
```

**Path Parsing** (from port-manager.ts):
```typescript
// Line 368-409: Full path parser implementation
protected parsePathString(pathString: string): string[] {
  // Handles: "a.b[0].c" → ["a", "b", "0", "c"]
}
```

### Development Workflow

1. **Read**: Study existing array/object nodes above
2. **Categorize**: Add to `categories/constants.ts`
3. **Implement**: Create node class with decorators
4. **Export**: Add to appropriate index.ts files
5. **Test**: Create test file in same directory
6. **Build**: Run `pnpm run typecheck` and `pnpm run build`

### Common Imports

```typescript
// Standard imports for Transform nodes
import type {
  AnyPort,
  ArrayPort,
  ArrayPortConfig,
  ExecutionContext,
  INode,
  IPort,
  NodeExecutionResult,
  ObjectPort,
  ObjectPortConfig,
} from '@badaitech/chaingraph-types'

import {
  BaseNode,
  deepCopy,
  Input,
  Node,
  OnPortUpdate,
  Output,
  Passthrough,
  PortAny,
  PortArray,
  PortBoolean,
  PortEnum,
  PortNumber,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'

import { NODE_CATEGORIES } from '../../../categories'
```

---

*This document serves as the canonical reference for designing and implementing Transform nodes in ChainGraph.*
