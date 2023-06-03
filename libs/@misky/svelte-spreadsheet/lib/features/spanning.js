import { last } from "lodash-es";

/**
 * 被合并拆分的单元格数据类型（用于对表格数据占位和计算colSpan、Rowspan）
 */
export const OSpanningData = /** @type {const} */ ({
    ROW: /** @type {import('./spanning').SpanningData.ROW} */ ("←"),

    /**
     * 列合并（正上方某个单元格）
     */
    COLUMN: /** @type {import('./spanning').SpanningData.COLUMN} */ ("↑"),

    /**
     * 行列都被合并（左上方某个单元格）
     */
    BOTH: /** @type {import('./spanning').SpanningData.BOTH} */ ("↖"),
});

/** @param {unknown} value */
export const isSpanningData = (value) => Object.values(OSpanningData).findIndex((v) => v === value) > -1;

/**
 * @typedef {import("./spanning").Command} ECommand
 */

export const Command = /** @type {const} */ ({
    /** @type {import('./spanning').Command.MERGE} */
    MERGE: 1,
    /** @type {import('./spanning').Command.SPLIT} */
    SPLIT: 2,

    /** @type {import('./spanning').Command.INSERT_ROW_ABOVE} */
    INSERT_ROW_ABOVE: 3,
    /** @type {import('./spanning').Command.INSERT_ROW_BELOW} */
    INSERT_ROW_BELOW: 4,

    /** @type {import('./spanning').Command.INSERT_COLUMN_LEFT} */
    INSERT_COLUMN_LEFT: 5,
    /** @type {import('./spanning').Command.INSERT_COLUMN_RIGHT} */
    INSERT_COLUMN_RIGHT: 6,

    /** @type {import('./spanning').Command.SELECT_ROWS} */
    SELECT_ROWS: 7,
    /** @type {import('./spanning').Command.SELECT_COLUMNS} */
    SELECT_COLUMNS: 8,
    /** @type {import('./spanning').Command.SELECT_CELL} */
    SELECT_CELL: 9,
    /** @type {import('./spanning').Command.SELECT_TABLE} */
    SELECT_TABLE: 10,

    /** @type {import('./spanning').Command.DELETE_ROWS} */
    DELETE_ROWS: 11,
    /** @type {import('./spanning').Command.DELETE_COLUMNS} */
    DELETE_COLUMNS: 12,
    /** @type {import('./spanning').Command.DELETE_TABLE} */
    DELETE_TABLE: 13,

    /** @type {import('./spanning').Command.CELL_ALIGN_TYPE} */
    CELL_ALIGN_TYPE: 14,
    /** @type {import('./spanning').Command.CELL_BACKGROUND_COLOR} */
    CELL_BACKGROUND_COLOR: 15,
});

/**
 * @type {import("@tanstack/table-core").TableFeature}
 */
export const Spanning = {
    /**
     * @template {import("@tanstack/table-core").RowData} TData
     * @param {import("@tanstack/table-core").Table<TData>} _table
     * @returns {import("./spanning").SpanningOptions<TData>}
     */
    getDefaultOptions: (_table) => {
        return {
            enableSpanning: false,
        };
    },

    /**
     * @template {import("@tanstack/table-core").RowData} TData
     * @param {import("@tanstack/table-core").Table<TData>} table
     * @returns {import("./spanning").SpanningInstance<TData>}
     */
    createTable: (table) => {
        return {
            getSpanningData: () =>
                table.getRowModel().rows.map((row) =>
                    row.getAllCells().map((cell) => {
                        return cell.getValue();
                    }),
                ),

            getIsAllowMerging: () => {
                const selectedCells = table.getCellsInAllRange();
                return selectedCells.length > 1;
            },

            getIsAllowSplitting() {
                const selectedCells = table.getCellsInAllRange();
                return selectedCells.some((cell) => cell.colSpan > 1 || cell.rowSpan > 1);
            },

            getSplittedTData: () => {
                const data = /** @type {string[][]} */ (table.getSpanningData());

                const selectCells = table
                    .getCellsInAllRange()
                    .flatMap((cell) => (cell.colSpan > 1 || cell.rowSpan > 1 ? cell : []));

                return data.reduce(
                    /** @param {string[][]} acc */
                    (acc, rowData, rowIndex) => {
                        acc.push(
                            rowData.reduce(
                                /** @param {string[]} acc */
                                (acc, cellData, cellIndex) => {
                                    const cell = selectCells.find(
                                        (cell) => cell.row.index === rowIndex && cell.getIndex() === cellIndex,
                                    );
                                    if (cell) {
                                        // 本行水平方向先重置
                                        if (cell.colSpan > 1) {
                                            let i = cell.colSpan;
                                            while (--i > 0) {
                                                // @ts-ignore
                                                rowData[cellIndex + i] = null;
                                            }
                                        }
                                        if (cell.rowSpan > 1) {
                                            let i = cell.rowSpan;
                                            while (--i > 0) {
                                                const rowData = data[rowIndex + i];
                                                // @ts-ignore
                                                rowData[cellIndex] = null;

                                                if (cell.colSpan > 1) {
                                                    let j = cell.colSpan;
                                                    while (--j > 0) {
                                                        // @ts-ignore
                                                        rowData[cellIndex + j] = null;
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    acc.push(cellData);
                                    return acc;
                                },
                                [],
                            ),
                        );
                        return acc;
                    },
                    [],
                );
            },

            getMergedTData: () => {
                const ranges = table.getState().ranges;
                const data = /** @type {string[][]} */ (table.getSpanningData());

                ranges.forEach((range) => {
                    const restCells = table.getCellsInRange(range);
                    const anchorCell = restCells.splice(0, 1)[0];
                    const anchorCellIndex = anchorCell.getIndex();
                    const anchorRowIndex = anchorCell.row.index;

                    // const restCells = table.getCellsInRange(range).slice(1);
                    restCells.forEach((cell) => {
                        if (anchorRowIndex === cell.row.index) {
                            data[cell.row.index][cell.getIndex()] = OSpanningData.ROW;
                        } else if (anchorCellIndex === cell.getIndex()) {
                            data[cell.row.index][cell.getIndex()] = OSpanningData.COLUMN;
                        } else {
                            data[cell.row.index][cell.getIndex()] = OSpanningData.BOTH;
                        }
                    });
                });

                return data.filter((rowData) => !rowData.every((v) => isSpanningData(v)));
            },

            getInsertedTData: (command, ranges) => {
                switch (command) {
                    case Command.INSERT_COLUMN_LEFT:
                        return table._getColumnLeftInsertedTData(ranges);
                    case Command.INSERT_COLUMN_RIGHT:
                        return table._getColumnRightInsertedTData(ranges);
                    case Command.INSERT_ROW_ABOVE:
                        return table._getRowAboveInsertedTData(ranges);
                    case Command.INSERT_ROW_BELOW:
                        return table._getRowBelowInsertedTData(ranges);
                    default:
                        console.warn("Not implemented yet: ", command);
                        break;
                }
                return [0, []];
            },

            _getColumnLeftInsertedTData: (ranges) => {
                ranges = ranges || table.getState().ranges;
                const data = /** @type {string[][]} */ (table.getSpanningData());

                const anchorCell = table.getCellsInRange(ranges[0])[0];
                const anchorCellIndex = anchorCell.getIndex();
                const baseIndex = anchorCellIndex;

                // 以下情况全部为新的列数据（1、2）
                if (
                    anchorCellIndex < 1 ||
                    data.every((rowData) => {
                        const data = rowData[anchorCellIndex];
                        if (!isSpanningData(data) || data === OSpanningData.COLUMN) return true;
                        return false;
                    })
                ) {
                    return [
                        baseIndex,
                        data.map((rowData) => {
                            rowData.splice(baseIndex, 0, "");
                            return rowData;
                        }, []),
                    ];
                }

                return [
                    baseIndex,
                    data.map((rowData) => {
                        const cellData = rowData[anchorCellIndex];
                        let newData = "";

                        if (isSpanningData(cellData)) {
                            if (cellData === OSpanningData.ROW) {
                                newData = OSpanningData.ROW;
                            } else if (cellData === OSpanningData.COLUMN) {
                                newData = OSpanningData.COLUMN;
                                rowData[anchorCellIndex] = OSpanningData.BOTH;
                            } else {
                                newData = OSpanningData.BOTH;
                            }
                        }

                        rowData.splice(baseIndex, 0, newData);
                        return rowData;
                    }, []),
                ];
            },

            _getColumnRightInsertedTData: (ranges) => {
                ranges = ranges || table.getState().ranges;
                const data = /** @type {string[][]} */ (table.getSpanningData());

                let lastCell = last(table.getCellsInRange(ranges[0]));
                if (!lastCell) throw new Error("Invalid table data: last selected cell not found");

                if (lastCell.colSpan > 1 || lastCell.rowSpan > 1) {
                    const cornerCells = lastCell.getSpanningCornerCells();
                    if (cornerCells) {
                        lastCell = cornerCells[1];
                    }
                }

                const anchorCellIndex = lastCell.getIndex();
                const cellLength = lastCell.row.getAllCells().length;

                const baseIndex = anchorCellIndex + 1;

                if (
                    anchorCellIndex >= cellLength - 1 ||
                    data.every((rowData) => {
                        const cellData = rowData[anchorCellIndex];
                        if (!isSpanningData(cellData) || cellData !== OSpanningData.COLUMN) return true;

                        const nextCellIndex = anchorCellIndex + 1;
                        return data.every(
                            (rowData) =>
                                !isSpanningData(rowData[nextCellIndex]) ||
                                rowData[nextCellIndex] === OSpanningData.COLUMN,
                        );
                    })
                ) {
                    return [
                        baseIndex,
                        data.map((rowData) => {
                            rowData.splice(baseIndex, 0, "");
                            return rowData;
                        }, []),
                    ];
                }

                return [
                    baseIndex,
                    data.map((rowData) => {
                        const cellData = rowData[anchorCellIndex];
                        const newData = isSpanningData(cellData)
                            ? cellData === OSpanningData.ROW
                                ? OSpanningData.ROW
                                : cellData === OSpanningData.BOTH
                                ? OSpanningData.BOTH
                                : ""
                            : "";

                        rowData.splice(baseIndex, 0, newData);
                        return rowData;
                    }, []),
                ];
            },

            _getRowAboveInsertedTData: (ranges) => {
                ranges = ranges || table.getState().ranges;
                const data = /** @type {string[][]} */ (table.getSpanningData());

                const anchorCell = table.getCellsInRange(ranges[0])[0];
                const anchorRow = anchorCell.row;
                const baseIndex = anchorRow.index;
                if (baseIndex === 0 || data[baseIndex].every((cellData) => cellData !== OSpanningData.COLUMN)) {
                    data.splice(
                        baseIndex,
                        0,
                        data[baseIndex].map(() => ""),
                    );
                } else {
                    data.splice(
                        baseIndex,
                        0,
                        data[baseIndex].map((cellData) =>
                            cellData === OSpanningData.COLUMN || cellData === OSpanningData.BOTH ? cellData : "",
                        ),
                    );
                }

                return [baseIndex, data];
            },

            _getRowBelowInsertedTData: (ranges) => {
                ranges = ranges || table.getState().ranges;

                const data = /** @type {string[][]} */ (table.getSpanningData());

                let lastCell = last(table.getCellsInRange(ranges[0]));
                if (!lastCell) throw new Error("Invalid table data: last selected cell not found");
                if (lastCell.colSpan > 1 || lastCell.rowSpan > 1) {
                    const cornerCells = lastCell.getSpanningCornerCells();
                    if (cornerCells) {
                        lastCell = cornerCells[1];
                    }
                }
                const lastRow = lastCell.row;
                const baseIndex = lastRow.index + 1;

                if (
                    baseIndex >= data.length ||
                    data[baseIndex].every((cellData) => cellData !== OSpanningData.COLUMN)
                ) {
                    data.splice(
                        baseIndex,
                        0,
                        data[0].map(() => ""),
                    );
                } else {
                    data.splice(
                        baseIndex,
                        0,
                        data[Math.min(baseIndex, data.length - 1)].map((cellData) =>
                            cellData === OSpanningData.COLUMN || cellData === OSpanningData.BOTH ? cellData : "",
                        ),
                    );
                }

                return [baseIndex, data];
            },

            getDeletedTData: (command, range) => {
                switch (command) {
                    case Command.DELETE_COLUMNS:
                        return table._getColumnsDeletedTData(range);
                    case Command.DELETE_ROWS:
                        return table._getRowsDeletedTData(range);
                    default:
                        throw new Error(`Command(${command}) not implemented.`);
                }
            },

            _getRowsDeletedTData: (rowsRange) => {
                rowsRange = rowsRange || table.getSelectedRowRange();
                if (!rowsRange) throw new Error("Invalid table data: selected rows range not found");
                const [startTitle, endTitle] = rowsRange.split(":");
                const startIndex = parseInt(startTitle) - 1;
                const endIndex = parseInt(endTitle) - 1;

                const data = /** @type {string[][]} */ (table.getSpanningData());
                const aboveRows = data.slice(0, startIndex);
                const belowRows = data.slice(endIndex + 1);

                const belowFistRow = belowRows[0];

                if (belowFistRow)
                    belowFistRow.forEach((cellData, index) => {
                        if (cellData === OSpanningData.COLUMN) {
                            belowFistRow[index] = "";
                        } else if (cellData === OSpanningData.BOTH) {
                            belowFistRow[index] = OSpanningData.ROW;
                        }
                    });

                return {
                    scope: [startIndex, endIndex],
                    data: aboveRows.concat(belowRows),
                };
            },

            _getColumnsDeletedTData: (colsRange) => {
                colsRange = colsRange || table.getSelectedColumnRange();
                if (!colsRange) throw new Error("Invalid table data: selected columns range not found");
                const [startTitle, endTitle] = colsRange.split(":");
                const startIndex = table.columnTitleToNumber(startTitle) - 1;
                const endIndex = table.columnTitleToNumber(endTitle) - 1;

                const data = /** @type {string[][]} */ (table.getSpanningData());

                data.forEach((rowData) => {
                    const leftPart = rowData.slice(0, startIndex);
                    const rightPart = rowData.slice(endIndex + 1);

                    if (rightPart[0] === OSpanningData.ROW) rightPart[0] = "";
                    else if (rightPart[0] === OSpanningData.BOTH) rightPart[0] = OSpanningData.COLUMN;

                    rowData.splice(0, rowData.length, ...leftPart, ...rightPart);
                });

                return {
                    scope: [startIndex, endIndex],
                    data,
                };
            },
        };
    },
};
