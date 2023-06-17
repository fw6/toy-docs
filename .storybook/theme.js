import { create } from "@storybook/theming/create";

export default create({
    base: "light",

    // Typography
    fontBase: '"Open Sans", sans-serif',
    fontCode: "monospace",

    brandTitle: "Misky's Storybook",
    brandUrl: "https://toy-docs.vercel.app/",
    brandImage: "https://raw.githubusercontent.com/fw6/assets/main/toy_docs/brand-image_low.png",
    brandTarget: "_self",

    //
    colorPrimary: "#471AA0",
    colorSecondary: "#9666dc",

    // UI
    appBg: "#ffffff",
    appContentBg: "#ffffff",
    appBorderColor: "#9666dc",
    appBorderRadius: 4,

    // Text colors
    textColor: "#10162F",
    textInverseColor: "#ffffff",

    // Toolbar default and active colors
    barTextColor: "#9E9E9E",
    barSelectedColor: "#9666dc",
    barBg: "#ffffff",

    // Form colors
    inputBg: "#ffffff",
    inputBorder: "#10162F",
    inputTextColor: "#10162F",
    inputBorderRadius: 2,
});
