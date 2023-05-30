import { Plugin, PluginKey } from "@tiptap/pm/state";
import { clsx } from "clsx";

/**
 * @typedef {import('./types').ColumnResizingPluginAction} ColumnResizingPluginAction
 * @typedef {import('./types').ColumnResizingPluginState} ColumnResizingPluginState
 */

/** @type {PluginKey<ColumnResizingPluginState>} */
export const FLEXI_COLUMNRESIZING_PLUGIN_KEY = new PluginKey("flexiColumnResizing");

export const CLASS_NAMES = {
    RESIZE_HANDLE_DECORATION: "resize-decoration",
};

/**
 * @param {ColumnResizingPluginState} initialState
 * @returns {Plugin<ColumnResizingPluginState>}
 */
export const createFlexiResizingPlugin = (initialState) => {
    return new Plugin({
        key: FLEXI_COLUMNRESIZING_PLUGIN_KEY,
        state: {
            init: () => initialState,
            apply: (tr, _pluginState, _, state) => {
                const oldState = mapping(tr, _pluginState);
                let newState = oldState;
                const meta = tr.getMeta(FLEXI_COLUMNRESIZING_PLUGIN_KEY);
                if (meta) {
                    newState = reducer(oldState, meta);
                }
                // if (newState !== oldState) {
                //     dispatch(FLEXI_COLUMNRESIZING_PLUGIN_KEY, newState);
                // }
                return newState;
            },
        },
        props: {
            attributes: (state) => {
                const pluginState = FLEXI_COLUMNRESIZING_PLUGIN_KEY.getState(state);

                return {
                    class: clsx({
                        "table__resize-cursor": pluginState?.resizeHandlePos !== null,
                        "table__is-resizing": !!pluginState?.dragging,
                    }),
                };
            },

            handleDOMEvents: {
                mousedown(view, event) {
                    const { state } = view;
                    const pluginState = FLEXI_COLUMNRESIZING_PLUGIN_KEY.getState(state);
                    if (!pluginState) return;
                    const { lastColumnResizable, dragging } = pluginState;

                    const resizeHandlePos =
                        // we're setting `resizeHandlePos` via command in unit tests
                        pluginState.resizeHandlePos || getResizeCellPos(view, event, lastColumnResizable);

                    if (resizeHandlePos !== null && !dragging) {
                    }

                    return false;
                },
            },
        },
    });
};

// #region Utils

/**
 * @param {Transaction} tr
 * @param {ColumnResizingPluginState} pluginState
 * @returns {ColumnResizingPluginState}
 */
function mapping(tr, pluginState) {
    if (pluginState && pluginState.resizeHandlePos !== null) {
        return {
            ...pluginState,
            resizeHandlePos: tr.mapping.map(pluginState.resizeHandlePos),
        };
    }

    return pluginState;
}

/**
 * @param {ColumnResizingPluginState} pluginState
 * @param {ColumnResizingPluginAction} action
 * @returns {ColumnResizingPluginState}
 */
export const reducer = (pluginState, action) => {
    switch (action.type) {
        case "STOP_RESIZING":
            return {
                ...pluginState,
                resizeHandlePos: null,
                dragging: null,
            };

        case "SET_RESIZE_HANDLE_POSITION":
            return {
                ...pluginState,
                resizeHandlePos: action.data.resizeHandlePos,
            };

        case "SET_DRAGGING":
            return {
                ...pluginState,
                dragging: action.data.dragging,
            };

        case "SET_LAST_CLICK":
            return {
                ...pluginState,
                lastClick: action.data.lastClick,
                resizeHandlePos: action.data.lastClick ? pluginState.resizeHandlePos : null,
            };
        default:
            return pluginState;
    }
};

/**
 * @param {EditorView} view
 * @param {MouseEvent} event
 * @param {boolean} [_lastColumnResizable]
 * @returns {number | null}
 */
export const getResizeCellPos = (view, event, _lastColumnResizable) => {
    if (!(event.target instanceof Element)) return null;

    const target = event.target;

    if (!target.classList.contains(CLASS_NAMES.RESIZE_HANDLE_DECORATION)) return null;

    const tableCell = target.closest("td, th");
    if (!tableCell) {
        return null;
    }

    const cellStartPosition = view.posAtDOM(tableCell, 0);
    return cellStartPosition - 1;
};

// #endregion
