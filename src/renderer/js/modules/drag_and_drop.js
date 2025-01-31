class DragAndDrop {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            draggableSelector: ".draggable",
            handleSelector: ".drag-handle",
            draggedClass: "dragging",
            ...options
        };

        this.draggedElement = null;
        this.initialY = 0;
        this.initialScroll = 0;

        this.boundHandleMouseDown = this.handleMouseDown.bind(this);
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.boundHandleMouseUp = this.handleMouseUp.bind(this);

        this.init();
    }

    init() {
        this.container.addEventListener("mousedown", this.boundHandleMouseDown);
    }

    handleMouseDown(e) {
        const handle = e.target.closest(this.options.handleSelector);
        if (!handle) return;

        const draggable = handle.closest(this.options.draggableSelector);
        if (!draggable) return;

        e.preventDefault();

        this.draggedElement = draggable;
        this.initialY = e.clientY;
        this.initialScroll = this.container.scrollTop;

        this.draggedElement.classList.add(this.options.draggedClass);

        document.addEventListener("mousemove", this.boundHandleMouseMove);
        document.addEventListener("mouseup", this.boundHandleMouseUp);
    }

    handleMouseMove(e) {
        if (!this.draggedElement) return;

        const y = e.clientY;
        const targetElement = this.findDropTarget(y);

        if (targetElement) {
            const box = targetElement.getBoundingClientRect();
            const dropPosition = y < box.top + box.height / 2 ? "before" : "after";

            if (dropPosition === "before") {
                this.container.insertBefore(this.draggedElement, targetElement);
            } else {
                this.container.insertBefore(this.draggedElement, targetElement.nextSibling);
            }
        }
    }

    handleMouseUp() {
        if (!this.draggedElement) return;

        this.draggedElement.classList.remove(this.options.draggedClass);
        this.draggedElement = null;

        document.removeEventListener("mousemove", this.boundHandleMouseMove);
        document.removeEventListener("mouseup", this.boundHandleMouseUp);

        this.savePositions();
    }

    findDropTarget(y) {
        const elements = Array.from(this.container.querySelectorAll(
            `${this.options.draggableSelector}:not(.${this.options.draggedClass})`
        ));

        let closestElement = null;
        let minDistance = Infinity;

        for (const element of elements) {
            const box = element.getBoundingClientRect();
            const distance = Math.abs(y - (box.top + box.height / 2));

            if (distance < minDistance) {
                minDistance = distance;
                closestElement = element;
            }
        }

        return closestElement;
    }

    async savePositions() {
        try {
            const shortcuts = await window.electronAPI.getShortcuts();
            const shortcutElements = Array.from(
                this.container.querySelectorAll(this.options.draggableSelector)
            );

            const updatedShortcuts = shortcutElements
                .map((element, index) => {
                    const shortcutName = element.getAttribute("data-name");
                    const shortcut = shortcuts.find(s => s.name === shortcutName);
                    return shortcut ? { ...shortcut, position: index } : null;
                })
                .filter(Boolean);

            await window.electronAPI.saveShortcuts(updatedShortcuts);
        } catch (error) {
            console.error("Error saving positions:", error);
        }
    }

    destroy() {
        this.container.removeEventListener("mousedown", this.boundHandleMouseDown);
        document.removeEventListener("mousemove", this.boundHandleMouseMove);
        document.removeEventListener("mouseup", this.boundHandleMouseUp);
    }
}

export { DragAndDrop };