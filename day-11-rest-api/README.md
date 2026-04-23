# 🚀 Day 11 — REST API Server

> **30 Days of Pure Scripting** · Semaine 3 : Réseautage et API · Jour 1/5

## 🎯 Problème

Créer un serveur API REST complet avec opérations CRUD (Create, Read, Update, Delete).

## ⚡ Fonctionnalités

- ✅ **CRUD complet** : GET, POST, PUT, DELETE
- ✅ **Routing avec regex** : Pattern matching pour URLs
- ✅ **Persistence JSON** : Base de données fichier
- ✅ **Auto-increment IDs** : Génération automatique
- ✅ **Timestamps** : createdAt, updatedAt
- ✅ **Search** : Recherche dans tous les champs
- ✅ **CORS** : Cross-Origin Resource Sharing
- ✅ **Health check** : Endpoint de monitoring

## 🚀 Démarrage rapide

```bash
# Démarrer le serveur
node index.js

# Serveur écoute sur http://localhost:3000
```

## 📡 Endpoints

### GET /items
Liste tous les items

```bash
curl http://localhost:3000/items

# Avec recherche
curl http://localhost:3000/items?search=laptop
```

**Réponse :**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Laptop",
      "price": 999,
      "createdAt": "2025-02-27T...",
      "updatedAt": "2025-02-27T..."
    }
  ],
  "total": 1
}
```

### GET /items/:id
Récupère un item par ID

```bash
curl http://localhost:3000/items/1
```

### POST /items
Crée un nouvel item

```bash
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Laptop", "price": 999}'
```

**Réponse :** Status 201
```json
{
  "id": 1,
  "name": "Laptop",
  "price": 999,
  "createdAt": "2025-02-27T10:00:00.000Z",
  "updatedAt": "2025-02-27T10:00:00.000Z"
}
```

### PUT /items/:id
Met à jour un item

```bash
curl -X PUT http://localhost:3000/items/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 899}'
```

### DELETE /items/:id
Supprime un item

```bash
curl -X DELETE http://localhost:3000/items/1
```

**Réponse :**
```json
{
  "message": "Item deleted",
  "id": 1
}
```

### GET /health
Health check

```bash
curl http://localhost:3000/health
```

**Réponse :**
```json
{
  "status": "ok",
  "timestamp": "2025-02-27T10:00:00.000Z",
  "itemCount": 5
}
```

## 🏗️ Architecture

```
REST API Server
├── Router (pattern matching)
├── Database (JSON persistence)
│   ├── CRUD operations
│   ├── Auto-increment IDs
│   └── Search
├── HTTP Handlers
│   ├── parseBody()
│   ├── sendJSON()
│   └── sendError()
└── CORS support
```

## 📊 API en action

```javascript
const { APIServer } = require('./index');

const server = new APIServer('./db.json');
server.start(3000);
```

## 🔧 Utilisation programmatique

```javascript
const { Database } = require('./index');

const db = new Database('./my-db.json');

// Create
const item = db.create({ name: 'Laptop', price: 999 });

// Read
const all = db.getAll();
const one = db.getById(1);

// Update
db.update(1, { price: 899 });

// Delete
db.delete(1);

// Search
const results = db.search('laptop');
```

## 🎯 Concepts clés

### 1. HTTP Server natif
```javascript
const server = http.createServer((req, res) => {
  // Handle request
});
server.listen(3000);
```

### 2. Routing avec Regex
```javascript
/^\/items\/(\d+)\/?$/  // Match /items/123
```

### 3. JSON Body Parsing
```javascript
req.on('data', chunk => body += chunk);
req.on('end', () => JSON.parse(body));
```

### 4. CORS Headers
```javascript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
```

### 5. RESTful Design
- **GET** : Récupération (idempotent)
- **POST** : Création (non-idempotent)
- **PUT** : Mise à jour complète (idempotent)
- **DELETE** : Suppression (idempotent)

## 🌟 Points forts

- ✅ **Zéro dépendance** : http, fs natifs
- ✅ **Persistence** : Fichier JSON auto-sauvegardé
- ✅ **Pattern matching** : Regex pour routes dynamiques
- ✅ **Auto-increment** : IDs gérés automatiquement
- ✅ **Timestamps** : createdAt et updatedAt
- ✅ **Error handling** : Status codes HTTP corrects

## 📁 Structure

```
day-11-rest-api/
├── index.js       ← Serveur API + Database + Router
├── db.json        ← Base de données (auto-créé)
├── package.json
└── README.md
```

## 🔗 Suite du challenge

| ← Précédent      | Jour actuel          | Suivant →         |
|------------------|----------------------|-------------------|
| 10 · Log Analyzer | **11 · REST API**   | 12 · WebSocket    |

---

**Semaine 3 commencée ! · 11/30 jours**

*"REST is not a protocol, it's an architectural style."* — Roy Fielding