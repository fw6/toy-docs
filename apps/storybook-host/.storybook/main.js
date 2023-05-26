/** @type { import('@storybook/svelte-vite').StorybookConfig } */
const config = {
    stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx|svelte)"],
    addons: ["@storybook/addon-links", "@storybook/addon-essentials", "@storybook/addon-interactions"],
    framework: {
        name: "@storybook/svelte-vite",
        options: {},
    },
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
    },
};
export default config;
