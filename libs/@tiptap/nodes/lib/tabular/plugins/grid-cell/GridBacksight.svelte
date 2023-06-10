<script>
    import { addColumn, addRow, selectedRect } from "@tiptap/pm/tables";
    import { evenColumnWidthAfterInsert } from "../../commands/insert";
    import GridBacksightLiner from "./GridBacksightLiner.svelte";
    /**
     * Grid cell belongs
     *
     * -1: column
     * 1: row
     *
     * @type {-1 | 1}
     */
    export let dir;

    /** @type {number} */
    export let index;

    /** @type {number} */
    export let size;

    /** @type {boolean} */
    export let last = false;

    /** @type {Editor} */
    export let editor;

    /** @type {import('svelte/elements').MouseEventHandler<HTMLElement>} */
    const handleMousedown = () => {
        editor.commands.command(({ tr, dispatch, state }) => {
            if (dispatch) {
                const rect = selectedRect(state);
                const _index = last ? index + 1 : index;
                tr =
                    dir === -1
                        ? addColumn(tr, rect, _index)
                        : addRow(tr, rect, _index);

                if (dir === -1) tr = evenColumnWidthAfterInsert(tr, _index);

                dispatch(tr);
                return true;
            }
            return false;
        });
    };
</script>

<div
    class="grid-backsight"
    data-dir={dir}
    data-last={last}
    style={`${dir === -1 ? "height" : "width"}:${size}px;`}
>
    <div class="grid-backsight__pin" on:mousedown={handleMousedown} />
    <GridBacksightLiner {editor} {dir} {index} {last} />
</div>

<style lang="css">
    .grid-backsight {
        position: absolute;
        right: 0;
        top: -1px;
        left: -1px;
        width: 2px;
        height: 2px;
        cursor: pointer;
    }

    .grid-backsight[data-last="true"][data-dir="-1"] {
        left: 100%;
    }
    .grid-backsight[data-last="true"][data-dir="1"] {
        top: 100%;
    }

    .grid-backsight__pin {
        position: absolute;
        top: -14px;
        left: -5px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: var(--mds-semantic-color-bg-primary);
        opacity: 0;
        pointer-events: auto;

        &::after,
        &::before {
            content: "";
            position: absolute;
            width: 60%;
            height: 1px;
            top: 50%;
            left: 50%;
            transform: translateX(-50%) translateY(-50%) rotate(90deg);
            background-color: white;
        }
    }

    .grid-backsight__pin:hover {
        opacity: 1;
    }

    :global(.grid-backsight__pin:hover + .grid-backsight__liner) {
        opacity: 1;
        width: 100% !important;
        height: 100% !important;
    }

    .grid-backsight[data-dir="1"] .grid-backsight__pin {
        top: -5px;
        left: -14px;
    }

    .grid-backsight__pin::after {
        transform: translateX(-50%) translateY(-50%);
    }
</style>
