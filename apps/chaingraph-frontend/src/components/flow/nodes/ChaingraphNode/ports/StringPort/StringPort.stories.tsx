import type { Meta, StoryObj } from '@storybook/react'

import { StringPort } from './StringPort'

const meta: Meta<typeof StringPort> = {
  component: StringPort,
}

export default meta
type Story = StoryObj<typeof StringPort>

export const Default: Story = {
  args: {},
}
