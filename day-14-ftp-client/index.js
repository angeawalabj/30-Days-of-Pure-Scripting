'use strict';

const net = require('net');
const fs = require('fs');
const path = require('path');

/**
 * ============================================================
 * DAY 14 — FTP Client (File Transfer Protocol)
 * ============================================================
 * Algorithme  : FTP Protocol (Control + Data channels)
 * Complexité  : O(n) où n = taille du fichier
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── FTP Client ──────────────────────────────────────────────

class FTPClient {
  constructor() {
    this.controlSocket = null;
    this.dataSocket = null;
    this.buffer = '';
    this.connected = false;
  }

  async connect(host, port = 21, username = 'anonymous', password = 'anonymous@') {
    return new Promise((resolve, reject) => {
      this.controlSocket = net.createConnection({ host, port }, () => {
        this.setupControlSocket();
      });

      this.controlSocket.on('error', reject);

      this.waitForCode(220).then(async () => {
        try {
          await this.sendCommand('USER ' + username, 331);
          await this.sendCommand('PASS ' + password, 230);
          this.connected = true;
          resolve();
        } catch (err) {
          reject(err);
        }
      }).catch(reject);
    });
  }

  setupControlSocket() {
    this.controlSocket.on('data', (data) => {
      this.buffer += data.toString();
    });
  }

  async sendCommand(command, expectedCode) {
    this.buffer = '';
    this.controlSocket.write(command + '\r\n');

    return this.waitForCode(expectedCode);
  }

  async waitForCode(expectedCode) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for response'));
      }, 10000);

      const checkBuffer = setInterval(() => {
        const lines = this.buffer.split('\r\n');
        
        for (const line of lines) {
          if (/^\d{3}\s/.test(line)) {
            const code = parseInt(line.substring(0, 3), 10);
            
            clearInterval(checkBuffer);
            clearTimeout(timeout);

            if (expectedCode && code !== expectedCode) {
              return reject(new Error(`Expected ${expectedCode}, got ${code}: ${line}`));
            }

            return resolve({ code, message: line });
          }
        }
      }, 10);
    });
  }

  parsePassiveResponse(response) {
    const match = response.match(/\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
    if (!match) {
      throw new Error('Invalid PASV response');
    }

    const host = `${match[1]}.${match[2]}.${match[3]}.${match[4]}`;
    const port = parseInt(match[5], 10) * 256 + parseInt(match[6], 10);

    return { host, port };
  }

  async enterPassiveMode() {
    const response = await this.sendCommand('PASV', 227);
    return this.parsePassiveResponse(response.message);
  }

  async list(remotePath = '.') {
    const { host, port } = await this.enterPassiveMode();

    return new Promise((resolve, reject) => {
      this.dataSocket = net.createConnection({ host, port }, () => {
        this.sendCommand('LIST ' + remotePath, 150).catch(reject);
      });

      let data = '';
      this.dataSocket.on('data', (chunk) => {
        data += chunk.toString();
      });

      this.dataSocket.on('end', () => {
        this.waitForCode(226).then(() => {
          const files = this.parseListResponse(data);
          resolve(files);
        }).catch(reject);
      });

      this.dataSocket.on('error', reject);
    });
  }

  parseListResponse(data) {
    const lines = data.trim().split('\n');
    const files = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 9) continue;

      const permissions = parts[0];
      const isDirectory = permissions.startsWith('d');
      const size = parseInt(parts[4], 10);
      const name = parts.slice(8).join(' ');

      files.push({
        name,
        type: isDirectory ? 'directory' : 'file',
        size,
        permissions,
        raw: line,
      });
    }

    return files;
  }

  async download(remotePath, localPath) {
    const { host, port } = await this.enterPassiveMode();

    return new Promise((resolve, reject) => {
      this.dataSocket = net.createConnection({ host, port }, () => {
        this.sendCommand('RETR ' + remotePath, 150).catch(reject);
      });

      const writeStream = fs.createWriteStream(localPath);
      let totalBytes = 0;

      this.dataSocket.on('data', (chunk) => {
        totalBytes += chunk.length;
        writeStream.write(chunk);
      });

      this.dataSocket.on('end', () => {
        writeStream.end();
        this.waitForCode(226).then(() => {
          resolve({ bytes: totalBytes, path: localPath });
        }).catch(reject);
      });

      this.dataSocket.on('error', (err) => {
        writeStream.end();
        reject(err);
      });
    });
  }

  async upload(localPath, remotePath) {
    if (!fs.existsSync(localPath)) {
      throw new Error(`File not found: ${localPath}`);
    }

    const { host, port } = await this.enterPassiveMode();

    return new Promise((resolve, reject) => {
      this.dataSocket = net.createConnection({ host, port }, () => {
        this.sendCommand('STOR ' + remotePath, 150).catch(reject);

        const readStream = fs.createReadStream(localPath);
        let totalBytes = 0;

        readStream.on('data', (chunk) => {
          totalBytes += chunk.length;
          this.dataSocket.write(chunk);
        });

        readStream.on('end', () => {
          this.dataSocket.end();
        });

        readStream.on('error', reject);
      });

      this.dataSocket.on('close', () => {
        this.waitForCode(226).then(() => {
          resolve({ bytes: totalBytes, path: remotePath });
        }).catch(reject);
      });

      this.dataSocket.on('error', reject);
    });
  }

  async mkdir(dirName) {
    await this.sendCommand('MKD ' + dirName, 257);
  }

  async rmdir(dirName) {
    await this.sendCommand('RMD ' + dirName, 250);
  }

  async delete(fileName) {
    await this.sendCommand('DELE ' + fileName, 250);
  }

  async rename(oldName, newName) {
    await this.sendCommand('RNFR ' + oldName, 350);
    await this.sendCommand('RNTO ' + newName, 250);
  }

  async pwd() {
    const response = await this.sendCommand('PWD', 257);
    const match = response.message.match(/"(.+)"/);
    return match ? match[1] : null;
  }

  async cwd(dirName) {
    await this.sendCommand('CWD ' + dirName, 250);
  }

  async quit() {
    if (this.controlSocket) {
      await this.sendCommand('QUIT', 221);
      this.controlSocket.end();
      this.connected = false;
    }
  }
}

// ─── Helper Functions ────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ─── CLI ─────────────────────────────────────────────────────

async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help') {
    console.log(`
Usage:
  node index.js list <host> [username] [password]
  node index.js download <host> <remote> <local> [username] [password]
  node index.js upload <host> <local> <remote> [username] [password]

Commands:
  list       Liste fichiers du serveur
  download   Télécharge un fichier
  upload     Upload un fichier

Exemples:
  node index.js list ftp.example.com
  node index.js download ftp.example.com /remote/file.txt ./local.txt
  node index.js upload ftp.example.com ./local.txt /remote/file.txt

Note: Par défaut utilise anonymous/anonymous@
    `);
    process.exit(0);
  }

  try {
    if (command === 'list') {
      const host = args[1];
      const username = args[2] || 'anonymous';
      const password = args[3] || 'anonymous@';

      if (!host) {
        console.error('❌ Host requis');
        process.exit(1);
      }

      console.log(`\n📂 Connexion à ${host}...\n`);

      const client = new FTPClient();
      await client.connect(host, 21, username, password);

      console.log('✅ Connecté\n');

      const files = await client.list();

      console.log('📁 Fichiers:\n');
      for (const file of files) {
        const icon = file.type === 'directory' ? '📁' : '📄';
        const size = file.type === 'file' ? formatBytes(file.size) : '';
        console.log(`  ${icon} ${file.name.padEnd(30)} ${size}`);
      }

      await client.quit();
      console.log('\n✅ Déconnecté\n');

    } else if (command === 'download') {
      const host = args[1];
      const remote = args[2];
      const local = args[3];
      const username = args[4] || 'anonymous';
      const password = args[5] || 'anonymous@';

      if (!host || !remote || !local) {
        console.error('❌ Paramètres manquants');
        process.exit(1);
      }

      console.log(`\n⬇️  Téléchargement depuis ${host}...\n`);

      const client = new FTPClient();
      await client.connect(host, 21, username, password);

      const result = await client.download(remote, local);

      console.log(`✅ Téléchargé: ${formatBytes(result.bytes)}`);
      console.log(`   Sauvegardé: ${result.path}\n`);

      await client.quit();

    } else if (command === 'upload') {
      const host = args[1];
      const local = args[2];
      const remote = args[3];
      const username = args[4] || 'anonymous';
      const password = args[5] || 'anonymous@';

      if (!host || !local || !remote) {
        console.error('❌ Paramètres manquants');
        process.exit(1);
      }

      console.log(`\n⬆️  Upload vers ${host}...\n`);

      const client = new FTPClient();
      await client.connect(host, 21, username, password);

      const result = await client.upload(local, remote);

      console.log(`✅ Uploadé: ${formatBytes(result.bytes)}`);
      console.log(`   Destination: ${result.path}\n`);

      await client.quit();

    } else {
      console.error(`❌ Commande inconnue: "${command}"`);
      process.exit(1);
    }

  } catch (err) {
    console.error(`\n❌ Erreur: ${err.message}\n`);
    process.exit(1);
  }
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  FTPClient,
  formatBytes,
};

// ─── Point d'entrée ──────────────────────────────────────────

if (require.main === module) {
  runCLI().catch(err => {
    console.error('Erreur fatale:', err.message);
    process.exit(1);
  });
}