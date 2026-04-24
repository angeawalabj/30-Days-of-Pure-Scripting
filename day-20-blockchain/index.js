'use strict';

const crypto = require('crypto');
const fs = require('fs');

/**
 * ============================================================
 * DAY 20 — Blockchain (Simplified)
 * ============================================================
 * Algorithme  : Proof of Work + Chain validation
 * Complexité  : O(n) validation, O(2^difficulty) mining
 * Author      : 30 Days of Scripting Challenge
 * ============================================================
 */

// ─── Block ───────────────────────────────────────────────────

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.index +
        this.timestamp +
        JSON.stringify(this.data) +
        this.previousHash +
        this.nonce
      )
      .digest('hex');
  }

  mineBlock(difficulty) {
    const target = '0'.repeat(difficulty);
    
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    console.log(`⛏️  Block mined: ${this.hash} (nonce: ${this.nonce})`);
  }
}

// ─── Blockchain ──────────────────────────────────────────────

class Blockchain {
  constructor(difficulty = 2) {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = difficulty;
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  createGenesisBlock() {
    return new Block(0, Date.now(), 'Genesis Block', '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    const block = new Block(
      this.chain.length,
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );

    block.mineBlock(this.difficulty);
    this.chain.push(block);

    // Récompense pour le mineur
    this.pendingTransactions = [
      {
        from: 'system',
        to: miningRewardAddress,
        amount: this.miningReward,
        timestamp: Date.now(),
      }
    ];
  }

  addTransaction(transaction) {
    if (!transaction.from || !transaction.to) {
      throw new Error('Transaction must include from and to address');
    }

    if (transaction.amount <= 0) {
      throw new Error('Transaction amount must be positive');
    }

    this.pendingTransactions.push({
      ...transaction,
      timestamp: Date.now(),
    });
  }

  getBalance(address) {
    let balance = 0;

    for (const block of this.chain) {
      if (Array.isArray(block.data)) {
        for (const trans of block.data) {
          if (trans.from === address) {
            balance -= trans.amount;
          }
          if (trans.to === address) {
            balance += trans.amount;
          }
        }
      }
    }

    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Vérifier hash du block
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        console.error(`❌ Invalid hash at block ${i}`);
        return false;
      }

      // Vérifier chaînage
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.error(`❌ Invalid chain at block ${i}`);
        return false;
      }

      // Vérifier proof of work
      if (!currentBlock.hash.startsWith('0'.repeat(this.difficulty))) {
        console.error(`❌ Invalid proof of work at block ${i}`);
        return false;
      }
    }

    return true;
  }

  save(filepath) {
    const data = {
      chain: this.chain,
      difficulty: this.difficulty,
      pendingTransactions: this.pendingTransactions,
      miningReward: this.miningReward,
    };

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  }

  static load(filepath) {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    const blockchain = new Blockchain(data.difficulty);
    
    blockchain.chain = data.chain.map(blockData => {
      const block = new Block(
        blockData.index,
        blockData.timestamp,
        blockData.data,
        blockData.previousHash
      );
      block.nonce = blockData.nonce;
      block.hash = blockData.hash;
      return block;
    });

    blockchain.pendingTransactions = data.pendingTransactions || [];
    blockchain.miningReward = data.miningReward || 100;

    return blockchain;
  }

  getStats() {
    return {
      blocks: this.chain.length,
      difficulty: this.difficulty,
      pendingTransactions: this.pendingTransactions.length,
      valid: this.isChainValid(),
      totalTransactions: this.chain.reduce((sum, block) => {
        return sum + (Array.isArray(block.data) ? block.data.length : 0);
      }, 0),
    };
  }
}

// ─── CLI ─────────────────────────────────────────────────────

async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    console.log(`
Usage:
  node index.js init [difficulty]
  node index.js transaction <from> <to> <amount>
  node index.js mine <address>
  node index.js balance <address>
  node index.js validate
  node index.js list
  node index.js stats

Examples:
  node index.js init 3
  node index.js transaction alice bob 50
  node index.js mine miner1
  node index.js balance alice
    `);
    process.exit(0);
  }

  const CHAIN_FILE = './blockchain.json';

  try {
    if (command === 'init') {
      const difficulty = parseInt(args[1]) || 2;
      const blockchain = new Blockchain(difficulty);
      blockchain.save(CHAIN_FILE);
      console.log(`✅ Blockchain initialized (difficulty: ${difficulty})`);

    } else if (command === 'transaction') {
      const [, from, to, amount] = args;

      if (!from || !to || !amount) {
        console.error('❌ Usage: transaction <from> <to> <amount>');
        process.exit(1);
      }

      const blockchain = Blockchain.load(CHAIN_FILE);
      blockchain.addTransaction({
        from,
        to,
        amount: parseFloat(amount),
      });
      blockchain.save(CHAIN_FILE);

      console.log(`✅ Transaction added: ${from} → ${to} (${amount})`);
      console.log(`   Pending transactions: ${blockchain.pendingTransactions.length}`);

    } else if (command === 'mine') {
      const address = args[1];

      if (!address) {
        console.error('❌ Usage: mine <address>');
        process.exit(1);
      }

      const blockchain = Blockchain.load(CHAIN_FILE);
      
      console.log(`⛏️  Mining block...`);
      blockchain.minePendingTransactions(address);
      blockchain.save(CHAIN_FILE);

      console.log(`✅ Block mined! Reward sent to ${address}`);

    } else if (command === 'balance') {
      const address = args[1];

      if (!address) {
        console.error('❌ Usage: balance <address>');
        process.exit(1);
      }

      const blockchain = Blockchain.load(CHAIN_FILE);
      const balance = blockchain.getBalance(address);

      console.log(`💰 Balance of ${address}: ${balance}`);

    } else if (command === 'validate') {
      const blockchain = Blockchain.load(CHAIN_FILE);
      const valid = blockchain.isChainValid();

      if (valid) {
        console.log('✅ Blockchain is valid!');
      } else {
        console.log('❌ Blockchain is INVALID!');
      }

    } else if (command === 'list') {
      const blockchain = Blockchain.load(CHAIN_FILE);

      console.log('\n📦 BLOCKCHAIN\n' + '─'.repeat(50));
      
      for (const block of blockchain.chain) {
        console.log(`\nBlock #${block.index}`);
        console.log(`Hash: ${block.hash}`);
        console.log(`Previous: ${block.previousHash}`);
        console.log(`Nonce: ${block.nonce}`);
        console.log(`Timestamp: ${new Date(block.timestamp).toLocaleString()}`);
        
        if (Array.isArray(block.data)) {
          console.log(`Transactions: ${block.data.length}`);
          block.data.forEach(tx => {
            console.log(`  ${tx.from} → ${tx.to}: ${tx.amount}`);
          });
        } else {
          console.log(`Data: ${block.data}`);
        }
      }

    } else if (command === 'stats') {
      const blockchain = Blockchain.load(CHAIN_FILE);
      const stats = blockchain.getStats();

      console.log('\n📊 BLOCKCHAIN STATS\n' + '─'.repeat(50));
      console.log(`Blocks: ${stats.blocks}`);
      console.log(`Difficulty: ${stats.difficulty}`);
      console.log(`Pending Transactions: ${stats.pendingTransactions}`);
      console.log(`Total Transactions: ${stats.totalTransactions}`);
      console.log(`Valid: ${stats.valid ? '✅' : '❌'}`);

    } else {
      console.error(`❌ Unknown command: "${command}"`);
      process.exit(1);
    }

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

// ─── Exports ─────────────────────────────────────────────────

module.exports = {
  Block,
  Blockchain,
};

// ─── Point d'entrée ──────────────────────────────────────────

if (require.main === module) {
  runCLI().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
  });
}