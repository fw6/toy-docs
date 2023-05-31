import { Fragment, Node as PMNode } from "@tiptap/pm/model";

/**
 * (nodeType: union<NodeType, [NodeType]>) → boolean
 * Checks if the type a given `node` equals to a given `nodeType`.
 *
 * @param {NodeType | NodeType[]} nodeType
 * @param {PMNode} node
 */
export const equalNodeType = (nodeType, node) => {
    return (Array.isArray(nodeType) && nodeType.indexOf(node.type) > -1) || node.type === nodeType;
};

/**
 * :: ($pos: ResolvedPos, content: union<ProseMirrorNode, Fragment>) → boolean
 * Checks if a given `content` can be inserted at the given `$pos`
 *
 * ```javascript
 * const { selection: { $from } } = state;
 * const node = state.schema.nodes.atom.createChecked();
 * if (canInsert($from, node)) {
 *   // ...
 * }
 * ```
 *
 * @param {ResolvedPos} $pos
 * @param {Fragment | PMNode} content
 */
export const canInsert = ($pos, content) => {
    const index = $pos.index();

    if (content instanceof Fragment) {
        return $pos.parent.canReplace(index, index, content);
    } else if (content instanceof PMNode) {
        return $pos.parent.canReplaceWith(index, index, content.type);
    }
    return false;
};
