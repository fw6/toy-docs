import { removeColumnClosestToPos, removeSelectedColumns } from "../utils/cols";
import { removeSelectedRows } from "../utils/rows";
import { isSelectionType } from "../utils/selection";
import { removeTable } from "../utils/tables";

/**
 * @type {Command}
 */
export const deleteTable = (state, dispatch) => {
    const tr = removeTable(state.tr);
    if (dispatch) dispatch(tr);
    return true;
};

/**
 * @type {Command}
 */
export const deleteColumn = (state, dispatch) => {
    let tr = state.tr;

    if (isSelectionType(tr.selection, "cell")) {
        tr = removeSelectedColumns(tr);
    } else {
        tr = removeColumnClosestToPos(tr.selection.$anchor)(tr);
    }

    if (dispatch) dispatch(tr);
    return true;
};

/**
 * @type {Command}
 */
export const deleteRow = (state, dispatch) => {
    const tr = removeSelectedRows(state.tr);
    if (dispatch) dispatch(tr);
    return true;
};
