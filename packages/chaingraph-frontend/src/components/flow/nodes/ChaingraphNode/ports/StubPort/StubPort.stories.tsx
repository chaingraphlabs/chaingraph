import type { Meta, StoryObj } from '@storybook/react'
import { StubPort } from './StubPort'

const meta: Meta<typeof StubPort> = {
  component: StubPort,
}

export default meta
type Story = StoryObj<typeof StubPort>

export const Default: Story = {
  args: {},
}
