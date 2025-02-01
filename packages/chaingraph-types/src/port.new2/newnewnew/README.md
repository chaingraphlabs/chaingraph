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

## Full Serialization Cycle

Our system guarantees a full cycle from strict port types to JSON strings and back:

1. **Port to JSONValue** (First Layer)

   - We convert a port (or any strict data type) to a JSONValue using `serialize()`
   - This conversion ensures type safety through `EnsureJSONSerializable<T>`
   - Special classes implementing `JSONSerializable` are handled automatically

2. **JSONValue to String** (Second Layer)

   - The JSONValue is converted to a string using `stringify()`
   - This step is validated using `JSONValueSchema`

3. **String to JSONValue** (Deserialization First Step)

   - JSON strings are parsed back to JSONValue using `parseJson()`
   - The result is validated against `JSONValueSchema`

4. **JSONValue to Port** (Deserialization Second Step)
   - The JSONValue is converted back to our strict type via Zod schemas
   - Type safety is maintained through the entire process

Example:

```typescript
// Serialization
const port: StringPort = { /* ... */ }
const jsonValue = serializePortToJSONValue(port) // First layer
const jsonString = serializePortToString(port) // Both layers

// Deserialization
const restoredValue = deserializePortFromString(jsonString)
const typedPort = deserializePortAs<StringPort>(jsonString, StringPortSchema)
```

## Type Safety

The system provides both compile-time and runtime type checking:

### Compile-Time

- TypeScript ensures correct type usage through inferred types
- `EnsureJSONSerializable<T>` guarantees JSON compatibility
- Generic constraints maintain type relationships

### Runtime

- Zod schemas validate data structure
- JSON schema validation ensures data integrity
- Automatic handling of special serializable classes

## Adding a New Port Type

1. Add the type to `PortTypeEnum`
2. Create config schema using `createPortConfigSchema`
3. Create value schema using `createPortWrapperSchema`
4. Register both schemas in the central registry
5. Ensure JSON serialization compatibility

Example:

```typescript
// 1. Add to PortTypeEnum
enum PortTypeEnum {
  NewType = 'newtype'
}

// 2. Create config schema
const NewTypeConfigSchema = createPortConfigSchema(
  PortTypeEnum.NewType,
  z.object({
    extraField: z.string()
  })
)

// 3. Create value schema
const NewTypeValueSchema = createPortWrapperSchema(
  PortTypeEnum.NewType,
  z.number()
)

// 4. Register in central registry
portTypeDefinitions[PortTypeEnum.NewType] = {
  configSchema: NewTypeConfigSchema,
  valueSchema: NewTypeValueSchema
}
```

## Best Practices

1. Always use the generic helpers to create new port types
2. Register all port types in the central registry
3. Use the unwrapper system for safe value access
4. Validate ports using Zod schemas before operations
5. Keep config and value schemas aligned with the same type discriminator
6. Ensure all types are JSON-serializable using `EnsureJSONSerializable`
7. Use the two-step serialization process for better type safety

## Type Hierarchy

```
PortUnion (derived from PortConfigUnionSchema)
├── StringPort
├── NumberPort
├── BooleanPort
├── EnumPort
├── ArrayPort<T>
└── ObjectPort<Schema>
```

Each specialized port type follows the same structure but with specific config and value types, all derived from the unified schemas and guaranteed to be JSON-serializable.

Note: In a forthcoming iteration, we will review and refactor the proxy logic in the unwrap system to further reduce duplication (especially between array and object handling).
