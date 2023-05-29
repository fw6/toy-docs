import { Fragment, ResolvedPos } from "@tiptap/pm/model";
import { Selection } from "@tiptap/pm/state";

import { CellSelection } from "../helpers/cell-selection";
import { Rect, TableMap } from "../helpers/table-map";
import { cellAround, isEmptyCell } from "../utils/cells";
import { tableNodeTypes } from "../utils/node-types";
import { getSelectionRect, selectedRect } from "../utils/selection";
import { addColSpan } from "../utils/spaning";
import { findTable } from "../utils/tables";

/**
 * re-creates table node with merged cells
 *
 * @type {Command}
 */
export function mergeCells(state, dispatch) {
    const tr = state.tr;
    const { selection } = tr;
    if (!(selection instanceof CellSelection) || !canMergeCells(tr)) {
        return false;
    }

    const rect = getSelectionRect(selection);
    const table = findTable(selection);
    if (!(rect && table)) throw new Error("Invalid cell selection");

    const map = TableMap.get(table.node);
    /** @type {number[]} */
    const seen = [];
    const selectedCells = map.cellsInRect(rect);
    let mergedCellPos;

    /** @type {PMNode[]} */
    const rows = [];
    for (let rowIndex = 0; rowIndex < map.height; rowIndex++) {
        /** @type {PMNode[]} */
        const rowCells = [];
        const row = table.node.child(rowIndex);

        for (let colIndex = 0; colIndex < map.width; colIndex++) {
            const cellPos = map.map[rowIndex * map.width + colIndex];
            const cell = table.node.nodeAt(cellPos);
            if (!cell || seen.indexOf(cellPos) > -1) {
                continue;
            }
            seen.push(cellPos);

            // merged cell
            if (colIndex === rect.left && rowIndex === rect.top) {
                mergedCellPos = cellPos;
                // merge content of the selected cells, dropping empty cells
                let content = isEmptyCell(cell) ? Fragment.empty : cell.content;
                /** @type {number[]} */
                const seenContent = [mergedCellPos];
                for (let i = rect.top; i < rect.bottom; i++) {
                    for (let j = rect.left; j < rect.right; j++) {
                        const pos = map.map[i * map.width + j];
                        if (seenContent.indexOf(pos) === -1) {
                            seenContent.push(pos);
                            const copyCell = table.node.nodeAt(pos);
                            if (copyCell && !isEmptyCell(copyCell)) {
                                content = content.append(copyCell.content);
                            }
                        }
                    }
                }
                const rowspan = rect.bottom - rect.top;
                if (rowspan < 1) {
                    tr.setMeta("tablePlugin", "NEGATIVE_ROWSPAN");
                    return false;
                }
                // update colspan and rowspan of the merged cell to span the selection
                const attrs = addColSpan(
                    {
                        ...cell.attrs,
                        rowspan,
                    },
                    cell.attrs.colspan,
                    rect.right - rect.left - cell.attrs.colspan,
                );
                const newCell =
                    content === Fragment.empty
                        ? cell.type.createAndFill(attrs, content, cell.marks)
                        : cell.type.createChecked(attrs, content, cell.marks);
                newCell && rowCells.push(newCell);
            } else if (selectedCells.indexOf(cellPos) === -1) {
                // if its one of the selected cells, but not the merged cell, we get rid of it
                // otherwise we keep the cell
                rowCells.push(cell);
            }
        }

        if (rowCells.length) {
            rows.push(row.type.createChecked(row.attrs, rowCells, row.marks));
        } else {
            // empty row, we need to fix rowspans for rows above the current one
            for (let i = rows.length - 1; i >= 0; i--) {
                const prevRow = rows[i];
                /** @type {PMNode[]} */
                const cells = [];
                let rowChanged = false;

                for (let j = 0; j < prevRow.childCount; j++) {
                    const cell = prevRow.child(j);
                    const { rowspan } = cell.attrs;
                    if (rowspan && rowspan + i - 1 >= rows.length) {
                        rowChanged = true;
                        if (rowspan < 2) {
                            tr.setMeta("tablePlugin", "NEGATIVE_ROWSPAN");
                            return false;
                        }
                        cells.push(
                            cell.type.createChecked(
                                {
                                    ...cell.attrs,
                                    rowspan: rowspan - 1,
                                },
                                cell.content,
                                cell.marks,
                            ),
                        );
                    } else {
                        cells.push(cell);
                    }
                }
                if (rowChanged) {
                    rows[i] = row.type.createChecked(prevRow.attrs, cells, prevRow.marks);
                }
            }
        }
    }

    // empty tables? cancel merging like nothing happened
    if (!rows.length) {
        tr.setMeta("tablePlugin", "EMPTY_TABLE");
        return false;
    }

    const newTable = table.node.type.createChecked(table.node.attrs, rows, table.node.marks);
    const fixedTable = removeEmptyColumns(newTable);
    if (fixedTable === null) {
        tr.setMeta("tablePlugin", "REMOVE_EMPTY_COLUMNS");
        return false;
    }

    tr.replaceWith(table.pos, table.pos + table.node.nodeSize, fixedTable)
        .setSelection(Selection.near(tr.doc.resolve((mergedCellPos || 0) + table.start)))
        .setMeta("tablePlugin", "MERGE_CELLS");
    if (dispatch) dispatch(tr);
    return true;
}

/**
 * Split a selected cell, whose rowpan or colspan is greater than one,
 * into smaller cells. Use the first cell type for the new cells.
 * @type {Command}
 */
export const splitCell = (state, dispatch) => {
    const nodeTypes = tableNodeTypes(state.schema);
    return splitCellWithType(({ node }) => {
        return nodeTypes[node.type.spec.tableRole];
    })(state, dispatch);
};

/**
 * @typedef {{
 *  row: number;
 *  col: number;
 *  node: PMNode;
 * }} GetCellTypeArgs
 * @typedef {(option: GetCellTypeArgs) => NodeType} GetCellTypeCallback
 */

/**
 * Split a selected cell, whose rowpan or colspan is greater than one,
 * into smaller cells with the cell type (th, td) returned by getType function.
 *
 * @param {GetCellTypeCallback} getCellType
 * @returns {Command}
 */
export function splitCellWithType(getCellType) {
    return (state, dispatch) => {
        const sel = state.selection;
        /** @type {PMNode | undefined | null} */
        let cellNode;
        /** @type {number | null | undefined} */
        let cellPos;

        if (!(sel instanceof CellSelection)) {
            cellNode = cellWrapping(sel.$from);
            if (!cellNode) {
                return false;
            }

            const cellNodeAround = cellAround(sel.$from);
            cellPos = cellNodeAround?.pos;
        } else {
            if (sel.$anchorCell.pos !== sel.$headCell.pos) {
                return false;
            }
            cellNode = sel.$anchorCell.nodeAfter;
            cellPos = sel.$anchorCell.pos;
        }
        if (cellNode && cellNode.attrs.colspan === 1 && cellNode.attrs.rowspan === 1) {
            return false;
        }
        if (cellNode && dispatch) {
            let cellAttrs = cellNode.attrs;
            const attrs = [];

            /** @type {number[] | undefined} */
            const colwidth = cellAttrs.colwidth;
            if (cellAttrs.rowspan && cellAttrs.rowspan > 1) {
                cellAttrs = { ...cellAttrs, rowspan: 1 };
            }
            if (cellAttrs.colspan && cellAttrs.colspan > 1) {
                cellAttrs = { ...cellAttrs, colspan: 1 };
            }
            const rect = selectedRect(state);
            const tr = state.tr;
            for (let i = 0; i < rect.right - rect.left; i++) {
                attrs.push(
                    colwidth
                        ? {
                              ...cellAttrs,
                              colwidth: colwidth?.[i] ? [colwidth[i]] : null,
                          }
                        : cellAttrs,
                );
            }
            /** @type {number | null} */
            let lastCell = null;
            for (let row = rect.top; row < rect.bottom; row++) {
                let pos = rect.map.positionAt(row, rect.left, rect.table);
                if (row === rect.top) {
                    pos += cellNode.nodeSize;
                }
                for (let col = rect.left, i = 0; col < rect.right; col++, i++) {
                    if (col === rect.left && row === rect.top) {
                        continue;
                    }

                    const cellType = getCellType({
                        node: cellNode,
                        row,
                        col,
                    }).createAndFill(attrs[i]);

                    if (cellType) {
                        lastCell = tr.mapping.map(pos + rect.tableStart, 1);
                        tr.insert(lastCell, cellType);
                    }
                }
            }
            if (typeof cellPos === "number") {
                tr.setNodeMarkup(cellPos, getCellType({ node: cellNode, row: rect.top, col: rect.left }), attrs[0]);
            }

            const $lastCellPosition = lastCell && tr.doc.resolve(lastCell);
            if (sel instanceof CellSelection && $lastCellPosition instanceof ResolvedPos) {
                tr.setSelection(new CellSelection(tr.doc.resolve(sel.$anchorCell.pos), $lastCellPosition));
            }

            dispatch(tr);
        }
        return true;
    };
}

/**
 * @param {Transaction} tr
 * @returns {boolean}
 */
export function canMergeCells(tr) {
    const { selection } = tr;
    if (!(selection instanceof CellSelection) || selection.$anchorCell.pos === selection.$headCell.pos) {
        return false;
    }

    const rect = getSelectionRect(selection);
    if (!rect) {
        return false;
    }
    const table = selection.$anchorCell.node(-1);
    const map = TableMap.get(table);
    if (cellsOverlapRectangle(map, rect)) {
        return false;
    }

    return true;
}

/**
 * returns an array of numbers, each number indicates the minimum colSpan in each column
 *
 * @param {PMNode} table
 * @returns {number[]}
 */
function getMinColSpans(table) {
    const map = TableMap.get(table);
    /** @type {number[]} */
    const minColspans = [];
    for (let colIndex = map.width - 1; colIndex >= 0; colIndex--) {
        const cellsPositions = map.cellsInRect({
            left: colIndex,
            right: colIndex + 1,
            top: 0,
            bottom: map.height,
        });
        if (cellsPositions.length) {
            const colspans = cellsPositions.map((cellPos) => {
                const cell = table.nodeAt(cellPos);
                if (cell) {
                    return cell.attrs.colspan;
                }
            });
            const minColspan = Math.min(...colspans);
            // only care about the case when the next column is invisible
            if (!minColspans[colIndex + 1]) {
                minColspans[colIndex] = minColspan;
            } else {
                minColspans[colIndex] = 1;
            }
        }
    }

    return minColspans;
}

/**
 * @param {PMNode} table
 * @returns {PMNode?}
 */
export function removeEmptyColumns(table) {
    const map = TableMap.get(table);
    const minColSpans = getMinColSpans(table);
    if (!minColSpans.some((colspan) => colspan > 1)) {
        return table;
    }
    /** @type {PMNode[]} */
    const rows = [];
    for (let rowIndex = 0; rowIndex < map.height; rowIndex++) {
        /** @type {Record<string, PMNode>} */
        const cellsByCols = {};
        const cols = Object.keys(minColSpans).map(Number);
        for (const idx in cols) {
            const colIndex = cols[idx];
            const cellPos = map.map[colIndex + rowIndex * map.width];
            const rect = map.findCell(cellPos);
            const cell = cellsByCols[rect.left] || table.nodeAt(cellPos);
            if (cell && rect.top === rowIndex) {
                if (minColSpans[colIndex] > 1) {
                    const colspan = cell.attrs.colspan - minColSpans[colIndex] + 1;
                    if (colspan < 1) {
                        return null;
                    }
                    const { colwidth } = cell.attrs;
                    const newCell = cell.type.createChecked(
                        {
                            ...cell.attrs,
                            colspan,
                            colwidth: colwidth ? colwidth.slice(0, colspan) : null,
                        },
                        cell.content,
                        cell.marks,
                    );
                    cellsByCols[rect.left] = newCell;
                } else {
                    cellsByCols[rect.left] = cell;
                }
            }
        }

        const rowCells = Object.keys(cellsByCols).map((col) => cellsByCols[col]);
        const row = table.child(rowIndex);
        if (row) {
            rows.push(row.type.createChecked(row.attrs, rowCells, row.marks));
        }
    }

    if (!rows.length) {
        return null;
    }

    return table.type.createChecked(table.attrs, rows, table.marks);
}

/**
 * @param {TableMap} tableMap
 * @param {Rect} rect
 */
function cellsOverlapRectangle({ width, height, map }, rect) {
    let indexTop = rect.top * width + rect.left;
    let indexLeft = indexTop;

    let indexBottom = (rect.bottom - 1) * width + rect.left;
    let indexRight = indexTop + (rect.right - rect.left - 1);

    for (let i = rect.top; i < rect.bottom; i++) {
        if (
            (rect.left > 0 && map[indexLeft] === map[indexLeft - 1]) ||
            (rect.right < width && map[indexRight] === map[indexRight + 1])
        ) {
            return true;
        }
        indexLeft += width;
        indexRight += width;
    }
    for (let i = rect.left; i < rect.right; i++) {
        if (
            (rect.top > 0 && map[indexTop] === map[indexTop - width]) ||
            (rect.bottom < height && map[indexBottom] === map[indexBottom + width])
        ) {
            return true;
        }

        indexTop++;
        indexBottom++;
    }

    return false;
}

/**
 * @param {ResolvedPos} $pos
 * @returns {PMNode | null}
 */
export function cellWrapping($pos) {
    for (let d = $pos.depth; d > 0; d--) {
        // Sometimes the cell can be in the same depth.
        const role = $pos.node(d).type.spec.tableRole;
        if (role === "cell" || role === "header_cell") {
            return $pos.node(d);
        }
    }
    return null;
}
