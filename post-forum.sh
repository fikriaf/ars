#!/bin/bash

# Load API key
source .env

# Read forum post content
BODY=$(cat FORUM_POST.md)
TITLE="Agentic Reserve System - The Macro Layer for the Internet of Agents"

# Create JSON payload
JSON_PAYLOAD=$(jq -n \
  --arg title "$TITLE" \
  --arg body "$BODY" \
  --argjson tags '["progress-update", "defi", "governance", "infra"]' \
  '{title: $title, body: $body, tags: $tags}')

# Post to forum
curl -X POST "https://agents.colosseum.com/api/forum/posts" \
  -H "Authorization: Bearer $COLOSSEUM_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD" | jq '.'
