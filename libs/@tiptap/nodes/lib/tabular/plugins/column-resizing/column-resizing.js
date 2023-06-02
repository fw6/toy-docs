import { decimalRounding } from "@local/shared";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { TableMap, cellAround, pointsAtCell } from "@tiptap/pm/tables";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * @typedef {0 | 1 | 2} ResizingMetaAction
 * @typedef {{ startX: number; startWidth: number; colCount: 0 }} Dragging
 */

/** @type {PluginKey<ResizeState>} */
export const COLUMN_RESIZING_KEY = new PluginKey("column_resizing");

const RESIZE_HANDLE_WIDTH = 3;
const CELL_MIN_WIDTH = 32;
const TABLE_MIN_WIDTH = 30;
export const CELL_WIDTH_DECIMAL_PLACES = 2;

/**
 * Column resizing feature, support table width percentage, dependent the table node attributes:
 *  1. colwidths
 *  2. width
 *  3. marginLeft
 *  4. marginRight
 *
 * TODO:
 *  1. support first column resize
 */
export const columnResizing = () => {
    return new Plugin({
        key: COLUMN_RESIZING_KEY,
        state: {
            init: () => new ResizeState(-1, false),
            apply: (tr, prev) => prev.apply(tr),
        },
        props: {
            /** @returns {Record<string, string>} */
            attributes: (state) => {
                const pluginState = COLUMN_RESIZING_KEY.getState(state);
                return pluginState && pluginState.activeHandle > -1 ? { class: "resize-cursor" } : {};
            },

            decorations: (state) => {
                const pluginState = COLUMN_RESIZING_KEY.getState(state);

                if (pluginState && pluginState.activeHandle > -1) {
                    return handleDecorations(state, pluginState.activeHandle);
                }
                return null;
            },

            handleDOMEvents: {
                mousedown(view, event) {
                    const { state } = view;
                    const pluginState = COLUMN_RESIZING_KEY.getState(state);
                    if (!pluginState || pluginState.activeHandle < 0 || pluginState.dragging) return false;

                    const cellPos = pluginState.activeHandle;

                    const $cell = state.doc.resolve(cellPos);
                    const $block = $cell.blockRange($cell, (node) => {
                        if (node.type.spec.tableRole === "table") return true;
                        return false;
                    });
                    const cell = state.doc.resolve(cellPos).nodeAfter;
                    const cellEle = view.nodeDOM(cellPos);

                    if (!(cell && $block)) return;
                    if (!isTableCellElement(cellEle)) return;

                    const tableEle = cellEle.closest("table");
                    if (!tableEle) return;

                    // Table node
                    const table = $block.$from.node($block.$from.depth - 1);
                    const tableMap = TableMap.get(table);
                    // column length
                    const colLength = tableMap.width;
                    // table pos
                    const tablePos = $block.$from.before($block.$from.depth - 1);
                    // current column index
                    const colCount = tableMap.colCount(cellPos - tablePos - 1);

                    /**
                     * Persistent data for storing column widths
                     * @type {number[]}
                     */
                    const colwidths = table.attrs.colwidths;
                    if (!colwidths.length) {
                        const colwidth = decimalRounding(100 / tableMap.width, CELL_WIDTH_DECIMAL_PLACES);
                        colwidths.splice(0, 0, ...Array(colLength).fill(colwidth));
                        view.dispatch(view.state.tr.setNodeAttribute(tablePos, "colwidths", colwidths));
                    }

                    const cellRect = cellEle.getBoundingClientRect();
                    const tableRect = tableEle.getBoundingClientRect();

                    // 允许拖动的总百分比
                    const resizeablePercentage = colwidths[colCount] + (colwidths[colCount + 1] || 0);
                    const resizeableWidth = (tableRect.width * resizeablePercentage) / 100;

                    // const isFirstCol = colCount === 0;
                    const isLastCol = colCount === tableMap.width - 1;
                    const tableContainer = tableEle.parentElement;
                    if (!tableContainer) return;
                    const tableContainerRect = tableContainer.getBoundingClientRect();

                    view.dispatch(
                        view.state.tr.setMeta(COLUMN_RESIZING_KEY, {
                            setDragging: {
                                startX: event.clientX,
                                startWidth: colwidths[colCount],
                                colCount,
                            },
                        }),
                    );

                    /** @type {number[]?} */
                    let lastColwidths = null;

                    /**
                     * @param {MouseEvent} _event
                     */
                    function finish(_event) {
                        window.removeEventListener("mousemove", move);
                        window.removeEventListener("mouseup", finish);
                        const pluginState = COLUMN_RESIZING_KEY.getState(view.state);
                        if (pluginState?.dragging) {
                            const tr = view.state.tr;

                            // #region Fix total column widths

                            if (lastColwidths) {
                                const cellEle = view.nodeDOM(cellPos);

                                // calcute final column widths
                                if (cellEle instanceof HTMLTableCellElement) {
                                    const newRect = cellEle.getBoundingClientRect();
                                    const percentL = (newRect.right - newRect.left) / resizeableWidth;
                                    const finalPercent = decimalRounding(
                                        resizeablePercentage * percentL,
                                        CELL_WIDTH_DECIMAL_PLACES,
                                    );

                                    lastColwidths[colCount] = finalPercent;
                                    lastColwidths[colCount + 1] = decimalRounding(
                                        resizeablePercentage - finalPercent,
                                        CELL_WIDTH_DECIMAL_PLACES,
                                    );
                                }

                                let colwidths = lastColwidths;
                                const totalWidth = colwidths.reduce((acc, cur) => acc + cur, 0);
                                const exceed = totalWidth - 100;

                                // Bias within 1%
                                if (exceed < -1 || exceed > 1) {
                                    const mean = decimalRounding(exceed, CELL_WIDTH_DECIMAL_PLACES) / colwidths.length;
                                    let counter = 0;

                                    colwidths = colwidths.reduce(
                                        /** @param {number[]} acc */
                                        (acc, cur, i) => {
                                            if (i === colwidths.length - 1) {
                                                acc.push(decimalRounding(100 - counter, CELL_WIDTH_DECIMAL_PLACES));
                                            } else {
                                                const cellwidth = decimalRounding(
                                                    cur - mean,
                                                    CELL_WIDTH_DECIMAL_PLACES,
                                                );
                                                counter += cellwidth;
                                                acc.push(cellwidth);
                                            }
                                            return acc;
                                        },
                                        [],
                                    );
                                }

                                tr.setNodeAttribute(tablePos, "colwidths", colwidths);
                            }

                            // #endregion

                            tr.setMeta(COLUMN_RESIZING_KEY, {
                                setDragging: null,
                            });
                            view.dispatch(tr);
                        }
                    }

                    const editorRect = view.dom.getBoundingClientRect();

                    /**
                     * @param {MouseEvent} event
                     */
                    function move(event) {
                        // Out of editor area.
                        if (editorRect.right < event.clientX || editorRect.x > event.clientY) {
                            finish(event);
                            return;
                        }

                        const pluginState = COLUMN_RESIZING_KEY.getState(view.state);
                        if (!pluginState) return;
                        if (pluginState.dragging) {
                            if (!isLastCol) {
                                let offset = event.clientX - cellRect.x;

                                if (offset <= CELL_MIN_WIDTH) {
                                    console.warn('warning: "offset < CELL_MIN_WIDTH"');
                                    offset = CELL_MIN_WIDTH;
                                    // return;
                                } else if (offset >= resizeableWidth - CELL_MIN_WIDTH) {
                                    console.warn('warning: "offset > (resizeableWidth - CELL_MIN_WIDTH)"');
                                    // return;
                                    offset = resizeableWidth - CELL_MIN_WIDTH;
                                }

                                const widths = [...colwidths];
                                const percentL = offset / resizeableWidth;
                                const finalPercent = decimalRounding(
                                    resizeablePercentage * percentL,
                                    CELL_WIDTH_DECIMAL_PLACES,
                                );

                                widths[colCount] = finalPercent;
                                widths[colCount + 1] = decimalRounding(
                                    resizeablePercentage - finalPercent,
                                    CELL_WIDTH_DECIMAL_PLACES,
                                );

                                const tr = view.state.tr;
                                tr.setNodeAttribute(tablePos, "colwidths", widths);
                                view.dispatch(tr);

                                lastColwidths = widths;
                            } else {
                                // Move and update table's margin right attribute
                                const nextMarginWidthRight = tableContainerRect.right - event.clientX;
                                const marginWidthLeft = tableRect.x - tableContainerRect.x;
                                const nextTableWidth =
                                    tableContainerRect.width - nextMarginWidthRight - marginWidthLeft;
                                const nextRelativeTableWidth = decimalRounding(
                                    (nextTableWidth * 100) / tableContainerRect.width,
                                    CELL_WIDTH_DECIMAL_PLACES,
                                );

                                const tr = view.state.tr;
                                tr.setNodeAttribute(
                                    tablePos,
                                    "width",
                                    Math.max(Math.min(nextRelativeTableWidth, 100), TABLE_MIN_WIDTH),
                                );
                                view.dispatch(tr);
                            }
                        }
                    }

                    window.addEventListener("mousemove", move);
                    window.addEventListener("mouseup", finish);
                    event.preventDefault();
                    return true;
                },

                mousemove(view, event) {
                    const { state, dispatch } = view;
                    const pluginState = COLUMN_RESIZING_KEY.getState(state);
                    if (!pluginState) return;

                    if (!pluginState.dragging) {
                        const _target = event.target;
                        if (!(_target instanceof Node)) return;
                        const target = domCellAround(_target);
                        let cell = -1;

                        if (target) {
                            const { left, right } = target.getBoundingClientRect();
                            if (event.clientX - left <= RESIZE_HANDLE_WIDTH) cell = edgeCell(view, event, "left");
                            else if (right - event.clientX <= RESIZE_HANDLE_WIDTH)
                                cell = edgeCell(view, event, "right");
                        }

                        if (cell !== pluginState.activeHandle) {
                            dispatch(state.tr.setMeta(COLUMN_RESIZING_KEY, { setHandle: cell }));
                        }
                    }
                },
                mouseleave(view) {
                    const { state, dispatch } = view;
                    const pluginState = COLUMN_RESIZING_KEY.getState(state);
                    if (pluginState) {
                        if (pluginState.activeHandle > -1 && !pluginState.dragging) {
                            dispatch(state.tr.setMeta(COLUMN_RESIZING_KEY, { setHandle: -1 }));
                        }
                    }
                },
            },
        },
    });
};

export class ResizeState {
    /** @type {number} */
    activeHandle = -1;

    /** @type {Dragging | false} */
    dragging = false;

    /**
     * @param {number} activeHandle
     * @param {Dragging | false} dragging
     */
    constructor(activeHandle, dragging) {
        this.activeHandle = activeHandle;
        this.dragging = dragging;
    }

    /** @type {(tr: Transaction) => ResizeState} */
    apply(tr) {
        const state = this;
        const action = tr.getMeta(COLUMN_RESIZING_KEY);

        if (action && action.setHandle != null) return new ResizeState(action.setHandle, false);
        if (action && action.setDragging !== undefined) return new ResizeState(state.activeHandle, action.setDragging);
        if (state.activeHandle > -1 && tr.docChanged) {
            let handle = tr.mapping.map(state.activeHandle, -1);
            if (!pointsAtCell(tr.doc.resolve(handle))) {
                handle = -1;
            }
            return new ResizeState(handle, state.dragging);
        }
        return state;
    }
}

/**
 * @param {EditorState} state
 * @param {number} cell
 * @returns {DecorationSet}
 */
export function handleDecorations(state, cell) {
    const decorations = [];
    const $cell = state.doc.resolve(cell);
    const table = $cell.node(-1);
    const _cell = $cell.nodeAfter;

    if (!table || !_cell) {
        return DecorationSet.empty;
    }
    const map = TableMap.get(table);
    const start = $cell.start(-1);
    const col = map.colCount($cell.pos - start) + _cell.attrs.colspan;

    for (let row = 0; row < map.height; row++) {
        const index = col + row * map.width - 1;
        // For positions that are have either a different cell or the end
        // of the table to their right, and either the top of the table or
        // a different cell above them, add a decoration
        if (
            (col === map.width || map.map[index] !== map.map[index + 1]) &&
            (row === 0 || map.map[index - 1] !== map.map[index - 1 - map.width])
        ) {
            const cellPos = map.map[index];
            decorations.push(
                Decoration.node(start + cellPos, start + cellPos + _cell.nodeSize, {
                    "data-resize-handle": "true",
                }),
            );
        }
    }
    return DecorationSet.create(state.doc, decorations);
}

// #region

/**
 * @param {Node | null} target
 * @returns {Element | null | undefined}
 */
function domCellAround(target) {
    /** @type {Element | null | undefined} */
    let result = target instanceof Element ? target : target?.parentElement;

    while (result && result.nodeName !== "TD" && result.nodeName !== "TH")
        result = result.classList.contains("ProseMirror") ? null : result.parentElement;

    return result;
}

/**
 * @param {EditorView} view
 * @param {MouseEvent} event
 * @param {'left' | 'right'} side
 * @returns {number}
 */
function edgeCell(view, event, side) {
    const found = view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (!found) return -1;

    const { pos } = found;
    const $cell = cellAround(view.state.doc.resolve(pos));
    if (!$cell) return -1;
    if (side === "right") return $cell.pos;
    const map = TableMap.get($cell.node(-1));
    const start = $cell.start(-1);

    const index = map.map.indexOf($cell.pos - start);
    return index % map.width === 0 ? -1 : start + map.map[index - 1];
}

/**
 * @param {Node?} node
 * @returns {node is HTMLTableCellElement}
 */
const isTableCellElement = (node) => !!node && node instanceof HTMLTableCellElement;

// #endregion
