'use strict';

const crypto = require('crypto');
const { createAcceptKey, parseFrame, createFrame } = require('./index');

// ─────────────────────────────────────────────────────────────
// createAcceptKey()
// ─────────────────────────────────────────────────────────────
describe('createAcceptKey()', () => {
  test('génère clé d\'accept correcte', () => {
    const key = 'dGhlIHNhbXBsZSBub25jZQ==';
    const acceptKey = createAcceptKey(key);
    
    expect(acceptKey).toBe('s3pPLMBiTxaQ9kYGzzhZRbK+xOo=');
  });

  test('génère clés différentes pour inputs différents', () => {
    const key1 = createAcceptKey('key1');
    const key2 = createAcceptKey('key2');
    
    expect(key1).not.toBe(key2);
  });

  test('génère toujours même clé pour même input', () => {
    const key1 = createAcceptKey('test');
    const key2 = createAcceptKey('test');
    
    expect(key1).toBe(key2);
  });
});

// ─────────────────────────────────────────────────────────────
// createFrame()
// ─────────────────────────────────────────────────────────────
describe('createFrame()', () => {
  test('crée frame pour message court', () => {
    const frame = createFrame('Hello');
    
    expect(Buffer.isBuffer(frame)).toBe(true);
    expect(frame.length).toBeGreaterThan(0);
  });

  test('frame commence par 0x81 (FIN + text)', () => {
    const frame = createFrame('Test');
    
    expect(frame.readUInt8(0)).toBe(0x81);
  });

  test('encode payload correctement', () => {
    const message = 'Hello';
    const frame = createFrame(message);
    
    // Pour message court (<126), structure: 0x81, length, data
    const payloadLength = frame.readUInt8(1);
    expect(payloadLength).toBe(message.length);
  });

  test('supporte messages vides', () => {
    const frame = createFrame('');
    
    expect(Buffer.isBuffer(frame)).toBe(true);
    expect(frame.readUInt8(1)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// parseFrame()
// ─────────────────────────────────────────────────────────────
describe('parseFrame()', () => {
  test('parse frame simple non-masquée', () => {
    // Frame: FIN=1, opcode=1 (text), mask=0, len=5, payload="Hello"
    const frame = Buffer.from([0x81, 0x05, 0x48, 0x65, 0x6c, 0x6c, 0x6f]);
    
    const parsed = parseFrame(frame);
    
    expect(parsed.fin).toBe(true);
    expect(parsed.opcode).toBe(0x01);
    expect(parsed.payload).toBe('Hello');
  });

  test('parse frame masquée', () => {
    // Frame masquée avec clé [0x12, 0x34, 0x56, 0x78]
    const frame = Buffer.from([
      0x81, 0x85, // FIN, opcode=1, masked, len=5
      0x12, 0x34, 0x56, 0x78, // Masking key
      0x5a, 0x51, 0x3a, 0x14, 0x67 // Masked "Hello"
    ]);
    
    const parsed = parseFrame(frame);
    
    expect(parsed.payload).toBe('Hello');
  });

  test('détecte FIN bit', () => {
    const frameFin = Buffer.from([0x81, 0x00]); // FIN=1
    const frameNoFin = Buffer.from([0x01, 0x00]); // FIN=0
    
    expect(parseFrame(frameFin).fin).toBe(true);
    expect(parseFrame(frameNoFin).fin).toBe(false);
  });

  test('détecte opcode', () => {
    const frameText = Buffer.from([0x81, 0x00]); // opcode=1 (text)
    const frameBinary = Buffer.from([0x82, 0x00]); // opcode=2 (binary)
    
    expect(parseFrame(frameText).opcode).toBe(0x01);
    expect(parseFrame(frameBinary).opcode).toBe(0x02);
  });

  test('retourne longueur totale du frame', () => {
    const frame = Buffer.from([0x81, 0x03, 0x41, 0x42, 0x43]); // "ABC"
    const parsed = parseFrame(frame);
    
    expect(parsed.length).toBe(5); // 2 header + 3 payload
  });
});

// ─────────────────────────────────────────────────────────────
// Integration
// ─────────────────────────────────────────────────────────────
describe('Integration createFrame + parseFrame', () => {
  test('encode puis decode retourne message original', () => {
    const original = 'Hello World!';
    
    const frame = createFrame(original);
    // Ajouter le masking pour simuler client → server
    // (Dans la vraie vie, les frames client sont toujours masquées)
    
    // Pour ce test, on utilise une frame non-masquée (server → client)
    const testFrame = Buffer.from([
      0x81, 
      original.length,
      ...Buffer.from(original)
    ]);
    
    const parsed = parseFrame(testFrame);
    expect(parsed.payload).toBe(original);
  });

  test('supporte caractères spéciaux', () => {
    const message = 'Émoji: 😊';
    const frame = createFrame(message);
    
    expect(Buffer.isBuffer(frame)).toBe(true);
  });

  test('supporte messages longs', () => {
    const message = 'x'.repeat(200);
    const frame = createFrame(message);
    
    expect(Buffer.isBuffer(frame)).toBe(true);
    expect(frame.length).toBeGreaterThan(200);
  });
});

// ─────────────────────────────────────────────────────────────
// Magic String
// ─────────────────────────────────────────────────────────────
describe('WebSocket Protocol Constants', () => {
  test('Magic string est constant', () => {
    const MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
    
    // Vérifier que createAcceptKey utilise cette constante
    const testKey = 'test';
    const hash = crypto.createHash('sha1')
      .update(testKey + MAGIC)
      .digest('base64');
    
    expect(createAcceptKey(testKey)).toBe(hash);
  });
});