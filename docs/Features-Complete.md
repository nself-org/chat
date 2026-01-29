# nChat Features Reference

This document provides a complete reference of all features configurable through the nChat setup wizard. This serves as the source of truth to prevent hallucinations about feature availability.

## Table of Contents
- [Core Configuration](#core-configuration)
- [Authentication Providers](#authentication-providers)
- [Authentication Permissions](#authentication-permissions)
- [Messaging Features](#messaging-features)
- [Content & Media Features](#content--media-features)
- [Organization Features](#organization-features)
- [User Management Features](#user-management-features)
- [Integration Features](#integration-features)
- [Administration Features](#administration-features)
- [Theme & Branding](#theme--branding)

## Core Configuration

### Owner Information
- **name**: Owner's full name
- **email**: Owner's email address (used for automatic owner role assignment)
- **company**: Company/organization name (optional)
- **role**: Owner's role/title (optional)

### Branding
- **appName**: Application name (e.g., "nChat")
- **tagline**: Application tagline (optional)
- **logo**: Logo image URL (optional)
- **favicon**: Favicon image URL (optional)
- **companyName**: Company name (optional)
- **websiteUrl**: Company website URL (optional)
- **logoScale**: Logo display scale factor (0.5 to 2.0, default 1.0)

### Homepage Configuration
- **mode**: Homepage behavior
  - `landing`: Show landing page
  - `redirect`: Redirect to specific route
  - `chat`: Go directly to chat interface
- **redirectTo**: Target route for redirect mode
  - `/login`
  - `/chat`
  - `/signup`
- **landingPages**: Landing page sections
  - `hero`: Hero section
  - `features`: Features showcase
  - `pricing`: Pricing information
  - `about`: About section
  - `contact`: Contact form
  - `blog`: Blog/news section
  - `docs`: Documentation links

## Authentication Providers

### Basic Authentication
- **emailPassword**: Traditional email/password authentication
- **magicLinks**: Passwordless authentication via email links

### Social Authentication
- **google**: Google OAuth
- **facebook**: Facebook OAuth
- **twitter**: Twitter/X OAuth
- **github**: GitHub OAuth
- **discord**: Discord OAuth
- **slack**: Slack OAuth

### Special Authentication
- **idme**: ID.me verification with options for:
  - `allowMilitary`: Military personnel verification
  - `allowPolice`: Law enforcement verification
  - `allowFirstResponders`: First responder verification
  - `allowGovernment`: Government employee verification
  - `requireVerification`: Require ID.me verification for access

## Authentication Permissions

### Access Modes
- **allow-all**: Open registration for everyone
- **verified-only**: Require email verification
- **idme-roles**: Restrict to specific ID.me verified roles
- **domain-restricted**: Restrict to specific email domains
- **admin-only**: Manual approval required for all users

### Permission Settings
- **requireEmailVerification**: Require email verification
- **allowedDomains**: List of allowed email domains
- **allowedIdMeRoles**: Allowed ID.me roles (military, police, first-responder, government)
- **requireApproval**: Require admin approval for new users
- **autoApprove**: Automatically approve matching criteria
- **welcomeNewMembers**: Send welcome messages
- **newMemberChannel**: Channel for new member announcements

## Messaging Features

### Core Messaging (`features` object)
- **publicChannels**: Open channels visible to all members
- **privateChannels**: Invite-only channels for teams
- **directMessages**: 1-on-1 private conversations
- **threads**: Reply in threads to organize discussions
- **voiceMessages**: Send voice recordings (defined in AppConfig)
- **messageScheduling**: Schedule messages for later (defined in AppConfig)
- **videoConferencing**: Video calling support (defined in AppConfig)

### Extended Messaging (from features-step.tsx)
- **groupMessages**: Private group conversations
- **messageEditing**: Edit messages after sending
- **messageDeleting**: Remove sent messages
- **pinnedMessages**: Pin important messages to channels

## Content & Media Features

### Core Media Features
- **fileUploads**: Share documents and images
- **reactions**: React to messages with emojis
- **customEmojis**: Upload custom workspace emojis

### Extended Media Features (from features-step.tsx)
- **imagePreview**: View images inline in chat
- **linkPreviews**: Rich previews for shared links
- **socialEmbeds**: Play videos from YouTube, Instagram, TikTok inline
- **urlUnfurling**: Auto-expand links with title, description, thumbnail
- **codeBlocks**: Share code with syntax highlighting
- **markdownSupport**: Format messages with markdown

## Organization Features

### Core Organization
- **search**: Search messages and files
- **channelCategories**: Organize channels into categories (defined in AppConfig)

### Extended Organization (from features-step.tsx)
- **mentions**: Tag users in messages with @mentions
- **notifications**: Desktop and mobile notifications
- **unreadIndicators**: Track unread messages
- **savedMessages**: Bookmark important messages
- **userStatus**: Set online/away/busy status
- **typing**: See when others are typing

## User Management Features

### Core User Management
- **guestAccess**: Allow limited guest access
- **inviteLinks**: Share links to join workspace

### Extended User Management (from features-step.tsx)
- **userProfiles**: Profile pictures and bios
- **userDirectory**: Browse all workspace members
- **roles**: Admin, moderator, member roles
- **permissions**: Control who can post where

## Integration Features

### Platform Integrations (defined in AppConfig)
- **slack**:
  - `enabled`: Enable Slack integration
  - `importChannels`: Import channels from Slack
  - `syncMessages`: Sync messages between platforms
- **github**:
  - `enabled`: Enable GitHub integration
  - `notifications`: GitHub event notifications
  - `linkPullRequests`: Link PRs in messages
- **jira**:
  - `enabled`: Enable Jira integration
  - `ticketNotifications`: Jira ticket updates
- **googleDrive**:
  - `enabled`: Enable Google Drive integration
  - `fileSharing`: Share files from Drive

### Developer Integrations (from features-step.tsx)
- **webhooks**: Send notifications from external apps
- **slashCommands**: Quick actions with / commands
- **bots**: Add bots for automation
- **apiAccess**: Programmatic access to workspace

## Administration Features

### Moderation & Safety (defined in AppConfig)
- **autoModeration**: Automatic content moderation
- **profanityFilter**: Filter inappropriate language
- **spamDetection**: Detect and block spam
- **contentReporting**: User content reporting
- **userBlocking**: Users can block each other

### Admin Tools (from features-step.tsx)
- **moderation**: Delete inappropriate content
- **userBanning**: Remove and block users
- **exportData**: Download workspace data
- **analytics**: Message and user statistics
- **auditLog**: Track admin actions

## Theme & Branding

### Theme Configuration
- **preset**: Pre-defined theme presets
  - `nself`: Default nself theme
  - `slack`: Slack-like appearance
  - `discord`: Discord-like appearance
  - `sunset`: Warm sunset colors
  - `emerald`: Green theme
  - `rose`: Pink theme
  - `purple`: Purple theme
  - `custom`: Custom theme

### Color Settings
- **primaryColor**: Main brand color
- **secondaryColor**: Secondary brand color
- **accentColor**: Accent/highlight color
- **backgroundColor**: Main background color
- **surfaceColor**: Card/panel background
- **textColor**: Primary text color
- **mutedColor**: Secondary text color
- **borderColor**: Border colors
- **errorColor**: Error state color
- **warningColor**: Warning state color
- **successColor**: Success state color
- **infoColor**: Information state color

### Typography
- **fontFamily**: Font family selection
- **fontSize**: Base font size
- **fontWeight**: Default font weight

### Layout
- **borderRadius**: Corner radius for UI elements
- **spacing**: Spacing scale

### Landing Themes
- **login-only**: Simple login page only
- **simple-landing**: Basic landing page
- **full-homepage**: Complete marketing site
- **corporate**: Professional corporate style
- **community**: Community-focused design

---

## Important Notes

1. **Features in AppConfig Type**: Features defined in `/src/config/app-config.ts` are the source of truth for the data model
2. **Features in UI Components**: Additional features shown in the setup wizard UI (`features-step.tsx`) that may not have corresponding backend implementation yet
3. **Database Storage**: Configuration is stored in the `app_configuration` table with key-value pairs
4. **LocalStorage**: Currently primary storage mechanism, with database as backup
5. **Not All Features Implemented**: This list represents configurable options; actual implementation may vary

## Feature Implementation Status

✅ **Implemented**:
- Basic messaging (channels, DMs)
- User authentication
- File uploads
- Search functionality
- User profiles

⚠️ **Partially Implemented**:
- Reactions
- Threads
- Notifications

❌ **Not Yet Implemented**:
- Voice messages
- Video conferencing
- Social embeds
- Most integrations
- Advanced moderation tools

This document should be updated whenever features are added, modified, or removed from the setup wizard configuration.