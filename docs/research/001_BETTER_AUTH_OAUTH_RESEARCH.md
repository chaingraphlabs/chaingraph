# Better Auth & OAuth Server Integration for ChainGraph

## Executive Summary

### Key Findings

**Better Auth as OAuth Client**: Better Auth is a production-ready (v1.3+), framework-agnostic TypeScript authentication library that can handle ChainGraph's OAuth client needs (GitHub, Google, etc.). It integrates with tRPC through context middleware and supports Drizzle ORM with PostgreSQL, making it compatible with ChainGraph's existing architecture.

**Better Auth as OAuth Server**: Better Auth includes an experimental OIDC Provider plugin that enables OAuth server capabilities. However, it is **NOT production-ready** (as of 2025) and is actively being developed. For production OAuth server needs, **Ory Hydra** or **@jmondi/oauth2-server** are recommended alternatives.

**Hybrid Architecture**: ChainGraph can function as both OAuth client (users login via GitHub/Google) and OAuth server (external apps use "Login with ChainGraph"), but this requires careful architectural planning and separate token management strategies.

### Recommended Approach

**Phase 1 (OAuth Client)**: Implement Better Auth for user authentication
- Effort: 2-3 weeks
- Risk: Low
- Benefits: Multi-provider auth, account linking, production-ready

**Phase 2 (OAuth Server)**: Implement Ory Hydra for "Login with ChainGraph"
- Effort: 3-4 weeks
- Risk: Medium
- Benefits: Battle-tested, OAuth 2.1/OIDC certified, scales to millions of requests

**Total Timeline**: 5-7 weeks for full hybrid implementation

### Risk Assessment

**Low Risk**:
- Better Auth OAuth client integration (v1.3+, stable)
- Database schema compatibility (Drizzle custom schema support)

**Medium Risk**:
- Better Auth production issues (cross-domain cookies, session handling)
- Ory Hydra complexity (separate service, Docker deployment)

**High Risk**:
- Using Better Auth OIDC Provider in production (experimental)
- Custom OAuth server implementation (400+ pages of specs)

---

## Part 1: Better Auth as OAuth Client

### 1.1 Library Overview

**Better Auth**
- **Version**: 1.3.34 (latest as of 2025)
- **Status**: Production-ready since v1.0
- **License**: MIT
- **Repository**: https://github.com/better-auth/better-auth
- **Documentation**: https://www.better-auth.com/docs/introduction

**Key Features**:
- Framework-agnostic (works without Next.js)
- TypeScript-first with full type inference
- Plugin ecosystem for extensibility
- Built-in 2FA, passkeys, multi-session support
- Enterprise SSO capabilities
- Rate limiting and CSRF protection built-in
- Database-first session management

**Better Auth vs NextAuth.js**:
| Feature | Better Auth | NextAuth.js |
|---------|-------------|-------------|
| Framework | Agnostic | Next.js-focused |
| Type Safety | Full inference | Partial |
| Plugin System | Official plugins | Manual extensions |
| Built-in 2FA | Yes | No |
| Multi-tenancy | Native support | Custom implementation |
| Rate Limiting | Built-in | Manual |
| Production Status | v1.3+ stable | v4/v5 stable |
| Maintenance | Active (Better Auth team now maintains Auth.js) | Active |

**Verdict**: Better Auth is recommended for new projects in 2025, especially TypeScript-focused ones.

### 1.2 tRPC Integration

Better Auth works with standalone tRPC servers through context integration. While Better Auth uses its own framework ("better-call"), it exposes session management APIs that integrate cleanly with tRPC.

**Integration Pattern**:

```typescript
// 1. Initialize Better Auth
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./db"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: usersTable,
      session: sessionsTable,
      account: externalAccountsTable,
    },
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
})

// 2. Create tRPC context with Better Auth session
import { auth } from "./auth"
import type { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone"

export async function createContext(opts: CreateHTTPContextOptions) {
  // Get session from Better Auth
  const session = await auth.api.getSession({
    headers: opts.req.headers,
  })

  return {
    session,
    db,
    // ... other context
  }
}

// 3. Protected tRPC procedure middleware
import { TRPCError } from "@trpc/server"

const authedProcedure = publicProcedure.use(async (opts) => {
  if (!opts.ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return opts.next({
    ctx: {
      ...opts.ctx,
      user: opts.ctx.session.user,
    },
  })
})

// 4. Use in tRPC router
export const userRouter = router({
  profile: authedProcedure.query(async ({ ctx }) => {
    return ctx.user // Fully typed
  }),
})
```

**Key Points**:
- Better Auth sessions are accessed via `auth.api.getSession()` which reads cookies/headers
- Express req/res objects are NOT required (unlike NextAuth)
- Works with tRPC standalone adapter
- Session management is handled by Better Auth, not tRPC

**Installation**:
```bash
pnpm add better-auth
```

### 1.3 Database Compatibility

Better Auth uses Drizzle ORM and supports custom schema mapping, making it **highly compatible** with ChainGraph's existing database.

**Better Auth Default Schema**:
- `user` table (id, name, email, emailVerified, image, createdAt, updatedAt)
- `session` table (id, userId, token, expiresAt, ipAddress, userAgent, createdAt, updatedAt)
- `account` table (id, userId, accountId, providerId, accessToken, refreshToken, expiresAt, scope, idToken, password, createdAt, updatedAt)
- `verification` table (id, identifier, value, expiresAt, createdAt, updatedAt)

**ChainGraph Current Schema**:
```typescript
// packages/chaingraph-trpc/server/stores/postgres/schema.ts
usersTable = {
  id: text('id').primaryKey(),
  email: text('email'),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
  metadata: jsonb('metadata'),
}

externalAccountsTable = {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(usersTable.id),
  provider: text('provider').notNull(),
  externalId: text('external_id').notNull(),
  externalEmail: text('external_email'),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at').defaultNow().notNull(),
}
```

**Mapping Better Auth to ChainGraph Schema**:

```typescript
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: {
        tableName: "chaingraph_users",
        fields: {
          id: "id",
          name: "display_name",
          email: "email",
          emailVerified: "email_verified", // NEW FIELD NEEDED
          image: "avatar_url",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },
      account: {
        tableName: "chaingraph_external_accounts",
        fields: {
          id: "id",
          userId: "user_id",
          accountId: "external_id",
          providerId: "provider",
          accessToken: "access_token", // NEW FIELD NEEDED
          refreshToken: "refresh_token", // NEW FIELD NEEDED
          expiresAt: "expires_at", // NEW FIELD NEEDED
          scope: "scope", // NEW FIELD NEEDED
          // ... map to metadata jsonb or add columns
        },
      },
      // Need to create new session table
      session: {
        tableName: "chaingraph_sessions",
      },
    },
  }),
})
```

**Required Schema Changes**:

```typescript
// Add to usersTable
emailVerified: timestamp('email_verified'),

// Add to externalAccountsTable
accessToken: text('access_token'),
refreshToken: text('refresh_token'),
expiresAt: timestamp('expires_at'),
scope: text('scope'),
idToken: text('id_token'),

// New sessionsTable
export const sessionsTable = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// New verificationsTable
export const verificationsTable = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

**Migration Strategy**:
1. Add new columns to existing tables
2. Create new sessions and verifications tables
3. Keep current demo token system for backward compatibility
4. Migrate existing users progressively (no breaking changes)

### 1.4 Multi-Provider Support

Better Auth supports all major OAuth providers out of the box:

**GitHub OAuth**:
```typescript
github: {
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  // GitHub doesn't provide refresh tokens
  // Access tokens are long-lived (1 year if unused)
}
```

**Google OAuth**:
```typescript
google: {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  accessType: "offline", // Request refresh token
  scope: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/drive.readonly", // For Google Drive nodes
    "https://www.googleapis.com/auth/spreadsheets.readonly", // For Sheets nodes
  ],
}
```

**Telegram Auth**:
- **Status**: NOT officially supported (as of 2025)
- **Workaround**: Custom plugin needed (community working on it)
- **Issue**: Telegram uses unique signed data auth, not standard OAuth

```typescript
// Custom Telegram plugin (community implementation)
import { telegramAuth } from "better-auth-telegram-plugin"

plugins: [
  telegramAuth({
    botToken: process.env.TELEGRAM_BOT_TOKEN!,
  }),
]
```

**Web3/Ethereum (SIWE)**:
```typescript
import { siwe } from "better-auth/plugins/siwe"

plugins: [
  siwe({
    chains: [
      { id: 1, name: "Ethereum Mainnet" }, // Default
      { id: 137, name: "Polygon" },
      { id: 42161, name: "Arbitrum" },
      { id: 8453, name: "Base" },
    ],
  }),
]
```

**Solana**:
- **Status**: Community plugin in development (Issue #3495)
- **Workaround**: Use generic OAuth plugin with Phantom wallet

**Custom Providers (archai/demo)**:
```typescript
// Keep existing demo token system
import { genericOAuth } from "better-auth/plugins/generic-oauth"

plugins: [
  genericOAuth({
    provider: "archai",
    clientId: process.env.ARCHAI_CLIENT_ID!,
    clientSecret: process.env.ARCHAI_CLIENT_SECRET!,
    authorizationUrl: "https://archai.example.com/oauth/authorize",
    tokenUrl: "https://archai.example.com/oauth/token",
    userInfoUrl: "https://archai.example.com/oauth/userinfo",
  }),
]
```

### 1.5 Account Linking

Better Auth supports linking multiple OAuth providers to one user account.

**Automatic Linking** (by email):
```typescript
export const auth = betterAuth({
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"], // Auto-link verified emails
    },
  },
})
```

**Manual Linking** (user-initiated):
```typescript
// Client-side
await authClient.linkSocial({
  provider: "google",
})

// Server-side tRPC procedure
linkProvider: authedProcedure
  .input(z.object({ provider: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Trigger OAuth flow and link to ctx.user.id
    return await auth.api.linkSocial({
      userId: ctx.user.id,
      provider: input.provider,
    })
  })
```

**Conflict Resolution**:
- If email already exists with another provider: Auto-link if `trustedProviders`
- If email doesn't match: User must manually approve link
- If provider account already linked elsewhere: Error (prevents account takeover)

**Demo User Upgrade Flow**:
```typescript
// Detect demo user
const isDemo = ctx.user.provider === "demo"

if (isDemo) {
  // Link OAuth account -> converts demo to permanent user
  await auth.api.linkSocial({
    userId: ctx.user.id,
    provider: "github",
  })

  // Optionally delete demo external account
  await ctx.userStore.unlinkExternalAccount(demoAccountId)
}
```

### 1.6 Token Storage for API Access

Better Auth stores OAuth tokens in the `account` table for later API access.

**Token Storage Schema**:
```typescript
externalAccountsTable = {
  // ... existing fields
  accessToken: text('access_token'), // Encrypted in DB
  refreshToken: text('refresh_token'), // Encrypted
  expiresAt: timestamp('expires_at'), // Token expiration
  scope: text('scope'), // Granted scopes
  idToken: text('id_token'), // OIDC ID token
}
```

**Encrypting Tokens**:
```typescript
export const auth = betterAuth({
  account: {
    encryptOAuthTokens: true, // Encrypt before storing
  },
  secret: process.env.BETTER_AUTH_SECRET!, // Encryption key
})
```

**Accessing Stored Tokens** (for GitHub API nodes):
```typescript
// In GitHub API node execution
import { auth } from "@/server/auth"

class GitHubAPINode extends BaseNode {
  async execute(context: ExecutionContext) {
    const userId = context.userId

    // Get GitHub access token
    const token = await auth.api.getAccessToken({
      userId,
      providerId: "github",
    })

    if (!token) {
      throw new Error("GitHub account not linked")
    }

    // Token is automatically refreshed if expired (for Google, etc.)
    const response = await fetch("https://api.github.com/user/repos", {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    })

    // ... process response
  }
}
```

**Token Refresh Automation**:
```typescript
// Better Auth automatically refreshes expired tokens
const token = await auth.api.getAccessToken({
  userId,
  providerId: "google", // Has refresh token
})

// If accessToken expired:
// 1. Better Auth uses refreshToken to get new accessToken
// 2. Updates database with new token and expiry
// 3. Returns fresh token

// For GitHub (no refresh token):
// Returns existing long-lived token
```

**Scope Management**:
```typescript
// Request additional scopes later
await authClient.linkSocial({
  provider: "google",
  scope: [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
  ],
})

// This triggers new OAuth flow with additional scopes
// Better Auth maintains existing connection
```

### 1.7 Migration Guide from Current System

**Step 1: Add Better Auth alongside existing auth**

```typescript
// server/auth/service.ts (modify)
export class AuthService {
  private betterAuth: BetterAuth | null = null

  constructor(private userStore: UserStore) {
    // Keep existing BadAI client
    if (authConfig.badaiAuth.enabled) {
      this.badaiClient = new GraphQLClient(authConfig.badaiAuth.apiUrl)
    }

    // Add Better Auth
    if (authConfig.betterAuth.enabled) {
      this.betterAuth = auth // Import from auth.ts
    }
  }

  async validateSession(token: string | undefined): Promise<AuthSession | null> {
    // Try Better Auth first
    if (this.betterAuth && token) {
      const session = await this.betterAuth.api.getSession({ token })
      if (session) {
        return {
          userId: session.user.id,
          provider: "better-auth",
          token,
          user: {
            id: session.user.id,
            displayName: session.user.name,
            role: session.user.role,
            provider: "better-auth",
          },
        }
      }
    }

    // Fall back to existing auth (demo, BadAI)
    // ... existing logic
  }
}
```

**Step 2: Run database migrations**

```bash
# Generate migration
pnpm run migrate:generate

# Review generated SQL
# Apply migration
pnpm run migrate:run
```

**Step 3: Add Better Auth endpoints**

```typescript
// server/router.ts (add)
import { auth } from "./auth"

// Mount Better Auth routes at /api/auth/*
app.all("/api/auth/*", async (req, res) => {
  return auth.handler(req, res)
})
```

**Step 4: Update frontend**

```typescript
// client/auth.ts
import { createAuthClient } from "better-auth/client"

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000", // Your API URL
})

// Login with GitHub
await authClient.signIn.social({ provider: "github" })

// Login with Google
await authClient.signIn.social({ provider: "google" })

// Get current session
const session = await authClient.getSession()
```

**Step 5: Backward compatibility**

```typescript
// Keep demo token system working
if (isDemoToken(token)) {
  // ... existing demo logic
}

// Keep BadAI auth working
if (authConfig.badaiAuth.enabled) {
  // ... existing BadAI logic
}

// Only use Better Auth for new social logins
```

### 1.8 Pros and Cons Analysis

**Pros**:
- Production-ready (v1.3+)
- TypeScript-first with full type inference
- Works with standalone tRPC (no Next.js required)
- Built-in account linking
- Automatic token refresh
- Encrypted token storage
- Custom schema mapping (compatible with ChainGraph DB)
- Plugin ecosystem (2FA, passkeys, etc.)
- Active maintenance (Better Auth team now maintains Auth.js)

**Cons**:
- Some production issues reported (cross-domain cookies, session handling)
- Telegram auth not officially supported (needs custom plugin)
- Solana auth in development (community plugin)
- Requires schema changes to ChainGraph database
- Separate API routes needed (not fully integrated with tRPC)
- Memory adapter not production-ready (must use database)

### 1.9 Effort Estimation

**Phase 1: Setup and Database Migration** (3-5 days)
- Install Better Auth and dependencies
- Add new database columns and tables
- Generate and test migrations
- Configure Drizzle adapter with custom schema

**Phase 2: Core Integration** (5-7 days)
- Initialize Better Auth with GitHub and Google providers
- Integrate with tRPC context
- Update AuthService to support Better Auth
- Add Better Auth API routes
- Test session management

**Phase 3: Frontend Integration** (3-5 days)
- Install Better Auth client
- Implement login UI components
- Add OAuth popup handling
- Test authentication flows

**Phase 4: Advanced Features** (5-7 days)
- Implement account linking UI
- Add token storage for API nodes (GitHub, Google)
- Configure token encryption
- Test automatic token refresh
- Migrate existing demo users

**Phase 5: Testing and Documentation** (2-3 days)
- Write integration tests
- Update API documentation
- Create migration guide for existing users
- QA testing

**Total Effort**: 18-27 days (3-5 weeks)

**Breakdown by Developer Skill**:
- Senior Developer: 18-22 days
- Mid-level Developer: 22-27 days
- Junior Developer: 27-35 days

---

## Part 2: OAuth Server Solutions

### 2.1 Better Auth OAuth Server Capability

**Better Auth OIDC Provider Plugin**:
- **Status**: EXPERIMENTAL (not production-ready as of 2025)
- **Documentation**: https://www.better-auth.com/docs/plugins/oidc-provider
- **Warning**: "This plugin is in active development and may not be suitable for production use"

**Features**:
- Client registration (static and dynamic)
- Authorization Code Flow
- Public client support (SPAs, mobile, CLI)
- Refresh tokens
- OAuth consent screens
- UserInfo endpoint
- JWKS endpoint (partial implementation)

**Implementation Example**:

```typescript
import { betterAuth } from "better-auth"
import { oidcProvider } from "better-auth/plugins/oidc-provider"

export const auth = betterAuth({
  plugins: [
    oidcProvider({
      // Allow public registration of OAuth clients
      allowDynamicClientRegistration: true,

      // Trusted first-party clients (skip consent)
      trustedClients: [
        {
          id: "chaingraph-mobile",
          name: "ChainGraph Mobile App",
          redirectUris: ["chaingraph://oauth/callback"],
          skipConsent: true,
        },
      ],

      // Custom claims for UserInfo endpoint
      getAdditionalUserInfoClaim: async (user, scopes) => {
        if (scopes.includes("flows:read")) {
          const flowCount = await db.query.flows.findMany({
            where: eq(flows.ownerId, user.id),
          }).length
          return { flowCount }
        }
        return {}
      },
    }),
  ],
})
```

**Required Database Tables**:
```typescript
// Auto-generated by Better Auth
oauthApplicationTable = {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  clientId: text('client_id').unique().notNull(),
  clientSecret: text('client_secret'),
  redirectUris: jsonb('redirect_uris').notNull(),
  trusted: boolean('trusted').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}

oauthAccessTokenTable = {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  clientId: text('client_id').notNull(),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  scopes: text('scopes').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}

oauthConsentTable = {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  clientId: text('client_id').notNull(),
  scopes: text('scopes').notNull(),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
}
```

**Verdict**: **NOT RECOMMENDED for production** due to experimental status. Use for prototyping only.

### 2.2 Alternative OAuth Server Solutions

#### Option 1: Ory Hydra (RECOMMENDED)

**Overview**:
- OpenID Certified OAuth 2.0/OIDC provider
- Written in Go (high performance)
- Trusted by OpenAI and others
- Scales to millions of requests/day
- Self-hosted or Ory Network

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│ External App: "Custom Dashboard"                            │
│  └─> Redirects to chaingraph.com/oauth/authorize           │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ Ory Hydra (Docker Container)                                │
│  ├─ Authorization Server                                    │
│  ├─ Token Endpoint                                          │
│  ├─ Client Management API                                   │
│  └─ PostgreSQL (client & token storage)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                  Redirects to Login/Consent App
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ ChainGraph Login/Consent App (Node.js/tRPC)                │
│  ├─ /oauth/login - Authenticate user                       │
│  ├─ /oauth/consent - Show permissions                      │
│  └─ Communicates with Ory Hydra via SDK                    │
└─────────────────────────────────────────────────────────────┘
```

**Installation**:
```yaml
# docker-compose.yml
services:
  hydra:
    image: oryd/hydra:v2.2.0
    ports:
      - "4444:4444" # Public API
      - "4445:4445" # Admin API
    environment:
      - DSN=postgres://hydra:secret@postgres:5432/hydra?sslmode=disable
      - URLS_SELF_ISSUER=https://chaingraph.com
      - URLS_CONSENT=https://chaingraph.com/oauth/consent
      - URLS_LOGIN=https://chaingraph.com/oauth/login
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=hydra
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=hydra
```

**Node.js Integration**:
```typescript
import { Configuration, OAuth2Api } from "@ory/hydra-client"

const hydra = new OAuth2Api(
  new Configuration({
    basePath: "http://localhost:4445", // Admin API
  })
)

// Login flow (ChainGraph handles user authentication)
export const oauthLogin = authedProcedure
  .input(z.object({ challenge: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Get login request from Hydra
    const { data: loginRequest } = await hydra.getOAuth2LoginRequest({
      loginChallenge: input.challenge,
    })

    // Accept login (user already authenticated by ChainGraph)
    const { data: loginResponse } = await hydra.acceptOAuth2LoginRequest({
      loginChallenge: input.challenge,
      acceptOAuth2LoginRequest: {
        subject: ctx.user.id,
        remember: true,
        rememberFor: 3600,
      },
    })

    // Redirect user to consent screen
    return { redirectTo: loginResponse.redirect_to }
  })

// Consent flow (show permissions to user)
export const oauthConsent = authedProcedure
  .input(z.object({ challenge: z.string(), accept: z.boolean() }))
  .mutation(async ({ ctx, input }) => {
    const { data: consentRequest } = await hydra.getOAuth2ConsentRequest({
      consentChallenge: input.challenge,
    })

    if (input.accept) {
      const { data: consentResponse } = await hydra.acceptOAuth2ConsentRequest({
        consentChallenge: input.challenge,
        acceptOAuth2ConsentRequest: {
          grantScope: consentRequest.requested_scope,
          grantAccessTokenAudience: consentRequest.requested_access_token_audience,
          remember: true,
          rememberFor: 3600,
        },
      })
      return { redirectTo: consentResponse.redirect_to }
    } else {
      const { data: denyResponse } = await hydra.rejectOAuth2ConsentRequest({
        consentChallenge: input.challenge,
        rejectOAuth2Request: {
          error: "access_denied",
          errorDescription: "User denied consent",
        },
      })
      return { redirectTo: denyResponse.redirect_to }
    }
  })
```

**Client Registration**:
```typescript
// Register external OAuth client
const { data: client } = await hydra.createOAuth2Client({
  oAuth2Client: {
    client_name: "Custom Dashboard",
    redirect_uris: ["https://dashboard.example.com/callback"],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    scope: "openid profile email flows:read executions:create",
    token_endpoint_auth_method: "client_secret_basic",
  },
})

console.log("Client ID:", client.client_id)
console.log("Client Secret:", client.client_secret)
```

**Pros**:
- Battle-tested (used by OpenAI)
- OpenID Certified
- Full OAuth 2.1 and OIDC support
- Scales to millions of requests
- Comprehensive admin API
- Docker-based (easy deployment)

**Cons**:
- Separate service (added complexity)
- Go-based (different stack from ChainGraph)
- Requires custom login/consent UI
- Learning curve

**Effort**: 3-4 weeks

#### Option 2: @jmondi/oauth2-server

**Overview**:
- TypeScript-native OAuth2 server library
- Lightweight (no separate service)
- Full control over implementation
- Standards compliant (7 RFCs)

**Installation**:
```bash
pnpm add @jmondi/oauth2-server
```

**Implementation**:
```typescript
import { AuthorizationServer } from "@jmondi/oauth2-server"

// Define repositories (Drizzle ORM)
class DrizzleClientRepository implements OAuthClientRepository {
  async getByIdentifier(clientId: string) {
    const client = await db.query.oauthClients.findFirst({
      where: eq(oauthClients.clientId, clientId),
    })
    return client ? this.toOAuthClient(client) : null
  }

  private toOAuthClient(row: any): OAuthClient {
    return {
      id: row.clientId,
      name: row.name,
      secret: row.clientSecret,
      redirectUris: row.redirectUris,
      allowedGrants: row.allowedGrants,
      scopes: row.scopes,
    }
  }
}

class DrizzleTokenRepository implements OAuthTokenRepository {
  async issueAccessToken(client: OAuthClient, scopes: Scope[], user?: OAuthUser) {
    const token = generateSecureToken()
    const expiresAt = new Date(Date.now() + 3600 * 1000) // 1 hour

    await db.insert(oauthTokens).values({
      token,
      clientId: client.id,
      userId: user?.id,
      scopes: scopes.map(s => s.name).join(" "),
      expiresAt,
    })

    return new OAuthToken({
      accessToken: token,
      expiresAt,
    })
  }

  async revoke(accessToken: string) {
    await db.delete(oauthTokens).where(eq(oauthTokens.token, accessToken))
  }
}

// Initialize Authorization Server
const authServer = new AuthorizationServer(
  new DrizzleClientRepository(),
  new DrizzleTokenRepository(),
  new JwtService(process.env.OAUTH_PRIVATE_KEY!)
)

// Enable authorization code grant
authServer.enableGrantType("authorization_code")

// Authorization endpoint (tRPC)
export const oauthAuthorize = authedProcedure
  .input(z.object({
    client_id: z.string(),
    redirect_uri: z.string(),
    scope: z.string(),
    state: z.string(),
    code_challenge: z.string().optional(), // PKCE
    code_challenge_method: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Create authorization code
    const code = await authServer.createAuthorizationCode(
      input.client_id,
      ctx.user.id,
      input.redirect_uri,
      input.scope.split(" "),
      input.code_challenge,
      input.code_challenge_method
    )

    // Redirect user back to client
    return {
      redirectTo: `${input.redirect_uri}?code=${code}&state=${input.state}`,
    }
  })

// Token endpoint (REST API, not tRPC)
app.post("/oauth/token", async (req, res) => {
  try {
    const response = await authServer.respondToAccessTokenRequest(req)
    res.json(response)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})
```

**Database Schema**:
```typescript
export const oauthClientsTable = pgTable('oauth_clients', {
  id: text('id').primaryKey(),
  clientId: text('client_id').unique().notNull(),
  clientSecret: text('client_secret'),
  name: text('name').notNull(),
  redirectUris: jsonb('redirect_uris').$type<string[]>().notNull(),
  allowedGrants: jsonb('allowed_grants').$type<string[]>().notNull(),
  scopes: jsonb('scopes').$type<string[]>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  userId: text('user_id').notNull().references(() => usersTable.id), // Owner
})

export const oauthTokensTable = pgTable('oauth_tokens', {
  id: text('id').primaryKey(),
  token: text('token').unique().notNull(),
  clientId: text('client_id').notNull().references(() => oauthClientsTable.clientId),
  userId: text('user_id').references(() => usersTable.id),
  scopes: text('scopes').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const oauthCodesTable = pgTable('oauth_authorization_codes', {
  id: text('id').primaryKey(),
  code: text('code').unique().notNull(),
  clientId: text('client_id').notNull(),
  userId: text('user_id').notNull(),
  redirectUri: text('redirect_uri').notNull(),
  scopes: text('scopes').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  codeChallenge: text('code_challenge'), // PKCE
  codeChallengeMethod: text('code_challenge_method'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

**Pros**:
- TypeScript-native (same stack as ChainGraph)
- No separate service (integrated with tRPC)
- Full control over implementation
- Standards compliant
- PKCE support built-in

**Cons**:
- Manual implementation required
- More code to maintain
- No certification (unlike Ory Hydra)
- Security responsibility on your team

**Effort**: 4-6 weeks

#### Option 3: Keycloak

**Overview**:
- Full-featured identity provider
- OAuth 2.0, OIDC, SAML support
- Admin UI included
- Heavy (Java-based)

**Pros**:
- Complete solution (user management, OAuth, SSO)
- Admin UI for client management
- Battle-tested

**Cons**:
- Very heavy (1GB+ memory)
- Overkill for ChainGraph's needs
- Complex configuration
- Java-based

**Verdict**: NOT RECOMMENDED (too heavy)

### 2.3 OAuth Server Use Case for ChainGraph

**Scenario: External Dashboard Integration**

```
Step 1: Developer Registration
  └─> Developer visits chaingraph.com/developer/apps
  └─> Clicks "Create New App"
  └─> Provides:
      - App Name: "Custom Analytics Dashboard"
      - Redirect URI: https://dashboard.example.com/callback
      - Scopes: flows:read, executions:create
  └─> Receives:
      - Client ID: cg_abc123
      - Client Secret: secret_xyz789

Step 2: User Authorization Flow
  └─> User clicks "Login with ChainGraph" on Dashboard
  └─> Dashboard redirects to:
      https://chaingraph.com/oauth/authorize?
        client_id=cg_abc123&
        redirect_uri=https://dashboard.example.com/callback&
        scope=flows:read executions:create&
        state=random_state&
        response_type=code&
        code_challenge=sha256_hash& // PKCE
        code_challenge_method=S256

Step 3: ChainGraph Authorization
  └─> User sees ChainGraph consent screen:
      "Custom Analytics Dashboard wants to:
       ✓ Read your flows
       ✓ Create executions
       [ Allow ] [ Deny ]"
  └─> User clicks "Allow"
  └─> ChainGraph redirects back with code:
      https://dashboard.example.com/callback?
        code=auth_code_xyz&
        state=random_state

Step 4: Token Exchange
  └─> Dashboard backend makes POST to:
      https://chaingraph.com/oauth/token
      {
        grant_type: "authorization_code",
        code: "auth_code_xyz",
        redirect_uri: "https://dashboard.example.com/callback",
        client_id: "cg_abc123",
        client_secret: "secret_xyz789",
        code_verifier: "original_random_string" // PKCE
      }
  └─> ChainGraph responds:
      {
        access_token: "cg_access_abc123",
        refresh_token: "cg_refresh_xyz789",
        expires_in: 3600,
        token_type: "Bearer",
        scope: "flows:read executions:create"
      }

Step 5: API Access
  └─> Dashboard calls ChainGraph API:
      GET https://chaingraph.com/api/flows
      Authorization: Bearer cg_access_abc123

  └─> Dashboard creates execution:
      POST https://chaingraph.com/api/executions
      Authorization: Bearer cg_access_abc123
      { flowId: "flow_123", ... }
```

### 2.4 Required Endpoints

**Authorization Endpoint** (`/oauth/authorize`):
```typescript
// GET /oauth/authorize
export const oauthAuthorize = authedProcedure
  .input(z.object({
    client_id: z.string(),
    redirect_uri: z.string().url(),
    scope: z.string(),
    state: z.string(),
    response_type: z.enum(["code"]),
    code_challenge: z.string().optional(), // PKCE
    code_challenge_method: z.enum(["S256", "plain"]).optional(),
  }))
  .query(async ({ ctx, input }) => {
    // 1. Validate client_id
    const client = await getOAuthClient(input.client_id)
    if (!client) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Invalid client_id" })
    }

    // 2. Validate redirect_uri
    if (!client.redirectUris.includes(input.redirect_uri)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid redirect_uri" })
    }

    // 3. Validate scopes
    const requestedScopes = input.scope.split(" ")
    const invalidScopes = requestedScopes.filter(s => !VALID_SCOPES.includes(s))
    if (invalidScopes.length > 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid scopes" })
    }

    // 4. Show consent screen
    return {
      client,
      requestedScopes,
      user: ctx.user,
    }
  })

// POST /oauth/authorize (user approves)
export const oauthAuthorizeApprove = authedProcedure
  .input(z.object({
    client_id: z.string(),
    redirect_uri: z.string(),
    scope: z.string(),
    state: z.string(),
    code_challenge: z.string().optional(),
    code_challenge_method: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Generate authorization code
    const code = await createAuthorizationCode({
      userId: ctx.user.id,
      clientId: input.client_id,
      redirectUri: input.redirect_uri,
      scopes: input.scope,
      codeChallenge: input.code_challenge,
      codeChallengeMethod: input.code_challenge_method,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    })

    // Redirect user back to client
    return {
      redirectTo: `${input.redirect_uri}?code=${code}&state=${input.state}`,
    }
  })
```

**Token Endpoint** (`/oauth/token`):
```typescript
// POST /oauth/token (REST endpoint, not tRPC)
app.post("/oauth/token", async (req, res) => {
  const { grant_type, code, redirect_uri, client_id, client_secret, code_verifier, refresh_token } = req.body

  // Authorization Code Grant
  if (grant_type === "authorization_code") {
    // 1. Validate authorization code
    const authCode = await getAuthorizationCode(code)
    if (!authCode || authCode.expiresAt < new Date()) {
      return res.status(400).json({ error: "invalid_grant" })
    }

    // 2. Validate client credentials
    const client = await getOAuthClient(client_id)
    if (!client || client.clientSecret !== client_secret) {
      return res.status(401).json({ error: "invalid_client" })
    }

    // 3. Validate redirect_uri
    if (authCode.redirectUri !== redirect_uri) {
      return res.status(400).json({ error: "invalid_grant" })
    }

    // 4. Validate PKCE (if used)
    if (authCode.codeChallenge) {
      const challenge = authCode.codeChallengeMethod === "S256"
        ? sha256(code_verifier)
        : code_verifier
      if (challenge !== authCode.codeChallenge) {
        return res.status(400).json({ error: "invalid_grant" })
      }
    }

    // 5. Generate tokens
    const accessToken = await createAccessToken({
      userId: authCode.userId,
      clientId: client_id,
      scopes: authCode.scopes,
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
    })

    const refreshToken = await createRefreshToken({
      userId: authCode.userId,
      clientId: client_id,
      scopes: authCode.scopes,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000), // 30 days
    })

    // 6. Delete authorization code (single use)
    await deleteAuthorizationCode(code)

    return res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: 3600,
      scope: authCode.scopes,
    })
  }

  // Refresh Token Grant
  if (grant_type === "refresh_token") {
    // 1. Validate refresh token
    const token = await getRefreshToken(refresh_token)
    if (!token || token.expiresAt < new Date()) {
      return res.status(400).json({ error: "invalid_grant" })
    }

    // 2. Validate client
    const client = await getOAuthClient(client_id)
    if (!client || client.clientSecret !== client_secret) {
      return res.status(401).json({ error: "invalid_client" })
    }

    // 3. Generate new access token
    const accessToken = await createAccessToken({
      userId: token.userId,
      clientId: client_id,
      scopes: token.scopes,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    })

    return res.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      scope: token.scopes,
    })
  }

  return res.status(400).json({ error: "unsupported_grant_type" })
})
```

**Revocation Endpoint** (`/oauth/revoke`):
```typescript
// POST /oauth/revoke
app.post("/oauth/revoke", async (req, res) => {
  const { token, token_type_hint } = req.body

  // Delete token (access or refresh)
  if (token_type_hint === "refresh_token") {
    await deleteRefreshToken(token)
  } else {
    await deleteAccessToken(token)
  }

  res.status(200).json({})
})
```

**Introspection Endpoint** (`/oauth/introspect`):
```typescript
// POST /oauth/introspect
app.post("/oauth/introspect", async (req, res) => {
  const { token, client_id, client_secret } = req.body

  // Validate client
  const client = await getOAuthClient(client_id)
  if (!client || client.clientSecret !== client_secret) {
    return res.status(401).json({ error: "invalid_client" })
  }

  // Check token
  const accessToken = await getAccessToken(token)
  if (!accessToken || accessToken.expiresAt < new Date()) {
    return res.json({ active: false })
  }

  return res.json({
    active: true,
    scope: accessToken.scopes,
    client_id: accessToken.clientId,
    username: accessToken.userId,
    exp: Math.floor(accessToken.expiresAt.getTime() / 1000),
  })
})
```

**Discovery Endpoint** (`/.well-known/openid-configuration`):
```typescript
// GET /.well-known/openid-configuration
app.get("/.well-known/openid-configuration", (req, res) => {
  res.json({
    issuer: "https://chaingraph.com",
    authorization_endpoint: "https://chaingraph.com/oauth/authorize",
    token_endpoint: "https://chaingraph.com/oauth/token",
    userinfo_endpoint: "https://chaingraph.com/oauth/userinfo",
    jwks_uri: "https://chaingraph.com/oauth/jwks",
    revocation_endpoint: "https://chaingraph.com/oauth/revoke",
    introspection_endpoint: "https://chaingraph.com/oauth/introspect",
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: [
      "openid",
      "profile",
      "email",
      "flows:read",
      "flows:write",
      "executions:read",
      "executions:create",
      "executions:control",
      "nodes:read",
    ],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
    code_challenge_methods_supported: ["S256", "plain"],
  })
})
```

### 2.5 Scope and Permission Design

**ChainGraph-Specific Scopes**:

| Scope | Description | Example Use Case |
|-------|-------------|------------------|
| `openid` | Standard OIDC (user ID) | User identity |
| `profile` | User profile (displayName) | Show user name |
| `email` | Email address | Send notifications |
| `flows:read` | List and read flows | Dashboard analytics |
| `flows:write` | Create, update, delete flows | Flow builder app |
| `executions:read` | View execution status | Monitoring tool |
| `executions:create` | Start executions | Trigger automation |
| `executions:control` | Pause, resume, stop | Execution manager |
| `nodes:read` | Access node catalog | Node explorer |

**Scope Enforcement in tRPC**:

```typescript
// Middleware to check scopes
const requireScope = (requiredScope: string) => {
  return authedProcedure.use(async (opts) => {
    const token = opts.ctx.session?.token

    if (!token) {
      throw new TRPCError({ code: "UNAUTHORIZED" })
    }

    // Get token scopes from database
    const accessToken = await getAccessTokenByToken(token)
    if (!accessToken) {
      throw new TRPCError({ code: "UNAUTHORIZED" })
    }

    const scopes = accessToken.scopes.split(" ")
    if (!scopes.includes(requiredScope)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Missing required scope: ${requiredScope}`,
      })
    }

    return opts.next({
      ctx: {
        ...opts.ctx,
        scopes,
      },
    })
  })
}

// Usage in tRPC procedures
export const flowRouter = router({
  // Requires flows:read scope
  list: requireScope("flows:read")
    .query(async ({ ctx }) => {
      // Only return flows owned by token user
      return await db.query.flows.findMany({
        where: eq(flows.ownerId, ctx.user.id),
      })
    }),

  // Requires flows:write scope
  create: requireScope("flows:write")
    .input(createFlowSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.flowStore.createFlow({
        ...input,
        ownerId: ctx.user.id,
      })
    }),

  // Requires executions:create scope
  execute: requireScope("executions:create")
    .input(z.object({ flowId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Start execution with OAuth token user context
      return await startExecution(input.flowId, ctx.user.id)
    }),
})
```

**Scope Hierarchy**:
```
flows:write → implies flows:read
executions:control → implies executions:read, executions:create
```

### 2.6 Security Considerations

**PKCE (Proof Key for Code Exchange)**:
- **MANDATORY** for public clients (SPAs, mobile apps, CLI tools)
- Protects against authorization code interception
- Use SHA-256 for code_challenge_method

```typescript
// Client-side (SPA)
const codeVerifier = generateRandomString(128)
const codeChallenge = await sha256(codeVerifier)

// Authorize request
window.location.href = `https://chaingraph.com/oauth/authorize?
  client_id=cg_abc123&
  redirect_uri=https://dashboard.example.com/callback&
  scope=flows:read&
  response_type=code&
  code_challenge=${codeChallenge}&
  code_challenge_method=S256&
  state=${randomState}`

// Token exchange (after redirect)
const response = await fetch("https://chaingraph.com/oauth/token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    grant_type: "authorization_code",
    code: authorizationCode,
    redirect_uri: "https://dashboard.example.com/callback",
    client_id: "cg_abc123",
    code_verifier: codeVerifier, // Send original verifier
  }),
})
```

**State Parameter**:
- Protects against CSRF attacks
- Client generates random state
- Server echoes back state in redirect
- Client validates state matches

**Redirect URI Validation**:
- MUST use exact match (no wildcards)
- Whitelist in client registration
- Prevents open redirect vulnerabilities

**Token Security**:
- Short-lived access tokens (1 hour)
- Long-lived refresh tokens (30 days)
- Rotate refresh tokens on use
- Store tokens encrypted at rest
- Never log tokens

**Client Authentication**:
- Public clients: PKCE only (no client secret)
- Confidential clients: client_secret_basic or client_secret_post
- Never expose client secrets in frontend code

---

## Part 3: Hybrid Architecture Design

### 3.1 Can One Application Be Both?

**YES**, ChainGraph can function as both OAuth client and OAuth server simultaneously.

**Architecture Overview**:
```
┌─────────────────────────────────────────────────────────────┐
│                      ChainGraph                              │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │ OAuth Client (Better Auth)                       │      │
│  │  - Users login via GitHub, Google, etc.          │      │
│  │  - Stores external provider tokens               │      │
│  │  - Uses tokens for API nodes (GitHub, Sheets)    │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │ OAuth Server (Ory Hydra / @jmondi/oauth2-server) │      │
│  │  - External apps login via ChainGraph            │      │
│  │  - Issues ChainGraph access tokens               │      │
│  │  - Enforces scopes for API access                │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Token Types**:

| Token Type | Purpose | Storage | Lifetime |
|------------|---------|---------|----------|
| **Better Auth Session Token** | ChainGraph user session | `chaingraph_sessions` table | 7 days |
| **External Provider Token** (GitHub) | Call GitHub API from nodes | `chaingraph_external_accounts.accessToken` | 1 year |
| **External Provider Token** (Google) | Call Google APIs from nodes | `chaingraph_external_accounts.refreshToken` | Indefinite (refresh) |
| **ChainGraph Access Token** | External apps call ChainGraph API | `chaingraph_oauth_tokens` table | 1 hour |
| **ChainGraph Refresh Token** | Renew ChainGraph access tokens | `chaingraph_oauth_refresh_tokens` table | 30 days |

### 3.2 Token Management Strategy

**User Session Flow** (OAuth Client):
```
1. User clicks "Login with GitHub" → Better Auth
2. GitHub redirects back → Better Auth handles
3. Better Auth creates session → stores in chaingraph_sessions
4. Better Auth stores GitHub access token → chaingraph_external_accounts.accessToken
5. User gets session cookie → better_auth.session_token
6. tRPC context reads cookie → attaches user to ctx
```

**External App Flow** (OAuth Server):
```
1. External app redirects user → /oauth/authorize (ChainGraph)
2. User already logged in (Better Auth session)
3. User approves scopes → ChainGraph issues authorization code
4. External app exchanges code → ChainGraph issues access token
5. External app calls API with token → tRPC validates token
6. tRPC checks scopes → allows/denies based on scope
```

**Separation of Concerns**:
- Better Auth session tokens: Used for ChainGraph UI
- ChainGraph OAuth tokens: Used for external API access
- External provider tokens: Used by ChainGraph nodes

### 3.3 Complete Database Schema

```typescript
// ===== EXISTING TABLES =====

export const usersTable = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email'),
  emailVerified: timestamp('email_verified'), // NEW for Better Auth
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
  metadata: jsonb('metadata'),
})

export const externalAccountsTable = pgTable('external_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  externalId: text('external_id').notNull(),
  externalEmail: text('external_email'),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  // NEW: OAuth token fields
  accessToken: text('access_token'), // Encrypted
  refreshToken: text('refresh_token'), // Encrypted
  expiresAt: timestamp('expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at').defaultNow().notNull(),
}, table => [
  uniqueIndex('external_accounts_provider_external_id_idx').on(table.provider, table.externalId),
])

// ===== NEW TABLES FOR BETTER AUTH =====

export const sessionsTable = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, table => [
  index('sessions_user_id_idx').on(table.userId),
  index('sessions_token_idx').on(table.token),
])

export const verificationsTable = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ===== NEW TABLES FOR OAUTH SERVER =====

export const oauthClientsTable = pgTable('oauth_clients', {
  id: text('id').primaryKey(),
  clientId: text('client_id').unique().notNull(),
  clientSecret: text('client_secret'), // Hashed (bcrypt)
  name: text('name').notNull(),
  description: text('description'),
  logoUrl: text('logo_url'),
  redirectUris: jsonb('redirect_uris').$type<string[]>().notNull(),
  allowedScopes: jsonb('allowed_scopes').$type<string[]>().notNull(),
  trusted: boolean('trusted').default(false), // Skip consent
  userId: text('user_id').notNull().references(() => usersTable.id), // Owner
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, table => [
  index('oauth_clients_user_id_idx').on(table.userId),
])

export const oauthAuthorizationCodesTable = pgTable('oauth_authorization_codes', {
  id: text('id').primaryKey(),
  code: text('code').unique().notNull(),
  clientId: text('client_id').notNull().references(() => oauthClientsTable.clientId),
  userId: text('user_id').notNull().references(() => usersTable.id),
  redirectUri: text('redirect_uri').notNull(),
  scopes: text('scopes').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  codeChallenge: text('code_challenge'), // PKCE
  codeChallengeMethod: text('code_challenge_method'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, table => [
  index('oauth_codes_code_idx').on(table.code),
  index('oauth_codes_expires_at_idx').on(table.expiresAt),
])

export const oauthAccessTokensTable = pgTable('oauth_access_tokens', {
  id: text('id').primaryKey(),
  token: text('token').unique().notNull(),
  clientId: text('client_id').notNull().references(() => oauthClientsTable.clientId),
  userId: text('user_id').notNull().references(() => usersTable.id),
  scopes: text('scopes').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, table => [
  index('oauth_tokens_token_idx').on(table.token),
  index('oauth_tokens_user_id_idx').on(table.userId),
  index('oauth_tokens_expires_at_idx').on(table.expiresAt),
])

export const oauthRefreshTokensTable = pgTable('oauth_refresh_tokens', {
  id: text('id').primaryKey(),
  token: text('token').unique().notNull(),
  clientId: text('client_id').notNull().references(() => oauthClientsTable.clientId),
  userId: text('user_id').notNull().references(() => usersTable.id),
  scopes: text('scopes').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, table => [
  index('oauth_refresh_tokens_token_idx').on(table.token),
])

export const oauthConsentsTable = pgTable('oauth_consents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => usersTable.id),
  clientId: text('client_id').notNull().references(() => oauthClientsTable.clientId),
  scopes: text('scopes').notNull(),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
}, table => [
  uniqueIndex('oauth_consents_user_client_idx').on(table.userId, table.clientId),
])
```

### 3.4 Token Flow Diagrams

**Diagram 1: User Logs Into ChainGraph (OAuth Client)**

```
┌─────────┐                                      ┌────────────────┐
│ Browser │                                      │ GitHub OAuth   │
└────┬────┘                                      └────────┬───────┘
     │                                                    │
     │ 1. Click "Login with GitHub"                      │
     │ ───────────────────────────────────────────────►  │
     │                                                    │
     │ 2. Redirect to GitHub OAuth                       │
     │ ◄──────────────────────────────────────────────── │
     │                                                    │
     │ 3. User authorizes                                │
     │ ───────────────────────────────────────────────►  │
     │                                                    │
     │ 4. Redirect back with code                        │
     │ ◄──────────────────────────────────────────────── │
     │                                                    │
┌────▼────────────────────────────────────────┐         │
│ ChainGraph (Better Auth)                    │         │
│                                              │         │
│ 5. Exchange code for GitHub access token    │         │
│ ──────────────────────────────────────────────────►   │
│                                              │         │
│ 6. Receive GitHub access token              │         │
│ ◄────────────────────────────────────────────────────  │
│                                              │
│ 7. Create user in DB (if new)               │
│ 8. Store GitHub token in external_accounts  │
│ 9. Create session in sessions table         │
│ 10. Set cookie: better_auth.session_token   │
└──────────────────────┬───────────────────────┘
                       │
                       │ 11. Redirect to dashboard
                       │
                  ┌────▼────┐
                  │ Browser │
                  └─────────┘
```

**Diagram 2: External App Uses ChainGraph API (OAuth Server)**

```
┌───────────────────┐                          ┌─────────────┐
│ External App      │                          │ ChainGraph  │
│ (Custom Dashboard)│                          │ OAuth Server│
└─────────┬─────────┘                          └──────┬──────┘
          │                                           │
          │ 1. Redirect to ChainGraph OAuth           │
          │ ──────────────────────────────────────►   │
          │    /oauth/authorize?                      │
          │    client_id=cg_abc&                      │
          │    scope=flows:read                       │
          │                                           │
          │ 2. User logs in (if not already)         │
          │    → Better Auth session                 │
          │                                           │
          │ 3. Show consent screen                    │
          │    "Dashboard wants to read flows"        │
          │ ◄──────────────────────────────────────── │
          │                                           │
          │ 4. User approves                          │
          │ ──────────────────────────────────────►   │
          │                                           │
          │ 5. Redirect with code                     │
          │ ◄──────────────────────────────────────── │
          │    ?code=auth_xyz                         │
          │                                           │
          │ 6. Exchange code for access token         │
          │ ──────────────────────────────────────►   │
          │    POST /oauth/token                      │
          │    { code, client_secret }                │
          │                                           │
          │ 7. Receive tokens                         │
          │ ◄──────────────────────────────────────── │
          │    { access_token, refresh_token }        │
          │                                           │
          │ 8. Call ChainGraph API                    │
          │ ──────────────────────────────────────►   │
          │    GET /api/flows                         │
          │    Authorization: Bearer access_token     │
          │                                           │
          │ 9. Validate token & check scopes          │
          │                                           │
          │ 10. Return flows data                     │
          │ ◄──────────────────────────────────────── │
          │                                           │
     ┌────▼────┐
     │Dashboard│
     │Shows    │
     │Flows    │
     └─────────┘
```

### 3.5 Implementation Complexity Assessment

**Low Complexity** (1-2 weeks each):
- Better Auth OAuth client setup
- Database schema additions
- Session management integration

**Medium Complexity** (2-3 weeks each):
- OAuth server endpoints (authorization, token)
- Scope enforcement middleware
- Client registration UI

**High Complexity** (3-4 weeks each):
- PKCE implementation and testing
- Token refresh automation
- Security hardening and audit

**Very High Complexity** (4-6 weeks):
- Ory Hydra integration
- Custom login/consent UI
- Production deployment and monitoring

---

## Part 4: Integration with ChainGraph Codebase

### 4.1 Current Architecture Analysis

**Current Auth System** (`packages/chaingraph-trpc/server/auth/service.ts`):

```typescript
export class AuthService {
  private badaiClient: GraphQLClient | null = null

  constructor(private userStore: UserStore) {
    if (authConfig.badaiAuth.enabled) {
      this.badaiClient = new GraphQLClient(authConfig.badaiAuth.apiUrl)
    }
  }

  async validateSession(token: string | undefined): Promise<AuthSession | null> {
    // 1. Dev mode (bypass auth)
    if (!authConfig.enabled || authConfig.devMode) {
      return devUserSession
    }

    // 2. Demo token (JWT-based, stateless)
    if (isDemoToken(token)) {
      return await this.userStore.validateDemoToken(token)
    }

    // 3. BadAI/Archai auth (GraphQL API)
    if (authConfig.badaiAuth.enabled && this.badaiClient) {
      const userProfile = await this.badaiClient.request(GetUserProfileDocument, { session: token })
      return this.createSessionFromBadAI(userProfile)
    }

    return null
  }
}
```

**Current User Store** (`packages/chaingraph-trpc/server/stores/userStore/pgUserStore.ts`):

```typescript
export class PgUserStore implements UserStore {
  // Auto-creates users on first login
  async getOrCreateUserByExternalAccount(data: ExternalAccountData): Promise<DBUser> {
    // 1. Try to find existing external account
    const existingAccount = await db.query.externalAccounts.findFirst({
      where: and(
        eq(externalAccounts.provider, data.provider),
        eq(externalAccounts.externalId, data.externalId)
      )
    })

    if (existingAccount) {
      // Update and return existing user
      return await this.getUserById(existingAccount.userId)
    }

    // 2. Create new user + link external account
    return await db.transaction(async tx => {
      const user = await tx.insert(usersTable).values({...}).returning()
      await tx.insert(externalAccountsTable).values({...})
      return user
    })
  }

  // Demo user system (JWT-based)
  async createDemoUser(displayName?: string): Promise<DemoSessionResult> {
    const demoId = nanoid()
    const user = await db.transaction(async tx => {
      const user = await tx.insert(usersTable).values({...})
      await tx.insert(externalAccountsTable).values({
        provider: 'demo',
        externalId: demoId,
      })
      return user
    })
    const token = signDemoToken(demoId) // JWT
    return { user, token }
  }
}
```

**Current tRPC Context** (`packages/chaingraph-trpc/server/context.ts`):

```typescript
export async function createContext(opts: CreateHTTPContextOptions): Promise<AppContext> {
  // Get token from Authorization header or cookie
  const token = getAuthToken(opts)

  // Validate session
  const session = await authService.validateSession(token)
  const user = await authService.getUserFromSession(session)

  return {
    session: {
      user,
      session,
      isAuthenticated: !!user && !!session,
    },
    db,
    flowStore,
    nodeRegistry,
    nodesCatalog,
    mcpStore,
    userStore,
  }
}

function getAuthToken(opts: CreateHTTPContextOptions): string | undefined {
  // 1. Try WebSocket connection params
  if (opts.info.connectionParams?.sessionBadAI) {
    return opts.info.connectionParams.sessionBadAI
  }

  // 2. Try Authorization header
  if (opts.req.headers.authorization) {
    const [scheme, token] = opts.req.headers.authorization.split(' ')
    if (scheme?.toLowerCase() === 'bearer') {
      return token
    }
  }

  // 3. Try cookie
  const cookies = opts.req.headers.cookie
  if (cookies) {
    const match = cookies.match(/session_badai=([^;]+)/)
    if (match) return match[1]
  }

  return undefined
}
```

### 4.2 Integration Points

**1. Add Better Auth Initialization** (`packages/chaingraph-trpc/server/auth/betterAuth.ts`):

```typescript
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { siwe } from "better-auth/plugins/siwe"
import { db } from "../stores/postgres"
import { usersTable, externalAccountsTable, sessionsTable, verificationsTable } from "../stores/postgres/schema"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: {
        tableName: "chaingraph_users",
        fields: {
          id: "id",
          name: "display_name",
          email: "email",
          emailVerified: "email_verified",
          image: "avatar_url",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },
      account: {
        tableName: "chaingraph_external_accounts",
        fields: {
          id: "id",
          userId: "user_id",
          accountId: "external_id",
          providerId: "provider",
          accessToken: "access_token",
          refreshToken: "refresh_token",
          expiresAt: "expires_at",
          scope: "scope",
          idToken: "id_token",
        },
      },
      session: {
        tableName: "chaingraph_sessions",
      },
      verification: {
        tableName: "chaingraph_verifications",
      },
    },
  }),

  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      accessType: "offline",
      scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/spreadsheets.readonly",
      ],
    },
  },

  plugins: [
    siwe({
      chains: [
        { id: 1, name: "Ethereum Mainnet" },
        { id: 137, name: "Polygon" },
      ],
    }),
  ],

  secret: process.env.BETTER_AUTH_SECRET!,
})
```

**2. Extend AuthService** (`packages/chaingraph-trpc/server/auth/service.ts`):

```typescript
import { auth } from "./betterAuth"

export class AuthService {
  private badaiClient: GraphQLClient | null = null
  private betterAuth = auth

  async validateSession(token: string | undefined): Promise<AuthSession | null> {
    // Dev mode
    if (!authConfig.enabled || authConfig.devMode) {
      return devUserSession
    }

    // Try Better Auth first (NEW)
    if (token) {
      try {
        const session = await this.betterAuth.api.getSession({
          headers: { cookie: `better_auth.session_token=${token}` },
        })

        if (session) {
          return {
            userId: session.user.id,
            provider: "better-auth",
            token,
            user: {
              id: session.user.id,
              displayName: session.user.name,
              role: session.user.role,
              provider: "better-auth",
            },
          }
        }
      } catch (error) {
        // Not a Better Auth token, try other methods
      }
    }

    // Demo token (existing)
    if (token && isDemoToken(token)) {
      return await this.userStore.validateDemoToken(token)
    }

    // BadAI auth (existing)
    if (authConfig.badaiAuth.enabled && this.badaiClient && token) {
      // ... existing logic
    }

    return null
  }
}
```

**3. Add Better Auth Routes** (`packages/chaingraph-trpc/server/router.ts`):

```typescript
import { auth } from "./auth/betterAuth"

// Mount Better Auth handler
app.all("/api/auth/*", async (req, res) => {
  return auth.handler(req, res)
})
```

**4. Update Context** (`packages/chaingraph-trpc/server/context.ts`):

```typescript
function getAuthToken(opts: CreateHTTPContextOptions): string | undefined {
  // 1. WebSocket params
  if (opts.info.connectionParams?.sessionBadAI) {
    return opts.info.connectionParams.sessionBadAI
  }

  // 2. Authorization header
  if (opts.req.headers.authorization) {
    const [scheme, token] = opts.req.headers.authorization.split(' ')
    if (scheme?.toLowerCase() === 'bearer') {
      return token
    }
  }

  // 3. Better Auth cookie (NEW)
  const cookies = opts.req.headers.cookie
  if (cookies) {
    const betterAuthMatch = cookies.match(/better_auth\.session_token=([^;]+)/)
    if (betterAuthMatch) return betterAuthMatch[1]

    // Fallback to old cookie
    const badaiMatch = cookies.match(/session_badai=([^;]+)/)
    if (badaiMatch) return badaiMatch[1]
  }

  return undefined
}
```

### 4.3 Frontend Integration

**Install Better Auth Client**:
```bash
cd packages/chaingraph-frontend
pnpm add better-auth
```

**Create Auth Client** (`packages/chaingraph-frontend/src/lib/auth.ts`):

```typescript
import { createAuthClient } from "better-auth/client"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
})

// Login with GitHub
export async function loginWithGitHub() {
  await authClient.signIn.social({
    provider: "github",
    callbackURL: "/dashboard",
  })
}

// Login with Google
export async function loginWithGoogle() {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: "/dashboard",
  })
}

// Login with Ethereum
export async function loginWithEthereum(address: string, signature: string, message: string) {
  await authClient.signIn.siwe({
    address,
    signature,
    message,
    callbackURL: "/dashboard",
  })
}

// Get current session
export async function getSession() {
  return await authClient.getSession()
}

// Logout
export async function logout() {
  await authClient.signOut()
}
```

**Create Login Page** (`packages/chaingraph-frontend/src/pages/Login.tsx`):

```typescript
import { loginWithGitHub, loginWithGoogle } from "@/lib/auth"

export function LoginPage() {
  return (
    <div className="flex flex-col gap-4 p-8">
      <h1>Login to ChainGraph</h1>

      <button onClick={loginWithGitHub}>
        Login with GitHub
      </button>

      <button onClick={loginWithGoogle}>
        Login with Google
      </button>

      <button onClick={() => {
        // Trigger Web3 wallet connection
      }}>
        Login with Ethereum
      </button>
    </div>
  )
}
```

**Update Session Management** (Effector stores):

```typescript
import { createStore, createEffect } from "effector"
import { authClient, getSession } from "@/lib/auth"

// Session store
export const $session = createStore<Session | null>(null)

// Load session on app start
export const loadSessionFx = createEffect(async () => {
  return await getSession()
})

// Update session store
$session.on(loadSessionFx.doneData, (_, session) => session)

// Load session on mount
loadSessionFx()
```

### 4.4 Backward Compatibility Strategy

**Phase 1: Additive Changes Only**
- Add Better Auth alongside existing auth
- Keep demo token system working
- Keep BadAI auth working
- No breaking changes

**Phase 2: Dual Support**
- Support both old and new auth methods
- Frontend can use either login method
- Gradually migrate users to Better Auth

**Phase 3: Deprecation (Future)**
- Announce deprecation of old methods
- Provide migration guide
- Set sunset date
- Remove old auth code

**Migration Path for Demo Users**:
```typescript
// Detect demo user
const isDemo = user.provider === "demo"

if (isDemo) {
  // Show banner: "Link your account to make it permanent"
  // On click:
  await authClient.linkSocial({ provider: "github" })

  // After linking, delete demo external account
  await deleteDemoAccount(user.id)
}
```

### 4.5 Files That Need Modification

**Packages to Update**:
1. `packages/chaingraph-trpc/package.json` - Add better-auth
2. `packages/chaingraph-trpc/server/stores/postgres/schema.ts` - Add new tables
3. `packages/chaingraph-trpc/server/auth/betterAuth.ts` - NEW FILE
4. `packages/chaingraph-trpc/server/auth/service.ts` - Extend with Better Auth
5. `packages/chaingraph-trpc/server/context.ts` - Update token extraction
6. `packages/chaingraph-trpc/server/router.ts` - Mount Better Auth routes
7. `packages/chaingraph-frontend/src/lib/auth.ts` - NEW FILE
8. `packages/chaingraph-frontend/src/pages/Login.tsx` - Update UI
9. `packages/chaingraph-frontend/package.json` - Add better-auth/client

**Environment Variables**:
```bash
# .env
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 64>
GITHUB_CLIENT_ID=<from GitHub OAuth app>
GITHUB_CLIENT_SECRET=<from GitHub OAuth app>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
```

---

## Part 5: Implementation Roadmap

### Phase 1: OAuth Client Integration (3 weeks)

**Week 1: Setup and Database**
- [ ] Install Better Auth dependencies
- [ ] Add database columns (emailVerified, accessToken, etc.)
- [ ] Create new tables (sessions, verifications)
- [ ] Generate and test migrations
- [ ] Configure Drizzle adapter with custom schema
- [ ] Test database changes in development

**Week 2: Backend Integration**
- [ ] Create `betterAuth.ts` with GitHub + Google providers
- [ ] Extend AuthService to support Better Auth
- [ ] Update tRPC context to read Better Auth sessions
- [ ] Mount Better Auth API routes
- [ ] Test session validation
- [ ] Test account linking

**Week 3: Frontend Integration**
- [ ] Install Better Auth client
- [ ] Create auth utility functions
- [ ] Build login page UI
- [ ] Implement OAuth popups
- [ ] Update session management (Effector)
- [ ] Test end-to-end login flows
- [ ] Write documentation

**Deliverables**:
- Users can login with GitHub and Google
- Sessions stored in database
- OAuth tokens stored for API access
- Backward compatible with demo tokens

### Phase 2: OAuth Server Implementation (4 weeks)

**Week 1: Solution Selection and Setup**
- [ ] Evaluate Ory Hydra vs @jmondi/oauth2-server
- [ ] Set up Docker Compose (if Ory Hydra)
- [ ] Install OAuth server dependencies
- [ ] Design database schema for OAuth clients/tokens
- [ ] Create migrations

**Week 2: Core OAuth Endpoints**
- [ ] Implement client registration (tRPC)
- [ ] Implement authorization endpoint
- [ ] Implement token endpoint
- [ ] Implement PKCE validation
- [ ] Implement consent screen UI
- [ ] Test authorization code flow

**Week 3: Token Management**
- [ ] Implement refresh token grant
- [ ] Implement token revocation
- [ ] Implement token introspection
- [ ] Add scope enforcement middleware
- [ ] Test token lifecycle

**Week 4: Developer Portal**
- [ ] Build OAuth client registration UI
- [ ] Show client credentials
- [ ] Test token creation/deletion
- [ ] Add API documentation
- [ ] Write integration guide for external developers

**Deliverables**:
- External apps can register OAuth clients
- Users can authorize external apps
- External apps can access ChainGraph API with scopes
- Developer portal for OAuth client management

### Phase 3: Advanced Features (3 weeks)

**Week 1: Telegram and Web3 Auth**
- [ ] Research Telegram custom plugin
- [ ] Implement Telegram auth (if possible)
- [ ] Test Ethereum SIWE integration
- [ ] Add wallet connection UI
- [ ] Test multi-chain support

**Week 2: Token Management**
- [ ] Implement automatic token refresh for Google
- [ ] Test token encryption at rest
- [ ] Add token access for API nodes (GitHub, Google)
- [ ] Test Google Sheets node with stored token
- [ ] Test GitHub API node with stored token

**Week 3: Demo User Migration**
- [ ] Build account upgrade UI
- [ ] Test demo → permanent user flow
- [ ] Add email verification
- [ ] Test account linking conflicts
- [ ] Write migration documentation

**Deliverables**:
- Telegram auth (if community plugin ready)
- Web3 wallet auth working
- Automatic token refresh for Google APIs
- Demo users can upgrade to permanent accounts

### Phase 4: Testing and Documentation (1 week)

**Integration Testing**:
- [ ] Write tests for OAuth client login
- [ ] Write tests for OAuth server flows
- [ ] Write tests for scope enforcement
- [ ] Write tests for token refresh
- [ ] Write tests for account linking

**Documentation**:
- [ ] Update API documentation
- [ ] Write OAuth integration guide for external developers
- [ ] Create migration guide for existing users
- [ ] Document environment variables
- [ ] Create troubleshooting guide

**QA Testing**:
- [ ] Manual testing of all flows
- [ ] Security audit
- [ ] Performance testing
- [ ] Cross-browser testing

**Deliverables**:
- Comprehensive test coverage
- Complete documentation
- Security audit report

### Total Timeline: 11 weeks

**By Role**:
- Backend Developer: 7 weeks (OAuth client + server)
- Frontend Developer: 3 weeks (UI components)
- DevOps: 1 week (Docker, deployment)

---

## Part 6: Decision Matrix

### OAuth Client: Better Auth vs Custom

| Criteria | Better Auth | Custom Implementation |
|----------|-------------|----------------------|
| Development Time | 3 weeks | 8-10 weeks |
| Maintenance | Low (library handles it) | High (you maintain it) |
| Security | Battle-tested | Your responsibility |
| Type Safety | Excellent | Good |
| tRPC Integration | Good (via context) | Excellent (native) |
| Provider Support | Extensive | Manual per provider |
| Cost | Free (MIT) | Development time |
| **Recommendation** | ✅ RECOMMENDED | ❌ Not recommended |

### OAuth Server: Ory Hydra vs @jmondi/oauth2-server vs Custom

| Criteria | Ory Hydra | @jmondi/oauth2-server | Custom |
|----------|-----------|----------------------|--------|
| Development Time | 3-4 weeks | 4-6 weeks | 10-12 weeks |
| Maintenance | Low | Medium | High |
| Security | OpenID Certified | Standards compliant | Your responsibility |
| Complexity | Separate service | Integrated | Integrated |
| Scalability | Excellent | Good | Unknown |
| Type Safety | SDK types | Native TypeScript | Native TypeScript |
| Certification | ✅ OpenID Certified | ❌ No | ❌ No |
| Cost | Free (self-hosted) | Free (MIT) | Development time |
| **Recommendation** | ✅ RECOMMENDED | ⚠️ Consider if you need full control | ❌ Not recommended |

### Build vs Buy

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Better Auth (OAuth Client)** | Production-ready, extensive provider support, active maintenance | Some production issues, limited customization | ✅ RECOMMENDED |
| **Ory Hydra (OAuth Server)** | Battle-tested, certified, scalable | Separate service, Go-based | ✅ RECOMMENDED |
| **@jmondi/oauth2-server** | TypeScript-native, integrated, full control | More maintenance, not certified | ⚠️ Consider if you need full control |
| **Custom OAuth Client** | Full control | 400+ pages of specs, security risks | ❌ NOT RECOMMENDED |
| **Custom OAuth Server** | Full control | Very high complexity, security risks | ❌ NOT RECOMMENDED |
| **Better Auth OIDC Plugin** | Integrated, TypeScript-native | Experimental, not production-ready | ❌ NOT RECOMMENDED (for production) |

---

## Part 7: Code Examples

### Example 1: Better Auth + tRPC Setup

```typescript
// packages/chaingraph-trpc/server/auth/betterAuth.ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../stores/postgres"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: {
        tableName: "chaingraph_users",
        fields: {
          id: "id",
          name: "display_name",
          email: "email",
          emailVerified: "email_verified",
          image: "avatar_url",
          createdAt: "created_at",
          updatedAt: "updated_at",
        },
      },
      account: {
        tableName: "chaingraph_external_accounts",
        fields: {
          id: "id",
          userId: "user_id",
          accountId: "external_id",
          providerId: "provider",
          accessToken: "access_token",
          refreshToken: "refresh_token",
          expiresAt: "expires_at",
          scope: "scope",
        },
      },
    },
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      accessType: "offline",
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
})

// packages/chaingraph-trpc/server/router.ts
import { auth } from "./auth/betterAuth"

app.all("/api/auth/*", async (req, res) => {
  return auth.handler(req, res)
})

// packages/chaingraph-trpc/server/context.ts
import { auth } from "./auth/betterAuth"

export async function createContext(opts: CreateHTTPContextOptions) {
  const session = await auth.api.getSession({
    headers: opts.req.headers,
  })

  return {
    session: session ? {
      user: session.user,
      isAuthenticated: true,
    } : {
      isAuthenticated: false,
    },
    // ... other context
  }
}

// packages/chaingraph-trpc/server/procedures/protected.ts
const authedProcedure = publicProcedure.use(async (opts) => {
  if (!opts.ctx.session.isAuthenticated) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return opts.next({
    ctx: {
      ...opts.ctx,
      user: opts.ctx.session.user,
    },
  })
})

export const userRouter = router({
  profile: authedProcedure.query(async ({ ctx }) => {
    return ctx.user // Fully typed
  }),
})
```

### Example 2: GitHub OAuth Flow with Token Storage

```typescript
// Frontend: Login button
import { authClient } from "@/lib/auth"

function LoginButton() {
  return (
    <button onClick={() => {
      authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard",
      })
    }}>
      Login with GitHub
    </button>
  )
}

// Backend: Store token automatically (Better Auth handles this)
// packages/chaingraph-trpc/server/auth/betterAuth.ts
export const auth = betterAuth({
  account: {
    encryptOAuthTokens: true, // Encrypt before storing
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
})

// Node: Access stored token for GitHub API
// packages/chaingraph-nodes/src/nodes/github/listRepos.ts
import { auth } from "@badaitech/chaingraph-trpc/server/auth/betterAuth"

@Node({
  title: "List GitHub Repos",
  description: "Fetch user's GitHub repositories",
  category: "github",
})
class ListGitHubReposNode extends BaseNode {
  @Output()
  @PortArray({ itemType: "object" })
  repos: any[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const userId = context.userId

    // Get GitHub access token
    const token = await auth.api.getAccessToken({
      userId,
      providerId: "github",
    })

    if (!token) {
      throw new Error("GitHub account not linked. Please connect your GitHub account in settings.")
    }

    // Call GitHub API
    const response = await fetch("https://api.github.com/user/repos", {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        Accept: "application/vnd.github+json",
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`)
    }

    this.repos = await response.json()
    return {}
  }
}
```

### Example 3: OAuth Server Endpoints (Ory Hydra)

```typescript
// packages/chaingraph-trpc/server/oauth/hydra.ts
import { Configuration, OAuth2Api } from "@ory/hydra-client"

const hydra = new OAuth2Api(
  new Configuration({
    basePath: process.env.HYDRA_ADMIN_URL || "http://localhost:4445",
  })
)

// tRPC procedure: Handle login flow
export const oauthLogin = authedProcedure
  .input(z.object({ challenge: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Get login request from Hydra
    const { data: loginRequest } = await hydra.getOAuth2LoginRequest({
      loginChallenge: input.challenge,
    })

    // Accept login (user already authenticated by Better Auth)
    const { data: loginResponse } = await hydra.acceptOAuth2LoginRequest({
      loginChallenge: input.challenge,
      acceptOAuth2LoginRequest: {
        subject: ctx.user.id,
        remember: true,
        rememberFor: 3600,
      },
    })

    return { redirectTo: loginResponse.redirect_to }
  })

// tRPC procedure: Handle consent flow
export const oauthConsent = authedProcedure
  .input(z.object({
    challenge: z.string(),
    accept: z.boolean(),
    scopes: z.array(z.string()).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const { data: consentRequest } = await hydra.getOAuth2ConsentRequest({
      consentChallenge: input.challenge,
    })

    if (input.accept) {
      // Check if user has already granted consent
      const existingConsent = await db.query.oauthConsents.findFirst({
        where: and(
          eq(oauthConsents.userId, ctx.user.id),
          eq(oauthConsents.clientId, consentRequest.client.client_id)
        ),
      })

      if (existingConsent) {
        // Skip consent, use existing
        const { data: response } = await hydra.acceptOAuth2ConsentRequest({
          consentChallenge: input.challenge,
          acceptOAuth2ConsentRequest: {
            grantScope: existingConsent.scopes.split(" "),
            grantAccessTokenAudience: consentRequest.requested_access_token_audience,
            remember: true,
            rememberFor: 3600,
          },
        })
        return { redirectTo: response.redirect_to }
      }

      // New consent
      const { data: response } = await hydra.acceptOAuth2ConsentRequest({
        consentChallenge: input.challenge,
        acceptOAuth2ConsentRequest: {
          grantScope: input.scopes || consentRequest.requested_scope,
          grantAccessTokenAudience: consentRequest.requested_access_token_audience,
          remember: true,
          rememberFor: 3600,
        },
      })

      // Store consent in database
      await db.insert(oauthConsents).values({
        id: nanoid(),
        userId: ctx.user.id,
        clientId: consentRequest.client.client_id,
        scopes: (input.scopes || consentRequest.requested_scope).join(" "),
        grantedAt: new Date(),
      })

      return { redirectTo: response.redirect_to }
    } else {
      // User denied
      const { data: response } = await hydra.rejectOAuth2ConsentRequest({
        consentChallenge: input.challenge,
        rejectOAuth2Request: {
          error: "access_denied",
          errorDescription: "User denied consent",
        },
      })
      return { redirectTo: response.redirect_to }
    }
  })

// tRPC procedure: Register OAuth client
export const registerOAuthClient = authedProcedure
  .input(z.object({
    name: z.string(),
    description: z.string().optional(),
    redirectUris: z.array(z.string().url()),
    scopes: z.array(z.string()),
  }))
  .mutation(async ({ ctx, input }) => {
    // Create client in Hydra
    const { data: client } = await hydra.createOAuth2Client({
      oAuth2Client: {
        client_name: input.name,
        redirect_uris: input.redirectUris,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        scope: input.scopes.join(" "),
        token_endpoint_auth_method: "client_secret_basic",
      },
    })

    // Store client in ChainGraph database
    await db.insert(oauthClients).values({
      id: nanoid(),
      clientId: client.client_id,
      clientSecret: await bcrypt.hash(client.client_secret, 10),
      name: input.name,
      description: input.description,
      redirectUris: input.redirectUris,
      allowedScopes: input.scopes,
      userId: ctx.user.id,
      createdAt: new Date(),
    })

    return {
      clientId: client.client_id,
      clientSecret: client.client_secret, // Show once
    }
  })
```

### Example 4: Scope Validation in tRPC

```typescript
// packages/chaingraph-trpc/server/middleware/scopeMiddleware.ts
import { TRPCError } from "@trpc/server"

/**
 * Middleware to enforce OAuth scopes for external API access
 */
export const requireScope = (requiredScope: string) => {
  return authedProcedure.use(async (opts) => {
    const token = opts.ctx.session?.token

    if (!token) {
      throw new TRPCError({ code: "UNAUTHORIZED" })
    }

    // Check if this is an OAuth access token (vs. Better Auth session)
    const isOAuthToken = token.startsWith("cg_") // ChainGraph OAuth tokens

    if (isOAuthToken) {
      // Validate OAuth token and check scopes
      const accessToken = await db.query.oauthAccessTokens.findFirst({
        where: eq(oauthAccessTokens.token, token),
      })

      if (!accessToken) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid access token" })
      }

      if (accessToken.expiresAt < new Date()) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Access token expired" })
      }

      const scopes = accessToken.scopes.split(" ")
      if (!scopes.includes(requiredScope)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Missing required scope: ${requiredScope}`,
        })
      }

      return opts.next({
        ctx: {
          ...opts.ctx,
          scopes,
          oauthClientId: accessToken.clientId,
        },
      })
    }

    // Better Auth session token - has full access
    return opts.next()
  })
}

// Usage in router
export const flowRouter = router({
  list: requireScope("flows:read")
    .query(async ({ ctx }) => {
      // Only return flows owned by token user
      return await ctx.flowStore.getFlows({ ownerId: ctx.user.id })
    }),

  create: requireScope("flows:write")
    .input(createFlowSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.flowStore.createFlow({
        ...input,
        ownerId: ctx.user.id,
      })
    }),
})
```

---

## Part 8: Security Best Practices

### 8.1 PKCE Implementation

```typescript
// Client-side (external app)
import crypto from "crypto"

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url")
}

function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url")
}

// Authorization request
const codeVerifier = generateCodeVerifier()
const codeChallenge = generateCodeChallenge(codeVerifier)

// Store verifier for later
sessionStorage.setItem("code_verifier", codeVerifier)

// Redirect to ChainGraph OAuth
window.location.href = `https://chaingraph.com/oauth/authorize?
  client_id=cg_abc123&
  redirect_uri=https://app.example.com/callback&
  scope=flows:read&
  response_type=code&
  code_challenge=${codeChallenge}&
  code_challenge_method=S256&
  state=${randomState}`

// Token exchange (after callback)
const verifier = sessionStorage.getItem("code_verifier")
const response = await fetch("https://chaingraph.com/oauth/token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    grant_type: "authorization_code",
    code: authorizationCode,
    redirect_uri: "https://app.example.com/callback",
    client_id: "cg_abc123",
    code_verifier: verifier,
  }),
})
```

### 8.2 Token Storage Security

```typescript
// Encrypt tokens before storing
import crypto from "crypto"

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY! // 32-byte key
const ALGORITHM = "aes-256-gcm"

function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

  let encrypted = cipher.update(token, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag()

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`
}

function decryptToken(encryptedToken: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(":")

  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

// Use in database operations
await db.insert(oauthAccessTokens).values({
  token: encryptToken(accessToken),
  // ...
})
```

### 8.3 Rate Limiting

```typescript
// packages/chaingraph-trpc/server/middleware/rateLimit.ts
import { TRPCError } from "@trpc/server"

const rateLimits = new Map<string, { count: number, resetAt: number }>()

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return publicProcedure.use(async (opts) => {
    const identifier = opts.ctx.session?.user?.id || opts.req.ip

    const now = Date.now()
    const limit = rateLimits.get(identifier)

    if (!limit || limit.resetAt < now) {
      rateLimits.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      })
      return opts.next()
    }

    if (limit.count >= maxRequests) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded",
      })
    }

    limit.count++
    return opts.next()
  })
}

// Usage
export const flowRouter = router({
  list: rateLimit(100, 60000) // 100 requests per minute
    .use(requireScope("flows:read"))
    .query(async ({ ctx }) => {
      // ...
    }),
})
```

---

## Appendix: Additional Resources

### Official Documentation
- Better Auth: https://www.better-auth.com/docs
- Ory Hydra: https://www.ory.sh/docs/hydra/
- @jmondi/oauth2-server: https://tsoauth2server.com/
- OAuth 2.1 Draft: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-11
- OAuth 2.0 Security Best Practices (RFC 9700): https://datatracker.ietf.org/doc/html/rfc9700

### Community Examples
- Better Auth + tRPC + Drizzle: https://github.com/patelharsh9797/t3_stack_better_auth
- React Router + tRPC + Better Auth: https://github.com/ayoubphy/react-router-trpc-prisma-better-auth
- NestJS + tRPC + Better Auth: https://michaelguay.dev/how-to-integrate-better-auth-with-nestjs-trpc/

### ChainGraph Codebase References
- Auth Service: `/Users/noir/code/github.com/badaitech/chaingraph/packages/chaingraph-trpc/server/auth/service.ts`
- User Store: `/Users/noir/code/github.com/badaitech/chaingraph/packages/chaingraph-trpc/server/stores/userStore/pgUserStore.ts`
- Database Schema: `/Users/noir/code/github.com/badaitech/chaingraph/packages/chaingraph-trpc/server/stores/postgres/schema.ts`
- tRPC Context: `/Users/noir/code/github.com/badaitech/chaingraph/packages/chaingraph-trpc/server/context.ts`

### Security Standards
- PKCE (RFC 7636): https://datatracker.ietf.org/doc/html/rfc7636
- JWT (RFC 7519): https://datatracker.ietf.org/doc/html/rfc7519
- OAuth 2.0 (RFC 6749): https://datatracker.ietf.org/doc/html/rfc6749
- OpenID Connect: https://openid.net/specs/openid-connect-core-1_0.html

---

## Conclusion

**Better Auth** is the recommended solution for ChainGraph's OAuth client needs, providing production-ready authentication with GitHub, Google, and Web3 wallets. Integration effort is estimated at **3-5 weeks**.

**Ory Hydra** is the recommended solution for OAuth server capabilities, enabling "Login with ChainGraph" for external applications. Integration effort is estimated at **3-4 weeks**.

**Total implementation time**: **5-7 weeks** for full hybrid architecture (OAuth client + server).

The hybrid approach allows ChainGraph to function as both OAuth client (users login via external providers) and OAuth server (external apps access ChainGraph data), with proper separation of token types and security boundaries.

**Next Steps**:
1. Approve architectural approach
2. Set up development environment (Better Auth + Ory Hydra)
3. Begin Phase 1: OAuth Client Integration
4. Begin Phase 2: OAuth Server Implementation (in parallel)
5. Testing and security audit
6. Production deployment

**Risk Mitigation**:
- Start with Better Auth OAuth client (lower risk)
- Keep existing demo token system for backward compatibility
- Use Ory Hydra (battle-tested) instead of experimental Better Auth OIDC plugin
- Implement comprehensive testing and security audit before production
