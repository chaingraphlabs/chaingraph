# @badaitech/chaingraph-execution-worker

## 0.6.1

### Patch Changes

- feat: remove unused React and XYFlow dependencies from Vite configuration
- Updated dependencies
  - @badaitech/chaingraph-executor@0.6.1
  - @badaitech/chaingraph-nodes@0.6.1
  - @badaitech/chaingraph-types@0.6.1
  - @badaitech/chaingraph-trpc@0.6.1
  - @badaitech/badai-api@0.6.1

## 0.6.0

### Minor Changes

- Release

### Patch Changes

- e92f4dc: feat: implement child execution spawning with dedicated spawner workflow and event handling
- 5cd71e6: feat: implement execution recovery service with failure tracking and recovery methods
- 35808f7: fix: update default value handling in decorators and improve error messaging in edge transfer logic
- fab7b54: feat: update package.json and vite.lib.config.ts to include TRPC and SuperJSON dependencies
- 34862a5: fix: restore @badaitech/typescript-config as a devDependency in package.json
- b0cd4c4: fix: remove unused peer dependencies and update Vite config for minification and dependency inclusion
- a21936f: fix: update package version and add wagmi and viem dependencies in package.json and vite config
- 34862a5: fix: restore @badaitech/typescript-config as a devDependency in package.json and update package versions
- 5fd5197: fix: remove conditional checks for release branch in GitHub Actions and restore trpc dependencies in package.json
- 0674057: feat: update DBOS execution configuration and remove Kafka dependencies
- f4dd3ac: fix: remove Storybook references from configuration files, add trpc dependencies to the chaingraph-backend
- 78949c3: fix: update execution serialization and flow migration logic
- b0cd4c4: fix: remove unused peer dependencies and comment out excluded packages in Vite config
- e2658c6: feat: implement TextDecoderStream and TextEncoderStream polyfills; update serialization and execution events to use SuperJSON for data handling
- e2658c6: feat: Add flow migration from v1 to v2 schema. Make the ports id's unique for the nodes only. chore: update dependencies and optimize code structure, improve flow node cloning logic
- 054d798: fix: update Vite config to clean output directory and adjust rollup options for ESM output
- eada8b3: fix: disable sourcemap in Vite config for production build and update package versions
- 33d4280: Add new special specal login and sign methods with telegram params
- 7caac7e: feat: integrate DBOS execution engine with event streaming and task management
- e2658c6: feat: enhance KafkaEventBus message handling with improved error logging and header checks; add comprehensive tests for execution event serialization
- 32bdf91: feat: optimize child task creation and spawning with parallel processing
- bdac567: fix: update Vite config for minification and include missing dependencies in pnpm-lock.yaml
- ad73d3a: fix: disable sourcemap in Vite config for production build
- 44e68ba: fix: add new TRPC and related dependencies in package.json
- 911e4ba: Experimental version to debug the external integrations
- 5cd71e6: fix: enhance execution worker with failure tracking, recovery methods, and improved claim handling
- 48dcfce: fix: for the paste node trpc procedure emit the migrated nodes instead of original one. Add support for updating multiple nodes and introduce NodesUpdated event
- e2658c6: feat: add @mixmark-io/domino dependency to package.json for enhanced functionality
- 054d798: fix: refactor wallet integration to use Effector stores, remove deprecated WagmiProvider, and update balance handling
- 18409d2: feat: enhance command handling in execution workflow with shared command controller and abort support
- e8aff50: fix: update package.json version and adjust Vite config for ESM compatibility
- 6d0fbb3: feat: implement command polling for execution control with pause, resume, and step commands
- 9069770: feat: implement signal pattern for DBOS execution workflow with event initialization and timeout handling
- 591929e: feat: update TRPC client and initialization to improve type exports and re-export NodeRegistry and SuperJSON
- 4b8d45e: fix: reorganize rollup external dependencies and update eslint ignore patterns
- cc27719: fix: restore lucide-react dependency in package.json and update Vite config for build
- b0cd4c4: fix: remove unused peer dependencies and comment out excluded packages in Vite config
- fd62af0: fix: update package.json and vite config for ESM compatibility and remove unnecessary plugins
- b0cd4c4: fix: update @types/react to version 19.2.0 and clean up Vite config by removing commented-out dependencies
- 911e4ba: feat: enhance initialization process with connection deduplication and secure session hashing; add ChainGraphProvider component
- 79f58c1: fix: update package.json to add new peerDependencies and adjust existing ones, and modify Vite config for deduplication
- da66272: feat: implement asynchronous event handling with sequential queue for DBOS stream writes
- 7f24250: feat: integrate DBOS execution engine with durable workflows and task management
- Updated dependencies [e92f4dc]
- Updated dependencies [5cd71e6]
- Updated dependencies [35808f7]
- Updated dependencies [fab7b54]
- Updated dependencies [34862a5]
- Updated dependencies [b0cd4c4]
- Updated dependencies [a21936f]
- Updated dependencies [34862a5]
- Updated dependencies [5fd5197]
- Updated dependencies [0674057]
- Updated dependencies [f4dd3ac]
- Updated dependencies [78949c3]
- Updated dependencies [b0cd4c4]
- Updated dependencies [e2658c6]
- Updated dependencies [e2658c6]
- Updated dependencies [054d798]
- Updated dependencies [eada8b3]
- Updated dependencies [f047627]
- Updated dependencies [33d4280]
- Updated dependencies [7caac7e]
- Updated dependencies [e2658c6]
- Updated dependencies [32bdf91]
- Updated dependencies [bdac567]
- Updated dependencies [ad73d3a]
- Updated dependencies [44e68ba]
- Updated dependencies
- Updated dependencies [911e4ba]
- Updated dependencies [5cd71e6]
- Updated dependencies [48dcfce]
- Updated dependencies [e2658c6]
- Updated dependencies [054d798]
- Updated dependencies [18409d2]
- Updated dependencies [e8aff50]
- Updated dependencies [6d0fbb3]
- Updated dependencies [9069770]
- Updated dependencies [591929e]
- Updated dependencies [4b8d45e]
- Updated dependencies [cc27719]
- Updated dependencies [b0cd4c4]
- Updated dependencies [fd62af0]
- Updated dependencies [b0cd4c4]
- Updated dependencies [911e4ba]
- Updated dependencies [79f58c1]
- Updated dependencies [da66272]
- Updated dependencies [7f24250]
- Updated dependencies [caaef52]
  - @badaitech/chaingraph-executor@0.6.0
  - @badaitech/chaingraph-nodes@0.6.0
  - @badaitech/chaingraph-types@0.6.0
  - @badaitech/badai-api@0.6.0
  - @badaitech/chaingraph-trpc@0.6.0

## 0.5.5-dev.63

### Patch Changes

- 32bdf91: feat: optimize child task creation and spawning with parallel processing
- da66272: feat: implement asynchronous event handling with sequential queue for DBOS stream writes
- Updated dependencies [f047627]
- Updated dependencies [32bdf91]
- Updated dependencies [da66272]
- Updated dependencies [caaef52]
  - @badaitech/chaingraph-executor@0.5.5-dev.63

## 0.5.5-dev.62

### Patch Changes

- feat: update DBOS execution configuration and remove Kafka dependencies
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.62

## 0.5.5-dev.61

### Patch Changes

- e92f4dc: feat: implement child execution spawning with dedicated spawner workflow and event handling
- 5cd71e6: feat: implement execution recovery service with failure tracking and recovery methods
- 7caac7e: feat: integrate DBOS execution engine with event streaming and task management
- 5cd71e6: fix: enhance execution worker with failure tracking, recovery methods, and improved claim handling
- 18409d2: feat: enhance command handling in execution workflow with shared command controller and abort support
- 6d0fbb3: feat: implement command polling for execution control with pause, resume, and step commands
- 9069770: feat: implement signal pattern for DBOS execution workflow with event initialization and timeout handling
- 7f24250: feat: integrate DBOS execution engine with durable workflows and task management
- Updated dependencies [e92f4dc]
- Updated dependencies [5cd71e6]
- Updated dependencies [7caac7e]
- Updated dependencies [5cd71e6]
- Updated dependencies [18409d2]
- Updated dependencies [6d0fbb3]
- Updated dependencies [9069770]
- Updated dependencies [7f24250]
  - @badaitech/chaingraph-executor@0.5.5-dev.61

## 0.5.5-dev.60

### Patch Changes

- fix: add new TRPC and related dependencies in package.json
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.60
  - @badaitech/chaingraph-nodes@0.5.5-dev.60
  - @badaitech/chaingraph-types@0.5.5-dev.60
  - @badaitech/chaingraph-trpc@0.5.5-dev.60

## 0.5.5-dev.59

### Patch Changes

- fix: restore lucide-react dependency in package.json and update Vite config for build
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.59
  - @badaitech/chaingraph-nodes@0.5.5-dev.59
  - @badaitech/chaingraph-types@0.5.5-dev.59
  - @badaitech/chaingraph-trpc@0.5.5-dev.59

## 0.5.5-dev.58

### Patch Changes

- fix: update package.json to add new peerDependencies and adjust existing ones, and modify Vite config for deduplication
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.58
  - @badaitech/chaingraph-nodes@0.5.5-dev.58
  - @badaitech/chaingraph-types@0.5.5-dev.58
  - @badaitech/chaingraph-trpc@0.5.5-dev.58

## 0.5.5-dev.57

### Patch Changes

- fix: update package version and add wagmi and viem dependencies in package.json and vite config
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.57
  - @badaitech/chaingraph-nodes@0.5.5-dev.57
  - @badaitech/chaingraph-trpc@0.5.5-dev.57
  - @badaitech/chaingraph-types@0.5.5-dev.57

## 0.5.5-dev.56

### Patch Changes

- fix: refactor wallet integration to use Effector stores, remove deprecated WagmiProvider, and update balance handling
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.56
  - @badaitech/chaingraph-nodes@0.5.5-dev.56
  - @badaitech/chaingraph-types@0.5.5-dev.56
  - @badaitech/chaingraph-trpc@0.5.5-dev.56

## 0.5.5-dev.55

### Patch Changes

- fix: update Vite config to clean output directory and adjust rollup options for ESM output
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.55
  - @badaitech/chaingraph-nodes@0.5.5-dev.55
  - @badaitech/chaingraph-types@0.5.5-dev.55
  - @badaitech/chaingraph-trpc@0.5.5-dev.55

## 0.5.5-dev.54

### Patch Changes

- fix: update package.json version and adjust Vite config for ESM compatibility
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.54
  - @badaitech/chaingraph-nodes@0.5.5-dev.54
  - @badaitech/chaingraph-types@0.5.5-dev.54
  - @badaitech/chaingraph-trpc@0.5.5-dev.54

## 0.5.5-dev.53

### Patch Changes

- fix: update package.json and vite config for ESM compatibility and remove unnecessary plugins
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.53
  - @badaitech/chaingraph-nodes@0.5.5-dev.53
  - @badaitech/chaingraph-types@0.5.5-dev.53
  - @badaitech/chaingraph-trpc@0.5.5-dev.53

## 0.5.5-dev.52

### Patch Changes

- fix: reorganize rollup external dependencies and update eslint ignore patterns
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.52
  - @badaitech/chaingraph-nodes@0.5.5-dev.52
  - @badaitech/chaingraph-types@0.5.5-dev.52
  - @badaitech/chaingraph-trpc@0.5.5-dev.52

## 0.5.5-dev.51

### Patch Changes

- fix: disable sourcemap in Vite config for production build and update package versions
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.51
  - @badaitech/chaingraph-nodes@0.5.5-dev.51
  - @badaitech/chaingraph-types@0.5.5-dev.51
  - @badaitech/chaingraph-trpc@0.5.5-dev.51

## 0.5.5-dev.50

### Patch Changes

- fix: disable sourcemap in Vite config for production build
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.50
  - @badaitech/chaingraph-nodes@0.5.5-dev.50
  - @badaitech/chaingraph-types@0.5.5-dev.50
  - @badaitech/chaingraph-trpc@0.5.5-dev.50

## 0.5.5-dev.49

### Patch Changes

- fix: update Vite config for minification and include missing dependencies in pnpm-lock.yaml
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.49
  - @badaitech/chaingraph-nodes@0.5.5-dev.49
  - @badaitech/chaingraph-trpc@0.5.5-dev.49
  - @badaitech/chaingraph-types@0.5.5-dev.49

## 0.5.5-dev.48

### Patch Changes

- fix: update @types/react to version 19.2.0 and clean up Vite config by removing commented-out dependencies
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.5.5-dev.48
  - @badaitech/chaingraph-executor@0.5.5-dev.48
  - @badaitech/chaingraph-trpc@0.5.5-dev.48
  - @badaitech/chaingraph-types@0.5.5-dev.48

## 0.5.5-dev.47

### Patch Changes

- fix: remove unused peer dependencies and update Vite config for minification and dependency inclusion
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.47
  - @badaitech/chaingraph-nodes@0.5.5-dev.47
  - @badaitech/chaingraph-trpc@0.5.5-dev.47
  - @badaitech/chaingraph-types@0.5.5-dev.47

## 0.5.5-dev.46

### Patch Changes

- fix: remove unused peer dependencies and comment out excluded packages in Vite config
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.46
  - @badaitech/chaingraph-nodes@0.5.5-dev.46
  - @badaitech/chaingraph-trpc@0.5.5-dev.46
  - @badaitech/chaingraph-types@0.5.5-dev.46

## 0.5.5-dev.45

### Patch Changes

- fix: remove unused peer dependencies and comment out excluded packages in Vite config
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.45
  - @badaitech/chaingraph-nodes@0.5.5-dev.45
  - @badaitech/chaingraph-trpc@0.5.5-dev.45
  - @badaitech/chaingraph-types@0.5.5-dev.45

## 0.5.5-dev.44

### Patch Changes

- fix: for the paste node trpc procedure emit the migrated nodes instead of original one. Add support for updating multiple nodes and introduce NodesUpdated event
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.44
  - @badaitech/chaingraph-nodes@0.5.5-dev.44
  - @badaitech/chaingraph-types@0.5.5-dev.44
  - @badaitech/chaingraph-trpc@0.5.5-dev.44

## 0.5.5-dev.43

### Patch Changes

- fix: update default value handling in decorators and improve error messaging in edge transfer logic
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.5.5-dev.43
  - @badaitech/chaingraph-types@0.5.5-dev.43
  - @badaitech/chaingraph-executor@0.5.5-dev.43
  - @badaitech/chaingraph-trpc@0.5.5-dev.43

## 0.5.5-dev.42

### Patch Changes

- fix: remove conditional checks for release branch in GitHub Actions and restore trpc dependencies in package.json
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.42
  - @badaitech/chaingraph-nodes@0.5.5-dev.42
  - @badaitech/chaingraph-types@0.5.5-dev.42
  - @badaitech/chaingraph-trpc@0.5.5-dev.42

## 0.5.5-dev.41

### Patch Changes

- fix: remove Storybook references from configuration files, add trpc dependencies to the chaingraph-backend
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.41
  - @badaitech/chaingraph-nodes@0.5.5-dev.41
  - @badaitech/chaingraph-types@0.5.5-dev.41
  - @badaitech/chaingraph-trpc@0.5.5-dev.41

## 0.5.5-dev.40

### Patch Changes

- fix: update execution serialization and flow migration logic
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.40
  - @badaitech/chaingraph-nodes@0.5.5-dev.40
  - @badaitech/chaingraph-types@0.5.5-dev.40
  - @badaitech/chaingraph-trpc@0.5.5-dev.40

## 0.5.5-dev.39

### Patch Changes

- fix: restore @badaitech/typescript-config as a devDependency in package.json and update package versions
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.39
  - @badaitech/chaingraph-nodes@0.5.5-dev.39
  - @badaitech/chaingraph-types@0.5.5-dev.39
  - @badaitech/chaingraph-trpc@0.5.5-dev.39

## 0.5.5-dev.38

### Patch Changes

- fix: restore @badaitech/typescript-config as a devDependency in package.json
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.5.5-dev.38
  - @badaitech/chaingraph-trpc@0.5.5-dev.38
  - @badaitech/chaingraph-executor@0.5.5-dev.38
  - @badaitech/chaingraph-types@0.5.5-dev.38

## 0.5.5-dev.37

### Patch Changes

- feat: update package.json and vite.lib.config.ts to include TRPC and SuperJSON dependencies
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.37
  - @badaitech/chaingraph-nodes@0.5.5-dev.37
  - @badaitech/chaingraph-types@0.5.5-dev.37
  - @badaitech/chaingraph-trpc@0.5.5-dev.37

## 0.5.5-dev.36

### Patch Changes

- feat: update TRPC client and initialization to improve type exports and re-export NodeRegistry and SuperJSON
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.36
  - @badaitech/chaingraph-nodes@0.5.5-dev.36
  - @badaitech/chaingraph-types@0.5.5-dev.36
  - @badaitech/chaingraph-trpc@0.5.5-dev.36

## 0.5.5-dev.35

### Patch Changes

- feat: enhance KafkaEventBus message handling with improved error logging and header checks; add comprehensive tests for execution event serialization
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.35
  - @badaitech/chaingraph-nodes@0.5.5-dev.35
  - @badaitech/chaingraph-types@0.5.5-dev.35
  - @badaitech/chaingraph-trpc@0.5.5-dev.35

## 0.5.5-dev.34

### Patch Changes

- feat: implement TextDecoderStream and TextEncoderStream polyfills; update serialization and execution events to use SuperJSON for data handling
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.34
  - @badaitech/chaingraph-nodes@0.5.5-dev.34
  - @badaitech/chaingraph-types@0.5.5-dev.34
  - @badaitech/chaingraph-trpc@0.5.5-dev.34

## 0.5.5-dev.33

### Patch Changes

- feat: add @mixmark-io/domino dependency to package.json for enhanced functionality
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.33
  - @badaitech/chaingraph-nodes@0.5.5-dev.33
  - @badaitech/chaingraph-trpc@0.5.5-dev.33
  - @badaitech/chaingraph-types@0.5.5-dev.33

## 0.5.5-dev.32

### Patch Changes

- feat: Add flow migration from v1 to v2 schema. Make the ports id's unique for the nodes only. chore: update dependencies and optimize code structure, improve flow node cloning logic
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.32
  - @badaitech/chaingraph-nodes@0.5.5-dev.32
  - @badaitech/chaingraph-types@0.5.5-dev.32
  - @badaitech/chaingraph-trpc@0.5.5-dev.32

## 0.5.5-dev.31

### Patch Changes

- Add new special specal login and sign methods with telegram params
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.31
  - @badaitech/chaingraph-nodes@0.5.5-dev.31
  - @badaitech/chaingraph-trpc@0.5.5-dev.31
  - @badaitech/chaingraph-types@0.5.5-dev.31

## 0.5.5-dev.30

### Patch Changes

- feat: optimize flow node and edge addition with batch processing for improved performance
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.30
  - @badaitech/chaingraph-nodes@0.5.5-dev.30
  - @badaitech/chaingraph-types@0.5.5-dev.30
  - @badaitech/chaingraph-trpc@0.5.5-dev.30

## 0.5.5-dev.29

### Patch Changes

- feat: optimize Kafka event processing with partitioning strategy and header filtering for improved performance
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.29
  - @badaitech/chaingraph-nodes@0.5.5-dev.29
  - @badaitech/chaingraph-trpc@0.5.5-dev.29
  - @badaitech/chaingraph-types@0.5.5-dev.29

## 0.5.5-dev.28

### Patch Changes

- feat: enhance node and port cloning with deep copy for improved performance, add option to disable events when adding edges to the flow
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.28
  - @badaitech/chaingraph-nodes@0.5.5-dev.28
  - @badaitech/chaingraph-types@0.5.5-dev.28
  - @badaitech/chaingraph-trpc@0.5.5-dev.28

## 0.5.5-dev.27

### Patch Changes

- feat: enhance metrics tracking for Kafka event bus and task queue operations
- Updated dependencies
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.27
  - @badaitech/chaingraph-nodes@0.5.5-dev.27
  - @badaitech/chaingraph-trpc@0.5.5-dev.27
  - @badaitech/chaingraph-types@0.5.5-dev.27

## 0.5.5-dev.26

### Patch Changes

- feat: add 'Local' variable namespace option to variable nodes
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.26
  - @badaitech/chaingraph-nodes@0.5.5-dev.26
  - @badaitech/chaingraph-types@0.5.5-dev.26
  - @badaitech/chaingraph-trpc@0.5.5-dev.26

## 0.5.5-dev.25

### Patch Changes

- feat: reduce staleTime for data fetching to improve responsiveness
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.25
  - @badaitech/chaingraph-trpc@0.5.5-dev.25
  - @badaitech/chaingraph-nodes@0.5.5-dev.25
  - @badaitech/chaingraph-types@0.5.5-dev.25

## 0.5.5-dev.24

### Patch Changes

- feat: add integration details for ArchAI and Wallet in execution details view
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.24
  - @badaitech/chaingraph-nodes@0.5.5-dev.24
  - @badaitech/chaingraph-trpc@0.5.5-dev.24
  - @badaitech/chaingraph-types@0.5.5-dev.24

## 0.5.5-dev.23

### Patch Changes

- feat: simplify JSON export formatting by removing indentation
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.23
  - @badaitech/chaingraph-nodes@0.5.5-dev.23
  - @badaitech/chaingraph-types@0.5.5-dev.23
  - @badaitech/chaingraph-trpc@0.5.5-dev.23

## 0.5.5-dev.22

### Patch Changes

- feat: enhance edge connection handling with parallel execution and improved error logging
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.22
  - @badaitech/chaingraph-nodes@0.5.5-dev.22
  - @badaitech/chaingraph-types@0.5.5-dev.22
  - @badaitech/chaingraph-trpc@0.5.5-dev.22

## 0.5.5-dev.21

### Patch Changes

- feat: extend ClipboardDataSchema to support legacy SerializedNodeSchemaV1
- Updated dependencies
  - @badaitech/chaingraph-trpc@0.5.5-dev.21
  - @badaitech/chaingraph-executor@0.5.5-dev.21
  - @badaitech/chaingraph-nodes@0.5.5-dev.21
  - @badaitech/chaingraph-types@0.5.5-dev.21

## 0.5.5-dev.20

### Patch Changes

- feat: rename auth-example to full-cycle-example, enhance GraphQL client integration, and add environment configuration
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.20
  - @badaitech/chaingraph-nodes@0.5.5-dev.20
  - @badaitech/chaingraph-types@0.5.5-dev.20
  - @badaitech/chaingraph-trpc@0.5.5-dev.20

## 0.5.5-dev.19

### Patch Changes

- feat: enhance flow initialization with Kafka topic creation and optimize producer configurations
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.19
  - @badaitech/chaingraph-nodes@0.5.5-dev.19
  - @badaitech/chaingraph-types@0.5.5-dev.19
  - @badaitech/chaingraph-trpc@0.5.5-dev.19

## 0.5.5-dev.18

### Patch Changes

- feat: enhance GraphQL client integration, optimize Kafka configurations, and update message fields
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.18
  - @badaitech/chaingraph-nodes@0.5.5-dev.18
  - @badaitech/chaingraph-types@0.5.5-dev.18
  - @badaitech/chaingraph-trpc@0.5.5-dev.18

## 0.5.5-dev.17

### Patch Changes

- feat: enhance module exports and update dependencies for computed and complex ports
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.17
  - @badaitech/chaingraph-nodes@0.5.5-dev.17
  - @badaitech/chaingraph-types@0.5.5-dev.17
  - @badaitech/chaingraph-trpc@0.5.5-dev.17

## 0.5.5-dev.16

### Patch Changes

- feat: enhance module exports by refining imports for computed and complex ports
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.16
  - @badaitech/chaingraph-nodes@0.5.5-dev.16
  - @badaitech/chaingraph-types@0.5.5-dev.16
  - @badaitech/chaingraph-trpc@0.5.5-dev.16

## 0.5.5-dev.15

### Patch Changes

- feat: add distributed execution mode and enhance module imports for computed and complex ports
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.15
  - @badaitech/chaingraph-nodes@0.5.5-dev.15
  - @badaitech/chaingraph-types@0.5.5-dev.15
  - @badaitech/chaingraph-trpc@0.5.5-dev.15

## 0.5.5-dev.14

### Patch Changes

- feat: enhance Kafka configuration with topics prefix and improve error handling in task publishing
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.14
  - @badaitech/chaingraph-nodes@0.5.5-dev.14
  - @badaitech/chaingraph-types@0.5.5-dev.14
  - @badaitech/chaingraph-trpc@0.5.5-dev.14

## 0.5.5-dev.13

### Patch Changes

- Bump version
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.13
  - @badaitech/chaingraph-nodes@0.5.5-dev.13
  - @badaitech/chaingraph-types@0.5.5-dev.13
  - @badaitech/chaingraph-trpc@0.5.5-dev.13

## 0.5.5-dev.12

### Patch Changes

- feat: enhance initialization process with improved state management, add flow metadata loading effect, and update environment configuration
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.12
  - @badaitech/chaingraph-nodes@0.5.5-dev.12
  - @badaitech/chaingraph-types@0.5.5-dev.12
  - @badaitech/chaingraph-trpc@0.5.5-dev.12

## 0.5.5-dev.11

### Patch Changes

- One more try, recreate samples in the stores file.
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.11
  - @badaitech/chaingraph-nodes@0.5.5-dev.11
  - @badaitech/chaingraph-types@0.5.5-dev.11
  - @badaitech/chaingraph-trpc@0.5.5-dev.11

## 0.5.5-dev.10

### Patch Changes

- One more try, playing around dependencies versions
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.10
  - @badaitech/chaingraph-nodes@0.5.5-dev.10
  - @badaitech/chaingraph-types@0.5.5-dev.10
  - @badaitech/chaingraph-trpc@0.5.5-dev.10

## 0.5.5-dev.9

### Patch Changes

- One more try, adjust here and there some init process logic
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.9
  - @badaitech/chaingraph-nodes@0.5.5-dev.9
  - @badaitech/chaingraph-types@0.5.5-dev.9
  - @badaitech/chaingraph-trpc@0.5.5-dev.9

## 0.5.5-dev.8

### Patch Changes

- One more try to fix issues with active flow id metadata
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.8
  - @badaitech/chaingraph-nodes@0.5.5-dev.8
  - @badaitech/chaingraph-types@0.5.5-dev.8
  - @badaitech/chaingraph-trpc@0.5.5-dev.8

## 0.5.5-dev.7

### Patch Changes

- feat: simplify initialization flow with improved state management and error handling; add auto-loading of active flow metadata
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.7
  - @badaitech/chaingraph-nodes@0.5.5-dev.7
  - @badaitech/chaingraph-types@0.5.5-dev.7
  - @badaitech/chaingraph-trpc@0.5.5-dev.7

## 0.5.5-dev.6

### Patch Changes

- feat: add flow metadata loading effect and enhance active flow state management
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.6
  - @badaitech/chaingraph-nodes@0.5.5-dev.6
  - @badaitech/chaingraph-types@0.5.5-dev.6
  - @badaitech/chaingraph-trpc@0.5.5-dev.6

## 0.5.5-dev.5

### Patch Changes

- feat: enhance ChainGraphProvider with memoization for stability and improved initialization handling
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.5
  - @badaitech/chaingraph-nodes@0.5.5-dev.5
  - @badaitech/chaingraph-types@0.5.5-dev.5
  - @badaitech/chaingraph-trpc@0.5.5-dev.5

## 0.5.5-dev.4

### Patch Changes

- Add more debug logs
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.4
  - @badaitech/chaingraph-nodes@0.5.5-dev.4
  - @badaitech/chaingraph-types@0.5.5-dev.4
  - @badaitech/chaingraph-trpc@0.5.5-dev.4

## 0.5.5-dev.3

### Patch Changes

- feat: comment out unused Chaingraph dependencies and disable keepNames option in esbuild configuration
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.3
  - @badaitech/chaingraph-nodes@0.5.5-dev.3
  - @badaitech/chaingraph-types@0.5.5-dev.3
  - @badaitech/chaingraph-trpc@0.5.5-dev.3

## 0.5.5-dev.2

### Patch Changes

- Try to pass switchSubscriptionFx always and do not track switchSubscriptionFx.pending
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.2
  - @badaitech/chaingraph-nodes@0.5.5-dev.2
  - @badaitech/chaingraph-trpc@0.5.5-dev.2
  - @badaitech/chaingraph-types@0.5.5-dev.2

## 0.5.5-dev.1

### Patch Changes

- feat: enhance initialization process with connection deduplication and secure session hashing; add ChainGraphProvider component
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.1
  - @badaitech/chaingraph-nodes@0.5.5-dev.1
  - @badaitech/chaingraph-types@0.5.5-dev.1
  - @badaitech/chaingraph-trpc@0.5.5-dev.1

## 0.5.5-dev.0

### Patch Changes

- Experimental version to debug the external integrations
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.5-dev.0
  - @badaitech/chaingraph-nodes@0.5.5-dev.0
  - @badaitech/chaingraph-trpc@0.5.5-dev.0
  - @badaitech/chaingraph-types@0.5.5-dev.0

## 0.5.4

### Patch Changes

- feat: add VITE_CHAINGRAPH_EXECUTOR_WS_URL to environment variables and comment out unused file handling code
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.4
  - @badaitech/chaingraph-nodes@0.5.4
  - @badaitech/chaingraph-types@0.5.4
  - @badaitech/chaingraph-trpc@0.5.4

## 0.5.3

### Patch Changes

- fix: resolve pino-pretty transport error in production builds
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.3
  - @badaitech/chaingraph-nodes@0.5.3
  - @badaitech/chaingraph-types@0.5.3
  - @badaitech/chaingraph-trpc@0.5.3

## 0.5.2

### Patch Changes

- feat: refactor Dockerfile and configuration files; remove unused dependencies and optimize build process
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.2
  - @badaitech/chaingraph-nodes@0.5.2
  - @badaitech/chaingraph-types@0.5.2
  - @badaitech/chaingraph-trpc@0.5.2

## 0.5.1

### Patch Changes

- feat: update Dockerfile and package configurations; add new dependencies for Kafka and LZ4 support, and streamline production dependency installation
- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.1
  - @badaitech/chaingraph-nodes@0.5.1
  - @badaitech/chaingraph-trpc@0.5.1
  - @badaitech/chaingraph-types@0.5.1

## 0.5.0

### Minor Changes

- feat: Add Kafka-based distributed execution with horizontal scaling, microservices architecture, and Docker deployment support

### Patch Changes

- Updated dependencies
  - @badaitech/chaingraph-executor@0.5.0
  - @badaitech/chaingraph-nodes@0.5.0
  - @badaitech/chaingraph-types@0.5.0
  - @badaitech/chaingraph-trpc@0.5.0
