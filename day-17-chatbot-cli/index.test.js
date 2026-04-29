'use strict';

const { PatternMatcher, ContextManager, Chatbot } = require('./index');

describe('PatternMatcher', () => {
  test('addPattern ajoute pattern', () => {
    const matcher = new PatternMatcher();
    matcher.addPattern(/hello/, 'Hi!');
    
    expect(matcher.patterns.length).toBe(1);
  });

  test('match trouve pattern', () => {
    const matcher = new PatternMatcher();
    matcher.addPattern(/hello/, 'Hi!');
    
    const result = matcher.match('hello world');
    expect(result.matched).toBe(true);
    expect(result.response).toBe('Hi!');
  });

  test('priorité fonctionne', () => {
    const matcher = new PatternMatcher();
    matcher.addPattern(/.*/, 'Default', 0);
    matcher.addPattern(/hello/, 'Specific', 10);
    
    const result = matcher.match('hello');
    expect(result.response).toBe('Specific');
  });
});

describe('ContextManager', () => {
  test('set/get fonctionne', () => {
    const context = new ContextManager();
    context.set('userName', 'Alice');
    
    expect(context.get('userName')).toBe('Alice');
  });

  test('remember/recall fonctionne', () => {
    const context = new ContextManager();
    context.remember('favoriteColor', 'blue');
    
    expect(context.recall('favoriteColor')).toBe('blue');
  });

  test('addToHistory enregistre conversation', () => {
    const context = new ContextManager();
    context.addToHistory('Hello', 'Hi!');
    
    expect(context.history.length).toBe(1);
    expect(context.history[0].user).toBe('Hello');
  });
});

describe('Chatbot', () => {
  test('respond retourne réponse', () => {
    const bot = new Chatbot();
    const response = bot.respond('hello');
    
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
  });

  test('extrait nom', () => {
    const bot = new Chatbot();
    const response = bot.respond('my name is Bob');
    
    expect(response).toContain('Bob');
  });

  test('calcul mathématique', () => {
    const bot = new Chatbot();
    const response = bot.respond('what is 5 + 3');
    
    expect(response).toContain('8');
  });
});