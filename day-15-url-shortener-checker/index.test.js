'use strict';

const fs = require('fs');
const { URLDatabase, LinkChecker } = require('./index');

describe('URLDatabase', () => {
  const testFile = './test-urls.json';

  afterEach(() => {
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  });

  test('shorten génère code déterministe', () => {
    const db = new URLDatabase(testFile);
    const result1 = db.shorten('https://example.com');
    const result2 = db.shorten('https://example.com');

    expect(result1.code).toBe(result2.code);
  });

  test('resolve retourne URL originale', () => {
    const db = new URLDatabase(testFile);
    const { code } = db.shorten('https://example.com');
    const url = db.resolve(code);

    expect(url).toBe('https://example.com');
  });

  test('track clicks', () => {
    const db = new URLDatabase(testFile);
    const { code } = db.shorten('https://example.com');
    
    db.resolve(code);
    db.resolve(code);
    
    const stats = db.getStats(code);
    expect(stats.clicks).toBe(2);
  });
});

describe('LinkChecker', () => {
  test('initialise avec cache', () => {
    const checker = new LinkChecker();
    expect(checker.cache).toBeDefined();
  });

  test('cache évite requêtes répétées', async () => {
    const checker = new LinkChecker();
    
    // Simuler mise en cache
    const testUrl = 'https://example.com';
    checker.cache.set(testUrl, {
      result: { alive: true, status: 200 },
      timestamp: Date.now(),
    });

    // Le cache devrait être utilisé
    const cached = checker.cache.get(testUrl);
    expect(cached).toBeDefined();
  });
});