'use strict';

const {
  fetch,
  scrape,
  extractTags,
  extractAttributes,
  extractLinks,
  extractImages,
  extractText,
  extractMetadata,
  validateURL,
  validateOptions,
  HTTP_STATUS,
} = require('./index');

// HTML de test
const SAMPLE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Page de Test</title>
  <meta name="description" content="Description de test">
  <meta name="keywords" content="test, scraping, nodejs">
  <meta name="author" content="John Doe">
  <meta property="og:title" content="Test OG Title">
  <meta property="og:description" content="Test OG Description">
</head>
<body>
  <h1>Titre Principal</h1>
  <h2>Sous-titre 1</h2>
  <h2>Sous-titre 2</h2>
  <h3>Sous-sous-titre</h3>
  
  <p>Paragraphe avec du texte.</p>
  
  <a href="https://example.com">Lien externe</a>
  <a href="/relative">Lien relatif</a>
  <a href="#anchor">Ancre</a>
  
  <img src="https://example.com/image1.jpg" alt="Image 1">
  <img src="/images/image2.png" alt="Image 2">
  <img src="image3.gif">
  
  <script>console.log('test');</script>
  <style>body { color: red; }</style>
</body>
</html>
`;

// ─────────────────────────────────────────────────────────────
// validateURL()
// ─────────────────────────────────────────────────────────────
describe('validateURL()', () => {
  test('accepte URL HTTP valide', () => {
    expect(() => validateURL('http://example.com')).not.toThrow();
  });

  test('accepte URL HTTPS valide', () => {
    expect(() => validateURL('https://example.com')).not.toThrow();
  });

  test('rejette non-string', () => {
    expect(() => validateURL(123)).toThrow(TypeError);
  });

  test('rejette URL invalide', () => {
    expect(() => validateURL('not a url')).toThrow('URL invalide');
  });

  test('rejette protocole FTP', () => {
    expect(() => validateURL('ftp://example.com')).toThrow('Protocole non supporté');
  });
});

// ─────────────────────────────────────────────────────────────
// validateOptions()
// ─────────────────────────────────────────────────────────────
describe('validateOptions()', () => {
  test('accepte options valides', () => {
    expect(() => validateOptions({ timeout: 5000 })).not.toThrow();
  });

  test('rejette non-objet', () => {
    expect(() => validateOptions('abc')).toThrow(TypeError);
  });

  test('rejette timeout non-nombre', () => {
    expect(() => validateOptions({ timeout: 'abc' })).toThrow(TypeError);
  });

  test('rejette maxRedirects non-nombre', () => {
    expect(() => validateOptions({ maxRedirects: 'abc' })).toThrow(TypeError);
  });
});

// ─────────────────────────────────────────────────────────────
// extractTags()
// ─────────────────────────────────────────────────────────────
describe('extractTags()', () => {
  test('extrait balises <h1>', () => {
    const h1s = extractTags(SAMPLE_HTML, 'h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0]).toBe('Titre Principal');
  });

  test('extrait balises <h2>', () => {
    const h2s = extractTags(SAMPLE_HTML, 'h2');
    expect(h2s.length).toBe(2);
    expect(h2s[0]).toBe('Sous-titre 1');
    expect(h2s[1]).toBe('Sous-titre 2');
  });

  test('extrait balises <p>', () => {
    const ps = extractTags(SAMPLE_HTML, 'p');
    expect(ps.length).toBe(1);
    expect(ps[0]).toBe('Paragraphe avec du texte.');
  });

  test('retourne tableau vide si aucune balise', () => {
    const divs = extractTags(SAMPLE_HTML, 'div');
    expect(divs).toEqual([]);
  });

  test('lance TypeError pour params invalides', () => {
    expect(() => extractTags(123, 'p')).toThrow(TypeError);
  });
});

// ─────────────────────────────────────────────────────────────
// extractAttributes()
// ─────────────────────────────────────────────────────────────
describe('extractAttributes()', () => {
  test('extrait href des liens', () => {
    const hrefs = extractAttributes(SAMPLE_HTML, 'a', 'href');
    expect(hrefs.length).toBe(3);
    expect(hrefs).toContain('https://example.com');
    expect(hrefs).toContain('/relative');
    expect(hrefs).toContain('#anchor');
  });

  test('extrait src des images', () => {
    const srcs = extractAttributes(SAMPLE_HTML, 'img', 'src');
    expect(srcs.length).toBe(3);
    expect(srcs).toContain('https://example.com/image1.jpg');
    expect(srcs).toContain('/images/image2.png');
    expect(srcs).toContain('image3.gif');
  });

  test('retourne tableau vide si aucun attribut', () => {
    const ids = extractAttributes(SAMPLE_HTML, 'div', 'id');
    expect(ids).toEqual([]);
  });

  test('lance TypeError pour params invalides', () => {
    expect(() => extractAttributes(123, 'a', 'href')).toThrow(TypeError);
  });
});

// ─────────────────────────────────────────────────────────────
// extractLinks()
// ─────────────────────────────────────────────────────────────
describe('extractLinks()', () => {
  test('extrait tous les liens', () => {
    const links = extractLinks(SAMPLE_HTML);
    expect(links.length).toBe(3);
  });

  test('résout liens relatifs avec baseURL', () => {
    const links = extractLinks(SAMPLE_HTML, 'https://example.com');
    expect(links).toContain('https://example.com/relative');
  });

  test('garde liens absolus intacts', () => {
    const links = extractLinks(SAMPLE_HTML, 'https://example.com');
    expect(links).toContain('https://example.com');
  });
});

// ─────────────────────────────────────────────────────────────
// extractImages()
// ─────────────────────────────────────────────────────────────
describe('extractImages()', () => {
  test('extrait toutes les images', () => {
    const images = extractImages(SAMPLE_HTML);
    expect(images.length).toBe(3);
  });

  test('extrait src et alt', () => {
    const images = extractImages(SAMPLE_HTML);
    expect(images[0].src).toBe('https://example.com/image1.jpg');
    expect(images[0].alt).toBe('Image 1');
  });

  test('alt vide si absent', () => {
    const images = extractImages(SAMPLE_HTML);
    expect(images[2].alt).toBe('');
  });

  test('résout URLs relatives', () => {
    const images = extractImages(SAMPLE_HTML, 'https://example.com');
    expect(images[1].src).toBe('https://example.com/images/image2.png');
  });
});

// ─────────────────────────────────────────────────────────────
// extractText()
// ─────────────────────────────────────────────────────────────
describe('extractText()', () => {
  test('extrait texte sans HTML', () => {
    const text = extractText(SAMPLE_HTML);
    expect(text).toContain('Titre Principal');
    expect(text).toContain('Paragraphe avec du texte');
  });

  test('supprime scripts', () => {
    const text = extractText(SAMPLE_HTML);
    expect(text).not.toContain('console.log');
  });

  test('supprime styles', () => {
    const text = extractText(SAMPLE_HTML);
    expect(text).not.toContain('color: red');
  });

  test('décode entités HTML', () => {
    const html = '<p>&nbsp;&amp;&lt;&gt;&quot;</p>';
    const text = extractText(html);
    expect(text).toContain('&');
    expect(text).toContain('<');
    expect(text).toContain('>');
    expect(text).toContain('"');
  });

  test('nettoie espaces multiples', () => {
    const html = '<p>texte    avec     espaces</p>';
    const text = extractText(html);
    expect(text).toBe('texte avec espaces');
  });

  test('lance TypeError pour non-string', () => {
    expect(() => extractText(123)).toThrow(TypeError);
  });
});

// ─────────────────────────────────────────────────────────────
// extractMetadata()
// ─────────────────────────────────────────────────────────────
describe('extractMetadata()', () => {
  test('extrait title', () => {
    const metadata = extractMetadata(SAMPLE_HTML);
    expect(metadata.title).toBe('Page de Test');
  });

  test('extrait description', () => {
    const metadata = extractMetadata(SAMPLE_HTML);
    expect(metadata.description).toBe('Description de test');
  });

  test('extrait keywords', () => {
    const metadata = extractMetadata(SAMPLE_HTML);
    expect(metadata.keywords).toBe('test, scraping, nodejs');
  });

  test('extrait author', () => {
    const metadata = extractMetadata(SAMPLE_HTML);
    expect(metadata.author).toBe('John Doe');
  });

  test('extrait Open Graph', () => {
    const metadata = extractMetadata(SAMPLE_HTML);
    expect(metadata.ogTitle).toBe('Test OG Title');
    expect(metadata.ogDescription).toBe('Test OG Description');
  });

  test('retourne null si métadonnées absentes', () => {
    const html = '<html><body></body></html>';
    const metadata = extractMetadata(html);
    expect(metadata.title).toBeNull();
    expect(metadata.description).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// fetch() - Tests d'intégration (optionnels, nécessitent réseau)
// ─────────────────────────────────────────────────────────────
describe('fetch() - Intégration', () => {
  test.skip('récupère page réelle', async () => {
    const html = await fetch('https://example.com');
    expect(html).toContain('<html');
    expect(html.length).toBeGreaterThan(100);
  }, 15000);

  test.skip('gère timeout', async () => {
    await expect(
      fetch('https://httpstat.us/200?sleep=20000', { timeout: 1000 })
    ).rejects.toThrow('Timeout');
  }, 5000);

  test.skip('suit redirections', async () => {
    const html = await fetch('http://httpstat.us/301', { followRedirects: true });
    expect(html).toBeDefined();
  }, 15000);

  test.skip('rejette si trop de redirections', async () => {
    await expect(
      fetch('http://httpstat.us/301', { maxRedirects: 0 })
    ).rejects.toThrow('Redirection');
  }, 10000);
});

// ─────────────────────────────────────────────────────────────
// scrape() - Intégration
// ─────────────────────────────────────────────────────────────
describe('scrape() - Intégration', () => {
  test.skip('scrape page complète', async () => {
    const result = await scrape('https://example.com');
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('html');
    expect(result).toHaveProperty('metadata');
    expect(result).toHaveProperty('links');
    expect(result).toHaveProperty('images');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('headings');
  }, 15000);
});

// ─────────────────────────────────────────────────────────────
// HTTP_STATUS
// ─────────────────────────────────────────────────────────────
describe('HTTP_STATUS', () => {
  test('contient codes de statut standards', () => {
    expect(HTTP_STATUS.OK).toBe(200);
    expect(HTTP_STATUS.MOVED_PERMANENTLY).toBe(301);
    expect(HTTP_STATUS.FOUND).toBe(302);
  });
});