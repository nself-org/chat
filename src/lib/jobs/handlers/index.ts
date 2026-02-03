/**
 * Job Handlers Index
 *
 * Centralized exports for all job handler implementations.
 * These handlers process background jobs in the nchat application.
 *
 * @module lib/jobs/handlers
 * @version 0.9.0
 */

// Scheduled Messages Handler
export {
  processScheduledMessageJob,
  processScheduledMessages,
  calculateRetryDelay,
  getBackoffConfig,
  cleanupOldScheduledMessages,
  registerScheduledMessageProcessor,
  MAX_RETRIES,
  BASE_RETRY_DELAY,
  BATCH_SIZE,
  type ProcessScheduledMessagesResult,
} from './scheduled-messages'
