import { hasIn } from "lodash-es";
import { resolve } from "node:path";
import { rimraf } from "rimraf";
import sd from "style-dictionary";

/**
 * @typedef {object} ElevationValue
 * @property {'dropShadow'} shadowType
 * @property {number} radius
 * @property {string} color
 * @property {number} offsetX
 * @property {number} offsetY
 * @property {number} spread
 *
 * @typedef {object} FontStyleValue
 * @property {number} fontSize
 * @property {string} textDecoration
 * @property {string} fontFamily
 * @property {number} fontWeight
 * @property {string} fontStyle
 * @property {string} fontStretch
 * @property {number} letterSpacing
 * @property {number} lineHeight
 * @property {number} paragraphIndent
 * @property {number} paragraphSpacing
 * @property {string} textCase
 */
/**
 *
 */

const workspaceRoot = process.env.NX_WORKSPACE_ROOT || process.env.PWD || process.cwd();
const projectRoot = resolve(workspaceRoot, "design/tokens");
rimraf.sync(resolve(projectRoot, "platforms"));

const StyleDictionary = sd.extend("tokens.config.cjs");

StyleDictionary.registerTransform({
    name: "elevation/shadow",
    type: "value",
    matcher: (prop) => prop.type === "custom-shadow",
    transformer: (token) => {
        /** @type {ElevationValue} */
        const value = token.value;
        return `${value.offsetX}px ${value.offsetY}px ${value.radius}px ${value.spread}px ${value.color}`;
    },
});
StyleDictionary.registerTransform({
    name: "display/typography",
    type: "value",
    matcher: (prop) => prop.type === "custom-fontStyle",
    transformer: (token) => {
        /** @type {FontStyleValue} */
        const value = token.value;
        return `${value.fontStyle} ${value.textDecoration} ${value.fontWeight} ${value.fontStretch} ${value.fontSize}px/${value.lineHeight}px ${value.fontFamily}`;
    },
});

/** @param {*} obj */
function minifyDictionary(obj) {
    if (typeof obj !== "object" || Array.isArray(obj)) {
        return obj;
    }

    /** @type {*} */
    const toRet = {};

    if (obj && hasIn(obj, "value")) {
        return obj.value;
    } else {
        for (const name in obj) {
            if (!["description"].includes(name) && hasIn(obj, name)) {
                toRet[name] = minifyDictionary(obj[name]);
            }
        }
    }
    return toRet;
}
StyleDictionary.registerFormat({
    name: "my/json/nested",
    formatter: function ({ dictionary }) {
        return JSON.stringify(minifyDictionary(dictionary.tokens), null, 2);
    },
});

StyleDictionary.registerTransformGroup({
    name: "custom-web",
    transforms: [
        "attribute/cti",
        "name/cti/kebab",
        "time/seconds",
        "content/icon",
        "size/pxToRem",
        "color/hsl-4",
        "elevation/shadow",
        "display/typography",
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
        "elevation/shadow",
        "display/typography",
    ],
});

StyleDictionary.buildAllPlatforms();
