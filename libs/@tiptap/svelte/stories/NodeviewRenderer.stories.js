import { SimpleEditor } from "@local/simple-editor";
import { Node } from "@tiptap/core";
import CustomNode from "~icons/eos-icons/node-outlined";
import { SvelteNodeViewRenderer } from "..";
import NodeViewCmp from "./NodeView.svelte";

/**
 * Test my svelte node view renderer
 *
 * @type {EditorCmpMeta}
 */
export default {
    title: "Tiptap svelte/NodeViewRenderer",
    component: SimpleEditor,
    tags: ["autodocs"],
};

/**
 * More on writing stories with args: https://storybook.js.org/docs/svelte/writing-stories/args
 * @type {EditorCmpStoryObj}
 */
export const Primary = {
    args: {
        extensions: [
            Node.create({
                name: "custom_node",
                group: "block",
                content: "paragraph+",
                renderHTML() {
                    return ["div", { class: "custom-node" }, 0];
                },
                parseHTML() {
                    return [{ tag: "div[custom_node]" }];
                },
                addNodeView() {
                    return SvelteNodeViewRenderer(NodeViewCmp, { as: "div" });
                },
            }),
        ],
        additionalToolbars: [
            {
                type: "divider",
            },
            {
                icon: CustomNode,
                title: "Insert custom node",
                action: ({ editor }) =>
                    editor.commands.insertContent({
                        type: "custom_node",
                        content: [{ type: "paragraph" }],
                    }),
                isActive: ({ editor }) => editor.isActive("custom_node"),
            },
        ],
    },
};
