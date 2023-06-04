import { stylifyVite } from "@stylify/unplugin";
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";
import sharedConfig, { viteConfigOverrides } from "../../../../.storybook/main";

const libDir = fileURLToPath(new URL("../", import.meta.url));

const stylifyPlugin = stylifyVite({
    bundles: [{ outputFile: `${libDir}styles.css`, files: [`${libDir}lib/**/*.svelte`] }],
    // Compiler config info https://stylifycss.com/en/docs/stylify/compiler#configuration
    compiler: {
        dev: true,
        cssVariablesEnabled: true,
        injectVariablesIntoCss: false,
        externalVariables: [(variable) => (variable.startsWith("mds-") ? true : undefined)],

        // https://stylifycss.com/en/docs/stylify/compiler#variables
        variables: {},
        // https://stylifycss.com/en/docs/stylify/compiler#macros
        macros: {},
        // https://stylifycss.com/en/docs/stylify/compiler#components
        components: {},
        // ...
    },
});

/** @type { import('@storybook/svelte-vite').StorybookConfig } */
const config = {
    ...sharedConfig,
    viteFinal(config) {
        /**
         * @type {import('vite').UserConfig}
         */
        const overrides = {
            ...viteConfigOverrides,
            plugins: [stylifyPlugin, ...(viteConfigOverrides.plugins ?? [])],
        };

        return mergeConfig(config, overrides);
    },
    stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(js|jsx|ts|tsx)"],
    docs: {
        autodocs: "tag",
    },
};
export default config;
