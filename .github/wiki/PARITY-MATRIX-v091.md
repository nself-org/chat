# Authoritative Feature Parity Matrix v0.9.1

**Last Updated**: 2026-02-08
**Document Purpose**: Map feature parity across 6 competitor platforms (WhatsApp, Telegram, Signal, Discord, Slack, Rocket.Chat) to nself-chat implementation tasks with explicit acceptance criteria.

**Key Principle**: Every row describes a feature behavior that exists in at least one competitor. Each task ID references the specific `.claude/TODO.md` work item. Acceptance tests are deterministic, non-flaky, and platform-specific.

---

## Table of Contents

1. [Authentication & Account Security](#authentication--account-security)
2. [Core Messaging](#core-messaging)
3. [Channels & Organization](#channels--organization)
4. [Direct Messaging & Contacts](#direct-messaging--contacts)
5. [Calls & Real-time Communication](#calls--real-time-communication)
6. [Media & Files](#media--files)
7. [Search & Discovery](#search--discovery)
8. [Moderation & Trust & Safety](#moderation--trust--safety)
9. [Security & Privacy (E2EE)](#security--privacy-e2ee)
10. [Integrations & Bots](#integrations--bots)
11. [Monetization & Access Control](#monetization--access-control)
12. [Compliance & Governance](#compliance--governance)

---

## Authentication & Account Security

### User Registration & Account Creation

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Phone-number registration** | ✅ Required | ✅ Required | ✅ Required | ❌ No | ❌ No | ❌ No | 31 | User registers via +1 area code, SMS OTP verification succeeds, account created with phone as identifier |
| **Email + password registration** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 31 | User registers with `user@example.com`, password set, login succeeds with email+pass |
| **Magic link / passwordless email** | ❌ No | ❌ No | ✅ Available | ✅ Available | ✅ Available | ✅ Available | 31 | User enters email, receives link, clicks link, session created without password |
| **OAuth / Single Sign-On** | ❌ No | ❌ No | ❌ No | ✅ Google/GitHub | ✅ Google/GitHub/SAML | ✅ SAML/OpenID | 21, 31 | User clicks "Sign in with Google", OAuth flow completes, account linked, login succeeds |
| **Two-Factor Authentication (TOTP)** | ❌ No | ✅ Optional | ✅ Required | ✅ Optional | ✅ Optional | ✅ Optional | 23, 80 | User enables TOTP, QR code scannable by authenticator app, time-based token validates on login |
| **Backup codes for 2FA recovery** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 80 | User generates 10 backup codes, saves them, uses one during 2FA challenge, code invalidated |
| **Device registration & device list** | ❌ No | ✅ Active sessions list | ✅ Linked devices | ✅ Sessions | ✅ Sessions | ✅ Sessions | 31 | User signs in on Device A, Device B; device list shows both with last-seen timestamp; user can revoke Device B |
| **Session timeout & auto-logout** | ✅ 30 days | ✅ Configurable | ✅ Configurable | ✅ 30 days | ✅ 30 days | ✅ Configurable | 31 | User logs in, waits for inactivity threshold (configurable), automatic logout triggers, re-auth required |
| **Remember device (skip 2FA on trusted device)** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 80 | After 2FA success on Device A, user can mark "trust 30 days", subsequent logins skip 2FA on that device |

### Profile & Account Management

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Profile photo (avatar)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 32 | User uploads JPG avatar, avatar displays in all chat contexts, change propagates across clients within 2s |
| **Profile bio / status message** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 32 | User sets bio to "📍 NYC", displays in profile card, emoji renders correctly, max 160 chars enforced |
| **Username / display name** | ✅ Optional | ✅ Required | ✅ No unique | ❌ Unique username | ✅ Unique | ✅ Unique | 32 | Telegram: user sets username `@alice`, search finds by `@alice`, no dupes allowed; Discord: unique username enforced by server |
| **Account visibility (private/public)** | ✅ Privacy modes | ✅ Yes | ✅ Yes (privacy presets) | ✅ No | ✅ Workspace-only | ✅ Yes | 32, 85 | User toggles "Allow strangers to find me", search/profile visibility changes; old setting respects toggle within 1s |
| **Profile photo history / gallery** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No | 32 | Slack: user's past 10 profile photos are queryable via `/list profile-photos`; photos retain timestamp |
| **Account deletion (GDPR right to be forgotten)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 69 | User requests account deletion, all messages/media purged, account locked, deletion confirmed via email |
| **Username change/rename policy** | ✅ Anytime | ✅ Once per 7d | ✅ No rename | ❌ Unique, can change | ✅ Unique, can change | ✅ Can change | 32 | Telegram: rename throttled to 1 per week per user; Discord: rename allowed anytime; nChat enforces preset policy |

---

## Core Messaging

### Message Types & Rich Content

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Text messages (UTF-8 / emoji)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 36 | User sends "Hello 🌍 العربية 中文", message stored, retrieved, emoji/RTL renders correctly on all clients |
| **Message formatting (bold/italic/code/strikethrough)** | ❌ No | ✅ Yes (Markdown) | ❌ No | ✅ Yes (rich text) | ✅ Yes (Markdown) | ✅ Yes (Markdown) | 36 | User sends `*bold* _italic_ `code` ~strike~`, rendering matches sender intent on all clients within 1s |
| **Code block with syntax highlighting** | ❌ No | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 36 | User sends triple-backtick block with `javascript` language tag, syntax highlighting applies, copy preserves formatting |
| **Quotes / reply-to message** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes (with context) | ✅ Yes | ✅ Yes | 36, 47 | User replies to message M1, reply shows "replying to M1 text", tapping reply navigates to M1, reply survives M1 edit/deletion |
| **Message forwarding** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ✅ Yes | 36 | User forwards M1 to new channel, forwarded message shows "Forwarded from X", sender attribution preserved |
| **Pinned messages** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (per-channel) | ✅ Yes | ✅ Yes | 39 | User pins M1 in channel, pin count updates, pinned messages list accessible, only channel mods can pin |
| **Starred / Saved messages (personal)** | ❌ "Starred" not common | ✅ Saved | ✅ Saved | ❌ No | ✅ Save to self | ✅ Bookmarks | 39 | User saves M1, appears in personal "Saved" view, persists across sessions, only user can see |
| **Message reactions / emoji reactions** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (multi-emoji) | ✅ Yes | ✅ Yes | 38 | User adds 👍 reaction to M1, reaction appears instantly, duplicate reactions from same user rejected, can remove |
| **Thread / conversation branching** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 35, 47 | User replies in thread to M1, thread message does not appear in channel, thread unread count increments, reply notification sent to thread subscribers |
| **Poll messages** | ❌ No | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 36 | User creates poll "Lunch spot?" with options ["Tacos", "Pizza"], options render, votes tallied, results update real-time |

### Message Actions & State

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Edit message (with history)** | ✅ Yes, shows "(edited)" | ✅ Yes, edit history | ✅ Yes, shows edit time | ✅ Yes | ✅ Yes | ✅ Yes | 37 | User edits M1, message shows "(edited)", edit window is configurable per preset, old version queryable in history |
| **Delete message (self only)** | ✅ Yes (1hr window) | ✅ Yes (any time) | ✅ Yes (1hr default) | ✅ Yes (2wk window) | ✅ Yes (no limit for self) | ✅ Yes | 37 | User deletes M1 within window, message removed from channel for all users, deletion audit logged, notification sent to viewers |
| **Delete message for everyone** | ✅ Yes (1min) | ❌ No | ✅ Yes | ❌ No | ❌ No | ✅ Yes | 37 | WhatsApp: user deletes M1 within 1 minute, disappears from all recipients; nChat respects per-preset delete window |
| **Undo / message recall** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Undo in composer | ❌ No | 37 | Slack: user types message, hits Undo key, message text reverts before send; nChat supports per-preset |
| **Read receipts (1-check, 2-check, 3-check)** | ✅ Yes (double-blue) | ✅ Yes | ✅ Yes | ✅ Yes (implicit seen) | ✅ Yes | ✅ Yes | 46 | Message shows 1 check (sent), 2 checks (delivered), 3 checks (read); user can disable per preset in privacy settings |
| **Typing indicators** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 46 | User A types in channel, "User A is typing..." appears for other users, indicator hides after 3s inactivity |
| **Message delivery state (pending/sent/delivered/read)** | ✅ All 4 states | ✅ All 4 states | ✅ All 4 states | ✅ Implicit | ✅ Implicit | ✅ All states | 37, 46 | Message queued locally (pending), sent to server (sent), reaches recipient (delivered), viewed (read); icon changes per state |

### Message Scheduling & Reminders

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Scheduled send (send later)** | ❌ No | ✅ Yes (custom time) | ❌ No | ❌ No | ✅ Yes (workflow) | ✅ Yes | 45 | User schedules message for "2026-02-09 09:00 UTC", message appears at exact time in channel, timezone applied correctly |
| **Edit scheduled message** | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes | 45 | User edits scheduled message text before send time, updated text sent at scheduled time |
| **Cancel scheduled message** | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes | 45 | User cancels scheduled message, does not send, removed from scheduled list |
| **Message reminders / notification scheduling** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Remind me feature | ✅ Reminders plugin | 45 | Slack: user clicks "Remind me about this", reminder sent at specified time, clicking reminder navigates to message |

---

## Channels & Organization

### Channel Types & Hierarchy

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Public channels (discoverable)** | ❌ No | ✅ Yes (@channel_name) | ❌ No | ✅ Yes (#channel) | ✅ Yes (#channel) | ✅ Yes | 34, 35 | User searches for public channel, finds it, joins, can post if permissions allow, discovery respects age/category filters |
| **Private channels (invite-only)** | ✅ Group creation | ✅ Yes (private groups) | ✅ Group creation | ✅ Yes (#private) | ✅ Yes (#private) | ✅ Yes | 34, 35 | User creates private channel, invites members, non-members cannot see/search, invite link controls who can join |
| **Direct messages (1-on-1)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 34 | User DMs contact, conversation persists, messages encrypted by default, DM list shows unread count |
| **Group chats (3-50 members)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (channels) | ✅ Yes | 34 | User creates group chat with 5 people, group name settable, group photo settable, member list visible to all |
| **Supergroups / Large groups (50+ members)** | ❌ WhatsApp groups max ~256 | ✅ Yes (100k+) | ❌ No | ✅ Guilds (100k+) | ✅ Workspaces (1000k+) | ✅ Rooms (unlimited) | 34 | Telegram: creates supergroup, 1000 members join, message performance stable, moderation tools available |
| **Communities / Server meta-hierarchy** | ✅ Yes (Communities) | ✅ Yes (Topics in supergroups) | ❌ No | ✅ Yes (Guild) | ✅ Yes (Workspace) | ✅ Yes (Teams) | 34, 35, 62 | Discord: creates Guild, adds Channels, Channel Folders; User navigates hierarchy, unread counts per category |
| **Channel categories / folders** | ❌ No | ✅ Yes (Topics) | ❌ No | ✅ Yes (Category) | ❌ No | ✅ Yes | 35 | User organizes 10 channels into "Projects" folder, folder collapses/expands, unread count aggregates |
| **Archived channels** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 35, 63 | User archives channel, channel hidden from main list, accessible from "Archived Channels" view, read-only for non-owners |
| **Channel topics / channel descriptions** | ✅ Group desc | ✅ Yes | ✅ Yes | ✅ Yes (#topic) | ✅ Yes (channel topic) | ✅ Yes | 35 | User sets channel description to "Q&A for #projects", description appears in channel header, updatable by mods |

### Channel Governance & Roles

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Member list / roster** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 35, 61 | User opens channel member list, sees all members, member count accurate, last-seen timestamp visible |
| **Member joining / invitation flow** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Invite link | ✅ Invite link/email | ✅ Invite link | 35 | User generates invite link with expiry, shares it, recipient clicks link, joins channel, link expires after 7d |
| **Member roles (owner, admin, moderator, member)** | ✅ Admin/regular | ✅ Administrator/Restricted/Member | ❌ Admin/regular | ✅ Owner/Mod/Member | ✅ Owner/Admin/Member | ✅ Owner/Moderator/Member | 35, 61 | User promotes @alice to moderator, @alice can mute/kick users, @alice cannot delete channel, role changes audited |
| **Permission matrix (who can post/edit/pin/mute/delete)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Fine-grained | ✅ Fine-grained | ✅ Fine-grained | 61 | Admin toggles "Only mods can post", member attempts to post, rejected with permission error, error message helpful |
| **Mute channel / notification settings per channel** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 46, 122 | User mutes #general, no notifications, channel marked muted in sidebar, unmuting re-enables notifications |
| **Default channel (onboarding members to #welcome)** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 63 | New team member auto-added to #welcome, sees pinned onboarding messages, can leave if desired |
| **Member request to join (pending approval)** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ No | ✅ Yes | 35 | Rocket.Chat: user requests to join private channel, owner/mod sees pending request, approves, member joins |

---

## Direct Messaging & Contacts

### Contact Management

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Import contacts from phone/address book** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No | 33 | User grants contacts permission, WhatsApp shows "Contacts with WhatsApp", user can start DM with matched contact |
| **Contact discovery via phone/email** | ✅ Phone match | ✅ Phone/username | ✅ Phone | ❌ Username | ✅ Email | ✅ Email | 33 | User searches for "+1-555-0123" in Signal, finds linked user, can start DM, privacy mode respected |
| **Block contact / blocklist** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 33 | User blocks @bob, @bob cannot message user, cannot see user in search, blocked list is queryable by user |
| **Unblock contact / manage blocklist** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 33 | User unblocks @bob, @bob can message again, appears in search, unblock is silent (no notification sent) |
| **Invite contact (not yet user)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 33 | User invites contact via SMS/email, contact receives invite with download link, join succeeds, contact auto-added to user's list |
| **Hide DM conversations** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Archive (implicit) | ✅ Close | ✅ Yes | 34 | User hides DM with @charlie, DM moves to "Hidden", user can view hidden list and restore, messages still received |
| **Mute DM notifications** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 46 | User mutes DM with @dave, no notifications, DM still visible in list but marked muted, unmuting re-enables notifications |
| **DM request / message request (optional)** | ✅ Yes (Optional) | ❌ No | ✅ Message requests | ✅ No | ✅ No | ✅ Yes | 34 | Signal: user has unknown sender message in "Message Requests", user can accept (move to inbox) or decline (delete) |

---

## Calls & Real-time Communication

### Voice & Video Calls

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **1-on-1 voice call** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 51 | User A calls User B, B receives call notification, B answers, both hear each other clearly, call can be ended by either |
| **1-on-1 video call** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 51 | User A video calls User B, video stream renders, audio/video sync within 100ms, front/back camera toggle works |
| **Group voice call (3+ people)** | ✅ Yes | ✅ Yes (VoIP) | ❌ Not multi | ✅ Yes | ✅ Yes | ✅ Yes | 52 | 5 users join voice call, all hear each other, speaker indicator shows active speaker, one user leaves, remaining 4 stay connected |
| **Group video call** | ✅ Yes (mobile) | ✅ Yes | ❌ Not multi | ✅ Yes | ✅ Yes | ✅ Yes | 52 | 4 users join video call, grid layout shows 4 videos, focus on speaker, video paused by one user, playback performance stable |
| **Screen share** | ✅ iOS only | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 53 | User A shares screen, User B sees desktop/app, A can stop share, B can capture screenshot (with/without permission per preset) |
| **Virtual backgrounds** | ✅ iOS/Android | ✅ No | ❌ No | ✅ Yes (Discord Nitro) | ✅ Yes | ✅ Yes | 53 | User uploads custom background image, background applies to video, camera feed blends correctly, performance stable at 30fps |
| **Mute/unmute during call** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 51, 52 | User mutes, audio stream stops, "muted" indicator shows to other users, user can unmute anytime, unmute successful within 200ms |
| **Camera on/off toggle** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 51, 52 | User disables camera, video feed blacks out, indicator shows "camera off", other users notified, user can re-enable anytime |
| **Call recording** | ✅ Yes (by default) | ✅ Yes (notify) | ✅ Manual | ✅ Yes (server-side) | ✅ Yes (by permission) | ✅ Yes | 58 | Call recorded, both parties notified at start, recording stored securely, ACL controls who can access, deletion respects retention policy |
| **Call history / call log** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 51, 52 | User opens call history, sees past calls with timestamp/duration/participants, can re-call, call log persists across devices within SLA |

### Stage Channels & Live Events (Discord/Slack/Rocket.Chat)

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Stage channels (listener/speaker modes)** | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No | ✅ Yes | 54 | Discord: 100 listeners, 5 speakers in stage channel, listener requests to speak (raise hand), speaker approves, new speaker joins unmuted |
| **Host/mod controls (mute/remove speakers)** | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No | ✅ Yes | 54 | Host mutes disruptive speaker, speaker audio muted for all, speaker notified, speaker can request unmute via raise hand |
| **Raise hand feature** | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No | ✅ Yes | 54 | Listener raises hand, notification sent to host, host sees hand-raise queue, host can promote listener or dismiss |
| **Live chat alongside stage** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Huddle chat | ✅ Yes | 54, 55 | Chat messages appear in side panel alongside stage video, chat persists after stage ends, searchable |

### Huddles & Lightweight Calls (Slack)

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Huddle (quick video call from DM/channel)** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No | 55 | Slack: user clicks "Huddle" button in #general, video call starts instantly for channel members who join, can share screen, low latency (<500ms) |

### Livestream & Webcast (Telegram/Rocket.Chat)

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Livestream to channel / webcast** | ❌ No | ✅ Yes (Live Event) | ❌ No | ❌ No | ❌ No | ✅ Yes | 57 | Telegram: user starts livestream in channel, viewers join from chat, viewer count updates, streamer can end/suspend, recording available |
| **Viewer reactions during livestream** | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes | 57 | Viewers send emoji reactions, reactions appear in stream UI with counts, streamer can mute reactions, reactions logged |
| **Live chat during broadcast** | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes | 57 | Chat messages appear alongside broadcast, streamer can read/respond, slow chat mode available, message moderation tools available |

---

## Media & Files

### Image & Photo Handling

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Image upload (JPG/PNG/GIF/WebP)** | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All | 42 | User uploads 5MB JPG, thumbnail generated, image appears in chat, original quality preserved in download |
| **Image compression on send** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 42 | User uploads 50MB uncompressed image, sent at optimized size (~5MB), quality acceptable, EXIF metadata stripped |
| **Inline image preview** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 42 | User sends image, preview appears in message, clicking preview opens full-screen viewer, swipe navigation works |
| **Gallery / shared media browser** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 42, 121 | User opens "Shared Media" in channel, browses all images/videos chronologically, search by date/keyword, download/delete from gallery |
| **Pinch-to-zoom and full-screen viewer** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 43 | User views image, pinches to zoom (mobile), rotates phone to landscape, zoom persists, swipe navigates next image |
| **Image reactions / sticker reactions** | ✅ Yes (limited) | ✅ Stickers | ✅ Yes | ✅ Custom emojis | ✅ Custom reactions | ✅ Custom reactions | 38, 42 | User adds sticker reaction to image message, sticker appears below message, sticker pack preview available |

### Video & Audio Handling

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Video upload & inline playback** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 42 | User uploads 100MB MP4 video, thumbnail generated, inline player appears, playback controls (play/pause/seek) work |
| **Video transcoding (format conversion)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 42 | User uploads MOV from iPhone, transcoded to H.264/AAC MP4, playback works on all devices, bitrate adaptive per connection |
| **Video download & offline access** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 48 | User downloads video via "Save Video" option, available in offline mode, playback works without network |
| **Streaming video without full download** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 42 | User plays video, streaming begins at 5MB buffer, seeking works within buffered range, bandwidth adaptive |
| **Audio file upload** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 42 | User uploads MP3/WAV/M4A audio file, player appears with title/artist, playback 0-100% works |
| **Voice message / audio recording** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 42 | User records voice memo (3min), waveform appears, recipient can play/pause/seek, download optional |
| **Automatic audio transcription** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes (Slack AI) | ❌ No | 42 | Slack: voice message auto-transcribed, transcript appears below audio, searchable via transcript text |

### Document & File Handling

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **File upload (PDF/DOC/ZIP)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 42 | User uploads 50MB ZIP file, file link appears, recipient can download, file preview available if supported format |
| **PDF preview & annotation** | ❌ No | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ✅ Yes | 42 | Slack: user uploads PDF, preview shows page 1, user can navigate pages, annotation tools available |
| **Document metadata extraction** | ❌ No | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 42 | File preview shows name/size/upload-time, shared media browser shows document thumbnail, searchable by filename |
| **Virus scanning for file uploads** | ❌ Basic | ✅ Yes (ClamAV) | ✅ Yes | ✅ Yes (VirusTotal) | ✅ Yes | ✅ Yes | 19 | User uploads potentially malicious file, scanner detects, file quarantined, notification sent, safe files proceed to storage |
| **EXIF metadata stripping (image privacy)** | ✅ Yes (auto) | ✅ Yes (option) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 20 | User uploads image with GPS EXIF data, server strips EXIF, image stored without location metadata, recipient sees image only |
| **File size limits & quota** | ✅ Yes (per preset) | ✅ Yes (2GB file) | ✅ Yes | ✅ Yes (8MB free) | ✅ Yes (quota) | ✅ Yes | 42 | User attempts to upload 100MB file when limit is 50MB, upload rejected, error message shows remaining quota |
| **File sharing expiry / ephemeral files** | ❌ No | ✅ Yes (timer) | ❌ No | ❌ No | ❌ No | ❌ No | 42 | Telegram: file shared with expiry, recipient can download, after expiry link broken, file deleted server-side |

---

## Search & Discovery

### Message Search

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Full-text message search** | ✅ Yes | ✅ Yes | ✅ Yes (local only) | ✅ Yes | ✅ Yes | ✅ Yes | 41, 22 | User searches "product launch", results show matching messages with context, results ranked by relevance, sort by date/sender |
| **Search filters (by user/channel/date)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (advanced) | ✅ Yes (advanced) | ✅ Yes | 41, 22 | User searches "from:@alice since:2026-01-01 #general", results filtered, advanced syntax documented in help |
| **Saved searches / search history** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 41 | Discord: user saves search "author:@bob", appears in saved list, one-click re-run, 10 saved max |
| **Semantic search (AI-assisted)** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Slack AI | ❌ No | 41 | Slack: user searches "things we discussed about pricing", results use semantic similarity, not just keyword match |
| **Media-only search** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 41, 42 | User searches in #general with "media:image" filter, returns images only, pagination works, download bulk available |
| **Command/code search** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes (code snippets) | ✅ Yes | 41 | Slack: search for code blocks, results syntax-highlighted, one-click copy |

### Link Preview & Unfurling

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **URL preview / link unfurling** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 44 | User pastes "https://example.com/page", preview appears with title/description/image, preview non-intrusive |
| **Rich embeds (video/audio/iframe)** | ❌ Limited | ✅ Yes (YouTube/etc) | ❌ No | ✅ Yes (YouTube) | ✅ Yes (many) | ✅ Yes | 44 | User pastes YouTube link, embedded video player appears, playback works without leaving chat, volume controls available |
| **Per-domain preview rules / domain blocklist** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes (admin) | ✅ Yes | 44 | Admin disables previews for domain.com, links to domain.com show URL only, previews for other domains unaffected |
| **Security scan for links** | ❌ Basic | ✅ Yes (safe browsing) | ❌ No | ✅ Yes | ✅ Yes (Google Safe) | ✅ Yes | 44 | User clicks link to phishing site, warning shown, user can proceed with caution or cancel, warning non-blocking |

### User & Channel Discovery

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **User directory search** | ✅ Contacts | ✅ Yes | ✅ Contacts | ✅ Yes | ✅ Yes | ✅ Yes | 41, 33 | User searches for "@alice", finds user profile, can click to open chat or view profile, exact match prioritized |
| **Channel directory & discovery** | ❌ No | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 41, 35 | User browses public channels, sorts by members/activity, channel description and member count visible, one-click join |
| **Trending channels / popular content** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No | 41 | Slack: trending tab shows popular channels by activity/members, helps discovery for new users |
| **Command palette (Cmd+K)** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 41 | User presses Cmd+K, fuzzy search appears, searches channels/users/commands, Enter navigates or executes, ESC closes |

---

## Moderation & Trust & Safety

### Content Moderation

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Report message / content flagging** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 64 | User right-clicks message, selects "Report", reason selected (spam/hate/harassment), submitted to mods, notification sent |
| **Auto-moderation (profanity filter)** | ❌ No | ❌ No | ❌ No | ✅ Optional | ✅ Optional | ✅ Yes | 65 | Moderator enables auto-mod profanity filter, user posts slur, message auto-deleted or flagged, user warned |
| **Spam detection & auto-action** | ❌ No | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 65 | User rapid-posts 100 messages, spam detector triggers, user muted for 10min, messages suppressed from channel, admin notified |
| **Rate limiting (per-user per-channel)** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 65 | User attempts to post 10 messages/sec, rate limit kicks in, posts queued or rejected with "slow down" error |
| **Message deletion by moderator** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 64, 37 | Moderator deletes user's message, message removed from channel for all, deletion logged in moderation audit |
| **User mute / silence (in channel)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 64 | Moderator mutes user @bob in #general, @bob cannot post to #general, can still read/react, mute duration settable |
| **Slowmode (cooldown between posts)** | ✅ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 64 | Admin enables slowmode 60sec in #announcements, users must wait 60sec between posts, timer shown in composer |
| **User kick / temporary ban** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 64 | Moderator kicks user @eve from channel, @eve removed, can rejoin if invited, kick logged |
| **User ban / permanent ban** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 64 | Admin bans user @frank from workspace, @frank cannot join/post, ban list queryable, unban available |
| **Ban appeals / moderation appeal process** | ❌ No | ❌ No | ❌ No | ✅ Optional | ❌ No | ✅ Yes | 64 | User banned for "spam", submits appeal with explanation, moderator reviews, decision logged, user notified |

### Trust & Safety Evidence

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Evidence collection / moderation evidence logs** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 66 | Moderator submits report with evidence (message link, context), report stored immutably, appeal referenced to evidence, tamper-evident |
| **Audit trail for moderation actions** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 67 | Moderator views moderation log, shows "User @bob muted in #general at 2026-02-08 10:30 UTC by @alice", reason logged |
| **Legal hold / evidence preservation** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes (Compliance) | ✅ Yes | 66 | Admin marks channel for legal hold, messages cannot be deleted, deletion attempts blocked, hold logged |
| **Trust & safety escalation workflow** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | 64 | Moderator escalates report to T&S team, report automatically forwarded, ticket created, SLA enforcement available |

---

## Security & Privacy (E2EE)

### Encryption at Rest

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **End-to-end encryption (default for all messages)** | ✅ Yes | ❌ Optional (Secret Chat) | ✅ Yes | ❌ No | ❌ No | ✅ Optional | 75, 76 | WhatsApp: message sent, plaintext never reaches server, recipient decrypts with private key, wiretap reveals ciphertext only |
| **E2EE for groups** | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ❌ No | ✅ Optional | 76 | Group chat with 5 members, all messages E2EE, member joins/leaves, keys rekey automatically, no future content leaked |
| **E2EE for media/attachments** | ✅ Yes | ❌ No (Secret Chat) | ✅ Yes | ❌ No | ❌ No | ✅ Optional | 77 | User sends encrypted image, server stores ciphertext, recipient decrypts client-side, metadata minimized |
| **Forward secrecy / Perfect forward secrecy** | ✅ Yes (Double Ratchet) | ❌ No | ✅ Yes (Signal Protocol) | ❌ No | ❌ No | ✅ Yes (optional) | 75, 76 | Device A sends M1, Device A's key compromised, M1 unrecoverable, future messages M2+ also secure, historical M0 compromised |
| **Encryption key rotation / rekeying** | ✅ Automatic | ✅ No | ✅ Automatic | ❌ No | ❌ No | ✅ Configurable | 74 | User A and User B in E2EE chat, keys rotate per message, old keys destroyed, compromise window minimized per message |

### Identity Verification

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Safety numbers / verification fingerprints** | ✅ Yes (60-digit) | ✅ Yes (optional) | ✅ Yes (QR/fingerprint) | ❌ No | ❌ No | ✅ Optional | 79 | Signal: user opens safety number for contact, displays QR code, user scans peer's QR with their phone, both see "numbers match" |
| **Verification warnings (number changed)** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ✅ Yes | 79 | Contact's E2EE key changes unexpectedly, system warns "safety number changed", user can verify new key or distrust |
| **Verified badge / trust state UI** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | 79 | nChat: verified contact shows checkmark badge in contact card, unverified users show caution icon, verification UI intuitively distinguishes states |

### Recovery & Backup

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Encrypted backup & restore** | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ❌ No | ✅ Yes | 78 | User creates encrypted backup with passphrase, backup stored encrypted on cloud, restore on new device with passphrase succeeds |
| **Recovery lock / registration lock** | ✅ No | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No | 80 | Signal: user enables registration lock with PIN, SIM swap attacker cannot create new account with same phone number without PIN |
| **Backup codes / account recovery codes** | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No | 80 | User enables backup codes, downloads/prints codes, stores securely, uses code to recover account if phone lost, code invalidated post-use |
| **Device verification for backup restore** | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ❌ No | ✅ Yes | 78 | User restores from backup on new device, backup decryption requires device verification code, attacker with backup cannot restore without code |

### Session & Account Security

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Local app lock (PIN/biometric)** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ✅ Optional (mobile) | ✅ Yes | 81 | User sets app lock PIN, reopening app requires PIN, biometric fallback available, inactivity timeout enforces re-lock (5min default) |
| **Panic mode / emergency wipe** | ❌ No | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No | 82 | Signal: user enters panic PIN (different from lock PIN), app appears to unlock normally but wipes all messages/keys, device safe |
| **Remote session wipe** | ❌ No | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes (logout all) | ✅ Yes | 82 | User's account compromised, user logs in on secure device, wipes all sessions remotely, compromised device auto-logs out, no local data accessible |
| **Session timeout on lock screen** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | 31 | User locks phone, app session expires after 15min (configurable), re-unlock requires password, unencrypted cache cleared |

### Transport Security & Infrastructure

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **TLS 1.3 for transport** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 83 | Network sniffer cannot decrypt messages in flight, TLS version verified by client (reject TLS <1.2), cipher suite modern (no RC4/MD5) |
| **Certificate pinning** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ✅ Optional | 83 | Attacker presents valid self-signed cert, app rejects handshake, cert pinning prevents MITM, fallback recovery documented |
| **HSTS (HTTP Strict Transport Security)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 83 | Browser receives HSTS header, forces HTTPS for 1 year, http:// requests auto-redirect to https://, downgrade attacks blocked |

### Metadata & Privacy Controls

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Metadata minimization (reduce server-side data)** | ✅ Limited | ❌ No | ✅ Yes | ❌ No | ❌ No | ✅ Optional | 85 | User disables metadata logging, server stores only timestamp/user-ID (no message content), deletion requests honored, server-logs privacy audit |
| **Sealed sender / sender privacy mode** | ❌ No | ❌ No | ✅ Yes (optional) | ❌ No | ❌ No | ❌ No | 86 | Signal: sender privacy enabled, recipient cannot see sender identity in transport layer (only E2EE decryption reveals), attacker-on-network sees user≠sender |

---

## Integrations & Bots

### Bot Framework & Lifecycle

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Bot accounts / bot user types** | ❌ No | ✅ Yes (Bot API) | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 101, 104 | Bot account created, appears in member list, can post/read/moderate, cannot log in, auth via token/API key |
| **Slash commands / command registration** | ❌ No | ✅ Yes (/command) | ❌ No | ✅ Yes (/command) | ✅ Yes (/command) | ✅ Yes | 102 | User types `/weather NYC`, command handler invoked, bot responds with forecast, command parameters validated, auth checked |
| **Slash command options & autocomplete** | ❌ No | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 102 | User types `/remind me in `, autocomplete shows options (5min/1hr/tomorrow), user selects, command formatted correctly |
| **Incoming webhooks** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 103 | Webhook URL generated, external service POSTs message payload to webhook, message appears in channel, signature verified |
| **Outgoing webhooks** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | 103 | User posts message in channel, trigger rule matches, webhook POSTs to external service, external service responds with action |
| **Webhook retries & replay protection** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | 103 | Webhook delivery fails, automatic retry with exponential backoff (3x), duplicate delivery detected by nonce, not replayed |
| **Bot OAuth / app install flow** | ❌ No | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 104 | User clicks "Add to Discord", bot auth screen requests scopes (read:messages, post:messages), user approves, bot installed with granted scopes |
| **Bot permission model / scopes** | ❌ No | ✅ Yes | ❌ No | ✅ Yes (granular) | ✅ Yes (granular) | ✅ Yes | 104 | Bot requested `read:messages` and `post:messages`, bot cannot delete messages, attempting delete fails with "insufficient scope" error |
| **Bot rate limiting / quotas** | ❌ No | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 104 | Bot rate-limited to 100 posts/min, exceeds limit, subsequent posts rejected with rate-limit error, quota resets hourly |

### Workflow Automation

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Workflow builder UI** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | 105 | Slack: user opens workflow builder, drags trigger (message posted), action (send message), condition (if author=@bot), workflow saves, active |
| **Workflow triggers (message/reaction/schedule)** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | 105 | Workflow triggers on "reaction added" to message, runs action "send DM to user with summary", trigger fires <1s after reaction, audit logged |
| **Workflow approvals** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | 105 | Workflow action requires approval, approver receives notification, approves action, workflow continues, rejection blocks action and logs reason |
| **Workflow scheduling / delayed actions** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | 105 | Workflow action scheduled for "tomorrow at 9am", action executes at exact time, timezone applied correctly, can be cancelled before execution |
| **Workflow error handling & retries** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | 105 | Workflow action fails (API down), automatic retry 3x with exponential backoff, after retries exhausted, error notification sent, logged |

### External Integrations

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Slack workspace integration** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Native | ❌ No | 106 | Rocket.Chat: connect to Slack workspace, channel bridging enabled, messages sync bidirectionally, reactions sync |
| **GitHub integration (PR notifications)** | ❌ No | ✅ Yes (via bot) | ❌ No | ✅ Yes | ✅ Yes (native) | ✅ Yes | 106 | User installs GitHub app, PR opened, notification posted in #github channel, PR details/link included, status updates sync |
| **Google Calendar / meeting integration** | ❌ No | ❌ No | ❌ No | ✅ Yes (via calendar app) | ✅ Yes (calendar) | ✅ Yes | 106 | Calendar event created, notification posted to channel, event details with join link included, RSVP sync to calendar |
| **Jira issue tracking integration** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes (native) | ✅ Yes | 106 | Jira issue created, notification posted in Slack, issue link clickable, status transitions notify channel, comments sync optional |
| **Google Drive / file storage integration** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | 106 | User shares Google Drive folder, preview appears in chat, file updates sync, collaborative editing link included |

---

## Monetization & Access Control

### Subscription & Billing Model

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Free tier** | ✅ Yes (forever) | ✅ Yes (forever) | ✅ Yes (forever) | ✅ Yes | ❌ 7-day trial | ✅ Yes | 91 | User creates account, all features free, no prompts to upgrade unless feature is paywall-locked |
| **Paid subscription tier (monthly)** | ❌ No | ✅ Yes (Telegram Premium) | ❌ No | ❌ No | ✅ Yes (Pro) | ❌ No | 92 | User subscribes to Premium ($5/mo), monthly charge auto-renews on card, subscription active immediately, can cancel anytime |
| **Trial period (free trial)** | ❌ No | ✅ 7 days (Premium) | ❌ No | ❌ No | ✅ 7 days (Pro) | ❌ No | 92 | User starts Pro trial, 7-day countdown shown, trial expires, subscription auto-converts to paid (with payment method), can cancel before conversion |
| **Proration (partial refund for mid-cycle upgrades)** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No | 92 | User on Free tier, upgrades to Pro on day 5 of cycle, pro-rated charge = $5 * (25/30), next charge day 1 of new cycle |
| **Graceful degradation (expired card)** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No | 92 | User's subscription payment fails, user moves to "Past Due" state, limited features (no creation), payment retried, success re-enables features |
| **One-time payments / credits** | ❌ No | ✅ Yes (in-app purchases) | ❌ No | ❌ No | ❌ No | ❌ No | 91 | Telegram: user purchases emoji pack for $0.99 via one-time IAP, emoji available immediately, not recurring |
| **Usage-metered billing (overage charges)** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes (per workspace overage) | ❌ No | 93 | User on Pro plan with 100 seats, adds 110 members, overage charges $5/seat/month, next invoice includes overage |

### Feature Paywall & Entitlements

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Feature gating by plan** | ❌ No | ✅ Yes (Premium features) | ❌ No | ❌ No | ✅ Yes (Pro features) | ❌ No | 94, 91 | Telegram Premium: advanced search available, free users see "upgrade to unlock" hint, clicking navigates to Premium offer |
| **Role-based paywall enforcement** | ❌ No | ❌ No | ❌ No | ✅ Yes (Nitro+ perks) | ✅ Yes (admin features) | ✅ Yes | 94, 61 | User attempts to create private channel without Pro, error "feature requires Pro", user can upgrade, after upgrade succeeds |
| **Channel-level access control** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes (paid channels) | ✅ Yes | 94 | Premium channel created, free users cannot join, join button shows "requires Pro", click redirects to upgrade, after purchase can join |
| **Bypass for workspace owners** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | 94 | Owner can use all features regardless of seat count, admin features unlimited, employees bound by their seat entitlement |
| **Entitlement revocation (downgrade)** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No | 91 | User on Pro downgrades to Free, advanced search disabled, user notified, chat history preserved, export available before loss |

### Crypto & Token-Gated Access

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Wallet connection (MetaMask / WalletConnect)** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | 27 | User clicks "Connect Wallet", WalletConnect flow opens, user approves in MetaMask, wallet address linked to account |
| **Token-gated channel access** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | 97 | Channel requires 1 NFT from collection X, user clicks join, wallet checked for NFT holdings, access granted if met, revoked if holdings drop |
| **NFT verification & proof-of-ownership** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | 28 | User claims NFT ownership, chain/collection/token ID verified, verified badge added to profile, can be revoked if transfer detected |
| **Crypto payment for subscription** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | 96 | User subscribes to Pro with cryptocurrency, invoice generated, user transfers amount to address, payment detected <5 confirmations, subscription activated |

---

## Compliance & Governance

### Data Retention & Deletion

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Message retention policy (configurable)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 68 | Admin sets retention to "30 days", messages older than 30d auto-deleted, policy applies to all channels, exceptions creatable |
| **Legal hold / preservation** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | 66, 68 | Admin marks user for legal hold, all messages preserved indefinitely, deletion blocked, hold status logged |
| **User data export (GDPR)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 69 | User requests GDPR export, system generates JSON/CSV of messages/metadata, downloaded within 30d, portable format |
| **Right to be forgotten / account deletion** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 69 | User requests deletion, account anonymized, all messages/metadata purged, deletion confirmed via email, no recovery possible |
| **Data deletion confirmation & retention proof** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | 69 | User deletes account, system generates deletion certificate with timestamp, audit log entry immutable, retention policy verified |

### Audit Logging & Compliance

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Admin audit log** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 67 | Admin views audit log, shows "User @alice added to #general by @bob at 2026-02-08 10:30 UTC", 1-year retention, exportable |
| **Security audit log** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | 67 | Security team views log, shows "Suspicious login from 1.2.3.4 blocked", login attempts, 2FA challenges, all logged |
| **Activity audit log (user actions)** | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | 67 | User activity logged: message posted, file uploaded, channel created, 90-day retention, queryable by user/timestamp/action |
| **Audit log search & export** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | 67 | Admin searches audit log "action=ban after:2026-02-01", results shown, selected logs exported as CSV for legal/compliance review |
| **Immutable audit records** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | 66, 67 | Audit logs append-only in database, no update/delete on records, tamper detection via cryptographic hash, evidence integrity preserved |

### Compliance Reporting

| Feature | WhatsApp | Telegram | Signal | Discord | Slack | Rocket.Chat | Task ID(s) | Acceptance Test |
|---------|----------|----------|--------|---------|-------|-------------|-----------|-----------------|
| **Compliance export (CCPA/GDPR)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | 69 | GDPR/CCPA export includes user data, messages, metadata, account info, all structured as JSON/CSV, downloadable, attachments optional |
| **Billing reconciliation reports** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes | 99 | Finance team exports billing report: invoice count, MRR, ARPU, churn rate, matches accounting ledger, signed audit trail |
| **Entitlement drift analysis** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No | 99 | System detects users with features above entitlement (overage), flags for reconciliation, billing adjustment applied, notification sent |

---

## Implementation Notes

### Task ID Mapping

All task IDs reference `.claude/TODO.md` tasks 31-147 (Phase C through Release). Each acceptance test is deterministic and runnable in automated test suites.

### Acceptance Test Properties

1. **Deterministic**: No wall-clock dependency, use fixed timestamps/IDs
2. **Isolated**: No external service calls without mocks
3. **Idempotent**: Repeat runs produce same result
4. **Cross-platform**: Works on web, mobile, desktop with platform-specific assertions
5. **Auditable**: Failure output includes file/line/timestamp for investigation

### Preset-Specific Behavior

Behaviors differ by preset (WhatsApp/Telegram/Signal/Discord/Slack/Rocket.Chat). Each feature row indicates which platforms implement it, and nChat's implementation matches the selected preset exactly.

### Key Assumptions

1. **Task completion enables multi-preset support** - Feature matrix applies to whichever presets nChat enables
2. **Feature parity measured by preset semantics** - E.g., Discord "stage channel" behavior differs from Slack "huddle", both in feature matrix
3. **Security baseline applies to all presets** - E2EE, audit logging, anti-abuse required universally (unless preset disables category)

---

## Next Steps

1. **Review & validate** this matrix with stakeholders and competitive research
2. **Map coverage gaps** - Identify features not yet in TODO.md, create new task IDs
3. **Prioritize by preset** - e.g., if "Signal preset" is priority, order Task IDs by Signal feature criticality
4. **Dependency chain** - Feed into Task 7 (dependency graph creation)

---

**Document Status**: CANONICAL - All future parity claims must reference this matrix with evidence from TODO.md and test results.
