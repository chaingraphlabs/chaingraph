/*
  Global enumeration for port types used as discriminators in our system.
  Using a TypeScript enum for clarity.
*/
export enum PortTypeEnum {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Array = 'array',
  Object = 'object',
  Enum = 'enum',
}

/*
  If a union of literal strings is preferred, you can use the following.
*/
export type PortType =
  | PortTypeEnum.String
  | PortTypeEnum.Number
  | PortTypeEnum.Boolean
  | PortTypeEnum.Array
  | PortTypeEnum.Object
  | PortTypeEnum.Enum
