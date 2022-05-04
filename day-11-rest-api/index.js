'use strict';

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

/**
 * ============================================================
 * DAY 11 — REST API Server (CRUD Operations)
 * ============================================================
 * Algorithme  : HTTP Request Routing + JSON CRUD
 * Complexité  : O(1) per request, O(n) for GET all
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── Configuration ───────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// ─── Base de données ─────────────────────────────────────────

class Database {
  constructor(filepath) {
    this.filepath = filepath;
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filepath)) {
        const content = fs.readFileSync(this.filepath, 'utf8');
        return JSON.parse(content);
      }
    } catch (err) {
      console.error('Erreur chargement DB:', err.message);
    }
    return { items: [], nextId: 1 };
  }

  save() {
    try {
      fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error('Erreur sauvegarde DB:', err.message);
    }
  }

  getAll() {
    return this.data.items;
  }

  getById(id) {
    return this.data.items.find(item => item.id === id);
  }

  create(item) {
    const newItem = {
      id: this.data.nextId++,
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.items.push(newItem);
    this.save();
    return newItem;
  }

  update(id, updates) {
    const index = this.data.items.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.data.items[index] = {
      ...this.data.items[index],
      ...updates,
      id, // Ne pas modifier l'ID
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.items[index];
  }

  delete(id) {
    const index = this.data.items.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.data.items.splice(index, 1);
    this.save();
    return true;
  }

  search(query) {
    const searchTerm = query.toLowerCase();
    return this.data.items.filter(item => {
      return JSON.stringify(item).toLowerCase().includes(searchTerm);
    });
  }

  clear() {
    this.data.items = [];
    this.data.nextId = 1;
    this.save();
  }
}

// ─── Utilitaires HTTP ────────────────────────────────────────

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data, null, 2));
}

function sendError(res, statusCode, message) {
  sendJSON(res, statusCode, { error: message });
}

// ─── Router ──────────────────────────────────────────────────

class Router {
  constructor() {
    this.routes = [];
  }

  add(method, pattern, handler) {
    this.routes.push({ method, pattern, handler });
  }

  get(pattern, handler) {
    this.add('GET', pattern, handler);
  }

  post(pattern, handler) {
    this.add('POST', pattern, handler);
  }

  put(pattern, handler) {
    this.add('PUT', pattern, handler);
  }

  delete(pattern, handler) {
    this.add('DELETE', pattern, handler);
  }

  match(method, pathname) {
    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = pathname.match(route.pattern);
      if (match) {
        return { handler: route.handler, params: match.slice(1) };
      }
    }
    return null;
  }
}

// ─── API Server ──────────────────────────────────────────────

class APIServer {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.router = new Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // GET /items - Liste tous les items
    this.router.get(/^\/items\/?$/, async (req, res, params, query) => {
      const items = this.db.getAll();
      
      // Filtrage optionnel
      if (query.search) {
        const filtered = this.db.search(query.search);
        return sendJSON(res, 200, { items: filtered, total: filtered.length });
      }

      sendJSON(res, 200, { items, total: items.length });
    });

    // GET /items/:id - Récupère un item
    this.router.get(/^\/items\/(\d+)\/?$/, async (req, res, params) => {
      const id = parseInt(params[0], 10);
      const item = this.db.getById(id);

      if (!item) {
        return sendError(res, 404, 'Item not found');
      }

      sendJSON(res, 200, item);
    });

    // POST /items - Crée un item
    this.router.post(/^\/items\/?$/, async (req, res) => {
      try {
        const body = await parseBody(req);
        
        if (!body.name) {
          return sendError(res, 400, 'Name is required');
        }

        const item = this.db.create(body);
        sendJSON(res, 201, item);
      } catch (err) {
        sendError(res, 400, err.message);
      }
    });

    // PUT /items/:id - Met à jour un item
    this.router.put(/^\/items\/(\d+)\/?$/, async (req, res, params) => {
      try {
        const id = parseInt(params[0], 10);
        const body = await parseBody(req);

        const updated = this.db.update(id, body);

        if (!updated) {
          return sendError(res, 404, 'Item not found');
        }

        sendJSON(res, 200, updated);
      } catch (err) {
        sendError(res, 400, err.message);
      }
    });

    // DELETE /items/:id - Supprime un item
    this.router.delete(/^\/items\/(\d+)\/?$/, async (req, res, params) => {
      const id = parseInt(params[0], 10);
      const deleted = this.db.delete(id);

      if (!deleted) {
        return sendError(res, 404, 'Item not found');
      }

      sendJSON(res, 200, { message: 'Item deleted', id });
    });

    // GET /health - Health check
    this.router.get(/^\/health\/?$/, async (req, res) => {
      sendJSON(res, 200, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        itemCount: this.db.getAll().length,
      });
    });
  }

  async handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      return res.end();
    }

    // Logging
    console.log(`${req.method} ${pathname}`);

    // Routing
    const match = this.router.match(req.method, pathname);

    if (!match) {
      return sendError(res, 404, 'Route not found');
    }

    try {
      await match.handler(req, res, match.params, query);
    } catch (err) {
      console.error('Error:', err);
      sendError(res, 500, 'Internal server error');
    }
  }

  start(port = PORT) {
    const server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    server.listen(port, () => {
      console.log(`\n🚀 REST API Server running on http://localhost:${port}`);
      console.log(`\nEndpoints:`);
      console.log(`  GET    /items        - List all items`);
      console.log(`  GET    /items/:id    - Get item by ID`);
      console.log(`  POST   /items        - Create new item`);
      console.log(`  PUT    /items/:id    - Update item`);
      console.log(`  DELETE /items/:id    - Delete item`);
      console.log(`  GET    /health       - Health check`);
      console.log(`\nDatabase: ${this.db.filepath}`);
      console.log(`\nPress Ctrl+C to stop\n`);
    });

    return server;
  }
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  APIServer,
  Database,
  Router,
  parseBody,
  sendJSON,
  sendError,
};

// ─── Point d'entrée ──────────────────────────────────────────

if (require.main === module) {
  const server = new APIServer(DB_FILE);
  server.start();
}