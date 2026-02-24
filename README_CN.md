# Cuckoo 中继服务器 (开源版)

语言：中文 | [English](README.md)

**Cuckoos - 加密对讲机** 的安全、私密、开源的中继服务器。

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/wowofun/CuckooRelayServer.git)

## 部署选项

### 选项 1: Cloudflare Workers (推荐)
免费、快速、无需维护。

1.  **运行部署脚本:**
    ```bash
    ./deploy.sh
    ```
2.  按照屏幕提示操作即可。

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

## 文档目录
- [OpenClaw 集成指南](OPENCLAW_INTEGRATION.md)

## 隐私与安全
- **端到端加密**: App 在发送前加密音频，服务器只负责转发加密数据。
- **无日志**: 服务器仅临时存储消息以供投递。
- **频道隔离**: 您的连接密钥会被哈希处理，生成唯一的频道 ID，服务器管理员也无法知道您的原始密钥。
