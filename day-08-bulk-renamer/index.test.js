'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  rename,
  scanFiles,
  applyPrefix,
  applySuffix,
  applyReplace,
  applySequential,
  applyDate,
  applyLowercase,
  applyUppercase,
  applyCamelCase,
  applyRegex,
  validateDirectory,
  RENAME_PATTERNS,
} = require('./index');

// Créer un répertoire temporaire pour les tests
const TEST_DIR = path.join(os.tmpdir(), 'bulk-renamer-test-' + Date.now());

beforeAll(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterAll(() => {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

// ─────────────────────────────────────────────────────────────
// validateDirectory()
// ─────────────────────────────────────────────────────────────
describe('validateDirectory()', () => {
  test('accepte répertoire valide', () => {
    expect(() => validateDirectory(TEST_DIR)).not.toThrow();
  });

  test('rejette non-string', () => {
    expect(() => validateDirectory(123)).toThrow(TypeError);
  });

  test('rejette répertoire inexistant', () => {
    expect(() => validateDirectory('/invalid/path')).toThrow('n\'existe pas');
  });
});

// ─────────────────────────────────────────────────────────────
// Pattern functions
// ─────────────────────────────────────────────────────────────
describe('applyPrefix()', () => {
  test('ajoute préfixe', () => {
    expect(applyPrefix('file.txt', 'DRAFT_')).toBe('DRAFT_file.txt');
  });

  test('ajoute préfixe sans extension', () => {
    expect(applyPrefix('file.txt', 'DRAFT_', { includeExtension: false })).toBe('DRAFT_file.txt');
  });
});

describe('applySuffix()', () => {
  test('ajoute suffixe avant extension', () => {
    expect(applySuffix('file.txt', '_backup')).toBe('file_backup.txt');
  });
});

describe('applyReplace()', () => {
  test('remplace chaîne', () => {
    expect(applyReplace('old_file.txt', 'old', 'new')).toBe('new_file.txt');
  });

  test('remplace toutes les occurrences', () => {
    expect(applyReplace('old_old_file.txt', 'old', 'new')).toBe('new_new_file.txt');
  });

  test('insensible à la casse si demandé', () => {
    expect(applyReplace('OLD_file.txt', 'old', 'new', { caseSensitive: false })).toBe('new_file.txt');
  });
});

describe('applySequential()', () => {
  test('ajoute numéro séquentiel', () => {
    expect(applySequential('file.txt', 0)).toBe('file_001.txt');
    expect(applySequential('file.txt', 1)).toBe('file_002.txt');
  });

  test('commence à start', () => {
    expect(applySequential('file.txt', 0, { start: 10 })).toBe('file_010.txt');
  });

  test('respecte padding', () => {
    expect(applySequential('file.txt', 0, { padding: 5 })).toBe('file_00001.txt');
  });

  test('utilise séparateur custom', () => {
    expect(applySequential('file.txt', 0, { separator: '-' })).toBe('file-001.txt');
  });
});

describe('applyDate()', () => {
  test('ajoute date YYYYMMDD', () => {
    const result = applyDate('file.txt', { format: 'YYYYMMDD' });
    expect(result).toMatch(/file_\d{8}\.txt/);
  });

  test('ajoute date YYYY-MM-DD', () => {
    const result = applyDate('file.txt', { format: 'YYYY-MM-DD' });
    expect(result).toMatch(/file_\d{4}-\d{2}-\d{2}\.txt/);
  });

  test('ajoute timestamp', () => {
    const result = applyDate('file.txt', { format: 'timestamp' });
    expect(result).toMatch(/file_\d+\.txt/);
  });
});

describe('applyLowercase()', () => {
  test('convertit en minuscules', () => {
    expect(applyLowercase('FILE.TXT')).toBe('file.TXT');
  });

  test('convertit extension aussi si demandé', () => {
    expect(applyLowercase('FILE.TXT', { includeExtension: true })).toBe('file.txt');
  });
});

describe('applyUppercase()', () => {
  test('convertit en majuscules', () => {
    expect(applyUppercase('file.txt')).toBe('FILE.txt');
  });

  test('convertit extension aussi si demandé', () => {
    expect(applyUppercase('file.txt', { includeExtension: true })).toBe('FILE.TXT');
  });
});

describe('applyCamelCase()', () => {
  test('convertit en camelCase', () => {
    expect(applyCamelCase('my-file-name.txt')).toBe('myFileName.txt');
  });

  test('gère espaces', () => {
    expect(applyCamelCase('my file name.txt')).toBe('myFileName.txt');
  });

  test('gère underscores', () => {
    expect(applyCamelCase('my_file_name.txt')).toBe('myFileName.txt');
  });
});

describe('applyRegex()', () => {
  test('applique regex', () => {
    expect(applyRegex('file123.txt', '\\d+', 'ABC')).toBe('fileABC.txt');
  });

  test('lance Error pour regex invalide', () => {
    expect(() => applyRegex('file.txt', '[', 'X')).toThrow('Regex invalide');
  });
});

// ─────────────────────────────────────────────────────────────
// scanFiles()
// ─────────────────────────────────────────────────────────────
describe('scanFiles()', () => {
  let testScanDir;

  beforeEach(() => {
    testScanDir = path.join(TEST_DIR, 'scan-' + Date.now());
    fs.mkdirSync(testScanDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testScanDir)) {
      fs.rmSync(testScanDir, { recursive: true, force: true });
    }
  });

  test('scanne fichiers', () => {
    fs.writeFileSync(path.join(testScanDir, 'file1.txt'), '');
    fs.writeFileSync(path.join(testScanDir, 'file2.txt'), '');
    
    const files = scanFiles(testScanDir);
    expect(files.length).toBe(2);
  });

  test('scanne récursivement si demandé', () => {
    const subDir = path.join(testScanDir, 'sub');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(testScanDir, 'file1.txt'), '');
    fs.writeFileSync(path.join(subDir, 'file2.txt'), '');
    
    const files = scanFiles(testScanDir, { recursive: true });
    expect(files.length).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────
// rename()
// ─────────────────────────────────────────────────────────────
describe('rename()', () => {
  let testRenameDir;

  beforeEach(() => {
    testRenameDir = path.join(TEST_DIR, 'rename-' + Date.now());
    fs.mkdirSync(testRenameDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testRenameDir)) {
      fs.rmSync(testRenameDir, { recursive: true, force: true });
    }
  });

  test('renomme avec prefix', () => {
    fs.writeFileSync(path.join(testRenameDir, 'file.txt'), '');
    
    const report = rename(testRenameDir, {
      type: RENAME_PATTERNS.PREFIX,
      value: 'DRAFT_',
    });
    
    expect(report.renamed).toBe(1);
    expect(fs.existsSync(path.join(testRenameDir, 'DRAFT_file.txt'))).toBe(true);
  });

  test('mode dryRun ne renomme pas', () => {
    fs.writeFileSync(path.join(testRenameDir, 'file.txt'), '');
    
    const report = rename(testRenameDir, {
      type: RENAME_PATTERNS.PREFIX,
      value: 'DRAFT_',
    }, { dryRun: true });
    
    expect(report.renamed).toBe(1);
    expect(fs.existsSync(path.join(testRenameDir, 'file.txt'))).toBe(true);
    expect(fs.existsSync(path.join(testRenameDir, 'DRAFT_file.txt'))).toBe(false);
  });

  test('ignore si fichier existe déjà', () => {
    fs.writeFileSync(path.join(testRenameDir, 'file.txt'), '');
    fs.writeFileSync(path.join(testRenameDir, 'DRAFT_file.txt'), '');
    
    const report = rename(testRenameDir, {
      type: RENAME_PATTERNS.PREFIX,
      value: 'DRAFT_',
    });
    
    expect(report.skipped).toBe(2); // file.txt ignoré (collision), DRAFT_file.txt ignoré (pas de changement)
  });

  test('ignore si nom inchangé', () => {
    fs.writeFileSync(path.join(testRenameDir, 'file.txt'), '');
    
    const report = rename(testRenameDir, {
      type: RENAME_PATTERNS.REPLACE,
      search: 'notfound',
      replace: 'new',
    });
    
    expect(report.skipped).toBe(1);
  });

  test('renomme avec sequential', () => {
    fs.writeFileSync(path.join(testRenameDir, 'a.txt'), '');
    fs.writeFileSync(path.join(testRenameDir, 'b.txt'), '');
    fs.writeFileSync(path.join(testRenameDir, 'c.txt'), '');
    
    const report = rename(testRenameDir, {
      type: RENAME_PATTERNS.SEQUENTIAL,
      start: 1,
    });
    
    expect(report.renamed).toBe(3);
    expect(fs.existsSync(path.join(testRenameDir, 'a_001.txt'))).toBe(true);
    expect(fs.existsSync(path.join(testRenameDir, 'b_002.txt'))).toBe(true);
    expect(fs.existsSync(path.join(testRenameDir, 'c_003.txt'))).toBe(true);
  });
});