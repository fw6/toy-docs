import { Node, callOrReturn, getExtensionField, mergeAttributes } from "@tiptap/core";
import {
    CellSelection,
    TableMap,
    addRowAfter,
    addRowBefore,
    deleteTable,
    fixTables,
    goToNextCell,
    isInTable,
    mergeCells,
    selectedRect,
    setCellAttr,
    splitCell,
    tableEditing,
} from "@tiptap/pm/tables";

import { deleteColumn, deleteRow } from "./commands/delete";
import { addColumnAt, createTable } from "./commands/insert";
import { selectColumns, selectRows, selectTable } from "./commands/select";
import { getGridCellPlugin } from "./plugins/grid-cell/grid-cell";

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

            /**
             * Default table cell border color
             */
            borderColor: {
                default: null,
                parseHTML: (ele) => ele.dataset.borderColor,
                renderHTML: (attrs) => {
                    if (!attrs.borderColor) return {};
                    return {
                        "data-border-color": attrs.borderColor,
                        style: `--table-border-color: ${attrs.borderColor};`,
                    };
                },
            },

            /**
             * Default table cell border style
             */
            borderStyle: {
                default: null,
                parseHTML: (ele) => ele.dataset.borderStyle,
                renderHTML: (attrs) => {
                    if (!attrs.borderStyle || attrs.borderStyle === "solid") return {};
                    return {
                        "data-border-style": attrs.borderStyle,
                    };
                },
            },

            /**
             * Zebra effect, the value is the background color of even rows
             */
            alternateRows: {
                default: null,
                parseHTML: (ele) => ele.dataset.alternateRows,
                renderHTML: (attrs) => {
                    if (!attrs.alternateRows) return {};
                    return {
                        "data-alternate-rows": attrs.alternateRows,
                        style: `--alternate-rows-color: ${attrs.alternateRows};`,
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
        return [
            tableEditing({ allowTableNodeSelection: this.options.allowTableNodeSelection }),
            getGridCellPlugin(this.editor),
        ];
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

            selectTable: () => ({ state, dispatch }) => selectTable(state, dispatch),
            selectRows: (from, to) => ({ state, dispatch }) => selectRows(from, to)(state, dispatch),
            selectColumns: (from, to) => ({ state, dispatch }) => selectColumns(from, to)(state, dispatch),
        };
    },

    addKeyboardShortcuts() {
        return {
            Tab: ({ editor }) => {
                if (!isInTable(editor.state)) return false;
                const rect = selectedRect(editor.state);

                if (rect.map.width === rect.right && rect.map.height === rect.bottom) {
                    return editor.chain().addRowAfter().goToNextCell().run();
                }

                return editor.commands.goToNextCell();
            },
            "Shift-Tab": ({ editor }) => editor.commands.goToPreviousCell(),
            Backspace: ({ editor }) => {
                const state = editor.state;

                if (isInTable(state)) {
                    const rect = selectedRect(state);

                    const selectRow = rect.right - rect.left === rect.map.width;
                    const selectCol = rect.bottom - rect.top === rect.map.height;

                    if (selectRow && selectCol) {
                        return editor.commands.deleteTable();
                    } else if (selectCol) {
                        return editor.commands.deleteColumn();
                    } else if (selectRow) {
                        return editor.commands.deleteRow();
                    }

                    return false;
                }

                const { selection } = state;
                if (selection.$head.parentOffset === 0 && selection.from === selection.to) {
                    const $pos = state.doc.resolve(selection.from - 1);
                    if ($pos.nodeBefore?.type.spec.tableRole === "table") {
                        const map = TableMap.get($pos.nodeBefore);
                        const tableStart = selection.from - $pos.nodeBefore.nodeSize;
                        const anchorPos = tableStart + map.map[0];
                        const headPos = tableStart + map.map[map.width * map.height - 1];

                        return editor.commands.command(({ tr }) => {
                            tr.setSelection(CellSelection.create(tr.doc, anchorPos, headPos));
                            return true;
                        });
                    }
                }

                return false;
            },
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
