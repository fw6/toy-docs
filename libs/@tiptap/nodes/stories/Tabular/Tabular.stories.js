import { SimpleEditor } from "@local/simple-editor";
import { Node } from "@tiptap/core";

import { Section, Table, TableCell, TableRow } from "../../";
import { primaryContent, resizingContent } from "./contents";
import { defaultToolbars } from "./toolbars";

/**
 * More on how to set up stories at: https://storybook.js.org/docs/svelte/writing-stories/introduction
 *
 * @type {EditorCmpMeta}
 */
export default {
    title: "Tiptap Nodes/Tabular",
    component: SimpleEditor,
    tags: ["autodocs"],
};

/**
 * More on writing stories with args: https://storybook.js.org/docs/svelte/writing-stories/args
 * @type {EditorCmpStoryObj}
 */
export const Primary = {
    args: {
        extensions: [Table, TableCell, TableRow],
        additionalToolbars: [...defaultToolbars],
        content: primaryContent,
    },
};

/**
 * More on writing stories with args: https://storybook.js.org/docs/svelte/writing-stories/args
 * @type {EditorCmpStoryObj}
 */
export const Columnresizing = {
    args: {
        extensions: [
            Node.create({ topNode: true, name: "doc", content: "page_section" }),
            Section,
            Table,
            TableCell,
            TableRow,
        ],
        starterKitOptions: {
            document: false,
        },
        additionalToolbars: [...defaultToolbars],
        content: resizingContent,
    },
};
