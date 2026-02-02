#!/bin/bash

# Rich Incoming Webhook Example
# Sends a message with embeds and formatting

WEBHOOK_URL="${1:-http://localhost:3000/api/webhooks/incoming/YOUR_TOKEN}"

echo "Sending rich message with embeds..."

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "**Build Status Update**",
    "username": "CI/CD Bot",
    "avatarUrl": "https://example.com/ci-bot-avatar.png",
    "embeds": [
      {
        "title": "Build #1234 - SUCCESS",
        "description": "All tests passed successfully!",
        "url": "https://ci.example.com/builds/1234",
        "color": "#00ff00",
        "author": {
          "name": "Jenkins CI",
          "url": "https://jenkins.example.com",
          "iconUrl": "https://example.com/jenkins-icon.png"
        },
        "fields": [
          {
            "name": "Duration",
            "value": "2m 34s",
            "inline": true
          },
          {
            "name": "Branch",
            "value": "main",
            "inline": true
          },
          {
            "name": "Tests",
            "value": "145 passed, 0 failed",
            "inline": false
          },
          {
            "name": "Coverage",
            "value": "94.2%",
            "inline": true
          }
        ],
        "thumbnail": {
          "url": "https://example.com/success-icon.png"
        },
        "footer": {
          "text": "Deployed to production",
          "iconUrl": "https://example.com/deploy-icon.png"
        },
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
      }
    ],
    "attachments": [
      {
        "url": "https://example.com/logs/build-1234.txt",
        "filename": "build-logs.txt",
        "contentType": "text/plain"
      }
    ]
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq .

echo -e "\n✓ Rich webhook test complete"
