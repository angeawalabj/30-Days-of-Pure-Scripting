'use strict';

/**
 * ============================================================
 * DAY 05 — Currency Converter (Real-time API)
 * ============================================================
 * Algorithme  : Conversion avec taux de change + Cache
 * Complexité  : O(1) pour conversion | O(n) pour récupération API
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Constantes ──────────────────────────────────────────────

const API_ENDPOINTS = {
  // API gratuite sans clé requise
  EXCHANGERATE: 'https://api.exchangerate-api.com/v4/latest/',
  
  // API alternative (nécessite une clé)
  // EXCHANGERATEAPI: 'https://v6.exchangerate-api.com/v6/YOUR_KEY/latest/',
};

const CACHE_FILE = path.join(__dirname, '.rates-cache.json');
const CACHE_DURATION = 3600 * 1000; // 1 heure en ms

const POPULAR_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'INR', 'MXN',
  'BRL', 'ZAR', 'RUB', 'KRW', 'TRY', 'SEK', 'NOK', 'DKK', 'PLN', 'THB',
];

// ─── Validation ──────────────────────────────────────────────

/**
 * Valide un code de devise (3 lettres majuscules).
 * @param {string} currency
 * @throws {Error}
 */
function validateCurrency(currency) {
  if (typeof currency !== 'string') {
    throw new TypeError('Le code devise doit être une chaîne.');
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error(`Code devise invalide : "${currency}". Format attendu : 3 lettres majuscules (ex: USD).`);
  }
}

/**
 * Valide un montant numérique.
 * @param {*} amount
 * @throws {TypeError|RangeError}
 */
function validateAmount(amount) {
  if (typeof amount !== 'number') {
    throw new TypeError('Le montant doit être un nombre.');
  }
  if (isNaN(amount) || !isFinite(amount)) {
    throw new TypeError('Le montant doit être un nombre valide.');
  }
  if (amount < 0) {
    throw new RangeError('Le montant ne peut pas être négatif.');
  }
}

// ─── Cache ───────────────────────────────────────────────────

/**
 * Sauvegarde les taux dans le cache.
 * @param {string} baseCurrency
 * @param {Object} rates
 */
function saveCache(baseCurrency, rates) {
  try {
    const cache = {
      base: baseCurrency,
      rates,
      timestamp: Date.now(),
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (err) {
    // Échec silencieux du cache (pas critique)
    console.warn('⚠️  Échec sauvegarde cache:', err.message);
  }
}

/**
 * Charge les taux depuis le cache si valide.
 * @param {string} baseCurrency
 * @returns {Object|null}
 */
function loadCache(baseCurrency) {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }

    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));

    // Vérifier que la base correspond
    if (cache.base !== baseCurrency) {
      return null;
    }

    // Vérifier que le cache n'est pas expiré
    const age = Date.now() - cache.timestamp;
    if (age > CACHE_DURATION) {
      return null;
    }

    return cache.rates;
  } catch (err) {
    return null;
  }
}

/**
 * Supprime le cache.
 */
function clearCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

// ─── Récupération des Taux ──────────────────────────────────

/**
 * Effectue une requête HTTPS GET.
 * @param {string} url
 * @returns {Promise<Object>}
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(new Error('Réponse JSON invalide.'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`Erreur réseau : ${err.message}`));
    });
  });
}

/**
 * Récupère les taux de change depuis l'API.
 * @param {string} baseCurrency
 * @param {Object} [options]
 * @param {boolean} [options.useCache=true]
 * @returns {Promise<Object>}
 */
async function fetchRates(baseCurrency, options = {}) {
  validateCurrency(baseCurrency);

  const { useCache = true } = options;

  // Vérifier le cache
  if (useCache) {
    const cached = loadCache(baseCurrency);
    if (cached) {
      return cached;
    }
  }

  // Récupérer depuis l'API
  try {
    const url = `${API_ENDPOINTS.EXCHANGERATE}${baseCurrency}`;
    const response = await httpsGet(url);

    if (!response.rates) {
      throw new Error('Format de réponse API invalide.');
    }

    // Sauvegarder dans le cache
    saveCache(baseCurrency, response.rates);

    return response.rates;
  } catch (err) {
    throw new Error(`Impossible de récupérer les taux : ${err.message}`);
  }
}

// ─── Conversion ──────────────────────────────────────────────

/**
 * Convertit un montant d'une devise à une autre.
 * 
 * @param {number} amount
 * @param {string} from
 * @param {string} to
 * @param {Object} [options]
 * @param {boolean} [options.useCache=true]
 * @returns {Promise<Object>}
 */
async function convert(amount, from, to, options = {}) {
  validateAmount(amount);
  validateCurrency(from);
  validateCurrency(to);

  // Conversion identique
  if (from === to) {
    return {
      amount,
      from,
      to,
      result: amount,
      rate: 1,
      timestamp: new Date().toISOString(),
    };
  }

  // Récupérer les taux
  const rates = await fetchRates(from, options);

  // Vérifier que la devise cible existe
  if (!rates[to]) {
    throw new Error(`Devise "${to}" non disponible pour la base "${from}".`);
  }

  const rate = rates[to];
  const result = amount * rate;

  return {
    amount,
    from,
    to,
    result: parseFloat(result.toFixed(2)),
    rate: parseFloat(rate.toFixed(6)),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Convertit un montant vers plusieurs devises.
 * 
 * @param {number} amount
 * @param {string} from
 * @param {Array<string>} toCurrencies
 * @param {Object} [options]
 * @returns {Promise<Array<Object>>}
 */
async function convertMultiple(amount, from, toCurrencies, options = {}) {
  validateAmount(amount);
  validateCurrency(from);

  if (!Array.isArray(toCurrencies)) {
    throw new TypeError('toCurrencies doit être un tableau.');
  }

  // Récupérer les taux une seule fois
  const rates = await fetchRates(from, options);

  const results = [];

  for (const to of toCurrencies) {
    validateCurrency(to);

    if (from === to) {
      results.push({
        amount,
        from,
        to,
        result: amount,
        rate: 1,
      });
      continue;
    }

    if (!rates[to]) {
      results.push({
        amount,
        from,
        to,
        result: null,
        rate: null,
        error: `Devise "${to}" non disponible.`,
      });
      continue;
    }

    const rate = rates[to];
    const result = amount * rate;

    results.push({
      amount,
      from,
      to,
      result: parseFloat(result.toFixed(2)),
      rate: parseFloat(rate.toFixed(6)),
    });
  }

  return results;
}

// ─── Comparaison ─────────────────────────────────────────────

/**
 * Compare le pouvoir d'achat entre deux devises.
 * 
 * @param {number} amount
 * @param {string} currency1
 * @param {string} currency2
 * @param {Object} [options]
 * @returns {Promise<Object>}
 */
async function compare(amount, currency1, currency2, options = {}) {
  validateAmount(amount);
  validateCurrency(currency1);
  validateCurrency(currency2);

  const conv1 = await convert(amount, currency1, currency2, options);
  const conv2 = await convert(amount, currency2, currency1, options);

  return {
    amount,
    currency1,
    currency2,
    [`${currency1}_to_${currency2}`]: conv1.result,
    [`${currency2}_to_${currency1}`]: conv2.result,
    rate1to2: conv1.rate,
    rate2to1: conv2.rate,
    stronger: conv1.result > amount ? currency1 : currency2,
  };
}

// ─── Liste des Devises ──────────────────────────────────────

/**
 * Liste toutes les devises disponibles.
 * 
 * @param {string} [baseCurrency='USD']
 * @param {Object} [options]
 * @returns {Promise<Array<string>>}
 */
async function listCurrencies(baseCurrency = 'USD', options = {}) {
  validateCurrency(baseCurrency);

  const rates = await fetchRates(baseCurrency, options);
  return Object.keys(rates).sort();
}

// ─── CLI ─────────────────────────────────────────────────────

async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help') {
    console.log(`
Usage:
  node index.js convert <amount> <from> <to>
  node index.js multi <amount> <from> <to1> <to2> ...
  node index.js compare <amount> <currency1> <currency2>
  node index.js list [base]
  node index.js clear-cache

Exemples:
  node index.js convert 100 USD EUR
  node index.js multi 100 USD EUR GBP JPY
  node index.js compare 100 USD EUR
  node index.js list USD
  node index.js clear-cache

Devises populaires : ${POPULAR_CURRENCIES.join(', ')}
    `);
    process.exit(0);
  }

  try {
    if (command === 'convert') {
      const [, amount, from, to] = args;
      if (!amount || !from || !to) {
        console.error('❌ Usage: node index.js convert <amount> <from> <to>');
        process.exit(1);
      }

      const result = await convert(parseFloat(amount), from.toUpperCase(), to.toUpperCase());

      console.log('\n💱 CONVERSION\n' + '─'.repeat(50));
      console.log(`${result.amount} ${result.from} = ${result.result} ${result.to}`);
      console.log(`Taux : 1 ${result.from} = ${result.rate} ${result.to}`);
      console.log(`Date : ${new Date(result.timestamp).toLocaleString()}`);

    } else if (command === 'multi') {
      const [, amount, from, ...toCurrencies] = args;
      if (!amount || !from || toCurrencies.length === 0) {
        console.error('❌ Usage: node index.js multi <amount> <from> <to1> <to2> ...');
        process.exit(1);
      }

      const results = await convertMultiple(
        parseFloat(amount),
        from.toUpperCase(),
        toCurrencies.map(c => c.toUpperCase())
      );

      console.log('\n💱 CONVERSIONS MULTIPLES\n' + '─'.repeat(50));
      console.log(`Base : ${amount} ${from.toUpperCase()}\n`);

      for (const res of results) {
        if (res.error) {
          console.log(`  ${res.to} : ❌ ${res.error}`);
        } else {
          console.log(`  ${res.to} : ${res.result} (taux: ${res.rate})`);
        }
      }

    } else if (command === 'compare') {
      const [, amount, currency1, currency2] = args;
      if (!amount || !currency1 || !currency2) {
        console.error('❌ Usage: node index.js compare <amount> <currency1> <currency2>');
        process.exit(1);
      }

      const result = await compare(
        parseFloat(amount),
        currency1.toUpperCase(),
        currency2.toUpperCase()
      );

      console.log('\n⚖️  COMPARAISON\n' + '─'.repeat(50));
      console.log(`${result.amount} ${result.currency1} = ${result[`${result.currency1}_to_${result.currency2}`]} ${result.currency2}`);
      console.log(`${result.amount} ${result.currency2} = ${result[`${result.currency2}_to_${result.currency1}`]} ${result.currency1}`);
      console.log(`\nDevise la plus forte : ${result.stronger}`);

    } else if (command === 'list') {
      const base = args[1] ? args[1].toUpperCase() : 'USD';
      const currencies = await listCurrencies(base);

      console.log(`\n📋 DEVISES DISPONIBLES (base: ${base})\n` + '─'.repeat(50));
      console.log(`Total : ${currencies.length} devises\n`);

      // Afficher en colonnes
      const columns = 5;
      for (let i = 0; i < currencies.length; i += columns) {
        const row = currencies.slice(i, i + columns);
        console.log(row.join('  '));
      }

    } else if (command === 'clear-cache') {
      const cleared = clearCache();
      if (cleared) {
        console.log('✅ Cache supprimé.');
      } else {
        console.log('ℹ️  Aucun cache à supprimer.');
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
  convert,
  convertMultiple,
  compare,
  listCurrencies,
  fetchRates,
  validateCurrency,
  validateAmount,
  clearCache,
  saveCache,
  loadCache,
  POPULAR_CURRENCIES,
  CACHE_DURATION,
};

// Point d'entrée CLI
if (require.main === module) {
  runCLI().catch(err => {
    console.error('Erreur fatale:', err.message);
    process.exit(1);
  });
}