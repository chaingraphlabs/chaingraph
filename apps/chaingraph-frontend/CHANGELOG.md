# @badaitech/chaingraph-frontend

## 0.1.28

### Patch Changes

- 0g llm node implementation and fixes
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.28
  - @badaitech/chaingraph-types@0.1.28
  - @badaitech/chaingraph-trpc@0.1.28
  - @badaitech/badai-api@0.1.28

## 0.1.27

### Patch Changes

- Fix http node body port visibility and improve descriptions. CI build docker only for the "release" branch.
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.27
  - @badaitech/chaingraph-types@0.1.27
  - @badaitech/chaingraph-trpc@0.1.27
  - @badaitech/badai-api@0.1.27

## 0.1.26

### Patch Changes

- Remove duplicate for the "on new message event" node. Fallback for array port value serialization.
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.26
  - @badaitech/chaingraph-types@0.1.26
  - @badaitech/badai-api@0.1.26
  - @badaitech/chaingraph-trpc@0.1.26

## 0.1.25

### Patch Changes

- Fix stream port UI
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.25
  - @badaitech/chaingraph-types@0.1.25
  - @badaitech/chaingraph-trpc@0.1.25
  - @badaitech/badai-api@0.1.25

## 0.1.24

### Patch Changes

- eb4cf29: Add the ArchAI integration tab with configurable session and nodes context. When execution ID exists then disable all port inputs. Merge execution node and editor nodes UI to make it interactive after execution complete. Add BadAI nodes in the hidden category as fallback. Fix ports serialize/deserialize undefined and null values with fallback. Recursive open Any port underlying type. Improve LLM call with structured output node. Now it work well with Groq and any other LLM's. Add retries with error feedback. Other changes and bug fixes.
- Small fixes for the session token in root provider and get variable node
- d5409b8: Fix backend build
- 639038b: Redevelop gate node, now it handles complex types much better. Add LLM Call with structured output node. Add basic value Object node with mutable schema. Rename BadAI to ArchAI nodes and category. Add math And node. Add yaml helper to handlebars template. Add OKX nodes to build whole swap flow. Add PortCreate, PortDelete events to the node. Improve here and there core port, nodes, flow logic as well as port plugins.
- d5409b8: Fix deserialization
- d5409b8: Fix enum deserialize
- Updated dependencies [eb4cf29]
- Updated dependencies
- Updated dependencies [d5409b8]
- Updated dependencies [639038b]
- Updated dependencies [d5409b8]
- Updated dependencies [d5409b8]
  - @badaitech/chaingraph-nodes@0.1.24
  - @badaitech/chaingraph-types@0.1.24
  - @badaitech/chaingraph-trpc@0.1.24
  - @badaitech/badai-api@0.1.24

## 0.1.24-dev.4

### Patch Changes

- Add the ArchAI integration tab with configurable session and nodes context. When execution ID exists then disable all port inputs. Merge execution node and editor nodes UI to make it interactive after execution complete. Add BadAI nodes in the hidden category as fallback. Fix ports serialize/deserialize undefined and null values with fallback. Recursive open Any port underlying type. Improve LLM call with structured output node. Now it work well with Groq and any other LLM's. Add retries with error feedback. Other changes and bug fixes.
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.24-dev.4
  - @badaitech/chaingraph-types@0.1.24-dev.4
  - @badaitech/chaingraph-trpc@0.1.24-dev.4
  - @badaitech/badai-api@0.1.24-dev.4

## 0.1.24-dev.3

### Patch Changes

- Fix enum deserialize
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.24-dev.3
  - @badaitech/chaingraph-types@0.1.24-dev.3
  - @badaitech/chaingraph-trpc@0.1.24-dev.3

## 0.1.24-dev.2

### Patch Changes

- Fix deserialization
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.24-dev.2
  - @badaitech/chaingraph-types@0.1.24-dev.2
  - @badaitech/chaingraph-trpc@0.1.24-dev.2

## 0.1.24-dev.1

### Patch Changes

- Fix backend build
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.24-dev.1
  - @badaitech/chaingraph-types@0.1.24-dev.1
  - @badaitech/chaingraph-trpc@0.1.24-dev.1

## 0.1.24-dev.0

### Patch Changes

- 639038b: Redevelop gate node, now it handles complex types much better. Add LLM Call with structured output node. Add basic value Object node with mutable schema. Rename BadAI to ArchAI nodes and category. Add math And node. Add yaml helper to handlebars template. Add OKX nodes to build whole swap flow. Add PortCreate, PortDelete events to the node. Improve here and there core port, nodes, flow logic as well as port plugins.
- Updated dependencies [639038b]
  - @badaitech/chaingraph-nodes@0.1.24-dev.0
  - @badaitech/chaingraph-types@0.1.24-dev.0
  - @badaitech/chaingraph-trpc@0.1.24-dev.0

## 0.1.23

### Patch Changes

- Fix the port plugins undefined serialize/deserialize errors
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.23
  - @badaitech/chaingraph-types@0.1.23
  - @badaitech/chaingraph-trpc@0.1.23

## 0.1.22

### Patch Changes

- default category metadata
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.22
  - @badaitech/chaingraph-trpc@0.1.22
  - @badaitech/chaingraph-types@0.1.22

## 0.1.21

### Patch Changes

- Add memory locks for atomic updates, fix flow sync issues, add gate node, improve 'any' type port connections
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.21
  - @badaitech/chaingraph-types@0.1.21
  - @badaitech/chaingraph-trpc@0.1.21

## 0.1.20

### Patch Changes

- Bump version
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.20
  - @badaitech/chaingraph-trpc@0.1.20
  - @badaitech/chaingraph-types@0.1.20

## 0.1.19

### Patch Changes

- Bump package
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.19
  - @badaitech/chaingraph-trpc@0.1.19
  - @badaitech/chaingraph-types@0.1.19

## 0.1.18

### Patch Changes

- Improve the sidebar execution events card to be more informative and easy to understand. Improve port doc tooltips design and colors, fix several bugs.
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.18
  - @badaitech/chaingraph-trpc@0.1.18
  - @badaitech/chaingraph-types@0.1.18

## 0.1.17

### Patch Changes

- Add port documentation and debug value tooltip. Make port order configurable
- Updated dependencies
  - @badaitech/chaingraph-types@0.1.17
  - @badaitech/chaingraph-nodes@0.1.17
  - @badaitech/chaingraph-trpc@0.1.17

## 0.1.16

### Patch Changes

- Fix the group node color picker. Add the handlebars log function call to send the event to the context.
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.16
  - @badaitech/chaingraph-trpc@0.1.16
  - @badaitech/chaingraph-types@0.1.16

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
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.15
  - @badaitech/chaingraph-types@0.1.15
  - @badaitech/chaingraph-trpc@0.1.15

## 0.1.15-dev.10

### Patch Changes

- add HandlebarsTemplateNode
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.15-dev.10
  - @badaitech/chaingraph-types@0.1.15-dev.10
  - @badaitech/chaingraph-trpc@0.1.15-dev.10

## 0.1.15-dev.9

### Patch Changes

- Add get port schema node
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.15-dev.9
  - @badaitech/chaingraph-types@0.1.15-dev.9
  - @badaitech/chaingraph-trpc@0.1.15-dev.9

## 0.1.15-dev.8

### Patch Changes

- Add BadAI finish message node and enchanceother BadAI nodes
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.15-dev.8
  - @badaitech/chaingraph-types@0.1.15-dev.8
  - @badaitech/chaingraph-trpc@0.1.15-dev.8

## 0.1.15-dev.7

### Patch Changes

- Add connections metadata to the port metadata. Improve badai streaming node
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.15-dev.7
  - @badaitech/chaingraph-types@0.1.15-dev.7
  - @badaitech/chaingraph-trpc@0.1.15-dev.7

## 0.1.15-dev.6

### Patch Changes

- Improve stream message node
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.15-dev.6
  - @badaitech/chaingraph-types@0.1.15-dev.6
  - @badaitech/chaingraph-trpc@0.1.15-dev.6

## 0.1.15-dev.5

### Patch Changes

- Add on stream started node
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.15-dev.5
  - @badaitech/chaingraph-types@0.1.15-dev.5
  - @badaitech/chaingraph-trpc@0.1.15-dev.5

## 0.1.15-dev.4

### Patch Changes

- Add bunch of BadAI nodes
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.15-dev.4
  - @badaitech/chaingraph-types@0.1.15-dev.4
  - @badaitech/chaingraph-trpc@0.1.15-dev.4

## 0.1.15-dev.3

### Patch Changes

- add array length node
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.15-dev.3
  - @badaitech/chaingraph-types@0.1.15-dev.3
  - @badaitech/chaingraph-trpc@0.1.15-dev.3

## 0.1.15-dev.2

### Patch Changes

- Add filter node
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.15-dev.2
  - @badaitech/chaingraph-types@0.1.15-dev.2
  - @badaitech/chaingraph-trpc@0.1.15-dev.2

## 0.1.15-dev.1

### Patch Changes

- Add multiple nodes: BadAIChatHistoryNode, BadAIChatMetaNode, OnNewMessageEventNode, BranchNode, NotNode
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.15-dev.1
  - @badaitech/chaingraph-types@0.1.15-dev.1
  - @badaitech/chaingraph-trpc@0.1.15-dev.1

## 0.1.15-dev.0

### Patch Changes

- New nodes and tsconfig fixes.
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.15-dev.0
  - @badaitech/chaingraph-types@0.1.15-dev.0
  - @badaitech/chaingraph-trpc@0.1.15-dev.0

## 0.1.14

### Patch Changes

- Regenerate GQL badai client. Create new badai api instance instead of useing predefined one
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.14
  - @badaitech/chaingraph-trpc@0.1.14
  - @badaitech/chaingraph-types@0.1.14

## 0.1.13

### Patch Changes

- styles for theme provider
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.13
  - @badaitech/chaingraph-types@0.1.13
  - @badaitech/chaingraph-trpc@0.1.13

## 0.1.12

### Patch Changes

- Shandow dom added
- 2376c69: shadow dom
- Updated dependencies
- Updated dependencies [2376c69]
  - @badaitech/chaingraph-nodes@0.1.12
  - @badaitech/chaingraph-types@0.1.12
  - @badaitech/chaingraph-trpc@0.1.12

## 0.1.11

### Patch Changes

- Make packages public
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.11
  - @badaitech/chaingraph-trpc@0.1.11
  - @badaitech/chaingraph-types@0.1.11

## 0.1.10

### Patch Changes

- bump version
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.10
  - @badaitech/chaingraph-types@0.1.10
  - @badaitech/chaingraph-trpc@0.1.10

## 0.1.9

### Patch Changes

- Add prefix to the pg schema tables. Update drizzle config. Add Dockerfile for db migration.
- Updated dependencies
  - @badaitech/chaingraph-trpc@0.1.9
  - @badaitech/chaingraph-nodes@0.1.9
  - @badaitech/chaingraph-types@0.1.9

## 0.1.9-dev.0

### Patch Changes

- shadow dom
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.9-dev.0
  - @badaitech/chaingraph-trpc@0.1.9-dev.0
  - @badaitech/chaingraph-types@0.1.9-dev.0

## 0.1.9-2

### Minor Changes

- Change release condition

### Patch Changes

- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.9-2
  - @badaitech/chaingraph-trpc@0.1.9-2
  - @badaitech/chaingraph-types@0.1.9-2

## 0.1.9-1

### Minor Changes

- New release process

### Patch Changes

- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.9-1
  - @badaitech/chaingraph-trpc@0.1.9-1
  - @badaitech/chaingraph-types@0.1.9-1

## 0.1.9

### Patch Changes

- Bump version
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.9
  - @badaitech/chaingraph-trpc@0.1.9
  - @badaitech/chaingraph-types@0.1.9

## 0.1.8

### Patch Changes

- 83524d7: Add docker images release workflow
- Updated dependencies [83524d7]
  - @badaitech/chaingraph-nodes@0.1.8
  - @badaitech/chaingraph-trpc@0.1.8
  - @badaitech/chaingraph-types@0.1.8

## 0.1.7

### Patch Changes

- Bump version
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.7
  - @badaitech/chaingraph-types@0.1.7
  - @badaitech/chaingraph-trpc@0.1.7

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
- Updated dependencies [4848793]
- Updated dependencies [b6f1191]
- Updated dependencies [a8a7eb3]
- Updated dependencies [b2c0c68]
- Updated dependencies [b2c0c68]
- Updated dependencies [a8a7eb3]
- Updated dependencies [4848793]
- Updated dependencies [c21e8c0]
- Updated dependencies [4848793]
- Updated dependencies [4848793]
- Updated dependencies [b2c0c68]
- Updated dependencies [4848793]
- Updated dependencies [4848793]
- Updated dependencies [a8a7eb3]
- Updated dependencies [a8a7eb3]
- Updated dependencies [4848793]
- Updated dependencies [b6f1191]
- Updated dependencies [4848793]
- Updated dependencies [4848793]
- Updated dependencies [4848793]
- Updated dependencies [b2c0c68]
- Updated dependencies [b6f1191]
- Updated dependencies [4848793]
- Updated dependencies [4848793]
- Updated dependencies [150a6de]
- Updated dependencies [4848793]
- Updated dependencies [a8a7eb3]
- Updated dependencies [4848793]
- Updated dependencies [b2c0c68]
- Updated dependencies [4848793]
- Updated dependencies [b6f1191]
- Updated dependencies [4848793]
- Updated dependencies [b6f1191]
- Updated dependencies [b6f1191]
- Updated dependencies [b6f1191]
- Updated dependencies [4848793]
- Updated dependencies [4848793]
- Updated dependencies [b6f1191]
- Updated dependencies [a8a7eb3]
- Updated dependencies [b2c0c68]
- Updated dependencies [a8a7eb3]
- Updated dependencies [b6f1191]
- Updated dependencies [b2c0c68]
- Updated dependencies [4848793]
- Updated dependencies [b2c0c68]
- Updated dependencies [b6f1191]
- Updated dependencies [4848793]
- Updated dependencies [4848793]
- Updated dependencies [4848793]
- Updated dependencies [4848793]
- Updated dependencies [a8a7eb3]
- Updated dependencies [4848793]
  - @badaitech/chaingraph-nodes@0.1.6
  - @badaitech/chaingraph-types@0.1.6
  - @badaitech/chaingraph-trpc@0.1.6

## 0.1.6-dev.51

### Patch Changes

- One more build with many small changes
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.51
  - @badaitech/chaingraph-types@0.1.6-dev.51
  - @badaitech/chaingraph-trpc@0.1.6-dev.51

## 0.1.6-dev.50

### Patch Changes

- Add tailwind css prefix 'cg-'
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.50
  - @badaitech/chaingraph-types@0.1.6-dev.50
  - @badaitech/chaingraph-trpc@0.1.6-dev.50

## 0.1.6-dev.49

### Patch Changes

- Adjust trpc connection
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.49
  - @badaitech/chaingraph-types@0.1.6-dev.49
  - @badaitech/chaingraph-trpc@0.1.6-dev.49

## 0.1.6-dev.48

### Patch Changes

- fix theme provider
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.48
  - @badaitech/chaingraph-types@0.1.6-dev.48
  - @badaitech/chaingraph-trpc@0.1.6-dev.48

## 0.1.6-dev.47

### Patch Changes

- minify css for lib build
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.47
  - @badaitech/chaingraph-types@0.1.6-dev.47
  - @badaitech/chaingraph-trpc@0.1.6-dev.47

## 0.1.6-dev.46

### Patch Changes

- Remove outdated CSS files
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.46
  - @badaitech/chaingraph-types@0.1.6-dev.46
  - @badaitech/chaingraph-trpc@0.1.6-dev.46

## 0.1.6-dev.45

### Patch Changes

- Add nanoid with custom alphabet for generating flow id's
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.45
  - @badaitech/chaingraph-types@0.1.6-dev.45
  - @badaitech/chaingraph-trpc@0.1.6-dev.45

## 0.1.6-dev.44

### Patch Changes

- - Add authentication service to the chaingraph backend with two modes: dev and badai. When Dev mode is configured, then server will accept any requests. When badai is configured, then the server will expect the BadAI session JWT tokoken provided.
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.44
  - @badaitech/chaingraph-types@0.1.6-dev.44
  - @badaitech/chaingraph-trpc@0.1.6-dev.44

## 0.1.6-dev.43

### Patch Changes

- Fix ui logic and effector store execution reset trigger
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.43
  - @badaitech/chaingraph-types@0.1.6-dev.43
  - @badaitech/chaingraph-trpc@0.1.6-dev.43

## 0.1.6-dev.42

### Patch Changes

- Include badaitech package to external one
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.42
  - @badaitech/chaingraph-types@0.1.6-dev.42
  - @badaitech/chaingraph-trpc@0.1.6-dev.42

## 0.1.6-dev.41

### Patch Changes

- move node samples to the store file
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.41
  - @badaitech/chaingraph-types@0.1.6-dev.41

## 0.1.6-dev.40

### Patch Changes

- Add effector stores import file to root provider
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.40
  - @badaitech/chaingraph-types@0.1.6-dev.40

## 0.1.6-dev.39

### Patch Changes

- Rewrite trpc client initialization
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.39
  - @badaitech/chaingraph-types@0.1.6-dev.39

## 0.1.6-dev.38

### Patch Changes

- Play around effector stores
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.38
  - @badaitech/chaingraph-types@0.1.6-dev.38

## 0.1.6-dev.37

### Patch Changes

- Play around effector stores to make it work
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.37
  - @badaitech/chaingraph-types@0.1.6-dev.37

## 0.1.6-dev.36

### Patch Changes

- add effector logs
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.36
  - @badaitech/chaingraph-types@0.1.6-dev.36

## 0.1.6-dev.35

### Patch Changes

- Add effector logger, adjust static trpc client creation without duplicates
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.35
  - @badaitech/chaingraph-types@0.1.6-dev.35

## 0.1.6-dev.34

### Patch Changes

- add styles
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.34
  - @badaitech/chaingraph-types@0.1.6-dev.34

## 0.1.6-dev.33

### Patch Changes

- New try to include all styles to the bundle
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.33
  - @badaitech/chaingraph-types@0.1.6-dev.33

## 0.1.6-dev.32

### Patch Changes

- adjust configs for styles
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.32
  - @badaitech/chaingraph-types@0.1.6-dev.32

## 0.1.6-dev.31

### Patch Changes

- Adjust build config to include styles to the npm bundle
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.31
  - @badaitech/chaingraph-types@0.1.6-dev.31

## 0.1.6-dev.30

### Patch Changes

- add styles export for the frontend lib
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.30
  - @badaitech/chaingraph-types@0.1.6-dev.30

## 0.1.6-dev.29

### Patch Changes

- Remove debug
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.29
  - @badaitech/chaingraph-types@0.1.6-dev.29

## 0.1.6-dev.28

### Patch Changes

- Try to explicitly provide nodes types instead of take it from the decorator reflection
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.28
  - @badaitech/chaingraph-types@0.1.6-dev.28

## 0.1.6-dev.27

### Patch Changes

- dirty hack to use static TRPC client
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.27
  - @badaitech/chaingraph-types@0.1.6-dev.27

## 0.1.6-dev.26

### Patch Changes

- Adjust root provider initialization
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.26
  - @badaitech/chaingraph-types@0.1.6-dev.26

## 0.1.6-dev.25

### Patch Changes

- Make nodeRegistry as param for the RootProvider
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.25
  - @badaitech/chaingraph-types@0.1.6-dev.25

## 0.1.6-dev.24

### Patch Changes

- Move initialize stores under providers in order to it has a way to use tRPC clients from hook
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.24
  - @badaitech/chaingraph-types@0.1.6-dev.24

## 0.1.6-dev.23

### Patch Changes

- Rewrite TRPC to use TanStack React Query
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.23
  - @badaitech/chaingraph-types@0.1.6-dev.23

## 0.1.6-dev.22

### Patch Changes

- trpc server exports
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.22
  - @badaitech/chaingraph-types@0.1.6-dev.22

## 0.1.6-dev.21

### Patch Changes

- Some changes
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.21
  - @badaitech/chaingraph-types@0.1.6-dev.21

## 0.1.6-dev.20

### Patch Changes

- some changes
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.20
  - @badaitech/chaingraph-types@0.1.6-dev.20

## 0.1.6-dev.19

### Patch Changes

- Add trpc properties to the root provider
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.19
  - @badaitech/chaingraph-types@0.1.6-dev.19

## 0.1.6-dev.18

### Patch Changes

- Add SuperJSON param to initializeJsonTransformers
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.18
  - @badaitech/chaingraph-types@0.1.6-dev.18

## 0.1.6-dev.17

### Patch Changes

- remove useNaviogate from the codebase
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.17
  - @badaitech/chaingraph-types@0.1.6-dev.17

## 0.1.6-dev.16

### Patch Changes

- make react and react dome as external lib
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.16
  - @badaitech/chaingraph-types@0.1.6-dev.16

## 0.1.6-dev.15

### Patch Changes

- change effector nodes stores imports path
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.15
  - @badaitech/chaingraph-types@0.1.6-dev.15

## 0.1.6-dev.14

### Patch Changes

- Change effector store imports order
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.14
  - @badaitech/chaingraph-types@0.1.6-dev.14

## 0.1.6-dev.13

### Patch Changes

- do not include react to the frontend npm lib
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.13
  - @badaitech/chaingraph-types@0.1.6-dev.13

## 0.1.6-dev.12

### Patch Changes

- Fix RootProviders
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.12
  - @badaitech/chaingraph-types@0.1.6-dev.12

## 0.1.6-dev.11

### Patch Changes

- Adjust imports for the fronend stores
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.11
  - @badaitech/chaingraph-types@0.1.6-dev.11

## 0.1.6-dev.10

### Patch Changes

- Apply fix effector
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.10
  - @badaitech/chaingraph-types@0.1.6-dev.10

## 0.1.6-dev.9

### Patch Changes

- One more try
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.9
  - @badaitech/chaingraph-types@0.1.6-dev.9

## 0.1.6-dev.8

### Patch Changes

- Adjust frontend stores import paths
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.8
  - @badaitech/chaingraph-types@0.1.6-dev.8

## 0.1.6-dev.7

### Patch Changes

- One more version
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.7
  - @badaitech/chaingraph-types@0.1.6-dev.7

## 0.1.6-dev.6

### Patch Changes

- One more try boundle frontend
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.6
  - @badaitech/chaingraph-types@0.1.6-dev.6

## 0.1.6-dev.5

### Patch Changes

- One more frontend adjustments
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.5
  - @badaitech/chaingraph-types@0.1.6-dev.5

## 0.1.6-dev.4

### Patch Changes

- One more dev bundle testing
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.4
  - @badaitech/chaingraph-types@0.1.6-dev.4

## 0.1.6-dev.3

### Patch Changes

- Next try
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.3
  - @badaitech/chaingraph-types@0.1.6-dev.3

## 0.1.6-dev.2

### Patch Changes

- adjust the frontend lib vite config
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.2
  - @badaitech/chaingraph-types@0.1.6-dev.2

## 0.1.6-dev.1

### Patch Changes

- remove rollupOptions external from the frontend lib package vite config
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.1
  - @badaitech/chaingraph-types@0.1.6-dev.1

## 0.1.6-dev.0

### Patch Changes

- Remove secret port type and all secret usages
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.6-dev.0
  - @badaitech/chaingraph-types@0.1.6-dev.0

## 0.1.5

### Patch Changes

- Fix and adjust chaingraph-frontend lib NPM package
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.5
  - @badaitech/chaingraph-types@0.1.5

## 0.1.4

### Patch Changes

- 50214bc: Upgrade React to v19. Upgrade other dependencies. Optimize frontend effector stores.
- Updated dependencies [50214bc]
  - @badaitech/chaingraph-nodes@0.1.4
  - @badaitech/chaingraph-types@0.1.4

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
- Updated dependencies [3dcef34]
- Updated dependencies [00464f5]
- Updated dependencies [594f20c]
- Updated dependencies [0938d64]
- Updated dependencies [9c6fd41]
- Updated dependencies [594f20c]
- Updated dependencies [0fbe508]
- Updated dependencies [2b28c97]
- Updated dependencies [ff25864]
- Updated dependencies [f1e40ef]
- Updated dependencies
- Updated dependencies [3dcef34]
- Updated dependencies [594f20c]
  - @badaitech/chaingraph-nodes@0.1.3
  - @badaitech/chaingraph-types@0.1.3

## 0.1.3-alpha.7

### Patch Changes

- 0938d64: Add meta-llama/llama-4-scout-17b-16e-instruct model to the LLM call node. Adjust build configs
- ff25864: Modify turbo.json config to make it depend on packages and make build order correct
- Updated dependencies [0938d64]
- Updated dependencies [ff25864]
  - @badaitech/chaingraph-nodes@0.1.3-alpha.7
  - @badaitech/chaingraph-types@0.1.3-alpha.7

## 0.1.3-alpha.6

### Patch Changes

- Prepare chaingraph-frontend to build lib with components as well as the browser bundle. Adjust packages configs.
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.3-alpha.6
  - @badaitech/chaingraph-types@0.1.3-alpha.6

## 0.1.3-alpha.5

### Patch Changes

- Adjust package.json configs to fix npm package
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.3-alpha.5
  - @badaitech/chaingraph-types@0.1.3-alpha.5

## 0.1.3-alpha.4

### Patch Changes

- bump
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.3-alpha.4
  - @badaitech/chaingraph-types@0.1.3-alpha.4

## 0.1.3-alpha.3

### Patch Changes

- 3dcef34: Simplify release workflow
- 3dcef34: Fix packages configs for the package building.
- Updated dependencies [3dcef34]
- Updated dependencies [3dcef34]
  - @badaitech/chaingraph-nodes@0.1.3-alpha.3
  - @badaitech/chaingraph-types@0.1.3-alpha.3

## 0.1.3-alpha.3

### Patch Changes

- 3dcef34: Simplify release workflow
- Try to fix npm package
- 3dcef34: Fix packages configs for the package building.
- Updated dependencies [3dcef34]
- Updated dependencies
- Updated dependencies [3dcef34]
  - @badaitech/chaingraph-nodes@0.1.3-alpha.3
  - @badaitech/chaingraph-types@0.1.3-alpha.3

## 0.1.3-alpha.2

### Patch Changes

- 2b28c97: Change release workflow for the one more release publish test
- f1e40ef: Ajust release workflow
- Updated dependencies [2b28c97]
- Updated dependencies [f1e40ef]
  - @badaitech/chaingraph-nodes@0.1.3-alpha.2
  - @badaitech/chaingraph-types@0.1.3-alpha.2

## 0.1.3-alpha.1

### Patch Changes

- 9c6fd41: One more release test
- Updated dependencies [9c6fd41]
  - @badaitech/chaingraph-nodes@0.1.3-alpha.1
  - @badaitech/chaingraph-types@0.1.3-alpha.1

## 0.1.3-alpha.0

### Patch Changes

- Test release process
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.3-alpha.0
  - @badaitech/chaingraph-types@0.1.3-alpha.0

## 0.1.2

### Patch Changes

- v0.1.1
- Updated dependencies
  - @badaitech/chaingraph-nodes@0.1.2
  - @badaitech/chaingraph-types@0.1.2
