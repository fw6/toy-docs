import { findParentNode } from "@tiptap/core";
import { Fragment } from "@tiptap/pm/model";
import { equalNodeType } from "./helpers";
import { setTextSelection } from "./transforms";

/**
 * @typedef {(tr: Transaction) => Transaction} ChainTrCallback
 */

/**
 * :: (nodeType: union<NodeType, [NodeType]>) → (selection: Selection) → boolean
 * Checks if there's a parent node of a given `nodeType`.
 *
 * ```javascript
 * if (hasParentNodeOfType(schema.nodes.table)(selection)) {
 *   // ....
 * }
 * ```
 *
 * @param {NodeType | NodeType[]} nodeType
 * @return {(sel: import('@tiptap/pm/state').Selection) => boolean}
 */
export const hasParentNodeOfType = (nodeType) => (selection) => {
    return hasParentNode((node) => equalNodeType(nodeType, node))(selection);
};

/**
 * :: (predicate: (node: ProseMirrorNode) → boolean) → (selection: Selection) → boolean
 * Checks if there's a parent node `predicate` returns truthy for.
 *
 * ```javascript
 * if (hasParentNode(node => node.type === schema.nodes.table)(selection)) {
 *   // ....
 * }
 * ```
 * @param {import('@tiptap/core').Predicate} predicate
 * @return {(sel: import('@tiptap/pm/state').Selection) => boolean}
 */
export const hasParentNode = (predicate) => (selection) => {
    return !!findParentNode(predicate)(selection);
};

/**
 * (position: number, content: union<ProseMirrorNode, Fragment>) → (tr: Transaction) → Transaction
 * Returns a `replace` transaction that replaces a node at a given position with the given `content`.
 * It will return the original transaction if replacing is not possible.
 * `position` should point at the position immediately before the node.
 * @param {number} position
 * @param {Fragment | PMNode} content
 * @returns {ChainTrCallback}
 */
export const replaceNodeAtPos = (position, content) => (_tr) => {
    let tr = _tr;
    const node = tr.doc.nodeAt(position);
    const $pos = tr.doc.resolve(position);
    if (node && canReplace($pos, content)) {
        tr = tr.replaceWith(position, position + node.nodeSize, content);
        const start = tr.selection.$from.pos - 1;
        // put cursor inside of the inserted node
        tr = setTextSelection(Math.max(start, 0), -1)(tr);
        // move cursor to the start of the node
        tr = setTextSelection(tr.selection.$from.start())(tr);
        return tr;
    }
    return tr;
};

/**
 * ($pos: ResolvedPos, doc: ProseMirrorNode, content: union<ProseMirrorNode, Fragment>, ) → boolean
 * Checks if replacing a node at a given `$pos` inside of the `doc` node with the given `content` is possible.
 *
 * @param {ResolvedPos} $pos
 * @param {Fragment | PMNode} content
 * @returns {boolean}
 */
export const canReplace = ($pos, content) => {
    const node = $pos.node($pos.depth);
    return node.type.validContent(content instanceof Fragment ? content : Fragment.from(content));
};

/**
 * :: (nodeType: union<NodeType, [NodeType]>) → (selection: Selection) → ?{pos: number, start: number, depth: number, node: ProseMirrorNode}
 * Iterates over parent nodes, returning closest node of a given `nodeType`. `start` points to the start position of the node, `pos` points directly before the node.
 *
 * ```javascript
 * const parent = findParentNodeOfType(schema.nodes.paragraph)(selection);
 * ```
 *
 * @param {NodeType | NodeType[]} nodeType
 * @returns {(sel: import('@tiptap/pm/state').Selection) => (ReturnType<ReturnType<findParentNode>>)}
 */
export const findParentNodeOfType = (nodeType) => (selection) => {
    return findParentNode((node) => equalNodeType(nodeType, node))(selection);
};
