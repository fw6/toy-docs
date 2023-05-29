/**
 * @typedef {object} CreateTableProps
 * @property {number} [rowsCount]
 * @property {number} [colsCount]
 * @property {PMNode} [cellContent]
 */

import { Selection, TextSelection } from "@tiptap/pm/state";
import { addColumnAt } from "prosemirror-utils";
import { TableMap } from "../helpers/table-map";
import { tableNodeTypes } from "../utils/node-types";
import { addRowAt, copyPreviousRow } from "../utils/rows";
import { findTable } from "../utils/tables";

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

        const tableNode = table.createChecked(null, rows);
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
 * @param {number} column
 * @returns {Command}
 */
export const insertColumn = (column) => (state, dispatch, view) => {
    const tr = addColumnAt(column)(state.tr);

    const table = findTable(tr.selection);
    if (!table) {
        return false;
    }
    // move the cursor to the newly created column
    const pos = TableMap.get(table.node).positionAt(0, column, table.node);

    if (dispatch) {
        dispatch(tr.setSelection(Selection.near(tr.doc.resolve(table.start + pos))));
    }
    return true;
};

/**
 * @param {number} row
 * @param {boolean} [moveCursorToTheNewRow]
 * @returns {Command}
 */
export const insertRow = (row, moveCursorToTheNewRow = false) => (state, dispatch) => {
    const clonePreviousRow = row > 0;

    const tr = clonePreviousRow ? copyPreviousRow(state.schema)(row)(state.tr) : addRowAt(row)(state.tr);

    const table = findTable(tr.selection);
    if (!table) {
        return false;
    }
    if (dispatch) {
        const { selection } = state;
        if (moveCursorToTheNewRow) {
            // move the cursor to the newly created row
            const pos = TableMap.get(table.node).positionAt(row, 0, table.node);
            tr.setSelection(Selection.near(tr.doc.resolve(table.start + pos)));
        } else {
            tr.setSelection(selection.map(tr.doc, tr.mapping));
        }

        dispatch(tr);
    }
    return true;
};
