<script>
    import IMask from "imask/esm/imask";
    import "imask/esm/masked/number";
    import { onMount, tick } from "svelte";

    import { createEventDispatcher } from "svelte";

    export let editing = false;
    /** @type {boolean} */
    export let disabled;
    /** @type {DataType} */
    export let value;

    /** @type {HTMLInputElement} */
    let cellFieldRef;

    let fieldValue = "";
    $: fieldValue = typeof value === "string" ? value : "";

    $: {
        if (cellFieldRef) {
            if (editing) cellFieldRef.select();
            else cellFieldRef.blur();
        }
    }

    /** @type {ReturnType<typeof createEventDispatcher<{ change: DataType; }>>} */
    const dispatcher = createEventDispatcher();

    onMount(() => {
        const mask = IMask(cellFieldRef, {
            mask: "¥num",
            blocks: {
                num: {
                    mask: Number,
                    thousandsSeparator: " ",
                },
            },
        });

        tick().then(() => {
            mask.updateValue();
            mask.updateControl();
        });

        mask.on("complete", () => {
            dispatcher("change", mask.unmaskedValue);
        });

        return () => {
            mask.destroy();
        };
    });
</script>

<input
    bind:this={cellFieldRef}
    type="text"
    class="number-cell-field"
    readonly={!editing || disabled}
    value={fieldValue}
/>

<style lang="postcss">
    .number-cell-field {
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
    }
</style>
