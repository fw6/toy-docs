/**
 * @typedef {import("./table-map").TableProblem} TableProblem
 */

import { PROBLEM_TYPES } from "./enums";

// Because working with row and column-spanning cells is not quite
// trivial, this code builds up a descriptive structure for a given
// table node. The structures are cached with the (persistent) table
// nodes as key, so that they only have to be recomputed when the
// content of the table changes.
//
// This does mean that they have to store table-relative, not
// document-relative positions. So code that uses them will typically
// compute the start position of the table and offset positions passed
// to or gotten from this structure by that amount.

export class Rect {
    /**
     * @constructor
     *
     * @param {number} left
     * @param {number} top
     * @param {number} right
     * @param {number} bottom
     */
    constructor(left, top, right, bottom) {
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    }
}

/**
 * ::- A table map describes the structore of a given table. To avoid
 * recomputing them all the time, they are cached per table node. To
 * be able to do that, positions saved in the map are relative to the
 * start of the table, rather than the start of the document.
 *
 * @class
 */
export class TableMap {
    /**
     * The width of the table
     * @type {number}
     */
    width;

    /**
     * The table's height
     * @type {number}
     */
    height;

    /**
     * :: [number] A width * height array with the start position of
     * the cell covering that part of the table in each slot
     * @type {number[]}
     */
    map;

    /**
     * @type {TableProblem[] | null | undefined}
     */
    problems;

    /**
     * @constructor
     * @param {number} width
     * @param {number} height
     * @param {number[]} map
     * @param {TableProblem[] | null | undefined} problems
     */
    constructor(width, height, map, problems) {
        this.width = width;
        this.height = height;
        this.map = map;
        this.problems = problems;
    }

    /**
     * :: (number) → Rect
     * Find the dimensions of the cell at the given position.
     * @param {number} pos
     */
    findCell(pos) {
        for (let i = 0; i < this.map.length; i++) {
            const curPos = this.map[i];
            if (curPos !== pos) {
                continue;
            }
            const left = i % this.width;
            const top = (i / this.width) | 0;
            let right = left + 1;
            let bottom = top + 1;
            for (let j = 1; right < this.width && this.map[i + j] === curPos; j++) {
                right++;
            }
            for (let j = 1; bottom < this.height && this.map[i + this.width * j] === curPos; j++) {
                bottom++;
            }
            return new Rect(left, top, right, bottom);
        }

        throw new RangeError(`No cell with offset ${pos} found`);
    }

    /**
     * Find the left side of the cell at the given position.
     *
     * @param {number} pos
     */
    colCount(pos) {
        for (let i = 0; i < this.map.length; i++) {
            if (this.map[i] === pos) {
                return i % this.width;
            }
        }
        throw new RangeError(`No cell with offset ${pos} found`);
    }

    /**
     * :: (number, string, number) → ?number
     * Find the next cell in the given direction, starting from the cell
     * at `pos`, if any.
     *
     * @param {number} pos
     * @param {Axis} axis
     * @param {number} dir
     */
    nextCell(pos, axis, dir) {
        const { left, right, top, bottom } = this.findCell(pos);
        if (axis === "horiz") {
            if (dir < 0 ? left === 0 : right === this.width) {
                return null;
            }
            return this.map[top * this.width + (dir < 0 ? left - 1 : right)];
        } else {
            if (dir < 0 ? top === 0 : bottom === this.height) {
                return null;
            }
            return this.map[left + this.width * (dir < 0 ? top - 1 : bottom)];
        }
    }

    /**
     * :: (number, number) → Rect
     * Get the rectangle spanning the two given cells.
     *
     * @param {number} a
     * @param {number} b
     */
    rectBetween(a, b) {
        const { left: leftA, right: rightA, top: topA, bottom: bottomA } = this.findCell(a);
        const { left: leftB, right: rightB, top: topB, bottom: bottomB } = this.findCell(b);
        return new Rect(
            Math.min(leftA, leftB),
            Math.min(topA, topB),
            Math.max(rightA, rightB),
            Math.max(bottomA, bottomB),
        );
    }

    /**
     * :: (Rect) → [number]
     * Return the position of all cells that have the top left corner in
     * the given rectangle.
     *
     * @param {Rect} rect
     */
    cellsInRect(rect) {
        /** @type {number[]} */
        const result = [];
        /** @type {Record<number, boolean>} */
        const seen = {};

        for (let row = rect.top; row < rect.bottom; row++) {
            for (let col = rect.left; col < rect.right; col++) {
                const index = row * this.width + col;
                const pos = this.map[index];
                if (seen[pos]) {
                    continue;
                }
                seen[pos] = true;
                if (
                    (col !== rect.left || !col || this.map[index - 1] !== pos) &&
                    (row !== rect.top || !row || this.map[index - this.width] !== pos)
                ) {
                    result.push(pos);
                }
            }
        }
        return result;
    }

    /**
     * :: (number, number, Node) → number
     * Return the position at which the cell at the given row and column
     * starts, or would start, if a cell started there.
     *
     * @param {number} row
     * @param {number} col
     * @param {PMNode} table
     */
    positionAt(row, col, table) {
        for (let i = 0, rowStart = 0; ; i++) {
            const rowEnd = rowStart + table.child(i).nodeSize;
            if (i === row) {
                let index = col + row * this.width;
                const rowEndIndex = (row + 1) * this.width;
                // Skip past cells from previous rows (via rowspan)
                while (index < rowEndIndex && this.map[index] < rowStart) {
                    index++;
                }
                return index === rowEndIndex ? rowEnd - 1 : this.map[index];
            }
            rowStart = rowEnd;
        }
    }

    /**
     * @param {PMNode} table
     */
    static get(table) {
        return readFromCache(table) || addToCache(table, computeMap(table));
    }
}

/**
 * Compute a table map.
 *
 * @param {PMNode} table
 */
function computeMap(table) {
    if (table.type.spec.tableRole !== "table") {
        throw new RangeError(`Not a table node: ${table.type.name}`);
    }
    const width = findWidth(table);
    const height = table.childCount;
    const map = [];
    let mapPos = 0;
    const colWidths = [];
    /** @type {TableProblem[] | null} */
    let problems = null;

    for (let i = 0, e = width * height; i < e; i++) {
        map[i] = 0;
    }

    for (let row = 0, pos = 0; row < height; row++) {
        const rowNode = table.child(row);
        pos++;
        for (let i = 0; ; i++) {
            while (mapPos < map.length && map[mapPos] !== 0) {
                mapPos++;
            }
            if (i === rowNode.childCount) {
                break;
            }
            const cellNode = rowNode.child(i);
            const { colspan, rowspan, colwidth } = cellNode.attrs;

            for (let h = 0; h < rowspan; h++) {
                if (h + row >= height) {
                    problems ||= [];
                    problems.push({
                        type: PROBLEM_TYPES.OVERLONG_ROWSPAN,
                        pos,
                        n: rowspan - h,
                    });
                    break;
                }
                const start = mapPos + h * width;
                for (let w = 0; w < colspan; w++) {
                    if (map[start + w] === 0) {
                        map[start + w] = pos;
                    } else {
                        problems ||= [];
                        problems.push({
                            type: PROBLEM_TYPES.COLLISION,
                            row,
                            pos,
                            n: colspan - w,
                        });
                    }
                    const colW = colwidth?.[w];

                    if (colW) {
                        const widthIndex = ((start + w) % width) * 2;
                        const prev = colWidths[widthIndex];
                        if (prev == null || (prev !== colW && colWidths[widthIndex + 1] === 1)) {
                            colWidths[widthIndex] = colW;
                            colWidths[widthIndex + 1] = 1;
                        } else if (prev === colW) {
                            colWidths[widthIndex + 1]++;
                        }
                    }
                }
            }
            mapPos += colspan;
            pos += cellNode.nodeSize;
        }
        const expectedPos = (row + 1) * width;
        let missing = 0;
        while (mapPos < expectedPos) {
            if (map[mapPos++] === 0) {
                missing++;
            }
        }
        if (missing) {
            problems ||= [];
            problems.push({
                type: PROBLEM_TYPES.MISSING,
                row,
                n: missing,
            });
        }
        pos++;
    }

    const tableMap = new TableMap(width, height, map, problems);
    let badWidths = false;

    // For columns that have defined widths, but whose widths disagree
    // between rows, fix up the cells whose width doesn't match the
    // computed one.
    for (let i = 0; !badWidths && i < colWidths.length; i += 2) {
        if (colWidths[i] != null && colWidths[i + 1] < height) {
            badWidths = true;
        }
    }
    if (badWidths) {
        findBadColWidths(tableMap, colWidths, table);
    }

    return tableMap;
}

/**
 * @param {PMNode} table
 */
function findWidth(table) {
    let width = -1;
    let hasRowSpan = false;
    for (let row = 0; row < table.childCount; row++) {
        const rowNode = table.child(row);
        let rowWidth = 0;
        if (hasRowSpan) {
            for (let j = 0; j < row; j++) {
                const prevRow = table.child(j);
                for (let i = 0; i < prevRow.childCount; i++) {
                    const cell = prevRow.child(i);
                    if (j + cell.attrs.rowspan > row) {
                        rowWidth += cell.attrs.colspan;
                    }
                }
            }
        }
        for (let i = 0; i < rowNode.childCount; i++) {
            const cell = rowNode.child(i);
            rowWidth += cell.attrs.colspan;
            if (cell.attrs.rowspan > 1) {
                hasRowSpan = true;
            }
        }
        if (width === -1) {
            width = rowWidth;
        } else if (width !== rowWidth) {
            width = Math.max(width, rowWidth);
        }
    }
    return width;
}

/**
 * @param {TableMap} map
 * @param {number[]} colWidths
 * @param {PMNode} table
 */
function findBadColWidths(map, colWidths, table) {
    if (!map.problems) {
        map.problems = [];
    }

    /** @type {Record<number, boolean>} */
    const seen = {};
    for (let i = 0; i < map.map.length; i++) {
        const pos = map.map[i];
        if (seen[pos]) {
            continue;
        }
        seen[pos] = true;

        const node = table.nodeAt(pos);
        if (!node) return;
        /**
         * @type {number[] | null}
         */
        let updated = null;
        for (let j = 0; j < node.attrs.colspan; j++) {
            const col = (i + j) % map.width;
            const colWidth = colWidths[col * 2];
            if (colWidth != null && (!node.attrs.colwidth || node.attrs.colwidth[j] !== colWidth)) {
                updated ??= freshColWidth(node.attrs);
                updated[j] = colWidth;
            }
        }
        if (updated) {
            map.problems.unshift({
                type: PROBLEM_TYPES.COLWIDTH_MISMATCH,
                pos,
                colwidth: updated,
            });
        }
    }
}

/**
 * @param {Attrs} attrs
 *
 * @returns {number[]}
 */
function freshColWidth(attrs) {
    if (attrs.colwidth) {
        return attrs.colwidth.slice();
    }

    /**
     * @constant
     * @type {number[]}
     */
    const result = [];
    for (let i = 0; i < attrs.colspan; i++) {
        result.push(0);
    }
    return result;
}

/**
 * @constant
 * @type {WeakMap<PMNode, TableMap | undefined>}
 */
const cache = new WeakMap();

/**
 * @type {(key: PMNode) => TableMap | undefined}
 */
const readFromCache = (key) => cache.get(key);

/**
 * @type {(key: PMNode, value: TableMap) => TableMap}
 */
const addToCache = (key, value) => {
    cache.set(key, value);
    return value;
};
