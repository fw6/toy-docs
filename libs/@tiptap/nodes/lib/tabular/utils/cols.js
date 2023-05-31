import { decimalRounding } from "@local/shared";
import { TableMap } from "../helpers/table-map";
import { tableNodeTypes } from "./node-types";
import { findCellRectClosestToPos, isSelectionType, isTableSelected } from "./selection";
import { addColSpan, assertColspan, removeColSpan } from "./spaning";
import { findTable, generateColwidths, removeTable } from "./tables";
import { setTextSelection } from "./transforms";

/**
 * Returns a new transaction that adds a new column at index `columnIndex`.
 * @param {number} columnIndex
 * @returns {(tr: Transaction) => Transaction}
 */
export const addColumnAt = (columnIndex) => (tr) => {
    const table = findTable(tr.selection);
    if (table) {
        const map = TableMap.get(table.node);
        if (columnIndex >= 0 && columnIndex <= map.width) {
            return addColumn(
                tr,
                {
                    map,
                    tableStart: table.start,
                    table: table.node,
                },
                columnIndex,
            );
        }
    }

    return tr;
};

/**
 * Add a column at the given position in a table.
 *
 * @param {Transaction} tr
 * @param {import("../helpers/table-map").TableContext} context
 * @param {number} col
 * @returns {Transaction}
 */
export function addColumn(tr, { map, tableStart, table }, col) {
    /** @type {number | null} */
    const refColumn = col > 0 ? -1 : 0;

    for (let row = 0; row < map.height; row++) {
        const index = row * map.width + col;

        // If this position falls inside a col-spanning cell
        if (col > 0 && col < map.width && map.map[index - 1] === map.map[index]) {
            const pos = map.map[index];
            const cell = table.nodeAt(pos);
            if (!cell) {
                throw new Error(`addColumn: invalid cell for pos ${pos}`);
            }
            const attributes = cell.attrs;
            assertColspan(attributes);

            tr.setNodeMarkup(
                tr.mapping.map(tableStart + pos),
                undefined,
                addColSpan(attributes, col - map.colCount(pos)),
            );
            // Skip ahead if rowspan > 1
            row += attributes.rowspan - 1;
        } else {
            /** @type {NodeType} */
            let type;

            if (refColumn === null) {
                type = tableNodeTypes(table.type.schema).cell;
            } else {
                const mappedPos = map.map[index + refColumn];
                const cell = table.nodeAt(mappedPos);
                if (!cell) {
                    throw new Error(`addColumn: invalid node at mapped pos ${mappedPos}`);
                }
                type = cell.type;
            }
            const pos = map.positionAt(row, col, table);
            const newNode = type.createAndFill();
            if (newNode) tr.insert(tr.mapping.map(tableStart + pos), newNode);
        }
    }

    return tr;
}

/**
 * @param {Transaction} tr
 * @param {import("../helpers/table-map").TableContext} context
 * @param {number} columnIndex
 * @returns {Transaction}
 */
export function removeColumn(tr, { map, table, tableStart }, columnIndex) {
    const mapStart = tr.mapping.maps.length;

    for (let row = 0; row < map.height; ) {
        const index = row * map.width + columnIndex;
        const pos = map.map[index];
        const cell = table.nodeAt(pos);
        if (!cell) {
            continue;
        }

        // If this is part of a col-spanning cell
        if (
            (columnIndex > 0 && map.map[index - 1] === pos) ||
            (columnIndex < map.width - 1 && map.map[index + 1] === pos)
        ) {
            tr.setNodeMarkup(
                tr.mapping.slice(mapStart).map(tableStart + pos),
                undefined,
                removeColSpan(cell.attrs, columnIndex - map.colCount(pos)),
            );
        } else {
            const start = tr.mapping.slice(mapStart).map(tableStart + pos);
            tr.delete(start, start + cell.nodeSize);
        }

        row += cell.attrs.rowspan;
    }

    return tr;
}

/**
 * Returns a new transaction that removes a column at index `columnIndex`. If there is only one column left, it will remove the entire table.
 * @param {number} columnIndex
 * @returns {(tr: Transaction) => Transaction}
 */
export const removeColumnAt = (columnIndex) => (tr) => {
    const table = findTable(tr.selection);
    if (table) {
        const map = TableMap.get(table.node);
        if (columnIndex === 0 && map.width === 1) {
            return removeTable(tr);
        } else if (columnIndex >= 0 && columnIndex <= map.width) {
            removeColumn(
                tr,
                {
                    map,
                    tableStart: table.start,
                    table: table.node,
                },
                columnIndex,
            );
            return tr;
        }
    }

    return tr;
};

/**
 * Returns a new transaction that removes selected columns.
 * @param {Transaction} tr
 * @returns {Transaction}
 */
export const removeSelectedColumns = (tr) => {
    const { selection } = tr;
    if (isTableSelected(selection)) {
        return removeTable(tr);
    }
    if (isSelectionType(selection, "cell")) {
        const table = findTable(selection);
        if (table) {
            const map = TableMap.get(table.node);
            const rect = map.rectBetween(
                selection.$anchorCell.pos - table.start,
                selection.$headCell.pos - table.start,
            );

            if (rect.left === 0 && rect.right === map.width) {
                return tr;
            }

            const pmTableRect = {
                ...rect,
                map,
                table: table.node,
                tableStart: table.start,
            };

            for (let i = pmTableRect.right - 1; ; i--) {
                removeColumn(tr, pmTableRect, i);
                if (i === pmTableRect.left) {
                    break;
                }
                const newTable = pmTableRect.tableStart ? tr.doc.nodeAt(pmTableRect.tableStart - 1) : tr.doc;
                if (newTable) pmTableRect.table = newTable;
                pmTableRect.map = TableMap.get(pmTableRect.table);
            }

            const colwidths = getColwidthsAfterDelete(pmTableRect.table, pmTableRect.map, [
                pmTableRect.left,
                pmTableRect.right,
            ]);
            tr.setNodeAttribute(pmTableRect.tableStart - 1, "colwidths", colwidths);

            return tr;
        }
    }

    return tr;
};

/**
 * Returns a new transaction that removes a column closest to a given `$pos`.
 * @param {ResolvedPos} $pos
 * @returns {(tr: Transaction) => Transaction}
 */
export const removeColumnClosestToPos = ($pos) => (_tr) => {
    let tr = _tr;
    const rect = findCellRectClosestToPos($pos);
    if (rect) {
        tr = removeColumnAt(rect.left)(setTextSelection($pos.pos)(tr));

        const table = findTable(tr.selection);
        if (table) {
            const map = TableMap.get(table.node);
            const colwidths = getColwidthsAfterDelete(table.node, map, [rect.left, rect.left + 1]);
            tr = tr.setNodeAttribute(table.pos, "colwidths", colwidths);
        }
    }

    return tr;
};

/**
 * Overwrite allocates remaining column space
 *
 * @param {PMNode} table
 * @param {TableMap} map
 * @param {[number, number]} range
 *
 * @returns {number[]}
 */
const getColwidthsAfterDelete = (table, map, range) => {
    /** @type {number[]} */
    let colwidths = table.attrs.colwidths;
    if (!colwidths.length) {
        colwidths = generateColwidths(map.width);
    } else {
        const [left, right] = range;
        const removedWidth = colwidths.slice(left, right).reduce((a, b) => a + b, 0);

        colwidths = colwidths.flatMap((width, i) => {
            if (i < left || i >= right) {
                return decimalRounding(width * (1 + removedWidth / (100 - removedWidth)), 2);
            }
            return [];
        });
    }

    return colwidths;
};
