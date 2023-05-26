import { Node } from "@tiptap/core";

/**
 * The `Text` extension is required, at least if you want to work with text of any kind and that’s very likely. This extension is a little bit different, it doesn’t even render HTML. It’s plain text, that’s all.
 *
 * @see {@link https://tiptap.dev/api/nodes/text | @tiptap/extension-text}
 */
export const Text = Node.create({
    name: "text",
    group: "inline",
});
