const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openMoodleLogin: () => ipcRenderer.invoke('open-moodle-login'),
  sendNotification: (title, body) => ipcRenderer.send('send-notification', { title, body })
});
