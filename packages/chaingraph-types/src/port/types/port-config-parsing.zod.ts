import type { z } from 'zod'
import type {
  AnyPortConfig,
  ArrayPortConfig,
  EnumPortConfig,
  ObjectPortConfig,
  PortConfig,
  StreamInputPortConfig,
  StreamOutputPortConfig,
} from './port-config'
import { ZodError } from 'zod'
import {
  AnyPortConfigSchema,
  ArrayPortConfigSchema,
  BasePortConfigSchema,
  BooleanPortConfigSchema,
  EnumPortConfigSchema,
  NumberPortConfigSchema,
  ObjectPortConfigSchema,
  StreamInputPortConfigSchema,
  StreamOutputPortConfigSchema,
  StringPortConfigSchema,
} from './port-config.zod'
import { PortKindEnum } from './port-kind-enum'

export class PortConfigParsingError extends Error {
  constructor(
    message: string,
    public readonly path: string[] = [],
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'PortConfigParsingError'
  }
}

// Helper function to handle Zod errors
function handleZodError(error: ZodError, path: string[]): never {
  const zodErrors = error.errors.map(err => ({
    message: err.message,
    path: [...path, ...err.path.map(p => p.toString())],
  }))

  throw new PortConfigParsingError(
    zodErrors.map(err => `${err.path.join('.')}: ${err.message}`).join('; '),
    zodErrors[0]?.path ?? path,
    error,
  )
}

// Wrapper for safe Zod parsing
function safeParse<T>(schema: z.ZodType<T>, data: unknown, path: string[]): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof ZodError) {
      handleZodError(error, path)
    }
    throw new PortConfigParsingError('Unknown parsing error', path, error)
  }
}

export function parsePortConfig(
  data: unknown,
  path: string[] = [],
): PortConfig {
  try {
    // First, validate the kind field to determine which parser to use
    const kind = safeParse(BasePortConfigSchema.shape.kind, (data as any)?.kind, path)

    // Now handle parsing based on the port kind
    switch (kind) {
      case PortKindEnum.String:
        return safeParse(StringPortConfigSchema, data, path)
      case PortKindEnum.Number:
        return safeParse(NumberPortConfigSchema, data, path)
      case PortKindEnum.Boolean:
        return safeParse(BooleanPortConfigSchema, data, path)
      case PortKindEnum.Array:
        return parseArrayPortConfig(data, path)
      case PortKindEnum.Object:
        return parseObjectPortConfig(data, path)
      case PortKindEnum.Enum:
        return parseEnumPortConfig(data, path)
      case PortKindEnum.Any:
        return parseAnyPortConfig(data, path)
      case PortKindEnum.StreamInput:
        return parseStreamInputPortConfig(data, path)
      case PortKindEnum.StreamOutput:
        return parseStreamOutputPortConfig(data, path)
      default:
        throw new PortConfigParsingError(
          `Unknown port kind: ${kind}`,
          path,
        )
    }
  } catch (error) {
    if (error instanceof PortConfigParsingError) {
      throw error
    }
    if (error instanceof ZodError) {
      handleZodError(error, path)
    }
    throw new PortConfigParsingError(
      'Failed to parse port config',
      path,
      error,
    )
  }
}

function parseArrayPortConfig(
  data: unknown,
  path: string[],
): ArrayPortConfig<PortConfig> {
  safeParse(ArrayPortConfigSchema, data, path)
  return {
    ...(data as any),
    elementConfig: parsePortConfig((data as any)?.elementConfig, [...path, 'elementConfig']),
  }
}

function parseObjectPortConfig(
  data: unknown,
  path: string[],
): ObjectPortConfig<any> {
  const config = safeParse(ObjectPortConfigSchema, data, path)

  if ((data as any).schema) {
    return {
      ...(data as any),
      schema: {
        ...(data as any).schema,
        properties: Object.fromEntries(
          Object.entries((data as any).schema.properties).map(([key, propertyConfig]) => [
            key,
            parsePortConfig(propertyConfig, [...path, 'schema', 'properties', key]),
          ]),
        ),
      },
    }
  }

  return config
}

function parseEnumPortConfig(
  data: unknown,
  path: string[],
): EnumPortConfig<PortConfig> {
  safeParse(EnumPortConfigSchema, data, path)
  return {
    ...(data as any),
    options: (data as any).options.map((option: any, index: any) =>
      parsePortConfig(option, [...path, 'options', index.toString()]),
    ),
  }
}

function parseAnyPortConfig(
  data: unknown,
  path: string[],
): AnyPortConfig {
  safeParse(AnyPortConfigSchema, data, path)

  const connectedPortConfig = (data as any).connectedPortConfig
  if (connectedPortConfig !== undefined && connectedPortConfig !== null) {
    return {
      ...(data as any),
      connectedPortConfig: parsePortConfig(connectedPortConfig, [...path, 'connectedPortConfig']),
    }
  }

  if (connectedPortConfig === null) {
    return {
      ...(data as any),
      connectedPortConfig: null,
    }
  }

  return data as any
}

function parseStreamInputPortConfig(
  data: unknown,
  path: string[],
): StreamInputPortConfig<unknown> {
  safeParse(StreamInputPortConfigSchema, data, path)
  return {
    ...(data as any),
    valueType: (data as any).valueType
      ? parsePortConfig((data as any).valueType, [...path, 'valueType'])
      : undefined,
  }
}

function parseStreamOutputPortConfig(
  data: unknown,
  path: string[],
): StreamOutputPortConfig<unknown> {
  safeParse(StreamOutputPortConfigSchema, data, path)
  return {
    ...(data as any),
    valueType: (data as any).valueType
      ? parsePortConfig((data as any).valueType, [...path, 'valueType'])
      : undefined,
  }
}
