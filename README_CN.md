# Cuckoo 中继服务器 (开源版)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/wowofun/CuckooRelayServer.git)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/wowofun/CuckooRelayServer/pulls)

语言：**中文** | [English](README.md)

**Cuckoos - 加密对讲机** 的安全、私密、开源的中继服务器。

## 目录
- [功能特性](#功能特性)
- [部署选项](#部署选项)
  - [选项 1: Cloudflare Workers (推荐)](#选项-1-cloudflare-workers-推荐)
  - [选项 2: Docker / VPS (自建服务器)](#选项-2-docker--vps-自建服务器)
- [如何使用](#如何使用)
- [文档](#文档)
- [隐私与安全](#隐私与安全)
- [贡献指南](#贡献指南)
- [开源协议](#开源协议)

## 功能特性
- **零成本**: 完全运行在 Cloudflare Workers 免费层 + D1 数据库上。
- **隐私优先**: 消息通过您的私有连接密钥进行隔离。
- **免运维**: Serverless 架构，无需管理服务器。
- **一键部署**: 2 分钟内完成设置。

## 部署选项

### 选项 1: Cloudflare Workers (推荐)
免费、快速、无需维护。

1.  **点击下方按钮一键部署:**
    
    [![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/wowofun/CuckooRelayServer.git)

2.  或者**手动运行部署脚本:**
    ```bash
    ./deploy.sh
    ```
3.  按照屏幕提示操作即可。

### 选项 2: Docker / VPS (自建服务器)
可在任何支持 Docker 或 Node.js 的服务器上运行 (Ubuntu, CentOS, AWS, 阿里云, 腾讯云等)。

1.  **使用 Docker 运行:**
    ```bash
    docker build -t cuckoo-relay .
    docker run -d -p 8787:8787 -v $(pwd)/data:/data cuckoo-relay
    ```

2.  **或者直接使用 Node.js 运行:**
    ```bash
    npm install
    node server.js
    ```

## 如何使用
1.  打开 **Cuckoos App**。
2.  进入 **设置 (Settings)** -> **远程连接 (Remote Connection)**。
3.  输入您的 **服务器地址** (例如 `https://your-domain.com` 或 `http://your-ip:8787`)。
4.  输入任意 **连接密钥 (Connection Key)** (作为您的私有频道密码)。

## 文档
- [OpenClaw 集成指南](OPENCLAW_INTEGRATION.md) - 学习如何连接机器人或外部系统。

## 隐私与安全
- **端到端加密**: App 在发送前加密音频，服务器只负责转发加密数据。
- **无日志**: 服务器仅临时存储消息以供投递。
- **频道隔离**: 您的连接密钥会被哈希处理，生成唯一的频道 ID，服务器管理员也无法知道您的原始密钥。

## 贡献指南
欢迎提交 Pull Request 来改进本项目！

## 开源协议
本项目采用 MIT 协议 - 详情请参阅 [LICENSE](LICENSE) 文件。
