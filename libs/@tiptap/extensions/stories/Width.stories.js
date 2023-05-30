import { SimpleEditor } from "@local/simple-editor";
import { Node } from "@tiptap/core";
import { Width } from "..";
import { Section } from "../../nodes/lib/sectioning";

/**
 * More on how to set up stories at: https://storybook.js.org/docs/svelte/writing-stories/introduction
 *
 * @type {EditorCmpMeta}
 */
export default {
    title: "Tiptap Extensions/Width",
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
                name: "doc",
                content: "page_section",
                topNode: true,
            }),
            Section,
            Width,
        ],
        starterKitOptions: {
            document: false,
        },
        additionalToolbars: [],
        content: {
            type: "doc",
            content: [
                {
                    type: "page_section",
                    content: [
                        {
                            type: "page_main",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "main",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "page_header",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "header",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "page_footer",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "footer",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    },
};
