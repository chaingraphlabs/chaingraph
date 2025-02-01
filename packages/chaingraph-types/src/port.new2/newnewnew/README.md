# Port System Documentation

This directory contains a unified port system implementation that uses generic wrappers and centralized type registrations to ensure type safety and reduce code duplication.

## Core Concepts

### Port Structure

Each port consists of two main parts:

1. `config` - Configuration data that defines the port's behavior
2. `value` - The actual data contained in the port

Both parts follow a consistent wrapper pattern with a `type` discriminator:

```typescript
interface PortWrapper<T, Type extends PortTypeEnum> {
  type: Type
  value: T
}
```

## Key Components

### 1. Generic Helpers

#### Port Wrapper (portWrapper.ts)

Creates type-safe wrappers for port values:

```typescript
const StringPortValueSchema = createPortWrapperSchema(
  PortTypeEnum.String,
  z.string()
)
```

#### Port Config Schema (portConfigSchema.ts)

Creates configuration schemas with optional base fields:

```typescript
const StringPortConfigSchema = createPortConfigSchema(
  PortTypeEnum.String,
  z.object({}) // No extra fields for string ports
)
```

### 2. Central Registry (portTypeDefinitions.ts)

Single source of truth for all port type definitions:

```typescript
export const portTypeDefinitions = {
  [PortTypeEnum.String]: {
    configSchema: StringPortConfigSchema,
    valueSchema: StringPortValueSchema
  },
  // ... other port types
}
```

## Adding a New Port Type

1. Add the type to `PortTypeEnum`
2. Create config schema using `createPortConfigSchema`
3. Create value schema using `createPortWrapperSchema`
4. Register both schemas in the central registry

Example:

```typescript
// 1. Add to PortTypeEnum
enum PortTypeEnum {
  // ... existing types
  NewType = 'newtype'
}

// 2. Create config schema
const NewTypeConfigSchema = createPortConfigSchema(
  PortTypeEnum.NewType,
  z.object({
    extraField: z.string() // Any extra fields specific to this type
  })
)

// 3. Create value schema
const NewTypeValueSchema = createPortWrapperSchema(
  PortTypeEnum.NewType,
  z.number() // The inner value type
)

// 4. Register in central registry
portTypeDefinitions[PortTypeEnum.NewType] = {
  configSchema: NewTypeConfigSchema,
  valueSchema: NewTypeValueSchema
}
```

## Type Safety

The system provides compile-time and runtime type checking:

- Compile-time: TypeScript ensures correct type usage
- Runtime: Zod schemas validate data structure

Example:

```typescript
// Type-safe port creation
const stringPort: StringPort = {
  config: {
    type: PortTypeEnum.String,
    id: 'example'
  },
  value: {
    type: PortTypeEnum.String,
    value: 'Hello'
  }
}

// Runtime validation
const validated = FullPortSchema.parse(stringPort)
```

## Unwrapping System

The unwrapper provides safe access to port values:

```typescript
const port: StringPort = // ... port definition
const value = unwrapValue(port); // string
const mutable = unwrapMutableValue(port); // mutable proxy
```

## Best Practices

1. Always use the generic helpers to create new port types
2. Register all port types in the central registry
3. Use the unwrapper system for safe value access
4. Validate ports using Zod schemas before operations
5. Keep config and value schemas aligned with the same type discriminator

## Type Hierarchy

```
PortUnion
├── StringPort
├── NumberPort
├── BooleanPort
├── EnumPort
├── ArrayPort<T>
└── ObjectPort<Schema>
```

Each specialized port type follows the same structure but with specific config and value types.
