/**
 * Shortcut Manager
 *
 * Central manager for keyboard shortcuts with conflict detection,
 * priority handling, and scope management.
 */

import { ShortcutKey, SHORTCUTS, ShortcutDefinition } from '@/lib/keyboard/shortcuts'
import { matchesShortcut, shortcutsConflict } from '@/lib/keyboard/shortcut-utils'

import { logger } from '@/lib/logger'

// ============================================================================
// Types
// ============================================================================

export type ShortcutHandler = (event: KeyboardEvent) => void | boolean

export interface RegisteredShortcut {
  /** Unique identifier */
  id: string
  /** Key combination (e.g., 'mod+k') */
  key: string
  /** Handler function */
  handler: ShortcutHandler
  /** Priority (higher executes first) */
  priority?: number
  /** Active scopes */
  scopes?: string[]
  /** Whether to prevent default */
  preventDefault?: boolean
  /** Whether to stop propagation */
  stopPropagation?: boolean
  /** Whether enabled */
  enabled?: boolean
  /** Description */
  description?: string
}

export interface ShortcutContext {
  /** Current active scopes */
  activeScopes: Set<string>
  /** Whether input is focused */
  isInputFocused: boolean
  /** Current modal/overlay */
  activeModal?: string | null
  /** Additional context data */
  data?: Record<string, unknown>
}

export interface ShortcutManagerOptions {
  /** Whether to enable by default */
  enabled?: boolean
  /** Whether to ignore when input focused */
  ignoreInputs?: boolean
  /** Global scopes always active */
  globalScopes?: string[]
}

// ============================================================================
// Shortcut Manager Class
// ============================================================================

export class ShortcutManager {
  private shortcuts: Map<string, RegisteredShortcut> = new Map()
  private context: ShortcutContext
  private options: ShortcutManagerOptions
  private enabled: boolean = true
  private listeners: Set<EventListenerOrEventListenerObject> = new Set()

  constructor(options: ShortcutManagerOptions = {}) {
    this.options = {
      enabled: true,
      ignoreInputs: true,
      globalScopes: [],
      ...options,
    }

    this.context = {
      activeScopes: new Set(this.options.globalScopes || []),
      isInputFocused: false,
      activeModal: null,
    }

    this.enabled = this.options.enabled ?? true

    if (typeof window !== 'undefined') {
      this.attachListeners()
    }
  }

  // ============================================================================
  // Registration
  // ============================================================================

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: RegisteredShortcut): () => void {
    const existing = this.shortcuts.get(shortcut.id)
    if (existing) {
      logger.warn(`Shortcut ${shortcut.id} already registered, replacing...`)
    }

    this.shortcuts.set(shortcut.id, {
      priority: 0,
      enabled: true,
      ...shortcut,
    })

    // Return unregister function
    return () => this.unregister(shortcut.id)
  }

  /**
   * Unregister a shortcut
   */
  unregister(id: string): void {
    this.shortcuts.delete(id)
  }

  /**
   * Register multiple shortcuts at once
   */
  registerMultiple(shortcuts: RegisteredShortcut[]): () => void {
    const unregisterFns = shortcuts.map((shortcut) => this.register(shortcut))

    return () => {
      unregisterFns.forEach((fn) => fn())
    }
  }

  /**
   * Clear all registered shortcuts
   */
  clear(): void {
    this.shortcuts.clear()
  }

  // ============================================================================
  // Context Management
  // ============================================================================

  /**
   * Add a scope to the active context
   */
  addScope(scope: string): void {
    this.context.activeScopes.add(scope)
  }

  /**
   * Remove a scope from the active context
   */
  removeScope(scope: string): void {
    this.context.activeScopes.delete(scope)
  }

  /**
   * Set multiple scopes at once
   */
  setScopes(scopes: string[]): void {
    this.context.activeScopes = new Set([...(this.options.globalScopes || []), ...scopes])
  }

  /**
   * Clear all scopes (except global)
   */
  clearScopes(): void {
    this.context.activeScopes = new Set(this.options.globalScopes || [])
  }

  /**
   * Check if a scope is active
   */
  hasScope(scope: string): boolean {
    return this.context.activeScopes.has(scope)
  }

  /**
   * Update context data
   */
  updateContext(updates: Partial<ShortcutContext>): void {
    this.context = {
      ...this.context,
      ...updates,
      activeScopes: updates.activeScopes || this.context.activeScopes,
    }
  }

  /**
   * Get current context
   */
  getContext(): ShortcutContext {
    return { ...this.context }
  }

  // ============================================================================
  // Enable/Disable
  // ============================================================================

  /**
   * Enable or disable the manager globally
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Check if manager is enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Enable/disable a specific shortcut
   */
  setShortcutEnabled(id: string, enabled: boolean): void {
    const shortcut = this.shortcuts.get(id)
    if (shortcut) {
      shortcut.enabled = enabled
    }
  }

  // ============================================================================
  // Execution
  // ============================================================================

  /**
   * Handle keydown event
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled) return

    // Check if we should ignore this event
    if (this.shouldIgnoreEvent(event)) return

    // Get matching shortcuts sorted by priority
    const matches = this.getMatchingShortcuts(event)

    if (matches.length === 0) return

    // Execute in priority order
    for (const shortcut of matches) {
      if (!this.isShortcutValid(shortcut, event)) continue

      // Prevent default if configured
      if (shortcut.preventDefault) {
        event.preventDefault()
      }

      // Execute handler
      const result = shortcut.handler(event)

      // Stop propagation if configured or handler returns false
      if (shortcut.stopPropagation || result === false) {
        event.stopPropagation()
        break // Stop processing further shortcuts
      }
    }
  }

  /**
   * Get shortcuts that match the event
   */
  private getMatchingShortcuts(event: KeyboardEvent): RegisteredShortcut[] {
    const matches: RegisteredShortcut[] = []

    for (const shortcut of this.shortcuts.values()) {
      if (!shortcut.enabled) continue

      if (matchesShortcut(event, shortcut.key)) {
        matches.push(shortcut)
      }
    }

    // Sort by priority (higher first)
    return matches.sort((a, b) => (b.priority || 0) - (a.priority || 0))
  }

  /**
   * Check if a shortcut is valid in the current context
   */
  private isShortcutValid(shortcut: RegisteredShortcut, event: KeyboardEvent): boolean {
    // Check if shortcut requires specific scopes
    if (shortcut.scopes && shortcut.scopes.length > 0) {
      const hasRequiredScope = shortcut.scopes.some((scope) => this.context.activeScopes.has(scope))

      if (!hasRequiredScope) {
        return false
      }
    }

    return true
  }

  /**
   * Check if we should ignore this keyboard event
   */
  private shouldIgnoreEvent(event: KeyboardEvent): boolean {
    if (!this.options.ignoreInputs) return false

    const target = event.target as HTMLElement
    if (!target) return false

    const tagName = target.tagName.toLowerCase()
    const isContentEditable = target.isContentEditable

    return (
      isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select'
    )
  }

  // ============================================================================
  // Conflict Detection
  // ============================================================================

  /**
   * Detect conflicts between shortcuts
   */
  detectConflicts(): Array<{
    key: string
    shortcuts: RegisteredShortcut[]
  }> {
    const keyMap = new Map<string, RegisteredShortcut[]>()

    // Group shortcuts by key
    for (const shortcut of this.shortcuts.values()) {
      if (!keyMap.has(shortcut.key)) {
        keyMap.set(shortcut.key, [])
      }
      keyMap.get(shortcut.key)!.push(shortcut)
    }

    // Find conflicts (multiple shortcuts with same key)
    const conflicts: Array<{ key: string; shortcuts: RegisteredShortcut[] }> = []

    for (const [key, shortcuts] of keyMap) {
      if (shortcuts.length > 1) {
        // Check if they have overlapping scopes
        const hasOverlap = this.hasOverlappingScopes(shortcuts)
        if (hasOverlap) {
          conflicts.push({ key, shortcuts })
        }
      }
    }

    return conflicts
  }

  /**
   * Check if shortcuts have overlapping scopes
   */
  private hasOverlappingScopes(shortcuts: RegisteredShortcut[]): boolean {
    // If any shortcut has no scopes (global), it overlaps with everything
    if (shortcuts.some((s) => !s.scopes || s.scopes.length === 0)) {
      return true
    }

    // Check for scope overlap
    for (let i = 0; i < shortcuts.length; i++) {
      for (let j = i + 1; j < shortcuts.length; j++) {
        const scopesA = new Set(shortcuts[i].scopes || [])
        const scopesB = new Set(shortcuts[j].scopes || [])

        for (const scope of scopesA) {
          if (scopesB.has(scope)) {
            return true
          }
        }
      }
    }

    return false
  }

  // ============================================================================
  // Query
  // ============================================================================

  /**
   * Get all registered shortcuts
   */
  getAll(): RegisteredShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * Get a shortcut by ID
   */
  get(id: string): RegisteredShortcut | undefined {
    return this.shortcuts.get(id)
  }

  /**
   * Get shortcuts by scope
   */
  getByScope(scope: string): RegisteredShortcut[] {
    return this.getAll().filter(
      (s) => !s.scopes || s.scopes.length === 0 || s.scopes.includes(scope)
    )
  }

  /**
   * Get shortcuts by key
   */
  getByKey(key: string): RegisteredShortcut[] {
    return this.getAll().filter((s) => s.key === key)
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  /**
   * Attach keyboard event listeners
   */
  private attachListeners(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('keydown', this.handleKeyDown)

    // Track input focus
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      if (!target) return

      const tagName = target.tagName.toLowerCase()
      const isInput =
        target.isContentEditable ||
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select'

      this.context.isInputFocused = isInput
    }

    const handleFocusOut = () => {
      this.context.isInputFocused = false
    }

    window.addEventListener('focusin', handleFocusIn)
    window.addEventListener('focusout', handleFocusOut)

    this.listeners.add(handleFocusIn as EventListener)
    this.listeners.add(handleFocusOut as EventListener)
  }

  /**
   * Detach event listeners
   */
  destroy(): void {
    if (typeof window === 'undefined') return

    window.removeEventListener('keydown', this.handleKeyDown)

    for (const listener of this.listeners) {
      window.removeEventListener('focusin', listener as EventListener)
      window.removeEventListener('focusout', listener as EventListener)
    }

    this.listeners.clear()
    this.shortcuts.clear()
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalInstance: ShortcutManager | null = null

/**
 * Get the global shortcut manager instance
 */
export function getShortcutManager(): ShortcutManager {
  if (!globalInstance) {
    globalInstance = new ShortcutManager()
  }
  return globalInstance
}

/**
 * Create a new shortcut manager instance
 */
export function createShortcutManager(options?: ShortcutManagerOptions): ShortcutManager {
  return new ShortcutManager(options)
}

/**
 * Destroy the global instance
 */
export function destroyGlobalManager(): void {
  if (globalInstance) {
    globalInstance.destroy()
    globalInstance = null
  }
}
