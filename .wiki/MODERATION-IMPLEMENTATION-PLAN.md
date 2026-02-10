# Moderation and Compliance Implementation Plan

**Version**: 1.0.0
**Last Updated**: February 3, 2026
**Status**: Planning
**Tasks**: 101-105 (Moderation, Compliance, Reporting)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Reporting Workflows (Task 101)](#1-reporting-workflows-task-101)
3. [AI Moderation (Task 102)](#2-ai-moderation-task-102)
4. [Legal Hold & Retention (Task 103)](#3-legal-hold--retention-task-103)
5. [GDPR Compliance (Task 104)](#4-gdpr-compliance-task-104)
6. [Audit Logs (Task 105)](#5-audit-logs-task-105)
7. [Database Schema](#6-database-schema)
8. [API Endpoints](#7-api-endpoints)
9. [Admin Dashboard](#8-admin-dashboard)
10. [Automation Rules](#9-automation-rules)
11. [Implementation Timeline](#10-implementation-timeline)
12. [Testing Strategy](#11-testing-strategy)
13. [References](#12-references)

---

## Executive Summary

This document outlines the comprehensive implementation plan for moderation and compliance features in nChat. The system is designed to:

- **Protect users** through proactive content moderation and abuse reporting
- **Ensure compliance** with GDPR, CCPA, HIPAA, and SOC 2 requirements
- **Support legal processes** through legal holds and eDiscovery capabilities
- **Maintain accountability** via immutable audit trails

### Key Principles

1. **Hybrid Moderation Model**: Combine AI automation, rule-based filtering, and human review
2. **Privacy by Design**: Build compliance into the architecture, not as an afterthought
3. **Immutability**: Audit logs must be tamper-evident with cryptographic verification
4. **User Empowerment**: Give users control over their data and privacy settings
5. **Scalability**: Design for horizontal scaling with distributed architectures

### Current State

The project already has foundational schemas in place:

- `026_compliance_system.sql`: Legal holds, data export/deletion, consents, retention policies
- `026_ai_moderation_system.sql`: Moderation queue, rules, actions, user history

This plan builds upon these foundations to create a complete, production-ready system.

---

## 1. Reporting Workflows (Task 101)

### 1.1 Overview

The reporting system enables users to flag inappropriate content, users, or channels for moderator review. It follows the [best practices for chat moderation](https://getstream.io/blog/chat-moderation/) including simplified one-click reporting, clear violation categories, and transparent tracking.

### 1.2 Report Types

| Report Type    | Target        | Description                                      |
| -------------- | ------------- | ------------------------------------------------ |
| Message Report | Message ID    | Report a specific message for content violations |
| User Report    | User ID       | Report a user for behavior across the platform   |
| Channel Report | Channel ID    | Report an entire channel for policy violations   |
| File Report    | Attachment ID | Report uploaded files (images, documents)        |

### 1.3 Violation Categories

```typescript
enum ViolationCategory {
  // Content Violations
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  HATE_SPEECH = 'hate_speech',
  THREATS = 'threats',
  NSFW_CONTENT = 'nsfw_content',
  MISINFORMATION = 'misinformation',

  // User Violations
  IMPERSONATION = 'impersonation',
  UNDERAGE = 'underage',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',

  // Channel Violations
  ILLEGAL_ACTIVITY = 'illegal_activity',
  COORDINATED_ABUSE = 'coordinated_abuse',

  // Other
  COPYRIGHT = 'copyright',
  PRIVACY_VIOLATION = 'privacy_violation',
  OTHER = 'other',
}
```

### 1.4 Report Workflow

```
                                    +-----------------+
                                    |   User Reports  |
                                    |     Content     |
                                    +--------+--------+
                                             |
                                             v
                                    +--------+--------+
                                    |  Auto-Classify  |
                                    |    (AI/Rules)   |
                                    +--------+--------+
                                             |
                    +------------------------+------------------------+
                    |                        |                        |
                    v                        v                        v
           +-------+-------+       +--------+--------+       +-------+-------+
           |   Low Risk    |       |  Medium Risk    |       |   High Risk   |
           |  (Standard)   |       |  (Prioritized)  |       |  (Critical)   |
           +-------+-------+       +--------+--------+       +-------+-------+
                    |                        |                        |
                    v                        v                        v
           +-------+-------+       +--------+--------+       +-------+-------+
           |    Queue      |       |    Queue with   |       |  Immediate    |
           |   Position    |       |    Priority     |       |    Review     |
           +-------+-------+       +--------+--------+       +-------+-------+
                    |                        |                        |
                    +------------------------+------------------------+
                                             |
                                             v
                                    +--------+--------+
                                    |   Moderator     |
                                    |    Review       |
                                    +--------+--------+
                                             |
                    +------------------------+------------------------+
                    |                        |                        |
                    v                        v                        v
           +-------+-------+       +--------+--------+       +-------+-------+
           |   Dismiss     |       |   Take Action   |       |   Escalate    |
           |   (False +)   |       |  (Warn/Ban/etc) |       |  (to Admin)   |
           +---------------+       +-----------------+       +---------------+
```

### 1.5 Report Status Flow

```typescript
enum ReportStatus {
  PENDING = 'pending', // Initial state
  UNDER_REVIEW = 'under_review', // Moderator has claimed
  ACTION_TAKEN = 'action_taken', // Action completed
  DISMISSED = 'dismissed', // No action needed
  ESCALATED = 'escalated', // Escalated to admin
  APPEALED = 'appealed', // User appealed decision
  RESOLVED = 'resolved', // Final state
}
```

### 1.6 Database Schema: Reports

```sql
-- User/Content Reports
CREATE TABLE IF NOT EXISTS nchat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Report Target
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('message', 'user', 'channel', 'file')),
  target_id UUID NOT NULL,
  target_user_id UUID REFERENCES auth.users(id), -- User who created the reported content

  -- Reporter Information
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  reporter_ip INET,
  reporter_user_agent TEXT,

  -- Violation Details
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  description TEXT,
  evidence_urls TEXT[], -- Screenshots, links

  -- Context
  channel_id UUID REFERENCES nchat_channels(id),
  message_content TEXT, -- Snapshot of reported content

  -- Status & Priority
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- AI Classification
  ai_category VARCHAR(50),
  ai_confidence DECIMAL(3,2),
  ai_risk_score DECIMAL(3,2),

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,

  -- Resolution
  resolution VARCHAR(50),
  resolution_notes TEXT,
  action_taken VARCHAR(50),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,

  -- Appeal
  is_appealable BOOLEAN DEFAULT true,
  appeal_deadline TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate reports
  CONSTRAINT unique_report UNIQUE (reporter_id, report_type, target_id)
);

-- Indexes for efficient querying
CREATE INDEX idx_reports_status ON nchat_reports(status);
CREATE INDEX idx_reports_priority ON nchat_reports(priority);
CREATE INDEX idx_reports_category ON nchat_reports(category);
CREATE INDEX idx_reports_assigned_to ON nchat_reports(assigned_to);
CREATE INDEX idx_reports_created_at ON nchat_reports(created_at DESC);
CREATE INDEX idx_reports_target ON nchat_reports(report_type, target_id);

-- Report aggregation (for detecting coordinated reports)
CREATE TABLE IF NOT EXISTS nchat_report_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  report_count INTEGER NOT NULL DEFAULT 1,
  unique_reporters INTEGER NOT NULL DEFAULT 1,
  first_reported_at TIMESTAMPTZ NOT NULL,
  last_reported_at TIMESTAMPTZ NOT NULL,
  categories JSONB DEFAULT '{}'::jsonb, -- Count per category
  escalated BOOLEAN DEFAULT false,
  escalated_at TIMESTAMPTZ,

  CONSTRAINT unique_aggregate UNIQUE (report_type, target_id)
);

-- Appeal tracking
CREATE TABLE IF NOT EXISTS nchat_report_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES nchat_reports(id) ON DELETE CASCADE,
  appellant_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  evidence_urls TEXT[],

  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  decision VARCHAR(50),
  decision_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 1.7 Report Queue Features

1. **Claim System**: Moderators claim reports to prevent duplicate work
2. **Auto-Assignment**: Round-robin or load-balanced assignment
3. **Priority Escalation**: Reports exceeding threshold auto-escalate
4. **Batch Review**: Similar reports grouped for efficient review
5. **Status Updates**: Users notified of report progress

---

## 2. AI Moderation (Task 102)

### 2.1 Overview

AI moderation provides real-time content analysis to detect harmful content before human review. The system uses a multi-layer approach combining multiple AI services for comprehensive coverage.

### 2.2 AI Service Providers

Based on [current market analysis](https://estha.ai/blog/12-best-ai-content-moderation-apis-compared-the-complete-guide/), recommended providers:

| Provider                 | Strengths                        | Pricing         | Use Case                |
| ------------------------ | -------------------------------- | --------------- | ----------------------- |
| **OpenAI Moderation**    | Fast (47ms), free, 40+ languages | Free            | Primary text moderation |
| **Amazon Rekognition**   | 95% accuracy, image/video        | $0.001/image    | Image moderation        |
| **Hive AI**              | 50+ classes, <200ms              | Custom          | Premium alternative     |
| **Google Cloud**         | High accuracy, Google-scale      | $1.50/1K        | Backup/validation       |
| **Azure Content Safety** | Enterprise features              | $0.75/1K images | Enterprise deployments  |

### 2.3 Detection Categories

```typescript
interface AIDetectionResult {
  // Core Categories
  toxicity: {
    score: number // 0-1
    subcategories: {
      obscene: number
      threat: number
      insult: number
      identity_attack: number
    }
  }

  nsfw: {
    score: number
    subcategories: {
      sexual: number
      suggestive: number
      violent: number
      gore: number
    }
  }

  spam: {
    score: number
    indicators: string[] // 'repetitive', 'promotional', 'phishing'
  }

  // Extended Categories
  profanity: {
    detected: boolean
    words: string[]
    severity: 'mild' | 'moderate' | 'severe'
  }

  pii: {
    detected: boolean
    types: string[] // 'email', 'phone', 'ssn', 'credit_card'
  }

  // Metadata
  model_version: string
  processing_time_ms: number
  confidence: number
}
```

### 2.4 Processing Pipeline

```
+-------------------+     +-------------------+     +-------------------+
|   Message/File    | --> |   Pre-Processing  | --> |   AI Analysis     |
|     Submitted     |     |   (Normalize)     |     |   (Parallel)      |
+-------------------+     +-------------------+     +-------------------+
                                                            |
                          +----------------------------------+
                          |                |                |
                          v                v                v
                    +----------+    +----------+    +----------+
                    |   Text   |    |  Image   |    |  Links   |
                    | Analysis |    | Analysis |    | Analysis |
                    +----------+    +----------+    +----------+
                          |                |                |
                          +----------------------------------+
                                           |
                                           v
                    +-------------------+-------------------+
                    |           Score Aggregation          |
                    +-------------------+-------------------+
                                           |
                    +-------------------+--+------------------+
                    |                   |                    |
                    v                   v                    v
              +----------+       +----------+        +----------+
              |   Pass   |       |   Flag   |        |  Block   |
              | (< 0.3)  |       | (0.3-0.7)|        | (> 0.7)  |
              +----------+       +----------+        +----------+
                                       |
                                       v
                               +---------------+
                               |  Moderation   |
                               |    Queue      |
                               +---------------+
```

### 2.5 Automated Actions

```typescript
interface AutomatedAction {
  action: 'none' | 'flag' | 'hide' | 'warn' | 'mute' | 'ban'
  trigger: {
    category: string
    threshold: number
    condition?: 'any' | 'all'
  }
  parameters: {
    duration?: number // Minutes for mute/ban
    notify_user?: boolean
    notify_moderators?: boolean
    log_to_audit?: boolean
  }
}

// Default action configuration
const DEFAULT_AUTO_ACTIONS: AutomatedAction[] = [
  {
    action: 'flag',
    trigger: { category: 'toxicity', threshold: 0.5 },
    parameters: { notify_moderators: true, log_to_audit: true },
  },
  {
    action: 'hide',
    trigger: { category: 'nsfw', threshold: 0.7 },
    parameters: { notify_user: true, notify_moderators: true },
  },
  {
    action: 'warn',
    trigger: { category: 'profanity', threshold: 0.6 },
    parameters: { notify_user: true },
  },
  {
    action: 'mute',
    trigger: { category: 'spam', threshold: 0.8 },
    parameters: { duration: 60, notify_user: true },
  },
  {
    action: 'ban',
    trigger: { category: 'toxicity', threshold: 0.95 },
    parameters: { notify_user: true, notify_moderators: true },
  },
]
```

### 2.6 Custom Word Lists

```sql
-- Custom word lists for fine-tuned moderation
CREATE TABLE IF NOT EXISTS nchat_word_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('blocked', 'allowed', 'trigger', 'custom')),
  words TEXT[] NOT NULL DEFAULT '{}',
  regex_patterns TEXT[], -- Advanced pattern matching
  case_sensitive BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,

  -- Scope
  applies_to VARCHAR(50)[] DEFAULT ARRAY['messages', 'usernames', 'channel_names'],

  -- Action
  action VARCHAR(50) DEFAULT 'flag',
  action_severity VARCHAR(20) DEFAULT 'medium',

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-defined word list entries
CREATE TABLE IF NOT EXISTS nchat_word_list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES nchat_word_lists(id) ON DELETE CASCADE,
  word VARCHAR(255) NOT NULL,
  variations TEXT[], -- Common misspellings/leetspeak
  context_rules JSONB, -- When to apply/ignore
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_word_per_list UNIQUE (list_id, word)
);
```

### 2.7 Image Moderation

```typescript
interface ImageModerationConfig {
  enabled: boolean
  providers: ('rekognition' | 'hive' | 'google' | 'azure')[]
  categories: {
    adult: { enabled: boolean; threshold: number; action: string }
    violence: { enabled: boolean; threshold: number; action: string }
    drugs: { enabled: boolean; threshold: number; action: string }
    weapons: { enabled: boolean; threshold: number; action: string }
    hate_symbols: { enabled: boolean; threshold: number; action: string }
    text_extraction: { enabled: boolean; scan_for_profanity: boolean }
  }
  file_types: string[] // ['image/jpeg', 'image/png', 'image/gif']
  max_file_size_mb: number
  scan_avatars: boolean
  scan_attachments: boolean
}
```

---

## 3. Legal Hold & Retention (Task 103)

### 3.1 Overview

Legal holds preserve data during litigation or investigation, overriding normal retention policies. Based on [enterprise eDiscovery practices](https://learn.microsoft.com/en-us/purview/ediscovery-teams-legal-hold), the system supports:

- Custodian-based holds (specific users)
- Channel/workspace holds
- Date-range holds
- Matter management with chain of custody

### 3.2 Legal Hold Workflow

```
+-------------------+     +-------------------+     +-------------------+
|   Legal Request   | --> |   Create Hold     | --> |  Notify Custodians|
|   (Litigation)    |     |   (Define Scope)  |     |   (Acknowledgment)|
+-------------------+     +-------------------+     +-------------------+
                                    |
                                    v
                          +-------------------+
                          |   Data Preserved  |
                          | (Override Deletion)|
                          +-------------------+
                                    |
                    +---------------+---------------+
                    |                               |
                    v                               v
          +-------------------+           +-------------------+
          |   Collect Data    |           |   Release Hold    |
          |   (eDiscovery)    |           |   (Matter Closed) |
          +-------------------+           +-------------------+
                    |
                    v
          +-------------------+
          |   Export Package  |
          | (Chain of Custody)|
          +-------------------+
```

### 3.3 Database Schema Updates

```sql
-- Extend existing legal_holds table
ALTER TABLE nchat_legal_holds ADD COLUMN IF NOT EXISTS
  hold_type VARCHAR(50) DEFAULT 'standard' CHECK (hold_type IN ('standard', 'litigation', 'investigation', 'regulatory'));

ALTER TABLE nchat_legal_holds ADD COLUMN IF NOT EXISTS
  keywords TEXT[]; -- Keyword-based preservation

ALTER TABLE nchat_legal_holds ADD COLUMN IF NOT EXISTS
  date_range_start TIMESTAMPTZ;

ALTER TABLE nchat_legal_holds ADD COLUMN IF NOT EXISTS
  date_range_end TIMESTAMPTZ;

-- Legal hold audit trail (immutable)
CREATE TABLE IF NOT EXISTS nchat_legal_hold_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hold_id UUID NOT NULL REFERENCES nchat_legal_holds(id),
  action VARCHAR(100) NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  actor_email VARCHAR(255),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Immutability
  hash_chain VARCHAR(64) NOT NULL, -- SHA-256 of previous + current
  previous_hash VARCHAR(64),

  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Legal hold exports
CREATE TABLE IF NOT EXISTS nchat_legal_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hold_id UUID NOT NULL REFERENCES nchat_legal_holds(id),

  -- Export Details
  export_type VARCHAR(50) NOT NULL, -- 'full', 'messages', 'files', 'metadata'
  format VARCHAR(20) NOT NULL, -- 'zip', 'pst', 'json', 'load_file'

  -- Scope
  custodian_ids UUID[],
  channel_ids UUID[],
  date_from TIMESTAMPTZ,
  date_to TIMESTAMPTZ,
  keywords TEXT[],

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0, -- 0-100

  -- Results
  file_url TEXT,
  file_size BIGINT,
  item_count INTEGER,

  -- Chain of Custody
  export_hash VARCHAR(64), -- SHA-256 of export file
  custody_log JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  requested_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0
);
```

### 3.4 Retention Policy Configuration

```typescript
interface RetentionPolicy {
  id: string
  name: string
  enabled: boolean

  // Scope
  scope: {
    all_channels: boolean
    channel_ids?: string[]
    channel_types?: ('public' | 'private' | 'direct')[]
  }

  // Retention Period
  retention: {
    period: '30_days' | '90_days' | '1_year' | '3_years' | '7_years' | 'forever' | 'custom'
    custom_days?: number
  }

  // Exclusions
  exclusions: {
    pinned_messages: boolean
    starred_messages: boolean
    messages_with_files: boolean
    messages_under_legal_hold: boolean // Always true
  }

  // Deletion Behavior
  deletion: {
    type: 'soft' | 'hard' // Soft = mark deleted, Hard = permanent
    batch_size: number
    notify_users: boolean
  }
}
```

### 3.5 eDiscovery Export Formats

| Format        | Use Case             | Contents                |
| ------------- | -------------------- | ----------------------- |
| **JSON**      | API integration      | Structured data         |
| **CSV**       | Spreadsheet analysis | Tabular messages        |
| **PST**       | Email clients        | Outlook-compatible      |
| **Load File** | eDiscovery platforms | Relativity, Concordance |
| **HTML**      | Human review         | Rendered conversations  |

---

## 4. GDPR Compliance (Task 104)

### 4.1 Overview

GDPR compliance requires implementing [data subject rights](https://learn.microsoft.com/en-us/compliance/regulatory/gdpr) including data export (Article 20), deletion (Article 17), and consent management. The EU [Data Act](https://secureprivacy.ai/blog/saas-privacy-compliance-requirements-2025-guide) effective September 2025 adds additional portability requirements.

### 4.2 Data Subject Rights

| Right         | Article | Implementation                    |
| ------------- | ------- | --------------------------------- |
| Access        | 15      | View all personal data            |
| Rectification | 16      | Edit profile/data                 |
| Erasure       | 17      | Delete account/data               |
| Portability   | 20      | Export in machine-readable format |
| Restriction   | 18      | Limit processing                  |
| Objection     | 21      | Opt-out of processing             |

### 4.3 Data Export (Article 20)

```typescript
interface DataExportRequest {
  id: string
  user_id: string

  // Request Details
  categories: ('all' | 'messages' | 'files' | 'profile' | 'activity' | 'settings')[]
  format: 'json' | 'csv' | 'zip'
  date_range?: { start: Date; end: Date }

  // Verification
  verified: boolean
  verification_method: 'email' | '2fa' | 'support'

  // Status
  status: 'pending' | 'processing' | 'completed' | 'expired' | 'failed'
  progress: number

  // Delivery
  download_url?: string
  download_expires_at?: Date
  download_count: number
  max_downloads: number

  // Metadata
  requested_at: Date
  completed_at?: Date
  file_size?: number
}
```

### 4.4 Data Export Package Structure

```
user-data-export-{user_id}-{timestamp}.zip
├── manifest.json           # Export metadata
├── profile/
│   ├── profile.json       # User profile data
│   ├── settings.json      # User settings
│   └── avatar.png         # Profile picture
├── messages/
│   ├── messages.json      # All messages
│   ├── messages.csv       # CSV format
│   └── threads.json       # Thread data
├── files/
│   ├── attachments/       # Uploaded files
│   └── file-index.json    # File metadata
├── activity/
│   ├── login-history.json # Login records
│   ├── ip-addresses.json  # IP log
│   └── activity-log.json  # User actions
├── channels/
│   └── memberships.json   # Channel memberships
└── README.txt             # Export instructions
```

### 4.5 Data Deletion (Article 17)

```typescript
interface DataDeletionRequest {
  id: string
  user_id: string

  // Scope
  scope: 'full_account' | 'messages_only' | 'files_only' | 'activity_only' | 'partial'
  specific_categories?: string[]

  // Verification
  verified: boolean
  verification_code?: string
  verification_expires_at?: Date

  // Approval (for enterprise)
  requires_approval: boolean
  approved_by?: string
  approved_at?: Date

  // Legal Hold Check
  legal_hold_blocked: boolean
  blocking_hold_ids?: string[]

  // Status
  status: 'pending' | 'verified' | 'approved' | 'processing' | 'completed' | 'rejected'

  // Execution
  scheduled_for?: Date // Grace period
  executed_at?: Date
  items_deleted: {
    messages: number
    files: number
    reactions: number
    other: number
  }

  // Confirmation
  confirmation_sent: boolean
  confirmation_acknowledged: boolean
}
```

### 4.6 Deletion Process

```
+-------------------+     +-------------------+     +-------------------+
|   User Requests   | --> |   Verify Identity | --> |   Check Legal     |
|     Deletion      |     |   (Email/2FA)     |     |     Holds         |
+-------------------+     +-------------------+     +-------------------+
                                                            |
                    +---------------------------------------+
                    |                                       |
                    v                                       v
          +-------------------+                   +-------------------+
          |   Hold Blocking   |                   |   No Hold         |
          |   (Notify User)   |                   |   (Proceed)       |
          +-------------------+                   +-------------------+
                                                            |
                                                            v
                                                  +-------------------+
                                                  |   Grace Period    |
                                                  |   (30 days)       |
                                                  +-------------------+
                                                            |
                                                            v
                                                  +-------------------+
                                                  |   Execute Delete  |
                                                  |   (Background Job)|
                                                  +-------------------+
                                                            |
                    +---------------------------------------+
                    |                       |               |
                    v                       v               v
          +-------------+          +-------------+  +-------------+
          |   Messages  |          |    Files    |  |   Profile   |
          |   (Anonymize)|         |   (Delete)  |  |   (Delete)  |
          +-------------+          +-------------+  +-------------+
                                                            |
                                                            v
                                                  +-------------------+
                                                  |  Send Confirmation|
                                                  +-------------------+
```

### 4.7 Consent Management

```sql
-- Consent types with granular tracking
CREATE TABLE IF NOT EXISTS nchat_consent_purposes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  -- Legal Basis
  legal_basis VARCHAR(50) NOT NULL CHECK (legal_basis IN (
    'consent', 'contract', 'legal_obligation', 'vital_interest',
    'public_task', 'legitimate_interest'
  )),

  -- Requirements
  required BOOLEAN NOT NULL DEFAULT false,
  can_withdraw BOOLEAN NOT NULL DEFAULT true,

  -- Processing Details
  data_categories TEXT[] NOT NULL,
  retention_period VARCHAR(100),
  third_party_sharing BOOLEAN DEFAULT false,
  third_parties TEXT[],
  cross_border_transfer BOOLEAN DEFAULT false,
  transfer_countries TEXT[],

  -- Display
  display_order INTEGER DEFAULT 0,
  category VARCHAR(50), -- 'essential', 'functional', 'analytics', 'marketing'

  version VARCHAR(50) NOT NULL,
  effective_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User consent records with full audit trail
CREATE TABLE IF NOT EXISTS nchat_consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  purpose_id UUID NOT NULL REFERENCES nchat_consent_purposes(id),

  -- Consent State
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,

  -- Context
  consent_version VARCHAR(50) NOT NULL,
  collection_method VARCHAR(50) NOT NULL, -- 'signup', 'settings', 'banner', 'api'

  -- Evidence
  ip_address INET,
  user_agent TEXT,
  consent_text TEXT, -- Exact text shown

  -- Validity
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_purpose UNIQUE (user_id, purpose_id)
);
```

### 4.8 DPO (Data Protection Officer) Integration

```typescript
interface DPOConfig {
  enabled: boolean
  contact: {
    name: string
    email: string
    phone?: string
    address?: string
  }

  // Automatic Notifications
  notifications: {
    data_breach: boolean
    high_risk_processing: boolean
    dsar_received: boolean
    consent_withdrawal: boolean
  }

  // Reporting
  reports: {
    monthly_summary: boolean
    processing_activities: boolean
    breach_log: boolean
  }
}
```

---

## 5. Audit Logs (Task 105)

### 5.1 Overview

Audit logs provide an [immutable, tamper-evident trail](https://www.designgurus.io/answers/detail/how-do-you-enforce-immutability-and-appendonly-audit-trails) of all significant actions. Following best practices:

- Append-only storage with no UPDATE/DELETE capability
- Cryptographic hash chains for tamper detection
- Sequence numbers for ordering (not timestamps alone)
- Encrypted sensitive fields for GDPR compliance

### 5.2 Audit Event Categories

```typescript
enum AuditCategory {
  // Authentication Events
  AUTH_LOGIN = 'auth.login',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_FAILED = 'auth.failed',
  AUTH_MFA_ENABLED = 'auth.mfa_enabled',
  AUTH_PASSWORD_CHANGED = 'auth.password_changed',

  // User Events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_ROLE_CHANGED = 'user.role_changed',

  // Content Events
  MESSAGE_SENT = 'message.sent',
  MESSAGE_EDITED = 'message.edited',
  MESSAGE_DELETED = 'message.deleted',
  FILE_UPLOADED = 'file.uploaded',
  FILE_DELETED = 'file.deleted',

  // Channel Events
  CHANNEL_CREATED = 'channel.created',
  CHANNEL_UPDATED = 'channel.updated',
  CHANNEL_DELETED = 'channel.deleted',
  CHANNEL_MEMBER_ADDED = 'channel.member_added',
  CHANNEL_MEMBER_REMOVED = 'channel.member_removed',

  // Moderation Events
  MOD_CONTENT_FLAGGED = 'mod.content_flagged',
  MOD_ACTION_TAKEN = 'mod.action_taken',
  MOD_USER_WARNED = 'mod.user_warned',
  MOD_USER_MUTED = 'mod.user_muted',
  MOD_USER_BANNED = 'mod.user_banned',

  // Compliance Events
  LEGAL_HOLD_CREATED = 'compliance.legal_hold_created',
  LEGAL_HOLD_RELEASED = 'compliance.legal_hold_released',
  DATA_EXPORT_REQUESTED = 'compliance.data_export_requested',
  DATA_DELETION_REQUESTED = 'compliance.data_deletion_requested',
  CONSENT_UPDATED = 'compliance.consent_updated',

  // Admin Events
  ADMIN_CONFIG_CHANGED = 'admin.config_changed',
  ADMIN_PERMISSION_CHANGED = 'admin.permission_changed',
  ADMIN_BULK_ACTION = 'admin.bulk_action',

  // System Events
  SYSTEM_ERROR = 'system.error',
  SYSTEM_INTEGRATION = 'system.integration',
  SYSTEM_SCHEDULED_JOB = 'system.scheduled_job',
}
```

### 5.3 Immutable Audit Log Schema

```sql
-- Main audit log table (append-only)
CREATE TABLE IF NOT EXISTS nchat_audit_log (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id BIGSERIAL NOT NULL, -- Guaranteed ordering

  -- Event Classification
  event_type VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),

  -- Actor (who performed the action)
  actor_type VARCHAR(50) NOT NULL CHECK (actor_type IN ('user', 'admin', 'system', 'api', 'automation')),
  actor_id UUID,
  actor_email VARCHAR(255),
  actor_ip INET,
  actor_user_agent TEXT,
  actor_session_id VARCHAR(255),

  -- Target (what was affected)
  target_type VARCHAR(50),
  target_id UUID,
  target_name VARCHAR(255),

  -- Event Details
  action VARCHAR(100) NOT NULL,
  description TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Before/After State (for changes)
  previous_state JSONB,
  new_state JSONB,
  changes JSONB, -- Diff of changes

  -- Context
  request_id VARCHAR(255), -- Correlation ID
  channel_id UUID,
  workspace_id UUID,

  -- Security
  success BOOLEAN NOT NULL DEFAULT true,
  error_code VARCHAR(50),
  error_message TEXT,

  -- Tamper Evidence
  hash VARCHAR(64) NOT NULL, -- SHA-256 of record
  previous_hash VARCHAR(64), -- Hash chain link

  -- Timestamps
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Retention
  retention_expires_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT audit_log_hash_chain CHECK (
    (sequence_id = 1 AND previous_hash IS NULL) OR
    (sequence_id > 1 AND previous_hash IS NOT NULL)
  )
);

-- Prevent modifications
REVOKE UPDATE, DELETE ON nchat_audit_log FROM PUBLIC;
REVOKE UPDATE, DELETE ON nchat_audit_log FROM authenticated;

-- Only allow INSERT
GRANT INSERT ON nchat_audit_log TO authenticated;
GRANT SELECT ON nchat_audit_log TO authenticated;

-- Indexes for efficient querying
CREATE INDEX idx_audit_log_sequence ON nchat_audit_log(sequence_id);
CREATE INDEX idx_audit_log_timestamp ON nchat_audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_event_type ON nchat_audit_log(event_type);
CREATE INDEX idx_audit_log_category ON nchat_audit_log(category);
CREATE INDEX idx_audit_log_actor ON nchat_audit_log(actor_id);
CREATE INDEX idx_audit_log_target ON nchat_audit_log(target_type, target_id);
CREATE INDEX idx_audit_log_severity ON nchat_audit_log(severity);
CREATE INDEX idx_audit_log_success ON nchat_audit_log(success);

-- Hash verification trigger
CREATE OR REPLACE FUNCTION compute_audit_hash()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash VARCHAR(64);
  hash_input TEXT;
BEGIN
  -- Get previous hash
  SELECT hash INTO prev_hash
  FROM nchat_audit_log
  WHERE sequence_id = (SELECT MAX(sequence_id) FROM nchat_audit_log);

  NEW.previous_hash := prev_hash;

  -- Compute hash of current record
  hash_input := COALESCE(prev_hash, '') ||
                NEW.sequence_id::text ||
                NEW.event_type ||
                NEW.action ||
                NEW.timestamp::text ||
                COALESCE(NEW.actor_id::text, '') ||
                COALESCE(NEW.target_id::text, '') ||
                COALESCE(NEW.details::text, '{}');

  NEW.hash := encode(sha256(hash_input::bytea), 'hex');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_compute_audit_hash
  BEFORE INSERT ON nchat_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION compute_audit_hash();

-- Integrity verification function
CREATE OR REPLACE FUNCTION verify_audit_log_integrity()
RETURNS TABLE (
  total_records BIGINT,
  verified_records BIGINT,
  broken_chain_at BIGINT,
  is_valid BOOLEAN
) AS $$
DECLARE
  rec RECORD;
  computed_hash VARCHAR(64);
  hash_input TEXT;
  prev_hash VARCHAR(64) := NULL;
  verified BIGINT := 0;
  broken_at BIGINT := NULL;
BEGIN
  FOR rec IN SELECT * FROM nchat_audit_log ORDER BY sequence_id LOOP
    hash_input := COALESCE(prev_hash, '') ||
                  rec.sequence_id::text ||
                  rec.event_type ||
                  rec.action ||
                  rec.timestamp::text ||
                  COALESCE(rec.actor_id::text, '') ||
                  COALESCE(rec.target_id::text, '') ||
                  COALESCE(rec.details::text, '{}');

    computed_hash := encode(sha256(hash_input::bytea), 'hex');

    IF computed_hash = rec.hash AND
       (prev_hash IS NULL AND rec.previous_hash IS NULL OR prev_hash = rec.previous_hash) THEN
      verified := verified + 1;
    ELSE
      IF broken_at IS NULL THEN
        broken_at := rec.sequence_id;
      END IF;
    END IF;

    prev_hash := rec.hash;
  END LOOP;

  RETURN QUERY SELECT
    (SELECT COUNT(*) FROM nchat_audit_log),
    verified,
    broken_at,
    (broken_at IS NULL);
END;
$$ LANGUAGE plpgsql;
```

### 5.4 Audit Log Export Formats

| Format     | Use Case             | Standard                  |
| ---------- | -------------------- | ------------------------- |
| **JSON**   | API/Integration      | Native                    |
| **CSV**    | Spreadsheet analysis | RFC 4180                  |
| **Syslog** | SIEM integration     | RFC 5424                  |
| **CEF**    | ArcSight             | Common Event Format       |
| **LEEF**   | QRadar               | Log Event Extended Format |

### 5.5 Log Retention & Archival

```typescript
interface AuditRetentionConfig {
  // Hot Storage (fast access)
  hot_retention_days: number // Default: 90

  // Warm Storage (compressed, slower)
  warm_retention_days: number // Default: 365

  // Cold Storage (archived, very slow)
  cold_retention_years: number // Default: 7

  // Compression
  compress_after_days: number
  compression_algorithm: 'gzip' | 'lz4' | 'zstd'

  // Archival
  archive_to: 's3' | 'glacier' | 'azure_blob' | 'gcs'
  archive_bucket: string

  // Integrity
  verify_schedule: 'hourly' | 'daily' | 'weekly'
  alert_on_tampering: boolean
}
```

---

## 6. Database Schema

### 6.1 Complete Schema Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MODERATION TABLES                            │
├─────────────────────────────────────────────────────────────────────┤
│ nchat_reports              - User reports of content/users          │
│ nchat_report_aggregates    - Aggregated report counts               │
│ nchat_report_appeals       - Appeal tracking                        │
│ nchat_moderation_queue     - Content awaiting review (existing)     │
│ nchat_moderation_actions   - Action history (existing)              │
│ nchat_moderation_rules     - Custom rules (existing)                │
│ nchat_user_moderation_history - Per-user violation history          │
│ nchat_word_lists           - Custom blocked/allowed words           │
│ nchat_word_list_entries    - Word list entries                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        COMPLIANCE TABLES                            │
├─────────────────────────────────────────────────────────────────────┤
│ nchat_retention_policies   - Data retention rules (existing)        │
│ nchat_legal_holds          - Legal hold definitions (existing)      │
│ nchat_legal_hold_audit     - Legal hold audit trail                 │
│ nchat_legal_exports        - eDiscovery exports                     │
│ nchat_data_export_requests - GDPR data export (existing)            │
│ nchat_data_deletion_requests - GDPR deletion (existing)             │
│ nchat_consent_purposes     - Consent purpose definitions            │
│ nchat_consent_records      - User consent records                   │
│ nchat_user_consents        - User consent state (existing)          │
│ nchat_privacy_settings     - User privacy preferences (existing)    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          AUDIT TABLES                               │
├─────────────────────────────────────────────────────────────────────┤
│ nchat_audit_log            - Immutable audit trail (new)            │
│ nchat_compliance_audit_log - Compliance-specific audit (existing)   │
│ nchat_compliance_reports   - Generated compliance reports           │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 New Migration File

Create migration `027_moderation_compliance_system.sql`:

```sql
-- ============================================================================
-- MODERATION & COMPLIANCE SYSTEM v1.0
-- Tasks 101-105: Reports, AI Moderation, Legal Hold, GDPR, Audit
-- ============================================================================

-- See sections 1.6, 2.6, 3.3, 4.7, 5.3 for individual table definitions
-- This migration consolidates all new tables and extensions
```

---

## 7. API Endpoints

### 7.1 Reporting APIs

```typescript
// POST /api/reports - Create a new report
interface CreateReportRequest {
  report_type: 'message' | 'user' | 'channel' | 'file'
  target_id: string
  category: ViolationCategory
  subcategory?: string
  description?: string
  evidence_urls?: string[]
}

interface CreateReportResponse {
  id: string
  status: 'pending'
  message: string
  estimated_review_time?: string
}

// GET /api/reports/{id} - Get report status (reporter only)
// GET /api/admin/reports - Get all reports (moderators)
// GET /api/admin/reports/queue - Get moderation queue
// PATCH /api/admin/reports/{id} - Update report (assign, resolve)
// POST /api/admin/reports/{id}/action - Take moderation action

// POST /api/reports/{id}/appeal - Appeal a decision
interface AppealRequest {
  reason: string
  evidence_urls?: string[]
}
```

### 7.2 Moderation APIs

```typescript
// POST /api/moderation/scan - Scan content (internal)
interface ScanRequest {
  content_type: 'text' | 'image' | 'file'
  content: string // Text or URL
  context?: {
    channel_id?: string
    user_id?: string
  }
}

interface ScanResponse {
  safe: boolean
  scores: {
    toxicity: number
    nsfw: number
    spam: number
    profanity: number
  }
  flags: string[]
  action_required?: string
}

// GET /api/admin/moderation/queue - Get moderation queue
// POST /api/admin/moderation/action - Take action
interface ModerationActionRequest {
  queue_id: string
  action: 'approve' | 'reject' | 'warn' | 'mute' | 'ban'
  duration?: number // Minutes for mute/ban
  reason?: string
  notify_user: boolean
}

// CRUD for moderation rules
// GET /api/admin/moderation/rules
// POST /api/admin/moderation/rules
// PATCH /api/admin/moderation/rules/{id}
// DELETE /api/admin/moderation/rules/{id}

// Word list management
// GET /api/admin/moderation/word-lists
// POST /api/admin/moderation/word-lists
// PATCH /api/admin/moderation/word-lists/{id}
// DELETE /api/admin/moderation/word-lists/{id}
```

### 7.3 Legal Hold APIs

```typescript
// POST /api/admin/legal-holds - Create legal hold
interface CreateLegalHoldRequest {
  name: string
  matter_name: string
  matter_number?: string
  custodians: string[] // User IDs
  channels?: string[] // Channel IDs
  start_date: string // ISO date
  end_date?: string
  keywords?: string[]
  notify_custodians: boolean
}

// GET /api/admin/legal-holds - List all holds
// GET /api/admin/legal-holds/{id} - Get hold details
// PATCH /api/admin/legal-holds/{id} - Update hold
// POST /api/admin/legal-holds/{id}/release - Release hold

// POST /api/admin/legal-holds/{id}/export - Request export
interface ExportRequest {
  export_type: 'full' | 'messages' | 'files' | 'metadata'
  format: 'zip' | 'json' | 'load_file'
  custodian_ids?: string[]
  date_from?: string
  date_to?: string
}
```

### 7.4 GDPR/Compliance APIs

```typescript
// User-facing endpoints
// POST /api/compliance/data-export - Request data export
interface DataExportRequest {
  categories: string[]
  format: 'json' | 'csv' | 'zip'
  date_range?: { start: string; end: string }
}

// GET /api/compliance/data-export/{id}/status - Check export status
// GET /api/compliance/data-export/{id}/download - Download export

// POST /api/compliance/delete-account - Request account deletion
interface DeleteAccountRequest {
  scope: 'full_account' | 'messages_only' | 'files_only' | 'partial'
  specific_categories?: string[]
  reason?: string
}

// GET /api/compliance/delete-account/{id}/status - Check deletion status
// POST /api/compliance/delete-account/{id}/cancel - Cancel deletion

// Consent management
// GET /api/compliance/consents - Get user's consent status
// PATCH /api/compliance/consents - Update consents
interface UpdateConsentsRequest {
  consents: {
    purpose_code: string
    granted: boolean
  }[]
}

// Admin endpoints
// GET /api/admin/compliance/dashboard - Compliance dashboard stats
// GET /api/admin/compliance/data-requests - All DSAR requests
// PATCH /api/admin/compliance/data-requests/{id} - Process request
```

### 7.5 Audit Log APIs

```typescript
// GET /api/admin/audit-log - Query audit logs
interface AuditLogQuery {
  start_date?: string
  end_date?: string
  event_types?: string[]
  categories?: string[]
  actor_id?: string
  target_type?: string
  target_id?: string
  severity?: string[]
  success?: boolean
  search?: string
  page?: number
  limit?: number
}

interface AuditLogResponse {
  items: AuditLogEntry[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

// GET /api/admin/audit-log/export - Export audit logs
interface ExportAuditLogRequest {
  format: 'json' | 'csv' | 'syslog' | 'cef' | 'leef'
  query: AuditLogQuery
}

// GET /api/admin/audit-log/verify - Verify log integrity
interface VerifyResponse {
  total_records: number
  verified_records: number
  is_valid: boolean
  broken_chain_at?: number
  last_verified: string
}

// GET /api/admin/audit-log/stats - Audit statistics
```

---

## 8. Admin Dashboard

### 8.1 Moderation Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ MODERATION DASHBOARD                                    [Settings]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│
│  │   Pending    │  │   High       │  │   Reviewed   │  │  Actions ││
│  │     127      │  │   Priority   │  │    Today     │  │   Today  ││
│  │   Reports    │  │     23       │  │     89       │  │    45    ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘│
│                                                                     │
│  MODERATION QUEUE                          [Filter ▼] [Search...]   │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ ● Toxic    User: john@... | "This message cont..." | 5m ago    ││
│  │            [View] [Approve] [Warn] [Delete] [Ban]              ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │ ● NSFW     Image in #general | user: alice@... | 12m ago       ││
│  │            [View Image] [Approve] [Delete] [Warn User]         ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │ ● Spam     Multiple messages from bot@... | 15m ago            ││
│  │            [View All] [Approve] [Delete All] [Ban User]        ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  AI MODERATION STATS (Last 24 Hours)                               │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Messages Scanned: 12,456  |  Flagged: 234 (1.9%)              ││
│  │  Auto-Actions: 45  |  False Positives: 12  |  Accuracy: 94.8%  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Compliance Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ COMPLIANCE DASHBOARD                                    [Settings]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│
│  │   Active     │  │   Pending    │  │   Pending    │  │  Audit   ││
│  │   Legal      │  │   Export     │  │   Deletion   │  │  Events  ││
│  │   Holds: 3   │  │   Reqs: 5    │  │   Reqs: 2    │  │  Today:  ││
│  └──────────────┘  └──────────────┘  └──────────────┘  │  1,234   ││
│                                                         └──────────┘│
│  DATA SUBJECT REQUESTS                      [New Request] [Export]  │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Type     | User           | Status     | Created    | Actions  ││
│  ├──────────┼────────────────┼────────────┼────────────┼──────────┤│
│  │ Export   | user@email.com | Processing | 2h ago     | [View]   ││
│  │ Delete   | ex@company.com | Pending    | 1d ago     | [Review] ││
│  │ Export   | john@doe.com   | Completed  | 3d ago     | [View]   ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  LEGAL HOLDS                                          [Create Hold] │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Name           | Matter #     | Custodians | Status  | Actions ││
│  ├────────────────┼──────────────┼────────────┼─────────┼─────────┤│
│  │ Patent Case A  | CASE-2026-01 | 5 users    | Active  | [Manage]││
│  │ HR Matter B    | HR-2026-03   | 2 users    | Active  | [Manage]││
│  │ Audit 2025     | AUD-2025-Q4  | 12 users   | Released| [View]  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  COMPLIANCE STATUS                                                  │
│  ┌────────────┬────────────┬────────────┬────────────┬────────────┐│
│  │    GDPR    │    CCPA    │   HIPAA    │   SOC 2    │  ISO27001  ││
│  │   ✓ Pass   │   ✓ Pass   │  ⚠ Partial │  ✓ Pass    │  ○ N/A     ││
│  └────────────┴────────────┴────────────┴────────────┴────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.3 Audit Log Viewer

```
┌─────────────────────────────────────────────────────────────────────┐
│ AUDIT LOG VIEWER                           [Export] [Verify Chain]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Filters:                                                           │
│  [Date Range ▼] [Category ▼] [Severity ▼] [Actor ▼] [Search...]    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ #     | Time       | Category | Action        | Actor | Status ││
│  ├───────┼────────────┼──────────┼───────────────┼───────┼────────┤│
│  │ 12456 | 10:23:45   | auth     | login         | john@ | ✓      ││
│  │ 12455 | 10:22:31   | mod      | content_flag  | AI    | ✓      ││
│  │ 12454 | 10:20:12   | user     | role_change   | admin | ✓      ││
│  │ 12453 | 10:18:05   | message  | deleted       | jane@ | ✓      ││
│  │ 12452 | 10:15:33   | channel  | created       | bob@  | ✓      ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  Log Details (ID: 12454)                                            │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Event: user.role_changed                                        ││
│  │ Actor: admin@nself.org (Admin)                                  ││
│  │ Target: john@company.com                                        ││
│  │ Changes: role: "member" → "moderator"                           ││
│  │ IP: 192.168.1.100                                               ││
│  │ Session: sess_abc123...                                         ││
│  │ Hash: 7f83b1657ff1fc53b92dc18148a1d65d...                       ││
│  │ Previous Hash: a591a6d40bf420404a011733cfb7b190...              ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  Integrity Status: ✓ Verified | Last Check: 5 minutes ago          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.4 Component Structure

```
src/components/admin/
├── moderation/
│   ├── ModerationDashboard.tsx
│   ├── ModerationQueue.tsx
│   ├── ModerationQueueItem.tsx
│   ├── ModerationActionDialog.tsx
│   ├── ModerationRulesManager.tsx
│   ├── WordListManager.tsx
│   ├── UserModerationHistory.tsx
│   └── AIStatsPanel.tsx
├── compliance/
│   ├── ComplianceDashboard.tsx
│   ├── DataRequestsTable.tsx
│   ├── DataRequestDetail.tsx
│   ├── LegalHoldsManager.tsx
│   ├── LegalHoldDetail.tsx
│   ├── LegalHoldExportDialog.tsx
│   ├── ConsentManager.tsx
│   ├── RetentionPolicies.tsx
│   └── ComplianceBadges.tsx
├── audit/
│   ├── AuditLogViewer.tsx
│   ├── AuditLogFilters.tsx
│   ├── AuditLogEntry.tsx
│   ├── AuditLogDetail.tsx
│   ├── AuditExportDialog.tsx
│   └── IntegrityVerifier.tsx
└── reports/
    ├── ReportsQueue.tsx
    ├── ReportDetail.tsx
    ├── ReportActionDialog.tsx
    ├── ReportStats.tsx
    └── AppealsManager.tsx
```

---

## 9. Automation Rules

### 9.1 Rule Engine Architecture

```typescript
interface AutomationRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  priority: number // Higher = runs first

  // Trigger
  trigger: {
    type: 'event' | 'schedule' | 'threshold'
    events?: string[] // Event types
    schedule?: string // Cron expression
    threshold?: {
      metric: string
      operator: '>' | '<' | '=' | '>=' | '<='
      value: number
      window_minutes: number
    }
  }

  // Conditions (all must be true)
  conditions: {
    field: string
    operator: 'equals' | 'contains' | 'matches' | 'gt' | 'lt' | 'in'
    value: any
  }[]

  // Actions (executed in order)
  actions: {
    type: string
    parameters: Record<string, any>
  }[]

  // Rate Limiting
  rate_limit?: {
    max_executions: number
    window_minutes: number
  }
}
```

### 9.2 Pre-built Automation Templates

```typescript
const AUTOMATION_TEMPLATES = {
  // Escalation Rules
  'auto-escalate-critical': {
    name: 'Auto-Escalate Critical Reports',
    trigger: { type: 'event', events: ['report.created'] },
    conditions: [{ field: 'category', operator: 'in', value: ['threats', 'illegal_activity'] }],
    actions: [
      { type: 'set_priority', parameters: { priority: 'critical' } },
      { type: 'notify', parameters: { roles: ['admin'], channel: 'slack' } },
    ],
  },

  // Volume-based Escalation
  'mass-report-detection': {
    name: 'Mass Report Detection',
    trigger: {
      type: 'threshold',
      threshold: { metric: 'reports.same_target', operator: '>=', value: 5, window_minutes: 60 },
    },
    actions: [
      { type: 'create_incident', parameters: { severity: 'high' } },
      { type: 'notify', parameters: { roles: ['admin', 'moderator'] } },
    ],
  },

  // Auto-moderation
  'auto-hide-nsfw': {
    name: 'Auto-Hide NSFW Content',
    trigger: { type: 'event', events: ['content.scanned'] },
    conditions: [{ field: 'nsfw_score', operator: 'gt', value: 0.85 }],
    actions: [
      { type: 'hide_content', parameters: {} },
      { type: 'add_to_queue', parameters: { priority: 'high' } },
      { type: 'notify_user', parameters: { template: 'content_hidden' } },
    ],
  },

  // Progressive Discipline
  'progressive-warnings': {
    name: 'Progressive Warning System',
    trigger: { type: 'event', events: ['moderation.action_taken'] },
    conditions: [{ field: 'action', operator: 'equals', value: 'warn' }],
    actions: [
      { type: 'increment_warning_count', parameters: {} },
      {
        type: 'conditional_action',
        parameters: {
          conditions: [
            { when: 'warning_count >= 3', action: 'mute', duration: 60 },
            { when: 'warning_count >= 5', action: 'mute', duration: 1440 },
            { when: 'warning_count >= 7', action: 'ban', duration: 10080 },
          ],
        },
      },
    ],
  },

  // GDPR Automation
  'auto-process-export': {
    name: 'Auto-Process Data Exports',
    trigger: { type: 'event', events: ['data_export.requested'] },
    conditions: [{ field: 'user.verified', operator: 'equals', value: true }],
    actions: [
      { type: 'start_export_job', parameters: {} },
      { type: 'notify_user', parameters: { template: 'export_started' } },
    ],
  },

  // Audit Alert
  'suspicious-activity-alert': {
    name: 'Suspicious Activity Alert',
    trigger: { type: 'event', events: ['auth.failed'] },
    conditions: [{ field: 'consecutive_failures', operator: 'gte', value: 5 }],
    actions: [
      { type: 'lock_account', parameters: { duration: 30 } },
      { type: 'create_security_alert', parameters: { severity: 'high' } },
      { type: 'notify', parameters: { roles: ['admin'], channel: 'email' } },
    ],
  },
}
```

### 9.3 Notification Triggers

```typescript
interface NotificationConfig {
  // Moderation Notifications
  moderation: {
    new_high_priority_report: boolean
    queue_threshold_reached: number
    escalation_required: boolean
  }

  // Compliance Notifications
  compliance: {
    legal_hold_created: boolean
    legal_hold_released: boolean
    data_request_received: boolean
    data_request_deadline_approaching: boolean
    consent_withdrawal: boolean
  }

  // Security Notifications
  security: {
    suspicious_login: boolean
    audit_integrity_failure: boolean
    bulk_data_access: boolean
  }

  // Channels
  channels: {
    email: string[]
    slack_webhook?: string
    teams_webhook?: string
    pagerduty?: string
  }
}
```

---

## 10. Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)

| Task                                     | Priority | Effort | Dependencies |
| ---------------------------------------- | -------- | ------ | ------------ |
| Create migration 027 with all tables     | High     | 2d     | -            |
| Implement base API routes                | High     | 3d     | Migration    |
| Set up AI moderation service integration | High     | 3d     | -            |
| Create audit log infrastructure          | High     | 2d     | Migration    |

### Phase 2: Reporting System (Weeks 3-4)

| Task                          | Priority | Effort | Dependencies |
| ----------------------------- | -------- | ------ | ------------ |
| Report submission flow        | High     | 2d     | Phase 1      |
| Report queue for moderators   | High     | 3d     | Phase 1      |
| Report actions and resolution | High     | 2d     | Queue        |
| Appeal system                 | Medium   | 2d     | Actions      |
| Report statistics             | Medium   | 1d     | Queue        |

### Phase 3: AI Moderation (Weeks 5-6)

| Task                           | Priority | Effort | Dependencies   |
| ------------------------------ | -------- | ------ | -------------- |
| OpenAI moderation integration  | High     | 2d     | Phase 1        |
| Image moderation (Rekognition) | High     | 3d     | Phase 1        |
| Automated actions engine       | High     | 3d     | AI Integration |
| Word list management           | Medium   | 2d     | Phase 1        |
| Training data collection       | Low      | 2d     | AI Integration |

### Phase 4: Legal Hold & Retention (Weeks 7-8)

| Task                         | Priority | Effort | Dependencies    |
| ---------------------------- | -------- | ------ | --------------- |
| Legal hold CRUD              | High     | 2d     | Phase 1         |
| Custodian notifications      | High     | 1d     | Legal hold CRUD |
| eDiscovery export            | High     | 3d     | Legal hold      |
| Retention policy enforcement | High     | 3d     | Phase 1         |
| Chain of custody tracking    | Medium   | 2d     | Export          |

### Phase 5: GDPR Compliance (Weeks 9-10)

| Task                   | Priority | Effort | Dependencies |
| ---------------------- | -------- | ------ | ------------ |
| Data export workflow   | High     | 3d     | Phase 1      |
| Data deletion workflow | High     | 3d     | Phase 1      |
| Consent management UI  | High     | 2d     | Phase 1      |
| DPO integration        | Medium   | 1d     | Phase 1      |
| Privacy dashboard      | Medium   | 2d     | All GDPR     |

### Phase 6: Admin Dashboard (Weeks 11-12)

| Task                  | Priority | Effort | Dependencies   |
| --------------------- | -------- | ------ | -------------- |
| Moderation dashboard  | High     | 3d     | Phase 2, 3     |
| Compliance dashboard  | High     | 3d     | Phase 4, 5     |
| Audit log viewer      | High     | 2d     | Phase 1        |
| Automation rules UI   | Medium   | 2d     | Phase 1        |
| Statistics and charts | Medium   | 2d     | All dashboards |

### Phase 7: Testing & Hardening (Weeks 13-14)

| Task                        | Priority | Effort | Dependencies |
| --------------------------- | -------- | ------ | ------------ |
| Unit tests for all services | High     | 3d     | All phases   |
| Integration tests           | High     | 3d     | Unit tests   |
| E2E tests for workflows     | High     | 2d     | Integration  |
| Load testing                | Medium   | 2d     | E2E tests    |
| Security audit              | High     | 2d     | All tests    |
| Documentation               | Medium   | 2d     | All phases   |

---

## 11. Testing Strategy

### 11.1 Unit Tests

```typescript
// Example test cases
describe('ReportService', () => {
  describe('createReport', () => {
    it('should create a report with valid data')
    it('should prevent duplicate reports from same user')
    it('should auto-classify report priority')
    it('should notify moderators for high-priority reports')
  })

  describe('resolveReport', () => {
    it('should update report status')
    it('should create audit log entry')
    it('should execute configured action')
    it('should send notification to reporter')
  })
})

describe('AIModerationService', () => {
  describe('scanContent', () => {
    it('should detect toxic content')
    it('should detect NSFW images')
    it('should detect spam patterns')
    it('should respect custom word lists')
    it('should handle API failures gracefully')
  })
})

describe('AuditLogService', () => {
  describe('appendEntry', () => {
    it('should compute hash chain correctly')
    it('should prevent duplicate sequence IDs')
    it('should encrypt sensitive fields')
  })

  describe('verifyIntegrity', () => {
    it('should detect tampered records')
    it('should verify complete chain')
  })
})
```

### 11.2 Integration Tests

```typescript
describe('Moderation Workflow', () => {
  it('should process report from submission to resolution')
  it('should handle appeal workflow')
  it('should escalate based on automation rules')
})

describe('GDPR Workflow', () => {
  it('should complete data export request')
  it('should block deletion when legal hold active')
  it('should anonymize messages after user deletion')
})

describe('Legal Hold Workflow', () => {
  it('should prevent data deletion during hold')
  it('should export data with chain of custody')
  it('should notify custodians')
})
```

### 11.3 E2E Tests

```typescript
describe('Admin Dashboard', () => {
  it('should display moderation queue')
  it('should allow taking moderation actions')
  it('should filter and search audit logs')
  it('should export compliance reports')
})

describe('User Privacy', () => {
  it('should allow user to request data export')
  it('should allow user to manage consents')
  it('should allow user to delete account')
})
```

---

## 12. References

### Moderation Best Practices

- [GetStream: Chat Moderation 101](https://getstream.io/blog/chat-moderation/)
- [CometChat: 9 Effective Chat Moderation Best Practices](https://www.cometchat.com/blog/chat-moderation-best-practices)
- [RST Software: Smart Chat Moderation Strategies](https://www.rst.software/blog/smart-chat-moderation)

### AI Moderation APIs

- [Estha: 12 Best AI Content Moderation APIs](https://estha.ai/blog/12-best-ai-content-moderation-apis-compared-the-complete-guide/)
- [Eden AI: Best Text Moderation APIs 2025](https://www.edenai.co/post/best-text-moderation-apis)
- [OpenAI Moderation API](https://platform.openai.com/docs/guides/moderation)

### GDPR Compliance

- [Microsoft GDPR Documentation](https://learn.microsoft.com/en-us/compliance/regulatory/gdpr)
- [ComplyDog: GDPR Compliance Checklist 2025](https://complydog.com/blog/gdpr-compliance-checklist-complete-guide-b2b-saas-companies)
- [Jetico: Right to Erasure Guide](https://jetico.com/blog/how-right-erasure-applied-under-gdpr-complete-guide-organizational-compliance/)

### Legal Hold & eDiscovery

- [Microsoft: Teams Legal Hold](https://learn.microsoft.com/en-us/purview/ediscovery-teams-legal-hold)
- [Slack: Create and Manage Legal Holds](https://slack.com/help/articles/4401830811795-Create-and-manage-legal-holds)
- [Jatheon: Legal Hold Explained](https://jatheon.com/blog/legal-hold-feature-in-email-archiving/)

### Audit Log Design

- [DesignGurus: Immutable Audit Trails](https://www.designgurus.io/answers/detail/how-do-you-enforce-immutability-and-appendonly-audit-trails)
- [HubiFi: Immutable Audit Log Guide](https://www.hubifi.com/blog/immutable-audit-log-guide)
- [DZone: SQL Server Ledger for Audit Trails](https://dzone.com/articles/sql-server-ledger-tamper-evident-audit-trails)

### Database Design

- [SQLServerCentral: Content Moderation Database Architecture](https://www.sqlservercentral.com/articles/database-architecture-considerations-for-implementing-content-moderation-services)
- [Martin Fowler: Reporting Database](https://martinfowler.com/bliki/ReportingDatabase.html)

---

## Appendix A: Configuration Schema

```typescript
// Add to AppConfig interface in src/config/app-config.ts
interface ModerationComplianceConfig {
  moderation: {
    // ... existing moderation config

    // New: Reporting system
    reporting: {
      enabled: boolean
      categories: ViolationCategory[]
      autoEscalateThreshold: number
      appealWindowDays: number
    }
  }

  compliance: {
    // GDPR
    gdpr: {
      enabled: boolean
      dpoEmail?: string
      exportTimeoutDays: number
      deletionGraceDays: number
    }

    // Legal Hold
    legalHold: {
      enabled: boolean
      notifyCustodians: boolean
      exportFormats: string[]
    }

    // Audit
    audit: {
      enabled: boolean
      retentionDays: number
      tamperProof: boolean
      exportFormats: string[]
    }
  }
}
```

---

## Appendix B: GraphQL Schema

```graphql
# Reports
type Report {
  id: ID!
  reportType: ReportType!
  targetId: ID!
  reporter: User!
  category: ViolationCategory!
  description: String
  status: ReportStatus!
  priority: Priority!
  createdAt: DateTime!
  resolvedAt: DateTime
  resolution: String
}

type ModerationQueueItem {
  id: ID!
  contentType: ContentType!
  contentId: ID!
  user: User!
  status: ModerationStatus!
  priority: Priority!
  aiFlags: [AIFlag!]!
  toxicScore: Float!
  nsfwScore: Float!
  spamScore: Float!
  createdAt: DateTime!
}

type AuditLogEntry {
  id: ID!
  sequenceId: Int!
  eventType: String!
  category: String!
  actor: AuditActor!
  target: AuditTarget
  action: String!
  details: JSON!
  timestamp: DateTime!
  hash: String!
}

type DataExportRequest {
  id: ID!
  userId: ID!
  status: RequestStatus!
  categories: [String!]!
  format: ExportFormat!
  downloadUrl: String
  expiresAt: DateTime
  createdAt: DateTime!
}

type LegalHold {
  id: ID!
  name: String!
  matterName: String!
  matterNumber: String
  custodians: [User!]!
  channels: [Channel!]
  status: HoldStatus!
  startDate: DateTime!
  endDate: DateTime
  createdAt: DateTime!
}
```

---

**Document Status**: Ready for Review
**Next Steps**: Engineering review, timeline confirmation, resource allocation
