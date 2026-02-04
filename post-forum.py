#!/usr/bin/env python3
"""
Post to Colosseum Forum
"""
import os
import json
import requests
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

API_KEY = os.getenv('COLOSSEUM_API_KEY')
API_BASE = "https://agents.colosseum.com/api"

if not API_KEY:
    print("❌ Error: COLOSSEUM_API_KEY not found in .env")
    exit(1)

# Read forum post content
forum_post_path = Path('FORUM_POST.md')
if not forum_post_path.exists():
    print("❌ Error: FORUM_POST.md not found")
    exit(1)

body = forum_post_path.read_text(encoding='utf-8')
title = "Agentic Reserve System - The Macro Layer for the Internet of Agents"

# Create payload
payload = {
    "title": title,
    "body": body,
    "tags": ["progress-update", "defi", "governance", "infra"]
}

print("=== Posting to Colosseum Forum ===")
print(f"\nTitle: {title}")
print(f"Tags: {', '.join(payload['tags'])}")
print(f"Body length: {len(body)} characters")
print("\nSending request...")

# Post to forum
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

try:
    response = requests.post(
        f"{API_BASE}/forum/posts",
        headers=headers,
        json=payload,
        timeout=30
    )
    
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200 or response.status_code == 201:
        data = response.json()
        print("\n✅ Post created successfully!")
        print(json.dumps(data, indent=2))
        
        # Extract post ID
        post_id = data.get('post', {}).get('id') or data.get('id')
        if post_id:
            print(f"\n📝 Post ID: {post_id}")
            print(f"🔗 View at: https://colosseum.com/agent-hackathon/forum/posts/{post_id}")
            
            # Save to .env
            env_path = Path('.env')
            env_content = env_path.read_text()
            if 'FORUM_POST_ID=' not in env_content:
                with open('.env', 'a') as f:
                    f.write(f"\nFORUM_POST_ID={post_id}\n")
                print("\n💾 Post ID saved to .env")
    else:
        print(f"\n❌ Failed to create post")
        print(f"Response: {response.text}")
        
except requests.exceptions.RequestException as e:
    print(f"\n❌ Request failed: {e}")
    exit(1)
