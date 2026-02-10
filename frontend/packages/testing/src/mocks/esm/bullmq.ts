/**
 * BullMQ Mock for Jest Tests
 *
 * Mocks the bullmq package for testing queue operations.
 *
 * @module @nself-chat/testing/mocks/esm/bullmq
 */

/**
 * Mock Queue class
 */
export class Queue {
  name: string
  opts: any

  constructor(name: string, opts?: any) {
    this.name = name
    this.opts = opts
  }

  add = jest.fn(async (_jobName: string, data: any, _opts?: any) => {
    return {
      id: `job-${Date.now()}`,
      name: _jobName,
      data,
      opts: _opts,
      progress: 0,
      returnvalue: null,
      attemptsMade: 0,
      timestamp: Date.now(),
    }
  })

  addBulk = jest.fn(async (jobs: any[]) => {
    return jobs.map((job, i) => ({
      id: `job-bulk-${i}-${Date.now()}`,
      name: job.name,
      data: job.data,
      opts: job.opts,
    }))
  })

  pause = jest.fn(async () => {})
  resume = jest.fn(async () => {})
  close = jest.fn(async () => {})
  obliterate = jest.fn(async () => {})

  getJob = jest.fn(async (jobId: string) => ({
    id: jobId,
    data: {},
    progress: 0,
  }))

  getJobs = jest.fn(async () => [])
  getJobCounts = jest.fn(async () => ({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
  }))
}

/**
 * Mock Worker class
 */
export class Worker {
  name: string
  processor: any
  opts: any

  constructor(name: string, processor: any, opts?: any) {
    this.name = name
    this.processor = processor
    this.opts = opts
  }

  on = jest.fn((event: string, handler: any) => {
    return this
  })

  off = jest.fn((event: string, handler: any) => {
    return this
  })

  close = jest.fn(async () => {})
  pause = jest.fn(async () => {})
  resume = jest.fn(async () => {})
}

/**
 * Mock QueueScheduler class
 */
export class QueueScheduler {
  name: string
  opts: any

  constructor(name: string, opts?: any) {
    this.name = name
    this.opts = opts
  }

  close = jest.fn(async () => {})
}

/**
 * Mock QueueEvents class
 */
export class QueueEvents {
  name: string
  opts: any

  constructor(name: string, opts?: any) {
    this.name = name
    this.opts = opts
  }

  on = jest.fn((event: string, handler: any) => {
    return this
  })

  off = jest.fn((event: string, handler: any) => {
    return this
  })

  close = jest.fn(async () => {})
}

/**
 * Mock FlowProducer class
 */
export class FlowProducer {
  opts: any

  constructor(opts?: any) {
    this.opts = opts
  }

  add = jest.fn(async (flow: any) => ({
    job: { id: `flow-${Date.now()}`, data: flow },
    children: [],
  }))

  close = jest.fn(async () => {})
}

export default {
  Queue,
  Worker,
  QueueScheduler,
  QueueEvents,
  FlowProducer,
}
