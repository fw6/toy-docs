/**
 * Misky design system
 */
const TOKEN_PREFIX = "mds";

module.exports = {
    source: ["tokens/**/*.json"],
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
                    format: "json/flat",
                    destination: "tokens.flat.json",
                },
                {
                    format: "my/json/nested",
                    destination: "tokens.nested.json",
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
