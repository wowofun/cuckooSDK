# Cuckoo Relay Server (Open Source)

[English](README_EN.md) | [简体中文](README_CN.md)

这是 Cuckoos iOS App 的官方自托管中继服务器。通过将此轻量级脚本部署到您自己的 Cloudflare 账户（免费版即可），您可以实现设备与朋友之间的安全远程通信，突破局域网限制。

## 主要特点

- **零成本**: 完全运行在 Cloudflare Workers 免费版 + D1 数据库上。
- **隐私优先**: 消息通过您的秘密“连接密钥”进行隔离。
- **无需维护**: Serverless 架构，无需管理服务器。
- **一键部署**: 2分钟内完成设置。

## 部署指南

### 选项 1: 一键部署按钮 (推荐)

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/bicornfun/cuckoos-relay)

1. 点击上方按钮。
2. 授权 Cloudflare。
3. 按照提示创建一个名为 `cuckoos-db` 的 D1 数据库。
4. 复制您的 Worker URL (例如: `https://cuckoo-relay.yourname.workers.dev`)。

### 选项 2: 命令行 (适合开发者)

1. 安装 Node.js 和 Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. 登录 Cloudflare:
   ```bash
   wrangler login
   ```

3. 运行部署脚本:
   ```bash
   ./deploy.sh
   ```

4. 脚本将自动:
   - 创建 D1 数据库。
   - 应用数据库结构。
   - 部署 Worker 代码。
   - 输出您的服务器 URL。

## App 配置

1. 在 iPhone 上打开 Cuckoos App。
2. 进入 **设置 -> 远程互联**。
3. 启用 "远程互联"。
4. 输入您的 **服务器地址** (第3步获取的 URL)。
5. 输入任意 **连接密钥** (例如: `my-secret-password-123`)。
   - *注意: 只有输入相同密钥的朋友才能互相聊天。拥有相同密钥的人将在同一个“聊天室”中。*

## 技术细节

- **运行时**: Cloudflare Workers (边缘网络)
- **数据库**: Cloudflare D1 (SQLite)
- **协议**: HTTPS 长轮询 (模拟推送)
- **安全**: 通过连接密钥的 SHA-256 哈希进行频道隔离。

## 许可证

MIT License. 免费用于个人和商业用途。
