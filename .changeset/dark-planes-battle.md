---
"@badaitech/typescript-config": patch
"@badaitech/chaingraph-nodes": patch
"@badaitech/chaingraph-types": patch
"@badaitech/chaingraph-frontend": patch
"@badaitech/chaingraph-trpc": patch
"@badaitech/chaingraph-backend": patch
"@badaitech/badai-api": patch
---

Add the ArchAI integration tab with configurable session and nodes context. When execution ID exists then disable all port inputs. Merge execution node and editor nodes UI to make it interactive after execution complete. Add BadAI nodes in the hidden category as fallback. Fix ports serialize/deserialize undefined and null values with fallback. Recursive open Any port underlying type. Improve LLM call with structured output node. Now it work well with Groq and any other LLM's. Add retries with error feedback. Other changes and bug fixes.
