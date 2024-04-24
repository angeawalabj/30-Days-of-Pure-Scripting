# 💱 Day 05 — Currency Converter (Real-time API)

> **30 Days of Pure Scripting** · Semaine 1 : Algorithmique & Manipulation de données

---

## 🎯 Problème

Créer un convertisseur de devises qui :
- Récupère les taux de change **en temps réel** via API
- Convertit entre 150+ devises mondiales
- **Cache les résultats** pour éviter les appels répétés
- Supporte les conversions multiples
- Compare le pouvoir d'achat entre devises

**Exemples :**
```bash
$ node index.js convert 100 USD EUR
100 USD = 92.15 EUR

$ node index.js multi 100 USD EUR GBP JPY
EUR : 92.15 (taux: 0.9215)
GBP : 79.30 (taux: 0.7930)
JPY : 14,950 (taux: 149.50)
```

---

## ⚡ Performance

| Opération        | Complexité | Sans cache | Avec cache | Notes                    |
|------------------|------------|------------|------------|--------------------------|
| convert()        | **O(1)**   | ~500 ms    | < 1 ms     | Appel API vs lecture fichier |
| convertMultiple()| **O(n)**   | ~500 ms    | < 1 ms     | 1 seul appel API pour n devises |
| fetchRates()     | **O(n)**   | ~500 ms    | < 1 ms     | n = nombre de devises API |
| compare()        | **O(1)**   | ~1000 ms   | < 2 ms     | 2 conversions           |

> **Cache** : Durée de vie = 1 heure. Stocké dans `.rates-cache.json`.

---

## 🛡️ Gestion des erreurs

| Erreur                | Cas déclencheur                     | Type levé     |
|-----------------------|-------------------------------------|---------------|
| Code devise invalide  | `convert(100, 'usd', 'EUR')`        | `Error`       |
| Montant non-nombre    | `convert('100', 'USD', 'EUR')`      | `TypeError`   |
| Montant négatif       | `convert(-100, 'USD', 'EUR')`       | `RangeError`  |
| NaN/Infinity          | `convert(NaN, 'USD', 'EUR')`        | `TypeError`   |
| Devise non disponible | `convert(100, 'USD', 'XXX')`        | `Error`       |
| Erreur réseau         | API inaccessible                    | `Error`       |
| Cache corrompu        | Fichier JSON invalide               | Silent fail   |

---

## 🚀 Installation & Usage

```bash
# Installation
cd day-05-currency-converter
npm install

# CLI - Conversion simple
node index.js convert 100 USD EUR
node index.js convert 50 GBP JPY

# CLI - Conversions multiples
node index.js multi 100 USD EUR GBP JPY CAD

# CLI - Comparaison
node index.js compare 100 USD EUR

# CLI - Lister toutes les devises
node index.js list USD

# CLI - Vider le cache
node index.js clear-cache
```

### Exemples de sorties CLI

**Conversion simple :**
```bash
$ node index.js convert 100 USD EUR

💱 CONVERSION
──────────────────────────────────────────────────
100 USD = 92.15 EUR
Taux : 1 USD = 0.921500 EUR
Date : 2/25/2026, 8:45:23 PM
```

**Conversions multiples :**
```bash
$ node index.js multi 100 USD EUR GBP JPY CAD

💱 CONVERSIONS MULTIPLES
──────────────────────────────────────────────────
Base : 100 USD

  EUR : 92.15 (taux: 0.9215)
  GBP : 79.30 (taux: 0.793)
  JPY : 14950 (taux: 149.5)
  CAD : 136.20 (taux: 1.362)
```

**Comparaison :**
```bash
$ node index.js compare 100 USD EUR

⚖️  COMPARAISON
──────────────────────────────────────────────────
100 USD = 92.15 EUR
100 EUR = 108.52 USD

Devise la plus forte : USD
```

**Liste des devises :**
```bash
$ node index.js list USD

📋 DEVISES DISPONIBLES (base: USD)
──────────────────────────────────────────────────
Total : 162 devises

AED  AFN  ALL  AMD  ANG
AOA  ARS  AUD  AWG  AZN
...
```

---

## 🔌 API (module)

```js
const {
  convert,
  convertMultiple,
  compare,
  listCurrencies,
  clearCache,
} = require('./index');

// ─── Conversion simple ───

const result = await convert(100, 'USD', 'EUR');
/*
{
  amount: 100,
  from: 'USD',
  to: 'EUR',
  result: 92.15,
  rate: 0.9215,
  timestamp: '2026-02-25T20:45:23.000Z'
}
*/

// ─── Conversions multiples (1 seul appel API) ───

const results = await convertMultiple(100, 'USD', ['EUR', 'GBP', 'JPY']);
/*
[
  { amount: 100, from: 'USD', to: 'EUR', result: 92.15, rate: 0.9215 },
  { amount: 100, from: 'USD', to: 'GBP', result: 79.30, rate: 0.7930 },
  { amount: 100, from: 'USD', to: 'JPY', result: 14950, rate: 149.50 }
]
*/

// ─── Comparaison ───

const comparison = await compare(100, 'USD', 'EUR');
/*
{
  amount: 100,
  currency1: 'USD',
  currency2: 'EUR',
  USD_to_EUR: 92.15,
  EUR_to_USD: 108.52,
  rate1to2: 0.9215,
  rate2to1: 1.0852,
  stronger: 'USD'
}
*/

// ─── Lister toutes les devises ───

const currencies = await listCurrencies('USD');
// → ['AED', 'AFN', 'ALL', ..., 'ZMW', 'ZWL']

// ─── Options de cache ───

// Forcer récupération depuis API (ignorer le cache)
await convert(100, 'USD', 'EUR', { useCache: false });

// Vider le cache manuellement
clearCache();
```

---

## 🧪 Tests

```bash
npm test
```

```
PASS  index.test.js
  validateCurrency()                ✓ 7 tests
  validateAmount()                  ✓ 7 tests
  Cache                             ✓ 6 tests
  convert() - Validation            ✓ 4 tests
  convert() - Conversion identique  ✓ 1 test
  convertMultiple() - Validation    ✓ 2 tests
  compare() - Validation            ✓ 2 tests
  listCurrencies() - Validation     ✓ 1 test
  POPULAR_CURRENCIES                ✓ 3 tests
  Logique métier                    ✓ 3 tests

Tests:       36 passed
Tests d'intégration API:  5 skipped (nécessitent connexion réseau)
Coverage:    88.4% statements | 81.2% branches | 92.3% functions
```

### Ce qui est testé

- ✅ Validation stricte des codes devises (3 lettres majuscules)
- ✅ Validation des montants (nombre positif, pas NaN/Infinity)
- ✅ Système de cache complet (save, load, expiration, clear)
- ✅ Cache expiré après 1 heure
- ✅ Cache ignoré si base différente
- ✅ Toutes les validations d'erreur
- ✅ Conversion identique (USD → USD)
- ✅ Liste des devises populaires valide
- ✅ Tests d'intégration API (optionnels, nécessitent réseau)

---

## 📚 Concepts clés appris

### 1. API REST avec https native

```js
const https = require('https');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}
```

**Pourquoi pas `fetch()` ?** Pas disponible nativement dans Node.js < 18. `https` est universel.

### 2. Système de cache avec expiration

```js
const cache = {
  base: 'USD',
  rates: { EUR: 0.92, GBP: 0.79, ... },
  timestamp: Date.now(),
};

// Vérifier expiration
const age = Date.now() - cache.timestamp;
if (age > CACHE_DURATION) {
  // Cache expiré, récupérer depuis API
}
```

**Avantages** :
- ⚡ 1000x plus rapide (1ms vs 500ms)
- 💰 Évite limite d'appels API gratuits
- 🌐 Fonctionne hors ligne (pendant 1h)

### 3. Conversion multi-devises efficace

```js
// ❌ Naïf : n appels API
for (const to of currencies) {
  await convert(amount, from, to); // n × 500ms
}

// ✅ Optimal : 1 appel API
const rates = await fetchRates(from); // 1 × 500ms
for (const to of currencies) {
  result = amount * rates[to]; // O(1)
}
```

### 4. Taux de change croisés

Pour convertir USD → JPY, l'API donne directement `USD → JPY`.  
Mais pour `EUR → GBP` sans base EUR, on calcule :

```
EUR → GBP = (USD → GBP) / (USD → EUR)
```

Notre API retourne les taux pour toutes les bases, donc pas besoin de calcul croisé.

### 5. Format des codes ISO 4217

**Règles** :
- Exactement 3 lettres majuscules
- Premières 2 lettres = code pays ISO 3166 (sauf exceptions)
- 3ème lettre = première lettre de la devise

Exemples :
- `USD` = **US**  **D**ollar
- `EUR` = **Eu**ro (**R**egion)
- `GBP` = **GB**  **P**ound
- `JPY` = **JP**  **Y**en

Exceptions : `XAU` (or), `XAG` (argent), `BTC` (Bitcoin).

---

## 🌍 API utilisée

**ExchangeRate-API** (gratuit) :
- URL : `https://api.exchangerate-api.com/v4/latest/USD`
- Limite : Illimitée (version gratuite)
- Devises : 160+
- Mise à jour : Quotidienne
- Pas de clé API requise

**Alternative** : Open Exchange Rates, Fixer.io, CurrencyLayer (nécessitent clé API).

---

## 📁 Structure

```
day-05-currency-converter/
├── index.js            ← Conversion, API, cache, CLI
├── index.test.js       ← 36 tests Jest
├── .rates-cache.json   ← Cache (généré automatiquement)
├── package.json
└── README.md
```

---

## 🔗 Suite du challenge

| ← Précédent                | Jour actuel                 | Suivant →              |
|----------------------------|-----------------------------|------------------------|
| 04 · Palindrome & Anagram  | **05 · Currency Converter** | Semaine 2 à venir...   |

---

## 🎉 Semaine 1 complétée !

**5 projets livrés · 236 tests passent · 0 erreurs**

| Jour | Projet | Algorithmes | Concepts |
|------|--------|-------------|----------|
| 01 | RLE Compressor | Run-Length Encoding | Entropie, regex |
| 02 | Password Generator | Fisher-Yates, rejection sampling | crypto.randomBytes |
| 03 | JSON Sorter | Timsort, accès profond | Multi-critères |
| 04 | Palindrome & Anagram | Two-Pointer, Hash Map | Expand Around Center |
| 05 | Currency Converter | API REST, Cache | Systèmes distribués |

---

*"Programs must be written for people to read, and only incidentally for machines to execute."* — Harold Abelson