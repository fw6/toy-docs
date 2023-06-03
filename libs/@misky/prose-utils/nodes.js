import { hasParentNodeOfType } from "./selection";

/**
 * Checks if node is an empty paragraph.
 * @param {PMNode?} [node]
 * @returns {boolean}
 */
export function isEmptyParagraph(node) {
    return !!node && node.type.name === "paragraph" && !node.childCount;
}

/**
 * @param {ResolvedPos} $pos
 * @param {PMNode} doc
 * @returns {boolean}
 */
export const isLastChild = ($pos, doc) => doc.resolve($pos.after()).node().lastChild === $pos.node();

/**
 * @param {ResolvedPos} $pos
 * @param {PMNode} doc
 * @returns {boolean}
 */
export const isFirstChild = ($pos, doc) => doc.resolve($pos.before()).node().firstChild === $pos.node();

/**
 * @param {Transaction} tr
 * @returns {boolean}
 */
export const nodeIsInsideAList = (tr) => {
    const { nodes } = tr.doc.type.schema;
    return hasParentNodeOfType([nodes.orderedList, nodes.bulletList])(tr.selection);
};
