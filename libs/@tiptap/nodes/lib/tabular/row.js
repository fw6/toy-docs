import { Node, mergeAttributes } from "@tiptap/core";

/** @type {Node<{HTMLAttribute: Record<string, unknown>}>} */
export const TableRow = Node.create({
    name: "table_row",
    tableRole: "row",
    content: "table_cell*",
    selectable: false,
    addOptions() {
        return {
            HTMLAttribute: {},
        };
    },
    parseHTML() {
        return [{ tag: "tr" }];
    },
    renderHTML({ HTMLAttributes }) {
        return ["tr", mergeAttributes(this.options.HTMLAttribute, HTMLAttributes), 0];
    },
});
