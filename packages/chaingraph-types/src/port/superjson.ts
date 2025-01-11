import {
  isNumberPort,
  NumberPort,
  type NumberPortConfig,
  type NumberPortValue,
} from '@chaingraph/types'
import superjson from 'superjson'

superjson.registerCustom<NumberPort, string>(
  {
    isApplicable: (v): v is NumberPort => isNumberPort(v),
    serialize: (v) => {
      return superjson.stringify({ config: v.config, value: v.getValue() })
    },
    deserialize: (v) => {
      const data = superjson.parse<
        { config: NumberPortConfig, value: NumberPortValue }
      >(v)
      const port = new NumberPort(data.config)
      port.setValue(data.value)
      return port
    },
  },
  'NumberPort',
)
