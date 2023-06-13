import { withLinks } from "@storybook/addon-links";

export const decorators = [withLinks];

if (process.env.NODE_ENV === "development") import("../styles-dev.css");
else import("../styles.css");
