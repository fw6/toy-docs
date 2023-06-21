import { addons } from "@storybook/manager-api";
import myTheme from "../../../.storybook/theme";
import favicon from "./static/favicon.svg";

addons.setConfig({
    theme: myTheme,
});

const link = document.createElement("link");
link.setAttribute("rel", "shortcut icon");
link.setAttribute("href", favicon);
document.head.appendChild(link);
