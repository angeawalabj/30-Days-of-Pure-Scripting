'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');

const execAsync = promisify(exec);

/**
 * ============================================================
 * DAY 19 — Cron Job Scheduler + Auto-Backup (COMBO)
 * ============================================================
 * Algorithme  : Cron parsing + Scheduled backups
 * Complexité  : O(1) scheduling, O(n) backup
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── Cron Parser ─────────────────────────────────────────────

class CronParser {
  /**
   * Parse expression cron (ex: "0 2 * * *" = tous les jours à 2h)
   * Format: minute hour day month weekday
   */
  static parse(expression) {
    const parts = expression.split(' ');
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression. Format: minute hour day month weekday');
    }

    return {
      minute: parts[0],
      hour: parts[1],
      day: parts[2],
      month: parts[3],
      weekday: parts[4],
    };
  }

  /**
   * Vérifie si une date correspond à l'expression cron
   */
  static matches(cronExpr, date = new Date()) {
    const cron = this.parse(cronExpr);
    
    return this.matchField(cron.minute, date.getMinutes()) &&
           this.matchField(cron.hour, date.getHours()) &&
           this.matchField(cron.day, date.getDate()) &&
           this.matchField(cron.month, date.getMonth() + 1) &&
           this.matchField(cron.weekday, date.getDay());
  }

  static matchField(cronField, value) {
    if (cronField === '*') return true;
    
    // Range: 1-5
    if (cronField.includes('-')) {
      const [start, end] = cronField.split('-').map(Number);
      return value >= start && value <= end;
    }
    
    // List: 1,3,5
    if (cronField.includes(',')) {
      return cronField.split(',').map(Number).includes(value);
    }
    
    // Step: */5 (every 5)
    if (cronField.includes('/')) {
      const [base, step] = cronField.split('/');
      if (base === '*') {
        return value % parseInt(step) === 0;
      }
    }
    
    // Exact match
    return parseInt(cronField) === value;
  }

  /**
   * Calcule le prochain déclenchement
   */
  static getNextRun(cronExpr, from = new Date()) {
    const next = new Date(from);
    next.setSeconds(0);
    next.setMilliseconds(0);
    
    // Avancer d'une minute
    next.setMinutes(next.getMinutes() + 1);
    
    // Chercher jusqu'à 1 an
    const maxIterations = 365 * 24 * 60;
    for (let i = 0; i < maxIterations; i++) {
      if (this.matches(cronExpr, next)) {
        return next;
      }
      next.setMinutes(next.getMinutes() + 1);
    }
    
    return null;
  }
}

// ─── Job Scheduler ───────────────────────────────────────────

class JobScheduler {
  constructor() {
    this.jobs = new Map();
    this.running = false;
    this.interval = null;
  }

  /**
   * Ajoute un job planifié
   */
  schedule(name, cronExpr, task, options = {}) {
    const job = {
      name,
      cronExpr,
      task,
      enabled: true,
      lastRun: null,
      nextRun: CronParser.getNextRun(cronExpr),
      runCount: 0,
      ...options,
    };

    this.jobs.set(name, job);
    console.log(`✅ Job scheduled: ${name} (next: ${job.nextRun?.toLocaleString()})`);
    
    return job;
  }

  /**
   * Supprime un job
   */
  unschedule(name) {
    return this.jobs.delete(name);
  }

  /**
   * Active/désactive un job
   */
  toggle(name, enabled) {
    const job = this.jobs.get(name);
    if (job) {
      job.enabled = enabled;
    }
  }

  /**
   * Démarre le scheduler
   */
  start() {
    if (this.running) return;
    
    this.running = true;
    console.log('🕐 Scheduler started');
    
    // Vérifier toutes les minutes
    this.interval = setInterval(() => {
      this.tick();
    }, 60000); // 60 secondes
    
    // Premier tick immédiat
    this.tick();
  }

  /**
   * Arrête le scheduler
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.running = false;
    console.log('🛑 Scheduler stopped');
  }

  /**
   * Tick (vérification des jobs)
   */
  async tick() {
    const now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);

    for (const [name, job] of this.jobs) {
      if (!job.enabled) continue;
      
      if (CronParser.matches(job.cronExpr, now)) {
        console.log(`\n▶️  Running job: ${name}`);
        
        try {
          await job.task();
          job.lastRun = now;
          job.runCount++;
          job.nextRun = CronParser.getNextRun(job.cronExpr, now);
          
          console.log(`✅ Job completed: ${name}`);
        } catch (err) {
          console.error(`❌ Job failed: ${name} - ${err.message}`);
        }
      }
    }
  }

  /**
   * Liste tous les jobs
   */
  list() {
    return Array.from(this.jobs.values());
  }

  /**
   * Obtient un job par nom
   */
  get(name) {
    return this.jobs.get(name);
  }
}

// ─── Backup Manager ──────────────────────────────────────────

class BackupManager {
  constructor(config = {}) {
    this.sourcePath = config.sourcePath || './data';
    this.backupPath = config.backupPath || './backups';
    this.retention = config.retention || 7; // Jours
    this.compress = config.compress !== false;
    
    // Créer dossier backup
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
  }

  /**
   * Crée un backup
   */
  async create(name = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = name || `backup-${timestamp}`;
    const backupDir = path.join(this.backupPath, backupName);

    console.log(`📦 Creating backup: ${backupName}`);

    if (!fs.existsSync(this.sourcePath)) {
      throw new Error(`Source path not found: ${this.sourcePath}`);
    }

    // Copier récursivement
    await this.copyRecursive(this.sourcePath, backupDir);

    // Compression optionnelle
    let finalPath = backupDir;
    if (this.compress) {
      finalPath = await this.compressBackup(backupDir);
      // Supprimer le dossier non-compressé
      await this.removeDirectory(backupDir);
    }

    // Générer checksum
    const checksum = await this.generateChecksum(finalPath);

    const backup = {
      name: backupName,
      path: finalPath,
      size: this.getSize(finalPath),
      created: new Date().toISOString(),
      checksum,
      compressed: this.compress,
    };

    // Sauvegarder metadata
    const metadataPath = finalPath + '.json';
    fs.writeFileSync(metadataPath, JSON.stringify(backup, null, 2));

    console.log(`✅ Backup created: ${backup.size}`);

    // Rotation automatique
    await this.rotate();

    return backup;
  }

  /**
   * Copie récursive de fichiers
   */
  async copyRecursive(src, dest) {
    const stats = fs.statSync(src);

    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }

      const files = fs.readdirSync(src);
      for (const file of files) {
        await this.copyRecursive(
          path.join(src, file),
          path.join(dest, file)
        );
      }
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  /**
   * Compresse un dossier (simulation)
   */
  async compressBackup(dir) {
    const tarPath = dir + '.tar.gz';
    
    // Note: Vraie compression nécessite tar/gzip
    // Pour simulation, on crée juste un fichier marker
    fs.writeFileSync(tarPath, `Compressed backup of ${dir}`);
    
    return tarPath;
  }

  /**
   * Génère un checksum MD5
   */
  async generateChecksum(filepath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filepath);

      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Restaure un backup
   */
  async restore(backupName, targetPath = null) {
    const backups = this.list();
    const backup = backups.find(b => b.name === backupName);

    if (!backup) {
      throw new Error(`Backup not found: ${backupName}`);
    }

    const dest = targetPath || this.sourcePath;

    console.log(`📥 Restoring backup: ${backupName} → ${dest}`);

    // Vérifier checksum
    const currentChecksum = await this.generateChecksum(backup.path);
    if (currentChecksum !== backup.checksum) {
      throw new Error('Checksum mismatch! Backup may be corrupted.');
    }

    // Si compressé, décompresser d'abord
    let sourceDir = backup.path;
    if (backup.compressed) {
      sourceDir = await this.decompressBackup(backup.path);
    }

    // Restaurer
    if (fs.existsSync(dest)) {
      await this.removeDirectory(dest);
    }
    
    await this.copyRecursive(sourceDir, dest);

    console.log(`✅ Backup restored`);

    return { success: true, path: dest };
  }

  /**
   * Décompresse un backup
   */
  async decompressBackup(tarPath) {
    // Simulation
    const dir = tarPath.replace('.tar.gz', '');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Liste tous les backups
   */
  list() {
    const backups = [];

    if (!fs.existsSync(this.backupPath)) {
      return backups;
    }

    const files = fs.readdirSync(this.backupPath);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const metadataPath = path.join(this.backupPath, file);
        try {
          const backup = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          backups.push(backup);
        } catch (err) {
          console.error(`Error reading backup metadata: ${file}`);
        }
      }
    }

    return backups.sort((a, b) => new Date(b.created) - new Date(a.created));
  }

  /**
   * Rotation des backups (supprime anciens)
   */
  async rotate() {
    const backups = this.list();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retention);

    for (const backup of backups) {
      const backupDate = new Date(backup.created);
      
      if (backupDate < cutoffDate) {
        console.log(`🗑️  Removing old backup: ${backup.name}`);
        
        // Supprimer backup et metadata
        if (fs.existsSync(backup.path)) {
          if (fs.statSync(backup.path).isDirectory()) {
            await this.removeDirectory(backup.path);
          } else {
            fs.unlinkSync(backup.path);
          }
        }
        
        const metadataPath = backup.path + '.json';
        if (fs.existsSync(metadataPath)) {
          fs.unlinkSync(metadataPath);
        }
      }
    }
  }

  /**
   * Supprime un dossier récursivement
   */
  async removeDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        await this.removeDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    }
    fs.rmdirSync(dir);
  }

  /**
   * Taille d'un fichier/dossier
   */
  getSize(filepath) {
    const stats = fs.statSync(filepath);
    
    if (stats.isFile()) {
      return this.formatBytes(stats.size);
    }

    let total = 0;
    const files = fs.readdirSync(filepath);
    for (const file of files) {
      const filePath = path.join(filepath, file);
      const fileStats = fs.statSync(filePath);
      total += fileStats.isDirectory() 
        ? this.getSizeRecursive(filePath) 
        : fileStats.size;
    }

    return this.formatBytes(total);
  }

  getSizeRecursive(dir) {
    let total = 0;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      total += stats.isDirectory() 
        ? this.getSizeRecursive(filePath) 
        : stats.size;
    }
    
    return total;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// ─── CLI ─────────────────────────────────────────────────────

async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    console.log(`
Usage:
  node index.js schedule <name> <cron> <command>
  node index.js backup <source> [destination]
  node index.js restore <backup-name> [target]
  node index.js list-backups
  node index.js demo

Cron format: minute hour day month weekday
  * * * * *  - Every minute
  0 2 * * *  - Every day at 2 AM
  0 */2 * * * - Every 2 hours
  0 0 * * 0  - Every Sunday at midnight

Examples:
  node index.js backup ./data ./backups
  node index.js restore backup-2025-02-27
  node index.js demo
    `);
    process.exit(0);
  }

  try {
    if (command === 'backup') {
      const source = args[1] || './data';
      const dest = args[2] || './backups';

      const manager = new BackupManager({
        sourcePath: source,
        backupPath: dest,
      });

      const backup = await manager.create();
      console.log('\n✅ Backup completed!');
      console.log(`   Name: ${backup.name}`);
      console.log(`   Size: ${backup.size}`);
      console.log(`   Path: ${backup.path}\n`);

    } else if (command === 'restore') {
      const backupName = args[1];
      
      if (!backupName) {
        console.error('❌ Backup name required');
        process.exit(1);
      }

      const manager = new BackupManager();
      await manager.restore(backupName);

    } else if (command === 'list-backups') {
      const manager = new BackupManager();
      const backups = manager.list();

      console.log('\n📦 Available Backups\n' + '─'.repeat(50));
      
      if (backups.length === 0) {
        console.log('No backups found\n');
      } else {
        for (const backup of backups) {
          console.log(`${backup.name}`);
          console.log(`  Created: ${new Date(backup.created).toLocaleString()}`);
          console.log(`  Size: ${backup.size}`);
          console.log(`  Compressed: ${backup.compressed ? 'Yes' : 'No'}`);
          console.log('');
        }
      }

    } else if (command === 'demo') {
      console.log('\n🎬 DEMO: Cron Scheduler + Auto-Backup\n');
      
      const scheduler = new JobScheduler();
      const manager = new BackupManager({
        sourcePath: './data',
        backupPath: './backups',
        retention: 7,
      });

      // Job 1: Backup quotidien à 2h du matin
      scheduler.schedule('daily-backup', '0 2 * * *', async () => {
        await manager.create();
      });

      // Job 2: Cleanup toutes les heures
      scheduler.schedule('hourly-cleanup', '0 * * * *', () => {
        console.log('🧹 Running cleanup...');
      });

      // Job 3: Test toutes les minutes (démo)
      scheduler.schedule('test-job', '* * * * *', () => {
        console.log('⏰ Test job running at', new Date().toLocaleTimeString());
      });

      scheduler.start();

      console.log('📋 Scheduled Jobs:');
      for (const job of scheduler.list()) {
        console.log(`  - ${job.name}: ${job.cronExpr}`);
        console.log(`    Next run: ${job.nextRun?.toLocaleString()}`);
      }

      console.log('\nPress Ctrl+C to stop\n');

    } else {
      console.error(`❌ Unknown command: "${command}"`);
      process.exit(1);
    }

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  CronParser,
  JobScheduler,
  BackupManager,
};

// ─── Point d'entrée ──────────────────────────────────────────

if (require.main === module) {
  runCLI().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
  });
}