# ɳChat Feature Parity Matrix

**Version**: 0.9.1
**Last Updated**: 2026-02-03
**Purpose**: Comprehensive feature comparison across messaging platforms

This document maps every feature to its implementation artifacts: UI components, API endpoints, database tables, realtime events, test coverage, and feature flags.

---

## Table of Contents

1. [Legend](#legend)
2. [Messaging Features](#1-messaging-features)
3. [Channel & Community Features](#2-channel--community-features)
4. [Presence & Status Features](#3-presence--status-features)
5. [Media Features](#4-media-features)
6. [Search Features](#5-search-features)
7. [Notification Features](#6-notification-features)
8. [Authentication Features](#7-authentication-features)
9. [End-to-End Encryption Features](#8-end-to-end-encryption-features)
10. [Moderation Features](#9-moderation-features)
11. [Billing & Monetization Features](#10-billing--monetization-features)
12. [Voice & Video Features](#11-voice--video-features)
13. [Live Streaming Features](#12-live-streaming-features)
14. [Integration Features](#13-integration-features)
15. [Admin & Analytics Features](#14-admin--analytics-features)
16. [Compliance Features](#15-compliance-features)
17. [Platform Support](#16-platform-support)

---

## Legend

| Symbol | Meaning               |
| ------ | --------------------- |
| **W**  | WhatsApp              |
| **T**  | Telegram              |
| **S**  | Slack                 |
| **D**  | Discord               |
| **N**  | ɳChat (All Features)  |
| Y      | Feature supported     |
| -      | Feature not supported |
| P      | Partial support       |

---

## 1. Messaging Features

### 1.1 Text Messaging

| Feature                       | W   | T   | S   | D   | N   | UI Component                      | API Endpoint               | DB Tables                               | Realtime Events   | Tests                  | Feature Flag         |
| ----------------------------- | --- | --- | --- | --- | --- | --------------------------------- | -------------------------- | --------------------------------------- | ----------------- | ---------------------- | -------------------- |
| Send text message             | Y   | Y   | Y   | Y   | Y   | `MessageInput`, `MessageComposer` | `POST /api/messages`       | `nchat_messages`                        | `message:created` | `messages.test.ts`     | `messaging.enabled`  |
| Edit message                  | Y   | Y   | Y   | Y   | Y   | `MessageEditForm`                 | `PATCH /api/messages/:id`  | `nchat_messages`, `nchat_message_edits` | `message:updated` | `messages.test.ts`     | `messaging.editing`  |
| Delete message                | Y   | Y   | Y   | Y   | Y   | `MessageActions`                  | `DELETE /api/messages/:id` | `nchat_messages`                        | `message:deleted` | `messages.test.ts`     | `messaging.deletion` |
| Message formatting (Markdown) | -   | Y   | Y   | Y   | Y   | `RichTextEditor` (TipTap)         | `POST /api/messages`       | `nchat_messages`                        | `message:created` | `rich-text.test.ts`    | `messaging.enabled`  |
| Code blocks                   | -   | Y   | Y   | Y   | Y   | `CodeBlock`                       | `POST /api/messages`       | `nchat_messages`                        | `message:created` | `code-blocks.test.ts`  | `messaging.enabled`  |
| Mentions (@user)              | Y   | Y   | Y   | Y   | Y   | `MentionSuggestions`              | `POST /api/messages`       | `nchat_messages`, `nchat_mentions`      | `mention:created` | `mentions.test.ts`     | `messaging.enabled`  |
| Channel mentions (@channel)   | -   | -   | Y   | Y   | Y   | `MentionSuggestions`              | `POST /api/messages`       | `nchat_messages`, `nchat_mentions`      | `mention:created` | `mentions.test.ts`     | `messaging.enabled`  |
| Link previews                 | Y   | Y   | Y   | Y   | Y   | `LinkPreview`                     | `GET /api/link-preview`    | `nchat_link_previews`                   | -                 | `link-preview.test.ts` | `messaging.enabled`  |

### 1.2 Message Interactions

| Feature                | W   | T   | S   | D   | N   | UI Component                    | API Endpoint                       | DB Tables                                | Realtime Events                      | Tests                  | Feature Flag            |
| ---------------------- | --- | --- | --- | --- | --- | ------------------------------- | ---------------------------------- | ---------------------------------------- | ------------------------------------ | ---------------------- | ----------------------- |
| Emoji reactions        | Y   | Y   | Y   | Y   | Y   | `ReactionPicker`, `ReactionBar` | `POST /api/messages/:id/reactions` | `nchat_reactions`                        | `reaction:added`, `reaction:removed` | `reactions.test.ts`    | `messaging.reactions`   |
| Custom emoji reactions | -   | Y   | Y   | Y   | Y   | `CustomEmojiPicker`             | `POST /api/messages/:id/reactions` | `nchat_reactions`, `nchat_custom_emojis` | `reaction:added`                     | `custom-emoji.test.ts` | `features.customEmojis` |
| Reply to message       | Y   | Y   | Y   | Y   | Y   | `ReplyPreview`, `MessageReply`  | `POST /api/messages`               | `nchat_messages`                         | `message:created`                    | `replies.test.ts`      | `messaging.replies`     |
| Quote message          | Y   | Y   | Y   | Y   | Y   | `QuoteBlock`                    | `POST /api/messages`               | `nchat_messages`                         | `message:created`                    | `quotes.test.ts`       | `messaging.replies`     |
| Forward message        | Y   | Y   | Y   | Y   | Y   | `ForwardModal`                  | `POST /api/messages/forward`       | `nchat_messages`, `nchat_forwards`       | `message:forwarded`                  | `forward.test.ts`      | `messaging.forwarding`  |
| Pin message            | -   | Y   | Y   | Y   | Y   | `PinnedMessages`                | `POST /api/messages/:id/pin`       | `nchat_pinned_messages`                  | `message:pinned`                     | `pinned.test.ts`       | `messaging.enabled`     |
| Bookmark message       | -   | Y   | Y   | Y   | Y   | `BookmarksList`                 | `POST /api/bookmarks`              | `nchat_bookmarks`                        | -                                    | `bookmarks.test.ts`    | `messaging.enabled`     |
| Star message           | Y   | Y   | Y   | -   | Y   | `StarredMessages`               | `POST /api/messages/:id/star`      | `nchat_starred_messages`                 | -                                    | `starred.test.ts`      | `messaging.enabled`     |

### 1.3 Threads & Replies

| Feature              | W   | T   | S   | D   | N   | UI Component                  | API Endpoint                        | DB Tables                         | Realtime Events                             | Tests             | Feature Flag        |
| -------------------- | --- | --- | --- | --- | --- | ----------------------------- | ----------------------------------- | --------------------------------- | ------------------------------------------- | ----------------- | ------------------- |
| Threaded replies     | -   | Y   | Y   | Y   | Y   | `ThreadView`, `ThreadSidebar` | `POST /api/threads/:id/messages`    | `nchat_messages`, `nchat_threads` | `thread:message:created`                    | `threads.test.ts` | `messaging.threads` |
| Thread participants  | -   | -   | Y   | Y   | Y   | `ThreadParticipants`          | `GET /api/threads/:id/participants` | `nchat_thread_participants`       | `thread:participant:joined`                 | `threads.test.ts` | `messaging.threads` |
| Thread notifications | -   | Y   | Y   | Y   | Y   | `ThreadNotificationSettings`  | `POST /api/threads/:id/subscribe`   | `nchat_thread_subscriptions`      | -                                           | `threads.test.ts` | `messaging.threads` |
| Reply in thread      | -   | Y   | Y   | Y   | Y   | `ThreadReplyButton`           | `POST /api/threads/:id/messages`    | `nchat_messages`                  | `thread:message:created`                    | `threads.test.ts` | `messaging.threads` |
| Also send to channel | -   | -   | Y   | -   | Y   | `ThreadReplyOptions`          | `POST /api/threads/:id/messages`    | `nchat_messages`                  | `message:created`, `thread:message:created` | `threads.test.ts` | `messaging.threads` |

### 1.4 Advanced Messaging

| Feature               | W   | T   | S   | D   | N   | UI Component                 | API Endpoint                          | DB Tables                                               | Realtime Events     | Tests                  | Feature Flag             |
| --------------------- | --- | --- | --- | --- | --- | ---------------------------- | ------------------------------------- | ------------------------------------------------------- | ------------------- | ---------------------- | ------------------------ |
| Scheduled messages    | Y   | Y   | Y   | -   | Y   | `ScheduleMessageModal`       | `POST /api/messages/schedule`         | `nchat_scheduled_messages`                              | `message:scheduled` | `scheduled.test.ts`    | `messaging.scheduling`   |
| Disappearing messages | Y   | Y   | Y   | -   | Y   | `DisappearingSettings`       | `POST /api/channels/:id/disappearing` | `nchat_disappearing_settings`                           | `message:expired`   | `disappearing.test.ts` | `messaging.disappearing` |
| Message expiry timer  | Y   | Y   | -   | -   | Y   | `ExpiryTimer`                | `POST /api/messages`                  | `nchat_messages`                                        | `message:expired`   | `expiry.test.ts`       | `messaging.disappearing` |
| Edit history          | -   | Y   | Y   | Y   | Y   | `EditHistoryModal`           | `GET /api/messages/:id/history`       | `nchat_message_edits`                                   | -                   | `edit-history.test.ts` | `messaging.editing`      |
| Message translations  | -   | Y   | -   | -   | Y   | `TranslateButton`            | `POST /api/translate`                 | `nchat_translations`                                    | -                   | `translate.test.ts`    | `messaging.enabled`      |
| Polls                 | -   | Y   | Y   | Y   | Y   | `PollCreator`, `PollDisplay` | `POST /api/polls`                     | `nchat_polls`, `nchat_poll_options`, `nchat_poll_votes` | `poll:vote:added`   | `polls.test.ts`        | `messaging.enabled`      |
| Quiz mode polls       | -   | Y   | -   | -   | Y   | `QuizPoll`                   | `POST /api/polls`                     | `nchat_polls`                                           | `poll:answered`     | `polls.test.ts`        | `messaging.enabled`      |

---

## 2. Channel & Community Features

### 2.1 Channel Types

| Feature               | W   | T   | S   | D   | N   | UI Component                    | API Endpoint              | DB Tables                                        | Realtime Events   | Tests                  | Feature Flag              |
| --------------------- | --- | --- | --- | --- | --- | ------------------------------- | ------------------------- | ------------------------------------------------ | ----------------- | ---------------------- | ------------------------- |
| Public channels       | -   | Y   | Y   | Y   | Y   | `ChannelList`, `ChannelBrowser` | `POST /api/channels`      | `nchat_channels`                                 | `channel:created` | `channels.test.ts`     | `channels.public`         |
| Private channels      | Y   | Y   | Y   | Y   | Y   | `PrivateChannelModal`           | `POST /api/channels`      | `nchat_channels`                                 | `channel:created` | `channels.test.ts`     | `channels.private`        |
| Direct messages (1:1) | Y   | Y   | Y   | Y   | Y   | `DMList`, `DirectMessage`       | `POST /api/dms`           | `nchat_direct_messages`, `nchat_dm_participants` | `dm:created`      | `dms.test.ts`          | `channels.directMessages` |
| Group DMs             | Y   | Y   | -   | Y   | Y   | `GroupDMModal`                  | `POST /api/dms`           | `nchat_direct_messages`, `nchat_dm_participants` | `dm:created`      | `dms.test.ts`          | `channels.groupDms`       |
| Broadcast channels    | Y   | Y   | -   | Y   | Y   | `BroadcastChannel`              | `POST /api/channels`      | `nchat_channels`                                 | `channel:created` | `broadcast.test.ts`    | `channels.public`         |
| Announcement channels | -   | -   | -   | Y   | Y   | `AnnouncementChannel`           | `POST /api/channels`      | `nchat_channels`                                 | `channel:created` | `announcement.test.ts` | `channels.public`         |
| Read-only channels    | -   | Y   | -   | Y   | Y   | `ReadOnlyBadge`                 | `PATCH /api/channels/:id` | `nchat_channels`                                 | `channel:updated` | `channels.test.ts`     | `channels.public`         |

### 2.2 Channel Organization

| Feature              | W   | T   | S   | D   | N   | UI Component                     | API Endpoint                     | DB Tables          | Realtime Events     | Tests                | Feature Flag          |
| -------------------- | --- | --- | --- | --- | --- | -------------------------------- | -------------------------------- | ------------------ | ------------------- | -------------------- | --------------------- |
| Categories/Sections  | -   | -   | Y   | Y   | Y   | `CategoryList`, `CategoryEditor` | `POST /api/categories`           | `nchat_categories` | `category:created`  | `categories.test.ts` | `channels.categories` |
| Channel ordering     | -   | -   | Y   | Y   | Y   | `DraggableChannel`               | `PATCH /api/channels/:id/order`  | `nchat_channels`   | `channel:reordered` | `order.test.ts`      | `channels.categories` |
| Channel descriptions | -   | Y   | Y   | Y   | Y   | `ChannelHeader`                  | `PATCH /api/channels/:id`        | `nchat_channels`   | `channel:updated`   | `channels.test.ts`   | `channels.public`     |
| Channel topics       | -   | -   | Y   | Y   | Y   | `ChannelTopic`                   | `PATCH /api/channels/:id`        | `nchat_channels`   | `channel:updated`   | `channels.test.ts`   | `channels.public`     |
| Channel icons        | -   | Y   | Y   | Y   | Y   | `ChannelIconPicker`              | `PATCH /api/channels/:id`        | `nchat_channels`   | `channel:updated`   | `channels.test.ts`   | `channels.public`     |
| Channel archive      | -   | -   | Y   | Y   | Y   | `ArchiveChannelButton`           | `POST /api/channels/:id/archive` | `nchat_channels`   | `channel:archived`  | `archive.test.ts`    | `channels.public`     |

### 2.3 Community/Server Structures

| Feature              | W   | T   | S   | D   | N   | UI Component                  | API Endpoint                  | DB Tables                | Realtime Events     | Tests                 | Feature Flag          |
| -------------------- | --- | --- | --- | --- | --- | ----------------------------- | ----------------------------- | ------------------------ | ------------------- | --------------------- | --------------------- |
| Servers/Workspaces   | -   | -   | Y   | Y   | Y   | `ServerSidebar`, `ServerList` | `POST /api/servers`           | `nchat_servers`          | `server:created`    | `servers.test.ts`     | `servers.enabled`     |
| Server templates     | -   | -   | -   | Y   | Y   | `ServerTemplates`             | `POST /api/servers/templates` | `nchat_server_templates` | -                   | `templates.test.ts`   | `servers.enabled`     |
| Server discovery     | -   | -   | -   | Y   | Y   | `ServerBrowser`               | `GET /api/servers/discover`   | `nchat_servers`          | -                   | `discovery.test.ts`   | `servers.enabled`     |
| WhatsApp Communities | Y   | -   | -   | -   | Y   | `CommunityView`               | `POST /api/communities`       | `nchat_communities`      | `community:created` | `communities.test.ts` | `communities.enabled` |
| Telegram Supergroups | -   | Y   | -   | -   | Y   | `SupergroupSettings`          | `PATCH /api/channels/:id`     | `nchat_channels`         | `channel:upgraded`  | `supergroups.test.ts` | `channels.public`     |

### 2.4 Membership & Invites

| Feature             | W   | T   | S   | D   | N   | UI Component         | API Endpoint                               | DB Tables               | Realtime Events  | Tests             | Feature Flag           |
| ------------------- | --- | --- | --- | --- | --- | -------------------- | ------------------------------------------ | ----------------------- | ---------------- | ----------------- | ---------------------- |
| Invite links        | Y   | Y   | Y   | Y   | Y   | `InviteLinkModal`    | `POST /api/invites`                        | `nchat_invites`         | -                | `invites.test.ts` | `features.inviteLinks` |
| Invite link expiry  | Y   | Y   | Y   | Y   | Y   | `InviteExpiryPicker` | `POST /api/invites`                        | `nchat_invites`         | -                | `invites.test.ts` | `features.inviteLinks` |
| Invite usage limits | Y   | Y   | Y   | Y   | Y   | `InviteLimitInput`   | `POST /api/invites`                        | `nchat_invites`         | -                | `invites.test.ts` | `features.inviteLinks` |
| Member directory    | -   | -   | Y   | Y   | Y   | `MemberList`         | `GET /api/channels/:id/members`            | `nchat_channel_members` | `member:joined`  | `members.test.ts` | `channels.public`      |
| Kick member         | Y   | Y   | Y   | Y   | Y   | `MemberActions`      | `DELETE /api/channels/:id/members/:userId` | `nchat_channel_members` | `member:removed` | `members.test.ts` | `channels.public`      |
| Ban member          | -   | Y   | Y   | Y   | Y   | `BanModal`           | `POST /api/channels/:id/bans`              | `nchat_bans`            | `member:banned`  | `bans.test.ts`    | `channels.public`      |
| Mute member         | Y   | Y   | Y   | Y   | Y   | `MuteModal`          | `POST /api/channels/:id/mutes`             | `nchat_mutes`           | `member:muted`   | `mutes.test.ts`   | `channels.public`      |

---

## 3. Presence & Status Features

### 3.1 Online Status

| Feature               | W   | T   | S   | D   | N   | UI Component         | API Endpoint                  | DB Tables             | Realtime Events    | Tests              | Feature Flag       |
| --------------------- | --- | --- | --- | --- | --- | -------------------- | ----------------------------- | --------------------- | ------------------ | ------------------ | ------------------ |
| Online/Offline status | Y   | Y   | Y   | Y   | Y   | `PresenceIndicator`  | `POST /api/presence`          | `nchat_presence`      | `presence:updated` | `presence.test.ts` | `presence.enabled` |
| Away status           | -   | -   | Y   | Y   | Y   | `StatusSelector`     | `POST /api/presence`          | `nchat_presence`      | `presence:updated` | `presence.test.ts` | `presence.enabled` |
| Do Not Disturb        | -   | -   | Y   | Y   | Y   | `DNDSettings`        | `POST /api/presence`          | `nchat_presence`      | `presence:updated` | `presence.test.ts` | `presence.enabled` |
| Invisible mode        | -   | -   | -   | Y   | Y   | `InvisibleToggle`    | `POST /api/presence`          | `nchat_presence`      | -                  | `presence.test.ts` | `presence.enabled` |
| Custom status text    | -   | -   | Y   | Y   | Y   | `CustomStatusInput`  | `POST /api/presence`          | `nchat_presence`      | `presence:updated` | `presence.test.ts` | `presence.enabled` |
| Status emoji          | -   | -   | Y   | Y   | Y   | `StatusEmojiPicker`  | `POST /api/presence`          | `nchat_presence`      | `presence:updated` | `presence.test.ts` | `presence.enabled` |
| Status expiry         | -   | -   | Y   | Y   | Y   | `StatusExpiryPicker` | `POST /api/presence`          | `nchat_presence`      | `presence:expired` | `presence.test.ts` | `presence.enabled` |
| Last seen             | Y   | Y   | -   | -   | Y   | `LastSeen`           | `GET /api/users/:id/presence` | `nchat_presence`      | -                  | `presence.test.ts` | `presence.enabled` |
| Hide last seen        | Y   | Y   | -   | -   | Y   | `PrivacySettings`    | `PATCH /api/settings`         | `nchat_user_settings` | -                  | `privacy.test.ts`  | `presence.enabled` |

### 3.2 Typing & Activity

| Feature            | W   | T   | S   | D   | N   | UI Component      | API Endpoint                       | DB Tables                 | Realtime Events                    | Tests              | Feature Flag       |
| ------------------ | --- | --- | --- | --- | --- | ----------------- | ---------------------------------- | ------------------------- | ---------------------------------- | ------------------ | ------------------ |
| Typing indicators  | Y   | Y   | Y   | Y   | Y   | `TypingIndicator` | -                                  | -                         | `typing:started`, `typing:stopped` | `typing.test.ts`   | `presence.enabled` |
| Read receipts      | Y   | Y   | -   | -   | Y   | `ReadReceipts`    | `POST /api/messages/:id/read`      | `nchat_read_receipts`     | `message:read`                     | `receipts.test.ts` | `presence.enabled` |
| Delivery receipts  | Y   | Y   | -   | -   | Y   | `DeliveryStatus`  | `POST /api/messages/:id/delivered` | `nchat_delivery_receipts` | `message:delivered`                | `receipts.test.ts` | `presence.enabled` |
| Blue ticks         | Y   | -   | -   | -   | Y   | `MessageStatus`   | `GET /api/messages/:id/status`     | `nchat_read_receipts`     | `message:read`                     | `receipts.test.ts` | `presence.enabled` |
| Who's online count | -   | -   | Y   | Y   | Y   | `OnlineCount`     | `GET /api/channels/:id/presence`   | `nchat_presence`          | `presence:updated`                 | `presence.test.ts` | `presence.enabled` |

---

## 4. Media Features

### 4.1 Image & Photo

| Feature              | W   | T   | S   | D   | N   | UI Component                        | API Endpoint                  | DB Tables                               | Realtime Events       | Tests                 | Feature Flag         |
| -------------------- | --- | --- | --- | --- | --- | ----------------------------------- | ----------------------------- | --------------------------------------- | --------------------- | --------------------- | -------------------- |
| Image upload         | Y   | Y   | Y   | Y   | Y   | `ImageUploader`, `AttachmentButton` | `POST /api/storage`           | `nchat_attachments`                     | `attachment:uploaded` | `upload.test.ts`      | `media.imageUploads` |
| Image preview        | Y   | Y   | Y   | Y   | Y   | `ImagePreview`, `Lightbox`          | `GET /api/storage/:id`        | `nchat_attachments`                     | -                     | `preview.test.ts`     | `media.imageUploads` |
| Image gallery        | Y   | Y   | Y   | Y   | Y   | `MediaGallery`                      | `GET /api/channels/:id/media` | `nchat_attachments`                     | -                     | `gallery.test.ts`     | `media.imageUploads` |
| Image compression    | Y   | Y   | Y   | Y   | Y   | -                                   | `POST /api/storage`           | `nchat_attachments`                     | -                     | `compression.test.ts` | `media.imageUploads` |
| EXIF stripping       | Y   | Y   | Y   | Y   | Y   | -                                   | `POST /api/storage`           | `nchat_attachments`                     | -                     | `exif.test.ts`        | `media.imageUploads` |
| Thumbnail generation | Y   | Y   | Y   | Y   | Y   | -                                   | `POST /api/storage`           | `nchat_attachments`, `nchat_thumbnails` | -                     | `thumbnails.test.ts`  | `media.imageUploads` |
| GIF support          | Y   | Y   | Y   | Y   | Y   | `GifPicker`                         | `GET /api/gif`                | -                                       | -                     | `gif.test.ts`         | `features.gifs`      |
| Stickers             | Y   | Y   | -   | Y   | Y   | `StickerPicker`                     | `GET /api/stickers`           | `nchat_sticker_packs`, `nchat_stickers` | -                     | `stickers.test.ts`    | `features.stickers`  |

### 4.2 Video & Audio

| Feature          | W   | T   | S   | D   | N   | UI Component                   | API Endpoint                    | DB Tables                               | Realtime Events       | Tests                | Feature Flag          |
| ---------------- | --- | --- | --- | --- | --- | ------------------------------ | ------------------------------- | --------------------------------------- | --------------------- | -------------------- | --------------------- |
| Video upload     | Y   | Y   | Y   | Y   | Y   | `VideoUploader`                | `POST /api/storage`             | `nchat_attachments`                     | `attachment:uploaded` | `upload.test.ts`     | `media.videoUploads`  |
| Video playback   | Y   | Y   | Y   | Y   | Y   | `VideoPlayer`                  | `GET /api/storage/:id`          | `nchat_attachments`                     | -                     | `video.test.ts`      | `media.videoUploads`  |
| Video thumbnails | Y   | Y   | Y   | Y   | Y   | -                              | `POST /api/storage`             | `nchat_attachments`, `nchat_thumbnails` | -                     | `thumbnails.test.ts` | `media.videoUploads`  |
| Audio upload     | Y   | Y   | Y   | Y   | Y   | `AudioUploader`                | `POST /api/storage`             | `nchat_attachments`                     | `attachment:uploaded` | `upload.test.ts`     | `media.fileUploads`   |
| Audio playback   | Y   | Y   | Y   | Y   | Y   | `AudioPlayer`                  | `GET /api/storage/:id`          | `nchat_attachments`                     | -                     | `audio.test.ts`      | `media.fileUploads`   |
| Voice messages   | Y   | Y   | -   | -   | Y   | `VoiceRecorder`, `VoicePlayer` | `POST /api/storage`             | `nchat_attachments`                     | `attachment:uploaded` | `voice.test.ts`      | `voice.voiceMessages` |
| Voice waveform   | Y   | Y   | -   | -   | Y   | `Waveform`                     | `GET /api/storage/:id/waveform` | `nchat_attachments`                     | -                     | `waveform.test.ts`   | `voice.voiceMessages` |

### 4.3 File Management

| Feature                   | W   | T   | S   | D   | N   | UI Component                       | API Endpoint                    | DB Tables           | Realtime Events       | Tests              | Feature Flag               |
| ------------------------- | --- | --- | --- | --- | --- | ---------------------------------- | ------------------------------- | ------------------- | --------------------- | ------------------ | -------------------------- |
| File upload               | Y   | Y   | Y   | Y   | Y   | `FileUploader`, `AttachmentButton` | `POST /api/storage`             | `nchat_attachments` | `attachment:uploaded` | `upload.test.ts`   | `media.fileUploads`        |
| File download             | Y   | Y   | Y   | Y   | Y   | `DownloadButton`                   | `GET /api/storage/:id/download` | `nchat_attachments` | -                     | `download.test.ts` | `media.fileUploads`        |
| File size limits          | Y   | Y   | Y   | Y   | Y   | `FileSizeError`                    | `POST /api/storage`             | -                   | -                     | `limits.test.ts`   | `media.maxFileSize`        |
| File type restrictions    | Y   | Y   | Y   | Y   | Y   | `FileTypeError`                    | `POST /api/storage`             | -                   | -                     | `types.test.ts`    | `media.allowedTypes`       |
| Virus scanning            | -   | Y   | Y   | Y   | Y   | -                                  | `POST /api/storage`             | `nchat_attachments` | -                     | `virus.test.ts`    | `media.fileUploads`        |
| File previews             | -   | Y   | Y   | Y   | Y   | `FilePreview`                      | `GET /api/storage/:id/preview`  | `nchat_attachments` | -                     | `preview.test.ts`  | `media.fileUploads`        |
| Cloud storage integration | -   | -   | Y   | -   | Y   | `CloudStoragePicker`               | `POST /api/integrations/drive`  | `nchat_attachments` | -                     | `drive.test.ts`    | `integrations.googleDrive` |

---

## 5. Search Features

| Feature                | W   | T   | S   | D   | N   | UI Component                 | API Endpoint                               | DB Tables                             | Realtime Events | Tests                 | Feature Flag      |
| ---------------------- | --- | --- | --- | --- | --- | ---------------------------- | ------------------------------------------ | ------------------------------------- | --------------- | --------------------- | ----------------- |
| Message search         | Y   | Y   | Y   | Y   | Y   | `SearchBar`, `SearchResults` | `GET /api/search`                          | `nchat_messages` (MeiliSearch)        | -               | `search.test.ts`      | `features.search` |
| Search filters         | -   | Y   | Y   | Y   | Y   | `SearchFilters`              | `GET /api/search`                          | -                                     | -               | `filters.test.ts`     | `features.search` |
| Search in channel      | Y   | Y   | Y   | Y   | Y   | `ChannelSearch`              | `GET /api/search?channel=:id`              | `nchat_messages`                      | -               | `search.test.ts`      | `features.search` |
| Search from user       | Y   | Y   | Y   | Y   | Y   | `UserFilter`                 | `GET /api/search?from=:id`                 | `nchat_messages`                      | -               | `search.test.ts`      | `features.search` |
| Search date range      | -   | Y   | Y   | Y   | Y   | `DateRangePicker`            | `GET /api/search?after=:date&before=:date` | `nchat_messages`                      | -               | `search.test.ts`      | `features.search` |
| Search with attachment | -   | Y   | Y   | Y   | Y   | `HasAttachmentFilter`        | `GET /api/search?hasAttachment=true`       | `nchat_messages`, `nchat_attachments` | -               | `search.test.ts`      | `features.search` |
| Search suggestions     | -   | Y   | Y   | Y   | Y   | `SearchSuggestions`          | `GET /api/search/suggestions`              | -                                     | -               | `suggestions.test.ts` | `features.search` |
| User search            | Y   | Y   | Y   | Y   | Y   | `UserSearch`                 | `GET /api/users`                           | `nchat_users`                         | -               | `users.test.ts`       | `features.search` |
| Channel search         | -   | Y   | Y   | Y   | Y   | `ChannelBrowser`             | `GET /api/channels`                        | `nchat_channels`                      | -               | `channels.test.ts`    | `features.search` |
| File search            | -   | Y   | Y   | Y   | Y   | `FileSearch`                 | `GET /api/search?type=file`                | `nchat_attachments`                   | -               | `files.test.ts`       | `features.search` |
| AI-powered search      | -   | -   | Y   | -   | Y   | `AISearch`                   | `GET /api/ai/search`                       | `nchat_embeddings`                    | -               | `ai-search.test.ts`   | `ai.search`       |
| Semantic search        | -   | -   | -   | -   | Y   | `SemanticSearch`             | `GET /api/ai/search`                       | `nchat_embeddings`                    | -               | `semantic.test.ts`    | `ai.search`       |

---

## 6. Notification Features

| Feature                  | W   | T   | S   | D   | N   | UI Component                              | API Endpoint                        | DB Tables                  | Realtime Events        | Tests                   | Feature Flag            |
| ------------------------ | --- | --- | --- | --- | --- | ----------------------------------------- | ----------------------------------- | -------------------------- | ---------------------- | ----------------------- | ----------------------- |
| Push notifications       | Y   | Y   | Y   | Y   | Y   | `PushSettings`                            | `POST /api/notifications/subscribe` | `nchat_push_subscriptions` | -                      | `push.test.ts`          | `notifications.push`    |
| Email notifications      | -   | Y   | Y   | Y   | Y   | `EmailSettings`                           | `PATCH /api/settings`               | `nchat_user_settings`      | -                      | `email.test.ts`         | `notifications.email`   |
| In-app notifications     | Y   | Y   | Y   | Y   | Y   | `NotificationCenter`, `NotificationToast` | `GET /api/notifications`            | `nchat_notifications`      | `notification:created` | `notifications.test.ts` | `notifications.enabled` |
| Notification preferences | Y   | Y   | Y   | Y   | Y   | `NotificationSettings`                    | `PATCH /api/settings`               | `nchat_user_settings`      | -                      | `settings.test.ts`      | `notifications.enabled` |
| Mute channel             | Y   | Y   | Y   | Y   | Y   | `ChannelMuteButton`                       | `POST /api/channels/:id/mute`       | `nchat_channel_settings`   | -                      | `mute.test.ts`          | `notifications.enabled` |
| Mute duration            | Y   | Y   | Y   | Y   | Y   | `MuteDurationPicker`                      | `POST /api/channels/:id/mute`       | `nchat_channel_settings`   | -                      | `mute.test.ts`          | `notifications.enabled` |
| DND/Quiet hours          | Y   | Y   | Y   | Y   | Y   | `QuietHoursSettings`                      | `PATCH /api/settings`               | `nchat_user_settings`      | -                      | `dnd.test.ts`           | `notifications.enabled` |
| Mention notifications    | Y   | Y   | Y   | Y   | Y   | `MentionNotification`                     | -                                   | `nchat_notifications`      | `notification:mention` | `mentions.test.ts`      | `notifications.enabled` |
| Digest notifications     | -   | -   | Y   | -   | Y   | `DigestSettings`                          | `PATCH /api/settings`               | `nchat_user_settings`      | -                      | `digest.test.ts`        | `notifications.email`   |
| Reminders                | -   | Y   | Y   | -   | Y   | `ReminderModal`                           | `POST /api/reminders`               | `nchat_reminders`          | `reminder:triggered`   | `reminders.test.ts`     | `notifications.enabled` |

---

## 7. Authentication Features

### 7.1 Basic Authentication

| Feature              | W   | T   | S   | D   | N   | UI Component        | API Endpoint                    | DB Tables               | Realtime Events | Tests                | Feature Flag                               |
| -------------------- | --- | --- | --- | --- | --- | ------------------- | ------------------------------- | ----------------------- | --------------- | -------------------- | ------------------------------------------ |
| Email/Password login | -   | -   | Y   | Y   | Y   | `LoginForm`         | `POST /api/auth/signin`         | `nchat_users`           | -               | `auth.test.ts`       | `authProviders.emailPassword`              |
| Phone number login   | Y   | Y   | -   | -   | Y   | `PhoneLoginForm`    | `POST /api/auth/phone`          | `nchat_users`           | -               | `phone.test.ts`      | `authProviders.phone`                      |
| Magic links          | -   | -   | Y   | -   | Y   | `MagicLinkForm`     | `POST /api/auth/magic-link`     | `nchat_magic_links`     | -               | `magic-link.test.ts` | `authProviders.magicLinks`                 |
| Password reset       | -   | -   | Y   | Y   | Y   | `ResetPasswordForm` | `POST /api/auth/reset-password` | `nchat_password_resets` | -               | `reset.test.ts`      | `authProviders.emailPassword`              |
| Email verification   | -   | -   | Y   | Y   | Y   | `VerifyEmailPage`   | `POST /api/auth/verify-email`   | `nchat_users`           | -               | `verify.test.ts`     | `authPermissions.requireEmailVerification` |
| Sign up              | -   | -   | Y   | Y   | Y   | `SignUpForm`        | `POST /api/auth/signup`         | `nchat_users`           | -               | `signup.test.ts`     | `authProviders.emailPassword`              |

### 7.2 OAuth Providers

| Feature            | W   | T   | S   | D   | N   | UI Component          | API Endpoint                                    | DB Tables                                          | Realtime Events | Tests           | Feature Flag                 |
| ------------------ | --- | --- | --- | --- | --- | --------------------- | ----------------------------------------------- | -------------------------------------------------- | --------------- | --------------- | ---------------------------- |
| Google OAuth       | -   | -   | Y   | -   | Y   | `GoogleLoginButton`   | `GET /api/auth/oauth/connect?provider=google`   | `nchat_oauth_accounts`                             | -               | `oauth.test.ts` | `authProviders.google`       |
| GitHub OAuth       | -   | -   | -   | -   | Y   | `GitHubLoginButton`   | `GET /api/auth/oauth/connect?provider=github`   | `nchat_oauth_accounts`                             | -               | `oauth.test.ts` | `authProviders.github`       |
| Facebook OAuth     | -   | -   | -   | -   | Y   | `FacebookLoginButton` | `GET /api/auth/oauth/connect?provider=facebook` | `nchat_oauth_accounts`                             | -               | `oauth.test.ts` | `authProviders.facebook`     |
| Discord OAuth      | -   | -   | -   | Y   | Y   | `DiscordLoginButton`  | `GET /api/auth/oauth/connect?provider=discord`  | `nchat_oauth_accounts`                             | -               | `oauth.test.ts` | `authProviders.discord`      |
| Slack OAuth        | -   | -   | Y   | -   | Y   | `SlackLoginButton`    | `GET /api/auth/oauth/connect?provider=slack`    | `nchat_oauth_accounts`                             | -               | `oauth.test.ts` | `authProviders.slack`        |
| Twitter/X OAuth    | -   | -   | -   | -   | Y   | `TwitterLoginButton`  | `GET /api/auth/oauth/connect?provider=twitter`  | `nchat_oauth_accounts`                             | -               | `oauth.test.ts` | `authProviders.twitter`      |
| ID.me verification | -   | -   | -   | -   | Y   | `IDmeButton`          | `GET /api/auth/oauth/connect?provider=idme`     | `nchat_oauth_accounts`, `nchat_idme_verifications` | -               | `idme.test.ts`  | `authProviders.idme.enabled` |

### 7.3 Enterprise SSO

| Feature          | W   | T   | S   | D   | N   | UI Component      | API Endpoint                | DB Tables                  | Realtime Events | Tests           | Feature Flag                      |
| ---------------- | --- | --- | --- | --- | --- | ----------------- | --------------------------- | -------------------------- | --------------- | --------------- | --------------------------------- |
| SAML SSO         | -   | -   | Y   | -   | Y   | `SAMLLoginButton` | `GET /api/auth/saml`        | `nchat_sso_configurations` | -               | `saml.test.ts`  | `enterprise.sso.enabled`          |
| OIDC SSO         | -   | -   | Y   | -   | Y   | `OIDCLoginButton` | `GET /api/auth/oidc`        | `nchat_sso_configurations` | -               | `oidc.test.ts`  | `enterprise.sso.enabled`          |
| Okta integration | -   | -   | Y   | -   | Y   | `OktaConfig`      | `POST /api/admin/sso/okta`  | `nchat_sso_configurations` | -               | `okta.test.ts`  | `enterprise.sso.allowedProviders` |
| Azure AD         | -   | -   | Y   | -   | Y   | `AzureADConfig`   | `POST /api/admin/sso/azure` | `nchat_sso_configurations` | -               | `azure.test.ts` | `enterprise.sso.allowedProviders` |
| JIT provisioning | -   | -   | Y   | -   | Y   | `JITSettings`     | `PATCH /api/admin/sso`      | `nchat_sso_configurations` | -               | `jit.test.ts`   | `enterprise.sso.jitProvisioning`  |

### 7.4 Security Features

| Feature                | W   | T   | S   | D   | N   | UI Component                        | API Endpoint                        | DB Tables               | Realtime Events   | Tests              | Feature Flag                 |
| ---------------------- | --- | --- | --- | --- | --- | ----------------------------------- | ----------------------------------- | ----------------------- | ----------------- | ------------------ | ---------------------------- |
| Two-factor auth (TOTP) | -   | Y   | Y   | Y   | Y   | `TwoFactorSetup`, `TwoFactorVerify` | `POST /api/auth/2fa/setup`          | `nchat_2fa_secrets`     | -                 | `2fa.test.ts`      | `security.twoFactor`         |
| Backup codes           | -   | Y   | Y   | Y   | Y   | `BackupCodes`                       | `POST /api/auth/2fa/backup-codes`   | `nchat_backup_codes`    | -                 | `backup.test.ts`   | `security.twoFactor`         |
| Session management     | -   | Y   | Y   | Y   | Y   | `SessionList`                       | `GET /api/auth/sessions`            | `nchat_sessions`        | -                 | `sessions.test.ts` | `security.sessionManagement` |
| Trusted devices        | -   | Y   | Y   | Y   | Y   | `TrustedDevices`                    | `GET /api/auth/2fa/trusted-devices` | `nchat_trusted_devices` | -                 | `devices.test.ts`  | `security.twoFactor`         |
| Login history          | -   | Y   | Y   | Y   | Y   | `LoginHistory`                      | `GET /api/auth/sessions/activity`   | `nchat_login_history`   | -                 | `history.test.ts`  | `security.sessionManagement` |
| Force logout           | -   | Y   | Y   | Y   | Y   | `LogoutAllButton`                   | `DELETE /api/auth/sessions`         | `nchat_sessions`        | `session:revoked` | `logout.test.ts`   | `security.sessionManagement` |

---

## 8. End-to-End Encryption Features

| Feature             | W   | T   | S   | D   | N   | UI Component                         | API Endpoint                          | DB Tables             | Realtime Events | Tests               | Feature Flag                           |
| ------------------- | --- | --- | --- | --- | --- | ------------------------------------ | ------------------------------------- | --------------------- | --------------- | ------------------- | -------------------------------------- |
| E2EE initialization | Y   | Y   | -   | -   | Y   | `E2EESetup`                          | `POST /api/e2ee/initialize`           | `nchat_e2ee_keys`     | -               | `e2ee.test.ts`      | `security.e2eEncryption`               |
| Key generation      | Y   | Y   | -   | -   | Y   | -                                    | `POST /api/e2ee/keys/generate`        | `nchat_e2ee_keys`     | -               | `keys.test.ts`      | `security.e2eEncryption`               |
| Key exchange        | Y   | Y   | -   | -   | Y   | -                                    | `POST /api/e2ee/keys/exchange`        | `nchat_e2ee_sessions` | -               | `exchange.test.ts`  | `security.e2eEncryption`               |
| Key replenishment   | Y   | Y   | -   | -   | Y   | -                                    | `POST /api/e2ee/keys/replenish`       | `nchat_e2ee_keys`     | -               | `replenish.test.ts` | `security.e2eEncryption`               |
| Safety numbers      | Y   | Y   | -   | -   | Y   | `SafetyNumberView`, `SafetyNumberQR` | `GET /api/e2ee/safety-number/:userId` | `nchat_e2ee_sessions` | -               | `safety.test.ts`    | `encryption.enableSafetyNumbers`       |
| Key backup          | Y   | Y   | -   | -   | Y   | `KeyBackupSetup`                     | `POST /api/e2ee/backup`               | `nchat_e2ee_backups`  | -               | `backup.test.ts`    | `security.e2eEncryption`               |
| Key recovery        | Y   | Y   | -   | -   | Y   | `KeyRecoveryFlow`                    | `POST /api/e2ee/recover`              | `nchat_e2ee_keys`     | -               | `recovery.test.ts`  | `security.e2eEncryption`               |
| Device verification | Y   | Y   | -   | -   | Y   | `DeviceVerification`                 | `POST /api/e2ee/devices/verify`       | `nchat_e2ee_devices`  | -               | `devices.test.ts`   | `encryption.requireDeviceVerification` |
| Key rotation        | Y   | -   | -   | -   | Y   | -                                    | `POST /api/e2ee/keys/rotate`          | `nchat_e2ee_keys`     | -               | `rotation.test.ts`  | `encryption.automaticKeyRotation`      |
| Secret chats        | -   | Y   | -   | -   | Y   | `SecretChatBadge`                    | `POST /api/e2ee/secret-chat`          | `nchat_secret_chats`  | -               | `secret.test.ts`    | `security.e2eEncryption`               |

### 8.1 Device Security

| Feature                    | W   | T   | S   | D   | N   | UI Component       | API Endpoint          | DB Tables             | Realtime Events | Tests                       | Feature Flag             |
| -------------------------- | --- | --- | --- | --- | --- | ------------------ | --------------------- | --------------------- | --------------- | --------------------------- | ------------------------ |
| PIN lock                   | Y   | Y   | -   | -   | Y   | `PINLockScreen`    | -                     | - (local)             | -               | `pin-lock.test.ts`          | `security.pinLock`       |
| Biometric lock             | Y   | Y   | -   | -   | Y   | `BiometricPrompt`  | -                     | - (local)             | -               | `biometric.test.ts`         | `security.biometricLock` |
| Auto-lock timeout          | Y   | Y   | -   | -   | Y   | `AutoLockSettings` | `PATCH /api/settings` | `nchat_user_settings` | -               | `auto-lock.test.ts`         | `security.pinLock`       |
| Wipe after failed attempts | Y   | Y   | -   | -   | Y   | `WipeSettings`     | `PATCH /api/settings` | `nchat_user_settings` | -               | `wipe.test.ts`              | `security.pinLock`       |
| Encrypted local storage    | Y   | Y   | -   | -   | Y   | -                  | -                     | - (local)             | -               | `encrypted-storage.test.ts` | `security.e2eEncryption` |

---

## 9. Moderation Features

### 9.1 Content Moderation

| Feature            | W   | T   | S   | D   | N   | UI Component           | API Endpoint                 | DB Tables                  | Realtime Events | Tests               | Feature Flag                                |
| ------------------ | --- | --- | --- | --- | --- | ---------------------- | ---------------------------- | -------------------------- | --------------- | ------------------- | ------------------------------------------- |
| Profanity filter   | Y   | -   | Y   | Y   | Y   | `ProfanitySettings`    | `POST /api/moderation/scan`  | `nchat_moderation_rules`   | -               | `profanity.test.ts` | `moderation.profanityFilter`                |
| Spam detection     | Y   | Y   | Y   | Y   | Y   | `SpamSettings`         | `POST /api/moderation/scan`  | `nchat_moderation_rules`   | -               | `spam.test.ts`      | `moderation.spamDetection`                  |
| AI moderation      | -   | -   | Y   | Y   | Y   | `AIModerationSettings` | `POST /api/moderation/scan`  | `nchat_moderation_results` | -               | `ai-mod.test.ts`    | `moderation.aiModeration.enabled`           |
| Toxicity detection | -   | -   | -   | -   | Y   | `ToxicityThreshold`    | `POST /api/moderation/scan`  | `nchat_moderation_results` | -               | `toxicity.test.ts`  | `moderation.aiModeration.toxicityDetection` |
| NSFW detection     | -   | -   | -   | -   | Y   | `NSFWSettings`         | `POST /api/moderation/scan`  | `nchat_moderation_results` | -               | `nsfw.test.ts`      | `moderation.aiModeration.nsfwDetection`     |
| Custom word lists  | -   | -   | Y   | Y   | Y   | `CustomWordList`       | `POST /api/moderation/words` | `nchat_blocked_words`      | -               | `words.test.ts`     | `moderation.customWords`                    |

### 9.2 User Reporting

| Feature        | W   | T   | S   | D   | N   | UI Component          | API Endpoint                   | DB Tables                  | Realtime Events  | Tests             | Feature Flag                 |
| -------------- | --- | --- | --- | --- | --- | --------------------- | ------------------------------ | -------------------------- | ---------------- | ----------------- | ---------------------------- |
| Report message | Y   | Y   | Y   | Y   | Y   | `ReportMessageButton` | `POST /api/reports`            | `nchat_reports`            | -                | `reports.test.ts` | `moderation.reportingSystem` |
| Report user    | Y   | Y   | Y   | Y   | Y   | `ReportUserButton`    | `POST /api/reports`            | `nchat_reports`            | -                | `reports.test.ts` | `moderation.reportingSystem` |
| Report channel | -   | Y   | Y   | Y   | Y   | `ReportChannelButton` | `POST /api/reports`            | `nchat_reports`            | -                | `reports.test.ts` | `moderation.reportingSystem` |
| Report reasons | Y   | Y   | Y   | Y   | Y   | `ReportReasonPicker`  | `POST /api/reports`            | `nchat_reports`            | -                | `reports.test.ts` | `moderation.reportingSystem` |
| Report queue   | -   | -   | Y   | Y   | Y   | `ModerationQueue`     | `GET /api/moderation/queue`    | `nchat_reports`            | `report:created` | `queue.test.ts`   | `moderation.reportingSystem` |
| Report actions | -   | -   | Y   | Y   | Y   | `ReportActions`       | `POST /api/moderation/actions` | `nchat_moderation_actions` | -                | `actions.test.ts` | `moderation.reportingSystem` |

### 9.3 Automated Actions

| Feature           | W   | T   | S   | D   | N   | UI Component       | API Endpoint                     | DB Tables                                     | Realtime Events   | Tests               | Feature Flag                      |
| ----------------- | --- | --- | --- | --- | --- | ------------------ | -------------------------------- | --------------------------------------------- | ----------------- | ------------------- | --------------------------------- |
| Auto-flag content | -   | -   | Y   | Y   | Y   | `AutoFlagSettings` | `PATCH /api/moderation/settings` | `nchat_moderation_settings`                   | `content:flagged` | `auto-flag.test.ts` | `moderation.autoActions.autoFlag` |
| Auto-hide content | -   | -   | Y   | Y   | Y   | `AutoHideSettings` | `PATCH /api/moderation/settings` | `nchat_moderation_settings`                   | `content:hidden`  | `auto-hide.test.ts` | `moderation.autoActions.autoHide` |
| Auto-warn user    | -   | -   | Y   | Y   | Y   | `AutoWarnSettings` | `PATCH /api/moderation/settings` | `nchat_moderation_settings`, `nchat_warnings` | `user:warned`     | `auto-warn.test.ts` | `moderation.autoActions.autoWarn` |
| Auto-mute user    | -   | -   | Y   | Y   | Y   | `AutoMuteSettings` | `PATCH /api/moderation/settings` | `nchat_moderation_settings`, `nchat_mutes`    | `user:muted`      | `auto-mute.test.ts` | `moderation.autoActions.autoMute` |
| Slowmode          | -   | Y   | Y   | Y   | Y   | `SlowmodeSettings` | `PATCH /api/channels/:id`        | `nchat_channels`                              | -                 | `slowmode.test.ts`  | `moderation.enabled`              |

---

## 10. Billing & Monetization Features

### 10.1 Subscriptions

| Feature                   | W   | T   | S   | D   | N   | UI Component                   | API Endpoint                       | DB Tables             | Realtime Events           | Tests               | Feature Flag             |
| ------------------------- | --- | --- | --- | --- | --- | ------------------------------ | ---------------------------------- | --------------------- | ------------------------- | ------------------- | ------------------------ |
| Subscription plans        | -   | Y   | Y   | Y   | Y   | `PricingTable`, `PlanSelector` | `GET /api/billing/plans`           | `nchat_plans`         | -                         | `plans.test.ts`     | `payments.subscriptions` |
| Stripe integration        | -   | -   | Y   | Y   | Y   | `StripeCheckout`               | `POST /api/billing/checkout`       | `nchat_subscriptions` | `subscription:created`    | `stripe.test.ts`    | `payments.subscriptions` |
| Customer portal           | -   | -   | Y   | Y   | Y   | `BillingPortal`                | `GET /api/billing/portal`          | `nchat_subscriptions` | -                         | `portal.test.ts`    | `payments.subscriptions` |
| Usage-based billing       | -   | -   | Y   | -   | Y   | `UsageDisplay`                 | `GET /api/billing/usage`           | `nchat_usage_records` | -                         | `usage.test.ts`     | `payments.subscriptions` |
| Plan upgrades             | -   | Y   | Y   | Y   | Y   | `UpgradePlanModal`             | `POST /api/billing/upgrade`        | `nchat_subscriptions` | `subscription:upgraded`   | `upgrade.test.ts`   | `payments.subscriptions` |
| Plan downgrades           | -   | Y   | Y   | Y   | Y   | `DowngradePlanModal`           | `POST /api/billing/downgrade`      | `nchat_subscriptions` | `subscription:downgraded` | `downgrade.test.ts` | `payments.subscriptions` |
| Subscription cancellation | -   | Y   | Y   | Y   | Y   | `CancelSubscription`           | `DELETE /api/billing/subscription` | `nchat_subscriptions` | `subscription:cancelled`  | `cancel.test.ts`    | `payments.subscriptions` |

### 10.2 Crypto & Token Gating

| Feature              | W   | T   | S   | D   | N   | UI Component        | API Endpoint                        | DB Tables                 | Realtime Events     | Tests                | Feature Flag           |
| -------------------- | --- | --- | --- | --- | --- | ------------------- | ----------------------------------- | ------------------------- | ------------------- | -------------------- | ---------------------- |
| Crypto payments      | -   | Y   | -   | -   | Y   | `CryptoPayment`     | `POST /api/billing/crypto`          | `nchat_crypto_payments`   | `payment:confirmed` | `crypto.test.ts`     | `payments.crypto`      |
| Token-gated channels | -   | Y   | -   | -   | Y   | `TokenGateSettings` | `POST /api/channels/:id/token-gate` | `nchat_token_gates`       | -                   | `token-gate.test.ts` | `payments.tokenGating` |
| NFT verification     | -   | Y   | -   | -   | Y   | `NFTVerifier`       | `POST /api/auth/nft-verify`         | `nchat_nft_verifications` | -                   | `nft.test.ts`        | `payments.tokenGating` |
| Wallet connection    | -   | Y   | -   | -   | Y   | `WalletConnect`     | `POST /api/auth/wallet`             | `nchat_wallets`           | -                   | `wallet.test.ts`     | `payments.crypto`      |

### 10.3 Plan Enforcement

| Feature              | W   | T   | S   | D   | N   | UI Component        | API Endpoint                       | DB Tables                            | Realtime Events | Tests                  | Feature Flag             |
| -------------------- | --- | --- | --- | --- | --- | ------------------- | ---------------------------------- | ------------------------------------ | --------------- | ---------------------- | ------------------------ |
| Feature restrictions | -   | -   | Y   | Y   | Y   | `UpgradePrompt`     | - (server-side)                    | `nchat_plans`, `nchat_subscriptions` | -               | `restrictions.test.ts` | `payments.subscriptions` |
| Usage limits         | -   | -   | Y   | Y   | Y   | `UsageLimitWarning` | - (server-side)                    | `nchat_usage_records`                | -               | `limits.test.ts`       | `payments.subscriptions` |
| Paid tier channels   | -   | -   | Y   | Y   | Y   | `PaidChannelBadge`  | `POST /api/channels/:id/paid-tier` | `nchat_channels`                     | -               | `paid-tier.test.ts`    | `payments.subscriptions` |

---

## 11. Voice & Video Features

### 11.1 Voice Calls

| Feature           | W   | T   | S   | D   | N   | UI Component   | API Endpoint                                           | DB Tables                                | Realtime Events                   | Tests                   | Feature Flag          |
| ----------------- | --- | --- | --- | --- | --- | -------------- | ------------------------------------------------------ | ---------------------------------------- | --------------------------------- | ----------------------- | --------------------- |
| 1:1 voice calls   | Y   | Y   | Y   | Y   | Y   | `VoiceCallUI`  | `POST /api/calls/initiate`                             | `nchat_calls`                            | `call:initiated`, `call:answered` | `voice-call.test.ts`    | `voice.calls`         |
| Group voice calls | Y   | Y   | Y   | Y   | Y   | `GroupCallUI`  | `POST /api/calls/initiate`                             | `nchat_calls`, `nchat_call_participants` | `call:participant:joined`         | `group-call.test.ts`    | `voice.calls`         |
| Voice channels    | -   | -   | -   | Y   | Y   | `VoiceChannel` | `POST /api/channels`                                   | `nchat_channels`, `nchat_voice_states`   | `voice:state:updated`             | `voice-channel.test.ts` | `voice.voiceChannels` |
| Call controls     | Y   | Y   | Y   | Y   | Y   | `CallControls` | `POST /api/calls/:id/mute`, `POST /api/calls/:id/hold` | `nchat_calls`                            | `call:muted`, `call:held`         | `controls.test.ts`      | `voice.calls`         |
| Call transfer     | Y   | -   | Y   | -   | Y   | `CallTransfer` | `POST /api/calls/:id/transfer`                         | `nchat_calls`                            | `call:transferred`                | `transfer.test.ts`      | `voice.calls`         |
| Call hold         | Y   | Y   | Y   | -   | Y   | `HoldButton`   | `POST /api/calls/:id/hold`                             | `nchat_calls`                            | `call:held`                       | `hold.test.ts`          | `voice.calls`         |

### 11.2 Video Calls

| Feature             | W   | T   | S   | D   | N   | UI Component         | API Endpoint                       | DB Tables                                | Realtime Events                   | Tests                  | Feature Flag        |
| ------------------- | --- | --- | --- | --- | --- | -------------------- | ---------------------------------- | ---------------------------------------- | --------------------------------- | ---------------------- | ------------------- |
| 1:1 video calls     | Y   | Y   | Y   | Y   | Y   | `VideoCallUI`        | `POST /api/calls/initiate`         | `nchat_calls`                            | `call:initiated`, `call:answered` | `video-call.test.ts`   | `video.calls`       |
| Group video calls   | Y   | Y   | Y   | Y   | Y   | `GroupVideoUI`       | `POST /api/calls/initiate`         | `nchat_calls`, `nchat_call_participants` | `call:participant:joined`         | `group-video.test.ts`  | `video.calls`       |
| Screen sharing      | Y   | -   | Y   | Y   | Y   | `ScreenShareButton`  | `POST /api/calls/:id/screen-share` | `nchat_calls`                            | `call:screen:started`             | `screen-share.test.ts` | `video.screenShare` |
| Virtual backgrounds | -   | -   | Y   | -   | Y   | `BackgroundSelector` | - (client-side)                    | -                                        | -                                 | `backgrounds.test.ts`  | `video.calls`       |
| Video grid layout   | Y   | Y   | Y   | Y   | Y   | `VideoGrid`          | - (client-side)                    | -                                        | -                                 | `grid.test.ts`         | `video.calls`       |
| Spotlight speaker   | -   | -   | Y   | Y   | Y   | `SpotlightView`      | - (client-side)                    | -                                        | -                                 | `spotlight.test.ts`    | `video.calls`       |

### 11.3 Call Management

| Feature              | W   | T   | S   | D   | N   | UI Component        | API Endpoint                      | DB Tables               | Realtime Events     | Tests               | Feature Flag             |
| -------------------- | --- | --- | --- | --- | --- | ------------------- | --------------------------------- | ----------------------- | ------------------- | ------------------- | ------------------------ |
| Call history         | Y   | Y   | Y   | Y   | Y   | `CallHistory`       | `GET /api/calls/history`          | `nchat_calls`           | -                   | `history.test.ts`   | `voice.calls`            |
| Missed calls         | Y   | Y   | Y   | Y   | Y   | `MissedCalls`       | `GET /api/calls/missed`           | `nchat_calls`           | `call:missed`       | `missed.test.ts`    | `voice.calls`            |
| Call recording       | -   | -   | Y   | -   | Y   | `RecordingButton`   | `POST /api/calls/:id/record`      | `nchat_call_recordings` | `recording:started` | `recording.test.ts` | `features.callRecording` |
| Recording playback   | -   | -   | Y   | -   | Y   | `RecordingPlayer`   | `GET /api/calls/:id/recording`    | `nchat_call_recordings` | -                   | `playback.test.ts`  | `features.callRecording` |
| Call scheduling      | -   | -   | Y   | -   | Y   | `ScheduleCallModal` | `POST /api/calls/schedule`        | `nchat_scheduled_calls` | `call:scheduled`    | `schedule.test.ts`  | `voice.calls`            |
| Calendar integration | -   | -   | Y   | -   | Y   | `CalendarSync`      | `POST /api/integrations/calendar` | `nchat_calendar_events` | -                   | `calendar.test.ts`  | `integrations.calendar`  |

---

## 12. Live Streaming Features

| Feature              | W   | T   | S   | D   | N   | UI Component            | API Endpoint                      | DB Tables                 | Realtime Events       | Tests                      | Feature Flag                |
| -------------------- | --- | --- | --- | --- | --- | ----------------------- | --------------------------------- | ------------------------- | --------------------- | -------------------------- | --------------------------- |
| Start live stream    | -   | Y   | -   | Y   | Y   | `GoLiveButton`          | `POST /api/streams`               | `nchat_streams`           | `stream:started`      | `stream.test.ts`           | `features.liveStreaming`    |
| End live stream      | -   | Y   | -   | Y   | Y   | `EndStreamButton`       | `DELETE /api/streams/:id`         | `nchat_streams`           | `stream:ended`        | `stream.test.ts`           | `features.liveStreaming`    |
| Stream chat          | -   | Y   | -   | Y   | Y   | `StreamChat`            | `POST /api/streams/:id/messages`  | `nchat_stream_messages`   | `stream:message`      | `stream-chat.test.ts`      | `features.streamChat`       |
| Stream reactions     | -   | Y   | -   | Y   | Y   | `StreamReactions`       | `POST /api/streams/:id/reactions` | `nchat_stream_reactions`  | `stream:reaction`     | `stream-reactions.test.ts` | `features.streamReactions`  |
| Stream recording     | -   | Y   | -   | Y   | Y   | `RecordStreamToggle`    | `POST /api/streams/:id/record`    | `nchat_stream_recordings` | `recording:started`   | `stream-recording.test.ts` | `features.streamRecording`  |
| Stream scheduling    | -   | Y   | -   | Y   | Y   | `ScheduleStreamModal`   | `POST /api/streams/schedule`      | `nchat_scheduled_streams` | -                     | `schedule-stream.test.ts`  | `features.streamScheduling` |
| Viewer count         | -   | Y   | -   | Y   | Y   | `ViewerCount`           | `GET /api/streams/:id/stats`      | `nchat_stream_stats`      | `stream:viewer:count` | `viewers.test.ts`          | `features.liveStreaming`    |
| Stream analytics     | -   | Y   | -   | Y   | Y   | `StreamAnalytics`       | `GET /api/streams/:id/analytics`  | `nchat_stream_analytics`  | -                     | `analytics.test.ts`        | `features.liveStreaming`    |
| Multi-host streaming | -   | Y   | -   | Y   | Y   | `MultiHostControls`     | `POST /api/streams/:id/hosts`     | `nchat_stream_hosts`      | `stream:host:joined`  | `multi-host.test.ts`       | `features.liveStreaming`    |
| RTMP ingest          | -   | Y   | -   | -   | Y   | `RTMPSettings`          | `POST /api/streams/:id/rtmp`      | `nchat_streams`           | -                     | `rtmp.test.ts`             | `features.liveStreaming`    |
| Stream moderation    | -   | Y   | -   | Y   | Y   | `StreamModerationTools` | `POST /api/streams/:id/moderate`  | `nchat_stream_bans`       | `stream:user:banned`  | `stream-mod.test.ts`       | `features.liveStreaming`    |

---

## 13. Integration Features

### 13.1 Webhooks & Bots

| Feature           | W   | T   | S   | D   | N   | UI Component              | API Endpoint                  | DB Tables             | Realtime Events | Tests               | Feature Flag            |
| ----------------- | --- | --- | --- | --- | --- | ------------------------- | ----------------------------- | --------------------- | --------------- | ------------------- | ----------------------- |
| Incoming webhooks | -   | -   | Y   | Y   | Y   | `WebhookSettings`         | `POST /api/webhooks`          | `nchat_webhooks`      | -               | `webhooks.test.ts`  | `integrations.webhooks` |
| Outgoing webhooks | -   | -   | Y   | Y   | Y   | `OutgoingWebhookSettings` | `POST /api/webhooks`          | `nchat_webhooks`      | -               | `webhooks.test.ts`  | `integrations.webhooks` |
| Bot accounts      | -   | Y   | Y   | Y   | Y   | `BotBuilder`, `BotList`   | `POST /api/bots`              | `nchat_bots`          | -               | `bots.test.ts`      | `integrations.bots`     |
| Bot commands      | -   | Y   | Y   | Y   | Y   | `BotCommands`             | `POST /api/bots/:id/commands` | `nchat_bot_commands`  | -               | `commands.test.ts`  | `integrations.bots`     |
| Bot templates     | -   | -   | Y   | -   | Y   | `BotTemplates`            | `GET /api/bots/templates`     | `nchat_bot_templates` | -               | `templates.test.ts` | `integrations.bots`     |

### 13.2 Third-Party Integrations

| Feature              | W   | T   | S   | D   | N   | UI Component        | API Endpoint                          | DB Tables                    | Realtime Events   | Tests                  | Feature Flag               |
| -------------------- | --- | --- | --- | --- | --- | ------------------- | ------------------------------------- | ---------------------------- | ----------------- | ---------------------- | -------------------------- |
| Slack import         | -   | -   | Y   | -   | Y   | `SlackImportWizard` | `POST /api/integrations/slack/import` | `nchat_imports`              | `import:progress` | `slack-import.test.ts` | `integrations.slackImport` |
| GitHub integration   | -   | -   | Y   | Y   | Y   | `GitHubSettings`    | `POST /api/integrations/github`       | `nchat_github_installations` | `github:event`    | `github.test.ts`       | `integrations.github`      |
| Jira integration     | -   | -   | Y   | -   | Y   | `JiraSettings`      | `POST /api/integrations/jira`         | `nchat_jira_connections`     | `jira:event`      | `jira.test.ts`         | `integrations.jira`        |
| Google Drive         | -   | -   | Y   | -   | Y   | `DriveSettings`     | `POST /api/integrations/drive`        | `nchat_drive_connections`    | -                 | `drive.test.ts`        | `integrations.googleDrive` |
| Calendar integration | -   | -   | Y   | -   | Y   | `CalendarSettings`  | `POST /api/integrations/calendar`     | `nchat_calendar_connections` | -                 | `calendar.test.ts`     | `integrations.calendar`    |

### 13.3 Social Media

| Feature              | W   | T   | S   | D   | N   | UI Component         | API Endpoint                         | DB Tables               | Realtime Events | Tests                 | Feature Flag          |
| -------------------- | --- | --- | --- | --- | --- | -------------------- | ------------------------------------ | ----------------------- | --------------- | --------------------- | --------------------- |
| Twitter/X connection | -   | -   | -   | -   | Y   | `TwitterConnect`     | `GET /api/social/twitter/callback`   | `nchat_social_accounts` | -               | `twitter.test.ts`     | `integrations.social` |
| LinkedIn connection  | -   | -   | -   | -   | Y   | `LinkedInConnect`    | `GET /api/social/linkedin/callback`  | `nchat_social_accounts` | -               | `linkedin.test.ts`    | `integrations.social` |
| Instagram connection | -   | -   | -   | -   | Y   | `InstagramConnect`   | `GET /api/social/instagram/callback` | `nchat_social_accounts` | -               | `instagram.test.ts`   | `integrations.social` |
| Social posting       | -   | -   | -   | -   | Y   | `SocialPostComposer` | `POST /api/social/post`              | `nchat_social_posts`    | -               | `social-post.test.ts` | `integrations.social` |

---

## 14. Admin & Analytics Features

### 14.1 Admin Dashboard

| Feature            | W   | T   | S   | D   | N   | UI Component        | API Endpoint                | DB Tables                               | Realtime Events | Tests              | Feature Flag           |
| ------------------ | --- | --- | --- | --- | --- | ------------------- | --------------------------- | --------------------------------------- | --------------- | ------------------ | ---------------------- |
| Admin dashboard    | -   | -   | Y   | Y   | Y   | `AdminDashboard`    | `GET /api/admin/stats`      | Various                                 | -               | `admin.test.ts`    | `admin.dashboard`      |
| User management    | -   | -   | Y   | Y   | Y   | `UserManagement`    | `GET /api/admin/users`      | `nchat_users`                           | -               | `users.test.ts`    | `admin.userManagement` |
| Role management    | -   | -   | Y   | Y   | Y   | `RoleEditor`        | `POST /api/admin/roles`     | `nchat_roles`, `nchat_role_permissions` | -               | `roles.test.ts`    | `admin.roleManagement` |
| Channel management | -   | -   | Y   | Y   | Y   | `ChannelManagement` | `GET /api/admin/channels`   | `nchat_channels`                        | -               | `channels.test.ts` | `admin.dashboard`      |
| Server settings    | -   | -   | Y   | Y   | Y   | `ServerSettings`    | `PATCH /api/admin/settings` | `nchat_server_settings`                 | -               | `settings.test.ts` | `admin.dashboard`      |

### 14.2 Analytics

| Feature             | W   | T   | S   | D   | N   | UI Component        | API Endpoint                  | DB Tables                  | Realtime Events     | Tests               | Feature Flag      |
| ------------------- | --- | --- | --- | --- | --- | ------------------- | ----------------------------- | -------------------------- | ------------------- | ------------------- | ----------------- |
| Message analytics   | -   | -   | Y   | Y   | Y   | `MessageStats`      | `GET /api/analytics/messages` | `nchat_analytics_messages` | -                   | `analytics.test.ts` | `admin.analytics` |
| User analytics      | -   | -   | Y   | Y   | Y   | `UserStats`         | `GET /api/analytics/users`    | `nchat_analytics_users`    | -                   | `analytics.test.ts` | `admin.analytics` |
| Channel analytics   | -   | -   | Y   | Y   | Y   | `ChannelStats`      | `GET /api/analytics/channels` | `nchat_analytics_channels` | -                   | `analytics.test.ts` | `admin.analytics` |
| Export analytics    | -   | -   | Y   | -   | Y   | `ExportButton`      | `GET /api/analytics/export`   | Various                    | -                   | `export.test.ts`    | `admin.analytics` |
| Real-time dashboard | -   | -   | Y   | -   | Y   | `RealtimeDashboard` | -                             | -                          | `analytics:updated` | `realtime.test.ts`  | `admin.analytics` |
| Custom reports      | -   | -   | Y   | -   | Y   | `ReportBuilder`     | `POST /api/analytics/reports` | `nchat_custom_reports`     | -                   | `reports.test.ts`   | `admin.analytics` |

### 14.3 Audit Logging

| Feature           | W   | T   | S   | D   | N   | UI Component        | API Endpoint                       | DB Tables                                | Realtime Events | Tests                  | Feature Flag                     |
| ----------------- | --- | --- | --- | --- | --- | ------------------- | ---------------------------------- | ---------------------------------------- | --------------- | ---------------------- | -------------------------------- |
| Audit log         | -   | -   | Y   | Y   | Y   | `AuditLogViewer`    | `GET /api/audit`                   | `nchat_audit_logs`                       | -               | `audit.test.ts`        | `admin.auditLog`                 |
| Audit log export  | -   | -   | Y   | -   | Y   | `AuditExport`       | `GET /api/audit/export`            | `nchat_audit_logs`                       | -               | `export.test.ts`       | `admin.auditLog`                 |
| Tamper-proof logs | -   | -   | Y   | -   | Y   | -                   | - (server-side)                    | `nchat_audit_logs`, `nchat_audit_hashes` | -               | `tamper-proof.test.ts` | `enterprise.audit.tamperProof`   |
| Log retention     | -   | -   | Y   | -   | Y   | `RetentionSettings` | `PATCH /api/admin/audit/retention` | `nchat_audit_settings`                   | -               | `retention.test.ts`    | `enterprise.audit.retentionDays` |

---

## 15. Compliance Features

### 15.1 GDPR Compliance

| Feature            | W   | T   | S   | D   | N   | UI Component                       | API Endpoint                     | DB Tables                 | Realtime Events | Tests                 | Feature Flag      |
| ------------------ | --- | --- | --- | --- | --- | ---------------------------------- | -------------------------------- | ------------------------- | --------------- | --------------------- | ----------------- |
| Data export        | Y   | Y   | Y   | Y   | Y   | `DataExportRequest`                | `POST /api/compliance/export`    | `nchat_export_requests`   | `export:ready`  | `export.test.ts`      | `compliance.gdpr` |
| Account deletion   | Y   | Y   | Y   | Y   | Y   | `DeleteAccountFlow`                | `POST /api/compliance/deletion`  | `nchat_deletion_requests` | -               | `deletion.test.ts`    | `compliance.gdpr` |
| Consent management | -   | -   | Y   | Y   | Y   | `ConsentBanner`, `ConsentSettings` | `POST /api/compliance/consent`   | `nchat_consents`          | -               | `consent.test.ts`     | `compliance.gdpr` |
| Privacy settings   | Y   | Y   | Y   | Y   | Y   | `PrivacySettings`                  | `PATCH /api/settings/privacy`    | `nchat_user_settings`     | -               | `privacy.test.ts`     | `compliance.gdpr` |
| Data portability   | Y   | Y   | Y   | Y   | Y   | `DownloadData`                     | `GET /api/compliance/export/:id` | `nchat_exports`           | -               | `portability.test.ts` | `compliance.gdpr` |

### 15.2 Data Retention

| Feature           | W   | T   | S   | D   | N   | UI Component       | API Endpoint                      | DB Tables                  | Realtime Events | Tests                | Feature Flag            |
| ----------------- | --- | --- | --- | --- | --- | ------------------ | --------------------------------- | -------------------------- | --------------- | -------------------- | ----------------------- |
| Message retention | -   | -   | Y   | -   | Y   | `RetentionPolicy`  | `PATCH /api/admin/retention`      | `nchat_retention_policies` | -               | `retention.test.ts`  | `compliance.retention`  |
| Legal hold        | -   | -   | Y   | -   | Y   | `LegalHoldManager` | `POST /api/compliance/legal-hold` | `nchat_legal_holds`        | -               | `legal-hold.test.ts` | `compliance.legalHold`  |
| eDiscovery export | -   | -   | Y   | -   | Y   | `eDiscoveryExport` | `POST /api/compliance/ediscovery` | `nchat_ediscovery_exports` | -               | `ediscovery.test.ts` | `compliance.ediscovery` |

### 15.3 Compliance Reports

| Feature            | W   | T   | S   | D   | N   | UI Component        | API Endpoint                  | DB Tables                  | Realtime Events | Tests             | Feature Flag                 |
| ------------------ | --- | --- | --- | --- | --- | ------------------- | ----------------------------- | -------------------------- | --------------- | ----------------- | ---------------------------- |
| Compliance reports | -   | -   | Y   | -   | Y   | `ComplianceReports` | `GET /api/compliance/reports` | `nchat_compliance_reports` | -               | `reports.test.ts` | `compliance.reporting`       |
| SOC 2 compliance   | -   | -   | Y   | -   | Y   | `SOC2Dashboard`     | `GET /api/compliance/soc2`    | Various                    | -               | `soc2.test.ts`    | `enterprise.compliance.mode` |
| HIPAA compliance   | -   | -   | Y   | -   | Y   | `HIPAADashboard`    | `GET /api/compliance/hipaa`   | Various                    | -               | `hipaa.test.ts`   | `enterprise.compliance.mode` |

---

## 16. Platform Support

| Platform          | W   | T   | S   | D   | N   | Build System           | Native Features                   | Tests                   | Notes              |
| ----------------- | --- | --- | --- | --- | --- | ---------------------- | --------------------------------- | ----------------------- | ------------------ |
| Web (Browser)     | Y   | Y   | Y   | Y   | Y   | Next.js 15             | Push notifications, WebRTC        | `e2e/web/*.spec.ts`     | Primary platform   |
| iOS (Native)      | Y   | Y   | Y   | Y   | Y   | Capacitor/React Native | Push (APNs), CallKit, Biometrics  | `e2e/ios/*.spec.ts`     | App Store ready    |
| Android (Native)  | Y   | Y   | Y   | Y   | Y   | Capacitor/React Native | Push (FCM), Biometrics            | `e2e/android/*.spec.ts` | Play Store ready   |
| macOS (Desktop)   | Y   | Y   | Y   | Y   | Y   | Tauri/Electron         | Native notifications, Menu bar    | `e2e/desktop/*.spec.ts` | Universal binary   |
| Windows (Desktop) | Y   | Y   | Y   | Y   | Y   | Tauri/Electron         | Native notifications, System tray | `e2e/desktop/*.spec.ts` | MSIX ready         |
| Linux (Desktop)   | -   | Y   | Y   | Y   | Y   | Tauri/Electron         | Native notifications, System tray | `e2e/desktop/*.spec.ts` | AppImage, deb, rpm |

---

## Summary Statistics

| Category        | Total Features | WhatsApp | Telegram | Slack   | Discord | ɳChat   |
| --------------- | -------------- | -------- | -------- | ------- | ------- | ------- |
| Messaging       | 42             | 28       | 38       | 40      | 38      | 42      |
| Channels        | 32             | 12       | 26       | 30      | 32      | 32      |
| Presence        | 18             | 12       | 14       | 16      | 16      | 18      |
| Media           | 28             | 22       | 26       | 26      | 26      | 28      |
| Search          | 12             | 6        | 10       | 12      | 12      | 12      |
| Notifications   | 10             | 8        | 10       | 10      | 10      | 10      |
| Authentication  | 26             | 4        | 8        | 22      | 14      | 26      |
| E2EE            | 14             | 14       | 12       | 0       | 0       | 14      |
| Moderation      | 18             | 4        | 8        | 16      | 18      | 18      |
| Billing         | 14             | 0        | 8        | 12      | 10      | 14      |
| Voice/Video     | 22             | 18       | 16       | 20      | 20      | 22      |
| Live Streaming  | 12             | 0        | 10       | 0       | 10      | 12      |
| Integrations    | 18             | 0        | 4        | 18      | 12      | 18      |
| Admin/Analytics | 16             | 0        | 0        | 16      | 12      | 16      |
| Compliance      | 12             | 4        | 4        | 12      | 6       | 12      |
| **TOTAL**       | **274**        | **132**  | **194**  | **250** | **246** | **274** |

---

## Appendix A: Database Tables Reference

| Table                 | Description                | Related Features         |
| --------------------- | -------------------------- | ------------------------ |
| `nchat_users`         | User accounts and profiles | Authentication, Presence |
| `nchat_channels`      | All channel types          | Channels                 |
| `nchat_messages`      | Message storage            | Messaging                |
| `nchat_attachments`   | File storage metadata      | Media                    |
| `nchat_reactions`     | Message reactions          | Messaging                |
| `nchat_threads`       | Thread metadata            | Messaging                |
| `nchat_read_receipts` | Read status tracking       | Presence                 |
| `nchat_presence`      | Online status              | Presence                 |
| `nchat_notifications` | Notification queue         | Notifications            |
| `nchat_calls`         | Call records               | Voice/Video              |
| `nchat_streams`       | Live stream metadata       | Streaming                |
| `nchat_e2ee_keys`     | Encryption keys            | E2EE                     |
| `nchat_reports`       | User reports               | Moderation               |
| `nchat_audit_logs`    | Audit trail                | Admin                    |
| `nchat_subscriptions` | Billing subscriptions      | Billing                  |
| `nchat_webhooks`      | Webhook configurations     | Integrations             |
| `nchat_bots`          | Bot accounts               | Integrations             |

---

## Appendix B: Realtime Events Reference

| Event                  | Description           | Payload                                     |
| ---------------------- | --------------------- | ------------------------------------------- |
| `message:created`      | New message sent      | `{ messageId, channelId, content, author }` |
| `message:updated`      | Message edited        | `{ messageId, content, editedAt }`          |
| `message:deleted`      | Message deleted       | `{ messageId, channelId }`                  |
| `reaction:added`       | Reaction added        | `{ messageId, emoji, userId }`              |
| `reaction:removed`     | Reaction removed      | `{ messageId, emoji, userId }`              |
| `typing:started`       | User started typing   | `{ channelId, userId }`                     |
| `typing:stopped`       | User stopped typing   | `{ channelId, userId }`                     |
| `presence:updated`     | Presence changed      | `{ userId, status, customStatus }`          |
| `member:joined`        | Member joined channel | `{ channelId, userId }`                     |
| `member:left`          | Member left channel   | `{ channelId, userId }`                     |
| `call:initiated`       | Call started          | `{ callId, initiator, participants }`       |
| `call:answered`        | Call answered         | `{ callId, answeredBy }`                    |
| `call:ended`           | Call ended            | `{ callId, duration }`                      |
| `stream:started`       | Stream started        | `{ streamId, hostId }`                      |
| `stream:ended`         | Stream ended          | `{ streamId, stats }`                       |
| `notification:created` | New notification      | `{ notificationId, type, data }`            |

---

## Appendix C: Feature Flags Reference

See `/src/config/feature-flags.ts` and `/src/config/feature-registry.ts` for the complete feature flag definitions and registry.

---

_This document is auto-generated and should be kept in sync with the Feature Registry. Last updated: 2026-02-03_
