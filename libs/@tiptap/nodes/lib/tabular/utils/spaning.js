/**
 * @param {CellAttributes} attrs
 * @param {number} pos
 * @param {number | undefined} n
 * @returns {CellAttributes}
 */
export function removeColSpan(attrs, pos, n = 1) {
    if (!attrs.colspan) {
        throw new Error("removeColSpan(): attrs.colspan not defined");
    }

    const result = { ...attrs, colspan: attrs.colspan - n };

    if (result.colwidth) {
        result.colwidth = result.colwidth.slice();
        result.colwidth.splice(pos, n);
        if (!result.colwidth.some((w) => w > 0)) {
            result.colwidth = undefined;
        }
    }

    return result;
}

/**
 * @param {CellAttributes} attrs
 */
export function assertColspan(attrs) {
    if (typeof attrs.colspan === "undefined") {
        throw new Error("addColSpan: attrs.colspan is not defined");
    }

    if (typeof attrs.colspan !== "number" || Number.isNaN(attrs.colspan) || attrs.colspan < 1) {
        throw new Error(`addColSpan: attrs.colspan must be number >= 1, received: ${attrs.colspan}`);
    }
}

/**
 * TODO: replace "addColSpan" from table plugin with this function
 * @template {CellAttributes} T
 *
 * @param {T} attrs
 * @param {number} pos
 * @param {number | undefined} n
 *
 * @returns {T}
 */
export function addColSpan(attrs, pos, n = 1) {
    assertColspan(attrs);
    const result = { ...attrs, colspan: (attrs.colspan || 1) + n };

    if (result.colwidth) {
        result.colwidth = result.colwidth.slice();
        for (let i = 0; i < n; i++) {
            result.colwidth.splice(pos, 0, 0);
        }
    }

    return result;
}
