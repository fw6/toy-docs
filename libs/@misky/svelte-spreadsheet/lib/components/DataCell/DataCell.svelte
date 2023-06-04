<script>
    import { fade } from "svelte/transition";

    import { getEmitterContext } from "../../context";
    import { FIELD_TYPE } from "../../types/field";
    import {
        AutoSerialField,
        DatetimeField,
        NumberField,
        TextField,
    } from "./DataFields";

    /** @type {import("@tanstack/table-core").CellContext<DataType[], DataType>} */
    export let info;

    /** @type {FieldConfig} */
    export let fieldConfig;

    /** @type {Permission} */
    export let permission;

    const emitter = getEmitterContext();

    /**
     * @typedef {{ editing: boolean; disabled: boolean; value: DataType; }} CmpProps
     *
     * @type {import("svelte").ComponentType<import("svelte").SvelteComponentTyped<CmpProps, { change: CustomEvent<DataType>; }>> | null}
     */
    let component = null;

    let value = info.getValue();
    $: {
        let newValue = info.getValue();
        if (value !== newValue) {
            value = newValue;
        }
    }

    $: {
        switch (fieldConfig.type) {
            case FIELD_TYPE.AUTO_SERIAL:
                component = AutoSerialField;
                break;
            case FIELD_TYPE.TEXT:
                component = TextField;
                break;
            case FIELD_TYPE.NUMBER:
                component = NumberField;
                break;
            case FIELD_TYPE.DATETIME:
                component = DatetimeField;
                break;
            case FIELD_TYPE.SINGLE_SELECT:
            case FIELD_TYPE.MULTI_SELECT:
            case FIELD_TYPE.CHECKBOX:
            case FIELD_TYPE.USER:
            case FIELD_TYPE.PHONE_NUMBER:
            case FIELD_TYPE.EMAIL:
            case FIELD_TYPE.HYPER_LINK:
            default:
                console.warn("Not implemented");
                component = null;
                break;
        }
    }

    /** @type {Record<string, string> | undefined} */
    let cellConfig;
    $: {
        cellConfig = fieldConfig.cellConfigs?.[info.row.index];
    }

    /** @param {CustomEvent<DataType>} e */
    const onValueChange = (e) => {
        emitter.emit("update:data_cell", "value");

        info.table.options.meta?.updateData(
            info.row.index,
            info.cell.getIndex(),
            e.detail
        );
    };
</script>

<td
    class="data-cell"
    class:range-anchor={info.cell.getIsRangeAnchor()}
    class:range-last={info.cell.getIsRangeLast()}
    class:range-covered={info.cell.getIsInRange()}
    class:active={info.cell.getIsInRange()}
    class:col-active={info.column.getIsColumnInRange()}
    class:row-active={info.row.getIsRowInRange()}
    rowSpan={info.cell.rowSpan}
    colSpan={info.cell.colSpan}
    data-cell-title={info.cell.getTitle()}
    data-cell-id={info.cell.id}
    data-row-id={info.row.id}
    data-column-id={info.column.id}
    style:width={info.column.getSize() + "px"}
    data-align={cellConfig?.align}
    style:background-color={cellConfig?.backgroundColor || ""}
>
    <svelte:component
        this={component}
        disabled={permission === "view"}
        {value}
        editing={info.cell.getIsEditingRangeAnchor()}
        on:change={onValueChange}
    />
    {#if info.cell.getIsRangeLast()}
        <span
            class="cell-last-cornor"
            transition:fade={{ delay: 50, duration: 100 }}
        />
    {/if}
</td>

<style lang="css">
    .data-cell {
        position: relative;
        cursor: cell;
        border: 1px solid var(--mds-semantic-color-border-lvl-1);

        &.col-active,
        &.row-active,
        &.range-covered:not(&.range-anchor) {
            background-color: rgb(200 200 255 / 40%);
        }

        &.range-anchor {
            outline: 1px solid var(--mds-semantic-color-primary);
        }

        & .cell-last-cornor {
            position: absolute;
            right: -5px;
            bottom: -5px;
            z-index: 2;
            width: 4px;
            height: 4px;
            padding: 2px;
            cursor: crosshair;
            background-color: var(--mds-semantic-color-primary);
            box-sizing: content-box;
            background-clip: content-box;
        }
    }
</style>
