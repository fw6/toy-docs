import { Extension, callOrReturn, getExtensionField } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";

/**
 * @typedef {{ resizeObserver: ResizeObserver | null }} WidthStorage
 */

/** @type {PluginKey<WidthPluginState>} */
export const EDITOR_WIDTH_PLUGIN_KEY = new PluginKey("editor_width");

/**
 * @type {Extension<{}, WidthStorage>}
 */
export const Width = Extension.create({
    name: "width",

    addStorage() {
        return {
            resizeObserver: null,
        };
    },

    onCreate() {
        this.storage.resizeObserver = new ResizeObserver((entries) => {
            /** @type {WidthPluginState} */
            const pluginState = {
                width: {},
            };

            entries.forEach((entry) => {
                pluginState.lineLength = entry.contentBoxSize[0].inlineSize;

                this.editor.state.doc.descendants((node, pos) => {
                    if (node.type.spec.contentContainer) {
                        const dom = this.editor.view.nodeDOM(pos);
                        if (dom && dom instanceof HTMLElement) {
                            pluginState.width[node.type.name] = dom.offsetWidth;
                        }

                        return false;
                    }
                    return;
                });
            });

            this.editor.commands.command(({ tr }) => {
                tr.setMeta(EDITOR_WIDTH_PLUGIN_KEY, pluginState);
                return false;
            });
        });
        this.storage.resizeObserver.observe(this.editor.view.dom, {
            box: "content-box",
        });
    },

    onDestroy() {
        this.storage.resizeObserver?.disconnect();
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: EDITOR_WIDTH_PLUGIN_KEY,
                state: {
                    /** @returns {WidthPluginState} */
                    init: () => ({
                        width: {},
                    }),
                    apply(tr, pluginState) {
                        /** @type {WidthPluginState | undefined} */
                        const meta = tr.getMeta(EDITOR_WIDTH_PLUGIN_KEY);
                        if (!meta) {
                            return pluginState;
                        }

                        /** @type {WidthPluginState} */
                        const newPluginState = {
                            ...pluginState,
                            ...meta,
                        };

                        console.log("update plugin state: ", newPluginState);
                        return newPluginState;
                    },
                },

                props: {
                    decorations() {
                        return DecorationSet.empty;
                    },
                },
            }),
        ];
    },

    extendNodeSchema(extension) {
        const context = {
            name: extension.name,
            options: extension.options,
            storage: extension.storage,
        };

        return {
            contentContainer: callOrReturn(getExtensionField(extension, "contentContainer", context)) ?? null,
        };
    },
});
