'use strict';

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * ============================================================
 * DAY 15 — URL Shortener + Link Checker (COMBO)
 * ============================================================
 * Algorithme  : Hash-based shortening + HTTP HEAD checking
 * Complexité  : O(1) lookup, O(n) link checking
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── Configuration ───────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'urls.json');
const STATS_FILE = path.join(__dirname, 'stats.json');
const BASE_URL = `http://localhost:${PORT}`;

// ─── Database ────────────────────────────────────────────────

class URLDatabase {
  constructor(filepath) {
    this.filepath = filepath;
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filepath)) {
        return JSON.parse(fs.readFileSync(this.filepath, 'utf8'));
      }
    } catch (err) {
      console.error('Erreur chargement DB:', err.message);
    }
    return {};
  }

  save() {
    fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, 2));
  }

  generateShortCode(url, length = 6) {
    // Hash-based generation for deterministic codes
    const hash = crypto.createHash('md5').update(url).digest('hex');
    return hash.substring(0, length);
  }

  shorten(longUrl, customCode = null) {
    // Vérifier si déjà raccourci
    for (const [code, data] of Object.entries(this.data)) {
      if (data.longUrl === longUrl) {
        return { code, url: `${BASE_URL}/${code}`, exists: true };
      }
    }

    const code = customCode || this.generateShortCode(longUrl);

    if (this.data[code]) {
      throw new Error('Code already exists');
    }

    this.data[code] = {
      longUrl,
      createdAt: new Date().toISOString(),
      clicks: 0,
      lastAccess: null,
    };

    this.save();
    return { code, url: `${BASE_URL}/${code}`, exists: false };
  }

  resolve(code) {
    const entry = this.data[code];
    if (!entry) return null;

    entry.clicks++;
    entry.lastAccess = new Date().toISOString();
    this.save();

    return entry.longUrl;
  }

  getStats(code) {
    return this.data[code] || null;
  }

  list() {
    return Object.entries(this.data).map(([code, data]) => ({
      code,
      ...data,
      shortUrl: `${BASE_URL}/${code}`,
    }));
  }

  delete(code) {
    if (!this.data[code]) return false;
    delete this.data[code];
    this.save();
    return true;
  }
}

// ─── Link Checker ────────────────────────────────────────────

class LinkChecker {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 300000; // 5 minutes
  }

  async check(targetUrl, options = {}) {
    const { timeout = 5000, followRedirects = true } = options;

    // Vérifier cache
    const cached = this.cache.get(targetUrl);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    return new Promise((resolve) => {
      const parsedUrl = url.parse(targetUrl);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const req = client.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: 'HEAD',
        timeout,
      }, (res) => {
        const result = {
          url: targetUrl,
          status: res.statusCode,
          statusText: res.statusMessage,
          alive: res.statusCode >= 200 && res.statusCode < 400,
          redirect: res.statusCode >= 300 && res.statusCode < 400 ? res.headers.location : null,
          responseTime: Date.now() - startTime,
        };

        // Suivre redirections
        if (followRedirects && result.redirect) {
          const redirectUrl = new URL(result.redirect, targetUrl).href;
          this.check(redirectUrl, { ...options, followRedirects: false })
            .then(redirectResult => {
              result.finalUrl = redirectUrl;
              result.finalStatus = redirectResult.status;
              this.cacheResult(targetUrl, result);
              resolve(result);
            });
        } else {
          this.cacheResult(targetUrl, result);
          resolve(result);
        }
      });

      const startTime = Date.now();

      req.on('error', (err) => {
        const result = {
          url: targetUrl,
          status: 0,
          statusText: err.message,
          alive: false,
          error: err.message,
          responseTime: Date.now() - startTime,
        };
        this.cacheResult(targetUrl, result);
        resolve(result);
      });

      req.on('timeout', () => {
        req.destroy();
        const result = {
          url: targetUrl,
          status: 0,
          statusText: 'Timeout',
          alive: false,
          error: 'Request timeout',
          responseTime: timeout,
        };
        this.cacheResult(targetUrl, result);
        resolve(result);
      });

      req.end();
    });
  }

  cacheResult(url, result) {
    this.cache.set(url, {
      result,
      timestamp: Date.now(),
    });
  }

  async checkMultiple(urls, options = {}) {
    const results = [];
    
    for (const targetUrl of urls) {
      const result = await this.check(targetUrl, options);
      results.push(result);
    }

    return {
      total: results.length,
      alive: results.filter(r => r.alive).length,
      dead: results.filter(r => !r.alive).length,
      results,
    };
  }

  async scanHTML(html, baseUrl) {
    const links = this.extractLinks(html, baseUrl);
    return this.checkMultiple(links);
  }

  extractLinks(html, baseUrl) {
    const regex = /href=["']([^"']+)["']/gi;
    const links = new Set();
    let match;

    while ((match = regex.exec(html)) !== null) {
      try {
        const href = match[1];
        if (href.startsWith('#') || href.startsWith('javascript:')) continue;
        
        const absoluteUrl = new URL(href, baseUrl).href;
        if (absoluteUrl.startsWith('http')) {
          links.add(absoluteUrl);
        }
      } catch (err) {
        // Invalid URL, skip
      }
    }

    return Array.from(links);
  }
}

// ─── Server ──────────────────────────────────────────────────

class URLShortenerServer {
  constructor() {
    this.db = new URLDatabase(DB_FILE);
    this.checker = new LinkChecker();
  }

  async handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      return res.end();
    }

    // Routes
    if (pathname === '/' && req.method === 'GET') {
      return this.serveHTML(res);
    }

    if (pathname === '/api/shorten' && req.method === 'POST') {
      return this.handleShorten(req, res);
    }

    if (pathname === '/api/list' && req.method === 'GET') {
      return this.handleList(res);
    }

    if (pathname === '/api/check' && req.method === 'POST') {
      return this.handleCheck(req, res);
    }

    if (pathname.startsWith('/api/stats/')) {
      return this.handleStats(pathname, res);
    }

    if (pathname.startsWith('/api/delete/')) {
      return this.handleDelete(pathname, res);
    }

    // Redirection
    if (pathname.length > 1) {
      return this.handleRedirect(pathname.substring(1), res);
    }

    res.writeHead(404);
    res.end('Not Found');
  }

  async handleShorten(req, res) {
    try {
      const body = await this.parseBody(req);
      const { url: longUrl, custom } = body;

      if (!longUrl) {
        return this.sendJSON(res, 400, { error: 'URL required' });
      }

      // Vérifier que l'URL est valide
      try {
        new URL(longUrl);
      } catch (err) {
        return this.sendJSON(res, 400, { error: 'Invalid URL' });
      }

      const result = this.db.shorten(longUrl, custom);
      this.sendJSON(res, 201, result);
    } catch (err) {
      this.sendJSON(res, 400, { error: err.message });
    }
  }

  handleList(res) {
    const urls = this.db.list();
    this.sendJSON(res, 200, { urls, total: urls.length });
  }

  async handleCheck(req, res) {
    try {
      const body = await this.parseBody(req);
      const { url: targetUrl, urls } = body;

      if (targetUrl) {
        const result = await this.checker.check(targetUrl);
        return this.sendJSON(res, 200, result);
      }

      if (urls && Array.isArray(urls)) {
        const results = await this.checker.checkMultiple(urls);
        return this.sendJSON(res, 200, results);
      }

      this.sendJSON(res, 400, { error: 'url or urls required' });
    } catch (err) {
      this.sendJSON(res, 400, { error: err.message });
    }
  }

  handleStats(pathname, res) {
    const code = pathname.split('/').pop();
    const stats = this.db.getStats(code);

    if (!stats) {
      return this.sendJSON(res, 404, { error: 'Not found' });
    }

    this.sendJSON(res, 200, { code, ...stats });
  }

  handleDelete(pathname, res) {
    const code = pathname.split('/').pop();
    const deleted = this.db.delete(code);

    if (!deleted) {
      return this.sendJSON(res, 404, { error: 'Not found' });
    }

    this.sendJSON(res, 200, { message: 'Deleted', code });
  }

  handleRedirect(code, res) {
    const longUrl = this.db.resolve(code);

    if (!longUrl) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      return res.end('<h1>404 - Short URL not found</h1>');
    }

    res.writeHead(302, { Location: longUrl });
    res.end();
  }

  parseBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (err) {
          reject(new Error('Invalid JSON'));
        }
      });
    });
  }

  sendJSON(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  serveHTML(res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(this.getHTML());
  }

  getHTML() {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>URL Shortener + Link Checker</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; margin-bottom: 30px; text-align: center; }
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
    .tab { padding: 10px 20px; background: white; border: none; cursor: pointer; border-radius: 4px; }
    .tab.active { background: #0066cc; color: white; }
    .panel { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: none; }
    .panel.active { display: block; }
    input, textarea { width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; }
    button { padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #0052a3; }
    .result { margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 4px; }
    .url-item { padding: 15px; margin-bottom: 10px; background: #f9f9f9; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
    .link-result { padding: 10px; margin-bottom: 5px; border-left: 3px solid #ccc; background: #f9f9f9; }
    .link-result.alive { border-color: #28a745; }
    .link-result.dead { border-color: #dc3545; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
    .stat-box { background: #f9f9f9; padding: 15px; border-radius: 4px; text-align: center; }
    .stat-box h3 { font-size: 2em; color: #0066cc; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔗 URL Shortener + Link Checker</h1>
    
    <div class="tabs">
      <button class="tab active" onclick="showTab('shorten')">Shorten URL</button>
      <button class="tab" onclick="showTab('list')">My URLs</button>
      <button class="tab" onclick="showTab('check')">Check Links</button>
    </div>

    <div id="shorten" class="panel active">
      <h2>Shorten a URL</h2>
      <input id="longUrl" placeholder="Enter long URL (e.g., https://example.com/very/long/path)">
      <input id="customCode" placeholder="Custom code (optional)">
      <button onclick="shorten()">Shorten</button>
      <div id="shortenResult" class="result" style="display:none;"></div>
    </div>

    <div id="list" class="panel">
      <h2>All Short URLs</h2>
      <button onclick="loadList()">Refresh</button>
      <div id="urlList"></div>
    </div>

    <div id="check" class="panel">
      <h2>Check Links</h2>
      <textarea id="urls" rows="10" placeholder="Enter URLs (one per line)"></textarea>
      <button onclick="checkLinks()">Check All</button>
      <div id="checkResult"></div>
    </div>
  </div>

  <script>
    function showTab(tab) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById(tab).classList.add('active');
      if (tab === 'list') loadList();
    }

    async function shorten() {
      const longUrl = document.getElementById('longUrl').value;
      const custom = document.getElementById('customCode').value;
      
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: longUrl, custom })
      });

      const data = await res.json();
      const result = document.getElementById('shortenResult');
      
      if (res.ok) {
        result.innerHTML = \`
          <strong>✅ Short URL created\${data.exists ? ' (already existed)' : ''}:</strong><br>
          <a href="\${data.url}" target="_blank">\${data.url}</a><br>
          <small>Code: \${data.code}</small>
        \`;
        result.style.display = 'block';
      } else {
        result.innerHTML = \`<strong>❌ Error:</strong> \${data.error}\`;
        result.style.display = 'block';
      }
    }

    async function loadList() {
      const res = await fetch('/api/list');
      const data = await res.json();
      
      const list = document.getElementById('urlList');
      if (data.urls.length === 0) {
        list.innerHTML = '<p>No URLs yet</p>';
        return;
      }

      list.innerHTML = '<div class="stats">' +
        \`<div class="stat-box"><h3>\${data.total}</h3><p>Total URLs</p></div>\` +
        \`<div class="stat-box"><h3>\${data.urls.reduce((s,u)=>s+u.clicks,0)}</h3><p>Total Clicks</p></div>\` +
        \`<div class="stat-box"><h3>\${data.urls.filter(u=>u.clicks>0).length}</h3><p>Active</p></div>\` +
        '</div>';

      data.urls.forEach(url => {
        list.innerHTML += \`
          <div class="url-item">
            <div>
              <strong>\${url.shortUrl}</strong><br>
              <small>\${url.longUrl}</small><br>
              <small>Clicks: \${url.clicks} | Created: \${new Date(url.createdAt).toLocaleDateString()}</small>
            </div>
            <button onclick="deleteUrl('\${url.code}')">Delete</button>
          </div>
        \`;
      });
    }

    async function deleteUrl(code) {
      if (!confirm('Delete this URL?')) return;
      await fetch(\`/api/delete/\${code}\`, { method: 'DELETE' });
      loadList();
    }

    async function checkLinks() {
      const urls = document.getElementById('urls').value.split('\\n').filter(u => u.trim());
      const result = document.getElementById('checkResult');
      
      result.innerHTML = '<p>Checking links...</p>';

      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      });

      const data = await res.json();
      
      result.innerHTML = \`
        <div class="stats">
          <div class="stat-box"><h3>\${data.total}</h3><p>Total</p></div>
          <div class="stat-box"><h3 style="color:#28a745">\${data.alive}</h3><p>Alive</p></div>
          <div class="stat-box"><h3 style="color:#dc3545">\${data.dead}</h3><p>Dead</p></div>
        </div>
      \`;

      data.results.forEach(r => {
        result.innerHTML += \`
          <div class="link-result \${r.alive ? 'alive' : 'dead'}">
            <strong>\${r.alive ? '✅' : '❌'} \${r.url}</strong><br>
            <small>Status: \${r.status} \${r.statusText} | Response: \${r.responseTime}ms</small>
            \${r.redirect ? \`<br><small>↪️ Redirects to: \${r.redirect}</small>\` : ''}
          </div>
        \`;
      });
    }
  </script>
</body>
</html>`;
  }

  start(port = PORT) {
    const server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    server.listen(port, () => {
      console.log(`\n🔗 URL Shortener + Link Checker running on http://localhost:${port}`);
      console.log(`\nFeatures:`);
      console.log(`  - Shorten URLs with custom codes`);
      console.log(`  - Track clicks and stats`);
      console.log(`  - Check if links are alive (200-399) or dead`);
      console.log(`  - Bulk link checking`);
      console.log(`\nPress Ctrl+C to stop\n`);
    });

    return server;
  }
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  URLShortenerServer,
  URLDatabase,
  LinkChecker,
};

// ─── Point d'entrée ──────────────────────────────────────────

if (require.main === module) {
  const server = new URLShortenerServer();
  server.start();
}