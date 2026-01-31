# AI Features User Guide - Complete Reference

**Version**: 1.0.0 (v0.7.0)
**Last Updated**: January 31, 2026

A comprehensive guide to all AI-powered features in nself-chat, including message summarization, smart search, intelligent bots, and auto-moderation.

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Message Summarization](#message-summarization)
4. [Smart Search](#smart-search)
5. [Bot Interactions](#bot-interactions)
6. [Auto-Moderation](#auto-moderation)
7. [Privacy & Data Usage](#privacy--data-usage)
8. [Opt-In/Opt-Out](#opt-in-opt-out)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Overview

### What AI Features Are Available?

nself-chat includes four major AI-powered capabilities:

| Feature | Description | Status | AI Required |
|---------|-------------|--------|-------------|
| **Message Summarization** | Generate summaries of conversations, threads, and channels | ✅ Available | Optional |
| **Smart Search** | Semantic search that understands meaning, not just keywords | ✅ Available | Optional |
| **Intelligent Bots** | Automated assistants that respond to commands and events | ✅ Available | No |
| **Auto-Moderation** | AI-powered content detection for toxicity, spam, and NSFW | ✅ Available | Optional |

### How It Works

All AI features in nself-chat are designed with **graceful degradation**:

- **With AI APIs configured**: Full semantic understanding, advanced summaries, and intelligent detection
- **Without AI APIs**: Local fallbacks provide basic functionality without requiring external services
- **User control**: All AI features respect user preferences and privacy settings

### Supported AI Providers

| Provider | Summarization | Search Embeddings | Moderation | Cost |
|----------|--------------|-------------------|------------|------|
| **OpenAI** | GPT-4o-mini | text-embedding-3-small | ✅ TensorFlow.js | ~$0.001 per 1K messages |
| **Anthropic** | Claude 3.5 Haiku | ❌ (falls back to local) | ✅ TensorFlow.js | ~$0.0015 per 1K messages |
| **Local** | Basic statistics | Keyword search | ✅ TensorFlow.js | Free |

---

## Getting Started

### Checking AI Availability

To see which AI features are available in your workspace:

1. **Click your profile** in the top-right corner
2. **Go to Settings > AI Features**
3. View the status dashboard:

```
✅ Message Summarization: Enabled (OpenAI)
✅ Smart Search: Enabled (Semantic)
✅ Auto-Moderation: Enabled (AI-powered)
⚠️ Bot Responses: Basic (No AI configured)
```

### First-Time Setup

If you're an admin setting up AI features:

1. Navigate to **Admin Panel > AI Configuration**
2. Choose your AI provider (OpenAI or Anthropic recommended)
3. Enter your API key (see [Admin Guide](../../guides/admin/ai-management.md))
4. Test the connection
5. Enable features for your workspace

**Note**: Regular users don't need to configure anything - AI features work automatically once enabled by admins.

---

## Message Summarization

### What is Message Summarization?

Message summarization uses AI to condense long conversations into concise, readable summaries. This helps you:

- **Catch up quickly** after being away
- **Review lengthy discussions** without reading every message
- **Understand thread context** at a glance
- **Extract key decisions** from conversations

### Types of Summaries

#### 1. Channel Digest

**What it does**: Provides a comprehensive overview of channel activity over a time period.

**When to use**:
- Starting your workday
- Reviewing what happened while you were offline
- Understanding channel activity patterns

**How to access**:
1. Open any channel
2. Click the **⚡ Summarize** button in the top toolbar
3. Select **"Channel Digest"**
4. Choose time period (Last hour, Today, Last 7 days, Custom)

**Example Output**:
```
📊 Channel Digest: #engineering (Last 24 hours)

Summary:
The engineering team discussed the authentication bug affecting login
flows, decided to implement 2FA for all users, and reviewed the Q1
roadmap. Sarah reported fixing the database migration issue.

Key Points:
• Authentication bug fix deployed to staging
• 2FA implementation approved for Q1
• Database migration completed successfully
• Code review process updated

Topics: Authentication, Security, Database, Process Improvements
Participants: 8 members | Messages: 156
```

#### 2. Thread Summary

**What it does**: Summarizes a conversation thread to help you understand the discussion.

**When to use**:
- Before joining a long thread
- Reviewing decisions made in a thread
- Understanding context without reading all replies

**How to access**:
1. Hover over any message with replies
2. Click **"View Thread"**
3. Click the **📝 Summary** button at the top of the thread panel

**Example Output**:
```
🧵 Thread Summary

The team discussed implementing dark mode. Three design approaches
were proposed. Final decision: Use CSS variables for maximum
flexibility. Alex will create a design system document by Friday.

Key Decisions:
• CSS variables approach approved
• Design system doc due Friday
• Color contrast must meet WCAG AA standards

Participants: 4 | Messages: 23
```

#### 3. Catch-Up Summary

**What it does**: Shows you what you missed since you were last online.

**When to use**:
- Returning after time away
- Checking in on channels you don't actively monitor
- Quick status updates

**How to access**:
1. Automatically appears when you open a channel with new messages
2. Or click your profile > **"Catch Up"** to see all channels

**Example Output**:
```
👋 Welcome back! You missed 47 messages in 3 channels.

#engineering (23 messages):
• Bug fix for authentication deployed
• Q1 roadmap reviewed and approved

#design (15 messages):
• New brand guidelines published
• User research findings shared

#general (9 messages):
• Team lunch scheduled for Friday
• Office will be closed on Monday
```

#### 4. Quick Summary

**What it does**: Generates a brief 1-2 sentence summary of any selection of messages.

**When to use**:
- Quick context on recent messages
- TL;DR for lengthy discussions
- Sharing context with others

**How to access**:
1. Select multiple messages (Shift+Click)
2. Right-click and choose **"Summarize Selection"**

**Example Output**:
```
Brief Summary: Discussion about API rate limiting. Team decided to
implement exponential backoff and increase default limits for premium users.
```

### Using Summarization Features

#### Desktop Application

**Step-by-step**:
1. Navigate to any channel or thread
2. Look for the summarization controls:
   - **⚡ Button** in the toolbar (Channel Digest)
   - **📝 Button** in thread header (Thread Summary)
   - **Right-click menu** on selected messages (Quick Summary)
3. Choose summary type and time range
4. Click **"Generate Summary"**
5. Wait 2-5 seconds for AI processing
6. Review and optionally **"Copy"** or **"Share"** the summary

**Keyboard Shortcuts**:
- `Cmd/Ctrl + Shift + S` - Summarize current view
- `Cmd/Ctrl + Shift + D` - Generate channel digest
- `Esc` - Close summary panel

#### Mobile Application

**Step-by-step**:
1. Tap the **⋮ Menu** icon in the top-right
2. Select **"Summarize"**
3. Choose summary type
4. Tap **"Generate"**
5. View summary and tap **"Done"** when finished

**Tips for Mobile**:
- Summaries are optimized for mobile screens
- Swipe down to dismiss
- Long-press summary to copy

### Customizing Summaries

**Options available**:

| Option | Description | Values |
|--------|-------------|--------|
| **Style** | Output format | Brief, Detailed, Bullet Points |
| **Length** | Summary length | Short (100 words), Medium (300 words), Long (500 words) |
| **Focus** | What to emphasize | All content, Decisions only, Key points only |
| **Language** | Output language | Auto-detect, English, Spanish, French, German, etc. |

**To customize**:
1. Click **Settings** in the summary panel
2. Adjust options
3. Click **"Regenerate"** to apply changes

### When Summaries Are Not Available

If you see **"Summarization not available"**:

✅ **Solution**: The workspace administrator needs to configure AI settings. This is normal and the feature will work once configured.

If you see **"Using basic summary"**:

ℹ️ **What this means**: AI is not configured, but you'll still get a basic statistical summary showing message counts, participants, and time ranges.

---

## Smart Search

### What is Smart Search?

Smart Search uses AI to understand the **meaning** of your queries, not just match keywords. This means:

- **Natural language**: Search like you talk - "show me discussions about the login bug"
- **Conceptual matching**: Finds related content even with different wording
- **Context awareness**: Understands synonyms and paraphrasing
- **Relevance ranking**: Best results first, combining semantic similarity and recency

### Search Examples

#### Basic Searches

**Query**: `authentication issues`
**Finds**: Messages about login problems, password resets, 2FA errors, session timeouts

**Query**: `who can help with React?`
**Finds**: Messages from team members discussing React, frontend, components, hooks

**Query**: `decisions about the API`
**Finds**: Messages containing conclusions, approvals, or choices regarding API design

#### Advanced Searches

**Natural Language**:
```
"What did Sarah say about the database migration?"
→ Finds Sarah's messages related to database, migration, schema changes
```

**Time-Based**:
```
"bug reports from last week"
→ Filters to messages from the past 7 days containing bug descriptions
```

**Multi-Concept**:
```
"authentication AND security NOT testing"
→ Finds security-related auth discussions, excluding test-related messages
```

### Using Smart Search

#### Search Interface

1. **Click the search icon** (🔍) in the top toolbar or press `Cmd/Ctrl + K`
2. **Type your query** in natural language
3. **View results** as you type (debounced after 300ms)
4. **Click a result** to jump to that message in context

**Search Bar Features**:
```
┌─────────────────────────────────────────┐
│ 🔍 Search messages with AI...         │
│                                         │
│ ✨ Semantic search enabled             │
└─────────────────────────────────────────┘
```

#### Filters and Refinement

**Available Filters**:

| Filter | Description | Example |
|--------|-------------|---------|
| **Channel** | Search within specific channel(s) | `#engineering` |
| **User** | Messages from specific users | `from:sarah` |
| **Date** | Time range | `after:2026-01-01` |
| **Has Thread** | Only messages with replies | `has:thread` |
| **Has Links** | Messages containing URLs | `has:links` |
| **Has Files** | Messages with attachments | `has:files` |

**Combining Filters**:
```
authentication in:#engineering from:sarah after:2026-01-15
→ Sarah's messages about authentication in #engineering since Jan 15
```

#### Search Operators

| Operator | Usage | Example |
|----------|-------|---------|
| **AND** | Both terms must be present | `API AND security` |
| **OR** | Either term present | `bug OR issue` |
| **NOT** | Exclude term | `deploy NOT staging` |
| **""** | Exact phrase | `"critical bug"` |
| **( )** | Group terms | `(API OR backend) AND performance` |

### Understanding Search Results

#### Result Display

Each search result shows:

```
┌─────────────────────────────────────────┐
│ 💬 Sarah in #engineering               │
│ 15 minutes ago                          │
│                                         │
│ "We fixed the authentication bug by... │
│  ...implementing proper session..."    │
│                                         │
│ 🎯 Relevance: 95% | Type: Semantic     │
│ 📝 2 replies                            │
└─────────────────────────────────────────┘
```

**Elements explained**:
- **Relevance Score**: How well the message matches your query (0-100%)
- **Match Type**:
  - `Semantic` - AI understanding (best)
  - `Keyword` - Word matching (fallback)
  - `Exact` - Exact phrase match (highest precision)
- **Highlights**: Relevant excerpts from the message
- **Context**: Optional before/after messages for context

#### Viewing Context

**To see surrounding messages**:
1. Hover over a search result
2. Click **"Show Context"**
3. View 2 messages before and after (configurable)

**Why context matters**: Understanding the conversation flow around a message helps you grasp the full meaning.

### Ranking Strategies

Choose how results are ordered:

| Strategy | Description | Best For |
|----------|-------------|----------|
| **Relevance** | Most relevant first | Finding best matches |
| **Recent** | Newest first | Finding latest mentions |
| **Hybrid** | Balance relevance (70%) + recency (30%) | Most searches (default) |

**To change ranking**:
Click the **⚙️ Settings** icon in search → Select ranking strategy

### Search Tips

#### Getting Better Results

**✅ Do**:
- Use natural language: "show me", "find", "what did"
- Be specific: "React performance optimization" vs "React"
- Use synonyms: Try different terms if first search doesn't work
- Combine filters: Narrow down with channel, date, user filters
- Use quotes for exact phrases: "critical production bug"

**❌ Avoid**:
- Single-letter searches: "a", "I" (minimum 2 characters)
- Too generic: "help", "question" (too many results)
- Overly complex queries: Keep it simple for best results

#### Common Search Patterns

**Find experts**:
```
"who knows about GraphQL?"
→ People discussing GraphQL, their messages, expertise
```

**Track decisions**:
```
"approved OR decided OR agreed" in:#product-planning
→ Decision-making messages in product planning
```

**Monitor bugs**:
```
"bug OR issue OR error" has:thread after:yesterday
→ Recent bug reports with discussion threads
```

### Saved Searches

**Save frequent searches**:
1. Perform a search
2. Click **⭐ Save Search**
3. Name your search (e.g., "Recent bugs in engineering")
4. Access from **Saved Searches** dropdown

**Benefits**:
- Quick access to common queries
- Shared saved searches (admin feature)
- Email alerts for saved search results (coming soon)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open search |
| `Cmd/Ctrl + Shift + F` | Advanced search |
| `↑` `↓` | Navigate results |
| `Enter` | Open selected result |
| `Esc` | Close search |
| `Cmd/Ctrl + Enter` | Open in new window |

### When Search Is Not Semantic

**If you see "Keyword search" badge**:

This means AI-powered semantic search is not available, but you still have full keyword search functionality.

**Differences**:
- ✅ Still works for exact matches and keywords
- ✅ Still supports all filters and operators
- ⚠️ Won't understand synonyms or concepts
- ⚠️ May return more irrelevant results

**Example**:
- With semantic: `authentication issues` finds login, password, session problems
- Without semantic: `authentication issues` finds only messages with those exact words

---

## Bot Interactions

### What Are Bots?

Bots are automated assistants that can:
- **Respond to commands** (/help, /poll, /remind)
- **Answer questions** based on chat history and knowledge
- **Automate tasks** (create polls, set reminders, fetch data)
- **Monitor events** (welcome new members, track reactions)

### Available Bots

#### Built-In Bots

| Bot | Purpose | Commands | AI Required |
|-----|---------|----------|-------------|
| **HelloBot** 👋 | Greetings and jokes | `/hello`, `/hi`, `/joke` | No |
| **PollBot** 📊 | Create and manage polls | `/poll`, `/vote`, `/results` | No |
| **ReminderBot** ⏰ | Set reminders | `/remind`, `/reminders` | No |
| **WelcomeBot** 🎉 | Welcome new members | `/setwelcome`, `/welcomemessage` | No |
| **SearchBot** 🔍 | Semantic search assistant | `/search`, `/find` | Optional |
| **SummaryBot** 📝 | Generate summaries | `/summarize`, `/digest` | Optional |

#### Custom Bots

Admins can add custom bots from the Bot Marketplace or build their own using the Bot SDK.

### Using Bots

#### Slash Commands

**Basic format**: `/command [arguments]`

**Examples**:

```
/hello
→ "Hi there, Alex! 👋"

/hello Alice
→ "Hello, Alice! 🎉"

/joke
→ "Why do programmers prefer dark mode? Because light attracts bugs! 🐛"
```

#### Command Help

**Get command list**:
```
/help
→ Shows all available commands from all enabled bots
```

**Get bot-specific help**:
```
/help poll
→ Shows all PollBot commands and usage
```

**Get command details**:
```
/help /poll
→ Shows detailed usage for /poll command
```

### Interacting with Bots

#### Mentions

**Mention a bot** to get its attention:
```
@HelloBot what can you do?
→ "I can greet people and tell programming jokes! Try /hello or /joke"
```

#### Natural Language

Some AI-powered bots understand natural language:
```
@SearchBot find discussions about authentication
→ SearchBot performs a semantic search and returns results

@SummaryBot summarize today's messages
→ SummaryBot generates a channel digest for today
```

### Example Bot Workflows

#### Creating a Poll

**Step-by-step**:

1. **Create poll**:
```
/poll "Should we have pizza or tacos for lunch?" "Pizza" "Tacos" --duration 30
→ PollBot creates poll with 30-minute duration
```

2. **Vote**:
```
/vote poll-123 1
→ Vote for option 1 (Pizza)
```

3. **Check results**:
```
/results poll-123
→ Shows current vote counts
```

4. **Close poll**:
```
/closepoll poll-123
→ Closes poll and shows final results
```

#### Setting Reminders

**Quick reminder**:
```
/remind in 30 minutes to check deployment
→ "⏰ Reminder set! I'll remind you in 30 minutes."
```

**Scheduled reminder**:
```
/remind tomorrow at 9am to review pull requests
→ "⏰ Reminder set for tomorrow at 9:00 AM"
```

**List reminders**:
```
/reminders
→ Shows all your active reminders
```

**Cancel reminder**:
```
/cancel-reminder 456
→ "Reminder #456 cancelled"
```

#### Welcome Messages

**Set up welcome message** (Admins only):

1. **Enable welcome**:
```
/setwelcome on
→ "Welcome messages enabled for this channel"
```

2. **Customize message**:
```
/welcomemessage "Welcome {user} to {channel}! Check out our guidelines in the pinned message."
→ "Welcome message updated"
```

3. **Test it**:
```
/testwelcome
→ Shows preview of welcome message
```

**Placeholders**:
- `{user}` - New member's name
- `{channel}` - Channel name
- `{server}` - Workspace name

### Bot Permissions

Bots have limited permissions to protect your data:

**What bots CAN do**:
✅ Read messages they're mentioned in
✅ Send messages to channels they're in
✅ React to messages
✅ Access channel member lists
✅ Store bot-specific data

**What bots CANNOT do**:
❌ Read messages in channels they're not in
❌ Access private/DM messages (unless explicitly invited)
❌ Modify or delete user messages
❌ Access user credentials or personal data
❌ Make changes to workspace settings

### Managing Bots

**As a User**:
1. Go to **Settings > Bots**
2. View all available bots
3. See what bots are active in each channel

**As an Admin**:
1. Go to **Admin Panel > Bots**
2. Enable/disable bots workspace-wide
3. Configure bot permissions
4. View bot usage analytics
5. Add custom bots from marketplace

---

## Auto-Moderation

### What is Auto-Moderation?

Auto-moderation uses AI to automatically detect and handle problematic content:

- **Toxicity Detection**: Identifies insults, threats, harassment
- **Spam Detection**: Catches repetitive messages, excessive links
- **NSFW Detection**: Flags inappropriate images (if enabled)
- **Profanity Filtering**: Blocks or masks offensive language

### How It Works

**Detection Process**:

1. **Message sent** → Auto-mod scans content
2. **AI analysis** → Checks for toxicity, spam, profanity
3. **Score calculation** → Generates risk score (0-100%)
4. **Action determination** → Based on threshold and settings
5. **Action execution** → Flag, hide, warn, or mute

**Analysis Methods**:
- **TensorFlow.js models** (runs locally, no data sent to external APIs)
- **Pattern matching** (rule-based detection)
- **Behavioral analysis** (message frequency, link counts)

### Detection Categories

#### Toxicity Detection

**What it detects**:
- Identity attacks
- Insults and name-calling
- Threats
- Severe toxicity
- Obscene language

**Example**:
```
❌ Message: "You're an idiot and should be fired"
🚨 Detected: Toxicity (85%), Categories: Insult, Identity Attack
⚡ Action: Hidden, user warned
```

#### Spam Detection

**What it detects**:
- Excessive capitalization
- Repetitive characters
- Too many links
- Shortened URLs (bit.ly, etc.)
- High message frequency
- Known spam phrases

**Example**:
```
❌ Message: "CLICK HERE NOW!!! bit.ly/sketchy-link FREE MONEY!!!"
🚨 Detected: Spam (92%), Reasons: Excessive caps, shortened URL, spam phrases
⚡ Action: Message hidden
```

#### NSFW Detection

**What it detects** (images only):
- Pornographic content
- Sexually suggestive images
- Graphic violence

**Note**: NSFW detection is **opt-in** and must be explicitly enabled by admins.

#### Profanity Filtering

**What it does**:
- Detects offensive words
- Can block, mask, or just flag
- Supports custom word lists
- Context-aware (avoids false positives)

**Modes**:
- **Block**: Message rejected, not sent
- **Mask**: Offensive words replaced with `***`
- **Flag**: Message sent but flagged for review

### Automatic Actions

| Score | Risk Level | Automatic Action | User Impact |
|-------|-----------|------------------|-------------|
| 0-49% | Low | No action | Message sent normally |
| 50-69% | Medium | Flagged | Message sent, flagged for review |
| 70-89% | High | Hidden + Warning | Message hidden, user warned |
| 90-100% | Critical | Mute user | Message deleted, user temporarily muted |

**Configurable by admins** - Default actions can be customized per workspace.

### User Experience

#### When Your Message Is Flagged

**You'll see**:
```
⚠️ Your message may violate community guidelines

Your message was flagged for: Profanity

Options:
[Edit Message] [Appeal] [Cancel]
```

**What you can do**:
1. **Edit Message**: Revise and resend
2. **Appeal**: Request human review
3. **Cancel**: Don't send the message

#### When Someone Else's Message Is Hidden

**You'll see**:
```
[Hidden message]
This message was hidden by auto-moderation.
Reason: Policy violation

[Show anyway (Admin only)]
```

**Regular users**: Cannot see hidden messages
**Moderators/Admins**: Can view and restore if appropriate

### Moderation Queue

**Admins and moderators** can review flagged content:

1. Go to **Admin Panel > Moderation Queue**
2. View all flagged messages
3. For each item:
   - **Approve**: Mark as false positive, restore message
   - **Delete**: Confirm violation, keep hidden
   - **Warn User**: Send warning without other action
   - **Mute User**: Temporary or permanent mute

### Appeal Process

**If you believe your message was incorrectly flagged**:

1. Click **"Appeal"** on the moderation notice
2. Provide context or explanation
3. Submit appeal
4. **Moderator review**: Typically within 24 hours
5. **Notification**: You'll be notified of the decision

**Tips for successful appeals**:
- Explain context (was it a quote, reference, etc.?)
- Be respectful and constructive
- Provide relevant information

### False Positives

**AI moderation isn't perfect**. Common false positives:

- **Technical jargon**: "Kill the process", "abort transaction"
- **Quotes**: Quoting someone else's problematic message
- **Non-English**: Some languages may be misinterpreted
- **Sarcasm**: AI may not understand tone

**What happens**:
- Appeals are reviewed by humans
- False positives are marked to improve the system
- Custom allowlists can be created (admin feature)

### Customization (Admin)

**Admins can configure**:

- **Thresholds**: Adjust sensitivity (stricter or more lenient)
- **Actions**: Choose automatic actions per risk level
- **Custom word lists**: Add blocked or allowed words
- **Exemptions**: Exclude specific channels or users
- **Notifications**: Configure who gets notified of violations

**See**: [Admin Guide - AI Management](../admin/ai-management.md) for details

---

## Privacy & Data Usage

### What Data Is Collected?

**For AI features, we collect**:

| Data Type | Purpose | Retention | Shared With |
|-----------|---------|-----------|-------------|
| **Message content** | Summarization, search | Processed, not stored | AI provider (OpenAI/Anthropic) |
| **Search queries** | Provide search results | Not stored | AI provider (for embeddings) |
| **Bot interactions** | Command processing | Bot-specific data only | Not shared |
| **Moderation data** | Detect violations | Stored for audit | Not shared (local processing) |

### AI Provider Data Usage

**When you use OpenAI-powered features**:
- Messages sent to OpenAI for processing
- OpenAI's data usage policy applies
- Data is NOT used to train OpenAI's models (per enterprise agreement)
- Data is processed and discarded

**When you use Anthropic-powered features**:
- Messages sent to Anthropic for processing
- Anthropic's data usage policy applies
- Data is NOT used for training
- Data is processed and discarded

**When using local fallbacks**:
- No data sent to external services
- All processing happens on your device/server
- Complete privacy, but reduced capability

### Data You Can Control

**You can**:
✅ Opt out of AI features entirely
✅ Request data deletion (GDPR right to erasure)
✅ Export your AI interaction history
✅ See what data is being processed
✅ Choose between AI providers

**You cannot**:
❌ See other users' AI interactions
❌ Access raw AI model data
❌ Opt out of auto-moderation (policy enforcement)

### GDPR Compliance

nself-chat is designed for GDPR compliance:

- **Right to access**: View your AI data in Settings
- **Right to erasure**: Request deletion of AI-related data
- **Right to portability**: Export your data in JSON format
- **Data minimization**: Only necessary data processed
- **Consent**: Explicit opt-in for optional AI features

**For EU users**: Data is processed per GDPR Article 6(1)(f) for legitimate interests (security, functionality) and Article 6(1)(a) for optional features (with consent).

### Security Measures

**Data in transit**:
- ✅ TLS 1.3 encryption
- ✅ Certificate pinning
- ✅ End-to-end encryption for DMs (optional)

**Data at rest**:
- ✅ Encrypted database storage
- ✅ Encrypted backups
- ✅ Access logging and auditing

**API communication**:
- ✅ Secure API keys
- ✅ Rate limiting
- ✅ Request signing

---

## Opt-In/Opt-Out

### User-Level Controls

**To manage AI features for yourself**:

1. **Go to Settings > Privacy & AI**
2. **Configure preferences**:

```
AI Features Preferences

Message Summarization
◉ Enabled (recommended)
○ Disabled

Reason: Uses AI to help you catch up on conversations

---

Smart Search
◉ Semantic search (AI-powered)
○ Keyword search only
○ Disabled

Reason: Understands meaning for better results

---

Bot Interactions
☑ Allow bots to see my messages in channels
☑ Allow bots to send me direct messages
☐ Allow bots to see when I'm online

---

Auto-Moderation
☑ Protect me from toxic content (recommended)
☑ Filter profanity in messages I see
☐ Strict mode (hide more content)

---

Data Usage
☐ Send anonymized AI usage data to improve features
☑ Allow AI processing of my messages for features
```

3. **Click "Save Preferences"**

### What Happens When You Opt Out

#### Opt out of Message Summarization

**Effect**:
- ❌ No AI-generated summaries
- ✅ Basic statistical summaries still available
- ✅ All other features work normally

**You'll see**: "Summarization disabled in your settings"

#### Opt out of Smart Search

**Effect**:
- ❌ No semantic search
- ✅ Keyword search still works
- ✅ All filters and operators available

**You'll see**: "Using keyword search (semantic search disabled)"

#### Opt out of Bot Interactions

**Effect**:
- ❌ Bots won't respond to your messages
- ❌ Can't use slash commands
- ✅ See bot messages from others
- ✅ All human interactions normal

#### Opt out of Auto-Moderation

**Note**: You CANNOT completely opt out of auto-moderation as it's a workspace policy, but you can adjust how aggressively it filters content YOU see.

**Options**:
- **Normal**: Standard filtering
- **Relaxed**: Less aggressive (more content visible)
- **Strict**: More aggressive (safer experience)

### Workspace-Level Controls (Admin)

**Admins can control AI features for everyone**:

1. **Go to Admin Panel > AI Configuration**
2. **Enable/disable features**:
   - Message Summarization
   - Smart Search
   - Bot Platform
   - Auto-Moderation
3. **Set defaults** for new users
4. **Require/allow user opt-out**

**See**: [Admin Guide - AI Management](../admin/ai-management.md)

### Temporary Opt-Out

**Quick disable for a session**:

1. Click the **AI indicator** in the top toolbar
2. Toggle **"Pause AI Features"**
3. AI features disabled for current session
4. Re-enable anytime or automatically after session ends

**Use cases**:
- Privacy-sensitive conversations
- Testing non-AI functionality
- Reducing distractions

---

## Troubleshooting

### Common Issues

#### "AI features not available"

**Symptoms**: Greyed-out AI buttons, "Not available" messages

**Causes & Solutions**:

1. **Workspace hasn't configured AI**
   - ✅ Contact your admin to set up AI providers
   - ✅ Use local fallback features in the meantime

2. **You've opted out**
   - ✅ Go to Settings > Privacy & AI
   - ✅ Enable desired features

3. **AI quota exceeded**
   - ✅ Wait for quota reset (usually monthly)
   - ✅ Contact admin about upgrading plan

4. **Network issues**
   - ✅ Check internet connection
   - ✅ Try refreshing the page
   - ✅ Check if AI provider is experiencing outages

#### "Semantic search not working"

**Symptoms**: Searches only match exact keywords

**Causes & Solutions**:

1. **No OpenAI API key configured**
   - ℹ️ Semantic search requires OpenAI embeddings
   - ✅ Contact admin or use keyword search

2. **Search cache full**
   - ✅ Clear cache: Settings > Advanced > Clear AI Cache
   - ✅ Admin can increase cache size

3. **Query too short**
   - ✅ Use at least 2-3 words
   - ✅ Be more specific

#### "Summaries are poor quality"

**Symptoms**: Unhelpful or generic summaries

**Causes & Solutions**:

1. **Using local fallback (no AI)**
   - ℹ️ Check AI status indicator
   - ✅ Ask admin to configure OpenAI/Anthropic

2. **Not enough content**
   - ✅ Need at least 5-10 messages for good summaries
   - ✅ Try different time range

3. **Messages lack context**
   - ✅ AI works best with clear, substantive messages
   - ℹ️ Short "ok", "thanks" messages don't summarize well

4. **Wrong summary type**
   - ✅ Try different type: Brief vs Detailed vs Bullets
   - ✅ Adjust summary length in settings

#### "Bot not responding"

**Symptoms**: Slash commands don't work, bot doesn't reply

**Causes & Solutions**:

1. **Bot disabled**
   - ✅ Check if bot is enabled: Admin Panel > Bots
   - ✅ Try in different channel

2. **Wrong command syntax**
   - ✅ Type `/help` to see correct syntax
   - ✅ Check for typos in command

3. **Bot not in channel**
   - ✅ Invite bot: `/invite @BotName`
   - ✅ Admin may need to enable bot for channel

4. **Rate limit hit**
   - ⏰ Wait a few minutes and try again
   - ℹ️ Bots have rate limits to prevent abuse

#### "Message incorrectly flagged by moderation"

**Symptoms**: Your message was hidden or you received a warning unfairly

**Causes & Solutions**:

1. **False positive**
   - ✅ Click "Appeal" and explain context
   - ✅ Moderator will review within 24 hours

2. **Technical jargon misinterpreted**
   - ✅ Rephrase using different terms
   - ✅ Report to admin to add to allowlist

3. **Quote or reference**
   - ✅ Use quote formatting: `> quoted text`
   - ✅ Add context: "As mentioned earlier..."

### Getting Help

**If issues persist**:

1. **Check the Status Page**: [status.yourworkspace.com]
2. **Consult documentation**: This guide and [FAQ](#faq)
3. **Contact support**:
   - In-app: Help > Contact Support
   - Email: support@nself.org
   - Community: community.nself.org

**Include in your support request**:
- Description of the issue
- Steps to reproduce
- Screenshots (if applicable)
- Browser/app version
- AI features you're using

---

## FAQ

### General Questions

**Q: Do I need to pay extra for AI features?**
A: It depends on your workspace's plan. Check with your admin. Personal API keys can be used in some configurations.

**Q: Which AI provider is better: OpenAI or Anthropic?**
A: **OpenAI is recommended** for full semantic search support. Anthropic is excellent for summarization but doesn't support embeddings yet.

**Q: Can I use my own AI API keys?**
A: Yes, in self-hosted deployments. Cloud/managed deployments use workspace-level keys only.

**Q: Are AI features available offline?**
A: Local fallbacks work offline (keyword search, basic summaries, moderation), but AI-powered features require internet connectivity.

### Privacy Questions

**Q: Does nself-chat train AI models on my messages?**
A: No. We don't train models, and our agreements with OpenAI/Anthropic explicitly prohibit using your data for training.

**Q: Can admins see my private messages if AI is enabled?**
A: No. AI features respect the same privacy boundaries as regular features. Admins cannot see private messages unless they're participants.

**Q: Is auto-moderation watching all my messages?**
A: Auto-moderation scans messages for policy violations (like spam, toxicity) but doesn't store or analyze content beyond that. Think of it like a spam filter.

**Q: Where is my data processed?**
A: Depends on the provider. OpenAI (US), Anthropic (US), or locally (for fallbacks). GDPR-compliant processing for EU users.

### Feature-Specific Questions

**Q: Why does summarization sometimes take a long time?**
A: Large message volumes (100+ messages) take longer to process (5-10 seconds). Caching helps speed up repeated requests.

**Q: Can I customize which bots are available?**
A: Yes, if you're an admin. Go to Admin Panel > Bots to enable/disable specific bots.

**Q: How accurate is auto-moderation?**
A: Very accurate (95%+ for toxicity, 90%+ for spam) but not perfect. False positives are rare and can be appealed.

**Q: Can I create my own bots?**
A: Yes! See the [Bot SDK Documentation](../development/bot-sdk-complete.md) for a complete guide.

**Q: What happens if I hit the AI rate limit?**
A: You'll see a message like "Rate limit reached. Please try again in a few minutes." Features will temporarily fall back to local implementations.

---

## Related Documentation

- **[Bot SDK Complete Guide](../development/bot-sdk-complete.md)** - Build your own bots
- **[Smart Search Guide](smart-search-guide.md)** - Advanced search techniques
- **[Auto-Moderation Guide](auto-moderation.md)** - Configure moderation settings
- **[AI API Documentation](../../api/ai-endpoints.md)** - For developers
- **[Admin Guide - AI Management](../admin/ai-management.md)** - Admin controls

---

## Video Tutorials

📺 **Coming Soon**:
- Getting Started with AI Features (3 min)
- Mastering Smart Search (5 min)
- Creating Your First Bot (10 min)
- Understanding Auto-Moderation (4 min)

---

## Feedback & Suggestions

We're constantly improving AI features. Share your feedback:

- **In-app feedback**: Help > Send Feedback
- **Community forum**: [community.nself.org/ai-features](https://community.nself.org/ai-features)
- **Feature requests**: [github.com/nself/nself-chat/issues](https://github.com/nself/nself-chat/issues)

---

**Last Updated**: January 31, 2026
**Version**: v0.7.0
**Next Review**: February 28, 2026
