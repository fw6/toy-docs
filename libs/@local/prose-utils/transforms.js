// :: (content: union<ProseMirrorNode, Fragment>, position: ?number, tryToReplace?: boolean) → (tr: Transaction) → Transaction
// Returns a new transaction that inserts a given `content` at the current cursor position, or at a given `position`, if it is allowed by schema. If schema restricts such nesting, it will try to find an appropriate place for a given node in the document, looping through parent nodes up until the root document node.
// If `tryToReplace` is true and current selection is a NodeSelection, it will replace selected node with inserted content if its allowed by schema.
// If cursor is inside of an empty paragraph, it will try to replace that paragraph with the given content. If insertion is successful and inserted node has content, it will set cursor inside of that content.
// It will return an original transaction if the place for insertion hasn't been found.
//
// ```javascript
// const node = schema.nodes.extension.createChecked({});
// dispatch(
//   safeInsert(node)(tr)
// );
// ```
export const safeInsert = (content, position, tryToReplace) => (tr) => {
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
        return cloneTr(setSelection(content, pos, tr));
    }

    // looking for a place in the doc where the node is allowed
    for (let i = $insertPos.depth; i > 0; i--) {
        const pos = $insertPos.after(i);
        const $pos = tr.doc.resolve(pos);
        if (canInsert($pos, content)) {
            tr.insert(pos, content);
            return cloneTr(setSelection(content, pos, tr));
        }
    }
    return tr;
};
