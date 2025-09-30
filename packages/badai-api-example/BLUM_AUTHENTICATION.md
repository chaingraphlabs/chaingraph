# BLUM Authentication Integration Guide

## Overview

This guide provides a comprehensive explanation of the BLUM authentication integration with the ArchAI platform. The BLUM integration enables Telegram-based user authentication through a secure, wallet-backed system that combines traditional Web3 authentication with Telegram identity verification.

## Architecture

The BLUM authentication system implements a **two-tier authentication architecture**:

1. **Admin Tier**: A privileged account with administrative rights that can authorize user registrations
2. **User Tier**: End users authenticated through Telegram IDs and wallet signatures

```
┌─────────────────────────────────────────────────────────┐
│                   BLUM Auth Flow                        │
│                                                         │
│  ┌──────────┐      ┌──────────┐      ┌──────────────┐   │
│  │  Admin   │─────►│  BadAI   │◄─────│   BLUM User  │   │
│  │  Wallet  │      │ Platform │      │  + Telegram  │   │
│  └──────────┘      └──────────┘      └──────────────┘   │
│       │                  │                    │         │
│       │ 1. Admin Auth    │                    │         │
│       │─────────────────►│                    │         │
│       │                  │                    │         │
│       │ 2. Admin Session │                    │         │
│       │◄─────────────────│                    │         │
│       │                  │                    │         │
│       │                  │ 3. User Challenge  │         │
│       │                  │◄───────────────────│         │
│       │                  │                    │         │
│       │ 4. User Auth     │                    │         │
│       │    (via admin    │                    │         │
│       │     session)     │                    │         │
│       │─────────────────►│                    │         │
│       │                  │                    │         │
│       │                  │ 5. User Session    │         │
│       │                  │───────────────────►│         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Why Two-Tier Authentication?

The two-tier architecture provides several critical benefits:

1. **Access Control**: Admin accounts can gate user registration and authentication
2. **Telegram Integration**: Binds wallet addresses to Telegram user IDs for social verification
3. **Audit Trail**: All user authentications are traceable through admin sessions
4. **Partner Integration**: Allows BLUM to maintain control over user onboarding

## Prerequisites

Before implementing BLUM authentication, ensure you have:

- `@badaitech/badai-api` package installed
- `viem` for wallet operations
- Admin wallet private key (with appropriate permissions)
- Access to user Telegram IDs

### Installation

### Important: NPM Registry Configuration

The `@badaitech` packages are hosted on GitHub Package Registry. You need to configure npm to use the correct registry for `@badaitech` scoped packages.

Create or update your `.npmrc` file in your project root:

```bash
@badaitech:registry=https://npm.pkg.github.com
```

Or configure globally:

```bash
npm config set @badaitech:registry https://npm.pkg.github.com
```

### Install Dependencies

```bash
npm install @badaitech/badai-api viem
```

## Authentication Flow

### Step 1: Admin Authentication

The admin must authenticate first to obtain a privileged session token.

```typescript
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'
import { privateKeyToAccount } from 'viem/accounts'

const restClient = createGraphQLClient('https://api.badai.io/graphql')

// Load admin credentials
const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY
const account = privateKeyToAccount(adminPrivateKey as `0x${string}`)

// 1. Request authentication challenge
const { authMetamaskMessage } = await restClient.request(
  GraphQL.AuthMetamaskMessageDocument,
  { address: account.address }
)

// 2. Sign the challenge message
const signature = await account.signMessage({
  message: authMetamaskMessage
})

// 3. Exchange signature for admin session
const { authMetamaskLogin } = await restClient.request(
  GraphQL.AuthMetamaskLoginDocument,
  {
    input: {
      authMessage: authMetamaskMessage,
      sign: signature,
    }
  }
)

const adminSession = authMetamaskLogin.session
console.log('Admin authenticated:', account.address)
```

**Security Note**: The admin private key should be stored securely and never exposed to end users. Use environment variables or secure key management systems.

### Step 2: User Authentication with Telegram

Once the admin session is established, you can authenticate BLUM users with their Telegram IDs and wallet signatures.

```typescript
import { generatePrivateKey } from 'viem/accounts'

// Generate or retrieve user wallet
const userPrivateKey = generatePrivateKey() // Or load existing key
const userAccount = privateKeyToAccount(userPrivateKey)
const telegramID = 123456789 // User's Telegram ID from BLUM

// 1. Request BLUM-specific authentication challenge
const { authBlumMetamaskMessage } = await restClient.request(
  GraphQL.AuthBlumMetamaskMessageDocument,
  {
    address: userAccount.address,
    input: {
      telegramID: telegramID,
      sign: 'field_for_future_sign', // Reserved for future BLUM signature
    }
  }
)

// 2. User signs the challenge with their wallet
const userSignature = await userAccount.signMessage({
  message: authBlumMetamaskMessage
})

// 3. Complete authentication using admin session
const { authBlumMetamaskLogin } = await restClient.request(
  GraphQL.AuthBlumMetamaskLoginDocument,
  {
    session: adminSession, // ⚠️ Requires admin session
    input: {
      authMessage: authBlumMetamaskMessage,
      sign: userSignature,
    }
  }
)

const userSession = authBlumMetamaskLogin.session
const userProfile = authBlumMetamaskLogin.user_profile

console.log('User authenticated:', userAccount.address)
console.log('Telegram ID:', telegramID)
console.log('Session:', userSession)
```

### Step 3: Using the User Session

Once authenticated, the user session can be used for all API operations:

```typescript
// Fetch user profile
const { userProfile } = await restClient.request(
  GraphQL.GetUserProfileDocument,
  { session: userSession }
)

// Create chat rooms
const { createChatRoom } = await restClient.request(
  GraphQL.CreateChatRoomDocument,
  {
    session: userSession,
    agents: ['agent-id-here'],
  }
)

// Send messages, interact with agents, etc.
```

## Complete Implementation Example

See the full working example in `src/blum-login.ts`:

```typescript
import process from 'node:process'
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

const restApiUrl = process.env.REST_API_URL ?? 'http://localhost:9151/graphql'
const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY ?? ''

async function main() {
    if (!adminPrivateKey) {
        console.error('Please set the ADMIN_PRIVATE_KEY environment variable.')
        process.exit(1)
    }

    // Initialize clients
    const restClient = createGraphQLClient(restApiUrl)

    // 1. Admin flow
    // Generate wallet credentials
    // const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(adminPrivateKey as `0x${string}`)
    console.log('Admin address:', account.address)

    // Authenticate admin
    const { authMetamaskMessage } = await restClient.request(
        GraphQL.AuthMetamaskMessageDocument,
        { address: account.address },
    )

    const signature = await account.signMessage({ message: authMetamaskMessage })

    const { authMetamaskLogin } = await restClient.request(
        GraphQL.AuthMetamaskLoginDocument,
        {
            input: {
                authMessage: authMetamaskMessage,
                sign: signature,
            },
        },
    )

    const adminSession = authMetamaskLogin.session

    // 2. User flow
    // Generate wallet credentials
    const userPrivateKey = generatePrivateKey()
    console.log('User private key (save this!):', userPrivateKey)
    const userAccount = privateKeyToAccount(userPrivateKey)
    const userTelegramID = Math.floor(Math.random() * 1000000) // TODO: Set real Telegram ID here
    console.log('User address:', userAccount.address)

    // Authenticate user, get challenge message
    const { authBlumMetamaskMessage } = await restClient.request(
        GraphQL.AuthBlumMetamaskMessageDocument,
        {
            address: userAccount.address,
            input: {
                telegramID: userTelegramID,
                sign: 'field_for_future_sign',
            },
        },
    )

    // Sign the auth challenge message with the user private key
    const userSignature = await userAccount.signMessage({ message: authBlumMetamaskMessage })

    // Send the signed challenge message to the server to get the auth token (JWT)
    const { authBlumMetamaskLogin } = await restClient.request(
        GraphQL.AuthBlumMetamaskLoginDocument,
        {
            session: adminSession,
            input: {
                authMessage: authBlumMetamaskMessage,
                sign: userSignature,
            },
        },
    )

    const userSession = authBlumMetamaskLogin.session
    console.log('User session (save this!):', userSession)

    const userProfile = authBlumMetamaskLogin.user_profile
    console.log('User profile:', userProfile)

    // Fetch user details to verify JWT session works
    const { userProfile: fetchedUserProfile } = await restClient.request(
        GraphQL.GetUserProfileDocument,
        {
            session: userSession,
        },
    )
    console.log('Fetched user profile:', fetchedUserProfile)
}

main().catch((error) => {
    console.error(error)
})

```
