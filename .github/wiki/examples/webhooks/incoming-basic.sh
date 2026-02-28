#!/bin/bash

# Basic Incoming Webhook Example
# Sends a simple text message to a channel

WEBHOOK_URL="${1:-http://localhost:3000/api/webhooks/incoming/YOUR_TOKEN}"

echo "Sending basic message to webhook..."

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello from webhook! This is a test message.",
    "username": "Test Bot"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq .

echo -e "\n✓ Basic webhook test complete"
