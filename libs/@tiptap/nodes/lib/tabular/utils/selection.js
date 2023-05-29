/**
 * @typedef {import('@tiptap/pm/state').Selection} Selection
 * @typedef {object} RangePos
 * @property {ResolvedPos} $from
 * @property {ResolvedPos} $to
 */

import { NodeSelection, SelectionRange, TextSelection } from "@tiptap/pm/state";
import { CellSelection } from "../helpers/cell-selection";
import { TableMap } from "../helpers/table-map";

/**
 * @param {ResolvedPos} $anchorCell
 * @param {ResolvedPos} $headCell
 */
export function getCellSelectionRanges($anchorCell, $headCell) {
    const table = $anchorCell.node(-1);
    const map = TableMap.get(table);
    const start = $anchorCell.start(-1);
    const rect = map.rectBetween($anchorCell.pos - start, $headCell.pos - start);
    const doc = $anchorCell.node(0);
    const cells = map.cellsInRect(rect).filter((p) => p !== $headCell.pos - start);
    // Make the head cell the first range, so that it counts as the
    // primary part of the selection
    cells.unshift($headCell.pos - start);

    return cells.map((pos) => {
        const cell = table.nodeAt(pos);
        if (cell === null) {
            throw new Error(`No cell at position ${pos}`);
        }
        const from = pos + start + 1;

        return new SelectionRange(doc.resolve(from), doc.resolve(from + cell.content.size));
    });
}

/**
 * @type {IsSelectionType}
 */
// @ts-ignore
export const isSelectionType = (selection, type) => {
    if (!selection) {
        return false;
    }
    const serialized = selection.toJSON();
    return serialized.type === type;
};

/**
 * @param {EditorState} state
 * @param {Transaction} [transaction]
 * @param {boolean} [allowTableNodeSelection]
 *
 */
export function normalizeSelection(state, transaction, allowTableNodeSelection) {
    let tr = transaction;
    const sel = (tr || state).selection;
    const { doc } = tr || state;
    /** @type {Selection | undefined} */
    let normalize;
    /** @type {string | undefined} */
    let role;
    if (sel instanceof NodeSelection) {
        role = sel.node.type.spec.tableRole;
    }
    if (sel instanceof NodeSelection && role) {
        if (role === "cell" || role === "header_cell") {
            normalize = CellSelection.create(doc, sel.from);
        } else if (role === "row") {
            const $cell = doc.resolve(sel.from + 1);
            normalize = CellSelection.rowSelection($cell, $cell);
        } else if (!allowTableNodeSelection) {
            const map = TableMap.get(sel.node);
            const start = sel.from + 1;
            const lastCell = start + map.map[map.width * map.height - 1];
            normalize = CellSelection.create(doc, start + 1, lastCell);
        }
    } else if (sel instanceof TextSelection && isCellBoundarySelection(sel)) {
        normalize = TextSelection.create(doc, sel.from);
    } else if (sel instanceof TextSelection && isTextSelectionAcrossCells(sel)) {
        normalize = TextSelection.create(doc, sel.$from.start(), sel.$from.end());
    }
    if (normalize) {
        tr ||= state.tr;
        tr.setSelection(normalize);
    }

    return tr;
}

/**
 * @param {RangePos} range
 * @returns {boolean}
 */
function isCellBoundarySelection({ $from, $to }) {
    if ($from.pos === $to.pos || $from.pos < $from.pos - 6) {
        return false;
    } // Cheap elimination
    let afterFrom = $from.pos;
    let beforeTo = $to.pos;
    let { depth } = $from;
    for (; depth >= 0; depth--, afterFrom++) {
        if ($from.after(depth + 1) < $from.end(depth)) {
            break;
        }
    }
    for (let d = $to.depth; d >= 0; d--, beforeTo--) {
        if ($to.before(d + 1) > $to.start(d)) {
            break;
        }
    }
    return afterFrom === beforeTo && /row|table/.test($from.node(depth).type.spec.tableRole);
}

/**
 * @param {RangePos} range
 * @returns {boolean}
 */
function isTextSelectionAcrossCells({ $from, $to }) {
    let fromCellBoundaryNode;
    let toCellBoundaryNode;
    for (let i = $from.depth; i > 0; i--) {
        const node = $from.node(i);
        if (node.type.spec.tableRole === "cell" || node.type.spec.tableRole === "header_cell") {
            fromCellBoundaryNode = node;
            break;
        }
    }
    for (let i = $to.depth; i > 0; i--) {
        const node = $to.node(i);
        if (node.type.spec.tableRole === "cell" || node.type.spec.tableRole === "header_cell") {
            toCellBoundaryNode = node;
            break;
        }
    }
    return fromCellBoundaryNode !== toCellBoundaryNode && $to.parentOffset === 0;
}
