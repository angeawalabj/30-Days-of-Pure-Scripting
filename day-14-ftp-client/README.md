# 📁 Day 14 — FTP Client

> **30 Days of Pure Scripting** · Semaine 3 : Réseautage et API · Jour 4/5

## 🎯 Problème

Créer un client FTP capable de lister, télécharger et uploader des fichiers.

## ⚡ Fonctionnalités

- ✅ **FTP Protocol** : Implémenté from scratch
- ✅ **Passive Mode** : Mode PASV pour data transfer
- ✅ **List files** : Liste fichiers et dossiers
- ✅ **Download** : Télécharge fichiers du serveur
- ✅ **Upload** : Upload fichiers vers serveur
- ✅ **Directory ops** : mkdir, rmdir, delete, rename
- ✅ **Navigation** : pwd, cwd
- ✅ **Authentication** : Support username/password
- ✅ **CLI complet** : Interface ligne de commande

## 🚀 Usage CLI

```bash
# Lister fichiers
node index.js list ftp.example.com

# Télécharger fichier
node index.js download ftp.example.com /remote/file.txt ./local.txt

# Upload fichier
node index.js upload ftp.example.com ./local.txt /remote/file.txt

# Avec authentification
node index.js list ftp.example.com username password
```

## 📡 API Programmatique

### Connexion et liste

```javascript
const { FTPClient } = require('./index');

const client = new FTPClient();

// Connexion
await client.connect('ftp.example.com', 21, 'username', 'password');

// Lister fichiers
const files = await client.list('/path');
for (const file of files) {
  console.log(file.name, file.size, file.type);
}

// Déconnexion
await client.quit();
```

### Téléchargement

```javascript
await client.connect('ftp.example.com');

// Télécharger fichier
const result = await client.download('/remote/file.txt', './local.txt');
console.log(`Downloaded ${result.bytes} bytes`);

await client.quit();
```

### Upload

```javascript
await client.connect('ftp.example.com');

// Upload fichier
const result = await client.upload('./local.txt', '/remote/file.txt');
console.log(`Uploaded ${result.bytes} bytes`);

await client.quit();
```

### Opérations dossiers

```javascript
await client.connect('ftp.example.com');

// Navigation
const currentDir = await client.pwd();
await client.cwd('/new/directory');

// Créer dossier
await client.mkdir('new-folder');

// Renommer
await client.rename('old-name.txt', 'new-name.txt');

// Supprimer fichier
await client.delete('file.txt');

// Supprimer dossier
await client.rmdir('folder');

await client.quit();
```

## 📡 Protocole FTP

### Architecture deux canaux

FTP utilise **deux connexions TCP** :

1. **Control Channel** (port 21) : Commandes
2. **Data Channel** (port dynamique) : Transfert données

```
Client                      Server
  |                           |
  |--- Control (port 21) -----|
  |                           |
  |--- USER username -------->|
  |<-- 331 Password required -|
  |                           |
  |--- PASS password -------->|
  |<-- 230 Login successful --|
  |                           |
  |--- PASV ----------------->|
  |<-- 227 (IP,PORT) ---------|
  |                           |
  |--- Data (port X) ---------|
  |                           |
  |--- RETR file.txt -------->|
  |<-- 150 Opening data ------|
  |<-- [file data] -----------|
  |<-- 226 Transfer complete -|
```

### Mode Passif (PASV)

Le serveur ouvre un port et envoie l'adresse au client :

```
C: PASV
S: 227 Entering Passive Mode (192,168,1,100,195,149)

IP   = 192.168.1.100
Port = 195 × 256 + 149 = 50069
```

### Commandes FTP principales

| Commande | Description | Réponse |
|----------|-------------|---------|
| USER | Username | 331 |
| PASS | Password | 230 |
| PASV | Passive mode | 227 |
| LIST | List files | 150, 226 |
| RETR | Download file | 150, 226 |
| STOR | Upload file | 150, 226 |
| PWD | Print working dir | 257 |
| CWD | Change dir | 250 |
| MKD | Make directory | 257 |
| RMD | Remove directory | 250 |
| DELE | Delete file | 250 |
| RNFR | Rename from | 350 |
| RNTO | Rename to | 250 |
| QUIT | Disconnect | 221 |

## 🏗️ Architecture

```
FTPClient
├── Control Channel (port 21)
│   ├── connect() - Authentification
│   ├── sendCommand() - Envoie commande
│   └── waitForCode() - Attend réponse
├── Data Channel (PASV)
│   ├── enterPassiveMode() - Parse 227
│   ├── list() - Liste fichiers
│   ├── download() - Télécharge
│   └── upload() - Upload
└── File Operations
    ├── mkdir, rmdir, delete
    ├── rename, pwd, cwd
    └── parseListResponse()
```

## 🎯 Concepts clés

### 1. Deux canaux TCP

```javascript
// Canal de contrôle (commandes)
this.controlSocket = net.connect({ host, port: 21 });

// Canal de données (fichiers)
const { host, port } = await this.enterPassiveMode();
this.dataSocket = net.connect({ host, port });
```

### 2. Mode passif

Parse réponse PASV :

```javascript
// "227 Entering Passive Mode (192,168,1,100,195,149)"
const match = response.match(/\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
const host = `${match[1]}.${match[2]}.${match[3]}.${match[4]}`;
const port = parseInt(match[5]) * 256 + parseInt(match[6]);
```

### 3. Streaming fichiers

```javascript
// Download
this.dataSocket.pipe(fs.createWriteStream(localPath));

// Upload
fs.createReadStream(localPath).pipe(this.dataSocket);
```

### 4. Codes de réponse

```
1xx : Information
2xx : Succès
3xx : Authentification requise
4xx : Erreur temporaire
5xx : Erreur permanente
```

### 5. Format LIST

```
-rw-r--r-- 1 user group 1024 Feb 27 10:00 file.txt
drwxr-xr-x 2 user group 4096 Feb 27 09:00 folder
```

Parse :
```javascript
const permissions = parts[0];
const isDirectory = permissions.startsWith('d');
const size = parseInt(parts[4]);
const name = parts.slice(8).join(' ');
```

## 🌟 Points forts

- ✅ **Zéro dépendance** : FTP from scratch
- ✅ **Protocol complet** : Control + Data channels
- ✅ **Mode passif** : Fonctionne avec firewalls
- ✅ **Streaming** : Efficient pour gros fichiers
- ✅ **Parse LIST** : Extraction métadonnées
- ✅ **Error handling** : Timeout et codes erreur

## ⚠️ Limitations

- ❌ Pas de mode actif (PORT)
- ❌ Pas de FTPS/SFTP (sécurisé)
- ❌ Pas de reprise transfert
- ❌ Pas de multi-threading

Pour production, utilisez **ftp** ou **ssh2-sftp-client**.

## 📊 Serveurs FTP publics de test

| Serveur | Host | User | Pass |
|---------|------|------|------|
| Rebex | test.rebex.net | demo | password |
| DLPTEST | ftp.dlptest.com | dlpuser | rNrKYTX9g7z3RgJRmxWuGHbeu |

```bash
node index.js list test.rebex.net demo password
```

## 📁 Structure

```
day-14-ftp-client/
├── index.js       ← FTP Client + CLI
├── package.json
└── README.md
```

## 🔗 Suite du challenge

| ← Précédent  | Jour actuel     | Suivant →          |
|--------------|-----------------|-------------------|
| 13 · Email   | **14 · FTP**    | 15 · URL Shortener |

---

**Semaine 3 : 4/5 jours · 14/30 total · 80% de la semaine 3 !**

*"FTP: The protocol that refuses to die."* — Unknown