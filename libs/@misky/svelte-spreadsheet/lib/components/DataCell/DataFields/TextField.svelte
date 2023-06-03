<script>
    import { createEventDispatcher, onMount } from "svelte";
    import { autosize } from "../../../actions";
    import { getEmitterContext } from "../../../context";

    export let editing = false;
    /** @type {boolean} */
    export let disabled;
    /** @type {DataType} */
    export let value;

    const emitter = getEmitterContext();

    /** @type {HTMLTextAreaElement | undefined} */
    let cellFieldRef;

    let fieldValue = "";

    $: {
        if (editing && cellFieldRef) cellFieldRef.select();
    }

    /** @type {ReturnType<typeof createEventDispatcher<{ change: DataType; }>>} */
    const dispatcher = createEventDispatcher();

    $: {
        fieldValue = typeof value === "string" ? value : "";
    }

    const onBlur = () => {
        dispatcher("change", fieldValue);
    };

    onMount(() => {
        const callback = () => {
            cellFieldRef?.dispatchEvent(
                new CustomEvent("autosize:update", {
                    cancelable: false,
                    bubbles: true,
                })
            );
        };
        // 拖拽改变列宽后更新textarea的高度
        emitter.on("column:resized", callback);

        return () => {
            emitter.off("column:resized", callback);
        };
    });
</script>

<textarea
    rows="1"
    bind:this={cellFieldRef}
    maxlength="999"
    class="text-cell-field"
    readonly={!editing || disabled}
    bind:value={fieldValue}
    on:blur={onBlur}
    use:autosize
    on:autosize:resized={() => {
        emitter.emit("update:data_cell", "resize");
    }}
/>

<style lang="postcss">
    .text-cell-field {
        display: block;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        font-family: inherit;
        font-size: inherit;
        text-align: inherit;
        background-color: transparent;
        border: none;
        outline: none;
        resize: none;
        caret-color: var(--mds-semantic-color-primary);
    }
</style>
