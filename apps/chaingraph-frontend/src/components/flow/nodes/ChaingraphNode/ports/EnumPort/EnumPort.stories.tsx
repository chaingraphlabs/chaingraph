/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Meta, StoryObj } from '@storybook/react'

import { EnumPort } from './EnumPort'

const meta: Meta<typeof EnumPort> = {
  component: EnumPort,
}

export default meta
type Story = StoryObj<typeof EnumPort>

export const Default: Story = {
  args: {},
}
