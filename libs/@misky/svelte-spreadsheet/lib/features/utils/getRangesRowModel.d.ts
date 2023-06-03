import type { Table } from "@tanstack/table-core";
import { type Row, type RowData, type RowModel } from "@tanstack/table-core";

export interface RangesRowModel<TData extends RowData> extends RowModel<TData> {
    rowsByTitle: Record<string, Row<TData>>;
}

export function getRangesRowModel<TData>(): (table: Table<TData>) => () => RangesRowModel<TData>;
