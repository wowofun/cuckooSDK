DROP TABLE IF EXISTS messages;
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  content TEXT,
  msg_id TEXT,
  type TEXT,
  created_at INTEGER
);
CREATE INDEX idx_channel_id ON messages(channel, id);
