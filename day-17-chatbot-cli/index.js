'use strict';

const readline = require('readline');
const fs = require('fs');
const path = require('path');

/**
 * ============================================================
 * DAY 17 — Chatbot CLI (Intelligent Assistant)
 * ============================================================
 * Algorithme  : Pattern Matching + Context Management
 * Complexité  : O(n) où n = nombre de patterns
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── Pattern Matching Engine ────────────────────────────────

class PatternMatcher {
  constructor() {
    this.patterns = [];
  }

  addPattern(pattern, response, priority = 0) {
    this.patterns.push({
      pattern: typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern,
      response,
      priority,
    });
    
    // Trier par priorité (plus haute en premier)
    this.patterns.sort((a, b) => b.priority - a.priority);
  }

  match(input) {
    for (const { pattern, response } of this.patterns) {
      const match = input.match(pattern);
      if (match) {
        return {
          matched: true,
          response: typeof response === 'function' ? response(match) : response,
          matches: match,
        };
      }
    }
    return { matched: false };
  }
}

// ─── Context Manager ─────────────────────────────────────────

class ContextManager {
  constructor() {
    this.context = {
      userName: null,
      userAge: null,
      userLocation: null,
      lastTopic: null,
      conversationCount: 0,
      startTime: Date.now(),
      memory: {},
    };
    this.history = [];
  }

  set(key, value) {
    this.context[key] = value;
  }

  get(key) {
    return this.context[key];
  }

  remember(key, value) {
    this.context.memory[key] = value;
  }

  recall(key) {
    return this.context.memory[key];
  }

  addToHistory(userInput, botResponse) {
    this.history.push({
      user: userInput,
      bot: botResponse,
      timestamp: new Date().toISOString(),
    });
    
    // Garder seulement les 50 dernières
    if (this.history.length > 50) {
      this.history.shift();
    }
  }

  getStats() {
    const duration = Math.floor((Date.now() - this.context.startTime) / 1000);
    return {
      messages: this.context.conversationCount,
      duration: this.formatDuration(duration),
      userName: this.context.userName,
    };
  }

  formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  export() {
    return {
      context: this.context,
      history: this.history,
    };
  }

  import(data) {
    this.context = data.context || this.context;
    this.history = data.history || this.history;
  }
}

// ─── Command System ──────────────────────────────────────────

class CommandSystem {
  constructor(chatbot) {
    this.chatbot = chatbot;
    this.commands = new Map();
    this.setupDefaultCommands();
  }

  setupDefaultCommands() {
    this.register('help', 'Show available commands', () => {
      let help = '📋 Available Commands:\n';
      for (const [name, cmd] of this.commands) {
        help += `  /${name} - ${cmd.description}\n`;
      }
      return help;
    });

    this.register('clear', 'Clear conversation history', () => {
      this.chatbot.context.history = [];
      return '🗑️  History cleared!';
    });

    this.register('stats', 'Show conversation statistics', () => {
      const stats = this.chatbot.context.getStats();
      return `📊 Stats:\n  Messages: ${stats.messages}\n  Duration: ${stats.duration}${stats.userName ? `\n  User: ${stats.userName}` : ''}`;
    });

    this.register('save', 'Save conversation to file', () => {
      const data = this.chatbot.context.export();
      const filename = `conversation-${Date.now()}.json`;
      fs.writeFileSync(filename, JSON.stringify(data, null, 2));
      return `💾 Conversation saved to ${filename}`;
    });

    this.register('mood', 'Change bot personality', (args) => {
      const moods = ['friendly', 'professional', 'funny', 'poetic'];
      const mood = args[0] || 'friendly';
      if (moods.includes(mood)) {
        this.chatbot.context.set('mood', mood);
        return `🎭 Mood changed to: ${mood}`;
      }
      return `Available moods: ${moods.join(', ')}`;
    });

    this.register('remember', 'Remember something', (args) => {
      const text = args.join(' ');
      const parts = text.split(' as ');
      if (parts.length === 2) {
        this.chatbot.context.remember(parts[1].trim(), parts[0].trim());
        return `🧠 Remembered: ${parts[1]} = ${parts[0]}`;
      }
      return 'Usage: /remember <value> as <key>';
    });

    this.register('recall', 'Recall something', (args) => {
      const key = args.join(' ');
      const value = this.chatbot.context.recall(key);
      return value ? `💭 ${key} = ${value}` : `❌ I don't remember "${key}"`;
    });
  }

  register(name, description, handler) {
    this.commands.set(name, { description, handler });
  }

  execute(input) {
    const parts = input.substring(1).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const cmd = this.commands.get(command);
    if (cmd) {
      return cmd.handler(args);
    }

    return `❌ Unknown command: /${command}\nType /help for available commands.`;
  }

  isCommand(input) {
    return input.startsWith('/');
  }
}

// ─── Chatbot ─────────────────────────────────────────────────

class Chatbot {
  constructor() {
    this.matcher = new PatternMatcher();
    this.context = new ContextManager();
    this.commands = new CommandSystem(this);
    this.setupPatterns();
  }

  setupPatterns() {
    // Salutations
    this.matcher.addPattern(
      /^(hi|hello|hey|bonjour|salut)/,
      (match) => {
        const greetings = ['Hello!', 'Hi there!', 'Hey!', 'Greetings!'];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        return this.context.userName 
          ? `${greeting} ${this.context.userName}! How can I help you?`
          : `${greeting} What's your name?`;
      },
      10
    );

    // Nom
    this.matcher.addPattern(
      /my name is (\w+)|i'm (\w+)|i am (\w+)|call me (\w+)/,
      (match) => {
        const name = match[1] || match[2] || match[3] || match[4];
        this.context.set('userName', name);
        return `Nice to meet you, ${name}! 😊`;
      },
      10
    );

    // Âge
    this.matcher.addPattern(
      /i'm (\d+)|i am (\d+) years? old|my age is (\d+)/,
      (match) => {
        const age = match[1] || match[2] || match[3];
        this.context.set('userAge', parseInt(age));
        return age < 18 ? 'You\'re quite young!' : 'Nice!';
      },
      9
    );

    // Comment ça va
    this.matcher.addPattern(
      /how are you|how're you|what's up|wassup/,
      () => {
        const responses = [
          'I\'m doing great! Thanks for asking! 😊',
          'All good! How about you?',
          'Fantastic! Ready to chat!',
          'I\'m a bot, so always 100%! How are you?',
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      },
      8
    );

    // Météo
    this.matcher.addPattern(
      /weather|temperature|forecast/,
      () => {
        this.context.set('lastTopic', 'weather');
        return '🌤️ I don\'t have real-time weather data, but you can check weather APIs! Try asking about something else.';
      },
      7
    );

    // Heure
    this.matcher.addPattern(
      /what time|current time|what's the time/,
      () => {
        const now = new Date();
        return `🕐 Current time: ${now.toLocaleTimeString()}`;
      },
      7
    );

    // Date
    this.matcher.addPattern(
      /what date|today's date|what day/,
      () => {
        const now = new Date();
        return `📅 Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
      },
      7
    );

    // Calcul
    this.matcher.addPattern(
      /calculate|compute|what is (\d+)\s*([+\-*/])\s*(\d+)/,
      (match) => {
        if (match[1] && match[2] && match[3]) {
          const a = parseFloat(match[1]);
          const op = match[2];
          const b = parseFloat(match[3]);
          let result;
          
          switch (op) {
            case '+': result = a + b; break;
            case '-': result = a - b; break;
            case '*': result = a * b; break;
            case '/': result = b !== 0 ? a / b : 'Error: Division by zero'; break;
          }
          
          return `🔢 ${a} ${op} ${b} = ${result}`;
        }
        return '🔢 I can do calculations! Try: "what is 5 + 3"';
      },
      7
    );

    // Blagues
    this.matcher.addPattern(
      /joke|funny|make me laugh/,
      () => {
        const jokes = [
          'Why do programmers prefer dark mode? Because light attracts bugs! 🐛',
          'How many programmers does it take to change a lightbulb? None, that\'s a hardware problem! 💡',
          'A SQL query walks into a bar, walks up to two tables and asks: "Can I join you?" 🍺',
          'Why did the developer go broke? Because he used up all his cache! 💸',
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
      },
      6
    );

    // Aide
    this.matcher.addPattern(
      /^help$|^what can you do|^commands$/,
      () => 'Type /help to see available commands, or just chat with me naturally!',
      9
    );

    // Au revoir
    this.matcher.addPattern(
      /^(bye|goodbye|exit|quit|see you)/,
      () => {
        this.context.set('shouldExit', true);
        return this.context.userName 
          ? `Goodbye ${this.context.userName}! 👋`
          : 'Goodbye! 👋';
      },
      10
    );

    // Merci
    this.matcher.addPattern(
      /thank(s| you)|thx|ty/,
      () => {
        const responses = ['You\'re welcome!', 'Happy to help!', 'Anytime!', 'My pleasure! 😊'];
        return responses[Math.floor(Math.random() * responses.length)];
      },
      8
    );
  }

  respond(input) {
    input = input.trim();
    
    if (!input) {
      return null;
    }

    // Commandes
    if (this.commands.isCommand(input)) {
      return this.commands.execute(input);
    }

    // Pattern matching
    const result = this.matcher.match(input);
    
    this.context.conversationCount++;
    
    if (result.matched) {
      this.context.addToHistory(input, result.response);
      return result.response;
    }

    // Réponse par défaut
    const fallbacks = [
      'I\'m not sure I understand. Can you rephrase that?',
      'Interesting! Tell me more.',
      'I don\'t have a good answer for that yet. Try /help for commands.',
      'Hmm, I\'m still learning. Can you ask something else?',
    ];
    
    const response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    this.context.addToHistory(input, response);
    return response;
  }

  shouldExit() {
    return this.context.get('shouldExit') || false;
  }
}

// ─── CLI Interface ───────────────────────────────────────────

class ChatbotCLI {
  constructor() {
    this.bot = new Chatbot();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  start() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   🤖 Chatbot CLI - Intelligent Bot    ║');
    console.log('╚════════════════════════════════════════╝\n');
    console.log('Type your message or /help for commands\n');

    this.prompt();
  }

  prompt() {
    this.rl.question('You: ', (input) => {
      const response = this.bot.respond(input);
      
      if (response) {
        console.log(`Bot: ${response}\n`);
      }

      if (this.bot.shouldExit()) {
        this.rl.close();
        return;
      }

      this.prompt();
    });
  }
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  Chatbot,
  ChatbotCLI,
  PatternMatcher,
  ContextManager,
  CommandSystem,
};

// ─── Point d'entrée ──────────────────────────────────────────

if (require.main === module) {
  const cli = new ChatbotCLI();
  cli.start();
}