import type {
  StringPortConfig,
} from '@chaingraph/types/port'
import {
  PortDirection,
  PortKind,
  StreamInputPort,
  StreamOutputPort,
} from '@chaingraph/types/port'
import { registerPortTransformers } from '@chaingraph/types/port/json-transformers'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'

describe('stream ports serialization', () => {
  beforeAll(() => {
    registerPortTransformers()
  })

  it('should correctly serialize and deserialize a StreamOutputPort without sending data', () => {
    // Arrange
    const outputPort = new StreamOutputPort<string>({
      kind: PortKind.StreamOutput,
      id: 'output-port',
      direction: PortDirection.Output,
      valueType: {
        kind: PortKind.String,
        id: 'string-type',
      } as StringPortConfig,
    })

    // Act
    const serialized = superjson.stringify(outputPort)
    const deserialized = superjson.parse(serialized)

    // Assert
    expect(deserialized).toBeInstanceOf(StreamOutputPort)
    if (!(deserialized instanceof StreamOutputPort)) {
      throw new TypeError('Deserialized port is not an instance of StreamOutputPort')
    }
    expect(deserialized.config).toEqual(outputPort.config)
  })

  it('should correctly serialize and deserialize a StreamOutputPort after sending data', async () => {
    // Arrange
    const outputPort = new StreamOutputPort<string>({
      kind: PortKind.StreamOutput,
      id: 'output-port',
      direction: PortDirection.Output,
      valueType: {
        kind: PortKind.String,
        id: 'string-type',
      } as StringPortConfig,
    })

    outputPort.send('Message 1')
    outputPort.send('Message 2')
    outputPort.close()

    // Act
    const serialized = superjson.stringify(outputPort)
    const deserialized = superjson.parse(serialized)

    // Assert
    expect(deserialized).toBeInstanceOf(StreamOutputPort)
    if (!(deserialized instanceof StreamOutputPort)) {
      throw new TypeError('Deserialized port is not an instance of StreamOutputPort')
    }
    expect(deserialized.config).toEqual(outputPort.config)

    // Verify that the data sent before serialization is preserved
    const receivedMessages: string[] = []
    const deserializedChannel = deserialized.getValue()

    const receiver = (async () => {
      for await (const message of deserializedChannel) {
        receivedMessages.push(message)
      }
    })()

    // Wait for receiver to finish
    await receiver

    expect(receivedMessages).toEqual(['Message 1', 'Message 2'])
  })

  it('should correctly serialize and deserialize a StreamInputPort connected to a StreamOutputPort', async () => {
    // Arrange
    const outputPort = new StreamOutputPort<string>({
      kind: PortKind.StreamOutput,
      id: 'output-port',
      direction: PortDirection.Output,
      valueType: { kind: PortKind.String } as StringPortConfig,
    })

    const inputPort = new StreamInputPort<string>({
      kind: PortKind.StreamInput,
      id: 'input-port',
      direction: PortDirection.Input,
      valueType: { kind: PortKind.String } as StringPortConfig,
    })

    // Connect input port to output port
    inputPort.setValue(outputPort.getValue())

    // Send some data
    outputPort.send('Message before serialization')
    outputPort.close()

    // Serialize ports
    const serializedOutputPort = superjson.stringify(outputPort)
    const serializedInputPort = superjson.stringify(inputPort)

    // Deserialize ports
    const deserializedOutputPort = superjson.parse(serializedOutputPort)
    const deserializedInputPort = superjson.parse(serializedInputPort)

    // Assert
    expect(deserializedOutputPort).toBeInstanceOf(StreamOutputPort)
    expect(deserializedInputPort).toBeInstanceOf(StreamInputPort)

    if (!(deserializedOutputPort instanceof StreamOutputPort) || !(deserializedInputPort instanceof StreamInputPort)) {
      throw new TypeError('Deserialized ports are not instances of StreamOutputPort and StreamInputPort')
    }

    // Reconnect deserialized input port to deserialized output port's channel
    deserializedInputPort.setValue(deserializedOutputPort.getValue())

    // Start receiving messages
    const receivedMessages: string[] = []
    const receiver = (async () => {
      for await (const msg of deserializedInputPort.receive()) {
        receivedMessages.push(msg)
      }
    })()

    // Send more messages
    expect(() => deserializedOutputPort.send('Message after serialization')).toThrowError('Cannot send to a closed channel.')

    // Wait for receiver to finish
    await receiver
  })

  it('should preserve the channel state during serialization and deserialization', async () => {
    // Arrange
    const outputPort = new StreamOutputPort<number>({
      kind: PortKind.StreamOutput,
      id: 'number-output-port',
      direction: PortDirection.Output,
      valueType: { kind: PortKind.Number },
    })

    const inputPort = new StreamInputPort<number>({
      kind: PortKind.StreamInput,
      id: 'number-input-port',
      direction: PortDirection.Input,
      valueType: { kind: PortKind.Number },
    })

    // Connect ports
    inputPort.setValue(outputPort.getValue())

    // Send data and do not close the channel
    outputPort.send(42)

    // Serialize ports
    const serializedOutputPort = superjson.stringify(outputPort)
    const serializedInputPort = superjson.stringify(inputPort)

    // Deserialize ports
    const deserializedOutputPort = superjson.parse(serializedOutputPort)
    const deserializedInputPort = superjson.parse(serializedInputPort)

    if (!(deserializedOutputPort instanceof StreamOutputPort) || !(deserializedInputPort instanceof StreamInputPort)) {
      throw new TypeError('Deserialized ports are not instances of StreamOutputPort and StreamInputPort')
    }

    // Reconnect deserialized ports
    deserializedInputPort.setValue(deserializedOutputPort.getValue())

    // Start receiving messages
    const receivedMessages: number[] = []
    const receiver = (async () => {
      for await (const msg of deserializedInputPort.receive()) {
        receivedMessages.push(msg)
        if (receivedMessages.length === 2) {
          break
        }
      }
    })()

    // Send more data
    deserializedOutputPort.send(100)
    deserializedOutputPort.close()

    // Wait for receiver to finish
    await receiver

    // Assertions
    expect(receivedMessages).toEqual([42, 100])
  })

  it('should serialize and deserialize StreamInputPort without a connected channel', () => {
    // Arrange
    const inputPort = new StreamInputPort<string>({
      kind: PortKind.StreamInput,
      id: 'input-port',
      direction: PortDirection.Input,
      valueType: { kind: PortKind.String } as StringPortConfig,
    })

    // Act
    const serialized = superjson.stringify(inputPort)
    const deserialized = superjson.parse(serialized)

    // Assert
    expect(deserialized).toBeInstanceOf(StreamInputPort)
    if (!(deserialized instanceof StreamInputPort)) {
      throw new TypeError('Deserialized port is not an instance of StreamInputPort')
    }
    expect(deserialized.config).toEqual(inputPort.config)
    expect(deserialized.getValue()).toBeNull()
  })
})
