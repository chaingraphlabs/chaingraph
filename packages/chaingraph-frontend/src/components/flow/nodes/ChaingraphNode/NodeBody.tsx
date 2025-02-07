import { type IPort, type PortConfig, PortKind } from '@chaingraph/types'
import { Fragment, type ReactNode } from 'react'
import { StringInputPort } from './ports/StringPort/StringInputPort'
import { StringOutputPort } from './ports/StringPort/StringOutputPort'
import { StubPort } from './ports/StubPort/StubPort'

interface NodeBodyProps {
  inputs: IPort<PortConfig>[]
  outputs: IPort<PortConfig>[]
}

export function NodeBody({ inputs, outputs }: NodeBodyProps) {
  return (
    <div className="px-3 py-2 space-y-4">
      <div className="space-y-3">

        {/* Input Ports */}
        {inputs.map((port) => {
          return (
            <Fragment key={port.config.id}>{renderInputPort(port)}</Fragment>
          )
        })}

        {/* Output Ports */}
        {outputs.map((port) => {
          return <Fragment key={port.config.id}>{renderOutputPort(port)}</Fragment>
        })}
      </div>
    </div>
  )
}

function renderInputPort(port: IPort<PortConfig>): ReactNode {
  const { config } = port
  const kind = config.kind

  switch (config.kind) {
    case PortKind.String: {
      return (
        <StringInputPort
          config={config}
        />
      )
    }
    case PortKind.Number: {
      return <StubPort config={config} />
    }
    case PortKind.Boolean: {
      return <StubPort config={config} />
    }
    case PortKind.Enum: {
      return <StubPort config={config} />
    }
    case PortKind.Array: {
      return <StubPort config={config} />
    }
    case PortKind.Object: {
      return <StubPort config={config} />
    }
    case PortKind.StreamInput: {
      return <StubPort config={config} />
    }
    case PortKind.StreamOutput: {
      return <StubPort config={config} />
    }
    case PortKind.Any: {
      return <StubPort config={config} />
    }

    default: {
      throw new Error(`Unhandled config.kind case: ${kind}`)
    }
  }
}

function renderOutputPort(port: IPort<PortConfig>): ReactNode {
  const { config } = port
  const kind = config.kind

  switch (kind) {
    case PortKind.String: {
      return <StringOutputPort config={config} />
    }
    case PortKind.Number: {
      return <StubPort config={config} />
    }
    case PortKind.Boolean: {
      return <StubPort config={config} />
    }
    case PortKind.Enum: {
      return <StubPort config={config} />
    }
    case PortKind.Array: {
      return <StubPort config={config} />
    }
    case PortKind.Object: {
      return <StubPort config={config} />
    }
    case PortKind.StreamInput: {
      return <StubPort config={config} />
    }
    case PortKind.StreamOutput: {
      return <StubPort config={config} />
    }
    case PortKind.Any: {
      return <StubPort config={config} />
    }

    default: {
      throw new Error(`Unhandled config.kind case: ${kind}`)
    }
  }
}
