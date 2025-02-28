/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { JSONValue } from '../../utils/json'

/**
 * Interface for serializing and deserializing nodes
 * Uses a generic type parameter for the return types of deserialize and clone
 */
export interface ISerializable<T = any> {
    /**
     * Serialize the node to a JSON-compatible format
     * @returns The serialized node
     */
    serialize(): JSONValue

    /**
     * Deserialize from JSON data
     * @param data The serialized data
     * @returns The deserialized instance (typed as T)
     */
    deserialize(data: JSONValue): T

    /**
     * Create a deep clone of the node
     * @returns A new node instance with the same state (typed as T)
     */
    clone(): T
}