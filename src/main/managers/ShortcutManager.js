const fs = require("fs");
const Shortcut = require("../models/Shortcut");
const { PATHS } = require("../config");

class ShortcutManager {
    constructor() {
        this.shortcuts = [];
        this.filePath = PATHS.SHORTCUTS_FILE;
        this.load();
    }

    load() {
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify([]));
            return;
        }

        try {
            const shortcuts = JSON.parse(fs.readFileSync(this.filePath));
            this.shortcuts = shortcuts
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                .map((s) => new Shortcut(s.name, s.key, s.action, s.position));

            this.shortcuts.forEach((s) => s.setup());
        } catch (error) {
            console.error("Error loading shortcuts:", error);
        }
    }

    save(shortcuts) {
        if (!shortcuts) {
            shortcuts = this.shortcuts.map((s) => s.toJSON());
        }
        fs.writeFileSync(this.filePath, JSON.stringify(shortcuts, null, 4));
    }

    add(shortcut) {
        if (this.shortcuts.find((s) => s.name === shortcut.name)) {
            throw new Error(`Shortcut with name "${shortcut.name}" already exists.`);
        }

        if (!shortcut.setup()) return false;

        this.shortcuts.push(shortcut);
        this.save();
        return true;
    }

    remove(shortcutName) {
        const shortcut = this.shortcuts.find((s) => s.name === shortcutName);
        if (!shortcut) throw new Error(`Shortcut with name "${shortcutName}" does not exist.`);

        shortcut.remove();
        this.shortcuts = this.shortcuts.filter((s) => s.name !== shortcutName);
        this.save();
        return true;
    }

    edit(shortcutName, editedShortcut) {
        const shortcut = this.shortcuts.find((s) => s.name === shortcutName);
        if (!shortcut) throw new Error(`Shortcut with name "${shortcutName}" does not exist.`);

        shortcut.edit(editedShortcut);
        this.save();
        return true;
    }

    getAll() {
        return this.shortcuts.map((s) => s.toJSON());
    }

    isNameAvailable(name) {
        return !this.shortcuts.find((s) => s.name === name);
    }
}

module.exports = ShortcutManager;