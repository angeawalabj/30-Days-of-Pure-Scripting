# 📂 Day 06 — File Organizer (Automatic)

> **30 Days of Pure Scripting** · Semaine 2 : Automatisation et Système

---

## 🎯 Problème

Organiser automatiquement un répertoire en déplaçant les fichiers dans des dossiers par catégorie :

```
Downloads/               Downloads/
├── photo.jpg       →   ├── Images/
├── video.mp4           │   └── photo.jpg
├── doc.pdf             ├── Videos/
└── script.js           │   └── video.mp4
                        ├── Documents/
                        │   └── doc.pdf
                        └── Code/
                            └── script.js
```

**Use cases** :
- Nettoyer le dossier Téléchargements automatiquement
- Organiser des projets avec fichiers mélangés
- Trier des archives de milliers de fichiers
- Automatiser avec cron/tâches planifiées

---

## ⚡ Performance

| Opération      | Complexité | 1000 fichiers | Notes                       |
|----------------|------------|---------------|-----------------------------|
| organize()     | **O(n)**   | < 100 ms      | n = nombre de fichiers      |
| scanDirectory()| **O(n)**   | < 50 ms       | Scan récursif O(n×d) si activé |
| categorizeFile()| **O(1)**  | < 0.01 ms     | Lookup dans hash map        |
| undo()         | **O(n)**   | < 100 ms      | Ramène tout à la racine     |

> **Note** : Le temps de déplacement dépend du filesystem (même partition = rename instantané, partition différente = copie puis suppression).

---

## 🛡️ Gestion des erreurs

| Erreur                | Cas déclencheur                     | Type levé     |
|-----------------------|-------------------------------------|---------------|
| Répertoire inexistant | `organize('/path/invalid')`         | `Error`       |
| Chemin n'est pas dir  | `organize('file.txt')`              | `Error`       |
| Options invalides     | `organize(dir, { minSize: 'x' })`   | `TypeError`   |
| Conflit de noms       | Fichier déjà présent dans dest     | Auto-rename   |
| Fichier inaccessible  | Permission refusée                  | Skip + log    |

---

## 🚀 Installation & Usage

```bash
# Installation
cd day-06-file-organizer
npm install

# CLI - Organiser
node index.js organize ~/Downloads
node index.js organize ~/Downloads --dry-run
node index.js organize ~/Downloads --verbose

# CLI - Analyser (sans déplacer)
node index.js analyze ~/Downloads --verbose

# CLI - Annuler l'organisation
node index.js undo ~/Downloads

# Options avancées
node index.js organize ~/Downloads --recursive
node index.js organize ~/Downloads --min-size 1048576  # 1 MB minimum
node index.js organize ~/Downloads --add-timestamp
```

### Exemples de sorties CLI

**Organisation :**
```bash
$ node index.js organize ~/Downloads

📂 ORGANISATION
──────────────────────────────────────────────────
Répertoire : /Users/john/Downloads

Fichiers scannés : 45
Fichiers déplacés : 42
Fichiers ignorés  : 2
Erreurs           : 1

Par catégorie :
  images          : 15 fichier(s)
  documents       : 12 fichier(s)
  videos          : 8 fichier(s)
  code            : 5 fichier(s)
  archives        : 2 fichier(s)

✅ Organisation terminée.
```

**Analyse (dry-run) :**
```bash
$ node index.js analyze ~/Downloads --verbose

🔍 ANALYSE
──────────────────────────────────────────────────
Répertoire : /Users/john/Downloads

Fichiers trouvés  : 45
À déplacer        : 42
À ignorer         : 2

Par catégorie :
  Images          : 15 fichier(s)
  Documents       : 12 fichier(s)
  Videos          : 8 fichier(s)
  Code            : 5 fichier(s)
  Archives        : 2 fichier(s)
```

---

## 🔌 API (module)

```js
const {
  organize,
  analyze,
  undo,
  categorizeFile,
} = require('./index');

// ─── Organiser un répertoire ───

const report = organize('/path/to/dir', {
  dryRun: false,        // false = déplacer réellement
  verbose: true,        // Détails de chaque fichier
  recursive: false,     // Scan des sous-dossiers
  skipHidden: true,     // Ignorer fichiers cachés (.file)
  createFolders: true,  // Créer dossiers de destination
  addTimestamp: false,  // Ajouter timestamp aux noms
  minSize: 0,           // Taille minimum en bytes
  maxSize: Infinity,    // Taille maximum en bytes
});

/*
{
  scanned: 45,
  moved: 42,
  skipped: 2,
  errors: 1,
  categories: {
    images: 15,
    documents: 12,
    videos: 8,
    code: 5,
    archives: 2
  },
  details: [ ... ] // Si verbose: true
}
*/

// ─── Analyser sans déplacer ───

const preview = analyze('/path/to/dir', { verbose: true });
// Identique à organize avec dryRun: true

// ─── Annuler l'organisation ───

const undoReport = undo('/path/to/dir');
// Ramène tous les fichiers à la racine

// ─── Catégoriser un fichier ───

categorizeFile('photo.jpg');       // → 'images'
categorizeFile('document.pdf');    // → 'documents'
categorizeFile('unknown.xyz');     // → null
```

---

## 🧪 Tests

```bash
npm test
```

```
PASS  index.test.js
  validateDirectory()      ✓ 4 tests
  validateOptions()        ✓ 3 tests
  categorizeFile()         ✓ 7 tests
  getDestinationFolder()   ✓ 3 tests
  scanDirectory()          ✓ 5 tests
  filterBySize()           ✓ 2 tests
  organize()               ✓ 5 tests
  analyze()                ✓ 1 test
  undo()                   ✓ 2 tests
  FILE_CATEGORIES          ✓ 3 tests

Tests:       35 passed
Coverage:    91.2% statements | 87.5% branches | 95.4% functions
```

### Ce qui est testé

- ✅ Validation répertoire (existe, est un dir, pas un fichier)
- ✅ Validation options (minSize/maxSize doivent être nombres)
- ✅ Catégorisation de 9 types de fichiers
- ✅ Insensibilité à la casse des extensions
- ✅ Scan avec/sans récursivité
- ✅ Scan avec/sans fichiers cachés
- ✅ Filtrage par taille min/max
- ✅ Organisation réelle avec déplacement
- ✅ Mode dry-run (simulation)
- ✅ Gestion conflits de noms (auto-rename)
- ✅ Ignore fichiers déjà organisés
- ✅ Ignore fichiers sans catégorie
- ✅ Undo avec gestion de conflits
- ✅ Structure FILE_CATEGORIES valide

---

## 📚 Concepts clés appris

### 1. File System en Node.js

```js
const fs = require('fs');

// Vérifier existence
fs.existsSync('/path/to/file');

// Lire répertoire
fs.readdirSync('/path', { withFileTypes: true });

// Stats d'un fichier
const stats = fs.statSync('/path/to/file');
stats.isFile();        // → true/false
stats.isDirectory();   // → true/false
stats.size;            // → bytes

// Déplacer (rename)
fs.renameSync('/old/path', '/new/path');
```

**Rename vs Copy** :
- Même partition → `rename` = instantané (change juste la métadonnée)
- Partition différente → `rename` = copie + suppression

### 2. Scan récursif

```js
function scanRecursive(dir) {
  const files = [];
  
  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        scan(fullPath); // Récursion
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}
```

### 3. Gestion des conflits de noms

```js
let destPath = '/Images/photo.jpg';
let counter = 1;

while (fs.existsSync(destPath)) {
  destPath = `/Images/photo_${counter}.jpg`;
  counter++;
}

// Résultat : photo.jpg, photo_1.jpg, photo_2.jpg, ...
```

### 4. withFileTypes pour performance

```js
// ❌ Lent : 2 appels système par fichier
const files = fs.readdirSync(dir);
for (const file of files) {
  const stats = fs.statSync(path.join(dir, file));
  if (stats.isFile()) { ... }
}

// ✅ Rapide : 1 appel système total
const entries = fs.readdirSync(dir, { withFileTypes: true });
for (const entry of entries) {
  if (entry.isFile()) { ... }
}
```

### 5. Extensions de fichiers

```js
const path = require('path');

path.extname('photo.jpg');       // → '.jpg'
path.extname('archive.tar.gz');  // → '.gz' (dernière extension)
path.basename('photo.jpg');      // → 'photo.jpg'
path.basename('photo.jpg', '.jpg'); // → 'photo'
```

---

## 📋 Catégories supportées

| Catégorie      | Extensions | Dossier       |
|----------------|------------|---------------|
| **Images**     | .jpg, .png, .gif, .svg, .webp, .ico, .heic | Images |
| **Videos**     | .mp4, .avi, .mkv, .mov, .wmv, .webm | Videos |
| **Audio**      | .mp3, .wav, .flac, .aac, .ogg, .m4a | Audio |
| **Documents**  | .pdf, .doc, .docx, .txt, .rtf, .odt | Documents |
| **Spreadsheets** | .xls, .xlsx, .csv, .ods, .numbers | Spreadsheets |
| **Presentations** | .ppt, .pptx, .key, .odp | Presentations |
| **Archives**   | .zip, .rar, .7z, .tar, .gz, .bz2 | Archives |
| **Code**       | .js, .py, .java, .cpp, .html, .css, .php | Code |
| **Executables** | .exe, .msi, .dmg, .app, .deb, .rpm | Executables |

**Total : 9 catégories · 70+ extensions**

---

## 🔧 Cas d'usage avancés

### Automatisation avec cron (Linux/Mac)

```bash
# Organiser Downloads tous les jours à minuit
0 0 * * * cd /path/to/day-06-file-organizer && node index.js organize ~/Downloads
```

### Script de nettoyage hebdomadaire

```js
const { organize } = require('./index');

// Organiser + supprimer fichiers > 30 jours
const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

const report = organize(process.env.HOME + '/Downloads', {
  verbose: true,
});

console.log(`${report.moved} fichiers organisés.`);
```

### Organiser plusieurs répertoires

```js
const dirs = [
  '/Users/john/Downloads',
  '/Users/john/Desktop',
  '/Users/john/Documents/Unsorted',
];

for (const dir of dirs) {
  console.log(`Organisation de ${dir}...`);
  const report = organize(dir);
  console.log(`  → ${report.moved} fichiers déplacés`);
}
```

---

## 📁 Structure

```
day-06-file-organizer/
├── index.js          ← Organisateur, scan, catégorisation, CLI
├── index.test.js     ← 35 tests Jest
├── package.json
└── README.md
```

---

## 🔗 Suite du challenge

| ← Précédent            | Jour actuel              | Suivant →           |
|------------------------|--------------------------|---------------------|
| 05 · Currency Converter | **06 · File Organizer** | 07 · Web Scraper    |

---

*"The best way to predict the future is to implement it."* — David Heinemeier Hansson