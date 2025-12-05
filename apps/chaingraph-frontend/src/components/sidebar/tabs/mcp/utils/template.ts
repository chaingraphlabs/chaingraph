/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Regular expression to match template variables with optional whitespace
 * Matches: {{var}}, {{ var }}, {{  var  }}, etc.
 */
export const TEMPLATE_VARIABLE_REGEX = /\{\{\s*(\w+)\s*\}\}/g

/**
 * Extract template variable names from a header value
 * @param value - Header value potentially containing {{variables}}
 * @returns Array of variable names (may contain duplicates)
 */
export function getTemplateVariables(value: string): string[] {
  const regex = new RegExp(TEMPLATE_VARIABLE_REGEX)
  const matches: string[] = []

  for (let match = regex.exec(value); match !== null; match = regex.exec(value)) {
    matches.push(match[1])
  }

  return matches
}

/**
 * Count unique template variables across all server headers
 * @param authHeaders - Array of server authentication headers
 * @returns Count of unique template variables
 */
export function countTemplateVariables(
  authHeaders?: Array<{
    key: string
    value: string
    isTemplate?: boolean
  }>,
): number {
  if (!authHeaders)
    return 0

  const regex = new RegExp(TEMPLATE_VARIABLE_REGEX)
  const vars = new Set<string>()

  for (const header of authHeaders) {
    if (!header.isTemplate)
      continue

    for (let match = regex.exec(header.value); match !== null; match = regex.exec(header.value)) {
      vars.add(match[1])
    }
  }

  return vars.size
}
