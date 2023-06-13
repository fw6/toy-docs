/**
 * @typedef {import('@local/simple-editor').EditorToolbarProfile} EditorToolbarProfile
 */

import FixTables from "~icons/fluent/fixed-width-24-regular";
import InsertTable from "~icons/teenyicons/table-outline";

import DeleteColumn from "~icons/ant-design/delete-column-outlined";
import AddColumnAfter from "~icons/mdi/table-column-add-after";
import AddColumnBefore from "~icons/mdi/table-column-add-before";

import DeleteRow from "~icons/ant-design/delete-row-outlined";
import AddRowAfter from "~icons/mdi/table-row-add-after";
import AddRowBefore from "~icons/mdi/table-row-add-before";
/**
 * Default table toolbars
 * @type {EditorToolbarProfile[]}
 */
export const defaultToolbars = [
    {
        type: "divider",
    },
    {
        icon: InsertTable,
        title: "Insert table",
        action: ({ editor }) => editor.commands.insertTable({ rows: 2, cols: 4 }),
        disabled: ({ editor }) => editor.isActive("table"),
    },
    {
        icon: FixTables,
        title: "Fix tables",
        action: ({ editor }) => editor.commands.fixTables(),
    },

    {
        type: "divider",
    },

    {
        icon: AddColumnBefore,
        title: "Add column before",
        action: ({ editor }) => editor.commands.addColumnBefore(),
        disabled: ({ editor }) => !editor.can().addColumnBefore(),
    },
    {
        icon: AddColumnAfter,
        title: "Add column after",
        action: ({ editor }) => editor.commands.addColumnAfter(),
        disabled: ({ editor }) => !editor.can().addColumnAfter(),
    },
    {
        icon: DeleteColumn,
        title: "Delete column",
        action: ({ editor }) => editor.commands.deleteColumn(),
        disabled: ({ editor }) => !editor.can().deleteColumn(),
    },

    {
        type: "divider",
    },

    {
        icon: AddRowBefore,
        title: "Add column before",
        action: ({ editor }) => editor.commands.addRowBefore(),
        disabled: ({ editor }) => !editor.can().addRowBefore(),
    },
    {
        icon: AddRowAfter,
        title: "Add column after",
        action: ({ editor }) => editor.commands.addRowAfter(),
        disabled: ({ editor }) => !editor.can().addRowAfter(),
    },
    {
        icon: DeleteRow,
        title: "Delete column",
        action: ({ editor }) => editor.commands.deleteRow(),
        disabled: ({ editor }) => !editor.can().deleteRow(),
    },

    {
        icon: InsertTable,
        title: "xxx",
        action: ({ editor }) =>
            editor.commands.insertContent({
                type: "table",
                attrs: {
                    id: "873759720211791873",
                },
                content: [
                    {
                        type: "table_row",
                        content: [
                            {
                                type: "table_cell",
                                attrs: {
                                    colspan: 1,
                                    rowspan: 1,
                                },
                                content: [
                                    {
                                        type: "paragraph",
                                        attrs: {
                                            textAlign: "left",
                                        },
                                        content: [
                                            {
                                                type: "text",
                                                text: "单行文本",
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                type: "table_cell",
                                attrs: {
                                    colspan: 1,
                                    rowspan: 1,
                                },
                                content: [
                                    {
                                        type: "paragraph",
                                        attrs: {
                                            textAlign: "left",
                                        },
                                        content: [
                                            {
                                                type: "text",
                                                text: "多行文本",
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
                                    colspan: 1,
                                    rowspan: 1,
                                },
                                content: [
                                    {
                                        type: "paragraph",
                                        attrs: {
                                            textAlign: "left",
                                            lineIndent: 0,
                                        },
                                    },
                                ],
                            },
                            {
                                type: "table_cell",
                                attrs: {
                                    colspan: 1,
                                    rowspan: 1,
                                },
                                content: [
                                    {
                                        type: "paragraph",
                                        attrs: {
                                            textAlign: "left",
                                            lineIndent: 0,
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            }),
    },
];
