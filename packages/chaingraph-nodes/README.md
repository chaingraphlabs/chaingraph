# @badaitech/chaingraph-nodes

![License](https://img.shields.io/badge/license-BUSL-blue.svg)

A comprehensive collection of ready-to-use nodes for building computational flows in the ChainGraph flow-based programming framework. This package provides building blocks for AI, data processing, utilities, and more that can be visually composed in the ChainGraph editor.

## Overview

`@badaitech/chaingraph-nodes` offers:

- **AI Integration**: LLM nodes supporting multiple models (OpenAI, Anthropic, DeepSeek)
- **Data Processing**: Text manipulation, stream handling, and serialization nodes
- **API Communication**: HTTP requests, cryptocurrency data fetching, and external service integration
- **Utility Functions**: Regular expressions, debugging, basic operations
- **Flow Control**: Logic branching and conditional execution
- **Integration with BadAI**: Special nodes for BadAI message handling

## Installation

```bash
# Before installing, make sure you have set up authentication for GitHub Packages
npm install @badaitech/chaingraph-nodes
# or
yarn add @badaitech/chaingraph-nodes
# or
pnpm add @badaitech/chaingraph-nodes
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

### Using Node Categories

```typescript
import { 
  NODE_CATEGORIES, 
  CATEGORY_METADATA, 
  getCategoriesMetadata 
} from '@badaitech/chaingraph-nodes'

// Access a specific category
const aiCategory = NODE_CATEGORIES.AI
console.log(`AI Category ID: ${aiCategory}`)

// Get styled metadata for a category
const aiCategoryMeta = CATEGORY_METADATA[aiCategory]
console.log(`AI Category Label: ${aiCategoryMeta.label}`)
console.log(`AI Category Icon: ${aiCategoryMeta.icon}`)

// Get all categories sorted by order
const allCategories = getCategoriesMetadata()
```

### Working with Category Icons

```typescript
import { getCategoryIcon } from '@badaitech/chaingraph-nodes'
import React from 'react'

// In a React component
function CategoryIconDisplay({ categoryName }) {
  const IconComponent = getCategoryIcon(categoryName)
  return <IconComponent size={24} color="currentColor" />
}
```

### Working with Specific Nodes

```typescript
import { LLMCallNode, StreamBufferNode } from '@badaitech/chaingraph-nodes'
import { ExecutionContext } from '@badaitech/chaingraph-types'

// Create and configure an LLM node
const llmNode = new LLMCallNode('my-llm-node')
llmNode.model = 'gpt-4o'
llmNode.prompt = 'Explain quantum computing in simple terms'
llmNode.apiKey = 'your-api-key'
llmNode.temperature = 0.7

// Execute the node
const context = new ExecutionContext('flow-id', new AbortController())
await llmNode.execute(context)

// Create a stream buffer to collect LLM output
const bufferNode = new StreamBufferNode('stream-buffer')
bufferNode.inputStream = llmNode.outputStream
await bufferNode.execute(context)

console.log(bufferNode.buffer) // Collected output from the LLM
```

## Available Node Categories

ChainGraph nodes are organized into the following categories:

- **AI & ML**: Language models, text generation, and AI utilities
- **Data**: Data transformation and manipulation tools
- **Basic Values**: Simple input nodes for numbers, text, and booleans
- **Utilities**: General purpose tools like RegExp, HTTP, and debugging
- **Math**: Mathematical operations and calculations
- **Flow**: Flow control and conditional execution
- **BadAI**: Integration with the BadAI platform
- **Messaging**: Message creation and handling
- **API**: External API connections
- **Secret**: Secure credential management

## Key Nodes

### AI & ML

- **LLM Call**: Interfaces with multiple language models including GPT-4o, Claude, and DeepSeek
  ```typescript
  import { LLMCallNode, LLMModels } from '@badaitech/chaingraph-nodes'
  
  const llm = new LLMCallNode('llm-node')
  llm.model = LLMModels.Gpt4o
  llm.prompt = "Write a short poem about programming"
  llm.temperature = 0.7
  llm.apiKey = "your-api-key"
  
  // The output is available as a stream
  for await (const chunk of llm.outputStream) {
    console.log(chunk)
  }
  ```

### Data Processing

- **Text Search**: Finds substrings within text (case-insensitive)
- **Stream Buffer**: Collects and concatenates chunks from a stream
  ```typescript
  import { StreamBufferNode } from '@badaitech/chaingraph-nodes'
  
  const buffer = new StreamBufferNode('buffer-node')
  buffer.separator = "\n" // Optional separator between chunks
  
  // Connect to a stream source and execute
  buffer.inputStream = someStreamSource
  await buffer.execute(context)
  
  console.log(buffer.buffer) // Full concatenated content
  ```

### Utilities

- **Regular Expression**: Powerful text processing with regex patterns
  ```typescript
  import { RegExpNode, RegExpMode } from '@badaitech/chaingraph-nodes'
  
  const regex = new RegExpNode('regex-node')
  regex.sourceText = "Email me at example@domain.com tomorrow"
  regex.pattern = "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
  regex.mode = RegExpMode.MATCH
  
  await regex.execute(context)
  console.log(regex.result) // "example@domain.com"
  console.log(regex.matchCount) // 1
  ```

- **HTTP Request**: Make API calls to external services
  ```typescript
  import { HttpRequestNode, HttpMethod } from '@badaitech/chaingraph-nodes'
  
  const http = new HttpRequestNode('http-node')
  http.baseUri = "https://api.example.com"
  http.path = "/data"
  http.method = HttpMethod.GET
  http.headers = "Authorization: Bearer token\nContent-Type: application/json"
  
  await http.execute(context)
  console.log(http.statusCode) // Status code from response
  console.log(http.response) // Response body
  ```

- **JSON/YAML Serialization**: Convert data structures to formatted strings
  ```typescript
  import { JSONSerializerNode } from '@badaitech/chaingraph-nodes'
  
  const json = new JSONSerializerNode('json-node')
  json.data = { key: "value", nested: { array: [1, 2, 3] } }
  json.pretty = true
  
  await json.execute(context)
  console.log(json.json) // Formatted JSON string
  ```

### API Integration

- **CoinMarketCap**: Fetch cryptocurrency data
  ```typescript
  import { CoinMarketCapNode } from '@badaitech/chaingraph-nodes'
  
  const crypto = new CoinMarketCapNode('crypto-node')
  crypto.cryptoList = ["BTC", "ETH"]
  crypto.apiKey = "your-cmc-api-key"
  
  await crypto.execute(context)
  console.log(crypto.result) // Array of crypto data objects
  ```

### BadAI Integration

- **Create Message**: Sends messages to BadAI chats
- **On New Message Event**: Triggers on new BadAI messages

### Basic Values

- **Text**, **Number**, and **Boolean** nodes for providing constant values
- **NumberToString**: Converts numbers to strings with precision control

## Node Development

To create your own custom nodes with this package:

```typescript
import { BaseNode, Node, Input, Output, String } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '@badaitech/chaingraph-nodes'

@Node({
  title: 'My Custom Node',
  description: 'A description of what this node does',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['custom', 'example'],
})
class MyCustomNode extends BaseNode {
  @Input()
  @String({
    title: 'Input Text',
    description: 'Text to process',
  })
  inputText: string = ''

  @Output()
  @String({
    title: 'Output Text',
    description: 'Processed text',
  })
  outputText: string = ''

  async execute(context) {
    // Process input and set output
    this.outputText = this.inputText.toUpperCase()
    return {}
  }
}
```

## License

BUSL-1.1 - Business Source License

## Related Packages

- **@badaitech/chaingraph-types**: Core type definitions and decorators
- **@badaitech/chaingraph-frontend**: Frontend components for visual flow programming
- **@badaitech/chaingraph-backend**: Backend services for flow execution