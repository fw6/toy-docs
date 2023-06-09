import { Plugin } from "@tiptap/pm/state";
import { TableMap, isInTable, selectedRect } from "@tiptap/pm/tables";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import GirdCell from "./GirdCell.svelte";

import { findTable } from "../../utils/tables";
import { GRID_CELL_KEY } from "../keys";

/**
 * @param {Editor} editor
 */
export const getGridCellPlugin = (editor) => {
    /**
     * @param {number} pos  cell pos
     * @param {number} index row/col index
     * @param {-1 | 0 | 1} dir -1->first row, 1 -> first column, 0 -> first row/col.
     * @param {boolean} [isLast]
     * @returns {Decoration}
     */
    const getGridCellDecoration = (pos, index, dir, isLast) => {
        /** @type {?HTMLElement} */
        let dom = null;
        /** @type {?GirdCell} */
        let component = null;

        return Decoration.widget(
            pos,
            () => {
                // delay render
                if (!dom) {
                    dom = document.createElement("div");
                    dom.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none";
                }
                if (!component)
                    component = new GirdCell({
                        target: dom,
                        props: {
                            index,
                            dir,
                            editor,
                            isLast,
                        },
                    });

                return dom;
            },
            {
                ignoreSelection: true,
                destroy: () => {
                    component?.$destroy();
                    component = null;
                    dom = null;
                },
                getGirdCell: () => component,
                index,
                dir,
                isLast,
            },
        );
    };

    return new Plugin({
        key: GRID_CELL_KEY,
        state: {
            /** @returns {Decoration[]} */
            init: () => [],
            apply(tr, pluginState, oldState, newState) {
                if (!isInTable(newState)) return [];
                const rect = selectedRect(newState);
                const oldTable = findTable(oldState.selection);

                // if the selected table is not changed.
                if (oldTable && oldTable.start === rect.tableStart) {
                    const oldMap = TableMap.get(oldTable.node);
                    if (!tr.docChanged) {
                        if (
                            pluginState.every((deco) => {
                                /** @type {?GirdCell} */
                                const gridCell = deco.spec.getGirdCell();
                                if (!gridCell) return false;
                                gridCell.$set({
                                    editor,
                                });
                                return true;
                            })
                        )
                            return pluginState;
                    }

                    // If the number of rows and columns in the table has not changed, use the previous state.
                    else if (oldMap.width === rect.map.width && oldMap.height === rect.map.height) {
                        return pluginState.map((deco) => {
                            const newPos = tr.mapping.map(deco.from);
                            if (newPos !== deco.from) {
                                deco.spec.destroy();
                                return getGridCellDecoration(newPos, deco.spec.index, deco.spec.dir, deco.spec.isLast);
                            }

                            // reactive editor prop
                            /** @type {?GirdCell} */
                            const gridCell = deco.spec.getGirdCell();

                            gridCell?.$set({
                                editor,
                            });
                            return deco;
                        });
                    }
                }

                /** @type {Decoration[]} */
                const decos = [];

                const mapWidth = rect.map.width;
                for (let index = 0; index < mapWidth; index++) {
                    const cellPos = rect.map.map[index];
                    const pos = rect.tableStart + cellPos;

                    if (index === 0) decos.push(getGridCellDecoration(pos + 1, index, 0));
                    decos.push(getGridCellDecoration(pos + 1, index, -1, index === mapWidth - 1));
                }

                const mapHeight = rect.map.height;
                for (let index = 0; index < mapHeight; index++) {
                    const cellPos = rect.map.map[mapWidth * index];
                    const pos = rect.tableStart + cellPos;
                    decos.push(getGridCellDecoration(pos + 1, index, 1, index === mapHeight - 1));
                }

                return decos;
            },
        },
        props: {
            decorations: (state) => {
                if (!editor.isEditable) return null;
                const decos = GRID_CELL_KEY.getState(state);
                if (decos) return DecorationSet.create(state.doc, [...decos]);
                return null;
            },
        },
    });
};
