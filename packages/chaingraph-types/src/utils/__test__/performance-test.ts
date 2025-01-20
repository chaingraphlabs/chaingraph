import { EventQueue } from '@chaingraph/types/utils/event-queue'

async function runPerformanceTest() {
  console.log('Starting EventQueue Performance Test\n')

  // Test parameters
  const EVENTS_COUNT = 1000000
  const SUBSCRIBERS_COUNT = 100
  const BATCH_SIZE = 1000

  const queue = new EventQueue<number>(10000)

  // Add subscribers
  console.log(`Adding ${SUBSCRIBERS_COUNT} subscribers...`)
  const startSubscribeTime = performance.now()

  const subscribers = Array.from({ length: SUBSCRIBERS_COUNT }, (_, i) => {
    return queue.subscribe(
      async (event) => {
        // Simulate some light processing
        await Promise.resolve()
      },
      (error) => {
        // Silent error handling for test
      },
    )
  })

  const subscribeTime = performance.now() - startSubscribeTime
  console.log(`Subscribe time: ${subscribeTime.toFixed(2)}ms\n`)

  // Test publishing
  console.log(`Publishing ${EVENTS_COUNT} events...`)
  const startPublishTime = performance.now()

  // Publish in batches to avoid memory issues
  for (let batch = 0; batch < EVENTS_COUNT / BATCH_SIZE; batch++) {
    const promises = []
    for (let i = 0; i < BATCH_SIZE; i++) {
      promises.push(queue.publish(batch * BATCH_SIZE + i))
    }
    await Promise.all(promises)
  }

  const publishTime = performance.now() - startPublishTime
  console.log(`Publish time: ${publishTime.toFixed(2)}ms`)
  console.log(`Average time per event: ${(publishTime / EVENTS_COUNT).toFixed(3)}ms`)
  console.log(`Events per second: ${Math.floor(EVENTS_COUNT / (publishTime / 1000))}\n`)

  // Get final stats
  const stats = queue.getStats()
  console.log('Final queue stats:', stats)

  // Cleanup
  for (const unsubscribe of subscribers) {
    unsubscribe()
  }

  await queue.close()
}

runPerformanceTest().catch(console.error)
