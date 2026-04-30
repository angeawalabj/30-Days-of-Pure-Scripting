'use strict';

const { Block, Blockchain } = require('./index');

describe('Block', () => {
  test('crée block avec données', () => {
    const block = new Block(1, Date.now(), 'test data', 'prev123');
    
    expect(block.index).toBe(1);
    expect(block.data).toBe('test data');
    expect(block.hash).toBeDefined();
  });

  test('calculateHash génère hash SHA-256', () => {
    const block = new Block(0, Date.now(), 'data');
    const hash = block.calculateHash();
    
    expect(hash).toHaveLength(64); // SHA-256 = 64 caractères hex
  });

  test('mineBlock trouve hash avec difficulté', () => {
    const block = new Block(1, Date.now(), 'data');
    block.mineBlock(2);
    
    expect(block.hash.startsWith('00')).toBe(true);
    expect(block.nonce).toBeGreaterThan(0);
  });
});

describe('Blockchain', () => {
  test('initialise avec genesis block', () => {
    const blockchain = new Blockchain(2);
    
    expect(blockchain.chain.length).toBe(1);
    expect(blockchain.chain[0].index).toBe(0);
  });

  test('addTransaction ajoute transaction', () => {
    const blockchain = new Blockchain(2);
    blockchain.addTransaction({ from: 'alice', to: 'bob', amount: 50 });
    
    expect(blockchain.pendingTransactions.length).toBe(1);
  });

  test('getBalance calcule balance', () => {
    const blockchain = new Blockchain(2);
    
    blockchain.addTransaction({ from: 'alice', to: 'bob', amount: 50 });
    blockchain.minePendingTransactions('miner');
    
    const balance = blockchain.getBalance('bob');
    expect(balance).toBeGreaterThan(0);
  });

  test('isChainValid vérifie intégrité', () => {
    const blockchain = new Blockchain(2);
    
    expect(blockchain.isChainValid()).toBe(true);
  });

  test('détecte chain invalide si hash modifié', () => {
    const blockchain = new Blockchain(2);
    blockchain.addTransaction({ from: 'alice', to: 'bob', amount: 50 });
    blockchain.minePendingTransactions('miner');
    
    // Modifier un block
    blockchain.chain[1].data = 'tampered';
    
    expect(blockchain.isChainValid()).toBe(false);
  });
});