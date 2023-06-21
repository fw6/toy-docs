const tokenCSSFilePath = require.resolve("@misky-design/tokens/platforms/web/tokens.css");
// const postcssGlobalData = require("@csstools/postcss-global-data");
const flatTokens = require("@misky-design/tokens/platforms/web/tokens.flat.json");

/**
 * 磅转像素
 * @param {number} dpi 分辨率
 * @returns {(pt: number) => number}
 */
const pt2Px = (dpi = 96) => (pt) => (pt * dpi) / 72;
/**
 * 毫米转磅
 * @param {number} mm 毫米
 */
const mm2Pt = (mm) => (mm * 72) / 25.4;
/**
 * 英寸转磅
 * @param {number} inch 英寸
 */
const in2Pt = (inch) => inch * 72;

const functions = {
    /** @type {(value: string, dpi: string) => string} */
    pt2px(value, dpi = "96") {
        const _value = parseFloat(value);
        const _dpi = parseFloat(dpi);
        return `${pt2Px(_dpi)(_value).toFixed(3)}px`;
    },
    /** @type {(value: string, dpi: string) => string} */
    inch2px(value, dpi = "96") {
        const _value = parseFloat(value);
        const _dpi = parseFloat(dpi);
        return `${pt2Px(_dpi)(in2Pt(_value)).toFixed(3)}px`;
    },
    /** @type {(value: string, dpi: string) => string} */
    mm2px(value, dpi = "96") {
        const _value = parseFloat(value);
        const _dpi = parseFloat(dpi);
        return `${pt2Px(_dpi)(mm2Pt(_value)).toFixed(3)}px`;
    },
};

/** @type {import('postcss').AcceptedPlugin[]} */
exports.basicPostCSSPlugins = [
    // https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-global-data#readme
    // FIXME https://github.com/csstools/postcss-plugins/issues/885
    // postcssGlobalData({
    //     files: [
    //         // tokenCSSFilePath,
    //         // require.resolve("@misky-design/tokens/platforms/web/custom-properties.css"),
    //     ],
    // }),

    require("postcss-functions")({
        functions,
    }),
    require("postcss-place"),
    require("postcss-import"),

    // https://github.com/GoogleChromeLabs/postcss-jit-props
    // Maybe I don't need this plugin, because I can use `postcss-global-data` to extract tokens.
    require("postcss-jit-props")({
        files: [tokenCSSFilePath],
    }),

    // https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-design-tokens#readme
    // Another way to use design tokens：`design-token("semantic.color.primary");`
    // require('@csstools/postcss-design-tokens'),

    // Last way to use design tokens：`border: 1px solid token(--mds-core-color-violet-200);`
    require("postcss-replace")({
        pattern: /token\(.*?--([^\s]+?)\)/gi,
        data: flatTokens,
    }),

    require("postcss-preset-env")({
        // https://browsersl.ist/#q=%3E+0.2%25+and+not+dead+and+last+3+versions
        browsers: "> 0.2% and not dead and last 3 versions",
        features: {
            "custom-properties": true,
            "nesting-rules": true,
            "color-function": true,
            "color-functional-notation": true,
        },
        autoprefixer: {
            grid: true,
            flexbox: "no-2009",
        },
    }),
];
