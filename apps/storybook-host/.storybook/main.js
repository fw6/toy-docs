import sharedConfig from "../../../.storybook/main";

const isDev = process.env.NODE_ENV === "development";

/** @type { import('@storybook/svelte-vite').StorybookConfig } */
const config = {
    ...sharedConfig,
    stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx|svelte)"],
    docs: {
        autodocs: "tag",
    },
    refs: {
        "tiptap extensions": {
            title: "Tiptap extensions",
            url: isDev ? "http://localhost:4401" : "tiptap-extensions/",
        },
        "tiptap marks": {
            title: "Tiptap marks",
            url: isDev ? "http://localhost:4402" : "tiptap-marks/",
        },
        "tiptap nodes": {
            title: "Tiptap extensions",
            url: isDev ? "http://localhost:4403" : "tiptap-nodes/",
        },
        "tiptap svelte adapter": {
            title: "Tiptap svelte",
            url: isDev ? "http://localhost:4404" : "tiptap-svelte/",
        },
        "svelte-spreadsheet": {
            title: "Spreadsheet",
            url: isDev ? "http://localhost:4405" : "svelte-spreadsheet/",
        },
    },
};
export default config;
