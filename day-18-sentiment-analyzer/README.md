# 😊 Day 18 — Sentiment Analyzer (NLP)

> **30 Days of Pure Scripting** · Semaine 4 : Projets Avancés · Jour 3/5

## 🎯 Problème

Analyser le sentiment d'un texte et déterminer s'il est Positif, Négatif ou Neutre.

## ⚡ Fonctionnalités

- ✅ **Lexicon-based** : Dictionnaire de mots émotionnels
- ✅ **Scoring system** : Score -∞ à +∞
- ✅ **Intensity detection** : Intensificateurs (very, extremely)
- ✅ **Negation handling** : Détection de négations (not, never)
- ✅ **Confidence score** : 0-100% de confiance
- ✅ **Bi-langue** : English & French
- ✅ **Batch analysis** : Analyser plusieurs textes
- ✅ **Comparative analysis** : Comparer deux textes
- ✅ **Evolution tracking** : Tendance sur plusieurs textes

## 🚀 Usage CLI

```bash
# Analyser un texte
node index.js analyze "I love this product!"

# Français
node index.js analyze "C'est magnifique!" --lang fr

# Analyser un fichier
node index.js file review.txt

# Comparer deux textes
node index.js compare "Great experience" "Terrible service"
```

## 📊 Exemple de sortie

```bash
$ node index.js analyze "This is absolutely fantastic! I love it!"

📊 SENTIMENT ANALYSIS
──────────────────────────────────────────────────
Text      : This is absolutely fantastic! I love it!
Sentiment : 😊 Positive
Score     : 8.0
Confidence: 78.3%
Words     : 7

✅ Positive words:
   absolutely (+2.0)
   fantastic (+6.0)
   love (+2.0)
```

## 💻 API Programmatique

```javascript
const { SentimentAnalyzer } = require('./index');

// Analyser un texte
const analyzer = new SentimentAnalyzer('en');
const result = analyzer.analyze('I love this product!');

console.log(result);
/*
{
  text: 'I love this product!',
  sentiment: 'Positive',
  score: 2.0,
  confidence: 65.4,
  words: 4,
  breakdown: {
    positive: [{ word: 'love', score: 2 }],
    negative: [],
    intensifiers: [],
    negations: []
  },
  language: 'en'
}
*/

// Batch analysis
const results = analyzer.analyzeBatch([
  'Great product',
  'Terrible experience',
  'It\'s okay'
]);

console.log(results.summary);
/*
{
  total: 3,
  positive: 1,
  negative: 1,
  neutral: 1,
  avgScore: 0.33
}
*/

// Statistiques
const stats = analyzer.getStats();
// { totalAnalyzed: 4, positive: 2, negative: 1, neutral: 1 }
```

## 🔬 Analyse Comparative

```javascript
const { ComparativeAnalyzer } = require('./index');

// Comparer deux textes
const comparison = ComparativeAnalyzer.compare(
  'Excellent service',
  'Poor quality'
);

console.log(comparison);
/*
{
  text1: { sentiment: 'Positive', score: 3.0, ... },
  text2: { sentiment: 'Negative', score: -2.0, ... },
  difference: 5.0,
  winner: 'Text 1'
}
*/

// Analyser évolution
const evolution = ComparativeAnalyzer.analyzeEvolution([
  'Day 1: Good start',
  'Day 2: Excellent progress',
  'Day 3: Amazing results'
]);

console.log(evolution.trend); // 'improving'
```

## 🎯 Algorithme

### 1. Normalisation
```javascript
text.toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
```

### 2. Tokenization
```javascript
words = text.split(' ').filter(w => w.length > 0)
```

### 3. Scoring
```javascript
for each word:
  if negation: multiplier *= -1
  if intensifier: multiplier *= intensity
  if emotional: score += wordScore * multiplier
```

### 4. Sentiment Detection
```javascript
if (score > 0.5)  return 'Positive'
if (score < -0.5) return 'Negative'
return 'Neutral'
```

### 5. Confidence
```javascript
scoreFactor = min(abs(score) / 5, 1)
wordFactor = min(wordCount / 10, 1)
confidence = (scoreFactor * 0.7 + wordFactor * 0.3) * 100
```

## 📚 Lexicon

### English (60+ mots)

**Positifs (+1 à +3)** :
- Strong (+3): excellent, amazing, fantastic, wonderful, perfect
- Medium (+2): great, good, nice, happy, love, beautiful
- Weak (+1): like, fine, okay, pleasant, satisfied

**Négatifs (-1 à -3)** :
- Strong (-3): terrible, horrible, awful, worst, hate
- Medium (-2): bad, poor, sad, angry, disappointed
- Weak (-1): dislike, annoying, boring, mediocre

**Intensificateurs** :
- very (×1.5), extremely (×2), really (×1.3)
- slightly (×0.5), somewhat (×0.7)

**Négations** :
- not, never, no, neither, nobody

### French (40+ mots)

**Positifs** : excellent, magnifique, fantastique, super, bien, bon
**Négatifs** : terrible, horrible, mauvais, nul, triste
**Intensificateurs** : très, extrêmement, vraiment
**Négations** : pas, jamais, non, aucun

## 🏗️ Architecture

```
SentimentAnalyzer
├── normalize() - Clean text
├── tokenize() - Split into words
├── calculateScore() - Compute sentiment
│   ├── Handle negations
│   ├── Handle intensifiers
│   └── Sum emotional words
├── determineSentiment() - Positive/Negative/Neutral
└── calculateConfidence() - 0-100%

ComparativeAnalyzer
├── compare() - Two texts
└── analyzeEvolution() - Trend analysis
```

## 📊 Performance

| Opération | Complexité | Temps |
|-----------|------------|-------|
| analyze() | O(n) | < 1ms (n=mots) |
| analyzeBatch(m) | O(m×n) | < 10ms |
| compare() | O(n1+n2) | < 2ms |

## 🌟 Cas d'usage

### 1. Analyse de reviews produits
```javascript
const reviews = [
  'This product is amazing!',
  'Worst purchase ever',
  'It\'s okay, nothing special'
];

const result = analyzer.analyzeBatch(reviews);
console.log(`${result.summary.positive}/${result.summary.total} positive`);
```

### 2. Monitoring satisfaction client
```javascript
const feedback = loadCustomerFeedback();
const positiveRate = feedback.filter(f => 
  analyzer.analyze(f).sentiment === 'Positive'
).length / feedback.length;

if (positiveRate < 0.5) {
  alert('Satisfaction dropping!');
}
```

### 3. Analyse tendance sur période
```javascript
const dailyComments = [
  'Week 1: Product is good',
  'Week 2: Getting better',
  'Week 3: Excellent now',
  'Week 4: Perfect!'
];

const evolution = ComparativeAnalyzer.analyzeEvolution(dailyComments);
console.log(evolution.trend); // 'improving'
```

## 🎓 Concepts NLP

### Lexicon-based Approach
- Utilise dictionnaire pré-défini
- Rapide et déterministe
- Limité au vocabulaire connu

### Alternatives (non implémentées ici)
- **Machine Learning** : Entraîné sur corpus annoté
- **Deep Learning** : BERT, GPT pour contexte
- **Rule-based** : Grammaire et syntaxe

### Limitations
- ❌ Pas de sarcasme/ironie
- ❌ Pas de contexte profond
- ❌ Vocabulaire limité
- ❌ Pas de nuances culturelles

## 📁 Structure

```
day-18-sentiment-analyzer/
├── index.js       ← Analyzer + Lexicons + CLI
├── package.json
└── README.md
```

---

**Semaine 4 : 3/5 jours · 18/30 total · 60% complet**

*"The best way to understand emotion is to measure it."* — Unknown