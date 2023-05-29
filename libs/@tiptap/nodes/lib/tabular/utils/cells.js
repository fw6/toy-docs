import { TableMap } from "../helpers/table-map";
import { isSelectionType } from "./selection";

/**
 * @typedef {import('@tiptap/pm/state').Selection} Selection
 */

/**
 * @param {ResolvedPos} $pos
 */
export function pointsAtCell($pos) {
    return $pos.parent.type.spec.tableRole === "row" && $pos.nodeAfter;
}

/**
 * @param {ResolvedPos} $pos
 * @returns {ResolvedPos | null}
 */
export function cellNear($pos) {
    for (let after = $pos.nodeAfter, { pos } = $pos; after; after = after.firstChild, pos++) {
        const role = after.type.spec.tableRole;
        if (role === "cell" || role === "header_cell") {
            return $pos.doc.resolve(pos);
        }
    }
    for (let before = $pos.nodeBefore, { pos } = $pos; before; before = before.lastChild, pos--) {
        const role = before.type.spec.tableRole;
        if (role === "cell" || role === "header_cell") {
            return $pos.doc.resolve(pos - before.nodeSize);
        }
    }

    return null;
}

/**
 * @param {ResolvedPos} $pos
 * @returns {ResolvedPos | null}
 */
export function cellAround($pos) {
    for (let d = $pos.depth - 1; d > 0; d--) {
        if ($pos.node(d).type.spec.tableRole === "row") {
            return $pos.node(0).resolve($pos.before(d + 1));
        }
    }
    return null;
}

/**
 * @param {ResolvedPos} $pos
 * @param {Axis} axis
 * @param {number} dir
 *
 * @returns {ResolvedPos | null}
 */
export function nextCell($pos, axis, dir) {
    const start = $pos.start(-1);
    const map = TableMap.get($pos.node(-1));
    const moved = map.nextCell($pos.pos - start, axis, dir);
    return moved == null ? null : $pos.node(0).resolve(start + moved);
}

/**
 * @param {Selection} selection
 * @returns {ResolvedPos | null}
 */
export function selectionCell(selection) {
    if (isSelectionType(selection, "cell")) {
        return selection.$anchorCell.pos > selection.$headCell.pos ? selection.$anchorCell : selection.$headCell;
    }

    if (isSelectionType(selection, "node") && selection.node.type.spec.tableRole === "cell") {
        return selection.$anchor;
    }

    return cellAround(selection.$head) || cellNear(selection.$head);
}

/**
 * @param {ResolvedPos} $pos
 */
export function moveCellForward($pos) {
    return $pos.node(0).resolve($pos.pos + ($pos.nodeAfter?.nodeSize || 0));
}

/**
 * @param {PMNode} cell
 */
export function isEmptyCell(cell) {
    const { content } = cell;
    return (
        content.childCount === 1 &&
        content.firstChild &&
        content.firstChild.isTextblock &&
        content.firstChild.childCount === 0
    );
}
