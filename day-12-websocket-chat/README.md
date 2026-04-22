# 💬 Day 12 — WebSocket Chat

> **30 Days of Pure Scripting** · Semaine 3 : Réseautage et API · Jour 2/5

## 🎯 Problème

Créer un serveur de chat en temps réel avec WebSocket pour communication bidirectionnelle.

## ⚡ Fonctionnalités

- ✅ **WebSocket natif** : Protocole implémenté from scratch
- ✅ **Chat temps réel** : Messages instantanés
- ✅ **Multi-utilisateurs** : Support illimité de clients
- ✅ **Historique** : 100 derniers messages sauvegardés
- ✅ **Liste utilisateurs** : Qui est en ligne
- ✅ **Messages système** : Join/leave notifications
- ✅ **Client HTML** : Interface web incluse
- ✅ **Broadcast** : Tous les clients reçoivent les messages

## 🚀 Démarrage rapide

```bash
# Démarrer le serveur
node index.js

# Serveur écoute sur http://localhost:8080
```

Ouvrez **http://localhost:8080** dans plusieurs onglets/navigateurs pour tester le chat !

## 📡 Protocole WebSocket

### Handshake (Upgrade HTTP → WebSocket)

**Client → Server :**
```
GET / HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

**Server → Client :**
```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

Le `Sec-WebSocket-Accept` est calculé :
```javascript
SHA1(Sec-WebSocket-Key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
```

### Format des frames

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+
```

**Opcodes :**
- `0x00` : Continuation
- `0x01` : Text
- `0x02` : Binary
- `0x08` : Close
- `0x09` : Ping
- `0x0A` : Pong

## 🏗️ Architecture

```
ChatServer
├── WebSocket Protocol
│   ├── Handshake (HTTP upgrade)
│   ├── Frame parsing (masking, opcodes)
│   └── Frame creation
├── Client Management
│   ├── Connection tracking
│   ├── Username mapping
│   └── Buffer handling
├── Message Handling
│   ├── Join/Leave events
│   ├── Chat messages
│   └── System messages
├── Broadcast
│   └── Send to all clients
└── History
    └── Last 100 messages
```

## 📨 Format des messages

### Client → Server

**Join :**
```json
{
  "type": "join",
  "username": "Alice"
}
```

**Message :**
```json
{
  "type": "message",
  "message": "Hello everyone!"
}
```

### Server → Client

**Joined confirmation :**
```json
{
  "type": "joined",
  "username": "Alice",
  "users": ["Alice", "Bob", "Carol"]
}
```

**Chat message :**
```json
{
  "type": "message",
  "username": "Alice",
  "message": "Hello everyone!",
  "timestamp": "2025-02-27T10:00:00.000Z"
}
```

**System message :**
```json
{
  "type": "system",
  "message": "Bob joined the chat",
  "timestamp": "2025-02-27T10:00:00.000Z"
}
```

## 🎯 Concepts clés

### 1. WebSocket Handshake

Le serveur doit calculer `Sec-WebSocket-Accept` :

```javascript
const WS_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function createAcceptKey(key) {
  return crypto
    .createHash('sha1')
    .update(key + WS_MAGIC_STRING)
    .digest('base64');
}
```

### 2. Frame Parsing

Les données client sont **maskées** (XOR avec clé 4 bytes) :

```javascript
if (masked) {
  payload = Buffer.from(
    payload.map((byte, i) => byte ^ maskKey[i % 4])
  );
}
```

### 3. Broadcast Pattern

Envoyer à tous les clients connectés :

```javascript
broadcast(data) {
  for (const [clientId] of this.clients) {
    this.sendToClient(clientId, data);
  }
}
```

### 4. Buffer Accumulation

Les frames peuvent arriver en plusieurs chunks :

```javascript
client.buffer = Buffer.concat([client.buffer, data]);

while (client.buffer.length > 0) {
  const frame = parseFrame(client.buffer);
  // Process frame
  client.buffer = client.buffer.slice(frame.length);
}
```

### 5. Client HTML intégré

Le serveur sert un client HTML complet :

```javascript
server.on('request', (req, res) => {
  if (req.url === '/') {
    res.end(this.getClientHTML());
  }
});
```

## 🌟 Points forts

- ✅ **Zéro dépendance** : WebSocket from scratch
- ✅ **Protocol complet** : Handshake + frames + masking
- ✅ **Broadcast efficace** : O(n) pour n clients
- ✅ **Historique** : Nouveaux clients voient messages récents
- ✅ **Client intégré** : HTML/CSS/JS inclus
- ✅ **Production-ready** : Gestion erreurs, déconnexions

## 📊 Performance

| Opération | Complexité | Notes |
|-----------|------------|-------|
| Send to one | **O(1)** | Direct socket write |
| Broadcast | **O(n)** | n = nombre de clients |
| Parse frame | **O(1)** | Démasquage XOR |
| History | **O(1)** | Array access |

## 📁 Structure

```
day-12-websocket-chat/
├── index.js       ← Serveur + Client HTML
├── package.json
└── README.md
```

## 🔗 Suite du challenge

| ← Précédent    | Jour actuel           | Suivant →       |
|----------------|-----------------------|-----------------|
| 11 · REST API  | **12 · WebSocket**    | 13 · Email      |

---

**Semaine 3 : 2/5 jours · 12/30 total**

*"WebSocket is like having a phone conversation instead of sending letters."* — Unknown