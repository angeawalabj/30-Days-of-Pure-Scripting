#!/usr/bin/env node
'use strict';

const { createEmail, SMTPClient } = require('./index');

// Exemple 1 : Email Builder
console.log('📧 Email Builder Example\n');

const email = createEmail()
  .from('sender@example.com')
  .to('recipient1@example.com', 'recipient2@example.com')
  .cc('cc@example.com')
  .subject('Test Email from Builder')
  .text('This is the plain text version.')
  .html('<h1>This is the HTML version</h1>')
  .build();

console.log('Email built:');
console.log(JSON.stringify(email, null, 2));

// Exemple 2 : Construction de message MIME
console.log('\n📨 MIME Message Example\n');

const client = new SMTPClient({
  host: 'smtp.example.com',
  port: 587,
  username: 'user@example.com',
  password: 'password',
});

const message = client.buildMessage({
  from: 'sender@example.com',
  to: ['recipient@example.com'],
  subject: 'Test Subject',
  text: 'Plain text',
  html: '<p>HTML version</p>',
});

console.log('MIME Message:');
console.log(message);

// Exemple 3 : Base64 encoding pour AUTH
console.log('\n🔐 Base64 Encoding Example\n');

const username = 'user@example.com';
const password = 'mypassword';

console.log('Username:', username);
console.log('Base64:  ', Buffer.from(username).toString('base64'));
console.log('\nPassword:', password);
console.log('Base64:  ', Buffer.from(password).toString('base64'));

console.log('\n✅ Examples completed!\n');