import IconTable from "~icons/teenyicons/table-outline";

import { Table, TableCell, TableRow } from "../lib";
import Editor from "./Editor.svelte";

/**
 * More on how to set up stories at: https://storybook.js.org/docs/svelte/writing-stories/introduction
 *
 * @type {EditorCmpMeta}
 */
export default {
    title: "Tiptap Nodes/Tabular",
    component: Editor,
    tags: ["autodocs"],
    // argTypes: {
    //     backgroundColor: { control: "color" },
    //     size: {
    //         control: { type: "select" },
    //         options: ["small", "medium", "large"],
    //     },
    // },
};

/**
 * More on writing stories with args: https://storybook.js.org/docs/svelte/writing-stories/args
 * @type {EditorCmpStoryObj}
 */
export const Primary = {
    args: {
        extensions: [Table, TableCell, TableRow],
        content: {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus libero aperiam reiciendis ea, voluptatum asperiores. Nostrum sed praesentium nulla aliquid earum fugiat impedit. Molestias quidem pariatur suscipit vitae cupiditate exercitationem?",
                        },
                    ],
                },
                {
                    type: "table",
                    content: [
                        {
                            type: "table_row",
                            content: [
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [{ type: "text", text: "A1" }],
                                        },
                                    ],
                                },
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [{ type: "text", text: "B1" }],
                                        },
                                    ],
                                },
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [{ type: "text", text: "C1" }],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "table_row",
                            content: [
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [{ type: "text", text: "A2" }],
                                        },
                                    ],
                                },
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [{ type: "text", text: "B2" }],
                                        },
                                    ],
                                },
                                {
                                    type: "table_cell",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [{ type: "text", text: "C2" }],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus libero aperiam reiciendis ea, voluptatum asperiores. Nostrum sed praesentium nulla aliquid earum fugiat impedit. Molestias quidem pariatur suscipit vitae cupiditate exercitationem?",
                        },
                    ],
                },
            ],
        },
        additionalToolbars: [
            {
                icon: IconTable,
                title: "表格",
                action: ({ editor }) => editor.commands.insertTable({ rows: 2, cols: 4, withHeaderRow: false }),
                isActive: ({ editor }) => editor.isActive("table"),
            },
        ],
    },
};
