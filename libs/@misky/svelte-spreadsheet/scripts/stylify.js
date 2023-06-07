import { Bundler, defineConfig } from "@stylify/bundler";
import { createRequire } from "node:module";
import tinycolor from "tinycolor2";

const require = createRequire(import.meta.url);
const isDev = process.argv[process.argv.length - 1] === "--w";

/** @type {Record<string, any>} */
const tokens = require("@misky-design/tokens/platforms/web/tokens.flat.json");

const config = defineConfig({
    // 如果启用了verbose，将显示构建信息
    verbose: true,

    // 观察文件是否有变化
    watchFiles: isDev,

    compiler: {
        mangleSelectors: !isDev,
        dev: process.env.NODE_ENV === "development",

        cssVariablesEnabled: true,
        externalVariables: [(variable) => (variable.startsWith("mds-") ? true : undefined)],
        injectVariablesIntoCss: true,

        undefinedVariableWarningLevel: "silent",

        helpers: {
            /** @type {(color: string, amount: number) => string} */
            darkenAll: (color, amount) => {
                let _color = color;
                if (/^mds-/.test(color) && tokens[_color]) {
                    _color = tokens[_color];
                }

                return tinycolor(color).darken(amount).toString();
            },
            /** @type {(color: string, amount: number) => string} */
            lightenAll: (color, amount) => {
                let _color = color;
                if (/^mds-/.test(color) && tokens[_color]) {
                    _color = tokens[_color];
                }
                console.log(color, _color);
                console.log(tinycolor(color).lighten(amount).toString("rgb"));
                return tinycolor(_color).lighten(amount).toString();
            },
        },
    },
});

const bundler = new Bundler(config);

bundler.bundle([{ outputFile: isDev ? "styles-dev.css" : "styles.css", files: ["lib/**/*.svelte"] }]);

await bundler.waitOnBundlesProcessed();
