'use strict';

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * ============================================================
 * DAY 07 — Web Scraper (Data Extraction)
 * ============================================================
 * Algorithme  : HTML Parsing + DOM Traversal + Regex
 * Complexité  : O(n) où n = taille du HTML
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── Constantes ──────────────────────────────────────────────

const DEFAULT_OPTIONS = {
  timeout: 10000,
  maxRedirects: 5,
  userAgent: 'Mozilla/5.0 (Node.js Web Scraper)',
  followRedirects: true,
  validateSSL: true,
};

const HTTP_STATUS = {
  OK: 200,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,
};

// ─── Validation ──────────────────────────────────────────────

/**
 * Valide une URL.
 * @param {string} url
 * @throws {Error}
 */
function validateURL(url) {
  if (typeof url !== 'string') {
    throw new TypeError('L\'URL doit être une chaîne.');
  }
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Protocole non supporté. Utiliser http:// ou https://');
    }
  } catch (err) {
    throw new Error(`URL invalide : ${err.message}`);
  }
}

/**
 * Valide les options.
 * @param {Object} options
 */
function validateOptions(options) {
  if (typeof options !== 'object' || options === null) {
    throw new TypeError('Les options doivent être un objet.');
  }
  if (options.timeout !== undefined && typeof options.timeout !== 'number') {
    throw new TypeError('timeout doit être un nombre.');
  }
  if (options.maxRedirects !== undefined && typeof options.maxRedirects !== 'number') {
    throw new TypeError('maxRedirects doit être un nombre.');
  }
}

// ─── Requête HTTP ────────────────────────────────────────────

/**
 * Effectue une requête HTTP/HTTPS.
 * 
 * @param {string} url
 * @param {Object} [options]
 * @returns {Promise<string>} - HTML content
 */
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    validateURL(url);
    validateOptions(options);

    const opts = { ...DEFAULT_OPTIONS, ...options };
    const parsedURL = new URL(url);
    const isHTTPS = parsedURL.protocol === 'https:';
    const client = isHTTPS ? https : http;

    const requestOptions = {
      hostname: parsedURL.hostname,
      port: parsedURL.port || (isHTTPS ? 443 : 80),
      path: parsedURL.pathname + parsedURL.search,
      method: 'GET',
      headers: {
        'User-Agent': opts.userAgent,
      },
      timeout: opts.timeout,
      rejectUnauthorized: opts.validateSSL,
    };

    const req = client.request(requestOptions, (res) => {
      // Gestion des redirections
      if ([HTTP_STATUS.MOVED_PERMANENTLY, HTTP_STATUS.FOUND, 
           HTTP_STATUS.TEMPORARY_REDIRECT, HTTP_STATUS.PERMANENT_REDIRECT].includes(res.statusCode)) {
        
        if (!opts.followRedirects) {
          return reject(new Error(`Redirection vers ${res.headers.location}`));
        }

        if (opts._redirectCount === undefined) {
          opts._redirectCount = 0;
        }
        opts._redirectCount++;

        if (opts._redirectCount > opts.maxRedirects) {
          return reject(new Error('Trop de redirections.'));
        }

        const redirectURL = new URL(res.headers.location, url);
        return fetch(redirectURL.href, opts).then(resolve).catch(reject);
      }

      if (res.statusCode !== HTTP_STATUS.OK) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }

      let data = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Erreur réseau : ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout dépassé.'));
    });

    req.end();
  });
}

// ─── Parsing HTML ────────────────────────────────────────────

/**
 * Extrait le contenu d'une balise HTML.
 * 
 * @param {string} html
 * @param {string} tag
 * @returns {Array<string>}
 */
function extractTags(html, tag) {
  if (typeof html !== 'string' || typeof tag !== 'string') {
    throw new TypeError('html et tag doivent être des chaînes.');
  }

  const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'gis');
  const matches = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1].trim());
  }

  return matches;
}

/**
 * Extrait les attributs d'une balise.
 * 
 * @param {string} html
 * @param {string} tag
 * @param {string} attribute
 * @returns {Array<string>}
 */
function extractAttributes(html, tag, attribute) {
  if (typeof html !== 'string' || typeof tag !== 'string' || typeof attribute !== 'string') {
    throw new TypeError('Tous les paramètres doivent être des chaînes.');
  }

  const regex = new RegExp(`<${tag}[^>]*${attribute}=["']([^"']*)["'][^>]*>`, 'gi');
  const matches = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}

/**
 * Extrait tous les liens d'une page.
 * 
 * @param {string} html
 * @param {string} [baseURL] - URL de base pour les liens relatifs
 * @returns {Array<string>}
 */
function extractLinks(html, baseURL) {
  const hrefs = extractAttributes(html, 'a', 'href');
  
  if (!baseURL) {
    return hrefs;
  }

  // Résoudre les liens relatifs
  return hrefs.map(href => {
    try {
      return new URL(href, baseURL).href;
    } catch (err) {
      return href; // Garder le lien original si invalide
    }
  });
}

/**
 * Extrait toutes les images d'une page.
 * 
 * @param {string} html
 * @param {string} [baseURL]
 * @returns {Array<Object>} - [{ src, alt }]
 */
function extractImages(html, baseURL) {
  const srcRegex = /<img[^>]*src=["']([^"']*)["'][^>]*>/gi;
  const images = [];
  let match;

  while ((match = srcRegex.exec(html)) !== null) {
    const fullMatch = match[0];
    const src = match[1];

    // Extraire l'attribut alt
    const altMatch = fullMatch.match(/alt=["']([^"']*)["']/i);
    const alt = altMatch ? altMatch[1] : '';

    // Résoudre URL relative
    const resolvedSrc = baseURL ? new URL(src, baseURL).href : src;

    images.push({ src: resolvedSrc, alt });
  }

  return images;
}

/**
 * Extrait le texte brut (sans HTML).
 * 
 * @param {string} html
 * @returns {string}
 */
function extractText(html) {
  if (typeof html !== 'string') {
    throw new TypeError('html doit être une chaîne.');
  }

  // Supprimer les scripts et styles
  let text = html.replace(/<script[^>]*>.*?<\/script>/gis, '');
  text = text.replace(/<style[^>]*>.*?<\/style>/gis, '');

  // Supprimer toutes les balises HTML
  text = text.replace(/<[^>]+>/g, ' ');

  // Décoder les entités HTML courantes
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));

  // Nettoyer les espaces multiples
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Extrait les métadonnées de la page.
 * 
 * @param {string} html
 * @returns {Object}
 */
function extractMetadata(html) {
  const metadata = {
    title: null,
    description: null,
    keywords: null,
    author: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
  };

  // Title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  // Meta tags
  const metaRegex = /<meta[^>]*>/gi;
  let match;

  while ((match = metaRegex.exec(html)) !== null) {
    const metaTag = match[0];

    // Description
    if (/name=["']description["']/i.test(metaTag)) {
      const contentMatch = metaTag.match(/content=["']([^"']*)["']/i);
      if (contentMatch) metadata.description = contentMatch[1];
    }

    // Keywords
    if (/name=["']keywords["']/i.test(metaTag)) {
      const contentMatch = metaTag.match(/content=["']([^"']*)["']/i);
      if (contentMatch) metadata.keywords = contentMatch[1];
    }

    // Author
    if (/name=["']author["']/i.test(metaTag)) {
      const contentMatch = metaTag.match(/content=["']([^"']*)["']/i);
      if (contentMatch) metadata.author = contentMatch[1];
    }

    // Open Graph
    if (/property=["']og:title["']/i.test(metaTag)) {
      const contentMatch = metaTag.match(/content=["']([^"']*)["']/i);
      if (contentMatch) metadata.ogTitle = contentMatch[1];
    }

    if (/property=["']og:description["']/i.test(metaTag)) {
      const contentMatch = metaTag.match(/content=["']([^"']*)["']/i);
      if (contentMatch) metadata.ogDescription = contentMatch[1];
    }

    if (/property=["']og:image["']/i.test(metaTag)) {
      const contentMatch = metaTag.match(/content=["']([^"']*)["']/i);
      if (contentMatch) metadata.ogImage = contentMatch[1];
    }
  }

  return metadata;
}

// ─── Scraper Principal ───────────────────────────────────────

/**
 * Scrape une page web complète.
 * 
 * @param {string} url
 * @param {Object} [options]
 * @returns {Promise<Object>}
 */
async function scrape(url, options = {}) {
  const html = await fetch(url, options);

  return {
    url,
    html,
    metadata: extractMetadata(html),
    links: extractLinks(html, url),
    images: extractImages(html, url),
    text: extractText(html),
    headings: {
      h1: extractTags(html, 'h1'),
      h2: extractTags(html, 'h2'),
      h3: extractTags(html, 'h3'),
    },
  };
}

// ─── CLI ─────────────────────────────────────────────────────

async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help') {
    console.log(`
Usage:
  node index.js scrape <url>
  node index.js links <url>
  node index.js images <url>
  node index.js text <url>
  node index.js metadata <url>

Options:
  --timeout <ms>        Timeout en millisecondes (défaut: 10000)
  --no-redirects        Ne pas suivre les redirections

Exemples:
  node index.js scrape https://example.com
  node index.js links https://example.com
  node index.js images https://example.com --timeout 5000
    `);
    process.exit(0);
  }

  try {
    const url = args[1];
    if (!url) {
      console.error('❌ URL manquante.');
      process.exit(1);
    }

    // Parser options
    const options = {};
    const timeoutIdx = args.indexOf('--timeout');
    if (timeoutIdx !== -1) {
      options.timeout = parseInt(args[timeoutIdx + 1], 10);
    }
    if (args.includes('--no-redirects')) {
      options.followRedirects = false;
    }

    if (command === 'scrape') {
      console.log(`\n🌐 SCRAPING : ${url}\n${'─'.repeat(50)}`);
      const result = await scrape(url, options);
      
      console.log('\n📄 MÉTADONNÉES');
      console.log(`Titre         : ${result.metadata.title || 'N/A'}`);
      console.log(`Description   : ${result.metadata.description || 'N/A'}`);
      console.log(`Auteur        : ${result.metadata.author || 'N/A'}`);
      
      console.log(`\n🔗 LIENS      : ${result.links.length}`);
      console.log(`🖼️  IMAGES     : ${result.images.length}`);
      console.log(`📝 TEXTE      : ${result.text.substring(0, 200)}...`);

    } else if (command === 'links') {
      const html = await fetch(url, options);
      const links = extractLinks(html, url);
      
      console.log(`\n🔗 LIENS (${links.length})\n${'─'.repeat(50)}`);
      links.forEach((link, i) => {
        console.log(`${i + 1}. ${link}`);
      });

    } else if (command === 'images') {
      const html = await fetch(url, options);
      const images = extractImages(html, url);
      
      console.log(`\n🖼️  IMAGES (${images.length})\n${'─'.repeat(50)}`);
      images.forEach((img, i) => {
        console.log(`${i + 1}. ${img.src}`);
        if (img.alt) console.log(`   Alt: ${img.alt}`);
      });

    } else if (command === 'text') {
      const html = await fetch(url, options);
      const text = extractText(html);
      
      console.log(`\n📝 TEXTE EXTRAIT\n${'─'.repeat(50)}`);
      console.log(text);

    } else if (command === 'metadata') {
      const html = await fetch(url, options);
      const metadata = extractMetadata(html);
      
      console.log(`\n📄 MÉTADONNÉES\n${'─'.repeat(50)}`);
      for (const [key, value] of Object.entries(metadata)) {
        console.log(`${key.padEnd(15)} : ${value || 'N/A'}`);
      }

    } else {
      console.error(`❌ Commande inconnue : "${command}".`);
      process.exit(1);
    }

  } catch (err) {
    console.error(`\n❌ Erreur : ${err.message}`);
    process.exit(1);
  }
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
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
  DEFAULT_OPTIONS,
  HTTP_STATUS,
};

// Point d'entrée CLI
if (require.main === module) {
  runCLI().catch(err => {
    console.error('Erreur fatale:', err.message);
    process.exit(1);
  });
}