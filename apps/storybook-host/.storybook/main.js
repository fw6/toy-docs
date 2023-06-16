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
            url: isDev ? "https://127.0.0.1:4401" : "tiptap-extensions/",
        },
        "tiptap marks": {
            title: "Tiptap marks",
            url: isDev ? "https://127.0.0.1:4402" : "tiptap-marks/",
        },
        "tiptap nodes": {
            title: "Tiptap extensions",
            url: isDev ? "https://127.0.0.1:4403" : "tiptap-nodes/",
        },
        "tiptap svelte adapter": {
            title: "Tiptap svelte",
            url: isDev ? "https://127.0.0.1:4404" : "tiptap-svelte/",
        },
        "svelte spreadsheet": {
            title: "Spreadsheet",
            url: isDev ? "https://127.0.0.1:4405" : "svelte-spreadsheet/",
        },
        "design components": {
            title: "Components",
            url: isDev ? "https://127.0.0.1:4406" : "design-components/",
        },
    },
};
export default config;
