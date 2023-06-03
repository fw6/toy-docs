import { isNodeSelection } from "@tiptap/core";
import { Fragment } from "@tiptap/pm/model";
import { NodeSelection, Selection } from "@tiptap/pm/state";
import { canInsert } from "./helpers";
import { isEmptyParagraph } from "./nodes";
import { findParentNodeOfType, replaceNodeAtPos } from "./selection";

/**
 * :: (content: union<ProseMirrorNode, Fragment>, position: ?number, tryToReplace?: boolean) → (tr: Transaction) → Transaction
 * Returns a new transaction that inserts a given `content` at the current cursor position, or at a given `position`, if it is allowed by schema. If schema restricts such nesting, it will try to find an appropriate place for a given node in the document, looping through parent nodes up until the root document node.
 * If `tryToReplace` is true and current selection is a NodeSelection, it will replace selected node with inserted content if its allowed by schema.
 * If cursor is inside of an empty paragraph, it will try to replace that paragraph with the given content. If insertion is successful and inserted node has content, it will set cursor inside of that content.
 * It will return an original transaction if the place for insertion hasn't been found.
 *
 * ```javascript
 * const node = schema.nodes.extension.createChecked({});
 * dispatch(
 *   safeInsert(node)(tr)
 * );
 * ```
 *
 * @param {PMNode | Fragment} content
 * @param {number} [position]
 * @param {boolean} [tryToReplace]
 * @returns {(_tr: Transaction) => Transaction}
 */
export const safeInsert = (content, position, tryToReplace) => (_tr) => {
    let tr = _tr;

    const hasPosition = typeof position === "number";
    const { $from } = tr.selection;
    const $insertPos = hasPosition
        ? tr.doc.resolve(position)
        : isNodeSelection(tr.selection)
        ? tr.doc.resolve($from.pos + 1)
        : $from;
    const { parent } = $insertPos;

    // try to replace selected node
    if (isNodeSelection(tr.selection) && tryToReplace) {
        const oldTr = tr;
        tr = replaceSelectedNode(content)(tr);
        if (oldTr !== tr) {
            return tr;
        }
    }

    // try to replace an empty paragraph
    if (isEmptyParagraph(parent)) {
        const oldTr = tr;
        tr = replaceParentNodeOfType(parent.type, content)(tr);
        if (oldTr !== tr) {
            const pos = isSelectableNode(content)
                ? // for selectable node, selection position would be the position of the replaced parent
                  $insertPos.before($insertPos.depth)
                : $insertPos.pos;
            return setSelection(content, pos, tr);
        }
    }

    // given node is allowed at the current cursor position
    if (canInsert($insertPos, content)) {
        tr.insert($insertPos.pos, content);
        const pos = hasPosition
            ? $insertPos.pos
            : isSelectableNode(content)
            ? // for atom nodes selection position after insertion is the previous pos
              tr.selection.$anchor.pos - 1
            : tr.selection.$anchor.pos;
        return setSelection(content, pos, tr);
    }

    // looking for a place in the doc where the node is allowed
    for (let i = $insertPos.depth; i > 0; i--) {
        const pos = $insertPos.after(i);
        const $pos = tr.doc.resolve(pos);
        if (canInsert($pos, content)) {
            tr.insert(pos, content);
            return setSelection(content, pos, tr);
        }
    }
    return tr;
};

/**
 * :: (content: union<ProseMirrorNode, ProseMirrorFragment>) → (tr: Transaction) → Transaction
 * Returns a new transaction that replaces selected node with a given `node`, keeping NodeSelection on the new `node`.
 * It will return the original transaction if either current selection is not a NodeSelection or replacing is not possible.
 *
 * ```javascript
 * const node = schema.nodes.paragraph.createChecked({}, schema.text('new'));
 * dispatch(
 *   replaceSelectedNode(node)(tr)
 * );
 * ```
 *
 * @param {PMNode | Fragment} content
 * @returns {(tr: Transaction) => Transaction}
 */
export const replaceSelectedNode = (content) => (tr) => {
    if (isNodeSelection(tr.selection)) {
        const { $from, $to } = tr.selection;

        if (content instanceof Fragment) {
            if (!$from.parent.canReplace($from.index(), $from.indexAfter(), content)) return tr;
        } else if (!$from.parent.canReplaceWith($from.index(), $from.indexAfter(), content.type)) return tr;

        return (
            tr
                .replaceWith($from.pos, $to.pos, content)
                // restore node selection
                .setSelection(new NodeSelection(tr.doc.resolve($from.pos)))
        );
    }
    return tr;
};

/**
 * @param {PMNode | Fragment} node
 * @param {number} pos
 * @param {Transaction} tr
 */
const setSelection = (node, pos, tr) => {
    if (shouldSelectNode(node)) {
        return tr.setSelection(new NodeSelection(tr.doc.resolve(pos)));
    }
    return setTextSelection(pos)(tr);
};

/**
 * @param {number} position
 * @param {number} [dir]
 * @return {(tr: Transaction) => Transaction}
 */
export const setTextSelection = (position, dir = 1) => (tr) => {
    const nextSelection = Selection.findFrom(tr.doc.resolve(position), dir, true);
    if (nextSelection) {
        return tr.setSelection(nextSelection);
    }
    return tr;
};

/** @type {(node: PMNode | Fragment) => node is PMNode} */
const isSelectableNode = (node) => (!(node instanceof Fragment) && node.type.spec.selectable) || false;

/** @type {(node: PMNode | Fragment) => node is PMNode} */
const shouldSelectNode = (node) => isSelectableNode(node) && node.type.isLeaf;

/**
 * :: (nodeType: union<NodeType, [NodeType]>, content: union<ProseMirrorNode, Fragment>) → (tr: Transaction) → Transaction
 * Returns a new transaction that replaces parent node of a given `nodeType` with the given `content`. It will return an original transaction if either parent node hasn't been found or replacing is not possible.
 *
 * ```javascript
 * const node = schema.nodes.paragraph.createChecked({}, schema.text('new'));
 *
 * dispatch(
 *  replaceParentNodeOfType(schema.nodes.table, node)(tr)
 * );
 * ```
 *
 * @param {NodeType | NodeType[]} _nodeType
 * @param {PMNode | Fragment} content
 * @return {(tr: Transaction) => Transaction}
 */
export const replaceParentNodeOfType = (_nodeType, content) => (tr) => {
    let nodeType = _nodeType;
    if (!Array.isArray(nodeType)) {
        nodeType = [nodeType];
    }
    for (let i = 0, count = nodeType.length; i < count; i++) {
        const parent = findParentNodeOfType(nodeType[i])(tr.selection);
        if (parent) {
            const newTr = replaceNodeAtPos(parent.pos, content)(tr);
            if (newTr !== tr) {
                return newTr;
            }
        }
    }
    return tr;
};
