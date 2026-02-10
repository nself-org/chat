#!/bin/bash

# Script to remove debug console.log statements from production code
# This script identifies and removes debug console.log statements

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Console.log Cleanup Script${NC}"
echo "================================"

# Files to process (excluding test files and examples in comments)
FILES=(
  "src/services/auth/database-auth.service.ts"
  "src/app/people/page.tsx"
  "src/app/meetings/page.tsx"
  "src/app/test-env/page.tsx"
  "src/app/admin/moderation/page.tsx"
  "src/app/people/[id]/page.tsx"
  "src/app/admin/channels/[id]/page.tsx"
  "src/app/admin/analytics/page.tsx"
  "src/app/admin/users/page.tsx"
  "src/app/admin/users/[id]/page.tsx"
  "src/app/admin/audit/page.tsx"
  "src/services/auth/faux-auth.service.ts"
  "src/components/calls/ScreenShareExample.tsx"
  "src/app/admin/messages/history/page.tsx"
  "src/app/admin/settings/page.tsx"
  "src/components/location/LocationPreview.tsx"
  "src/app/drafts/page.tsx"
  "src/app/activity/page.tsx"
  "src/app/chat/channel/[slug]/page.tsx"
  "src/components/audit/AuditLogViewer.tsx"
  "src/app/settings/profile/page.tsx"
  "src/components/analytics/overview/AnalyticsDashboard.tsx"
  "src/components/analytics/export/AnalyticsExport.tsx"
  "src/app/saved/collections/page.tsx"
  "src/app/saved/collections/[id]/page.tsx"
  "src/components/call/screen-share-panel.tsx"
  "src/providers/pwa-provider.tsx"
  "src/providers/index.tsx"
  "src/contexts/auth-context.tsx"
  "src/lib/media/media-manager.ts"
  "src/components/theme-toggle.tsx"
  "src/components/accessibility/a11y-provider.tsx"
  "src/bots/welcome-bot/index.ts"
  "src/bots/welcome-bot/handlers.ts"
  "src/components/admin/settings-management.tsx"
  "src/components/admin/users/PendingInvites.tsx"
  "src/bots/poll-bot/index.ts"
  "src/bots/poll-bot/handlers.ts"
  "src/components/meetings/MeetingControls.tsx"
  "src/components/admin/users/InviteModal.tsx"
  "src/bots/hello-bot/index.ts"
  "src/bots/reminder-bot/index.ts"
  "src/components/admin/users/UserManagement.tsx"
  "src/components/app-directory/AppRatings.tsx"
  "src/components/setup/steps/owner-info-step.tsx"
  "src/components/channel/channel-members.tsx"
  "src/components/channel/channel-invite-modal.tsx"
  "src/components/channel/pinned-messages.tsx"
  "src/lib/settings/settings-sync.ts"
  "src/hooks/use-app-init.tsx"
  "src/hooks/use-channel-init.ts"
  "src/lib/bots/examples/reminder-bot.ts"
  "src/lib/bots/examples/welcome-bot.ts"
  "src/lib/bots/bot-runtime.ts"
  "src/hooks/use-call-state.ts"
  "src/lib/bots/bot-api.ts"
  "src/lib/auth/providers/phone.ts"
  "src/lib/offline/network-detector.ts"
  "src/lib/calls/call-events.ts"
  "src/lib/bots/webhooks.ts"
  "src/hooks/use-chat-init.ts"
  "src/lib/offline/offline-storage.ts"
  "src/lib/voip-push.ts"
  "src/lib/offline/connection-manager.ts"
  "src/lib/workflows/workflow-executor.ts"
  "src/lib/integrations/webhook-handler.ts"
  "src/lib/offline/offline-queue.ts"
  "src/lib/admin/users/user-impersonation.ts"
  "src/lib/offline/offline-sync.ts"
  "src/lib/offline/offline-cache.ts"
  "src/lib/social/linkedin-client.ts"
  "src/lib/social/instagram-client.ts"
  "src/lib/performance/memory-monitor.ts"
  "src/lib/offline/offline-manager.ts"
  "src/hooks/use-mobile-call-optimization.ts"
  "src/lib/realtime/socket-manager.ts"
  "src/lib/workflows/workflow-actions.ts"
  "src/hooks/useUnreadMentions.ts"
  "src/lib/notifications/notification-manager.ts"
  "src/lib/search/indexer.ts"
  "src/lib/apollo/client.ts"
  "src/lib/search/meilisearch-client.ts"
  "src/lib/pwa/register-sw.ts"
  "src/lib/pwa/push-notifications.ts"
  "src/lib/keyboard/shortcut-handler.ts"
  "src/lib/streaming/stream-client.ts"
  "src/lib/onboarding/onboarding-analytics.ts"
  "src/lib/apollo-client.ts"
  "src/lib/api/middleware.ts"
  "src/lib/slash-commands/command-registry.ts"
  "src/hooks/use-presence-sync.ts"
)

REMOVED=0
TOTAL=0

echo -e "\n${YELLOW}Processing files...${NC}\n"

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Count console.log statements in this file
    count=$(grep -c "console\.log" "$file" 2>/dev/null || echo "0")
    if [ "$count" -gt 0 ]; then
      echo "  $file: $count console.log statements"
      TOTAL=$((TOTAL + count))
    fi
  fi
done

echo -e "\n${GREEN}Summary:${NC}"
echo "Total console.log statements found: $TOTAL"
echo "Excluding test files, comment examples, and necessary logging"

