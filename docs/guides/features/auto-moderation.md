# Auto-Moderation Guide

**Version:** 0.7.0
**Last Updated:** January 31, 2026
**Status:** Production Ready

Comprehensive guide to the AI-powered auto-moderation system for nself-chat, providing intelligent content filtering, toxicity detection, spam prevention, and automated moderation actions.

---

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Content Classification](#content-classification)
4. [Toxicity Detection](#toxicity-detection)
5. [Spam Detection](#spam-detection)
6. [Moderation Queue](#moderation-queue)
7. [Auto-Actions](#auto-actions)
8. [False Positives](#false-positives)
9. [Analytics & Metrics](#analytics--metrics)
10. [Best Practices](#best-practices)
11. [Compliance](#compliance)
12. [Troubleshooting](#troubleshooting)
13. [API Reference](#api-reference)

---

## Overview

The auto-moderation system uses a multi-layered AI approach to protect your community from harmful content while minimizing false positives and respecting user privacy.

### Key Features

- **Multi-Model Detection**: Combines Perspective API, OpenAI Moderation, and TensorFlow.js
- **7 Toxicity Categories**: Comprehensive toxicity scoring across multiple dimensions
- **ML-Powered Spam Detection**: Pattern-based spam identification with user behavior analysis
- **Content Classification**: Automatic categorization and sentiment analysis
- **Auto-Actions**: Configurable automated responses (flag, hide, warn, mute, ban)
- **Moderation Queue**: Manual review workflow for flagged content
- **Audit Trail**: Complete history of all moderation actions
- **False Positive Learning**: Continuous improvement through feedback
- **GDPR Compliant**: Privacy-focused with user consent and data retention controls

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Content Submitted                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   Check Whitelist      │
        │   (Bypass if trusted)  │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │   Parallel Analysis    │
        │  ┌──────────────────┐  │
        │  │ Toxicity Detector│  │
        │  │ (Perspective API)│  │
        │  ├──────────────────┤  │
        │  │  Spam Detector   │  │
        │  │   (ML Patterns)  │  │
        │  ├──────────────────┤  │
        │  │Profanity Filter  │  │
        │  │  (Dictionary)    │  │
        │  ├──────────────────┤  │
        │  │  NSFW Detector   │  │
        │  │  (TensorFlow.js) │  │
        │  └──────────────────┘  │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │   Calculate Scores     │
        │  - Overall: Weighted   │
        │  - Confidence: Agreement│
        │  - Priority: Severity  │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │  Determine Auto-Action │
        │  - None                │
        │  - Flag for review     │
        │  - Hide content        │
        │  - Warn user           │
        │  - Mute user           │
        │  - Ban user            │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │   Execute Action       │
        │   + Audit Trail        │
        │   + User Notification  │
        └────────────────────────┘
```

---

## Setup

### Prerequisites

- **PostgreSQL Database**: For storing moderation data and audit logs
- **API Keys** (Optional but recommended):
  - Google Perspective API (toxicity detection)
  - OpenAI API (moderation fallback)

### Installation

#### 1. Environment Configuration

Add the following to your `.env.local`:

```bash
# === Moderation Settings ===

# Google Perspective API (Recommended for production)
PERSPECTIVE_API_KEY=your_perspective_api_key_here

# OpenAI API (Optional fallback)
OPENAI_API_KEY=your_openai_api_key_here

# Enable/disable features
NEXT_PUBLIC_ENABLE_AUTO_MODERATION=true
NEXT_PUBLIC_ENABLE_TOXICITY_DETECTION=true
NEXT_PUBLIC_ENABLE_SPAM_DETECTION=true
NEXT_PUBLIC_ENABLE_PROFANITY_FILTER=true
NEXT_PUBLIC_ENABLE_NSFW_DETECTION=true

# Confidence threshold for auto-actions (0-1)
NEXT_PUBLIC_AUTO_ACTION_CONFIDENCE=0.6

# Debug mode (logs all detections)
NEXT_PUBLIC_MODERATION_DEBUG=false
```

#### 2. Database Setup

The moderation system requires the following tables. Run the migration:

```sql
-- Moderation Actions table
CREATE TABLE nchat_moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  moderator_id UUID NOT NULL,
  moderator_role TEXT NOT NULL,
  reason TEXT NOT NULL,
  is_automated BOOLEAN DEFAULT FALSE,
  automation_type TEXT,
  duration INTEGER,
  expires_at TIMESTAMPTZ,
  reversible BOOLEAN DEFAULT TRUE,
  reversed_by UUID,
  reversed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation Queue table
CREATE TABLE nchat_moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  analysis JSONB NOT NULL,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  decision TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Warnings table
CREATE TABLE nchat_user_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  moderator_id UUID,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add moderation fields to messages
ALTER TABLE nchat_messages
ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE,
ADD COLUMN hidden_reason TEXT,
ADD COLUMN moderation_score FLOAT,
ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;

-- Add moderation fields to users
ALTER TABLE nchat_users
ADD COLUMN is_muted BOOLEAN DEFAULT FALSE,
ADD COLUMN muted_until TIMESTAMPTZ,
ADD COLUMN mute_reason TEXT,
ADD COLUMN is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN banned_until TIMESTAMPTZ,
ADD COLUMN ban_reason TEXT,
ADD COLUMN trust_score INTEGER DEFAULT 100;

-- Indexes for performance
CREATE INDEX idx_moderation_queue_status ON nchat_moderation_queue(status);
CREATE INDEX idx_moderation_queue_priority ON nchat_moderation_queue(priority);
CREATE INDEX idx_moderation_actions_target ON nchat_moderation_actions(target_type, target_id);
CREATE INDEX idx_user_warnings_user_id ON nchat_user_warnings(user_id);
```

#### 3. Initial Setup Wizard

Navigate to **Admin Dashboard → Moderation → Settings** to configure your moderation policy:

1. **Enable Features**: Toggle which detection systems to use
2. **Set Thresholds**: Adjust sensitivity for each category
3. **Configure Auto-Actions**: Define automated responses
4. **Whitelist/Blacklist**: Add trusted users and blocked words
5. **Test Configuration**: Run sample content through the system

### Getting API Keys

#### Google Perspective API (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the **Perspective Comment Analyzer API**
4. Create credentials (API Key)
5. Add API key to `.env.local` as `PERSPECTIVE_API_KEY`

**Free Tier**: 1,000 requests/day
**Pricing**: $1 per 1,000 requests after free tier

#### OpenAI API (Optional)

1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Generate API key from dashboard
3. Add to `.env.local` as `OPENAI_API_KEY`

**Note**: OpenAI Moderation API is free but requires an account.

### Fallback Mode

If no API keys are configured, the system automatically falls back to rule-based detection using pattern matching. While less accurate, it provides basic protection without external dependencies.

---

## Content Classification

The content classifier automatically categorizes messages and detects language, sentiment, and topics.

### Categories

The system recognizes the following content categories:

#### General Categories

| Category         | Keywords                                              | Weight |
| ---------------- | ----------------------------------------------------- | ------ |
| **General**      | hello, hi, thanks, please, help, question             | 0.5    |
| **Technical**    | code, bug, error, function, api, database, server     | 0.7    |
| **Business**     | meeting, project, deadline, client, revenue, strategy | 0.7    |
| **Social**       | party, event, lunch, coffee, weekend, vacation        | 0.6    |
| **Support**      | issue, problem, help, urgent, broken, fix             | 0.8    |
| **Announcement** | announce, news, update, release, launch               | 0.7    |

#### Content Type Categories

| Category      | Keywords                                          | Weight |
| ------------- | ------------------------------------------------- | ------ |
| **Question**  | how, what, why, when, where, who, can, should     | 0.6    |
| **Feedback**  | feedback, suggestion, improvement, idea           | 0.6    |
| **Complaint** | complaint, disappointed, frustrated, unacceptable | 0.7    |
| **Praise**    | great, awesome, excellent, fantastic, amazing     | 0.6    |

#### Warning Categories

| Category          | Keywords                                            | Weight |
| ----------------- | --------------------------------------------------- | ------ |
| **Inappropriate** | nsfw, explicit, adult, 18+, mature                  | 0.9    |
| **Harassment**    | harass, bully, threaten, stalk, intimidate          | 0.9    |
| **Spam**          | spam, advertisement, promotion, buy now, click here | 0.8    |

### Language Detection

Automatically detects the language of content using pattern matching:

**Supported Languages**: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese

```typescript
// Example result
{
  detectedLanguage: 'en',
  languageConfidence: 0.95
}
```

### Sentiment Analysis

Analyzes emotional tone of content:

- **Positive**: Good, great, love, happy, thank you
- **Negative**: Bad, terrible, hate, angry, frustrated
- **Neutral**: Factual, informative, no strong emotion

```typescript
// Example result
{
  sentiment: 'positive',
  sentimentScore: 0.7  // Range: -1 (negative) to +1 (positive)
}
```

### Usage Example

```typescript
import { getContentClassifier } from '@/lib/moderation/content-classifier'

const classifier = getContentClassifier()

const result = await classifier.classify(
  "Can anyone help me fix this bug? It's really frustrating!",
  'text'
)

console.log(result)
// {
//   primaryCategory: 'support',
//   confidence: 0.8,
//   categories: [
//     { name: 'support', score: 0.8 },
//     { name: 'question', score: 0.6 },
//     { name: 'complaint', score: 0.5 }
//   ],
//   sentiment: 'negative',
//   sentimentScore: -0.4,
//   isInappropriate: false,
//   isSafe: true
// }
```

### Custom Categories

Add domain-specific categories:

```typescript
classifier.addCategory('legal', ['contract', 'agreement', 'terms', 'liability', 'compliance'], 0.7)
```

---

## Toxicity Detection

Comprehensive toxicity detection using Google Perspective API with rule-based fallback.

### 7 Toxicity Categories

| Category              | Description                                             | Default Threshold |
| --------------------- | ------------------------------------------------------- | ----------------- |
| **TOXICITY**          | General toxicity (rude, disrespectful, unreasonable)    | 0.7               |
| **SEVERE_TOXICITY**   | Very hateful, aggressive, disrespectful                 | 0.8               |
| **INSULT**            | Insulting, inflammatory, or negative comments           | 0.7               |
| **PROFANITY**         | Swear words, curse words, vulgarity                     | 0.5               |
| **THREAT**            | Threats of violence or harm                             | 0.8               |
| **IDENTITY_ATTACK**   | Negative comments about identity (race, religion, etc.) | 0.75              |
| **SEXUALLY_EXPLICIT** | Sexually explicit content                               | 0.7               |

### Scoring System

Each category receives a score from **0.0 to 1.0**:

- **0.0 - 0.3**: Unlikely to be toxic
- **0.3 - 0.5**: Possible concern
- **0.5 - 0.7**: Likely toxic (flagged)
- **0.7 - 0.9**: Very likely toxic (hidden)
- **0.9 - 1.0**: Extremely toxic (banned)

### Detection Process

1. **API Call**: Send text to Perspective API
2. **Multi-Category Scoring**: Get scores for all 7 categories
3. **Span Detection**: Identify specific toxic phrases
4. **Confidence Calculation**: Determine reliability of scores
5. **Trigger Detection**: Check which categories exceed thresholds
6. **Overall Score**: Calculate weighted average

### Configuration

Adjust detection sensitivity:

```typescript
import { getToxicityDetector } from '@/lib/moderation/toxicity-detector'

const detector = getToxicityDetector({
  enablePerspectiveAPI: true,
  perspectiveApiKey: process.env.PERSPECTIVE_API_KEY,
  enableFallback: true,

  // Thresholds (0-1)
  toxicityThreshold: 0.7,
  severeToxicityThreshold: 0.8,
  insultThreshold: 0.7,
  profanityThreshold: 0.5,
  threatThreshold: 0.8,
  identityAttackThreshold: 0.75,

  // Languages to check
  languages: ['en', 'es', 'fr'],

  // Which categories to check
  checkAttributes: [
    'TOXICITY',
    'SEVERE_TOXICITY',
    'INSULT',
    'PROFANITY',
    'THREAT',
    'IDENTITY_ATTACK',
    'SEXUALLY_EXPLICIT',
  ],
})
```

### Usage Example

```typescript
const analysis = await detector.analyze("You're a complete idiot and I hate you!", 'en')

console.log(analysis)
// {
//   isToxic: true,
//   overallScore: 0.89,
//   scores: {
//     toxicity: 0.92,
//     severeToxicity: 0.45,
//     insult: 0.95,
//     profanity: 0.3,
//     threat: 0.1,
//     identityAttack: 0.05,
//     sexuallyExplicit: 0.02
//   },
//   triggeredCategories: ['toxicity', 'insult'],
//   confidence: 0.85,
//   mostToxicSpans: [
//     {
//       text: "complete idiot",
//       category: 'insult',
//       score: 0.95,
//       begin: 10,
//       end: 24
//     }
//   ],
//   language: 'en',
//   modelVersion: 'v0.7.0-toxicity'
// }
```

### Fallback Detection

When Perspective API is unavailable, the system uses rule-based patterns:

```typescript
// Pattern examples
const patterns = {
  toxicity: [/\b(hate|stupid|dumb|idiot|moron|loser|pathetic)\b/gi],
  severeToxicity: [/\b(kill|die|hurt|attack|destroy|murder)\b/gi],
  threat: [
    /i will (kill|hurt|attack|destroy|beat|shoot|stab)/gi,
    /going to (kill|hurt|attack|destroy)/gi,
  ],
}
```

### Best Practices

1. **Start Conservatively**: Begin with higher thresholds (0.8+)
2. **Monitor False Positives**: Track and review flagged content
3. **Adjust Gradually**: Lower thresholds incrementally based on results
4. **Context Matters**: Some communities need stricter moderation
5. **Language Support**: Configure languages based on your user base
6. **Cache Results**: Built-in 5-minute cache reduces API calls

---

## Spam Detection

ML-powered spam detection with pattern recognition and user behavior analysis.

### Spam Types Detected

| Type                      | Description                   | Indicators                                   |
| ------------------------- | ----------------------------- | -------------------------------------------- |
| **link_spam**             | Excessive or suspicious links | Too many links, non-whitelisted domains      |
| **promotional**           | Marketing/advertising content | Spam phrases, CTAs, promotional keywords     |
| **repetitive**            | Repeated characters/words     | Character repetition (aaaa), word repetition |
| **excessive_caps**        | ALL CAPS messages             | >70% uppercase characters                    |
| **excessive_punctuation** | Too many punctuation marks    | >30% punctuation ratio                       |
| **shortened_urls**        | Bit.ly, tinyurl, etc.         | URL shortener services                       |
| **suspicious_patterns**   | Known spam patterns           | Pattern matching against database            |
| **flooding**              | Message rate abuse            | >10 messages/minute                          |
| **duplicate_content**     | Repeated messages             | Same content posted 3+ times                 |

### Detection Patterns

#### Link Spam

```typescript
// Detected patterns
- More than 3 links in one message
- Links to non-whitelisted domains
- High link-to-text ratio (few words, many links)
- Shortened URLs (bit.ly, tinyurl, goo.gl, etc.)
```

**Whitelisted Domains** (by default):

- github.com
- gitlab.com
- stackoverflow.com
- docs.google.com
- drive.google.com
- dropbox.com

#### Promotional Content

**Spam Phrases** (examples):

- "click here", "buy now", "limited time"
- "special offer", "act now", "exclusive deal"
- "make money", "earn money", "work from home"
- "you won", "claim your", "free gift"
- "crypto", "bitcoin", "guaranteed returns"

**Promotional Keywords**:

- discount, coupon, promo code
- sale, deal, offer
- subscribe, sign up, register

#### User Behavior Analysis

Tracks user patterns to detect suspicious activity:

```typescript
// Analyzed metrics
- Message rate (messages per minute)
- Duplicate message count
- Account age
- Trust score (0-100)
- Recent message history
```

### Configuration

```typescript
import { getSpamDetectorML } from '@/lib/moderation/spam-detector-ml'

const detector = getSpamDetectorML({
  // Thresholds
  linkSpamThreshold: 0.6,
  promotionalThreshold: 0.7,
  capsRatioThreshold: 0.7,
  punctuationRatioThreshold: 0.3,
  messageRateThreshold: 10, // messages per minute

  // Limits
  maxLinksPerMessage: 3,
  maxConsecutiveMessages: 5,
  maxDuplicateMessages: 3,

  // Feature flags
  enableLinkDetection: true,
  enablePromotionalDetection: true,
  enableFloodDetection: true,
  enableDuplicateDetection: true,

  // Whitelist
  whitelistedDomains: ['github.com', 'yourcompany.com'],
  trustedUsers: ['user-id-1', 'user-id-2'],
})
```

### Usage Example

```typescript
const analysis = await detector.analyze(
  '🔥🔥🔥 CLICK HERE NOW!!! Limited time offer! Buy now and get 50% OFF! Visit bit.ly/amazing-deal',
  {
    userId: 'user-123',
    hasAttachments: false,
    accountAge: 1, // days
    trustScore: 30,
  }
)

console.log(analysis)
// {
//   isSpam: true,
//   spamScore: 0.85,
//   confidence: 0.9,
//   spamTypes: [
//     'promotional',
//     'excessive_caps',
//     'excessive_punctuation',
//     'shortened_urls'
//   ],
//   reasons: [
//     'Spam phrases: click here, buy now, limited time',
//     'Promotional keywords: offer, buy',
//     'Excessive capitalization: 42%',
//     'Excessive punctuation: 18%',
//     'Shortened URLs detected: 1',
//     'New account (< 1 day)',
//     'Low trust score'
//   ],
//   patterns: {
//     linkCount: 1,
//     shortenedUrls: 1,
//     capsRatio: 0.42,
//     punctuationRatio: 0.18,
//     repetitiveChars: 2,
//     spamPhrases: ['click here', 'buy now', 'limited time']
//   },
//   userBehavior: {
//     messageRate: 2.5,
//     duplicateMessages: 0,
//     accountAge: 1,
//     trustScore: 30
//   }
// }
```

### Whitelisting

Add trusted domains and users:

```typescript
// Add whitelisted domain
detector.updateConfig({
  whitelistedDomains: [...detector.getConfig().whitelistedDomains, 'trusted-partner.com'],
})

// Add trusted user
detector.updateConfig({
  trustedUsers: [...detector.getConfig().trustedUsers, 'trusted-user-id'],
})
```

### Performance Optimization

```typescript
// Cleanup old user history periodically
setInterval(
  () => {
    detector.cleanupHistory()
  },
  60 * 60 * 1000
) // Every hour
```

---

## Moderation Queue

The moderation queue manages content flagged for manual review.

### Queue Flow

```
Content Flagged
    ↓
Added to Queue (Status: pending)
    ↓
Assigned Priority (low/medium/high/critical)
    ↓
Moderator Reviews
    ↓
Decision Made
    ├─→ Approve (content visible)
    ├─→ Reject (content hidden/deleted)
    └─→ Appeal (user can contest)
```

### Priority Levels

| Priority     | Score Range | Description         | SLA        |
| ------------ | ----------- | ------------------- | ---------- |
| **Critical** | 0.9 - 1.0   | Severe violations   | < 5 min    |
| **High**     | 0.7 - 0.9   | Likely violations   | < 1 hour   |
| **Medium**   | 0.5 - 0.7   | Possible violations | < 24 hours |
| **Low**      | 0.0 - 0.5   | Minor concerns      | < 72 hours |

### Queue Operations

#### Adding to Queue

```typescript
import { ModerationQueue } from '@/lib/moderation/moderation-queue'
import { getApolloClient } from '@/lib/apollo-client'

const queue = new ModerationQueue(getApolloClient())

// Add item to queue
await queue.addToQueue({
  contentId: 'message-id',
  contentType: 'message',
  userId: 'user-id',
  analysis: {
    // Analysis results from AI moderator
    overallScore: 0.85,
    detectedIssues: [...],
    // ... full analysis object
  }
})
```

#### Reviewing Content

```typescript
// Get pending items
const items = await queue.getPendingItems({
  priority: 'high',
  limit: 10,
  offset: 0,
})

// Approve content
await queue.approveContent(
  'queue-item-id',
  'moderator-id',
  'False positive - legitimate discussion'
)

// Reject content
await queue.rejectContent('queue-item-id', 'moderator-id', 'Confirmed spam - promotional content')
```

#### Appeals Process

```typescript
// User submits appeal
await queue.submitAppeal('queue-item-id', 'I believe this was flagged incorrectly because...')

// Moderator reviews appeal
await queue.reviewAppeal(
  'queue-item-id',
  'moderator-id',
  'approved', // or 'rejected'
  'Appeal accepted - content reinstated'
)
```

### Queue Statistics

```typescript
const stats = await queue.getQueueStats()

console.log(stats)
// {
//   total: 142,
//   byStatus: {
//     pending: 45,
//     approved: 87,
//     rejected: 10
//   },
//   byPriority: {
//     critical: 2,
//     high: 15,
//     medium: 23,
//     low: 5
//   },
//   avgReviewTime: 1800000, // 30 minutes in ms
//   pendingOlderThan24h: 3
// }
```

### UI Components

The admin interface provides:

1. **Queue Dashboard**: Overview of pending items
2. **Filter & Sort**: By priority, date, content type
3. **Bulk Actions**: Approve/reject multiple items
4. **Detail View**: Full analysis results and context
5. **Action History**: Audit trail of decisions

Access at: **Admin → Moderation → Queue**

---

## Auto-Actions

Automated responses to detected violations based on configurable thresholds.

### Action Types

| Action        | Reversible | Duration Support | Description                        |
| ------------- | ---------- | ---------------- | ---------------------------------- |
| **none**      | N/A        | No               | No action taken (below thresholds) |
| **flag**      | Yes        | No               | Add to moderation queue for review |
| **hide**      | Yes        | No               | Hide content from users            |
| **warn**      | No         | No               | Send warning to user               |
| **mute**      | Yes        | Yes              | Prevent user from posting          |
| **delete**    | No         | No               | Permanently remove content         |
| **ban**       | Yes        | Yes              | Ban user from platform             |
| **shadowban** | Yes        | Yes              | User can post but content hidden   |

### Action Thresholds

Default thresholds (configurable):

```typescript
const thresholds = {
  // Content score thresholds
  toxicity: 0.7,
  nsfw: 0.7,
  spam: 0.6,
  profanity: 0.5,

  // Auto-action thresholds
  flagThreshold: 0.5, // Flag for manual review
  hideThreshold: 0.8, // Auto-hide content
  warnThreshold: 0.7, // Warn user
  muteThreshold: 0.85, // Temporary mute
  banThreshold: 0.95, // Permanent ban

  // User behavior thresholds
  maxViolationsPerDay: 3,
  maxViolationsPerWeek: 5,
  maxViolationsTotal: 10,

  // Minimum confidence for auto-action
  minimumConfidenceForAutoAction: 0.6,
}
```

### Decision Logic

The system determines auto-actions using a cascading decision tree:

```typescript
// Pseudocode
if (confidence < minimumConfidence) {
  return 'none' // Too uncertain
}

if (shouldBan && autoBan) {
  return 'ban'
} else if (shouldMute && autoMute) {
  return 'mute'
} else if (shouldHide && autoHide) {
  return 'hide'
} else if (shouldWarn && autoWarn) {
  return 'warn'
} else if (shouldFlag && autoFlag) {
  return 'flag'
} else {
  return 'none'
}
```

### User Violation History

Track repeat offenders:

```typescript
interface UserViolationHistory {
  userId: string
  totalViolations: number
  violationsToday: number
  violationsThisWeek: number
  lastViolationAt: Date
  trustScore: number // 0-100, decreases with violations
  isMuted: boolean
  mutedUntil?: Date
  isBanned: boolean
  bannedUntil?: Date
  warnings: number
}
```

**Trust Score Penalties**:

- Low severity: -5 points
- Medium severity: -10 points
- High severity: -20 points
- Critical severity: -30 points

### Configuration

```typescript
import { getAIModerator } from '@/lib/moderation/ai-moderator'

const moderator = getAIModerator({
  // Feature flags
  enableToxicityDetection: true,
  enableNSFWDetection: true,
  enableSpamDetection: true,
  enableProfanityFilter: true,

  // Auto-action toggles
  autoFlag: true,
  autoHide: false, // Disabled by default
  autoWarn: false, // Disabled by default
  autoMute: false, // Disabled by default
  autoBan: false, // Disabled by default

  // Thresholds
  thresholds: {
    toxicity: 0.7,
    nsfw: 0.7,
    spam: 0.6,
    profanity: 0.5,

    flagThreshold: 0.5,
    hideThreshold: 0.8,
    warnThreshold: 0.7,
    muteThreshold: 0.85,
    banThreshold: 0.95,

    maxViolationsPerDay: 3,
    maxViolationsPerWeek: 5,
    maxViolationsTotal: 10,
  },

  // Custom word lists
  customBlockedWords: ['custom-blocked-word'],
  customAllowedWords: ['custom-allowed-word'],

  // User lists
  whitelistedUsers: ['trusted-user-id'],
  blacklistedUsers: ['banned-user-id'],

  // Learning
  enableFalsePositiveLearning: true,
  minimumConfidenceForAutoAction: 0.6,
})
```

### Execution

```typescript
// Analyze content
const analysis = await moderator.analyzeContent(
  'content-id',
  'message',
  'This is the message content',
  {
    userId: 'user-id',
    channelId: 'channel-id',
    hasLinks: true,
    linkCount: 2,
  }
)

// Execute auto-action
if (analysis.autoAction !== 'none') {
  await executeAction(analysis.autoAction, analysis)
}
```

### Temporary Actions

Set duration for mutes and bans:

```typescript
import { ModerationActions } from '@/lib/moderation/actions'

const actions = new ModerationActions(apolloClient)

// Mute for 24 hours
await actions.muteUser(
  'user-id',
  'moderator-id',
  'Repeated spam',
  1440 // minutes (24 hours)
)

// Ban for 7 days
await actions.banUser(
  'user-id',
  'moderator-id',
  'Severe toxicity',
  10080 // minutes (7 days)
)
```

### Bulk Actions

Apply actions to multiple items:

```typescript
await actions.bulkAction(
  'hide', // action type
  [
    { targetType: 'message', targetId: 'msg-1', targetUserId: 'user-1' },
    { targetType: 'message', targetId: 'msg-2', targetUserId: 'user-1' },
    { targetType: 'message', targetId: 'msg-3', targetUserId: 'user-1' },
  ],
  'moderator-id',
  'Spam campaign detected',
  { isAutomated: true }
)
```

---

## False Positives

Learning system to improve accuracy and reduce incorrect detections.

### Recording False Positives

When a moderator approves flagged content, it's recorded as a false positive:

```typescript
await moderator.recordFalsePositive(
  'content-id',
  'toxicity',
  0.2, // actual score (should be low)
  0.8 // predicted score (was high)
)
```

### Feedback Loop

The system uses false positive data to:

1. **Adjust Thresholds**: Automatically tune detection sensitivity
2. **Update Patterns**: Refine pattern matching rules
3. **Train Models**: Improve ML model accuracy (future)
4. **Track Accuracy**: Monitor precision and recall metrics

### Analytics

Track false positive rates:

```typescript
// Example metrics
{
  totalDetections: 1000,
  falsePositives: 50,
  falsePositiveRate: 0.05, // 5%

  byCategory: {
    toxicity: { total: 300, fp: 15, rate: 0.05 },
    spam: { total: 400, fp: 20, rate: 0.05 },
    profanity: { total: 200, fp: 10, rate: 0.05 },
    nsfw: { total: 100, fp: 5, rate: 0.05 }
  },

  byConfidence: {
    high: { total: 500, fp: 10, rate: 0.02 },
    medium: { total: 300, fp: 20, rate: 0.067 },
    low: { total: 200, fp: 20, rate: 0.1 }
  }
}
```

### Allowlist Management

Add exceptions for common false positives:

```typescript
// Add allowed word
moderator.updatePolicy({
  customAllowedWords: [
    ...moderator.getPolicy().customAllowedWords,
    'scunthorpe', // Known false positive for profanity filter
    'arsenal', // Sports team name
  ],
})
```

### Context Awareness

Improve detection by considering context:

```typescript
// Example: Technical discussions may trigger profanity filter
const analysis = await moderator.analyzeContent(
  'content-id',
  'message',
  'The server is damn slow today', // Contains profanity but technical context
  {
    userId: 'user-id',
    channelId: 'tech-support-channel', // Channel context
    messageCount: 50, // User has history
    timeWindow: 3600,
  }
)
```

### User Reporting

Allow users to report incorrect moderation:

```typescript
// User contests action
await queue.submitAppeal(
  'moderation-item-id',
  'This was flagged incorrectly. I was discussing historical events, not promoting violence.'
)

// System learns from appeal decisions
if (appealApproved) {
  await moderator.recordFalsePositive(
    contentId,
    'threat',
    actualScore: 0.1,
    predictedScore: 0.8
  )
}
```

### Best Practices

1. **Regular Review**: Check moderation queue daily
2. **Track Metrics**: Monitor false positive rates by category
3. **Update Allowlists**: Add legitimate content patterns
4. **User Feedback**: Encourage appeals for incorrect actions
5. **Gradual Adjustment**: Make small threshold changes
6. **A/B Testing**: Test new thresholds on subset of traffic
7. **Document Decisions**: Keep notes on why content was approved/rejected

---

## Analytics & Metrics

Comprehensive analytics for monitoring moderation effectiveness.

### Key Metrics

#### Detection Metrics

```typescript
interface ModerationMetrics {
  // Volume
  totalAnalyzed: number
  totalFlagged: number
  totalActioned: number

  // Rates
  flagRate: number // Percentage of content flagged
  actionRate: number // Percentage requiring action
  falsePositiveRate: number

  // By Category
  toxicityDetections: number
  spamDetections: number
  profanityDetections: number
  nsfwDetections: number

  // By Action
  actionBreakdown: {
    flag: number
    hide: number
    warn: number
    mute: number
    ban: number
    delete: number
  }

  // Performance
  avgProcessingTime: number // milliseconds
  avgReviewTime: number // time to moderator review

  // User Impact
  uniqueUsersAffected: number
  repeatOffenders: number
  accountsBanned: number
}
```

#### Time Series Data

Track trends over time:

```typescript
{
  daily: [
    { date: '2026-01-31', flagged: 45, actioned: 12 },
    { date: '2026-01-30', flagged: 38, actioned: 10 },
    // ...
  ],
  weekly: [...],
  monthly: [...]
}
```

### Dashboard Views

Access via **Admin → Moderation → Dashboard**:

#### Overview Cards

- **Total Analyzed**: Content analyzed in period
- **Flagged Content**: Items requiring review
- **Auto-Actions**: Automated responses taken
- **Avg Response Time**: Time from flag to resolution

#### Charts

1. **Detection Trend**: Line chart of detections over time
2. **Action Distribution**: Pie chart of action types
3. **Category Breakdown**: Bar chart of violation categories
4. **False Positive Rate**: Trend line showing accuracy improvement

#### Tables

1. **Top Violators**: Users with most violations
2. **Recent Actions**: Latest moderation decisions
3. **Pending Queue**: Items awaiting review
4. **Appeal Status**: User appeals and outcomes

### Exporting Data

```typescript
// Export analytics to CSV
const analytics = await getAnalytics({
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  format: 'csv',
})

// Download report
downloadFile(analytics, 'moderation-report-jan-2026.csv')
```

### Custom Reports

Build custom reports using GraphQL:

```graphql
query ModerationReport($startDate: timestamptz!, $endDate: timestamptz!) {
  nchat_moderation_actions(where: { created_at: { _gte: $startDate, _lte: $endDate } }) {
    id
    action_type
    is_automated
    created_at
    target_type
    moderator {
      display_name
    }
  }

  nchat_moderation_queue_aggregate(where: { created_at: { _gte: $startDate, _lte: $endDate } }) {
    aggregate {
      count
    }
    nodes {
      status
      priority
    }
  }
}
```

---

## Best Practices

### Configuration Strategy

#### 1. Start Conservative

Begin with high thresholds and manual review:

```typescript
const initialConfig = {
  autoFlag: true, // ✅ Enable
  autoHide: false, // ❌ Disable
  autoWarn: false, // ❌ Disable
  autoMute: false, // ❌ Disable
  autoBan: false, // ❌ Disable

  thresholds: {
    flagThreshold: 0.6, // Higher threshold = less aggressive
    hideThreshold: 0.9, // Very high
    warnThreshold: 0.85,
    muteThreshold: 0.9,
    banThreshold: 0.95,
  },
}
```

#### 2. Monitor & Adjust

After 2-4 weeks, review metrics:

- **If false positive rate < 5%**: Lower thresholds by 0.05
- **If false positive rate > 10%**: Raise thresholds by 0.05
- **If moderation queue overwhelmed**: Enable more auto-actions

#### 3. Enable Gradually

Turn on auto-actions one at a time:

1. **Week 1-2**: Flag only, manual review
2. **Week 3-4**: Enable auto-hide for extreme cases (0.9+)
3. **Week 5-6**: Enable auto-warn (0.85+)
4. **Week 7+**: Consider auto-mute for repeat offenders

### Balancing Automation vs Human Review

#### When to Use Automation

- **High-confidence detections** (score > 0.9)
- **Clear violations** (spam, explicit NSFW)
- **Repeat offenders** (violation history)
- **High volume** (can't manually review all)

#### When to Use Manual Review

- **Borderline cases** (score 0.5-0.7)
- **Context-dependent** (sarcasm, jokes, quotes)
- **First-time violations** (give users benefit of doubt)
- **Appeals** (always human review)

#### Hybrid Approach (Recommended)

```typescript
const hybridConfig = {
  // Auto-action for obvious violations
  autoHide: true,
  hideThreshold: 0.9, // Very high confidence

  // Flag borderline cases
  autoFlag: true,
  flagThreshold: 0.5, // Catch potential issues

  // Manual review in between
  // 0.5-0.9 = Queue for moderator review

  // Progressive discipline
  autoWarn: true,
  warnThreshold: 0.75,

  // Severe actions require high confidence
  autoMute: false, // Manual only
  autoBan: false, // Manual only
}
```

### Community-Specific Tuning

#### Professional/Enterprise

- Higher tolerance for technical terms
- Stricter spam detection
- Lower toxicity thresholds

```typescript
const professionalConfig = {
  thresholds: {
    toxicity: 0.6, // Lower (stricter)
    spam: 0.5, // Lower (stricter)
    profanity: 0.7, // Higher (more lenient)
  },
}
```

#### Gaming Community

- Higher tolerance for competitive trash talk
- Focus on severe toxicity and harassment
- Stricter NSFW detection

```typescript
const gamingConfig = {
  thresholds: {
    toxicity: 0.8, // Higher (more lenient)
    severeToxicity: 0.6, // Lower (stricter)
    identityAttack: 0.6, // Lower (stricter)
    nsfw: 0.6, // Lower (stricter)
  },
}
```

#### Educational Platform

- Very strict across all categories
- Zero tolerance for harassment
- Educational content allowlist

```typescript
const educationalConfig = {
  thresholds: {
    toxicity: 0.5,
    severeToxicity: 0.4,
    threat: 0.5,
    identityAttack: 0.5,
    nsfw: 0.3,
  },
  customAllowedWords: [
    // Educational terms that might trigger false positives
  ],
}
```

---

## Compliance

### GDPR Compliance

#### Data Processing

```typescript
interface ModerationDataPolicy {
  // What data is collected
  dataCollected: [
    'Message content (temporary)',
    'User ID',
    'Timestamps',
    'Analysis scores',
    'Moderator actions',
  ]

  // Legal basis
  legalBasis: 'Legitimate interest (platform safety)'

  // Data retention
  retention: {
    analyzedContent: '24 hours' // Then deleted
    moderationActions: '2 years'
    auditLogs: '7 years'
    userViolationHistory: 'While account active'
  }

  // User rights
  userRights: {
    accessData: true // Export moderation history
    rectification: true // Contest decisions
    erasure: true // Delete after account closure
    portability: true // Export in machine-readable format
    objectAutomated: true // Appeal automated decisions
  }
}
```

#### Privacy Controls

```typescript
// Enable user consent
const privacyConfig = {
  requireConsent: true,
  consentMessage: 'We use AI to analyze content for safety. View our privacy policy.',
  allowOptOut: false, // Cannot opt out of safety features

  // Data minimization
  analyzeOnlyPublicContent: true,
  excludeDirectMessages: true,

  // Anonymization
  anonymizeInReports: true,
  hashUserIds: true,
}
```

#### Data Retention

Automatic data cleanup:

```typescript
// Scheduled cleanup job
async function cleanupModeration() {
  // Delete old analyzed content
  await db.deleteWhere({
    table: 'analyzed_content',
    where: { created_at: { olderThan: '24 hours' } },
  })

  // Anonymize old audit logs
  await db.update({
    table: 'moderation_actions',
    where: { created_at: { olderThan: '2 years' } },
    set: { user_id: 'ANONYMIZED' },
  })
}

// Run daily
schedule.daily(cleanupModeration)
```

### Audit Trail

Complete history of all moderation decisions:

```typescript
interface AuditLog {
  // Action details
  id: string
  timestamp: Date
  actionType: string

  // Who
  moderatorId: string
  moderatorRole: string
  isAutomated: boolean

  // What
  targetType: string
  targetId: string
  targetUserId: string

  // Why
  reason: string
  analysisScore: number
  detectedIssues: string[]

  // Outcome
  decision: string
  reversible: boolean
  reversedBy?: string
  reversedAt?: Date

  // Impact
  affectedUsers: number
  affectedContent: number
}
```

#### Audit Log Queries

```typescript
// Get all actions for a user
const userAudit = await getAuditLog({
  targetUserId: 'user-id',
  startDate: '2026-01-01',
  endDate: '2026-01-31',
})

// Get automated actions
const automatedAudit = await getAuditLog({
  isAutomated: true,
  actionType: 'ban',
})

// Export for compliance
const complianceReport = await exportAuditLog({
  format: 'json',
  includePersonalData: false, // GDPR-safe export
  startDate: '2025-01-01',
  endDate: '2025-12-31',
})
```

---

## Troubleshooting

### Common Issues

#### 1. High False Positive Rate

**Symptoms**: Many legitimate messages flagged

**Solutions**:

```typescript
// Increase thresholds
moderator.updatePolicy({
  thresholds: {
    flagThreshold: 0.6, // Was 0.5
    hideThreshold: 0.85, // Was 0.8
  },
})

// Add allowed words
moderator.updatePolicy({
  customAllowedWords: ['commonly-flagged-word'],
})

// Whitelist trusted users
moderator.updatePolicy({
  whitelistedUsers: ['trusted-user-id'],
})
```

#### 2. API Rate Limits

**Symptoms**: `429 Too Many Requests` errors

**Solutions**:

```typescript
// Enable caching (built-in)
const detector = getToxicityDetector({
  enableCache: true,
  cacheTTL: 300000, // 5 minutes
})

// Use fallback detection
const detector = getToxicityDetector({
  enableFallback: true, // Use rule-based if API fails
})
```

#### 3. Slow Performance

**Symptoms**: Analysis takes > 5 seconds

**Solutions**:

```typescript
// Optimize analysis
const moderator = getAIModerator({
  // Disable NSFW for text-only
  enableNSFWDetection: false,

  // Skip profanity for technical channels
  enableProfanityFilter: false,
})

// Batch processing
const results = await Promise.all(
  messages.map((msg) => moderator.analyzeContent(msg.id, 'message', msg.content))
)
```

#### 4. Perspective API Not Working

**Symptoms**: All detections use fallback

**Solutions**:

```bash
# Verify API key
echo $PERSPECTIVE_API_KEY

# Test API directly
curl "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=$PERSPECTIVE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"comment":{"text":"test"},"requestedAttributes":{"TOXICITY":{}}}'
```

---

## API Reference

### REST Endpoints

#### POST `/api/moderation/analyze`

Analyze content for violations.

**Request:**

```json
{
  "contentId": "msg-123",
  "contentType": "message",
  "content": "Text to analyze",
  "userId": "user-123",
  "metadata": {
    "channelId": "channel-123",
    "hasLinks": true,
    "linkCount": 2
  }
}
```

**Response:**

```json
{
  "success": true,
  "analysis": {
    "overallScore": 0.75,
    "confidenceScore": 0.85,
    "shouldFlag": true,
    "autoAction": "flag",
    "autoActionReason": "Overall risk score: 75.0%. High-severity issues: toxicity",
    "priority": "high",
    "detectedIssues": [...],
    "processingTime": 245
  }
}
```

#### POST `/api/moderation/actions`

Take moderation action.

**Request:**

```json
{
  "action": "hide",
  "targetType": "message",
  "targetId": "msg-123",
  "targetUserId": "user-123",
  "moderatorId": "mod-123",
  "reason": "Spam content",
  "duration": 1440
}
```

**Response:**

```json
{
  "success": true,
  "actionId": "action-123",
  "affectedItems": ["msg-123"]
}
```

### TypeScript SDK

#### AIModerator

```typescript
import { getAIModerator } from '@/lib/moderation/ai-moderator'

const moderator = getAIModerator(customPolicy)

// Analyze content
const analysis = await moderator.analyzeContent(contentId, contentType, content, metadata)

// Record violation
await moderator.recordViolation(userId, severity)

// Update policy
moderator.updatePolicy(updates)
```

#### ModerationActions

```typescript
import { ModerationActions } from '@/lib/moderation/actions'

const actions = new ModerationActions(apolloClient)

// Flag content
await actions.flagContent(targetType, targetId, targetUserId, moderatorId, reason)

// Hide content
await actions.hideContent(targetType, targetId, targetUserId, moderatorId, reason)

// Warn user
await actions.warnUser(userId, moderatorId, reason)

// Mute user
await actions.muteUser(userId, moderatorId, reason, durationMinutes)

// Ban user
await actions.banUser(userId, moderatorId, reason, durationMinutes)

// Bulk actions
await actions.bulkAction(actionType, targets, moderatorId, reason, options)
```

---

## Conclusion

The auto-moderation system provides comprehensive, AI-powered content protection while maintaining transparency and user rights. By following this guide, you can configure and operate an effective moderation system that balances automation with human oversight.

### Quick Start Checklist

- [ ] Install dependencies and run migrations
- [ ] Configure environment variables
- [ ] Obtain API keys (Perspective API recommended)
- [ ] Set initial thresholds (conservative)
- [ ] Configure auto-actions (flag only at first)
- [ ] Train moderators on queue review
- [ ] Monitor false positive rate
- [ ] Adjust thresholds gradually
- [ ] Enable additional auto-actions as confidence grows
- [ ] Regularly review analytics and user appeals

### Support & Resources

- **Documentation**: `/docs/guides/features/`
- **Admin UI**: `https://yourapp.com/admin/moderation`
- **API Docs**: `https://yourapp.com/api/docs`
- **Community**: Discuss moderation strategies with other admins
- **Support**: Contact support@yourapp.com

### Version History

- **v0.7.0** (2026-01-31): Enhanced auto-moderation release
  - Multi-model detection (Perspective API + TensorFlow.js)
  - 7 toxicity categories with span detection
  - ML-powered spam detection with user behavior analysis
  - Content classification and sentiment analysis
  - Moderation queue with priority levels
  - Complete audit trail and compliance features
  - False positive learning system
  - GDPR-compliant data handling

---

**Last Updated**: January 31, 2026
**Maintainer**: nself-chat Team
**License**: MIT
