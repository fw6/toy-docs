const TOKEN_PREFIX = "misky";

module.exports = {
    source: ["src/configs/**/*.json", "src/configs/**/*.jsonc"],
    platforms: {
        web: {
            basePxFontSize: 16,
            buildPath: "platforms/web/",
            transformGroup: "custom-web",
            prefix: TOKEN_PREFIX,
            files: [
                {
                    format: "css/variables",
                    destination: "tokens.css",
                    filter: (token) => !token.name.endsWith("-primitive"),
                    options: {
                        outputReferences: true,
                    },
                },
                {
                    format: "scss/variables",
                    destination: "tokens.scss",
                    options: {
                        outputReferences: true,
                        themeable: true,
                    },
                },
                {
                    format: "json/nested",
                    destination: "tokens.json",
                },
                {
                    format: "json",
                    destination: "tokens.raw.json",
                },
                {
                    format: "json/flat",
                    destination: "tokens.flat.json",
                },
                {
                    format: "json/asset",
                    destination: "tokens.asset.json",
                },
            ],
            options: {
                showFileHeader: true,
            },
        },
        js: {
            basePxFontSize: 16,
            buildPath: "platforms/js/",
            transformGroup: "custom-js",
            prefix: TOKEN_PREFIX,
            files: [
                {
                    format: "javascript/es6",
                    destination: "tokens.js",
                    options: {
                        outputReferences: true,
                    },
                },
                {
                    format: "typescript/es6-declarations",
                    destination: "tokens.d.ts",
                },
            ],
        },
    },
};
