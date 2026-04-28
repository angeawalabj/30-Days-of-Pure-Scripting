
'use strict';

const { FTPClient, formatBytes } = require('./index');

describe('formatBytes()', () => {
  test('formate 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  test('formate KB', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });

  test('formate MB', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
  });

  test('formate avec décimales', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
  });
});

describe('FTPClient', () => {
  test('initialise client', () => {
    const client = new FTPClient();
    expect(client).toBeDefined();
    expect(client.controlSocket).toBeNull();
  });

  test('parsePassiveResponse extrait IP et port', () => {
    const client = new FTPClient();
    const response = '227 Entering Passive Mode (192,168,1,100,195,149)';
    const { host, port } = client.parsePassiveResponse(response);

    expect(host).toBe('192.168.1.100');
    expect(port).toBe(50069); // 195 * 256 + 149
  });

  test('parseListResponse parse format Unix', () => {
    const client = new FTPClient();
    const data = `-rw-r--r-- 1 user group 1024 Feb 27 10:00 file.txt
drwxr-xr-x 2 user group 4096 Feb 27 09:00 folder`;

    const files = client.parseListResponse(data);

    expect(files.length).toBe(2);
    expect(files[0].type).toBe('file');
    expect(files[0].name).toBe('file.txt');
    expect(files[1].type).toBe('directory');
  });
});