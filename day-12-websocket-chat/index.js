'use strict';

const http = require('http');
const crypto = require('crypto');

/**
 * ============================================================
 * DAY 12 — WebSocket Chat (Real-time Messaging)
 * ============================================================
 * Algorithme  : WebSocket Protocol + Broadcast Pattern
 * Complexité  : O(n) pour broadcast (n = nombre de clients)
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── WebSocket Protocol ──────────────────────────────────────

const WS_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function createAcceptKey(key) {
  return crypto
    .createHash('sha1')
    .update(key + WS_MAGIC_STRING)
    .digest('base64');
}

function parseFrame(buffer) {
  const firstByte = buffer.readUInt8(0);
  const fin = (firstByte & 0x80) === 0x80;
  const opcode = firstByte & 0x0F;

  const secondByte = buffer.readUInt8(1);
  const masked = (secondByte & 0x80) === 0x80;
  let payloadLength = secondByte & 0x7F;

  let offset = 2;

  if (payloadLength === 126) {
    payloadLength = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLength === 127) {
    payloadLength = buffer.readBigUInt64BE(2);
    offset = 10;
  }

  let maskKey = null;
  if (masked) {
    maskKey = buffer.slice(offset, offset + 4);
    offset += 4;
  }

  let payload = buffer.slice(offset, offset + Number(payloadLength));

  if (masked && maskKey) {
    payload = Buffer.from(payload.map((byte, i) => byte ^ maskKey[i % 4]));
  }

  return {
    fin,
    opcode,
    payload: payload.toString('utf8'),
    length: offset + Number(payloadLength),
  };
}

function createFrame(data) {
  const payload = Buffer.from(data);
  const payloadLength = payload.length;

  let frame;
  let offset;

  if (payloadLength < 126) {
    frame = Buffer.alloc(2 + payloadLength);
    frame.writeUInt8(0x81, 0); // FIN + text opcode
    frame.writeUInt8(payloadLength, 1);
    offset = 2;
  } else if (payloadLength < 65536) {
    frame = Buffer.alloc(4 + payloadLength);
    frame.writeUInt8(0x81, 0);
    frame.writeUInt8(126, 1);
    frame.writeUInt16BE(payloadLength, 2);
    offset = 4;
  } else {
    frame = Buffer.alloc(10 + payloadLength);
    frame.writeUInt8(0x81, 0);
    frame.writeUInt8(127, 1);
    frame.writeBigUInt64BE(BigInt(payloadLength), 2);
    offset = 10;
  }

  payload.copy(frame, offset);
  return frame;
}

// ─── Chat Server ─────────────────────────────────────────────

class ChatServer {
  constructor() {
    this.clients = new Map();
    this.messageHistory = [];
    this.maxHistory = 100;
  }

  handleUpgrade(req, socket) {
    const key = req.headers['sec-websocket-key'];
    const acceptKey = createAcceptKey(key);

    const responseHeaders = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '',
      '',
    ].join('\r\n');

    socket.write(responseHeaders);

    const clientId = crypto.randomBytes(8).toString('hex');
    const client = {
      id: clientId,
      socket,
      username: null,
      buffer: Buffer.alloc(0),
    };

    this.clients.set(clientId, client);

    console.log(`[${clientId}] Client connected (Total: ${this.clients.size})`);

    socket.on('data', (data) => {
      try {
        this.handleData(clientId, data);
      } catch (err) {
        console.error(`[${clientId}] Error:`, err.message);
      }
    });

    socket.on('close', () => {
      this.handleDisconnect(clientId);
    });

    socket.on('error', (err) => {
      console.error(`[${clientId}] Socket error:`, err.message);
      this.handleDisconnect(clientId);
    });

    // Envoyer historique
    this.sendHistory(clientId);
  }

  handleData(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.buffer = Buffer.concat([client.buffer, data]);

    while (client.buffer.length > 0) {
      try {
        const frame = parseFrame(client.buffer);
        
        if (frame.opcode === 0x08) {
          // Close frame
          this.handleDisconnect(clientId);
          return;
        }

        if (frame.opcode === 0x09) {
          // Ping frame
          this.sendPong(clientId);
          client.buffer = client.buffer.slice(frame.length);
          continue;
        }

        if (frame.opcode === 0x01) {
          // Text frame
          this.handleMessage(clientId, frame.payload);
          client.buffer = client.buffer.slice(frame.length);
        } else {
          break;
        }
      } catch (err) {
        console.error(`[${clientId}] Parse error:`, err.message);
        break;
      }
    }
  }

  handleMessage(clientId, payload) {
    try {
      const message = JSON.parse(payload);
      const client = this.clients.get(clientId);

      if (message.type === 'join') {
        client.username = message.username || `User${clientId.slice(0, 4)}`;
        console.log(`[${clientId}] ${client.username} joined`);
        
        this.broadcast({
          type: 'system',
          message: `${client.username} joined the chat`,
          timestamp: new Date().toISOString(),
        });

        this.sendToClient(clientId, {
          type: 'joined',
          username: client.username,
          users: this.getOnlineUsers(),
        });

        return;
      }

      if (message.type === 'message' && client.username) {
        const chatMessage = {
          type: 'message',
          username: client.username,
          message: message.message,
          timestamp: new Date().toISOString(),
        };

        this.addToHistory(chatMessage);
        this.broadcast(chatMessage);
        
        console.log(`[${client.username}] ${message.message}`);
      }

    } catch (err) {
      console.error(`[${clientId}] Invalid message:`, err.message);
    }
  }

  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (client.username) {
      this.broadcast({
        type: 'system',
        message: `${client.username} left the chat`,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[${clientId}] ${client.username || 'Client'} disconnected`);
    
    client.socket.destroy();
    this.clients.delete(clientId);
  }

  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || client.socket.destroyed) return;

    try {
      const frame = createFrame(JSON.stringify(data));
      client.socket.write(frame);
    } catch (err) {
      console.error(`[${clientId}] Send error:`, err.message);
    }
  }

  broadcast(data) {
    for (const [clientId] of this.clients) {
      this.sendToClient(clientId, data);
    }
  }

  sendPong(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const pongFrame = Buffer.from([0x8A, 0x00]); // Pong frame
    client.socket.write(pongFrame);
  }

  sendHistory(clientId) {
    for (const message of this.messageHistory) {
      this.sendToClient(clientId, message);
    }
  }

  addToHistory(message) {
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory.shift();
    }
  }

  getOnlineUsers() {
    return Array.from(this.clients.values())
      .filter(c => c.username)
      .map(c => c.username);
  }

  start(port = 8080) {
    const server = http.createServer((req, res) => {
      if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(this.getClientHTML());
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.on('upgrade', (req, socket) => {
      this.handleUpgrade(req, socket);
    });

    server.listen(port, () => {
      console.log(`\n💬 WebSocket Chat Server running on http://localhost:${port}`);
      console.log(`\nOpen http://localhost:${port} in your browser to join the chat`);
      console.log(`\nPress Ctrl+C to stop\n`);
    });

    return server;
  }

  getClientHTML() {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>WebSocket Chat</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; }
    #container { max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; margin-bottom: 20px; color: #333; }
    #join { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    #chat { display: none; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
    #messages { height: 500px; overflow-y: auto; padding: 20px; border-bottom: 1px solid #eee; }
    .message { margin-bottom: 15px; }
    .message.system { text-align: center; color: #999; font-style: italic; }
    .message .username { font-weight: bold; color: #0066cc; }
    .message .timestamp { font-size: 0.8em; color: #999; margin-left: 8px; }
    #input-area { display: flex; padding: 15px; background: #f9f9f9; }
    #messageInput { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
    button { padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; margin-left: 10px; }
    button:hover { background: #0052a3; }
    input { width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
    #users { padding: 10px 20px; background: #f9f9f9; border-bottom: 1px solid #eee; font-size: 0.9em; color: #666; }
  </style>
</head>
<body>
  <div id="container">
    <h1>💬 WebSocket Chat</h1>
    
    <div id="join">
      <h2>Join Chat</h2>
      <input id="usernameInput" placeholder="Enter your username" maxlength="20">
      <button onclick="join()">Join</button>
    </div>

    <div id="chat">
      <div id="users">Online: <span id="userList"></span></div>
      <div id="messages"></div>
      <div id="input-area">
        <input id="messageInput" placeholder="Type a message..." maxlength="500">
        <button onclick="send()">Send</button>
      </div>
    </div>
  </div>

  <script>
    let ws;
    let username;

    function join() {
      username = document.getElementById('usernameInput').value.trim();
      if (!username) return alert('Please enter a username');

      ws = new WebSocket('ws://' + location.host);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'join', username }));
        document.getElementById('join').style.display = 'none';
        document.getElementById('chat').style.display = 'block';
        document.getElementById('messageInput').focus();
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'joined') {
          updateUserList(data.users);
        } else if (data.type === 'message') {
          addMessage(data.username, data.message, data.timestamp);
        } else if (data.type === 'system') {
          addSystemMessage(data.message);
        }
      };

      ws.onclose = () => {
        addSystemMessage('Disconnected from server');
      };

      ws.onerror = () => {
        alert('Connection error');
      };
    }

    function send() {
      const input = document.getElementById('messageInput');
      const message = input.value.trim();
      if (!message || !ws) return;

      ws.send(JSON.stringify({ type: 'message', message }));
      input.value = '';
      input.focus();
    }

    function addMessage(user, message, timestamp) {
      const div = document.createElement('div');
      div.className = 'message';
      const time = new Date(timestamp).toLocaleTimeString();
      div.innerHTML = \`<span class="username">\${user}:</span> \${message} <span class="timestamp">\${time}</span>\`;
      document.getElementById('messages').appendChild(div);
      scrollToBottom();
    }

    function addSystemMessage(message) {
      const div = document.createElement('div');
      div.className = 'message system';
      div.textContent = message;
      document.getElementById('messages').appendChild(div);
      scrollToBottom();
    }

    function updateUserList(users) {
      document.getElementById('userList').textContent = users.join(', ');
    }

    function scrollToBottom() {
      const messages = document.getElementById('messages');
      messages.scrollTop = messages.scrollHeight;
    }

    document.getElementById('messageInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') send();
    });

    document.getElementById('usernameInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') join();
    });
  </script>
</body>
</html>`;
  }
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  ChatServer,
  createAcceptKey,
  parseFrame,
  createFrame,
};

// ─── Point d'entrée ──────────────────────────────────────────

if (require.main === module) {
  const server = new ChatServer();
  server.start(8080);
}