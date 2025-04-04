# @badaitech/chaingraph-types

Core type definitions and utilities for the ChainGraph flow-based programming framework. This package serves as the foundation for the entire ChainGraph ecosystem, providing a robust and type-safe infrastructure for building visual programming nodes, ports, flows, and execution engines.

![License](https://img.shields.io/badge/license-BUSL-blue.svg)

## Overview

`@badaitech/chaingraph-types` provides:

- **Type-Safe Port System**: Define ports with rich type systems including primitives, objects, arrays, streams, and more
- **Decorator-Based Node Creation**: Build nodes using intuitive TypeScript decorators
- **Event Management**: Powerful event handling mechanisms for node and flow communication
- **Flow Execution Engine**: Core classes for executing computational graphs
- **Serialization Utilities**: Robust serialization/deserialization support for all components

This package is designed to handle the complex type relationships between nodes, ports, and flows while providing a developer-friendly API for building visual programming components.

## Installation

```bash
# Before installing, make sure you have set up authentication for GitHub Packages
npm install @badaitech/chaingraph-types
# or
yarn add @badaitech/chaingraph-types
# or
pnpm add @badaitech/chaingraph-types
```

## Authentication for GitHub Packages

To use this package, you need to configure npm to authenticate with GitHub Packages:

1. Create a personal access token (PAT) with the `read:packages` scope on GitHub.
2. Add the following to your project's `.npmrc` file or to your global `~/.npmrc` file:

```
@badaitech:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Replace `YOUR_GITHUB_PAT` with your actual GitHub personal access token.

## Usage

### Creating a Node with Decorators

```typescript
import { 
  BaseNode, 
  ExecutionContext, 
  NodeExecutionResult,
  Node, 
  Input, 
  Output, 
  String, 
  Number 
} from '@badaitech/chaingraph-types';

@Node({
  title: 'Addition Node',
  description: 'Adds two numbers together',
  category: 'math',
})
class AdditionNode extends BaseNode {
  @Input()
  @Number({ defaultValue: 0 })
  a: number = 0;

  @Input()
  @Number({ defaultValue: 0 })
  b: number = 0;

  @Output()
  @Number()
  result: number = 0;

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.result = this.a + this.b;
    return {};
  }
}
```

### Handling Complex Port Types

#### Object Ports

```typescript
import { ObjectSchema, Port, PortObject, String, Number } from '@badaitech/chaingraph-types';

@ObjectSchema()
class UserProfile {
  @String()
  name: string = '';

  @Number({ min: 0, max: 120 })
  age: number = 0;
}

// In your node class:
@PortObject({
  schema: UserProfile,
  defaultValue: new UserProfile()
})
profile: UserProfile = new UserProfile();
```

#### Array Ports

```typescript
import { PortArray, PortArrayNumber } from '@badaitech/chaingraph-types';

// Array of numbers
@PortArrayNumber({ defaultValue: [1, 2, 3] })
numbers: number[] = [];

// Array with custom item configuration
@PortArray({
  itemConfig: { 
    type: 'string', 
    minLength: 2 
  }
})
strings: string[] = [];
```

#### Stream Ports

```typescript
import { PortStream, MultiChannel } from '@badaitech/chaingraph-types';

// Stream of strings
@PortStream({
  itemConfig: { type: 'string' }
})
dataStream: MultiChannel<string> = new MultiChannel<string>();

// Later in your code:
async processStream() {
  // Send data to the stream
  this.dataStream.send("Hello");
  this.dataStream.send("World");
  
  // Close the stream when done
  this.dataStream.close();
}

// Reading from a stream
async readStream() {
  for await (const item of this.dataStream) {
    console.log(item); // Prints "Hello", then "World"
  }
}
```

### Enum Ports

```typescript
import { 
  StringEnum, 
  NumberEnum, 
  PortEnumFromNative 
} from '@badaitech/chaingraph-types';

// String enum
@StringEnum(['Red', 'Green', 'Blue'], { defaultValue: 'Red' })
color: string = 'Red';

// Number enum
@NumberEnum([10, 20, 30], { defaultValue: '10' })
size: string = '10';

// From TypeScript enum
enum Direction {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT'
}

@PortEnumFromNative(Direction, { defaultValue: Direction.Up })
direction: Direction = Direction.Up;
```

### Creating and Executing a Flow

```typescript
import { 
  Flow, 
  ExecutionContext, 
  ExecutionEngine 
} from '@badaitech/chaingraph-types';

// Create a flow
const flow = new Flow({ name: "Simple Calculation Flow" });

// Add nodes
const addNode = new AdditionNode('add1');
addNode.initialize();
flow.addNode(addNode);

// Set values
addNode.a = 5;
addNode.b = 10;

// Execute the flow
const abortController = new AbortController();
const context = new ExecutionContext(flow.id, abortController);
const executionEngine = new ExecutionEngine(flow, context);

// Subscribe to events
executionEngine.onAll((event) => {
  console.log(`Event: ${event.type}`, event.data);
});

// Run the flow
await executionEngine.execute();

// Check results
console.log(`Result: ${addNode.result}`); // Should print 15
```

### Port Visibility Rules

```typescript
import { 
  PortVisibility, 
  Boolean, 
  String 
} from '@badaitech/chaingraph-types';

class ConditionalNode extends BaseNode {
  @Boolean({ defaultValue: false })
  showAdvanced: boolean = false;

  @PortVisibility({
    showIf: (node) => (node as ConditionalNode).showAdvanced
  })
  @String()
  advancedOption: string = '';
  
  // The advancedOption port will only be visible when showAdvanced is true
}
```

## Core Components

### Nodes

The `BaseNode` class is the foundation for all computational nodes and implements the `INode` interface. It provides:

- Port management
- Event handling
- Serialization/deserialization
- Execution lifecycle methods

### Ports

Ports are the inputs and outputs of nodes. The system supports various port types:

- **Primitive Ports**: String, Number, Boolean
- **Complex Ports**: Array, Object
- **Special Ports**: Stream, Enum, Any

### Flows

The `Flow` class represents a computational graph composed of nodes and edges. It provides:

- Node and edge management
- Graph validation
- Event propagation
- Serialization/deserialization

### Execution Engine

The `ExecutionEngine` handles flow execution with features like:

- Parallel execution support
- Dependency resolution
- Error handling
- Execution events
- Debugging capabilities

## Advanced Features

### Decorators

The package includes a rich set of decorators for defining nodes and ports:

- **@Node**: Main node class decorator
- **@Port**: Generic port decorator
- **@Input/@Output**: Port direction decorators
- **@String, @Number, @Boolean**: Basic type decorators
- **@PortArray, @PortObject, @PortStream**: Complex type decorators
- **@PortVisibility**: Conditional visibility control

### Event System

A comprehensive event system allows communication between components:

- Node events (status change, port updates)
- Flow events (node additions, edge connections)
- Execution events (start, completion, errors)

### Debugging Tools

Built-in debugging capabilities include:

- Breakpoints
- Step-by-step execution
- Execution event monitoring

## License

BUSL-1.1 - Business Source License

## Related Packages

- **@badaitech/chaingraph-frontend**: Frontend components for visual flow programming
- **@badaitech/chaingraph-backend**: Backend services for flow execution
- **@badaitech/chaingraph-nodes**: Collection of pre-built nodes
