'use strict';

const { compress, decompress, analyze, validateInput } = require('./index');

// ─────────────────────────────────────────────────────────────
// validateInput
// ─────────────────────────────────────────────────────────────
describe('validateInput()', () => {
  test('accepte une chaîne normale',   () => expect(() => validateInput('abc')).not.toThrow());
  test('accepte une chaîne vide',      () => expect(() => validateInput('')).not.toThrow());
  test('rejette null',                 () => expect(() => validateInput(null)).toThrow(TypeError));
  test('rejette undefined',            () => expect(() => validateInput(undefined)).toThrow(TypeError));
  test('rejette un nombre',            () => expect(() => validateInput(42)).toThrow(TypeError));
  test('rejette un tableau',           () => expect(() => validateInput([])).toThrow(TypeError));
  test('rejette un objet',             () => expect(() => validateInput({})).toThrow(TypeError));
  test('rejette une chaîne trop longue', () => {
    const huge = 'a'.repeat(1_000_001);
    expect(() => validateInput(huge)).toThrow(RangeError);
  });
});

// ─────────────────────────────────────────────────────────────
// compress()
// ─────────────────────────────────────────────────────────────
describe('compress()', () => {
  // Cas nominaux
  test('compresse "aaabbc"   → "3a2b1c"',  () => expect(compress('aaabbc').result).toBe('3a2b1c'));
  test('compresse "aabaa"    → "2a1b2a"',  () => expect(compress('aabaa').result).toBe('2a1b2a'));
  test('compresse "aaaa"     → "4a"',      () => expect(compress('aaaa').result).toBe('4a'));
  test('compresse "abcd"     → "1a1b1c1d"',() => expect(compress('abcd').result).toBe('1a1b1c1d'));

  // Chaîne vide
  test('chaîne vide → ""', () => {
    const { result, ratio, saved } = compress('');
    expect(result).toBe('');
    expect(ratio).toBe(1);
    expect(saved).toBe(0);
  });

  // Caractère unique
  test('un seul caractère "a" → "1a"', () => {
    expect(compress('a').result).toBe('1a');
  });

  // Option noSingles
  test('option noSingles=true : "abcc" → "ab2c"', () => {
    expect(compress('abcc', { noSingles: true }).result).toBe('ab2c');
  });
  test('option noSingles=true : "abc" → "abc"', () => {
    expect(compress('abc', { noSingles: true }).result).toBe('abc');
  });

  // Option caseSensitive
  test('option caseSensitive=false : "AAaa" → "4a"', () => {
    expect(compress('AAaa', { caseSensitive: false }).result).toBe('4a');
  });
  test('caseSensitive=true (défaut) : "AAaa" → "2A2a"', () => {
    expect(compress('AAaa').result).toBe('2A2a');
  });

  // Caractères spéciaux
  test('espaces multiples compressés', () => {
    expect(compress('a   b').result).toBe('1a3 1b');
  });
  test('emojis (traités comme chaînes)', () => {
    // Les emojis sont multi-code-units — le résultat est défini mais non "intuitif"
    expect(() => compress('😀😀😀')).not.toThrow();
  });

  // Métriques de ratio
  test('ratio correct pour "aaabbc"', () => {
    const { ratio, saved } = compress('aaabbc');
    // "aaabbc" (6) → "3a2b1c" (6) → ratio = 1, saved = 0
    expect(ratio).toBe(1);
    expect(saved).toBe(0);
  });
  test('ratio < 1 pour texte très répétitif', () => {
    const { ratio } = compress('a'.repeat(100));
    expect(ratio).toBeLessThan(1);
  });
  test('saved > 0 pour texte compressible', () => {
    const { saved } = compress('a'.repeat(100));
    expect(saved).toBeGreaterThan(0);
  });

  // Erreurs
  test('lance TypeError pour input null',   () => expect(() => compress(null)).toThrow(TypeError));
  test('lance TypeError pour input number', () => expect(() => compress(123)).toThrow(TypeError));
  test('lance RangeError pour input énorme', () => {
    expect(() => compress('a'.repeat(1_000_001))).toThrow(RangeError);
  });
});

// ─────────────────────────────────────────────────────────────
// decompress()
// ─────────────────────────────────────────────────────────────
describe('decompress()', () => {
  // Cas nominaux
  test('"3a2b1c"  → "aaabbc"',     () => expect(decompress('3a2b1c')).toBe('aaabbc'));
  test('"4a"      → "aaaa"',       () => expect(decompress('4a')).toBe('aaaa'));
  test('"1a1b1c"  → "abc"',        () => expect(decompress('1a1b1c')).toBe('abc'));
  test('"10a"     → "aaaaaaaaaa"', () => expect(decompress('10a')).toBe('aaaaaaaaaa'));

  // Chaîne vide
  test('chaîne vide → ""', () => expect(decompress('')).toBe(''));

  // Round-trip : compress → decompress = original
  test('round-trip "aaabbbccdd"', () => {
    const original = 'aaabbbccdd';
    expect(decompress(compress(original).result)).toBe(original);
  });
  test('round-trip chaîne random', () => {
    const original = 'xxxxxxxyyyzzzzzaaa';
    expect(decompress(compress(original).result)).toBe(original);
  });
  test('round-trip avec noSingles=true', () => {
    const original = 'aaabbbcc';
    const { result } = compress(original, { noSingles: true });
    // "3a3b2c" → décompressable normalement
    expect(decompress(result)).toBe(original);
  });

  // Format invalide
  test('lance SyntaxError pour format invalide "abc"', () => {
    expect(() => decompress('abc')).toThrow(SyntaxError);
  });
  test('lance SyntaxError pour "3a2"', () => {
    expect(() => decompress('3a2')).toThrow(SyntaxError);
  });
  test('lance SyntaxError pour chaîne avec espaces', () => {
    expect(() => decompress('3a 2b')).toThrow(SyntaxError);
  });

  // DoS protection
  test('lance RangeError si output dépasse MAX_INPUT_LENGTH', () => {
    // "1000000a1000000b" = 2M chars → dépasse la limite
    const hugeRle = '1000000a1000000b';
    expect(() => decompress(hugeRle)).toThrow(RangeError);
  });

  // Erreurs de type
  test('lance TypeError pour null',   () => expect(() => decompress(null)).toThrow(TypeError));
  test('lance TypeError pour number', () => expect(() => decompress(42)).toThrow(TypeError));
});

// ─────────────────────────────────────────────────────────────
// analyze()
// ─────────────────────────────────────────────────────────────
describe('analyze()', () => {
  test('retourne la longueur correcte', () => {
    expect(analyze('hello').length).toBe(5);
  });

  test('compte les chars uniques de "hello"', () => {
    // h, e, l, o = 4 uniques
    expect(analyze('hello').uniqueChars).toBe(4);
  });

  test('calcule les fréquences correctement', () => {
    const { frequency } = analyze('aabbc');
    expect(frequency['a']).toBe(2);
    expect(frequency['b']).toBe(2);
    expect(frequency['c']).toBe(1);
  });

  test('entropie = 0 pour une seule lettre répétée', () => {
    // "aaaa" → p(a)=1 → entropie=0
    expect(analyze('aaaa').entropy).toBe(0);
  });

  test('entropie > 0 pour texte varié', () => {
    expect(analyze('abcdef').entropy).toBeGreaterThan(0);
  });

  test('identifie le run le plus long', () => {
    const { longestRun } = analyze('aabbbbccc');
    expect(longestRun.char).toBe('b');
    expect(longestRun.count).toBe(4);
  });

  test('chaîne vide → rapport avec longueur 0', () => {
    const report = analyze('');
    expect(report.length).toBe(0);
    expect(report.entropy).toBe(0);
    expect(report.uniqueChars).toBe(0);
  });

  test('lance TypeError pour null', () => {
    expect(() => analyze(null)).toThrow(TypeError);
  });
});

// ─────────────────────────────────────────────────────────────
// Tests d'intégration & performance
// ─────────────────────────────────────────────────────────────
describe('Performance & Intégration', () => {
  test('compresse 100k caractères en < 100ms', () => {
    const large = 'abcdef'.repeat(20_000); // ~120k chars
    const start = performance.now();
    compress(large);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  test('round-trip sur 50k chars', () => {
    const original = 'aaabbbccc'.repeat(5_555);
    const { result } = compress(original);
    expect(decompress(result)).toBe(original);
  });

  test('analyse de 10k chars en < 50ms', () => {
    const str   = 'xyz'.repeat(3_334);
    const start = performance.now();
    analyze(str);
    expect(performance.now() - start).toBeLessThan(50);
  });
});