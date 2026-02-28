/**
 * Webhook Signature Verification Examples
 *
 * Demonstrates how to verify webhook signatures for different platforms.
 */

import crypto from 'crypto'

// ============================================================================
// GitHub Signature Verification
// ============================================================================

/**
 * Verify GitHub webhook signature
 */
export function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !signature.startsWith('sha256=')) {
    return false
  }

  // Remove 'sha256=' prefix
  const receivedSignature = signature.slice(7)

  // Compute expected signature
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')

  // Constant-time comparison
  return crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature))
}

// Example usage
const githubPayload = '{"action":"opened","pull_request":{...}}'
const githubSignature = 'sha256=abc123...'
const githubSecret = 'your-github-secret'

if (verifyGitHubSignature(githubPayload, githubSignature, githubSecret)) {
  console.log('✓ GitHub webhook verified')
} else {
  console.error('✗ GitHub webhook verification failed')
}

// ============================================================================
// Slack Signature Verification
// ============================================================================

/**
 * Verify Slack webhook signature
 */
export function verifySlackSignature(
  payload: string,
  timestamp: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !signature.startsWith('v0=')) {
    return false
  }

  // Check timestamp to prevent replay attacks (max 5 minutes old)
  const now = Math.floor(Date.now() / 1000)
  const webhookTimestamp = parseInt(timestamp, 10)
  if (Math.abs(now - webhookTimestamp) > 300) {
    console.error('Timestamp too old or too far in future')
    return false
  }

  // Remove 'v0=' prefix
  const receivedSignature = signature.slice(3)

  // Compute signature base string
  const signatureBaseString = `v0:${timestamp}:${payload}`

  // Compute expected signature
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(signatureBaseString)
  const expectedSignature = hmac.digest('hex')

  // Constant-time comparison
  return crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature))
}

// Example usage
const slackPayload = '{"type":"event_callback","event":{...}}'
const slackTimestamp = '1643723400'
const slackSignature = 'v0=abc123...'
const slackSecret = 'your-slack-signing-secret'

if (verifySlackSignature(slackPayload, slackTimestamp, slackSignature, slackSecret)) {
  console.log('✓ Slack webhook verified')
} else {
  console.error('✗ Slack webhook verification failed')
}

// ============================================================================
// Jira Signature Verification
// ============================================================================

/**
 * Verify Jira webhook signature
 */
export function verifyJiraSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !signature.startsWith('sha256=')) {
    return false
  }

  // Remove 'sha256=' prefix
  const receivedSignature = signature.slice(7)

  // Compute expected signature
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')

  // Constant-time comparison
  return crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature))
}

// Example usage
const jiraPayload = '{"webhookEvent":"jira:issue_created","issue":{...}}'
const jiraSignature = 'sha256=abc123...'
const jiraSecret = 'your-jira-secret'

if (verifyJiraSignature(jiraPayload, jiraSignature, jiraSecret)) {
  console.log('✓ Jira webhook verified')
} else {
  console.error('✗ Jira webhook verification failed')
}

// ============================================================================
// Telegram Secret Token Verification
// ============================================================================

/**
 * Verify Telegram webhook secret token
 */
export function verifyTelegramWebhook(configuredSecret: string, receivedToken: string): boolean {
  // Constant-time comparison to prevent timing attacks
  if (configuredSecret.length !== receivedToken.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < configuredSecret.length; i++) {
    result |= configuredSecret.charCodeAt(i) ^ receivedToken.charCodeAt(i)
  }

  return result === 0
}

// Example usage
const telegramSecret = 'your-telegram-secret-token'
const telegramToken = 'received-token-from-header'

if (verifyTelegramWebhook(telegramSecret, telegramToken)) {
  console.log('✓ Telegram webhook verified')
} else {
  console.error('✗ Telegram webhook verification failed')
}

// ============================================================================
// Generic HMAC Signature Verification
// ============================================================================

/**
 * Generic HMAC signature verification
 */
export function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256',
  prefix?: string
): boolean {
  // Remove prefix if present
  let receivedSignature = signature
  if (prefix && signature.startsWith(prefix)) {
    receivedSignature = signature.slice(prefix.length)
  }

  // Compute expected signature
  const hmac = crypto.createHmac(algorithm, secret)
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')

  // Constant-time comparison
  if (receivedSignature.length !== expectedSignature.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature))
}

// Example usage
const genericPayload = '{"event":"test"}'
const genericSignature = 'sha256=abc123...'
const genericSecret = 'your-webhook-secret'

if (verifyHmacSignature(genericPayload, genericSignature, genericSecret, 'sha256', 'sha256=')) {
  console.log('✓ Generic webhook verified')
} else {
  console.error('✗ Generic webhook verification failed')
}

// ============================================================================
// Express Middleware Example
// ============================================================================

/**
 * Express middleware for webhook signature verification
 */
export function webhookVerificationMiddleware(
  secret: string,
  signatureHeader: string = 'x-webhook-signature',
  algorithm: 'sha256' | 'sha512' = 'sha256',
  prefix?: string
) {
  return (req: any, res: any, next: any) => {
    const signature = req.headers[signatureHeader]

    if (!signature) {
      return res.status(401).json({ error: 'Missing signature' })
    }

    // Get raw body (must be preserved)
    const payload = req.rawBody || JSON.stringify(req.body)

    // Verify signature
    const isValid = verifyHmacSignature(payload, signature, secret, algorithm, prefix)

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    next()
  }
}

// Example usage with Express
/*
import express from 'express'
import bodyParser from 'body-parser'

const app = express()

// Parse JSON with raw body preservation
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8')
  }
}))

// Apply verification middleware
app.post('/webhook',
  webhookVerificationMiddleware('your-secret', 'x-webhook-signature', 'sha256', 'sha256='),
  (req, res) => {
    // Signature is verified at this point
    console.log('Webhook payload:', req.body)
    res.json({ success: true })
  }
)
*/
