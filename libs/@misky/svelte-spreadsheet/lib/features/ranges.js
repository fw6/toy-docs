import { makeStateUpdater, passiveEventSupported } from "@tanstack/table-core";
import { debounce, last } from "lodash-es";
import { nanoid } from "nanoid";

const defaultRanges = ["A1:A1"];
const rangeReg = new RegExp("^([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)$");
const columnRangeReg = /^([A-Z]+):([A-Z]+)$/;
const rowRangeReg = /^([1-9]\d*):([1-9]\d*)$/;
const cellTitleReg = /^([A-Z]+)([1-9]\d*)$/;

const getDefaultRangeSelectingInfoState = () =>
    /** @type {import("./ranges").RangeSelectingInfoState} */ ({
        startRef: null,
        endRef: null,
        isDblclick: false,
    });

// const isTouchStartEvent = (e: unknown): e is TouchEvent => (e as TouchEvent).type === 'touchstart';
/**
 * @param {any} e
 * @return {e is MouseEvent}
 */
const isMouseDownEvent = (e) => e.type === "mousedown";

/** @type {import("@tanstack/table-core").TableFeature} */
export const Ranges = {
    /** @returns {import('./ranges').RangeTableState} */
    getInitialState: (state) => ({
        ranges: defaultRanges,
        rangeAnchor: "A1",
        isEditingRangeAnchor: false,
        rangeSelectingInfo: getDefaultRangeSelectingInfoState(),
        ...state,
    }),

    /**
     * @template {import("@tanstack/table-core").RowData} TData
     * @param {import("@tanstack/table-core").Table<TData>} table
     * @returns {import("./ranges").RangeOptions<TData>}
     */
    getDefaultOptions: (table) => {
        return {
            onRangesChange: makeStateUpdater("ranges", table),
            onRangeAnchorChange: makeStateUpdater("rangeAnchor", table),
            onRangeSelectingInfoChange: makeStateUpdater("rangeSelectingInfo", table),
        };
    },

    /**
     * @template {import("@tanstack/table-core").RowData} TData
     * @param {import("@tanstack/table-core").Table<TData>} table
     * @returns {import("./ranges").RangeInstance<TData>}
     */
    createTable: (table) => {
        const validNumberReg = /^[1-9]\d*$/;
        const validAlphabat = /^[A-Z]+$/;

        /** @param {string} range */
        const validateRange = (range) => {
            // 整表选中
            if (range === "#") return true;
            const [from, to] = range.split(":");
            if (cellTitleReg.test(from) && cellTitleReg.test(to)) return true;
            else if (validNumberReg.test(from) && validNumberReg.test(to)) return true;
            else if (validAlphabat.test(from) && validAlphabat.test(to)) return true;

            return false;
        };

        return {
            __cache: {},
            sheetId: nanoid(),

            setRangesState: (ranges) => {
                if (!table.__cache.fixedRange) table.__cache.fixedRange = {};

                try {
                    const newRanges = ranges.flatMap((range) => {
                        if (!validateRange(range)) return [];
                        return table.fixRange(range);
                    });

                    table.options.onRangesChange?.(newRanges);
                } catch (error) {
                    console.error(error);
                }
            },

            resetRangesState(defaultState) {
                table.setRangesState(defaultState ? defaultRanges : table.initialState.ranges);
            },

            setRangeAnchorState: (updater) => table.options.onRangeAnchorChange?.(updater),

            getCellByTitle: (title) => {
                const execArr = cellTitleReg.exec(title);
                if (!execArr) return;
                const [_, _columnTitle, rowTitle] = execArr;

                const rowsByTitle = table.getRangesRowModel().rowsByTitle;
                const row = rowsByTitle[rowTitle];

                return row.getAllCells().find((cell) => cell.getTitle() === title);
            },

            getPreRangesRowModel: () => ({ ...table.getCoreRowModel(), rowsByTitle: {} }),

            getRangesRowModel: () => {
                if (!table._getRangesRowModel && table.options.getRangesRowModel) {
                    table._getRangesRowModel = table.options.getRangesRowModel(table);
                }

                if (!table._getRangesRowModel) {
                    return table.getPreRangesRowModel();
                }

                return table._getRangesRowModel();
            },

            getCellsInAllRange: () => {
                const ranges = table.getState().ranges;
                return ranges.flatMap(table.getCellsInRange);
            },

            getCellTitlesInRange: (range) => {
                if (!table.__cache.cellsInRange) table.__cache.cellsInRange = {};

                if (!table.__cache.cellsInRange[range]) {
                    table.__cache.cellsInRange[range] = table.cellsInRange(range);
                }

                return table.__cache.cellsInRange[range];
            },

            getCellsInRange: (range) => {
                return table.getCellTitlesInRange(range).flatMap((title) => table.getCellByTitle(title) || []);
            },

            getSelectedColumnRange: () => {
                const range = table.getState().ranges[0];
                if (!range) return;
                const cells = table.getCellTitlesInRange(range);
                const columns = [cells[0], last(cells)].flatMap((cell) => cell?.match(cellTitleReg)?.[1] || []);
                if (!columns.length) return;
                const firstCol = columns[0];
                const lastCol = columns[1] || firstCol;

                return `${firstCol}:${lastCol}`;
            },

            getSelectedRowRange: () => {
                const range = table.getState().ranges[0];
                if (!range) return;
                const cells = table.getCellTitlesInRange(range);
                const columns = [cells[0], last(cells)].flatMap((cell) => cell?.match(cellTitleReg)?.[2] || []);
                if (!columns.length) return;
                const firstRow = columns[0];
                const lastRow = columns[1] || firstRow;

                return `${firstRow}:${lastRow}`;
            },

            selectColumns: (range) => {
                range = range || table.getSelectedColumnRange();
                if (!range) return;

                table.setRangesState([range]);
                table.setRangeAnchorState(`${range.split(":")[0]}1`);
            },

            selectRows: (range) => {
                range = range || table.getSelectedRowRange();
                if (!range) return;

                table.setRangesState([range]);
                table.setRangeAnchorState(`A${range.split(":")[0]}`);
            },

            selectTable: () => {
                table.setRangesState(["#"]);
            },

            selectCell: () => {
                const rangeAnchor = table.getState().rangeAnchor;
                if (rangeAnchor) table.setRangesState([`${rangeAnchor}:${rangeAnchor}`]);
                else {
                    const range = table.getState().ranges[0];
                    const firstCell = table.getCellTitlesInRange(range)[0];

                    if (firstCell) {
                        table.setRangesState([`${firstCell}:${firstCell}`]);
                        table.setRangeAnchorState(firstCell);
                    }
                }
            },

            /**
             * @param {number} columnNumber
             */
            columnNumberToTitle: (columnNumber) => {
                const sb = [];
                while (columnNumber !== 0) {
                    columnNumber--;
                    sb.push(String.fromCharCode((columnNumber % 26) + "A".charCodeAt(0)));
                    columnNumber = Math.floor(columnNumber / 26);
                }
                return sb.reverse().join("");
            },

            /**
             * @param {string} columnTitle
             */
            columnTitleToNumber: (columnTitle) => {
                let number = 0;
                const len = columnTitle.length;
                for (let i = 0; i < len; i++) {
                    number = columnTitle[i].charCodeAt(0) - "A".charCodeAt(0) + 1 + number * 26;
                }
                return number;
            },

            /**
             * @param {string} range
             */
            cellsInRange: (range) => {
                const execArr1 = columnRangeReg.exec(range);

                // A:A A:C 多列选中，返回所在列的第一行
                if (execArr1) {
                    const [_, start, end] = execArr1;
                    if (start === end) return [`${start}1`];
                    return [`${start}1`, `${end}1`];
                }

                // 1:1 1:3 多行选中，返回所在行的第一列
                const execArr2 = rowRangeReg.exec(range);
                if (execArr2) {
                    const [_, start, end] = execArr2;
                    if (start === end) return [`A${start}`];
                    return [`A${start}`, `A${end}`];
                }

                const execArr = rangeReg.exec(range);
                if (!execArr) return [];
                const res = [];
                const [, startColumn, startRow, endColumn, endRow] = execArr;
                const startColumnNumber = table.columnTitleToNumber(startColumn);
                const endColumnNumber = table.columnTitleToNumber(endColumn);
                const startRowNumber = parseInt(startRow);
                const endRowNumber = parseInt(endRow);
                for (let j = startRowNumber; j <= endRowNumber; j++) {
                    for (let i = startColumnNumber; i <= endColumnNumber; i++) {
                        res.push(table.columnNumberToTitle(i) + j);
                    }
                }
                return res;
            },

            /**
             * @param {string} range
             */
            fixRange: (range) => {
                if (table.__cache.fixedRange[range]) return table.__cache.fixedRange[range];
                /**
                 * 特殊情况：
                 * 1. A:A A:C 多列选中
                 * 2. 1:1 1:3 多行选中
                 * 3. # 整表选中
                 */
                if (range === "#" || columnRangeReg.test(range) || rowRangeReg.test(range)) {
                    table.__cache.fixedRange[range] = range;
                    return range;
                }

                const execArr = rangeReg.exec(range);
                if (!execArr) throw new Error(`range format error: ${range}`);

                const [, startColumn, startRow, endColumn, endRow] = execArr;

                // 特殊情况：A2:A2
                if (startColumn === endColumn && startRow === endRow) {
                    table.__cache.fixedRange[range] = range;
                    return range;
                }

                const startColumnNumber = table.columnTitleToNumber(startColumn);
                const endColumnNumber = table.columnTitleToNumber(endColumn);
                const startRowNumber = parseInt(startRow);
                const endRowNumber = parseInt(endRow);
                /** @type {string | undefined} */
                let newRange;

                // 第四象限
                if (startColumnNumber <= endColumnNumber && startRowNumber <= endRowNumber) {
                    newRange = range;
                }
                // 第二象限
                else if (startColumnNumber >= endColumnNumber && startRowNumber > endRowNumber) {
                    newRange = `${endColumn}${endRow}:${startColumn}${startRow}`;
                }
                // 第一象限
                else if (startColumnNumber < endColumnNumber && startRowNumber > endRowNumber) {
                    newRange = `${startColumn}${endRow}:${endColumn}${startRow}`;
                }
                // 第三象限
                else if (startColumnNumber > endColumnNumber && startRowNumber <= endRowNumber) {
                    newRange = `${endColumn}${startRow}:${startColumn}${endRow}`;
                }

                let fixedRange = newRange || range;
                if (table.options.enableSpanning) {
                    // 开启合并拆分单元格，需要找四个方向的最大值
                    fixedRange = table.getMaximumRange(fixedRange);
                }

                table.__cache.fixedRange[range] = fixedRange;
                if (range !== fixedRange) table.__cache.fixedRange[fixedRange] = fixedRange;
                return fixedRange;
            },

            getCellColRowTitleNumber: (cellTitle) => {
                const execArr = cellTitleReg.exec(cellTitle);
                if (!execArr) return;

                const [_, col, row] = execArr;
                return [table.columnTitleToNumber(col), parseInt(row)];
            },

            getMaximumRange: (range) => {
                /** @type {string[]} */
                let rangeCells = [];

                if (table.__cache.cellsInRange[range]) {
                    rangeCells.concat(table.__cache.cellsInRange[range]);
                } else {
                    rangeCells = table.cellsInRange(range);
                }

                rangeCells = rangeCells.flatMap((cellTitle) => {
                    const cell = table.getCellByTitle(cellTitle);
                    if (!cell) return [];

                    const cornerCells = cell.getSpanningCornerCells();
                    if (!cornerCells) return cellTitle;

                    return cornerCells.map((cell) => cell.getTitle());
                });

                // table.getCell
                const colRows = rangeCells.reduce(
                    /** @param {{ cols: number[]; rows: number[] }} acc */
                    (acc, cellTitle) => {
                        const cellTitleNumbers = table.getCellColRowTitleNumber(cellTitle);
                        if (cellTitleNumbers) {
                            acc.cols.push(cellTitleNumbers[0]);
                            acc.rows.push(cellTitleNumbers[1]);
                        }

                        return acc;
                    },
                    { cols: [], rows: [] },
                );

                if (!(colRows.cols.length && colRows.rows.length)) return range;

                const maxCol = Math.max(...colRows.cols);
                const minCol = Math.min(...colRows.cols);
                const maxRow = Math.max(...colRows.rows);
                const minRow = Math.min(...colRows.rows);

                const result = `${table.columnNumberToTitle(minCol)}${minRow}:${table.columnNumberToTitle(
                    maxCol,
                )}${maxRow}`;

                return result;
            },

            setRangeSelectingInfo: (updater) => table.options.onRangeSelectingInfoChange?.(updater),

            getRangeSelectingHandler: () => {
                /**
                 * @param {Element | EventTarget | null} target
                 * @returns {HTMLTableCellElement | null}
                 */
                const findClosestCell = (target) => {
                    if (!target || !(target instanceof HTMLElement)) return null;
                    return target.closest("td.data-cell");
                };
                /** @type {string[]} */
                const ranges = [];

                return (e) => {
                    // @ts-ignore
                    e.persist?.();

                    if (!isMouseDownEvent(e)) return;

                    // 暂时不处理触摸事件
                    // if (isTouchStartEvent(e)) return;

                    // 不处理右键点击（触发上下文）
                    if (e.buttons === 2) return;
                    // 在mac下，`ctrl`+点击也会触发上下文菜单
                    else if (e.ctrlKey && e.buttons === 1) return;

                    const currentTarget = e.currentTarget;
                    if (!(currentTarget instanceof HTMLElement)) return;

                    /** @type {import("./ranges").RangeSelectingInfoState | undefined} */
                    const prevInfo = table.getState().rangeSelectingInfo;

                    /** @type {HTMLTableCellElement | null} */
                    let anchorCell = null;

                    if (e.shiftKey) {
                        anchorCell = currentTarget.querySelector("td.range-anchor");

                        if (!anchorCell) {
                            anchorCell = e.target && findClosestCell(e.target);
                        }
                    } else {
                        ranges.splice(0, ranges.length);
                        anchorCell = findClosestCell(e.target);
                    }
                    if (!anchorCell) return;

                    const info = getDefaultRangeSelectingInfoState();

                    if (anchorCell) {
                        info.startRef = anchorCell.dataset.cellTitle || "A1";
                    }

                    if (prevInfo?.startRef === info.startRef) {
                        if (prevInfo?.isDblclick) return;
                        info.isDblclick = e.detail > 1;
                    } else {
                        info.isDblclick = false;
                    }

                    table.setState((old) => ({
                        ...old,
                        /** @type {*} */
                        rangeAnchor: info.startRef,
                        isEditingRangeAnchor: info.isDblclick,
                    }));

                    const ctrlKey = e.ctrlKey;

                    const onMove = debounce(
                        /** @param {MouseEvent} e */ (e) => {
                            const endElement = document.elementFromPoint(e.x, e.y);
                            const lastCell = endElement && findClosestCell(endElement);

                            if (lastCell) {
                                info.endRef = lastCell.dataset.cellTitle || null;
                            }

                            if (info.endRef === info.startRef && info.isDblclick) return;

                            if (info.isDblclick) {
                                info.isDblclick = false;
                                table.setState((old) => ({
                                    ...old,
                                    isEditingRangeAnchor: info.isDblclick,
                                }));
                            }

                            if (!ctrlKey) {
                                if (info.startRef && info.endRef) {
                                    ranges.splice(0, ranges.length, `${info.startRef}:${info.endRef}`);
                                } else ranges.splice(0, ranges.length);
                            }

                            table.setRangeSelectingInfo(info);
                            table.setRangesState(ranges);

                            e.preventDefault();
                        },
                        100,
                        { leading: false, trailing: true, maxWait: 200 },
                    );

                    /** @param {MouseEvent} e */
                    const onEnd = (e) => {
                        if (info.isDblclick) return;

                        const lastCell = e.target && findClosestCell(e.target);

                        if (lastCell) {
                            info.endRef = lastCell.dataset.cellTitle || null;
                        }

                        if (info.endRef && info.startRef) {
                            if (!ctrlKey) ranges.splice(0, ranges.length, `${info.startRef}:${info.endRef}`);
                            else ranges.push(`${info.startRef}:${info.endRef}`);
                        }

                        table.setRangeSelectingInfo(info);
                        table.setRangesState(ranges);
                    };

                    const mouseEvents = {
                        /** @param {MouseEvent} e */
                        moveHandler: (e) => onMove(e),
                        /** @param {MouseEvent} e */
                        upHandler: (e) => {
                            document.removeEventListener("mousemove", mouseEvents.moveHandler);
                            document.removeEventListener("mouseup", mouseEvents.upHandler);
                            onEnd(e);
                        },
                    };

                    const passiveIfSupported = passiveEventSupported() ? { passive: false } : false;

                    document.addEventListener("mousemove", mouseEvents.moveHandler, passiveIfSupported);
                    document.addEventListener("mouseup", mouseEvents.upHandler, passiveIfSupported);

                    table.setRangeSelectingInfo(info);
                };
            },
        };
    },

    /**
     * @template {import('@tanstack/table-core').RowData} TData
     * @param {import("@tanstack/table-core").Row<TData>} row
     * @param {import("@tanstack/table-core").Table<TData>} table
     * @returns {import("./ranges").RangeRow<TData>}
     */
    createRow: (row, table) => {
        return {
            getTitle() {
                return (row.index + 1).toString();
            },
            getIsInRange: () => {
                const ranges = table.getState().ranges;
                if (!ranges) return false;
                else if (ranges.some((r) => r === "#")) return false;

                const rowTitle = row.getTitle();
                const rowReg = new RegExp(`^([A-Z]+)(${rowTitle})$`);

                return ranges.some((r) => {
                    const execArr = rowRangeReg.exec(r);
                    if (execArr) return false;

                    return table.getCellTitlesInRange(r).some((c) => rowReg.test(c));
                });
            },

            getIsRowInRange: () => {
                const ranges = table.getState().ranges;
                if (!ranges) return false;
                else if (ranges.some((r) => r === "#")) return false;

                const rowTitle = row.getTitle();

                return ranges.some((r) => {
                    const execArr = rowRangeReg.exec(r);
                    if (execArr) {
                        const [_, start, end] = execArr;
                        const i = parseInt(rowTitle);
                        return parseInt(start) <= i && i <= parseInt(end);
                    }

                    return false;
                });
            },
        };
    },

    /**
     * @template {import('@tanstack/table-core').RowData} TData
     * @template TValue
     *
     * @param {import("@tanstack/table-core").Column<TData, TValue>} column
     * @param {import("@tanstack/table-core").Table<TData>} table
     * @returns {import("./ranges").RangeColumn<TData, TValue>}
     */
    createColumn: (column, table) => {
        return {
            /** @returns {string} */
            getTitle: () => {
                if (!table.__cache.columnTitleMap) table.__cache.columnTitleMap = {};
                const index = table.getAllColumns().findIndex((col) => col.id === column.id);

                if (!table.__cache.columnTitleMap[index]) {
                    table.__cache.columnTitleMap[index] = table.columnNumberToTitle(index + 1);
                }

                return table.__cache.columnTitleMap[index];
            },

            getIsInRange: () => {
                const ranges = table.getState().ranges;
                if (!ranges) return false;
                else if (ranges.some((r) => r === "#")) return false;

                const colTitle = column.getTitle();
                const colReg = new RegExp(`^(${colTitle})([1-9]\\d*)$`);

                return ranges.some((r) => {
                    const execArr = columnRangeReg.exec(r);
                    if (execArr) return false;

                    return table.getCellTitlesInRange(r).some((c) => colReg.test(c));
                });
            },

            getIsColumnInRange: () => {
                const ranges = table.getState().ranges;
                if (!ranges) return false;
                else if (ranges.some((r) => r === "#")) return false;

                const i = table.columnTitleToNumber(column.getTitle());

                return ranges.some((r) => {
                    const execArr = columnRangeReg.exec(r);
                    if (execArr) {
                        const [_, start, end] = execArr;
                        return table.columnTitleToNumber(start) <= i && i <= table.columnTitleToNumber(end);
                    }

                    return false;
                });
            },
        };
    },

    /**
     * @template {import('@tanstack/table-core').RowData} TData
     * @template TValue
     *
     * @param {import("@tanstack/table-core").Cell<TData, TValue>} cell
     * @param {import("@tanstack/table-core").Column<TData, TValue>} column
     * @param {import("@tanstack/table-core").Row<TData>} row
     * @param {import("@tanstack/table-core").Table<TData>} table
     * @returns {import("./ranges").RangeCell<TData, TValue>}
     */
    createCell: (cell, column, row, table) => {
        return {
            getTitle() {
                return column.getTitle() + row.getTitle();
            },
            getIsRangeAnchor() {
                const state = table.getState();
                const cellTitle = cell.getTitle();

                return cellTitle === state.rangeAnchor;
            },
            getIsInRange: () => {
                const ranges = table.getState().ranges;
                if (!ranges) return false;
                else if (ranges.some((r) => r === "#")) return false;

                const cellTitle = cell.getTitle();

                return ranges.some((r) => {
                    return table.getCellTitlesInRange(r).some((c) => c === cellTitle);
                });
            },
            getIsRangeLast: () => {
                const ranges = table.getState().ranges;
                if (!ranges) return false;
                const cellTitle = cell.getTitle();
                return ranges.some((r) => {
                    const [_, last] = r.split(":");
                    return last === cellTitle;
                });
            },
            getIsEditingRangeAnchor: () => {
                return cell.getIsRangeAnchor() && table.getState().isEditingRangeAnchor;
            },
        };
    },
};
