#!/usr/bin/env tsx
/**
 * Email Service Test Script
 *
 * Tests SendGrid email configuration and sends test emails.
 * Usage: tsx scripts/test-email.ts
 */

import { getEmailSender, getEmailConfig } from '../src/lib/email/sender'
import {
  sendPasswordReset,
  sendWelcomeEmail,
  sendPasswordChanged,
  getEmailQueueStatus,
} from '../src/lib/email/templates'

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testEmailConfiguration() {
  log('cyan', '\n======================================')
  log('cyan', '   Email Service Configuration Test')
  log('cyan', '======================================\n')

  const config = getEmailConfig()

  log('blue', '📧 Email Configuration:')
  console.log(`   Provider:    ${config.provider}`)
  console.log(`   From Name:   ${config.from.name}`)
  console.log(`   From Email:  ${config.from.email}`)

  if (config.provider === 'sendgrid') {
    console.log(`   API Key:     ${config.sendgrid?.apiKey ? '✅ Set' : '❌ Not Set'}`)
  } else if (config.provider === 'smtp') {
    console.log(`   SMTP Host:   ${config.smtp?.host}`)
    console.log(`   SMTP Port:   ${config.smtp?.port}`)
    console.log(`   SMTP User:   ${config.smtp?.auth.user}`)
  }

  console.log()

  // Verify email sender initialization
  log('blue', '🔍 Verifying email sender...')
  try {
    const sender = getEmailSender()
    const verified = await sender.verify()

    if (verified) {
      log('green', '✅ Email configuration verified successfully!')
    } else {
      log('red', '❌ Email configuration verification failed')
      log('yellow', '\n💡 Troubleshooting:')
      console.log('   1. Check EMAIL_PROVIDER in .env.local')
      console.log('   2. For SendGrid: Verify SENDGRID_API_KEY is set')
      console.log('   3. For SMTP: Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD')
      console.log('   4. Ensure sender email is verified in SendGrid dashboard')
      return false
    }
  } catch (error) {
    log(
      'red',
      `❌ Error verifying email configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    return false
  }

  console.log()
  return true
}

async function testPasswordResetEmail() {
  log('blue', '📤 Sending test password reset email...')

  const testEmail = process.env.TEST_EMAIL || 'test@example.com'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const emailId = await sendPasswordReset(
      { email: testEmail, name: 'Test User' },
      {
        userName: 'Test User',
        resetUrl: `${appUrl}/auth/reset?token=test-token-${Date.now()}`,
        expiresInMinutes: 60,
        ipAddress: '127.0.0.1',
        userAgent: 'Email Test Script',
      }
    )

    log('green', `✅ Password reset email queued (ID: ${emailId})`)
    console.log(`   Recipient: ${testEmail}`)
    return true
  } catch (error) {
    log(
      'red',
      `❌ Failed to send password reset email: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    return false
  }
}

async function testWelcomeEmail() {
  log('blue', '📤 Sending test welcome email...')

  const testEmail = process.env.TEST_EMAIL || 'test@example.com'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const emailId = await sendWelcomeEmail(
      { email: testEmail, name: 'Test User' },
      {
        userName: 'Test User',
        loginUrl: `${appUrl}/auth/signin`,
      }
    )

    log('green', `✅ Welcome email queued (ID: ${emailId})`)
    console.log(`   Recipient: ${testEmail}`)
    return true
  } catch (error) {
    log(
      'red',
      `❌ Failed to send welcome email: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    return false
  }
}

async function testPasswordChangedEmail() {
  log('blue', '📤 Sending test password changed email...')

  const testEmail = process.env.TEST_EMAIL || 'test@example.com'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const emailId = await sendPasswordChanged(
      { email: testEmail, name: 'Test User' },
      {
        userName: 'Test User',
        supportUrl: `${appUrl}/support`,
        ipAddress: '127.0.0.1',
        timestamp: new Date(),
      }
    )

    log('green', `✅ Password changed email queued (ID: ${emailId})`)
    console.log(`   Recipient: ${testEmail}`)
    return true
  } catch (error) {
    log(
      'red',
      `❌ Failed to send password changed email: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    return false
  }
}

async function showQueueStatus() {
  console.log()
  log('blue', '📊 Email Queue Status:')

  const status = getEmailQueueStatus()
  console.log(`   Total:    ${status.total}`)
  console.log(`   Pending:  ${status.pending}`)
  console.log(`   Sending:  ${status.sending}`)
  console.log(`   Failed:   ${status.failed}`)

  if (status.pending > 0) {
    log('yellow', '\n⏳ Emails are being processed in the background...')
  }

  if (status.failed > 0) {
    log('red', `\n⚠️  ${status.failed} email(s) failed to send. Check logs for details.`)
  }
}

async function main() {
  try {
    // Check if running in test mode
    if (!process.env.TEST_EMAIL) {
      log('yellow', '\n💡 Tip: Set TEST_EMAIL environment variable to send to your email')
      log('yellow', '   Example: TEST_EMAIL=your-email@example.com tsx scripts/test-email.ts\n')
    }

    // Test configuration
    const configValid = await testEmailConfiguration()
    if (!configValid) {
      process.exit(1)
    }

    // Test individual email types
    console.log()
    log('cyan', '🧪 Testing email templates...\n')

    const results = await Promise.all([
      testPasswordResetEmail(),
      testWelcomeEmail(),
      testPasswordChangedEmail(),
    ])

    // Wait a bit for queue to process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Show queue status
    showQueueStatus()

    // Summary
    console.log()
    log('cyan', '======================================')
    const successCount = results.filter(Boolean).length
    const totalTests = results.length

    if (successCount === totalTests) {
      log('green', `✅ All ${totalTests} email tests passed!`)
    } else {
      log('yellow', `⚠️  ${successCount}/${totalTests} email tests passed`)
    }
    log('cyan', '======================================\n')

    // Final instructions
    if (successCount > 0) {
      log('blue', '📝 Next Steps:')
      console.log('   1. Check SendGrid Activity Feed for delivery status:')
      console.log('      https://app.sendgrid.com/email_activity')
      console.log('   2. Verify emails arrived in inbox')
      console.log('   3. Check spam folder if not in inbox')
      console.log('   4. Set up domain authentication for production')
      console.log('   5. Configure webhook for delivery tracking (optional)\n')
    }

    process.exit(successCount === totalTests ? 0 : 1)
  } catch (error) {
    log(
      'red',
      `\n❌ Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    console.error(error)
    process.exit(1)
  }
}

// Run tests
main()
