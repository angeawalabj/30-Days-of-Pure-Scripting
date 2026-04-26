# ☁️ Day 16 — Weather + Auth + Webhooks (MEGA COMBO)

> **30 Days of Pure Scripting** · Semaine 4 : Projets Avancés · **PROJET ULTIME**

## 🎯 Triple Combo

Ce projet combine **3 systèmes essentiels** en un seul :

1. **☁️ Weather Reporter** : Données météo temps réel
2. **🔐 JWT Authentication** : Système de login sécurisé
3. **🤖 Webhook Bot** : Notifications Discord/Slack/Telegram

## ⚡ Fonctionnalités

### JWT Authentication
- ✅ **Register/Login** : Système complet
- ✅ **Token signing** : HMAC SHA-256
- ✅ **Token verification** : Signature + expiration
- ✅ **Base64URL encoding** : RFC 7519 compliant
- ✅ **Password hashing** : SHA-256
- ✅ **Token expiration** : Configurable (24h default)

### Weather API
- ✅ **Real-time data** : API wttr.in (gratuite)
- ✅ **Multi-city** : N'importe quelle ville
- ✅ **Cache 10min** : Évite requêtes répétées
- ✅ **Rich data** : Temp, humidity, wind, UV
- ✅ **Formatted messages** : Prêt pour webhooks

### Webhook Notifications
- ✅ **3 platforms** : Discord, Slack, Telegram
- ✅ **Auto-formatting** : Par platform
- ✅ **Weather alerts** : Notifications automatiques
- ✅ **Per-user config** : Chaque user ses webhooks

## 🚀 Démarrage

```bash
node index.js

# Ouvrir http://localhost:3000
```

## 📡 API Flow

### 1. Register
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "secret123", "email": "alice@example.com"}'

# Réponse:
{
  "user": {
    "id": "abc123...",
    "username": "alice",
    "email": "alice@example.com",
    "createdAt": "2025-02-27T..."
  }
}
```

### 2. Login (Get JWT)
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "secret123"}'

# Réponse:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

### 3. Configure Webhook
```bash
curl -X PUT http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "platform": "discord",
    "url": "https://discord.com/api/webhooks/..."
  }'
```

### 4. Get Weather (avec notification)
```bash
curl -X POST http://localhost:3000/api/weather \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"city": "Paris", "notify": true}'

# Réponse:
{
  "city": "Paris",
  "temperature": {
    "current": 15,
    "feelsLike": 13,
    "min": 10,
    "max": 18
  },
  "condition": "Partly cloudy",
  "humidity": 65,
  "windSpeed": 20,
  "uvIndex": 3,
  "notifications": [
    {"platform": "discord", "success": true}
  ]
}
```

## 🔐 JWT Token Structure

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhYmMxMjMiLCJ1c2VybmFtZSI6ImFsaWNlIiwiaWF0IjoxNzA5MDQwMDAwLCJleHAiOjE3MDkxMjY0MDB9.signature

├── Header (base64url)
│   {"alg": "HS256", "typ": "JWT"}
│
├── Payload (base64url)
│   {
│     "userId": "abc123",
│     "username": "alice",
│     "iat": 1709040000,  // Issued at
│     "exp": 1709126400   // Expires at
│   }
│
└── Signature (HMAC SHA-256)
    HMAC-SHA256(header + payload, secret)
```

## 🎯 Concepts Clés

### 1. JWT Signature
```javascript
const signature = crypto
  .createHmac('sha256', SECRET)
  .update(header + '.' + payload)
  .digest('base64url');
```

### 2. Base64URL Encoding
```javascript
// Standard Base64 → Base64URL
str.replace(/\+/g, '-')
   .replace(/\//g, '_')
   .replace(/=/g, '');
```

### 3. Token Expiration
```javascript
const exp = Math.floor((Date.now() + expiryMs) / 1000);
if (payload.exp < Math.floor(Date.now() / 1000)) {
  throw new Error('Token expired');
}
```

### 4. Weather API Integration
```javascript
// wttr.in API (gratuite, pas de clé)
const url = `https://wttr.in/${city}?format=j1`;
```

### 5. Webhook Formatting
```javascript
// Discord
{ content: "Message" }

// Slack
{ text: "Message" }

// Telegram (via bot API)
{ text: "Message" }
```

## 🌟 Cas d'Usage

### 1. Notifications météo quotidiennes
```javascript
const cron = require('node-cron');

// Tous les jours à 7h
cron.schedule('0 7 * * *', async () => {
  const weather = await weatherAPI.getWeather('Paris');
  const message = weatherAPI.formatMessage(weather);
  await notifier.send(webhookUrl, message, 'discord');
});
```

### 2. Alertes conditions extrêmes
```javascript
const weather = await weatherAPI.getWeather(city);

if (weather.temperature.current > 35) {
  await notifier.send(webhookUrl, '🔥 Heat alert!', 'slack');
}

if (weather.condition.toLowerCase().includes('storm')) {
  await notifier.send(webhookUrl, '⛈️ Storm warning!', 'telegram');
}
```

### 3. Dashboard multi-villes
```javascript
const cities = ['Paris', 'London', 'Tokyo', 'New York'];

for (const city of cities) {
  const weather = await weatherAPI.getWeather(city);
  console.log(`${city}: ${weather.temperature.current}°C`);
}
```

## 📊 Architecture

```
WeatherAuthServer
├── JWTAuth
│   ├── sign() - Créer token
│   ├── verify() - Vérifier token
│   ├── base64urlEncode/Decode
│   └── HMAC SHA-256 signature
├── UserManager
│   ├── register() - Nouveau user
│   ├── login() - Authentification
│   ├── Password hashing (SHA-256)
│   └── Webhook storage
├── WeatherAPI
│   ├── getWeather() - Fetch data
│   ├── parseWeatherData()
│   ├── formatMessage()
│   └── 10min cache
└── WebhookNotifier
    ├── send() - HTTPS POST
    └── formatPayload() - Par platform
```

## 🎉 Stats Projet

- **3 systèmes intégrés** : Auth + Weather + Webhooks
- **Zéro dépendance** : Tout from scratch
- **JWT RFC 7519** : Compliant
- **Multi-platform** : Discord, Slack, Telegram
- **Production-ready** : Cache, error handling, security

## 🔗 Créer Webhooks

### Discord
1. Server Settings → Integrations → Webhooks
2. Create Webhook
3. Copy URL: `https://discord.com/api/webhooks/...`

### Slack
1. Create Slack App
2. Incoming Webhooks → Add to Workspace
3. Copy URL: `https://hooks.slack.com/services/...`

### Telegram
1. Create bot avec @BotFather
2. Get chat ID
3. URL: `https://api.telegram.org/bot<TOKEN>/sendMessage`

---

**Semaine 4 commencée ! · 16/30 jours · 53% complet**

*"The cloud is just someone else's computer... until you build your own."* — Unknown