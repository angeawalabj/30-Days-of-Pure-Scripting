# 📧 Day 13 — Email Client

> **30 Days of Pure Scripting** · Semaine 3 : Réseautage et API · Jour 3/5

## 🎯 Problème

Créer un client email SMTP capable d'envoyer des emails avec texte et HTML.

## ⚡ Fonctionnalités

- ✅ **SMTP natif** : Protocole implémenté from scratch
- ✅ **STARTTLS** : Upgrade connexion sécurisée
- ✅ **AUTH LOGIN** : Authentification Base64
- ✅ **Text & HTML** : Support multipart/alternative
- ✅ **Multiple recipients** : TO, CC, BCC
- ✅ **Email Builder** : API fluent chainable
- ✅ **Gmail ready** : Compatible avec Gmail SMTP
- ✅ **CLI complet** : Envoi depuis ligne de commande

## 🚀 Usage CLI

```bash
node index.js send \
  --from me@gmail.com \
  --to you@example.com \
  --subject "Hello World" \
  --text "This is a test email" \
  --password "your-app-password"
```

### Gmail App Password

Pour Gmail, vous devez utiliser un **mot de passe d'application** :
1. Activer 2FA sur votre compte Google
2. Aller dans : https://myaccount.google.com/apppasswords
3. Créer un mot de passe pour "Mail"
4. Utiliser ce mot de passe à 16 caractères

## 📨 API Programmatique

### Envoi simple

```javascript
const { sendEmail } = require('./index');

const config = {
  host: 'smtp.gmail.com',
  port: 587,
  username: 'me@gmail.com',
  password: 'app-password-here',
};

const mailOptions = {
  from: 'me@gmail.com',
  to: ['recipient@example.com'],
  subject: 'Test Email',
  text: 'Hello from Node.js!',
};

await sendEmail(config, mailOptions);
```

### Email Builder (Fluent API)

```javascript
const { createEmail, sendEmail } = require('./index');

const email = createEmail()
  .from('me@gmail.com')
  .to('recipient@example.com')
  .cc('other@example.com')
  .subject('Newsletter')
  .text('Plain text version')
  .html('<h1>HTML version</h1>')
  .build();

await sendEmail(config, email);
```

### HTML Email

```javascript
const mailOptions = {
  from: 'me@gmail.com',
  to: ['user@example.com'],
  subject: 'Welcome!',
  text: 'Welcome to our service.',
  html: `
    <html>
      <body>
        <h1>Welcome!</h1>
        <p>Thanks for signing up.</p>
        <a href="https://example.com">Visit our site</a>
      </body>
    </html>
  `,
};

await sendEmail(config, mailOptions);
```

## 📡 Protocole SMTP

### Flux d'envoi

```
Client                          Server
  |                               |
  |--- TCP Connect -------------->|
  |<-- 220 Service ready ----------|
  |                               |
  |--- EHLO localhost ----------->|
  |<-- 250 Hello ------------------|
  |                               |
  |--- STARTTLS ----------------->|
  |<-- 220 Go ahead ---------------|
  |--- [TLS Handshake] ---------->|
  |                               |
  |--- EHLO localhost ----------->|
  |<-- 250 Hello ------------------|
  |                               |
  |--- AUTH LOGIN --------------->|
  |<-- 334 Username: --------------|
  |--- [base64 username] -------->|
  |<-- 334 Password: --------------|
  |--- [base64 password] -------->|
  |<-- 235 Authenticated ----------|
  |                               |
  |--- MAIL FROM:<sender> ------->|
  |<-- 250 OK ---------------------|
  |                               |
  |--- RCPT TO:<recipient> ------>|
  |<-- 250 OK ---------------------|
  |                               |
  |--- DATA --------------------->|
  |<-- 354 Start input ------------|
  |--- [email headers & body] --->|
  |--- . ------------------------>|
  |<-- 250 Message accepted -------|
  |                               |
  |--- QUIT --------------------->|
  |<-- 221 Bye --------------------|
```

### Codes de réponse

| Code | Signification |
|------|---------------|
| 220 | Service ready |
| 221 | Closing connection |
| 235 | Authentication successful |
| 250 | Requested action okay |
| 334 | Authentication challenge |
| 354 | Start mail input |
| 535 | Authentication failed |
| 550 | Mailbox unavailable |

## 🏗️ Architecture

```
Email Client
├── SMTPClient
│   ├── connect() - TCP/TLS
│   ├── authenticate() - AUTH LOGIN
│   ├── sendMail() - SMTP commands
│   └── buildMessage() - MIME format
├── EmailBuilder
│   └── Fluent API chainable
└── Helper Functions
    └── sendEmail() - All-in-one
```

## 🎯 Concepts clés

### 1. SMTP Commands

```javascript
EHLO localhost          // Identify client
STARTTLS                // Upgrade to TLS
AUTH LOGIN              // Start authentication
MAIL FROM:<email>       // Set sender
RCPT TO:<email>         // Set recipient
DATA                    // Start message
.                       // End message
QUIT                    // Close connection
```

### 2. AUTH LOGIN (Base64)

```javascript
// Server: 334 Username:
Buffer.from('user@example.com').toString('base64')
// → dXNlckBleGFtcGxlLmNvbQ==

// Server: 334 Password:
Buffer.from('password123').toString('base64')
// → cGFzc3dvcmQxMjM=
```

### 3. MIME Multipart

```
Content-Type: multipart/alternative; boundary="abc123"

--abc123
Content-Type: text/plain; charset=utf-8

Plain text version

--abc123
Content-Type: text/html; charset=utf-8

<h1>HTML version</h1>

--abc123--
```

### 4. STARTTLS

Upgrade connexion non-chiffrée vers TLS :

```javascript
// 1. Connexion TCP normale
socket = net.connect({ host, port: 587 });

// 2. Envoyer STARTTLS
socket.write('STARTTLS\r\n');

// 3. Upgrade vers TLS
socket = tls.connect({ socket });
```

### 5. Email Headers

```
From: sender@example.com
To: recipient@example.com
Subject: Test Email
Date: Wed, 27 Feb 2025 10:00:00 GMT
MIME-Version: 1.0
Content-Type: text/plain; charset=utf-8

Email body here
```

## 🌟 Points forts

- ✅ **Zéro dépendance** : Pas de nodemailer
- ✅ **Protocol complet** : SMTP from scratch
- ✅ **TLS support** : STARTTLS natif
- ✅ **Auth sécurisée** : Base64 encoding
- ✅ **MIME proper** : multipart/alternative
- ✅ **Builder pattern** : API élégante

## ⚠️ Limitations

- ❌ Pas d'attachments (fichiers)
- ❌ Pas d'IMAP (réception)
- ❌ Pas de pooling connexions
- ❌ Pas de retry automatique

Pour production, utilisez **nodemailer** qui a toutes ces features.

## 📊 Providers SMTP populaires

| Provider | Host | Port | TLS |
|----------|------|------|-----|
| Gmail | smtp.gmail.com | 587 | STARTTLS |
| Outlook | smtp-mail.outlook.com | 587 | STARTTLS |
| Yahoo | smtp.mail.yahoo.com | 587 | STARTTLS |
| SendGrid | smtp.sendgrid.net | 587 | STARTTLS |
| Mailgun | smtp.mailgun.org | 587 | STARTTLS |

## 📁 Structure

```
day-13-email-client/
├── index.js       ← SMTP Client + Builder + CLI
├── package.json
└── README.md
```

## 🔗 Suite du challenge

| ← Précédent     | Jour actuel        | Suivant →       |
|-----------------|--------------------|-----------------|
| 12 · WebSocket  | **13 · Email**     | 14 · FTP        |

---

**Semaine 3 : 3/5 jours · 13/30 total**

*"Email is the cockroach of the Internet."* — Unknown