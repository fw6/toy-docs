import { decimalRounding } from "@local/shared";
import { TableMap, deleteTable, isInTable, removeColumn, removeRow, selectedRect } from "@tiptap/pm/tables";

import { CELL_WIDTH_DECIMAL_PLACES } from "../plugins/column-resizing/column-resizing";
import { generateColwidths } from "../utils/tables";

/**
 * Command function that removes the selected rows from a table.
 *
 * @public
 *
 * @type {Command}
 */
export function deleteRow(state, dispatch) {
    if (!isInTable(state)) return false;
    if (dispatch) {
        const rect = selectedRect(state);
        // Select the entire column to delete the row, then remove the entire table
        if (rect.bottom - rect.top === rect.map.height) return deleteTable(state, dispatch);

        const tr = state.tr;
        if (rect.top === 0 && rect.bottom === rect.map.height) return false;

        for (let i = rect.bottom - 1; ; i--) {
            removeRow(tr, rect, i);
            if (i === rect.top) break;
            const table = rect.tableStart ? tr.doc.nodeAt(rect.tableStart - 1) : tr.doc;
            if (!table) {
                throw RangeError("No table found");
            }
            rect.table = table;
            rect.map = TableMap.get(rect.table);
        }
        dispatch(tr);
    }
    return true;
}

/**
 * Command function that removes the selected columns from a table.
 *
 * @public
 *
 * @type {Command}
 */
export function deleteColumn(state, dispatch) {
    if (!isInTable(state)) return false;
    if (dispatch) {
        const rect = selectedRect(state);

        // Select the entire row to delete the column, then remove the entire table
        if (rect.right - rect.left === rect.map.width) return deleteTable(state, dispatch);

        const tr = state.tr;
        if (rect.left === 0 && rect.right === rect.map.width) return false;
        for (let i = rect.right - 1; ; i--) {
            removeColumn(tr, rect, i);
            if (i === rect.left) break;
            const table = rect.tableStart ? tr.doc.nodeAt(rect.tableStart - 1) : tr.doc;
            if (!table) {
                throw RangeError("No table found");
            }
            rect.table = table;
            rect.map = TableMap.get(table);
        }

        const colwidths = getColwidthsAfterDelete(rect.table, rect.map, [rect.left, rect.right]);
        tr.setNodeAttribute(rect.tableStart - 1, "colwidths", colwidths);

        dispatch(tr);
    }
    return true;
}

/**
 * Overwrite allocates remaining column space
 *
 * @param {PMNode} table
 * @param {TableMap} map
 * @param {[number, number]} range
 *
 * @returns {number[]}
 */
const getColwidthsAfterDelete = (table, map, range) => {
    /** @type {number[]} */
    let colwidths = table.attrs.colwidths;

    if (!colwidths.length) {
        colwidths = generateColwidths(map.width);
    } else {
        const [left, right] = range;
        const removedWidth = colwidths.slice(left, right).reduce((a, b) => a + b, 0);

        colwidths = colwidths.flatMap((width, i) => {
            if (i < left || i >= right) {
                return decimalRounding(width * (1 + removedWidth / (100 - removedWidth)), CELL_WIDTH_DECIMAL_PLACES);
            }
            return [];
        });
    }

    return colwidths;
};
