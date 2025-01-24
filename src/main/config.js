const path = require("path");
const { app } = require("electron");

module.exports = {
    APP_NAME: "Ascendry",
    APP_VERSION: require("../../package.json").version,
    PATHS: {
        ICON: path.join(app.getAppPath(), "assets", "icon.ico"),
        TRAY_ICON: path.join(app.getAppPath(), "assets", "icon.ico"),
        PRELOAD: path.join(app.getAppPath(), "src", "preload.js"),
        INDEX_HTML: path.join(app.getAppPath(), "src", "renderer", "index.html"),
        SHORTCUTS_FILE: path.join(app.getPath("userData"), "shortcuts.json"),
    },
    WINDOW_CONFIG: {
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        frame: false,
        resizable: true,
        maximizable: true,
        fullscreenable: false,
        icon: path.join(app.getAppPath(), "assets", "icon.ico"),
        webPreferences: {
            preload: path.join(app.getAppPath(), "src", "preload.js"),
        },
    },
};