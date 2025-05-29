# Compositional Node Architecture

[![License](https://img.shields.io/badge/license-BSL-blue.svg)](LICENSE.txt)

## Overview

The Chaingraph Node System implements a modern, component-based architecture designed for flexibility, maintainability, and testability. It utilizes composition over inheritance, interface segregation, and dependency injection to create a modular node framework. Each node is composed of specialized components that handle different aspects of its functionality, following the Single Responsibility Principle.

## Table of Contents

- [Compositional Node Architecture](#compositional-node-architecture)
  - [Overview](#overview)
  - [Table of Contents](#table-of-contents)
  - [Architecture](#architecture)
    - [Design Principles](#design-principles)
    - [Component Delegation System](#component-delegation-system)
  - [Interfaces](#interfaces)
  - [Components](#components)
  - [Event System](#event-system)
  - [Port System](#port-system)
    - [Port Visibility Rules](#port-visibility-rules)
    - [Complex Port Handling](#complex-port-handling)
  - [Serialization Mechanism](#serialization-mechanism)
  - [Node Lifecycle](#node-lifecycle)
  - [Usage Examples](#usage-examples)
    - [Creating a Custom Node](#creating-a-custom-node)
    - [Working with Complex Ports](#working-with-complex-ports)
    - [Implementing Event Handling](#implementing-event-handling)
    - [Using Port Visibility Rules](#using-port-visibility-rules)
  - [Testing](#testing)
  - [Benefits](#benefits)

## Architecture

![Node Architecture](./docs/node-architecture.png)

The node architecture is based on a composition pattern where each node functionality is encapsulated in a specialized component. The `BaseNodeCompositional` class serves as a facade that delegates tasks to these components.

```
┌─────────────────────────────────┐
│         BaseNodeCompositional   │
├─────────────────────────────────┤
│ - portManager                   │
│ - portBinder                    │
│ - complexPortHandler            │
│ - eventManager                  │
│ - uiManager                     │
│ - versionManager                │
│ - serializer                    │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│         INodeComposite          │
└───────────────┬─────────────────┘
                │
      ┌─────────┴─────────┐
      │                   │
┌─────▼──────┐      ┌─────▼──────┐
│ ICoreNode  │      │ IPortManager│
└────────────┘      └────────────┘
      ...                ...
```

### Design Principles

The compositional node architecture is guided by several key design principles:

1. **Composition Over Inheritance**: Instead of building a complex inheritance hierarchy, the system uses composition to build functionality by combining simple, focused components.

2. **Interface Segregation Principle (ISP)**: Each interface is focused on a specific aspect of node functionality, ensuring that implementing classes only need to be concerned with relevant methods.

3. **Dependency Injection**: Components are injected into the `BaseNodeCompositional` class, allowing for easier testing and flexibility in implementation.

4. **Single Responsibility Principle (SRP)**: Each component handles a single aspect of node functionality, making the system more maintainable and easier to understand.

5. **Open/Closed Principle**: The system is open for extension (through new component implementations) but closed for modification (the core architecture remains stable).

### Component Delegation System

The delegation system works by:

1. **Constructor Initialization**: During construction, the BaseNodeCompositional creates and initializes all required components.

2. **Interface Implementation**: The base class implements multiple interfaces by delegating calls to the appropriate component.

3. **Component Interconnection**: Where needed, components have references to each other to handle complex operations that span multiple areas of responsibility.

4. **Method Forwarding**: Public methods on the BaseNodeCompositional forward calls to the appropriate component, often with pre/post processing where necessary.

For example, when calling `node.updatePort(port)`, the call is delegated to the portManager component, but also triggers the version incrementing and event emission, showing how the facade coordinates across components.

## Interfaces

The system is built around these core interfaces:

| Interface             | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `ICoreNode`           | Essential node properties and lifecycle methods |
| `IPortManager`        | Port storage and operations                     |
| `IPortBinder`         | Port binding to object properties               |
| `IComplexPortHandler` | Complex (object/array) port operations          |
| `INodeUI`             | UI-related node operations                      |
| `INodeEvents`         | Event system functions                          |
| `ISerializable`       | Serialization and deserialization               |
| `INodeVersioning`     | Version tracking                                |
| `INodeComposite`      | Combines all interfaces into one                |

Each interface follows the Interface Segregation Principle (ISP), focusing on a specific aspect of node functionality. This design allows for:

1. **Focused Testing**: Each interface can be tested independently
2. **Clear Boundaries**: Clear delineation of responsibilities
3. **Flexible Implementation**: Different implementations can be provided for specific interfaces

The `INodeComposite` interface aggregates all other interfaces, providing a unified API for working with nodes while maintaining the architectural separation internally.

## Components

The system includes these implementation components:

| Component            | Purpose                                         |
| -------------------- | ----------------------------------------------- |
| `PortManager`        | Manages port storage and retrieval              |
| `PortBinder`         | Binds ports to properties using getters/setters |
| `ComplexPortHandler` | Handles object/array port operations            |
| `NodeEventManager`   | Manages event subscriptions and emissions       |
| `NodeUIManager`      | Handles node UI operations                      |
| `NodeVersionManager` | Tracks node version                             |
| `NodeSerializer`     | Handles serialization/deserialization           |

Each component encapsulates a specific aspect of node functionality:

- **PortManager**: Stores ports in a Map and provides methods for retrieving, adding, and removing ports. It handles queries for inputs/outputs and filtering ports based on various criteria.

- **PortBinder**: Creates bidirectional bindings between ports and node properties using JavaScript's Object.defineProperty. This ensures that when a property is modified, the corresponding port's value is updated and vice versa.

- **ComplexPortHandler**: Provides specialized operations for working with complex object and array ports, including adding/removing properties and items, and handling nested structures.

- **NodeEventManager**: Implements the pub/sub pattern for event handling, allowing components to emit events and subscribe to events from other components.

- **NodeUIManager**: Manages UI-related metadata and operations, including position, dimensions, and visual properties.

- **NodeVersionManager**: Handles version incrementing and tracking, ensuring that changes to the node are properly versioned.

- **NodeSerializer**: Implements serialization and deserialization for the entire node state, including ports, metadata, and status.

## Event System

The event system in the compositional architecture is a crucial component that enables communication between different parts of a node and between nodes. Key aspects of the event system include:

1. **Event Types**: The system defines several event types, including:
   - `PortUpdate`: Emitted when a port's value or configuration changes
   - `StatusChange`: Emitted when a node's status changes
   - `UIChange`: Emitted when UI properties change
   - `ParentChange`: Emitted when a node's parent changes

2. **Event Propagation**: Events propagate through the node's components via the NodeEventManager, which implements a publisher-subscriber pattern.

3. **Event Handlers**: Nodes can implement custom event handlers by overriding the `onEvent` method, which is called for all events emitted by the node.

4. **Event Subscription**: External components can subscribe to specific event types or all events using the `on` and `onAll` methods.

5. **Automatic Event Handling**: The base implementation handles common event processing tasks, such as applying visibility rules when port values change.

The event flow works as follows:
1. A component calls `node.emit(event)`
2. The event is published to all subscribers
3. The node's `onEvent` method is called
4. Derived node classes process the event as needed
5. The system applies automatic actions like visibility rule processing

This architecture enables reactive programming patterns where changes in one part of the system automatically trigger updates in other parts.

## Port System

Ports are the primary means of data input and output for nodes. The port system in this architecture provides powerful mechanisms for handling various types of data and complex structures.

### Port Visibility Rules

Port visibility is managed through a declarative rule system using the `@PortVisibility` decorator. This enables conditional visibility based on the state of the node:

1. **Declarative Rules**: Developers define visibility conditions using the `showIf` function, which takes the node instance and returns a boolean.

2. **Automatic Application**: The system automatically applies visibility rules when events occur, updating port UI configuration.

3. **Event-Driven Updates**: When a port value changes, the system automatically re-evaluates visibility rules for all ports.

4. **Serialization Support**: Visibility state is preserved through serialization and deserialization.

The implementation ensures that:
- Visibility rules are evaluated consistently
- UI updates occur without manual intervention
- Port visibility state is preserved when nodes are saved and loaded

### Complex Port Handling

The system provides robust support for complex data structures through specialized port types and handling mechanisms:

1. **Object Ports**: Represent structured data with named properties
   - Dynamic property addition/removal
   - Nested property binding
   - Schema-based validation

2. **Array Ports**: Represent collections of items
   - Dynamic item addition/removal
   - Indexed access to items
   - Array manipulation operations

3. **Recursive Port Processing**: The system recursively processes nested port structures, ensuring proper binding and event propagation at all levels.

4. **Port Configuration Processor**: Automatically processes port configurations, inferring missing properties and ensuring consistent configuration.

Complex port operations include:
- `addObjectProperty`: Adds a property to an object port
- `removeObjectProperty`: Removes a property from an object port
- `updateArrayItemConfig`: Updates the items with new item configuration
- `appendArrayItem`: Adds an item to an array port
- `removeArrayItem`: Removes an item from an array port
- `recreateArrayItemPorts`: Rebuilds port structure for array items

These operations maintain proper binding between the port value and the node property, ensuring data consistency.

## Serialization Mechanism

The serialization system enables saving and loading node states, including all ports, metadata, and configuration:

1. **Complete State Capture**: All aspects of a node's state are serialized, including:
   - Core properties (id, metadata, status)
   - Port configurations and values
   - UI properties
   - Custom state

2. **Recursive Serialization**: The system handles nested structures by recursively serializing complex ports.

3. **Deserialization Process**:
   - Create a new node instance
   - Populate core properties
   - Recreate all ports from serialized data
   - Rebind ports to node properties
   - Restore port values

4. **Port Rebinding**: After deserialization, the system automatically rebinds all ports to their corresponding node properties using the PortBinder component.

This mechanism ensures that nodes can be saved and restored with all their state intact, enabling persistent storage of node configurations.

## Node Lifecycle

A node in this architecture goes through several lifecycle phases:

1. **Construction**: When a node is created, all components are initialized and connected.

2. **Initialization**: The `initialize` method processes port configurations, creates ports, establishes bindings, and applies initial visibility rules.

3. **Active State**: During normal operation, the node responds to events, processes port updates, and maintains internal state.

4. **Execution**: When the `execute` method is called, the node performs its primary function based on input port values and produces output.

5. **Serialization/Deserialization**: Nodes can be serialized to save their state and deserialized to restore it.

6. **Disposal**: The `dispose` method cleans up resources, closes event subscriptions, and prepares the node for garbage collection.

Each phase is handled by specific components working together through the facade provided by BaseNodeCompositional.

## Usage Examples

### Creating a Custom Node

```typescript
import { BaseNodeCompositional, ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types';
import { Port, Node } from '@badaitech/chaingraph-types/decorator';

@Node({
  title: 'Custom Node',
  description: 'A custom node implementation',
})
export class CustomNode extends BaseNodeCompositional {
  @Port({
    type: 'string',
    direction: 'input',
  })
  inputText: string = '';

  @Port({
    type: 'string',
    direction: 'output',
  })
  outputText: string = '';

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Process input and set output
    this.outputText = this.inputText.toUpperCase();
    return {};
  }
  
  // Optional: Override onEvent to handle specific events
  async onEvent(event: NodeEvent): Promise<void> {
    // Call parent implementation first to ensure standard processing
    await super.onEvent(event);
    
    // Custom event handling logic
    if (event.type === NodeEventType.PortUpdate &&
        event.port?.getConfig().key === 'inputText') {
      // Respond to input text changes
      console.log(`Input text changed to: ${this.inputText}`);
    }
    
    return Promise.resolve();
  }
}
```

### Working with Complex Ports

```typescript
// Object port example
@Port({
  type: 'object',
  schema: {
    properties: {
      name: { type: 'string' },
      age: { type: 'number' }
    }
  }
})
person: { name: string, age: number } = { name: 'John', age: 30 };

// Modify an object property
this.person.name = 'Jane'; // Automatically updates the port

// Add a new property dynamically
const personPort = this.findPortByKey('person');
this.addObjectProperty(
  personPort!, 
  'email',
  { type: 'string', defaultValue: 'jane@example.com' }
);

// Array port example
@Port({
  type: 'array',
  itemConfig: {
    type: 'string'
  }
})
tags: string[] = ['important', 'urgent'];

// Update items with new configuration using API
this.updateArrayItemConfig(tagsPort!);

// Add an item
this.tags.push('follow-up'); // Automatically updates port

// Add an item using API
const tagsPort = this.findPortByKey('tags');
this.appendArrayItem(tagsPort!, 'critical');

// Remove an item
this.removeArrayItem(tagsPort!, 1); // Removes 'urgent'
```

### Implementing Event Handling

```typescript
class EventAwareNode extends BaseNodeCompositional {
  // ... port definitions ...
  
  constructor(id: string) {
    super(id);
    
    // Subscribe to specific event type
    this.on(NodeEventType.PortUpdate, this.handlePortUpdate.bind(this));
    
    // Subscribe to all events
    this.onAll(this.logAllEvents.bind(this));
  }
  
  private handlePortUpdate(event: PortUpdateEvent): void {
    console.log(`Port ${event.port.getConfig().key} updated to ${event.port.getValue()}`);
  }
  
  private logAllEvents(event: NodeEvent): void {
    console.log(`Event received: ${event.type} at ${event.timestamp}`);
  }
  
  // Override onEvent for integrated event handling
  async onEvent(event: NodeEvent): Promise<void> {
    // Always call super.onEvent first to handle built-in behavior
    await super.onEvent(event);
    
    // Custom handling based on event type
    switch (event.type) {
      case NodeEventType.StatusChange:
        this.handleStatusChange(event as StatusChangeEvent);
        break;
      // Handle other event types...
    }
    
    return Promise.resolve();
  }
  
  private handleStatusChange(event: StatusChangeEvent): void {
    const { oldStatus, newStatus } = event;
    console.log(`Status changed from ${oldStatus} to ${newStatus}`);
  }
}
```

### Using Port Visibility Rules

```typescript
class ConditionalNode extends BaseNodeCompositional {
  @Port({
    type: 'string',
    direction: 'input',
  })
  mode: string = 'simple';
  
  @Port({
    type: 'number',
    direction: 'input',
  })
  @PortVisibility({
    showIf: (instance) => (instance as ConditionalNode).mode === 'advanced'
  })
  advancedSetting: number = 0;
  
  @Port({
    type: 'boolean',
    direction: 'input',
  })
  showDebugOptions: boolean = false;
  
  @Port({
    type: 'string',
    direction: 'input',
  })
  @PortVisibility({
    showIf: (instance) => (instance as ConditionalNode).showDebugOptions
  })
  debugMode: string = 'none';
  
  // No additional code needed - visibility is handled automatically
  // When mode changes to 'advanced', advancedSetting becomes visible
  // When showDebugOptions becomes true, debugMode becomes visible
}
```

## Testing

The component-based design makes testing significantly easier:

```typescript
// Testing ports
it('should update port values correctly', () => {
  const node = new TestNode();
  node.initialize();
  
  // Test port value changes
  node.inputValue = 42;
  expect(node.getPort('inputValue')?.getValue()).toBe(42);
});

// Testing events
it('should emit events on status change', () => {
  const node = new TestNode();
  const events: NodeEvent[] = [];
  
  node.onAll((event) => events.push(event));
  node.setStatus(NodeStatus.Running, true);
  
  expect(events.length).toBe(1);
  expect(events[0].type).toBe(NodeEventType.StatusChange);
});

// Testing port visibility
it('should update port visibility based on conditions', async () => {
  const node = new ConditionalNode();
  node.initialize();
  
  const advancedPort = node.findPortByKey('advancedSetting');
  expect(advancedPort?.getConfig().ui?.hidden).toBe(true);
  
  // Change mode to trigger visibility update
  node.mode = 'advanced';
  await node.updatePort(node.findPortByKey('mode')!);
  
  // Port should now be visible
  expect(advancedPort?.getConfig().ui?.hidden).toBe(false);
});

// Testing complex ports
it('should handle object property additions', () => {
  const node = new ComplexNode();
  node.initialize();
  
  const configPort = node.findPortByKey('config');
  node.addObjectProperty(configPort!, 'timeout', { 
    type: 'number', 
    defaultValue: 1000 
  });
  
  expect(node.config.timeout).toBe(1000);
});
```

## Benefits

- **Better Maintainability**: Each component focuses on a single responsibility, making the code easier to understand and modify.

- **Improved Testability**: Components can be tested in isolation, allowing for more focused and reliable tests.

- **Higher Flexibility**: Components can be extended or replaced independently, enabling customization without affecting the entire system.

- **Clearer Architecture**: Better separation of concerns through the interface segregation principle.

- **Type Safety**: Strong typing throughout the system, catching errors at compile time rather than runtime.

- **Reactive Programming**: The event system enables reactive patterns where changes automatically propagate through the system.

- **Declarative Configuration**: Port configuration and visibility rules use a declarative approach, reducing boilerplate code.

- **Comprehensive Serialization**: Complete state preservation through serialization/deserialization.
