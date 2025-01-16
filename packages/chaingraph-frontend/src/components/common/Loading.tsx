import { Flex } from '@radix-ui/themes'

export function Loading() {
  return (
    <Flex align="center" justify="center" p="4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500" />
    </Flex>
  )
}
