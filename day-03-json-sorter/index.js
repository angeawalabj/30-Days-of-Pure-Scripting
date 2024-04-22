'use strict';

/**
 * ============================================================
 * DAY 03 — JSON Sorter (Deep Nested)
 * ============================================================
 * Algorithme  : Timsort (via Array.sort) + Deep comparison
 * Complexité  : O(n log n) temps | O(n) espace
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── Constantes ──────────────────────────────────────────────

const SORT_ORDER = {
  ASC:  'asc',
  DESC: 'desc',
};

const DATA_TYPES = {
  STRING:  'string',
  NUMBER:  'number',
  BOOLEAN: 'boolean',
  DATE:    'date',
  NULL:    'null',
  ARRAY:   'array',
  OBJECT:  'object',
};

// ─── Validation ──────────────────────────────────────────────

/**
 * Valide que l'input est un tableau d'objets.
 * @param {*} data
 * @throws {TypeError}
 */
function validateData(data) {
  if (!Array.isArray(data)) {
    throw new TypeError('L\'input doit être un tableau.');
  }
  if (data.length > 0 && typeof data[0] !== 'object') {
    throw new TypeError('Le tableau doit contenir des objets.');
  }
}

/**
 * Valide les critères de tri.
 * @param {Array<Object>} criteria
 * @throws {TypeError|Error}
 */
function validateCriteria(criteria) {
  if (!Array.isArray(criteria)) {
    throw new TypeError('Les critères doivent être un tableau.');
  }
  if (criteria.length === 0) {
    throw new Error('Au moins un critère de tri doit être fourni.');
  }

  for (const criterion of criteria) {
    if (typeof criterion !== 'object' || criterion === null) {
      throw new TypeError('Chaque critère doit être un objet.');
    }
    if (!criterion.key || typeof criterion.key !== 'string') {
      throw new Error('Chaque critère doit avoir une propriété "key" (string).');
    }
    if (criterion.order && ![SORT_ORDER.ASC, SORT_ORDER.DESC].includes(criterion.order)) {
      throw new Error(`L'ordre doit être "${SORT_ORDER.ASC}" ou "${SORT_ORDER.DESC}".`);
    }
  }
}

// ─── Accès Profond ───────────────────────────────────────────

/**
 * Accède à une propriété imbriquée via notation pointée.
 * Ex: getNestedValue({ user: { name: 'Alice' } }, 'user.name') → 'Alice'
 * 
 * @param {Object} obj
 * @param {string} path - Chemin avec notation pointée (ex: 'user.profile.age')
 * @returns {*}
 */
function getNestedValue(obj, path) {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }

  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    
    // Support des tableaux avec index [0]
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayKey, index] = arrayMatch;
      value = value[arrayKey];
      if (!Array.isArray(value)) {
        return undefined;
      }
      value = value[parseInt(index, 10)];
    } else {
      value = value[key];
    }
  }

  return value;
}

// ─── Détection de Type ───────────────────────────────────────

/**
 * Détecte le type d'une valeur pour le tri.
 * @param {*} value
 * @returns {string}
 */
function detectType(value) {
  if (value === null) return DATA_TYPES.NULL;
  if (value === undefined) return DATA_TYPES.NULL;
  if (Array.isArray(value)) return DATA_TYPES.ARRAY;
  if (value instanceof Date) return DATA_TYPES.DATE;
  
  const type = typeof value;
  if (type === 'string') {
    // Vérifier si c'est une date ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return DATA_TYPES.DATE;
      }
    }
    return DATA_TYPES.STRING;
  }
  
  if (type === 'number') return DATA_TYPES.NUMBER;
  if (type === 'boolean') return DATA_TYPES.BOOLEAN;
  if (type === 'object') return DATA_TYPES.OBJECT;
  
  return DATA_TYPES.STRING; // fallback
}

// ─── Comparaison ─────────────────────────────────────────────

/**
 * Compare deux valeurs selon leur type.
 * Retourne : -1 si a < b, 0 si a === b, 1 si a > b
 * 
 * @param {*} a
 * @param {*} b
 * @param {string} order - 'asc' ou 'desc'
 * @returns {number}
 */
function compareValues(a, b, order = SORT_ORDER.ASC) {
  // Gérer null/undefined : toujours en fin de liste
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;

  const typeA = detectType(a);
  const typeB = detectType(b);

  // Si types différents, trier par type
  if (typeA !== typeB) {
    const typeOrder = [
      DATA_TYPES.NUMBER,
      DATA_TYPES.STRING,
      DATA_TYPES.BOOLEAN,
      DATA_TYPES.DATE,
      DATA_TYPES.ARRAY,
      DATA_TYPES.OBJECT,
      DATA_TYPES.NULL,
    ];
    const result = typeOrder.indexOf(typeA) - typeOrder.indexOf(typeB);
    return order === SORT_ORDER.ASC ? result : -result;
  }

  // Comparaison selon le type
  let result = 0;

  switch (typeA) {
    case DATA_TYPES.NUMBER:
      result = a - b;
      break;

    case DATA_TYPES.STRING:
      result = a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
      break;

    case DATA_TYPES.BOOLEAN:
      result = (a === b) ? 0 : (a ? 1 : -1);
      break;

    case DATA_TYPES.DATE:
      const dateA = a instanceof Date ? a : new Date(a);
      const dateB = b instanceof Date ? b : new Date(b);
      result = dateA.getTime() - dateB.getTime();
      break;

    case DATA_TYPES.ARRAY:
      result = a.length - b.length; // Trier par longueur
      break;

    case DATA_TYPES.OBJECT:
      // Trier par nombre de clés
      result = Object.keys(a).length - Object.keys(b).length;
      break;

    default:
      result = 0;
  }

  return order === SORT_ORDER.ASC ? result : -result;
}

// ─── Tri Principal ──────────────────────────────────────────

/**
 * Trie un tableau d'objets selon plusieurs critères imbriqués.
 * 
 * @param {Array<Object>} data - Tableau d'objets à trier
 * @param {Array<Object>} criteria - Critères de tri
 *   Ex: [{ key: 'age', order: 'asc' }, { key: 'user.name', order: 'desc' }]
 * @param {Object} [options]
 * @param {boolean} [options.mutate=false] - Modifier le tableau original
 * @returns {Array<Object>}
 */
function sort(data, criteria, options = {}) {
  validateData(data);
  validateCriteria(criteria);

  const { mutate = false } = options;

  // Copie si non-mutating
  const dataCopy = mutate ? data : [...data];

  // Normaliser les critères
  const normalizedCriteria = criteria.map(c => ({
    key: c.key,
    order: c.order || SORT_ORDER.ASC,
  }));

  // Fonction de comparaison multi-critères
  dataCopy.sort((a, b) => {
    for (const criterion of normalizedCriteria) {
      const valueA = getNestedValue(a, criterion.key);
      const valueB = getNestedValue(b, criterion.key);

      const comparison = compareValues(valueA, valueB, criterion.order);
      
      // Si différent, on retourne immédiatement
      if (comparison !== 0) {
        return comparison;
      }
      // Sinon on passe au critère suivant
    }
    return 0; // Égalité complète
  });

  return dataCopy;
}

// ─── Tri Rapide (Query-like) ─────────────────────────────────

/**
 * Syntaxe simplifiée pour tri rapide.
 * Ex: sortBy(data, 'age', 'desc')
 * 
 * @param {Array<Object>} data
 * @param {string} key
 * @param {string} [order='asc']
 * @returns {Array<Object>}
 */
function sortBy(data, key, order = SORT_ORDER.ASC) {
  return sort(data, [{ key, order }]);
}

// ─── Groupement ──────────────────────────────────────────────

/**
 * Groupe les objets selon une clé.
 * Ex: groupBy([{age:20}, {age:30}, {age:20}], 'age')
 *   → { 20: [{age:20}, {age:20}], 30: [{age:30}] }
 * 
 * @param {Array<Object>} data
 * @param {string} key
 * @returns {Object}
 */
function groupBy(data, key) {
  validateData(data);

  const groups = {};

  for (const item of data) {
    const value = getNestedValue(item, key);
    const groupKey = value === null || value === undefined ? '__null__' : String(value);

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
  }

  return groups;
}

// ─── Statistiques ────────────────────────────────────────────

/**
 * Calcule des statistiques sur un champ numérique.
 * @param {Array<Object>} data
 * @param {string} key
 * @returns {Object} { min, max, avg, sum, count }
 */
function stats(data, key) {
  validateData(data);

  const values = data
    .map(item => getNestedValue(item, key))
    .filter(v => typeof v === 'number' && !isNaN(v));

  if (values.length === 0) {
    return { min: null, max: null, avg: null, sum: 0, count: 0 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const avg = sum / values.length;

  return {
    min,
    max,
    avg: parseFloat(avg.toFixed(2)),
    sum,
    count: values.length,
  };
}

// ─── CLI ─────────────────────────────────────────────────────

function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help') {
    console.log(`
Usage:
  node index.js sort <file.json> <key> [order]
  node index.js group <file.json> <key>
  node index.js stats <file.json> <key>

Exemples:
  node index.js sort data.json "age" "desc"
  node index.js sort data.json "user.profile.score" "asc"
  node index.js group data.json "category"
  node index.js stats data.json "price"

Le fichier JSON doit contenir un tableau d'objets.
    `);
    process.exit(0);
  }

  try {
    const fs = require('fs');

    if (command === 'sort') {
      const [, file, key, order = 'asc'] = args;
      if (!file || !key) {
        console.error('❌ Usage: node index.js sort <file.json> <key> [order]');
        process.exit(1);
      }

      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const sorted = sortBy(data, key, order);
      console.log(JSON.stringify(sorted, null, 2));

    } else if (command === 'group') {
      const [, file, key] = args;
      if (!file || !key) {
        console.error('❌ Usage: node index.js group <file.json> <key>');
        process.exit(1);
      }

      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const grouped = groupBy(data, key);
      console.log(JSON.stringify(grouped, null, 2));

    } else if (command === 'stats') {
      const [, file, key] = args;
      if (!file || !key) {
        console.error('❌ Usage: node index.js stats <file.json> <key>');
        process.exit(1);
      }

      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const statistics = stats(data, key);
      console.log('\n📊 STATISTIQUES\n' + '─'.repeat(40));
      console.log(`Champ   : ${key}`);
      console.log(`Min     : ${statistics.min}`);
      console.log(`Max     : ${statistics.max}`);
      console.log(`Moyenne : ${statistics.avg}`);
      console.log(`Somme   : ${statistics.sum}`);
      console.log(`Count   : ${statistics.count}`);

    } else {
      console.error(`❌ Commande inconnue : "${command}". Utilise sort, group, ou stats.`);
      process.exit(1);
    }

  } catch (err) {
    console.error(`\n❌ Erreur : ${err.message}`);
    process.exit(1);
  }
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  sort,
  sortBy,
  groupBy,
  stats,
  getNestedValue,
  compareValues,
  detectType,
  validateData,
  validateCriteria,
  SORT_ORDER,
  DATA_TYPES,
};

// Point d'entrée CLI
if (require.main === module) {
  runCLI();
}