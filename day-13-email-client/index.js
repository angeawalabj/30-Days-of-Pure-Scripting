'use strict';

const net = require('net');
const tls = require('tls');
const crypto = require('crypto');

/**
 * ============================================================
 * DAY 13 — Email Client (SMTP/IMAP)
 * ============================================================
 * Algorithme  : SMTP Protocol + Base64 Encoding
 * Complexité  : O(n) où n = taille du message
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── SMTP Client ─────────────────────────────────────────────

class SMTPClient {
  constructor(config) {
    this.host = config.host;
    this.port = config.port || 587;
    this.secure = config.secure || false;
    this.username = config.username;
    this.password = config.password;
    this.socket = null;
    this.buffer = '';
  }

  async connect() {
    return new Promise((resolve, reject) => {
      if (this.secure) {
        this.socket = tls.connect({ host: this.host, port: this.port }, () => {
          this.setupSocket();
          resolve();
        });
      } else {
        this.socket = net.connect({ host: this.host, port: this.port }, () => {
          this.setupSocket();
          resolve();
        });
      }

      this.socket.on('error', reject);
    });
  }

  setupSocket() {
    this.socket.on('data', (data) => {
      this.buffer += data.toString();
    });
  }

  async sendCommand(command, expectedCode) {
    this.buffer = '';
    this.socket.write(command + '\r\n');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for response'));
      }, 10000);

      const checkBuffer = setInterval(() => {
        if (this.buffer.includes('\r\n')) {
          clearInterval(checkBuffer);
          clearTimeout(timeout);

          const lines = this.buffer.split('\r\n');
          const lastLine = lines.find(line => /^\d{3}/.test(line));

          if (!lastLine) {
            return reject(new Error('Invalid response'));
          }

          const code = parseInt(lastLine.substring(0, 3), 10);

          if (expectedCode && code !== expectedCode) {
            return reject(new Error(`Expected ${expectedCode}, got ${code}: ${lastLine}`));
          }

          resolve({ code, message: lastLine });
        }
      }, 10);
    });
  }

  async authenticate() {
    await this.sendCommand('EHLO localhost', 250);

    // STARTTLS si non sécurisé
    if (!this.secure && this.port === 587) {
      await this.sendCommand('STARTTLS', 220);
      
      this.socket = tls.connect({
        socket: this.socket,
        host: this.host,
      });

      this.setupSocket();
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.sendCommand('EHLO localhost', 250);
    }

    // AUTH LOGIN
    await this.sendCommand('AUTH LOGIN', 334);
    await this.sendCommand(Buffer.from(this.username).toString('base64'), 334);
    await this.sendCommand(Buffer.from(this.password).toString('base64'), 235);
  }

  async sendMail(options) {
    const { from, to, subject, text, html } = options;

    // MAIL FROM
    await this.sendCommand(`MAIL FROM:<${from}>`, 250);

    // RCPT TO
    const recipients = Array.isArray(to) ? to : [to];
    for (const recipient of recipients) {
      await this.sendCommand(`RCPT TO:<${recipient}>`, 250);
    }

    // DATA
    await this.sendCommand('DATA', 354);

    // Message
    const message = this.buildMessage({ from, to: recipients, subject, text, html });
    await this.sendCommand(message + '\r\n.', 250);

    return { success: true };
  }

  buildMessage(options) {
    const { from, to, subject, text, html } = options;
    const boundary = crypto.randomBytes(16).toString('hex');
    const date = new Date().toUTCString();

    let message = [
      `From: ${from}`,
      `To: ${to.join(', ')}`,
      `Subject: ${subject}`,
      `Date: ${date}`,
      `MIME-Version: 1.0`,
    ];

    if (html) {
      message.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
      message.push('');
      message.push(`--${boundary}`);
      message.push('Content-Type: text/plain; charset=utf-8');
      message.push('');
      message.push(text || 'Please view this email in HTML.');
      message.push('');
      message.push(`--${boundary}`);
      message.push('Content-Type: text/html; charset=utf-8');
      message.push('');
      message.push(html);
      message.push('');
      message.push(`--${boundary}--`);
    } else {
      message.push('Content-Type: text/plain; charset=utf-8');
      message.push('');
      message.push(text);
    }

    return message.join('\r\n');
  }

  async quit() {
    if (this.socket) {
      await this.sendCommand('QUIT', 221);
      this.socket.end();
    }
  }
}

// ─── Email Builder ───────────────────────────────────────────

class EmailBuilder {
  constructor() {
    this.email = {
      from: null,
      to: [],
      cc: [],
      bcc: [],
      subject: '',
      text: '',
      html: null,
      attachments: [],
    };
  }

  from(email) {
    this.email.from = email;
    return this;
  }

  to(...emails) {
    this.email.to.push(...emails);
    return this;
  }

  cc(...emails) {
    this.email.cc.push(...emails);
    return this;
  }

  bcc(...emails) {
    this.email.bcc.push(...emails);
    return this;
  }

  subject(text) {
    this.email.subject = text;
    return this;
  }

  text(content) {
    this.email.text = content;
    return this;
  }

  html(content) {
    this.email.html = content;
    return this;
  }

  attach(attachment) {
    this.email.attachments.push(attachment);
    return this;
  }

  build() {
    return { ...this.email };
  }
}

// ─── Helper Functions ────────────────────────────────────────

async function sendEmail(config, mailOptions) {
  const client = new SMTPClient(config);

  try {
    await client.connect();
    await client.authenticate();
    const result = await client.sendMail(mailOptions);
    await client.quit();
    return result;
  } catch (err) {
    if (client.socket) {
      client.socket.destroy();
    }
    throw err;
  }
}

function createEmail() {
  return new EmailBuilder();
}

// ─── CLI ─────────────────────────────────────────────────────

async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help') {
    console.log(`
Usage:
  node index.js send --from <email> --to <email> --subject <text> --text <text>

Options:
  --from       Sender email
  --to         Recipient email(s) (comma-separated)
  --subject    Email subject
  --text       Email body (plain text)
  --html       Email body (HTML)
  --host       SMTP host (default: smtp.gmail.com)
  --port       SMTP port (default: 587)
  --username   SMTP username
  --password   SMTP password

Exemples:
  node index.js send --from me@example.com --to you@example.com \\
    --subject "Hello" --text "This is a test"

Note: Pour Gmail, utilisez un mot de passe d'application
    `);
    process.exit(0);
  }

  if (command === 'send') {
    try {
      const getArg = (name) => {
        const idx = args.indexOf(`--${name}`);
        return idx !== -1 ? args[idx + 1] : null;
      };

      const from = getArg('from');
      const to = getArg('to');
      const subject = getArg('subject');
      const text = getArg('text');
      const html = getArg('html');
      const host = getArg('host') || 'smtp.gmail.com';
      const port = parseInt(getArg('port') || '587', 10);
      const username = getArg('username') || from;
      const password = getArg('password');

      if (!from || !to || !subject || (!text && !html)) {
        console.error('❌ Paramètres manquants. Utilisez --help pour voir les options.');
        process.exit(1);
      }

      if (!password) {
        console.error('❌ Mot de passe requis (--password)');
        process.exit(1);
      }

      console.log('\n📧 Envoi email...\n');
      console.log(`De        : ${from}`);
      console.log(`À         : ${to}`);
      console.log(`Sujet     : ${subject}`);
      console.log(`Serveur   : ${host}:${port}\n`);

      const config = { host, port, username, password };
      const mailOptions = {
        from,
        to: to.split(',').map(e => e.trim()),
        subject,
        text,
        html,
      };

      await sendEmail(config, mailOptions);

      console.log('✅ Email envoyé avec succès !\n');

    } catch (err) {
      console.error(`\n❌ Erreur : ${err.message}\n`);
      process.exit(1);
    }
  } else {
    console.error(`❌ Commande inconnue : "${command}".`);
    process.exit(1);
  }
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  SMTPClient,
  EmailBuilder,
  sendEmail,
  createEmail,
};

// ─── Point d'entrée ──────────────────────────────────────────

if (require.main === module) {
  runCLI().catch(err => {
    console.error('Erreur fatale:', err.message);
    process.exit(1);
  });
}