# 🌐 Day 07 — Web Scraper (Data Extraction)

> **30 Days of Pure Scripting** · Semaine 2 : Automatisation et Système

---

## 🎯 Problème

Extraire des données structurées depuis des pages web :

```js
const result = await scrape('https://example.com');
/*
{
  url: 'https://example.com',
  metadata: { title: 'Example Domain', description: '...' },
  links: ['https://example.com/page1', ...],
  images: [{ src: 'image.jpg', alt: 'Photo' }],
  text: 'Texte extrait sans HTML...',
  headings: { h1: [...], h2: [...] }
}
*/
```

**Use cases** :
- Surveillance de prix e-commerce
- Agrégation de contenu (news, blogs)
- Monitoring de sites web
- Extraction de contacts/emails
- Analyse SEO (métadonnées, liens)

---

## ⚡ Performance

| Opération        | Complexité | Notes                              |
|------------------|------------|------------------------------------|
| fetch()          | **O(n)**   | n = taille du HTML téléchargé      |
| extractTags()    | **O(n)**   | Regex sur HTML                     |
| extractText()    | **O(n)**   | Suppression balises + entités      |
| extractLinks()   | **O(n)**   | Résolution URLs relatives          |
| extractMetadata()| **O(n)**   | Scan meta tags                     |

> **Note** : Le goulot d'étranglement est généralement la **latence réseau** (~500ms), pas le parsing (~10ms).

---

## 🛡️ Gestion des erreurs

| Erreur              | Cas déclencheur                   | Type levé     |
|---------------------|-----------------------------------|---------------|
| URL invalide        | `fetch('not a url')`              | `Error`       |
| Protocole invalide  | `fetch('ftp://example.com')`      | `Error`       |
| Timeout dépassé     | Pas de réponse avant 10s          | `Error`       |
| HTTP non-200        | 404, 500, etc.                    | `Error`       |
| Trop de redirections| > 5 redirections                  | `Error`       |
| Erreur réseau       | DNS fail, connexion refusée       | `Error`       |

---

## 🚀 Installation & Usage

```bash
# Installation
cd day-07-web-scraper
npm install

# CLI - Scrape complet
node index.js scrape https://example.com

# CLI - Liens uniquement
node index.js links https://example.com

# CLI - Images uniquement
node index.js images https://example.com

# CLI - Texte extrait
node index.js text https://example.com

# CLI - Métadonnées
node index.js metadata https://example.com

# Options
node index.js scrape https://example.com --timeout 5000
node index.js scrape https://example.com --no-redirects
```

### Exemples de sorties CLI

**Scrape complet :**
```bash
$ node index.js scrape https://example.com

🌐 SCRAPING : https://example.com
──────────────────────────────────────────────────

📄 MÉTADONNÉES
Titre         : Example Domain
Description   : Example Domain for illustrative examples
Auteur        : N/A

🔗 LIENS      : 1
🖼️  IMAGES     : 0
📝 TEXTE      : Example Domain This domain is for use in illustrative...
```

**Liens :**
```bash
$ node index.js links https://example.com

🔗 LIENS (1)
──────────────────────────────────────────────────
1. https://www.iana.org/domains/example
```

**Métadonnées :**
```bash
$ node index.js metadata https://example.com

📄 MÉTADONNÉES
──────────────────────────────────────────────────
title           : Example Domain
description     : Example Domain for...
keywords        : N/A
author          : N/A
ogTitle         : N/A
ogDescription   : N/A
ogImage         : N/A
```

---

## 🔌 API (module)

```js
const {
  fetch,
  scrape,
  extractLinks,
  extractImages,
  extractText,
  extractMetadata,
} = require('./index');

// ─── Récupérer HTML brut ───

const html = await fetch('https://example.com', {
  timeout: 10000,        // Timeout en ms
  maxRedirects: 5,       // Nombre max de redirections
  followRedirects: true, // Suivre les redirections
  userAgent: 'Mozilla/5.0 ...',
});

// ─── Scrape complet ───

const result = await scrape('https://example.com');
/*
{
  url: 'https://example.com',
  html: '<!DOCTYPE html>...',
  metadata: {
    title: 'Example Domain',
    description: '...',
    keywords: null,
    author: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null
  },
  links: ['https://www.iana.org/domains/example'],
  images: [{ src: 'image.jpg', alt: 'Description' }],
  text: 'Texte sans HTML...',
  headings: {
    h1: ['Titre principal'],
    h2: ['Sous-titre 1', 'Sous-titre 2'],
    h3: ['Sous-sous-titre']
  }
}
*/

// ─── Extraction ciblée ───

// Liens (avec résolution URLs relatives)
const links = extractLinks(html, 'https://example.com');
// → ['https://example.com/page1', 'https://example.com/page2']

// Images avec src et alt
const images = extractImages(html, 'https://example.com');
// → [{ src: 'https://example.com/img.jpg', alt: 'Photo' }]

// Texte sans HTML (scripts et styles supprimés)
const text = extractText(html);
// → 'Texte propre sans balises...'

// Métadonnées SEO + Open Graph
const metadata = extractMetadata(html);
// → { title, description, keywords, author, ogTitle, ... }
```

---

## 🧪 Tests

```bash
npm test
```

```
PASS  index.test.js
  validateURL()            ✓ 5 tests
  validateOptions()        ✓ 4 tests
  extractTags()            ✓ 5 tests
  extractAttributes()      ✓ 4 tests
  extractLinks()           ✓ 3 tests
  extractImages()          ✓ 4 tests
  extractText()            ✓ 6 tests
  extractMetadata()        ✓ 6 tests
  HTTP_STATUS              ✓ 1 test

Tests:       38 passed
Tests d'intégration:  4 skipped (nécessitent réseau)
Coverage:    87.3% statements | 82.1% branches | 91.7% functions
```

### Ce qui est testé

- ✅ Validation URL (protocole http/https uniquement)
- ✅ Validation options (timeout, maxRedirects)
- ✅ Extraction balises (h1, h2, h3, p)
- ✅ Extraction attributs (href, src, alt)
- ✅ Résolution URLs relatives
- ✅ Extraction images avec src et alt
- ✅ Suppression scripts et styles
- ✅ Décodage entités HTML (&nbsp;, &amp;, etc.)
- ✅ Nettoyage espaces multiples
- ✅ Extraction métadonnées (title, description, Open Graph)
- ✅ Tests d'intégration réseau (optionnels)

---

## 📚 Concepts clés appris

### 1. HTTP/HTTPS natif en Node.js

```js
const https = require('https');

https.request({
  hostname: 'example.com',
  port: 443,
  path: '/page',
  method: 'GET',
  headers: { 'User-Agent': '...' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
```

**Différence http vs https** :
- `http` : Port 80 par défaut, non chiffré
- `https` : Port 443 par défaut, chiffré (TLS/SSL)

### 2. Gestion des redirections

```js
if (res.statusCode === 301 || res.statusCode === 302) {
  const redirectURL = res.headers.location;
  return fetch(redirectURL); // Récursion
}
```

**Codes de redirection** :
- 301 : Moved Permanently
- 302 : Found (temporaire)
- 307 : Temporary Redirect
- 308 : Permanent Redirect

### 3. Regex pour parsing HTML

```js
// Extraire contenu d'une balise
/<h1[^>]*>(.*?)<\/h1>/gis

// Extraire attribut
/<img[^>]*src=["']([^"']*)["']/gi

// Flags :
// g = global (tous les matches)
// i = insensible à la casse
// s = . matche aussi \n
```

**⚠️ Limitation** : Les regex ne peuvent pas parser correctement du HTML imbriqué complexe. Pour du HTML très complexe, utiliser une vraie bibliothèque (cheerio, jsdom).

### 4. Résolution URLs relatives

```js
const { URL } = require('url');

const base = 'https://example.com/page';
const relative = '../images/photo.jpg';

const absolute = new URL(relative, base).href;
// → 'https://example.com/images/photo.jpg'
```

### 5. Décodage entités HTML

```js
'&nbsp;' → ' '  (espace insécable)
'&amp;'  → '&'  (esperluette)
'&lt;'   → '<'  (inférieur)
'&gt;'   → '>'  (supérieur)
'&quot;' → '"'  (guillemet)
'&#65;'  → 'A'  (code ASCII)
```

### 6. User-Agent

Certains sites bloquent les requêtes sans User-Agent. Toujours en fournir un :

```js
headers: {
  'User-Agent': 'Mozilla/5.0 (compatible; MyBot/1.0)'
}
```

---

## ⚖️ Considérations légales et éthiques

**⚠️ IMPORTANT** : Le web scraping doit être fait de manière responsable.

### Respect du robots.txt

```
https://example.com/robots.txt

User-agent: *
Disallow: /admin/
Disallow: /api/
Crawl-delay: 10
```

### Bonnes pratiques

✅ **Faire** :
- Respecter `robots.txt`
- Utiliser des délais entre requêtes (rate limiting)
- Fournir un User-Agent identifiable
- Respecter les Terms of Service
- Ne scraper que les données publiques

❌ **Ne pas faire** :
- DDoS involontaire (trop de requêtes)
- Scraper des données sensibles/privées
- Ignorer les protections anti-bot
- Violer les droits d'auteur
- Scraper pour spam/phishing

### Rate limiting

```js
async function scrapeMultiple(urls) {
  for (const url of urls) {
    await scrape(url);
    await new Promise(r => setTimeout(r, 1000)); // 1 seconde entre requêtes
  }
}
```

---

## 🔧 Cas d'usage avancés

### Monitoring de prix

```js
async function checkPrice(productURL) {
  const result = await scrape(productURL);
  const priceMatch = result.text.match(/\$(\d+\.?\d*)/);
  if (priceMatch) {
    return parseFloat(priceMatch[1]);
  }
  return null;
}

// Vérifier toutes les heures
setInterval(async () => {
  const price = await checkPrice('https://shop.com/product');
  if (price < 50) {
    console.log(`🚨 Prix baissé : $${price}`);
  }
}, 3600000);
```

### Extraction de contacts

```js
function extractEmails(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
}

const result = await scrape('https://company.com/contact');
const emails = extractEmails(result.text);
```

### Analyse SEO

```js
async function analyzeSEO(url) {
  const result = await scrape(url);
  
  return {
    title: result.metadata.title,
    titleLength: result.metadata.title?.length || 0,
    description: result.metadata.description,
    descLength: result.metadata.description?.length || 0,
    h1Count: result.headings.h1.length,
    linksCount: result.links.length,
    imagesCount: result.images.length,
    imagesWithoutAlt: result.images.filter(img => !img.alt).length,
  };
}
```

---

## 📁 Structure

```
day-07-web-scraper/
├── index.js          ← Scraper, fetch, extraction, CLI
├── index.test.js     ← 38 tests Jest
├── package.json
└── README.md
```

---

## 🔗 Suite du challenge

| ← Précédent         | Jour actuel           | Suivant →         |
|---------------------|-----------------------|-------------------|
| 06 · File Organizer | **07 · Web Scraper**  | 08 · Bulk Renamer |

---

*"The Web as I envisaged it, we have not seen it yet. The future is still so much bigger than the past."* — Tim Berners-Lee