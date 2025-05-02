const fs = require('fs');
const path = require('path');

module.exports = class Session {
  constructor() {
    this.init();
  }

  // Initialize session backup directory
  init() {
    const backupDir = './session_backup';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
  }

  // Backup session credentials
  async backup(sessionInstance, sessionDir) {
    try {
      const userId = sessionInstance.user.id;
      const backupPath = path.join('./session_backup', sessionInstance.decodeJid(userId).replace(/@.+/, ''));
      const sourceCreds = path.join(sessionDir, 'creds.json');

      await Func.delay(1500);

      if (fs.existsSync(sourceCreds)) {
        if (!fs.existsSync(backupPath)) {
          fs.mkdirSync(backupPath);
        }
        const credsData = require(sourceCreds);
        fs.writeFileSync(path.join(backupPath, 'creds.json'), JSON.stringify(credsData));
        console.log('Session backup completed.');
      }
    } catch (error) {
      console.error('Error during session backup:', error);
    }
  }

  // Restore session credentials from backup
  async restore(sessionInstance, sessionDir) {
    try {
      const userId = sessionInstance.user.id;
      const backupPath = path.join('./session_backup', sessionInstance.decodeJid(userId).replace(/@.+/, ''), 'creds.json');
      const destCreds = path.join(sessionDir, 'creds.json');

      await Func.delay(1500);

      if (fs.existsSync(backupPath)) {
        const credsData = require(backupPath);
        fs.writeFileSync(destCreds, JSON.stringify(credsData));
        console.log('Session restoration completed.');
      } else {
        console.log('No backup found for restoration.');
      }
    } catch (error) {
      console.error('Error during session restoration:', error);
    }
  }

  // Check if a backup exists for the current session
  isBackupExist(sessionInstance) {
    try {
      const userId = sessionInstance.user.id;
      const backupPath = path.join('./session_backup', sessionInstance.decodeJid(userId).replace(/@.+/, ''), 'creds.json');
      return fs.existsSync(backupPath);
    } catch (error) {
      console.error('Error checking backup existence:', error);
      return false;
    }
  }
};
