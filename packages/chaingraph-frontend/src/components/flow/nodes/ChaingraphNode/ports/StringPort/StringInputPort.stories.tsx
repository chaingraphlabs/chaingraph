/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Meta, StoryObj } from '@storybook/react'

import { StringInputPort } from './StringInputPort'

const meta: Meta<typeof StringInputPort> = {
  component: StringInputPort,
}

export default meta
type Story = StoryObj<typeof StringInputPort>

export const Default: Story = {
  args: {},
}
