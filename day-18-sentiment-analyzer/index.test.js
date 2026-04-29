'use strict';

const { SentimentAnalyzer, ComparativeAnalyzer } = require('./index');

describe('SentimentAnalyzer', () => {
  const analyzer = new SentimentAnalyzer('en');

  test('détecte sentiment positif', () => {
    const result = analyzer.analyze('I love this product!');
    expect(result.sentiment).toBe('Positive');
    expect(result.score).toBeGreaterThan(0);
  });

  test('détecte sentiment négatif', () => {
    const result = analyzer.analyze('This is terrible and awful');
    expect(result.sentiment).toBe('Negative');
    expect(result.score).toBeLessThan(0);
  });

  test('gère intensificateurs', () => {
    const result1 = analyzer.analyze('good');
    const result2 = analyzer.analyze('very good');
    
    expect(result2.score).toBeGreaterThan(result1.score);
  });

  test('gère négations', () => {
    const result = analyzer.analyze('not good');
    expect(result.score).toBeLessThan(0);
  });

  test('analyzeBatch traite plusieurs textes', () => {
    const results = analyzer.analyzeBatch(['Great!', 'Terrible!', 'Okay']);
    
    expect(results.summary.total).toBe(3);
    expect(results.results.length).toBe(3);
  });
});

describe('ComparativeAnalyzer', () => {
  test('compare deux textes', () => {
    const result = ComparativeAnalyzer.compare('Excellent', 'Bad');
    
    expect(result.winner).toBe('Text 1');
    expect(result.difference).toBeGreaterThan(0);
  });
});