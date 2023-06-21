<script>
    import { onMount } from "svelte";
    import { autosize } from "../../actions";
    import { getEmitterContext } from "../../context";

    /** @type {import("@tanstack/table-core").Header<DataType[], unknown>} */
    export let header;

    /** @type {Permission} */
    export let permission;

    const emitter = getEmitterContext();

    let fieldConfig = header.column.columnDef.meta?.field;
    $: {
        fieldConfig = header.column.columnDef.meta?.field;
    }

    /** @type {import("svelte/elements").ChangeEventHandler<HTMLTextAreaElement>} */
    const onChangeFieldName = (e) => {
        if (fieldConfig) {
            /** @type {FieldConfig} */
            const newFieldConfig = {
                ...fieldConfig,
                fieldId: fieldConfig.fieldId,
                size: fieldConfig.size,
                fieldName: e.currentTarget.value,
            };

            header
                .getContext()
                .table.options.meta?.updateColumns(
                    fieldConfig.fieldId,
                    newFieldConfig
                );
            emitter.emit("update:header_cell", "value");
        }
    };

    /** @type {HTMLTextAreaElement | undefined} */
    let textareaRef;

    const dispatchUpdateSizeEvent = () => {
        textareaRef?.dispatchEvent(
            new CustomEvent("autosize:update", {
                cancelable: false,
                bubbles: true,
            })
        );
    };

    $: {
        // FIXME 因为值可能会变，需要手动触发autosize的update事件！！！
        if (fieldConfig && textareaRef) dispatchUpdateSizeEvent();
    }

    onMount(() => {
        // 拖拽改变列宽后更新textarea的高度
        emitter.on("column:resized", dispatchUpdateSizeEvent);

        return () => {
            emitter.off("column:resized", dispatchUpdateSizeEvent);
        };
    });
</script>

<th
    class="header-cell"
    colSpan={header.colSpan}
    class:col-active={header.column.getIsColumnInRange()}
    style:width={header.getSize() + "px"}
>
    {#if !header.isPlaceholder && fieldConfig}
        <textarea
            bind:this={textareaRef}
            class="inner-input"
            value={fieldConfig.fieldName}
            readonly={permission !== "edit"}
            rows="1"
            use:autosize
            on:autosize:resized={() => {
                emitter.emit("update:header_cell", "resize");
            }}
            on:change={onChangeFieldName}
        />
    {/if}
</th>

<style lang="postcss">
    .header-cell {
        cursor: cell;
        background-color: var(--mds-sys-light-surface);
        border: 1px solid var(--mds-sys-light-surface-bright);

        &.col-active {
            background-color: rgb(30 110 207 / 60%);
        }
    }

    .header-cell .inner-input {
        display: block;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        font-family: inherit;
        font-size: inherit;
        background-color: transparent;
        border: none;
        outline: none;
        resize: none;
        caret-color: var(--mds-sys-light-primary);
    }
</style>
