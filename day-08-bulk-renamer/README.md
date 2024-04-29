# 📝 Day 08 — Bulk Renamer (Mass Renaming)

> **30 Days of Pure Scripting** · Semaine 2 : Automatisation et Système

---

## 🎯 Problème

Renommer des centaines de fichiers en une seule commande :

```
Photos/               Photos/
├── IMG001.jpg   →   ├── vacation_001.jpg
├── IMG002.jpg       ├── vacation_002.jpg
├── IMG003.jpg       ├── vacation_003.jpg
└── IMG004.jpg       └── vacation_004.jpg
```

**Use cases** :
- Renommer photos avec numérotation séquentielle
- Ajouter préfixe/suffixe à des fichiers
- Remplacer chaînes dans noms de fichiers
- Normaliser casse (lowercase, UPPERCASE, camelCase)
- Ajouter dates/timestamps
- Nettoyer noms de fichiers (espaces, caractères spéciaux)

---

## ⚡ Performance

| Opération      | Complexité | 1000 fichiers | Notes                       |
|----------------|------------|---------------|-----------------------------|
| rename()       | **O(n)**   | < 100 ms      | n = nombre de fichiers      |
| scanFiles()    | **O(n)**   | < 50 ms       | Scan simple                 |
| applyPattern() | **O(1)**   | < 0.01 ms     | Par fichier                 |

> **Note** : Le renommage sur même partition est quasi-instantané (juste mise à jour métadonnées).

---

## 🛡️ Gestion des erreurs

| Erreur              | Cas déclencheur                   | Comportement     |
|---------------------|-----------------------------------|------------------|
| Fichier existe déjà | Collision de noms                 | Skip + log       |
| Nom inchangé        | Pattern ne modifie pas le nom     | Skip             |
| Répertoire invalide | Chemin inexistant                 | Error + exit     |
| Regex invalide      | Pattern regex malformé            | Error + exit     |
| Permission refusée  | Pas de droits en écriture         | Skip + log error |

---

## 🚀 Installation & Usage

```bash
# Installation
cd day-08-bulk-renamer
npm install

# CLI - Préfixe
node index.js prefix ~/Photos "vacation_"

# CLI - Suffixe
node index.js suffix ~/Documents "_backup"

# CLI - Remplacement
node index.js replace ~/Files "old" "new"

# CLI - Numérotation séquentielle
node index.js sequential ~/Photos 1

# CLI - Date
node index.js date ~/Docs YYYYMMDD

# CLI - Casse
node index.js lowercase ~/Files
node index.js uppercase ~/Files
node index.js camelcase ~/Files

# CLI - Regex
node index.js regex ~/Files "\\d+" "NUM"

# Options
node index.js prefix ~/Photos "vacation_" --dry-run
node index.js sequential ~/Photos 1 --verbose
node index.js replace ~/Files "old" "new" --recursive
node index.js prefix ~/Docs "DRAFT_" --backup
```

### Exemples de sorties CLI

**Préfixe :**
```bash
$ node index.js prefix ~/Photos "vacation_"

📝 RENOMMAGE
──────────────────────────────────────────────────
Répertoire : /Users/john/Photos
Pattern    : prefix

Total      : 25 fichier(s)
Renommés   : 25
Ignorés    : 0
Erreurs    : 0

✅ Renommage terminé.
```

**Séquentiel avec verbose :**
```bash
$ node index.js sequential ~/Photos 1 --verbose

📝 RENOMMAGE
──────────────────────────────────────────────────
Répertoire : /Users/john/Photos
Pattern    : sequential

Total      : 4 fichier(s)
Renommés   : 4
Ignorés    : 0
Erreurs    : 0

Détails :
  ✅ IMG001.jpg → IMG001_001.jpg
  ✅ IMG002.jpg → IMG002_002.jpg
  ✅ IMG003.jpg → IMG003_003.jpg
  ✅ IMG004.jpg → IMG004_004.jpg

✅ Renommage terminé.
```

**Dry-run (simulation) :**
```bash
$ node index.js replace ~/Files "draft" "final" --dry-run

📝 RENOMMAGE (DRY RUN)
──────────────────────────────────────────────────
Répertoire : /Users/john/Files
Pattern    : replace

Total      : 10 fichier(s)
Renommés   : 8
Ignorés    : 2
Erreurs    : 0
```

---

## 🔌 API (module)

```js
const { rename, RENAME_PATTERNS } = require('./index');

// ─── Préfixe ───

rename('/path/to/dir', {
  type: RENAME_PATTERNS.PREFIX,
  value: 'DRAFT_',
}, {
  dryRun: false,
  verbose: true,
});

// ─── Suffixe ───

rename('/path/to/dir', {
  type: RENAME_PATTERNS.SUFFIX,
  value: '_backup',
});

// ─── Remplacement ───

rename('/path/to/dir', {
  type: RENAME_PATTERNS.REPLACE,
  search: 'old',
  replace: 'new',
}, {
  caseSensitive: false, // Insensible à la casse
});

// ─── Séquentiel ───

rename('/path/to/dir', {
  type: RENAME_PATTERNS.SEQUENTIAL,
  start: 1,      // Commence à 1
  padding: 3,    // 001, 002, 003
  separator: '_', // file_001.txt
});

// ─── Date ───

rename('/path/to/dir', {
  type: RENAME_PATTERNS.DATE,
  format: 'YYYYMMDD',        // 20250226
  // Formats : YYYYMMDD, YYYY-MM-DD, YYYYMMDD-HHMMSS, timestamp
  separator: '_',
});

// ─── Casse ───

rename('/path/to/dir', {
  type: RENAME_PATTERNS.LOWERCASE,
});

rename('/path/to/dir', {
  type: RENAME_PATTERNS.UPPERCASE,
});

rename('/path/to/dir', {
  type: RENAME_PATTERNS.CAMELCASE,
});

// ─── Regex ───

rename('/path/to/dir', {
  type: RENAME_PATTERNS.REGEX,
  pattern: '\\d+',        // Tous les chiffres
  replacement: 'NUM',
});

// ─── Options globales ───

rename('/path/to/dir', pattern, {
  dryRun: true,          // Simulation
  verbose: true,         // Détails
  recursive: true,       // Sous-dossiers
  createBackup: true,    // Créer backup JSON
  includeExtension: false, // Ne pas toucher l'extension
  caseSensitive: true,   // Sensible à la casse
});

// ─── Rapport retourné ───

const report = rename('/path/to/dir', pattern);
/*
{
  total: 100,
  renamed: 95,
  skipped: 4,
  errors: 1,
  details: [
    { old: 'file1.txt', new: 'DRAFT_file1.txt', action: 'renamed' },
    { old: 'file2.txt', new: 'file2.txt', action: 'skipped', reason: 'no change' },
    ...
  ]
}
*/
```

---

## 🧪 Tests

```bash
npm test
```

```
PASS  index.test.js
  validateDirectory()    ✓ 3 tests
  applyPrefix()          ✓ 2 tests
  applySuffix()          ✓ 1 test
  applyReplace()         ✓ 3 tests
  applySequential()      ✓ 4 tests
  applyDate()            ✓ 3 tests
  applyLowercase()       ✓ 2 tests
  applyUppercase()       ✓ 2 tests
  applyCamelCase()       ✓ 3 tests
  applyRegex()           ✓ 2 tests
  scanFiles()            ✓ 2 tests
  rename()               ✓ 5 tests

Tests:       32 passed
Coverage:    89.7% statements | 85.4% branches | 93.1% functions
```

### Ce qui est testé

- ✅ Validation répertoire
- ✅ Tous les patterns (9 types)
- ✅ Options diverses (caseSensitive, includeExtension, start, padding)
- ✅ Mode dry-run
- ✅ Scan récursif
- ✅ Gestion collisions (fichier existe)
- ✅ Ignore si nom inchangé
- ✅ Numérotation séquentielle avec padding
- ✅ Formats de date multiples
- ✅ Conversions de casse
- ✅ Regex avec validation

---

## 📚 Concepts clés appris

### 1. Patterns de renommage

9 patterns supportés :

| Pattern     | Exemple input   | Exemple output      | Use case                    |
|-------------|-----------------|---------------------|-----------------------------|
| prefix      | file.txt        | DRAFT_file.txt      | Marquer brouillons          |
| suffix      | file.txt        | file_backup.txt     | Créer backups               |
| replace     | old_file.txt    | new_file.txt        | Remplacer chaînes           |
| sequential  | photo.jpg       | photo_001.jpg       | Numéroter photos            |
| date        | doc.pdf         | doc_20250226.pdf    | Ajouter dates               |
| lowercase   | FILE.TXT        | file.TXT            | Normaliser casse            |
| uppercase   | file.txt        | FILE.txt            | Conventions UPPERCASE       |
| camelCase   | my-file.txt     | myFile.txt          | Conventions camelCase       |
| regex       | file123.txt     | fileABC.txt         | Patterns complexes          |

### 2. Numérotation avec padding

```js
String(1).padStart(3, '0')  // → '001'
String(42).padStart(5, '0') // → '00042'
```

**Pourquoi padding ?** Pour que les fichiers soient triés correctement :

```
Sans padding :          Avec padding :
file_1.txt             file_001.txt
file_10.txt            file_002.txt
file_2.txt             file_010.txt
```

### 3. Extension de fichier

```js
const path = require('path');

path.extname('file.txt')           // → '.txt'
path.basename('file.txt', '.txt')  // → 'file'

// Renommer sans toucher l'extension
const ext = path.extname(filename);
const base = path.basename(filename, ext);
const newName = transform(base) + ext;
```

### 4. Regex pour noms de fichiers

```js
// Remplacer tous les chiffres
filename.replace(/\d+/g, 'NUM');

// Remplacer espaces par underscores
filename.replace(/\s+/g, '_');

// Supprimer caractères spéciaux
filename.replace(/[^a-zA-Z0-9._-]/g, '');

// Remplacer tirets et underscores par espaces
filename.replace(/[-_]+/g, ' ');
```

### 5. CamelCase conversion

```js
function toCamelCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

'my-file-name'  → 'myFileName'
'my_file_name'  → 'myFileName'
'my file name'  → 'myFileName'
```

### 6. Backup avant renommage

```js
const backup = files.map(f => ({
  old: f,
  new: null, // À remplir après renommage
  timestamp: Date.now()
}));

fs.writeFileSync('.rename-backup.json', JSON.stringify(backup));
```

---

## 🔧 Cas d'usage avancés

### Nettoyer noms téléchargés

```js
// Avant : "Photo (1) - Copy.jpg", "Document [final] v2.pdf"
// Après :  "Photo.jpg", "Document.pdf"

rename(dir, {
  type: RENAME_PATTERNS.REGEX,
  pattern: '\\s*\\(.*?\\)|\\s*\\[.*?\\]|\\s*-?\\s*Copy|\\s*v\\d+',
  replacement: '',
});
```

### Renommer par date de modification

```js
const files = scanFiles(dir);
const sorted = files.sort((a, b) => {
  return fs.statSync(a).mtime - fs.statSync(b).mtime;
});

// Renommer dans l'ordre chronologique
for (let i = 0; i < sorted.length; i++) {
  const old = sorted[i];
  const mtime = fs.statSync(old).mtime;
  const dateStr = mtime.toISOString().slice(0, 10);
  const ext = path.extname(old);
  const newName = `${dateStr}_${i + 1}${ext}`;
  fs.renameSync(old, path.join(dir, newName));
}
```

### Renommer selon métadonnées EXIF

```js
// Nécessite bibliothèque externe (exiftool, sharp)
const exif = await getExifData(file);
const date = exif.DateTimeOriginal; // "2025:02:26 14:30:00"
const newName = date.replace(/[: ]/g, '_') + '.jpg';
// → "2025_02_26_14_30_00.jpg"
```

---

## 📁 Structure

```
day-08-bulk-renamer/
├── index.js          ← Renommeur, patterns, CLI
├── index.test.js     ← 32 tests Jest
├── package.json
└── README.md
```

---

## 🔗 Suite du challenge

| ← Précédent      | Jour actuel            | Suivant →              |
|------------------|------------------------|------------------------|
| 07 · Web Scraper | **08 · Bulk Renamer**  | 09 · System Monitor    |

---

**Total : 8 jours · 341 tests passent · 0 erreurs**

*"Give me six hours to chop down a tree and I will spend the first four sharpening the axe."* — Abraham Lincoln