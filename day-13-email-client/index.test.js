'use strict';

const { SMTPClient, EmailBuilder } = require('./index');

describe('EmailBuilder', () => {
  test('construit email avec méthodes chainées', () => {
    const email = new EmailBuilder()
      .from('sender@example.com')
      .to('recipient@example.com')
      .subject('Test')
      .text('Body')
      .build();

    expect(email.from).toBe('sender@example.com');
    expect(email.to).toContain('recipient@example.com');
    expect(email.subject).toBe('Test');
  });

  test('supporte multiples destinataires', () => {
    const email = new EmailBuilder()
      .to('user1@test.com', 'user2@test.com')
      .build();

    expect(email.to.length).toBe(2);
  });

  test('supporte CC et BCC', () => {
    const email = new EmailBuilder()
      .cc('cc@test.com')
      .bcc('bcc@test.com')
      .build();

    expect(email.cc).toContain('cc@test.com');
    expect(email.bcc).toContain('bcc@test.com');
  });
});

describe('SMTPClient', () => {
  test('initialise avec config', () => {
    const client = new SMTPClient({
      host: 'smtp.example.com',
      port: 587,
      username: 'user',
      password: 'pass',
    });

    expect(client.host).toBe('smtp.example.com');
    expect(client.port).toBe(587);
  });

  test('buildMessage crée structure MIME', () => {
    const client = new SMTPClient({ host: 'test' });
    const message = client.buildMessage({
      from: 'sender@test.com',
      to: ['recipient@test.com'],
      subject: 'Test',
      text: 'Hello',
    });

    expect(message).toContain('From: sender@test.com');
    expect(message).toContain('Subject: Test');
    expect(message).toContain('Hello');
  });

  test('buildMessage supporte HTML', () => {
    const client = new SMTPClient({ host: 'test' });
    const message = client.buildMessage({
      from: 'sender@test.com',
      to: ['recipient@test.com'],
      subject: 'Test',
      text: 'Plain',
      html: '<h1>HTML</h1>',
    });

    expect(message).toContain('multipart/alternative');
    expect(message).toContain('<h1>HTML</h1>');
  });
});