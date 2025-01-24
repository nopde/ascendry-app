import { getShortcuts, getLastShortcutPosition } from "./shortcuts.js";
import { showNotification } from "./notifications.js";

class ShortcutKeyBinder {
    constructor(input) {
        this.input = input;
        this.pressedKeys = new Set();
        this.currentShortcut = null;
        this.boundKeyHandler = this.handleKeyRecording.bind(this);
    }

    handleKeyRecording(event) {
        event.preventDefault();
        event.stopPropagation();

        const key = this.normalizeKey(event.key);
        if (!key) return;

        this.pressedKeys.add(key);
        this.updateInputDisplay();
    }

    updateInputDisplay() {
        const formattedKeys = Array.from(this.pressedKeys)
            .map(k => this.formatKeyName(k))
            .join(" + ");

        this.input.setValue(formattedKeys);
    }

    normalizeKey(key) {
        const keyMap = {
            " ": "space",
            "arrowup": "up",
            "arrowdown": "down",
            "arrowleft": "left",
            "arrowright": "right",
            "os": "meta",
            "contextmenu": "menu",
            "control": "ctrl",
            "altgraph": "alt"
        };

        let normalized = key.toLowerCase()
            .replace(/key|digit|numpad|arrow| /g, "")
            .replace(/left|right/g, "");

        return keyMap[normalized] || normalized;
    }

    formatKeyName(key) {
        const isMac = navigator.platform.toUpperCase().includes("MAC");
        const formattedKeys = {
            "ctrl": "Ctrl",
            "control": "Ctrl",
            "alt": "Alt",
            "shift": "Shift",
            "meta": isMac ? '⌘' : 'Win',
            "cmd": "⌘",
            "command": "⌘",
            "escape": "Esc",
            " ": "Space"
        };

        return formattedKeys[key] || key.toUpperCase();
    }

    startHotkeyRecording() {
        this.pressedKeys.clear();
        this.input.setValue("");
        this.input.inputElement.disabled = true;
        window.addEventListener("keydown", this.boundKeyHandler);
    }

    stopHotkeyRecording() {
        window.removeEventListener("keydown", this.boundKeyHandler);
        this.currentShortcut = Array.from(this.pressedKeys).join("+");
        this.input.inputElement.disabled = false;

        this.updateInputDisplay();
        this.pressedKeys.clear();
    }

    validateHotkey(shortcut) {
        const MODIFIERS = new Set(["ctrl", "alt", "shift", "meta"]);
        const ALLOWED_KEYS = new Set([
            "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
            "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
            "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
            "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12",
            "tab", "space", "backspace", "delete", "enter", "esc", "escape",
            "up", "down", "left", "right", "insert", "home", "end", "pageup", "pagedown"
        ]);

        const keys = shortcut.toLowerCase().split("+");
        const uniqueKeys = [...new Set(keys)];

        const modifiers = uniqueKeys.filter(k => MODIFIERS.has(k));
        const regularKeys = uniqueKeys.filter(k => !MODIFIERS.has(k));

        return modifiers.length >= 1 &&
            regularKeys.length >= 1 &&
            regularKeys.every(k => ALLOWED_KEYS.has(k));
    }
}

class Modal extends HTMLElement {
    constructor(name, content, onlyConfirm = false) {
        super();

        this.name = name;
        this.content = content;
        this.showCancel = typeof onlyConfirm === "boolean" ? !onlyConfirm : true;

        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    user-select: none;
                    font-family: "Open Sans", sans-serif;
                    -webkit-font-smoothing: antialiased;
                }

                :host {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, .8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                    opacity: 0;
                    outline: none;
                }

                .modal {
                    background-color: rgb(20, 20, 20);
                    border-radius: 25px;
                    padding: 20px;
                    min-width: 300px;
                    max-width: 400px;
                    display: flex;
                    flex-direction: column;
                    scale: .9;
                }

                .modal-title {
                    display: flex;
                    align-items: center;
                    justify-content: left;
                    gap: 20px;
                    padding-inline: 10px;
                }

                .modal-title p {
                    width: max-content;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    word-break: keep-all;
                    white-space: nowrap;
                    font-size: 21px;
                    font-weight: 500;
                }

                .modal-content {
                    flex: 1 1;
                    padding: 10px;
                    padding-top: 20px;
                    font-size: 16px;
                    font-weight: normal;
                    max-width: calc(400px - 20px);
                    max-height: 400px;
                    overflow-x: hidden;
                    overflow-y: auto;
                }

                .modal-buttons {
                    display: inline-flex;
                    gap: 10px;
                    padding-top: 10px;
                    justify-content: flex-end;
                }

                ::-webkit-scrollbar {
                    width: 10px;
                }

                ::-webkit-scrollbar-track {
                    background-color: transparent;
                }

                ::-webkit-scrollbar-thumb {
                    background-color: rgba(var(--secondary-color), .75);
                    border-radius: 10px;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(var(--secondary-color), 1);
                }
            </style>

            <div class="modal">
                <div class="modal-title">
                    ${this.name ? `<p>${this.name}</p>` : ""}
                </div>
                <div class="modal-content"></div>
                <div class="modal-buttons">
                    ${this.showCancel ? `<reimagined-button id="cancel">Cancel</reimagined-button>` : ""}
                    <reimagined-button id="confirm" filled>Confirm</reimagined-button>
                </div>
            </div>
        `;

        document.body.appendChild(this);

        this.modalContent = this.shadowRoot.querySelector(".modal-content");
        this.modalContent.attachShadow({ mode: "open" });
        this.modalContent.shadowRoot.innerHTML += `
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: "Open Sans", sans-serif;
                    user-select: none;
                    -webkit-font-smoothing: antialiased;
                }

                :host {
                    display: flex;
                    gap: 10px;
                }
            </style>
        `;
        this.modalContent.shadowRoot.innerHTML += this.content;

        const fadeIn = [{ opacity: 0 }, { opacity: 1 }];
        const modalGrow = [{ scale: 0 }, { scale: 1 }];
        this.animate(fadeIn, { duration: 150, easing: "cubic-bezier(.175, .885, .32, 1.275)", fill: "forwards" });
        this.shadowRoot.querySelector(".modal").animate(modalGrow, { duration: 250, easing: "cubic-bezier(.175, .885, .32, 1.275)", fill: "forwards" });

        this.setupEventListeners();
        this.setupFocusTrapping();
    }

    setupEventListeners() {
        this.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                this.closeModal();
            }
        });

        const cancelButton = this.shadowRoot.querySelector("#cancel");
        const confirmButton = this.shadowRoot.querySelector("#confirm");

        if (cancelButton) {
            cancelButton.addEventListener("click", () => {
                this.dispatchEvent(new CustomEvent("cancel-button-click"));
                this.closeModal();
            });
        }

        confirmButton.addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("confirm-button-click"));
        });

        this.addEventListener("confirm-button-return", (event) => {
            if (event.detail.result) {
                this.closeModal();
            }
        });
    }

    setupFocusTrapping() {
        const elements = Array.from(document.body.querySelectorAll("*")).map(el => ({ element: el, tabindex: el.getAttribute("tabindex") }));
        const focusableElements = elements.filter(el => el.offsetParent !== null);

        if (focusableElements.length === 0) return;
        focusableElements[0].element.focus();

        elements.forEach(el => {
            if (el.element === this) {
                return;
            }

            el.element.setAttribute("tabindex", "-1");
        });

        this.addEventListener("ready-to-close", () => {
            elements.forEach(el => {
                if (!el.tabindex) {
                    el.element.removeAttribute("tabindex");
                    return;
                }

                el.element.setAttribute("tabindex", el.tabindex);
            });
        });
    }

    closeModal() {
        const animation = this.animate([{ opacity: 0 }], { duration: 100, easing: "cubic-bezier(.175, .885, .32, 1.275)", fill: "forwards" });

        animation.onfinish = () => {
            this.remove();
            this.dispatchEvent(new CustomEvent("ready-to-close"));
        };
    }
}

class AddShortcutModal extends Modal {
    constructor() {
        super("Add shortcut", `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .error-message {
                    color: red;
                    font-size: 12px;
                    padding: 5px 10px;
                    background-color: rgb(255, 0, 0, .15);
                    border: 1px solid rgba(255, 0, 0, .1);
                    border-radius: 10px;
                    min-height: 0;
                    height: 0;
                    opacity: 0;
                    margin-top: -22px;
                    box-sizing: border-box;
                    overflow: hidden;
                    pointer-events: none;
                    transition: all .15s cubic-bezier(0.25, 1, 0.5, 1);
                }

                .error-message.visible {                    
                    height: 30px;
                    opacity: 1;
                    margin-top: 0;
                }

                .hotkey-input-container {
                    display: flex;
                    gap: 5px;
                }

                .hotkey-input-container reimagined-button {
                    position: relative;
                    min-width: 41px;
                    min-height: 41px;
                    width: 41px;
                    height: 41px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .hotkey-input-container reimagined-button::before {
                    content: "";
                    position: absolute;
                    width: 15px;
                    height: 15px;
                    border-radius: 50%;
                    background-color: rgba(255, 0, 0, .75);;
                    pointer-events: none;
                    transition: all .25s cubic-bezier(0.25, 1, 0.5, 1);
                }

                .hotkey-input-container reimagined-button:hover::before {
                    scale: 1.1;
                }

                .hotkey-input-container reimagined-button.recording::before {
                    border-radius: 2px;
                    background-color: rgba(255, 255, 255, .75);
                }
            </style>

            <reimagined-text-input id="shortcut-name" placeholder="notepad-shortcut"></reimagined-text-input>
            <div class="error-message" id="name-not-available">This name is not available.</div>
            <div class="error-message" id="name-empty">This name is empty.</div>
            <div class="hotkey-input-container">
                <reimagined-text-input id="shortcut-hotkey" placeholder="Record a new hotkey" spellcheck="false" autocomplete="off" required></reimagined-text-input>
                <reimagined-button id="record-button"></reimagined-button>
            </div>
            <div class="error-message" id="hotkey-error">You have to define a hotkey.</div>
            <reimagined-text-input id="shortcut-action" placeholder="start notepad"></reimagined-text-input>
        `);

        const modalContentShadowRoot = this.modalContent.shadowRoot;

        const shortcutNameInput = modalContentShadowRoot.querySelector("#shortcut-name");
        const hotkeyInput = modalContentShadowRoot.querySelector("#shortcut-hotkey");
        const recordButton = modalContentShadowRoot.querySelector("#record-button");
        const shortcutActionInput = modalContentShadowRoot.querySelector("#shortcut-action");
        const nameNotAvailable = modalContentShadowRoot.querySelector("#name-not-available");
        const nameEmpty = modalContentShadowRoot.querySelector("#name-empty");
        const hotkeyError = modalContentShadowRoot.querySelector("#hotkey-error");

        const shortcutKeyBinder = new ShortcutKeyBinder(hotkeyInput);

        let recording = false;
        recordButton.addEventListener("click", () => {
            recording = !recording;
            if (recording) {
                recordButton.classList.add("recording");
                shortcutKeyBinder.startHotkeyRecording();
            } else {
                recordButton.classList.remove("recording");
                shortcutKeyBinder.stopHotkeyRecording();
            }
        });

        this.addEventListener("confirm-button-click", async () => {
            let validShortcut = true;
            const name = shortcutNameInput.getValue();
            const hotkey = shortcutKeyBinder.normalizeKey(hotkeyInput.getValue());
            const action = shortcutActionInput.getValue();

            if (name === "") {
                validShortcut = false;
                nameEmpty.classList.add("visible");
            } else {
                const isNameAvailable = await window.electronAPI.isShortcutNameAvailable(name);
                if (!isNameAvailable) {
                    validShortcut = false;
                    nameNotAvailable.classList.add("visible");
                }
            }

            if (hotkey === "" || !shortcutKeyBinder.validateHotkey(hotkey)) {
                validShortcut = false;
                hotkeyError.classList.add("visible");
            }

            if (!validShortcut) return;

            const position = getLastShortcutPosition() + 1;
            const result = window.electronAPI.addShortcut(name, hotkey, action, position);

            if (result) {
                showNotification(`Shortcut <strong>${name}</strong> added`);
            } else {
                showNotification(`Couldn't add shortcut <strong>${name}</strong>`);
            }

            this.addEventListener("ready-to-close", () => {
                getShortcuts();
            });

            this.dispatchEvent(new CustomEvent("confirm-button-return", { detail: { result: true } }));
        });
    }
}

class EditShortcutModal extends Modal {
    constructor(shortcut) {
        super("Edit shortcut", `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .error-message {
                    color: red;
                    font-size: 12px;
                    padding: 5px 10px;
                    background-color: rgb(255, 0, 0, .15);
                    border: 1px solid rgba(255, 0, 0, .1);
                    border-radius: 10px;
                    min-height: 0;
                    height: 0;
                    opacity: 0;
                    margin-top: -22px;
                    box-sizing: border-box;
                    overflow: hidden;
                    pointer-events: none;
                    transition: all .15s cubic-bezier(0.25, 1, 0.5, 1);
                }

                .error-message.visible {                    
                    height: auto;
                    opacity: 1;
                    margin-top: 0;
                }

                .hotkey-input-container {
                    display: flex;
                    gap: 5px;
                }

                .hotkey-input-container reimagined-button {
                    position: relative;
                    min-width: 41px;
                    min-height: 41px;
                    width: 41px;
                    height: 41px;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .hotkey-input-container reimagined-button::before {
                    content: "";
                    position: absolute;
                    width: 15px;
                    height: 15px;
                    border-radius: 50%;
                    background-color: rgba(255, 0, 0, .75);;
                    pointer-events: none;
                    transition: all .25s cubic-bezier(0.25, 1, 0.5, 1);
                }

                .hotkey-input-container reimagined-button:hover::before {
                    scale: 1.1;
                }

                .hotkey-input-container reimagined-button.recording::before {
                    border-radius: 2px;
                    background-color: rgba(255, 255, 255, .75);
                }
            </style>

            <reimagined-text-input id="shortcut-name" placeholder="notepad-shortcut"></reimagined-text-input>
            <div class="error-message" id="name-not-available">This name is not available.</div>
            <div class="error-message" id="name-empty">This name is empty.</div>
            <div class="hotkey-input-container">
                <reimagined-text-input id="shortcut-hotkey" placeholder="Record a new hotkey" spellcheck="false" autocomplete="off" ${shortcut ? `value=${shortcut.key}` : ""} required></reimagined-text-input>
                <reimagined-button id="record-button"></reimagined-button>
            </div>
            <div class="error-message" id="hotkey-error">You have to define a hotkey.</div>
            <reimagined-text-input id="shortcut-action" placeholder="start notepad"></reimagined-text-input>
        `);

        const modalContentShadowRoot = this.modalContent.shadowRoot;

        const shortcutNameInput = modalContentShadowRoot.querySelector("#shortcut-name");
        const hotkeyInput = modalContentShadowRoot.querySelector("#shortcut-hotkey");
        const recordButton = modalContentShadowRoot.querySelector("#record-button");
        const shortcutActionInput = modalContentShadowRoot.querySelector("#shortcut-action");
        const nameNotAvailable = modalContentShadowRoot.querySelector("#name-not-available");
        const nameEmpty = modalContentShadowRoot.querySelector("#name-empty");
        const hotkeyError = modalContentShadowRoot.querySelector("#hotkey-error");

        shortcutNameInput.setValue(shortcut.name);
        hotkeyInput.setValue(shortcut.key);
        shortcutActionInput.setValue(shortcut.action);

        const shortcutKeyBinder = new ShortcutKeyBinder(hotkeyInput);

        let recording = false;
        recordButton.addEventListener("click", () => {
            recording = !recording;
            if (recording) {
                recordButton.classList.add("recording");
                shortcutKeyBinder.startHotkeyRecording();
            } else {
                recordButton.classList.remove("recording");
                shortcutKeyBinder.stopHotkeyRecording();
            }
        });

        this.addEventListener("confirm-button-click", async () => {
            let validShortcut = true;
            const name = shortcutNameInput.getValue();
            const hotkey = shortcutKeyBinder.normalizeKey(hotkeyInput.getValue());
            const action = shortcutActionInput.getValue();

            if (name === "") {
                validShortcut = false;
                nameEmpty.classList.add("visible");
            } else if (name !== shortcut.name) {
                const isNameAvailable = await window.electronAPI.isShortcutNameAvailable(name);
                if (!isNameAvailable) {
                    validShortcut = false;
                    nameNotAvailable.classList.add("visible");
                }
            }

            if (hotkey === "" || !shortcutKeyBinder.validateHotkey(hotkey)) {
                validShortcut = false;
                hotkeyError.classList.add("visible");
            }

            if (!validShortcut) return;

            const isEdited = name !== shortcut.name || hotkey !== shortcut.key || action !== shortcut.action;

            if (isEdited) {
                const result = window.electronAPI.editShortcut(shortcut.name, { name, key: hotkey, action, position: shortcut.position });

                if (result) {
                    showNotification(`Shortcut <strong>${shortcut.name}</strong> edited`);
                } else {
                    showNotification(`Couldn't edit shortcut <strong>${shortcut.name}</strong>`);
                }
            }

            this.addEventListener("ready-to-close", () => {
                getShortcuts();
            });

            this.dispatchEvent(new CustomEvent("confirm-button-return", { detail: { result: true } }));
        });
    }
}

class RemoveShortcutModal extends Modal {
    constructor(shortcut) {
        super("Remove shortcut", `
            <style>
                p {
                    font-size: 14px;
                    color: rgba(var(--tertiary-color), .75);
                }
            </style>    

            <p>This action cannot be undone.</p>
        `);

        this.addEventListener("confirm-button-click", event => {
            const result = window.electronAPI.removeShortcut(shortcut.name);

            if (result) {
                showNotification(`Shortcut <strong>${shortcut.name}</strong> removed`);
            }
            else {
                showNotification(`Couldn't remove shortcut <strong>${shortcut.name}</strong>`);
            }

            this.closeModal();
            this.addEventListener("ready-to-close", () => {
                getShortcuts();
            });
        });
    }
}

window.customElements.define("reimagined-modal", Modal);
window.customElements.define("reimagined-add-shortcut-modal", AddShortcutModal);
window.customElements.define("reimagined-edit-shortcut-modal", EditShortcutModal);
window.customElements.define("reimagined-remove-shortcut-modal", RemoveShortcutModal);

export { Modal, AddShortcutModal, EditShortcutModal, RemoveShortcutModal };