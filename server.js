const express = require('express');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8787;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'cuckoos.db');

// Initialize Database
const db = new Database(DB_PATH);

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT,
    content TEXT,
    msg_id TEXT,
    type TEXT,
    created_at INTEGER,
    quote_content TEXT,
    quote_sender TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_channel_id ON messages(channel, id);
  
  CREATE TABLE IF NOT EXISTS presence (
    channel TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT,
    last_seen INTEGER,
    PRIMARY KEY (channel, user_id)
  );
  CREATE INDEX IF NOT EXISTS idx_presence_channel ON presence(channel);
`);

// Migration: Add missing columns if they don't exist (for existing databases)
try {
  const tableInfo = db.pragma('table_info(messages)');
  const columns = tableInfo.map(c => c.name);
  
  if (!columns.includes('quote_content')) {
    console.log("Migrating: Adding quote_content column...");
    db.prepare('ALTER TABLE messages ADD COLUMN quote_content TEXT').run();
  }
  if (!columns.includes('quote_sender')) {
    console.log("Migrating: Adding quote_sender column...");
    db.prepare('ALTER TABLE messages ADD COLUMN quote_sender TEXT').run();
  }
} catch (error) {
  console.error('Migration failed:', error);
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-connection-key']
}));
app.use(express.json());

// Helper: Hash Key
function getChannelId(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// 1. Root / Health Check
app.get(['/', '/info'], (req, res) => {
  res.json({
    status: "ok",
    service: "Cuckoo Relay Server (Node.js)",
    version: "1.0.0",
    message: "Your private server is running! Use the URL and your Connection Key in the Cuckoos App."
  });
});

// Middleware for Auth
const requireAuth = (req, res, next) => {
  const key = req.headers['x-connection-key'];
  if (!key) {
    return res.status(401).json({ error: "Missing x-connection-key header" });
  }
  req.channelHex = getChannelId(key);
  next();
};

// 3. Send Message
app.post('/send', requireAuth, (req, res) => {
  try {
    const { senderName, senderID, content, id, type, quoteContent, quoteSender } = req.body;
    
    if (!content || !senderID) {
      return res.status(400).send("Missing fields");
    }

    const stmt = db.prepare(
      `INSERT INTO messages (channel, sender_id, sender_name, content, msg_id, type, created_at, quote_content, quote_sender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    
    stmt.run(
      req.channelHex, 
      senderID, 
      senderName || "Unknown", 
      content, 
      id || crypto.randomUUID(), 
      type || "text", 
      Date.now(),
      quoteContent || null,
      quoteSender || null
    );
    
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 4. Poll Messages
app.get('/poll', requireAuth, async (req, res) => {
  const lastId = parseInt(req.query.last_id || "0");
  const userId = req.query.user_id;
  const userName = req.query.user_name;
  
  // Update Presence if user info is provided
  if (userId) {
    try {
      const stmt = db.prepare(
        `INSERT INTO presence (channel, user_id, user_name, last_seen) VALUES (?, ?, ?, ?) 
         ON CONFLICT(channel, user_id) DO UPDATE SET last_seen = ?, user_name = ?`
      );
      const now = Date.now();
      stmt.run(req.channelHex, userId, userName || "Unknown", now, now, userName || "Unknown");
    } catch (e) {
      console.error("Presence update failed:", e);
    }
  }

  const TIMEOUT = 20000; // 20 seconds
  const startTime = Date.now();

  const checkMessages = () => {
    const stmt = db.prepare(
      `SELECT * FROM messages WHERE channel = ? AND id > ? ORDER BY id ASC LIMIT 50`
    );
    return stmt.all(req.channelHex, lastId);
  };

  // Immediate check
  let messages = checkMessages();
  if (messages.length > 0) {
    return res.json(messages);
  }

  // Long polling loop
  const interval = 500; // Check every 500ms
  
  const pollInterval = setInterval(() => {
    if (Date.now() - startTime >= TIMEOUT) {
      clearInterval(pollInterval);
      return res.json([]);
    }

    messages = checkMessages();
    if (messages.length > 0) {
      clearInterval(pollInterval);
      res.json(messages);
    }
  }, interval);

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(pollInterval);
  });
});

// 5. Get Members
app.get('/members', requireAuth, (req, res) => {
  try {
    const ACTIVE_THRESHOLD = 60000; // 1 minute
    const now = Date.now();
    
    // Get active members
    const stmt = db.prepare(
      `SELECT user_id as id, user_name as name, last_seen as lastSeen FROM presence WHERE channel = ? AND last_seen > ?`
    );
    const members = stmt.all(req.channelHex, now - ACTIVE_THRESHOLD);
    
    // Map timestamp to ISO date if needed, or keep as number. Swift Date can init from timestamp.
    // However, Swift usually expects seconds. JS Date.now() is ms.
    // Let's return ms for consistency, or convert. 
    // The previous Swift code used Date(timeIntervalSince1970: TimeInterval(sMsg.created_at) / 1000) for messages.
    // So ms is fine.
    
    res.json({
      count: members.length,
      members: members
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`🐦 Cuckoo Relay Server is running on port ${PORT}`);
});
