import { isNodeSelection } from "@tiptap/core";
import { Fragment } from "@tiptap/pm/model";
import { ReplaceAroundStep, ReplaceStep } from "@tiptap/pm/transform";
import { canInsert, safeInsert as pmSafeInsert } from "prosemirror-utils";
import { isEmptyParagraph, isFirstChild, isLastChild, nodeIsInsideAList } from "./nodes";

const LookDirection = /** @type {const} */ ({
    Before: "before",
    After: "after",
});
const Side = /** @type {const} */ ({
    LEFT: "left",
    RIGHT: "right",
});

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
 * @param {InsertableContent} content
 * @param {number} [position]
 *
 * @returns {(tr: Transaction) => Transaction | null}
 */
export const safeInsert = (content, position) => (tr) => {
    const { nodes } = tr.doc.type.schema;
    const whitelist = [nodes.rule, nodes.mediaSingle];

    // fallback if the node to insert is not in the whitelist, or if the insertion should happen within a list.
    if (content instanceof Fragment || !whitelist.includes(content.type) || nodeIsInsideAList(tr)) {
        return null;
    }

    // Check for selection
    if (!tr.selection.empty || isNodeSelection(tr.selection)) {
        // NOT IMPLEMENTED
        return null;
    }

    const { $from } = tr.selection;
    const $insertPos = position
        ? tr.doc.resolve(position)
        : isNodeSelection(tr.selection)
        ? tr.doc.resolve($from.pos + 1)
        : $from;

    /** @type {LookDirection[keyof LookDirection] | undefined} */
    let lookDirection;
    const insertPosEnd = $insertPos.end();
    const insertPosStart = $insertPos.start();

    // When parent node is an empty paragraph,
    // check the empty paragraph is the first or last node of its parent.
    if (isEmptyParagraph($insertPos.parent)) {
        if (isLastChild($insertPos, tr.doc)) {
            lookDirection = LookDirection.After;
        } else if (isFirstChild($insertPos, tr.doc)) {
            lookDirection = LookDirection.Before;
        }
    } else {
        if ($insertPos.pos === insertPosEnd) {
            lookDirection = LookDirection.After;
        } else if ($insertPos.pos === insertPosStart) {
            lookDirection = LookDirection.Before;
        }
    }

    const grandParentType = tr.selection.$from.node(-1)?.type;
    const parentType = tr.selection.$from.parent.type;
    if (!lookDirection && !shouldSplitSelectedNodeOnNodeInsertion(parentType, grandParentType, content)) {
        // node to be inserted is an invalid child of selection so insert below selected node
        return pmSafeInsert(content, tr.selection.from)(tr);
    }

    if (!lookDirection) {
        // fallback to consumer for now
        return null;
    }

    // Replace empty paragraph
    if (isEmptyParagraph($insertPos.parent) && canInsert(tr.doc.resolve($insertPos[lookDirection]()), content)) {
        return finaliseInsert(tr.replaceWith($insertPos.before(), $insertPos.after(), content), -1);
    }

    let $proposedPosition = $insertPos;
    while ($proposedPosition.depth > 0) {
        const $parentPos = tr.doc.resolve($proposedPosition[lookDirection]());
        const parentNode = $parentPos.node();

        // Insert at position (before or after target pos)
        if (canInsert($proposedPosition, content)) {
            return finaliseInsert(tr.insert($proposedPosition.pos, content), content.nodeSize);
        }

        // If we can't insert, and we think we should split, we fallback to consumer for now
        if (shouldSplit(parentNode.type, tr.doc.type.schema.nodes)) {
            return finaliseInsert(
                insertBeforeOrAfter(tr, lookDirection, $parentPos, $proposedPosition, content),
                content.nodeSize,
            );
        }

        // Can not insert into current parent, step up one parent
        $proposedPosition = $parentPos;
    }

    return finaliseInsert(tr.insert($proposedPosition.pos, content), content.nodeSize);
};

/**
 * @param {Transaction} tr
 * @returns {Transaction}
 */
export const cloneTr = (tr) => Object.assign(Object.create(tr), tr).setTime(Date.now());

/**
 * ED-14584: Util to check if the current node is a paragraph & the content being
 * inserted is a valid child of the grandparent node
 * In this case, the node being inserted to should split
 *
 * @param {NodeType} parentNodeType
 * @param {NodeType} grandParentNodeType
 * @param {PMNode} content
 * @returns {boolean}
 */
export const shouldSplitSelectedNodeOnNodeInsertion = (parentNodeType, grandParentNodeType, content) => {
    if (parentNodeType.name === "paragraph" && grandParentNodeType.validContent(Fragment.from(content))) {
        return true;
    }
    return false;
};

/**
 * @param {Transaction} tr
 * @param {number} nodeLength
 */
const finaliseInsert = (tr, nodeLength) => {
    const lastStep = tr.steps[tr.steps.length - 1];
    if (!(lastStep instanceof ReplaceStep || lastStep instanceof ReplaceAroundStep)) {
        return null;
    }

    // Place gap cursor after the newly inserted node
    const gapCursorPos = lastStep.to + lastStep.slice.openStart + nodeLength;
    return tr.setSelection(new GapCursorSelection(tr.doc.resolve(gapCursorPos), Side.RIGHT)).scrollIntoView();
};

/**
 * FIXME: A more sustainable and configurable way to choose when to split
 * @param {NodeType} nodeType
 * @param {Record<string, NodeType>} schemaNodes
 */
const shouldSplit = (nodeType, schemaNodes) => {
    return [schemaNodes.bulletList, schemaNodes.orderedList, schemaNodes.panel].includes(nodeType);
};

/**
 * @param {Transaction} tr
 * @param {LookDirection[keyof LookDirection]} lookDirection
 * @param {ResolvedPos} $parentPos
 * @param {ResolvedPos} $proposedPosition
 * @param {InsertableContent} content
 */
const insertBeforeOrAfter = (tr, lookDirection, $parentPos, $proposedPosition, content) => {
    /**
     * This block caters for the first item in a parent with the cursor being at the very start
     * or the last item with the cursor being at the very end
     *
     * e.g.
     * ul
     *  li {<>}Scenario one
     *  li
     *  li Scenario two{<>}
     */

    if (
        (isFirstChild($proposedPosition, tr.doc) && lookDirection === LookDirection.Before) ||
        (isLastChild($proposedPosition, tr.doc) && lookDirection === LookDirection.After)
    ) {
        return tr.insert($parentPos[lookDirection](), content);
    }

    return tr.insert($proposedPosition[lookDirection](), content);
};
