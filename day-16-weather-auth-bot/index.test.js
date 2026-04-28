'use strict';

const { JWTAuth, UserManager, WeatherAPI } = require('./index');
const fs = require('fs');

describe('JWTAuth', () => {
  const jwt = new JWTAuth('test-secret');

  test('sign génère token valide', () => {
    const token = jwt.sign({ userId: '123' });
    expect(token.split('.').length).toBe(3);
  });

  test('verify valide token correct', () => {
    const token = jwt.sign({ userId: '123' });
    const result = jwt.verify(token);
    
    expect(result.valid).toBe(true);
    expect(result.payload.userId).toBe('123');
  });

  test('rejette token expiré', (done) => {
    const token = jwt.sign({ test: true }, '0s');
    setTimeout(() => {
      const result = jwt.verify(token);
      expect(result.valid).toBe(false);
      done();
    }, 100);
  });
});

describe('UserManager', () => {
  const testFile = './test-users.json';
  
  afterEach(() => {
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  });

  test('register crée utilisateur', () => {
    const manager = new UserManager(testFile);
    const user = manager.register('alice', 'password123', 'alice@test.com');
    
    expect(user.username).toBe('alice');
    expect(user.password).toBeUndefined(); // Ne doit pas être retourné
  });

  test('login valide credentials', () => {
    const manager = new UserManager(testFile);
    manager.register('bob', 'password123');
    
    const user = manager.login('bob', 'password123');
    expect(user.username).toBe('bob');
  });

  test('setWebhook sauvegarde webhook', () => {
    const manager = new UserManager(testFile);
    const user = manager.register('test', 'pass');
    
    manager.setWebhook(user.id, 'discord', 'https://discord.com/webhook');
    const webhooks = manager.getWebhooks(user.id);
    
    expect(webhooks.discord).toBe('https://discord.com/webhook');
  });
});

describe('WeatherAPI', () => {
  test('initialise avec cache', () => {
    const api = new WeatherAPI();
    expect(api.cache).toBeDefined();
  });

  test('formatMessage génère message structuré', () => {
    const api = new WeatherAPI();
    const weather = {
      city: 'Paris',
      temperature: { current: 15, feelsLike: 13, min: 10, max: 18 },
      condition: 'Sunny',
      humidity: 65,
      windSpeed: 20,
      uvIndex: 3,
      timestamp: new Date().toISOString(),
    };

    const message = api.formatMessage(weather);
    expect(message).toContain('Paris');
    expect(message).toContain('15°C');
  });
});