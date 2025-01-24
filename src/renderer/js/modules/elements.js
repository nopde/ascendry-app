const globalStyles = `
    * {
        margin: 0;
        padding: 0;
        font-family: "Open Sans", sans-serif;
        font-weight: 500;
        -webkit-font-smoothing: antialiased;
    }

    *:focus {
        box-shadow: 0 0 10px rgba(var(--accent-color, white), .25);
    }

    span.icons {
        font-family: "Icons";
    }
`;

class ReimaginedElement extends HTMLElement {
    constructor() {
        super();
        this.globalStyles = globalStyles;
    }
}

class ReimaginedSwitch extends ReimaginedElement {
    constructor() {
        super();
        this.checked = this.hasAttribute("checked");
        this.notification = this.getAttribute("notification") || null;
        this.warning = this.hasAttribute("warning");
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                ${this.globalStyles}

                :host {
                    display: inline-flex;
                    outline: none;
                    vertical-align: top;
                }

                .container {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    flex-shrink: 0;
                    width: 52px;
                    height: 32px;
                    border-radius: 9999px;
                }

                .container:has(input[disabled]) {
                    opacity: .5;
                    pointer-events: none;
                }

                input[type="checkbox"] {
                    border-radius: 9999px;
                    appearance: none;
                    height: max(100%, 48px);
                    outline: none;
                    margin: 0px;
                    position: absolute;
                    width: max(100%, 48px);
                    z-index: 1;
                    cursor: pointer;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }

                .track {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    border-radius: inherit;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .track::before {
                    content: "";
                    display: flex;
                    position: absolute;
                    height: 100%;
                    width: 100%;
                    border-radius: inherit;
                    box-sizing: border-box;
                    transform-property: opacity, background-color;
                    transition-timing-function: linear;
                    transition-duration: 67ms;
                    background-color: rgb(30, 30, 30);
                    border-color: rgba(255, 255, 255, .75);
                    border-style: solid;
                    border-width: 2px;
                }

                .container:has(input:checked) .track::before {
                    background-color: rgb(var(--accent-color, white));
                    border-color: rgb(var(--accent-color, white));
                }

                .handle-container {
                    display: flex;
                    place-content: center;
                    place-items: center;
                    position relative;
                    transition: margin 300ms cubic-bezier(.175, .885, .32, 1.275);
                    margin-inline-end: 20px;
                }

                .container:has(input:checked) .handle-container {
                    margin-inline-end: 0px;
                    margin-inline-start: 20px;
                }

                .handle {
                    position: relative;
                    border-radius: 9999px;
                    height: 16px;
                    width: 16px;
                    transform-origin: center center;
                    transition-property: height, width;
                    transition-duration: 250ms, 250ms;
                    transition-timing-function:
                        cubic-bezier(.2, 0, 0, 1),
                        cubic-bezier(.2, 0, 0, 1);
                    z-index: 0;
                }

                .container:has(input:checked) .handle {
                    width: 24px;
                    height: 24px;
                }

                .container:has(input:active) .handle {
                    width: 28px;
                    height: 28px;
                }

                .handle::before {
                    content: "";
                    display: flex;
                    inset: 0px;
                    position: absolute;
                    border-radius: inherit;
                    box-sizing: border-box;
                    transition: background-color 67ms linear;
                    background-color: rgba(255, 255, 255, .75);
                }

                .container:hover .handle::before,
                .container:active .handle::before {
                    background-color: white;
                }
                
                .container:has(input:checked) .handle::before {
                    background-color: black;
                }

                .container:hover:has(input:checked) .handle::before {
                    background-color: rgb(40, 40, 40);
                }
            </style>

            <div class="container">
                <focus-ring></focus-ring>
                <input type="checkbox" ${this.checked ? "checked" : ""}>
                <span class="track">
                    <span class="handle-container">
                        <span class="handle"></span>
                    </span>
                </span>
            </div>
        `;

        this.inputElement = this.shadowRoot.querySelector("input");
    }

    setupEventListeners() {
        let warned = false;
        this.inputElement.addEventListener("change", () => {
            if (this.warning && !warned) {
                this.dispatchEvent(new CustomEvent("switch-before-change", { detail: { checked: this.inputElement.checked }, bubbles: true }));
                this.inputElement.checked = false;
                warned = true;
                return;
            }

            this.checked = this.inputElement.checked;
            this.toggleAttribute("checked", this.checked);
            this.dispatchEvent(new CustomEvent("switch-change"));
        });

        this.addEventListener("toggle-switch", () => {
            this.inputElement.checked = !this.inputElement.checked;
        });

        this.addEventListener("toggle-disabled", () => {
            this.inputElement.disabled = !this.inputElement.disabled;
        });

        if (this.hasAttribute("disabled")) {
            this.dispatchEvent(new CustomEvent("toggle-disabled"));
        }

        if (this.notification) {
            this.addEventListener("switch-change", () => {
                this.dispatchEvent(new CustomEvent("show-notification", { detail: { body: this.notification }, bubbles: true }));
            });
        }
    }

    focus() {
        this.shadowRoot.querySelector(".container").querySelector("input").focus();
    }
}

class ReimaginedSegmentedButton extends ReimaginedElement {
    constructor() {
        super();
        this.multiSelect = this.hasAttribute("multi-select");
        this.buttons = Array.from(this.querySelectorAll("button"));
        this.innerHTML = "";
        this.attachShadow({ mode: "open", delegatesFocus: true });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                ${this.globalStyles}

                .container {
                    display: inline-flex;
                }

                button {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0px 15px;
                    border: 1px solid rgba(var(--accent-color, white), .5);
                    border-radius: 0;
                    height: 32px;
                    width: max-content;
                    transition: all 67ms linear;
                    background-color: rgba(var(--accent-color, white), .1);
                    color: rgba(255, 255, 255, .75);
                    cursor: pointer;
                    outline: none;
                }

                button:hover {
                    background-color: rgba(var(--accent-color, white), .25);
                    color: white;
                }

                button[active] {
                    background-color: rgb(var(--accent-color, white));
                    color: black;
                }

                button:first-child {
                    border-top-left-radius: 9999px;
                    border-bottom-left-radius: 9999px;
                    border-right: 0;
                }

                button:last-child {
                    border-top-right-radius: 9999px;
                    border-bottom-right-radius: 9999px;
                    border-left: 0;
                }
            </style>

            <div class="container">
                ${this.buttons.map((button) => button.outerHTML).join("")}
            </div>
        `;
    }

    setupEventListeners() {
        const buttons = this.shadowRoot.querySelectorAll("button");

        buttons.forEach((button, index) => {
            button.addEventListener("click", () => {
                if (!this.multiSelect) {
                    buttons.forEach((button) => button.removeAttribute("active"));
                    button.setAttribute("active", "");
                    this.dispatchEvent(new CustomEvent("button-click", { detail: { index }, bubbles: true }));
                }
                else {
                    button.toggleAttribute("active");
                    const activeButtons = this.shadowRoot.querySelectorAll("button[active]");
                    this.dispatchEvent(new CustomEvent("button-click", { detail: { activeButtons }, bubbles: true }));
                }
            });
        });
    }
}

class ReimaginedButton extends ReimaginedElement {
    constructor() {
        super();
        this.buttonBody = this.innerHTML;
        this.innerHTML = "";
        this.filled = this.hasAttribute("filled");
        this.elevated = this.hasAttribute("elevated");
        this.text = this.hasAttribute("text");
        this.icon = this.hasAttribute("icon");
        this.disabled = this.hasAttribute("disabled");
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                ${this.globalStyles}

                button {
                    --background-color: transparent;
                    --hover-background-color: rgba(var(--secondary-color, white), .1);
                    --active-background-color: rgba(var(--secondary-color, white), .25);

                    --filled-background-color: rgb(var(--secondary-color, white));
                    --filled-hover-background-color: rgb(235, 195, 120);
                    --filled-active-background-color: rgb(205, 165, 90);

                    --text-color: rgba(var(--tertiary-color), .75);
                    --hover-text-color: rgba(var(--tertiary-color), 1);
                    --active-text-color: rgba(var(--tertiary-color), 1);

                    --border-color: rgba(var(--tertiary-color, white), .25);

                    flex: 1 1;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 5px 15px;
                    border: 1px solid var(--border-color);
                    border-radius: 9999px;
                    transition: all 67ms linear;
                    background-color: var(--background-color);
                    color: var(--text-color);
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    outline: none;
                    white-space: nowrap;
                }

                button:hover {
                    background-color: var(--hover-background-color);
                }

                button:active {
                    background-color: var(--active-background-color);
                }

                button[elevated] {
                    box-shadow: 0 2px 10px rgba(0, 0, 0, .5);
                }

                button[elevated]:hover {
                    box-shadow: 0 6px 10px rgba(0, 0, 0, .5);
                }

                button[filled] {
                    background-color: var(--filled-background-color);
                    color: black;
                    border-color: var(--filled-background-color);
                }

                button[filled]:hover {
                    background-color: var(--filled-hover-background-color);
                    border-color: var(--filled-hover-background-color);
                }

                button[filled]:active {
                    background-color: var(--filled-active-background-color);
                    border-color: var(--filled-active-background-color);
                }

                button[text] {
                    background-color: var(--background-color);
                    border: 0;
                    border-radius: 10px;
                    color: var(--text-color);
                    font-size: 14px;
                    padding-inline: 10px;
                }

                button[text]:hover {
                    background-color: var(--hover-background-color);
                    color: var(--hover-text-color);
                }

                button[text]:active {
                    background-color: var(--active-background-color);
                    color: var(--active-text-color);
                }

                button[icon] {
                    font-size: 10px;
                    padding: 0px;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                }

                button[disabled] {
                    opacity: .5;
                    pointer-events: none;
                }
            </style>

            <button ${this.filled ? "filled" : ""} ${this.elevated ? "elevated" : ""} ${this.text ? "text" : ""} ${this.icon ? "icon" : ""} ${this.disabled ? "disabled" : ""}>
                ${this.buttonBody}
            </button>
        `;
    }

    setupEventListeners() {
        this.addEventListener("click", () => {
            if (!this.disabled) {
                this.dispatchEvent(new CustomEvent("button-click", { bubbles: true }));
            }
        });
    }
}

class ReimaginedTextInput extends ReimaginedElement {
    constructor() {
        super();
        this.placeholder = this.getAttribute("placeholder") || "";
        this.value = this.getAttribute("value") || "";
        this.required = this.hasAttribute("required");
        this.disabled = this.hasAttribute("disabled");
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                ${this.globalStyles}

                :host {
                    display: block;
                    width: 100%;
                }

                input {
                    --background-color: transparent;
                    --hover-background-color: rgba(var(--secondary-color, white), .1);
                    --focus-background-color: rgba(var(--secondary-color, white), .15);

                    --text-color: rgba(var(--tertiary-color), .75);
                    --hover-text-color: rgba(var(--tertiary-color), 1);
                    --active-text-color: rgba(var(--tertiary-color), 1);

                    --border-color: rgba(var(--tertiary-color, white), .25);

                    box-sizing: border-box;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 10px 20px;
                    border: 1px solid var(--border-color);
                    border-radius: 9999px;
                    min-width: 0;
                    width: 100%;
                    height: max-content;
                    background-color: var(--background-color);
                    color: var(--text-color);
                    font-size: 14px;
                    font-weight: 500;
                    outline: none;
                    transition: all 67ms linear;
                }

                input:hover {
                    background-color: var(--hover-background-color);
                }

                input:focus {
                    background-color: var(--focus-background-color);
                }

                input::placeholder {
                    color: rgba(var(--tertiary-color), .5);
                    font-size: 14px;
                    font-weight: 400;
                }

                input[disabled] {
                    opacity: .5;
                    pointer-events: none;
                }
            </style>

            <input ${this.placeholder ? `placeholder="${this.placeholder}"` : ""} ${this.value ? `value="${this.value}"` : ""} ${this.required ? "required" : ""} ${this.disabled ? "disabled" : ""} spellcheck="false" autocomplete="off">
        `;

        this.inputElement = this.shadowRoot.querySelector("input");
    }

    getValue() {
        return this.inputElement.value;
    }

    setValue(value) {
        this.inputElement.value = value;
    }
}

window.customElements.define("reimagined-switch", ReimaginedSwitch);
window.customElements.define("reimagined-segmented-button", ReimaginedSegmentedButton);
window.customElements.define("reimagined-button", ReimaginedButton);
window.customElements.define("reimagined-text-input", ReimaginedTextInput);