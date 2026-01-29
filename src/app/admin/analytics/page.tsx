'use client'

import { useState, useMemo } from 'react'
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Hash,
  Clock,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { StatsCard, StatsGrid } from '@/components/admin/stats-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAdminAccess } from '@/lib/admin/use-admin'

// Mock data for demonstration
const generateMockData = (days: number) => {
  const data = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    data.push({
      date: date.toISOString().split('T')[0],
      users: Math.floor(Math.random() * 20) + 5,
      messages: Math.floor(Math.random() * 500) + 100,
      activeUsers: Math.floor(Math.random() * 50) + 20,
    })
  }

  return data
}

const mockPopularChannels = [
  { name: 'general', messages: 4521, members: 156, percentage: 100 },
  { name: 'random', messages: 3287, members: 142, percentage: 73 },
  { name: 'engineering', messages: 1856, members: 24, percentage: 41 },
  { name: 'design', messages: 743, members: 12, percentage: 16 },
  { name: 'announcements', messages: 89, members: 156, percentage: 2 },
]

const mockPeakHours = [
  { hour: '9 AM', messages: 450 },
  { hour: '10 AM', messages: 620 },
  { hour: '11 AM', messages: 580 },
  { hour: '12 PM', messages: 320 },
  { hour: '1 PM', messages: 280 },
  { hour: '2 PM', messages: 520 },
  { hour: '3 PM', messages: 680 },
  { hour: '4 PM', messages: 590 },
  { hour: '5 PM', messages: 410 },
  { hour: '6 PM', messages: 180 },
]

const mockRoleDistribution = [
  { role: 'Owner', count: 1, color: 'bg-yellow-500' },
  { role: 'Admin', count: 3, color: 'bg-red-500' },
  { role: 'Moderator', count: 8, color: 'bg-blue-500' },
  { role: 'Member', count: 136, color: 'bg-green-500' },
  { role: 'Guest', count: 8, color: 'bg-gray-500' },
]

export default function AnalyticsPage() {
  const { canViewAnalytics } = useAdminAccess()
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [isLoading, setIsLoading] = useState(false)

  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
  const chartData = useMemo(() => generateMockData(days), [days])

  // Calculate totals from mock data
  const totals = useMemo(() => {
    const totalUsers = chartData.reduce((sum, d) => sum + d.users, 0)
    const totalMessages = chartData.reduce((sum, d) => sum + d.messages, 0)
    const avgActiveUsers = Math.round(
      chartData.reduce((sum, d) => sum + d.activeUsers, 0) / chartData.length
    )
    return { totalUsers, totalMessages, avgActiveUsers }
  }, [chartData])

  const totalRoleCount = mockRoleDistribution.reduce((sum, r) => sum + r.count, 0)

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleExport = () => {
    // In production, this would generate a CSV/PDF report
    console.log('Exporting analytics data...')
  }

  if (!canViewAnalytics) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
          <p className="mt-2 text-muted-foreground">
            You do not have permission to view analytics.
          </p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Analytics
            </h1>
            <p className="text-muted-foreground">
              Track workspace activity, growth, and engagement
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <StatsGrid columns={4}>
          <StatsCard
            title="New Users"
            value={totals.totalUsers}
            description={`In the last ${days} days`}
            icon={<Users className="h-4 w-4" />}
            trend={{ value: 12, direction: 'up', label: 'vs previous period' }}
          />
          <StatsCard
            title="Messages Sent"
            value={totals.totalMessages.toLocaleString()}
            description={`In the last ${days} days`}
            icon={<MessageSquare className="h-4 w-4" />}
            trend={{ value: 8, direction: 'up', label: 'vs previous period' }}
          />
          <StatsCard
            title="Avg. Active Users"
            value={totals.avgActiveUsers}
            description="Daily average"
            icon={<TrendingUp className="h-4 w-4" />}
            trend={{ value: 5, direction: 'up', label: 'vs previous period' }}
          />
          <StatsCard
            title="Total Channels"
            value={24}
            description="Active channels"
            icon={<Hash className="h-4 w-4" />}
          />
        </StatsGrid>

        {/* Charts Section */}
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Activity Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Messages Over Time</CardTitle>
                  <CardDescription>
                    Daily message volume for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end gap-1">
                    {chartData.slice(-14).map((d, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t"
                        style={{
                          height: `${(d.messages / 600) * 100}%`,
                          minHeight: '4px',
                        }}
                        title={`${d.date}: ${d.messages} messages`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>{chartData[chartData.length - 14]?.date ?? ''}</span>
                    <span>{chartData[chartData.length - 1]?.date ?? ''}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Peak Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Peak Activity Hours</CardTitle>
                  <CardDescription>Average message volume by hour (UTC)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockPeakHours.map((hour) => {
                      const maxMessages = Math.max(...mockPeakHours.map((h) => h.messages))
                      return (
                        <div key={hour.hour} className="flex items-center gap-3">
                          <span className="w-16 text-sm text-muted-foreground">{hour.hour}</span>
                          <div className="flex-1">
                            <Progress value={(hour.messages / maxMessages) * 100} className="h-2" />
                          </div>
                          <span className="w-12 text-sm text-right">{hour.messages}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* User Growth Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">User Growth</CardTitle>
                  <CardDescription>New user signups over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end gap-1">
                    {chartData.slice(-14).map((d, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-green-500/20 hover:bg-green-500/40 transition-colors rounded-t"
                        style={{
                          height: `${(d.users / 25) * 100}%`,
                          minHeight: '4px',
                        }}
                        title={`${d.date}: ${d.users} new users`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>{chartData[chartData.length - 14]?.date ?? ''}</span>
                    <span>{chartData[chartData.length - 1]?.date ?? ''}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Role Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Role Distribution</CardTitle>
                  <CardDescription>Users by role type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRoleDistribution.map((role) => (
                      <div key={role.role} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${role.color}`} />
                            <span className="text-sm font-medium">{role.role}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {role.count} ({((role.count / totalRoleCount) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <Progress
                          value={(role.count / totalRoleCount) * 100}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Users Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Active Users</CardTitle>
                <CardDescription>Number of users active each day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-end gap-1">
                  {chartData.map((d, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-blue-500/20 hover:bg-blue-500/40 transition-colors rounded-t"
                      style={{
                        height: `${(d.activeUsers / 70) * 100}%`,
                        minHeight: '4px',
                      }}
                      title={`${d.date}: ${d.activeUsers} active users`}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>{chartData[0]?.date ?? ''}</span>
                  <span>{chartData[chartData.length - 1]?.date ?? ''}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Popular Channels */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Most Active Channels</CardTitle>
                  <CardDescription>Ranked by message volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockPopularChannels.map((channel, index) => (
                      <div key={channel.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <span className="font-medium">#{channel.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {channel.messages.toLocaleString()} messages
                          </span>
                        </div>
                        <Progress value={channel.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Channel Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Channel Statistics</CardTitle>
                  <CardDescription>Overview of channel activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Public Channels</p>
                        <p className="text-2xl font-bold">18</p>
                      </div>
                      <Hash className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Private Channels</p>
                        <p className="text-2xl font-bold">6</p>
                      </div>
                      <Hash className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg. Messages/Channel</p>
                        <p className="text-2xl font-bold">535</p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg. Members/Channel</p>
                        <p className="text-2xl font-bold">42</p>
                      </div>
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
