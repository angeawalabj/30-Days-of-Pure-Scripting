'use strict';

const crypto = require('crypto');

/**
 * ============================================================
 * DAY 02 — Password Generator Ultra-Sécurisé
 * ============================================================
 * Génère des mots de passe cryptographiquement sûrs
 * Évalue la force avec entropie et critères NIST
 * Author : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── Constantes ──────────────────────────────────────────────

const CHARSETS = {
  lowercase:  'abcdefghijklmnopqrstuvwxyz',
  uppercase:  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits:     '0123456789',
  special:    '!@#$%^&*()_+-=[]{}|;:,.<>?',
  ambiguous:  'il1Lo0O',
};

const DEFAULTS = {
  length:         16,
  minLength:      8,
  maxLength:      128,
  includeUpper:   true,
  includeLower:   true,
  includeDigits:  true,
  includeSpecial: true,
  excludeAmbiguous: false,
};

const STRENGTH_LEVELS = {
  VERY_WEAK: { min: 0,   max: 30,  label: 'Très faible', emoji: '🔴' },
  WEAK:      { min: 30,  max: 50,  label: 'Faible',      emoji: '🟠' },
  MODERATE:  { min: 50,  max: 70,  label: 'Moyen',       emoji: '🟡' },
  STRONG:    { min: 70,  max: 90,  label: 'Fort',        emoji: '🟢' },
  VERY_STRONG:{min: 90,  max: Infinity, label: 'Très fort', emoji: '🔵' },
};

const ERRORS = {
  INVALID_LENGTH: 'La longueur doit être entre 8 et 128 caractères.',
  NO_CHARSET:     'Au moins un type de caractères doit être activé.',
  WEAK_PASSWORD:  'Le mot de passe généré est trop faible. Réessayez.',
};

function validateOptions(options) {
  const { length, includeUpper, includeLower, includeDigits, includeSpecial } = options;
  if (typeof length !== 'number' || length < DEFAULTS.minLength || length > DEFAULTS.maxLength) {
    throw new RangeError(ERRORS.INVALID_LENGTH);
  }
  if (!includeUpper && !includeLower && !includeDigits && !includeSpecial) {
    throw new Error(ERRORS.NO_CHARSET);
  }
}

function buildCharset(options) {
  let charset = '';
  if (options.includeLower)   charset += CHARSETS.lowercase;
  if (options.includeUpper)   charset += CHARSETS.uppercase;
  if (options.includeDigits)  charset += CHARSETS.digits;
  if (options.includeSpecial) charset += CHARSETS.special;
  if (options.excludeAmbiguous) {
    charset = charset.split('').filter(c => !CHARSETS.ambiguous.includes(c)).join('');
  }
  return charset;
}

function generate(options = {}) {
  const opts = { ...DEFAULTS, ...options };
  validateOptions(opts);
  const charset = buildCharset(opts);
  const charsetSize = charset.length;
  let password = '';
  const randomBytes = crypto.randomBytes(opts.length * 2);
  for (let i = 0; password.length < opts.length; i++) {
    const randomByte = randomBytes[i];
    const threshold = Math.floor(256 / charsetSize) * charsetSize;
    if (randomByte < threshold) {
      password += charset[randomByte % charsetSize];
    }
  }
  const strength = evaluateStrength(password, charset);
  if (opts.minStrength && strength.entropy < opts.minStrength) {
    if ((opts._retries || 0) > 10) throw new Error(ERRORS.WEAK_PASSWORD);
    return generate({ ...opts, _retries: (opts._retries || 0) + 1 });
  }
  return { password, strength };
}

function evaluateStrength(password, charset) {
  if (!password || typeof password !== 'string') {
    throw new TypeError('Le mot de passe doit être une chaîne non vide.');
  }
  if (!charset) {
    charset = '';
    if (/[a-z]/.test(password)) charset += CHARSETS.lowercase;
    if (/[A-Z]/.test(password)) charset += CHARSETS.uppercase;
    if (/[0-9]/.test(password)) charset += CHARSETS.digits;
    if (/[^a-zA-Z0-9]/.test(password)) charset += CHARSETS.special;
  }
  const charsetSize = charset.length;
  const length = password.length;
  const entropy = Math.log2(Math.pow(charsetSize, length));
  let penalties = 0;
  const consecutiveRepeats = (password.match(/(.)\1{2,}/g) || []).length;
  penalties += consecutiveRepeats * 5;
  const sequences = /abc|bcd|cde|123|234|345|456|567|678|789/gi;
  penalties += (password.match(sequences) || []).length * 10;
  const commonWords = ['password', 'admin', '1234', 'qwerty', 'letmein', 'welcome', 'monkey'];
  const hasCommonWord = commonWords.some(word => password.toLowerCase().includes(word));
  if (hasCommonWord) penalties += 20;
  const adjustedEntropy = Math.max(0, entropy - penalties);
  let level = STRENGTH_LEVELS.VERY_WEAK;
  for (const [key, val] of Object.entries(STRENGTH_LEVELS)) {
    if (adjustedEntropy >= val.min && adjustedEntropy < val.max) {
      level = val;
      break;
    }
  }
  const combinations = Math.pow(charsetSize, length);
  const secondsToCrack = combinations / 1e9;
  const timeToCrack = formatTime(secondsToCrack);
  return {
    entropy: parseFloat(adjustedEntropy.toFixed(2)),
    level: level.label,
    emoji: level.emoji,
    charsetSize,
    length,
    penalties,
    timeToCrack,
    score: Math.round((adjustedEntropy / 120) * 100),
  };
}

function formatTime(seconds) {
  if (seconds < 1) return '< 1 seconde';
  if (seconds < 60) return Math.round(seconds) + ' secondes';
  if (seconds < 3600) return Math.round(seconds / 60) + ' minutes';
  if (seconds < 86400) return Math.round(seconds / 3600) + ' heures';
  if (seconds < 31536000) return Math.round(seconds / 86400) + ' jours';
  if (seconds < 31536000 * 1000) return Math.round(seconds / 31536000) + ' ans';
  return '> 1000 ans (incassable)';
}

function generateBatch(count, options = {}) {
  if (typeof count !== 'number' || count < 1 || count > 100) {
    throw new RangeError('Le nombre doit être entre 1 et 100.');
  }
  return Array.from({ length: count }, () => generate(options));
}

function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];
  if (command === 'evaluate' && args[1]) {
    const password = args[1];
    const strength = evaluateStrength(password);
    console.log('\n🔐 ÉVALUATION DE MOT DE PASSE');
    console.log('─'.repeat(50));
    console.log('Mot de passe :', '"' + password + '"');
    console.log('Longueur     :', strength.length, 'caractères');
    console.log('Charset      :', strength.charsetSize, 'caractères possibles');
    console.log('Entropie     :', strength.entropy, 'bits');
    console.log('Force        :', strength.emoji, strength.level, '(' + strength.score + '/100)');
    console.log('Pénalités    : -' + strength.penalties, 'bits (patterns faibles)');
    console.log('Temps cassage:', strength.timeToCrack, '(bruteforce 1B/sec)');
    console.log('\n💡 Conseils :');
    if (strength.length < 12) console.log('  ⚠️  Augmente la longueur à au moins 12 caractères');
    if (strength.penalties > 10) console.log('  ⚠️  Évite les répétitions et séquences évidentes');
    if (strength.score < 70) console.log('  ⚠️  Ajoute plus de variété (maj, min, chiffres, spéciaux)');
    if (strength.score >= 90) console.log('  ✅ Excellent mot de passe !');
    return;
  }
  const options = {};
  let batchCount = 1;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--length' && args[i + 1]) options.length = parseInt(args[++i], 10);
    else if (arg === '--no-upper') options.includeUpper = false;
    else if (arg === '--no-lower') options.includeLower = false;
    else if (arg === '--no-digits') options.includeDigits = false;
    else if (arg === '--no-special') options.includeSpecial = false;
    else if (arg === '--exclude-ambiguous') options.excludeAmbiguous = true;
    else if (arg === '--min-strength' && args[i + 1]) options.minStrength = parseFloat(args[++i]);
    else if (arg === '--batch' && args[i + 1]) batchCount = parseInt(args[++i], 10);
  }
  try {
    if (batchCount > 1) {
      console.log('\n🔑 GÉNÉRATION DE ' + batchCount + ' MOTS DE PASSE\n');
      const results = generateBatch(batchCount, options);
      results.forEach((res, idx) => {
        console.log((idx + 1) + '. ' + res.password);
        console.log('   ' + res.strength.emoji + ' ' + res.strength.level + ' · ' + res.strength.entropy + ' bits\n');
      });
    } else {
      const { password, strength } = generate(options);
      console.log('\n🔑 MOT DE PASSE GÉNÉRÉ');
      console.log('─'.repeat(50));
      console.log('Password :', password);
      console.log('Force    :', strength.emoji, strength.level, '(' + strength.score + '/100)');
      console.log('Entropie :', strength.entropy, 'bits');
      console.log('Cassage  :', strength.timeToCrack);
    }
    console.log('\n💡 Usage:');
    console.log('  node index.js --length 20');
    console.log('  node index.js --no-special --exclude-ambiguous');
    console.log('  node index.js --batch 5 --min-strength 80');
    console.log('  node index.js evaluate "YourPassword123!"');
  } catch (err) {
    console.error('\n❌ Erreur :', err.message);
    process.exit(1);
  }
}

module.exports = {
  generate,
  generateBatch,
  evaluateStrength,
  validateOptions,
  buildCharset,
  CHARSETS,
  DEFAULTS,
  STRENGTH_LEVELS,
};

if (require.main === module) {
  runCLI();
}