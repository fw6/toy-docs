import { SvelteSpreadsheet } from "..";
import SheetDecorator from "./SheetDecorator.svelte";

/**
 * @typedef {import('../typings').SvelteSpreadsheetProps} SvelteSpreadsheetProps
 */

/**
 * Svelte spreadsheet like Google Sheets
 *
 * @type {import('@storybook/svelte').Meta<import('svelte').SvelteComponentTyped<SvelteSpreadsheetProps>>}
 */
export default {
    title: "Tiptap svelte/NodeViewRenderer",
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
 * @type {import('@storybook/svelte').StoryObj<SvelteSpreadsheetProps>}
 */
export const Primary = {
    args: {
        data: [["1"]],
    },
};
