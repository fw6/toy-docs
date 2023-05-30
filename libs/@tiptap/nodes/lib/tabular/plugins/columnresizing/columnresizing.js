/**
 * @typedef {import('./columnresizing').ColumnResizingOptions} ColumnResizingOptions
 * @typedef {import('./columnresizing').SetColWidthsAction} SetColWidthsAction
 * @typedef {import('./columnresizing').SetTableWidthAction} SetTableWidthAction
 * @typedef {import('./columnresizing').Dragging} Dragging
 *
 */

import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { TableMap } from "../../helpers/table-map";
import { cellAround, pointsAtCell } from "../../utils/cells";
import { getRow } from "../../utils/rows";
import { COLUMN_RESIZING_KEY } from "../keys";

const SPEC_COL_WIDTHS = "colgroup";
const SPEC_TABLE_WIDTH = "tablewidth";

export const columnResizing = (handleWidth = 5, cellMinWidth = 25, lastColumnResizable = true) => {
    return new Plugin({
        key: COLUMN_RESIZING_KEY,
        state: {
            init: (_, state) =>
                new ResizeState(
                    -1,
                    false,
                    DecorationSet.create(state.doc, createTableDecorations(state.doc, cellMinWidth)),
                ),
            apply: (tr, prev) => prev.apply(tr),
        },
        props: {
            attributes: (state) => {
                const pluginState = COLUMN_RESIZING_KEY.getState(state);
                /** @type {Record<string, string>} */
                const attrs = {};
                if (pluginState && pluginState.activeHandle > -1) {
                    attrs["class"] = "resize-cursor";
                }
                return attrs;
            },
            decorations: (state) => {
                /** @type {ResizeState?} */
                const pluginState = COLUMN_RESIZING_KEY.getState(state);
                let decos = DecorationSet.empty;

                if (pluginState) {
                    decos = decos.add(
                        state.doc,
                        pluginState.tableDecos.find(undefined, undefined, () => true),
                    );
                    if (pluginState.activeHandle > -1) {
                        decos = decos.add(state.doc, handleDecorations(state, pluginState.activeHandle));
                    }
                }
                return decos;
            },
            handleDOMEvents: {
                mousedown(view, event) {},
            },
        },
    });
};

class ResizeState {
    /** @type {number} */
    activeHandle;

    /** @type {Dragging | false} */
    dragging;

    /** @type {DecorationSet} */
    tableDecos;

    /**
     * @param {number} activeHandle
     * @param {Dragging | false} dragging
     * @param {DecorationSet} tableDecos
     */
    constructor(activeHandle, dragging, tableDecos) {
        this.activeHandle = activeHandle;
        this.dragging = dragging;
        this.tableDecos = tableDecos;
    }

    /**
     * @param {Transaction} tr
     * @returns {ResizeState}
     */
    apply(tr) {
        const state = this;

        if (tr.docChanged) {
            state.tableDecos = state.tableDecos.map(tr.mapping, tr.doc);
        }

        const action = tr.getMeta(COLUMN_RESIZING_KEY);
        if (action) {
            if (action.setHandle != null) return new ResizeState(action.setHandle, false, state.tableDecos);
            if (action.setDragging !== undefined)
                return new ResizeState(state.activeHandle, action.setDragging, state.tableDecos);
            let decos = state.tableDecos;
            if (action.setColWidths) {
                /** @type {SetColWidthsAction[]} */
                const scws = action.setColWidths;
                scws.forEach((scw) => {
                    const removed = decos.find(
                        scw.tableStart - 1,
                        scw.tableStart,
                        (spec) => spec.type === SPEC_COL_WIDTHS,
                    );
                    if (removed) decos = decos.remove(removed);
                    const deco = colgroupDecoration(scw.tableStart, scw.colWidths);
                    decos = decos.add(tr.doc, [deco]);
                });
            }
            if (action.setTableWidth) {
                let decos = state.tableDecos;
                /** @type {SetTableWidthAction[]} */
                const stws = action.setTableWidth;

                stws.forEach((stw) => {
                    const removed = decos.find(stw.pos, stw.pos + 1, (spec) => spec.type === SPEC_TABLE_WIDTH);
                    if (removed) {
                        /** @type {Decoration[]} */
                        const newDecos = [];
                        removed.forEach((r) => {
                            const pos = tr.mapping.map(stw.pos);
                            const table = tr.doc.nodeAt(pos);
                            if (table?.type.spec.tableRole === "table") {
                                newDecos.push(tableWidthDecoration(pos, pos + table.nodeSize, stw.css));
                            }
                        });
                        if (newDecos) decos = decos.remove(removed).add(tr.doc, newDecos);
                    }
                });
            }
            if (decos !== state.tableDecos) return new ResizeState(state.activeHandle, state.dragging, decos);
        }
        if (tr.docChanged && state.activeHandle > -1) {
            let handle = tr.mapping.map(state.activeHandle, -1);
            if (!pointsAtCell(tr.doc.resolve(handle))) {
                handle = -1;
            }
            return new ResizeState(handle, state.dragging, state.tableDecos);
        }
        return state;
    }
}

/**
 * @param {EditorView} view
 * @param {number} cellPos
 * @param {{ colspan: number, colwidth?: number[] | null }} attrs
 * @returns {number}
 */
function currentColWidth(view, cellPos, { colspan, colwidth }) {
    const width = colwidth?.[colwidth.length - 1];
    if (width) return width;
    const dom = view.domAtPos(cellPos);

    const node = dom.node.childNodes[dom.offset];

    let domWidth = node instanceof HTMLElement ? node.offsetWidth : node.textContent?.length || 0;
    let parts = colspan;

    if (colwidth)
        for (let i = 0; i < colspan; i++)
            if (colwidth[i]) {
                domWidth -= colwidth[i];
                parts--;
            }
    return domWidth / parts;
}

/**
 * @param {HTMLElement?} target
 * @returns {HTMLElement?}
 */
function domCellAround(target) {
    /** @type {Element | null} */
    let res = target;
    while (res && res.nodeName !== "TD" && res.nodeName !== "TH")
        res = res.classList.contains("ProseMirror") ? null : res.parentElement;

    return target;
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
    const map = TableMap.get($cell.node(-2));
    const start = $cell.start(-2);
    const index = map.map.indexOf($cell.pos - start);
    return index % map.width === 0 ? -1 : start + map.map[index - 1];
}

/**
 * @param {Dragging} dragging
 * @param {MouseEvent} event
 * @param {number} cellMinWidth
 * @returns {number}
 */
function draggedWidth(dragging, event, cellMinWidth) {
    const offset = event.clientX - dragging.startX;
    return Math.max(cellMinWidth, dragging.startWidth + offset);
}

/**
 * @param {EditorView} view
 * @param {number} value
 */
function updateHandle(view, value) {
    view.dispatch(view.state.tr.setMeta(COLUMN_RESIZING_KEY, { setHandle: value }));
}

/**
 * @param {EditorView} view
 * @param {number} cell
 * @param {number} width
 */
function updateColumnWidth(view, cell, width) {
    const $cell = view.state.doc.resolve(cell);
    const table = $cell.node(-2);
    const map = TableMap.get(table);
    const start = $cell.start(-2);
    const cellNode = $cell.nodeAfter;
    if (!cellNode) return;

    const col = map.colCount($cell.pos - start) + cellNode.attrs.colspan - 1;
    const tr = view.state.tr;
    for (let row = 0; row < map.height; row++) {
        const mapIndex = row * map.width + col;
        // Rowspanning cell that has already been handled
        if (row && map.map[mapIndex] === map.map[mapIndex - map.width]) continue;
        const pos = map.map[mapIndex];
        const attrs = table.nodeAt(pos)?.attrs || {};

        const index = attrs.colspan === 1 ? 0 : col - map.colCount(pos);
        if (attrs.colwidth && attrs.colwidth[index] === width) continue;
        const colwidth = attrs.colwidth ? attrs.colwidth.slice() : zeroes(attrs.colspan);
        colwidth[index] = width;
        tr.setNodeMarkup(start + pos, null, { ...attrs, colwidth: colwidth });
    }
    if (tr.docChanged) view.dispatch(tr);
}

/**
 * @param {EditorView} view
 * @param {number} cell
 * @param {number} width
 * @param {number} cellMinWidth
 */
function displayColumnWidth(view, cell, width, cellMinWidth) {
    const $cell = view.state.doc.resolve(cell);
    const table = $cell.node(-2);
    const tableStart = $cell.start(-2);
    const cellNode = $cell.nodeAfter;
    if (!cellNode) return;

    const col = TableMap.get(table).colCount($cell.pos - tableStart) + cellNode.attrs.colspan - 1;
    /** @type {Node | null} */
    let dom = view.domAtPos($cell.start(-2)).node;
    while (dom && dom.nodeName !== "TABLE") {
        dom = dom.parentNode;
    }
    if (!dom) return;
    updateColumnsOnResize(view, table, tableStart, cellMinWidth, col, width);
}

/**
 * @param {EditorState} state
 * @param {number} cell
 * @returns {Decoration[]}
 */
export function handleDecorations(state, cell) {
    const decorations = [];
    const $cell = state.doc.resolve(cell);
    const table = $cell.node(-2);
    if (!table) {
        // return DecorationSet.empty;
        return [];
    }
    const map = TableMap.get(table);
    const start = $cell.start(-2);
    const cellNode = $cell.nodeAfter;
    if (!cellNode) return [];

    const col = map.colCount($cell.pos - start) + cellNode.attrs.colspan;
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
            const pos = start + cellPos + (table.nodeAt(cellPos)?.nodeSize || 0) - 1;
            const dom = document.createElement("div");

            dom.className = "column-resize-handle";
            decorations.push(Decoration.widget(pos, dom));
        }
    }

    return decorations;
}

/**
 * @param {number} tableStart
 * @param {string[]} colWidths
 * @returns {Decoration}
 */
function colgroupDecoration(tableStart, colWidths) {
    return Decoration.widget(
        tableStart,
        () => {
            const colgroup = document.createElement("colgroup");
            for (let c = 0; c < colWidths.length; c++) {
                const colElement = document.createElement("col");
                colElement.style.width = colWidths[c];
                colgroup.appendChild(colElement);
            }
            return colgroup;
        },
        {
            type: SPEC_COL_WIDTHS,
            colWidths,
        },
    );
}

/**
 * @param {number} from
 * @param {number} to
 * @param {Record<string, string>} css
 * @returns {Decoration}
 */
function tableWidthDecoration(from, to, css) {
    const style = Object.entries(css)
        .map(([prop, value]) => `${prop}: ${value}`)
        .join("; ");
    return Decoration.node(from, to, { style }, { type: SPEC_TABLE_WIDTH });
}

/**
 * @param {PMNode} doc
 * @param {Decoration[]} decos
 * @param {number} cellMinWidth
 * @returns {(node: PMNode, pos: number) => boolean}
 */
function tableDecorationsCallback(doc, decos, cellMinWidth) {
    return (node, pos) => {
        if (node.type.spec.tableRole === "table") {
            const tableStart = pos + 1;
            const resolved = doc.resolve(tableStart);
            decos.push(tableWidthDecoration(resolved.before(), resolved.after(), {}));
            const { colWidths } = updateColumnsOnResize(null, node, tableStart, cellMinWidth) || {};
            decos.push(colgroupDecoration(tableStart, colWidths || []));
            return false;
        }
        return true;
    };
}

/**
 * @param {PMNode} doc
 * @param {number} [cellMinWidth]
 * @param {number?} [from]
 * @param {number?} [to]
 */
function createTableDecorations(doc, cellMinWidth, from, to) {
    /** @type {Decoration[]} */
    const decos = [];
    if (from && to) doc.nodesBetween(from, to, tableDecorationsCallback(doc, decos, cellMinWidth || 0));
    else doc.descendants(tableDecorationsCallback(doc, decos, cellMinWidth || 0));
    return decos;
}

/**
 * @param {EditorView | null} view
 * @param {PMNode} table
 * @param {number} tableStart
 * @param {number} cellMinWidth
 * @param {number} [overrideCol]
 * @param {number} [overrideValue]
 * @returns {{ colWidths: string[]; tableWidth: string } | undefined}
 */
function updateColumnsOnResize(view, table, tableStart, cellMinWidth, overrideCol, overrideValue) {
    let totalWidth = 0;
    let fixedWidth = true;
    const row = getRow(table, 0).node;
    if (!row) return;

    /** @type {string[]} */
    const colWidths = [];
    for (let i = 0, col = 0; i < row.childCount; i++) {
        const { colspan, colwidth } = row.child(i).attrs;
        for (let j = 0; j < colspan; j++, col++) {
            const hasWidth = overrideCol === col ? overrideValue : colwidth?.[j];
            colWidths.push(hasWidth ? `${hasWidth}px` : "");
            totalWidth += hasWidth || cellMinWidth;
            if (!hasWidth) fixedWidth = false;
        }
    }

    /** @type {SetColWidthsAction[]} */
    const setColWidths = [{ tableStart, colWidths }];
    const pos = tableStart - 1;
    const tableWidth = `${totalWidth}px`;
    /** @type {SetTableWidthAction[]} */
    const setTableWidth = [
        fixedWidth
            ? { pos, width: totalWidth, css: { "min-width": "", width: tableWidth } }
            : { pos, width: totalWidth, css: { "min-width": tableWidth, width: "" } },
    ];

    if (view) {
        view.dispatch(
            view.state.tr.setMeta(COLUMN_RESIZING_KEY, {
                setColWidths,
                setTableWidth,
            }),
        );
    }
    return { colWidths, tableWidth };
}

/**
 * @param {number} n
 * @returns {0[]}
 */
function zeroes(n) {
    return Array(n).fill(0);
}
