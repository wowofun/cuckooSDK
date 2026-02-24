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
    created_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_channel_id ON messages(channel, id);
`);

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
    const { senderName, senderID, content, id, type } = req.body;
    
    if (!content || !senderID) {
      return res.status(400).send("Missing fields");
    }

    const stmt = db.prepare(
      `INSERT INTO messages (channel, sender_id, sender_name, content, msg_id, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    
    stmt.run(
      req.channelHex, 
      senderID, 
      senderName || "Unknown", 
      content, 
      id || crypto.randomUUID(), 
      type || "text", 
      Date.now()
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

app.listen(PORT, () => {
  console.log(`🐦 Cuckoo Relay Server is running on port ${PORT}`);
});
