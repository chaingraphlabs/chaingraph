/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "query ReadSecret($session: Session!, $id: SecretID!, $publicKey: ECDHPublicKeyP256!) {\n  secret(session: $session, id: $id, publicKey: $publicKey) {\n    secret {\n      encrypted\n      metadata {\n        type\n      }\n    }\n    publicKey\n  }\n}": typeof types.ReadSecretDocument,
};
const documents: Documents = {
    "query ReadSecret($session: Session!, $id: SecretID!, $publicKey: ECDHPublicKeyP256!) {\n  secret(session: $session, id: $id, publicKey: $publicKey) {\n    secret {\n      encrypted\n      metadata {\n        type\n      }\n    }\n    publicKey\n  }\n}": types.ReadSecretDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query ReadSecret($session: Session!, $id: SecretID!, $publicKey: ECDHPublicKeyP256!) {\n  secret(session: $session, id: $id, publicKey: $publicKey) {\n    secret {\n      encrypted\n      metadata {\n        type\n      }\n    }\n    publicKey\n  }\n}"): (typeof documents)["query ReadSecret($session: Session!, $id: SecretID!, $publicKey: ECDHPublicKeyP256!) {\n  secret(session: $session, id: $id, publicKey: $publicKey) {\n    secret {\n      encrypted\n      metadata {\n        type\n      }\n    }\n    publicKey\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;
