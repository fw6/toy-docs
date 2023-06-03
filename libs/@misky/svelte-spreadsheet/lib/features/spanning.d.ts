import type { Cell, RowData, TableFeature } from "@tanstack/table-core";

declare module "@tanstack/table-core" {
    interface FeatureOptions<TData extends RowData> extends SpanningOptions<TData> {}

    interface Table<TData extends RowData> extends SpanningInstance<TData> {}

    interface Row<TData extends RowData> extends SpanningRow<TData> {}

    interface Column<TData extends RowData, TValue> extends SpanningColumn<TData, TValue> {}

    interface Cell<TData extends RowData, TValue> extends SpanningCell<TData, TValue> {}
}

export enum SpanningData {
    /**
     * 行合并（左边某个单元格）U+2190
     */
    ROW = "←",

    /**
     * 列合并（正上方某个单元格）U+2191
     */
    COLUMN = "↑",

    /**
     * 行列都被合并（左上方某个单元格）U+2196
     */
    BOTH = "↖",
}

export enum Command {
    MERGE = 1,
    SPLIT = 2,

    INSERT_ROW_ABOVE = 3,
    INSERT_ROW_BELOW = 4,
    INSERT_COLUMN_LEFT = 5,
    INSERT_COLUMN_RIGHT = 6,

    SELECT_ROWS = 7,
    SELECT_COLUMNS = 8,
    SELECT_CELL = 9,
    SELECT_TABLE = 10,

    DELETE_ROWS = 11,
    DELETE_COLUMNS = 12,
    DELETE_TABLE = 13,

    CELL_ALIGN_TYPE = 14,
    CELL_BACKGROUND_COLOR = 15,
}

interface SpanningInstance<TData extends RowData> {
    /**
     * 获取包含合并拆分类型的表格数据
     */
    getSpanningData: () => unknown[][];

    /**
     * 获取是否允许合并的状态，选中单元格多于1，即可合并
     */
    getIsAllowMerging: () => boolean;

    /**
     * 获取是否允许拆分的状态，选中单元格存在已被合并的单元格，就可以拆分
     */
    getIsAllowSplitting: () => boolean;

    /**
     * 获取拆分当前选区单元格后的表格数据
     */
    getSplittedTData: () => string[][];

    /**
     * 获取合并当前选区单元格后的表格数据
     */
    getMergedTData: () => string[][];

    /**
     * 获取插入行/列后的表格数据
     */
    getInsertedTData: (
        type:
            | Command.INSERT_COLUMN_LEFT
            | Command.INSERT_COLUMN_RIGHT
            | Command.INSERT_ROW_ABOVE
            | Command.INSERT_ROW_BELOW,
        ranges?: string[],
    ) => [number, string[][]];

    /**
     * 获取向当前首个Range的列左侧插入后的TData
     *
     * 1. 当前列为首列，全部为新数据
     * 2. 当前列中，存在合并数据，且合并数据仅为垂直合并（OSpanningData.COLUMN），全部为新数据
     * 3. 否则（当前列中，存在水平合并或双向合并）
     *  3.1 水平合并首行，左侧插入的列，需要合并到当前列的合并列中（OSpanningData.ROW）
     *  3.2 水平合并非首行，左侧插入的列，需要判断前一列类型，如果为垂直合并数据，修改原数据为双向合并（OSpanningData.BOTH），插入的新数据为垂直合并（OSpanningData.COLUMN）
     *  3.3 否则，插入的新数据为双向合并（OSpanningData.BOTH）
     */
    _getColumnLeftInsertedTData: (ranges?: string[]) => [number, string[][]];

    /**
     * 获取向所有Range的最右侧列的右侧插入后的TData
     *
     * 1. 当前列为最后一列，全部为新数据
     * 2. 当前列中，存在合并数据，且合并数据仅为垂直合并（OSpanningData.COLUMN），全部为新数据
     * 3. 当前列中，存在合并数据，且合并数据仅为水平合并（OSpanningData.ROW、OSpanningData.BOTH），且下一列只存在垂直合并（OSpanningData.COLUMN），全部为新数据
     * 4. 否则
     *  4.1 水平合并首行，右侧插入的列，需要合并到当前列的合并列中（OSpanningData.ROW）
     *  4.2 水平合并非首行（OSpanningData.COLUMN（不可能）、OSpanningData.BOTH），插入新值OSpanningData.BOTH
     */
    _getColumnRightInsertedTData: (ranges?: string[]) => [number, string[][]];

    /**
     * 获取向当前Range的最上一行的上方插入新行后的TData
     *
     * 1. 当前行为第一行，，全部为新数据
     * 2. 当前行中不存在垂直合并（OSpanningData.COLUMN），全部为新数据
     * 3. 否则
     *  3.1 仅保留上一行的合并数据（OSpanningData.COLUMN、OSpanningData.BOTH）
     */
    _getRowAboveInsertedTData: (ranges?: string[]) => [number, string[][]];

    /**
     * 获取向当前Range的最下一行的下方插入新行后的TData
     *
     * 1. 当前行为最后一行，全部为新数据
     * 2. 当前行的下一行，不存在垂直合并（OSpanningData.COLUMN），全部为新数据
     * 3. 否则
     *  3.1 基于当前行的下一行数据仅保留下一行的合并数据（OSpanningData.COLUMN、OSpanningData.BOTH）
     */
    _getRowBelowInsertedTData: (ranges?: string[]) => [number, string[][]];

    /**
     * 获取删除行/列后的表格数据
     */
    getDeletedTData: (
        type: Command.DELETE_COLUMNS | Command.DELETE_ROWS,
        range?: string,
    ) => {
        scope: [number, number];
        data: string[][];
    };

    /**
     * 获取删除行后的表格数据（删除所有选中的行）
     *
     * 1. 从起始行开始，往上的数据不用处理直接slice
     * 2. 从结束行的下一行开始，向下整理新的数据格式（时间原因，暂时先做到这个程度，实际情况更复杂）
     *  2.1 如果为垂直合并（OSpanningData.COLUMN、OSpanningData.BOTH），将自身设置为默认值，查看身后是否存在水平合并并修正为正确的值
     */
    _getRowsDeletedTData: (range?: string) => {
        scope: [number, number];
        data: string[][];
    };

    /**
     * 获取删除行后的表格数据（删除所有选中的行）
     */
    _getColumnsDeletedTData: (range?: string) => {
        scope: [number, number];
        data: string[][];
    };
}

interface SpanningCell<TData extends RowData, TValue> {
    /**
     * 水平合并
     */
    colSpan: number;
    /**
     * 垂直合并
     */
    rowSpan: number;

    /**
     * 获取单元格所在行的索引
     */
    getIndex: () => number;

    /**
     * 获取合并拆分后的单元格，左上↖️右下↘️角落的单元格
     */
    getSpanningCornerCells: () => [Cell<TData, unknown>, Cell<TData, unknown>] | undefined;

    /**
     * 获取当前被合并单元格，所属的单元格（水平垂直合并后左上角的第一个单元格）
     */
    getSpanningCell: () => Cell<TData, unknown> | undefined;
}
interface SpanningColumn<TData extends RowData, TValue> {
    getSpanningColumnIndex: () => number;
}

interface SpanningRow<TData extends RowData> {
    getSpanningCells: () => Cell<TData, unknown>[];
}

export interface SpanningOptions<TData> {
    enableSpanning?: boolean;
}

export const OSpanningData: {
    readonly ROW: SpanningData.ROW;
    readonly COLUMN: SpanningData.COLUMN;
    readonly BOTH: SpanningData.BOTH;
};
export const isSpanningData: (value: unknown) => boolean;
export const Spanning: TableFeature;
