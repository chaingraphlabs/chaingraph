import { EventEmitter } from 'node:events'

class TimeEmitterService {
  private eventEmitter: EventEmitter
  private interval: NodeJS.Timer | null = null

  constructor() {
    this.eventEmitter = new EventEmitter()
  }

  start() {
    if (this.interval) {
      return
    }

    this.interval = setInterval(() => {
      const time = new Date()
      this.eventEmitter.emit('time-update', time)
    }, 1000)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
      this.eventEmitter.removeAllListeners()
    }
  }

  subscribe(listener: (time: Date) => void): () => void {
    this.eventEmitter.on('time-update', listener)
    return () => {
      this.eventEmitter.off('time-update', listener)
    }
  }
}

// Singleton instance
export const timeEmitter = new TimeEmitterService()
