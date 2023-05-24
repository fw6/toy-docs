import merge from "deepmerge";
import fs from "fs-extra";
import { jsonc } from "jsonc";
import { createRequire } from "module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { rimraf } from "rimraf";
import styleDictionary from "style-dictionary";

import { EasingBezier } from "./transformers/css-bezier.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const { extend } = styleDictionary;

const workspaceRoot = process.env.NX_WORKSPACE_ROOT || process.env.PWD || process.cwd();
const projectRoot = resolve(workspaceRoot, "design/tokens");

rimraf.sync(resolve(projectRoot, "platforms"));

const StyleDictionary = styleDictionary.extend("src/tokens.config.cjs");

StyleDictionary.registerTransform(EasingBezier);
StyleDictionary.registerTransformGroup({
    name: "custom-web",
    transforms: [
        "attribute/cti",
        "name/cti/kebab",
        "time/seconds",
        "content/icon",
        "size/pxToRem",
        "color/hsl-4",
        "easing/cubic-bezier",
    ],
});

StyleDictionary.registerTransformGroup({
    name: "custom-js",
    transforms: [
        "attribute/cti",
        "name/cti/constant",
        "time/seconds",
        "content/icon",
        "size/pxToRem",
        "color/hsl-4",
        "easing/cubic-bezier",
    ],
});

StyleDictionary.buildAllPlatforms();

const configPath = resolve(__dirname, "./configs");
const files = fs.readdirSync(configPath, { withFileTypes: true });

const excludes = ["easing.json"];

/**
 * @param {import('fs').Dirent} file
 * @param {string} currentPath
 * @returns {Record<string, any> | Record<string, any>[]}
 */
const flatMapFunc = (file, currentPath) => {
    const path = join(currentPath, file.name);
    if (excludes.includes(file.name)) return [];

    if (file.isDirectory()) {
        return fs.readdirSync(path, { withFileTypes: true }).flatMap((item) => flatMapFunc(item, path));
    } else if (file.isFile() && /.json(5|c?)$/.test(file.name)) {
        return jsonc.parse(fs.readFileSync(path, { encoding: "utf-8" }));
    }

    return [];
};

const allJson = files.flatMap((file) => flatMapFunc(file, configPath));

fs.writeFileSync(resolve(projectRoot, "platforms/web/tokens.original.json"), JSON.stringify(merge.all(allJson)), {
    encoding: "utf8",
});
