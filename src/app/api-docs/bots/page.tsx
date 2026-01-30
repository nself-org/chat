/**
 * Bot API Documentation
 * Complete reference for the Bot API
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BotApiDocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedCode === id ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Bot API Documentation</h1>
        <p className="text-lg text-muted-foreground">
          Build powerful integrations with the nself-chat Bot API
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="authentication">Auth</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Learn the basics of the Bot API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">What is the Bot API?</h3>
                <p className="text-muted-foreground">
                  The Bot API allows you to build automated integrations and bots that can:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2 text-muted-foreground">
                  <li>Send messages to channels</li>
                  <li>Create and manage channels</li>
                  <li>Add reactions to messages</li>
                  <li>Read user and channel information</li>
                  <li>Receive webhooks for real-time events</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Base URL</h3>
                <code className="bg-muted px-2 py-1 rounded">
                  https://your-domain.com/api/bots
                </code>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Rate Limits</h3>
                <p className="text-muted-foreground">
                  100 requests per minute per bot. Rate limit headers are included in every response:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2 text-muted-foreground">
                  <li><code>X-RateLimit-Remaining</code>: Requests remaining in current window</li>
                  <li><code>X-RateLimit-Reset</code>: When the rate limit resets</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>Required permissions for API access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {[
                  { name: 'messages.send', desc: 'Send messages to channels', danger: false },
                  { name: 'messages.read', desc: 'Read message history', danger: false },
                  { name: 'channels.create', desc: 'Create new channels', danger: false },
                  { name: 'channels.read', desc: 'Read channel information', danger: false },
                  { name: 'reactions.add', desc: 'Add reactions to messages', danger: false },
                  { name: 'users.read', desc: 'Read user information', danger: false },
                ].map((perm) => (
                  <div key={perm.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <code className="text-sm font-mono">{perm.name}</code>
                      <p className="text-sm text-muted-foreground mt-1">{perm.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Authentication */}
        <TabsContent value="authentication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>Authenticate your bot using API tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Creating a Bot Token</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Go to Admin → Bot Management</li>
                  <li>Create a new bot or select an existing one</li>
                  <li>Navigate to the Tokens tab</li>
                  <li>Click "Generate Token"</li>
                  <li>Select the required permissions (scopes)</li>
                  <li>Copy the token immediately (it won&apos;t be shown again)</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Using the Token</h3>
                <p className="text-muted-foreground mb-3">
                  Include your bot token in the Authorization header:
                </p>
                <CodeBlock
                  id="auth-header"
                  language="bash"
                  code={`Authorization: Bearer nbot_abc123def456...`}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Token Format</h3>
                <p className="text-muted-foreground mb-2">
                  Bot tokens always start with <code className="bg-muted px-1 rounded">nbot_</code> followed by 64 hexadecimal characters.
                </p>
                <p className="text-sm text-muted-foreground">
                  Example: <code className="bg-muted px-1 rounded">nbot_a1b2c3d4e5f6...</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Endpoints */}
        <TabsContent value="endpoints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>POST /api/bots/send-message</CardTitle>
              <CardDescription>Send a message to a channel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge>messages.send</Badge>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Request Body</h4>
                <CodeBlock
                  id="send-message-request"
                  language="json"
                  code={`{
  "channelId": "uuid",
  "content": "Hello from bot!",
  "attachments": [
    {
      "url": "https://example.com/file.pdf",
      "type": "application/pdf",
      "name": "document.pdf",
      "size": 1024
    }
  ]
}`}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response</h4>
                <CodeBlock
                  id="send-message-response"
                  language="json"
                  code={`{
  "success": true,
  "message": {
    "id": "uuid",
    "content": "Hello from bot!",
    "channelId": "uuid",
    "createdAt": "2026-01-30T12:00:00Z",
    "user": {
      "id": "uuid",
      "displayName": "My Bot",
      "avatarUrl": "https://..."
    }
  }
}`}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>POST /api/bots/create-channel</CardTitle>
              <CardDescription>Create a new channel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge>channels.create</Badge>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Request Body</h4>
                <CodeBlock
                  id="create-channel-request"
                  language="json"
                  code={`{
  "name": "bot-announcements",
  "description": "Updates from our bot",
  "isPrivate": false
}`}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response</h4>
                <CodeBlock
                  id="create-channel-response"
                  language="json"
                  code={`{
  "success": true,
  "channel": {
    "id": "uuid",
    "name": "bot-announcements",
    "description": "Updates from our bot",
    "isPrivate": false,
    "createdAt": "2026-01-30T12:00:00Z"
  }
}`}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>GET /api/bots/channel-info</CardTitle>
              <CardDescription>Get channel information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge>channels.read</Badge>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Query Parameters</h4>
                <code className="bg-muted px-2 py-1 rounded">?channelId=uuid</code>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response</h4>
                <CodeBlock
                  id="channel-info-response"
                  language="json"
                  code={`{
  "success": true,
  "channel": {
    "id": "uuid",
    "name": "general",
    "description": "General discussion",
    "isPrivate": false,
    "stats": {
      "messageCount": 1234,
      "memberCount": 56
    }
  }
}`}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>POST /api/bots/add-reaction</CardTitle>
              <CardDescription>Add a reaction to a message</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge>reactions.add</Badge>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Request Body</h4>
                <CodeBlock
                  id="add-reaction-request"
                  language="json"
                  code={`{
  "messageId": "uuid",
  "emoji": "👍"
}`}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>GET /api/bots/user-info</CardTitle>
              <CardDescription>Get user information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge>users.read</Badge>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Query Parameters</h4>
                <code className="bg-muted px-2 py-1 rounded">?userId=uuid</code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Receive real-time events from nself-chat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Setting Up Webhooks</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Go to Admin → Bot Management</li>
                  <li>Select your bot</li>
                  <li>Navigate to the Webhooks tab</li>
                  <li>Click "Add Webhook"</li>
                  <li>Enter your webhook URL (must be HTTPS)</li>
                  <li>Select the events you want to receive</li>
                  <li>Save the webhook secret for signature verification</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Webhook Events</h3>
                <div className="grid gap-2">
                  {[
                    'message.created',
                    'message.deleted',
                    'channel.created',
                    'user.joined',
                    'reaction.added',
                  ].map((event) => (
                    <div key={event} className="p-2 bg-muted rounded">
                      <code className="text-sm">{event}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Webhook Payload</h3>
                <CodeBlock
                  id="webhook-payload"
                  language="json"
                  code={`{
  "event": "message.created",
  "timestamp": "2026-01-30T12:00:00Z",
  "data": {
    "messageId": "uuid",
    "channelId": "uuid",
    "authorId": "uuid",
    "content": "Hello world",
    "createdAt": "2026-01-30T12:00:00Z"
  }
}`}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Verifying Webhooks</h3>
                <p className="text-muted-foreground mb-3">
                  Every webhook includes a signature in the <code className="bg-muted px-1 rounded">X-Webhook-Signature</code> header.
                  Verify it using HMAC-SHA256:
                </p>
                <CodeBlock
                  id="verify-webhook"
                  language="javascript"
                  code={`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from('sha256=' + expectedSignature)
  );
}`}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Retry Logic</h3>
                <p className="text-muted-foreground">
                  Failed webhooks are automatically retried up to 5 times with exponential backoff:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2 text-muted-foreground">
                  <li>Attempt 1: Immediate</li>
                  <li>Attempt 2: 2 seconds later</li>
                  <li>Attempt 3: 4 seconds later</li>
                  <li>Attempt 4: 8 seconds later</li>
                  <li>Attempt 5: 16 seconds later</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples */}
        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
              <CardDescription>Get started quickly with these examples</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">cURL</h3>
                <CodeBlock
                  id="curl-example"
                  language="bash"
                  code={`# Send a message
curl -X POST https://your-domain.com/api/bots/send-message \\
  -H "Authorization: Bearer nbot_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "channelId": "uuid",
    "content": "Hello from bot!"
  }'`}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">JavaScript</h3>
                <CodeBlock
                  id="js-example"
                  language="javascript"
                  code={`const BOT_TOKEN = 'nbot_abc123...';
const API_BASE = 'https://your-domain.com/api/bots';

async function sendMessage(channelId, content) {
  const response = await fetch(\`\${API_BASE}/send-message\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${BOT_TOKEN}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channelId, content }),
  });

  return response.json();
}

// Usage
await sendMessage('channel-uuid', 'Hello from bot!');`}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Python</h3>
                <CodeBlock
                  id="python-example"
                  language="python"
                  code={`import requests

BOT_TOKEN = 'nbot_abc123...'
API_BASE = 'https://your-domain.com/api/bots'

def send_message(channel_id, content):
    response = requests.post(
        f'{API_BASE}/send-message',
        headers={
            'Authorization': f'Bearer {BOT_TOKEN}',
            'Content-Type': 'application/json',
        },
        json={
            'channelId': channel_id,
            'content': content,
        }
    )
    return response.json()

# Usage
send_message('channel-uuid', 'Hello from bot!')`}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
