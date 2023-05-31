import { Editor, NodeView } from "@tiptap/core";

import { TIPTAP_NODE_VIEW } from "./context";
import { SvelteRenderer } from "./svelte-renderer";

/**
 * @typedef {import('@tiptap/pm/model').Node} PMNode
 * @typedef {import('@tiptap/core').DecorationWithType} DecorationWithType
 * @typedef {import('@tiptap/core').NodeViewRenderer} NodeViewRenderer
 * @typedef {import('@tiptap/core').NodeViewProps} NodeViewProps
 * @typedef {import('@tiptap/core').NodeViewRendererProps} NodeViewRendererProps
 * @typedef {import('./types').SvelteNodeViewRendererOptions} SvelteNodeViewRendererOptions
 */

/**
 * @template {import('svelte').ComponentType<import('svelte').SvelteComponentTyped<NodeViewProps>>} Component
 * @extends {NodeView<Component, Editor, SvelteNodeViewRendererOptions>}
 */
class SvelteNodeView extends NodeView {
    /** @type {SvelteRenderer<Component>} */
    // @ts-ignore
    renderer;

    /** @type {HTMLElement | null} */
    contentDOMElement = null;

    /**
     * @param {Component} component
     * @param {NodeViewRendererProps} props
     * @param {Partial<SvelteNodeViewRendererOptions>} options
     */
    constructor(component, props, options) {
        super(component, props, options);
        this._mount();
    }

    _mount() {
        /** @type {NodeViewProps} */
        const props = {
            editor: this.editor,
            node: this.node,
            decorations: this.decorations,
            selected: false,
            extension: this.extension,
            getPos: () => this.getPos(),
            updateAttributes: (attributes = {}) => this.updateAttributes(attributes),
            deleteNode: () => this.deleteNode(),
        };

        this.contentDOMElement = this.node.isLeaf
            ? null
            : document.createElement(this.options.contentAs ?? (this.node.isInline ? "span" : "div"));
        if (this.contentDOMElement) {
            // For some reason the whiteSpace prop is not inherited properly in Chrome and Safari
            // With this fix it seems to work fine
            // See: https://github.com/ueberdosis/tiptap/issues/1197
            this.contentDOMElement.style.whiteSpace = "inherit";
        }

        const context = new Map();
        context.set(TIPTAP_NODE_VIEW, {
            onDragStart: this.onDragStart.bind(this),
            ...this.options.context,
        });

        const as = this.options.as ?? (this.node.isInline ? "span" : "div");
        const target = document.createElement(as);
        target.classList.add(`node-${this.node.type.name}`);
        const { className } = this.options;
        className && target.classList.add(className);

        this.renderer = new SvelteRenderer(this.component, {
            element: target,
            editor: this.editor,
            props,
            context,
        });
    }

    /**
     * @override
     */
    get dom() {
        if (!this.renderer.element?.hasAttribute("data-node-view-wrapper")) {
            throw new Error("Please use the NodeViewWrapper component for your node view.");
        }

        return this.renderer.element;
    }

    /**
     * @override
     */
    get contentDOM() {
        if (this.node.isLeaf) {
            return null;
        }

        this.maybeMoveContentDOM();

        return this.contentDOMElement;
    }

    maybeMoveContentDOM() {
        /** @type {HTMLElement | null} */
        const contentElement = this.dom.querySelector("[data-node-view-content]");

        if (this.contentDOMElement && contentElement && !contentElement.contains(this.contentDOMElement)) {
            contentElement.appendChild(this.contentDOMElement);
        }
    }

    /**
     * @param {PMNode} node
     * @param {DecorationWithType[]} decorations
     * @returns {boolean}
     */
    update(node, decorations) {
        if (typeof this.options.update === "function") {
            return this.options.update({ node, decorations });
        }

        if (node.type !== this.node.type) {
            return false;
        }

        if (node === this.node && this.decorations === decorations) {
            return true;
        }

        this.node = node;
        this.decorations = decorations;
        this.renderer.updateProps({ node, decorations });
        this.maybeMoveContentDOM();

        return true;
    }

    selectNode() {
        this.renderer.updateProps({ selected: true });
    }

    deselectNode() {
        this.renderer.updateProps({ selected: false });
    }

    destroy() {
        this.renderer.destroy();
        this.contentDOMElement = null;
    }
}

/**
 * @template {import('svelte').ComponentType} Component
 *
 * @param {Component} component
 * @param {Partial<SvelteNodeViewRendererOptions>} options
 * @returns {NodeViewRenderer}
 */
export const SvelteNodeViewRenderer = (component, options) => {
    return (props) => new SvelteNodeView(component, props, options);
};
