/** @type { import('@storybook/svelte-vite').StorybookConfig } */
const config = {
    stories: ["../lib/**/*.mdx", "../lib/**/*.stories.@(js|jsx|ts|tsx)"],
    addons: ["@storybook/addon-links", "@storybook/addon-essentials", "@storybook/addon-interactions"],
    framework: {
        name: "@storybook/svelte-vite",
        options: {},
    },
    docs: {
        autodocs: "tag",
    },
};
export default config;
