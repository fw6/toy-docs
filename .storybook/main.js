import preprocess from "svelte-preprocess";
import Icons from "unplugin-icons/vite";
import { mergeConfig } from "vite";

/**
 * @type {import('@sveltejs/vite-plugin-svelte').Options}
 */
const svelteOptions = {
    preprocess: preprocess(),
    experimental: {
        sendWarningsToBrowser: true,
    },
};

/** @type { import('@storybook/svelte-vite').StorybookConfig } */
export default {
    core: { builder: "@storybook/builder-vite", disableTelemetry: true },
    framework: {
        name: "@storybook/svelte-vite",
        options: {},
    },
    features: {},
    stories: [],
    addons: [
        "@storybook/addon-links",
        "@storybook/addon-essentials",
        "@storybook/addon-interactions",
        "@storybook/addon-svelte-csf",
    ],
    viteFinal(config) {
        /**
         * @type {import('vite').UserConfig}
         */
        const overrides = {
            plugins: [
                Icons({
                    compiler: "svelte",
                }),
            ],
        };

        return mergeConfig(config, overrides);
    },

    // FIXME
    // @ts-expect-error
    svelteOptions,

    // uncomment the property below if you want to apply some webpack config globally
    // webpackFinal: async (config, { configType }) => {
    //   // Make whatever fine-grained changes you need that should apply to all storybook configs

    //   // Return the altered config
    //   return config;
    // },
};
