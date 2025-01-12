/*
 * * * * * * * * * * *
 * Port Kind
 * * * * * * * * * * *
 */
import { z } from 'zod'

export enum PortKindEnum {
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

export const PortKindSchema = z.nativeEnum(PortKindEnum)

export type PortKind =
  | PortKindEnum.String
  | PortKindEnum.Number
  | PortKindEnum.Boolean
  | PortKindEnum.Array
  | PortKindEnum.Object
  | PortKindEnum.Any
  | PortKindEnum.Enum
  | PortKindEnum.StreamOutput
  | PortKindEnum.StreamInput
