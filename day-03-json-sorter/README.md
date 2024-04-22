# 📊 Day 03 — JSON Sorter (Deep Nested)

> **30 Days of Pure Scripting** · Semaine 1 : Algorithmique & Manipulation de données

---

## 🎯 Problème

Trier un tableau d'objets JSON selon **plusieurs critères imbriqués** :

```js
const data = [
  { user: { profile: { score: 85 } }, age: 30 },
  { user: { profile: { score: 92 } }, age: 25 },
  { user: { profile: { score: 78 } }, age: 35 },
];

// Trier par user.profile.score (desc), puis par age (asc)
sort(data, [
  { key: 'user.profile.score', order: 'desc' },
  { key: 'age', order: 'asc' },
]);
```

**Challenges techniques** :
- Accès profond via notation pointée (`user.profile.score`)
- Support des tableaux avec index (`items[0]`)
- Tri multi-type (nombres, strings, dates, booleans)
- Tri multi-critères (critère 1, puis 2, puis 3...)
- Performance O(n log n) garanti

---

## ⚡ Performance

| Opération        | Complexité Temps | 10k objets | Notes                          |
|------------------|------------------|------------|--------------------------------|
| sort()           | **O(n log n)**   | < 100 ms   | Timsort (via Array.sort)       |
| sortBy()         | **O(n log n)**   | < 100 ms   | Syntaxe simplifiée             |
| groupBy()        | **O(n)**         | < 50 ms    | Hash map                       |
| stats()          | **O(n)**         | < 50 ms    | Single pass                    |
| getNestedValue() | **O(k)**         | < 0.01 ms  | k = profondeur                 |

> **Timsort** : Algorithme hybride (merge + insertion) utilisé par `Array.sort()` en JavaScript. Optimal pour données partiellement triées.

---

## 🛡️ Gestion des erreurs

| Erreur                 | Cas déclencheur                        | Type levé     |
|------------------------|----------------------------------------|---------------|
| Data non-tableau       | `sort('abc', [...])`                   | `TypeError`   |
| Tableau de primitives  | `sort([1, 2, 3], [...])`               | `TypeError`   |
| Criteria non-tableau   | `sort(data, 'age')`                    | `TypeError`   |
| Criteria vide          | `sort(data, [])`                       | `Error`       |
| Critère sans key       | `sort(data, [{ order: 'asc' }])`       | `Error`       |
| Order invalide         | `sort(data, [{ key: 'age', order: 'up' }])` | `Error` |

---

## 🚀 Installation & Usage

```bash
# Installation
cd day-03-json-sorter
npm install

# CLI - Tri
node index.js sort data.json "age" "desc"
node index.js sort data.json "user.profile.score" "asc"

# CLI - Groupement
node index.js group data.json "category"

# CLI - Statistiques
node index.js stats data.json "age"
```

### Exemples de sorties CLI

**Tri simple :**
```bash
$ node index.js sort data.json "age" "asc"
[
  { "name": "Bob", "age": 25, ... },
  { "name": "Diana", "age": 28, ... },
  { "name": "Alice", "age": 30, ... }
]
```

**Tri imbriqué :**
```bash
$ node index.js sort data.json "user.profile.score" "desc"
[
  { "name": "Eve", "user": { "profile": { "score": 95 } } },
  { "name": "Bob", "user": { "profile": { "score": 92 } } },
  ...
]
```

**Statistiques :**
```bash
$ node index.js stats data.json "age"

📊 STATISTIQUES
────────────────────────────────────────
Champ   : age
Min     : 25
Max     : 35
Moyenne : 30
Somme   : 150
Count   : 5
```

---

## 🔌 API (module)

```js
const { sort, sortBy, groupBy, stats } = require('./index');

// ─── Tri simple ───
const data = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
];

const sorted = sortBy(data, 'age', 'asc');
// → [{ name: 'Bob', age: 25 }, { name: 'Alice', age: 30 }]

// ─── Tri multi-critères ───
const complex = [
  { category: 'B', priority: 1, name: 'Item 3' },
  { category: 'A', priority: 2, name: 'Item 1' },
  { category: 'A', priority: 1, name: 'Item 2' },
];

const multiSort = sort(complex, [
  { key: 'category', order: 'asc' },  // Critère principal
  { key: 'priority', order: 'asc' },  // Critère secondaire
  { key: 'name', order: 'asc' },      // Critère tertiaire
]);
/*
Résultat :
[
  { category: 'A', priority: 1, name: 'Item 2' },
  { category: 'A', priority: 2, name: 'Item 1' },
  { category: 'B', priority: 1, name: 'Item 3' }
]
*/

// ─── Tri imbriqué ───
const nested = [
  { user: { profile: { score: 85 } } },
  { user: { profile: { score: 92 } } },
];

sortBy(nested, 'user.profile.score', 'desc');
// → Tri par score décroissant

// ─── Support des tableaux avec index ───
const withArrays = [
  { items: [10, 20, 30] },
  { items: [5, 15, 25] },
];

sortBy(withArrays, 'items[0]', 'asc');
// → Tri par premier élément du tableau

// ─── Groupement ───
const grouped = groupBy(data, 'category');
/*
{
  "A": [{ category: 'A', ... }, { category: 'A', ... }],
  "B": [{ category: 'B', ... }]
}
*/

// ─── Statistiques ───
const statistics = stats(data, 'age');
/*
{
  min: 25,
  max: 35,
  avg: 30,
  sum: 150,
  count: 5
}
*/

// ─── Options avancées ───
sort(data, [{ key: 'age' }], { mutate: true }); // Modifie le tableau original
```

---

## 🧪 Tests

```bash
npm test
```

```
PASS  index.test.js
  validateData()        ✓ 4 tests
  validateCriteria()    ✓ 5 tests
  getNestedValue()      ✓ 7 tests
  detectType()          ✓ 9 tests
  compareValues()       ✓ 8 tests
  sort() & sortBy()     ✓ 14 tests
  groupBy()             ✓ 4 tests
  stats()               ✓ 4 tests
  Intégration           ✓ 4 tests

Tests:       59 passed
Coverage:    94.7% statements | 91.2% branches | 100% functions
```

### Ce qui est testé

- ✅ Toutes les validations (8 cas d'erreur)
- ✅ Accès profond 3+ niveaux (`a.b.c.d`)
- ✅ Support des tableaux avec index (`items[0]`)
- ✅ Détection de 9 types (string, number, boolean, date, null, array, object)
- ✅ Comparaison multi-type avec ordre de priorité
- ✅ Tri simple, multi-critères, imbriqué
- ✅ Null/undefined toujours en fin de liste
- ✅ Option `mutate` pour modifier le tableau original
- ✅ Groupement avec valeurs null
- ✅ Statistiques ignorant les non-nombres
- ✅ Performance : 10k objets triés en < 100ms
- ✅ Tri avec 3 critères imbriqués

---

## 📚 Concepts clés appris

### 1. Accès profond avec notation pointée

```js
const obj = { a: { b: { c: 42 } } };
getNestedValue(obj, 'a.b.c'); // → 42

// Implémentation :
const keys = 'a.b.c'.split('.');
let value = obj;
for (const key of keys) {
  value = value[key];
}
```

### 2. Tri multi-critères

Le tri s'arrête dès qu'un critère différencie deux éléments :

```js
compareFn(a, b) {
  for (const criterion of criteria) {
    const diff = compare(a[criterion.key], b[criterion.key]);
    if (diff !== 0) return diff; // On s'arrête ici
  }
  return 0; // Égalité complète
}
```

### 3. Timsort (Array.sort)

JavaScript utilise **Timsort** depuis ES2019 :
- Hybride de merge sort et insertion sort
- O(n log n) worst case, O(n) best case (données triées)
- **Stable** : préserve l'ordre relatif des éléments égaux

### 4. Ordre de priorité des types

Lors de la comparaison de types différents :

```
number < string < boolean < date < array < object < null
```

Exemple :
```js
[5, 'abc', true, null].sort(compareFn)
// → [5, 'abc', true, null]
```

### 5. localeCompare avec numeric

Pour trier `['file1', 'file10', 'file2']` :

```js
// ❌ Sans numeric
'file10'.localeCompare('file2') < 0  // 'file1' < 'file2'

// ✅ Avec numeric
'file2'.localeCompare('file10', undefined, { numeric: true }) < 0
// → ['file1', 'file2', 'file10']
```

---

## 📁 Structure

```
day-03-json-sorter/
├── index.js          ← Tri, groupement, stats, CLI
├── index.test.js     ← 59 tests Jest
├── data.json         ← Exemple de données
├── package.json
└── README.md
```

---

## 🔗 Suite du challenge

| ← Précédent                | Jour actuel           | Suivant →                  |
|----------------------------|-----------------------|----------------------------|
| 02 · Password Generator    | **03 · JSON Sorter**  | 04 · Palindrome Detector   |

---

*"Premature optimization is the root of all evil."* — Donald Knuth  
*(Mais connaître la complexité algorithmique est essentiel.)*