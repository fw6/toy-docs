import { Node, callOrReturn, getExtensionField, mergeAttributes } from "@tiptap/core";
import { deleteColumn, deleteRow, deleteTable } from "./commands/delete";
import { createTable, insertRow } from "./commands/insert";
import { setCellAttr } from "./commands/misc";
import { goToNextCell, setCellSelection } from "./commands/selection";
import { mergeCells, splitCell } from "./commands/spanning";
import { tableEditing } from "./plugins/editing";
import { addColumnAt } from "./utils/cols";
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

    renderHTML({ HTMLAttributes }) {
        return ["table", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), ["tbody", 0]];
    },

    addProseMirrorPlugins() {
        return [tableEditing({ allowTableNodeSelection: this.options.allowTableNodeSelection })];
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

            addColumnAfter: () => ({ state, tr }) => {
                const rect = getClosestSelectionRect(state);
                const index = rect?.bottom;

                if (index) {
                    tr = addColumnAt(index)(tr);
                }
                return true;
            },
            addColumnBefore: () => ({ state, tr }) => {
                const rect = getClosestSelectionRect(state);
                const index = rect?.top;

                if (index) {
                    tr = addColumnAt(index)(tr);
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
