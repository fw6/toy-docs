import { Bundler, defineConfig } from "@stylify/bundler";
const isDev = process.argv[process.argv.length - 1] === "--w";

const config = defineConfig({
    // 如果启用了verbose，将显示构建信息
    verbose: true,

    // 观察文件是否有变化
    watchFiles: isDev,

    compiler: {
        mangleSelectors: !isDev,
        dev: process.env.NODE_ENV === "development",
        cssVariablesEnabled: true,
        injectVariablesIntoCss: false,
        externalVariables: [(variable) => (variable.startsWith("mds-") ? true : undefined)],
        undefinedVariableWarningLevel: "silent",
    },
});

const bundler = new Bundler(config);

bundler.bundle([{ outputFile: isDev ? "styles-dev.css" : "styles.css", files: ["lib/**/*.svelte"] }]);

await bundler.waitOnBundlesProcessed();
