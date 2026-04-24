'use strict';

const fs = require('fs');
const path = require('path');

/**
 * ============================================================
 * DAY 18 — Sentiment Analyzer (NLP)
 * ============================================================
 * Algorithme  : Lexicon-based + Scoring
 * Complexité  : O(n) où n = nombre de mots
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── Lexicon (Dictionnaire émotionnel) ──────────────────────

const LEXICON_EN = {
  // Positifs (score 1-3)
  excellent: 3, amazing: 3, fantastic: 3, wonderful: 3, perfect: 3,
  great: 2, good: 2, nice: 2, happy: 2, love: 2, beautiful: 2,
  like: 1, fine: 1, okay: 1, pleasant: 1, satisfied: 1,
  
  // Négatifs (score -1 à -3)
  terrible: -3, horrible: -3, awful: -3, worst: -3, hate: -3,
  bad: -2, poor: -2, sad: -2, angry: -2, disappointed: -2,
  dislike: -1, annoying: -1, boring: -1, mediocre: -1,
  
  // Intensificateurs
  very: 1.5, extremely: 2, absolutely: 2, really: 1.3,
  slightly: 0.5, somewhat: 0.7, barely: 0.3,
  
  // Négation
  not: -1, never: -1, no: -1, neither: -1, nobody: -1,
};

const LEXICON_FR = {
  // Positifs
  excellent: 3, magnifique: 3, fantastique: 3, merveilleux: 3, parfait: 3,
  super: 2, bien: 2, bon: 2, content: 2, joyeux: 2, beau: 2,
  aimer: 1, agréable: 1, satisfait: 1,
  
  // Négatifs
  terrible: -3, horrible: -3, affreux: -3, pire: -3, détester: -3,
  mauvais: -2, nul: -2, triste: -2, fâché: -2, déçu: -2,
  ennuyeux: -1, médiocre: -1,
  
  // Intensificateurs
  très: 1.5, extrêmement: 2, vraiment: 1.3, légèrement: 0.5,
  
  // Négation
  pas: -1, jamais: -1, non: -1, aucun: -1,
};

// ─── Sentiment Analyzer ──────────────────────────────────────

class SentimentAnalyzer {
  constructor(language = 'en') {
    this.language = language;
    this.lexicon = language === 'fr' ? LEXICON_FR : LEXICON_EN;
    this.stats = {
      totalAnalyzed: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
    };
  }

  /**
   * Analyse le sentiment d'un texte
   * @param {string} text
   * @returns {Object}
   */
  analyze(text) {
    if (!text || typeof text !== 'string') {
      throw new TypeError('Text must be a string');
    }

    // Normaliser le texte
    const normalized = this.normalize(text);
    const words = this.tokenize(normalized);
    
    // Calculer le score
    const { score, breakdown } = this.calculateScore(words);
    
    // Déterminer le sentiment
    const sentiment = this.determineSentiment(score);
    const confidence = this.calculateConfidence(score, words.length);
    
    // Statistiques
    this.stats.totalAnalyzed++;
    this.stats[sentiment.toLowerCase()]++;

    return {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      sentiment,
      score,
      confidence,
      words: words.length,
      breakdown,
      language: this.language,
    };
  }

  /**
   * Analyse batch de textes
   * @param {Array<string>} texts
   * @returns {Object}
   */
  analyzeBatch(texts) {
    const results = texts.map(text => this.analyze(text));
    
    return {
      results,
      summary: {
        total: results.length,
        positive: results.filter(r => r.sentiment === 'Positive').length,
        negative: results.filter(r => r.sentiment === 'Negative').length,
        neutral: results.filter(r => r.sentiment === 'Neutral').length,
        avgScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
      },
    };
  }

  /**
   * Normalise le texte
   */
  normalize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s']/g, ' ') // Garder apostrophes
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Tokenize (découpe en mots)
   */
  tokenize(text) {
    return text.split(' ').filter(word => word.length > 0);
  }

  /**
   * Calcule le score de sentiment
   */
  calculateScore(words) {
    let score = 0;
    let multiplier = 1;
    const breakdown = {
      positive: [],
      negative: [],
      intensifiers: [],
      negations: [],
    };

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordScore = this.lexicon[word];

      if (wordScore === undefined) continue;

      // Négation
      if (wordScore < 0 && wordScore > -1.5) {
        multiplier *= -1;
        breakdown.negations.push(word);
        continue;
      }

      // Intensificateur
      if (Math.abs(wordScore) < 3 && wordScore > 0 && wordScore < 1) {
        const nextWord = words[i + 1];
        const nextScore = this.lexicon[nextWord];
        
        if (nextScore && Math.abs(nextScore) >= 1) {
          multiplier *= wordScore;
          breakdown.intensifiers.push(word);
          continue;
        }
      }

      // Mot émotionnel
      const finalScore = wordScore * multiplier;
      score += finalScore;

      if (finalScore > 0) {
        breakdown.positive.push({ word, score: finalScore });
      } else if (finalScore < 0) {
        breakdown.negative.push({ word, score: finalScore });
      }

      // Reset multiplier
      multiplier = 1;
    }

    return { score: parseFloat(score.toFixed(2)), breakdown };
  }

  /**
   * Détermine le sentiment (Positive/Negative/Neutral)
   */
  determineSentiment(score) {
    if (score > 0.5) return 'Positive';
    if (score < -0.5) return 'Negative';
    return 'Neutral';
  }

  /**
   * Calcule la confiance (0-100%)
   */
  calculateConfidence(score, wordCount) {
    // Plus le score est élevé et plus il y a de mots, plus on est confiant
    const absScore = Math.abs(score);
    const wordFactor = Math.min(wordCount / 10, 1); // Max à 10 mots
    const scoreFactor = Math.min(absScore / 5, 1);  // Max à score 5
    
    const confidence = ((scoreFactor * 0.7 + wordFactor * 0.3) * 100);
    return parseFloat(confidence.toFixed(1));
  }

  /**
   * Obtient les statistiques globales
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Réinitialise les statistiques
   */
  resetStats() {
    this.stats = {
      totalAnalyzed: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
    };
  }
}

// ─── Comparative Analysis ────────────────────────────────────

class ComparativeAnalyzer {
  /**
   * Compare deux textes
   */
  static compare(text1, text2, language = 'en') {
    const analyzer = new SentimentAnalyzer(language);
    
    const result1 = analyzer.analyze(text1);
    const result2 = analyzer.analyze(text2);

    return {
      text1: result1,
      text2: result2,
      difference: parseFloat((result1.score - result2.score).toFixed(2)),
      winner: result1.score > result2.score ? 'Text 1' : 
              result1.score < result2.score ? 'Text 2' : 'Tie',
    };
  }

  /**
   * Analyse l'évolution du sentiment sur plusieurs textes
   */
  static analyzeEvolution(texts, language = 'en') {
    const analyzer = new SentimentAnalyzer(language);
    const results = texts.map((text, index) => ({
      index: index + 1,
      ...analyzer.analyze(text),
    }));

    // Calculer la tendance
    const scores = results.map(r => r.score);
    const trend = this.calculateTrend(scores);

    return {
      results,
      trend,
      overall: {
        avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
        mostPositive: results.reduce((max, r) => r.score > max.score ? r : max),
        mostNegative: results.reduce((min, r) => r.score < min.score ? r : min),
      },
    };
  }

  static calculateTrend(scores) {
    if (scores.length < 2) return 'insufficient data';
    
    const first = scores[0];
    const last = scores[scores.length - 1];
    
    if (last > first + 0.5) return 'improving';
    if (last < first - 0.5) return 'declining';
    return 'stable';
  }
}

// ─── CLI Interface ───────────────────────────────────────────

async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help') {
    console.log(`
Usage:
  node index.js analyze <text> [--lang en|fr]
  node index.js file <filepath> [--lang en|fr]
  node index.js compare <text1> <text2> [--lang en|fr]

Commands:
  analyze   Analyze sentiment of text
  file      Analyze text from file
  compare   Compare two texts

Options:
  --lang    Language (en or fr, default: en)

Examples:
  node index.js analyze "I love this product!"
  node index.js analyze "C'est magnifique!" --lang fr
  node index.js file review.txt
  node index.js compare "Great product" "Terrible experience"
    `);
    process.exit(0);
  }

  try {
    const langIdx = args.indexOf('--lang');
    const language = langIdx !== -1 ? args[langIdx + 1] : 'en';

    if (command === 'analyze') {
      const text = args.slice(1, langIdx !== -1 ? langIdx : undefined).join(' ');
      
      if (!text) {
        console.error('❌ Text required');
        process.exit(1);
      }

      const analyzer = new SentimentAnalyzer(language);
      const result = analyzer.analyze(text);

      console.log('\n📊 SENTIMENT ANALYSIS');
      console.log('─'.repeat(50));
      console.log(`Text      : ${result.text}`);
      console.log(`Sentiment : ${getSentimentEmoji(result.sentiment)} ${result.sentiment}`);
      console.log(`Score     : ${result.score}`);
      console.log(`Confidence: ${result.confidence}%`);
      console.log(`Words     : ${result.words}`);
      
      if (result.breakdown.positive.length > 0) {
        console.log('\n✅ Positive words:');
        result.breakdown.positive.forEach(w => {
          console.log(`   ${w.word} (+${w.score.toFixed(1)})`);
        });
      }
      
      if (result.breakdown.negative.length > 0) {
        console.log('\n❌ Negative words:');
        result.breakdown.negative.forEach(w => {
          console.log(`   ${w.word} (${w.score.toFixed(1)})`);
        });
      }

      console.log('');

    } else if (command === 'file') {
      const filepath = args[1];
      
      if (!filepath) {
        console.error('❌ Filepath required');
        process.exit(1);
      }

      const text = fs.readFileSync(filepath, 'utf8');
      const analyzer = new SentimentAnalyzer(language);
      const result = analyzer.analyze(text);

      console.log('\n📊 FILE SENTIMENT ANALYSIS');
      console.log('─'.repeat(50));
      console.log(`File      : ${filepath}`);
      console.log(`Sentiment : ${getSentimentEmoji(result.sentiment)} ${result.sentiment}`);
      console.log(`Score     : ${result.score}`);
      console.log(`Confidence: ${result.confidence}%`);
      console.log('');

    } else if (command === 'compare') {
      const text1 = args[1];
      const text2 = args[2];

      if (!text1 || !text2) {
        console.error('❌ Two texts required');
        process.exit(1);
      }

      const result = ComparativeAnalyzer.compare(text1, text2, language);

      console.log('\n📊 COMPARATIVE ANALYSIS');
      console.log('─'.repeat(50));
      console.log(`\nText 1: ${result.text1.sentiment} (${result.text1.score})`);
      console.log(`Text 2: ${result.text2.sentiment} (${result.text2.score})`);
      console.log(`\nDifference: ${result.difference}`);
      console.log(`Winner: ${result.winner}`);
      console.log('');

    } else {
      console.error(`❌ Unknown command: "${command}"`);
      process.exit(1);
    }

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

function getSentimentEmoji(sentiment) {
  switch (sentiment) {
    case 'Positive': return '😊';
    case 'Negative': return '😞';
    case 'Neutral': return '😐';
    default: return '🤔';
  }
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  SentimentAnalyzer,
  ComparativeAnalyzer,
  LEXICON_EN,
  LEXICON_FR,
};

// ─── Point d'entrée ──────────────────────────────────────────

if (require.main === module) {
  runCLI().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
  });
}