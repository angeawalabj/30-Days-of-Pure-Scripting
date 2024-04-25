'use strict';

const fs = require('fs');
const path = require('path');

/**
 * ============================================================
 * DAY 06 — File Organizer (Auto System)
 * ============================================================
 * Algorithme  : File System Scanning + Pattern Matching
 * Complexité  : O(n) où n = nombre de fichiers
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── Constantes ──────────────────────────────────────────────

const FILE_CATEGORIES = {
  images: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico', '.heic'],
    folder: 'Images',
  },
  videos: {
    extensions: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'],
    folder: 'Videos',
  },
  audio: {
    extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'],
    folder: 'Audio',
  },
  documents: {
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.pages'],
    folder: 'Documents',
  },
  spreadsheets: {
    extensions: ['.xls', '.xlsx', '.csv', '.ods', '.numbers'],
    folder: 'Spreadsheets',
  },
  presentations: {
    extensions: ['.ppt', '.pptx', '.key', '.odp'],
    folder: 'Presentations',
  },
  archives: {
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],
    folder: 'Archives',
  },
  code: {
    extensions: ['.js', '.py', '.java', '.cpp', '.c', '.h', '.html', '.css', '.php', '.rb', '.go', '.rs', '.ts', '.jsx', '.tsx'],
    folder: 'Code',
  },
  executables: {
    extensions: ['.exe', '.msi', '.dmg', '.app', '.deb', '.rpm'],
    folder: 'Executables',
  },
};

const DEFAULT_OPTIONS = {
  dryRun: false,
  verbose: false,
  recursive: false,
  skipHidden: true,
  createFolders: true,
  addTimestamp: false,
  minSize: 0, // bytes
  maxSize: Infinity,
};

// ─── Validation ──────────────────────────────────────────────

/**
 * Valide qu'un chemin existe et est un répertoire.
 * @param {string} dirPath
 * @throws {Error}
 */
function validateDirectory(dirPath) {
  if (typeof dirPath !== 'string') {
    throw new TypeError('Le chemin doit être une chaîne.');
  }
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Le répertoire n'existe pas : ${dirPath}`);
  }
  const stats = fs.statSync(dirPath);
  if (!stats.isDirectory()) {
    throw new Error(`Le chemin n'est pas un répertoire : ${dirPath}`);
  }
}

/**
 * Valide les options.
 * @param {Object} options
 */
function validateOptions(options) {
  if (typeof options !== 'object' || options === null) {
    throw new TypeError('Les options doivent être un objet.');
  }
  if (options.minSize !== undefined && typeof options.minSize !== 'number') {
    throw new TypeError('minSize doit être un nombre.');
  }
  if (options.maxSize !== undefined && typeof options.maxSize !== 'number') {
    throw new TypeError('maxSize doit être un nombre.');
  }
}

// ─── Catégorisation ──────────────────────────────────────────

/**
 * Détermine la catégorie d'un fichier selon son extension.
 * @param {string} filename
 * @returns {string|null} - Nom de la catégorie ou null si aucune
 */
function categorizeFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  for (const [category, config] of Object.entries(FILE_CATEGORIES)) {
    if (config.extensions.includes(ext)) {
      return category;
    }
  }
  
  return null; // Aucune catégorie trouvée
}

/**
 * Obtient le nom du dossier de destination pour une catégorie.
 * @param {string} category
 * @returns {string}
 */
function getDestinationFolder(category) {
  return FILE_CATEGORIES[category]?.folder || 'Others';
}

// ─── Scan et Filtrage ────────────────────────────────────────

/**
 * Liste tous les fichiers d'un répertoire (avec option récursive).
 * @param {string} dirPath
 * @param {Object} options
 * @returns {Array<string>} - Chemins complets des fichiers
 */
function scanDirectory(dirPath, options = {}) {
  const { recursive = false, skipHidden = true } = options;
  const files = [];

  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      // Ignorer les fichiers cachés si demandé
      if (skipHidden && entry.name.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (recursive) {
          scan(fullPath);
        }
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  scan(dirPath);
  return files;
}

/**
 * Filtre les fichiers selon la taille.
 * @param {Array<string>} files
 * @param {Object} options
 * @returns {Array<string>}
 */
function filterBySize(files, options = {}) {
  const { minSize = 0, maxSize = Infinity } = options;

  return files.filter(file => {
    try {
      const stats = fs.statSync(file);
      return stats.size >= minSize && stats.size <= maxSize;
    } catch (err) {
      return false; // Ignorer les fichiers inaccessibles
    }
  });
}

// ─── Organisation ────────────────────────────────────────────

/**
 * Organise les fichiers d'un répertoire.
 * 
 * @param {string} sourcePath - Répertoire à organiser
 * @param {Object} [options]
 * @param {boolean} [options.dryRun=false] - Mode simulation
 * @param {boolean} [options.verbose=false] - Afficher détails
 * @param {boolean} [options.recursive=false] - Scanner sous-dossiers
 * @param {boolean} [options.skipHidden=true] - Ignorer fichiers cachés
 * @param {boolean} [options.createFolders=true] - Créer dossiers si nécessaire
 * @param {boolean} [options.addTimestamp=false] - Ajouter timestamp aux noms
 * @param {number} [options.minSize=0] - Taille min en bytes
 * @param {number} [options.maxSize=Infinity] - Taille max en bytes
 * @returns {Object} - Rapport d'organisation
 */
function organize(sourcePath, options = {}) {
  validateDirectory(sourcePath);
  validateOptions(options);

  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Scan des fichiers
  let files = scanDirectory(sourcePath, opts);
  
  // Filtrage par taille
  files = filterBySize(files, opts);

  const report = {
    scanned: files.length,
    moved: 0,
    skipped: 0,
    errors: 0,
    categories: {},
    details: [],
  };

  for (const file of files) {
    try {
      const filename = path.basename(file);
      const dirname = path.dirname(file);

      // Catégoriser
      const category = categorizeFile(filename);
      
      if (!category) {
        report.skipped++;
        if (opts.verbose) {
          report.details.push({ file: filename, action: 'skipped', reason: 'no category' });
        }
        continue;
      }

      // Dossier de destination
      const destFolderName = getDestinationFolder(category);
      const destFolder = path.join(sourcePath, destFolderName);

      // Créer le dossier si nécessaire
      if (opts.createFolders && !opts.dryRun && !fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder, { recursive: true });
      }

      // Nom de fichier final (avec timestamp optionnel)
      let finalFilename = filename;
      if (opts.addTimestamp) {
        const ext = path.extname(filename);
        const base = path.basename(filename, ext);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        finalFilename = `${base}_${timestamp}${ext}`;
      }

      const destPath = path.join(destFolder, finalFilename);

      // Vérifier si le fichier est déjà dans le bon dossier
      if (dirname === destFolder) {
        report.skipped++;
        if (opts.verbose) {
          report.details.push({ file: filename, action: 'skipped', reason: 'already in place' });
        }
        continue;
      }

      // Gérer les conflits de noms
      let finalDestPath = destPath;
      let counter = 1;
      while (fs.existsSync(finalDestPath)) {
        const ext = path.extname(finalFilename);
        const base = path.basename(finalFilename, ext);
        finalDestPath = path.join(destFolder, `${base}_${counter}${ext}`);
        counter++;
      }

      // Déplacer le fichier
      if (!opts.dryRun) {
        fs.renameSync(file, finalDestPath);
      }

      report.moved++;
      if (!report.categories[category]) {
        report.categories[category] = 0;
      }
      report.categories[category]++;

      if (opts.verbose) {
        report.details.push({
          file: filename,
          action: opts.dryRun ? 'would move' : 'moved',
          from: dirname,
          to: destFolder,
          category,
        });
      }

    } catch (err) {
      report.errors++;
      if (opts.verbose) {
        report.details.push({
          file: path.basename(file),
          action: 'error',
          error: err.message,
        });
      }
    }
  }

  return report;
}

/**
 * Analyse un répertoire sans déplacer les fichiers.
 * @param {string} sourcePath
 * @param {Object} [options]
 * @returns {Object}
 */
function analyze(sourcePath, options = {}) {
  return organize(sourcePath, { ...options, dryRun: true, verbose: true });
}

/**
 * Défait l'organisation (ramène les fichiers à la racine).
 * @param {string} sourcePath
 * @param {Object} [options]
 * @returns {Object}
 */
function undo(sourcePath, options = {}) {
  validateDirectory(sourcePath);

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const report = {
    moved: 0,
    errors: 0,
    details: [],
  };

  // Lister tous les sous-dossiers
  const entries = fs.readdirSync(sourcePath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (opts.skipHidden && entry.name.startsWith('.')) continue;

    const subDir = path.join(sourcePath, entry.name);

    // Lister les fichiers du sous-dossier
    const files = fs.readdirSync(subDir, { withFileTypes: true });

    for (const file of files) {
      if (!file.isFile()) continue;

      try {
        const srcPath = path.join(subDir, file.name);
        let destPath = path.join(sourcePath, file.name);

        // Gérer les conflits
        let counter = 1;
        while (fs.existsSync(destPath)) {
          const ext = path.extname(file.name);
          const base = path.basename(file.name, ext);
          destPath = path.join(sourcePath, `${base}_${counter}${ext}`);
          counter++;
        }

        if (!opts.dryRun) {
          fs.renameSync(srcPath, destPath);
        }

        report.moved++;
        if (opts.verbose) {
          report.details.push({
            file: file.name,
            action: opts.dryRun ? 'would move' : 'moved',
            from: subDir,
            to: sourcePath,
          });
        }

      } catch (err) {
        report.errors++;
        if (opts.verbose) {
          report.details.push({
            file: file.name,
            action: 'error',
            error: err.message,
          });
        }
      }
    }
  }

  return report;
}

// ─── CLI ─────────────────────────────────────────────────────

function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help') {
    console.log(`
Usage:
  node index.js organize <path> [options]
  node index.js analyze <path> [options]
  node index.js undo <path> [options]

Options:
  --dry-run          Simulation (ne déplace pas)
  --verbose          Afficher détails
  --recursive        Scanner sous-dossiers
  --add-timestamp    Ajouter timestamp aux noms
  --min-size <bytes> Taille minimum
  --max-size <bytes> Taille maximum

Exemples:
  node index.js organize ~/Downloads
  node index.js analyze ~/Downloads --verbose
  node index.js organize ~/Downloads --dry-run
  node index.js undo ~/Downloads

Catégories : ${Object.keys(FILE_CATEGORIES).join(', ')}
    `);
    process.exit(0);
  }

  try {
    const dirPath = args[1];
    if (!dirPath) {
      console.error('❌ Chemin manquant. Usage: node index.js <command> <path>');
      process.exit(1);
    }

    // Parser les options
    const options = {
      dryRun: args.includes('--dry-run'),
      verbose: args.includes('--verbose'),
      recursive: args.includes('--recursive'),
      addTimestamp: args.includes('--add-timestamp'),
    };

    // minSize et maxSize
    const minSizeIdx = args.indexOf('--min-size');
    if (minSizeIdx !== -1) {
      options.minSize = parseInt(args[minSizeIdx + 1], 10);
    }
    const maxSizeIdx = args.indexOf('--max-size');
    if (maxSizeIdx !== -1) {
      options.maxSize = parseInt(args[maxSizeIdx + 1], 10);
    }

    let report;

    if (command === 'organize') {
      console.log(`\n📂 ORGANISATION${options.dryRun ? ' (DRY RUN)' : ''}\n${'─'.repeat(50)}`);
      console.log(`Répertoire : ${dirPath}\n`);
      
      report = organize(dirPath, options);
      
      console.log(`Fichiers scannés : ${report.scanned}`);
      console.log(`Fichiers déplacés : ${report.moved}`);
      console.log(`Fichiers ignorés  : ${report.skipped}`);
      console.log(`Erreurs           : ${report.errors}`);
      
      if (Object.keys(report.categories).length > 0) {
        console.log('\nPar catégorie :');
        for (const [cat, count] of Object.entries(report.categories)) {
          console.log(`  ${cat.padEnd(15)} : ${count} fichier(s)`);
        }
      }

      if (options.verbose && report.details.length > 0) {
        console.log('\nDétails :');
        for (const detail of report.details.slice(0, 20)) {
          console.log(`  ${detail.action.padEnd(10)} : ${detail.file}`);
        }
        if (report.details.length > 20) {
          console.log(`  ... et ${report.details.length - 20} autre(s)`);
        }
      }

    } else if (command === 'analyze') {
      console.log(`\n🔍 ANALYSE\n${'─'.repeat(50)}`);
      console.log(`Répertoire : ${dirPath}\n`);
      
      report = analyze(dirPath, options);
      
      console.log(`Fichiers trouvés  : ${report.scanned}`);
      console.log(`À déplacer        : ${report.moved}`);
      console.log(`À ignorer         : ${report.skipped}`);
      
      if (Object.keys(report.categories).length > 0) {
        console.log('\nPar catégorie :');
        for (const [cat, count] of Object.entries(report.categories)) {
          const folder = getDestinationFolder(cat);
          console.log(`  ${folder.padEnd(15)} : ${count} fichier(s)`);
        }
      }

    } else if (command === 'undo') {
      console.log(`\n↩️  ANNULATION${options.dryRun ? ' (DRY RUN)' : ''}\n${'─'.repeat(50)}`);
      console.log(`Répertoire : ${dirPath}\n`);
      
      report = undo(dirPath, options);
      
      console.log(`Fichiers déplacés : ${report.moved}`);
      console.log(`Erreurs           : ${report.errors}`);

    } else {
      console.error(`❌ Commande inconnue : "${command}".`);
      process.exit(1);
    }

    if (!options.dryRun && report.moved > 0) {
      console.log('\n✅ Organisation terminée.');
    }

  } catch (err) {
    console.error(`\n❌ Erreur : ${err.message}`);
    process.exit(1);
  }
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  organize,
  analyze,
  undo,
  categorizeFile,
  getDestinationFolder,
  scanDirectory,
  filterBySize,
  validateDirectory,
  validateOptions,
  FILE_CATEGORIES,
  DEFAULT_OPTIONS,
};

// Point d'entrée CLI
if (require.main === module) {
  runCLI();
}