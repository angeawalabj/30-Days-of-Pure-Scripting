'use strict';

const http = require('http');
const https = require('https');
const url = require('url');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * ============================================================
 * DAY 16 — Weather Reporter + JWT Auth + Webhook Bot
 * ============================================================
 * MEGA COMBO PROJECT:
 * - Weather API integration
 * - JWT authentication system
 * - Webhook notifications (Discord/Slack/Telegram)
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── Configuration ───────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
const USERS_FILE = path.join(__dirname, 'users.json');

// ─── JWT Authentication ──────────────────────────────────────

class JWTAuth {
  constructor(secret) {
    this.secret = secret;
  }

  // Encode Base64URL
  base64urlEncode(str) {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Decode Base64URL
  base64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(str, 'base64').toString();
  }

  // Créer JWT token
  sign(payload, expiresIn = '24h') {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    // Calculer expiration
    const expiry = this.parseExpiry(expiresIn);
    const finalPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + expiry) / 1000),
    };

    // Encoder header et payload
    const encodedHeader = this.base64urlEncode(JSON.stringify(header));
    const encodedPayload = this.base64urlEncode(JSON.stringify(finalPayload));

    // Créer signature
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  // Vérifier JWT token
  verify(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const [encodedHeader, encodedPayload, signature] = parts;

      // Vérifier signature
      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }

      // Décoder payload
      const payload = JSON.parse(this.base64urlDecode(encodedPayload));

      // Vérifier expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      return { valid: true, payload };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }

  parseExpiry(expiresIn) {
    const units = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 24 * 60 * 60 * 1000; // Default 24h

    return parseInt(match[1]) * units[match[2]];
  }
}

// ─── User Management ─────────────────────────────────────────

class UserManager {
  constructor(filepath) {
    this.filepath = filepath;
    this.users = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filepath)) {
        return JSON.parse(fs.readFileSync(this.filepath, 'utf8'));
      }
    } catch (err) {
      console.error('Error loading users:', err.message);
    }
    return [];
  }

  save() {
    fs.writeFileSync(this.filepath, JSON.stringify(this.users, null, 2));
  }

  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  register(username, password, email) {
    if (this.users.find(u => u.username === username)) {
      throw new Error('Username already exists');
    }

    const user = {
      id: crypto.randomBytes(8).toString('hex'),
      username,
      password: this.hashPassword(password),
      email,
      createdAt: new Date().toISOString(),
      webhooks: {},
    };

    this.users.push(user);
    this.save();

    // Ne pas retourner le password
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  login(username, password) {
    const user = this.users.find(u => u.username === username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.password !== this.hashPassword(password)) {
      throw new Error('Invalid credentials');
    }

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  getUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  setWebhook(userId, platform, url) {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    user.webhooks[platform] = url;
    this.save();
  }

  getWebhooks(userId) {
    const user = this.users.find(u => u.id === userId);
    return user ? user.webhooks : {};
  }
}

// ─── Weather API ─────────────────────────────────────────────

class WeatherAPI {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 600000; // 10 minutes
  }

  async getWeather(city) {
    // Vérifier cache
    const cached = this.cache.get(city);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    // API gratuite (pas de clé requise)
    const apiUrl = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;

    return new Promise((resolve, reject) => {
      https.get(apiUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const weather = JSON.parse(data);
            const result = this.parseWeatherData(weather, city);
            
            // Mettre en cache
            this.cache.set(city, {
              data: result,
              timestamp: Date.now(),
            });

            resolve(result);
          } catch (err) {
            reject(new Error('Failed to parse weather data'));
          }
        });
      }).on('error', reject);
    });
  }

  parseWeatherData(data, city) {
    const current = data.current_condition[0];
    const today = data.weather[0];

    return {
      city,
      temperature: {
        current: parseInt(current.temp_C),
        feelsLike: parseInt(current.FeelsLikeC),
        min: parseInt(today.mintempC),
        max: parseInt(today.maxtempC),
      },
      condition: current.weatherDesc[0].value,
      humidity: parseInt(current.humidity),
      windSpeed: parseInt(current.windspeedKmph),
      uvIndex: parseInt(current.uvIndex),
      timestamp: new Date().toISOString(),
    };
  }

  formatMessage(weather) {
    const emoji = this.getWeatherEmoji(weather.condition);
    
    return `${emoji} **Weather Report for ${weather.city}**\n\n` +
      `🌡️ Temperature: ${weather.temperature.current}°C (feels like ${weather.temperature.feelsLike}°C)\n` +
      `📊 Range: ${weather.temperature.min}°C - ${weather.temperature.max}°C\n` +
      `☁️ Condition: ${weather.condition}\n` +
      `💧 Humidity: ${weather.humidity}%\n` +
      `💨 Wind: ${weather.windSpeed} km/h\n` +
      `☀️ UV Index: ${weather.uvIndex}\n\n` +
      `_Updated: ${new Date(weather.timestamp).toLocaleString()}_`;
  }

  getWeatherEmoji(condition) {
    const lower = condition.toLowerCase();
    if (lower.includes('sunny') || lower.includes('clear')) return '☀️';
    if (lower.includes('cloud')) return '☁️';
    if (lower.includes('rain')) return '🌧️';
    if (lower.includes('snow')) return '❄️';
    if (lower.includes('thunder')) return '⛈️';
    return '🌤️';
  }
}

// ─── Webhook Notifier ────────────────────────────────────────

class WebhookNotifier {
  async send(webhookUrl, message, platform = 'discord') {
    const payload = this.formatPayload(message, platform);

    return new Promise((resolve, reject) => {
      const parsedUrl = url.parse(webhookUrl);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, status: res.statusCode });
        } else {
          reject(new Error(`Webhook failed: ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  formatPayload(message, platform) {
    switch (platform) {
      case 'discord':
        return { content: message };
      
      case 'slack':
        return { text: message };
      
      case 'telegram':
        return { text: message };
      
      default:
        return { content: message };
    }
  }
}

// ─── Main Server ─────────────────────────────────────────────

class WeatherAuthServer {
  constructor() {
    this.jwt = new JWTAuth(JWT_SECRET);
    this.users = new UserManager(USERS_FILE);
    this.weather = new WeatherAPI();
    this.notifier = new WebhookNotifier();
  }

  async handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      return res.end();
    }

    // Routes publiques
    if (pathname === '/' && req.method === 'GET') {
      return this.serveHTML(res);
    }

    if (pathname === '/api/register' && req.method === 'POST') {
      return this.handleRegister(req, res);
    }

    if (pathname === '/api/login' && req.method === 'POST') {
      return this.handleLogin(req, res);
    }

    // Routes protégées
    const auth = this.authenticate(req);
    if (!auth.valid) {
      return this.sendJSON(res, 401, { error: 'Unauthorized' });
    }

    if (pathname === '/api/weather' && req.method === 'POST') {
      return this.handleWeather(req, res, auth.payload.userId);
    }

    if (pathname === '/api/webhook' && req.method === 'PUT') {
      return this.handleSetWebhook(req, res, auth.payload.userId);
    }

    if (pathname === '/api/me' && req.method === 'GET') {
      return this.handleMe(res, auth.payload.userId);
    }

    res.writeHead(404);
    res.end('Not Found');
  }

  authenticate(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false };
    }

    const token = authHeader.substring(7);
    return this.jwt.verify(token);
  }

  async handleRegister(req, res) {
    try {
      const body = await this.parseBody(req);
      const { username, password, email } = body;

      if (!username || !password) {
        return this.sendJSON(res, 400, { error: 'Username and password required' });
      }

      const user = this.users.register(username, password, email);
      this.sendJSON(res, 201, { user });
    } catch (err) {
      this.sendJSON(res, 400, { error: err.message });
    }
  }

  async handleLogin(req, res) {
    try {
      const body = await this.parseBody(req);
      const { username, password } = body;

      const user = this.users.login(username, password);
      const token = this.jwt.sign({ userId: user.id, username: user.username });

      this.sendJSON(res, 200, { token, user });
    } catch (err) {
      this.sendJSON(res, 401, { error: err.message });
    }
  }

  async handleWeather(req, res, userId) {
    try {
      const body = await this.parseBody(req);
      const { city, notify } = body;

      if (!city) {
        return this.sendJSON(res, 400, { error: 'City required' });
      }

      const weather = await this.weather.getWeather(city);

      // Envoyer notification si demandé
      if (notify) {
        const webhooks = this.users.getWebhooks(userId);
        const message = this.weather.formatMessage(weather);

        const notifications = [];
        for (const [platform, webhookUrl] of Object.entries(webhooks)) {
          try {
            await this.notifier.send(webhookUrl, message, platform);
            notifications.push({ platform, success: true });
          } catch (err) {
            notifications.push({ platform, success: false, error: err.message });
          }
        }

        weather.notifications = notifications;
      }

      this.sendJSON(res, 200, weather);
    } catch (err) {
      this.sendJSON(res, 400, { error: err.message });
    }
  }

  async handleSetWebhook(req, res, userId) {
    try {
      const body = await this.parseBody(req);
      const { platform, url: webhookUrl } = body;

      if (!platform || !webhookUrl) {
        return this.sendJSON(res, 400, { error: 'Platform and URL required' });
      }

      this.users.setWebhook(userId, platform, webhookUrl);
      this.sendJSON(res, 200, { message: 'Webhook configured' });
    } catch (err) {
      this.sendJSON(res, 400, { error: err.message });
    }
  }

  handleMe(res, userId) {
    const user = this.users.getUser(userId);
    if (!user) {
      return this.sendJSON(res, 404, { error: 'User not found' });
    }

    const webhooks = this.users.getWebhooks(userId);
    this.sendJSON(res, 200, { user, webhooks });
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
    res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Weather + Auth + Webhooks</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; }
    .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.2); margin-bottom: 20px; }
    h1 { color: white; text-align: center; margin-bottom: 30px; }
    h2 { margin-bottom: 20px; color: #333; }
    input, select { width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 6px; }
    button { width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; }
    button:hover { background: #5568d3; }
    .result { margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 6px; }
    .hidden { display: none; }
    .logout { background: #dc3545; margin-top: 10px; }
    .weather-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>☁️ Weather Reporter + 🔐 JWT Auth + 🤖 Webhooks</h1>
    
    <div id="authSection" class="card">
      <h2>Authentication</h2>
      <input id="username" placeholder="Username">
      <input id="password" type="password" placeholder="Password">
      <input id="email" placeholder="Email (optional)">
      <button onclick="register()">Register</button>
      <button onclick="login()" style="background:#28a745;margin-top:10px">Login</button>
      <div id="authResult" class="result hidden"></div>
    </div>

    <div id="appSection" class="hidden">
      <div class="card">
        <h2>Get Weather</h2>
        <input id="city" placeholder="City name (e.g., Paris, London, Tokyo)">
        <label><input type="checkbox" id="notify"> Send webhook notification</label><br><br>
        <button onclick="getWeather()">Get Weather</button>
        <div id="weatherResult"></div>
      </div>

      <div class="card">
        <h2>Configure Webhook</h2>
        <select id="platform">
          <option value="discord">Discord</option>
          <option value="slack">Slack</option>
          <option value="telegram">Telegram</option>
        </select>
        <input id="webhookUrl" placeholder="Webhook URL">
        <button onclick="setWebhook()">Save Webhook</button>
        <div id="webhookResult" class="result hidden"></div>
      </div>

      <button class="logout" onclick="logout()">Logout</button>
    </div>
  </div>

  <script>
    let token = localStorage.getItem('token');
    if (token) showApp();

    async function register() {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: document.getElementById('username').value,
          password: document.getElementById('password').value,
          email: document.getElementById('email').value
        })
      });
      const data = await res.json();
      showResult('authResult', res.ok ? '✅ Registered! Now login.' : '❌ ' + data.error);
    }

    async function login() {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: document.getElementById('username').value,
          password: document.getElementById('password').value
        })
      });
      const data = await res.json();
      if (res.ok) {
        token = data.token;
        localStorage.setItem('token', token);
        showApp();
      } else {
        showResult('authResult', '❌ ' + data.error);
      }
    }

    async function getWeather() {
      const res = await fetch('/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          city: document.getElementById('city').value,
          notify: document.getElementById('notify').checked
        })
      });
      const data = await res.json();
      if (res.ok) {
        document.getElementById('weatherResult').innerHTML = \`
          <div class="weather-card">
            <h3>\${data.city}</h3>
            <p style="font-size:2em">\${data.temperature.current}°C</p>
            <p>\${data.condition}</p>
            <p>Feels like: \${data.temperature.feelsLike}°C</p>
            <p>Humidity: \${data.humidity}% | Wind: \${data.windSpeed} km/h</p>
            \${data.notifications ? '<p>✅ Notifications sent: ' + data.notifications.filter(n=>n.success).length + '</p>' : ''}
          </div>
        \`;
      } else {
        showResult('weatherResult', '❌ ' + data.error);
      }
    }

    async function setWebhook() {
      const res = await fetch('/api/webhook', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          platform: document.getElementById('platform').value,
          url: document.getElementById('webhookUrl').value
        })
      });
      const data = await res.json();
      showResult('webhookResult', res.ok ? '✅ Webhook saved!' : '❌ ' + data.error);
    }

    function showApp() {
      document.getElementById('authSection').classList.add('hidden');
      document.getElementById('appSection').classList.remove('hidden');
    }

    function logout() {
      localStorage.removeItem('token');
      location.reload();
    }

    function showResult(id, msg) {
      const el = document.getElementById(id);
      el.textContent = msg;
      el.classList.remove('hidden');
    }
  </script>
</body>
</html>`);
  }

  start(port = PORT) {
    const server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    server.listen(port, () => {
      console.log(`\n☁️ Weather + Auth + Webhooks Server running on http://localhost:${port}`);
      console.log(`\nFeatures:`);
      console.log(`  🔐 JWT Authentication (register/login)`);
      console.log(`  ☁️ Real-time weather data (wttr.in API)`);
      console.log(`  🤖 Webhook notifications (Discord/Slack/Telegram)`);
      console.log(`\nPress Ctrl+C to stop\n`);
    });

    return server;
  }
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  WeatherAuthServer,
  JWTAuth,
  UserManager,
  WeatherAPI,
  WebhookNotifier,
};

// ─── Point d'entrée ──────────────────────────────────────────

if (require.main === module) {
  const server = new WeatherAuthServer();
  server.start();
}