const { app, Tray, Menu, nativeImage } = require("electron");
const { PATHS, APP_NAME, APP_VERSION } = require("../config");

class TrayManager {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.tray = null;
        this.init();
    }

    init() {
        const icon = nativeImage.createFromPath(PATHS.TRAY_ICON);
        this.tray = new Tray(icon);

        const contextMenu = Menu.buildFromTemplate([
            { label: `${APP_NAME} (v${APP_VERSION})`, enabled: false, icon: icon.resize({ width: 16, height: 16 }) },
            { type: "separator" },
            { label: "Show", click: () => this.mainWindow.show() },
            { type: "separator" },
            { label: "Quit", click: () => this.quitApp() },
        ]);

        this.tray.setContextMenu(contextMenu);
        this.tray.setToolTip(`${APP_NAME} (v${APP_VERSION})`);

        this.tray.on("click", () => this.mainWindow.show());
    }

    quitApp() {
        this.mainWindow.destroy();
        app.quit();
    }
}

module.exports = TrayManager;