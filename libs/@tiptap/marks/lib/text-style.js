import { getMarkAttributes, Mark, mergeAttributes } from "@tiptap/core";

/**
 * This mark renders a `<span>` HTML tag and enables you to add a list of styling related attributes, for example font-family, font-size, or color. The extension doesn’t add any styling attribute by default, but other extensions use it as the foundation, for example `FontFamily` or `Color`.
 *
 * @type {Mark<TextStyleOptions>}
 * @see {@link https://tiptap.dev/api/marks/text-style | @tiptap/extension-text-style}
 */
export const TextStyle = Mark.create({
    name: "textStyle",

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    parseHTML() {
        return [
            {
                tag: "span",
                getAttrs: (element) => {
                    const hasStyles = element instanceof Element && element.hasAttribute("style");
                    if (!hasStyles) return false;

                    return {};
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },

    addCommands() {
        return {
            removeEmptyTextStyle: () => ({ state, commands }) => {
                const attributes = getMarkAttributes(state, this.type);
                const hasStyles = Object.entries(attributes).some(([, value]) => !!value);

                if (hasStyles) {
                    return true;
                }

                return commands.unsetMark(this.name);
            },
        };
    },
});
