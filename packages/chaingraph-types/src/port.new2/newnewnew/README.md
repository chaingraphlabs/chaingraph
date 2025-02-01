# Port System

The Port System is a highly extendable, type‑safe framework for defining, validating, serializing, and deserializing “ports” – data structures that wrap both configuration and value elements using a discriminated union. Built with TypeScript and powered by [Zod](https://github.com/colinhacks/zod) for runtime validation, this project ensures strict compile‑time and runtime type safety while reducing code duplication through a unified schema approach.

## Table of Contents

- [Core Concepts](#core-concepts)
    - [Port Structure](#port-structure)
    - [Generic Helpers](#generic-helpers)
    - [Central Registry](#central-registry)
- [Architecture Overview](#architecture-overview)
- [Usage Examples](#usage-examples)
    - [Creating and Using Ports](#creating-and-using-ports)
    - [Serialization / Deserialization](#serialization--deserialization)
    - [Unwrapping Values](#unwrapping-values)
- [Extending the System](#extending-the-system)
    - [Adding a New Port Type](#adding-a-new-port-type)
    - [Extending Existing Port Types](#extending-existing-port-types)
- [Testing and Validation](#testing-and-validation)
- [Contributing](#contributing)
- [License](#license)

## Core Concepts

### Port Structure

In the Port System every port is composed of two primary parts:

1. **Config**: The "configuration" section specifies the port’s behavior, metadata, and type discriminator.

2. **Value**: The "value" section wraps the actual data in a generic structure. Both config and value share the same `type` field, which is used as a discriminator.

Both parts follow the same common pattern called a *wrapper*. In TypeScript, this is defined as:

```typescript
interface PortWrapper<T, Type extends PortTypeEnum> {
  type: Type;
  value: T;
}
```

Every port value and configuration is built upon this structure, ensuring consistency between compile‑time types and runtime validations.

### Generic Helpers

To avoid code duplication and enforce a single source of truth, the system defines two generic helper modules:

- **portWrapper.ts**: Provides the `createPortWrapperSchema` function to create Zod schemas for port values. Example usage:

  ```typescript
  const StringPortValueSchema = createPortWrapperSchema(
    PortTypeEnum.String,
    z.string()
  );
  ```

- **portConfigSchema.ts**: Provides the `createPortConfigSchema` function to create Zod schemas for port configurations. It automatically merges a base configuration (with `id`, `name`, `metadata`) with type-specific fields. Example usage:

  ```typescript
  const StringPortConfigSchema = createPortConfigSchema(
    PortTypeEnum.String,
    z.object({}) // No extra fields for string ports
  );
  ```

### Central Registry

The **portTypeDefinitions.ts** file serves as the single source of truth where all port types are registered. It maps each value of `PortTypeEnum` to its corresponding configuration and value schemas, making it straightforward to extend the system:

```typescript
export const portTypeDefinitions = {
  [PortTypeEnum.String]: {
    configSchema: StringPortConfigSchema,
    valueSchema: StringPortValueSchema,
  },
  // ... other port types
};
```

## Architecture Overview

The Port System architecture combines both compile‑time type inference and runtime validation with the following key components:

- **Unified Zod Schemas**: All port configurations and values are defined using Zod. The unified union schemas (built via `z.discriminatedUnion`) ensure that every port adheres to its expected structure.
- **Type Derivation via z.infer**: Instead of manually maintaining TypeScript interfaces, the system uses `z.infer` to derive types directly from the Zod schemas. Specialized types (e.g. `IStringPortConfig`, `IStringPortValue`) are created using the Extract utility type.
- **Generic Factory Functions**: The generic helper functions abstract out repetitive logic in schema creation, offering a DRY solution for creating new port types.
- **Central Registration**: A single mapping in `portTypeDefinitions.ts` keeps all port type definitions in one place. New port types need only be added to this registry.
- **Unwrapping System**: Although complex and subject to future refactoring, the existing unwrapping system allows safe, mutable or immutable access to the raw data wrapped inside port values.

## Usage Examples

### Creating and Using Ports

Below is a basic example for creating a string port and a number port:

```typescript
import { PortTypeEnum } from './port-types.enum';
import type { StringPort, NumberPort } from './port-full';

const stringPort: StringPort = {
  config: {
    id: 'str1',
    type: PortTypeEnum.String,
    name: 'Example String Port',
  },
  value: {
    type: PortTypeEnum.String,
    value: 'Hello, World!',
  },
};

const numberPort: NumberPort = {
  config: {
    id: 'num1',
    type: PortTypeEnum.Number,
  },
  value: {
    type: PortTypeEnum.Number,
    value: 42.5,
  },
};
```

### Serialization / Deserialization

Ports can be safely serialized to JSON and then deserialized with full runtime validation using Zod. For instance:

```typescript
import { serializePort, deserializePort, deserializePortAs } from './port-serializer';
import { StringPortSchema, NumberPortSchema } from './custom-schemas';

const jsonString = serializePort(stringPort);
const restoredPort = deserializePort(jsonString); // Automatically validated

// Type-safe deserialization
const typedPort = deserializePortAs<StringPort>(jsonString, StringPortSchema);
console.log(typedPort.value.value.toUpperCase()); // Outputs uppercased string
```

### Unwrapping Values

The port unwrapper system allows you to access the plain inner values contained in ports. For example:

```typescript
import { unwrapValue, unwrapMutableValue } from './port-unwrapper';

const plainValue = unwrapValue(stringPort); // plainValue === "Hello, World!"
const mutableValue = unwrapMutableValue(stringPort); // Provides a mutable proxy
```

## Extending the System

### Adding a New Port Type

Adding a new port type requires only a few steps. For example, if you want to add a new port type called `NewType` that holds a number with an extra field, follow these steps:

1. **Update PortTypeEnum**

   Add the new type to your `port-types.enum.ts`:
   ```typescript
   export enum PortTypeEnum {
     // ... existing types
     NewType = 'newtype',
   }
   ```

2. **Create Config Schema**

   In your module where you define schemas (or a separate file), build a configuration schema using the generic helper:
   ```typescript
   import { createPortConfigSchema } from './common/portConfigSchema';
   import { PortTypeEnum } from './port-types.enum';
   import { z } from 'zod';

   const NewTypeConfigSchema = createPortConfigSchema(
     PortTypeEnum.NewType,
     z.object({
       extraField: z.string(), // Extra field specific to NewType
     })
   );
   ```

3. **Create Value Schema**

   Similarly, create a value schema using `createPortWrapperSchema`:
   ```typescript
   import { createPortWrapperSchema } from './common/portWrapper';

   const NewTypeValueSchema = createPortWrapperSchema(
     PortTypeEnum.NewType,
     z.number() // Use number as the inner value, for example
   );
   ```

4. **Register in Central Registry**

   Update the central registry (`portTypeDefinitions.ts`):
   ```typescript
   import { NewTypeConfigSchema } from './newTypeConfigSchema';
   import { NewTypeValueSchema } from './newTypeValueSchema';

   portTypeDefinitions[PortTypeEnum.NewType] = {
     configSchema: NewTypeConfigSchema,
     valueSchema: NewTypeValueSchema,
   };
   ```

5. **Derive Specialized Types**

   Optionally, you can use `z.infer` or the Extract utility to create specialized types for your new port:
   ```typescript
   export type INewTypeConfig = Extract<IPortConfigUnion, { type: PortTypeEnum.NewType }>;
   ```

That’s it! Your new port type now is fully integrated into the system with both compile‑time inference and runtime validation.

### Extending Existing Port Types

Sometimes, you might need to extend an existing port type with additional properties. The design of the system makes this straightforward—just modify the extra schema in the relevant helper call:

```typescript
// For example, extending the string port config with an additional field:
const ExtendedStringPortConfigSchema = createPortConfigSchema(
  PortTypeEnum.String,
  z.object({
    newExtraField: z.string().optional(),
  })
);
```

Then update the central registry if needed. Consumers of the type can now use these extended properties while all existing runtime and compile‑time validations continue to operate.
