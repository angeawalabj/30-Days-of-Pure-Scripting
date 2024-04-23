'use strict';

const {
  isPalindrome,
  analyzePalindrome,
  findLongestPalindrome,
  isAnagram,
  findAnagrams,
  groupAnagrams,
  charFrequency,
  canBePalindrome,
  generatePalindromes,
  normalize,
  validateString,
  validateStringArray,
} = require('./index');

// ─────────────────────────────────────────────────────────────
// validateString()
// ─────────────────────────────────────────────────────────────
describe('validateString()', () => {
  test('accepte une chaîne', () => {
    expect(() => validateString('abc')).not.toThrow();
  });

  test('rejette chaîne vide', () => {
    expect(() => validateString('')).toThrow('ne peut pas être vide');
  });

  test('rejette non-string', () => {
    expect(() => validateString(123)).toThrow(TypeError);
  });

  test('rejette null', () => {
    expect(() => validateString(null)).toThrow(TypeError);
  });
});

// ─────────────────────────────────────────────────────────────
// validateStringArray()
// ─────────────────────────────────────────────────────────────
describe('validateStringArray()', () => {
  test('accepte tableau de strings', () => {
    expect(() => validateStringArray(['a', 'b'])).not.toThrow();
  });

  test('rejette non-tableau', () => {
    expect(() => validateStringArray('abc')).toThrow(TypeError);
  });

  test('rejette tableau vide', () => {
    expect(() => validateStringArray([])).toThrow('ne peut pas être vide');
  });

  test('rejette tableau avec non-strings', () => {
    expect(() => validateStringArray(['a', 123])).toThrow(TypeError);
  });
});

// ─────────────────────────────────────────────────────────────
// normalize()
// ─────────────────────────────────────────────────────────────
describe('normalize()', () => {
  test('enlève espaces par défaut', () => {
    expect(normalize('a b c')).toBe('abc');
  });

  test('enlève ponctuation par défaut', () => {
    expect(normalize('a,b.c!')).toBe('abc');
  });

  test('minuscules par défaut', () => {
    expect(normalize('ABC')).toBe('abc');
  });

  test('enlève accents par défaut', () => {
    expect(normalize('éàü')).toBe('eau');
  });

  test('respecte les options', () => {
    expect(normalize('A B', { removeSpaces: false })).toBe('a b');
    expect(normalize('ABC', { caseInsensitive: false })).toBe('ABC');
  });
});

// ─────────────────────────────────────────────────────────────
// isPalindrome()
// ─────────────────────────────────────────────────────────────
describe('isPalindrome()', () => {
  // Palindromes simples
  test('palindrome simple "racecar"', () => {
    expect(isPalindrome('racecar')).toBe(true);
  });

  test('palindrome "kayak"', () => {
    expect(isPalindrome('kayak')).toBe(true);
  });

  test('palindrome mono-char "a"', () => {
    expect(isPalindrome('a')).toBe(true);
  });

  // Non-palindromes
  test('non-palindrome "hello"', () => {
    expect(isPalindrome('hello')).toBe(false);
  });

  // Palindromes avec espaces
  test('palindrome avec espaces "race car"', () => {
    expect(isPalindrome('race car')).toBe(true);
  });

  test('palindrome phrase "A man a plan a canal Panama"', () => {
    expect(isPalindrome('A man a plan a canal Panama')).toBe(true);
  });

  // Palindromes avec ponctuation
  test('palindrome avec ponctuation "A Santa at NASA"', () => {
    expect(isPalindrome('A Santa at NASA')).toBe(true);
  });

  // Palindromes avec accents
  test('palindrome avec accents "Été"', () => {
    expect(isPalindrome('Été')).toBe(true);
  });

  // Erreurs
  test('lance TypeError pour non-string', () => {
    expect(() => isPalindrome(123)).toThrow(TypeError);
  });

  test('lance Error pour chaîne vide', () => {
    expect(() => isPalindrome('')).toThrow('ne peut pas être vide');
  });
});

// ─────────────────────────────────────────────────────────────
// analyzePalindrome()
// ─────────────────────────────────────────────────────────────
describe('analyzePalindrome()', () => {
  test('analyse palindrome "racecar"', () => {
    const result = analyzePalindrome('racecar');
    expect(result.isPalindrome).toBe(true);
    expect(result.normalized).toBe('racecar');
    expect(result.length).toBe(7);
    expect(result.center).toBe('e');
    expect(result.isOddLength).toBe(true);
  });

  test('analyse palindrome longueur paire "abba"', () => {
    const result = analyzePalindrome('abba');
    expect(result.center).toBeNull();
    expect(result.isOddLength).toBe(false);
  });

  test('analyse trouve plus long sous-palindrome', () => {
    const result = analyzePalindrome('abcracecara');
    expect(result.longestSubPalindrome.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────
// findLongestPalindrome()
// ─────────────────────────────────────────────────────────────
describe('findLongestPalindrome()', () => {
  test('trouve "aba" dans "zabac"', () => {
    expect(findLongestPalindrome('zabac')).toBe('aba');
  });

  test('trouve "abba" dans "cabbac"', () => {
    expect(findLongestPalindrome('cabbac')).toBe('abba');
  });

  test('retourne char si aucun palindrome', () => {
    expect(findLongestPalindrome('abc')).toBe('a');
  });

  test('retourne toute la chaîne si palindrome', () => {
    expect(findLongestPalindrome('racecar')).toBe('racecar');
  });
});

// ─────────────────────────────────────────────────────────────
// isAnagram()
// ─────────────────────────────────────────────────────────────
describe('isAnagram()', () => {
  test('anagrammes "listen" et "silent"', () => {
    expect(isAnagram('listen', 'silent')).toBe(true);
  });

  test('anagrammes "evil" et "vile"', () => {
    expect(isAnagram('evil', 'vile')).toBe(true);
  });

  test('non-anagrammes "hello" et "world"', () => {
    expect(isAnagram('hello', 'world')).toBe(false);
  });

  test('longueurs différentes = non-anagrammes', () => {
    expect(isAnagram('abc', 'abcd')).toBe(false);
  });

  test('anagrammes avec espaces "a gentleman" et "elegant man"', () => {
    expect(isAnagram('a gentleman', 'elegant man')).toBe(true);
  });

  test('anagrammes avec casse "Listen" et "Silent"', () => {
    expect(isAnagram('Listen', 'Silent')).toBe(true);
  });

  test('anagrammes avec accents "élève" et "levée"', () => {
    expect(isAnagram('élève', 'levée')).toBe(true);
  });

  test('lance TypeError pour non-string', () => {
    expect(() => isAnagram(123, 'abc')).toThrow(TypeError);
  });
});

// ─────────────────────────────────────────────────────────────
// findAnagrams()
// ─────────────────────────────────────────────────────────────
describe('findAnagrams()', () => {
  test('trouve anagrammes dans liste', () => {
    const anagrams = findAnagrams('eat', ['tea', 'tan', 'ate', 'nat', 'bat']);
    expect(anagrams).toContain('tea');
    expect(anagrams).toContain('ate');
    expect(anagrams).not.toContain('tan');
    expect(anagrams).not.toContain('eat'); // N'inclut pas le mot lui-même
  });

  test('retourne tableau vide si aucun anagramme', () => {
    expect(findAnagrams('xyz', ['abc', 'def'])).toEqual([]);
  });

  test('lance TypeError si wordList non-tableau', () => {
    expect(() => findAnagrams('eat', 'tea')).toThrow(TypeError);
  });
});

// ─────────────────────────────────────────────────────────────
// groupAnagrams()
// ─────────────────────────────────────────────────────────────
describe('groupAnagrams()', () => {
  test('groupe anagrammes correctement', () => {
    const groups = groupAnagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']);
    expect(groups.length).toBe(3);
    
    // Vérifier qu'un groupe contient eat, tea, ate
    const eatGroup = groups.find(g => g.includes('eat'));
    expect(eatGroup).toContain('tea');
    expect(eatGroup).toContain('ate');
  });

  test('mots sans anagrammes = groupes de 1', () => {
    const groups = groupAnagrams(['abc', 'def', 'ghi']);
    expect(groups.length).toBe(3);
    expect(groups.every(g => g.length === 1)).toBe(true);
  });

  test('tous les mots identiques = 1 groupe', () => {
    const groups = groupAnagrams(['abc', 'bca', 'cab']);
    expect(groups.length).toBe(1);
    expect(groups[0].length).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────
// charFrequency()
// ─────────────────────────────────────────────────────────────
describe('charFrequency()', () => {
  test('compte fréquence correctement', () => {
    const freq = charFrequency('aabbbc');
    expect(freq['a']).toBe(2);
    expect(freq['b']).toBe(3);
    expect(freq['c']).toBe(1);
  });

  test('normalise avant comptage', () => {
    const freq = charFrequency('A a B b');
    expect(freq['a']).toBe(2);
    expect(freq['b']).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────
// canBePalindrome()
// ─────────────────────────────────────────────────────────────
describe('canBePalindrome()', () => {
  test('palindrome existant peut l\'être', () => {
    expect(canBePalindrome('racecar')).toBe(true);
  });

  test('anagramme de palindrome peut l\'être "aab"', () => {
    expect(canBePalindrome('aab')).toBe(true);
  });

  test('ne peut pas devenir palindrome "abcd"', () => {
    expect(canBePalindrome('abcd')).toBe(false);
  });

  test('un char peut toujours l\'être', () => {
    expect(canBePalindrome('a')).toBe(true);
  });

  test('tous chars pairs peut l\'être "aabb"', () => {
    expect(canBePalindrome('aabb')).toBe(true);
  });

  test('2 chars impairs ne peut pas "aabbc"', () => {
    expect(canBePalindrome('aabbc')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// generatePalindromes()
// ─────────────────────────────────────────────────────────────
describe('generatePalindromes()', () => {
  test('génère palindromes de "aab"', () => {
    const palindromes = generatePalindromes('aab');
    expect(palindromes.length).toBeGreaterThan(0);
    expect(palindromes.every(p => isPalindrome(p))).toBe(true);
  });

  test('retourne [] si impossible', () => {
    expect(generatePalindromes('abcd')).toEqual([]);
  });

  test('génère 1 palindrome de "racecar"', () => {
    const palindromes = generatePalindromes('racecar');
    expect(palindromes.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Intégration & Performance
// ─────────────────────────────────────────────────────────────
describe('Intégration', () => {
  test('détecte palindrome complexe', () => {
    expect(isPalindrome('Was it a car or a cat I saw?')).toBe(true);
  });

  test('trouve anagrammes dans grande liste', () => {
    const words = Array(100).fill('listen')
      .concat(Array(100).fill('silent'))
      .concat(Array(100).fill('random'));
    
    const anagrams = findAnagrams('listen', words);
    expect(anagrams.filter(w => w === 'silent').length).toBe(100);
  });

  test('groupe 1000 mots en < 100ms', () => {
    const words = Array.from({ length: 1000 }, (_, i) => 
      String.fromCharCode(97 + (i % 26)) + 'bc'
    );
    const start = performance.now();
    groupAnagrams(words);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  test('vérifie palindrome de 10k chars en < 10ms', () => {
    const long = 'a'.repeat(5000) + 'b' + 'a'.repeat(5000);
    const start = performance.now();
    isPalindrome(long);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(10);
  });
});