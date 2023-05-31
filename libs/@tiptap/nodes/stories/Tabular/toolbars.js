/**
 * @typedef {import('@local/simple-editor').EditorToolbarProfile} EditorToolbarProfile
 */

import DeleteColumn from "~icons/ant-design/delete-column-outlined";
import FixTables from "~icons/fluent/fixed-width-24-regular";
import AddColumnAfter from "~icons/mdi/table-column-add-after";
import AddColumnBefore from "~icons/mdi/table-column-add-before";
import InsertTable from "~icons/teenyicons/table-outline";

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
        action: ({ editor }) => editor.commands.insertTable({ rowsCount: 2, colsCount: 4 }),
        isActive: ({ editor }) => editor.isActive("table"),
    },

    {
        type: "divider",
    },

    {
        icon: AddColumnBefore,
        title: "Add column before",
        action: ({ editor }) => editor.commands.addColumnBefore(),
        isActive: ({ editor }) => editor.isActive("table"),
    },
    {
        icon: AddColumnAfter,
        title: "Add column after",
        action: ({ editor }) => editor.commands.addColumnAfter(),
        isActive: ({ editor }) => editor.isActive("table"),
    },
    {
        icon: DeleteColumn,
        title: "Delete column",
        action: ({ editor }) => editor.commands.deleteColumn(),
        isActive: ({ editor }) => editor.isActive("table"),
    },

    {
        icon: FixTables,
        title: "Fix tables",
        action: ({ editor }) => editor.commands.fixTables(),
    },
];
