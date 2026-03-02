# Cuckoo Relay Server (Open Source)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/wowofun/CuckooRelayServer.git)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/wowofun/CuckooRelayServer/pulls)

Language: **English** | [中文](README_CN.md)

A secure, private, and open-source relay server for **Cuckoos - Encrypted Walkie Talkie**.

## Table of Contents
- [Features](#features)
- [Deployment Options](#deployment-options)
  - [Option 1: Cloudflare Workers (Recommended)](#option-1-cloudflare-workers-recommended)
  - [Option 2: Docker / VPS](#option-2-docker--vps)
- [Usage in App](#usage-in-app)
- [Documentation](#documentation)
- [Privacy & Security](#privacy--security)
- [Contributing](#contributing)
- [License](#license)

## Features
- **Zero Cost**: Runs entirely on Cloudflare Workers Free Tier + D1 Database.
- **Privacy First**: Messages are isolated by your secret Connection Key.
- **No Maintenance**: Serverless architecture, no servers to manage.
- **One-Click Deploy**: Setup in under 2 minutes.

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

## Documentation
- [OpenClaw Integration Guide](OPENCLAW_INTEGRATION.md) - Learn how to connect bots or external systems.

## Privacy & Security
- **End-to-End Encryption**: The app encrypts audio *before* sending.
- **No Logs**: This relay server only stores messages temporarily for delivery.
- **Channel Isolation**: Your Connection Key is hashed to create a unique channel ID.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
