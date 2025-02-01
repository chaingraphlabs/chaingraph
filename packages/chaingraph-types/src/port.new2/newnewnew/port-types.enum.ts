export enum PortTypeEnum {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Array = 'array',
  Object = 'object',
  Enum = 'enum',
  Stream = 'stream',
}

export type PortType =
  | PortTypeEnum.String
  | PortTypeEnum.Number
  | PortTypeEnum.Boolean
  | PortTypeEnum.Array
  | PortTypeEnum.Object
  | PortTypeEnum.Enum
  | PortTypeEnum.Stream
