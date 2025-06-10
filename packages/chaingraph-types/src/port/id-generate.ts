/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'

export function generatePortID(propertyKey: string = ''): string {
  return `${propertyKey ? `${propertyKey}:` : ''}PO${customAlphabet(nolookalikes, 16)()}`
  // generate sortable UUID for now
  // return uuidv7()
}
