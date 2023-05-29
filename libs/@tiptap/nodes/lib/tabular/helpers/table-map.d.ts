import type { Node as PMNode } from "@tiptap/pm/model";

export class Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export interface TableRect extends Rect {
    map: TableMap;
    tableStart: number;
    table: PMNode;
}

export type TableContext = {
    map: TableMap;
    tableStart: number;
    table: PMNode;
};

export type TableProblemCollision = {
    type: 0;
    row: number;
    pos: number;
    n: number;
};

export type TableProblemLongRowspan = {
    type: 1;
    pos: number;
    n: number;
};

export type TableProblemMissing = {
    type: 2;
    row: number;
    n: number;
};

export type TableProblemColWidthMismatch = {
    type: 3;
    pos: number;
    colwidth: number | number[];
};

export type TableProblem =
    | TableProblemCollision
    | TableProblemLongRowspan
    | TableProblemMissing
    | TableProblemColWidthMismatch;

/**
 * @class
 */
export class TableMap {
    // The width of the table
    width: number;
    // The table's height
    height: number;

    // :: [number] A width * height array with the start position of
    // the cell covering that part of the table in each slot
    map: number[];

    problems?: TableProblem[] | null;

    constructor(width: number, height: number, map: number[], problems?: TableProblem[] | null);

    // :: (number) → Rect
    // Find the dimensions of the cell at the given position.
    findCell(pos: number): Rect;

    // Find the left side of the cell at the given position.
    colCount(pos: number): number;

    // :: (number, string, number) → ?number
    // Find the next cell in the given direction, starting from the cell
    // at `pos`, if any.
    nextCell(pos: number, axis: Axis, dir: number): number | null;

    // :: (number, number) → Rect
    // Get the rectangle spanning the two given cells.
    rectBetween(a: number, b: number): Rect;

    // :: (Rect) → [number]
    // Return the position of all cells that have the top left corner in
    // the given rectangle.
    cellsInRect(rect: Rect): number[];

    // :: (number, number, Node) → number
    // Return the position at which the cell at the given row and column
    // starts, or would start, if a cell started there.
    positionAt(row: number, col: number, table: PMNode): number;

    // :: (Node) → TableMap
    // Find the table map for the given table node.
    static get(table: PMNode): TableMap;
}
