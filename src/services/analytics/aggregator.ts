/**
 * Analytics Data Aggregator Service
 *
 * Aggregates analytics data from various sources for the admin dashboard.
 * Provides methods for message volume, user activity, channel usage, and engagement metrics.
 */

import type {
  AnalyticsPeriod,
  AnalyticsGranularity,
  AnalyticsQueryOptions,
  AnalyticsSummary,
  MessageVolumeData,
  UserActivityData,
  ChannelUsageData,
  EngagementData,
} from '@/types/admin'
import type { UserRole } from '@/types/user'

/**
 * Calculate the date range for a given period.
 */
function getDateRangeForPeriod(period: AnalyticsPeriod): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()

  switch (period) {
    case '24h':
      start.setHours(start.getHours() - 24)
      break
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    case '30d':
      start.setDate(start.getDate() - 30)
      break
    case '90d':
      start.setDate(start.getDate() - 90)
      break
    case '1y':
      start.setFullYear(start.getFullYear() - 1)
      break
    case 'all':
      start.setFullYear(2020, 0, 1) // Arbitrary early date
      break
  }

  return { start, end }
}

/**
 * Get the appropriate granularity for a period.
 */
function getDefaultGranularity(period: AnalyticsPeriod): AnalyticsGranularity {
  switch (period) {
    case '24h':
      return 'hour'
    case '7d':
      return 'day'
    case '30d':
      return 'day'
    case '90d':
      return 'week'
    case '1y':
      return 'month'
    case 'all':
      return 'month'
  }
}

/**
 * Generate time buckets for a date range and granularity.
 */
function generateTimeBuckets(start: Date, end: Date, granularity: AnalyticsGranularity): Date[] {
  const buckets: Date[] = []
  const current = new Date(start)

  while (current <= end) {
    buckets.push(new Date(current))

    switch (granularity) {
      case 'hour':
        current.setHours(current.getHours() + 1)
        break
      case 'day':
        current.setDate(current.getDate() + 1)
        break
      case 'week':
        current.setDate(current.getDate() + 7)
        break
      case 'month':
        current.setMonth(current.getMonth() + 1)
        break
    }
  }

  return buckets
}

/**
 * Format a date label based on granularity.
 */
function formatDateLabel(date: Date, granularity: AnalyticsGranularity): string {
  switch (granularity) {
    case 'hour':
      return date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    case 'day':
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    case 'week':
      return `Week of ${date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`
    case 'month':
      return date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
  }
}

/**
 * Analytics Data Aggregator
 */
export class AnalyticsAggregator {
  private apiBaseUrl: string

  constructor(apiBaseUrl: string = '/api/admin/analytics') {
    this.apiBaseUrl = apiBaseUrl
  }

  /**
   * Fetch message volume data for a given period.
   */
  async getMessageVolume(options: AnalyticsQueryOptions): Promise<MessageVolumeData[]> {
    const { start, end } =
      options.startDate && options.endDate
        ? { start: options.startDate, end: options.endDate }
        : getDateRangeForPeriod(options.period)

    const granularity = options.granularity || getDefaultGranularity(options.period)
    const buckets = generateTimeBuckets(start, end, granularity)

    // In production, this would fetch from the API
    // For now, generate realistic mock data
    return buckets.map((timestamp) => {
      const baseMessages = Math.floor(Math.random() * 300) + 100
      const publicRatio = 0.6 + Math.random() * 0.2
      const privateRatio = 0.2 + Math.random() * 0.1
      const directRatio = 1 - publicRatio - privateRatio

      return {
        timestamp,
        label: formatDateLabel(timestamp, granularity),
        totalMessages: baseMessages,
        publicMessages: Math.floor(baseMessages * publicRatio),
        privateMessages: Math.floor(baseMessages * privateRatio),
        directMessages: Math.floor(baseMessages * directRatio),
        messagesWithAttachments: Math.floor(baseMessages * (0.1 + Math.random() * 0.1)),
        messagesWithReactions: Math.floor(baseMessages * (0.3 + Math.random() * 0.2)),
        threadReplies: Math.floor(baseMessages * (0.15 + Math.random() * 0.1)),
      }
    })
  }

  /**
   * Fetch user activity data for a given period.
   */
  async getUserActivity(options: AnalyticsQueryOptions): Promise<UserActivityData[]> {
    const { start, end } =
      options.startDate && options.endDate
        ? { start: options.startDate, end: options.endDate }
        : getDateRangeForPeriod(options.period)

    const granularity = options.granularity || getDefaultGranularity(options.period)
    const buckets = generateTimeBuckets(start, end, granularity)

    // Generate realistic mock data
    return buckets.map((timestamp) => {
      const baseActive = Math.floor(Math.random() * 80) + 40
      const newUsers = Math.floor(Math.random() * 15) + 2
      const returningUsers = baseActive - Math.floor(baseActive * 0.1)

      return {
        timestamp,
        label: formatDateLabel(timestamp, granularity),
        activeUsers: baseActive,
        newUsers,
        returningUsers,
        usersByRole: {
          owner: 1,
          admin: Math.floor(Math.random() * 3) + 1,
          moderator: Math.floor(Math.random() * 8) + 2,
          member: baseActive - 15,
          guest: Math.floor(Math.random() * 10) + 2,
        },
        peakConcurrentUsers: Math.floor(baseActive * (0.4 + Math.random() * 0.3)),
        avgSessionDuration: Math.floor(Math.random() * 45) + 15,
      }
    })
  }

  /**
   * Fetch channel usage data.
   */
  async getChannelUsage(options: AnalyticsQueryOptions): Promise<ChannelUsageData[]> {
    const { start, end } =
      options.startDate && options.endDate
        ? { start: options.startDate, end: options.endDate }
        : getDateRangeForPeriod(options.period)

    // Mock channel data
    const mockChannels = [
      { id: 'ch-1', name: 'general', type: 'public' as const },
      { id: 'ch-2', name: 'random', type: 'public' as const },
      { id: 'ch-3', name: 'engineering', type: 'public' as const },
      { id: 'ch-4', name: 'design', type: 'private' as const },
      { id: 'ch-5', name: 'announcements', type: 'public' as const },
      { id: 'ch-6', name: 'help-desk', type: 'public' as const },
      { id: 'ch-7', name: 'leadership', type: 'private' as const },
      { id: 'ch-8', name: 'watercooler', type: 'public' as const },
    ]

    const filteredChannels = options.channelIds
      ? mockChannels.filter((c) => options.channelIds!.includes(c.id))
      : mockChannels

    return filteredChannels
      .map((channel) => {
        const messageCount = Math.floor(Math.random() * 2000) + 100
        const activeUsers = Math.floor(Math.random() * 50) + 10
        const memberCount = activeUsers + Math.floor(Math.random() * 30) + 10

        return {
          timestamp: start,
          label: channel.name,
          channelId: channel.id,
          channelName: channel.name,
          channelType: channel.type,
          messageCount,
          activeUsers,
          reactionCount: Math.floor(messageCount * (0.2 + Math.random() * 0.3)),
          threadCount: Math.floor(messageCount * (0.05 + Math.random() * 0.1)),
          memberCount,
          growthPercent: Math.floor(Math.random() * 40) - 10,
        }
      })
      .sort((a, b) => b.messageCount - a.messageCount)
  }

  /**
   * Fetch engagement metrics data.
   */
  async getEngagementMetrics(options: AnalyticsQueryOptions): Promise<EngagementData[]> {
    const { start, end } =
      options.startDate && options.endDate
        ? { start: options.startDate, end: options.endDate }
        : getDateRangeForPeriod(options.period)

    const granularity = options.granularity || getDefaultGranularity(options.period)
    const buckets = generateTimeBuckets(start, end, granularity)

    const topEmojis = [
      { emoji: '👍', count: Math.floor(Math.random() * 500) + 200 },
      { emoji: '❤️', count: Math.floor(Math.random() * 400) + 150 },
      { emoji: '😂', count: Math.floor(Math.random() * 350) + 100 },
      { emoji: '🎉', count: Math.floor(Math.random() * 200) + 50 },
      { emoji: '👀', count: Math.floor(Math.random() * 150) + 30 },
    ].sort((a, b) => b.count - a.count)

    return buckets.map((timestamp) => {
      const baseEngagement = Math.floor(Math.random() * 60) + 40

      return {
        timestamp,
        label: formatDateLabel(timestamp, granularity),
        totalReactions: Math.floor(Math.random() * 800) + 200,
        totalThreads: Math.floor(Math.random() * 50) + 10,
        totalMentions: Math.floor(Math.random() * 200) + 50,
        messagesPerUser: Math.floor(Math.random() * 20) + 5,
        avgResponseTime: Math.floor(Math.random() * 180) + 30,
        engagementScore: baseEngagement,
        topEmojis,
        peakHours: [9, 10, 11, 14, 15, 16],
      }
    })
  }

  /**
   * Get aggregated analytics summary.
   */
  async getSummary(period: AnalyticsPeriod): Promise<AnalyticsSummary> {
    const { start, end } = getDateRangeForPeriod(period)

    // Calculate previous period for comparison
    const periodDuration = end.getTime() - start.getTime()
    const prevStart = new Date(start.getTime() - periodDuration)
    const prevEnd = new Date(start)

    // Mock summary data
    const totalMessages = Math.floor(Math.random() * 10000) + 5000
    const prevMessages = Math.floor(Math.random() * 10000) + 4500
    const messageChange = totalMessages - prevMessages
    const messageChangePercent = Math.round((messageChange / prevMessages) * 100)

    const totalUsers = Math.floor(Math.random() * 200) + 100
    const activeUsers = Math.floor(totalUsers * (0.6 + Math.random() * 0.2))
    const newUsers = Math.floor(Math.random() * 30) + 5
    const prevUsers = totalUsers - newUsers - Math.floor(Math.random() * 10)
    const userChange = totalUsers - prevUsers
    const userChangePercent = Math.round((userChange / prevUsers) * 100)

    return {
      period,
      startDate: start,
      endDate: end,
      messages: {
        total: totalMessages,
        change: messageChange,
        changePercent: messageChangePercent,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        change: userChange,
        changePercent: userChangePercent,
      },
      channels: {
        total: Math.floor(Math.random() * 20) + 10,
        active: Math.floor(Math.random() * 15) + 8,
        new: Math.floor(Math.random() * 3),
      },
      engagement: {
        score: Math.floor(Math.random() * 30) + 60,
        reactions: Math.floor(Math.random() * 2000) + 1000,
        threads: Math.floor(Math.random() * 200) + 50,
        avgResponseTime: Math.floor(Math.random() * 120) + 30,
      },
    }
  }

  /**
   * Get peak activity hours.
   */
  async getPeakHours(period: AnalyticsPeriod): Promise<Array<{ hour: number; count: number }>> {
    // Generate hourly activity data
    return Array.from({ length: 24 }, (_, hour) => {
      // Simulate typical work-hours pattern
      let baseCount = 50
      if (hour >= 9 && hour <= 17) {
        baseCount = 200 + Math.floor(Math.random() * 150)
      } else if (hour >= 18 && hour <= 22) {
        baseCount = 100 + Math.floor(Math.random() * 80)
      } else {
        baseCount = 20 + Math.floor(Math.random() * 30)
      }

      return {
        hour,
        count: baseCount,
      }
    })
  }

  /**
   * Get role distribution.
   */
  async getRoleDistribution(): Promise<
    Array<{ role: UserRole; count: number; percentage: number }>
  > {
    const distribution = [
      { role: 'owner' as UserRole, count: 1 },
      { role: 'admin' as UserRole, count: 3 + Math.floor(Math.random() * 2) },
      { role: 'moderator' as UserRole, count: 8 + Math.floor(Math.random() * 5) },
      { role: 'member' as UserRole, count: 120 + Math.floor(Math.random() * 50) },
      { role: 'guest' as UserRole, count: 10 + Math.floor(Math.random() * 10) },
    ]

    const total = distribution.reduce((sum, d) => sum + d.count, 0)

    return distribution.map((d) => ({
      ...d,
      percentage: Math.round((d.count / total) * 100),
    }))
  }

  /**
   * Get top contributors.
   */
  async getTopContributors(
    period: AnalyticsPeriod,
    limit: number = 10
  ): Promise<
    Array<{
      userId: string
      username: string
      displayName: string
      avatarUrl?: string
      messageCount: number
      reactionCount: number
      threadCount: number
    }>
  > {
    // Mock top contributors
    const mockUsers = [
      { userId: 'u-1', username: 'alice', displayName: 'Alice Johnson', avatarUrl: undefined },
      { userId: 'u-2', username: 'bob', displayName: 'Bob Smith', avatarUrl: undefined },
      { userId: 'u-3', username: 'charlie', displayName: 'Charlie Brown', avatarUrl: undefined },
      { userId: 'u-4', username: 'diana', displayName: 'Diana Ross', avatarUrl: undefined },
      { userId: 'u-5', username: 'eve', displayName: 'Eve Wilson', avatarUrl: undefined },
      { userId: 'u-6', username: 'frank', displayName: 'Frank Miller', avatarUrl: undefined },
      { userId: 'u-7', username: 'grace', displayName: 'Grace Lee', avatarUrl: undefined },
      { userId: 'u-8', username: 'henry', displayName: 'Henry Taylor', avatarUrl: undefined },
      { userId: 'u-9', username: 'iris', displayName: 'Iris Chen', avatarUrl: undefined },
      { userId: 'u-10', username: 'jack', displayName: 'Jack Davis', avatarUrl: undefined },
    ]

    return mockUsers.slice(0, limit).map((user, index) => ({
      ...user,
      messageCount: Math.floor(500 / (index + 1) + Math.random() * 50),
      reactionCount: Math.floor(200 / (index + 1) + Math.random() * 30),
      threadCount: Math.floor(50 / (index + 1) + Math.random() * 10),
    }))
  }

  /**
   * Export analytics data to various formats.
   */
  async exportData(
    dataType: 'messages' | 'users' | 'channels' | 'engagement',
    options: AnalyticsQueryOptions,
    format: 'json' | 'csv'
  ): Promise<Blob> {
    let data: unknown[]

    switch (dataType) {
      case 'messages':
        data = await this.getMessageVolume(options)
        break
      case 'users':
        data = await this.getUserActivity(options)
        break
      case 'channels':
        data = await this.getChannelUsage(options)
        break
      case 'engagement':
        data = await this.getEngagementMetrics(options)
        break
    }

    if (format === 'json') {
      return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    }

    // Convert to CSV
    if (data.length === 0) {
      return new Blob([''], { type: 'text/csv' })
    }

    const headers = Object.keys(data[0] as object)
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = (row as Record<string, unknown>)[header]
            if (value instanceof Date) {
              return value.toISOString()
            }
            if (typeof value === 'object') {
              return JSON.stringify(value)
            }
            return String(value)
          })
          .join(',')
      ),
    ]

    return new Blob([csvRows.join('\n')], { type: 'text/csv' })
  }
}

// Singleton instance
let aggregatorInstance: AnalyticsAggregator | null = null

/**
 * Get the analytics aggregator instance.
 */
export function getAnalyticsAggregator(): AnalyticsAggregator {
  if (!aggregatorInstance) {
    aggregatorInstance = new AnalyticsAggregator()
  }
  return aggregatorInstance
}

export default AnalyticsAggregator
