/**
 * @module extensions/features/range-selection
 * @reference
 * - https://www.w3schools.com/googlesheets/google_sheets_ranges.php
 */

import type { Cell, Column, OnChangeFn, RowData, Table, Updater } from "@tanstack/table-core";
import type { RangesRowModel } from "./utils/getRangesRowModel";

declare module "@tanstack/table-core" {
    interface TableState extends RangeTableState {}

    interface InitialTableState extends Partial<RangeTableState> {}

    interface FeatureOptions<TData extends RowData> extends RangeOptions<TData> {}

    interface Table<TData extends RowData> extends RangeInstance<TData> {}

    interface Row<TData extends RowData> extends RangeRow<TData> {}

    interface Column<TData extends RowData, TValue> extends RangeColumn<TData, TValue> {}

    interface Cell<TData extends RowData, TValue> extends RangeCell<TData, TValue> {}
}

export interface RangeSelectingInfoState {
    /**
     * 当次是否为双击
     *
     * {@link https://developer.mozilla.org/zh-CN/docs/Web/API/UIEvent/detail | MDN}
     */
    isDblclick: boolean;

    /**
     * 开始位置的单元格，如: A1
     */
    startRef: string | null;

    /**
     * 开始位置的单元格，如: B2
     */
    endRef: string | null;
}

export interface RangeTableState {
    /**
     * Ranges are represented in A1 notation.
     */
    ranges: string[];

    /**
     * Range anchor cell title number
     */
    rangeAnchor: string;

    /**
     * Range anchor cell is editing
     */
    isEditingRangeAnchor: boolean;

    rangeSelectingInfo: RangeSelectingInfoState;
}

export interface RangeOptions<TData> {
    onRangesChange?: OnChangeFn<string[]>;

    onRangeAnchorChange?: OnChangeFn<string>;

    onRangeSelectingInfoChange?: OnChangeFn<RangeSelectingInfoState>;

    getRangesRowModel?: (table: Table<TData>) => () => RangesRowModel<TData>;
}

export interface RangeRow<TData> {
    /**
     * 判断当前行，是否有内容被选中
     */
    getIsInRange: () => boolean;

    getIsRowInRange: () => boolean;

    /**
     * 返回当前行的title（第1行为1，第2行为2）
     */
    getTitle: () => string;
}

export interface RangeColumn<TData, TValue> {
    /**
     * 返回当前列的title（用字母表表示的26进制数字，如第1列为A，第2列为B）
     */
    getTitle: () => string;

    getIsInRange: () => boolean;

    getIsColumnInRange: () => boolean;
}
export interface RangeCell<TData, TValue> {
    getIsInRange: () => boolean;
    getTitle: () => string;
    getIsRangeAnchor: () => boolean;
    getIsRangeLast: () => boolean;
    getIsEditingRangeAnchor: () => boolean;
}

export interface RangeInstance<TData extends RowData> {
    /**
     * 当前工作表唯一标识
     */
    sheetId: string;

    // rome-ignore lint/suspicious/noExplicitAny: <explanation>
    __cache: Record<string, any>;

    /**
     * 更新选区
     */
    setRangesState: (ranges: string[]) => void;

    /**
     * 重置选区
     */
    resetRangesState: (defaultState?: boolean) => void;

    setRangeAnchorState: (updater: Updater<string>) => void;

    /**
     * 通过单元格的title获取到Cell
     */
    getCellByTitle: (title: string) => Cell<TData, unknown> | undefined;

    getPreRangesRowModel: () => RangesRowModel<TData>;
    getRangesRowModel: () => RangesRowModel<TData>;
    _getRangesRowModel?: () => RangesRowModel<TData>;

    /**
     * 获取所有Range下的所有单元格
     */
    getCellsInAllRange: () => Cell<TData, unknown>[];

    /**
     * 获取给定Range下的所有单元格
     */
    getCellsInRange: (range: string) => Cell<TData, unknown>[];

    /**
     * 获取给定Range下的所有单元格title
     */
    getCellTitlesInRange: (range: string) => string[];

    /**
     * 选中当前Range下的所有列
     */
    selectColumns: (range?: string) => void;

    /**
     * 选中当前Range下的所有行
     */
    selectRows: (range?: string) => void;

    /**
     * 选中整个表格
     */
    selectTable: () => void;

    /**
     * 选中为rangeAnchor，如果没有找到Range下的第一个单元格
     */
    selectCell: () => void;

    /**
     * 获取选中的行范围，如：1:2
     */
    getSelectedRowRange: () => string | undefined;
    /**
     * 获取选中的列范围，如：A:B
     */
    getSelectedColumnRange: () => string | undefined;

    /**
     * 1 -> A
     * 2 -> B
     * 3 -> C
     * ...
     * 26 -> Z
     * 27 -> AA
     * 28 -> AB
     */
    columnNumberToTitle: (columnNumber: number) => string;
    columnTitleToNumber: (columnTitle: string) => number;

    cellsInRange: (range: string) => string[];

    fixRange: (range: string) => string;

    getCellColRowTitleNumber: (cellTitle: string) => [number, number] | undefined;

    getMaximumRange: (range: string) => string;

    setRangeSelectingInfo: (updater: Updater<RangeSelectingInfoState>) => void;

    getRangeSelectingHandler: () => (event: unknown) => void;
}
