<script>
    import dayjs from "dayjs";
    import IMask from "imask/esm/imask";
    import "imask/esm/masked/date";
    import { onMount } from "svelte";

    import { createEventDispatcher, tick } from "svelte";

    export let editing = false;
    /** @type {boolean} */
    export let disabled;
    /** @type {DataType} */
    export let value;

    /** @type {HTMLInputElement} */
    let cellFieldRef;
    /**
     * 输入框绑定的值
     * @type {string | null}
     */
    let fieldValue = null;
    $: {
        fieldValue =
            typeof value === "number"
                ? dayjs(value).format("YYYY-MM-DD")
                : null;
    }

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
            mask: Date,
            pattern: "Y-`m-`d",
            blocks: {
                d: {
                    mask: IMask.MaskedRange,
                    from: 1,
                    to: 31,
                    maxLength: 2,
                },
                m: {
                    mask: IMask.MaskedRange,
                    from: 1,
                    to: 12,
                    maxLength: 2,
                },
                Y: {
                    mask: IMask.MaskedRange,
                    from: 1900,
                    to: 9999,
                },
            },
            format: (date) => {
                return dayjs(date).format("YYYY-MM-DD");
            },
            parse: (str) => {
                return dayjs(str).toDate();
            },
            min: new Date(1900, 0, 1),
            max: new Date(9999, 0, 1),
            lazy: false, // visible placeholder
            overwrite: true,
            autofix: false,
        });

        tick().then(() => {
            mask.updateValue();
            mask.updateControl();
        });

        mask.on("complete", () => {
            if (mask.typedValue instanceof Date) {
                dispatcher("change", mask.typedValue.getTime());
            }
        });

        return () => {
            mask.destroy();
        };
    });
</script>

<input
    bind:this={cellFieldRef}
    type="text"
    class="datetime-cell-field"
    readonly={!editing || disabled}
    value={fieldValue}
/>

<style lang="postcss">
    .datetime-cell-field {
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
        user-select: none;

        &:invalid {
            color: red;
            outline: 1px solid red;
        }
    }
</style>
