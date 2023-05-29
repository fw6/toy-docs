import { mergeAttributes, Node } from "@tiptap/core";

/**
 * @type {Node<import("./paragraph").ParagraphOptions>}
 * @see {@link https://tiptap.dev/api/nodes/paragraph | @tiptap/extension-paragraph}
 */
export const Paragraph = Node.create({
    name: "paragraph",

    priority: 1000,

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    group: "block",

    content: "inline*",

    parseHTML() {
        return [{ tag: "p" }];
    },

    renderHTML({ HTMLAttributes }) {
        return ["p", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },

    addCommands() {
        return {
            setParagraph: () => ({ commands }) => {
                return commands.setNode(this.name);
            },
        };
    },

    addKeyboardShortcuts() {
        return {
            "Mod-Alt-0": () => this.editor.commands.setParagraph(),
        };
    },
});
