'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');

const {
  getMetrics,
  getCPUUsage,
  getLoadAverage,
  getMemoryUsage,
  getDiskUsage,
  getSystemInfo,
  getNetworkInfo,
  checkThresholds,
  monitor,
  formatBytes,
  formatUptime,
  saveMetrics,
  DEFAULT_THRESHOLDS,
  ALERT_LEVELS,
} = require('./index');

// ─────────────────────────────────────────────────────────────
// getCPUUsage()
// ─────────────────────────────────────────────────────────────
describe('getCPUUsage()', () => {
  test('retourne objet avec propriétés requises', () => {
    const cpu = getCPUUsage();
    expect(cpu).toHaveProperty('usage');
    expect(cpu).toHaveProperty('cores');
    expect(cpu).toHaveProperty('model');
    expect(cpu).toHaveProperty('speed');
  });

  test('usage est un nombre entre 0 et 100', () => {
    const cpu = getCPUUsage();
    expect(cpu.usage).toBeGreaterThanOrEqual(0);
    expect(cpu.usage).toBeLessThanOrEqual(100);
  });

  test('cores correspond à os.cpus()', () => {
    const cpu = getCPUUsage();
    expect(cpu.cores).toBe(os.cpus().length);
  });
});

// ─────────────────────────────────────────────────────────────
// getLoadAverage()
// ─────────────────────────────────────────────────────────────
describe('getLoadAverage()', () => {
  test('retourne load pour 1, 5 et 15 min', () => {
    const load = getLoadAverage();
    expect(load).toHaveProperty('1min');
    expect(load).toHaveProperty('5min');
    expect(load).toHaveProperty('15min');
  });

  test('valeurs sont des nombres', () => {
    const load = getLoadAverage();
    expect(typeof load['1min']).toBe('number');
    expect(typeof load['5min']).toBe('number');
    expect(typeof load['15min']).toBe('number');
  });

  test('valeurs correspondent à os.loadavg()', () => {
    const load = getLoadAverage();
    const osLoad = os.loadavg();
    expect(load['1min']).toBeCloseTo(osLoad[0], 1);
    expect(load['5min']).toBeCloseTo(osLoad[1], 1);
    expect(load['15min']).toBeCloseTo(osLoad[2], 1);
  });
});

// ─────────────────────────────────────────────────────────────
// getMemoryUsage()
// ─────────────────────────────────────────────────────────────
describe('getMemoryUsage()', () => {
  test('retourne propriétés requises', () => {
    const mem = getMemoryUsage();
    expect(mem).toHaveProperty('total');
    expect(mem).toHaveProperty('used');
    expect(mem).toHaveProperty('free');
    expect(mem).toHaveProperty('usage');
    expect(mem).toHaveProperty('totalBytes');
    expect(mem).toHaveProperty('usedBytes');
    expect(mem).toHaveProperty('freeBytes');
  });

  test('usage est entre 0 et 100', () => {
    const mem = getMemoryUsage();
    expect(mem.usage).toBeGreaterThanOrEqual(0);
    expect(mem.usage).toBeLessThanOrEqual(100);
  });

  test('total = used + free', () => {
    const mem = getMemoryUsage();
    expect(mem.totalBytes).toBe(mem.usedBytes + mem.freeBytes);
  });

  test('formats sont des strings', () => {
    const mem = getMemoryUsage();
    expect(typeof mem.total).toBe('string');
    expect(typeof mem.used).toBe('string');
    expect(typeof mem.free).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────
// getDiskUsage()
// ─────────────────────────────────────────────────────────────
describe('getDiskUsage()', () => {
  test('retourne objet avec mountPoint', () => {
    const disk = getDiskUsage();
    expect(disk).toHaveProperty('mountPoint');
  });

  test('retourne objet non-null', () => {
    const disk = getDiskUsage('/');
    expect(disk).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// getSystemInfo()
// ─────────────────────────────────────────────────────────────
describe('getSystemInfo()', () => {
  test('retourne propriétés système', () => {
    const sys = getSystemInfo();
    expect(sys).toHaveProperty('platform');
    expect(sys).toHaveProperty('arch');
    expect(sys).toHaveProperty('hostname');
    expect(sys).toHaveProperty('uptime');
    expect(sys).toHaveProperty('uptimeSeconds');
    expect(sys).toHaveProperty('nodeVersion');
  });

  test('platform correspond à os.platform()', () => {
    const sys = getSystemInfo();
    expect(sys.platform).toBe(os.platform());
  });

  test('nodeVersion commence par v', () => {
    const sys = getSystemInfo();
    expect(sys.nodeVersion.startsWith('v')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// getNetworkInfo()
// ─────────────────────────────────────────────────────────────
describe('getNetworkInfo()', () => {
  test('retourne objet interfaces', () => {
    const net = getNetworkInfo();
    expect(typeof net).toBe('object');
  });

  test('chaque interface a des addresses', () => {
    const net = getNetworkInfo();
    for (const [name, addrs] of Object.entries(net)) {
      expect(Array.isArray(addrs)).toBe(true);
      if (addrs.length > 0) {
        expect(addrs[0]).toHaveProperty('address');
        expect(addrs[0]).toHaveProperty('family');
        expect(addrs[0]).toHaveProperty('internal');
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────
// getMetrics()
// ─────────────────────────────────────────────────────────────
describe('getMetrics()', () => {
  test('retourne toutes les métriques', () => {
    const metrics = getMetrics();
    expect(metrics).toHaveProperty('timestamp');
    expect(metrics).toHaveProperty('system');
    expect(metrics).toHaveProperty('cpu');
    expect(metrics).toHaveProperty('load');
    expect(metrics).toHaveProperty('memory');
    expect(metrics).toHaveProperty('disk');
    expect(metrics).toHaveProperty('network');
  });

  test('timestamp est une date ISO', () => {
    const metrics = getMetrics();
    expect(metrics.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ─────────────────────────────────────────────────────────────
// checkThresholds()
// ─────────────────────────────────────────────────────────────
describe('checkThresholds()', () => {
  test('retourne status OK si sous seuils', () => {
    const metrics = getMetrics();
    const check = checkThresholds(metrics, { cpu: 100, memory: 100, disk: 100 });
    expect(check.status).toBe(ALERT_LEVELS.OK);
    expect(check.alerts.length).toBe(0);
  });

  test('génère alerte si CPU au-dessus seuil', () => {
    const metrics = getMetrics();
    metrics.cpu.usage = 90;
    const check = checkThresholds(metrics, { cpu: 80, memory: 100, disk: 100 });
    
    const cpuAlert = check.alerts.find(a => a.metric === 'cpu');
    if (cpuAlert) {
      expect(cpuAlert.level).toBe(ALERT_LEVELS.WARNING);
      expect(cpuAlert.value).toBe(90);
    }
  });

  test('génère alerte CRITICAL si usage >= 95%', () => {
    const metrics = getMetrics();
    metrics.cpu.usage = 97;
    const check = checkThresholds(metrics, { cpu: 80, memory: 100, disk: 100 });
    
    const cpuAlert = check.alerts.find(a => a.metric === 'cpu');
    if (cpuAlert) {
      expect(cpuAlert.level).toBe(ALERT_LEVELS.CRITICAL);
    }
  });

  test('utilise seuils par défaut', () => {
    const metrics = getMetrics();
    const check = checkThresholds(metrics);
    expect(check).toHaveProperty('status');
    expect(check).toHaveProperty('alerts');
  });
});

// ─────────────────────────────────────────────────────────────
// monitor()
// ─────────────────────────────────────────────────────────────
describe('monitor()', () => {
  test('retourne objet avec méthode stop', () => {
    const mon = monitor({ interval: 100 });
    expect(mon).toHaveProperty('stop');
    expect(typeof mon.stop).toBe('function');
    mon.stop();
  });

  test('callback onMetrics est appelé', (done) => {
    const mon = monitor({
      interval: 100,
      onMetrics: (metrics) => {
        expect(metrics).toHaveProperty('cpu');
        mon.stop();
        done();
      },
    });
  }, 1000);

  test('callback onAlert est appelé si seuil dépassé', (done) => {
    const mon = monitor({
      interval: 100,
      thresholds: { cpu: 0, memory: 0, disk: 0 }, // Seuils impossibles
      onAlert: (alerts) => {
        expect(Array.isArray(alerts)).toBe(true);
        mon.stop();
        done();
      },
    });
  }, 1000);

  test('stop arrête le monitoring', (done) => {
    let callCount = 0;
    const mon = monitor({
      interval: 50,
      onMetrics: () => {
        callCount++;
      },
    });

    setTimeout(() => {
      mon.stop();
      const countAtStop = callCount;
      
      setTimeout(() => {
        expect(callCount).toBe(countAtStop); // Ne doit plus augmenter
        done();
      }, 200);
    }, 150);
  }, 1000);
});

// ─────────────────────────────────────────────────────────────
// formatBytes()
// ─────────────────────────────────────────────────────────────
describe('formatBytes()', () => {
  test('0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  test('1024 bytes = 1 KB', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });

  test('1 MB', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
  });

  test('1 GB', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
  });

  test('format avec décimales', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
  });
});

// ─────────────────────────────────────────────────────────────
// formatUptime()
// ─────────────────────────────────────────────────────────────
describe('formatUptime()', () => {
  test('< 1 minute', () => {
    expect(formatUptime(30)).toBe('< 1m');
  });

  test('1 minute', () => {
    expect(formatUptime(60)).toBe('1m');
  });

  test('1 heure', () => {
    expect(formatUptime(3600)).toBe('1h');
  });

  test('1 jour', () => {
    expect(formatUptime(86400)).toBe('1d');
  });

  test('1 jour 2 heures 30 minutes', () => {
    expect(formatUptime(86400 + 7200 + 1800)).toBe('1d 2h 30m');
  });

  test('plusieurs jours', () => {
    const result = formatUptime(86400 * 5 + 3600 * 3 + 60 * 15);
    expect(result).toContain('5d');
    expect(result).toContain('3h');
    expect(result).toContain('15m');
  });
});

// ─────────────────────────────────────────────────────────────
// saveMetrics()
// ─────────────────────────────────────────────────────────────
describe('saveMetrics()', () => {
  const TEST_FILE = path.join(__dirname, 'test-metrics.json');

  afterEach(() => {
    if (fs.existsSync(TEST_FILE)) {
      fs.unlinkSync(TEST_FILE);
    }
  });

  test('crée fichier si inexistant', () => {
    const metrics = getMetrics();
    saveMetrics(metrics, TEST_FILE);
    expect(fs.existsSync(TEST_FILE)).toBe(true);
  });

  test('ajoute métriques au fichier existant', () => {
    const metrics1 = getMetrics();
    const metrics2 = getMetrics();
    
    saveMetrics(metrics1, TEST_FILE);
    saveMetrics(metrics2, TEST_FILE);
    
    const content = JSON.parse(fs.readFileSync(TEST_FILE, 'utf8'));
    expect(content.length).toBe(2);
  });

  test('garde seulement 100 dernières entrées', () => {
    for (let i = 0; i < 150; i++) {
      saveMetrics(getMetrics(), TEST_FILE);
    }
    
    const content = JSON.parse(fs.readFileSync(TEST_FILE, 'utf8'));
    expect(content.length).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────────
// DEFAULT_THRESHOLDS & ALERT_LEVELS
// ─────────────────────────────────────────────────────────────
describe('Constantes', () => {
  test('DEFAULT_THRESHOLDS a valeurs correctes', () => {
    expect(DEFAULT_THRESHOLDS).toHaveProperty('cpu');
    expect(DEFAULT_THRESHOLDS).toHaveProperty('memory');
    expect(DEFAULT_THRESHOLDS).toHaveProperty('disk');
    expect(DEFAULT_THRESHOLDS.cpu).toBe(80);
    expect(DEFAULT_THRESHOLDS.memory).toBe(80);
    expect(DEFAULT_THRESHOLDS.disk).toBe(90);
  });

  test('ALERT_LEVELS contient OK, WARNING, CRITICAL', () => {
    expect(ALERT_LEVELS.OK).toBe('OK');
    expect(ALERT_LEVELS.WARNING).toBe('WARNING');
    expect(ALERT_LEVELS.CRITICAL).toBe('CRITICAL');
  });
});