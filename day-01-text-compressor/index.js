'use strict';

/**
 * ============================================================
 * DAY 01 — Text Compressor (Run-Length Encoding)
 * ============================================================
 * Algorithme  : Run-Length Encoding (RLE)
 * Complexité  : O(n) temps | O(n) espace
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── Constantes ──────────────────────────────────────────────
const MAX_INPUT_LENGTH = 1_000_000; // 1 million de caractères max
const ERRORS = {
  NOT_STRING:   'TypeError: l\'input doit être une chaîne de caractères.',
  TOO_LONG:     `RangeError: l\'input dépasse ${MAX_INPUT_LENGTH} caractères.`,
  NULL_INPUT:   'TypeError: l\'input ne peut pas être null ou undefined.',
};

// ─── Validation ───────────────────────────────────────────────

/**
 * Valide l'input avant traitement.
 * @param {*} input - Valeur à valider
 * @throws {TypeError|RangeError}
 */
function validateInput(input) {
  if (input === null || input === undefined) {
    throw new TypeError(ERRORS.NULL_INPUT);
  }
  if (typeof input !== 'string') {
    throw new TypeError(ERRORS.NOT_STRING);
  }
  if (input.length > MAX_INPUT_LENGTH) {
    throw new RangeError(ERRORS.TOO_LONG);
  }
}

// ─── Compression ─────────────────────────────────────────────

/**
 * Compresse une chaîne en utilisant l'algorithme RLE.
 * "aaabbc"  →  "3a2b1c"
 * "abc"     →  "1a1b1c"  (ou "abc" si noSingles=true)
 *
 * @param {string}  str        - Chaîne à compresser
 * @param {Object}  [options]
 * @param {boolean} [options.noSingles=false] - Omettre le "1" pour les chars uniques
 * @param {boolean} [options.caseSensitive=true] - Distinguer maj/min
 * @returns {{ result: string, ratio: number, saved: number }}
 */
function compress(str, options = {}) {
  validateInput(str);

  const { noSingles = false, caseSensitive = true } = options;

  // Chaîne vide → on retourne directement
  if (str.length === 0) {
    return { result: '', ratio: 1, saved: 0 };
  }

  const workStr = caseSensitive ? str : str.toLowerCase();

  let result = '';
  let count  = 1;

  for (let i = 1; i <= workStr.length; i++) {
    if (i < workStr.length && workStr[i] === workStr[i - 1]) {
      count++;
    } else {
      // On écrit le count uniquement si > 1 (ou si noSingles est false)
      result += (count === 1 && noSingles) ? workStr[i - 1] : `${count}${workStr[i - 1]}`;
      count = 1;
    }
  }

  // Ratio de compression : < 1 = compression efficace
  const ratio  = result.length / str.length;
  const saved  = str.length - result.length;

  return { result, ratio: parseFloat(ratio.toFixed(4)), saved };
}

// ─── Décompression ───────────────────────────────────────────

/**
 * Décompresse une chaîne RLE.
 * "3a2b1c"  →  "aaabbc"
 *
 * @param {string} str - Chaîne compressée
 * @returns {string}
 * @throws {SyntaxError} Si le format RLE est invalide
 */
function decompress(str) {
  validateInput(str);

  if (str.length === 0) return '';

  // Pattern : un ou plusieurs chiffres suivis d'un caractère unique (pas chiffre)
  const rlePattern = /^(\d+[^\d])+$/;

  if (!rlePattern.test(str)) {
    throw new SyntaxError(
      `SyntaxError: format RLE invalide. Attendu: "3a2b1c", reçu: "${str.slice(0, 20)}..."`
    );
  }

  // Extraction des paires (count, char)
  const pairPattern = /(\d+)([^\d])/g;
  let result = '';
  let match;

  while ((match = pairPattern.exec(str)) !== null) {
    const count = parseInt(match[1], 10);
    const char  = match[2];

    // Éviter les allocations massives (DoS protection)
    if (result.length + count > MAX_INPUT_LENGTH) {
      throw new RangeError(ERRORS.TOO_LONG);
    }

    result += char.repeat(count);
  }

  return result;
}

// ─── Analyse ─────────────────────────────────────────────────

/**
 * Analyse détaillée d'une chaîne :
 * fréquence de chaque caractère, entropie, runs max.
 *
 * @param {string} str
 * @returns {Object} Rapport d'analyse
 */
function analyze(str) {
  validateInput(str);

  if (str.length === 0) {
    return { length: 0, uniqueChars: 0, frequency: {}, entropy: 0, longestRun: null };
  }

  const frequency = {};
  let longestRun  = { char: str[0], count: 1 };
  let currentRun  = { char: str[0], count: 1 };

  for (let i = 1; i <= str.length; i++) {
    if (i < str.length && str[i] === str[i - 1]) {
      currentRun.count++;
    } else {
      if (currentRun.count > longestRun.count) {
        longestRun = { ...currentRun };
      }
      if (i < str.length) {
        currentRun = { char: str[i], count: 1 };
      }
    }

    const char = str[i - 1];
    frequency[char] = (frequency[char] || 0) + 1;
  }

  // Calcul de l'entropie de Shannon H = -Σ p(x) * log2(p(x))
  const n = str.length;
  let entropy = 0;
  for (const count of Object.values(frequency)) {
    const p = count / n;
    entropy -= p * Math.log2(p);
  }

  return {
    length:      str.length,
    uniqueChars: Object.keys(frequency).length,
    frequency,
    entropy:     parseFloat(entropy.toFixed(4)),
    longestRun,
  };
}

// ─── CLI ─────────────────────────────────────────────────────

/**
 * Interface en ligne de commande.
 * Usage :
 *   node index.js compress "aaabbc"
 *   node index.js compress "aaabbc" --no-singles
 *   node index.js decompress "3a2b1c"
 *   node index.js analyze "hello world"
 */
function runCLI() {
  const args    = process.argv.slice(2);
  const command = args[0];
  const input   = args[1];
  const flags   = args.slice(2);

  if (!command || !input) {
    console.log(`
Usage:
  node index.js compress   <texte> [--no-singles] [--case-insensitive]
  node index.js decompress <rle>
  node index.js analyze    <texte>

Exemples:
  node index.js compress "aaabbbcc"
  node index.js compress "aaabbbcc" --no-singles
  node index.js decompress "3a3b2c"
  node index.js analyze "hello world"
    `);
    process.exit(0);
  }

  try {
    switch (command.toLowerCase()) {
      case 'compress': {
        const options = {
          noSingles:     flags.includes('--no-singles'),
          caseSensitive: !flags.includes('--case-insensitive'),
        };
        const { result, ratio, saved } = compress(input, options);
        console.log('\n📦 COMPRESSION RLE');
        console.log('─'.repeat(40));
        console.log(`Input    : "${input}"`);
        console.log(`Output   : "${result}"`);
        console.log(`Ratio    : ${(ratio * 100).toFixed(1)}% de la taille originale`);
        console.log(`Économie : ${saved} caractère(s) ${saved > 0 ? '✅' : '(expansion ⚠️)'}`);
        break;
      }

      case 'decompress': {
        const result = decompress(input);
        console.log('\n📂 DÉCOMPRESSION RLE');
        console.log('─'.repeat(40));
        console.log(`Input  : "${input}"`);
        console.log(`Output : "${result}"`);
        break;
      }

      case 'analyze': {
        const report = analyze(input);
        console.log('\n🔬 ANALYSE');
        console.log('─'.repeat(40));
        console.log(`Longueur     : ${report.length} chars`);
        console.log(`Chars uniques: ${report.uniqueChars}`);
        console.log(`Entropie     : ${report.entropy} bits/char`);
        console.log(`Run le + long: "${report.longestRun.char}" × ${report.longestRun.count}`);
        console.log('\nFréquences :');
        const sorted = Object.entries(report.frequency).sort((a, b) => b[1] - a[1]);
        for (const [char, count] of sorted.slice(0, 10)) {
          const bar = '█'.repeat(Math.round((count / report.length) * 20));
          console.log(`  "${char === ' ' ? '(espace)' : char}" : ${bar} ${count}`);
        }
        break;
      }

      default:
        console.error(`❌ Commande inconnue : "${command}". Utilise compress, decompress, ou analyze.`);
        process.exit(1);
    }
  } catch (err) {
    console.error(`\n❌ Erreur : ${err.message}`);
    process.exit(1);
  }
}

// ─── Exports ─────────────────────────────────────────────────
module.exports = { compress, decompress, analyze, validateInput };

// Point d'entrée CLI
if (require.main === module) {
  runCLI();
}