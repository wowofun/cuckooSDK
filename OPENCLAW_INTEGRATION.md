# OpenClaw Integration Guide

Language: English | [中文](#中文说明)

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

---

# 中文说明

本说明介绍如何将 **OpenClaw**（或任意第三方机器人/系统）接入 Cuckoo Relay Server，实现实时发送与接收消息。

## 概述

Cuckoo Relay Server 提供简洁的 HTTP API，允许外部系统与 Cuckoos App 用户交互。

- **Base URL**：你已部署的服务地址（例如 `https://your-relay.workers.dev`）
- **Authentication**：通过请求头 `x-connection-key` 加入指定频道

## 1. 配置

接入 OpenClaw 需要以下信息：

1. **Server URL**：你的 Cuckoo Relay Server 地址
2. **Connection Key**：与 App 用户使用的连接密钥保持一致

## 2. API 参考

### 鉴权请求头

所有请求必须包含：

```http
x-connection-key: <YOUR_CONNECTION_KEY>
```

### 发送消息

- **Endpoint**：`POST /send`
- **Headers**：
  - `Content-Type`: `application/json`
  - `x-connection-key`: `<YOUR_CONNECTION_KEY>`
- **Body**：

```json
{
  "senderName": "OpenClaw",
  "senderID": "openclaw-bot-001",
  "content": "Hello from OpenClaw!",
  "id": "550e8400-e29b-...",
  "type": "text"
}
```

### 接收消息（长轮询）

- **Endpoint**：`GET /poll`
- **Query 参数**：
  - `last_id`：上次接收消息的 id，首次传 `0`
- **Headers**：
  - `x-connection-key`: `<YOUR_CONNECTION_KEY>`

**返回说明**：
15 秒内无新消息返回空数组 `[]`，有新消息返回数组：

```json
[
  {
    "id": 105,
    "sender_name": "Rowan",
    "sender_id": "user-123",
    "content": "Hi OpenClaw, what is the status?",
    "msg_id": "uuid-...",
    "created_at": 1719
  }
]
```

### 集成逻辑（伪代码）

与上方英文伪代码一致，核心是维护 `last_id` 并持续轮询 `/poll`，收到新消息后更新游标并处理业务逻辑。
