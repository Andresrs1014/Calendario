const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openMoodleLogin: () => ipcRenderer.invoke('open-moodle-login'),
  sendNotification: (title, body) => ipcRenderer.send('send-notification', { title, body }),
  windowControls: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized')
  }
});

ipcRenderer.on('window-maximized', (event, isMaximized) => {
  window.dispatchEvent(new CustomEvent('window-maximized-change', { detail: isMaximized }));
});
