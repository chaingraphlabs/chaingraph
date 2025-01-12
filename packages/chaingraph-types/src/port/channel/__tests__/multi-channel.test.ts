import { describe, expect, it } from 'vitest'
import { MultiChannel } from '../multi-channel'

describe('multiChannel', () => {
  it('should allow multiple subscribers to receive all messages', async () => {
    const channel = new MultiChannel<string>()

    // Send messages before any subscribers
    channel.send('Message 1')
    channel.send('Message 2')

    // First subscriber
    const receivedBySubscriber1: string[] = []
    const subscriber1 = (async () => {
      for await (const message of channel) {
        receivedBySubscriber1.push(message)
      }
    })()

    // Send more messages
    channel.send('Message 3')

    // Second subscriber
    const receivedBySubscriber2: string[] = []
    const subscriber2 = (async () => {
      for await (const message of channel) {
        receivedBySubscriber2.push(message)
      }
    })()

    // Send final message and close the channel
    channel.send('Message 4')
    channel.close()

    // Wait for subscribers to finish
    await Promise.all([subscriber1, subscriber2])

    // Both subscribers should have received all messages
    expect(receivedBySubscriber1).toEqual([
      'Message 1',
      'Message 2',
      'Message 3',
      'Message 4',
    ])

    expect(receivedBySubscriber2).toEqual([
      'Message 1',
      'Message 2',
      'Message 3',
      'Message 4',
    ])

    // Check that subscribers have been removed
    expect(channel.getSubscriberCount()).toBe(0)
  })

  it('should correctly remove subscribers when they finish', async () => {
    const channel = new MultiChannel<string>()

    // First subscriber
    const subscriber1 = (async () => {
      for await (const message of channel) {
        // Do nothing
      }
    })()

    // Second subscriber
    const subscriber2 = (async () => {
      for await (const message of channel) {
        // Do nothing
      }
    })()

    // Close the channel
    channel.close()

    // Wait for subscribers to finish
    await Promise.all([subscriber1, subscriber2])

    // Subscribers should be removed from the channel's subscriber set
    expect(channel.getSubscriberCount()).toBe(0) // Access private property using bracket notation
  })

  it('should allow subscribers to receive messages sent after subscription', async () => {
    const channel = new MultiChannel<string>()

    // Subscriber
    const received: string[] = []
    const subscriber = (async () => {
      for await (const message of channel) {
        received.push(message)
        if (message === 'Stop') {
          break
        }
      }
    })()

    // Send messages
    channel.send('Hello')
    channel.send('World')
    channel.send('Stop')

    // Wait for subscriber to finish
    await subscriber

    // Subscriber should have received messages until 'Stop'
    expect(received).toEqual(['Hello', 'World', 'Stop'])
  })

  it('should handle multiple subscribers with different completion times', async () => {
    const channel = new MultiChannel<number>()

    // First subscriber, reads all messages
    const received1: number[] = []
    const subscriber1 = (async () => {
      for await (const value of channel) {
        received1.push(value)
      }
    })()

    // Second subscriber, stops after first two messages
    const received2: number[] = []
    const subscriber2 = (async () => {
      for await (const value of channel) {
        received2.push(value)
        if (received2.length === 2) {
          break
        }
      }
    })()

    // Send messages
    channel.send(1)
    channel.send(2)
    channel.send(3)
    channel.send(4)

    // Close the channel
    channel.close()

    // Wait for subscribers
    await subscriber1
    await subscriber2

    // First subscriber should receive all messages
    expect(received1).toEqual([1, 2, 3, 4])

    // Second subscriber should receive first two messages
    expect(received2).toEqual([1, 2])

    expect(channel.getSubscriberCount()).toBe(0)
  })

  it('should handle subscriber errors without affecting others', async () => {
    const channel = new MultiChannel<number>()

    // Subscriber that throws an error
    const subscriber1 = (async () => {
      try {
        for await (const value of channel) {
          if (value === 2) {
            throw new Error('Test error')
          }
        }
      } catch (error) {
        // Handle error locally
      }
    })()

    // Second subscriber
    const received: number[] = []
    const subscriber2 = (async () => {
      for await (const value of channel) {
        received.push(value)
      }
    })()

    // Send messages
    channel.send(1)
    channel.send(2)
    channel.send(3)
    channel.close()

    // Wait for subscribers
    await Promise.all([subscriber1, subscriber2])

    // Second subscriber should have received all messages
    expect(received).toEqual([1, 2, 3])
  })

  it('should handle channels with no messages', async () => {
    const channel = new MultiChannel<string>()

    // Close the channel without sending any messages
    channel.close()

    // Subscriber
    const received: string[] = []
    for await (const message of channel) {
      received.push(message)
    }

    // Subscriber should receive no messages
    expect(received).toEqual([])
  })

  it('should allow subscribers to join after channel closure', async () => {
    const channel = new MultiChannel<string>()

    // Send messages and close the channel
    channel.send('Initial')
    channel.close()

    // Subscriber joins after closure
    const received: string[] = []
    for await (const message of channel) {
      received.push(message)
    }

    // Subscriber should receive all messages
    expect(received).toEqual(['Initial'])
  })

  it('should handle subscriber closing before reading any messages', async () => {
    const channel = new MultiChannel<number>()

    // Send messages
    channel.send(1)
    channel.send(2)

    // Subscriber closes immediately
    const subscriber = channel[Symbol.asyncIterator]()
    if (subscriber.return) {
      await subscriber.return()
    } else {
      throw new Error('Subscriber does not implement return method')
    }

    // Ensure subscriber is removed
    expect(channel.getSubscriberCount()).toBe(0)
  })

  it('should handle high volume of messages', async () => {
    const channel = new MultiChannel<number>()
    const totalMessages = 10000
    const received: number[] = []

    // Subscriber
    const subscriber = (async () => {
      for await (const value of channel) {
        received.push(value)
      }
    })()

    // Send messages
    for (let i = 0; i < totalMessages; i++) {
      channel.send(i)
    }
    channel.close()

    // Wait for subscriber to finish
    await subscriber

    // Verify all messages were received
    expect(received.length).toBe(totalMessages)
    expect(received[0]).toBe(0)
    expect(received[totalMessages - 1]).toBe(totalMessages - 1)
  })

  it('should allow subscriber to unsubscribe before completion', async () => {
    const channel = new MultiChannel<number>()

    const subscriber = (async () => {
      const iterator = channel[Symbol.asyncIterator]()
      for (let i = 0; i < 3; i++) {
        const result = await iterator.next()
        // Do something with result.value
      }
      // Manually unsubscribe
      if (iterator.return) {
        await iterator.return()
      } else {
        throw new Error('Iterator does not implement return method')
      }
    })()

    // Send messages
    channel.send(1)
    channel.send(2)
    channel.send(3)
    channel.send(4)

    // Close the channel
    channel.close()

    // Wait for subscriber
    await subscriber

    // Subscriber should be removed
    expect(channel.getSubscriberCount()).toBe(0)
  })

  it('should handle channel closure during subscriber wait', async () => {
    const channel = new MultiChannel<number>()

    // Subscriber
    const received: number[] = []
    const subscriber = (async () => {
      for await (const value of channel) {
        received.push(value)
      }
    })()

    // Send some messages
    channel.send(1)
    channel.send(2)

    // Close the channel while subscriber is waiting
    channel.close()

    // Wait for subscriber
    await subscriber

    // Subscriber should have received the messages and exited gracefully
    expect(received).toEqual([1, 2])
    expect(channel.getSubscriberCount()).toBe(0)
  })

  it('should handle concurrent sends and subscriber additions', async () => {
    const channel = new MultiChannel<number>()

    const received1: number[] = []
    const subscriber1 = (async () => {
      for await (const value of channel) {
        received1.push(value)
      }
    })()

    // Variable to hold received messages from subscriber2
    const received2: number[] = []
    let subscriber2Promise: Promise<void> | null = null

    // Concurrently send messages and add subscribers
    const sending = (async () => {
      for (let i = 0; i < 100; i++) {
        channel.send(i)
        if (i === 50) {
          // Add another subscriber
          subscriber2Promise = (async () => {
            for await (const value of channel) {
              received2.push(value)
            }
          })()
          // Do not await here; let subscriber2 run concurrently
        }
      }
      channel.close()
    })()

    // Wait for sending and subscriber1 to complete
    await Promise.all([sending, subscriber1])

    // Wait for subscriber2 to complete
    if (subscriber2Promise) {
      await subscriber2Promise

      // After completion, verify received data
      expect(received2.length).toBeGreaterThan(50)
      expect(received2[0]).toBe(0) // Should receive all messages
    } else {
      throw new Error('subscriber2 was not created')
    }

    // Verify first subscriber received all messages
    expect(received1.length).toBe(100)
  })
})
