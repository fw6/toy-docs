<script>
    import {
        TableMap,
        cellAround,
        isInTable,
        selectedRect,
    } from "@tiptap/pm/tables";
    import GridBacksight from "./GridBacksight.svelte";

    /** @type {Editor} */
    export let editor;

    /** @type {number} */
    export let index;

    /**
     * Grid cell belongs
     *
     * -1: column
     * 1: row
     * 0: table
     *
     * @type {-1 | 0 | 1}
     */
    export let dir;

    export let isLast = false;

    /** @type {HTMLElement} */
    let ref;
    /** @returns {HTMLElement} */
    export function forwardRef() {
        return ref;
    }

    /** all cells selected in row or column */
    let isActive = false;
    /** some cells selected in row or column */
    let isPartiallyActive = false;

    /** @type {?HTMLTableElement} */
    let tableEle = null;

    let size = 0;

    $: {
        if (tableEle) {
            size = dir === -1 ? tableEle.clientHeight : tableEle.clientWidth;
        }
    }
    $: rect = isInTable(editor.state) && selectedRect(editor.state);
    $: {
        if (rect) {
            if (dir === -1) {
                isPartiallyActive = index >= rect.left && index < rect.right;
                isActive =
                    isPartiallyActive &&
                    rect.bottom - rect.top === rect.map.height;
            } else if (dir === 1) {
                isPartiallyActive = index >= rect.top && index < rect.bottom;
                isActive =
                    isPartiallyActive &&
                    rect.right - rect.left === rect.map.width;
            } else {
                isActive =
                    rect.bottom - rect.top === rect.map.height &&
                    rect.right - rect.left === rect.map.width;
            }

            if (!tableEle?.isConnected) {
                const ele = editor.view.nodeDOM(rect.tableStart - 1);
                if (ele instanceof HTMLTableElement) tableEle = ele;
                else tableEle = null;
            } else {
                tableEle = tableEle;
            }
        }
    }

    let isSelecting = false;

    /**
     * @typedef {import('svelte/elements').MouseEventHandler<HTMLElement>} MouseEventHandler
     */

    /** @param {number} [end]  */
    const selectRowsOrColumns = (end) => {
        if (dir === -1) editor.commands.selectColumns(index, end);
        else editor.commands.selectRows(index, end);
    };

    /** @type {MouseEventHandler} */
    const handleMousedown = (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (dir === 0) {
            editor.commands.selectTable();
            return;
        }

        selectRowsOrColumns();

        isSelecting = true;

        return false;
    };

    /** @type {MouseEventHandler} */
    const handleMousemove = (event) => {
        if (!isSelecting) return;
        const target = event.target;
        if (target instanceof HTMLElement) {
            if (ref.isEqualNode(target)) return;

            if (target.classList.contains("grid-cell")) {
                const targetIndex =
                    target.dataset.index && +target.dataset.index;
                if (typeof targetIndex === "number" && targetIndex > -1) {
                    selectRowsOrColumns(targetIndex);
                }
            } else {
                const res = editor.view.posAtCoords({
                    left: event.x,
                    top: event.y,
                });
                if (!res) return;
                const resolvedPos = editor.state.doc.resolve(res.pos);
                let depth = resolvedPos.depth;
                while (--depth > 0) {
                    const node = resolvedPos.node(depth);
                    if (node.type.spec.tableRole === "table") {
                        if (
                            rect &&
                            rect.tableStart === resolvedPos.start(depth)
                        ) {
                            const resolveCellPos = cellAround(resolvedPos);
                            if (resolveCellPos) {
                                const start = resolveCellPos.start(-1);
                                const map = TableMap.get(node);
                                const cellPos = resolveCellPos.pos - start;
                                const cellRect = map.findCell(cellPos);

                                selectRowsOrColumns(
                                    dir === -1 ? cellRect.left : cellRect.top
                                );
                            }
                        }

                        break;
                    }
                }
            }
        }
    };

    /** @type {MouseEventHandler} */
    const handleMouseup = () => {
        if (!isSelecting) return;
        isSelecting = false;
    };
</script>

<svelte:document on:mousemove={handleMousemove} on:mouseup={handleMouseup} />

<div
    bind:this={ref}
    contenteditable="false"
    class="grid-cell {dir === 0 ? 'row-corner' : dir === -1 ? 'row' : 'col'}"
    class:active={isActive}
    class:partially-active={isPartiallyActive}
    class:isLast
    class:isFirst={dir !== 0 && index === 0}
    data-index={dir === 0 ? -1 : index}
    on:mousedown={handleMousedown}
/>

{#if dir !== 0}
    <GridBacksight {editor} {dir} {index} {size} />
    {#if isLast}
        <GridBacksight {editor} {dir} {index} {size} last={isLast} />
    {/if}
{/if}

<style style="css">
    .grid-cell {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        background-color: var(--mds-core-color-neutral-50);
        pointer-events: auto;
        cursor: pointer;

        --grid-cell-size: 12px;
        --grid-cell-gap-size: 2px;
        --grid-cell-active: var(--mds-core-color-neutral-300);
        --grid-cell-partially-active: var(--mds-core-color-neutral-100);

        &.partially-active {
            background-color: var(--grid-cell-partially-active);
        }
    }

    .grid-cell.partially-active.active,
    .grid-cell.row-corner.active {
        background-color: var(--grid-cell-active);
    }

    .grid-cell.row-corner {
        top: calc(-1 * var(--grid-cell-size) - var(--grid-cell-gap-size));
        left: calc(-1 * var(--grid-cell-size) - var(--grid-cell-gap-size));
        width: var(--grid-cell-size);
        height: var(--grid-cell-size);
    }

    .grid-cell.row {
        height: var(--grid-cell-size);
        top: calc(-1 * var(--grid-cell-size) - var(--grid-cell-gap-size));

        &.isFirst,
        &.isLast {
            width: calc(100% + 1px);
        }
    }
    .grid-cell.row.isFirst {
        left: -1px;
    }

    .grid-cell.col {
        width: var(--grid-cell-size);
        left: calc(-1 * var(--grid-cell-size) - var(--grid-cell-gap-size));

        &.col.isFirst,
        &.isLast {
            height: calc(100% + 1px);
        }
    }

    .grid-cell.col.isFirst {
        top: -1px;
    }
</style>
