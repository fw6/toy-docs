<script>
    import { decimalRounding } from "@local/shared";
    import { TableMap } from "@tiptap/pm/tables";
    import { throttle } from "lodash-es";
    import { WIDTH_DECIMAL_PLACES } from "../../constants";
    import { findTable } from "../../utils/tables";

    /**
     * @typedef {import('svelte/elements').MouseEventHandler<HTMLElement>} MouseEventHandler
     */

    /** @type {Editor} */
    export let editor;
    /**
     * -1: column
     * 1: row
     * @type {-1 | 1}
     */
    export let dir;
    /** @type {number} */
    export let index;
    /** @type {boolean} */
    export let last = false;

    const CELL_MIN_WIDTH = 32;
    const TABLE_MIN_WIDTH = 30;

    /** @type {HTMLElement} */
    let ref;

    let isResizing = false;

    $: resizable = dir === -1 ? true : index === 0 ? false : true;

    let table = findTable(editor.state.selection);

    /** @type {?DOMRect} */
    let tableParentDOMRect = null;
    /**
     * @type {?DOMRect}
     * @warn It's not infallible! Make sure not to use elsewhere! The table element is disconnected from DOM when rendered editor state. However, it is not necessary to have an exact rect value.
     */
    let tableDOMRect = null;

    let resizeablePercentage = 0;
    let resizeableWidth = 0;

    /** @type {number[]} */
    let colwidths = [];

    /**
     * @param {number} pos
     * @param {Record<string, unknown>} attrs
     */
    const updateTableNodeAttributes = (pos, attrs) => {
        editor.commands.command(({ tr, dispatch }) => {
            Object.entries(attrs).forEach(([key, value]) => {
                tr.setNodeAttribute(pos, key, value);
            });
            if (dispatch) {
                dispatch(tr);
                return true;
            }
            return false;
        });
    };

    /** @type {MouseEventHandler} */
    const handleMousedown = (event) => {
        if (!resizable) return;
        table = findTable(editor.state.selection);
        if (!table) return;
        const tableEle = /** @type {*} */ (editor.view.nodeDOM(table.pos));
        tableDOMRect = tableEle?.getBoundingClientRect() || null;
        tableParentDOMRect =
            tableEle?.parentElement.getBoundingClientRect() || null;

        if (!(tableParentDOMRect && tableDOMRect)) return;

        event.preventDefault();
        event.stopPropagation();
        isResizing = true;

        colwidths = table.node.attrs.colwidths;
        const map = TableMap.get(table.node);

        if (!colwidths.length) {
            const colwidth = decimalRounding(
                100 / map.width,
                WIDTH_DECIMAL_PLACES
            );
            colwidths.splice(0, 0, ...Array(map.width).fill(colwidth));
            updateTableNodeAttributes(table.pos, { colwidths });
        }

        // 允许拖动的总百分比
        resizeablePercentage =
            index > 0 ? colwidths[index - 1] + (colwidths[index] || 0) : 0;
        resizeableWidth = (tableDOMRect.width * resizeablePercentage) / 100;
    };

    // Prevent appearing while others are resizing.
    let hidden = false;

    const handleMouseMove = throttle(
        /** @type {MouseEventHandler} */
        (event) => {
            hidden = !(isResizing && resizable) && event.buttons !== 0;

            if (!(isResizing && resizable)) return;
            if (!(table && tableParentDOMRect && tableDOMRect)) return;
            event.preventDefault();

            const editorClientRect = editor.view.dom.getBoundingClientRect();
            // Out of editor area.
            if (
                editorClientRect.right < event.clientX ||
                editorClientRect.x > event.clientX
            ) {
                finishResize(event);
                return;
            }

            if (last) {
                // Move and update table's margin right attribute
                const nextMarginRight = Math.max(
                    tableParentDOMRect.right - event.clientX,
                    0
                );
                const marginLeft = Math.max(
                    tableDOMRect.x - tableParentDOMRect.x,
                    0
                );
                const nextTableWidth =
                    tableParentDOMRect.width - nextMarginRight - marginLeft;

                const nextRelativeTableWidth = Math.max(
                    Math.min(
                        decimalRounding(
                            (nextTableWidth * 100) / tableParentDOMRect.width,
                            WIDTH_DECIMAL_PLACES
                        ),
                        100
                    ),
                    TABLE_MIN_WIDTH
                );

                updateTableNodeAttributes(table.pos, {
                    width:
                        nextRelativeTableWidth > 99
                            ? 100
                            : nextRelativeTableWidth,
                });
            } else if (index === 0) {
                const maximumMarginLeft =
                    (tableParentDOMRect.width * (100 - TABLE_MIN_WIDTH)) / 100;

                const marginLeft = Math.min(
                    Math.max(event.clientX - tableParentDOMRect.left, 0),
                    maximumMarginLeft
                );

                const tableWidth =
                    tableParentDOMRect.width -
                    (tableParentDOMRect.right - tableDOMRect.right) -
                    marginLeft;
                const nextRelativeTableWidth = Math.max(
                    Math.min(
                        decimalRounding(
                            (tableWidth * 100) / tableParentDOMRect.width,
                            WIDTH_DECIMAL_PLACES
                        ),
                        100
                    ),
                    TABLE_MIN_WIDTH
                );

                updateTableNodeAttributes(table.pos, {
                    marginLeft,
                    width: nextRelativeTableWidth,
                });
            } else {
                const tableCellClientRect = ref
                    .closest("td")
                    ?.getBoundingClientRect();
                if (!tableCellClientRect) {
                    finishResize(event);
                    return;
                }

                let offset = tableCellClientRect.right - event.clientX;

                if (offset <= CELL_MIN_WIDTH) {
                    console.warn('warning: "offset < CELL_MIN_WIDTH"');
                    offset = CELL_MIN_WIDTH;
                    // return;
                } else if (offset >= resizeableWidth - CELL_MIN_WIDTH) {
                    console.warn(
                        'warning: "offset > (resizeableWidth - CELL_MIN_WIDTH)"'
                    );
                    offset = resizeableWidth - CELL_MIN_WIDTH;
                }

                const widths = [...colwidths];
                const percentR = offset / resizeableWidth;
                const finalPercent = decimalRounding(
                    resizeablePercentage * percentR,
                    WIDTH_DECIMAL_PLACES
                );

                widths[index] = finalPercent;
                widths[index - 1] = decimalRounding(
                    resizeablePercentage - finalPercent,
                    WIDTH_DECIMAL_PLACES
                );

                updateTableNodeAttributes(table.pos, { colwidths: widths });
                colwidths = widths;
            }
        },
        50
    );

    /** @type {MouseEventHandler} */
    const finishResize = () => {
        hidden = false;
        if (!isResizing) return;
        isResizing = false;
    };
</script>

<svelte:document on:mousemove={handleMouseMove} on:mouseup={finishResize} />

<div
    bind:this={ref}
    class="grid-backsight__liner"
    data-dir={dir}
    class:resizable
    class:hidden
    on:mousedown={handleMousedown}
/>

<style lang="css">
    .grid-backsight__liner {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--mds-semantic-color-bg-primary);
        opacity: 0;
        z-index: 9;
    }

    /* .grid-backsight__liner.resizable { */
    .grid-backsight__liner.resizable[data-dir="-1"] {
        pointer-events: auto;
        transition: opacity 0.2s linear 0.1s;

        &:hover {
            opacity: 1;
        }
    }

    .grid-backsight__liner.resizable[data-dir="-1"] {
        width: calc(100% + 2px);
        left: -1px;
        cursor: col-resize;
    }
    .grid-backsight__liner.resizable[data-dir="1"] {
        height: calc(100% + 2px);
        top: -1px;
        cursor: row-resize;
    }
    .grid-backsight__liner.hidden {
        visibility: hidden;
    }
</style>
