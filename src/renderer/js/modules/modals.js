import { getShortcuts, getLastShortcutPosition } from "./shortcuts.js";
import { showNotification } from "./notifications.js";

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
                    padding-top: 0;
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
                    padding-top: 20px;
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
            if (event.result) {
                this.closeModal();
            }
        });
    }

    setupFocusTrapping() {
        const focusableElements = this.getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        this.addEventListener("keydown", (event) => {
            if (event.key === "Tab") {
                const focusableElements = this.getFocusableElements();
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (event.shiftKey && document.activeElement === firstElement) {
                    lastElement.focus();
                    event.preventDefault();
                } else if (!event.shiftKey && document.activeElement === lastElement) {
                    firstElement.focus();
                    event.preventDefault();
                }
            }
        });
    }

    getFocusableElements() {
        const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        return Array.from(this.shadowRoot.querySelectorAll(focusableSelectors)).filter(
            (el) => !el.disabled && el.offsetParent !== null
        );
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

                .hotkey-input {
                    display: flex;
                    gap: 10px;
                }

                #hotkey-display {
                    position: relative;
                    width: 100%;
                    height: 45px;
                    display: flex;
                    align-items: end;
                    justify-content: center;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    word-break: keep-all;
                    white-space: nowrap;
                    font-size: 12px;
                    color: rgba(255, 255, 255, .75);
                    background-color: rgb(255, 255, 255, .15);
                    border: 1px solid rgba(255, 255, 255, .1);
                    border-radius: 5px;
                    padding: 5px 10px;
                }

                #hotkey-display::before {
                    content: "Hotkey";
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    right: 2px;
                    height: max-content;
                    font-size: 10px;
                    color: rgba(255, 255, 255, .75);
                    background-color: rgb(255, 255, 255, .15);
                    border: 1px solid rgba(255, 255, 255, .1);
                    border-radius: 3px;
                    text-align: center;
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
                    margin-bottom: -20px;
                    overflow: hidden;
                    pointer-events: none;
                    transition: all .15s cubic-bezier(0.25, 1, 0.5, 1);
                }

                .error-message.visible {                    
                    height: auto;
                    opacity: 1;
                    margin-bottom: 0;
                }
            </style>

            <reimagined-text-input id="shortcut-name" placeholder="notepad-shortcut"></reimagined-text-input>
            <div class="error-message" id="name-not-available">This name is not available.</div>
            <div class="error-message" id="name-empty">This name is empty.</div>
            <div class="hotkey-input">
                <p class="hotkey-display" id="hotkey-display">No hotkey</p>
                <reimagined-button id="hotkey-bind">Change</reimagined-button>
            </div>
            <div class="error-message" id="hotkey-error">You have to define a hotkey.</div>
            <reimagined-text-input id="shortcut-action" placeholder="start notepad"></reimagined-text-input>
        `);

        const modalContentShadowRoot = this.modalContent.shadowRoot;

        const shortcutNameInput = modalContentShadowRoot.querySelector("#shortcut-name");
        const hotkeyDisplay = modalContentShadowRoot.querySelector("#hotkey-display");
        const bindHotkeyButton = modalContentShadowRoot.querySelector("#hotkey-bind");
        const shortcutActionInput = modalContentShadowRoot.querySelector("#shortcut-action");
        const nameNotAvailable = modalContentShadowRoot.querySelector("#name-not-available");
        const nameEmpty = modalContentShadowRoot.querySelector("#name-empty");
        const hotkeyError = modalContentShadowRoot.querySelector("#hotkey-error");

        bindHotkeyButton.addEventListener("click", async () => {
            try {
                const hotkey = new SetHotkeyModal();
                hotkeyDisplay.innerText = hotkey;
            }
            catch (error) {
                console.log(error);
            }
        });

        this.addEventListener("confirm-button-click", async () => {
            let validShortcut = true;
            const name = shortcutNameInput.getValue();
            const hotkey = hotkeyDisplay.innerText;
            const action = shortcutActionInput.getValue();
            const position = getLastShortcutPosition() + 1;

            const isNameAvailable = await window.electronAPI.isShortcutNameAvailable(name);
            if (name === "") {
                validShortcut = false;
                nameEmpty.classList.add("visible");
            }
            if (!isNameAvailable) {
                validShortcut = false;
                nameNotAvailable.classList.add("visible");
            }
            if (hotkey === "No hotkey") {
                validShortcut = false;
                hotkeyError.classList.add("visible");
            }

            if (!validShortcut) return;
            const result = window.electronAPI.addShortcut(name, hotkey, action, position);

            if (result) {
                showNotification(`Shortcut <strong>${name}</strong> added`);
            }
            else {
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

                .hotkey-input {
                    display: flex;
                    gap: 10px;
                }

                #hotkey-display {
                    position: relative;
                    width: 100%;
                    height: 45px;
                    display: flex;
                    align-items: end;
                    justify-content: center;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    word-break: keep-all;
                    white-space: nowrap;
                    font-size: 12px;
                    color: rgba(255, 255, 255, .75);
                    background-color: rgb(255, 255, 255, .15);
                    border: 1px solid rgba(255, 255, 255, .1);
                    border-radius: 5px;
                    padding: 5px 10px;
                }

                #hotkey-display::before {
                    content: "Hotkey";
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    right: 2px;
                    height: max-content;
                    font-size: 10px;
                    color: rgba(255, 255, 255, .75);
                    background-color: rgb(255, 255, 255, .15);
                    border: 1px solid rgba(255, 255, 255, .1);
                    border-radius: 3px;
                    text-align: center;
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
                    margin-bottom: -20px;
                    overflow: hidden;
                    pointer-events: none;
                    transition: all .15s cubic-bezier(0.25, 1, 0.5, 1);
                }

                .error-message.visible {
                    height: auto;
                    opacity: 1;
                    margin-bottom: 0;
                }
            </style>

            <reimagined-text-input id="shortcut-name" placeholder="notepad-shortcut"></reimagined-text-input>
            <div class="error-message" id="name-not-available">This name is not available.</div>
            <div class="error-message" id="name-empty">This name is empty.</div>
            <div class="hotkey-input">
                <p class="hotkey-display" id="hotkey-display"></p>
                <reimagined-button id="hotkey-bind">Change</reimagined-button>
            </div>
            <div class="error-message" id="hotkey-error">You have to define a hotkey.</div>
            <reimagined-text-input id="shortcut-action" placeholder="start notepad"></reimagined-text-input>
        `);

        const modalContentShadowRoot = this.modalContent.shadowRoot;

        const shortcutNameInput = modalContentShadowRoot.querySelector("#shortcut-name");
        const hotkeyDisplay = modalContentShadowRoot.querySelector("#hotkey-display");
        const bindHotkeyButton = modalContentShadowRoot.querySelector("#hotkey-bind");
        const shortcutActionInput = modalContentShadowRoot.querySelector("#shortcut-action");
        const nameNotAvailable = modalContentShadowRoot.querySelector("#name-not-available");
        const nameEmpty = modalContentShadowRoot.querySelector("#name-empty");
        const hotkeyError = modalContentShadowRoot.querySelector("#hotkey-error");

        shortcutNameInput.setValue(shortcut.name);
        shortcutActionInput.setValue(shortcut.action);
        hotkeyDisplay.innerText = shortcut.key;

        bindHotkeyButton.addEventListener("click", async () => {
            try {
                const hotkey = new SetHotkeyModal(shortcut);
                hotkeyDisplay.innerText = hotkey;
            }
            catch (error) {
                console.log(error);
            }
        });

        this.addEventListener("confirm-button-click", async () => {
            let validShortcut = true;
            const name = shortcutNameInput.getValue();
            const hotkey = hotkeyDisplay.innerText;
            const action = shortcutActionInput.getValue();

            const isNameAvailable = await window.electronAPI.isShortcutNameAvailable(name);
            if (name === "") {
                validShortcut = false;
                nameEmpty.classList.add("visible");
            }
            if (!isNameAvailable && name !== shortcut.name) {
                validShortcut = false;
                nameNotAvailable.classList.add("visible");
            }
            if (hotkey === "No hotkey") {
                validShortcut = false;
                hotkeyError.classList.add("visible");
            }

            if (!validShortcut) return;
            const isEdited = name !== shortcut.name || hotkey !== shortcut.key || action !== shortcut.action;

            if (isEdited) {
                const result = window.electronAPI.editShortcut(shortcut.name, { name, key: hotkey, action: action, position: shortcut.position });

                if (result) {
                    showNotification(`Shortcut <strong>${shortcut.name}</strong> edited`);
                }
                else {
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

class SetHotkeyModal extends Modal {
    constructor(shortcut) {
        super("Set hotkey", `
            <style>
                :host {
                    flex-direction: column;
                }

                .hotkey-input-container {
                    display: flex;
                    gap: 10px;
                }

                .hotkey-input-container .modal-button {
                    position: relative;
                    min-width: 53px;
                    min-height: 53px;
                    width: 45px;
                    height: 45px;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .hotkey-input-container .modal-button::before {
                    content: "";
                    position: absolute;
                    width: 15px;
                    height: 15px;
                    border-radius: 50%;
                    background-color: rgba(255, 0, 0, .75);;
                    transition: all .25s cubic-bezier(0.25, 1, 0.5, 1);
                }

                .hotkey-input-container .modal-button:hover::before {
                    scale: 1.1;
                }

                .hotkey-input-container .modal-button.recording::before {
                    border-radius: 2px;
                    background-color: rgba(255, 255, 255, .75);
                }

                .invalid-hotkey {
                    color: red;
                    font-size: 12px;
                    padding: 5px 10px;
                    background-color: rgb(255, 0, 0, .15);
                    border: 1px solid rgba(255, 0, 0, .1);
                    border-radius: 10px;
                    min-height: 0;
                    height: 0;
                    opacity: 0;
                    margin-bottom: -20px;
                    overflow: hidden;
                    pointer-events: none;
                    transition: all .15s cubic-bezier(0.25, 1, 0.5, 1);
                }
                    
                .invalid-hotkey.visible {
                    height: auto;
                    opacity: 1;
                    margin-bottom: 0;
                }
            </style>

            <div class="invalid-hotkey">Invalid hotkey, please try again.</div>
            <div class="hotkey-input-container">
                <div class="modal-input-container" label="Hotkey">
                    <input class="modal-input" id="shortcut-hotkey" type="text" placeholder="Record a new hotkey" spellcheck="false" autocomplete="off" ${shortcut ? `value=${shortcut.key}` : ""} required>
                </div>
                <button class="modal-button" id="record-button"></button>
            </div>
            <button class="modal-button" type="submit" id="confirm">Confirm</button>
        `);

        const modalContentShadowRoot = this.modalContent.shadowRoot;

        const hotkeyInput = modalContentShadowRoot.querySelector("#shortcut-hotkey");
        const recordButton = modalContentShadowRoot.querySelector("#record-button");
        const confirmButton = modalContentShadowRoot.querySelector("#confirm");
        const invalidHotkey = modalContentShadowRoot.querySelector(".invalid-hotkey");

        confirmButton.focus();

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

        confirmButton.addEventListener("click", () => {
            if (recording) {
                recordButton.classList.remove("recording");
                shortcutKeyBinder.stopHotkeyRecording();
            }

            if (shortcutKeyBinder.currentShortcut && shortcutKeyBinder.validateHotkey(shortcutKeyBinder.currentShortcut)) {
                shortcutKeyBinder.currentShortcut = null;
                this.dispatchEvent(new CustomEvent("confirm-button-return", { detail: { result: true } }));
            } else {
                invalidHotkey.classList.add("visible");
                hotkeyInput.value = "";
                shortcutKeyBinder.currentShortcut = null;
            }
        });
    }
}

window.customElements.define("reimagined-modal", Modal);
window.customElements.define("reimagined-add-shortcut-modal", AddShortcutModal);
window.customElements.define("reimagined-edit-shortcut-modal", EditShortcutModal);
window.customElements.define("reimagined-remove-shortcut-modal", RemoveShortcutModal);
window.customElements.define("reimagined-set-hotkey-modal", SetHotkeyModal);

export { Modal, AddShortcutModal, EditShortcutModal, RemoveShortcutModal, SetHotkeyModal };

class ShortcutKeyBinder {
    constructor(input) {
        this.input = input;
        this.pressedKeys = new Set();
        this.currentShortcut = null;
        this.boundKeyHandler = this.handleKeyRecording.bind(this);
    }

    validateHotkey(shortcut) {
        const modifiers = ["ctrl", "control", "alt", "shift", "cmd", "command"];
        const allowedKeys = [
            "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
            "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
            "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
            "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12",
            "tab", "space", "backspace", "delete", "enter", "esc", "escape", "up", "down", "left", "right"
        ];

        const keys = shortcut.toLowerCase().split("+");
        const hasModifier = keys.some(key => modifiers.includes(key));
        if (!hasModifier) return false;

        const isValid = keys.every(key => modifiers.includes(key) || allowedKeys.includes(key));
        return isValid;
    }

    handleKeyRecording(event) {
        const key = event.key.toLowerCase();
        if (!this.pressedKeys.has(key)) {
            this.pressedKeys.add(key);
            this.input.value = Array.from(this.pressedKeys).join("+");
        }
    }

    startHotkeyRecording() {
        this.pressedKeys.clear();
        this.input.value = "";
        this.input.classList.remove("invalid");
        window.addEventListener("keydown", this.boundKeyHandler);
    }

    stopHotkeyRecording() {
        window.removeEventListener("keydown", this.boundKeyHandler);
        this.currentShortcut = Array.from(this.pressedKeys).join("+");

        this.input.value = this.currentShortcut;

        this.pressedKeys.clear();
    }
}