import { basicPostCSSPlugins } from "@local/shared/postcss";
import { resolve } from "node:path";
import preprocess from "svelte-preprocess";
import Icons from "unplugin-icons/vite";
import { mergeConfig } from "vite";

/**
 * @type {import('@sveltejs/vite-plugin-svelte').Options}
 */
export const svelteOptions = {
    preprocess: preprocess({
        postcss: {
            plugins: basicPostCSSPlugins,
        },
    }),
    experimental: {
        sendWarningsToBrowser: true,
    },
};

/**
 * @type {import('vite').UserConfig}
 */
export const viteConfigOverrides = {
    css: {
        postcss: {
            plugins: basicPostCSSPlugins,
        },
    },
    resolve: {
        alias: {
            "@misky/tiptap-extensions": resolve(`${process.env.NX_WORKSPACE_ROOT}/libs/@tiptap/extensions/index.js`),
            "@misky/tiptap-marks": resolve(`${process.env.NX_WORKSPACE_ROOT}/libs/@tiptap/marks/index.js`),
            "@misky/tiptap-nodes": resolve(`${process.env.NX_WORKSPACE_ROOT}/libs/@tiptap/nodes/index.js`),
            "@misky/tiptap-svelte": resolve(`${process.env.NX_WORKSPACE_ROOT}/libs/@tiptap/svelte/index.js`),
            "@misky/prose-utils": resolve(`${process.env.NX_WORKSPACE_ROOT}/libs/@misky/prose-utils/index.js`),
            "@local/shared": resolve(`${process.env.NX_WORKSPACE_ROOT}/libs/@local/shared/index.js`),
            "@local/intl": resolve(`${process.env.NX_WORKSPACE_ROOT}/libs/@local/intl/index.js`),
        },
    },
    plugins: [
        Icons({
            compiler: "svelte",
        }),
    ],
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
        return mergeConfig(config, viteConfigOverrides);
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
