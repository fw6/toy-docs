import { findParentNode } from "@tiptap/core";
import { PROBLEM_TYPES } from "../helpers/enums";
import { TableMap } from "../helpers/table-map";
import { FIX_TABLES__KEY } from "../plugins/keys";
import { tableNodeTypes } from "./node-types";
import { removeColSpan } from "./spaning";
import { cloneTr } from "./transforms";

/**
 * @param {ResolvedPos} $a
 * @param {ResolvedPos} $b
 */
export function inSameTable($a, $b) {
    return $a.depth === $b.depth && $a.pos >= $b.start(-1) && $a.pos <= $b.end(-1);
}

/**
 * @param {import('@tiptap/pm/state').Selection} selection
 */
export function isInTable(selection) {
    const { $head } = selection;
    for (let d = $head.depth; d > 0; d--) {
        if ($head.node(d).type.spec.tableRole === "row") {
            return true;
        }
    }
    return false;
}

/**
 * Helper for iterating through the nodes in a document that changed
 * compared to the given previous document. Useful for avoiding
 * duplicate work on each transaction.
 *
 * @param {PMNode} old
 * @param {PMNode} cur
 * @param {number} offsetStart
 * @param {(child: PMNode, offset: number) => void} f
 */
function changedDescendants(old, cur, offsetStart, f) {
    let offset = offsetStart;
    const oldSize = old.childCount;
    const curSize = cur.childCount;
    outer: for (let i = 0, j = 0; i < curSize; i++) {
        const child = cur.child(i);
        for (let scan = j, e = Math.min(oldSize, i + 3); scan < e; scan++) {
            if (old.child(scan) === child) {
                j = scan + 1;
                offset += child.nodeSize;
                // eslint-disable-next-line no-continue
                continue outer;
            }
        }
        f(child, offset);
        if (j < oldSize && old.child(j).sameMarkup(child)) {
            changedDescendants(old.child(j), child, offset + 1, f);
        } else {
            child.nodesBetween(0, child.content.size, f, offset + 1);
        }
        offset += child.nodeSize;
    }
}

/**
 * :: (EditorState, ?EditorState) → ?Transaction
 * Inspect all tables in the given state's document and return a
 * transaction that fixes them, if necessary. If `oldState` was
 * provided, that is assumed to hold a previous, known-good state,
 * which will be used to avoid re-scanning unchanged parts of the
 * document.
 *
 * @param {EditorState} state
 * @param {EditorState} [oldState]
 */
export function fixTables(state, oldState) {
    /** @type {Transaction | undefined} */
    let tr;
    /**
     * @param {PMNode} node
     * @param {number} pos
     */
    const check = (node, pos) => {
        if (node.type.spec.tableRole === "table") {
            tr = fixTable(state, node, pos, tr);
        }
    };
    if (!oldState) {
        state.doc.descendants(check);
    } else if (oldState.doc !== state.doc) {
        changedDescendants(oldState.doc, state.doc, 0, check);
    }
    return tr;
}

/**
 * : (EditorState, Node, number, ?Transaction) → ?Transaction
 * Fix the given table, if necessary. Will append to the transaction
 * it was given, if non-null, or create a new one if necessary.
 *
 * @param {EditorState} state
 * @param {PMNode} table
 * @param {number} tablePos
 * @param {Transaction | undefined} transaction
 */
export function fixTable(state, table, tablePos, transaction) {
    let tr = transaction;
    const map = TableMap.get(table);
    if (!map.problems) {
        return tr;
    }

    if (!tr) {
        tr = state.tr;
    }

    // Track which rows we must add cells to, so that we can adjust that
    // when fixing collisions.
    const mustAdd = [];
    for (let i = 0; i < map.height; i++) {
        mustAdd.push(0);
    }
    for (let i = 0; i < map.problems.length; i++) {
        const prob = map.problems[i];
        if (prob.type === PROBLEM_TYPES.COLLISION) {
            /** @type {import("../helpers/table-map").TableProblemCollision} */
            const collision = prob;

            const cell = table.nodeAt(prob.pos);
            if (!cell) {
                throw new Error(`fixTable: unable to find cell at pos ${prob.pos}`);
            }
            for (let j = 0; j < cell.attrs.rowspan; j++) {
                mustAdd[collision.row + j] += collision.n;
            }
            tr.setNodeMarkup(
                tr.mapping.map(tablePos + 1 + prob.pos),
                undefined,
                removeColSpan(cell.attrs, cell.attrs.colspan - collision.n, collision.n),
            );
        } else if (prob.type === PROBLEM_TYPES.MISSING) {
            const missing = prob;
            mustAdd[missing.row] += missing.n;
        } else if (prob.type === PROBLEM_TYPES.OVERLONG_ROWSPAN) {
            const overlong = prob;
            const cell = table.nodeAt(overlong.pos);
            if (!cell) {
                throw new Error(`fixTable: unable to find cell at pos ${prob.pos}`);
            }
            tr.setNodeMarkup(tr.mapping.map(tablePos + 1 + overlong.pos), undefined, {
                ...cell.attrs,
                rowspan: cell.attrs.rowspan - overlong.n,
            });
        } else if (prob.type === PROBLEM_TYPES.COLWIDTH_MISMATCH) {
            const cell = table.nodeAt(prob.pos);
            if (!cell) {
                throw new Error(`fixTable: unable to find cell at pos ${prob.pos}`);
            }
            tr.setNodeMarkup(tr.mapping.map(tablePos + 1 + prob.pos), undefined, {
                ...cell.attrs,
                colwidth: prob.colwidth,
            });
        }
    }
    let first;
    let last;
    for (let i = 0; i < mustAdd.length; i++) {
        if (mustAdd[i]) {
            if (first == null) {
                first = i;
            }
            last = i;
        }
    }
    // Add the necessary cells, using a heuristic for whether to add the
    // cells at the start or end of the rows (if it looks like a 'bite'
    // was taken out of the table, add cells at the start of the row
    // after the bite. Otherwise add them at the end).
    for (let i = 0, pos = tablePos + 1; i < map.height; i++) {
        const row = table.child(i);
        const end = pos + row.nodeSize;
        const add = mustAdd[i];
        if (add > 0) {
            let tableNodeType = "cell";
            if (row.firstChild) {
                tableNodeType = row.firstChild.type.spec.tableRole;
            }
            /** @type {PMNode[]} */
            const nodes = [];
            for (let j = 0; j < add; j++) {
                const newNode = tableNodeTypes(state.schema)[tableNodeType].createAndFill();
                if (!newNode) throw new Error(`Failed to create new node for table. type: ${tableNodeType}`);
                nodes.push(newNode);
            }
            const side = (i === 0 || first === i - 1) && last === i ? pos + 1 : end - 1;
            tr.insert(tr.mapping.map(side), nodes);
        }
        pos = end;
    }
    return tr.setMeta(FIX_TABLES__KEY, { fixTables: true });
}

/**
 * @param {import('@tiptap/pm/state').Selection} selection
 * @returns {ReturnType<ReturnType<findParentNode>>}
 */
export const findTable = (selection) => findParentNode((node) => node.type.spec.tableRole === "table")(selection);

/**
 * Returns a new transaction that removes a table node if the cursor is inside of it.
 * @param {Transaction} tr
 * @returns {Transaction}
 */
export const removeTable = (tr) => {
    const { $from } = tr.selection;
    for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node.type.spec.tableRole === "table") {
            return cloneTr(tr.delete($from.before(depth), $from.after(depth)));
        }
    }

    return tr;
};
