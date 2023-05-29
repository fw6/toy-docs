/**
 * @typedef {import('@tiptap/pm/state').Selection} Selection
 * @typedef {object} RangePos
 * @property {ResolvedPos} $from
 * @property {ResolvedPos} $to
 */

import { findParentNodeClosestToPos } from "@tiptap/core";
import { NodeSelection, SelectionRange, TextSelection } from "@tiptap/pm/state";
import { CellSelection } from "../helpers/cell-selection";
import { Rect, TableMap } from "../helpers/table-map";
import { selectionCell } from "./cells";

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

/**
 * @typedef {Rect & import("../helpers/table-map").TableContext} SelectionRect
 */

/**
 * Helper to get the selected rectangle in a table, if any. Adds table
 * map, table node, and table start offset to the object for
 * convenience.
 *
 * @param {EditorState} state
 * @returns {SelectionRect}
 */
export function selectedRect(state) {
    const sel = state.selection;
    const $pos = selectionCell(sel);
    if (!$pos) {
        throw new Error("selectedRect: invalid $pos for selection");
    }
    const table = $pos.node(-1);
    const tableStart = $pos.start(-1);
    const map = TableMap.get(table);

    /** @type {Rect} */
    let rect;

    if (sel instanceof CellSelection) {
        rect = map.rectBetween(sel.$anchorCell.pos - tableStart, sel.$headCell.pos - tableStart);
    } else {
        rect = map.findCell($pos.pos - tableStart);
    }

    return {
        ...rect,
        table,
        map,
        tableStart,
    };
}

/**
 * @param {EditorState} state
 * @returns {Rect | undefined}
 */
export const getClosestSelectionRect = (state) => {
    const selection = state.selection;
    return isSelectionType(selection, "cell") ? getSelectionRect(selection) : findCellRectClosestToPos(selection.$from);
};

/**
 * Checks if entire table is selected
 *
 * @param {import('@tiptap/pm/state').Selection} selection
 * @returns {boolean}
 */
export const isTableSelected = (selection) => {
    if (isSelectionType(selection, "cell")) {
        const map = TableMap.get(selection.$anchorCell.node(-1));
        return isRectSelected({
            left: 0,
            right: map.width,
            top: 0,
            bottom: map.height,
        })(selection);
    }

    return false;
};

/**
 * Checks if a given CellSelection rect is selected
 * @param {Rect} rect
 * @returns {(selection: import('@tiptap/pm/state').Selection) => boolean}
 */
export const isRectSelected = (rect) => (selection) => {
    if (!isSelectionType(selection, "cell")) {
        return false;
    }

    const map = TableMap.get(selection.$anchorCell.node(-1));
    const start = selection.$anchorCell.start(-1);
    const cells = map.cellsInRect(rect);
    const selectedCells = map.cellsInRect(
        map.rectBetween(selection.$anchorCell.pos - start, selection.$headCell.pos - start),
    );

    for (let i = 0, count = cells.length; i < count; i++) {
        if (selectedCells.indexOf(cells[i]) === -1) {
            return false;
        }
    }

    return true;
};

/**
 * Returns the rectangle spanning a cell closest to a given `$pos`.
 *
 * @param {ResolvedPos} $pos
 * @returns {Rect | undefined}
 */
export const findCellRectClosestToPos = ($pos) => {
    const cell = findCellClosestToPos($pos);
    if (cell) {
        const table = findTableClosestToPos($pos);
        if (table) {
            const map = TableMap.get(table.node);
            const cellPos = cell.pos - table.start;

            return map.rectBetween(cellPos, cellPos);
        }
    }

    return;
};

/**
 * Iterates over parent nodes, returning a table cell or a table header node closest to a given `$pos`.
 * @param {ResolvedPos} $pos
 * @returns {ContentNodeWithPos | undefined}
 */
export const findCellClosestToPos = ($pos) => {
    /** @type {Predicate} */
    const predicate = (node) => node.type.spec.tableRole && /cell/i.test(node.type.spec.tableRole);

    return findParentNodeClosestToPos($pos, predicate);
};

/**
 * Iterates over parent nodes, returning a table node closest to a given `$pos`.
 *
 * @param {ResolvedPos} $pos
 * @returns {ContentNodeWithPos | undefined}
 */
export const findTableClosestToPos = ($pos) => {
    /** @type {Predicate} */
    const predicate = (node) => node.type.spec.tableRole && node.type.spec.tableRole === "table";

    return findParentNodeClosestToPos($pos, predicate);
};

/**
 * Get the selection rectangle. Returns `undefined` if selection is not a CellSelection.
 * @param {import('@tiptap/pm/state').Selection} selection
 * @returns {Rect | undefined}
 */
export const getSelectionRect = (selection) => {
    if (!isSelectionType(selection, "cell")) {
        return;
    }

    const start = selection.$anchorCell.start(-1);
    const map = TableMap.get(selection.$anchorCell.node(-1));

    return map.rectBetween(selection.$anchorCell.pos - start, selection.$headCell.pos - start);
};
