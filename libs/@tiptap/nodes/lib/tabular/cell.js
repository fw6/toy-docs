import { Node, mergeAttributes } from "@tiptap/core";

/** @type {Node<{HTMLAttribute: Record<string, unknown>}>} */
export const TableCell = Node.create({
    name: "table_cell",
    content: "(paragraph)+",
    tableRole: "cell",
    marks: "",
    isolating: true,
    selectable: false,
    addOptions() {
        return {
            HTMLAttribute: {},
        };
    },
    addAttributes() {
        return {
            rowspan: {
                default: 1,
                parseHTML(dom) {
                    return Number(dom.getAttribute("rowspan") || 1);
                },
            },
            colspan: {
                default: 1,
                parseHTML(dom) {
                    return Number(dom.getAttribute("colspan") || 1);
                },
            },
        };
    },
    parseHTML() {
        return [
            {
                tag: "td",
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ["td", mergeAttributes(this.options.HTMLAttribute, HTMLAttributes), 0];
    },
});
