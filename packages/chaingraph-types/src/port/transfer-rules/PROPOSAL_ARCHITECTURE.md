# Transfer Rules System Architecture

## Overview

The Transfer Rules System is a unified, functional approach to handling port connections in ChainGraph. It replaces the existing separate systems for compatibility checking and propagation actions with a single, composable rule engine.

## Problem Statement

The current architecture has two separate systems:
1. **Compatibility Rules**: Determine if ports can connect
2. **Propagation Actions**: Handle data/schema transfer after connection

This separation leads to:
- Code duplication
- Complex maintenance
- Inconsistent behavior
- Difficulty adding new port types
- ~1500 lines of code across multiple files

## Solution

A unified Transfer Rules System that:
- **Combines** compatibility checking and transfer logic
- **Uses** functional composition and predicates
- **Provides** a declarative rule definition syntax
- **Reduces** complexity from ~1500 to ~400 lines

## Core Concepts

### 1. Predicates
Pure functions that test port configurations:
```typescript
type PortPredicate = (port: IPortConfig) => boolean
```

Predicates are composable:
- `and(...predicates)` - All must match
- `or(...predicates)` - Any must match  
- `not(predicate)` - Inverse match

### 2. Transfer Strategies
Pure functions that perform the actual transfer:
```typescript
type TransferStrategy = (context: TransferContext) => TransferResult
```

Strategies are composable:
- `compose(...strategies)` - Sequential execution
- `when(condition, then, else?)` - Conditional execution

### 3. Transfer Rules
Combine predicates and strategies:
```typescript
interface TransferRule {
  name: string
  source: PortPredicate      // Match source port
  target: PortPredicate      // Match target port
  transfer: TransferStrategy  // What to transfer
  priority?: number          // Rule precedence
}
```

### 4. Rule Engine
Lightweight orchestrator that:
1. Finds matching rules based on predicates
2. Executes transfer strategies
3. Returns results

## Architecture Benefits

### Unified System
- **Single source of truth**: One rule defines both compatibility and transfer
- **Consistency**: Same logic for validation and execution
- **Simplicity**: No need to sync two separate systems

### Functional Design
- **Composable**: Build complex rules from simple parts
- **Testable**: Pure functions are easy to test
- **Readable**: Rules read like specifications
- **Type-safe**: Full TypeScript support

### Extensibility
- **New port types**: Just add predicates and strategies
- **Custom rules**: Easy to define domain-specific behavior
- **Plugin-friendly**: Rules can be loaded dynamically

## File Structure

```
packages/chaingraph-types/src/port/transfer-rules/
├── PROPOSAL_ARCHITECTURE.md     # This document
├── index.ts                     # Public API exports
├── types.ts                     # Core type definitions
├── predicates.ts                # Predicate library
├── strategies.ts                # Transfer strategy library
├── engine.ts                    # Rule engine implementation
├── rules/
│   ├── index.ts                # Rule aggregation
│   ├── object-rules.ts         # Object port rules
│   ├── array-rules.ts          # Array port rules
│   ├── any-rules.ts            # Any port rules
│   └── default-rules.ts        # Default/fallback rules
├── utils/
│   ├── port-resolver.ts        # Port config resolution utilities
│   └── helpers.ts               # Helper functions
└── __tests__/
    ├── predicates.test.ts
    ├── strategies.test.ts
    ├── engine.test.ts
    └── integration.test.ts
```

## Usage Examples

### Basic Usage
```typescript
import { TransferEngine, defaultRules } from '@/port/transfer-rules'

const engine = new TransferEngine(defaultRules)

// Check compatibility
const canConnect = engine.canConnect(sourcePort, targetPort)

// Execute transfer
const result = engine.transfer(sourcePort, targetPort, sourceNode, targetNode)
```

### Custom Rule Definition
```typescript
import { Predicates, Strategies, TransferEngine } from '@/port/transfer-rules'

const customRule = {
  name: 'my-custom-rule',
  source: Predicates.and(
    Predicates.isObject,
    port => port.schema?.properties?.customField !== undefined
  ),
  target: Predicates.isMutableObject,
  transfer: Strategies.compose(
    Strategies.objectSchema,
    Strategies.value
  ),
  priority: 100
}

engine.addRule(customRule)
```

### Builder Pattern
```typescript
const rule = TransferEngine
  .rule('string-to-any')
  .from(Predicates.isType('string'))
  .to(Predicates.isAny)
  .transfer(Strategies.compose(
    Strategies.setUnderlyingType,
    Strategies.value
  ))
  .withPriority(75)
```

## Migration Strategy

### Phase 1: Implementation (Current)
1. Create transfer-rules system
2. Implement all existing compatibility checks as rules
3. Implement all propagation actions as strategies

### Phase 2: Integration
1. Add `TransferEngine` to `Flow` class
2. Replace `PropagationEngine` with transfer rule execution
3. Replace `PortCompatibilityChecker` with rule matching

### Phase 3: Deprecation
1. Mark old systems as deprecated
2. Update documentation
3. Provide migration guide

### Phase 4: Cleanup
1. Remove old compatibility system
2. Remove old propagation actions
3. Update tests

## Common Port Connection Cases

### Case 1: Object → Mutable Object
- **Predicate**: Source is object, target is mutable object
- **Transfer**: Schema + Value
- **Use case**: Dynamic schema adaptation

### Case 2: Any{Object} → Mutable Object
- **Predicate**: Source is Any with underlying object, target is mutable object
- **Transfer**: Unwrap, then Schema + Value
- **Use case**: Generic nodes to typed nodes

### Case 3: Any{Object} → Any
- **Predicate**: Source is Any with underlying, target is Any
- **Transfer**: Set underlying type + Value
- **Use case**: Type propagation through generic nodes

### Case 4: Object → Immutable Object
- **Predicate**: Source is object, target is immutable object
- **Transfer**: Value only
- **Use case**: Typed data flow

### Case 5: Object → Any
- **Predicate**: Source is object, target is Any
- **Transfer**: Set underlying type + Value
- **Use case**: Typed to generic conversion

### Case 6: Array → Array{Any Items}
- **Predicate**: Source is array, target has any/no item config
- **Transfer**: Item config + Value
- **Use case**: Array type propagation

## Performance Considerations

- **Rule Matching**: O(n) where n = number of rules
- **Predicate Evaluation**: Pure functions, no side effects
- **Transfer Execution**: Minimal object creation
- **Memory**: Rules are shared, not duplicated

## Testing Strategy

1. **Unit Tests**
   - Each predicate function
   - Each strategy function
   - Rule matching logic

2. **Integration Tests**
   - Common connection scenarios
   - Complex nested structures
   - Edge cases

3. **Migration Tests**
   - Ensure backward compatibility
   - Validate same behavior as old system

## Future Extensions

1. **Rule Validation**: Detect conflicting or redundant rules
2. **Rule Debugging**: Trace which rules matched and why
3. **Dynamic Rules**: Load rules from configuration
4. **Rule Analytics**: Track rule usage and performance
5. **Visual Rule Editor**: UI for creating rules

## Conclusion

The Transfer Rules System provides a clean, functional, and extensible solution for managing port connections. By unifying compatibility checking and data transfer into a single rule-based system, we achieve:

- **Reduced complexity**: ~70% less code
- **Better maintainability**: Declarative rules
- **Improved extensibility**: Easy to add new behaviors
- **Enhanced testability**: Pure functions
- **Consistent behavior**: Single source of truth

This architecture sets a solid foundation for the future evolution of ChainGraph's port system.