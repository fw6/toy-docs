// import { EDITOR_WIDTH_PLUGIN_KEY } from "@misky/tiptap-extensions";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { TableMap } from "../../helpers/table-map";
import { cellAround, pointsAtCell } from "../../utils/cells";

/**
 * @typedef {0 | 1 | 2} ResizingMetaAction
 * @typedef {{ startX: number; startWidth: number; colCount: 0 }} Dragging
 */

/** @type {PluginKey<ResizeState>} */
export const COLUMN_RESIZING_KEY = new PluginKey("column_resizing");

const RESIZE_HANDLE_WIDTH = 3;
const CELL_MIN_WIDTH = 32;

/**
 * 列拖动+表格列宽功能
 *
 * 1. table 必须有个属性 `colwidths`保存列宽。（自行在nodeview中渲染colgroup）
 * 2. 增加列、移除列，则在剩下的宽度为之前平均值的列中均分，否则？？？，并通过`appendTransaction`更新`colwidths`
 * 3. 拖拽完成，非首列或最后一列，在以左列最终宽度计算百分比并于右列均分，更新`colwidths`
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
                    const $block = $cell.blockRange(undefined, (node) => {
                        if (node.type.spec.tableRole === "table") return true;
                        return false;
                    });
                    const cell = state.doc.resolve(cellPos).nodeAfter;
                    const cellEle = view.nodeDOM(cellPos);

                    if (!(cell && $block)) return;
                    if (!isTableCellElement(cellEle)) return;

                    const tableEle = cellEle.closest("table");
                    if (!tableEle) return;

                    const table = $block.parent;
                    const tableMap = TableMap.get(table);
                    const tablePos = $block.start - 1;
                    const colCount = tableMap.colCount(cellPos - $block.start);
                    const colwidths = table.attrs.colwidths;

                    const cellRect = cellEle.getBoundingClientRect();
                    const tableRect = tableEle.getBoundingClientRect();

                    // 允许拖动的总百分比
                    const resizeablePercentage = colwidths[colCount] + (colwidths[colCount + 1] || 0);
                    const resizeableWidth = (tableRect.width * resizeablePercentage) / 100;

                    const isFirstCol = colCount === 0;
                    const isLastCol = colCount === tableMap.width - 1;

                    // const widthPluginState = EDITOR_WIDTH_PLUGIN_KEY.getState(state);
                    // // console.log(widthPluginState);
                    // if (!widthPluginState) return;
                    // // const maxWidth = widthPluginState.width['page_main'] - cellRect.x - CELL_MIN_WIDTH;

                    // let containerWidth = 0;
                    // $cell.blockRange(undefined, (node) => {
                    //     if (node.type.name in widthPluginState.width) {
                    //         containerWidth = widthPluginState.width[node.type.name];
                    //         return true;
                    //     }
                    //     return false;
                    // });

                    // console.log("containerWidth:", containerWidth);

                    const startX = event.clientX;
                    // const minX = cellRect.x + CELL_MIN_WIDTH;
                    // const maxX = isLastCol ? Infinity : cellRect.x + colwidths[colCount + 1] - CELL_MIN_WIDTH;

                    /**
                     * 1. 计算此次能拖动的最大和最小位置
                     *  1.1 非首列、末列：左右两列加起来的左右边界
                     *  1.2 首列：容器左边界
                     *  1.2 末列：容器右边界
                     * 1. 如果是第一列或最后一个一列，更新表格的margin-left或margin-right
                     */

                    // 保存初始状态
                    view.dispatch(
                        view.state.tr.setMeta(COLUMN_RESIZING_KEY, {
                            setDragging: {
                                startX: event.clientX,
                                startWidth: colwidths[colCount],
                                colCount,
                            },
                        }),
                    );

                    /**
                     * @param {MouseEvent} event
                     */
                    function finish(event) {
                        window.removeEventListener("mousemove", move);
                        window.removeEventListener("mouseup", finish);
                        const pluginState = COLUMN_RESIZING_KEY.getState(view.state);
                        if (pluginState?.dragging) {
                            view.dispatch(
                                view.state.tr.setMeta(COLUMN_RESIZING_KEY, {
                                    setDragging: null,
                                }),
                            );
                        }
                    }

                    /**
                     * @param {MouseEvent} event
                     */
                    function move(event) {
                        const pluginState = COLUMN_RESIZING_KEY.getState(view.state);
                        if (!pluginState) return;
                        if (pluginState.dragging) {
                            // 非最后一列
                            if (!isLastCol) {
                                // 计算最新的宽度px
                                const offset = event.clientX - cellRect.x;

                                // 拖动后超过了列的最小宽度
                                if (offset < CELL_MIN_WIDTH) {
                                    console.log('warning: "offset < CELL_MIN_WIDTH"');
                                    return;
                                } else if (offset > resizeableWidth - CELL_MIN_WIDTH) {
                                    console.log('warning: "offset > (resizeableWidth - CELL_MIN_WIDTH)"');
                                    return;
                                }

                                const percentL = offset / resizeableWidth;
                                const finalPercent = Math.ceil(resizeablePercentage * percentL * 100) / 100;
                                const widths = [...colwidths];

                                // 更新左右两列宽度
                                widths[colCount] = finalPercent;
                                widths[colCount + 1] = resizeablePercentage - finalPercent;

                                const tr = view.state.tr;
                                tr.setNodeAttribute(tablePos, "colwidths", widths);
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
