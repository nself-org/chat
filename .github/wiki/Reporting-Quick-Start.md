# Reporting System - Quick Start Guide

Get the Reporting & Flagging System up and running in 5 minutes.

## 1. Add Report Button to Messages

Add a report option to your message component:

```tsx
// src/components/chat/MessageActions.tsx (or wherever your message actions are)
import { useState } from 'react'
import { ReportModal } from '@/components/moderation'
import { useAuth } from '@/contexts/auth-context'
import { Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MessageActions({ message }) {
  const [showReport, setShowReport] = useState(false)
  const { user } = useAuth()

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setShowReport(true)}>
        <Flag className="mr-2 h-4 w-4" />
        Report
      </Button>

      <ReportModal
        open={showReport}
        onOpenChange={setShowReport}
        target={{
          type: 'message',
          id: message.id,
          name: `Message from ${message.user.displayName}`,
          content: message.content,
          channelId: message.channelId,
          channelName: message.channel.name,
          createdAt: message.createdAt,
          userId: message.userId,
        }}
        reporterId={user?.id || ''}
        reporterName={user?.displayName}
        onSubmit={(reportId) => {
          console.log('Report submitted:', reportId)
          // Optional: Show toast notification
        }}
      />
    </>
  )
}
```

## 2. Add Report Button to User Profiles

```tsx
// src/components/user/UserProfileActions.tsx
import { useState } from 'react'
import { ReportModal } from '@/components/moderation'
import { useAuth } from '@/contexts/auth-context'

export function UserProfileActions({ user }) {
  const [showReport, setShowReport] = useState(false)
  const { user: currentUser } = useAuth()

  return (
    <>
      <button onClick={() => setShowReport(true)}>Report User</button>

      <ReportModal
        open={showReport}
        onOpenChange={setShowReport}
        target={{
          type: 'user',
          id: user.id,
          name: user.displayName,
          username: user.username,
          avatarUrl: user.avatarUrl,
        }}
        reporterId={currentUser?.id || ''}
        reporterName={currentUser?.displayName}
        onSubmit={(reportId) => {
          console.log('User reported:', reportId)
        }}
      />
    </>
  )
}
```

## 3. Create Moderation Dashboard Page

```tsx
// src/app/admin/moderation/reports/page.tsx
'use client'

import { ReportQueue } from '@/components/admin/moderation/ReportQueue'
import { useAuth } from '@/contexts/auth-context'

export default function ModerationReportsPage() {
  const { user } = useAuth()

  // Handle moderation actions
  const handleAction = async (reportId: string, action: string, notes?: string) => {
    const response = await fetch('/api/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId,
        moderatorId: user?.id,
        moderatorName: user?.displayName,
        action,
        notes,
      }),
    })

    if (!response.ok) {
      throw new Error('Action failed')
    }
  }

  // Fetch reports with filters
  const handleFetchReports = async (filter: any) => {
    const params = new URLSearchParams(
      Object.entries(filter).filter(([_, v]) => v != null) as [string, string][]
    )
    const response = await fetch(`/api/reports?${params}`)
    const data = await response.json()
    return data.data?.reports || []
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <ReportQueue
        initialStatus="pending"
        onAction={handleAction}
        onFetchReports={handleFetchReports}
        moderatorId={user.id}
        moderatorName={user.displayName}
      />
    </div>
  )
}
```

## 4. Add Navigation Link

Add a link to the moderation dashboard in your admin navigation:

```tsx
// src/components/admin/admin-nav.tsx (or wherever your nav is)
import { Shield } from 'lucide-react'

export function AdminNav() {
  return (
    <nav>
      {/* ...other nav items... */}

      <a href="/admin/moderation/reports">
        <Shield className="mr-2 h-4 w-4" />
        Reports
      </a>
    </nav>
  )
}
```

## 5. Test It Out

### Submit a Test Report

1. Go to any message in your chat
2. Click the "Report" button
3. Select a category (e.g., "Spam")
4. Add a description: "Test report"
5. Click "Submit Report"
6. You should see a success message

### View in Moderation Queue

1. Go to `/admin/moderation/reports`
2. You should see your test report
3. Click on it to view details
4. Try different actions:
   - Approve
   - Dismiss
   - Escalate

## 6. Customize Categories (Optional)

If you want custom report categories:

```tsx
import { ReportModal } from '@/components/moderation'
import type { ReportCategory } from '@/lib/moderation/report-system'

const customCategories: ReportCategory[] = [
  {
    id: 'custom-violation',
    name: 'Custom Violation',
    description: 'A custom violation type',
    priority: 'high',
    requiresEvidence: true,
    autoEscalate: true,
    enabled: true,
  },
  // ... more categories
]

<ReportModal
  // ... other props
  categories={customCategories}
/>
```

## 7. Configure Auto-Escalation (Optional)

```tsx
// In your API route or handler initialization
import { createReportHandler } from '@/lib/moderation/report-handler'

const handler = createReportHandler({
  enableAutoModeration: true,
  enableNotifications: true,
  enableEscalation: true,
  notificationChannels: ['in-app', 'email'],
  escalationRules: [
    {
      categoryId: 'harassment',
      autoEscalate: true,
      escalateToPriority: 'urgent',
      notifyRoles: ['admin', 'moderator'],
    },
    {
      categoryId: 'hate-speech',
      autoEscalate: true,
      escalateToPriority: 'urgent',
      notifyRoles: ['admin'],
    },
  ],
})
```

## 8. Add Permissions Check

Make sure only moderators/admins can access the queue:

```tsx
// src/app/admin/moderation/reports/page.tsx
'use client'

import { useAuth } from '@/contexts/auth-context'
import { redirect } from 'next/navigation'

export default function ModerationReportsPage() {
  const { user } = useAuth()

  // Check if user has moderator permissions
  const isModerator = user?.role && ['admin', 'moderator', 'owner'].includes(user.role)

  if (!isModerator) {
    redirect('/') // or show access denied
  }

  // ... rest of component
}
```

## 9. Connect to Your Backend (When Ready)

When you're ready to persist reports to your database:

1. Update the API routes to use your GraphQL mutations
2. Replace the in-memory queue with database queries
3. Set up real-time subscriptions for new reports

```tsx
// Example: Connect to GraphQL
import { useMutation, useQuery } from '@apollo/client'
import { SUBMIT_REPORT, GET_REPORTS } from '@/graphql/moderation'

// In your component or API route
const [submitReport] = useMutation(SUBMIT_REPORT)
const { data } = useQuery(GET_REPORTS, {
  variables: { status: 'pending' },
})
```

## 10. Monitor Reports

Check the queue regularly:

```tsx
// Get report statistics
const stats = reportHandler.getQueue().getStats()

console.log('Report Stats:', {
  total: stats.total,
  pending: stats.byStatus.pending,
  urgent: stats.byPriority.urgent,
  avgResolutionTime: stats.averageResolutionTimeMs / (1000 * 60), // minutes
})
```

## Common Issues

### Reports Not Showing

**Problem:** Reports submit successfully but don't appear in the queue.

**Solution:** The default implementation uses in-memory storage. Reports will disappear on server restart. Connect to a database for persistence.

### Can't Submit Reports

**Problem:** "Unauthorized" error when submitting.

**Solution:** Check that `reporterId` is provided and valid. The API currently has a placeholder auth check.

### Actions Not Working

**Problem:** Actions fail with errors.

**Solution:** Ensure you're passing the correct `moderatorId` and the user has moderator permissions.

## Next Steps

Now that you have the basic system running:

1. **Connect to database** - Persist reports in PostgreSQL
2. **Add notifications** - Email/in-app notifications for new reports
3. **Customize categories** - Add your specific report types
4. **Set up webhooks** - Integrate with external systems
5. **Add analytics** - Track report trends and moderator performance

## Need Help?

- **Full Documentation:** `/src/components/moderation/README.md`
- **Implementation Details:** `/docs/Reporting-System-Implementation.md`
- **API Reference:** Check `/src/app/api/reports/route.ts`
- **Examples:** See the usage examples in this guide

## Checklist

Before going to production:

- [ ] Connect to authentication system
- [ ] Add moderator role checks
- [ ] Connect to database for persistence
- [ ] Set up real-time subscriptions
- [ ] Configure notification system
- [ ] Test all report categories
- [ ] Test all moderator actions
- [ ] Add rate limiting
- [ ] Set up monitoring
- [ ] Create moderation guidelines
- [ ] Train moderators
- [ ] Test accessibility
- [ ] Perform security audit

That's it! You now have a fully functional Reporting & Flagging System.
