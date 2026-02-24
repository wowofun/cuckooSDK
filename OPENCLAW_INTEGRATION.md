# OpenClaw Integration Guide

This guide explains how to integrate **OpenClaw** (or any third-party bot/system) with your Cuckoo Relay Server to send and receive messages in real-time.

## Overview

The Cuckoo Relay Server exposes a simple HTTP API that allows external systems to interact with Cuckoos App users.

- **Base URL**: Your deployed server URL (e.g., `https://your-relay.workers.dev`)
- **Authentication**: Uses the `x-connection-key` header to join a specific channel.

---

## 1. Configuration

To connect OpenClaw to a specific Cuckoo channel, you need:

1.  **Server URL**: The address of your Cuckoo Relay Server.
2.  **Connection Key**: The same key used by the Cuckoos App users you want to communicate with.

## 2. API Reference

### Authentication Header
All requests must include this header:
```http
x-connection-key: <YOUR_CONNECTION_KEY>
```

### Send Message

Send a text message to the channel.

- **Endpoint**: `POST /send`
- **Headers**:
    - `Content-Type`: `application/json`
    - `x-connection-key`: `<YOUR_CONNECTION_KEY>`
- **Body**:
    ```json
    {
      "senderName": "OpenClaw",       // Display name in the app
      "senderID": "openclaw-bot-001", // Unique ID for the bot (keep consistent)
      "content": "Hello from OpenClaw!", // Message text
      "id": "550e8400-e29b-...",      // Unique Message ID (UUID v4 recommended)
      "type": "text"                  // Must be "text"
    }
    ```

**Example (cURL):**
```bash
curl -X POST https://your-relay.workers.dev/send \
  -H "Content-Type: application/json" \
  -H "x-connection-key: my-secret-password" \
  -d '{
    "senderName": "OpenClaw",
    "senderID": "bot-01",
    "content": "System Alert: Server restart in 5 mins",
    "type": "text"
  }'
```

### Receive Messages (Long Polling)

Listen for new messages from the channel.

- **Endpoint**: `GET /poll`
- **Query Parameters**:
    - `last_id`: The ID of the last message received. Pass `0` for the first request.
- **Headers**:
    - `x-connection-key`: `<YOUR_CONNECTION_KEY>`

**Response**:
Returns an array of new messages. If no new messages are available within 15 seconds, returns an empty array `[]`.

```json
[
  {
    "id": 105,               // Server Auto-Increment ID (Use this for next 'last_id')
    "sender_name": "Rowan",  // User Display Name
    "sender_id": "user-123", // User Unique ID
    "content": "Hi OpenClaw, what is the status?",
    "msg_id": "uuid-...",    // Original Message UUID
    "created_at": 1719...    // Timestamp
  }
]
```

**Integration Logic (Pseudo-code):**

```javascript
let lastId = 0;

async function pollMessages() {
  while (true) {
    try {
      const response = await fetch(`${SERVER_URL}/poll?last_id=${lastId}`, {
        headers: { "x-connection-key": CONNECTION_KEY }
      });
      
      const messages = await response.json();
      
      for (const msg of messages) {
        console.log(`Received from ${msg.sender_name}: ${msg.content}`);
        // Process message...
        
        // Update cursor
        if (msg.id > lastId) {
          lastId = msg.id;
        }
      }
    } catch (error) {
      console.error("Polling error, retrying in 5s...", error);
      await sleep(5000);
    }
  }
}

pollMessages();
```
