# Port Configuration System

This is a new implementation of the port configuration system that focuses on:

- Composition over inheritance
- Type safety through enums and TypeScript
- Serialization support with versioning
- Validation with Zod
- Backward compatibility

## Core Concepts

### 1. Port Configuration

Port configurations are built using composition rather than inheritance. Each port configuration combines:

- Base properties (common to all ports)
- Type-specific properties
- Optional validation rules

```typescript
import { PortDirection, PortType } from './config/constants'

// Example string port configuration
const stringPort = {
  // Base properties
  id: 'string-1',
  title: 'Text Input',
  direction: PortDirection.Input,

  // Type-specific properties
  type: PortType.String,
  defaultValue: '',
  validation: {
    minLength: 1,
    maxLength: 100
  }
}
```

### 2. Type Safety

The system provides strong type safety through TypeScript and enums:

- Enum-based type definitions
- Type inference for port configurations
- Type checking for port values
- Validation of configuration structure

```typescript
import { PortDirection, PortType } from './config/constants'
import { createPort } from './index'
import { validatePortConfig } from './validation/schemas'

// Configuration is validated at runtime
const config = validatePortConfig({
  type: PortType.Number,
  id: 'num-1',
  direction: PortDirection.Input,
  validation: {
    min: 0,
    max: 100
  }
})

// Port values are type-checked
const port = createPort(config)
port.setValue(42) // OK
port.setValue('42') // Type error
```

### 3. Serialization with Versioning

The system supports serialization of complex types including class instances, with built-in versioning support:

```typescript
import { VERSION } from './config/constants'
import { Serializable, SerializationRegistry } from './serialization/serializer'

class CustomClass implements Serializable {
  private static readonly CURRENT_VERSION = VERSION.INITIAL

  constructor(private data: string) {}

  serialize() {
    return {
      __type: 'CustomClass',
      __version: CustomClass.CURRENT_VERSION,
      __data: { value: this.data }
    }
  }

  static deserialize(data: SerializedData) {
    // Version migration support
    if (data.__version < CustomClass.CURRENT_VERSION) {
      // Apply migrations
      data.__data = this.migrateData(data.__data, data.__version)
    }
    return new CustomClass(data.__data.value)
  }

  private static migrateData(data: unknown, fromVersion: number): unknown {
    // Migration logic here
    return data
  }
}

// Register for serialization
SerializationRegistry.getInstance().registerClass('CustomClass', CustomClass)
```

### 4. Validation

Built-in validation using Zod schemas with custom error messages:

```typescript
import { PortType } from './config/constants'
import { validatePortConfig } from './validation/schemas'

// Validates at runtime
const config = validatePortConfig({
  type: PortType.Object,
  schema: {
    properties: {
      name: {
        type: PortType.String,
        validation: { minLength: 1 }
      },
      age: {
        type: PortType.Number,
        validation: { min: 0, integer: true }
      }
    },
    required: ['name']
  }
})
```

## Port Types

### Basic Types

- `PortType.String`: Text values
- `PortType.Number`: Numeric values
- `PortType.Boolean`: True/false values

### Complex Types

- `PortType.Array`: Lists of values
- `PortType.Object`: Structured data
- `PortType.Enum`: Selection from options
- `PortType.Stream`: Streaming data
- `PortType.Any`: Dynamic typing

### Example Configurations

```typescript
// Array of numbers
const numberArrayPort = {
  type: PortType.Array,
  elementConfig: {
    type: PortType.Number,
    validation: { min: 0 }
  },
  validation: {
    minItems: 1,
    maxItems: 10
  }
}

// Object with nested properties
const objectPort = {
  type: PortType.Object,
  schema: {
    properties: {
      name: { type: PortType.String },
      settings: {
        type: PortType.Object,
        schema: {
          properties: {
            enabled: { type: PortType.Boolean },
            value: { type: PortType.Number }
          }
        }
      }
    }
  }
}
```

## Migration Guide

### From Old System

1. Replace string literals with enums:

```typescript
// Old
interface MyPort extends BasePortConfig<PortKind.String> {
  defaultValue: string
}

// New
interface MyPort {
  type: PortType.String
  defaultValue: string
}
```

2. Update validation:

```typescript
// Old
const validation: StringPortValidation = {
  // ...
}

// New
const validation = {
  minLength: 1,
  maxLength: 100,
  pattern: '^[a-z]+$'
}
```

3. Update serialization with versioning:

```typescript
// Old
class MyClass extends PortBase {
  serializePort() { ... }
}

// New
class MyClass implements Serializable {
  private static readonly CURRENT_VERSION = VERSION.INITIAL;

  serialize() {
    return {
      __type: 'MyClass',
      __version: MyClass.CURRENT_VERSION,
      __data: { ... }
    };
  }

  static deserialize(data: SerializedData) {
    if (data.__version < MyClass.CURRENT_VERSION) {
      data.__data = this.migrateData(data.__data, data.__version);
    }
    return new MyClass(data.__data);
  }
}
```

## Best Practices

1. **Type Safety**

   - Use enums instead of string literals
   - Always use `validatePortConfig` for runtime validation
   - Let TypeScript infer types where possible
   - Use type guards for runtime checks

2. **Serialization**

   - Always include version numbers
   - Implement migration paths for version updates
   - Register all serializable classes
   - Handle serialization errors gracefully
   - Keep serialized data format stable

3. **Validation**

   - Define clear validation rules
   - Use appropriate validation for each type
   - Consider edge cases
   - Add custom error messages
   - Validate both input and output

4. **Testing**
   - Test serialization/deserialization with different versions
   - Verify type safety
   - Test validation rules
   - Check error handling
   - Test migration paths

## Error Handling

1. **Validation Errors**

   - Clear error messages
   - Type-specific validation failures
   - Path to error in nested objects

2. **Serialization Errors**

   - Version mismatch handling
   - Data corruption detection
   - Migration failures
   - Type mismatch errors

3. **Runtime Errors**
   - Type conversion failures
   - Invalid enum values
   - Missing required fields

## API Reference

See the following files for detailed API documentation:

- `config/constants.ts`: Enums and constants
- `config/types.ts`: Core type definitions
- `validation/schemas.ts`: Validation schemas
- `serialization/serializer.ts`: Serialization utilities
- `index.ts`: Main exports and examples
