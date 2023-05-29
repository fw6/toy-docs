import { removeSelectedColumns } from "../utils/cols";
import { removeSelectedRows } from "../utils/rows";
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
    const tr = removeSelectedColumns(state.tr);
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
