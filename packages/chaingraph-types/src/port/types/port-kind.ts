export enum PortKind {
  String = 'port:string',
  Number = 'port:number',
  Boolean = 'port:boolean',
  Array = 'port:array',
  Object = 'port:object',
  Any = 'port:any',
  Enum = 'port:enum',
  StreamOutput = 'port:stream-output',
  StreamInput = 'port:stream-input',
}

export type PortKindUnion =
  | PortKind.String
  | PortKind.Number
  | PortKind.Boolean
  | PortKind.Array
  | PortKind.Object
  | PortKind.Any
  | PortKind.Enum
  | PortKind.StreamOutput
  | PortKind.StreamInput
