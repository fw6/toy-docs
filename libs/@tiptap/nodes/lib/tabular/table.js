import { Node, callOrReturn, getExtensionField, mergeAttributes } from "@tiptap/core";
import { tableEditing } from "./plugins/editing";

/**
 * @type {Node<TableOptions>}
 */
export const Table = Node.create({
    name: "table",
    addOptions() {
        return {
            HTMLAttributes: {},
            resizable: false,
            handleWidth: 5,
            cellMinWidth: 25,
            lastColumnResizable: true,
            allowTableNodeSelection: false,
        };
    },

    content: "table_row+",
    isolating: true,
    tableRole: "table",
    selectable: false,
    group: "block",

    parseHTML() {
        return [
            {
                tag: "table",
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ["table", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), ["tbody", 0]];
    },

    addProseMirrorPlugins() {
        return [tableEditing({ allowTableNodeSelection: this.options.allowTableNodeSelection })];
    },

    extendNodeSchema(extension) {
        const context = {
            name: extension.name,
            options: extension.options,
            storage: extension.storage,
        };

        return {
            tableRole: callOrReturn(getExtensionField(extension, "tableRole", context)),
        };
    },
});
