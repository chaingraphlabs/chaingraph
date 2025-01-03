# ChainGraph Port Types System Guide

This guide demonstrates how to use ChainGraph's port type system effectively with various examples, from basic to advanced usage.

## Basic Types

### Primitive Types

```typescript
import { PrimitivePortType, PrimitiveValue } from '@chaingraph/types'

// Basic primitive types
type StringPort = PrimitiveValue<PrimitivePortType.String>     // string
type NumberPort = PrimitiveValue<PrimitivePortType.Number>     // Decimal
type BooleanPort = PrimitiveValue<PrimitivePortType.Boolean>   // boolean

// Creating primitive port configurations
const stringPortConfig = createPrimitiveConfig(
  PrimitivePortType.String,
  'name',
  'Person Name',
  'John Doe'
)

const numberPortConfig = createPrimitiveConfig(
  PrimitivePortType.Number,
  'age',
  'Person Age',
  new Decimal(25)
)
```

### Array Types

```typescript
import { ArrayOf, createArrayConfig } from '@chaingraph/types'

// Simple arrays
type StringArray = ArrayOf<PrimitivePortType.String>      // string[]
type NumberArray = ArrayOf<PrimitivePortType.Number>      // Decimal[]

// Creating array configurations
const stringArrayConfig = createArrayConfig(
  PrimitivePortType.String,
  {
    id: 'names',
    name: 'Person Names',
    validation: {
      minLength: 1,
      maxLength: 10
    }
  }
)
```

### Object Types

```typescript
import { ObjectOf, ObjectPortConfig } from '@chaingraph/types'

// Define a person object configuration
type PersonConfig = {
  type: ComplexPortType.Object,
  properties: {
    name: {
      type: PrimitivePortType.String,
      config: PortConfig<PortType>
    },
    age: {
      type: PrimitivePortType.Number,
      config: PortConfig<PortType>
    },
    isStudent: {
      type: PrimitivePortType.Boolean,
      config: PortConfig<PortType>
    }
  }
}

// Create object type from configuration
type Person = ObjectOf<PersonConfig>
```

## Advanced Types

### Nested Arrays

```typescript
import { NestedArrayValue, Matrix, Cube } from '@chaingraph/types'

// Create multi-dimensional arrays
type StringMatrix = NestedArrayValue<PrimitivePortType.String, 2>    // string[][]
type NumberCube = NestedArrayValue<PrimitivePortType.Number, 3>      // Decimal[][][]
type Deep4D = NestedArrayValue<PrimitivePortType.Boolean, 4>         // boolean[][][][]

// Using convenience types
type NumberMatrix = Matrix<PrimitivePortType.Number>                 // Decimal[][]
type StringCube = Cube<PrimitivePortType.String>                    // string[][][]

// Creating nested array port types
const matrixPort = createNestedArrayType(PrimitivePortType.Number, 2)
const cubePort = createNestedArrayType(PrimitivePortType.String, 3)
```

### Complex Objects with Nested Structures

```typescript
// Define a complex data structure
type CourseConfig = {
  type: ComplexPortType.Object,
  properties: {
    id: {
      type: PrimitivePortType.String,
      config: PortConfig<PortType>
    },
    name: {
      type: PrimitivePortType.String,
      config: PortConfig<PortType>
    },
    scores: {
      type: ComplexPortType.Array,
      config: PortConfig<PortType>
    },
    students: {
      type: ComplexPortType.Array,
      config: PortConfig<PortType>
    }
  }
}

type Course = ObjectOf<CourseConfig>

// The resulting type will have this structure:
interface CourseStructure {
  id: string
  name: string
  scores: Decimal[]
  students: Array<{
    id: string
    name: string
    grade: Decimal
  }>
}
```

## Working with Port Validation

```typescript
import { PortConfig, PortValidation } from '@chaingraph/types'

// String port with validation
const emailPortConfig: PortConfig<PrimitivePortType.String> = {
  id: 'email',
  name: 'Email Address',
  type: PrimitivePortType.String,
  validation: {
    validator: async (value) => {
      return /^[^@]+@[^@]+\.[^@]+$/.test(value)
    },
    errorMessage: 'Invalid email format'
  }
}

// Number port with range validation
const scorePortConfig: PortConfig<PrimitivePortType.Number> = {
  id: 'score',
  name: 'Test Score',
  type: PrimitivePortType.Number,
  validation: {
    validator: async (value) => {
      return value.gte(0) && value.lte(100)
    },
    errorMessage: 'Score must be between 0 and 100'
  }
}
```

## Type Utilities

### Type Guards

```typescript
import { isPrimitivePortType, isComplexPortType } from '@chaingraph/types'

function processPortType(type: PortType) {
  if (isPrimitivePortType(type)) {
    // Handle primitive type
    console.log('Processing primitive type:', type)
  } else if (isComplexPortType(type)) {
    // Handle complex type
    console.log('Processing complex type:', type)
  }
}
```

### Value Extraction

```typescript
import { ExtractPortValue, ExtractConfigValue } from '@chaingraph/types'

// Extract value type from port type
type StringValue = ExtractPortValue<PrimitivePortType.String>    // string
type NumberArrayValue = ExtractPortValue<ComplexPortType.Array>  // Decimal[]

// Extract value type from port config
type ConfigValue = ExtractConfigValue<typeof emailPortConfig>    // string
```

## Best Practices

1. Always use type helpers when possible:
```typescript
// Good
type StringArray = ArrayOf<PrimitivePortType.String>

// Less maintainable
type StringArray = Array<PrimitiveTypeMap[PrimitivePortType.String]>
```

2. Use validation for runtime type safety:
```typescript
const portConfig: PortConfig<PrimitivePortType.Number> = {
  // ...
  validation: {
    validator: async (value) => {
      return value instanceof Decimal && value.isInteger()
    }
  }
}
```

3. Leverage type inference:
```typescript
// Let TypeScript infer complex types
const config = createPrimitiveConfig(PrimitivePortType.String, 'id', 'Name')
type InferredConfig = typeof config // PortConfig<PrimitivePortType.String>
```

## Common Patterns

### Creating Reusable Port Configurations

```typescript
// Base configuration factory
function createEmailPort(id: string, name: string): PortConfig<PrimitivePortType.String> {
  return {
    id,
    name,
    type: PrimitivePortType.String,
    validation: {
      validator: (value) => /^[^@]+@[^@]+\.[^@]+$/.test(value),
      errorMessage: 'Invalid email format'
    }
  }
}

// Usage
const userEmail = createEmailPort('userEmail', 'User Email')
const contactEmail = createEmailPort('contactEmail', 'Contact Email')
```

### Working with Complex Data Structures

```typescript
// Define a reusable address structure
type AddressConfig = {
  type: ComplexPortType.Object,
  properties: {
    street: {
      type: PrimitivePortType.String,
      config: PortConfig<PortType>
    },
    city: {
      type: PrimitivePortType.String,
      config: PortConfig<PortType>
    },
    zipCode: {
      type: PrimitivePortType.String,
      config: PortConfig<PortType>
    }
  }
}

// Use it in larger structures
type UserConfig = {
  type: ComplexPortType.Object,
  properties: {
    name: {
      type: PrimitivePortType.String,
      config: PortConfig<PortType>
    },
    homeAddress: AddressConfig,
    workAddress: AddressConfig
  }
}

type User = ObjectOf<UserConfig>
```

This guide demonstrates the flexibility and power of ChainGraph's port type system. For more specific use cases or detailed implementation examples, refer to the source code and tests.


```ts

// ----------------
// Usage Examples
// ----------------

// Primitive types
type StringVal = PrimitiveValue<PrimitivePortType.String> // string
type NumberArr = ArrayOf<PrimitivePortType.Number> // Decimal[]

// Nested arrays
type StringMatrix = Matrix<PrimitivePortType.String> // string[][]
type NumberCube = Cube<PrimitivePortType.Number> // Decimal[][][]
type StringCube = NestedArrayValue<PrimitivePortType.String, 3> // string[][][]
type String4D = NestedArrayValue<PrimitivePortType.String, 4> // string[][][][]

// Complex object example
interface PersonConfig {
    type: ComplexPortType.Object
    properties: Record<string, ObjectProperty> & {
        name: {
            type: PrimitivePortType.String
            config: PortConfig<PortType>
        }
        age: {
            type: PrimitivePortType.Number
            config: PortConfig<PortType>
        }
        hobbies: {
            type: ComplexPortType.Array
            config: PortConfig<PortType>
        }
    }
}

type PersonObject = ObjectOf<PersonConfig>

```