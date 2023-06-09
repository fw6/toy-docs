<script>
    import {
        TableMap,
        cellAround,
        isInTable,
        selectedRect,
    } from "@tiptap/pm/tables";

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
    const handleMouseup = (event) => {
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
    data-index={dir === 0 ? -1 : index}
    on:mousedown={handleMousedown}
/>

<style style="css">
    .grid-cell {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        background-color: var(--mds-semantic-color-bg-layout);

        --grid-cell-size: 12px;
        --grid-cell-gap-size: 2px;
    }

    .grid-cell.partially-active {
        background-color: var(--mds-semantic-color-bg-container-active);
    }

    .grid-cell.active {
        background-color: var(--mds-semantic-color-bg-primary-active);
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
    }

    .grid-cell.col {
        width: var(--grid-cell-size);
        left: calc(-1 * var(--grid-cell-size) - var(--grid-cell-gap-size));
    }
    .grid-cell.col.isLast {
        border-bottom: 1px solid var(--mds-semantic-color-border-lvl-1);
    }
    .grid-cell.row.isLast {
        border-right: 1px solid var(--mds-semantic-color-border-lvl-1);
    }
</style>
