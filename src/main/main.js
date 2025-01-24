const { app, BrowserWindow, ipcMain } = require("electron");
const config = require("./config");
const ShortcutManager = require("./managers/ShortcutManager");
const TrayManager = require("./managers/TrayManager");

let mainWindow;
let trayManager;
let shortcutManager;

app.on("ready", () => {
    mainWindow = new BrowserWindow(config.WINDOW_CONFIG);
    mainWindow.loadFile(config.PATHS.INDEX_HTML);

    trayManager = new TrayManager(mainWindow);
    shortcutManager = new ShortcutManager();

    setupIPC();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

function setupIPC() {
    ipcMain.handle("get-shortcuts", () => shortcutManager.getAll());
    ipcMain.handle("add-shortcut", (event, name, key, action, position) =>
        shortcutManager.add(new Shortcut(name, key, action, position))
    );
    ipcMain.handle("remove-shortcut", (event, name) => shortcutManager.remove(name));
    ipcMain.handle("edit-shortcut", (event, name, editedShortcut) =>
        shortcutManager.edit(name, new Shortcut(editedShortcut.name, editedShortcut.key, editedShortcut.action, editedShortcut.position))
    );
    ipcMain.handle("is-shortcut-name-available", (event, name) => shortcutManager.isNameAvailable(name));
    ipcMain.handle("minimize", () => BrowserWindow.getFocusedWindow().minimize());
    ipcMain.handle("maximize", () => BrowserWindow.getFocusedWindow().isMaximized() ? BrowserWindow.getFocusedWindow().unmaximize() : BrowserWindow.getFocusedWindow().maximize());
    ipcMain.handle("quit", () => mainWindow.hide());
}