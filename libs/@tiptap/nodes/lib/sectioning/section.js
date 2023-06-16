import { Node } from "@tiptap/core";
import { Footer } from "./footer";
import { Header } from "./header";
import { Main } from "./main";

/** 页边距所有方向 */
const marginDirections = /** @type {const} */ (["top", "left", "bottom", "right"]);

export const Section = Node.create({
    name: "page_section",
    content: "page_main page_header page_footer",

    allowGapCursor: false,
    draggable: false,
    isolating: true,
    selectable: false,

    parseHTML() {
        return [
            {
                tag: "section",
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ["section", { ...HTMLAttributes }, 0];
    },
    addExtensions() {
        return [Header, Footer, Main];
    },

    addAttributes() {
        return {
            /**
             * 纸张格式。如果设置了，优先于宽高选项
             */
            format: {
                default: "A4",
                parseHTML: (ele) => ele.getAttribute("format") || "A4",
                renderHTML: (attrs) => ({ format: attrs.format }),
            },

            /**
             * 纸张方向
             */
            landscape: {
                default: false,
                parseHTML: (ele) => ele.getAttribute("landscape") === "true",
                renderHTML: (attrs) => (attrs.landscape ? { landscape: true } : {}),
            },

            /**
             * 页边距类型
             *
             * - regular 常规 上下: 1inch 左右: 1inch
             * - narrow 窄 上下: 0.5inch 左右: 0.5inch
             * - moderate 适中 上下: 1inch 左右: 0.75inch
             * - wide 宽 上下: 1inch 左右: 2inch
             * - office2003 Office2003默认值 上下: 1inch 左右: 1.25inch
             * - custom 自定义
             */
            marginType: {
                default: "regular",
                parseHTML: (ele) => ele.getAttribute("margin_type") || "regular",
                renderHTML: (attrs) => (attrs.marginType ? { margin_type: attrs.marginType } : {}),
            },

            /**
             * 自定义页面外边距（单位in）
             * {
             *  top: number,
             *  left: number,
             *  right: number,
             *  bottom: number,
             * }
             */
            margin: {
                default: null,
                parseHTML: (ele) => {
                    if (ele.getAttribute("margin_type") !== "custom") return null;

                    return marginDirections.reduce(
                        /** @param {null | Record<string, number>} res */
                        (res, dir) => {
                            let _res = res;
                            const value = ele.getAttribute(`margin_${dir}`);
                            if (value && /(^\d+?[.]?\d*?$)/.test(value)) {
                                if (!_res) _res = {};
                                _res[dir] = parseInt(value);
                            }

                            return _res;
                        },
                        null,
                    );
                },
                renderHTML: (attrs) => {
                    if (!attrs.margin || attrs.marginType !== "custom") return {};

                    return {
                        ...Object.entries(attrs.margin).reduce(
                            /** @param {Record<string, number>} res */
                            (res, [dir, v]) => ({
                                ...res,
                                [`margin_${dir}`]: v,
                            }),
                            {},
                        ),
                    };
                },
            },
        };
    },
});
