/**
 * @typedef {TableDecorations[keyof TableDecorations]} TableDecorationKey
 */

export const TableDecorations = /** @type {const} */ ({
    ALL_CONTROLS_HOVER: "CONTROLS_HOVER",
    ROW_CONTROLS_HOVER: "ROW_CONTROLS_HOVER",
    COLUMN_CONTROLS_HOVER: "COLUMN_CONTROLS_HOVER",
    TABLE_CONTROLS_HOVER: "TABLE_CONTROLS_HOVER",
    CELL_CONTROLS_HOVER: "CELL_CONTROLS_HOVER",

    COLUMN_CONTROLS_DECORATIONS: "COLUMN_CONTROLS_DECORATIONS",
    COLUMN_SELECTED: "COLUMN_SELECTED",
    COLUMN_RESIZING_HANDLE: "COLUMN_RESIZING_HANDLE",
    COLUMN_RESIZING_HANDLE_LINE: "COLUMN_RESIZING_HANDLE_LINE",

    LAST_CELL_ELEMENT: "LAST_CELL_ELEMENT",
});

const tablePrefixSelector = "table";

export const TableClassNames = /** @type {const} */ ({
    SELECTED_CELL: "selectedCell",
    TABLE_SELECTED: `${tablePrefixSelector}-table__selected`,

    COLUMN_CONTROLS: `${tablePrefixSelector}-column-controls`,
    COLUMN_CONTROLS_DECORATIONS: `${tablePrefixSelector}-column-controls-decoration`,
    COLUMN_SELECTED: `${tablePrefixSelector}-column__selected`,

    HOVERED_CELL_WARNING: `${tablePrefixSelector}-hovered-cell__warning`,
});
