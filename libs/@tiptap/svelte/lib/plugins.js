import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import mitt from "mitt";

/**
 * @typedef {{ selectionChanged: { from: number, to: number } }} CustomEvents
 * @typedef {import('mitt').Emitter<CustomEvents>} SelectionNotifier
 */

/** @type {PluginKey<SelectionNotifier>} */
export const SelectionChangePluginKey = new PluginKey("svelteNodeView");

export const NodeViewSelectionNotifierPlugin = new Plugin({
    key: SelectionChangePluginKey,

    state: {
        /** @returns {SelectionNotifier} */
        init() {
            return mitt();
        },
        apply(_tr, value) {
            return value;
        },
    },

    view: (view) => {
        const emitter = SelectionChangePluginKey.getState(view.state);

        return {
            update: (view) => {
                const { from, to } = view.state.selection;

                emitter?.emit("selectionChanged", { from, to });
            },
        };
    },
});

export const NodeViewSelectionNotifier = Extension.create({
    name: "node-view-selection-notifier",

    addProseMirrorPlugins() {
        return [NodeViewSelectionNotifierPlugin];
    },
});
