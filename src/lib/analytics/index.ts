/**
 * Analytics Library - Main entry point
 *
 * Re-exports all analytics utilities for easy importing
 */

// Types
export * from './analytics-types';

// Core modules
export { AnalyticsCollector, getAnalyticsCollector, setAnalyticsCollectorAuth } from './analytics-collector';
export { AnalyticsProcessor, getAnalyticsProcessor } from './analytics-processor';
export { AnalyticsAggregator, getAnalyticsAggregator, resetAnalyticsAggregator } from './analytics-aggregator';

// Export utilities
export {
  exportToCSV,
  exportToJSON,
  exportFullReport,
  formatMessageVolumeForExport,
  formatUserActivityForExport,
  formatChannelActivityForExport,
  formatReactionsForExport,
  formatFileUploadsForExport,
  formatSearchQueriesForExport,
  formatPeakHoursForExport,
  formatTopMessagesForExport,
  formatInactiveUsersForExport,
  formatUserGrowthForExport,
  formatSummaryForExport,
  createScheduledReportConfig,
  calculateNextRunTime,
  createReportHistory,
  analyticsExport,
} from './analytics-export';
