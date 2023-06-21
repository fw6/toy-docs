import { withLinks } from "@storybook/addon-links";

export const decorators = [withLinks];

/** @type {import('@storybook/svelte').Preview} */
const preview = {
    parameters: {
        options: {
            storySort: {
                order: ["Introduction", "Colors", "Elevation"],
            },
        },
    },
};

export default preview;
