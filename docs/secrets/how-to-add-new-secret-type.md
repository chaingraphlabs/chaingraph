# How to Add New Secret Type?

A secret type should be added for each node that requires a set of secret fields. A type of the secret helps to distinct
secrets with the same structure which are not interchangeable. For example, despite both OpenAI and Anthropic API keys
simply are strings, you can't use one instead of another.

New Secret Type can be added in two steps:

1. Add the Zod schema of the secret value. It is always an object that consists of several fields. To do this locate
   object `secretTypeSchemas` in the file `packages/chaingraph-types/src/port/base/secret.ts`, and assign the desired
   schema to a new key in this object. Object key will become an identifier for this type of secret.
2. In the same file locate object `secretTypeMetadata`, and assign the necessary metadata (which is icon URL, secret
   label, and a label for each field of the secret) to the same key as in the previous step.
