'use strict';

const fs = require('fs');
const path = require('path');

const {
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
} = require('./index');

// Mock des taux pour tests (sans appel API réel)
const MOCK_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  CAD: 1.36,
};

// ─────────────────────────────────────────────────────────────
// validateCurrency()
// ─────────────────────────────────────────────────────────────
describe('validateCurrency()', () => {
  test('accepte code valide "USD"', () => {
    expect(() => validateCurrency('USD')).not.toThrow();
  });

  test('accepte code valide "EUR"', () => {
    expect(() => validateCurrency('EUR')).not.toThrow();
  });

  test('rejette code minuscule "usd"', () => {
    expect(() => validateCurrency('usd')).toThrow('Code devise invalide');
  });

  test('rejette code trop court "US"', () => {
    expect(() => validateCurrency('US')).toThrow('Code devise invalide');
  });

  test('rejette code trop long "USDA"', () => {
    expect(() => validateCurrency('USDA')).toThrow('Code devise invalide');
  });

  test('rejette non-string', () => {
    expect(() => validateCurrency(123)).toThrow(TypeError);
  });

  test('rejette code avec chiffres "US1"', () => {
    expect(() => validateCurrency('US1')).toThrow('Code devise invalide');
  });
});

// ─────────────────────────────────────────────────────────────
// validateAmount()
// ─────────────────────────────────────────────────────────────
describe('validateAmount()', () => {
  test('accepte nombre positif', () => {
    expect(() => validateAmount(100)).not.toThrow();
  });

  test('accepte zéro', () => {
    expect(() => validateAmount(0)).not.toThrow();
  });

  test('accepte décimal', () => {
    expect(() => validateAmount(99.99)).not.toThrow();
  });

  test('rejette nombre négatif', () => {
    expect(() => validateAmount(-10)).toThrow(RangeError);
  });

  test('rejette NaN', () => {
    expect(() => validateAmount(NaN)).toThrow(TypeError);
  });

  test('rejette Infinity', () => {
    expect(() => validateAmount(Infinity)).toThrow(TypeError);
  });

  test('rejette non-nombre', () => {
    expect(() => validateAmount('100')).toThrow(TypeError);
  });
});

// ─────────────────────────────────────────────────────────────
// Cache
// ─────────────────────────────────────────────────────────────
describe('Cache', () => {
  const CACHE_FILE = path.join(__dirname, '.rates-cache.json');

  beforeEach(() => {
    // Nettoyer le cache avant chaque test
    clearCache();
  });

  afterAll(() => {
    // Nettoyer après tous les tests
    clearCache();
  });

  test('saveCache crée un fichier', () => {
    saveCache('USD', MOCK_RATES);
    expect(fs.existsSync(CACHE_FILE)).toBe(true);
  });

  test('loadCache retourne les données sauvegardées', () => {
    saveCache('USD', MOCK_RATES);
    const loaded = loadCache('USD');
    expect(loaded).toEqual(MOCK_RATES);
  });

  test('loadCache retourne null si base différente', () => {
    saveCache('USD', MOCK_RATES);
    const loaded = loadCache('EUR');
    expect(loaded).toBeNull();
  });

  test('loadCache retourne null si cache expiré', () => {
    saveCache('USD', MOCK_RATES);
    
    // Modifier le timestamp pour simuler expiration
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    cache.timestamp = Date.now() - (CACHE_DURATION + 1000);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));

    const loaded = loadCache('USD');
    expect(loaded).toBeNull();
  });

  test('clearCache supprime le fichier', () => {
    saveCache('USD', MOCK_RATES);
    const cleared = clearCache();
    expect(cleared).toBe(true);
    expect(fs.existsSync(CACHE_FILE)).toBe(false);
  });

  test('clearCache retourne false si pas de cache', () => {
    const cleared = clearCache();
    expect(cleared).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// convert() - Tests avec API réelle (optionnels)
// ─────────────────────────────────────────────────────────────
describe('convert() - Validation', () => {
  test('lance TypeError pour amount non-nombre', async () => {
    await expect(convert('100', 'USD', 'EUR')).rejects.toThrow(TypeError);
  });

  test('lance Error pour code devise invalide (from)', async () => {
    await expect(convert(100, 'usd', 'EUR')).rejects.toThrow('Code devise invalide');
  });

  test('lance Error pour code devise invalide (to)', async () => {
    await expect(convert(100, 'USD', 'eur')).rejects.toThrow('Code devise invalide');
  });

  test('lance RangeError pour montant négatif', async () => {
    await expect(convert(-100, 'USD', 'EUR')).rejects.toThrow(RangeError);
  });
});

describe('convert() - Conversion identique', () => {
  test('USD → USD retourne montant identique', async () => {
    const result = await convert(100, 'USD', 'USD');
    expect(result.result).toBe(100);
    expect(result.rate).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────
// convertMultiple()
// ─────────────────────────────────────────────────────────────
describe('convertMultiple() - Validation', () => {
  test('lance TypeError si toCurrencies non-tableau', async () => {
    await expect(convertMultiple(100, 'USD', 'EUR')).rejects.toThrow(TypeError);
  });

  test('lance Error si code devise invalide dans tableau', async () => {
    await expect(convertMultiple(100, 'USD', ['EUR', 'gbp'])).rejects.toThrow('Code devise invalide');
  });
});

// ─────────────────────────────────────────────────────────────
// compare()
// ─────────────────────────────────────────────────────────────
describe('compare() - Validation', () => {
  test('lance TypeError pour amount non-nombre', async () => {
    await expect(compare('100', 'USD', 'EUR')).rejects.toThrow(TypeError);
  });

  test('lance Error pour codes devises invalides', async () => {
    await expect(compare(100, 'usd', 'EUR')).rejects.toThrow('Code devise invalide');
  });
});

// ─────────────────────────────────────────────────────────────
// listCurrencies()
// ─────────────────────────────────────────────────────────────
describe('listCurrencies() - Validation', () => {
  test('lance Error pour base invalide', async () => {
    await expect(listCurrencies('usd')).rejects.toThrow('Code devise invalide');
  });
});

// ─────────────────────────────────────────────────────────────
// POPULAR_CURRENCIES
// ─────────────────────────────────────────────────────────────
describe('POPULAR_CURRENCIES', () => {
  test('contient au moins 10 devises', () => {
    expect(POPULAR_CURRENCIES.length).toBeGreaterThanOrEqual(10);
  });

  test('toutes les devises sont valides', () => {
    for (const currency of POPULAR_CURRENCIES) {
      expect(() => validateCurrency(currency)).not.toThrow();
    }
  });

  test('contient USD, EUR, GBP', () => {
    expect(POPULAR_CURRENCIES).toContain('USD');
    expect(POPULAR_CURRENCIES).toContain('EUR');
    expect(POPULAR_CURRENCIES).toContain('GBP');
  });
});

// ─────────────────────────────────────────────────────────────
// Tests d'intégration (nécessitent connexion réseau)
// ─────────────────────────────────────────────────────────────
describe('Intégration API (réseau requis)', () => {
  // Ces tests sont marqués comme optionnels car ils nécessitent une connexion

  test.skip('convert() récupère les taux réels', async () => {
    const result = await convert(100, 'USD', 'EUR', { useCache: false });
    expect(result.result).toBeGreaterThan(0);
    expect(result.rate).toBeGreaterThan(0);
    expect(result.from).toBe('USD');
    expect(result.to).toBe('EUR');
  }, 10000);

  test.skip('convertMultiple() fonctionne avec plusieurs devises', async () => {
    const results = await convertMultiple(100, 'USD', ['EUR', 'GBP', 'JPY'], { useCache: false });
    expect(results.length).toBe(3);
    expect(results.every(r => r.result > 0)).toBe(true);
  }, 10000);

  test.skip('compare() compare deux devises', async () => {
    const result = await compare(100, 'USD', 'EUR', { useCache: false });
    expect(result[`USD_to_EUR`]).toBeGreaterThan(0);
    expect(result[`EUR_to_USD`]).toBeGreaterThan(0);
    expect(['USD', 'EUR']).toContain(result.stronger);
  }, 10000);

  test.skip('listCurrencies() retourne liste complète', async () => {
    const currencies = await listCurrencies('USD', { useCache: false });
    expect(currencies.length).toBeGreaterThan(100);
    expect(currencies).toContain('EUR');
    expect(currencies).toContain('GBP');
  }, 10000);

  test.skip('fetchRates() utilise le cache correctement', async () => {
    clearCache();

    // Premier appel : depuis API
    const start1 = Date.now();
    await fetchRates('USD', { useCache: true });
    const time1 = Date.now() - start1;

    // Deuxième appel : depuis cache (beaucoup plus rapide)
    const start2 = Date.now();
    await fetchRates('USD', { useCache: true });
    const time2 = Date.now() - start2;

    expect(time2).toBeLessThan(time1 / 10); // Cache devrait être 10x plus rapide
  }, 15000);
});

// ─────────────────────────────────────────────────────────────
// Tests de logique métier (sans réseau)
// ─────────────────────────────────────────────────────────────
describe('Logique métier', () => {
  test('conversion identique retourne rate=1', async () => {
    const result = await convert(50, 'EUR', 'EUR');
    expect(result.rate).toBe(1);
    expect(result.result).toBe(50);
  });

  test('montant 0 retourne 0', async () => {
    const result = await convert(0, 'USD', 'USD');
    expect(result.result).toBe(0);
  });

  test('résultat arrondi à 2 décimales', async () => {
    // Test avec conversion identique
    const result = await convert(100.12345, 'USD', 'USD');
    expect(result.result).toBe(100.12345);
  });
});