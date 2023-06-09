import { CellSelection, TableMap } from "@tiptap/pm/tables";
import { findTable } from "../utils/tables";

/**
 * @type {(type: 'rows' | 'cols') => (from: number, to?: number) => Command}
 */
const select = (type) => (from, to) => (state, dispatch) => {
    if (!(typeof to === "number")) to = from;
    else if (from > to) [from, to] = [to, from];
    const table = findTable(state.selection);
    if (!table) return false;

    const map = TableMap.get(table.node);
    if (from < 0) return false;
    if ((type === "cols" && to > map.height) || (type === "rows" && to > map.width)) return false;

    if (dispatch) {
        const tr = state.tr;

        if (type === "cols") {
            const anchorPos = table.start + map.map[from];
            const headPos = table.start + map.map[to];
            tr.setSelection(CellSelection.colSelection(tr.doc.resolve(anchorPos), tr.doc.resolve(headPos)));
        } else {
            const anchorPos = table.start + map.map[map.width * from];
            const headPos = table.start + map.map[map.width * (to + 1) - 1];
            tr.setSelection(CellSelection.create(tr.doc, anchorPos, headPos));
        }

        dispatch(tr);
        return true;
    }

    return false;
};

/** @type {ReturnType<select>} */
export const selectRows = select("rows");

/** @type {ReturnType<select>} */
export const selectColumns = select("cols");

/** @type {Command} */
export const selectTable = (state, dispatch) => {
    const table = findTable(state.selection);
    if (!table) return false;
    const map = TableMap.get(table.node);
    if (dispatch && map.map.length) {
        const tr = state.tr;
        const anchor = table.start + map.map[0];
        const head = table.start + map.map[map.map.length - 1];

        tr.setSelection(CellSelection.create(tr.doc, anchor, head));
        dispatch(tr);
        return true;
    }

    return false;
};
