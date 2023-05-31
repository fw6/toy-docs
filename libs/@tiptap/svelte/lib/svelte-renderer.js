/**
 * @typedef {import('@tiptap/core').Editor} Editor
 * @typedef {import('svelte').ComponentType} ComponentType
 * @typedef {import('svelte').SvelteComponentTyped} SvelteComponentTyped
 * @typedef {import('./types').SvelteRendererOptions} SvelteRendererOptions
 */

/**
 * @template {import('svelte').ComponentType<import('svelte').SvelteComponentTyped<any>>} Component
 */
export class SvelteRenderer {
    /**
     * @type {HTMLElement}
     */
    element;
    /**
     * @type {HTMLElement}
     */
    teleportElement;

    /** @type {Editor} */
    editor;

    /** @type {import('svelte').SvelteComponentTyped<any>} */
    _instance;

    /**
     * @param {Component} Component
     * @param {SvelteRendererOptions} options
     */
    constructor(Component, { element, editor, props, context }) {
        this.element = element;
        this.teleportElement = element;

        this.editor = editor;
        this.element.classList.add("svelte-renderer");

        this._instance = new Component({
            target: element,
            props: props,
            context: context || new Map(),
        });

        if (this.teleportElement.children.length !== 1) {
            throw Error("VueRenderer doesn’t support multiple child elements.");
        }

        const firstChild = this.teleportElement.firstElementChild;
        if (firstChild instanceof HTMLElement) this.element = firstChild;
    }

    get ref() {
        return this._instance;
    }

    /** @param {Record<string, any>} props */
    updateProps(props) {
        this._instance.$set(props);
    }

    destroy() {
        this._instance.$destroy();
    }
}
