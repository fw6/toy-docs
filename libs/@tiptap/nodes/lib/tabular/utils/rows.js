import { safeInsert } from "@misky/prose-utils";
import { setCellAttrs } from "../commands/misc";
import { TableMap } from "../helpers/table-map";
import { tableNodeTypes } from "./node-types";
import { findCellRectClosestToPos, isSelectionType, isTableSelected } from "./selection";
import { findTable, removeTable } from "./tables";
import { cloneTr, setTextSelection } from "./transforms";

/**
 * @param {Schema} schema
 * @returns {(insertNewRowIndex: number) => (tr: Transaction) => Transaction}
 */
export const copyPreviousRow = (schema) => (insertNewRowIndex) => (tr) => {
    const table = findTable(tr.selection);
    if (!table) {
        return tr;
    }

    const map = TableMap.get(table.node);
    const copyPreviousRowIndex = insertNewRowIndex - 1;

    if (insertNewRowIndex <= 0) {
        throw Error(`Row Index less or equal 0 isn't not allowed since there is not a previous to copy`);
    }

    if (insertNewRowIndex > map.height) {
        return tr;
    }

    const tableNode = table.node;
    const {
        nodes: { tableRow },
    } = schema;

    const cellsInRow = map.cellsInRect({
        left: 0,
        right: map.width,
        top: copyPreviousRowIndex,
        bottom: copyPreviousRowIndex + 1,
    });
    const offsetIndexPosition = copyPreviousRowIndex * map.width;
    const offsetNextLineIndexPosition = insertNewRowIndex * map.width;
    const cellsPositionsInOriginalRow = map.map.slice(offsetIndexPosition, offsetIndexPosition + map.width);

    const cellsPositionsInNextRow = map.map.slice(offsetNextLineIndexPosition, offsetNextLineIndexPosition + map.width);

    /** @type {PMNode[]} */
    const cells = [];
    /** @type {{ pos: number; node: PMNode }[]} */
    const fixRowspans = [];

    for (let i = 0; i < cellsPositionsInOriginalRow.length; ) {
        const pos = cellsPositionsInOriginalRow[i];
        const documentCellPos = pos + table.start;
        const node = tr.doc.nodeAt(documentCellPos);
        if (!node) {
            continue;
        }

        const attributes = {
            ...node.attrs,
            colspan: 1,
            rowspan: 1,
        };

        const newCell = node.type.createAndFill(attributes);

        if (!newCell) {
            return tr;
        }

        if (cellsPositionsInNextRow.indexOf(pos) > -1) {
            fixRowspans.push({ pos: documentCellPos, node });
        } else if (cellsInRow.indexOf(pos) > -1) {
            if (node.attrs.colspan > 1) {
                const newCellWithColspanFixed = node.type.createAndFill({
                    ...attributes,
                    colspan: node.attrs.colspan,
                });

                if (!newCellWithColspanFixed) {
                    return tr;
                }

                cells.push(newCellWithColspanFixed);
                i = i + node.attrs.colspan;

                continue;
            }
            cells.push(newCell);
        } else {
            cells.push(newCell);
        }

        i++;
    }

    fixRowspans.forEach((cell) => {
        tr.setNodeMarkup(cell.pos, undefined, {
            ...cell.node.attrs,
            rowspan: cell.node.attrs.rowspan + 1,
        });
    });

    const cloneRow = tableNode.child(copyPreviousRowIndex);
    let rowPos = table.start;
    for (let i = 0; i < insertNewRowIndex; i++) {
        rowPos += tableNode.child(i).nodeSize;
    }

    return safeInsert(tableRow.createChecked(cloneRow.attrs, cells, cloneRow.marks), rowPos)(tr);
};

/**
 * Returns a new transaction that adds a new row at index `rowIndex`. Optionally clone the previous row.
 *
 * @param {number} rowIndex
 * @param {boolean} [clonePreviousRow]
 * @returns {(tr: Transaction) => Transaction}
 */
export const addRowAt = (rowIndex, clonePreviousRow) => (tr) => {
    const table = findTable(tr.selection);
    if (table) {
        const map = TableMap.get(table.node);
        const cloneRowIndex = rowIndex - 1;

        if (clonePreviousRow && cloneRowIndex >= 0) {
            return cloneTr(cloneRowAt(cloneRowIndex)(tr));
        }

        if (rowIndex >= 0 && rowIndex <= map.height) {
            return cloneTr(
                addRow(
                    tr,
                    {
                        map,
                        tableStart: table.start,
                        table: table.node,
                    },
                    rowIndex,
                ),
            );
        }
    }

    return tr;
};

/**
 * @param {Transaction} tr
 * @param {import("../helpers/table-map").TableContext} context
 * @param {number} row
 * @returns {Transaction}
 */
export function addRow(tr, { map, tableStart, table }, row) {
    let rowPos = tableStart;
    for (let i = 0; i < row; i++) {
        rowPos += table.child(i).nodeSize;
    }
    const cells = [];
    const refRow = row > 0 ? -1 : 0;

    for (let col = 0, index = map.width * row; col < map.width; col++, index++) {
        // Covered by a rowspan cell
        if (row > 0 && row < map.height && map.map[index] === map.map[index - map.width]) {
            const pos = map.map[index];
            const node = table.nodeAt(pos);
            if (!node) {
                throw new Error(`addRow: node not found at pos ${pos}`);
            }

            const { attrs } = node;
            tr.setNodeMarkup(tableStart + pos, undefined, {
                ...attrs,
                rowspan: attrs.rowspan + 1,
            });
            col += attrs.colspan - 1;
        } else {
            /** @type {NodeType} */
            let type;

            if (refRow == null) {
                type = tableNodeTypes(table.type.schema).cell;
            } else {
                const mappedPos = map.map[index + refRow * map.width];
                const cell = table.nodeAt(mappedPos);
                if (!cell) {
                    throw new Error(`addRow: invalid node at mapped pos ${mappedPos}`);
                }
                type = cell.type;
            }
            const node = type.createAndFill();
            node && cells.push(node);
        }
    }
    const rowType = tableNodeTypes(table.type.schema).row;
    const rowCells = rowType.create(null, cells);
    tr.insert(rowPos, rowCells);

    return tr;
}

/**
 * @param {Transaction} tr
 * @param {import("../helpers/table-map").TableContext} context
 * @param {number} rowIndex
 * @returns {Transaction}
 */
function removeRow(tr, { map, table, tableStart }, rowIndex) {
    let rowPos = 0;
    for (let i = 0; i < rowIndex; i++) {
        rowPos += table.child(i).nodeSize;
    }
    const nextRow = rowPos + table.child(rowIndex).nodeSize;

    const mapFrom = tr.mapping.maps.length;
    tr.delete(rowPos + tableStart, nextRow + tableStart);

    for (let col = 0, index = rowIndex * map.width; col < map.width; col++, index++) {
        const pos = map.map[index];
        if (rowIndex > 0 && pos === map.map[index - map.width]) {
            // If this cell starts in the row above, simply reduce its rowspan
            const cell = table.nodeAt(pos);
            if (!cell) {
                continue;
            }
            const attrs = cell.attrs;
            tr.setNodeMarkup(tr.mapping.slice(mapFrom).map(pos + tableStart), undefined, {
                ...attrs,
                rowspan: attrs.rowspan - 1,
            });
            col += attrs.colspan - 1;
        } else if (rowIndex < map.width && pos === map.map[index + map.width]) {
            // Else, if it continues in the row below, it has to be moved down
            const cell = table.nodeAt(pos);
            if (!cell) {
                continue;
            }
            const copy = cell.type.create({ ...cell.attrs, rowspan: cell.attrs.rowspan - 1 }, cell.content);
            const newPos = map.positionAt(rowIndex + 1, col, table);
            tr.insert(tr.mapping.slice(mapFrom).map(tableStart + newPos), copy);
            col += cell.attrs.colspan - 1;
        }
    }

    return tr;
}

/**
 * Returns a new transaction that removes a row at index `rowIndex`. If there is only one row left, it will remove the entire table.
 *
 * @param {number} rowIndex
 * @returns {(tr: Transaction) => Transaction}
 */
export const removeRowAt = (rowIndex) => (tr) => {
    const table = findTable(tr.selection);
    if (table) {
        const map = TableMap.get(table.node);
        if (rowIndex === 0 && map.height === 1) {
            return removeTable(tr);
        } else if (rowIndex >= 0 && rowIndex <= map.height) {
            removeRow(
                tr,
                {
                    map,
                    tableStart: table.start,
                    table: table.node,
                },
                rowIndex,
            );
            return cloneTr(tr);
        }
    }

    return tr;
};

/**
 * Returns a new transaction that removes a row closest to a given `$pos`.
 *
 * @param {ResolvedPos} $pos
 * @returns {(tr: Transaction) => Transaction}
 */
export const removeRowClosestToPos = ($pos) => (tr) => {
    const rect = findCellRectClosestToPos($pos);
    if (rect) {
        return removeRowAt(rect.top)(setTextSelection($pos.pos)(tr));
    }
    return tr;
};

/**
 * Returns a new transaction that removes selected rows.
 * If the whole table is selected, it will be removed.
 *
 * @type {(tr: Transaction) => Transaction}
 */
export const removeSelectedRows = (tr) => {
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

            if (rect.top === 0 && rect.bottom === map.height) {
                return tr;
            }

            const pmTableRect = {
                ...rect,
                map,
                table: table.node,
                tableStart: table.start,
            };

            for (let i = pmTableRect.bottom - 1; ; i--) {
                removeRow(tr, pmTableRect, i);
                if (i === pmTableRect.top) {
                    break;
                }
                const tableNode = pmTableRect.tableStart ? tr.doc.nodeAt(pmTableRect.tableStart - 1) : tr.doc;
                if (tableNode) pmTableRect.table = tableNode;
                pmTableRect.map = TableMap.get(pmTableRect.table);
            }

            return cloneTr(tr);
        }
    }

    return tr;
};

/**
 * returns an object with the node, the position and the section index of a row in a table
 *
 * @param {PMNode} table
 * @param {number} row
 * @returns {{ node: PMNode | null; pos: number; section: number }}
 */
export function getRow(table, row) {
    let rPos = 0;
    let prevSectionsRows = 0;
    let sectionIndex = -1;
    for (let tc = 0; tc < table.childCount; tc++) {
        const section = table.child(tc);
        if (section.type.spec.tableRole === "table") {
            sectionIndex++;
            const sectionRows = section.childCount;
            if (sectionRows > 0) {
                // if (debug)
                //   console.log(
                //     `looking for row ${row} in section ${s}: ${section.type.name} with ${sectionRows} rows; prevSectionRows=${prevSectionsRows}`,
                //   );
                if (prevSectionsRows + sectionRows <= row) {
                    if (tc === table.childCount - 1) {
                        return {
                            node: null,
                            pos: rPos + section.nodeSize - 1,
                            section: sectionIndex,
                        };
                    }
                    rPos += section.nodeSize;
                    prevSectionsRows += sectionRows;
                } else {
                    rPos++; // section opening tag
                    let r = 0;
                    while (r < sectionRows) {
                        if (prevSectionsRows + r === row) break;
                        rPos += section.child(r).nodeSize;
                        r++;
                    }
                    if (r === sectionRows) rPos++;
                    // if (debug)
                    //   console.log(`row ${row} found @ pos ${rPos}, section ${s}`);
                    return {
                        node: r >= sectionRows ? null : section.child(r),
                        pos: rPos,
                        section: sectionIndex,
                    };
                }
            }
        } else {
            // caption
            rPos += section.nodeSize;
        }
    }
    return { node: null, pos: rPos, section: sectionIndex };
}

/**
 * :: (cloneRowIndex: number) → (tr: Transaction) → Transaction
 * Returns a new transaction that adds a new row after `cloneRowIndex`, cloning the row attributes at `cloneRowIndex`.
 *
 * ```javascript
 * dispatch(
 *   cloneRowAt(i)(state.tr)
 * );
 *
 * @param {number} rowIndex
 * @returns {(tr: Transaction) => Transaction}
```
 */
export const cloneRowAt = (rowIndex) => (_tr) => {
    let tr = _tr;
    const table = findTable(tr.selection);

    if (table) {
        const map = TableMap.get(table.node);

        if (rowIndex >= 0 && rowIndex <= map.height) {
            const tableNode = table.node;
            const tableNodes = tableNodeTypes(tableNode.type.schema);

            let rowPos = table.start;
            for (let i = 0; i < rowIndex + 1; i++) {
                rowPos += tableNode.child(i).nodeSize;
            }

            const cloneRow = tableNode.child(rowIndex);
            // Re-create the same nodes with same attrs, dropping the node content.
            /** @type {PMNode[]} */
            const cells = [];
            let rowWidth = 0;
            cloneRow.forEach((cell) => {
                // If we're copying a row with rowspan somewhere, we dont want to copy that cell
                // We'll increment its span below.
                if (cell.attrs.rowspan === 1) {
                    rowWidth += cell.attrs.colspan;
                    const cellNode = tableNodes[cell.type.spec.tableRole].createAndFill(cell.attrs, null, cell.marks);
                    if (cellNode) cells.push(cellNode);
                }
            });

            // If a higher row spans past our clone row, bump the higher row to cover this new row too.
            if (rowWidth < map.width) {
                const rowSpanCells = [];
                for (let i = rowIndex; i >= 0; i--) {
                    const foundCells = filterCellsInRow(i, (cell, tr) => {
                        const rowspan = cell.node.attrs.rowspan;
                        const spanRange = i + rowspan;
                        return rowspan > 1 && spanRange > rowIndex;
                    })(tr);
                    rowSpanCells.push(...foundCells);
                }

                if (rowSpanCells.length) {
                    rowSpanCells.forEach((cell) => {
                        tr = setCellAttrs(cell, {
                            rowspan: cell.node.attrs.rowspan + 1,
                        })(tr);
                    });
                }
            }

            return safeInsert(tableNodes.row.create(cloneRow.attrs, cells), rowPos)(tr);
        }
    }
    return tr;
};

/**
 * @param {number} rowIndex
 * @param {(cell: NodeWithPos & { start: number }, tr: Transaction) => boolean} predicate
 * @returns {(tr: Transaction) => NodeWithPos[]}
 */
const filterCellsInRow = (rowIndex, predicate) => (tr) => {
    const foundCells = [];
    const cells = getCellsInRow(rowIndex)(tr.selection);
    if (cells) {
        for (let j = cells.length - 1; j >= 0; j--) {
            if (predicate(cells[j], tr)) {
                foundCells.push(cells[j]);
            }
        }
    }

    return foundCells;
};

/**
 * :: (rowIndex: union<number, [number]>) → (selection: Selection) → ?[{pos: number, start: number, node: ProseMirrorNode}]
 * Returns an array of cells in a row(s), where `rowIndex` could be a row index or an array of row indexes.
 *
 * ```javascript
 * const cells = getCellsInRow(i)(selection); // [{node, pos}, {node, pos}]
 * ```
 *
 * @param {number | number[]} rowIndex
 * @returns {(sel: import('@tiptap/pm/state').Selection) => (NodeWithPos & {start: number})[] | undefined}
 */
export const getCellsInRow = (rowIndex) => (selection) => {
    const table = findTable(selection);
    if (table) {
        const map = TableMap.get(table.node);
        const indexes = Array.isArray(rowIndex) ? rowIndex : Array.from([rowIndex]);
        return indexes.reduce(
            /** @param {(NodeWithPos & {start: number})[]} acc */
            (acc, index) => {
                if (index >= 0 && index <= map.height - 1) {
                    const cells = map.cellsInRect({
                        left: 0,
                        right: map.width,
                        top: index,
                        bottom: index + 1,
                    });
                    return acc.concat(
                        cells.flatMap((nodePos) => {
                            const node = table.node.nodeAt(nodePos);
                            if (!node) return [];
                            const pos = nodePos + table.start;
                            /** @type {NodeWithPos & {start: number}} */
                            const res = { pos, start: pos + 1, node };

                            return res;
                        }),
                    );
                }

                return acc;
            },
            [],
        );
    }

    return;
};
