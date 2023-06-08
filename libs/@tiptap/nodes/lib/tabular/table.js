import { Node, callOrReturn, getExtensionField, mergeAttributes } from "@tiptap/core";
import {
    CellSelection,
    addRowAfter,
    addRowBefore,
    deleteTable,
    fixTables,
    goToNextCell,
    mergeCells,
    setCellAttr,
    splitCell,
    tableEditing,
} from "@tiptap/pm/tables";

import { columnResizing } from "./plugins/column-resizing/column-resizing";

import { deleteColumn, deleteRow } from "./commands/delete";
import { addColumnAt, createTable } from "./commands/insert";

/**
 * @type {Node<TableOptions>}
 */
export const Table = Node.create({
    name: "table",
    addOptions() {
        return {
            HTMLAttributes: {},
            resizable: false,
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
            ["colgroup", ...colwidths.map((w) => ["col", { style: `width:${w}%;` }])],
            ["tbody", 0],
        ];
    },

    addProseMirrorPlugins() {
        return [columnResizing(), tableEditing({ allowTableNodeSelection: this.options.allowTableNodeSelection })];
    },

    addCommands() {
        return {
            insertTable:
                ({ rows = 3, cols = 3, cellContent } = {}) =>
                ({ state, dispatch }) => {
                    return createTable({ rowsCount: rows, colsCount: cols, cellContent })(state, dispatch);
                },
            addColumnBefore: () => ({ state, dispatch }) => {
                return addColumnAt(state, dispatch);
            },
            addColumnAfter: () => ({ state, dispatch }) => {
                return addColumnAt(state, dispatch, 1);
            },
            deleteColumn: () => ({ state, dispatch }) => {
                return deleteColumn(state, dispatch);
            },
            addRowBefore: () => ({ state, dispatch }) => {
                return addRowBefore(state, dispatch);
            },
            addRowAfter: () => ({ state, dispatch }) => {
                return addRowAfter(state, dispatch);
            },
            deleteRow: () => ({ state, dispatch }) => {
                return deleteRow(state, dispatch);
            },
            deleteTable: () => ({ state, dispatch }) => {
                return deleteTable(state, dispatch);
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
            setCellAttribute: (name, value) => ({ state, dispatch }) => {
                return setCellAttr(name, value)(state, dispatch);
            },
            goToNextCell: () => ({ state, dispatch }) => {
                return goToNextCell(1)(state, dispatch);
            },
            goToPreviousCell: () => ({ state, dispatch }) => {
                return goToNextCell(-1)(state, dispatch);
            },
            fixTables: () => ({ state, dispatch }) => {
                if (dispatch) {
                    fixTables(state);
                }

                return true;
            },
            setCellSelection: (position) => ({ tr, dispatch }) => {
                if (dispatch) {
                    const selection = CellSelection.create(tr.doc, position.anchorCell, position.headCell);

                    // @ts-ignore
                    tr.setSelection(selection);
                }

                return true;
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
