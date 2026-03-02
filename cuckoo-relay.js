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
        const { senderName, senderID, content, id, type, quoteContent, quoteSender } = body;
        
        if (!content || !senderID) {
          return new Response("Missing fields", { status: 400, headers });
        }
        
        // Store in D1
        // Table: messages (id INTEGER PRIMARY KEY, channel TEXT, sender_id TEXT, sender_name TEXT, content TEXT, msg_id TEXT, type TEXT, created_at INTEGER, quote_content TEXT, quote_sender TEXT)
        const stmt = env.DB.prepare(
          `INSERT INTO messages (channel, sender_id, sender_name, content, msg_id, type, created_at, quote_content, quote_sender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          channelHex, 
          senderID, 
          senderName || "Unknown", 
          content, 
          id || crypto.randomUUID(), 
          type || "text", 
          Date.now(),
          quoteContent || null,
          quoteSender || null
        );
        
        await stmt.run();
        
        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...headers, "Content-Type": "application/json" } 
        });
      } catch (e) {
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
          // Ignore presence errors to keep polling alive
          console.error(e);
        }
      }
      
      const startTime = Date.now();
      const TIMEOUT = 15000; // 15 seconds long poll (Client timeout should be > 15s)
      
      while (Date.now() - startTime < TIMEOUT) {
        // Query for new messages
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
      
      // Timeout reached, return empty list so client reconnects
      return new Response(JSON.stringify([]), { 
        headers: { ...headers, "Content-Type": "application/json" } 
      });
    }
    
    // 5. Get Members (GET /members)
    if (method === "GET" && url.pathname === "/members") {
      const ACTIVE_THRESHOLD = 60000; // 1 minute
      const now = Date.now();
      
      const results = await env.DB.prepare(
        `SELECT user_id as id, user_name as name, last_seen as lastSeen FROM presence WHERE channel = ? AND last_seen > ?`
      ).bind(channelHex, now - ACTIVE_THRESHOLD).all();
      
      return new Response(JSON.stringify({
        count: results.results.length,
        members: results.results
      }), { 
        headers: { ...headers, "Content-Type": "application/json" } 
      });
    }
    
    return new Response("Not Found", { status: 404, headers });
  }
}
