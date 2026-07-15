import type { IsoDateTime } from '@/lib/ai-framework/types/base'
import { RuntimeError } from './errors'

export type LifecyclePhase = 'uninitialized' | 'initializing' | 'configuring' | 'starting' | 'ready' | 'stopping' | 'stopped' | 'error'

/**
 * Lifecycle Handler - Function called during lifecycle transitions
 */
export type LifecycleHandler = () => Promise<void> | void

/**
 * Lifecycle Event - Record of lifecycle transition
 */
export interface LifecycleEvent {
  phase: LifecyclePhase
  timestamp: IsoDateTime
  duration: number
  error?: string
}

/**
 * Lifecycle Manager - Orchestrates startup and shutdown sequences
 */
export class LifecycleManager {
  private phase: LifecyclePhase = 'uninitialized'
  private events: LifecycleEvent[] = []
  private handlers: Map<LifecyclePhase, LifecycleHandler[]> = new Map()
  private startTime: Date | null = null

  constructor() {
    // Initialize handler maps for each phase
    this.handlers.set('initializing', [])
    this.handlers.set('configuring', [])
    this.handlers.set('starting', [])
    this.handlers.set('ready', [])
    this.handlers.set('stopping', [])
  }

  /**
   * Register a handler for a lifecycle phase
   */
  registerHandler(phase: LifecyclePhase, handler: LifecycleHandler): void {
    const handlers = this.handlers.get(phase)
    if (handlers) {
      handlers.push(handler)
    }
  }

  /**
   * Get current lifecycle phase
   */
  getPhase(): LifecyclePhase {
    return this.phase
  }

  /**
   * Check if runtime is ready
   */
  isReady(): boolean {
    return this.phase === 'ready'
  }

  /**
   * Check if runtime is running
   */
  isRunning(): boolean {
    return this.phase === 'ready' || this.phase === 'starting'
  }

  /**
   * Initialize runtime
   */
  async initialize(): Promise<void> {
    if (this.phase !== 'uninitialized') {
      throw RuntimeError.config(
        `Cannot initialize: runtime is in ${this.phase} phase`
      )
    }

    const start = Date.now()
    await this.executePhase('initializing')
    this.recordEvent('initializing', start)
  }

  /**
   * Configure runtime
   */
  async configure(): Promise<void> {
    if (this.phase !== 'initializing' && this.phase !== 'configuring') {
      throw RuntimeError.config(
        `Cannot configure: runtime is in ${this.phase} phase`
      )
    }

    const start = Date.now()
    await this.executePhase('configuring')
    this.recordEvent('configuring', start)
  }

  /**
   * Start runtime
   */
  async start(): Promise<void> {
    if (this.phase !== 'configuring') {
      throw RuntimeError.config(
        `Cannot start: runtime is in ${this.phase} phase (expected configuring)`
      )
    }

    this.startTime = new Date()
    const start = Date.now()
    await this.executePhase('starting')
    this.recordEvent('starting', start)
  }

  /**
   * Mark runtime as ready
   */
  async ready(): Promise<void> {
    if (this.phase !== 'starting') {
      throw RuntimeError.config(
        `Cannot mark ready: runtime is in ${this.phase} phase (expected starting)`
      )
    }

    const start = Date.now()
    await this.executePhase('ready')
    this.recordEvent('ready', start)
  }

  /**
   * Stop runtime
   */
  async stop(): Promise<void> {
    if (!this.isRunning()) {
      throw RuntimeError.config(
        `Cannot stop: runtime is in ${this.phase} phase`
      )
    }

    const start = Date.now()
    await this.executePhase('stopping')
    this.recordEvent('stopping', start)
  }

  /**
   * Get uptime in milliseconds
   */
  getUptime(): number {
    if (!this.startTime) return 0
    return Date.now() - this.startTime.getTime()
  }

  /**
   * Get lifecycle events
   */
  getEvents(): LifecycleEvent[] {
    return [...this.events]
  }

  /**
   * Execute all handlers for a phase
   */
  private async executePhase(phase: LifecyclePhase): Promise<void> {
    const handlers = this.handlers.get(phase) || []

    for (const handler of handlers) {
      try {
        const result = handler()
        if (result instanceof Promise) {
          await result
        }
      } catch (error) {
        throw RuntimeError.config(
          `Handler failed during ${phase} phase: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    this.phase = phase
  }

  /**
   * Record a lifecycle event
   */
  private recordEvent(phase: LifecyclePhase, startMs: number): void {
    const duration = Date.now() - startMs
    this.events.push({
      phase,
      timestamp: new Date().toISOString(),
      duration,
    })
  }
}
