'use client'

import { useState } from 'react'
import {
  Shield,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { ModerationItem, ModerationItemSkeleton } from '@/components/admin/moderation-item'
import { BanUserModal } from '@/components/admin/ban-user-modal'
import { StatsCard, StatsGrid } from '@/components/admin/stats-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useModeration, useAdminStats, useAdminAccess } from '@/lib/admin/use-admin'
import { useAdminStore, ModerationReport, ReportStatus, ReportType, AdminUser } from '@/lib/admin/admin-store'

// Mock data for demonstration when not connected to backend
const mockReports: ModerationReport[] = [
  {
    id: '1',
    type: 'harassment',
    reason: 'User is sending threatening messages to multiple people in the channel.',
    status: 'pending',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    reporter: {
      id: 'r1',
      username: 'alice',
      displayName: 'Alice Johnson',
    },
    reportedUser: {
      id: 'u1',
      username: 'baduser',
      displayName: 'Bad User',
    },
    reportedMessage: {
      id: 'm1',
      content: 'This is an example of inappropriate content that was reported.',
      user: {
        id: 'u1',
        username: 'baduser',
        displayName: 'Bad User',
      },
      channel: {
        id: 'c1',
        name: 'general',
      },
    },
  },
  {
    id: '2',
    type: 'spam',
    reason: 'Posting promotional links repeatedly in multiple channels.',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reporter: {
      id: 'r2',
      username: 'bob',
      displayName: 'Bob Smith',
    },
    reportedUser: {
      id: 'u2',
      username: 'spammer',
      displayName: 'Spam Account',
    },
  },
  {
    id: '3',
    type: 'inappropriate',
    reason: 'Shared NSFW content in a work-related channel.',
    status: 'resolved',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    reporter: {
      id: 'r3',
      username: 'charlie',
      displayName: 'Charlie Brown',
    },
    reportedMessage: {
      id: 'm3',
      content: '[Content removed by moderator]',
      user: {
        id: 'u3',
        username: 'user123',
        displayName: 'User 123',
      },
      channel: {
        id: 'c2',
        name: 'engineering',
      },
    },
    moderator: {
      id: 'mod1',
      username: 'admin',
      displayName: 'Admin User',
    },
    resolution: 'Content deleted and user issued a warning.',
  },
]

export default function ModerationPage() {
  const { canModerate } = useAdminAccess()
  const [activeTab, setActiveTab] = useState<ReportStatus>('pending')
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [reports, setReports] = useState<ModerationReport[]>(mockReports)
  const [banModalOpen, setBanModalOpen] = useState(false)
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null)

  // Filter reports based on active tab and type filter
  const filteredReports = reports.filter((report) => {
    const matchesStatus =
      activeTab === 'pending'
        ? report.status === 'pending' || report.status === 'reviewed'
        : report.status === activeTab ||
          (activeTab === 'resolved' && report.status === 'dismissed')
    const matchesType = typeFilter === 'all' || report.type === typeFilter
    return matchesStatus && matchesType
  })

  const pendingCount = reports.filter(
    (r) => r.status === 'pending' || r.status === 'reviewed'
  ).length
  const resolvedCount = reports.filter(
    (r) => r.status === 'resolved' || r.status === 'dismissed'
  ).length

  const handleApprove = (report: ModerationReport) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === report.id
          ? {
              ...r,
              status: 'resolved' as ReportStatus,
              resolution: 'Report reviewed and approved.',
              resolvedAt: new Date().toISOString(),
            }
          : r
      )
    )
  }

  const handleDismiss = (report: ModerationReport) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === report.id
          ? {
              ...r,
              status: 'dismissed' as ReportStatus,
              resolution: 'Report dismissed - no action required.',
              resolvedAt: new Date().toISOString(),
            }
          : r
      )
    )
  }

  const handleDeleteContent = (report: ModerationReport) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === report.id
          ? {
              ...r,
              status: 'resolved' as ReportStatus,
              resolution: 'Content deleted.',
              resolvedAt: new Date().toISOString(),
            }
          : r
      )
    )
  }

  const handleWarnUser = (report: ModerationReport) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === report.id
          ? {
              ...r,
              status: 'resolved' as ReportStatus,
              resolution: 'User warned.',
              resolvedAt: new Date().toISOString(),
            }
          : r
      )
    )
  }

  const handleBanUser = (report: ModerationReport) => {
    if (report.reportedUser) {
      setBanTarget({
        id: report.reportedUser.id,
        username: report.reportedUser.username,
        displayName: report.reportedUser.displayName,
        email: `${report.reportedUser.username}@example.com`,
        avatarUrl: report.reportedUser.avatarUrl,
        role: { id: 'member', name: 'member', permissions: [] },
        isActive: true,
        isBanned: false,
        createdAt: new Date().toISOString(),
        messagesCount: 0,
        channelsCount: 0,
      })
      setBanModalOpen(true)
    }
  }

  const handleConfirmBan = async (
    userId: string,
    reason: string,
    duration?: string,
    notifyUser?: boolean
  ) => {
    // In production, this would call the API
    console.log('Banning user:', { userId, reason, duration, notifyUser })
    setBanModalOpen(false)
    setBanTarget(null)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    // Simulate refresh
    setTimeout(() => setIsLoading(false), 1000)
  }

  if (!canModerate) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
          <p className="mt-2 text-muted-foreground">
            You do not have permission to access the moderation queue.
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
              <Shield className="h-8 w-8" />
              Moderation Queue
            </h1>
            <p className="text-muted-foreground">
              Review and take action on reported content and users
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <StatsGrid columns={4}>
          <StatsCard
            title="Pending Reports"
            value={pendingCount}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatsCard
            title="Resolved Today"
            value={resolvedCount}
            icon={<CheckCircle className="h-4 w-4" />}
          />
          <StatsCard
            title="Harassment Reports"
            value={reports.filter((r) => r.type === 'harassment').length}
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          <StatsCard
            title="Spam Reports"
            value={reports.filter((r) => r.type === 'spam').length}
            icon={<AlertTriangle className="h-4 w-4" />}
          />
        </StatsGrid>

        {/* Tabs and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportStatus)}>
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                Pending
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-[20px] px-1">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as ReportType | 'all')}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="inappropriate">Inappropriate</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <ModerationItemSkeleton key={i} />)
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">All caught up!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {activeTab === 'pending'
                  ? 'No pending reports to review.'
                  : 'No resolved reports match your filters.'}
              </p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <ModerationItem
                key={report.id}
                report={report}
                onApprove={handleApprove}
                onDismiss={handleDismiss}
                onDeleteContent={handleDeleteContent}
                onWarnUser={handleWarnUser}
                onBanUser={handleBanUser}
              />
            ))
          )}
        </div>

        {/* Ban User Modal */}
        <BanUserModal
          isOpen={banModalOpen}
          onClose={() => {
            setBanModalOpen(false)
            setBanTarget(null)
          }}
          user={banTarget}
          onBan={handleConfirmBan}
        />
      </div>
    </AdminLayout>
  )
}
