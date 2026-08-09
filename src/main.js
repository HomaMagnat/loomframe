const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');

let win;

app.on('ready', () => {
    win = new BrowserWindow({
        height: 600,
        width: 1000,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    });
    win.setMenuBarVisibility(false);
    win.setTitle('Loomframe');
    win.loadFile(path.join(__dirname, 'app/index.html'));
    win.maximize();
});

app.on('window-all-closed', () => app.quit());

ipcMain.handle('getudpath', () => {
    return app.getPath('userData');
});

ipcMain.handle('quit', () => {
    app.quit();
});