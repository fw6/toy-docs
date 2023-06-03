const regex = /(auto|scroll)/;
/**
 * @param {Element} ele
 * @param {string} prop
 */
const style = (ele, prop) => getComputedStyle(ele, null).getPropertyValue(prop);

/** @param {Element} ele */
const isScrollable = (ele) => regex.test(style(ele, "overflow") + style(ele, "overflow-y") + style(ele, "overflow-x"));

/**
 * @param {Element | null} ele
 * @returns {Element}
 */
export const getScrollableParent = (ele) => {
    return !ele || ele === document.body
        ? document.body
        : isScrollable(ele)
        ? ele
        : getScrollableParent(ele.parentElement);
};
