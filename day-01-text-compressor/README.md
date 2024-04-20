# 📦 Day 01 — Text Compressor (RLE)

> **30 Days of Pure Scripting** · Semaine 1 : Algorithmique & Manipulation de données

---

## 🎯 Problème

Réduire une chaîne de caractères en encodant les séquences répétées :

```
"aaabbc"   →   "3a2b1c"
"xxxxyz"   →   "4x1y1z"
"aabbbb"   →   "2a4b"
```

C'est l'algorithme **Run-Length Encoding (RLE)**, l'une des compressions les plus simples et les plus pédagogiques. Utilisé historiquement dans les fax, les images BMP et les données satellites.

---

## ⚡ Performance

| Opération   | Complexité Temps | Complexité Espace | 100k chars   |
|-------------|-----------------|-------------------|--------------|
| compress()  | **O(n)**        | O(n)              | < 10 ms      |
| decompress()| **O(n)**        | O(n)              | < 10 ms      |
| analyze()   | **O(n)**        | O(k)* k=uniques   | < 20 ms      |

> **Pourquoi O(n) ?** On parcourt la chaîne une seule fois. Aucune boucle imbriquée, aucun tri.

---

## 🛡️ Gestion des erreurs

Chaque fonction valide son input avant tout traitement :

| Erreur            | Cas déclencheur                        | Type levé     |
|-------------------|----------------------------------------|---------------|
| `null / undefined`| `compress(null)`                       | `TypeError`   |
| Type non-string   | `compress(42)`, `compress([])`         | `TypeError`   |
| Input trop long   | Chaîne > 1 000 000 caractères          | `RangeError`  |
| Format RLE invalide| `decompress("abc")` (pas de prefix)  | `SyntaxError` |
| Output trop grand | `decompress("1000000a1000000b")`       | `RangeError`  |

```js
// Toutes les erreurs ont un message descriptif
try {
  compress(null);
} catch (err) {
  console.error(err.message);
  // → "TypeError: l'input ne peut pas être null ou undefined."
}
```

---

## 🚀 Installation & Usage

```bash
# Installation
git clone ...
cd day-01-text-compressor
npm install

# CLI
node index.js compress   "aaabbbcc"
node index.js compress   "aaabbbcc" --no-singles
node index.js decompress "3a3b2c"
node index.js analyze    "hello world"
```

### Exemples de sorties CLI

```
📦 COMPRESSION RLE
────────────────────────────────────────
Input    : "aaabbbcc"
Output   : "3a3b2c"
Ratio    : 75.0% de la taille originale
Économie : 2 caractère(s) ✅

📂 DÉCOMPRESSION RLE
────────────────────────────────────────
Input  : "3a3b2c"
Output : "aaabbbcc"

🔬 ANALYSE
────────────────────────────────────────
Longueur     : 11 chars
Chars uniques: 8
Entropie     : 3.1045 bits/char
Run le + long: "l" × 2

Fréquences :
  "l" : ████ 3
  "o" : ██ 2
  "h" : █ 1
  ...
```

---

## 🔌 API (module)

```js
const { compress, decompress, analyze } = require('./index');

// compress(str, options?) → { result, ratio, saved }
const { result, ratio, saved } = compress('aaabbc');
// result = "3a2b1c", ratio = 1.0, saved = 0

// Options disponibles :
compress('aaBBcc', { noSingles: true });      // Omet le "1" pour les chars uniques
compress('AAAaaa', { caseSensitive: false }); // Traite A et a comme identiques

// decompress(str) → string
const original = decompress('3a2b1c');
// → "aaabbc"

// analyze(str) → { length, uniqueChars, frequency, entropy, longestRun }
const report = analyze('hello world');
// → { length: 11, uniqueChars: 8, entropy: 3.1045, longestRun: { char: 'l', count: 3 }, ... }
```

---

## 🧪 Tests

```bash
npm test
```

```
PASS  index.test.js
  validateInput()        ✓ 8 tests
  compress()             ✓ 17 tests
  decompress()           ✓ 12 tests
  analyze()              ✓ 8 tests
  Performance            ✓ 3 tests

Tests:       48 passed
Coverage:    97.8% statements | 93.5% branches | 100% functions
```

### Ce qui est testé

- ✅ Cas nominaux (compression, décompression, round-trip)
- ✅ Chaîne vide, un seul caractère
- ✅ Toutes les options (`noSingles`, `caseSensitive`)
- ✅ Tous les types d'erreurs avec le bon type (`TypeError`, `SyntaxError`, `RangeError`)
- ✅ Round-trip compress → decompress = original
- ✅ Performance sur 100k+ caractères
- ✅ Protection DoS (output illimité)

---

## 🔐 Sécurité

| Risque                  | Mitigation                              |
|-------------------------|-----------------------------------------|
| Input non-typé          | Validation stricte avant traitement     |
| Décompression explosive | `MAX_INPUT_LENGTH` sur l'output         |
| ReDoS (Regex attack)    | Regex non-backtracking utilisées        |

> **Note :** RLE n'est pas un algorithme de sécurité. Ne pas l'utiliser pour chiffrer des données sensibles.

---

## 📚 Concepts clés appris

- **Algorithme RLE** — principe et cas d'usage (images, textes répétitifs)
- **Entropie de Shannon** — mesure de "l'information" dans une chaîne
- **Validation défensive** — vérifier les inputs avant tout traitement
- **Big O** — garantir O(n) en évitant les boucles imbriquées
- **Protection DoS** — limiter la taille des outputs générés

---

## 📁 Structure

```
day-01-text-compressor/
├── index.js          ← Code principal (compress, decompress, analyze, CLI)
├── index.test.js     ← 48 tests Jest
├── package.json
└── README.md
```

---

## 🔗 Suite du challenge

| ← Précédent | Jour actuel | Suivant →         |
|-------------|-------------|-------------------|
| —           | **01 · RLE Compressor** | 02 · Password Generator |

---

*"Make it work, make it right, make it fast."* — Kent Beck