![ChainGraph logo](./docs/images/dark_bg2.png#gh-dark-mode-only)
![ChainGraph logo](./docs/images/light_bg2.png#gh-light-mode-only)

# ChainGraph v2

ChainGraph is a source-available, flow–based programming framework that empowers developers to visually design, execute, and manage complex computational graphs. Whether you are building custom AI agents, data processing pipelines, or collaborative automation systems, ChainGraph’s modular architecture, strong type–safety guarantees, and real–time features help you build robust workflows efficiently.

> **Disclaimer:** This version is intended for demonstration and experimentation purposes only. The API and internal architecture are still evolving, and breaking changes may occur as new features are added and improvements are made.

## Table of Contents

- [Key Features](#key-features)
- [Architecture & Technologies](#architecture--technologies)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Running in Development Mode](#running-in-development-mode)
- [Building for Production](#building-for-production)
- [Docker & Docker-compose](#docker--docker-compose)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Developer Documentation](#developer-documentation)

## Key Features

- **Type–Safe Port System:**
  Supports a rich set of port types including primitives (string, number, boolean) and complex types (arrays, objects, streams, enums). Each port is defined with its own configuration and runtime validation (via Zod and SuperJSON) and employs both lazy instantiation and caching for optimal memory usage.

- **Modular and Extensible Nodes:**
  Create custom nodes using decorators and metadata. Nodes feature multiple input and output ports and integrate seamlessly into the flow builder, enabling rapid development of complex workflows.

- **Visual Flow Editor:**
  Build flows graphically with a React- and XYFlow–based frontend. Enjoy features like drag-and-drop layout, zoom and pan, resizing, contextual menus, and live previews.

- **Robust Execution Engine & Debugging Tools:**
  A backend execution engine supports concurrent execution of flows with real-time event subscriptions, plus debugging features such as breakpoints, step–over, and detailed event logging for effective troubleshooting.

- **Real–Time Synchronization & Optimistic Updates:**
  Integrated with TRPC and Effector for end-to–end type safety, the system provides real-time updates (via WebSockets) and supports optimistic UI updates—ensuring an interactive and responsive user experience.

- **Docker and Cloud Compatibility:**
  Easily build, deploy, and scale both the backend and frontend using Docker and docker-compose. Containerized deployment simplifies the setup process and enhances portability.

## Architecture & Technologies

ChainGraph is built with modern web technologies, aiming at a robust and type-safe development experience:

- **TypeScript:**
  Uses advanced TypeScript features (generics, decorators, conditional types) for compile–time safety and robustness.

- **Effector:**
  A reactive state management library that powers both frontend and backend state handling and simplifies the implementation of optimistic updates and subscriptions.

- **TRPC:**
  Facilitates end-to-end type–safe API communication between the frontend and backend, minimizing runtime errors and ensuring consistency in data handling.

- **Zod & SuperJSON:**
  Zod is used for runtime schema validation, while SuperJSON manages complex data serialization, ensuring that data remains consistent across the client and server boundaries.

- **XYFlow:**
  A visual flow library used on the frontend to render and manage the drag-and-drop canvas, enabling users to compose workflows visually.

- **WebSockets:**
  Real-time subscriptions using WebSocket (via tRPC’s adapter) keep the client in constant sync with backend state and execution events.

## Getting Started

ChainGraph provides a complete development environment with hot module reloading, integrated testing, and containerized deployment options. This guide covers local installation and Docker-based setups.

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/badaitech/chaingraph.git
cd chaingraph
pnpm install
```

## Running in Development Mode

To start the development environment (both frontend and backend), run:

```bash
pnpm run dev
```

This command launches:
- The frontend development server (with hot reloading)
- The backend development process (watch mode)

You can also run each package individually if desired:
- **Backend:**
  `turbo run dev --filter=@badaitech/chaingraph-backend`
- **Frontend:**
  `turbo run dev --filter=@badaitech/chaingraph-frontend`

## Building for Production

To build the entire project with a clean installation, execute:

```bash
pnpm run build
```

## Docker & Docker-compose

ChainGraph can also be built and run using Docker. The repository includes Dockerfiles for both the backend and frontend, along with a docker-compose configuration for orchestrating the containers.

### Building Docker Images

You can build Docker images for individual components using the Makefile targets:

- **Build backend image:**

  ```bash
  make docker-build-backend
  ```

- **Build frontend image:**

  ```bash
  make docker-build-frontend
  ```

- **Build both images:**

  ```bash
  make docker-build-all
  ```

Alternatively, you can build them manually using Docker commands. For example, to build the backend image manually use:

```bash
docker build -t chaingraph-backend -f packages/chaingraph-backend/Dockerfile .
```

And likewise for the frontend:

```bash
docker build -t chaingraph-frontend -f packages/chaingraph-frontend/Dockerfile .
```

### Running with Docker-compose

Use docker-compose to launch both containers concurrently. In the repository root, run:

```bash
make docker-compose-up
```

This command will start the backend on port 3001 and the frontend (serving on port 80 inside the container, mapped to 5173 on your host). To stop and remove containers, run:

```bash
make docker-compose-down
```

You can also run these commands manually:

```bash
docker-compose up -d      # Start containers in the background
docker-compose down       # Stop and remove containers
```

## Project Structure

- **packages/chaingraph-types:**
  Contains shared type definitions, interfaces, port implementations, node/event models, and utilities ensuring end-to-end type safety.

- **packages/chaingraph-nodes:**
  A collection of pre-built node implementations and category definitions, serving as examples and reusable components for extensibility.

- **apps/chaingraph-backend:**
  The backend service that implements a TRPC API router, flow execution logic, in-memory storage for flows and nodes, and WebSocket-based real-time subscriptions.

- **apps/chaingraph-frontend:**
  A React+Vite frontend that utilizes XYFlow for a graphical flow editor, Effector for state management, and TRPC to interact with the backend.

## Contributing

Before submitting a contribution, you must agree to our [Contributor License Agreement](CLA.md).
By submitting a contribution (e.g., a pull request), you confirm that you accept its terms.

Contributions to ChainGraph are welcome! If you wish to submit changes:
- Fork the repository and create a feature or bugfix branch.
- Ensure your changes follow the project’s style guidelines and that tests pass.
- Update documentation as necessary.
- Open a pull request with a detailed description of your enhancements.

Feel free to open issues for bugs, suggestions, or questions.

## Current Limitations & Work-In-Progress

- **Unstable API:** Because ChainGraph is still in active development, many aspects of the API may change and documentation might be updated accordingly.
- **Incomplete Features:** Some advanced features are still under development.
- **Experimental Design:** The current version is primarily for demonstration and evaluation purposes. It is not yet ready for production use.

---

## Developer Documentation

For more details on how to create custom nodes using decorators, please refer to our [Node Decorators Documentation](./docs/nodes/node-decorators.md). This guide provides in-depth explanations and examples on using decorators to define node inputs, outputs, and complex configurations, ensuring type-safety and a more maintainable codebase.

---

## License

ChainGraph is licensed under a [Business Source License 1.1 (BUSL-1.1)](LICENSE.txt).

Since version 1.0 refer to a table below showing a conversion dates for each version:

| ChainGraph Version | License  | Converts to Apache 2.0 |
|--------------------|----------|------------------------|
