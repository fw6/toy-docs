import { CellSelection } from "../helpers/cell-selection";
import { selectionCell } from "../utils/cells";

/**
 * @param {string} name
 * @param {unknown} value
 * @returns {Command}
 */
export const setCellAttr = (name, value) => (state, dispatch) => {
    const { tr, selection } = state;
    if (selection instanceof CellSelection) {
        let updated = false;
        selection.forEachCell((cell, pos) => {
            if (cell.attrs[name] !== value) {
                tr.setNodeMarkup(pos, cell.type, { ...cell.attrs, [name]: value });
                updated = true;
            }
        });
        if (updated) {
            if (dispatch) {
                dispatch(tr);
            }
            return true;
        }
    } else {
        const cell = selectionCell(state.selection);
        if (cell) {
            if (dispatch) {
                dispatch(
                    tr.setNodeMarkup(cell.pos, cell.nodeAfter?.type, {
                        ...cell.nodeAfter?.attrs,
                        [name]: value,
                    }),
                );
            }
            return true;
        }
    }
    return false;
};

/**
 * :: (cell: {pos: number, start: number, node: ProseMirrorNode}, attrs: Object) → (tr: Transaction) → Transaction
 * Returns a new transaction that sets given `attrs` to a given `cell`.
 *
 * ```javascript
 * dispatch(
 *   setCellAttrs(findCellClosestToPos($pos), { background: 'blue' })(tr);
 * );
 * ```
 *
 * @param {NodeWithPos} cell
 * @param {Attrs} attrs
 * @returns {(tr: Transaction) => Transaction}
 */
export const setCellAttrs = (cell, attrs) => (tr) => {
    if (cell) {
        tr.setNodeMarkup(cell.pos, null, Object.assign({}, cell.node.attrs, attrs));
        return tr;
    }
    return tr;
};
