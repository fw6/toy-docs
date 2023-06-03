import { callOrReturn, Extension, getExtensionField } from "@tiptap/core";
import { gapCursor } from "@tiptap/pm/gapcursor";

/**
 * @see {@link https://tiptap.dev/api/extensions/gapcursor | @tiptap/extension-gapcursor}
 */
export const Gapcursor = Extension.create({
    name: "gapCursor",

    addProseMirrorPlugins() {
        return [gapCursor()];
    },

    extendNodeSchema(extension) {
        const context = {
            name: extension.name,
            options: extension.options,
            storage: extension.storage,
        };

        return {
            allowGapCursor: callOrReturn(getExtensionField(extension, "allowGapCursor", context)) ?? null,
        };
    },
});
