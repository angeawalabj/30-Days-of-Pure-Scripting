'use strict';

const { CronParser, JobScheduler, BackupManager } = require('./index');

describe('CronParser', () => {
  test('parse expression cron', () => {
    const cron = CronParser.parse('0 2 * * *');
    
    expect(cron.minute).toBe('0');
    expect(cron.hour).toBe('2');
    expect(cron.day).toBe('*');
  });

  test('matches vérifie wildcard', () => {
    expect(CronParser.matches('* * * * *', new Date())).toBe(true);
  });

  test('getNextRun calcule prochaine exécution', () => {
    const next = CronParser.getNextRun('0 2 * * *');
    expect(next).toBeInstanceOf(Date);
  });
});

describe('JobScheduler', () => {
  test('schedule ajoute job', () => {
    const scheduler = new JobScheduler();
    scheduler.schedule('test', '* * * * *', () => {});
    
    expect(scheduler.list().length).toBe(1);
  });

  test('toggle active/désactive job', () => {
    const scheduler = new JobScheduler();
    scheduler.schedule('test', '* * * * *', () => {});
    scheduler.toggle('test', false);
    
    expect(scheduler.get('test').enabled).toBe(false);
  });
});

describe('BackupManager', () => {
  test('formatBytes fonctionne', () => {
    const manager = new BackupManager({ sourcePath: './test' });
    
    expect(manager.formatBytes(0)).toBe('0 B');
    expect(manager.formatBytes(1024)).toBe('1 KB');
  });
});