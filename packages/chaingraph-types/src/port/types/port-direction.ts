/*
 * * * * * * * * * * *
 * Port Direction
 * * * * * * * * * * *
 */
import { z } from 'zod'

export enum PortDirectionEnum {
  Input = 'input',
  Output = 'output',
}

export const PortDirectionSchema = z.nativeEnum(PortDirectionEnum)
export type PortDirection = PortDirectionEnum.Input | PortDirectionEnum.Output
