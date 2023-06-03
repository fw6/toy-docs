import sharedConfig from "../../../../.storybook/main";

/** @type { import('@storybook/svelte-vite').StorybookConfig } */
const config = {
    ...sharedConfig,
    stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(js|jsx|ts|tsx|svelte)"],
    docs: {
        autodocs: "tag",
    },
};
export default config;
