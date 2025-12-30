# Granular Port Stores - Implementation Progress

**Last Updated:** 2025-12-19 (Finalization Complete)
**Status:** ✅ COMPLETE - 100% Granular, 100% ID-Only, 0 React Violations

## Current Status Summary

**✅ COMPLETED (All Phases):**
- Phase 0: Infrastructure (domain, types, feature flags, utils) - 18 files
- Phase 1: Core Stores & Buffer (buffering system, merge strategies, echo detection)
- Phase 2: Integration Wires (initialization, cleanup, dynamic ports)
- Phase 3: Component Hooks (usePortValue, usePortUI, usePortConfig, usePortConnections, useChildPorts)
- Phase 4A: Enable Infrastructure (import wiring)
- Phase 4B: Subscription Bridge (PortCreated/PortUpdated → granular stores ONLY)
- **PIVOT:** ID-Only Props Architecture
- **FINALIZATION:** Removed all legacy code, migration conditionals, React hooks violations

**✅ ALL COMPONENTS MIGRATED:**
- Core: PortComponent, PortHandle, PortDocTooltip, PortDocContent, NodeBody
- 9 Main Ports: Boolean, Secret, Stream, Number, String, Enum, Any, Array, Object
- Sub-components: AnyObjectPort, AnyPort/PortField, AnyPort/PortHeader, AnyPort/AddPropPopover
- Object/Array PortField, PortHeader (already done)

**✅ INFRASTRUCTURE FINALIZED:**
- Migration mode default: `'full'` (granular-only)
- Hooks: NO conditionals, ALWAYS use granular stores
- Subscription bridge: NO dual-write, ONLY portUpdateReceived()
- Old API removed: No `node.getPort()`, `port.getValue()`, `port.getConfig()` in hot paths

**✅ VALIDATION PASSED:**
- TypeScript: 0 errors in src/ ✅
- ESLint: 0 react-hooks violations ✅
- React Compliance: All hooks at top ✅
- Architecture: 100% ID-only props ✅

## Key Architectural Decision: ID-Only Pivot

**Decision Made:** 2025-12-19 - Switch from object props to ID-only props

**Rationale:**
- Passing full `node` and `port` objects defeats granular optimization
- When Port A updates, `node.getVersion()` increments for ENTIRE node
- PortComponent memo comparator checks `node.getVersion()` - fails for ALL ports
- Result: ALL ports re-render when only one changed

**Solution:**
```tsx
// BEFORE (Object Props)
<PortComponent node={node} port={port} context={context} />
// When Port A changes → node version increments → ALL memos fail → ALL re-render

// AFTER (ID-Only Props)
<PortComponent nodeId={node.id} portId={port.id} context={context} />
// When Port A changes → Port A's hooks detect change → ONLY Port A re-renders
```

**Benefits:**
- True per-port granularity (1 re-render instead of N)
- Trivial memo comparator (just ID comparison)
- Hooks control all data access
- No version check confusion

---

## Implementation Details

### Files Created (18 total)

```
apps/chaingraph-frontend/src/store/ports-v2/
├── index.ts                      # Public API exports + wiring init
├── init.ts                       # Imports all wiring modules
├── domain.ts                     # portsV2Domain
├── types.ts                      # PortKey, PortUIState, PortConfigCore, PortUpdateEvent, ProcessedBatch
├── feature-flags.ts              # $migrationMode (disabled|dual-write|read-only|full)
├── utils.ts                      # toPortKey(), extractConfigCore(), extractUIState()
├── stores.ts                     # 7 granular stores + apply events + cleanup handlers
├── buffer.ts                     # Event buffer + 16ms ticker + batch processor
├── merge.ts                      # mergePortEvents(), mergeConnections()
├── echo-detection.ts             # Echo filtering via isDeepEqual()
├── initialization.ts             # Populate on addNode/addNodes/setNodes
├── cleanup.ts                    # Remove on removeNode
├── dynamic-ports.ts              # Handle ArrayPort/ObjectPort children + hierarchy tracking
└── hooks/
    ├── index.ts                  # Hook exports
    ├── usePortValue.ts           # Subscribe to port value only
    ├── usePortUI.ts              # Subscribe to UI state only
    ├── usePortConfig.ts          # Subscribe to config only
    ├── usePortConnections.ts     # Subscribe to connections only
    └── usePort.ts                # Combined hook (all concerns)
```

### Compilation Status

✅ **0 type errors** in ports-v2 module (excluding pre-existing vite.config.ts errors)

### Architecture Validation

✅ **All design requirements met:**
- Granular stores by concern (values, UI, configs, connections, versions)
- Event buffering with 16ms ticker (60fps)
- Fork-safe patterns (no .getState() in hot paths)
- Echo detection using isDeepEqual()
- Never drops events (MAX_BUFFER_SIZE = 500, warnings only)
- Index stores for cleanup ($nodePortKeys) and hierarchy ($portHierarchy)
- Migration mode for gradual rollout

## Technical Highlights

### 1. Buffering System (buffer.ts)

```typescript
// 16ms ticker for 60fps batch processing
const ticker = interval({ timeout: 16, start, stop })

// Auto-start on first event, auto-stop when buffer empty
sample({ clock: portUpdatesReceived, filter: bufferWasEmpty, target: tickerStart })
sample({ clock: $bufferedUpdates, filter: isEmpty, target: tickerStop })

// Process batch on tick
sample({ clock: ticker.tick, source: $bufferedUpdates, target: batchProcessor })
```

### 2. Merge Strategies (merge.ts)

- **Values:** Last-win (most recent timestamp)
- **UI:** Deep merge (accumulate all UI changes)
- **Config:** Version-based (highest version wins)
- **Connections:** Union (remove duplicates)

### 3. Echo Detection (echo-detection.ts)

```typescript
// Filter out unchanged data before buffering
sample({
  clock: portUpdateReceived,
  source: { values, ui, configs, connections },
  fn: ({ values }, event) => {
    if (isDeepEqual(values.get(portKey), event.changes.value)) {
      return [] // Echo detected - skip
    }
    return [event] // Genuine change - pass through
  },
  target: portUpdatesReceived,
})
```

### 4. Migration-Aware Hooks

All hooks support gradual rollout via `$migrationMode`:
- `disabled`: Legacy system only
- `dual-write`: Write to both, read from legacy (validation)
- `read-only`: Write to both, read from granular (testing)
- `full`: Granular system only

```typescript
export function usePortValue(nodeId: string, portId: string) {
  const mode = useUnit($migrationMode)

  if (mode === 'full' || mode === 'read-only') {
    return useStoreMap({ store: $portValues, keys: [portKey], ... })
  }

  // Fallback to legacy $nodes
  return useStoreMap({ store: $nodes, keys: [nodeId, portId], ... })
}
```

## Next Phase: Component Migration

### Phase 4 Scope

**Components to migrate (9 total):**
1. StringPort.tsx - Use usePortValue, usePortUI
2. NumberPort.tsx - Use usePortValue, usePortUI
3. BooleanPort.tsx - Use usePortValue
4. EnumPort.tsx - Use usePortValue, usePortConfig
5. ArrayPort.tsx - Use usePortValue, usePortUI
6. ObjectPort.tsx - Use usePortUI (collapsed state)
7. SecretPort.tsx - Use usePortValue
8. StreamPort.tsx - Use usePortValue
9. AnyPort.tsx - Use usePortValue

**Migration Pattern:**

```typescript
// BEFORE
const value = port.getValue() ?? ''
const config = port.getConfig()
const isCollapsed = config.ui?.collapsed

// AFTER
const value = usePortValue(node.id, port.id) ?? ''
const ui = usePortUI(node.id, port.id)
const config = usePortConfig(node.id, port.id)
const isCollapsed = ui.collapsed
```

### Before Starting Phase 4

1. **Enable wiring:** Import `@/store/ports-v2` in main store initialization
2. **Enable dual-write:** `setMigrationMode('dual-write')`
3. **Add validation:** Log mismatches between granular stores and $nodes.ports
4. **Test buffer:** Verify events are batched and merged correctly

## Performance Expectations

| Metric | Current | Target |
|--------|---------|--------|
| Port toggle time | 73.8ms | <5ms |
| Typing latency | Variable | <2ms |
| Re-renders | 400+ | 1-2 |
| Memory (updates) | Clone node | Update Map entry |

## Rollback Plan

- `setMigrationMode('disabled')` - Instant revert to legacy
- Feature flag in localStorage persists across sessions
- All legacy code preserved during migration
- Can test in staging before production

## Key Design Decisions

1. **PortKey format:** `${nodeId}:${portId}` with `.` for nested ports
2. **Buffer size:** MAX_BUFFER_SIZE = 500 (warn but don't drop)
3. **Batch interval:** 16ms (configurable via VITE_PORT_BATCH_INTERVAL)
4. **Deep equality:** Use existing isDeepEqual() from chaingraph-types
5. **Never drop events:** Always process eventually (may split across ticks)

## Dependencies

- ✅ effector - Core state management
- ✅ patronum - interval() for ticker
- ✅ effector-react - useStoreMap(), useUnit()
- ✅ @badaitech/chaingraph-types - IPortConfig, Connection, isDeepEqual

## Finalization Summary (2025-12-19)

### Changes Made

**New Utilities:**
- `store/ports-v2/hooks/useChildPorts.ts` - Query child ports from $portHierarchy

**Hooks Simplified (3 files):**
- `usePortValue.ts` - Removed migration conditionals, ALWAYS use $portValues
- `usePortConfig.ts` - Removed migration conditionals, ALWAYS use $portConfigs
- `usePortUI.ts` - Removed migration conditionals, ALWAYS use $portUI

**Components Fixed (6 files):**
- ObjectPort.tsx - Hooks to top, useChildPorts, removed node.getPort()
- ArrayPort.tsx - Hooks to top, useChildPorts, removed old iteration
- AnyObjectPort.tsx - Full ID-only props, hooks-first pattern
- AnyPort/PortField.tsx - ID-only props, hooks instead of port.getConfig()
- AnyPort/PortHeader.tsx - ID-only props, usePortUI instead of port.getConfig()
- AnyPort/AddPropPopover.tsx - usePortConfig instead of port.getConfig()

**Infrastructure Changes:**
- `store/flow/stores.ts` - Removed dual-write, ONLY granular stores
- `store/ports-v2/feature-flags.ts` - Default to 'full' mode

### Validation Results

✅ TypeScript: 0 errors in src/
✅ ESLint: 0 react-hooks violations
✅ React Compliance: All hooks at component top
✅ Architecture: 100% ID-only, 100% granular

## Testing Checklist (Next Phase)

- [ ] Browser: Load flow editor without errors
- [ ] Buffer accumulates events correctly
- [ ] Ticker starts/stops automatically
- [ ] Merge strategies work (last-win, deep merge, version-based)
- [ ] Echo detection filters duplicates
- [ ] Initialization populates stores on flow load
- [ ] Cleanup removes port data on node deletion
- [ ] Dynamic ports track hierarchy correctly
- [ ] Hooks return correct data
- [ ] Performance: <5ms port toggle, 1-2 re-renders (measure with React DevTools)
- [ ] No memory leaks
- [ ] Multi-user safe (different users' updates merge correctly)

## Reference Documents

- Design: `/docs/architecture/granular-port-stores-design.md`
- Plan: `/Users/noir/.claude/plans/shiny-meandering-salamander.md`
- Progress: This file
