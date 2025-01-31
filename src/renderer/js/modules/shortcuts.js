import { AddShortcutModal, RemoveShortcutModal, EditShortcutModal } from "./modals.js";
import { showNotification } from "./notifications.js";

const shortcutsContainer = document.getElementById("shortcuts");
const addShortcut = document.getElementById("add-shortcut");
const reloadShortcuts = document.getElementById("reload-shortcuts");

addShortcut.addEventListener("click", async () => {
    new AddShortcutModal();
});

reloadShortcuts.addEventListener("click", async () => {
    await getShortcuts();

    showNotification("Shortcuts reloaded");
});

function renderShortcuts(shortcuts) {
    shortcutsContainer.innerHTML = "";

    if (shortcuts.length === 0) {
        shortcutsContainer.innerHTML = `
            <div class="shortcut">
                <div class="shortcut-name">No shortcuts</div>
                <div class="shortcut-separator"></div>
                <div class="shortcut-hotkey">Add a shortcut by pressing the "Add shortcut" button in the top bar</div>
            </div>
        `;
        return;
    }

    for (const shortcut of shortcuts) {
        const shortcutElement = document.createElement("div");
        shortcutElement.classList.add("shortcut");
        shortcutElement.classList.add("draggable");
        shortcutElement.setAttribute("data-name", shortcut.name);
        shortcutElement.innerHTML = `
            <div class="drag-handle">
                <span class="icons">⋮⋮</span>
            </div>
            <div class="shortcut-name">${shortcut.name}</div>
            <div class="shortcut-separator"></div>
            <div class="shortcut-hotkey">${shortcut.key}</div>
            <div class="shortcut-separator"></div>
            <div class="shortcut-action">${shortcut.action}</div>
            <div class="shortcut-controls">
                <div class="shortcut-separator"></div>
                <button id="shortcut-remove">Remove</button>
                <div class="shortcut-separator"></div>
                <button id="shortcut-edit">Edit</button>
            </div>
        `;

        const editButton = shortcutElement.querySelector("#shortcut-edit");
        editButton.addEventListener("click", () => {
            new EditShortcutModal(shortcut);
        });

        const removeButton = shortcutElement.querySelector("#shortcut-remove");
        removeButton.addEventListener("click", () => {
            new RemoveShortcutModal(shortcut);
        });

        shortcutsContainer.appendChild(shortcutElement);
    }
}

async function getShortcuts() {
    const shortcuts = await window.electronAPI.getShortcuts();
    renderShortcuts(shortcuts);
}

function getLastShortcutPosition() {
    const shortcuts = shortcutsContainer.querySelectorAll(".shortcut");
    const position = shortcuts.length > 0 ? shortcuts.length - 1 : 0;
    return position;
}

window.electronAPI.onShowNotification((body) => {
    showNotification(body);
});

export { getShortcuts, getLastShortcutPosition };