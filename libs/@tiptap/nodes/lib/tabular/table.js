import { Node, callOrReturn, getExtensionField, mergeAttributes } from "@tiptap/core";
import { deleteColumn, deleteRow, deleteTable } from "./commands/delete";
import { createTable, insertColumn, insertRow } from "./commands/insert";
import { setCellAttr } from "./commands/misc";
import { goToNextCell, setCellSelection } from "./commands/selection";
import { mergeCells, splitCell } from "./commands/spanning";
import { columnResizing } from "./plugins/column-resizing/column-resizing";
import { tableEditing } from "./plugins/editing";
import { getClosestSelectionRect } from "./utils/selection";
import { fixTables } from "./utils/tables";

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

    addAttributes() {
        return {
            /**
             * 计算列宽必备属性！！！
             */
            colwidths: {
                default: [],
                parseHTML: (ele) => {
                    return (
                        ele
                            .getAttribute("colwidths")
                            ?.split(",")
                            .map((v) => (v ? parseFloat(v) : undefined)) || []
                    );
                },
                renderHTML: (attrs) => {
                    if (!Array.isArray(attrs.colwidths)) throw new Error('The attribute "colwidths" is required.');
                    return {
                        colwidths: attrs.colwidths.join(","),
                    };
                },
            },
            width: {
                default: 100,
                parseHTML: (ele) => parseFloat(ele.style.width || "100"),
                renderHTML: (attrs) => {
                    return {
                        style: `width: ${attrs.width || 100}%;`,
                    };
                },
            },
            marginLeft: {
                default: null,
                parseHTML: (ele) => parseFloat(ele.style.marginLeft || "0"),
                renderHTML: (attrs) => {
                    if (!attrs.marginLeft) return {};

                    return {
                        style: `margin-left: ${attrs.marginLeft}px;`,
                    };
                },
            },
            marginRight: {
                default: null,
                parseHTML: (ele) => parseFloat(ele.style.marginRight || "0"),
                renderHTML: (attrs) => {
                    if (!attrs.marginRight) return {};

                    return {
                        style: `margin-right: ${attrs.marginRight}px;`,
                    };
                },
            },
        };
    },

    renderHTML({ HTMLAttributes, node }) {
        /** @type {number[]} */
        const colwidths = node.attrs.colwidths;

        return [
            "table",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
            // FIXME Generate <colgroup> and <col> elements here is not reliable! Doesn't render every time.
            ["colgroup", ...colwidths.map((w) => ["col", { style: `width:${w}%;` }])],
            ["tbody", 0],
        ];
    },

    addProseMirrorPlugins() {
        return [columnResizing(), tableEditing({ allowTableNodeSelection: this.options.allowTableNodeSelection })];
    },

    addCommands() {
        return {
            insertTable: (props) => ({ state, dispatch }) => createTable(props)(state, dispatch),
            deleteTable: () => ({ state, dispatch }) => {
                return deleteTable(state, dispatch);
            },

            addRowAfter: () => ({ state, dispatch }) => {
                const rect = getClosestSelectionRect(state);
                const index = rect?.bottom;
                if (index) {
                    return insertRow(index, true)(state, dispatch);
                }

                return true;
            },
            addRowBefore: () => ({ state, dispatch }) => {
                const rect = getClosestSelectionRect(state);
                const index = rect?.bottom;
                if (index) {
                    return insertRow(index, true)(state, dispatch);
                }

                return true;
            },
            deleteRow: () => ({ state, dispatch }) => {
                deleteRow(state, dispatch);
                return true;
            },

            addColumnAfter: () => ({ state, dispatch }) => {
                const rect = getClosestSelectionRect(state);
                const index = rect?.right;

                if (typeof index === "number") {
                    return insertColumn(index)(state, dispatch);
                }
                return true;
            },
            addColumnBefore: () => ({ state, dispatch }) => {
                const rect = getClosestSelectionRect(state);
                const index = rect?.left;

                if (typeof index === "number") {
                    return insertColumn(index)(state, dispatch);
                }
                return true;
            },
            deleteColumn: () => ({ state, dispatch }) => {
                return deleteColumn(state, dispatch);
            },

            goToNextCell: () => ({ state, dispatch }) => goToNextCell(1)(state, dispatch),
            goToPreviousCell: () => ({ state, dispatch }) => goToNextCell(-1)(state, dispatch),
            setCellSelection:
                ({ anchorCell, headCell }) =>
                ({ state, dispatch }) => {
                    return setCellSelection(anchorCell, headCell)(state, dispatch);
                },

            mergeCells: () => ({ state, dispatch }) => {
                return mergeCells(state, dispatch);
            },
            splitCell: () => ({ state, dispatch }) => {
                return splitCell(state, dispatch);
            },
            mergeOrSplit: () => ({ state, dispatch }) => {
                if (mergeCells(state, dispatch)) {
                    return true;
                }

                return splitCell(state, dispatch);
            },

            fixTables: () => ({ state, dispatch }) => {
                if (dispatch) {
                    fixTables(state);
                }

                return true;
            },
            setCellAttribute: (name, value) => ({ state, dispatch }) => {
                return setCellAttr(name, value)(state, dispatch);
            },
        };
    },

    addKeyboardShortcuts() {
        return {
            Tab: ({ editor }) => editor.commands.goToNextCell(),
            "Shift-Tab": ({ editor }) => editor.commands.goToPreviousCell(),
        };
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
