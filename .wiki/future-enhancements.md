# Future Enhancements and TODOs

This document catalogs all planned enhancements and TODO items across the nself-chat codebase.

**Status**: Extracted on 2026-02-03 for v0.9.1 cleanup

---

## API Endpoints (97 items)

- Add admin authentication check
- Add channel-based access control
- Add refresh token to blacklist if using token blacklisting
- Check authentication and authorization
- Check if email or username already exists
- Check if user exists
- Check if user is admin
- Create user in database via Hasura GraphQL mutation
- Delete file from storage
- Delete poll from database
- Delete vote and update poll in database
- Fetch actual compliance data from database
- Fetch existing poll from database
- Fetch poll from database
- Fetch polls from database
- Fetch previous vote if exists
- Fetch real data from database
- Fetch user's vote
- Fetch webhook configuration from database
- Get from session
- Get user ID from session/auth
- Get user from session/auth
- Get workspace from database
- Handle related data (messages, channels, etc.)
- Hash password if provided
- If email or username is being changed, check for conflicts
- Implement actual invitation logic with Hasura/Nhost
- Implement archival logic
- Implement archiving via GraphQL mutation
- Implement bulk deletion
- Implement cache clearing logic
- Implement deletion logic
- Implement deletion via GraphQL mutation
- Implement flagging via GraphQL mutation
- Implement optimization logic
- Implement role assignment via GraphQL mutation
- Implement suspension via GraphQL mutation
- Implement transfer via GraphQL mutation
- In production, this would publish to Redis pub/sub
- In production, this would query Redis for active typing indicators
- In production, this would:
- Insert events into database
- Integrate with Socket.io or GraphQL subscriptions
- Invalidate all existing sessions for this user
- Load configured secret from environment/database
- Log audit event
- Process Discord webhook and post to channel
- Process Telegram update and forward to appropriate channel
- Queue background job to compile the data export
- Replace with actual database query using Hasura GraphQL
- Save to database
- Save updated poll to database
- Save vote and updated poll to database
- Send magic link email
- Send realtime notifications to invited users
- Send to monitoring service
- Send verification email if email auth is enabled
- Send verification email if required
- Soft delete or hard delete based on config
- Update poll in database
- Update quota
- Update user in database via Hasura GraphQL mutation
- Validate session and get user ID
- Validate webhook token and find target channel
- Verify password before disabling 2FA
- Verify password before regenerating codes

## Settings and Profile Features (11 items)

- Call GraphQL mutation to clear history
- Implement 2FA toggle
- Implement OAuth connection
- Implement account deletion
- Implement account disconnection
- Implement avatar removal
- Implement avatar upload
- Implement email change
- Implement password change
- Save to backend
- Save to backend via GraphQL mutation

## Components (42 items)

- Call API to create group DM
- Call API to create or get existing DM
- Call API to delete group
- Call API to leave group
- Call API to remove member
- Call API to unpin
- Call API to update
- Call API to update role
- Call GraphQL mutation
- Get from auth context
- Implement API calls to fetch compliance data
- Implement actual 2FA disable
- Implement actual 2FA verification
- Implement actual account deletion
- Implement actual data deletion API call
- Implement actual data export API call
- Implement actual device removal
- Implement actual download
- Implement actual job execution
- Implement actual password change API call
- Implement actual push toggle
- Implement actual revoke all sessions
- Implement actual session revocation
- Implement actual unblock API call
- Implement add option functionality
- Implement remind me functionality
- Load from API
- Navigate to or create DM with user
- Save settings to backend
- These tests fail due to Radix Select portal rendering in JSDOM
- Update setting

## Hooks and State Management (35 items)

- Add 'manage_stickers' permission to PERMISSIONS
- Call GraphQL mutation
- Call GraphQL mutation directly
- Fetch from server via GraphQL
- Generate QR code data
- Get from E2EE manager
- Handle file uploads when storage is implemented
- Implement GraphQL mutation
- Implement GraphQL mutation to update privacy settings
- Implement GraphQL query
- Implement account deletion
- Implement data export
- In production:
- Open edit history modal
- Open forward modal with multiple messages
- Open reactions modal
- Sync with backend
- Upload to storage service first
- fetch from user service
- implement read state

## Services and Libraries (67 items)

- Calculate from database
- Collect real stats from transports
- Delete from database
- Fetch from database
- Get from context
- Implement API call to mark as read
- Implement API call to send message
- Implement API call to send token to server
- Implement GraphQL mutation
- Implement actual API call
- Implement actual channel creation via GraphQL
- Implement actual cleanup logic
- Implement actual message creation via GraphQL
- Implement actual queue stats from database
- Implement actual user creation via GraphQL
- Implement channel member addition via GraphQL
- Implement file download and upload
- Implement image moderation using AWS Rekognition or Google Vision
- Implement navigation
- Implement persistent storage
- Implement reaction creation via GraphQL
- Implement semantic similarity search
- Implement sender key distribution for groups
- Implement server-side fetching with GraphQL
- Implement signaling via Socket.io
- Implement trust verification
- In production, fetch from server via GraphQL
- Integrate with Sentry, Datadog, or other error tracking service
- Load and reschedule any pending reminders from storage
- Load from database when available
- Load signed prekey and one-time prekeys
- Query database for actual stats
- Query database for actual usage
- Query database for detailed breakdown
- Replace with actual API call
- Retrieve trusted identity key
- Save to database
- Send actual notification (email, webhook, etc.)
- Send email notification about payment failure
- Send email notification about trial ending
- Send metrics to API
- Send notifications
- Set up scheduled task for daily standup
- Store in PostgreSQL using Hasura or direct connection
- Store message type in DB
- Update in database

## Other Areas (remaining items)

- Implement actual seeding logic
- Implement call feature
- Implement calling feature
- Load from backend via GraphQL
- Navigate to or open DM
- Navigate to or open DM with user
- Open file preview or download
- Open invite modal
- Open report modal
- Properly integrate with useCallInvitation hook \*/}
- Save to backend via GraphQL
