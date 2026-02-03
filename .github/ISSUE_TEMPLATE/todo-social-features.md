---
name: User Interaction Features
about: Implement social features like DMs, calls, reports, invites
title: '[TODO-SOCIAL-001] User Interaction and Social Features'
labels: enhancement, feature, medium-priority
assignees: ''
---

## Description

Implement user-to-user interaction features including direct messaging shortcuts, voice/video calls, user reporting, and team invitations.

## Affected Components

### Direct Messaging

- [ ] `src/app/people/[id]/page.tsx:178` - Open DM from user profile
- [ ] `src/app/people/page.tsx:210` - Open DM from people list
- [ ] `src/components/channel/channel-members.tsx:323` - DM from channel members

### Voice and Video Calls

- [ ] `src/app/people/[id]/page.tsx:184` - Call from user profile
- [ ] `src/app/people/page.tsx:216` - Call from people list
- [ ] WebRTC integration
- [ ] Call UI components

### User Reporting

- [ ] `src/app/people/[id]/page.tsx:204` - Report user modal
- [ ] Report submission backend
- [ ] Admin moderation dashboard

### Team Invitations

- [ ] `src/app/people/page.tsx:228` - Invite modal
- [ ] Email invitations
- [ ] Invite link generation
- [ ] Track invitation status

## Technical Requirements

### Direct Messaging Navigation

1. **Implementation:**

   ```typescript
   const openDM = async (userId: string) => {
     // Check if DM already exists
     const dm = await findOrCreateDM(userId)

     // Navigate to DM
     router.push(`/chat/dm/${dm.id}`)
   }
   ```

2. **GraphQL Queries:**
   ```graphql
   query FindDM($userId: uuid!, $currentUserId: uuid!) {
     nchat_direct_messages(
       where: {
         participants: { user_id: { _in: [$userId, $currentUserId] } }
         is_group: { _eq: false }
       }
     ) {
       id
     }
   }
   ```

### Voice/Video Calls (WebRTC)

1. **Architecture:**
   - Peer-to-peer for 1:1 calls
   - SFU (Selective Forwarding Unit) for group calls
   - TURN server for NAT traversal
   - Signaling via Socket.io

2. **Components:**

   ```typescript
   // src/components/call/CallModal.tsx
   // src/components/call/VideoCall.tsx
   // src/components/call/VoiceCall.tsx
   // src/hooks/use-video-call.ts
   // src/hooks/use-voice-call.ts
   // src/lib/webrtc/peer-connection.ts
   // src/lib/webrtc/media-stream.ts
   ```

3. **Features:**
   - Screen sharing
   - Mute/unmute audio
   - Enable/disable video
   - Chat during call
   - Call recording (optional)
   - Call history

4. **Database Schema:**
   ```sql
   CREATE TABLE nchat_calls (
     id uuid PRIMARY KEY,
     caller_id uuid NOT NULL,
     callee_id uuid NOT NULL,
     type text NOT NULL CHECK (type IN ('voice', 'video')),
     status text NOT NULL CHECK (status IN ('ringing', 'active', 'ended', 'missed')),
     started_at timestamp with time zone,
     ended_at timestamp with time zone,
     duration interval
   );
   ```

### User Reporting

1. **Report Types:**
   - Spam
   - Harassment
   - Inappropriate content
   - Impersonation
   - Other (with description)

2. **Report Flow:**

   ```typescript
   const reportUser = async (data: ReportData) => {
     await submitReport({
       reportedUserId: data.userId,
       reason: data.reason,
       description: data.description,
       evidence: data.screenshots, // Optional
     })

     toast.success('Report submitted. Our team will review it.')
   }
   ```

3. **GraphQL Mutation:**

   ```graphql
   mutation ReportUser(
     $reportedUserId: uuid!
     $reason: String!
     $description: String!
     $evidence: [String!]
   ) {
     insert_nchat_reports_one(
       object: {
         reported_user_id: $reportedUserId
         reporter_id: $currentUserId
         reason: $reason
         description: $description
         evidence: $evidence
         status: "pending"
       }
     ) {
       id
     }
   }
   ```

4. **Admin Moderation:**
   - Review pending reports
   - Ban/warn users
   - Delete reported content
   - Track moderation actions

### Team Invitations

1. **Invitation Methods:**
   - Email invitation with magic link
   - Invite link (single-use or multi-use)
   - QR code for in-person invitations

2. **Invitation Flow:**

   ```typescript
   const inviteUser = async (email: string, role: string) => {
     const invitation = await createInvitation({
       email,
       role,
       expiresIn: '7 days',
     })

     await sendInvitationEmail({
       to: email,
       inviteLink: `${appUrl}/invite/${invitation.token}`,
     })

     toast.success(`Invitation sent to ${email}`)
   }
   ```

3. **GraphQL Mutations:**

   ```graphql
   mutation CreateInvitation($email: String!, $role: String!, $expiresAt: timestamp!) {
     insert_nchat_invitations_one(
       object: {
         email: $email
         role: $role
         token: $token
         expires_at: $expiresAt
         invited_by: $currentUserId
         status: "pending"
       }
     ) {
       id
       token
     }
   }

   mutation AcceptInvitation($token: String!) {
     acceptInvitation(token: $token) {
       success
       userId
     }
   }
   ```

4. **Database Schema:**
   ```sql
   CREATE TABLE nchat_invitations (
     id uuid PRIMARY KEY,
     email text NOT NULL,
     token text UNIQUE NOT NULL,
     role text NOT NULL,
     invited_by uuid REFERENCES nchat_users(id),
     status text NOT NULL CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
     created_at timestamp with time zone DEFAULT now(),
     expires_at timestamp with time zone NOT NULL,
     accepted_at timestamp with time zone
   );
   ```

## Testing Checklist

### Direct Messaging

- [ ] Open DM from user profile
- [ ] Open DM from people list
- [ ] Open DM from channel members
- [ ] Create new DM if doesn't exist
- [ ] Navigate to existing DM if exists

### Voice/Video Calls

- [ ] Initiate voice call
- [ ] Initiate video call
- [ ] Receive incoming call
- [ ] Accept/reject call
- [ ] Mute/unmute during call
- [ ] Enable/disable video
- [ ] Screen sharing
- [ ] End call
- [ ] Call history tracking

### User Reporting

- [ ] Submit report with reason
- [ ] Attach screenshots
- [ ] Confirmation message
- [ ] Admin sees pending reports
- [ ] Admin can action reports

### Team Invitations

- [ ] Send email invitation
- [ ] Generate invite link
- [ ] Generate QR code
- [ ] Accept invitation
- [ ] Expired invitation handling
- [ ] Revoke invitation
- [ ] Track invitation status

## Acceptance Criteria

- DM navigation works from all entry points
- Voice/video calls work peer-to-peer
- User reporting submits to moderation queue
- Invitations send email with magic link
- All features have proper loading states
- Error handling with user-friendly messages
- RBAC enforced (who can invite, report, etc.)

## Dependencies

- WebRTC for calls (consider using [LiveKit](https://livekit.io/))
- TURN server for NAT traversal (e.g., Coturn)
- Email service for invitations (Mailgun, SendGrid, or Nhost)
- QR code library (`qrcode` package)

## Priority: Medium

Nice-to-have features for v1.1.0. Voice/video calls can be high priority if core requirement.
