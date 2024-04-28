'use strict';

const fs = require('fs');
const path = require('path');

/**
 * ============================================================
 * DAY 08 — Bulk Renamer (Mass Renaming)
 * ============================================================
 * Algorithme  : Pattern Matching + Regex + Sequential Numbering
 * Complexité  : O(n) où n = nombre de fichiers
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── Constantes ──────────────────────────────────────────────

const DEFAULT_OPTIONS = {
  dryRun: false,
  verbose: false,
  recursive: false,
  includeExtension: true,
  caseSensitive: true,
  createBackup: false,
};

const RENAME_PATTERNS = {
  PREFIX: 'prefix',
  SUFFIX: 'suffix',
  REPLACE: 'replace',
  SEQUENTIAL: 'sequential',
  DATE: 'date',
  LOWERCASE: 'lowercase',
  UPPERCASE: 'uppercase',
  CAMELCASE: 'camelcase',
  REGEX: 'regex',
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
}

// ─── Scan de fichiers ────────────────────────────────────────

/**
 * Liste les fichiers d'un répertoire.
 * @param {string} dirPath
 * @param {Object} options
 * @returns {Array<string>} - Chemins complets
 */
function scanFiles(dirPath, options = {}) {
  const { recursive = false } = options;
  const files = [];

  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
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

// ─── Patterns de renommage ───────────────────────────────────

/**
 * Ajoute un préfixe.
 * @param {string} filename
 * @param {string} prefix
 * @param {Object} options
 * @returns {string}
 */
function applyPrefix(filename, prefix, options = {}) {
  const { includeExtension = true } = options;
  
  if (includeExtension) {
    return prefix + filename;
  } else {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    return prefix + base + ext;
  }
}

/**
 * Ajoute un suffixe.
 * @param {string} filename
 * @param {string} suffix
 * @param {Object} options
 * @returns {string}
 */
function applySuffix(filename, suffix, options = {}) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  return base + suffix + ext;
}

/**
 * Remplace une chaîne.
 * @param {string} filename
 * @param {string} search
 * @param {string} replace
 * @param {Object} options
 * @returns {string}
 */
function applyReplace(filename, search, replace, options = {}) {
  const { caseSensitive = true } = options;
  
  if (caseSensitive) {
    return filename.replace(new RegExp(search, 'g'), replace);
  } else {
    return filename.replace(new RegExp(search, 'gi'), replace);
  }
}

/**
 * Numérotation séquentielle.
 * @param {string} filename
 * @param {number} index
 * @param {Object} options
 * @returns {string}
 */
function applySequential(filename, index, options = {}) {
  const { start = 1, padding = 3, separator = '_' } = options;
  const number = String(start + index).padStart(padding, '0');
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  
  return base + separator + number + ext;
}

/**
 * Ajoute une date/heure.
 * @param {string} filename
 * @param {Object} options
 * @returns {string}
 */
function applyDate(filename, options = {}) {
  const { format = 'YYYYMMDD', separator = '_' } = options;
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  
  const now = new Date();
  let dateStr = '';
  
  switch (format) {
    case 'YYYYMMDD':
      dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      break;
    case 'YYYY-MM-DD':
      dateStr = now.toISOString().slice(0, 10);
      break;
    case 'YYYYMMDD-HHMMSS':
      dateStr = now.toISOString().slice(0, 19).replace(/[-:T]/g, '').replace(/(\d{8})(\d{6})/, '$1-$2');
      break;
    case 'timestamp':
      dateStr = String(now.getTime());
      break;
    default:
      dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  }
  
  return base + separator + dateStr + ext;
}

/**
 * Convertit en minuscules.
 * @param {string} filename
 * @param {Object} options
 * @returns {string}
 */
function applyLowercase(filename, options = {}) {
  const { includeExtension = false } = options;
  
  if (includeExtension) {
    return filename.toLowerCase();
  } else {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    return base.toLowerCase() + ext;
  }
}

/**
 * Convertit en majuscules.
 * @param {string} filename
 * @param {Object} options
 * @returns {string}
 */
function applyUppercase(filename, options = {}) {
  const { includeExtension = false } = options;
  
  if (includeExtension) {
    return filename.toUpperCase();
  } else {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    return base.toUpperCase() + ext;
  }
}

/**
 * Convertit en camelCase.
 * @param {string} filename
 * @returns {string}
 */
function applyCamelCase(filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  
  const camel = base
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  
  return camel + ext;
}

/**
 * Applique une regex de remplacement.
 * @param {string} filename
 * @param {string} pattern
 * @param {string} replacement
 * @returns {string}
 */
function applyRegex(filename, pattern, replacement) {
  try {
    const regex = new RegExp(pattern, 'g');
    return filename.replace(regex, replacement);
  } catch (err) {
    throw new Error(`Regex invalide : ${err.message}`);
  }
}

// ─── Renommage Principal ─────────────────────────────────────

/**
 * Renomme des fichiers en masse.
 * 
 * @param {string} dirPath
 * @param {Object} pattern
 * @param {string} pattern.type - Type de pattern (prefix, suffix, replace, etc.)
 * @param {*} pattern.value - Valeur du pattern
 * @param {Object} [options]
 * @returns {Object} - Rapport de renommage
 */
function rename(dirPath, pattern, options = {}) {
  validateDirectory(dirPath);
  validateOptions(options);

  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Scan des fichiers
  const files = scanFiles(dirPath, opts);

  const report = {
    total: files.length,
    renamed: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  // Créer backup si demandé
  if (opts.createBackup && !opts.dryRun) {
    const backupFile = path.join(dirPath, `.rename-backup-${Date.now()}.json`);
    const backup = files.map(f => ({ old: f }));
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  }

  for (let i = 0; i < files.length; i++) {
    try {
      const filePath = files[i];
      const dirname = path.dirname(filePath);
      const filename = path.basename(filePath);

      let newFilename = filename;

      // Appliquer le pattern
      switch (pattern.type) {
        case RENAME_PATTERNS.PREFIX:
          newFilename = applyPrefix(filename, pattern.value, opts);
          break;

        case RENAME_PATTERNS.SUFFIX:
          newFilename = applySuffix(filename, pattern.value, opts);
          break;

        case RENAME_PATTERNS.REPLACE:
          newFilename = applyReplace(filename, pattern.search, pattern.replace, opts);
          break;

        case RENAME_PATTERNS.SEQUENTIAL:
          newFilename = applySequential(filename, i, { ...opts, ...pattern });
          break;

        case RENAME_PATTERNS.DATE:
          newFilename = applyDate(filename, { ...opts, ...pattern });
          break;

        case RENAME_PATTERNS.LOWERCASE:
          newFilename = applyLowercase(filename, opts);
          break;

        case RENAME_PATTERNS.UPPERCASE:
          newFilename = applyUppercase(filename, opts);
          break;

        case RENAME_PATTERNS.CAMELCASE:
          newFilename = applyCamelCase(filename);
          break;

        case RENAME_PATTERNS.REGEX:
          newFilename = applyRegex(filename, pattern.pattern, pattern.replacement);
          break;

        default:
          throw new Error(`Pattern inconnu : ${pattern.type}`);
      }

      // Vérifier si le nom a changé
      if (newFilename === filename) {
        report.skipped++;
        if (opts.verbose) {
          report.details.push({
            old: filename,
            new: filename,
            action: 'skipped',
            reason: 'no change',
          });
        }
        continue;
      }

      const newFilePath = path.join(dirname, newFilename);

      // Vérifier collision
      if (fs.existsSync(newFilePath)) {
        report.skipped++;
        if (opts.verbose) {
          report.details.push({
            old: filename,
            new: newFilename,
            action: 'skipped',
            reason: 'file exists',
          });
        }
        continue;
      }

      // Renommer
      if (!opts.dryRun) {
        fs.renameSync(filePath, newFilePath);
      }

      report.renamed++;
      if (opts.verbose) {
        report.details.push({
          old: filename,
          new: newFilename,
          action: opts.dryRun ? 'would rename' : 'renamed',
        });
      }

    } catch (err) {
      report.errors++;
      if (opts.verbose) {
        report.details.push({
          old: path.basename(files[i]),
          action: 'error',
          error: err.message,
        });
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
  node index.js prefix <dir> <prefix>
  node index.js suffix <dir> <suffix>
  node index.js replace <dir> <search> <replace>
  node index.js sequential <dir> [start]
  node index.js date <dir> [format]
  node index.js lowercase <dir>
  node index.js uppercase <dir>
  node index.js camelcase <dir>
  node index.js regex <dir> <pattern> <replacement>

Options:
  --dry-run       Simulation
  --verbose       Afficher détails
  --recursive     Sous-dossiers
  --backup        Créer backup

Exemples:
  node index.js prefix ~/Documents "DRAFT_"
  node index.js sequential ~/Photos 1 --dry-run
  node index.js replace ~/Files "old" "new" --verbose
  node index.js date ~/Docs YYYYMMDD
    `);
    process.exit(0);
  }

  try {
    const dirPath = args[1];
    if (!dirPath) {
      console.error('❌ Chemin manquant.');
      process.exit(1);
    }

    // Parser options
    const options = {
      dryRun: args.includes('--dry-run'),
      verbose: args.includes('--verbose'),
      recursive: args.includes('--recursive'),
      createBackup: args.includes('--backup'),
    };

    let pattern;
    let report;

    switch (command) {
      case 'prefix':
        const prefix = args[2];
        if (!prefix) {
          console.error('❌ Préfixe manquant.');
          process.exit(1);
        }
        pattern = { type: RENAME_PATTERNS.PREFIX, value: prefix };
        break;

      case 'suffix':
        const suffix = args[2];
        if (!suffix) {
          console.error('❌ Suffixe manquant.');
          process.exit(1);
        }
        pattern = { type: RENAME_PATTERNS.SUFFIX, value: suffix };
        break;

      case 'replace':
        const search = args[2];
        const replace = args[3];
        if (!search || !replace) {
          console.error('❌ Paramètres search et replace requis.');
          process.exit(1);
        }
        pattern = { type: RENAME_PATTERNS.REPLACE, search, replace };
        break;

      case 'sequential':
        const start = parseInt(args[2], 10) || 1;
        pattern = { type: RENAME_PATTERNS.SEQUENTIAL, start };
        break;

      case 'date':
        const format = args[2] || 'YYYYMMDD';
        pattern = { type: RENAME_PATTERNS.DATE, format };
        break;

      case 'lowercase':
        pattern = { type: RENAME_PATTERNS.LOWERCASE };
        break;

      case 'uppercase':
        pattern = { type: RENAME_PATTERNS.UPPERCASE };
        break;

      case 'camelcase':
        pattern = { type: RENAME_PATTERNS.CAMELCASE };
        break;

      case 'regex':
        const regexPattern = args[2];
        const replacement = args[3];
        if (!regexPattern || !replacement) {
          console.error('❌ Pattern et replacement requis.');
          process.exit(1);
        }
        pattern = { type: RENAME_PATTERNS.REGEX, pattern: regexPattern, replacement };
        break;

      default:
        console.error(`❌ Commande inconnue : "${command}".`);
        process.exit(1);
    }

    console.log(`\n📝 RENOMMAGE${options.dryRun ? ' (DRY RUN)' : ''}\n${'─'.repeat(50)}`);
    console.log(`Répertoire : ${dirPath}`);
    console.log(`Pattern    : ${command}\n`);

    report = rename(dirPath, pattern, options);

    console.log(`Total      : ${report.total} fichier(s)`);
    console.log(`Renommés   : ${report.renamed}`);
    console.log(`Ignorés    : ${report.skipped}`);
    console.log(`Erreurs    : ${report.errors}`);

    if (options.verbose && report.details.length > 0) {
      console.log('\nDétails :');
      for (const detail of report.details.slice(0, 20)) {
        if (detail.action === 'error') {
          console.log(`  ❌ ${detail.old} : ${detail.error}`);
        } else if (detail.action === 'skipped') {
          console.log(`  ⊘  ${detail.old} (${detail.reason})`);
        } else {
          console.log(`  ✅ ${detail.old} → ${detail.new}`);
        }
      }
      if (report.details.length > 20) {
        console.log(`  ... et ${report.details.length - 20} autre(s)`);
      }
    }

    if (!options.dryRun && report.renamed > 0) {
      console.log('\n✅ Renommage terminé.');
    }

  } catch (err) {
    console.error(`\n❌ Erreur : ${err.message}`);
    process.exit(1);
  }
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  rename,
  scanFiles,
  applyPrefix,
  applySuffix,
  applyReplace,
  applySequential,
  applyDate,
  applyLowercase,
  applyUppercase,
  applyCamelCase,
  applyRegex,
  validateDirectory,
  validateOptions,
  RENAME_PATTERNS,
  DEFAULT_OPTIONS,
};

// Point d'entrée CLI
if (require.main === module) {
  runCLI();
}