/**
 * @typedef {import("../plugins/editing/types").Direction} Direction
 */

import { CellSelection } from "../helpers/cell-selection";
import { selectionCell } from "../utils/cells";
import { isInTable } from "../utils/tables";

/**
 * @param {number} anchor
 * @param {number} [head]
 * @returns {Command}
 */
export const setCellSelection = (anchor, head) => (state, dispatch) => {
    if (dispatch) dispatch(state.tr.setSelection(CellSelection.create(state.doc, anchor, head)));
    return true;
};

/**
 * Returns a command for selecting the next (direction=1) or previous
 * (direction=-1) cell in a table.
 *
 * @param {Direction} direction
 * @returns {Command}
 */
export function goToNextCell(direction) {
    return function (state, dispatch) {
        if (!isInTable(state)) return false;
        const $cell = selectionCell(state.selection);
        if (!$cell) return false;

        const cell = findNextCell($cell, direction);

        if (cell == null) return false;

        if (dispatch) {
            const $cell = state.doc.resolve(cell);
            dispatch(state.tr.setSelection(new CellSelection($cell)).scrollIntoView());
        }
        return true;
    };
}

/**
 * @param {ResolvedPos} $cell
 * @param {Direction} dir
 * @returns {number | null}
 */
function findNextCell($cell, dir) {
    const table = $cell.node(-2);

    if (dir < 0) {
        const before = $cell.nodeBefore;
        if (before) {
            return $cell.pos - before.nodeSize;
        }
        for (let row = $cell.index(-2) - 1, rowEnd = $cell.before(); row >= 0; row--) {
            const rowNode = $cell.node(-2).child(row);
            const lastChild = rowNode.lastChild;
            if (lastChild) {
                return rowEnd - 1 - lastChild.nodeSize;
            }
            rowEnd -= rowNode.nodeSize;
        }
    } else {
        if ($cell.index() < $cell.parent.childCount - 1) {
            return $cell.pos + ($cell.nodeAfter?.nodeSize || 0);
        }
        for (let row = $cell.indexAfter(-2), rowStart = $cell.after(); row < table.childCount; row++) {
            const rowNode = table.child(row);
            if (rowNode.childCount) return rowStart + 1;
            rowStart += rowNode.nodeSize;
        }
    }
    return null;
}
