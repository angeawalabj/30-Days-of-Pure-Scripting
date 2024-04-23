'use strict';

/**
 * ============================================================
 * DAY 04 — Palindrome & Anagram Detector
 * ============================================================
 * Algorithmes : Two-Pointer + Hash Map + Sorting
 * Complexité  : O(n) pour palindrome | O(n log n) pour anagramme
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── Constantes ──────────────────────────────────────────────

const NORMALIZATION = {
  removeSpaces:      true,
  removePunctuation: true,
  caseInsensitive:   true,
  removeAccents:     true,
};

// ─── Validation ──────────────────────────────────────────────

/**
 * Valide qu'une valeur est une chaîne non-vide.
 * @param {*} value
 * @param {string} paramName
 * @throws {TypeError|Error}
 */
function validateString(value, paramName = 'input') {
  if (typeof value !== 'string') {
    throw new TypeError(`${paramName} doit être une chaîne de caractères.`);
  }
  if (value.length === 0) {
    throw new Error(`${paramName} ne peut pas être vide.`);
  }
}

/**
 * Valide un tableau de chaînes non-vides.
 * @param {*} array
 * @throws {TypeError|Error}
 */
function validateStringArray(array) {
  if (!Array.isArray(array)) {
    throw new TypeError('L\'input doit être un tableau.');
  }
  if (array.length === 0) {
    throw new Error('Le tableau ne peut pas être vide.');
  }
  for (const item of array) {
    if (typeof item !== 'string') {
      throw new TypeError('Le tableau doit contenir uniquement des chaînes.');
    }
  }
}

// ─── Normalisation ───────────────────────────────────────────

/**
 * Normalise une chaîne pour la comparaison.
 * 
 * @param {string} str
 * @param {Object} options
 * @param {boolean} [options.removeSpaces=true]
 * @param {boolean} [options.removePunctuation=true]
 * @param {boolean} [options.caseInsensitive=true]
 * @param {boolean} [options.removeAccents=true]
 * @returns {string}
 */
function normalize(str, options = {}) {
  const opts = { ...NORMALIZATION, ...options };
  let normalized = str;

  // Minuscules d'abord
  if (opts.caseInsensitive) {
    normalized = normalized.toLowerCase();
  }

  // Retirer les accents
  if (opts.removeAccents) {
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Retirer les espaces
  if (opts.removeSpaces) {
    normalized = normalized.replace(/\s+/g, '');
  }

  // Retirer la ponctuation (tout sauf lettres et chiffres)
  if (opts.removePunctuation) {
    normalized = normalized.replace(/[^a-z0-9]/gi, '');
  }

  return normalized;
}

// ─── Palindrome ──────────────────────────────────────────────

/**
 * Vérifie si une chaîne est un palindrome.
 * Algorithme : Two-Pointer (O(n))
 * 
 * @param {string} str
 * @param {Object} [options]
 * @returns {boolean}
 */
function isPalindrome(str, options = {}) {
  validateString(str);

  const normalized = normalize(str, options);

  if (normalized.length === 0) {
    return false; // Chaîne vide après normalisation
  }

  let left = 0;
  let right = normalized.length - 1;

  while (left < right) {
    if (normalized[left] !== normalized[right]) {
      return false;
    }
    left++;
    right--;
  }

  return true;
}

/**
 * Analyse détaillée d'un palindrome.
 * 
 * @param {string} str
 * @param {Object} [options]
 * @returns {Object}
 */
function analyzePalindrome(str, options = {}) {
  validateString(str);

  const normalized = normalize(str, options);
  const isValid = isPalindrome(str, options);

  // Trouver le centre
  const mid = Math.floor(normalized.length / 2);
  const isOddLength = normalized.length % 2 === 1;
  const center = isOddLength ? normalized[mid] : null;

  // Trouver le plus long sous-palindrome
  const longestSubPalindrome = findLongestPalindrome(normalized);

  return {
    isPalindrome: isValid,
    original: str,
    normalized,
    length: normalized.length,
    center,
    isOddLength,
    longestSubPalindrome,
  };
}

/**
 * Trouve le plus long sous-palindrome dans une chaîne.
 * Algorithme : Expand Around Center (O(n²))
 * 
 * @param {string} str
 * @returns {string}
 */
function findLongestPalindrome(str) {
  if (str.length === 0) return '';

  let longest = str[0];

  const expandAroundCenter = (left, right) => {
    while (left >= 0 && right < str.length && str[left] === str[right]) {
      left--;
      right++;
    }
    return str.slice(left + 1, right);
  };

  for (let i = 0; i < str.length; i++) {
    // Palindrome de longueur impaire (centre = 1 char)
    const odd = expandAroundCenter(i, i);
    if (odd.length > longest.length) {
      longest = odd;
    }

    // Palindrome de longueur paire (centre = 2 chars)
    const even = expandAroundCenter(i, i + 1);
    if (even.length > longest.length) {
      longest = even;
    }
  }

  return longest;
}

// ─── Anagramme ───────────────────────────────────────────────

/**
 * Vérifie si deux chaînes sont des anagrammes.
 * Algorithme : Frequency Map (O(n))
 * 
 * @param {string} str1
 * @param {string} str2
 * @param {Object} [options]
 * @returns {boolean}
 */
function isAnagram(str1, str2, options = {}) {
  validateString(str1, 'str1');
  validateString(str2, 'str2');

  const norm1 = normalize(str1, options);
  const norm2 = normalize(str2, options);

  // Longueurs différentes = pas anagramme
  if (norm1.length !== norm2.length) {
    return false;
  }

  // Créer une frequency map pour str1
  const freq = {};
  for (const char of norm1) {
    freq[char] = (freq[char] || 0) + 1;
  }

  // Décrémenter avec str2
  for (const char of norm2) {
    if (!freq[char]) {
      return false; // Caractère absent ou trop de fois
    }
    freq[char]--;
  }

  // Vérifier que toutes les fréquences sont à 0
  return Object.values(freq).every(count => count === 0);
}

/**
 * Trouve tous les anagrammes d'un mot dans une liste.
 * 
 * @param {string} word
 * @param {Array<string>} wordList
 * @param {Object} [options]
 * @returns {Array<string>}
 */
function findAnagrams(word, wordList, options = {}) {
  validateString(word);
  validateStringArray(wordList);

  const anagrams = [];

  for (const candidate of wordList) {
    if (candidate !== word && isAnagram(word, candidate, options)) {
      anagrams.push(candidate);
    }
  }

  return anagrams;
}

/**
 * Groupe les anagrammes ensemble.
 * Ex: ['eat', 'tea', 'tan', 'ate', 'nat', 'bat']
 *   → [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]
 * 
 * @param {Array<string>} words
 * @param {Object} [options]
 * @returns {Array<Array<string>>}
 */
function groupAnagrams(words, options = {}) {
  validateStringArray(words);

  const groups = new Map();

  for (const word of words) {
    // Signature = chaîne triée (ex: "eat" → "aet")
    const normalized = normalize(word, options);
    const signature = normalized.split('').sort().join('');

    if (!groups.has(signature)) {
      groups.set(signature, []);
    }
    groups.get(signature).push(word);
  }

  return Array.from(groups.values());
}

// ─── Utilitaires ─────────────────────────────────────────────

/**
 * Compte la fréquence de chaque caractère.
 * 
 * @param {string} str
 * @param {Object} [options]
 * @returns {Object}
 */
function charFrequency(str, options = {}) {
  validateString(str);

  const normalized = normalize(str, options);
  const freq = {};

  for (const char of normalized) {
    freq[char] = (freq[char] || 0) + 1;
  }

  return freq;
}

/**
 * Vérifie si une chaîne peut être réarrangée en palindrome.
 * Condition : au plus 1 caractère avec fréquence impaire.
 * 
 * @param {string} str
 * @param {Object} [options]
 * @returns {boolean}
 */
function canBePalindrome(str, options = {}) {
  validateString(str);

  const freq = charFrequency(str, options);
  const oddCount = Object.values(freq).filter(count => count % 2 === 1).length;

  return oddCount <= 1;
}

/**
 * Génère tous les palindromes possibles d'une chaîne.
 * (Permutations avec contrainte palindrome)
 * 
 * @param {string} str
 * @param {Object} [options]
 * @returns {Array<string>}
 */
function generatePalindromes(str, options = {}) {
  validateString(str);

  const normalized = normalize(str, options);

  if (!canBePalindrome(normalized)) {
    return []; // Impossible de faire un palindrome
  }

  const freq = charFrequency(normalized, options);
  const half = [];
  let middle = '';

  // Séparer en moitié + centre
  for (const [char, count] of Object.entries(freq)) {
    const halfCount = Math.floor(count / 2);
    for (let i = 0; i < halfCount; i++) {
      half.push(char);
    }
    if (count % 2 === 1) {
      middle = char;
    }
  }

  // Générer toutes les permutations de la moitié
  const permutations = permute(half);
  const palindromes = new Set();

  for (const perm of permutations) {
    const palindrome = perm.join('') + middle + perm.reverse().join('');
    palindromes.add(palindrome);
  }

  return Array.from(palindromes);
}

/**
 * Génère toutes les permutations d'un tableau.
 * @param {Array} arr
 * @returns {Array<Array>}
 */
function permute(arr) {
  if (arr.length === 0) return [[]];
  if (arr.length === 1) return [arr];

  const result = [];

  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const perms = permute(remaining);

    for (const perm of perms) {
      result.push([current, ...perm]);
    }
  }

  return result;
}

// ─── CLI ─────────────────────────────────────────────────────

function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help') {
    console.log(`
Usage:
  node index.js palindrome <text>
  node index.js anagram <word1> <word2>
  node index.js find-anagrams <word> <word1> <word2> ...
  node index.js group-anagrams <word1> <word2> ...
  node index.js can-be-palindrome <text>

Exemples:
  node index.js palindrome "A man a plan a canal Panama"
  node index.js anagram "listen" "silent"
  node index.js find-anagrams "eat" "tea" "tan" "ate" "nat" "bat"
  node index.js group-anagrams "eat" "tea" "tan" "ate" "nat" "bat"
  node index.js can-be-palindrome "racecar"
    `);
    process.exit(0);
  }

  try {
    if (command === 'palindrome') {
      const text = args.slice(1).join(' ');
      if (!text) {
        console.error('❌ Usage: node index.js palindrome <text>');
        process.exit(1);
      }

      const result = analyzePalindrome(text);

      console.log('\n🔄 ANALYSE PALINDROME\n' + '─'.repeat(50));
      console.log(`Texte original  : "${result.original}"`);
      console.log(`Normalisé       : "${result.normalized}"`);
      console.log(`Est palindrome  : ${result.isPalindrome ? '✅ OUI' : '❌ NON'}`);
      console.log(`Longueur        : ${result.length}`);
      console.log(`Centre          : ${result.center || '(aucun - longueur paire)'}`);
      console.log(`Plus long sous  : "${result.longestSubPalindrome}"`);

    } else if (command === 'anagram') {
      const [, word1, word2] = args;
      if (!word1 || !word2) {
        console.error('❌ Usage: node index.js anagram <word1> <word2>');
        process.exit(1);
      }

      const result = isAnagram(word1, word2);

      console.log('\n🔀 DÉTECTION ANAGRAMME\n' + '─'.repeat(50));
      console.log(`"${word1}" ↔ "${word2}"`);
      console.log(`Résultat : ${result ? '✅ ANAGRAMMES' : '❌ PAS ANAGRAMMES'}`);

    } else if (command === 'find-anagrams') {
      const [, word, ...wordList] = args;
      if (!word || wordList.length === 0) {
        console.error('❌ Usage: node index.js find-anagrams <word> <word1> <word2> ...');
        process.exit(1);
      }

      const anagrams = findAnagrams(word, wordList);

      console.log('\n🔍 RECHERCHE ANAGRAMMES\n' + '─'.repeat(50));
      console.log(`Mot de référence : "${word}"`);
      console.log(`Anagrammes trouvés : ${anagrams.length}`);
      if (anagrams.length > 0) {
        anagrams.forEach(a => console.log(`  • ${a}`));
      }

    } else if (command === 'group-anagrams') {
      const words = args.slice(1);
      if (words.length === 0) {
        console.error('❌ Usage: node index.js group-anagrams <word1> <word2> ...');
        process.exit(1);
      }

      const groups = groupAnagrams(words);

      console.log('\n📦 GROUPEMENT ANAGRAMMES\n' + '─'.repeat(50));
      groups.forEach((group, i) => {
        console.log(`Groupe ${i + 1} : [${group.join(', ')}]`);
      });

    } else if (command === 'can-be-palindrome') {
      const text = args.slice(1).join(' ');
      if (!text) {
        console.error('❌ Usage: node index.js can-be-palindrome <text>');
        process.exit(1);
      }

      const result = canBePalindrome(text);
      const freq = charFrequency(text);

      console.log('\n🔧 PEUT DEVENIR PALINDROME\n' + '─'.repeat(50));
      console.log(`Texte   : "${text}"`);
      console.log(`Résultat: ${result ? '✅ OUI' : '❌ NON'}`);
      console.log('\nFréquences :');
      for (const [char, count] of Object.entries(freq)) {
        console.log(`  "${char}" : ${count} ${count % 2 === 1 ? '(impair ⚠️)' : ''}`);
      }

    } else {
      console.error(`❌ Commande inconnue : "${command}".`);
      process.exit(1);
    }

  } catch (err) {
    console.error(`\n❌ Erreur : ${err.message}`);
    process.exit(1);
  }
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  isPalindrome,
  analyzePalindrome,
  findLongestPalindrome,
  isAnagram,
  findAnagrams,
  groupAnagrams,
  charFrequency,
  canBePalindrome,
  generatePalindromes,
  normalize,
  validateString,
  validateStringArray,
};

// Point d'entrée CLI
if (require.main === module) {
  runCLI();
}