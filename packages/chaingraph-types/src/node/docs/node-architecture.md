# Chaingraph Node Architecture

## Compositional Architecture Overview

```mermaid
classDiagram
    %% Main Class
    class BaseNodeCompositional {
        -_id: string
        -_metadata: NodeMetadata
        -_status: NodeStatus
        -portManager: PortManager
        -portBinder: PortBinder
        -complexPortHandler: ComplexPortHandler
        -eventManager: NodeEventManager
        -uiManager: NodeUIManager
        -versionManager: NodeVersionManager
        -serializer: NodeSerializer
        +execute(context: ExecutionContext)
        +initialize(portsConfig?)
        +onEvent(event: NodeEvent)
        +updatePort(port: IPort)
        +emit(event)
        +applyPortVisibilityRules()
    }

    %% Interfaces
    class INodeComposite {
        <<interface>>
    }

    class ICoreNode {
        <<interface>>
        +id: string
        +metadata: NodeMetadata
        +status: NodeStatus
        +setMetadata(metadata)
        +setStatus(status)
        +validate()
        +reset()
        +dispose()
    }

    class IPortManager {
        <<interface>>
        +ports: Map<string, IPort>
        +getPort(portId)
        +hasPort(portId)
        +getInputs()
        +getOutputs()
        +setPort(port)
        +setPorts(ports)
        +removePort(portId)
        +findPortByPath(path)
        +getChildPorts(parentPort)
        +updatePort(port)
    }

    class IPortBinder {
        <<interface>>
        +bindPortToNodeProperty(targetObject, port)
        +rebuildPortBindings()
        +initializePortsFromConfigs(portsConfigs)
        +rebindAfterDeserialization()
    }

    class IComplexPortHandler {
        <<interface>>
        +addObjectProperty(objectPort, key, portConfig, useParentUI)
        +removeObjectProperty(objectPort, key)
        +updateArrayItemConfig(arrayPort)
        +appendArrayItem(arrayPort, value)
        +removeArrayItem(arrayPort, index)
        +processPortConfig(config, context)
        +recreateArrayItemPorts(arrayPort, newArray)
        +refreshAnyPortUnderlyingPorts(anyPort, useParentUI)
    }

    class INodeEvents {
        <<interface>>
        +on(eventType, handler)
        +onAll(handler)
        +emit(event)
    }

    %% Components
    class PortManager {
        -ports: Map<string, IPort>
        +getPort(portId)
        +updatePort(port)
        +setPorts(ports)
        +getInputs()
        +getOutputs()
    }

    class NodeEventManager {
        -eventQueue: EventQueue
        -customEventHandler
        +on(eventType, handler)
        +onAll(handler)
        +emit(event)
        +onEvent(event)
        +setCustomEventHandler(handler)
    }

    class ComplexPortHandler {
        -portManager: PortManager
        -portBinder: PortBinder
        -nodeId: string
        +addObjectProperty(objectPort, key, config, useParentUI)
        +removeObjectProperty(objectPort, key)
        +updateArrayItemConfig(arrayPort)
        +appendArrayItem(arrayPort, value)
        +removeArrayItem(arrayPort, index)
        +processPortConfig(config, context)
        +recreateArrayItemPorts(arrayPort, newArray)
        +refreshAnyPortUnderlyingPorts(anyPort, useParentUI)
    }

    %% Relationships: Interfaces
    INodeComposite --|> ICoreNode
    INodeComposite --|> IPortManager
    INodeComposite --|> IPortBinder
    INodeComposite --|> IComplexPortHandler
    INodeComposite --|> INodeEvents

    %% Implementation
    BaseNodeCompositional ..|> INodeComposite

    %% Component Delegation
    BaseNodeCompositional *-- PortManager
    BaseNodeCompositional *-- PortBinder
    BaseNodeCompositional *-- ComplexPortHandler
    BaseNodeCompositional *-- NodeEventManager

    %% Component Dependencies
    PortBinder --> PortManager
    PortBinder --> ComplexPortHandler
    ComplexPortHandler --> PortManager
    ComplexPortHandler --> PortBinder
```

## Event Flow System

```mermaid
flowchart TB
    subgraph Node["BaseNodeCompositional"]
        EmitMethod["emit(event)"]
        EventManager["NodeEventManager"]
        EventQueue["EventQueue"]
        OnEventMethod["onEvent(event)"]
        VisibilityRules["applyPortVisibilityRules()"]
        
        PortUpdate["updatePort(port)"]
        PortManager["PortManager"]
        
        CustomHandler["Custom onEvent override"]
        PortVisibility["@PortVisibility decorators"]
    end
    
    subgraph External["External Components"]
        Subscribers["Event Subscribers"]
        UI["UI Components"]
    end
    
    %% Event Flow
    PortUpdate --> PortManager
    PortManager --> EmitMethod
    EmitMethod --> EventManager
    EventManager --> EventQueue
    EventQueue --> Subscribers
    EventManager --> OnEventMethod
    OnEventMethod --> VisibilityRules
    OnEventMethod --> CustomHandler
    VisibilityRules --> PortVisibility
    PortVisibility --> PortManager
    
    %% External event flow
    UI --> PortUpdate
    Subscribers --> UI
```

## Port System Architecture

```mermaid
classDiagram
    %% Port Core
    class IPort {
        <<interface>>
        +id: string
        +getValue()
        +setValue(value)
        +getConfig()
        +setConfig(config)
        +reset()
        +serialize()
        +deserialize(data)
    }
    
    class BasePort {
        #config: IPortConfig
        #value: any
        +getValue()
        +setValue(value)
        +getConfig()
        +setConfig(config)
        +reset()
        +serialize()
        +deserialize(data)
    }
    
    class IPortConfig {
        <<interface>>
        +id: string
        +type: PortType
        +key?: string
        +direction?: PortDirection
        +nodeId?: string
        +parentId?: string
        +defaultValue?: any
        +ui?: PortUIConfig
    }

    %% Port Types
    class StringPort {
        +validate(value): boolean
    }
    
    class NumberPort {
        +validate(value): boolean
    }
    
    class BooleanPort {
        +validate(value): boolean
    }
    
    class ObjectPort {
        +validate(value): boolean
        +addProperty(key, config)
        +removeProperty(key)
    }
    
    class ArrayPort {
        +validate(value): boolean
        +appendItem(value)
        +removeItem(index)
    }
    
    %% Port Factory
    class PortFactory {
        <<static>>
        +createFromConfig(config): IPort
        +create(config): IPort
    }
    
    %% Port Visibility
    class PortVisibility {
        <<decorator>>
        +showIf(instance): boolean
    }
    
    %% Relationships
    BasePort ..|> IPort
    StringPort --|> BasePort
    NumberPort --|> BasePort
    BooleanPort --|> BasePort
    ObjectPort --|> BasePort
    ArrayPort --|> BasePort
    
    PortFactory ..> BasePort : creates
    PortFactory ..> StringPort : creates
    PortFactory ..> NumberPort : creates
    PortFactory ..> BooleanPort : creates
    PortFactory ..> ObjectPort : creates
    PortFactory ..> ArrayPort : creates
```

## Node Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Construction: new BaseNodeCompositional()
    
    Construction --> Initialization: initialize()
    
    state Initialization {
        [*] --> GetMetadata
        GetMetadata --> ProcessConfigs
        ProcessConfigs --> CreatePorts
        CreatePorts --> BindPorts
        BindPorts --> ApplyRules
        ApplyRules --> [*]
    }
    
    Initialization --> Active: Set NodeStatus.Initialized
    
    state Active {
        [*] --> Idle
        Idle --> Running: execute()
        Running --> Idle: Execution complete
        
        Idle --> Updating: updatePort()
        Updating --> EventHandling: emit event
        EventHandling --> Idle: Event handling complete
    }
    
    Active --> Serialization: serialize()
    Serialization --> Deserialization: deserialize()
    Deserialization --> Initialization: rebindAfterDeserialization()
    
    Active --> Disposal: dispose()
    Disposal --> [*]: NodeStatus.Disposed
```

## Component Interaction

```mermaid
sequenceDiagram
    actor Client
    participant BaseNode as BaseNodeCompositional
    participant PortMgr as PortManager
    participant EventMgr as NodeEventManager
    participant VersMgr as NodeVersionManager
    
    Client->>BaseNode: updatePort(port)
    BaseNode->>PortMgr: updatePort(port)
    BaseNode->>VersMgr: incrementVersion()
    BaseNode->>BaseNode: createEvent(PortUpdate)
    BaseNode->>EventMgr: emit(event)
    EventMgr-->>EventMgr: publish to subscribers
    EventMgr->>BaseNode: onEvent(event)
    BaseNode->>BaseNode: applyPortVisibilityRules()
    BaseNode-->>Client: Promise<void>
    
    Note over BaseNode,EventMgr: Event flow system ensures automatic port visibility updates
```

## Port Visibility System

```mermaid
flowchart LR
    Decorator["@PortVisibility decorator"]
    Rules["showIf conditions"]
    Storage["Visibility rules metadata"]
    
    PortUpdate["Port update event"]
    EventHandler["Node.onEvent()"]
    VisProcessor["applyVisibilityRules()"]
    PortConfig["port.ui.hidden property"]
    
    Decorator -->|stores| Storage
    Rules -->|defines| Storage
    
    PortUpdate -->|triggers| EventHandler
    EventHandler -->|calls| VisProcessor
    VisProcessor -->|reads| Storage
    VisProcessor -->|evaluates| Rules
    VisProcessor -->|updates| PortConfig
    
    style Decorator fill:#9b59b6,stroke:#8e44ad,color:white
    style Rules fill:#9b59b6,stroke:#8e44ad,color:white
    style Storage fill:#3498db,stroke:#2980b9,color:white
    style PortUpdate fill:#e74c3c,stroke:#c0392b,color:white
    style EventHandler fill:#e74c3c,stroke:#c0392b,color:white
    style VisProcessor fill:#3498db,stroke:#2980b9,color:white
    style PortConfig fill:#6ab04c,stroke:#218c74,color:white