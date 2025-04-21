---
"@badaitech/typescript-config": patch
"@badaitech/chaingraph-nodes": patch
"@badaitech/chaingraph-types": patch
"@badaitech/chaingraph-frontend": patch
"@badaitech/chaingraph-trpc": patch
"@badaitech/chaingraph-backend": patch
"@badaitech/badai-api": patch
---

- Add authentication service to the chaingraph backend with two modes: dev and badai. When Dev mode is configured, then server will accept any requests. When badai is configured, then the server will expect the BadAI session JWT tokoken provided.
