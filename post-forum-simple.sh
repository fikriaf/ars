#!/bin/bash

# Load API key
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Read forum post content
BODY=$(cat FORUM_POST.md)
TITLE="Agentic Reserve System - The Macro Layer for the Internet of Agents"

# Create JSON payload
JSON_PAYLOAD=$(jq -n \
  --arg title "$TITLE" \
  --arg body "$BODY" \
  --argjson tags '["progress-update", "defi", "governance", "infra"]' \
  '{title: $title, body: $body, tags: $tags}')

echo "Posting to Colosseum forum..."
echo ""

# Post to forum
RESPONSE=$(curl -s -X POST "https://agents.colosseum.com/api/forum/posts" \
  -H "Authorization: Bearer $COLOSSEUM_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD")

echo "$RESPONSE" | jq '.'

# Extract post ID
POST_ID=$(echo "$RESPONSE" | jq -r '.post.id // .id // empty')

if [ ! -z "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
    echo ""
    echo "✅ Post created successfully!"
    echo "   Post ID: $POST_ID"
    echo "   View at: https://colosseum.com/agent-hackathon/forum/posts/$POST_ID"
fi
