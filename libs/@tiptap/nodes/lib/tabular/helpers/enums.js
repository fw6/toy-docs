/**
 * @typedef {import('./table-map').TableProblem} TableProblem
 */

/**
 * Using {@link TableProblem}
 *
 * @constant
 * @readonly
 * @enum {string}
 */
export const PROBLEM_TYPES = /** @type {const} */ ({
    COLLISION: 0,
    OVERLONG_ROWSPAN: 1,
    MISSING: 2,
    COLWIDTH_MISMATCH: 3,
});
