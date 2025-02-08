/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

export class Semaphore {
  private tasks: Array<() => void> = []
  private currentCount: number = 0
  private readonly maxConcurrency: number

  constructor(maxConcurrency: number) {
    this.maxConcurrency = maxConcurrency
  }

  async acquire(): Promise<void> {
    if (this.currentCount < this.maxConcurrency) {
      this.currentCount++
      return
    }

    return new Promise<void>((resolve) => {
      this.tasks.push(() => {
        this.currentCount++
        resolve()
      })
    })
  }

  release(): void {
    this.currentCount--
    if (this.tasks.length > 0 && this.currentCount < this.maxConcurrency) {
      const nextTask = this.tasks.shift()
      if (nextTask) {
        nextTask()
      }
    }
  }
}
