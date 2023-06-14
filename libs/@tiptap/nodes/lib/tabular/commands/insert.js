/**
 * @typedef {object} CreateTableProps
 * @property {number} [rowsCount]
 * @property {number} [colsCount]
 * @property {PMNode} [cellContent]
 */

import { TextSelection } from "@tiptap/pm/state";
import { TableMap, addColumn, addRow, isInTable, selectedRect } from "@tiptap/pm/tables";
import { evenColumnWidthAfterInsert } from "../utils/column";
import { tableNodeTypes } from "../utils/node-types";
import { findTable, generateColwidths } from "../utils/tables";

/**
 * @param {CreateTableProps} [props]
 * @returns {Command}
 */
export const createTable =
    ({ colsCount = 3, rowsCount = 3, cellContent } = {}) =>
    (state, dispatch) => {
        const { cell: tableCell, row: tableRow, table } = tableNodeTypes(state.schema);

        /** @type {PMNode[]} */
        const cells = [];

        for (let i = 0; i < colsCount; i++) {
            const cell = createCell(tableCell, cellContent);
            if (cell) {
                cells.push(cell);
            }
        }
        /** @type {PMNode[]} */
        const rows = [];
        for (let i = 0; i < rowsCount; i++) {
            rows.push(tableRow.createChecked(null, cells));
        }

        const tableNode = table.createChecked(
            {
                colwidths: generateColwidths(colsCount),
            },
            rows,
        );
        if (dispatch) {
            const tr = state.tr;
            const offset = tr.selection.anchor + 1;

            tr.replaceSelectionWith(tableNode)
                .scrollIntoView()
                .setSelection(TextSelection.near(tr.doc.resolve(offset)));

            dispatch(tr);
        }

        return true;
    };

/**
 * @param {NodeType} cellType
 * @param {PMNode} [cellContent]
 * @returns {PMNode | undefined | null}
 */
const createCell = (cellType, cellContent) => {
    if (cellContent) {
        return cellType.createChecked(null, cellContent);
    }

    return cellType.createAndFill();
};

/**
 * Command to add a column before the column with the selection.
 *
 * @public
 * @param {EditorState} state
 * @param {(tr: Transaction) => void} [dispatch]
 * @param {-1 | 1} [side] -1 left, 1 right
 * @returns {boolean}
 */
export function addColumnAt(state, dispatch, side) {
    if (!isInTable(state)) return false;
    if (dispatch) {
        const rect = selectedRect(state);
        const column = side === 1 ? rect.right : rect.left;
        const tr = addColumn(state.tr, rect, column);

        evenColumnWidthAfterInsert(tr, column);

        // move cursor to the new column
        const anchorPos = rect.tableStart + rect.map.map[column + rect.top * rect.map.width];
        tr.setSelection(TextSelection.near(tr.doc.resolve(tr.mapping.map(anchorPos) - 2), -1));

        dispatch(tr);
    }
    return true;
}

/**
 * @public
 * @param {EditorState} state
 * @param {(tr: Transaction) => void} [dispatch]
 * @param {-1 | 1} [side] -1 top, 1 bottom
 * @returns {boolean}
 */
export function addRowAt(state, dispatch, side) {
    if (!isInTable(state)) return false;
    if (dispatch) {
        const rect = selectedRect(state);
        const row = side === 1 ? rect.bottom : rect.top;
        const tr = addRow(state.tr, rect, row);

        const table = findTable(tr.selection);
        if (table) {
            const map = TableMap.get(table.node);
            const cellPos = map.positionAt(row, rect.left, table.node);
            tr.setSelection(TextSelection.create(tr.doc, table.pos + 1 + cellPos));
        }

        dispatch(tr);
    }

    return true;
}
