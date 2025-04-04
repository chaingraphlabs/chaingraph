# @badaitech/chaingraph-frontend

Frontend application for the Chaingraph project.

## Installation

```bash
# Before installing, make sure you have set up authentication for GitHub Packages
npm install @badaitech/chaingraph-frontend
# or
yarn add @badaitech/chaingraph-frontend
# or
pnpm add @badaitech/chaingraph-frontend
```

## Usage

This package can be used as a dependency in other projects that want to embed or extend the Chaingraph frontend functionality:

```typescript
import { ChainGraphUI } from '@badaitech/chaingraph-frontend'

// Use the components in your application
```

## Features

- Interactive flow-based graph editor
- Node and edge management
- Themeable UI components
- Integration with Chaingraph backend

## Development

To run the frontend application locally:

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev

# Build for production
pnpm build
```

## Storybook

This package includes Storybook for component development and testing:

```bash
# Run Storybook
pnpm storybook

# Build Storybook
pnpm build-storybook
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

## License

BUSL-1.1
