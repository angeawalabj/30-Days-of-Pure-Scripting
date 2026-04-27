# 🔗 Day 15 — URL Shortener + Link Checker (COMBO)

> **30 Days of Pure Scripting** · Semaine 3 : Réseautage et API · **FINALE**

## 🎯 Projet Combo Unique

Ce projet combine **deux outils essentiels du web** :
1. **URL Shortener** : Raccourcit les URLs longues
2. **Link Checker** : Vérifie si les liens sont vivants ou morts

## ⚡ Fonctionnalités

### URL Shortener
- ✅ **Hash-based codes** : Déterministes (même URL = même code)
- ✅ **Custom codes** : Choisir son propre code
- ✅ **Click tracking** : Nombre de clics par URL
- ✅ **Stats complètes** : Date création, dernier accès
- ✅ **JSON persistence** : Sauvegarde automatique
- ✅ **Gestion collisions** : Détecte codes existants

### Link Checker
- ✅ **HTTP HEAD requests** : Rapide et léger
- ✅ **Status detection** : 200-399 = alive, sinon = dead
- ✅ **Redirect following** : Suit les 301/302
- ✅ **Bulk checking** : Vérifie plusieurs URLs d'un coup
- ✅ **Response time** : Mesure latence
- ✅ **Cache 5min** : Évite requêtes répétées
- ✅ **Timeout handling** : 5s max par URL

## 🚀 Démarrage

```bash
node index.js

# Ouvrir http://localhost:3000
```

## 📡 API Endpoints

### Shorten URL
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://very-long-url.com/path"}'

# Réponse:
{
  "code": "abc123",
  "url": "http://localhost:3000/abc123",
  "exists": false
}
```

### List All URLs
```bash
curl http://localhost:3000/api/list

# Réponse:
{
  "urls": [
    {
      "code": "abc123",
      "longUrl": "https://...",
      "clicks": 42,
      "createdAt": "2025-02-27T...",
      "lastAccess": "2025-02-27T..."
    }
  ],
  "total": 1
}
```

### Check Single Link
```bash
curl -X POST http://localhost:3000/api/check \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Réponse:
{
  "url": "https://example.com",
  "status": 200,
  "statusText": "OK",
  "alive": true,
  "responseTime": 234
}
```

### Check Multiple Links
```bash
curl -X POST http://localhost:3000/api/check \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com", "https://dead-link.com"]}'

# Réponse:
{
  "total": 2,
  "alive": 1,
  "dead": 1,
  "results": [...]
}
```

### Get Stats
```bash
curl http://localhost:3000/api/stats/abc123
```

### Delete URL
```bash
curl -X DELETE http://localhost:3000/api/delete/abc123
```

## 🏗️ Architecture

```
URLShortenerServer
├── URLDatabase
│   ├── Hash-based generation (MD5)
│   ├── Custom codes support
│   ├── Click tracking
│   └── JSON persistence
├── LinkChecker
│   ├── HTTP HEAD requests
│   ├── Status code analysis
│   ├── Redirect following
│   ├── Response time measurement
│   └── 5-minute cache
└── HTTP Server
    ├── Redirect handler (302)
    ├── API routes
    └── Client HTML
```

## 🎯 Algorithmes

### 1. Hash-based Shortening
```javascript
// Déterministe : même URL = même code
const hash = crypto.createHash('md5').update(url).digest('hex');
const code = hash.substring(0, 6); // abc123
```

**Avantages** :
- Pas de duplicatas
- O(1) lookup
- Codes prévisibles

### 2. Link Checking (HTTP HEAD)
```javascript
// HEAD = comme GET mais sans body
http.request({ method: 'HEAD' }, (res) => {
  const alive = res.statusCode >= 200 && res.statusCode < 400;
});
```

**Pourquoi HEAD ?**
- 10-100x plus rapide que GET
- Pas de téléchargement du contenu
- Juste les headers (status, redirect, etc.)

### 3. Cache avec expiration
```javascript
cache.set(url, {
  result,
  timestamp: Date.now()
});

// Vérifier expiration
if (Date.now() - cached.timestamp < 300000) {
  return cached.result; // Cache hit
}
```

## 🌟 Cas d'usage

### 1. Raccourcir URLs marketing
```javascript
const { URLDatabase } = require('./index');
const db = new URLDatabase('./urls.json');

const result = db.shorten(
  'https://example.com/campaign/summer-2025/discount?utm_source=email',
  'summer25'
);
// → http://localhost:3000/summer25
```

### 2. Vérifier liens d'un site
```javascript
const { LinkChecker } = require('./index');
const checker = new LinkChecker();

const links = [
  'https://example.com/page1',
  'https://example.com/page2',
  'https://example.com/broken'
];

const results = await checker.checkMultiple(links);
console.log(`Dead links: ${results.dead}`);
```

### 3. Monitoring automatique
```javascript
setInterval(async () => {
  const db = new URLDatabase('./urls.json');
  const checker = new LinkChecker();
  
  for (const [code, data] of Object.entries(db.data)) {
    const check = await checker.check(data.longUrl);
    if (!check.alive) {
      console.log(`❌ Dead link detected: ${code} → ${data.longUrl}`);
    }
  }
}, 3600000); // Toutes les heures
```

## 📊 Performance

| Opération | Complexité | Temps |
|-----------|------------|-------|
| Shorten | O(1) | < 1ms |
| Resolve | O(1) | < 1ms |
| Check link | O(1) | 50-500ms |
| Check bulk (n) | O(n) | n × 50-500ms |

## 🎉 Semaine 3 Complétée !

**15 jours · 50% du Challenge · 3 semaines sur 4 ✅**

### Projets Semaine 3 :
1. REST API Server
2. WebSocket Chat
3. Email Client (SMTP)
4. FTP Client
5. **URL Shortener + Link Checker** ✨

---

**PROCHAINE ÉTAPE : Semaine 4 - Projets Avancés**

*"Short links, long results."* — Unknown