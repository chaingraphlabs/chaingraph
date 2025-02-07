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
