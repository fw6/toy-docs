import { SimpleEditor } from "@local/simple-editor";
import { Width } from "@misky/tiptap-extensions";
import { Node } from "@tiptap/core";
import IconTable from "~icons/teenyicons/table-outline";
import { Section, Table, TableCell, TableRow } from "..";

/**
 * More on how to set up stories at: https://storybook.js.org/docs/svelte/writing-stories/introduction
 *
 * @type {EditorCmpMeta}
 */
export default {
    title: "Tiptap Nodes/Tabular",
    component: SimpleEditor,
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
        additionalToolbars: [
            {
                icon: IconTable,
                title: "表格",
                action: ({ editor }) => editor.commands.insertTable({ rowsCount: 2, colsCount: 4 }),
                isActive: ({ editor }) => editor.isActive("table"),
            },
        ],
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
                    attrs: {
                        colwidths: [30, 40, 30],
                    },
                    content: [
                        {
                            type: "table_row",
                            content: [
                                {
                                    type: "table_cell",
                                    attrs: {
                                        rowspan: 1,
                                        colspan: 1,
                                        colwidth: null,
                                    },
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "A1",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "table_cell",
                                    attrs: {
                                        rowspan: 1,
                                        colspan: 1,
                                        colwidth: null,
                                    },
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "B1",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "table_cell",
                                    attrs: {
                                        rowspan: 1,
                                        colspan: 1,
                                        colwidth: null,
                                    },
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "C1",
                                                },
                                            ],
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
                                    attrs: {
                                        rowspan: 1,
                                        colspan: 1,
                                        colwidth: null,
                                    },
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "A2",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "table_cell",
                                    attrs: {
                                        rowspan: 1,
                                        colspan: 1,
                                        colwidth: null,
                                    },
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "B2",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "table_cell",
                                    attrs: {
                                        rowspan: 1,
                                        colspan: 1,
                                        colwidth: null,
                                    },
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: "C2",
                                                },
                                            ],
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
            Width,
            Table,
            TableCell,
            TableRow,
        ],
        starterKitOptions: {
            document: false,
        },
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
                                            text: "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Repellendus libero aperiam reiciendis ea, voluptatum asperiores. Nostrum sed praesentium nulla aliquid earum fugiat impedit. Molestias quidem pariatur suscipit vitae cupiditate exercitationem?",
                                        },
                                    ],
                                },
                                {
                                    type: "table",
                                    attrs: {
                                        colwidths: [30, 40, 30],
                                        marginLeft: 0,
                                        marginRight: 0,
                                    },
                                    content: [
                                        {
                                            type: "table_row",
                                            content: [
                                                {
                                                    type: "table_cell",
                                                    attrs: {
                                                        rowspan: 1,
                                                        colspan: 1,
                                                        colwidth: null,
                                                    },
                                                    content: [
                                                        {
                                                            type: "paragraph",
                                                            content: [
                                                                {
                                                                    type: "text",
                                                                    text: "A1",
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                                {
                                                    type: "table_cell",
                                                    attrs: {
                                                        rowspan: 1,
                                                        colspan: 1,
                                                        colwidth: null,
                                                    },
                                                    content: [
                                                        {
                                                            type: "paragraph",
                                                            content: [
                                                                {
                                                                    type: "text",
                                                                    text: "B1",
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                                {
                                                    type: "table_cell",
                                                    attrs: {
                                                        rowspan: 1,
                                                        colspan: 1,
                                                        colwidth: null,
                                                    },
                                                    content: [
                                                        {
                                                            type: "paragraph",
                                                            content: [
                                                                {
                                                                    type: "text",
                                                                    text: "C1",
                                                                },
                                                            ],
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
                                                    attrs: {
                                                        rowspan: 1,
                                                        colspan: 1,
                                                        colwidth: null,
                                                    },
                                                    content: [
                                                        {
                                                            type: "paragraph",
                                                            content: [
                                                                {
                                                                    type: "text",
                                                                    text: "A2",
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                                {
                                                    type: "table_cell",
                                                    attrs: {
                                                        rowspan: 1,
                                                        colspan: 1,
                                                        colwidth: null,
                                                    },
                                                    content: [
                                                        {
                                                            type: "paragraph",
                                                            content: [
                                                                {
                                                                    type: "text",
                                                                    text: "B2",
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                                {
                                                    type: "table_cell",
                                                    attrs: {
                                                        rowspan: 1,
                                                        colspan: 1,
                                                        colwidth: null,
                                                    },
                                                    content: [
                                                        {
                                                            type: "paragraph",
                                                            content: [
                                                                {
                                                                    type: "text",
                                                                    text: "C2",
                                                                },
                                                            ],
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
                                            text: "Lorem ipsu",
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
                                },
                            ],
                        },
                        {
                            type: "page_footer",
                            content: [
                                {
                                    type: "paragraph",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    },
};
