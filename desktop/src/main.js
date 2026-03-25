const { app, BrowserWindow, session, ipcMain, Notification, net } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // En desarrollo, apunta al dev server de Vite
  win.loadURL('http://localhost:5173');
}

// IPC handler for automated Moodle login
ipcMain.handle('open-moodle-login', async () => {
  const loginWin = new BrowserWindow({
    width: 600,
    height: 700,
    title: 'Iniciar Sesión en Moodle',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const MOODLE_URL = 'https://campusvirtual.ibero.edu.co/login/index.php';
  
  // Clear session to ensure fresh login
  await session.defaultSession.clearStorageData({ storages: ['cookies', 'localstorage'] });
  
  await loginWin.loadURL(MOODLE_URL);

  return new Promise((resolve) => {
    const checkSession = async () => {
      if (loginWin.isDestroyed()) {
        resolve(null);
        return;
      }

      const url = loginWin.webContents.getURL();
      
      // Don't capture if we are still on the login page
      if (url.includes('login/index.php')) {
        setTimeout(checkSession, 1000);
        return;
      }

      // 1. Better Cookie Detection
      const allCookies = await session.defaultSession.cookies.get({});
      const moodleCookie = allCookies.find(c => c.name.includes('MoodleSession'));
      
      if (moodleCookie) {
        const sessionCookie = moodleCookie.value;
        
        // 2. Multistrategy Sesskey Extraction
        const sesskey = await loginWin.webContents.executeJavaScript(`
          (() => {
            // Strategy A: Global Moodle object
            if (typeof M !== 'undefined' && M.cfg && M.cfg.sesskey) return M.cfg.sesskey;
            
            // Strategy B: Regex in innerHTML
            const match = document.body.innerHTML.match(/"sesskey"\\s*:\\s*"([^"]+)"/);
            if (match) return match[1];

            // Strategy C: Log out links
            const logoutLink = document.querySelector('a[href*="login/logout.php?sesskey="]');
            if (logoutLink) {
              const m = logoutLink.href.match(/sesskey=([^&]+)/);
              if (m) return m[1];
            }

            return null;
          })()
        `);

        if (sesskey) {
          console.log('✓ Sesión capturada con éxito en:', url);
          loginWin.close();
          resolve({ session_cookie: sessionCookie, sesskey: sesskey });
          return;
        }
      }
      
      // Check again in 1s
      setTimeout(checkSession, 1000);
    };

    checkSession();
  });
});

// IPC listener for notifications
ipcMain.on('send-notification', (event, { title, body }) => {
  new Notification({ title, body }).show();
});

// Background Polling for Reminders
async function checkReminders() {
  try {
    const request = net.request('http://localhost:8000/reminders');
    request.on('response', (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk.toString(); });
      response.on('end', () => {
        if (response.statusCode === 200) {
          try {
            const reminders = JSON.parse(body);
            const now = new Date();
            reminders.forEach(r => {
              const remindAt = new Date(r.remind_at);
              if (remindAt <= now && !r.is_triggered) {
                new Notification({ 
                  title: '🔔 Recordatorio Académico', 
                  body: r.title 
                }).show();
                
                // Mark as triggered in DB
                const patch = net.request({
                  method: 'PATCH',
                  url: `http://localhost:8000/reminders/${r.id}?is_triggered=true`
                });
                patch.end();
              }
            });
          } catch (e) {}
        }
      });
    });
    request.end();
  } catch (err) {}
}

app.whenReady().then(() => {
  createWindow();
  setInterval(checkReminders, 60000); // Check every minute
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
