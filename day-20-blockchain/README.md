# ⛓️ Day 20 — Blockchain (Simplified)

> **30 Days of Pure Scripting** · Semaine 4 : Projets Avancés · **FINALE** · Jour 5/5

## 🎯 Comprendre la Blockchain

Implémentation from scratch d'une blockchain avec tous les concepts fondamentaux :
- **Proof of Work** : Mining avec difficulté ajustable
- **Chaînage cryptographique** : Liens entre blocs via hash
- **Validation de chaîne** : Vérification d'intégrité
- **Transactions** : Système de transfert
- **Balances** : Calcul automatique des soldes

## ⚡ Fonctionnalités

### Structure Block
- ✅ **Index** : Position dans la chaîne
- ✅ **Timestamp** : Date de création
- ✅ **Data** : Transactions ou données
- ✅ **Previous Hash** : Lien vers bloc précédent
- ✅ **Nonce** : Nombre utilisé pour mining
- ✅ **Hash** : Empreinte SHA-256 du bloc

### Blockchain
- ✅ **Genesis Block** : Bloc d'origine
- ✅ **Mining** : Proof of Work avec difficulté
- ✅ **Transactions** : Pending → Block
- ✅ **Validation** : Vérification de la chaîne
- ✅ **Balances** : Calcul par adresse
- ✅ **Persistence** : Save/Load JSON
- ✅ **Mining Reward** : Récompense pour mineurs

## 🚀 Usage CLI

```bash
# Initialiser blockchain (difficulté 3)
node index.js init 3

# Ajouter transaction
node index.js transaction alice bob 50

# Miner un bloc (récompense pour miner1)
node index.js mine miner1

# Voir balance
node index.js balance alice
node index.js balance bob
node index.js balance miner1

# Valider la chaîne
node index.js validate

# Lister tous les blocs
node index.js list

# Statistiques
node index.js stats
```

## 📊 Exemple de session complète

```bash
# 1. Initialiser
$ node index.js init 2
✅ Blockchain initialized (difficulty: 2)

# 2. Créer transactions
$ node index.js transaction alice bob 50
✅ Transaction added: alice → bob (50)
   Pending transactions: 1

$ node index.js transaction alice carol 30
✅ Transaction added: alice → carol (30)
   Pending transactions: 2

# 3. Miner le bloc
$ node index.js mine miner1
⛏️  Mining block...
⛏️  Block mined: 00a3f8b2... (nonce: 1247)
✅ Block mined! Reward sent to miner1

# 4. Vérifier balances
$ node index.js balance alice
💰 Balance of alice: -80

$ node index.js balance bob
💰 Balance of bob: 50

$ node index.js balance miner1
💰 Balance of miner1: 100  # Mining reward!

# 5. Valider la chaîne
$ node index.js validate
✅ Blockchain is valid!

# 6. Statistiques
$ node index.js stats

📊 BLOCKCHAIN STATS
──────────────────────────────────────────────────
Blocks: 2
Difficulty: 2
Pending Transactions: 1
Total Transactions: 2
Valid: ✅
```

## 💻 API Programmatique

### Créer et utiliser blockchain

```javascript
const { Blockchain } = require('./index');

// Initialiser avec difficulté 3
const blockchain = new Blockchain(3);

// Ajouter transactions
blockchain.addTransaction({
  from: 'alice',
  to: 'bob',
  amount: 50
});

blockchain.addTransaction({
  from: 'alice',
  to: 'carol',
  amount: 30
});

// Miner le bloc
blockchain.minePendingTransactions('miner1');

// Vérifier balances
console.log(`Alice: ${blockchain.getBalance('alice')}`); // -80
console.log(`Bob: ${blockchain.getBalance('bob')}`);     // 50
console.log(`Miner: ${blockchain.getBalance('miner1')}`); // 100

// Valider la chaîne
console.log(`Valid: ${blockchain.isChainValid()}`); // true
```

### Sauvegarder et charger

```javascript
// Sauvegarder
blockchain.save('./blockchain.json');

// Charger
const loadedChain = Blockchain.load('./blockchain.json');
console.log(`Loaded ${loadedChain.chain.length} blocks`);
```

## 🎯 Concepts Blockchain

### 1. Block Structure

```javascript
{
  index: 1,
  timestamp: 1709040000000,
  data: [
    { from: 'alice', to: 'bob', amount: 50 },
    { from: 'alice', to: 'carol', amount: 30 }
  ],
  previousHash: "00a1b2c3d4e5f6...",
  nonce: 1247,
  hash: "00f6e5d4c3b2a1..."
}
```

**Champs** :
- `index` : Position (0 = genesis)
- `timestamp` : Horodatage création
- `data` : Transactions ou données
- `previousHash` : Hash du bloc précédent (chaînage)
- `nonce` : Nombre trouvé par mining
- `hash` : SHA-256 de tous les champs

### 2. Hashing (SHA-256)

```javascript
calculateHash() {
  return crypto.createHash('sha256')
    .update(
      this.index +
      this.timestamp +
      JSON.stringify(this.data) +
      this.previousHash +
      this.nonce
    )
    .digest('hex');
}
```

**Propriétés** :
- Déterministe : même input → même output
- One-way : impossible de retrouver input
- Avalanche effect : 1 bit change → hash totalement différent
- Collision resistant : quasi impossible de trouver 2 inputs → même hash

### 3. Proof of Work (Mining)

```javascript
mineBlock(difficulty) {
  const target = '0'.repeat(difficulty);
  
  // Chercher nonce qui donne hash commençant par N zéros
  while (this.hash.substring(0, difficulty) !== target) {
    this.nonce++;
    this.hash = this.calculateHash();
  }
}
```

**Exemple** (difficulty = 3) :
```
Target : 000...
nonce=0  → hash=8a3f... ❌
nonce=1  → hash=7b2e... ❌
nonce=2  → hash=6c1d... ❌
...
nonce=1247 → hash=000a... ✅ Found!
```

**Complexité** : O(2^difficulty)
- Difficulty 1 : ~16 tentatives
- Difficulty 2 : ~256 tentatives
- Difficulty 3 : ~4,096 tentatives
- Difficulty 4 : ~65,536 tentatives

### 4. Chain Validation

```javascript
isChainValid() {
  for (let i = 1; i < this.chain.length; i++) {
    const current = this.chain[i];
    const previous = this.chain[i - 1];

    // Vérifier hash du bloc
    if (current.hash !== current.calculateHash()) {
      return false; // Hash modifié
    }

    // Vérifier chaînage
    if (current.previousHash !== previous.hash) {
      return false; // Chaîne brisée
    }

    // Vérifier proof of work
    if (!current.hash.startsWith('0'.repeat(this.difficulty))) {
      return false; // Mining invalide
    }
  }
  return true;
}
```

**3 validations** :
1. Hash integrity : hash = calculateHash()
2. Chain integrity : previousHash = previous.hash
3. Proof of work : hash commence par N zéros

### 5. Transactions & Balances

```javascript
getBalance(address) {
  let balance = 0;

  for (const block of this.chain) {
    for (const trans of block.data) {
      if (trans.from === address) balance -= trans.amount;
      if (trans.to === address) balance += trans.amount;
    }
  }

  return balance;
}
```

**UTXO simplifié** :
- Parcourt tous les blocs
- Soustrait montants FROM address
- Ajoute montants TO address
- Balance = Σ(received) - Σ(sent)

## 🏗️ Architecture

```
Blockchain
├── Block
│   ├── calculateHash() - SHA-256
│   └── mineBlock() - Proof of Work
├── chain[]
│   ├── Genesis Block (index 0)
│   └── Mined Blocks
├── pendingTransactions[]
│   └── Waiting for mining
├── Operations
│   ├── addTransaction()
│   ├── minePendingTransactions()
│   ├── getBalance()
│   └── isChainValid()
└── Persistence
    ├── save() - JSON export
    └── load() - JSON import
```

## 📊 Performance & Benchmarks

### Mining Time (par difficulté)

| Difficulty | Tentatives moyennes | Temps (approx) |
|------------|---------------------|----------------|
| 1 | ~16 | < 1ms |
| 2 | ~256 | ~10ms |
| 3 | ~4K | ~100ms |
| 4 | ~65K | ~2s |
| 5 | ~1M | ~30s |
| 6 | ~16M | ~8min |

**Note** : Bitcoin utilise difficulty ~20 (billions d'années avec CPU)

### Operations

| Opération | Complexité | Temps |
|-----------|------------|-------|
| calculateHash() | O(1) | < 1ms |
| addTransaction() | O(1) | < 1ms |
| getBalance() | O(n×m) | < 10ms (n=blocks, m=trans) |
| isChainValid() | O(n) | < 50ms (n=blocks) |
| mineBlock() | O(2^d) | Variable (d=difficulty) |

## 🌟 Cas d'usage

### 1. Cryptocurrency (simplifié)

```javascript
const coin = new Blockchain(3);

// Alice mine 100 coins
coin.minePendingTransactions('alice');

// Alice envoie à Bob
coin.addTransaction({ from: 'alice', to: 'bob', amount: 50 });

// Bob mine le bloc
coin.minePendingTransactions('bob');

console.log(`Alice: ${coin.getBalance('alice')}`); // 50
console.log(`Bob: ${coin.getBalance('bob')}`);     // 150
```

### 2. Supply Chain Tracking

```javascript
blockchain.addTransaction({
  from: 'factory',
  to: 'warehouse',
  amount: 1000, // units
  metadata: { product: 'Widget A', batch: '2025-001' }
});

blockchain.minePendingTransactions('validator');
```

### 3. Voting System

```javascript
blockchain.addTransaction({
  from: 'voter-123',
  to: 'candidate-A',
  amount: 1 // One vote
});
```

## 🔒 Sécurité & Immutabilité

### Tentative de modification

```javascript
// Créer blockchain valide
blockchain.addTransaction({ from: 'alice', to: 'bob', amount: 50 });
blockchain.minePendingTransactions('miner1');

// Tentative de fraude
blockchain.chain[1].data[0].amount = 500; // Alice → Bob: 500 au lieu de 50

// Validation détecte la fraude
blockchain.isChainValid(); // ❌ false

// Pourquoi ?
blockchain.chain[1].hash !== blockchain.chain[1].calculateHash()
// Hash stocké ≠ hash recalculé → données modifiées !
```

### Pourquoi c'est sécurisé ?

1. **Immutabilité** : Modifier données → hash change
2. **Chaînage** : Hash change → bloc suivant invalide
3. **Proof of Work** : Re-miner tous les blocs = computationnellement impossible
4. **Distribution** : Réseau décentralisé (pas implémenté ici)

## 📁 Structure Fichiers

```
day-20-blockchain/
├── index.js            ← Block + Blockchain + CLI
├── index.test.js       ← 38+ tests
├── blockchain.json     ← Persistence (auto-généré)
├── package.json
└── README.md
```

## 🎉 Semaine 4 Complétée !

**20 jours · 840+ tests · 4 semaines ✅**

### Bilan Semaine 4 (Projets Avancés)
1. Weather + Auth + Webhooks - Triple combo
2. Chatbot CLI - NLP + context
3. Sentiment Analyzer - Lexicon-based
4. Cron + Auto-Backup - Automation
5. **Blockchain** - Cryptography + consensus ⛓️

### Technologies Blockchain Maîtrisées
- ✅ SHA-256 hashing
- ✅ Proof of Work
- ✅ Chain validation
- ✅ Transaction management
- ✅ Balance calculation
- ✅ Immutability concepts

---

**67% du challenge complet · 10 jours restants !** 🚀

*"Blockchain is trust through mathematics."* — Satoshi Nakamoto