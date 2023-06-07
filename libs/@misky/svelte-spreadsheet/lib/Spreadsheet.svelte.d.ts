import type { RowData } from "@tanstack/table-core";
import type { SvelteComponentTyped } from "svelte";
import type { Command } from "./features/spanning";
import type { DataSource, DataType } from "./types/data";
import type { Align, FieldConfig } from "./types/field";

declare module "@tanstack/table-core" {
    interface TableMeta<TData extends RowData> {
        updateData: (rowIndex: number, colIndex: number, value: DataType) => void;

        updateColumns: (fieldId: string, value: FieldConfig) => void;
    }

    interface ColumnMeta<TData extends RowData, TValue> {
        field: FieldConfig;
    }
}

/**
 * 用户权限
 */
export type Permission =
    | "view" // 不显示右键菜单、不允许任何编辑
    | "edit" // 完全没限制
    | "fillIn"; // 只允许编辑DataCell中的值，只允许增加行，其他任何操作都禁止

declare const __propDef: {
    props: {
        columns: FieldConfig[];
        data: DataSource;
        align?: Align | undefined;
        permission?: Permission | undefined;

        forwardRef?: (() => HTMLElement) | undefined;
        insertRowsOrColumns?:
            | ((
                  command:
                      | Command.INSERT_ROW_ABOVE
                      | Command.INSERT_ROW_BELOW
                      | Command.INSERT_COLUMN_LEFT
                      | Command.INSERT_COLUMN_RIGHT,
                  ranges?: string[],
              ) => void)
            | undefined;
        deleteRowsOrColumns?:
            | ((command: Command.DELETE_ROWS | Command.DELETE_COLUMNS, range?: string) => void)
            | undefined;
    };

    events: {
        dragstart: DragEvent;
        delete: CustomEvent<never>;
        change: CustomEvent<{
            data: DataSource;
            columns: FieldConfig[];
        }>;
        resize: CustomEvent<number>;
    } & {
        [evt: string]: CustomEvent<unknown>;
    };

    slots: {};
};

export type SpreadsheetProps = typeof __propDef.props;
export type SpreadsheetEvents = typeof __propDef.events;
export type SpreadsheetSlots = typeof __propDef.slots;

/**
 * 多维表格组件
 */
export default class SpreadSheet extends SvelteComponentTyped<SpreadsheetProps, SpreadsheetEvents, SpreadsheetSlots> {
    get forwardRef(): () => HTMLElement;
    get insertRowsOrColumns(): (
        command:
            | Command.INSERT_ROW_ABOVE
            | Command.INSERT_ROW_BELOW
            | Command.INSERT_COLUMN_LEFT
            | Command.INSERT_COLUMN_RIGHT,
        ranges?: string[] | undefined,
    ) => void;
    get deleteRowsOrColumns(): (
        command: Command.DELETE_ROWS | Command.DELETE_COLUMNS,
        range?: string | undefined,
    ) => void;
}

export {};
