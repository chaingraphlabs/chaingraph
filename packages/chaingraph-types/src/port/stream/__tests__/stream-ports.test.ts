import type {
  StreamInputPortConfig,
  StreamOutputPortConfig,
} from '../../types'
import { describe, expect, it } from 'vitest'
import {
  PortDirectionEnum,
  PortKindEnum,
} from '../../types'
import { StreamInputPort } from '../stream-input-port'
import { StreamOutputPort } from '../stream-output-port'

describe('stream Ports', () => {
  it('should transmit data from StreamOutputPort to StreamInputPort', async () => {
    // Configure output port
    const outputConfig: StreamOutputPortConfig<string> = {
      id: 'output1',
      name: 'String Output Port',
      kind: PortKindEnum.StreamOutput,
      direction: PortDirectionEnum.Output,
      valueType: {
        id: 'stringType',
        name: 'String',
        kind: PortKindEnum.String,
        direction: PortDirectionEnum.Output,
      },
    }

    // Configure input port
    const inputConfig: StreamInputPortConfig<string> = {
      id: 'input1',
      name: 'String Input Port',
      kind: PortKindEnum.StreamInput,
      direction: PortDirectionEnum.Input,
      valueType: {
        id: 'stringType',
        name: 'String',
        kind: PortKindEnum.String,
        direction: PortDirectionEnum.Input,
      },
    }

    // Create ports
    const outputPort = new StreamOutputPort<string>(outputConfig)
    const inputPort = new StreamInputPort<string>(inputConfig)

    // Connect input port to output port's channel
    inputPort.setValue(outputPort.getValue())

    // Prepare data to send
    const dataToSend = 'Hello, World!'

    // Start receiving data
    const receivedData: string[] = []
    const receiver = (async () => {
      for await (const data of inputPort.receive()) {
        receivedData.push(data)
      }
    })()

    // Send data
    outputPort.send(dataToSend)
    outputPort.close() // Close the stream

    // Wait for receiver to finish
    await receiver

    // Assertions
    expect(receivedData).toEqual([dataToSend])
  })

  it('should transmit multiple data items in order', async () => {
    // Configurations are the same as previous test

    // Create ports
    const outputPort = new StreamOutputPort<number>({
      id: 'output1',
      name: 'Number Output Port',
      kind: PortKindEnum.StreamOutput,
      direction: PortDirectionEnum.Output,
      valueType: {
        id: 'numberType',
        name: 'Number',
        kind: PortKindEnum.Number,
        direction: PortDirectionEnum.Output,
      },
    })

    const inputPort = new StreamInputPort<number>({
      id: 'input1',
      name: 'Number Input Port',
      kind: PortKindEnum.StreamInput,
      direction: PortDirectionEnum.Input,
      valueType: {
        id: 'numberType',
        name: 'Number',
        kind: PortKindEnum.Number,
        direction: PortDirectionEnum.Input,
      },
    })

    // Connect ports
    inputPort.setValue(outputPort.getValue())

    // Data to send
    const dataToSend = [1, 2, 3, 4, 5]

    // Start receiving data
    const receivedData: number[] = []
    const receiver = (async () => {
      for await (const data of inputPort.receive()) {
        receivedData.push(data)
      }
    })()

    // Send data
    for (const item of dataToSend) {
      outputPort.send(item)
    }
    outputPort.close()

    // Wait for receiver
    await receiver

    // Assertions
    expect(receivedData).toEqual(dataToSend)
  })

  it('should allow multiple subscribers to receive the same data', async () => {
    // Create output port
    const outputPort = new StreamOutputPort<string>({
      id: 'output1',
      name: 'String Output Port',
      kind: PortKindEnum.StreamOutput,
      direction: PortDirectionEnum.Output,
      valueType: {
        id: 'stringType',
        name: 'String',
        kind: PortKindEnum.String,
        direction: PortDirectionEnum.Output,
      },
    })

    // Create first input port
    const inputPort1 = new StreamInputPort<string>({
      id: 'input1',
      name: 'String Input Port 1',
      kind: PortKindEnum.StreamInput,
      direction: PortDirectionEnum.Input,
      valueType: {
        id: 'stringType',
        name: 'String',
        kind: PortKindEnum.String,
        direction: PortDirectionEnum.Input,
      },
    })

    // Create second input port
    const inputPort2 = new StreamInputPort<string>({
      id: 'input2',
      name: 'String Input Port 2',
      kind: PortKindEnum.StreamInput,
      direction: PortDirectionEnum.Input,
      valueType: {
        id: 'stringType',
        name: 'String',
        kind: PortKindEnum.String,
        direction: PortDirectionEnum.Input,
      },
    })

    // Connect input ports to output port's channel
    inputPort1.setValue(outputPort.getValue())
    inputPort2.setValue(outputPort.getValue())

    // Prepare data to send
    const dataToSend = ['First', 'Second', 'Third']

    // Start receiving data on inputPort1
    const receivedData1: string[] = []
    const receiver1 = (async () => {
      for await (const data of inputPort1.receive()) {
        receivedData1.push(data)
      }
    })()

    // Start receiving data on inputPort2
    const receivedData2: string[] = []
    const receiver2 = (async () => {
      for await (const data of inputPort2.receive()) {
        receivedData2.push(data)
      }
    })()

    // Send data
    for (const item of dataToSend) {
      outputPort.send(item)
    }
    outputPort.close()

    // Wait for receivers
    await Promise.all([receiver1, receiver2])

    // Assertions
    expect(receivedData1).toEqual(dataToSend)
    expect(receivedData2).toEqual(dataToSend)
  })

  it('should receive data sent asynchronously with delays', async () => {
    // Create ports
    const outputPort = new StreamOutputPort<string>({
      id: 'output1',
      name: 'String Output Port',
      kind: PortKindEnum.StreamOutput,
      direction: PortDirectionEnum.Output,
      valueType: {
        id: 'stringType',
        name: 'String',
        kind: PortKindEnum.String,
        direction: PortDirectionEnum.Output,
      },
    })

    const inputPort = new StreamInputPort<string>({
      id: 'input1',
      name: 'String Input Port',
      kind: PortKindEnum.StreamInput,
      direction: PortDirectionEnum.Input,
      valueType: {
        id: 'stringType',
        name: 'String',
        kind: PortKindEnum.String,
        direction: PortDirectionEnum.Input,
      },
    })

    // Connect ports
    inputPort.setValue(outputPort.getValue())

    // Data to send
    const dataToSend = ['Async', 'Data', 'Test']

    // Start receiving data
    const receivedData: string[] = []
    const receiver = (async () => {
      for await (const data of inputPort.receive()) {
        receivedData.push(data)
      }
    })()

    // Function to simulate asynchronous sending with delays
    const sendDataWithDelay = async () => {
      for (const item of dataToSend) {
        await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
        outputPort.send(item)
      }
      outputPort.close()
    }

    // Start sending data
    await sendDataWithDelay()

    // Wait for receiver
    await receiver

    // Assertions
    expect(receivedData).toEqual(dataToSend)
  })

  it('should detect stream closure and stop receiving', async () => {
    // Create ports
    const outputPort = new StreamOutputPort<string>({
      id: 'output1',
      name: 'String Output Port',
      kind: PortKindEnum.StreamOutput,
      direction: PortDirectionEnum.Output,
      valueType: { id: 'stringType', name: 'String', kind: PortKindEnum.String, direction: PortDirectionEnum.Output },
    })

    const inputPort = new StreamInputPort<string>({
      id: 'input1',
      name: 'String Input Port',
      kind: PortKindEnum.StreamInput,
      direction: PortDirectionEnum.Input,
      valueType: { id: 'stringType', name: 'String', kind: PortKindEnum.String, direction: PortDirectionEnum.Input },
    })

    // Connect ports
    inputPort.setValue(outputPort.getValue())

    // Start receiving data
    const receivedData: string[] = []
    const receiver = (async () => {
      for await (const data of inputPort.receive()) {
        receivedData.push(data)
      }
      // After the stream is closed, execution reaches here
    })()

    // Send data and close stream
    outputPort.send('Test Data')
    outputPort.close()

    // Wait for receiver to finish
    await receiver

    // Assertions
    expect(receivedData).toEqual(['Test Data'])
  })

  it('should allow subscribers to join after data has been sent', async () => {
    // Create output port
    const outputPort = new StreamOutputPort<number>({
      id: 'output1',
      name: 'Number Output Port',
      kind: PortKindEnum.StreamOutput,
      direction: PortDirectionEnum.Output,
      valueType: { id: 'numberType', name: 'Number', kind: PortKindEnum.Number, direction: PortDirectionEnum.Output },
    })

    // Send data before subscriber joins
    const dataSentBefore = [1, 2, 3]
    for (const item of dataSentBefore) {
      outputPort.send(item)
    }

    // Create input port
    const inputPort = new StreamInputPort<number>({
      id: 'input1',
      name: 'Number Input Port',
      kind: PortKindEnum.StreamInput,
      direction: PortDirectionEnum.Input,
      valueType: { id: 'numberType', name: 'Number', kind: PortKindEnum.Number, direction: PortDirectionEnum.Input },
    })

    // Connect input port to output port's channel
    inputPort.setValue(outputPort.getValue())

    // Start receiving data
    const receivedData: number[] = []
    const receiver = (async () => {
      for await (const data of inputPort.receive()) {
        receivedData.push(data)
      }
    })()

    // Send more data
    const dataSentAfter = [4, 5]
    for (const item of dataSentAfter) {
      outputPort.send(item)
    }

    // Close the output port
    outputPort.close()

    // Wait for receiver to finish
    await receiver

    // All data should be received
    const allDataSent = [...dataSentBefore, ...dataSentAfter]
    expect(receivedData).toEqual(allDataSent)
  })

  it('should handle errors in receiver without affecting the output port', async () => {
    // Create ports
    const outputPort = new StreamOutputPort<string>({
      id: 'output1',
      name: 'String Output Port',
      kind: PortKindEnum.StreamOutput,
      direction: PortDirectionEnum.Output,
      valueType: { id: 'stringType', name: 'String', kind: PortKindEnum.String, direction: PortDirectionEnum.Output },
    })

    const inputPort = new StreamInputPort<string>({
      id: 'input1',
      name: 'String Input Port',
      kind: PortKindEnum.StreamInput,
      direction: PortDirectionEnum.Input,
      valueType: { id: 'stringType', name: 'String', kind: PortKindEnum.String, direction: PortDirectionEnum.Input },
    })

    // Connect ports
    inputPort.setValue(outputPort.getValue())

    // Start receiving data with intentional error
    const receivedData: string[] = []
    const receiver = (async () => {
      try {
        for await (const data of inputPort.receive()) {
          if (data === 'Error') {
            throw new Error('Test error in receiver')
          }
          receivedData.push(data)
        }
      } catch (error: any) {
        // Handle error locally
        // console.error('There was expected error in the receiver:', error.message, 'but the stream will continue.')
      }
    })()

    // Send data
    outputPort.send('First')
    outputPort.send('Error') // This will cause an error in the receiver
    outputPort.send('Last')
    outputPort.close()

    // Wait for receiver to finish
    await receiver

    // Assertions
    expect(receivedData).toEqual(['First'])
  })
})
