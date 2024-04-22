'use strict';

const {
  sort,
  sortBy,
  groupBy,
  stats,
  getNestedValue,
  compareValues,
  detectType,
  validateData,
  validateCriteria,
  SORT_ORDER,
  DATA_TYPES,
} = require('./index');

// ─────────────────────────────────────────────────────────────
// validateData()
// ─────────────────────────────────────────────────────────────
describe('validateData()', () => {
  test('accepte un tableau d\'objets', () => {
    expect(() => validateData([{ a: 1 }])).not.toThrow();
  });

  test('accepte un tableau vide', () => {
    expect(() => validateData([])).not.toThrow();
  });

  test('rejette non-tableau', () => {
    expect(() => validateData('abc')).toThrow(TypeError);
  });

  test('rejette tableau de primitives', () => {
    expect(() => validateData([1, 2, 3])).toThrow(TypeError);
  });
});

// ─────────────────────────────────────────────────────────────
// validateCriteria()
// ─────────────────────────────────────────────────────────────
describe('validateCriteria()', () => {
  test('accepte critères valides', () => {
    expect(() => validateCriteria([{ key: 'age' }])).not.toThrow();
  });

  test('rejette non-tableau', () => {
    expect(() => validateCriteria('age')).toThrow(TypeError);
  });

  test('rejette tableau vide', () => {
    expect(() => validateCriteria([])).toThrow('Au moins un critère');
  });

  test('rejette critère sans key', () => {
    expect(() => validateCriteria([{ order: 'asc' }])).toThrow('propriété "key"');
  });

  test('rejette order invalide', () => {
    expect(() => validateCriteria([{ key: 'age', order: 'invalid' }])).toThrow('asc');
  });
});

// ─────────────────────────────────────────────────────────────
// getNestedValue()
// ─────────────────────────────────────────────────────────────
describe('getNestedValue()', () => {
  test('accède à une propriété simple', () => {
    expect(getNestedValue({ age: 30 }, 'age')).toBe(30);
  });

  test('accède à une propriété imbriquée', () => {
    expect(getNestedValue({ user: { name: 'Alice' } }, 'user.name')).toBe('Alice');
  });

  test('accède à 3 niveaux', () => {
    expect(getNestedValue({ a: { b: { c: 42 } } }, 'a.b.c')).toBe(42);
  });

  test('retourne undefined si propriété inexistante', () => {
    expect(getNestedValue({ age: 30 }, 'name')).toBeUndefined();
  });

  test('retourne undefined si chemin rompu', () => {
    expect(getNestedValue({ user: null }, 'user.name')).toBeUndefined();
  });

  test('supporte les tableaux avec index', () => {
    expect(getNestedValue({ items: [10, 20, 30] }, 'items[1]')).toBe(20);
  });

  test('retourne undefined si index hors range', () => {
    expect(getNestedValue({ items: [10] }, 'items[5]')).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────
// detectType()
// ─────────────────────────────────────────────────────────────
describe('detectType()', () => {
  test('détecte string',  () => expect(detectType('abc')).toBe(DATA_TYPES.STRING));
  test('détecte number',  () => expect(detectType(42)).toBe(DATA_TYPES.NUMBER));
  test('détecte boolean', () => expect(detectType(true)).toBe(DATA_TYPES.BOOLEAN));
  test('détecte null',    () => expect(detectType(null)).toBe(DATA_TYPES.NULL));
  test('détecte undefined',()=> expect(detectType(undefined)).toBe(DATA_TYPES.NULL));
  test('détecte array',   () => expect(detectType([1,2])).toBe(DATA_TYPES.ARRAY));
  test('détecte object',  () => expect(detectType({})).toBe(DATA_TYPES.OBJECT));
  test('détecte Date',    () => expect(detectType(new Date())).toBe(DATA_TYPES.DATE));
  test('détecte date ISO', () => expect(detectType('2025-01-01')).toBe(DATA_TYPES.DATE));
});

// ─────────────────────────────────────────────────────────────
// compareValues()
// ─────────────────────────────────────────────────────────────
describe('compareValues()', () => {
  test('compare nombres asc', () => {
    expect(compareValues(10, 20, 'asc')).toBeLessThan(0);
    expect(compareValues(20, 10, 'asc')).toBeGreaterThan(0);
    expect(compareValues(10, 10, 'asc')).toBe(0);
  });

  test('compare nombres desc', () => {
    expect(compareValues(10, 20, 'desc')).toBeGreaterThan(0);
    expect(compareValues(20, 10, 'desc')).toBeLessThan(0);
  });

  test('compare strings asc', () => {
    expect(compareValues('a', 'b', 'asc')).toBeLessThan(0);
    expect(compareValues('b', 'a', 'asc')).toBeGreaterThan(0);
  });

  test('compare strings numériques', () => {
    // '10' vs '2' → comparaison numérique (localeCompare numeric)
    expect(compareValues('2', '10', 'asc')).toBeLessThan(0);
  });

  test('compare booleans', () => {
    expect(compareValues(false, true, 'asc')).toBeLessThan(0);
    expect(compareValues(true, false, 'asc')).toBeGreaterThan(0);
  });

  test('compare dates', () => {
    const d1 = new Date('2025-01-01');
    const d2 = new Date('2025-12-31');
    expect(compareValues(d1, d2, 'asc')).toBeLessThan(0);
  });

  test('null toujours en fin (asc)', () => {
    expect(compareValues(null, 10, 'asc')).toBeGreaterThan(0);
    expect(compareValues(10, null, 'asc')).toBeLessThan(0);
  });
});

// ─────────────────────────────────────────────────────────────
// sort() & sortBy()
// ─────────────────────────────────────────────────────────────
describe('sort()', () => {
  test('trie par un critère simple', () => {
    const data = [{ age: 30 }, { age: 20 }, { age: 25 }];
    const sorted = sort(data, [{ key: 'age', order: 'asc' }]);
    expect(sorted.map(x => x.age)).toEqual([20, 25, 30]);
  });

  test('trie en ordre descendant', () => {
    const data = [{ age: 20 }, { age: 30 }, { age: 25 }];
    const sorted = sort(data, [{ key: 'age', order: 'desc' }]);
    expect(sorted.map(x => x.age)).toEqual([30, 25, 20]);
  });

  test('trie par propriété imbriquée', () => {
    const data = [
      { user: { name: 'Charlie' } },
      { user: { name: 'Alice' } },
      { user: { name: 'Bob' } },
    ];
    const sorted = sort(data, [{ key: 'user.name', order: 'asc' }]);
    expect(sorted.map(x => x.user.name)).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  test('trie multi-critères', () => {
    const data = [
      { age: 30, name: 'Charlie' },
      { age: 20, name: 'Bob' },
      { age: 30, name: 'Alice' },
    ];
    const sorted = sort(data, [
      { key: 'age', order: 'asc' },
      { key: 'name', order: 'asc' },
    ]);
    expect(sorted).toEqual([
      { age: 20, name: 'Bob' },
      { age: 30, name: 'Alice' },
      { age: 30, name: 'Charlie' },
    ]);
  });

  test('ne modifie pas le tableau original par défaut', () => {
    const data = [{ age: 30 }, { age: 20 }];
    const original = [...data];
    sort(data, [{ key: 'age' }]);
    expect(data).toEqual(original);
  });

  test('modifie le tableau si mutate=true', () => {
    const data = [{ age: 30 }, { age: 20 }];
    sort(data, [{ key: 'age' }], { mutate: true });
    expect(data[0].age).toBe(20);
  });

  test('gère null/undefined', () => {
    const data = [{ age: 30 }, { age: null }, { age: 20 }];
    const sorted = sort(data, [{ key: 'age' }]);
    expect(sorted[0].age).toBe(20);
    expect(sorted[1].age).toBe(30);
    expect(sorted[2].age).toBe(null); // null en fin
  });

  test('lance TypeError si data non-tableau', () => {
    expect(() => sort('abc', [{ key: 'age' }])).toThrow(TypeError);
  });

  test('lance Error si criteria vide', () => {
    expect(() => sort([{ age: 20 }], [])).toThrow('Au moins un critère');
  });
});

describe('sortBy()', () => {
  test('syntaxe simplifiée asc', () => {
    const data = [{ age: 30 }, { age: 20 }];
    const sorted = sortBy(data, 'age');
    expect(sorted.map(x => x.age)).toEqual([20, 30]);
  });

  test('syntaxe simplifiée desc', () => {
    const data = [{ age: 20 }, { age: 30 }];
    const sorted = sortBy(data, 'age', 'desc');
    expect(sorted.map(x => x.age)).toEqual([30, 20]);
  });
});

// ─────────────────────────────────────────────────────────────
// groupBy()
// ─────────────────────────────────────────────────────────────
describe('groupBy()', () => {
  test('groupe par propriété simple', () => {
    const data = [
      { age: 20, name: 'Alice' },
      { age: 30, name: 'Bob' },
      { age: 20, name: 'Charlie' },
    ];
    const grouped = groupBy(data, 'age');
    expect(grouped['20'].length).toBe(2);
    expect(grouped['30'].length).toBe(1);
  });

  test('groupe par propriété imbriquée', () => {
    const data = [
      { user: { role: 'admin' } },
      { user: { role: 'user' } },
      { user: { role: 'admin' } },
    ];
    const grouped = groupBy(data, 'user.role');
    expect(grouped['admin'].length).toBe(2);
    expect(grouped['user'].length).toBe(1);
  });

  test('gère les valeurs null', () => {
    const data = [{ age: 20 }, { age: null }, { age: 20 }];
    const grouped = groupBy(data, 'age');
    expect(grouped['20'].length).toBe(2);
    expect(grouped['__null__'].length).toBe(1);
  });

  test('lance TypeError si data non-tableau', () => {
    expect(() => groupBy('abc', 'age')).toThrow(TypeError);
  });
});

// ─────────────────────────────────────────────────────────────
// stats()
// ─────────────────────────────────────────────────────────────
describe('stats()', () => {
  test('calcule stats sur champ numérique', () => {
    const data = [{ price: 10 }, { price: 20 }, { price: 30 }];
    const result = stats(data, 'price');
    expect(result.min).toBe(10);
    expect(result.max).toBe(30);
    expect(result.avg).toBe(20);
    expect(result.sum).toBe(60);
    expect(result.count).toBe(3);
  });

  test('ignore les valeurs non-numériques', () => {
    const data = [{ price: 10 }, { price: 'abc' }, { price: 20 }];
    const result = stats(data, 'price');
    expect(result.count).toBe(2);
    expect(result.avg).toBe(15);
  });

  test('retourne nulls si aucune valeur numérique', () => {
    const data = [{ price: 'abc' }, { price: null }];
    const result = stats(data, 'price');
    expect(result.min).toBeNull();
    expect(result.max).toBeNull();
    expect(result.avg).toBeNull();
  });

  test('supporte propriétés imbriquées', () => {
    const data = [{ item: { price: 100 } }, { item: { price: 200 } }];
    const result = stats(data, 'item.price');
    expect(result.avg).toBe(150);
  });
});

// ─────────────────────────────────────────────────────────────
// Intégration & Performance
// ─────────────────────────────────────────────────────────────
describe('Intégration', () => {
  test('tri complexe avec 3 critères', () => {
    const data = [
      { category: 'B', priority: 1, name: 'Item 3' },
      { category: 'A', priority: 2, name: 'Item 1' },
      { category: 'A', priority: 1, name: 'Item 2' },
      { category: 'B', priority: 1, name: 'Item 4' },
    ];
    const sorted = sort(data, [
      { key: 'category', order: 'asc' },
      { key: 'priority', order: 'asc' },
      { key: 'name', order: 'asc' },
    ]);
    expect(sorted[0].name).toBe('Item 2');
    expect(sorted[1].name).toBe('Item 1');
    expect(sorted[2].name).toBe('Item 3');
  });

  test('tri de 10k objets en < 100ms', () => {
    const data = Array.from({ length: 10_000 }, (_, i) => ({
      id: i,
      value: Math.floor(Math.random() * 1000),
    }));
    const start = performance.now();
    sort(data, [{ key: 'value' }]);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  test('groupe 5k objets en < 50ms', () => {
    const data = Array.from({ length: 5000 }, (_, i) => ({
      category: `cat${i % 10}`,
    }));
    const start = performance.now();
    groupBy(data, 'category');
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  test('stats sur 10k valeurs en < 50ms', () => {
    const data = Array.from({ length: 10_000 }, (_, i) => ({ value: i }));
    const start = performance.now();
    stats(data, 'value');
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});