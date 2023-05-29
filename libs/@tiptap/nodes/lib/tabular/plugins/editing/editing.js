import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { CellSelection } from "../../helpers/cell-selection";
import { handlePaste } from "../../utils/copy-paste";
import { normalizeSelection } from "../../utils/selection";
import { fixTables } from "../../utils/tables";
import { TABLE_EDITING_KEY } from "../keys";
import { handleKeyDown, handleMouseDown, handleTripleClick } from "./events";

/**
 * @typedef {object} EditingOptions
 * @property {boolean} [allowTableNodeSelection=false]
 */

/**
 * @param {EditingOptions} [options]
 */
export function tableEditing({ allowTableNodeSelection = false } = {}) {
    return new Plugin({
        key: TABLE_EDITING_KEY,
        // This piece of state is used to remember when a mouse-drag
        // cell-selection is happening, so that it can continue even as
        // transactions (which might move its anchor cell) come in.
        state: {
            /** @returns {number | null} */
            init: () => null,
            apply: (tr, cur) => {
                const set = tr.getMeta(TABLE_EDITING_KEY);
                if (set != null) {
                    return set === -1 ? null : set;
                }
                if (cur == null || !tr.docChanged) {
                    return cur;
                }

                const { deleted, pos } = tr.mapping.mapResult(cur);
                return deleted ? null : pos;
            },
        },
        props: {
            decorations: drawCellSelection,
            createSelectionBetween(view) {
                if (TABLE_EDITING_KEY.getState(view.state) != null) {
                    return view.state.selection;
                }

                return null;
            },
            handleDOMEvents: {
                mousedown: handleMouseDown,
            },

            handleTripleClick,

            handleKeyDown,

            handlePaste,
        },
        appendTransaction(_, oldState, state) {
            return normalizeSelection(state, fixTables(state, oldState), allowTableNodeSelection);
        },
    });
}

/**
 * @param {EditorState} state
 */
function drawCellSelection(state) {
    const selection = state.selection;
    if (!(selection instanceof CellSelection)) {
        return null;
    }

    /** @type {Decoration[]} */
    const cells = [];
    selection.forEachCell((node, pos) => {
        cells.push(Decoration.node(pos, pos + node.nodeSize, { class: "selectedCell" }));
    });

    return DecorationSet.create(state.doc, cells);
}
