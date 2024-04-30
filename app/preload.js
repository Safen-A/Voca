const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    handleClick: () => ipcRenderer.send('handle-click'),
    onCardAdded: (callback) => ipcRenderer.on('add-card', (event, ...args) => callback(...args)),
    openLanguageTraining: (cardData) => ipcRenderer.send('open-language-training', cardData),
    onReceiveWordPair: (callback) => ipcRenderer.on('receive-word-pair', (event, ...args) => callback(...args)),
    onReceiveWordPairs: (callback) => ipcRenderer.on('receive-word-pairs', (event, ...args) => callback(...args)),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    getAppData: () => ipcRenderer.invoke('get-app-data'),
    setDarkMode: (value) => ipcRenderer.send('set-dark-mode', value),
    onSetDarkMode: (callback) => ipcRenderer.on('set-dark-mode', (event, ...args) => callback(...args)),
    sendResults: (results) => ipcRenderer.invoke('send-results', results),
});
