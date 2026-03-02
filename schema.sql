DROP TABLE IF EXISTS messages;
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  content TEXT,
  msg_id TEXT,
  type TEXT,
  created_at INTEGER,
  quote_content TEXT,
  quote_sender TEXT,
  file_data TEXT,
  file_name TEXT
);
CREATE INDEX idx_channel_id ON messages(channel, id);

DROP TABLE IF EXISTS presence;
CREATE TABLE presence (
  channel TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT,
  last_seen INTEGER,
  PRIMARY KEY (channel, user_id)
);
CREATE INDEX idx_presence_channel ON presence(channel);
