# ChainGraph Node & Decorator Documentation

Welcome to the ChainGraph Node & Decorator Documentation. This guide is designed to help you harness the full power of ChainGraph’s decorator–based approach to define nodes and their communication points (ports). By using a set of robust, type–safe decorators, you can create sophisticated nodes that not only encapsulate business logic but also bring along comprehensive metadata for validation, UI hints, and runtime control.

ChainGraph uses decorators to attach metadata to your node class definitions. This metadata drives the creation, validation, serialization, and behavior of nodes across both the application’s execution engine and the visual flow editor. Whether you are building simple scalar nodes or complex composite nodes with nested and array-based configurations, the decorators provide a clear, expressive, and scalable interface.

---

## Table of Contents

1. [Introduction](#1-introduction)
   1.1. [Overview of Nodes and Decorators](#11-overview-of-nodes-and-decorators)
   1.2. [Purpose of Decorator-Based Node Definitions](#12-purpose-of-decorator-based-node-definitions)
   1.3. [Benefits for Type–Safety and Readability](#13-benefits-for-typesafety-and-readability)

2. [Basic Concepts](#2-basic-concepts)
   2.1. [What Is a Node?](#21-what-is-a-node)
   2.2. [Understanding Ports (Inputs/Outputs)](#22-understanding-ports-inputsoutputs)
   2.3. [Overview of the Decorators Provided](#23-overview-of-the-decorators-provided)

3. [Getting Started with Node Decorators](#3-getting-started-with-node-decorators)
   3.1. [The @Node Decorator](#31-the-node-decorator)

   - [Purpose and basic usage](#purpose-and-basic-usage)
   - [Required metadata fields](#required-metadata-fields)
     3.2. [Defining Simple Scalar Nodes](#32-defining-simple-scalar-nodes)
   - [Declaring a basic node class with @Node](#declaring-a-basic-node-class-with-node)
   - [Using simple decorators (@Input, @Output)](#using-simple-decorators-input-and-output)
   - [Example: A node with string, number, and boolean ports](#example-a-node-with-string-number-and-boolean-ports)

4. [Defining Port Decorators](#4-defining-port-decorators)
   4.1. [The @Port Decorator](#41-the-port-decorator)
   4.2. [Scalar Port Decorators](#42-scalar-port-decorators)
   4.3. [Complex Port Decorators](#43-complex-port-decorators)

5. [Advanced Port Configuration with Decorators](#5-advanced-port-configuration-with-decorators)
   5.1. [Enum Port Decorators](#51-enum-port-decorators)
   5.2. [Object Schema Decorators](#52-object-schema-decorators)
   5.3. [Nested Structures and Array of Objects](#53-nested-structures-and-array-of-objects)

6. [Combining Decorators for Complex Nodes](#6-combining-decorators-for-complex-nodes)
   6.1. [Creating Composite Nodes with Multiple Port Types](#61-creating-composite-nodes-with-multiple-port-types)
   6.2. [Inheriting and Overriding Port Configurations](#62-inheriting-and-overriding-port-configurations)
   6.3. [Leveraging Metadata and Type Inference for Nested Structures](#63-leveraging-metadata-and-type-inference-for-nested-structures)
   6.4. [Example: A Full–Featured Node with Scalar, Object, Array, and Enum Ports](#64-example-a-fullfeatured-node-with-scalar-object-array-and-enum-ports)

---

Below you'll find detailed explanations and examples starting with the getting started guide and progressing toward complex composite node definitions.

## 1. Introduction

ChainGraph is a flow–based programming framework where the building blocks are "nodes" connected by "ports." Developers define these nodes using a set of TypeScript decorators, which later translate the node’s code into a well–structured, type–safe runtime description.

### 1.1 Overview of Nodes and Decorators

Nodes represent discrete units of computation or logic in a workflow graph. Every node has:

- **Metadata:** Descriptive data such as its title, description, category, and custom properties.
- **Ports:** Connection points where data enters (Inputs) or leaves (Outputs) the node.

Decorators are special annotations that you add to your node classes or fields to declare metadata and port configurations. These decorators let you define:

- The overall node characteristics via the `@Node` decorator.
- The input and output ports using `@Input`, `@Output`, and underlying port decorators such as `@String`, `@Number`, `@Array`, etc.

### 1.2 Purpose of Decorator-Based Node Definitions

The primary aim of using decorators for node definitions is to:

- **Simplify the code:** Developers can annotate plain TypeScript classes and properties rather than building complex configuration objects manually.
- **Centralize metadata:** All node properties and their configurations (default values, validations, UI hints, etc.) are stored via metadata attached to your classes. This makes nodes self–descriptive.
- **Enable automatic schema generation:** The decorator metadata is used to generate runtime schemas (using Zod) for validation and to generate API documentation.
- **Drive dynamic UI rendering:** The metadata informs the visual editor about how to render each node and its ports (e.g. labels, colors, input types).

### 1.3 Benefits for Type–Safety and Readability

Using decorators for node definitions in ChainGraph offers multiple benefits:

- **Type–Safety:**
  With strong TypeScript types and Zod schema validation, the system minimizes runtime errors. You get compile–time feedback when the node’s data or configuration does not match the expected format.
- **Enhanced Readability:**
  By directly annotating the class properties, the configuration is co–located with the business logic. This leads to cleaner code and easier maintenance.
- **Modularity and Reusability:**
  Decorators allow you to create reusable components. Once decorated, a node becomes a self–contained entity that can be instantiated in multiple flows.
- **Simplified Debugging:**
  Metadata information (like versioning information and UI hints) embedded via decorators helps in debugging and understanding the node’s intended behavior.

---

## 2. Basic Concepts

Before diving into complex node definitions, let’s review some basic concepts.

### 2.1 What Is a Node?

A **node** is a single unit of functionality within a flow. Each node:

- Contains a unique identifier.
- Has metadata (title, description, and additional custom data).
- Provides one or more ports that determine how data flows in and out of the node.
- Implements an `execute()` method that defines its runtime behavior.

Nodes are declared as TypeScript classes and decorated with the `@Node` decorator, which registers them within ChainGraph. For example:

```ts
import { BaseNode, Input, Node, Number, Output, String } from '@badaitech/chaingraph-types'

@Node({
  title: 'Simple Calculator',
  description: 'Calculates sum of two numbers',
})
class CalculatorNode extends BaseNode {
  @Input()
  @Number({ defaultValue: 0 })
  a: number = 0

  @Input()
  @Number({ defaultValue: 0 })
  b: number = 0

  @Output()
  @Number()
  result: number = 0

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.result = this.a + this.b
    return Promise.resolve({})
  }
}
```

In this example, the CalculatorNode is a basic node that takes two numbers as inputs and produces a sum on its output port.

### 2.2 Understanding Ports (Inputs/Outputs)

**Ports** are the connection points on a node:

- **Input Ports:** These are used to receive data into a node. They are defined using the `@Input` decorator.
- **Output Ports:** These are used to send data from a node. They are defined using the `@Output` decorator.

Each port can be further configured by specifying its type and additional constraints. For scalar values, you might use decorators like `@String`, `@Number`, or `@Boolean`. For complex data, you might use `@Array`, `@Object`, or `@Stream`.

For example, a node might define ports as follows:

```ts
class ExampleNode extends BaseNode {
  @Input()
  @String({ defaultValue: 'Hello, World!', minLength: 5 })
  greeting: string = 'Hello, World!'

  @Output()
  @String()
  reply: string = ''
}
```

This declares an input port “greeting” that is a string with validation (minimum length of 5), and an output port “reply.”

### 2.3 Overview of the Decorators Provided

ChainGraph’s decorator library provides several decorators, each serving a specific purpose. Common decorators include:

- **@Node(config)**
  Apply to a class to mark it as a node. The config specifies metadata such as title, description, category, tags, etc.

- **@Input() and @Output()**
  Indicate whether a class property is an input or an output port. These decorators help configure the port connection direction.

- **Scalar Port Decorators**

  - **@String(config?)**: Declares the property as a string port. It allows setting defaultValue, minLength, maxLength, and even regex pattern.
  - **@Number(config?)**: Declares the property as a number port with additional validations such as min, max, step, and integer constraints.
  - **@Boolean(config?)**: Declares a boolean port and can set a default boolean value.

- **Complex Port Decorators**
  - **@PortArray(config)**: Marks an array port. The configuration must include an `itemConfig` which defines how each element is validated.
  - **@PortObject(config)**: Applies to object ports. You must provide a `schema` (either a plain schema or a class decorated with @ObjectSchema) that defines the structure of the object.
  - **@PortStream(config)**: For stream ports that support continuous data passages (using an async channel).
  - **@PortEnum(config)**, **@StringEnum(options, config?)**, **@NumberEnum(options, config?)**: Used for enum ports to restrict the allowed values.
  - **@PortEnumFromObject(options, config?)** and **@PortEnumFromNative(nativeEnum, config?)**: Help create enum ports from objects or native enums.

Additionally, there are helper decorators for additional port configuration:

- **@Id(id)**: Override or define a unique identifier for a port.
- **@Name(name)**: Provide a custom display name for the port.
- **@Description(desc)**: Attach a description to the port.
- **@DefaultValue(value)**: Specify a default value for the port.

These decorators combine to form a powerful, declarative API making it simple to define nodes with robust type and runtime-checking support.

## 3. Getting Started with Node Decorators

The core idea behind ChainGraph is that every node in your flow is defined using decorators that attach metadata and configuration directly to your TypeScript classes. This makes it very intuitive to keep your business logic, type validation, and UI hints all in one place.

### 3.1. The `@Node` Decorator

The `@Node` decorator marks a class as a node within your flow. When you apply it, you provide a configuration object that defines key metadata for the node. This metadata is used by both the runtime (to know what kind of node it is) and the visual editor (to render a proper representation).

#### Purpose and Basic Usage

- **Purpose:**
  The `@Node` decorator registers your class as a node type and attaches metadata such as title, description, category, tags, etc. This metadata becomes part of the runtime configuration and is used to render nodes visually.

- **Basic Usage:**
  To use the `@Node` decorator, simply import it from your node package and annotate your class. For example:

  ```ts
  import { BaseNode, Node } from '@badaitech/chaingraph-types'

  @Node({
    title: 'Simple Calculator',
    description: 'Performs basic arithmetic operations',
    category: 'math',
    tags: ['arithmetic', 'math', 'calculator'],
  })
  class CalculatorNode extends BaseNode {
    async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
      // Your node execution logic goes here
      return {}
    }
  }
  ```

#### Required Metadata Fields

When using the `@Node` decorator, consider providing at least the following metadata fields:

- **`title`**: A friendly name for your node (e.g. "Simple Calculator").
- **`description`**: A brief explanation of the node's purpose (e.g. "Performs basic arithmetic operations").
- **`category`**: A grouping identifier (e.g. "math", "ai", "data") so that nodes appear in a logical group within the editor.
- **`tags`**: An array of keywords or labels that help categorize and search for nodes.

Additional properties such as `icon`, or `id` can also be specified if needed.

### 3.2. Defining Simple Scalar Nodes

After decorating your class as a node, the next step is to create properties that allow data to enter or exit your node. These properties are termed "ports" and are defined using input and output decorators.

#### Declaring a Basic Node Class with `@Node`

A basic node class is simply a TypeScript class decorated with `@Node` that extends a base node type (typically `BaseNode`). This class contains properties that are decorated to designate their role.

#### Using Simple Decorators (`@Input` and `@Output`)

- **`@Input`**
  Annotate a property with `@Input` to denote that it is a port that receives data.

- **`@Output`**
  Annotate a property with `@Output` to indicate that it is a port that sends data out from the node.

These decorators work together with type–specific decorators such as `@String`, `@Number`, or `@Boolean` to define what type of data is expected.

#### Example: A Node with String, Number, and Boolean Ports

The following example demonstrates a basic scalar node that receives a string, a number, and a boolean input, then produces an output string.

```ts
import { BaseNode, Boolean, ExecutionContext, ExecutionEventEnum, ExecutionEventImpl, Input, Node, NodeExecutionResult, NodeExecutionStatus, Number, Output, String } from '@badaitech/chaingraph-types'

@Node({
  title: 'Scalar Node',
  description: 'A node that handles simple scalar values',
  category: 'utilities',
})
class ScalarNode extends BaseNode {
  // Define an input port for a string value
  @Input()
  @String({
    title: 'Greeting Input',
    description: 'Enter a greeting message',
    defaultValue: 'Hello, World!',
    minLength: 5,
    maxLength: 50,
  })
  greeting: string = 'Hello, World!'

  // Define an input port for a number value
  @Input()
  @Number({
    title: 'Multiplier',
    description: 'A numeric factor',
    defaultValue: 2,
    min: 1,
    max: 10,
  })
  multiplier: number = 2

  // Define an input port for a boolean flag
  @Input()
  @Boolean({
    title: 'Enable Logging',
    description: 'Toggle logging output',
    defaultValue: false,
  })
  enableLog: boolean = false

  // Define an output port for the final message
  @Output()
  @String({
    title: 'Result Output',
    description: 'The processed result string',
  })
  result: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Basic logic: repeat greeting by multiplier
    this.result = this.greeting.repeat(this.multiplier)

    // Optionally log output if enabled
    if (this.enableLog) {
      console.log(`Node [${this.metadata.title}]: ${this.result}`)
    }

    return {}
  }
}
```

In the example above:

- `@Node` is applied to the class with required metadata (title, description, category).
- Scalar inputs are declared with `@Input` in combination with decorators such as `@String`, `@Number`, and `@Boolean`. Each of these type decorators allows you to specify default values and validation rules (e.g., minLength, min, max).
- A scalar output is declared using `@Output` along with the `@String` decorator.
- The `execute` method uses the provided input values to compute a result that is then stored in the `result` output port.

---

## 4. Defining Port Decorators

Ports are defined by annotating class properties using decorators that bind those properties to a specific port configuration. The decorators along with the underlying metadata determine how the node’s data is validated, serialized, and ultimately used in a flow.

### 4.1. The `@Port` Decorator

The `@Port` decorator is the fundamental decorator for binding a class property to a port configuration. It accepts a configuration object that must include at least the `type` field. This configuration is then stored as metadata associated with that property and later used by the node initialization process.

- **How it Binds a Property to a Port Configuration:**
  When you add the `@Port` decorator to a property, it gathers configuration options—in fields such as `type`, `defaultValue`, `ui`, etc.—and registers these with a metadata storage (using Reflect metadata under the hood). Later, when `node.initialize()` is called, the port configuration is read and used to instantiate the appropriate port instance.

- **Default Behaviors and Key Assignments:**
  If you do not specify a unique key in the configuration, the decorator automatically assigns the property name as the key. It also auto–generates an identifier, if not provided, based on the property name or using a generated UUID. This ensures that each port is uniquely addressable within the node.

### 4.2. Scalar Port Decorators

For simple (scalar) data types, ChainGraph provides dedicated decorators to simplify port declaration:

- **`@String`:**
  Declares a port for string values. The configuration can include validation rules like minimum and maximum length as well as a regular expression pattern. For example:

  ```ts
  @Input()
  @String({
    title: 'Message',
    description: 'Enter the message text',
    defaultValue: 'Hello',
    minLength: 5,
    maxLength: 100,
  })
  message: string = 'Hello'
  ```

- **`@Number`:**
  Declares a port that accepts numeric values. You can configure properties such as `min`, `max`, `step`, and whether the value must be an integer.

  ```ts
  @Input()
  @Number({
    title: 'Quantity',
    description: 'Enter a numeric quantity',
    defaultValue: 1,
    min: 1,
  })
  quantity: number = 1
  ```

- **`@Boolean`:**
  Declares a port for boolean values. This decorator can set a default boolean value and may include UI hints.

  ```ts
  @Input()
  @Boolean({
    title: 'Active Flag',
    description: 'Check if active',
    defaultValue: false,
  })
  isActive: boolean = false
  ```

These decorators automatically set the port's type to the appropriate scalar type, and they support adding further constraints and default values.

### 4.3. Complex Port Decorators

For more advanced data types, such as arrays and objects, specialized decorators are provided.

- **`@PortArray`:**
  Declares a port that holds an array. In addition to the standard configuration fields, it requires an `itemConfig` property that defines the configuration for each element in the array.

  ```ts
  @Input()
  @PortArray({
    title: 'String List',
    description: 'A list of string values',
    itemConfig: { type: 'string', minLength: 1 },
    defaultValue: ['item1', 'item2'],
  })
  stringList: string[] = ['item1', 'item2']
  ```

- **`@PortObject`:**
  Declares an object port. For an object port you must provide a `schema` which describes the expected object structure. The schema can be defined explicitly or be inferred from a class decorated with `@ObjectSchema`.

  ```ts
  import { ObjectSchema, PortObject } from '@badaitech/chaingraph-types'

  // Define an object schema class
  @ObjectSchema({
    description: 'User Profile Schema',
  })
  class UserProfile {
    @String({ defaultValue: 'John Doe' })
    name: string = 'John Doe'

    @Number({ defaultValue: 30, min: 1 })
    age: number = 30
  }

  // Use the schema in a node property
  class UserNode extends BaseNode {
    @Input()
    @PortObject({ schema: UserProfile })
    profile: UserProfile = new UserProfile()
  }
  ```

- **`@PortStream`:**
  Declares a stream port which represents a continuous data channel (wrapping a MultiChannel). It requires an `itemConfig` property to indicate the data type for the streamed items.

  ```ts
  @Output()
  @PortStream({
    title: 'Message Stream',
    description: 'Streams messages in real time',
    itemConfig: { type: 'string', defaultValue: '', minLength: 1 },
  })
  messageStream: MultiChannel<string> = new MultiChannel<string>()
  ```

#### Explanation of `itemConfig` (for Array and Stream Ports)

For port types that store multiple values (arrays and streams), the decorator requires an `itemConfig` property. This property is itself a port configuration that describes:

- What type each element must be (e.g. "string", "object")
- Any additional constraints for the element (such as minimum length for strings or nested schemas for objects)
- Default values to use if an element is not provided

This approach allows ChainGraph to recursively validate and serialize the content of composite data structures.

#### Example: A Node with an Object Port and Nested Array Port

Below is an example node that has an object port holding a user profile (with name and age) and an array port for a list of tags associated with the user:

```ts
import {
  BaseNode,
  ExecutionContext,
  ExecutionEventEnum,
  Input,
  Node,
  NodeExecutionStatus,
  Number,
  ObjectSchema,
  Output,
  PortArray,
  PortObject,
  String,
} from '@badaitech/chaingraph-types'

// Define a user profile schema using an object schema decorator
@ObjectSchema({
  title: 'User Profile Schema',
})
class UserProfile {
  @String({ defaultValue: 'Anonymous' })
  name: string = 'Anonymous'

  @Number({ defaultValue: 18, min: 18 })
  age: number = 18

  constructor(name: string, age: number) {
    this.name = name
    this.age = age
  }
}

// Define a node that uses both an object port and an array port
@Node({
  title: 'User Node',
  description: 'Node that accepts a user profile and list of tags',
})
class UserNode extends BaseNode {
  @Input()
  @PortObject({
    schema: UserProfile,
  })
  profile: UserProfile = new UserProfile('Alice', 30)

  @Input()
  @PortArray({
    title: 'Tags',
    description: 'List of user tags',
    itemConfig: { type: 'string', minLength: 1 },
  })
  tags: string[] = ['newbie', 'active']

  @Output()
  @String({
    title: 'Summary',
    description: 'Summary message',
  })
  summary: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const { name, age } = this.profile
    this.summary = `User ${name} (age ${age}) with tags: ${this.tags.join(', ')}`
    return {}
  }
}
```

In this example:

- The **UserNode** is defined with the `@Node` decorator.
- It uses the `@PortObject` decorator on the `profile` property, referencing a class decorated with an object schema (`UserProfile`).
- It also uses the `@PortArray` decorator on the `tags` property, with an `itemConfig` specifying string type and minimum length.
- The output port uses a simple `@String` decorator.
- In the node’s `execute` method, the input values from both ports are used to generate a summary message.

---

By following these guidelines, you can create simple nodes with scalar inputs and outputs as well as more complex nodes that involve composite and nested data. These decorator-based definitions not only reduce boilerplate but also enforce runtime validation and type safety across your flows.

## 5. Advanced Port Configuration with Decorators

This section explores more sophisticated techniques for configuring node ports. In addition to scalar types, you can declare enumerated values, object schemas and even nest arrays and objects for complex hierarchical data.

### 5.1. Enum Port Decorators

Enum port decorators allow you to restrict a port’s allowed values to a predefined set of options. This is especially useful for selection menus or cases where only a few choices are available.

#### @PortEnum, @StringEnum, and @NumberEnum

- **@PortEnum:**
  Use this decorator when you want to manually specify the list of options. Each option is defined as an object containing an identifier (`id`), a default value, a title, and optionally, extra configuration.
  _Example:_

  ```ts
  @Input()
  @PortEnum({
    title: 'Model',
    description: 'Select a language model',
    options: [
      { id: 'gpt4', type: 'string', defaultValue: 'GPT-4', title: 'GPT-4' },
      { id: 'gpt3', type: 'string', defaultValue: 'GPT-3', title: 'GPT-3' },
      { id: 'claude', type: 'string', defaultValue: 'Claude', title: 'Claude' },
    ],
    defaultValue: 'gpt4',
  })
  model: string = 'gpt4'
  ```

- **@StringEnum:**
  A helper decorator for enum ports when all options are strings. Simply pass an array of strings; the decorator will automatically build proper options.
  _Example:_

  ```ts
  @Input()
  @StringEnum(['small', 'medium', 'large'], { defaultValue: 'medium' })
  size: string = 'medium'
  ```

- **@NumberEnum:**
  Similar to @StringEnum except using number options.
  _Example:_
  ```ts
  @Input()
  @NumberEnum([1, 2, 3, 4], { defaultValue: '2' })
  level: number = 2
  ```

#### Configuring Options and Default Values

Each enum port decorator accepts a configuration object where you can specify:

- **options:** A list of allowed values.
- **defaultValue:** The id of the default option (typically provided as a plain string).
- **UI hints:** Optionally, provide custom UI styling (via the `ui` field).
  This ensures that only valid, pre–configured values can be assigned to the port.

#### Example: Enum Selection for a Node Property

Below is an example node using an enum port to select among different language models:

```ts
import { BaseNode, ExecutionContext, Input, Node, NodeExecutionStatus, PortEnum } from '@badaitech/chaingraph-types'

@Node({
  title: 'LLM Selector',
  description: 'Selects a language model.',
  category: 'ai',
})
class LLMSelectorNode extends BaseNode {
  @Input()
  @PortEnum({
    title: 'Model',
    description: 'Select the desired language model for processing',
    options: [
      { id: 'gpt4', type: 'string', defaultValue: 'GPT-4', title: 'GPT-4' },
      { id: 'gpt3', type: 'string', defaultValue: 'GPT-3', title: 'GPT-3' },
      { id: 'claude', type: 'string', defaultValue: 'Claude', title: 'Claude' },
    ],
    defaultValue: 'gpt4',
  })
  model: string = 'gpt4'

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Execution logic using the selected model
    console.log(`Selected model: ${this.model}`)
    return {}
  }
}
```

---

### 5.2. Object Schema Decorators

For ports that expect complex structured data, ChainGraph uses object schema decorators. This lets you annotate classes as schemas and then refer to these classes when defining object ports.

#### Using the `@ObjectSchema` Decorator

The `@ObjectSchema` decorator marks a class as an object schema. All class properties decorated with port decorators (e.g. `@String`, `@Number`, etc.) become part of that schema.

_Example:_

```ts
import { Number, ObjectSchema, PortObject, String } from '@badaitech/chaingraph-types'

@ObjectSchema({
  description: 'User Profile Schema',
})
class UserProfile {
  @String({ defaultValue: 'Anonymous' })
  name: string = 'Anonymous'

  @Number({ defaultValue: 18, min: 18 })
  age: number = 18
}
```

#### The `@PortObject` Decorator

Once you have an object schema, use the `@PortObject` decorator to bind that schema to a node property. This automatically enforces the structure defined in the schema for that port.

_Example:_

```ts
class UserNode extends BaseNode {
  @Input()
  @PortObject({
    schema: UserProfile,
  })
  profile: UserProfile = new UserProfile()
}
```

#### Example: A Node that Accepts Complex Objects

Below is an example node that accepts a complex user profile object:

```ts
import { BaseNode, ExecutionContext, ExecutionEventEnum, Input, Node, NodeExecutionStatus, Number, ObjectSchema, Output, PortObject, String } from '@badaitech/chaingraph-types'

// Define the user profile schema
@ObjectSchema({
  description: 'User Profile Schema',
})
class UserProfile {
  @String({ defaultValue: 'John Doe' })
  name: string = 'John Doe'

  @Number({ defaultValue: 30, min: 1 })
  age: number = 30
}

@Node({
  title: 'User Profile Node',
  description: 'Accepts and processes a user profile',
  category: 'data',
})
class UserProfileNode extends BaseNode {
  @Input()
  @PortObject({
    schema: UserProfile,
  })
  profile: UserProfile = new UserProfile()

  @Output()
  @String({
    title: 'Summary',
    description: 'Summary of user data',
  })
  summary: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.summary = `User ${this.profile.name} is ${this.profile.age} years old.`
    return {}
  }
}
```

---

### 5.3. Nested Structures and Array of Objects

In many cases, you’ll need to work with data that is nested or even an array of complex objects. ChainGraph supports nested definitions via `@PortArray` and the helper decorator `@PortArrayNested`.

#### Using `@PortArray` and `@PortArrayNested` Decorators

- **@PortArray:**
  Use this decorator to declare a port whose value is an array. In addition to general properties, you must provide an `itemConfig` property which describes the configuration for each item in the array.

  _Example:_

  ```ts
  @Input()
  @PortArray({
    title: 'Keywords',
    description: 'List of keywords',
    itemConfig: { type: 'string', minLength: 1 },
    defaultValue: ['alpha', 'beta'],
  })
  keywords: string[] = ['alpha', 'beta']
  ```

- **@PortArrayNested:**
  When you need arrays nested within arrays (for example, a 2D array or an array of arrays of objects), `@PortArrayNested` helps wrap your configuration recursively.

  _Example:_
  To define a 2D array of strings:

  ```ts
  @Input()
  @PortArrayNested(2, { type: 'string', defaultValue: '' })
  matrix: string[][] = [['a', 'b'], ['c', 'd']]
  ```

#### How to Nest Arrays or Objects within Array Ports

For arrays of objects, you can combine `@PortArray` with `@PortObject`. First, define an object schema with `@ObjectSchema` and then use that schema as the `itemConfig` for the array port.

_Example:_

```ts
import { Number, ObjectSchema, PortArray, PortObject, String } from '@badaitech/chaingraph-types'

// Define an item schema for an array of products.
@ObjectSchema({
  description: 'Product Schema',
})
class Product {
  @String({ defaultValue: 'Unnamed Product' })
  title: string = 'Unnamed Product'

  @Number({ defaultValue: 0, min: 0 })
  price: number = 0
}

class ProductListNode extends BaseNode {
  @Input()
  @PortArray({
    title: 'Products',
    description: 'List of products',
    itemConfig: {
      type: 'object',
      schema: Product,
    }
  })
  products: Product[] = [
    { title: 'Product A', price: 100 },
    { title: 'Product B', price: 150 },
  ]

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Process products as needed
    console.log('Products:', this.products)
    return {}
  }
}
```

#### Examples and Edge–Cases

- **Edge Case – Empty Array:**
  When an array port’s defaultValue is not provided, ensure that your logic handles an undefined or empty value properly.
- **Edge Case – Nested Arrays:**
  When using `@PortArrayNested`, the itemConfig is wrapped multiple times. Make sure you supply all required configuration at the innermost level.
- **Validation Across Nested Structures:**
  Each nested element is recursively validated against its configuration. If a nested value fails validation (e.g., a string too short), an error is generated indicating the position within the nested structure.

---

## 6. Combining Decorators for Complex Nodes

ChainGraph’s decorator system is designed to be composable and extendable. By combining multiple decorators on class properties, you can form complex nodes that integrate a mixture of data types. This section describes how to build composite nodes with multiple port types and leverage metadata for advanced scenarios.

### 6.1 Creating Composite Nodes with Multiple Port Types

A composite node might require several kinds of inputs (scalar, object, array, enum) and produce diverse outputs. Use the relevant decorators on each property to define your node’s required behavior.

_Example:_

```ts
@Node({
  title: 'Composite Node',
  description: 'A node that processes various types of data',
})
class CompositeNode extends BaseNode {
  // Scalar input ports
  @Input()
  @String()
  greeting: string = 'Hello'

  @Input()
  @Number({ min: 1 })
  count: number = 3

  // Object port using a defined schema
  @Input()
  @PortObject({
    schema: UserProfile, // UserProfile is a class decorated with @ObjectSchema
  })
  user: UserProfile = new UserProfile('Alice', 30)

  // Array port with nested objects (array of products, for example)
  @Input()
  @PortArray({
    title: 'Product List',
    itemConfig: { type: 'object', schema: Product },
  })
  products: Product[] = [
    { title: 'Product X', price: 50 },
    { title: 'Product Y', price: 75 },
  ]

  // Enum port for model selection
  @Input()
  @StringEnum(['small', 'medium', 'large'])
  size: string = 'medium'

  @Output()
  @String({ title: 'Summary' })
  summary: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Example logic: create a summary message combining all inputs
    this.summary = `${this.greeting}, ${this.user.name}! You selected a ${this.size} size and have ${this.products.length} products.`
    return {}
  }
}
```

### 6.2 Inheriting and Overriding Port Configurations

Nodes can inherit port configurations from base classes or override them locally:

- **Inheritance:** If you extend a node class, the child class can inherit port definitions from the parent.
- **Overriding:** You can also override metadata by re–decorating or by using decorator helpers (e.g. `@DefaultValue`, `@Name`, `@Description`) which update the underlying metadata without rewriting the entire configuration.

### 6.3 Leveraging Metadata and Type Inference for Nested Structures

The decorator system automatically collects metadata (using Reflect metadata) that describes a node’s ports and nested structure. This allows:

- Automatic generation of Zod schemas to validate your node configuration at runtime.
- Accurate type inference so that downstream code (like the visual editor) knows exactly what type of properties each node expects.
- Simple re–usability: once a node (or object schema) is defined, it can be shared across nodes without needing to duplicate schema definitions.

### 6.4 Example: A Full–Featured Node with Scalar, Object, Array, and Enum Ports

Below is a comprehensive example that combines multiple port decorators to create a complex node:

```ts
import {
  BaseNode,
  Boolean,
  ExecutionContext,
  ExecutionEventEnum,
  ExecutionEventImpl,
  Input,
  Node,
  NodeExecutionStatus,
  Number,
  Output,
  PortArray,
  PortObject,
  String,
  StringEnum,
} from '@badaitech/chaingraph-types'

// Object schema for user profile (pre–defined using @ObjectSchema)
@ObjectSchema({
  description: 'User Profile Schema',
})
class UserProfile {
  @String()
  name: string = 'Anonymous'

  @Number({ min: 18 })
  age: number = 18
}

// Object schema for a product
@ObjectSchema({
  description: 'Product Schema',
})
class Product {
  @String({ defaultValue: 'Unnamed Product' })
  title: string = 'Unnamed Product'

  @Number({ defaultValue: 0, min: 0 })
  price: number = 0
}

@Node({
  title: 'Full–Featured Node',
  description: 'A node showcasing multiple port types in one composite node',
  category: 'utilities',
  tags: ['composite', 'advanced'],
})
class FullFeaturedNode extends BaseNode {
  // Scalar ports
  @Input()
  @String()
  greeting: string = 'Hello'

  @Input()
  @Number({ min: 1 })
  count: number = 5

  @Input()
  @Boolean()
  isEnabled: boolean = true

  // Enum port: selection of size
  @Input()
  @StringEnum(['small', 'medium', 'large'])
  size: string = 'medium'

  // Complex object port with user profile
  @Input()
  @PortObject({
    schema: UserProfile,
  })
  user: UserProfile = new UserProfile()

  // Array port for list of products
  @Input()
  @PortArray({
    title: 'Products',
    description: 'List of products',
    itemConfig: { type: 'object', schema: Product }
  })
  products: Product[] = [
    { title: 'Product A', price: 100 },
    { title: 'Product B', price: 150 },
  ]

  // Output port for summary
  @Output()
  @String({
    title: 'Summary',
    description: 'Summary computed from inputs',
  })
  summary: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Compose a summary based on multiple port inputs
    this.summary = `${this.greeting} from ${this.user.name}! You selected a ${this.size} size, with a count of ${this.count} and ${this.products.length} products. Enabled: ${this.isEnabled}`
    return {}
  }
}
```

In this comprehensive example:

- Scalar inputs (string, number, boolean) are defined using their respective decorators.
- An enum input is declared using the @StringEnum decorator.
- A complex object input is defined via @PortObject with a pre–decorated `UserProfile` class.
- An array input is declared using @PortArray, whose item configuration is an object defined by a `Product` schema.
- The output port is a simple string port which outputs a summary composed from all the inputs.

Each decorator automatically manages the underlying metadata and runtime validation, ensuring that the node behaves as expected when executed.
