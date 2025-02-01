import type { IArrayPortConfig, IBooleanPortConfig, IStringPortConfig } from './port-configs'
import type { ArrayPort, StringPort } from './port-full'
import { PortTypeEnum } from './port-types.enum'

const stringPort: StringPort = {
  config: {
    id: 'string1',
    type: PortTypeEnum.String,
  },
  value: {
    type: PortTypeEnum.String,
    value: 'Hello, World!',
  },
}

const stringArrayPort: ArrayPort<IStringPortConfig> = {
  config: {
    id: 'array1',
    type: PortTypeEnum.Array,
    itemConfig: {
      id: 'stringItem',
      type: PortTypeEnum.String,
    },
  },
  value: {
    type: PortTypeEnum.Array,
    value: [
      { type: PortTypeEnum.String, value: 'Hello' },
      { type: PortTypeEnum.String, value: 'World' },
    ],
  },
}

// Define a 2D array as an array whose element config is itself an array config of booleans.
type BooleanArrayConfig = IArrayPortConfig<IBooleanPortConfig>

const bool2DArrayPort: ArrayPort<BooleanArrayConfig> = {
  config: {
    id: '2dArray',
    type: PortTypeEnum.Array,
    itemConfig: {
      id: 'innerArray',
      type: PortTypeEnum.Array,
      itemConfig: {
        id: 'boolItem',
        type: PortTypeEnum.Boolean,
      },
    },
  },
  value: {
    type: PortTypeEnum.Array,
    value: [
      {
        type: PortTypeEnum.Array,
        value: [
          { type: PortTypeEnum.Boolean, value: true },
          { type: PortTypeEnum.Boolean, value: false },
        ],
      },
      {
        type: PortTypeEnum.Array,
        value: [
          { type: PortTypeEnum.Boolean, value: true },
          { type: PortTypeEnum.Boolean, value: false },
        ],
      },
      {
        type: PortTypeEnum.Array,
        value: [
          { type: PortTypeEnum.Boolean, value: false },
          { type: PortTypeEnum.Boolean, value: true },
        ],
      },
    ],
  },
}
