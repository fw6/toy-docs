import { SvelteSpreadsheet } from "..";
import SheetDecorator from "./SheetDecorator.svelte";
import { columns, data } from "./fixtures";

/**
 * Svelte spreadsheet like Google Sheets
 *
 * @type {StoryMetaSpec}
 */
export default {
    title: "Spreadsheet/Sheet",
    component: SvelteSpreadsheet,
    decorators: [
        () => ({
            Component: SheetDecorator,
        }),
    ],
    tags: ["autodocs"],
};

/**
 * More on writing stories with args: https://storybook.js.org/docs/svelte/writing-stories/args
 * @type {StoryObjSpec}
 */
export const Primary = {
    args: {
        data,
        columns,
        permission: "edit",
    },
};

/**
 * More on writing stories with args: https://storybook.js.org/docs/svelte/writing-stories/args
 * @type {StoryObjSpec}
 */
export const ViewMode = {
    args: {
        data,
        columns,
        permission: "view",
    },
};

/**
 * More on writing stories with args: https://storybook.js.org/docs/svelte/writing-stories/args
 * @type {StoryObjSpec}
 */
export const FillInMode = {
    args: {
        data,
        columns,
        permission: "fillIn",
    },
};
