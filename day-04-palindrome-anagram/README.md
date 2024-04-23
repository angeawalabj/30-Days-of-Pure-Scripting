# 🔄 Day 04 — Palindrome & Anagram Detector

> **30 Days of Pure Scripting** · Semaine 1 : Algorithmique & Manipulation de données

---

## 🎯 Problème

Détecter et analyser :
- **Palindromes** : mots qui se lisent identiquement dans les deux sens
- **Anagrammes** : mots formés des mêmes lettres réarrangées

**Exemples :**
```js
// Palindromes
isPalindrome('racecar')                          // → true
isPalindrome('A man a plan a canal Panama')      // → true

// Anagrammes
isAnagram('listen', 'silent')                    // → true
groupAnagrams(['eat', 'tea', 'tan', 'ate'])      // → [['eat','tea','ate'], ['tan']]
```

**Challenges techniques** :
- Normalisation (espaces, ponctuation, accents, casse)
- Palindrome : algorithme Two-Pointer O(n)
- Anagramme : Hash Map O(n) vs Sorting O(n log n)
- Sous-palindrome le plus long : Expand Around Center O(n²)

---

## ⚡ Performance

| Opération            | Complexité Temps | 10k chars | Algorithme              |
|----------------------|------------------|-----------|-------------------------|
| isPalindrome()       | **O(n)**         | < 10 ms   | Two-Pointer             |
| isAnagram()          | **O(n)**         | < 1 ms    | Hash Map                |
| findLongestPalindrome| **O(n²)**        | ~100 ms   | Expand Around Center    |
| groupAnagrams()      | **O(n·m log m)** | < 100 ms  | Sort signature          |
| canBePalindrome()    | **O(n)**         | < 1 ms    | Frequency count         |

> **Two-Pointer** : Deux indices qui se rapprochent (gauche/droite). Optimal pour palindromes.  
> **Hash Map** : Fréquence de caractères. Optimal pour anagrammes.

---

## 🛡️ Gestion des erreurs

| Erreur             | Cas déclencheur                    | Type levé     |
|--------------------|-----------------------------------|---------------|
| Input non-string   | `isPalindrome(123)`               | `TypeError`   |
| Chaîne vide        | `isPalindrome('')`                | `Error`       |
| Array non-string   | `groupAnagrams(['a', 123])`       | `TypeError`   |
| Array vide         | `groupAnagrams([])`               | `Error`       |

---

## 🚀 Installation & Usage

```bash
# Installation
cd day-04-palindrome-anagram
npm install

# CLI - Palindrome
node index.js palindrome "racecar"
node index.js palindrome "A man a plan a canal Panama"

# CLI - Anagramme
node index.js anagram "listen" "silent"

# CLI - Recherche anagrammes
node index.js find-anagrams "eat" "tea" "tan" "ate" "nat" "bat"

# CLI - Groupement
node index.js group-anagrams "eat" "tea" "tan" "ate" "nat" "bat"

# CLI - Peut devenir palindrome
node index.js can-be-palindrome "aabbcc"
```

### Exemples de sorties CLI

**Palindrome :**
```bash
$ node index.js palindrome "A man a plan a canal Panama"

🔄 ANALYSE PALINDROME
──────────────────────────────────────────────────
Texte original  : "A man a plan a canal Panama"
Normalisé       : "amanaplanacanalpanama"
Est palindrome  : ✅ OUI
Longueur        : 21
Centre          : c
Plus long sous  : "amanaplanacanalpanama"
```

**Anagramme :**
```bash
$ node index.js anagram "listen" "silent"

🔀 DÉTECTION ANAGRAMME
──────────────────────────────────────────────────
"listen" ↔ "silent"
Résultat : ✅ ANAGRAMMES
```

**Groupement :**
```bash
$ node index.js group-anagrams "eat" "tea" "tan" "ate" "nat" "bat"

📦 GROUPEMENT ANAGRAMMES
──────────────────────────────────────────────────
Groupe 1 : [eat, tea, ate]
Groupe 2 : [tan, nat]
Groupe 3 : [bat]
```

---

## 🔌 API (module)

```js
const {
  isPalindrome,
  analyzePalindrome,
  isAnagram,
  findAnagrams,
  groupAnagrams,
  canBePalindrome,
} = require('./index');

// ─── Palindromes ───

isPalindrome('racecar');
// → true

isPalindrome('A man a plan a canal Panama');
// → true (espaces et casse ignorés)

const analysis = analyzePalindrome('racecar');
/*
{
  isPalindrome: true,
  original: 'racecar',
  normalized: 'racecar',
  length: 7,
  center: 'e',           // Caractère central
  isOddLength: true,
  longestSubPalindrome: 'racecar'
}
*/

// ─── Anagrammes ───

isAnagram('listen', 'silent');
// → true

isAnagram('Listen', 'Silent');
// → true (casse ignorée)

const anagrams = findAnagrams('eat', ['tea', 'tan', 'ate', 'nat', 'bat']);
// → ['tea', 'ate']

const groups = groupAnagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']);
// → [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]

// ─── Utilitaires ───

canBePalindrome('aab');
// → true (peut devenir "aba")

canBePalindrome('abcd');
// → false (impossible)

const freq = charFrequency('hello');
// → { h: 1, e: 1, l: 2, o: 1 }

// ─── Options de normalisation ───

isPalindrome('A-B-A', {
  removeSpaces: true,
  removePunctuation: true,
  caseInsensitive: true,
  removeAccents: true,
});
```

---

## 🧪 Tests

```bash
npm test
```

```
PASS  index.test.js
  validateString()         ✓ 4 tests
  validateStringArray()    ✓ 4 tests
  normalize()              ✓ 5 tests
  isPalindrome()           ✓ 10 tests
  analyzePalindrome()      ✓ 3 tests
  findLongestPalindrome()  ✓ 4 tests
  isAnagram()              ✓ 8 tests
  findAnagrams()           ✓ 3 tests
  groupAnagrams()          ✓ 3 tests
  charFrequency()          ✓ 2 tests
  canBePalindrome()        ✓ 6 tests
  generatePalindromes()    ✓ 3 tests
  Intégration              ✓ 4 tests

Tests:       59 passed
Coverage:    92.5% statements | 88.7% branches | 95.2% functions
```

### Ce qui est testé

- ✅ Validation stricte (4 types d'erreurs)
- ✅ Normalisation avec 4 options configurables
- ✅ Palindromes simples, avec espaces, ponctuation, accents
- ✅ Palindromes de phrases célèbres
- ✅ Anagrammes simples, avec espaces, casse, accents
- ✅ Recherche dans listes de 300+ mots
- ✅ Groupement de mots identiques
- ✅ Sous-palindrome le plus long
- ✅ Génération de tous les palindromes possibles
- ✅ Performance : 10k chars vérifiés en < 10ms

---

## 📚 Concepts clés appris

### 1. Two-Pointer pour Palindrome

```js
function isPalindrome(str) {
  let left = 0;
  let right = str.length - 1;

  while (left < right) {
    if (str[left] !== str[right]) return false;
    left++;
    right--;
  }
  return true;
}
```

**Pourquoi O(n) ?** On parcourt la chaîne une seule fois, en avançant les deux pointeurs.

### 2. Hash Map pour Anagramme

```js
function isAnagram(str1, str2) {
  const freq = {};
  
  // Incrémenter pour str1
  for (const char of str1) {
    freq[char] = (freq[char] || 0) + 1;
  }
  
  // Décrémenter pour str2
  for (const char of str2) {
    if (!freq[char]) return false;
    freq[char]--;
  }
  
  // Vérifier que tout est à 0
  return Object.values(freq).every(count => count === 0);
}
```

**Pourquoi O(n) ?** Deux passes linéaires. Alternative : trier les deux chaînes (O(n log n)).

### 3. Expand Around Center

Pour trouver le plus long sous-palindrome :

```js
function expandAroundCenter(str, left, right) {
  while (left >= 0 && right < str.length && str[left] === str[right]) {
    left--;
    right++;
  }
  return str.slice(left + 1, right);
}

// Tester chaque position comme centre
for (let i = 0; i < str.length; i++) {
  const odd  = expandAroundCenter(str, i, i);     // Longueur impaire
  const even = expandAroundCenter(str, i, i + 1); // Longueur paire
}
```

**Complexité** : O(n²) car on teste n centres et chaque expansion peut prendre O(n).

### 4. Condition de Palindrome par Permutation

Une chaîne peut devenir un palindrome SSI **au plus 1 caractère a une fréquence impaire**.

```
"aab"  → Fréquences: a=2, b=1 → 1 impair → ✅ Peut devenir "aba"
"abc"  → Fréquences: a=1, b=1, c=1 → 3 impairs → ❌ Impossible
"aabb" → Fréquences: a=2, b=2 → 0 impair → ✅ Peut devenir "abba"
```

### 5. Signature d'Anagramme

Pour grouper les anagrammes, on utilise une **signature** : la chaîne triée.

```js
'eat'  → signature: 'aet'
'tea'  → signature: 'aet'
'ate'  → signature: 'aet'
// Même signature → anagrammes
```

---

## 🎓 Exemples célèbres

**Palindromes :**
- "A man, a plan, a canal: Panama"
- "Was it a car or a cat I saw?"
- "Madam, I'm Adam"
- "Never odd or even"
- "Do geese see God?"

**Anagrammes :**
- listen ↔ silent
- evil ↔ vile
- a gentleman ↔ elegant man
- the eyes ↔ they see
- conversation ↔ voices rant on

---

## 📁 Structure

```
day-04-palindrome-anagram/
├── index.js          ← Palindrome, anagramme, utilitaires, CLI
├── index.test.js     ← 59 tests Jest
├── package.json
└── README.md
```

---

## 🔗 Suite du challenge

| ← Précédent        | Jour actuel                     | Suivant →              |
|--------------------|---------------------------------|------------------------|
| 03 · JSON Sorter   | **04 · Palindrome & Anagram**   | 05 · Currency Converter|

---

*"The best programs are written so that computing machines can perform them quickly and so that human beings can understand them clearly."* — Donald Knuth