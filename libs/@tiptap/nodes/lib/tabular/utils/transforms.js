import { Selection } from "@tiptap/pm/state";

/**
 * :: (position: number, dir: ?number) → (tr: Transaction) → Transaction
 * Returns a new transaction that tries to find a valid cursor selection starting at the given `position`
 * and searching back if `dir` is negative, and forward if positive.
 * If a valid cursor position hasn't been found, it will return the original transaction.
 *
 * ```javascript
 * dispatch(
 *   setTextSelection(5)(tr)
 * );
 * ```
 *
 * @param {number} position
 * @param {number} [dir]
 * @returns {(tr: Transaction) => Transaction}
 */
export const setTextSelection = (position, dir = 1) => (tr) => {
    const nextSelection = Selection.findFrom(tr.doc.resolve(position), dir, true);
    if (nextSelection) {
        return tr.setSelection(nextSelection);
    }
    return tr;
};
