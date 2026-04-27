'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const { Database, Router, parseBody, sendJSON } = require('./index');

// ─────────────────────────────────────────────────────────────
// Database
// ─────────────────────────────────────────────────────────────
describe('Database', () => {
  const testFile = './test-db.json';
  let db;

  beforeEach(() => {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    db = new Database(testFile);
  });

  afterEach(() => {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  test('initialise avec structure vide', () => {
    expect(db.data.items).toEqual([]);
    expect(db.data.nextId).toBe(1);
  });

  test('create() ajoute item avec ID auto', () => {
    const item = db.create({ name: 'Test', value: 42 });
    
    expect(item.id).toBe(1);
    expect(item.name).toBe('Test');
    expect(item.createdAt).toBeDefined();
  });

  test('getAll() retourne tous les items', () => {
    db.create({ name: 'Item1' });
    db.create({ name: 'Item2' });
    
    const items = db.getAll();
    expect(items.length).toBe(2);
  });

  test('getById() trouve item par ID', () => {
    const created = db.create({ name: 'Test' });
    const found = db.getById(created.id);
    
    expect(found).toBeDefined();
    expect(found.name).toBe('Test');
  });

  test('update() modifie item', () => {
    const created = db.create({ name: 'Old', value: 1 });
    const updated = db.update(created.id, { value: 2 });
    
    expect(updated.value).toBe(2);
    expect(updated.name).toBe('Old');
  });

  test('delete() supprime item', () => {
    const created = db.create({ name: 'Test' });
    const deleted = db.delete(created.id);
    
    expect(deleted).toBe(true);
    expect(db.getById(created.id)).toBeUndefined();
  });

  test('search() trouve items', () => {
    db.create({ name: 'Apple', color: 'red' });
    db.create({ name: 'Banana', color: 'yellow' });
    
    const results = db.search('apple');
    expect(results.length).toBeGreaterThan(0);
  });

  test('persistence sauvegarde automatiquement', () => {
    db.create({ name: 'Persistent' });
    
    const db2 = new Database(testFile);
    expect(db2.getAll().length).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────
describe('Router', () => {
  let router;

  beforeEach(() => {
    router = new Router();
  });

  test('add() ajoute route', () => {
    router.add('GET', /^\/test$/, () => {});
    expect(router.routes.length).toBe(1);
  });

  test('get() ajoute route GET', () => {
    router.get(/^\/items$/, () => {});
    expect(router.routes[0].method).toBe('GET');
  });

  test('post() ajoute route POST', () => {
    router.post(/^\/items$/, () => {});
    expect(router.routes[0].method).toBe('POST');
  });

  test('match() trouve route correspondante', () => {
    router.get(/^\/items\/(\d+)$/, () => 'handler');
    
    const match = router.match('GET', '/items/123');
    expect(match).not.toBeNull();
    expect(match.params[0]).toBe('123');
  });

  test('match() retourne null si pas de match', () => {
    router.get(/^\/items$/, () => {});
    
    const match = router.match('GET', '/other');
    expect(match).toBeNull();
  });

  test('match() respecte la méthode HTTP', () => {
    router.get(/^\/items$/, () => {});
    
    const match = router.match('POST', '/items');
    expect(match).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// parseBody()
// ─────────────────────────────────────────────────────────────
describe('parseBody()', () => {
  test('parse JSON valide', async () => {
    const req = {
      on: jest.fn((event, handler) => {
        if (event === 'data') {
          handler(Buffer.from('{"name":"test"}'));
        } else if (event === 'end') {
          handler();
        }
      })
    };

    const body = await parseBody(req);
    expect(body.name).toBe('test');
  });

  test('retourne objet vide si pas de body', async () => {
    const req = {
      on: jest.fn((event, handler) => {
        if (event === 'end') {
          handler();
        }
      })
    };

    const body = await parseBody(req);
    expect(body).toEqual({});
  });

  test('rejette JSON invalide', async () => {
    const req = {
      on: jest.fn((event, handler) => {
        if (event === 'data') {
          handler(Buffer.from('invalid json'));
        } else if (event === 'end') {
          handler();
        } else if (event === 'error') {
          // Store for later
        }
      })
    };

    await expect(parseBody(req)).rejects.toThrow('Invalid JSON');
  });
});

// ─────────────────────────────────────────────────────────────
// sendJSON()
// ─────────────────────────────────────────────────────────────
describe('sendJSON()', () => {
  test('envoie JSON avec status code', () => {
    const res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };

    sendJSON(res, 200, { success: true });

    expect(res.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    expect(res.end).toHaveBeenCalledWith(expect.stringContaining('success'));
  });

  test('stringify les données', () => {
    const res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };

    sendJSON(res, 200, { name: 'test', value: 42 });

    const sent = res.end.mock.calls[0][0];
    const parsed = JSON.parse(sent);
    expect(parsed.name).toBe('test');
    expect(parsed.value).toBe(42);
  });
});