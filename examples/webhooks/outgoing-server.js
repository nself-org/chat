#!/usr/bin/env node

/**
 * Outgoing Webhook Test Server
 *
 * Simple Express server that receives and validates outgoing webhooks from nself-chat.
 *
 * Usage:
 *   npm install express body-parser
 *   node outgoing-server.js
 *
 * Then configure nself-chat outgoing webhook to point to:
 *   http://localhost:4000/webhook
 */

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 4000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';

// Parse JSON with raw body for signature verification
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

/**
 * Verify webhook signature
 */
function verifySignature(payload, signature, secret) {
  if (!signature) {
    return false;
  }

  // Extract algorithm and signature
  const [algorithm, receivedSignature] = signature.split('=');

  // Compute expected signature
  const hmac = crypto.createHmac(algorithm, secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  // Constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(receivedSignature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Webhook endpoint
 */
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const webhookId = req.headers['x-webhook-id'];
  const event = req.headers['x-webhook-event'];

  console.log('\n=== Webhook Received ===');
  console.log('Webhook ID:', webhookId);
  console.log('Event:', event);
  console.log('Timestamp:', new Date().toISOString());

  // Verify signature
  if (WEBHOOK_SECRET) {
    const isValid = verifySignature(req.rawBody, signature, WEBHOOK_SECRET);

    if (!isValid) {
      console.error('❌ Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('✓ Signature verified');
  }

  // Log payload
  console.log('\nPayload:');
  console.log(JSON.stringify(req.body, null, 2));

  // Process different event types
  switch (event) {
    case 'message.created':
      console.log(`\n💬 New message: "${req.body.data.message.content}"`);
      break;

    case 'message.updated':
      console.log(`\n✏️  Message updated: ${req.body.data.message.id}`);
      break;

    case 'message.deleted':
      console.log(`\n🗑️  Message deleted: ${req.body.data.message.id}`);
      break;

    case 'channel.created':
      console.log(`\n📁 New channel: ${req.body.data.channel.name}`);
      break;

    case 'member.joined':
      console.log(`\n👋 User joined: ${req.body.data.user.username}`);
      break;

    default:
      console.log(`\nℹ️  Event: ${event}`);
  }

  console.log('======================\n');

  // Respond quickly (under 3 seconds)
  res.status(200).json({
    success: true,
    received: true,
    event: event,
    timestamp: new Date().toISOString()
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`\n🚀 Outgoing webhook server listening on port ${PORT}`);
  console.log(`\nWebhook URL: http://localhost:${PORT}/webhook`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  if (WEBHOOK_SECRET) {
    console.log(`\n🔒 Signature verification enabled`);
  } else {
    console.log(`\n⚠️  WARNING: No webhook secret configured`);
    console.log(`   Set WEBHOOK_SECRET environment variable for signature verification`);
  }

  console.log(`\nWaiting for webhooks...\n`);
});
