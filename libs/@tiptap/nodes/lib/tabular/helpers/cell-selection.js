import { Fragment, Slice } from "@tiptap/pm/model";
import { Selection, TextSelection } from "@tiptap/pm/state";

import { pointsAtCell } from "../utils/cells";
import { getCellSelectionRanges } from "../utils/selection";
import { removeColSpan } from "../utils/spaning";
import { inSameTable } from "../utils/tables";
import { TableMap } from "./table-map";

/**
 * ::- A [`Selection`](http://prosemirror.net/docs/ref/#state.Selection)
 * subclass that represents a cell selection spanning part of a table.
 * With the plugin enabled, these will be created when the user
 * selects across cells, and will be drawn by giving selected cells a
 * `selectedCell` CSS class.
 *
 * @extends {Selection}
 */
export class CellSelection extends Selection {
    // :: (ResolvedPos, ?ResolvedPos)
    // A table selection is identified by its anchor and head cells. The
    // positions given to this constructor should point _before_ two
    // cells in the same table. They may be the same, to select a single
    // cell.

    /**
     * :: ResolvedPos
     * A resolved position pointing _in front of_ the anchor cell (the one
     * that doesn't move when extending the selection).
     *
     * @public
     * @readonly
     * @type {ResolvedPos}
     */
    $anchorCell;

    /**
     * :: ResolvedPos
     * A resolved position pointing in front of the head cell (the one
     * moves when extending the selection).
     *
     * @public
     * @readonly
     * @type {ResolvedPos}
     */
    $headCell;

    /**
     * @override
     * @public
     * @readonly
     * @type {boolean}
     */
    visible;

    /**
     * @param {ResolvedPos} $anchorCell
     * @param {ResolvedPos} [$headCell]
     */
    constructor($anchorCell, $headCell = $anchorCell) {
        const ranges = getCellSelectionRanges($anchorCell, $headCell);
        super(ranges[0].$from, ranges[0].$to, ranges);

        this.$anchorCell = $anchorCell;
        this.$headCell = $headCell;
        this.visible = false;
    }

    /**
     * :: () → Slice
     * Returns a rectangular slice of table rows containing the selected
     * cells.
     *
     * @override
     */
    content() {
        const table = this.$anchorCell.node(-1);
        const map = TableMap.get(table);
        const start = this.$anchorCell.start(-1);
        const rect = map.rectBetween(this.$anchorCell.pos - start, this.$headCell.pos - start);
        /** @type {Record<number, boolean>} */
        const seen = {};
        /** @type {PMNode[]} */
        const rows = [];
        for (let row = rect.top; row < rect.bottom; row++) {
            /** @type {PMNode[]} */
            const rowContent = [];
            for (let index = row * map.width + rect.left, col = rect.left; col < rect.right; col++, index++) {
                const pos = map.map[index];
                if (!seen[pos]) {
                    seen[pos] = true;
                    const cellRect = map.findCell(pos);
                    let cell = table.nodeAt(pos);
                    if (cell === null || cell === undefined) {
                        throw new Error(`No cell at position ${pos}`);
                    }
                    const extraLeft = rect.left - cellRect.left;
                    const extraRight = cellRect.right - rect.right;
                    if (extraLeft > 0 || extraRight > 0) {
                        let { attrs } = cell;
                        if (!attrs) {
                            throw new Error(`No cell at position ${pos}`);
                        }
                        if (extraLeft > 0) {
                            attrs = removeColSpan(attrs, 0, extraLeft);
                        }
                        if (extraRight > 0) {
                            attrs = removeColSpan(attrs, attrs.colspan - extraRight, extraRight);
                        }
                        if (cellRect.left < rect.left) {
                            cell = cell.type.createAndFill(attrs);
                        } else {
                            cell = cell.type.create(attrs, cell.content);
                        }
                    }
                    if (cell === null || cell === undefined) {
                        throw new Error("No cell at position after create/createAndFill");
                    }
                    if (cellRect.top < rect.top || cellRect.bottom > rect.bottom) {
                        const attrs = {
                            ...cell.attrs,
                            rowspan: Math.min(cellRect.bottom, rect.bottom) - Math.max(cellRect.top, rect.top),
                        };
                        if (cellRect.top < rect.top) {
                            cell = cell.type.createAndFill(attrs);
                        } else {
                            cell = cell.type.create(attrs, cell.content);
                        }
                    }
                    if (cell === null || cell === undefined) {
                        throw new Error("No cell at position before rowContent.push");
                    }
                    rowContent.push(cell);
                }
            }
            rows.push(table.child(row).copy(Fragment.from(rowContent)));
        }

        const fragment = this.isColSelection() && this.isRowSelection() ? table : rows;
        return new Slice(Fragment.from(fragment), 1, 1);
    }

    /**
     * @override
     * @param {PMNode} doc
     * @param {Mapping} mapping
     * @returns {Selection}
     */
    map(doc, mapping) {
        const $anchorCell = doc.resolve(mapping.map(this.$anchorCell.pos));
        const $headCell = doc.resolve(mapping.map(this.$headCell.pos));
        if (pointsAtCell($anchorCell) && pointsAtCell($headCell) && inSameTable($anchorCell, $headCell)) {
            const tableChanged = this.$anchorCell.node(-1) !== $anchorCell.node(-1);
            if (tableChanged && this.isRowSelection()) {
                return CellSelection.rowSelection($anchorCell, $headCell);
            }
            if (tableChanged && this.isColSelection()) {
                return CellSelection.colSelection($anchorCell, $headCell);
            }
            return new CellSelection($anchorCell, $headCell);
        }
        return TextSelection.between($anchorCell, $headCell);
    }

    /**
     * @override
     * @public
     * @param {Transaction} tr
     * @param {Slice} content
     */
    replace(tr, content = Slice.empty) {
        const mapFrom = tr.steps.length;
        const { ranges } = this;
        for (let i = 0; i < ranges.length; i++) {
            const { $from, $to } = ranges[i];
            const mapping = tr.mapping.slice(mapFrom);
            tr.replace(mapping.map($from.pos), mapping.map($to.pos), i ? Slice.empty : content);
        }
        const sel = Selection.findFrom(tr.doc.resolve(tr.mapping.slice(mapFrom).map(this.to)), -1);
        if (sel) {
            tr.setSelection(sel);
        }
    }

    /**
     * @override
     * @public
     * @param {Transaction} tr
     * @param {PMNode} node
     */
    replaceWith(tr, node) {
        this.replace(tr, new Slice(Fragment.from(node), 0, 0));
    }

    /**
     * @public
     * @param {(node: PMNode, pos: number) => void} f
     */
    forEachCell(f) {
        const table = this.$anchorCell.node(-1);
        const map = TableMap.get(table);
        const start = this.$anchorCell.start(-1);
        const cells = map.cellsInRect(map.rectBetween(this.$anchorCell.pos - start, this.$headCell.pos - start));
        for (let i = 0; i < cells.length; i++) {
            const cell = table.nodeAt(cells[i]);
            if (cell === null || cell === undefined) {
                throw new Error(`undefined cell at pos ${cells[i]}`);
            }
            f(cell, start + cells[i]);
        }
    }

    /**
     * @override
     * @param {Selection} other
     */
    eq(other) {
        return (
            other instanceof CellSelection &&
            other.$anchorCell.pos === this.$anchorCell.pos &&
            other.$headCell.pos === this.$headCell.pos
        );
    }

    /**
     * :: () → bool
     * True if this selection goes all the way from the top to the
     * bottom of the table.
     */
    isColSelection() {
        if (!this.$anchorCell || !this.$headCell) {
            throw new Error("invalid $anchorCell or $headCell");
        }

        const anchorTop = this.$anchorCell.index(-1);
        const headTop = this.$headCell.index(-1);
        if (Math.min(anchorTop, headTop) > 0) {
            return false;
        }
        const anchorNodeAfter = this.$anchorCell.nodeAfter;
        const headNodeAfter = this.$headCell.nodeAfter;
        if (!(anchorNodeAfter && headNodeAfter)) return false;

        const anchorBot = anchorTop + anchorNodeAfter.attrs.rowspan;
        const headBot = headTop + headNodeAfter.attrs.rowspan;
        return Math.max(anchorBot, headBot) === this.$headCell.node(-1).childCount;
    }

    /**
     * :: (ResolvedPos, ?ResolvedPos) → CellSelection
     * Returns the smallest column selection that covers the given anchor
     * and head cell.
     *
     * @public
     * @static
     *
     * @param {ResolvedPos} $anchorCell
     * @param {ResolvedPos | undefined} $headCell
     */
    static colSelection($anchorCell, $headCell = $anchorCell) {
        let $calculatedAnchorCell = $anchorCell;
        let $calculatedHeadCell = $headCell;

        const map = TableMap.get($calculatedAnchorCell.node(-1));
        const start = $calculatedAnchorCell.start(-1);
        const anchorRect = map.findCell($calculatedAnchorCell.pos - start);
        const headRect = map.findCell($calculatedHeadCell.pos - start);
        const doc = $calculatedAnchorCell.node(0);
        if (anchorRect.top <= headRect.top) {
            if (anchorRect.top > 0) {
                $calculatedAnchorCell = doc.resolve(start + map.map[anchorRect.left]);
            }
            if (headRect.bottom < map.height) {
                $calculatedHeadCell = doc.resolve(start + map.map[map.width * (map.height - 1) + headRect.right - 1]);
            }
        } else {
            if (headRect.top > 0) {
                $calculatedHeadCell = doc.resolve(start + map.map[headRect.left]);
            }
            if (anchorRect.bottom < map.height) {
                $calculatedAnchorCell = doc.resolve(
                    start + map.map[map.width * (map.height - 1) + anchorRect.right - 1],
                );
            }
        }
        return new CellSelection($calculatedAnchorCell, $calculatedHeadCell);
    }

    /**
     * :: () → bool
     * True if this selection goes all the way from the left to the
     * right of the table.
     *
     * @public
     */
    isRowSelection() {
        if (!this.$anchorCell || !this.$headCell) {
            return false;
        }

        const map = TableMap.get(this.$anchorCell.node(-1));
        const start = this.$anchorCell.start(-1);
        const anchorLeft = map.colCount(this.$anchorCell.pos - start);
        const headLeft = map.colCount(this.$headCell.pos - start);
        if (Math.min(anchorLeft, headLeft) > 0) {
            return false;
        }
        const anchorNodeAfter = this.$anchorCell.nodeAfter;
        const headNodeAfter = this.$headCell.nodeAfter;
        if (!(anchorNodeAfter && headNodeAfter)) return false;

        const anchorRight = anchorLeft + anchorNodeAfter.attrs.colspan;
        const headRight = headLeft + headNodeAfter.attrs.colspan;
        return Math.max(anchorRight, headRight) === map.width;
    }

    /**
     * :: (ResolvedPos, ?ResolvedPos) → CellSelection
     * Returns the smallest row selection that covers the given anchor
     * and head cell.
     *
     * @public
     * @static
     *
     * @param {ResolvedPos} $anchorCell
     * @param {ResolvedPos} $headCell
     */
    static rowSelection($anchorCell, $headCell = $anchorCell) {
        let $calculatedAnchorCell = $anchorCell;
        let $calculatedHeadCell = $headCell;
        const map = TableMap.get($calculatedAnchorCell.node(-1));
        const start = $calculatedAnchorCell.start(-1);
        const anchorRect = map.findCell($calculatedAnchorCell.pos - start);
        const headRect = map.findCell($calculatedHeadCell.pos - start);
        const doc = $calculatedAnchorCell.node(0);
        if (anchorRect.left <= headRect.left) {
            if (anchorRect.left > 0) {
                $calculatedAnchorCell = doc.resolve(start + map.map[anchorRect.top * map.width]);
            }
            if (headRect.right < map.width) {
                $calculatedHeadCell = doc.resolve(start + map.map[map.width * (headRect.top + 1) - 1]);
            }
        } else {
            if (headRect.left > 0) {
                $calculatedHeadCell = doc.resolve(start + map.map[headRect.top * map.width]);
            }
            if (anchorRect.right < map.width) {
                $calculatedAnchorCell = doc.resolve(start + map.map[map.width * (anchorRect.top + 1) - 1]);
            }
        }
        return new CellSelection($calculatedAnchorCell, $calculatedHeadCell);
    }

    /**
     * @public
     * @static
     * @returns {SerializedCellSelection}
     */
    toJSON() {
        return {
            type: "cell",
            anchor: this.$anchorCell.pos,
            head: this.$headCell.pos,
        };
    }

    /**
     * @override
     * @public
     * @static
     * @param {PMNode} doc
     * @param {SerializedCellSelection} json
     *
     * @returns {Selection}
     */
    static fromJSON(doc, json) {
        return new CellSelection(doc.resolve(json.anchor), doc.resolve(json.head));
    }

    /**
     * :: (Node, number, ?number) → CellSelection
     *
     * @public
     * @static
     *
     * @param {PMNode} doc
     * @param {number} anchorCell
     * @param {number} headCell
     */
    static create(doc, anchorCell, headCell = anchorCell) {
        return new CellSelection(doc.resolve(anchorCell), doc.resolve(headCell));
    }

    /**
     * @override
     * @public
     *
     * @returns {SelectionBookmark}
     */
    getBookmark() {
        return new CellBookmark(this.$anchorCell.pos, this.$headCell.pos);
    }
}

Selection.jsonID("cell", CellSelection);

/**
 * @implements {SelectionBookmark}
 */
export class CellBookmark {
    /**
     * @readonly
     * @public
     * @type {number}
     */
    anchor;

    /**
     * @readonly
     * @public
     * @type {number}
     */
    head;

    /**
     * @constructor
     * @param {number} anchor
     * @param {number} head
     */
    constructor(anchor, head) {
        this.anchor = anchor;
        this.head = head;
    }

    /**
     * @public
     * @param {Mappable} mapping
     *
     * @returns {SelectionBookmark}
     */
    map(mapping) {
        return new CellBookmark(mapping.map(this.anchor), mapping.map(this.head));
    }

    /**
     * @param {PMNode} doc
     */
    resolve(doc) {
        const $anchorCell = doc.resolve(this.anchor);
        const $headCell = doc.resolve(this.head);

        if (
            $anchorCell.parent.type.spec.tableRole === "row" &&
            $headCell.parent.type.spec.tableRole === "row" &&
            $anchorCell.index() < $anchorCell.parent.childCount &&
            $headCell.index() < $headCell.parent.childCount &&
            inSameTable($anchorCell, $headCell)
        ) {
            /** @type {SerializedCellSelection} */
            const data = {
                type: "cell",
                anchor: $anchorCell.pos,
                head: $headCell.pos,
            };
            return Selection.fromJSON(doc, data);
        }

        return Selection.near($headCell, 1);
    }
}
