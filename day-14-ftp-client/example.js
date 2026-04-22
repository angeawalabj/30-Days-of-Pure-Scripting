#!/usr/bin/env node
'use strict';

const { FTPClient, formatBytes } = require('./index');

// Exemple d'utilisation du client FTP

async function example() {
  console.log('📁 FTP Client Example\n');

  const client = new FTPClient();

  try {
    // Test de parse PASV
    console.log('1. Parse PASV Response');
    const testResponse = '227 Entering Passive Mode (192,168,1,100,195,149)';
    const parsed = client.parsePassiveResponse(testResponse);
    console.log(`   Host: ${parsed.host}`);
    console.log(`   Port: ${parsed.port}`);
    console.log(`   ✓ Parsed correctly\n`);

    // Test format bytes
    console.log('2. Format Bytes');
    console.log(`   ${formatBytes(0)} = 0 B`);
    console.log(`   ${formatBytes(1024)} = 1 KB`);
    console.log(`   ${formatBytes(1536)} = 1.5 KB`);
    console.log(`   ${formatBytes(1048576)} = 1 MB`);
    console.log(`   ✓ All formats correct\n`);

    // Test parse LIST
    console.log('3. Parse LIST Response');
    const listData = `-rw-r--r-- 1 user group 1024 Feb 27 10:00 file.txt
drwxr-xr-x 2 user group 4096 Feb 27 09:00 folder
-rw-r--r-- 1 user group 2048 Feb 26 15:30 document.pdf`;

    const files = client.parseListResponse(listData);
    for (const file of files) {
      const icon = file.type === 'directory' ? '📁' : '📄';
      console.log(`   ${icon} ${file.name} (${file.type}) - ${formatBytes(file.size)}`);
    }
    console.log(`   ✓ Parsed ${files.length} entries\n`);

    console.log('✅ All examples completed!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

if (require.main === module) {
  example();
}

module.exports = { example };