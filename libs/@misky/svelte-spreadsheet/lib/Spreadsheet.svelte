<script>
    import {
        createTable,
        getCoreRowModel,
        getFacetedUniqueValues,
    } from "@tanstack/table-core";
    import { nanoid } from "nanoid";
    import { createEventDispatcher } from "svelte";

    import ContextMenu from "./components/ContextMenu/ContextMenu.svelte";
    import DataCell from "./components/DataCell/DataCell.svelte";
    import HeaderCell from "./components/HeaderCell/HeaderCell.svelte";

    import { setEmitterContext } from "./context/emitter";

    import { Ranges } from "./features/ranges";
    import { Command, Spanning, isSpanningData } from "./features/spanning";
    import { getRangesRowModel } from "./features/utils/getRangesRowModel";
    import { FIELD_TYPE } from "./types/field";

    /**
     * @typedef {DataType} CellValueType
     * @typedef {DataType[]} RowDataType
     */

    // #region Component Props

    /** @type {FieldConfig[]} */
    export let columns;

    /** @type {DataSource} */
    export let data;

    /** @type {import('@local/intl').Locales} */
    export let locale = "zh-CN";

    /** @type {Align} */
    export let align = "t l";

    /** @type {Permission} */
    export let permission = "view";

    // #endregion

    // #region Component Events

    /**
     * @type {ReturnType<typeof import('svelte').createEventDispatcher<{delete: never;change: { data: DataSource; columns: FieldConfig[] };}>>}
     */
    const dispatcher = createEventDispatcher();
    const emitter = setEmitterContext();

    // #endregion

    // #region Component Methods
    export function forwardRef() {
        return containerElementRef;
    }

    /**
     * @param {Command.INSERT_ROW_ABOVE | Command.INSERT_ROW_BELOW | Command.INSERT_COLUMN_LEFT | Command.INSERT_COLUMN_RIGHT} command
     * @param {string[]} [ranges]
     */
    export function insertRowsOrColumns(command, ranges) {
        const [baseIndex, insertedData] = table.getInsertedTData(
            command,
            ranges
        );
        data = insertedData;

        if (
            command === Command.INSERT_COLUMN_LEFT ||
            command === Command.INSERT_COLUMN_RIGHT
        ) {
            columns.splice(baseIndex, 0, {
                fieldId: nanoid(10),
                fieldName: "",
                type: FIELD_TYPE.TEXT,
            });
            columns = columns;
            emitter.emit("insert", "cols");
        } else emitter.emit("insert", "rows");

        table = getTable();

        dispatcher("change", { data, columns });
        emitter.emit("change");
    }

    /**
     * @param {Command.DELETE_ROWS | Command.DELETE_COLUMNS} command
     * @param {string} [range]
     */
    export function deleteRowsOrColumns(command, range) {
        const { data: newData, scope } = table.getDeletedTData(command, range);
        data = newData;

        if (command === Command.DELETE_COLUMNS) {
            columns.splice(scope[0], scope[1] - scope[0] + 1);
            columns = columns;
            emitter.emit("delete", "cols");
        } else {
            columns.forEach((column) => {
                if (column.cellConfigs) {
                    const len = scope[1] - scope[0] + 1;
                    // 更新列的单元格单个属性配置
                    column.cellConfigs = Object.entries(
                        column.cellConfigs
                    ).reduce(
                        /** @param {Record<string, Record<string, string>>} acc */
                        (acc, [rowIndex, cellConfig]) => {
                            const _rowIndex = parseInt(rowIndex);

                            if (_rowIndex < scope[0]) {
                                acc[_rowIndex] = cellConfig;
                                return acc;
                            } else if (_rowIndex > scope[1]) {
                                acc[_rowIndex - len] = cellConfig;
                            }
                            return acc;
                        },
                        {}
                    );
                    if (Object.keys(column.cellConfigs).length === 0)
                        column.cellConfigs = undefined;
                }
            });

            emitter.emit("delete", "rows");
        }

        table = getTable();

        dispatcher("change", { data, columns });
        emitter.emit("change");
    }

    // #endregion

    // #region Functions
    const generateColumns = () => {
        return columns.reduce(
            /** @param {import("@tanstack/table-core").ColumnDef<RowDataType, CellValueType>[]} total */
            (total, col, index) => {
                /** @type {import("@tanstack/table-core").ColumnDef<RowDataType, CellValueType>} */
                const columnDef = {
                    // 用于从data中获取value（cell.getValue会用到）
                    accessorFn: (originalRow, i) => {
                        const value = originalRow[index];

                        if (isSpanningData(value)) return value;
                        else if (col.type === FIELD_TYPE.AUTO_SERIAL) {
                            return i + 1;
                        }

                        // TODO 可以在这里做一些格式校验的事情，暂时先不加
                        return value;
                    },
                    id: col.fieldId,
                    header: col.fieldName,
                    meta: {
                        field: col,
                    },
                    size: col.size,
                    minSize: 50,
                    maxSize: 1000,
                    enablePinning: false,
                };

                total.push(columnDef);
                return total;
            },
            []
        );
    };

    /**
     * @returns {import("@tanstack/table-core").Table<RowDataType>}
     */
    const getTable = () => {
        return createTable({
            data,
            columnResizeMode: "onEnd",
            enablePinning: false,
            columns: generateColumns(),
            state: tableState,
            onStateChange: (updater) => {
                if (permission === "view") return;

                const isResizingColumn =
                    tableState.columnSizingInfo?.isResizingColumn || false;
                if (updater instanceof Function) {
                    tableState = updater(/** @type {*} */ (tableState));
                } else tableState = updater;

                table.setOptions((prev) => ({
                    ...prev,
                    state: tableState,
                }));

                // rerender
                rows = table.getRowModel().rows;
                headerGroups = table.getHeaderGroups();
                isTableInRange =
                    tableState.ranges?.some((r) => r === "#") || false;

                // 更新完Size
                if (
                    isResizingColumn &&
                    !tableState.columnSizingInfo?.isResizingColumn
                ) {
                    headerGroups[0].headers.forEach((header) => {
                        const field = header.column.columnDef.meta?.field;
                        if (field) field.size = header.column.getSize();
                    });
                    columns = columns;
                    emitter.emit("column:resized");
                }
            },
            enableRowSelection: true,
            enableSpanning: true,
            renderFallbackValue: "",

            getCoreRowModel: getCoreRowModel(),
            getFacetedUniqueValues: getFacetedUniqueValues(),
            getRangesRowModel: getRangesRowModel(),

            features: [Ranges, Spanning],

            meta: {
                updateData(rowIndex, colIndex, value) {
                    data = data.map((row, index) => {
                        if (index === rowIndex) {
                            row[colIndex] = value;
                        }
                        return row;
                    });

                    dispatcher("change", { data, columns });
                    emitter.emit("change");
                },
                updateColumns(fieldId, fieldConfig) {
                    const idx = columns.findIndex((c) => c.fieldId === fieldId);
                    if (idx !== -1) {
                        columns[idx] = fieldConfig;
                        columns = columns;
                        // TODO: validate column data!!!

                        table.setOptions((prev) => ({
                            ...prev,
                            columns: generateColumns(),
                        }));
                        headerGroups = table.getHeaderGroups();

                        dispatcher("change", { data, columns });
                        emitter.emit("change");
                    }
                },
            },
        });
    };

    /**
     * @param {string} key
     * @param {unknown} [value]
     */
    const updateColumnFieldCellConfig = (key, value) => {
        const cells = table.getCellsInAllRange();
        cells.forEach((cell) => {
            if (isSpanningData(cell.getValue())) return;

            const field = cell.column.columnDef.meta?.field;
            if (!field) throw new Error("field is required");
            if (!field.cellConfigs) field.cellConfigs = {};
            if (!field.cellConfigs[cell.row.index])
                field.cellConfigs[cell.row.index] = {};

            if (typeof value === "string")
                field.cellConfigs[cell.row.index][key] = value;
            else delete field.cellConfigs[cell.row.index][key];

            if (Object.keys(field.cellConfigs[cell.row.index]).length === 0)
                delete field.cellConfigs[cell.row.index];

            if (Object.keys(field.cellConfigs).length === 0)
                field.cellConfigs = undefined;
        });

        columns = columns;
        table.setOptions((prev) => ({
            ...prev,
            columns: generateColumns(),
        }));

        headerGroups = table.getHeaderGroups();
        rows = table.getRowModel().rows;

        dispatcher("change", { data, columns });
        emitter.emit("change");
    };

    // #endregion

    /** @param {MouseEvent} e */
    const onContextmenu = (e) => {
        if (!tableRef) return;
        if (permission !== "edit") return;

        visibleContextMenu = true;
        const clientRect = tableRef.getBoundingClientRect();

        contextMenuOffset = {
            y: e.y - clientRect.y,
            x: e.x - clientRect.x,
        };
    };

    /**
     * @param {CustomEvent<{ command: Command; value?: unknown }>} e
     */
    const onContextmenuExecuteCommand = (e) => {
        const { command, value } = e.detail;

        switch (command) {
            case Command.SPLIT:
                data = table.getSplittedTData();
                table = getTable();
                break;
            case Command.MERGE:
                data = table.getMergedTData();
                table = getTable();
                break;
            case Command.INSERT_ROW_ABOVE:
            case Command.INSERT_ROW_BELOW:
            case Command.INSERT_COLUMN_LEFT:
            case Command.INSERT_COLUMN_RIGHT:
                if (
                    Array.isArray(value) &&
                    value.every((v) => typeof v === "string")
                )
                    insertRowsOrColumns(command, value);
                else insertRowsOrColumns(command);

                break;
            case Command.SELECT_COLUMNS:
                if (value === undefined || typeof value === "string")
                    table.selectColumns(value);
                emitter.emit("select", "cols");
                break;
            case Command.SELECT_ROWS:
                if (value === undefined || typeof value === "string")
                    table.selectRows(value);
                emitter.emit("select", "rows");
                break;
            case Command.SELECT_TABLE:
                table.selectTable();
                emitter.emit("select", "table");
                break;
            case Command.SELECT_CELL:
                table.selectCell();
                emitter.emit("select", "cells");
                break;
            case Command.DELETE_ROWS:
            case Command.DELETE_COLUMNS:
                if (value === undefined || typeof value === "string")
                    deleteRowsOrColumns(command, value);
                break;
            case Command.DELETE_TABLE:
                dispatcher("delete");
                emitter.emit("delete", "table");
                break;
            case Command.CELL_ALIGN_TYPE:
                if (!value) throw new Error("value is required");
                else if (typeof value !== "string")
                    throw new Error("value must be string");

                updateColumnFieldCellConfig("align", value);
                emitter.emit("update:data_cell", "align");
                break;
            case Command.CELL_BACKGROUND_COLOR:
                updateColumnFieldCellConfig("backgroundColor", value);
                emitter.emit("update:data_cell", "bg");
                break;
            default:
                break;
        }

        visibleContextMenu = false;
        dispatcher("change", { data, columns });
        emitter.emit("change");
    };

    // #region Component Data
    /** @type {HTMLElement} */
    let containerElementRef;

    /** @type {Partial<import("@tanstack/table-core").TableState>} */
    let tableState = {
        ranges: ["A1:A1"],
        rangeAnchor: "A1",

        columnPinning: {},
        columnOrder: [],
        columnVisibility: {},
        rowSelection: {},
        columnSizingInfo: {
            startOffset: null,
            startSize: null,
            deltaOffset: null,
            deltaPercentage: null,
            isResizingColumn: false,
            columnSizingStart: [],
        },
        columnSizing: {},
    };

    let isTableInRange = false;
    // 用于重渲染整个表格
    let table = getTable();
    let rows = table.getRowModel().rows;
    let headerGroups = table.getHeaderGroups();

    /** @type {HTMLTableElement | undefined} */
    let tableRef;
    // FIXME https://github.com/sveltejs/svelte/issues/6127
    /** @type {HTMLTableRowElement[]} */
    let rowElements = [];

    let visibleContextMenu = false;
    let contextMenuOffset = {
        x: 0,
        y: 0,
    };
    let rangeSelectingHandler = table.getRangeSelectingHandler();
    $: rangeSelectingHandler =
        permission !== "view" ? table.getRangeSelectingHandler() : () => {};
    // #endregion

    // #region Component Watcher
    $: {
        if (permission) {
            table = getTable();
        }
    }
    $: rows = table.getRowModel().rows;
    $: headerGroups = table.getHeaderGroups();
    // #endregion
</script>

<!--
多维表格组件
-->

<!--
stylify-customSelectors
    '.svelte-spreadsheet': `
        position:relative width:fit-content overflow:visible

        table {
            display:block width:fit-content max-width:100% margin:0 white-space:nowrap user-select:none border-collapse:collapse

            thead {
                position:relative
            }
        }
    `
/stylify-customSelectors
-->

<div class="svelte-spreadsheet" bind:this={containerElementRef}>
    <table
        bind:this={tableRef}
        on:dragstart|stopPropagation|preventDefault
        class="inner-table"
        class:table-active={isTableInRange}
        data-align={align}
        on:contextmenu|preventDefault|stopPropagation={onContextmenu}
        on:mousedown={rangeSelectingHandler}
    >
        <thead>
            {#each headerGroups as headerGroup}
                <tr bind:this={rowElements[0]}>
                    {#each headerGroup.headers as header}
                        <HeaderCell {permission} {header} />
                    {/each}
                </tr>
            {/each}
        </thead>

        <tbody>
            {#each rows as row, index (index)}
                {@const cells = row.getSpanningCells()}
                <tr
                    data-row-id={row.id}
                    class:active={row.getIsRowInRange()}
                    style:position="unset"
                    bind:this={rowElements[index + 1]}
                >
                    {#each cells as cell, i (i)}
                        <DataCell
                            info={cell.getContext()}
                            {permission}
                            fieldConfig={columns[
                                cell.column.getSpanningColumnIndex()
                            ]}
                        />
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>

    {#if visibleContextMenu}
        <ContextMenu
            {...contextMenuOffset}
            {table}
            tableAlign={align}
            on:hide={() => (visibleContextMenu = false)}
            on:command={onContextmenuExecuteCommand}
        />
    {/if}
</div>

<style lang="css">
    .svelte-spreadsheet {
        & .inner-table {
            &.table-active {
                background-color: rgb(30 110 207 / 20%);
            }

            & tbody {
                & tr {
                    &.active {
                        background-color: rgb(30 110 207 / 20%);
                    }
                }
            }
        }
    }
</style>
