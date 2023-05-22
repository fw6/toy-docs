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
        "extension-table": {
            title: "Tiptap extension table",
            url: "http://localhost:4401",
        },
    },
};
export default config;
