export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    
    // CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-connection-key",
    };
    
    if (method === "OPTIONS") {
      return new Response(null, { headers });
    }
    
    // 0. Check Environment
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: "Database binding (DB) is missing. Please check wrangler.toml configuration." 
      }), { 
        status: 500, 
        headers: { ...headers, "Content-Type": "application/json" } 
      });
    }

    // 1. Root / Health Check
    if (url.pathname === "/" || url.pathname === "/info") {
      return new Response(JSON.stringify({
        status: "ok",
        service: "Cuckoo Relay Server",
        version: "1.0.0",
        message: "Your private server is running! Use the URL and your Connection Key in the Cuckoos App."
      }), { 
        headers: { ...headers, "Content-Type": "application/json" } 
      });
    }
    
    // 2. Authentication & Channel Hash
    const key = request.headers.get("x-connection-key");
    if (!key) {
      return new Response(JSON.stringify({ error: "Missing x-connection-key header" }), { 
        status: 401, 
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }
    
    // Hash the key to get the channel ID (Privacy: we don't store the raw key)
    const channelId = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
    const channelHex = Array.from(new Uint8Array(channelId))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
      
    // 3. Send Message (POST /send)
    if (method === "POST" && url.pathname === "/send") {
      try {
        const body = await request.json();
        const { senderName, senderID, content, id, type, quoteId, quoteContent, quoteSender, fileData, fileName } = body;
        
        if ((!content && !fileData) || !senderID) {
          return new Response("Missing fields", { status: 400, headers });
        }
        
        // Store in D1
        // Table: messages (id INTEGER PRIMARY KEY, channel TEXT, sender_id TEXT, sender_name TEXT, content TEXT, msg_id TEXT, type TEXT, created_at INTEGER, quote_id TEXT, quote_content TEXT, quote_sender TEXT, file_data TEXT, file_name TEXT)
        const stmt = env.DB.prepare(
          `INSERT INTO messages (channel, sender_id, sender_name, content, msg_id, type, created_at, quote_id, quote_content, quote_sender, file_data, file_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          channelHex, 
          senderID, 
          senderName || "Unknown", 
          content || "", 
          id || crypto.randomUUID(), 
          type || "text", 
          Date.now(),
          quoteId || null,
          quoteContent || null,
          quoteSender || null,
          fileData || null,
          fileName || null
        );
        
        await stmt.run();
        
        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...headers, "Content-Type": "application/json" } 
        });
      } catch (e) {
        if (e.message.includes("no such table")) {
          // Auto-initialize Schema if missing
          console.log("Table missing, initializing schema...");
          await initSchema(env);
          
          // Retry the insert
          const stmt = env.DB.prepare(
            `INSERT INTO messages (channel, sender_id, sender_name, content, msg_id, type, created_at, quote_id, quote_content, quote_sender, file_data, file_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            channelHex, 
            senderID, 
            senderName || "Unknown", 
            content || "", 
            id || crypto.randomUUID(), 
            type || "text", 
            Date.now(),
            quoteId || null,
            quoteContent || null,
            quoteSender || null,
            fileData || null,
            fileName || null
          );
          await stmt.run();
          
          return new Response(JSON.stringify({ success: true }), { 
            headers: { ...headers, "Content-Type": "application/json" } 
          });
        }
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }
    
    // 4. Sync Messages / Long Polling (GET /poll)
    if (method === "GET" && url.pathname === "/poll") {
      // Logic: Wait for new messages if none exist immediately
      // This uses Cloudflare Workers' ability to await without consuming CPU time (free tier friendly)
      
      // Get the last message ID the client has seen (optional cursor)
      // Note: We use 'id' (Auto Increment Integer) for reliable ordering, not timestamp
      const lastId = parseInt(url.searchParams.get("last_id") || "0");
      const userId = url.searchParams.get("user_id");
      const userName = url.searchParams.get("user_name");
      
      // Update Presence
      if (userId) {
        // D1 upsert
        try {
          await env.DB.prepare(
            `INSERT INTO presence (channel, user_id, user_name, last_seen) VALUES (?, ?, ?, ?) 
             ON CONFLICT(channel, user_id) DO UPDATE SET last_seen = ?, user_name = ?`
          ).bind(channelHex, userId, userName || "Unknown", Date.now(), Date.now(), userName || "Unknown").run();
        } catch (e) {
           if (e.message.includes("no such table")) {
             // Auto-init schema if missing (for presence)
             console.log("Presence table missing, initializing...");
             await initSchema(env);
             // Retry presence update
             try {
                await env.DB.prepare(
                  `INSERT INTO presence (channel, user_id, user_name, last_seen) VALUES (?, ?, ?, ?) 
                   ON CONFLICT(channel, user_id) DO UPDATE SET last_seen = ?, user_name = ?`
                ).bind(channelHex, userId, userName || "Unknown", Date.now(), Date.now(), userName || "Unknown").run();
             } catch(retryErr) { console.error("Retry failed", retryErr); }
           } else {
             console.error(e);
           }
        }
      }
      
      const startTime = Date.now();
      const TIMEOUT = 15000; // 15 seconds long poll (Client timeout should be > 15s)
      
      try {
        while (Date.now() - startTime < TIMEOUT) {
          // Query for new messages
          // Note: If table doesn't exist, this will throw
          const messages = await env.DB.prepare(
            `SELECT * FROM messages WHERE channel = ? AND id > ? ORDER BY id ASC LIMIT 50`
          ).bind(channelHex, lastId).all();
          
          if (messages.results && messages.results.length > 0) {
            // Found new messages! Return immediately
            return new Response(JSON.stringify(messages.results), { 
              headers: { ...headers, "Content-Type": "application/json" } 
            });
          }
          
          // No messages yet, wait 1s before checking again
          // This 'await' does NOT count towards CPU time limit on CF Workers
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (e) {
        if (e.message.includes("no such table")) {
          // Auto-initialize Schema if missing (for poll)
          console.log("Table missing in poll, initializing schema...");
          await initSchema(env);
          
          // Return empty list to force client reconnect (simple retry mechanism)
          return new Response(JSON.stringify([]), { 
            headers: { ...headers, "Content-Type": "application/json" } 
          });
        }
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
      
      // Timeout reached, return empty list so client reconnects
      return new Response(JSON.stringify([]), { 
        headers: { ...headers, "Content-Type": "application/json" } 
      });
    }
    
    // 5. Get Members (GET /members)
    if (method === "GET" && url.pathname === "/members") {
      const ACTIVE_THRESHOLD = 60000; // 1 minute
      const now = Date.now();
      
      try {
        const results = await env.DB.prepare(
          `SELECT user_id as id, user_name as name, last_seen as lastSeen FROM presence WHERE channel = ? AND last_seen > ?`
        ).bind(channelHex, now - ACTIVE_THRESHOLD).all();
        
        return new Response(JSON.stringify({
          count: results.results.length,
          members: results.results
        }), { 
          headers: { ...headers, "Content-Type": "application/json" } 
        });
      } catch (e) {
         if (e.message.includes("no such table")) {
            await initSchema(env);
            return new Response(JSON.stringify({ count: 0, members: [] }), { 
              headers: { ...headers, "Content-Type": "application/json" } 
            });
         }
         return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }
    
    return new Response("Not Found", { status: 404, headers });
  },
  
  // Scheduled Task (Cron Trigger)
  // Configure this in wrangler.toml with [triggers] crons = ["0 * * * *"] (Every hour)
  async scheduled(event, env, ctx) {
    console.log("Running scheduled cleanup...");
    const retentionMs = 24 * 60 * 60 * 1000; // 24 Hours
    const cutoff = Date.now() - retentionMs;
    
    try {
      await env.DB.prepare("DELETE FROM messages WHERE created_at < ?").bind(cutoff).run();
      console.log(`Deleted messages older than ${new Date(cutoff).toISOString()}`);
    } catch (e) {
      console.error("Cleanup failed:", e);
    }
  }
}

// Helper: Auto-Initialize Schema
async function initSchema(env) {
  // Batch execute schema creation
  await env.DB.batch([
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_name TEXT,
        content TEXT,
        msg_id TEXT,
        type TEXT,
        created_at INTEGER,
        quote_id TEXT,
        quote_content TEXT,
        quote_sender TEXT,
        file_data TEXT,
        file_name TEXT
      )
    `),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_channel_id ON messages(channel, id)`),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS presence (
        channel TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT,
        last_seen INTEGER,
        PRIMARY KEY (channel, user_id)
      )
    `),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_presence_channel ON presence(channel)`)
  ]);
  console.log("Schema initialized successfully.");
}
