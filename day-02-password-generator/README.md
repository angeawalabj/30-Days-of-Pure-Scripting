# 🔑 Day 02 — Password Generator Ultra-Sécurisé

> **30 Days of Pure Scripting** · Semaine 1 : Algorithmique & Manipulation de données

---

## 🎯 Problème

Créer des mots de passe **cryptographiquement sûrs** qui résistent au bruteforce, évitent les patterns prévisibles, et s'adaptent aux besoins de l'utilisateur.

**Caractéristiques :**
- ✅ Cryptographically secure (`crypto.randomBytes`, pas `Math.random`)
- ✅ Évaluation de force avec entropie réelle (bits)
- ✅ Détection de patterns faibles (répétitions, séquences, mots courants)
- ✅ Exclusion des caractères ambigus (i/l/1, o/O/0)
- ✅ Génération batch (jusqu'à 100 mots de passe d'un coup)

---

## ⚡ Performance

| Opération           | Complexité Temps | Réalité (100 passwords) |
|---------------------|------------------|-------------------------|
| generate()          | **O(n)** n=length| < 5 ms                 |
| evaluateStrength()  | **O(n)**         | < 1 ms                 |
| generateBatch(100)  | **O(100n)**      | < 500 ms               |

> **Pourquoi cryptographically secure ?** \`Math.random()\` est **prévisible** (seed-based) et **non-uniforme**. \`crypto.randomBytes()\` utilise le générateur de l'OS (/dev/urandom) qui est conçu pour la cryptographie.

---

## 🛡️ Sécurité

### 1. Génération cryptographique

```js
// ❌ MAUVAIS - Math.random() est prévisible
const bad = charset[Math.floor(Math.random() * charset.length)];

// ✅ BON - crypto.randomBytes() est cryptographically secure
const randomBytes = crypto.randomBytes(length * 2);
const good = charset[randomBytes[i] % charset.length];
```

### 2. Élimination du biais modulo

Problème : Si \`charset.length = 52\` et \`randomByte = 255\`, alors \`255 % 52 = 47\`, ce qui favorise les caractères en fin de charset.

**Solution : rejection sampling**

```js
// On rejette les bytes qui créent un biais
const threshold = Math.floor(256 / charsetSize) * charsetSize;
if (randomByte < threshold) {
  password += charset[randomByte % charsetSize];
}
```

---

## 🚀 Installation & Usage

```bash
# Génération simple
node index.js

# Génération personnalisée
node index.js --length 20 --no-special
node index.js --length 16 --exclude-ambiguous
node index.js --batch 5 --min-strength 80

# Évaluation d'un password existant
node index.js evaluate "MyP@ssw0rd!"
```

### Exemples de sorties CLI

```
🔑 MOT DE PASSE GÉNÉRÉ
──────────────────────────────────────────────────
Password : aB3$xY9#mQ2!wE5@
Force    : 🔵 Très fort (95/100)
Entropie : 102.4 bits
Cassage  : > 1000 ans (incassable)
```

---

## 🔌 API (module)

```js
const { generate, generateBatch, evaluateStrength } = require('./index');

// ─── generate(options?) ──────────────────────────

const { password, strength } = generate({
  length:           20,           // 8-128 (défaut: 16)
  includeUpper:     true,         // A-Z
  includeLower:     true,         // a-z
  includeDigits:    true,         // 0-9
  includeSpecial:   true,         // !@#$%^&*...
  excludeAmbiguous: false,        // Exclut il1Lo0O
  minStrength:      70,           // Force minimale (bits)
});

console.log(password);           // "aB3$xY9#mQ2!wE5@zRtK"
console.log(strength.level);     // "Très fort"
console.log(strength.entropy);   // 128.5
console.log(strength.score);     // 95

// ─── generateBatch(count, options?) ──────────────

const results = generateBatch(5, { length: 16 });
results.forEach(({ password, strength }) => {
  console.log(\`\${password} → \${strength.emoji} \${strength.level}\`);
});

// ─── evaluateStrength(password, charset?) ────────

const strength = evaluateStrength("MyP@ssw0rd!");
// {
//   entropy: 61.2,
//   level: "Fort",
//   emoji: "🟢",
//   charsetSize: 95,
//   length: 11,
//   penalties: 0,
//   timeToCrack: "36 ans",
//   score: 51
// }
```

---

## 🔐 Niveaux de force

| Entropie (bits) | Niveau       | Emoji | Exemple                      |
|-----------------|--------------|-------|------------------------------|
| 0 - 30          | Très faible  | 🔴    | \`abc\`                        |
| 30 - 50         | Faible       | 🟠    | \`password\`                   |
| 50 - 70         | Moyen        | 🟡    | \`Password123\`                |
| 70 - 90         | Fort         | 🟢    | \`MyP@ssw0rd!\`                |
| 90+             | Très fort    | 🔵    | \`aB3$xY9#mQ2!wE5@\`           |

**Recommandation NIST (2024) :** Minimum **64 bits** d'entropie pour les comptes sensibles.

---

## 💡 Bonnes pratiques

### ✅ À FAIRE

```js
// Longueur ≥ 16 pour les comptes sensibles
generate({ length: 16 });

// Exclure les ambigus pour éviter la confusion
generate({ excludeAmbiguous: true });

// Garantir une force minimale
generate({ minStrength: 80 });
```

### ❌ À ÉVITER

```js
// Trop court (< 12)
generate({ length: 8 });

// Mono-charset (moins d'entropie)
generate({ includeUpper: false, includeDigits: false, includeSpecial: false });

// Réutiliser le même mot de passe
const { password } = generate();
accounts.forEach(acc => acc.password = password); // MAUVAIS !
```

---

## 📚 Concepts clés appris

- **Entropie de Shannon** — mesure de l'imprévisibilité (bits)
- **crypto.randomBytes()** — génération cryptographiquement sûre
- **Rejection sampling** — éliminer le biais modulo
- **Pattern detection** — répétitions, séquences, mots courants
- **NIST Guidelines** — standards de sécurité des mots de passe

---

## 🔗 Suite du challenge

| ← Précédent          | Jour actuel                 | Suivant →              |
|----------------------|-----------------------------|------------------------|
| 01 · RLE Compressor  | **02 · Password Generator** | 03 · JSON Sorter       |

---

*"Security is not a product, but a process."* — Bruce Schneier