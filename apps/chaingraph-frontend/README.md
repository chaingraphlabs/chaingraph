# @badaitech/chaingraph-frontend

![License](https://img.shields.io/badge/license-BUSL-blue.svg)

A powerful, React-based visual programming interface for the ChainGraph flow-based programming framework. This package provides a complete, feature-rich UI for designing, managing, and executing computational graphs with a focus on real-time collaboration and type safety.

## Features

- **Visual Flow Editor**: Intuitive drag-and-drop interface for designing computational flows
- **Real-time Synchronization**: WebSocket-based updates ensure all changes are immediately reflected
- **Type-Safe Ports**: Strong type checking for node connections with visual feedback
- **Interactive Debugging**: Debug mode with breakpoints, step execution, and visual state tracking
- **Theming Support**: Built-in light and dark mode with customizable node styling
- **Responsive Design**: Adapts to different screen sizes and resolutions
- **Performance Optimized**: Efficient rendering even with large and complex flows

## Installation

```bash
# Before installing, make sure you have set up authentication for GitHub Packages
npm install @badaitech/chaingraph-frontend
# or
yarn add @badaitech/chaingraph-frontend
# or
pnpm add @badaitech/chaingraph-frontend
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

## Basic Usage

To integrate the ChainGraph editor into your React application:

```tsx
import { Flow } from '@badaitech/chaingraph-frontend';
import { TrpcProvider } from '@badaitech/chaingraph-trpc/client';
import { ThemeProvider, ZoomProvider, DndProvider } from '@badaitech/chaingraph-frontend/providers';
import { ReactFlowProvider } from '@xyflow/react';

function App() {
  return (
    <ThemeProvider>
      <TrpcProvider>
        <ReactFlowProvider>
          <ZoomProvider>
            <DndProvider>
              <div className="h-screen">
                <Flow />
              </div>
            </DndProvider>
          </ZoomProvider>
        </ReactFlowProvider>
      </TrpcProvider>
    </ThemeProvider>
  );
}

export default App;
```

## Key Concepts

### Flows

Flows are computational graphs made up of nodes and connections. Each flow can be created, saved, executed, and shared. The ChainGraph frontend provides a complete management system for flows with operations like:

- Creating and editing flows
- Managing flow metadata (name, description, tags)
- Executing flows with real-time monitoring
- Debugging with breakpoints and step execution

### Nodes

Nodes are the building blocks of a flow. Each node has:

- Input and output ports with type definitions
- Configuration options
- Visual styling based on category
- Execution state indicators

### Ports

Ports represent data inputs and outputs for nodes. The frontend supports:

- Various port types (string, number, boolean, array, object, stream)
- Type-safe connections between ports
- Rich editing capabilities for different data types
- Visual indicators for connection status

## Development

### Prerequisites

- Node.js v22.x or higher
- pnpm v10.x or higher

### Local Development

```bash
# Clone the repository
git clone https://github.com/badaitech/chaingraph.git
cd chaingraph

# Install dependencies
pnpm install

# Start the frontend development server
pnpm --filter @badaitech/chaingraph-frontend run dev
```

### Building

```bash
# Build the frontend package
pnpm --filter @badaitech/chaingraph-frontend run build
```

### Storybook

This package includes Storybook for component development and testing:

```bash
# Run Storybook
pnpm --filter @badaitech/chaingraph-frontend run storybook

# Build Storybook
pnpm --filter @badaitech/chaingraph-frontend run build-storybook
```

## Component Structure

The frontend is organized into several key component areas:

- **Flow**: The main canvas component for visualizing and interacting with flows
- **Sidebar**: Navigation and management interface with tabs for flows, nodes, and settings
- **Nodes**: Visual representations of computational units with configurable ports
- **Controls**: UI elements for flow execution, debugging, and management

## Theming

ChainGraph frontend supports both light and dark themes out of the box. The theme can be toggled with the `ThemeToggle` component or programmatically via the `ThemeProvider`.

```tsx
import { useTheme } from '@badaitech/chaingraph-frontend';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

## Advanced Usage

### Flow Subscription

The frontend automatically synchronizes with the backend using WebSocket subscriptions:

```tsx
import { useFlowSubscription } from '@badaitech/chaingraph-frontend';

function FlowSyncStatus() {
  const { status, isSubscribed, error } = useFlowSubscription();
  
  return (
    <div>
      Connection status: {status}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

### Execution Control

Control flow execution with the built-in hooks:

```tsx
import { 
  createExecution, 
  startExecution, 
  pauseExecution,
  stepExecution
} from '@badaitech/chaingraph-frontend';
import { useUnit } from 'effector-react';
import { $executionState } from '@badaitech/chaingraph-frontend/store';

function ExecutionControls() {
  const { executionId, status, debugMode } = useUnit($executionState);
  
  return (
    <div>
      <button onClick={() => createExecution({ flowId: 'your-flow-id', debug: true })}>
        Create Execution
      </button>
      <button onClick={() => startExecution(executionId)}>
        Start
      </button>
      {/* Other execution controls */}
    </div>
  );
}
```

## Browser Compatibility

ChainGraph frontend is compatible with modern browsers including:
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

Internet Explorer is not supported.

## Contributing

Contributions to ChainGraph are welcome! Please read our [Contributing Guidelines](https://github.com/badaitech/chaingraph/blob/main/CONTRIBUTING.md) before submitting a pull request.

## License

BUSL-1.1 - Business Source License

This source code is licensed under the Business Source License 1.1 included in the file LICENSE.txt in the repository root directory. As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.

## Related Packages

- **@badaitech/chaingraph-types**: Core type definitions and decorators
- **@badaitech/chaingraph-backend**: Backend services for flow execution
- **@badaitech/chaingraph-nodes**: Collection of pre-built nodes
- **@badaitech/chaingraph-trpc**: tRPC API layer for type-safe communication