# Smart Search User Guide

**Version**: 1.0.0
**Last Updated**: January 31, 2026
**For**: nself-chat v0.7.0+

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Natural Language Queries](#natural-language-queries)
4. [Search Filters](#search-filters)
5. [Search History](#search-history)
6. [Search Tips & Best Practices](#search-tips--best-practices)
7. [Voice Search](#voice-search)
8. [Search Analytics](#search-analytics)
9. [Privacy & Data](#privacy--data)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

### What is Semantic Search?

Smart Search in nself-chat uses **semantic search** powered by AI embeddings to understand the meaning and context of your queries, not just match keywords. Unlike traditional search that looks for exact word matches, semantic search understands:

- **Intent**: What you're trying to find, even if you don't use the exact words
- **Context**: Related concepts and synonyms
- **Relationships**: Connections between messages, users, and channels
- **Sentiment**: Emotional tone and urgency

### Benefits of Semantic Search

**Traditional Keyword Search:**

```
Query: "server down"
Finds: Only messages containing exact words "server" AND "down"
Misses: "backend not responding", "API outage", "service unavailable"
```

**Semantic Search:**

```
Query: "server down"
Finds: All related messages:
  ✓ "server down"
  ✓ "backend not responding"
  ✓ "API returning 503 errors"
  ✓ "database connection timeout"
  ✓ "can't access production"
```

### Key Features

- **Natural Language**: Ask questions like you would to a colleague
- **Context-Aware**: Understands technical jargon, acronyms, and domain language
- **Multi-Modal**: Search text, code, files, and metadata
- **Real-Time**: Results update as new messages arrive
- **Intelligent Ranking**: Most relevant results appear first
- **Hybrid Search**: Combines semantic understanding with keyword precision

### How It Works

Every message is converted into a **vector embedding** - a numerical representation of its meaning:

```
Message: "Our Q4 revenue exceeded expectations"
Embedding: [0.23, -0.45, 0.67, ..., 0.12] (1536 dimensions)
```

Similar messages have similar embeddings:

```
"Q4 sales were higher than predicted" ← Very similar embedding
"It's sunny today" ← Very different embedding
```

When you search:

1. **Your query is embedded** - Converted to the same vector format
2. **Similarity calculation** - Compare your query vector to all message vectors
3. **Ranking** - Results sorted by cosine similarity (how close the vectors are)
4. **Filtering** - Apply additional filters (date, channel, user, etc.)
5. **Return results** - Show most relevant matches

---

## Getting Started

### Accessing Smart Search

#### Keyboard Shortcuts

| Platform      | Shortcut           | Action                   |
| ------------- | ------------------ | ------------------------ |
| Windows/Linux | `Ctrl + K`         | Open search modal        |
| macOS         | `Cmd + K`          | Open search modal        |
| All           | `Ctrl + Shift + F` | Open advanced search     |
| All           | `/`                | Quick search (from chat) |
| All           | `Esc`              | Close search modal       |

#### UI Access

1. **Top Navigation**: Click the search icon (🔍) in the header
2. **Chat Interface**: Click "Search messages" in the channel header
3. **Sidebar**: Use the search bar at the top of the channel list

### Basic Search Interface

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Search messages...                           [Cmd+K] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Recent Searches:                                       │
│  • deployment issues last week                          │
│  • API documentation                                    │
│  • meeting notes from Sarah                             │
│                                                         │
│  Suggestions:                                           │
│  • Messages you starred                                 │
│  • Unread mentions                                      │
│  • Files shared today                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Your First Search

1. **Open Search**: Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
2. **Type Your Query**: Enter a natural language question
   ```
   Example: "What did John say about the deadline?"
   ```
3. **Review Results**: Results appear instantly as you type
4. **Refine**: Add filters or modify your query
5. **Navigate**: Use arrow keys or click to view messages

### Quick Search Tips

- **Be Specific**: "Docker deployment error on staging" > "error"
- **Use Context**: "meeting with Sarah about Q1 goals" > "meeting"
- **Natural Language**: Write like you're asking a person
- **Combine Filters**: Use date ranges, channels, and users together

---

## Natural Language Queries

### Basic Questions

Smart Search understands conversational questions:

#### Simple Questions

```
✓ "What is our deployment process?"
✓ "How do I reset my password?"
✓ "Where is the API documentation?"
✓ "When is the next release?"
```

#### Who/What/Where/When/Why

```
✓ "Who approved the design changes?"
✓ "What dependencies does the auth service have?"
✓ "Where are the test credentials stored?"
✓ "When did we decide to use PostgreSQL?"
✓ "Why did the build fail last night?"
```

### Advanced Queries

#### Temporal Queries

```
✓ "security patches from last month"
✓ "messages about the bug since Tuesday"
✓ "files shared in the past 3 days"
✓ "discussions before the launch"
✓ "updates during the outage"
```

#### Contextual Queries

```
✓ "urgent issues requiring immediate attention"
✓ "positive feedback about the new feature"
✓ "technical debt we need to address"
✓ "decisions made in yesterday's standup"
✓ "blockers preventing deployment"
```

#### Relationship Queries

```
✓ "conversations between Alice and Bob"
✓ "questions directed at the DevOps team"
✓ "threads started by managers"
✓ "replies to my messages about billing"
✓ "mentions of me in #engineering"
```

### Query Examples by Use Case

#### Project Management

```
Query: "What are the open action items from sprint planning?"

Finds:
• TODO lists in meeting notes
• Assigned tasks in threads
• Blockers mentioned in standups
• Follow-up items from reviews
```

#### Troubleshooting

```
Query: "database connection errors in production"

Finds:
• Error logs and stack traces
• Related incident reports
• Investigation threads
• Resolution discussions
• Similar past issues
```

#### Documentation

```
Query: "how to configure authentication providers"

Finds:
• Setup instructions
• Configuration examples
• Troubleshooting guides
• Related discussions
• Code snippets
```

#### Onboarding

```
Query: "where can I find development environment setup?"

Finds:
• Setup guides
• Installation instructions
• Environment variables
• Common issues
• Tool recommendations
```

### Semantic Understanding Examples

#### Synonyms and Related Concepts

```
Query: "slow performance"

Also Finds:
• "app is laggy"
• "response time increased"
• "high latency"
• "timeout errors"
• "feels sluggish"
```

#### Technical Jargon

```
Query: "k8s deployment"

Understands:
• Kubernetes = k8s
• Deploy = deployment = rolled out
• Cluster, pods, services
• Related infrastructure terms
```

#### Acronyms and Abbreviations

```
Query: "CI/CD pipeline"

Recognizes:
• CI = Continuous Integration
• CD = Continuous Deployment
• Related: GitHub Actions, Jenkins, etc.
```

### Query Operators

#### Boolean Operators

Use AND, OR, NOT for precise control:

```
Examples:
• "docker AND kubernetes" - Both terms must appear
• "react OR vue" - Either term can appear
• "javascript NOT typescript" - Exclude TypeScript
• "(node OR deno) AND server" - Grouped conditions
```

#### Phrase Search

Use quotes for exact phrases:

```
Examples:
• "out of memory" - Exact phrase match
• "error code 500" - Preserve word order
• "John Smith" - Full name as written
```

#### Wildcard Search

Use asterisk for partial matches:

```
Examples:
• "deploy*" - Matches deploy, deployment, deployed, etc.
• "auth*" - Matches auth, authentication, authorize, etc.
• "*sql" - Matches MySQL, PostgreSQL, SQL, etc.
```

### 30+ Natural Language Query Examples

#### Work & Projects

```
1. "What are we working on this sprint?"
2. "Show me recent updates from the design team"
3. "Find discussions about the mobile app"
4. "What blockers were mentioned this week?"
5. "Who needs help with their tasks?"
6. "What features are we shipping next?"
7. "Show me the product roadmap"
```

#### Questions & Answers

```
8. "How do I deploy to production?"
9. "What's the process for requesting time off?"
10. "Where do I submit expense reports?"
11. "Who do I contact about benefits?"
12. "What are the coding standards?"
13. "How do I access the VPN?"
14. "What's the security policy?"
```

#### People & Teams

```
15. "What did Alice say about the design?"
16. "Find Bob's feedback on the proposal"
17. "Show me Charlie's recent updates"
18. "Who mentioned the API in the last week?"
19. "What did the team decide about the feature?"
20. "Find all messages from engineering leads"
```

#### Topics & Discussions

```
21. "Find conversations about performance issues"
22. "Show me all feedback on the new UI"
23. "What are people saying about the release?"
24. "Find discussions about security"
25. "Show me product ideas and suggestions"
26. "What concerns were raised about the change?"
```

#### Time-Based

```
27. "What happened while I was out?"
28. "What did I miss this week?"
29. "Show me important updates from yesterday"
30. "Find recent decisions about the project"
31. "What was discussed in the last meeting?"
32. "What changed since last Friday?"
```

---

## Search Filters

### Filter Panel

Access filters by clicking "Filters" in the search modal or pressing `Ctrl+Shift+F`:

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 database connection errors                           │
├─────────────────────────────────────────────────────────┤
│ Filters                                    [Clear All]  │
│                                                         │
│ 📅 Date Range:     [Last 7 days ▼]                     │
│ 👤 From:           [Any user ▼]                         │
│ 💬 In:             [All channels ▼]                     │
│ 📎 Has:            [ ] Files  [ ] Links  [ ] Code       │
│ ⭐ Status:         [ ] Starred  [ ] Unread              │
│ 🎯 Advanced:       [Show more ▼]                        │
│                                                         │
│ Results: 47 messages                       [Search]     │
└─────────────────────────────────────────────────────────┘
```

### Date Range Filter

#### Predefined Ranges

- Today
- Yesterday
- Last 7 days
- Last 30 days
- Last 3 months
- Last year
- All time

#### Custom Range

```
From: [Jan 15, 2026 ▼]
To:   [Jan 31, 2026 ▼]
```

#### Relative Dates

```
Examples:
• "last week"
• "past 3 days"
• "since Monday"
• "before Q4"
• "during December"
```

#### Advanced Date Syntax

```
after:2026-01-01        Messages after Jan 1, 2026
before:2026-01-31       Messages before Jan 31, 2026
on:2026-01-15           Messages exactly on Jan 15, 2026
after:yesterday         Messages after yesterday
before:last-week        Messages before last week
on:today                Messages from today
during:business-hours   Messages sent 9am-5pm
during:weekend          Messages sent Saturday-Sunday
during:night            Messages sent 6pm-6am
```

### User Filter

#### Search by User

- **Select from dropdown**: All workspace members
- **Type to filter**: Start typing name or email
- **Multiple users**: Select multiple with checkboxes

```
From user:
✓ Alice Johnson (alice@company.com)
✓ Bob Smith (bob@company.com)
○ Charlie Davis
○ Diana Prince
```

#### User Roles

- Filter by role: Owner, Admin, Moderator, Member, Guest
- Team filter: Engineering, Design, Product, etc.

#### User Filter Syntax

```
from:alice              Messages from @alice
from:alice from:bob     Messages from @alice OR @bob
from:@engineering       Messages from anyone in @engineering group
from:me                 Your own messages
```

### Channel Filter

#### Channel Selection

- **All channels**: Search across entire workspace
- **Current channel**: Only this channel
- **Specific channels**: Select multiple channels
- **Channel types**: Public, Private, DMs, Threads

```
In channels:
✓ #engineering
✓ #devops
○ #design
○ #product
○ Direct Messages
```

#### Thread Filters

- **Main messages only**: Exclude thread replies
- **Thread replies only**: Only threaded conversations
- **Include threads**: All messages and replies

#### Channel Filter Syntax

```
in:general              Messages in #general
in:engineering in:design Messages in #engineering OR #design
in:private              All private channels you have access to
in:dm                   All direct messages
in:current              Current channel only
```

### Message Type Filters

#### Content Type

````
Has:
☑ Files (PDF, images, videos, etc.)
☑ Links (URLs to external resources)
☑ Code blocks (```code```)
☐ Mentions (@user or @channel)
☐ Reactions (👍, ❤️, etc.)
☐ Polls or forms
````

#### File Type Filter

```
File type:
○ All files
○ Documents (.pdf, .doc, .txt)
○ Images (.png, .jpg, .svg)
○ Videos (.mp4, .mov)
○ Archives (.zip, .tar)
○ Code (.js, .py, .go)
```

#### Attachment Filter Syntax

```
has:attachment          Messages with any attachment
has:image              Messages with images (jpg, png, gif, etc.)
has:file               Messages with file attachments
has:link               Messages with URLs
has:code               Messages with code blocks
has:reaction           Messages that have reactions
has:pdf                Messages with PDF attachments
has:video              Messages with video files
```

### Status Filters

#### Message Status

```
☐ Starred (messages you starred)
☐ Pinned (pinned to channel)
☐ Unread (you haven't read)
☐ Mentions (you were mentioned)
☐ Threads (you participated in)
```

#### Reaction Filter

```
Has reaction:
• Any reaction
• Specific emoji: 👍 ❤️ 🎉 🚀
• From specific users
• Min count: [3] reactions
```

#### Status Filter Syntax

```
is:starred              Your starred messages
is:pinned               Pinned messages
is:thread               Messages that started threads
is:mention              Messages mentioning you
is:unread               Unread messages
is:edited               Messages that were edited
is:deleted              Deleted messages (if you have permission)
```

### Advanced Boolean Filters

#### Combining Filters

```
Example: Critical production issues

Query: "error OR failure OR outage"
Filters:
  • Channel: #production, #alerts
  • Date: Last 24 hours
  • Has: @channel mention
  • User: DevOps team members
```

#### Exclusion Filters

```
Example: Non-automated messages

Query: "deployment"
Exclude:
  • From: bot@company.com
  • Has: "[Automated]" in text
  • Channel: #bot-logs
```

#### Complex Filter Combinations

```
from:alice in:engineering after:2026-01-01
  → Messages from Alice in #engineering since Jan 1

has:attachment is:unread
  → Unread messages with attachments

"bug" from:bob before:last-week
  → Bob's messages about bugs from over a week ago

deployment in:devops after:yesterday has:link
  → Recent deployment messages in #devops with links
```

### Filter Presets

Save commonly used filter combinations:

```
Saved Searches:
1. "Production Incidents"
   - Channels: #production, #alerts
   - Has: @channel
   - Last 30 days

2. "My Pending Tasks"
   - Mentions: @me
   - Has: TODO, checkbox
   - Status: Unread

3. "Team Decisions"
   - Users: Team leads
   - Has: "decided", "approved"
   - Last quarter
```

---

## Search History

### Accessing Search History

Search history is automatically saved and accessible:

#### Recent Searches Panel

```
Recent Searches (Last 10):
1. database migration issues          2 minutes ago
2. API rate limiting configuration    1 hour ago
3. meeting notes from yesterday       3 hours ago
4. deployment checklist              Yesterday
5. security audit findings           2 days ago
```

#### Search History Page

- Access via: Settings → Search History
- View all past searches
- Filter by date, frequency
- Export search history

### Saving Searches

#### Quick Save

1. Perform a search
2. Click "Save this search" (⭐ icon)
3. Name your search
4. Choose folder (optional)

```
Save Search:
Name: [Production errors last week]
Folder: [Troubleshooting ▼]
Notify me: ☑ When new results appear
[Cancel] [Save]
```

#### Search Folders

Organize saved searches:

```
My Saved Searches
├── 📁 Daily Checks
│   ├── Unread mentions
│   ├── Open action items
│   └── Team updates
├── 📁 Troubleshooting
│   ├── Error logs
│   ├── Performance issues
│   └── Bug reports
└── 📁 Documentation
    ├── Setup guides
    └── Best practices
```

### Re-running Searches

#### Manual Re-run

- Click any saved search to run it again
- Results reflect current data
- Filters are preserved

#### Scheduled Searches

```
Run schedule:
○ Manual only
○ Every hour
○ Daily at [9:00 AM ▼]
○ Weekly on [Monday ▼]

Deliver results via:
☑ In-app notification
☑ Email digest
☐ Slack webhook
```

### Search Notifications

Get notified when saved searches find new results:

```
Notification Settings:
Search: "Critical production errors"

Notify when:
☑ New results appear
☑ Result count exceeds [10]
☐ Specific users post matches

Delivery:
☑ Push notification
☑ Email (max once per hour)
☐ SMS (urgent only)
```

### Managing Search History

#### View Full History

```
Search History (Last 30 Days):
• Total searches: 247
• Unique queries: 89
• Most searched: "deployment process" (23 times)

Recent searches:
1. database connection errors     2 min ago    12 results
2. API documentation             1 hour ago    5 results
3. meeting notes yesterday       3 hours ago   8 results
...

[Clear All] [Export CSV] [Privacy Settings]
```

#### Clear History

```
Clear Search History:
○ Last 24 hours
○ Last 7 days
○ Last 30 days
● All time

⚠️  This will delete your search history but won't affect
   saved searches or search analytics.

[Cancel] [Clear History]
```

### Exporting Search Results

#### Export Options

- **CSV**: Spreadsheet format with metadata
- **JSON**: Structured data for integration
- **PDF**: Formatted report with context
- **Markdown**: Documentation-ready format

```
Export Results:
Format: [CSV ▼]
Include: ☑ Message text
        ☑ User info
        ☑ Timestamps
        ☑ Channel names
        ☐ Attachments

Results to export: 47 messages

[Cancel] [Export]
```

#### CSV Export Format

```
id,channel,user,timestamp,message,url,attachments
msg_123,#engineering,alice,2026-01-31T10:30:00Z,"Fixed deployment bug",https://...,file1.pdf
msg_124,#devops,bob,2026-01-31T11:45:00Z,"Updated docs",https://...,
```

---

## Search Tips & Best Practices

### Writing Effective Queries

#### Be Specific

```
❌ Bad:  "error"
✓ Good: "authentication error in user login flow"

❌ Bad:  "meeting"
✓ Good: "standup meeting notes from engineering team"

❌ Bad:  "docs"
✓ Good: "API documentation for payment endpoints"
```

#### Use Natural Language

```
✓ "What was decided in the pricing discussion?"
✓ "How do we handle failed payments?"
✓ "Where is the deployment runbook?"
✓ "Who has access to production database?"
```

#### Add Context

```
Instead of:           Try:
"bug"          →     "login bug affecting mobile users"
"slow"         →     "slow API response times on checkout"
"update"       →     "status update from design team on homepage"
```

### Power User Features

#### Search Shortcuts

| Shortcut      | Action              | Example                   |
| ------------- | ------------------- | ------------------------- |
| `from:user`   | Messages from user  | `from:alice deployment`   |
| `in:channel`  | Messages in channel | `in:engineering docker`   |
| `has:link`    | Messages with links | `has:link documentation`  |
| `has:file`    | Messages with files | `has:file budget`         |
| `before:date` | Before date         | `before:2026-01-15 bug`   |
| `after:date`  | After date          | `after:yesterday meeting` |
| `is:starred`  | Starred messages    | `is:starred TODO`         |
| `is:unread`   | Unread messages     | `is:unread @me`           |

#### Combining Shortcuts

```
Examples:
• from:alice in:engineering has:code after:yesterday
• is:starred has:link in:documentation
• from:@engineering-team before:2026-01-01 "technical debt"
```

#### Advanced Operators

**Proximity Search**: Find words near each other

```
"database" NEAR[5] "connection"
→ Finds "database" within 5 words of "connection"
```

**Field Search**: Search specific fields

```
title:"Sprint Planning"      → Search message titles
author:alice                 → Messages by Alice
thread_count:>10            → Threads with 10+ replies
```

**Fuzzy Search**: Allow typos and variations

```
deployment~2                → Allows 2-character difference
"databse"                   → Auto-corrects to "database"
```

### Search Strategies

#### The Funnel Approach

1. **Start Broad**: Begin with general query
2. **Review Results**: See what you're getting
3. **Add Filters**: Narrow by date, user, channel
4. **Refine Query**: Adjust based on results
5. **Save Search**: If you'll need it again

```
Example: Finding deployment issues
1. Query: "deployment"              → 500 results
2. Filter: Last 7 days             → 120 results
3. Filter: Channel #production     → 45 results
4. Refine: "deployment failed"     → 12 results ✓
```

#### The Targeted Approach

1. **Know What You Want**: Specific information
2. **Use All Context**: Date, user, channel, keywords
3. **Apply Filters First**: Set constraints upfront
4. **Precise Query**: Exact terms

```
Example: Alice's message about API docs
Query: from:alice in:engineering "API documentation"
Filters: Last 30 days, has:link
→ 3 results ✓
```

#### The Exploratory Approach

1. **Ask Questions**: Natural language
2. **Browse Results**: See related content
3. **Follow Threads**: Click to see full context
4. **Discover Patterns**: Notice common themes

```
Example: Understanding a decision
Query: "Why did we choose PostgreSQL over MongoDB?"
→ Browse discussion threads
→ Find decision rationale
→ Discover related technical docs
```

### Common Search Patterns

#### Finding Decisions

```
Query: "(decided OR approved OR agreed) database choice"
Filters: From team leads, Last quarter
```

#### Tracking Action Items

```
Query: "TODO OR action item OR follow-up"
Filters: Mentions @me, Is unread
```

#### Debugging Issues

```
Query: error type AND environment AND symptoms
Filters: Channel #production, Last 24 hours
Example: "500 error API production timeout"
```

#### Research & Learning

```
Query: "how to" OR "guide" OR "tutorial" OR "documentation"
Filters: Has links or files, Specific channels
```

#### Meeting Follow-ups

```
Query: "meeting notes" OR "minutes" OR "summary"
Filters: From specific user, This week, Has TODO
```

### Optimization Tips

#### Search Performance

**Fast Searches**:

- Use date filters (reduces search space)
- Search specific channels (not all)
- Use exact phrases for known terms
- Limit results with filters

**Slow Searches**:

- Avoid: `*` wildcards at start of words
- Avoid: Very common words alone ("the", "and")
- Avoid: Searching "All time" unnecessarily

#### Result Quality

**Improve Relevance**:

- Add more context words
- Use specific technical terms
- Include user or channel filters
- Try different phrasings

**Too Many Results**:

- Add date range
- Specify channel or user
- Use more specific terms
- Use phrase search with quotes

**Too Few Results**:

- Remove restrictive filters
- Try synonyms or related terms
- Expand date range
- Use broader search terms

---

## Voice Search

### Enabling Voice Search

#### Requirements

- Microphone access (browser permission required)
- Modern browser (Chrome, Firefox, Safari, Edge)
- HTTPS connection (required for Web Speech API)

#### Setup

1. Go to Settings → Search → Voice Search
2. Enable "Voice Search"
3. Grant microphone permission when prompted
4. Test your microphone

```
Voice Search Settings:
☑ Enable voice search
Language: [English (US) ▼]
Activation: ○ Click to speak
           ○ Always listening (with wake word)
Wake word: [Hey nchat]
Auto-punctuation: ☑ Enabled
Confidence threshold: [70% ▼]
```

### Using Voice Search

#### Click to Speak

1. Click the microphone icon (🎤) in search bar
2. Speak your query clearly
3. Wait for transcription
4. Review and refine if needed

```
🎤 Listening...
─────────────
"What did Alice say about the deployment yesterday?"

Understood: what did alice say about the deployment yesterday

[Search] [Edit] [Cancel]
```

#### Wake Word Mode (Optional)

1. Enable "Always listening" mode
2. Say wake word: "Hey nchat"
3. Speak your query
4. System automatically searches

```
Example session:
You: "Hey nchat"
System: *beep* (listening)
You: "Find messages about the API bug"
System: *searching* (displays results)
```

#### Voice Commands

**Search Commands**:

```
"Search for [query]"
"Find messages about [topic]"
"Show me [query]"
"Look up [information]"
"What did [user] say about [topic]?"
```

**Navigation**:

```
"Next result"
"Previous result"
"Open first result"
"Go back"
"Show more"
```

**Filters**:

```
"From Alice"
"In engineering channel"
"Last week"
"Show files only"
"Messages with links"
```

**Actions**:

```
"Save this search"
"Clear filters"
"Export results"
"Close search"
```

### Voice Search Tips

#### Speaking Clearly

- Speak at normal pace (not too fast)
- Enunciate technical terms
- Pause between commands and queries
- Speak in a quiet environment
- Use punctuation words when needed

#### Handling Technical Terms

```
Spell mode for unusual terms:
"Search for K-U-B-E-R-N-E-T-E-S"
"Find messages about G-R-P-C"

Or use natural pronunciation:
"Kubernetes" → usually understood
"gRPC" → say "gee-R-P-C"
"PostgreSQL" → say "post-gres-Q-L"
```

#### Multi-Step Queries

```
Say: "Search for deployment issues"
→ See results
Say: "From last week"
→ Filter applied
Say: "In production channel"
→ Further refined
Say: "Show the first result"
→ Opens message
```

#### Using Punctuation

```
"Find messages with question mark in them"
"Search for error comma timeout comma or failure"
"Messages from Alice period Show files only period"
```

### Voice Search Accuracy

#### Improving Recognition

- **Train your voice**: Use voice search regularly
- **Check transcription**: Always review before searching
- **Use punctuation words**: Say "comma", "period", "question mark"
- **Spell difficult words**: Use spelling mode
- **Adjust settings**: Tweak confidence threshold

#### Common Issues and Solutions

```
Issue: Background noise affecting recognition
Solution:
• Use push-to-talk mode
• Find a quieter location
• Use headset with noise cancellation

Issue: Accent/dialect not recognized well
Solution:
• Adjust language settings
• Speak more slowly
• Use text fallback for complex queries

Issue: Technical terms misheard
Solution:
• Spell out the term
• Use common synonyms first
• Type difficult terms manually
```

#### Transcription Examples

```
What you say:        What it hears:
─────────────────────────────────────────────
"Kubernetes issue"   ✓ kubernetes issue
"Cooper Nettie's"    ✗ Fix: Spell K-U-B-E-R-N-E-T-E-S

"API timeout"        ✓ API timeout
"A P I timeout"      ✓ API timeout

"PostgreSQL error"   ✓ PostgreSQL error
"Post grass error"   ✗ Fix: Say "post-gres-Q-L"
```

### Accessibility Features

Voice search supports accessibility:

- **Screen readers**: Full compatibility with ARIA labels
- **Hands-free operation**: Voice-only navigation
- **Visual feedback**: See transcription in real-time
- **Error correction**: Easy editing of transcripts
- **Keyboard alternatives**: All voice commands have keyboard shortcuts

#### Screen Reader Integration

```
Voice search announces:
• "Voice search activated"
• "Listening for your query"
• "Transcription: [your query]"
• "Found 23 results for [query]"
• "Search completed"
```

---

## Search Analytics

### Admin Analytics Dashboard

Admins can access workspace-wide search analytics:

**Access**: Admin Dashboard → Search Analytics

### Usage Metrics

#### Overall Statistics

```
Search Activity (Last 30 Days)
─────────────────────────────
Total searches:        12,847
Unique searchers:      234 users (78% of workspace)
Avg searches/user:     54.9
Avg results/search:    8.2
Zero-result searches:  3.2% (412 queries)
Search satisfaction:   87% (clicked results)
```

#### Search Volume Trends

```
Daily Search Volume:
│                            ╭─╮
│                         ╭──╯ │
│                    ╭────╯    │
│          ╭─────────╯         ╰─╮
│      ╭───╯                     ╰───
└──────────────────────────────────────
 Mon  Tue  Wed  Thu  Fri  Sat  Sun

Peak times:
• 9-10 AM: 15% of daily searches (1,927 searches)
• 2-3 PM:  18% of daily searches (2,312 searches)
• 4-5 PM:  12% of daily searches (1,541 searches)
```

#### Weekly Patterns

```
Search activity by day:
Monday:     2,341 searches (18.2%)
Tuesday:    2,567 searches (20.0%)
Wednesday:  2,489 searches (19.4%)
Thursday:   2,234 searches (17.4%)
Friday:     1,987 searches (15.5%)
Saturday:     678 searches (5.3%)
Sunday:       551 searches (4.3%)
```

### Popular Queries

#### Top Search Terms

```
Most Searched (This Month):
1. deployment          847 searches    (6.6%)
2. API documentation   623 searches    (4.8%)
3. error logs         512 searches    (4.0%)
4. meeting notes      445 searches    (3.5%)
5. design specs       398 searches    (3.1%)
6. password reset     312 searches    (2.4%)
7. vacation policy    289 searches    (2.2%)
8. deploy guide       267 searches    (2.1%)
9. bug report         234 searches    (1.8%)
10. onboarding        201 searches    (1.6%)
```

#### Trending Queries

```
Trending Up (vs Last Month):
1. "kubernetes migration"    ↑ 340% (89 → 392 searches)
2. "new feature launch"      ↑ 210% (67 → 208 searches)
3. "security audit"          ↑ 180% (45 → 126 searches)

Trending Down:
1. "Q3 planning"            ↓ 85% (234 → 35 searches)
2. "summer schedule"         ↓ 72% (167 → 47 searches)
3. "conference prep"         ↓ 65% (123 → 43 searches)
```

#### Query Categories

```
Search by category:
Technical:        4,234 searches (33%)
Documentation:    2,567 searches (20%)
People/Teams:     1,890 searches (15%)
Processes:        1,567 searches (12%)
Files:            1,234 searches (10%)
Other:            1,355 searches (10%)
```

### User Insights

#### Power Users

```
Top Searchers (Last 30 Days):
User              Searches   Saved   Zero Results   Satisfaction
Alice Johnson     423        12      2.1%          92%
Bob Smith         387        8       3.4%          88%
Charlie Davis     312        15      1.9%          94%
Diana Prince      289        6       4.2%          85%
Eve Martinez      267        11      2.8%          90%
```

#### Search Adoption

```
User Segments:
Daily searchers:     89 users (30%) - 8,234 searches
Weekly searchers:    145 users (48%) - 3,456 searches
Monthly searchers:   67 users (22%) - 1,157 searches
Never searched:      23 users (8%) - 0 searches

Adoption trend: ↑ 12% vs last month
```

#### New User Onboarding

```
Search usage by tenure:
Week 1:      12 searches avg (learning)
Week 2-4:    28 searches avg (ramping up)
Month 2-3:   45 searches avg (active)
Month 4+:    54 searches avg (power user)
```

### Query Performance

#### Response Times

```
Search Performance (Last 30 Days):
Avg response time: 245ms
P50: 180ms
P95: 420ms
P99: 850ms

By query type:
Simple queries:     150ms avg
Filtered queries:   280ms avg
Complex queries:    450ms avg
Voice queries:      520ms avg (includes transcription)

By search mode:
Keyword search:     120ms avg
Semantic search:    280ms avg
Hybrid search:      240ms avg
```

#### Performance Trends

```
Response time over time:
Week 1:  235ms avg
Week 2:  242ms avg
Week 3:  251ms avg ⚠️  (investigate slowdown)
Week 4:  245ms avg

Action: Optimized embedding cache (Week 3)
```

#### Zero-Result Queries

```
Top Zero-Result Queries (Last 30 Days):
1. "HR handbook"              34 times
2. "office map"               28 times
3. "printer setup"            22 times
4. "lunch menu"               19 times
5. "parking information"      17 times

Action Items:
✓ Create HR handbook document
✓ Add office map to wiki
⚠️  Document printer setup process
⚠️  Share lunch menu weekly
⚠️  Add parking info to onboarding
```

### Search Quality Metrics

#### Result Relevance

```
User Engagement (Last 30 Days):
Clicked first result:     68% (8,735 searches)
Clicked any result:       84% (10,791 searches)
Refined search:          16% (2,056 searches)
Gave up (no clicks):     12% (1,542 searches)
Negative feedback:        2.3% (295 searches)

Quality score: 87/100 (Good)
```

#### Click-Through Rates by Position

```
Result position vs CTR:
Position 1:  68% CTR
Position 2:  24% CTR
Position 3:  12% CTR
Position 4:   7% CTR
Position 5:   4% CTR
Position 6+:  2% CTR
```

#### Filter Usage

```
Most Used Filters:
1. Date range:    67% of searches (8,607)
2. Channel:       45% of searches (5,781)
3. User:          23% of searches (2,955)
4. File type:     12% of searches (1,542)
5. Status:         8% of searches (1,028)
6. Has content:    6% of searches (771)

Avg filters per search: 1.8
```

### Content Analytics

#### Searchable Content

```
Indexed Content (Current):
Messages:         1,234,567
Files:            34,567
Code blocks:      8,901
Links:            45,234
Users:            301
Channels:         87

Total size:       12.4 GB
Avg message len:  187 characters
Index coverage:   99.8% (up to date)
```

#### Index Health

```
Index Status:
Last full index:     Jan 25, 2026
Last incremental:    2 minutes ago
Pending updates:     47 messages
Failed indexes:      3 (0.0002%)

Embedding coverage:
Embedded:           1,231,234 (99.7%)
Pending:            3,333 (0.3%)
Failed:             0 (0%)
```

#### Channel Activity

```
Most Searched Channels:
Channel          Searches   Messages   Search/Msg Ratio
#engineering      2,341     45,678     5.1%
#product          1,876     32,456     5.8%
#support          1,654     67,890     2.4%
#design           1,234     28,901     4.3%
#devops           1,089     21,345     5.1%

Least searched: #random (23 searches, 12,345 messages)
```

### Search Cost Analytics

#### API Usage

```
Embedding API Usage (Last 30 Days):
Total API calls:      145,234
  - New messages:     123,456 (85%)
  - Re-indexing:      12,345 (8.5%)
  - Search queries:   9,433 (6.5%)

Tokens processed:     45.2M tokens
Estimated cost:       $67.80
Avg cost per search:  $0.0053
```

#### Cost Optimization

```
Cost Trends:
Month 1:  $45.20
Month 2:  $58.30 (↑ 29%)
Month 3:  $67.80 (↑ 16%)

Optimization opportunities:
✓ Cache common queries (save ~$12/mo)
✓ Reduce re-indexing frequency (save ~$8/mo)
⚠️  Implement embedding deduplication
```

### Export Analytics

Download analytics data:

```
Export Search Analytics:
Period: [Last 30 days ▼]
Format: [CSV ▼]

Include:
☑ Search queries (anonymized)
☑ User activity (aggregated)
☑ Performance metrics
☑ Popular content
☑ Zero-result queries
☐ Individual user data (requires privacy approval)
☐ Full search logs (admin only)

Privacy: All user-identifiable data will be anonymized
[Export]
```

### Real-Time Monitoring

#### Live Search Activity

```
Live Search Feed (Admin View):
🔍 alice: "deployment process"          → 12 results  180ms
🔍 bob: "API documentation"             → 5 results   210ms
🔍 charlie: "meeting notes yesterday"   → 8 results   195ms
🔍 diana: "bug in login flow"           → 3 results   240ms

Current: 4 searches/min (normal)
```

#### Alerts

```
Search Alerts:
⚠️  Slow query detected: avg 850ms (threshold: 500ms)
   Query: "project timeline Q1 Q2 Q3 planning roadmap"
   User: alice@company.com
   Action: Suggest query simplification

✓ Zero-result spike: 12 searches for "new policy"
   Action: Create document for "new policy"

✓ High search volume: 45 searches in last 5 minutes
   Status: Normal (peak hours)
```

---

## Privacy & Data

### What Gets Indexed

#### Message Content

```
Indexed:
✓ Message text
✓ Thread replies
✓ Reactions (for filtering)
✓ Attachments (file names and content)
✓ Code blocks
✓ Links (URLs and titles)
✓ Message metadata (timestamp, user, channel)

Not Indexed:
✗ Deleted messages (removed within 1 hour)
✗ Private DMs (only searchable by participants)
✗ Messages in channels you don't have access to
✗ Ephemeral/temporary messages
✗ Draft messages (not yet sent)
✗ Archived channels (unless enabled by admin)
```

#### Metadata Indexed

```
For each message:
• Author (user ID and name)
• Timestamp (sent and edited times)
• Channel/thread location
• Reactions (type and count)
• Attachments (name, type, size)
• Mentions (@user, @channel)
• Read status (personal only)
• Parent message (if in thread)
• Edit history (if enabled)
```

#### File Content Indexing

```
Files indexed for full-text search:
✓ PDF documents
✓ Word documents (.doc, .docx)
✓ Text files (.txt, .md, .log)
✓ Code files (.js, .py, .go, etc.)
✓ Spreadsheets (.xlsx, .csv)
✓ Presentations (.pptx)

File size limit: 50 MB per file
Processing timeout: 30 seconds per file
```

### Privacy Controls

#### User Privacy Settings

**Access**: Settings → Privacy → Search & Indexing

```
Search Privacy Settings:
☑ Index my messages for search
☐ Allow my messages in analytics (anonymized)
☐ Include my profile in user suggestions
☑ Show my search activity to admins (required)

Message Privacy:
☑ Allow search in public channels
☑ Allow search in private channels (I'm a member)
☑ Allow search in DMs (with participants only)
☐ Exclude my messages from AI training

File Privacy:
☑ Index my file attachments
☐ Include file content in search
☑ Index file names only

Search History:
☑ Save my search history (local only)
☐ Save search history on server
Retention: [90 days ▼]
```

#### Opt-Out Options

**Complete Opt-Out** (not recommended):

```
⚠️  Disable Search Indexing
This will:
• Remove your messages from search index
• Prevent others from finding your messages
• You can still search for others' messages
• Process takes up to 24 hours
• Does not delete actual messages

Impact:
✗ Team members can't find your helpful answers
✗ Documentation you wrote won't be discoverable
✗ Past conversations become harder to reference

[Cancel] [Confirm Opt-Out]
```

**Selective Opt-Out**:

```
Exclude from indexing:
☐ Messages in specific channels:
  ☐ #personal
  ☐ #private-notes

☐ Messages in date range:
  From: [Jan 1, 2026 ▼]
  To:   [Jan 31, 2026 ▼]

☐ Messages with specific content:
  Contains: [confidential, private, personal]

☐ File attachments only (keep message text)

[Save Exclusions]
```

### Data Retention

#### Search Index Retention

```
Index Retention Policy:
Active messages:     Indexed immediately (< 5 min)
Deleted messages:    Removed within 1 hour
Edited messages:     Updated within 5 minutes
Old messages:        Kept per workspace policy

Admin Settings:
Index retention: [2 years ▼]
After retention:  ○ Archive (read-only)
                 ○ Delete from index
                 ● Keep indefinitely

Re-indexing:
Automatic:        Weekly (Sundays at 2 AM)
Manual trigger:   Available to admins
Last full index:  Jan 25, 2026
```

#### Search History Retention

```
Your search history:
Stored locally:      90 days (browser cache)
Stored on server:    30 days (encrypted)
Analytics only:      6 months (anonymized)

After retention period:
• Search history auto-deleted
• Saved searches preserved
• Analytics aggregated (no individual queries)

Clear History:
☐ Last 24 hours
☐ Last 7 days
☐ Last 30 days
☑ All time
[Clear Search History]
```

#### Deleted Content Handling

```
When you delete a message:
1. Immediately: Removed from UI
2. Within 1 hour: Removed from search index
3. Within 24 hours: Removed from embeddings
4. 30 days: Permanent deletion (if configured)

Grace period for recovery:
• 30 days: Admins can restore
• After 30 days: Permanent deletion
```

### Data Security

#### Encryption

```
Search Data Encryption:
• At rest: AES-256 encryption
• In transit: TLS 1.3
• Index: Encrypted database
• Embeddings: Encrypted vectors
• Search queries: Not logged (unless analytics enabled)
• Search history: Encrypted per-user

Encryption keys:
• Managed by: Your organization
• Rotation: Every 90 days
• Storage: Hardware Security Module (HSM)
```

#### Access Control

```
Search respects all permissions:
• You can only search channels you can access
• Private DMs only searchable by participants
• Deleted messages not searchable
• Admin-only content hidden from members
• RBAC enforced for all queries

Permission checks:
1. User authentication
2. Channel membership verification
3. Message-level permissions
4. File access permissions
```

#### Audit Logging

```
Search activity logging (for security):
• Who searched what (admin view only)
• When searches occurred
• What results were accessed
• Failed search attempts
• Suspicious activity detection

Audit log retention: 1 year
Access: Admins and security team only
```

### Compliance

#### GDPR Compliance

```
Data Subject Rights:
✓ Right to access: Export your search data
✓ Right to erasure: Delete your search history
✓ Right to portability: Download search results
✓ Right to opt-out: Disable indexing
✓ Right to rectification: Update/correct data
✓ Right to restriction: Limit processing

How to exercise rights:
Settings → Privacy → Data Rights Request
```

#### Data Subject Requests

```
Request Your Data:
Settings → Privacy → Download My Data

Included in export:
• All your messages (searchable data)
• Your search history
• Saved searches
• Search analytics (your activity)
• Indexed files you uploaded
• Message embeddings (vectors)

Format: [JSON ▼] [CSV] [PDF]
Processing time: 24-48 hours
[Request Download]
```

#### CCPA Compliance

```
California Consumer Privacy Act:
✓ Right to know what data is collected
✓ Right to delete personal information
✓ Right to opt-out of sale (N/A - we don't sell data)
✓ Right to non-discrimination

Your data usage:
• Search queries: Improve search quality
• Message content: Enable semantic search
• User activity: Analytics and optimization
• Not shared with: Third parties (except AI provider for embeddings)
```

### Anonymous Search

Admin analytics are anonymized:

```
Anonymization Process:
• Individual queries not linked to specific users
• User IDs replaced with anonymous tokens
• Aggregated statistics only
• 48-hour delay before analytics available
• No personally identifiable information (PII)

Example anonymized data:
{
  "query": "deployment process",
  "user_token": "anon_a1b2c3d4",
  "timestamp": "2026-01-31T10:00:00Z",
  "result_count": 12,
  "clicked": true
}
```

### Third-Party Data

#### External Integrations

```
If integrations are enabled:
• Slack messages: Indexed if connected
• GitHub issues: Indexed if linked
• Google Drive: Files indexed if shared
• Jira tickets: Indexed if integrated

Control: Settings → Integrations → Search Access
```

#### AI Processing

```
AI/ML Usage:
• Embeddings generated for semantic search
• Models run on: [Your infrastructure ▼]
                 ○ On-premise
                 ○ Your cloud (AWS/GCP/Azure)
                 ● Anthropic Claude API

Data sent to AI provider:
• Message text (for embedding generation)
• Not sent: User info, metadata, search queries

Security:
• API calls encrypted (TLS 1.3)
• No data retention by AI provider
• SOC 2 Type II certified provider
• GDPR/CCPA compliant

Opt-out: Settings → Privacy → AI Processing
```

#### Data Processing Agreement (DPA)

```
For enterprise customers:
✓ Standard DPA available
✓ Custom DPA negotiable
✓ BAA for HIPAA compliance
✓ Data residency options (US, EU, Asia)
✓ Audit reports available

Contact: privacy@yourcompany.com
```

---

## Troubleshooting

### Common Issues

#### Search Not Working

**Symptom**: Search bar doesn't respond or shows error

**Solutions**:

1. **Refresh the page**: `Cmd+R` or `Ctrl+R`
2. **Clear browser cache**: Settings → Privacy → Clear cache
3. **Check browser console**: `F12` → Look for errors
4. **Try incognito/private mode**: Rule out extensions
5. **Update browser**: Ensure latest version
6. **Check internet connection**: Must be online for search

```bash
# Developer console troubleshooting
# Press F12 and check for errors

Common errors:
• "Network error" → Check internet connection
• "Unauthorized" → Re-login required
• "Service unavailable" → Backend issue (contact admin)
• "Index not ready" → Wait for indexing to complete
```

#### No Results Found

**Symptom**: "No results" for query you know should match

**Troubleshooting Checklist**:

```
✓ Check spelling and typos
✓ Verify date range (expand to "All time")
✓ Remove restrictive filters
✓ Check channel access (can you see the channel?)
✓ Try synonyms or related terms
✓ Use simpler query (remove complex operators)
✓ Check if message was deleted
✓ Verify you're searching correct workspace
```

**Example**:

```
❌ Query: "kubernetees deployment in production channel yesterday"
   Filters: Channel=#staging, Last 7 days
   Issue: Typo + wrong channel + may be older

✓ Query: "kubernetes deployment"
   Filters: All channels, All time
   → 45 results found
   → Then refine based on results
```

**Admin Troubleshooting**:

```
If messages should exist but don't appear:
1. Check index coverage: Admin → AI → Embeddings
2. Verify message is indexed:
   SELECT * FROM embeddings WHERE message_id = 'msg_123'
3. Trigger re-index for specific channel
4. Check embedding errors log
```

#### Slow Search Performance

**Symptom**: Search takes >5 seconds to return results

**Causes & Solutions**:

1. **Large result set**

   ```
   Problem: Too many matching results
   Solution:
   • Add date filter (last 7 days, not all time)
   • Specify channel
   • Use more specific terms
   ```

2. **Complex query**

   ```
   Problem: Too many operators or wildcards
   Solution:
   • Simplify operators
   • Avoid too many wildcards (especially at start: *term)
   • Remove unnecessary filters
   • Use simpler natural language
   ```

3. **Network issues**

   ```
   Problem: Slow internet or high latency
   Solution:
   • Check internet connection speed
   • Try wired connection instead of WiFi
   • Disable VPN temporarily
   • Check network DevTools: F12 → Network tab
   ```

4. **Server load**
   ```
   Problem: High server usage
   Solution:
   • Wait and retry in a few minutes
   • Check status page (if available)
   • Contact admin if persistent
   ```

**Performance Benchmarks**:

```
Expected response times:
Simple query:      < 200ms
Filtered query:    < 300ms
Complex query:     < 500ms
Voice query:       < 600ms (includes transcription)

If exceeding these consistently:
→ Contact admin for performance optimization
```

#### Search Results Out of Date

**Symptom**: New messages don't appear in search immediately

**Expected Behavior**:

```
Normal indexing delay:
• New messages: 2-5 minutes
• Edited messages: 1-2 minutes
• Deleted messages: 5-10 minutes (removal)

If delay > 15 minutes:
1. Force refresh: Ctrl+Shift+R
2. Check index status (admin)
3. Look for indexing errors
```

**Solutions**:

```
1. Wait for indexing (usually <5 minutes)
2. Force refresh: Ctrl+Shift+R
3. Clear local cache: Settings → Advanced → Clear cache
4. Check index status (admin):
   Admin → Search → Index Status
   Last updated: [timestamp]
5. Trigger re-index if admin:
   Admin → Search → Re-index → Current channel
```

**Admin Troubleshooting**:

```
Index Status Dashboard:
• Last update: 2 minutes ago ✓
• Pending: 47 messages
• Failed: 3 messages ⚠️

If indexing stopped:
1. Check embedding service status
2. Review error logs
3. Restart indexing worker
4. Trigger manual re-index
```

#### Voice Search Not Working

**Symptom**: Microphone not recognized or voice not transcribed

**Checklist**:

```
✓ Grant microphone permission (browser prompt)
✓ Check site uses HTTPS (required for mic access)
✓ Test mic in browser settings
✓ Close other apps using microphone (Zoom, etc.)
✓ Try different browser
✓ Check system microphone permissions
✓ Verify microphone is default input device
```

**Browser Permissions**:

```
Chrome:
1. Click lock icon in address bar
2. Site settings → Microphone → Allow
Or: Settings → Privacy → Site Settings → Microphone

Firefox:
1. Click lock icon → More information
2. Permissions → Microphone → Allow
Or: Settings → Privacy → Permissions → Microphone

Safari:
1. Safari → Preferences → Websites
2. Microphone → Allow for this site
```

**System Permissions**:

```
macOS:
System Settings → Privacy & Security → Microphone
→ Enable for your browser

Windows:
Settings → Privacy → Microphone
→ Enable for browser

Linux:
Check PulseAudio/ALSA settings
pavucontrol → Input Devices
```

**Testing Microphone**:

```
Test your microphone:
1. Settings → Voice Search → Test Microphone
2. Speak into mic
3. See audio level visualization
4. Hear transcription in real-time

If no audio detected:
• Check mic is not muted
• Verify correct input device selected
• Test with system sound recorder
```

### Error Messages

#### "Search service unavailable"

**Meaning**: Backend search service is down or unreachable

**What you see**:

```
⚠️  Search service unavailable
We're having trouble connecting to the search service.
Please try again in a moment.

[Retry] [Use Basic Search]
```

**Solutions**:

1. Wait 1-2 minutes and click "Retry"
2. Check status page (if available): status.yourcompany.com
3. Use "Basic Search" as fallback (keyword only)
4. Contact admin if issue persists >5 minutes
5. Check internet connection

**Admin Actions**:

```
1. Check search service status:
   docker ps | grep search-service

2. View service logs:
   docker logs search-service --tail 100

3. Restart service if needed:
   docker restart search-service

4. Check Grafana dashboard for alerts
```

#### "Index is being rebuilt"

**Meaning**: Search index is updating, limited functionality temporarily

**What you see**:

```
ℹ️  Index is being rebuilt
Search index is being updated. Some results may be incomplete.
Estimated completion: 15 minutes

Progress: ████████░░ 78%

[Use Basic Search] [Dismiss]
```

**What to do**:

- Wait for completion (progress shown)
- Basic keyword search still available
- Full semantic search restored after rebuild
- Typical time: 15-30 minutes for full workspace

**When this happens**:

- Scheduled weekly maintenance (Sunday 2 AM)
- Admin triggered manual re-index
- After major system update
- When adding new search features

#### "Too many requests"

**Meaning**: Rate limit exceeded, too many searches in short time

**What you see**:

```
⚠️  Too many requests
You've made too many search requests. Please wait a moment.

Try again in: 45 seconds

[Wait] [Contact Support]
```

**Rate Limits** (default):

```
Per user:
• 60 searches per minute
• 1,000 searches per hour
• 10,000 searches per day

If exceeded:
• Wait 60 seconds
• Use saved searches (not rate limited)
• Contact admin to increase limit
```

**Solutions**:

- Wait 60 seconds before next search
- Reduce search frequency
- Use saved searches instead of repeating queries
- Contact admin to increase your rate limit
- Check if you have runaway automation

#### "Query too complex"

**Meaning**: Query has too many operators, filters, or nested conditions

**What you see**:

```
⚠️  Query too complex
Your search query is too complex. Please simplify it.

Issues detected:
• Too many boolean operators (max 10)
• Too many filters (max 8)

[Simplify] [Learn More]
```

**Solutions**:

```
Simplify complex query:

❌ Too complex:
(error OR failure OR timeout OR crash OR bug) AND
(api OR backend OR server OR service) AND
(production OR staging OR prod OR live) NOT
(test OR testing OR dev OR development)
from:alice OR from:bob OR from:charlie
in:engineering OR in:devops OR in:platform
after:2026-01-01 before:2026-01-31
has:attachment has:code has:link

✓ Simplified:
"production api error"
Filters: From @engineering-team, Last month, Has code

Then add filters instead of query operators
```

**Limits**:

```
Query constraints:
• Max boolean operators: 10
• Max filters: 8
• Max query length: 500 characters
• Max wildcard terms: 5
• Max nested groups: 3
```

#### "Insufficient permissions"

**Meaning**: You don't have access to search certain channels or content

**What you see**:

```
⚠️  Insufficient permissions
Some results were excluded because you don't have access.

Showing 12 of 45 potential results.

[Request Access] [Contact Admin]
```

**Why this happens**:

- Private channels you're not a member of
- Admin-only content
- Deleted channels
- Restricted file types

**Solutions**:

- Request access to specific channels
- Contact admin for permission
- Filter to only channels you have access to

### Performance Optimization

#### Faster Searches

**Best Practices**:

```
Do:
✓ Use date filters (last 7 days, not all time)
✓ Search specific channels (not all channels)
✓ Use exact phrases ("out of memory")
✓ Leverage saved searches
✓ Start specific, then broaden if needed

Don't:
✗ Use wildcards at word start (*error)
✗ Search all channels + all time unnecessarily
✗ Use very common words alone ("the", "a", "is")
✗ Over-use complex boolean operators
✗ Include too many filters at once
```

**Query Optimization**:

```
Slow (450ms):
*deployment in:* after:2020-01-01

Fast (180ms):
deployment in:engineering after:last-week
```

#### Better Results

**Improve Relevance**:

```
1. Add context: "login error mobile app" > "error"
2. Use technical terms: "PostgreSQL deadlock" > "database stuck"
3. Include user/channel: from:alice in:engineering
4. Try different phrasings:
   • "deploy failed" vs "deployment error"
   • "slow performance" vs "high latency"
```

**Handle Too Many Results** (>100):

```
Narrow down:
1. Add date range: after:last-week
2. Specify channel: in:engineering
3. Add user filter: from:alice
4. Use more specific terms: "authentication error" > "error"
5. Use phrase search: "out of memory"
```

**Handle Too Few Results** (<3):

```
Broaden search:
1. Remove restrictive filters
2. Try synonyms:
   • "bug" → "issue", "problem", "error"
   • "docs" → "documentation", "guide", "reference"
3. Expand date range: all time
4. Use broader terms: "auth" > "authentication"
5. Check spelling
```

### Admin Troubleshooting

#### Re-index Content

**When to re-index**:

- Messages not appearing in search
- Search results seem outdated
- After system upgrades
- Weekly maintenance

```
Admin → Search → Index Management

Actions:
• Re-index all messages: Full rebuild (2-4 hours)
• Re-index since date: Partial rebuild (faster)
• Re-index channel: Single channel only (15 min)
• Re-index user: All messages from user
• Verify index: Check for issues (read-only)

[Re-index All] [Schedule Re-index] [Verify Index]
```

**Re-indexing Options**:

```
Full Re-index:
Estimated time: 2-4 hours
Messages: 1.2M
Impact: Search available during re-index

Incremental Re-index:
Since: [Last 7 days ▼]
Messages: ~50,000
Estimated time: 30 minutes

[Start Re-index]
```

#### Monitor Index Health

```
Index Health Dashboard:

Status:         ✓ Healthy
Total docs:     1,234,567
Index size:     4.2 GB
Index coverage: 99.8%
Last update:    2 minutes ago
Update queue:   47 pending

Embeddings:
Embedded:       1,231,234 (99.7%)
Pending:        3,333 (0.3%)
Failed:         0 (0%)

Issues:
⚠️  Channel #old-archive has 234 un-indexed messages
   Reason: Channel archived before indexing enabled
   [Fix Now] [Ignore]

⚠️  3 messages failed embedding generation
   [View Details] [Retry]
```

#### Search Logs

```
Admin → Logs → Search Logs

View:
• Failed searches (errors)
• Slow queries (>1s)
• Zero-result queries
• Rate-limited users
• Suspicious activity

Filters:
Date: [Last 24 hours ▼]
Type: [All logs ▼]
User: [All users ▼]
Severity: [Warning and above ▼]

Recent logs:
[2026-01-31 10:30:15] WARN: Slow query (850ms): "deployment process documentation"
[2026-01-31 10:25:42] ERROR: Embedding failed for message msg_12345
[2026-01-31 10:20:18] INFO: Re-index completed successfully

[Export Logs] [Clear Old Logs]
```

### Getting Help

#### Self-Service Resources

1. **In-App Help**: Click `?` icon in search modal
   - Quick tips
   - Keyboard shortcuts
   - Common queries

2. **Documentation**: Help → Search Guide
   - This guide
   - API documentation
   - Video tutorials

3. **Video Tutorials**: Help → Video Library
   - Getting started (5 min)
   - Advanced search (10 min)
   - Voice search (3 min)
   - Admin setup (15 min)

4. **FAQ**: Help → Frequently Asked Questions
   - Common questions
   - Troubleshooting tips
   - Best practices

#### Contact Support

```
Report Issue:
Help → Report a Problem → Search Issue

Include:
• What you searched for (exact query)
• What you expected to find
• What actually happened
• Screenshots (very helpful)
• Browser and version
• Timestamp of issue

Attachments:
[Attach Screenshot] [Attach Video]

Priority:
○ Low
○ Medium
● High
○ Critical (search completely broken)

[Submit Issue]
```

**Response Times**:

```
Priority levels:
Critical:  < 1 hour
High:      < 4 hours
Medium:    < 24 hours
Low:       < 3 days
```

#### Community Support

- **Ask in #support channel**: Get help from team
- **Search existing discussions**: Someone may have had same issue
- **Share tips and tricks**: Help others learn
- **Request new features**: #feature-requests channel

#### Admin Support

For admin-specific issues:

- **Email**: admin-support@yourcompany.com
- **Slack**: #admin-help channel
- **Phone**: Enterprise customers only

---

## Appendix

### Keyboard Shortcuts Reference

| Shortcut               | Action               |
| ---------------------- | -------------------- |
| `Cmd/Ctrl + K`         | Open search          |
| `Cmd/Ctrl + Shift + F` | Advanced search      |
| `/`                    | Quick search         |
| `Esc`                  | Close search         |
| `↑` / `↓`              | Navigate results     |
| `Enter`                | Open result          |
| `Cmd/Ctrl + Enter`     | Open in new tab      |
| `Tab`                  | Focus filters        |
| `Shift + Tab`          | Previous field       |
| `Cmd/Ctrl + S`         | Save search          |
| `Cmd/Ctrl + 1-9`       | Quick saved searches |

### Search Operator Reference

| Operator    | Syntax        | Example                 |
| ----------- | ------------- | ----------------------- |
| From user   | `from:user`   | `from:alice`            |
| In channel  | `in:channel`  | `in:engineering`        |
| Has file    | `has:file`    | `has:pdf`               |
| Has link    | `has:link`    | `has:link docs`         |
| Before date | `before:date` | `before:2026-01-15`     |
| After date  | `after:date`  | `after:yesterday`       |
| Is starred  | `is:starred`  | `is:starred TODO`       |
| Is unread   | `is:unread`   | `is:unread @me`         |
| AND         | `AND`         | `error AND production`  |
| OR          | `OR`          | `bug OR issue`          |
| NOT         | `NOT`         | `deploy NOT staging`    |
| Phrase      | `"phrase"`    | `"out of memory"`       |
| Wildcard    | `*`           | `auth*`                 |
| Proximity   | `NEAR[n]`     | `error NEAR[5] timeout` |

### Glossary

**Search Terms**:

- **Semantic Search**: AI-powered search that understands meaning, not just keywords
- **Embeddings**: Mathematical representations of text meaning (vectors)
- **Vector Search**: Finding similar items using mathematical similarity
- **Indexing**: Processing and storing content for fast search
- **Query**: Your search input (text or voice)
- **Relevance**: How well results match your query (0-100 score)
- **Filter**: Constraint to narrow search results
- **Operator**: Special syntax for advanced queries (AND, OR, NOT)
- **Hybrid Search**: Combination of semantic and keyword search
- **Zero-Result Query**: Search with no matching results
- **Click-Through Rate (CTR)**: % of searches resulting in clicked result
- **Cosine Similarity**: Mathematical measure of vector similarity (0-1)

---

## Updates & Changelog

### Version 1.0.0 (January 31, 2026)

- Initial comprehensive user guide (1,000+ lines)
- All 10 core sections complete:
  - Introduction with benefits and how it works
  - Getting started guide
  - Natural language query examples (30+)
  - Complete filter reference
  - Search history and saved searches
  - Tips, strategies, and best practices
  - Voice search with accessibility
  - Admin analytics dashboard
  - Privacy controls and compliance (GDPR, CCPA)
  - Comprehensive troubleshooting
- Examples for all features
- Troubleshooting section with solutions
- Admin guides included

### Planned Updates

- Video tutorials embedded
- Interactive examples
- Advanced use case studies
- Integration-specific guides
- Multi-language support guide
- Mobile app search guide

---

## Feedback

Help us improve this guide:

- **Report Issues**: Help → Documentation Feedback
- **Suggest Improvements**: #documentation channel
- **Request Topics**: Email docs@company.com
- **Rate This Guide**: ⭐⭐⭐⭐⭐ (click to rate in app)

---

**End of Smart Search User Guide**

**Related Documentation**:

- [AI Features Complete Guide](/docs/guides/features/ai-features-complete.md)
- [Auto-Moderation Guide](/docs/guides/features/auto-moderation.md)
- [Search API Documentation](/docs/api/ai-endpoints.md#search)
- [Admin AI Management](/docs/guides/admin/ai-management.md)

**For Developers**:

- [Search Implementation](/docs/guides/development/)
- [Vector Search Setup](/docs/Vector-Search-Setup.md)
- [Embedding Service](/src/lib/ai/embedding-service.ts)
