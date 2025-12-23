# @badaitech/chaingraph-types

## 0.6.46

### Patch Changes

- feat: remove unused child spawner workflow and related components for code cleanup

## 0.6.45

### Patch Changes

- feat: add output MIME type and compression quality options for image generation

## 0.6.44

### Patch Changes

- feat: enhance execution flow and error handling

## 0.6.43

### Patch Changes

- feat: Enhance API format conversion by adding additional checks for part properties

## 0.6.42

### Patch Changes

- ac5eedb: feat: Enhance Gemini structured output node with batch conversion and async processing. feat: Extend attachment utilities to support plain text and MIME type detection. feat: Introduce ArrayEmbed, ArrayRemap, and ArrayZipMerge nodes for advanced array transformations.

## 0.6.41

### Patch Changes

- feat(gemini): add Gemini 3 Flash model and update thinking level enums

## 0.6.40

### Patch Changes

- feat(nodes): html-preview node with safe iframe sandbox

## 0.6.39

### Patch Changes

- feat: implement event context checks in ExecutionEngine to manage node execution based on event binding rules

## 0.6.38

### Patch Changes

- feat: enhance MarkdownPreview to support base64 images and update ExecutionEngine to require at least one resolved source

## 0.6.37

### Patch Changes

- 77730ba: feat: add MarkdownTextNode with live preview and integrate MarkdownPreview component

## 0.6.36

### Patch Changes

- f359d5e: feat: Enhance node UI and dimensions handling

## 0.6.35

### Patch Changes

- 4deaba9: feat(nodes): add isSchemaMutable property to array transform nodes and update transfer rules
- feat(nodes): remove NODE_BACKGROUNDED event handling and update related logic

## 0.6.34

### Patch Changes

- 50796a3: feat(nodes): add Transforms category with 16 array/type/object nodes

## 0.6.33

### Patch Changes

- 558bb40: feat(gemini): enhance message part handling and conversion utilities

## 0.6.32

### Patch Changes

- feat(gemini): add debug mode for detailed logging and improve API part conversion

## 0.6.31

### Patch Changes

- feat(port-field): integrate AddPropPopover for editing port fields with enhanced configuration options
- b9115b1: feat(gemini): add debug mode for detailed logging in GeminiStructuredOutputNode and GeminiGenerationConfig

## 0.6.30

### Patch Changes

- a2b6952: feat: enhance node and port documentation with Markdown support for descriptions
- e10f1b7: feat: Add Gemini Multimodal Image and Imagen Generate nodes
- 28bd0d2: feat(archai): implement upload and attachment handling nodes for ArchAI integration
- bcc58e4: feat(gemini): add new nodes for Gemini File Part, Image Part, and Text Part; enhance ArchAI integration with attachment handling

## 0.6.29

### Patch Changes

- 0442f06: feat(gemini): enhance gemini structured output node with thoughts streaming and JSON schema improvements

## 0.6.28

### Patch Changes

- Enhanced the ExecutionEngine to accurately identify and mark event-bound nodes, including upstream and downstream dependencies.

## 0.6.27

### Patch Changes

- 5e2043a: feat(execution-engine): implement event-bound node tracking and execution logic
- f76fc26: feat(listener): add EventListenerNodeV2 and deprecate old listener node

## 0.6.26

### Patch Changes

- feat(gemini): implement stream handling and conversion in GeminiStructuredOutputNode

## 0.6.25

### Patch Changes

- feat(gemini): add output formatting configuration for Gemini responses

## 0.6.24

### Patch Changes

- feat(gemini): add debug logging for model response in GeminiStructuredOutputNode

## 0.6.23

### Patch Changes

- feat(gemini): enhance GeminiThinkingLevel and GeminiMediaResolution enums with new values and improved naming

## 0.6.22

### Patch Changes

- 0b2c821: feat(gemini): add native Gemini nodes with structured output and thinking support

## 0.6.21

### Patch Changes

- e55f08b: feat(mcp): enhance MCP server auth headers with template support

## 0.6.20

### Patch Changes

- feat: refactor flow forking logic to streamline flow storage and node/edge transfer

## 0.6.19

### Patch Changes

- ac7371b: feat: implement node visibility filtering functionality for the frontend lib

## 0.6.18

### Patch Changes

- 50c07ea: fix: update external ID mapping in PgOwnershipResolver to include provider prefix

## 0.6.17

### Patch Changes

- e8c4961: feat: add debug mode support for command polling in execution workflows

## 0.6.16

### Patch Changes

- feat: enhance WebSocket server with health check endpoints and error handling

## 0.6.15

### Patch Changes

- 5faf86d: feat: add hardcoded version constants for DBOS application and queue name

## 0.6.14

### Patch Changes

- e150365: refactor: simplify DBOS configuration and remove legacy components

## 0.6.13

### Patch Changes

- a715198: Debug DBOS

## 0.6.12

### Patch Changes

- f1f81b9: refactor: simplify DBOS layer by removing Kafka legacy wrappers

## 0.6.11

### Patch Changes

- fix: backward-compatible user ID resolution

## 0.6.10

### Patch Changes

- 4177dc6: fix: ensure execution workflow is registered before DBOS launch

## 0.6.9

### Patch Changes

- feat: implement API-only task queue and update service creation for API mode

## 0.6.8

### Patch Changes

- Fix build, change cjs to esm

## 0.6.7

### Patch Changes

- bump, fix build

## 0.6.6

### Patch Changes

- Fix imports

## 0.6.5

### Patch Changes

- Bump

## 0.6.3

### Patch Changes

- feat: add pg-listen dependency and update Vite configuration for improved module handling

## 0.6.2

### Patch Changes

- feat: add OpenTelemetry and Winston dependencies for enhanced logging and tracing

## 0.6.1

### Patch Changes

- feat: remove unused React and XYFlow dependencies from Vite configuration

## 0.6.0

### Minor Changes

- Release

### Patch Changes

- 35808f7: fix: update default value handling in decorators and improve error messaging in edge transfer logic
- fab7b54: feat: update package.json and vite.lib.config.ts to include TRPC and SuperJSON dependencies
- 34862a5: fix: restore @badaitech/typescript-config as a devDependency in package.json
- b0cd4c4: fix: remove unused peer dependencies and update Vite config for minification and dependency inclusion
- a21936f: fix: update package version and add wagmi and viem dependencies in package.json and vite config
- 34862a5: fix: restore @badaitech/typescript-config as a devDependency in package.json and update package versions
- 5fd5197: fix: remove conditional checks for release branch in GitHub Actions and restore trpc dependencies in package.json
- f4dd3ac: fix: remove Storybook references from configuration files, add trpc dependencies to the chaingraph-backend
- 78949c3: fix: update execution serialization and flow migration logic
- b0cd4c4: fix: remove unused peer dependencies and comment out excluded packages in Vite config
- e2658c6: feat: implement TextDecoderStream and TextEncoderStream polyfills; update serialization and execution events to use SuperJSON for data handling
- e2658c6: feat: Add flow migration from v1 to v2 schema. Make the ports id's unique for the nodes only. chore: update dependencies and optimize code structure, improve flow node cloning logic
- 054d798: fix: update Vite config to clean output directory and adjust rollup options for ESM output
- eada8b3: fix: disable sourcemap in Vite config for production build and update package versions
- 33d4280: Add new special specal login and sign methods with telegram params
- e2658c6: feat: enhance KafkaEventBus message handling with improved error logging and header checks; add comprehensive tests for execution event serialization
- bdac567: fix: update Vite config for minification and include missing dependencies in pnpm-lock.yaml
- ad73d3a: fix: disable sourcemap in Vite config for production build
- 44e68ba: fix: add new TRPC and related dependencies in package.json
- 911e4ba: Experimental version to debug the external integrations
- 48dcfce: fix: for the paste node trpc procedure emit the migrated nodes instead of original one. Add support for updating multiple nodes and introduce NodesUpdated event
- e2658c6: feat: add @mixmark-io/domino dependency to package.json for enhanced functionality
- 054d798: fix: refactor wallet integration to use Effector stores, remove deprecated WagmiProvider, and update balance handling
- e8aff50: fix: update package.json version and adjust Vite config for ESM compatibility
- 591929e: feat: update TRPC client and initialization to improve type exports and re-export NodeRegistry and SuperJSON
- 4b8d45e: fix: reorganize rollup external dependencies and update eslint ignore patterns
- cc27719: fix: restore lucide-react dependency in package.json and update Vite config for build
- b0cd4c4: fix: remove unused peer dependencies and comment out excluded packages in Vite config
- fd62af0: fix: update package.json and vite config for ESM compatibility and remove unnecessary plugins
- b0cd4c4: fix: update @types/react to version 19.2.0 and clean up Vite config by removing commented-out dependencies
- 911e4ba: feat: enhance initialization process with connection deduplication and secure session hashing; add ChainGraphProvider component
- 79f58c1: fix: update package.json to add new peerDependencies and adjust existing ones, and modify Vite config for deduplication

## 0.5.5-dev.60

### Patch Changes

- fix: add new TRPC and related dependencies in package.json

## 0.5.5-dev.59

### Patch Changes

- fix: restore lucide-react dependency in package.json and update Vite config for build

## 0.5.5-dev.58

### Patch Changes

- fix: update package.json to add new peerDependencies and adjust existing ones, and modify Vite config for deduplication

## 0.5.5-dev.57

### Patch Changes

- fix: update package version and add wagmi and viem dependencies in package.json and vite config

## 0.5.5-dev.56

### Patch Changes

- fix: refactor wallet integration to use Effector stores, remove deprecated WagmiProvider, and update balance handling

## 0.5.5-dev.55

### Patch Changes

- fix: update Vite config to clean output directory and adjust rollup options for ESM output

## 0.5.5-dev.54

### Patch Changes

- fix: update package.json version and adjust Vite config for ESM compatibility

## 0.5.5-dev.53

### Patch Changes

- fix: update package.json and vite config for ESM compatibility and remove unnecessary plugins

## 0.5.5-dev.52

### Patch Changes

- fix: reorganize rollup external dependencies and update eslint ignore patterns

## 0.5.5-dev.51

### Patch Changes

- fix: disable sourcemap in Vite config for production build and update package versions

## 0.5.5-dev.50

### Patch Changes

- fix: disable sourcemap in Vite config for production build

## 0.5.5-dev.49

### Patch Changes

- fix: update Vite config for minification and include missing dependencies in pnpm-lock.yaml

## 0.5.5-dev.48

### Patch Changes

- fix: update @types/react to version 19.2.0 and clean up Vite config by removing commented-out dependencies

## 0.5.5-dev.47

### Patch Changes

- fix: remove unused peer dependencies and update Vite config for minification and dependency inclusion

## 0.5.5-dev.46

### Patch Changes

- fix: remove unused peer dependencies and comment out excluded packages in Vite config

## 0.5.5-dev.45

### Patch Changes

- fix: remove unused peer dependencies and comment out excluded packages in Vite config

## 0.5.5-dev.44

### Patch Changes

- fix: for the paste node trpc procedure emit the migrated nodes instead of original one. Add support for updating multiple nodes and introduce NodesUpdated event

## 0.5.5-dev.43

### Patch Changes

- fix: update default value handling in decorators and improve error messaging in edge transfer logic

## 0.5.5-dev.42

### Patch Changes

- fix: remove conditional checks for release branch in GitHub Actions and restore trpc dependencies in package.json

## 0.5.5-dev.41

### Patch Changes

- fix: remove Storybook references from configuration files, add trpc dependencies to the chaingraph-backend

## 0.5.5-dev.40

### Patch Changes

- fix: update execution serialization and flow migration logic

## 0.5.5-dev.39

### Patch Changes

- fix: restore @badaitech/typescript-config as a devDependency in package.json and update package versions

## 0.5.5-dev.38

### Patch Changes

- fix: restore @badaitech/typescript-config as a devDependency in package.json

## 0.5.5-dev.37

### Patch Changes

- feat: update package.json and vite.lib.config.ts to include TRPC and SuperJSON dependencies

## 0.5.5-dev.36

### Patch Changes

- feat: update TRPC client and initialization to improve type exports and re-export NodeRegistry and SuperJSON

## 0.5.5-dev.35

### Patch Changes

- feat: enhance KafkaEventBus message handling with improved error logging and header checks; add comprehensive tests for execution event serialization

## 0.5.5-dev.34

### Patch Changes

- feat: implement TextDecoderStream and TextEncoderStream polyfills; update serialization and execution events to use SuperJSON for data handling

## 0.5.5-dev.33

### Patch Changes

- feat: add @mixmark-io/domino dependency to package.json for enhanced functionality

## 0.5.5-dev.32

### Patch Changes

- feat: Add flow migration from v1 to v2 schema. Make the ports id's unique for the nodes only. chore: update dependencies and optimize code structure, improve flow node cloning logic

## 0.5.5-dev.31

### Patch Changes

- Add new special specal login and sign methods with telegram params

## 0.5.5-dev.30

### Patch Changes

- feat: optimize flow node and edge addition with batch processing for improved performance

## 0.5.5-dev.29

### Patch Changes

- feat: optimize Kafka event processing with partitioning strategy and header filtering for improved performance

## 0.5.5-dev.28

### Patch Changes

- feat: enhance node and port cloning with deep copy for improved performance, add option to disable events when adding edges to the flow

## 0.5.5-dev.27

### Patch Changes

- feat: enhance metrics tracking for Kafka event bus and task queue operations

## 0.5.5-dev.26

### Patch Changes

- feat: add 'Local' variable namespace option to variable nodes

## 0.5.5-dev.25

### Patch Changes

- feat: reduce staleTime for data fetching to improve responsiveness

## 0.5.5-dev.24

### Patch Changes

- feat: add integration details for ArchAI and Wallet in execution details view

## 0.5.5-dev.23

### Patch Changes

- feat: simplify JSON export formatting by removing indentation

## 0.5.5-dev.22

### Patch Changes

- feat: enhance edge connection handling with parallel execution and improved error logging

## 0.5.5-dev.21

### Patch Changes

- feat: extend ClipboardDataSchema to support legacy SerializedNodeSchemaV1

## 0.5.5-dev.20

### Patch Changes

- feat: rename auth-example to full-cycle-example, enhance GraphQL client integration, and add environment configuration

## 0.5.5-dev.19

### Patch Changes

- feat: enhance flow initialization with Kafka topic creation and optimize producer configurations

## 0.5.5-dev.18

### Patch Changes

- feat: enhance GraphQL client integration, optimize Kafka configurations, and update message fields

## 0.5.5-dev.17

### Patch Changes

- feat: enhance module exports and update dependencies for computed and complex ports

## 0.5.5-dev.16

### Patch Changes

- feat: enhance module exports by refining imports for computed and complex ports

## 0.5.5-dev.15

### Patch Changes

- feat: add distributed execution mode and enhance module imports for computed and complex ports

## 0.5.5-dev.14

### Patch Changes

- feat: enhance Kafka configuration with topics prefix and improve error handling in task publishing

## 0.5.5-dev.13

### Patch Changes

- Bump version

## 0.5.5-dev.12

### Patch Changes

- feat: enhance initialization process with improved state management, add flow metadata loading effect, and update environment configuration

## 0.5.5-dev.11

### Patch Changes

- One more try, recreate samples in the stores file.

## 0.5.5-dev.10

### Patch Changes

- One more try, playing around dependencies versions

## 0.5.5-dev.9

### Patch Changes

- One more try, adjust here and there some init process logic

## 0.5.5-dev.8

### Patch Changes

- One more try to fix issues with active flow id metadata

## 0.5.5-dev.7

### Patch Changes

- feat: simplify initialization flow with improved state management and error handling; add auto-loading of active flow metadata

## 0.5.5-dev.6

### Patch Changes

- feat: add flow metadata loading effect and enhance active flow state management

## 0.5.5-dev.5

### Patch Changes

- feat: enhance ChainGraphProvider with memoization for stability and improved initialization handling

## 0.5.5-dev.4

### Patch Changes

- Add more debug logs

## 0.5.5-dev.3

### Patch Changes

- feat: comment out unused Chaingraph dependencies and disable keepNames option in esbuild configuration

## 0.5.5-dev.2

### Patch Changes

- Try to pass switchSubscriptionFx always and do not track switchSubscriptionFx.pending

## 0.5.5-dev.1

### Patch Changes

- feat: enhance initialization process with connection deduplication and secure session hashing; add ChainGraphProvider component

## 0.5.5-dev.0

### Patch Changes

- Experimental version to debug the external integrations

## 0.5.4

### Patch Changes

- feat: add VITE_CHAINGRAPH_EXECUTOR_WS_URL to environment variables and comment out unused file handling code

## 0.5.3

### Patch Changes

- fix: resolve pino-pretty transport error in production builds

## 0.5.2

### Patch Changes

- feat: refactor Dockerfile and configuration files; remove unused dependencies and optimize build process

## 0.5.1

### Patch Changes

- feat: update Dockerfile and package configurations; add new dependencies for Kafka and LZ4 support, and streamline production dependency installation

## 0.5.0

### Minor Changes

- feat: Add Kafka-based distributed execution with horizontal scaling, microservices architecture, and Docker deployment support

## 0.4.5

### Patch Changes

- 507ab12: Add dynamic enum options based on connected ports
- feat: implement argument cleaning in MCPToolCallNode to remove empty optional fields
- 93566e5: Split Alchemy token balance functionality into separate nodes

## 0.4.4

### Patch Changes

- Added filtering to OKX DEX Search tokens node

## 0.4.3

### Patch Changes

- feat: refactor MCP architecture to server-side, improve execution engine state management

## 0.4.2

### Patch Changes

- feat: add betas feature to enable beta functionalities in Anthropic LLM call, ensure response stream is closed after execution

## 0.4.1

### Patch Changes

- feat: enhance MCPToolCallNode input handling by wrapping input keys in arguments object when missing

## 0.4.0

### Minor Changes

- 6c01887: MCP integration and port transfer rules

### Patch Changes

- 3ac2164: Restore gate node
- 3ac2164: Enhanced edge transfer strategies with disconnect behavior, port configuration improvements, and new EdgeTransferService for better data synchronization
- feat: update dependencies and remove console logs for cleaner output, add gpt-5 and reasoning section to the llm call.
- e2cb917: feat: enhance onSourceUpdate behavior to update parent ports in TransferEngine

## 0.4.0-dev.3

### Patch Changes

- feat: enhance onSourceUpdate behavior to update parent ports in TransferEngine

## 0.4.0-dev.2

### Patch Changes

- Enhanced edge transfer strategies with disconnect behavior, port configuration improvements, and new EdgeTransferService for better data synchronization

## 0.4.0-dev.1

### Patch Changes

- Restore gate node

## 0.4.0-dev.0

### Minor Changes

- 6c01887: MCP integration and port transfer rules

## 0.3.1

### Patch Changes

- e58e090: Add flow fork functionality
- 512098b: Show KDB nodes

## 0.3.1-dev.0

### Patch Changes

- Show KDB nodes

## 0.3.0

### Minor Changes

- 7a1bf17: Add Moonshot model support

### Patch Changes

- 844421c: Improve Event Emitter and Listener nodes with editable payload ports

## 0.2.15

### Patch Changes

- Added ca-certificates to chaingraph backend

## 0.2.14

### Patch Changes

- feat: update node titles and hide some KDB nodes for ArchAI nodes

## 0.2.14-dev.0

### Patch Changes

- feat: update node titles and hide some KDB nodes for ArchAI nodes

## 0.2.13

### Patch Changes

- feat: enhance node filtering and conversation handling in Anthropic LLM integration
- Dev release
- feat: rename ArchAI converter nodes and update Dockerfile for production setup
- fix: add a user message to Anthropic LLM call conversation history if the last message is from assistant

## 0.2.13-dev.3

### Patch Changes

- feat: rename ArchAI converter nodes and update Dockerfile for production setup

## 0.2.13-dev.2

### Patch Changes

- feat: enhance node filtering and conversation handling in Anthropic LLM integration

## 0.2.13-dev.1

### Patch Changes

- fix: add a user message to Anthropic LLM call conversation history if the last message is from assistant

## 0.2.13-dev.0

### Patch Changes

- Dev release

## 0.2.12

### Patch Changes

- feat: Server time node implementation
- cf32439: Update icons for some secret types

## 0.2.11

### Patch Changes

- feat: Add agent to chat and Send message v2 nodes

## 0.2.10

### Patch Changes

- Fix PostgreSQL execution storage performance and data bloat

## 0.2.9

### Patch Changes

- Fix PostgreSQL execution store performance by adding default limit of 200 to list() method

## 0.2.8

### Patch Changes

- Release 0.2.8

## 0.2.7

### Patch Changes

- Fix execution secret key race condition

## 0.2.6

### Patch Changes

- feat: refactor the nodes drag and drop react components and effector store. Add new nodes - kdb QA semantic search. Rename decorators with the "Port" prefix. Some fixes and small changes

## 0.2.5

### Patch Changes

- feat: implement ECDH key pair generation and logging for execution context

## 0.2.4

### Patch Changes

- feat: enhance secret encryption handling and update allowed tools in configuration

## 0.2.3

### Patch Changes

- fix bugs

## 0.2.2

### Patch Changes

- feat: enhance error handling and validation in tool execution and OKX token retrieval

## 0.2.1

### Patch Changes

- feat: Replace DirectSecret with UnencryptedSecretNode, rename Secret decorator to PortSecret, migrate OKX to use centralized secret management, and add configurable secret types with encryption support

## 0.2.0

### Minor Changes

- 2fbcfe4: Claude extended thinking with the tools usage. Execution storage with X-ray history. Secret node types.

### Patch Changes

- 2fbcfe4: DEV build
- feat: Add DirectSecret types for various API keys and update SecretNode type
- feat: Enhance node resizing logic with visibility and dimension checks
- feat: Refactor node selection logic into a reusable hook and enhance copy/paste functionality
- 2fbcfe4: feat: comprehensive copy-paste functionality with node cloning, deep structure handling, and improved execution performance

## 0.2.0-dev.5

### Patch Changes

- feat: Refactor node selection logic into a reusable hook and enhance copy/paste functionality

## 0.2.0-dev.4

### Patch Changes

- feat: Enhance node resizing logic with visibility and dimension checks

## 0.2.0-dev.3

### Patch Changes

- feat: Add DirectSecret types for various API keys and update SecretNode type

## 0.2.0-dev.2

### Patch Changes

- feat: comprehensive copy-paste functionality with node cloning, deep structure handling, and improved execution performance

## 0.2.0-dev.1

### Minor Changes

- Claude extended thinking with the tools usage. Execution storage with X-ray history. Secret node types.

## 0.1.29-dev.0

### Patch Changes

- DEV build

## 0.1.28

### Patch Changes

- 0g llm node implementation and fixes

## 0.1.27

### Patch Changes

- Fix http node body port visibility and improve descriptions. CI build docker only for the "release" branch.

## 0.1.26

### Patch Changes

- Remove duplicate for the "on new message event" node. Fallback for array port value serialization.

## 0.1.25

### Patch Changes

- Fix stream port UI

## 0.1.24

### Patch Changes

- eb4cf29: Add the ArchAI integration tab with configurable session and nodes context. When execution ID exists then disable all port inputs. Merge execution node and editor nodes UI to make it interactive after execution complete. Add BadAI nodes in the hidden category as fallback. Fix ports serialize/deserialize undefined and null values with fallback. Recursive open Any port underlying type. Improve LLM call with structured output node. Now it work well with Groq and any other LLM's. Add retries with error feedback. Other changes and bug fixes.
- Small fixes for the session token in root provider and get variable node
- d5409b8: Fix backend build
- 639038b: Redevelop gate node, now it handles complex types much better. Add LLM Call with structured output node. Add basic value Object node with mutable schema. Rename BadAI to ArchAI nodes and category. Add math And node. Add yaml helper to handlebars template. Add OKX nodes to build whole swap flow. Add PortCreate, PortDelete events to the node. Improve here and there core port, nodes, flow logic as well as port plugins.
- d5409b8: Fix deserialization
- d5409b8: Fix enum deserialize

## 0.1.24-dev.4

### Patch Changes

- Add the ArchAI integration tab with configurable session and nodes context. When execution ID exists then disable all port inputs. Merge execution node and editor nodes UI to make it interactive after execution complete. Add BadAI nodes in the hidden category as fallback. Fix ports serialize/deserialize undefined and null values with fallback. Recursive open Any port underlying type. Improve LLM call with structured output node. Now it work well with Groq and any other LLM's. Add retries with error feedback. Other changes and bug fixes.

## 0.1.24-dev.3

### Patch Changes

- Fix enum deserialize

## 0.1.24-dev.2

### Patch Changes

- Fix deserialization

## 0.1.24-dev.1

### Patch Changes

- Fix backend build

## 0.1.24-dev.0

### Patch Changes

- 639038b: Redevelop gate node, now it handles complex types much better. Add LLM Call with structured output node. Add basic value Object node with mutable schema. Rename BadAI to ArchAI nodes and category. Add math And node. Add yaml helper to handlebars template. Add OKX nodes to build whole swap flow. Add PortCreate, PortDelete events to the node. Improve here and there core port, nodes, flow logic as well as port plugins.

## 0.1.23

### Patch Changes

- Fix the port plugins undefined serialize/deserialize errors

## 0.1.22

### Patch Changes

- default category metadata

## 0.1.21

### Patch Changes

- Add memory locks for atomic updates, fix flow sync issues, add gate node, improve 'any' type port connections

## 0.1.20

### Patch Changes

- Bump version

## 0.1.19

### Patch Changes

- Bump package

## 0.1.18

### Patch Changes

- Improve the sidebar execution events card to be more informative and easy to understand. Improve port doc tooltips design and colors, fix several bugs.

## 0.1.17

### Patch Changes

- Add port documentation and debug value tooltip. Make port order configurable

## 0.1.16

### Patch Changes

- Fix the group node color picker. Add the handlebars log function call to send the event to the context.

## 0.1.15

### Patch Changes

- Add multiple nodes: BadAIChatHistoryNode, BadAIChatMetaNode, OnNewMessageEventNode, BranchNode, NotNode
- Add on stream started node
- New nodes and tsconfig fixes.
- Add connections metadata to the port metadata. Improve badai streaming node
- add array length node
- Add bunch of BadAI nodes
- Add multiple nodes: BadAIChatHistoryNode, BadAIChatMetaNode, EditMessageBadAINode, FinishMessageBadAINode, OnNewMessageEventNode, BadAIStreamMessageNode, ArrayLengthNode, FilterNode, OnStreamStartedNode, BranchNode, NotNode, GetPortSchemaNode, HandlebarsTemplateNode, LangchainTemplateNode.
- Add BadAI finish message node and enchanceother BadAI nodes
- Add filter node
- Add get port schema node
- add HandlebarsTemplateNode
- Improve stream message node

## 0.1.15-dev.10

### Patch Changes

- add HandlebarsTemplateNode

## 0.1.15-dev.9

### Patch Changes

- Add get port schema node

## 0.1.15-dev.8

### Patch Changes

- Add BadAI finish message node and enchanceother BadAI nodes

## 0.1.15-dev.7

### Patch Changes

- Add connections metadata to the port metadata. Improve badai streaming node

## 0.1.15-dev.6

### Patch Changes

- Improve stream message node

## 0.1.15-dev.5

### Patch Changes

- Add on stream started node

## 0.1.15-dev.4

### Patch Changes

- Add bunch of BadAI nodes

## 0.1.15-dev.3

### Patch Changes

- add array length node

## 0.1.15-dev.2

### Patch Changes

- Add filter node

## 0.1.15-dev.1

### Patch Changes

- Add multiple nodes: BadAIChatHistoryNode, BadAIChatMetaNode, OnNewMessageEventNode, BranchNode, NotNode

## 0.1.15-dev.0

### Patch Changes

- New nodes and tsconfig fixes.

## 0.1.14

### Patch Changes

- Regenerate GQL badai client. Create new badai api instance instead of useing predefined one

## 0.1.13

### Patch Changes

- styles for theme provider

## 0.1.12

### Patch Changes

- Shandow dom added
- 2376c69: shadow dom

## 0.1.11

### Patch Changes

- Make packages public

## 0.1.10

### Patch Changes

- bump version

## 0.1.9

### Patch Changes

- Add prefix to the pg schema tables. Update drizzle config. Add Dockerfile for db migration.

## 0.1.9-dev.0

### Patch Changes

- shadow dom

## 0.1.9-2

### Minor Changes

- Change release condition

## 0.1.9-1

### Minor Changes

- New release process

## 0.1.9

### Patch Changes

- Bump version

## 0.1.8

### Patch Changes

- 83524d7: Add docker images release workflow

## 0.1.7

### Patch Changes

- Bump version

## 0.1.6

### Patch Changes

- 4848793: Apply fix effector
- b6f1191: One more try bundle frontend
- a8a7eb3: minify css for lib build
- b2c0c68: Add effector stores import file to root provider
- b2c0c68: Add effector logger, adjust static trpc client creation without duplicates
- a8a7eb3: Remove outdated CSS files
- 4848793: Attempt to include all styles in the bundle
- c21e8c0: Fix ui logic and effector store execution reset trigger
- 4848793: Move store initialization under providers so that tRPC clients can be accessed via hooks.
- 4848793: Adjust root provider initialization
- b2c0c68: Experiment with effector stores to ensure proper functionality
- 4848793: adjust configs for styles
- 4848793: Fix RootProviders
- a8a7eb3: Add tailwind css prefix 'cg-'
- a8a7eb3: Add nanoid with custom alphabet for generating flow id's
- 4848793: temporary workaround to use static TRPC client
- b6f1191: One more version
- 4848793: remove useNaviogate from the codebase
- 4848793: Add SuperJSON param to initializeJsonTransformers
- 4848793: Add trpc properties to the root provider
- b2c0c68: add styles
- b6f1191: Remove secret port type and all secret usages
- 4848793: Change effector store imports order
- 4848793: make react and react-dom as external lib
- 150a6de: Include badaitech package to external one
- 4848793: Some changes
- a8a7eb3: fix theme provider
- 4848793: Adjust build config to include styles to the npm bundle
- b2c0c68: Rewrite trpc client initialization
- 4848793: Rewrite TRPC to use TanStack React Query
- b6f1191: Adjust frontend stores import paths
- 4848793: Make nodeRegistry as param for the RootProvider
- b6f1191: adjust the frontend lib vite config
- b6f1191: One more frontend adjustments
- b6f1191: One more dev bundle testing
- 4848793: add styles export for the frontend lib
- 4848793: Adjust imports for the fronend stores
- b6f1191: One more try
- a8a7eb3: Adjust trpc connection
- b2c0c68: add effector logs
- a8a7eb3: - Add authentication service to the chaingraph backend with two modes: dev and badai. When Dev mode is configured, then server will accept any requests. When badai is configured, then the server will expect the BadAI session JWT tokoken provided.
- b6f1191: Next try
- b2c0c68: Play around effector stores
- 4848793: trpc server exports
- b2c0c68: move node samples to the store file
- b6f1191: remove rollupOptions external from the frontend lib package vite config
- 4848793: some changes
- 4848793: Try to explicitly provide nodes types instead of take it from the decorator reflection
- 4848793: Remove debug
- 4848793: change effector nodes stores imports path
- a8a7eb3: One more build with many small changes
- 4848793: do not include react to the frontend npm lib

## 0.1.6-dev.51

### Patch Changes

- One more build with many small changes

## 0.1.6-dev.50

### Patch Changes

- Add tailwind css prefix 'cg-'

## 0.1.6-dev.49

### Patch Changes

- Adjust trpc connection

## 0.1.6-dev.48

### Patch Changes

- fix theme provider

## 0.1.6-dev.47

### Patch Changes

- minify css for lib build

## 0.1.6-dev.46

### Patch Changes

- Remove outdated CSS files

## 0.1.6-dev.45

### Patch Changes

- Add nanoid with custom alphabet for generating flow id's

## 0.1.6-dev.44

### Patch Changes

- - Add authentication service to the chaingraph backend with two modes: dev and badai. When Dev mode is configured, then server will accept any requests. When badai is configured, then the server will expect the BadAI session JWT tokoken provided.

## 0.1.6-dev.43

### Patch Changes

- Fix ui logic and effector store execution reset trigger

## 0.1.6-dev.42

### Patch Changes

- Include badaitech package to external one

## 0.1.6-dev.41

### Patch Changes

- move node samples to the store file

## 0.1.6-dev.40

### Patch Changes

- Add effector stores import file to root provider

## 0.1.6-dev.39

### Patch Changes

- Rewrite trpc client initialization

## 0.1.6-dev.38

### Patch Changes

- Play around effector stores

## 0.1.6-dev.37

### Patch Changes

- Play around effector stores to make it work

## 0.1.6-dev.36

### Patch Changes

- add effector logs

## 0.1.6-dev.35

### Patch Changes

- Add effector logger, adjust static trpc client creation without duplicates

## 0.1.6-dev.34

### Patch Changes

- add styles

## 0.1.6-dev.33

### Patch Changes

- New try to include all styles to the bundle

## 0.1.6-dev.32

### Patch Changes

- adjust configs for styles

## 0.1.6-dev.31

### Patch Changes

- Adjust build config to include styles to the npm bundle

## 0.1.6-dev.30

### Patch Changes

- add styles export for the frontend lib

## 0.1.6-dev.29

### Patch Changes

- Remove debug

## 0.1.6-dev.28

### Patch Changes

- Try to explicitly provide nodes types instead of take it from the decorator reflection

## 0.1.6-dev.27

### Patch Changes

- dirty hack to use static TRPC client

## 0.1.6-dev.26

### Patch Changes

- Adjust root provider initialization

## 0.1.6-dev.25

### Patch Changes

- Make nodeRegistry as param for the RootProvider

## 0.1.6-dev.24

### Patch Changes

- Move initialize stores under providers in order to it has a way to use tRPC clients from hook

## 0.1.6-dev.23

### Patch Changes

- Rewrite TRPC to use TanStack React Query

## 0.1.6-dev.22

### Patch Changes

- trpc server exports

## 0.1.6-dev.21

### Patch Changes

- Some changes

## 0.1.6-dev.20

### Patch Changes

- some changes

## 0.1.6-dev.19

### Patch Changes

- Add trpc properties to the root provider

## 0.1.6-dev.18

### Patch Changes

- Add SuperJSON param to initializeJsonTransformers

## 0.1.6-dev.17

### Patch Changes

- remove useNaviogate from the codebase

## 0.1.6-dev.16

### Patch Changes

- make react and react dome as external lib

## 0.1.6-dev.15

### Patch Changes

- change effector nodes stores imports path

## 0.1.6-dev.14

### Patch Changes

- Change effector store imports order

## 0.1.6-dev.13

### Patch Changes

- do not include react to the frontend npm lib

## 0.1.6-dev.12

### Patch Changes

- Fix RootProviders

## 0.1.6-dev.11

### Patch Changes

- Adjust imports for the fronend stores

## 0.1.6-dev.10

### Patch Changes

- Apply fix effector

## 0.1.6-dev.9

### Patch Changes

- One more try

## 0.1.6-dev.8

### Patch Changes

- Adjust frontend stores import paths

## 0.1.6-dev.7

### Patch Changes

- One more version

## 0.1.6-dev.6

### Patch Changes

- One more try boundle frontend

## 0.1.6-dev.5

### Patch Changes

- One more frontend adjustments

## 0.1.6-dev.4

### Patch Changes

- One more dev bundle testing

## 0.1.6-dev.3

### Patch Changes

- Next try

## 0.1.6-dev.2

### Patch Changes

- adjust the frontend lib vite config

## 0.1.6-dev.1

### Patch Changes

- remove rollupOptions external from the frontend lib package vite config

## 0.1.6-dev.0

### Patch Changes

- Remove secret port type and all secret usages

## 0.1.5

### Patch Changes

- Fix and adjust chaingraph-frontend lib NPM package

## 0.1.4

### Patch Changes

- 50214bc: Upgrade React to v19. Upgrade other dependencies. Optimize frontend effector stores.

## 0.1.3

### Patch Changes

- 3dcef34: Simplify release workflow
- 00464f5: Test release process
- 594f20c: Adjust package.json configs to fix npm package
- 0938d64: Add meta-llama/llama-4-scout-17b-16e-instruct model to the LLM call node. Adjust build configs
- 9c6fd41: One more release test
- 594f20c: Try to fix npm package
- 0fbe508: Prepare chaingraph-frontend to build lib with components as well as the browser bundle. Adjust packages configs.
- 2b28c97: Change release workflow for the one more release publish test
- ff25864: Modify turbo.json config to make it depend on packages and make build order correct
- f1e40ef: Ajust release workflow
- Release v0.1.3
- 3dcef34: Fix packages configs for the package building.
- 594f20c: bump

## 0.1.3-alpha.7

### Patch Changes

- 0938d64: Add meta-llama/llama-4-scout-17b-16e-instruct model to the LLM call node. Adjust build configs
- ff25864: Modify turbo.json config to make it depend on packages and make build order correct

## 0.1.3-alpha.6

### Patch Changes

- Prepare chaingraph-frontend to build lib with components as well as the browser bundle. Adjust packages configs.

## 0.1.3-alpha.5

### Patch Changes

- Adjust package.json configs to fix npm package

## 0.1.3-alpha.4

### Patch Changes

- bump

## 0.1.3-alpha.3

### Patch Changes

- 3dcef34: Simplify release workflow
- 3dcef34: Fix packages configs for the package building.

## 0.1.3-alpha.3

### Patch Changes

- 3dcef34: Simplify release workflow
- Try to fix npm package
- 3dcef34: Fix packages configs for the package building.

## 0.1.3-alpha.2

### Patch Changes

- 2b28c97: Change release workflow for the one more release publish test
- f1e40ef: Ajust release workflow

## 0.1.3-alpha.1

### Patch Changes

- 9c6fd41: One more release test

## 0.1.3-alpha.0

### Patch Changes

- Test release process

## 0.1.2

### Patch Changes

- v0.1.1
