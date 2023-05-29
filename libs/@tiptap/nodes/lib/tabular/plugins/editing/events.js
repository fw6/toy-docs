import { keydownHandler } from "@tiptap/pm/keymap";
import { Slice } from "@tiptap/pm/model";
import { Selection, TextSelection } from "@tiptap/pm/state";
import { CellSelection } from "../../helpers/cell-selection";
import { cellAround, nextCell } from "../../utils/cells";
import { tableNodeTypes } from "../../utils/node-types";
import { inSameTable } from "../../utils/tables";
import { TABLE_EDITING_KEY } from "../keys";

/**
 * @typedef {import('./types').Direction} Direction
 * @typedef {import('./types').CommandWithView} CommandWithView
 * @typedef {import('@tiptap/core').Dispatch} Dispatch
 */

export const handleKeyDown = keydownHandler({
    ArrowLeft: arrow("horiz", -1),
    ArrowRight: arrow("horiz", 1),
    ArrowUp: arrow("vert", -1),
    ArrowDown: arrow("vert", 1),

    "Shift-ArrowLeft": shiftArrow("horiz", -1),
    "Shift-ArrowRight": shiftArrow("horiz", 1),
    "Shift-ArrowUp": shiftArrow("vert", -1),
    "Shift-ArrowDown": shiftArrow("vert", 1),

    Backspace: deleteCellSelection,
    "Mod-Backspace": deleteCellSelection,
    Delete: deleteCellSelection,
    "Mod-Delete": deleteCellSelection,
});

// #region events

/**
 * @param {Axis} axis
 * @param {Direction} dir
 * @returns {CommandWithView}
 */
function arrow(axis, dir) {
    return (state, dispatch, view) => {
        if (dispatch) {
            const sel = state.selection;
            if (sel instanceof CellSelection) {
                return maybeSetSelection(state, dispatch, Selection.near(sel.$headCell, dir));
            }
            if (axis !== "horiz" && !sel.empty) {
                return false;
            }
            const end = view ? atEndOfCell(view, axis, dir) : null;
            if (end === null) {
                return false;
            }
            if (axis === "horiz") {
                return maybeSetSelection(state, dispatch, Selection.near(state.doc.resolve(sel.head + dir), dir));
            }
            const $cell = state.doc.resolve(end);
            const $next = nextCell($cell, axis, dir);
            let newSel;
            if ($next) {
                newSel = Selection.near($next, 1);
            } else if (dir < 0) {
                newSel = Selection.near(state.doc.resolve($cell.before(-1)), -1);
            } else {
                newSel = Selection.near(state.doc.resolve($cell.after(-1)), 1);
            }
            return maybeSetSelection(state, dispatch, newSel);
        }

        return true;
    };
}

/**
 * @param {Axis} axis
 * @param {Direction} dir
 * @returns {CommandWithView}
 */
function shiftArrow(axis, dir) {
    return (state, dispatch, view) => {
        let sel = state.selection;
        if (!(sel instanceof CellSelection)) {
            const end = view ? atEndOfCell(view, axis, dir) : null;
            if (end === null) {
                return false;
            }
            sel = new CellSelection(state.doc.resolve(end));
        }

        // FIXME
        // for type safety🤷
        if (!(sel instanceof CellSelection)) throw new Error("CellSelection is not instanceof CellSelection");

        const $head = nextCell(sel.$headCell, axis, dir);
        if (!$head) {
            return false;
        }
        if (dispatch) {
            return maybeSetSelection(state, dispatch, new CellSelection(sel.$anchorCell, $head));
        }

        return true;
    };
}

/**
 * @type {CommandWithView}
 */
function deleteCellSelection(state, dispatch) {
    const sel = state.selection;
    if (!(sel instanceof CellSelection)) {
        return false;
    }
    if (dispatch) {
        const { tr } = state;
        const newNode = tableNodeTypes(state.schema).cell.createAndFill();
        if (!newNode) return false;

        const baseContent = newNode.content;
        sel.forEachCell((cell, pos) => {
            if (!cell.content.eq(baseContent)) {
                tr.replace(
                    tr.mapping.map(pos + 1),
                    tr.mapping.map(pos + cell.nodeSize - 1),
                    new Slice(baseContent, 0, 0),
                );
            }
        });
        if (tr.docChanged) {
            dispatch(tr);
        }
    }
    return true;
}

/**
 * @param {EditorView} view
 * @param {MouseEvent} event
 */
export function handleMouseDown(view, event) {
    const startEvent = event;
    if (startEvent.ctrlKey || startEvent.metaKey) {
        return false;
    }

    // FIXME
    // 不处理右键点击（触发上下文菜单，在mac下，`ctrl`+点击也会触发上下文菜单）
    // if (event.buttons === 2 || (event.ctrlKey && event.buttons === 1)) {
    //     // 如果已选中单元格触发上下文菜单，则需要阻止默认事件，防止选区被移除
    //     if (view.state.selection instanceof CellSelection) {
    //         event.preventDefault();
    //         event.stopPropagation();
    //         return;
    //     }
    // }

    const target = startEvent.target;
    if (!(target instanceof Node)) return false;
    const startDOMCell = domInCell(view, target);

    const $anchor = cellAround(view.state.selection.$anchor);

    if (startEvent.shiftKey && view.state.selection instanceof CellSelection) {
        // Adding to an existing cell selection
        setCellSelection(view.state.selection.$anchorCell, startEvent);
        startEvent.preventDefault();
    } else if (
        startEvent.shiftKey &&
        startDOMCell &&
        $anchor !== null &&
        cellUnderMouse(view, startEvent)?.pos !== $anchor.pos
    ) {
        // Adding to a selection that starts in another cell (causing a
        // cell selection to be created).
        setCellSelection($anchor, startEvent);
        startEvent.preventDefault();
    } else if (!startDOMCell) {
        // Not in a cell, let the default behavior happen.
        return false;
    }

    /**
     * Create and dispatch a cell selection between the given anchor and
     * the position under the mouse.
     * @param {ResolvedPos} $selectionAnchor
     * @param {Event} event
     * @returns {boolean | undefined}
     */
    function setCellSelection($selectionAnchor, event) {
        let $head = cellUnderMouse(view, event);
        const starting = TABLE_EDITING_KEY.getState(view.state) == null;
        if (!$head || !inSameTable($selectionAnchor, $head)) {
            if (starting) {
                $head = $selectionAnchor;
            } else {
                return false;
            }
        }
        const selection = new CellSelection($selectionAnchor, $head);
        if (starting || !view.state.selection.eq(selection)) {
            const tr = view.state.tr.setSelection(selection);
            if (starting) {
                tr.setMeta(TABLE_EDITING_KEY, $selectionAnchor.pos);
            }
            view.dispatch(tr);
        }

        return;
    }

    // Stop listening to mouse motion events.
    function stop() {
        view.root.removeEventListener("mouseup", stop);
        view.root.removeEventListener("dragstart", stop);
        view.root.removeEventListener("mousemove", move);
        if (TABLE_EDITING_KEY.getState(view.state) != null) {
            view.dispatch(view.state.tr.setMeta(TABLE_EDITING_KEY, -1));
        }
    }

    /**
     * @param {Event} event
     */
    function move(event) {
        const anchor = TABLE_EDITING_KEY.getState(view.state);
        const target = event.target;
        if (!(target instanceof Node)) return;

        let $moveAnchor;
        if (anchor != null) {
            // Continuing an existing cross-cell selection
            $moveAnchor = view.state.doc.resolve(anchor);
        } else if (domInCell(view, target) !== startDOMCell) {
            // Moving out of the initial cell -- start a new cell selection
            $moveAnchor = cellUnderMouse(view, startEvent);

            if (!$moveAnchor) {
                stop();
                return;
            }
        }
        if ($moveAnchor) {
            setCellSelection($moveAnchor, event);
            event.preventDefault();
        }
    }
    view.root.addEventListener("mouseup", stop);
    view.root.addEventListener("dragstart", stop);
    view.root.addEventListener("mousemove", move);

    return false;
}

/**
 * @param {EditorView} view
 * @param {number} pos
 * @returns {boolean}
 */
export function handleTripleClick(view, pos) {
    const { doc } = view.state;
    const $cell = cellAround(doc.resolve(pos));
    if (!$cell) {
        return false;
    }
    view.dispatch(view.state.tr.setSelection(new CellSelection($cell)));
    return true;
}

// #endregion

//#region Helpers

/**
 * @param {EditorState} state
 * @param {Dispatch} dispatch
 * @param {Selection} selection
 */
function maybeSetSelection(state, dispatch, selection) {
    if (selection.eq(state.selection)) {
        return false;
    }
    if (dispatch) {
        dispatch(state.tr.setSelection(selection).scrollIntoView());
    }
    return true;
}

/**
 * Check whether the cursor is at the end of a cell (so that further
 * motion would move out of the cell)
 *
 * @param {EditorView} view
 * @param {Axis} axis
 * @param {Direction} dir
 */
function atEndOfCell(view, axis, dir) {
    if (!(view.state.selection instanceof TextSelection)) {
        return null;
    }
    const { $head } = view.state.selection;
    for (let d = $head.depth - 1; d >= 0; d--) {
        const parent = $head.node(d);
        const index = dir < 0 ? $head.index(d) : $head.indexAfter(d);
        if (index !== (dir < 0 ? 0 : parent.childCount)) {
            return null;
        }
        if (parent.type.spec.tableRole === "cell" || parent.type.spec.tableRole === "header_cell") {
            const cellPos = $head.before(d);
            const dirStr =
                // eslint-disable-next-line no-nested-ternary
                axis === "vert" ? (dir > 0 ? "down" : "up") : dir > 0 ? "right" : "left";
            return view.endOfTextblock(dirStr) ? cellPos : null;
        }
    }
    return null;
}

/**
 * @param {EditorView} view
 * @param {Node?} [inputDom]
 */
function domInCell(view, inputDom) {
    let dom = inputDom;
    for (; dom && dom !== view.dom; dom = dom.parentNode) {
        if (dom.nodeName === "TD" || dom.nodeName === "TH") {
            return dom;
        }
    }
    return null;
}

/**
 * @param {EditorView} view
 * @param {Event} event
 */
function cellUnderMouse(view, event) {
    if (!(event instanceof MouseEvent)) return null;
    const mousePos = view.posAtCoords({
        left: event.clientX,
        top: event.clientY,
    });

    if (!mousePos) {
        return null;
    }
    return cellAround(view.state.doc.resolve(mousePos.pos));
}

//#endregion
