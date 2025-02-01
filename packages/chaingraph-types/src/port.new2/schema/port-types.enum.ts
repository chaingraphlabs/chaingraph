// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/port-types.enum.ts
/*
  Global enumeration for port types used as discriminators in our system.
  Using a TypeScript enum for clarity and strict type checking.
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
  If a union of literal strings is preferred in some areas, you can use:
*/
export type PortType =
  | PortTypeEnum.String
  | PortTypeEnum.Number
  | PortTypeEnum.Boolean
  | PortTypeEnum.Array
  | PortTypeEnum.Object
  | PortTypeEnum.Enum
