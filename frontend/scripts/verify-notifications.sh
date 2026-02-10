#!/bin/bash

# Notifications System Verification Script
# Checks that all required files and components are in place

set -e

echo "🔔 Verifying Notifications System Implementation"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0

# Check function
check_file() {
    TOTAL=$((TOTAL + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} $2 (missing: $1)"
        FAILED=$((FAILED + 1))
    fi
}

check_dir() {
    TOTAL=$((TOTAL + 1))
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} $2 (missing: $1)"
        FAILED=$((FAILED + 1))
    fi
}

# API Routes
echo "📡 API Routes"
echo "-------------"
check_file "src/app/api/notifications/route.ts" "REST API endpoint"
echo ""

# Core Libraries
echo "📚 Core Libraries"
echo "-----------------"
check_file "src/lib/notifications/index.ts" "Public API exports"
check_file "src/lib/notifications/notification-types.ts" "Type definitions"
check_file "src/lib/notifications/notification-manager.ts" "Notification manager"
check_file "src/lib/notifications/notification-builder.ts" "Notification builder"
check_file "src/lib/notifications/notification-channels.ts" "Delivery channels"
check_file "src/lib/notifications/notification-preferences.ts" "User preferences"
check_file "src/lib/notifications/notification-scheduler.ts" "Notification scheduler"
check_file "src/lib/notifications/notification-sounds.ts" "Basic sound system"
check_file "src/lib/notifications/sounds.ts" "Advanced sound features"
check_file "src/lib/notifications/keyword-matcher.ts" "Keyword matching"
check_file "src/lib/notifications/keyword-alerts.ts" "Keyword alerts"
check_file "src/lib/notifications/quiet-hours.ts" "Do Not Disturb logic"
check_file "src/lib/notifications/push-subscription.ts" "Push registration"
check_file "src/lib/notifications/channel-settings.ts" "Per-channel config"
echo ""

# UI Components
echo "🎨 UI Components"
echo "----------------"
check_file "src/components/notifications/notification-bell.tsx" "Notification bell"
check_file "src/components/notifications/notification-center.tsx" "Notification center"
check_file "src/components/notifications/notification-item.tsx" "Notification item"
check_file "src/components/notifications/notification-panel.tsx" "Notification panel"
check_file "src/components/notifications/notification-empty.tsx" "Empty states"
check_file "src/components/notifications/notification-toast.tsx" "Toast notifications"
check_file "src/components/notifications/notification-sound.tsx" "Sound player"
check_file "src/components/notifications/desktop-notification.tsx" "Desktop notifications"
check_file "src/components/notifications/unread-badge.tsx" "Unread badge"
check_file "src/components/notifications/mention-badge.tsx" "Mention badge"
check_file "src/components/notifications/test-notification-button.tsx" "Test notification button"
check_file "src/components/notifications/NotificationSettings.tsx" "Settings panel"
check_file "src/components/notifications/NotificationPreferencesGlobal.tsx" "Global preferences"
check_file "src/components/notifications/NotificationPreviewPanel.tsx" "Preview panel"
check_file "src/components/notifications/NotificationHistoryPanel.tsx" "History panel"
check_file "src/components/notifications/NotificationFiltersPanel.tsx" "Filters panel"
check_file "src/components/notifications/NotificationSoundPicker.tsx" "Sound picker"
check_file "src/components/notifications/DesktopNotificationSettingsPanel.tsx" "Desktop settings"
check_file "src/components/notifications/MobileNotificationSettingsPanel.tsx" "Mobile settings"
check_file "src/components/notifications/PushNotificationSettingsPanel.tsx" "Push settings"
check_file "src/components/notifications/EmailNotificationSettingsPanel.tsx" "Email settings"
check_file "src/components/notifications/DMNotificationSettingsPanel.tsx" "DM settings"
check_file "src/components/notifications/MentionSettingsPanel.tsx" "Mention settings"
check_file "src/components/notifications/KeywordNotificationsPanel.tsx" "Keyword panel"
check_file "src/components/notifications/QuietHoursPanel.tsx" "Quiet hours panel"
check_file "src/components/notifications/MuteOptionsPanel.tsx" "Mute options"
check_file "src/components/notifications/ChannelNotificationSettingsList.tsx" "Channel settings list"
check_file "src/components/notifications/channel-notification-settings.tsx" "Channel settings"
check_file "src/components/notifications/notification-preferences.tsx" "Preferences component"
check_file "src/components/notifications/index.ts" "Component exports"
check_file "src/components/notifications/types.ts" "Component types"
echo ""

# State Management
echo "🗄️  State Management"
echo "-------------------"
check_file "src/stores/notification-store.ts" "Main notification store"
check_file "src/stores/notification-settings-store.ts" "Settings store"
echo ""

# Hooks
echo "🪝 Hooks"
echo "--------"
check_file "src/hooks/use-notifications.ts" "Main notification hook"
check_file "src/hooks/graphql/use-notifications.ts" "GraphQL notification hook"
echo ""

# GraphQL
echo "📊 GraphQL"
echo "----------"
check_file "src/graphql/notifications/notification-settings-queries.graphql" "Notification queries"
check_file "src/graphql/notifications/notification-settings-mutations.graphql" "Notification mutations"
echo ""

# Documentation
echo "📖 Documentation"
echo "----------------"
check_file "docs/Notifications-System.md" "Complete system documentation"
check_file "docs/Notifications-Implementation-Summary.md" "Implementation summary"
echo ""

# Sounds Directory
echo "🔊 Sounds"
echo "---------"
check_dir "public/sounds" "Sounds directory"
check_file "public/sounds/README.md" "Sounds README"
echo ""

# Tests
echo "🧪 Tests"
echo "--------"
check_dir "src/lib/notifications/__tests__" "Library tests directory"
check_dir "src/components/notifications/__tests__" "Component tests directory"
check_file "src/hooks/__tests__/use-notifications.test.ts" "Hook tests"
echo ""

# Summary
echo ""
echo "================================================"
echo "📊 Verification Summary"
echo "================================================"
echo -e "Total checks: ${TOTAL}"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All notification system files are in place!${NC}"
    echo ""
    echo "🎉 The notifications system is ready for use."
    echo ""
    echo "Next steps:"
    echo "  1. Add notification sound files to public/sounds/"
    echo "  2. Run tests: pnpm test"
    echo "  3. Start the dev server: pnpm dev"
    echo "  4. Test notifications with the Test Notification button"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some files are missing!${NC}"
    echo ""
    echo "Please ensure all required files are created."
    echo "Check the implementation summary for details."
    echo ""
    exit 1
fi
