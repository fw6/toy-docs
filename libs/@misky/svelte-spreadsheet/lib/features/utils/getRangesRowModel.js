import { memo } from "@tanstack/table-core";

/**
 * @template {import('@tanstack/table-core').RowData} TData
 * @returns {(table: import('@tanstack/table-core').Table<TData>) => () => import('./getRangesRowModel').RangesRowModel<TData> }
 */
export function getRangesRowModel() {
    return (table) =>
        memo(
            () => [table.getPreRangesRowModel()],
            /** @returns {import('./getRangesRowModel').RangesRowModel<TData>} */
            (rowModel) => {
                if (!rowModel.rows.length)
                    return {
                        ...rowModel,
                        rowsByTitle: {},
                    };
                /** @type {Record<string, import('@tanstack/table-core').Row<TData>>} */
                const rowsByTitle = {};
                rowModel.flatRows.forEach((row) => {
                    rowsByTitle[row.getTitle()] = row;
                });

                return {
                    rows: rowModel.rows,
                    flatRows: rowModel.flatRows,
                    rowsById: rowModel.rowsById,
                    rowsByTitle,
                };
            },
            {
                key: process.env.NODE_ENV === "development" && "getRangesRowModel",
                debug: () => table.options.debugAll ?? table.options.debugTable,
            },
        );
}
