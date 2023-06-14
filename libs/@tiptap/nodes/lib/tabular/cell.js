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

            /**
             * 垂直水平对齐方式
             */
            align: {
                default: null,
                parseHTML: (ele) => ele.dataset.align?.split(" ") || ["t", "l"],
                renderHTML: (attrs) => (attrs.align ? { "data-align": attrs.align.join(" ") } : {}),
            },

            // numberFormat: {
            //     default: null,
            //     parseHTML: (ele) => decompressPMNodeAttr(ele.getAttribute('number_format'), 'General'),
            //     renderHTML: (attrs) => !attrs.numberFormat ? {} : { number_format: compressPMNodeAttr(attrs.numberFormat) },
            // },

            backgroundColor: {
                default: null,
                parseHTML: (element) => element.getAttribute("data-background-color"),
                renderHTML: (attrs) => {
                    if (!attrs.backgroundColor) return {};

                    return {
                        "data-background-color": attrs.backgroundColor,
                        style: `background-color: ${attrs.backgroundColor}`,
                    };
                },
            },

            borderColor: {
                default: null,
                parseHTML: (ele) => ele.style.borderColor,
                renderHTML: (attrs) => {
                    if (!attrs.borderColor) return {};
                    return {
                        style: `border-color: ${attrs.borderColor};`,
                    };
                },
            },

            /**
             * 边框样式
             * - none 无边框
             * - solid | null 实线
             * - dashed 虚线
             */
            borderStyle: {
                default: null,
                parseHTML: (ele) => ele.style.borderStyle,
                renderHTML: (attrs) => {
                    if (!attrs.borderStyle || attrs.borderStyle === "solid") return {};
                    return {
                        style: `border-style: ${attrs.borderStyle};`,
                    };
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
