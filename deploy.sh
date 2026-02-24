#!/bin/bash

# Cuckoo Relay Server - One-Click Deployment Script
# Usage: ./deploy.sh

echo "🐦 Cuckoos Relay Server Deployment"
echo "==================================="

# Determine Wrangler Command
if command -v wrangler &> /dev/null; then
    WRANGLER="wrangler"
elif command -v npx &> /dev/null; then
    echo "⚠️  Global Wrangler not found, using npx..."
    WRANGLER="npx wrangler"
else
    echo "❌ Wrangler (Cloudflare CLI) not found."
    echo "👉 Please install it: npm install -g wrangler"
    exit 1
fi

# 1. Login
echo "🔑 Checking Cloudflare login..."
$WRANGLER whoami || $WRANGLER login

# 2. Create D1 Database
echo "📦 Creating D1 Database..."
DB_NAME="cuckoos-db-$(date +%s)"
CREATE_OUTPUT=$($WRANGLER d1 create $DB_NAME)
DB_ID=$(echo "$CREATE_OUTPUT" | grep "database_id" | awk -F '"' '{print $2}')

if [ -z "$DB_ID" ]; then
    echo "❌ Failed to create database. Please check your Cloudflare account limits."
    # Try to find existing
    echo "   Trying to use existing 'cuckoos-db'..."
    DB_ID=$($WRANGLER d1 list | grep "cuckoos-db" | awk '{print $1}' | head -n 1)
fi

if [ -z "$DB_ID" ]; then
   echo "❌ Could not create or find a database. Exiting."
   exit 1
fi

echo "✅ Database ID: $DB_ID"

# 3. Update wrangler.toml
echo "📝 Updating configuration..."
sed -i '' "s/database_id = \"\"/database_id = \"$DB_ID\"/" wrangler.toml

# 4. Apply Schema
echo "🏗️ Applying database schema..."
$WRANGLER d1 execute $DB_NAME --file=schema.sql --remote

# 5. Deploy Worker
echo "🚀 Deploying Worker..."
$WRANGLER deploy

echo "==================================="
echo "🎉 Deployment Complete!"
echo "1. Copy the URL above (e.g., https://cuckoos-relay.your-name.workers.dev)"
echo "2. Open Cuckoos App -> Settings -> Remote Connection"
echo "3. Enter the URL and any Secret Key you like."
echo "==================================="
