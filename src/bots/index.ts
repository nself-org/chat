/**
 * nchat Example Bots
 *
 * This module exports all example bots that demonstrate the Bot SDK capabilities.
 *
 * @example
 * ```typescript
 * import { createHelloBot, createPollBot, createReminderBot, createWelcomeBot } from '@/bots'
 *
 * // Create and start all bots
 * const helloBot = createHelloBot()
 * const pollBot = createPollBot()
 * const reminderBot = createReminderBot()
 * const welcomeBot = createWelcomeBot()
 * ```
 */

// Hello Bot
export { default as createHelloBot, manifest as helloBotManifest } from './hello-bot'
export {
  helloCommand,
  waveCommand,
  goodbyeCommand,
} from './hello-bot'

// Poll Bot
export { default as createPollBot, manifest as pollBotManifest } from './poll-bot'
export {
  pollCommand,
  quickpollCommand,
  pollResultsCommand,
  endPollCommand,
  createPoll,
  getPoll,
  registerVote,
  formatPollResults,
} from './poll-bot'

// Reminder Bot
export { default as createReminderBot, manifest as reminderBotManifest } from './reminder-bot'
export {
  remindCommand,
  remindersCommand,
  cancelReminderCommand,
  snoozeCommand,
  remindChannelCommand,
  createReminder,
  getReminder,
  getUserReminders,
  cancelReminder,
  snoozeReminder,
  scheduleReminder,
  buildReminderMessage,
  formatReminderList,
  getStats as getReminderStats,
} from './reminder-bot'

// Welcome Bot
export { default as createWelcomeBot, manifest as welcomeBotManifest } from './welcome-bot'
export {
  getChannelTemplate,
  setChannelTemplate,
  deleteChannelTemplate,
  getDefaultTemplate,
  processTemplate,
  PRESET_TEMPLATES,
  formatStats as formatWelcomeStats,
  handleUserJoin,
  handleUserLeave,
} from './welcome-bot'

/**
 * Register all example bots with the runtime
 */
export function registerAllBots() {
  const { getRuntime } = require('@/lib/bots')
  const runtime = getRuntime()

  const bots = [
    createHelloBot(),
    createPollBot(),
    createReminderBot(),
    createWelcomeBot(),
  ]

  runtime.startAll()

  return bots
}

/**
 * Bot manifests for documentation
 */
export const manifests = {
  hello: helloBotManifest,
  poll: pollBotManifest,
  reminder: reminderBotManifest,
  welcome: welcomeBotManifest,
}
