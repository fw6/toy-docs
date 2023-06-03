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

exports.functions = {
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
