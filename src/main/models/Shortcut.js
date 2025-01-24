const { globalShortcut } = require("electron");
const { exec } = require("child_process");

class Shortcut {
    constructor(name, key, action, position) {
        this.name = name;
        this.key = key;
        this.action = action;
        this.position = position;
    }

    check() {
        try {
            globalShortcut.register(this.key, () => {});
            globalShortcut.unregister(this.key);
            return true;
        } catch (error) {
            console.error(`Error checking shortcut "${this.name}":`, error);
            return false;
        }
    }

    setup() {
        if (!this.check()) return false;

        globalShortcut.register(this.key, () => {
            console.log(`Shortcut triggered: ${this.name}`);
            exec(this.action, (error) => {
                if (error) console.error(`Error executing action for shortcut "${this.name}":`, error);
            });
        });

        return true;
    }

    remove() {
        globalShortcut.unregister(this.key);
    }

    edit(shortcut) {
        this.remove();
        this.name = shortcut.name;
        this.key = shortcut.key;
        this.action = shortcut.action;
        this.position = shortcut.position;
        this.setup();
    }

    toJSON() {
        return {
            name: this.name,
            key: this.key,
            action: this.action,
            position: this.position,
        };
    }
}

module.exports = Shortcut;