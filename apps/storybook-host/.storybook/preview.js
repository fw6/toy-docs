import { withLinks } from "@storybook/addon-links";

export const decorators = [withLinks];

/** @type { import('@storybook/svelte').Preview } */
const preview = {
    parameters: {
        actions: { argTypesRegex: "^on:w+" },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
    },
};

export default preview;
