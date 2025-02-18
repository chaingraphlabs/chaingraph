import type { Meta, StoryObj } from '@storybook/react'

import { EnumPort } from './EnumPort.tsx'

const meta: Meta<typeof EnumPort> = {
  component: EnumPort,
}

export default meta
type Story = StoryObj<typeof EnumPort>

export const Default: Story = {
  args: {},
}
