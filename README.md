# Cuckoo Relay Server (Open Source)

A secure, private, and open-source relay server for **Cuckoos - Encrypted Walkie Talkie**.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/wowofun/cuckooSDK)

## Deployment Options

### Option 1: Cloudflare Workers (Recommended)
Free, fast, and requires zero maintenance.

1.  **Run the deployment script:**
    ```bash
    ./deploy.sh
    ```
2.  Follow the instructions on screen.

### Option 2: Docker / VPS
Run on any server (Ubuntu, CentOS, AWS, DigitalOcean, etc.).

1.  **Build and Run with Docker:**
    ```bash
    docker build -t cuckoo-relay .
    docker run -d -p 8787:8787 -v $(pwd)/data:/data cuckoo-relay
    ```

2.  **Or Run with Node.js directly:**
    ```bash
    npm install
    node server.js
    ```

## Usage in App
1.  Open **Cuckoos App**.
2.  Go to **Settings** -> **Remote Connection**.
3.  Enter your server URL (e.g., `https://your-server.com` or `http://your-ip:8787`).
4.  Enter any **Connection Key** (shared password).

## Privacy & Security
- **End-to-End Encryption**: The app encrypts audio *before* sending.
- **No Logs**: This relay server only stores messages temporarily for delivery.
- **Channel Isolation**: Your Connection Key is hashed to create a unique channel ID.
