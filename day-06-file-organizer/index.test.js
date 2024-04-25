'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  organize,
  analyze,
  undo,
  categorizeFile,
  getDestinationFolder,
  scanDirectory,
  filterBySize,
  validateDirectory,
  validateOptions,
  FILE_CATEGORIES,
} = require('./index');

// Créer un répertoire temporaire pour les tests
const TEST_DIR = path.join(os.tmpdir(), 'file-organizer-test-' + Date.now());

beforeAll(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterAll(() => {
  // Nettoyer
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
    expect(() => validateDirectory('/path/does/not/exist')).toThrow('n\'existe pas');
  });

  test('rejette fichier (pas un répertoire)', () => {
    const file = path.join(TEST_DIR, 'test.txt');
    fs.writeFileSync(file, 'test');
    expect(() => validateDirectory(file)).toThrow('pas un répertoire');
  });
});

// ─────────────────────────────────────────────────────────────
// validateOptions()
// ─────────────────────────────────────────────────────────────
describe('validateOptions()', () => {
  test('accepte options valides', () => {
    expect(() => validateOptions({ minSize: 100 })).not.toThrow();
  });

  test('rejette non-objet', () => {
    expect(() => validateOptions('abc')).toThrow(TypeError);
  });

  test('rejette minSize non-nombre', () => {
    expect(() => validateOptions({ minSize: '100' })).toThrow(TypeError);
  });
});

// ─────────────────────────────────────────────────────────────
// categorizeFile()
// ─────────────────────────────────────────────────────────────
describe('categorizeFile()', () => {
  test('catégorise image .jpg', () => {
    expect(categorizeFile('photo.jpg')).toBe('images');
  });

  test('catégorise video .mp4', () => {
    expect(categorizeFile('video.mp4')).toBe('videos');
  });

  test('catégorise document .pdf', () => {
    expect(categorizeFile('doc.pdf')).toBe('documents');
  });

  test('catégorise code .js', () => {
    expect(categorizeFile('script.js')).toBe('code');
  });

  test('retourne null pour extension inconnue', () => {
    expect(categorizeFile('file.xyz')).toBeNull();
  });

  test('insensible à la casse', () => {
    expect(categorizeFile('PHOTO.JPG')).toBe('images');
  });

  test('gère fichiers sans extension', () => {
    expect(categorizeFile('README')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// getDestinationFolder()
// ─────────────────────────────────────────────────────────────
describe('getDestinationFolder()', () => {
  test('retourne "Images" pour images', () => {
    expect(getDestinationFolder('images')).toBe('Images');
  });

  test('retourne "Documents" pour documents', () => {
    expect(getDestinationFolder('documents')).toBe('Documents');
  });

  test('retourne "Others" pour catégorie inconnue', () => {
    expect(getDestinationFolder('unknown')).toBe('Others');
  });
});

// ─────────────────────────────────────────────────────────────
// scanDirectory()
// ─────────────────────────────────────────────────────────────
describe('scanDirectory()', () => {
  let testScanDir;

  beforeEach(() => {
    testScanDir = path.join(TEST_DIR, 'scan-test-' + Date.now());
    fs.mkdirSync(testScanDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testScanDir)) {
      fs.rmSync(testScanDir, { recursive: true, force: true });
    }
  });

  test('scanne fichiers dans répertoire', () => {
    fs.writeFileSync(path.join(testScanDir, 'file1.txt'), '');
    fs.writeFileSync(path.join(testScanDir, 'file2.txt'), '');
    
    const files = scanDirectory(testScanDir);
    expect(files.length).toBe(2);
  });

  test('ignore fichiers cachés par défaut', () => {
    fs.writeFileSync(path.join(testScanDir, 'visible.txt'), '');
    fs.writeFileSync(path.join(testScanDir, '.hidden.txt'), '');
    
    const files = scanDirectory(testScanDir);
    expect(files.length).toBe(1);
  });

  test('inclut fichiers cachés si skipHidden=false', () => {
    fs.writeFileSync(path.join(testScanDir, 'visible.txt'), '');
    fs.writeFileSync(path.join(testScanDir, '.hidden.txt'), '');
    
    const files = scanDirectory(testScanDir, { skipHidden: false });
    expect(files.length).toBe(2);
  });

  test('scanne récursivement si recursive=true', () => {
    const subDir = path.join(testScanDir, 'subdir');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(testScanDir, 'root.txt'), '');
    fs.writeFileSync(path.join(subDir, 'nested.txt'), '');
    
    const files = scanDirectory(testScanDir, { recursive: true });
    expect(files.length).toBe(2);
  });

  test('ne scanne pas récursivement par défaut', () => {
    const subDir = path.join(testScanDir, 'subdir');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(testScanDir, 'root.txt'), '');
    fs.writeFileSync(path.join(subDir, 'nested.txt'), '');
    
    const files = scanDirectory(testScanDir);
    expect(files.length).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────
// filterBySize()
// ─────────────────────────────────────────────────────────────
describe('filterBySize()', () => {
  let testFilterDir;

  beforeEach(() => {
    testFilterDir = path.join(TEST_DIR, 'filter-test-' + Date.now());
    fs.mkdirSync(testFilterDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testFilterDir)) {
      fs.rmSync(testFilterDir, { recursive: true, force: true });
    }
  });

  test('filtre par minSize', () => {
    const small = path.join(testFilterDir, 'small.txt');
    const large = path.join(testFilterDir, 'large.txt');
    fs.writeFileSync(small, 'a');      // 1 byte
    fs.writeFileSync(large, 'a'.repeat(1000)); // 1000 bytes
    
    const files = [small, large];
    const filtered = filterBySize(files, { minSize: 500 });
    expect(filtered.length).toBe(1);
    expect(filtered[0]).toBe(large);
  });

  test('filtre par maxSize', () => {
    const small = path.join(testFilterDir, 'small.txt');
    const large = path.join(testFilterDir, 'large.txt');
    fs.writeFileSync(small, 'a');
    fs.writeFileSync(large, 'a'.repeat(1000));
    
    const files = [small, large];
    const filtered = filterBySize(files, { maxSize: 500 });
    expect(filtered.length).toBe(1);
    expect(filtered[0]).toBe(small);
  });
});

// ─────────────────────────────────────────────────────────────
// organize()
// ─────────────────────────────────────────────────────────────
describe('organize()', () => {
  let testOrgDir;

  beforeEach(() => {
    testOrgDir = path.join(TEST_DIR, 'org-test-' + Date.now());
    fs.mkdirSync(testOrgDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testOrgDir)) {
      fs.rmSync(testOrgDir, { recursive: true, force: true });
    }
  });

  test('organise fichiers par catégorie', () => {
    fs.writeFileSync(path.join(testOrgDir, 'photo.jpg'), '');
    fs.writeFileSync(path.join(testOrgDir, 'doc.pdf'), '');
    
    const report = organize(testOrgDir);
    
    expect(report.moved).toBe(2);
    expect(report.categories.images).toBe(1);
    expect(report.categories.documents).toBe(1);
    expect(fs.existsSync(path.join(testOrgDir, 'Images', 'photo.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(testOrgDir, 'Documents', 'doc.pdf'))).toBe(true);
  });

  test('mode dryRun ne déplace pas', () => {
    fs.writeFileSync(path.join(testOrgDir, 'photo.jpg'), '');
    
    const report = organize(testOrgDir, { dryRun: true });
    
    expect(report.moved).toBe(1);
    expect(fs.existsSync(path.join(testOrgDir, 'photo.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(testOrgDir, 'Images'))).toBe(false);
  });

  test('ignore fichiers déjà organisés', () => {
    const imagesDir = path.join(testOrgDir, 'Images');
    fs.mkdirSync(imagesDir);
    fs.writeFileSync(path.join(imagesDir, 'photo.jpg'), '');
    
    const report = organize(testOrgDir);
    
    expect(report.skipped).toBe(1);
    expect(report.moved).toBe(0);
  });

  test('gère conflits de noms', () => {
    fs.writeFileSync(path.join(testOrgDir, 'photo.jpg'), 'first');
    
    // Organiser une première fois
    organize(testOrgDir);
    
    // Créer un autre fichier avec le même nom
    fs.writeFileSync(path.join(testOrgDir, 'photo.jpg'), 'second');
    
    // Organiser à nouveau
    organize(testOrgDir);
    
    expect(fs.existsSync(path.join(testOrgDir, 'Images', 'photo.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(testOrgDir, 'Images', 'photo_1.jpg'))).toBe(true);
  });

  test('ignore fichiers sans catégorie', () => {
    fs.writeFileSync(path.join(testOrgDir, 'unknown.xyz'), '');
    
    const report = organize(testOrgDir);
    
    expect(report.skipped).toBe(1);
    expect(report.moved).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// analyze()
// ─────────────────────────────────────────────────────────────
describe('analyze()', () => {
  let testAnalyzeDir;

  beforeEach(() => {
    testAnalyzeDir = path.join(TEST_DIR, 'analyze-test-' + Date.now());
    fs.mkdirSync(testAnalyzeDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testAnalyzeDir)) {
      fs.rmSync(testAnalyzeDir, { recursive: true, force: true });
    }
  });

  test('analyse sans déplacer', () => {
    fs.writeFileSync(path.join(testAnalyzeDir, 'photo.jpg'), '');
    
    const report = analyze(testAnalyzeDir);
    
    expect(report.moved).toBe(1);
    expect(fs.existsSync(path.join(testAnalyzeDir, 'photo.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(testAnalyzeDir, 'Images'))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// undo()
// ─────────────────────────────────────────────────────────────
describe('undo()', () => {
  let testUndoDir;

  beforeEach(() => {
    testUndoDir = path.join(TEST_DIR, 'undo-test-' + Date.now());
    fs.mkdirSync(testUndoDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testUndoDir)) {
      fs.rmSync(testUndoDir, { recursive: true, force: true });
    }
  });

  test('ramène fichiers à la racine', () => {
    const imagesDir = path.join(testUndoDir, 'Images');
    fs.mkdirSync(imagesDir);
    fs.writeFileSync(path.join(imagesDir, 'photo.jpg'), '');
    
    const report = undo(testUndoDir);
    
    expect(report.moved).toBe(1);
    expect(fs.existsSync(path.join(testUndoDir, 'photo.jpg'))).toBe(true);
  });

  test('gère conflits lors du undo', () => {
    const imagesDir = path.join(testUndoDir, 'Images');
    fs.mkdirSync(imagesDir);
    fs.writeFileSync(path.join(testUndoDir, 'photo.jpg'), 'root');
    fs.writeFileSync(path.join(imagesDir, 'photo.jpg'), 'subdir');
    
    const report = undo(testUndoDir);
    
    expect(report.moved).toBe(1);
    expect(fs.existsSync(path.join(testUndoDir, 'photo.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(testUndoDir, 'photo_1.jpg'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// FILE_CATEGORIES
// ─────────────────────────────────────────────────────────────
describe('FILE_CATEGORIES', () => {
  test('contient au moins 5 catégories', () => {
    expect(Object.keys(FILE_CATEGORIES).length).toBeGreaterThanOrEqual(5);
  });

  test('chaque catégorie a extensions et folder', () => {
    for (const [key, config] of Object.entries(FILE_CATEGORIES)) {
      expect(config).toHaveProperty('extensions');
      expect(config).toHaveProperty('folder');
      expect(Array.isArray(config.extensions)).toBe(true);
      expect(typeof config.folder).toBe('string');
    }
  });

  test('extensions commencent par "."', () => {
    for (const config of Object.values(FILE_CATEGORIES)) {
      for (const ext of config.extensions) {
        expect(ext.startsWith('.')).toBe(true);
      }
    }
  });
});