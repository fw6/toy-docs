import sharedConfig from "../../../.storybook/main";

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
            url: "http://localhost:4401",
        },
        "tiptap marks": {
            title: "Tiptap marks",
            url: "http://localhost:4402",
        },
        "tiptap nodes": {
            title: "Tiptap extensions",
            url: "http://localhost:4403",
        },
        "tiptap svelte adapter": {
            title: "Tiptap svelte",
            url: "http://localhost:4404",
        },
    },
};
export default config;
