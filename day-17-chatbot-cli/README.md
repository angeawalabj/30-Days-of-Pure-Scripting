# 🤖 Day 17 — Chatbot CLI

> **30 Days of Pure Scripting** · Semaine 4 : Projets Avancés · Jour 2/5

## 🎯 Problème

Créer un chatbot intelligent en ligne de commande avec :
- Pattern matching pour comprendre les intentions
- Mémoire de conversation (context)
- Système de commandes extensible
- Personnalité configurable

## ⚡ Fonctionnalités

### Pattern Matching
- ✅ **Regex-based** : Détection d'intentions
- ✅ **Priority system** : Patterns prioritaires en premier
- ✅ **Capture groups** : Extraction de données
- ✅ **Case-insensitive** : Flexible

### Context Management
- ✅ **User info** : Nom, âge, localisation
- ✅ **Conversation history** : 50 derniers messages
- ✅ **Memory system** : Remember/recall custom data
- ✅ **Statistics** : Messages, durée, etc.
- ✅ **Export/Import** : Sauvegarde conversations

### Command System
- ✅ **Built-in commands** : /help, /stats, /save, etc.
- ✅ **Extensible** : Ajout facile de commandes
- ✅ **Arguments parsing** : Support paramètres

### Intelligence
- ✅ **15+ patterns** : Salutations, calculs, blagues
- ✅ **Dynamic responses** : Aléatoires + contextuels
- ✅ **Fallback responses** : Si pas de match
- ✅ **Mood system** : Personnalité changeable

## 🚀 Démarrage

```bash
node index.js
```

## 💬 Exemples d'interaction

```
You: Hello
Bot: Hi there! What's your name?

You: My name is Alice
Bot: Nice to meet you, Alice! 😊

You: How are you?
Bot: I'm doing great! Thanks for asking! 😊

You: What is 42 + 8
Bot: 🔢 42 + 8 = 50

You: Tell me a joke
Bot: Why do programmers prefer dark mode? Because light attracts bugs! 🐛

You: /stats
Bot: 📊 Stats:
  Messages: 5
  Duration: 2m 15s
  User: Alice

You: /remember pizza as favorite food
Bot: 🧠 Remembered: favorite food = pizza

You: /recall favorite food
Bot: 💭 favorite food = pizza

You: bye
Bot: Goodbye Alice! 👋
```

## 📋 Commandes disponibles

| Commande | Description |
|----------|-------------|
| `/help` | Affiche toutes les commandes |
| `/stats` | Statistiques de conversation |
| `/clear` | Efface l'historique |
| `/save` | Sauvegarde la conversation en JSON |
| `/mood <mood>` | Change la personnalité (friendly, professional, funny, poetic) |
| `/remember <value> as <key>` | Mémorise une information |
| `/recall <key>` | Rappelle une information |

## 🎯 Patterns reconnus

### Salutations
- `hi`, `hello`, `hey`, `bonjour`, `salut`

### Présentations
- `my name is <name>`
- `i'm <name>`, `call me <name>`

### Âge
- `i'm <age>`, `i am <age> years old`

### Questions
- `how are you`, `what's up`
- `what time`, `what date`

### Calculs
- `what is <number> <+|-|*|/> <number>`
- `calculate <expression>`

### Divertissement
- `joke`, `funny`, `make me laugh`

### Utilitaire
- `help`, `commands`
- `thank you`, `thanks`
- `bye`, `goodbye`, `exit`

## 🏗️ Architecture

```
Chatbot
├── PatternMatcher
│   ├── Pattern registry with priorities
│   ├── Regex matching
│   └── Response generation
├── ContextManager
│   ├── User information
│   ├── Conversation history
│   ├── Memory system
│   └── Statistics tracking
├── CommandSystem
│   ├── Command registry
│   ├── Argument parsing
│   └── Built-in commands
└── ChatbotCLI
    └── Readline interface
```

## 💻 API Programmatique

```javascript
const { Chatbot } = require('./index');

const bot = new Chatbot();

// Ajouter un pattern personnalisé
bot.matcher.addPattern(
  /weather in (\w+)/,
  (match) => `Weather in ${match[1]}: Sunny! ☀️`,
  5 // Priority
);

// Interagir
const response = bot.respond('Hello!');
console.log(response); // "Hi there! What's your name?"

// Ajouter une commande
bot.commands.register('version', 'Show bot version', () => {
  return 'Bot v1.0.0';
});

// Accéder au contexte
bot.context.set('customData', 'value');
const data = bot.context.get('customData');

// Exporter la conversation
const exported = bot.context.export();
fs.writeFileSync('conversation.json', JSON.stringify(exported));
```

## 🎯 Concepts Clés

### 1. Pattern Matching avec priorités

```javascript
// Priorité plus haute = matchée en premier
matcher.addPattern(/^hello/, 'Hi!', priority: 10);
matcher.addPattern(/.*/, 'Default', priority: 0);
```

### 2. Capture Groups

```javascript
matcher.addPattern(
  /my name is (\w+)/,
  (match) => `Nice to meet you, ${match[1]}!`
);
```

### 3. Context Management

```javascript
context.set('userName', 'Alice');
context.remember('favoriteColor', 'blue');

// Plus tard
const name = context.get('userName');
const color = context.recall('favoriteColor');
```

### 4. Command System

```javascript
commands.register('greet', 'Say hello', (args) => {
  const name = args[0] || 'stranger';
  return `Hello ${name}!`;
});

// Usage: /greet Alice
```

### 5. Conversation History

```javascript
context.addToHistory(userInput, botResponse);
const history = context.history; // 50 derniers messages
```

## 🌟 Extensions Possibles

### 1. Sentiment Analysis

```javascript
bot.matcher.addPattern(
  /(sad|unhappy|angry)/,
  () => 'I\'m sorry you feel that way. Want to talk about it?',
  8
);
```

### 2. Multi-langue

```javascript
bot.matcher.addPattern(
  /^(hola|buenos días)/,
  '¡Hola! ¿Cómo estás?',
  10
);
```

### 3. API Integration

```javascript
bot.commands.register('weather', 'Get weather', async (args) => {
  const city = args[0];
  const weather = await fetchWeather(city);
  return `Weather in ${city}: ${weather.temp}°C`;
});
```

### 4. Learning System

```javascript
bot.commands.register('learn', 'Teach the bot', (args) => {
  const [pattern, response] = args.join(' ').split('->');
  bot.matcher.addPattern(
    new RegExp(pattern.trim(), 'i'),
    response.trim()
  );
  return 'Learned!';
});

// Usage: /learn what is your name -> I'm ChatBot!
```

## 📊 Performance

| Opération | Complexité | Notes |
|-----------|------------|-------|
| Pattern match | O(n) | n = nombre de patterns |
| Command execute | O(1) | Map lookup |
| History add | O(1) | Array push |
| Context get/set | O(1) | Object access |

## 📁 Structure

```
day-17-chatbot-cli/
├── index.js       ← Chatbot + CLI
├── package.json
└── README.md
```

## 🎉 Stats Projet

- **15+ built-in patterns** : Prêt à l'emploi
- **7 commands** : Extensible facilement
- **Context-aware** : Se souvient de vous
- **Zero dependencies** : Pure Node.js
- **Export/Import** : Sauvegarde conversations

---

**Semaine 4 : 2/5 jours · 17/30 total · 57% complet**

*"The best chatbot is one that feels human."* — Unknown