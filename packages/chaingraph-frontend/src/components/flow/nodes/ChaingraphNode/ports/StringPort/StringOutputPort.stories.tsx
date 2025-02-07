import type { Meta, StoryObj } from '@storybook/react'

import { StringOutputPort } from './StringOutputPort'

const meta: Meta<typeof StringOutputPort> = {
  component: StringOutputPort,
}

export default meta
type Story = StoryObj<typeof StringOutputPort>

export const Default: Story = {
  args: {},
}
