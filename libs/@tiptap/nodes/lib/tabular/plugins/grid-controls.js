/**
 * @typedef {import('@misky/prose-utils').DecorationTransformer} DecorationTransformer
 */

import { composeDecorations } from "@misky/prose-utils";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import { TableClassNames, TableDecorations } from "../constants";
import { CellSelection } from "../helpers/cell-selection";
import { TableMap } from "../helpers/table-map";
import { getCellsInRow } from "../utils/rows";
import { getSelectionRect } from "../utils/selection";
import { findTable } from "../utils/tables";
import { GRID_CONTROLS_KEY } from "./keys";

export const gridControlsPlugin = () =>
    new Plugin({
        key: GRID_CONTROLS_KEY,
        state: {
            init: () => DecorationSet.empty,
            apply: (tr, decorationSet, oldState) => {
                let pluginState = decorationSet;

                /** @type {{ data: { decorationSet?: DecorationSet} } | undefined} */
                const meta = tr.getMeta(GRID_CONTROLS_KEY);
                if (meta?.data.decorationSet) {
                    pluginState = meta.data.decorationSet;
                }

                if (tr.docChanged || tr.selectionSet) {
                    if (tr.docChanged || tr.selection instanceof CellSelection) {
                        return buildColumnControlsDecorations({
                            decorationSet,
                            tr,
                        });
                    } else if (tr.selectionSet) {
                        const isTrFromMouseClick = !tr.docChanged && tr.getMeta("pointer");

                        if (isTrFromMouseClick || oldState.selection instanceof CellSelection) {
                            return maybeUpdateColumnControlsSelectedDecoration({ decorationSet, tr });
                        }
                    }
                }

                return pluginState;
            },
        },

        props: {
            decorations: (state) => GRID_CONTROLS_KEY.getState(state),
        },
    });

// #region Decoration Transformers

/** @type {DecorationTransformer} */
const buildColumnControlsDecorations = ({ tr }) => {
    return composeDecorations([
        removeColumnControlsSelectedDecoration,
        removeControlsHoverDecoration,
        maybeUpdateColumnSelectedDecoration,
        maybeUpdateColumnControlsDecoration,
    ])({ decorationSet: DecorationSet.empty, tr });
};

/** @type {DecorationTransformer} */
const maybeUpdateColumnControlsSelectedDecoration = ({ tr, decorationSet }) => {
    const deco = findColumnControlSelectedDecoration(decorationSet);
    console.log(deco, decorationSet);
    if (!deco.length) {
        return decorationSet;
    }

    return removeColumnControlsSelectedDecoration({ decorationSet, tr });
};

/**
 * @type {DecorationTransformer}
 */
const removeColumnControlsSelectedDecoration = ({ tr, decorationSet }) =>
    decorationSet.remove(findColumnControlSelectedDecoration(decorationSet));

/** @type {DecorationTransformer} */
const removeControlsHoverDecoration = ({ decorationSet }) =>
    decorationSet.remove(findControlsHoverDecoration(decorationSet));

/** @type {DecorationTransformer} */
const maybeUpdateColumnSelectedDecoration = ({ decorationSet, tr }) => {
    if (!isColumnSelected(tr)) {
        return decorationSet;
    }

    return updateDecorations(
        tr.doc,
        decorationSet,
        createColumnSelectedDecoration(tr),
        TableDecorations.COLUMN_SELECTED,
    );
};

/** @type {DecorationTransformer} */
const maybeUpdateColumnControlsDecoration = ({ decorationSet, tr }) => {
    const table = findTable(tr.selection);
    if (!table) {
        return decorationSet;
    }
    return updateDecorations(
        tr.doc,
        decorationSet,
        createColumnControlsDecoration(tr.selection),
        TableDecorations.COLUMN_CONTROLS_DECORATIONS,
    );
};

// #endregion

// #region Utils

/** @type {(tr: Transaction) => boolean} */
const isColumnSelected = (tr) => tr.selection instanceof CellSelection && tr.selection.isColSelection();

/**
 * @param {import("../constants").TableDecorationKey} key
 * @param {DecorationSet} decorationSet
 * @returns {Decoration[]}
 */
const filterDecorationByKey = (key, decorationSet) =>
    decorationSet.find(undefined, undefined, (spec) => spec.key.indexOf(key) > -1);

/**
 * @param {PMNode} node
 * @param {DecorationSet} decorationSet
 * @param {Decoration[]} decorations
 * @param {import("../constants").TableDecorationKey} key
 * @returns {DecorationSet}
 */
export const updateDecorations = (node, decorationSet, decorations, key) => {
    const filteredDecorations = filterDecorationByKey(key, decorationSet);
    const decorationSetFiltered = decorationSet.remove(filteredDecorations);

    return decorationSetFiltered.add(node, decorations);
};

/**
 * @param {DecorationSet} decorationSet
 * @returns {Decoration[]}
 */
const findColumnControlSelectedDecoration = (decorationSet) =>
    filterDecorationByKey(TableDecorations.COLUMN_SELECTED, decorationSet);

/**
 * @param {DecorationSet} decorationSet
 * @returns {Decoration[]}
 */
const findControlsHoverDecoration = (decorationSet) =>
    filterDecorationByKey(TableDecorations.ALL_CONTROLS_HOVER, decorationSet);

/**
 * @typedef {NodeWithPos & {start: number}} Cell
 * @typedef {import('@tiptap/pm/state').Selection} Selection
 */

/**
 * @param {Selection} selection
 * @returns {Decoration[]}
 */
const createColumnControlsDecoration = (selection) => {
    const cells = getCellsInRow(0)(selection) || [];
    let index = 0;
    return cells.map((cell) => {
        /** @type {number} */
        const colspan = cell.node.attrs.colspan || 1;
        const element = document.createElement("div");
        element.classList.add(TableClassNames.COLUMN_CONTROLS_DECORATIONS);
        element.dataset.startIndex = `${index}`;
        index += colspan;
        element.dataset.endIndex = `${index}`;

        return Decoration.widget(cell.pos + 1, () => element, {
            key: `${TableDecorations.COLUMN_CONTROLS_DECORATIONS}_${index}`,
            // this decoration should be the first one, even before gap cursor.
            side: -100,
        });
    });
};

/**
 * @param {Transaction} tr
 * @returns {Decoration[]}
 */
export const createColumnSelectedDecoration = (tr) => {
    const { selection, doc } = tr;
    const table = findTable(selection);
    const rect = getSelectionRect(selection);

    if (!table || !rect) {
        return [];
    }

    const map = TableMap.get(table.node);
    const cellPositions = map.cellsInRect(rect);

    return cellPositions.map((pos, index) => {
        const cell = doc.nodeAt(pos + table.start);

        return Decoration.node(
            pos + table.start,
            pos + table.start + (cell?.nodeSize || 0),
            {
                class: TableClassNames.COLUMN_SELECTED,
            },
            {
                key: `${TableDecorations.COLUMN_SELECTED}_${index}`,
            },
        );
    });
};

// #endregion
