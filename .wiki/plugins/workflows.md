# Workflow Automation Guide

Workflows automate multi-step processes in nChat. A workflow is a trigger-step-action pipeline: an event (or schedule, webhook, or manual invocation) fires a trigger, which runs a series of steps, each executing an action.

## Architecture

```
Trigger (Event | Schedule | Webhook | Manual)
    |
    v
+-----------+     +------------------+     +-------------------+
| Trigger   | --> | Execution Engine | --> | Action Handlers   |
| Engine    |     | (step runner)    |     | (send_message,    |
| evaluate  |     | retry, branch,   |     |  http_request,    |
|           |     | approval gate    |     |  set_variable...) |
+-----------+     +------------------+     +-------------------+
                         |
                  +------+------+
                  |             |
                  v             v
           Audit Log     Scheduler
           (immutable)   (cron tick)
```

## Quick Start

Build and run a workflow using the fluent `WorkflowBuilder`:

```typescript
import {
  WorkflowBuilder,
  WorkflowExecutionEngine,
  TriggerEngine,
} from '@/lib/plugins/workflows'

// 1. Build a workflow definition
const workflow = new WorkflowBuilder('Welcome New Members', 'system')
  .description('Greet new members when they join a channel')
  .onEvent('member.joined', { channelIds: ['channel-general'] })
  .addStep('greet', 'Send welcome message', {
    type: 'send_message',
    channelId: '{{trigger.channelId}}',
    content: 'Welcome to the team, {{trigger.userId}}!',
  })
  .scopes(['write:messages'])
  .build()

// 2. Register the workflow with the trigger engine
const triggerEngine = new TriggerEngine()
triggerEngine.registerWorkflow(workflow)

// 3. When an event occurs, evaluate triggers
const matches = triggerEngine.evaluateEvent('member.joined', {
  channelId: 'channel-general',
  userId: 'user-456',
})

// 4. Execute matched workflows
const executionEngine = new WorkflowExecutionEngine({
  sleepFn: async () => {},  // No-op for fast execution
})

for (const match of matches) {
  const run = await executionEngine.startRun(match.workflow, match.triggerInfo)
  console.log('Run status:', run.status)  // 'completed'
}
```

## Trigger Types

### Event Trigger

Fires when a platform event occurs. Supports channel and user filters.

```typescript
const workflow = new WorkflowBuilder('Log Messages', 'admin')
  .onEvent('message.created', {
    channelIds: ['channel-support'],
    conditions: [
      {
        field: 'content',
        operator: 'contains',
        value: 'urgent',
      },
    ],
  })
  .addStep('notify', 'Alert on-call', {
    type: 'send_message',
    channelId: 'channel-oncall',
    content: 'Urgent message in #support: {{trigger.content}}',
  })
  .build()
```

### Schedule Trigger

Fires on a cron schedule. Uses 5-field cron format: `minute hour day-of-month month day-of-week`.

```typescript
const workflow = new WorkflowBuilder('Daily Standup Reminder', 'admin')
  .onSchedule('0 9 * * 1-5', { timezone: 'America/New_York' })
  .addStep('remind', 'Post standup reminder', {
    type: 'send_message',
    channelId: 'channel-team',
    content: 'Time for standup! Please post your update.',
  })
  .build()
```

Schedule a workflow with the `WorkflowScheduler`:

```typescript
import { WorkflowScheduler, ScheduleStore } from '@/lib/plugins/workflows'

const scheduler = new WorkflowScheduler(new ScheduleStore())
const schedule = scheduler.createSchedule(workflow)

// The scheduler fires callbacks when a schedule is due
scheduler.onScheduleFired = (schedule) => {
  console.log('Schedule fired for workflow:', schedule.workflowId)
}

// Process due schedules manually
const fired = scheduler.tick(new Date())

// Or start an automatic tick loop (checks every 60s by default)
scheduler.start()
// ... later
scheduler.stop()
```

### Webhook Trigger

Fires when an external HTTP request is received.

```typescript
const workflow = new WorkflowBuilder('GitHub Push Handler', 'admin')
  .onWebhook(['POST'], {
    secret: 'whsec_my_github_secret',
    contentType: 'application/json',
  })
  .addStep('notify', 'Post push notification', {
    type: 'send_message',
    channelId: 'channel-dev',
    content: 'Push to {{trigger.body.ref}} by {{trigger.body.pusher.name}}',
  })
  .build()
```

Evaluate a webhook trigger:

```typescript
const match = triggerEngine.evaluateWebhook(
  workflow.id,
  'POST',
  { ref: 'refs/heads/main', pusher: { name: 'alice' } },
  { 'content-type': 'application/json' }
)
```

### Manual Trigger

Fired by a user via UI or API. Supports user and role restrictions.

```typescript
const workflow = new WorkflowBuilder('Deploy to Production', 'admin')
  .onManual({
    allowedRoles: ['admin', 'owner'],
    allowedUserIds: ['user-lead'],
  })
  .addInput({
    name: 'environment',
    type: 'string',
    required: true,
    description: 'Target environment',
  })
  .addStep('deploy', 'Trigger deploy', {
    type: 'http_request',
    url: 'https://deploy.example.com/api/deploy',
    method: 'POST',
    body: { env: '{{inputs.environment}}' },
  })
  .build()
```

Evaluate a manual trigger:

```typescript
const match = triggerEngine.evaluateManual(
  workflow.id,
  'user-lead',
  ['admin'],
  { environment: 'production' }
)
```

## Workflow Steps

Each step has an ID, a name, an action, settings, optional conditions, input mapping, output key, and dependencies.

### Step Types

| Type | Purpose |
|------|---------|
| `action` | Execute a concrete action (send_message, http_request, etc.) |
| `condition` | Branch based on conditions |
| `approval` | Pause for human approval |
| `delay` | Wait for a specified duration |
| `parallel` | Execute step groups in parallel |
| `loop` | Iterate over a collection |

Step types are inferred automatically from the action type by the builder.

### Step Settings

```typescript
interface StepSettings {
  retryAttempts: number       // Default: 3
  retryBackoff: 'fixed' | 'linear' | 'exponential'  // Default: 'exponential'
  retryDelayMs: number        // Default: 1000
  maxRetryDelayMs: number     // Default: 60000
  timeoutMs: number           // Default: 30000
  skipOnFailure: boolean      // Default: false
  idempotent: boolean         // Default: true
  idempotencyKey?: string     // Template expression for dedup
}
```

### Step Dependencies

Steps can declare dependencies to control execution order:

```typescript
const workflow = new WorkflowBuilder('Pipeline', 'admin')
  .onManual()
  .addStep('fetch', 'Fetch data', {
    type: 'http_request',
    url: 'https://api.example.com/data',
    method: 'GET',
  }, { outputKey: 'apiData' })
  .addStep('transform', 'Process data', {
    type: 'transform_data',
    input: 'apiData.body',
    transform: 'map',
  }, { dependsOn: ['fetch'] })
  .addStep('notify', 'Send results', {
    type: 'send_message',
    channelId: 'channel-results',
    content: 'Data processed successfully',
  }, { dependsOn: ['transform'] })
  .build()
```

The execution engine uses topological sort (Kahn's algorithm) to resolve execution order.

### Conditional Steps

Steps can have conditions that are evaluated before execution. If conditions are not met, the step is skipped:

```typescript
.addStep('escalate', 'Escalate to manager', {
  type: 'send_message',
  channelId: 'channel-managers',
  content: 'Issue requires escalation',
}, {
  conditions: [
    { field: 'priority', operator: 'equals', value: 'critical' },
  ],
})
```

## Action Types

### send_message

Send a message to a channel. Content supports template interpolation.

```typescript
{
  type: 'send_message',
  channelId: '{{trigger.channelId}}',
  content: 'Hello {{trigger.userId}}!',
  threadId: '{{trigger.threadId}}',  // Optional: reply in thread
}
```

### http_request

Make an HTTP request to an external service.

```typescript
{
  type: 'http_request',
  url: 'https://api.example.com/webhook',
  method: 'POST',
  headers: { 'Authorization': 'Bearer {{inputs.apiKey}}' },
  body: { event: '{{trigger.eventType}}' },
  responseFormat: 'json',
}
```

### transform_data

Transform data from one step to another using dot-path expressions.

```typescript
{
  type: 'transform_data',
  input: 'apiData.body.items',
  transform: 'map',
}
```

### conditional_branch

Branch based on conditions. The first matching branch is taken.

```typescript
{
  type: 'conditional_branch',
  branches: [
    {
      name: 'High Priority',
      conditions: [{ field: 'priority', operator: 'equals', value: 'high' }],
      targetSteps: ['escalate'],
    },
    {
      name: 'Normal',
      conditions: [{ field: 'priority', operator: 'equals', value: 'normal' }],
      targetSteps: ['log'],
    },
  ],
  defaultSteps: ['archive'],
}
```

### approval

Pause execution and request human approval. Supports multi-approver workflows with escalation.

```typescript
{
  type: 'approval',
  approverIds: ['user-manager', 'user-lead'],
  message: 'Approve deployment to production?',
  timeoutMs: 3600000,   // 1 hour
  minApprovals: 1,
  notificationChannelId: 'channel-approvals',
  escalationUserIds: ['user-vp'],
}
```

### delay

Pause execution for a specified duration (max 1 hour).

```typescript
{
  type: 'delay',
  durationMs: 60000,  // 1 minute
}
```

### set_variable

Set a workflow variable for use in later steps.

```typescript
{
  type: 'set_variable',
  variableName: 'greeting',
  value: 'Hello, {{trigger.userId}}!',
}
```

### parallel

Execute multiple step groups in parallel.

```typescript
{
  type: 'parallel',
  branches: [['notify-slack', 'notify-email'], ['log-analytics']],
  waitForAll: true,  // Wait for all branches (false = first to complete)
}
```

### loop

Iterate over a collection.

```typescript
{
  type: 'loop',
  collection: 'apiData.body.users',
  itemVariable: 'currentUser',
  indexVariable: 'index',
  bodySteps: ['greet-user'],
  maxIterations: 100,
}
```

### channel_action

Perform channel operations.

```typescript
{
  type: 'channel_action',
  subAction: 'create',         // 'create' | 'archive' | 'add_member' | 'remove_member' | 'update_topic'
  channelName: 'incident-123',
}
```

### user_action

Perform user operations.

```typescript
{
  type: 'user_action',
  subAction: 'send_dm',  // 'assign_role' | 'send_dm' | 'notify'
  userId: '{{trigger.userId}}',
  message: 'Your request has been processed.',
}
```

## Condition Operators

All triggers and steps support conditions with these operators:

| Operator | Description |
|----------|-------------|
| `equals` | Exact equality |
| `not_equals` | Not equal |
| `contains` | String contains or array includes |
| `not_contains` | String/array does not contain |
| `greater_than` | Numeric greater than |
| `less_than` | Numeric less than |
| `greater_than_or_equal` | Numeric >= |
| `less_than_or_equal` | Numeric <= |
| `in` | Value is in array |
| `not_in` | Value is not in array |
| `matches_regex` | String matches regex pattern |
| `exists` | Field is not null/undefined |
| `not_exists` | Field is null/undefined |

## Template Interpolation

Action fields that accept strings support `{{path.to.value}}` template syntax. The context includes:

- `trigger.*` -- Trigger data (event data, webhook body, etc.)
- `inputs.*` -- Workflow input variables
- `variables.*` -- Workflow variables set by `set_variable` actions
- Step output keys -- Outputs stored by previous steps via `outputKey`

```typescript
{
  type: 'send_message',
  channelId: '{{trigger.channelId}}',
  content: 'User {{trigger.userId}} created ticket #{{apiResponse.ticketId}}',
}
```

## Approval Gate

The `ApprovalGateManager` manages approval checkpoints within workflow execution.

### Creating Approval Requests

```typescript
import { ApprovalGateManager, ApprovalStore } from '@/lib/plugins/workflows'

const gate = new ApprovalGateManager(new ApprovalStore())

const request = gate.createRequest(
  'run-001',
  'step-approve',
  'workflow-001',
  {
    type: 'approval',
    approverIds: ['user-manager', 'user-lead'],
    message: 'Approve release v2.0?',
    timeoutMs: 3600000,
    minApprovals: 2,
    escalationUserIds: ['user-vp'],
  }
)
```

### Responding to Approvals

```typescript
// Approve
const updated = gate.approve(request.id, 'user-manager', 'Looks good!')

// Reject
const rejected = gate.reject(request.id, 'user-lead', 'Needs more testing')
```

### Timeout and Escalation

```typescript
// Process expired requests (run periodically)
const expired = gate.processExpired()
// If escalation users are configured, the request is escalated first
// before being marked as expired.
```

### Callbacks

```typescript
gate.onApprovalResolved = (request) => {
  console.log(`Approval ${request.id}: ${request.status}`)
  // Resume or fail the workflow run
}

gate.onApprovalEscalated = (request) => {
  console.log(`Escalated to:`, request.escalationUserIds)
}

gate.onNotify = (userIds, message, data) => {
  // Send notifications to approvers
}
```

## Execution Engine

The `WorkflowExecutionEngine` manages the complete lifecycle of workflow runs.

### Starting a Run

```typescript
import { WorkflowExecutionEngine } from '@/lib/plugins/workflows'

const engine = new WorkflowExecutionEngine({
  enableAudit: true,
  maxRunHistory: 1000,
})

const run = await engine.startRun(workflow, triggerInfo, {
  apiKey: 'sk-xxx',  // Input variables
})

console.log('Status:', run.status)
console.log('Steps:', run.stepResults.length)
```

### Cancelling and Retrying

```typescript
// Cancel a running workflow
engine.cancelRun(run.id)

// Retry a failed workflow
const retryRun = await engine.retryRun(run.id, workflow)
```

### Querying Runs

```typescript
// Get a specific run
const run = engine.getRun('run-001')

// List runs by status
const failedRuns = engine.listRuns({ status: 'failed' })

// Active run count
const active = engine.getActiveRunCount(workflow.id)
```

### Audit Log

```typescript
const log = engine.getAuditLog({
  workflowId: workflow.id,
  eventType: 'workflow.step_failed',
})

for (const entry of log) {
  console.log(entry.timestamp, entry.eventType, entry.description)
}
```

## Run Status Lifecycle

```
pending -> running -> completed
                   -> failed -> retrying -> running -> ...
                   -> cancelled
                   -> timed_out
                   -> waiting_approval -> running -> ...
                   -> paused -> running -> ...
```

| Status | Description |
|--------|-------------|
| `pending` | Run created but not yet started |
| `running` | Steps are being executed |
| `paused` | Execution paused (e.g., delay) |
| `waiting_approval` | Blocked on human approval |
| `completed` | All steps completed successfully |
| `failed` | A step failed and `continueOnFailure` is false |
| `cancelled` | Run was cancelled by a user or system |
| `timed_out` | Exceeded `maxExecutionTimeMs` |
| `retrying` | Failed run is being retried |

## Cron Expressions

The scheduler uses standard 5-field cron expressions:

```
* * * * *
| | | | |
| | | | +--- Day of week (0-6, Sunday=0)
| | | +----- Month (1-12)
| | +------- Day of month (1-31)
| +--------- Hour (0-23)
+----------- Minute (0-59)
```

### Special Characters

| Character | Meaning | Example |
|-----------|---------|---------|
| `*` | Any value | `* * * * *` (every minute) |
| `n` | Specific value | `30 9 * * *` (9:30 AM) |
| `n-m` | Range | `0 9-17 * * *` (every hour 9AM-5PM) |
| `n,m` | List | `0 9,12,17 * * *` (9AM, 12PM, 5PM) |
| `*/n` | Step | `*/15 * * * *` (every 15 minutes) |

### Cron Utility Functions

```typescript
import {
  parseCronExpression,
  parseCronField,
  matchesCron,
  getNextCronTime,
} from '@/lib/plugins/workflows'

// Parse a cron expression into component fields
const fields = parseCronExpression('0 9 * * 1-5')
// { minute: [0], hour: [9], dayOfMonth: [1..31], month: [1..12], dayOfWeek: [1,2,3,4,5] }

// Check if a cron matches a specific time
const matches = matchesCron('0 9 * * 1-5', new Date(), 'UTC')

// Calculate the next execution time
const nextRun = getNextCronTime('0 9 * * 1-5', new Date(), 'UTC')
```

## Workflow Settings

```typescript
interface WorkflowSettings {
  maxExecutionTimeMs: number       // Default: 300000 (5 min)
  maxRetryAttempts: number         // Default: 3
  continueOnFailure: boolean       // Default: false
  timezone: string                 // Default: 'UTC'
  auditInputsOutputs: boolean     // Default: true
  maxConcurrentExecutions: number  // Default: 1
  requiresApproval: boolean        // Default: false
}
```

Configure settings via the builder:

```typescript
const workflow = new WorkflowBuilder('Heavy Pipeline', 'admin')
  .onManual()
  .settings({
    maxExecutionTimeMs: 600000,      // 10 minutes
    maxRetryAttempts: 5,
    continueOnFailure: true,
    maxConcurrentExecutions: 3,
  })
  .addStep(/* ... */)
  .build()
```

## Validation

Workflow definitions are validated on `build()`. Validation checks:

- Name matches `^[a-zA-Z][a-zA-Z0-9 _-]{0,127}$`
- Description is at most 2000 characters
- Trigger is present and valid (cron format, event type, methods)
- At least one step, no more than 50
- No duplicate step IDs
- No circular dependencies (detected via DFS)
- Action-specific validation (required fields, limits)
- Settings are within valid ranges

```typescript
import { validateWorkflowDefinition } from '@/lib/plugins/workflows'

const result = validateWorkflowDefinition(definition)
if (!result.valid) {
  for (const error of result.errors) {
    console.log(`[${error.severity}] ${error.field}: ${error.message}`)
  }
}
```

## Limits

| Constraint | Value |
|-----------|-------|
| Steps per workflow | Max 50 |
| Workflow name length | Max 128 characters |
| Description length | Max 2000 characters |
| Tags per workflow | Max 20 |
| Conditional branches | Max 10 |
| Parallel branches | Max 10 |
| Loop iterations | Max 1000 |
| Approval timeout | Max 24 hours |
| Delay duration | Max 1 hour |
| Concurrent executions | Max 10 |

## Audit Event Types

All workflow actions are logged immutably:

```typescript
type WorkflowAuditEventType =
  | 'workflow.created' | 'workflow.updated' | 'workflow.deleted'
  | 'workflow.enabled' | 'workflow.disabled'
  | 'workflow.run_started' | 'workflow.run_completed'
  | 'workflow.run_failed' | 'workflow.run_cancelled' | 'workflow.run_retried'
  | 'workflow.step_started' | 'workflow.step_completed'
  | 'workflow.step_failed' | 'workflow.step_skipped' | 'workflow.step_retried'
  | 'workflow.approval_requested' | 'workflow.approval_granted'
  | 'workflow.approval_rejected' | 'workflow.approval_expired'
  | 'workflow.approval_escalated'
  | 'workflow.schedule_created' | 'workflow.schedule_updated'
  | 'workflow.schedule_deleted' | 'workflow.schedule_fired'
```
