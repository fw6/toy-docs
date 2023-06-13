/**
 * @typedef {object} CreateTableProps
 * @property {number} [rowsCount]
 * @property {number} [colsCount]
 * @property {PMNode} [cellContent]
 */

import { decimalRounding } from "@local/shared";
import { TextSelection } from "@tiptap/pm/state";
import { addColumn, isInTable, selectedRect, TableMap } from "@tiptap/pm/tables";

import { WIDTH_DECIMAL_PLACES } from "../constants";
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
 * @param {-1 | 1} [side]
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
        tr.setSelection(TextSelection.create(tr.doc, tr.mapping.map(anchorPos) - 2));

        dispatch(tr);
    }
    return true;
}

/**
 * After inserting a column, the column widths should be even.
 *
 * @param {Transaction} tr
 * @param {number} column
 */
export function evenColumnWidthAfterInsert(tr, column) {
    const table = findTable(tr.selection);
    if (table) {
        const map = TableMap.get(table.node);
        /** @type {number[]} */
        let colwidths = table.node.attrs.colwidths;

        if (!colwidths.length) {
            colwidths = generateColwidths(map.width);
        } else {
            // the new column width is the lastest average
            const newColwidth = decimalRounding(100 / map.width, WIDTH_DECIMAL_PLACES);

            // The previous columns share the new extra width proportionally
            colwidths = colwidths.flatMap((colwidth, index) => {
                const width = decimalRounding(colwidth * (1 - newColwidth / 100), WIDTH_DECIMAL_PLACES);

                if (index === column) {
                    return [newColwidth, width];
                }

                return width;
            });
        }

        tr.setNodeAttribute(table.pos, "colwidths", colwidths);
    }

    return tr;
}
