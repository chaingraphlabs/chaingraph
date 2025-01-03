import { hello } from '@chaingraph/backend/procedures/common/hello'
import { complexData, toUpperCase } from '@chaingraph/backend/procedures/common/transform'
import { currentTime } from '@chaingraph/backend/procedures/subscriptions'

export const procedures = {
  hello,
  toUpperCase,
  complexData,
  currentTime,
}
