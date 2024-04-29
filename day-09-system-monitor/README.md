# 📊 Day 09 — System Monitor (Resource Tracking)

> **30 Days of Pure Scripting** · Semaine 2 : Automatisation et Système

---

## 🎯 Problème

Surveiller les ressources système en temps réel :

```js
const metrics = getMetrics();
/*
{
  cpu: { usage: 45, cores: 8, model: '...' },
  memory: { usage: 62, total: '16 GB', used: '9.92 GB', free: '6.08 GB' },
  load: { '1min': 2.5, '5min': 2.1, '15min': 1.8 },
  system: { platform: 'linux', uptime: '5d 3h 24m', ... }
}
*/
```

**Use cases** :
- Monitoring serveur 24/7
- Alertes si seuils dépassés (CPU > 80%, RAM > 90%)
- Dashboard système en temps réel
- Logs historiques de performance
- Détection de fuites mémoire

---

## ⚡ Performance

| Opération        | Complexité | Temps    | Notes                       |
|------------------|------------|----------|-----------------------------|
| getCPUUsage()    | **O(n)**   | < 1 ms   | n = nombre de cores         |
| getMemoryUsage() | **O(1)**   | < 0.1 ms | Lecture système directe     |
| getLoadAverage() | **O(1)**   | < 0.1 ms | API native                  |
| getMetrics()     | **O(n)**   | < 5 ms   | Toutes métriques combinées  |

> **Note** : Les appels système (`os.cpus()`, `os.totalmem()`) sont très rapides (< 1ms).

---

## 🛡️ Gestion des erreurs

| Erreur                | Cas déclencheur              | Comportement     |
|-----------------------|------------------------------|------------------|
| Métrique indisponible | Disque non accessible        | Retourne null    |
| Fichier non lisible   | Permissions saveMetrics      | Log + continue   |
| Seuil invalide        | threshold négatif            | Ignore           |

---

## 🚀 Installation & Usage

```bash
# Installation
cd day-09-system-monitor
npm install

# CLI - Snapshot instantané
node index.js snapshot

# CLI - Surveillance continue (5s par défaut)
node index.js watch
node index.js watch 3000  # Intervalle 3s

# CLI - Vérification seuils
node index.js alert
node index.js alert 80 80 90  # CPU, Memory, Disk thresholds
```

### Exemples de sorties CLI

**Snapshot :**
```bash
$ node index.js snapshot

📊 MÉTRIQUES SYSTÈME
──────────────────────────────────────────────────
Timestamp    : 2025-02-26T15:30:45.123Z
Hostname     : macbook-pro
Platform     : darwin (x64)
Uptime       : 5d 3h 24m

💻 CPU
Usage        : 45%
Cores        : 8
Model        : Apple M1 Pro

📊 Load Average
1 min        : 2.5
5 min        : 2.1
15 min       : 1.8

🧠 Mémoire
Usage        : 62%
Total        : 16 GB
Used         : 9.92 GB
Free         : 6.08 GB
```

**Watch (surveillance continue) :**
```bash
$ node index.js watch 5000

👀 SURVEILLANCE (intervalle: 5000ms)
Appuyez sur Ctrl+C pour arrêter
──────────────────────────────────────────────────
[15:30:45] CPU: 45% | Memory: 62% | Load: 2.5
[15:30:50] CPU: 48% | Memory: 63% | Load: 2.6
[15:30:55] CPU: 52% | Memory: 64% | Load: 2.7
⚠️ CPU usage at 85% (threshold: 80%)
[15:31:00] CPU: 85% | Memory: 65% | Load: 3.2
```

**Alert (vérification seuils) :**
```bash
$ node index.js alert 80 80 90

🚨 VÉRIFICATION SEUILS
──────────────────────────────────────────────────
Status       : WARNING

Alertes :
  ⚠️ CPU usage at 85% (threshold: 80%)
  ⚠️ Memory usage at 88% (threshold: 80%)
```

---

## 🔌 API (module)

```js
const {
  getMetrics,
  getCPUUsage,
  getMemoryUsage,
  checkThresholds,
  monitor,
  saveMetrics,
} = require('./index');

// ─── Snapshot unique ───

const metrics = getMetrics();
console.log(`CPU: ${metrics.cpu.usage}%`);
console.log(`Memory: ${metrics.memory.usage}%`);

// ─── Métriques individuelles ───

const cpu = getCPUUsage();
// → { usage: 45, cores: 8, model: 'Intel...', speed: 2400 }

const mem = getMemoryUsage();
// → { total: '16 GB', used: '9.92 GB', free: '6.08 GB', usage: 62, ... }

const load = getLoadAverage();
// → { '1min': 2.5, '5min': 2.1, '15min': 1.8 }

const sys = getSystemInfo();
// → { platform: 'darwin', arch: 'x64', hostname: '...', uptime: '5d 3h' }

// ─── Vérification seuils ───

const check = checkThresholds(metrics, {
  cpu: 80,
  memory: 80,
  disk: 90,
});

/*
{
  status: 'WARNING',
  alerts: [
    {
      level: 'WARNING',
      metric: 'cpu',
      value: 85,
      threshold: 80,
      message: 'CPU usage at 85% (threshold: 80%)'
    }
  ],
  metrics: { ... }
}
*/

// ─── Surveillance continue ───

const mon = monitor({
  interval: 5000,              // 5 secondes
  thresholds: {
    cpu: 80,
    memory: 85,
    disk: 90,
  },
  onMetrics: (metrics) => {
    console.log(`CPU: ${metrics.cpu.usage}%`);
  },
  onAlert: (alerts) => {
    for (const alert of alerts) {
      console.log(`⚠️ ${alert.message}`);
      // Envoyer email, Slack notification, etc.
    }
  },
});

// Arrêter après 1 minute
setTimeout(() => mon.stop(), 60000);

// ─── Sauvegarde historique ───

setInterval(() => {
  const metrics = getMetrics();
  saveMetrics(metrics, './metrics-history.json');
}, 60000); // Toutes les minutes
```

---

## 🧪 Tests

```bash
npm test
```

```
PASS  index.test.js
  getCPUUsage()          ✓ 3 tests
  getLoadAverage()       ✓ 3 tests
  getMemoryUsage()       ✓ 4 tests
  getDiskUsage()         ✓ 2 tests
  getSystemInfo()        ✓ 3 tests
  getNetworkInfo()       ✓ 2 tests
  getMetrics()           ✓ 2 tests
  checkThresholds()      ✓ 4 tests
  monitor()              ✓ 4 tests
  formatBytes()          ✓ 5 tests
  formatUptime()         ✓ 6 tests
  saveMetrics()          ✓ 3 tests
  Constantes             ✓ 2 tests

Tests:       43 passed
Coverage:    88.6% statements | 82.3% branches | 91.2% functions
```

### Ce qui est testé

- ✅ Toutes les métriques système (CPU, mémoire, load, réseau)
- ✅ Valeurs dans ranges attendues (usage 0-100%)
- ✅ Cohérence des calculs (total = used + free)
- ✅ Vérification des seuils avec 3 niveaux (OK, WARNING, CRITICAL)
- ✅ Monitor avec callbacks onMetrics et onAlert
- ✅ Arrêt du monitoring avec stop()
- ✅ Formatage bytes (B, KB, MB, GB, TB)
- ✅ Formatage uptime (jours, heures, minutes)
- ✅ Sauvegarde avec limite 100 entrées
- ✅ Constantes par défaut

---

## 📚 Concepts clés appris

### 1. Module `os` de Node.js

```js
const os = require('os');

// CPU
os.cpus();        // → [{ model, speed, times: { user, nice, sys, idle, irq } }]
os.loadavg();     // → [1min, 5min, 15min]

// Mémoire
os.totalmem();    // → bytes totaux
os.freemem();     // → bytes libres

// Système
os.platform();    // → 'linux', 'darwin', 'win32'
os.arch();        // → 'x64', 'arm64'
os.hostname();    // → hostname
os.uptime();      // → secondes depuis démarrage

// Réseau
os.networkInterfaces(); // → { eth0: [...], lo: [...] }
```

### 2. Calcul d'utilisation CPU

```js
function getCPUUsage() {
  const cpus = os.cpus();
  
  let totalIdle = 0;
  let totalTick = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];  // user + nice + sys + idle + irq
    }
    totalIdle += cpu.times.idle;
  }

  const usage = 100 - Math.round((totalIdle / totalTick) * 100);
  return usage;
}
```

**Pourquoi ça marche ?**  
`idle / total` donne le % de temps inactif.  
`100 - idle%` donne le % d'utilisation.

### 3. Load Average

Le **load average** représente le nombre moyen de processus en attente d'exécution CPU.

```
Load Average: 2.5

Si 4 cores :
  2.5 / 4 = 62.5% d'utilisation moyenne

Si 8 cores :
  2.5 / 8 = 31.25% d'utilisation moyenne
```

**Interprétation** :
- < nombre de cores → OK
- = nombre de cores → Limite
- \> nombre de cores → Surchargé

### 4. Formatage de bytes

```js
function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

formatBytes(1536)            // → '1.5 KB'
formatBytes(1073741824)      // → '1 GB'
```

### 5. Monitoring pattern avec callbacks

```js
function monitor(options) {
  const intervalId = setInterval(() => {
    const data = collect();
    
    if (options.onData) {
      options.onData(data);
    }
    
    if (needsAlert(data) && options.onAlert) {
      options.onAlert(generateAlert(data));
    }
  }, options.interval);

  return {
    stop: () => clearInterval(intervalId),
  };
}
```

### 6. Niveaux d'alerte

```
OK        : Tout va bien
WARNING   : Seuil dépassé (80-94%)
CRITICAL  : Seuil critique (≥95%)
```

---

## 🔧 Cas d'usage avancés

### Dashboard avec mise à jour temps réel

```js
const blessed = require('blessed');
const screen = blessed.screen();

const cpuBox = blessed.box({ top: 0, left: 0, width: '50%', height: 3 });
const memBox = blessed.box({ top: 3, left: 0, width: '50%', height: 3 });
screen.append(cpuBox);
screen.append(memBox);

monitor({
  interval: 1000,
  onMetrics: (m) => {
    cpuBox.setContent(`CPU: ${m.cpu.usage}%`);
    memBox.setContent(`Memory: ${m.memory.usage}%`);
    screen.render();
  },
});
```

### Alertes Slack

```js
const https = require('https');

function sendSlackAlert(alert) {
  const payload = JSON.stringify({
    text: `🚨 ${alert.message}`,
  });

  const req = https.request({
    hostname: 'hooks.slack.com',
    path: '/services/YOUR/WEBHOOK/URL',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  req.write(payload);
  req.end();
}

monitor({
  interval: 10000,
  onAlert: (alerts) => {
    alerts.forEach(sendSlackAlert);
  },
});
```

### Logs structurés avec timestamps

```js
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'metrics.log' }),
  ],
});

monitor({
  interval: 60000,
  onMetrics: (metrics) => {
    logger.info('system_metrics', metrics);
  },
});
```

---

## 📁 Structure

```
day-09-system-monitor/
├── index.js          ← Monitor, métriques, alertes, CLI
├── index.test.js     ← 43 tests Jest
├── package.json
└── README.md
```

---

## 🔗 Suite du challenge

| ← Précédent        | Jour actuel               | Suivant →           |
|--------------------|---------------------------|---------------------|
| 08 · Bulk Renamer  | **09 · System Monitor**   | 10 · Log Analyzer   |

---

**Total : 9 jours · 384 tests passent · 0 erreurs**

*"What gets measured gets managed."* — Peter Drucker