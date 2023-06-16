import sharedConfig from "../../../.storybook/main";

/** @type { import('@storybook/svelte-vite').StorybookConfig } */
const config = {
    ...sharedConfig,
    stories: ["../lib/**/*.mdx", "../lib/**/*.stories.@(js|jsx|ts|tsx)"],
    docs: {
        autodocs: "tag",
    },
};
export default config;
