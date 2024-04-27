# ⏰ Day 19 — Cron Scheduler + Auto-Backup (COMBO)

> **30 Days of Pure Scripting** · Semaine 4 : Projets Avancés · Jour 4/5

## 🎯 Double Combo

Système complet combinant :
1. **⏰ Cron Job Scheduler** : Planificateur de tâches
2. **💾 Auto-Backup System** : Sauvegarde automatique

## ⚡ Fonctionnalités

### Cron Scheduler
- ✅ **Syntaxe cron standard** : minute hour day month weekday
- ✅ **Wildcards** : `*` (tous)
- ✅ **Ranges** : `1-5` (de 1 à 5)
- ✅ **Lists** : `1,3,5` (valeurs spécifiques)
- ✅ **Steps** : `*/5` (tous les 5)
- ✅ **Next run calculation** : Calcul prochain déclenchement
- ✅ **Job management** : Enable/disable, list, stats

### Backup System
- ✅ **Recursive backup** : Copie complète de dossiers
- ✅ **Compression** : tar.gz (simulé)
- ✅ **Checksum MD5** : Vérification intégrité
- ✅ **Rotation automatique** : Supprime anciens backups
- ✅ **Restore** : Restauration avec vérification
- ✅ **Metadata** : JSON avec infos backup
- ✅ **Retention policy** : Configurable (default 7 jours)

## 🚀 Usage CLI

```bash
# Créer un backup
node index.js backup ./data ./backups

# Lister les backups
node index.js list-backups

# Restaurer un backup
node index.js restore backup-2025-02-27

# Demo avec scheduler
node index.js demo
```

## 📊 Syntaxe Cron

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (0 = Sunday)
│ │ │ │ │
* * * * *
```

### Exemples

| Expression | Signification |
|------------|---------------|
| `* * * * *` | Chaque minute |
| `0 * * * *` | Chaque heure (début) |
| `0 2 * * *` | Chaque jour à 2h AM |
| `0 */2 * * *` | Toutes les 2 heures |
| `0 0 * * 0` | Chaque dimanche à minuit |
| `30 4 1 * *` | Le 1er de chaque mois à 4h30 |
| `0 0 1 1 *` | Le 1er janvier à minuit |
| `*/15 * * * *` | Toutes les 15 minutes |

## 💻 API Programmatique

### Scheduler

```javascript
const { JobScheduler } = require('./index');

const scheduler = new JobScheduler();

// Planifier un job
scheduler.schedule('daily-backup', '0 2 * * *', async () => {
  console.log('Running daily backup...');
  // Backup logic here
});

// Démarrer
scheduler.start();

// Lister jobs
const jobs = scheduler.list();
console.log(jobs);

// Désactiver un job
scheduler.toggle('daily-backup', false);

// Arrêter
scheduler.stop();
```

### Backup Manager

```javascript
const { BackupManager } = require('./index');

const manager = new BackupManager({
  sourcePath: './data',
  backupPath: './backups',
  retention: 7,        // Garder 7 jours
  compress: true,      // Compression
});

// Créer backup
const backup = await manager.create();
console.log(`Backup created: ${backup.name}`);

// Lister backups
const backups = manager.list();
console.log(`${backups.length} backups available`);

// Restaurer
await manager.restore('backup-2025-02-27', './restore-target');

// Rotation manuelle
await manager.rotate();
```

### Cron Parser

```javascript
const { CronParser } = require('./index');

// Parser expression
const cron = CronParser.parse('0 2 * * *');
// { minute: '0', hour: '2', day: '*', month: '*', weekday: '*' }

// Vérifier match
const matches = CronParser.matches('0 2 * * *', new Date());

// Prochain déclenchement
const next = CronParser.getNextRun('0 2 * * *');
console.log(`Next run: ${next.toLocaleString()}`);
```

## 🏗️ Architecture

```
System
├── CronParser
│   ├── parse() - Parse cron expression
│   ├── matches() - Check if date matches
│   └── getNextRun() - Calculate next execution
├── JobScheduler
│   ├── schedule() - Add job
│   ├── start() - Start scheduler
│   ├── tick() - Check jobs (every minute)
│   └── stop() - Stop scheduler
└── BackupManager
    ├── create() - Create backup
    ├── restore() - Restore backup
    ├── list() - List backups
    ├── rotate() - Remove old backups
    ├── copyRecursive() - Deep copy
    ├── generateChecksum() - MD5 hash
    └── compressBackup() - Compress (tar.gz)
```

## 🎯 Cas d'usage

### 1. Backup quotidien automatique

```javascript
const scheduler = new JobScheduler();
const manager = new BackupManager({
  sourcePath: './production-data',
  backupPath: './backups',
  retention: 30, // 30 jours
});

scheduler.schedule('daily-backup', '0 3 * * *', async () => {
  await manager.create();
  console.log('Daily backup completed!');
});

scheduler.start();
```

### 2. Backup avec notification

```javascript
const https = require('https');

scheduler.schedule('backup-with-alert', '0 2 * * *', async () => {
  try {
    const backup = await manager.create();
    
    // Notification Slack/Discord
    await sendWebhook(webhookUrl, {
      text: `✅ Backup success: ${backup.name} (${backup.size})`
    });
  } catch (err) {
    await sendWebhook(webhookUrl, {
      text: `❌ Backup failed: ${err.message}`
    });
  }
});
```

### 3. Multi-jobs avec différentes fréquences

```javascript
// Backup horaire (logs)
scheduler.schedule('hourly-logs', '0 * * * *', async () => {
  await backupManager.create('logs-' + Date.now());
});

// Backup quotidien (database)
scheduler.schedule('daily-db', '0 4 * * *', async () => {
  await dbBackup.create();
});

// Backup hebdomadaire (complet)
scheduler.schedule('weekly-full', '0 2 * * 0', async () => {
  await fullBackup.create();
});

// Cleanup mensuel
scheduler.schedule('monthly-cleanup', '0 3 1 * *', async () => {
  await cleanup.old();
});
```

### 4. Restore avec vérification

```javascript
const backups = manager.list();
const latest = backups[0];

console.log(`Restoring: ${latest.name}`);
console.log(`Created: ${latest.created}`);
console.log(`Size: ${latest.size}`);

// Vérifier checksum avant restore
try {
  await manager.restore(latest.name, './restore');
  console.log('✅ Restore successful!');
} catch (err) {
  console.error('❌ Restore failed:', err.message);
}
```

## 📊 Performance

| Opération | Complexité | Notes |
|-----------|------------|-------|
| Cron parse | O(1) | Constant |
| Cron match | O(1) | Per field check |
| Next run calc | O(n) | n = minutes à vérifier |
| Backup create | O(n) | n = nombre de fichiers |
| Restore | O(n) | n = nombre de fichiers |

## 🎉 Stats Projet

- **2 systèmes complets** : Cron + Backup
- **Syntaxe cron standard** : Compatible Unix
- **Production-ready** : Checksum, rotation, metadata
- **Zéro dépendances** : Pure Node.js

## 📁 Structure

```
day-19-cron-backup/
├── index.js       ← Cron + Backup + CLI
├── package.json
└── README.md
```

---

**Semaine 4 : 4/5 jours · 19/30 total · 63% complet**

*"Backup is like insurance: you hope you never need it."* — Unknown