# Cuckoo Relay Server (Open Source)

This is the official self-hosted relay server for the Cuckoos iOS App. By deploying this lightweight script to your own Cloudflare account (Free Tier), you can enable secure, remote communication between your devices and friends.

## Features

- **Zero Cost**: Runs entirely on Cloudflare Workers Free Tier + D1 Database.
- **Privacy First**: Messages are isolated by your secret Connection Key.
- **No Maintenance**: Serverless architecture, no servers to manage.
- **One-Click Deploy**: Setup in under 2 minutes.

## Deployment Guide

### Option 1: One-Click Button (Recommended)

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/bicornfun/cuckoos-relay)

1. Click the button above.
2. Authorize Cloudflare.
3. Follow the instructions to create a D1 database named `cuckoos-db`.
4. Copy your Worker URL (e.g., `https://cuckoo-relay.yourname.workers.dev`).

### Option 2: Command Line (For Developers)

1. Install Node.js and Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

4. The script will automatically:
   - Create a D1 database.
   - Apply the schema.
   - Deploy the worker code.
   - Output your Server URL.

## App Configuration

1. Open Cuckoos App on your iPhone.
2. Go to **Settings -> Remote Connection**.
3. Enable "Remote Connection".
4. Enter your **Server URL** (from step 3).
5. Enter any **Connection Key** (e.g., `my-secret-password-123`).
   - *Note: Share this Key ONLY with friends you want to chat with. Anyone with the same Key will be in the same "chat room".*

## Technical Details

- **Runtime**: Cloudflare Workers (Edge Network)
- **Database**: Cloudflare D1 (SQLite)
- **Protocol**: HTTPS Long Polling (Simulated Push)
- **Security**: Channel Isolation via SHA-256 Hashing of Connection Key.

## License

MIT License. Free for personal and commercial use.
