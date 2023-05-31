import { resolve } from "node:path";
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
            resolve: {
                alias: {
                    "@misky/tiptap-extensions": resolve(
                        `${process.env.NX_WORKSPACE_ROOT}/libs/@tiptap/extensions/index.js`,
                    ),
                    "@misky/tiptap-marks": resolve(`${process.env.NX_WORKSPACE_ROOT}/libs/@tiptap/marks/index.js`),
                    "@misky/tiptap-nodes": resolve(`${process.env.NX_WORKSPACE_ROOT}/libs/@tiptap/nodes/index.js`),
                    "@misky/prose-utils": resolve(`${process.env.NX_WORKSPACE_ROOT}/libs/@misky/prose-utils/index.js`),
                    "@local/shared": resolve(`${process.env.NX_WORKSPACE_ROOT}/libs/@local/shared/index.js`),
                },
            },
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
