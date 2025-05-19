# @badaitech/chaingraph-trpc

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
